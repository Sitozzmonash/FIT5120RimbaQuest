// Text helpers shared by the battle screens.
import { Share } from "react-native";
import { WildlifeEvent } from "../../../../types/wildlifeMatch";

/** "wet_land" -> "Wet Land". */
export function friendlyHabitat(habitat: string): string {
  return habitat
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Newest first, de-duplicated, without the Energy recharge chatter. */
export function recentEvents(
  events: WildlifeEvent[] | undefined,
  limit = 6,
): WildlifeEvent[] {
  const seen = new Set<number>();
  return (events ?? [])
    .filter((event) => {
      if (event.type === "recharge") return false;
      if (event.id === undefined) return true;
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .slice(-limit)
    .reverse();
}

/** Opens the phone's share sheet with a battle invitation code. */
export function shareInviteCode(code: string) {
  void Share.share({
    message: `Battle me in RimbaQuest! Open Card Battle, tap Challenge a Friend and enter code ${code}.`,
  }).catch(() => {});
}
