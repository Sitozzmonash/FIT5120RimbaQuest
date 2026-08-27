import { StyleSheet } from 'react-native';

// Account Creation screen (Figma node 302:4) — split into a 3-step wizard:
// 1) username + email + avatar, 2) age (wheel picker), 3) password.
export const accountCreationStyles = StyleSheet.create({
  createRoot: { flex: 1 },
  createBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  createDecoCircle1: { position: 'absolute', left: -30, top: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: '#78B833', opacity: 0.15 },
  createDecoCircle2: { position: 'absolute', left: '75%', top: 40, width: 120, height: 120, borderRadius: 60, backgroundColor: '#78B833', opacity: 0.1 },
  createDecoCircle3: { position: 'absolute', left: -20, top: '87%', width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFC314', opacity: 0.08 },
  createDecoCircle4: { position: 'absolute', left: '80%', top: '63%', width: 90, height: 100, borderRadius: 50, backgroundColor: '#78B833', opacity: 0.07 },
  createScroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, gap: 16 },
  createBrandIntro: { alignItems: 'center', gap: 4, paddingVertical: 6 },
  createBrandLogo: { width: 120, height: 27 },
  createTitle: { color: '#0A4D26', fontSize: 24, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  createErrorBanner: { color: '#D9383A', backgroundColor: '#FCE8E8', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // Step indicator
  createStepIndicator: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 4 },
  createStepItem: { alignItems: 'center', gap: 6, width: 68 },
  createStepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#D8EDD8', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  createStepCircleActive: { borderColor: '#0A4D26' },
  createStepCircleDone: { borderColor: '#0A4D26', backgroundColor: '#0A4D26' },
  createStepNumber: { fontSize: 13, fontWeight: '800', color: '#9AB8A6' },
  createStepNumberActive: { color: '#0A4D26' },
  createStepLabel: { fontSize: 11, fontWeight: '700', color: '#9AB8A6' },
  createStepLabelActive: { color: '#0A4D26' },
  createStepLine: { width: 28, height: 2, backgroundColor: '#D8EDD8', marginTop: 13 },
  createStepLineDone: { backgroundColor: '#0A4D26' },

  // Shared step body
  createCenterWrap: { flex: 1, justifyContent: 'flex-start' },
  createStepBody: { gap: 16 },
  createField: { gap: 4 },
  createFieldLabel: { color: '#0A4D26', fontSize: 15, fontWeight: '700' },
  createInputBox: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 16, borderWidth: 1.5, borderColor: '#D1E8D5', backgroundColor: '#F4FCF6', paddingHorizontal: 16 },
  createInputBoxError: { borderColor: '#D9383A', backgroundColor: '#FFF6F6' },
  createInput: { flex: 1, color: '#0A4D26', fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  createEyeToggle: { padding: 2 },
  createFieldError: { color: '#D9383A', fontSize: 11, fontWeight: '700' },

  // Age wheel picker (step 2)
  createAgeHeading: { color: '#0A4D26', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  createAgeSubtext: { color: '#2D5A3E', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  createAgeWheelWrap: { alignItems: 'center' },
  createAgeWheel: { width: 140, height: 220, borderRadius: 20, backgroundColor: '#F4FCF6', overflow: 'hidden' },
  createAgeWheelHighlight: { position: 'absolute', left: 0, right: 0, top: 88, height: 44, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#0A4D26', backgroundColor: 'rgba(10,77,38,0.05)' },
  createAgeWheelItem: { height: 44, alignItems: 'center', justifyContent: 'center' },
  createAgeWheelText: { fontSize: 18, color: '#9AB8A6', fontWeight: '600' },
  createAgeWheelTextActive: { fontSize: 24, color: '#0A4D26', fontWeight: '900' },

  // Avatar picker (step 1)
  createAvatarSection: { gap: 8 },
  createAvatarLabel: { color: '#2D7A4E', fontSize: 13, fontWeight: '700' },
  createAvatarRow: { flexDirection: 'row', gap: 12 },
  createAvatarChoice: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: '#D8EDD8', overflow: 'hidden' },
  createAvatarChoiceActive: { borderWidth: 2, borderColor: '#0A4D26' },
  createAvatarImage: { width: '100%', height: '100%' },
  createAvatarBadge: { position: 'absolute', bottom: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#0A4D26', alignItems: 'center', justifyContent: 'center' },

  // Actions
  createActions: { gap: 12, alignItems: 'center', paddingTop: 6, width: '100%' },
  createNavButtonsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  createNavButtonFlex: { flex: 1 },
  createCtaBtn: { borderRadius: 20, backgroundColor: '#0A4D26', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, shadowColor: '#0A4D26', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  createCtaBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  createSecondaryBtn: { flexDirection: 'row', gap: 4, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#0A4D26', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  createSecondaryBtnText: { color: '#0A4D26', fontSize: 16, fontWeight: '800' },
  createLoginRow: { alignItems: 'center', gap: 2 },
  createLoginText: { color: '#2D5A3E', fontSize: 14 },
  createLoginLink: { color: '#0A4D26', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
