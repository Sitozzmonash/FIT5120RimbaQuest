// Draws the running effect's particles, overlays, word pop and floating numbers over the stage.
import React from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { GAME_COLORS } from "../../../../common/game/gameTheme";
import { Particle, Overlay, Live } from "./fxTypes";
import { FX } from "./useBattleFX";

const INK = GAME_COLORS.ink;

/** Goes once over the stage (absolute fill, above both cards). It never blocks touches. */
export function BattleFXLayer({ fx }: { fx: FX }) {
  const s = fx.state;
  if (!s) return null;
  const { word, dmg, gain } = fx.values;
  const ticks = s.r.numberTicks ?? 1;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {s.overs.map((o) => <OverlayView key={o.key} o={o} />)}
      {s.parts.map((p) => <ParticleView key={p.key} p={p} />)}

      {s.r.word ? (
        <Animated.View style={[styles.burstWrap, {
          left: s.r.word.at.x - 80,
          top: s.r.word.at.y - 30,
          opacity: word,
          transform: [{ scale: word.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { rotate: "-8deg" }],
        }]}>
          <Text style={[styles.burstText, { color: s.r.word.color }]}>{s.r.word.text}</Text>
        </Animated.View>
      ) : null}

      {s.damage ? (
        <Animated.Text style={[styles.floatText, {
          color: s.type === "poison" ? "#4CB35A" : "#E5484D",
          left: s.to.x + 30,
          top: s.to.y - 20,
          opacity: dmg.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
          transform: [{ translateY: dmg.interpolate({ inputRange: [0, 1], outputRange: [10, -40] }) }],
        }]}>
          -{Math.ceil(s.damage / ticks)}
        </Animated.Text>
      ) : null}

      {s.gain ? (
        <Animated.Text style={[styles.floatText, styles.gainText, {
          color: s.gain.color,
          left: s.from.x + 20,
          top: s.from.y - 30,
          opacity: gain.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
          transform: [{ translateY: gain.interpolate({ inputRange: [0, 1], outputRange: [10, -40] }) }],
        }]}>
          {s.gain.label}
        </Animated.Text>
      ) : null}
    </View>
  );
}

function ParticleView({ p }: { p: Live<Particle> }) {
  const size = p.size ?? 34;
  const dx = p.to.x - p.from.x;
  const dy = p.to.y - p.from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;                                 // normal, used for the arc
  const ny = dx / len;
  const arc = p.arc ?? 0;
  const [s0, s1] = p.scale ?? [1, 1];
  const opacity = p.fade === "out"
    ? p.v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] })
    : p.fade === "inOut"
      ? p.v.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 1, 0] })
      : p.v.interpolate({ inputRange: [0, 0.01, 0.99, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View style={{
      position: "absolute",
      left: p.from.x - size / 2,
      top: p.from.y - size / 2,
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
      opacity,
      transform: [
        { translateX: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, dx / 2 + nx * arc, dx] }) },
        { translateY: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, dy / 2 + ny * arc, dy] }) },
        { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin ?? 0}deg`] }) },
        { scale: p.v.interpolate({ inputRange: [0, 1], outputRange: [s0, s1] }) },
      ],
    }}>
      {p.image
        ? <Image source={p.image} style={{ width: size * 0.8, height: size * 0.8 }} resizeMode="contain" />
        : <Text style={{ fontSize: size * 0.8 }}>{p.glyph}</Text>}
    </Animated.View>
  );
}

function OverlayView({ o }: { o: Live<Overlay> }) {
  const c = o.color ?? "#FFFFFF";
  const v = o.v;
  switch (o.kind) {
    case "flash":
      return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c, opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.75, 0] }) }]} />;

    case "ring": {
      const size = o.size ?? 90;
      return <Animated.View style={{
        position: "absolute", left: o.at.x - size / 2, top: o.at.y - size / 2, width: size, height: size, borderRadius: size / 2,
        borderWidth: 6, borderColor: c,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.6] }) }],
      }} />;
    }

    case "slash": {
      const w = o.size ?? 170;
      return <Animated.View style={{
        position: "absolute", left: o.at.x - w / 2, top: o.at.y - 5, width: w, height: 10, borderRadius: 5,
        backgroundColor: c, borderWidth: 2, borderColor: INK,
        opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { rotate: `${o.rotate ?? -35}deg` },
          { scaleX: v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }) },
          { scaleY: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0.2] }) },
        ],
      }} />;
    }

    case "beam":
      return <Animated.View style={{
        position: "absolute", left: o.at.x - 9, top: 0, width: 18, height: o.at.y, backgroundColor: c,
        borderLeftWidth: 3, borderRightWidth: 3, borderColor: "#FFD66E",
        opacity: v.interpolate({ inputRange: [0, 0.1, 0.5, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ scaleX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 2] }) }],
      }} />;

    case "bubble": {
      const size = o.size ?? 150;
      return <Animated.View style={{
        position: "absolute", left: o.at.x - size / 2, top: o.at.y - size / 2, width: size, height: size, borderRadius: size / 2,
        backgroundColor: "rgba(111,195,232,0.18)", borderWidth: 4, borderColor: c,
        opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 0.2, 0.3, 1], outputRange: [0.2, 1.08, 1, 1] }) }],
      }} />;
    }

    case "tint":
      return <Animated.View style={{
        position: "absolute", left: o.at.x - 70, top: o.at.y - 70, width: 140, height: 140, borderRadius: 70, backgroundColor: c,
        opacity: v.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.45, 0.45, 0] }),
      }} />;

    case "crack":
      return (
        <Animated.View style={{ position: "absolute", left: o.at.x, top: o.at.y, opacity: v.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }) }}>
          {[-150, -110, -70, -30, 10].map((deg) => (
            <Animated.View key={deg} style={{
              position: "absolute", left: 0, top: -2, width: 46, height: 4, borderRadius: 2, backgroundColor: c,
              transform: [{ rotate: `${deg}deg` }, { translateX: 23 }, { scaleX: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }) }],
            }} />
          ))}
        </Animated.View>
      );

    case "speed":
      return <Animated.View style={{
        position: "absolute", left: o.at.x - 60, top: o.at.y - 2, width: 120, height: 4, borderRadius: 2, backgroundColor: c,
        opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.9, 0] }),
        transform: [{ rotate: `${o.rotate ?? 0}deg` }, { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-40, 60] }) }],
      }} />;

    case "teeth":
      return (
        <Animated.View style={{
          position: "absolute", left: o.at.x - 55, top: o.at.y - 32, width: 110, height: 64,
          opacity: v.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ rotate: "-10deg" }, { scaleY: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1.8, 1, 1] }) }],
        }}>
          {Array.from({ length: 5 }, (_, i) => <View key={`u${i}`} style={[styles.toothDown, { left: i * 18, top: 0 }]} />)}
          {Array.from({ length: 4 }, (_, i) => <View key={`d${i}`} style={[styles.toothUp, { left: i * 18 + 9, top: 44 }]} />)}
        </Animated.View>
      );
  }
}

const styles = StyleSheet.create({
  toothDown: {
    position: "absolute", width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 20,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#FFFFFF",
  },
  toothUp: {
    position: "absolute", width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 20,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#FFFFFF",
  },
  burstWrap: { position: "absolute", width: 160, height: 60, alignItems: "center", justifyContent: "center" },
  burstText: {
    fontFamily: FONTS.display,
    fontSize: 28,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 1,
  },
  floatText: {
    position: "absolute",
    fontFamily: FONTS.display,
    fontSize: 32,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  gainText: { fontSize: 22 },
});
