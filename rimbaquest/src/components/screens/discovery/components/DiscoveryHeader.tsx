import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";
import { DiscardPhotoModal } from "./DiscardPhotoModal";

export function DiscoveryHeader({
  title,
  onBack,
  confirmDiscard = false,
  onDiscard,
}: {
  title: string;
  onBack: () => void;
  confirmDiscard?: boolean;
  onDiscard?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <View style={styles.row}>
        <Tap
          label="Go back"
          style={styles.backBtn}
          onPress={() => (confirmDiscard ? setConfirming(true) : onBack())}
        >
          <MaterialIcons name="chevron-left" size={20} color="#1B211C" />
        </Tap>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {confirmDiscard && (
        <DiscardPhotoModal
          visible={confirming}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            (onDiscard ?? onBack)();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    minHeight: 56,
  },
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
  title: { color: "#1A1A1A", fontSize: 22, fontWeight: "900", flexShrink: 1 },
});
