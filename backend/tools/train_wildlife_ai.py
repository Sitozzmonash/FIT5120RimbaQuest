"""Train and evaluate the standard Wildlife Battle policy offline.

Examples:
    python tools/train_wildlife_ai.py --episodes 1500 --seed 2026

Only simulated win/loss rewards (+1/-1) update policy values. No database,
account, or leaderboard points are read or changed.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import random
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.services.battle_catalogue import get_catalogue  # noqa: E402
from app.services.wildlife_ai import POLICY_PATH, choose_for_side, state_action_key  # noqa: E402
from app.services.wildlife_battle import (  # noqa: E402
    HABITATS, legal_actions, new_match, perform_action, species_habitat_groups,
)


EVALUATION_SCENARIOS = (
    {"name": "full_hp_high_energy_ai_advantage", "player_hp": 1.0, "opponent_hp": 1.0,
     "player_energy": 7, "opponent_energy": 7, "player_unlocked": [1, 2, 3],
     "opponent_unlocked": [1, 2, 3], "initiative": "opponent", "advantage": "opponent"},
    {"name": "full_hp_low_ai_energy_no_advantage", "player_hp": 1.0, "opponent_hp": 1.0,
     "player_energy": 7, "opponent_energy": 1, "player_unlocked": [1, 2, 3],
     "opponent_unlocked": [1], "initiative": "player", "advantage": "none"},
    {"name": "low_ai_hp_high_energy_player_advantage", "player_hp": 1.0, "opponent_hp": 0.25,
     "player_energy": 2, "opponent_energy": 7, "player_unlocked": [1, 2],
     "opponent_unlocked": [1, 2, 3], "initiative": "opponent", "advantage": "player"},
    {"name": "low_child_hp_high_threat", "player_hp": 0.25, "opponent_hp": 1.0,
     "player_energy": 7, "opponent_energy": 4, "player_unlocked": [1, 2, 3],
     "opponent_unlocked": [1, 2], "initiative": "player", "advantage": "none"},
    {"name": "both_low_hp_low_child_energy", "player_hp": 0.30, "opponent_hp": 0.30,
     "player_energy": 1, "opponent_energy": 7, "player_unlocked": [1],
     "opponent_unlocked": [1, 2, 3], "initiative": "opponent", "advantage": "opponent"},
    {"name": "both_full_hp_locked_abilities", "player_hp": 1.0, "opponent_hp": 1.0,
     "player_energy": 2, "opponent_energy": 2, "player_unlocked": [1],
     "opponent_unlocked": [1], "initiative": "player", "advantage": "player"},
    {"name": "low_ai_hp_low_energy_defence", "player_hp": 0.65, "opponent_hp": 0.25,
     "player_energy": 7, "opponent_energy": 1, "player_unlocked": [1, 2, 3],
     "opponent_unlocked": [1, 2], "initiative": "opponent", "advantage": "none"},
    {"name": "low_child_hp_low_energy_recovery", "player_hp": 0.25, "opponent_hp": 0.65,
     "player_energy": 1, "opponent_energy": 7, "player_unlocked": [1, 2],
     "opponent_unlocked": [1, 2, 3], "initiative": "player", "advantage": "opponent"},
)

MIN_CARD_SAMPLES = 10
OUTLIER_LOW = 0.20
OUTLIER_HIGH = 0.80


def load_habitats() -> dict[str, str | None]:
    return species_habitat_groups()


def make_match(rng: random.Random, definitions: dict, habitats: dict,
               *, scenario: dict | None = None,
               player_id: str | None = None, opponent_id: str | None = None):
    if player_id is None or opponent_id is None:
        player_id, opponent_id = rng.sample(tuple(definitions), 2)
    if player_id == opponent_id:
        raise ValueError("Evaluation cards must be different")

    unlocks = ([1], [1, 2], [1, 2, 3])
    if scenario is None:
        habitat = rng.choice(HABITATS)
        player_unlocked = list(rng.choice(unlocks))
        opponent_unlocked = list(rng.choice(unlocks))
        initiative = rng.choice(("player", "opponent"))
    else:
        advantage = scenario["advantage"]
        if advantage == "player":
            habitat = habitats[player_id]
            if habitat == habitats[opponent_id]:
                habitat = next(item for item in HABITATS if item != habitats[opponent_id])
        elif advantage == "opponent":
            habitat = habitats[opponent_id]
            if habitat == habitats[player_id]:
                habitat = next(item for item in HABITATS if item != habitats[player_id])
        else:
            habitat = next(
                item for item in HABITATS
                if item not in {habitats[player_id], habitats[opponent_id]}
            )
        player_unlocked = list(scenario["player_unlocked"])
        opponent_unlocked = list(scenario["opponent_unlocked"])
        initiative = scenario["initiative"]

    state = new_match(
        definitions[player_id], definitions[opponent_id], habitat=habitat,
        player_habitat=habitats.get(player_id), opponent_habitat=habitats.get(opponent_id),
        player_unlocked=player_unlocked, opponent_unlocked=opponent_unlocked,
        mode="bot", initiative=initiative,
    )
    if scenario is not None:
        for side in ("player", "opponent"):
            combatant = state[side]
            combatant["hp"] = max(1, round(combatant["max_hp"] * scenario[f"{side}_hp"]))
            combatant["energy"] = min(combatant["max_energy"], scenario[f"{side}_energy"])
        state["evaluation_scenario"] = scenario["name"]
    return state


def train(episodes: int, seed: int) -> tuple[dict[str, float], dict]:
    rng = random.Random(seed)
    definitions = get_catalogue()
    habitats = load_habitats()
    policy: dict[str, float] = {}
    visits: Counter[str] = Counter()
    lengths: list[int] = []
    for _ in range(episodes):
        state = make_match(rng, definitions, habitats)
        trajectory: list[tuple[str, str]] = []
        for _turn in range(160):
            side = state["turn"]
            action = choose_for_side(state, side, rng=rng, policy=policy, exploration=0.22)
            trajectory.append((side, state_action_key(state, side, action)))
            state, _ = perform_action(state, side, action)
            # Only the current position is needed for simulated training.
            state["events"] = []
            if state["status"] == "completed":
                break
        if state["winner"] is None:
            continue
        lengths.append(state["turn_count"])
        for side, key in trajectory:
            reward = 1.0 if side == state["winner"] else -1.0
            visits[key] += 1
            alpha = 0.14 / (1 + visits[key] / 50)
            policy[key] = round(policy.get(key, 0.0) + alpha * (reward - policy.get(key, 0.0)), 4)
    return policy, {
        "completed_training_matches": len(lengths),
        "average_training_turns": round(sum(lengths) / len(lengths), 2) if lengths else 0,
        "learned_state_actions": len(policy),
    }


def evaluation_assignment(species_ids: list[str], game_index: int) -> tuple[dict, str, str]:
    """Return a deterministic scenario and distinct card pairing for one game."""
    card_index = game_index % len(species_ids)
    repeat_index = game_index // len(species_ids)
    # Rotate every card through the controlled scenarios across repeats. The
    # catalogue currently has 152 cards (a multiple of eight), so using only
    # game_index % 8 would otherwise pin each card to one scenario.
    scenario = EVALUATION_SCENARIOS[
        (card_index + repeat_index) % len(EVALUATION_SCENARIOS)
    ]
    opponent_id = species_ids[card_index]
    player_id = species_ids[
        (card_index + 1 + repeat_index * 37) % len(species_ids)
    ]
    if player_id == opponent_id:
        player_id = species_ids[(card_index + 1) % len(species_ids)]
    return scenario, player_id, opponent_id


def evaluate(policy: dict[str, float], games: int, seed: int) -> dict:
    rng = random.Random(seed)
    definitions = get_catalogue()
    habitats = load_habitats()
    species_ids = sorted(definitions)
    profiles = ("random", "simple")
    profile_results: dict[str, dict] = {}
    for profile in profiles:
        wins = Counter()
        choices = Counter()
        lengths: list[int] = []
        habitat_wins = defaultdict(lambda: Counter())
        card_wins = defaultdict(lambda: Counter())
        scenario_wins = defaultdict(lambda: Counter())
        coverage = Counter()
        for game_index in range(games):
            scenario, player_id, opponent_id = evaluation_assignment(species_ids, game_index)
            state = make_match(
                rng, definitions, habitats, scenario=scenario,
                player_id=player_id, opponent_id=opponent_id,
            )
            habitat = state["habitat"]
            card = state["opponent"]["species_id"]
            coverage.update({
                f"scenario:{scenario['name']}": 1,
                f"initiative:{scenario['initiative']}": 1,
                f"advantage:{scenario['advantage']}": 1,
                f"player_hp:{'low' if scenario['player_hp'] < 0.5 else 'full'}": 1,
                f"opponent_hp:{'low' if scenario['opponent_hp'] < 0.5 else 'full'}": 1,
                f"player_energy:{'low' if scenario['player_energy'] < 4 else 'high'}": 1,
                f"opponent_energy:{'low' if scenario['opponent_energy'] < 4 else 'high'}": 1,
                f"player_unlocks:{len(scenario['player_unlocked'])}": 1,
                f"opponent_unlocks:{len(scenario['opponent_unlocked'])}": 1,
            })
            for _turn in range(160):
                side = state["turn"]
                if side == "opponent":
                    action = choose_for_side(state, side, rng=rng, policy=policy)
                    choices[action] += 1
                elif profile == "random":
                    action = rng.choice(legal_actions(state, side))
                else:
                    action = choose_for_side(state, side, rng=rng, policy={}, exploration=0.1)
                state, _ = perform_action(state, side, action)
                state["events"] = []
                if state["status"] == "completed":
                    break
            if state["winner"]:
                wins[state["winner"]] += 1
                habitat_wins[habitat][state["winner"]] += 1
                card_wins[card][state["winner"]] += 1
                scenario_wins[scenario["name"]][state["winner"]] += 1
                lengths.append(state["turn_count"])

        def rates(source: dict[str, Counter], minimum: int = 1) -> dict[str, dict]:
            return {
                key: {
                    "games": sum(counts.values()),
                    "ai_win_rate": round(counts["opponent"] / sum(counts.values()), 3),
                }
                for key, counts in sorted(source.items()) if sum(counts.values()) >= minimum
            }

        total_actions = sum(choices.values())
        action_frequency = {
            key: {"count": count, "rate": round(count / max(1, total_actions), 3)}
            for key, count in sorted(choices.items())
        }
        habitats_report = rates(habitat_wins)
        cards_report = rates(card_wins, MIN_CARD_SAMPLES)
        scenarios_report = rates(scenario_wins)
        outliers = []
        for dimension, values in (("habitat", habitats_report), ("card", cards_report)):
            for key, metrics in values.items():
                rate = metrics["ai_win_rate"]
                if rate <= OUTLIER_LOW or rate >= OUTLIER_HIGH:
                    outliers.append({
                        "dimension": dimension,
                        "name": key,
                        "games": metrics["games"],
                        "ai_win_rate": rate,
                        "direction": "low" if rate <= OUTLIER_LOW else "high",
                    })
        if action_frequency:
            action, metrics = max(action_frequency.items(), key=lambda item: item[1]["rate"])
            if metrics["rate"] >= 0.75:
                outliers.append({
                    "dimension": "action_concentration", "name": action,
                    "games": metrics["count"], "ai_win_rate": None,
                    "direction": "high", "rate": metrics["rate"],
                })
        profile_results[profile] = {
            "games_completed": sum(wins.values()),
            "ai_win_rate": round(wins["opponent"] / max(1, sum(wins.values())), 3),
            "player_win_rate": round(wins["player"] / max(1, sum(wins.values())), 3),
            "average_turns": round(sum(lengths) / max(1, len(lengths)), 2),
            "action_frequency": action_frequency,
            "ability_usage_rate": round(
                sum(count for action, count in choices.items() if action.startswith("ability_"))
                / max(1, total_actions), 3,
            ),
            "by_habitat": habitats_report,
            "by_card": cards_report,
            "by_scenario": scenarios_report,
            "coverage": dict(sorted(coverage.items())),
            "outliers": outliers,
        }

    def persistent_outliers(dimension: str) -> list[dict]:
        indexed = []
        for profile, report in profile_results.items():
            indexed.append({
                (item["name"], item["direction"]): item
                for item in report["outliers"] if item["dimension"] == dimension
            })
        shared = set(indexed[0]) & set(indexed[1])
        return [
            {
                "dimension": dimension,
                "name": name,
                "direction": direction,
                "profiles": {
                    profile: next(
                        item for item in profile_results[profile]["outliers"]
                        if item["dimension"] == dimension
                        and item["name"] == name and item["direction"] == direction
                    )
                    for profile in profiles
                },
            }
            for name, direction in sorted(shared)
        ]

    persistent = persistent_outliers("card") + persistent_outliers("habitat")
    simple_rate = profile_results["simple"]["ai_win_rate"]
    review_required = bool(persistent) or not 0.35 <= simple_rate <= 0.65
    return {
        "seed": seed,
        "games_per_profile": games,
        "minimum_card_samples": MIN_CARD_SAMPLES,
        "outlier_thresholds": {"low": OUTLIER_LOW, "high": OUTLIER_HIGH},
        "profiles": profile_results,
        "review": {
            "status": "completed",
            "release_readiness": "hold" if review_required else "ready",
            "corrective_action_required": review_required,
            "persistent_outliers": persistent,
            "simple_opponent_parity_band": [0.35, 0.65],
            "simple_opponent_ai_win_rate": simple_rate,
            "random_opponent_interpretation": (
                "The random-action profile is a deliberately weak benchmark; its win rate is reviewed "
                "but is not used alone as the release balance gate."
            ),
            "release_decision": (
                "Hold for policy or battle-balance correction and re-evaluation."
                if review_required else
                "No consistent card/habitat outlier was reproduced across both opponent profiles, "
                "and the simple-opponent result is within the parity review band."
            ),
        },
    }


def release_review_markdown(training_stats: dict, evaluation: dict) -> str:
    profiles = evaluation["profiles"]
    review = evaluation["review"]
    lines = [
        "# Wildlife AI pre-release review",
        "",
        f"Evaluation seed: {evaluation['seed']}",
        f"Games per opponent profile: {evaluation['games_per_profile']}",
        f"Completed training matches: {training_stats['completed_training_matches']}",
        "",
        "## Results",
        "",
    ]
    for profile in ("random", "simple"):
        result = profiles[profile]
        lines.append(
            f"- {profile}: AI win rate {result['ai_win_rate']:.3f}; "
            f"player win rate {result['player_win_rate']:.3f}; "
            f"average turns {result['average_turns']:.2f}; "
            f"ability usage {result['ability_usage_rate']:.3f}."
        )
    lines.extend([
        "",
        "## Representative coverage",
        "",
        "The retained JSON report records all eight controlled scenarios for each profile, covering "
        "low/full HP, low/high Energy for both sides, advantage/no-advantage states, one-to-three "
        "unlocked abilities, both initiatives, every Wildlife Card as the AI card, and random/simple opponents.",
        "",
        "## Outlier and imbalance review",
        "",
        f"Persistent card/habitat outliers across both profiles: {len(review['persistent_outliers'])}.",
        review["random_opponent_interpretation"],
        review["release_decision"],
        "",
        f"Review status: {review['status']}.",
        f"Release readiness: {review['release_readiness']}.",
        "",
    ])
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--episodes", type=int, default=1500)
    parser.add_argument("--eval-games", type=int, default=1520)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--output", type=Path, default=POLICY_PATH)
    parser.add_argument("--evaluation-output", type=Path,
                        default=BACKEND / "data" / "wildlife_ai_evaluation.json")
    parser.add_argument("--review-output", type=Path,
                        default=BACKEND / "reports" / "wildlife_ai_release_review.md")
    args = parser.parse_args()
    if args.episodes < 1 or args.eval_games < 1:
        parser.error("episodes and eval-games must be positive")
    policy, training_stats = train(args.episodes, args.seed)
    result = {
        "version": 2,
        "method": "offline Monte Carlo self-play; +1 win, -1 loss",
        "state_features": [
            "own_hp", "opponent_hp", "own_energy", "opponent_energy",
            "habitat_advantage", "own_unlocked_abilities",
            "opponent_unlocked_abilities", "action",
        ],
        "episodes": args.episodes,
        "seed": args.seed,
        "training": training_stats,
        "q_values": dict(sorted(policy.items())),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    evaluation = evaluate(policy, args.eval_games, args.seed + 1)
    evaluation_report = {"training": training_stats, "evaluation": evaluation}
    args.evaluation_output.parent.mkdir(parents=True, exist_ok=True)
    args.evaluation_output.write_text(
        json.dumps(evaluation_report, indent=2) + "\n", encoding="utf-8"
    )
    args.review_output.parent.mkdir(parents=True, exist_ok=True)
    args.review_output.write_text(
        release_review_markdown(training_stats, evaluation), encoding="utf-8"
    )
    summary = {
        "training": training_stats,
        "evaluation": {
            "games_per_profile": evaluation["games_per_profile"],
            "profile_results": {
                profile: {
                    key: evaluation["profiles"][profile][key]
                    for key in ("games_completed", "ai_win_rate", "player_win_rate",
                                "average_turns", "ability_usage_rate")
                }
                for profile in ("random", "simple")
            },
            "review": evaluation["review"],
        },
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
