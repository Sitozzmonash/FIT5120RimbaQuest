import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function ProfileHeader({
  title,
  onBack,
  onEdit,
}: {
  title: string;
  onBack: () => void;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Tap label="Go back" style={styles.navBtn} onPress={onBack}>
        <MaterialIcons name="chevron-left" size={20} color="#0A4D26" />
      </Tap>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {onEdit ? (
        <Tap label="Edit Profile" style={styles.navBtn} onPress={onEdit}>
          <MaterialIcons name="edit" size={18} color="#0A4D26" />
        </Tap>
      ) : (
        <View style={styles.navBtnSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    marginBottom: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navBtnSpacer: { width: 40, height: 40 },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#0A4D26",
    fontSize: 20,
    fontWeight: "900",
  },
});
