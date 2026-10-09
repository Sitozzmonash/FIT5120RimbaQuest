import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { Tap } from "../../../common/Tap";
import { GameButton } from "../../../common/game/GameButton";
import { PHOTO_GUIDANCE } from "./ViewfinderOverlay";

export function CameraPermissionPrompt({
  onRequestPermission,
  onPickFromGallery,
}: {
  onRequestPermission: () => void;
  onPickFromGallery: () => void;
}) {
  const photoError = useDiscoveryStore((state) => state.photoError);

  return (
    <View style={styles.wrap}>
      <Tap
        label="Go back"
        style={styles.backBtn}
        onPress={() => useNavigationStore.getState().goBack()}
      >
        <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
      </Tap>
      <Text style={styles.title}>
        Point your camera at an animal, then take a photo or choose one you
        already have.
      </Text>
      <Text style={styles.guidance}>{PHOTO_GUIDANCE}</Text>
      {photoError ? <Text style={styles.errorBanner}>{photoError}</Text> : null}
      <View style={styles.actions}>
        <GameButton label="Use Camera" onPress={onRequestPermission} />
        <GameButton
          label="Choose a Photo"
          variant="secondary"
          onPress={onPickFromGallery}
        />
      </View>
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
  guidance: {
    color: "#C9D6CC",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 19,
  },
  actions: { alignSelf: "stretch", gap: 8 },
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
