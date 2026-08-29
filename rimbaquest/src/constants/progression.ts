// Every explorer needs to discover this many animals to advance one level.
// If the total catalogue doesn't divide evenly, the final level just holds
// whatever's left over (no rounding up to a full step).
export const ANIMALS_PER_LEVEL = 25;

export function levelForFound(found: number): number {
  return Math.floor(Math.max(0, found) / ANIMALS_PER_LEVEL) + 1;
}
