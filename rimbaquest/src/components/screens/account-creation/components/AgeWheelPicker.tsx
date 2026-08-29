import React, { useEffect, useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const AGE_MIN = 5;
const AGE_MAX = 18;
const AGE_ITEM_HEIGHT = 44;
const AGE_WHEEL_HEIGHT = 220;
const AGE_PADDING = (AGE_WHEEL_HEIGHT - AGE_ITEM_HEIGHT) / 2;

function labelFor(n: number): string {
  return n === AGE_MAX ? `${n}+` : String(n);
}

// Scrollable, snap-to-item age picker (5-17, plus an "18+" bucket for
// step 2 of account creation).
export function AgeWheelPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const numbers = useMemo(
    () => Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i),
    [],
  );
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = Math.max(0, numbers.indexOf(value));

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: initialIndex * AGE_ITEM_HEIGHT,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / AGE_ITEM_HEIGHT);
    const clamped = Math.min(numbers.length - 1, Math.max(0, index));
    const next = numbers[clamped];
    if (next !== value) onChange(next);
    scrollRef.current?.scrollTo({
      y: clamped * AGE_ITEM_HEIGHT,
      animated: true,
    });
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
          contentContainerStyle={{ paddingVertical: AGE_PADDING }}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {numbers.map((n) => {
            const selected = n === value;
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createAgeWheelWrap: { alignItems: "center" },
  createAgeWheel: {
    width: 140,
    height: 220,
    borderRadius: 20,
    backgroundColor: "#F4FCF6",
    overflow: "hidden",
  },
  createAgeWheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 88,
    height: 44,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#0A4D26",
    backgroundColor: "rgba(10,77,38,0.05)",
  },
  createAgeWheelItem: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  createAgeWheelText: { fontSize: 18, color: "#9AB8A6", fontWeight: "600" },
  createAgeWheelTextActive: {
    fontSize: 24,
    color: "#0A4D26",
    fontWeight: "900",
  },
});
