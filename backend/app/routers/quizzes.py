from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text

from app.core.auth import AuthenticatedUser, get_current_user, get_optional_current_user
from app.core.database import engine
from app.schemas.quiz import QuizSubmitIn

router = APIRouter(tags=["Species Quizzes & Progression"])

PRESETS_PATH = Path(__file__).resolve().parents[2] / "data" / "species_quiz_presets.json"
_cached_presets: dict[str, Any] | None = None
DISCOVERED_CARD_NOT_FOUND = "Discovered Wildlife Card not found"


def get_quiz_presets() -> dict[str, Any]:
    global _cached_presets
    if _cached_presets is None:
        if not PRESETS_PATH.exists():
            raise HTTPException(500, "Species quiz presets not found. Run generate_validated_quizzes.py first.")
        with open(PRESETS_PATH, "r", encoding="utf-8") as f:
            _cached_presets = json.load(f)
    return _cached_presets


def get_or_create_progress(connection: Any, child_id: int, species_id: str) -> dict[str, Any]:
    row = connection.execute(
        text("SELECT * FROM child_quiz_progress WHERE child_id=:child_id AND species_id=:species_id"),
        {"child_id": child_id, "species_id": species_id},
    ).mappings().first()

    if row:
        row_dict = dict(row)
        if isinstance(row_dict.get("last_failed_set"), str):
            try:
                row_dict["last_failed_set"] = json.loads(row_dict["last_failed_set"])
            except Exception:
                row_dict["last_failed_set"] = {}
        elif row_dict.get("last_failed_set") is None:
            row_dict["last_failed_set"] = {}
        return row_dict

    # Check species exists
    sp = connection.execute(
        text("SELECT id FROM species WHERE id=:species_id"),
        {"species_id": species_id},
    ).first()
    if not sp:
        raise HTTPException(404, f"Species '{species_id}' not found")

    initial_failed: dict[str, Any] = {}
    connection.execute(
        text("""
            INSERT INTO child_quiz_progress
            (child_id, species_id, easy_passed, medium_passed, hard_passed, last_failed_set)
            VALUES (:child_id, :species_id, FALSE, FALSE, FALSE, :last_failed_set)
        """),
        {"child_id": child_id, "species_id": species_id, "last_failed_set": json.dumps(initial_failed)},
    )
    return {
        "child_id": child_id,
        "species_id": species_id,
        "easy_passed": False,
        "medium_passed": False,
        "hard_passed": False,
        "last_failed_set": initial_failed,
    }


def require_discovered_species(connection: Any, child_id: int, species_id: str) -> None:
    found = connection.execute(
        text(
            """
            SELECT 1 FROM collection_entries
            WHERE child_id=:child_id AND species_id=:species_id
            """
        ),
        {"child_id": child_id, "species_id": species_id},
    ).first()
    if not found:
        raise HTTPException(status.HTTP_404_NOT_FOUND, DISCOVERED_CARD_NOT_FOUND)


def require_difficulty_unlocked(progress: dict[str, Any], difficulty: str) -> None:
    if difficulty == "medium" and not progress["easy_passed"]:
        raise HTTPException(400, "Medium quiz is locked. Pass Easy with 5/5 first.")
    if difficulty == "hard" and not progress["medium_passed"]:
        raise HTTPException(400, "Hard quiz is locked. Pass Medium with 5/5 first.")


@router.get("/api/v1/species/{species_id}/quiz-progression")
def get_quiz_progression(
    species_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
):
    """
    Requires child access. Returns child's quiz progress for this species:
    {
        "species_id": ...,
        "easy_passed": bool,
        "medium_passed": bool,
        "hard_passed": bool,
        "unlocked_abilities": [1, 2, 3] depending on passed levels
    }
    """
    with engine.begin() as connection:
        progress = get_or_create_progress(connection, user.child_id, species_id)

    unlocked_abilities: list[int] = []
    if progress["easy_passed"]:
        unlocked_abilities.append(1)
    if progress["medium_passed"]:
        unlocked_abilities.append(2)
    if progress["hard_passed"]:
        unlocked_abilities.append(3)

    return {
        "species_id": species_id,
        "easy_passed": bool(progress["easy_passed"]),
        "medium_passed": bool(progress["medium_passed"]),
        "hard_passed": bool(progress["hard_passed"]),
        "unlocked_abilities": unlocked_abilities,
    }


