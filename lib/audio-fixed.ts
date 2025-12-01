// Audio context and nodes
export let audioCtx: AudioContext | null = null;
export let masterGain: GainNode | null = null;
let ambienceOsc: OscillatorNode | null = null;
let ambienceGain: GainNode | null = null;
let ambienceLFO: OscillatorNode | null = null;
let spinOscillators: OscillatorNode[] = [];
let spinGain: GainNode | null = null;
let spinFilter: BiquadFilterNode | null = null;
let spinVariationTimer: NodeJS.Timeout | null = null;
let spinNoise: AudioBufferSourceNode | null = null;
let spinTickInterval: NodeJS.Timeout | null = null;
let spinWheelBuffer: AudioBuffer | null = null;
let isSpinWheelLoaded = false;

// Initialize audio context
export function initAudio() {
  if (typeof window === 'undefined' || audioCtx) return false;
  
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
    return true;
  } catch (error) {
    console.error('Error initializing audio context:', error);
    return false;
  }
}

// Load the spinning wheel sound
async function loadSpinWheelSound() {
  if (!audioCtx) return;
  
  try {
    const response = await fetch('/SpinningWheel.wav');
    const arrayBuffer = await response.arrayBuffer();
    spinWheelBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    isSpinWheelLoaded = true;
  } catch (error) {
    console.error('Error loading spin wheel sound:', error);
    isSpinWheelLoaded = false;
  }
}

// Ensure audio context is initialized when needed
function ensureAudioInitialized() {
  if (!audioCtx) {
    initAudio();
  }
  return !!audioCtx;
}

// Initialize audio system when the first sound needs to play
function initAudioSystem() {
  if (ensureAudioInitialized()) {
    loadSpinWheelSound();
  }
}

// Initialize on window load
if (typeof window !== 'undefined') {
  window.addEventListener('load', initAudioSystem);
}

// Create noise buffer for spin sound
async function createNoiseBuffer() {
  if (!audioCtx) return null;
  
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // Generate noise
  }
  
  return buffer;
}

let noiseBuffer: AudioBuffer | null = null;

// Initialize noise buffer when audio context is created
if (typeof window !== 'undefined') {
  const init = async () => {
    if (audioCtx) {
      noiseBuffer = await createNoiseBuffer();
    }
  };
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
}

// Set mute state
export function setMute(muted: boolean) {
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 0.3;
  }
}

// Play ambient sound
export function playAmbience(phase: 'Calm' | 'Surge' | 'Quantum') {
  if (!audioCtx || !masterGain) return;
  
  // Stop any existing ambience
  if (ambienceOsc) {
    ambienceOsc.stop();
    ambienceOsc = null;
  }
  
  if (ambienceGain) {
    ambienceGain.disconnect();
    ambienceGain = null;
  }
  
  if (ambienceLFO) {
    ambienceLFO.stop();
    ambienceLFO = null;
  }
  
  // Create new ambience
  ambienceOsc = audioCtx.createOscillator();
  ambienceGain = audioCtx.createGain();
  ambienceLFO = audioCtx.createOscillator();
  
  const lfoGain = audioCtx.createGain();
  
  // Configure based on phase
  switch (phase) {
    case 'Calm':
      ambienceOsc.frequency.value = 220;
      ambienceGain.gain.value = 0.1;
      break;
    case 'Surge':
      ambienceOsc.frequency.value = 330;
      ambienceGain.gain.value = 0.15;
      break;
    case 'Quantum':
      ambienceOsc.frequency.value = 440;
      ambienceGain.gain.value = 0.2;
      break;
  }
  
  // Configure LFO for subtle movement
  ambienceLFO.frequency.value = 0.1;
  lfoGain.gain.value = 0.1;
  
  // Connect nodes
  ambienceLFO.connect(lfoGain);
  lfoGain.connect(ambienceOsc.frequency);
  ambienceOsc.connect(ambienceGain);
  ambienceGain.connect(masterGain);
  
  // Start oscillators
  ambienceOsc.start();
  ambienceLFO.start();
}

// Start spin ticks for mechanical sound
export function startSpinTicks() {
  if (!audioCtx || !masterGain) return;
  
  // Clear any existing interval
  if (spinTickInterval) {
    clearInterval(spinTickInterval);
  }
  
  // Create tick sound
  const tick = () => {
    if (!audioCtx || !masterGain) return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  };
  
  // Start ticking
  tick();
  spinTickInterval = setInterval(tick, 100);
}

