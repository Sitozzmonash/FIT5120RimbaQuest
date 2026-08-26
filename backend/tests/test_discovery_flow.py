import os
import shutil
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

# Use isolated test SQLite database
temp_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{Path(temp_dir) / 'test.db'}"

from app.core.database import engine
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_system_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_fresh_database_starts_and_enforces_collection_foreign_keys():
    with engine.connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar() == 1

    with engine.begin() as connection:
        existing = connection.execute(text("""SELECT child_id, species_id
            FROM collection_entries LIMIT 1""")).mappings().one()

        with pytest.raises(IntegrityError):
            with connection.begin_nested():
                connection.execute(text("""INSERT INTO collection_entries
                    (child_id, species_id, unlock_reason, observed_boolean)
                    VALUES (:child_id, :species_id, 'audit', 0)"""), dict(existing))

        with pytest.raises(IntegrityError):
            with connection.begin_nested():
                connection.execute(text("""INSERT INTO collection_entries
                    (child_id, species_id, unlock_reason, observed_boolean)
                    VALUES (999999, :species_id, 'audit', 0)"""), {
                    "species_id": existing["species_id"],
                })


def test_database_enforces_account_and_badge_uniqueness():
    with engine.begin() as connection:
        user = connection.execute(text("SELECT username, email FROM users WHERE username IS NOT NULL LIMIT 1")).mappings().one()

        with pytest.raises(IntegrityError):
            with connection.begin_nested():
                connection.execute(text("""INSERT INTO users
                    (role, username, email) VALUES ('child', :username, 'new-email@rimbaquest.my')"""), {
                    "username": user["username"].upper(),
                })

        with pytest.raises(IntegrityError):
            with connection.begin_nested():
                connection.execute(text("""INSERT INTO users
                    (role, username, email) VALUES ('child', 'new_explorer', :email)"""), {
                    "email": user["email"].upper(),
                })

        unawarded_pair = connection.execute(text("""SELECT child_profiles.id AS child_id,
            badges.id AS badge_id
            FROM child_profiles CROSS JOIN badges
            WHERE NOT EXISTS (
                SELECT 1 FROM child_badges
                WHERE child_badges.child_id = child_profiles.id
                  AND child_badges.badge_id = badges.id
            )
            LIMIT 1""")).mappings().one()
        badge_params = {
            "child": unawarded_pair["child_id"],
            "badge": unawarded_pair["badge_id"],
        }
        connection.execute(text("INSERT INTO child_badges (child_id, badge_id) VALUES (:child, :badge)"), badge_params)
        with pytest.raises(IntegrityError):
            with connection.begin_nested():
                connection.execute(text("INSERT INTO child_badges (child_id, badge_id) VALUES (:child, :badge)"), badge_params)


def test_auth_registration_and_login():
    # 1. Registration validation - username too short
    short_user = client.post("/api/v1/auth/register", json={
        "username": "ab",
        "age": 10,
        "email": "test@test.com",
        "password": "password123",
        "avatar": "tapir"
    })
    assert short_user.status_code == 422

    # 2. Registration validation - spaces in username
    spaced_user = client.post("/api/v1/auth/register", json={
        "username": "user name",
        "age": 10,
        "email": "test@test.com",
        "password": "password123",
        "avatar": "tapir"
    })
    assert spaced_user.status_code == 422

    # 3. Successful registration
    reg = client.post("/api/v1/auth/register", json={
        "username": "malayan_explorer",
        "age": 11,
        "email": "explorer@rimbaquest.my",
        "password": "junglePassword123",
        "avatar": "tiger"
    })
    assert reg.status_code == 200
    data = reg.json()
    assert data["success"] is True
    assert data["username"] == "malayan_explorer"
    assert data["avatar"] == "tiger"
    child_id = data["child_id"]

    # 4. Duplicate registration prevention
    dup = client.post("/api/v1/auth/register", json={
        "username": "malayan_explorer",
        "age": 11,
        "email": "diff@rimbaquest.my",
        "password": "junglePassword123",
        "avatar": "tiger"
    })
    assert dup.status_code == 400
    assert "already taken" in dup.json()["detail"]

    # 4b. Leading/trailing username spaces are trimmed before uniqueness/length checks
    trimmed = client.post("/api/v1/auth/register", json={
        "username": "  malayan_explorer  ",
        "age": 11,
        "email": "trim@rimbaquest.my",
        "password": "junglePassword123",
        "avatar": "tiger"
    })
    assert trimmed.status_code == 400

    # 5. Successful login with username
    login_user = client.post("/api/v1/auth/login", json={
        "username_or_email": "malayan_explorer",
        "password": "junglePassword123"
    })
    assert login_user.status_code == 200
    assert login_user.json()["child_id"] == child_id

    # 6. Successful login with email
    login_email = client.post("/api/v1/auth/login", json={
        "username_or_email": "explorer@rimbaquest.my",
        "password": "junglePassword123"
    })
    assert login_email.status_code == 200

    # 7. Failed login with wrong password
    bad_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "malayan_explorer",
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401


