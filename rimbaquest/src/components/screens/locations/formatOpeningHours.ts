// Splits a location's `best_time` ("Daily, 6:00 AM–7:00 PM; last entry 6:00 PM")
// into pill labels: ["Daily · 6:00 AM-7:00 PM", "Last entry 6:00 PM"].
export function openingHoursPills(bestTime: string | null | undefined): string[] {
  if (!bestTime) return [];
  return bestTime
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const text = index === 0 ? part.replace(/^(\w+),\s*/, "$1 · ") : part;
      return (text.charAt(0).toUpperCase() + text.slice(1)).replace(/\s*–\s*/g, "-");
    });
}
