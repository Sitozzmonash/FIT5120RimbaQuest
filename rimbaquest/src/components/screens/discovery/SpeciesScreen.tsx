import React, { useEffect, useState } from "react";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { Species } from "../../../types";
import { GameButton } from "../../common/game/GameButton";
import { IdentificationFeedbackModal } from "./components/IdentificationFeedbackModal";
import { PickStepLayout } from "./components/PickStepLayout";
import { SpeciesGrid } from "./components/SpeciesGrid";

export function SpeciesScreen() {
  const category = useDiscoveryStore((state) => state.category);
  const speciesList = useDiscoveryStore(
    (state) => state.verificationCandidates,
  );
  const selectedId = useDiscoveryStore((state) => state.chosenSpeciesId);
  const evaluating = useDiscoveryStore(
    (state) => state.evaluatingIdentification,
  );
  const errorMessage = useDiscoveryStore((state) => state.identificationError);

  const [pending, setPending] = useState<Species | null>(null);

  useEffect(() => {
    setPending(speciesList.find((item) => item.id === selectedId) ?? null);
  }, [speciesList, selectedId]);

  const submit = () => {
    if (!pending) return;
    void useDiscoveryStore.getState().evaluateIdentification(pending);
  };

  return (
    <>
      <PickStepLayout
        question={`What ${category || "animal"} species do you think matches what you saw?`}
        message={errorMessage}
        headerDisabled={evaluating}
        footer={
          <GameButton
            label={evaluating ? "Checking..." : "Continue"}
            disabled={!pending}
            loading={evaluating}
            onPress={submit}
          />
        }
      >
        <SpeciesGrid
          speciesList={speciesList}
          selectedId={pending?.id ?? null}
          disabled={evaluating}
          onSelect={setPending}
        />
      </PickStepLayout>
      <IdentificationFeedbackModal />
    </>
  );
}
