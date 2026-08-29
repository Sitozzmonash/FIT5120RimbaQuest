import { StyleSheet } from 'react-native';

// Account Entry screen (Figma node 309:5) — the first screen a logged-out
// explorer sees, offering a choice between logging in and creating an account.
export const accountEntryStyles = StyleSheet.create({
  entryRoot: { flex: 1 },
  entryBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  entryDecoCircle1: { position: 'absolute', left: -50, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: '#78B833', opacity: 0.15 },
  entryDecoCircle2: { position: 'absolute', left: '70%', top: '80%', width: 140, height: 140, borderRadius: 70, backgroundColor: '#78B833', opacity: 0.12 },
  entryScroll: { flexGrow: 1, justifyContent: 'center' },
  entryMascotArea: { alignItems: 'center', gap: 24, paddingTop: 32, paddingBottom: 16 },
  entryBrandLogo: { width: 176, height: 40 },
  entryMascotBlob: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(216,240,224,0.4)', alignItems: 'center', justifyContent: 'center' },
  entryMascotImage: { width: 212, height: 220 },
  entryContent: { gap: 32, paddingHorizontal: 24, paddingBottom: 48 },
  entryTextGroup: { gap: 12, alignItems: 'center' },
  entryTitle: { color: '#0A4D26', fontSize: 24, lineHeight: 32, fontWeight: '800', textAlign: 'center' },
  entrySubtitle: { color: '#2D5A3E', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  entryButtons: { gap: 12 },
  entryCreateBtn: { height: 52, borderRadius: 100, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#0A4D26', alignItems: 'center', justifyContent: 'center' },
  entryCreateBtnText: { color: '#0A4D26', fontSize: 16, fontWeight: '700' },
});
