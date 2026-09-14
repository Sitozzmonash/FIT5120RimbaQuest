import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function CameraControlsBar({
  lastCaptureUri,
  torchOn,
  onPickFromGallery,
  onTakePhoto,
  onToggleTorch,
}: {
  lastCaptureUri: string | null;
  torchOn: boolean;
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
  onToggleTorch: () => void;
}) {
  return (
    <View style={styles.bottomBar}>
      <Tap
        label="Open device gallery"
        style={styles.thumbBtn}
        onPress={onPickFromGallery}
      >
        {lastCaptureUri ? (
          <Image source={{ uri: lastCaptureUri }} style={styles.thumbImage} />
        ) : (
          <MaterialIcons name="photo-library" size={22} color="#FFFFFF" />
        )}
      </Tap>
      <Tap label="Take photo" style={styles.shutterOuter} onPress={onTakePhoto}>
        <View style={styles.shutterInner} />
      </Tap>
      <Tap
        label={torchOn ? "Turn flash off" : "Turn flash on"}
        style={styles.flashBtn}
        onPress={onToggleTorch}
      >
        <MaterialIcons
          name={torchOn ? "flash-on" : "flash-off"}
          size={22}
          color="#FFFFFF"
        />
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
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
