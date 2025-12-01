
// ... (previous imports and setup)

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambienceOsc: OscillatorNode | null = null;
let ambienceGain: GainNode | null = null;
let ambienceLFO: OscillatorNode | null = null;

const createNoiseBuffer = () => {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 2; 
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

let noiseBuffer: AudioBuffer | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; 
    masterGain.connect(audioCtx.destination);
    noiseBuffer = createNoiseBuffer();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

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
    } catch(e) {}
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
  
  if (phase === 'Calm') { freq = 60; type = 'sine'; lfoRate = 0.2; }
  if (phase === 'Surge') { freq = 110; type = 'triangle'; lfoRate = 2.0; }
  if (phase === 'Quantum') { freq = 40; type = 'sawtooth'; lfoRate = 8.0; }

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

export const playSpinSound = () => {
  if (!audioCtx || !masterGain) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 1.2);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 1.2);
  
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(now + 1.2);

  if (noiseBuffer) {
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    const noiseFilter = audioCtx.createBiquadFilter();
    
    noise.buffer = noiseBuffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.linearRampToValueAtTime(100, now + 0.5);

    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
  }
};

export const playReelStop = () => {
  if (!audioCtx || !masterGain) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(now + 0.15);

  if (noiseBuffer) {
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    const noiseFilter = audioCtx.createBiquadFilter();
    
    noise.buffer = noiseBuffer;
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000;
    
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
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
    
    const startTime = now + (i * 0.08);
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

  // Play a fanfare
  const melody = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
  
  melody.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    
    const time = now + (i * 0.15);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.15);
  });
};
