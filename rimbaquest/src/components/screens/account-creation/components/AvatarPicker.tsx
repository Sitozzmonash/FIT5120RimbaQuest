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
      <Text style={styles.createAvatarLabel}>Choose an Avatar</Text>
      <View style={styles.createAvatarRow}>
        {AVATAR_CHOICES.map((choice) => {
          const active = avatar === choice.key;
          return (
            <Tap
              key={choice.key}
              label={`Choose ${choice.key} avatar`}
              style={styles.createAvatarChoice}
              onPress={() => setAvatar(choice.key)}
            >
              <View
                style={[
                  styles.createAvatarCircle,
                  active && styles.createAvatarChoiceActive,
                ]}
              >
                <Image
                  source={choice.image}
                  style={styles.createAvatarImage}
                  resizeMode="cover"
                />
              </View>
              {active && (
                <View style={styles.createAvatarBadge}>
                  <MaterialIcons name="check" size={14} color="#FFFFFF" />
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
  createAvatarRow: { flexDirection: "row", gap: 16 },
  createAvatarChoice: { flex: 1, aspectRatio: 1 },
  createAvatarCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#D8EDD8",
    overflow: "hidden",
  },
  createAvatarChoiceActive: { borderWidth: 3, borderColor: "#0A4D26" },
  createAvatarImage: { width: "100%", height: "100%" },
  createAvatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
});
