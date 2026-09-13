import { StyleSheet } from 'react-native';

// Forgot Password screen (Figma node 302:139).
export const forgotPasswordStyles = StyleSheet.create({
  forgotRoot: { flex: 1 },
  forgotBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  forgotDecoCircle1: { position: 'absolute', left: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#78B833', opacity: 0.15 },
  forgotDecoCircle2: { position: 'absolute', left: '75%', top: '75%', width: 140, height: 140, borderRadius: 70, backgroundColor: '#78B833', opacity: 0.12 },
  forgotScroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  forgotCenterWrap: { flex: 1, justifyContent: 'center' },
  forgotContent: { alignItems: 'center', gap: 24, paddingVertical: 16 },
  forgotMascotBlob: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(216,240,224,0.5)', alignItems: 'center', justifyContent: 'center' },
  forgotMascotImage: { width: 166, height: 180 },
  forgotTextGroup: { gap: 10, alignItems: 'center' },
  forgotTitle: { color: '#0A4D26', fontSize: 24, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  forgotSubtitle: { color: '#2D5A3E', fontSize: 15, lineHeight: 22.5, textAlign: 'center' },
  forgotActionGroup: { gap: 16, width: '100%' },
  forgotInputBox: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#D1E8D5', backgroundColor: 'rgba(255,255,255,0.93)', paddingHorizontal: 16 },
  forgotInputBoxError: { borderColor: '#D9383A', backgroundColor: '#FFF6F6' },
  forgotInput: { flex: 1, color: '#0A4D26', fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  forgotFieldError: { color: '#D9383A', fontSize: 11, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  forgotSubmitBtn: { width: '100%' },
  forgotBackToLogin: { color: '#0A4D26', fontSize: 14, fontWeight: '700' },
  forgotErrorBanner: { color: '#D9383A', backgroundColor: '#FCE8E8', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: '700', width: '100%', textAlign: 'center' },
});
