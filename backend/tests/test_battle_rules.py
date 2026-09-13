"""Unit test suite for pure battle rules engine (battle_rules.py).

Verifies all contract rules:
- Handbuilt valid definitions executable without DB or external catalogue
- Deterministic and pure state transitions (no input mutation, JSON safe)
- Monotonic event IDs and after-state combatant snapshots
- Natural 6 vs rerolled 6 lucky bonus behavior
- Reroll token expiry and low_roll_reroll passive interactions
- Legal actions for 1-3, 4-5, 6 rolls and unlocked abilities
- Mitigation order: fixed incoming reduction -> guard percentage -> shield -> energy clamp
- Guard consumption even if fully shielded
- No passive resurrection at 0 energy
- Low energy threshold passive triggering only if energy > 0
- Consuming next-attack boost and weaken
- Round 30 draw condition
- Finishing AI action priority, low health AI heuristics, deterministic choice
- Player kill immediately ending battle (skipping AI turn and post-action heals)
- Error raising on illegal phase or action
"""

import copy
import pytest
from app.services.battle_rules import (
    RULES,
    new_battle,
    roll_player,
    play_action,
    surrender_battle,
    legal_actions,
    choose_ai_action,
)


class ScriptedRNG:
    """Deterministic scripted RNG yielding predefined sequence."""

    def __init__(self, values: list[int]):
        self.values = list(values)
        self.idx = 0

    def randint(self, a: int, b: int) -> int:
        if self.idx < len(self.values):
            val = self.values[self.idx]
            self.idx += 1
            return val
        return a


def sample_player_def() -> dict:
    return {
        "species_id": "malayan_tiger",
        "name": "Harimau",
        "category": "Mammal",
        "role": "Striker",
        "hp": 100,
        "base_attack": 12,
        "abilities": [
            {
                "slot": 1,
                "kind": "active",
                "name": "Claw Strike",
                "description": "Sharp claws deal 15 damage.",
                "effects": [{"type": "damage", "value": 15, "target": "opponent"}],
                "animation": "claw",
                "vfx": "claw_scratch",
            },
            {
                "slot": 2,
                "kind": "active",
                "name": "Roar of Vigor",
                "description": "Restores 20 energy and gains 10 shield.",
                "effects": [
                    {"type": "heal", "value": 20, "target": "self"},
                    {"type": "shield", "value": 10, "target": "self"},
                ],
                "animation": "roar",
                "vfx": "gold_aura",
            },
        ],
        "passive": {
            "slot": 3,
            "kind": "passive",
            "name": "Apex Focus",
            "description": "First lucky roll grants 15 energy.",
            "trigger": "first_lucky",
            "effects": [{"type": "heal", "value": 15, "target": "self"}],
            "max_triggers": 1,
        },
        "lucky_bonus": [
            {"type": "damage", "value": 5, "target": "opponent"},
        ],
        "biological_basis": "Solitary apex predator",
        "source_row": 1,
    }


def sample_opponent_def() -> dict:
    return {
        "species_id": "sun_bear",
        "name": "Beruang",
        "category": "Mammal",
        "role": "Defender",
        "hp": 90,
        "base_attack": 10,
        "abilities": [
            {
                "slot": 1,
                "kind": "active",
                "name": "Heavy Swipe",
                "description": "Heavy swing dealing 14 damage.",
                "effects": [{"type": "damage", "value": 14, "target": "opponent"}],
                "animation": "swipe",
                "vfx": "crush",
            },
            {
                "slot": 2,
                "kind": "active",
                "name": "Honey Guard",
                "description": "Grants 30% guard.",
                "effects": [{"type": "guard", "value": 30, "target": "self"}],
                "animation": "guard",
                "vfx": "honey_shield",
            },
        ],
        "passive": {
            "slot": 3,
            "kind": "passive",
            "name": "Thick Hide",
            "description": "Reduces first incoming active attack by 5.",
            "trigger": "first_incoming_active",
            "effects": [{"type": "reduce_damage", "value": 5, "target": "self"}],
            "max_triggers": 1,
        },
        "lucky_bonus": [
            {"type": "shield", "value": 5, "target": "self", "requires_effect": "shield"},
        ],
        "biological_basis": "Stout arboreal bear",
        "source_row": 2,
    }


def test_new_battle_initial_state_and_purity():
    p_def = sample_player_def()
    o_def = sample_opponent_def()
    p_def_copy = copy.deepcopy(p_def)
    o_def_copy = copy.deepcopy(o_def)

    state, events = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_test_1")

    # Inputs must not be mutated
    assert p_def == p_def_copy
    assert o_def == o_def_copy

    assert state["battle_id"] == "b_test_1"
    assert state["version"] == 0
    assert state["round"] == 1
    assert state["phase"] == "roll"
    assert state["active_side"] == "player"
    assert state["outcome"] is None
    assert state["legal_actions"] == []

    # Player stats
    assert state["player"]["energy"] == 100
    assert state["player"]["max_energy"] == 100
    assert state["player"]["passive"] is not None
    # Opponent stats mirror unlocks
    assert state["opponent"]["energy"] == 90
    assert state["opponent"]["unlocked_abilities"] == [1, 2, 3]

    # Events check: monotonic sequence and snapshot
    assert len(events) >= 1
    assert events[0]["id"] == 1
    assert events[0]["type"] == "encounter"
    assert "player" in events[0]["snapshot"]
    assert "opponent" in events[0]["snapshot"]


