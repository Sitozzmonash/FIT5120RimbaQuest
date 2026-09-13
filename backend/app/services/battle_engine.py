from __future__ import annotations

from typing import Any
import random
from sqlalchemy import text


ABILITY_DEFINITIONS: dict[str, list[dict[str, Any]]] = {
    "Mammal": [
        {
            "slot": 1,
            "name": "Swift Pounce",
            "type": "offensive",
            "multiplier": 1.5,
            "heal_amount": 0,
            "description": "A rapid leaping attack dealing 1.5x damage.",
        },
        {
            "slot": 2,
            "name": "Wild Roar",
            "type": "defensive_heal",
            "multiplier": 0.8,
            "heal_amount": 25,
            "description": "An intimidating roar that recovers 25 HP and deals moderate damage.",
        },
        {
            "slot": 3,
            "name": "Guardian Guard",
            "type": "ultimate",
            "multiplier": 2.2,
            "heal_amount": 10,
            "description": "An ultimate territorial strike dealing massive 2.2x damage and restoring 10 HP.",
        },
    ],
    "Reptile": [
        {
            "slot": 1,
            "name": "Iron Scales",
            "type": "offensive",
            "multiplier": 1.4,
            "heal_amount": 0,
            "description": "Hardened armored charge dealing 1.4x damage.",
        },
        {
            "slot": 2,
            "name": "Venom Strike",
            "type": "offensive_drain",
            "multiplier": 1.3,
            "heal_amount": 20,
            "description": "A venomous bite dealing damage and absorbing 20 HP.",
        },
        {
            "slot": 3,
            "name": "Ambush Snap",
            "type": "ultimate",
            "multiplier": 2.1,
            "heal_amount": 0,
            "description": "A crushing ambush strike dealing devastating 2.1x damage.",
        },
    ],
    "Bird": [
        {
            "slot": 1,
            "name": "Aerial Dive",
            "type": "offensive",
            "multiplier": 1.5,
            "heal_amount": 0,
            "description": "A high-speed dive from above dealing 1.5x damage.",
        },
        {
            "slot": 2,
            "name": "Sonic Cry",
            "type": "offensive",
            "multiplier": 1.3,
            "heal_amount": 15,
            "description": "A disorienting screech dealing damage and rallying 15 HP.",
        },
        {
            "slot": 3,
            "name": "Sharp Talon",
            "type": "ultimate",
            "multiplier": 2.2,
            "heal_amount": 0,
            "description": "Savage razor-sharp talons dealing 2.2x base attack damage.",
        },
    ],
    "Butterfly": [
        {
            "slot": 1,
            "name": "Toxic Powder",
            "type": "offensive",
            "multiplier": 1.5,
            "heal_amount": 0,
            "description": "Scatters irritating spore dust dealing 1.5x damage.",
        },
        {
            "slot": 2,
            "name": "Nectar Heal",
            "type": "heal",
            "multiplier": 0.5,
            "heal_amount": 35,
            "description": "Sips restorative jungle nectar to recover 35 HP.",
        },
        {
            "slot": 3,
            "name": "Dazzle Flutter",
            "type": "ultimate",
            "multiplier": 2.0,
            "heal_amount": 15,
            "description": "A mesmerizing wing flurry dealing 2.0x damage and restoring 15 HP.",
        },
    ],
}

DEFAULT_ABILITIES: list[dict[str, Any]] = [
    {
        "slot": 1,
        "name": "Basic Tackle",
        "type": "offensive",
        "multiplier": 1.4,
        "heal_amount": 0,
        "description": "A forceful body tackle dealing 1.4x damage.",
    },
    {
        "slot": 2,
        "name": "Defend",
        "type": "heal",
        "multiplier": 0.6,
        "heal_amount": 20,
        "description": "Braces defense and recovers 20 HP.",
    },
    {
        "slot": 3,
        "name": "Focus Strike",
        "type": "ultimate",
        "multiplier": 2.0,
        "heal_amount": 0,
        "description": "Concentrates energy for a heavy 2.0x damage strike.",
    },
]

SUPPORTED_BOT_SPECIES: list[dict[str, Any]] = [
    {
        "species_id": "sp_wild_boar",
        "name": "Wild Boar",
        "category": "Mammal",
        "hp": 115,
        "base_attack": 22,
    },
    {
        "species_id": "sp_malayan_tiger",
        "name": "Malayan Tiger",
        "category": "Mammal",
        "hp": 130,
        "base_attack": 26,
    },
    {
        "species_id": "sp_clouded_leopard",
        "name": "Clouded Leopard",
        "category": "Mammal",
        "hp": 120,
        "base_attack": 25,
    },
    {
        "species_id": "sp_oriental_pied_hornbill",
        "name": "Oriental Pied Hornbill",
        "category": "Bird",
        "hp": 105,
        "base_attack": 28,
    },
    {
        "species_id": "sp_reticulated_python",
        "name": "Reticulated Python",
        "category": "Reptile",
        "hp": 140,
        "base_attack": 22,
    },
    {
        "species_id": "sp_saltwater_crocodile",
        "name": "Saltwater Crocodile",
        "category": "Reptile",
        "hp": 145,
        "base_attack": 24,
    },
]


def get_abilities_for_category(category: str) -> list[dict[str, Any]]:
    cat = (category or "").capitalize()
    return ABILITY_DEFINITIONS.get(cat, DEFAULT_ABILITIES)


