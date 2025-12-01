// Audio context and nodes
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
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
export const initAudio = () => {
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
};

// Load the spinning wheel sound
export const loadSpinWheelSound = async () => {
  if (!audioCtx) return;
  
  try {
    const response = await fetch('/SpinningWheel.wav');
    const arrayBuffer = await response.arrayBuffer();
    if (audioCtx) { // Check again in case audioCtx was closed
      spinWheelBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      isSpinWheelLoaded = true;
    }
  } catch (error) {
    console.error('Error loading spinning wheel sound:', error);
    isSpinWheelLoaded = false;
  }
  return isSpinWheelLoaded;
};

// Ensure audio context is initialized when needed
const ensureAudioInitialized = () => {
  if (!audioCtx) {
    initAudio();
  }
  return !!audioCtx;
};

// Initialize audio system when the first sound needs to play
export const initAudioSystem = () => {
  if (typeof window === 'undefined') return;
  
  if (!audioCtx) {
    initAudio();
    loadSpinWheelSound().catch(console.error);
  }
};

// Initialize on window load
if (typeof window !== 'undefined') {
  window.addEventListener('load', initAudioSystem);
}

// Extra references for new spin chain
let spinPanLFO: OscillatorNode | null = null;
let spinPanLFOGain: GainNode | null = null;
let spinMainPanner: StereoPannerNode | null = null;
let spinMasterFilter: BiquadFilterNode | null = null;

const createNoiseBuffer = () => {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 2;
  // Stereo noise for width
  const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  for (let i = 0; i < bufferSize; i++) {
    left[i] = Math.random() * 2 - 1;
    right[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

let noiseBuffer: AudioBuffer | null = null;

// Initialize noise buffer when audio context is created
if (typeof window !== 'undefined') {
  const init = () => {
    if (audioCtx) {
      noiseBuffer = createNoiseBuffer();
    }
  };
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
}

export const setMute = (muted: boolean) => {
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.3, audioCtx.currentTime, 0.1);
  }
};

export const playAmbience = (phase: 'Calm' | 'Surge' | 'Quantum') => {
  if (!audioCtx || !masterGain) initAudio();
  if (!audioCtx) return;

  if (ambienceOsc) {
    try {
      ambienceOsc.stop();
      ambienceLFO?.stop();
    } catch (e) {}
    ambienceOsc = null;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();

  let freq = 50;
  let type: OscillatorType = 'sine';
  let lfoRate = 0.1;

  if (phase === 'Calm') {
    freq = 60;
    type = 'sine';
    lfoRate = 0.2;
  }
  if (phase === 'Surge') {
    freq = 110;
    type = 'triangle';
    lfoRate = 2.0;
  }
  if (phase === 'Quantum') {
    freq = 40;
    type = 'sawtooth';
    lfoRate = 8.0;
  }

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  lfo.frequency.value = lfoRate;
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, audioCtx.currentTime);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain!);

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2);

  osc.start();
  ambienceOsc = osc;
  ambienceGain = gain;
  ambienceLFO = lfo;
};

const startSpinTicks = () => {
  if (!audioCtx || !masterGain) return;

  const baseInterval = 80; // ms between ticks (adjust to match reel speed)

  const scheduleTick = () => {
    if (!audioCtx || !masterGain) return;

    const now = audioCtx.currentTime;
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    const clickFilter = audioCtx.createBiquadFilter();

    clickOsc.type = 'square';
    clickOsc.frequency.value = 800; // click-ish
    clickGain.gain.setValueAtTime(0.0, now);
    clickGain.gain.linearRampToValueAtTime(0.18, now + 0.005);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 500;

    clickOsc.connect(clickFilter).connect(clickGain).connect(masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.06);

    // Slight randomization to feel organic
    const nextInterval = baseInterval + (Math.random() - 0.5) * 20;
    spinTickInterval = setTimeout(scheduleTick, Math.max(40, nextInterval));
  };

  scheduleTick();
};

// Modern, layered, stereo spin sound
export const startSpinSound = () => {
  // Ensure audio is initialized
  if (!ensureAudioInitialized() || !masterGain || !audioCtx) return;
  
  const now = audioCtx.currentTime;
  
  // Stop any existing spin sound first
  stopSpinSound();

  // Try to use the loaded spinning wheel sound if available
  if (isSpinWheelLoaded && spinWheelBuffer) {
    try {
      // Create buffer source for the spinning wheel sound
      const spinSource = audioCtx.createBufferSource();
      spinSource.buffer = spinWheelBuffer;
      spinSource.loop = true;
      
      // Create gain node for volume control
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.6; // Adjust volume as needed
      
      // Connect and start playing
      spinSource.connect(gainNode).connect(masterGain);
      spinSource.start(0);
      
      // Store references for cleanup
      spinNoise = spinSource;
      spinGain = gainNode;
      return; // Exit early since we're using the pre-recorded sound
    } catch (error) {
      console.error('Error playing spinning wheel sound, falling back to generated sound', error);
      // Fall through to generated sound if there's an error
    }
  }

  // Fallback to generated sound if pre-recorded sound isn't available
  const noiseSrc = audioCtx.createBufferSource();
  const noiseFilter = audioCtx.createBiquadFilter();
  const noiseGain = audioCtx.createGain();

  if (noiseBuffer) {
    noiseSrc.buffer = noiseBuffer;
  }
  noiseSrc.loop = true;

  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1200, now);
  noiseFilter.Q.value = 2;

  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
  noiseFilter.frequency.linearRampToValueAtTime(1800, now + 0.3);
  noiseFilter.frequency.linearRampToValueAtTime(900, now + 2.0);

  const stereoPanner = audioCtx.createStereoPanner();
  stereoPanner.pan.value = 0;

  noiseSrc.connect(noiseFilter).connect(noiseGain).connect(stereoPanner).connect(masterGain);
  noiseSrc.start(now);
  
  spinNoise = noiseSrc;
  spinFilter = noiseFilter;
  spinGain = noiseGain;
  spinMainPanner = stereoPanner;
  
  startSpinTicks();
};


