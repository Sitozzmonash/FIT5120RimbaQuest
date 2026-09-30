import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Screen } from "../types";
import {
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  startBackgroundMusic,
  stopBackgroundMusic,
} from "../utils/sounds";

// The soundtrack starts the first time a logged-in explorer reaches Home,
// then keeps looping across screens. It pauses while the app is in the
// background and stops on log out.
export function useBackgroundMusic(screen: Screen, isLoggedIn: boolean) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (isLoggedIn && screen === "home" && !started) {
      startBackgroundMusic();
      setStarted(true);
    }
  }, [isLoggedIn, screen, started]);

  useEffect(() => {
    if (!isLoggedIn && started) {
      stopBackgroundMusic();
      setStarted(false);
    }
  }, [isLoggedIn, started]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") resumeBackgroundMusic();
      else pauseBackgroundMusic();
    });
    return () => subscription.remove();
  }, []);
}
