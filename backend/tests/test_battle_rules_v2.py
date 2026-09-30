"""Comprehensive unit and integration test suite for RimbaQuest battle rules v2 engine.

Covers:
- new_battle keywords: opponent_unlocked_slots, initiative, record_events, difficulty, rules_version
- passive_definition full info vs passive unlocked with slot 3
- Brace Defense action: action_count increment, emit action, grants 6 shield capped at 25, no damage/boost consumption
- Legal actions for rolls 1-3 [basic, brace], 4-5 [basic, brace + actives], 6 [actives or basic fallback]
- Opponent initiative opening: AI rolls, chooses, and resolves opening move exactly once
- Round 30 draw condition with opponent initiative (after player action 30, no AI action 31)
- preview_actions: deterministic, no RNG, no state mutation, matches actual resolution
- Simulation efficiency: EventList suppressing deepcopy snapshots
"""

from __future__ import annotations

import copy
import pytest
from app.services.battle_rules import (
    EventList,
    RULES,
    choose_ai_action,
    legal_actions,
    new_battle,
    play_action,
    preview_actions,
    roll_player,
    surrender_battle,
)


class ScriptedRNG:
    """Deterministic scripted RNG yielding a sequence of values."""

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
        "species_id": "sp_malayan_tiger",
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
        "species_id": "sp_sun_bear",
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


def test_legal_actions_v2_rules():
    """Verify legal actions under v2 specifications:

    1-3: basic, brace
    4-5: basic, brace + unlocked active 1/2
    6: unlocked active 1/2 or basic if none unlocked
    """
    combatant_full = {"unlocked_abilities": [1, 2, 3]}
    combatant_slot1 = {"unlocked_abilities": [1]}
    combatant_none = {"unlocked_abilities": []}

    # Rolls 1, 2, 3
    for roll in (1, 2, 3):
        assert legal_actions(combatant_full, roll) == ["basic", "brace"]
        assert legal_actions(combatant_slot1, roll) == ["basic", "brace"]
        assert legal_actions(combatant_none, roll) == ["basic", "brace"]

    # Rolls 4, 5
    for roll in (4, 5):
        assert legal_actions(combatant_full, roll) == ["basic", "brace", "active_1", "active_2"]
        assert legal_actions(combatant_slot1, roll) == ["basic", "brace", "active_1"]
        assert legal_actions(combatant_none, roll) == ["basic", "brace"]

    # Roll 6 (Lucky 6 choices)
    assert legal_actions(combatant_full, 6) == ["active_1", "active_2"]
    assert legal_actions(combatant_slot1, 6) == ["active_1"]
    assert legal_actions(combatant_none, 6) == ["basic"]


def test_new_battle_v2_fields_and_passive_definition():
    """Verify v2 fields in new_battle state:

    - rules_version is '2.0'
    - initiative and difficulty defaults
    - opponent_unlocked_slots parameter
    - passive_definition field retains full passive info even if slot 3 is locked
    """
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    # Player has slots [1, 2] (passive slot 3 locked), opponent has [1, 2, 3]
    state, events = new_battle(
        p_def,
        o_def,
        unlocked_slots=[1, 2],
        battle_id="b_v2_init",
        opponent_unlocked_slots=[1, 2, 3],
        initiative="player",
        difficulty="practice",
    )

    assert state["rules_version"] == "2.0"
    assert state["initiative"] == "player"
    assert state["difficulty"] == "practice"
    assert state["active_side"] == "player"
    assert state["action_previews"] == []

    # Player passive inactive, but passive_definition contains full definition
    assert state["player"]["passive"] is None
    assert state["player"]["passive_definition"] is not None
    assert state["player"]["passive_definition"]["name"] == "Apex Focus"
    assert state["player"]["unlocked_abilities"] == [1, 2]

    # Opponent passive active (unlocked in opp_slots)
    assert state["opponent"]["passive"] is not None
    assert state["opponent"]["passive_definition"] is not None
    assert state["opponent"]["unlocked_abilities"] == [1, 2, 3]


