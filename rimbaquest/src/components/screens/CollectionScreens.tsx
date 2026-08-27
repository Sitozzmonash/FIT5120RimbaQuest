import React from 'react';
import { FlatList, Image, ScrollView, Text, View } from 'react-native';
import { GalleryItem, Screen, Species } from '../../types';
import { WILDLIFE_FILTERS } from '../../constants/seed';
import { imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, Info, ProgressCard, Section, Stat } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function CollectionScreen({
  speciesList,
  discoveredIds,
  filter,
  setFilter,
  displayProgress,
  onSelectSpecies,
  onSelectLocked,
  onBack,
}: {
  speciesList: Species[];
  discoveredIds: string[];
  filter: string;
  setFilter: (f: string) => void;
  displayProgress: { found: number; total: number; xp: number; level?: number };
  onSelectSpecies: (s: Species) => void;
  onSelectLocked: (s: Species) => void;
  onBack: () => void;
}) {
  return (
    <FlatList
      data={speciesList}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.collectionGridRow}
      contentContainerStyle={[styles.content, styles.collectionGridContent]}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews
      ListHeaderComponent={
        <>
          <Header title="My Collection" onBack={onBack} />
          <ProgressCard progress={displayProgress} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {WILDLIFE_FILTERS.map((item) => (
              <Tap
                key={item.id}
                label={`Filter ${item.label}`}
                style={[styles.chip, filter === item.id && styles.chipActive]}
                onPress={() => setFilter(item.id)}
              >
                <Text style={[styles.chipText, filter === item.id && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </Tap>
            ))}
          </ScrollView>
        </>
      }
      renderItem={({ item }) =>
        discoveredIds.includes(item.id) ? (
          <Tap
            label={`View ${item.common_name}`}
            style={styles.collectionCard}
            onPress={() => onSelectSpecies(item)}
          >
            <Image source={imageFor(item)!} style={styles.speciesImage} />
            <Text numberOfLines={1} style={styles.cardTitle}>{item.common_name}</Text>
            <View style={styles.cardBottomRow}>
              <Text style={styles.categoryText}>Discovered</Text>
              <Text style={styles.hpBadgeMini}>❤️ {item.hp || 120}</Text>
            </View>
          </Tap>
        ) : (
          <Tap
            label={`Preview undiscovered ${item.common_name}`}
            style={styles.collectionCard}
            onPress={() => onSelectLocked(item)}
          >
            <Image source={imageFor(item)!} style={[styles.speciesImage, styles.lockedSpeciesImage]} />
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockedLabel}>UNDISCOVERED</Text>
            </View>
            <Text numberOfLines={1} style={styles.cardTitle}>{item.common_name}</Text>
            <Text style={styles.muted}>{item.category}</Text>
          </Tap>
        )
      }
    />
  );
}

export function SpeciesDetailScreen({
  species,
  screen,
  photos,
  onTabChange,
  onStartBattle,
  onBack,
}: {
  species: Species;
  screen: Screen;
  photos: GalleryItem[];
  onTabChange: (s: Screen) => void;
  onStartBattle: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title={species.common_name} onBack={onBack} />
      <View style={styles.tabs}>
        {([
          ['about', 'About'],
          ['battle_stats', 'Battle Stats'],
          ['facts', 'Fun Facts'],
          ['gallery', 'Gallery'],
        ] as [Screen, string][]).map(([key, label]) => (
          <Tap
            key={key}
            label={label}
            style={[styles.tab, screen === key && styles.tabActive]}
            onPress={() => onTabChange(key)}
          >
            <Text style={[styles.tabText, screen === key && styles.tabTextActive]}>{label}</Text>
          </Tap>
        ))}
      </View>

      {screen === 'about' && <AboutTab item={species} />}
      {screen === 'battle_stats' && <BattleStatsTab item={species} onBattle={onStartBattle} />}
      {screen === 'facts' && <FactsTab item={species} />}
      {screen === 'gallery' && <GalleryTab photos={photos} />}
    </ScrollView>
  );
}

