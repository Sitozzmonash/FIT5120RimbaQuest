import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      style={[styles.tile, selected && styles.tileSelected]}
      onPress={onPress}
    >
      <Image source={image} style={styles.image} resizeMode="cover" />
      {selected && (
        <View style={styles.check}>
          <MaterialIcons name="check" size={16} color="#FFFFFF" />
        </View>
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(10,77,38,0.8)"]}
        style={styles.labelOverlay}
      >
        <Text numberOfLines={1} style={styles.labelText}>
          {label}
        </Text>
      </LinearGradient>
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: 156,
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
  tileSelected: { borderWidth: 3, borderColor: "#0A4D26" },
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
  labelOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  labelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
});
