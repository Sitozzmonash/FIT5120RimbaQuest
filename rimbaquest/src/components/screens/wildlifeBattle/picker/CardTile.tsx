import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { imageFor } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { CollectionCard } from "../../collection/components/CollectionCard";
import { Card } from "./cardTypes";
import { formatTimeLeft, useNow } from "../shared/countdown";

export function SpeciesPhoto({ source }: { source: number }) {
  return (
    <>
      <ExpoImage
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={12}
      />
      <ExpoImage
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        contentPosition="center"
      />
    </>
  );
}

export function CardTile({
  card,
  onPress,
}: {
  card: Card;
  onPress: () => void;
}) {
  const picture = imageFor(card.species);
  const now = useNow();
  const timeLeft = formatTimeLeft(card.option.rest_until, now);
  const statusLabel = !card.option.selectable ? `Resting · ${timeLeft ?? "ready soon"}` : null;
  return (
    <CollectionCard
      species={card.species}
      discovered
      tag={card.option.selectable ? null : "Resting"}
      label={`${card.species.common_name}.${statusLabel ? ` ${statusLabel}.` : ""}`}
      onPress={onPress}
      disabled={!card.option.selectable}
      image={picture ? undefined : <View style={styles.tilePhotoEmpty} />}
      footer={
        statusLabel ? <Text style={styles.tileRest}>{statusLabel}</Text> : null
      }
      style={!card.option.selectable && styles.tileResting}
    />
  );
}

const styles = StyleSheet.create({
  tileResting: { opacity: 0.6 },
  tilePhotoEmpty: { flex: 1, backgroundColor: "#2F6B3E" },
  tileRest: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10,
    color: "#7A3500",
    textAlign: "center",
  },
});
