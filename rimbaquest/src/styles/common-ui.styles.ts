import { StyleSheet } from 'react-native';

export const commonUiStyles = StyleSheet.create({
  stat: { flex: 1, borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 18, padding: 14, backgroundColor: '#FFFFFF' },
  statValue: { color: '#0BA84A', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#66706A', fontSize: 11, marginTop: 4, fontWeight: '700' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1B211C' },
  seeAll: { color: '#0BA84A', fontSize: 12, fontWeight: '700' },
  quest: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F1' },
  questNumber: { width: 32, height: 32, lineHeight: 32, textAlign: 'center', color: '#FFFFFF', backgroundColor: '#35B85E', borderRadius: 16, fontWeight: '900' },
  header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1B211C', flex: 1, textAlign: 'center' },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#DFE7E1', alignItems: 'center', justifyContent: 'center' },
  backSpacer: { width: 38 },
  backText: { fontSize: 30, color: '#1B211C', lineHeight: 32 },
  infoValue: { color: '#1B211C', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  progressCard: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, backgroundColor: '#FFFFFF' },
  progressTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  progressValue: { fontSize: 22, color: '#1B211C', fontWeight: '900', marginTop: 3 },
  unlocked: { color: '#0BA84A', fontSize: 12, fontWeight: '800' },
  track: { height: 8, backgroundColor: '#E8EEEA', borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  fill: { height: '100%', backgroundColor: '#0BA84A', borderRadius: 4 },
});