def calculate_battle_stats(species_id: str, category: str) -> dict[str, Any]:
    """Deterministic battle stats for cards."""
    cat = (category or "").capitalize()
    val = sum(ord(c) for c in species_id) % 15
    if cat == "Mammal":
        base_hp = 120 + val
        base_atk = 24 + (val % 6)
    elif cat == "Reptile":
        base_hp = 140 + val
        base_atk = 22 + (val % 5)
    elif cat == "Bird":
        base_hp = 95 + val
        base_atk = 30 + (val % 7)
    elif cat == "Butterfly":
        base_hp = 75 + val
        base_atk = 34 + (val % 8)
    else:
        base_hp = 100 + val
        base_atk = 25 + (val % 5)

    abilities = get_abilities_for_category(cat)

    return {
        "hp": base_hp,
        "base_attack": base_atk,
        "category": cat,
        "ability_1": abilities[0]["name"],
        "ability_2": abilities[1]["name"],
        "ability_3": abilities[2]["name"],
        "abilities_details": abilities,
        "abilities_locked": True,
    }


def get_unlocked_abilities_for_child(child_id: int, species_id: str, connection) -> list[int]:
    """
    Queries child_quiz_progress for species_id and returns unlocked ability slot numbers.
    - Easy passed -> Slot 1 unlocked
    - Medium passed -> Slot 2 unlocked
    - Hard passed -> Slot 3 unlocked
    Returns list such as [1], [1, 2], [1, 2, 3], or [] if none passed.
    """
    row = connection.execute(
        text("""
            SELECT easy_passed, medium_passed, hard_passed
            FROM child_quiz_progress
            WHERE child_id = :child_id AND species_id = :species_id
        """),
        {"child_id": child_id, "species_id": species_id}
    ).mappings().first()

    if not row:
        return []

    unlocked: list[int] = []
    if row["easy_passed"]:
        unlocked.append(1)
    if row["medium_passed"]:
        unlocked.append(2)
    if row["hard_passed"]:
        unlocked.append(3)
    return unlocked


def generate_ai_opponent(player_species_id: str | None = None) -> dict[str, Any]:
    """
    Generates dynamic AI opponent from supported species with balanced HP, base attack, and bot abilities.
    Avoids picking the same species as player if alternatives are available.
    """
    pool = [sp for sp in SUPPORTED_BOT_SPECIES if sp["species_id"] != player_species_id]
    if not pool:
        pool = SUPPORTED_BOT_SPECIES

    template = random.choice(pool)
    abilities = get_abilities_for_category(template["category"])

    return {
        "species_id": template["species_id"],
        "name": template["name"],
        "category": template["category"],
        "hp": template["hp"],
        "max_hp": template["hp"],
        "base_attack": template["base_attack"],
        "abilities": abilities,
    }


def calculate_bot_turn(
    opponent_data: dict[str, Any],
    bot_current_hp: int,
    player_current_hp: int,
    round_num: int,
) -> dict[str, Any]:
    """
    Smart bot decision:
    - If bot HP is low (< 35% of max HP) and has a healing/shield ability, use it.
    - On key rounds (e.g. round 3, 5, 7), bot uses Ability 3 (Ultimate) or Ability 1.
    - On even rounds (round 2, 4), bot uses Ability 1 or 2.
    - Otherwise, standard attack with 85% accuracy.
    Returns:
        action_name: str
        damage: int
        healing: int
        log: str
    """
    bot_name = opponent_data.get("name", "Opponent")
    base_atk = opponent_data.get("base_attack", 22)
    max_hp = opponent_data.get("max_hp", bot_current_hp)
    abilities = opponent_data.get("abilities") or get_abilities_for_category(opponent_data.get("category", "Mammal"))

    bot_hp_ratio = (bot_current_hp / max_hp) if max_hp > 0 else 1.0

    # 1. Low HP triage: Use healing/recovery ability if available
    heal_ability = next((a for a in abilities if a.get("heal_amount", 0) > 0), None)
    if bot_hp_ratio <= 0.35 and heal_ability and random.random() < 0.75:
        dmg = int(base_atk * heal_ability.get("multiplier", 0.7))
        heal = int(heal_ability.get("heal_amount", 20))
        action_name = heal_ability["name"]
        log = f"{bot_name} used {action_name}! Recovered {heal} HP and dealt {dmg} damage."
        return {
            "action_name": action_name,
            "damage": dmg,
            "healing": heal,
            "log": log,
        }

    # 2. Ultimate on round 3 or later when player is vulnerable
    ultimate_ability = next((a for a in abilities if a.get("slot") == 3), None)
    if round_num >= 3 and (round_num % 3 == 0 or player_current_hp <= base_atk * 2) and ultimate_ability:
        dmg = int(base_atk * ultimate_ability.get("multiplier", 2.0))
        heal = int(ultimate_ability.get("heal_amount", 0))
        action_name = ultimate_ability["name"]
        heal_str = f" and recovered {heal} HP" if heal > 0 else ""
        log = f"{bot_name} unleashed {action_name}! Dealt {dmg} critical damage{heal_str}."
        return {
            "action_name": action_name,
            "damage": dmg,
            "healing": heal,
            "log": log,
        }

    # 3. Burst offensive ability on even rounds
    burst_ability = next((a for a in abilities if a.get("slot") == 1), None)
    if round_num % 2 == 0 and burst_ability and random.random() < 0.7:
        dmg = int(base_atk * burst_ability.get("multiplier", 1.5))
        heal = int(burst_ability.get("heal_amount", 0))
        action_name = burst_ability["name"]
        log = f"{bot_name} used {action_name} for {dmg} damage."
        return {
            "action_name": action_name,
            "damage": dmg,
            "healing": heal,
            "log": log,
        }

    # 4. Standard Basic Attack
    hit = random.random() < 0.85
    if hit:
        dmg = base_atk
        log = f"{bot_name} used Basic Attack for {dmg} damage."
    else:
        dmg = 0
        log = f"{bot_name}'s Basic Attack missed!"

    return {
        "action_name": "Basic Attack",
        "damage": dmg,
        "healing": 0,
        "log": log,
    }
