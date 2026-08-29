import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../common/Tap";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoveryStepIndicator } from "./components/DiscoveryStepIndicator";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";

// Step 1b: shown right after taking or picking a photo, before the category
// step.
export function PhotoPreviewScreen({
  photo,
  onRetake,
  onUpload,
}: {
  photo: { uri: string };
  onRetake: () => void;
  onUpload: () => void;
}) {
  const [enlarged, setEnlarged] = useState(false);

  return (
    <View style={styles.page}>
      <DiscoveryHeader title="Record a Discovery" onBack={onRetake} />

      <View style={styles.body}>
        <DiscoveryStepIndicator step={1} />

        <View style={styles.intro}>
          <Text style={styles.title}>Review Your Photo</Text>
          <Text style={styles.subtitle}>
            Make sure the wildlife is clearly visible before continuing.
          </Text>
        </View>

        <Tap
          label="Enlarge photo"
          style={styles.imageWrap}
          onPress={() => setEnlarged(true)}
        >
          <Image source={photo} style={styles.image} resizeMode="contain" />
          <View style={styles.zoomHint}>
            <MaterialIcons name="zoom-in" size={20} color="#FFFFFF" />
          </View>
        </Tap>
      </View>

      <DiscoveryBottomNav
        onBack={onRetake}
        backLabel="Retake"
        nextLabel="Upload Photo"
        onNext={onUpload}
      />

      <Modal
        visible={enlarged}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlarged(false)}
      >
        <Tap
          label="Close enlarged photo"
          style={styles.lightboxBackdrop}
          onPress={() => setEnlarged(false)}
        >
          <Image
            source={photo}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
        </Tap>
        <Tap
          label="Close"
          style={styles.lightboxCloseBtn}
          onPress={() => setEnlarged(false)}
        >
          <MaterialIcons name="close" size={22} color="#FFFFFF" />
        </Tap>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  body: { flex: 1, padding: 16, gap: 16 },
  intro: { gap: 6 },
  title: { color: "#1A1A1A", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  subtitle: {
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  imageWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F0F4F1",
  },
  image: { width: "100%", height: "100%" },
  zoomHint: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: { width: "100%", height: "100%" },
  lightboxCloseBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
