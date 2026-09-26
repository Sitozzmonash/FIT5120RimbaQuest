import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";

// The child's own photo, dimmed, behind the discovery steps. It is fitted
// ("contain") so the whole photo shows; any leftover space stays dark.
export function PhotoBackdrop({ dim = 0.5 }: { dim?: number }) {
  const photoUri = useDiscoveryStore((state) => state.photoUri);

  return (
    <View style={[StyleSheet.absoluteFill, styles.base, { pointerEvents: "none" }]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${dim})` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: "#0B0F0B" },
});
