import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Species } from "../../../types";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { PrimaryButton } from "../../common/PrimaryButton";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { PhotoPreview } from "./components/PhotoPreview";
import { CategoryCaptureBanner } from "./components/CategoryCaptureBanner";
import { SpeciesGrid } from "./components/SpeciesGrid";
import { IdentificationFeedbackModal } from "./components/IdentificationFeedbackModal";

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
  const [requiredMessage, setRequiredMessage] = useState("");

  useEffect(() => {
    setPending(speciesList.find((item) => item.id === selectedId) ?? null);
    setRequiredMessage("");
  }, [speciesList, selectedId]);

  const submit = () => {
    if (!pending) {
      setRequiredMessage("Please choose an animal before you continue.");
      return;
    }
    setRequiredMessage("");
    void useDiscoveryStore.getState().evaluateIdentification(pending);
  };

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Choose the Animal"
        confirmDiscard
        onDiscard={() => useDiscoveryStore.getState().discardAndExit()}
        disabled={evaluating}
      />

      <View style={styles.content}>
        <PhotoPreview />

        <View style={styles.headline}>
          <CategoryCaptureBanner category={category} />
          <Text style={styles.title}>
            Which species matches what you see?
          </Text>
        </View>

        <SpeciesGrid
          speciesList={speciesList}
          selectedId={pending?.id ?? null}
          disabled={evaluating}
          onSelect={(item) => {
            setPending(item);
            setRequiredMessage("");
          }}
        />

        {requiredMessage || errorMessage ? (
          <Text style={styles.errorText} numberOfLines={2}>
            {requiredMessage || errorMessage}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={evaluating ? "Checking..." : "Continue"}
          loading={evaluating}
          disabled={evaluating}
          onPress={submit}
        />
      </View>

      <IdentificationFeedbackModal />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, padding: 16, gap: 12 },
  headline: { gap: 1 },
  title: { color: "#1A1A1A", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  errorText: {
    color: "#B3261E",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
  },
});
