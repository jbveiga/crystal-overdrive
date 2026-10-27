/**
 * @fileoverview BattleAudio domain module implementation.
 * @module audio/BattleAudio
 * @role BattleAudio Component
 * @exports BattleAudio
 * @layer audio
 * @sections L1-15: Micro-Header & Imports | L16-270: Implementation | L271-540: Handlers & Exports
 */

import type { PokemonType, MoveCategory, WarpSoundCue } from '../types/game';
import {
  playWarpSound,
  playOverworldSound,
  playItemfinderPing,
  playItemfinderSonar,
  playStatusSound,
  playWeatherSound,
} from './battle/OverworldAndEnvironmentalAudio';
import type { OverworldSoundCue } from './battle/OverworldAndEnvironmentalAudio';

export type { WarpSoundCue, OverworldSoundCue };

/**
 * Pure WebAudio retro sound synthesizer for authentic Game Boy / GBA Pokémon battle cries,
 * hit effectiveness impacts (Super Effective / Normal / Resisted), stat changes, and Pokéball fanfare.
 */
export class BattleAudio {
  private static ctx: AudioContext | null = null;
  public static muted: boolean = false;
  public static lowHpBeepEnabled: boolean = true;
  private static lowHpAlarmTimer: ReturnType<typeof setInterval> | null = null;
  private static lowHpAlarmActive: boolean = false;

