from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.core.auth import AuthenticatedUser, require_child_access
from app.core.database import engine
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import (
    ForgotPasswordIn,
    LoginIn,
    ProfileUpdateIn,
    RegisterIn,
    ResetPasswordIn,
)


router = APIRouter(tags=["Auth & Profile"])


def _age_band(age: int) -> str:
    if age <= 7:
        return "5-7"
    if age <= 11:
        return "8-11"
    if age <= 15:
        return "12-15"
    return "16-18"


def _auth_response(user: Any, child: Any) -> dict[str, Any]:
    return {
        "success": True,
        "user_id": user["id"],
        "child_id": child["id"],
        "username": user["username"],
        "email": user["email"],
        "display_name": child["display_name"] or user["username"],
        "avatar": child["avatar"] or user["avatar"] or "hornbill",
        "age": child["age"] or user["age"] or 10,
        "xp": child["xp"] or 0,
        "level": child["level"] or 1,
        "access_token": create_access_token(user["id"], child["id"]),
        "token_type": "bearer",
    }


@router.post("/api/v1/auth/register")
def register(payload: RegisterIn):
    username = payload.username.strip()
    email = payload.email.strip().lower()
    try:
        with engine.begin() as connection:
            if connection.execute(
                text("SELECT id FROM users WHERE lower(username)=lower(:value)"), {"value": username}
            ).first():
                raise HTTPException(400, "That username is already taken. Try another one.")
            if connection.execute(
                text("SELECT id FROM users WHERE lower(email)=lower(:value)"), {"value": email}
            ).first():
                raise HTTPException(400, "An account with this email address already exists.")

            user = connection.execute(
                text("""INSERT INTO users
                    (role, created_at, username, email, password_hash, age, avatar)
                    VALUES ('child', :created_at, :username, :email, :password_hash, :age, :avatar)
                    RETURNING id, username, email, age, avatar"""),
                {
                    "created_at": datetime.now(timezone.utc),
                    "username": username,
                    "email": email,
                    "password_hash": hash_password(payload.password),
                    "age": payload.age,
                    "avatar": payload.avatar,
                },
            ).mappings().one()
            child = connection.execute(
                text("""INSERT INTO child_profiles
                    (parent_user_id, display_name, age_band, xp, level, safety_briefing_done,
                     learning_streak, avatar, age)
                    VALUES (:user_id, :display_name, :age_band, 0, 1, :safety, 0, :avatar, :age)
                    RETURNING id, display_name, xp, level, avatar, age"""),
                {
                    "user_id": user["id"],
                    "display_name": username,
                    "age_band": _age_band(payload.age),
                    "safety": False,
                    "avatar": payload.avatar,
                    "age": payload.age,
                },
            ).mappings().one()
    except IntegrityError as error:
        raise HTTPException(400, "That username or email is already registered.") from error

    return {**_auth_response(user, child), "message": "Account created successfully!"}


@router.post("/api/v1/auth/login")
def login(payload: LoginIn):
    query = payload.username_or_email.strip()
    with engine.begin() as connection:
        user = connection.execute(
            text("""SELECT id, username, email, password_hash, age, avatar
                    FROM users WHERE lower(username)=lower(:query) OR lower(email)=lower(:query)"""),
            {"query": query},
        ).mappings().first()
        valid, needs_upgrade = verify_password(payload.password, (user or {}).get("password_hash") or "")
        if not user or not valid:
            raise HTTPException(401, "Invalid username or password. Please try again.")
        if needs_upgrade:
            connection.execute(
                text("UPDATE users SET password_hash=:password_hash WHERE id=:id"),
                {"password_hash": hash_password(payload.password), "id": user["id"]},
            )
        child = connection.execute(
            text("""SELECT id, display_name, xp, level, avatar, age
                    FROM child_profiles WHERE parent_user_id=:user_id LIMIT 1"""),
            {"user_id": user["id"]},
        ).mappings().first()
        if not child:
            raise HTTPException(401, "This account does not have an explorer profile.")

    return {**_auth_response(user, child), "message": "Login successful!"}


@router.post("/api/v1/auth/forgot-password")
def forgot_password(payload: ForgotPasswordIn):
    email = payload.email.strip().lower()
    with engine.begin() as connection:
        user = connection.execute(
            text("SELECT id FROM users WHERE lower(email)=lower(:email)"), {"email": email}
        ).mappings().first()
        if not user:
            raise HTTPException(400, "No RimbaQuest account was found for this email.")
        token = f"RESET-{user['id']}-{int(time.time()) + 15 * 60}"
        connection.execute(
            text("UPDATE users SET recovery_token=:token WHERE id=:id"),
            {"token": token, "id": user["id"]},
        )
    return {
        "success": True,
        "message": "Password recovery instructions generated.",
        "simulated_token": token,
    }


