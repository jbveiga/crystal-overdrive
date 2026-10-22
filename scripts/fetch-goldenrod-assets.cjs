/**
 * fetch-goldenrod-assets.cjs
 * Comprehensive asset extraction and audio generation for Goldenrod City Metropolis
 * Ticket: TICKET-WORLD-GOLDENROD-CITY-01
 *
 * 1. Character Walk Sheets (144x32 RGBA):
 *    - whitney.png (expanded from 48x32 3-frame layout to 144x32 9-frame)
 *    - clerk.png & bike_shop_owner.png (from mart_employee.png)
 *    - receptionist.png (from link_receptionist.png)
 *    - gentleman.png (from gentleman.png)
 *    - lass.png (from lass.png)
 *    - beauty.png (from girl_2.png)
 *    - rocket_grunt_m.png & rocket_grunt_f.png (from team_rocket)
 *
 * 2. Key Items & Equipment Icons:
 *    - bicycle.png, squirtbottle.png, coin_case.png, radio_card.png, blue_card.png, card_key.png, basement_key.png
 *
 * 3. Johto Badges (16x16 RGBA):
 *    - badge_zephyr.png, badge_hive.png, badge_plain.png, badge_fog.png,
 *      badge_storm.png, badge_mineral.png, badge_glacier.png, badge_rising.png
 *
 * 4. Audio BGM:
 *    - bgm_goldenrod_city.mp3 / .webm
 *    - bgm_game_corner.mp3 / .webm
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const CHAR_DIR = path.join(projectRoot, 'public/assets/sprites/characters');
const ITEMS_DIR = path.join(projectRoot, 'public/assets/sprites/items');
const BADGES_DIR = path.join(projectRoot, 'public/assets/sprites/badges');
const BGM_DIR = path.join(projectRoot, 'public/assets/audio/bgm');
const tmpDir = path.join(projectRoot, 'scripts/.tmp_goldenrod');

fs.mkdirSync(CHAR_DIR, { recursive: true });
fs.mkdirSync(ITEMS_DIR, { recursive: true });
fs.mkdirSync(BADGES_DIR, { recursive: true });
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

  // 1. Whitney (48x32 -> 144x32)
  console.log('Fetching Whitney (gym_leaders/whitney.png)...');
  const whitneyRaw = await fetchBuffer(`${cdPeopleBase}gym_leaders/whitney.png`);
  const decodedWhitney = decode4BitPng(whitneyRaw);
  const outWidth = 144;
  const outHeight = 32;
  const whitneyRgba = Buffer.alloc(outWidth * outHeight * 4);

  // Mapping 3 frames to 9 frames: Down (0, 3, 4), Up (1, 5, 6), Side (2, 7, 8)
  const frameMap = [
    { srcFrame: 0, destFrames: [0, 3, 4] },
    { srcFrame: 1, destFrames: [1, 5, 6] },
    { srcFrame: 2, destFrames: [2, 7, 8] },
  ];
  for (const m of frameMap) {
    const srcX = m.srcFrame * 16;
    for (const d of m.destFrames) {
      const destX = d * 16;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 16; x++) {
          const sIdx = (y * decodedWhitney.width + (srcX + x)) * 4;
          const dIdx = (y * outWidth + (destX + x)) * 4;
          whitneyRgba[dIdx] = decodedWhitney.rgba[sIdx];
          whitneyRgba[dIdx + 1] = decodedWhitney.rgba[sIdx + 1];
          whitneyRgba[dIdx + 2] = decodedWhitney.rgba[sIdx + 2];
          whitneyRgba[dIdx + 3] = decodedWhitney.rgba[sIdx + 3];
        }
      }
    }
  }
  const whitneyPng = createPNG(outWidth, outHeight, whitneyRgba);
  fs.writeFileSync(path.join(CHAR_DIR, 'whitney.png'), whitneyPng);
  console.log('Saved whitney.png (144x32 RGBA)');

  // 2. Standard 144x32 sheets
  const sheets = [
    { src: 'mart_employee.png', dest: 'clerk.png' },
    { src: 'mart_employee.png', dest: 'bike_shop_owner.png' },
    { src: 'link_receptionist.png', dest: 'receptionist.png' },
    { src: 'gentleman.png', dest: 'gentleman.png' },
    { src: 'lass.png', dest: 'lass.png' },
    { src: 'girl_2.png', dest: 'beauty.png' },
    { src: 'team_rocket/rocket_grunt_m.png', dest: 'rocket_grunt_m.png' },
    { src: 'team_rocket/rocket_grunt_f.png', dest: 'rocket_grunt_f.png' },
  ];

  for (const s of sheets) {
    console.log(`Fetching ${s.src} -> ${s.dest}...`);
    const raw = await fetchBuffer(`${cdPeopleBase}${s.src}`);
    const decoded = decode4BitPng(raw);
    const png = createPNG(decoded.width, decoded.height, decoded.rgba);
    fs.writeFileSync(path.join(CHAR_DIR, s.dest), png);
    console.log(`Saved ${s.dest} (${decoded.width}x${decoded.height} RGBA)`);
  }
}

async function step2_ItemIcons() {
  console.log('--- Step 2: Key Item Icons ---');
  const items = [
    { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/bicycle.png', dest: 'bicycle.png' },
    { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/squirt-bottle.png', dest: 'squirtbottle.png' },
    { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin-case.png', dest: 'coin_case.png' },
    { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blue-card.png', dest: 'radio_card.png' },
    { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/blue-card.png', dest: 'blue_card.png' },
    { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/card-key.png', dest: 'card_key.png' },
    { url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/basement-key.png', dest: 'basement_key.png' },
  ];

  for (const it of items) {
    console.log(`Fetching ${it.dest}...`);
    const buf = await fetchBuffer(it.url);
    fs.writeFileSync(path.join(ITEMS_DIR, it.dest), buf);
    console.log(`Saved ${it.dest}`);
  }
}

async function step3_JohtoBadges() {
  console.log('--- Step 3: Johto Badges ---');
  const badgeSheetUrl = 'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/trainer_card/badges_johto.png';
  const raw = await fetchBuffer(badgeSheetUrl);
  fs.writeFileSync(path.join(BADGES_DIR, 'badges_johto.png'), raw);

  const decoded = decode4BitPng(raw); // 128 x 16
  const badgeNames = [
    'badge_zephyr',
    'badge_hive',
    'badge_plain',
    'badge_fog',
    'badge_storm',
    'badge_mineral',
    'badge_glacier',
    'badge_rising',
  ];

  for (let i = 0; i < badgeNames.length; i++) {
    const bName = badgeNames[i];
    const bWidth = 16;
    const bHeight = 16;
    const bRgba = Buffer.alloc(bWidth * bHeight * 4);
    const startX = i * 16;

    for (let y = 0; y < bHeight; y++) {
      for (let x = 0; x < bWidth; x++) {
        const sIdx = (y * decoded.width + (startX + x)) * 4;
        const dIdx = (y * bWidth + x) * 4;
        bRgba[dIdx] = decoded.rgba[sIdx];
        bRgba[dIdx + 1] = decoded.rgba[sIdx + 1];
        bRgba[dIdx + 2] = decoded.rgba[sIdx + 2];
        bRgba[dIdx + 3] = decoded.rgba[sIdx + 3];
      }
    }

    const png = createPNG(bWidth, bHeight, bRgba);
    fs.writeFileSync(path.join(BADGES_DIR, `${bName}.png`), png);
    console.log(`Saved badge: ${bName}.png (16x16 RGBA)`);
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

function createGoldenrodCityBgm() {
  const sr = 44100;
  const bpm = 130;
  const beat = 60 / bpm;
  const notes = [];
  // Bustling energetic metropolis theme in F major (32 beats)
  const melodyPitches = [
    349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 466.16, 523.25,
    440.0, 349.23, 392.0, 440.0, 349.23, 293.66, 329.63, 349.23,
    523.25, 587.33, 659.25, 698.46, 659.25, 587.33, 523.25, 440.0,
    466.16, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23, 349.23
  ];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * beat;
    const freq = melodyPitches[b % melodyPitches.length];
    // Lead pulse
    notes.push({
      startTime,
      duration: beat * 0.5,
      freq,
      type: 'square',
      vol: 0.28,
    });
    // Harmony echo
    notes.push({
      startTime: startTime + beat * 0.25,
      duration: beat * 0.25,
      freq: freq * 0.75,
      type: 'square',
      vol: 0.15,
    });
    // Energetic walking bass
    const bassPitches = [174.61, 220.0, 261.63, 293.66, 233.08, 261.63, 174.61, 196.0];
    notes.push({
      startTime,
      duration: beat * 0.7,
      freq: bassPitches[b % bassPitches.length],
      type: 'triangle',
      vol: 0.32,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

function createGameCornerBgm() {
  const sr = 44100;
  const bpm = 144;
  const beat = 60 / bpm;
  const notes = [];
  // Playful carnival ragtime theme in C major (32 beats)
  const melodyPitches = [
    523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 622.25, 659.25,
    523.25, 440.0, 493.88, 523.25, 587.33, 493.88, 392.0, 523.25,
    783.99, 880.0, 987.77, 1046.50, 987.77, 880.0, 783.99, 659.25,
    698.46, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 523.25
  ];
  const totalBeats = 32;

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * beat;
    const freq = melodyPitches[b % melodyPitches.length];
    // Staccato ragtime lead
    notes.push({
      startTime,
      duration: beat * 0.35,
      freq,
      type: 'square',
      vol: 0.26,
    });
    // Off-beat syncope
    notes.push({
      startTime: startTime + beat * 0.5,
      duration: beat * 0.3,
      freq: freq * 1.2,
      type: 'square',
      vol: 0.16,
    });
    // Oom-pah stride bass
    const bassFreq = b % 2 === 0 ? 130.81 : 196.0;
    notes.push({
      startTime,
      duration: beat * 0.4,
      freq: bassFreq,
      type: 'triangle',
      vol: 0.30,
    });
  }

  return synthesizeWav(sr, totalBeats * beat, notes);
}

async function step4_AudioBGM() {
  console.log('--- Step 4: Audio BGM Generation ---');
  const tracks = [
    { name: 'bgm_goldenrod_city', fn: createGoldenrodCityBgm },
    { name: 'bgm_game_corner', fn: createGameCornerBgm },
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
}

async function main() {
  await step1_CharacterWalkSheets();
  await step2_ItemIcons();
  await step3_JohtoBadges();
  await step4_AudioBGM();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('\n✅ All Goldenrod City assets and BGM tracks staged successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
