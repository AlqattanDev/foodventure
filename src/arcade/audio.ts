/** Small, original cooking sounds. Audio is optional and created only on a gesture. */
export type SoundName = 'tap' | 'pour' | 'stir' | 'fold' | 'sizzle' | 'serve' | 'perfect' | 'result' | 'miss';

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let muted = false;
const sources = new Set<AudioScheduledSourceNode>();
const lastPlayed = new Map<SoundName, number>();
const MAX_VOICES = 20;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || muted) return null;
  if (context && context.state !== 'closed') return context;
  try {
    const Constructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Constructor) return null;
    context = new Constructor();
    master = context.createGain();
    master.gain.value = 0.36;
    master.connect(context.destination);
    noiseBuffer = null;
    return context;
  } catch {
    context = null;
    master = null;
    return null;
  }
}

export function unlockAudio(): void {
  const audio = getContext();
  if (!audio || audio.state === 'running') return;
  try { void audio.resume().catch(() => undefined); } catch { /* Sound never blocks play. */ }
}

export function stopAudio(): void {
  for (const source of sources) {
    try { source.stop(); } catch { /* It may already have ended. */ }
    try { source.disconnect(); } catch { /* A failed audio device is harmless. */ }
  }
  sources.clear();
}

export function setMuted(value: boolean): void {
  muted = value;
  if (muted) stopAudio();
  if (context && master) {
    try { master.gain.setTargetAtTime(muted ? 0 : 0.36, context.currentTime, 0.015); } catch { /* Optional audio. */ }
  }
}

function retain(source: AudioScheduledSourceNode, attached: AudioNode[]): void {
  sources.add(source);
  source.onended = () => {
    sources.delete(source);
    for (const node of [source, ...attached]) {
      try { node.disconnect(); } catch { /* Already disconnected. */ }
    }
  };
}

function tone(audio: AudioContext, frequency: number, duration: number, delay = 0, volume = 0.18, endFrequency = frequency, type: OscillatorType = 'sine'): void {
  if (!master || sources.size >= MAX_VOICES) return;
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(master);
  retain(oscillator, [envelope]);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(audio: AudioContext, duration: number, cutoff: number, volume: number, type: BiquadFilterType = 'lowpass'): void {
  if (!master || sources.size >= MAX_VOICES) return;
  if (!noiseBuffer) {
    noiseBuffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.45), audio.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
  }
  const start = audio.currentTime;
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const envelope = audio.createGain();
  source.buffer = noiseBuffer;
  filter.type = type;
  filter.frequency.value = cutoff;
  filter.Q.value = 0.6;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  retain(source, [filter, envelope]);
  source.start(start);
  source.stop(start + duration + 0.02);
}

export function playSound(name: SoundName): void {
  if (muted) return;
  const now = typeof performance === 'undefined' ? Date.now() : performance.now();
  const spacing = name === 'result' ? 400 : name === 'stir' || name === 'pour' ? 160 : 50;
  if (now - (lastPlayed.get(name) ?? -Infinity) < spacing) return;
  const audio = getContext();
  if (!audio) return;
  lastPlayed.set(name, now);
  unlockAudio();
  try {
    switch (name) {
      case 'tap': tone(audio, 740, 0.085, 0, 0.15, 980, 'triangle'); break;
      case 'pour':
        noise(audio, 0.25, 1_250, 0.19);
        tone(audio, 320, 0.13, 0, 0.035, 250);
        break;
      case 'stir':
        noise(audio, 0.19, 750, 0.15);
        tone(audio, 170, 0.09, 0, 0.06, 135);
        break;
      case 'fold':
        noise(audio, 0.11, 2_500, 0.13, 'bandpass');
        tone(audio, 480, 0.07, 0.04, 0.09, 650, 'triangle');
        break;
      case 'sizzle': noise(audio, 0.38, 1_850, 0.28, 'highpass'); break;
      case 'serve':
        [523.25, 659.25, 783.99].forEach((frequency, index) => tone(audio, frequency, 0.17, index * 0.065, 0.15, frequency, 'triangle'));
        break;
      case 'perfect':
        tone(audio, 880, 0.16, 0, 0.13, 880, 'triangle');
        tone(audio, 1_174.66, 0.2, 0.075, 0.11);
        break;
      case 'result':
        [523.25, 659.25, 783.99, 1_046.5].forEach((frequency, index) => tone(audio, frequency, 0.28, index * 0.095, 0.15, frequency, 'triangle'));
        break;
      case 'miss': tone(audio, 330, 0.16, 0, 0.07, 247, 'triangle'); break;
    }
  } catch {
    // Browsers and devices may deny, suspend, or lose audio without affecting a run.
  }
}
