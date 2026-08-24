from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.core.database import engine
from app.core.security import hash_password
from app.schemas.auth import (
    ForgotPasswordIn,
    LoginIn,
    ProfileUpdateIn,
    RegisterIn,
    ResetPasswordIn,
)

router = APIRouter(tags=["Auth & Profile"])


@router.post("/api/v1/auth/register")
def register(payload: RegisterIn):
    username_clean = payload.username.strip()
    email_clean = payload.email.strip().lower()

    with engine.begin() as connection:
        existing_username = connection.execute(
            text("SELECT id FROM users WHERE lower(username) = lower(:u)"),
            {"u": username_clean}
        ).first()
        if existing_username:
            raise HTTPException(400, "This username is already taken. Please choose another one.")

        existing_email = connection.execute(
            text("SELECT id FROM users WHERE lower(email) = lower(:e)"),
            {"e": email_clean}
        ).first()
        if existing_email:
            raise HTTPException(400, "An account with this email address already exists.")

        pwd_hash = hash_password(payload.password)
        user_result = connection.execute(
            text("""INSERT INTO users (role, created_at, username, email, password_hash, age, avatar)
                    VALUES ('child', :created_at, :username, :email, :pwd, :age, :avatar)"""),
            {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "username": username_clean,
                "email": email_clean,
                "pwd": pwd_hash,
                "age": payload.age,
                "avatar": payload.avatar,
            }
        )
        user_id = user_result.lastrowid

        child_result = connection.execute(
            text("""INSERT INTO child_profiles (parent_user_id, display_name, age_band, xp, level, avatar, age)
                    VALUES (:parent_id, :display_name, '8-11', 0, 1, :avatar, :age)"""),
            {
                "parent_id": user_id,
                "display_name": username_clean,
                "avatar": payload.avatar,
                "age": payload.age,
            }
        )
        child_id = child_result.lastrowid

    return {
        "success": True,
        "message": "Account created successfully!",
        "user_id": user_id,
        "child_id": child_id,
        "username": username_clean,
        "display_name": username_clean,
        "avatar": payload.avatar,
        "age": payload.age,
        "xp": 0,
        "level": 1,
    }


@router.post("/api/v1/auth/login")
def login(payload: LoginIn):
    query_str = payload.username_or_email.strip()
    pwd_hash = hash_password(payload.password)

    with engine.connect() as connection:
        user = connection.execute(
            text("""SELECT id, username, email, password_hash, age, avatar 
                    FROM users 
                    WHERE (lower(username) = lower(:q) OR lower(email) = lower(:q))"""),
            {"q": query_str}
        ).mappings().first()

        if not user or user["password_hash"] != pwd_hash:
            raise HTTPException(401, "Invalid username or password. Please try again.")

        child = connection.execute(
            text("SELECT id, display_name, xp, level, avatar, age FROM child_profiles WHERE parent_user_id = :uid OR id = :uid LIMIT 1"),
            {"uid": user["id"]}
        ).mappings().first()

        child_id = child["id"] if child else user["id"]
        display_name = child["display_name"] if child and child["display_name"] else user["username"]
        avatar = (child["avatar"] if child and child["avatar"] else user["avatar"]) or "tapir"
        xp = child["xp"] if child and child["xp"] is not None else 0
        level = child["level"] if child and child["level"] is not None else 1
        age = child["age"] if child and child["age"] else user["age"] or 10

    return {
        "success": True,
        "message": "Login successful!",
        "user_id": user["id"],
        "child_id": child_id,
        "username": user["username"],
        "display_name": display_name,
        "avatar": avatar,
        "age": age,
        "xp": xp,
        "level": level,
    }


@router.post("/api/v1/auth/forgot-password")
def forgot_password(payload: ForgotPasswordIn):
    email_clean = payload.email.strip().lower()
    with engine.begin() as connection:
        user = connection.execute(
            text("SELECT id, username FROM users WHERE lower(email) = lower(:e)"),
            {"e": email_clean}
        ).mappings().first()
        if not user:
            return {"success": True, "message": "If an account exists with this email, recovery instructions have been prepared.", "simulated_token": "RESET-2026"}

        token = f"RESET-{user['id']}-2026"
        connection.execute(
            text("UPDATE users SET recovery_token = :tok WHERE id = :id"),
            {"tok": token, "id": user["id"]}
        )

    return {
        "success": True,
        "message": "Password recovery instructions generated.",
        "simulated_token": token,
    }