// Modern, layered, stereo spin sound
export function startSpinSound() {
  if (!audioCtx || !masterGain) return;
  
  // Stop any existing spin sound
  stopSpinSound();
  
  // Create noise source
  const noiseSrc = audioCtx.createBufferSource();
  const noiseFilter = audioCtx.createBiquadFilter();
  const noiseGain = audioCtx.createGain();
  
  if (noiseBuffer) {
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;
  }
  
  // Configure noise
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 1.0;
  noiseGain.gain.value = 0.1;
  
  // Create stereo panner for width
  const stereoPanner = audioCtx.createStereoPanner();
  stereoPanner.pan.value = 0;
  
  // Create LFO for panning
  const panLFO = audioCtx.createOscillator();
  const panLFOGain = audioCtx.createGain();
  panLFO.frequency.value = 0.5;
  panLFOGain.gain.value = 0.8;
  
  // Connect nodes
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(stereoPanner);
  panLFO.connect(panLFOGain);
  panLFOGain.connect(stereoPanner.pan);
  stereoPanner.connect(masterGain);
  
  // Start sound
  noiseSrc.start();
  panLFO.start();
  
  // Store references for cleanup
  spinNoise = noiseSrc;
  spinFilter = noiseFilter;
  spinGain = noiseGain;
  spinPanLFO = panLFO;
  spinPanLFOGain = panLFOGain;
  spinMainPanner = stereoPanner;
  
  // Start spin ticks
  startSpinTicks();
}

// Stop the spinning sound effect
export function stopSpinSound() {
  if (!audioCtx) return;
  
  const currentTime = audioCtx.currentTime;
  
  // Clear any pending timers
  if (spinVariationTimer) {
    clearTimeout(spinVariationTimer);
    spinVariationTimer = null;
  }
  
  // Clear tick interval
  if (spinTickInterval) {
    clearInterval(spinTickInterval);
    spinTickInterval = null;
  }
  
  // Stop and clean up oscillators
  spinOscillators.forEach(osc => {
    try {
      if (osc) {
        osc.stop();
        osc.disconnect();
      }
    } catch (e) {
      console.warn('Error cleaning up oscillator:', e);
    }
  });
  
  spinOscillators = [];
  
  // Clean up noise
  if (spinNoise) {
    try {
      spinNoise.stop();
      spinNoise.disconnect();
    } catch (e) {
      console.warn('Error stopping spin noise:', e);
    }
    spinNoise = null;
  }
  
  // Clean up other nodes
  [
    spinGain,
    spinFilter,
    spinPanLFO,
    spinPanLFOGain,
    spinMainPanner,
    spinMasterFilter
  ].forEach(node => {
    if (node) {
      try {
        node.disconnect();
      } catch (e) {
        console.warn('Error cleaning up node:', e);
      }
    }
  });
  
  // Reset all references
  spinGain = null;
  spinFilter = null;
  spinNoise = null;
  spinPanLFO = null;
  spinPanLFOGain = null;
  spinMainPanner = null;
  spinMasterFilter = null;
}

// Play sound when a reel stops
export function playReelStop(isLastReel = false) {
  if (!audioCtx || !masterGain) {
    console.warn('Audio context or master gain not initialized');
    return;
  }
  
  try {
    const now = audioCtx.currentTime;
    
    // Noise burst for impact
    if (noiseBuffer) {
      const noise = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      
      noise.buffer = noiseBuffer;
      noise.loop = false;
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      noise.connect(gain);
      gain.connect(masterGain);
      
      noise.start(now);
      noise.stop(now + 0.2);
    }
    
    // Tonal element
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isLastReel ? 880 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(isLastReel ? 440 : 220, now + 0.2);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.3);
    
  } catch (e) {
    console.error('Error in playReelStop:', e);
  }
}

// Play win sound
export function playWin(amount: number) {
  if (!audioCtx || !masterGain) return;
  
  try {
    const now = audioCtx.currentTime;
    const isBigWin = amount >= 50; // Example threshold for big win
    
    // Play different sounds based on win amount
    if (isBigWin) {
      playBigWin(amount);
      return;
    }
    
    // Regular win sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.5);
    
    // Clean up
    const cleanup = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {
        console.warn('Error cleaning up win audio:', e);
      }
    };
    
    setTimeout(cleanup, 1000);
    
  } catch (e) {
    console.error('Error in playWin:', e);
  }
}

// Play big win sound
export function playBigWin(amount: number) {
  if (!audioCtx || !masterGain) return;
  
  try {
    const now = audioCtx.currentTime;
    
    // Create multiple oscillators for a richer sound
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // First oscillator - main tone
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.5);
    
    // Second oscillator - octave higher
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.5);
    
    // Gain envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    // Connect and start
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);
    
    osc1.start(now);
    osc2.start(now);
    
    // Schedule stop
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
    
    // Clean up
    const cleanup = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      } catch (e) {
        console.warn('Error cleaning up big win audio:', e);
      }
    };
    
    setTimeout(cleanup, 2000);
    
  } catch (e) {
    console.error('Error in playBigWin:', e);
  }
}

// Export all functions
export default {
  initAudio,
  startSpinSound,
  stopSpinSound,
  playWin,
  playBigWin,
  playAmbience,
  setMute,
  playReelStop
};
