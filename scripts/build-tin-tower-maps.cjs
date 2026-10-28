const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(__dirname, 'pokecrystal_raw');
const TILES_DIR = path.join(projectRoot, 'public/assets/tiles');
const MAPS_DIR = path.join(projectRoot, 'public/assets/data/maps');

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
const makePal = (c0, c1, c2, c3) =>
  [c0, c1, c2, c3].map((c) => [gbc5to8(c[0]), gbc5to8(c[1]), gbc5to8(c[2]), 255]);

const INDOOR_PALETTES = {
  GRAY: makePal([30, 28, 26], [19, 19, 19], [13, 13, 13], [7, 7, 7]),
  RED: makePal([30, 28, 26], [31, 19, 24], [30, 10, 6], [7, 7, 7]),
  GREEN: makePal([18, 24, 9], [15, 20, 1], [9, 13, 0], [7, 7, 7]),
  WATER: makePal([30, 28, 26], [15, 16, 31], [9, 9, 31], [7, 7, 7]),
  YELLOW: makePal([30, 28, 26], [31, 31, 7], [31, 16, 1], [7, 7, 7]),
  BROWN: makePal([26, 24, 17], [21, 17, 7], [16, 13, 3], [7, 7, 7]),
  ROOF: makePal([30, 28, 26], [17, 19, 31], [14, 16, 31], [7, 7, 7]),
};

function mapCollToken(token) {
  if (token === 'HOP_DOWN') return 4;
  if (token === 'HOP_UP') return 5;
  if (token === 'HOP_LEFT') return 6;
  if (token === 'HOP_RIGHT') return 7;
  if (token === 'HOP_DOWN_LEFT') return 8;
  if (token === 'HOP_DOWN_RIGHT') return 9;
  if (
    token === 'FLOOR' ||
    token === 'DOOR' ||
    token.startsWith('WARP_CARPET') ||
    token === 'WARP_PANEL' ||
    token === 'LADDER' ||
    token === 'STAIRCASE' ||
    token === 'CAVE'
  ) {
    return 0; // Walkable
  }
  if (token === 'TALL_GRASS' || token === 'LONG_GRASS') {
    return 2; // Tall grass
  }
  if (token.startsWith('WATER') || token === 'WHIRLPOOL') {
    return 3; // Water
  }
  return 1; // Solid
}

function normalizeLedgeBlockColls(colls) {
  const [c0, c1, c2, c3] = colls;
  if (c1 === 8) return [6, 0, 8, 4];
  if (c0 === 9) return [0, 7, 4, 9];
  const out = [c0, c1, c2, c3];
  if (c0 === 4 && c2 === 1) {
    out[0] = 0;
    out[2] = 4;
  }
  if (c1 === 4 && c3 === 1) {
    out[1] = 0;
    out[3] = 4;
  }
  if (c1 === 6 && c0 === 1) {
    out[1] = 0;
    out[0] = 6;
  }
  if (c3 === 6 && c2 === 1) {
    out[3] = 0;
    out[2] = 6;
  }
  if (c0 === 7 && c1 === 1) {
    out[0] = 0;
    out[1] = 7;
  }
  if (c2 === 7 && c3 === 1) {
    out[2] = 0;
    out[3] = 7;
  }
  return out;
}

function loadTileset(tsName) {
  const png = decode2BitPng(path.join(SOURCE_DIR, `gfx__tilesets__${tsName}.png`));
  const palText = fs.readFileSync(path.join(SOURCE_DIR, `gfx__tilesets__${tsName}_palette_map.asm`), 'utf8');
  const pal0 = [];
  const pal1 = [];
  for (const l of palText.split('\n').map((s) => s.trim())) {
    if (l.startsWith('tilepal 0,')) pal0.push(...l.replace('tilepal 0,', '').split(',').map((s) => s.trim()));
    if (l.startsWith('tilepal 1,')) pal1.push(...l.replace('tilepal 1,', '').split(',').map((s) => s.trim()));
  }

  const collLines = fs
    .readFileSync(path.join(SOURCE_DIR, `data__tilesets__${tsName}_collision.asm`), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('tilecoll'));
  const blockCollisions = collLines.map((line) => {
    const body = line.split(';')[0].replace('tilecoll', '').trim();
    return normalizeLedgeBlockColls(body.split(',').map((s) => mapCollToken(s.trim())));
  });

  const meta = fs.readFileSync(path.join(SOURCE_DIR, `data__tilesets__${tsName}_metatiles.bin`));
  return { tsName, isOutdoor: false, png, pal0, pal1, blockCollisions, meta };
}

const towerTileset = loadTileset('tower');
const generatedTiles = new Set();

