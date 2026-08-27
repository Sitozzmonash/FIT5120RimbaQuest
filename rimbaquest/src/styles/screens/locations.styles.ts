import { StyleSheet } from 'react-native';

export const locationsStyles = StyleSheet.create({
  locationList: { gap: 12 },
  locationCard: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 16, padding: 14, backgroundColor: '#FFFFFF' },
  locationTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationName: { color: '#1B211C', fontSize: 15, fontWeight: '800', flex: 1 },
  locationArea: { color: '#68716C', fontSize: 11, fontWeight: '700', marginTop: 3 },
  locationDesc: { color: '#525B55', fontSize: 12, lineHeight: 17, marginTop: 6 },
  wildlifeTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8, alignItems: 'center' },
  wildlifeTagLabel: { fontSize: 10, color: '#7B857F', fontWeight: '800' },
  wildlifeTagValue: { fontSize: 10, color: '#087B35', fontWeight: '700' },
  locationCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F4F1' },
  bestTimeText: { fontSize: 10, color: '#7B857F' },
  viewDetailText: { fontSize: 11, color: '#0BA84A', fontWeight: '800' },
  locationDetailHero: { backgroundColor: '#F4FAF6', padding: 16, borderRadius: 16, marginTop: 14, marginBottom: 12, alignItems: 'center' },
  locationAreaHero: { fontSize: 14, fontWeight: '800', color: '#1B211C' },
  locationTypeBadge: { fontSize: 11, color: '#0BA84A', fontWeight: '700', marginTop: 4 },
  noticeBanner: { marginBottom: 10 },
  distanceBadge: { color: '#0BA84A', backgroundColor: '#EAF8EF', borderRadius: 10, fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
});
