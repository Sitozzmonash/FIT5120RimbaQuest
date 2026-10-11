import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { SPECIES_IMAGES, imageFor } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { useSpeciesCatalogStore } from "../../../../store/useSpeciesCatalogStore";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeCombatant } from "../../../../types/wildlifeMatch";
import { Tag } from "./Tag";

const INK = GAME_COLORS.ink;

export function AnimalCard({
  combatant,
  tag,
  tagColor,
  active,
  tilt,
  width,
  photoHeight,
}: {
  combatant: WildlifeCombatant;
  tag: string;
  tagColor: string;
  active: boolean;
  tilt: number;
  width: number;
  photoHeight: number;
}) {
  const species = useSpeciesCatalogStore((state) =>
    state.species.find((item) => item.id === combatant.species_id),
  );
  const photo = species
    ? imageFor(species)
    : SPECIES_IMAGES[combatant.species_id];
  return (
    <View
      style={[
        styles.card,
        active && styles.cardActive,
        { width, transform: [{ rotate: `${tilt}deg` }] },
      ]}
    >
      <View style={[styles.cardPhoto, { height: photoHeight }]}>
        {photo ? (
          <Image
            source={photo}
            style={styles.cardImage as ImageStyle}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.cardTag}>
          <Tag label={tag} color={tagColor} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {combatant.name}
        </Text>
        {/* {species?.scientific_name && photoHeight > 90 ? (
          <Text style={styles.cardScientific} numberOfLines={1}>
            {species.scientific_name}
          </Text>
        ) : null} */}
        {species?.category ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{species.category}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 18,
    boxShadow: `0px 6px 0px ${INK}`,
  },
  cardActive: {
    backgroundColor: "#FFF3C4",
    borderWidth: 4,
    borderColor: "#F2B233",
    boxShadow: `0px 0px 0px 3px ${INK}, 0px 8px 0px 3px ${INK}, 0px 0px 18px 6px rgba(255, 214, 110, 0.75)`,
  },
  cardPhoto: {
    overflow: "hidden",
    backgroundColor: "#2F6B3E",
    borderBottomWidth: 3,
    borderBottomColor: INK,
  },
  cardImage: { width: "100%", height: "100%" },
  cardTag: { position: "absolute", left: 8, top: 8 },
  cardBody: {
    alignItems: "center",
    gap: 3,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  cardName: {
    fontFamily: FONTS.display,
    fontSize: 16,
    lineHeight: 18,
    color: GAME_COLORS.heading,
    textAlign: "center",
  },
  cardScientific: {
    fontFamily: FONTS.bodyBold,
    fontStyle: "italic",
    fontSize: 11,
    color: GAME_COLORS.label,
  },
  categoryPill: {
    marginTop: 2,
    backgroundColor: "#D8ECCE",
    borderWidth: 2,
    borderColor: "#2F7A41",
    borderRadius: 999,
    paddingHorizontal: 9,
  },
  categoryText: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10.5,
    color: "#1A4D2B",
  },
});
