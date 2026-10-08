import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { BATTLE_IMAGES, imageFor } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
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

function ZapBadge() {
  return (
    <View style={styles.zapBadge}>
      <Image
        source={BATTLE_IMAGES.zap}
        style={styles.zapBadgeIcon as ImageStyle}
        resizeMode="contain"
      />
    </View>
  );
}

// Collection card, gold when it matches the arena.
export function CardTile({
  card,
  onPress,
}: {
  card: Card;
  onPress: () => void;
}) {
  const picture = imageFor(card.species);
  const boosted = card.option.habitat_match;
  const now = useNow();
  const timeLeft = formatTimeLeft(card.option.rest_until, now);
  const statusLabel = !card.option.selectable ? `Resting · ${timeLeft ?? "ready soon"}` : null;
  return (
    <CollectionCard
      species={card.species}
      discovered
      tag={card.option.selectable ? null : "Resting"}
      label={`${card.species.common_name}. ${boosted ? "Habitat match, 20 percent Attack and Defence bonus" : "No habitat bonus"}.${statusLabel ? ` ${statusLabel}.` : ""}`}
      onPress={onPress}
      disabled={!card.option.selectable}
      image={picture ? undefined : <View style={styles.tilePhotoEmpty} />}
      badge={boosted ? <ZapBadge /> : null}
      footer={
        statusLabel ? <Text style={styles.tileRest}>{statusLabel}</Text> : null
      }
      style={[
        boosted && styles.tileBoosted,
        !card.option.selectable && styles.tileResting,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tileBoosted: { backgroundColor: GAME_COLORS.goldLight },
  tileResting: { opacity: 0.6 },
  tilePhotoEmpty: { flex: 1, backgroundColor: "#2F6B3E" },
  tileRest: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10,
    color: "#7A3500",
    textAlign: "center",
  },
  zapBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: GAME_COLORS.headerGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  zapBadgeIcon: { width: 24, height: 24 },
});
