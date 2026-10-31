/**
 * @fileoverview ChiptuneSynthesizer domain module implementation.
 * @module audio/ChiptuneSynthesizer
 * @role ChiptuneSynthesizer Component
 * @exports ChiptuneStep, ChiptunePattern, ChiptuneSynthesizer
 * @layer audio
 * @sections L1-15: Micro-Header & Imports | L16-305: Gen 2 GBC Score Patterns | L306-575: Hardware APU Synthesizer
 */

/**
 * Game Boy Color (DMG/CGB) 4-Channel Programmable Sound Generator (APU) Synthesizer.
 *
 * Emulates the classic 4 hardware sound channels using Web Audio API with authentic
 * Pokémon Gold / Silver / Crystal (Gen 2) multi-bar musical compositions:
 * - Channel 1 (Pulse 1): 12.5% / 25% / 50% duty-cycle Pulse wave with frequency sweep & vibrato
 * - Channel 2 (Pulse 2): 25% / 50% duty-cycle Pulse wave for counter-melodies & arpeggios
 * - Channel 3 (Wave): 4-bit custom wave / triangle bassline channel
 * - Channel 4 (Noise): 15-bit / 7-bit Linear Feedback Shift Register (LFSR) percussion channel
 */

import {
  type ChiptuneStep,
  type ChiptunePattern,
  NOTE,
  CHIPTUNE_PATTERNS,
} from './ChiptunePatternsCatalog';

export { type ChiptuneStep, type ChiptunePattern, NOTE, CHIPTUNE_PATTERNS };

export class ChiptuneSynthesizer {
  private ctx: AudioContext | null = null;
  private currentTrackId: string | null = null;
  private stepIndex: number = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private playing: boolean = false;
  private muted: boolean = false;
  private volume: number = 0.3;
  private dutyWaveCache: Map<number, PeriodicWave> = new Map();

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  private getDutyPeriodicWave(ctx: AudioContext, duty: number): PeriodicWave | null {
    if (typeof ctx.createPeriodicWave !== 'function') return null;
    const cached = this.dutyWaveCache.get(duty);
    if (cached) return cached;
    try {
      const harmonics = 24;
      const real = new Float32Array(harmonics + 1);
      const imag = new Float32Array(harmonics + 1);
      for (let n = 1; n <= harmonics; n++) {
        imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
      }
      const wave = ctx.createPeriodicWave(real, imag);
      this.dutyWaveCache.set(duty, wave);
      return wave;
    } catch {
      return null;
    }
  }

  public getPatternForTrack(trackId: string): ChiptunePattern {
    if (trackId === 'bgm_ecruteak') return CHIPTUNE_PATTERNS.bgm_ecruteak_city;
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
    const stepDurationSec = 60 / pattern.bpm / 2;
    const stepMs = Math.max(60, Math.round(stepDurationSec * 1000));

    this.triggerStep(pattern.steps[0], stepDurationSec, pattern);
    this.stepIndex = 1 % pattern.steps.length;

    this.timerId = setInterval(() => {
      if (!this.playing) return;
      const step = pattern.steps[this.stepIndex % pattern.steps.length];
      this.triggerStep(step, stepDurationSec, pattern);
      this.stepIndex = (this.stepIndex + 1) % pattern.steps.length;
    }, stepMs);
  }

  public stopTrack(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.playing = false;
    this.currentTrackId = null;
    this.stepIndex = 0;
  }

  private triggerStep(
    step: ChiptuneStep,
    stepDurationSec: number,
    pattern?: ChiptunePattern
  ): void {
    if (this.muted || this.volume <= 0) return;

    const duty1 = pattern?.duty1 ?? 0.25;
    const duty2 = pattern?.duty2 ?? 0.5;

    if (step.pulse1 && step.pulse1 > 0) {
      const dur1 = stepDurationSec * (step.sustain1 ?? 0.88);
      this.playPulse1Note(step.pulse1, dur1, this.volume * 0.22, step.pulse1SweepTo, duty1);
    }
    if (step.pulse2 && step.pulse2 > 0) {
      const dur2 = stepDurationSec * (step.sustain2 ?? 0.82);
      this.playPulse2Note(step.pulse2, dur2, this.volume * 0.14, duty2);
    }
    if (step.wave && step.wave > 0) {
      const durWave = stepDurationSec * (step.sustainWave ?? 0.92);
      this.playWaveNote(step.wave, durWave, this.volume * 0.25);
    }
    if (step.noise) {
      switch (step.noise) {
        case 'KICK':
          this.playLfsrNoise(0.055, 220, true, this.volume * 0.17);
          break;
        case 'SNARE':
          this.playLfsrNoise(0.08, 1200, false, this.volume * 0.15);
          break;
        case 'HAT':
          this.playLfsrNoise(0.028, 4400, false, this.volume * 0.09);
          break;
        case 'CRASH':
          this.playLfsrNoise(0.16, 2400, false, this.volume * 0.17);
          break;
      }
    }
  }

  public playPulse1Note(
    freq: number,
    durationSec: number,
    gainLevel: number = 0.08,
    sweepEndFreq?: number,
    duty: number = 0.25
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const customWave = this.getDutyPeriodicWave(ctx, duty);
      if (customWave && typeof osc.setPeriodicWave === 'function') {
        osc.setPeriodicWave(customWave);
      } else {
        osc.type = 'square';
      }

      osc.frequency.setValueAtTime(freq, now);
      if (sweepEndFreq && sweepEndFreq > 0) {
        osc.frequency.exponentialRampToValueAtTime(sweepEndFreq, now + durationSec * 0.7);
      }

      const safeGain = Math.max(0.001, Math.min(0.5, gainLevel));
      gain.gain.setValueAtTime(safeGain, now);
      gain.gain.setValueAtTime(safeGain * 0.82, now + durationSec * 0.45);
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

  public playPulse2Note(
    freq: number,
    durationSec: number,
    gainLevel: number = 0.06,
    duty: number = 0.5
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const customWave = this.getDutyPeriodicWave(ctx, duty);
      if (customWave && typeof osc.setPeriodicWave === 'function') {
        osc.setPeriodicWave(customWave);
      } else {
        osc.type = 'square';
      }

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
      gain.gain.setValueAtTime(safeGain * 0.78, now + durationSec * 0.5);
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
