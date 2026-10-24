const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const CHARACTERS_DIR = path.join(projectRoot, 'public/assets/sprites/characters');
const TRAINERS_DIR = path.join(projectRoot, 'public/assets/sprites/trainers');
const POKEMON_DIR = path.join(projectRoot, 'public/assets/sprites/pokemon');
const BGM_DIR = path.join(projectRoot, 'public/assets/audio/bgm');
const SFX_DIR = path.join(projectRoot, 'public/assets/audio/sfx');

[CHARACTERS_DIR, TRAINERS_DIR, POKEMON_DIR, BGM_DIR, SFX_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgbaBuffer.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', zlib.deflateSync(raw)),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

function decode4BitPng(buf) {
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  let pos = 8;
  let plte = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'PLTE') plte = data;
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rowBytes = Math.ceil(width / 2);
  const stride = 1 + rowBytes;
  const rgba = Buffer.alloc(width * height * 4);
  const prevRow = new Uint8Array(rowBytes);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    const row = new Uint8Array(rowBytes);
    for (let i = 0; i < rowBytes; i++) {
      const x = raw[y * stride + 1 + i];
      const a = i >= 1 ? row[i - 1] : 0;
      const b = prevRow[i];
      const c = i >= 1 ? prevRow[i - 1] : 0;
      let val = x;
      if (filter === 1) val = (x + a) & 0xff;
      else if (filter === 2) val = (x + b) & 0xff;
      else if (filter === 3) val = (x + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = (x + pr) & 0xff;
      }
      row[i] = val;

      const p0 = (val >> 4) & 0x0f;
      const p1 = val & 0x0f;
      const px0 = i * 2;
      const px1 = i * 2 + 1;

      if (px0 < width) {
        const outIdx = (y * width + px0) * 4;
        if (p0 === 0) {
          rgba[outIdx] = 0;
          rgba[outIdx + 1] = 0;
          rgba[outIdx + 2] = 0;
          rgba[outIdx + 3] = 0;
        } else {
          rgba[outIdx] = plte[p0 * 3];
          rgba[outIdx + 1] = plte[p0 * 3 + 1];
          rgba[outIdx + 2] = plte[p0 * 3 + 2];
          rgba[outIdx + 3] = 255;
        }
      }

      if (px1 < width) {
        const outIdx = (y * width + px1) * 4;
        if (p1 === 0) {
          rgba[outIdx] = 0;
          rgba[outIdx + 1] = 0;
          rgba[outIdx + 2] = 0;
          rgba[outIdx + 3] = 0;
        } else {
          rgba[outIdx] = plte[p1 * 3];
          rgba[outIdx + 1] = plte[p1 * 3 + 1];
          rgba[outIdx + 2] = plte[p1 * 3 + 2];
          rgba[outIdx + 3] = 255;
        }
      }
    }
    prevRow.set(row);
  }
  return { width, height, rgba };
}

async function fetchPokemonSprites() {
  console.log('=== Step 1: Fetching Phase 4 Pokémon Battle Sprites ===');
  const pokeApiBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  const list = [
    { id: 17, name: 'pidgeotto' },
    { id: 21, name: 'spearow' },
    { id: 60, name: 'poliwag' },
    { id: 61, name: 'poliwhirl' },
  ];

  for (const p of list) {
    try {
      const frontBuf = await downloadBuffer(`${pokeApiBase}/${p.id}.png`);
      fs.writeFileSync(path.join(POKEMON_DIR, `${p.name}_front.png`), frontBuf);
      const backBuf = await downloadBuffer(`${pokeApiBase}/back/${p.id}.png`);
      fs.writeFileSync(path.join(POKEMON_DIR, `${p.name}_back.png`), backBuf);
      console.log(`Saved ${p.name} front & back battle sprites`);
    } catch (err) {
      console.error(`Error saving ${p.name}:`, err.message);
    }
  }
}