export function LockedScreen({
  species,
  onStartDiscovery,
  onBack,
}: {
  species: Species;
  onStartDiscovery: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Undiscovered Wildlife" onBack={onBack} />
      <View style={styles.lockedDetail}>
        <Image source={imageFor(species)!} style={styles.lockedImage} />
        <Text style={styles.pageTitle}>
          {species.common_name} <Text style={styles.categoryPill}>{species.category}</Text>
        </Text>
        <Text style={styles.scientific}>{species.scientific_name}</Text>
        {species.fun_fact ? <Info label="INTRODUCTION" value={species.fun_fact} /> : null}
        {species.habitat ? <Info label="HABITAT" value={species.habitat} /> : null}
        <Info label="DISCOVERY HINT" value="Explore parks and nature reserves in KL and the Klang Valley, then record a photo to unlock this Wildlife Card." />
        <View style={styles.lockedWarningBox}>
          <Text style={styles.lockedWarningTitle}>Locked until discovered</Text>
          <Text style={styles.lockedWarningText}>
            The full Wildlife Card, personal gallery and battle use unlock after you save a confirmed discovery of this species.
          </Text>
        </View>
        <Tap label="Record discovery" style={styles.primary} onPress={onStartDiscovery}>
          <Text style={styles.primaryText}>Record a Sighting to Unlock</Text>
        </Tap>
      </View>
    </ScrollView>
  );
}

function AboutTab({ item }: { item: Species }) {
  const role =
    item.category === 'Butterfly'
      ? 'Helps pollinate flowering plants while moving between gardens and forest edges.'
      : item.category === 'Bird'
      ? 'Helps spread seeds and supports a healthy rainforest food web.'
      : item.category === 'Reptile'
      ? 'Helps keep the food web in balance as part of its wetland and forest habitat.'
      : 'Plays an important role in Malaysia’s forest food web and healthy habitat.';

  return (
    <>
      <View style={styles.badges}>
        <Text style={styles.badge}>Discovered</Text>
        <Text style={styles.badge}>{item.category}</Text>
      </View>
      <Info label="COMMON NAME" value={item.common_name} />
      <Info label="SCIENTIFIC NAME" value={item.scientific_name} />
      {item.act716_status ? <Info label="PROTECTION STATUS" value={item.act716_status} /> : null}
      {item.habitat ? <Info label="HABITAT" value={item.habitat} /> : null}
      {item.diet ? <Info label="DIET" value={item.diet} /> : null}
      <Info label="ECOLOGICAL ROLE" value={role} />
      {item.fun_fact ? <Info label="SPECIES DESCRIPTION" value={item.fun_fact} /> : null}
    </>
  );
}

function BattleStatsTab({ item, onBattle }: { item: Species; onBattle: () => void }) {
  return (
    <View style={styles.battleStatsContainer}>
      <View style={styles.battleStatHeader}>
        <Text style={styles.battleStatHeaderTitle}>Card Combat Attributes</Text>
        <View style={styles.stats}>
          <Stat value={`❤️ ${item.hp || 120}`} label="HP" />
          <Stat value={`⚔️ ${item.base_attack || 25}`} label="Base Attack" />
        </View>
      </View>

      <Section title="SPECIAL ABILITIES" />
      {[
        item.ability_1 || 'Ability 1',
        item.ability_2 || 'Ability 2',
        item.ability_3 || 'Ability 3',
      ].map((ability, idx) => (
        <View key={idx} style={styles.abilitySlotLocked}>
          <Text style={styles.abilitySlotIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.abilitySlotName}>Ability {idx + 1}: {ability}</Text>
            <Text style={styles.abilitySlotHint}>Locked</Text>
          </View>
        </View>
      ))}

      <Tap label="Battle with Card" style={styles.primary} onPress={onBattle}>
        <Text style={styles.primaryText}>Enter Card Battle</Text>
      </Tap>
    </View>
  );
}

function FactsTab({ item }: { item: Species }) {
  return (
    <>
      <Section title="Species Fun Facts" />
      {[item.fun_fact, 'Wild animals need peaceful space to thrive in their natural habitat.', 'Watch from a respectful distance and never feed or touch wildlife.'].filter(Boolean).map((fact, idx) => (
        <Text key={idx} style={styles.fact}>• {fact}</Text>
      ))}
    </>
  );
}

function GalleryTab({ photos }: { photos: GalleryItem[] }) {
  return (
    <>
      <Text style={styles.subTitle}>Your confirmed discovery photos for this species.</Text>
      {photos.length ? (
        <View style={styles.gallery}>
          {photos.map((item, index) => (
            <View key={`${item.photo_url || 'photo'}-${index}`} style={styles.galleryItem}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.galleryImage} />
              ) : (
                <View style={[styles.galleryImage, styles.galleryPlaceholder]} />
              )}
              {item.location_label ? <Text style={styles.muted}>{item.location_label}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.galleryEmpty}>
          <Text style={styles.galleryEmptyTitle}>No personal photos yet</Text>
          <Text style={styles.muted}>Each saved observation of this species will appear here.</Text>
        </View>
      )}
    </>
  );
}
