import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES, AVATAR_ART } from "../../../../../constants/images";
import { FONTS } from "../../../../../constants/fonts";
import { GAME_COLORS } from "../../../../common/game/gameTheme";
import { ScaleTap } from "../../../../common/ScaleTap";
import { Avatar } from "../../shared/Avatar";
import { Chip } from "../../shared/Chip";

const INK = GAME_COLORS.ink;

function ModeCard({ label, title, body, art, chips, color, loading, disabled, onPress }: {
  label: string;
  title: string;
  body: string;
  art: React.ReactNode;
  chips: React.ReactNode;
  color: string;
  loading?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <ScaleTap label={label} onPress={onPress} disabled={disabled} style={[styles.card, { backgroundColor: color }, disabled && styles.disabled]}>
      {art}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.chips}>{chips}</View>
      </View>
      {loading ? <ActivityIndicator color={INK} /> : <Image source={BATTLE_IMAGES.chevronRight} style={{ width: 12, height: 17 }} resizeMode="contain" />}
    </ScaleTap>
  );
}

export function ModePicker({ busy, startingBot, onPractice, onChallenge }: {
  busy: boolean;
  startingBot: boolean;
  onPractice: () => void;
  onChallenge: () => void;
}) {
  return (
    <>
      <ModeCard
        label="Practice vs Bot. Warm up against a friendly bot. No points."
        title="Practice vs Bot"
        body="Warm up against a friendly bot."
        art={<Avatar source={AVATAR_ART.tiger} size={64} />}
        chips={<Chip text="No points" tone="plain" />}
        color="#D8ECCE"
        loading={startingBot}
        disabled={busy}
        onPress={onPractice}
      />
      <ModeCard
        label="Challenge a Friend. Battle a friend for leaderboard points."
        title="Challenge a Friend"
        body="Battle a friend for leaderboard points."
        art={(
          <View style={styles.avatarPair}>
            <Avatar source={AVATAR_ART.sunBear} size={56} />
            <Avatar source={AVATAR_ART.elephant} size={56} style={styles.overlap} />
          </View>
        )}
        chips={<><Chip text="Win +5" tone="win" /><Chip text="Loss −3" tone="loss" /></>}
        color="#FFE7A8"
        disabled={busy}
        onPress={onChallenge}
      />
    </>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.6 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 5px 0px ${INK}, inset 0px 5px 0px rgba(255, 255, 255, 0.45)`,
  },
  text: { flex: 1, gap: 4 },
  title: { fontFamily: FONTS.display, fontSize: 21, color: GAME_COLORS.heading },
  body: { fontFamily: FONTS.bodyBold, fontSize: 13, color: GAME_COLORS.body },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  avatarPair: { flexDirection: "row" },
  overlap: { marginLeft: -14 },
});
