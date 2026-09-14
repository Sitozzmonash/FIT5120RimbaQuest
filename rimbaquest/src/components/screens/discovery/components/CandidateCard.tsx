import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../../types";
import { imageFor } from "../../../../constants/images";

export function CandidateCard({
  species,
  verified,
}: {
  species: Species;
  verified: boolean;
}) {
  return (
    <View style={[styles.card, verified && styles.cardVerified]}>
      <Image
        source={imageFor(species)!}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.shade} />
      <Text style={styles.name} numberOfLines={2}>
        {species.common_name}
      </Text>
      {verified ? (
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="check" size={16} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 84,
    height: 132,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8E6DC",
    backgroundColor: "#E7EDE9",
  },
  cardVerified: {
    width: 116,
    height: 148,
    borderWidth: 3,
    borderColor: "#12B347",
  },
  image: { width: "100%", height: "100%" },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  name: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 8,
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#087B35",
  },
});
