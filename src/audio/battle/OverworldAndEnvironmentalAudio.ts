/**
 * @fileoverview OverworldAndEnvironmentalAudio domain module implementation.
 * @module audio/battle/OverworldAndEnvironmentalAudio
 * @role OverworldAndEnvironmentalAudio Component
 * @exports OverworldSoundCue, AudioHelperContext, playWarpSound
 * @layer audio
 * @sections L1-15: Micro-Header & Imports | L16-305: Implementation | L306-611: Handlers & Exports
 */

import type { WarpSoundCue } from '../../types/game';

export type OverworldSoundCue =
  | 'RUSTLE'
  | 'HOP'
  | 'EXCLAMATION'
  | 'DOOR'
  | 'DOOR_ENTER'
  | 'DOOR_EXIT'
  | 'STAIRS_STEP'
  | 'CAVE_WARP'
  | 'KEY_ITEM'
  | 'PHONE_RING'
  | 'BUMP'
  | 'HEAL_JINGLE'
  | 'ITEM_FOUND'
  | 'LEVEL_UP'
  | 'STADIUM_APPLAUSE'
  | 'FANFARE';

export interface AudioHelperContext {
  getContext: () => AudioContext | null;
  bindAutoDisconnect: (osc: OscillatorNode, gain: GainNode) => void;
}

/**
 * Plays dedicated building, cave, and staircase warp sound effects.
 */
export function playWarpSound(cue: WarpSoundCue, helper: AudioHelperContext): void {
  const ctx = helper.getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (cue === 'DOOR_ENTER') {
    const notes = [
      { f: 329.63, t: 0, d: 0.06 },
      { f: 523.25, t: 0.055, d: 0.11 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.06, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    }
  } else if (cue === 'DOOR_EXIT') {
    const clicks = [
      { f: 480, t: 0, d: 0.035, type: 'square' as OscillatorType, vol: 0.05 },
      { f: 220, t: 0.03, d: 0.075, type: 'triangle' as OscillatorType, vol: 0.07 },
    ];
    for (const c of clicks) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = c.type;
      osc.frequency.setValueAtTime(c.f, now + c.t);
      gain.gain.setValueAtTime(c.vol, now + c.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + c.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + c.t);
      osc.stop(now + c.t + c.d);
    }
  } else if (cue === 'STAIRS_STEP') {
    const steps = [
      { f: 440, t: 0, d: 0.035 },
      { f: 370, t: 0.045, d: 0.035 },
      { f: 494, t: 0.09, d: 0.05 },
    ];
    for (const s of steps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(s.f, now + s.t);
      gain.gain.setValueAtTime(0.05, now + s.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + s.t + s.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + s.t);
      osc.stop(now + s.t + s.d);
    }
  } else if (cue === 'CAVE_WARP') {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    helper.bindAutoDisconnect(osc1, gain1);
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(160, now);
    osc1.frequency.exponentialRampToValueAtTime(65, now + 0.22);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.24);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    helper.bindAutoDisconnect(osc2, gain2);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(90, now);
    osc2.frequency.exponentialRampToValueAtTime(45, now + 0.26);
    gain2.gain.setValueAtTime(0.05, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.26);
  }
}

/**
 * Plays authentic Game Boy Color overworld sound effects.
 */
export function playOverworldSound(type: OverworldSoundCue, helper: AudioHelperContext): void {
  const ctx = helper.getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'RUSTLE') {
    const burst = ctx.createBufferSource();
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    burst.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    burst.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    burst.onended = () => {
      try {
        burst.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // Ignore
      }
    };
    burst.start(now);
  } else if (type === 'HOP') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    helper.bindAutoDisconnect(osc, gain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'EXCLAMATION') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    helper.bindAutoDisconnect(osc, gain);
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.06);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'DOOR' || type === 'DOOR_ENTER') {
    playWarpSound('DOOR_ENTER', helper);
  } else if (type === 'DOOR_EXIT') {
    playWarpSound('DOOR_EXIT', helper);
  } else if (type === 'STAIRS_STEP') {
    playWarpSound('STAIRS_STEP', helper);
  } else if (type === 'CAVE_WARP') {
    playWarpSound('CAVE_WARP', helper);
  } else if (type === 'KEY_ITEM') {
    const melody = [
      { f: 523.25, t: 0, d: 0.08 },
      { f: 659.25, t: 0.08, d: 0.08 },
      { f: 783.99, t: 0.16, d: 0.08 },
      { f: 1046.5, t: 0.24, d: 0.22 },
    ];
    for (const note of melody) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.08, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    }
  } else if (type === 'PHONE_RING') {
    const burstCount = 2;
    for (let b = 0; b < burstCount; b++) {
      const offset = b * 0.14;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc1, gain);
      helper.bindAutoDisconnect(osc2, gain);
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(853, now + offset);
      osc2.frequency.setValueAtTime(960, now + offset);
      gain.gain.setValueAtTime(0.06, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now + offset);
      osc2.start(now + offset);
      osc1.stop(now + offset + 0.09);
      osc2.stop(now + offset + 0.09);
    }
  } else if (type === 'BUMP') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    helper.bindAutoDisconnect(osc, gain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } else if (type === 'HEAL_JINGLE') {
    const jingleNotes = [
      { f: 659.25, t: 0, d: 0.11 },
      { f: 659.25, t: 0.12, d: 0.11 },
      { f: 659.25, t: 0.24, d: 0.11 },
      { f: 523.25, t: 0.36, d: 0.09 },
      { f: 659.25, t: 0.46, d: 0.14 },
      { f: 783.99, t: 0.62, d: 0.26 },
    ];
    for (const note of jingleNotes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.08, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    }
  } else if (type === 'ITEM_FOUND') {
    const fanNotes = [
      { f: 523.25, t: 0, d: 0.08 },
      { f: 659.25, t: 0.09, d: 0.08 },
      { f: 783.99, t: 0.18, d: 0.08 },
      { f: 1046.5, t: 0.27, d: 0.22 },
    ];
    for (const note of fanNotes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.085, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    }
  } else if (type === 'LEVEL_UP') {
    const levelNotes = [
      { f: 587.33, t: 0, d: 0.07 },
      { f: 659.25, t: 0.08, d: 0.07 },
      { f: 783.99, t: 0.16, d: 0.07 },
      { f: 880.0, t: 0.24, d: 0.18 },
    ];
    for (const note of levelNotes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.07, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    }
  } else if (type === 'STADIUM_APPLAUSE') {
    const bufferSize = Math.floor(ctx.sampleRate * 0.45);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.min(1, (bufferSize - i) / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
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
      helper.bindAutoDisconnect(osc, gain);
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

export {
  playItemfinderPing,
  playItemfinderSonar,
  playStatusSound,
  playWeatherSound,
} from './ItemfinderAndWeatherAudio';

