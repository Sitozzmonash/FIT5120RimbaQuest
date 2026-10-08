import React, { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { API_BASE } from "../../../../constants/config";
import { useBattleInviteStore } from "../../../../store/useBattleInviteStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { useUserStore } from "../../../../store/useUserStore";
import { WildlifeFriends } from "../../../../types/wildlifeMatch";
import { InvitePopup } from "./InvitePopup";

const POLL_MS = 8000;

export function GlobalInvitePopup() {
  const childId = useUserStore((state) => state.currentUser.id);
  const token = useUserStore((state) => state.accessToken);
  const myAvatar = useUserStore((state) => state.currentUser.avatar);
  const dismissed = useBattleInviteStore((state) => state.dismissed);
  const [data, setData] = useState<WildlifeFriends | null>(null);

  const refresh = useCallback(async () => {
    if (!childId || !token) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const next = (await response.json()) as WildlifeFriends;
        setData(next);
        useBattleInviteStore.getState().setIncomingCount(next.incoming_invites.length);
      }
    } catch {
      // Offline or server down: try again on the next tick.
    }
  }, [childId, token]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active") void refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  const invite =
    data?.incoming_invites.find((item) => !dismissed.includes(item.match_id)) ??
    null;

  return (
    <InvitePopup
      invite={invite}
      friendAvatar={
        data?.friends.find(
          (friend) => friend.child_id === invite?.friend_child_id,
        )?.avatar
      }
      myAvatar={myAvatar}
      busy={false}
      onAccept={() => {
        if (!invite) return;
        useBattleInviteStore
          .getState()
          .accept(invite.match_id, invite.invite_code);
        useNavigationStore.getState().open("battle_select");
      }}
      onNotNow={() =>
        invite && useBattleInviteStore.getState().dismiss(invite.match_id)
      }
    />
  );
}
