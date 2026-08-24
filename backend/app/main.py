from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "RimbaQuest.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB.as_posix()}")
SEED_SQL = ROOT / "data" / "seed.sql"
IMAGE_METADATA_START = "-- BEGIN bundled species image metadata"
IMAGE_METADATA_END = "-- END bundled species image metadata"
LEARNING_DATA_START = "-- BEGIN complete Iteration 1 learning data"
LEARNING_DATA_END = "-- END complete Iteration 1 learning data"


def database_path() -> Path:
    if DATABASE_URL.startswith("sqlite:///"):
        return Path(DATABASE_URL.removeprefix("sqlite:///"))
    raise RuntimeError("Iteration 1 only supports SQLite DATABASE_URL values")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def calculate_battle_stats(species_id: str, category: str) -> dict[str, Any]:
    """Deterministic battle stats for Iteration 1 cards.
    
    Category archetypes:
    - Mammal: High HP, Balanced Attack
    - Reptile: Highest HP, Heavy Attack
    - Bird: Fast, High Attack, Medium HP
    - Butterfly: Elemental/Evasive, Highest Attack, Low HP
    """
    cat = (category or "").capitalize()
    # Simple stable hash based on species_id for slight variety
    val = sum(ord(c) for c in species_id) % 15
    if cat == "Mammal":
        base_hp = 120 + val
        base_atk = 24 + (val % 6)
        abilities = ["Swift Pounce", "Wild Roar", "Guardian Guard"]
    elif cat == "Reptile":
        base_hp = 140 + val
        base_atk = 22 + (val % 5)
        abilities = ["Iron Scales", "Venom Strike", "Ambush Snap"]
    elif cat == "Bird":
        base_hp = 95 + val
        base_atk = 30 + (val % 7)
        abilities = ["Aerial Dive", "Sharp Talon", "Sonic Cry"]
    elif cat == "Butterfly":
        base_hp = 75 + val
        base_atk = 34 + (val % 8)
        abilities = ["Toxic Powder", "Dazzle Flutter", "Nectar Heal"]
    else:
        base_hp = 100 + val
        base_atk = 25 + (val % 5)
        abilities = ["Basic Tackle", "Defend", "Focus Strike"]

    return {
        "hp": base_hp,
        "base_attack": base_atk,
        "category": cat,
        "ability_1": abilities[0],
        "ability_2": abilities[1],
        "ability_3": abilities[2],
        "abilities_locked": True,  # Unlocked in Iteration 2 via quizzes
    }


def initialise_database() -> None:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        with sqlite3.connect(path) as connection:
            connection.executescript(SEED_SQL.read_text(encoding="utf-8"))


def apply_seed_block(start_marker: str, end_marker: str) -> None:
    seed = SEED_SQL.read_text(encoding="utf-8")
    if start_marker not in seed or end_marker not in seed:
        return
    start = seed.index(start_marker)
    end = seed.index(end_marker, start) + len(end_marker)
    try:
        with sqlite3.connect(database_path()) as connection:
            connection.executescript(seed[start:end])
    except sqlite3.OperationalError as error:
        if "readonly" not in str(error).lower():
            raise


