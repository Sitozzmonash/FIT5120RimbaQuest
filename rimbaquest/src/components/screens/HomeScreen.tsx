import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RecentCapture, UserProfile } from '../../types';
import { AVATAR_ICONS, HOME_IMAGES, IMAGES, imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { styles } from '../../styles/theme';

export function HomeScreen({
  currentUser,
  displayProgress,
  recentCaptures,
  notice,
  onOpenProfile,
  onOpenCollection,
  onOpenLocations,
  onStartDiscovery,
  onOpenBattle,
}: {
  currentUser: UserProfile;
  displayProgress: { found: number; total: number; xp: number };
  recentCaptures: RecentCapture[];
  notice: string | null;
  onOpenProfile: () => void;
  onOpenCollection: () => void;
  onOpenLocations: () => void;
  onStartDiscovery: () => void;
  onOpenBattle: () => void;
}) {
  const insets = useSafeAreaInsets();
  const collectedPercent = displayProgress.total
    ? Math.round((displayProgress.found / displayProgress.total) * 100)
    : 0;

  return (
    <View style={styles.homeRoot}>
      <LinearGradient
        colors={['#C8F0D8', '#E0F5E9', '#F0FAF4', '#E8F6EE']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.homeBackground}
      />
      <View style={[styles.decoCircle1, { pointerEvents: 'none' }]} />
      <View style={[styles.decoCircle2, { pointerEvents: 'none' }]} />
      <View style={[styles.decoCircle3, { pointerEvents: 'none' }]} />
      <View style={[styles.decoCircle4, { pointerEvents: 'none' }]} />

      <ScrollView
        contentContainerStyle={[
          styles.homeScroll,
          { paddingTop: 16 + insets.top, paddingBottom: 40 + insets.bottom },
        ]}
      >
        <View style={styles.brandHeader}>
          <Image source={HOME_IMAGES.brandLogo} style={styles.brandLogo} resizeMode="contain" />
        </View>

        {notice && <Text style={styles.notice}>{notice}</Text>}

        <View style={styles.profileCardWrap}>
          <Tap label="View Profile" style={styles.profileCard} onPress={onOpenProfile}>
            <LinearGradient colors={['#FFFFFF', '#F4FCF6']} style={styles.profileCardGradient} />
            <View style={styles.profileRow}>
              <View style={styles.avatarFrame}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarEmojiLarge}>{AVATAR_ICONS[currentUser.avatar] || '🦛'}</Text>
                </View>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.levelBadge}>
                  <LinearGradient colors={['#FFD940', '#FFC314']} style={styles.levelBadgeGradient}>
                    <Text style={styles.levelBadgeText}>⭐ Level {currentUser.level}</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.profileName}>{currentUser.display_name}</Text>
                <Text style={styles.profileSubtitle}>Age {currentUser.age} Explorer</Text>
              </View>
            </View>
          </Tap>
          <Image
            source={HOME_IMAGES.leafDecor}
            style={[styles.leafDecorFloat, { pointerEvents: 'none' }]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionHeading}>Explore Nature</Text>

          <View style={styles.collectionTileWrap}>
            <Tap label="Open your collection" style={styles.collectionTile} onPress={onOpenCollection}>
              <LinearGradient colors={['#FFFBE8', '#FFF2C0']} style={styles.collectionTileGradient} />
              <Image source={HOME_IMAGES.collectionBook} style={styles.collectionBookImage} resizeMode="cover" />
              <View style={styles.collectionContent}>
                <View style={styles.collectionHeader}>
                  <Text style={styles.collectionTitle}>Collection</Text>
                  <Text style={styles.collectionSubtitle}>Your animal album</Text>
                </View>
                <View style={styles.collectionProgress}>
                  <View style={styles.collectionProgressRow}>
                    <Text style={styles.collectionProgressText}>
                      {displayProgress.found}/{displayProgress.total} discovered
                    </Text>
                    <Text style={styles.collectionProgressPercent}>{collectedPercent}%</Text>
                  </View>
                  <View style={styles.progressTrackSm}>
                    <View style={[styles.progressFillSm, { width: `${collectedPercent}%` }]} />
                  </View>
                </View>
              </View>
            </Tap>
            <Image
              source={HOME_IMAGES.pandaDecor}
              style={[styles.pandaDecorFloat, { pointerEvents: 'none' }]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.tileRow}>
            <Tap label="Discover wildlife locations" style={styles.actionTile} onPress={onOpenLocations}>
              <LinearGradient colors={['#FFF5EE', '#FFE4D0']} style={styles.actionTileGradient} />
              <Image source={HOME_IMAGES.tileDiscover} style={styles.actionTileIcon} resizeMode="contain" />
              <Text style={styles.actionTileLabel}>Discover</Text>
            </Tap>
            <Tap label="Capture a wildlife sighting" style={styles.actionTile} onPress={onStartDiscovery}>
              <LinearGradient colors={['#EDFAD0', '#D8F0A8']} style={styles.actionTileGradient} />
              <Image source={HOME_IMAGES.tileCapture} style={styles.actionTileIcon} resizeMode="contain" />
              <Text style={styles.actionTileLabel}>Capture</Text>
            </Tap>
            <Tap label="Wildlife card battles" style={styles.actionTile} onPress={onOpenBattle}>
              <LinearGradient colors={['#EEF5FF', '#D8E8F8']} style={styles.actionTileGradient} />
              <Image source={HOME_IMAGES.tileBattle} style={styles.actionTileIcon} resizeMode="contain" />
              <Text style={styles.actionTileLabel}>Battle</Text>
            </Tap>
          </View>
        </View>

        <View style={styles.continueSection}>
          <View style={styles.continueHeaderRow}>
            <Text style={styles.sectionHeading}>Continue Learning</Text>
            <Tap label="See all discoveries" style={styles.seeAllTap} onPress={onOpenCollection}>
              <Text style={styles.seeAllOrange}>See all</Text>
            </Tap>
          </View>

          {recentCaptures.length ? (
            recentCaptures.map((capture) => (
              <View key={`${capture.id}-${capture.recorded_at}`} style={styles.learnCard}>
                <LinearGradient colors={['#FFFFFF', '#F4FCF6']} style={styles.learnCardGradient} />
                <Image source={imageFor(capture) ?? IMAGES.recent} style={styles.learnThumb} />
                <View style={styles.learnInfo}>
                  <Text style={styles.learnName}>{capture.common_name}</Text>
                  <View style={styles.learnMetaRow}>
                    <View style={styles.learnCategoryPill}>
                      <LinearGradient colors={['#E8FADC', '#D4F0B8']} style={styles.learnCategoryPillGradient}>
                        <Text style={styles.learnCategoryText}>{capture.category}</Text>
                      </LinearGradient>
                    </View>
                    <Text style={styles.learnLocationText} numberOfLines={1}>
                      • {capture.location_label || 'Kuala Lumpur, Malaysia'}
                    </Text>
                  </View>
                  <View style={styles.learnProgressTrack}>
                    <View style={[styles.learnProgressFill, { width: '100%' }]} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.learnEmpty}>
              <Text style={styles.muted}>Your latest confirmed discoveries will appear here.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
