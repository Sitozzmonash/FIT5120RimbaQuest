import React from "react";
import { ImageSourcePropType, StyleSheet, Text } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { HOME_MAP_IMAGES } from "../../../../constants/images";
import { WoodModal } from "../../../common/game/WoodModal";

export type HomeMenu =
  | "discover"
  | "capture"
  | "collection"
  | "battle"
  | "camp";

// Copy shown before leaving the map for each menu.
const MENU_COPY: Record<
  HomeMenu,
  {
    icon?: ImageSourcePropType;
    title: string;
    message: string;
    note?: string;
  }
> = {
  discover: {
    icon: HOME_MAP_IMAGES.iconDiscover,
    title: "Go Discover?",
    message:
      "You're heading out to explore places where you can spot wild animals.",
    note: "Wildlife sightings are never guaranteed!",
  },
  capture: {
    icon: HOME_MAP_IMAGES.iconCapture,
    title: "Start Capturing?",
    message:
      "Get your camera ready! You're about to snap a photo of an animal you found.",
  },
  collection: {
    icon: HOME_MAP_IMAGES.iconCollection,
    title: "Open Collection?",
    message:
      "You're going to your collection to see all the animals you've discovered.",
  },
  battle: {
    icon: HOME_MAP_IMAGES.iconBattle,
    title: "Enter Battle?",
    message:
      "You're heading to the battle ground to fight with the animals you've captured.",
  },
  camp: {
    title: "Visit My Camp?",
    message:
      "You're going back to your camp to check your explorer profile and progress.",
  },
};

export function MenuConfirmModal({
  menu,
  campAvatar,
  onEnter,
  onCancel,
}: {
  menu: HomeMenu | null;
  // My Camp uses the explorer's own avatar as its icon.
  campAvatar: ImageSourcePropType;
  onEnter: () => void;
  onCancel: () => void;
}) {
  const copy = MENU_COPY[menu ?? "discover"];

  return (
    <WoodModal
      visible={menu !== null}
      onRequestClose={onCancel}
      icon={copy.icon ?? campAvatar}
      positive
      stars={false}
      title={copy.title}
      message={copy.message}
      actionLabel="Enter"
      onAction={onEnter}
      secondaryLabel="No Thanks"
      onSecondary={onCancel}
    >
      {copy.note ? <Text style={styles.note}>{copy.note}</Text> : null}
    </WoodModal>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: FONTS.bodyBlack,
    color: "#1A1A1A",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});
