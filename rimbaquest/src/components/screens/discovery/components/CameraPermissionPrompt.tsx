import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function CameraPermissionPrompt({
  onBack,
  onRequestPermission,
  onPickFromGallery,
}: {
  onBack: () => void;
  onRequestPermission: () => void;
  onPickFromGallery: () => void;
}) {
  const photoError = useDiscoveryStore((state) => state.photoError);

  return (
    <View style={styles.wrap}>
      <Tap label="Go back" style={styles.backBtn} onPress={onBack}>
        <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
      </Tap>
      <Text style={styles.title}>
        Point your camera at the wildlife, then take a photo or choose one from
        your gallery.
      </Text>
      {photoError ? <Text style={styles.errorBanner}>{photoError}</Text> : null}
      <PrimaryButton
        label="Allow Camera"
        style={styles.primaryBtn}
        onPress={onRequestPermission}
      />
      <Tap
        label="Choose from device gallery"
        style={styles.secondaryBtn}
        onPress={onPickFromGallery}
      >
        <MaterialIcons name="photo-library" size={16} color="#1A1A1A" />
        <Text style={styles.secondaryText}>Choose from Device Gallery</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#182019",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 24,
  },
  primaryBtn: { width: "100%" },
  secondaryBtn: {
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    borderRadius: 23,
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  secondaryText: { color: "#1A1A1A", fontSize: 13, fontWeight: "700" },
  errorBanner: {
    color: "#FFFFFF",
    backgroundColor: "rgba(217,56,58,0.85)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
