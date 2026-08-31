"""Iteration 1 black-box API acceptance checks.

This module deliberately configures an isolated SQLite database and a test-only
JWT secret before importing any RimbaQuest application module.
"""

from __future__ import annotations

import os
import sys
import tempfile
from itertools import count
from pathlib import Path


_TESTING_PARENT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = _TESTING_PARENT / "backend"
if not BACKEND_ROOT.is_dir():
    BACKEND_ROOT = _TESTING_PARENT / "FIT5120RimbaQuest" / "backend"
_TEMP_DATABASE = tempfile.TemporaryDirectory(prefix="rimbaquest-iteration1-")
_DATABASE_PATH = Path(_TEMP_DATABASE.name) / "acceptance.sqlite3"

os.environ["DATABASE_URL"] = f"sqlite:///{_DATABASE_PATH.as_posix()}"
os.environ["JWT_SECRET"] = "iteration-1-test-only-jwt-secret-at-least-32-bytes"
os.environ["SEED_SQL_PATH"] = str(BACKEND_ROOT / "data" / "seed.sql")
sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


client = TestClient(app)
_identifiers = count(1)
PASSWORD = "ForestTrail123"
NEW_PASSWORD = "NewForestTrail456"
EXPECTED_LOCATION_IDS = {
    "loc_bukit_gasing",
    "loc_frim",
    "loc_kuala_selangor",
    "loc_per_paya_indah",
    "loc_kl_forest_eco_park",
    "loc_perdana_botanical",
}


def _account(prefix: str = "explorer") -> dict:
    sequence = next(_identifiers)
    username = f"{prefix}_{sequence}"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "age": 11,
            "email": f"{username}@rimbaquest.test",
            "password": PASSWORD,
            "avatar": "tiger",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def _headers(account: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {account['access_token']}"}


def _first_species() -> dict:
    response = client.get("/api/v1/species")
    assert response.status_code == 200, response.text
    assert response.json()
    return response.json()[0]


def test_auto_i1_01_health_reports_isolated_sqlite_database() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "sqlite"
    assert _DATABASE_PATH.exists()


def test_auto_i1_02_registration_rejects_username_outside_length_boundaries() -> None:
    base = {
        "age": 11,
        "password": PASSWORD,
        "avatar": "hornbill",
    }
    too_short = client.post(
        "/api/v1/auth/register",
        json={**base, "username": "ab", "email": "short@rimbaquest.test"},
    )
    too_long = client.post(
        "/api/v1/auth/register",
        json={**base, "username": "x" * 21, "email": "long@rimbaquest.test"},
    )

    assert too_short.status_code == 422
    assert too_long.status_code == 422
    assert too_short.json()["detail"][0]["type"] == "string_too_short"
    assert too_long.json()["detail"][0]["type"] == "string_too_long"


def test_auto_i1_03_registration_trims_username_before_duplicate_check() -> None:
    sequence = next(_identifiers)
    username = f"trimmed_{sequence}"
    first = client.post(
        "/api/v1/auth/register",
        json={
            "username": f"  {username}  ",
            "age": 10,
            "email": f"trimmed_{sequence}@rimbaquest.test",
            "password": PASSWORD,
            "avatar": "panda",
        },
    )
    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "username": f" {username.upper()} ",
            "age": 10,
            "email": f"other_{sequence}@rimbaquest.test",
            "password": PASSWORD,
            "avatar": "panda",
        },
    )

    assert first.status_code == 200, first.text
    assert first.json()["username"] == username
    assert duplicate.status_code == 400
    assert duplicate.json()["detail"] == "That username is already taken. Try another one."


def test_auto_i1_04_registration_rejects_invalid_age_and_email() -> None:
    base = {
        "username": "validator",
        "password": PASSWORD,
        "avatar": "hornbill",
    }
    under_age = client.post(
        "/api/v1/auth/register",
        json={**base, "age": 4, "email": "valid@rimbaquest.test"},
    )
    over_age = client.post(
        "/api/v1/auth/register",
        json={**base, "age": 19, "email": "valid@rimbaquest.test"},
    )
    invalid_email = client.post(
        "/api/v1/auth/register",
        json={**base, "age": 11, "email": "not-an-email"},
    )

    assert under_age.status_code == 422
    assert over_age.status_code == 422
    assert invalid_email.status_code == 422
    assert "valid email address" in invalid_email.text


