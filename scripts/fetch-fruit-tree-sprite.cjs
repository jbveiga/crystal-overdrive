/**
 * fetch-fruit-tree-sprite.cjs
 * Extracts and synthesizes authentic Pokémon Crystal Fruit Tree sprites:
 * - 16x16 GBC RGBA sprite: public/assets/sprites/fruit_tree.png
 * - 64x64 4x upscaled RGBA: public/assets/sprites/fruit_tree_64.png
 * - 144x32 character sheet: public/assets/sprites/characters/fruit_tree.png
 *
 * Source: pret/pokecrystal gfx/sprites/fruit_tree.png with authentic GBC PAL_OW_TREE palette.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const SPRITES_DIR = path.join(projectRoot, 'public/assets/sprites');
const CHAR_DIR = path.join(SPRITES_DIR, 'characters');
const POKECRYSTAL_URL =
  'https://raw.githubusercontent.com/pret/pokecrystal/master/gfx/sprites/fruit_tree.png';

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

const gbc5to8 = (v) => Math.round((v * 255) / 31);

// Authentic GBC PAL_OW_TREE palette:
// c0: Transparent, c1: [12, 25, 1], c2: [5, 14, 0], c3: [7, 7, 7]
const TREE_PALETTE = [
  [0, 0, 0, 0],
  [gbc5to8(12), gbc5to8(25), gbc5to8(1), 255],
  [gbc5to8(5), gbc5to8(14), gbc5to8(0), 255],
  [gbc5to8(7), gbc5to8(7), gbc5to8(7), 255],
];

async function main() {
  console.log(`Fetching authentic fruit tree sprite from ${POKECRYSTAL_URL}...`);
  const res = await fetch(POKECRYSTAL_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${POKECRYSTAL_URL}: ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
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
  const rowBytes = Math.ceil((width * 2) / 8);
  const stride = 1 + rowBytes;

  // 1. 16x16 RGBA
  const rgba16 = Buffer.alloc(16 * 16 * 4);
  for (let y = 0; y < height; y++) {
    for (let i = 0; i < rowBytes; i++) {
      const val = raw[y * stride + 1 + i];
      for (let b = 6; b >= 0; b -= 2) {
        const bitX = i * 4 + (6 - b) / 2;
        if (bitX < 16) {
          const rawVal = (val >> b) & 3;
          const gbcIdx = 3 - rawVal; // Invert: 3=White(0), 0=Black(3)
          const color = TREE_PALETTE[gbcIdx];
          const outIdx = (y * 16 + bitX) * 4;
          rgba16[outIdx] = color[0];
          rgba16[outIdx + 1] = color[1];
          rgba16[outIdx + 2] = color[2];
          rgba16[outIdx + 3] = color[3];
        }
      }
    }
  }

  // 2. 64x64 RGBA (4x Nearest Neighbor)
  const rgba64 = Buffer.alloc(64 * 64 * 4);
  for (let y = 0; y < 64; y++) {
    const srcY = Math.floor(y / 4);
    for (let x = 0; x < 64; x++) {
      const srcX = Math.floor(x / 4);
      const srcIdx = (srcY * 16 + srcX) * 4;
      const destIdx = (y * 64 + x) * 4;
      rgba64[destIdx] = rgba16[srcIdx];
      rgba64[destIdx + 1] = rgba16[srcIdx + 1];
      rgba64[destIdx + 2] = rgba16[srcIdx + 2];
      rgba64[destIdx + 3] = rgba16[srcIdx + 3];
    }
  }

  // 3. 144x32 Character Walk Sheet (9 frames of 16x32)
  const rgba144 = Buffer.alloc(144 * 32 * 4);
  for (let frame = 0; frame < 9; frame++) {
    const frameX = frame * 16;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const srcIdx = (y * 16 + x) * 4;
        const destIdx = ((16 + y) * 144 + (frameX + x)) * 4;
        rgba144[destIdx] = rgba16[srcIdx];
        rgba144[destIdx + 1] = rgba16[srcIdx + 1];
        rgba144[destIdx + 2] = rgba16[srcIdx + 2];
        rgba144[destIdx + 3] = rgba16[srcIdx + 3];
      }
    }
  }

  fs.mkdirSync(SPRITES_DIR, { recursive: true });
  fs.mkdirSync(CHAR_DIR, { recursive: true });

  const path16 = path.join(SPRITES_DIR, 'fruit_tree.png');
  const path64 = path.join(SPRITES_DIR, 'fruit_tree_64.png');
  const path144 = path.join(CHAR_DIR, 'fruit_tree.png');

  fs.writeFileSync(path16, createPNG(16, 16, rgba16));
  fs.writeFileSync(path64, createPNG(64, 64, rgba64));
  fs.writeFileSync(path144, createPNG(144, 32, rgba144));

  console.log(`✅ Saved 16x16 authentic sprite: ${path16}`);
  console.log(`✅ Saved 64x64 4x upscaled sprite: ${path64}`);
  console.log(`✅ Saved 144x32 character sheet:   ${path144}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
