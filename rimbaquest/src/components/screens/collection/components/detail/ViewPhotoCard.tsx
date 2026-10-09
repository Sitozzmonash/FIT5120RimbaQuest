import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { ScaleTap } from "../../../../common/ScaleTap";
import { DETAIL_COLORS } from "./detailTheme";
import { PhotoLightbox } from "./PhotoLightbox";

const CHEVRON_RIGHT = require("../../../../../../assets/locations/chevron-right.png");

export function ViewPhotoCard({
  name,
  image,
}: {
  name: string;
  image?: ImageSourcePropType;
}) {
  const [enlarged, setEnlarged] = useState(false);

  if (!image) return null;

  return (
    <>
      <ScaleTap
        label={`View the ${name} picture`}
        style={styles.card}
        onPress={() => setEnlarged(true)}
        pressedScale={0.96}
      >
        <Image source={image} style={styles.thumb} resizeMode="cover" />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.hint}>Tap to view the animal image</Text>
        </View>
        <Image
          source={CHEVRON_RIGHT}
          style={styles.chevron}
          resizeMode="contain"
        />
      </ScaleTap>
      <PhotoLightbox
        source={enlarged ? image : null}
        onClose={() => setEnlarged(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: DETAIL_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: DETAIL_COLORS.ink,
    borderRadius: 18,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DETAIL_COLORS.ink,
  },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: FONTS.display,
    color: DETAIL_COLORS.heading,
    fontSize: 17,
  },
  hint: { fontFamily: FONTS.bodyBold, color: DETAIL_COLORS.body, fontSize: 13 },
  chevron: { width: 15, height: 21 },
});
