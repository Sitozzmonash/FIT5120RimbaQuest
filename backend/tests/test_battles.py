from __future__ import annotations

from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def register_test_user(suffix: str = "battle_user"):
    u = f"{suffix}_{uuid4().hex[:8]}"
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



def test_get_battle_opponent():
    child_id, token = register_test_user("opp_user")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(
        f"/api/v1/children/{child_id}/battle/opponent?player_species_id=sp_malayan_tiger",
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "opponent" in data
    opp = data["opponent"]
    assert "species_id" in opp
    assert "name" in opp
    assert opp["hp"] > 0
    assert opp["base_attack"] > 0
    assert isinstance(opp["abilities"], list)


def test_get_child_species_battle_card():
    child_id, token = register_test_user("card_user")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(
        f"/api/v1/children/{child_id}/species/sp_malayan_tiger/battle-card",
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    card = data["card"]
    assert "hp" in card
    assert "base_attack" in card
    assert "unlocked_abilities" in card
    assert isinstance(card["unlocked_abilities"], list)
    assert "abilities_locked" in card


def test_bot_turn_endpoint():
    payload = {
        "bot_data": {
            "name": "Wild Boar",
            "category": "Mammal",
            "base_attack": 22,
            "max_hp": 115,
        },
        "bot_current_hp": 115,
        "player_current_hp": 100,
        "round_num": 1,
    }
    res = client.post("/api/v1/battle/bot-turn", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    action = data["action"]
    assert "action_name" in action
    assert "damage" in action
    assert "healing" in action
    assert "log" in action
