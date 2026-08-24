import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { Species } from '../../types';
import { IMAGES, imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, Info } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function CameraScreen({
  cameraRef,
  cameraPermission,
  onRequestPermission,
  onTakePhoto,
  onPickFromGallery,
  onUseSamplePhoto,
  onBack,
}: {
  cameraRef: React.RefObject<CameraView | null>;
  cameraPermission: any;
  onRequestPermission: () => void;
  onTakePhoto: () => void;
  onPickFromGallery: () => void;
  onUseSamplePhoto: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.cameraPage}>
      {!cameraPermission ? (
        <View style={styles.cameraPermission}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      ) : !cameraPermission.granted ? (
        <View style={styles.cameraPermission}>
          <Text style={styles.cameraTitle}>Camera access is needed to record your wildlife discovery.</Text>
          <Tap label="Allow camera" style={styles.primary} onPress={onRequestPermission}>
            <Text style={styles.primaryText}>Allow Camera</Text>
          </Tap>
          <Tap label="Upload Photo from Device" style={styles.secondary} onPress={onPickFromGallery}>
            <Text style={styles.secondaryText}>📁 Choose from Device Gallery</Text>
          </Tap>
          <Tap label="Use Sample Photo" style={styles.secondary} onPress={onUseSamplePhoto}>
            <Text style={styles.secondaryText}>Use Sample Wildlife Photo</Text>
          </Tap>
          <Tap label="Go back" style={styles.cameraBackButton} onPress={onBack}>
            <Text style={styles.cameraBackText}>Back</Text>
          </Tap>
        </View>
      ) : (
        <>
          <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
          <View style={styles.cameraOverlay}>
            <Tap label="Go back" style={styles.cameraBackButton} onPress={onBack}>
              <Text style={styles.cameraBackText}>‹</Text>
            </Tap>
            <Text style={styles.cameraBrand}>RimbaQuest Wildlife Camera</Text>
            <Text style={styles.cameraHint}>Point at wildlife & tap shutter to capture</Text>
            <Text style={styles.cameraPersonalRecord}>Photo is a personal record, not automated AI identification</Text>
            <View style={styles.cameraActionsRow}>
              <Tap label="Gallery" style={styles.samplePhotoButton} onPress={onPickFromGallery}>
                <Text style={styles.samplePhotoText}>📁 Gallery</Text>
              </Tap>
              <Tap label="Take photo" style={styles.shutter} onPress={onTakePhoto}>
                <View style={styles.shutterInner} />
              </Tap>
              <Tap label="Sample Photo" style={styles.samplePhotoButton} onPress={onUseSamplePhoto}>
                <Text style={styles.samplePhotoText}>Sample</Text>
              </Tap>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export function CategoryScreen({
  photo,
  categories,
  onSelectCategory,
  onBack,
}: {
  photo: any;
  categories: string[];
  onSelectCategory: (cat: string) => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Record a Discovery" onBack={onBack} />
      <Image source={photo} style={styles.heroImage} />
      <Text style={styles.caption}>Your personal discovery photo</Text>
      <Text style={styles.pageTitle}>Choose a Wildlife Category</Text>
      <Text style={styles.subTitle}>What type of animal did you observe?</Text>
      <View style={styles.grid}>
        {categories.map((item) => (
          <Tap
            key={item}
            label={`Choose ${item}`}
            style={styles.categoryTile}
            onPress={() => onSelectCategory(item)}
          >
            <Image source={IMAGES[item as keyof typeof IMAGES]} style={styles.tileImage} />
            <View style={styles.tileShade} />
            <Text style={styles.tileLabel}>{item}s</Text>
          </Tap>
        ))}
      </View>
    </ScrollView>
  );
}

export function SpeciesScreen({
  photo,
  category,
  speciesList,
  search,
  setSearch,
  onChooseSpecies,
  onBack,
}: {
  photo: any;
  category: string;
  speciesList: Species[];
  search: string;
  setSearch: (s: string) => void;
  onChooseSpecies: (item: Species) => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Record a Discovery" onBack={onBack} />
      <Image source={photo} style={styles.heroImage} />
      <Text style={styles.caption}>Your personal discovery photo</Text>
      <Text style={styles.pageTitle}>Which {category.toLowerCase()} did you see?</Text>
      <Text style={styles.subTitle}>Select the species that matches your observation</Text>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Search species name or scientific name..."
          placeholderTextColor="#879089"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Tap label="Clear" style={styles.searchClear} onPress={() => setSearch('')}>
            <Text style={styles.searchClearText}>×</Text>
          </Tap>
        )}
      </View>
      {speciesList.length ? (
        <View style={styles.grid}>
          {speciesList.map((item) => (
            <Tap
              key={item.id}
              label={`View ${item.common_name}`}
              style={styles.speciesCard}
              onPress={() => onChooseSpecies(item)}
            >
              <Image source={imageFor(item)!} style={styles.speciesImage} />
              <Text numberOfLines={1} style={styles.cardTitle}>{item.common_name}</Text>
              <View style={styles.cardBottomRow}>
                <Text style={styles.categoryText}>{item.category}</Text>
                <Text style={styles.hpBadgeMini}>❤️ {item.hp || 120}</Text>
              </View>
            </Tap>
          ))}
        </View>
      ) : (
        <View style={styles.searchEmpty}>
          <Text style={styles.searchEmptyTitle}>No matching species found</Text>
          <Text style={styles.muted}>Try searching a different name or clear to see all {category}s.</Text>
        </View>
      )}
    </ScrollView>
  );
}

export function ConfirmScreen({
  photo,
  selected,
  discoveryLocation,
  setDiscoveryLocation,
  onConfirm,
  onChangeSpecies,
  onBack,
}: {
  photo: any;
  selected: Species;
  discoveryLocation: string;
  setDiscoveryLocation: (s: string) => void;
  onConfirm: () => void;
  onChangeSpecies: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Confirm Discovery" onBack={onBack} />
      <Image source={photo} style={styles.confirmImage} />
      <Text style={styles.caption}>Your personal discovery photo</Text>
      <Text style={styles.pageTitle}>
        {selected.common_name} <Text style={styles.categoryPill}>{selected.category}</Text>
      </Text>
      <Text style={styles.scientific}>{selected.scientific_name}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>OBSERVATION LOCATION</Text>
        <TextInput
          style={styles.textInput}
          value={discoveryLocation}
          onChangeText={setDiscoveryLocation}
          placeholder="Enter location (e.g. Bukit Gasing, FRIM)..."
        />
      </View>

      <Info
        label="DATE & TIME"
        value={new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
      />
      <Text style={styles.question}>Is this the species you saw?</Text>
      <Text style={styles.subTitle}>Double-check the photo and details before saving your discovery.</Text>

      <Tap label="Record my discovery" style={styles.primary} onPress={onConfirm}>
        <Text style={styles.primaryText}>Yes, Record My Discovery! (+100 XP)</Text>
      </Tap>
      <Tap label="Choose another species" style={styles.secondary} onPress={onChangeSpecies}>
        <Text style={styles.secondaryText}>Choose Another Species</Text>
      </Tap>
    </ScrollView>
  );
}

export function SuccessScreen({
  selected,
  discoveryLocation,
  onViewCard,
  onEnterBattle,
  onViewCollection,
  onRecordAnother,
  onBack,
}: {
  selected: Species;
  discoveryLocation: string;
  onViewCard: () => void;
  onEnterBattle: () => void;
  onViewCollection: () => void;
  onRecordAnother: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={[styles.content, styles.success]}>
      <View style={{ alignSelf: 'stretch' }}>
        <Header title="Discovery Recorded" onBack={onBack} />
      </View>
      <Text style={styles.successSmall}>🎉 Awesome Work!</Text>
      <Text style={styles.successTitle}>New Wildlife Card Unlocked!</Text>
      <Text style={styles.level}>Level 1 · Discovered</Text>
      <Image source={imageFor(selected)!} style={styles.unlockImage} />
      <Text style={styles.pageTitle}>{selected.common_name}</Text>
      <Text style={styles.scientific}>{selected.scientific_name}</Text>
      <View style={styles.infoPair}>
        <Info label="LOCATION" value={discoveryLocation} />
        <Info label="STATUS" value="Confirmed" />
      </View>
      <Text style={styles.xp}>✨ +100 Explorer Experience Points</Text>
      <Tap label="View my card" style={[styles.primary, styles.fullWidth]} onPress={onViewCard}>
        <Text style={styles.primaryText}>View Wildlife Card</Text>
      </Tap>
      <Tap label="Enter Card Battle" style={[styles.secondary, styles.fullWidth]} onPress={onEnterBattle}>
        <Text style={styles.secondaryText}>⚔️ Battle With This Card!</Text>
      </Tap>
      <Tap label="View my collection" style={[styles.primary, styles.fullWidth]} onPress={onViewCollection}>
        <Text style={styles.primaryText}>View My Collection</Text>
      </Tap>
      <Tap label="Record another discovery" style={styles.textButton} onPress={onRecordAnother}>
        <Text style={styles.textButtonText}>Record Another Discovery</Text>
      </Tap>
    </ScrollView>
  );
}
