import React from 'react';
import { Text, View } from 'react-native';
import { Tap } from './Tap';
import { styles } from '../../styles/theme';

export function Header({
  title,
  back = true,
  onBack,
}: {
  title: string;
  back?: boolean;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      {back && onBack ? (
        <Tap label="Go back" style={styles.back} onPress={onBack}>
          <Text style={styles.backText}>‹</Text>
        </Tap>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.backSpacer} />
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Section({ title, right }: { title: string; right?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right && <Text style={styles.seeAll}>{right}</Text>}
    </View>
  );
}

export function Quest({
  number,
  title,
  detail,
  onPress,
}: {
  number: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Tap label={title} style={styles.quest} onPress={onPress}>
      <Text style={styles.questNumber}>{number}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.muted}>{detail}</Text>
      </View>
    </Tap>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function ProgressCard({
  progress,
}: {
  progress: { found: number; total: number; xp: number; level?: number };
}) {
  const percentage = progress.total
    ? Math.min(100, Math.round((progress.found / progress.total) * 100))
    : 0;
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTop}>
        <View>
          <Text style={styles.infoLabel}>OVERALL COLLECTION PROGRESS</Text>
          <Text style={styles.progressValue}>
            {progress.found} / {progress.total} Wildlife Discovered
          </Text>
        </View>
        <Text style={styles.unlocked}>{percentage}% Complete</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <View style={styles.infoPair}>
        <Info label="EXPLORER POINTS" value={`${progress.xp} XP`} />
        <Info label="SCOUT RANK" value={`Level ${progress.level || 1}`} />
      </View>
    </View>
  );
}
