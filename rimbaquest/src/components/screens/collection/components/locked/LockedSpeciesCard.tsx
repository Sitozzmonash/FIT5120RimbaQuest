import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { Species } from "../../../../../types";
import { WoodCard } from "../../../../common/game/WoodCard";
import { LOCKED_COLORS } from "./lockedAssets";
import { NotFoundPill } from "./NotFoundPill";
import { WhereToLookRow } from "./WhereToLookRow";

// Name plank with category, then what we know about the animal so far.
export function LockedSpeciesCard({ species }: { species: Species }) {
  return (
    <WoodCard
      title={species.common_name}
      largeTitle
      titleAccessory={
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{species.category}</Text>
        </View>
      }
      bodyStyle={styles.body}
    >
      <Text style={styles.scientific}>{species.scientific_name}</Text>
      {species.fun_fact ? (
        <Text style={styles.description}>{species.fun_fact}</Text>
      ) : null}
      <NotFoundPill />
      {species.habitat ? <WhereToLookRow habitat={species.habitat} /> : null}
    </WoodCard>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 1,
    backgroundColor: LOCKED_COLORS.mint,
    borderWidth: 2,
    borderColor: LOCKED_COLORS.ink,
    borderRadius: 999,
  },
  categoryText: {
    fontFamily: FONTS.bodyBlack,
    color: LOCKED_COLORS.mintText,
    fontSize: 12,
  },
  scientific: {
    fontFamily: FONTS.bodyBold,
    fontStyle: "italic",
    color: LOCKED_COLORS.muted,
    fontSize: 14,
    textAlign: "center",
  },
  description: {
    fontFamily: FONTS.bodyBold,
    color: LOCKED_COLORS.body,
    fontSize: 15,
    lineHeight: 21.75,
    textAlign: "center",
  },
});
