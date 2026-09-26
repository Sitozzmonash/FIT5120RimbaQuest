import React from "react";
import { StyleSheet, View } from "react-native";
import { AVATAR_CHOICES } from "../../../../constants/images";
import { useProfileEditStore } from "../../../../store/useProfileEditStore";
import { WoodCard } from "../../../common/game/WoodCard";
import { AvatarOption } from "./AvatarOption";

export function AvatarChoiceCard() {
  const avatar = useProfileEditStore((state) => state.avatar);

  return (
    <WoodCard title="Choose an Avatar" bodyStyle={styles.body}>
      <View style={styles.row}>
        {AVATAR_CHOICES.map(({ key, label, image }) => (
          <AvatarOption
            key={key}
            label={label}
            image={image}
            selected={avatar === key}
            onPress={() => useProfileEditStore.getState().setAvatar(key)}
          />
        ))}
      </View>
    </WoodCard>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 10, paddingBottom: 12 },
  // Vertical padding leaves room for the check badge poking above a tile.
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
  },
});
