import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DISCOVERY_CATEGORY_IMAGES } from "../../../constants/images";
import { CATEGORIES, CATEGORY_APPEARANCE } from "../../../constants/seed";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
// import { DiscoveryStepIndicator } from "./components/DiscoveryStepIndicator";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";
import { PhotoPreview } from "./components/PhotoPreview";
import { CategoryOptionCard } from "./components/CategoryOptionCard";

export function CategoryScreen({
  photo,
  onNext,
  onBack,
  onDiscard,
}: {
  photo: { uri: string };
  onNext: () => void;
  onBack: () => void;
  onDiscard: () => void;
}) {
  const candidates = useDiscoveryStore((state) => state.verificationCandidates);

  const detectedCategory = candidates[0]?.category ?? null;

  useEffect(() => {
    if (detectedCategory)
      useDiscoveryStore.getState().setCategory(detectedCategory);
  }, [detectedCategory]);

  const handleNext = () => {
    if (!detectedCategory) return;
    useDiscoveryStore.getState().setIdentificationError(null);
    onNext();
  };

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Record a Discovery"
        onBack={onBack}
        confirmDiscard
        onDiscard={onDiscard}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* <DiscoveryStepIndicator step={2} /> */}

        <View style={styles.intro}>
          <Text style={styles.title}>Wildlife Category</Text>
          <Text style={styles.subtitle}>
            Based on your photo, here's the animal group we detected.
          </Text>
        </View>

        <PhotoPreview photo={photo} />

        <View style={styles.list}>
          {CATEGORIES.map((item) => (
            <CategoryOptionCard
              key={item}
              image={
                DISCOVERY_CATEGORY_IMAGES[
                  item as keyof typeof DISCOVERY_CATEGORY_IMAGES
                ]
              }
              label={`${item}s`}
              description={CATEGORY_APPEARANCE[item] ?? ""}
              selected={detectedCategory === item}
              disabled
              onPress={() => {}}
            />
          ))}
        </View>
        {!detectedCategory ? (
          <Text style={styles.requiredMessage}>
            We couldn't detect an animal group for this photo. Please try
            another wildlife photo.
          </Text>
        ) : null}
      </ScrollView>

      <DiscoveryBottomNav
        onBack={onBack}
        nextLabel="Next"
        nextDisabled={!detectedCategory}
        onNext={handleNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, gap: 16 },
  intro: { gap: 6 },
  title: { color: "#1A1A1A", fontSize: 24, lineHeight: 30, fontWeight: "900" },
  subtitle: {
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  list: { gap: 14, width: "100%" },
  requiredMessage: {
    color: "#B3261E",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
