import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useController } from "react-hook-form";
import { FONTS } from "../../../../constants/fonts";
import { AVATAR_CHOICES } from "../../../../constants/images";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { AUTH_COLORS } from "../../auth/authTheme";
import { Tap } from "../../../common/Tap";
import { AccountFormValues } from "../accountFormTypes";

export function AvatarPicker() {
  const { field } = useController<AccountFormValues, "avatar">({
    name: "avatar",
  });

  return (
    <View style={styles.createAvatarSection}>
      <Text style={styles.createAvatarLabel}>Choose an Avatar *</Text>
      <View style={styles.createAvatarRow}>
        {AVATAR_CHOICES.map((choice) => {
          const active = field.value === choice.key;
          return (
            <Tap
              key={choice.key}
              label={`Choose ${choice.key} avatar`}
              style={styles.createAvatarChoice}
              onPress={() => field.onChange(choice.key)}
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
  createAvatarLabel: {
    fontFamily: FONTS.bodyExtraBold,
    color: AUTH_COLORS.title,
    fontSize: 13,
  },
  createAvatarRow: { flexDirection: "row", gap: 12 },
  createAvatarChoice: { flex: 1, aspectRatio: 1 },
  createAvatarCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: AUTH_COLORS.inputBorder,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  createAvatarChoiceActive: { borderWidth: 3, borderColor: AUTH_COLORS.ink },
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
    backgroundColor: GAME_COLORS.go,
    alignItems: "center",
    justifyContent: "center",
  },
});
