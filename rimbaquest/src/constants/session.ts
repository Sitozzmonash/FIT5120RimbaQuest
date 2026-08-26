import { GalleryItem, UserProfile } from '../types';

const SESSION_KEY = 'rimbaquest.session.v1';
const GALLERY_KEY_PREFIX = 'rimbaquest.gallery.v1.';

function storage(): Storage | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function galleryKey(childId: number): string {
  return `${GALLERY_KEY_PREFIX}${childId}`;
}

export function loadSession(): UserProfile | null {
  try {
    const raw = storage()?.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(user: UserProfile): void {
  try {
    storage()?.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // Session persistence is best-effort for Iteration 1.
  }
}

export function clearSession(): void {
  try {
    storage()?.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function loadGallery(childId: number): Record<string, GalleryItem[]> {
  if (!childId) return {};
  try {
    const raw = storage()?.getItem(galleryKey(childId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, GalleryItem[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveGallery(childId: number, photos: Record<string, GalleryItem[]>): void {
  if (!childId) return;
  try {
    storage()?.setItem(galleryKey(childId), JSON.stringify(photos));
  } catch {
    // Gallery persistence is best-effort; private mode and quota can both fail.
  }
}
