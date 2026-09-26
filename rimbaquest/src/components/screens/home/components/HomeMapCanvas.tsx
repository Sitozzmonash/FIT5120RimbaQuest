import React, { createContext, useContext, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { MAP_HEIGHT, MAP_WIDTH } from "../homeMapLayout";

type RoamRange = { minX: number; maxX: number };

const RoamRangeContext = createContext<RoamRange>({ minX: 0, maxX: MAP_WIDTH });

export function useMapRoamRange() {
  return useContext(RoamRangeContext);
}

// Scales the fixed-size map to fit the height it's given. The drawn layout
// (menus, trail, scenery) stays centred at its designed size; any extra width
// on wide screens is open ground the animals can wander into.
export function HomeMapCanvas({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState({ scale: 0, spill: 0 });

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    const scale = Math.min(width / MAP_WIDTH, height / MAP_HEIGHT);

    // Extra map units available on each side of the centred layout.
    const spill = Math.max(0, (width / scale - MAP_WIDTH) / 2);
    setLayout({ scale, spill });
  };

  return (
    <View style={styles.area} onLayout={onLayout}>
      {layout.scale > 0 && (
        <RoamRangeContext.Provider
          value={{ minX: -layout.spill, maxX: MAP_WIDTH + layout.spill }}
        >
          <View
            style={[styles.canvas, { transform: [{ scale: layout.scale }] }]}
          >
            {children}
          </View>
        </RoamRangeContext.Provider>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Clips animals roaming the side space at the edge of the screen.
  area: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvas: { width: MAP_WIDTH, height: MAP_HEIGHT },
});
