import React from "react";
import { StyleSheet, View } from "react-native";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { GameSearchBar } from "../../../common/game/GameSearchBar";

export function LocationSearchBar() {
  const search = useLocationsStore((state) => state.search);
  const setSearch = useLocationsStore((state) => state.setSearch);

  return (
    <View style={styles.section}>
      <GameSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search locations or areas"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingVertical: 12 },
});
