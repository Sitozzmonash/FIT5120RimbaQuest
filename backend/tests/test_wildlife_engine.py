"""New HP/Energy battle mode, isolated from the legacy dice rules."""

from __future__ import annotations

import copy
import random

import pytest

from app.services.battle_catalogue import get_battle_definition, get_catalogue
from app.services.wildlife_ai import _load_policy, _score_action
from app.services.wildlife_battle import (
    HABITATS, HABITAT_BONUSES, ability_previews, choose_ai_action,
    choose_habitat, forfeit, habitat_matches, legal_actions, new_match,
    perform_action, skip_turn, species_habitat_group, species_habitat_groups,
)


def definition(species_id: str, *, hp: int = 50, attack: int = 10,
               first_effects: list[dict] | None = None,
               passive: dict | None = None) -> dict:
    return {
        "species_id": species_id,
        "name": species_id,
        "category": "Mammal",
        "role": "Balanced",
        "hp": hp,
        "base_attack": attack,
        "abilities": [
            {"slot": 1, "name": "First", "effects": first_effects or [
                {"type": "damage", "value": 12, "target": "opponent"}]},
            {"slot": 2, "name": "Second", "effects": [
                {"type": "damage", "value": 14, "target": "opponent"}]},
        ],
        "passive": passive or {
            "name": "Wild Guard", "effects": [
                {"type": "reroll", "value": 1, "target": "self"}],
        },
    }


def match(*, player: dict | None = None, opponent: dict | None = None,
          habitat: str = "Rainforest & Forest",
          player_habitat: str = "Rainforest & Forest", opponent_habitat: str = "Coastal & Marine",
          player_unlocked: list[int] | None = None,
          opponent_unlocked: list[int] | None = None,
          initiative: str = "player") -> dict:
    return new_match(
        player or definition("player"), opponent or definition("opponent"),
        habitat=habitat, player_habitat=player_habitat,
        opponent_habitat=opponent_habitat,
        player_unlocked=[1, 2, 3] if player_unlocked is None else player_unlocked,
        opponent_unlocked=[1, 2, 3] if opponent_unlocked is None else opponent_unlocked,
        mode="bot", initiative=initiative,
    )


def clear_shields(state: dict) -> dict:
    state["player"]["shield"] = 0
    state["opponent"]["shield"] = 0
    return state


def test_habitat_is_known_before_selection_and_matching_uses_csv_group():
    assert HABITATS == (
        "Rainforest & Forest", "Rivers, Wetlands & Mangroves",
        "Grassland, Scrub & Farmland", "Gardens, Parks & Urban",
        "Highland & Montane Forest", "Coastal & Marine",
    )
    assert set(HABITAT_BONUSES) == set(HABITATS)
    assert len(species_habitat_groups()) == 152
    assert set(species_habitat_groups().values()) == set(HABITATS)
    assert species_habitat_group("sp_malayan_tiger") == "Rainforest & Forest"
    assert species_habitat_group("sp_green_sea_turtle") == "Coastal & Marine"
    assert habitat_matches("Rainforest & Forest", "Rainforest & Forest")
    assert not habitat_matches("Rivers, Wetlands & Mangroves", "Rainforest & Forest")
    assert not habitat_matches(None, "Rainforest & Forest")
    assert not habitat_matches("Rainforest & Forest", "Coastal & Marine")
    state = match()
    assert state["habitat"] == "Rainforest & Forest"
    assert state["player"]["habitat_advantage"]
    assert state["player"]["habitat_bonus"] == HABITAT_BONUSES["Rainforest & Forest"]
    assert not state["opponent"]["habitat_advantage"]
    assert state["opponent"]["habitat_bonus"] is None


