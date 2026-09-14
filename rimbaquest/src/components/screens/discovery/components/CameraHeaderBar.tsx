import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { Tap } from "../../../common/Tap";
// import { DiscoveryStepIndicator } from "./DiscoveryStepIndicator";

export function CameraHeaderBar() {
  return (
    <View style={styles.headerBar}>
      <View style={styles.navRow}>
        <Tap
          label="Go back"
          style={styles.navBackBtn}
          onPress={() => useNavigationStore.getState().goBack()}
        >
          <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
        </Tap>
        <Text style={styles.brand}>
          Rimba<Text style={styles.brandAccent}>Quest</Text>
        </Text>
        <View style={styles.navSpacer} />
      </View>
      {/* <DiscoveryStepIndicator step={1} variant="dark" /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: { backgroundColor: "rgba(10,77,38,0.65)" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  navSpacer: { width: 40, height: 40 },
  brand: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  brandAccent: { color: "#78B833" },
});
