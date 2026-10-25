/**
 * Game Boy Color (DMG/CGB) 4-Channel Programmable Sound Generator (APU) Synthesizer.
 *
 * Emulates the classic 4 hardware sound channels using Web Audio API:
 * - Channel 1 (Pulse 1): Square/Pulse wave with hardware frequency sweep & volume envelope
 * - Channel 2 (Pulse 2): Square/Pulse wave for harmony & counter-melodies
 * - Channel 3 (Wave): 4-bit custom wave / quantized triangle bassline channel
 * - Channel 4 (Noise): 15-bit / 7-bit Linear Feedback Shift Register (LFSR) percussion channel
 */

export interface ChiptuneStep {
  /** Channel 1 (Pulse 1 lead) frequency in Hz, or 0/null for rest */
  pulse1?: number | null;
  /** Optional frequency sweep target in Hz for Channel 1 */
  pulse1SweepTo?: number;
  /** Channel 2 (Pulse 2 harmony) frequency in Hz, or 0/null for rest */
  pulse2?: number | null;
  /** Channel 3 (4-bit Wave bass) frequency in Hz, or 0/null for rest */
  wave?: number | null;
  /** Channel 4 (LFSR Noise percussion): 'KICK' | 'SNARE' | 'HAT' | 'CRASH' | null */
  noise?: 'KICK' | 'SNARE' | 'HAT' | 'CRASH' | null;
}

export interface ChiptunePattern {
  id: string;
  bpm: number;
  steps: ChiptuneStep[];
}

// Standard musical note frequencies (Hz) for Game Boy octaves 2-6
const NOTE: Record<string, number> = {
  C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

const CHIPTUNE_PATTERNS: Record<string, ChiptunePattern> = {
  bgm_new_bark_town: {
    id: 'bgm_new_bark_town',
    bpm: 132,
    steps: [
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.A4, wave: null, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.A3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: null, noise: null },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: null, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: null, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.G3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: null, noise: null },
      { pulse1: NOTE.A4, pulse2: NOTE.Fs4, wave: NOTE.Fs3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: null, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: null, pulse2: NOTE.Cs4, wave: NOTE.A3, noise: null },
      { pulse1: NOTE.A4, pulse2: NOTE.E4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.G4, wave: null, noise: null },
    ],
  },
  bgm_route_29: {
    id: 'bgm_route_29',
    bpm: 148,
    steps: [
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.B3, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.A3, noise: 'SNARE' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'KICK' },
      { pulse1: NOTE.B4, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: null, pulse2: null, wave: NOTE.C3, noise: 'HAT' },
    ],
  },
  bgm_cherrygrove_city: {
    id: 'bgm_cherrygrove_city',
    bpm: 138,
    steps: [
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.C5, pulse2: NOTE.F4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.As2, noise: 'SNARE' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: null, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
    ],
  },
  bgm_violet_city: {
    id: 'bgm_violet_city',
    bpm: 126,
    steps: [
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'KICK' },
      { pulse1: NOTE.B4, pulse2: NOTE.E4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.D3, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.B3, wave: NOTE.E2, noise: null },
    ],
  },
  bgm_sprout_tower: {
    id: 'bgm_sprout_tower',
    bpm: 108,
    steps: [
      { pulse1: NOTE.A4, pulse2: NOTE.E4, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: null, pulse2: null, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.E4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.E4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.A4, pulse2: NOTE.C4, wave: NOTE.A2, noise: null },
    ],
  },
  bgm_goldenrod_city: {
    id: 'bgm_goldenrod_city',
    bpm: 152,
    steps: [
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
    ],
  },
  bgm_ecruteak_city: {
    id: 'bgm_ecruteak_city',
    bpm: 118,
    steps: [
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.A5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.As4, wave: NOTE.G2, noise: null },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.A3, wave: NOTE.A2, noise: null },
    ],
  },
  bgm_national_park: {
    id: 'bgm_national_park',
    bpm: 120,
    steps: [
      { pulse1: NOTE.E5, pulse2: NOTE.Gs4, wave: NOTE.E3, noise: 'KICK' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.Gs5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.B5, pulse2: NOTE.E5, wave: NOTE.Gs3, noise: null },
      { pulse1: NOTE.A5, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Gs5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Gs4, wave: NOTE.B2, noise: null },
    ],
  },
  bgm_gym: {
    id: 'bgm_gym',
    bpm: 144,
    steps: [
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.E4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.C5, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'CRASH' },
    ],
  },
  bgm_elms_lab: {
    id: 'bgm_elms_lab',
    bpm: 140,
    steps: [
      { pulse1: NOTE.A4, pulse2: NOTE.Cs4, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.E4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.Cs5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Gs4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.B4, pulse2: NOTE.E4, wave: NOTE.B2, noise: 'HAT' },
    ],
  },
  bgm_wild_battle: {
    id: 'bgm_wild_battle',
    bpm: 176,
    steps: [
      { pulse1: NOTE.C5, pulse1SweepTo: NOTE.Cs5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.Gs4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.B4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.As4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.A4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.E4, wave: NOTE.G2, noise: 'HAT' },
    ],
  },
  bgm_trainer_battle: {
    id: 'bgm_trainer_battle',
    bpm: 180,
    steps: [
      { pulse1: NOTE.D5, pulse1SweepTo: NOTE.Ds5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.A4, pulse2: NOTE.F4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.Ds5, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.A4, wave: NOTE.E2, noise: 'CRASH' },
    ],
  },
  bgm_gym_leader_battle: {
    id: 'bgm_gym_leader_battle',
    bpm: 188,
    steps: [
      { pulse1: NOTE.E5, pulse1SweepTo: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'CRASH' },
      { pulse1: NOTE.B4, pulse2: NOTE.G4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.Fs5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.B5, pulse2: NOTE.G5, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'CRASH' },
    ],
  },
  bgm_evolution: {
    id: 'bgm_evolution',
    bpm: 160,
    steps: [
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.G4, pulse2: NOTE.E4, wave: NOTE.G2, noise: null },
      { pulse1: NOTE.Cs5, pulse2: NOTE.Gs4, wave: NOTE.Cs3, noise: 'HAT' },
      { pulse1: NOTE.Gs4, pulse2: NOTE.F4, wave: NOTE.Gs2, noise: null },
    ],
  },
  bgm_game_corner: {
    id: 'bgm_game_corner',
    bpm: 164,
    steps: [
      { pulse1: NOTE.F5, pulse2: NOTE.C5, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: NOTE.A4, pulse2: NOTE.F4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.As4, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.G2, noise: 'HAT' },
    ],
  },
};

