from typing import Any


def calculate_battle_stats(species_id: str, category: str) -> dict[str, Any]:
    """Deterministic battle stats for Iteration 1 cards."""
    cat = (category or "").capitalize()
    val = sum(ord(c) for c in species_id) % 15
    if cat == "Mammal":
        base_hp = 120 + val
        base_atk = 24 + (val % 6)
        abilities = ["Swift Pounce", "Wild Roar", "Guardian Guard"]
    elif cat == "Reptile":
        base_hp = 140 + val
        base_atk = 22 + (val % 5)
        abilities = ["Iron Scales", "Venom Strike", "Ambush Snap"]
    elif cat == "Bird":
        base_hp = 95 + val
        base_atk = 30 + (val % 7)
        abilities = ["Aerial Dive", "Sharp Talon", "Sonic Cry"]
    elif cat == "Butterfly":
        base_hp = 75 + val
        base_atk = 34 + (val % 8)
        abilities = ["Toxic Powder", "Dazzle Flutter", "Nectar Heal"]
    else:
        base_hp = 100 + val
        base_atk = 25 + (val % 5)
        abilities = ["Basic Tackle", "Defend", "Focus Strike"]

    return {
        "hp": base_hp,
        "base_attack": base_atk,
        "category": cat,
        "ability_1": abilities[0],
        "ability_2": abilities[1],
        "ability_3": abilities[2],
        "abilities_locked": True,
    }
