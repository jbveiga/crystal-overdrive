/**
 * @fileoverview ChiptunePatternsCatalog domain module implementation.
 * @module audio/ChiptunePatternsCatalog
 * @role Gen 2 GBC 4-channel score patterns and note frequency dictionary
 * @exports ChiptuneStep, ChiptunePattern, NOTE, CHIPTUNE_PATTERNS
 * @layer audio
 * @sections L1-48: Types & Note Frequencies | L49-260: Gen 2 GBC Score Patterns
 */

export interface ChiptuneStep {
  /** Channel 1 (Pulse 1 lead) frequency in Hz, or 0/null for rest */
  pulse1?: number | null;
  /** Optional frequency sweep target in Hz for Channel 1 */
  pulse1SweepTo?: number;
  /** Optional note length multiplier for Channel 1 (default 0.88) */
  sustain1?: number;
  /** Channel 2 (Pulse 2 harmony) frequency in Hz, or 0/null for rest */
  pulse2?: number | null;
  /** Optional note length multiplier for Channel 2 (default 0.82) */
  sustain2?: number;
  /** Channel 3 (4-bit Wave bass) frequency in Hz, or 0/null for rest */
  wave?: number | null;
  /** Optional note length multiplier for Channel 3 (default 0.92) */
  sustainWave?: number;
  /** Channel 4 (LFSR Noise percussion): 'KICK' | 'SNARE' | 'HAT' | 'CRASH' | null */
  noise?: 'KICK' | 'SNARE' | 'HAT' | 'CRASH' | null;
}

export interface ChiptunePattern {
  id: string;
  bpm: number;
  duty1?: 0.125 | 0.25 | 0.5;
  duty2?: 0.125 | 0.25 | 0.5;
  steps: ChiptuneStep[];
}

export const NOTE: Record<string, number> = {
  C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
  C6: 1046.50, Cs6: 1108.73, D6: 1174.66, Ds6: 1244.51, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, G6: 1567.98, A6: 1760.00,
};

const N = NOTE;
const s = (
  pulse1: number | null,
  pulse2: number | null,
  wave: number | null,
  noise: ChiptuneStep['noise'] = null,
  sustain1?: number,
  pulse1SweepTo?: number
): ChiptuneStep => ({ pulse1, pulse2, wave, noise, sustain1, pulse1SweepTo });

