import React, { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { CameraPermissionPrompt } from "./components/CameraPermissionPrompt";
import { CameraHeaderBar } from "./components/CameraHeaderBar";
import { ViewfinderOverlay } from "./components/ViewfinderOverlay";
import { CameraControlsBar } from "./components/CameraControlsBar";

export function CameraScreen({
  lastCaptureUri,
  onCapture,
  onBack,
}: {
  lastCaptureUri: string | null;
  onCapture: (uri: string, mimeType: string) => void;
  onBack: () => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) onCapture(photo.uri, "image/jpeg");
    } catch {
      useDiscoveryStore
        .getState()
        .setPhotoError("Your photo couldn't be uploaded. Please try again.");
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        onCapture(
          result.assets[0].uri,
          result.assets[0].mimeType || "image/jpeg",
        );
      }
    } catch {
      useDiscoveryStore
        .getState()
        .setPhotoError("Your photo couldn't be uploaded. Please try again.");
    }
  };

  return (
    <View style={styles.page}>
      {!cameraPermission ? (
        <View style={styles.permissionWrap}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      ) : !cameraPermission.granted ? (
        <CameraPermissionPrompt
          onBack={onBack}
          onRequestPermission={requestCameraPermission}
          onPickFromGallery={() => void pickFromGallery()}
        />
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchOn}
          />

          <CameraHeaderBar onBack={onBack} />

          <ViewfinderOverlay />

          <CameraControlsBar
            lastCaptureUri={lastCaptureUri}
            torchOn={torchOn}
            onPickFromGallery={() => void pickFromGallery()}
            onTakePhoto={() => void takePhoto()}
            onToggleTorch={() => setTorchOn((v) => !v)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0F0B" },
  permissionWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#182019",
  },
});
