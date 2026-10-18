const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const RAW_DIR = '/Users/bernardo/.gemini/antigravity/brain/4243653b-22ad-4a20-bb03-8ed14dca67e2/scratch/pokecrystal_raw';
const LOCAL_RAW_DIR = path.join(__dirname, 'pokecrystal_raw');
const TILES_DIR = path.join(projectRoot, 'public/assets/tiles');
const MAPS_DIR = path.join(projectRoot, 'public/assets/data/maps');

// Copy raw pokecrystal files into scripts/pokecrystal_raw if present in scratch
if (fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(LOCAL_RAW_DIR, { recursive: true });
  for (const f of fs.readdirSync(RAW_DIR)) {
    fs.copyFileSync(path.join(RAW_DIR, f), path.join(LOCAL_RAW_DIR, f));
  }
}

const SOURCE_DIR = fs.existsSync(LOCAL_RAW_DIR) ? LOCAL_RAW_DIR : RAW_DIR;

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

// 1. Decode johto.png and patch new_bark.png roof tiles into 0x0a..0x12
const johto = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__johto.png'));
const roof = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__new_bark.png'));
for (let i = 0; i < 9; i++) {
  const tid = 0x0a + i;
  const dstX = (tid % 16) * 8;
  const dstY = Math.floor(tid / 16) * 8;
  const srcX = (i % 3) * 8;
  const srcY = Math.floor(i / 3) * 8;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      johto.pixels[(dstY + y) * johto.width + (dstX + x)] = roof.pixels[(srcY + y) * 24 + (srcX + x)];
    }
  }
}

