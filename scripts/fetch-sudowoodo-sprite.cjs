/**
 * fetch-sudowoodo-sprite.cjs
 * Extracts and prepares the authentic Route 36 Sudowoodo overworld sprites:
 * - 144x32 RGBA character walk sheet (9 frames): public/assets/sprites/characters/sudowoodo.png
 * - 16x32 GBC 2-frame sprite: public/assets/sprites/sudowoodo.png
 * - 64x128 4x upscaled sprite: public/assets/sprites/sudowoodo_64.png
 *
 * Sources:
 * - Sierraffinity/CrystalDust graphics/object_events/pics/pokemon/sudowoodo.png (16x32 overworld character format)
 * - pret/pokecrystal gfx/sprites/sudowoodo.png with PAL_OW_GREEN palette
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const SPRITES_DIR = path.join(projectRoot, 'public/assets/sprites');
const CHAR_DIR = path.join(SPRITES_DIR, 'characters');

const CD_URL =
  'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/object_events/pics/pokemon/sudowoodo.png';
const POKECRYSTAL_URL =
  'https://raw.githubusercontent.com/pret/pokecrystal/master/gfx/sprites/sudowoodo.png';

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
  fs.mkdirSync(SPRITES_DIR, { recursive: true });
  fs.mkdirSync(CHAR_DIR, { recursive: true });

  // 1. CrystalDust 48x32 -> 144x32 9-frame overworld walk/wiggle sheet
  console.log(`Fetching Sudowoodo overworld sprite from ${CD_URL}...`);
  const cdRes = await fetch(CD_URL);
  if (!cdRes.ok) throw new Error(`Failed to fetch ${CD_URL}`);
  const cdBuf = Buffer.from(await cdRes.arrayBuffer());
  const decoded = decode4BitPng(cdBuf);

  const outW = 144;
  const outH = 32;
  const rgba144 = Buffer.alloc(outW * outH * 4);

  const mapping = [
    { dest: 0, srcFrame: 0 }, // downStand
    { dest: 1, srcFrame: 0 }, // upStand
    { dest: 2, srcFrame: 0 }, // sideStand
    { dest: 3, srcFrame: 1 }, // downWalk1 (wiggle left)
    { dest: 4, srcFrame: 2 }, // downWalk2 (wiggle right)
    { dest: 5, srcFrame: 1 }, // upWalk1
    { dest: 6, srcFrame: 2 }, // upWalk2
    { dest: 7, srcFrame: 1 }, // sideWalk1
    { dest: 8, srcFrame: 2 }, // sideWalk2
  ];

  for (const m of mapping) {
    const destX = m.dest * 16;
    const srcX = m.srcFrame * 16;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 16; x++) {
        const srcIdx = (y * decoded.width + (srcX + x)) * 4;
        const destIdx = (y * outW + (destX + x)) * 4;
        rgba144[destIdx] = decoded.rgba[srcIdx];
        rgba144[destIdx + 1] = decoded.rgba[srcIdx + 1];
        rgba144[destIdx + 2] = decoded.rgba[srcIdx + 2];
        rgba144[destIdx + 3] = decoded.rgba[srcIdx + 3];
      }
    }
  }

  const charFile = path.join(CHAR_DIR, 'sudowoodo.png');
  fs.writeFileSync(charFile, createPNG(outW, outH, rgba144));
  console.log(`✅ Saved 144x32 character walk sheet: ${charFile}`);

  // 2. Pokecrystal authentic 2-bit GBC sprite with PAL_OW_GREEN
  console.log(`Fetching pokecrystal GBC sprite from ${POKECRYSTAL_URL}...`);
  const pcRes = await fetch(POKECRYSTAL_URL);
  if (!pcRes.ok) throw new Error(`Failed to fetch ${POKECRYSTAL_URL}`);
  const pcBuf = Buffer.from(await pcRes.arrayBuffer());

  let pos = 8;
  const idat = [];
  while (pos < pcBuf.length) {
    const len = pcBuf.readUInt32BE(pos);
    const type = pcBuf.toString('ascii', pos + 4, pos + 8);
    const data = pcBuf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rowBytes = Math.ceil((16 * 2) / 8);
  const stride = 1 + rowBytes;

  const gbc5to8 = (v) => Math.round((v * 255) / 31);
  const PAL = [
    [0, 0, 0, 0],
    [gbc5to8(12), gbc5to8(25), gbc5to8(1), 255],
    [gbc5to8(5), gbc5to8(14), gbc5to8(0), 255],
    [gbc5to8(7), gbc5to8(7), gbc5to8(7), 255],
  ];

  const rgba16x32 = Buffer.alloc(16 * 32 * 4);
  for (let y = 0; y < 32; y++) {
    for (let i = 0; i < rowBytes; i++) {
      const val = raw[y * stride + 1 + i];
      for (let b = 6; b >= 0; b -= 2) {
        const bitX = i * 4 + (6 - b) / 2;
        if (bitX < 16) {
          const rawVal = (val >> b) & 3;
          const gbcIdx = 3 - rawVal;
          const color = PAL[gbcIdx];
          const outIdx = (y * 16 + bitX) * 4;
          rgba16x32[outIdx] = color[0];
          rgba16x32[outIdx + 1] = color[1];
          rgba16x32[outIdx + 2] = color[2];
          rgba16x32[outIdx + 3] = color[3];
        }
      }
    }
  }

  const rgba64x128 = Buffer.alloc(64 * 128 * 4);
  for (let y = 0; y < 128; y++) {
    const srcY = Math.floor(y / 4);
    for (let x = 0; x < 64; x++) {
      const srcX = Math.floor(x / 4);
      const srcIdx = (srcY * 16 + srcX) * 4;
      const destIdx = (y * 64 + x) * 4;
      rgba64x128[destIdx] = rgba16x32[srcIdx];
      rgba64x128[destIdx + 1] = rgba16x32[srcIdx + 1];
      rgba64x128[destIdx + 2] = rgba16x32[srcIdx + 2];
      rgba64x128[destIdx + 3] = rgba16x32[srcIdx + 3];
    }
  }

  const gbcFile = path.join(SPRITES_DIR, 'sudowoodo.png');
  const gbc64File = path.join(SPRITES_DIR, 'sudowoodo_64.png');
  fs.writeFileSync(gbcFile, createPNG(16, 32, rgba16x32));
  fs.writeFileSync(gbc64File, createPNG(64, 128, rgba64x128));
  console.log(`✅ Saved 16x32 authentic GBC sprite: ${gbcFile}`);
  console.log(`✅ Saved 64x128 4x upscaled sprite:   ${gbc64File}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
