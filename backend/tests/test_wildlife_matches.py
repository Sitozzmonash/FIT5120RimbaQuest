from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import insert, or_, select, update

from app.core.database import engine
from app.core.schema import collection_entries, wildlife_card_rest, wildlife_leaderboard, wildlife_matches
from app.main import app
from app.services.wildlife_battle import HABITATS, habitat_matches


client = TestClient(app)
BASE = "/api/v1/wildlife-battles"
CARDS = ("sp_malayan_tiger", "sp_asian_elephant", "sp_wild_boar", "sp_sun_bear")


def _user(label: str) -> tuple[int, dict[str, str]]:
    username = f"w_{label[:8]}_{uuid4().hex[:7]}"
    response = client.post("/api/v1/auth/register", json={
        "username": username, "email": f"{username}@rimba.test",
        "password": "battlePassword123!", "age": 10, "avatar": "hornbill",
    })
    assert response.status_code == 200, response.text
    return response.json()["child_id"], {"Authorization": f"Bearer {response.json()['access_token']}"}


def _own(child_id: int, *species_ids: str) -> None:
    with engine.begin() as connection:
        for species_id in species_ids:
            connection.execute(insert(collection_entries).values(
                child_id=child_id, species_id=species_id,
                unlock_reason="discovery", observed_boolean=True,
            ))