def test_second_mover_gets_tiered_opening_shield():
    assert match(player_unlocked=[], opponent_unlocked=[], initiative="player")["opponent"]["shield"] == 3
    assert match(player_unlocked=[1], opponent_unlocked=[1], initiative="player")["opponent"]["shield"] == 7
    assert match(player_unlocked=[1, 2], opponent_unlocked=[1, 2], initiative="player")["opponent"]["shield"] == 8
    assert match(player_unlocked=[1, 2, 3], opponent_unlocked=[1, 2, 3], initiative="player")["opponent"]["shield"] == 10
    assert match(player_unlocked=[1, 2, 3], opponent_unlocked=[1, 2], initiative="opponent")["player"]["shield"] == 10


def test_habitat_attack_and_defence_apply_whole_match():
    state = clear_shields(match(player=definition("player", attack=13),
                                opponent_habitat="Rainforest & Forest"))
    original = copy.deepcopy(state)
    state, events = perform_action(state, "player", "basic")
    # Half-up rounding: 13 * 1.2 = 15.6 -> 16, then 16 * .8 = 12.8 -> 13.
    assert state["opponent"]["hp"] == 37
    assert next(e for e in events if e["type"] == "damage")["value"] == 13
    assert original["opponent"]["hp"] == 50
    state, _ = perform_action(state, "opponent", "basic")
    # Both match here: 10 * 1.2 = 12, then 12 * .8 = 9.6 -> 10.
    assert state["player"]["hp"] == 40
    state, _ = perform_action(state, "player", "basic")
    assert state["opponent"]["hp"] == 24


@pytest.mark.parametrize("attack", [11, 12, 13])
def test_habitat_bonus_rounds_half_up_for_catalogue_attacks(attack):
    # Plain floor() turned the 20% bonus into about 15% for catalogue attacks
    # of 11-13 while making the 20% defence cut closer to 25%.
    bonus = clear_shields(match(player=definition("player", attack=attack), opponent_habitat="Coastal & Marine"))
    damage = next(e for e in perform_action(bonus, "player", "basic")[1] if e["type"] == "damage")
    assert damage["value"] == round(attack * 1.2)
    defence = clear_shields(match(player=definition("player", attack=attack), player_habitat="Coastal & Marine",
                                  opponent_habitat="Rainforest & Forest"))
    damage = next(e for e in perform_action(defence, "player", "basic")[1] if e["type"] == "damage")
    assert damage["value"] == round(attack * 0.8)


def test_each_habitat_uses_its_own_attack_and_defence_bonus():
    grass = clear_shields(match(
        habitat="Grassland, Scrub & Farmland",
        player=definition("player", attack=10),
        player_habitat="Grassland, Scrub & Farmland",
        opponent_habitat="Rainforest & Forest",
    ))
    damage = next(e for e in perform_action(grass, "player", "basic")[1] if e["type"] == "damage")
    assert grass["player"]["habitat_bonus"]["attack_percent"] == 25
    assert damage["value"] == 13  # 10 * 1.25 rounds half-up.

    montane = clear_shields(match(
        habitat="Highland & Montane Forest",
        player=definition("player", attack=12),
        player_habitat="Rainforest & Forest",
        opponent_habitat="Highland & Montane Forest",
    ))
    damage = next(e for e in perform_action(montane, "player", "basic")[1] if e["type"] == "damage")
    assert montane["opponent"]["habitat_bonus"]["defence_percent"] == 25
    assert damage["value"] == 9  # 12 * 0.75.


def test_habitat_draw_prefers_habitats_that_split_the_ready_cards():
    forest, turtle = "Rainforest & Forest", "Coastal & Marine"
    rng = random.Random(4)
    # With a forest card and a coastal card, only their two groups make
    # one card match and the other not.
    draws = {choose_habitat([forest, turtle], rng) for _ in range(60)}
    assert draws == {"Rainforest & Forest", "Coastal & Marine"}
    # A single card or an all-forest collection has no split, so any habitat
    # remains possible.
    assert {choose_habitat([forest], rng) for _ in range(200)} == set(HABITATS)
    assert {choose_habitat([forest, forest], rng) for _ in range(200)} == set(HABITATS)
    assert {choose_habitat([], rng) for _ in range(200)} == set(HABITATS)


