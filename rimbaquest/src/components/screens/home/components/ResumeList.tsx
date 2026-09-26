import React, { useMemo } from 'react';
import { imageFor } from '../../../../constants/images';
import { useContinueLearningStore } from '../../../../store/useContinueLearningStore';
import { useDiscoveryStore } from '../../../../store/useDiscoveryStore';
import { useNavigationStore } from '../../../../store/useNavigationStore';
import { useSelectedSpeciesStore } from '../../../../store/useSelectedSpeciesStore';
import { useSpeciesCatalogStore } from '../../../../store/useSpeciesCatalogStore';
import { useUserStore } from '../../../../store/useUserStore';
import { RecentCapture } from '../../../../types';
import { ResumeSpeciesCard } from './ResumeSpeciesCard';

const MAX_RECENT = 5;

function openWildlifeCard(capture: RecentCapture) {
  useSelectedSpeciesStore.getState().setSelected(capture);
  void useUserStore.getState().loadSpeciesGallery(capture.id);
  useNavigationStore.getState().open('about');
}

// Recently viewed animals, newest first, or a nudge to capture the first one.
// Only the first card shows while the sheet is collapsed.
export function ResumeList() {
  const entries = useContinueLearningStore((state) => state.entries);
  const catalog = useSpeciesCatalogStore((state) => state.species);
  const discovered = useUserStore((state) => state.discovered);

  const recent = useMemo<RecentCapture[]>(() => {
    const bySpeciesId = new Map(catalog.map((item) => [item.id, item]));
    return entries
      .slice(0, MAX_RECENT)
      .map((entry): RecentCapture | null => {
        const species = bySpeciesId.get(entry.speciesId);
        if (!species) return null;
        return { ...species, recorded_at: new Date(entry.lastInteractedAt).toISOString() };
      })
      .filter((item): item is RecentCapture => item !== null);
  }, [entries, catalog]);

  if (!recent.length) {
    return (
      <ResumeSpeciesCard
        name="Find your first animal"
        status="Capture"
        onPress={() => useDiscoveryStore.getState().start()}
      />
    );
  }

  return (
    <>
      {recent.map((capture) => (
        <ResumeSpeciesCard
          key={capture.id}
          name={capture.common_name}
          image={imageFor(capture)}
          status={discovered.includes(capture.id) ? 'Discovered' : 'Spotted'}
          category={capture.category}
          onPress={() => openWildlifeCard(capture)}
        />
      ))}
    </>
  );
}
