const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const BGM_DIR = path.join(projectRoot, 'public/assets/audio/bgm');
const tmpDir = path.join(projectRoot, 'scripts/.tmp_bgm');

if (!fs.existsSync(BGM_DIR)) fs.mkdirSync(BGM_DIR, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

function synthesizeWav(sampleRate, durationSec, notes) {
  const totalSamples = Math.floor(sampleRate * durationSec);
  const data = Buffer.alloc(totalSamples * 2); // 16-bit mono

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sampleVal = 0;

    for (const n of notes) {
      if (t >= n.startTime && t < n.startTime + n.duration) {
        const dt = t - n.startTime;
        let s = 0;
        const phase = 2 * Math.PI * n.freq * dt;
        if (n.type === 'square') {
          s = Math.sin(phase) >= 0 ? 1 : -1;
        } else if (n.type === 'triangle') {
          s = (2 / Math.PI) * Math.asin(Math.sin(phase));
        } else {
          s = Math.sin(phase);
        }
        // Envelope: short attack, smooth release
        const env = Math.max(0, 1 - dt / n.duration);
        sampleVal += s * (n.vol || 0.25) * env;
      }
    }

    sampleVal = Math.max(-1, Math.min(1, sampleVal));
    const int16 = Math.floor(sampleVal * 32767);
    data.writeInt16LE(int16, i * 2);
  }

  // Build standard WAV header (44 bytes)
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  header.writeUInt16LE(2, 32); // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

const sr = 44100;

// 1. New Bark Town (Pastoral, gentle acoustic melody in G major, 100 BPM)
function createNewBarkTown() {
  const bpm = 100;
  const beat = 60 / bpm;
  const notes = [];
  // G4, B4, D5, E5, D5, B4, A4, G4, E4, D4, G4, B4, A4, G4...
  const melodyPitches = [392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0, 329.63, 293.66, 392.0, 493.88, 440.0, 392.0, 440.0, 392.0];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * beat;
    const freq = melodyPitches[b % melodyPitches.length];
    notes.push({
      startTime,
      duration: beat * 0.85,
      freq,
      type: 'triangle',
      vol: 0.3,
    });
    // Harmony voice
    notes.push({
      startTime,
      duration: beat * 0.7,
      freq: freq * 0.75,
      type: 'sine',
      vol: 0.18,
    });
    // Bass counterpoint (G2 / C3 / D3 progression)
    if (b % 2 === 0) {
      const bassFreq = b % 8 < 4 ? 98.0 : 130.81; // G2 or C3
      notes.push({
        startTime,
        duration: beat * 1.8,
        freq: bassFreq,
        type: 'square',
        vol: 0.16,
      });
    }
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

// 2. Route 29 (Upbeat, energetic morning march in C major, 122 BPM)
function createRoute29() {
  const bpm = 122;
  const beat = 60 / bpm;
  const notes = [];
  // C5, E5, G5, A5, G5, E5, F5, D5, C5, D5, E5, C5...
  const melodyPitches = [523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 698.46, 587.33, 523.25, 587.33, 659.25, 523.25, 587.33, 659.25, 587.33, 523.25];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * beat;
    const freq = melodyPitches[b % melodyPitches.length];
    notes.push({
      startTime,
      duration: beat * 0.45,
      freq,
      type: 'square',
      vol: 0.25,
    });
    // Staccato march bass
    const bassFreq = b % 4 === 0 ? 130.81 : b % 4 === 2 ? 164.81 : 196.0;
    notes.push({
      startTime,
      duration: beat * 0.35,
      freq: bassFreq,
      type: 'triangle',
      vol: 0.22,
    });
    // 8th-note pulse
    notes.push({
      startTime: startTime + beat * 0.5,
      duration: beat * 0.3,
      freq: freq * 1.25,
      type: 'square',
      vol: 0.14,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

// 3. Cherrygrove City (Breezy coastal waltz / gentle swing, 96 BPM)
function createCherrygroveCity() {
  const bpm = 96;
  const beat = 60 / bpm;
  const notes = [];
  // F4, A4, C5, D5, C5, A4, Bb4, G4, F4, G4, A4, F4...
  const melodyPitches = [349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 466.16, 392.0, 349.23, 392.0, 440.0, 349.23, 392.0, 440.0, 392.0, 349.23];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * beat;
    const freq = melodyPitches[b % melodyPitches.length];
    notes.push({
      startTime,
      duration: beat * 0.8,
      freq,
      type: 'triangle',
      vol: 0.28,
    });
    // Warm Sine chord pad
    notes.push({
      startTime,
      duration: beat * 0.9,
      freq: freq * 0.5,
      type: 'sine',
      vol: 0.2,
    });
    // Light bass step
    if (b % 2 === 0) {
      notes.push({
        startTime,
        duration: beat * 1.6,
        freq: 174.61, // F3
        type: 'square',
        vol: 0.15,
      });
    }
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

// 4. Elm's Lab (Inquisitive, techno-research arpeggios, 134 BPM)
function createElmsLab() {
  const bpm = 134;
  const beat = 60 / bpm;
  const notes = [];
  const arpeggio = [440.0, 554.37, 659.25, 880.0, 659.25, 554.37, 440.0, 329.63];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    for (let sub = 0; sub < 2; sub++) {
      const startTime = (b * 2 + sub) * beat * 0.5;
      const freq = arpeggio[(b * 2 + sub) % arpeggio.length];
      notes.push({
        startTime,
        duration: beat * 0.38,
        freq,
        type: 'square',
        vol: 0.22,
      });
    }
    // Driving pulse
    notes.push({
      startTime: b * beat,
      duration: beat * 0.5,
      freq: 110.0, // A2
      type: 'triangle',
      vol: 0.25,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

// 5. Wild Battle (High-intensity driving chromatic Johto battle theme, 156 BPM)
function createWildBattle() {
  const bpm = 156;
  const beat = 60 / bpm;
  const notes = [];
  const leadPitches = [440.0, 466.16, 493.88, 523.25, 587.33, 523.25, 493.88, 466.16];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    // 16th-note relentless bass drive
    for (let s = 0; s < 4; s++) {
      const startTime = (b * 4 + s) * beat * 0.25;
      const bassFreq = s % 2 === 0 ? 110.0 : 220.0;
      notes.push({
        startTime,
        duration: beat * 0.2,
        freq: bassFreq,
        type: 'square',
        vol: 0.24,
      });
    }
    // Cutting lead melody
    const startTime = b * beat;
    const freq = leadPitches[b % leadPitches.length];
    notes.push({
      startTime,
      duration: beat * 0.4,
      freq: freq * 2,
      type: 'square',
      vol: 0.28,
    });
    notes.push({
      startTime: startTime + beat * 0.5,
      duration: beat * 0.35,
      freq: freq * 1.5,
      type: 'triangle',
      vol: 0.2,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

// 6. Trainer Battle (Tense, rhythmic Johto trainer encounter theme, 152 BPM)
function createTrainerBattle() {
  const bpm = 152;
  const beat = 60 / bpm;
  const notes = [];
  const brassPitches = [523.25, 554.37, 587.33, 659.25, 698.46, 659.25, 587.33, 554.37];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    // Ostinato driving bass
    for (let s = 0; s < 2; s++) {
      const startTime = (b * 2 + s) * beat * 0.5;
      notes.push({
        startTime,
        duration: beat * 0.35,
        freq: s === 0 ? 130.81 : 196.0,
        type: 'square',
        vol: 0.26,
      });
    }
    // Brass stabs
    const startTime = b * beat;
    const freq = brassPitches[b % brassPitches.length];
    notes.push({
      startTime,
      duration: beat * 0.3,
      freq,
      type: 'square',
      vol: 0.3,
    });
    notes.push({
      startTime: startTime + beat * 0.35,
      duration: beat * 0.25,
      freq: freq * 1.25,
      type: 'square',
      vol: 0.22,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

const tracks = [
  { name: 'bgm_new_bark_town', fn: createNewBarkTown },
  { name: 'bgm_route_29', fn: createRoute29 },
  { name: 'bgm_cherrygrove_city', fn: createCherrygroveCity },
  { name: 'bgm_elms_lab', fn: createElmsLab },
  { name: 'bgm_wild_battle', fn: createWildBattle },
  { name: 'bgm_trainer_battle', fn: createTrainerBattle },
];

for (const t of tracks) {
  const wavBuf = t.fn();
  const wavPath = path.join(tmpDir, `${t.name}.wav`);
  fs.writeFileSync(wavPath, wavBuf);

  const mp3Path = path.join(BGM_DIR, `${t.name}.mp3`);
  const webmPath = path.join(BGM_DIR, `${t.name}.webm`);

  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -q:a 2 "${mp3Path}" 2>/dev/null`);
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libopus -b:a 96k "${webmPath}" 2>/dev/null`);

  console.log(`Generated seamless BGM: ${t.name}.mp3 & .webm`);
}

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('✅ All 6 requested BGM tracks generated successfully!');
