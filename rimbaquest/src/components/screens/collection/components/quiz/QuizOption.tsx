import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { ScaleTap } from "../../../../common/ScaleTap";
import { DETAIL_COLORS } from "../detail/detailTheme";

// One answer pill with a radio dot; the picked answer turns green and stands up.
export function QuizOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <ScaleTap
      label={label}
      style={[styles.option, selected ? styles.selected : styles.idle]}
      onPress={onPress}
      pressedScale={0.97}
    >
      {/* {selected && <View style={styles.shade} />} */}
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.dot} />}
      </View>
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 16,
    overflow: "hidden",
  },
  idle: { backgroundColor: DETAIL_COLORS.paper, borderBottomWidth: 4 },
  selected: { backgroundColor: DETAIL_COLORS.green, borderBottomWidth: 7 },
  shade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    backgroundColor: "rgba(7, 60, 29, 0.35)",
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 10,
  },
  radioSelected: { backgroundColor: DETAIL_COLORS.paper },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DETAIL_COLORS.ink },
  text: { flex: 1, fontFamily: FONTS.bodySemiBold, color: DETAIL_COLORS.ink, fontSize: 14 },
  textSelected: { fontFamily: FONTS.bodyBold, color: "#FFFFFF" },
});