export const CHIPTUNE_PATTERNS: Record<string, ChiptunePattern> = {
  bgm_new_bark_town: {
    id: 'bgm_new_bark_town', bpm: 136, duty1: 0.5, duty2: 0.25,
    steps: [
      s(N.Fs5, N.A4, N.D3, 'KICK', 1.8), s(null, N.D5, N.A3, 'HAT'), s(N.E5, N.Cs5, N.Fs3, null), s(N.D5, N.A4, N.A3, 'HAT'),
      s(N.A4, N.Fs4, N.D3, null, 2.6), s(null, N.A4, N.A3, 'HAT'), s(null, N.D5, N.D3, null), s(N.B4, N.G4, N.A2, 'HAT'),
      s(N.D5, N.B4, N.G2, null, 1.8), s(null, N.G4, N.D3, 'HAT'), s(N.G5, N.B4, N.G3, null), s(N.Fs5, N.A4, N.D3, 'HAT'),
      s(N.E5, N.Cs5, N.A2, 'SNARE', 2.8), s(null, N.A4, N.E3, 'HAT'), s(N.A4, N.G4, N.A3, null), s(N.Cs5, N.E4, N.E3, 'HAT'),
      s(N.D5, N.Fs4, N.D3, 'KICK', 1.8), s(null, N.A4, N.A3, 'HAT'), s(N.Fs5, N.D5, N.Fs3, null), s(N.A5, N.Fs5, N.D3, 'HAT'),
      s(N.G5, N.B4, N.B2, null, 1.8), s(null, N.D5, N.Fs3, 'HAT'), s(N.Fs5, N.A4, N.B3, null), s(N.D5, N.Fs4, N.Fs3, 'HAT'),
      s(N.E5, N.G4, N.E2, null, 1.8), s(null, N.B4, N.B2, 'HAT'), s(N.G5, N.B4, N.E3, null), s(N.Fs5, N.A4, N.G3, 'HAT'),
      s(N.E5, N.Cs5, N.A2, 'SNARE'), s(N.Cs5, N.A4, N.E3, 'HAT'), s(N.D5, N.Fs4, N.D3, null, 1.9), s(null, N.A4, N.A2, 'HAT'),
    ],
  },
  bgm_route_29: {
    id: 'bgm_route_29', bpm: 150, duty1: 0.25, duty2: 0.5,
    steps: [
      s(N.C5, N.E4, N.C3, 'KICK'), s(N.D5, N.F4, N.G3, 'HAT'), s(N.E5, N.G4, N.C3, 'SNARE', 1.6), s(N.G5, N.C5, N.G3, 'HAT'),
      s(N.C6, N.E5, N.C3, 'KICK', 1.7), s(N.G5, N.C5, N.G3, 'HAT'), s(N.E5, N.G4, N.C3, 'SNARE'), s(N.C5, N.E4, N.E3, 'HAT'),
      s(N.F5, N.A4, N.F3, 'KICK'), s(N.G5, N.B4, N.C3, 'HAT'), s(N.A5, N.C5, N.F3, 'SNARE', 1.6), s(N.F5, N.A4, N.C3, 'HAT'),
      s(N.G5, N.B4, N.G3, 'KICK', 1.8), s(N.F5, N.G4, N.D3, 'HAT'), s(N.D5, N.B4, N.G2, 'SNARE'), s(N.B4, N.G4, N.B2, 'HAT'),
      s(N.C5, N.E4, N.C3, 'KICK'), s(N.E5, N.G4, N.G3, 'HAT'), s(N.G5, N.C5, N.A2, 'SNARE'), s(N.A5, N.Cs5, N.E3, 'HAT'),
      s(N.G5, N.B4, N.F3, 'KICK'), s(N.F5, N.A4, N.C3, 'HAT'), s(N.E5, N.G4, N.D3, 'SNARE'), s(N.D5, N.F4, N.A2, 'HAT'),
      s(N.E5, N.G4, N.G2, 'KICK'), s(N.D5, N.F4, N.D3, 'HAT'), s(N.B4, N.G4, N.G3, 'SNARE'), s(N.G4, N.D4, N.B2, 'HAT'),
      s(N.C5, N.E4, N.C3, 'KICK', 2.5), s(null, N.G4, N.G2, 'HAT'), s(N.G4, N.E4, N.C3, 'SNARE'), s(N.B4, N.D4, N.G2, 'HAT'),
    ],
  },
  bgm_cherrygrove_city: {
    id: 'bgm_cherrygrove_city', bpm: 140, duty1: 0.5, duty2: 0.25,
    steps: [
      s(N.C5, N.A4, N.F3, 'KICK'), s(N.F5, N.A4, N.C3, 'HAT'), s(N.G5, N.As4, N.F3, 'SNARE'), s(N.A5, N.C5, N.C3, 'HAT'),
      s(N.G5, N.As4, N.C3, 'KICK'), s(N.F5, N.A4, N.G3, 'HAT'), s(N.D5, N.As4, N.C3, 'SNARE'), s(N.C5, N.G4, N.E3, 'HAT'),
      s(N.As4, N.D4, N.As2, 'KICK'), s(N.D5, N.F4, N.F3, 'HAT'), s(N.F5, N.As4, N.As2, 'SNARE'), s(N.G5, N.D5, N.D3, 'HAT'),
      s(N.E5, N.C5, N.C3, 'KICK', 2.2), s(null, N.G4, N.G2, 'HAT'), s(N.C5, N.E4, N.C3, 'SNARE'), s(N.E5, N.G4, N.G3, 'HAT'),
      s(N.F5, N.A4, N.F3, 'KICK'), s(N.A5, N.C5, N.C3, 'HAT'), s(N.C6, N.F5, N.D3, 'SNARE', 1.7), s(N.A5, N.D5, N.A2, 'HAT'),
      s(N.G5, N.As4, N.G2, 'KICK'), s(N.F5, N.A4, N.D3, 'HAT'), s(N.D5, N.G4, N.G3, 'SNARE'), s(N.As4, N.D4, N.D3, 'HAT'),
      s(N.C5, N.E4, N.C3, 'KICK'), s(N.G5, N.As4, N.G2, 'HAT'), s(N.E5, N.G4, N.C3, 'SNARE'), s(N.C5, N.E4, N.E3, 'HAT'),
      s(N.F5, N.A4, N.F3, 'KICK', 2.6), s(null, N.C5, N.C3, 'HAT'), s(null, N.A4, N.F2, 'SNARE'), s(N.D5, N.As4, N.C3, 'HAT'),
    ],
  },
  bgm_violet_city: {
    id: 'bgm_violet_city', bpm: 124, duty1: 0.25, duty2: 0.5,
    steps: [
      s(N.B4, N.G4, N.E3, 'KICK'), s(N.E5, N.B4, N.B2, null, 1.8), s(N.Fs5, N.A4, N.E3, 'HAT'), s(N.G5, N.B4, N.G3, null),
      s(N.Fs5, N.D5, N.B2, 'SNARE', 1.8), s(N.D5, N.B4, N.Fs3, null), s(N.B4, N.Fs4, N.B2, 'HAT', 1.8), s(null, N.A4, N.Fs2, null),
      s(N.C5, N.E4, N.C3, 'KICK'), s(N.E5, N.G4, N.G2, null), s(N.G5, N.C5, N.C3, 'HAT'), s(N.E5, N.G4, N.E3, null),
      s(N.Fs5, N.A4, N.D3, 'SNARE', 1.8), s(N.G5, N.B4, N.A2, null), s(N.A5, N.D5, N.D3, 'HAT', 1.8), s(N.Fs5, N.C5, N.A2, null),
      s(N.B5, N.D5, N.G2, 'KICK', 1.8), s(N.G5, N.B4, N.D3, null), s(N.D5, N.G4, N.G3, 'HAT'), s(N.B4, N.D4, N.B2, null),
      s(N.E5, N.G4, N.E3, 'SNARE', 1.8), s(N.Fs5, N.A4, N.B2, null), s(N.G5, N.B4, N.E3, 'HAT'), s(N.E5, N.G4, N.G2, null),
      s(N.C5, N.E4, N.A2, 'KICK'), s(N.A4, N.C4, N.E3, null), s(N.Fs5, N.A4, N.B2, 'HAT'), s(N.Ds5, N.Fs4, N.Fs2, null),
      s(N.E5, N.G4, N.E2, 'SNARE', 2.8), s(null, N.B4, N.B2, null), s(null, N.G4, N.E3, 'HAT'), s(N.D5, N.Fs4, N.B2, null),
    ],
  },
  bgm_sprout_tower: {
    id: 'bgm_sprout_tower', bpm: 110, duty1: 0.125, duty2: 0.25,
    steps: [
      s(N.E5, N.B3, N.E2, 'KICK', 1.9), s(null, N.E4, N.B2, null), s(N.F5, N.B3, N.E2, 'HAT'), s(N.E5, N.E4, N.B2, null),
      s(N.B4, N.F4, N.E2, 'SNARE', 1.9), s(null, N.E4, N.B2, null), s(N.C5, N.B3, N.A2, 'HAT'), s(N.B4, N.E4, N.E2, null),
      s(N.A4, N.C4, N.A2, 'KICK', 1.9), s(null, N.E4, N.E3, null), s(N.B4, N.D4, N.A2, 'HAT'), s(N.C5, N.E4, N.E3, null),
      s(N.E5, N.A4, N.E2, 'SNARE', 2.8), s(null, N.F4, N.B2, null), s(null, N.E4, N.E3, 'HAT'), s(N.D5, N.B3, N.B2, null),
      s(N.A5, N.C5, N.A2, 'KICK', 1.9), s(null, N.E5, N.E3, null), s(N.F5, N.A4, N.F2, 'HAT'), s(N.E5, N.C5, N.C3, null),
      s(N.D5, N.F4, N.D2, 'SNARE', 1.9), s(null, N.A4, N.A2, null), s(N.C5, N.E4, N.A2, 'HAT'), s(N.B4, N.D4, N.E2, null),
      s(N.A4, N.C4, N.F2, 'KICK'), s(N.F4, N.A3, N.C3, null), s(N.E4, N.B3, N.E2, 'SNARE', 3.5), s(null, N.E4, N.B2, null),
      s(null, N.F4, N.E2, 'HAT'), s(null, N.E4, N.B2, null), s(N.B4, N.D4, N.E2, 'HAT'), s(N.C5, N.E4, N.B2, null),
    ],
  },
  bgm_goldenrod_city: {
    id: 'bgm_goldenrod_city', bpm: 152, duty1: 0.25, duty2: 0.5,
    steps: [
      s(N.D5, N.B4, N.G3, 'KICK'), s(N.G5, N.B4, N.D3, 'HAT'), s(N.Fs5, N.A4, N.G3, 'SNARE'), s(N.G5, N.B4, N.D3, 'HAT'),
      s(N.A5, N.C5, N.C3, 'KICK', 1.8), s(N.G5, N.B4, N.G3, 'HAT'), s(N.E5, N.G4, N.C3, 'SNARE'), s(N.C5, N.E4, N.E3, 'HAT'),
      s(N.D5, N.Fs4, N.D3, 'KICK'), s(N.Fs5, N.A4, N.A2, 'HAT'), s(N.A5, N.D5, N.D3, 'SNARE'), s(N.C6, N.Fs5, N.Fs3, 'HAT'),
      s(N.B5, N.G5, N.G3, 'KICK', 2.2), s(null, N.D5, N.D3, 'HAT'), s(N.G5, N.B4, N.B2, 'SNARE'), s(N.D5, N.G4, N.G2, 'HAT'),
      s(N.E5, N.G4, N.E3, 'KICK'), s(N.G5, N.B4, N.B2, 'HAT'), s(N.B5, N.E5, N.E3, 'SNARE'), s(N.G5, N.B4, N.G3, 'HAT'),
      s(N.A5, N.Cs5, N.A2, 'KICK'), s(N.G5, N.B4, N.E3, 'HAT'), s(N.Fs5, N.A4, N.D3, 'SNARE'), s(N.E5, N.G4, N.A2, 'HAT'),
      s(N.D5, N.Fs4, N.C3, 'KICK'), s(N.E5, N.G4, N.G2, 'HAT'), s(N.Fs5, N.A4, N.D3, 'SNARE'), s(N.A5, N.C5, N.A2, 'HAT'),
      s(N.G5, N.B4, N.G2, 'KICK', 2.6), s(null, N.D5, N.D3, 'HAT'), s(N.D5, N.B4, N.G3, 'SNARE'), s(N.Fs5, N.A4, N.D3, 'HAT'),
    ],
  },
  bgm_ecruteak_city: {
    id: 'bgm_ecruteak_city', bpm: 118, duty1: 0.25, duty2: 0.125,
    steps: [
      s(N.A4, N.D4, N.D3, 'KICK'), s(N.D5, N.F4, N.A2, 'HAT', 1.8), s(N.E5, N.A4, N.D3, null), s(N.F5, N.D5, N.F3, 'HAT'),
      s(N.E5, N.C5, N.A2, 'SNARE', 1.8), s(N.D5, N.A4, N.E3, 'HAT'), s(N.C5, N.E4, N.A2, null), s(N.A4, N.C4, N.E2, 'HAT'),
      s(N.As4, N.D4, N.G2, 'KICK', 1.8), s(N.D5, N.G4, N.D3, 'HAT'), s(N.G5, N.As4, N.G3, null), s(N.F5, N.D5, N.D3, 'HAT'),
      s(N.E5, N.Cs5, N.A2, 'SNARE', 2.5), s(null, N.A4, N.E3, 'HAT'), s(N.A4, N.E4, N.A2, null), s(N.Cs5, N.G4, N.E3, 'HAT'),
      s(N.D5, N.F4, N.D3, 'KICK'), s(N.F5, N.A4, N.A2, 'HAT'), s(N.A5, N.D5, N.As2, null, 1.8), s(N.G5, N.D5, N.F3, 'HAT'),
      s(N.F5, N.As4, N.G2, 'SNARE'), s(N.E5, N.G4, N.D3, 'HAT'), s(N.D5, N.F4, N.G2, null), s(N.As4, N.D4, N.D3, 'HAT'),
      s(N.A4, N.D4, N.A2, 'KICK'), s(N.E5, N.A4, N.E3, 'HAT'), s(N.D5, N.G4, N.A2, null), s(N.Cs5, N.E4, N.E2, 'HAT'),
      s(N.D5, N.F4, N.D2, 'SNARE', 2.8), s(null, N.A4, N.A2, 'HAT'), s(null, N.D5, N.D3, null), s(N.F4, N.A3, N.A2, 'HAT'),
    ],
  },
  bgm_national_park: {
    id: 'bgm_national_park', bpm: 116, duty1: 0.5, duty2: 0.25,
    steps: [
      s(N.Gs4, N.E4, N.E3, 'KICK'), s(N.B4, N.Gs4, N.B2, 'HAT'), s(N.E5, N.B4, N.E3, null, 1.9), s(N.Fs5, N.B4, N.Gs3, 'HAT'),
      s(N.Gs5, N.E5, N.Cs3, 'SNARE', 1.9), s(N.Fs5, N.Gs4, N.Gs2, 'HAT'), s(N.E5, N.Cs5, N.Cs3, null), s(N.B4, N.Gs4, N.E3, 'HAT'),
      s(N.Cs5, N.A4, N.Fs2, 'KICK', 1.9), s(N.A4, N.Fs4, N.Cs3, 'HAT'), s(N.Fs5, N.Cs5, N.Fs3, null), s(N.E5, N.A4, N.Cs3, 'HAT'),
      s(N.Ds5, N.B4, N.B2, 'SNARE', 2.6), s(null, N.Fs4, N.Fs2, 'HAT'), s(N.B4, N.A4, N.B2, null), s(N.Cs5, N.Fs4, N.Ds3, 'HAT'),
      s(N.E5, N.Gs4, N.E3, 'KICK'), s(N.Gs5, N.B4, N.B2, 'HAT'), s(N.B5, N.E5, N.E3, null, 1.9), s(N.Gs5, N.B4, N.Gs2, 'HAT'),
      s(N.A5, N.Cs5, N.A2, 'SNARE', 1.9), s(N.Fs5, N.C5, N.E3, 'HAT'), s(N.D5, N.A4, N.A2, null), s(N.C5, N.Fs4, N.C3, 'HAT'),
      s(N.B4, N.Gs4, N.B2, 'KICK'), s(N.Gs5, N.B4, N.E3, 'HAT'), s(N.Fs5, N.A4, N.B2, null), s(N.Ds5, N.Fs4, N.Fs2, 'HAT'),
      s(N.E5, N.Gs4, N.E2, 'SNARE', 2.8), s(null, N.B4, N.B2, 'HAT'), s(null, N.E5, N.E3, null), s(N.Fs4, N.Ds4, N.B2, 'HAT'),
    ],
  },
  bgm_gym: {
    id: 'bgm_gym', bpm: 146, duty1: 0.25, duty2: 0.25,
    steps: [
      s(N.C5, N.E4, N.C3, 'KICK'), s(N.G4, N.C4, N.G2, 'HAT'), s(N.C5, N.E4, N.C3, 'SNARE'), s(N.E5, N.G4, N.G2, 'HAT'),
      s(N.G5, N.C5, N.C3, 'KICK', 1.8), s(N.F5, N.A4, N.F3, 'HAT'), s(N.E5, N.G4, N.E3, 'SNARE'), s(N.D5, N.F4, N.D3, 'HAT'),
      s(N.As4, N.D4, N.As2, 'KICK'), s(N.D5, N.F4, N.F2, 'HAT'), s(N.F5, N.As4, N.As2, 'SNARE'), s(N.A5, N.D5, N.D3, 'HAT'),
      s(N.G5, N.B4, N.G2, 'CRASH', 2.2), s(null, N.D5, N.D3, 'HAT'), s(N.G4, N.B3, N.G2, 'SNARE'), s(N.B4, N.D4, N.B2, 'HAT'),
      s(N.C5, N.E4, N.C3, 'KICK'), s(N.D5, N.F4, N.G2, 'HAT'), s(N.E5, N.G4, N.C3, 'SNARE'), s(N.G5, N.C5, N.E3, 'HAT'),
      s(N.A5, N.C5, N.F3, 'KICK'), s(N.G5, N.B4, N.C3, 'HAT'), s(N.F5, N.A4, N.D3, 'SNARE'), s(N.E5, N.G4, N.A2, 'HAT'),
      s(N.D5, N.F4, N.D3, 'KICK'), s(N.F5, N.A4, N.A2, 'HAT'), s(N.E5, N.G4, N.G2, 'SNARE'), s(N.D5, N.B4, N.B2, 'HAT'),
      s(N.C5, N.E4, N.C3, 'CRASH', 2.4), s(null, N.G4, N.G2, 'HAT'), s(N.G4, N.D4, N.C3, 'SNARE'), s(N.G4, N.B3, N.G2, 'HAT'),
    ],
  },
  bgm_elms_lab: {
    id: 'bgm_elms_lab', bpm: 144, duty1: 0.25, duty2: 0.5,
    steps: [
      s(N.E5, N.Cs5, N.A2, 'KICK'), s(N.Cs5, N.A4, N.E3, 'HAT'), s(N.A4, N.E4, N.A3, 'SNARE'), s(N.B4, N.Gs4, N.E3, 'HAT'),
      s(N.Cs5, N.A4, N.Fs2, 'KICK'), s(N.D5, N.B4, N.Cs3, 'HAT'), s(N.E5, N.Cs5, N.Fs3, 'SNARE'), s(N.Fs5, N.D5, N.Cs3, 'HAT'),
      s(N.E5, N.B4, N.B2, 'KICK', 1.6), s(N.D5, N.Fs4, N.Fs3, 'HAT'), s(N.B4, N.D4, N.B2, 'SNARE'), s(N.D5, N.Fs4, N.D3, 'HAT'),
      s(N.E5, N.Gs4, N.E2, 'KICK', 2.2), s(null, N.B4, N.B2, 'HAT'), s(N.E4, N.Gs4, N.E3, 'SNARE'), s(N.Gs4, N.B4, N.B2, 'HAT'),
      s(N.A5, N.Cs5, N.A2, 'KICK'), s(N.Gs5, N.B4, N.E3, 'HAT'), s(N.Fs5, N.A4, N.Fs2, 'SNARE'), s(N.E5, N.Cs5, N.Cs3, 'HAT'),
      s(N.Fs5, N.D5, N.D3, 'KICK'), s(N.A5, N.Fs5, N.A2, 'HAT'), s(N.Fs5, N.D5, N.D3, 'SNARE'), s(N.D5, N.A4, N.F3, 'HAT'),
      s(N.Cs5, N.A4, N.E3, 'KICK'), s(N.E5, N.Cs5, N.B2, 'HAT'), s(N.B4, N.Gs4, N.E2, 'SNARE'), s(N.Gs4, N.E4, N.B2, 'HAT'),
      s(N.A4, N.Cs4, N.A2, 'KICK', 2.4), s(null, N.E4, N.E3, 'HAT'), s(N.B4, N.D4, N.A2, 'SNARE'), s(N.Cs5, N.E4, N.E2, 'HAT'),
    ],
  },
  bgm_wild_battle: {
    id: 'bgm_wild_battle', bpm: 178, duty1: 0.25, duty2: 0.125,
    steps: [
      s(N.C5, N.G4, N.C2, 'CRASH', 1, N.Cs5), s(N.Cs5, N.Gs4, N.C3, 'HAT'), s(N.D5, N.A4, N.C2, 'SNARE'), s(N.Ds5, N.As4, N.C3, 'HAT'),
      s(N.E5, N.B4, N.C2, 'KICK'), s(N.F5, N.C5, N.C3, 'HAT'), s(N.Fs5, N.Cs5, N.C2, 'SNARE'), s(N.G5, N.D5, N.G2, 'HAT'),
      s(N.G5, N.Ds5, N.C2, 'KICK', 1.7), s(N.F5, N.D5, N.C3, 'HAT'), s(N.Ds5, N.C5, N.G2, 'SNARE'), s(N.D5, N.As4, N.C3, 'HAT'),
      s(N.C5, N.Gs4, N.C2, 'KICK', 1.8), s(N.Ds5, N.C5, N.C3, 'HAT'), s(N.G5, N.Ds5, N.G2, 'SNARE'), s(N.C6, N.G5, N.C3, 'HAT'),
      s(N.Gs5, N.F5, N.F2, 'KICK', 1.7), s(N.G5, N.Ds5, N.F3, 'HAT'), s(N.F5, N.Cs5, N.C3, 'SNARE'), s(N.Ds5, N.C5, N.F3, 'HAT'),
      s(N.D5, N.B4, N.G2, 'KICK', 2.2), s(N.G4, N.D4, N.G3, 'HAT'), s(N.B4, N.F4, N.D3, 'SNARE'), s(N.D5, N.G4, N.G2, 'HAT'),
      s(N.C5, N.Ds4, N.C2, 'KICK'), s(N.Ds5, N.G4, N.C3, 'HAT'), s(N.D5, N.F4, N.As2, 'SNARE'), s(N.As4, N.D4, N.F2, 'HAT'),
      s(N.C5, N.G4, N.C2, 'KICK', 1.8), s(N.G4, N.Ds4, N.G2, 'HAT'), s(N.Ds5, N.C5, N.C3, 'SNARE'), s(N.D5, N.B4, N.G2, 'CRASH'),
    ],
  },
  bgm_trainer_battle: {
    id: 'bgm_trainer_battle', bpm: 182, duty1: 0.25, duty2: 0.25,
    steps: [
      s(N.A5, N.F5, N.D2, 'CRASH', 1, N.D5), s(N.D5, N.A4, N.D3, 'HAT'), s(N.F5, N.D5, N.D2, 'SNARE'), s(N.A5, N.F5, N.D3, 'HAT'),
      s(N.As5, N.G5, N.G2, 'KICK'), s(N.A5, N.F5, N.G3, 'HAT'), s(N.G5, N.E5, N.A2, 'SNARE'), s(N.E5, N.Cs5, N.A3, 'HAT'),
      s(N.D5, N.A4, N.D2, 'KICK', 1.6), s(N.E5, N.Cs5, N.D3, 'HAT'), s(N.F5, N.D5, N.D2, 'SNARE', 1.6), s(N.G5, N.E5, N.D3, 'HAT'),
      s(N.A5, N.F5, N.F2, 'KICK', 1.8), s(N.D6, N.A5, N.F3, 'HAT'), s(N.C6, N.G5, N.C3, 'SNARE'), s(N.A5, N.F5, N.F2, 'HAT'),
      s(N.As5, N.F5, N.As2, 'KICK', 1.7), s(N.A5, N.F5, N.F3, 'HAT'), s(N.G5, N.D5, N.As2, 'SNARE'), s(N.F5, N.D5, N.F3, 'HAT'),
      s(N.G5, N.Ds5, N.G2, 'KICK', 1.7), s(N.F5, N.D5, N.D3, 'HAT'), s(N.E5, N.C5, N.G2, 'SNARE'), s(N.D5, N.As4, N.G3, 'HAT'),
      s(N.Cs5, N.A4, N.A2, 'KICK'), s(N.E5, N.Cs5, N.E3, 'HAT'), s(N.G5, N.E5, N.A2, 'SNARE'), s(N.A5, N.G5, N.E3, 'HAT'),
      s(N.As5, N.G5, N.A2, 'KICK'), s(N.A5, N.F5, N.E3, 'HAT'), s(N.G5, N.E5, N.A2, 'SNARE'), s(N.E5, N.Cs5, N.E2, 'CRASH'),
    ],
  },
  bgm_gym_leader_battle: {
    id: 'bgm_gym_leader_battle', bpm: 188, duty1: 0.25, duty2: 0.125,
    steps: [
      s(N.E5, N.B4, N.E2, 'CRASH', 1, N.B5), s(N.B4, N.G4, N.E3, 'HAT'), s(N.E5, N.B4, N.E2, 'SNARE'), s(N.Fs5, N.D5, N.E3, 'HAT'),
      s(N.G5, N.E5, N.E2, 'KICK', 1.7), s(N.Fs5, N.D5, N.E3, 'HAT'), s(N.E5, N.B4, N.D2, 'SNARE'), s(N.D5, N.A4, N.D3, 'HAT'),
      s(N.C5, N.G4, N.C2, 'KICK'), s(N.E5, N.C5, N.C3, 'HAT'), s(N.G5, N.E5, N.C2, 'SNARE'), s(N.B5, N.G5, N.C3, 'HAT'),
      s(N.A5, N.Fs5, N.D2, 'KICK', 1.7), s(N.G5, N.E5, N.D3, 'HAT'), s(N.Fs5, N.D5, N.D2, 'SNARE'), s(N.D5, N.A4, N.D3, 'CRASH'),
      s(N.B5, N.G5, N.E2, 'KICK', 1.7), s(N.C6, N.A5, N.E3, 'HAT'), s(N.B5, N.G5, N.E2, 'SNARE'), s(N.A5, N.Fs5, N.E3, 'HAT'),
      s(N.G5, N.E5, N.C2, 'KICK', 1.7), s(N.Fs5, N.D5, N.C3, 'HAT'), s(N.E5, N.C5, N.A2, 'SNARE'), s(N.G5, N.E5, N.A3, 'HAT'),
      s(N.Fs5, N.Ds5, N.B2, 'KICK', 1.7), s(N.B4, N.Fs4, N.Fs2, 'HAT'), s(N.Ds5, N.B4, N.B2, 'SNARE'), s(N.Fs5, N.Ds5, N.Fs3, 'HAT'),
      s(N.B5, N.Fs5, N.B2, 'KICK'), s(N.A5, N.Fs5, N.A2, 'HAT'), s(N.G5, N.E5, N.G2, 'SNARE'), s(N.Fs5, N.Ds5, N.Fs2, 'CRASH'),
    ],
  },
  bgm_evolution: {
    id: 'bgm_evolution', bpm: 160, duty1: 0.25, duty2: 0.125,
    steps: [
      s(N.C5, N.E4, N.C3, 'KICK'), s(N.G4, N.C4, null, 'HAT'), s(N.C5, N.E4, N.C3, 'SNARE'), s(N.G4, N.C4, null, 'HAT'),
      s(N.C5, N.F4, N.D3, 'KICK'), s(N.G4, N.D4, null, 'HAT'), s(N.C5, N.F4, N.D3, 'SNARE'), s(N.G4, N.D4, null, 'HAT'),
      s(N.C5, N.G4, N.E3, 'KICK'), s(N.G4, N.E4, null, 'HAT'), s(N.C5, N.G4, N.E3, 'SNARE'), s(N.G4, N.E4, null, 'HAT'),
      s(N.C5, N.A4, N.F3, 'KICK'), s(N.G4, N.F4, null, 'HAT'), s(N.C5, N.A4, N.F3, 'SNARE'), s(N.G4, N.F4, null, 'HAT'),
      s(N.Cs5, N.F4, N.Cs3, 'KICK'), s(N.Gs4, N.Cs4, null, 'HAT'), s(N.Cs5, N.F4, N.Cs3, 'SNARE'), s(N.Gs4, N.Cs4, null, 'HAT'),
      s(N.Cs5, N.Fs4, N.Ds3, 'KICK'), s(N.Gs4, N.Ds4, null, 'HAT'), s(N.Cs5, N.Fs4, N.Ds3, 'SNARE'), s(N.Gs4, N.Ds4, null, 'HAT'),
      s(N.D5, N.B4, N.G3, 'KICK'), s(N.G4, N.D4, N.D3, 'HAT'), s(N.D5, N.B4, N.G3, 'SNARE'), s(N.G4, N.D4, N.D3, 'HAT'),
      s(N.F5, N.B4, N.G2, 'KICK'), s(N.D5, N.G4, N.B2, 'HAT'), s(N.B4, N.F4, N.D3, 'SNARE'), s(N.G4, N.D4, N.G3, 'CRASH'),
    ],
  },
  bgm_game_corner: {
    id: 'bgm_game_corner', bpm: 164, duty1: 0.25, duty2: 0.5,
    steps: [
      s(N.F5, N.A4, N.F2, 'KICK'), s(N.D5, N.As4, N.C3, 'HAT'), s(N.C5, N.A4, N.F3, 'SNARE'), s(N.A4, N.F4, N.C3, 'HAT'),
      s(N.As4, N.G4, N.G2, 'KICK'), s(N.D5, N.As4, N.D3, 'HAT'), s(N.G5, N.E5, N.C3, 'SNARE'), s(N.E5, N.C5, N.G2, 'HAT'),
      s(N.F5, N.A4, N.F2, 'KICK'), s(N.G5, N.As4, N.C3, 'HAT'), s(N.A5, N.C5, N.F3, 'SNARE'), s(N.C6, N.F5, N.A2, 'HAT'),
      s(N.As5, N.D5, N.As2, 'KICK'), s(N.A5, N.C5, N.F2, 'HAT'), s(N.G5, N.E5, N.C3, 'SNARE'), s(N.C5, N.G4, N.G2, 'HAT'),
      s(N.D5, N.As4, N.As2, 'KICK'), s(N.F5, N.D5, N.F3, 'HAT'), s(N.As5, N.F5, N.B2, 'SNARE'), s(N.Gs5, N.D5, N.F3, 'HAT'),
      s(N.A5, N.C5, N.C3, 'KICK'), s(N.F5, N.A4, N.A2, 'HAT'), s(N.D5, N.B4, N.D3, 'SNARE'), s(N.B4, N.Gs4, N.Gs2, 'HAT'),
      s(N.G5, N.B4, N.G2, 'KICK'), s(N.E5, N.G4, N.D3, 'HAT'), s(N.C5, N.E4, N.C3, 'SNARE'), s(N.E5, N.As4, N.E3, 'HAT'),
      s(N.F5, N.A4, N.F2, 'KICK', 1.9), s(null, N.C5, N.C3, 'HAT'), s(N.C5, N.A4, N.F3, 'SNARE'), s(N.E5, N.As4, N.C3, 'CRASH'),
    ],
  },
};
