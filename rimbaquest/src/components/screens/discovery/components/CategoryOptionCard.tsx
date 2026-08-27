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

export function CategoryOptionCard({
  image,
  label,
  description,
  selected,
  onPress,
}: {
  image: ImageSourcePropType;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Tap
      label={selected ? `${label} (selected)` : `Choose ${label}`}
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.thumbWrap}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        {selected && (
          <View style={styles.check}>
            <MaterialIcons name="check" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "row",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8EDD8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: { borderWidth: 2, borderColor: "#0A4D26" },
  thumbWrap: { width: 90, maxHeight: 90, backgroundColor: "#E4E8E5" },
  image: { width: "100%", height: "100%" },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  label: { color: "#1A1A1A", fontSize: 15, fontWeight: "800" },
  description: {
    color: "#3F4A43",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
});
