from __future__ import annotations

import json
import hashlib
import re
import sqlite3
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import Connection, Table, select

from app.core.config import ITERATION_2_CHAT_EVIDENCE, ITERATION_2_FUN_FACTS_PILOT, SEED_SQL
from app.core.schema import (
    app_metadata,
    locations,
    quizzes,
    species,
    species_chat_evidence,
    species_fun_facts,
    species_fun_fact_sources,
    species_images,
)


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


def _set_metadata(connection: Connection, key: str, value: str) -> None:
    """Upsert a small seeding marker without relying on database-specific SQL."""
    existing = connection.execute(
        select(app_metadata.c.key).where(app_metadata.c.key == key)
    ).first()
    if existing:
        connection.execute(app_metadata.update().where(app_metadata.c.key == key).values(value=value))
    else:
        connection.execute(app_metadata.insert().values(key=key, value=value))


def _seed_key(*parts: object) -> str:
    """Use JSON rather than a delimiter so URLs cannot make ambiguous keys."""
    return json.dumps(list(parts), ensure_ascii=False, separators=(",", ":"))


FUN_FACT_CONTENT_POLICY_VERSION = "child-facing-fun-facts-v2"
FUN_FACT_BLOCKED_PATTERNS = (
    r"\brimbaquest\s+catalogue\b",
    r"\bcatalogue\s+links?\b",
    r"^from wikipedia, the free encyclopedia",
    r"\byou can help wikipedia\b",
    r"\bthis article\b.*\bis a stub\b",
    r"^life-history note:",
    r"lifespan.*\b(unknown|uncertain)\b",
    r"lifespan.*not well documented",
)


def _is_child_facing_fun_fact(fact_text: object) -> bool:
    """Reject scraped page text and preparation notes, not ordinary source-linked facts."""
    text = str(fact_text or "").strip()
    return bool(text) and not any(
        re.search(pattern, text, re.IGNORECASE) for pattern in FUN_FACT_BLOCKED_PATTERNS
    )


def _previous_seed_keys(connection: Connection, key: str) -> set[str]:
    raw_value = connection.execute(
        select(app_metadata.c.value).where(app_metadata.c.key == key)
    ).scalar_one_or_none()
    if not raw_value:
        return set()
    try:
        decoded = json.loads(raw_value)
    except (TypeError, json.JSONDecodeError):
        return set()
    return {item for item in decoded if isinstance(item, str)} if isinstance(decoded, list) else set()


def seed_iteration_two_fun_facts_pilot(connection: Connection) -> None:
    """Load source-linked Fun Facts and reject non-child-facing seed records.

    Source-linked facts can be displayed without individual reviewer metadata.
    Scraped page artefacts, RimbaQuest system statements, and uncertainty-only
    placeholders remain traceable but do not enter the public feed.
    """
    if not ITERATION_2_FUN_FACTS_PILOT.exists():
        return

    seed_version = hashlib.sha256(
        ITERATION_2_FUN_FACTS_PILOT.read_bytes() + FUN_FACT_CONTENT_POLICY_VERSION.encode()
    ).hexdigest()
    version_key = "iteration_2_fun_facts_pilot_sha256"
    keys_key = "iteration_2_fun_facts_pilot_seed_keys"
    current_version = connection.execute(
        select(app_metadata.c.value).where(app_metadata.c.key == version_key)
    ).scalar_one_or_none()
    records = json.loads(ITERATION_2_FUN_FACTS_PILOT.read_text(encoding="utf-8"))
    current_keys = {
        _seed_key(record["species_id"], record["display_order"])
        for record in records
    }

    # A database first deployed before this reconciliation feature has no key
    # list.  Establish its baseline without treating all historic rows as
    # withdrawn; later seed revisions can safely revoke removed records.
    if current_version == seed_version:
        if not connection.execute(select(app_metadata.c.key).where(app_metadata.c.key == keys_key)).first():
            _set_metadata(connection, keys_key, json.dumps(sorted(current_keys)))
        return

    previous_keys = _previous_seed_keys(connection, keys_key)
    for stale_key in previous_keys - current_keys:
        try:
            species_id, display_order = json.loads(stale_key)
        except (TypeError, ValueError):
            continue
        if not isinstance(species_id, str) or not isinstance(display_order, int):
            continue
        connection.execute(
            species_fun_facts.update()
            .where(
                (species_fun_facts.c.species_id == species_id)
                & (species_fun_facts.c.display_order == display_order)
            )
            .values(verification_status="revoked")
        )

    for record in records:
        fact_text = str(record.get("fun_fact") or record.get("fact_text") or "").strip()
        source_url = str(record.get("source_url") or "").strip()
        source_name = record.get("source_name")
        if not source_name:
            if source_url:
                netloc = urlparse(source_url).netloc
                source_name = netloc or "Reference Source"
            else:
                source_name = "Reference Source"
        source_license = record.get("source_license") or "Web Reference"

        raw_retrieved = record.get("retrieved_at")
        if raw_retrieved:
            if isinstance(raw_retrieved, str):
                retrieved_at = datetime.fromisoformat(raw_retrieved.replace("Z", "+00:00"))
            elif isinstance(raw_retrieved, datetime):
                retrieved_at = raw_retrieved
            else:
                retrieved_at = datetime(2026, 9, 16, 0, 0, 0, tzinfo=timezone.utc)
        else:
            retrieved_at = datetime(2026, 9, 16, 0, 0, 0, tzinfo=timezone.utc)

        if record.get("verified") == "PASS":
            verification_status = "team-verified"
            verified_by = record.get("verified_by") or "content team"
            raw_verified_at = record.get("verified_at")
            if raw_verified_at:
                verified_at = (
                    datetime.fromisoformat(raw_verified_at.replace("Z", "+00:00"))
                    if isinstance(raw_verified_at, str)
                    else raw_verified_at
                )
            else:
                verified_at = datetime(2026, 9, 16, 0, 0, 0, tzinfo=timezone.utc)
        else:
            verification_status = record.get("verification_status", "source-linked-draft")
            verified_by = record.get("verified_by")
            raw_verified_at = record.get("verified_at")
            if raw_verified_at:
                verified_at = (
                    datetime.fromisoformat(raw_verified_at.replace("Z", "+00:00"))
                    if isinstance(raw_verified_at, str)
                    else raw_verified_at
                )
            else:
                verified_at = None

        values = {
            "species_id": record["species_id"],
            "display_order": int(record["display_order"]),
            "fact_text": fact_text,
            "source_name": source_name,
            "source_url": source_url,
            "source_license": source_license,
            "retrieved_at": retrieved_at,
            "verification_status": verification_status,
            "uncertainty_note": record.get("uncertainty_note"),
            "verified_by": verified_by,
            "verified_at": verified_at,
        }
        if not _is_child_facing_fun_fact(values["fact_text"]):
            values["verification_status"] = "rejected"
        predicate = (
            (species_fun_facts.c.species_id == values["species_id"])
            & (species_fun_facts.c.display_order == values["display_order"])
        )
        exists = connection.execute(select(species_fun_facts.c.id).where(predicate)).first()
        if exists:
            connection.execute(species_fun_facts.update().where(predicate).values(**values))
        else:
            connection.execute(species_fun_facts.insert().values(**values))

        fact_id = connection.execute(select(species_fun_facts.c.id).where(predicate)).scalar_one()
        for source in record.get("additional_sources", []):
            source_values = {"fact_id": fact_id, **source}
            source_exists = connection.execute(
                select(species_fun_fact_sources.c.id).where(
                    species_fun_fact_sources.c.fact_id == fact_id,
                    species_fun_fact_sources.c.source_url == source_values["source_url"],
                )
            ).first()
            if source_exists:
                connection.execute(
                    species_fun_fact_sources.update()
                    .where(species_fun_fact_sources.c.id == source_exists.id)
                    .values(**source_values)
                )
            else:
                connection.execute(species_fun_fact_sources.insert().values(**source_values))

    _set_metadata(connection, version_key, seed_version)
    _set_metadata(connection, keys_key, json.dumps(sorted(current_keys)))


