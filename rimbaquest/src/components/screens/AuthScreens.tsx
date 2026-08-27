import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { UserProfile } from '../../types';
import { WILDLIFE_FILTERS } from '../../constants/seed';
import { AVATAR_ICONS } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, ProgressCard, Section } from '../common/CommonUI';
import { styles } from '../../styles/theme';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.fieldErrorText}>{message}</Text>;
}

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

export function AuthScreen({
  authMode,
  setAuthMode,
  authError,
  fieldErrors,
  submitting,
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
  onBlurUsername,
  onBlurEmail,
  showBack,
  onBack,
}: {
  authMode: 'login' | 'register';
  setAuthMode: (m: 'login' | 'register') => void;
  authError: string | null;
  fieldErrors: Record<string, string>;
  submitting: boolean;
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
  onBlurUsername: () => void;
  onBlurEmail: () => void;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header
        title={authMode === 'login' ? 'Log In to RimbaQuest' : 'Create Your Account'}
        back={Boolean(showBack)}
        onBack={onBack}
      />

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
            <Text style={styles.inputLabel}>USERNAME *</Text>
            <TextInput
              style={[styles.textInput, fieldErrors.username && styles.textInputError]}
              placeholder="e.g. jungle_scout"
              value={username}
              onChangeText={setUsername}
              onBlur={onBlurUsername}
              autoCapitalize="none"
            />
            <FieldError message={fieldErrors.username} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>AGE *</Text>
            <TextInput
              style={[styles.textInput, fieldErrors.age && styles.textInputError]}
              placeholder="e.g. 10"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
            <FieldError message={fieldErrors.age} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
            <TextInput
              style={[styles.textInput, fieldErrors.email && styles.textInputError]}
              placeholder="e.g. scout@rimbaquest.my"
              value={email}
              onChangeText={setEmail}
              onBlur={onBlurEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <FieldError message={fieldErrors.email} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput, fieldErrors.password && styles.textInputError]}
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Tap label={showPassword ? 'Hide password' : 'Show password'} style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Tap>
            </View>
            <FieldError message={fieldErrors.password} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput, fieldErrors.confirmPassword && styles.textInputError]}
                placeholder="Repeat password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <Tap label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} style={styles.passwordToggle} onPress={() => setShowConfirm((v) => !v)}>
                <Text style={styles.passwordToggleText}>{showConfirm ? 'Hide' : 'Show'}</Text>
              </Tap>
            </View>
            <FieldError message={fieldErrors.confirmPassword} />
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

          <Tap
            label="Create Account"
            style={[styles.primary, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={onRegister}
          >
            <Text style={styles.primaryText}>{submitting ? 'Creating account...' : 'Create RimbaQuest Account'}</Text>
          </Tap>
        </View>
      ) : (
        <View style={styles.authForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USERNAME OR EMAIL *</Text>
            <TextInput
              style={[styles.textInput, fieldErrors.username && styles.textInputError]}
              placeholder="Enter your username or email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <FieldError message={fieldErrors.username} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput, fieldErrors.password && styles.textInputError]}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Tap label={showPassword ? 'Hide password' : 'Show password'} style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Tap>
            </View>
            <FieldError message={fieldErrors.password} />
          </View>

          <Tap
            label="Log In"
            style={[styles.primary, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={onLogin}
          >
            <Text style={styles.primaryText}>{submitting ? 'Logging in...' : 'Log In'}</Text>
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

export function ForgotPasswordScreen({
  step,
  email,
  setEmail,
  token,
  setToken,
  newPassword,
  setNewPassword,
  fieldError,
  formError,
  submitting,
  onRequestCode,
  onResetPassword,
  onRequestNewCode,
  onBack,
}: {
  step: 1 | 2;
  email: string;
  setEmail: (s: string) => void;
  token: string;
  setToken: (s: string) => void;
  newPassword: string;
  setNewPassword: (s: string) => void;
  fieldError: string | null;
  formError: string | null;
  submitting: boolean;
  onRequestCode: () => void;
  onResetPassword: () => void;
  onRequestNewCode: () => void;
  onBack: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Recover Account Access" onBack={onBack} />
      {formError && <Text style={styles.authError}>{formError}</Text>}
      {step === 1 ? (
        <View style={styles.authForm}>
          <Text style={styles.subTitle}>Enter the email address associated with your RimbaQuest account.</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
            <TextInput
              style={[styles.textInput, fieldError && styles.textInputError]}
              placeholder="scout@rimbaquest.my"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <FieldError message={fieldError || undefined} />
          </View>
          <Tap
            label="Request Reset"
            style={[styles.primary, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={onRequestCode}
          >
            <Text style={styles.primaryText}>{submitting ? 'Sending...' : 'Send Recovery Link'}</Text>
          </Tap>
        </View>
      ) : (
        <View style={styles.authForm}>
          <Text style={styles.subTitle}>Enter the recovery code from your email and choose a new password.</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>RECOVERY CODE *</Text>
            <TextInput
              style={[styles.textInput, fieldError && styles.textInputError]}
              value={token}
              onChangeText={setToken}
              placeholder="Recovery code"
            />
            <FieldError message={fieldError || undefined} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEW PASSWORD *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                secureTextEntry={!showPassword}
              />
              <Tap label={showPassword ? 'Hide password' : 'Show password'} style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Tap>
            </View>
          </View>
          <Tap
            label="Reset Password"
            style={[styles.primary, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={onResetPassword}
          >
            <Text style={styles.primaryText}>{submitting ? 'Updating...' : 'Reset Password'}</Text>
          </Tap>
          <Tap label="Request a new recovery code" style={styles.textButton} onPress={onRequestNewCode}>
            <Text style={styles.textButtonText}>Request a new recovery code</Text>
          </Tap>
        </View>
      )}
    </ScrollView>
  );
}
