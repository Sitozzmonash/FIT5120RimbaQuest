import React from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Species } from "../../../../types";
import { speciesAbilities } from "../speciesAbilities";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detail/detailTheme";
import { GameButton } from "../../../common/game/GameButton";

export function PerkUnlockedModal({ species }: { species: Species }) {
  const newPerk = useAbilityQuizStore((state) => state.newPerk);
  const dismiss = () => useAbilityQuizStore.getState().dismissNewPerk();
  const perk =
    newPerk?.speciesId === species.id
      ? speciesAbilities(species).find(
          (ability) => ability.slot === newPerk.slot,
        )
      : undefined;

  return (
    <Modal
      visible={Boolean(perk)}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <View style={styles.backdrop}>
        <Image
          source={DETAIL_IMAGES.perkRays}
          style={styles.rays}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <View style={styles.ribbon}>
            <View style={[styles.tail, { left: 0 }]} />
            <View style={[styles.tail, { right: 0 }]} />
            <View style={styles.ribbonCenter}>
              <View style={styles.ribbonShine} />
              <Text style={styles.ribbonText}>New Perk Unlocked!</Text>
            </View>
          </View>

          <Text style={styles.name}>{perk?.name}</Text>
          {perk?.description ? (
            <Text style={styles.description}>{perk.description}</Text>
          ) : null}
          <GameButton size="m" label="Got it!" onPress={dismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    overflow: "hidden",
  },
  rays: { position: "absolute", width: 900, height: 900 },
  card: {
    width: "100%",
    maxWidth: 342,
    alignItems: "center",
    gap: 10,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: DETAIL_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 9,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 24,
  },
  ribbon: {
    position: "absolute",
    top: -33,
    width: 260,
    height: 54,
    alignSelf: "center",
  },
  tail: {
    position: "absolute",
    top: 12,
    width: 50,
    height: 40,
    backgroundColor: "#C25E00",
    borderWidth: 3,
    borderColor: DETAIL_COLORS.ink,
  },
  ribbonCenter: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 46 + 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 10,
    overflow: "hidden",
  },
  ribbonShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  ribbonText: {
    fontFamily: FONTS.display,
    color: "#FFFFFF",
    fontSize: 18,
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  name: {
    fontFamily: FONTS.display,
    color: DETAIL_COLORS.heading,
    fontSize: 30,
    textAlign: "center",
  },
  description: {
    fontFamily: FONTS.bodyBold,
    color: DETAIL_COLORS.body,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});