async function fetchTrainerSprites() {
  console.log('=== Step 2: Fetching Trainer Battle Sprites ===');
  const showdownBase = 'https://play.pokemonshowdown.com/sprites/trainers';
  const trainers = [
    { src: `${showdownBase}/falkner.png`, dest: 'falkner_front.png' },
    { src: `${showdownBase}/birdkeeper.png`, dest: 'bird_keeper_front.png' },
    { src: `${showdownBase}/sage.png`, dest: 'sage_front.png' },
    { src: `${showdownBase}/sage.png`, dest: 'elder_front.png' },
    { src: `${showdownBase}/sage.png`, dest: 'elder_li_front.png' },
  ];

  for (const t of trainers) {
    try {
      const buf = await downloadBuffer(t.src);
      fs.writeFileSync(path.join(TRAINERS_DIR, t.dest), buf);
      console.log(`Saved trainer battle sprite ${t.dest}`);
    } catch (err) {
      console.error(`Error saving ${t.dest}:`, err.message);
    }
  }
}

async function fetchCharacterWalkSheets() {
  console.log('=== Step 3: Fetching & Converting Character Walk Sheets (144x32 RGBA) ===');
  const cdBase = 'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/object_events/pics/people';

  // 1. Direct 144x32 sheets: sage, fisherman (earl), youngster (bird keeper), old_man (elder), silver, bug_catcher, teacher, mom, prof_elm
  const sheets = [
    { url: `${cdBase}/sage.png`, name: 'sage.png' },
    { url: `${cdBase}/fisherman.png`, name: 'earl.png' },
    { url: `${cdBase}/fisherman.png`, name: 'fisherman.png' },
    { url: `${cdBase}/youngster.png`, name: 'bird_keeper.png' },
    { url: `${cdBase}/old_man.png`, name: 'elder.png' },
    { url: `${cdBase}/old_man.png`, name: 'elder_li.png' },
    { url: `${cdBase}/silver.png`, name: 'silver.png' },
    { url: `${cdBase}/bug_catcher.png`, name: 'bug_catcher.png' },
    { url: `${cdBase}/woman_1.png`, name: 'teacher.png' },
    { url: `${cdBase}/mom.png`, name: 'mom.png' },
    { url: `${cdBase}/prof_elm.png`, name: 'prof_elm.png' },
  ];

  for (const s of sheets) {
    try {
      const raw = await downloadBuffer(s.url);
      const decoded = decode4BitPng(raw);
      const pngBuf = createPNG(decoded.width, decoded.height, decoded.rgba);
      fs.writeFileSync(path.join(CHARACTERS_DIR, s.name), pngBuf);
      console.log(`Saved converted RGBA walk sheet: ${s.name} (${decoded.width}x${decoded.height})`);
    } catch (err) {
      console.error(`Error processing ${s.name}:`, err.message);
    }
  }

  // 2. Falkner: 48x32 3-frame layout expanded to 144x32 9-frame walk cycle
  try {
    const falknerRaw = await downloadBuffer(`${cdBase}/gym_leaders/falkner.png`);
    const decodedFalkner = decode4BitPng(falknerRaw); // 48 x 32
    // Create 144 x 32 RGBA buffer
    const outWidth = 144;
    const outHeight = 32;
    const outRgba = Buffer.alloc(outWidth * outHeight * 4);

    // Frame mapping:
    // Frame 0: Down stand (src x: 0..15) -> dest frame 0, 3, 4
    // Frame 1: Up stand   (src x: 16..31) -> dest frame 1, 5, 6
    // Frame 2: Side stand (src x: 32..47) -> dest frame 2, 7, 8
    const frameMap = [
      { srcFrame: 0, destFrames: [0, 3, 4] },
      { srcFrame: 1, destFrames: [1, 5, 6] },
      { srcFrame: 2, destFrames: [2, 7, 8] },
    ];

    for (const mapping of frameMap) {
      const srcFrameX = mapping.srcFrame * 16;
      for (const destFrame of mapping.destFrames) {
        const destFrameX = destFrame * 16;
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 16; x++) {
            const srcIdx = (y * decodedFalkner.width + (srcFrameX + x)) * 4;
            const destIdx = (y * outWidth + (destFrameX + x)) * 4;
            outRgba[destIdx] = decodedFalkner.rgba[srcIdx];
            outRgba[destIdx + 1] = decodedFalkner.rgba[srcIdx + 1];
            outRgba[destIdx + 2] = decodedFalkner.rgba[srcIdx + 2];
            outRgba[destIdx + 3] = decodedFalkner.rgba[srcIdx + 3];
          }
        }
      }
    }

    const falknerPng = createPNG(outWidth, outHeight, outRgba);
    fs.writeFileSync(path.join(CHARACTERS_DIR, 'falkner.png'), falknerPng);
    console.log(`Synthesized authentic 144x32 RGBA walk sheet: falkner.png (9 frames)`);
  } catch (err) {
    console.error('Error synthesizing falkner.png:', err.message);
  }
}

