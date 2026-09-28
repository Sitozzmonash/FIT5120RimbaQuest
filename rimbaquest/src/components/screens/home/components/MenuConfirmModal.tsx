import React from "react";
import { ImageSourcePropType } from "react-native";
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
  { icon?: ImageSourcePropType; title: string; message: string }
> = {
  discover: {
    icon: HOME_MAP_IMAGES.iconDiscover,
    title: "Go Discover?",
    message:
      "You're heading out to explore places where you can spot wild animals.",
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
    />
  );
}
