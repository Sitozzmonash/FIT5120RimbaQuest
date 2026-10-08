import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { WildlifeEvent, WildlifeMatch } from "../../../../types/wildlifeMatch";
import { recentEvents } from "../shared/battleText";

const INK = GAME_COLORS.ink;

// "Asian Elephant used Shell Spin." -> "Shell Spin"
function moveName(event: WildlifeEvent | undefined): string | null {
  const found = event?.message.match(/ used (.+?)\.?$/);
  return found ? found[1] : null;
}

/** "6 moves · Shell Spin dealt the final blow", or who gave up. */
function summary(match: WildlifeMatch, events: WildlifeEvent[]): string {
  const moves =
    match.move_count ??
    events.filter((event) => event.type === "action").length;
  const count = `${moves} ${moves === 1 ? "move" : "moves"}`;
  const forfeit = events.find((event) => event.type === "forfeit");
  if (forfeit) {
    const quitter =
      forfeit.side === match.viewer_side
        ? "You"
        : match.mode === "friend"
          ? "Your friend"
          : "The bot";
    return `${count} · ${quitter} gave up`;
  }
  const finalMove = moveName(
    [...events].reverse().find((event) => event.type === "action"),
  );
  return finalMove ? `${count} · ${finalMove} dealt the final blow` : count;
}

export function BattleRecap({
  match,
  events,
}: {
  match: WildlifeMatch;
  events: WildlifeEvent[];
}) {
  const [open, setOpen] = useState(false);
  const line = summary(match, events);
  const recap = recentEvents(events, 12);
  return (
    <ScaleTap
      label={`Battle recap, ${line}`}
      onPress={() => setOpen((value) => !value)}
      style={styles.recap}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title}>Battle Recap</Text>
          <Text style={styles.line} numberOfLines={1}>
            {line}
          </Text>
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </View>
      {open ? (
        <View style={styles.list}>
          {recap.length ? (
            recap.map((event, index) => (
              <Text
                key={event.id ?? `recap-${index}`}
                style={[styles.item, index === 0 && styles.itemLatest]}
              >
                {event.message}
              </Text>
            ))
          ) : (
            <Text style={styles.item}>No moves were played.</Text>
          )}
        </View>
      ) : null}
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  recap: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 4px 0px ${INK}`,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: GAME_COLORS.heading,
  },
  line: { fontFamily: FONTS.bodyBold, fontSize: 12, color: GAME_COLORS.label },
  chevron: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: INK,
    transform: [{ rotate: "90deg" }],
  },
  chevronOpen: { transform: [{ rotate: "-90deg" }] },
  list: {
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: GAME_COLORS.divider,
  },
  item: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    lineHeight: 17,
    color: GAME_COLORS.body,
  },
  itemLatest: { fontFamily: FONTS.bodyBlack, color: GAME_COLORS.heading },
});
