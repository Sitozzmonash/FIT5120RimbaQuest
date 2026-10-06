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

from app.core.config import ITERATION_2_CHAT_EVIDENCE, ITERATION_3_FUN_FACTS, SEED_SQL
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

# Epic 2 narrows the catalogue to KL + Selangor and introduces location
# categories (zoo, wildlife park, petting zoo, aquarium, forest park, nature
# park, botanical garden) as the child-facing filter.
LOCATION_TYPE_OVERRIDES = {
    "loc_bukit_gasing": "Forest Park",
    "loc_frim": "Forest Park",
    "loc_kuala_selangor": "Nature Park",
    "loc_per_paya_indah": "Nature Park",
}

LOCATION_ENRICHMENTS = {
    "loc_bukit_gasing": (
        "Persiaran Bukit Gasing, Seksyen 5, 46000 Petaling Jaya, Selangor",
        "Butterflies, Birds, Small Mammals",
    ),
    "loc_frim": (
        "Forest Research Institute Malaysia, 52109 Kepong, Selangor",
        "Rainforest Canopy Birds, Mammals, Butterflies",
    ),
    "loc_kuala_selangor": (
        "Kuala Selangor Nature Park, Jalan Klinik, 45000 Kuala Selangor, Selangor",
        "Mangrove Birds, Reptiles, Fireflies",
    ),
    "loc_per_paya_indah": (
        "Paya Indah Wetlands, Persiaran Paya Indah, 43800 Dengkil, Selangor",
        "Wetland Birds, Sun Bears, Crocodiles, Reptiles",
    ),
}

