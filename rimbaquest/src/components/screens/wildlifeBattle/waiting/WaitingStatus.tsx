import React from "react";
import {
  ActivityIndicator,
  Animated,
  ImageStyle,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AUTH_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { formatTimeLeft, useNow } from "../shared/countdown";
import { Chip } from "../shared/Chip";
import { floatStyle, useLoop } from "../shared/useLoop";

function Dots() {
  const pulse = useLoop(700);
  const opacity = (from: number, to: number) => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [from, to] }),
  });
  return (
    <>
      <Animated.Text style={opacity(1, 0.3)}>.</Animated.Text>
      <Animated.Text style={opacity(0.6, 0.6)}>.</Animated.Text>
      <Animated.Text style={opacity(0.3, 1)}>.</Animated.Text>
    </>
  );
}

export function WaitingStatus({
  friendName,
  expiresAt,
}: {
  friendName?: string;
  expiresAt: string | null | undefined;
}) {
  const bob = useLoop(1600);
  const timeLeft = formatTimeLeft(expiresAt, useNow());
  return (
    <View style={styles.row}>
      {/* <Animated.Image
        source={AUTH_IMAGES.heroTigerSunBear}
        style={[styles.mascot as ImageStyle, floatStyle(bob)]}
        resizeMode="contain"
      /> */}
      <View style={styles.text} accessibilityLiveRegion="polite">
        <Text style={styles.title}>
          {friendName ? `Waiting for ${friendName}` : "Waiting for your friend"}
          <Dots />
        </Text>
        <View style={styles.checking}>
          <ActivityIndicator size="small" color="#9BE07A" />
          <Text style={styles.checkingText}>Checking automatically</Text>
        </View>
        {timeLeft ? (
          <View style={styles.expiryChip}>
            <Chip text={`Expires in ${timeLeft}`} tone="expiry" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  mascot: { width: 140, height: 95 },
  text: { flex: 1, alignItems: "center", gap: 6 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 23,
    color: GAME_COLORS.woodText,
    textAlign: "center",
  },
  checking: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  expiryChip: { alignSelf: "center" },
  checkingText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 12,
    color: "#D8ECCE",
  },
});
