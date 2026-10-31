/**
 * @fileoverview ItemfinderAndWeatherAudio domain module implementation.
 * @module audio/battle/ItemfinderAndWeatherAudio
 * @role Itemfinder sonar, status condition cues, and weather audio synthesizer
 * @exports playItemfinderPing, playItemfinderSonar, playStatusSound, playWeatherSound
 * @layer audio
 * @sections L1-95: Itemfinder Audio | L96-255: Status & Weather Audio
 */

import type { AudioHelperContext } from './OverworldAndEnvironmentalAudio';

/**
 * Synthesizes Itemfinder tactical audio feedback.
 */
export function playItemfinderPing(found: boolean, helper: AudioHelperContext): void {
  const ctx = helper.getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (found) {
    const notes = [
      { f: 1046.5, t: 0, d: 0.05 },
      { f: 1318.5, t: 0.06, d: 0.08 },
    ];
    for (const n of notes) {
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
    }
  } else {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    helper.bindAutoDisconnect(osc, gain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

/**
 * Synthesizes Itemfinder distance-modulated pitch & cadence sonar beeps.
 */
export function playItemfinderSonar(
  distance: number | null,
  isFacing: boolean = false,
  helper: AudioHelperContext
): void {
  const ctx = helper.getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (distance === null) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    helper.bindAutoDisconnect(osc, gain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
    return;
  }

  const clampedDist = Math.max(0, Math.min(15, distance));
  const baseFreq = 523.25;
  const maxFreq = 1760.0;
  const factor = 1 - clampedDist / 15;
  const freq = baseFreq + factor * (maxFreq - baseFreq);
  const duration = Math.max(0.035, 0.08 - factor * 0.035);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  helper.bindAutoDisconnect(osc, gain);
  osc.type = isFacing ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(freq, now);

  const vol = isFacing ? 0.08 : 0.05;
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Synthesizes authentic 8-bit status infliction sound cues (PAR, BRN, FRZ, PSN, TOX, SLP).
 */
export function playStatusSound(
  status: 'PAR' | 'BRN' | 'FRZ' | 'PSN' | 'TOX' | 'SLP',
  helper: AudioHelperContext
): void {
  const ctx = helper.getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (status === 'PAR') {
    [0, 0.06, 0.12, 0.18].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 920 : 480, now + offset);
      gain.gain.setValueAtTime(0.06, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.05);
    });
  } else if (status === 'BRN') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    helper.bindAutoDisconnect(osc, gain);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.26);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  } else if (status === 'FRZ') {
    [1046.5, 1318.5, 1568.0].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.065, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.11);
    });
  } else if (status === 'PSN' || status === 'TOX') {
    [340, 260, 310, 210].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.065);
      gain.gain.setValueAtTime(0.06, now + i * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.06);
    });
  } else if (status === 'SLP') {
    [523.25, 440, 349.23].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.07, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.12);
    });
  }
}

/**
 * Synthesizes weather ambience & battle weather transition cues (RAIN, SANDSTORM, SUN, HAIL).
 */
export function playWeatherSound(
  weather: 'RAIN' | 'SANDSTORM' | 'SUN' | 'HAIL',
  helper: AudioHelperContext
): void {
  const ctx = helper.getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (weather === 'SUN') {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      helper.bindAutoDisconnect(osc, gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.065, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.14);
    });
    return;
  }

  const duration = weather === 'SANDSTORM' ? 0.35 : 0.25;
  const bufferSize = Math.max(64, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(
    weather === 'RAIN' ? 1800 : weather === 'HAIL' ? 3200 : 750,
    now
  );

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.065, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

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
  noise.stop(now + duration);
}
