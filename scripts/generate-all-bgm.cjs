const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const BGM_DIR = path.join(projectRoot, 'public/assets/audio/bgm');
const tmpDir = path.join(projectRoot, 'scripts/.tmp_bgm');

if (!fs.existsSync(BGM_DIR)) fs.mkdirSync(BGM_DIR, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const sr = 44100;

const NOTE = {
  C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
  C6: 1046.50, Cs6: 1108.73, D6: 1174.66, Ds6: 1244.51, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, G6: 1567.98, A6: 1760.00,
};

const PATTERNS = {
  bgm_new_bark_town: {
    bpm: 136,
    duty1: 0.5,
    duty2: 0.25,
    steps: [
      { pulse1: NOTE.Fs5, sustain1: 1.8, pulse2: NOTE.A4, wave: NOTE.D3, noise: null },
      { pulse1: null, pulse2: NOTE.D5, wave: NOTE.A3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.Fs3, noise: null },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.A3, noise: 'HAT' },
      { pulse1: NOTE.A4, sustain1: 2.6, pulse2: NOTE.Fs4, wave: NOTE.D3, noise: null },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.A3, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.D5, wave: NOTE.D3, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.G4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.D5, sustain1: 1.8, pulse2: NOTE.B4, wave: NOTE.G2, noise: null },
      { pulse1: null, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: null },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 2.8, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: null },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.A4, pulse2: NOTE.G4, wave: NOTE.A3, noise: null },
      { pulse1: NOTE.Cs5, pulse2: NOTE.E4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, sustain1: 1.8, pulse2: NOTE.Fs4, wave: NOTE.D3, noise: null },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.A3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.Fs3, noise: null },
      { pulse1: NOTE.A5, pulse2: NOTE.Fs5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 1.8, pulse2: NOTE.B4, wave: NOTE.B2, noise: null },
      { pulse1: null, pulse2: NOTE.D5, wave: NOTE.Fs3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.B3, noise: null },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.Fs3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 1.8, pulse2: NOTE.G4, wave: NOTE.E2, noise: null },
      { pulse1: null, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.Cs5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, sustain1: 1.9, pulse2: NOTE.Fs4, wave: NOTE.D3, noise: null },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'HAT' },
    ],
  },
  bgm_route_29: {
    bpm: 150,
    duty1: 0.25,
    duty2: 0.5,
    steps: [
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 1.6, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.C6, sustain1: 1.7, pulse2: NOTE.E5, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.A5, sustain1: 1.6, pulse2: NOTE.C5, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 1.8, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.B4, pulse2: NOTE.G4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.Cs5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.G4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.C5, sustain1: 2.5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.G4, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.G2, noise: 'HAT' },
    ],
  },
  bgm_cherrygrove_city: {
    bpm: 140,
    duty1: 0.5,
    duty2: 0.25,
    steps: [
      { pulse1: NOTE.C5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.As4, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.As4, pulse2: NOTE.D4, wave: NOTE.As2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.As4, wave: NOTE.As2, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 2.2, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.C6, sustain1: 1.7, pulse2: NOTE.F5, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.D5, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.As4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.As4, pulse2: NOTE.D4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.As4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.F5, sustain1: 2.6, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.F2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'HAT' },
    ],
  },
  bgm_violet_city: {
    bpm: 124,
    duty1: 0.25,
    duty2: 0.5,
    steps: [
      { pulse1: NOTE.B4, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'KICK' },
      { pulse1: NOTE.E5, sustain1: 1.8, pulse2: NOTE.B4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: null },
      { pulse1: NOTE.Fs5, sustain1: 1.8, pulse2: NOTE.D5, wave: NOTE.B2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.Fs3, noise: null },
      { pulse1: NOTE.B4, sustain1: 1.8, pulse2: NOTE.Fs4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.Fs2, noise: null },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G2, noise: null },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Fs5, sustain1: 1.8, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.A5, sustain1: 1.8, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.C5, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.B5, sustain1: 1.8, pulse2: NOTE.D5, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.D3, noise: null },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.E5, sustain1: 1.8, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G2, noise: null },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: NOTE.A4, pulse2: NOTE.C4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.Fs4, wave: NOTE.Fs2, noise: null },
      { pulse1: NOTE.E5, sustain1: 2.8, pulse2: NOTE.G4, wave: NOTE.E2, noise: 'SNARE' },
      { pulse1: null, pulse2: NOTE.B4, wave: NOTE.B2, noise: null },
      { pulse1: null, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.B2, noise: null },
    ],
  },
  bgm_sprout_tower: {
    bpm: 110,
    duty1: 0.125,
    duty2: 0.25,
    steps: [
      { pulse1: NOTE.E5, sustain1: 1.9, pulse2: NOTE.B3, wave: NOTE.E2, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.E4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.F5, pulse2: NOTE.B3, wave: NOTE.E2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.E4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.B4, sustain1: 1.9, pulse2: NOTE.F4, wave: NOTE.E2, noise: 'SNARE' },
      { pulse1: null, pulse2: NOTE.E4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.C5, pulse2: NOTE.B3, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.E4, wave: NOTE.E2, noise: null },
      { pulse1: NOTE.A4, sustain1: 1.9, pulse2: NOTE.C4, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.E4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.E5, sustain1: 2.8, pulse2: NOTE.A4, wave: NOTE.E2, noise: 'SNARE' },
      { pulse1: null, pulse2: NOTE.F4, wave: NOTE.B2, noise: null },
      { pulse1: null, pulse2: NOTE.E4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B3, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.A5, sustain1: 1.9, pulse2: NOTE.C5, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.E5, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.C3, noise: null },
      { pulse1: NOTE.D5, sustain1: 1.9, pulse2: NOTE.F4, wave: NOTE.D2, noise: 'SNARE' },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.E2, noise: null },
      { pulse1: NOTE.A4, pulse2: NOTE.C4, wave: NOTE.F2, noise: 'KICK' },
      { pulse1: NOTE.F4, pulse2: NOTE.A3, wave: NOTE.C3, noise: null },
      { pulse1: NOTE.E4, sustain1: 3.5, pulse2: NOTE.B3, wave: NOTE.E2, noise: 'SNARE' },
      { pulse1: null, pulse2: NOTE.E4, wave: NOTE.B2, noise: null },
      { pulse1: null, pulse2: NOTE.F4, wave: NOTE.E2, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.E4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.E2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.B2, noise: null },
    ],
  },
  bgm_goldenrod_city: {
    bpm: 152,
    duty1: 0.25,
    duty2: 0.5,
    steps: [
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.A5, sustain1: 1.8, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.A5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.C6, pulse2: NOTE.Fs5, wave: NOTE.Fs3, noise: 'HAT' },
      { pulse1: NOTE.B5, sustain1: 2.2, pulse2: NOTE.G5, wave: NOTE.G3, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.B5, pulse2: NOTE.E5, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.A5, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 2.6, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'HAT' },
    ],
  },
  bgm_ecruteak_city: {
    bpm: 118,
    duty1: 0.25,
    duty2: 0.125,
    steps: [
      { pulse1: NOTE.A4, pulse2: NOTE.D4, wave: NOTE.D3, noise: null },
      { pulse1: NOTE.D5, sustain1: 1.8, pulse2: NOTE.F4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.A4, wave: NOTE.D3, noise: null },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 1.8, pulse2: NOTE.C5, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.A4, pulse2: NOTE.C4, wave: NOTE.E2, noise: 'HAT' },
      { pulse1: NOTE.As4, sustain1: 1.8, pulse2: NOTE.D4, wave: NOTE.G2, noise: null },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.As4, wave: NOTE.G3, noise: null },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 2.5, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: null },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.A4, pulse2: NOTE.E4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.Cs5, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.D3, noise: null },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.A5, sustain1: 1.8, pulse2: NOTE.D5, wave: NOTE.As2, noise: null },
      { pulse1: NOTE.G5, pulse2: NOTE.D5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.As4, wave: NOTE.G2, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.G2, noise: null },
      { pulse1: NOTE.As4, pulse2: NOTE.D4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.A4, pulse2: NOTE.D4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.Cs5, pulse2: NOTE.E4, wave: NOTE.E2, noise: 'HAT' },
      { pulse1: NOTE.D5, sustain1: 2.8, pulse2: NOTE.F4, wave: NOTE.D2, noise: null },
      { pulse1: null, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.D5, wave: NOTE.D3, noise: null },
      { pulse1: NOTE.F4, pulse2: NOTE.A3, wave: NOTE.A2, noise: 'HAT' },
    ],
  },
  bgm_national_park: {
    bpm: 116,
    duty1: 0.5,
    duty2: 0.25,
    steps: [
      { pulse1: NOTE.Gs4, pulse2: NOTE.E4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.Gs4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 1.9, pulse2: NOTE.B4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Fs5, pulse2: NOTE.B4, wave: NOTE.Gs3, noise: 'HAT' },
      { pulse1: NOTE.Gs5, sustain1: 1.9, pulse2: NOTE.E5, wave: NOTE.Cs3, noise: null },
      { pulse1: NOTE.Fs5, pulse2: NOTE.Gs4, wave: NOTE.Gs2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.Cs3, noise: null },
      { pulse1: NOTE.B4, pulse2: NOTE.Gs4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.Cs5, sustain1: 1.9, pulse2: NOTE.A4, wave: NOTE.Fs2, noise: null },
      { pulse1: NOTE.A4, pulse2: NOTE.Fs4, wave: NOTE.Cs3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.Cs5, wave: NOTE.Fs3, noise: null },
      { pulse1: NOTE.E5, pulse2: NOTE.A4, wave: NOTE.Cs3, noise: 'HAT' },
      { pulse1: NOTE.Ds5, sustain1: 2.6, pulse2: NOTE.B4, wave: NOTE.B2, noise: null },
      { pulse1: null, pulse2: NOTE.Fs4, wave: NOTE.Fs2, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.A4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.Cs5, pulse2: NOTE.Fs4, wave: NOTE.Ds3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Gs4, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Gs5, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.B5, sustain1: 1.9, pulse2: NOTE.E5, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Gs5, pulse2: NOTE.B4, wave: NOTE.Gs2, noise: 'HAT' },
      { pulse1: NOTE.A5, sustain1: 1.9, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.Fs5, pulse2: NOTE.C5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.A2, noise: null },
      { pulse1: NOTE.C5, pulse2: NOTE.Fs4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.Gs4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.Gs5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.B2, noise: null },
      { pulse1: NOTE.Ds5, pulse2: NOTE.Fs4, wave: NOTE.Fs2, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 2.8, pulse2: NOTE.Gs4, wave: NOTE.E2, noise: null },
      { pulse1: null, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: null, pulse2: NOTE.E5, wave: NOTE.E3, noise: null },
      { pulse1: NOTE.Fs4, pulse2: NOTE.Ds4, wave: NOTE.B2, noise: 'HAT' },
    ],
  },
  bgm_gym: {
    bpm: 146,
    duty1: 0.25,
    duty2: 0.25,
    steps: [
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.C4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 1.8, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.As4, pulse2: NOTE.D4, wave: NOTE.As2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.F2, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.As4, wave: NOTE.As2, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 2.2, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'CRASH' },
      { pulse1: null, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G4, pulse2: NOTE.B3, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.C5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.C5, sustain1: 2.4, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'CRASH' },
      { pulse1: null, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.B3, wave: NOTE.G2, noise: 'HAT' },
    ],
  },
  bgm_elms_lab: {
    bpm: 144,
    duty1: 0.25,
    duty2: 0.5,
    steps: [
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.A4, pulse2: NOTE.E4, wave: NOTE.A3, noise: 'SNARE' },
      { pulse1: NOTE.B4, pulse2: NOTE.Gs4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.A4, wave: NOTE.Fs2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.Cs3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.Fs3, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.Cs3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 1.6, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.Fs3, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.B2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.Fs4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, sustain1: 2.2, pulse2: NOTE.Gs4, wave: NOTE.E2, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.E4, pulse2: NOTE.Gs4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.Gs4, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.A5, pulse2: NOTE.Cs5, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: NOTE.Gs5, pulse2: NOTE.B4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.A4, wave: NOTE.Fs2, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.Cs3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.Fs5, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.A4, wave: NOTE.E3, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.Gs4, wave: NOTE.E2, noise: 'SNARE' },
      { pulse1: NOTE.Gs4, pulse2: NOTE.E4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.A4, sustain1: 2.4, pulse2: NOTE.Cs4, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.E4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.D4, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.E4, wave: NOTE.E2, noise: 'HAT' },
    ],
  },
  bgm_wild_battle: {
    bpm: 178,
    duty1: 0.25,
    duty2: 0.125,
    steps: [
      { pulse1: NOTE.C5, pulse1SweepTo: NOTE.Cs5, pulse2: NOTE.G4, wave: NOTE.C2, noise: 'CRASH' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.Gs4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.C2, noise: 'SNARE' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.B4, wave: NOTE.C2, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.Cs5, wave: NOTE.C2, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.D5, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 1.7, pulse2: NOTE.Ds5, wave: NOTE.C2, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.C5, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.C5, sustain1: 1.8, pulse2: NOTE.Gs4, wave: NOTE.C2, noise: 'KICK' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.Ds5, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.C6, pulse2: NOTE.G5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.Gs5, sustain1: 1.7, pulse2: NOTE.F5, wave: NOTE.F2, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.Ds5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.Cs5, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.C5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.D5, sustain1: 2.2, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.Ds4, wave: NOTE.C2, noise: 'KICK' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.G4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.F4, wave: NOTE.As2, noise: 'SNARE' },
      { pulse1: NOTE.As4, pulse2: NOTE.D4, wave: NOTE.F2, noise: 'HAT' },
      { pulse1: NOTE.C5, sustain1: 1.8, pulse2: NOTE.G4, wave: NOTE.C2, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.Ds4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'CRASH' },
    ],
  },
  bgm_trainer_battle: {
    bpm: 182,
    duty1: 0.25,
    duty2: 0.25,
    steps: [
      { pulse1: NOTE.A5, pulse1SweepTo: NOTE.D5, pulse2: NOTE.F5, wave: NOTE.D2, noise: 'CRASH' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.D2, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.F5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.As5, pulse2: NOTE.G5, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.F5, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.A3, noise: 'HAT' },
      { pulse1: NOTE.D5, sustain1: 1.6, pulse2: NOTE.A4, wave: NOTE.D2, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.F5, sustain1: 1.6, pulse2: NOTE.D5, wave: NOTE.D2, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.A5, sustain1: 1.8, pulse2: NOTE.F5, wave: NOTE.F2, noise: 'KICK' },
      { pulse1: NOTE.D6, pulse2: NOTE.A5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.C6, pulse2: NOTE.G5, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.F5, wave: NOTE.F2, noise: 'HAT' },
      { pulse1: NOTE.As5, sustain1: 1.7, pulse2: NOTE.F5, wave: NOTE.As2, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.F5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.D5, wave: NOTE.As2, noise: 'SNARE' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 1.7, pulse2: NOTE.Ds5, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.G3, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.G5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.As5, pulse2: NOTE.G5, wave: NOTE.A2, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.F5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.Cs5, wave: NOTE.E2, noise: 'CRASH' },
    ],
  },
  bgm_gym_leader_battle: {
    bpm: 188,
    duty1: 0.25,
    duty2: 0.125,
    steps: [
      { pulse1: NOTE.E5, pulse1SweepTo: NOTE.B5, pulse2: NOTE.B4, wave: NOTE.E2, noise: 'CRASH' },
      { pulse1: NOTE.B4, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.B4, wave: NOTE.E2, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 1.7, pulse2: NOTE.E5, wave: NOTE.E2, noise: 'KICK' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.B4, wave: NOTE.D2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.C2, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.C2, noise: 'SNARE' },
      { pulse1: NOTE.B5, pulse2: NOTE.G5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.A5, sustain1: 1.7, pulse2: NOTE.Fs5, wave: NOTE.D2, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.D2, noise: 'SNARE' },
      { pulse1: NOTE.D5, pulse2: NOTE.A4, wave: NOTE.D3, noise: 'CRASH' },
      { pulse1: NOTE.B5, sustain1: 1.7, pulse2: NOTE.G5, wave: NOTE.E2, noise: 'KICK' },
      { pulse1: NOTE.C6, pulse2: NOTE.A5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.B5, pulse2: NOTE.G5, wave: NOTE.E2, noise: 'SNARE' },
      { pulse1: NOTE.A5, pulse2: NOTE.Fs5, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.G5, sustain1: 1.7, pulse2: NOTE.E5, wave: NOTE.C2, noise: 'KICK' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.D5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.A2, noise: 'SNARE' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.A3, noise: 'HAT' },
      { pulse1: NOTE.Fs5, sustain1: 1.7, pulse2: NOTE.Ds5, wave: NOTE.B2, noise: 'KICK' },
      { pulse1: NOTE.B4, pulse2: NOTE.Fs4, wave: NOTE.Fs2, noise: 'HAT' },
      { pulse1: NOTE.Ds5, pulse2: NOTE.B4, wave: NOTE.B2, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.Ds5, wave: NOTE.Fs3, noise: 'HAT' },
      { pulse1: NOTE.B5, pulse2: NOTE.Fs5, wave: NOTE.B2, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.Fs5, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.G2, noise: 'SNARE' },
      { pulse1: NOTE.Fs5, pulse2: NOTE.Ds5, wave: NOTE.Fs2, noise: 'CRASH' },
    ],
  },
  bgm_evolution: {
    bpm: 160,
    duty1: 0.25,
    duty2: 0.125,
    steps: [
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.C4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.C4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.E4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.E3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.E4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.F4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.F4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.F4, wave: NOTE.Cs3, noise: 'KICK' },
      { pulse1: NOTE.Gs4, pulse2: NOTE.Cs4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.F4, wave: NOTE.Cs3, noise: 'SNARE' },
      { pulse1: NOTE.Gs4, pulse2: NOTE.Cs4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.Fs4, wave: NOTE.Ds3, noise: 'KICK' },
      { pulse1: NOTE.Gs4, pulse2: NOTE.Ds4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.Cs5, pulse2: NOTE.Fs4, wave: NOTE.Ds3, noise: 'SNARE' },
      { pulse1: NOTE.Gs4, pulse2: NOTE.Ds4, wave: null, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'KICK' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.G3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.G4, wave: NOTE.B2, noise: 'HAT' },
      { pulse1: NOTE.B4, pulse2: NOTE.F4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.G4, pulse2: NOTE.D4, wave: NOTE.G3, noise: 'CRASH' },
    ],
  },
  bgm_game_corner: {
    bpm: 164,
    duty1: 0.25,
    duty2: 0.5,
    steps: [
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: NOTE.A4, pulse2: NOTE.F4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.As4, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.C5, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.F2, noise: 'KICK' },
      { pulse1: NOTE.G5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: NOTE.C6, pulse2: NOTE.F5, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.As5, pulse2: NOTE.D5, wave: NOTE.As2, noise: 'KICK' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.F2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.E5, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.C5, pulse2: NOTE.G4, wave: NOTE.G2, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.As4, wave: NOTE.As2, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.D5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.As5, pulse2: NOTE.F5, wave: NOTE.B2, noise: 'SNARE' },
      { pulse1: NOTE.Gs5, pulse2: NOTE.D5, wave: NOTE.F3, noise: 'HAT' },
      { pulse1: NOTE.A5, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'KICK' },
      { pulse1: NOTE.F5, pulse2: NOTE.A4, wave: NOTE.A2, noise: 'HAT' },
      { pulse1: NOTE.D5, pulse2: NOTE.B4, wave: NOTE.D3, noise: 'SNARE' },
      { pulse1: NOTE.B4, pulse2: NOTE.Gs4, wave: NOTE.Gs2, noise: 'HAT' },
      { pulse1: NOTE.G5, pulse2: NOTE.B4, wave: NOTE.G2, noise: 'KICK' },
      { pulse1: NOTE.E5, pulse2: NOTE.G4, wave: NOTE.D3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.E4, wave: NOTE.C3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.As4, wave: NOTE.E3, noise: 'HAT' },
      { pulse1: NOTE.F5, sustain1: 1.9, pulse2: NOTE.A4, wave: NOTE.F2, noise: 'KICK' },
      { pulse1: null, pulse2: NOTE.C5, wave: NOTE.C3, noise: 'HAT' },
      { pulse1: NOTE.C5, pulse2: NOTE.A4, wave: NOTE.F3, noise: 'SNARE' },
      { pulse1: NOTE.E5, pulse2: NOTE.As4, wave: NOTE.C3, noise: 'CRASH' },
    ],
  },
};

