import React from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { UserProfile } from '../../types';
import { WILDLIFE_FILTERS } from '../../constants/seed';
import { AVATAR_ICONS } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, ProgressCard, Section } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function ProfileScreen({
  currentUser,
  displayProgress,
  discoveredSpeciesCount,
  onOpenEdit,
  onLogout,
  onBack,
}: {
  currentUser: UserProfile;
  displayProgress: { found: number; total: number; xp: number; level?: number };
  discoveredSpeciesCount: (cat: string) => { found: number; total: number };
  onOpenEdit: () => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="My Explorer Profile" onBack={onBack} />

      <View style={styles.profileHero}>
        <Text style={styles.profileHeroAvatar}>{AVATAR_ICONS[currentUser.avatar] || '🦛'}</Text>
        <View style={styles.profileHeroInfo}>
          <Text style={styles.profileHeroName}>{currentUser.display_name}</Text>
          <Text style={styles.profileHeroBand}>
            Age {currentUser.age} · Level {currentUser.level} Jungle Scout
          </Text>
        </View>
        <Tap label="Edit Profile" style={styles.editProfileBtn} onPress={onOpenEdit}>
          <Text style={styles.editProfileBtnText}>✏️ Edit</Text>
        </Tap>
      </View>

      <ProgressCard progress={displayProgress} />

      <Section title="CATEGORY COLLECTION PROGRESS" />
      {WILDLIFE_FILTERS.filter((item) => item.id !== 'All').map((item) => {
        const stats = discoveredSpeciesCount(item.id);
        return (
          <View style={styles.progressRow} key={item.id}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.muted}>{stats.found} / {stats.total}</Text>
          </View>
        );
      })}

      <View style={{ marginTop: 20 }}>
        <Tap label="Log Out" style={styles.secondary} onPress={onLogout}>
          <Text style={styles.secondaryText}>Log Out</Text>
        </Tap>
      </View>
    </ScrollView>
  );
}

export function ProfileEditScreen({
  displayName,
  setDisplayName,
  age,
  setAge,
  avatar,
  setAvatar,
  onSave,
  onBack,
  isDirty,
}: {
  displayName: string;
  setDisplayName: (s: string) => void;
  age: string;
  setAge: (s: string) => void;
  avatar: string;
  setAvatar: (s: string) => void;
  onSave: () => void;
  onBack: () => void;
  isDirty: boolean;
}) {
  const leave = () => {
    if (!isDirty) {
      onBack();
      return;
    }
    const message = 'You have unsaved changes. Leave this page and lose them?';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) onBack();
      return;
    }
    Alert.alert('Unsaved changes', message, [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: onBack },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Edit Profile" onBack={leave} />
      <View style={styles.authForm}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DISPLAY NAME</Text>
          <TextInput style={styles.textInput} value={displayName} onChangeText={setDisplayName} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>AGE</Text>
          <TextInput style={styles.textInput} value={age} onChangeText={setAge} keyboardType="numeric" />
        </View>
        <Text style={styles.optionalLabel}>AVATAR (optional)</Text>
        <View style={styles.avatarPicker}>
          {Object.entries(AVATAR_ICONS).map(([key, emoji]) => (
            <Tap
              key={key}
              label={key}
              style={[styles.avatarChoice, avatar === key && styles.avatarChoiceActive]}
              onPress={() => setAvatar(key)}
            >
              <Text style={styles.avatarChoiceEmoji}>{emoji}</Text>
              <Text style={styles.avatarChoiceName}>{key}</Text>
            </Tap>
          ))}
        </View>
        <Tap label="Save Changes" style={styles.primary} onPress={onSave}>
          <Text style={styles.primaryText}>Save Profile Changes</Text>
        </Tap>
      </View>
    </ScrollView>
  );
}
