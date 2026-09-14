import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../../types";
import { imageFor } from "../../../../constants/images";
import { Tap } from "../../../common/Tap";

export function SpeciesOptionCard({
  species,
  selected,
  disabled,
  onPress,
}: {
  species: Species;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Tap
      label={
        selected
          ? `${species.common_name} selected`
          : `Choose ${species.common_name}`
      }
      style={[styles.card, selected && styles.cardSelected]}
      disabled={disabled}
      onPress={onPress}
    >
      <Image
        source={imageFor(species)!}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.imageShade} />
      <Text style={styles.name} numberOfLines={2}>
        {species.common_name}
      </Text>
      {selected ? (
        <View style={styles.checkBadge}>
          <MaterialIcons name="check" size={18} color="#FFFFFF" />
        </View>
      ) : null}
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.5%",
    height: 158,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8E6DC",
    backgroundColor: "#E8EFE9",
  },
  cardSelected: { borderWidth: 3, borderColor: "#12B347" },
  image: { width: "100%", height: "100%" },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  name: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  checkBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#087B35",
  },
});
