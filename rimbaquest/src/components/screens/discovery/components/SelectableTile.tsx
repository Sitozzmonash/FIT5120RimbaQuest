import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function SelectableTile({
  image,
  label,
  selected,
  onPress,
}: {
  image: ImageSourcePropType;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Tap
      label={selected ? `${label} (selected)` : `Choose ${label}`}
      style={styles.tile}
      onPress={onPress}
    >
      <View style={[styles.imageBox, selected && styles.imageBoxSelected]}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        {selected && (
          <View style={styles.check}>
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
      <Text
        numberOfLines={3}
        style={[styles.labelText, selected && styles.labelTextSelected]}
      >
        {label}
      </Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, gap: 6 },
  imageBox: {
    height: 124,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E4E8E5",
    borderWidth: 1,
    borderColor: "#D8EDD8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageBoxSelected: { borderWidth: 3, borderColor: "#0A4D26" },
  image: { width: "100%", height: "100%" },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    color: "#1A1A1A",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  labelTextSelected: { color: "#0A4D26" },
});
