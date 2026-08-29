import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function BattleHeaderBar({ title }: { title: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Text style={styles.title} numberOfLines={1}>
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
  title: { color: "#1B211C", fontSize: 22, fontWeight: "900", flexShrink: 1 },
});
