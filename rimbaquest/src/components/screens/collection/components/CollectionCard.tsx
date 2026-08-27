import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Species } from "../../../../types";
import { imageFor } from "../../../../constants/images";
import { Tap } from "../../../common/Tap";
import { UndiscoveredTape } from "./UndiscoveredTape";

export function CollectionCard({
  species,
  discovered,
  onPress,
}: {
  species: Species;
  discovered: boolean;
  onPress: () => void;
}) {
  return discovered ? (
    <Tap
      label={`View ${species.common_name}`}
      style={styles.collectionCard}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#FFFFFF", "#F4FCF6"]}
        style={styles.collectionCardGradient}
      />
      <View style={styles.collectionCardImageWrap}>
        <Image
          source={imageFor(species)!}
          style={styles.collectionCardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.discoveredTag}>
        <Text style={styles.discoveredTagText}>Discovered</Text>
      </View>
      <Text numberOfLines={1} style={styles.collectionCardName}>
        {species.common_name}
      </Text>
      <Text numberOfLines={1} style={styles.collectionCardScientific}>
        {species.scientific_name}
      </Text>
      <Text style={styles.collectionCardCategory}>{species.category}</Text>
    </Tap>
  ) : (
    <Tap
      label={`Preview undiscovered ${species.common_name}`}
      style={styles.collectionCard}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#FFFFFF", "#F4FCF6"]}
        style={styles.collectionCardGradient}
      />
      <View style={styles.collectionCardImageWrap}>
        <Image
          source={imageFor(species)!}
          style={[styles.collectionCardImage, styles.collectionCardLockedImage]}
          resizeMode="cover"
        />
        <UndiscoveredTape />
      </View>
      <Text numberOfLines={1} style={styles.collectionCardName}>
        {species.common_name}
      </Text>
      <Text style={styles.collectionCardCategory}>{species.category}</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  collectionCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  collectionCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  collectionCardImageWrap: {
    width: "100%",
    height: 100,
    borderRadius: 6,
    overflow: "hidden",
  },
  collectionCardImage: { width: "100%", height: "100%" },
  collectionCardLockedImage: { opacity: 0.25 },
  collectionCardName: {
    color: "#0A4D26",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  collectionCardScientific: {
    color: "#173F6B",
    fontSize: 9,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  collectionCardCategory: {
    color: "#2F7814",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  discoveredTag: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#E8541A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  discoveredTagText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
});
