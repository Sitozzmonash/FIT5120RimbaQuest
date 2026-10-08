// Small side effects the Card Battle flow needs, kept out of the screen switcher.
import { useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useBattleInviteStore } from "../../../../store/useBattleInviteStore";
import {
  WildlifeLeaderboardEntry,
  WildlifeMatch,
} from "../../../../types/wildlifeMatch";
import { setMusicTrack } from "../../../../utils/sounds";

/** The explorer's rank as a battle starts, so the result screen can show "#1 → #2". */
export function useRankBefore(
  match: WildlifeMatch | null,
  leaderboard: WildlifeLeaderboardEntry[] | null,
  childId: number,
): number | null {
  const [rankBefore, setRankBefore] = useState<number | null>(null);
  const active = match?.status === "active";
  useEffect(() => {
    if (!active) return;
    setRankBefore(
      leaderboard?.find((entry) => entry.child_id === childId)?.rank ?? null,
    );
    // Only on the switch to active: later leaderboard refreshes must not overwrite it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, match?.id]);
  return rankBefore;
}

/** An invitation accepted from the pop-up on another screen opens straight into card picking. */
export function usePendingInvite({
  recovering,
  busy,
  previewInvite,
}: {
  recovering: boolean;
  /** A match or invite is already open, so the pending one is dropped. */
  busy: boolean;
  previewInvite: (code: string) => Promise<boolean>;
}) {
  const pendingCode = useBattleInviteStore((state) => state.pendingCode);
  useEffect(() => {
    if (!pendingCode || recovering) return;
    const code = useBattleInviteStore.getState().takePending();
    if (code && !busy) void previewInvite(code);
  }, [pendingCode, recovering, busy, previewInvite]);
}

/** Re-renders every half second while active, so the friend-battle turn countdown ticks. */
export function useTicker(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTick((tick) => tick + 1), 500);
    return () => clearInterval(timer);
  }, [active]);
}

/** Android's back button steps through the battle flow instead of leaving the app. */
export function useAndroidBack(handler: () => void) {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handler();
        return true;
      },
    );
    return () => subscription.remove();
  }, [handler]);
}

/** Lobby, picker and results play the battle theme; the arena has its own; leaving restores the main theme. */
export function useBattleMusic(inArena: boolean) {
  useEffect(() => setMusicTrack(inArena ? "arena" : "battle"), [inArena]);
  useEffect(() => () => setMusicTrack("main"), []);
}
