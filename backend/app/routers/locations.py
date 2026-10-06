from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from app.core.database import engine, rows

router = APIRouter(tags=["Locations"])

# Epic 2 catalogue: KL + Selangor only. The seed database still contains the
# retired whole-Malaysia rows (Taman Negara, Bako, Cherating, ...), so this
# allowlist is what keeps them out of the child-facing list.
KL_SELANGOR_LOCATION_IDS = (
    "loc_bukit_gasing",
    "loc_frim",
    "loc_kuala_selangor",
    "loc_per_paya_indah",
    "loc_kl_forest_eco_park",
    "loc_perdana_botanical",
    "loc_zoo_negara",
    "loc_aquaria_klcc",
    "loc_kl_bird_park",
    "loc_kl_butterfly_park",
    "loc_farm_in_the_city",
    "loc_taman_tugu",
    "loc_templer_park",
    "loc_kanching",
    "loc_eko_rimba_komanwel",
    "loc_sungai_chongkak",
    "loc_kota_damansara_cf",
    "loc_taman_rimba_kiara",
    "loc_botani_shah_alam",
    "loc_bukit_melawati",
    "loc_kg_kuantan_firefly",
)

LOCATION_TYPES = (
    "Zoo",
    "Wildlife Park",
    "Petting Zoo",
    "Aquarium",
    "Forest Park",
    "Nature Park",
    "Botanical Garden",
)


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
    category: str | None = Query(default=None, description="Filter by location category (Zoo, Wildlife Park, Petting Zoo, Aquarium, Forest Park, Nature Park, Botanical Garden)"),
):
    id_params = {f"id{i}": loc_id for i, loc_id in enumerate(KL_SELANGOR_LOCATION_IDS)}
    id_placeholders = ", ".join(f":id{i}" for i in range(len(KL_SELANGOR_LOCATION_IDS)))
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

    if category and category.strip():
        clauses.append("lower(coalesce(type, '')) = :cat")
        params["cat"] = category.strip().lower()

    if clauses:
        statement += " AND " + " AND ".join(clauses)

    statement += " ORDER BY distance_km ASC, name ASC"

    with engine.connect() as connection:
        items = rows(connection.execute(text(statement), params))

    return {"items": [_parse_facilities(item) for item in items], "total": len(items)}


@router.get("/api/v1/locations/{location_id}")
def get_location(location_id: str):
    if location_id not in KL_SELANGOR_LOCATION_IDS:
        raise HTTPException(404, "Location not found")

    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT * FROM locations WHERE id = :id"),
            {"id": location_id},
        ).mappings().first()

    if not row:
        raise HTTPException(404, "Location not found")

    return _parse_facilities(dict(row))
