import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../constants/fonts";

const LOADING_BACKGROUND = require("../../../assets/loading-bg.png");
const LOADING_MESSAGES = [
  "Getting all animals ready...",
  "Gathering your animal cards...",
  "Packing your explorer kit...",
  "Preparing your adventure...",
];

export function AppLoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.delay(1700),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished)
        setMessageIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    });
    return () => animation.stop();
  }, [messageIndex, opacity]);

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <ImageBackground
        source={LOADING_BACKGROUND}
        resizeMode="cover"
        style={styles.image}
      >
        <View style={[styles.footer, { paddingBottom: 32 + insets.bottom }]}>
          <View style={styles.caption}>
            <Text style={styles.label} accessibilityRole="text">
              Loading
            </Text>
            <Animated.Text
              style={[styles.message, { opacity }]}
              accessibilityRole="text"
            >
              {LOADING_MESSAGES[messageIndex]}
            </Animated.Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#68BCEC",
  },
  // Caps keep the portrait art (841x1870) from blowing up on desktop web.
  image: {
    width: "100%",
    height: "100%",
    maxWidth: 480,
    maxHeight: 1067,
    alignSelf: "center",
    justifyContent: "flex-end",
  },
  footer: { alignItems: "center", paddingBottom: 32, paddingHorizontal: 20 },
  caption: {
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    minHeight: 88,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(8, 67, 35, 0.82)",
    borderRadius: 20,
  },
  label: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: "#FFFFFF",
    textShadowColor: "#0B411E",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 5,
  },
  message: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
