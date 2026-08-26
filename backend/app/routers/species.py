from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.core.database import engine, rows
from app.services.battle_engine import calculate_battle_stats

router = APIRouter(tags=["Species & Quizzes"])


@router.get("/api/v1/species")
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


@router.get("/api/v1/species/{species_id}/quiz")
def get_species_quiz(species_id: str):
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT questions_json FROM quizzes WHERE species_id=:id ORDER BY version DESC LIMIT 1"),
            {"id": species_id}
        ).mappings().first()
    if not row:
        raise HTTPException(404, "Quiz not found")
    return {"species_id": species_id, "questions": row["questions_json"]}
