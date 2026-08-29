import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HOME_IMAGES } from '../../../constants/images';
import { AccountStep } from './components/AccountStep';
import { AgeStep } from './components/AgeStep';

// TODO:: Use State Management Library (Redux, Zustand, etc.) to manage
// the state of the account creation process across steps. This will
// help in maintaining the state and validation across different steps
// of the account creation process.
export function AccountCreationScreen({
  username,
  setUsername,
  age,
  setAge,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  avatar,
  setAvatar,
  fieldErrors,
  authError,
  submitting,
  onRegister,
  onLogin,
  onBack,
  onValidateStep1,
  onBlurUsername,
  onBlurEmail,
}: {
  username: string;
  setUsername: (s: string) => void;
  age: string;
  setAge: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  confirmPassword: string;
  setConfirmPassword: (s: string) => void;
  avatar: string;
  setAvatar: (s: string) => void;
  fieldErrors: Record<string, string>;
  authError: string | null;
  submitting: boolean;
  onRegister: () => void;
  onLogin: () => void;
  onBack: () => void;
  onValidateStep1: () => boolean;
  onBlurUsername: () => void;
  onBlurEmail: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  // If the server rejects a field that lives on an earlier step (e.g. "username
  // already taken" surfacing only after the final submit on step 2), jump back
  // to the step where the user can see and fix it.
  useEffect(() => {
    if (
      (fieldErrors.username || fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword) &&
      step !== 1
    )
      setStep(1);
    else if (fieldErrors.age && step !== 2) setStep(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors]);

  const ageValue = Number.isFinite(parseInt(age, 10)) && age.trim() ? parseInt(age, 10) : 10;

  const handleNextFromStep1 = () => {
    if (onValidateStep1()) setStep(2);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.createRoot}>
      <LinearGradient
        colors={['#C8F0D8', '#E0F5E9', '#F0FAF4', '#E8F6EE']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.createBackground}
      />
      <View style={[styles.createDecoCircle1, { pointerEvents: 'none' }]} />
      <View style={[styles.createDecoCircle2, { pointerEvents: 'none' }]} />
      <View style={[styles.createDecoCircle3, { pointerEvents: 'none' }]} />
      <View style={[styles.createDecoCircle4, { pointerEvents: 'none' }]} />

      <ScrollView
        contentContainerStyle={[
          styles.createScroll,
          { paddingTop: 16 + insets.top, paddingBottom: 24 + insets.bottom, flexGrow: 1 },
        ]}
      >
        <View style={styles.createBrandIntro}>
          {/* <Image source={HOME_IMAGES.brandLogo} style={styles.createBrandLogo} resizeMode="contain" /> */}
          <Text style={styles.createTitle}>Create Your Explorer Account</Text>
        </View>

        <View style={styles.createCenterWrap}>
          {authError && <Text style={styles.createErrorBanner}>{authError}</Text>}

          {step === 1 && (
            <AccountStep
              username={username}
              setUsername={setUsername}
              onBlurUsername={onBlurUsername}
              email={email}
              setEmail={setEmail}
              onBlurEmail={onBlurEmail}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              avatar={avatar}
              setAvatar={setAvatar}
              fieldErrors={fieldErrors}
              onBack={onBack}
              onNext={handleNextFromStep1}
              onLogin={onLogin}
            />
          )}

          {step === 2 && (
            <AgeStep
              value={ageValue}
              onChange={(n) => setAge(String(n))}
              error={fieldErrors.age}
              submitting={submitting}
              onBack={() => setStep(1)}
              onRegister={onRegister}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  createRoot: { flex: 1 },
  createBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  createDecoCircle1: { position: 'absolute', left: -30, top: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: '#78B833', opacity: 0.15 },
  createDecoCircle2: { position: 'absolute', left: '75%', top: 40, width: 120, height: 120, borderRadius: 60, backgroundColor: '#78B833', opacity: 0.1 },
  createDecoCircle3: { position: 'absolute', left: -20, top: '87%', width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFC314', opacity: 0.08 },
  createDecoCircle4: { position: 'absolute', left: '80%', top: '63%', width: 90, height: 100, borderRadius: 50, backgroundColor: '#78B833', opacity: 0.07 },
  createScroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, gap: 16 },
  createBrandIntro: { alignItems: 'center', gap: 4, paddingVertical: 6 },
  createBrandLogo: { width: 176, height: 40 },
  createTitle: { color: '#0A4D26', fontSize: 24, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  createErrorBanner: { color: '#D9383A', backgroundColor: '#FCE8E8', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  createCenterWrap: { flex: 1, justifyContent: 'flex-start' },
});
