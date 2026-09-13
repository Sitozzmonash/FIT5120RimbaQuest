import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BattleCombatant } from '../../../../types/battle';
import { ROLE_CUES, CATEGORY_MARKERS } from '../../../../constants/battleArt';

export interface BattleCombatantHudProps {
  combatant: BattleCombatant;
  isPlayer: boolean;
}

export function BattleCombatantHud({ combatant, isPlayer }: BattleCombatantHudProps) {
  const { name, energy, max_energy, shield, statuses, role, category } = combatant;
  const percentage = Math.max(0, Math.min(100, (energy / max_energy) * 100));
  const roleCue = ROLE_CUES[role];
  const categoryMarker = category ? CATEGORY_MARKERS[category] : undefined;

  return (
    <View
      style={[styles.card, isPlayer ? styles.playerBorder : styles.opponentBorder]}
      accessibilityLabel={`${name}, ${energy} of ${max_energy} Energy, ${shield} Shield, ${role} role`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {categoryMarker && (
          <View style={[styles.categoryBadge, { backgroundColor: categoryMarker.color }]}>
            <Text style={styles.categoryBadgeText}>{categoryMarker.label.slice(0, 4)}</Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.roleChip}>
          {roleCue && <View style={[styles.roleDot, { backgroundColor: roleCue.badgeColor }]} />}
          <Text style={styles.role}>{role.toUpperCase()}</Text>
        </View>
        <Text style={styles.energy}>
          {energy}/{max_energy} EN
        </Text>
      </View>

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: max_energy, now: energy }}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: isPlayer ? '#48BB78' : '#ED8936',
            },
          ]}
        />
      </View>

      {(shield > 0 || (statuses && statuses.length > 0)) && (
        <Text style={styles.status} numberOfLines={1}>
          {[
            shield > 0 ? `🛡 ${shield}` : '',
            ...(statuses || []).map((s) => `${s.name} ${s.potency}${s.id === 'guard' ? '%' : ''}`),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 248, 235, 0.95)',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  playerBorder: {
    borderColor: '#38A169',
  },
  opponentBorder: {
    borderColor: '#DD6B20',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  name: {
    flex: 1,
    color: '#1A2E26',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 2,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  role: {
    color: '#4A5568',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  energy: {
    color: '#2D3748',
    fontSize: 9.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
  },
  status: {
    color: '#2B6CB0',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
});
