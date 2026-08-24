import { UserProfile } from '../types';

const SESSION_KEY = 'rimbaquest.session.v1';

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
