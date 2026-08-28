import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AVATAR_CHOICES } from "../../../../constants/images";
import { Tap } from "../../../common/Tap";

// Optional avatar selector shown on step 1 of account creation.
export function AvatarPicker({
  avatar,
  setAvatar,
}: {
  avatar: string;
  setAvatar: (s: string) => void;
}) {
  return (
    <View style={styles.createAvatarSection}>
      <Text style={styles.createAvatarLabel}>Choose an Avatar - Optional</Text>
      <View style={styles.createAvatarRow}>
        {AVATAR_CHOICES.map((choice) => {
          const active = avatar === choice.key;
          return (
            <Tap
              key={choice.key}
              label={`Choose ${choice.key} avatar`}
              style={[
                styles.createAvatarChoice,
                active && styles.createAvatarChoiceActive,
              ]}
              onPress={() => setAvatar(choice.key)}
            >
              <Image
                source={choice.image}
                style={styles.createAvatarImage}
                resizeMode="cover"
              />
              {active && (
                <View style={styles.createAvatarBadge}>
                  <MaterialIcons name="check" size={12} color="#FFFFFF" />
                </View>
              )}
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createAvatarSection: { gap: 8 },
  createAvatarLabel: { color: "#2D7A4E", fontSize: 13, fontWeight: "700" },
  createAvatarRow: { flexDirection: "row", gap: 12 },
  createAvatarChoice: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#D8EDD8",
    overflow: "hidden",
  },
  createAvatarChoiceActive: { borderWidth: 2, borderColor: "#0A4D26" },
  createAvatarImage: { width: "100%", height: "100%" },
  createAvatarBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
});