@router.get("/api/v1/species/{species_id}/quiz")
def get_quiz(
    species_id: str,
    difficulty: str | None = Query(default=None, pattern="^(easy|medium|hard)$"),
    user: Annotated[AuthenticatedUser | None, Depends(get_optional_current_user)] = None,
):
    """
    If difficulty is omitted (e.g. legacy catalogue/anonymous visitor check):
    falls back to easy set 0 or legacy quizzes if not authenticated, returning questions format.

    When difficulty is specified (easy, medium, hard):
    - Requires the authenticated child's discovered Wildlife Card.
    - Validates sequential progression locking:
      - medium requires easy_passed
      - hard requires medium_passed
    - Selects set index (0, 1, or 2), avoiding last_failed_set if available.
    - Strips correct_answer from returned question objects.
    """
    presets = get_quiz_presets()

    # Legacy / unparameterized fallback for compatibility with existing tests and simple callers
    if difficulty is None:
        if species_id in presets and "easy" in presets[species_id] and presets[species_id]["easy"]:
            q_set = presets[species_id]["easy"][0]
            # Strip correct_answer
            return {
                "species_id": species_id,
                "questions": [{"id": q["id"], "question": q["question"], "options": q["options"]} for q in q_set],
            }
        # Fallback to DB quizzes table if needed
        with engine.connect() as connection:
            row = connection.execute(
                text("SELECT questions_json FROM quizzes WHERE species_id=:id ORDER BY version DESC LIMIT 1"),
                {"id": species_id}
            ).mappings().first()
        if not row:
            raise HTTPException(404, f"Quiz not found for species '{species_id}'")
        return {"species_id": species_id, "questions": row["questions_json"]}

    # Authenticated child progression check
    if not user:
        raise HTTPException(401, "Authentication required to access level quiz progression")

    if species_id not in presets:
        raise HTTPException(404, f"Quiz not found for species '{species_id}'")

    species_quizzes = presets[species_id]
    if difficulty not in species_quizzes or not species_quizzes[difficulty]:
        raise HTTPException(404, f"No quizzes found for difficulty '{difficulty}'")

    with engine.begin() as connection:
        require_discovered_species(connection, user.child_id, species_id)
        progress = get_or_create_progress(connection, user.child_id, species_id)

    require_difficulty_unlocked(progress, difficulty)

    # Pick a set index (0, 1, or 2)
    available_sets = [0, 1, 2]
    last_failed = progress.get("last_failed_set", {}) or {}
    last_failed_idx = last_failed.get(difficulty)

    if last_failed_idx is not None and last_failed_idx in available_sets:
        # Avoid the immediately failed set
        candidates = [idx for idx in available_sets if idx != last_failed_idx]
    else:
        candidates = available_sets

    set_idx = random.choice(candidates)
    raw_questions = species_quizzes[difficulty][set_idx]

    # Strip correct_answer from returned question objects
    client_questions = []
    for q in raw_questions:
        client_questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
        })

    return {
        "species_id": species_id,
        "difficulty": difficulty,
        "set_index": set_idx,
        "questions": client_questions,
    }


@router.post("/api/v1/species/{species_id}/quiz/submit")
def submit_quiz(
    species_id: str,
    payload: QuizSubmitIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
):
    """
    Accepts: { "difficulty": str, "set_index": int, "answers": { "easy_s0_q1": "...", ... } }
    Requires a discovered Wildlife Card and sequential difficulty unlock.
    Graded against validated presets.
    Score 5/5 = Passed -> ability unlocked, mark passed in database.
    Score < 5 = Not Passed -> record last_failed_set.
    """
    presets = get_quiz_presets()
    if species_id not in presets:
        raise HTTPException(404, f"Quiz not found for species '{species_id}'")

    species_quizzes = presets[species_id]
    difficulty = payload.difficulty
    set_idx = payload.set_index

    if difficulty not in species_quizzes or set_idx >= len(species_quizzes[difficulty]):
        raise HTTPException(400, f"Invalid difficulty '{difficulty}' or set_index {set_idx}")

    questions = species_quizzes[difficulty][set_idx]
    total = len(questions)

    with engine.begin() as connection:
        require_discovered_species(connection, user.child_id, species_id)
        progress = get_or_create_progress(connection, user.child_id, species_id)
        require_difficulty_unlocked(progress, difficulty)

        # Grade only after the card and difficulty are eligible.
        correct_count = 0
        for idx, q in enumerate(questions):
            q_id = q["id"]
            # Accept answer keyed either by question id or by "q{idx}" / index
            selected = payload.answers.get(q_id)
            if selected is None:
                selected = payload.answers.get(f"q{idx}")
            if selected is None:
                selected = payload.answers.get(str(idx))

            if selected is not None and selected.strip() == q["correct_answer"].strip():
                correct_count += 1

        passed = (correct_count == total)
        last_failed = dict(progress.get("last_failed_set") or {})

        if passed:
            updates = []
            params: dict[str, Any] = {"child_id": user.child_id, "species_id": species_id}

            if difficulty == "easy":
                updates.append("easy_passed = TRUE")
                ability_unlocked = 1
            elif difficulty == "medium":
                updates.append("medium_passed = TRUE")
                ability_unlocked = 2
            elif difficulty == "hard":
                updates.append("hard_passed = TRUE")
                ability_unlocked = 3
            else:
                ability_unlocked = None

            # Remove difficulty from last_failed_set if passed
            if difficulty in last_failed:
                last_failed.pop(difficulty)
                updates.append("last_failed_set = :last_failed_set")
                params["last_failed_set"] = json.dumps(last_failed)

            set_clause = ", ".join(updates)
            connection.execute(
                text(f"UPDATE child_quiz_progress SET {set_clause} WHERE child_id=:child_id AND species_id=:species_id"),
                params,
            )

            return {
                "score": correct_count,
                "total": total,
                "passed": True,
                "ability_unlocked": ability_unlocked,
                "message": f"{correct_count} / {total} — Quiz Passed! Ability Unlocked!",
            }
        else:
            # Not passed
            last_failed[difficulty] = set_idx
            connection.execute(
                text("""
                    UPDATE child_quiz_progress
                    SET last_failed_set = :last_failed_set
                    WHERE child_id=:child_id AND species_id=:species_id
                """),
                {
                    "last_failed_set": json.dumps(last_failed),
                    "child_id": user.child_id,
                    "species_id": species_id,
                },
            )

            return {
                "score": correct_count,
                "total": total,
                "passed": False,
                "ability_unlocked": None,
                "message": f"{correct_count} / {total} — Almost there! Get all 5 correct to unlock this ability.",
            }
