import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { GalleryItem } from "../../../../types";

function formatPhotoDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function GalleryTab({ photos }: { photos: GalleryItem[] }) {
  return photos.length ? (
    <View style={styles.detailGalleryGrid}>
      {photos.map((item, index) => (
        <View
          key={`${item.photo_url || "photo"}-${index}`}
          style={styles.detailGalleryItem}
        >
          {item.photo_url ? (
            <Image
              source={{ uri: item.photo_url }}
              style={styles.detailGalleryImage}
            />
          ) : (
            <View
              style={[styles.detailGalleryImage, styles.galleryPlaceholder]}
            />
          )}
          <Text style={styles.detailGalleryDate}>
            {formatPhotoDate(item.recorded_at)}
          </Text>
        </View>
      ))}
    </View>
  ) : (
    <View style={styles.galleryEmpty}>
      <Text style={styles.galleryEmptyTitle}>No personal photos yet</Text>
      <Text style={styles.muted}>
        Each saved observation of this species will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailGalleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailGalleryItem: { width: "48%", gap: 8 },
  detailGalleryImage: { width: "100%", height: 110, borderRadius: 24 },
  detailGalleryDate: { color: "#1A1A1A", fontSize: 10, fontWeight: "500" },
  galleryEmpty: {
    borderWidth: 1,
    borderColor: "#CBECD6",
    backgroundColor: "#F4FFF7",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  galleryEmptyTitle: {
    color: "#087B35",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  galleryPlaceholder: { backgroundColor: "#E8EEEA" },
  muted: { color: "#707872", fontSize: 11, marginTop: 2, paddingHorizontal: 6 },
});
