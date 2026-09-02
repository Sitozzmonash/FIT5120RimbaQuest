from __future__ import annotations

import os
import tempfile
from pathlib import Path
from uuid import uuid4


import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

temp_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{(Path(temp_dir) / 'test.db').as_posix()}"
os.environ["JWT_SECRET"] = "test-only-secret-at-least-32-bytes-long"

from fastapi.testclient import TestClient

from app.core.database import engine, initialise_database
from app.main import app


client = TestClient(app)


def register(prefix: str = "explorer") -> tuple[int, str, str]:
    suffix = uuid4().hex[:8]
    username = f"{prefix}_{suffix}"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "age": 11,
            "email": f"{username}@rimbaquest.test",
            "password": "junglePassword123",
            "avatar": "tiger",
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()
    return data["child_id"], data["access_token"], username


def headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_database_enforces_foreign_keys_and_collection_uniqueness():
    child_id, _, _ = register("integrity")
    with engine.connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar() == 1
        species_id = connection.execute(text("SELECT id FROM species ORDER BY id LIMIT 1")).scalar_one()

    with engine.begin() as connection:
        entry = {"child": child_id, "species": species_id}
        connection.execute(text("""INSERT INTO collection_entries
            (child_id, species_id, unlock_reason, observed_boolean)
            VALUES (:child, :species, 'audit', 0)"""), entry)
        with pytest.raises(IntegrityError):
            with connection.begin_nested():
                connection.execute(text("""INSERT INTO collection_entries
                    (child_id, species_id, unlock_reason, observed_boolean)
                    VALUES (:child, :species, 'duplicate', 0)"""), entry)
        with pytest.raises(IntegrityError):
            with connection.begin_nested():
                connection.execute(text("""INSERT INTO collection_entries
                    (child_id, species_id, unlock_reason, observed_boolean)
                    VALUES (999999, :species, 'foreign-key', 0)"""), {"species": species_id})


def test_system_health_and_static_catalogue():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["database"] == "sqlite"

    all_species = client.get("/api/v1/species")
    assert all_species.status_code == 200
    assert len(all_species.json()) == 152
    assert all(item["habitat"] and item["diet"] and item["fun_fact"] for item in all_species.json())

    with engine.connect() as connection:
        assert connection.execute(text("SELECT COUNT(*) FROM species_images")).scalar_one() == 151
        assert connection.execute(
            text("SELECT image_url FROM species WHERE id='sp_malaysian_mole'")
        ).scalar_one() in (None, "")

    quiz = client.get(f"/api/v1/species/{all_species.json()[0]['id']}/quiz")
    assert quiz.status_code == 200
    assert quiz.json()["questions"]


def test_auth_registration_login_and_duplicate_protection():
    invalid = client.post(
        "/api/v1/auth/register",
        json={
            "username": "user name",
            "age": 10,
            "email": "invalid@rimbaquest.test",
            "password": "password123",
            "avatar": "tapir",
        },
    )
    assert invalid.status_code == 422

    child_id, token, username = register("auth")
    assert token

    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "username": f"  {username}  ",
            "age": 11,
            "email": "different@rimbaquest.test",
            "password": "junglePassword123",
            "avatar": "tiger",
        },
    )
    assert duplicate.status_code == 400

    login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username.upper(), "password": "junglePassword123"},
    )
    assert login.status_code == 200
    assert login.json()["child_id"] == child_id
    assert login.json()["access_token"]

    bad_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401


def test_password_reset_and_argon2_storage():
    _, _, username = register("reset")
    email = f"{username}@rimbaquest.test"
    forgot = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot.status_code == 200
    reset = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": email,
            "recovery_token": forgot.json()["simulated_token"],
            "new_password": "newJunglePassword456",
        },
    )
    assert reset.status_code == 200
    assert client.post(
        "/api/v1/auth/login",
        json={"username_or_email": email, "password": "newJunglePassword456"},
    ).status_code == 200
    with engine.connect() as connection:
        stored = connection.execute(
            text("SELECT password_hash FROM users WHERE username=:username"), {"username": username}
        ).scalar_one()
    assert stored.startswith("$argon2")


def test_child_routes_require_auth_and_enforce_ownership():
    first_id, first_token, _ = register("owner")
    second_id, second_token, _ = register("other")

    assert client.get(f"/api/v1/children/{first_id}/profile").status_code == 401
    assert client.get(
        f"/api/v1/children/{first_id}/profile", headers=headers(second_token)
    ).status_code == 403

    profile = client.put(
        f"/api/v1/children/{first_id}/profile",
        headers=headers(first_token),
        json={"username": "ranger_aisyah", "avatar": "panda", "age": 11},
    )
    assert profile.status_code == 200
    assert profile.json()["username"] == "ranger_aisyah"
    assert profile.json()["display_name"] == "ranger_aisyah"
    assert profile.json()["avatar"] == "panda"
    assert first_id != second_id


