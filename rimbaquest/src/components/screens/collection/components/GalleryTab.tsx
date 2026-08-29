import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { GalleryItem } from "../../../../types";
import { Tap } from "../../../common/Tap";

function formatPhotoLocation(item: GalleryItem): string {
  return item.location_label?.trim() || "Unknown location";
}

export function GalleryTab({ photos }: { photos: GalleryItem[] }) {
  const [enlarged, setEnlarged] = useState<GalleryItem | null>(null);

  return photos.length ? (
    <View style={styles.detailGalleryGrid}>
      {photos.map((item, index) => (
        <View
          key={`${item.photo_url || "photo"}-${index}`}
          style={styles.detailGalleryItem}
        >
          {item.photo_url ? (
            <Tap
              label={`Enlarge photo from ${item.location_label || "this discovery"}`}
              style={styles.detailGalleryTap}
              onPress={() => setEnlarged(item)}
            >
              <Image
                source={{ uri: item.photo_url }}
                style={styles.detailGalleryImage}
              />
            </Tap>
          ) : (
            <View
              style={[styles.detailGalleryImage, styles.galleryPlaceholder]}
            />
          )}
          <Text style={styles.detailGalleryDate} numberOfLines={1}>
            {formatPhotoLocation(item)}
          </Text>
        </View>
      ))}

      <Modal
        visible={Boolean(enlarged)}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlarged(null)}
      >
        <Tap
          label="Close enlarged photo"
          style={styles.lightboxBackdrop}
          onPress={() => setEnlarged(null)}
        >
          {enlarged?.photo_url && (
            <Image
              source={{ uri: enlarged.photo_url }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </Tap>
        {enlarged && (
          <View style={styles.lightboxLocationBadge} pointerEvents="none">
            <MaterialIcons name="place" size={14} color="#FFFFFF" />
            <Text style={styles.lightboxLocationText} numberOfLines={1}>
              {formatPhotoLocation(enlarged)}
            </Text>
          </View>
        )}
        <Tap
          label="Close"
          style={styles.lightboxCloseBtn}
          onPress={() => setEnlarged(null)}
        >
          <MaterialIcons name="close" size={22} color="#FFFFFF" />
        </Tap>
      </Modal>
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
  detailGalleryTap: { width: "100%" },
  detailGalleryImage: { width: "100%", height: 110, borderRadius: 24 },
  detailGalleryDate: { color: "#1A1A1A", fontSize: 10, fontWeight: "500" },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: { width: "100%", height: "100%" },
  lightboxLocationBadge: {
    position: "absolute",
    bottom: 48,
    left: 20,
    right: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  lightboxLocationText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  lightboxCloseBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
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
