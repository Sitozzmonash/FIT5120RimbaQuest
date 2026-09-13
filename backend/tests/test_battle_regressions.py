"""Regression test suite for battle rules mechanics and API session invariants."""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert, select

from app.core.database import engine
from app.core.schema import child_profiles, collection_entries
from app.main import app
from app.services import battle_rules
from app.services.battle_catalogue import RULES, get_battle_definition

client = TestClient(app)


class ScriptedRNG:
    def __init__(self, values: list[int]) -> None:
        self.values = list(values)

    def randint(self, a: int, b: int) -> int:
        return self.values.pop(0) if self.values else a


def _reg(prefix: str = "reg") -> tuple[int, str]:
    u = f"{prefix}_{uuid4().hex[:6]}"
    res = client.post("/api/v1/auth/register", json={
        "username": u, "age": 10, "email": f"{u}@rimba.test", "password": "battlePassword123!", "avatar": "hornbill",
    })
    return res.json()["child_id"], res.json()["access_token"]


def _collect(child_id: int, species_id: str) -> None:
    with engine.begin() as conn:
        conn.execute(insert(collection_entries).values(child_id=child_id, species_id=species_id, unlock_reason="discovery", observed_boolean=True))


def test_malayan_tiger_first_active_and_elephant_passive() -> None:
    tiger, elephant = get_battle_definition("sp_malayan_tiger"), get_battle_definition("sp_asian_elephant")

    # Full unlock: use the balanced runtime values from the catalogue.
    st, _ = battle_rules.new_battle(tiger, elephant, [1, 2, 3], "b_te")
    assert st["opponent"]["energy"] == elephant["hp"] and st["opponent"]["passive_triggers"] == 0

    # Turn 1: roll 4 -> active_1
    st, _ = battle_rules.roll_player(st, rng=ScriptedRNG([4]))
    st, _ = battle_rules.play_action(st, "active_1", rng=ScriptedRNG([1]))
    tiger_a1_damage = next(a for a in tiger["abilities"] if a["slot"] == 1)["effects"][0]["value"]
    tiger_passive_bonus = tiger["passive"]["effects"][0]["value"]
    assert st["opponent"]["energy"] == elephant["hp"] - tiger_a1_damage - tiger_passive_bonus + 8 and st["player"]["passive_triggers"] == 1
    # Elephant low energy (threshold 0.20 = 25.6 HP) does NOT trigger initially
    assert st["opponent"]["passive_triggers"] == 0

    # Turn 2: active_1 deals only its balanced base damage after the one-time passive.
    st, _ = battle_rules.roll_player(st, rng=ScriptedRNG([4]))
    opp_hp_before = st["opponent"]["energy"]
    st, _ = battle_rules.play_action(st, "active_1", rng=ScriptedRNG([1]))
    assert opp_hp_before - st["opponent"]["energy"] == tiger_a1_damage and st["player"]["passive_triggers"] == 1

    # Locked count mirror: passive slot 3 not unlocked -> bonus never triggers
    locked_st, _ = battle_rules.new_battle(tiger, elephant, [1, 2], "b_lck")
    assert locked_st["player"]["passive"] is None
    locked_st, _ = battle_rules.roll_player(locked_st, rng=ScriptedRNG([4]))
    locked_st, _ = battle_rules.play_action(locked_st, "active_1", rng=ScriptedRNG([1]))
    assert locked_st["opponent"]["shield"] == 0
    assert locked_st["opponent"]["energy"] == elephant["hp"] - max(0, tiger_a1_damage - 8)


def test_basic_lucky_and_nonnatural_reroll() -> None:
    tiger, elephant = get_battle_definition("sp_malayan_tiger"), get_battle_definition("sp_asian_elephant")

    # Basic attack on natural 6 adds RULES lucky_basic_bonus (3) ONLY, not species lucky bonus
    st, _ = battle_rules.new_battle(tiger, elephant, [], "b_luc")
    st, _ = battle_rules.roll_player(st, rng=ScriptedRNG([6]))
    assert st["lucky"] is True
    st, _ = battle_rules.play_action(st, "basic", rng=ScriptedRNG([1]))
    opening_shield = RULES.get("opening_shield_basic", 0)
    assert st["opponent"]["energy"] == elephant["hp"] - max(0, tiger["base_attack"] + RULES["lucky_basic_bonus"] - opening_shield)

    # Nonnatural 6 from reroll sets lucky=False
    rst, _ = battle_rules.new_battle(tiger, elephant, [1, 2], "b_rer")
    rst["player"]["reroll_ready"] = True
    rst, _ = battle_rules.roll_player(rst, rng=ScriptedRNG([2, 6]))
    assert rst["current_roll"] == 6 and rst["lucky"] is False


