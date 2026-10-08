import React, { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useUserStore } from "../../../store/useUserStore";
import { photoContextFromExif } from "../../../utils/photoContext";
import { CameraPermissionPrompt } from "./components/CameraPermissionPrompt";
import { CameraHeaderBar } from "./components/CameraHeaderBar";
import { ViewfinderOverlay } from "./components/ViewfinderOverlay";
import { CameraControlsBar } from "./components/CameraControlsBar";

export function CameraScreen() {
  const lastCaptureUri = useUserStore(
    (state) => state.recentCaptures[0]?.photo_url ?? null,
  );
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1, exif: true });
      if (photo?.uri) {
        useDiscoveryStore
          .getState()
          .capturePhoto(photo.uri, "image/jpeg", photoContextFromExif("camera", photo.exif));
      }
    } catch {
      useDiscoveryStore
        .getState()
        .setPhotoError("We couldn't use that photo. Please try again.");
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        exif: true,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset?.uri) {
        useDiscoveryStore
          .getState()
          .capturePhoto(
            asset.uri,
            asset.mimeType || "image/jpeg",
            photoContextFromExif("gallery", asset.exif),
          );
      }
    } catch {
      useDiscoveryStore
        .getState()
        .setPhotoError("We couldn't use that photo. Please try again.");
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

          <CameraHeaderBar />

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
