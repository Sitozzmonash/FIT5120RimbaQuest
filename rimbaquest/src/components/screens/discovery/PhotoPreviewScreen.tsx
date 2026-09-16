import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  PhotoCheckStage,
  useDiscoveryStore,
} from "../../../store/useDiscoveryStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { VerificationErrorKind } from "../../../types";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";

const SHIMMER_WIDTH = 70;
const SHIMMER_DURATION = 1100;

const FAILURE_COPY: Record<
  VerificationErrorKind,
  { eyebrow: string; title: string; allowRetry: boolean }
> = {
  unsupported_file: {
    eyebrow: "PHOTO NOT SUPPORTED",
    title: "This file can't be used.",
    allowRetry: false,
  },
  no_animal_detected: {
    eyebrow: "NO ANIMAL FOUND",
    title: "We couldn't find an animal in this photo.",
    allowRetry: true,
  },
  low_confidence: {
    eyebrow: "NOT SURE YET",
    title: "We're not sure enough about this one.",
    allowRetry: true,
  },
  species_not_in_catalog: {
    eyebrow: "NOT IN RIMBAQUEST YET",
    title: "That animal isn't one of our supported species.",
    allowRetry: false,
  },
  failed: {
    eyebrow: "PHOTO NOT CHECKED",
    title: "We couldn't check your wildlife photo right now.",
    allowRetry: true,
  },
};

function stageProgress(stage: PhotoCheckStage | null, attempt: number): number {
  switch (stage) {
    case "uploading":
      return 8;
    case "identifying":
      return Math.min(75, 25 + Math.max(0, attempt - 1) * 20);
    case "matching":
      return 85;
    case "saving":
      return 95;
    case "done":
      return 100;
    default:
      return 8;
  }
}

function stageLabel(stage: PhotoCheckStage | null, attempt: number): string {
  switch (stage) {
    case "uploading":
      return "Uploading your photo";
    case "identifying":
      return attempt > 1
        ? "Trying a backup AI model"
        : "Looking for the animal in your photo";
    case "matching":
      return "Matching the species";
    case "saving":
      return "Saving your discovery";
    case "done":
      return "Species identified!";
    case "failed":
    case "unverified":
      return "Photo check finished.";
    default:
      return "Looking for the animal in your photo";
  }
}

