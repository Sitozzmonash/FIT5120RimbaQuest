import { useEffect } from "react";
import { Platform } from "react-native";
import { Screen } from "../types";

type PageColors = { top: string; bottom: string };

const GAME_GREEN = "#0E4527";
const DEFAULT_COLORS: PageColors = { top: "#FFFFFF", bottom: "#FFFFFF" };

// Colour at each screen's top edge (tints the mobile browser bar) and bottom
// edge (shows in the strip revealed when the address bar hides on scroll).
const SCREEN_COLORS: Partial<Record<Screen, PageColors>> = {
  home: { top: "#D8ECCE", bottom: "#FDF2D9" },
  account_entry: { top: "#FDF2D9", bottom: GAME_GREEN },
  login: { top: "#FDF2D9", bottom: GAME_GREEN },
  create_account: { top: "#FDF2D9", bottom: GAME_GREEN },
  forgot_password: { top: "#FDF2D9", bottom: GAME_GREEN },
  reset_password: { top: "#FDF2D9", bottom: GAME_GREEN },
  locations: { top: GAME_GREEN, bottom: "#F5EDD6" },
  location_detail: { top: GAME_GREEN, bottom: "#F5EDD6" },
  collection: { top: GAME_GREEN, bottom: GAME_GREEN },
  about: { top: GAME_GREEN, bottom: GAME_GREEN },
  facts: { top: GAME_GREEN, bottom: GAME_GREEN },
  battle_stats: { top: GAME_GREEN, bottom: GAME_GREEN },
  battle_select: { top: GAME_GREEN, bottom: GAME_GREEN },
  gallery: { top: GAME_GREEN, bottom: GAME_GREEN },
  quiz: { top: GAME_GREEN, bottom: GAME_GREEN },
  locked: { top: GAME_GREEN, bottom: GAME_GREEN },
  progress: { top: GAME_GREEN, bottom: GAME_GREEN },
  profile_edit: { top: GAME_GREEN, bottom: GAME_GREEN },
  photo: { top: "#0B0F0B", bottom: "#0B0F0B" },
  species: { top: GAME_GREEN, bottom: "#0B0F0B" },
  confirm: { top: GAME_GREEN, bottom: "#1A4D2E" },
  success: { top: GAME_GREEN, bottom: GAME_GREEN },
};

function setThemeColor(color: string) {
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}

// Web only: matches the page background and browser bar to the current screen.
export function useWebPageColors(screen: Screen) {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const { top, bottom } = SCREEN_COLORS[screen] ?? DEFAULT_COLORS;
    document.documentElement.style.backgroundColor = bottom;
    document.body.style.backgroundColor = bottom;
    setThemeColor(top);
  }, [screen]);
}
