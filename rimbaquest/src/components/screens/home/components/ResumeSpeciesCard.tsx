import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { HOME_MAP_IMAGES } from "../../../../constants/images";
import { ScaleTap } from "../../../common/ScaleTap";
import { HOME_COLORS } from "../homeTheme";

export function ResumeSpeciesCard({
  name,
  image,
  status,
  category,
  onPress,
}: {
  name: string;
  image?: ImageSourcePropType;
  status?: string;
  category?: string;
  onPress: () => void;
}) {
  return (
    <ScaleTap
      label={`Continue learning about ${name}`}
      style={styles.card}
      onPress={onPress}
    >
      {image ? (
        <View style={styles.thumb}>
          <Image source={image} style={styles.thumbImage} resizeMode="cover" />
        </View>
      ) : null}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {status || category ? (
          <View style={styles.pills}>
            {status ? (
              <View style={[styles.pill, styles.statusPill]}>
                <Text style={[styles.pillText, styles.statusText]}>
                  {status}
                </Text>
              </View>
            ) : null}
            {category ? (
              <View style={[styles.pill, styles.categoryPill]}>
                <Text style={[styles.pillText, styles.categoryText]}>
                  {category}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <Image
        source={HOME_MAP_IMAGES.chevron}
        style={styles.chevron}
        resizeMode="contain"
      />
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: HOME_COLORS.ink,
    borderRadius: 16,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: HOME_COLORS.ink,
    backgroundColor: "#2F6B3E",
    overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%" },
  info: { flex: 1, gap: 4 },
  name: {
    fontFamily: FONTS.display,
    color: HOME_COLORS.heading,
    fontSize: 18,
    lineHeight: 19.8,
  },
  pills: { flexDirection: "row", gap: 6 },
  pill: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusPill: {
    backgroundColor: HOME_COLORS.badgeGreen,
    borderColor: HOME_COLORS.ink,
  },
  categoryPill: { backgroundColor: "#D8ECCE", borderColor: "#2F7A41" },
  pillText: { fontSize: 11, fontFamily: FONTS.bodyBlack },
  statusText: { color: HOME_COLORS.paper },
  categoryText: { color: "#1A4D2B" },
  chevron: { width: 13, height: 18.23 },
});
