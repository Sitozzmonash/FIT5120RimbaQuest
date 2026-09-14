import React from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { useLocationsStore } from "../../../../store/useLocationsStore";
import { Tap } from "../../../common/Tap";

export function LocationManualSection() {
  const discoveryLocation = useDiscoveryStore(
    (state) => state.discoveryLocation,
  );
  const setDiscoveryLocation = useDiscoveryStore(
    (state) => state.setDiscoveryLocation,
  );

  const locationOptions = useLocationsStore((state) => state.locations);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {locationOptions.map((loc) => (
          <Tap
            key={loc.id}
            label={loc.name}
            style={[
              styles.chip,
              discoveryLocation === loc.name && styles.chipActive,
            ]}
            onPress={() => setDiscoveryLocation(loc.name)}
          >
            <Text
              style={[
                styles.chipText,
                discoveryLocation === loc.name && styles.chipTextActive,
              ]}
            >
              {loc.name}
            </Text>
          </Tap>
        ))}
      </ScrollView>
      <TextInput
        style={styles.input}
        value={discoveryLocation}
        onChangeText={setDiscoveryLocation}
        placeholder="Or type the name of a place"
        placeholderTextColor="#879089"
      />
    </>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    borderRadius: 16,
    backgroundColor: "#F0F4F1",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: "#0A4D26" },
  chipText: { fontSize: 12, color: "#607068", fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  input: {
    borderWidth: 1,
    borderColor: "#C8D1CA",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 14,
    color: "#1B211C",
  },
});
