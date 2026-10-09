import React from "react";
import { StyleSheet } from "react-native";
import { useProfileEditStore } from "../../../../store/useProfileEditStore";
import { useUserStore } from "../../../../store/useUserStore";
import { WoodCard } from "../../../common/game/WoodCard";
import { ProfileField } from "./ProfileField";

function formatAge(age: string): string {
  const n = parseInt(age, 10);
  return Number.isFinite(n) && n >= 18 ? "18+" : age;
}

export function ExplorerDetailsCard() {
  const email = useUserStore((state) => state.currentUser.email);
  const displayName = useProfileEditStore((state) => state.displayName);
  const age = useProfileEditStore((state) => state.age);

  return (
    <WoodCard title="Explorer Details" bodyStyle={styles.body}>
      <ProfileField
        label="EXPLORER NAME"
        icon="person-outline"
        value={displayName}
        hint="You can use this name when you log in."
        onChangeText={(text) => useProfileEditStore.getState().setDisplayName(text)}
        inputProps={{ autoCapitalize: "none", autoCorrect: false }}
      />
      <ProfileField
        label="EMAIL"
        icon="mail-outline"
        value={email}
        hint="This email cannot be changed here."
        locked
      />
      <ProfileField
        label="AGE"
        icon="calendar-today"
        value={formatAge(age)}
        hint="Your age cannot be changed here."
        locked
      />
    </WoodCard>
  );
}

const styles = StyleSheet.create({
  body: { gap: 8, paddingTop: 10, paddingBottom: 12 },
});
