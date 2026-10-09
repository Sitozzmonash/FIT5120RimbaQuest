import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';
import { HOME_COLORS } from '../homeTheme';

// Tent + flag drawn from the design's triangle masks (90 x 84 frame).
export function CampTent() {
  return (
    <View style={[styles.tent, { pointerEvents: 'none' }]}>
      <Svg width={90} height={84}>
        <Rect x={43} y={0} width={3} height={20} fill="#5A2D0A" />
        <Polygon points="45,1 67,8 45,15" fill={HOME_COLORS.ink} />
        <Polygon points="46,4 61,8 46,12" fill={HOME_COLORS.goldLight} />
        <Polygon points="45,14 90,84 0,84" fill={HOME_COLORS.ink} />
        <Polygon points="45,21 45,81 5,81" fill="#F28C2E" />
        <Polygon points="45,21 85,81 45,81" fill="#D9661A" />
        <Polygon points="45,50 63,84 27,84" fill={HOME_COLORS.ink} />
        <Polygon points="45,56 59,81 31,81" fill="#5A2D0A" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  tent: { position: 'absolute', left: 0, top: 0 },
});
