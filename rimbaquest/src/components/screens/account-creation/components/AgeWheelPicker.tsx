import React, { useEffect, useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useController } from "react-hook-form";
import { FONTS } from "../../../../constants/fonts";
import { AUTH_COLORS } from "../../auth/authTheme";
import { AccountFormValues } from "../accountFormTypes";

const AGE_MIN = 5;
const AGE_MAX = 18;
const AGE_ITEM_HEIGHT = 44;
const AGE_WHEEL_HEIGHT = 220;
const AGE_PADDING = (AGE_WHEEL_HEIGHT - AGE_ITEM_HEIGHT) / 2;

function labelFor(n: number): string {
  return n === AGE_MAX ? `${n}+` : String(n);
}

// Scrollable, snap-to-item age picker (5-17, plus an "18+" bucket) for step 2
// of account creation. Reads and writes its own field on the shared
// account-creation form.
export function AgeWheelPicker() {
  const { field } = useController<AccountFormValues, "age">({
    name: "age",
    rules: { required: "Please scroll to select your age." },
  });
  const value = field.value;

  const numbers = useMemo(
    () => Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i),
    [],
  );
  const scrollRef = useRef<ScrollView>(null);
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialIndex = value == null ? 0 : Math.max(0, numbers.indexOf(value));

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: initialIndex * AGE_ITEM_HEIGHT,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimeout.current) clearTimeout(settleTimeout.current);
    };
  }, []);

  const settleToOffset = (offsetY: number) => {
    const index = Math.round(offsetY / AGE_ITEM_HEIGHT);
    const clamped = Math.min(numbers.length - 1, Math.max(0, index));
    const next = numbers[clamped];
    if (next !== value) field.onChange(next);
    scrollRef.current?.scrollTo({
      y: clamped * AGE_ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    settleToOffset(e.nativeEvent.contentOffset.y);
  };

  const handleScrollWeb = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    if (settleTimeout.current) clearTimeout(settleTimeout.current);
    settleTimeout.current = setTimeout(() => settleToOffset(offsetY), 100);
  };

  return (
    <View style={styles.createAgeWheelWrap}>
      <View style={styles.createAgeWheel}>
        <View style={styles.createAgeWheelHighlight} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={AGE_ITEM_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: AGE_PADDING - 2 }}
          {...(Platform.OS === "web"
            ? { scrollEventThrottle: 16, onScroll: handleScrollWeb }
            : { onMomentumScrollEnd: handleMomentumEnd })}
        >
          {numbers.map((n) => {
            const selected = value !== null && n === value;
            return (
              <View key={n} style={styles.createAgeWheelItem}>
                <Text
                  style={[
                    styles.createAgeWheelText,
                    selected && styles.createAgeWheelTextActive,
                  ]}
                >
                  {labelFor(n)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        {value === null && (
          <View style={styles.createAgeWheelPlaceholder} pointerEvents="none">
            <Text style={styles.createAgeWheelPlaceholderText}>Scroll to select</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createAgeWheelWrap: { alignItems: "center" },
  createAgeWheel: {
    width: 140,
    height: AGE_WHEEL_HEIGHT,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: AUTH_COLORS.inputBorder,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  createAgeWheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: (AGE_WHEEL_HEIGHT - 4 - AGE_ITEM_HEIGHT) / 2,
    height: 44,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: AUTH_COLORS.ink,
    backgroundColor: "rgba(63, 154, 78, 0.12)",
  },
  createAgeWheelItem: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  createAgeWheelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: AUTH_COLORS.placeholder,
  },
  createAgeWheelTextActive: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: AUTH_COLORS.title,
  },
  createAgeWheelPlaceholder: {
    position: "absolute",
    left: 0,
    right: 0,
    top: (AGE_WHEEL_HEIGHT - 4 - AGE_ITEM_HEIGHT) / 2,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  createAgeWheelPlaceholderText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 12,
    color: AUTH_COLORS.icon,
  },
});
