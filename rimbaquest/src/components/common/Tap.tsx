import React from 'react';
import { Pressable } from 'react-native';
import { styles } from '../../styles/theme';

export function Tap({
  children,
  onPress,
  style,
  label,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object | object[];
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && !disabled && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}
