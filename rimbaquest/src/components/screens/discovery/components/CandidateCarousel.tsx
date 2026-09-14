import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Species } from "../../../../types";
import { CandidateCard } from "./CandidateCard";

export function CandidateCarousel({
  candidates,
  verifiedId,
}: {
  candidates: Species[];
  verifiedId: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {candidates.map((item) => (
        <CandidateCard
          key={item.id}
          species={item}
          verified={item.id === verifiedId}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
});
