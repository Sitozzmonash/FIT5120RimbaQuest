import React, { useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GuideInfoButton } from "../../common/game/GuideInfoButton";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useUserStore } from "../../../store/useUserStore";
import { photoContextFromExif } from "../../../utils/photoContext";
import { pickGalleryPhoto, takeSystemCameraPhoto } from "../../../utils/systemCamera";
import { CameraPermissionPrompt } from "./components/CameraPermissionPrompt";
import { CameraHeaderBar } from "./components/CameraHeaderBar";
import { ViewfinderOverlay } from "./components/ViewfinderOverlay";
import { CameraControlsBar } from "./components/CameraControlsBar";

export function CameraScreen() {
  const insets = useSafeAreaInsets();
  const lastCaptureUri = useUserStore(
    (state) => state.recentCaptures[0]?.photo_url ?? null,
  );
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);

  const takePhoto = async () => {
    try {
      // Web normally skips this screen (see useDiscoveryStore.start); it is
      // only reached when opening the phone's camera app failed.
      const photo =
        Platform.OS === "web"
          ? await takeSystemCameraPhoto()
          : await cameraRef.current
              ?.takePictureAsync({ quality: 1, exif: true })
              .then((shot) =>
                shot?.uri
                  ? {
                      uri: shot.uri,
                      mimeType: "image/jpeg",
                      context: photoContextFromExif("camera", shot.exif),
                    }
                  : null,
              );
      if (photo) {
        useDiscoveryStore
          .getState()
          .capturePhoto(photo.uri, photo.mimeType, photo.context);
      }
    } catch {
      useDiscoveryStore
        .getState()
        .setPhotoError("We couldn't use that photo. Please try again.");
    }
  };

  const pickFromGallery = async () => {
    try {
      const photo = await pickGalleryPhoto();
      if (photo) {
        useDiscoveryStore
          .getState()
          .capturePhoto(photo.uri, photo.mimeType, photo.context);
      }
    } catch {
      useDiscoveryStore
        .getState()
        .setPhotoError("We couldn't use that photo. Please try again.");
    }
  };

  return (
    <View style={styles.page}>
      {Platform.OS === "web" ? (
        <>
          <CameraHeaderBar />

          <ViewfinderOverlay />

          <CameraControlsBar
            lastCaptureUri={lastCaptureUri}
            onPickFromGallery={() => void pickFromGallery()}
            onTakePhoto={() => void takePhoto()}
          />
        </>
      ) : !cameraPermission ? (
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
      <View style={[styles.infoButton, { top: insets.top + 9 }]}>
        <GuideInfoButton topic="capture" dark />
      </View>
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
  infoButton: { position: "absolute", right: 16 },
});
