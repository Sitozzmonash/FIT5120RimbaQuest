import React from "react";
import { StyleSheet } from "react-native";
import { useCollectionStore } from "../../../../store/useCollectionStore";
import { GameSearchBar } from "../../../common/game/GameSearchBar";

export function CollectionSearchBar() {
  const search = useCollectionStore((state) => state.search);
  const setSearch = useCollectionStore((state) => state.setSearch);

  return (
    <GameSearchBar
      value={search}
      onChangeText={setSearch}
      placeholder="Type an animal name"
      style={styles.searchBar}
    />
  );
}

const styles = StyleSheet.create({
  searchBar: { marginHorizontal: 16, marginBottom: 12 },
});
