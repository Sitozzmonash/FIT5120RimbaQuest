import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../../constants/fonts";
import { HOME_COLORS } from "../homeTheme";

// How far the sheet sits below its fully open position while collapsed.
export const RESUME_SHEET_PEEK = 190;

// Space left above the fully opened sheet so the map edge stays visible.
const TOP_GAP = 12;
const DRAG_THRESHOLD = 4;

export function ResumeSheet({
  availableHeight,
  children,
}: {
  availableHeight: number;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const peekHeight = RESUME_SHEET_PEEK + insets.bottom;
  const sheetHeight = Math.max(availableHeight - TOP_GAP, peekHeight);

  // How far the sheet sits below its fully open position while collapsed.
  const travel = sheetHeight - peekHeight;

  const [expanded, setExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(travel)).current;
  const offset = useRef(travel);

  const snapTo = (open: boolean) => {
    offset.current = open ? 0 : travel;
    setExpanded(open);
    Animated.spring(translateY, {
      toValue: offset.current,
      speed: 18,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  // Re-anchor when the screen size is first measured or changes.
  useEffect(() => {
    offset.current = expanded ? 0 : travel;
    translateY.setValue(offset.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > DRAG_THRESHOLD,
        onPanResponderMove: (_, g) => {
          translateY.setValue(
            Math.min(Math.max(offset.current + g.dy, 0), travel),
          );
        },
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dy) <= DRAG_THRESHOLD) {
            snapTo(offset.current !== 0);
            return;
          }
          const position = offset.current + g.dy;
          const open = g.vy < -0.3 || (g.vy <= 0.3 && position < travel / 2);
          snapTo(open);
        },
        onPanResponderTerminate: () => snapTo(offset.current === 0),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [travel],
  );

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, Math.max(travel, 1)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            pointerEvents: expanded ? "auto" : "none",
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close recent animals"
          onPress={() => snapTo(false)}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          { height: sheetHeight, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.shadow} />
        <View style={styles.sheet}>
          <View
            {...panResponder.panHandlers}
            style={styles.dragZone}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={
              expanded ? "Collapse recent animals" : "Expand recent animals"
            }
          >
            <View style={styles.handle} />
            <Text style={styles.heading}>Pick Up Where You Left Off</Text>
          </View>
          <ScrollView
            scrollEnabled={expanded}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 20 + insets.bottom },
            ]}
          >
            {children}
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 60, 29, 0.35)",
  },
  container: { position: "absolute", left: 0, right: 0, bottom: 0 },
  shadow: {
    position: "absolute",
    top: -5,
    bottom: 5,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(7, 60, 29, 0.45)",
  },
  sheet: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: HOME_COLORS.paper,
    borderTopWidth: 3,
    borderTopColor: HOME_COLORS.ink,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  dragZone: { gap: 10, paddingHorizontal: 18, paddingBottom: 10 },
  handle: {
    alignSelf: "center",
    width: 58,
    height: 11,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: HOME_COLORS.ink,
    backgroundColor: "#C9B88C",
  },
  heading: {
    fontFamily: FONTS.display,
    color: HOME_COLORS.heading,
    fontSize: 20,
  },
  content: { gap: 12, paddingHorizontal: 18 },
});