// 2. Parse johto_palette_map.asm (bank 0)
const palLines = fs
  .readFileSync(path.join(SOURCE_DIR, 'gfx__tilesets__johto_palette_map.asm'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.startsWith('tilepal 0,'));
const tilePalMap = [];
for (const l of palLines) {
  const parts = l
    .replace('tilepal 0,', '')
    .split(',')
    .map((s) => s.trim());
  tilePalMap.push(...parts);
}

// 3. Exact Game Boy Color Day Palettes (from gfx/tilesets/bg_tiles.pal & roofs.pal)
const gbc5to8 = (v) => Math.round((v * 255) / 31);
const makePal = (c0, c1, c2, c3) =>
  [c0, c1, c2, c3].map((c) => [gbc5to8(c[0]), gbc5to8(c[1]), gbc5to8(c[2]), 255]);

const BASE_PALETTES = {
  GRAY: makePal([27, 31, 27], [21, 21, 21], [13, 13, 13], [7, 7, 7]),
  RED: makePal([27, 31, 27], [31, 19, 24], [30, 10, 6], [7, 7, 7]),
  GREEN: makePal([22, 31, 10], [12, 25, 1], [5, 14, 0], [7, 7, 7]),
  WATER: makePal([23, 23, 31], [18, 19, 31], [13, 12, 31], [7, 7, 7]),
  YELLOW: makePal([27, 31, 27], [31, 31, 7], [31, 16, 1], [7, 7, 7]),
  BROWN: makePal([27, 31, 27], [24, 18, 7], [20, 15, 3], [7, 7, 7]),
};

const ROOF_PALETTES = {
  // group 24 (New Bark & Route 29): green roofs
  nb: makePal([27, 31, 27], [20, 31, 14], [11, 23, 5], [7, 7, 7]),
  // group 26 (Cherrygrove City): pink/magenta roofs
  cg: makePal([27, 31, 27], [31, 14, 28], [31, 5, 21], [7, 7, 7]),
};

// 4. Parse johto_collision.asm
const collLines = fs
  .readFileSync(path.join(SOURCE_DIR, 'data__tilesets__johto_collision.asm'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.startsWith('tilecoll'));

function mapCollToken(token) {
  if (
    token === 'FLOOR' ||
    token === 'DOOR' ||
    token.startsWith('WARP_CARPET')
  ) {
    return 0; // Walkable
  }
  if (token === 'TALL_GRASS') {
    return 2; // Tall grass (wild encounters)
  }
  if (token === 'WATER' || token === 'WHIRLPOOL') {
    return 3; // Water
  }
  return 1; // Solid (WALL, HEADBUTT_TREE, CUT_TREE, BUOY, HOP_*, etc.)
}

const blockCollisions = collLines.map((line) => {
  const body = line.split(';')[0].replace('tilecoll', '').trim();
  const tokens = body.split(',').map((s) => s.trim());
  return tokens.map(mapCollToken); // [TL, TR, BL, BR]
});

// 5. Render a 16x16 quadrant [tl, tr, bl, br] of 8x8 tiles to a 64x64 RGBA PNG (4x nearest-neighbor upscale)
const meta = fs.readFileSync(path.join(SOURCE_DIR, 'data__tilesets__johto_metatiles.bin'));
const generatedTiles = new Set();

function renderQuadrant64(quad8x8, roofGroup) {
  const hasRoof = quad8x8.some((tid) => tilePalMap[tid] === 'ROOF');
  const suffix = hasRoof ? `_${roofGroup}` : '';
  const tileName = `jt_${quad8x8.map((x) => x.toString(16).padStart(2, '0')).join('_')}${suffix}`;

  if (!generatedTiles.has(tileName)) {
    const rgba = Buffer.alloc(64 * 64 * 4);
    for (let qy = 0; qy < 2; qy++) {
      for (let qx = 0; qx < 2; qx++) {
        const tid = quad8x8[qy * 2 + qx];
        const palName = tilePalMap[tid] || 'GRAY';
        const pal = palName === 'ROOF' ? ROOF_PALETTES[roofGroup] : BASE_PALETTES[palName] || BASE_PALETTES.GRAY;
        const srcX = (tid % 16) * 8;
        const srcY = Math.floor(tid / 16) * 8;

        for (let py = 0; py < 8; py++) {
          for (let px = 0; px < 8; px++) {
            const val2b = johto.pixels[(srcY + py) * johto.width + (srcX + px)];
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
    fs.writeFileSync(path.join(TILES_DIR, `${tileName}.png`), createPNG(64, 64, rgba));
    generatedTiles.add(tileName);
  }

  return tileName;
}

// 6. Build MapData JSON from .blk binary
function buildMapFromBlk({
  id,
  name,
  blkFile,
  blocksW,
  blocksH,
  roofGroup,
  connections,
  warps,
  grassEncounters,
}) {
  const blk = fs.readFileSync(path.join(SOURCE_DIR, blkFile));
  const width = blocksW * 2;
  const height = blocksH * 2;
  const tileMap = new Array(width * height);
  const collisionGrid = new Array(width * height);

  for (let by = 0; by < blocksH; by++) {
    for (let bx = 0; bx < blocksW; bx++) {
      const b = blk[by * blocksW + bx];
      const t = [];
      for (let i = 0; i < 16; i++) t.push(meta[b * 16 + i]);

      const quads = [
        [t[0], t[1], t[4], t[5]],   // TL (dx=0, dy=0)
        [t[2], t[3], t[6], t[7]],   // TR (dx=1, dy=0)
        [t[8], t[9], t[12], t[13]], // BL (dx=0, dy=1)
        [t[10], t[11], t[14], t[15]], // BR (dx=1, dy=1)
      ];
      const colls = blockCollisions[b] || [1, 1, 1, 1];

      for (let q = 0; q < 4; q++) {
        const dx = q % 2;
        const dy = Math.floor(q / 2);
        const mx = bx * 2 + dx;
        const my = by * 2 + dy;
        const idx = my * width + mx;
        tileMap[idx] = renderQuadrant64(quads[q], roofGroup);
        collisionGrid[idx] = colls[q];
      }
    }
  }

  // Ensure all warp door coordinates are walkable (0)
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
    connections,
    warps,
    grassEncounters,
  };

  fs.writeFileSync(path.join(MAPS_DIR, `${id}.json`), JSON.stringify(mapData, null, 2) + '\n');
  console.log(`Built authentic ${id}.json (${width}x${height} step tiles)`);
}

// Build New Bark Town (10x9 blocks = 20x18 step tiles)
buildMapFromBlk({
  id: 'new_bark_town',
  name: 'New Bark Town',
  blkFile: 'maps__NewBarkTown.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'nb',
  connections: {
    WEST: { mapId: 'route_29', offset: 0 },
  },
  warps: [
    { x: 6, y: 3, targetMapId: 'elms_lab', targetX: 4, targetY: 7 },
    { x: 13, y: 5, targetMapId: 'players_house_1f', targetX: 3, targetY: 6 },
    { x: 3, y: 11, targetMapId: 'players_neighbors_house', targetX: 3, targetY: 6 },
    { x: 11, y: 13, targetMapId: 'elms_house', targetX: 3, targetY: 6 },
  ],
  grassEncounters: [],
});

// Build Route 29 (30x9 blocks = 60x18 step tiles)
buildMapFromBlk({
  id: 'route_29',
  name: 'Route 29',
  blkFile: 'maps__Route29.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'nb',
  connections: {
    EAST: { mapId: 'new_bark_town', offset: 0 },
    WEST: { mapId: 'cherrygrove_city', offset: 0 },
  },
  warps: [
    { x: 27, y: 1, targetMapId: 'route_29_route_46_gate', targetX: 4, targetY: 7 },
  ],
  grassEncounters: [
    { speciesId: 'pidgey', minLevel: 2, maxLevel: 4, weight: 50 },
    { speciesId: 'sentret', minLevel: 2, maxLevel: 3, weight: 35 },
    { speciesId: 'rattata', minLevel: 2, maxLevel: 4, weight: 15 },
  ],
});

// Build Cherrygrove City (20x9 blocks = 40x18 step tiles)
buildMapFromBlk({
  id: 'cherrygrove_city',
  name: 'Cherrygrove City',
  blkFile: 'maps__CherrygroveCity.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'cg',
  connections: {
    EAST: { mapId: 'route_29', offset: 0 },
  },
  warps: [
    { x: 23, y: 3, targetMapId: 'cherrygrove_mart', targetX: 3, targetY: 7 },
    { x: 29, y: 3, targetMapId: 'cherrygrove_poke_center', targetX: 3, targetY: 7 },
    { x: 17, y: 7, targetMapId: 'cherrygrove_gym_speech_house', targetX: 3, targetY: 7 },
    { x: 25, y: 9, targetMapId: 'guide_gents_house', targetX: 3, targetY: 7 },
    { x: 31, y: 11, targetMapId: 'cherrygrove_evolution_speech_house', targetX: 3, targetY: 7 },
  ],
  grassEncounters: [],
});

console.log(`Total authentic 64x64 quadrant PNGs generated: ${generatedTiles.size}`);
console.log('TILE_LIST_JSON=' + JSON.stringify(Array.from(generatedTiles).sort()));
