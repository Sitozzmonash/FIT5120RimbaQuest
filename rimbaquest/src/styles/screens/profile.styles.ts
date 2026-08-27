import { StyleSheet } from 'react-native';

// Explorer profile screens (view + edit). The 5 dedicated auth-flow screens
// (account entry, login, create account, forgot/reset password) have their
// own style files alongside this one.
export const profileStyles = StyleSheet.create({
  progressRow: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, backgroundColor: '#FFFFFF' },
  authForm: { gap: 10 },
  avatarPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  avatarChoice: { width: '30%', borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 12, padding: 8, alignItems: 'center', backgroundColor: '#FFFFFF' },
  avatarChoiceActive: { borderColor: '#0BA84A', borderWidth: 2, backgroundColor: '#EDF5EF' },
  avatarChoiceEmoji: { fontSize: 24 },
  avatarChoiceName: { fontSize: 10, fontWeight: '800', color: '#566159', textTransform: 'capitalize', marginTop: 2 },
  profileHero: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 18, padding: 14, marginBottom: 12, backgroundColor: '#FFFFFF' },
  profileHeroAvatar: { fontSize: 36, marginRight: 12 },
  profileHeroInfo: { flex: 1 },
  profileHeroName: { fontSize: 17, fontWeight: '900', color: '#1B211C' },
  profileHeroBand: { fontSize: 11, color: '#68716C', marginTop: 2 },
  editProfileBtn: { borderWidth: 1, borderColor: '#0BA84A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  editProfileBtnText: { color: '#0BA84A', fontSize: 11, fontWeight: '800' },
  optionalLabel: { color: '#879089', fontSize: 10, fontWeight: '800', marginTop: 8, marginBottom: 4 },
});
