import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useProfileEditStore } from "../../../store/useProfileEditStore";
import { FitScrollView } from "../../common/FitScrollView";
import { GameButton } from "../../common/game/GameButton";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { AvatarChoiceCard } from "./components/AvatarChoiceCard";
import { ExplorerDetailsCard } from "./components/ExplorerDetailsCard";
import { ProfileErrorNote } from "./components/ProfileErrorNote";
import { UnsavedChangesModal } from "./components/UnsavedChangesModal";
import { PROFILE_COLORS } from "./profileTheme";
import { saveProfile } from "./saveProfile";

export function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const error = useProfileEditStore((state) => state.error);
  const saving = useProfileEditStore((state) => state.saving);
  const isDirty = useProfileEditStore(
    (state) =>
      state.displayName !== state.originalUsername ||
      state.avatar !== state.originalAvatar,
  );
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const leave = () => {
    if (isDirty) {
      setConfirmingLeave(true);
      return;
    }
    useNavigationStore.getState().goBack();
  };

  return (
    <View style={styles.root}>
      <GameScreenHeader title="Edit Profile" onBack={leave} />

      <FitScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ExplorerDetailsCard />
        <AvatarChoiceCard />
        {error ? <ProfileErrorNote message={error} /> : null}
        <GameButton
          label={saving ? "Saving..." : "Save My Changes"}
          loading={saving}
          onPress={() => void saveProfile()}
          size="m"
        />
      </FitScrollView>

      <UnsavedChangesModal
        visible={confirmingLeave}
        onCancel={() => setConfirmingLeave(false)}
        onConfirm={() => {
          setConfirmingLeave(false);
          useNavigationStore.getState().goBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PROFILE_COLORS.background },
  content: {
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
