from __future__ import annotations

import json
import hashlib
import sqlite3
from functools import lru_cache
from typing import Any

from sqlalchemy import Connection, Table, select

from app.core.config import SEED_SQL
from app.core.schema import app_metadata, locations, quizzes, species, species_images


ITERATION_1_LOCATION_IDS = {
    "loc_bukit_gasing",
    "loc_frim",
    "loc_kuala_selangor",
    "loc_per_paya_indah",
}

LOCATION_ENRICHMENTS = {
    "loc_bukit_gasing": ("Petaling Jaya, Selangor", "Butterflies, Birds, Small Mammals"),
    "loc_frim": ("Kepong, Kuala Lumpur", "Rainforest Canopy Birds, Mammals, Butterflies"),
    "loc_kuala_selangor": ("Kuala Selangor, Selangor", "Mangrove Birds, Reptiles, Fireflies"),
    "loc_per_paya_indah": ("Dengkil, Selangor", "Wetland Birds, Sun Bears, Crocodiles, Reptiles"),
}

EXTRA_LOCATIONS = [
    {
        "id": "loc_kl_forest_eco_park",
        "name": "KL Forest Eco Park",
        "type": "Forest park",
        "lat": 3.151,
        "lng": 101.703,
        "verified": True,
        "description": "A pocket of lowland rainforest in the heart of Kuala Lumpur, beside the KL Tower.",
        "facilities": ["Trails", "Boardwalk", "Rest area"],
        "best_time": "Daily, 8:00 AM–4:30 PM",
        "distance_km": 3.5,
        "why_recommended": "Easy city-centre forest paths where birds and small mammals have previously been observed.",
        "area": "Kuala Lumpur",
        "typical_wildlife": "Birds, Small Mammals, Butterflies",
    },
    {
        "id": "loc_perdana_botanical",
        "name": "Perdana Botanical Gardens",
        "type": "Botanical garden",
        "lat": 3.143,
        "lng": 101.685,
        "verified": True,
        "description": "Kuala Lumpur's main botanical gardens with lakes, lawns and planted forest edges.",
        "facilities": ["Paths", "Parking", "Restroom", "Playground"],
        "best_time": "Daily, 6:30 AM–10:00 PM",
        "distance_km": 2.0,
        "why_recommended": "Open garden paths where butterflies and garden birds may be encountered.",
        "area": "Kuala Lumpur",
        "typical_wildlife": "Butterflies, Birds",
    },
]


@lru_cache(maxsize=1)
def _source_database() -> dict[str, list[dict[str, Any]]]:
    source = sqlite3.connect(":memory:")
    source.row_factory = sqlite3.Row
    try:
        source.executescript(SEED_SQL.read_text(encoding="utf-8"))
        return {
            table_name: [dict(row) for row in source.execute(f'SELECT * FROM "{table_name}"')]
            for table_name in ("species", "quizzes", "species_images", "locations")
        }
    finally:
        source.close()


def _json_value(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def _upsert_rows(connection: Connection, table: Table, items: list[dict[str, Any]]) -> None:
    if not connection.execute(select(next(iter(table.primary_key.columns))).limit(1)).first():
        connection.execute(table.insert(), items)
        return
    for item in items:
        primary_key = {column.name: item[column.name] for column in table.primary_key.columns}
        predicate = [table.c[key] == value for key, value in primary_key.items()]
        exists = connection.execute(select(next(iter(table.primary_key.columns))).where(*predicate)).first()
        if exists:
            values = {key: value for key, value in item.items() if key not in primary_key}
            connection.execute(table.update().where(*predicate).values(**values))
        else:
            connection.execute(table.insert().values(**item))


def seed_iteration_one(connection: Connection) -> None:
    seed_version = hashlib.sha256(SEED_SQL.read_bytes()).hexdigest()
    current_version = connection.execute(
        select(app_metadata.c.value).where(app_metadata.c.key == "iteration_1_seed_sha256")
    ).scalar_one_or_none()
    if current_version == seed_version:
        return

    source = _source_database()
    species_rows = source["species"]
    quiz_rows = source["quizzes"]
    image_rows = source["species_images"]
    location_rows = [row for row in source["locations"] if row["id"] in ITERATION_1_LOCATION_IDS]

    for row in species_rows:
        row["sensitive"] = bool(row.get("sensitive"))
    for row in quiz_rows:
        row["questions_json"] = _json_value(row.get("questions_json"))
    for row in location_rows:
        row["verified"] = bool(row.get("verified"))
        row["facilities"] = _json_value(row.get("facilities"))
        row["area"], row["typical_wildlife"] = LOCATION_ENRICHMENTS[row["id"]]

    _upsert_rows(connection, species, species_rows)
    _upsert_rows(connection, quizzes, quiz_rows)
    # Reference-image metadata is entirely seed-owned. Replacing it as a set
    # prevents stale roadkill/specimen attribution rows from surviving in an
    # existing production database after image corrections.
    connection.execute(species_images.delete())
    if image_rows:
        connection.execute(
            species_images.insert(),
            [{key: value for key, value in row.items() if key != "id"} for row in image_rows],
        )
    _upsert_rows(connection, locations, [*location_rows, *EXTRA_LOCATIONS])
    existing_version = connection.execute(
        select(app_metadata.c.key).where(app_metadata.c.key == "iteration_1_seed_sha256")
    ).first()
    if existing_version:
        connection.execute(
            app_metadata.update()
            .where(app_metadata.c.key == "iteration_1_seed_sha256")
            .values(value=seed_version)
        )
    else:
        connection.execute(
            app_metadata.insert().values(key="iteration_1_seed_sha256", value=seed_version)
        )