export class ChiptuneSynthesizer {
  private ctx: AudioContext | null = null;
  private currentTrackId: string | null = null;
  private stepIndex: number = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private playing: boolean = false;
  private muted: boolean = false;
  private volume: number = 0.3;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          return null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getPatternForTrack(trackId: string): ChiptunePattern {
    return CHIPTUNE_PATTERNS[trackId] || CHIPTUNE_PATTERNS.bgm_new_bark_town;
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Starts looping 4-channel Game Boy APU synthesis for the given BGM track.
   */
  public playTrack(trackId: string, volume?: number): void {
    if (volume !== undefined) {
      this.setVolume(volume);
    }
    if (this.playing && this.currentTrackId === trackId) {
      return;
    }

    this.stopTrack();
    this.currentTrackId = trackId;
    this.playing = true;
    this.stepIndex = 0;

    const pattern = this.getPatternForTrack(trackId);
    const stepDurationSec = 60 / pattern.bpm / 2; // 8th-note steps
    const stepMs = Math.max(60, Math.round(stepDurationSec * 1000));

    // Play initial step immediately
    this.triggerStep(pattern.steps[0], stepDurationSec);
    this.stepIndex = 1 % pattern.steps.length;

    this.timerId = setInterval(() => {
      if (!this.playing) return;
      const step = pattern.steps[this.stepIndex % pattern.steps.length];
      this.triggerStep(step, stepDurationSec);
      this.stepIndex = (this.stepIndex + 1) % pattern.steps.length;
    }, stepMs);
  }

  /**
   * Stops the active chiptune sequencer loop cleanly.
   */
  public stopTrack(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.playing = false;
    this.currentTrackId = null;
    this.stepIndex = 0;
  }

  private triggerStep(step: ChiptuneStep, stepDurationSec: number): void {
    if (this.muted || this.volume <= 0) return;

    if (step.pulse1 && step.pulse1 > 0) {
      this.playPulse1Note(
        step.pulse1,
        stepDurationSec * 0.85,
        this.volume * 0.22,
        step.pulse1SweepTo
      );
    }
    if (step.pulse2 && step.pulse2 > 0) {
      this.playPulse2Note(step.pulse2, stepDurationSec * 0.8, this.volume * 0.14);
    }
    if (step.wave && step.wave > 0) {
      this.playWaveNote(step.wave, stepDurationSec * 0.92, this.volume * 0.25);
    }
    if (step.noise) {
      switch (step.noise) {
        case 'KICK':
          this.playLfsrNoise(0.055, 220, true, this.volume * 0.18);
          break;
        case 'SNARE':
          this.playLfsrNoise(0.08, 1200, false, this.volume * 0.16);
          break;
        case 'HAT':
          this.playLfsrNoise(0.03, 4200, false, this.volume * 0.1);
          break;
        case 'CRASH':
          this.playLfsrNoise(0.16, 2400, false, this.volume * 0.18);
          break;
      }
    }
  }

  /**
   * Channel 1 (Pulse 1): Square wave with optional hardware frequency sweep and envelope decay.
   */
  public playPulse1Note(
    freq: number,
    durationSec: number,
    gainLevel: number = 0.08,
    sweepEndFreq?: number
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      if (sweepEndFreq && sweepEndFreq > 0) {
        osc.frequency.exponentialRampToValueAtTime(sweepEndFreq, now + durationSec * 0.7);
      }

      const safeGain = Math.max(0.001, Math.min(0.5, gainLevel));
      gain.gain.setValueAtTime(safeGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore post-disconnect errors
        }
      };

      osc.start(now);
      osc.stop(now + durationSec);
    } catch {
      // Ignore Web Audio errors in headless environments
    }
  }

  /**
   * Channel 2 (Pulse 2): Harmony square/pulse wave channel with envelope.
   */
  public playPulse2Note(freq: number, durationSec: number, gainLevel: number = 0.06): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      const safeGain = Math.max(0.001, Math.min(0.4, gainLevel));
      gain.gain.setValueAtTime(safeGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };

      osc.start(now);
      osc.stop(now + durationSec);
    } catch {
      // Ignore
    }
  }

  /**
   * Channel 3 (Wave): 4-bit custom wave / triangle bassline channel.
   */
  public playWaveNote(freq: number, durationSec: number, gainLevel: number = 0.1): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const safeGain = Math.max(0.001, Math.min(0.5, gainLevel));
      gain.gain.setValueAtTime(safeGain, now);
      gain.gain.setValueAtTime(safeGain * 0.75, now + durationSec * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };

      osc.start(now);
      osc.stop(now + durationSec);
    } catch {
      // Ignore
    }
  }

  /**
   * Channel 4 (Noise): 15-bit / 7-bit Linear Feedback Shift Register (LFSR) noise generator.
   */
  public playLfsrNoise(
    durationSec: number,
    clockHz: number = 2000,
    sevenBitMetallic: boolean = false,
    gainLevel: number = 0.06
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = Math.max(64, Math.floor(ctx.sampleRate * durationSec));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      // Authentic Game Boy LFSR (15-bit or 7-bit width mode)
      let lfsr = 0x7fff;
      const samplesPerStep = Math.max(1, Math.floor(ctx.sampleRate / Math.max(100, clockHz * 4)));
      let currentSample = 1;

      for (let i = 0; i < bufferSize; i++) {
        if (i % samplesPerStep === 0) {
          const xorBit = (lfsr & 1) ^ ((lfsr >> 1) & 1);
          lfsr = (lfsr >> 1) | (xorBit << 14);
          if (sevenBitMetallic) {
            lfsr = (lfsr & ~(1 << 6)) | (xorBit << 6);
          }
          currentSample = (lfsr & 1) === 0 ? 1.0 : -1.0;
        }
        output[i] = currentSample * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = sevenBitMetallic ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(clockHz, now);

      const gain = ctx.createGain();
      const safeGain = Math.max(0.001, Math.min(0.4, gainLevel));
      gain.gain.setValueAtTime(safeGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.onended = () => {
        try {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };

      noise.start(now);
      noise.stop(now + durationSec);
    } catch {
      // Ignore
    }
  }
}
