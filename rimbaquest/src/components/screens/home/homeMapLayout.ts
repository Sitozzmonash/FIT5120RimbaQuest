import { HOME_MAP_IMAGES } from '../../../constants/images';

export const MAP_WIDTH = 390;
export const MAP_HEIGHT = 578;

type Placement = { left: number; top: number; width: number; height: number };

// Soft circular clearings painted on the ground.
export const MAP_CLEARINGS = [
  { cx: 319.8, cy: 59, r: 56, color: 'rgba(90, 140, 60, 0.3)' },
  { cx: 39, cy: 295.4, r: 60, color: 'rgba(90, 140, 60, 0.3)' },
  { cx: 343.2, cy: 413.5, r: 50, color: 'rgba(90, 140, 60, 0.28)' },
  { cx: 195, cy: 531.7, r: 36, color: 'rgba(70, 130, 170, 0.32)' },
];

export const MAP_GRASS_PATCHES: Placement[] = [
  { left: 104, top: 70, width: 210, height: 90.56 },
  { left: 10, top: 212, width: 162, height: 69.86 },
  { left: 186, top: 302, width: 188, height: 81.06 },
  { left: 10, top: 392, width: 162, height: 69.86 },
  { left: 202, top: 474, width: 162, height: 69.86 },
];

// Stepping stones winding from the camp down to the battle node.
export const MAP_TRAIL: [left: number, top: number][] = [
  [123, 68], [107, 81], [94, 97], [86, 115], [81, 137], [81, 161],
  [103, 209], [122, 227], [141, 242], [161, 254], [182, 262], [204, 268],
  [227, 270], [250, 269], [256, 290], [237, 311], [217, 329], [197, 344],
  [176, 356], [154, 364], [132, 368], [109, 370], [103, 392], [122, 412],
  [141, 429], [162, 441], [183, 451], [205, 456], [228, 458], [252, 456],
];

export const MAP_DECOR: (Placement & { source: number; rotate?: string })[] = [
  { source: HOME_MAP_IMAGES.sprout, left: 344, top: 120, width: 34, height: 31.44 },
  { source: HOME_MAP_IMAGES.butterfly, left: 150, top: 128, width: 28, height: 23.09, rotate: '-14deg' },
  { source: HOME_MAP_IMAGES.pebbles, left: 150, top: 524, width: 40, height: 31.45 },
  { source: HOME_MAP_IMAGES.sprout, left: 184, top: 410, width: 28, height: 25.89 },
  { source: HOME_MAP_IMAGES.grassTuft, left: 118, top: 202, width: 46, height: 36.8 },
  { source: HOME_MAP_IMAGES.bush, left: 176, top: 294, width: 64, height: 43.02 },
  { source: HOME_MAP_IMAGES.grassTuft, left: 6, top: 390, width: 44, height: 35.19 },
  { source: HOME_MAP_IMAGES.rock, left: 334, top: 490, width: 50, height: 32.75 },
  { source: HOME_MAP_IMAGES.grassTuft, left: 36, top: 52, width: 46, height: 36.8 },
];

export const MAP_CAMP_POSITION = { left: 70, top: 12 };

export const MAP_NODE_POSITIONS = {
  discover: { left: 14, top: 152, width: 154 },
  capture: { left: 190, top: 216, width: 180 },
  collection: { left: 14, top: 332, width: 154 },
  battle: { left: 206, top: 414, width: 154 },
};