def seed_iteration_two_chat_evidence(connection: Connection) -> None:
    """Load reviewed whitelist excerpts and revoke records removed from JSON.

    The repository starts with an empty list because every externally sourced
    excerpt needs a named reviewer and review timestamp. This is a data-review
    workflow, not arbitrary runtime web scraping.
    """
    if not ITERATION_2_CHAT_EVIDENCE.exists():
        return

    seed_version = hashlib.sha256(ITERATION_2_CHAT_EVIDENCE.read_bytes()).hexdigest()
    version_key = "iteration_2_chat_evidence_sha256"
    keys_key = "iteration_2_chat_evidence_seed_keys"
    current_version = connection.execute(
        select(app_metadata.c.value).where(app_metadata.c.key == version_key)
    ).scalar_one_or_none()
    records = json.loads(ITERATION_2_CHAT_EVIDENCE.read_text(encoding="utf-8"))
    current_keys = {
        _seed_key(record["species_id"], record["source_id"], record["source_url"], record["topic"])
        for record in records
    }
    if current_version == seed_version:
        if not connection.execute(select(app_metadata.c.key).where(app_metadata.c.key == keys_key)).first():
            _set_metadata(connection, keys_key, json.dumps(sorted(current_keys)))
        return

    previous_keys = _previous_seed_keys(connection, keys_key)
    for stale_key in previous_keys - current_keys:
        try:
            species_id, source_id, source_url, topic = json.loads(stale_key)
        except (TypeError, ValueError):
            continue
        if not all(isinstance(value, str) for value in (species_id, source_id, source_url, topic)):
            continue
        connection.execute(
            species_chat_evidence.update()
            .where(
                (species_chat_evidence.c.species_id == species_id)
                & (species_chat_evidence.c.source_id == source_id)
                & (species_chat_evidence.c.source_url == source_url)
                & (species_chat_evidence.c.topic == topic)
            )
            .values(verification_status="revoked")
        )

    for record in records:
        values = {
            **record,
            "retrieved_at": datetime.fromisoformat(record["retrieved_at"].replace("Z", "+00:00")),
            "verified_at": (
                datetime.fromisoformat(record["verified_at"].replace("Z", "+00:00"))
                if record.get("verified_at")
                else None
            ),
        }
        predicate = (
            (species_chat_evidence.c.species_id == values["species_id"])
            & (species_chat_evidence.c.source_id == values["source_id"])
            & (species_chat_evidence.c.source_url == values["source_url"])
            & (species_chat_evidence.c.topic == values["topic"])
        )
        existing = connection.execute(select(species_chat_evidence.c.id).where(predicate)).first()
        if existing:
            connection.execute(species_chat_evidence.update().where(predicate).values(**values))
        else:
            connection.execute(species_chat_evidence.insert().values(**values))

    _set_metadata(connection, version_key, seed_version)
    _set_metadata(connection, keys_key, json.dumps(sorted(current_keys)))
