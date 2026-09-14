import React, { useEffect, useState } from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";

export function PhotoPreviewScreen() {
  const photoUri = useDiscoveryStore((state) => state.photoUri);
  const verifying = useDiscoveryStore((state) => state.verifyingPhoto);
  const verificationError = useDiscoveryStore(
    (state) => state.verificationError,
  );
  const [progress, setProgress] = useState(12);

  const handleRetake = () => {
    useDiscoveryStore.getState().retake();
    useNavigationStore.getState().setScreen("photo");
  };

  const handleTryAgain = () => {
    void useDiscoveryStore.getState().retryPhoto();
  };

  useEffect(() => {
    if (!verifying) return;
    setProgress(12);
    const timer = setInterval(() => {
      setProgress((current) => Math.min(90, current + (current < 55 ? 8 : 3)));
    }, 450);
    return () => clearInterval(timer);
  }, [verifying]);

  if (!photoUri) return null;

  return (
    <View style={styles.page}>
      <Image
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.photoShade} />

      <View style={styles.header}>
        <Tap label="Go back" style={styles.backButton} onPress={handleRetake}>
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </Tap>
        <Text style={styles.brand}>
          Rimba<Text style={styles.brandAccent}>Quest</Text>
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.identifyingCard}>
        <View style={styles.identifyingRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.identifyingText}>
            Looking for the animal in your photo...
          </Text>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>

      <Modal
        visible={Boolean(verificationError)}
        transparent
        animationType="fade"
        onRequestClose={handleRetake}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.failureCard}>
            <Text style={styles.failureEyebrow}>PHOTO NOT CHECKED</Text>
            <Text style={styles.failureTitle}>
              {verificationError?.kind === "failed"
                ? "We couldn't check your wildlife photo right now."
                : "We couldn't find an animal in this photo."}
            </Text>
            <Text style={styles.failureText}>
              {verificationError?.kind === "failed"
                ? "Please try again."
                : "Please try a clearer wildlife photo."}
            </Text>
            <PrimaryButton
              label="Try Again"
              style={styles.tryAgainButton}
              onPress={handleTryAgain}
            />
            <Tap
              label="Capture Again"
              style={styles.captureAgainButton}
              onPress={handleRetake}
            >
              <MaterialIcons name="photo-camera" size={18} color="#0A4D26" />
              <Text style={styles.captureAgainText}>Capture Again</Text>
            </Tap>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#07120B" },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "rgba(10,77,38,0.68)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  headerSpacer: { width: 40, height: 40 },
  brand: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  brandAccent: { color: "#8EDB28" },
  identifyingCard: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "rgba(10,10,10,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  identifyingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pulseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#9AF11A",
  },
  identifyingText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#565656",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#9AF11A" },
  progressText: {
    color: "#FFFFFF",
    width: 34,
    fontSize: 13,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 38,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  failureCard: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  failureEyebrow: { color: "#F05A24", fontSize: 14, fontWeight: "900" },
  failureTitle: {
    color: "#1A1A1A",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
  },
  failureText: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  tryAgainButton: { width: "100%", marginTop: 8 },
  captureAgainButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#0A4D26",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  captureAgainText: { color: "#0A4D26", fontSize: 15, fontWeight: "800" },
});
