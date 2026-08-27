import React from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AUTH_IMAGES } from '../../constants/images';
import { Tap } from '../common/Tap';
import { styles } from '../../styles/theme';

export function ForgotPasswordScreen({
  email,
  setEmail,
  fieldError,
  formError,
  submitting,
  onSendRecoveryLink,
  onBackToLogin,
}: {
  email: string;
  setEmail: (s: string) => void;
  fieldError: string | null;
  formError: string | null;
  submitting: boolean;
  onSendRecoveryLink: () => void;
  onBackToLogin: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.forgotRoot}>
      <LinearGradient
        colors={['#C8F0D8', '#E0F5E9', '#F0FAF4', '#E8F6EE']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.forgotBackground}
      />
      <View style={[styles.forgotDecoCircle1, { pointerEvents: 'none' }]} />
      <View style={[styles.forgotDecoCircle2, { pointerEvents: 'none' }]} />

      <ScrollView
        contentContainerStyle={[styles.forgotScroll, { paddingTop: insets.top, paddingBottom: 40 + insets.bottom }]}
      >
        <View style={styles.forgotCenterWrap}>
          <View style={styles.forgotContent}>
            <View style={styles.forgotMascotBlob}>
              <Image source={AUTH_IMAGES.mascotForgot} style={styles.forgotMascotImage} resizeMode="cover" />
            </View>

            <View style={styles.forgotTextGroup}>
              <Text style={styles.forgotTitle}>Forgot Password?</Text>
              <Text style={styles.forgotSubtitle}>
                Enter the email connected to your RimbaQuest account. We'll send you a link or verification code to
                reset your password.
              </Text>
            </View>

            {formError && <Text style={styles.forgotErrorBanner}>{formError}</Text>}

            <View style={styles.forgotActionGroup}>
              <View>
                <View style={[styles.forgotInputBox, fieldError && styles.forgotInputBoxError]}>
                  <MaterialIcons name="mail-outline" size={20} color="#0A4D26" />
                  <TextInput
                    style={styles.forgotInput}
                    placeholder="Parent or Guardian Email Address *"
                    placeholderTextColor="#637D6E"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {fieldError && <Text style={styles.forgotFieldError}>{fieldError}</Text>}
              </View>

              <Tap
                label="Send Recovery Link"
                style={[styles.forgotSubmitBtn, submitting && styles.buttonDisabled]}
                disabled={submitting}
                onPress={onSendRecoveryLink}
              >
                <Text style={styles.forgotSubmitBtnText}>{submitting ? 'Sending...' : 'Send Recovery Link'}</Text>
              </Tap>
            </View>

            <Tap label="Back to Log In" style={{}} onPress={onBackToLogin}>
              <Text style={styles.forgotBackToLogin}>Back to Log In</Text>
            </Tap>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
