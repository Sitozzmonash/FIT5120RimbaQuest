import React from "react";
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { FitScrollView } from "../../common/FitScrollView";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AUTH_COLORS } from "./authTheme";

const glowSvg = (width: number, height: number, opacity: number) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse opacity="${opacity}" cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" fill="url(#glow)"/>
<defs>
<radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width / 2} ${height / 2}) scale(${width / 2} ${height / 2})">
<stop stop-color="#1A7A3A"/>
<stop offset="1" stop-color="#0E4527"/>
</radialGradient>
</defs>
</svg>`;

const TOP_GLOW = glowSvg(520, 420, 0.7);
const BOTTOM_GLOW = glowSvg(520, 380, 0.5);

// Space between the brand header and the hero art.
const HERO_GAP = 24;

// Shared frame for the auth screens: green backdrop with a soft glow, the
// brand header, and (optionally) hero art whose feet rest on the top of a
// cream card.
// The body only scrolls when the screen (or the keyboard) leaves too little room.
export function AuthScreen({
  hero,
  heroWidth,
  heroHeight,
  heroOverlap = 0,
  centered = false,
  bottomGlow = false,
  cardStyle,
  children,
}: {
  // Optional art standing on the card.
  hero?: ImageSourcePropType;
  heroWidth?: number;
  heroHeight?: number;
  // How far the art hangs down over the card.
  heroOverlap?: number;
  centered?: boolean;
  bottomGlow?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const headerHeight = Math.max(92, insets.top + 56);

  return (
    <View style={styles.root}>
      <View style={[styles.glow, { top: 17 }]}>
        <SvgXml xml={TOP_GLOW} width={520} height={420} />
      </View>
      {bottomGlow && (
        <View style={[styles.glow, { top: 500 }]}>
          <SvgXml xml={BOTTOM_GLOW} width={520} height={380} />
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FitScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: headerHeight + HERO_GAP,
              paddingBottom: 24 + insets.bottom,
            },
          ]}
        >
          {centered && <View style={styles.fill} />}
          {hero && (
            <View
              style={[
                styles.hero,
                { height: heroHeight, marginBottom: -heroOverlap },
              ]}
            >
              <Image
                source={hero}
                style={{ width: heroWidth, height: heroHeight }}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={[styles.card, cardStyle]}>{children}</View>
          {centered && <View style={styles.fill} />}
        </FitScrollView>
      </KeyboardAvoidingView>

      <AuthBrandHeader height={headerHeight} topInset={insets.top} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: AUTH_COLORS.background,
  },
  fill: { flex: 1 },
  glow: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  scroll: { flexGrow: 1 },
  // Drawn over the card so the animals stand on its top edge.
  hero: { alignItems: "center", zIndex: 1, pointerEvents: "none" },
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
    alignItems: "stretch",
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 3,
    // The thick bottom edge is the card's solid drop shadow.
    borderBottomWidth: 9,
    borderColor: AUTH_COLORS.ink,
    borderRadius: 22,
  },
});
