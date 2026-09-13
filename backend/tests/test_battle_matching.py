"""Tests for battle matchmaking, difficulty tiers, and session integration."""
from __future__ import annotations

import random
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from app.core.database import engine, initialise_database
from app.core.schema import collection_entries
from app.main import app
from app.services.battle_catalogue import get_battle_definition, get_catalogue
from app.services.battle_matching import (
    choose_opponent,
    compute_effective_rating,
)

client = TestClient(app)

PILOT_SPECIES_IDS = {
    "sp_asian_elephant", "sp_malayan_tiger", "sp_oriental_pied_hornbill",
    "sp_reticulated_python", "sp_asian_small_clawed_otter", "sp_common_mormon", "sp_wild_boar",
}


@pytest.fixture(scope="module", autouse=True)
def init_db():
    initialise_database()


def register_user(suffix: str = "match_user") -> tuple[int, str]:
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
    from sqlalchemy import insert
    with engine.begin() as conn:
        conn.execute(
            insert(collection_entries).values(
                child_id=child_id,
                species_id=species_id,
                unlock_reason="discovery",
                observed_boolean=True,
            )
        )


def test_compute_effective_rating_deterministic_and_bounded():
    catalogue = get_catalogue()
    for sid, entry in catalogue.items():
        rating_no_slots = compute_effective_rating(entry, [])
        rating_standard = compute_effective_rating(entry, [1, 2])
        rating_full = compute_effective_rating(entry, [1, 2, 3])
        assert rating_no_slots <= rating_standard <= rating_full + 10.0
        assert 120.0 <= rating_standard <= 250.0


def test_choose_opponent_slots_standard_vs_practice():
    catalogue = get_catalogue()
    active_ids = set(catalogue.keys())
    player = get_battle_definition("sp_malayan_tiger")

    # Standard mode mirrors the player's current quiz tier
    opp_std, slots_std, info_std = choose_opponent(
        catalogue, active_ids, player, player_slots=[1], difficulty="standard"
    )
    assert slots_std == [1]
    assert info_std["difficulty"] == "standard"
    assert info_std["opponent_slots"] == [1]

    # Practice mode always gives opponent slots []
    opp_prac, slots_prac, info_prac = choose_opponent(
        catalogue, active_ids, player, player_slots=[1, 2, 3], difficulty="practice"
    )
    assert slots_prac == []
    assert info_prac["difficulty"] == "practice"
    assert info_prac["opponent_slots"] == []


def test_choose_opponent_does_not_mirror_player_unlocks():
    catalogue = get_catalogue()
    active_ids = set(catalogue.keys())
    player = get_battle_definition("sp_asian_elephant")

    # Beginner player with slot 1 only in standard
    opp, slots, _ = choose_opponent(catalogue, active_ids, player, player_slots=[1], difficulty="standard")
    assert slots == [1]

    # Maxed player with slots 1, 2, 3 in practice
    opp_p, slots_p, _ = choose_opponent(catalogue, active_ids, player, player_slots=[1, 2, 3], difficulty="practice")
    assert slots_p == []
    assert slots_p != [1, 2, 3]


def test_choose_opponent_uses_full_catalogue_not_just_pilots():
    catalogue = get_catalogue()
    active_ids = set(catalogue.keys())
    player = get_battle_definition("sp_malayan_tiger")

    # Sample multiple random choices to ensure non-pilot species are selected
    chosen_species = set()
    for seed in range(50):
        rng = random.Random(seed)
        opp, _, _ = choose_opponent(catalogue, active_ids, player, [1, 2], difficulty="standard", rng=rng)
        chosen_species.add(opp["species_id"])

    non_pilot_chosen = chosen_species - PILOT_SPECIES_IDS
    assert len(non_pilot_chosen) > 0, "Matchmaking must not be restricted to pilot species"
    assert player["species_id"] not in chosen_species, "Player species must never be selected as opponent"


