import { useMemo } from "react";
import { hasReferenceImage } from "../constants/images";
import { useCollectionStore } from "../store/useCollectionStore";
import { useSpeciesCatalogStore } from "../store/useSpeciesCatalogStore";
import { useUserStore } from "../store/useUserStore";

export function useCollectionSpeciesList() {
  const species = useSpeciesCatalogStore((state) => state.species);
  const discovered = useUserStore((state) => state.discovered);
  const filter = useCollectionStore((state) => state.filter);
  const search = useCollectionStore((state) => state.search);

  return useMemo(() => {
    const supportedSpecies = species.filter(hasReferenceImage);
    const query = search.trim().toLowerCase();
    return supportedSpecies
      .filter((item) => filter === "All" || item.category === filter)
      .filter(
        (item) => !query || item.common_name.toLowerCase().includes(query),
      )
      .sort((left, right) => {
        const unlockOrder =
          Number(discovered.includes(right.id)) -
          Number(discovered.includes(left.id));
        return unlockOrder || left.common_name.localeCompare(right.common_name);
      });
  }, [species, discovered, filter, search]);
}
