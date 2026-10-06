import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LocationItem } from '../../../../types';
import { formatDistance } from '../../../../utils/locationDiscovery';
import { Tap } from '../../../common/Tap';
import { LOCATION_COLORS } from '../locationsTheme';

type MapPoint = { location: LocationItem; x: number; y: number };

function makePoints(locations: LocationItem[]): MapPoint[] {
  const valid = locations.filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number');
  if (!valid.length) return [];
  const latitudes = valid.map((item) => item.lat as number);
  const longitudes = valid.map((item) => item.lng as number);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = Math.max(maxLat - minLat, 0.02);
  const lngRange = Math.max(maxLng - minLng, 0.02);

  return valid.map((location) => ({
    location,
    x: 12 + (((location.lng as number) - minLng) / lngRange) * 76,
    y: 12 + ((maxLat - (location.lat as number)) / latRange) * 76,
  }));
}

export function LocationMapView({
  locations,
  distances,
  onSelect,
}: {
  locations: LocationItem[];
  distances: Record<string, number>;
  onSelect: (location: LocationItem) => void;
}) {
  const points = useMemo(() => makePoints(locations), [locations]);
  const [selectedId, setSelectedId] = useState<string | null>(points[0]?.location.id ?? null);
  const selected = points.find((point) => point.location.id === selectedId)?.location ?? null;

  if (!points.length) {
    return <Text style={styles.empty}>No map coordinates are available for these locations.</Text>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.map} accessibilityLabel="Map showing matching wildlife locations">
        <Svg width="100%" height={260} viewBox="0 0 100 100">
          <Path d="M0 8 C20 2 29 15 45 10 S76 2 100 12 V100 H0 Z" fill="#D9F0D5" />
          <Path d="M3 76 C24 62 33 83 50 69 S79 74 98 56" fill="none" stroke="#87C9ED" strokeWidth={2.5} />
          {points.map(({ location, x, y }) => {
            const active = selectedId === location.id;
            return (
              <Circle
                key={location.id}
                cx={x}
                cy={y}
                r={active ? 5.2 : 3.8}
                fill={active ? '#FF9E45' : '#1B6A42'}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                onPress={() => setSelectedId(location.id)}
              />
            );
          })}
        </Svg>
      </View>
      <Text style={styles.caption}>Schematic map only — not to scale and not a route map.</Text>
      {selected ? (
        <View style={styles.preview}>
          <Text style={styles.name}>{selected.name}</Text>
          <Text style={styles.detail}>{selected.area}</Text>
          <Text style={styles.detail}>{selected.best_time}</Text>
          {formatDistance(distances[selected.id]) ? <Text style={styles.distance}>{formatDistance(distances[selected.id])}</Text> : null}
          <Tap label={`View details for ${selected.name}`} style={styles.button} onPress={() => onSelect(selected)}>
            <Text style={styles.buttonText}>View place details</Text>
          </Tap>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  map: { height: 260, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: LOCATION_COLORS.ink, backgroundColor: '#D9F0D5' },
  caption: { color: LOCATION_COLORS.muted, fontSize: 12, textAlign: 'center' },
  preview: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#C7D8C3', padding: 14, gap: 4 },
  name: { color: LOCATION_COLORS.ink, fontSize: 16, fontWeight: '800' },
  detail: { color: LOCATION_COLORS.muted, fontSize: 13 },
  distance: { color: '#0B7A43', fontWeight: '800', fontSize: 13 },
  button: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: LOCATION_COLORS.forest, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  empty: { textAlign: 'center', color: LOCATION_COLORS.muted, padding: 24 },
});
