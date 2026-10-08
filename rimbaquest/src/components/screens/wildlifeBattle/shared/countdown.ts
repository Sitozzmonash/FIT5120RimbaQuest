// Ticking clock and "time left" text for invitation expiry countdowns.
import { useEffect, useState } from "react";

/** Current time, re-read every second while mounted. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** "1:59:30" until an ISO deadline, or null when unknown or already passed. */
export function formatTimeLeft(
  deadline: string | null | undefined,
  now: number,
): string | null {
  if (!deadline) return null;
  const end = Date.parse(deadline);
  if (Number.isNaN(end) || end <= now) return null;
  const total = Math.floor((end - now) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}