def test_ability_previews_match_the_battle_and_drop_legacy_dice_text():
    for species in get_catalogue().values():
        previews = ability_previews(species)
        state = new_match(
            species, species, habitat="Rainforest & Forest", player_habitat=None,
            opponent_habitat=None, player_unlocked=[], opponent_unlocked=[],
            mode="bot", initiative="player",
        )
        assert previews == [
            {key: ability[key] for key in ("slot", "name", "description", "cost", "effects")}
            for ability in state["player"]["abilities"]
        ]
        assert [preview["cost"] for preview in previews] == [1, 2, 4]
        assert not any(
            "die" in f"{p['name']} {p['description']}".casefold()
            or "roll" in f"{p['name']} {p['description']}".casefold()
            for p in previews
        )


def test_cost_unlock_recharge_and_one_action_per_turn():
    state = match(player_unlocked=[1, 3])
    assert legal_actions(state, "player") == ["basic", "ability_1", "ability_3"]
    assert legal_actions(state, "opponent") == []
    assert [a["cost"] for a in state["player"]["abilities"]] == [1, 2, 4]
    with pytest.raises(ValueError):
        perform_action(state, "player", "ability_2")
    after, _ = perform_action(state, "player", "ability_3")
    assert after["player"]["energy"] == 3  # 5 - 4 + 2
    assert "ability_3" not in legal_actions(after | {"turn": "player"}, "player")
    with pytest.raises(ValueError):
        perform_action(after, "player", "basic")
    after, _ = perform_action(after, "opponent", "basic")
    after, _ = perform_action(after, "player", "basic")
    assert after["player"]["energy"] == 5
    assert after["turn_count"] == 3


def test_hp_healing_is_separate_from_turn_energy_recharge():
    player = definition("player", first_effects=[
        {"type": "damage", "value": 12, "target": "opponent"},
        {"type": "heal", "value": 5, "target": "self"},
    ])
    state = clear_shields(match(player=player, initiative="opponent"))
    assert state["player"]["abilities"][0]["description"] == "Deal 12 damage; Restore 5 HP."
    state, _ = perform_action(state, "opponent", "basic")
    assert state["player"]["hp"] == 42
    state, events = perform_action(state, "player", "ability_1")
    assert state["player"]["hp"] == 47
    assert state["player"]["energy"] == 6
    assert any(e["type"] == "heal" and e["value"] == 5 for e in events)


def test_slot_three_adapts_dice_and_original_passive_effects():
    catalogue = get_catalogue()
    for species in catalogue.values():
        state = new_match(
            species, species, habitat="Rainforest & Forest", player_habitat="Rainforest & Forest",
            opponent_habitat="Rainforest & Forest", player_unlocked=[1, 2, 3],
            opponent_unlocked=[1, 2, 3], mode="bot", initiative="player",
        )
        third = state["player"]["abilities"][2]
        assert third["name"] == species["passive"]["name"]
        assert third["kind"] == "active" and third["cost"] == 4
        assert third["effects"][0]["type"] == "damage"
        assert third["effects"][0]["value"] >= max(
            ability["effects"][0]["value"] for ability in state["player"]["abilities"][:2]
        )
        assert all(e["type"] != "reroll" for a in state["player"]["abilities"] for e in a["effects"])
        for action in ("ability_1", "ability_2", "ability_3"):
            result, events = perform_action(state, "player", action)
            assert events and result["turn_count"] == 1
            assert 0 <= result["player"]["energy"] <= 8
            assert 0 <= result["opponent"]["hp"] <= result["opponent"]["max_hp"]
    state = match()
    assert state["player"]["abilities"][2]["effects"][1] == {
        "type": "guard", "value": 40, "target": "self",
    }
    hornbill = get_battle_definition("sp_oriental_pied_hornbill")
    state = match(player=hornbill)
    assert state["player"]["shield"] == 0  # former passive is not automatic
    assert state["player"]["abilities"][2]["effects"][1]["type"] == "shield"
    elephant = get_battle_definition("sp_asian_elephant")
    state = match(player=elephant)
    assert state["player"]["abilities"][2]["effects"][1]["type"] == "heal_hp"


