from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from app.core.database import engine, rows

router = APIRouter(tags=["Locations"])

ITERATION_1_LOCATION_IDS = (
    "loc_bukit_gasing",
    "loc_frim",
    "loc_kuala_selangor",
    "loc_per_paya_indah",
    "loc_kl_forest_eco_park",
    "loc_perdana_botanical",
)

CATEGORY_NEEDLES = {
    "mammal": ["mammal"],
    "mammals": ["mammal"],
    "bird": ["bird"],
    "birds": ["bird"],
    "butterfly": ["butterfl", "insect"],
    "butterflies": ["butterfl", "insect"],
    "reptile": ["reptile"],
    "reptiles": ["reptile"],
}


def _parse_facilities(item: dict[str, Any]) -> dict[str, Any]:
    if isinstance(item.get("facilities"), str):
        try:
            item["facilities"] = json.loads(item["facilities"])
        except Exception:
            item["facilities"] = []
    return item


@router.get("/api/v1/locations")
def list_locations(
    query: str | None = Query(default=None, description="Search keyword matching name, area or description"),
    category: str | None = Query(default=None, description="Filter by typical wildlife category (Mammals, Birds, Butterflies, Reptiles)"),
):
    id_params = {f"id{i}": loc_id for i, loc_id in enumerate(ITERATION_1_LOCATION_IDS)}
    id_placeholders = ", ".join(f":id{i}" for i in range(len(ITERATION_1_LOCATION_IDS)))
    statement = (
        "SELECT id, name, type, area, lat, lng, verified, description, facilities, "
        "best_time, distance_km, why_recommended, typical_wildlife FROM locations "
        f"WHERE id IN ({id_placeholders})"
    )
    params: dict[str, Any] = dict(id_params)
    clauses: list[str] = []

    if query and query.strip():
        query_terms = [query.strip().lower()]
        if query_terms[0] == "kl":
            query_terms.append("kuala lumpur")
        query_parts = []
        for i, term in enumerate(query_terms):
            key = f"q{i}"
            query_parts.append(f"(lower(name) LIKE :{key} OR lower(area) LIKE :{key} OR lower(description) LIKE :{key})")
            params[key] = f"%{term}%"
        clauses.append("(" + " OR ".join(query_parts) + ")")

    needles = CATEGORY_NEEDLES.get((category or "").strip().lower(), [])
    if needles:
        cat_parts = []
        for i, needle in enumerate(needles):
            key = f"cat{i}"
            cat_parts.append(
                f"(lower(coalesce(typical_wildlife, '')) LIKE :{key} "
                f"OR lower(coalesce(description, '')) LIKE :{key} "
                f"OR lower(coalesce(why_recommended, '')) LIKE :{key})"
            )
            params[key] = f"%{needle}%"
        clauses.append("(" + " OR ".join(cat_parts) + ")")

    if clauses:
        statement += " AND " + " AND ".join(clauses)

    statement += " ORDER BY distance_km ASC, name ASC"

    with engine.connect() as connection:
        items = rows(connection.execute(text(statement), params))

    return {"items": [_parse_facilities(item) for item in items], "total": len(items)}


@router.get("/api/v1/locations/{location_id}")
def get_location(location_id: str):
    if location_id not in ITERATION_1_LOCATION_IDS:
        raise HTTPException(404, "Location not found")

    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT * FROM locations WHERE id = :id"),
            {"id": location_id},
        ).mappings().first()

    if not row:
        raise HTTPException(404, "Location not found")

    return _parse_facilities(dict(row))
