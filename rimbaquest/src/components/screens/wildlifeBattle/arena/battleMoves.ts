import { monotonicNow } from "../../../../hooks/useWildlifeMatch";
import type { WildlifeServerClock } from "../../../../hooks/useWildlifeMatch";
import { WildlifeAction, WildlifeCombatant, WildlifeMode } from "../../../../types/wildlifeMatch";
import { BattleMove } from "./MoveCard";

const ACTIONS: Array<{ action: WildlifeAction; slot?: number; cost: number; fallback: string }> = [
  { action: "basic", cost: 0, fallback: "Basic Attack" },
  { action: "ability_1", slot: 1, cost: 1, fallback: "Skill 1" },
  { action: "ability_2", slot: 2, cost: 2, fallback: "Skill 2" },
  { action: "ability_3", slot: 3, cost: 4, fallback: "Skill 3" },
];

/** Basic attack then the three skills, each with whether it can be played right now and why not. */
export function buildMoves(card: WildlifeCombatant | undefined, canAct: boolean): BattleMove[] {
  if (!card) return [];
  return ACTIONS.map((entry) => {
    const skill = entry.slot === undefined ? undefined : card.abilities?.find((ability) => ability.slot === entry.slot);
    const cost = skill?.cost ?? entry.cost;
    const unlocked = entry.slot === undefined || Boolean(skill?.unlocked);
    const affordable = card.energy >= cost;
    const description = entry.slot === undefined ? "Always available." : skill?.description || "Ready";
    return {
      action: entry.action,
      name: entry.slot === undefined ? entry.fallback : skill?.name || entry.fallback,
      cost,
      description,
      unlocked,
      enabled: Boolean(canAct && unlocked && affordable),
      note: !unlocked ? "Locked · pass its quiz" : !affordable ? "Not enough Energy" : description,
    };
  });
}

/** Seconds left before a server deadline, using the server's clock rather than the phone's. */
export function secondsLeft(deadline: string | null | undefined, clock: WildlifeServerClock | null): number | null {
  if (!deadline || !clock) return null;
  const end = Date.parse(deadline);
  if (Number.isNaN(end)) return null;
  const serverNow = clock.serverEpochMs + Math.max(0, monotonicNow() - clock.receivedMonotonicMs);
  return Math.max(0, Math.ceil((end - serverNow) / 1000));
}

/** "Your Turn! 12s", "Bot's Turn", "Time's Up!"… Friend battles show the countdown. */
export function turnLabel(myTurn: boolean, mode: WildlifeMode | undefined, countdown: number | null): string {
  const label = myTurn ? "Your Turn!" : mode === "bot" ? "Bot's Turn" : "Friend's Turn";
  if (mode !== "friend" || countdown === null) return label;
  // At 0 the server still has to confirm the skipped turn, so don't show a frozen "0s".
  return countdown === 0 ? "Time's Up!" : `${label} ${countdown}s`;
}

/** The rules pop-up shown when the arena opens. */
export function energyRule(maxEnergy: number | undefined, mode: WildlifeMode | undefined): string {
  return `One move per turn. Each turn you play adds +2 Energy, up to ${maxEnergy ?? 8}.`
    + (mode === "friend" ? " Run out of time and your turn is skipped with no Energy." : "");
}
