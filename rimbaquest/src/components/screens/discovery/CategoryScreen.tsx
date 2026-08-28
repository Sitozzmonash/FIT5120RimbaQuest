import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DISCOVERY_CATEGORY_IMAGES } from "../../../constants/images";
import { CATEGORY_APPEARANCE } from "../../../constants/seed";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoveryStepIndicator } from "./components/DiscoveryStepIndicator";
import { DiscoveryBottomNav } from "./components/DiscoveryBottomNav";
import { PhotoPreview } from "./components/PhotoPreview";
import { CategoryOptionCard } from "./components/CategoryOptionCard";

// Step 2: pick a wildlife category
export function CategoryScreen({
  photo,
  categories,
  category,
  onSelectCategory,
  onBack,
  onDiscard,
}: {
  photo: { uri: string };
  categories: string[];
  category: string;
  onSelectCategory: (cat: string) => void;
  onBack: () => void;
  onDiscard: () => void;
}) {
  const [pending, setPending] = useState<string | null>(
    categories.includes(category) ? category : null,
  );

  return (
    <View style={styles.page}>
      <DiscoveryHeader
        title="Record a Discovery"
        onBack={onBack}
        confirmDiscard
        onDiscard={onDiscard}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <DiscoveryStepIndicator step={2} />

        <View style={styles.intro}>
          <Text style={styles.title}>Choose a Wildlife Category</Text>
          <Text style={styles.subtitle}>What type of animal did you see?</Text>
        </View>

        <PhotoPreview photo={photo} />

        <View style={styles.list}>
          {categories.map((item) => (
            <CategoryOptionCard
              key={item}
              image={
                DISCOVERY_CATEGORY_IMAGES[
                  item as keyof typeof DISCOVERY_CATEGORY_IMAGES
                ]
              }
              label={`${item}s`}
              description={CATEGORY_APPEARANCE[item] ?? ""}
              selected={pending === item}
              onPress={() => setPending(item)}
            />
          ))}
        </View>
      </ScrollView>

      <DiscoveryBottomNav
        onBack={onBack}
        nextLabel="Next"
        nextDisabled={!pending}
        onNext={() => pending && onSelectCategory(pending)}
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
});
