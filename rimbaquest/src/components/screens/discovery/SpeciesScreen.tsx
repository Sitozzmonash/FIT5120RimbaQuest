import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DiscoverySession, Species } from "../../../types";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { PhotoPreview } from "./components/PhotoPreview";
import { SpeciesGrid } from "./components/SpeciesGrid";
import { IdentificationFeedbackModal } from "./components/IdentificationFeedbackModal";

export function SpeciesScreen({
  photo,
  session,
  onContinue,
  onBack,
  onDiscard,
}: {
  photo: { uri: string };
  session: DiscoverySession;
  onContinue: (item: Species) => void;
  onBack: () => void;
  onDiscard: () => void;
}) {
  const category = useDiscoveryStore((state) => state.category);
  const speciesList = useDiscoveryStore(
    (state) => state.verificationCandidates,
  );
  const selectedId = useDiscoveryStore((state) => state.chosenSpeciesId);
  const evaluating = useDiscoveryStore(
    (state) => state.evaluatingIdentification,
  );
  const feedback = useDiscoveryStore((state) => state.identificationFeedback);
  const errorMessage = useDiscoveryStore((state) => state.identificationError);

  const [pending, setPending] = useState<Species | null>(null);
  const [requiredMessage, setRequiredMessage] = useState("");

  useEffect(() => {
    setPending(speciesList.find((item) => item.id === selectedId) ?? null);
    setRequiredMessage("");
  }, [speciesList, selectedId]);

  const submit = () => {
    if (!pending) {
      setRequiredMessage("Please choose a species before continuing.");
      return;
    }
    setRequiredMessage("");
    void useDiscoveryStore
      .getState()
      .evaluateIdentification(
        pending,
        session.childId,
        session.token,
        session.onSessionExpired,
      );
  };

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Confirm Discovery"
        onBack={onBack}
        confirmDiscard
        onDiscard={onDiscard}
        disabled={evaluating}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <PhotoPreview photo={photo} />

        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{category}</Text>
        </View>

        <Text style={styles.title}>
          What species do you think matches what you see?
        </Text>

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
          <Text style={styles.errorText}>
            {requiredMessage || errorMessage}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Tap
          label="Not sure"
          style={styles.notSureButton}
          disabled={evaluating}
          onPress={() =>
            setRequiredMessage("Please choose a species before continuing.")
          }
        >
          <Text style={styles.notSureText}>Not Sure</Text>
        </Tap>
        <PrimaryButton
          label={evaluating ? "Checking..." : "Continue"}
          loading={evaluating}
          disabled={evaluating}
          style={styles.continueButton}
          onPress={submit}
        />
      </View>

      <IdentificationFeedbackModal
        feedback={feedback}
        onContinue={onContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  categoryPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#CDE8D4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F2FBF4",
  },
  categoryPillText: { color: "#1A1A1A", fontSize: 13, fontWeight: "800" },
  title: { color: "#1A1A1A", fontSize: 21, lineHeight: 28, fontWeight: "900" },
  errorText: {
    color: "#B3261E",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
  },
  notSureButton: {
    width: 120,
    height: 52,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#0A5D2C",
    alignItems: "center",
    justifyContent: "center",
  },
  notSureText: { color: "#0A5D2C", fontSize: 15, fontWeight: "800" },
  continueButton: { flex: 1 },
});