function buildQuadrantBuffer(ts, quad8x8) {
  const rgba = Buffer.alloc(64 * 64 * 4);
  const palettes = INDOOR_PALETTES;

  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      const tid = quad8x8[qy * 2 + qx];
      const palName = (tid >= 0x80 ? ts.pal1[tid - 0x80] : ts.pal0[tid]) || 'GRAY';
      const pal = palettes[palName] || palettes.GRAY;
      const pngTid = tid >= 0x80 ? (ts.png.height > 48 ? tid - 0x20 : tid - 0x80) : tid;
      const srcX = (pngTid % 16) * 8;
      const srcY = Math.floor(pngTid / 16) * 8;

      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          const val2b = ts.png.pixels[(srcY + py) * ts.png.width + (srcX + px)];
          const c = pal[val2b] || pal[0];
          const destBaseX = (qx * 8 + px) * 4;
          const destBaseY = (qy * 8 + py) * 4;

          for (let sy = 0; sy < 4; sy++) {
            for (let sx = 0; sx < 4; sx++) {
              const destIdx = ((destBaseY + sy) * 64 + (destBaseX + sx)) * 4;
              rgba[destIdx + 0] = c[0];
              rgba[destIdx + 1] = c[1];
              rgba[destIdx + 2] = c[2];
              rgba[destIdx + 3] = c[3];
            }
          }
        }
      }
    }
  }
  return rgba;
}

function renderQuadrant64(ts, quad8x8) {
  const prefix = `in_${ts.tsName}`;
  const tileName = `${prefix}_${quad8x8.map((x) => x.toString(16).padStart(2, '0')).join('_')}`;

  const tilePath = path.join(TILES_DIR, `${tileName}.png`);
  if (!fs.existsSync(tilePath) && !generatedTiles.has(tileName)) {
    const rgba0 = buildQuadrantBuffer(ts, quad8x8);
    fs.writeFileSync(tilePath, createPNG(64, 64, rgba0));
    generatedTiles.add(tileName);
  }
  return tileName;
}

function buildTowerMap({ id, name, blkFile, blocksW, blocksH, warps = [], bgEvents = [] }) {
  const ts = towerTileset;
  const blk = fs.readFileSync(path.join(SOURCE_DIR, blkFile));
  const width = blocksW * 2;
  const height = blocksH * 2;
  const tileMap = new Array(width * height);
  const collisionGrid = new Array(width * height);

  for (let by = 0; by < blocksH; by++) {
    for (let bx = 0; bx < blocksW; bx++) {
      const b = blk[by * blocksW + bx];
      const t = [];
      for (let i = 0; i < 16; i++) t.push(ts.meta[b * 16 + i]);

      const quads = [
        [t[0], t[1], t[4], t[5]],
        [t[2], t[3], t[6], t[7]],
        [t[8], t[9], t[12], t[13]],
        [t[10], t[11], t[14], t[15]],
      ];
      const colls = ts.blockCollisions[b] || [1, 1, 1, 1];

      for (let q = 0; q < 4; q++) {
        const dx = q % 2;
        const dy = Math.floor(q / 2);
        const mx = bx * 2 + dx;
        const my = by * 2 + dy;
        const idx = my * width + mx;
        tileMap[idx] = renderQuadrant64(ts, quads[q]);
        collisionGrid[idx] = colls[q];
      }
    }
  }

  // Ensure all warps land on walkable (0)
  for (const w of warps) {
    collisionGrid[w.y * width + w.x] = 0;
  }

  const mapData = {
    id,
    name,
    width,
    height,
    tileSize: 64,
    groundLayer: [...collisionGrid],
    objectLayer: [],
    collisionGrid,
    tileMap,
    connections: {},
    warps,
    bgEvents,
    grassEncounters: [],
  };

  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(mapData, null, 2) + '\n');
  console.log(`Generated authentic ${id}.json (${width}x${height} step tiles, ${warps.length} warps)`);
}

// 1. Update tin_tower_1f.json to include Warp 3 to tin_tower_2f
const tin1fPath = path.join(MAPS_DIR, 'tin_tower_1f.json');
const tin1f = JSON.parse(fs.readFileSync(tin1fPath, 'utf8'));
tin1f.warps = [
  { x: 9, y: 15, targetMapId: 'ecruteak_city', targetX: 37, targetY: 7 },
  { x: 10, y: 15, targetMapId: 'ecruteak_city', targetX: 37, targetY: 7 },
  { x: 10, y: 2, targetMapId: 'tin_tower_2f', targetX: 10, targetY: 2 },
];
tin1f.collisionGrid[2 * tin1f.width + 10] = 0;
fs.writeFileSync(tin1fPath, JSON.stringify(tin1f, null, 2) + '\n');
console.log('Updated tin_tower_1f.json with Warp 3 -> tin_tower_2f');

// 2. Generate 2F through Roof
buildTowerMap({
  id: 'tin_tower_2f',
  name: 'Tin Tower 2F',
  blkFile: 'maps__TinTower2F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 10, y: 14, targetMapId: 'tin_tower_3f', targetX: 10, targetY: 14 },
    { x: 10, y: 2, targetMapId: 'tin_tower_1f', targetX: 10, targetY: 2 },
  ],
});