function renderPatternToWav(pattern) {
  const stepSec = 60 / pattern.bpm / 2; // 8th-note steps
  const totalSteps = pattern.steps.length * 2; // 2 passes (64 steps) for rich loop length
  const durationSec = totalSteps * stepSec;
  const totalSamples = Math.floor(sr * durationSec);
  const floatBuf = new Float32Array(totalSamples);

  const duty1 = pattern.duty1 || 0.25;
  const duty2 = pattern.duty2 || 0.5;

  const addTone = (startTime, dur, freq, endFreq, kind, duty, vol) => {
    const startSample = Math.max(0, Math.floor(startTime * sr));
    const endSample = Math.min(totalSamples, Math.floor((startTime + dur) * sr));
    const len = endSample - startSample;
    if (len <= 0) return;

    let phase = 0;
    for (let i = 0; i < len; i++) {
      const dt = i / sr;
      const progress = i / len;
      let instFreq = freq;
      if (endFreq && endFreq > 0) {
        instFreq = freq * Math.pow(endFreq / freq, Math.min(1, progress / 0.7));
      } else if (kind === 'pulse' && dt > 0.12) {
        // Subtle Game Boy hardware pitch vibrato on sustained lead notes
        instFreq = freq * (1 + 0.0045 * Math.sin(2 * Math.PI * 5.8 * (dt - 0.12)));
      }

      phase += instFreq / sr;
      const p = phase - Math.floor(phase);
      let s = 0;
      if (kind === 'pulse') {
        s = p < duty ? 1.0 : -1.0;
      } else if (kind === 'wave') {
        // 4-bit quantized Game Boy Wave RAM triangle-bass waveform
        const tri = p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
        s = Math.round(tri * 7.5) / 7.5;
      }

      // Crisp GBC DAC volume envelope
      const attack = Math.min(1, dt / 0.004);
      const decay = Math.pow(1 - progress, kind === 'wave' ? 0.55 : 0.75);
      floatBuf[startSample + i] += s * vol * attack * decay;
    }
  };

  const addNoise = (startTime, noiseType) => {
    let dur = 0.04;
    let clockHz = 3000;
    let vol = 0.09;
    let metallic = false;
    if (noiseType === 'KICK') {
      dur = 0.055;
      clockHz = 240;
      vol = 0.15;
      metallic = true;
    } else if (noiseType === 'SNARE') {
      dur = 0.075;
      clockHz = 1350;
      vol = 0.13;
    } else if (noiseType === 'HAT') {
      dur = 0.026;
      clockHz = 4800;
      vol = 0.075;
    } else if (noiseType === 'CRASH') {
      dur = 0.15;
      clockHz = 2400;
      vol = 0.14;
    }

    const startSample = Math.max(0, Math.floor(startTime * sr));
    const endSample = Math.min(totalSamples, Math.floor((startTime + dur) * sr));
    const len = endSample - startSample;
    if (len <= 0) return;

    let lfsr = 0x7fff;
    const samplesPerStep = Math.max(1, Math.floor(sr / (clockHz * 4)));
    let currentBit = 1;

    for (let i = 0; i < len; i++) {
      if (i % samplesPerStep === 0) {
        const xorBit = (lfsr & 1) ^ ((lfsr >> 1) & 1);
        lfsr = (lfsr >> 1) | (xorBit << 14);
        if (metallic) {
          lfsr = (lfsr & ~(1 << 6)) | (xorBit << 6);
        }
        currentBit = (lfsr & 1) === 0 ? 1.0 : -1.0;
      }
      const env = Math.pow(1 - i / len, 1.4);
      floatBuf[startSample + i] += currentBit * vol * env;
    }
  };

  for (let stepIdx = 0; stepIdx < totalSteps; stepIdx++) {
    const step = pattern.steps[stepIdx % pattern.steps.length];
    const startTime = stepIdx * stepSec;

    if (step.pulse1 && step.pulse1 > 0) {
      addTone(
        startTime,
        stepSec * (step.sustain1 || 0.88),
        step.pulse1,
        step.pulse1SweepTo,
        'pulse',
        duty1,
        0.22
      );
    }
    if (step.pulse2 && step.pulse2 > 0) {
      addTone(
        startTime,
        stepSec * (step.sustain2 || 0.82),
        step.pulse2,
        null,
        'pulse',
        duty2,
        0.14
      );
    }
    if (step.wave && step.wave > 0) {
      addTone(
        startTime,
        stepSec * (step.sustainWave || 0.92),
        step.wave,
        null,
        'wave',
        0.5,
        0.24
      );
    }
    if (step.noise) {
      addNoise(startTime, step.noise);
    }
  }

  // Gentle 1-pole RC lowpass filter (emulating Game Boy Color analog output stage)
  const data = Buffer.alloc(totalSamples * 2);
  let prev = 0;
  const alpha = 0.42;
  for (let i = 0; i < totalSamples; i++) {
    const filtered = prev + alpha * (floatBuf[i] - prev);
    prev = filtered;
    const clamped = Math.max(-0.98, Math.min(0.98, filtered));
    data.writeInt16LE(Math.floor(clamped * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sr, 24);
  header.writeUInt32LE(sr * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

const trackEntries = Object.entries(PATTERNS);
// Also include bgm_ecruteak alias for backward compatibility
trackEntries.push(['bgm_ecruteak', PATTERNS.bgm_ecruteak_city]);

for (const [name, pattern] of trackEntries) {
  const wavBuf = renderPatternToWav(pattern);
  const wavPath = path.join(tmpDir, `${name}.wav`);
  fs.writeFileSync(wavPath, wavBuf);

  const mp3Path = path.join(BGM_DIR, `${name}.mp3`);
  const webmPath = path.join(BGM_DIR, `${name}.webm`);

  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -q:a 2 "${mp3Path}" 2>/dev/null`);
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libopus -b:a 96k "${webmPath}" 2>/dev/null`);

  console.log(`Generated authentic Gen 2 GBC BGM: ${name}.mp3 & .webm`);
}

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`✅ All ${trackEntries.length} Gen 2 BGM tracks generated successfully!`);
