import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AUTH_IMAGES } from '../../constants/images';
import { Tap } from '../common/Tap';
import { PrimaryButton } from '../common/PrimaryButton';
import { styles } from '../../styles/theme';

export function ResetPasswordScreen({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  fieldError,
  formError,
  submitting,
  onResetPassword,
  onBackToLogin,
}: {
  newPassword: string;
  setNewPassword: (s: string) => void;
  confirmPassword: string;
  setConfirmPassword: (s: string) => void;
  fieldError: string | null;
  formError: string | null;
  submitting: boolean;
  onResetPassword: () => void;
  onBackToLogin: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.resetRoot}>
      <LinearGradient
        colors={['#C8F0D8', '#E0F5E9', '#F0FAF4', '#E8F6EE']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.resetBackground}
      />
      <View style={[styles.resetDecoCircle1, { pointerEvents: 'none' }]} />
      <View style={[styles.resetDecoCircle2, { pointerEvents: 'none' }]} />

      <ScrollView contentContainerStyle={[styles.resetScroll, { paddingTop: insets.top }]}>
        <View style={styles.resetCenterWrap}>
          <View style={styles.resetMascotContainer}>
            <View style={styles.resetMascotBlob}>
              <Image source={AUTH_IMAGES.mascotReset} style={styles.resetMascotImage} resizeMode="cover" />
            </View>
          </View>

          <View style={[styles.resetForm, { paddingBottom: 48 + insets.bottom }]}>
            <View style={styles.resetTextGroup}>
              <Text style={styles.resetTitle}>Reset Password</Text>
              <Text style={styles.resetSubtitle}>Create a new password for your account.</Text>
            </View>

            {formError && <Text style={styles.resetErrorBanner}>{formError}</Text>}

            <View style={styles.resetFields}>
              <View style={styles.resetField}>
                <Text style={styles.resetFieldLabel}>New Password *</Text>
                <View style={[styles.resetInputBox, fieldError && styles.resetInputBoxError]}>
                  <MaterialIcons name="lock-outline" size={20} color="#0A4D26" />
                  <TextInput
                    style={styles.resetInput}
                    placeholder="••••••••"
                    placeholderTextColor="#88A693"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Tap
                    label={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.resetEyeToggle}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#0A4D26" />
                  </Tap>
                </View>
              </View>

              <View style={styles.resetField}>
                <Text style={styles.resetFieldLabel}>Confirm New Password *</Text>
                <View style={[styles.resetInputBox, fieldError && styles.resetInputBoxError]}>
                  <MaterialIcons name="lock-outline" size={20} color="#0A4D26" />
                  <TextInput
                    style={styles.resetInput}
                    placeholder="••••••••"
                    placeholderTextColor="#88A693"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <Tap
                    label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    style={styles.resetEyeToggle}
                    onPress={() => setShowConfirm((v) => !v)}
                  >
                    <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={20} color="#0A4D26" />
                  </Tap>
                </View>
                {fieldError && <Text style={styles.resetFieldError}>{fieldError}</Text>}
              </View>
            </View>

            <View style={styles.resetActions}>
              <PrimaryButton
                label="Reset Password"
                displayText={submitting ? 'Updating...' : 'Reset Password'}
                loading={submitting}
                style={styles.resetSubmitBtn}
                onPress={onResetPassword}
              />
              <Tap label="Back to Log In" style={{}} onPress={onBackToLogin}>
                <Text style={styles.resetLinkBack}>Back to Log In</Text>
              </Tap>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