def test_turn_order_hp_zero_wins_and_timeout_has_no_recharge():
    state = match(player=definition("player", hp=20, attack=20),
                  opponent=definition("opponent", hp=20, attack=10),
                  initiative="opponent")
    before = copy.deepcopy(state)
    state, events = skip_turn(state, "opponent")
    assert state["turn"] == "player" and state["turn_count"] == 1
    assert state["opponent"]["energy"] == 5
    assert "No Energy was recharged" in events[0]["message"]
    assert before["turn"] == "opponent"
    state, _ = perform_action(state, "player", "basic")
    assert state["opponent"]["hp"] == 0
    assert state["status"] == "completed" and state["winner"] == "player"
    assert state["turn"] is None
    assert legal_actions(state, "opponent") == []


def test_forfeit_finishes_without_turn_or_energy_gain():
    state = match()
    result, events = forfeit(state, "opponent")
    assert result["status"] == "completed" and result["winner"] == "player"
    assert result["player"]["energy"] == state["player"]["energy"]
    assert result["turn_count"] == state["turn_count"]
    assert events[0]["type"] == "forfeit"


def test_one_hit_defences_and_hp_healing_are_bounded():
    striker = definition("striker", attack=10, passive={
        "name": "Silent Stalker", "effects": [{"type": "damage", "value": 4, "target": "opponent"}],
    })
    state = match(player=striker, player_habitat="Coastal & Marine", opponent_habitat="Rainforest & Forest")
    state["opponent"]["guard"] = 25
    state["opponent"]["block"] = 2
    state["opponent"]["shield"] = 3
    result, events = perform_action(state, "player", "ability_3")
    # 10+10+4 is one attack; block 2, guard 25% (22 -> 16), habitat defence
    # 20% (13), then Shield 3. The guard and block are consumed once.
    damage = next(e for e in events if e["type"] == "damage")
    assert damage["value"] == 10
    assert result["opponent"]["guard"] == 0
    assert result["opponent"]["block"] == 0
    assert result["opponent"]["shield"] == 0
    assert state["opponent"]["guard"] == 25


def test_ai_uses_only_legal_actions_and_same_rules():
    specimen = get_battle_definition("sp_malayan_tiger")
    state = new_match(
        specimen, specimen, habitat="Rainforest & Forest", player_habitat="Rainforest & Forest",
        opponent_habitat="Rainforest & Forest", player_unlocked=[1, 2, 3],
        opponent_unlocked=[1, 2, 3], mode="bot", initiative="opponent",
    )
    assert state["player"]["hp"] == state["opponent"]["hp"]
    assert state["player"]["energy"] == state["opponent"]["energy"]
    assert state["player"]["abilities"] == state["opponent"]["abilities"]
    before = copy.deepcopy(state)
    action = choose_ai_action(state, rng=random.Random(17))
    assert action in legal_actions(state, "opponent")
    assert state == before
    result, _ = perform_action(state, "opponent", action)
    assert result["opponent"]["energy"] <= 8
    locked = match(initiative="opponent", opponent_unlocked=[])
    assert choose_ai_action(locked, rng=random.Random(17)) == "basic"


def test_ai_finishes_when_possible_and_loads_trained_policy():
    state = match(opponent=definition("opponent", attack=20),
                  initiative="opponent", opponent_unlocked=[1, 2, 3])
    state["player"]["hp"] = 10
    assert choose_ai_action(state, rng=random.Random(2)) in {"basic", "ability_1", "ability_2", "ability_3"}
    policy = _load_policy()
    assert policy
    # The learned value contributes to tactical scoring without changing state.
    action = "basic"
    base = _score_action(state, "opponent", action, {})
    from app.services.wildlife_ai import state_action_key
    key = state_action_key(state, "opponent", action)
    adjusted = _score_action(state, "opponent", action, {key: 1.0})
    assert adjusted == base + 2
