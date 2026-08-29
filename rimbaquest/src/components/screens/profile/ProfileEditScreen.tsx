import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AVATAR_CHOICES } from "../../../constants/images";
import { Tap } from "../../common/Tap";
import { PrimaryButton } from "../../common/PrimaryButton";
import { ProfileHeader } from "./components/ProfileHeader";
import { UnsavedChangesModal } from "./components/UnsavedChangesModal";
import { styles as globalStyles } from "../../../styles/theme";

function formatAge(age: string): string {
  const n = parseInt(age, 10);
  return Number.isFinite(n) && n >= 18 ? "18+" : age;
}

export function ProfileEditScreen({
  displayName,
  setDisplayName,
  email,
  age,
  setAge,
  avatar,
  setAvatar,
  onSave,
  onBack,
  isDirty,
  error,
}: {
  displayName: string;
  setDisplayName: (s: string) => void;
  email: string;
  age: string;
  setAge: (s: string) => void;
  avatar: string;
  setAvatar: (s: string) => void;
  onSave: () => void;
  onBack: () => void;
  isDirty: boolean;
  error: string | null;
}) {
  const insets = useSafeAreaInsets();
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const leave = () => {
    if (!isDirty) {
      onBack();
      return;
    }
    setConfirmingLeave(true);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#C8F0D8", "#E0F5E9", "#F0FAF4", "#E8F6EE"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradientBg}
      />
      <View style={[styles.decoCircle1, { pointerEvents: "none" }]} />
      <View style={[styles.decoCircle2, { pointerEvents: "none" }]} />

      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <ProfileHeader title="Edit Profile" onBack={leave} />
      </View>

      <ScrollView
        contentContainerStyle={[
          globalStyles.content,
          { paddingTop: 8, paddingBottom: 32 + insets.bottom },
        ]}
      >
        <View style={styles.card}>
          <Text style={styles.inputLabel}>USERNAME</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="person-outline" size={18} color="#0A4D26" />
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.helpText}>
            This is also the name you use to sign in.
          </Text>

          <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>EMAIL</Text>
          <View style={[styles.inputBox, styles.inputBoxDisabled]}>
            <MaterialIcons name="mail-outline" size={18} color="#8A968E" />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />
          </View>
          <Text style={styles.helpText}>Email address cannot be changed.</Text>

          <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>AGE</Text>
          <View style={[styles.inputBox, styles.inputBoxDisabled]}>
            <MaterialIcons name="cake" size={18} color="#8A968E" />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formatAge(age)}
              editable={false}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.helpText}>Age cannot be changed here.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>CHOOSE AN AVATAR</Text>
          <View style={styles.avatarPicker}>
            {AVATAR_CHOICES.map(({ key, label, image }) => (
              <Tap
                key={key}
                label={key}
                style={[
                  styles.avatarChoice,
                  avatar === key && styles.avatarChoiceActive,
                ]}
                onPress={() => setAvatar(key)}
              >
                <Image
                  source={image}
                  style={styles.avatarChoiceImage}
                  resizeMode="cover"
                />
                <Text style={styles.avatarChoiceName}>{label}</Text>
                {avatar === key && (
                  <View style={styles.avatarChoiceCheck}>
                    <MaterialIcons name="check" size={13} color="#FFFFFF" />
                  </View>
                )}
              </Tap>
            ))}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label="Save Profile Changes"
          style={styles.saveBtn}
          onPress={onSave}
        />
      </ScrollView>

      <UnsavedChangesModal
        visible={confirmingLeave}
        onCancel={() => setConfirmingLeave(false)}
        onConfirm={() => {
          setConfirmingLeave(false);
          onBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradientBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  headerBar: { paddingHorizontal: 18 },
  decoCircle1: {
    position: "absolute",
    left: -30,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#78B833",
    opacity: 0.12,
  },
  decoCircle2: {
    position: "absolute",
    right: -40,
    bottom: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFC314",
    opacity: 0.08,
  },
  card: {
    borderColor: "#DFE7E1",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  inputLabel: {
    color: "#78817B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  inputLabelSpaced: { marginTop: 14 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D1E8D5",
    backgroundColor: "#F7FBF8",
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: "#1B211C", fontSize: 14, padding: 0 },
  inputBoxDisabled: { backgroundColor: "#EEF1EF", borderColor: "#DDE4E0" },
  inputDisabled: { color: "#8A968E" },
  helpText: { color: "#66756D", fontSize: 11, marginTop: 6 },
  avatarPicker: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  avatarChoice: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DFE7E1",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  avatarChoiceActive: {
    borderColor: "#0BA84A",
    borderWidth: 2,
    backgroundColor: "#EDF5EF",
  },
  avatarChoiceImage: { width: 68, height: 68, borderRadius: 34 },
  avatarChoiceName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#566159",
    textTransform: "capitalize",
    marginTop: 6,
  },
  avatarChoiceCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0BA84A",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    borderWidth: 1,
    borderColor: "#F3C6C6",
    backgroundColor: "#FCE8E8",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: "#B3261E",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  saveBtn: { marginTop: 14 },
});
