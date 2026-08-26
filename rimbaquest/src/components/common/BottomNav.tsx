import React from 'react';
import { Text, View } from 'react-native';
import { Tap } from './Tap';
import { Screen } from '../../types';
import { styles } from '../../styles/theme';

export function BottomNav({
  screen,
  onNavigate,
  onStartDiscovery,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onStartDiscovery: () => void;
}) {
  return (
    <View style={styles.bottomNav}>
      <Nav icon="⌂" label="Home" active={screen === 'home'} onPress={() => onNavigate('home')} />
      <Nav icon="🗺️" label="Places" active={screen === 'locations'} onPress={() => onNavigate('locations')} />
      <Tap label="Record wildlife sighting" style={styles.recordButton} onPress={onStartDiscovery}>
        <View style={styles.cameraNavIcon}>
          <View style={styles.cameraNavLens} />
        </View>
      </Tap>
      <Nav icon="🗃️" label="Cards" active={screen === 'collection'} onPress={() => onNavigate('collection')} />
      <Nav
        icon="⚔️"
        label="Battle"
        active={screen === 'battle_select' || screen === 'battle_arena'}
        onPress={() => onNavigate('battle_select')}
      />
      <Nav icon="👤" label="Profile" active={screen === 'progress'} onPress={() => onNavigate('progress')} />
    </View>
  );
}

function Nav({
  icon,
  label,
  onPress,
  active = false,
  disabled = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tap label={label} onPress={onPress} disabled={disabled} style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navActive, disabled && styles.navDisabled]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navActive, disabled && styles.navDisabled]}>{label}</Text>
    </Tap>
  );
}
