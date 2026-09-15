"""Systematic integration tests for user registration in RimbaQuest."""
from uuid import uuid4
from starlette.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.core.database import engine

client = TestClient(app)


def test_register_success():
    """Verify a valid child user can register, receive JWT, and immediately log in."""
    suffix = uuid4().hex[:8]
    payload = {
        "username": f"user_{suffix}",
        "email": f"user_{suffix}@rimba.test",
        "password": "SecurePassword123!",
        "age": 10,
        "avatar": "hornbill",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["username"] == payload["username"]
    assert data["email"] == payload["email"].lower()
    assert data["avatar"] == "hornbill"
    assert data["age"] == 10
    assert data["level"] == 1
    assert data["xp"] == 0
    assert data["access_token"]
    assert data["token_type"] == "bearer"
    assert data["child_id"] > 0
    assert data["user_id"] > 0

    # Verify that the newly registered credentials work for login
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": payload["username"],
            "password": payload["password"],
        },
    )
    assert login_res.status_code == 200, login_res.text
    assert login_res.json()["user_id"] == data["user_id"]


def test_register_duplicate_username_case_insensitive():
    """Verify duplicate usernames are rejected regardless of casing."""
    suffix = uuid4().hex[:8]
    payload1 = {
        "username": f"dupu_{suffix}",
        "email": f"dupu1_{suffix}@rimba.test",
        "password": "SecurePassword123!",
        "age": 9,
        "avatar": "tiger",
    }
    res1 = client.post("/api/v1/auth/register", json=payload1)
    assert res1.status_code == 200

    # Same username with different casing
    payload2 = {
        "username": f"DUPU_{suffix}",
        "email": f"dupu2_{suffix}@rimba.test",
        "password": "SecurePassword123!",
        "age": 9,
        "avatar": "tiger",
    }
    res2 = client.post("/api/v1/auth/register", json=payload2)
    assert res2.status_code == 400
    assert "already taken" in res2.json()["detail"].lower()


def test_register_duplicate_email_case_insensitive():
    """Verify duplicate emails are rejected regardless of casing."""
    suffix = uuid4().hex[:8]
    payload1 = {
        "username": f"dupem1_{suffix}",
        "email": f"dupe_{suffix}@rimba.test",
        "password": "SecurePassword123!",
        "age": 8,
        "avatar": "panda",
    }
    res1 = client.post("/api/v1/auth/register", json=payload1)
    assert res1.status_code == 200

    # Same email with uppercase characters
    payload2 = {
        "username": f"dupem2_{suffix}",
        "email": f"DUPE_{suffix}@RIMBA.TEST",
        "password": "SecurePassword123!",
        "age": 8,
        "avatar": "panda",
    }
    res2 = client.post("/api/v1/auth/register", json=payload2)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_register_invalid_usernames():
    """Verify invalid usernames (too short, too long, spaces, symbols) are rejected."""
    base = {
        "email": f"valid_{uuid4().hex[:6]}@rimba.test",
        "password": "SecurePassword123!",
        "age": 10,
        "avatar": "hornbill",
    }
    # Too short (<3)
    res_short = client.post("/api/v1/auth/register", json={**base, "username": "ab"})
    assert res_short.status_code == 422

    # Too long (>20)
    res_long = client.post("/api/v1/auth/register", json={**base, "username": "a" * 21})
    assert res_long.status_code == 422

    # Contains spaces
    res_space = client.post("/api/v1/auth/register", json={**base, "username": "bad name"})
    assert res_space.status_code == 422

    # Contains forbidden special characters
    res_sym = client.post("/api/v1/auth/register", json={**base, "username": "user@#$"})
    assert res_sym.status_code == 422


def test_register_invalid_emails():
    """Verify invalid email formats are rejected with 422."""
    base = {
        "username": f"val_{uuid4().hex[:6]}",
        "password": "SecurePassword123!",
        "age": 10,
        "avatar": "hornbill",
    }
    for bad_email in ["notanemail", "no-at-sign.com", "@missinguser.com", "missingdot@com"]:
        res = client.post("/api/v1/auth/register", json={**base, "email": bad_email})
        assert res.status_code == 422, f"Expected 422 for '{bad_email}', got {res.status_code}"


