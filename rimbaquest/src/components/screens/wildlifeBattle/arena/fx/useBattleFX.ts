// Plays one attack effect at a time: drives the card motion, word pop, damage numbers and sounds.
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { useReduceMotion } from "../../shared/useLoop";
import { preloadBattleSounds, scheduleFXSounds } from "./BattleSFX";
import { scheduleHitHaptics } from "./battleHaptics";
import { FXSide, PlayOptions, Motion, ActiveFX } from "./fxTypes";
import { recipe } from "./fxRecipes";

const native = { useNativeDriver: true } as const;

export function useBattleFX() {
  const reduceMotion = useReduceMotion();

  const atk = useRef(new Animated.Value(0)).current; // attacker motion 0 → 1 → 0
  const tgt = useRef(new Animated.Value(0)).current; // target motion  -1 … 1
  const scr = useRef(new Animated.Value(0)).current; // screen shake   -1 … 1
  const word = useRef(new Animated.Value(0)).current;
  const dmg = useRef(new Animated.Value(0)).current;
  const gain = useRef(new Animated.Value(0)).current;
  const [state, setState] = useState<ActiveFX | null>(null);
  const cancelSounds = useRef<(() => void) | null>(null);
  const cancelHaptics = useRef<(() => void) | null>(null);

  // Load the hit sounds before the first move, and stop pending ones if the arena closes mid-effect.
  useEffect(() => {
    preloadBattleSounds();
    return () => {
      cancelSounds.current?.();
      cancelHaptics.current?.();
    };
  }, []);

  /** Plays one effect. Resolves when it finishes, so HP changes can land after the hit. */
  const play = useCallback(
    (opts: PlayOptions) =>
      new Promise<void>((resolve) => {
        const r = recipe(opts);
        const parts = r.particles.map((p) => ({
          ...p,
          v: new Animated.Value(0),
        }));
        const overs = r.overlays.map((o) => ({
          ...o,
          v: new Animated.Value(0),
        }));
        [atk, tgt, scr, word, dmg, gain].forEach((v) => v.setValue(0));
        setState({ ...opts, r, parts, overs });
        cancelSounds.current?.();
        cancelSounds.current = scheduleFXSounds(opts.type, r.impactAt);
        cancelHaptics.current?.();
        cancelHaptics.current =
          opts.hitsMe && opts.damage
            ? scheduleHitHaptics(
                r.impactAt,
                r.numberTicks ?? 1,
                Boolean(r.motion.screen),
              )
            : null;

        const pop = Animated.sequence([
          Animated.delay(r.word?.delay ?? 0),
          Animated.spring(word, {
            toValue: 1,
            friction: 4,
            tension: 170,
            ...native,
          }),
          Animated.delay(450),
          Animated.timing(word, { toValue: 0, duration: 200, ...native }),
        ]);
        const float = (v: Animated.Value, delay: number) =>
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(v, {
              toValue: 1,
              duration: 1000,
              easing: Easing.out(Easing.cubic),
              ...native,
            }),
            Animated.timing(v, { toValue: 0, duration: 0, ...native }),
          ]);
        const finish = () => {
          setState(null);
          resolve();
        };

        if (reduceMotion) {
          // No movement: just the impact word and the numbers.
          Animated.parallel([
            pop,
            opts.damage ? float(dmg, 0) : Animated.delay(0),
            opts.gain ? float(gain, 0) : Animated.delay(0),
          ]).start(finish);
          return;
        }

        const wiggle = (v: Animated.Value, steps: number[], each = 60) =>
          Animated.sequence(
            steps.map((toValue) =>
              Animated.timing(v, { toValue, duration: each, ...native }),
            ),
          );

        const attackerAnim =
          r.motion.attacker === "none"
            ? Animated.delay(0)
            : Animated.sequence([
                Animated.timing(atk, {
                  toValue: 1,
                  duration: r.motion.attacker === "dash" ? 220 : 170,
                  easing: Easing.out(Easing.quad),
                  ...native,
                }),
                Animated.delay(r.motion.attacker === "jump" ? 120 : 0),
                Animated.timing(atk, {
                  toValue: 0,
                  duration: 280,
                  easing: Easing.out(Easing.back(2)),
                  ...native,
                }),
              ]);
        const targetSteps: Record<Motion["target"], number[]> = {
          shake: [-1, 1, -0.7, 0.5, 0],
          quake: [1, -1, 0.8, -0.6, 0.3, 0],
          knockback: [1, 1, 0],
          dodge: [1, 1, 1, 0],
          none: [0],
        };
        const slow =
          r.motion.target === "knockback" || r.motion.target === "dodge";
        const targetAnim = Animated.sequence([
          Animated.delay(r.motion.target === "dodge" ? 120 : r.impactAt),
          wiggle(tgt, targetSteps[r.motion.target], slow ? 140 : 60),
        ]);
        const screenAnim = r.motion.screen
          ? Animated.sequence([
              Animated.delay(r.impactAt),
              wiggle(scr, [1, -1, 0.6, -0.4, 0], 50),
            ])
          : Animated.delay(0);

        const particleAnims = parts.map((p) =>
          Animated.sequence([
            Animated.delay(p.delay),
            Animated.timing(p.v, {
              toValue: 1,
              duration: p.duration,
              easing: p.easing ?? Easing.linear,
              ...native,
            }),
          ]),
        );
        
        const overlayAnims = overs.map((o) =>
          Animated.sequence([
            Animated.delay(o.delay),
            Animated.timing(o.v, {
              toValue: 1,
              duration: o.duration,
              easing: Easing.out(Easing.quad),
              ...native,
            }),
          ]),
        );
        const numbers = opts.damage
          ? Animated.sequence([
              Animated.delay(r.impactAt),
              Animated.stagger(
                350,
                Array.from({ length: r.numberTicks ?? 1 }, () => float(dmg, 0)),
              ),
            ])
          : Animated.delay(0);

        Animated.parallel([
          attackerAnim,
          targetAnim,
          screenAnim,
          pop,
          numbers,
          opts.gain ? float(gain, r.impactAt + 200) : Animated.delay(0),
          ...particleAnims,
          ...overlayAnims,
        ]).start(finish);
      }),
    [reduceMotion, atk, tgt, scr, word, dmg, gain],
  );

  /** Card motion for one side: attacker lunges / dashes / jumps, target shakes / quakes / gets knocked back. */
  const styleFor = (side: FXSide) => {
    if (!state) return null;
    const { from, to, r } = state;
    const len = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
    const ux = (to.x - from.x) / len;
    const uy = (to.y - from.y) / len;

    if (state.attacker === side) {
      const m = r.motion.attacker;
      if (m === "jump")
        return {
          transform: [
            {
              translateY: atk.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -34],
              }),
            },
          ],
        };
      const d = m === "dash" ? len * 0.55 : m === "lunge" ? 18 : 0;
      return {
        transform: [
          {
            translateX: atk.interpolate({
              inputRange: [0, 1],
              outputRange: [0, ux * d],
            }),
          },
          {
            translateY: atk.interpolate({
              inputRange: [0, 1],
              outputRange: [0, uy * d],
            }),
          },
        ],
      };
    }

    const t = r.motion.target;
    if (t === "quake")
      return {
        transform: [
          {
            translateY: tgt.interpolate({
              inputRange: [-1, 1],
              outputRange: [-6, 6],
            }),
          },
        ],
      };
    if (t === "knockback" || t === "dodge") {
      const k = t === "dodge" ? 34 : 22;
      return {
        transform: [
          {
            translateX: tgt.interpolate({
              inputRange: [0, 1],
              outputRange: [0, ux * k + (t === "dodge" ? uy * 20 : 0)],
            }),
          },
          {
            translateY: tgt.interpolate({
              inputRange: [0, 1],
              outputRange: [0, uy * k],
            }),
          },
          {
            rotate: tgt.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", t === "dodge" ? "-12deg" : "6deg"],
            }),
          },
        ],
      };
    }
    if (t === "shake")
      return {
        transform: [
          {
            translateX: tgt.interpolate({
              inputRange: [-1, 1],
              outputRange: [-7, 7],
            }),
          },
        ],
      };
    return null;
  };

  /** Optional: put on the whole stage container for screen shake on heavy hits. */
  const screenStyle = {
    transform: [
      {
        translateX: scr.interpolate({
          inputRange: [-1, 1],
          outputRange: [-5, 5],
        }),
      },
      {
        translateY: scr.interpolate({
          inputRange: [-1, 1],
          outputRange: [3, -3],
        }),
      },
    ],
  };

  return {
    play,
    state,
    reduceMotion,
    values: { word, dmg, gain },
    styleFor,
    screenStyle,
  };
}

export type FX = ReturnType<typeof useBattleFX>;