def _create(headers: dict[str, str], mode: str = "bot") -> dict:
    response = client.post(BASE, json={"mode": mode, "client_request_id": str(uuid4())}, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["match"]


def _select(match_id: str, headers: dict[str, str], species_id: str) -> dict:
    response = client.post(f"{BASE}/{match_id}/select", json={
        "species_id": species_id, "client_request_id": str(uuid4()),
    }, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["match"]


def _forfeit(match: dict, headers: dict[str, str], request_id: str | None = None):
    return client.post(f"{BASE}/{match['id']}/forfeit", json={
        "expected_version": match["version"], "client_request_id": request_id or str(uuid4()),
    }, headers=headers)


def test_auth_habitat_before_card_and_preview_ownership():
    owner, h1 = _user("setup")
    outsider, h2 = _user("outsider")
    _own(owner, CARDS[0])
    assert client.post(BASE, json={"mode": "bot"}).status_code == 401
    match = _create(h1)
    assert match["status"] == "setup"
    assert match["state"] is None and match["habitat"] in HABITATS
    assert datetime.fromisoformat(match["server_now"]).tzinfo is not None
    current = client.get(f"{BASE}/me/current", headers=h1)
    assert current.status_code == 200
    assert current.json()["match"]["id"] == match["id"]
    assert client.get(f"{BASE}/me/current", headers=h2).json() == {"match": None}
    assert client.get(f"{BASE}/{match['id']}", headers=h2).status_code == 403
    assert client.get(f"{BASE}/{match['id']}/cards-preview", headers=h2).status_code == 403
    preview = client.get(f"{BASE}/{match['id']}/cards-preview", headers=h1)
    assert preview.status_code == 200
    cards = preview.json()["cards"]
    assert [card["species_id"] for card in cards] == [CARDS[0]]
    with engine.connect() as connection:
        from app.core.schema import species
        raw = connection.execute(select(species.c.habitat).where(species.c.id == CARDS[0])).scalar_one()
    assert cards[0]["habitat_match"] == habitat_matches(raw, match["habitat"])
    assert cards[0]["selectable"] is True
    assert client.post(f"{BASE}/{match['id']}/select", json={
        "species_id": CARDS[1], "client_request_id": str(uuid4()),
    }, headers=h1).status_code == 403
    assert client.post(f"{BASE}/{match['id']}/select", json={
        "species_id": CARDS[0], "side": "opponent",
    }, headers=h1).status_code == 422
    assert outsider != owner


def test_create_request_replays_same_habitat_and_rejects_reuse():
    _child, headers = _user("idempotent")
    request_id = str(uuid4())
    body = {"mode": "friend", "client_request_id": request_id}
    first = client.post(BASE, json=body, headers=headers)
    assert first.status_code == 200, first.text
    assert client.post(BASE, json=body, headers=headers).json() == first.json()
    conflict = client.post(BASE, json={"mode": "bot", "client_request_id": request_id}, headers=headers)
    assert conflict.status_code == 409


def test_bot_forfeit_rest_countdown_and_zero_leaderboard_points():
    child_id, headers = _user("rest")
    _own(child_id, *CARDS[:3])
    first = _select(_create(headers)["id"], headers, CARDS[0])
    assert first["status"] == "active"
    assert first["viewer_side"] == "player" and first["state"]["player"]["species_id"] == CARDS[0]
    assert first["state"]["opponent"]["species_id"] != CARDS[0]
    completed = _forfeit(first, headers)
    assert completed.status_code == 200, completed.text
    assert completed.json()["match"]["leaderboard_delta"] == 0
    rest = {card["species_id"]: card["remaining"] for card in client.get(f"{BASE}/me/rest", headers=headers).json()["cards"]}
    assert rest[CARDS[0]] == 2
    setup = _create(headers)
    blocked = client.post(f"{BASE}/{setup['id']}/select", json={"species_id": CARDS[0]}, headers=headers)
    assert blocked.status_code == 409
    second = _select(setup["id"], headers, CARDS[1])
    assert _forfeit(second, headers).status_code == 200
    rest = {card["species_id"]: card["remaining"] for card in client.get(f"{BASE}/me/rest", headers=headers).json()["cards"]}
    assert rest[CARDS[0]] == 1 and rest[CARDS[1]] == 2
    third = _select(_create(headers)["id"], headers, CARDS[2])
    assert _forfeit(third, headers).status_code == 200
    rest = {card["species_id"]: card["remaining"] for card in client.get(f"{BASE}/me/rest", headers=headers).json()["cards"]}
    assert rest[CARDS[0]] == 0 and rest[CARDS[1]] == 1 and rest[CARDS[2]] == 2
    assert _select(_create(headers)["id"], headers, CARDS[0])["status"] == "active"
    board = client.get(f"{BASE}/leaderboard", headers=headers).json()
    assert board["viewer"]["points"] == 0
    with engine.connect() as connection:
        assert connection.execute(select(wildlife_leaderboard.c.points).where(
            wildlife_leaderboard.c.child_id == child_id,
        )).scalar_one_or_none() is None


def test_friend_invite_action_timeout_forfeit_and_exact_once_scores():
    owner, h1 = _user("owner")
    guest, h2 = _user("guest")
    stranger, h3 = _user("stranger")
    _own(owner, CARDS[0])
    _own(guest, CARDS[1])
    setup = _create(h1, "friend")
    assert setup["invite_code"] is None
    assert client.get(f"{BASE}/invites/not-a-code", headers=h2).status_code == 404
    waiting = _select(setup["id"], h1, CARDS[0])
    assert waiting["status"] == "waiting" and waiting["invite_code"]
    code = waiting["invite_code"]
    assert code == code.upper()
    invite = client.get(f"{BASE}/invites/{code}", headers=h2)
    assert invite.status_code == 200
    assert invite.json()["invite"]["habitat"] == setup["habitat"]
    assert invite.json()["invite"]["can_join"] is True
    assert "owner_species_id" not in invite.json()["invite"]
    assert client.post(f"{BASE}/invites/{code}/join", json={"species_id": CARDS[0]}, headers=h1).status_code == 403
    guest_cards = client.get(f"{BASE}/invites/{code}/cards-preview", headers=h2)
    assert guest_cards.status_code == 200
    assert guest_cards.json()["cards"][0]["species_id"] == CARDS[1]
    join_id = str(uuid4())
    joined = client.post(f"{BASE}/invites/{code}/join", json={
        "species_id": CARDS[1], "client_request_id": join_id,
    }, headers=h2)
    assert joined.status_code == 200, joined.text
    active = joined.json()["match"]
    assert active["status"] == "active" and active["viewer_side"] == "opponent"
    assert active["deadline_at"] and active["state"]["winner"] is None
    assert client.post(f"{BASE}/invites/{code}/join", json={
        "species_id": CARDS[1], "client_request_id": join_id,
    }, headers=h2).json() == joined.json()
    assert client.get(f"{BASE}/{active['id']}", headers=h3).status_code == 403
    assert client.post(f"{BASE}/{active['id']}/action", json={
        "action": "basic", "expected_version": active["version"], "client_request_id": str(uuid4()),
    }, headers=h3).status_code == 403
    acting_headers = h1 if active["state"]["turn"] == "player" else h2
    waiting_headers = h2 if acting_headers is h1 else h1
    wrong_side = client.post(f"{BASE}/{active['id']}/action", json={
        "action": "basic", "expected_version": active["version"], "client_request_id": str(uuid4()),
    }, headers=waiting_headers)
    assert wrong_side.status_code == 400
    action_id = str(uuid4())
    action_payload = {"action": "basic", "expected_version": active["version"], "client_request_id": action_id}
    acted = client.post(f"{BASE}/{active['id']}/action", json=action_payload, headers=acting_headers)
    assert acted.status_code == 200, acted.text
    assert acted.json()["match"]["version"] == active["version"] + 1
    polled = client.get(f"{BASE}/{active['id']}", headers=waiting_headers)
    assert polled.status_code == 200
    assert any(event["type"] == "damage" for event in polled.json()["match"]["events"])
    assert client.post(f"{BASE}/{active['id']}/action", json=action_payload, headers=acting_headers).json() == acted.json()
    assert client.post(f"{BASE}/{active['id']}/action", json={
        "action": "basic", "expected_version": active["version"], "client_request_id": str(uuid4()),
    }, headers=acting_headers).status_code == 409

    current = acted.json()["match"]
    turn = current["state"]["turn"]
    energy = current["state"][turn]["energy"]
    with engine.begin() as connection:
        connection.execute(update(wildlife_matches).where(wildlife_matches.c.id == current["id"]).values(
            deadline_at=datetime.now(timezone.utc) - timedelta(seconds=1),
        ))
    timed = client.get(f"{BASE}/{current['id']}", headers=h1)
    assert timed.status_code == 200, timed.text
    skipped = timed.json()["match"]
    assert skipped["version"] == current["version"] + 1
    assert skipped["state"]["turn"] != turn
    assert skipped["state"][turn]["energy"] == energy
    assert any(event["type"] == "timeout" for event in skipped["events"])
    assert client.get(f"{BASE}/{current['id']}", headers=h1).json()["match"]["version"] == skipped["version"]

    finish_id = str(uuid4())
    finished = _forfeit(skipped, h1, finish_id)
    assert finished.status_code == 200, finished.text
    assert finished.json()["match"]["status"] == "completed"
    assert finished.json()["match"]["leaderboard_delta"] == -3
    assert _forfeit(skipped, h1, finish_id).json() == finished.json()
    assert _forfeit(skipped, h1).status_code == 409
    with engine.connect() as connection:
        points = dict(connection.execute(select(
            wildlife_leaderboard.c.child_id, wildlife_leaderboard.c.points,
        ).where(wildlife_leaderboard.c.child_id.in_([owner, guest]))).all())
        rest = dict(connection.execute(select(
            wildlife_card_rest.c.child_id, wildlife_card_rest.c.remaining,
        ).where(wildlife_card_rest.c.child_id.in_([owner, guest]))).all())
    assert points == {owner: -3, guest: 5}
    assert rest == {owner: 2, guest: 2}
    board = client.get(f"{BASE}/leaderboard", headers=h2).json()
    assert board["viewer"]["points"] == 5
    assert board["entries"][0]["child_id"] == guest
    assert stranger not in points


def test_host_can_cancel_waiting_invite_without_rest_or_points():
    owner, h1 = _user("cancel")
    guest, h2 = _user("cancelgst")
    _own(owner, CARDS[0])
    _own(guest, CARDS[1])
    waiting = _select(_create(h1, "friend")["id"], h1, CARDS[0])
    cancel_id = str(uuid4())
    payload = {"expected_version": waiting["version"], "client_request_id": cancel_id}
    assert client.post(f"{BASE}/{waiting['id']}/cancel", json=payload, headers=h2).status_code == 403
    canceled = client.post(f"{BASE}/{waiting['id']}/cancel", json=payload, headers=h1)
    assert canceled.status_code == 200, canceled.text
    assert canceled.json()["match"]["status"] == "canceled"
    assert canceled.json()["match"]["leaderboard_delta"] is None
    assert client.post(f"{BASE}/{waiting['id']}/cancel", json=payload, headers=h1).json() == canceled.json()
    assert client.post(f"{BASE}/invites/{waiting['invite_code']}/join", json={
        "species_id": CARDS[1], "client_request_id": str(uuid4()),
    }, headers=h2).status_code == 409
    assert client.get(f"{BASE}/invites/{waiting['invite_code']}", headers=h2).status_code == 409
    assert all(card["remaining"] == 0 for card in client.get(f"{BASE}/me/rest", headers=h1).json()["cards"])
    assert client.get(f"{BASE}/leaderboard", headers=h1).json()["viewer"]["points"] == 0
    assert client.get(f"{BASE}/me/current", headers=h1).json() == {"match": None}


def test_only_one_open_match_per_child_and_current_recovers_friend():
    owner, h1 = _user("oneopen")
    guest, h2 = _user("guestopen")
    _own(owner, CARDS[0])
    _own(guest, CARDS[1])
    owner_setup = _create(h1, "friend")
    duplicate = client.post(BASE, json={"mode": "bot", "client_request_id": str(uuid4())}, headers=h1)
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"]["match_id"] == owner_setup["id"]
    waiting = _select(owner_setup["id"], h1, CARDS[0])
    assert client.get(f"{BASE}/me/current", headers=h1).json()["match"]["status"] == "waiting"
    guest_setup = _create(h2)
    refused = client.post(f"{BASE}/invites/{waiting['invite_code']}/join", json={
        "species_id": CARDS[1], "client_request_id": str(uuid4()),
    }, headers=h2)
    assert refused.status_code == 409
    assert refused.json()["detail"]["match_id"] == guest_setup["id"]
    cancel_guest = client.post(f"{BASE}/{guest_setup['id']}/cancel", json={
        "expected_version": guest_setup["version"], "client_request_id": str(uuid4()),
    }, headers=h2)
    assert cancel_guest.status_code == 200, cancel_guest.text
    joined = client.post(f"{BASE}/invites/{waiting['invite_code']}/join", json={
        "species_id": CARDS[1], "client_request_id": str(uuid4()),
    }, headers=h2)
    assert joined.status_code == 200, joined.text
    active = joined.json()["match"]
    assert active["status"] == "active"
    assert client.get(f"{BASE}/me/current", headers=h1).json()["match"]["id"] == active["id"]
    assert client.get(f"{BASE}/me/current", headers=h2).json()["match"]["viewer_side"] == "opponent"
    # A legacy overlapping setup must not displace the active match on resume.
    now = datetime.now(timezone.utc)
    with engine.begin() as connection:
        connection.execute(insert(wildlife_matches).values(
            id=str(uuid4()), mode="bot", habitat=HABITATS[0], owner_child_id=owner,
            status="setup", state=None, version=0,
            created_at=now + timedelta(minutes=1), updated_at=now,
            expires_at=now + timedelta(hours=2), settled=False,
        ))
    assert client.get(f"{BASE}/me/current", headers=h1).json()["match"]["id"] == active["id"]
    assert client.post(BASE, json={"mode": "friend"}, headers=h2).status_code == 409


def test_simultaneous_setups_create_only_one_open_match():
    child_id, headers = _user("racecreate")
    gate = Barrier(3)

    def create_from_thread():
        gate.wait(timeout=5)
        return TestClient(app).post(BASE, json={
            "mode": "bot", "client_request_id": str(uuid4()),
        }, headers=headers)

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(create_from_thread) for _ in range(2)]
        gate.wait(timeout=5)
        responses = [future.result(timeout=10) for future in futures]

    assert sorted(response.status_code for response in responses) == [200, 409]
    created = next(response.json()["match"] for response in responses if response.status_code == 200)
    conflict = next(response.json()["detail"] for response in responses if response.status_code == 409)
    assert conflict["match_id"] == created["id"]
    with engine.connect() as connection:
        rows = connection.execute(select(wildlife_matches.c.id).where(
            wildlife_matches.c.owner_child_id == child_id,
            wildlife_matches.c.status.in_(("setup", "waiting", "active")),
        )).scalars().all()
    assert rows == [created["id"]]


def test_simultaneous_guest_join_and_create_leave_one_open_match():
    owner, owner_headers = _user("raceowner")
    guest, guest_headers = _user("raceguest")
    _own(owner, CARDS[0])
    _own(guest, CARDS[1])
    waiting = _select(_create(owner_headers, "friend")["id"], owner_headers, CARDS[0])
    gate = Barrier(3)

    def join_from_thread():
        gate.wait(timeout=5)
        return TestClient(app).post(f"{BASE}/invites/{waiting['invite_code']}/join", json={
            "species_id": CARDS[1], "client_request_id": str(uuid4()),
        }, headers=guest_headers)

    def create_from_thread():
        gate.wait(timeout=5)
        return TestClient(app).post(BASE, json={
            "mode": "bot", "client_request_id": str(uuid4()),
        }, headers=guest_headers)

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(join_from_thread), pool.submit(create_from_thread)]
        gate.wait(timeout=5)
        responses = [future.result(timeout=10) for future in futures]

    assert sorted(response.status_code for response in responses) == [200, 409]
    current = client.get(f"{BASE}/me/current", headers=guest_headers)
    assert current.status_code == 200
    with engine.connect() as connection:
        rows = connection.execute(select(wildlife_matches.c.id).where(
            wildlife_matches.c.status.in_(("setup", "waiting", "active")),
            or_(wildlife_matches.c.owner_child_id == guest, wildlife_matches.c.guest_child_id == guest),
        )).scalars().all()
    assert rows == [current.json()["match"]["id"]]


