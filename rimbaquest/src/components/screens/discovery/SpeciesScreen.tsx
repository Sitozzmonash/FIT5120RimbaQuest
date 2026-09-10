import React, { useEffect, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { IdentificationFeedback, Species } from "../../../types";
import { imageFor } from "../../../constants/images";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { PhotoPreview } from "./components/PhotoPreview";

export function SpeciesScreen({
  photo,
  category,
  speciesList,
  selectedId,
  evaluating,
  feedback,
  errorMessage,
  onSubmit,
  onContinue,
  onBack,
  onDiscard,
}: {
  photo: { uri: string };
  category: string;
  speciesList: Species[];
  selectedId?: string | null;
  evaluating: boolean;
  feedback: IdentificationFeedback | null;
  errorMessage: string | null;
  onSubmit: (item: Species) => void;
  onContinue: (item: Species) => void;
  onBack: () => void;
  onDiscard: () => void;
}) {
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
    onSubmit(pending);
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

        <Text style={styles.title}>What species do you think matches what you see?</Text>

        <View style={styles.grid}>
          {speciesList.map((item) => {
            const selected = pending?.id === item.id;
            return (
              <Tap
                key={item.id}
                label={selected ? `${item.common_name} selected` : `Choose ${item.common_name}`}
                style={[styles.speciesCard, selected && styles.speciesCardSelected]}
                disabled={evaluating}
                onPress={() => {
                  setPending(item);
                  setRequiredMessage("");
                }}
              >
                <Image source={imageFor(item)!} style={styles.speciesImage} resizeMode="cover" />
                <View style={styles.imageShade} />
                <Text style={styles.speciesName} numberOfLines={2}>{item.common_name}</Text>
                {selected ? (
                  <View style={styles.checkBadge}>
                    <MaterialIcons name="check" size={18} color="#FFFFFF" />
                  </View>
                ) : null}
              </Tap>
            );
          })}
        </View>

        {requiredMessage || errorMessage ? (
          <Text style={styles.errorText}>{requiredMessage || errorMessage}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Tap
          label="Not sure"
          style={styles.notSureButton}
          disabled={evaluating}
          onPress={() => setRequiredMessage("Please choose a species before continuing.")}
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

      <Modal visible={Boolean(feedback)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.feedbackCard}>
            <View style={[styles.feedbackIcon, feedback?.correct ? styles.correctIcon : styles.incorrectIcon]}>
              <MaterialIcons name="check" size={28} color={feedback?.correct ? "#12B347" : "#FF4D4F"} />
            </View>
            <Text style={[styles.feedbackEyebrow, feedback?.correct ? styles.correctText : styles.incorrectText]}>
              {feedback?.correct ? "CORRECT!" : "INCORRECT"}
            </Text>
            <Text style={styles.feedbackTitle}>{feedback?.correct ? "Great job!" : "Not quite."}</Text>
            <Text style={styles.feedbackBody}>
              This is a {feedback?.verified_species.common_name}, which belongs to the {feedback?.verified_species.category} category.
            </Text>
            {feedback?.explanation ? (
              <Text style={styles.feedbackExplanation}>{feedback.explanation}</Text>
            ) : null}
            {feedback ? (
              <PrimaryButton
                label="Continue"
                style={styles.feedbackContinue}
                onPress={() => onContinue(feedback.verified_species)}
              />
            ) : null}
          </View>
        </View>
      </Modal>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  speciesCard: {
    width: "48.5%",
    height: 158,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8E6DC",
    backgroundColor: "#E8EFE9",
  },
  speciesCardSelected: { borderWidth: 3, borderColor: "#12B347" },
  speciesImage: { width: "100%", height: "100%" },
  imageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.18)" },
  speciesName: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  checkBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#087B35",
  },
  errorText: { color: "#B3261E", fontSize: 13, lineHeight: 18, fontWeight: "700", textAlign: "center" },
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
  modalBackdrop: { flex: 1, justifyContent: "center", paddingHorizontal: 38, backgroundColor: "rgba(0,0,0,0.72)" },
  feedbackCard: { borderRadius: 28, padding: 28, alignItems: "center", gap: 10, backgroundColor: "#FFFFFF" },
  feedbackIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  correctIcon: { borderColor: "#CDECD6", backgroundColor: "#F3FCF5" },
  incorrectIcon: { borderColor: "#F6CCCC", backgroundColor: "#FFF1F1" },
  feedbackEyebrow: { fontSize: 14, fontWeight: "900" },
  correctText: { color: "#12B347" },
  incorrectText: { color: "#FF4D4F" },
  feedbackTitle: { color: "#1A1A1A", fontSize: 23, lineHeight: 28, fontWeight: "900" },
  feedbackBody: { color: "#667085", fontSize: 15, lineHeight: 22, textAlign: "center" },
  feedbackExplanation: { color: "#344054", fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
  feedbackContinue: { width: "100%", marginTop: 8 },
});