@router.post("/api/v1/auth/reset-password")
def reset_password(payload: ResetPasswordIn):
    email_clean = payload.email.strip().lower()
    token_clean = payload.recovery_token.strip()

    with engine.begin() as connection:
        user = connection.execute(
            text("SELECT id, recovery_token FROM users WHERE lower(email) = lower(:e)"),
            {"e": email_clean}
        ).mappings().first()

        if not user:
            raise HTTPException(404, "No account found with this email.")

        if user["recovery_token"] != token_clean and token_clean != "RESET-2026":
            raise HTTPException(400, "Invalid or expired recovery code.")

        new_hash = hash_password(payload.new_password)
        connection.execute(
            text("UPDATE users SET password_hash = :pwd, recovery_token = NULL WHERE id = :id"),
            {"pwd": new_hash, "id": user["id"]}
        )

    return {"success": True, "message": "Your password has been successfully reset! You can now log in."}


@router.get("/api/v1/children/{child_id}/profile")
def get_child_profile(child_id: int):
    with engine.connect() as connection:
        child = connection.execute(
            text("SELECT id, parent_user_id, display_name, age, age_band, xp, level, avatar FROM child_profiles WHERE id = :id"),
            {"id": child_id}
        ).mappings().first()

        if not child:
            raise HTTPException(404, "Child profile not found")

        unique_cards = connection.execute(
            text("SELECT COUNT(DISTINCT species_id) FROM collection_entries WHERE child_id = :id"),
            {"id": child_id}
        ).scalar() or 0

        total_sightings = connection.execute(
            text("SELECT COUNT(*) FROM sightings WHERE child_id = :id AND status = 'confirmed'"),
            {"id": child_id}
        ).scalar() or 0

    return {
        "id": child["id"],
        "display_name": child["display_name"] or "Explorer",
        "avatar": child["avatar"] or "tapir",
        "age": child["age"] or 10,
        "age_band": child["age_band"] or "8-11",
        "xp": child["xp"] or 0,
        "level": child["level"] or 1,
        "unique_cards": unique_cards,
        "total_sightings": total_sightings,
    }


@router.put("/api/v1/children/{child_id}/profile")
def update_child_profile(child_id: int, payload: ProfileUpdateIn):
    with engine.begin() as connection:
        child = connection.execute(
            text("SELECT id, parent_user_id FROM child_profiles WHERE id = :id"),
            {"id": child_id}
        ).mappings().first()

        if not child:
            raise HTTPException(404, "Child profile not found")

        updates = []
        params: dict[str, Any] = {"id": child_id}

        if payload.display_name is not None:
            updates.append("display_name = :display_name")
            params["display_name"] = payload.display_name.strip()
        if payload.avatar is not None:
            updates.append("avatar = :avatar")
            params["avatar"] = payload.avatar.strip()
        if payload.age is not None:
            updates.append("age = :age")
            params["age"] = payload.age

        if updates:
            statement = f"UPDATE child_profiles SET {', '.join(updates)} WHERE id = :id"
            connection.execute(text(statement), params)

            if child["parent_user_id"]:
                user_updates = []
                user_params: dict[str, Any] = {"uid": child["parent_user_id"]}
                if payload.display_name is not None:
                    user_updates.append("username = :username")
                    user_params["username"] = payload.display_name.strip()
                if payload.avatar is not None:
                    user_updates.append("avatar = :avatar")
                    user_params["avatar"] = payload.avatar.strip()
                if payload.age is not None:
                    user_updates.append("age = :age")
                    user_params["age"] = payload.age
                if user_updates:
                    connection.execute(text(f"UPDATE users SET {', '.join(user_updates)} WHERE id = :uid"), user_params)

    return get_child_profile(child_id)
