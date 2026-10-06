import { LocationItem } from '../types';

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/** Calculates an approximate straight-line distance; no coordinates are persisted. */
export function distanceInKm(
  from: { latitude: number; longitude: number },
  to: Pick<LocationItem, 'lat' | 'lng'>,
): number | null {
  if (typeof to.lat !== 'number' || typeof to.lng !== 'number') return null;

  const latitudeDelta = toRadians(to.lat - from.latitude);
  const longitudeDelta = toRadians(to.lng - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function sortLocations(
  locations: LocationItem[],
  distances: Record<string, number>,
): LocationItem[] {
  return [...locations].sort((left, right) => {
    const leftDistance = distances[left.id];
    const rightDistance = distances[right.id];
    if (leftDistance !== undefined && rightDistance !== undefined) return leftDistance - rightDistance;
    if (leftDistance !== undefined) return -1;
    if (rightDistance !== undefined) return 1;
    return left.name.localeCompare(right.name);
  });
}

export function formatDistance(distance: number | undefined): string | null {
  if (distance === undefined) return null;
  const value = distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1).replace(/\.0$/, '')} km`;
  return `${value} straight-line`;
}

/** A key-free, shareable Google Maps destination URL. */
export function directionsUrl(location: LocationItem): string {
  const destination =
    typeof location.lat === 'number' && typeof location.lng === 'number'
      ? `${location.lat},${location.lng}`
      : `${location.name}, ${location.area}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
