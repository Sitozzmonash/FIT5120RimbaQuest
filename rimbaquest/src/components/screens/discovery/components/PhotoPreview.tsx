import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function PhotoPreview({ photo }: { photo: { uri: string } }) {
  const [enlarged, setEnlarged] = useState(false);

  return (
    <View style={styles.wrap}>
      <Tap
        label="Enlarge discovery photo"
        style={styles.photo}
        onPress={() => setEnlarged(true)}
      >
        <Image source={photo} style={styles.image} />
        <View style={styles.zoomBadge}>
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
        </View>
      </Tap>
      <Text style={styles.caption}>Tap photo to enlarge</Text>

      <Modal
        visible={enlarged}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlarged(false)}
      >
        <Tap
          label="Close enlarged photo"
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
  wrap: { alignItems: "center", gap: 8, width: "100%" },
  photo: { width: 160, height: 160, borderRadius: 20, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  zoomBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  caption: { color: "#1A1A1A", fontSize: 13, fontWeight: "500" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalImage: { width: "100%", height: 420 },
  modalHint: { color: "#FFFFFF", marginTop: 12, fontWeight: "700" },
});
