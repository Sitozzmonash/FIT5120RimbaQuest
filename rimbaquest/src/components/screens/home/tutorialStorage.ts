import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const keyFor = (userId: number) => `rimbaquest.homeTutorialSeen.v1.${userId}`;

export async function hasSeenTutorialSign(userId: number): Promise<boolean> {
  try {
    const key = keyFor(userId);
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) === "1";
    return (await SecureStore.getItemAsync(key)) === "1";
  } catch {
    return false;
  }
}

export async function markTutorialSignSeen(userId: number): Promise<void> {
  try {
    const key = keyFor(userId);
    if (Platform.OS === "web") globalThis.localStorage?.setItem(key, "1");
    else await SecureStore.setItemAsync(key, "1");
  } catch {
    // The sign remains available even if local storage is unavailable.
  }
}
