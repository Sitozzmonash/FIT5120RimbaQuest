import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";
import { Tap } from "../../../common/Tap";
import { MaterialIcons } from "@expo/vector-icons";

interface BattleDiceProps {
  roll: number | null;
  rolling: boolean;
  lucky: boolean;
  disabled?: boolean;
  canRoll?: boolean;
  onRoll: () => void;
  reducedMotion?: boolean;
}

export function BattleDice({
  roll,
  rolling,
  lucky,
  disabled = false,
  canRoll = true,
  onRoll,
  reducedMotion = false,
}: BattleDiceProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
    if (!rolling || reducedMotion) return;
    const loop = Animated.loop(Animated.timing(rotateAnim, {
      toValue: 1, duration: 500, easing: Easing.linear, useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [rolling, reducedMotion, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getRollDescription = () => {
    if (rolling) return "Rolling nature dice…";
    if (!canRoll && roll !== null) {
      if (lucky) return "Lucky 6! Special moves bonus active.";
      if (roll >= 4) return `Rolled a ${roll}! Special moves & Brace available.`;
      return `Rolled a ${roll}. Basic Attack & Brace available.`;
    }
    if (roll === null) return "Tap the dice to roll your turn";
    if (lucky) return "Lucky 6! Special move bonus ready.";
    if (roll >= 4) return `Rolled a ${roll}! Special moves & Brace ready!`;
    return `Rolled a ${roll}. Basic Attack & Brace ready!`;
  };

  const isInteractive = canRoll && !disabled && !rolling;

  return (
    <View style={styles.container}>
      <Tap
        label="Roll dice"
        disabled={!isInteractive}
        style={[styles.diceButton, !isInteractive && styles.diceDisabled]}
        onPress={onRoll}
      >
        <Animated.View
          style={[
            styles.diceFace,
            lucky && styles.luckyDice,
            { transform: [{ rotate: spin }] },
          ]}
        >
          {rolling ? (
            <MaterialIcons name="casino" size={32} color="#0BA84A" />
          ) : roll !== null ? (
            <Text style={[styles.diceNumber, lucky && styles.luckyNumber]}>
              {roll}
            </Text>
          ) : (
            <MaterialIcons name="casino" size={32} color="#455A64" />
          )}
        </Animated.View>
        <View style={styles.textColumn}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {rolling ? "Rolling…" : roll !== null ? `Dice: ${roll}` : "Roll Dice"}
            </Text>
            {lucky && (
              <View style={styles.luckyBadge}>
                <MaterialIcons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.luckyBadgeText}>LUCKY</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {getRollDescription()}
          </Text>
        </View>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  diceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8F3",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#A3E6BA",
    gap: 12,
  },
  diceDisabled: {
    opacity: 0.65,
  },
  diceFace: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  luckyDice: {
    borderColor: "#FFB300",
    backgroundColor: "#FFF8E1",
  },
  diceNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1B5E20",
  },
  luckyNumber: {
    color: "#FF8F00",
  },
  textColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1B211C",
  },
  luckyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA000",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    gap: 2,
  },
  luckyBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "#566159",
    marginTop: 2,
  },
});
