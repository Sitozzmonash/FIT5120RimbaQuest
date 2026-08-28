import React from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AVATAR_CHOICES } from "../../../constants/images";
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
  error,
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
  error: string | null;
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
          <Text style={globalStyles.inputLabel}>USERNAME</Text>
          <TextInput
            style={globalStyles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>This is also the name you use to sign in.</Text>
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
        <Text style={styles.optionalLabel}>CHOOSE AN AVATAR</Text>
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
              <Image source={image} style={styles.avatarChoiceImage} resizeMode="cover" />
              <Text style={styles.avatarChoiceName}>{label}</Text>
            </Tap>
          ))}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  helpText: { color: "#66756D", fontSize: 11, marginTop: -4 },
  errorText: { color: "#C43C3C", fontSize: 12, fontWeight: "700" },
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
  avatarChoiceImage: { width: 44, height: 44, borderRadius: 22 },
  avatarChoiceName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#566159",
    textTransform: "capitalize",
    marginTop: 2,
  },
});
