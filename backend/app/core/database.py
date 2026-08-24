from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any
from sqlalchemy import create_engine

from app.core.config import (
    DATABASE_URL,
    IMAGE_METADATA_END,
    IMAGE_METADATA_START,
    LEARNING_DATA_END,
    LEARNING_DATA_START,
    SEED_SQL,
)
from app.core.security import hash_password


def database_path() -> Path:
    if DATABASE_URL.startswith("sqlite:///"):
        return Path(DATABASE_URL.removeprefix("sqlite:///"))
    raise RuntimeError("Iteration 1 only supports SQLite DATABASE_URL values")


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

            # Ensure default user & child profile exist for guest play
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


def rows(result: Any) -> list[dict[str, Any]]:
    return [dict(row._mapping) for row in result]