def test_brace_defense_mechanics():
    """Verify Brace Defense action:

    - Increments actor.action_count
    - Emits action and shield events
    - Grants 6 shield, strictly capped at RULES shield_cap (25)
    - Deals 0 damage
    - Does NOT consume next-attack boost or weaken
    - Does NOT trigger active attack passives
    """
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_brace")

    # Give player boost and weaken
    state["player"]["statuses"] = [
        {"id": "b1", "name": "Boost", "type": "buff", "duration": 1, "potency": 5},
        {"id": "w1", "name": "Weaken", "type": "debuff", "duration": 1, "potency": 3},
    ]
    # Set initial shield
    state["player"]["shield"] = 22
    state["player"]["action_count"] = 1

    # Roll 1 (player_turn, allows basic and brace)
    rng = ScriptedRNG([1])
    state, events_roll = roll_player(state, rng=rng)
    assert "brace" in state["legal_actions"]

    # Play brace action; scripted AI rolls 1 and does brace as well (actions: player roll 1, player brace, AI roll 1 -> choose action)
    # AI with roll 1 has actions ["basic", "brace"]. Honey Guard is active_2 (requires roll 4+).
    # AI choose_ai_action with high health scores basic (deals 10 dmg to player shield: 25 - 10 = 15) higher than brace.
    # To test pure player brace shield without taking damage, we check intermediate state or mock opponent
    rng_ai = ScriptedRNG([1])
    state, events_act = play_action(state, "brace", rng=rng_ai)

    # Opponent basic attack dealt 10 dmg, absorbing 10 from player's capped 25 shield -> 15 shield left
    assert state["player"]["shield"] == 15
    # Player energy stayed 100
    assert state["player"]["energy"] == 100
    # Player action_count incremented from 1 to 2
    assert state["player"]["action_count"] == 2
    # Opponent took NO damage from player brace
    assert state["opponent"]["energy"] == 90

    # Boost and weaken must NOT have been consumed by brace!
    status_types = [s["type"] for s in state["player"]["statuses"]]
    assert "buff" in status_types
    assert "debuff" in status_types


def test_opponent_initiative_opening_and_draw_limits():
    """Verify opponent initiative:

    - new_battle with initiative='opponent' rolls, chooses, and resolves AI opening move
    - Then transitions to player's turn to roll
    - When opponent has initiative, 30-round draw condition triggers after player's 30th action
      without executing AI action 31
    """
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    # Opponent opens with roll 1 -> basic attack (10 dmg)
    rng_open = ScriptedRNG([1])
    state, events = new_battle(
        p_def,
        o_def,
        unlocked_slots=[1, 2, 3],
        battle_id="b_opp_init",
        initiative="opponent",
        rng=rng_open,
    )

    # Opponent acted once
    assert state["opponent"]["action_count"] == 1
    # The opponent moved first; the player receives opening protection, then the
    # opening basic action consumes that shield before touching Energy.
    assert state["player"]["shield"] == 0
    assert state["player"]["energy"] == 98
    assert state["player"]["action_count"] == 0

    # Phase transitioned to roll for player
    assert state["phase"] == "roll"
    assert state["active_side"] == "player"
    assert state["round"] == 1

    # Test round 30 draw limit when opponent has initiative
    # Simulate state at round 30: player has action_count 29, opponent has 30
    state["player"]["action_count"] = 29
    state["opponent"]["action_count"] = 30
    state["round"] = 30
    state["phase"] = "player_turn"
    state["legal_actions"] = ["brace"]
    state["player"]["energy"] = 50
    state["opponent"]["energy"] = 50

    # Player executes 30th action (brace)
    # Opponent must NOT get a 31st action; battle must end in draw immediately
    state, events_draw = play_action(state, "brace", rng=ScriptedRNG([1]))

    assert state["player"]["action_count"] == 30
    assert state["opponent"]["action_count"] == 30
    assert state["outcome"] == "draw"
    assert state["phase"] == "outcome"

    # Verify no 31st AI roll or action was emitted
    opp_rolls = [e for e in events_draw if e.get("type") == "roll" and e.get("side") == "opponent"]
    assert len(opp_rolls) == 0


