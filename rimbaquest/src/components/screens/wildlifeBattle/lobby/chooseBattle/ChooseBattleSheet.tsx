import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { WildlifeFriend } from "../../../../../types/wildlifeMatch";
import { BottomSheet } from "./BottomSheet";
import { FriendOptions } from "./FriendOptions";
import { ModePicker } from "./ModePicker";

export function ChooseBattleSheet({
  visible,
  onClose,
  onPractice,
  onJoin,
  onCreateCode,
  friends,
  onInviteFriend,
  onOpenFriends,
  pending,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  onPractice: () => void;
  onJoin: (code: string) => void;
  onCreateCode: () => void;
  friends: WildlifeFriend[] | null;
  onInviteFriend: (friend: WildlifeFriend) => void;
  onOpenFriends: () => void;
  pending: string | null;
  error: string | null;
}) {
  const [page, setPage] = useState<"choose" | "friend">("choose");

  // Always reopen on the first page.
  useEffect(() => {
    if (!visible) setPage("choose");
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      title={page === "choose" ? "Choose Your Battle" : "Challenge a Friend"}
      onClose={onClose}
      onBack={page === "friend" ? () => setPage("choose") : undefined}
    >
      {page === "choose" ? (
        <ModePicker
          busy={Boolean(pending)}
          startingBot={pending === "Creating match"}
          onPractice={onPractice}
          onChallenge={() => setPage("friend")}
        />
      ) : (
        <FriendOptions
          friends={friends}
          pending={pending}
          onInviteFriend={onInviteFriend}
          onOpenFriends={onOpenFriends}
          onJoin={onJoin}
          onCreateCode={onCreateCode}
        />
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    color: "#A13D25",
  },
});
