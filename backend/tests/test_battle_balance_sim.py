"""Reproducible balance simulation test suite for RimbaQuest battle engine.

Verifies role-wide balance contracts and safe broad gates using production rules
and matchmaking:
- Safe broad gates: overall role/tier mean 0.40-0.60
- Round progression: mean round 6-10 and p95 <= 12 for pilot/representative fixture
- Both initiatives ('player' and 'opponent') evaluated
- All 4 tiers (tier 0: [], tier 1: [1], tier 2: [1, 2], tier 3: [1, 2, 3])
- Matching returns actual opponent slots without client-faked state
- Actionable outlier reporting on test failures
"""

from __future__ import annotations

import collections
import random
from typing import Any

import pytest

from app.services.battle_catalogue import get_catalogue
from app.services.battle_matching import choose_opponent, compute_effective_rating
from app.services.battle_rules import choose_ai_action, new_battle, play_action, roll_player

PILOT_SPECIES_IDS = [
    "sp_asian_elephant",
    "sp_malayan_tiger",
    "sp_oriental_pied_hornbill",
    "sp_reticulated_python",
    "sp_asian_small_clawed_otter",
    "sp_common_mormon",
    "sp_wild_boar",
]


def run_matched_duel(
    player_def: dict[str, Any],
    opponent_def: dict[str, Any],
    player_slots: list[int],
    opponent_slots: list[int],
    initiative: str,
    seed: int,
) -> tuple[str, int]:
    """Execute a single deterministic duel using production rules without event snapshots."""
    rng = random.Random(seed)
    state, _ = new_battle(
        player_def,
        opponent_def,
        unlocked_slots=player_slots,
        battle_id="sim",
        rng=rng,
        opponent_unlocked_slots=opponent_slots,
        initiative=initiative,
        record_events=False,
    )
    while state["outcome"] is None:
        state, _ = roll_player(state, rng=rng, record_events=False)
        action = choose_ai_action(state, state["current_roll"], lucky=state["lucky"], side="player")
        state, _ = play_action(state, action, rng=rng, record_events=False)

    return str(state["outcome"]), int(state["round"])


def simulate_pilot_suite(
    seeds_per_pilot: int = 12,
    base_seed: int = 42,
) -> dict[str, Any]:
    """Run full pilot fixture simulation across all 4 tiers and both initiatives."""
    catalogue = get_catalogue()
    active_ids = set(catalogue.keys())

    all_rounds: list[int] = []
    tier_stats: dict[int, dict[str, Any]] = {}
    role_wins: dict[str, float] = collections.defaultdict(float)
    role_games: dict[str, int] = collections.defaultdict(int)
    species_wins: dict[str, float] = collections.defaultdict(float)
    species_games: dict[str, int] = collections.defaultdict(int)
    outliers: list[str] = []

    for tier in [0, 1, 2, 3]:
        player_slots = list(range(1, tier + 1))
        t_wins = 0.0
        t_games = 0
        t_rounds: list[int] = []
        t_species_wins: dict[str, float] = collections.defaultdict(float)
        t_species_games: dict[str, int] = collections.defaultdict(int)

        for p_id in PILOT_SPECIES_IDS:
            p_def = catalogue[p_id]
            p_role = p_def["role"]

            for s_idx in range(seeds_per_pilot):
                seed_match = base_seed + tier * 1000 + s_idx * 19
                match_rng = random.Random(seed_match)
                opp_def, opp_slots, match_info = choose_opponent(
                    catalogue,
                    active_ids,
                    p_def,
                    player_slots,
                    difficulty="standard",
                    rng=match_rng,
                )

                for initiative in ["player", "opponent"]:
                    # Game 1: p as player
                    seed_game1 = seed_match * 10 + (1 if initiative == "player" else 2)
                    res1, rnd1 = run_matched_duel(
                        p_def, opp_def, player_slots, opp_slots, initiative, seed_game1
                    )
                    all_rounds.append(rnd1)
                    t_rounds.append(rnd1)

                    # Game 2: opp as player, p as opponent (side-swapped)
                    seed_game2 = seed_game1 + 777
                    res2, rnd2 = run_matched_duel(
                        opp_def, p_def, opp_slots, player_slots, initiative, seed_game2
                    )
                    all_rounds.append(rnd2)
                    t_rounds.append(rnd2)

                    # Symmetric scoring for species p:
                    # p won game 1
                    w1 = 1.0 if res1 == "win" else (0.5 if res1 == "draw" else 0.0)
                    # p won game 2 (opp lost)
                    w2 = 1.0 if res2 == "lose" else (0.5 if res2 == "draw" else 0.0)
                    pair_rate = (w1 + w2) / 2.0

                    species_wins[p_id] += pair_rate
                    species_games[p_id] += 1
                    t_species_wins[p_id] += pair_rate
                    t_species_games[p_id] += 1

                    role_wins[p_role] += pair_rate
                    role_games[p_role] += 1

                    t_wins += pair_rate
                    t_games += 1

        t_mean_win = t_wins / t_games if t_games > 0 else 0.0
        t_mean_rnd = sum(t_rounds) / len(t_rounds) if t_rounds else 0.0
        t_p95_rnd = sorted(t_rounds)[int(len(t_rounds) * 0.95)] if t_rounds else 0

        t_rates = {p: t_species_wins[p] / t_species_games[p] for p in PILOT_SPECIES_IDS}
        tier_stats[tier] = {
            "mean_win": t_mean_win,
            "mean_rnd": t_mean_rnd,
            "p95_rnd": t_p95_rnd,
            "species_rates": t_rates,
        }

        # Check for actionable tier outliers
        if not (0.40 <= t_mean_win <= 0.65):
            outliers.append(f"Tier {tier} mean winrate {t_mean_win:.3f} outside [0.40, 0.65]")

    # Overall metrics
    overall_tier_mean = sum(ts["mean_win"] for ts in tier_stats.values()) / len(tier_stats)
    overall_mean_rnd = sum(all_rounds) / len(all_rounds) if all_rounds else 0.0
    overall_p95_rnd = sorted(all_rounds)[int(len(all_rounds) * 0.95)] if all_rounds else 0

    role_overall_means = {
        role: role_wins[role] / role_games[role] for role in sorted(role_wins.keys())
    }

    # Outlier detection for roles
    for role, rate in role_overall_means.items():
        if not (0.40 <= rate <= 0.60):
            outliers.append(f"Role '{role}' overall winrate {rate:.3f} outside [0.40, 0.60]")

    if not (6.0 <= overall_mean_rnd <= 10.0):
        outliers.append(f"Overall mean round {overall_mean_rnd:.2f} outside [6.0, 10.0]")

    if overall_p95_rnd > 12:
        outliers.append(f"Overall p95 round {overall_p95_rnd} exceeds 12")

    return {
        "overall_tier_mean": overall_tier_mean,
        "overall_mean_rnd": overall_mean_rnd,
        "overall_p95_rnd": overall_p95_rnd,
        "tier_stats": tier_stats,
        "role_means": role_overall_means,
        "species_means": {
            p: species_wins[p] / species_games[p] for p in PILOT_SPECIES_IDS
        },
        "total_duels": len(all_rounds),
        "outliers": outliers,
    }


