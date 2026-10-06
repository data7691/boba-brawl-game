import { SoundSynthesizer, type SoundCue } from "../utils/SoundSynthesizer";

/**
 * Browser sound coordinator. Call unlock() synchronously from a user gesture
 * (e.g. Play/Start button's click handler) before awaiting other work.
 */
export class AudioManager {
  private context: AudioContext | null = null;
  private synth: SoundSynthesizer | null = null;
  private muted = false;
  private volume = 0.45;

  async unlock(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const webkitWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor = window.AudioContext || webkitWindow.webkitAudioContext;
    if (!AudioContextConstructor) return false;

    try {
      if (!this.context || this.context.state === "closed") {
        // Construction and resume happen inside the caller's gesture. This is
        // required by Safari/iOS and mobile Chrome autoplay policies.
        this.context = new AudioContextConstructor();
        this.synth = new SoundSynthesizer(this.context);
        this.synth.setVolume(this.muted ? 0 : this.volume);
      }
      const resume = this.context.resume();
      // A silent buffer kick helps older iOS Safari unlock its output route.
      const silent = this.context.createBufferSource();
      silent.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
      silent.connect(this.context.destination);
      silent.start(0);
      silent.onended = () => silent.disconnect();
      await resume;
      return this.context.state === "running";
    } catch {
      return false;
    }
  }

  play(cue: SoundCue): void {
    if (this.muted || !this.synth || !this.context) return;
    if (this.context.state === "suspended") {
      // A browser may suspend audio when the page goes into the background.
      // Fire-and-forget is intentional; play the cue after successful resume.
      void this.context.resume().then(() => this.synth?.play(cue)).catch(() => {});
      return;
    }
    this.synth.play(cue);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.synth?.setVolume(muted ? 0 : this.volume);
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.synth?.setVolume(this.muted ? 0 : this.volume);
  }

  async dispose(): Promise<void> {
    const context = this.context;
    this.context = null;
    this.synth = null;
    if (context && context.state !== "closed") await context.close();
  }
}

export const audioManager = new AudioManager();
export type { SoundCue };
