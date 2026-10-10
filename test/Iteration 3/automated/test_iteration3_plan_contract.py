#!/usr/bin/env python3
"""Focused Iteration 3 acceptance-contract checks for the latest repository."""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main(repo_root: str) -> None:
    root = Path(repo_root).resolve()
    backend = root / "backend"
    frontend = root / "rimbaquest"

    quiz_rows = json.loads((backend / "data" / "ai_quiz_questions.json").read_text(encoding="utf-8"))
    require(len(quiz_rows) == 6840, "Expected 6,840 generated quiz questions")
    by_species: dict[str, dict[str, set[str]]] = {}
    for row in quiz_rows:
        species = str(row["species_id"])
        difficulty = str(row["difficulty"]).lower()
        question = " ".join(str(row["question"]).casefold().split())
        by_species.setdefault(species, {}).setdefault(difficulty, set()).add(question)
        require(row.get("source_refs"), f"Missing source_refs for {row.get('id')}")
        require(str(row.get("correct_answer")) in [str(option) for option in row.get("options", [])],
                f"Correct answer not present in options for {row.get('id')}")
    require(len(by_species) == 152, "Expected quiz coverage for 152 species")
    overlaps: list[str] = []
    for species, levels in by_species.items():
        require(set(levels) == {"easy", "medium", "hard"}, f"Missing difficulty for {species}")
        for first, second in (("easy", "medium"), ("easy", "hard"), ("medium", "hard")):
            for question in sorted(levels[first] & levels[second]):
                overlaps.append(f"{species}: {first}/{second}: {question}")
    require(not overlaps, "Duplicate questions across difficulty levels: " + "; ".join(overlaps))

    chat_ui = (frontend / "src/components/screens/collection/components/chat/ChatBubble.tsx").read_text(encoding="utf-8")
    require("View source" in chat_ui, "Chat UI must expose clickable source links")

    locations_ui = (frontend / "src/components/screens/locations/LocationsScreen.tsx").read_text(encoding="utf-8")
    consent_ui = (frontend / "src/components/screens/locations/components/LocationConsentModal.tsx").read_text(encoding="utf-8")
    require("No matching locations found" in locations_ui, "No-results guidance is missing")
    require("Share your location?" in consent_ui and "never save" in consent_ui,
            "Location permission/privacy explanation is missing")

    db = sqlite3.connect(":memory:")
    try:
        db.executescript((backend / "data" / "seed.sql").read_text(encoding="utf-8"))
        count = db.execute("SELECT COUNT(*) FROM locations").fetchone()[0]
        categories = {row[0] for row in db.execute("SELECT DISTINCT type FROM locations")}
    finally:
        db.close()
    require(count == 22, "Expected 22 seeded locations")
    require(categories == {
        "Zoo", "Wildlife Park", "Petting Zoo", "Aquarium",
        "Forest Park", "Nature Park", "Botanical Garden",
    }, "Location categories do not match the Iteration 3 contract")

    battle_ui = (frontend / "src/components/screens/wildlifeBattle/lobby/DeckCard.tsx").read_text(encoding="utf-8")
    battle_router = (backend / "app/routers/wildlife_matches.py").read_text(encoding="utf-8")
    require("Used cards rest for 2 hours after a match" in battle_ui, "Two-hour rest copy is missing")
    require("CARD_REST_HOURS = 2" in battle_router, "Two-hour rest rule is missing")

    ai_policy = json.loads((backend / "data" / "wildlife_ai_policy.json").read_text(encoding="utf-8"))
    require(ai_policy.get("training", {}).get("completed_training_matches") == 1500,
            "Committed AI policy does not record 1,500 completed training matches")
    require(ai_policy.get("q_values"), "Committed AI policy has no learned state-action values")

    print("PASS: Iteration 3 focused contract checks")
    print(f"quiz_questions={len(quiz_rows)} species={len(by_species)} locations={count}")
    print(f"location_categories={sorted(categories)}")
    print(f"ai_training_matches={ai_policy['training']['completed_training_matches']} learned_state_actions={len(ai_policy['q_values'])}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: test_iteration3_plan_contract.py REPOSITORY_ROOT")
    main(sys.argv[1])
