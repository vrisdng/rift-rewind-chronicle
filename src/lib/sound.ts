/**
 * Enhanced audio manager with intro, rotating BGM, and SFX
 * 
 * Audio file structure:
 * - public/audio/intro/welcome.mp3 - Welcome music (plays once on init)
 * - public/audio/bgm/battle-1.mp3 through battle-4.mp3 - Battle background music (rotates)
 * - public/audio/sfx/button-click.mp3 - Button click sound effect
 */

let introAudio: HTMLAudioElement | null = null;
let bgmAudios: HTMLAudioElement[] = [];
let currentBgmIndex = 0;
let hoverAudio: HTMLAudioElement | null = null;
let clickAudio: HTMLAudioElement | null = null;
let audioInitialized = false;
let introPlayed = false;

const BGM_TRACKS = [
  '/sounds/background-music-legends-never-die.mp3',
  '/sounds/background-music-sacrifice.mp3',
  '/sounds/background-music-gods.mp3'
];

export function initSounds() {
  if (audioInitialized) return;

  // Initialize intro audio
  introAudio = new Audio('/sounds/welcome-audio.mp3');
  introAudio.volume = 0.25;
  introAudio.preload = 'auto';

  // Initialize all BGM tracks
  bgmAudios = BGM_TRACKS.map(src => {
    const audio = new Audio(src);
    audio.volume = 0.045;
    audio.preload = 'auto';
    return audio;
  });

  // Set up auto-rotation when a track ends
  bgmAudios.forEach((audio, index) => {
    audio.addEventListener('ended', () => {
      playNextBgm();
    });
  });

  // Initialize hover SFX
  hoverAudio = new Audio('/sounds/button-sound-effect-hover.mp3');
  hoverAudio.preload = 'auto';
  hoverAudio.volume = 0.15;

  // Initialize click SFX
  clickAudio = new Audio('/sounds/button-sound-effect-click.mp3');
  clickAudio.preload = 'auto';
  clickAudio.volume = 0.15;

  audioInitialized = true;
}

/**
 * Play intro audio ONCE, then start BGM
 * Call this only when user clicks Enter
 */
export function playIntroThenBgm() {
  initSounds();
  
  if (!introAudio) return;
  
  // Reset intro to start
  introAudio.currentTime = 0;
  introAudio.play().catch(() => {
    // If intro fails, go straight to BGM
    startBackgroundMusic();
  });
  
  // When intro ends, start BGM
  introAudio.addEventListener('ended', () => {
    startBackgroundMusic();
  }, { once: true });
}

/**
 * Start background music rotation
 */
export function startBackgroundMusic() {
  initSounds();
  if (bgmAudios.length === 0) return;
  
  const currentBgm = bgmAudios[currentBgmIndex];
  if (currentBgm && currentBgm.paused) {
    currentBgm.play().catch(() => {});
  }
}

/**
 * Play next track in rotation
 */
function playNextBgm() {
  if (bgmAudios.length === 0) return;
  
  // Pause current track
  bgmAudios[currentBgmIndex].pause();
  bgmAudios[currentBgmIndex].currentTime = 0;
  
  // Move to next track
  currentBgmIndex = (currentBgmIndex + 1) % bgmAudios.length;
  
  // Play next track
  bgmAudios[currentBgmIndex].play().catch(() => {});
}

let bgmPausedByUser = false;

/**
 * Toggle background music on/off
 */
export function toggleBackgroundMusic() {
  initSounds();
  if (bgmAudios.length === 0) return;
  
  const currentBgm = bgmAudios[currentBgmIndex];
  if (currentBgm.paused) {
    currentBgm.play().catch(() => {});
    bgmPausedByUser = false
  } else {
    currentBgm.pause();
    bgmPausedByUser = true;
  }
}

/**
 * Check if BGM is currently playing
 */
export function isBgmPlaying(): boolean {
  return bgmAudios.some(audio => !audio.paused);
}

/**
 * Check if user manually paused BGM
 */
export function isBgmPausedByUser(): boolean {
  return bgmPausedByUser;
}

/**
 * Stop all audio (intro + all BGM)
 */
export function stopAllAudio() {
  if (introAudio) {
    introAudio.pause();
    introAudio.currentTime = 0;
  }
  
  bgmAudios.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

/**
 * Play button hover sound effect
 */
export function playHover() {
  initSounds();
  if (!hoverAudio) return;
  
  try {
    const clone = hoverAudio.cloneNode() as HTMLAudioElement;
    clone.volume = hoverAudio.volume;
    clone.play().catch(() => {});
  } catch (e) {
    hoverAudio.currentTime = 0;
    hoverAudio.play().catch(() => {});
  }
}

/**
 * Play button click sound effect
 */
export function playClick() {
  initSounds();
  if (!clickAudio) return;
  
  try {
    const clone = clickAudio.cloneNode() as HTMLAudioElement;
    clone.volume = clickAudio.volume;
    clone.play().catch(() => {});
  } catch (e) {
    clickAudio.currentTime = 0;
    clickAudio.play().catch(() => {});
  }
}

/**
 * Set BGM volume (0.0 to 1.0)
 */
export function setBgVolume(v: number) {
  initSounds();
  bgmAudios.forEach(audio => {
    audio.volume = v;
  });
}

/**
 * Set SFX volume (0.0 to 1.0)
 */
export function setSfxVolume(v: number) {
  initSounds();
  if (clickAudio) clickAudio.volume = v;
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  if (introAudio && !introAudio.paused) return true;
  return bgmAudios.some(audio => !audio.paused);
}

export default {
  initSounds,
  startBackgroundMusic,
  toggleBackgroundMusic,
  stopAllAudio,
  playClick,
  setBgVolume,
  setSfxVolume,
  isAudioPlaying,
  isBgmPlaying,
  isBgmPausedByUser,
};