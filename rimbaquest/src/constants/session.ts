import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { UserProfile } from '../types';


const SESSION_KEY = 'rimbaquest.session.v2';
const LEGACY_GALLERY_KEY_PREFIX = 'rimbaquest.gallery.v1.';

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

function clearLegacyGallery(childId: number): void {
  if (Platform.OS === 'web' && childId) {
    webStorage()?.removeItem(`${LEGACY_GALLERY_KEY_PREFIX}${childId}`);
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = Platform.OS === 'web'
      ? webStorage()?.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.user?.id || !parsed.accessToken) return null;
    clearLegacyGallery(parsed.user.id);
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  const value = JSON.stringify(session);
  try {
    clearLegacyGallery(session.user.id);
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
