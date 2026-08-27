import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AUTH_IMAGES, HOME_IMAGES } from '../../constants/images';
import { Tap } from '../common/Tap';
import { styles } from '../../styles/theme';

const AVATAR_CHOICES = [
  { key: 'hornbill', image: AUTH_IMAGES.avatarBird },
  { key: 'tiger', image: AUTH_IMAGES.avatarTiger },
  { key: 'panda', image: AUTH_IMAGES.avatarPanda },
];

const AGE_MIN = 5;
const AGE_MAX = 17;
const AGE_ITEM_HEIGHT = 44;
const AGE_WHEEL_HEIGHT = 220;
const AGE_PADDING = (AGE_WHEEL_HEIGHT - AGE_ITEM_HEIGHT) / 2;

const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: 'Account' },
  { n: 2, label: 'Age' },
  { n: 3, label: 'Password' },
];

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.createStepIndicator}>
      {STEPS.map((item, i) => {
        const state = item.n < step ? 'done' : item.n === step ? 'active' : 'upcoming';
        return (
          <React.Fragment key={item.n}>
            <View style={styles.createStepItem}>
              <View
                style={[
                  styles.createStepCircle,
                  state === 'active' && styles.createStepCircleActive,
                  state === 'done' && styles.createStepCircleDone,
                ]}
              >
                {state === 'done' ? (
                  <MaterialIcons name="check" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.createStepNumber, state === 'active' && styles.createStepNumberActive]}>
                    {item.n}
                  </Text>
                )}
              </View>
              <Text style={[styles.createStepLabel, state !== 'upcoming' && styles.createStepLabelActive]}>
                {item.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.createStepLine, item.n < step && styles.createStepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function AgeWheelPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const numbers = useMemo(() => Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i), []);
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = Math.max(0, numbers.indexOf(value));

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: initialIndex * AGE_ITEM_HEIGHT, animated: false });
    });
    return () => cancelAnimationFrame(id);
    // Only snap to the starting value once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / AGE_ITEM_HEIGHT);
    const clamped = Math.min(numbers.length - 1, Math.max(0, index));
    const next = numbers[clamped];
    if (next !== value) onChange(next);
    scrollRef.current?.scrollTo({ y: clamped * AGE_ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={styles.createAgeWheelWrap}>
      <View style={styles.createAgeWheel}>
        <View style={styles.createAgeWheelHighlight} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={AGE_ITEM_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: AGE_PADDING }}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {numbers.map((n) => {
            const selected = n === value;
            return (
              <View key={n} style={styles.createAgeWheelItem}>
                <Text style={[styles.createAgeWheelText, selected && styles.createAgeWheelTextActive]}>{n}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// A Back / Next (or Back / Create Account) pair shown at the bottom of every
// step, so moving through the wizard doesn't depend on a header back button.
function StepNav({
  onBack,
  nextLabel,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <View style={styles.createNavButtonsRow}>
      <Tap label="Back" style={[styles.createSecondaryBtn, styles.createNavButtonFlex]} onPress={onBack}>
        <MaterialIcons name="chevron-left" size={20} color="#0A4D26" />
        <Text style={styles.createSecondaryBtnText}>Back</Text>
      </Tap>
      <Tap
        label={nextLabel}
        style={[styles.createCtaBtn, styles.createNavButtonFlex, nextDisabled && styles.buttonDisabled]}
        disabled={nextDisabled}
        onPress={onNext}
      >
        <Text style={styles.createCtaBtnText}>{nextLabel}</Text>
      </Tap>
    </View>
  );
}

function AvatarPicker({ avatar, setAvatar }: { avatar: string; setAvatar: (s: string) => void }) {
  return (
    <View style={styles.createAvatarSection}>
      <Text style={styles.createAvatarLabel}>Choose an Avatar - Optional</Text>
      <View style={styles.createAvatarRow}>
        {AVATAR_CHOICES.map((choice) => {
          const active = avatar === choice.key;
          return (
            <Tap
              key={choice.key}
              label={`Choose ${choice.key} avatar`}
              style={[styles.createAvatarChoice, active && styles.createAvatarChoiceActive]}
              onPress={() => setAvatar(choice.key)}
            >
              <Image source={choice.image} style={styles.createAvatarImage} resizeMode="cover" />
              {active && (
                <View style={styles.createAvatarBadge}>
                  <MaterialIcons name="check" size={12} color="#FFFFFF" />
                </View>
              )}
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // If the server rejects a field that lives on an earlier step (e.g. "username
  // already taken" surfacing only after the final submit on step 3), jump back
  // to the step where the user can see and fix it.
  useEffect(() => {
    if ((fieldErrors.username || fieldErrors.email) && step !== 1) setStep(1);
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
          <Image source={HOME_IMAGES.brandLogo} style={styles.createBrandLogo} resizeMode="contain" />
          <Text style={styles.createTitle}>Create Your Explorer Account</Text>
        </View>

        <StepIndicator step={step} />

        <View style={styles.createCenterWrap}>
          {authError && <Text style={styles.createErrorBanner}>{authError}</Text>}

          {step === 1 && (
            <View style={styles.createStepBody}>
              <View style={styles.createField}>
                <Text style={styles.createFieldLabel}>Username *</Text>
                <View style={[styles.createInputBox, fieldErrors.username && styles.createInputBoxError]}>
                  <MaterialIcons name="person-outline" size={18} color="#0A4D26" />
                  <TextInput
                    style={styles.createInput}
                    placeholder="3-20 characters"
                    placeholderTextColor="#6A9B7D"
                    value={username}
                    onChangeText={setUsername}
                    onBlur={onBlurUsername}
                    autoCapitalize="none"
                  />
                </View>
                {fieldErrors.username && <Text style={styles.createFieldError}>{fieldErrors.username}</Text>}
              </View>

              <View style={styles.createField}>
                <Text style={styles.createFieldLabel}>Email Address *</Text>
                <View style={[styles.createInputBox, fieldErrors.email && styles.createInputBoxError]}>
                  <MaterialIcons name="mail-outline" size={18} color="#0A4D26" />
                  <TextInput
                    style={styles.createInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#6A9B7D"
                    value={email}
                    onChangeText={setEmail}
                    onBlur={onBlurEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {fieldErrors.email && <Text style={styles.createFieldError}>{fieldErrors.email}</Text>}
              </View>

              <AvatarPicker avatar={avatar} setAvatar={setAvatar} />

              <View style={styles.createActions}>
                <StepNav onBack={onBack} nextLabel="Next" onNext={handleNextFromStep1} />
                <View style={styles.createLoginRow}>
                  <Text style={styles.createLoginText}>Already have an account?</Text>
                  <Tap label="Log In" style={{}} onPress={onLogin}>
                    <Text style={styles.createLoginLink}>Log In</Text>
                  </Tap>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.createStepBody}>
              <Text style={styles.createAgeHeading}>How old are you?</Text>
              <Text style={styles.createAgeSubtext}>Scroll to pick your age.</Text>
              <AgeWheelPicker value={ageValue} onChange={(n) => setAge(String(n))} />
              {fieldErrors.age && <Text style={styles.createFieldError}>{fieldErrors.age}</Text>}

              <View style={styles.createActions}>
                <StepNav onBack={() => setStep(1)} nextLabel="Next" onNext={() => setStep(3)} />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.createStepBody}>
              <View style={styles.createField}>
                <Text style={styles.createFieldLabel}>Password *</Text>
                <View style={[styles.createInputBox, fieldErrors.password && styles.createInputBoxError]}>
                  <MaterialIcons name="lock-outline" size={18} color="#0A4D26" />
                  <TextInput
                    style={styles.createInput}
                    placeholder="Create a password"
                    placeholderTextColor="#6A9B7D"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Tap
                    label={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.createEyeToggle}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={18} color="#0A4D26" />
                  </Tap>
                </View>
                {fieldErrors.password && <Text style={styles.createFieldError}>{fieldErrors.password}</Text>}
              </View>

              <View style={styles.createField}>
                <Text style={styles.createFieldLabel}>Confirm Password *</Text>
                <View style={[styles.createInputBox, fieldErrors.confirmPassword && styles.createInputBoxError]}>
                  <MaterialIcons name="lock-outline" size={18} color="#0A4D26" />
                  <TextInput
                    style={styles.createInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#6A9B7D"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <Tap
                    label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    style={styles.createEyeToggle}
                    onPress={() => setShowConfirm((v) => !v)}
                  >
                    <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={18} color="#0A4D26" />
                  </Tap>
                </View>
                {fieldErrors.confirmPassword && <Text style={styles.createFieldError}>{fieldErrors.confirmPassword}</Text>}
              </View>

              <View style={styles.createActions}>
                <View style={styles.createNavButtonsRow}>
                  <Tap
                    label="Back"
                    style={[styles.createSecondaryBtn, styles.createNavButtonFlex]}
                    onPress={() => setStep(2)}
                  >
                    <MaterialIcons name="chevron-left" size={20} color="#0A4D26" />
                    <Text style={styles.createSecondaryBtnText}>Back</Text>
                  </Tap>
                  <Tap
                    label="Create Account"
                    style={[styles.createCtaBtn, styles.createNavButtonFlex, submitting && styles.buttonDisabled]}
                    disabled={submitting}
                    onPress={onRegister}
                  >
                    <Text style={styles.createCtaBtnText}>{submitting ? 'Creating...' : 'Create Account'}</Text>
                  </Tap>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
