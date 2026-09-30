import React from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { FONTS } from "../../../../constants/fonts";
import {
  difficultyLabel,
  useAbilityQuizStore,
} from "../../../../store/useAbilityQuizStore";
import { QuizDifficulty } from "../../../../types";
import { Tap } from "../../../common/Tap";
import { DetailPill } from "./detail/DetailPill";
import {
  DETAIL_COLORS,
  DETAIL_IMAGES,
  MODAL_GLOW_SVG,
} from "./detail/detailTheme";
import { GameButton } from "../../../common/game/GameButton";

const DIFFICULTY_TONE: Record<QuizDifficulty, "mint" | "amber" | "red"> = {
  easy: "mint",
  medium: "amber",
  hard: "red",
};

const BADGE_SIZE = 96;

// "Unlock This Ability" prompt shown before an ability quiz.
export function AbilityUnlockModal() {
  const visible = useAbilityQuizStore((state) => state.unlockModalVisible);
  const abilityName = useAbilityQuizStore((state) => state.pendingAbilityName);
  const difficulty = useAbilityQuizStore((state) => state.pendingDifficulty);
  const close = () => useAbilityQuizStore.getState().closeUnlockModal();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={[styles.glow, { pointerEvents: "none" }]}>
          <SvgXml xml={MODAL_GLOW_SVG} width={390} height={360} />
        </View>

        <View style={styles.card}>
          <View style={styles.badgeSlot}>
            <View style={[styles.badge, styles.badgeShadow]} />
            <View style={[styles.badge, styles.badgeFace]}>
              <Image
                source={DETAIL_IMAGES.lock}
                style={styles.lock}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.kicker}>Unlock This Ability</Text>
          <Text style={styles.name}>{abilityName}</Text>
          {difficulty ? (
            <DetailPill
              label={difficultyLabel(difficulty)}
              tone={DIFFICULTY_TONE[difficulty]}
            />
          ) : null}
          <Text style={styles.message}>
            First, get to know this animal before unlocking its abilities for
            battle!
          </Text>
          <GameButton
            size="m"
            label="Begin Challenge"
            onPress={() => void useAbilityQuizStore.getState().beginChallenge()}
          />
          <Tap label="Not Now" style={styles.notNow} onPress={close}>
            <Text style={styles.notNowText}>Not Now</Text>
          </Tap>

          <Image
            source={DETAIL_IMAGES.modalBush}
            style={styles.bush}
            resizeMode="contain"
          />
          <Image
            source={DETAIL_IMAGES.modalLeaf}
            style={styles.leaf}
            resizeMode="contain"
          />
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
  glow: { position: "absolute" },
  card: {
    width: "100%",
    maxWidth: 330,
    alignItems: "center",
    gap: 10,
    paddingTop: 58,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: DETAIL_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 9,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 24,
  },
  badgeSlot: {
    position: "absolute",
    top: -51,
    width: BADGE_SIZE,
    height: BADGE_SIZE + 5,
  },
  badge: {
    position: "absolute",
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
  },
  badgeShadow: { top: 5, backgroundColor: DETAIL_COLORS.ink },
  badgeFace: {
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE7A8",
    borderWidth: 3,
    borderColor: DETAIL_COLORS.ink,
  },
  lock: { width: 45.5, height: 54 },
  kicker: {
    fontFamily: FONTS.display,
    color: DETAIL_COLORS.heading,
    fontSize: 12,
    textAlign: "center",
  },
  name: {
    fontFamily: FONTS.bodyBlack,
    color: DETAIL_COLORS.mintText,
    fontSize: 27,
    textAlign: "center",
  },
  message: {
    fontFamily: FONTS.bodyBold,
    color: DETAIL_COLORS.body,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  notNow: {
    height: 44,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  notNowText: {
    fontFamily: FONTS.bodyBlack,
    color: DETAIL_COLORS.label,
    fontSize: 14,
  },
  bush: {
    position: "absolute",
    left: -27,
    bottom: -20,
    width: 120,
    height: 68.9,
  },
  leaf: {
    position: "absolute",
    right: -23,
    bottom: -16,
    width: 80,
    height: 63.1,
  },
});
