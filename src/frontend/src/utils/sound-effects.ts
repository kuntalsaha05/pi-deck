export type SoundEffectType =
  | "hint"
  | "cell-fill"
  | "solve-complete"
  | "maze-found"
  | "mistake"
  | "new-record";

// Shared AudioContext (lazy-initialized to avoid autoplay policy issues)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface ToneConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  attack: number;
  decay: number;
}

const SOUND_CONFIGS: Record<SoundEffectType, ToneConfig[]> = {
  "cell-fill": [
    {
      frequency: 523,
      duration: 0.08,
      type: "sine",
      attack: 0.005,
      decay: 0.07,
    },
  ],
  hint: [
    { frequency: 659, duration: 0.1, type: "sine", attack: 0.01, decay: 0.08 },
    { frequency: 784, duration: 0.15, type: "sine", attack: 0.01, decay: 0.12 },
  ],
  mistake: [
    {
      frequency: 220,
      duration: 0.15,
      type: "sawtooth",
      attack: 0.005,
      decay: 0.12,
    },
  ],
  "solve-complete": [
    { frequency: 523, duration: 0.1, type: "sine", attack: 0.01, decay: 0.08 },
    { frequency: 659, duration: 0.1, type: "sine", attack: 0.01, decay: 0.08 },
    { frequency: 784, duration: 0.1, type: "sine", attack: 0.01, decay: 0.08 },
    {
      frequency: 1046,
      duration: 0.25,
      type: "sine",
      attack: 0.01,
      decay: 0.22,
    },
  ],
  "maze-found": [
    {
      frequency: 440,
      duration: 0.08,
      type: "triangle",
      attack: 0.005,
      decay: 0.07,
    },
    {
      frequency: 880,
      duration: 0.15,
      type: "triangle",
      attack: 0.005,
      decay: 0.12,
    },
  ],
  "new-record": [
    { frequency: 698, duration: 0.1, type: "sine", attack: 0.01, decay: 0.08 },
    { frequency: 880, duration: 0.1, type: "sine", attack: 0.01, decay: 0.08 },
    { frequency: 1047, duration: 0.1, type: "sine", attack: 0.01, decay: 0.08 },
    { frequency: 1397, duration: 0.3, type: "sine", attack: 0.01, decay: 0.25 },
  ],
};

function playTone(
  ctx: AudioContext,
  config: ToneConfig,
  startTime: number,
  volume: number,
): void {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + config.attack);
  gain.gain.linearRampToValueAtTime(0, startTime + config.duration);

  const osc = ctx.createOscillator();
  osc.type = config.type;
  osc.frequency.setValueAtTime(config.frequency, startTime);
  osc.connect(gain);
  osc.start(startTime);
  osc.stop(startTime + config.duration + 0.01);
}

export function playSound(
  type: SoundEffectType,
  volume: number,
  soundEnabled = true,
): void {
  if (!soundEnabled || volume === 0 || prefersReducedMotion()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (needed on some browsers after user interaction)
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => null);
  }

  const configs = SOUND_CONFIGS[type];
  const normalizedVolume = Math.max(0, Math.min(100, volume)) / 100;
  let offset = 0;

  for (const config of configs) {
    playTone(ctx, config, ctx.currentTime + offset, normalizedVolume);
    offset += config.duration * 0.7; // Slight overlap for musical feel
  }
}