def test_choose_opponent_avoids_same_role_where_alternatives_exist():
    catalogue = get_catalogue()
    active_ids = set(catalogue.keys())
    player = get_battle_definition("sp_malayan_tiger")  # Role is Precision or Power

    opp, _, _ = choose_opponent(catalogue, active_ids, player, [1, 2], difficulty="standard")
    assert opp["role"] != player["role"], "Should prefer a different role when available"


def test_choose_opponent_rng_protocols():
    catalogue = get_catalogue()
    active_ids = set(catalogue.keys())
    player = get_battle_definition("sp_common_mormon")

    # Choice protocol
    class ChoiceRNG:
        def choice(self, seq):
            return seq[-1]

    opp1, _, _ = choose_opponent(catalogue, active_ids, player, [1, 2], rng=ChoiceRNG())
    assert opp1 is not None

    # Randint protocol
    class RandintRNG:
        def randint(self, a, b):
            return 0

    opp2, _, _ = choose_opponent(catalogue, active_ids, player, [1, 2], rng=RandintRNG())
    assert opp2 is not None

    # Deterministic fallback (no rng)
    opp3, _, _ = choose_opponent(catalogue, active_ids, player, [1, 2], rng=None)
    assert opp3 is not None


def test_start_battle_metadata_and_difficulty():
    child_id, token = register_user("start_meta")
    add_collection_entry(child_id, "sp_malayan_tiger")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Standard battle start
    res_std = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={
            "player_species_id": "sp_malayan_tiger",
            "client_request_id": f"r_std_{uuid4().hex[:8]}",
            "difficulty": "standard",
        },
        headers=headers,
    )
    assert res_std.status_code == 200
    data_std = res_std.json()
    st_std = data_std["state"]

    assert st_std["initiative"] in ("player", "opponent")
    assert st_std["difficulty"] == "standard"
    assert st_std["rules_version"] == "2.0"
    assert "power_ratio" in st_std
    assert st_std["opponent"]["unlocked_abilities"] == []

    # 2. Practice battle start
    res_prac = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={
            "player_species_id": "sp_malayan_tiger",
            "client_request_id": f"r_prac_{uuid4().hex[:8]}",
            "difficulty": "practice",
        },
        headers=headers,
    )
    assert res_prac.status_code == 200
    data_prac = res_prac.json()
    st_prac = data_prac["state"]

    assert st_prac["difficulty"] == "practice"
    assert st_prac["opponent"]["unlocked_abilities"] == []


def test_roll_includes_action_previews():
    child_id, token = register_user("roll_preview")
    add_collection_entry(child_id, "sp_malayan_tiger")
    headers = {"Authorization": f"Bearer {token}"}

    # Start battle
    res_start = client.post(
        f"/api/v1/children/{child_id}/battles",
        json={
            "player_species_id": "sp_malayan_tiger",
            "client_request_id": f"r_prev_{uuid4().hex[:8]}",
            "difficulty": "standard",
        },
        headers=headers,
    )
    assert res_start.status_code == 200
    battle_id = res_start.json()["state"]["battle_id"]

    # Roll dice
    res_roll = client.post(
        f"/api/v1/battles/{battle_id}/roll",
        json={
            "client_request_id": f"r_roll_{uuid4().hex[:8]}",
            "expected_version": 0,
        },
        headers=headers,
    )
    assert res_roll.status_code == 200
    roll_data = res_roll.json()

    assert "action_previews" in roll_data
    previews = roll_data["action_previews"]
    assert len(previews) > 0
    assert len(previews) <= 4

    for p in previews:
        assert p["action"] in ("basic", "brace", "active_1", "active_2")
        assert isinstance(p["name"], str) and p["name"].strip()
        assert isinstance(p["damage"], (int, float))
        assert isinstance(p["shield_gain"], (int, float))
        assert isinstance(p["summary"], str)
