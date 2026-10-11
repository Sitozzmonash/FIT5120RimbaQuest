from __future__ import annotations

from tools.train_wildlife_ai import (
    EVALUATION_SCENARIOS,
    evaluation_assignment,
    evaluate,
    release_review_markdown,
)


def test_evaluation_covers_required_representative_states():
    report = evaluate({}, len(EVALUATION_SCENARIOS), seed=2027)

    assert set(report["profiles"]) == {"random", "simple"}
    for profile in report["profiles"].values():
        coverage = profile["coverage"]
        assert all(coverage[f"scenario:{item['name']}"] == 1 for item in EVALUATION_SCENARIOS)
        for side in ("player", "opponent"):
            assert coverage[f"{side}_hp:low"] > 0
            assert coverage[f"{side}_hp:full"] > 0
            assert coverage[f"{side}_energy:low"] > 0
            assert coverage[f"{side}_energy:high"] > 0
        assert coverage["initiative:player"] > 0
        assert coverage["initiative:opponent"] > 0
        assert coverage["advantage:player"] > 0
        assert coverage["advantage:opponent"] > 0
        assert coverage["advantage:none"] > 0


def test_release_review_records_metrics_coverage_and_decision():
    evaluation = evaluate({}, len(EVALUATION_SCENARIOS), seed=2027)
    markdown = release_review_markdown(
        {"completed_training_matches": 1500}, evaluation
    )

    assert "AI win rate" in markdown
    assert "ability usage" in markdown
    assert "low/full HP" in markdown
    assert "low/high Energy" in markdown
    assert "Persistent card/habitat outliers" in markdown
    assert evaluation["review"]["release_decision"] in markdown
    assert evaluation["review"]["status"] == "completed"
    assert evaluation["review"]["release_readiness"] in {"ready", "hold"}


def test_each_card_rotates_through_scenarios_across_repeats():
    species = [f"card-{index}" for index in range(152)]
    first = evaluation_assignment(species, 0)
    second = evaluation_assignment(species, 152)

    assert first[2] == second[2] == "card-0"
    assert first[0]["name"] != second[0]["name"]
    assert first[1] != first[2]
    assert second[1] != second[2]
