import React from "react";
import {
  Image,
  ImageStyle,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BATTLE_IMAGES, imageFor } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GameButton } from "../../../common/game/GameButton";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { errorTextStyle } from "../shared/ErrorNote";
import { Card } from "./cardTypes";
import { SpeciesPhoto } from "./CardTile";
import { SkillList } from "./SkillList";

const INK = GAME_COLORS.ink;

export function CardDetailModal({
  card,
  onRepick,
  onUse,
  useLabel,
  pending,
  error,
}: {
  card: Card | null;
  onRepick: () => void;
  onUse: () => void;
  useLabel: string;
  pending: boolean;
  error: string | null;
}) {
  const picture = card ? imageFor(card.species) : undefined;
  return (
    <Modal
      visible={Boolean(card)}
      transparent
      animationType="fade"
      onRequestClose={onRepick}
    >
      <View style={styles.backdrop}>
        {card ? (
          <View style={styles.detail}>
            <View style={styles.media}>
              {picture ? <SpeciesPhoto source={picture} /> : null}
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
            >
              <Text style={styles.name}>{card.species.common_name}</Text>
              <Text style={styles.skillsLabel}>SKILLS</Text>
              <SkillList species={card.species} />
              {error ? <Text style={errorTextStyle}>{error}</Text> : null}
              <GameButton label={useLabel} onPress={onUse} loading={pending} />
            </ScrollView>
          </View>
        ) : null}
        {card ? (
          <ScaleTap
            label="Close and pick another card"
            onPress={onRepick}
            disabled={pending}
            style={[styles.close, pending && styles.closeDisabled]}
          >
            <Image
              source={BATTLE_IMAGES.close}
              style={styles.closeIcon as ImageStyle}
              resizeMode="cover"
            />
          </ScaleTap>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  detail: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "82%",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 4,
    borderColor: "#F2B233",
    borderRadius: 24,
    boxShadow: `0px 8px 0px ${INK}`,
  },
  media: {
    height: 170,
    overflow: "hidden",
    borderBottomWidth: 3,
    borderBottomColor: INK,
    backgroundColor: "#2F6B3E",
  },
  scroll: { flexGrow: 0 },
  body: { gap: 10, paddingTop: 14, paddingBottom: 18, paddingHorizontal: 16 },
  name: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: GAME_COLORS.headerGreen,
    textAlign: "center",
  },
  skillsLabel: {
    fontFamily: FONTS.button,
    fontSize: 12,
    letterSpacing: 0.24,
    color: GAME_COLORS.headerGreen,
  },
  // Floating round X under the card, replacing the old Repick button.
  close: {
    alignSelf: "center",
    marginTop: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    boxShadow: `0px 4px 0px ${INK}`,
  },
  closeDisabled: { opacity: 0.6 },
  closeIcon: { width: 26, height: 26 },
});