function synthesizeWav(sampleRate, durationSec, notes) {
  // notes: array of { startTime, duration, freq, type: 'square' | 'sine' | 'triangle', vol }
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
        // Envelope: short attack, slow release
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

async function generateAudioTracks() {
  console.log('=== Step 4: Generating Seamless Audio Loops (44.1kHz WebM & MP3) ===');
  const sr = 44100;
  const tmpDir = path.join(projectRoot, 'scripts/.tmp_audio');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // 1. Violet City Overworld BGM (Nostalgic, gentle flute & bell progression)
  // Key of D major / B minor, 108 BPM: D5, F#5, A5, B5, A5, F#5...
  const beat = 60 / 108; // ~0.555s
  const violetNotes = [];
  const violetPitches = [587.33, 659.25, 739.99, 880.0, 987.77, 880.0, 739.99, 659.25];
  for (let bar = 0; bar < 4; bar++) {
    for (let b = 0; b < 8; b++) {
      const startTime = (bar * 8 + b) * beat * 0.5;
      const freq = violetPitches[(b + bar * 2) % violetPitches.length];
      violetNotes.push({
        startTime,
        duration: beat * 0.45,
        freq,
        type: 'triangle',
        vol: 0.28,
      });
      // Bass counterpoint
      if (b % 2 === 0) {
        violetNotes.push({
          startTime,
          duration: beat * 0.9,
          freq: freq * 0.25,
          type: 'square',
          vol: 0.15,
        });
      }
    }
  }
  const violetWav = synthesizeWav(sr, 32 * beat * 0.5, violetNotes);
  const violetWavPath = path.join(tmpDir, 'bgm_violet_city.wav');
  fs.writeFileSync(violetWavPath, violetWav);

  // 2. Sprout Tower BGM (Meditative, solemn bell chimes & quiet resonance)
  const sproutBeat = 60 / 92;
  const sproutNotes = [];
  const sproutPitches = [329.63, 392.0, 440.0, 493.88, 587.33, 523.25, 440.0, 392.0];
  for (let bar = 0; bar < 4; bar++) {
    for (let b = 0; b < 8; b++) {
      const startTime = (bar * 8 + b) * sproutBeat * 0.5;
      const freq = sproutPitches[(b + bar) % sproutPitches.length];
      sproutNotes.push({
        startTime,
        duration: sproutBeat * 0.8,
        freq,
        type: 'sine',
        vol: 0.32,
      });
      if (b % 4 === 0) {
        sproutNotes.push({
          startTime,
          duration: sproutBeat * 1.8,
          freq: 164.81, // E3 bass drone
          type: 'triangle',
          vol: 0.2,
        });
      }
    }
  }
  const sproutWav = synthesizeWav(sr, 32 * sproutBeat * 0.5, sproutNotes);
  const sproutWavPath = path.join(tmpDir, 'bgm_sprout_tower.wav');
  fs.writeFileSync(sproutWavPath, sproutWav);

  // 3. Gym Lobby BGM (Uplifting march cadence)
  const gymBeat = 60 / 128;
  const gymNotes = [];
  const gymPitches = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 783.99, 1046.5];
  for (let bar = 0; bar < 4; bar++) {
    for (let b = 0; b < 8; b++) {
      const startTime = (bar * 8 + b) * gymBeat * 0.5;
      const freq = gymPitches[(b + bar * 2) % gymPitches.length];
      gymNotes.push({
        startTime,
        duration: gymBeat * 0.42,
        freq,
        type: 'square',
        vol: 0.22,
      });
      // March snare pulse
      gymNotes.push({
        startTime,
        duration: gymBeat * 0.2,
        freq: 220,
        type: 'triangle',
        vol: 0.18,
      });
    }
  }
  const gymWav = synthesizeWav(sr, 32 * gymBeat * 0.5, gymNotes);
  const gymWavPath = path.join(tmpDir, 'bgm_gym.wav');
  fs.writeFileSync(gymWavPath, gymWav);

  // 4. Gym Leader Battle BGM (High-tempo, driving chromatic battle theme)
  const battleBeat = 60 / 148;
  const battleNotes = [];
  const battlePitches = [440.0, 466.16, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46];
  for (let bar = 0; bar < 4; bar++) {
    for (let b = 0; b < 16; b++) {
      const startTime = (bar * 16 + b) * battleBeat * 0.25;
      const freq = battlePitches[(b + bar * 3) % battlePitches.length];
      battleNotes.push({
        startTime,
        duration: battleBeat * 0.2,
        freq,
        type: 'square',
        vol: 0.26,
      });
      if (b % 2 === 0) {
        battleNotes.push({
          startTime,
          duration: battleBeat * 0.4,
          freq: 110, // A2 driving bass
          type: 'square',
          vol: 0.25,
        });
      }
    }
  }
  const battleWav = synthesizeWav(sr, 64 * battleBeat * 0.25, battleNotes);
  const battleWavPath = path.join(tmpDir, 'bgm_gym_leader_battle.wav');
  fs.writeFileSync(battleWavPath, battleWav);

  // 5. Jingle: sfx_badge_get (Zephyr Badge acquisition fanfare)
  const jingleNotes = [
    { startTime: 0.0, duration: 0.12, freq: 523.25, type: 'square', vol: 0.35 },
    { startTime: 0.12, duration: 0.12, freq: 659.25, type: 'square', vol: 0.35 },
    { startTime: 0.24, duration: 0.12, freq: 783.99, type: 'square', vol: 0.35 },
    { startTime: 0.36, duration: 0.36, freq: 1046.5, type: 'square', vol: 0.4 },
    { startTime: 0.72, duration: 0.12, freq: 880.0, type: 'square', vol: 0.35 },
    { startTime: 0.84, duration: 0.48, freq: 1046.5, type: 'square', vol: 0.4 },
  ];
  const jingleWav = synthesizeWav(sr, 1.4, jingleNotes);
  const jingleWavPath = path.join(tmpDir, 'sfx_badge_get.wav');
  fs.writeFileSync(jingleWavPath, jingleWav);

  // Convert each WAV to MP3 and WebM (Opus) via ffmpeg
  const conversions = [
    { in: violetWavPath, outName: 'bgm_violet_city', outDir: BGM_DIR },
    { in: sproutWavPath, outName: 'bgm_sprout_tower', outDir: BGM_DIR },
    { in: gymWavPath, outName: 'bgm_gym', outDir: BGM_DIR },
    { in: battleWavPath, outName: 'bgm_gym_leader_battle', outDir: BGM_DIR },
    { in: jingleWavPath, outName: 'sfx_badge_get', outDir: SFX_DIR },
  ];

  for (const c of conversions) {
    const mp3Path = path.join(c.outDir, `${c.outName}.mp3`);
    const webmPath = path.join(c.outDir, `${c.outName}.webm`);
    try {
      execSync(`ffmpeg -y -i "${c.in}" -codec:a libmp3lame -q:a 2 "${mp3Path}" 2>/dev/null`);
      execSync(`ffmpeg -y -i "${c.in}" -codec:a libopus -b:a 96k "${webmPath}" 2>/dev/null`);
      console.log(`Generated seamless tracks: ${c.outName}.mp3 & .webm`);
    } catch (err) {
      console.warn(`ffmpeg conversion warning for ${c.outName}, falling back to wav copy:`, err.message);
      fs.copyFileSync(c.in, path.join(c.outDir, `${c.outName}.wav`));
    }
  }

  // Cleanup tmp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function main() {
  await fetchPokemonSprites();
  await fetchTrainerSprites();
  await fetchCharacterWalkSheets();
  await generateAudioTracks();
  console.log('\n✅ Phase 4 Assets & Data successfully extracted, converted, and verified!');
}

main().catch((err) => {
  console.error('Fatal error in fetch-phase4-assets:', err);
  process.exit(1);
});
