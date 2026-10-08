import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { avatarImageFor } from "../../../../constants/images";
import { GAME_COLORS } from "../../../common/game/gameTheme";

const INK = GAME_COLORS.ink;

export function Avatar({
  avatar,
  source,
  size,
  ring = false,
  style,
}: {
  avatar?: string;
  source?: number;
  size: number;
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        ring && styles.ring,
        style,
      ]}
    >
      <Image
        source={source ?? avatarImageFor(avatar ?? "")}
        style={styles.image as ImageStyle}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: "hidden",
    backgroundColor: "#D8ECCE",
    borderWidth: 3,
    borderColor: INK,
  },
  ring: { boxShadow: `0px 0px 0px 3px #F2B233, 0px 0px 0px 5px ${INK}` },
  image: { width: "100%", height: "100%" },
});
