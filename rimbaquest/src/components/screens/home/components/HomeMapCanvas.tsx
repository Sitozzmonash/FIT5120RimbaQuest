import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { MAP_HEIGHT, MAP_WIDTH } from "../homeMapLayout";

export function HomeMapCanvas({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(0);

  // scale the map to fit available spaces
  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setScale(Math.min(width / MAP_WIDTH, height / MAP_HEIGHT));
  };

  return (
    <View style={styles.area} onLayout={onLayout}>
      {scale > 0 && (
        <View style={[styles.canvas, { transform: [{ scale }] }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, alignItems: "center", justifyContent: "center" },
  canvas: { width: MAP_WIDTH, height: MAP_HEIGHT },
});
