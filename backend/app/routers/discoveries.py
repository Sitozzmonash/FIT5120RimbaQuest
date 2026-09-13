from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
import logging
import random
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import text

from app.core.auth import AuthenticatedUser, require_child_access
from app.core.config import (
    DISCOVERY_VERIFICATION_TTL_MINUTES,
    MAX_PHOTO_BYTES,
    PRIMARY_VISION_MODEL,
    VISION_PROVIDER_ORDER,
)
from app.core.database import engine, rows
from app.core.schema import discovery_verifications
from app.schemas.discovery import DiscoveryIn, IdentificationAnswerIn
from app.services.battle_engine import calculate_battle_stats
from app.services.activity import record_species_activity
from app.services.storage import (
    CONTENT_EXTENSIONS,
    StorageUnavailable,
    signed_photo_url,
    upload_discovery_photo,
)
from app.services.vision import VisionServiceUnavailable, identify_supported_species


router = APIRouter(tags=["Discoveries & Collection"])
# Uvicorn's error logger is wired to Render stdout/stderr in production.
logger = logging.getLogger("uvicorn.error")
UNVERIFIED_MESSAGE = "We couldn't verify this animal. Please try another wildlife photo."
VERIFICATION_FAILED_MESSAGE = "We couldn't check your wildlife photo right now. Please try again."


def _species_payload(item: dict) -> dict:
    payload = {
        key: item.get(key)
        for key in (
            "id",
            "common_name",
            "scientific_name",
            "category",
            "habitat",
            "diet",
            "fun_fact",
            "distinctive_features",
            "image_url",
            "act716_status",
        )
    }
    payload.update(calculate_battle_stats(str(item["id"]), str(item.get("category") or "")))
    return payload


def _is_expired(value: datetime | str, now: datetime) -> bool:
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value <= now


def _candidate_ids(verified: dict, catalogue: list[dict]) -> list[str]:
    rng = random.SystemRandom()
    same_category = [
        item for item in catalogue
        if item["id"] != verified["id"] and item.get("category") == verified.get("category")
    ]
    other_categories = [
        item for item in catalogue
        if item["id"] != verified["id"] and item.get("category") != verified.get("category")
    ]
    rng.shuffle(same_category)
    rng.shuffle(other_categories)
    distractors = (same_category + other_categories)[:3]
    ids = [verified["id"], *(item["id"] for item in distractors)]
    rng.shuffle(ids)
    return ids


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


@router.post("/api/v1/children/{child_id}/discovery-verifications")
async def verify_discovery_photo(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
    photo: UploadFile = File(...),
):
    """Verify a photo without exposing the model-selected answer to the child."""
    trace_id = uuid4().hex[:12]
    content_type = (photo.content_type or "").lower()
    if content_type not in CONTENT_EXTENSIONS:
        raise HTTPException(415, "Please upload a JPEG, PNG, or WebP image.")
    content = await photo.read(MAX_PHOTO_BYTES + 1)
    if not content:
        raise HTTPException(400, "The selected photo is empty.")
    if len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(413, "The photo must be 5 MB or smaller.")

    logger.info(
        "discovery_verification_started trace_id=%s child_id=%s content_type=%s photo_bytes=%s primary_model=%s provider_order=%s",
        trace_id,
        child_id,
        content_type,
        len(content),
        PRIMARY_VISION_MODEL,
        VISION_PROVIDER_ORDER,
    )

    with engine.connect() as connection:
        catalogue = rows(connection.execute(text("""SELECT
            id, common_name, scientific_name, category, habitat, diet, fun_fact,
            distinctive_features, image_url, act716_status
            FROM species
            WHERE is_active=TRUE AND image_url IS NOT NULL AND image_url <> ''
            ORDER BY common_name""")))
    try:
        match = identify_supported_species(
            content,
            content_type,
            catalogue,
            trace_id=trace_id,
        )
    except VisionServiceUnavailable as error:
        logger.warning(
            "discovery_verification_failed trace_id=%s child_id=%s phase=vision reason=%s",
            trace_id,
            child_id,
            error,
        )
        raise HTTPException(
            503,
            VERIFICATION_FAILED_MESSAGE,
            headers={"X-RimbaQuest-Trace-ID": trace_id},
        ) from error
    if not match:
        logger.info(
            "discovery_verification_unverified trace_id=%s child_id=%s",
            trace_id,
            child_id,
        )
        return {"status": "unverified", "message": UNVERIFIED_MESSAGE}

    by_id = {item["id"]: item for item in catalogue}
    verified = by_id.get(match["species_id"])
    if not verified:
        return {"status": "unverified", "message": UNVERIFIED_MESSAGE}
    candidate_ids = _candidate_ids(verified, catalogue)
    if len(candidate_ids) != 4:
        logger.error(
            "discovery_verification_failed trace_id=%s child_id=%s phase=candidates candidate_count=%s",
            trace_id,
            child_id,
            len(candidate_ids),
        )
        raise HTTPException(
            503,
            VERIFICATION_FAILED_MESSAGE,
            headers={"X-RimbaQuest-Trace-ID": trace_id},
        )

    try:
        object_path = upload_discovery_photo(child_id, content, content_type)
    except StorageUnavailable as error:
        logger.exception(
            "discovery_verification_failed trace_id=%s child_id=%s phase=storage reason=%s",
            trace_id,
            child_id,
            error,
        )
        raise HTTPException(
            503,
            str(error),
            headers={"X-RimbaQuest-Trace-ID": trace_id},
        ) from error

    verification_id = str(uuid4())
    created_at = datetime.now(timezone.utc)
    with engine.begin() as connection:
        connection.execute(discovery_verifications.insert().values(
            id=verification_id,
            child_id=child_id,
            photo_path=object_path,
            verified_species_id=verified["id"],
            candidate_species_ids=candidate_ids,
            confidence=match["confidence"],
            model=match["model"],
            status="verified",
            created_at=created_at,
            expires_at=created_at + timedelta(minutes=DISCOVERY_VERIFICATION_TTL_MINUTES),
        ))

    logger.info(
        "discovery_verification_succeeded trace_id=%s child_id=%s verification_id=%s species_id=%s confidence=%.3f provider=%s model=%s",
        trace_id,
        child_id,
        verification_id,
        verified["id"],
        match["confidence"],
        match["provider"],
        match["model"],
    )

    return {
        "status": "verified",
        "verification_id": verification_id,
        "photo_url": signed_photo_url(object_path),
        "candidates": [_species_payload(by_id[item_id]) for item_id in candidate_ids],
    }


