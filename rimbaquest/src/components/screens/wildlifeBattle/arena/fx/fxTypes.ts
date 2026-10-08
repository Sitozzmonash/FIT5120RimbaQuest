import { Animated, ImageSourcePropType } from "react-native";

export type Point = { x: number; y: number };

export type FXSide = "player" | "opponent";

export type FXType =
  | "bite"
  | "missile"
  | "punch"
  | "barrage"
  | "rain"
  | "slash"
  | "claw"
  | "stomp"
  | "roar"
  | "zap"
  | "splash"
  | "leafStorm"
  | "charge"
  | "poison"
  | "critical"
  | "heal"
  | "shieldUp"
  | "dodge";

export type PlayOptions = {
  type: FXType;
  attacker: FXSide;
  from: Point; // attacker centre, in stage coordinates
  to: Point; // target centre (impact point)
  damage?: number;
  gain?: { label: string; color: string };
  /** Override the default picture: one of your icon PNGs, or an emoji. */
  projectile?: ImageSourcePropType;
  glyph?: string;
};

export type Particle = {
  key: string;
  glyph?: string;
  image?: ImageSourcePropType;
  from: Point;
  to: Point;
  delay: number;
  duration: number;
  size?: number;
  spin?: number; // degrees over the flight
  arc?: number; // sideways bulge in px at mid-flight (negative = other side)
  scale?: [number, number];
  fade?: "out" | "inOut" | "none";
  easing?: (v: number) => number;
};

export type OverlayKind =
  | "flash"
  | "slash"
  | "ring"
  | "beam"
  | "bubble"
  | "tint"
  | "crack"
  | "speed"
  | "teeth";

export type Overlay = {
  key: string;
  kind: OverlayKind;
  at: Point;
  delay: number;
  duration: number;
  color?: string;
  rotate?: number; // degrees
  size?: number;
};

export type Motion = {
  attacker: "lunge" | "dash" | "jump" | "none";
  target: "shake" | "quake" | "knockback" | "dodge" | "none";
  screen?: boolean;
};

export type Recipe = {
  particles: Particle[];
  overlays: Overlay[];
  word?: { text: string; color: string; at: Point; delay: number };
  motion: Motion;
  impactAt: number; // ms when the hit lands (target reaction + numbers start)
  numberTicks?: number; // poison shows its damage as several small ticks
};

export type Live<T> = T & { v: Animated.Value };

export type ActiveFX = PlayOptions & {
  r: Recipe;
  parts: Live<Particle>[];
  overs: Live<Overlay>[];
};
