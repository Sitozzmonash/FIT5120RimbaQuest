// Sound effects for the battle animations in BattleFX. Each effect can have
// launch sounds (the move starting) and impact sounds (one picked at random per hit).
import { AudioPlayer, createAudioPlayer } from "expo-audio";
import type { FXType } from "./fxTypes";

const SOUNDS = {
  arrow: require("../../../../../../assets/battle/mixkit-arrow-shot-through-air-2771.wav"),
  boxingPunch: require("../../../../../../assets/battle/mixkit-boxing-punch-2051.wav"),
  cartoonBlow: require("../../../../../../assets/battle/mixkit-cartoon-blow-impact-2654.wav"),
  cartoonPunch: require("../../../../../../assets/battle/mixkit-cartoon-punch-2149.wav"),
  gravel: require("../../../../../../assets/battle/mixkit-falling-hit-on-gravel-756.wav"),
  fastBlow: require("../../../../../../assets/battle/mixkit-fast-blow-2144.wav"),
  golf: require("../../../../../../assets/battle/mixkit-hitting-golf-ball-2080.wav"),
  blow: require("../../../../../../assets/battle/mixkit-impact-of-a-blow-2150.wav"),
  meat: require("../../../../../../assets/battle/mixkit-meat-hit-sound-2159.wav"),
  metal: require("../../../../../../assets/battle/mixkit-metal-arrow-fast-hit-2770.wav"),
  quickWhoosh: require("../../../../../../assets/battle/mixkit-quick-hit-through-air-2142.mp3"),
  slide: require("../../../../../../assets/battle/mixkit-slide-hit-1529.wav"),
  ball: require("../../../../../../assets/battle/mixkit-sports-ball-hit-2082.wav"),
  sword: require("../../../../../../assets/battle/mixkit-swift-sword-strike-2166.wav"),
  flesh: require("../../../../../../assets/battle/mixkit-sword-cutting-flesh-2788.wav"),
  water: require("../../../../../../assets/battle/mixkit-water-hit-3216.wav"),
  defeat: require("../../../../../../assets/battle/mixkit-funny-fail-low-tone-2876.wav"),
} as const;

type SoundKey = keyof typeof SOUNDS;

type FXSound = {
  launch?: Array<{ sound: SoundKey; at: number }>;
  impacts?: SoundKey[];
  hits?: number[];
  volume?: number;
};

// Timings follow the BattleFX recipes (projectile delays, barrage / rain / claw spacing).
export const FX_SOUNDS: Record<FXType, FXSound> = {
  bite: { impacts: ["meat", "blow"] },
  missile: {
    launch: [{ sound: "arrow", at: 120 }],
    impacts: ["ball", "cartoonBlow"],
  },
  punch: { impacts: ["boxingPunch", "cartoonPunch", "fastBlow"] },
  barrage: {
    launch: [0, 1, 2].map((i) => ({
      sound: "arrow" as const,
      at: 100 + i * 180,
    })),
    impacts: ["golf", "ball"],
    hits: [0, 180, 360],
  },
  rain: {
    launch: [{ sound: "arrow", at: 0 }],
    impacts: ["gravel", "blow"],
    hits: [0, 120, 240],
  },
  slash: { impacts: ["sword", "quickWhoosh"] },
  claw: { impacts: ["flesh", "sword"], hits: [0, 90, 180] },
  stomp: { impacts: ["gravel", "blow"] },
  roar: { impacts: ["cartoonBlow"] },
  zap: { impacts: ["metal"] },
  splash: { impacts: ["water"] },
  leafStorm: {
    launch: [{ sound: "quickWhoosh", at: 0 }],
    impacts: ["slide", "blow"],
  },
  charge: {
    launch: [{ sound: "quickWhoosh", at: 40 }],
    impacts: ["blow", "cartoonBlow"],
  },
  poison: { impacts: ["meat"] },
  critical: { impacts: ["cartoonBlow", "boxingPunch"] },
  dodge: { launch: [{ sound: "quickWhoosh", at: 100 }] },
  heal: {},
  shieldUp: {},
};

// Two players per sound so quick repeats (barrage arrows) overlap instead of cutting off.
const PLAYERS_PER_SOUND = 2;
const pools: Partial<
  Record<SoundKey, { players: AudioPlayer[]; next: number }>
> = {};

function pool(key: SoundKey) {
  let entry = pools[key];
  if (!entry) {
    entry = {
      players: Array.from({ length: PLAYERS_PER_SOUND }, () =>
        createAudioPlayer(SOUNDS[key]),
      ),
      next: 0,
    };
    pools[key] = entry;
  }
  return entry;
}

function playSound(key: SoundKey, volume = 1) {
  try {
    const entry = pool(key);
    const player = entry.players[entry.next];
    entry.next = (entry.next + 1) % entry.players.length;
    player.volume = volume;
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Sound effects are optional; the battle works silently if audio is unavailable.
  }
}

const pick = (keys: SoundKey[]) =>
  keys[Math.floor(Math.random() * keys.length)];

/** Loads every battle sound up front so the first hit isn't delayed. */
export function preloadBattleSounds() {
  try {
    (Object.keys(SOUNDS) as SoundKey[]).forEach(pool);
  } catch {
    // ignore
  }
}

/**
 * Schedules an effect's sounds. `impactAt` is the recipe's hit time in ms.
 * Returns a cancel function for when the arena unmounts mid-effect.
 */
export function scheduleFXSounds(type: FXType, impactAt: number): () => void {
  const config = FX_SOUNDS[type];
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, run: () => void) =>
    timers.push(setTimeout(run, Math.max(0, ms)));

  config.launch?.forEach(({ sound, at: ms }) =>
    at(ms, () => playSound(sound, config.volume)),
  );
  if (config.impacts?.length) {
    const impacts = config.impacts;
    (config.hits ?? [0]).forEach((offset) =>
      at(impactAt + offset, () => playSound(pick(impacts), config.volume)),
    );
  }
  return () => timers.forEach(clearTimeout);
}

/** The "wah-wah" when the explorer loses a battle. */
export function playDefeatSound() {
  playSound("defeat");
}
