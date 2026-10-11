#!/usr/bin/env python3
"""Focused Iteration 3 acceptance-contract checks for the latest repository."""

from __future__ import annotations

import json
import ast
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

    def assignment(path: Path, name: str):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in tree.body:
            if isinstance(node, (ast.Assign, ast.AnnAssign)):
                target = node.target if isinstance(node, ast.AnnAssign) else node.targets[0]
                if isinstance(target, ast.Name) and target.id == name:
                    return ast.literal_eval(node.value)
        raise AssertionError(f"Missing {name} in {path}")

    seed_py = backend / "app" / "core" / "seed.py"
    locations_py = backend / "app" / "routers" / "locations.py"
    retained_ids = set(assignment(seed_py, "ITERATION_1_LOCATION_IDS"))
    type_overrides = assignment(seed_py, "LOCATION_TYPE_OVERRIDES")
    extra_locations = assignment(seed_py, "EXTRA_LOCATIONS")
    allowed_ids = set(assignment(locations_py, "KL_SELANGOR_LOCATION_IDS"))
    allowed_types = set(assignment(locations_py, "LOCATION_TYPES"))

    db = sqlite3.connect(":memory:")
    try:
        db.executescript((backend / "data" / "seed.sql").read_text(encoding="utf-8"))
        base_locations = {
            row[0]: {"id": row[0], "type": type_overrides[row[0]]}
            for row in db.execute("SELECT id FROM locations") if row[0] in retained_ids
        }
    finally:
        db.close()
    runtime_locations = {**base_locations, **{row["id"]: row for row in extra_locations}}
    require(set(runtime_locations) == allowed_ids,
            "Runtime seed and child-facing location allowlist differ")
    categories = {row["type"] for row in runtime_locations.values()}
    require(categories == allowed_types,
            "Location categories do not match the Iteration 3 contract")

    battle_ui = (frontend / "src/components/screens/wildlifeBattle/lobby/DeckCard.tsx").read_text(encoding="utf-8")
    battle_router = (backend / "app/routers/wildlife_matches.py").read_text(encoding="utf-8")
    require("Used cards rest for 2 hours after a match" in battle_ui, "Two-hour rest copy is missing")
    require("CARD_REST_HOURS = 2" in battle_router, "Two-hour rest rule is missing")

    ai_policy = json.loads((backend / "data" / "wildlife_ai_policy.json").read_text(encoding="utf-8"))
    require(ai_policy.get("version") == 2,
            "Committed AI policy does not use the complete state schema")
    require(ai_policy.get("training", {}).get("completed_training_matches") == 1500,
            "Committed AI policy does not record 1,500 completed training matches")
    require(ai_policy.get("q_values"), "Committed AI policy has no learned state-action values")
    require({"own_hp", "opponent_hp", "own_energy", "opponent_energy",
             "habitat_advantage", "own_unlocked_abilities",
             "opponent_unlocked_abilities", "action"}.issubset(ai_policy.get("state_features", [])),
            "AI policy state schema omits required Battle state")

    ai_evaluation = json.loads(
        (backend / "data" / "wildlife_ai_evaluation.json").read_text(encoding="utf-8")
    )["evaluation"]
    require(ai_evaluation.get("games_per_profile", 0) >= 1520,
            "AI evaluation lacks ten games per Wildlife Card and opponent profile")
    require(ai_evaluation.get("review", {}).get("status") == "completed",
            "AI pre-release review is not completed")
    require(ai_evaluation.get("review", {}).get("release_readiness") == "ready",
            "AI pre-release review did not approve the evaluated policy")
    require(not ai_evaluation.get("review", {}).get("persistent_outliers"),
            "AI pre-release review retained unresolved card/habitat outliers")
    for profile in ("random", "simple"):
        report = ai_evaluation.get("profiles", {}).get(profile, {})
        require(report.get("games_completed") == ai_evaluation["games_per_profile"],
                f"AI {profile} evaluation did not complete")
        coverage = report.get("coverage", {})
        require(len([key for key in coverage if key.startswith("scenario:")]) == 8,
                f"AI {profile} evaluation lacks all controlled scenarios")
    review_text = (backend / "reports" / "wildlife_ai_release_review.md").read_text(encoding="utf-8")
    require("Review status: completed." in review_text and "Release readiness: ready." in review_text,
            "Retained AI release review is incomplete")

    print("PASS: Iteration 3 focused contract checks")
    print(f"quiz_questions={len(quiz_rows)} species={len(by_species)} locations={len(runtime_locations)}")
    print(f"location_categories={sorted(categories)}")
    print(f"ai_training_matches={ai_policy['training']['completed_training_matches']} learned_state_actions={len(ai_policy['q_values'])}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: test_iteration3_plan_contract.py REPOSITORY_ROOT")
    main(sys.argv[1])
