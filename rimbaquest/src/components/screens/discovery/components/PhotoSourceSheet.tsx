import React from "react";
import { StyleSheet, View } from "react-native";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { pickGalleryPhoto, takeSystemCameraPhoto } from "../../../../utils/systemCamera";
import { GameButton } from "../../../common/game/GameButton";
import { BottomSheet } from "../../wildlifeBattle/lobby/chooseBattle/BottomSheet";

// Web only: replaces the in-app camera screen with a choice between the
// phone's camera app and its photo library. Mounted once at the app root so
// every "take a photo" entry point can open it.
export function PhotoSourceSheet() {
  const sheet = useDiscoveryStore((state) => state.photoSourceSheet);
  const { choosePhotoSource, closePhotoSourceSheet } = useDiscoveryStore.getState();

  return (
    <BottomSheet
      visible={sheet !== null}
      title={sheet?.mode === "retake" ? "Try another photo" : "Record a discovery"}
      onClose={closePhotoSourceSheet}
    >
      <View style={styles.actions}>
        <GameButton
          label="Take Photo"
          size="m"
          onPress={() => choosePhotoSource(takeSystemCameraPhoto)}
        />
        <GameButton
          label="Choose from Gallery"
          size="m"
          variant="secondary"
          onPress={() => choosePhotoSource(pickGalleryPhoto)}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 14, paddingTop: 8 },
});
