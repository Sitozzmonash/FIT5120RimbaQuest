import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AVATAR_ICONS } from "../../../constants/images";
import { Tap } from "../../common/Tap";
import { Header } from "../../common/CommonUI";
import { styles as globalStyles } from "../../../styles/theme";

export function ProfileEditScreen({
  displayName,
  setDisplayName,
  age,
  setAge,
  avatar,
  setAvatar,
  onSave,
  onBack,
  isDirty,
}: {
  displayName: string;
  setDisplayName: (s: string) => void;
  age: string;
  setAge: (s: string) => void;
  avatar: string;
  setAvatar: (s: string) => void;
  onSave: () => void;
  onBack: () => void;
  isDirty: boolean;
}) {
  const leave = () => {
    if (!isDirty) {
      onBack();
      return;
    }
    const message = "You have unsaved changes. Leave this page and lose them?";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) onBack();
      return;
    }
    Alert.alert("Unsaved changes", message, [
      { text: "Keep editing", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onBack },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.content}>
      <Header title="Edit Profile" onBack={leave} />
      <View style={styles.form}>
        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.inputLabel}>DISPLAY NAME</Text>
          <TextInput
            style={globalStyles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>
        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.inputLabel}>AGE</Text>
          <TextInput
            style={globalStyles.textInput}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.optionalLabel}>AVATAR (optional)</Text>
        <View style={styles.avatarPicker}>
          {Object.entries(AVATAR_ICONS).map(([key, emoji]) => (
            <Tap
              key={key}
              label={key}
              style={[
                styles.avatarChoice,
                avatar === key && styles.avatarChoiceActive,
              ]}
              onPress={() => setAvatar(key)}
            >
              <Text style={styles.avatarChoiceEmoji}>{emoji}</Text>
              <Text style={styles.avatarChoiceName}>{key}</Text>
            </Tap>
          ))}
        </View>
        <Tap label="Save Changes" style={globalStyles.primary} onPress={onSave}>
          <Text style={globalStyles.primaryText}>Save Profile Changes</Text>
        </Tap>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { gap: 10 },
  optionalLabel: {
    color: "#879089",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 4,
  },
  avatarPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 6,
  },
  avatarChoice: {
    width: "30%",
    borderWidth: 1,
    borderColor: "#DFE7E1",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  avatarChoiceActive: {
    borderColor: "#0BA84A",
    borderWidth: 2,
    backgroundColor: "#EDF5EF",
  },
  avatarChoiceEmoji: { fontSize: 24 },
  avatarChoiceName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#566159",
    textTransform: "capitalize",
    marginTop: 2,
  },
});
