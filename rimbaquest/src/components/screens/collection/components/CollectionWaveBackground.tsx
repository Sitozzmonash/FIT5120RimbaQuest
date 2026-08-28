import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const WAVE_BASELINE = 270;
const WAVE_AMPLITUDE = 10;
const WAVE_SAMPLES = 60;

function buildWavePath(width: number, baseline: number): string {
  if (!width) return "";
  const points: string[] = ["M 0 0"];
  for (let i = 0; i <= WAVE_SAMPLES; i++) {
    const t = i / WAVE_SAMPLES;
    const x = t * width;
    const y =
      baseline + WAVE_AMPLITUDE * Math.cos(t * Math.PI * 2 - Math.PI / 2);
    points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  points.push(`L ${width} 0`, "Z");
  return points.join(" ");
}

export function CollectionWaveBackground({
  width,
  heroHeight,
}: {
  width: number;
  heroHeight: number;
}) {
  const baseline = heroHeight || WAVE_BASELINE;
  const height = baseline + WAVE_AMPLITUDE;
  const path = useMemo(() => buildWavePath(width, baseline), [width, baseline]);

  return (
    <View
      style={[styles.collectionWaveContainer, { height }]}
      pointerEvents="none"
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Path d={path} fill="#0A4D26" />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collectionWaveContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
});
