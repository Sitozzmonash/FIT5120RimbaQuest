// The attack effects, each described as particles, overlays, a word pop and card motion. All timings in ms.
import { Easing } from "react-native";
import { GAME_COLORS } from "../../../../common/game/gameTheme";
import { Point, PlayOptions, Recipe } from "./fxTypes";

const INK = GAME_COLORS.ink;
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const add = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });
const around = (c: Point, r: number, deg: number): Point => ({
  x: c.x + r * Math.cos((deg * Math.PI) / 180),
  y: c.y + r * Math.sin((deg * Math.PI) / 180),
});
let uid = 0;
const id = () => `fx${uid++}`;

/** Builds the particles / overlays / motion for one effect. All timings in ms. */
export function recipe(o: PlayOptions): Recipe {
  const { from, to } = o;
  const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const pic = (fallback: string) => (o.projectile ? { image: o.projectile } : { glyph: o.glyph ?? fallback });

  switch (o.type) {
    case "bite":
      return {
        particles: [],
        overlays: [{ key: id(), kind: "teeth", at: to, delay: 260, duration: 1100 }],
        word: { text: "CHOMP!", color: "#E5484D", at: add(to, 0, -40), delay: 260 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 300,
      };

    case "missile":
      return {
        particles: [{ key: id(), ...pic("🌀"), from, to, delay: 120, duration: 650, spin: 720, scale: [0.7, 1.1], fade: "none", easing: Easing.in(Easing.quad) }],
        overlays: [{ key: id(), kind: "ring", at: to, delay: 770, duration: 450, color: "#FFD66E" }],
        word: { text: "WHAM!", color: "#FFB938", at: to, delay: 770 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 770,
      };

    case "punch":
      return {
        particles: [{ key: id(), ...pic("👊"), from, to, delay: 100, duration: 360, size: 46, scale: [0.6, 1.4], fade: "none", easing: Easing.in(Easing.cubic) }],
        overlays: [{ key: id(), kind: "flash", at: to, delay: 460, duration: 160, color: "#FFFFFF" }],
        word: { text: "POW!", color: "#FFB938", at: to, delay: 460 },
        motion: { attacker: "lunge", target: "knockback" }, impactAt: 460,
      };

    case "barrage":
      return {
        particles: [0, 1, 2].map((i) => ({
          key: id(), ...pic("🥥"), from: add(from, 0, (i - 1) * 14), to: add(to, (i - 1) * 16, (i - 1) * 10),
          delay: 100 + i * 180, duration: 420, spin: 360, arc: (i - 1) * 30, fade: "none" as const, easing: Easing.in(Easing.quad),
        })),
        overlays: [0, 1, 2].map((i) => ({
          key: id(), kind: "ring" as const, at: add(to, (i - 1) * 16, (i - 1) * 10), delay: 520 + i * 180, duration: 320, color: "#FFFFFF", size: 60,
        })),
        word: { text: "x3!", color: "#FFB938", at: to, delay: 900 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 520,
      };

    case "rain": {
      const spots = [0, 1, 2, 3, 4].map((i) => add(to, (i - 2) * 22, ((i * 37) % 30) - 15));
      return {
        particles: spots.map((land, i) => ({
          key: id(), ...pic("☄️"), from: { x: land.x + 50, y: -60 }, to: land,
          delay: i * 120, duration: 520, size: 38, spin: -30, scale: [0.8, 1.2] as [number, number], fade: "none" as const, easing: Easing.in(Easing.quad),
        })),
        overlays: spots.map((at, i) => ({ key: id(), kind: "ring" as const, at, delay: 520 + i * 120, duration: 360, color: "#FFB938", size: 70 })),
        word: { text: "BOOM!", color: "#E5484D", at: to, delay: 1000 },
        motion: { attacker: "jump", target: "shake", screen: true }, impactAt: 520,
      };
    }

    case "slash":
      return {
        particles: [],
        overlays: [{ key: id(), kind: "slash", at: to, delay: 180, duration: 520, rotate: -35, color: "#FFFFFF", size: 190 }],
        word: { text: "SLASH!", color: "#6FC3E8", at: add(to, 0, -48), delay: 260 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 220,
      };

    case "claw":
      return {
        particles: [],
        overlays: [-1, 0, 1].map((i) => ({
          key: id(), kind: "slash" as const, at: add(to, i * 22, i * 6), delay: 160 + (i + 1) * 90, duration: 600, rotate: -60, color: "#FFFFFF", size: 140,
        })),
        word: { text: "SCRATCH!", color: "#E5484D", at: add(to, 0, -52), delay: 360 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 250,
      };

    case "stomp":
      return {
        particles: [-1, 1].flatMap((d) => [0, 1].map((j) => ({
          key: id(), glyph: "💨", from: add(to, 0, 40), to: add(to, d * (60 + j * 30), 46 - j * 10),
          delay: 520 + j * 60, duration: 600, size: 30, scale: [0.5, 1.3] as [number, number], fade: "out" as const,
        }))),
        overlays: [
          { key: id(), kind: "crack", at: add(to, 0, 34), delay: 520, duration: 900, color: INK },
          { key: id(), kind: "ring", at: add(to, 0, 40), delay: 520, duration: 500, color: "#C2A85E", size: 120 },
        ],
        word: { text: "STOMP!", color: "#B86F32", at: add(to, 0, -40), delay: 540 },
        motion: { attacker: "jump", target: "quake", screen: true }, impactAt: 520,
      };

    case "roar":
      return {
        particles: [],
        overlays: [0, 1, 2].map((i) => ({
          key: id(), kind: "ring" as const, at: lerp(from, to, 0.15 + i * 0.25), delay: i * 140, duration: 600, color: "#FFF6DC", size: 90 + i * 30,
        })),
        word: { text: "ROAR!", color: "#FFB938", at: lerp(from, to, 0.5), delay: 100 },
        motion: { attacker: "lunge", target: "knockback", screen: true }, impactAt: 420,
      };

    case "zap":
      return {
        particles: [{ key: id(), ...pic("⚡"), from: { x: to.x, y: -40 }, to, delay: 80, duration: 160, size: 64, fade: "none", easing: Easing.linear }],
        overlays: [
          { key: id(), kind: "beam", at: to, delay: 80, duration: 420, color: "#FFF6DC" },
          { key: id(), kind: "flash", at: to, delay: 240, duration: 220, color: "#FFFFFF" },
          { key: id(), kind: "ring", at: to, delay: 240, duration: 400, color: "#FFD66E" },
        ],
        word: { text: "ZAP!", color: "#FFD66E", at: add(to, 0, -44), delay: 260 },
        motion: { attacker: "none", target: "shake", screen: true }, impactAt: 240,
      };

    case "splash":
      return {
        particles: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
          key: id(), glyph: "💧", from: to, to: around(to, 70 + (i % 2) * 20, i * 45 - 90),
          delay: 340, duration: 600, size: 24, scale: [0.4, 1] as [number, number], fade: "out" as const, easing: Easing.out(Easing.quad),
        })),
        overlays: [
          { key: id(), kind: "ring", at: to, delay: 320, duration: 500, color: "#6FC3E8", size: 110 },
          { key: id(), kind: "tint", at: to, delay: 320, duration: 600, color: "#6FC3E8" },
        ],
        word: { text: "SPLASH!", color: "#3A9CC7", at: add(to, 0, -50), delay: 360 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 340,
      };

    case "leafStorm":
      return {
        particles: [0, 1, 2, 3, 4, 5].map((i) => ({
          key: id(), ...pic("🍃"),
          from: add(from, (i % 3) * 10 - 10, -(i % 3) * 12), to: add(to, ((i * 13) % 30) - 15, ((i * 7) % 24) - 12),
          delay: i * 80, duration: 700, size: 30, spin: 540 * (i % 2 ? 1 : -1), arc: (i % 2 ? 1 : -1) * (60 + i * 6),
          fade: "none" as const, easing: Easing.inOut(Easing.quad),
        })),
        overlays: [{ key: id(), kind: "ring", at: to, delay: 780, duration: 420, color: "#7CC26A", size: 100 }],
        word: { text: "WHOOSH!", color: "#4CB35A", at: add(to, 0, -48), delay: 780 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 780,
      };

    case "charge":
      return {
        particles: [],
        overlays: [
          ...[0, 1, 2, 3].map((i) => ({
            key: id(), kind: "speed" as const, at: add(lerp(from, to, 0.45), 0, (i - 1.5) * 18), delay: 40 + i * 30, duration: 380, rotate: ang, color: "#FFFFFF",
          })),
          { key: id(), kind: "ring", at: to, delay: 300, duration: 420, color: "#FFB938", size: 100 },
        ],
        word: { text: "WHAM!", color: "#FFB938", at: to, delay: 300 },
        motion: { attacker: "dash", target: "knockback", screen: true }, impactAt: 300,
      };

    case "poison":
      return {
        particles: [0, 1, 2, 3, 4].map((i) => ({
          key: id(), glyph: "🫧", from: add(to, (i - 2) * 16, 30), to: add(to, (i - 2) * 22, -60 - (i % 2) * 20),
          delay: 300 + i * 120, duration: 900, size: 22, fade: "out" as const, easing: Easing.out(Easing.quad),
        })),
        overlays: [
          { key: id(), kind: "tint", at: to, delay: 260, duration: 1400, color: "#7CC26A" },
          { key: id(), kind: "ring", at: to, delay: 260, duration: 500, color: "#4CB35A" },
        ],
        word: { text: "POISON!", color: "#4CB35A", at: add(to, 0, -56), delay: 300 },
        motion: { attacker: "lunge", target: "shake" }, impactAt: 300, numberTicks: 3,
      };

    case "critical":
      return {
        particles: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
          key: id(), glyph: "⭐", from: to, to: around(to, 90, i * 45),
          delay: 260, duration: 650, size: 26, spin: 180, scale: [0.4, 1.2] as [number, number], fade: "out" as const, easing: Easing.out(Easing.cubic),
        })),
        overlays: [
          { key: id(), kind: "flash", at: to, delay: 220, duration: 260, color: "#FFD66E" },
          { key: id(), kind: "ring", at: to, delay: 240, duration: 500, color: "#FFD66E", size: 140 },
        ],
        word: { text: "CRITICAL!", color: "#FFB938", at: add(to, 0, -50), delay: 260 },
        motion: { attacker: "dash", target: "knockback", screen: true }, impactAt: 240,
      };

    case "heal":
      return {
        particles: [0, 1, 2, 3, 4, 5].map((i) => ({
          key: id(), glyph: i % 2 ? "✨" : "💚", from: add(from, (i - 2.5) * 18, 40), to: add(from, (i - 2.5) * 22, -70 - (i % 3) * 14),
          delay: i * 110, duration: 900, size: 22, fade: "inOut" as const, easing: Easing.out(Easing.quad),
        })),
        overlays: [{ key: id(), kind: "ring", at: from, delay: 0, duration: 700, color: "#7CC26A", size: 120 }],
        word: { text: "+HP", color: "#4CB35A", at: add(from, 0, -60), delay: 200 },
        motion: { attacker: "jump", target: "none" }, impactAt: 200,
      };

    case "shieldUp":
      return {
        particles: [0, 1, 2, 3].map((i) => ({
          key: id(), glyph: "✨", from: around(from, 70, i * 90 + 45), to: around(from, 30, i * 90 + 45),
          delay: 0, duration: 420, size: 20, fade: "out" as const,
        })),
        overlays: [{ key: id(), kind: "bubble", at: from, delay: 240, duration: 1300, color: "#6FC3E8", size: 150 }],
        word: { text: "SHIELD!", color: "#6FC3E8", at: add(from, 0, -70), delay: 300 },
        motion: { attacker: "none", target: "none" }, impactAt: 300,
      };

    case "dodge":
      return {
        particles: [{ key: id(), ...pic("👊"), from, to: lerp(from, to, 1.5), delay: 100, duration: 600, size: 40, fade: "out", easing: Easing.in(Easing.quad) }],
        overlays: [],
        word: { text: "MISS!", color: "#FFF6DC", at: add(to, -30, -50), delay: 380 },
        motion: { attacker: "lunge", target: "dodge" }, impactAt: 300,
      };
  }
}
