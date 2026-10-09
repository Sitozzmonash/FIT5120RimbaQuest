import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../../constants/fonts";
import { GameScreenHeader } from "../../../common/game/GameScreenHeader";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { WildlifeMatch } from "../../../../types/wildlifeMatch";
import { ErrorNote } from "../shared/ErrorNote";
import { friendlyHabitat } from "../shared/battleText";
import { Chip } from "../shared/Chip";
import { HabitatPhotoBanner } from "../shared/HabitatPhotoBanner";
import { ShareCodeCard } from "./ShareCodeCard";
import { WaitingStatus } from "./WaitingStatus";
import { WaitingCard, YourCardRow } from "./YourCardRow";

export type { WaitingCard } from "./YourCardRow";

const INK = GAME_COLORS.ink;

export function BattleWaiting({
  match,
  invitedFriendName,
  myCard,
  pending,
  error,
  onBack,
  onChangeCard,
  onCancel,
}: {
  match: WildlifeMatch;
  invitedFriendName?: string;
  myCard: WaitingCard | null;
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onChangeCard: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const habitat = friendlyHabitat(match.habitat);

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title="Waiting for Friend"
        onBack={onBack}
        disabled={pending}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HabitatPhotoBanner
          habitat={match.habitat}
          height={132}
          style={styles.banner}
          bottomRight={<Chip text={`${habitat} cards +20%`} tone="gold" />}
        />
        <WaitingStatus
          friendName={invitedFriendName}
          expiresAt={match.expires_at}
        />
        <ShareCodeCard
          code={match.invite_code}
          invitedFriendName={invitedFriendName}
        />
        <YourCardRow
          card={myCard}
          disabled={pending}
          onChange={onChangeCard}
        />
        {error ? <ErrorNote message={error} /> : null}
        <ScaleTap
          label="Cancel invitation"
          onPress={onCancel}
          disabled={pending}
          style={[styles.cancel, pending && styles.disabled]}
        >
          <Text style={styles.cancelText}>Cancel Invitation</Text>
        </ScaleTap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GAME_COLORS.headerGreen },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  disabled: { opacity: 0.6 },
  banner: {
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  cancel: {
    alignSelf: "center",
    height: 44,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#E5484D",
    borderRadius: 999,
  },
  cancelText: { fontFamily: FONTS.display, fontSize: 15, color: "#FFB3B5" },
});