def test_profile_username_change_updates_login_and_avatar_everywhere():
    child_id, token, old_username = register("rename")
    new_username = f"renamed_{uuid4().hex[:8]}"

    response = client.put(
        f"/api/v1/children/{child_id}/profile",
        headers=headers(token),
        json={"username": new_username, "avatar": "panda"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["username"] == new_username
    assert response.json()["display_name"] == new_username
    assert response.json()["avatar"] == "panda"

    assert client.post(
        "/api/v1/auth/login",
        json={"username_or_email": old_username, "password": "junglePassword123"},
    ).status_code == 401
    login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": new_username, "password": "junglePassword123"},
    )
    assert login.status_code == 200
    assert login.json()["username"] == new_username
    assert login.json()["avatar"] == "panda"

    invalid_avatar = client.put(
        f"/api/v1/children/{child_id}/profile",
        headers=headers(token),
        json={"avatar": "tapir"},
    )
    assert invalid_avatar.status_code == 422


def test_locations_search_and_iteration_one_scope():
    locations = client.get("/api/v1/locations")
    assert locations.status_code == 200
    items = locations.json()["items"]
    assert len(items) == 6
    names = [item["name"] for item in items]
    assert any("Gasing" in name for name in names)
    assert all("Bako" not in name and "Cherating" not in name for name in names)
    assert client.get("/api/v1/locations?query=gasing").json()["items"]


def test_photo_upload_discovery_collection_and_progress(monkeypatch):
    child_id, token, _ = register("discover")
    auth = headers(token)
    species_item = client.get("/api/v1/species?category=Mammal").json()[0]
    object_path = f"children/{child_id}/discoveries/test-photo.jpg"
    signed_url = "https://example.test/private-photo"
    monkeypatch.setattr(
        "app.routers.discoveries.upload_discovery_photo",
        lambda incoming_child_id, content, content_type: object_path,
    )
    monkeypatch.setattr(
        "app.routers.discoveries.signed_photo_url",
        lambda path: signed_url if path else None,
    )

    uploaded = client.post(
        f"/api/v1/children/{child_id}/photos",
        headers=auth,
        files={"photo": ("wildlife.jpg", b"jpeg-data", "image/jpeg")},
    )
    assert uploaded.status_code == 200
    assert uploaded.json() == {"photo_path": object_path, "photo_url": signed_url}

    foreign_path = f"children/{child_id + 1}/discoveries/foreign.jpg"
    rejected = client.post(
        f"/api/v1/children/{child_id}/discoveries",
        headers=auth,
        json={"species_id": species_item["id"], "location_label": "FRIM", "photo_path": foreign_path},
    )
    assert rejected.status_code == 400

    first = client.post(
        f"/api/v1/children/{child_id}/discoveries",
        headers=auth,
        json={
            "species_id": species_item["id"],
            "location_label": "Bukit Gasing Nature Reserve",
            "photo_path": object_path,
        },
    )
    assert first.status_code == 200
    assert first.json()["first_discovery"] is True
    assert first.json()["xp_awarded"] == 100

    missing_photo = client.post(
        f"/api/v1/children/{child_id}/discoveries",
        headers=auth,
        json={"species_id": species_item["id"], "location_label": "FRIM"},
    )
    assert missing_photo.status_code == 400

    second = client.post(
        f"/api/v1/children/{child_id}/discoveries",
        headers=auth,
        json={"species_id": species_item["id"], "location_label": "FRIM", "photo_path": object_path},
    )
    assert second.status_code == 200
    assert second.json()["first_discovery"] is False
    assert second.json()["xp_awarded"] == 0

    progress = client.get(f"/api/v1/children/{child_id}/progress", headers=auth).json()
    assert progress["found"] == 1
    assert progress["profile"]["xp"] == 100

    collection = client.get(f"/api/v1/children/{child_id}/collection", headers=auth).json()["items"]
    assert collection[0]["id"] == species_item["id"]
    assert collection[0]["discovered"] == 1

    gallery = client.get(
        f"/api/v1/children/{child_id}/species/{species_item['id']}/gallery", headers=auth
    )
    assert gallery.status_code == 200
    assert len(gallery.json()["items"]) == 2
    assert gallery.json()["items"][0]["photo_url"] == signed_url
    assert gallery.json()["items"][1]["photo_url"] == signed_url


def test_seed_is_idempotent_and_does_not_delete_user_data():
    child_id, token, username = register("persistent")
    initialise_database()
    login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": "junglePassword123"},
    )
    assert login.status_code == 200
    assert login.json()["child_id"] == child_id
    assert client.get(
        f"/api/v1/children/{child_id}/profile", headers=headers(token)
    ).status_code == 200


def test_battle_recording_is_owned_and_persistent():
    child_id, token, _ = register("battle")
    result = client.post(
        f"/api/v1/children/{child_id}/battle/record",
        headers=headers(token),
        json={"won": True, "opponent_name": "Forest Wild Boar", "rounds": 3},
    )
    assert result.status_code == 200
    assert result.json()["xp_awarded"] == 50