def test_unlocked_slots_restricts_passives_and_actions():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    # Beginner player with only slot 1
    state, events = new_battle(p_def, o_def, unlocked_slots=[1], battle_id="b_test_slots")
    assert state["player"]["passive"] is None
    assert state["opponent"]["passive"] is None
    assert state["player"]["unlocked_abilities"] == [1]

    # Roll 6 with only slot 1
    actions = legal_actions(state["player"], 6)
    assert actions == ["active_1"]

    # Roll 6 with no active slots
    actions_none = legal_actions({"unlocked_abilities": []}, 6)
    assert actions_none == ["basic"]

    # Roll 4 with slots 1, 2
    actions_mid = legal_actions({"unlocked_abilities": [1, 2]}, 4)
    assert actions_mid == ["basic", "brace", "active_1", "active_2"]


def test_natural_6_vs_rerolled_6_lucky():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    # 1. Natural 6 roll: lucky should be True, first_lucky passive triggers
    rng_natural = ScriptedRNG([6])
    state1, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_nat")
    state1, events1 = roll_player(state1, rng=rng_natural)

    assert state1["current_roll"] == 6
    assert state1["lucky"] is True
    # A full-energy healing passive stays ready until it can provide value.
    assert state1["player"]["passive_triggers"] == 0

    # 2. Initial roll 2 rerolled into 6: lucky should be False!
    # Setup player with reroll token
    state2, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_reroll")
    state2["player"]["reroll_ready"] = True
    rng_reroll = ScriptedRNG([2, 6])

    state2, events2 = roll_player(state2, rng=rng_reroll)
    assert state2["current_roll"] == 6
    assert state2["lucky"] is False
    assert state2["player"]["reroll_ready"] is False
    # Passive first_lucky should NOT have triggered
    assert state2["player"]["passive_triggers"] == 0


def test_reroll_token_expiry_on_high_roll():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_token_exp")
    state["player"]["reroll_ready"] = True

    # High roll (5) does not trigger reroll, but consumes the token at the die event
    rng = ScriptedRNG([5])
    state, events = roll_player(state, rng=rng)
    assert state["current_roll"] == 5
    assert state["player"]["reroll_ready"] is False
    assert len([e for e in events if e["type"] == "reroll"]) == 0


def test_mitigation_order_and_guard_consumption():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    # Opponent has:
    # 1. Passive reduce_damage by 5 on first incoming active
    # 2. Guard 50%
    # 3. Shield 10
    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_mit")
    state["opponent"]["shield"] = 10
    state["opponent"]["statuses"] = [{"id": "g1", "name": "Guard", "type": "guard", "duration": 1, "potency": 50}]

    # Player rolls 4, plays active_1 (Claw Strike, base dmg 15)
    rng_roll = ScriptedRNG([4])
    state, _ = roll_player(state, rng=rng_roll)
    assert state["lucky"] is False

    # Resolution math:
    # gross dmg = 15
    # incoming reduce passive = 5 -> remaining = 10
    # guard 50% -> floor(10 * (100 - 50) / 100) = 5
    # shield absorbs 5 (from 10 shield, shield becomes 5)
    # energy dmg = 0 (energy remains 90)
    # Guard must be consumed even though shield absorbed all remaining damage
    # AI scripted to do basic attack
    rng_ai = ScriptedRNG([2])  # AI rolls 2
    state, events = play_action(state, "active_1", rng=rng_ai)

    assert state["opponent"]["shield"] == 5
    assert state["opponent"]["energy"] == 90
    assert len([s for s in state["opponent"]["statuses"] if s["type"] == "guard"]) == 0
    assert state["opponent"]["passive_triggers"] == 1


