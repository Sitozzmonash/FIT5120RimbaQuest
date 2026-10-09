import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { API_BASE } from "../../../../constants/config";
import { FONTS } from "../../../../constants/fonts";
import { FunFact } from "../../../../types";
import { DetailCard } from "./detail/DetailCard";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detail/detailTheme";
import { FactRow } from "./detail/FactRow";
import { TabStatus } from "./detail/TabStatus";

export function FactsTab({ speciesId }: { speciesId: string }) {
  const [facts, setFacts] = useState<FunFact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetch(`${API_BASE}/api/v1/species/${speciesId}/fun-facts`)
      .then(async (response) => (response.ok ? response.json() : { facts: [] }))
      .then((payload: { facts?: FunFact[] }) => {
        if (active) {
          setFacts(
            Array.isArray(payload.facts) ? payload.facts.slice(0, 10) : [],
          );
        }
      })
      .catch(() => {
        if (active) setFacts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [speciesId]);

  return (
    <DetailCard>
      <View style={styles.title}>
        <Image
          source={DETAIL_IMAGES.rocks}
          style={styles.rocks}
          resizeMode="contain"
        />
        <Text style={styles.titleText}>Did you know?</Text>
      </View>
      {loading ? (
        <TabStatus loading message="Loading fun facts…" />
      ) : facts.length ? (
        <View>
          {facts.map((fact, idx) => (
            <FactRow
              key={fact.display_order}
              number={idx + 1}
              text={fact.fact_text}
            />
          ))}
        </View>
      ) : (
        <TabStatus message="More wildlife facts for this animal are coming soon." />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: "row", alignItems: "center", gap: 8 },
  rocks: { width: 33.8, height: 24 },
  titleText: {
    fontFamily: FONTS.display,
    color: DETAIL_COLORS.heading,
    fontSize: 20,
  },
});
