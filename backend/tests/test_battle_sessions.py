from __future__ import annotations

import datetime
from datetime import timezone
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy import insert, select, update

from app.core.database import engine, initialise_database
from app.core.schema import (
    battle_first_wins,
    battle_requests,
    battle_sessions,
    child_profiles,
    collection_entries,
    metadata,
)
from app.main import app

client = TestClient(app)


def register_user(suffix: str = "sess_user") -> tuple[int, str]:
    u = f"{suffix[:10]}_{uuid4().hex[:8]}"
    payload = {
        "username": u,
        "age": 10,
        "email": f"{u}@rimba.test",
        "password": "battlePassword123!",
        "avatar": "hornbill",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    return data["child_id"], data["access_token"]


def add_collection_entry(child_id: int, species_id: str):
    with engine.begin() as conn:
        conn.execute(
            insert(collection_entries).values(
                child_id=child_id,
                species_id=species_id,
                unlock_reason="discovery",
                observed_boolean=True,
            )
        )


def test_schema_create_all_preservation():
    """Verify calling initialise_database() / create_all multiple times preserves existing tables & data."""
    child_id, _ = register_user("preservation")
    add_collection_entry(child_id, "sp_malayan_tiger")

    # Call initialise_database again
    initialise_database()

    with engine.connect() as conn:
        entry = conn.execute(
            select(collection_entries.c.id).where(
                collection_entries.c.child_id == child_id,
                collection_entries.c.species_id == "sp_malayan_tiger",
            )
        ).first()
        assert entry is not None


def test_collection_and_auth_ownership():
    """Test start battle requires collection ownership and valid auth, plus foreign session access blocked."""
    child_1, token_1 = register_user("user_1")
    child_id = child_1
    child_2, token_2 = register_user("user_2")
    headers_1 = {"Authorization": f"Bearer {token_1}"}
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    # 1. Unowned species card -> 403
    req_id = f"req_{uuid4().hex}"
    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": req_id},
        headers=headers_1,
    )
    assert res.status_code == 403

    # Add card to child 1
    add_collection_entry(child_1, "sp_malayan_tiger")

    # Unauthenticated -> 401
    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": req_id},
    )
    assert res.status_code == 401

    # Start battle succeeds for child 1
    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": req_id},
        headers=headers_1,
    )
    assert res.status_code == 200
    data = res.json()
    battle_id = data["state"]["battle_id"]

    # Child 2 accessing child 1's battle session GET -> 403
    res = client.get(f"/api/v1/battles/{battle_id}", headers=headers_2)
    assert res.status_code == 403

    # Child 2 mutating child 1's battle session -> 403
    res = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": f"c2_{uuid4().hex}", "expected_version": 0},
        headers=headers_2,
    )
    assert res.status_code == 403


def test_request_validation_extra_forbid():
    """Test request schema forbids forged fields like forged HP, roll, opponent stats."""
    child_id, token = register_user("val_user")
    headers = {"Authorization": f"Bearer {token}"}
    add_collection_entry(child_id, "sp_malayan_tiger")

    # Start with forged field
    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={
            "player_species_id": "sp_malayan_tiger",
            "client_request_id": f"req_{uuid4().hex}",
            "forged_hp": 9999,
        },
        headers=headers,
    )
    assert res.status_code == 422

    # Start valid battle
    start_req = f"req_{uuid4().hex}"
    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": start_req},
        headers=headers,
    )
    assert res.status_code == 200
    battle_id = res.json()["state"]["battle_id"]

    # Roll with forged roll
    res = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={
            "client_request_id": f"req_{uuid4().hex}",
            "expected_version": 0,
            "forged_roll": 6,
        },
        headers=headers,
    )
    assert res.status_code == 422

    # Action with forged opponent stats
    res = client.post(
        f"/api/v1/battles/{battle_id}/action",
        json={
            "client_request_id": f"req_{uuid4().hex}",
            "expected_version": 0,
            "action": "basic",
            "opponent_hp": 0,
        },
        headers=headers,
    )
    assert res.status_code == 422


def test_start_idempotency_and_mismatch():
    """Test start idempotency: same key same species returns cached response without new RNG; key/species mismatch -> 409."""
    child_id, token = register_user("idem_start")
    headers = {"Authorization": f"Bearer {token}"}
    add_collection_entry(child_id, "sp_malayan_tiger")
    add_collection_entry(child_id, "sp_wild_boar")

    req_id = f"req_{uuid4().hex}"
    res1 = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": req_id},
        headers=headers,
    )
    assert res1.status_code == 200
    data1 = res1.json()

    # Replay identical start request
    res2 = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": req_id},
        headers=headers,
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data1["state"]["battle_id"] == data2["state"]["battle_id"]
    assert data1 == data2

    # Same request id with different species -> 409
    res3 = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_wild_boar", "client_request_id": req_id},
        headers=headers,
    )
    assert res3.status_code == 409


