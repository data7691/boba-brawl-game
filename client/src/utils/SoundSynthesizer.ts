/** Short, original game cues generated with Web Audio; no downloaded sound files. */
export type SoundCue =
  | "ui"
  | "switch"
  | "pickup"
  | "shoot"
  | "hit"
  | "hurt"
  | "craft"
  | "magic_beam"
  | "magic_burst"
  | "magic_wave"
  | "defense_shield"
  | "defense_dodge"
  | "win"
  | "lose";

type Wave = OscillatorType;

export class SoundSynthesizer {
  private volume = 0.45;
  private readonly noise: AudioBuffer;

  constructor(private readonly context: AudioContext) {
    // Reuse a short noise buffer for impact transients instead of allocating
    // on every projectile hit.
    const size = Math.ceil(context.sampleRate * 0.45);
    this.noise = context.createBuffer(1, size, context.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < size; i += 1) {
      samples[i] = Math.random() * 2 - 1;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  play(cue: SoundCue): void {
    if (this.context.state !== "running" || this.volume === 0) return;
    const now = this.context.currentTime + 0.005;
    switch (cue) {
      case "ui":
        this.tone(620, 830, 0.085, now, "sine", 0.16);
        break;
      case "switch":
        this.tone(420, 760, 0.1, now, "triangle", 0.18);
        this.tone(760, 920, 0.08, now + 0.065, "sine", 0.12);
        break;
      case "pickup":
        this.tone(520, 760, 0.11, now, "sine", 0.19);
        this.tone(790, 1050, 0.15, now + 0.09, "sine", 0.16);
        break;
      case "shoot":
        this.tone(520, 185, 0.17, now, "triangle", 0.26);
        this.noiseBurst(now, 0.075, 950, 0.07);
        break;
      case "hit":
        this.noiseBurst(now, 0.14, 650, 0.25);
        this.tone(180, 75, 0.2, now, "triangle", 0.2);
        break;
      case "hurt":
        this.noiseBurst(now, 0.2, 340, 0.23);
        this.tone(280, 100, 0.28, now, "sawtooth", 0.12);
        break;
      case "craft":
        // A bubbling pour followed by a bright completion chime.
        this.noiseBurst(now, 0.38, 480, 0.08);
        this.tone(280, 420, 0.12, now + 0.04, "sine", 0.15);
        this.tone(350, 530, 0.12, now + 0.17, "sine", 0.14);
        this.tone(523, 790, 0.32, now + 0.3, "sine", 0.2);
        this.tone(784, 1180, 0.3, now + 0.39, "sine", 0.12);
        break;
      case "magic_beam":
        this.tone(420, 1150, 0.42, now, "sine", 0.19);
        this.tone(1080, 580, 0.2, now + 0.42, "sawtooth", 0.14);
        break;
      case "magic_burst":
        this.tone(240, 680, 0.34, now, "triangle", 0.18);
        this.noiseBurst(now + 0.34, 0.28, 1300, 0.19);
        break;
      case "magic_wave":
        this.tone(170, 390, 0.38, now, "sine", 0.2);
        this.noiseBurst(now + 0.2, 0.4, 600, 0.13);
        break;
      case "defense_shield":
        this.tone(310, 620, 0.24, now, "triangle", 0.17);
        this.tone(660, 480, 0.28, now + 0.06, "sine", 0.12);
        break;
      case "defense_dodge":
        this.noiseBurst(now, 0.16, 1800, 0.14);
        this.tone(780, 290, 0.2, now, "sine", 0.12);
        break;
      case "win":
        [523, 659, 784, 1047].forEach((frequency, index) => {
          this.tone(frequency, frequency * 1.015, index === 3 ? 0.48 : 0.19,
            now + index * 0.13, "triangle", index === 3 ? 0.2 : 0.15);
        });
        break;
      case "lose":
        [392, 311, 233].forEach((frequency, index) => {
          this.tone(frequency, frequency * 0.88, index === 2 ? 0.42 : 0.23,
            now + index * 0.19, "triangle", 0.17);
        });
        break;
    }
  }

  private tone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    at: number,
    wave: Wave,
    level: number,
  ): void {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const end = at + duration;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(startFrequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), end);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, level * this.volume), at + Math.min(0.018, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(this.context.destination);
    oscillator.start(at);
    oscillator.stop(end + 0.015);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  private noiseBurst(at: number, duration: number, cutoff: number, level: number): void {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noise;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.55), at + duration);
    envelope.gain.setValueAtTime(Math.max(0.0002, level * this.volume), at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.context.destination);
    source.start(at);
    source.stop(at + duration + 0.01);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
  }
}