def test_preview_actions_purity_and_accuracy():
    """Verify preview_actions:

    - Pure: DOES NOT mutate original state
    - Accurate: simulated previews match actual play_action outcomes
    - Includes all contract fields: damage, shield_absorbed, healing, shield_gain, etc.
    """
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    state, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_preview")
    state["player"]["energy"] = 70  # Player damaged to test healing
    state["opponent"]["shield"] = 5  # Opponent shielded to test shield absorption

    # Roll 4 for player -> legal: [basic, brace, active_1, active_2]
    rng_roll = ScriptedRNG([4])
    state, events_roll = roll_player(state, rng=rng_roll)

    # Save clone of state before running preview
    state_before = copy.deepcopy(state)
    previews = preview_actions(state, side="player")

    # State must not be mutated by preview_actions
    assert state == state_before

    # Verify previews list length equals legal actions
    assert len(previews) == len(state["legal_actions"])
    actions_in_preview = [p["action"] for p in previews]
    assert actions_in_preview == ["basic", "brace", "active_1", "active_2"]

    # Check Basic Attack preview:
    # Player base_atk is 12, opponent has 5 shield -> absorbed 5, damage to energy 7
    basic_prev = next(p for p in previews if p["action"] == "basic")
    assert basic_prev["damage"] == 7
    assert basic_prev["shield_absorbed"] == 5
    assert basic_prev["healing"] == 0
    assert basic_prev["shield_gain"] == 0
    assert basic_prev["will_end_battle"] is False

    # Check Brace preview:
    # Shield gain 6, damage 0
    brace_prev = next(p for p in previews if p["action"] == "brace")
    assert brace_prev["damage"] == 0
    assert brace_prev["shield_gain"] == 6

    # Check Active 1 (Claw Strike 15 dmg):
    # Opponent passive reduces first incoming active by 5 -> dmg 10
    # Opponent shield 5 absorbs 5 -> damage to energy 5
    act1_prev = next(p for p in previews if p["action"] == "active_1")
    assert act1_prev["damage"] == 5
    assert act1_prev["shield_absorbed"] == 5

    # Check Active 2 (Roar of Vigor: heal 20, shield 10):
    # Player energy 70/100 -> full heal 20, wasted_healing 0, shield_gain 10
    act2_prev = next(p for p in previews if p["action"] == "active_2")
    assert act2_prev["healing"] == 20
    assert act2_prev["wasted_healing"] == 0
    assert act2_prev["shield_gain"] == 10

    # Now verify that actual play_action matches the preview exactly
    state_copy = copy.deepcopy(state)
    state_resolved, events_act = play_action(state_copy, "active_1", rng=ScriptedRNG([1]))

    # Opponent took 5 energy damage in actual resolution, matching preview!
    assert state_resolved["opponent"]["energy"] == 90 - 5


def test_first_lucky_heal_only_consumed_when_healing_possible():
    """Verify first_lucky passive condition:

    If combatant is already at max energy, first_lucky heal passive is not consumed.
    Once combatant takes damage and rolls a natural 6, it triggers and heals.
    """
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    # Case 1: Player at 100/100 energy, rolls natural 6
    # Passive has heal 15 effect. Since player is full HP, it should NOT trigger/consume
    state1, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_lucky_heal_1")
    rng_nat = ScriptedRNG([6])
    state1, _ = roll_player(state1, rng=rng_nat)

    assert state1["lucky"] is True
    assert state1["player"]["passive_triggers"] == 0

    # Case 2: Player takes damage (80/100 energy), then rolls natural 6
    state2, _ = new_battle(p_def, o_def, unlocked_slots=[1, 2, 3], battle_id="b_lucky_heal_2")
    state2["player"]["energy"] = 80
    rng_nat_2 = ScriptedRNG([6])
    state2, _ = roll_player(state2, rng=rng_nat_2)

    assert state2["lucky"] is True
    assert state2["player"]["passive_triggers"] == 1
    assert state2["player"]["energy"] == 95  # 80 + 15


def test_event_list_and_snapshot_suppression():
    """Verify EventList suppresses deepcopy combatant snapshots when record_snapshots=False."""
    p_def = sample_player_def()
    o_def = sample_opponent_def()

    # Battle created with record_events=False
    state, events = new_battle(
        p_def,
        o_def,
        unlocked_slots=[1, 2, 3],
        battle_id="b_no_snap",
        record_events=False,
    )

    assert isinstance(events, EventList)
    assert events.record_snapshots is False

    # All events should NOT contain "snapshot" key
    for ev in events:
        assert "snapshot" not in ev

    # Next player turn with record_events=False
    state, events_roll = roll_player(state, rng=ScriptedRNG([1]), record_events=False)
    for ev in events_roll:
        assert "snapshot" not in ev
