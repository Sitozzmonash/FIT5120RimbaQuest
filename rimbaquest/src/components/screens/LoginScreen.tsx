import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AUTH_IMAGES } from '../../constants/images';
import { Tap } from '../common/Tap';
import { PrimaryButton } from '../common/PrimaryButton';
import { styles } from '../../styles/theme';

export function LoginScreen({
  username,
  setUsername,
  password,
  setPassword,
  fieldErrors,
  authError,
  submitting,
  onLogin,
  onForgotPassword,
  onCreateAccount,
}: {
  username: string;
  setUsername: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  fieldErrors: Record<string, string>;
  authError: string | null;
  submitting: boolean;
  onLogin: () => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.loginRoot}>
      <LinearGradient
        colors={['#C8F0D8', '#E0F5E9', '#F0FAF4', '#E8F6EE']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.loginBackground}
      />
      <View style={[styles.loginDecoCircle1, { pointerEvents: 'none' }]} />
      <View style={[styles.loginDecoCircle2, { pointerEvents: 'none' }]} />

      <ScrollView
        contentContainerStyle={[styles.loginScroll, { paddingTop: insets.top, paddingBottom: 40 + insets.bottom }]}
      >
        <View style={styles.loginCenterWrap}>
          <View style={styles.loginContent}>
            <View style={styles.loginMascotBlob}>
              <Image source={AUTH_IMAGES.mascotLogin} style={styles.loginMascotImage} resizeMode="cover" />
            </View>

            <Text style={styles.loginTitle}>Welcome Back!</Text>

            {authError && <Text style={styles.loginErrorBanner}>{authError}</Text>}

            <View style={styles.loginFields}>
              <View>
                <View style={[styles.loginInputBox, fieldErrors.username && styles.loginInputBoxError]}>
                  <MaterialIcons name="mail-outline" size={20} color="#0A4D26" />
                  <TextInput
                    style={styles.loginInput}
                    placeholder="Username or Email Address *"
                    placeholderTextColor="#0A4D26"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
                {fieldErrors.username && <Text style={styles.loginFieldError}>{fieldErrors.username}</Text>}
              </View>

              <View>
                <View style={[styles.loginInputBox, fieldErrors.password && styles.loginInputBoxError]}>
                  <MaterialIcons name="lock-outline" size={20} color="#0A4D26" />
                  <TextInput
                    style={styles.loginInput}
                    placeholder="Password *"
                    placeholderTextColor="#0A4D26"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Tap
                    label={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.loginEyeToggle}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#0A4D26" />
                  </Tap>
                </View>
                {fieldErrors.password && <Text style={styles.loginFieldError}>{fieldErrors.password}</Text>}
              </View>

              <View style={styles.loginForgotRow}>
                <Tap label="Forgot Password" style={{}} onPress={onForgotPassword}>
                  <Text style={styles.loginForgotText}>Forgot Password?</Text>
                </Tap>
              </View>
            </View>

            <View style={styles.loginActions}>
              <PrimaryButton
                label="Log In"
                displayText={submitting ? 'Logging in...' : 'Log In'}
                loading={submitting}
                style={styles.loginSubmitBtn}
                onPress={onLogin}
              />

              <View style={styles.loginSignupRow}>
                <Text style={styles.loginSignupText}>New to RimbaQuest?</Text>
                <Tap label="Create Account" style={{}} onPress={onCreateAccount}>
                  <Text style={styles.loginSignupLink}>Create Account</Text>
                </Tap>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
