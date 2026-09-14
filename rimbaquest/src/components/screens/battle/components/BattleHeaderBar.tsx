import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function BattleHeaderBar({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, onBack && styles.barWithBack]}>
        {onBack && (
          <Tap label="Go back" style={styles.backBtn} onPress={onBack}>
            <MaterialIcons name="chevron-left" size={20} color="#1B211C" />
          </Tap>
        )}
        <Text style={[styles.title, onBack && styles.titleWithBack]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2ECE4",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    paddingHorizontal: 20,
  },
  barWithBack: { justifyContent: "flex-start", gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#1B211C", fontSize: 22, fontWeight: "900", flexShrink: 1 },
  titleWithBack: { flex: 1 },
});
