import React from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../../common/Tap";

export function PhotoLightbox({
  source,
  caption,
  onClose,
}: {
  source: ImageSourcePropType | null;
  caption?: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={Boolean(source)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Tap label="Close big picture" style={styles.backdrop} onPress={onClose}>
        {source ? (
          <Image source={source} style={styles.image} resizeMode="contain" />
        ) : null}
      </Tap>
      {caption ? (
        <View style={[styles.caption, { pointerEvents: "none" }]}>
          <MaterialIcons name="place" size={14} color="#FFFFFF" />
          <Text style={styles.captionText} numberOfLines={1}>
            {caption}
          </Text>
        </View>
      ) : null}
      <Tap label="Close" style={styles.close} onPress={onClose}>
        <MaterialIcons name="close" size={22} color="#FFFFFF" />
      </Tap>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  caption: {
    position: "absolute",
    bottom: 48,
    left: 20,
    right: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  captionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  close: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
