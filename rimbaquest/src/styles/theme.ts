import { StyleSheet } from 'react-native';

import { battleStyles } from './screens/battle.styles';
import { collectionStyles } from './screens/collection.styles';
import { discoveryStyles } from './screens/discovery.styles';
import { homeStyles } from './screens/home.styles';
import { locationsStyles } from './screens/locations.styles';
import { profileStyles } from './screens/profile.styles';
import { accountEntryStyles } from './screens/accountEntry.styles';
import { loginStyles } from './screens/login.styles';
import { accountCreationStyles } from './screens/accountCreation.styles';
import { forgotPasswordStyles } from './screens/forgotPassword.styles';
import { resetPasswordStyles } from './screens/resetPassword.styles';
import { commonUiStyles } from './common-ui.styles';

// General / shared styles used across multiple screens, plus the app shell
// (SafeAreaView/page wrappers) and the Tap component's pressed state.
// Screen-specific styles live alongside their screen in ./screens/*.styles.ts,
// and CommonUI's own styles live in ./common-ui.styles.ts. They're all merged
// into one `styles` object below so existing `styles.foo` call sites don't
// need to change.
const general = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  safeTransparent: { backgroundColor: 'transparent' },
  page: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 520, backgroundColor: '#FFFFFF' },
  pageTransparent: { backgroundColor: 'transparent' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notice: { color: '#8B5D00', backgroundColor: '#FFF7DD', borderRadius: 10, padding: 10, fontSize: 12, marginBottom: 10 },
  cardTitle: { color: '#1B211C', fontSize: 14, fontWeight: '800', marginTop: 6, paddingHorizontal: 6 },
  muted: { color: '#707872', fontSize: 11, marginTop: 2, paddingHorizontal: 6 },
  pageTitle: { color: '#1B211C', fontSize: 22, lineHeight: 26, fontWeight: '900', marginTop: 4 },
  subTitle: { color: '#68716C', fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  speciesImage: { width: '100%', height: 96 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, marginTop: 4 },
  categoryText: { color: '#0BA84A', fontSize: 10, fontWeight: '700' },
  hpBadgeMini: { color: '#D9383A', fontSize: 10, fontWeight: '800' },
  categoryPill: { fontSize: 10, color: '#087B35', backgroundColor: '#DFF6E7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start' },
  info: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 14, padding: 12, marginTop: 10, backgroundColor: '#FFFFFF' },
  infoLabel: { color: '#78817B', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  inputGroup: { marginTop: 12 },
  inputLabel: { color: '#566159', fontSize: 10, fontWeight: '800', marginBottom: 5 },
  textInput: { borderWidth: 1, borderColor: '#C8D1CA', borderRadius: 12, paddingHorizontal: 12, minHeight: 44, fontSize: 14, color: '#1B211C', backgroundColor: '#FFFFFF' },
  primary: { minHeight: 48, marginTop: 14, borderRadius: 24, backgroundColor: '#0BA84A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondary: { minHeight: 46, marginTop: 9, borderRadius: 23, backgroundColor: '#FFFFFF', borderColor: '#C8D1CA', borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryText: { color: '#1B211C', fontSize: 13, fontWeight: '700' },
  scientific: { color: '#68716C', fontStyle: 'italic', fontSize: 12, marginTop: 3 },
  infoPair: { flexDirection: 'row', alignSelf: 'stretch', gap: 8, marginTop: 6 },
  textButton: { paddingVertical: 12, alignItems: 'center' },
  textButtonText: { color: '#0BA84A', fontWeight: '800', fontSize: 13 },
  chips: { gap: 8, paddingBottom: 12 },
  chip: { borderRadius: 16, backgroundColor: '#F0F4F1', paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#0BA84A' },
  chipText: { fontSize: 11, color: '#607068', fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  badge: { color: '#31613F', backgroundColor: '#EDF5EF', borderRadius: 14, fontSize: 10, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' },
  quiz: { borderColor: '#CBECD6', borderWidth: 1, backgroundColor: '#F4FFF7', borderRadius: 16, padding: 14 },
  quizLabel: { color: '#087B35', fontSize: 10, fontWeight: '800' },
  quizTitle: { fontSize: 17, color: '#1B211C', fontWeight: '800', marginTop: 4 },
  quizButton: { backgroundColor: '#0BA84A', alignSelf: 'flex-start', borderRadius: 16, marginTop: 12, paddingVertical: 8, paddingHorizontal: 14 },
  hint: { color: '#117B3A', backgroundColor: '#F0FAF3', borderColor: '#CBECD6', borderWidth: 1, borderRadius: 10, fontSize: 11, lineHeight: 16, padding: 10, marginTop: 12 },
  buttonDisabled: { opacity: 0.5 },
  quizOption: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 10 },
  quizOptionSelected: { backgroundColor: '#0BA84A', borderColor: '#0BA84A' },
  quizOptionText: { textAlign: 'center', lineHeight: 18 },
  quizOptionTextSelected: { color: '#FFFFFF' },
  pressed: { opacity: 0.72 },
  searchBox: { minHeight: 46, marginBottom: 12, borderWidth: 1, borderColor: '#C8D1CA', borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF' },
  searchIcon: { color: '#879089', fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#1B211C', fontSize: 13, minHeight: 44, paddingVertical: 0 },
  searchClear: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EDF5EF', alignItems: 'center', justifyContent: 'center' },
  searchClearText: { color: '#087B35', fontSize: 20, lineHeight: 22, fontWeight: '700' },
  searchEmpty: { borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 14, padding: 18, alignItems: 'center' },
  searchEmptyTitle: { color: '#087B35', fontSize: 15, fontWeight: '800', marginBottom: 4 },
});

export const styles: any = {
  ...general,
  ...commonUiStyles,
  ...homeStyles,
  ...locationsStyles,
  ...collectionStyles,
  ...battleStyles,
  ...profileStyles,
  ...accountEntryStyles,
  ...loginStyles,
  ...accountCreationStyles,
  ...forgotPasswordStyles,
  ...resetPasswordStyles,
  ...discoveryStyles,
};
