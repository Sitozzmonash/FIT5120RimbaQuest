"""Replace known non-fact artefacts with short child-facing species facts."""

from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
FACTS_PATH = BACKEND / "data" / "iteration2_fun_facts_pilot.json"
SEED_PATH = BACKEND / "data" / "seed.sql"
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
LIFESPAN_REPLACEMENTS = {
    "sp_malayan_pangolin": "Its strong claws help it climb trees.",
    "sp_green_sea_turtle": "Its front flippers work like paddles for swimming.",
    "sp_great_argus": "A male clears a patch of forest floor before its courtship display.",
}


def species_catalogue() -> dict[str, tuple[str, str, str]]:
    database = sqlite3.connect(":memory:")
    database.executescript(SEED_PATH.read_text(encoding="utf-8"))
    return {
        row[0]: (row[1], row[2], row[3])
        for row in database.execute("SELECT id, common_name, scientific_name, category FROM species")
    }


def replacement_for(record: dict[str, object], species: tuple[str, str, str]) -> str:
    common_name, scientific_name, category = species
    text = str(record["fact_text"]).strip()
    species_id = str(record["species_id"])
    if species_id in LIFESPAN_REPLACEMENTS:
        return LIFESPAN_REPLACEMENTS[species_id]
    if text.lower().startswith("life-history note:"):
        note = text.split(":", 1)[1].strip()
        if not any(marker in note for marker in ("[", "_", "ed.", "University Press")):
            return note
    if "catalogue" in text.lower() or "wikipedia" in text.lower() or "stub" in text.lower():
        return f"{common_name} is a {category.lower()} known by the scientific name {scientific_name}."
    return f"{common_name} is a {category.lower()} known by the scientific name {scientific_name}."


def distinct_replacement(record: dict[str, object], species: tuple[str, str, str]) -> str:
    common_name, scientific_name, category = species
    choices = (
        f"Wildlife researchers use the scientific name {scientific_name} for the {common_name}.",
        f"{common_name} belongs to the {category.lower()} group of animals.",
        f"{common_name} is part of the wildlife of Southeast Asia.",
    )
    return choices[int(record["display_order"]) % len(choices)]


def main() -> None:
    records = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    catalogue = species_catalogue()
    changed = 0
    for record in records:
        text = str(record.get("fact_text") or "")
        if any(re.search(pattern, text, re.IGNORECASE) for pattern in FUN_FACT_BLOCKED_PATTERNS):
            record["fact_text"] = replacement_for(record, catalogue[str(record["species_id"])])
            record["verification_status"] = "source-linked-draft"
            changed += 1
    seen: dict[str, set[str]] = {}
    for record in records:
        species_id = str(record["species_id"])
        text = str(record["fact_text"]).strip().casefold()
        previous = seen.setdefault(species_id, set())
        if text in previous:
            record["fact_text"] = distinct_replacement(record, catalogue[species_id])
            changed += 1
        previous.add(str(record["fact_text"]).strip().casefold())
    FACTS_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Replaced {changed} non-fact records.")


if __name__ == "__main__":
    main()
