import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { RecentCapture, UserProfile } from '../../types';
import { AVATAR_ICONS, IMAGES, imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Quest, Section, Stat } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function HomeScreen({
  currentUser,
  displayProgress,
  recentCaptures,
  notice,
  onOpenProfile,
  onOpenLocations,
  onStartDiscovery,
  onOpenBattle,
}: {
  currentUser: UserProfile;
  displayProgress: { found: number; total: number; xp: number };
  recentCaptures: RecentCapture[];
  notice: string | null;
  onOpenProfile: () => void;
  onOpenLocations: () => void;
  onStartDiscovery: () => void;
  onOpenBattle: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topBrandRow}>
        <Text style={styles.brand}>RimbaQuest</Text>
        <Tap label="View Profile" style={styles.avatarPill} onPress={onOpenProfile}>
          <Text style={styles.avatarEmoji}>{AVATAR_ICONS[currentUser.avatar] || '🦛'}</Text>
          <Text style={styles.avatarName}>{currentUser.display_name}</Text>
        </Tap>
      </View>

      {notice && <Text style={styles.notice}>{notice}</Text>}

      <View style={styles.hero}>
        <Text style={styles.level}>LV. {currentUser.level} JUNGLE SCOUT</Text>
        <Text style={styles.heroTitle}>Welcome, {currentUser.display_name}!</Text>
        <Text style={styles.heroCopy}>
          Every discovery helps protect{'\n'}Malaysia’s precious rainforest wildlife!
        </Text>
        <Text style={styles.mascot}>🌿</Text>
      </View>

      <View style={styles.stats}>
        <Stat value={`${displayProgress.found} / ${displayProgress.total}`} label="Wildlife Discovered" />
        <Stat value={`${displayProgress.xp}`} label="Explorer Points" />
      </View>

      <Section title="Begin Your Adventure" />
      <Quest
        number="1"
        title="Explore Wildlife Places"
        detail="Find where animals live in KL & Malaysia!"
        onPress={onOpenLocations}
      />
      <Quest
        number="2"
        title="Record a Discovery"
        detail="Take a photo and log your sighting!"
        onPress={onStartDiscovery}
      />
      <Quest
        number="3"
        title="Wildlife Card Battles"
        detail="Battle with your unlocked cards!"
        onPress={onOpenBattle}
      />

      <Section title="Recent Captures" />
      {recentCaptures.length ? (
        <View style={styles.recentGrid}>
          {recentCaptures.map((capture) => (
            <View key={`${capture.id}-${capture.recorded_at}`} style={styles.recentItem}>
              <Image source={imageFor(capture) ?? IMAGES.recent} style={styles.recentImage} />
              <View style={styles.recentCopy}>
                <Text style={styles.cardTitle}>{capture.common_name}</Text>
                <Text style={styles.muted}>{capture.location_label || 'Kuala Lumpur, Malaysia'}</Text>
                <Text style={styles.categoryPill}>{capture.category}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.recentEmpty}>
          <Text style={styles.muted}>Your latest confirmed discoveries will appear here.</Text>
        </View>
      )}
    </ScrollView>
  );
}