def test_auth_password_reset():
    unknown = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@rimbaquest.my"})
    assert unknown.status_code == 400
    assert "account" in unknown.json()["detail"].lower()

    # Forgot password request
    forgot = client.post("/api/v1/auth/forgot-password", json={"email": "explorer@rimbaquest.my"})
    assert forgot.status_code == 200
    token = forgot.json()["simulated_token"]

    # Reset password
    reset = client.post("/api/v1/auth/reset-password", json={
        "email": "explorer@rimbaquest.my",
        "recovery_token": token,
        "new_password": "newJunglePassword456"
    })
    assert reset.status_code == 200

    # Log in with new password
    login_new = client.post("/api/v1/auth/login", json={
        "username_or_email": "explorer@rimbaquest.my",
        "password": "newJunglePassword456"
    })
    assert login_new.status_code == 200


def test_profile_view_and_update():
    prof = client.get("/api/v1/children/1/profile")
    assert prof.status_code == 200
    assert "display_name" in prof.json()
    assert "avatar" in prof.json()

    # Update profile
    update = client.put("/api/v1/children/1/profile", json={
        "display_name": "Ranger Aisyah",
        "avatar": "hornbill",
        "age": 11
    })
    assert update.status_code == 200
    assert update.json()["display_name"] == "Ranger Aisyah"
    assert update.json()["avatar"] == "hornbill"


def test_locations_search_and_filter():
    # List all locations
    all_locs = client.get("/api/v1/locations")
    assert all_locs.status_code == 200
    items = all_locs.json()["items"]
    assert len(items) >= 5
    names = [loc["name"] for loc in items]
    assert any("Gasing" in name for name in names)
    assert all("Bako" not in name and "Cherating" not in name and "Taman Negara" not in name for name in names)

    # Search by keyword (case insensitive)
    gasing = client.get("/api/v1/locations?query=gasing")
    assert gasing.status_code == 200
    assert any("Gasing" in loc["name"] for loc in gasing.json()["items"])

    # Filter by category
    butterfly_locs = client.get("/api/v1/locations?category=Butterfly")
    assert butterfly_locs.status_code == 200

    # Combined search & filter
    combined = client.get("/api/v1/locations?query=Selangor&category=Birds")
    assert combined.status_code == 200


def test_confirmed_discovery_and_collection():
    species_list = client.get("/api/v1/species?category=Mammal").json()
    assert len(species_list) > 0
    species = species_list[0]
    assert "hp" in species
    assert "base_attack" in species

    before_prog = client.get("/api/v1/children/1/progress").json()
    before_found = before_prog["found"]

    # First discovery
    first = client.post("/api/v1/children/1/discoveries", json={
        "species_id": species["id"],
        "location_label": "Bukit Gasing Nature Reserve",
        "notes": "Spotted near the bridge"
    })
    assert first.status_code == 200
    assert first.json()["first_discovery"] is True
    assert first.json()["xp_awarded"] == 100

    # Second discovery of same species
    second = client.post("/api/v1/children/1/discoveries", json={
        "species_id": species["id"],
        "location_label": "FRIM Canopy Walkway"
    })
    assert second.status_code == 200
    assert second.json()["first_discovery"] is False
    assert second.json()["xp_awarded"] == 0

    # Progress should increase by only 1 unique species
    after_prog = client.get("/api/v1/children/1/progress").json()
    assert after_prog["found"] == before_found + 1

    # Gallery should return 2 sightings
    gallery = client.get(f"/api/v1/children/1/species/{species['id']}/gallery")
    assert gallery.status_code == 200
    assert len(gallery.json()["items"]) >= 2

    # Collection has battle stats
    col = client.get("/api/v1/children/1/collection")
    assert col.status_code == 200
    first_col_item = col.json()["items"][0]
    assert "hp" in first_col_item
    assert "base_attack" in first_col_item
    assert "discovered" in first_col_item


def test_battle_recording():
    # Win battle
    win = client.post("/api/v1/children/1/battle/record", json={
        "won": True,
        "opponent_name": "Forest Wild Boar",
        "rounds": 3
    })
    assert win.status_code == 200
    assert win.json()["won"] is True
    assert win.json()["xp_awarded"] == 50

    lose = client.post("/api/v1/children/1/battle/record", json={
        "won": False,
        "opponent_name": "Forest Wild Boar",
        "rounds": 2
    })
    assert lose.status_code == 200
    assert lose.json()["xp_awarded"] == 10
