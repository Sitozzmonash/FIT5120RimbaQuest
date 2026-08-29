import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { CameraView } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { DiscoveryStepIndicator } from "./components/DiscoveryStepIndicator";

// Step 1 of the discovery flow: a full-bleed camera viewfinder with a
// corner-bracket framing guide, a last-capture thumbnail that doubles as
// the gallery-import shortcut, and a torch toggle.
export function CameraScreen({
  cameraRef,
  cameraPermission,
  photoError,
  lastCaptureUri,
  onRequestPermission,
  onTakePhoto,
  onPickFromGallery,
  onBack,
}: {
  cameraRef: React.RefObject<CameraView | null>;
  cameraPermission: { granted?: boolean } | null;
  photoError: string | null;
  lastCaptureUri: string | null;
  onRequestPermission: () => void;
  onTakePhoto: () => void;
  onPickFromGallery: () => void;
  onBack: () => void;
}) {
  const [torchOn, setTorchOn] = useState(false);

  return (
    <View style={styles.page}>
      {!cameraPermission ? (
        <View style={styles.permissionWrap}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      ) : !cameraPermission.granted ? (
        <View style={styles.permissionWrap}>
          <Tap label="Go back" style={styles.permissionBack} onPress={onBack}>
            <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
          </Tap>
          <Text style={styles.permissionTitle}>
            Point your camera at the wildlife, then take a photo or choose one
            from your gallery.
          </Text>
          {photoError ? (
            <Text style={styles.errorBanner}>{photoError}</Text>
          ) : null}
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
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchOn}
          />

          <View style={styles.headerBar}>
            <View style={styles.navRow}>
              <Tap label="Go back" style={styles.navBackBtn} onPress={onBack}>
                <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
              </Tap>
              <Text style={styles.brand}>
                Rimba<Text style={styles.brandAccent}>Quest</Text>
              </Text>
              <View style={styles.navSpacer} />
            </View>
            <DiscoveryStepIndicator step={1} variant="dark" />
          </View>

          <View style={styles.viewfinder}>
            <View style={styles.instructionBanner}>
              <View style={styles.pulseDot} />
              <Text style={styles.instructionText}>
                Point at wildlife & tap to capture
              </Text>
            </View>

            <View style={styles.frame}>
              <View style={[styles.cornerH, styles.cornerTL]} />
              <View style={[styles.cornerV, styles.cornerTL]} />
              <View style={[styles.cornerH, styles.cornerTR]} />
              <View style={[styles.cornerV, styles.cornerTR]} />
              <View style={[styles.cornerH, styles.cornerBL]} />
              <View style={[styles.cornerV, styles.cornerBL]} />
              <View style={[styles.cornerH, styles.cornerBR]} />
              <View style={[styles.cornerV, styles.cornerBR]} />
              <View style={styles.reticleH} />
              <View style={styles.reticleV} />
            </View>

            {photoError ? (
              <Text style={styles.errorBanner}>{photoError}</Text>
            ) : null}

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Photo is a personal record, not AI identification
              </Text>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <Tap
              label="Open device gallery"
              style={styles.thumbBtn}
              onPress={onPickFromGallery}
            >
              {lastCaptureUri ? (
                <Image
                  source={{ uri: lastCaptureUri }}
                  style={styles.thumbImage}
                />
              ) : (
                <MaterialIcons name="photo-library" size={22} color="#FFFFFF" />
              )}
            </Tap>
            <Tap
              label="Take photo"
              style={styles.shutterOuter}
              onPress={onTakePhoto}
            >
              <View style={styles.shutterInner} />
            </Tap>
            <Tap
              label={torchOn ? "Turn flash off" : "Turn flash on"}
              style={styles.flashBtn}
              onPress={() => setTorchOn((v) => !v)}
            >
              <MaterialIcons
                name={torchOn ? "flash-on" : "flash-off"}
                size={22}
                color="#FFFFFF"
              />
            </Tap>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0F0B" },
  permissionWrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#182019",
  },
  permissionBack: {
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
  permissionTitle: {
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
  viewfinder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  instructionBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.67)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#78B833",
  },
  instructionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  frame: {
    width: 240,
    height: 240,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  cornerH: {
    position: "absolute",
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  cornerV: {
    position: "absolute",
    width: 6,
    height: 32,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },
  reticleH: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 80,
    height: 1,
    marginLeft: -40,
    backgroundColor: "#A1E31D",
    opacity: 0.3,
  },
  reticleV: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 1,
    height: 80,
    marginTop: -40,
    backgroundColor: "#A1E31D",
    opacity: 0.3,
  },
  disclaimer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  disclaimerText: {
    color: "#9EADA3",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B0F0B",
    height: 150,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 34,
  },
  thumbBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  thumbImage: { width: "100%", height: "100%" },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#0B0F0B",
  },
  flashBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
});
