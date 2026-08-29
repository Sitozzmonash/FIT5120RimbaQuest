import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WILDLIFE_FILTERS } from "../../../../constants/seed";
import { Tap } from "../../../common/Tap";
import { styles as globalStyles } from "../../../../styles/theme";

export function LocationsListHero({
  title,
  onBack,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
}: {
  title: string;
  onBack: () => void;
  search: string;
  setSearch: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <Tap label="Go back" style={styles.backBtn} onPress={onBack}>
          <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
        </Tap>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.disclaimerQuote}>
        <MaterialIcons name="lightbulb" size={48} color="#FFC314" />
        <Text style={styles.disclaimerText}>
          Wildlife sightings are never guaranteed!
        </Text>
      </View>

      <View>
        <View style={[globalStyles.searchBox, styles.searchBox]}>
          <Text style={globalStyles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Search locations or areas"
            placeholderTextColor="#879089"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            style={globalStyles.searchInput}
          />
          {search.length > 0 && (
            <Tap
              label="Clear"
              style={globalStyles.searchClear}
              onPress={() => setSearch("")}
            >
              <Text style={globalStyles.searchClearText}>×</Text>
            </Tap>
          )}
        </View>

        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {WILDLIFE_FILTERS.map((item) => {
            const active = categoryFilter === item.id;
            return (
              <Tap
                key={item.id}
                label={`Filter ${item.label}`}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryFilter(item.id)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {item.label}
                </Text>
              </Tap>
            );
          })}
        </ScrollView> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "#0A4D26", gap: 4 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 56,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", flexShrink: 1 },
  disclaimerQuote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  disclaimerText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  searchBox: { marginHorizontal: 20, marginBottom: 32 },
  chips: { gap: 8, paddingHorizontal: 20, paddingBottom: 20, marginBottom: 10 },
  chip: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: "#FFFFFF" },
  chipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
  },
  chipTextActive: { color: "#0A4D26" },
});
