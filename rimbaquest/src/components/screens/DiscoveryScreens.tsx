import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { LocationItem, LocationMode, Species } from '../../types';
import { IMAGES, imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, Info } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function CameraScreen({
  cameraRef,
  cameraPermission,
  photoError,
  onRequestPermission,
  onTakePhoto,
  onPickFromGallery,
  onBack,
}: {
  cameraRef: React.RefObject<CameraView | null>;
  cameraPermission: { granted?: boolean } | null;
  photoError: string | null;
  onRequestPermission: () => void;
  onTakePhoto: () => void;
  onPickFromGallery: () => void;
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
          <Text style={styles.cameraTitle}>Point your camera at the wildlife, then take a photo or choose one from your gallery.</Text>
          {photoError ? (
            <>
              <Text style={styles.cameraError}>{photoError}</Text>
              <Tap label="Try Again" style={styles.secondary} onPress={onPickFromGallery}>
                <Text style={styles.secondaryText}>Try Again</Text>
              </Tap>
            </>
          ) : null}
          <Tap label="Allow camera" style={styles.primary} onPress={onRequestPermission}>
            <Text style={styles.primaryText}>Allow Camera</Text>
          </Tap>
          <Tap label="Upload Photo from Device" style={styles.secondary} onPress={onPickFromGallery}>
            <Text style={styles.secondaryText}>📁 Choose from Device Gallery</Text>
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
            <Text style={styles.cameraHint}>Point at the wildlife and tap the shutter to capture one photo</Text>
            {photoError ? (
              <>
                <Text style={styles.cameraError}>{photoError}</Text>
                <Tap label="Try Again" style={styles.secondary} onPress={onPickFromGallery}>
                  <Text style={styles.secondaryText}>Try Again</Text>
                </Tap>
              </>
            ) : null}
            <View style={styles.cameraActionsRow}>
              <Tap label="Gallery" style={styles.samplePhotoButton} onPress={onPickFromGallery}>
                <Text style={styles.samplePhotoText}>📁 Gallery</Text>
              </Tap>
              <Tap label="Take photo" style={styles.shutter} onPress={onTakePhoto}>
                <View style={styles.shutterInner} />
              </Tap>
              <View style={styles.samplePhotoButton}>
                <Text style={styles.samplePhotoText}> </Text>
              </View>
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
  onRetake,
  onBack,
}: {
  photo: { uri: string };
  categories: string[];
  onSelectCategory: (cat: string) => void;
  onRetake: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Record a Discovery" onBack={onBack} />
      <Image source={photo} style={styles.heroImage} />
      <Text style={styles.caption}>Your personal discovery photo</Text>
      <Tap label="Retake or replace photo" style={styles.textButton} onPress={onRetake}>
        <Text style={styles.textButtonText}>Retake or replace photo</Text>
      </Tap>
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
  photo: { uri: string };
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
          placeholder="Search species name..."
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
          <Text style={styles.searchEmptyTitle}>No matching species found.</Text>
          <Text style={styles.muted}>Try a different name, or clear the search to see all {category}s.</Text>
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
  locationMode,
  setLocationMode,
  locationOptions,
  locationNotice,
  saveError,
  saving,
  onConfirm,
  onChangeSpecies,
  onRetake,
  onBack,
}: {
  photo: { uri: string };
  selected: Species;
  discoveryLocation: string;
  setDiscoveryLocation: (s: string) => void;
  locationMode: LocationMode;
  setLocationMode: (m: LocationMode) => void;
  locationOptions: LocationItem[];
  locationNotice: string | null;
  saveError: string | null;
  saving: boolean;
  onConfirm: () => void;
  onChangeSpecies: () => void;
  onRetake: () => void;
  onBack: () => void;
}) {
  const [enlarged, setEnlarged] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Confirm Discovery" onBack={onBack} />
      <Tap label="Enlarge discovery photo" onPress={() => setEnlarged(true)}>
        <Image source={photo} style={styles.confirmImage} />
      </Tap>
      <Text style={styles.caption}>Tap the photo to enlarge it</Text>
      <Tap label="Retake or replace photo" style={styles.textButton} onPress={onRetake}>
        <Text style={styles.textButtonText}>Retake or replace photo</Text>
      </Tap>
      <Text style={styles.pageTitle}>
        {selected.common_name} <Text style={styles.categoryPill}>{selected.category}</Text>
      </Text>
      <Text style={styles.scientific}>{selected.scientific_name}</Text>

      <Text style={styles.inputLabel}>DISCOVERY LOCATION *</Text>
      <View style={styles.locationModeRow}>
        <Tap
          label="Use my current location"
          style={[styles.locationModeChip, locationMode === 'auto' && styles.locationModeChipActive]}
          onPress={() => setLocationMode('auto')}
        >
          <Text style={[styles.locationModeText, locationMode === 'auto' && styles.locationModeTextActive]}>Automatic Location</Text>
        </Tap>
        <Tap
          label="Enter location manually"
          style={[styles.locationModeChip, locationMode === 'manual' && styles.locationModeChipActive]}
          onPress={() => setLocationMode('manual')}
        >
          <Text style={[styles.locationModeText, locationMode === 'manual' && styles.locationModeTextActive]}>Manual Location</Text>
        </Tap>
      </View>
      {locationNotice ? <Text style={styles.notice}>{locationNotice}</Text> : null}

      {locationMode === 'auto' ? (
        <Text style={styles.muted}>RimbaQuest will use this device’s current location when you save the discovery.</Text>
      ) : (
        <View style={styles.inputGroup}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {locationOptions.map((loc) => (
              <Tap
                key={loc.id}
                label={loc.name}
                style={[styles.chip, discoveryLocation === loc.name && styles.chipActive]}
                onPress={() => setDiscoveryLocation(loc.name)}
              >
                <Text style={[styles.chipText, discoveryLocation === loc.name && styles.chipTextActive]}>{loc.name}</Text>
              </Tap>
            ))}
          </ScrollView>
          <TextInput
            style={styles.textInput}
            value={discoveryLocation}
            onChangeText={setDiscoveryLocation}
            placeholder="Or type a location name"
          />
        </View>
      )}

      {saveError ? (
        <View style={styles.searchEmpty}>
          <Text style={styles.searchEmptyTitle}>{saveError}</Text>
        </View>
      ) : null}

      <Text style={styles.question}>Is this the species you saw?</Text>
      <Text style={styles.subTitle}>Double-check the photo, species and location before saving.</Text>

      <Tap
        label="Record my discovery"
        style={[styles.primary, saving && styles.buttonDisabled]}
        disabled={saving}
        onPress={onConfirm}
      >
            <Text style={styles.primaryText}>{saving ? 'Saving...' : saveError ? 'Try Again' : 'Yes, Record My Discovery!'}</Text>
      </Tap>
      <Tap label="Choose another species" style={styles.secondary} onPress={onChangeSpecies}>
        <Text style={styles.secondaryText}>Choose Another Species</Text>
      </Tap>

      <Modal visible={enlarged} transparent animationType="fade" onRequestClose={() => setEnlarged(false)}>
        <View style={styles.photoModal}>
          <Tap label="Close enlarged photo" style={styles.photoModalBackdrop} onPress={() => setEnlarged(false)}>
            <Image source={photo} style={styles.photoModalImage} resizeMode="contain" />
            <Text style={styles.photoModalHint}>Tap to return</Text>
          </Tap>
        </View>
      </Modal>
    </ScrollView>
  );
}