export const stopSpinSound = () => {
  if (!audioCtx) return;
  
  const currentTime = audioCtx.currentTime;

  // Clear any pending timers
  if (spinVariationTimer) {
    clearTimeout(spinVariationTimer);
    spinVariationTimer = null;
  }
  if (spinTickInterval) {
    clearTimeout(spinTickInterval);
    spinTickInterval = null;
  }

  const now = audioCtx.currentTime;
  const fadeOutTime = 0.2; // seconds for fade out

  // Smooth fade out if gain node exists
  if (spinGain) {
    try {
      spinGain.gain.cancelScheduledValues(currentTime);
      spinGain.gain.setValueAtTime(spinGain.gain.value, currentTime);
      spinGain.gain.linearRampToValueAtTime(0, currentTime + fadeOutTime);
    } catch (e) {
      console.warn('Error fading out spin sound:', e);
    }
  }

  // Schedule cleanup after fade out
  setTimeout(() => {
    // Stop and clean up all audio nodes
    const cleanupNode = (node: any) => {
      if (!node) return;
      try {
        if (typeof node.stop === 'function') {
          node.stop();
        }
        if (typeof node.disconnect === 'function') {
          node.disconnect();
        }
      } catch (e) {
        console.warn('Error cleaning up audio node:', e);
      }
    };

    // Clean up oscillators
    spinOscillators.forEach(osc => cleanupNode(osc));
    spinOscillators = [];

    // Clean up other nodes
    [
      spinGain,
      spinFilter,
      spinNoise,
      spinPanLFO,
      spinPanLFOGain,
      spinMainPanner,
      spinMasterFilter
    ].forEach(node => cleanupNode(node));

    // Reset all references
    spinGain = null;
    spinFilter = null;
    spinNoise = null;
    spinPanLFO = null;
    spinPanLFOGain = null;
    spinMainPanner = null;
    spinMasterFilter = null;
  }, fadeOutTime * 1000 + 50); // Add small buffer
};

export const playReelStop = (isLastReel = false) => {
  if (!audioCtx || !masterGain) {
    console.warn('Audio context not initialized');
    return;
  }

  const now = audioCtx.currentTime;

  // Stop any spinning sound
  stopSpinSound();

  try {
    // Mechanical "clunk"
    if (noiseBuffer) {
      const noise = audioCtx.createBufferSource();
      const noiseGain = audioCtx.createGain();
      const noiseFilter = audioCtx.createBiquadFilter();

      noise.buffer = noiseBuffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 300;
      noiseFilter.Q.value = 5.0;

      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start();
      noise.stop(now + 0.3);
    }

    // Tonal element
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (isLastReel) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.stop(now + 0.4);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.stop(now + 0.2);
    }

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();

    // Subtle reverb for last reel
    if (isLastReel && audioCtx) {
      try {
        const convolver = audioCtx.createConvolver();
        const reverbGain = audioCtx.createGain();
        reverbGain.gain.value = 0.1;

        const impulse = audioCtx.createBuffer(
          2,
          audioCtx.sampleRate * 2,
          audioCtx.sampleRate
        );
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < impulse.length; i++) {
          const n = 1 - i / impulse.length;
          left[i] = (Math.random() * 2 - 1) * Math.pow(n, 3);
          right[i] = (Math.random() * 2 - 1) * Math.pow(n, 3);
        }

        convolver.buffer = impulse;
        gain.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(masterGain);
      } catch (e) {
        console.warn('Error creating reverb effect:', e);
        gain.connect(masterGain);
      }
    }
  } catch (e) {
    console.error('Error in playReelStop:', e);
  }
};

export const playWin = (amount: number) => {
  if (!audioCtx || !masterGain) return;
  const now = audioCtx.currentTime;
  const masterWinGain = audioCtx.createGain();
  masterWinGain.gain.value = 0.3;
  masterWinGain.connect(masterGain);

  const baseFreq = 523.25;
  const intervals = [1, 1.12, 1.25, 1.5, 1.67, 2.0];

  const noteCount = Math.min(10, Math.floor(amount / 5) + 3);

  for (let i = 0; i < noteCount; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    const ratio = intervals[Math.floor(Math.random() * intervals.length)];
    const freq = baseFreq * ratio * (i % 2 === 0 ? 1 : 2);
    osc.frequency.value = freq;

    const startTime = now + i * 0.08;
    const duration = 0.1;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterWinGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }
};

export const playBigWin = (amount: number) => {
  if (!audioCtx || !masterGain) return;
  const now = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.4;
  gain.connect(masterGain);

  const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];

  melody.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    const time = now + i * 0.15;
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.15);
  });
};
