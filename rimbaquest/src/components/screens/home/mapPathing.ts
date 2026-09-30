import { MapRect } from "./homeMapLayout";

type Point = { x: number; y: number };

// Debug: draw the blocked areas and each animal's collision box on the home
// map. Only ever shows in development builds.
export const SHOW_MAP_DEBUG = false;

// Keeps a little breathing room between an animal and a menu.
export const OBSTACLE_PADDING = 2;
// How finely a walk is checked for collisions (map units between samples).
const PATH_STEP = 10;

function overlaps(a: MapRect, b: MapRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function padded(rect: MapRect): MapRect {
  return {
    x: rect.x - OBSTACLE_PADDING,
    y: rect.y - OBSTACLE_PADDING,
    w: rect.w + OBSTACLE_PADDING * 2,
    h: rect.h + OBSTACLE_PADDING * 2,
  };
}

// True when an animal of `size` standing with its top-left at `point` touches
// none of the obstacles.
export function isSpotFree(
  point: Point,
  size: { w: number; h: number },
  obstacles: MapRect[],
): boolean {
  const body = { x: point.x, y: point.y, w: size.w, h: size.h };
  return obstacles.every((obstacle) => !overlaps(body, padded(obstacle)));
}

// True when walking in a straight line from `from` to `to` never touches an
// obstacle, checked every few map units along the way.
export function isPathClear(
  from: Point,
  to: Point,
  size: { w: number; h: number },
  obstacles: MapRect[],
): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / PATH_STEP));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    if (!isSpotFree(point, size, obstacles)) return false;
  }
  return true;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// A random spot for the animal's top-left inside `bounds` (which can start left
// of 0 when the map is widened on wide screens). Walkers need a free
// spot reachable in a straight line; flyers can go anywhere. Returns null if no
// good spot turned up this time (the animal just waits and tries again).
export function pickTarget(
  from: Point | null,
  size: { w: number; h: number },
  bounds: { x?: number; w: number; h: number },
  obstacles: MapRect[],
  attempts = 40,
): Point | null {
  const minX = bounds.x ?? 0;
  const maxX = minX + Math.max(0, bounds.w - size.w);
  const maxY = Math.max(0, bounds.h - size.h);
  
  for (let i = 0; i < attempts; i++) {
    const point = { x: rand(minX, maxX), y: rand(0, maxY) };
    if (!isSpotFree(point, size, obstacles)) continue;
    if (from && !isPathClear(from, point, size, obstacles)) continue;
    return point;
  }
  return null;
}
