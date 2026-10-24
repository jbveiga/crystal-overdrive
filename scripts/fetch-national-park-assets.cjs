/**
 * fetch-national-park-assets.cjs
 * Comprehensive asset extraction and audio generation for Route 35, National Park, & Route 36 Sudowoodo.
 * Ticket: TICKET-WORLD-ROUTE35-NATIONAL-PARK-01
 *
 * 1. Character Walk Sheets (144x32 RGBA):
 *    - firebreather.png
 *    - psychic_m.png & psychic.png
 *    - school_kid_m.png & schoolboy.png
 *    - super_nerd.png & juggler.png
 *
 * 2. Key Items & Equipment Icons:
 *    - tm_fighting.png / tm-fighting.png / tm08.png
 *    - quick_claw.png / quick-claw.png
 *    - sun_stone.png / sun-stone.png
 *    - park_ball.png / park-ball.png / parkball.png
 *
 * 3. Audio / Cry:
 *    - bgm_national_park.mp3 / .webm
 *    - audio/cries/185.mp3 / .ogg / sudowoodo.mp3
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const CHAR_DIR = path.join(projectRoot, 'public/assets/sprites/characters');
const ITEMS_DIR = path.join(projectRoot, 'public/assets/sprites/items');
const BGM_DIR = path.join(projectRoot, 'public/assets/audio/bgm');
const CRIES_DIR = path.join(projectRoot, 'public/assets/audio/cries');
const tmpDir = path.join(projectRoot, 'scripts/.tmp_park');

fs.mkdirSync(CHAR_DIR, { recursive: true });
fs.mkdirSync(ITEMS_DIR, { recursive: true });
fs.mkdirSync(BGM_DIR, { recursive: true });
fs.mkdirSync(CRIES_DIR, { recursive: true });
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

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function step1_CharacterWalkSheets() {
  console.log('--- Step 1: Character Walk Sheets ---');
  const cdPeopleBase = 'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/object_events/pics/people/';

  const sheets = [
    { src: 'firebreather.png', dest: ['firebreather.png'] },
    { src: 'psychic_m.png', dest: ['psychic_m.png', 'psychic.png'] },
    { src: 'school_kid_m.png', dest: ['school_kid_m.png', 'schoolboy.png'] },
    { src: 'super_nerd.png', dest: ['super_nerd.png', 'juggler.png'] },
  ];

  for (const s of sheets) {
    console.log(`Fetching ${s.src}...`);
    const raw = await fetchBuffer(`${cdPeopleBase}${s.src}`);
    const decoded = decode4BitPng(raw);
    const png = createPNG(decoded.width, decoded.height, decoded.rgba);
    for (const d of s.dest) {
      fs.writeFileSync(path.join(CHAR_DIR, d), png);
      console.log(`Saved ${d} (${decoded.width}x${decoded.height} RGBA)`);
    }
  }
}

async function step2_ItemIcons() {
  console.log('--- Step 2: Key Item & Ball Icons ---');
  const items = [
    {
      url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-fighting.png',
      dest: ['tm_fighting.png', 'tm-fighting.png', 'tm08.png'],
    },
    {
      url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-claw.png',
      dest: ['quick_claw.png', 'quick-claw.png'],
    },
    {
      url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sun-stone.png',
      dest: ['sun_stone.png', 'sun-stone.png'],
    },
    {
      url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/park-ball.png',
      dest: ['park_ball.png', 'park-ball.png', 'parkball.png'],
    },
  ];

  for (const it of items) {
    const buf = await fetchBuffer(it.url);
    for (const d of it.dest) {
      fs.writeFileSync(path.join(ITEMS_DIR, d), buf);
      console.log(`Saved item: ${d}`);
    }
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

function createNationalParkBgm() {
  const sr = 44100;
  const bpm = 92;
  const beat = 60 / bpm;
  const notes = [];
  // Pastoral, lyrical, peaceful waltz/ballad in C major (32 beats)
  // C5, D5, E5, G5, F5, E5, D5, C5, B4, C5, D5, G4, A4, B4, C5, E5...
  const melodyPitches = [
    523.25, 587.33, 659.25, 783.99, 698.46, 659.25, 587.33, 523.25,
    493.88, 523.25, 587.33, 392.00, 440.00, 493.88, 523.25, 659.25,
    783.99, 698.46, 659.25, 587.33, 523.25, 493.88, 440.00, 392.00,
    440.00, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 523.25,
  ];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * beat;
    const freq = melodyPitches[b % melodyPitches.length];
    // Gentle flute/piano lead
    notes.push({
      startTime,
      duration: beat * 0.75,
      freq,
      type: 'triangle',
      vol: 0.32,
    });
    // Soft acoustic bell harmonic
    notes.push({
      startTime: startTime + beat * 0.25,
      duration: beat * 0.4,
      freq: freq * 1.5,
      type: 'sine',
      vol: 0.12,
    });
    // Warm cello bassline
    const bassPitches = [130.81, 164.81, 196.00, 174.61, 130.81, 146.83, 164.81, 196.00];
    notes.push({
      startTime,
      duration: beat * 0.85,
      freq: bassPitches[b % bassPitches.length],
      type: 'triangle',
      vol: 0.26,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

async function step3_AudioAndCry() {
  console.log('--- Step 3: Audio BGM & Sudowoodo Cry ---');

  // 1. National Park BGM
  const wavBuf = createNationalParkBgm();
  const wavPath = path.join(tmpDir, 'bgm_national_park.wav');
  fs.writeFileSync(wavPath, wavBuf);

  const mp3Path = path.join(BGM_DIR, 'bgm_national_park.mp3');
  const webmPath = path.join(BGM_DIR, 'bgm_national_park.webm');
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -q:a 2 "${mp3Path}" 2>/dev/null`);
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libopus -b:a 96k "${webmPath}" 2>/dev/null`);
  console.log('Generated seamless BGM: bgm_national_park.mp3 & .webm');

  // 2. Sudowoodo authentic cry (#185) from PokeAPI
  const cryUrl = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/185.ogg';
  console.log('Fetching authentic Sudowoodo cry from PokeAPI...');
  const oggBuf = await fetchBuffer(cryUrl);
  const rawOggPath = path.join(tmpDir, '185.ogg');
  fs.writeFileSync(rawOggPath, oggBuf);

  fs.writeFileSync(path.join(CRIES_DIR, '185.ogg'), oggBuf);
  fs.writeFileSync(path.join(CRIES_DIR, 'sudowoodo.ogg'), oggBuf);

  // Convert to mp3
  const mp3CryPath = path.join(CRIES_DIR, '185.mp3');
  const mp3CrySudowoodo = path.join(CRIES_DIR, 'sudowoodo.mp3');
  execSync(`ffmpeg -y -i "${rawOggPath}" -codec:a libmp3lame -q:a 2 "${mp3CryPath}" 2>/dev/null`);
  execSync(`ffmpeg -y -i "${rawOggPath}" -codec:a libmp3lame -q:a 2 "${mp3CrySudowoodo}" 2>/dev/null`);
  console.log('Saved authentic Sudowoodo cry: 185.mp3, 185.ogg, sudowoodo.mp3');
}

async function main() {
  await step1_CharacterWalkSheets();
  await step2_ItemIcons();
  await step3_AudioAndCry();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('\n✅ All Route 35, National Park & Sudowoodo assets staged successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