def migrate_schema() -> None:
    """Ensure all required columns and default data exist across restarts/persistent disks."""
    try:
        with sqlite3.connect(database_path()) as connection:
            # Check users table
            user_cols = {row[1] for row in connection.execute("PRAGMA table_info(users)")}
            if "username" not in user_cols:
                connection.execute("ALTER TABLE users ADD COLUMN username VARCHAR")
            if "email" not in user_cols:
                connection.execute("ALTER TABLE users ADD COLUMN email VARCHAR")
            if "password_hash" not in user_cols:
                connection.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR")
            if "age" not in user_cols:
                connection.execute("ALTER TABLE users ADD COLUMN age INTEGER")
            if "avatar" not in user_cols:
                connection.execute("ALTER TABLE users ADD COLUMN avatar VARCHAR DEFAULT 'tapir'")
            if "recovery_token" not in user_cols:
                connection.execute("ALTER TABLE users ADD COLUMN recovery_token VARCHAR")

            # Check child_profiles table
            child_cols = {row[1] for row in connection.execute("PRAGMA table_info(child_profiles)")}
            if "avatar" not in child_cols:
                connection.execute("ALTER TABLE child_profiles ADD COLUMN avatar VARCHAR DEFAULT 'tapir'")
            if "age" not in child_cols:
                connection.execute("ALTER TABLE child_profiles ADD COLUMN age INTEGER DEFAULT 10")

            # Check sightings table
            sighting_cols = {row[1] for row in connection.execute("PRAGMA table_info(sightings)")}
            if "recorded_at" not in sighting_cols:
                connection.execute("ALTER TABLE sightings ADD COLUMN recorded_at DATETIME")
            if "location_label" not in sighting_cols:
                connection.execute("ALTER TABLE sightings ADD COLUMN location_label VARCHAR")
            if "photo_url" not in sighting_cols:
                connection.execute("ALTER TABLE sightings ADD COLUMN photo_url VARCHAR")
            if "notes" not in sighting_cols:
                connection.execute("ALTER TABLE sightings ADD COLUMN notes TEXT")
            connection.execute("UPDATE sightings SET recorded_at = COALESCE(recorded_at, CURRENT_TIMESTAMP)")

            # Check locations table
            loc_cols = {row[1] for row in connection.execute("PRAGMA table_info(locations)")}
            if "area" not in loc_cols:
                connection.execute("ALTER TABLE locations ADD COLUMN area VARCHAR")
            if "typical_wildlife" not in loc_cols:
                connection.execute("ALTER TABLE locations ADD COLUMN typical_wildlife VARCHAR")

            # Ensure default user & child profile exist for immediate offline / guest play
            user_exists = connection.execute("SELECT id FROM users WHERE id = 1").fetchone()
            if not user_exists:
                connection.execute(
                    "INSERT INTO users (id, role, created_at, username, email, password_hash, age, avatar) "
                    "VALUES (1, 'child', CURRENT_TIMESTAMP, 'aisyah', 'aisyah@rimbaquest.my', :pwd, 10, 'tapir')",
                    {"pwd": hash_password("adventure123")}
                )
            else:
                connection.execute(
                    "UPDATE users SET username = COALESCE(username, 'aisyah'), "
                    "email = COALESCE(email, 'aisyah@rimbaquest.my'), "
                    "password_hash = COALESCE(password_hash, :pwd), "
                    "avatar = COALESCE(avatar, 'tapir'), age = COALESCE(age, 10) WHERE id = 1",
                    {"pwd": hash_password("adventure123")}
                )

            child_exists = connection.execute("SELECT id FROM child_profiles WHERE id = 1").fetchone()
            if not child_exists:
                connection.execute(
                    "INSERT INTO child_profiles (id, parent_user_id, display_name, age_band, xp, level, avatar, age) "
                    "VALUES (1, 1, 'Aisyah', '8-11', 200, 1, 'tapir', 10)"
                )
            else:
                connection.execute(
                    "UPDATE child_profiles SET display_name = COALESCE(display_name, 'Aisyah'), "
                    "avatar = COALESCE(avatar, 'tapir'), age = COALESCE(age, 10) WHERE id = 1"
                )

            # Update XP calculation
            connection.execute("""UPDATE child_profiles SET xp = (
                SELECT COUNT(*) * 100 FROM collection_entries
                WHERE collection_entries.child_id = child_profiles.id
            ) WHERE xp IS NULL OR xp = 0""")

            # Enrich locations with area and typical wildlife tags
            location_enrichments = [
                ("loc_bukit_gasing", "Petaling Jaya, Selangor", "Butterflies, Birds, Small Mammals"),
                ("loc_frim", "Kepong, Kuala Lumpur", "Rainforest Canopy Birds, Mammals, Butterflies"),
                ("loc_taman_negara", "Jerantut, Pahang", "Elephants, Tapirs, Hornbills, Rainforest Mammals"),
                ("loc_kuala_selangor", "Kuala Selangor, Selangor", "Mangrove Birds, Reptiles, Fireflies"),
                ("loc_bako", "Kuching, Sarawak", "Proboscis Monkeys, Flying Lemurs, Coastal Birds"),
                ("loc_cherating", "Cherating, Pahang", "Green Sea Turtles, Marine Life"),
                ("loc_per_paya_indah", "Dengkil, Selangor", "Wetland Birds, Sun Bears, Crocodiles"),
                ("loc_per_tn_penang", "Teluk Bahang, Penang", "Monkeys, Sea Eagles, Coastal Reptiles"),
                ("loc_per_kuala_gandah", "Lanchang, Pahang", "Asian Elephants, Forest Birds"),
                ("loc_per_tasek_bera", "Bera, Pahang", "Freshwater Reptiles, Wetland Birds"),
            ]
            for loc_id, area, typical in location_enrichments:
                connection.execute(
                    "UPDATE locations SET area = :area, typical_wildlife = :typical WHERE id = :id",
                    {"area": area, "typical": typical, "id": loc_id}
                )

    except sqlite3.OperationalError as error:
        if "readonly" not in str(error).lower():
            raise


