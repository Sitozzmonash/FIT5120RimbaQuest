import React from "react";
import { WILDLIFE_FILTERS } from "../../../../constants/seed";
import { useCollectionStore } from "../../../../store/useCollectionStore";
import { FilterChips } from "../../../common/game/FilterChips";

const CHIP_LABELS: Record<string, string> = {
  All: "All",
  Butterfly: "Butterflies",
};

const CHIP_ITEMS = WILDLIFE_FILTERS.map((item) => ({
  id: item.id,
  label: CHIP_LABELS[item.id] ?? item.label,
}));

export function WildlifeFilterChips() {
  const filter = useCollectionStore((state) => state.filter);
  const onSelect = useCollectionStore((state) => state.setFilter);

  return <FilterChips items={CHIP_ITEMS} value={filter} onSelect={onSelect} />;
}
