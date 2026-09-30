from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import engine
from app.main import app
from app.routers import auth


client = TestClient(app)


@pytest.fixture
def account_email() -> str:
    username = f"reset_{uuid4().hex[:8]}"
    email = f"{username}@rimbaquest.test"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "age": 10,
            "avatar": "tiger",
            "password": "oldJunglePassword123",
        },
    )
    assert response.status_code == 200, response.text
    return email


@pytest.mark.parametrize("provider", ["development", "brevo", "smtp"])
def test_reset_code_is_returned_only_without_an_email_provider(
    monkeypatch: pytest.MonkeyPatch, account_email: str, provider: str
) -> None:
    if provider == "brevo":
        monkeypatch.setenv("BREVO_API_KEY", "test-provider-key")
    elif provider == "smtp":
        monkeypatch.setenv("SMTP_HOST", "smtp.example.test")
        monkeypatch.setenv("SMTP_USER", "test-user")
        monkeypatch.setenv("SMTP_PASSWORD", "test-password")

    sent: list[tuple[str, str]] = []

    def deliver(email: str, code: str) -> bool:
        sent.append((email, code))
        return True

    monkeypatch.setattr(auth, "send_password_reset_email", deliver)
    response = client.post(
        "/api/v1/auth/forgot-password", json={"email": f" {account_email.upper()} "}
    )
    assert response.status_code == 200, response.text
    assert len(sent) == 1
    delivered_email, code = sent[0]
    assert delivered_email == account_email
    with engine.connect() as connection:
        stored_token = connection.execute(
            text("SELECT recovery_token FROM users WHERE email=:email"),
            {"email": account_email},
        ).scalar_one()
    assert stored_token.split(":", 1)[0] == code

    payload = response.json()
    if provider == "development":
        assert payload["dev_code"] == payload["simulated_token"] == code
    else:
        assert "dev_code" not in payload
        assert "simulated_token" not in payload
        assert code not in response.text


def test_failed_reset_email_preserves_the_previous_token(
    monkeypatch: pytest.MonkeyPatch, account_email: str
) -> None:
    previous_token = "ABC234:2000000000"
    with engine.begin() as connection:
        connection.execute(
            text("UPDATE users SET recovery_token=:token WHERE email=:email"),
            {"token": previous_token, "email": account_email},
        )
    monkeypatch.setenv("BREVO_API_KEY", "test-provider-key")
    monkeypatch.setattr(auth, "send_password_reset_email", lambda email, code: False)

    response = client.post("/api/v1/auth/forgot-password", json={"email": account_email})
    assert response.status_code == 502
    with engine.connect() as connection:
        stored_token = connection.execute(
            text("SELECT recovery_token FROM users WHERE email=:email"),
            {"email": account_email},
        ).scalar_one()
    assert stored_token == previous_token


def test_reset_accepts_pasted_code_whitespace_and_consumes_the_code(
    monkeypatch: pytest.MonkeyPatch, account_email: str
) -> None:
    monkeypatch.setattr(auth, "send_password_reset_email", lambda email, code: True)
    forgot = client.post("/api/v1/auth/forgot-password", json={"email": account_email})
    assert forgot.status_code == 200, forgot.text
    code = forgot.json()["dev_code"]
    payload = {
        "email": f" {account_email.upper()} ",
        "recovery_token": f" \t{code[:3].lower()} \n{code[3:].lower()} ",
        "new_password": "newJunglePassword456",
    }

    reset = client.post("/api/v1/auth/reset-password", json=payload)
    assert reset.status_code == 200, reset.text
    assert client.post(
        "/api/v1/auth/login",
        json={"username_or_email": account_email, "password": "newJunglePassword456"},
    ).status_code == 200
    assert client.post(
        "/api/v1/auth/login",
        json={"username_or_email": account_email, "password": "oldJunglePassword123"},
    ).status_code == 401
    assert client.post("/api/v1/auth/reset-password", json=payload).status_code == 400
