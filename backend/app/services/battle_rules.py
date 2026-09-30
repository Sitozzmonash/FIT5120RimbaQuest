"""Pure battle rules engine for RimbaQuest pixel battles.

Implements immutable state transitions, deterministic resolution, and finite trigger logic
matching the RimbaQuest battle contract specification.
"""

from __future__ import annotations

import copy
import math
import secrets
from typing import Any, Protocol


from app.services.battle_catalogue import RULES


class RNGProtocol(Protocol):
    def randint(self, a: int, b: int) -> int:
        ...


class DefaultRNG:
    """Default secure RNG using secrets.SystemRandom."""

    def __init__(self) -> None:
        self._rng = secrets.SystemRandom()

    def randint(self, a: int, b: int) -> int:
        return self._rng.randint(a, b)


def _deep_copy(obj: Any) -> Any:
    return copy.deepcopy(obj)


class EventList(list):
    """List subclass that carries an optional record_snapshots flag."""

    def __init__(self, *args, record_snapshots: bool = True, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.record_snapshots = record_snapshots


def _emit_event(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    event_type: str,
    message: str,
    vfx: str = "",
    side: str | None = None,
    target: str | None = None,
    action: str | None = None,
    value: int | float | None = None,
    roll: int | None = None,
    lucky: bool | None = None,
    record_snapshots: bool = True,
) -> None:
    state["event_seq"] += 1
    record = record_snapshots and getattr(events, "record_snapshots", True)
    event: dict[str, Any] = {
        "id": state["event_seq"],
        "type": event_type,
        "message": message,
        "vfx": vfx,
    }
    if record:
        event["snapshot"] = {
            "player": _deep_copy(state["player"]),
            "opponent": _deep_copy(state["opponent"]),
        }
    if side is not None:
        event["side"] = side
    if target is not None:
        event["target"] = target
    if action is not None:
        event["action"] = action
    if value is not None:
        event["value"] = value
    if roll is not None:
        event["roll"] = roll
    if lucky is not None:
        event["lucky"] = lucky
    events.append(event)


def _make_combatant(definition: dict[str, Any], unlocked_slots: list[int]) -> dict[str, Any]:
    hp = int(definition.get("hp", 100))
    base_atk = int(definition.get("base_attack", 10))
    raw_abilities = definition.get("abilities", [])
    raw_passive = definition.get("passive")
    lucky_bonus = definition.get("lucky_bonus", [])

    # Filter/format abilities
    abilities = [_deep_copy(a) for a in raw_abilities]
    passive_definition = _deep_copy(raw_passive) if raw_passive else None
    passive = _deep_copy(raw_passive) if (3 in unlocked_slots and raw_passive) else None

    return {
        "species_id": definition["species_id"],
        "name": definition["name"],
        "category": definition.get("category", "General"),
        "role": definition.get("role", "Balanced"),
        "energy": hp,
        "max_energy": hp,
        "base_attack": base_atk,
        "shield": 0,
        "statuses": [],
        "action_count": 0,
        "abilities": abilities,
        "passive": passive,
        "passive_definition": passive_definition,
        "unlocked_abilities": sorted(list(set(unlocked_slots))),
        "passive_triggers": 0,
        "reroll_ready": False,
        "lucky_bonus": [_deep_copy(b) for b in lucky_bonus],
    }


def _status_matches(status: dict[str, Any], status_id: str) -> bool:
    """Match stable IDs while accepting the original fixture names."""
    sid = status.get("id")
    stype = status.get("type")
    name = str(status.get("name", "")).strip().lower()
    if status_id in ("boost", "buff"):
        return sid in ("boost", "buff") or stype in ("boost", "buff") or "boost" in name
    if status_id in ("weaken", "debuff"):
        return sid in ("weaken", "debuff") or stype in ("weaken", "debuff") or "weaken" in name
    if status_id == "guard":
        return sid == "guard" or stype == "guard" or name == "guard"
    return sid == status_id or stype == status_id


def _get_status_potency(combatant: dict[str, Any], status_id: str) -> int:
    pots = [s.get("potency", 0) for s in combatant.get("statuses", []) if _status_matches(s, status_id)]
    return max(pots) if pots else 0


def _apply_status(combatant: dict[str, Any], status_id: str, name: str, status_type: str, potency: int) -> None:
    existing = [s for s in combatant["statuses"] if _status_matches(s, status_id)]
    current_max = max((s.get("potency", 0) for s in existing), default=0)
    combatant["statuses"] = [s for s in combatant["statuses"] if not _status_matches(s, status_id)]
    combatant["statuses"].append({
        "id": status_id,
        "name": name,
        "type": status_type,
        "duration": 1,
        "potency": max(current_max, potency),
    })


def _consume_status(combatant: dict[str, Any], status_id: str) -> int:
    matching = [s for s in combatant["statuses"] if _status_matches(s, status_id)]
    if not matching:
        return 0
    potency = max(s.get("potency", 0) for s in matching)
    combatant["statuses"] = [s for s in combatant["statuses"] if not _status_matches(s, status_id)]
    return potency


def legal_actions(combatant: dict[str, Any], roll: int | None) -> list[str]:
    """Determine legal actions for combatant based on roll and unlocked abilities.

    1-3: basic, brace
    4-5: basic, brace + unlocked active 1/2
    6: only unlocked active 1/2, or basic if none unlocked
    """
    if roll is None:
        return []

    unlocked = set(combatant.get("unlocked_abilities", []))
    has_active_1 = 1 in unlocked
    has_active_2 = 2 in unlocked

    if 1 <= roll <= 3:
        return ["basic", "brace"]
    elif 4 <= roll <= 5:
        actions = ["basic", "brace"]
        if has_active_1:
            actions.append("active_1")
        if has_active_2:
            actions.append("active_2")
        return actions
    elif roll == 6:
        actions = []
        if has_active_1:
            actions.append("active_1")
        if has_active_2:
            actions.append("active_2")
        return actions if actions else ["basic"]
    else:
        raise ValueError(f"Invalid roll value: {roll}")


def _roll_side(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    side: str,
    rng: RNGProtocol,
) -> tuple[int, bool]:
    """Unified dice rolling helper with natural 6 check, at most one reroll, and first_lucky heal."""
    comb = state[side]
    initial_roll = rng.randint(1, 6)
    final_roll = initial_roll
    natural6 = (initial_roll == 6)

    _emit_event(
        state,
        events,
        event_type="roll",
        side=side,
        message=f"{comb['name']} rolled a {initial_roll}!",
        vfx="dice_roll",
        roll=initial_roll,
    )

    # Check reroll mechanics if initial roll is low (1-3)
    if 1 <= initial_roll <= 3:
        has_token = comb.get("reroll_ready", False)
        passive = comb.get("passive")
        has_passive_reroll = (
            passive is not None
            and passive.get("trigger") == "low_roll_reroll"
            and comb["passive_triggers"] < passive.get("max_triggers", 1)
        )

        should_reroll = has_token or has_passive_reroll

        if should_reroll:
            if has_token:
                comb["reroll_ready"] = False
            elif has_passive_reroll:
                comb["passive_triggers"] += 1
                _emit_event(
                    state,
                    events,
                    "passive",
                    f"{comb['name']}: {passive['name']} activated!",
                    "light",
                    side=side,
                )

            final_roll = rng.randint(1, 6)
            _emit_event(
                state,
                events,
                event_type="reroll",
                side=side,
                message=f"{comb['name']} rerolled into a {final_roll}!",
                vfx="dice_reroll",
                roll=final_roll,
            )
    else:
        if comb.get("reroll_ready", False):
            comb["reroll_ready"] = False

    # Apply first_lucky passive if natural 6 rolled
    if natural6:
        passive = comb.get("passive")
        if (
            passive is not None
            and passive.get("trigger") == "first_lucky"
            and comb["passive_triggers"] < passive.get("max_triggers", 1)
        ):
            # If the passive contains heal effect, only consume if combatant can actually heal
            heal_effs = [e for e in passive.get("effects", []) if e.get("type") == "heal"]
            non_heal_effs = [e for e in passive.get("effects", []) if e.get("type") != "heal"]
            can_trigger = True
            if heal_effs and not non_heal_effs:
                if comb["energy"] >= comb["max_energy"]:
                    can_trigger = False

            if can_trigger:
                comb["passive_triggers"] += 1
                _emit_event(
                    state,
                    events,
                    "passive",
                    f"{comb['name']}: {passive['name']} activated!",
                    "light",
                    side=side,
                )
                for eff in passive.get("effects", []):
                    _apply_effect_direct(
                        state,
                        events,
                        side,
                        eff,
                        source_type="passive",
                        source_name=passive.get("name", "Lucky Passive"),
                    )

    return final_roll, natural6


def new_battle(
    player_definition: dict[str, Any],
    opponent_definition: dict[str, Any],
    unlocked_slots: list[int],
    battle_id: str,
    rng: RNGProtocol | None = None,
    opponent_unlocked_slots: list[int] | None = None,
    initiative: str = "player",
    difficulty: str = "standard",
    record_events: bool = True,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Initialize a new battle state and emit encounter/battle_start events."""
    opp_slots = opponent_unlocked_slots if opponent_unlocked_slots is not None else unlocked_slots
    player = _make_combatant(player_definition, unlocked_slots)
    opponent = _make_combatant(opponent_definition, opp_slots)

    state: dict[str, Any] = {
        "battle_id": battle_id,
        "version": 0,
        "round": 1,
        "phase": "roll",
        "active_side": initiative,
        "player": player,
        "opponent": opponent,
        "current_roll": None,
        "lucky": False,
        "legal_actions": [],
        "outcome": None,
        "event_seq": 0,
        "initiative": initiative,
        "difficulty": difficulty,
        "rules_version": "2.0",
        "action_previews": [],
    }

    events = EventList(record_snapshots=record_events)

    _emit_event(
        state,
        events,
        event_type="encounter",
        message=f"{player['name']} encounters wild {opponent['name']}!",
        vfx="encounter",
    )

    # Apply battle_start passives in initiative order
    sides_order = ("player", "opponent") if initiative == "player" else ("opponent", "player")
    for side in sides_order:
        comb = state[side]
        passive = comb.get("passive")
        if (
            passive
            and passive.get("trigger") == "battle_start"
            and comb["passive_triggers"] < passive.get("max_triggers", 1)
        ):
            comb["passive_triggers"] += 1
            _emit_event(
                state,
                events,
                "passive",
                f"{comb['name']}: {passive['name']} activated!",
                "light",
                side=side,
            )
            effects = passive.get("effects", [])
            for eff in effects:
                _apply_effect_direct(
                    state,
                    events,
                    side,
                    eff,
                    source_type="passive",
                    source_name=passive.get("name", "Passive"),
                )

    # The second mover gets visible protection to offset the opening action.
    first = state[initiative]
    second_side = "player" if initiative == "opponent" else "opponent"
    shield_key = "opening_shield_active" if any(slot in first["unlocked_abilities"] for slot in (1, 2)) else "opening_shield_basic"
    protection = RULES.get(shield_key, 0)
    if protection:
        _apply_shield(state, events, second_side, protection)
        _emit_event(state, events, "initiative", f"{state[second_side]['name']} receives {protection} opening Shield for moving second.", "shield", side=second_side, target=second_side)

    # If opponent has initiative: opponent takes opening turn immediately
    if initiative == "opponent":
        _rng = rng if rng is not None else DefaultRNG()
        opp_roll, opp_lucky = _roll_side(state, events, side="opponent", rng=_rng)
        opp_action = choose_ai_action(state, opp_roll, lucky=opp_lucky, side="opponent")
        _resolve_action(state, events, actor_side="opponent", action=opp_action, lucky=opp_lucky)

        # Check if player tired from opponent opening move
        if state["player"]["energy"] <= 0:
            state["outcome"] = "lose"
            state["phase"] = "outcome"
            state["legal_actions"] = []
            _emit_event(
                state,
                events,
                event_type="outcome",
                side="opponent",
                message=f"{state['player']['name']} ran out of energy. Opponent wins!",
                vfx="defeat",
            )
            return state, events

        # Transition to player's turn to roll
        state["phase"] = "roll"
        state["active_side"] = "player"
        state["round"] = min(state["player"]["action_count"], state["opponent"]["action_count"]) + 1

    return state, events


def roll_player(
    state: dict[str, Any],
    rng: RNGProtocol | None = None,
    record_events: bool = True,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Perform player roll phase with reroll mechanics and legality calculation."""
    if state["phase"] != "roll" or state["outcome"] is not None:
        raise ValueError(f"Cannot roll player during phase '{state['phase']}' with outcome '{state['outcome']}'")

    st = _deep_copy(state)
    events = EventList(record_snapshots=record_events)
    _rng = rng if rng is not None else DefaultRNG()

    final_roll, natural6 = _roll_side(st, events, side="player", rng=_rng)

    st["current_roll"] = final_roll
    st["lucky"] = natural6  # Lucky only on initial natural 6
    st["phase"] = "player_turn"
    st["active_side"] = "player"
    st["legal_actions"] = legal_actions(st["player"], final_roll)
    st["action_previews"] = preview_actions(st, side="player")

    return st, events


def preview_actions(state: dict[str, Any], side: str = "player") -> list[dict[str, Any]]:
    """Generate deterministic previews for all legal actions without RNG or mutation."""
    actor = state[side]
    roll = state.get("current_roll")
    lucky = bool(state.get("lucky", False))
    actions = legal_actions(actor, roll) if roll is not None else []

    previews: list[dict[str, Any]] = []
    target_side = "opponent" if side == "player" else "player"

    for action in actions:
        # Determine ability metadata and display name
        if action == "basic":
            ability_name = "Basic Attack"
            raw_effects = [{"type": "damage", "value": actor["base_attack"], "target": "opponent"}]
        elif action == "brace":
            ability_name = "Brace Defense"
            raw_effects = [{"type": "shield", "value": RULES.get("brace_shield", 6), "target": "self"}]
        elif action == "active_1":
            ab = next((a for a in actor["abilities"] if a["slot"] == 1), None)
            ability_name = ab["name"] if ab else "Active 1"
            raw_effects = [_deep_copy(e) for e in (ab.get("effects", []) if ab else [])]
        elif action == "active_2":
            ab = next((a for a in actor["abilities"] if a["slot"] == 2), None)
            ability_name = ab["name"] if ab else "Active 2"
            raw_effects = [_deep_copy(e) for e in (ab.get("effects", []) if ab else [])]
        else:
            continue

        # Merge lucky effects into effects definition preview
        effects_for_preview = [_deep_copy(e) for e in raw_effects]
        lucky_bonus_dmg = 0
        lucky_summary_parts: list[str] = []

        if lucky and action != "brace":
            if action == "basic":
                lucky_bonus_dmg = RULES.get("lucky_basic_bonus", 3)
                lucky_summary_parts.append(f"+{lucky_bonus_dmg} Lucky Damage")
            else:
                for lb in actor.get("lucky_bonus", []):
                    eff_type = lb.get("type")
                    req = lb.get("requires_effect")
                    applies = False
                    if req:
                        if any(e.get("type") == req for e in raw_effects):
                            applies = True
                    else:
                        applies = True

                    if applies:
                        if eff_type == "damage":
                            lucky_bonus_dmg += lb.get("value", 0)
                            lucky_summary_parts.append(f"+{lb.get('value', 0)} Lucky Damage")
                        else:
                            matching = [e for e in effects_for_preview if e.get("type") == eff_type]
                            if matching:
                                matching[0]["value"] = matching[0].get("value", 0) + lb.get("value", 0)
                            else:
                                effects_for_preview.append(_deep_copy(lb))
                            lucky_summary_parts.append(f"+{lb.get('value', 0)} {eff_type.capitalize()}")

        # Clone state and resolve action efficiently without snapshots
        sim_state = _deep_copy(state)
        sim_events = EventList(record_snapshots=False)
        _resolve_action(sim_state, sim_events, actor_side=side, action=action, lucky=lucky)

        post_actor = sim_state[side]
        post_target = sim_state[target_side]
        pre_actor = state[side]
        pre_target = state[target_side]

        # Extract damage and shield absorbed from events
        damage = 0
        for ev in sim_events:
            if ev.get("type") == "damage":
                damage = int(ev.get("value", 0))

        # Target shield difference
        shield_absorbed = max(0, pre_target.get("shield", 0) - post_target.get("shield", 0))

        # Actor energy heal
        healing = max(0, post_actor.get("energy", 0) - pre_actor.get("energy", 0))

        # Actor shield gain
        shield_gain = max(0, post_actor.get("shield", 0) - pre_actor.get("shield", 0))

        # Compute theoretical healing & shield from effects to determine wasted amounts
        theoretical_heal = 0
        theoretical_shield = 0
        for eff in effects_for_preview:
            if eff.get("type") == "heal":
                theoretical_heal += eff.get("value", 0)
            elif eff.get("type") == "shield":
                theoretical_shield += eff.get("value", 0)

        # Include passive heal/shield if triggered during action
        for ev in sim_events:
            if ev.get("type") == "heal" and ev.get("side") == side and not theoretical_heal:
                theoretical_heal += int(ev.get("value", 0))

        wasted_healing = max(0, theoretical_heal - healing)
        wasted_shield = max(0, theoretical_shield - shield_gain)

        will_end_battle = (post_target.get("energy", 0) <= 0)

        # Statuses applied or present on target/actor
        statuses: list[dict[str, Any]] = []
        for s in post_actor.get("statuses", []):
            statuses.append({
                "id": s.get("id", ""),
                "name": s.get("name", ""),
                "potency": s.get("potency", 0),
                "duration": s.get("duration", 1),
                "type": s.get("type", ""),
            })
        for s in post_target.get("statuses", []):
            statuses.append({
                "id": s.get("id", ""),
                "name": s.get("name", ""),
                "potency": s.get("potency", 0),
                "duration": s.get("duration", 1),
                "type": s.get("type", ""),
            })

        # Summaries
        parts: list[str] = []
        if damage > 0:
            parts.append(f"Deals {damage} damage")
        if shield_absorbed > 0:
            parts.append(f"({shield_absorbed} absorbed by shield)")
        if healing > 0:
            parts.append(f"Restores {healing} energy")
        if shield_gain > 0:
            parts.append(f"Grants +{shield_gain} shield")
        for s in statuses:
            parts.append(f"{s['name']} ({s['potency']})")
        if will_end_battle:
            parts.append("Finishes opponent!")

        summary = ", ".join(parts) if parts else "No direct impact"
        lucky_summary = ", ".join(lucky_summary_parts)

        previews.append({
            "action": action,
            "name": ability_name,
            "effects": effects_for_preview,
            "damage": damage,
            "shield_absorbed": shield_absorbed,
            "healing": healing,
            "shield_gain": shield_gain,
            "statuses": statuses,
            "wasted_healing": wasted_healing,
            "wasted_shield": wasted_shield,
            "lucky_bonus_damage": lucky_bonus_dmg,
            "will_end_battle": will_end_battle,
            "summary": summary,
            "lucky_summary": lucky_summary,
        })

    return previews


def surrender_battle(
    state: dict[str, Any],
    record_events: bool = True,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Surrender the battle immediately."""
    if state["outcome"] is not None:
        raise ValueError(f"Battle already finished with outcome '{state['outcome']}'")

    st = _deep_copy(state)
    events = EventList(record_snapshots=record_events)
    st["outcome"] = "surrender"
    st["phase"] = "outcome"
    st["legal_actions"] = []
    st["action_previews"] = []

    _emit_event(
        st,
        events,
        event_type="outcome",
        message=f"{st['player']['name']} surrendered the battle.",
        vfx="surrender",
    )
    return st, events


def play_action(
    state: dict[str, Any],
    action: str,
    rng: RNGProtocol | None = None,
    record_events: bool = True,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Execute player action, check termination, execute AI action if alive, and advance round."""
    if state["phase"] != "player_turn" or state["outcome"] is not None:
        raise ValueError(f"Cannot play action in phase '{state['phase']}'")
    if action not in state.get("legal_actions", []):
        raise ValueError(f"Action '{action}' is not legal for current roll")

    st = _deep_copy(state)
    events = EventList(record_snapshots=record_events)
    _rng = rng if rng is not None else DefaultRNG()

    # 1. Resolve player action
    _resolve_action(st, events, actor_side="player", action=action, lucky=st["lucky"])

    # 2. Check if opponent is tired (HP reached 0)
    if st["opponent"]["energy"] <= 0:
        st["outcome"] = "win"
        st["phase"] = "outcome"
        st["legal_actions"] = []
        st["action_previews"] = []
        _emit_event(
            st,
            events,
            event_type="outcome",
            side="player",
            message=f"{st['player']['name']} wins the battle!",
            vfx="win",
        )
        return st, events

    # Check draw after player action if opponent had initiative
    # If opponent had initiative, round 30 draw condition is reached when player finishes round 30 (player has 30 actions)
    initiative = st.get("initiative", "player")
    if initiative == "opponent" and st["player"]["action_count"] >= RULES["max_rounds"]:
        st["outcome"] = "draw"
        st["phase"] = "outcome"
        st["legal_actions"] = []
        st["action_previews"] = []
        _emit_event(
            st,
            events,
            event_type="outcome",
            message=f"Battle ended in a draw after {RULES['max_rounds']} rounds.",
            vfx="draw",
        )
        return st, events

    # 3. AI Turn (opponent)
    st["active_side"] = "opponent"
    ai_final_roll, ai_lucky = _roll_side(st, events, side="opponent", rng=_rng)

    ai_action = choose_ai_action(st, ai_final_roll, lucky=ai_lucky, side="opponent")
    _resolve_action(st, events, actor_side="opponent", action=ai_action, lucky=ai_lucky)

    # 4. Check if player is tired
    if st["player"]["energy"] <= 0:
        st["outcome"] = "lose"
        st["phase"] = "outcome"
        st["legal_actions"] = []
        st["action_previews"] = []
        _emit_event(
            st,
            events,
            event_type="outcome",
            side="opponent",
            message=f"{st['player']['name']} ran out of energy. Opponent wins!",
            vfx="defeat",
        )
        return st, events

    # 5. Check round 30 draw condition (if player had initiative)
    if initiative == "player" and st["round"] >= RULES["max_rounds"]:
        st["outcome"] = "draw"
        st["phase"] = "outcome"
        st["legal_actions"] = []
        st["action_previews"] = []
        _emit_event(
            st,
            events,
            event_type="outcome",
            message=f"Battle ended in a draw after {RULES['max_rounds']} rounds.",
            vfx="draw",
        )
        return st, events

    # 6. Advance to next round
    st["round"] = min(st["player"]["action_count"], st["opponent"]["action_count"]) + 1
    st["phase"] = "roll"
    st["active_side"] = "player"
    st["current_roll"] = None
    st["lucky"] = False
    st["legal_actions"] = []
    st["action_previews"] = []

    return st, events


def _resolve_action(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    actor_side: str,
    action: str,
    lucky: bool,
) -> None:
    """Execute a single combatant action including damage, passives, and utilities."""
    target_side = "opponent" if actor_side == "player" else "player"
    actor = state[actor_side]
    target = state[target_side]

    actor["action_count"] += 1
    action_num = actor["action_count"]

    # Special handling for Brace Defense
    if action == "brace":
        _emit_event(
            state,
            events,
            event_type="action",
            side=actor_side,
            action=action,
            message=f"{actor['name']} braces for defense!",
            vfx="shield",
        )
        _apply_shield(state, events, actor_side, RULES.get("brace_shield", 6))
        return

    # Determine ability details
    ability_def: dict[str, Any] | None = None
    if action == "basic":
        ability_name = "Basic Attack"
        effects: list[dict[str, Any]] = [{"type": "damage", "value": actor["base_attack"], "target": "opponent"}]
    elif action == "active_1":
        ability_def = next((a for a in actor["abilities"] if a["slot"] == 1), None)
        if not ability_def:
            raise ValueError(f"{actor_side} active_1 not found in abilities")
        ability_name = ability_def["name"]
        effects = [_deep_copy(e) for e in ability_def.get("effects", [])]
    elif action == "active_2":
        ability_def = next((a for a in actor["abilities"] if a["slot"] == 2), None)
        if not ability_def:
            raise ValueError(f"{actor_side} active_2 not found in abilities")
        ability_name = ability_def["name"]
        effects = [_deep_copy(e) for e in ability_def.get("effects", [])]
    else:
        raise ValueError(f"Unknown action: {action}")

    _emit_event(
        state,
        events,
        event_type="action",
        side=actor_side,
        action=action,
        message=f"{actor['name']} uses {ability_name}!",
        vfx=ability_def.get("vfx", "leaves") if ability_def else "leaves",
    )

    outgoing_passive_damage = 0
    passive = actor.get("passive")
    if (
        passive
        and passive.get("trigger") == "first_active"
        and action in ("active_1", "active_2")
        and actor["passive_triggers"] < passive.get("max_triggers", 1)
    ):
        actor["passive_triggers"] += 1
        _emit_event(
            state,
            events,
            "passive",
            f"{actor['name']}: {passive['name']} activated!",
            "light",
            side=actor_side,
        )
        for peff in passive.get("effects", []):
            if peff["type"] == "damage":
                outgoing_passive_damage += peff["value"]
            else:
                _apply_effect_direct(
                    state,
                    events,
                    actor_side,
                    peff,
                    source_type="passive",
                    source_name=passive["name"],
                )

    # Periodic bonuses affect the current attack, never a separate hit.
    if (
        passive
        and passive.get("trigger") == "every_third_action_damage"
        and action_num % passive.get("every", 3) == 0
        and actor["passive_triggers"] < passive.get("max_triggers", 10)
    ):
        actor["passive_triggers"] += 1
        _emit_event(
            state,
            events,
            "passive",
            f"{actor['name']}: {passive['name']} activated!",
            "light",
            side=actor_side,
        )
        for peff in passive.get("effects", []):
            if peff.get("type") == "damage":
                outgoing_passive_damage += peff.get("value", 0)

    # Merge lucky bonus if lucky is True
    lucky_damage = 0
    extra_utilities: list[dict[str, Any]] = []

    if lucky:
        if action == "basic":
            lucky_damage += RULES.get("lucky_basic_bonus", 3)
        for lb in (actor.get("lucky_bonus", []) if action != "basic" else []):
            eff_type = lb.get("type")
            req = lb.get("requires_effect")
            if req:
                has_req = any(e.get("type") == req for e in effects)
                if has_req:
                    if eff_type == "damage":
                        lucky_damage += lb.get("value", 0)
                    else:
                        extra_utilities.append(_deep_copy(lb))
            else:
                if eff_type == "damage":
                    lucky_damage += lb.get("value", 0)
                else:
                    extra_utilities.append(_deep_copy(lb))

    # Separate damage effects and utility effects
    damage_effects = [e for e in effects if e.get("type") == "damage"]
    utility_effects = [e for e in effects if e.get("type") != "damage"]

    # Lucky utilities merged BEFORE application
    merged_utilities = _merge_utilities(utility_effects, extra_utilities)

    # Resolve damage if any damage effect exists or outgoing_passive_damage > 0 or lucky_damage > 0
    if damage_effects or outgoing_passive_damage > 0 or lucky_damage > 0:
        base_dmg = sum(e.get("value", 0) for e in damage_effects)
        # consume next-attack boost and weaken
        boost_val = _consume_status(actor, "boost")
        weaken_val = _consume_status(actor, "weaken")

        gross_dmg = max(0, base_dmg + boost_val + outgoing_passive_damage + lucky_damage - weaken_val)

        # Apply target incoming passives: first_incoming_active, first_incoming_basic
        target_passive = target.get("passive")
        target_reduce_dmg = 0
        if target_passive and target["passive_triggers"] < target_passive.get("max_triggers", 1):
            if (
                target_passive.get("trigger") == "first_incoming_active"
                and action in ("active_1", "active_2")
            ) or (
                target_passive.get("trigger") == "first_incoming_basic"
                and action == "basic"
            ):
                target["passive_triggers"] += 1
                _emit_event(
                    state,
                    events,
                    "passive",
                    f"{target['name']}: {target_passive['name']} activated!",
                    "light",
                    side=target_side,
                )
                for teff in target_passive.get("effects", []):
                    if teff.get("type") == "reduce_damage":
                        target_reduce_dmg += teff.get("value", 0)
                    else:
                        _apply_effect_direct(
                            state,
                            events,
                            target_side,
                            teff,
                            source_type="passive",
                            source_name=target_passive.get("name", "Passive"),
                        )

        # Mitigation order:
        # 1. Fixed incoming reduction
        after_reduction = max(0, gross_dmg - target_reduce_dmg)

        # 2. Guard percentage: strongest guard, floor remaining * (100 - guard) / 100
        guard_potency = _consume_status(target, "guard")
        if guard_potency > 0:
            guard_pct = min(80, max(0, guard_potency))
            after_guard = math.floor(after_reduction * (100 - guard_pct) / 100)
        else:
            after_guard = after_reduction

        # 3. Shield absorbs remainder, clamp energy to 0
        absorbed_by_shield = min(target.get("shield", 0), after_guard)
        target["shield"] -= absorbed_by_shield
        dmg_to_energy = after_guard - absorbed_by_shield

        target["energy"] = max(0, target["energy"] - dmg_to_energy)

        _emit_event(
            state,
            events,
            event_type="damage",
            side=actor_side,
            target=target_side,
            value=dmg_to_energy,
            message=f"{target['name']} took {dmg_to_energy} energy damage (shield absorbed {absorbed_by_shield})!",
            vfx=ability_def.get("vfx", "stars") if ability_def else "stars",
        )

        # Target tired check
        if target["energy"] <= 0:
            _emit_event(
                state,
                events,
                event_type="tired",
                target=target_side,
                message=f"{target['name']} is tired and cannot continue!",
                vfx="tired",
            )
            return

        # Check low_energy recovery:
        if (
            target_passive
            and target_passive.get("trigger") == "low_energy"
            and target["passive_triggers"] < target_passive.get("max_triggers", 1)
        ):
            threshold = target_passive.get("threshold", 0.25)
            if target["energy"] > 0 and (target["energy"] / target["max_energy"]) <= threshold:
                target["passive_triggers"] += 1
                _emit_event(
                    state,
                    events,
                    "passive",
                    f"{target['name']}: {target_passive['name']} activated!",
                    "light",
                    side=target_side,
                )
                for teff in target_passive.get("effects", []):
                    _apply_effect_direct(
                        state,
                        events,
                        target_side,
                        teff,
                        source_type="passive",
                        source_name=target_passive.get("name", "Low Energy"),
                    )

    # Resolve utilities for acting skill
    for ueff in merged_utilities:
        _apply_utility_effect(state, events, actor_side, ueff)

    # Outgoing every_third_action_heal
    if (
        passive
        and passive.get("trigger") == "every_third_action_heal"
        and action_num % passive.get("every", 3) == 0
        and actor["passive_triggers"] < passive.get("max_triggers", 10)
    ):
        actor["passive_triggers"] += 1
        _emit_event(
            state,
            events,
            "passive",
            f"{actor['name']}: {passive['name']} activated!",
            "light",
            side=actor_side,
        )
        for peff in passive.get("effects", []):
            if peff.get("type") == "heal":
                _apply_heal(state, events, actor_side, peff.get("value", 0), source="passive")


def _merge_utilities(
    base_utils: list[dict[str, Any]],
    lucky_utils: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Merge base utilities with lucky utilities before application."""
    merged = [_deep_copy(u) for u in base_utils]
    for lu in lucky_utils:
        lu_type = lu.get("type")
        matching = [u for u in merged if u.get("type") == lu_type]
        if matching:
            matching[0]["value"] = matching[0].get("value", 0) + lu.get("value", 0)
        else:
            merged.append(_deep_copy(lu))
    return merged


def _apply_utility_effect(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    actor_side: str,
    effect: dict[str, Any],
) -> None:
    target_side = "opponent" if actor_side == "player" else "player"
    eff_type = effect.get("type")
    val = effect.get("value", 0)

    if eff_type == "heal":
        _apply_heal(state, events, actor_side, val, source="ability")
    elif eff_type == "shield":
        _apply_shield(state, events, actor_side, val)
    elif eff_type == "guard":
        _apply_guard(state, events, actor_side, val)
    elif eff_type == "boost":
        _apply_boost(state, events, actor_side, val)
    elif eff_type == "weaken":
        _apply_weaken(state, events, target_side, val)
    elif eff_type == "reroll":
        state[actor_side]["reroll_ready"] = True
        _emit_event(
            state,
            events,
            event_type="reroll",
            side=actor_side,
            message=f"{state[actor_side]['name']} gains a reroll charge for next turn!",
            vfx="reroll_token",
        )


def _apply_effect_direct(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    beneficiary_side: str,
    effect: dict[str, Any],
    source_type: str,
    source_name: str,
) -> None:
    """Apply passive or immediate effect."""
    eff_type = effect.get("type")
    val = effect.get("value", 0)
    target_side = "opponent" if beneficiary_side == "player" else "player"

    if eff_type == "heal":
        _apply_heal(state, events, beneficiary_side, val, source=source_type)
    elif eff_type == "shield":
        _apply_shield(state, events, beneficiary_side, val)
    elif eff_type == "guard":
        _apply_guard(state, events, beneficiary_side, val)
    elif eff_type == "boost":
        _apply_boost(state, events, beneficiary_side, val)
    elif eff_type == "weaken":
        _apply_weaken(state, events, target_side, val)
    elif eff_type == "reroll":
        state[beneficiary_side]["reroll_ready"] = True
        _emit_event(
            state,
            events,
            event_type="passive",
            side=beneficiary_side,
            message=f"{state[beneficiary_side]['name']}'s {source_name} primed a reroll charge!",
            vfx="reroll_token",
        )


def _apply_heal(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    side: str,
    val: int,
    source: str = "heal",
) -> None:
    comb = state[side]
    if comb["energy"] <= 0:
        return  # No resurrection at 0
    actual = min(val, comb["max_energy"] - comb["energy"])
    comb["energy"] += actual
    _emit_event(
        state,
        events,
        event_type="heal",
        side=side,
        target=side,
        value=actual,
        message=f"{comb['name']} restored {actual} energy!",
        vfx="heal",
    )


def _apply_shield(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    side: str,
    val: int,
) -> None:
    comb = state[side]
    cap = RULES.get("shield_cap", 25)
    old_shield = comb.get("shield", 0)
    comb["shield"] = min(cap, old_shield + val)
    gained = comb["shield"] - old_shield
    _emit_event(
        state,
        events,
        event_type="shield",
        side=side,
        target=side,
        value=gained,
        message=f"{comb['name']} generated {gained} shield (total: {comb['shield']})!",
        vfx="shield",
    )


def _apply_guard(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    side: str,
    val: int,
) -> None:
    comb = state[side]
    _apply_status(comb, "guard", "Guard", "guard", val)
    _emit_event(
        state,
        events,
        event_type="guard",
        side=side,
        target=side,
        value=val,
        message=f"{comb['name']} readies guard ({val}%)!",
        vfx="guard",
    )


def _apply_boost(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    side: str,
    val: int,
) -> None:
    comb = state[side]
    _apply_status(comb, "boost", "Attack Boost", "buff", val)
    _emit_event(
        state,
        events,
        event_type="boost",
        side=side,
        target=side,
        value=val,
        message=f"{comb['name']} readies attack boost (+{val})!",
        vfx="boost",
    )


def _apply_weaken(
    state: dict[str, Any],
    events: list[dict[str, Any]],
    side: str,
    val: int,
) -> None:
    comb = state[side]
    _apply_status(comb, "weaken", "Weaken", "debuff", val)
    _emit_event(
        state,
        events,
        event_type="weaken",
        target=side,
        value=val,
        message=f"{comb['name']} is weakened (-{val})!",
        vfx="weaken",
    )


def choose_ai_action(
    state: dict[str, Any],
    roll: int,
    *,
    lucky: bool = False,
    side: str = "opponent",
) -> str:
    """Choose from current legal moves without inspecting future rolls."""
    target_side = "player" if side == "opponent" else "opponent"
    actor, target = state[side], state[target_side]
    actions = legal_actions(actor, roll)
    if not actions:
        raise ValueError("AI has no legal action")
    if len(actions) == 1:
        return actions[0]
    scored = []
    low_energy = actor["energy"] <= actor["max_energy"] * 0.35
    for action in actions:
        preview = _deep_copy(state)
        # Suppress snapshots for efficient simulation
        sim_events = EventList(record_snapshots=False)
        _resolve_action(preview, sim_events, side, action, lucky)
        next_actor, next_target = preview[side], preview[target_side]
        if next_target["energy"] == 0:
            return action
        damage = target["energy"] - next_target["energy"]
        shield_removed = target["shield"] - next_target["shield"]
        heal = next_actor["energy"] - actor["energy"]
        shield = next_actor["shield"] - actor["shield"]
        guard = max(0, _get_status_potency(next_actor, "guard") - _get_status_potency(actor, "guard"))
        boost = max(0, _get_status_potency(next_actor, "boost") - _get_status_potency(actor, "boost"))
        weaken = max(0, _get_status_potency(next_target, "weaken") - _get_status_potency(target, "weaken"))
        utility = guard * target["base_attack"] / 100 + boost * 0.6 + weaken * 0.7
        utility += 2 if next_actor["reroll_ready"] and not actor["reroll_ready"] else 0
        score = damage + shield_removed * 0.6 + heal * (1.3 if low_energy else 0.7) + shield * (0.8 if low_energy else 0.5) + utility
        scored.append((score, action))
    return max(scored, key=lambda item: item[0])[1]


def resolve_turn(
    state: dict[str, Any],
    side: str,
    action: str,
    roll: int,
    lucky: bool = False,
    *,
    record_events: bool = True,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Execute a single turn resolution reusing the exact resolver."""
    st = _deep_copy(state)
    events = EventList(record_snapshots=record_events)
    _resolve_action(st, events, actor_side=side, action=action, lucky=lucky)
    return st, events
