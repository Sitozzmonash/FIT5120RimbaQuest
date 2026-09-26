import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FONTS } from "../constants/fonts";

export default function RootLayout() {
  useFonts({
    [FONTS.display]: require("../../assets/fonts/LilitaOne-Regular.ttf"),
    [FONTS.bodySemiBold]: require("../../assets/fonts/Nunito-SemiBold.ttf"),
    [FONTS.bodyBold]: require("../../assets/fonts/Nunito-Bold.ttf"),
    [FONTS.bodyExtraBold]: require("../../assets/fonts/Nunito-ExtraBold.ttf"),
    [FONTS.bodyBlack]: require("../../assets/fonts/Nunito-Black.ttf"),
    [FONTS.button]: require("../../assets/fonts/Fredoka-Bold.ttf"),
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </SafeAreaProvider>
  );
}
