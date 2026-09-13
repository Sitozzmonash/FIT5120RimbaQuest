import React, { useState, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, TextInput, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../types";
import { BattleDifficulty, BattleEffect } from "../../../types/battle";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { styles as globalStyles } from "../../../styles/theme";
import { BattleHeaderBar } from "./components/BattleHeaderBar";
import { BattleIntroBanner } from "./components/BattleIntroBanner";
import { BattleCardTile } from "./components/BattleCardTile";
import { BattleEmptyState } from "./components/BattleEmptyState";

interface BattleSelectScreenProps {
  unlockedSpecies: Species[];
  selectedCard: Species | null;
  difficulty?: BattleDifficulty;
  unlockedAbilitiesMap?: Record<string, number[]>;
  loadingSlots?: boolean;
  onSelectCard: (card: Species) => void;
  onChangeDifficulty?: (diff: BattleDifficulty) => void;
  onStartBattle: () => void;
  onStartDiscovery: () => void;
  onBack: () => void;
}

export function BattleSelectScreen({
  unlockedSpecies,
  selectedCard,
  difficulty = "standard",
  unlockedAbilitiesMap = {},
  loadingSlots = false,
  onSelectCard,
  onChangeDifficulty,
  onStartBattle,
  onStartDiscovery,
  onBack,
}: BattleSelectScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const hasCards = unlockedSpecies.length > 0;

  // Extract roles and categories
  const roles = useMemo(() => {
    const set = new Set<string>();
    unlockedSpecies.forEach((s) => {
      if (s.role) set.add(s.role.toLowerCase());
    });
    return ["all", ...Array.from(set)];
  }, [unlockedSpecies]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    unlockedSpecies.forEach((s) => {
      if (s.category) set.add(s.category.toLowerCase());
    });
    return ["all", ...Array.from(set)];
  }, [unlockedSpecies]);

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Filtered species list
  const filteredSpecies = useMemo(() => {
    return unlockedSpecies.filter((item) => {
      const matchSearch =
        cleanQuery === "" ||
        item.common_name.toLowerCase().includes(cleanQuery) ||
        item.scientific_name?.toLowerCase().includes(cleanQuery);
      const matchRole =
        selectedRole === "all" ||
        (item.role && item.role.toLowerCase() === selectedRole);
      const matchCat =
        selectedCategory === "all" ||
        (item.category && item.category.toLowerCase() === selectedCategory);
      return matchSearch && matchRole && matchCat;
    });
  }, [unlockedSpecies, cleanQuery, selectedRole, selectedCategory]);

  const isSlotsLoaded = selectedCard ? Object.prototype.hasOwnProperty.call(unlockedAbilitiesMap, selectedCard.id) : false;
  const selectedCardSlots = selectedCard && isSlotsLoaded
    ? (unlockedAbilitiesMap[selectedCard.id] ?? [])
    : [];

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedCategory("all");
  };

  const hasActiveFilters = cleanQuery !== "" || selectedRole !== "all" || selectedCategory !== "all";

  // Helper for slot ability descriptions / effects
  const getAbilityDetails = (slot: number) => {
    if (!selectedCard) return { name: "", desc: "", eff: "" };
    const structured = selectedCard.abilities?.find((a) => a.slot === slot);
    const name =
      slot === 1
        ? structured?.name || selectedCard.ability_1 || "Active 1"
        : slot === 2
        ? structured?.name || selectedCard.ability_2 || "Active 2"
        : selectedCard.passive?.name || selectedCard.ability_3 || "Species Trait";

    const desc =
      slot === 3
        ? selectedCard.passive?.description || ""
        : structured?.description || "";

    const effectBadges: string[] = [];
    const effectsList = (slot === 3 ? (selectedCard.passive as any)?.effects : (structured as any)?.effects) as BattleEffect[] | undefined;
    if (Array.isArray(effectsList) && effectsList.length > 0) {
      for (const eff of effectsList) {
        if (eff.type === "damage") effectBadges.push(`${eff.value} DMG`);
        else if (eff.type === "heal") effectBadges.push(`+${eff.value} HP`);
        else if (eff.type === "shield") effectBadges.push(`+${eff.value} Shield`);
        else if (eff.type === "guard") effectBadges.push(`Guard ${eff.value}`);
        else if (eff.type === "boost") effectBadges.push(`Boost ${eff.value}`);
        else if (eff.type === "weaken") effectBadges.push(`Weaken ${eff.value}`);
        else if (eff.type === "reroll") effectBadges.push("Reroll");
        else if (eff.type === "reduce_damage") effectBadges.push(`Reduce ${eff.value}`);
        else effectBadges.push(`${String(eff.type).toUpperCase()} ${eff.value}`);
      }
    } else {
      if (structured?.multiplier) effectBadges.push(`${structured.multiplier}x DMG`);
      if (structured?.heal_amount) effectBadges.push(`+${structured.heal_amount} HP`);
      if (structured?.shield_amount) effectBadges.push(`+${structured.shield_amount} Shield`);
      if (structured?.energy_cost) effectBadges.push(`${structured.energy_cost} Cost`);
    }

    return { name, desc, eff: effectBadges.join(" · ") };
  };

  const a1 = getAbilityDetails(1);
  const a2 = getAbilityDetails(2);
  const pass = getAbilityDetails(3);

  return (
    <View style={styles.root}>
      <BattleHeaderBar title="Wildlife Card Battles" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BattleIntroBanner />

        {hasCards ? (
          <>
            <View style={styles.headerInfo}>
              <Text style={styles.sectionTitle}>Select Your Battle Card</Text>
              <Text style={styles.sectionSubtitle}>
                Choose from your collected species cards. Each card brings unique Energy, Role, and Passives!
              </Text>
            </View>

            {/* Difficulty Toggle */}
            <View style={styles.diffContainer}>
              <Text style={styles.filterLabel}>Difficulty Mode:</Text>
              <View style={styles.diffButtonsRow}>
                <Tap
                  label="Standard battle difficulty mode"
                  style={[
                    styles.diffBtn,
                    difficulty === "standard" && styles.diffBtnActive,
                  ]}
                  onPress={() => onChangeDifficulty?.("standard")}
                >
                  <Text
                    style={[
                      styles.diffBtnText,
                      difficulty === "standard" && styles.diffBtnTextActive,
                    ]}
                  >
                    Standard Match
                  </Text>
                </Tap>
                <Tap
                  label="Practice battle difficulty mode"
                  style={[
                    styles.diffBtn,
                    difficulty === "practice" && styles.diffBtnActive,
                  ]}
                  onPress={() => onChangeDifficulty?.("practice")}
                >
                  <Text
                    style={[
                      styles.diffBtnText,
                      difficulty === "practice" && styles.diffBtnTextActive,
                    ]}
                  >
                    Practice Match
                  </Text>
                </Tap>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color="#78909C" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search species name…"
                placeholderTextColor="#90A4AE"
                style={styles.searchInput}
                accessibilityLabel="Search collected species"
              />
              {searchQuery.length > 0 && (
                <Tap label="Clear search" onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="clear" size={18} color="#78909C" />
                </Tap>
              )}
            </View>

            {/* Role & Category Filter Chips */}
            <View style={styles.filtersWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {roles.map((r) => (
                  <Tap
                    key={r}
                    label={`Filter by role ${r}`}
                    style={[styles.filterChip, selectedRole === r && styles.filterChipActive]}
                    onPress={() => setSelectedRole(r)}
                  >
                    <Text style={[styles.filterChipText, selectedRole === r && styles.filterChipTextActive]}>
                      {r === "all" ? "All Roles" : r.toUpperCase()}
                    </Text>
                  </Tap>
                ))}
              </ScrollView>

              {categories.length > 2 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {categories.map((c) => (
                    <Tap
                      key={c}
                      label={`Filter by category ${c}`}
                      style={[styles.filterChip, selectedCategory === c && styles.filterChipActive]}
                      onPress={() => setSelectedCategory(c)}
                    >
                      <Text style={[styles.filterChipText, selectedCategory === c && styles.filterChipTextActive]}>
                        {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
                      </Text>
                    </Tap>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Fixed preview panel for currently selected card */}
            {selectedCard && (
              <View style={styles.selectedPreviewBox}>
                <View style={styles.selectedTitleRow}>
                  <Text style={styles.selectedPreviewTitle}>Card Loadout: {selectedCard.common_name}</Text>
                  {loadingSlots && <ActivityIndicator size="small" color="#0BA84A" />}
                </View>
                <View style={styles.selectedStatsRow}>
                  <Text style={styles.statChipText}>⚡ {selectedCard.max_energy || selectedCard.hp || "—"} EN</Text>
                  <Text style={styles.statChipText}>⚔️ {selectedCard.base_attack ?? "—"} ATK</Text>
                  <Text style={styles.statChipText}>🛡️ {(selectedCard.role || "Unknown").toUpperCase()}</Text>
                </View>
                <View style={styles.abilitiesPreviewList}>
                  {/* Active 1 */}
                  <View style={styles.abilityPreviewItem}>
                    <View style={styles.abilityTopLine}>
                      <Text style={styles.abilityPreviewSlot}>Active 1:</Text>
                      <Text style={styles.abilityPreviewName} numberOfLines={1}>{a1.name}</Text>
                      <Text style={[styles.abilityStatusBadge, !selectedCardSlots.includes(1) && styles.abilityStatusBadgeLocked]}>
                        {!isSlotsLoaded ? "Checking…" : selectedCardSlots.includes(1) ? "Unlocked" : "Locked (Quiz 1)"}
                      </Text>
                    </View>
                    {a1.eff ? <Text style={styles.abilityEffectText}>{a1.eff}</Text> : null}
                    {a1.desc ? <Text style={styles.abilityDescText} numberOfLines={2}>{a1.desc}</Text> : null}
                  </View>

                  {/* Active 2 */}
                  <View style={styles.abilityPreviewItem}>
                    <View style={styles.abilityTopLine}>
                      <Text style={styles.abilityPreviewSlot}>Active 2:</Text>
                      <Text style={styles.abilityPreviewName} numberOfLines={1}>{a2.name}</Text>
                      <Text style={[styles.abilityStatusBadge, !selectedCardSlots.includes(2) && styles.abilityStatusBadgeLocked]}>
                        {!isSlotsLoaded ? "Checking…" : selectedCardSlots.includes(2) ? "Unlocked" : "Locked (Quiz 2)"}
                      </Text>
                    </View>
                    {a2.eff ? <Text style={styles.abilityEffectText}>{a2.eff}</Text> : null}
                    {a2.desc ? <Text style={styles.abilityDescText} numberOfLines={2}>{a2.desc}</Text> : null}
                  </View>

                  {/* Passive */}
                  <View style={styles.abilityPreviewItem}>
                    <View style={styles.abilityTopLine}>
                      <Text style={styles.abilityPreviewSlot}>Passive:</Text>
                      <Text style={styles.abilityPreviewName} numberOfLines={1}>{pass.name}</Text>
                      <Text style={[styles.abilityStatusBadge, !selectedCardSlots.includes(3) && styles.abilityStatusBadgeLocked]}>
                        {!isSlotsLoaded ? "Checking…" : selectedCardSlots.includes(3) ? "Unlocked" : "Locked (Quiz 3)"}
                      </Text>
                    </View>
                    {pass.desc ? <Text style={styles.abilityDescText} numberOfLines={2}>{pass.desc}</Text> : null}
                  </View>
                </View>
              </View>
            )}

            {/* Species Grid / Empty Search Results */}
            {filteredSpecies.length > 0 ? (
              <View style={styles.grid}>
                {filteredSpecies.map((item) => (
                  <BattleCardTile
                    key={item.id}
                    species={item}
                    selected={selectedCard?.id === item.id}
                    onPress={() => onSelectCard(item)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyResultsBox}>
                <MaterialIcons name="search-off" size={32} color="#879089" />
                <Text style={styles.emptyResultsTitle}>No species match your filter</Text>
                <Text style={styles.emptyResultsSubtitle}>Try searching a different name or clear active filters.</Text>
                {hasActiveFilters && (
                  <Tap label="Clear all filters" style={styles.clearFiltersBtn} onPress={handleClearFilters}>
                    <Text style={styles.clearFiltersText}>Clear Filters</Text>
                  </Tap>
                )}
              </View>
            )}
          </>
        ) : (
          <BattleEmptyState onStartDiscovery={onStartDiscovery} />
        )}
      </ScrollView>

      {hasCards ? (
        <View style={styles.footer}>
          {selectedCard ? (
            <View style={styles.footerSummary}>
              <Text style={styles.footerSummaryText} numberOfLines={1}>
                Ready: <Text style={styles.footerSummaryBold}>{selectedCard.common_name}</Text> ({selectedCard.role || "Unknown"})
              </Text>
            </View>
          ) : null}
          <PrimaryButton
            label={selectedCard ? `Start Battle with ${selectedCard.common_name}` : "Select a Card to Battle"}
            disabled={!selectedCard}
            onPress={onStartBattle}
          />
          <Tap label="Quit" style={globalStyles.secondary} onPress={onBack}>
            <Text style={globalStyles.secondaryText}>Back</Text>
          </Tap>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 14 },
  headerInfo: { gap: 4 },
  sectionTitle: { color: "#0A4D26", fontSize: 18, fontWeight: "900", marginTop: 4 },
  sectionSubtitle: { color: "#556B2F", fontSize: 12, lineHeight: 16 },
  diffContainer: {
    backgroundColor: "#F4FAF5",
    borderRadius: 14,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E0EFE4",
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2C6B4F",
    textTransform: "uppercase",
  },
  diffButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CFE3D5",
    alignItems: "center",
    justifyContent: "center",
  },
  diffBtnActive: {
    backgroundColor: "#2C6B4F",
    borderColor: "#2C6B4F",
  },
  diffBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#566159",
  },
  diffBtnTextActive: {
    color: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F8F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8E4",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1B211C",
  },
  filtersWrap: {
    gap: 6,
  },
  chipsScroll: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#F1F5F2",
    borderWidth: 1,
    borderColor: "#E2E8E4",
  },
  filterChipActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#0BA84A",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#606C62",
  },
  filterChipTextActive: {
    color: "#0BA84A",
  },
  selectedPreviewBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  selectedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedPreviewTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1B4D2E",
  },
  selectedStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2C6B4F",
  },
  abilitiesPreviewList: {
    gap: 8,
    marginTop: 2,
  },
  abilityPreviewItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    gap: 3,
  },
  abilityTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  abilityPreviewSlot: {
    fontSize: 11,
    fontWeight: "800",
    color: "#374151",
    width: 54,
  },
  abilityPreviewName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1B211C",
    flex: 1,
  },
  abilityStatusBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  abilityStatusBadgeLocked: {
    color: "#9CA3AF",
  },
  abilityEffectText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0BA84A",
    marginLeft: 60,
  },
  abilityDescText: {
    fontSize: 10,
    color: "#606C62",
    marginLeft: 60,
    lineHeight: 14,
  },
  emptyResultsBox: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CFD8DC",
    borderRadius: 16,
    marginVertical: 8,
  },
  emptyResultsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#455A64",
  },
  emptyResultsSubtitle: {
    fontSize: 11,
    color: "#78909C",
    textAlign: "center",
  },
  clearFiltersBtn: {
    marginTop: 6,
    backgroundColor: "#E2ECE4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2C6B4F",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E2ECE4",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 6,
    backgroundColor: "#FFFFFF",
  },
  footerSummary: {
    paddingVertical: 2,
    alignItems: "center",
  },
  footerSummaryText: {
    fontSize: 12,
    color: "#566159",
  },
  footerSummaryBold: {
    fontWeight: "800",
    color: "#1B4D2E",
  },
});
