import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { Tap } from "../../../common/Tap";
import { DISCOVERY_COLORS } from "./discoveryTheme";

export function LocationRow({
  value,
  onPress,
}: {
  value: string;
  onPress: () => void;
}) {
  return (
    <Tap label="Change location" style={styles.row} onPress={onPress}>
      <MaterialIcons name="place" size={20} color={DISCOVERY_COLORS.green} />
      <View style={styles.text}>
        <Text style={styles.label}>LOCATION</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <MaterialIcons
        name="expand-more"
        size={22}
        color={DISCOVERY_COLORS.heading}
      />
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  text: { flex: 1 },
  label: {
    fontFamily: FONTS.bodyBlack,
    color: DISCOVERY_COLORS.label,
    fontSize: 10,
    letterSpacing: 1,
  },
  value: {
    fontFamily: FONTS.bodyExtraBold,
    color: DISCOVERY_COLORS.heading,
    fontSize: 15,
  },
});
