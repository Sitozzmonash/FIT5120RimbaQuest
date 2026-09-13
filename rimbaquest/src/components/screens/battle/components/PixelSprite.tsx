import React from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  getBattleArt,
  ROLE_CUES,
  CATEGORY_MARKERS,
  SPECIES_BATTLE_ART_CATALOGUE,
} from '../../../../constants/battleArt';

export type SpritePose = 'idle' | 'attack' | 'hit' | 'celebrate' | 'tired';

export interface PixelSpriteProps {
  category?: string;
  role?: string;
  speciesId?: string;
  size?: number;
  facing?: 'left' | 'right';
  pose?: SpritePose;
  showRoleCue?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PixelSprite({
  speciesId = '',
  category = '',
  role = '',
  size = 112,
  facing = 'right',
  pose = 'idle',
  showRoleCue = true,
  style,
}: PixelSpriteProps) {
  const art = getBattleArt(speciesId);
  const metadata = SPECIES_BATTLE_ART_CATALOGUE[speciesId];
  const effectiveRole = role || metadata?.role || '';
  const effectiveCategory = category || metadata?.category || '';
  const roleCue = ROLE_CUES[effectiveRole];
  const categoryMarker = CATEGORY_MARKERS[effectiveCategory];

  // Accessible label: canonical name and morphology info, or explicit unavailable
  const accessibilityLabel =
    art.status === 'unavailable'
      ? 'Art unavailable placeholder'
      : `${art.name}, ${effectiveCategory || 'Wildlife'} ${effectiveRole || ''} battle sprite (${pose} pose)`;

  // Pose transformation on 32x32 SVG coordinate space
  // attack: lunges forward and elevates slightly
  // hit: recoils backward, tilts
  // celebrate: lifts upwards, expansive
  // tired: sags downward and compresses
  let poseTransform = '';
  if (pose === 'attack') {
    poseTransform = 'translate(2, -1) scale(1.05)';
  } else if (pose === 'hit') {
    poseTransform = 'translate(-3, 1) scale(0.96)';
  } else if (pose === 'celebrate') {
    poseTransform = 'translate(0, -2) scale(1.04)';
  } else if (pose === 'tired') {
    poseTransform = 'translate(0, 3) scale(0.94, 0.88)';
  }

  const isFlipped = facing === 'left';
  const flipTransform = isFlipped ? 'translate(32 0) scale(-1 1)' : '';
  const combinedTransform = [flipTransform, poseTransform].filter(Boolean).join(' ');

  return (
    <View
      style={[{ width: size, height: size }, styles.container, style]}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Defs>
          {roleCue && (
            <RadialGradient id={`roleAura-${effectiveRole}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={roleCue.badgeColor} stopOpacity="0.45" />
              <Stop offset="70%" stopColor={roleCue.badgeColor} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={roleCue.badgeColor} stopOpacity="0" />
            </RadialGradient>
          )}
        </Defs>

        {/* External Role Cue: Ground Aura (does not mutate species anatomy) */}
        {showRoleCue && roleCue && (
          <Circle
            cx="16"
            cy="28"
            r="12"
            fill={`url(#roleAura-${effectiveRole})`}
            transform="scale(1, 0.35) translate(0, 50)"
          />
        )}

        {/* Pixel Sprite Body & Anatomy Layers */}
        <G transform={combinedTransform || undefined}>
          {art.layers.map(([fill, d], index) => (
            <Path key={index} fill={fill} d={d} />
          ))}
        </G>

        {/* External Role Cue: Floating Symbol Badge (top corner, non-intrusive) */}
        {showRoleCue && roleCue && (
          <G transform={isFlipped ? 'translate(24, 2) scale(0.32)' : 'translate(2, 2) scale(0.32)'}>
            <Circle cx="12" cy="12" r="11" fill="#1C2826" stroke={roleCue.badgeColor} strokeWidth="2.5" />
            <Path d={roleCue.iconPath} fill={roleCue.badgeColor} />
          </G>
        )}

        {/* Category pip indicator: small colored dot next to badge */}
        {categoryMarker && (
          <Circle
            cx={isFlipped ? 27 : 5}
            cy={11}
            r={1.8}
            fill={categoryMarker.color}
            stroke="#1C2826"
            strokeWidth={0.6}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
