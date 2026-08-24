import React from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { UserProfile } from '../../types';
import { CATEGORIES } from '../../constants/seed';
import { AVATAR_ICONS } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, ProgressCard, Section } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function ProfileScreen({
  currentUser,
  displayProgress,
  discoveredSpeciesCount,
  onOpenEdit,
  onSwitchAccount,
}: {
  currentUser: UserProfile;
  displayProgress: { found: number; total: number; xp: number; level?: number };
  discoveredSpeciesCount: (cat: string) => { found: number; total: number };
  onOpenEdit: () => void;
  onSwitchAccount: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="My Explorer Profile" back={false} />

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
      {CATEGORIES.map((item) => {
        const stats = discoveredSpeciesCount(item);
        return (
          <View style={styles.progressRow} key={item}>
            <Text style={styles.cardTitle}>{item}s</Text>
            <Text style={styles.muted}>{stats.found} / {stats.total} Discovered</Text>
          </View>
        );
      })}

      <Section title="ACHIEVEMENTS & BADGES" />
      <View style={styles.badges}>
        <Text style={styles.badge}>🏅 First Discovery</Text>
        <Text style={styles.badge}>🌱 Wildlife Friend</Text>
        <Text style={styles.badge}>⚔️ Battle Rookie</Text>
        <Text style={styles.badge}>🦉 Forest Scholar</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Tap label="Switch Account / Log In" style={styles.secondary} onPress={onSwitchAccount}>
          <Text style={styles.secondaryText}>🔐 Switch Account / Log In</Text>
        </Tap>
      </View>
    </ScrollView>
  );
}

export function AuthScreen({
  authMode,
  setAuthMode,
  authError,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  age,
  setAge,
  avatar,
  setAvatar,
  onLogin,
  onRegister,
  onForgotPassword,
  onBack,
}: {
  authMode: 'login' | 'register';
  setAuthMode: (m: 'login' | 'register') => void;
  authError: string | null;
  username: string;
  setUsername: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  confirmPassword: string;
  setConfirmPassword: (s: string) => void;
  age: string;
  setAge: (s: string) => void;
  avatar: string;
  setAvatar: (s: string) => void;
  onLogin: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title={authMode === 'login' ? 'Log In to RimbaQuest' : 'Create Your Account'} onBack={onBack} />

      <View style={styles.authTabRow}>
        <Tap
          label="Login Tab"
          style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
          onPress={() => setAuthMode('login')}
        >
          <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>Log In</Text>
        </Tap>
        <Tap
          label="Register Tab"
          style={[styles.authTab, authMode === 'register' && styles.authTabActive]}
          onPress={() => setAuthMode('register')}
        >
          <Text style={[styles.authTabText, authMode === 'register' && styles.authTabTextActive]}>
            Create Account
          </Text>
        </Tap>
      </View>

      {authError && <Text style={styles.authError}>{authError}</Text>}

      {authMode === 'register' ? (
        <View style={styles.authForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USERNAME * (3–20 characters, no spaces)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. jungle_scout"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>AGE * (8–12 recommended)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 10"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. scout@rimbaquest.my"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD * (min. 6 characters)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Create password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Repeat password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Text style={styles.inputLabel}>CHOOSE YOUR EXPLORER AVATAR</Text>
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

          <Tap label="Create Account" style={styles.primary} onPress={onRegister}>
            <Text style={styles.primaryText}>Create RimbaQuest Account</Text>
          </Tap>
        </View>
      ) : (
        <View style={styles.authForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USERNAME OR EMAIL *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your username or email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Tap label="Log In" style={styles.primary} onPress={onLogin}>
            <Text style={styles.primaryText}>Log In</Text>
          </Tap>

          <Tap label="Forgot Password" style={styles.textButton} onPress={onForgotPassword}>
            <Text style={styles.textButtonText}>Forgot your password?</Text>
          </Tap>
        </View>
      )}
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
}: {
  displayName: string;
  setDisplayName: (s: string) => void;
  age: string;
  setAge: (s: string) => void;
  avatar: string;
  setAvatar: (s: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Edit Profile" onBack={onBack} />
      <View style={styles.authForm}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DISPLAY NAME</Text>
          <TextInput style={styles.textInput} value={displayName} onChangeText={setDisplayName} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>AGE</Text>
          <TextInput style={styles.textInput} value={age} onChangeText={setAge} keyboardType="numeric" />
        </View>
        <Text style={styles.inputLabel}>CHOOSE AVATAR</Text>
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

export function ForgotPasswordScreen({
  step,
  email,
  setEmail,
  token,
  setToken,
  newPassword,
  setNewPassword,
  onRequestCode,
  onResetPassword,
  onBack,
}: {
  step: 1 | 2;
  email: string;
  setEmail: (s: string) => void;
  token: string;
  setToken: (s: string) => void;
  newPassword: string;
  setNewPassword: (s: string) => void;
  onRequestCode: () => void;
  onResetPassword: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Recover Account Access" onBack={onBack} />
      {step === 1 ? (
        <View style={styles.authForm}>
          <Text style={styles.subTitle}>Enter the email address associated with your RimbaQuest account.</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="scout@rimbaquest.my"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <Tap label="Request Reset" style={styles.primary} onPress={onRequestCode}>
            <Text style={styles.primaryText}>Send Recovery Code</Text>
          </Tap>
        </View>
      ) : (
        <View style={styles.authForm}>
          <Text style={styles.subTitle}>Recovery code sent! Please enter the code and your new password.</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>RECOVERY CODE *</Text>
            <TextInput
              style={styles.textInput}
              value={token}
              onChangeText={setToken}
              placeholder="e.g. RESET-2026"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEW PASSWORD *</Text>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              secureTextEntry
            />
          </View>
          <Tap label="Reset Password" style={styles.primary} onPress={onResetPassword}>
            <Text style={styles.primaryText}>Reset Password & Log In</Text>
          </Tap>
        </View>
      )}
    </ScrollView>
  );
}
