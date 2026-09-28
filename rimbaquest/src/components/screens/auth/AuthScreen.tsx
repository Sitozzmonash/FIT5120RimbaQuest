import React from "react";
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { FitScrollView } from "../../common/FitScrollView";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AUTH_COLORS } from "./authTheme";
import { AUTH_IMAGES } from "../../../constants/images";

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

// Screen width the bush decorations were laid out for; other widths scale them.
const DECOR_DESIGN_WIDTH = 390;
const DECOR_MIN_SCALE = 0.85;
const DECOR_MAX_SCALE = 1.2;

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
  decorations = true,
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
  // The bush decorations around the screen edges.
  decorations?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // const headerHeight = Math.max(92, insets.top + 56);
  const headerHeight = insets.top + 24;
  const { width } = useWindowDimensions();
  // Each bush group's wrapper is a zero-size point at its corner, so scaling
  // it grows or shrinks the whole cluster toward that corner.
  // Capped so wide screens (web, tablets) don't blow the bushes up.
  const scale = Math.min(
    Math.max(width / DECOR_DESIGN_WIDTH, DECOR_MIN_SCALE),
    DECOR_MAX_SCALE,
  );
  const decorScale = { transform: [{ scale }] };

  return (
    <View style={styles.root}>
      {/* <View style={[styles.glow, { top: 17 }]}>
        <SvgXml xml={TOP_GLOW} width={520} height={420} />
      </View>
      {bottomGlow && (
        <View style={[styles.glow, { top: 500 }]}>
          <SvgXml xml={BOTTOM_GLOW} width={520} height={380} />
        </View>
      )} */}

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FitScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            {
              // paddingTop: headerHeight + HERO_GAP,
              paddingTop: headerHeight,
              paddingBottom: 24 + insets.bottom,
            },
          ]}
        >
          {/* {centered && <View style={styles.fill} />} */}
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
          {/* {centered && <View style={styles.fill} />} */}
        </FitScrollView>
      </KeyboardAvoidingView>

      {decorations && (
        <>
        <View
          style={{
            position: "absolute",
            top: 50,
            left: "50%",
            pointerEvents: "none",
            ...decorScale,
          }}
        >
          <Image
            source={AUTH_IMAGES.topRightBush}
            style={{
              position: "absolute",
              bottom: -80,
              left: -120,
              width: 200,
              height: 200,
              transform: [{ rotate: "220deg" }],
            }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            position: "absolute",
            top: 50,
            right: 0,
            pointerEvents: "none",
            ...decorScale,
          }}
        >
          <Image
            source={AUTH_IMAGES.topRightBush}
            style={{
              position: "absolute",
              bottom: -90,
              right: -10,
              width: 200,
              height: 200,
              transform: [{ rotate: "-90deg" }],
            }}
            resizeMode="contain"
          />
          <Image
            source={AUTH_IMAGES.topRightBush}
            style={{
              position: "absolute",
              bottom: -40,
              right: -5,
              width: 100,
              height: 100,
              transform: [{ rotate: "-90deg" }],
            }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            position: "absolute",
            top: 50,
            pointerEvents: "none",
            ...decorScale,
          }}
        >
          <Image
            source={AUTH_IMAGES.topLeftBush}
            style={{
              position: "absolute",
              bottom: -70,
              left: -10,
              width: 200,
              height: 200,
              transform: [{ rotate: "90deg" }],
            }}
            resizeMode="contain"
          />
          <Image
            source={AUTH_IMAGES.topLeftBush}
            style={{
              position: "absolute",
              bottom: -40,
              left: -5,
              width: 100,
              height: 100,
              transform: [{ rotate: "90deg" }],
            }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            pointerEvents: "none",
            ...decorScale,
          }}
        >
          <Image
            source={AUTH_IMAGES.bottomRightBush}
            style={{
              position: "absolute",
              bottom: -91,
              left: -55,
              width: 192,
              height: 216,
            }}
            resizeMode="contain"
          />
          <Image
            source={AUTH_IMAGES.bottomRightBush}
            style={{
              position: "absolute",
              bottom: -83,
              left: -137,
              width: 160,
              height: 192,
            }}
            resizeMode="contain"
          />
          <Image
            source={AUTH_IMAGES.bottomRightBush}
            style={{
              position: "absolute",
              bottom: -83,
              left: -77,
              width: 160,
              height: 160,
            }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            position: "absolute",
            bottom: 0,
            pointerEvents: "none",
            ...decorScale,
          }}
        >
          <Image
            source={AUTH_IMAGES.bottomLeftBush}
            style={{
              position: "absolute",
              bottom: -60,
              left: -120,
              width: 240,
              height: 160,
            }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            pointerEvents: "none",
            ...decorScale,
          }}
        >
          <Image
            source={AUTH_IMAGES.bottomLeftBush}
            style={{
              position: "absolute",
              bottom: -50,
              right: -100,
              width: 240,
              height: 160,
            }}
            resizeMode="contain"
          />
        </View>
        </>
      )}
      {/* <AuthBrandHeader height={headerHeight} topInset={insets.top} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    // backgroundColor: AUTH_COLORS.background,
    backgroundColor: "#D8ECCE",
    alignContent: "center",
  },
  fill: { flex: 1 },
  glow: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  scroll: { flexGrow: 1, justifyContent: "center" },
  // Drawn over the card so the animals stand on its top edge.
  hero: { alignItems: "center", zIndex: 1, pointerEvents: "none" },
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
    alignItems: "stretch",
    // backgroundColor: AUTH_COLORS.card,
    // borderWidth: 3,
    // The thick bottom edge is the card's solid drop shadow.
    // borderBottomWidth: 9,
    // borderColor: AUTH_COLORS.ink,
    // borderRadius: 22,
  },
});
