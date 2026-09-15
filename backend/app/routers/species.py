from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.core.database import engine, rows
from app.services.battle_engine import calculate_battle_stats

router = APIRouter(tags=["Species & Quizzes"])


@router.get("/api/v1/species")
def list_species(category: str | None = None):
    statement = "SELECT id, common_name, scientific_name, category, habitat, diet, fun_fact, image_url, act716_schedule, act716_status FROM species WHERE is_active = TRUE"
    params = {}
    if category and category.lower() != "all":
        statement += " AND lower(category) = lower(:category)"
        params["category"] = category.rstrip("s")
    statement += " ORDER BY common_name"
    with engine.connect() as connection:
        items = rows(connection.execute(text(statement), params))

    for item in items:
        stats = calculate_battle_stats(item["id"], item["category"])
        item.update(stats)

    return items


@router.get("/api/v1/species/{species_id}")
def get_species(species_id: str):
    with engine.connect() as connection:
        row = connection.execute(text("SELECT * FROM species WHERE id = :id"), {"id": species_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Species not found")
    item = dict(row)
    stats = calculate_battle_stats(item["id"], item["category"])
    item.update(stats)
    return item


@router.get("/api/v1/species/{species_id}/fun-facts")
def list_approved_fun_facts(species_id: str):
    """Return only reviewed, child-facing facts in their curated order."""
    with engine.connect() as connection:
        exists = connection.execute(
            text("SELECT 1 FROM species WHERE id=:id AND is_active=TRUE"),
            {"id": species_id},
        ).first()
        if not exists:
            raise HTTPException(404, "Species not found")
        facts = rows(connection.execute(
            text("""SELECT display_order, fact_text
                    FROM species_fun_facts
                    WHERE species_id=:species_id
                      AND LOWER(verification_status) IN ('team-verified', 'approved', 'verified')
                      AND NULLIF(TRIM(verified_by), '') IS NOT NULL
                      AND verified_at IS NOT NULL
                    ORDER BY display_order ASC
                    LIMIT 10"""),
            {"species_id": species_id},
        ))
    return {"species_id": species_id, "facts": facts}


@router.get("/api/v1/species/{species_id}/legacy-quiz")
def get_species_quiz(species_id: str):
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT questions_json FROM quizzes WHERE species_id=:id ORDER BY version DESC LIMIT 1"),
            {"id": species_id}
        ).mappings().first()
    if not row:
        raise HTTPException(404, "Quiz not found")
    return {"species_id": species_id, "questions": row["questions_json"]}

