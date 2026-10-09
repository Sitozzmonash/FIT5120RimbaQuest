import { AudioPlayer, createAudioPlayer } from "expo-audio";

const BUTTON_CLICK = require("../../assets/audio/button-click-3.wav");
const BACKGROUND_MUSIC = require("../../assets/audio/background-music.mp3");
const CAPTURE_SUCCESS_MUSIC = require("../../assets/audio/capture-success-2.mp3");
const BATTLE_SCREEN_MUSIC = require("../../assets/audio/battle-screen.mp3");
const BATTLE_ARENA_MUSIC = require("../../assets/audio/battle-arena.mp3");

// One soundtrack loops at a time; screens like the card battle swap it.
export type MusicTrack = "main" | "battle" | "arena";
const TRACKS: Record<MusicTrack, number> = {
  main: BACKGROUND_MUSIC,
  battle: BATTLE_SCREEN_MUSIC,
  arena: BATTLE_ARENA_MUSIC,
};

const MUSIC_VOLUME = 1.0;

let clickPlayer: AudioPlayer | null = null;
const musicPlayers: Partial<Record<MusicTrack, AudioPlayer>> = {};
let currentTrack: MusicTrack = "main";
// Whether the soundtrack should be playing (the app may still pause it while
// it's in the background).
let musicWanted = false;
let audioMuted = false;

export function isAudioMuted() {
  return audioMuted;
}

export function setAudioMuted(muted: boolean) {
  if (audioMuted === muted) return;
  audioMuted = muted;
  if (muted) {
    try {
      clickPlayer?.pause();
      Object.values(musicPlayers).forEach((player) => player.pause());
    } catch {
      // Audio is optional.
    }
  } else {
    resumeBackgroundMusic();
  }
}

export function playButtonClick() {
  if (audioMuted) return;
  try {
    clickPlayer ??= createAudioPlayer(BUTTON_CLICK);
    void clickPlayer.seekTo(0).catch(() => {});
    clickPlayer.play();
  } catch {
    // e.g. audio unavailable on this device or blocked by the browser.
  }
  resumeBackgroundMusic();
}

export function playCaptureSuccess() {
  if (audioMuted) return;
  try {
    const player = createAudioPlayer(CAPTURE_SUCCESS_MUSIC);
    player.play();
  } catch {
    // e.g. audio unavailable on this device or blocked by the browser.
  }
  resumeBackgroundMusic();
}

function musicPlayer(track: MusicTrack): AudioPlayer {
  let player = musicPlayers[track];
  if (!player) {
    player = createAudioPlayer(TRACKS[track]);
    player.loop = true;
    player.volume = MUSIC_VOLUME;
    musicPlayers[track] = player;
  }
  return player;
}

// Starts the looping soundtrack (safe to call again while it's playing).
export function startBackgroundMusic() {
  musicWanted = true;
  if (audioMuted) return;
  try {
    musicPlayer(currentTrack).play();
  } catch {
    // Music is optional; the app works silently if it can't play.
  }
}

// Swaps the looping soundtrack, e.g. battle music on the battle screens.
// The main theme picks up where it left off; battle tracks start from the top.
export function setMusicTrack(track: MusicTrack) {
  if (track === currentTrack) return;
  try {
    const previous = musicPlayers[currentTrack];
    previous?.pause();
    if (previous && currentTrack !== "main")
      void previous.seekTo(0).catch(() => {});
  } catch {
    // ignore
  }
  currentTrack = track;
  if (musicWanted) startBackgroundMusic();
}

// Stops the soundtrack and rewinds it, e.g. on log out.
export function stopBackgroundMusic() {
  musicWanted = false;
  try {
    Object.values(musicPlayers).forEach((player) => {
      player.pause();
      void player.seekTo(0).catch(() => {});
    });
  } catch {
    // ignore
  }
  currentTrack = "main";
}

// Pauses without forgetting that music is wanted, e.g. app in background.
export function pauseBackgroundMusic() {
  try {
    musicPlayers[currentTrack]?.pause();
  } catch {
    // ignore
  }
}

// Picks the soundtrack back up if it's meant to be playing. Called on every
// button tap so a play the browser blocked (no user gesture) gets retried.
export function resumeBackgroundMusic() {
  if (!musicWanted || audioMuted) return;
  try {
    musicPlayers[currentTrack]?.play();
  } catch {
    // ignore
  }
}
