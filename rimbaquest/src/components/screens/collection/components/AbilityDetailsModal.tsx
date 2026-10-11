import { Modal, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GameButton } from "../../../common/game/GameButton";
import { SpeciesAbility } from "../speciesAbilities";
import { AbilityStats } from "./detail/AbilityStats";
import { DETAIL_COLORS } from "./detail/detailTheme";

export function AbilityDetailsModal({
  ability,
  locked,
  onClose,
}: {
  ability: SpeciesAbility | null;
  locked: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={Boolean(ability)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>
            {locked ? "Locked Ability" : "Ability Details"}
          </Text>
          <Text style={styles.title}>{ability?.name}</Text>
          <AbilityStats effects={ability?.effects} />
          {ability?.description && !ability.effects?.length ? (
            <Text style={styles.description}>{ability.description}</Text>
          ) : null}
          {locked ? (
            <Text style={styles.lockedNote}>
              Unlock the previous ability to begin this quiz.
            </Text>
          ) : null}
          <GameButton size="m" label="Close" onPress={onClose} />
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  card: {
    width: "100%",
    maxWidth: 330,
    alignItems: "center",
    gap: 12,
    padding: 22,
    backgroundColor: DETAIL_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 9,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 24,
  },
  kicker: {
    fontFamily: FONTS.display,
    fontSize: 12,
    color: DETAIL_COLORS.heading,
  },
  title: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 25,
    textAlign: "center",
    color: DETAIL_COLORS.mintText,
  },
  description: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: DETAIL_COLORS.body,
  },
  lockedNote: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    textAlign: "center",
    color: DETAIL_COLORS.label,
  },
});
