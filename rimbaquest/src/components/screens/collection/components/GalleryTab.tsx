import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GalleryItem } from "../../../../types";
import { DetailCard } from "./detail/DetailCard";
import { DetailPill } from "./detail/DetailPill";
import { DETAIL_COLORS } from "./detail/detailTheme";
import { PhotoLightbox } from "./detail/PhotoLightbox";
import { SightingPolaroid } from "./detail/SightingPolaroid";
import { TabStatus } from "./detail/TabStatus";

function photoLocation(item: GalleryItem): string {
  return item.location_label?.trim() || "Place not saved";
}

// Pairs of photos, one row per pair.
function inRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

export function GalleryTab({ photos }: { photos: GalleryItem[] }) {
  const [enlarged, setEnlarged] = useState<GalleryItem | null>(null);

  return (
    <DetailCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sightings</Text>
        <DetailPill
          label={`${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
          tone="green"
        />
      </View>

      {photos.length ? (
        <View style={styles.grid}>
          {inRows(photos).map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((item, i) => {
                const index = rowIndex * 2 + i;
                return (
                  <SightingPolaroid
                    key={`${item.photo_url || "photo"}-${index}`}
                    uri={item.photo_url}
                    location={photoLocation(item)}
                    index={index}
                    onPress={() => setEnlarged(item)}
                  />
                );
              })}
              {/* Keeps a lone last photo at half width. */}
              {row.length === 1 && <View style={styles.spacer} />}
            </View>
          ))}
        </View>
      ) : (
        <TabStatus message="Photos you save of this animal will appear here." />
      )}

      <PhotoLightbox
        source={enlarged?.photo_url ? { uri: enlarged.photo_url } : null}
        caption={enlarged ? photoLocation(enlarged) : undefined}
        onClose={() => setEnlarged(null)}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 18 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: FONTS.display,
    color: DETAIL_COLORS.heading,
    fontSize: 20,
  },
  grid: { gap: 22, padding: 4 },
  row: { flexDirection: "row", gap: 18 },
  spacer: { flex: 1 },
});
