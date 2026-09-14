import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export function AiDetectionNotice() {
  return (
    <View style={styles.notice}>
      <MaterialIcons name="info-outline" size={20} color="#667085" />
      <Text style={styles.noticeText}>
        Our photo helper makes its best guess, but it can be wrong.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#D7DADE",
    borderRadius: 15,
    backgroundColor: "#F5F6F7",
  },
  noticeText: {
    flex: 1,
    color: "#344054",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});
