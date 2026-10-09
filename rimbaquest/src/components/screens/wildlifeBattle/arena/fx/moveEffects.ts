import type {
  WildlifeAction,
  WildlifeCombatant,
  WildlifeEvent,
} from "../../../../../types/wildlifeMatch";
import type { PlayOptions } from "./fxTypes";

export type MoveEffect = Pick<PlayOptions, "type" | "glyph">;

// Checked in order, so specific words win over general ones like "forest".
const NAME_RULES: Array<[RegExp, (category: string) => MoveEffect]> = [
  [/\b(bite|fang|jaw|chomp|gnaw|snap|toothed)\b/, () => ({ type: "bite" })],
  [/\b(sting|venom|poison|toxic|spit)\b/, () => ({ type: "poison" })],
  [/\b(zap|shock|thunder|flash|spark)\b/, () => ({ type: "zap" })],
  [
    /\b(splash|river|water|mud|reed|hose|tide|wave|swim|paddle|ocean|sea|stream)\b/,
    () => ({ type: "splash" }),
  ],
  [/\b(dive|swoop|plunge)\b/, () => ({ type: "rain", glyph: "🪶" })],
  [/\b(stomp|hooves|trunk|quake|trample|slam)\b/, () => ({ type: "stomp" })],
  [
    /\b(rush|dash|sprint|charge|ram|tackle|horn|tusk)\b/,
    () => ({ type: "charge" }),
  ],
  [
    /\b(song|chorus|call|signal|echo|drum|rhythm|roar|screech|howl|growl|hiss|shriek|voice|whistle)\b/,
    () => ({ type: "roar" }),
  ],
  [
    /\b(pounce|prowl|stalker|ambush|paws|claw|swipe|scratch|talon)\b/,
    () => ({ type: "claw" }),
  ],
  [
    /\b(toss|throw|pebble|fig|fruit|nut|seed|quill|spiny|volley)\b/,
    () => ({ type: "barrage" }),
  ],
  [
    /\b(sweep|tail|slash|feint|camouflage|hidden|silent|still|fade)\b/,
    () => ({ type: "slash" }),
  ],
  [/\b(sharp|eye|focus|precise)\b/, () => ({ type: "critical" })],
  [/\b(strike|punch|kick|smack)\b/, () => ({ type: "punch" })],
  [/\b(hop|bounce|leap|jump)\b/, () => ({ type: "stomp" })],
  [
    /\b(feather|fan|wing|wings|flock|flight|glide|flutter)\b/,
    (category) => ({
      type: "leafStorm",
      glyph: category === "Butterfly" ? "🦋" : "🪶",
    }),
  ],
  [/\b(nectar|honey|pollen)\b/, () => ({ type: "leafStorm", glyph: "🦋" })],
  [
    /\b(forest|leaf|leafy|leaves|vine|canopy|branch|woodland)\b/,
    () => ({ type: "leafStorm" }),
  ],
];

const PROJECTILES: Array<[RegExp, string]> = [
  [/\bpebble\b/, "🪨"],
  [/\bfig\b/, "🍈"],
  [/\b(quill|spiny)\b/, "🌵"],
  [/\b(seed|nut)\b/, "🌰"],
];

function fromName(name: string, category: string): MoveEffect | null {
  const lower = name.toLowerCase();
  for (const [pattern, pick] of NAME_RULES) {
    if (!pattern.test(lower)) continue;
    const effect = pick(category);
    if (effect.type === "barrage" && !effect.glyph) {
      const projectile = PROJECTILES.find(([match]) => match.test(lower));
      if (projectile) return { ...effect, glyph: projectile[1] };
    }
    return effect;
  }
  return null;
}

function basicAttack(category: string): MoveEffect {
  if (category === "Bird") return { type: "slash" };
  if (category === "Butterfly") return { type: "missile", glyph: "🦋" };
  return { type: "bite" };
}

// The 4-Energy finisher with no telling name gets a big effect that suits the
// animal's battle role (birds dive in, butterflies swarm).
const ROLE_FINISHERS: Record<string, MoveEffect> = {
  Power: { type: "stomp" },
  Tank: { type: "stomp" },
  Agile: { type: "charge" },
  Trickster: { type: "slash" },
  Precision: { type: "critical" },
  Control: { type: "zap" },
  Support: { type: "roar" },
};

function finisher(category: string, role: string): MoveEffect {
  if (category === "Bird" && role !== "Precision" && role !== "Control")
    return { type: "rain", glyph: "🪶" };
  if (category === "Butterfly") return { type: "leafStorm", glyph: "🦋" };
  return ROLE_FINISHERS[role] ?? { type: "critical" };
}

function fromVfx(vfx: string | undefined, category: string): MoveEffect | null {
  if (vfx === "water") return { type: "splash" };
  if (vfx === "leaves") return { type: "leafStorm" };
  if (vfx === "wind")
    return { type: "missile", glyph: category === "Bird" ? "🪶" : "💨" };
  return null;
}

export function pickMoveEffect({
  action,
  attacker,
  move,
}: {
  action: WildlifeAction | undefined;
  attacker: WildlifeCombatant | undefined;
  /** The move's events: action, damage, heal, shield, guard… */
  move: WildlifeEvent[];
}): MoveEffect {
  const category = attacker?.category ?? "";
  const dealsDamage = move.some((event) => event.type === "damage");

  // Moves that only help the attacker.
  if (!dealsDamage) {
    if (move.some((event) => event.type === "heal")) return { type: "heal" };
    if (
      move.some((event) =>
        ["shield", "guard", "block"].includes(event.type ?? ""),
      )
    )
      return { type: "shieldUp" };
    return { type: "roar" };
  }

  if (!action || action === "basic") return basicAttack(category);
  const slot = Number(action.replace("ability_", ""));
  const ability = attacker?.abilities?.find((item) => item.slot === slot);
  return (
    fromName(ability?.name ?? "", category) ??
    fromVfx(ability?.vfx, category) ??
    (slot === 3
      ? finisher(category, attacker?.role ?? "")
      : { type: "missile" })
  );
}