initialise_database()
apply_seed_block(IMAGE_METADATA_START, IMAGE_METADATA_END)
apply_seed_block(LEARNING_DATA_START, LEARNING_DATA_END)
migrate_schema()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI(title="RimbaQuest API", version="1.1.0")
default_origins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006"
origins = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", default_origins).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def rows(result):
    return [dict(row._mapping) for row in result]


# ---------------------------------------------------------------------------
# Data Models (Pydantic)
# ---------------------------------------------------------------------------

class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    age: int = Field(ge=5, le=18)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=100)
    avatar: str = Field(default="tapir", max_length=30)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Username cannot contain spaces")
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, hyphens and underscores")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Please enter a valid email address")
        return v.lower().strip()


class LoginIn(BaseModel):
    username_or_email: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=1, max_length=100)


class ForgotPasswordIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)


class ResetPasswordIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    recovery_token: str = Field(min_length=4, max_length=50)
    new_password: str = Field(min_length=6, max_length=100)


class ProfileUpdateIn(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=30)
    avatar: str | None = Field(default=None, max_length=30)
    age: int | None = Field(default=None, ge=5, le=18)


class DiscoveryIn(BaseModel):
    species_id: str
    location_label: str = Field(min_length=2, max_length=120)
    photo_url: str | None = None
    notes: str | None = None


class BattleOutcomeIn(BaseModel):
    won: bool
    opponent_name: str = "Forest Shadow"
    rounds: int = 1


# ---------------------------------------------------------------------------
# Endpoints: System & Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "database": "sqlite", "version": "1.1.0"}


# ---------------------------------------------------------------------------
# Epic 1: Auth & Profile Management
# ---------------------------------------------------------------------------

@app.post("/api/v1/auth/register")
def register(payload: RegisterIn):
    username_clean = payload.username.strip()
    email_clean = payload.email.strip().lower()

    with engine.begin() as connection:
        # Check username uniqueness
        existing_username = connection.execute(
            text("SELECT id FROM users WHERE lower(username) = lower(:u)"),
            {"u": username_clean}
        ).first()
        if existing_username:
            raise HTTPException(400, "This username is already taken. Please choose another one.")

        # Check email uniqueness
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

        # Create child profile
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


@app.post("/api/v1/auth/login")
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


@app.post("/api/v1/auth/forgot-password")
def forgot_password(payload: ForgotPasswordIn):
    email_clean = payload.email.strip().lower()
    with engine.begin() as connection:
        user = connection.execute(
            text("SELECT id, username FROM users WHERE lower(email) = lower(:e)"),
            {"e": email_clean}
        ).mappings().first()
        if not user:
            # Return uniform success message for privacy/security
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


@app.post("/api/v1/auth/reset-password")
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


@app.get("/api/v1/children/{child_id}/profile")
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


@app.put("/api/v1/children/{child_id}/profile")
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

            # Keep users table synced if parent_user_id exists
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


# ---------------------------------------------------------------------------
# Epic 2: Wildlife Locations (KL / Klang Valley & Malaysia MVP)
# ---------------------------------------------------------------------------

@app.get("/api/v1/locations")
def list_locations(
    query: str | None = Query(default=None, description="Search keyword matching name, area or description"),
    category: str | None = Query(default=None, description="Filter by typical wildlife category (Mammals, Birds, Butterflies, Reptiles)")
):
    statement = "SELECT id, name, type, area, lat, lng, verified, description, facilities, best_time, distance_km, why_recommended, typical_wildlife FROM locations"
    clauses = []
    params: dict[str, Any] = {}

    if query and query.strip():
        clauses.append("(lower(name) LIKE :q OR lower(area) LIKE :q OR lower(description) LIKE :q)")
        params["q"] = f"%{query.strip().lower()}%"

    if category and category.strip() and category.lower() != "all":
        cat_search = category.rstrip("s").lower()
        clauses.append("(lower(typical_wildlife) LIKE :cat OR lower(description) LIKE :cat)")
        params["cat"] = f"%{cat_search}%"

    if clauses:
        statement += " WHERE " + " AND ".join(clauses)

    statement += " ORDER BY distance_km ASC, name ASC"

    with engine.connect() as connection:
        items = rows(connection.execute(text(statement), params))

    # Parse facilities JSON strings into arrays for client convenience
    for item in items:
        if isinstance(item.get("facilities"), str):
            try:
                item["facilities"] = json.loads(item["facilities"])
            except Exception:
                item["facilities"] = []

    return {"items": items, "total": len(items)}


