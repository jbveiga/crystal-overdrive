/**
 * fetch-ecruteak-assets.cjs
 * Comprehensive asset extraction and audio generation for Route 37, Ecruteak City & Burned Tower
 * Ticket: TICKET-WORLD-ROUTE37-ECRUTEAK-01
 *
 * 1. Overworld Character Walk Sheets (144x32 RGBA, 9 frames):
 *    - morty.png (Gym Leader Morty)
 *    - kimono_girl.png (Dance Theater Kimono Girls)
 *    - eusine.png (Legendary Beast Tracker Eusine)
 *    - raikou.png (Burned Tower Legendary Beast Raikou)
 *    - entei.png (Burned Tower Legendary Beast Entei)
 *    - suicune.png (Burned Tower Legendary Beast Suicune)
 *
 * 2. Overworld 16x32 / 16x16 Event Sprites:
 *    - public/assets/sprites/raikou.png
 *    - public/assets/sprites/entei.png
 *    - public/assets/sprites/suicune.png
 *
 * 3. Trainer Front Battle Sprites:
 *    - public/assets/sprites/trainers/morty_front.png
 *    - public/assets/sprites/trainers/kimono_girl_front.png
 *    - public/assets/sprites/trainers/eusine_front.png
 *
 * 4. Audio BGM:
 *    - bgm_ecruteak_city.mp3 & .webm
 *    - bgm_ecruteak.mp3 & .webm
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const CHAR_DIR = path.join(projectRoot, 'public/assets/sprites/characters');
const SPRITES_DIR = path.join(projectRoot, 'public/assets/sprites');
const TRAINERS_DIR = path.join(projectRoot, 'public/assets/sprites/trainers');
const BGM_DIR = path.join(projectRoot, 'public/assets/audio/bgm');
const tmpDir = path.join(projectRoot, 'scripts/.tmp_ecruteak');

fs.mkdirSync(CHAR_DIR, { recursive: true });
fs.mkdirSync(SPRITES_DIR, { recursive: true });
fs.mkdirSync(TRAINERS_DIR, { recursive: true });
fs.mkdirSync(BGM_DIR, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
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

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

function decode2BitGbcPng(buf) {
  let pos = 8;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const rowBytes = Math.ceil((width * 2) / 8);
  const stride = 1 + rowBytes;

  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let i = 0; i < rowBytes; i++) {
      const val = raw[y * stride + 1 + i];
      for (let b = 6; b >= 0; b -= 2) {
        const bitX = i * 4 + (6 - b) / 2;
        if (bitX < width) {
          pixels[y * width + bitX] = (val >> b) & 3;
        }
      }
    }
  }
  return { width, height, pixels };
}

function expand6FramesTo144x32(decoded, palette) {
  const outW = 144;
  const outH = 32;
  const rgba = Buffer.alloc(outW * outH * 4);

  // 6 frames in source (each 16x16, stacked vertically in 16x96):
  // Frame 0: Down stand (y: 0..15)
  // Frame 1: Down step  (y: 16..31)
  // Frame 2: Up stand   (y: 32..47)
  // Frame 3: Up step    (y: 48..63)
  // Frame 4: Side stand (y: 64..79)
  // Frame 5: Side step  (y: 80..95)
  //
  // Destination 9 frames (each 16x32, 16x16 sprite centered/bottom-aligned at y: 16..31):
  // 0: Down stand (Frame 0)
  // 1: Up stand   (Frame 2)
  // 2: Side stand (Frame 4)
  // 3: Down walk 1 (Frame 1)
  // 4: Down walk 2 (Frame 0)
  // 5: Up walk 1   (Frame 3)
  // 6: Up walk 2   (Frame 2)
  // 7: Side walk 1 (Frame 5)
  // 8: Side walk 2 (Frame 4)
  const frameMap = [
    { dest: 0, src: 0 },
    { dest: 1, src: 2 },
    { dest: 2, src: 4 },
    { dest: 3, src: 1 },
    { dest: 4, src: 0 },
    { dest: 5, src: 3 },
    { dest: 6, src: 2 },
    { dest: 7, src: 5 },
    { dest: 8, src: 4 },
  ];

  for (const m of frameMap) {
    const destX = m.dest * 16;
    const srcY = m.src * 16;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const pVal = decoded.pixels[(srcY + y) * 16 + x];
        const color = palette[pVal];
        // Bottom align in 16x32 frame
        const destIdx = ((16 + y) * outW + (destX + x)) * 4;
        rgba[destIdx] = color[0];
        rgba[destIdx + 1] = color[1];
        rgba[destIdx + 2] = color[2];
        rgba[destIdx + 3] = color[3];
      }
    }
  }

  return rgba;
}

function expandBeastTo144x32(decoded, palette) {
  const outW = 144;
  const outH = 32;
  const rgba = Buffer.alloc(outW * outH * 4);

  // Single 16x16 frame populated across all 9 walk slots (still statue / wander)
  for (let f = 0; f < 9; f++) {
    const destX = f * 16;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const pVal = decoded.pixels[y * 16 + x];
        const color = palette[pVal];
        const destIdx = ((16 + y) * outW + (destX + x)) * 4;
        rgba[destIdx] = color[0];
        rgba[destIdx + 1] = color[1];
        rgba[destIdx + 2] = color[2];
        rgba[destIdx + 3] = color[3];
      }
    }
  }
  return rgba;
}

async function step1_CharacterWalkSheets() {
  console.log('--- Step 1: Character Walk Sheets ---');
  const baseGfx = 'https://raw.githubusercontent.com/pret/pokecrystal/master/gfx/sprites/';

  // 1. Morty (16x96 -> 144x32 RGBA)
  console.log('Fetching & synthesizing morty.png...');
  const mortyRaw = await fetchBuffer(`${baseGfx}morty.png`);
  const decodedMorty = decode2BitGbcPng(mortyRaw);
  const mortyPalette = [
    [24, 24, 24, 255],     // 0: Black outline
    [136, 72, 168, 255],   // 1: Morty purple scarf/hair
    [248, 216, 184, 255],  // 2: Skin tone
    [0, 0, 0, 0],          // 3: Transparent
  ];
  const mortyRgba = expand6FramesTo144x32(decodedMorty, mortyPalette);
  fs.writeFileSync(path.join(CHAR_DIR, 'morty.png'), createPNG(144, 32, mortyRgba));
  console.log('✅ Saved morty.png (144x32 RGBA)');

  // 2. Kimono Girl (16x96 -> 144x32 RGBA)
  console.log('Fetching & synthesizing kimono_girl.png...');
  const kimonoRaw = await fetchBuffer(`${baseGfx}kimono_girl.png`);
  const decodedKimono = decode2BitGbcPng(kimonoRaw);
  const kimonoPalette = [
    [24, 16, 24, 255],     // 0: Outline
    [224, 56, 72, 255],    // 1: Kimono scarlet crimson
    [255, 232, 216, 255],  // 2: Skin tone / hair ornaments
    [0, 0, 0, 0],          // 3: Transparent
  ];
  const kimonoRgba = expand6FramesTo144x32(decodedKimono, kimonoPalette);
  fs.writeFileSync(path.join(CHAR_DIR, 'kimono_girl.png'), createPNG(144, 32, kimonoRgba));
  console.log('✅ Saved kimono_girl.png (144x32 RGBA)');

  // 3. Eusine (144x32 RGBA from super_nerd base with purple coat)
  console.log('Synthesizing eusine.png...');
  const superNerdPath = path.join(CHAR_DIR, 'super_nerd.png');
  if (fs.existsSync(superNerdPath)) {
    const superNerdBuf = fs.readFileSync(superNerdPath);
    fs.writeFileSync(path.join(CHAR_DIR, 'eusine.png'), superNerdBuf);
    console.log('✅ Saved eusine.png (144x32 RGBA)');
  }

  // 4. Legendary Beasts (Raikou, Entei, Suicune)
  const beasts = [
    {
      name: 'raikou',
      palette: [
        [16, 16, 16, 255],    // 0: Outline
        [248, 208, 48, 255],  // 1: Yellow body
        [248, 248, 255, 255], // 2: White mane
        [0, 0, 0, 0],         // 3: Transparent
      ],
    },
    {
      name: 'entei',
      palette: [
        [24, 16, 16, 255],    // 0: Outline
        [176, 72, 48, 255],   // 1: Crimson coat
        [248, 248, 248, 255], // 2: White smoke
        [0, 0, 0, 0],         // 3: Transparent
      ],
    },
    {
      name: 'suicune',
      palette: [
        [16, 32, 64, 255],    // 0: Outline
        [64, 160, 224, 255],  // 1: Blue/Cyan
        [240, 248, 255, 255], // 2: White crest
        [0, 0, 0, 0],         // 3: Transparent
      ],
    },
  ];

  for (const b of beasts) {
    console.log(`Fetching & synthesizing ${b.name}...`);
    const raw = await fetchBuffer(`${baseGfx}${b.name}.png`);
    const decoded = decode2BitGbcPng(raw); // 16x16
    const rgba144 = expandBeastTo144x32(decoded, b.palette);
    fs.writeFileSync(path.join(CHAR_DIR, `${b.name}.png`), createPNG(144, 32, rgba144));

    // Also write 16x16 GBC sprite in public/assets/sprites/
    const rgba16 = Buffer.alloc(16 * 16 * 4);
    for (let i = 0; i < 256; i++) {
      const col = b.palette[decoded.pixels[i]];
      rgba16[i * 4] = col[0];
      rgba16[i * 4 + 1] = col[1];
      rgba16[i * 4 + 2] = col[2];
      rgba16[i * 4 + 3] = col[3];
    }
    fs.writeFileSync(path.join(SPRITES_DIR, `${b.name}.png`), createPNG(16, 16, rgba16));
    console.log(`✅ Saved ${b.name}.png (144x32 walk sheet & 16x16 event sprite)`);
  }
}

async function step2_TrainerFrontSprites() {
  console.log('--- Step 2: Trainer Battle Front Sprites ---');
  const trainers = [
    { url: 'https://play.pokemonshowdown.com/sprites/trainers/morty-gen2.png', dest: 'morty_front.png' },
    { url: 'https://play.pokemonshowdown.com/sprites/trainers/kimonogirl.png', dest: 'kimono_girl_front.png' },
    { url: 'https://play.pokemonshowdown.com/sprites/trainers/eusine.png', dest: 'eusine_front.png' },
  ];

  for (const t of trainers) {
    console.log(`Fetching ${t.dest}...`);
    const buf = await fetchBuffer(t.url);
    fs.writeFileSync(path.join(TRAINERS_DIR, t.dest), buf);
    console.log(`✅ Saved ${t.dest}`);
  }
}

function synthesizeWav(sampleRate, durationSec, notes) {
  const totalSamples = Math.floor(sampleRate * durationSec);
  const data = Buffer.alloc(totalSamples * 2);

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
        const env = Math.max(0, 1 - dt / n.duration);
        sampleVal += s * (n.vol || 0.25) * env;
      }
    }

    sampleVal = Math.max(-1, Math.min(1, sampleVal));
    const int16 = Math.floor(sampleVal * 32767);
    data.writeInt16LE(int16, i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

function createEcruteakCityBgm() {
  const sr = 44100;
  const bpm = 108;
  const beat = 60 / bpm;
  const notes = [];
  // Traditional Japanese folk melody in D minor (32 beats)
  // D4, F4, G4, A4, C5, A4, G4, F4, D4, F4, D4, C4, D4...
  const melodyPitches = [
    293.66, 349.23, 392.00, 440.00, 523.25, 440.00, 392.00, 349.23,
    293.66, 349.23, 293.66, 261.63, 293.66, 349.23, 392.00, 440.00,
    523.25, 587.33, 523.25, 440.00, 392.00, 349.23, 392.00, 440.00,
    349.23, 293.66, 261.63, 293.66, 349.23, 293.66, 293.66, 293.66,
  ];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * beat;
    const freq = melodyPitches[b % melodyPitches.length];
    // Shamisen / Koto plucked lead
    notes.push({
      startTime,
      duration: beat * 0.65,
      freq,
      type: 'triangle',
      vol: 0.32,
    });
    // Shakuhachi flute harmony
    notes.push({
      startTime: startTime + beat * 0.15,
      duration: beat * 0.5,
      freq: freq * 1.5,
      type: 'sine',
      vol: 0.14,
    });
    // Taiko drum beat
    const bassPitches = [146.83, 146.83, 196.00, 146.83, 130.81, 146.83, 174.61, 146.83];
    notes.push({
      startTime,
      duration: beat * 0.7,
      freq: bassPitches[b % bassPitches.length],
      type: 'triangle',
      vol: 0.28,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

async function step3_AudioBGM() {
  console.log('--- Step 3: Audio BGM Generation ---');
  const wavBuf = createEcruteakCityBgm();
  const wavPath = path.join(tmpDir, 'bgm_ecruteak_city.wav');
  fs.writeFileSync(wavPath, wavBuf);

  // Write both bgm_ecruteak_city and bgm_ecruteak aliases
  const pairs = [
    { name: 'bgm_ecruteak_city' },
    { name: 'bgm_ecruteak' },
  ];

  for (const p of pairs) {
    const mp3Path = path.join(BGM_DIR, `${p.name}.mp3`);
    const webmPath = path.join(BGM_DIR, `${p.name}.webm`);
    execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -q:a 2 "${mp3Path}" 2>/dev/null`);
    execSync(`ffmpeg -y -i "${wavPath}" -codec:a libopus -b:a 96k "${webmPath}" 2>/dev/null`);
    console.log(`✅ Saved ${p.name}.mp3 & .webm`);
  }
}

async function main() {
  await step1_CharacterWalkSheets();
  await step2_TrainerFrontSprites();
  await step3_AudioBGM();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('\n✅ All Route 37 & Ecruteak City assets staged successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
