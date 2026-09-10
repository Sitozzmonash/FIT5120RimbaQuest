from __future__ import annotations

import json
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import engine
from app.main import app

client = TestClient(app)


def register_test_user(suffix: str = "quiz_user"):
    payload = {
        "username": f"u_{suffix}",
        "age": 10,
        "email": f"{suffix}@rimba.test",
        "password": "quizPassword123!",
        "avatar": "hornbill",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    return data["child_id"], data["access_token"]


def test_quiz_presets_file_validity():
    presets_file = Path("data/species_quiz_presets.json")
    assert presets_file.exists()
    presets = json.loads(presets_file.read_text(encoding="utf-8"))
    assert len(presets) >= 152

    # Check structure of species quizzes
    for sp_id, levels in list(presets.items())[:5]:
        for diff in ["easy", "medium", "hard"]:
            assert diff in levels
            sets = levels[diff]
            assert len(sets) == 3  # exactly 3 sets
            for s in sets:
                assert len(s) == 5  # exactly 5 questions
                for q in s:
                    assert "id" in q
                    assert "question" in q
                    assert "options" in q
                    assert len(q["options"]) == 3  # exactly 3 options
                    assert "correct_answer" in q
                    assert q["correct_answer"] in q["options"]


def test_quiz_progression_flow():
    child_id, token = register_test_user("progression")
    headers = {"Authorization": f"Bearer {token}"}
    species_id = "sp_asian_elephant"

    # 1. Initial progression check
    res = client.get(f"/api/v1/species/{species_id}/quiz-progression", headers=headers)
    assert res.status_code == 200
    prog = res.json()
    assert prog["species_id"] == species_id
    assert prog["easy_passed"] is False
    assert prog["medium_passed"] is False
    assert prog["hard_passed"] is False
    assert prog["unlocked_abilities"] == []

    # 2. Medium and Hard should be locked
    res_med = client.get(f"/api/v1/species/{species_id}/quiz?difficulty=medium", headers=headers)
    assert res_med.status_code == 400
    assert "locked" in res_med.json()["detail"].lower()

    res_hard = client.get(f"/api/v1/species/{species_id}/quiz?difficulty=hard", headers=headers)
    assert res_hard.status_code == 400
    assert "locked" in res_hard.json()["detail"].lower()

    # 3. Fetch Easy Quiz
    res_easy = client.get(f"/api/v1/species/{species_id}/quiz?difficulty=easy", headers=headers)
    assert res_easy.status_code == 200
    easy_quiz = res_easy.json()
    assert easy_quiz["difficulty"] == "easy"
    assert easy_quiz["set_index"] in [0, 1, 2]
    questions = easy_quiz["questions"]
    assert len(questions) == 5
    # Ensure correct_answer is NOT exposed to client
    for q in questions:
        assert "correct_answer" not in q
        assert len(q["options"]) == 3

    # Load preset ground truth to answer
    presets = json.loads(Path("data/species_quiz_presets.json").read_text(encoding="utf-8"))
    easy_set = presets[species_id]["easy"][easy_quiz["set_index"]]

    # 4. Fail easy quiz (score < 5)
    fail_answers = {q["id"]: "WRONG_ANSWER" for q in easy_set}
    submit_res = client.post(
        f"/api/v1/species/{species_id}/quiz/submit",
        json={"difficulty": "easy", "set_index": easy_quiz["set_index"], "answers": fail_answers},
        headers=headers,
    )
    assert submit_res.status_code == 200
    fail_data = submit_res.json()
    assert fail_data["passed"] is False
    assert fail_data["score"] == 0
    assert fail_data["ability_unlocked"] is None

    # Fetch Easy quiz again: should rotate away from failed set
    res_easy_retry = client.get(f"/api/v1/species/{species_id}/quiz?difficulty=easy", headers=headers)
    assert res_easy_retry.status_code == 200
    retry_set_idx = res_easy_retry.json()["set_index"]
    assert retry_set_idx != easy_quiz["set_index"]

    # 5. Pass Easy quiz with 5/5
    correct_easy_set = presets[species_id]["easy"][retry_set_idx]
    pass_easy_answers = {q["id"]: q["correct_answer"] for q in correct_easy_set}
    submit_res = client.post(
        f"/api/v1/species/{species_id}/quiz/submit",
        json={"difficulty": "easy", "set_index": retry_set_idx, "answers": pass_easy_answers},
        headers=headers,
    )
    assert submit_res.status_code == 200
    pass_data = submit_res.json()
    assert pass_data["passed"] is True
    assert pass_data["score"] == 5
    assert pass_data["ability_unlocked"] == 1

    # Check progression: Ability 1 unlocked
    res = client.get(f"/api/v1/species/{species_id}/quiz-progression", headers=headers)
    assert res.status_code == 200
    prog = res.json()
    assert prog["easy_passed"] is True
    assert prog["medium_passed"] is False
    assert prog["unlocked_abilities"] == [1]

    # 6. Medium quiz is now unlocked
    res_med = client.get(f"/api/v1/species/{species_id}/quiz?difficulty=medium", headers=headers)
    assert res_med.status_code == 200
    med_quiz = res_med.json()
    med_set_idx = med_quiz["set_index"]
    med_set = presets[species_id]["medium"][med_set_idx]

    # Pass Medium quiz with 5/5
    pass_med_answers = {q["id"]: q["correct_answer"] for q in med_set}
    submit_med = client.post(
        f"/api/v1/species/{species_id}/quiz/submit",
        json={"difficulty": "medium", "set_index": med_set_idx, "answers": pass_med_answers},
        headers=headers,
    )
    assert submit_med.status_code == 200
    med_data = submit_med.json()
    assert med_data["passed"] is True
    assert med_data["ability_unlocked"] == 2

    # Check progression: Ability 1 and 2 unlocked
    res = client.get(f"/api/v1/species/{species_id}/quiz-progression", headers=headers)
    assert res.json()["unlocked_abilities"] == [1, 2]

    # 7. Hard quiz is now unlocked
    res_hard = client.get(f"/api/v1/species/{species_id}/quiz?difficulty=hard", headers=headers)
    assert res_hard.status_code == 200
    hard_quiz = res_hard.json()
    hard_set_idx = hard_quiz["set_index"]
    hard_set = presets[species_id]["hard"][hard_set_idx]

    # Pass Hard quiz with 5/5
    pass_hard_answers = {q["id"]: q["correct_answer"] for q in hard_set}
    submit_hard = client.post(
        f"/api/v1/species/{species_id}/quiz/submit",
        json={"difficulty": "hard", "set_index": hard_set_idx, "answers": pass_hard_answers},
        headers=headers,
    )
    assert submit_hard.status_code == 200
    hard_data = submit_hard.json()
    assert hard_data["passed"] is True
    assert hard_data["ability_unlocked"] == 3

    # Final progression: All abilities [1, 2, 3] unlocked
    res = client.get(f"/api/v1/species/{species_id}/quiz-progression", headers=headers)
    prog = res.json()
    assert prog["easy_passed"] is True
    assert prog["medium_passed"] is True
    assert prog["hard_passed"] is True
    assert prog["unlocked_abilities"] == [1, 2, 3]
