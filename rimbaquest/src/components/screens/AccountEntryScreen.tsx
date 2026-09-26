import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AUTH_IMAGES } from "../../constants/images";
import { useLoginStore } from "../../store/useLoginStore";
import { useNavigationStore } from "../../store/useNavigationStore";
import { GameButton } from "../common/game/GameButton";
import { AuthScreen } from "./auth/AuthScreen";
import { authBodyStyle, authTitleStyle } from "./auth/authTheme";

export function AccountEntryScreen() {
  const goTo = (screen: "login" | "create_account") => {
    useLoginStore.getState().reset();
    useNavigationStore.getState().open(screen);
  };

  return (
    <AuthScreen
      hero={AUTH_IMAGES.heroTigerElephantTapir}
      heroWidth={320}
      heroHeight={220}
      heroOverlap={42}
      centered
      bottomGlow
      cardStyle={styles.card}
    >
      <View style={styles.intro}>
        <Text style={styles.title}>Start your wildlife adventure</Text>
        <Text style={authBodyStyle}>
          Log in to continue your journey or create an account to save your
          discoveries.
        </Text>
      </View>

      <View style={styles.buttons}>
        <GameButton label="Log In" size="m" onPress={() => goTo("login")} />
        <GameButton
          label="Create Account"
          variant="secondary"
          size="m"
          onPress={() => goTo("create_account")}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 24, paddingTop: 40 },
  intro: { gap: 10 },
  title: { ...authTitleStyle, fontSize: 22 },
  buttons: { gap: 12 },
});
