// Import all audio functions from audio.ts
import { initAudio } from './audio';
import { startSpinSound } from './audio';
import { stopSpinSound } from './audio';
import { playWin } from './audio';
import { playBigWin } from './audio';
import { playAmbience } from './audio';
import { setMute } from './audio';
import { resumeAudioIfNeeded } from './audio';

// Re-export all audio functions
export {
  initAudio,
  startSpinSound,
  stopSpinSound,
  playWin,
  playBigWin,
  playAmbience,
  setMute,
  resumeAudioIfNeeded,
};
