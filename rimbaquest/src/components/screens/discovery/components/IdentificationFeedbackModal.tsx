import React from "react";
import { StyleSheet, Text } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { WoodModal } from "../../../common/game/WoodModal";

export function IdentificationFeedbackModal() {
  const feedback = useDiscoveryStore((state) => state.identificationFeedback);
  const correct = Boolean(feedback?.correct);
  const species = feedback?.verified_species;

  return (
    <WoodModal
      visible={Boolean(feedback)}
      icon={correct ? "check" : "alert"}
      positive={correct}
      title={correct ? "Great job!" : "Not Quite."}
      message={
        species
          ? `This is a ${species.common_name}, which belongs to the ${species.category} category.`
          : ""
      }
      onAction={() => {
        if (species) useDiscoveryStore.getState().continueToConfirm(species);
      }}
    >
      {feedback?.explanation ? (
        <Text style={styles.explanation}>{feedback.explanation}</Text>
      ) : null}
    </WoodModal>
  );
}

const styles = StyleSheet.create({
  explanation: {
    fontFamily: FONTS.bodyBold,
    color: "#3D5443",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