export function PhotoPreviewScreen() {
  const photoUri = useDiscoveryStore((state) => state.photoUri);
  const verifying = useDiscoveryStore((state) => state.verifyingPhoto);
  const verificationError = useDiscoveryStore(
    (state) => state.verificationError,
  );
  const verificationCandidates = useDiscoveryStore(
    (state) => state.verificationCandidates,
  );
  const photoCheckStage = useDiscoveryStore((state) => state.photoCheckStage);
  const photoCheckAttempt = useDiscoveryStore(
    (state) => state.photoCheckAttempt,
  );
  const progress = stageProgress(photoCheckStage, photoCheckAttempt);
  const progressAnim = useRef(new Animated.Value(progress)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const wasVerifying = useRef(false);
  const [trackWidth, setTrackWidth] = useState(0);

  const succeeded =
    !verifying && !verificationError && verificationCandidates.length > 0;
  const failed = !verifying && verificationError !== null;
  const terminal = succeeded || failed;

  // The popup only appears after the bar visibly reaches 100%.
  const [resultShown, setResultShown] = useState(false);

  // Cycles the label's trailing dots "." -> ".." -> "..." while a stage is
  // running, so the text visibly moves even when the stage hasn't changed.
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    if (!verifying) {
      setDotCount(1);
      return;
    }
    const interval = setInterval(() => {
      setDotCount((count) => (count % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, [verifying]);

  const handleRetake = () => {
    useDiscoveryStore.getState().retake();
    useNavigationStore.getState().setScreen("photo");
  };

  const handleTryAgain = () => {
    void useDiscoveryStore.getState().retryPhoto();
  };

  const handleViewSpecies = () => {
    useNavigationStore.getState().setScreen("species");
  };

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
        // Web has no native animation driver — RCTAnimation doesn't exist
        // there, so the transform must run on the JS thread or it never
        // updates (native only stays true where it actually helps).
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  useEffect(() => {
    const justStarted = verifying && !wasVerifying.current;
    wasVerifying.current = verifying;

    if (verifying) {
      setResultShown(false);
      if (justStarted) progressAnim.setValue(8);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 400,
        useNativeDriver: false,
      }).start();
      return;
    }
    if (!terminal) return;

    // Success or failure: finish the bar at 100%, then show the popup.
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 500,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setResultShown(true);
    });
  }, [verifying, progress, terminal, progressAnim]);

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
        <Tap
          label={verifying ? "Cancel photo check" : "Go back"}
          style={styles.backButton}
          onPress={handleRetake}
        >
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
            {stageLabel(photoCheckStage, photoCheckAttempt)}
            {verifying ? ".".repeat(dotCount) : ""}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <View
            style={styles.progressTrack}
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shimmerLayer,
                  {
                    transform: [
                      {
                        translateX: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-SHIMMER_WIDTH, trackWidth + SHIMMER_WIDTH],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  style={StyleSheet.absoluteFill}
                  colors={[
                    "rgba(255,255,255,0)",
                    "rgba(255,255,255,0.85)",
                    "rgba(255,255,255,0)",
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </Animated.View>
            </Animated.View>
          </View>
          <Text style={styles.progressText}>{terminal ? 100 : progress}%</Text>
        </View>
        {verifying ? (
          <Tap
            label="Cancel photo check"
            style={styles.cancelCheckButton}
            onPress={handleRetake}
          >
            <Text style={styles.cancelCheckText}>Cancel</Text>
          </Tap>
        ) : null}
      </View>

      <Modal
        visible={resultShown && succeeded}
        transparent
        animationType="fade"
        onRequestClose={handleRetake}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <MaterialIcons name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successEyebrow}>IDENTIFICATION COMPLETE</Text>
            <Text style={styles.successTitle}>
              We have successfully identified your species!
            </Text>
            <Text style={styles.successText}>
              Let's see which animal we found.
            </Text>
            <PrimaryButton
              label="Next"
              style={styles.nextButton}
              onPress={handleViewSpecies}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={resultShown && Boolean(verificationError)}
        transparent
        animationType="fade"
        onRequestClose={handleRetake}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.failureCard}>
            <Text style={styles.failureEyebrow}>
              {(verificationError && FAILURE_COPY[verificationError.kind].eyebrow) ??
                FAILURE_COPY.failed.eyebrow}
            </Text>
            <Text style={styles.failureTitle}>
              {(verificationError && FAILURE_COPY[verificationError.kind].title) ??
                FAILURE_COPY.failed.title}
            </Text>
            <Text style={styles.failureText}>
              {verificationError?.message ?? "Please try again."}
            </Text>
            {verificationError && FAILURE_COPY[verificationError.kind].allowRetry ? (
              <PrimaryButton
                label="Try Again"
                style={styles.tryAgainButton}
                onPress={handleTryAgain}
              />
            ) : null}
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
  progressFill: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#9AF11A",
  },
  shimmerLayer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SHIMMER_WIDTH,
  },
  progressText: {
    color: "#FFFFFF",
    width: 34,
    fontSize: 13,
    fontWeight: "800",
  },
  cancelCheckButton: {
    alignSelf: "flex-start",
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cancelCheckText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 38,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  successCard: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  successIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A4D26",
    marginBottom: 4,
  },
  successEyebrow: { color: "#0A4D26", fontSize: 14, fontWeight: "900" },
  successTitle: {
    color: "#1A1A1A",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
  },
  successText: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  nextButton: { width: "100%", marginTop: 8 },
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
