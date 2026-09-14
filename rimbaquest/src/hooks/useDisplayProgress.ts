import { useMemo } from "react";
import { hasReferenceImage } from "../constants/images";
import { levelForFound } from "../constants/progression";
import { useSpeciesCatalogStore } from "../store/useSpeciesCatalogStore";
import { useUserStore } from "../store/useUserStore";

export function useDisplayProgress() {
  const species = useSpeciesCatalogStore((state) => state.species);
  const discovered = useUserStore((state) => state.discovered);
  const xp = useUserStore((state) => state.currentUser.xp);

  return useMemo(() => {
    const supportedSpecies = species.filter(hasReferenceImage);
    const found = discovered.filter((id) =>
      supportedSpecies.some((item) => item.id === id),
    ).length;
    return {
      found,
      total: supportedSpecies.length,
      xp,
      level: levelForFound(found),
    };
  }, [species, discovered, xp]);
}
