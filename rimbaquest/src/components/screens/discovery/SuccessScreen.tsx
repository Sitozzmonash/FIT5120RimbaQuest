import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../types";
import { imageFor } from "../../../constants/images";
import { Tap } from "../../common/Tap";

function formatDate(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Step 5 / end of flow: confirms the save. Matches Figma exactly with two
// actions (View New Card, Record Another Discovery) — Battle and Collection
// shortcuts were intentionally dropped from this screen; they remain
// reachable from Home/Collection as before.
export function SuccessScreen({
  selected,
  discoveryLocation,
  firstDiscovery,
  xpAwarded,
  recordedAt,
  onViewCard,
  onRecordAnother,
}: {
  selected: Species;
  discoveryLocation: string;
  firstDiscovery: boolean;
  xpAwarded: number;
  recordedAt: string | null;
  onViewCard: () => void;
  onRecordAnother: () => void;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Success!</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {firstDiscovery ? "New Wildlife Discovered!" : "Discovery Logged!"}
          </Text>
          <View style={[styles.badge, !firstDiscovery && styles.badgeMuted]}>
            <Text style={styles.badgeText}>
              {firstDiscovery
                ? "Level 1 - Discovered"
                : "Already in Your Collection"}
            </Text>
          </View>
        </View>

        <Image source={imageFor(selected)!} style={styles.photo} />

        <View style={styles.namesBlock}>
          <Text style={styles.commonName}>{selected.common_name}</Text>
          <Text style={styles.scientificName}>{selected.scientific_name}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>DATE RECORDED</Text>
            <Text style={styles.summaryValue}>{formatDate(recordedAt)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>DISCOVERY STATUS</Text>
            <Text style={styles.summaryValue}>Confirmed</Text>
          </View>
          {discoveryLocation ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>LOCATION</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {discoveryLocation}
              </Text>
            </View>
          ) : null}
        </View>

        {xpAwarded > 0 ? (
          <View style={styles.xpCard}>
            <MaterialIcons name="military-tech" size={20} color="#0A4D26" />
            <Text style={styles.xpText}>
              +{xpAwarded} Explorer Experience Points
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Tap
            label="View new wildlife card"
            style={styles.primaryBtn}
            onPress={onViewCard}
          >
            <Text style={styles.primaryText}>View New Card</Text>
          </Tap>
          <Tap
            label="Record another discovery"
            style={styles.secondaryBtn}
            onPress={onRecordAnother}
          >
            <Text style={styles.secondaryText}>Record Another Discovery</Text>
          </Tap>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { height: 56, justifyContent: "center", paddingHorizontal: 20 },
  headerTitle: { color: "#1A1A1A", fontSize: 22, fontWeight: "800" },
  content: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
  titleBlock: { alignItems: "center", gap: 8, width: "100%" },
  title: {
    color: "#1A1A1A",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFB300",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeMuted: { backgroundColor: "#EDF5EF", borderColor: "#D8EDD8" },
  badgeText: { color: "#0A4D26", fontSize: 12, fontWeight: "800" },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  namesBlock: { alignItems: "center", gap: 4 },
  commonName: { color: "#1A1A1A", fontSize: 24, fontWeight: "800" },
  scientificName: { color: "#1A1A1A", fontSize: 14, fontStyle: "italic" },
  summaryCard: {
    width: "100%",
    backgroundColor: "#F4FCF6",
    borderRadius: 24,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryLabel: { color: "#1A1A1A", fontSize: 12, fontWeight: "600" },
  summaryValue: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 1,
    textAlign: "right",
  },
  xpCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: "#F4FCF6",
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  xpText: { color: "#1A1A1A", fontSize: 14, fontWeight: "800" },
  actions: { width: "100%", gap: 12, marginTop: 4 },
  primaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  secondaryText: { color: "#0A4D26", fontSize: 16, fontWeight: "800" },
});
