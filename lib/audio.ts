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
let bigWinBuffer: AudioBuffer | null = null;
let isBigWinLoaded = false;


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
    loadBigWinSound().catch(console.error); // NEW
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

export const loadBigWinSound = async () => {
  if (!audioCtx) {
    console.warn('loadBigWinSound: no audioCtx yet');
    return;
  }

  try {
    //console.log('Loading BigWinSFX.wav...');
    const response = await fetch('/BigWinSFX.wav');
    //console.log('BigWinSFX response status:', response.status);
    const arrayBuffer = await response.arrayBuffer();
    if (audioCtx) {
      bigWinBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      isBigWinLoaded = true;
      //console.log('BigWinSFX decoded and ready');
    }
  } catch (error) {
    console.error('Error loading big win sound:', error);
    isBigWinLoaded = false;
  }
  return isBigWinLoaded;
};

export const resumeAudioIfNeeded = async () => {
  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
      //console.log('AudioContext resumed');
    } catch (e) {
      console.warn('Error resuming AudioContext:', e);
    }
  }
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


// Stop the spinning sound effect
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
  }, fadeOutTime * 1000);
};

export const playReelStop = (isLastReel = false) => {
  if (!audioCtx || !masterGain) {
    console.warn('Audio context or master gain not initialized');
    return;
  }
  
  try {
    const now = audioCtx.currentTime;
    
    // Noise burst for impact
    if (Math.random() > 0.3) {
      const noise = audioCtx.createBufferSource();
      const noiseGain = audioCtx.createGain();
      const noiseFilter = audioCtx.createBiquadFilter();
      
      noise.buffer = noiseBuffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1000;
      noiseFilter.Q.value = 0.7;
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start();
      noise.stop(now + 0.3);
    }
    
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

    // Ensure gain is connected before starting oscillator
    gain.connect(masterGain);
    osc.connect(gain);

    // Set initial values
    if (isLastReel) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    }

    // Start the oscillator
    osc.start(now);
    
    // Schedule stop
    const stopTime = now + (isLastReel ? 0.4 : 0.2);
    osc.stop(stopTime);
    
    // Clean up after sound completes
    const cleanup = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {
        console.warn('Error cleaning up audio nodes:', e);
      }
    };
    
    // Schedule cleanup after sound completes
    const cleanupTime = (stopTime - now) * 1000 + 100; // Add small buffer
    setTimeout(cleanup, cleanupTime);

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
        
        // Disconnect previous connection
        gain.disconnect();
        
        // Connect through reverb
        gain.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(masterGain);
        
        // Clean up reverb nodes after sound completes
        const cleanupReverb = () => {
          try {
            gain.disconnect();
            convolver.disconnect();
            reverbGain.disconnect();
          } catch (e) {
            console.warn('Error cleaning up reverb nodes:', e);
          }
        };
        
        setTimeout(cleanupReverb, 500); // Slightly longer to ensure cleanup after sound
      } catch (e) {
        console.warn('Error creating reverb effect:', e);
        // If reverb fails, ensure we still have a connection
        gain.disconnect();
        gain.connect(masterGain);
      }
    }
  } catch (e) {
    console.error('Error in playReelStop:', e);
  }
};

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
};

export function playBigWin(amount: number) {
  if (!audioCtx || !masterGain) {
    console.warn('playBigWin: no audioCtx/masterGain');
    return;
  }

  //console.log('playBigWin called with amount:', amount, 'isBigWinLoaded:', isBigWinLoaded);

  try {
    const now = audioCtx.currentTime;

    if (isBigWinLoaded && bigWinBuffer) {
      //console.log('Playing BigWinSFX.wav');
      const src = audioCtx.createBufferSource();
      src.buffer = bigWinBuffer;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.9, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.0, now + 6.0);

      src.connect(gain).connect(masterGain!);
      src.start(now);
      src.stop(now + 6.2);

      setTimeout(() => {
        try {
          src.disconnect();
          gain.disconnect();
        } catch (e) {
          console.warn('Error cleaning up big win buffer source:', e);
        }
      }, 6500);

      return;
    }

    //console.log('BigWinSFX not loaded, falling back to synth');

    // Fallback: existing synthesized big win if WAV not available
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.5);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.5);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);

    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      } catch (e) {
        console.warn('Error cleaning up big win audio:', e);
      }
    }, 2000);
  } catch (e) {
    console.error('Error in playBigWin:', e);
  }
}


// Individual exports for all audio functions