def test_shield_and_guard_resolution() -> None:
    tiger, elephant = get_battle_definition("sp_malayan_tiger"), get_battle_definition("sp_asian_elephant")
    st, _ = battle_rules.new_battle(tiger, elephant, [1, 2], "b_sg")

    # Shield cap is 25
    battle_rules._apply_shield(st, [], "player", 30)
    assert st["player"]["shield"] == RULES["shield_cap"]

    # Guard reduces first, consumed even when shield absorbs all remainder
    st["opponent"]["shield"] = 10
    battle_rules._apply_guard(st, [], "opponent", 50)
    st["player"]["base_attack"] = 20
    st, _ = battle_rules.roll_player(st, rng=ScriptedRNG([1]))
    opp_hp_before = st["opponent"]["energy"]
    st, _ = battle_rules.play_action(st, "basic", rng=ScriptedRNG([1]))
    assert st["opponent"]["shield"] == 0 and st["opponent"]["energy"] == opp_hp_before
    assert not any(s.get("type") == "guard" for s in st["opponent"]["statuses"])


def test_same_id_two_surrender_concurrently_only_two_xp() -> None:
    child_id, token = _reg("c_sur")
    h = {"Authorization": f"Bearer {token}"}
    _collect(child_id, "sp_malayan_tiger")

    start_res = client.post(f"/api/v1/children/{child_id}/battles", json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"s_{uuid4().hex[:6]}"}, headers=h)
    battle_id = start_res.json()["state"]["battle_id"]

    payload = {"client_request_id": f"r_{uuid4().hex[:6]}", "expected_version": 0}
    with ThreadPoolExecutor(max_workers=2) as ex:
        f1 = ex.submit(client.post, f"/api/v1/battles/{battle_id}/surrender", json=payload, headers=h)
        f2 = ex.submit(client.post, f"/api/v1/battles/{battle_id}/surrender", json=payload, headers=h)
        r1, r2 = f1.result(), f2.result()

    assert r1.status_code == 200 and r2.status_code == 200 and r1.json() == r2.json()
    with engine.connect() as conn:
        total_xp = conn.execute(select(child_profiles.c.xp).where(child_profiles.c.id == child_id)).scalar()
    assert total_xp == 2


def test_session_api_regressions(monkeypatch: pytest.MonkeyPatch) -> None:
    c1, t1 = _reg("c1")
    c2, t2 = _reg("c2")
    h1, h2 = {"Authorization": f"Bearer {t1}"}, {"Authorization": f"Bearer {t2}"}
    _collect(c1, "sp_malayan_tiger")

    # wrongchild start 403 & blank request id 422
    assert client.post(f"/api/v1/children/{c2}/battles", json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"r_{uuid4().hex[:6]}"}, headers=h1).status_code == 403
    assert client.post(f"/api/v1/children/{c1}/battles", json={"player_species_id": "sp_malayan_tiger", "client_request_id": "   "}, headers=h1).status_code == 422

    # Valid start
    res_start = client.post(f"/api/v1/children/{c1}/battles", json={"player_species_id": "sp_malayan_tiger", "client_request_id": f"r_{uuid4().hex[:6]}"}, headers=h1)
    assert res_start.status_code == 200
    battle_id = res_start.json()["state"]["battle_id"]

    # Testserver GET state round-trip & XP auth owner
    res_get = client.get(f"/api/v1/battles/{battle_id}", headers=h1)
    assert res_get.status_code == 200 and res_get.json()["state"]["battle_id"] == battle_id
    assert client.get(f"/api/v1/battles/{battle_id}", headers=h2).status_code == 403
    assert client.get(f"/api/v1/battles/{battle_id}").status_code == 401

    # Forged roll 422 & Stale version 409
    assert client.post(f"/api/v1/battles/{battle_id}/roll", json={"client_request_id": f"r_{uuid4().hex[:6]}", "expected_version": 0, "roll": 6}, headers=h1).status_code == 422
    assert client.post(f"/api/v1/battles/{battle_id}/roll", json={"client_request_id": f"r_{uuid4().hex[:6]}", "expected_version": 99}, headers=h1).status_code == 409

    # Force roll 1 -> verify action 1..3 invalid active_1 400
    from app.routers import battle_sessions as bs_mod
    orig_roll = bs_mod.battle_rules.roll_player
    monkeypatch.setattr(bs_mod.battle_rules, "roll_player", lambda st, rng: orig_roll(st, rng=ScriptedRNG([1])))

    res_roll = client.post(f"/api/v1/battles/{battle_id}/roll", json={"client_request_id": f"r_{uuid4().hex[:6]}", "expected_version": 0}, headers=h1)
    assert res_roll.status_code == 200 and res_roll.json()["roll"] == 1 and res_roll.json()["legal_actions"] == ["basic", "brace"]

    res_act = client.post(f"/api/v1/battles/{battle_id}/action", json={"client_request_id": f"r_{uuid4().hex[:6]}", "expected_version": 1, "action": "active_1"}, headers=h1)
    assert res_act.status_code == 400
