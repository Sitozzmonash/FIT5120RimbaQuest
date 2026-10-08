import React, { useState } from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WoodModal } from "../../../common/game/WoodModal";
import { Tap } from "../../../common/Tap";
import { WildlifeRestCard } from "../../../../types/wildlifeMatch";
import { useNow } from "../shared/countdown";

const INK = GAME_COLORS.ink;

function DeckStat({
  icon,
  count,
  label,
  ready,
}: {
  icon: React.ReactNode;
  count: number | undefined;
  label: string;
  ready: boolean;
}) {
  return (
    <View style={[styles.stat, ready ? styles.readyStat : styles.restingStat]}>
      {icon}
      <View>
        <Text
          style={[styles.count, ready ? styles.readyCount : styles.restingText]}
        >
          {count ?? "–"}
        </Text>
        <Text
          style={[styles.label, ready ? styles.readyLabel : styles.restingText]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export function DeckCard({
  restCards,
}: {
  restCards: WildlifeRestCard[] | null;
}) {
  const [helpVisible, setHelpVisible] = useState(false);
  const now = useNow();
  const restingCount = restCards?.filter((card) => card.rest_until && Date.parse(card.rest_until) > now).length;
  const readyCount = restCards ? restCards.length - (restingCount ?? 0) : undefined;

  return (
    <View style={styles.deck}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Deck</Text>
        <Tap
          label="How resting works"
          onPress={() => setHelpVisible(true)}
          style={styles.helpButton}
        >
          <Text style={styles.helpText}>?</Text>
        </Tap>
      </View>
      <View style={styles.stats}>
        <DeckStat
          ready
          label="Ready"
          count={readyCount}
          icon={
            <Image
              source={BATTLE_IMAGES.zap}
              style={styles.icon as ImageStyle}
              resizeMode="contain"
            />
          }
        />
        <DeckStat
          ready={false}
          label="Resting"
          count={restingCount}
          icon={<Image source={BATTLE_IMAGES.clock} style={{ width: 22, height: 25 }} resizeMode="contain" />}
        />
      </View>
      <Text style={styles.hint}>Used cards rest for 2 hours after a match.</Text>

      <WoodModal
        visible={helpVisible}
        onRequestClose={() => setHelpVisible(false)}
        icon={BATTLE_IMAGES.leafShield}
        positive
        stars={false}
        title="Resting Cards"
        message="A used card rests for 2 hours after a completed match. The timer keeps running while the app is closed."
        actionLabel="Got It"
        onAction={() => setHelpVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: GAME_COLORS.heading,
  },
  helpButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: INK,
  },
  helpText: { fontFamily: FONTS.display, fontSize: 15, color: INK },
  stats: { flexDirection: "row", gap: 10, marginTop: 10 },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 14,
  },
  readyStat: { backgroundColor: "#D8ECCE", borderColor: "#2F7A41" },
  restingStat: { backgroundColor: "#ECE2C8", borderColor: "#A89D7C" },
  icon: { width: 26, height: 26 },
  count: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 24 },
  label: { fontFamily: FONTS.bodyBlack, fontSize: 11 },
  readyCount: { color: "#1F6B33" },
  readyLabel: { color: "#1A4D2B" },
  restingText: { color: "#6F6A55" },
  hint: {
    marginTop: 8,
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    color: GAME_COLORS.label,
  },
});
