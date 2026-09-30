import React from "react";
import { Modal, StyleSheet, View } from "react-native";
import { WoodModalCard } from "./WoodModalCard";

export const WOOD_MODAL_ICONS = {
  check: require("../../../../assets/profile/check-badge.png"),
  alert: require("../../../../assets/locations/alert.png"),
};

type WoodModalCardProps = React.ComponentProps<typeof WoodModalCard>;

export function WoodModal({
  visible,
  onRequestClose,
  icon,
  ...card
}: Omit<WoodModalCardProps, "icon" | "iconSize"> & {
  visible: boolean;
  onRequestClose?: () => void;
  icon: keyof typeof WOOD_MODAL_ICONS | WoodModalCardProps["icon"];
}) {
  const isStandard = typeof icon === "string" && icon in WOOD_MODAL_ICONS;
  const source = isStandard
    ? WOOD_MODAL_ICONS[icon as keyof typeof WOOD_MODAL_ICONS]
    : icon;
  const iconSize = icon === "alert" ? 56 : 68;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose ?? (() => {})}
    >
      <View style={styles.backdrop}>
        <WoodModalCard {...card} icon={source} iconSize={iconSize} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(8, 22, 14, 0.55)",
  },
});