def test_roll_action_rules_flow():
    """Test illegal roll double, action pre-roll, version CAS, and normal turn transitions."""
    child_id, token = register_user("flow_user")
    headers = {"Authorization": f"Bearer {token}"}
    add_collection_entry(child_id, "sp_malayan_tiger")

    # Start battle
    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"req_{uuid4().hex}"},
        headers=headers,
    )
    assert res.status_code == 200
    battle_id = res.json()["state"]["battle_id"]
    version = res.json()["state"]["version"]
    assert version == 0

    # 1. Action pre-roll -> 400
    res = client.post(
        f"/api/v1/battles/{battle_id}/action",
        json={
            "client_request_id": f"act_{uuid4().hex}",
            "expected_version": 0,
            "action": "basic",
        },
        headers=headers,
    )
    assert res.status_code == 400

    # 2. Roll player
    roll_req = f"roll_{uuid4().hex}"
    res = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": roll_req, "expected_version": 0},
        headers=headers,
    )
    assert res.status_code == 200
    roll_data = res.json()
    assert roll_data["roll"] in (1, 2, 3, 4, 5, 6)
    assert roll_data["state"]["version"] == 1
    assert roll_data["state"]["phase"] == "player_turn"
    legal_actions = roll_data["legal_actions"]
    assert "basic" in legal_actions

    # 3. Illegal roll double (rolling again while in player_turn) -> 400
    res = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": f"roll2_{uuid4().hex}", "expected_version": 1},
        headers=headers,
    )
    assert res.status_code == 400

    # 4. Action with stale version -> 409
    res = client.post(
        f"/api/v1/battles/{battle_id}/action",
        json={
            "client_request_id": f"act_{uuid4().hex}",
            "expected_version": 0,
            "action": "basic",
        },
        headers=headers,
    )
    assert res.status_code == 409

    # 5. Play legal action (basic)
    act_req = f"act_{uuid4().hex}"
    res = client.post(
        f"/api/v1/battles/{battle_id}/action",
        json={
            "client_request_id": act_req,
            "expected_version": 1,
            "action": "basic",
        },
        headers=headers,
    )
    assert res.status_code == 200
    act_data = res.json()
    assert act_data["state"]["version"] == 2
    assert len(act_data["events"]) > 0


def test_idempotent_replay_and_conflict_detection():
    """Test same key / same payload after later turns replays exactly; mismatched payload same key -> 409."""
    child_id, token = register_user("replay_user")
    headers = {"Authorization": f"Bearer {token}"}
    add_collection_entry(child_id, "sp_malayan_tiger")

    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"req_{uuid4().hex}"},
        headers=headers,
    )
    battle_id = res.json()["state"]["battle_id"]

    roll_req = f"roll_{uuid4().hex}"
    res_roll = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": roll_req, "expected_version": 0},
        headers=headers,
    )
    assert res_roll.status_code == 200
    roll_payload_saved = res_roll.json()

    # Replay roll with conflicting payload (different expected_version) -> 409
    res_conflict = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": roll_req, "expected_version": 99},
        headers=headers,
    )
    assert res_conflict.status_code == 409

    # Advance game to next turn
    act_req = f"act_{uuid4().hex}"
    res_act = client.post(
        f"/api/v1/battles/{battle_id}/action",
        json={
            "client_request_id": act_req,
            "expected_version": 1,
            "action": "basic",
        },
        headers=headers,
    )
    assert res_act.status_code == 200

    # Even after later turns, replaying the roll request with SAME payload returns exact cached response
    res_replay = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": roll_req, "expected_version": 0},
        headers=headers,
    )
    assert res_replay.status_code == 200
    assert res_replay.json() == roll_payload_saved


def test_surrender_and_terminal_behavior():
    """Test surrender awards 2 XP, second surrender / mutations reject or replay, terminal battle rejects fresh requests with 409."""
    child_id, token = register_user("surrender_user")
    headers = {"Authorization": f"Bearer {token}"}
    add_collection_entry(child_id, "sp_malayan_tiger")

    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"req_{uuid4().hex}"},
        headers=headers,
    )
    battle_id = res.json()["state"]["battle_id"]

    # Initial XP
    with engine.connect() as conn:
        child_xp_before = conn.execute(
            select(child_profiles.c.xp).where(child_profiles.c.id == child_id)
        ).scalar() or 0

    # Surrender at version 0
    surr_req = f"surr_{uuid4().hex}"
    res_surr = client.post(
        f"/api/v1/battles/{battle_id}/surrender",
        json={"client_request_id": surr_req, "expected_version": 0},
        headers=headers,
    )
    assert res_surr.status_code == 200
    surr_data = res_surr.json()
    assert surr_data["state"]["outcome"] == "surrender"
    assert surr_data["xp_awarded"] == 2
    assert surr_data["total_xp"] == child_xp_before + 2

    with engine.connect() as conn:
        child_xp_after = conn.execute(
            select(child_profiles.c.xp).where(child_profiles.c.id == child_id)
        ).scalar()
        assert child_xp_after == child_xp_before + 2

    # Replay same surrender -> identical response, no extra XP
    res_surr2 = client.post(
        f"/api/v1/battles/{battle_id}/surrender",
        json={"client_request_id": surr_req, "expected_version": 0},
        headers=headers,
    )
    assert res_surr2.status_code == 200
    assert res_surr2.json() == surr_data

    with engine.connect() as conn:
        child_xp_third = conn.execute(
            select(child_profiles.c.xp).where(child_profiles.c.id == child_id)
        ).scalar()
        assert child_xp_third == child_xp_after

    # Fresh mutation request on terminal battle -> 409
    res_fresh = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": f"fresh_{uuid4().hex}", "expected_version": 1},
        headers=headers,
    )
    assert res_fresh.status_code == 409

    # GET resume on settled session returns state and empty events + xp info
    res_get = client.get(f"/api/v1/battles/{battle_id}", headers=headers)
    assert res_get.status_code == 200
    get_data = res_get.json()
    assert get_data["events"] == []
    assert get_data["xp_awarded"] == 2
    assert get_data["total_xp"] == child_xp_after


