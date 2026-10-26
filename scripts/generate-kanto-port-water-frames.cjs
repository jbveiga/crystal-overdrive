const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(__dirname, 'pokecrystal_raw');
const TILES_DIR = path.join(projectRoot, 'public/assets/tiles');

function decode2BitPng(filePath) {
  const buf = fs.readFileSync(filePath);
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
  const pixels = new Uint8Array(width * height);
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
    }
    prevRow.set(row);
    for (let x = 0; x < width; x++) {
      const byteIdx = Math.floor(x / 4);
      const shift = 6 - (x % 4) * 2;
      pixels[y * width + x] = (row[byteIdx] >> shift) & 0x03;
    }
  }
  return { width, height, pixels };
}

function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
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
const OUTDOOR_PALETTES = {
  GRAY: [[gbc5to8(28), gbc5to8(31), gbc5to8(28)], [gbc5to8(21), gbc5to8(21), gbc5to8(21)], [gbc5to8(13), gbc5to8(13), gbc5to8(13)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  RED: [[gbc5to8(28), gbc5to8(31), gbc5to8(28)], [gbc5to8(31), gbc5to8(19), gbc5to8(24)], [gbc5to8(30), gbc5to8(10), gbc5to8(6)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  GREEN: [[gbc5to8(28), gbc5to8(31), gbc5to8(28)], [gbc5to8(22), gbc5to8(31), gbc5to8(10)], [gbc5to8(12), gbc5to8(25), gbc5to8(1)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  WATER: [[gbc5to8(28), gbc5to8(31), gbc5to8(28)], [gbc5to8(18), gbc5to8(24), gbc5to8(30)], [gbc5to8(15), gbc5to8(16), gbc5to8(31)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  YELLOW: [[gbc5to8(28), gbc5to8(31), gbc5to8(28)], [gbc5to8(31), gbc5to8(31), gbc5to8(7)], [gbc5to8(31), gbc5to8(16), gbc5to8(1)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  BROWN: [[gbc5to8(28), gbc5to8(31), gbc5to8(28)], [gbc5to8(24), gbc5to8(18), gbc5to8(7)], [gbc5to8(20), gbc5to8(15), gbc5to8(3)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  ROOF: [[gbc5to8(28), gbc5to8(31), gbc5to8(28)], [gbc5to8(20), gbc5to8(26), gbc5to8(9)], [gbc5to8(13), gbc5to8(19), gbc5to8(4)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  TEXT: [[gbc5to8(31), gbc5to8(31), gbc5to8(31)], [gbc5to8(31), gbc5to8(31), gbc5to8(31)], [gbc5to8(14), gbc5to8(9), gbc5to8(0)], [gbc5to8(0), gbc5to8(0), gbc5to8(0)]],
};
const INDOOR_PALETTES = {
  GRAY: [[gbc5to8(30), gbc5to8(28), gbc5to8(26)], [gbc5to8(19), gbc5to8(19), gbc5to8(19)], [gbc5to8(13), gbc5to8(13), gbc5to8(13)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  RED: [[gbc5to8(30), gbc5to8(28), gbc5to8(26)], [gbc5to8(31), gbc5to8(19), gbc5to8(24)], [gbc5to8(30), gbc5to8(10), gbc5to8(6)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  GREEN: [[gbc5to8(30), gbc5to8(28), gbc5to8(26)], [gbc5to8(18), gbc5to8(24), gbc5to8(9)], [gbc5to8(15), gbc5to8(20), gbc5to8(1)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  WATER: [[gbc5to8(30), gbc5to8(28), gbc5to8(26)], [gbc5to8(18), gbc5to8(24), gbc5to8(30)], [gbc5to8(15), gbc5to8(16), gbc5to8(31)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  YELLOW: [[gbc5to8(30), gbc5to8(28), gbc5to8(26)], [gbc5to8(31), gbc5to8(31), gbc5to8(7)], [gbc5to8(31), gbc5to8(16), gbc5to8(1)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  BROWN: [[gbc5to8(30), gbc5to8(28), gbc5to8(26)], [gbc5to8(24), gbc5to8(18), gbc5to8(7)], [gbc5to8(20), gbc5to8(15), gbc5to8(3)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  ROOF: [[gbc5to8(30), gbc5to8(28), gbc5to8(26)], [gbc5to8(18), gbc5to8(24), gbc5to8(30)], [gbc5to8(15), gbc5to8(16), gbc5to8(31)], [gbc5to8(7), gbc5to8(7), gbc5to8(7)]],
  TEXT: [[gbc5to8(31), gbc5to8(31), gbc5to8(31)], [gbc5to8(31), gbc5to8(31), gbc5to8(31)], [gbc5to8(14), gbc5to8(9), gbc5to8(0)], [gbc5to8(0), gbc5to8(0), gbc5to8(0)]],
};

const waterAnim = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__water__water.png'));

function loadTileset(tsName, isOutdoor = false) {
  const png = decode2BitPng(path.join(SOURCE_DIR, `gfx__tilesets__${tsName}.png`));
  const palText = fs.readFileSync(path.join(SOURCE_DIR, `gfx__tilesets__${tsName}_palette_map.asm`), 'utf8');
  const pal0 = [];
  const pal1 = [];
  for (const l of palText.split('\n').map((s) => s.trim())) {
    if (l.startsWith('tilepal 0,')) pal0.push(...l.replace('tilepal 0,', '').split(',').map((s) => s.trim()));
    if (l.startsWith('tilepal 1,')) pal1.push(...l.replace('tilepal 1,', '').split(',').map((s) => s.trim()));
  }
  return { tsName, isOutdoor, png, pal0, pal1 };
}

const TILESETS = {
  kanto: loadTileset('kanto', true),
  port: loadTileset('port', false),
  johto: loadTileset('johto', true),
};

function buildQuadrantBuffer(ts, quad8x8, waterFrameIdx = 0) {
  const rgba = Buffer.alloc(64 * 64 * 4);
  const palettes = ts.isOutdoor ? OUTDOOR_PALETTES : INDOOR_PALETTES;

  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      const qIdx = qy * 2 + qx;
      const tid = quad8x8[qIdx];
      const palName = ts.pal0[tid] || 'GRAY';
      const pal = palettes[palName] || palettes.GRAY;
      const pngTid = tid;
      const srcX = (pngTid % 16) * 8;
      const srcY = Math.floor(pngTid / 16) * 8;

      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          let val2b;
          if (tid === 0x14) {
            val2b = waterAnim.pixels[(waterFrameIdx * 8 + py) * 8 + px];
          } else {
            val2b = ts.png.pixels[(srcY + py) * ts.png.width + (srcX + px)];
          }
          const color = pal[3 - val2b];
          for (let dy = 0; dy < 4; dy++) {
            for (let dx = 0; dx < 4; dx++) {
              const outX = (qx * 8 + px) * 4 + dx;
              const outY = (qy * 8 + py) * 4 + dy;
              const idx = (outY * 64 + outX) * 4;
              rgba[idx] = color[0];
              rgba[idx + 1] = color[1];
              rgba[idx + 2] = color[2];
              rgba[idx + 3] = 255;
            }
          }
        }
      }
    }
  }
  return rgba;
}

const targetTiles = [
  { name: 'kt_33_33_14_14', ts: TILESETS.kanto, quad: [0x33, 0x33, 0x14, 0x14] },
  { name: 'kt_14_14_14_14', ts: TILESETS.kanto, quad: [0x14, 0x14, 0x14, 0x14] },
  { name: 'kt_14_54_14_54', ts: TILESETS.kanto, quad: [0x14, 0x54, 0x14, 0x54] },
  { name: 'kt_33_33_33_14', ts: TILESETS.kanto, quad: [0x33, 0x33, 0x33, 0x14] },
  { name: 'kt_33_33_14_54', ts: TILESETS.kanto, quad: [0x33, 0x33, 0x14, 0x54] },
  { name: 'kt_33_14_33_14', ts: TILESETS.kanto, quad: [0x33, 0x14, 0x33, 0x14] },
  { name: 'kt_14_33_14_14', ts: TILESETS.kanto, quad: [0x14, 0x33, 0x14, 0x14] },
  { name: 'kt_33_14_14_14', ts: TILESETS.kanto, quad: [0x33, 0x14, 0x14, 0x14] },
  { name: 'kt_31_31_14_14', ts: TILESETS.kanto, quad: [0x31, 0x31, 0x14, 0x14] },
  { name: 'in_port_0b_0b_14_14', ts: TILESETS.port, quad: [0x0b, 0x0b, 0x14, 0x14] },
  { name: 'in_port_14_14_14_14', ts: TILESETS.port, quad: [0x14, 0x14, 0x14, 0x14] },
  { name: 'in_port_22_22_14_14', ts: TILESETS.port, quad: [0x22, 0x22, 0x14, 0x14] },
];

for (const item of targetTiles) {
  const rgba1 = buildQuadrantBuffer(item.ts, item.quad, 1);
  const rgba2 = buildQuadrantBuffer(item.ts, item.quad, 2);
  fs.writeFileSync(path.join(TILES_DIR, `${item.name}__w1.png`), createPNG(64, 64, rgba1));
  fs.writeFileSync(path.join(TILES_DIR, `${item.name}__w2.png`), createPNG(64, 64, rgba2));
  console.log(`Generated w1 & w2 for: ${item.name}`);
}
console.log('Finished generating water frames.');
