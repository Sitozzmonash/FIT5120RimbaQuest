import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { GalleryItem, UserProfile } from '../types';


const SESSION_KEY = 'rimbaquest.session.v2';
const GALLERY_KEY_PREFIX = 'rimbaquest.gallery.v1.';

export type StoredSession = {
  user: UserProfile;
  accessToken: string;
};

function webStorage(): Storage | null {
  try {
    if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && globalThis.localStorage) {
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

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = Platform.OS === 'web'
      ? webStorage()?.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.user?.id || !parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  const value = JSON.stringify(session);
  try {
    if (Platform.OS === 'web') webStorage()?.setItem(SESSION_KEY, value);
    else await SecureStore.setItemAsync(SESSION_KEY, value);
  } catch {
    // The server remains the source of truth; users can sign in again.
  }
}

export async function clearSession(): Promise<void> {
  try {
    if (Platform.OS === 'web') webStorage()?.removeItem(SESSION_KEY);
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // Ignore platform storage cleanup failures during logout.
  }
}

export function loadGallery(childId: number): Record<string, GalleryItem[]> {
  if (!childId) return {};
  try {
    const raw = webStorage()?.getItem(galleryKey(childId));
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
    webStorage()?.setItem(galleryKey(childId), JSON.stringify(photos));
  } catch {
    // Remote private Storage is authoritative; this is only a web cache.
  }
}