def test_host_rest_between_invite_and_join_requires_reselection():
    owner, h1 = _user("hostrest")
    guest, h2 = _user("hostguest")
    _own(owner, CARDS[0], CARDS[2])
    _own(guest, CARDS[1])
    waiting = _select(_create(h1, "friend")["id"], h1, CARDS[0])
    with engine.begin() as connection:
        connection.execute(insert(wildlife_card_rest).values(
            child_id=owner, species_id=CARDS[0], remaining=2,
        ))
    blocked = client.post(f"{BASE}/invites/{waiting['invite_code']}/join", json={
        "species_id": CARDS[1], "client_request_id": str(uuid4()),
    }, headers=h2)
    assert blocked.status_code == 409
    changed = _select(waiting["id"], h1, CARDS[2])
    assert changed["status"] == "waiting" and changed["version"] == waiting["version"] + 1
    assert changed["invite_code"] == waiting["invite_code"]
    joined = client.post(f"{BASE}/invites/{waiting['invite_code']}/join", json={
        "species_id": CARDS[1], "client_request_id": str(uuid4()),
    }, headers=h2)
    assert joined.status_code == 200, joined.text
    assert joined.json()["match"]["state"]["player"]["species_id"] == CARDS[2]


def test_expired_setup_and_friend_waiting_reject_late_actions():
    owner, headers = _user("expiry")
    _own(owner, CARDS[0])
    waiting = _select(_create(headers, "friend")["id"], headers, CARDS[0])
    with engine.begin() as connection:
        connection.execute(update(wildlife_matches).where(
            wildlife_matches.c.id == waiting["id"],
        ).values(expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)))
    assert client.get(f"{BASE}/{waiting['id']}", headers=headers).status_code == 410
    assert client.get(f"{BASE}/invites/{waiting['invite_code']}", headers=headers).status_code == 410
    with engine.connect() as connection:
        assert connection.execute(select(wildlife_matches.c.status).where(
            wildlife_matches.c.id == waiting["id"],
        )).scalar_one() == "expired"
