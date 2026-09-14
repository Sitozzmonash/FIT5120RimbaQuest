import React from "react";
import { StyleSheet, View } from "react-native";
import { Species } from "../../../../types";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { useSelectedSpeciesStore } from "../../../../store/useSelectedSpeciesStore";
import { useUserStore } from "../../../../store/useUserStore";
import { CollectionCard } from "./CollectionCard";

function selectSpecies(item: Species) {
  useSelectedSpeciesStore.getState().setSelected(item);
  void useUserStore.getState().loadSpeciesGallery(item.id);
  useNavigationStore.getState().open("about");
}

function selectLocked(item: Species) {
  useSelectedSpeciesStore.getState().setSelected(item);
  useNavigationStore.getState().open("locked");
}

export function CollectionGridRow({ items }: { items: Species[] }) {
  const discoveredIds = useUserStore((state) => state.discovered);

  return (
    <View style={styles.collectionGridRow}>
      {items.map((item) => {
        const discovered = discoveredIds.includes(item.id);
        return (
          <CollectionCard
            key={item.id}
            species={item}
            discovered={discovered}
            onPress={() =>
              discovered ? selectSpecies(item) : selectLocked(item)
            }
          />
        );
      })}
      {items.length === 1 && <View style={{ flex: 1 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  collectionGridRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
});
