import type { PokemonType, MoveCategory } from '../types/game';

/**
 * Pure WebAudio retro sound synthesizer for authentic Game Boy / GBA Pokémon battle cries,
 * hit effectiveness impacts (Super Effective / Normal / Resisted), stat changes, and Pokéball fanfare.
 */
export class BattleAudio {
  private static ctx: AudioContext | null = null;
  public static muted: boolean = false;

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
   * Plays authentic Game Boy Color overworld sound effects (Tall grass rustle, Ledge hop, Trainer '!' alert, Doorway, Key Item, Pokégear ring)
   */
  public static playOverworldSound(
    type:
      | 'RUSTLE'
      | 'HOP'
      | 'EXCLAMATION'
      | 'DOOR'
      | 'KEY_ITEM'
      | 'PHONE_RING'
      | 'BUMP'
      | 'HEAL_JINGLE'
      | 'FANFARE'
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'RUSTLE') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(1120, now + 0.065);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.075);
    } else if (type === 'HOP') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.11);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.22);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'EXCLAMATION') {
      // Classic 2-tone Trainer Spotted '!' chime (B5 -> E6)
      const notes = [
        { f: 987.77, t: 0, d: 0.07 },
        { f: 1318.51, t: 0.075, d: 0.22 },
      ];
      for (const n of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.08, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      }
    } else if (type === 'DOOR') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'KEY_ITEM') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.07, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + (i + 1) * 0.09);
      });
    } else if (type === 'PHONE_RING') {
      const notes = [880, 1174.66, 880, 1174.66, 880, 1174.66];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.055);
        gain.gain.setValueAtTime(0.06, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.055);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.055);
        osc.stop(now + (i + 1) * 0.055);
      });
    } else if (type === 'BUMP') {
      // Authentic retro Game Boy wall bump thud (120Hz -> 65Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === 'HEAL_JINGLE') {
      // Classic Nurse Joy 6-note recovery melody (E5, G5, C6, E6, C6, E6)
      const notes = [
        { f: 659.25, d: 0.11, t: 0 },
        { f: 783.99, d: 0.11, t: 0.11 },
        { f: 1046.5, d: 0.11, t: 0.22 },
        { f: 1318.51, d: 0.13, t: 0.33 },
        { f: 1046.5, d: 0.13, t: 0.46 },
        { f: 1318.51, d: 0.32, t: 0.59 },
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.075, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    } else if (type === 'FANFARE') {
      // 4-note upbeat triumph item fanfare
      const notes = [
        { f: 523.25, d: 0.09, t: 0 },
        { f: 659.25, d: 0.09, t: 0.09 },
        { f: 783.99, d: 0.09, t: 0.18 },
        { f: 1046.5, d: 0.28, t: 0.27 },
      ];
      notes.forEach((n) => {
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
      });
    }
  }

  /**
   * Plays authentic Itemfinder radar sonar ping (double high-pitch beep if found, low dull tone if not found)
   */
  public static playItemfinderPing(found: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (found) {
      [0, 0.14].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        this.bindAutoDisconnect(osc, gain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1174.66, now + offset);
        osc.frequency.setValueAtTime(1567.98, now + offset + 0.04);
        gain.gain.setValueAtTime(0.07, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      this.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }
}