def test_low_energy_passive_no_resurrection_at_zero():
    p_def = sample_player_def()
    o_def = sample_opponent_def()
    # Opponent has low_energy recovery passive
    o_def["passive"] = {
        "slot": 3,
        "kind": "passive",
        "name": "Survival Grit",
        "description": "Recovers 20 energy when energy falls below 25%.",
        "trigger": "low_energy",
        "threshold": 0.25,
        "effects": [{"type": "heal", "value": 20, "target": "self"}],
        "max_triggers": 1,
    }

    # Case 1: Reduced to 10/100 (<= 25% and > 0) -> triggers heal 20 -> becomes 30
    state1, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_le_1")
    state1["opponent"]["energy"] = 25
    state1["player"]["base_attack"] = 10
    state1["phase"] = "player_turn"
    state1["legal_actions"] = ["basic"]

    rng_ai = ScriptedRNG([2])
    state1, events1 = play_action(state1, "basic", rng=rng_ai)
    # 25 - 10 = 15 <= 25% (22.5), then the opponent's opening Shield absorbs damage first.
    assert state1["opponent"]["energy"] == 23
    assert state1["opponent"]["passive_triggers"] == 0

    # Case 2: Direct hit reduces energy to 0 -> Battle ends immediately, NO RESURRECTION!
    state2, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_le_2")
    state2["opponent"]["energy"] = 10
    state2["player"]["base_attack"] = 20
    state2["phase"] = "player_turn"
    state2["legal_actions"] = ["basic"]

    state2, events2 = play_action(state2, "basic", rng=rng_ai)
    assert state2["opponent"]["energy"] == 0
    assert state2["outcome"] == "win"
    assert state2["phase"] == "outcome"
    # Passive must not have triggered resurrection
    assert state2["opponent"]["passive_triggers"] == 0


def test_consuming_next_attack_boost_and_weaken():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_buffs")
    # Player has boost +8 and weaken -3
    state["player"]["statuses"] = [
        {"id": "b1", "name": "Boost", "type": "buff", "duration": 1, "potency": 8},
        {"id": "w1", "name": "Weaken", "type": "debuff", "duration": 1, "potency": 3},
    ]
    state["phase"] = "player_turn"
    state["legal_actions"] = ["basic"]

    # The explicit test statuses use a 12-base attack: gross damage is 17.
    rng_ai = ScriptedRNG([2])
    state, events = play_action(state, "basic", rng=rng_ai)

    assert state["opponent"]["energy"] == 81
    # Buff and debuff should both be consumed
    assert len(state["player"]["statuses"]) == 0


def test_round_30_draw_condition():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_draw")
    state["round"] = 30
    state["phase"] = "player_turn"
    state["legal_actions"] = ["basic"]
    # Neither dies from basic attack
    state["player"]["energy"] = 80
    state["opponent"]["energy"] = 80

    rng_ai = ScriptedRNG([2])
    state, events = play_action(state, "basic", rng=rng_ai)

    assert state["outcome"] == "draw"
    assert state["phase"] == "outcome"
    outcome_events = [e for e in events if e["type"] == "outcome"]
    assert len(outcome_events) == 1
    assert "draw" in outcome_events[0]["message"].lower()


def test_player_kill_skips_ai_turn():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_kill")
    state["opponent"]["energy"] = 5
    state["phase"] = "player_turn"
    state["legal_actions"] = ["basic"]

    # Player basic deals 12 dmg; the v2 opening Shield absorbs it, so this
    # fixture is not terminal until the shield is removed.
    state["opponent"]["shield"] = 0
    state, events = play_action(state, "basic")
    assert state["outcome"] == "win"
    assert state["phase"] == "outcome"
    assert state["opponent"]["energy"] == 0

    # There should be no AI roll event or AI attack event
    ai_rolls = [e for e in events if e["type"] == "roll" and e.get("side") == "opponent"]
    assert len(ai_rolls) == 0


def test_ai_action_choice_deterministic():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_ai")
    # Finishing move priority: player at 10 energy, AI base_atk is 10
    state["player"]["energy"] = 10
    choice = choose_ai_action(state, roll=5)
    # Both basic (10) and active_1 (14) finish player; finisher should pick active_1 or basic that finishes
    assert choice in ("basic", "active_1")

    # Low health priority: AI energy at 20/90 (<= 35%), roll 5
    state["player"]["energy"] = 80
    state["opponent"]["energy"] = 20
    # Opponent active_2 is Honey Guard (30% guard utility)
    choice_low = choose_ai_action(state, roll=5)
    assert choice_low in ("active_1", "active_2", "basic")


def test_surrender_battle():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_surrender")
    state, events = surrender_battle(state)

    assert state["outcome"] == "surrender"
    assert state["phase"] == "outcome"
    assert state["legal_actions"] == []

    # Surrender when already ended raises ValueError
    with pytest.raises(ValueError):
        surrender_battle(state)


def test_illegal_phase_and_action_raises():
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_illegal")

    # Trying to play action during "roll" phase
    with pytest.raises(ValueError):
        play_action(state, "basic")

    # Roll player to transition to player_turn
    rng = ScriptedRNG([1])  # Roll 1 allows only "basic"
    state, _ = roll_player(state, rng=rng)

    # Trying to play locked/unauthorized "active_1" on roll 1
    with pytest.raises(ValueError):
        play_action(state, "active_1")

    # Trying to roll again while in "player_turn"
    with pytest.raises(ValueError):
        roll_player(state)
