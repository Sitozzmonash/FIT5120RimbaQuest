import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { habitatBackground } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GameScreenHeader } from "../../../common/game/GameScreenHeader";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WoodenTabBar } from "../../../common/game/WoodenTabBar";
import { Species } from "../../../../types";
import { WildlifeCardOption } from "../../../../types/wildlifeMatch";
import { ErrorNote } from "../shared/ErrorNote";
import { Tab, Card } from "./cardTypes";
import { CardTile } from "./CardTile";
import { CardDetailModal } from "./CardDetailModal";

const INK = GAME_COLORS.ink;
const COLUMNS = 2;

export function CardPicker({
  habitat,
  inviteCode,
  hint,
  species,
  cardOptions,
  useLabel,
  onBack,
  onUse,
  onRetry,
  pending,
  error,
}: {
  habitat: string;
  inviteCode?: string;
  hint?: string;
  species: Species[];
  cardOptions: WildlifeCardOption[] | null;
  useLabel: string;
  onBack: () => void;
  onUse: (speciesId: string) => Promise<boolean>;
  onRetry: () => void;
  pending: boolean;
  error: string | null;
}) {
  const [tab, setTab] = useState<Tab>("ready");
  const [selected, setSelected] = useState<Card | null>(null);

  const cards = useMemo(() => {
    const byId = new Map(species.map((item) => [item.id, item]));
    return (cardOptions ?? []).flatMap((option) => {
      const item = byId.get(option.species_id);
      return item ? [{ species: item, option }] : [];
    });
  }, [species, cardOptions]);
  const ready = cards.filter((card) => card.option.selectable);
  const resting = cards.filter((card) => !card.option.selectable);
  const shown = tab === "ready" ? ready : resting;
  const rows = Array.from(
    { length: Math.ceil(shown.length / COLUMNS) },
    (_, index) => shown.slice(index * COLUMNS, index * COLUMNS + COLUMNS),
  );

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title="Choose Your Animal"
        onBack={onBack}
        disabled={pending}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.arena}>
          <ExpoImage
            source={habitatBackground(habitat)}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="center"
          />
          <View style={styles.kicker}>
            <Text style={styles.pillText}>CURRENT ARENA</Text>
          </View>
          <Text style={styles.arenaTitle}>{habitat}</Text>
          <View style={styles.boostPill}>
            <Text style={styles.pillText}>
              {habitat} animals get +20% Attack & Defence
            </Text>
          </View>
        </View>

        <Text style={styles.hint}>
          {hint ??
            (inviteCode
              ? `Join code ${inviteCode}. Tap a card to see its skills, then use it to enter your friend's match.`
              : "Tap a card to see its skills. Your opponent only sees it when the match begins.")}
        </Text>

        <WoodenTabBar<Tab>
          tabs={[
            { key: "ready", label: `Ready (${ready.length})` },
            { key: "resting", label: `Resting (${resting.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />

        {cardOptions === null && error && !selected ? (
          <ErrorNote
            message={error}
            actionLabel="Try Again"
            onAction={onRetry}
          />
        ) : cardOptions === null ? (
          <ActivityIndicator color={GAME_COLORS.paper} />
        ) : shown.length === 0 ? (
          <Text style={styles.hint}>
            {tab === "ready"
              ? cards.length
                ? "All your cards are resting. They will be ready when their timers end."
                : "No unlocked cards are ready. Discover an animal and pass its card quiz to grow your collection."
              : "No cards are resting. They are all ready to battle!"}
          </Text>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, index) => (
              <View key={index} style={styles.row}>
                {row.map((card) => (
                  <CardTile
                    key={card.species.id}
                    card={card}
                    onPress={() => setSelected(card)}
                  />
                ))}
                {Array.from({ length: COLUMNS - row.length }, (_, pad) => (
                  <View key={`pad-${pad}`} style={styles.tileSpacer} />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CardDetailModal
        card={selected}
        onRepick={() => setSelected(null)}
        onUse={() => {
          if (!selected) return;
          void onUse(selected.species.id).then((success) => {
            if (success) setSelected(null);
          });
        }}
        useLabel={useLabel}
        pending={pending}
        error={selected ? error : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GAME_COLORS.headerGreen },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 16,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  arena: {
    gap: 8,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "#01A3FE",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 4px 0px ${INK}`,
    alignItems: "flex-start",
  },
  kicker: {
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  arenaTitle: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: "#FFFFFF",
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  boostPill: {
    backgroundColor: GAME_COLORS.goldLight,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: FONTS.button,
    fontSize: 12,
    color: GAME_COLORS.headerGreen,
  },
  hint: {
    fontFamily: FONTS.button,
    fontSize: 14,
    lineHeight: 21,
    color: "#D8ECCF",
    textAlign: "center",
  },
  grid: { gap: 12 },
  row: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  tileSpacer: { flex: 1 },
});