@router.post("/api/v1/children/{child_id}/discovery-verifications/{verification_id}/evaluate")
def evaluate_discovery_identification(
    child_id: int,
    verification_id: str,
    payload: IdentificationAnswerIn,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    now = datetime.now(timezone.utc)
    with engine.begin() as connection:
        verification = connection.execute(text("""SELECT * FROM discovery_verifications
            WHERE id=:id AND child_id=:child"""), {
            "id": verification_id,
            "child": child_id,
        }).mappings().first()
        if not verification:
            raise HTTPException(404, "Wildlife verification not found.")
        verification = dict(verification)
        if verification["status"] in ("reported", "used"):
            raise HTTPException(409, "This wildlife verification is no longer available.")
        if _is_expired(verification["expires_at"], now):
            raise HTTPException(410, "This wildlife verification has expired. Please try another photo.")

        if verification["status"] == "evaluated" and verification.get("evaluated_at"):
            # Network retries are idempotent: the child's first submitted answer
            # remains the recorded answer after the result has been revealed.
            category_correct = bool(verification["category_correct"])
            species_correct = bool(verification["species_correct"])
        else:
            candidate_ids = verification["candidate_species_ids"]
            if isinstance(candidate_ids, str):
                candidate_ids = json.loads(candidate_ids)
            if payload.species_id not in candidate_ids:
                raise HTTPException(400, "Please choose one of the displayed species.")

            category_correct = payload.category == connection.execute(
                text("SELECT category FROM species WHERE id=:id"),
                {"id": verification["verified_species_id"]},
            ).scalar_one()
            species_correct = payload.species_id == verification["verified_species_id"]
            connection.execute(text("""UPDATE discovery_verifications SET
                child_category=:category, child_species_id=:species,
                category_correct=:category_correct, species_correct=:species_correct,
                evaluated_at=:evaluated, status='evaluated'
                WHERE id=:id"""), {
                "category": payload.category,
                "species": payload.species_id,
                "category_correct": category_correct,
                "species_correct": species_correct,
                "evaluated": now,
                "id": verification_id,
            })
        species = connection.execute(text("""SELECT
            id, common_name, scientific_name, category, habitat, diet, fun_fact,
            distinctive_features, image_url, act716_status
            FROM species WHERE id=:id"""), {
            "id": verification["verified_species_id"],
        }).mappings().one()

    return {
        "correct": bool(category_correct and species_correct),
        "category_correct": bool(category_correct),
        "species_correct": bool(species_correct),
        "verified_species": _species_payload(dict(species)),
        "explanation": species["distinctive_features"] or species["fun_fact"],
    }


@router.post("/api/v1/children/{child_id}/discovery-verifications/{verification_id}/report")
def report_discovery_verification(
    child_id: int,
    verification_id: str,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.begin() as connection:
        verification = connection.execute(text("""SELECT status FROM discovery_verifications
            WHERE id=:id AND child_id=:child"""), {
            "id": verification_id,
            "child": child_id,
        }).mappings().first()
        if not verification:
            raise HTTPException(404, "Wildlife verification not found.")
        if verification["status"] == "used":
            raise HTTPException(409, "A saved discovery cannot be reported from this screen.")
        connection.execute(text("""UPDATE discovery_verifications
            SET status='reported', reported_at=:reported WHERE id=:id"""), {
            "reported": datetime.now(timezone.utc),
            "id": verification_id,
        })
    return {"success": True}


@router.post("/api/v1/children/{child_id}/discoveries")
def create_discovery(
    child_id: int,
    payload: DiscoveryIn,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.begin() as connection:
        verification = connection.execute(text("""SELECT * FROM discovery_verifications
            WHERE id=:id AND child_id=:child"""), {
            "id": payload.verification_id,
            "child": child_id,
        }).mappings().first()
        if not verification:
            raise HTTPException(404, "Wildlife verification not found.")
        verification = dict(verification)
        if verification["status"] != "evaluated" or not verification.get("evaluated_at"):
            raise HTTPException(409, "Complete the wildlife identification activity before saving.")
        if verification.get("used_at"):
            raise HTTPException(409, "This wildlife verification has already been saved.")
        recorded_at = datetime.now(timezone.utc)
        if _is_expired(verification["expires_at"], recorded_at):
            raise HTTPException(410, "This wildlife verification has expired. Please try another photo.")

        # Claim the one-time verification inside the same transaction as the
        # discovery. This closes the race where two simultaneous save requests
        # could otherwise both observe an unused record and award twice.
        claimed = connection.execute(text("""UPDATE discovery_verifications
            SET status='used', used_at=:used
            WHERE id=:id AND child_id=:child
              AND status='evaluated' AND used_at IS NULL"""), {
            "used": recorded_at,
            "id": payload.verification_id,
            "child": child_id,
        })
        if claimed.rowcount != 1:
            raise HTTPException(409, "This wildlife verification has already been saved.")

        species = connection.execute(
            text("SELECT id, sensitive, common_name, category FROM species WHERE id=:id AND is_active=TRUE"),
            {"id": verification["verified_species_id"]},
        ).mappings().first()
        if not species:
            raise HTTPException(404, "Species not found")

        connection.execute(
            text("""INSERT INTO sightings
                (child_id, species_id, status, sensitive_species, recorded_at,
                 location_label, photo_path, notes)
                VALUES (:child, :species, 'confirmed', :sensitive, :recorded_at,
                        :location, :photo_path, :notes)"""),
            {
                "child": child_id,
                "species": species["id"],
                "sensitive": bool(species["sensitive"]),
                "recorded_at": recorded_at,
                "location": payload.location_label,
                "photo_path": verification["photo_path"],
                "notes": payload.notes,
            },
        )

        unlocked = connection.execute(
            text("SELECT id FROM collection_entries WHERE child_id=:child AND species_id=:species"),
            {"child": child_id, "species": species["id"]},
        ).first()
        first_discovery = unlocked is None
        if first_discovery:
            connection.execute(
                text("""INSERT INTO collection_entries
                    (child_id, species_id, unlock_reason, observed_boolean)
                    VALUES (:child, :species, 'discovery', :observed)"""),
                {"child": child_id, "species": species["id"], "observed": True},
            )
            connection.execute(
                text("UPDATE child_profiles SET xp=coalesce(xp, 0)+100 WHERE id=:child"),
                {"child": child_id},
            )
        record_species_activity(
            connection,
            child_id,
            species["id"],
            "discovery",
            occurred_at=recorded_at,
        )
        updated_profile = connection.execute(
            text("SELECT xp, level FROM child_profiles WHERE id=:id"), {"id": child_id}
        ).mappings().one()
    return {
        "success": True,
        "species_id": species["id"],
        "common_name": species["common_name"],
        "category": species["category"],
        "location_label": payload.location_label,
        "recorded_at": recorded_at.isoformat(),
        "first_discovery": first_discovery,
        "xp_awarded": 100 if first_discovery else 0,
        "total_xp": updated_profile["xp"] or 0,
        "photo_url": signed_photo_url(verification["photo_path"]),
    }


@router.get("/api/v1/children/{child_id}/recent-captures")
def recent_captures(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.connect() as connection:
        captures = rows(connection.execute(text("""SELECT
            latest_sighting.id AS sighting_id,
            species.id AS species_id,
            COALESCE(activity.last_interacted_at, latest_sighting.recorded_at) AS recorded_at,
            latest_sighting.location_label, latest_sighting.photo_path,
            latest_sighting.photo_url,
            activity.activity_type AS last_activity_type,
            species.id AS id, species.common_name, species.scientific_name,
            species.category, species.habitat, species.diet, species.fun_fact,
            species.image_url, species.act716_schedule, species.act716_status
            FROM collection_entries collection
            JOIN species ON species.id=collection.species_id
            LEFT JOIN child_species_activity activity
              ON activity.child_id=collection.child_id
              AND activity.species_id=collection.species_id
            LEFT JOIN sightings latest_sighting ON latest_sighting.id=(
                SELECT candidate.id FROM sightings candidate
                WHERE candidate.child_id=:child
                  AND candidate.species_id=collection.species_id
                  AND candidate.status='confirmed'
                ORDER BY candidate.recorded_at DESC, candidate.id DESC LIMIT 1
            )
            WHERE collection.child_id=:child AND species.is_active=TRUE
            ORDER BY COALESCE(activity.last_interacted_at, latest_sighting.recorded_at) DESC,
                     species.common_name ASC
            LIMIT 5"""), {"child": child_id}))
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
            WHERE species.is_active=TRUE
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
            WHERE species.is_active=TRUE
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
