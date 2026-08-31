"""Non-destructive-to-code deployed API acceptance smoke.

This creates clearly synthetic test accounts and records because the deployed
prototype has no deletion endpoint. It never writes credentials or tokens to
the evidence file.
"""

from __future__ import annotations

import json
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path


BASE_URL = "https://fit5120rimbaquest.onrender.com"


def request(method: str, path: str, body=None, token: str | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            raw = response.read().decode()
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"detail": raw[:500]}
        return error.code, payload


def main(output_path: str) -> int:
    suffix = f"{datetime.now(timezone.utc):%Y%m%d%H%M}_{uuid.uuid4().hex[:6]}"
    username = f"qa_i1_{suffix}"[:20]
    other_username = f"qa2_{uuid.uuid4().hex[:8]}"
    email = f"{username}@rimbaquest.test"
    password = f"T!{secrets.token_urlsafe(18)}"
    checks: list[dict] = []

    def check(check_id: str, title: str, status: int, passed: bool, note: str = ""):
        checks.append(
            {
                "id": check_id,
                "title": title,
                "http_status": status,
                "result": "Pass" if passed else "Fail",
                "note": note,
            }
        )
        print(f"{'PASS' if passed else 'FAIL'} {check_id} [{status}] {title}")

    status, health = request("GET", "/health")
    check(
        "DEP-API-01",
        "Production health, PostgreSQL and version",
        status,
        status == 200
        and health.get("status") == "ok"
        and health.get("database") == "postgresql"
        and health.get("version") == "1.2.0",
        f"database={health.get('database')}; version={health.get('version')}",
    )

    status, species = request("GET", "/api/v1/species")
    check(
        "DEP-API-02",
        "Supported species catalogue",
        status,
        status == 200 and isinstance(species, list) and len(species) == 152,
        f"count={len(species) if isinstance(species, list) else 'invalid'}",
    )

    status, locations = request("GET", "/api/v1/locations")
    check(
        "DEP-API-03",
        "Iteration 1 location scope",
        status,
        status == 200
        and locations.get("total") == 6
        and len(locations.get("items", [])) == 6,
        f"count={locations.get('total')}",
    )

    status, search = request("GET", "/api/v1/locations?query=GASING")
    check(
        "DEP-API-04",
        "Case-insensitive partial location search",
        status,
        status == 200
        and any("gasing" in item.get("name", "").lower() for item in search.get("items", [])),
    )

    registration = {
        "username": username,
        "age": 11,
        "email": email,
        "password": password,
        "avatar": "tiger",
    }
    status, account = request("POST", "/api/v1/auth/register", registration)
    check(
        "DEP-API-05",
        "Synthetic account registration",
        status,
        status == 200 and bool(account.get("access_token")) and bool(account.get("child_id")),
    )
    token = account.get("access_token", "")
    child_id = account.get("child_id")
    if not token or child_id is None:
        raise RuntimeError("Cannot continue authenticated checks after registration failure")

    status, duplicate = request(
        "POST",
        "/api/v1/auth/register",
        {**registration, "email": f"other_{email}"},
    )
    check(
        "DEP-API-06",
        "Duplicate username protection",
        status,
        status == 400 and "taken" in str(duplicate).lower(),
    )

    status, bad_login = request(
        "POST",
        "/api/v1/auth/login",
        {"username_or_email": username, "password": "WrongPassword123"},
    )
    check("DEP-API-07", "Invalid login rejected", status, status == 401)

    status, good_login = request(
        "POST",
        "/api/v1/auth/login",
        {"username_or_email": username.upper(), "password": password},
    )
    check(
        "DEP-API-08",
        "Valid case-insensitive login",
        status,
        status == 200 and good_login.get("child_id") == child_id,
    )

    status, unauthenticated = request("GET", f"/api/v1/children/{child_id}/profile")
    check("DEP-API-09", "Profile requires authentication", status, status == 401)

    status, other = request(
        "POST",
        "/api/v1/auth/register",
        {
            "username": other_username,
            "age": 10,
            "email": f"{other_username}@rimbaquest.test",
            "password": f"T!{secrets.token_urlsafe(18)}",
            "avatar": "panda",
        },
    )
    other_token = other.get("access_token", "")
    check("DEP-API-10", "Second ownership-test account registration", status, status == 200)

    status, forbidden = request(
        "GET",
        f"/api/v1/children/{child_id}/profile",
        token=other_token,
    )
    check("DEP-API-11", "Cross-child profile access forbidden", status, status == 403)

    new_username = f"edit_{uuid.uuid4().hex[:8]}"
    status, profile = request(
        "PUT",
        f"/api/v1/children/{child_id}/profile",
        {"username": new_username, "avatar": "panda", "age": 12},
        token,
    )
    check(
        "DEP-API-12",
        "Profile username/avatar update",
        status,
        status == 200
        and profile.get("username") == new_username
        and profile.get("avatar") == "panda",
    )

    status, recovery = request("POST", "/api/v1/auth/forgot-password", {"email": email})
    recovery_token = recovery.get("simulated_token", "")
    check(
        "DEP-API-13",
        "Prototype recovery code generation",
        status,
        status == 200 and bool(recovery_token),
    )

    new_password = f"T!{secrets.token_urlsafe(18)}"
    status, reset = request(
        "POST",
        "/api/v1/auth/reset-password",
        {
            "email": email,
            "recovery_token": recovery_token,
            "new_password": new_password,
        },
    )
    check("DEP-API-14", "Password reset", status, status == 200)

    status, relogin = request(
        "POST",
        "/api/v1/auth/login",
        {"username_or_email": new_username, "password": new_password},
    )
    check(
        "DEP-API-15",
        "Login after username and password change",
        status,
        status == 200 and relogin.get("child_id") == child_id,
    )
    token = relogin.get("access_token", token)

    species_id = species[0]["id"]
    status, before = request(
        "GET", f"/api/v1/children/{child_id}/progress", token=token
    )
    check(
        "DEP-API-16",
        "Initial collection progress",
        status,
        status == 200 and before.get("found") == 0 and before.get("total") == 152,
    )

    discovery_payload = {
        "species_id": species_id,
        "location_label": "QA Test Location - not real child data",
    }
    status, first = request(
        "POST",
        f"/api/v1/children/{child_id}/discoveries",
        discovery_payload,
        token,
    )
    check(
        "DEP-API-17",
        "First discovery unlock and XP",
        status,
        status == 200
        and first.get("first_discovery") is True
        and first.get("xp_awarded") == 100,
    )

    status, repeat = request(
        "POST",
        f"/api/v1/children/{child_id}/discoveries",
        discovery_payload,
        token,
    )
    check(
        "DEP-API-18",
        "Repeat discovery creates no duplicate reward",
        status,
        status == 200
        and repeat.get("first_discovery") is False
        and repeat.get("xp_awarded") == 0,
    )

    status, after = request(
        "GET", f"/api/v1/children/{child_id}/progress", token=token
    )
    check(
        "DEP-API-19",
        "Unique progress remains one after repeat",
        status,
        status == 200 and after.get("found") == 1 and after.get("profile", {}).get("xp") == 100,
    )

    status, gallery = request(
        "GET",
        f"/api/v1/children/{child_id}/species/{species_id}/gallery",
        token=token,
    )
    check(
        "DEP-API-20",
        "Repeat observations retained in gallery",
        status,
        status == 200 and gallery.get("total") == 2,
    )

    status, battle = request(
        "POST",
        f"/api/v1/children/{child_id}/battle/record",
        {"won": True, "opponent_name": "QA Forest Shadow", "rounds": 2},
        token,
    )
    check(
        "DEP-API-21",
        "Battle outcome is authenticated and recorded",
        status,
        status == 200 and battle.get("xp_awarded") == 50,
    )

    evidence = {
        "executed_at_utc": datetime.now(timezone.utc).isoformat(),
        "base_url": BASE_URL,
        "synthetic_test_account": {
            "username_after_profile_update": new_username,
            "child_id": child_id,
            "credentials_recorded": False,
            "deletion_available": False,
        },
        "summary": {
            "total": len(checks),
            "passed": sum(item["result"] == "Pass" for item in checks),
            "failed": sum(item["result"] == "Fail" for item in checks),
        },
        "checks": checks,
    }
    Path(output_path).write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    return 0 if evidence["summary"]["failed"] == 0 else 1


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: deployed_api_smoke.py OUTPUT_JSON")
    raise SystemExit(main(sys.argv[1]))