def test_balance_simulator_safe_broad_gates():
    """Verify broad safe gates for pilot fixture across all tiers."""
    results = simulate_pilot_suite(seeds_per_pilot=14, base_seed=101)

    # Actionable report on any outlier failure
    report = (
        f"\n--- Balance Simulation Report ---\n"
        f"Overall Tier Mean: {results['overall_tier_mean']:.3f}\n"
        f"Mean Round: {results['overall_mean_rnd']:.2f}, p95: {results['overall_p95_rnd']}\n"
        f"Role Means: {results['role_means']}\n"
        f"Tier Stats: {[(t, s['mean_win'], round(s['mean_rnd'], 1), s['p95_rnd']) for t, s in results['tier_stats'].items()]}\n"
        f"Outliers: {results['outliers']}\n"
    )

    # Broad safe gates:
    # 1. Overall tier mean winrate 0.40 - 0.60
    assert 0.40 <= results["overall_tier_mean"] <= 0.60, f"Overall tier mean failed gate:{report}"

    # 2. Each role overall mean winrate 0.40 - 0.60
    for role, rate in results["role_means"].items():
        assert 0.40 <= rate <= 0.60, f"Role '{role}' rate {rate:.3f} failed gate:{report}"

    # 3. Round progression safe gates: mean round 6-10 and p95 <= 12
    assert 6.0 <= results["overall_mean_rnd"] <= 10.0, f"Mean rounds failed gate:{report}"
    assert results["overall_p95_rnd"] <= 12, f"p95 rounds failed gate:{report}"


def test_simulation_matching_actual_opponent_slots():
    """Verify simulation uses matching with actual returned opponent slots without client faking."""
    catalogue = get_catalogue()
    active_ids = set(catalogue.keys())
    player_def = catalogue["sp_malayan_tiger"]

    for slots in [[], [1], [1, 2], [1, 2, 3]]:
        opp_def, opp_slots, info = choose_opponent(
            catalogue,
            active_ids,
            player_def,
            slots,
            difficulty="standard",
            rng=random.Random(123),
        )
        assert opp_slots == sorted(list(set(slots).intersection({1, 2, 3})))
        assert info["opponent_slots"] == opp_slots
        assert "ratio" in info
        assert "selected_id" in info
        assert info["selected_id"] == opp_def["species_id"]

        # Run duel with exact returned opponent slots
        outcome, rounds = run_matched_duel(
            player_def,
            opp_def,
            player_slots=slots,
            opponent_slots=opp_slots,
            initiative="player",
            seed=456,
        )
        assert outcome in ("win", "lose", "draw")
        assert 1 <= rounds <= 30


def test_deterministic_seeds_reproducibility():
    """Ensure that identical seeds yield identical match outcomes and round counts."""
    catalogue = get_catalogue()
    p_def = catalogue["sp_malayan_tiger"]
    opp_def = catalogue["sp_asian_elephant"]

    res1, rnd1 = run_matched_duel(p_def, opp_def, [1, 2], [1, 2], "player", 9999)
    res2, rnd2 = run_matched_duel(p_def, opp_def, [1, 2], [1, 2], "player", 9999)

    assert res1 == res2
    assert rnd1 == rnd2
