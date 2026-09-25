import { useMemo } from "react";
import { useSpeciesCatalogStore } from "../store/useSpeciesCatalogStore";
import { useUserStore } from "../store/useUserStore";

export function useUnlockedBattleSpecies() {
  const species = useSpeciesCatalogStore((state) => state.species);
  const discovered = useUserStore((state) => state.discovered);

  return useMemo(
    () => species.filter((item) => discovered.includes(item.id)),
    [species, discovered],
  );
}