@router.post("/api/v1/auth/reset-password")
def reset_password(payload: ResetPasswordIn):
    email = payload.email.strip().lower()
    token = payload.recovery_token.strip()
    with engine.begin() as connection:
        user = connection.execute(
            text("SELECT id, recovery_token FROM users WHERE lower(email)=lower(:email)"),
            {"email": email},
        ).mappings().first()
        if not user:
            raise HTTPException(404, "No account found with this email.")
        stored = user["recovery_token"] or ""
        try:
            expired = time.time() > int(stored.rsplit("-", 1)[-1])
        except ValueError:
            expired = True
        if not stored or stored != token or expired:
            raise HTTPException(400, "Invalid or expired recovery code.")
        connection.execute(
            text("UPDATE users SET password_hash=:password_hash, recovery_token=NULL WHERE id=:id"),
            {"password_hash": hash_password(payload.new_password), "id": user["id"]},
        )
    return {"success": True, "message": "Your password has been successfully reset! You can now log in."}


def _profile(child_id: int) -> dict[str, Any]:
    with engine.connect() as connection:
        child = connection.execute(
            text("""SELECT child_profiles.id, child_profiles.parent_user_id,
                           users.username, users.email, child_profiles.display_name, child_profiles.age,
                           child_profiles.age_band, child_profiles.xp, child_profiles.level,
                           child_profiles.avatar
                    FROM child_profiles JOIN users ON users.id=child_profiles.parent_user_id
                    WHERE child_profiles.id=:id"""),
            {"id": child_id},
        ).mappings().first()
        if not child:
            raise HTTPException(404, "Child profile not found")
        unique_cards = connection.execute(
            text("SELECT COUNT(DISTINCT species_id) FROM collection_entries WHERE child_id=:id"),
            {"id": child_id},
        ).scalar() or 0
        total_sightings = connection.execute(
            text("SELECT COUNT(*) FROM sightings WHERE child_id=:id AND status='confirmed'"),
            {"id": child_id},
        ).scalar() or 0
    return {
        "id": child["id"],
        "username": child["username"],
        "email": child["email"],
        "display_name": child["display_name"] or child["username"],
        "avatar": child["avatar"] or "hornbill",
        "age": child["age"] or 10,
        "age_band": child["age_band"] or "8-11",
        "xp": child["xp"] or 0,
        "level": child["level"] or 1,
        "unique_cards": unique_cards,
        "total_sightings": total_sightings,
    }


@router.get("/api/v1/children/{child_id}/profile")
def get_child_profile(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    return _profile(child_id)


@router.put("/api/v1/children/{child_id}/profile")
def update_child_profile(
    child_id: int,
    payload: ProfileUpdateIn,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.begin() as connection:
        child = connection.execute(
            text("SELECT id, parent_user_id FROM child_profiles WHERE id=:id"), {"id": child_id}
        ).mappings().first()
        if not child:
            raise HTTPException(404, "Child profile not found")
        updates: list[str] = []
        params: dict[str, Any] = {"id": child_id}
        if payload.username is not None:
            duplicate = connection.execute(
                text("SELECT id FROM users WHERE lower(username)=lower(:username) AND id!=:user_id"),
                {"username": payload.username, "user_id": child["parent_user_id"]},
            ).first()
            if duplicate:
                raise HTTPException(400, "That username is already taken. Try another one.")
            updates.append("display_name=:display_name")
            params["display_name"] = payload.username
        if payload.avatar is not None:
            updates.append("avatar=:avatar")
            params["avatar"] = payload.avatar.strip()
        if payload.age is not None:
            updates.extend(["age=:age", "age_band=:age_band"])
            params.update({"age": payload.age, "age_band": _age_band(payload.age)})
        if updates:
            connection.execute(text(f"UPDATE child_profiles SET {', '.join(updates)} WHERE id=:id"), params)
            user_updates = {key: params[key] for key in ("avatar", "age") if key in params}
            if payload.username is not None:
                user_updates["username"] = payload.username
            if user_updates:
                assignments = ", ".join(f"{key}=:{key}" for key in user_updates)
                connection.execute(
                    text(f"UPDATE users SET {assignments} WHERE id=:user_id"),
                    {**user_updates, "user_id": child["parent_user_id"]},
                )
    return _profile(child_id)
