from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from app.core.database import engine, rows

router = APIRouter(tags=["Locations"])


@router.get("/api/v1/locations")
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

    for item in items:
        if isinstance(item.get("facilities"), str):
            try:
                item["facilities"] = json.loads(item["facilities"])
            except Exception:
                item["facilities"] = []

    return {"items": items, "total": len(items)}


@router.get("/api/v1/locations/{location_id}")
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