  private static getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Automatically disconnects one-shot OscillatorNode and GainNode instances from the AudioContext graph upon completion
   */
  private static bindAutoDisconnect(osc: OscillatorNode, gain: GainNode): void {
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // ignore already-disconnected nodes
      }
    };
  }

  /**
   * Plays a synthesized 8-bit/16-bit electronic Pokémon cry deterministic to speciesId
   */
  public static playCry(speciesId: string, isFaint: boolean = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Hash speciesId into deterministic pitch & modulation parameters
    let hash = 0;
    for (let i = 0; i < speciesId.length; i++) {
      hash = (hash * 31 + speciesId.charCodeAt(i)) & 0xffff;
    }

    const baseFreq = 260 + (hash % 320);
    const modFreq = 180 + ((hash >> 4) % 280);
    const now = ctx.currentTime;
    const duration = isFaint ? 0.42 : 0.32;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    this.bindAutoDisconnect(osc, gain);
    osc.type = 'square';

    if (isFaint) {
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.65, now + duration * 0.5);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.35, now + duration);
    } else {
      osc.frequency.setValueAtTime(baseFreq * 0.85, now);
      osc.frequency.setValueAtTime(modFreq * 1.25, now + 0.06);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.15, now + 0.16);
      osc.frequency.setValueAtTime(modFreq * 0.95, now + 0.22);
      osc.frequency.linearRampToValueAtTime(baseFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Plays elemental move attack sound cue
   */
  public static playMoveAttack(type: PokemonType, category?: MoveCategory): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    this.bindAutoDisconnect(osc, gain);

    if (category === 'Status') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(587, now + 0.12);
      osc.frequency.linearRampToValueAtTime(880, now + 0.24);
    } else if (type === 'Fire' || type === 'Dragon') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.22);
    } else if (type === 'Electric') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(520, now + 0.05);
      osc.frequency.setValueAtTime(1040, now + 0.1);
      osc.frequency.setValueAtTime(640, now + 0.16);
    } else if (type === 'Water' || type === 'Ice') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.linearRampToValueAtTime(680, now + 0.12);
      osc.frequency.linearRampToValueAtTime(420, now + 0.22);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Plays hit impact sound differentiated by Type Effectiveness (Super Effective / Neutral / Resisted)
   */
  public static playHitImpact(effectiveness: number, isCritical: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    this.bindAutoDisconnect(osc, gain);

    if (effectiveness >= 2 || isCritical) {
      // Heavy bass impact burst for Super Effective / Critical
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.setValueAtTime(260, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (effectiveness < 1) {
      // Dull high-pitched clink for Not Very Effective
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(310, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      // Standard crisp hit
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.16);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  }

  /**
   * Plays rising or falling stat-stage chime
   */
  public static playStatChange(isBoost: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = isBoost ? [330, 392, 494, 659] : [587, 494, 392, 311];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.06, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + (idx + 1) * 0.055);
    });
  }

  /**
   * Plays Pokéball wobble sound, ball break burst, or capture lock fanfare
   */
  public static playBallEvent(type: 'THROW' | 'WOBBLE' | 'BREAK' | 'CAUGHT' | 'LEVEL_UP'): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'THROW') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.18);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'BREAK') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'WOBBLE') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(310, now + 0.06);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'CAUGHT' || type === 'LEVEL_UP') {
      const notes =
        type === 'CAUGHT'
          ? [
              { f: 523.25, t: 0, d: 0.1 },
              { f: 659.25, t: 0.11, d: 0.1 },
              { f: 783.99, t: 0.22, d: 0.1 },
              { f: 1046.5, t: 0.34, d: 0.28 },
            ]
          : [
              { f: 440, t: 0, d: 0.09 },
              { f: 554.37, t: 0.1, d: 0.09 },
              { f: 659.25, t: 0.2, d: 0.09 },
              { f: 880, t: 0.3, d: 0.26 },
            ];
      for (const n of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.07, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      }
    }
  }

  /**
   * Plays retro Game Boy / GBA UI menu sound effects (Cursor, Confirm, Cancel, Heal, Save)
   */
  public static playMenuSound(type: 'CURSOR' | 'CONFIRM' | 'CANCEL' | 'HEAL' | 'SAVE'): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'CURSOR') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(740, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === 'CONFIRM') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(987.77, now + 0.045);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'CANCEL') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(349.23, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'HEAL') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.065);
        gain.gain.setValueAtTime(0.07, now + i * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.075);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.065);
        osc.stop(now + (i + 1) * 0.075);
      });
    } else if (type === 'SAVE') {
      const notes = [587.33, 783.99, 987.77, 1174.66];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.06, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + (i + 1) * 0.07);
      });
    }
  }

  /**
   * Plays dedicated building, cave, and staircase warp sound effects (DOOR_ENTER, DOOR_EXIT, STAIRS_STEP, CAVE_WARP)
   */
  public static playWarpSound(cue: WarpSoundCue): void {
    playWarpSound(cue, {
      getContext: () => this.getContext(),
      bindAutoDisconnect: this.bindAutoDisconnect,
    });
  }

  /**
   * Plays authentic Game Boy Color overworld sound effects (Tall grass rustle, Ledge hop, Trainer '!' alert, Doorway, Key Item, Pokégear ring)
   */
  public static playOverworldSound(type: OverworldSoundCue): void {
    playOverworldSound(type, {
      getContext: () => this.getContext(),
      bindAutoDisconnect: this.bindAutoDisconnect,
    });
  }

  /**
   * Synthesizes Itemfinder tactical audio feedback.
   */
  public static playItemfinderPing(found: boolean): void {
    playItemfinderPing(found, {
      getContext: () => this.getContext(),
      bindAutoDisconnect: this.bindAutoDisconnect,
    });
  }

  /**
   * Synthesizes Itemfinder distance-modulated pitch & cadence sonar beeps.
   */
  public static playItemfinderSonar(distance: number | null, isFacing: boolean = false): void {
    playItemfinderSonar(distance, isFacing, {
      getContext: () => this.getContext(),
      bindAutoDisconnect: this.bindAutoDisconnect,
    });
  }


  /**
   * Returns whether the continuous Gen II low-HP warning alarm loop is currently active.
   */
  public static isLowHpAlarmActive(): boolean {
    return this.lowHpAlarmActive;
  }

  /**
   * Enables or disables the low-HP warning alarm. If disabled while active, stops the alarm immediately.
   */
  public static setLowHpBeepEnabled(enabled: boolean): void {
    this.lowHpBeepEnabled = enabled;
    if (!enabled) {
      this.stopLowHpAlarm();
    }
  }

  /**
   * Plays a single two-tone Gen II Crystal low-HP warning beep (B5 -> F#5 on Pulse 1).
   */
  public static playLowHpBeepOnce(): void {
    if (this.muted || !this.lowHpBeepEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const tones: Array<{ freq: number; offset: number; dur: number }> = [
      { freq: 987.77, offset: 0.0, dur: 0.1 },   // B5
      { freq: 739.99, offset: 0.11, dur: 0.12 }, // F#5
    ];

    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(t.freq, now + t.offset);
      gain.gain.setValueAtTime(0.055, now + t.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t.offset + t.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t.offset);
      osc.stop(now + t.offset + t.dur);
    }
  }

  /**
   * Starts the rhythmic Gen II low-HP two-tone alarm loop when the player's active Pokémon is in the red zone (<= 20% HP).
   */
  public static startLowHpAlarm(): void {
    if (!this.lowHpBeepEnabled) {
      this.stopLowHpAlarm();
      return;
    }
    if (this.lowHpAlarmActive) return;

    this.lowHpAlarmActive = true;
    this.playLowHpBeepOnce();
    this.lowHpAlarmTimer = setInterval(() => {
      if (!this.lowHpAlarmActive || !this.lowHpBeepEnabled) {
        this.stopLowHpAlarm();
        return;
      }
      this.playLowHpBeepOnce();
    }, 650);
  }

  /**
   * Stops the continuous low-HP warning alarm loop cleanly.
   */
  public static stopLowHpAlarm(): void {
    if (this.lowHpAlarmTimer !== null) {
      clearInterval(this.lowHpAlarmTimer);
      this.lowHpAlarmTimer = null;
    }
    this.lowHpAlarmActive = false;
  }

  /**
   * Evaluates a player's active Pokémon HP and starts or stops the low-HP warning alarm accordingly.
   * Triggers when `0 < currentHp <= 0.20 * maxHp`. Stops on heal (> 20%) or faint (<= 0).
   */
  public static updateLowHpState(currentHp: number, maxHp: number): void {
    if (maxHp <= 0 || currentHp <= 0) {
      this.stopLowHpAlarm();
      return;
    }
    const ratio = currentHp / maxHp;
    if (ratio <= 0.20 && this.lowHpBeepEnabled) {
      this.startLowHpAlarm();
    } else {
      this.stopLowHpAlarm();
    }
  }

  /**
   * Synthesizes authentic 8-bit status infliction sound cues (PAR, BRN, FRZ, PSN, TOX, SLP).
   */
  public static playStatusSound(status: 'PAR' | 'BRN' | 'FRZ' | 'PSN' | 'TOX' | 'SLP'): void {
    playStatusSound(status, {
      getContext: () => this.getContext(),
      bindAutoDisconnect: this.bindAutoDisconnect,
    });
  }

  /**
   * Synthesizes weather ambience & battle weather transition cues (RAIN, SANDSTORM, SUN, HAIL).
   */
  public static playWeatherSound(weather: 'RAIN' | 'SANDSTORM' | 'SUN' | 'HAIL'): void {
    playWeatherSound(weather, {
      getContext: () => this.getContext(),
      bindAutoDisconnect: this.bindAutoDisconnect,
    });
  }
}