import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useAbilityQuizStore } from "../../../../store/useAbilityQuizStore";
import { Species } from "../../../../types";
import { speciesAbilities } from "../speciesAbilities";
import { DETAIL_COLORS } from "./detail/detailTheme";
import { GameButton } from "../../../common/game/GameButton";
import { GameRibbon } from "../../../common/game/GameRibbon";
import { SpinningRays } from "../../../common/game/SpinningRays";

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
        <SpinningRays style={styles.rays} />

        <View style={styles.card}>
          <GameRibbon label="New Perk Unlocked!" style={styles.ribbon} />

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
  rays: { position: "absolute" },
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
  ribbon: { position: "absolute", top: -33 },
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
