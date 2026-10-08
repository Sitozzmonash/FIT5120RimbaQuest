import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { LOCATION_COLORS } from "../locationsTheme";

const DASHES = Array.from({ length: 24 }, (_, index) => index);

export function SectionDashes() {
  return (
    <View style={styles.dashes}>
      {DASHES.map((index) => (
        <View key={index} style={styles.dash} />
      ))}
    </View>
  );
}

export function DetailSection({
  title,
  divider = true,
  children,
}: {
  title: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {divider ? <SectionDashes /> : null}
      <View style={styles.body}>
        <Text style={styles.heading}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

export function DetailText({
  children,
  underline = false,
}: {
  children: React.ReactNode;
  underline?: boolean;
}) {
  return (
    <Text style={[styles.text, underline && styles.underline]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  section: { alignSelf: "stretch", gap: 12 },
  dashes: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    height: 3,
    alignItems: "center",
    overflow: "hidden",
  },
  dash: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: LOCATION_COLORS.dash,
  },
  body: { gap: 8 },
  heading: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 20,
    color: LOCATION_COLORS.ink,
  },
  text: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    lineHeight: 18,
    color: LOCATION_COLORS.brownText,
  },
  underline: { textDecorationLine: "underline" },
});