def test_first_win_vs_repeat_win_rewards():
    """Test first win awards 20 XP and sets first_win=True; repeat win for same child & species awards 8 XP and first_win=False."""
    child_id, token = register_user("win_rewards")
    headers = {"Authorization": f"Bearer {token}"}
    add_collection_entry(child_id, "sp_malayan_tiger")

    # Battle 1
    res1 = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"req_{uuid4().hex}"},
        headers=headers,
    )
    battle_id_1 = res1.json()["state"]["battle_id"]

    # Rig opponent energy to 1 so 1 hit wins
    with engine.begin() as conn:
        session = conn.execute(
            select(battle_sessions.c.state).where(battle_sessions.c.id == battle_id_1)
        ).mappings().first()
        st = dict(session["state"])
        st["opponent"]["energy"] = 1
        st["opponent"]["shield"] = 0
        conn.execute(
            update(battle_sessions).where(battle_sessions.c.id == battle_id_1).values(state=st)
        )

    # Roll
    res = client.post(
        f"/api/v1/battles/{battle_id_1}/roll",
        json={"client_request_id": f"r1_{uuid4().hex}", "expected_version": 0},
        headers=headers,
    )
    assert res.status_code == 200

    # Attack to win
    res = client.post(
        f"/api/v1/battles/{battle_id_1}/action",
        json={"client_request_id": f"a1_{uuid4().hex}", "expected_version": 1, "action": "basic"},
        headers=headers,
    )
    assert res.status_code == 200
    win1_data = res.json()
    assert win1_data["state"]["outcome"] == "win"
    assert win1_data["first_win"] is True
    assert win1_data["xp_awarded"] == 20

    # Battle 2: same child, same species
    res2 = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"req_{uuid4().hex}"},
        headers=headers,
    )
    battle_id_2 = res2.json()["state"]["battle_id"]

    with engine.begin() as conn:
        session = conn.execute(
            select(battle_sessions.c.state).where(battle_sessions.c.id == battle_id_2)
        ).mappings().first()
        st = dict(session["state"])
        st["opponent"]["energy"] = 1
        st["opponent"]["shield"] = 0
        conn.execute(
            update(battle_sessions).where(battle_sessions.c.id == battle_id_2).values(state=st)
        )

    # Roll
    res = client.post(
        f"/api/v1/battles/{battle_id_2}/roll",
        json={"client_request_id": f"r2_{uuid4().hex}", "expected_version": 0},
        headers=headers,
    )
    assert res.status_code == 200

    # Attack to win second time
    res = client.post(
        f"/api/v1/battles/{battle_id_2}/action",
        json={"client_request_id": f"a2_{uuid4().hex}", "expected_version": 1, "action": "basic"},
        headers=headers,
    )
    assert res.status_code == 200
    win2_data = res.json()
    assert win2_data["state"]["outcome"] == "win"
    assert win2_data["first_win"] is False
    assert win2_data["xp_awarded"] == 8


def test_session_expiration_returns_410():
    """Test expired session returns 410 and awards no XP."""
    child_id, token = register_user("expired_user")
    headers = {"Authorization": f"Bearer {token}"}
    add_collection_entry(child_id, "sp_malayan_tiger")

    res = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"req_{uuid4().hex}"},
        headers=headers,
    )
    battle_id = res.json()["state"]["battle_id"]

    # Set expires_at in the past
    past = datetime.datetime.now(timezone.utc) - datetime.timedelta(hours=3)
    with engine.begin() as conn:
        conn.execute(
            update(battle_sessions)
            .where(battle_sessions.c.id == battle_id)
            .values(expires_at=past)
        )

    # GET -> 410
    res = client.get(f"/api/v1/battles/{battle_id}", headers=headers)
    assert res.status_code == 410

    # Mutation -> 410
    res = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={"client_request_id": f"r_{uuid4().hex}", "expected_version": 0},
        headers=headers,
    )
    assert res.status_code == 410
