import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { decorDepth, MAP_DECOR } from "../homeMapLayout";
import { MapCritters } from "./MapCritters";

// The map's standing things — decor props and walking animals
export function MapGroundLayer() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {MAP_DECOR.map(({ source, rotate, ...placement }) => (
        <Image
          key={`${placement.left}-${placement.top}`}
          source={source}
          style={[
            styles.decor,
            placement,
            { zIndex: decorDepth(placement.top + placement.height) },
            rotate ? { transform: [{ rotate }] } : null,
          ]}
          resizeMode="stretch"
        />
      ))}
      <MapCritters layer="ground" />
    </View>
  );
}

const styles = StyleSheet.create({
  decor: { position: "absolute" },
});
