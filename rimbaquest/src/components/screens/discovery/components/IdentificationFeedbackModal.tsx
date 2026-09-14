import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { IdentificationFeedback, Species } from "../../../../types";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function IdentificationFeedbackModal({
  feedback,
  onContinue,
}: {
  feedback: IdentificationFeedback | null;
  onContinue: (item: Species) => void;
}) {
  return (
    <Modal visible={Boolean(feedback)} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[
              styles.icon,
              feedback?.correct ? styles.correctIcon : styles.incorrectIcon,
            ]}
          >
            <MaterialIcons
              name="check"
              size={28}
              color={feedback?.correct ? "#12B347" : "#FF4D4F"}
            />
          </View>
          <Text
            style={[
              styles.eyebrow,
              feedback?.correct ? styles.correctText : styles.incorrectText,
            ]}
          >
            {feedback?.correct ? "CORRECT!" : "INCORRECT"}
          </Text>
          <Text style={styles.title}>
            {feedback?.correct ? "Great job!" : "Not quite."}
          </Text>
          <Text style={styles.body}>
            This is a {feedback?.verified_species.common_name}, which belongs to
            the {feedback?.verified_species.category} category.
          </Text>
          {feedback?.explanation ? (
            <Text style={styles.explanation}>{feedback.explanation}</Text>
          ) : null}
          {feedback ? (
            <PrimaryButton
              label="Continue"
              style={styles.continueButton}
              onPress={() => onContinue(feedback.verified_species)}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 38,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  card: {
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  correctIcon: { borderColor: "#CDECD6", backgroundColor: "#F3FCF5" },
  incorrectIcon: { borderColor: "#F6CCCC", backgroundColor: "#FFF1F1" },
  eyebrow: { fontSize: 14, fontWeight: "900" },
  correctText: { color: "#12B347" },
  incorrectText: { color: "#FF4D4F" },
  title: { color: "#1A1A1A", fontSize: 23, lineHeight: 28, fontWeight: "900" },
  body: { color: "#667085", fontSize: 15, lineHeight: 22, textAlign: "center" },
  explanation: {
    color: "#344054",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
  },
  continueButton: { width: "100%", marginTop: 8 },
});