buildTowerMap({
  id: 'tin_tower_3f',
  name: 'Tin Tower 3F',
  blkFile: 'maps__TinTower3F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 10, y: 14, targetMapId: 'tin_tower_2f', targetX: 10, targetY: 14 },
    { x: 16, y: 2, targetMapId: 'tin_tower_4f', targetX: 16, targetY: 2 },
  ],
});

buildTowerMap({
  id: 'tin_tower_4f',
  name: 'Tin Tower 4F',
  blkFile: 'maps__TinTower4F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 2, y: 4, targetMapId: 'tin_tower_5f', targetX: 2, targetY: 4 },
    { x: 16, y: 2, targetMapId: 'tin_tower_3f', targetX: 16, targetY: 2 },
    { x: 2, y: 14, targetMapId: 'tin_tower_5f', targetX: 2, targetY: 14 },
    { x: 17, y: 15, targetMapId: 'tin_tower_5f', targetX: 17, targetY: 15 },
  ],
});

buildTowerMap({
  id: 'tin_tower_5f',
  name: 'Tin Tower 5F',
  blkFile: 'maps__TinTower5F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 11, y: 15, targetMapId: 'tin_tower_6f', targetX: 11, targetY: 15 },
    { x: 2, y: 4, targetMapId: 'tin_tower_4f', targetX: 2, targetY: 4 },
    { x: 2, y: 14, targetMapId: 'tin_tower_4f', targetX: 2, targetY: 14 },
    { x: 17, y: 15, targetMapId: 'tin_tower_4f', targetX: 17, targetY: 15 },
  ],
});

buildTowerMap({
  id: 'tin_tower_6f',
  name: 'Tin Tower 6F',
  blkFile: 'maps__TinTower6F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 3, y: 9, targetMapId: 'tin_tower_7f', targetX: 3, targetY: 9 },
    { x: 11, y: 15, targetMapId: 'tin_tower_5f', targetX: 11, targetY: 15 },
  ],
});

buildTowerMap({
  id: 'tin_tower_7f',
  name: 'Tin Tower 7F',
  blkFile: 'maps__TinTower7F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 3, y: 9, targetMapId: 'tin_tower_6f', targetX: 3, targetY: 9 },
    { x: 10, y: 15, targetMapId: 'tin_tower_8f', targetX: 2, targetY: 5 },
    { x: 12, y: 7, targetMapId: 'tin_tower_7f', targetX: 8, targetY: 3 },
    { x: 8, y: 3, targetMapId: 'tin_tower_7f', targetX: 12, targetY: 7 },
    { x: 6, y: 9, targetMapId: 'tin_tower_9f', targetX: 16, targetY: 7 },
  ],
});

buildTowerMap({
  id: 'tin_tower_8f',
  name: 'Tin Tower 8F',
  blkFile: 'maps__TinTower8F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 2, y: 5, targetMapId: 'tin_tower_7f', targetX: 10, targetY: 15 },
    { x: 2, y: 11, targetMapId: 'tin_tower_9f', targetX: 12, targetY: 3 },
    { x: 16, y: 7, targetMapId: 'tin_tower_9f', targetX: 2, targetY: 5 },
    { x: 10, y: 3, targetMapId: 'tin_tower_9f', targetX: 12, targetY: 7 },
    { x: 14, y: 15, targetMapId: 'tin_tower_9f', targetX: 6, targetY: 13 },
    { x: 6, y: 9, targetMapId: 'tin_tower_9f', targetX: 8, targetY: 13 },
  ],
});

buildTowerMap({
  id: 'tin_tower_9f',
  name: 'Tin Tower 9F',
  blkFile: 'maps__TinTower9F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 12, y: 3, targetMapId: 'tin_tower_8f', targetX: 2, targetY: 11 },
    { x: 2, y: 5, targetMapId: 'tin_tower_8f', targetX: 16, targetY: 7 },
    { x: 12, y: 7, targetMapId: 'tin_tower_8f', targetX: 10, targetY: 3 },
    { x: 7, y: 9, targetMapId: 'tin_tower_roof', targetX: 9, targetY: 13 },
    { x: 16, y: 7, targetMapId: 'tin_tower_7f', targetX: 6, targetY: 9 },
    { x: 6, y: 13, targetMapId: 'tin_tower_8f', targetX: 14, targetY: 15 },
    { x: 8, y: 13, targetMapId: 'tin_tower_8f', targetX: 6, targetY: 9 },
  ],
});

buildTowerMap({
  id: 'tin_tower_roof',
  name: 'Tin Tower Roof',
  blkFile: 'maps__TinTowerRoof.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 9, y: 13, targetMapId: 'tin_tower_9f', targetX: 7, targetY: 9 },
  ],
});
