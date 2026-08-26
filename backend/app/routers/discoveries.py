from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.core.database import engine, rows
from app.schemas.discovery import DiscoveryIn
from app.services.battle_engine import calculate_battle_stats

router = APIRouter(tags=["Discoveries & Collection"])


@router.post("/api/v1/children/{child_id}/discoveries")
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


@router.get("/api/v1/children/{child_id}/recent-captures")
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


@router.get("/api/v1/children/{child_id}/species/{species_id}/gallery")
def species_observation_gallery(child_id: int, species_id: str):
    with engine.connect() as connection:
        sightings = rows(connection.execute(text("""SELECT id, recorded_at, location_label, photo_url, notes
            FROM sightings
            WHERE child_id=:child AND species_id=:species AND status='confirmed'
            ORDER BY id DESC"""), {"child": child_id, "species": species_id}))
    return {"species_id": species_id, "items": sightings, "total": len(sightings)}


@router.get("/api/v1/children/{child_id}/collection")
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


@router.get("/api/v1/children/{child_id}/progress")
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
