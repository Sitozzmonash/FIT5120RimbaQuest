import React from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { imageFor } from "../../../../constants/images";
import { Species } from "../../../../types";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { UndiscoveredTape } from "./UndiscoveredTape";

export function CollectionCard({
  species,
  discovered,
  onPress,
  label,
  image,
  tag,
  badge,
  footer,
  disabled = false,
  style,
}: {
  species: Species;
  discovered: boolean;
  onPress: () => void;
  label?: string;
  image?: React.ReactNode;
  tag?: string | null;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const tagText = tag === undefined ? (discovered ? "Found" : null) : tag;
  return (
    <ScaleTap
      label={
        label ??
        (discovered
          ? `View ${species.common_name}`
          : `See the ${species.common_name} card you have not found yet`)
      }
      style={[styles.card, style]}
      onPress={onPress}
      disabled={disabled}
      pressedScale={0.95}
    >
      <View style={styles.imageWrap}>
        {image ?? (
          <Image
            source={imageFor(species)!}
            style={[styles.image, !discovered && styles.lockedImage]}
            resizeMode="cover"
          />
        )}
        {!discovered && <UndiscoveredTape />}
        {tagText ? (
          <View style={styles.foundTag}>
            <Text style={styles.foundTagText}>{tagText}</Text>
          </View>
        ) : null}
        {badge ? <View style={styles.badge}>{badge}</View> : null}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>
          {species.common_name}
        </Text>
        {discovered && (
          <Text numberOfLines={1} style={styles.scientific}>
            {species.scientific_name}
          </Text>
        )}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{species.category}</Text>
        </View>
        {footer}
      </View>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: GAME_COLORS.ink,
    borderRadius: 16,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: 100,
    borderBottomWidth: 3,
    borderBottomColor: GAME_COLORS.ink,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  lockedImage: { opacity: 0.25 },
  foundTag: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#1F6B33",
    borderWidth: 2,
    borderColor: GAME_COLORS.ink,
    borderRadius: 999,
  },
  badge: { position: "absolute", top: 6, right: 6 },
  foundTagText: {
    fontFamily: FONTS.bodyBlack,
    color: GAME_COLORS.paper,
    fontSize: 10,
  },
  body: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  name: {
    fontFamily: FONTS.display,
    color: GAME_COLORS.heading,
    fontSize: 15,
    textAlign: "center",
  },
  scientific: {
    fontFamily: FONTS.bodyBold,
    fontStyle: "italic",
    color: GAME_COLORS.label,
    fontSize: 10,
    textAlign: "center",
  },
  categoryPill: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: "#D8ECCE",
    borderWidth: 2,
    borderColor: "#2F7A41",
    borderRadius: 999,
  },
  categoryText: { fontFamily: FONTS.bodyBlack, color: "#1A4D2B", fontSize: 10 },
});
