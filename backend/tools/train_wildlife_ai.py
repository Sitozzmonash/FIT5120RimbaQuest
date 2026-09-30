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
import sqlite3
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.services.battle_catalogue import get_catalogue  # noqa: E402
from app.services.wildlife_ai import POLICY_PATH, choose_for_side, state_action_key  # noqa: E402
from app.services.wildlife_battle import (  # noqa: E402
    HABITATS, legal_actions, new_match, perform_action,
)


def load_habitats() -> dict[str, str | None]:
    connection = sqlite3.connect(":memory:")
    try:
        connection.executescript((BACKEND / "data" / "seed.sql").read_text(encoding="utf-8"))
        return dict(connection.execute("SELECT id, habitat FROM species"))
    finally:
        connection.close()


def make_match(rng: random.Random, definitions: dict, habitats: dict):
    first, second = rng.sample(tuple(definitions), 2)
    habitat = rng.choice(HABITATS)
    unlocks = ([1], [1, 2], [1, 2, 3])
    return new_match(
        definitions[first], definitions[second], habitat=habitat,
        player_habitat=habitats.get(first), opponent_habitat=habitats.get(second),
        player_unlocked=list(rng.choice(unlocks)),
        opponent_unlocked=list(rng.choice(unlocks)), mode="bot",
        initiative=rng.choice(("player", "opponent")),
    )


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


def evaluate(policy: dict[str, float], games: int, seed: int) -> dict:
    rng = random.Random(seed)
    definitions = get_catalogue()
    habitats = load_habitats()
    profiles = ("random", "simple")
    profile_results: dict[str, dict] = {}
    for profile in profiles:
        wins = Counter()
        choices = Counter()
        lengths: list[int] = []
        habitat_wins = defaultdict(lambda: Counter())
        card_wins = defaultdict(lambda: Counter())
        for _ in range(games):
            state = make_match(rng, definitions, habitats)
            habitat = state["habitat"]
            card = state["opponent"]["species_id"]
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
                lengths.append(state["turn_count"])
        profile_results[profile] = {
            "ai_win_rate": round(wins["opponent"] / max(1, sum(wins.values())), 3),
            "player_win_rate": round(wins["player"] / max(1, sum(wins.values())), 3),
            "average_turns": round(sum(lengths) / max(1, len(lengths)), 2),
            "ai_actions": dict(choices),
            "by_habitat": {
                key: round(counts["opponent"] / max(1, sum(counts.values())), 3)
                for key, counts in habitat_wins.items()
            },
            "cards_with_5_or_more_games": {
                key: round(counts["opponent"] / sum(counts.values()), 3)
                for key, counts in card_wins.items() if sum(counts.values()) >= 5
            },
        }
    return profile_results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--episodes", type=int, default=1500)
    parser.add_argument("--eval-games", type=int, default=250)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--output", type=Path, default=POLICY_PATH)
    args = parser.parse_args()
    if args.episodes < 1 or args.eval_games < 1:
        parser.error("episodes and eval-games must be positive")
    policy, training_stats = train(args.episodes, args.seed)
    result = {
        "version": 1,
        "method": "offline Monte Carlo self-play; +1 win, -1 loss",
        "episodes": args.episodes,
        "seed": args.seed,
        "training": training_stats,
        "q_values": dict(sorted(policy.items())),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    evaluation = evaluate(policy, args.eval_games, args.seed + 1)
    print(json.dumps({"training": training_stats, "evaluation": evaluation}, indent=2))


if __name__ == "__main__":
    main()