def test_auto_i1_05_login_accepts_valid_and_rejects_invalid_credentials() -> None:
    account = _account("login")
    valid = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": account["username"].upper(), "password": PASSWORD},
    )
    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": account["username"], "password": "wrong-password"},
    )
    unknown_user = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "missing_user", "password": PASSWORD},
    )

    assert valid.status_code == 200
    assert valid.json()["child_id"] == account["child_id"]
    assert valid.json()["access_token"]
    assert wrong_password.status_code == 401
    assert unknown_user.status_code == 401


def test_auto_i1_06_recovery_rejects_invalid_requests_and_codes() -> None:
    account = _account("recovery_bad")
    email = account["email"]

    empty = client.post("/api/v1/auth/forgot-password", json={"email": ""})
    unknown = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "unknown@rimbaquest.test"},
    )
    issued = client.post("/api/v1/auth/forgot-password", json={"email": email})
    bad_code = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": email,
            "recovery_token": "INVALID-CODE",
            "new_password": NEW_PASSWORD,
        },
    )

    assert empty.status_code == 422
    assert unknown.status_code == 400
    assert issued.status_code == 200
    assert bad_code.status_code == 400
    assert "Invalid or expired" in bad_code.json()["detail"]


def test_auto_i1_07_valid_recovery_changes_password_and_preserves_data() -> None:
    account = _account("recovery_ok")
    species = _first_species()
    discovery = client.post(
        f"/api/v1/children/{account['child_id']}/discoveries",
        headers=_headers(account),
        json={"species_id": species["id"], "location_label": "FRIM"},
    )
    assert discovery.status_code == 200, discovery.text

    issued = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": account["email"]},
    )
    reset = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": account["email"],
            "recovery_token": issued.json()["simulated_token"],
            "new_password": NEW_PASSWORD,
        },
    )
    old_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": account["email"], "password": PASSWORD},
    )
    new_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": account["email"], "password": NEW_PASSWORD},
    )
    progress = client.get(
        f"/api/v1/children/{account['child_id']}/progress",
        headers={"Authorization": f"Bearer {new_login.json()['access_token']}"},
    )

    assert issued.status_code == 200
    assert reset.status_code == 200
    assert old_login.status_code == 401
    assert new_login.status_code == 200
    assert progress.status_code == 200
    assert progress.json()["found"] == 1


def test_auto_i1_08_child_resources_require_auth_and_enforce_ownership() -> None:
    owner = _account("owner")
    other = _account("other")
    resource = f"/api/v1/children/{owner['child_id']}/profile"

    unauthenticated = client.get(resource)
    wrong_owner = client.get(resource, headers=_headers(other))
    correct_owner = client.get(resource, headers=_headers(owner))

    assert unauthenticated.status_code == 401
    assert wrong_owner.status_code == 403
    assert correct_owner.status_code == 200
    assert correct_owner.json()["id"] == owner["child_id"]


def test_auto_i1_09_locations_have_six_item_scope_and_search_behaviour() -> None:
    all_locations = client.get("/api/v1/locations")
    partial_name = client.get("/api/v1/locations", params={"query": "gasing"})
    upper_area = client.get("/api/v1/locations", params={"query": "KL"})
    lower_area = client.get("/api/v1/locations", params={"query": "kl"})
    no_match = client.get("/api/v1/locations", params={"query": "no-such-place"})

    assert all_locations.status_code == 200
    assert {item["id"] for item in all_locations.json()["items"]} == EXPECTED_LOCATION_IDS
    assert len(all_locations.json()["items"]) == 6
    assert {item["id"] for item in partial_name.json()["items"]} == {"loc_bukit_gasing"}
    assert {item["id"] for item in upper_area.json()["items"]} == {
        item["id"] for item in lower_area.json()["items"]
    }
    assert upper_area.json()["items"]
    assert no_match.json() == {"items": [], "total": 0}


