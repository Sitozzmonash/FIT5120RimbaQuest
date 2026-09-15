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
def list_child_facing_fun_facts(species_id: str):
    """Return up to ten source-linked facts cleared of known bad content."""
    with engine.connect() as connection:
        species = connection.execute(
            text("""SELECT common_name, scientific_name, distinctive_features, habitat,
                           diet, conservation_status, fun_fact
                    FROM species WHERE id=:id AND is_active=TRUE"""),
            {"id": species_id},
        ).mappings().first()
        if not species:
            raise HTTPException(404, "Species not found")
        facts = rows(connection.execute(
            text("""SELECT display_order, fact_text
                    FROM species_fun_facts
                    WHERE species_id=:species_id
                      AND LOWER(verification_status) NOT IN ('rejected', 'revoked')
                    ORDER BY display_order ASC
                    LIMIT 10"""),
            {"species_id": species_id},
        ))
    existing_text = {str(fact["fact_text"]).strip().casefold() for fact in facts}
    fallback_candidates = (
        species["fun_fact"],
        f"Its scientific name is {species['scientific_name']}." if species["scientific_name"] else None,
        f"It can be recognised by: {species['distinctive_features']}" if species["distinctive_features"] else None,
        f"It lives in: {species['habitat']}" if species["habitat"] else None,
        f"Its diet includes: {species['diet']}" if species["diet"] else None,
        f"Its conservation status is {species['conservation_status']}." if species["conservation_status"] else None,
    )
    for fallback in fallback_candidates:
        text_value = str(fallback or "").strip()
        if text_value and text_value.casefold() not in existing_text and len(facts) < 10:
            facts.append({"display_order": 100 + len(facts), "fact_text": text_value})
            existing_text.add(text_value.casefold())
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