@app.get("/api/v1/locations/{location_id}")
def get_location(location_id: str):
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT * FROM locations WHERE id = :id"),
            {"id": location_id}
        ).mappings().first()

    if not row:
        raise HTTPException(404, "Location not found")

    item = dict(row)
    if isinstance(item.get("facilities"), str):
        try:
            item["facilities"] = json.loads(item["facilities"])
        except Exception:
            item["facilities"] = []
    return item


# ---------------------------------------------------------------------------
# Epic 3 & 4: Species, Discoveries, Collection & Gallery
# ---------------------------------------------------------------------------

@app.get("/api/v1/species")
def list_species(category: str | None = None):
    statement = "SELECT id, common_name, scientific_name, category, habitat, diet, fun_fact, image_url, act716_schedule, act716_status FROM species"
    params = {}
    if category and category.lower() != "all":
        statement += " WHERE lower(category) = lower(:category)"
        params["category"] = category.rstrip("s")
    statement += " ORDER BY common_name"
    with engine.connect() as connection:
        items = rows(connection.execute(text(statement), params))

    for item in items:
        stats = calculate_battle_stats(item["id"], item["category"])
        item.update(stats)

    return items


@app.get("/api/v1/species/{species_id}")
def get_species(species_id: str):
    with engine.connect() as connection:
        row = connection.execute(text("SELECT * FROM species WHERE id = :id"), {"id": species_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Species not found")
    item = dict(row)
    stats = calculate_battle_stats(item["id"], item["category"])
    item.update(stats)
    return item


@app.get("/api/v1/species/{species_id}/quiz")
def get_species_quiz(species_id: str):
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT questions_json FROM quizzes WHERE species_id=:id ORDER BY version DESC LIMIT 1"),
            {"id": species_id}
        ).mappings().first()
    if not row:
        raise HTTPException(404, "Quiz not found")
    return {"species_id": species_id, "questions": row["questions_json"]}


@app.post("/api/v1/children/{child_id}/discoveries")
def create_discovery(child_id: int, payload: DiscoveryIn):
    """Persist confirmed observation, unlock Wildlife Card, award +100 Explorer XP on first discovery."""
    with engine.begin() as connection:
        if not connection.execute(text("SELECT 1 FROM child_profiles WHERE id=:id"), {"id": child_id}).first():
            raise HTTPException(404, "Child profile not found")

        species = connection.execute(
            text("SELECT id, sensitive, common_name, category FROM species WHERE id=:id"),
            {"id": payload.species_id}
        ).mappings().first()

        if not species:
            raise HTTPException(404, "Species not found")

        now_iso = datetime.now(timezone.utc).isoformat()
        connection.execute(text("""INSERT INTO sightings
            (child_id, species_id, status, sensitive_species, recorded_at, location_label, photo_url, notes)
            VALUES (:child, :species, 'confirmed', :sensitive, :recorded_at, :location, :photo, :notes)"""), {
            "child": child_id,
            "species": payload.species_id,
            "sensitive": bool(species["sensitive"]),
            "recorded_at": now_iso,
            "location": payload.location_label,
            "photo": payload.photo_url,
            "notes": payload.notes,
        })

        unlocked = connection.execute(
            text("SELECT id FROM collection_entries WHERE child_id=:child AND species_id=:species"),
            {"child": child_id, "species": payload.species_id}
        ).first()

        first_discovery = unlocked is None
        if first_discovery:
            connection.execute(
                text("INSERT INTO collection_entries (child_id, species_id, unlock_reason, observed_boolean) VALUES (:child, :species, 'discovery', 1)"),
                {"child": child_id, "species": payload.species_id}
            )
            connection.execute(
                text("UPDATE child_profiles SET xp = coalesce(xp, 0) + 100 WHERE id=:child"),
                {"child": child_id}
            )

        updated_profile = connection.execute(
            text("SELECT xp, level FROM child_profiles WHERE id=:id"),
            {"id": child_id}
        ).mappings().first()

    return {
        "success": True,
        "species_id": payload.species_id,
        "common_name": species["common_name"],
        "category": species["category"],
        "location_label": payload.location_label,
        "recorded_at": now_iso,
        "first_discovery": first_discovery,
        "xp_awarded": 100 if first_discovery else 0,
        "total_xp": updated_profile["xp"] if updated_profile else 0,
    }


@app.get("/api/v1/children/{child_id}/recent-captures")
def recent_captures(child_id: int):
    with engine.connect() as connection:
        captures = rows(connection.execute(text("""SELECT s.id AS sighting_id, s.species_id, s.recorded_at, s.location_label, s.photo_url,
            p.id, p.common_name, p.scientific_name, p.category, p.habitat, p.diet, p.fun_fact, p.image_url,
            p.act716_schedule, p.act716_status
            FROM sightings s JOIN species p ON p.id=s.species_id
            WHERE s.child_id=:child AND s.status='confirmed'
            ORDER BY s.id DESC LIMIT 5"""), {"child": child_id}))

    for cap in captures:
        cap.update(calculate_battle_stats(cap["species_id"], cap["category"]))

    return {"items": captures}


@app.get("/api/v1/children/{child_id}/species/{species_id}/gallery")
def species_observation_gallery(child_id: int, species_id: str):
    with engine.connect() as connection:
        sightings = rows(connection.execute(text("""SELECT id, recorded_at, location_label, photo_url, notes
            FROM sightings
            WHERE child_id=:child AND species_id=:species AND status='confirmed'
            ORDER BY id DESC"""), {"child": child_id, "species": species_id}))
    return {"species_id": species_id, "items": sightings, "total": len(sightings)}


@app.get("/api/v1/children/{child_id}/collection")
def collection(child_id: int):
    with engine.connect() as connection:
        entries = rows(connection.execute(text("""SELECT s.id, s.common_name, s.scientific_name, s.category, s.image_url, s.habitat, s.fun_fact,
        CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS discovered,
        (SELECT COUNT(*) FROM sightings WHERE sightings.child_id=:child AND sightings.species_id=s.id AND sightings.status='confirmed') AS sightings_count
        FROM species s
        LEFT JOIN collection_entries c ON c.species_id=s.id AND c.child_id=:child 
        ORDER BY discovered DESC, s.category, s.common_name"""), {"child": child_id}))

    for item in entries:
        stats = calculate_battle_stats(item["id"], item["category"])
        item.update(stats)

    return {"items": entries, "total": len(entries)}


@app.get("/api/v1/children/{child_id}/progress")
def progress(child_id: int):
    with engine.connect() as connection:
        profile = connection.execute(
            text("SELECT display_name, xp, level, avatar, age FROM child_profiles WHERE id=:id"),
            {"id": child_id}
        ).mappings().first()

        if not profile:
            raise HTTPException(404, "Child profile not found")

        category_rows = rows(connection.execute(text("""SELECT s.category, count(*) AS total,
        sum(CASE WHEN c.id IS NULL THEN 0 ELSE 1 END) AS discovered FROM species s
        LEFT JOIN collection_entries c ON c.species_id=s.id AND c.child_id=:child GROUP BY s.category ORDER BY s.category"""), {"child": child_id}))

    found = sum(int(row["discovered"] or 0) for row in category_rows)
    total = sum(int(row["total"]) for row in category_rows)
    return {
        "profile": dict(profile),
        "found": found,
        "total": total,
        "percentage": round((found / total * 100) if total > 0 else 0, 1),
        "categories": category_rows
    }


# ---------------------------------------------------------------------------
# Epic 8: Wildlife Card Battles
# ---------------------------------------------------------------------------

@app.post("/api/v1/children/{child_id}/battle/record")
def record_battle_outcome(child_id: int, payload: BattleOutcomeIn):
    xp_reward = 50 if payload.won else 10
    with engine.begin() as connection:
        child = connection.execute(
            text("SELECT id, xp FROM child_profiles WHERE id=:id"),
            {"id": child_id}
        ).mappings().first()

        if not child:
            raise HTTPException(404, "Child profile not found")

        connection.execute(
            text("UPDATE child_profiles SET xp = coalesce(xp, 0) + :xp WHERE id=:id"),
            {"xp": xp_reward, "id": child_id}
        )

        updated_xp = (child["xp"] or 0) + xp_reward

    return {
        "success": True,
        "won": payload.won,
        "xp_awarded": xp_reward,
        "total_xp": updated_xp,
        "message": f"Battle finished! +{xp_reward} Explorer XP awarded!"
    }
