import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { ScaleTap } from "../../../common/ScaleTap";
import { Tap } from "../../../common/Tap";
import { DISCOVERY_COLORS, DISCOVERY_IMAGES } from "./discoveryTheme";

const PHOTO_SIZE = 130;

export function PhotoPreview() {
  const photoUri = useDiscoveryStore((state) => state.photoUri);
  const [enlarged, setEnlarged] = useState(false);

  if (!photoUri) return null;
  const photo = { uri: photoUri };

  return (
    <View style={styles.wrap}>
      <View style={styles.tilt}>
        <ScaleTap
          label="Make photo bigger"
          style={styles.polaroid}
          onPress={() => setEnlarged(true)}
        >
          <View style={styles.photoFrame}>
            <Image source={photo} style={styles.image} />
          </View>
          <View style={styles.zoom}>
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </View>
          <Image
            source={DISCOVERY_IMAGES.foliage}
            style={styles.foliage}
            resizeMode="contain"
          />
        </ScaleTap>
      </View>
      <Text style={styles.caption}>Tap photo to enlarge</Text>

      <Modal
        visible={enlarged}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlarged(false)}
      >
        <Tap
          label="Close big photo"
          style={styles.modalBackdrop}
          onPress={() => setEnlarged(false)}
        >
          <Image
            source={photo}
            style={styles.modalImage}
            resizeMode="contain"
          />
          <Text style={styles.modalHint}>Tap to return</Text>
        </Tap>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Top padding keeps the zoom badge clear of the scroll edge.
  wrap: { alignItems: "center", gap: 8, width: "100%", paddingTop: 22 },
  polaroid: {
    padding: 8,
    backgroundColor: "#FFFDF4",
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 15,
  },
  tilt: { transform: [{ rotate: "-2deg" }] },
  photoFrame: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: "#2F6B3E",
    borderWidth: 2,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 9,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  zoom: {
    position: "absolute",
    top: -18,
    right: -18,
    width: 46,
    height: 46 + 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DISCOVERY_COLORS.green,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: DISCOVERY_COLORS.ink,
    borderRadius: 23,
  },
  foliage: {
    position: "absolute",
    left: -27,
    bottom: -18,
    width: 54,
    height: 50,
  },
  caption: { fontFamily: FONTS.bodyBold, color: "#5A6B5A", fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalImage: { width: "100%", height: 420 },
  modalHint: { color: "#FFFFFF", marginTop: 12, fontFamily: FONTS.bodyBold },
});