def test_auto_i1_10_locations_support_category_and_combined_queries() -> None:
    birds = client.get("/api/v1/locations", params={"category": "Birds"})
    mammals = client.get("/api/v1/locations", params={"category": "Mammals"})
    combined = client.get(
        "/api/v1/locations",
        params={"query": "Kuala Lumpur", "category": "Birds"},
    )

    assert birds.status_code == 200
    assert mammals.status_code == 200
    assert birds.json()["items"]
    assert mammals.json()["items"]
    assert all(
        "bird" in (
            f"{item.get('typical_wildlife', '')} {item.get('description', '')} "
            f"{item.get('why_recommended', '')}"
        ).lower()
        for item in birds.json()["items"]
    )
    assert combined.json()["items"]
    assert all(
        "kuala lumpur" in (
            f"{item.get('name', '')} {item.get('area', '')} {item.get('description', '')}"
        ).lower()
        for item in combined.json()["items"]
    )
    assert {item["id"] for item in combined.json()["items"]}.issubset(
        {item["id"] for item in birds.json()["items"]}
    )


def test_auto_i1_11_catalogue_and_progress_use_same_supported_species() -> None:
    account = _account("catalogue")
    catalogue = client.get("/api/v1/species")
    collection = client.get(
        f"/api/v1/children/{account['child_id']}/collection",
        headers=_headers(account),
    )
    progress = client.get(
        f"/api/v1/children/{account['child_id']}/progress",
        headers=_headers(account),
    )

    assert catalogue.status_code == 200
    assert collection.status_code == 200
    assert progress.status_code == 200
    catalogue_ids = {item["id"] for item in catalogue.json()}
    collection_items = collection.json()["items"]
    assert catalogue_ids == {item["id"] for item in collection_items}
    assert all(item["discovered"] == 0 for item in collection_items)
    assert all(item["hp"] > 0 and item["base_attack"] > 0 for item in collection_items)
    assert progress.json()["found"] == 0
    assert progress.json()["total"] == len(catalogue_ids)
    assert progress.json()["percentage"] == 0
    assert sum(item["total"] for item in progress.json()["categories"]) == len(catalogue_ids)


def test_auto_i1_12_repeat_discovery_is_card_and_progress_idempotent() -> None:
    account = _account("repeat")
    species = _first_species()
    endpoint = f"/api/v1/children/{account['child_id']}/discoveries"
    payload = {"species_id": species["id"], "location_label": "Bukit Gasing"}

    first = client.post(endpoint, headers=_headers(account), json=payload)
    second = client.post(endpoint, headers=_headers(account), json=payload)
    progress = client.get(
        f"/api/v1/children/{account['child_id']}/progress",
        headers=_headers(account),
    )
    collection = client.get(
        f"/api/v1/children/{account['child_id']}/collection",
        headers=_headers(account),
    )
    gallery = client.get(
        f"/api/v1/children/{account['child_id']}/species/{species['id']}/gallery",
        headers=_headers(account),
    )

    assert first.status_code == 200
    assert first.json()["first_discovery"] is True
    assert first.json()["xp_awarded"] == 100
    assert second.status_code == 200
    assert second.json()["first_discovery"] is False
    assert second.json()["xp_awarded"] == 0
    assert progress.json()["found"] == 1
    assert progress.json()["profile"]["xp"] == 100
    matching_cards = [
        item for item in collection.json()["items"] if item["id"] == species["id"]
    ]
    assert len(matching_cards) == 1
    assert matching_cards[0]["discovered"] == 1
    assert matching_cards[0]["sightings_count"] == 2
    assert gallery.json()["total"] == 2


def test_auto_i1_13_battle_outcomes_are_owned_and_update_xp() -> None:
    account = _account("battle")
    other = _account("battle_other")
    endpoint = f"/api/v1/children/{account['child_id']}/battle/record"

    forbidden = client.post(
        endpoint,
        headers=_headers(other),
        json={"won": True, "opponent_name": "Forest Shadow", "rounds": 2},
    )
    victory = client.post(
        endpoint,
        headers=_headers(account),
        json={"won": True, "opponent_name": "Forest Shadow", "rounds": 2},
    )
    defeat = client.post(
        endpoint,
        headers=_headers(account),
        json={"won": False, "opponent_name": "Forest Shadow", "rounds": 3},
    )
    progress = client.get(
        f"/api/v1/children/{account['child_id']}/progress",
        headers=_headers(account),
    )

    assert forbidden.status_code == 403
    assert victory.status_code == 200
    assert victory.json()["won"] is True
    assert victory.json()["xp_awarded"] == 50
    assert defeat.status_code == 200
    assert defeat.json()["won"] is False
    assert defeat.json()["xp_awarded"] == 10
    assert progress.json()["profile"]["xp"] == 60
