import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { API_BASE } from "../../../../constants/config";
import { FunFact } from "../../../../types";

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
          setFacts(Array.isArray(payload.facts) ? payload.facts.slice(0, 10) : []);
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

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color="#0B7A35" />
        <Text style={styles.stateText}>Loading fun facts…</Text>
      </View>
    );
  }

  if (!facts.length) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>
          More wildlife facts for this animal are coming soon.
        </Text>
      </View>
    );
  }

  return (
    <>
      {facts.map((fact, idx) => (
        <React.Fragment key={fact.display_order}>
          <View style={styles.detailFactRow}>
            <Text style={styles.factNumber}>{idx + 1}</Text>
            <View style={styles.factContent}>
              <Text style={styles.detailFactText}>{fact.fact_text}</Text>
              {/* <Text style={styles.sourceText}>Source: {fact.source_name}</Text> */}
            </View>
          </View>
          {idx < facts.length - 1 && <View style={styles.detailDivider} />}
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  detailFactRow: { paddingVertical: 14, flexDirection: "row", gap: 10 },
  factNumber: { color: "#0B7A35", fontWeight: "800", fontSize: 14 },
  factContent: { flex: 1, gap: 5 },
  detailFactText: { color: "#1A1A1A", fontSize: 14, lineHeight: 20 },
  sourceText: { color: "#566159", fontSize: 12, lineHeight: 16 },
  detailDivider: { height: 1, backgroundColor: "#E6E6E6" },
  state: { paddingVertical: 28, alignItems: "center", gap: 10 },
  stateText: { color: "#566159", fontSize: 14, lineHeight: 20, textAlign: "center" },
});