export function SuccessScreen({
  selected,
  discoveryLocation,
  firstDiscovery,
  onViewCard,
  onEnterBattle,
  onViewCollection,
  onRecordAnother,
  onBack,
}: {
  selected: Species;
  discoveryLocation: string;
  firstDiscovery: boolean;
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
      <Text style={styles.successTitle}>
        {firstDiscovery ? 'New Wildlife Card Unlocked!' : 'Discovery saved!'}
      </Text>
      <Image source={imageFor(selected)!} style={styles.unlockImage} />
      <Text style={styles.pageTitle}>{selected.common_name}</Text>
      <Text style={styles.scientific}>{selected.scientific_name}</Text>
      <View style={styles.infoPair}>
        <Info label="LOCATION" value={discoveryLocation} />
        <Info label="STATUS" value="Confirmed" />
      </View>
      {firstDiscovery ? <Text style={styles.xp}>Wildlife Card added to your collection</Text> : null}
      <Tap label="View my card" style={[styles.primary, styles.fullWidth]} onPress={onViewCard}>
        <Text style={styles.primaryText}>View Wildlife Card</Text>
      </Tap>
      <Tap label="Enter Card Battle" style={[styles.secondary, styles.fullWidth]} onPress={onEnterBattle}>
        <Text style={styles.secondaryText}>Battle With This Card</Text>
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