EXTRA_LOCATIONS = [
    {
        "id": "loc_kl_forest_eco_park",
        "name": "KL Forest Eco Park",
        "type": "Forest Park",
        "lat": 3.151,
        "lng": 101.703,
        "verified": True,
        "description": "A pocket of lowland rainforest in the heart of Kuala Lumpur, beside the KL Tower.",
        "facilities": ["Trails", "Boardwalk", "Rest area"],
        "best_time": "Daily, 8:00 AM–4:30 PM",
        "distance_km": 3.5,
        "why_recommended": "Easy city-centre forest paths where birds and small mammals have previously been observed.",
        "area": "Jalan Raja Chulan, Bukit Nanas, 50250 Kuala Lumpur",
        "typical_wildlife": "Birds, Small Mammals, Butterflies",
    },
    {
        "id": "loc_perdana_botanical",
        "name": "Perdana Botanical Gardens",
        "type": "Botanical Garden",
        "lat": 3.143,
        "lng": 101.685,
        "verified": True,
        "description": "Kuala Lumpur's main botanical gardens with lakes, lawns and planted forest edges.",
        "facilities": ["Paths", "Parking", "Restroom", "Playground"],
        "best_time": "Daily, 6:30 AM–10:00 PM",
        "distance_km": 2.0,
        "why_recommended": "Open garden paths where butterflies and garden birds may be encountered.",
        "area": "Jalan Kebun Bunga, Perdana Botanical Gardens, 55100 Kuala Lumpur",
        "typical_wildlife": "Butterflies, Birds",
    },
    {
        "id": "loc_zoo_negara",
        "name": "Zoo Negara",
        "type": "Zoo",
        "lat": 3.2106,
        "lng": 101.7586,
        "verified": True,
        "description": "Malaysia's national zoo, where you can meet tigers, orangutans, elephants and many other animals in one safe park.",
        "facilities": ["Animal exhibits", "Feeding shows", "Playground", "Food stalls"],
        "best_time": "Daily, 9:00 AM–5:00 PM",
        "distance_km": 8.0,
        "why_recommended": "The easiest way to see many Malaysian animals close up, with feeding shows all day.",
        "area": "Zoo Negara, Jalan Ulu Klang, 68000 Ampang, Selangor",
        "typical_wildlife": "Malayan Tigers, Orangutans, Elephants, Birds, Reptiles",
    },
    {
        "id": "loc_aquaria_klcc",
        "name": "Aquaria KLCC",
        "type": "Aquarium",
        "lat": 3.1532,
        "lng": 101.7131,
        "verified": True,
        "description": "An indoor aquarium beneath KLCC with a see-through tunnel where sharks and rays swim overhead.",
        "facilities": ["Tunnel aquarium", "Touch pool", "Gift shop"],
        "best_time": "Daily, 10:00 AM–8:00 PM",
        "distance_km": 1.0,
        "why_recommended": "Perfect for a rainy day — watch sharks, rays and sea turtles up close without getting wet.",
        "area": "Kuala Lumpur Convention Centre, Jalan Pinang, 50088 Kuala Lumpur",
        "typical_wildlife": "Sharks, Rays, Sea Turtles, Tropical Fish",
    },
    {
        "id": "loc_kl_bird_park",
        "name": "KL Bird Park",
        "type": "Wildlife Park",
        "lat": 3.1426,
        "lng": 101.6882,
        "verified": True,
        "description": "The world's largest free-flight walk-in bird park, with hornbills, flamingos and parrots flying freely.",
        "facilities": ["Free-flight aviaries", "Bird shows", "Trails", "Parking"],
        "best_time": "Daily, 9:00 AM–6:00 PM",
        "distance_km": 2.5,
        "why_recommended": "Walk among hundreds of birds under a huge netted canopy — sightings are almost guaranteed.",
        "area": "920 Jalan Cenderawasih, Perdana Botanical Gardens, 50480 Kuala Lumpur",
        "typical_wildlife": "Hornbills, Flamingos, Parrots, Peacocks",
    },
    {
        "id": "loc_kl_butterfly_park",
        "name": "KL Butterfly Park",
        "type": "Wildlife Park",
        "lat": 3.1424,
        "lng": 101.6908,
        "verified": True,
        "description": "A shaded garden alive with thousands of tropical butterflies and small waterfalls.",
        "facilities": ["Enclosed garden", "Waterfalls", "Rest area"],
        "best_time": "Daily, 9:00 AM–6:00 PM",
        "distance_km": 2.6,
        "why_recommended": "Butterflies land right on you in this calm garden beside the Bird Park.",
        "area": "Jalan Cenderawasih, Perdana Botanical Gardens, 50480 Kuala Lumpur",
        "typical_wildlife": "Butterflies, Dragonflies",
    },
    {
        "id": "loc_farm_in_the_city",
        "name": "Farm in the City",
        "type": "Petting Zoo",
        "lat": 2.9925,
        "lng": 101.713,
        "verified": True,
        "description": "An open farm in the city where you can feed and pet friendly farm animals like goats, rabbits and tortoises.",
        "facilities": ["Animal feeding", "Playground", "Food stalls", "Parking"],
        "best_time": "Daily, 9:30 AM–6:00 PM",
        "distance_km": 18.0,
        "why_recommended": "Hands-on feeding and petting — the friendliest animals for younger explorers.",
        "area": "Lot 40160, Jalan PS 7, Prima Saujana, 43300 Seri Kembangan, Selangor",
        "typical_wildlife": "Goats, Rabbits, Tortoises, Birds",
    },
    {
        "id": "loc_taman_tugu",
        "name": "Taman Tugu",
        "type": "Forest Park",
        "lat": 3.1498,
        "lng": 101.6831,
        "verified": True,
        "description": "A young urban forest of 4,000 trees at the heart of KL, with gentle walking trails.",
        "facilities": ["Trails", "Interpretive boards", "Rest area"],
        "best_time": "Daily, 7:00 AM–7:00 PM",
        "distance_km": 2.8,
        "why_recommended": "Quiet forest paths minutes from the city centre.",
        "area": "Jalan Tugu, 50480 Kuala Lumpur",
        "typical_wildlife": "Birds, Butterflies, Small Mammals",
    },
    {
        "id": "loc_templer_park",
        "name": "Templer's Park",
        "type": "Forest Park",
        "lat": 3.3,
        "lng": 101.631,
        "verified": True,
        "description": "A free jungle park with waterfalls, streams and tall rainforest trees.",
        "facilities": ["Waterfall pools", "Trails", "Picnic area", "Parking"],
        "best_time": "Daily, 7:00 AM–7:00 PM",
        "distance_km": 20.0,
        "why_recommended": "Swim at the waterfall, then look for monkeys and birds along the jungle trails.",
        "area": "Jalan Templer, 48000 Rawang, Selangor",
        "typical_wildlife": "Birds, Butterflies, Long-tailed Macaques",
    },
    {
        "id": "loc_kanching",
        "name": "Kanching Rainforest Waterfall",
        "type": "Forest Park",
        "lat": 3.26,
        "lng": 101.633,
        "verified": True,
        "description": "A seven-tier waterfall forest park with clear pools for a family picnic.",
        "facilities": ["Waterfall pools", "Picnic area", "Parking"],
        "best_time": "Daily, 7:00 AM–6:00 PM",
        "distance_km": 25.0,
        "why_recommended": "Cool waterfall pools and easy paths — a great weekend escape.",
        "area": "Jalan Rawang–Batu Caves, 48000 Rawang, Selangor",
        "typical_wildlife": "Birds, Butterflies",
    },
    {
        "id": "loc_eko_rimba_komanwel",
        "name": "Taman Eko Rimba Komanwel",
        "type": "Forest Park",
        "lat": 3.279,
        "lng": 101.564,
        "verified": True,
        "description": "A forest park with a treetop canopy walkway and gentle lake trails.",
        "facilities": ["Canopy walkway", "Trails", "Parking"],
        "best_time": "Daily, 8:00 AM–6:00 PM",
        "distance_km": 30.0,
        "why_recommended": "A safe canopy walk above the forest where birds and butterflies pass close by.",
        "area": "Bandar Tasik Puteri, 48020 Rawang, Selangor",
        "typical_wildlife": "Birds, Butterflies, Small Mammals",
    },
    {
        "id": "loc_sungai_chongkak",
        "name": "Sungai Chongkak Recreational Forest",
        "type": "Forest Park",
        "lat": 3.116,
        "lng": 101.833,
        "verified": True,
        "description": "A riverside forest park with clear water, ideal for picnics and spotting kingfishers.",
        "facilities": ["River beach", "Picnic area", "BBQ pits", "Parking"],
        "best_time": "Daily, 8:00 AM–6:00 PM",
        "distance_km": 35.0,
        "why_recommended": "Shallow clear river pools and shaded banks full of birdlife.",
        "area": "Jalan Sungai Chongkak, 43100 Hulu Langat, Selangor",
        "typical_wildlife": "Birds, Kingfishers, Small Mammals",
    },
    {
        "id": "loc_kota_damansara_cf",
        "name": "Kota Damansara Community Forest",
        "type": "Forest Park",
        "lat": 3.162,
        "lng": 101.59,
        "verified": True,
        "description": "A community forest with walking trails through secondary rainforest.",
        "facilities": ["Trails", "Rest area"],
        "best_time": "Daily, 7:00 AM–7:00 PM",
        "distance_km": 15.0,
        "why_recommended": "Easy forest trails where birds, butterflies and squirrels are often seen.",
        "area": "Jalan Merbah 10/1, Kota Damansara, 47810 Petaling Jaya, Selangor",
        "typical_wildlife": "Birds, Butterflies, Squirrels",
    },
    {
        "id": "loc_taman_rimba_kiara",
        "name": "Taman Rimba Kiara",
        "type": "Forest Park",
        "lat": 3.141,
        "lng": 101.628,
        "verified": True,
        "description": "A hilly forest reserve in TTDI with shaded trails and a stream.",
        "facilities": ["Trails", "Stream", "Rest area"],
        "best_time": "Daily, 6:30 AM–7:00 PM",
        "distance_km": 9.0,
        "why_recommended": "Gentle shaded trails near the city, popular for birds and butterflies.",
        "area": "Jalan Abang Haji Openg, Taman Tun Dr Ismail, 60000 Kuala Lumpur",
        "typical_wildlife": "Birds, Butterflies, Squirrels",
    },
    {
        "id": "loc_botani_shah_alam",
        "name": "Taman Botani Negara Shah Alam",
        "type": "Botanical Garden",
        "lat": 3.072,
        "lng": 101.517,
        "verified": True,
        "description": "A huge lakeside botanical park in Shah Alam with themed gardens and bamboo forests.",
        "facilities": ["Themed gardens", "Lakeside trails", "Bicycle rental", "Parking"],
        "best_time": "Daily, 8:00 AM–6:00 PM",
        "distance_km": 30.0,
        "why_recommended": "Room to run, bikes to ride, and plenty of butterflies in the flower gardens.",
        "area": "Jalan Taman Botani, 40100 Shah Alam, Selangor",
        "typical_wildlife": "Butterflies, Birds",
    },
    {
        "id": "loc_bukit_melawati",
        "name": "Bukit Melawati",
        "type": "Nature Park",
        "lat": 3.343,
        "lng": 101.246,
        "verified": True,
        "description": "A hilltop fort in Kuala Selangor where silver leaf monkeys live right on the paths.",
        "facilities": ["Fort", "Lookout", "Boardwalk", "Parking"],
        "best_time": "Daily, 7:00 AM–7:00 PM",
        "distance_km": 62.0,
        "why_recommended": "Silver leaf monkeys and flying foxes are almost guaranteed near the fort.",
        "area": "Bukit Melawati, 45000 Kuala Selangor, Selangor",
        "typical_wildlife": "Silver Leaf Monkeys, Birds",
    },
    {
        "id": "loc_kg_kuantan_firefly",
        "name": "Kampung Kuantan Firefly Park",
        "type": "Nature Park",
        "lat": 3.35,
        "lng": 101.22,
        "verified": True,
        "description": "A riverside kampung where night boat tours watch thousands of fireflies flashing in the mangroves.",
        "facilities": ["Night boat tours", "Jetty", "Parking"],
        "best_time": "Nightly, 7:30 PM–11:00 PM",
        "distance_km": 68.0,
        "why_recommended": "A magical evening boat ride as fireflies light up the mangrove trees.",
        "area": "Jalan Bukit Belimbing, 45000 Kuala Selangor, Selangor",
        "typical_wildlife": "Fireflies",
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
    # The version must cover the seed.py location data too, otherwise edits to
    # LOCATION_ENRICHMENTS / EXTRA_LOCATIONS would be skipped on databases that
    # already carry an older seed.sql hash.
    location_seed_content = json.dumps(
        [LOCATION_ENRICHMENTS, LOCATION_TYPE_OVERRIDES, EXTRA_LOCATIONS],
        sort_keys=True,
        ensure_ascii=False,
    ).encode("utf-8")
    seed_version = hashlib.sha256(SEED_SQL.read_bytes() + location_seed_content).hexdigest()
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
        row["type"] = LOCATION_TYPE_OVERRIDES[row["id"]]

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


def seed_iteration_three_fun_facts(connection: Connection) -> None:
    """Load the team-verified Iteration 3 Fun Fact corpus.

    The source workbook contains 10 reviewed facts for each supported species.
    Every source URL belongs to the reviewed record, so it remains available
    as a citation without passing the separate live-source whitelist. Content
    that is not child-facing remains rejected even if it is source-linked.
    """
    if not ITERATION_3_FUN_FACTS.exists():
        return

    seed_version = hashlib.sha256(
        ITERATION_3_FUN_FACTS.read_bytes() + FUN_FACT_CONTENT_POLICY_VERSION.encode()
    ).hexdigest()
    version_key = "iteration_3_fun_facts_sha256"
    keys_key = "iteration_3_fun_facts_seed_keys"
    current_version = connection.execute(
        select(app_metadata.c.value).where(app_metadata.c.key == version_key)
    ).scalar_one_or_none()
    records = json.loads(ITERATION_3_FUN_FACTS.read_text(encoding="utf-8"))
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
        # Source links are seed-owned as a set. Replacing them avoids a
        # withdrawn or changed workbook URL remaining visible to a child.
        connection.execute(
            species_fun_fact_sources.delete().where(species_fun_fact_sources.c.fact_id == fact_id)
        )
        for source in record.get("additional_sources", []):
            connection.execute(
                species_fun_fact_sources.insert().values(fact_id=fact_id, **source)
            )

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
