import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { SPECIES_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeCombatant } from "../../../../types/wildlifeMatch";

const INK = GAME_COLORS.ink;

function FinalCard({
  combatant,
  tag,
  tagColor,
  winner,
  tilt,
}: {
  combatant: WildlifeCombatant;
  tag: string;
  tagColor: string;
  winner: boolean;
  tilt: number;
}) {
  const photo = SPECIES_IMAGES[combatant.species_id];
  return (
    <View style={[styles.wrap, { transform: [{ rotate: `${tilt}deg` }] }]}>
      <View style={[styles.card, winner && styles.cardWinner]}>
        <View style={styles.photo}>
          {photo ? (
            <Image
              source={photo}
              style={styles.image as ImageStyle}
              resizeMode="cover"
            />
          ) : null}
          {/* The losing card fades to grey. */}
          {!winner ? <View style={styles.dim} /> : null}
          <View style={[styles.tag, { backgroundColor: tagColor }]}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {combatant.name}
          </Text>
          <Text style={styles.hp}>
            HP {combatant.hp}/{combatant.max_hp}
          </Text>
        </View>
      </View>
      {winner ? (
        <View style={styles.winnerPill}>
          <Text style={styles.winnerText}>WINNER</Text>
        </View>
      ) : null}
    </View>
  );
}

export function FinalCards({
  myCard,
  opponentCard,
  opponentTag,
  won,
  lost,
}: {
  myCard: WildlifeCombatant;
  opponentCard: WildlifeCombatant;
  opponentTag: string;
  won: boolean;
  lost: boolean;
}) {
  return (
    <View style={styles.row}>
      <FinalCard
        combatant={myCard}
        tag="YOU"
        tagColor="#1F6B33"
        winner={won}
        tilt={-3}
      />
      <Text style={styles.vs}>VS</Text>
      <FinalCard
        combatant={opponentCard}
        tag={opponentTag}
        tagColor="#B8431F"
        winner={lost}
        tilt={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingTop: 8,
  },
  vs: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: "#FFB938",
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 1,
  },
  wrap: { width: 150, maxWidth: "40%" },
  card: {
    overflow: "hidden",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  cardWinner: {
    backgroundColor: "#FFF3C4",
    borderWidth: 4,
    borderColor: "#F2B233",
    boxShadow: `0px 0px 0px 3px ${INK}, 0px 7px 0px 3px ${INK}`,
  },
  photo: {
    height: 104,
    overflow: "hidden",
    backgroundColor: "#2F6B3E",
    borderBottomWidth: 3,
    borderBottomColor: INK,
  },
  image: { width: "100%", height: "100%" },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(60, 60, 60, 0.55)",
  },
  tag: {
    position: "absolute",
    left: 6,
    top: 6,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 7,
  },
  tagText: { fontFamily: FONTS.bodyBlack, fontSize: 10, color: "#FFFFFF" },
  body: {
    alignItems: "center",
    gap: 1,
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 15,
    lineHeight: 17,
    color: GAME_COLORS.heading,
    textAlign: "center",
  },
  hp: { fontFamily: FONTS.bodyBlack, fontSize: 12, color: "#C7353A" },
  winnerPill: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    zIndex: 2,
    backgroundColor: GAME_COLORS.goldLight,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  winnerText: {
    fontFamily: FONTS.display,
    fontSize: 13,
    color: GAME_COLORS.goldText,
  },
});
