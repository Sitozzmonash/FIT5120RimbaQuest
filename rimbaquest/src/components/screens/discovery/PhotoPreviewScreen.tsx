import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
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

        <View style={styles.imageWrap}>
          <Image source={photo} style={styles.image} resizeMode="contain" />
        </View>
      </View>

      <DiscoveryBottomNav
        onBack={onRetake}
        backLabel="Retake"
        nextLabel="Upload Photo"
        onNext={onUpload}
      />
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
});
