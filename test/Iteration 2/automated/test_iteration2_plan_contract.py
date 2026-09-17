"""Focused reproducible checks for the Iteration 2 Plan baseline.

Run from the current FIT5120RimbaQuest backend directory:

PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 uv run --no-project --with-requirements \
requirements.txt python /absolute/path/to/test_iteration2_plan_contract.py

This test artefact creates its own SQLite database and prints non-sensitive
evidence only. AC4.5.1 and AC4.5.10 now assert the repaired server-side
gates; AC4.5.6 remains the amended client check.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from collections import defaultdict
from pathlib import Path


REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "backend"))
_tmp_dir = tempfile.mkdtemp(prefix="rimbaquest-i2-contract-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp_dir, 'i2.db').as_posix()}"
os.environ["JWT_SECRET"] = "iteration-two-local-contract-test-secret"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


client = TestClient(app)


def _register() -> tuple[int, dict[str, str]]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "i2_contract_child",
            "age": 10,
            "email": "i2_contract_child@rimbaquest.test",
            "password": "localTestOnlyPassword123",
            "avatar": "hornbill",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    return body["child_id"], {"Authorization": f"Bearer {body['access_token']}"}


def main() -> None:
    child_id, headers = _register()
    species_id = "sp_malayan_tiger"

    collection = client.get(f"/api/v1/children/{child_id}/collection", headers=headers)
    assert not any(item["discovered"] for item in collection.json()["items"])
    response = client.get(
        f"/api/v1/species/{species_id}/quiz?difficulty=easy", headers=headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Discovered Wildlife Card not found"
    print("AC4.5.1 Pass: undiscovered-card Easy quiz is rejected")

    presets = json.loads((REPO / "backend/data/species_quiz_presets.json").read_text())
    medium_questions = presets[species_id]["medium"][0]
    response = client.post(
        f"/api/v1/species/{species_id}/quiz/submit",
        headers=headers,
        json={
            "difficulty": "medium",
            "set_index": 0,
            "answers": {q["id"]: q["correct_answer"] for q in medium_questions},
        },
    )
    assert response.status_code in {400, 404}
    progress = client.get(
        f"/api/v1/species/{species_id}/quiz-progression", headers=headers
    ).json()
    assert progress["easy_passed"] is False and progress["medium_passed"] is False
    print("AC4.5.10 Pass: direct Medium 5/5 is rejected and medium_passed stays false")

    facts_tab = (REPO / "rimbaquest/src/components/screens/collection/components/FactsTab.tsx").read_text()
    assert "api/v1/species/${speciesId}/fun-facts" in facts_tab
    assert "payload.facts.slice(0, 10)" in facts_tab
    assert "Wild animals need quiet space in their homes." not in facts_tab
    print("AC4.4.1 Pass: FactsTab renders up to 10 API fun facts")

    quiz_screen = (REPO / "rimbaquest/src/components/screens/collection/AbilityQuizScreen.tsx").read_text()
    assert "disabled={!selected || submitting}" in quiz_screen
    print("AC4.5.6 retest Pass: Next is disabled until an answer is selected; the amended AC does not require a message")

    malformed = []
    cross_level_duplicates = []
    for item_id, levels in presets.items():
        question_text_by_level = {}
        for difficulty in ("easy", "medium", "hard"):
            sets = levels.get(difficulty, [])
            questions = [question for question_set in sets for question in question_set]
            question_text_by_level[difficulty] = {question["question"] for question in questions}
            if (
                len(sets) != 3
                or any(len(question_set) != 5 for question_set in sets)
                or any(len(question["options"]) != 3 for question in questions)
                or any(question["correct_answer"] not in question["options"] for question in questions)
            ):
                malformed.append((item_id, difficulty))
        if (
            question_text_by_level["easy"] & question_text_by_level["medium"]
            or question_text_by_level["easy"] & question_text_by_level["hard"]
            or question_text_by_level["medium"] & question_text_by_level["hard"]
        ):
            cross_level_duplicates.append(item_id)
    facts = json.loads((REPO / "backend/data/iteration2_fun_facts_pilot.json").read_text())
    grouped: dict[str, list[dict]] = defaultdict(list)
    for fact in facts:
        grouped[fact["species_id"]].append(fact)
    invalid = [
        item_id for item_id, group in grouped.items()
        if sorted(fact["display_order"] for fact in group) != list(range(1, 11))
    ]
    assert len(presets) == 152 and not malformed and not cross_level_duplicates
    assert len(grouped) == 152 and not invalid
    print("AC4.5.2/4.5.3 data trace: 152 preset species valid with no cross-difficulty duplicates; 152 source species each have 10 team-verified facts")


if __name__ == "__main__":
    main()
