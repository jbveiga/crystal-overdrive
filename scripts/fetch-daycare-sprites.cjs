/**
 * fetch-daycare-sprites.cjs
 * Extracts and synthesizes 144x32 RGBA character walk sheets from Sierraffinity/CrystalDust.
 *
 * Sprites for Route 34 & Day-Care:
 * - gramps.png (Day-Care Man) <- old_man.png
 * - granny.png (Day-Care Lady) <- old_woman.png
 * - officer.png (Officer Keith) <- officer.png
 * - camper.png (Camper Todd) <- camper.png
 * - picnicker.png (Picnicker Gina) <- picnicker.png
 * - youngster.png (Youngster Samuel/Ian) <- youngster.png
 * - pokefan_m.png (Pokefan Brandon) <- fat_man.png
 * - pokefan_f.png <- pokefan_f.png
 * - cooltrainer_f.png (Irene, Jenn, Kate) <- girl_1.png
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const CHAR_DIR = path.join(projectRoot, 'public/assets/sprites/characters');

const SPRITES_TO_FETCH = [
  { source: 'old_man.png', target: 'gramps.png' },
  { source: 'old_woman.png', target: 'granny.png' },
  { source: 'officer.png', target: 'officer.png' },
  { source: 'camper.png', target: 'camper.png' },
  { source: 'picnicker.png', target: 'picnicker.png' },
  { source: 'youngster.png', target: 'youngster.png' },
  { source: 'fat_man.png', target: 'pokefan_m.png' },
  { source: 'pokefan_f.png', target: 'pokefan_f.png' },
  { source: 'girl_1.png', target: 'cooltrainer_f.png' },
];

const BASE_URL = 'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/object_events/pics/people/';

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

async function main() {
  fs.mkdirSync(CHAR_DIR, { recursive: true });

  for (const item of SPRITES_TO_FETCH) {
    const url = BASE_URL + item.source;
    const dest = path.join(CHAR_DIR, item.target);
    console.log(`Fetching ${item.source} -> ${item.target}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch ${url}: ${res.statusText}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const decoded = decode4BitPng(buf);
    if (decoded.width !== 144 || decoded.height !== 32) {
      console.warn(`Unexpected dimensions for ${item.source}: ${decoded.width}x${decoded.height}`);
    }
    const png = createPNG(decoded.width, decoded.height, decoded.rgba);
    fs.writeFileSync(dest, png);
    console.log(`Successfully saved ${item.target} (144x32 RGBA)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
