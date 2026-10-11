# Wildlife AI pre-release review

Evaluation seed: 2027
Games per opponent profile: 1520
Completed training matches: 1500

## Results

- random: AI win rate 0.627; player win rate 0.373; average turns 7.10; ability usage 0.969.
- simple: AI win rate 0.509; player win rate 0.491; average turns 6.94; ability usage 0.971.

## Representative coverage

The retained JSON report records all eight controlled scenarios for each profile, covering low/full HP, low/high Energy for both sides, advantage/no-advantage states, one-to-three unlocked abilities, both initiatives, every Wildlife Card as the AI card, and random/simple opponents.

## Outlier and imbalance review

Persistent card/habitat outliers across both profiles: 0.
The random-action profile is a deliberately weak benchmark; its win rate is reviewed but is not used alone as the release balance gate.
No consistent card/habitat outlier was reproduced across both opponent profiles, and the simple-opponent result is within the parity review band.

Review status: completed.
Release readiness: ready.
