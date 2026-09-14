import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type ActivityType = 'discovery' | 'view' | 'fun_facts' | 'quiz' | 'chat';

export type ActivityEntry = {
  speciesId: string;
  activityType: ActivityType;
  lastInteractedAt: number; // epoch ms
};

const KEY_PREFIX = 'rimbaquest.continueLearning.v1.';

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

export async function loadActivityEntries(childId: number): Promise<ActivityEntry[]> {
  const key = `${KEY_PREFIX}${childId}`;
  try {
    const raw = Platform.OS === 'web'
      ? webStorage()?.getItem(key)
      : await SecureStore.getItemAsync(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveActivityEntries(childId: number, entries: ActivityEntry[]): Promise<void> {
  const key = `${KEY_PREFIX}${childId}`;
  const value = JSON.stringify(entries);
  try {
    if (Platform.OS === 'web') webStorage()?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Best-effort: Continue Learning stays in memory for this session even
    // if it can't be persisted.
  }
}
