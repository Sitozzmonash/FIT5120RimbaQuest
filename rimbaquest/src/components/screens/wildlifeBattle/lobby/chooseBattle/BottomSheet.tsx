import React from "react";
import {
  Image,
  ImageStyle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BATTLE_IMAGES } from "../../../../../constants/images";
import { FONTS } from "../../../../../constants/fonts";
import { GAME_COLORS } from "../../../../common/game/gameTheme";
import { Tap } from "../../../../common/Tap";

const INK = GAME_COLORS.ink;
const CHEVRON_LEFT = require("../../../../../../assets/game/chevron-left.png");

function RoundButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: number;
  onPress: () => void;
}) {
  return (
    <Tap label={label} onPress={onPress} style={styles.roundButton}>
      <Image
        source={icon}
        style={styles.roundIcon as ImageStyle}
        resizeMode="contain"
      />
    </Tap>
  );
}

export function BottomSheet({
  visible,
  title,
  onClose,
  onBack,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onBack ?? onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <View
          style={[styles.sheet, { paddingBottom: 26 + insets.bottom }]}
          accessibilityViewIsModal
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            {onBack ? (
              <RoundButton label="Back" icon={CHEVRON_LEFT} onPress={onBack} />
            ) : null}
            <Text style={styles.title}>{title}</Text>
            <RoundButton
              label="Close"
              icon={BATTLE_IMAGES.close}
              onPress={onClose}
            />
          </View>
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(7, 30, 15, 0.65)" },
  sheet: {
    maxHeight: "80%",
    gap: 14,
    paddingTop: 10,
    paddingHorizontal: 18,
    backgroundColor: GAME_COLORS.paper,
    borderTopWidth: 3,
    borderColor: INK,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    boxShadow: "0px -6px 0px rgba(7, 60, 29, 0.5)",
  },
  grabber: {
    alignSelf: "center",
    width: 54,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#C9B88C",
    borderWidth: 2,
    borderColor: INK,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 24,
    color: GAME_COLORS.heading,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    boxShadow: `0px 3px 0px ${INK}`,
  },
  roundIcon: { width: 16, height: 16 },
  body: { gap: 14, paddingBottom: 6 },
});