def test_register_invalid_password_length():
    """Verify passwords shorter than 6 characters are rejected."""
    payload = {
        "username": f"val_{uuid4().hex[:6]}",
        "email": f"val_{uuid4().hex[:6]}@rimba.test",
        "password": "12345",
        "age": 10,
        "avatar": "hornbill",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422


def test_register_age_boundaries():
    """Verify valid age range (5-18) and rejection of out-of-range values."""
    base = {
        "password": "SecurePassword123!",
        "avatar": "hornbill",
    }
    # Too young (<5)
    res_young = client.post(
        "/api/v1/auth/register",
        json={**base, "username": f"young_{uuid4().hex[:6]}", "email": f"y_{uuid4().hex[:6]}@rimba.test", "age": 4},
    )
    assert res_young.status_code == 422

    # Too old (>18)
    res_old = client.post(
        "/api/v1/auth/register",
        json={**base, "username": f"old_{uuid4().hex[:6]}", "email": f"o_{uuid4().hex[:6]}@rimba.test", "age": 19},
    )
    assert res_old.status_code == 422

    # Valid boundary minimum: 5
    res_min = client.post(
        "/api/v1/auth/register",
        json={**base, "username": f"min_{uuid4().hex[:6]}", "email": f"min_{uuid4().hex[:6]}@rimba.test", "age": 5},
    )
    assert res_min.status_code == 200

    # Valid boundary maximum: 18
    res_max = client.post(
        "/api/v1/auth/register",
        json={**base, "username": f"max_{uuid4().hex[:6]}", "email": f"max_{uuid4().hex[:6]}@rimba.test", "age": 18},
    )
    assert res_max.status_code == 200


def test_register_avatar_choices():
    """Verify allowed avatars (hornbill, tiger, panda) and rejection of unknown avatars."""
    base = {
        "password": "SecurePassword123!",
        "age": 10,
    }
    for allowed in ["hornbill", "tiger", "panda"]:
        res = client.post(
            "/api/v1/auth/register",
            json={**base, "username": f"av_{uuid4().hex[:6]}", "email": f"av_{uuid4().hex[:6]}@rimba.test", "avatar": allowed},
        )
        assert res.status_code == 200, f"Allowed avatar '{allowed}' failed: {res.text}"

    # Disallowed avatar
    res_bad = client.post(
        "/api/v1/auth/register",
        json={**base, "username": f"badav_{uuid4().hex[:6]}", "email": f"badav_{uuid4().hex[:6]}@rimba.test", "avatar": "dragon"},
    )
    assert res_bad.status_code == 422


def test_register_whitespace_stripping():
    """Verify leading and trailing whitespace in username and email are automatically stripped."""
    suffix = uuid4().hex[:8]
    clean_username = f"strip_{suffix}"
    clean_email = f"strip_{suffix}@rimba.test"

    res = client.post(
        "/api/v1/auth/register",
        json={
            "username": f"  {clean_username}  ",
            "email": f"  {clean_email}  ",
            "password": "SecurePassword123!",
            "age": 10,
            "avatar": "hornbill",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == clean_username
    assert data["email"] == clean_email


def test_register_database_integrity():
    """Verify users and child_profiles database records and foreign key linkage."""
    suffix = uuid4().hex[:8]
    uname = f"dbu_{suffix}"
    uemail = f"dbu_{suffix}@rimba.test"
    res = client.post(
        "/api/v1/auth/register",
        json={
            "username": uname,
            "email": uemail,
            "password": "SecurePassword123!",
            "age": 12,
            "avatar": "panda",
        },
    )
    assert res.status_code == 200
    uid = res.json()["user_id"]
    cid = res.json()["child_id"]

    with engine.connect() as conn:
        u_row = conn.execute(text("SELECT * FROM users WHERE id = :id"), {"id": uid}).mappings().one()
        assert u_row["username"] == uname
        assert u_row["email"] == uemail
        assert u_row["role"] == "child"
        assert u_row["avatar"] == "panda"
        assert u_row["password_hash"].startswith("$argon2") or len(u_row["password_hash"]) > 20

        c_row = conn.execute(text("SELECT * FROM child_profiles WHERE id = :id"), {"id": cid}).mappings().one()
        assert c_row["parent_user_id"] == uid
        assert c_row["display_name"] == uname
        assert c_row["avatar"] == "panda"
        assert c_row["age"] == 12
        assert c_row["xp"] == 0
        assert c_row["level"] == 1
