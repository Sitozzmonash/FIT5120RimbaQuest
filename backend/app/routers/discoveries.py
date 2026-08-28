from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import text

from app.core.auth import AuthenticatedUser, require_child_access
from app.core.config import MAX_PHOTO_BYTES
from app.core.database import engine, rows
from app.schemas.discovery import DiscoveryIn
from app.services.battle_engine import calculate_battle_stats
from app.services.storage import (
    CONTENT_EXTENSIONS,
    StorageUnavailable,
    signed_photo_url,
    upload_discovery_photo,
)


router = APIRouter(tags=["Discoveries & Collection"])


def _photo_url(item: dict) -> str | None:
    signed = signed_photo_url(item.get("photo_path"))
    legacy = item.get("photo_url")
    return signed or (legacy if isinstance(legacy, str) and legacy.startswith(("http://", "https://")) else None)


@router.post("/api/v1/children/{child_id}/photos")
async def upload_photo(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
    photo: UploadFile = File(...),
):
    content_type = (photo.content_type or "").lower()
    if content_type not in CONTENT_EXTENSIONS:
        raise HTTPException(415, "Please upload a JPEG, PNG, or WebP image.")
    content = await photo.read(MAX_PHOTO_BYTES + 1)
    if not content:
        raise HTTPException(400, "The selected photo is empty.")
    if len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(413, "The photo must be 5 MB or smaller.")
    try:
        object_path = upload_discovery_photo(child_id, content, content_type)
    except StorageUnavailable as error:
        raise HTTPException(503, str(error)) from error
    return {"photo_path": object_path, "photo_url": signed_photo_url(object_path)}


@router.post("/api/v1/children/{child_id}/discoveries")
def create_discovery(
    child_id: int,
    payload: DiscoveryIn,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    if payload.photo_path and not payload.photo_path.startswith(f"children/{child_id}/discoveries/"):
        raise HTTPException(400, "The uploaded photo does not belong to this explorer.")

    with engine.begin() as connection:
        species = connection.execute(
            text("SELECT id, sensitive, common_name, category FROM species WHERE id=:id AND is_active=1"),
            {"id": payload.species_id},
        ).mappings().first()
        if not species:
            raise HTTPException(404, "Species not found")

        recorded_at = datetime.now(timezone.utc)
        connection.execute(
            text("""INSERT INTO sightings
                (child_id, species_id, status, sensitive_species, recorded_at,
                 location_label, photo_path, notes)
                VALUES (:child, :species, 'confirmed', :sensitive, :recorded_at,
                        :location, :photo_path, :notes)"""),
            {
                "child": child_id,
                "species": payload.species_id,
                "sensitive": bool(species["sensitive"]),
                "recorded_at": recorded_at,
                "location": payload.location_label,
                "photo_path": payload.photo_path,
                "notes": payload.notes,
            },
        )

        unlocked = connection.execute(
            text("SELECT id FROM collection_entries WHERE child_id=:child AND species_id=:species"),
            {"child": child_id, "species": payload.species_id},
        ).first()
        first_discovery = unlocked is None
        if first_discovery:
            connection.execute(
                text("""INSERT INTO collection_entries
                    (child_id, species_id, unlock_reason, observed_boolean)
                    VALUES (:child, :species, 'discovery', :observed)"""),
                {"child": child_id, "species": payload.species_id, "observed": True},
            )
            connection.execute(
                text("UPDATE child_profiles SET xp=coalesce(xp, 0)+100 WHERE id=:child"),
                {"child": child_id},
            )
        updated_profile = connection.execute(
            text("SELECT xp, level FROM child_profiles WHERE id=:id"), {"id": child_id}
        ).mappings().one()

    return {
        "success": True,
        "species_id": payload.species_id,
        "common_name": species["common_name"],
        "category": species["category"],
        "location_label": payload.location_label,
        "recorded_at": recorded_at.isoformat(),
        "first_discovery": first_discovery,
        "xp_awarded": 100 if first_discovery else 0,
        "total_xp": updated_profile["xp"] or 0,
        "photo_url": signed_photo_url(payload.photo_path),
    }


@router.get("/api/v1/children/{child_id}/recent-captures")
def recent_captures(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.connect() as connection:
        captures = rows(connection.execute(text("""SELECT
            sight.id AS sighting_id, sight.species_id, sight.recorded_at,
            sight.location_label, sight.photo_path, sight.photo_url,
            species.id, species.common_name, species.scientific_name, species.category,
            species.habitat, species.diet, species.fun_fact, species.image_url,
            species.act716_schedule, species.act716_status
            FROM sightings sight JOIN species ON species.id=sight.species_id
            WHERE sight.child_id=:child AND sight.status='confirmed'
            ORDER BY sight.recorded_at DESC, sight.id DESC LIMIT 5"""), {"child": child_id}))
    for capture in captures:
        capture["photo_url"] = _photo_url(capture)
        capture.pop("photo_path", None)
        capture.update(calculate_battle_stats(capture["species_id"], capture["category"]))
    return {"items": captures}


@router.get("/api/v1/children/{child_id}/species/{species_id}/gallery")
def species_observation_gallery(
    child_id: int,
    species_id: str,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.connect() as connection:
        sightings = rows(connection.execute(text("""SELECT
            id, recorded_at, location_label, photo_path, photo_url, notes
            FROM sightings
            WHERE child_id=:child AND species_id=:species AND status='confirmed'
            ORDER BY recorded_at DESC, id DESC"""), {"child": child_id, "species": species_id}))
    for sighting in sightings:
        sighting["photo_url"] = _photo_url(sighting)
        sighting.pop("photo_path", None)
    return {"species_id": species_id, "items": sightings, "total": len(sightings)}


@router.get("/api/v1/children/{child_id}/collection")
def collection(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.connect() as connection:
        entries = rows(connection.execute(text("""SELECT
            species.id, species.common_name, species.scientific_name, species.category,
            species.image_url, species.habitat, species.fun_fact,
            CASE WHEN collection.id IS NULL THEN 0 ELSE 1 END AS discovered,
            (SELECT COUNT(*) FROM sightings
             WHERE sightings.child_id=:child AND sightings.species_id=species.id
             AND sightings.status='confirmed') AS sightings_count
            FROM species
            LEFT JOIN collection_entries collection
              ON collection.species_id=species.id AND collection.child_id=:child
            WHERE species.is_active=1
            ORDER BY discovered DESC, species.category, species.common_name"""), {"child": child_id}))
    for item in entries:
        item.update(calculate_battle_stats(item["id"], item["category"]))
    return {"items": entries, "total": len(entries)}


@router.get("/api/v1/children/{child_id}/progress")
def progress(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.connect() as connection:
        profile = connection.execute(
            text("SELECT display_name, xp, level, avatar, age FROM child_profiles WHERE id=:id"),
            {"id": child_id},
        ).mappings().first()
        if not profile:
            raise HTTPException(404, "Child profile not found")
        categories = rows(connection.execute(text("""SELECT species.category, COUNT(*) AS total,
            SUM(CASE WHEN collection.id IS NULL THEN 0 ELSE 1 END) AS discovered
            FROM species
            LEFT JOIN collection_entries collection
              ON collection.species_id=species.id AND collection.child_id=:child
            WHERE species.is_active=1
            GROUP BY species.category ORDER BY species.category"""), {"child": child_id}))
    found = sum(int(row["discovered"] or 0) for row in categories)
    total = sum(int(row["total"]) for row in categories)
    return {
        "profile": dict(profile),
        "found": found,
        "total": total,
        "percentage": round((found / total * 100) if total else 0, 1),
        "categories": categories,
    }
