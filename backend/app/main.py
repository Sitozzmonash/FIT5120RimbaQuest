from __future__ import annotations

import os
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "RimbaQuest.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB.as_posix()}")
SEED_SQL = ROOT / "data" / "seed.sql"


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


initialise_database()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI(title="RimbaQuest API", version="1.0.0")
origins = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


class DiscoveryIn(BaseModel):
    species_id: str
    location_label: str = Field(min_length=2, max_length=120)


def rows(result):
    return [dict(row._mapping) for row in result]


@app.get("/health")
def health():
    return {"status": "ok", "database": "sqlite"}


@app.get("/api/v1/species")
def list_species(category: str | None = None):
    statement = "SELECT id, common_name, scientific_name, category, habitat, diet, fun_fact, image_url, act716_schedule, act716_status FROM species"
    params = {}
    if category:
        statement += " WHERE lower(category) = lower(:category)"
        params["category"] = category.rstrip("s")
    statement += " ORDER BY common_name"
    with engine.connect() as connection:
        return rows(connection.execute(text(statement), params))


@app.get("/api/v1/species/{species_id}")
def get_species(species_id: str):
    with engine.connect() as connection:
        row = connection.execute(text("SELECT * FROM species WHERE id = :id"), {"id": species_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Species not found")
    return dict(row)


@app.post("/api/v1/children/{child_id}/discoveries")
def create_discovery(child_id: int, payload: DiscoveryIn):
    """Persist only after explicit screen-4 confirmation; never retain precise coordinates."""
    with engine.begin() as connection:
        if not connection.execute(text("SELECT 1 FROM child_profiles WHERE id=:id"), {"id": child_id}).first():
            raise HTTPException(404, "Child not found")
        species = connection.execute(text("SELECT id, sensitive FROM species WHERE id=:id"), {"id": payload.species_id}).mappings().first()
        if not species:
            raise HTTPException(404, "Species not found")
        connection.execute(text("INSERT INTO sightings (child_id, species_id, status, sensitive_species) VALUES (:child, :species, 'confirmed', :sensitive)"), {"child": child_id, "species": payload.species_id, "sensitive": bool(species["sensitive"])})
        unlocked = connection.execute(text("SELECT id FROM collection_entries WHERE child_id=:child AND species_id=:species"), {"child": child_id, "species": payload.species_id}).first()
        first_discovery = unlocked is None
        if first_discovery:
            connection.execute(text("INSERT INTO collection_entries (child_id, species_id, unlock_reason, observed_boolean) VALUES (:child, :species, 'discovery', 1)"), {"child": child_id, "species": payload.species_id})
            connection.execute(text("UPDATE child_profiles SET xp = coalesce(xp, 0) + 100 WHERE id=:child"), {"child": child_id})
    return {"species_id": payload.species_id, "location_label": payload.location_label, "recorded_at": datetime.now(timezone.utc).isoformat(), "first_discovery": first_discovery}


@app.get("/api/v1/children/{child_id}/collection")
def collection(child_id: int):
    with engine.connect() as connection:
        entries = rows(connection.execute(text("""SELECT s.id, s.common_name, s.scientific_name, s.category, s.image_url, s.habitat,
        CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS discovered FROM species s
        LEFT JOIN collection_entries c ON c.species_id=s.id AND c.child_id=:child ORDER BY s.category, s.common_name"""), {"child": child_id}))
    return {"items": entries}


@app.get("/api/v1/children/{child_id}/progress")
def progress(child_id: int):
    with engine.connect() as connection:
        profile = connection.execute(text("SELECT display_name, xp, level FROM child_profiles WHERE id=:id"), {"id": child_id}).mappings().first()
        if not profile:
            raise HTTPException(404, "Child not found")
        category_rows = rows(connection.execute(text("""SELECT s.category, count(*) AS total,
        sum(CASE WHEN c.id IS NULL THEN 0 ELSE 1 END) AS discovered FROM species s
        LEFT JOIN collection_entries c ON c.species_id=s.id AND c.child_id=:child GROUP BY s.category ORDER BY s.category"""), {"child": child_id}))
    found = sum(int(row["discovered"] or 0) for row in category_rows)
    total = sum(int(row["total"]) for row in category_rows)
    return {"profile": dict(profile), "found": found, "total": total, "categories": category_rows}
