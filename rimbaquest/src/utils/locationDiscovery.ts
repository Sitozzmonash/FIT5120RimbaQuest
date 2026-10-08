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

/**
 * A key-free, shareable Google Maps destination URL.
 *
 * Navigation deliberately uses the place name plus its saved address instead
 * of the display pin. A pin is only a map marker and can be adjusted as venue
 * entrances move; asking Google Maps to resolve the named venue prevents a
 * stale coordinate from sending a family to a nearby road or the wrong side
 * of a large park.
 */
export function directionsUrl(location: LocationItem): string {
  const destination = `${location.name}, ${location.area}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

/** Short card label, e.g. "2.5 km away" or "800 m away". */
export function formatDistanceAway(distance: number | undefined): string | null {
  if (distance === undefined) return null;
  const value = distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1).replace(/\.0$/, '')} km`;
  return `${value} away`;
}

export type LocationSort = 'alphabetical' | 'distance';
export type DistanceFilter = 'any' | 'under2' | '2to10' | '10to30' | '30to50' | 'over50';

/** Distance bands for the Locations "Distance" dropdown, in km ([min, max)). */
export const DISTANCE_FILTER_RANGES: Record<DistanceFilter, [number, number]> = {
  any: [0, Infinity],
  under2: [0, 2],
  '2to10': [2, 10],
  '10to30': [10, 30],
  '30to50': [30, 50],
  over50: [50, Infinity],
};

/** Places with no known distance only match "any". */
export function locationMatchesDistance(distance: number | undefined, filter: DistanceFilter): boolean {
  if (filter === 'any') return true;
  if (distance === undefined) return false;
  const [min, max] = DISTANCE_FILTER_RANGES[filter];
  return distance >= min && distance < max;
}

/** A–Z by name, or nearest first (places without a distance go last, A–Z). */
export function orderLocations(
  locations: LocationItem[],
  distances: Record<string, number>,
  sortBy: LocationSort,
): LocationItem[] {
  if (sortBy === 'distance') return sortLocations(locations, distances);
  return [...locations].sort((left, right) => left.name.localeCompare(right.name));
}
