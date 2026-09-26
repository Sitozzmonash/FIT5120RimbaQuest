import { AudioPlayer, createAudioPlayer } from "expo-audio";

const BUTTON_CLICK = require("../../assets/audio/button-click-2.wav");
const BACKGROUND_MUSIC = require("../../assets/audio/background-music.mp3");

const MUSIC_VOLUME = 0.35;

let clickPlayer: AudioPlayer | null = null;
let musicPlayer: AudioPlayer | null = null;
// Whether the soundtrack should be playing (the app may still pause it while
// it's in the background).
let musicWanted = false;

export function playButtonClick() {
  try {
    clickPlayer ??= createAudioPlayer(BUTTON_CLICK);
    void clickPlayer.seekTo(0).catch(() => {});
    clickPlayer.play();
  } catch {
    // e.g. audio unavailable on this device or blocked by the browser.
  }
  resumeBackgroundMusic();
}

// Starts the looping soundtrack (safe to call again while it's playing).
export function startBackgroundMusic() {
  musicWanted = true;
  try {
    if (!musicPlayer) {
      musicPlayer = createAudioPlayer(BACKGROUND_MUSIC);
      musicPlayer.loop = true;
      musicPlayer.volume = MUSIC_VOLUME;
    }
    if (!musicPlayer.playing) musicPlayer.play();
  } catch {
    // Music is optional; the app works silently if it can't play.
  }
}

// Stops the soundtrack and rewinds it, e.g. on log out.
export function stopBackgroundMusic() {
  musicWanted = false;
  try {
    musicPlayer?.pause();
    void musicPlayer?.seekTo(0).catch(() => {});
  } catch {
    // ignore
  }
}

// Pauses without forgetting that music is wanted, e.g. app in background.
export function pauseBackgroundMusic() {
  try {
    musicPlayer?.pause();
  } catch {
    // ignore
  }
}

// Picks the soundtrack back up if it's meant to be playing.
export function resumeBackgroundMusic() {
  if (!musicWanted) return;
  try {
    if (musicPlayer && !musicPlayer.playing) musicPlayer.play();
  } catch {
    // ignore
  }
}
