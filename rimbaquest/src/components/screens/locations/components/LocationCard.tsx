import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LocationItem } from "../../../../types";
import { Tap } from "../../../common/Tap";

export function LocationCard({
  location,
  onPress,
}: {
  location: LocationItem;
  onPress: () => void;
}) {
  return (
    <Tap
      label={`View ${location.name}`}
      style={styles.locationCard}
      onPress={onPress}
      disabled
    >
      <View style={styles.locationTopRow}>
        <Text style={styles.locationName}>{location.name}</Text>
      </View>
      <Text style={styles.locationArea}>📍 {location.area}</Text>
      {/* <Text style={styles.locationDesc} numberOfLines={2}>
        {location.description}
      </Text> */}
      {/* {location.typical_wildlife ? (
        <View style={styles.wildlifeTagRow}>
          <Text style={styles.wildlifeTagLabel}>
            Previously observed here:
          </Text>
          <Text style={styles.wildlifeTagValue}>
            {location.typical_wildlife}
          </Text>
        </View>
      ) : null} */}
      <View style={styles.locationCardBottom}>
        {location.best_time ? (
          <Text style={styles.bestTimeText}>
            Opening Hours: {location.best_time}
          </Text>
        ) : (
          <View />
        )}
      </View>
      {/* <View style={styles.locationCardBottom}>
        {location.best_time ? (
          <Text style={styles.bestTimeText}>
            Best time: {location.best_time}
          </Text>
        ) : (
          <View />
        )}
        <Text style={styles.viewDetailText}>View Details ›</Text>
      </View> */}
    </Tap>
  );
}

const styles = StyleSheet.create({
  locationCard: {
    borderWidth: 1,
    borderColor: "#DFE7E1",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  locationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  locationName: { color: "#1B211C", fontSize: 15, fontWeight: "800", flex: 1 },
  locationArea: {
    color: "#68716C",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  locationDesc: { color: "#525B55", fontSize: 12, lineHeight: 17, marginTop: 6 },
  wildlifeTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
    alignItems: "center",
  },
  wildlifeTagLabel: { fontSize: 10, color: "#7B857F", fontWeight: "800" },
  wildlifeTagValue: { fontSize: 10, color: "#087B35", fontWeight: "700" },
  locationCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F4F1",
  },
  bestTimeText: { fontSize: 10, color: "#7B857F" },
  viewDetailText: { fontSize: 11, color: "#0BA84A", fontWeight: "800" },
});
