from __future__ import annotations

from datetime import datetime, timedelta, timezone
import secrets
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import insert, update

from app.core.database import engine
from app.core.schema import collection_entries, wildlife_matches
from app.main import app


client = TestClient(app)
BASE = "/api/v1/wildlife-battles"
FRIENDS = "/api/v1/friends"
CARDS = ("sp_malayan_tiger", "sp_asian_elephant")


def _user(label: str, *cards: str) -> tuple[int, dict[str, str]]:
    username = f"f_{label[:8]}_{uuid4().hex[:7]}"
    response = client.post("/api/v1/auth/register", json={
        "username": username, "email": f"{username}@rimba.test",
        "password": "friendPassword123!", "age": 10, "avatar": "hornbill",
    })
    assert response.status_code == 200, response.text
    child_id = response.json()["child_id"]
    with engine.begin() as connection:
        for species_id in cards:
            connection.execute(insert(collection_entries).values(
                child_id=child_id, species_id=species_id,
                unlock_reason="discovery", observed_boolean=True,
            ))
    return child_id, {"Authorization": f"Bearer {response.json()['access_token']}"}


def _friends(headers: dict[str, str]) -> dict:
    response = client.get(FRIENDS, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def _befriend(headers: dict[str, str], other_headers: dict[str, str]) -> None:
    code = _friends(other_headers)["friend_code"]
    response = client.post(FRIENDS, json={"code": code}, headers=headers)
    assert response.status_code == 200, response.text


def test_friend_code_adds_a_mutual_friend():
    alice, ha = _user("alice")
    bob, hb = _user("bob")
    assert client.get(FRIENDS).status_code == 401
    mine = _friends(ha)
    assert len(mine["friend_code"]) == 6 and mine["friends"] == []
    assert _friends(ha)["friend_code"] == mine["friend_code"]

    bob_code = _friends(hb)["friend_code"]
    # Codes are forgiving about case, spaces and dashes when typed by hand.
    typed = f" {bob_code[:3].lower()}-{bob_code[3:]} "
    added = client.post(FRIENDS, json={"code": typed}, headers=ha)
    assert added.status_code == 200, added.text
    assert added.json()["already_friends"] is False
    friend = added.json()["friend"]
    assert (friend["child_id"], friend["display_name"].startswith("f_bob_"), friend["points"]) == (bob, True, 0)
    assert [friend["child_id"] for friend in _friends(ha)["friends"]] == [bob]
    assert [friend["child_id"] for friend in _friends(hb)["friends"]] == [alice]

    again = client.post(FRIENDS, json={"code": bob_code}, headers=ha)
    assert again.status_code == 200 and again.json()["already_friends"] is True
    assert len(_friends(ha)["friends"]) == 1

    assert client.post(FRIENDS, json={"code": mine["friend_code"]}, headers=ha).status_code == 400
    assert client.post(FRIENDS, json={"code": "ZZZZZZZZ"}, headers=ha).status_code == 404
    assert client.post(FRIENDS, json={"code": "--"}, headers=ha).status_code == 400


def test_invite_a_friend_from_the_friend_list_to_battle():
    host, hh = _user("host", CARDS[0])
    friend, hf = _user("friend", CARDS[1])
    stranger, hs = _user("stranger", CARDS[1])

    blocked = client.post(BASE, json={"mode": "friend", "friend_child_id": friend}, headers=hh)
    assert blocked.status_code == 403
    _befriend(hh, hf)
    assert client.post(BASE, json={"mode": "bot", "friend_child_id": friend}, headers=hh).status_code == 400

    created = client.post(BASE, json={"mode": "friend", "friend_child_id": friend}, headers=hh)
    assert created.status_code == 200, created.text
    match = created.json()["match"]
    outgoing = _friends(hh)["outgoing_invites"]
    assert [(item["match_id"], item["friend_child_id"], item["status"]) for item in outgoing] == [(match["id"], friend, "setup")]
    # The friend only sees the invitation once the host has picked a card.
    assert _friends(hf)["incoming_invites"] == []

    selected = client.post(f"{BASE}/{match['id']}/select", json={"species_id": CARDS[0]}, headers=hh)
    assert selected.status_code == 200, selected.text
    code = selected.json()["match"]["invite_code"]
    incoming = _friends(hf)["incoming_invites"]
    assert [(item["match_id"], item["invite_code"], item["friend_child_id"]) for item in incoming] == [(match["id"], code, host)]
    assert _friends(hs)["incoming_invites"] == []

    # The code is reserved for the invited friend.
    assert client.get(f"{BASE}/invites/{code}", headers=hs).status_code == 403
    assert client.get(f"{BASE}/invites/{code}/cards-preview", headers=hs).status_code == 403
    assert client.post(f"{BASE}/invites/{code}/join", json={"species_id": CARDS[1]}, headers=hs).status_code == 403

    preview = client.get(f"{BASE}/invites/{code}", headers=hf)
    assert preview.status_code == 200
    assert preview.json()["invite"]["host_display_name"] == _friends(hf)["friends"][0]["display_name"]
    joined = client.post(f"{BASE}/invites/{code}/join", json={"species_id": CARDS[1]}, headers=hf)
    assert joined.status_code == 200, joined.text
    state = joined.json()["match"]["state"]
    assert joined.json()["match"]["status"] == "active"
    assert state["player"]["energy"] == state["opponent"]["energy"] == 5
    assert _friends(hf)["incoming_invites"] == [] and _friends(hh)["outgoing_invites"] == []


def test_invited_friend_can_decline_and_the_host_match_is_canceled():
    host, hh = _user("host", CARDS[0])
    friend, hf = _user("friend", CARDS[1])
    stranger, hs = _user("stranger", CARDS[1])
    _befriend(hh, hf)
    match = client.post(BASE, json={"mode": "friend", "friend_child_id": friend}, headers=hh).json()["match"]
    selected = client.post(f"{BASE}/{match['id']}/select", json={"species_id": CARDS[0]}, headers=hh)
    assert selected.status_code == 200 and selected.json()["match"]["my_species_id"] == CARDS[0]

    incoming = _friends(hf)["incoming_invites"]
    assert incoming[0]["expires_at"] and _friends(hh)["outgoing_invites"][0]["expires_at"]

    # Only the invited friend can decline.
    assert client.post(f"/api/v1/friends/invites/{match['id']}/decline", headers=hs).status_code == 404
    declined = client.post(f"/api/v1/friends/invites/{match['id']}/decline", headers=hf)
    assert declined.status_code == 200 and declined.json() == {"declined": True}
    assert _friends(hf)["incoming_invites"] == []
    assert client.get(f"{BASE}/{match['id']}", headers=hh).json()["match"]["status"] == "canceled"
    # Declining twice is harmless.
    assert client.post(f"/api/v1/friends/invites/{match['id']}/decline", headers=hf).json() == {"declined": False}


def test_friend_leaderboard_ranks_me_and_my_friends_only():
    me, hm = _user("me", CARDS[0])
    pal, hp = _user("pal", CARDS[1])
    outsider, ho = _user("outsider")
    board = client.get(f"{BASE}/leaderboard", headers=hm).json()
    assert [entry["child_id"] for entry in board["entries"]] == [me]
    assert board["viewer"] == board["entries"][0] and board["viewer"]["points"] == 0

    _befriend(hm, hp)
    match = client.post(BASE, json={"mode": "friend", "friend_child_id": pal}, headers=hm).json()["match"]
    code = client.post(f"{BASE}/{match['id']}/select", json={"species_id": CARDS[0]}, headers=hm).json()["match"]["invite_code"]
    active = client.post(f"{BASE}/invites/{code}/join", json={"species_id": CARDS[1]}, headers=hp).json()["match"]
    finished = client.post(f"{BASE}/{active['id']}/forfeit", json={
        "expected_version": active["version"], "client_request_id": str(uuid4()),
    }, headers=hp)
    assert finished.status_code == 200, finished.text

    board = client.get(f"{BASE}/leaderboard", headers=hm).json()
    assert [(entry["child_id"], entry["points"], entry["rank"]) for entry in board["entries"]] == [(me, 5, 1), (pal, 0, 2)]
    assert outsider not in [entry["child_id"] for entry in board["entries"]]
    assert [entry["child_id"] for entry in client.get(f"{BASE}/leaderboard", headers=ho).json()["entries"]] == [outsider]


def test_bot_opening_move_waits_so_both_cards_start_at_five_energy(monkeypatch):
    _, headers = _user("botfirst", CARDS[0])
    original = secrets.choice
    monkeypatch.setattr(secrets, "choice", lambda seq: "opponent" if tuple(seq) == ("player", "opponent") else original(seq))
    match = client.post(BASE, json={"mode": "bot"}, headers=headers).json()["match"]
    started = client.post(f"{BASE}/{match['id']}/select", json={"species_id": CARDS[0]}, headers=headers).json()["match"]
    state = started["state"]
    assert state["turn"] == "opponent" and state["turn_count"] == 0
    assert state["player"]["energy"] == state["opponent"]["energy"] == 5
    assert client.get(f"{BASE}/{match['id']}", headers=headers).json()["match"]["state"]["turn_count"] == 0

    with engine.begin() as connection:
        connection.execute(update(wildlife_matches).where(wildlife_matches.c.id == match["id"]).values(
            updated_at=datetime.now(timezone.utc) - timedelta(seconds=3),
        ))
    moved = client.get(f"{BASE}/{match['id']}", headers=headers).json()["match"]
    assert moved["state"]["turn"] == "player" and moved["state"]["turn_count"] == 1
    assert moved["version"] == started["version"] + 1
    assert any(event["type"] == "action" for event in moved["events"])
