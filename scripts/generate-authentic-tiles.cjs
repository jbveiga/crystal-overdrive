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

const OUTDOOR_PALETTES = {
  GRAY: makePal([27, 31, 27], [21, 21, 21], [13, 13, 13], [7, 7, 7]),
  RED: makePal([27, 31, 27], [31, 19, 24], [30, 10, 6], [7, 7, 7]),
  GREEN: makePal([22, 31, 10], [12, 25, 1], [5, 14, 0], [7, 7, 7]),
  WATER: makePal([23, 23, 31], [18, 19, 31], [13, 12, 31], [7, 7, 7]),
  YELLOW: makePal([27, 31, 27], [31, 31, 7], [31, 16, 1], [7, 7, 7]),
  BROWN: makePal([27, 31, 27], [24, 18, 7], [20, 15, 3], [7, 7, 7]),
};

const ROOF_PALETTES = {
  nb: makePal([27, 31, 27], [20, 31, 14], [11, 23, 5], [7, 7, 7]),
  cg: makePal([27, 31, 27], [31, 14, 28], [31, 5, 21], [7, 7, 7]),
  vc: makePal([27, 31, 27], [24, 14, 31], [13, 7, 21], [7, 7, 7]),
  az: makePal([27, 31, 27], [22, 20, 10], [17, 14, 3], [7, 7, 7]),
  gr: makePal([27, 31, 27], [25, 25, 0], [20, 17, 8], [7, 7, 7]),
  ol: makePal([27, 31, 27], [14, 17, 31], [7, 11, 15], [7, 7, 7]),
  ci: makePal([27, 31, 27], [15, 10, 31], [7, 5, 15], [7, 7, 7]),
  mh: makePal([27, 31, 27], [12, 19, 0], [6, 10, 0], [7, 7, 7]),
  bt: makePal([27, 31, 27], [11, 10, 16], [5, 6, 7], [7, 7, 7]),
  lr: makePal([27, 31, 27], [31, 8, 4], [9, 9, 8], [7, 7, 7]),
  vi: makePal([27, 31, 27], [21, 31, 7], [13, 25, 4], [7, 7, 7]),
  in: makePal([27, 31, 27], [21, 21, 21], [13, 13, 13], [7, 7, 7]),
  pa: makePal([27, 31, 27], [27, 28, 31], [17, 19, 22], [7, 7, 7]),
  pe: makePal([27, 31, 27], [19, 19, 16], [10, 12, 15], [7, 7, 7]),
  ce: makePal([27, 31, 27], [17, 27, 31], [5, 15, 31], [7, 7, 7]),
  ve: makePal([27, 31, 27], [27, 23, 1], [23, 11, 0], [7, 7, 7]),
  cd: makePal([27, 31, 27], [19, 31, 15], [31, 22, 2], [7, 7, 7]),
  fu: makePal([27, 31, 27], [31, 18, 29], [17, 13, 20], [7, 7, 7]),
  sa: makePal([27, 31, 27], [31, 26, 0], [31, 15, 0], [7, 7, 7]),
  cn: makePal([27, 31, 27], [31, 10, 0], [18, 6, 0], [7, 7, 7]),
  la: makePal([27, 31, 27], [23, 15, 31], [16, 5, 31], [7, 7, 7]),
};

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

const waterAnim = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__water__water.png'));
const roofNewBark = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__new_bark.png'));
const roofViolet = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__violet.png'));
const roofAzalea = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__azalea.png'));
const roofGoldenrod = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__goldenrod.png'));
const roofOlivine = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__olivine.png'));

const ROOF_GRAPHICS = {
  nb: roofNewBark,
  cg: roofNewBark,
  vc: roofViolet,
  az: roofAzalea,
  gr: roofGoldenrod,
  ol: roofOlivine,
  ci: roofOlivine,
  mh: roofAzalea,
  bt: roofAzalea,
  lr: roofAzalea,
};

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

function loadTileset(tsName, isOutdoor = false) {
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
  return { tsName, isOutdoor, png, pal0, pal1, blockCollisions, meta };
}

const TILESETS = {
  johto: loadTileset('johto', true),
  lab: loadTileset('lab', false),
  players_house: loadTileset('players_house', false),
  house: loadTileset('house', false),
  traditional_house: loadTileset('traditional_house', false),
  pokecenter: loadTileset('pokecenter', false),
  mart: loadTileset('mart', false),
  gate: loadTileset('gate', false),
  tower: loadTileset('tower', false),
  elite_four_room: loadTileset('elite_four_room', false),
  cave: loadTileset('cave', false),
  forest: loadTileset('forest', false),
  radio_tower: loadTileset('radio_tower', false),
  underground: loadTileset('underground', false),
  game_corner: loadTileset('game_corner', false),
  park: loadTileset('park', true),
  lighthouse: loadTileset('lighthouse', false),
  champions_room: loadTileset('champions_room', false),
  ice_path: loadTileset('ice_path', false),
  facility: loadTileset('facility', false),
  kanto: loadTileset('kanto', true),
  ruins_of_alph: loadTileset('ruins_of_alph', false),
};

const generatedTiles = new Set();

function buildQuadrantBuffer(ts, quad8x8, roofGroup, waterFrameIdx = 0) {
  const rgba = Buffer.alloc(64 * 64 * 4);
  const palettes = ts.isOutdoor ? OUTDOOR_PALETTES : INDOOR_PALETTES;

  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      const tid = quad8x8[qy * 2 + qx];
      const palName = (tid >= 0x80 ? ts.pal1[tid - 0x80] : ts.pal0[tid]) || 'GRAY';
      const pal =
        ts.isOutdoor && palName === 'ROOF'
          ? ROOF_PALETTES[roofGroup] || ROOF_PALETTES.nb
          : palettes[palName] || palettes.GRAY;
      const pngTid = tid >= 0x80 ? (ts.png.height > 48 ? tid - 0x20 : tid - 0x80) : tid;
      const srcX = (pngTid % 16) * 8;
      const srcY = Math.floor(pngTid / 16) * 8;
      const isRoofTile = ts.isOutdoor && ts.tsName !== 'kanto' && tid >= 0x0a && tid <= 0x12;

      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          let val2b;
          if (ts.isOutdoor && ts.tsName !== 'kanto' && tid === 0x14) {
            val2b = waterAnim.pixels[(waterFrameIdx * 8 + py) * 8 + px];
          } else if (isRoofTile) {
            const roofImg = ROOF_GRAPHICS[roofGroup] || roofNewBark;
            const rIdx = tid - 0x0a;
            const rX = (rIdx % 3) * 8;
            const rY = Math.floor(rIdx / 3) * 8;
            val2b = roofImg.pixels[(rY + py) * 24 + (rX + px)];
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

function renderQuadrant64(ts, quad8x8, roofGroup) {
  const prefix = ts.tsName === 'kanto' ? 'kt' : ts.isOutdoor ? 'jt' : `in_${ts.tsName}`;
  const hasRoof = ts.isOutdoor && (quad8x8.some((tid) => ts.pal0[tid] === 'ROOF') || (ts.tsName !== 'kanto' && quad8x8.some((tid) => tid >= 0x0a && tid <= 0x12)));
  const hasWater = ts.isOutdoor && ts.tsName !== 'kanto' && quad8x8.includes(0x14);
  const suffix = hasRoof ? `_${roofGroup}` : '';
  const tileName = `${prefix}_${quad8x8.map((x) => x.toString(16).padStart(2, '0')).join('_')}${suffix}`;

  if (!generatedTiles.has(tileName)) {
    const rgba0 = buildQuadrantBuffer(ts, quad8x8, roofGroup, 0);
    fs.writeFileSync(path.join(TILES_DIR, `${tileName}.png`), createPNG(64, 64, rgba0));
    generatedTiles.add(tileName);

    if (hasWater) {
      const rgba1 = buildQuadrantBuffer(ts, quad8x8, roofGroup, 1);
      const rgba2 = buildQuadrantBuffer(ts, quad8x8, roofGroup, 2);
      fs.writeFileSync(path.join(TILES_DIR, `${tileName}__w1.png`), createPNG(64, 64, rgba1));
      fs.writeFileSync(path.join(TILES_DIR, `${tileName}__w2.png`), createPNG(64, 64, rgba2));
    }
  }

  return tileName;
}

function buildMapFromBlk({
  id,
  name,
  tileset,
  blkFile,
  blocksW,
  blocksH,
  roofGroup = 'nb',
  connections = {},
  warps = [],
  bgEvents = [],
  grassEncounters = [],
}) {
  const filter = process.argv.slice(2);
  if (filter.length > 0 && !filter.includes(id)) {
    return;
  }
  if (!TILESETS[tileset]) {
    const isOutdoor = tileset === 'johto' || tileset === 'kanto' || tileset === 'park';
    TILESETS[tileset] = loadTileset(tileset, isOutdoor);
  }
  const ts = TILESETS[tileset];
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
        tileMap[idx] = renderQuadrant64(ts, quads[q], roofGroup);
        // Mark South-facing one-way ledge cliff tiles (bottom 8x8 tiles 0x4b/0x4c/0x4d) as collision 4
        const isSouthLedgeRim =
          ts.isOutdoor &&
          (quads[q][2] === 0x4b || quads[q][2] === 0x4c || quads[q][2] === 0x4d) &&
          (quads[q][3] === 0x4b || quads[q][3] === 0x4c || quads[q][3] === 0x4d);
        let coll = colls[q];
        if (coll === 0 && isSouthLedgeRim) {
          coll = 4;
        }
        collisionGrid[idx] = coll;
      }
    }
  }

  // For ruins_of_alph_outside, ensure all 108 cave roof tiles are solid (1) (BUGFIX-RUINS-OF-ALPH-WARPS-COLLISION-01)
  if (id === 'ruins_of_alph_outside') {
    for (let i = 0; i < tileMap.length; i++) {
      if (tileMap[i] === 'jt_3c_3c_3c_3c') {
        collisionGrid[i] = 1;
      }
    }
  }

  // For union_cave_b2f, ensure Friday Lapras coordinate (11, 31) is walkable water (2)
  if (id === 'union_cave_b2f') {
    collisionGrid[31 * width + 11] = 2;
  }

  // For route_34, ensure canonical trainer coordinates are walkable (0)
  if (id === 'route_34') {
    collisionGrid[20 * width + 11] = 0; // Youngster Ian
    collisionGrid[26 * width + 10] = 0; // Picnicker Gina
    collisionGrid[28 * width + 18] = 0; // Pokefan Brandon
  }

  // For goldenrod_underground, ensure Coin Case item ball at (7, 25) is walkable (0)
  if (id === 'goldenrod_underground') {
    collisionGrid[25 * width + 7] = 0;
  }

  // Ensure all warp door/carpet coordinates are walkable (0)
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
    bgEvents,
    grassEncounters,
  };

  fs.writeFileSync(path.join(MAPS_DIR, `${id}.json`), JSON.stringify(mapData, null, 2) + '\n');
  console.log(`Built authentic ${id}.json (${width}x${height} step tiles)`);
}

// 1. Overworld Maps
buildMapFromBlk({
  id: 'new_bark_town',
  name: 'New Bark Town',
  tileset: 'johto',
  blkFile: 'maps__NewBarkTown.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'nb',
  connections: {
    WEST: { mapId: 'route_29', offset: 0 },
  },
  warps: [
    { x: 6, y: 3, targetMapId: 'elms_lab', targetX: 4, targetY: 10 },
    { x: 13, y: 5, targetMapId: 'players_house_1f', targetX: 6, targetY: 6 },
    { x: 3, y: 11, targetMapId: 'players_neighbors_house', targetX: 2, targetY: 6 },
    { x: 11, y: 13, targetMapId: 'elms_house', targetX: 2, targetY: 6 },
  ],
  bgEvents: [
    {
      x: 8,
      y: 8,
      speaker: '🪧 NEW BARK TOWN SIGN',
      pages: ['NEW BARK TOWN', 'The Town Where the Winds of a New Beginning Blow'],
    },
    {
      x: 11,
      y: 5,
      speaker: '🪧 HOUSE SIGN',
      pages: ["GOLD's House"],
    },
    {
      x: 3,
      y: 3,
      speaker: '🪧 LAB SIGN',
      pages: ['ELM POKéMON LAB'],
    },
    {
      x: 9,
      y: 13,
      speaker: '🪧 HOUSE SIGN',
      pages: ["ELM'S HOUSE"],
    },
  ],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_29',
  name: 'Route 29',
  tileset: 'johto',
  blkFile: 'maps__Route29.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'nb',
  connections: {
    EAST: { mapId: 'new_bark_town', offset: 0 },
    WEST: { mapId: 'cherrygrove_city', offset: 0 },
  },
  warps: [],
  bgEvents: [
    {
      x: 51,
      y: 7,
      speaker: '🪧 ROUTE 29 SIGN',
      pages: ['ROUTE 29', 'CHERRYGROVE CITY - NEW BARK TOWN'],
    },
    {
      x: 3,
      y: 5,
      speaker: '🪧 ROUTE 29 SIGN',
      pages: ['ROUTE 29', 'CHERRYGROVE CITY - NEW BARK TOWN'],
    },
    {
      x: 12,
      y: 2,
      speaker: '🌳 FRUIT TREE',
      pages: ["It's a fruit-bearing tree!", 'A fragrant PSNCUREBERRY is growing on the branches!'],
    },
  ],
  grassEncounters: [
    { speciesId: 'pidgey', minLevel: 2, maxLevel: 4, weight: 50 },
    { speciesId: 'sentret', minLevel: 2, maxLevel: 3, weight: 35 },
    { speciesId: 'rattata', minLevel: 2, maxLevel: 4, weight: 15 },
  ],
});

buildMapFromBlk({
  id: 'cherrygrove_city',
  name: 'Cherrygrove City',
  tileset: 'johto',
  blkFile: 'maps__CherrygroveCity.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'cg',
  connections: {
    EAST: { mapId: 'route_29', offset: 0 },
    NORTH: { mapId: 'route_30', offset: 10 },
  },
  warps: [
    { x: 23, y: 3, targetMapId: 'cherrygrove_mart', targetX: 2, targetY: 6 },
    { x: 29, y: 3, targetMapId: 'cherrygrove_poke_center', targetX: 3, targetY: 6 },
    { x: 17, y: 7, targetMapId: 'cherrygrove_gym_speech_house', targetX: 2, targetY: 6 },
    { x: 25, y: 9, targetMapId: 'guide_gents_house', targetX: 2, targetY: 6 },
    { x: 31, y: 11, targetMapId: 'cherrygrove_evolution_speech_house', targetX: 2, targetY: 6 },
  ],
  bgEvents: [
    {
      x: 30,
      y: 8,
      speaker: '🪧 CHERRYGROVE CITY SIGN',
      pages: ['CHERRYGROVE CITY', 'The City of Cute, Fragrant Flowers'],
    },
    {
      x: 23,
      y: 9,
      speaker: '🪧 HOUSE SIGN',
      pages: ["GUIDE GENT'S HOUSE"],
    },
    {
      x: 24,
      y: 3,
      speaker: '🪧 POKéMON MART SIGN',
      pages: ['Catch All Your POKéMON Needs!', 'POKéMON MART'],
    },
    {
      x: 30,
      y: 3,
      speaker: '🪧 POKéMON CENTER SIGN',
      pages: ['Heal Your POKéMON!', 'POKéMON CENTER'],
    },
  ],
  grassEncounters: [],
});

// 2. Authentic Indoor Maps
buildMapFromBlk({
  id: 'elms_lab',
  name: "Prof. Elm's Lab",
  tileset: 'lab',
  blkFile: 'maps__ElmsLab.blk',
  blocksW: 5,
  blocksH: 6,
  warps: [
    { x: 4, y: 11, targetMapId: 'new_bark_town', targetX: 6, targetY: 4 },
    { x: 5, y: 11, targetMapId: 'new_bark_town', targetX: 6, targetY: 4 },
  ],
  bgEvents: [
    {
      x: 2,
      y: 1,
      speaker: '💊 HEALING MACHINE',
      pages: ['Placed the POKé BALLS in the healing machine…', 'Your POKéMON were restored to full HP & PP!'],
      action: 'HEAL_AND_SAVE',
    },
    {
      x: 5,
      y: 0,
      speaker: '🪟 LAB WINDOW',
      pages: ["The window's open.", 'A pleasant breeze is blowing in.'],
    },
    {
      x: 9,
      y: 3,
      speaker: '🗑️ TRASH CAN',
      pages: ['The wrapper from the snack PROF. ELM ate is in there…'],
    },
    {
      x: 3,
      y: 5,
      speaker: '💻 LAB PC',
      pages: ['OBSERVATIONS ON POKéMON EVOLUTION', '…It says on the screen…'],
    },
    {
      x: 0,
      y: 7,
      speaker: '📘 TRAVEL TIP 1',
      pages: ['GOLD opened a book.', 'Travel Tip 1: Press SPACE or ENTER to read signs and talk to people!'],
    },
    {
      x: 1,
      y: 7,
      speaker: '📘 TRAVEL TIP 2',
      pages: ['GOLD opened a book.', 'Travel Tip 2: Record your trip with SAVE!'],
    },
    {
      x: 2,
      y: 7,
      speaker: '📘 TRAVEL TIP 3',
      pages: ['GOLD opened a book.', 'Travel Tip 3: Open your BAG to teach TMs like False Swipe & Mean Look!'],
    },
    {
      x: 3,
      y: 7,
      speaker: '📘 TRAVEL TIP 4',
      pages: ['GOLD opened a book.', 'Travel Tip 4: Check your POKéGEAR Radar to track Raikou, Entei & Suicune!'],
    },
    ...[6, 7, 8, 9].map((x) => ({
      x,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ["It's crammed full of difficult POKéMON research books!"],
    })),
    ...[6, 7, 8, 9].map((x) => ({
      x,
      y: 7,
      speaker: '📚 BOOKSHELF',
      pages: ["It's crammed full of difficult POKéMON research books!"],
    })),
  ],
});

buildMapFromBlk({
  id: 'players_house_1f',
  name: "Player's House",
  tileset: 'players_house',
  blkFile: 'maps__PlayersHouse1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 6, y: 7, targetMapId: 'new_bark_town', targetX: 13, targetY: 6 },
    { x: 7, y: 7, targetMapId: 'new_bark_town', targetX: 13, targetY: 6 },
    { x: 9, y: 0, targetMapId: 'players_house_2f', targetX: 7, targetY: 1 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '🍳 STOVE',
      pages: ["Mom's specialty!", 'CINNABAR VOLCANO BURGER!'],
    },
    {
      x: 1,
      y: 1,
      speaker: '🚰 SINK',
      pages: ['The sink is spotless. Mom likes it clean.'],
    },
    {
      x: 2,
      y: 1,
      speaker: '🧊 FRIDGE',
      pages: ["Let's see what's in the fridge…", 'FRESH WATER and tasty LEMONADE!'],
    },
    {
      x: 4,
      y: 1,
      speaker: '📺 TELEVISION',
      pages: [
        "There's a movie on TV: Stars dot the sky as two boys ride on a train…",
        "I'd better get rolling too!",
      ],
    },
  ],
});

buildMapFromBlk({
  id: 'players_neighbors_house',
  name: "Neighbor's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'new_bark_town', targetX: 3, targetY: 12 },
    { x: 3, y: 7, targetMapId: 'new_bark_town', targetX: 3, targetY: 12 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
    {
      x: 1,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
    {
      x: 7,
      y: 1,
      speaker: '📻 RADIO',
      pages: ["PROF. OAK'S POKéMON TALK! Please tune in next time!", 'This is DJ MARY, your co-host! POKéMON CHANNEL…'],
    },
  ],
});

buildMapFromBlk({
  id: 'elms_house',
  name: "Elm's House",
  tileset: 'players_house',
  blkFile: 'maps__ElmsHouse.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'new_bark_town', targetX: 11, targetY: 14 },
    { x: 3, y: 7, targetMapId: 'new_bark_town', targetX: 11, targetY: 14 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '💻 PROF. ELM PC',
      pages: [
        '"POKéMON. Where do they come from? Where are they going?"',
        '"Why has no one ever witnessed a POKéMON\'s birth? I want to know! I will dedicate my life to the study of POKéMON!"',
        "…It's a part of PROF. ELM's research papers.",
      ],
    },
    {
      x: 6,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ["It's crammed full of difficult POKéMON books."],
    },
    {
      x: 7,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ["It's crammed full of difficult POKéMON books."],
    },
  ],
});

buildMapFromBlk({
  id: 'cherrygrove_mart',
  name: 'Cherrygrove Poké Mart',
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'cherrygrove_city', targetX: 23, targetY: 4 },
    { x: 3, y: 7, targetMapId: 'cherrygrove_city', targetX: 23, targetY: 4 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'cherrygrove_poke_center',
  name: 'Cherrygrove Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'cherrygrove_city', targetX: 29, targetY: 4 },
    { x: 4, y: 7, targetMapId: 'cherrygrove_city', targetX: 29, targetY: 4 },
  ],
  bgEvents: [
    {
      x: 9,
      y: 1,
      speaker: "💻 BILL'S PC",
      pages: ["Accessed BILL'S PC!", 'POKéMON Storage System is online and synced.'],
    },
  ],
});

buildMapFromBlk({
  id: 'guide_gents_house',
  name: "Guide Gent's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'cherrygrove_city', targetX: 25, targetY: 10 },
    { x: 3, y: 7, targetMapId: 'cherrygrove_city', targetX: 25, targetY: 10 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
    {
      x: 1,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
  ],
});

buildMapFromBlk({
  id: 'cherrygrove_gym_speech_house',
  name: 'Cherrygrove House',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'cherrygrove_city', targetX: 17, targetY: 8 },
    { x: 3, y: 7, targetMapId: 'cherrygrove_city', targetX: 17, targetY: 8 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
    {
      x: 1,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
  ],
});

buildMapFromBlk({
  id: 'cherrygrove_evolution_speech_house',
  name: 'Evolution Speech House',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'cherrygrove_city', targetX: 31, targetY: 12 },
    { x: 3, y: 7, targetMapId: 'cherrygrove_city', targetX: 31, targetY: 12 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
    {
      x: 1,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
  ],
});

buildMapFromBlk({
  id: 'route_30',
  name: 'Route 30',
  tileset: 'johto',
  blkFile: 'maps__Route30.blk',
  blocksW: 10,
  blocksH: 27,
  roofGroup: 'cg',
  connections: {
    SOUTH: { mapId: 'cherrygrove_city', offset: -10 },
    NORTH: { mapId: 'route_31', offset: -20 },
  },
  warps: [
    { x: 7, y: 39, targetMapId: 'route_30_berry_house', targetX: 2, targetY: 6 },
    { x: 17, y: 5, targetMapId: 'mr_pokemons_house', targetX: 2, targetY: 6 },
  ],
  bgEvents: [
    {
      x: 9,
      y: 43,
      speaker: '🪧 ROUTE 30 SIGN',
      pages: ['ROUTE 30', 'VIOLET CITY - CHERRYGROVE CITY'],
    },
    {
      x: 13,
      y: 29,
      speaker: '🪧 DIRECTION SIGN',
      pages: ["MR. POKéMON'S HOUSE", 'STRAIGHT AHEAD!'],
    },
    {
      x: 15,
      y: 5,
      speaker: '🪧 HOUSE SIGN',
      pages: ["MR. POKéMON'S HOUSE"],
    },
    {
      x: 3,
      y: 21,
      speaker: '🪧 TRAINER TIPS',
      pages: [
        'TRAINER TIPS',
        "No stealing other people's POKéMON! POKé BALLS are to be thrown only at wild POKéMON!",
      ],
    },
    {
      x: 5,
      y: 39,
      speaker: '🌳 FRUIT TREE',
      pages: ["It's a fruit-bearing tree!", 'A fresh BERRY is growing on the branches!'],
    },
    {
      x: 11,
      y: 5,
      speaker: '🌳 FRUIT TREE',
      pages: ["It's a fruit-bearing tree!", 'A fragrant PSNCUREBERRY is growing on the branches!'],
    },
  ],
  grassEncounters: [
    { speciesId: 'pidgey', minLevel: 3, maxLevel: 5, weight: 40 },
    { speciesId: 'caterpie', minLevel: 3, maxLevel: 4, weight: 35 },
    { speciesId: 'rattata', minLevel: 3, maxLevel: 4, weight: 15 },
    { speciesId: 'hoothoot', minLevel: 4, maxLevel: 5, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'route_31',
  name: 'Route 31',
  tileset: 'johto',
  blkFile: 'maps__Route31.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'cg',
  connections: {
    SOUTH: { mapId: 'route_30', offset: 20 },
  },
  warps: [
    { x: 4, y: 6, targetMapId: 'route_31_violet_gate', targetX: 9, targetY: 4 },
    { x: 4, y: 7, targetMapId: 'route_31_violet_gate', targetX: 9, targetY: 5 },
  ],
  bgEvents: [
    {
      x: 7,
      y: 5,
      speaker: '🪧 ROUTE 31 SIGN',
      pages: ['ROUTE 31', 'VIOLET CITY - CHERRYGROVE CITY'],
    },
    {
      x: 31,
      y: 5,
      speaker: '🪧 DARK CAVE SIGN',
      pages: ['DARK CAVE', 'If a POKéMON could light it up, you could explore inside!'],
    },
    {
      x: 16,
      y: 7,
      speaker: '🌳 FRUIT TREE',
      pages: ["It's a fruit-bearing tree!", 'A crisp BITTER BERRY is growing on the branches!'],
    },
    {
      x: 34,
      y: 5,
      speaker: '🪨 DARK CAVE ENTRANCE',
      pages: [
        'It is pitch-black and eerily silent inside...',
        'The cavern air is thick and damp. You cannot safely navigate without the HM move FLASH!',
        'Wild and restless Pokémon stir in the deep darkness. It would be reckless to venture further without preparation!',
      ],
    },
  ],
  grassEncounters: [
    { speciesId: 'bellsprout', minLevel: 4, maxLevel: 5, weight: 35 },
    { speciesId: 'pidgey', minLevel: 4, maxLevel: 5, weight: 30 },
    { speciesId: 'caterpie', minLevel: 4, maxLevel: 5, weight: 20 },
    { speciesId: 'gastly', minLevel: 4, maxLevel: 5, weight: 15 },
  ],
});

buildMapFromBlk({
  id: 'mr_pokemons_house',
  name: "Mr. Pokémon's House",
  tileset: 'players_house',
  blkFile: 'maps__House2.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'route_30', targetX: 17, targetY: 6 },
    { x: 3, y: 7, targetMapId: 'route_30', targetX: 17, targetY: 6 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 FOREIGN MAGAZINES',
      pages: ["It's packed with foreign magazines.", "Can't even read their titles…"],
    },
    {
      x: 1,
      y: 1,
      speaker: '📚 FOREIGN MAGAZINES',
      pages: ["It's packed with foreign magazines.", "Can't even read their titles…"],
    },
    {
      x: 6,
      y: 1,
      speaker: '💻 BROKEN COMPUTER',
      pages: ["It's a big computer. Hmm. It's broken."],
    },
    {
      x: 7,
      y: 1,
      speaker: '💻 BROKEN COMPUTER',
      pages: ["It's a big computer. Hmm. It's broken."],
    },
    {
      x: 6,
      y: 4,
      speaker: '🪙 STRANGE COINS',
      pages: ['A whole pile of strange coins!', "Maybe they're from another country…"],
    },
  ],
});

buildMapFromBlk({
  id: 'route_30_berry_house',
  name: 'Route 30 Berry House',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'route_30', targetX: 7, targetY: 40 },
    { x: 3, y: 7, targetMapId: 'route_30', targetX: 7, targetY: 40 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
    {
      x: 1,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON magazines! POKéMON PAL, POKéMON HANDBOOK, POKéMON GRAPH…'],
    },
  ],
});

// ==========================================
// Phase 4: Violet City, Sprout Tower & Violet Gym
// ==========================================

buildMapFromBlk({
  id: 'violet_city',
  name: 'Violet City',
  tileset: 'johto',
  blkFile: 'maps__VioletCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'vc',
  connections: {
    SOUTH: { mapId: 'route_32', offset: 0 },
  },
  warps: [
    { x: 9, y: 17, targetMapId: 'violet_mart', targetX: 2, targetY: 7 },
    { x: 18, y: 17, targetMapId: 'violet_gym', targetX: 4, targetY: 15 },
    { x: 30, y: 17, targetMapId: 'earls_pokemon_academy', targetX: 3, targetY: 15 },
    { x: 3, y: 15, targetMapId: 'violet_nickname_speech_house', targetX: 3, targetY: 7 },
    { x: 31, y: 25, targetMapId: 'violet_poke_center', targetX: 3, targetY: 7 },
    { x: 21, y: 29, targetMapId: 'violet_kyles_house', targetX: 3, targetY: 7 },
    { x: 23, y: 5, targetMapId: 'sprout_tower_1f', targetX: 9, targetY: 15 },
    { x: 39, y: 24, targetMapId: 'route_31_violet_gate', targetX: 0, targetY: 4 },
    { x: 39, y: 25, targetMapId: 'route_31_violet_gate', targetX: 0, targetY: 5 },
  ],
  bgEvents: [
    {
      x: 24,
      y: 20,
      speaker: '🪧 VIOLET CITY SIGN',
      pages: ['VIOLET CITY', 'The City of Nostalgic Scents'],
    },
    {
      x: 15,
      y: 17,
      speaker: '🏛️ VIOLET GYM SIGN',
      pages: ['VIOLET CITY POKéMON GYM', 'LEADER: FALKNER', 'The Elegant Master of Flying POKéMON'],
    },
    {
      x: 24,
      y: 8,
      speaker: '🪧 SPROUT TOWER SIGN',
      pages: ['SPROUT TOWER', 'Experience the Way of POKéMON'],
    },
    {
      x: 27,
      y: 17,
      speaker: '🎓 EARL’S ACADEMY SIGN',
      pages: ["EARL'S POKéMON ACADEMY"],
    },
    {
      x: 32,
      y: 25,
      speaker: '🏥 POKéMON CENTER SIGN',
      pages: ['Heal Your POKéMON! POKéMON CENTER'],
    },
    {
      x: 10,
      y: 17,
      speaker: '🏪 POKé MART SIGN',
      pages: ['For All Your Item Needs! POKé MART'],
    },
    {
      x: 37,
      y: 14,
      speaker: '✨ HIDDEN ITEM',
      pages: ['You found a hidden HYPER POTION!'],
    },
  ],
});

buildMapFromBlk({
  id: 'sprout_tower_1f',
  name: 'Sprout Tower 1F',
  tileset: 'tower',
  blkFile: 'maps__SproutTower1F.blk',
  blocksW: 10,
  blocksH: 8,
  warps: [
    { x: 9, y: 15, targetMapId: 'violet_city', targetX: 23, targetY: 6 },
    { x: 10, y: 15, targetMapId: 'violet_city', targetX: 23, targetY: 6 },
    { x: 6, y: 4, targetMapId: 'sprout_tower_2f', targetX: 6, targetY: 4 },
    { x: 2, y: 6, targetMapId: 'sprout_tower_2f', targetX: 2, targetY: 6 },
    { x: 17, y: 3, targetMapId: 'sprout_tower_2f', targetX: 17, targetY: 3 },
  ],
  bgEvents: [
    {
      x: 7,
      y: 15,
      speaker: '🗿 POKéMON STATUE',
      pages: ['A POKéMON statue…', 'It looks very distinguished.'],
    },
    {
      x: 12,
      y: 15,
      speaker: '🗿 POKéMON STATUE',
      pages: ['A POKéMON statue…', 'It looks very distinguished.'],
    },
  ],
});

buildMapFromBlk({
  id: 'sprout_tower_2f',
  name: 'Sprout Tower 2F',
  tileset: 'tower',
  blkFile: 'maps__SproutTower2F.blk',
  blocksW: 10,
  blocksH: 8,
  warps: [
    { x: 6, y: 4, targetMapId: 'sprout_tower_1f', targetX: 6, targetY: 4 },
    { x: 2, y: 6, targetMapId: 'sprout_tower_1f', targetX: 2, targetY: 6 },
    { x: 17, y: 3, targetMapId: 'sprout_tower_1f', targetX: 17, targetY: 3 },
    { x: 10, y: 14, targetMapId: 'sprout_tower_3f', targetX: 10, targetY: 14 },
  ],
  bgEvents: [
    {
      x: 12,
      y: 15,
      speaker: '🗿 POKéMON STATUE',
      pages: ['A POKéMON statue…', 'It looks very distinguished.'],
    },
  ],
  grassEncounters: [
    { speciesId: 'rattata', minLevel: 3, maxLevel: 5, weight: 60 },
    { speciesId: 'gastly', minLevel: 3, maxLevel: 6, weight: 40 },
  ],
});

buildMapFromBlk({
  id: 'sprout_tower_3f',
  name: 'Sprout Tower 3F',
  tileset: 'tower',
  blkFile: 'maps__SproutTower3F.blk',
  blocksW: 10,
  blocksH: 8,
  warps: [
    { x: 10, y: 14, targetMapId: 'sprout_tower_2f', targetX: 10, targetY: 14 },
  ],
  bgEvents: [
    {
      x: 8,
      y: 1,
      speaker: '🗿 POKéMON STATUE',
      pages: ['A POKéMON statue…', 'It looks very distinguished.'],
    },
    {
      x: 11,
      y: 1,
      speaker: '🗿 POKéMON STATUE',
      pages: ['A POKéMON statue…', 'It looks very distinguished.'],
    },
    {
      x: 9,
      y: 0,
      speaker: '🖼️ BELLSPROUT PAINTING',
      pages: ["It's a powerful painting of a BELLSPROUT."],
    },
    {
      x: 10,
      y: 0,
      speaker: '🖼️ BELLSPROUT PAINTING',
      pages: ["It's a powerful painting of a BELLSPROUT."],
    },
    {
      x: 5,
      y: 15,
      speaker: '🗿 POKéMON STATUE',
      pages: ['A POKéMON statue…', 'It looks very distinguished.'],
    },
    {
      x: 14,
      y: 15,
      speaker: '🗿 POKéMON STATUE',
      pages: ['A POKéMON statue…', 'It looks very distinguished.'],
    },
  ],
  grassEncounters: [
    { speciesId: 'rattata', minLevel: 3, maxLevel: 5, weight: 50 },
    { speciesId: 'gastly', minLevel: 3, maxLevel: 6, weight: 50 },
  ],
});

buildMapFromBlk({
  id: 'violet_gym',
  name: 'Violet Gym',
  tileset: 'elite_four_room',
  blkFile: 'maps__VioletGym.blk',
  blocksW: 5,
  blocksH: 8,
  warps: [
    { x: 4, y: 15, targetMapId: 'violet_city', targetX: 18, targetY: 18 },
    { x: 5, y: 15, targetMapId: 'violet_city', targetX: 18, targetY: 18 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 13,
      speaker: '🏛️ VIOLET GYM STATUE',
      pages: ['VIOLET CITY POKéMON GYM', 'LEADER: FALKNER', 'WINNING TRAINERS: BLUE'],
    },
    {
      x: 6,
      y: 13,
      speaker: '🏛️ VIOLET GYM STATUE',
      pages: ['VIOLET CITY POKéMON GYM', 'LEADER: FALKNER', 'WINNING TRAINERS: BLUE'],
    },
  ],
});

buildMapFromBlk({
  id: 'earls_pokemon_academy',
  name: "Earl's Pokémon Academy",
  tileset: 'lab',
  blkFile: 'maps__EarlsPokemonAcademy.blk',
  blocksW: 4,
  blocksH: 8,
  warps: [
    { x: 3, y: 15, targetMapId: 'violet_city', targetX: 30, targetY: 18 },
    { x: 4, y: 15, targetMapId: 'violet_city', targetX: 30, targetY: 18 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON reference books and study material.'],
    },
    {
      x: 1,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['POKéMON reference books and study material.'],
    },
    {
      x: 3,
      y: 0,
      speaker: '📋 BLACKBOARD',
      pages: ['The blackboard describes status problems during battles: POISON, PARALYSIS, SLEEP, BURN, FREEZE.'],
    },
    {
      x: 4,
      y: 0,
      speaker: '📋 BLACKBOARD',
      pages: ['The blackboard describes status problems during battles: POISON, PARALYSIS, SLEEP, BURN, FREEZE.'],
    },
  ],
});

buildMapFromBlk({
  id: 'violet_mart',
  name: 'Violet Poké Mart',
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'violet_city', targetX: 9, targetY: 18 },
    { x: 3, y: 7, targetMapId: 'violet_city', targetX: 9, targetY: 18 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 1,
      speaker: '🛒 MART SHELVES',
      pages: ['A clean shelf stacked with Potions, Antidotes, and Poké Balls.'],
    },
    {
      x: 4,
      y: 1,
      speaker: '🛒 MART SHELVES',
      pages: ['A clean shelf stacked with Potions, Antidotes, and Poké Balls.'],
    },
  ],
});

buildMapFromBlk({
  id: 'violet_poke_center',
  name: 'Violet Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'violet_city', targetX: 31, targetY: 26 },
    { x: 4, y: 7, targetMapId: 'violet_city', targetX: 31, targetY: 26 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '💻 PC',
      pages: ["POKéMON Storage System opened! ...It's working normally."],
    },
    {
      x: 7,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['Crammed with POKéMON medical and anatomy journals.'],
    },
  ],
});

buildMapFromBlk({
  id: 'violet_nickname_speech_house',
  name: 'Nickname Speech House',
  tileset: 'house',
  blkFile: 'maps__House2.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'violet_city', targetX: 3, targetY: 16 },
    { x: 4, y: 7, targetMapId: 'violet_city', targetX: 3, targetY: 16 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['Books on famous POKéMON nicknames and naming conventions.'],
    },
  ],
});

buildMapFromBlk({
  id: 'violet_kyles_house',
  name: "Kyle's House",
  tileset: 'house',
  blkFile: 'maps__House2.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'violet_city', targetX: 21, targetY: 30 },
    { x: 4, y: 7, targetMapId: 'violet_city', targetX: 21, targetY: 30 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '📚 BOOKSHELF',
      pages: ['A collection of comic books and trade guides.'],
    },
  ],
});

buildMapFromBlk({
  id: 'route_31_violet_gate',
  name: 'Route 31 Violet Gate',
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 0, y: 4, targetMapId: 'violet_city', targetX: 38, targetY: 24 },
    { x: 0, y: 5, targetMapId: 'violet_city', targetX: 38, targetY: 25 },
    { x: 9, y: 4, targetMapId: 'route_31', targetX: 5, targetY: 6 },
    { x: 9, y: 5, targetMapId: 'route_31', targetX: 5, targetY: 7 },
  ],
  bgEvents: [],
});

// ==========================================
// Phase 7: South Johto (Route 32, Ruins of Alph, Union Cave to Azalea Town)
// ==========================================

buildMapFromBlk({
  id: 'route_32',
  name: 'Route 32',
  tileset: 'johto',
  blkFile: 'maps__Route32.blk',
  blocksW: 10,
  blocksH: 45,
  roofGroup: 'vc',
  connections: {
    NORTH: { mapId: 'violet_city', offset: 0 },
    SOUTH: { mapId: 'route_33', offset: 0 },
  },
  warps: [
    { x: 11, y: 73, targetMapId: 'route_32_poke_center', targetX: 3, targetY: 7 },
    { x: 4, y: 2, targetMapId: 'route_32_ruins_of_alph_gate', targetX: 9, targetY: 4 },
    { x: 4, y: 3, targetMapId: 'route_32_ruins_of_alph_gate', targetX: 9, targetY: 5 },
    { x: 6, y: 79, targetMapId: 'union_cave_1f', targetX: 17, targetY: 3 },
  ],
  bgEvents: [
    {
      x: 13,
      y: 5,
      speaker: '🪧 ROUTE 32 SIGN',
      pages: ['ROUTE 32', 'VIOLET CITY - AZALEA TOWN'],
    },
    {
      x: 9,
      y: 1,
      speaker: '🪧 RUINS SIGN',
      pages: ['RUINS OF ALPH', 'EAST ENTRANCE'],
    },
    {
      x: 10,
      y: 84,
      speaker: '🪧 UNION CAVE SIGN',
      pages: ['UNION CAVE', 'AHEAD'],
    },
    {
      x: 12,
      y: 73,
      speaker: '🏥 POKéMON CENTER',
      pages: ['Heal your POKéMON before exploring UNION CAVE!'],
    },
  ],
  grassEncounters: [
    { speciesId: 'bellsprout', minLevel: 6, maxLevel: 7, weight: 35, timeOfDay: 'ANY' },
    { speciesId: 'ekans', minLevel: 4, maxLevel: 6, weight: 30, timeOfDay: 'DAY' },
    { speciesId: 'pidgey', minLevel: 6, maxLevel: 8, weight: 25, timeOfDay: 'MORNING' },
    { speciesId: 'hoppip', minLevel: 6, maxLevel: 7, weight: 20, timeOfDay: 'DAY' },
    { speciesId: 'wooper', minLevel: 4, maxLevel: 6, weight: 40, timeOfDay: 'NIGHT' },
    { speciesId: 'zubat', minLevel: 5, maxLevel: 7, weight: 30, timeOfDay: 'NIGHT' },
    { speciesId: 'gastly', minLevel: 6, maxLevel: 8, weight: 20, timeOfDay: 'NIGHT' },
  ],
});

buildMapFromBlk({
  id: 'route_32_poke_center',
  name: 'Route 32 Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'route_32', targetX: 11, targetY: 73 },
    { x: 4, y: 7, targetMapId: 'route_32', targetX: 11, targetY: 73 },
  ],
  bgEvents: [
    {
      x: 9,
      y: 1,
      speaker: "💻 BILL'S PC",
      pages: ["Accessed BILL'S PC!", 'POKéMON Storage System is online and synced.'],
    },
  ],
});

buildMapFromBlk({
  id: 'route_32_ruins_of_alph_gate',
  name: 'Route 32 / Ruins of Alph Gate',
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 0, y: 4, targetMapId: 'ruins_of_alph_outside', targetX: 13, targetY: 20 },
    { x: 0, y: 5, targetMapId: 'ruins_of_alph_outside', targetX: 13, targetY: 21 },
    { x: 9, y: 4, targetMapId: 'route_32', targetX: 4, targetY: 2 },
    { x: 9, y: 5, targetMapId: 'route_32', targetX: 4, targetY: 3 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'ruins_of_alph_outside',
  name: 'Ruins of Alph',
  tileset: 'johto',
  blkFile: 'maps__RuinsOfAlphOutside.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'vc',
  warps: [
    { x: 14, y: 7, targetMapId: 'ruins_of_alph_kabuto_chamber', targetX: 4, targetY: 8 },
    { x: 10, y: 13, targetMapId: 'ruins_of_alph_inner_chamber', targetX: 4, targetY: 3 },
    { x: 17, y: 11, targetMapId: 'ruins_of_alph_research_center', targetX: 2, targetY: 7 },
    { x: 13, y: 20, targetMapId: 'route_32_ruins_of_alph_gate', targetX: 0, targetY: 4 },
    { x: 13, y: 21, targetMapId: 'route_32_ruins_of_alph_gate', targetX: 0, targetY: 5 },
    { x: 7, y: 5, targetMapId: 'route_36_ruins_of_alph_gate', targetX: 4, targetY: 6 },
    { x: 6, y: 19, targetMapId: 'union_cave_b1f', targetX: 17, targetY: 19 },
  ],
  bgEvents: [
    {
      x: 12,
      y: 16,
      speaker: '🪧 RUINS OF ALPH',
      pages: ['RUINS OF ALPH', 'Explore the ancient mysteries!'],
    },
    {
      x: 18,
      y: 12,
      speaker: '🪧 RESEARCH CENTER',
      pages: ['RUINS OF ALPH RESEARCH CENTER'],
    },
  ],
  grassEncounters: [
    { speciesId: 'unown', minLevel: 5, maxLevel: 5, weight: 100 },
  ],
});

buildMapFromBlk({
  id: 'ruins_of_alph_kabuto_chamber',
  name: 'Ruins of Alph Kabuto Chamber',
  tileset: 'ruins_of_alph',
  blkFile: 'maps__RuinsOfAlphPuzzleChamber.blk',
  blocksW: 4,
  blocksH: 5,
  warps: [
    { x: 3, y: 9, targetMapId: 'ruins_of_alph_outside', targetX: 14, targetY: 7 },
    { x: 4, y: 9, targetMapId: 'ruins_of_alph_outside', targetX: 14, targetY: 7 },
    { x: 5, y: 9, targetMapId: 'ruins_of_alph_outside', targetX: 14, targetY: 7 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 2,
      speaker: '🧩 KABUTO PUZZLE',
      pages: ['A mysterious stone sliding puzzle depicting an ancient creature.'],
    },
    {
      x: 4,
      y: 2,
      speaker: '📜 ANCIENT INSCRIPTION',
      pages: ['A creature that hid on the sea floor.', 'Eyes on its back scanned the area.'],
    },
  ],
});

buildMapFromBlk({
  id: 'ruins_of_alph_inner_chamber',
  name: 'Ruins of Alph Inner Chamber',
  tileset: 'ruins_of_alph',
  blkFile: 'maps__RuinsOfAlphInnerChamber.blk',
  blocksW: 10,
  blocksH: 14,
  warps: [
    { x: 4, y: 3, targetMapId: 'ruins_of_alph_outside', targetX: 10, targetY: 13 },
    { x: 10, y: 13, targetMapId: 'ruins_of_alph_outside', targetX: 10, targetY: 13 },
  ],
  bgEvents: [
    {
      x: 10,
      y: 2,
      speaker: '🏛️ ANCIENT RUINS PILLAR',
      pages: ['There is a strange presence here... Ancient symbols are carved into the pillars.'],
    },
  ],
  grassEncounters: [
    { speciesId: 'unown', minLevel: 5, maxLevel: 5, weight: 100 },
  ],
});

buildMapFromBlk({
  id: 'ruins_of_alph_research_center',
  name: 'Ruins Research Center',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'ruins_of_alph_outside', targetX: 17, targetY: 11 },
    { x: 3, y: 7, targetMapId: 'ruins_of_alph_outside', targetX: 17, targetY: 11 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 4,
      speaker: '🖥️ ARCHAEOLOGY TERMINAL',
      pages: ['An elaborate academic research terminal decoding ancient UNOWN symbols.'],
    },
  ],
});

buildMapFromBlk({
  id: 'union_cave_1f',
  name: 'Union Cave 1F',
  tileset: 'cave',
  blkFile: 'maps__UnionCave1F.blk',
  blocksW: 10,
  blocksH: 18,
  warps: [
    { x: 17, y: 3, targetMapId: 'route_32', targetX: 6, targetY: 79 },
    { x: 17, y: 31, targetMapId: 'route_33', targetX: 11, targetY: 1 },
    { x: 5, y: 19, targetMapId: 'union_cave_b1f', targetX: 3, targetY: 3 },
    { x: 3, y: 33, targetMapId: 'union_cave_b1f', targetX: 3, targetY: 33 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'geodude', minLevel: 6, maxLevel: 8, weight: 35 },
    { speciesId: 'zubat', minLevel: 5, maxLevel: 7, weight: 35 },
    { speciesId: 'sandshrew', minLevel: 6, maxLevel: 7, weight: 20 },
    { speciesId: 'onix', minLevel: 6, maxLevel: 8, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'union_cave_b1f',
  name: 'Union Cave B1F',
  tileset: 'cave',
  blkFile: 'maps__UnionCaveB1F.blk',
  blocksW: 10,
  blocksH: 18,
  warps: [
    { x: 3, y: 3, targetMapId: 'union_cave_1f', targetX: 5, targetY: 19 },
    { x: 3, y: 33, targetMapId: 'union_cave_1f', targetX: 3, targetY: 33 },
    { x: 17, y: 31, targetMapId: 'union_cave_b2f', targetX: 5, targetY: 3 },
    { x: 17, y: 19, targetMapId: 'ruins_of_alph_outside', targetX: 6, targetY: 19 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'geodude', minLevel: 7, maxLevel: 9, weight: 35 },
    { speciesId: 'zubat', minLevel: 7, maxLevel: 9, weight: 35 },
    { speciesId: 'onix', minLevel: 8, maxLevel: 10, weight: 20 },
    { speciesId: 'wooper', minLevel: 7, maxLevel: 9, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'union_cave_b2f',
  name: 'Union Cave B2F',
  tileset: 'cave',
  blkFile: 'maps__UnionCaveB2F.blk',
  blocksW: 10,
  blocksH: 18,
  warps: [
    { x: 5, y: 3, targetMapId: 'union_cave_b1f', targetX: 17, targetY: 31 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'lapras', minLevel: 20, maxLevel: 20, weight: 20 },
    { speciesId: 'wooper', minLevel: 18, maxLevel: 22, weight: 35 },
    { speciesId: 'quagsire', minLevel: 20, maxLevel: 24, weight: 25 },
    { speciesId: 'golbat', minLevel: 20, maxLevel: 22, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'route_33',
  name: 'Route 33',
  tileset: 'johto',
  blkFile: 'maps__Route33.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'az',
  connections: {
    NORTH: { mapId: 'route_32', offset: 0 },
    WEST: { mapId: 'azalea_town', offset: 0 },
  },
  warps: [
    { x: 11, y: 1, targetMapId: 'union_cave_1f', targetX: 17, targetY: 31 },
  ],
  bgEvents: [
    {
      x: 13,
      y: 11,
      speaker: '🪧 ROUTE 33 SIGN',
      pages: ['ROUTE 33', 'UNION CAVE - AZALEA TOWN'],
    },
  ],
  grassEncounters: [
    { speciesId: 'spearow', minLevel: 6, maxLevel: 8, weight: 35, timeOfDay: 'DAY' },
    { speciesId: 'geodude', minLevel: 6, maxLevel: 8, weight: 35, timeOfDay: 'ANY' },
    { speciesId: 'ekans', minLevel: 6, maxLevel: 7, weight: 30, timeOfDay: 'DAY' },
    { speciesId: 'zubat', minLevel: 6, maxLevel: 8, weight: 40, timeOfDay: 'NIGHT' },
    { speciesId: 'rattata', minLevel: 6, maxLevel: 7, weight: 30, timeOfDay: 'NIGHT' },
  ],
});

buildMapFromBlk({
  id: 'azalea_town',
  name: 'Azalea Town',
  tileset: 'johto',
  blkFile: 'maps__AzaleaTown.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'az',
  connections: {
    EAST: { mapId: 'route_33', offset: 0 },
  },
  warps: [
    { x: 15, y: 9, targetMapId: 'azalea_poke_center', targetX: 3, targetY: 7 },
    { x: 21, y: 13, targetMapId: 'charcoal_kiln', targetX: 2, targetY: 7 },
    { x: 21, y: 5, targetMapId: 'azalea_mart', targetX: 2, targetY: 7 },
    { x: 9, y: 5, targetMapId: 'kurts_house', targetX: 3, targetY: 7 },
    { x: 10, y: 15, targetMapId: 'azalea_gym', targetX: 4, targetY: 15 },
    { x: 31, y: 7, targetMapId: 'slowpoke_well_b1f', targetX: 17, targetY: 15 },
  ],
  bgEvents: [
    {
      x: 19,
      y: 9,
      speaker: '🪧 AZALEA TOWN SIGN',
      pages: ['AZALEA TOWN', 'Where People and POKéMON Live in Happy Harmony'],
    },
    {
      x: 10,
      y: 9,
      speaker: '🪧 KURT’S HOUSE',
      pages: ["KURT'S HOUSE"],
    },
    {
      x: 14,
      y: 15,
      speaker: '🪧 AZALEA GYM',
      pages: ['AZALEA TOWN POKéMON GYM', 'LEADER: BUGSY'],
    },
    {
      x: 29,
      y: 7,
      speaker: '🪧 SLOWPOKE WELL',
      pages: ['SLOWPOKE WELL', 'Also known as the RAINMAKER WELL'],
    },
    {
      x: 19,
      y: 13,
      speaker: '🪧 CHARCOAL KILN',
      pages: ['CHARCOAL KILN'],
    },
  ],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'azalea_poke_center',
  name: 'Azalea Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'azalea_town', targetX: 15, targetY: 9 },
    { x: 4, y: 7, targetMapId: 'azalea_town', targetX: 15, targetY: 9 },
  ],
  bgEvents: [
    {
      x: 9,
      y: 1,
      speaker: "💻 BILL'S PC",
      pages: ["Accessed BILL'S PC!", 'POKéMON Storage System is online and synced.'],
    },
  ],
});

buildMapFromBlk({
  id: 'azalea_mart',
  name: 'Azalea Poké Mart',
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'azalea_town', targetX: 21, targetY: 5 },
    { x: 3, y: 7, targetMapId: 'azalea_town', targetX: 21, targetY: 5 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'azalea_gym',
  name: 'Azalea Gym',
  tileset: 'elite_four_room',
  blkFile: 'maps__AzaleaGym.blk',
  blocksW: 5,
  blocksH: 8,
  warps: [
    { x: 4, y: 15, targetMapId: 'azalea_town', targetX: 10, targetY: 15 },
    { x: 5, y: 15, targetMapId: 'azalea_town', targetX: 10, targetY: 15 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 13,
      speaker: '🏆 AZALEA GYM STATUE',
      pages: ['AZALEA TOWN POKéMON GYM', 'LEADER: BUGSY'],
    },
    {
      x: 6,
      y: 13,
      speaker: '🏆 AZALEA GYM STATUE',
      pages: ['AZALEA TOWN POKéMON GYM', 'LEADER: BUGSY'],
    },
  ],
});

buildMapFromBlk({
  id: 'kurts_house',
  name: "Kurt's House",
  tileset: 'traditional_house',
  blkFile: 'maps__KurtsHouse.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'azalea_town', targetX: 9, targetY: 5 },
    { x: 4, y: 7, targetMapId: 'azalea_town', targetX: 9, targetY: 5 },
  ],
  bgEvents: [
    {
      x: 4,
      y: 1,
      speaker: '⛩️ CELEBI STATUE',
      pages: ['A small wooden statue honoring the Guardian of the Forest, CELEBI.'],
    },
  ],
});

buildMapFromBlk({
  id: 'charcoal_kiln',
  name: 'Charcoal Kiln',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'azalea_town', targetX: 21, targetY: 13 },
    { x: 3, y: 7, targetMapId: 'azalea_town', targetX: 21, targetY: 13 },
  ],
  bgEvents: [
    {
      x: 0,
      y: 1,
      speaker: '🔥 CHARCOAL KILN',
      pages: ['High-quality CHARCOAL made from ILEX FOREST wood is curing here.'],
    },
  ],
});

buildMapFromBlk({
  id: 'slowpoke_well_b1f',
  name: 'Slowpoke Well B1F',
  tileset: 'cave',
  blkFile: 'maps__SlowpokeWellB1F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 17, y: 15, targetMapId: 'azalea_town', targetX: 31, targetY: 7 },
    { x: 7, y: 11, targetMapId: 'slowpoke_well_b2f', targetX: 3, targetY: 3 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'slowpoke', minLevel: 6, maxLevel: 8, weight: 45 },
    { speciesId: 'zubat', minLevel: 5, maxLevel: 8, weight: 55 },
  ],
});

buildMapFromBlk({
  id: 'slowpoke_well_b2f',
  name: 'Slowpoke Well B2F',
  tileset: 'cave',
  blkFile: 'maps__SlowpokeWellB2F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 3, y: 3, targetMapId: 'slowpoke_well_b1f', targetX: 7, targetY: 11 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'slowpoke', minLevel: 14, maxLevel: 18, weight: 50 },
    { speciesId: 'zubat', minLevel: 14, maxLevel: 18, weight: 50 },
  ],
});

// ==========================================
// PHASE 8: GOLDENROD METROPOLIS & ROUTE 34
// ==========================================

buildMapFromBlk({
  id: 'ilex_forest',
  name: 'Ilex Forest',
  tileset: 'forest',
  blkFile: 'maps__IlexForest.blk',
  blocksW: 15,
  blocksH: 27,
  warps: [
    { x: 1, y: 5, targetMapId: 'route_34_ilex_forest_gate', targetX: 4, targetY: 7 },
    { x: 3, y: 42, targetMapId: 'azalea_town', targetX: 2, targetY: 10 },
    { x: 3, y: 43, targetMapId: 'azalea_town', targetX: 2, targetY: 11 },
  ],
  bgEvents: [
    {
      x: 8,
      y: 22,
      speaker: '⛩️ ILEX FOREST SHRINE',
      pages: ['ILEX FOREST SHRINE…', "It's in honor of the forest's protector: CELEBI!"],
    },
    {
      x: 3,
      y: 17,
      speaker: '🌲 FOREST SIGN',
      pages: ["ILEX FOREST is so overgrown with trees that you can't see the sky. Please watch out for dropped items."],
    },
  ],
  grassEncounters: [
    { speciesId: 'caterpie', minLevel: 5, maxLevel: 6, weight: 20 },
    { speciesId: 'weedle', minLevel: 5, maxLevel: 6, weight: 20 },
    { speciesId: 'metapod', minLevel: 6, maxLevel: 7, weight: 15 },
    { speciesId: 'kakuna', minLevel: 6, maxLevel: 7, weight: 15 },
    { speciesId: 'paras', minLevel: 6, maxLevel: 8, weight: 15 },
    { speciesId: 'zubat', minLevel: 5, maxLevel: 7, weight: 15 },
  ],
});

buildMapFromBlk({
  id: 'route_34_ilex_forest_gate',
  name: 'Route 34 Ilex Forest Gate',
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 4, y: 0, targetMapId: 'route_34', targetX: 13, targetY: 37 },
    { x: 5, y: 0, targetMapId: 'route_34', targetX: 14, targetY: 37 },
    { x: 4, y: 7, targetMapId: 'ilex_forest', targetX: 1, targetY: 5 },
    { x: 5, y: 7, targetMapId: 'ilex_forest', targetX: 1, targetY: 5 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'route_34',
  name: 'Route 34',
  tileset: 'johto',
  blkFile: 'maps__Route34.blk',
  blocksW: 10,
  blocksH: 27,
  roofGroup: 'gr',
  connections: {
    NORTH: { mapId: 'goldenrod_city', offset: -10 },
  },
  warps: [
    { x: 13, y: 37, targetMapId: 'route_34_ilex_forest_gate', targetX: 4, targetY: 0 },
    { x: 14, y: 37, targetMapId: 'route_34_ilex_forest_gate', targetX: 5, targetY: 0 },
    { x: 11, y: 14, targetMapId: 'day_care', targetX: 2, targetY: 7 },
    { x: 11, y: 15, targetMapId: 'day_care', targetX: 3, targetY: 7 },
  ],
  bgEvents: [
    {
      x: 12,
      y: 6,
      speaker: '🚏 ROUTE SIGN',
      pages: ['ROUTE 34: GOLDENROD CITY - AZALEA TOWN', 'ILEX FOREST SOMEWHERE BETWEEN'],
    },
    {
      x: 10,
      y: 13,
      speaker: '🏡 DAY-CARE SIGN',
      pages: ['POKéMON DAY-CARE', 'LET US RAISE YOUR POKéMON!'],
    },
    {
      x: 13,
      y: 33,
      speaker: '📋 TRAINER TIPS',
      pages: [
        'TRAINER TIPS: BERRY trees grow new BERRIES every day.',
        'Make a note of which trees bear which BERRIES.',
      ],
    },
  ],
  grassEncounters: [
    { speciesId: 'rattata', minLevel: 10, maxLevel: 12, weight: 30 },
    { speciesId: 'abra', minLevel: 10, maxLevel: 12, weight: 10 },
    { speciesId: 'drowzee', minLevel: 10, maxLevel: 12, weight: 30 },
    { speciesId: 'ditto', minLevel: 10, maxLevel: 10, weight: 10 },
    { speciesId: 'pidgey', minLevel: 11, maxLevel: 13, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'day_care',
  name: 'Day-Care',
  tileset: 'house',
  blkFile: 'maps__DayCare.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'route_34', targetX: 11, targetY: 15 },
    { x: 3, y: 7, targetMapId: 'route_34', targetX: 11, targetY: 15 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_city',
  name: 'Goldenrod City',
  tileset: 'johto',
  blkFile: 'maps__GoldenrodCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'gr',
  connections: {
    SOUTH: { mapId: 'route_34', offset: 10 },
  },
  warps: [
    { x: 24, y: 7, targetMapId: 'goldenrod_gym', targetX: 2, targetY: 17 },
    { x: 29, y: 29, targetMapId: 'goldenrod_bike_shop', targetX: 2, targetY: 7 },
    { x: 5, y: 25, targetMapId: 'goldenrod_bill_house', targetX: 2, targetY: 7 },
    { x: 9, y: 13, targetMapId: 'goldenrod_magnet_train_station', targetX: 8, targetY: 17 },
    { x: 29, y: 5, targetMapId: 'goldenrod_flower_shop', targetX: 2, targetY: 7 },
    { x: 15, y: 7, targetMapId: 'goldenrod_name_rater', targetX: 2, targetY: 7 },
    { x: 24, y: 27, targetMapId: 'goldenrod_dept_store_1f', targetX: 7, targetY: 7 },
    { x: 14, y: 21, targetMapId: 'goldenrod_game_corner', targetX: 2, targetY: 13 },
    { x: 5, y: 15, targetMapId: 'radio_tower_1f', targetX: 2, targetY: 7 },
    { x: 15, y: 27, targetMapId: 'goldenrod_poke_center', targetX: 3, targetY: 7 },
    { x: 11, y: 29, targetMapId: 'goldenrod_underground', targetX: 3, targetY: 2 },
  ],
  bgEvents: [
    {
      x: 22,
      y: 18,
      speaker: '🏙️ GOLDENROD CITY',
      pages: ['GOLDENROD CITY', 'The Festive City of Opulent Charm'],
    },
    {
      x: 22,
      y: 9,
      speaker: '🏆 GOLDENROD GYM',
      pages: ['GOLDENROD CITY POKéMON GYM', 'LEADER: WHITNEY', 'The Incredibly Pretty Girl!'],
    },
    {
      x: 8,
      y: 15,
      speaker: '📻 RADIO TOWER',
      pages: ['GOLDENROD RADIO TOWER'],
    },
    {
      x: 28,
      y: 27,
      speaker: '🏬 DEPT. STORE',
      pages: ['Full Selection of POKéMON Goods! GOLDENROD DEPT. STORE'],
    },
    {
      x: 26,
      y: 29,
      speaker: '🚲 BIKE SHOP',
      pages: ['The World is a Cycle Path! MIRACLE CYCLE'],
    },
    {
      x: 18,
      y: 21,
      speaker: '🎰 GAME CORNER',
      pages: ['Your Playground! GOLDENROD GAME CORNER'],
    },
    {
      x: 17,
      y: 7,
      speaker: '👴 NAME RATER',
      pages: ['NAME RATER', 'Get Your POKéMON Nicknames Evaluated!'],
    },
    {
      x: 31,
      y: 5,
      speaker: '🌸 FLOWER SHOP',
      pages: ['Blooming Beautiful! GOLDENROD FLOWER SHOP'],
    },
    {
      x: 11,
      y: 13,
      speaker: '🚅 MAGNET TRAIN STATION',
      pages: ['GOLDENROD CITY STATION', 'Super High-Speed Magnet Train to KANTO'],
    },
    {
      x: 13,
      y: 29,
      speaker: '🚇 UNDERGROUND TUNNEL',
      pages: ['UNDERGROUND ENTRANCE', 'Travel Beneath Goldenrod City'],
    },
  ],
});

buildMapFromBlk({
  id: 'goldenrod_gym',
  name: 'Goldenrod Gym',
  tileset: 'elite_four_room',
  blkFile: 'maps__GoldenrodGym.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 2, y: 17, targetMapId: 'goldenrod_city', targetX: 24, targetY: 7 },
    { x: 3, y: 17, targetMapId: 'goldenrod_city', targetX: 24, targetY: 7 },
  ],
  bgEvents: [
    {
      x: 1,
      y: 15,
      speaker: '🏆 GOLDENROD GYM STATUE',
      pages: ['GOLDENROD CITY POKéMON GYM', 'LEADER: WHITNEY'],
    },
    {
      x: 4,
      y: 15,
      speaker: '🏆 GOLDENROD GYM STATUE',
      pages: ['GOLDENROD CITY POKéMON GYM', 'LEADER: WHITNEY'],
    },
  ],
});

buildMapFromBlk({
  id: 'goldenrod_poke_center',
  name: 'Goldenrod Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'goldenrod_city', targetX: 15, targetY: 27 },
    { x: 4, y: 7, targetMapId: 'goldenrod_city', targetX: 15, targetY: 27 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_bike_shop',
  name: 'Goldenrod Bike Shop',
  tileset: 'house',
  blkFile: 'maps__GoldenrodBikeShop.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'goldenrod_city', targetX: 29, targetY: 29 },
    { x: 3, y: 7, targetMapId: 'goldenrod_city', targetX: 29, targetY: 29 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_game_corner',
  name: 'Goldenrod Game Corner',
  tileset: 'game_corner',
  blkFile: 'maps__GoldenrodGameCorner.blk',
  blocksW: 10,
  blocksH: 7,
  warps: [
    { x: 2, y: 13, targetMapId: 'goldenrod_city', targetX: 14, targetY: 21 },
    { x: 3, y: 13, targetMapId: 'goldenrod_city', targetX: 14, targetY: 21 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_flower_shop',
  name: 'Goldenrod Flower Shop',
  tileset: 'house',
  blkFile: 'maps__GoldenrodFlowerShop.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'goldenrod_city', targetX: 29, targetY: 5 },
    { x: 3, y: 7, targetMapId: 'goldenrod_city', targetX: 29, targetY: 5 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_name_rater',
  name: 'Goldenrod Name Rater',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'goldenrod_city', targetX: 15, targetY: 7 },
    { x: 3, y: 7, targetMapId: 'goldenrod_city', targetX: 15, targetY: 7 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_bill_house',
  name: "Bill's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'goldenrod_city', targetX: 5, targetY: 25 },
    { x: 3, y: 7, targetMapId: 'goldenrod_city', targetX: 5, targetY: 25 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_magnet_train_station',
  name: 'Goldenrod Magnet Train Station',
  tileset: 'gate',
  blkFile: 'maps__GoldenrodMagnetTrainStation.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 8, y: 17, targetMapId: 'goldenrod_city', targetX: 9, targetY: 13 },
    { x: 9, y: 17, targetMapId: 'goldenrod_city', targetX: 9, targetY: 13 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_underground',
  name: 'Goldenrod Underground',
  tileset: 'underground',
  blkFile: 'maps__GoldenrodUnderground.blk',
  blocksW: 15,
  blocksH: 18,
  warps: [
    { x: 3, y: 2, targetMapId: 'goldenrod_city', targetX: 11, targetY: 29 },
    { x: 3, y: 33, targetMapId: 'goldenrod_city', targetX: 9, targetY: 5 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_dept_store_1f',
  name: 'Goldenrod Dept Store 1F',
  tileset: 'mart',
  blkFile: 'maps__DeptStore1F.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 7, y: 7, targetMapId: 'goldenrod_city', targetX: 24, targetY: 27 },
    { x: 8, y: 7, targetMapId: 'goldenrod_city', targetX: 24, targetY: 27 },
    { x: 15, y: 0, targetMapId: 'goldenrod_dept_store_2f', targetX: 15, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_dept_store_2f',
  name: 'Goldenrod Dept Store 2F',
  tileset: 'mart',
  blkFile: 'maps__DeptStore2F.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 15, y: 0, targetMapId: 'goldenrod_dept_store_1f', targetX: 15, targetY: 1 },
    { x: 12, y: 0, targetMapId: 'goldenrod_dept_store_3f', targetX: 12, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_dept_store_3f',
  name: 'Goldenrod Dept Store 3F',
  tileset: 'mart',
  blkFile: 'maps__DeptStore3F.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 12, y: 0, targetMapId: 'goldenrod_dept_store_2f', targetX: 12, targetY: 1 },
    { x: 15, y: 0, targetMapId: 'goldenrod_dept_store_4f', targetX: 15, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_dept_store_4f',
  name: 'Goldenrod Dept Store 4F',
  tileset: 'mart',
  blkFile: 'maps__DeptStore4F.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 15, y: 0, targetMapId: 'goldenrod_dept_store_3f', targetX: 15, targetY: 1 },
    { x: 12, y: 0, targetMapId: 'goldenrod_dept_store_5f', targetX: 12, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_dept_store_5f',
  name: 'Goldenrod Dept Store 5F',
  tileset: 'mart',
  blkFile: 'maps__DeptStore5F.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 12, y: 0, targetMapId: 'goldenrod_dept_store_4f', targetX: 12, targetY: 1 },
    { x: 15, y: 0, targetMapId: 'goldenrod_dept_store_6f', targetX: 15, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_dept_store_6f',
  name: 'Goldenrod Dept Store 6F',
  tileset: 'mart',
  blkFile: 'maps__DeptStore6F.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 15, y: 0, targetMapId: 'goldenrod_dept_store_5f', targetX: 15, targetY: 1 },
    { x: 13, y: 0, targetMapId: 'goldenrod_dept_store_roof', targetX: 13, targetY: 2 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'goldenrod_dept_store_roof',
  name: 'Goldenrod Dept Store Roof',
  tileset: 'mart',
  blkFile: 'maps__GoldenrodDeptStoreRoof.blk',
  blocksW: 8,
  blocksH: 4,
  warps: [
    { x: 13, y: 1, targetMapId: 'goldenrod_dept_store_6f', targetX: 13, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'radio_tower_1f',
  name: 'Radio Tower 1F',
  tileset: 'radio_tower',
  blkFile: 'maps__RadioTower1F.blk',
  blocksW: 9,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'goldenrod_city', targetX: 5, targetY: 15 },
    { x: 3, y: 7, targetMapId: 'goldenrod_city', targetX: 5, targetY: 15 },
    { x: 15, y: 0, targetMapId: 'radio_tower_2f', targetX: 15, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'radio_tower_2f',
  name: 'Radio Tower 2F',
  tileset: 'radio_tower',
  blkFile: 'maps__RadioTower2F.blk',
  blocksW: 9,
  blocksH: 4,
  warps: [
    { x: 15, y: 0, targetMapId: 'radio_tower_1f', targetX: 15, targetY: 1 },
    { x: 0, y: 0, targetMapId: 'radio_tower_3f', targetX: 0, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'radio_tower_3f',
  name: 'Radio Tower 3F',
  tileset: 'radio_tower',
  blkFile: 'maps__RadioTower3F.blk',
  blocksW: 9,
  blocksH: 4,
  warps: [
    { x: 0, y: 0, targetMapId: 'radio_tower_2f', targetX: 0, targetY: 1 },
    { x: 7, y: 0, targetMapId: 'radio_tower_4f', targetX: 7, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'radio_tower_4f',
  name: 'Radio Tower 4F',
  tileset: 'radio_tower',
  blkFile: 'maps__RadioTower4F.blk',
  blocksW: 9,
  blocksH: 4,
  warps: [
    { x: 9, y: 0, targetMapId: 'radio_tower_3f', targetX: 7, targetY: 1 },
    { x: 0, y: 0, targetMapId: 'radio_tower_5f', targetX: 0, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'radio_tower_5f',
  name: 'Radio Tower 5F',
  tileset: 'radio_tower',
  blkFile: 'maps__RadioTower5F.blk',
  blocksW: 9,
  blocksH: 4,
  warps: [
    { x: 0, y: 0, targetMapId: 'radio_tower_4f', targetX: 0, targetY: 1 },
  ],
  bgEvents: [],
});

// ==========================================
// PHASE 9: CENTRAL JOHTO & ECRUTEAK CITY
// ==========================================

buildMapFromBlk({
  id: 'route_35',
  name: 'Route 35',
  tileset: 'johto',
  blkFile: 'maps__Route35.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'gr',
  connections: {
    NORTH: { mapId: 'route_36', offset: 0 },
    SOUTH: { mapId: 'goldenrod_city', offset: -10 },
  },
  warps: [
    { x: 3, y: 5, targetMapId: 'route_35_national_park_gate', targetX: 3, targetY: 7 },
  ],
  bgEvents: [
    {
      x: 1,
      y: 7,
      speaker: '🚏 ROUTE 35 SIGN',
      pages: ['ROUTE 35', 'NATIONAL PARK SOUTH GATE'],
    },
  ],
  grassEncounters: [
    { speciesId: 'pidgey', minLevel: 12, maxLevel: 14, weight: 30 },
    { speciesId: 'nidoran-m', minLevel: 12, maxLevel: 12, weight: 15 },
    { speciesId: 'nidoran-f', minLevel: 12, maxLevel: 12, weight: 15 },
    { speciesId: 'drowzee', minLevel: 12, maxLevel: 14, weight: 20 },
    { speciesId: 'ditto', minLevel: 10, maxLevel: 14, weight: 10 },
    { speciesId: 'abra', minLevel: 10, maxLevel: 12, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'route_35_national_park_gate',
  name: 'Route 35 National Park Gate',
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 3, y: 0, targetMapId: 'national_park', targetX: 10, targetY: 47 },
    { x: 4, y: 0, targetMapId: 'national_park', targetX: 11, targetY: 47 },
    { x: 3, y: 7, targetMapId: 'route_35', targetX: 3, targetY: 5 },
    { x: 4, y: 7, targetMapId: 'route_35', targetX: 3, targetY: 5 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'national_park',
  name: 'National Park',
  tileset: 'park',
  blkFile: 'maps__NationalPark.blk',
  blocksW: 20,
  blocksH: 27,
  warps: [
    { x: 33, y: 18, targetMapId: 'route_36_national_park_gate', targetX: 0, targetY: 4 },
    { x: 33, y: 19, targetMapId: 'route_36_national_park_gate', targetX: 0, targetY: 5 },
    { x: 10, y: 47, targetMapId: 'route_35_national_park_gate', targetX: 3, targetY: 0 },
    { x: 11, y: 47, targetMapId: 'route_35_national_park_gate', targetX: 4, targetY: 0 },
  ],
  bgEvents: [
    {
      x: 14,
      y: 44,
      speaker: '🌳 NATIONAL PARK SIGN',
      pages: ['NATIONAL PARK', 'Home of the Bug-Catching Contest!'],
    },
    {
      x: 27,
      y: 17,
      speaker: '🚏 PARK SIGN',
      pages: ['RELAXATION SQUARE', 'Please do not battle outside the contest area.'],
    },
  ],
  grassEncounters: [
    { speciesId: 'caterpie', minLevel: 10, maxLevel: 14, weight: 20 },
    { speciesId: 'weedle', minLevel: 10, maxLevel: 14, weight: 20 },
    { speciesId: 'butterfree', minLevel: 12, maxLevel: 15, weight: 10 },
    { speciesId: 'beedrill', minLevel: 12, maxLevel: 15, weight: 10 },
    { speciesId: 'scyther', minLevel: 13, maxLevel: 15, weight: 10 },
    { speciesId: 'pinsir', minLevel: 13, maxLevel: 15, weight: 10 },
    { speciesId: 'sunkern', minLevel: 10, maxLevel: 14, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'route_36_national_park_gate',
  name: 'Route 36 National Park Gate',
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 0, y: 4, targetMapId: 'national_park', targetX: 33, targetY: 18 },
    { x: 0, y: 5, targetMapId: 'national_park', targetX: 33, targetY: 19 },
    { x: 9, y: 4, targetMapId: 'route_36', targetX: 18, targetY: 8 },
    { x: 9, y: 5, targetMapId: 'route_36', targetX: 18, targetY: 9 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'route_36',
  name: 'Route 36',
  tileset: 'johto',
  blkFile: 'maps__Route36.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'vc',
  connections: {
    NORTH: { mapId: 'route_37', offset: 20 },
    SOUTH: { mapId: 'route_35', offset: 0 },
    EAST: { mapId: 'violet_city', offset: 0 },
  },
  warps: [
    { x: 18, y: 8, targetMapId: 'route_36_national_park_gate', targetX: 9, targetY: 4 },
    { x: 18, y: 9, targetMapId: 'route_36_national_park_gate', targetX: 9, targetY: 5 },
    { x: 47, y: 13, targetMapId: 'route_36_ruins_of_alph_gate', targetX: 4, targetY: 0 },
    { x: 48, y: 13, targetMapId: 'route_36_ruins_of_alph_gate', targetX: 5, targetY: 0 },
  ],
  bgEvents: [
    {
      x: 55,
      y: 7,
      speaker: '🚏 ROUTE 36 SIGN',
      pages: ['ROUTE 36', 'EAST TO VIOLET CITY, WEST TO NATIONAL PARK'],
    },
    {
      x: 35,
      y: 7,
      speaker: '🌳 STRANGE TREE',
      pages: ['A weird tree is wiggling slightly in place… It seems to dislike water!'],
    },
  ],
  grassEncounters: [
    { speciesId: 'pidgey', minLevel: 13, maxLevel: 15, weight: 30 },
    { speciesId: 'nidoran-m', minLevel: 13, maxLevel: 13, weight: 15 },
    { speciesId: 'nidoran-f', minLevel: 13, maxLevel: 13, weight: 15 },
    { speciesId: 'growlithe', minLevel: 13, maxLevel: 15, weight: 20 },
    { speciesId: 'vulpix', minLevel: 13, maxLevel: 15, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'route_36_ruins_of_alph_gate',
  name: 'Route 36 Ruins of Alph Gate',
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 4, y: 0, targetMapId: 'route_36', targetX: 47, targetY: 13 },
    { x: 5, y: 0, targetMapId: 'route_36', targetX: 48, targetY: 13 },
    { x: 4, y: 7, targetMapId: 'ruins_of_alph_outside', targetX: 7, targetY: 1 },
    { x: 5, y: 7, targetMapId: 'ruins_of_alph_outside', targetX: 8, targetY: 1 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'route_37',
  name: 'Route 37',
  tileset: 'johto',
  blkFile: 'maps__Route37.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'vc',
  connections: {
    NORTH: { mapId: 'ecruteak_city', offset: -10 },
    SOUTH: { mapId: 'route_36', offset: -20 },
  },
  warps: [],
  bgEvents: [
    {
      x: 5,
      y: 3,
      speaker: '🚏 ROUTE 37 SIGN',
      pages: ['ROUTE 37', 'NORTH TO ECRUTEAK CITY'],
    },
  ],
  grassEncounters: [
    { speciesId: 'pidgey', minLevel: 13, maxLevel: 15, weight: 25 },
    { speciesId: 'pidgeotto', minLevel: 15, maxLevel: 17, weight: 15 },
    { speciesId: 'growlithe', minLevel: 14, maxLevel: 16, weight: 25 },
    { speciesId: 'vulpix', minLevel: 14, maxLevel: 16, weight: 25 },
    { speciesId: 'stantler', minLevel: 15, maxLevel: 17, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'ecruteak_city',
  name: 'Ecruteak City',
  tileset: 'johto',
  blkFile: 'maps__EcruteakCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'vc',
  connections: {
    SOUTH: { mapId: 'route_37', offset: 10 },
    WEST: { mapId: 'route_38', offset: 10 },
    EAST: { mapId: 'route_42', offset: 18 },
  },
  warps: [
    { x: 23, y: 27, targetMapId: 'ecruteak_poke_center', targetX: 3, targetY: 7 },
    { x: 29, y: 21, targetMapId: 'ecruteak_mart', targetX: 2, targetY: 7 },
    { x: 6, y: 27, targetMapId: 'ecruteak_gym', targetX: 4, targetY: 17 },
    { x: 23, y: 21, targetMapId: 'dance_theater', targetX: 5, targetY: 13 },
    { x: 13, y: 27, targetMapId: 'ecruteak_itemfinder_house', targetX: 3, targetY: 7 },
    { x: 5, y: 5, targetMapId: 'burned_tower_1f', targetX: 9, targetY: 15 },
    { x: 37, y: 7, targetMapId: 'tin_tower_1f', targetX: 9, targetY: 15 },
    { x: 0, y: 18, targetMapId: 'route_38_ecruteak_gate', targetX: 9, targetY: 4 },
    { x: 0, y: 19, targetMapId: 'route_38_ecruteak_gate', targetX: 9, targetY: 5 },
    { x: 35, y: 26, targetMapId: 'route_42_ecruteak_gate', targetX: 0, targetY: 4 },
    { x: 35, y: 27, targetMapId: 'route_42_ecruteak_gate', targetX: 0, targetY: 5 },
  ],
  bgEvents: [
    {
      x: 18,
      y: 28,
      speaker: '🏮 ECRUTEAK CITY',
      pages: ['ECRUTEAK CITY', 'A Historical City Where the Past Meets the Present'],
    },
    {
      x: 8,
      y: 27,
      speaker: '🏆 ECRUTEAK GYM',
      pages: ['ECRUTEAK CITY POKéMON GYM', 'LEADER: MORTY', 'The Mystic Seer of the Future!'],
    },
    {
      x: 27,
      y: 21,
      speaker: '🎭 DANCE THEATER',
      pages: ['ECRUTEAK DANCE THEATER', 'Kimono Girls Dance Troupe'],
    },
    {
      x: 2,
      y: 10,
      speaker: '🔥 BURNED TOWER SIGN',
      pages: ['BURNED TOWER', 'It was destroyed by a mysterious fire 150 years ago.'],
    },
    {
      x: 34,
      y: 7,
      speaker: '🔔 TIN TOWER SIGN',
      pages: ['TIN TOWER', 'A legendary POKéMON is said to roost at the summit.'],
    },
  ],
});

buildMapFromBlk({
  id: 'ecruteak_poke_center',
  name: 'Ecruteak Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'ecruteak_city', targetX: 23, targetY: 27 },
    { x: 4, y: 7, targetMapId: 'ecruteak_city', targetX: 23, targetY: 27 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'ecruteak_mart',
  name: 'Ecruteak Mart',
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'ecruteak_city', targetX: 29, targetY: 21 },
    { x: 3, y: 7, targetMapId: 'ecruteak_city', targetX: 29, targetY: 21 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'ecruteak_gym',
  name: 'Ecruteak Gym',
  tileset: 'tower',
  blkFile: 'maps__EcruteakGym.blk',
  blocksW: 5,
  blocksH: 9,
  warps: [
    { x: 4, y: 17, targetMapId: 'ecruteak_city', targetX: 6, targetY: 27 },
    { x: 5, y: 17, targetMapId: 'ecruteak_city', targetX: 6, targetY: 27 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 15,
      speaker: '🏆 ECRUTEAK GYM STATUE',
      pages: ['ECRUTEAK CITY POKéMON GYM', 'LEADER: MORTY'],
    },
    {
      x: 6,
      y: 15,
      speaker: '🏆 ECRUTEAK GYM STATUE',
      pages: ['ECRUTEAK CITY POKéMON GYM', 'LEADER: MORTY'],
    },
  ],
});

buildMapFromBlk({
  id: 'dance_theater',
  name: 'Dance Theater',
  tileset: 'traditional_house',
  blkFile: 'maps__DanceTheater.blk',
  blocksW: 6,
  blocksH: 7,
  warps: [
    { x: 5, y: 13, targetMapId: 'ecruteak_city', targetX: 23, targetY: 21 },
    { x: 6, y: 13, targetMapId: 'ecruteak_city', targetX: 23, targetY: 21 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'ecruteak_itemfinder_house',
  name: 'Ecruteak Itemfinder House',
  tileset: 'traditional_house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'ecruteak_city', targetX: 13, targetY: 27 },
    { x: 4, y: 7, targetMapId: 'ecruteak_city', targetX: 13, targetY: 27 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'burned_tower_1f',
  name: 'Burned Tower 1F',
  tileset: 'tower',
  blkFile: 'maps__BurnedTower1F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 9, y: 15, targetMapId: 'ecruteak_city', targetX: 5, targetY: 5 },
    { x: 10, y: 15, targetMapId: 'ecruteak_city', targetX: 5, targetY: 5 },
    { x: 10, y: 9, targetMapId: 'burned_tower_b1f', targetX: 10, targetY: 9 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'rattata', minLevel: 13, maxLevel: 15, weight: 40 },
    { speciesId: 'koffing', minLevel: 13, maxLevel: 16, weight: 40 },
    { speciesId: 'zubat', minLevel: 13, maxLevel: 15, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'burned_tower_b1f',
  name: 'Burned Tower B1F',
  tileset: 'cave',
  blkFile: 'maps__BurnedTowerB1F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 10, y: 9, targetMapId: 'burned_tower_1f', targetX: 10, targetY: 9 },
  ],
  bgEvents: [
    {
      x: 10,
      y: 3,
      speaker: '⚡ RAIKOU, ENTEI & SUICUNE',
      pages: [
        'Three legendary beasts stand frozen like statues…',
        'As you approach, their eyes gleam with divine energy!',
        'With a mighty roar, they awaken and leap into the skies of Johto!',
      ],
    },
  ],
  grassEncounters: [
    { speciesId: 'koffing', minLevel: 14, maxLevel: 16, weight: 50 },
    { speciesId: 'zubat', minLevel: 14, maxLevel: 16, weight: 30 },
    { speciesId: 'magmar', minLevel: 14, maxLevel: 16, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'tin_tower_1f',
  name: 'Tin Tower 1F',
  tileset: 'tower',
  blkFile: 'maps__TinTower1F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 9, y: 15, targetMapId: 'ecruteak_city', targetX: 37, targetY: 7 },
    { x: 10, y: 15, targetMapId: 'ecruteak_city', targetX: 37, targetY: 7 },
  ],
  bgEvents: [],
});

// ==========================================
// PHASE 10: WESTERN JOHTO (Routes 38, 39, Olivine City, Lighthouse, Routes 40, 41, Whirl Islands, Cianwood City)
// ==========================================

buildMapFromBlk({
  id: 'route_38',
  name: 'Route 38',
  tileset: 'johto',
  blkFile: 'maps__Route38.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'vc',
  connections: {
    WEST: { mapId: 'route_39', offset: 0 },
    EAST: { mapId: 'ecruteak_city', offset: -10 },
  },
  warps: [
    { x: 35, y: 8, targetMapId: 'route_38_ecruteak_gate', targetX: 0, targetY: 4 },
    { x: 35, y: 9, targetMapId: 'route_38_ecruteak_gate', targetX: 0, targetY: 5 },
  ],
  bgEvents: [
    {
      x: 33,
      y: 7,
      speaker: '📍 ROUTE 38 SIGN',
      pages: ['ROUTE 38', 'West to Route 39 & Olivine City', 'East to Ecruteak City'],
    },
    {
      x: 5,
      y: 13,
      speaker: '📋 TRAINER TIPS',
      pages: ['TRAINER TIPS', 'If a POKéMON is poisoned or paralyzed, use an item or visit a POKéMON CENTER immediately!'],
    },
  ],
  grassEncounters: [
    { speciesId: 'rattata', minLevel: 16, maxLevel: 16, weight: 30 },
    { speciesId: 'raticate', minLevel: 16, maxLevel: 16, weight: 20 },
    { speciesId: 'magnemite', minLevel: 16, maxLevel: 16, weight: 20 },
    { speciesId: 'pidgeotto', minLevel: 16, maxLevel: 16, weight: 15 },
    { speciesId: 'tauros', minLevel: 13, maxLevel: 13, weight: 10 },
    { speciesId: 'miltank', minLevel: 13, maxLevel: 13, weight: 5 },
  ],
});

buildMapFromBlk({
  id: 'route_38_ecruteak_gate',
  name: 'Route 38 Ecruteak Gate',
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 0, y: 4, targetMapId: 'route_38', targetX: 34, targetY: 8 },
    { x: 0, y: 5, targetMapId: 'route_38', targetX: 34, targetY: 9 },
    { x: 9, y: 4, targetMapId: 'ecruteak_city', targetX: 1, targetY: 18 },
    { x: 9, y: 5, targetMapId: 'ecruteak_city', targetX: 1, targetY: 19 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'route_39',
  name: 'Route 39',
  tileset: 'johto',
  blkFile: 'maps__Route39.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'vc',
  connections: {
    EAST: { mapId: 'route_38', offset: 0 },
    SOUTH: { mapId: 'olivine_city', offset: -10 },
  },
  warps: [
    { x: 1, y: 3, targetMapId: 'route_39_barn', targetX: 3, targetY: 7 },
    { x: 5, y: 3, targetMapId: 'route_39_farmhouse', targetX: 2, targetY: 7 },
  ],
  bgEvents: [
    {
      x: 5,
      y: 31,
      speaker: '📍 ROUTE 39 SIGN',
      pages: ['ROUTE 39', 'Olivine City Ahead'],
    },
    {
      x: 9,
      y: 5,
      speaker: '🥛 MOOMOO FARM SIGN',
      pages: ['MOOMOO FARM', 'Home of Delicious, Nutritious Moomoo Milk!'],
    },
  ],
  grassEncounters: [
    { speciesId: 'rattata', minLevel: 16, maxLevel: 16, weight: 30 },
    { speciesId: 'raticate', minLevel: 16, maxLevel: 16, weight: 20 },
    { speciesId: 'magnemite', minLevel: 16, maxLevel: 16, weight: 20 },
    { speciesId: 'pidgeotto', minLevel: 16, maxLevel: 16, weight: 15 },
    { speciesId: 'miltank', minLevel: 15, maxLevel: 15, weight: 10 },
    { speciesId: 'tauros', minLevel: 15, maxLevel: 15, weight: 5 },
  ],
});

buildMapFromBlk({
  id: 'route_39_barn',
  name: 'Route 39 Barn',
  tileset: 'traditional_house',
  blkFile: 'maps__Route39Barn.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'route_39', targetX: 1, targetY: 4 },
    { x: 4, y: 7, targetMapId: 'route_39', targetX: 1, targetY: 4 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'route_39_farmhouse',
  name: 'Route 39 Farmhouse',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'route_39', targetX: 5, targetY: 4 },
    { x: 3, y: 7, targetMapId: 'route_39', targetX: 5, targetY: 4 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_city',
  name: 'Olivine City',
  tileset: 'johto',
  blkFile: 'maps__OlivineCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'ol',
  connections: {
    NORTH: { mapId: 'route_39', offset: 10 },
    WEST: { mapId: 'route_40', offset: 18 },
  },
  warps: [
    { x: 13, y: 21, targetMapId: 'olivine_poke_center', targetX: 3, targetY: 7 },
    { x: 10, y: 11, targetMapId: 'olivine_gym', targetX: 4, targetY: 15 },
    { x: 25, y: 11, targetMapId: 'olivine_tims_house', targetX: 2, targetY: 7 },
    { x: 13, y: 15, targetMapId: 'olivine_good_rod_house', targetX: 2, targetY: 7 },
    { x: 7, y: 21, targetMapId: 'olivine_cafe', targetX: 2, targetY: 7 },
    { x: 19, y: 17, targetMapId: 'olivine_mart', targetX: 2, targetY: 7 },
    { x: 29, y: 27, targetMapId: 'olivine_lighthouse_1f', targetX: 10, targetY: 17 },
  ],
  bgEvents: [
    {
      x: 17,
      y: 11,
      speaker: '⚓ OLIVINE CITY',
      pages: ['OLIVINE CITY', 'The Port Closest to Foreign Lands'],
    },
    {
      x: 13,
      y: 11,
      speaker: '🏆 OLIVINE GYM',
      pages: ['OLIVINE CITY POKéMON GYM', 'LEADER: JASMINE', 'The Steel-Clad Defense Girl!'],
    },
    {
      x: 31,
      y: 27,
      speaker: '🗼 OLIVINE LIGHTHOUSE',
      pages: ['OLIVINE LIGHTHOUSE', 'Also known as the Glitter Lighthouse'],
    },
  ],
});

buildMapFromBlk({
  id: 'olivine_poke_center',
  name: 'Olivine Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'olivine_city', targetX: 13, targetY: 22 },
    { x: 4, y: 7, targetMapId: 'olivine_city', targetX: 13, targetY: 22 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_mart',
  name: 'Olivine Mart',
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'olivine_city', targetX: 19, targetY: 18 },
    { x: 3, y: 7, targetMapId: 'olivine_city', targetX: 19, targetY: 18 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_gym',
  name: 'Olivine Gym',
  tileset: 'champions_room',
  blkFile: 'maps__OlivineGym.blk',
  blocksW: 5,
  blocksH: 8,
  warps: [
    { x: 4, y: 15, targetMapId: 'olivine_city', targetX: 10, targetY: 12 },
    { x: 5, y: 15, targetMapId: 'olivine_city', targetX: 10, targetY: 12 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 13,
      speaker: '🏆 OLIVINE GYM STATUE',
      pages: ['OLIVINE CITY POKéMON GYM', 'LEADER: JASMINE'],
    },
    {
      x: 6,
      y: 13,
      speaker: '🏆 OLIVINE GYM STATUE',
      pages: ['OLIVINE CITY POKéMON GYM', 'LEADER: JASMINE'],
    },
  ],
});

buildMapFromBlk({
  id: 'olivine_cafe',
  name: 'Olivine Café',
  tileset: 'game_corner',
  blkFile: 'maps__OlivineCafe.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'olivine_city', targetX: 7, targetY: 22 },
    { x: 3, y: 7, targetMapId: 'olivine_city', targetX: 7, targetY: 22 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_tims_house',
  name: "Olivine Tim's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'olivine_city', targetX: 25, targetY: 12 },
    { x: 3, y: 7, targetMapId: 'olivine_city', targetX: 25, targetY: 12 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_good_rod_house',
  name: 'Olivine Good Rod House',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'olivine_city', targetX: 13, targetY: 16 },
    { x: 3, y: 7, targetMapId: 'olivine_city', targetX: 13, targetY: 16 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_lighthouse_1f',
  name: 'Olivine Lighthouse 1F',
  tileset: 'lighthouse',
  blkFile: 'maps__OlivineLighthouse1F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 10, y: 17, targetMapId: 'olivine_city', targetX: 29, targetY: 28 },
    { x: 11, y: 17, targetMapId: 'olivine_city', targetX: 29, targetY: 28 },
    { x: 3, y: 11, targetMapId: 'olivine_lighthouse_2f', targetX: 3, targetY: 11 },
    { x: 16, y: 13, targetMapId: 'olivine_lighthouse_2f', targetX: 16, targetY: 13 },
    { x: 17, y: 13, targetMapId: 'olivine_lighthouse_2f', targetX: 17, targetY: 13 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_lighthouse_2f',
  name: 'Olivine Lighthouse 2F',
  tileset: 'lighthouse',
  blkFile: 'maps__OlivineLighthouse2F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 3, y: 11, targetMapId: 'olivine_lighthouse_1f', targetX: 3, targetY: 11 },
    { x: 5, y: 3, targetMapId: 'olivine_lighthouse_3f', targetX: 5, targetY: 3 },
    { x: 16, y: 13, targetMapId: 'olivine_lighthouse_1f', targetX: 16, targetY: 13 },
    { x: 17, y: 13, targetMapId: 'olivine_lighthouse_1f', targetX: 17, targetY: 13 },
    { x: 16, y: 11, targetMapId: 'olivine_lighthouse_3f', targetX: 16, targetY: 11 },
    { x: 17, y: 11, targetMapId: 'olivine_lighthouse_3f', targetX: 17, targetY: 11 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_lighthouse_3f',
  name: 'Olivine Lighthouse 3F',
  tileset: 'lighthouse',
  blkFile: 'maps__OlivineLighthouse3F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 13, y: 3, targetMapId: 'olivine_lighthouse_4f', targetX: 13, targetY: 3 },
    { x: 5, y: 3, targetMapId: 'olivine_lighthouse_2f', targetX: 5, targetY: 3 },
    { x: 9, y: 5, targetMapId: 'olivine_lighthouse_4f', targetX: 9, targetY: 5 },
    { x: 16, y: 11, targetMapId: 'olivine_lighthouse_2f', targetX: 16, targetY: 11 },
    { x: 17, y: 11, targetMapId: 'olivine_lighthouse_2f', targetX: 17, targetY: 11 },
    { x: 16, y: 9, targetMapId: 'olivine_lighthouse_4f', targetX: 16, targetY: 9 },
    { x: 17, y: 9, targetMapId: 'olivine_lighthouse_4f', targetX: 17, targetY: 9 },
    { x: 8, y: 3, targetMapId: 'olivine_lighthouse_4f', targetX: 8, targetY: 3 },
    { x: 9, y: 3, targetMapId: 'olivine_lighthouse_4f', targetX: 9, targetY: 3 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_lighthouse_4f',
  name: 'Olivine Lighthouse 4F',
  tileset: 'lighthouse',
  blkFile: 'maps__OlivineLighthouse4F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 13, y: 3, targetMapId: 'olivine_lighthouse_3f', targetX: 13, targetY: 3 },
    { x: 3, y: 5, targetMapId: 'olivine_lighthouse_5f', targetX: 3, targetY: 5 },
    { x: 9, y: 7, targetMapId: 'olivine_lighthouse_5f', targetX: 9, targetY: 7 },
    { x: 9, y: 5, targetMapId: 'olivine_lighthouse_3f', targetX: 9, targetY: 5 },
    { x: 16, y: 9, targetMapId: 'olivine_lighthouse_3f', targetX: 16, targetY: 9 },
    { x: 17, y: 9, targetMapId: 'olivine_lighthouse_3f', targetX: 17, targetY: 9 },
    { x: 8, y: 3, targetMapId: 'olivine_lighthouse_3f', targetX: 8, targetY: 3 },
    { x: 9, y: 3, targetMapId: 'olivine_lighthouse_3f', targetX: 9, targetY: 3 },
    { x: 16, y: 7, targetMapId: 'olivine_lighthouse_5f', targetX: 16, targetY: 7 },
    { x: 17, y: 7, targetMapId: 'olivine_lighthouse_5f', targetX: 17, targetY: 7 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_lighthouse_5f',
  name: 'Olivine Lighthouse 5F',
  tileset: 'lighthouse',
  blkFile: 'maps__OlivineLighthouse5F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 9, y: 15, targetMapId: 'olivine_lighthouse_6f', targetX: 9, targetY: 15 },
    { x: 3, y: 5, targetMapId: 'olivine_lighthouse_4f', targetX: 3, targetY: 5 },
    { x: 9, y: 7, targetMapId: 'olivine_lighthouse_4f', targetX: 9, targetY: 7 },
    { x: 16, y: 7, targetMapId: 'olivine_lighthouse_4f', targetX: 16, targetY: 7 },
    { x: 17, y: 7, targetMapId: 'olivine_lighthouse_4f', targetX: 17, targetY: 7 },
    { x: 16, y: 5, targetMapId: 'olivine_lighthouse_6f', targetX: 16, targetY: 5 },
    { x: 17, y: 5, targetMapId: 'olivine_lighthouse_6f', targetX: 17, targetY: 5 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'olivine_lighthouse_6f',
  name: 'Olivine Lighthouse 6F',
  tileset: 'lighthouse',
  blkFile: 'maps__OlivineLighthouse6F.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 9, y: 15, targetMapId: 'olivine_lighthouse_5f', targetX: 9, targetY: 15 },
    { x: 16, y: 5, targetMapId: 'olivine_lighthouse_5f', targetX: 16, targetY: 5 },
    { x: 17, y: 5, targetMapId: 'olivine_lighthouse_5f', targetX: 17, targetY: 5 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'route_40',
  name: 'Route 40',
  tileset: 'johto',
  blkFile: 'maps__Route40.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'ol',
  connections: {
    EAST: { mapId: 'olivine_city', offset: -18 },
    SOUTH: { mapId: 'route_41', offset: -30 },
  },
  warps: [],
  bgEvents: [
    {
      x: 14,
      y: 5,
      speaker: '📍 ROUTE 40 SIGN',
      pages: ['ROUTE 40', 'Cianwood City Ahead across the sea'],
    },
  ],
  grassEncounters: [
    { speciesId: 'tentacool', minLevel: 15, maxLevel: 20, weight: 80 },
    { speciesId: 'tentacruel', minLevel: 20, maxLevel: 20, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'route_41',
  name: 'Route 41',
  tileset: 'johto',
  blkFile: 'maps__Route41.blk',
  blocksW: 25,
  blocksH: 27,
  roofGroup: 'ol',
  connections: {
    NORTH: { mapId: 'route_40', offset: 30 },
    WEST: { mapId: 'cianwood_city', offset: 0 },
  },
  warps: [
    { x: 12, y: 17, targetMapId: 'whirl_island_nw', targetX: 5, targetY: 7 },
    { x: 36, y: 19, targetMapId: 'whirl_island_ne', targetX: 3, targetY: 13 },
    { x: 12, y: 37, targetMapId: 'whirl_island_sw', targetX: 5, targetY: 7 },
    { x: 36, y: 45, targetMapId: 'whirl_island_se', targetX: 5, targetY: 13 },
  ],
  bgEvents: [
    {
      x: 14,
      y: 17,
      speaker: '🌀 WHIRL ISLANDS',
      pages: ['WHIRL ISLANDS', 'Dangerous whirlpools swirl around these mysterious caverns.'],
    },
  ],
  grassEncounters: [
    { speciesId: 'tentacool', minLevel: 20, maxLevel: 20, weight: 60 },
    { speciesId: 'tentacruel', minLevel: 20, maxLevel: 20, weight: 20 },
    { speciesId: 'mantine', minLevel: 20, maxLevel: 20, weight: 20 },
  ],
});

buildMapFromBlk({
  id: 'cianwood_city',
  name: 'Cianwood City',
  tileset: 'johto',
  blkFile: 'maps__CianwoodCity.blk',
  blocksW: 15,
  blocksH: 27,
  roofGroup: 'ci',
  connections: {
    EAST: { mapId: 'route_41', offset: 0 },
  },
  warps: [
    { x: 8, y: 43, targetMapId: 'cianwood_gym', targetX: 4, targetY: 17 },
    { x: 23, y: 43, targetMapId: 'cianwood_poke_center', targetX: 3, targetY: 7 },
    { x: 15, y: 47, targetMapId: 'cianwood_pharmacy', targetX: 2, targetY: 7 },
    { x: 9, y: 31, targetMapId: 'cianwood_photo_studio', targetX: 2, targetY: 7 },
    { x: 15, y: 37, targetMapId: 'cianwood_lugia_speech_house', targetX: 2, targetY: 7 },
  ],
  bgEvents: [
    {
      x: 20,
      y: 34,
      speaker: '🌊 CIANWOOD CITY',
      pages: ['CIANWOOD CITY', 'A Port Surrounded by Rough Seas'],
    },
    {
      x: 7,
      y: 45,
      speaker: '🥋 CIANWOOD GYM',
      pages: ['CIANWOOD CITY POKéMON GYM', 'LEADER: CHUCK', 'His Roaring Fists Do the Talking!'],
    },
    {
      x: 19,
      y: 47,
      speaker: '💊 CIANWOOD PHARMACY',
      pages: ['500 YEARS OF TRADITION', 'CIANWOOD CITY PHARMACY', 'We Carry the Fabled SecretPotion!'],
    },
  ],
});

buildMapFromBlk({
  id: 'cianwood_poke_center',
  name: 'Cianwood Pokémon Center',
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  warps: [
    { x: 3, y: 7, targetMapId: 'cianwood_city', targetX: 23, targetY: 44 },
    { x: 4, y: 7, targetMapId: 'cianwood_city', targetX: 23, targetY: 44 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'cianwood_gym',
  name: 'Cianwood Gym',
  tileset: 'tower',
  blkFile: 'maps__CianwoodGym.blk',
  blocksW: 5,
  blocksH: 9,
  warps: [
    { x: 4, y: 17, targetMapId: 'cianwood_city', targetX: 8, targetY: 44 },
    { x: 5, y: 17, targetMapId: 'cianwood_city', targetX: 8, targetY: 44 },
  ],
  bgEvents: [
    {
      x: 3,
      y: 15,
      speaker: '🏆 CIANWOOD GYM STATUE',
      pages: ['CIANWOOD CITY POKéMON GYM', 'LEADER: CHUCK'],
    },
    {
      x: 6,
      y: 15,
      speaker: '🏆 CIANWOOD GYM STATUE',
      pages: ['CIANWOOD CITY POKéMON GYM', 'LEADER: CHUCK'],
    },
  ],
});

buildMapFromBlk({
  id: 'cianwood_pharmacy',
  name: 'Cianwood Pharmacy',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'cianwood_city', targetX: 15, targetY: 48 },
    { x: 3, y: 7, targetMapId: 'cianwood_city', targetX: 15, targetY: 48 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'cianwood_photo_studio',
  name: 'Cianwood Photo Studio',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'cianwood_city', targetX: 9, targetY: 32 },
    { x: 3, y: 7, targetMapId: 'cianwood_city', targetX: 9, targetY: 32 },
  ],
  bgEvents: [],
});

buildMapFromBlk({
  id: 'cianwood_lugia_speech_house',
  name: 'Cianwood Lugia Speech House',
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  warps: [
    { x: 2, y: 7, targetMapId: 'cianwood_city', targetX: 15, targetY: 38 },
    { x: 3, y: 7, targetMapId: 'cianwood_city', targetX: 15, targetY: 38 },
  ],
  bgEvents: [],
});

// Whirl Islands
buildMapFromBlk({
  id: 'whirl_island_ne',
  name: 'Whirl Island NE',
  tileset: 'cave',
  blkFile: 'maps__WhirlIslandNE.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 3, y: 13, targetMapId: 'route_41', targetX: 36, targetY: 20 },
    { x: 17, y: 3, targetMapId: 'whirl_island_b1f', targetX: 35, targetY: 3 },
    { x: 13, y: 11, targetMapId: 'whirl_island_b1f', targetX: 29, targetY: 9 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'krabby', minLevel: 22, maxLevel: 24, weight: 40 },
    { speciesId: 'zubat', minLevel: 23, maxLevel: 23, weight: 30 },
    { speciesId: 'seel', minLevel: 22, maxLevel: 24, weight: 20 },
    { speciesId: 'golbat', minLevel: 25, maxLevel: 25, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'whirl_island_se',
  name: 'Whirl Island SE',
  tileset: 'cave',
  blkFile: 'maps__WhirlIslandSE.blk',
  blocksW: 5,
  blocksH: 9,
  warps: [
    { x: 5, y: 13, targetMapId: 'route_41', targetX: 36, targetY: 46 },
    { x: 5, y: 3, targetMapId: 'whirl_island_b1f', targetX: 31, targetY: 29 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'krabby', minLevel: 22, maxLevel: 24, weight: 40 },
    { speciesId: 'zubat', minLevel: 23, maxLevel: 23, weight: 30 },
    { speciesId: 'seel', minLevel: 22, maxLevel: 24, weight: 20 },
    { speciesId: 'golbat', minLevel: 25, maxLevel: 25, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'whirl_island_sw',
  name: 'Whirl Island SW',
  tileset: 'cave',
  blkFile: 'maps__WhirlIslandSW.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 5, y: 7, targetMapId: 'route_41', targetX: 12, targetY: 38 },
    { x: 17, y: 3, targetMapId: 'whirl_island_b1f', targetX: 23, targetY: 31 },
    { x: 3, y: 3, targetMapId: 'whirl_island_b1f', targetX: 9, targetY: 31 },
    { x: 3, y: 15, targetMapId: 'whirl_island_nw', targetX: 3, targetY: 15 },
    { x: 17, y: 15, targetMapId: 'whirl_island_b2f', targetX: 13, targetY: 31 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'krabby', minLevel: 22, maxLevel: 24, weight: 40 },
    { speciesId: 'zubat', minLevel: 23, maxLevel: 23, weight: 30 },
    { speciesId: 'seel', minLevel: 22, maxLevel: 24, weight: 20 },
    { speciesId: 'golbat', minLevel: 25, maxLevel: 25, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'whirl_island_nw',
  name: 'Whirl Island NW',
  tileset: 'cave',
  blkFile: 'maps__WhirlIslandNW.blk',
  blocksW: 5,
  blocksH: 9,
  warps: [
    { x: 5, y: 7, targetMapId: 'route_41', targetX: 12, targetY: 18 },
    { x: 5, y: 3, targetMapId: 'whirl_island_b1f', targetX: 5, targetY: 5 },
    { x: 3, y: 15, targetMapId: 'whirl_island_sw', targetX: 3, targetY: 15 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'krabby', minLevel: 22, maxLevel: 24, weight: 40 },
    { speciesId: 'zubat', minLevel: 23, maxLevel: 23, weight: 30 },
    { speciesId: 'seel', minLevel: 22, maxLevel: 24, weight: 20 },
    { speciesId: 'golbat', minLevel: 25, maxLevel: 25, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'whirl_island_b1f',
  name: 'Whirl Island B1F',
  tileset: 'cave',
  blkFile: 'maps__WhirlIslandB1F.blk',
  blocksW: 20,
  blocksH: 18,
  warps: [
    { x: 5, y: 5, targetMapId: 'whirl_island_nw', targetX: 5, targetY: 3 },
    { x: 35, y: 3, targetMapId: 'whirl_island_ne', targetX: 17, targetY: 3 },
    { x: 29, y: 9, targetMapId: 'whirl_island_ne', targetX: 13, targetY: 11 },
    { x: 9, y: 31, targetMapId: 'whirl_island_sw', targetX: 3, targetY: 3 },
    { x: 23, y: 31, targetMapId: 'whirl_island_sw', targetX: 17, targetY: 3 },
    { x: 31, y: 29, targetMapId: 'whirl_island_se', targetX: 5, targetY: 3 },
    { x: 25, y: 21, targetMapId: 'whirl_island_b2f', targetX: 11, targetY: 5 },
    { x: 13, y: 27, targetMapId: 'whirl_island_b2f', targetX: 7, targetY: 11 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'krabby', minLevel: 23, maxLevel: 25, weight: 40 },
    { speciesId: 'zubat', minLevel: 24, maxLevel: 24, weight: 30 },
    { speciesId: 'seel', minLevel: 23, maxLevel: 25, weight: 20 },
    { speciesId: 'golbat', minLevel: 26, maxLevel: 26, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'whirl_island_b2f',
  name: 'Whirl Island B2F',
  tileset: 'cave',
  blkFile: 'maps__WhirlIslandB2F.blk',
  blocksW: 10,
  blocksH: 18,
  warps: [
    { x: 11, y: 5, targetMapId: 'whirl_island_b1f', targetX: 25, targetY: 21 },
    { x: 7, y: 11, targetMapId: 'whirl_island_b1f', targetX: 13, targetY: 27 },
    { x: 7, y: 25, targetMapId: 'whirl_island_lugia_chamber', targetX: 9, targetY: 13 },
    { x: 13, y: 31, targetMapId: 'whirl_island_sw', targetX: 17, targetY: 15 },
  ],
  bgEvents: [],
  grassEncounters: [
    { speciesId: 'krabby', minLevel: 24, maxLevel: 26, weight: 40 },
    { speciesId: 'zubat', minLevel: 25, maxLevel: 25, weight: 30 },
    { speciesId: 'seel', minLevel: 24, maxLevel: 26, weight: 20 },
    { speciesId: 'golbat', minLevel: 27, maxLevel: 27, weight: 10 },
  ],
});

buildMapFromBlk({
  id: 'whirl_island_lugia_chamber',
  name: "Whirl Island Lugia's Chamber",
  tileset: 'cave',
  blkFile: 'maps__WhirlIslandLugiaChamber.blk',
  blocksW: 10,
  blocksH: 9,
  warps: [
    { x: 9, y: 13, targetMapId: 'whirl_island_b2f', targetX: 7, targetY: 25 },
  ],
  bgEvents: [
    {
      x: 9,
      y: 5,
      speaker: '🌊 LUGIA SHRINE',
      pages: [
        'A cascading underground waterfall echoes through the sacred chamber…',
        'Deep within the basin, the legendary Silver-Winged guardian of the seas, LUGIA, rests in slumber.',
      ],
    },
  ],
});





// >>> phase11 specs start

// ==========================================
// PHASE 11: MAHOGANY, LAKE OF RAGE & BLACKTHORN (auto-generated by build-phase.cjs)
// ==========================================
buildMapFromBlk({
  id: 'route_42',
  name: "Route 42",
  tileset: 'johto',
  blkFile: 'maps__Route42.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'mh',
  connections: {"WEST":{"mapId":"ecruteak_city","offset":-18},"EAST":{"mapId":"mahogany_town","offset":0}},
  warps: [{"x":0,"y":8,"targetMapId":"route_42_ecruteak_gate","targetX":9,"targetY":4},{"x":0,"y":9,"targetMapId":"route_42_ecruteak_gate","targetX":9,"targetY":5},{"x":10,"y":5,"targetMapId":"mount_mortar_1f_outside","targetX":3,"targetY":33},{"x":28,"y":9,"targetMapId":"mount_mortar_1f_outside","targetX":17,"targetY":33},{"x":46,"y":7,"targetMapId":"mount_mortar_1f_outside","targetX":37,"targetY":33}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"ekans","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"spearow","minLevel":14,"maxLevel":14,"weight":30},{"speciesId":"rattata","minLevel":15,"maxLevel":15,"weight":20},{"speciesId":"raticate","minLevel":16,"maxLevel":16,"weight":10},{"speciesId":"arbok","minLevel":15,"maxLevel":15,"weight":5},{"speciesId":"fearow","minLevel":16,"maxLevel":16,"weight":5}],
});

buildMapFromBlk({
  id: 'route_42_ecruteak_gate',
  name: "Route 42 Ecruteak Gate",
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":0,"y":4,"targetMapId":"ecruteak_city","targetX":35,"targetY":26},{"x":0,"y":5,"targetMapId":"ecruteak_city","targetX":35,"targetY":27},{"x":9,"y":4,"targetMapId":"route_42","targetX":0,"targetY":8},{"x":9,"y":5,"targetMapId":"route_42","targetX":0,"targetY":9}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'mount_mortar_1f_outside',
  name: "Mt. Mortar 1F (Outside)",
  tileset: 'cave',
  blkFile: 'maps__MountMortar1FOutside.blk',
  blocksW: 20,
  blocksH: 18,
  connections: {},
  warps: [{"x":3,"y":33,"targetMapId":"route_42","targetX":10,"targetY":5},{"x":17,"y":33,"targetMapId":"route_42","targetX":28,"targetY":9},{"x":37,"y":33,"targetMapId":"route_42","targetX":46,"targetY":7},{"x":17,"y":5,"targetMapId":"mount_mortar_2f_inside","targetX":17,"targetY":33},{"x":11,"y":21,"targetMapId":"mount_mortar_1f_inside","targetX":11,"targetY":47},{"x":29,"y":21,"targetMapId":"mount_mortar_1f_inside","targetX":29,"targetY":47},{"x":17,"y":29,"targetMapId":"mount_mortar_b1f","targetX":19,"targetY":29},{"x":7,"y":13,"targetMapId":"mount_mortar_1f_inside","targetX":5,"targetY":39},{"x":33,"y":13,"targetMapId":"mount_mortar_1f_inside","targetX":33,"targetY":41}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"rattata","minLevel":14,"maxLevel":14,"weight":30},{"speciesId":"zubat","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"machop","minLevel":14,"maxLevel":14,"weight":20},{"speciesId":"golbat","minLevel":13,"maxLevel":13,"weight":10},{"speciesId":"geodude","minLevel":14,"maxLevel":14,"weight":5},{"speciesId":"raticate","minLevel":16,"maxLevel":16,"weight":5}],
});

buildMapFromBlk({
  id: 'mount_mortar_1f_inside',
  name: "Mt. Mortar 1F (Inside)",
  tileset: 'cave',
  blkFile: 'maps__MountMortar1FInside.blk',
  blocksW: 20,
  blocksH: 27,
  connections: {},
  warps: [{"x":11,"y":47,"targetMapId":"mount_mortar_1f_outside","targetX":11,"targetY":21},{"x":29,"y":47,"targetMapId":"mount_mortar_1f_outside","targetX":29,"targetY":21},{"x":5,"y":39,"targetMapId":"mount_mortar_1f_outside","targetX":7,"targetY":13},{"x":33,"y":41,"targetMapId":"mount_mortar_1f_outside","targetX":33,"targetY":13},{"x":3,"y":19,"targetMapId":"mount_mortar_b1f","targetX":3,"targetY":3},{"x":9,"y":9,"targetMapId":"mount_mortar_2f_inside","targetX":3,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"geodude","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"rattata","minLevel":14,"maxLevel":14,"weight":30},{"speciesId":"machop","minLevel":15,"maxLevel":15,"weight":20},{"speciesId":"raticate","minLevel":14,"maxLevel":14,"weight":10},{"speciesId":"zubat","minLevel":15,"maxLevel":15,"weight":5},{"speciesId":"golbat","minLevel":15,"maxLevel":15,"weight":5}],
});

buildMapFromBlk({
  id: 'mount_mortar_2f_inside',
  name: "Mt. Mortar 2F",
  tileset: 'cave',
  blkFile: 'maps__MountMortar2FInside.blk',
  blocksW: 20,
  blocksH: 18,
  connections: {},
  warps: [{"x":17,"y":33,"targetMapId":"mount_mortar_1f_outside","targetX":17,"targetY":5},{"x":3,"y":5,"targetMapId":"mount_mortar_1f_inside","targetX":9,"targetY":9}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"graveler","minLevel":31,"maxLevel":31,"weight":30},{"speciesId":"machoke","minLevel":32,"maxLevel":32,"weight":30},{"speciesId":"geodude","minLevel":31,"maxLevel":31,"weight":20},{"speciesId":"raticate","minLevel":30,"maxLevel":30,"weight":10},{"speciesId":"machop","minLevel":28,"maxLevel":28,"weight":5},{"speciesId":"golbat","minLevel":30,"maxLevel":30,"weight":5}],
});

buildMapFromBlk({
  id: 'mount_mortar_b1f',
  name: "Mt. Mortar B1F",
  tileset: 'cave',
  blkFile: 'maps__MountMortarB1F.blk',
  blocksW: 20,
  blocksH: 18,
  connections: {},
  warps: [{"x":3,"y":3,"targetMapId":"mount_mortar_1f_inside","targetX":3,"targetY":19},{"x":19,"y":29,"targetMapId":"mount_mortar_1f_outside","targetX":17,"targetY":29}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"zubat","minLevel":15,"maxLevel":17,"weight":60},{"speciesId":"golbat","minLevel":17,"maxLevel":17,"weight":20},{"speciesId":"machop","minLevel":16,"maxLevel":16,"weight":10},{"speciesId":"geodude","minLevel":16,"maxLevel":16,"weight":5},{"speciesId":"raticate","minLevel":18,"maxLevel":18,"weight":5}],
});

buildMapFromBlk({
  id: 'mahogany_town',
  name: "Mahogany Town",
  tileset: 'johto',
  blkFile: 'maps__unused__BetaMahoganyTown.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'mh',
  connections: {"NORTH":{"mapId":"route_43","offset":0},"WEST":{"mapId":"route_42","offset":0},"EAST":{"mapId":"route_44","offset":0}},
  warps: [{"x":11,"y":7,"targetMapId":"mahogany_mart","targetX":3,"targetY":7},{"x":17,"y":7,"targetMapId":"mahogany_red_gyarados_speech_house","targetX":2,"targetY":7},{"x":6,"y":13,"targetMapId":"mahogany_gym","targetX":4,"targetY":17},{"x":15,"y":13,"targetMapId":"mahogany_poke_center","targetX":3,"targetY":7},{"x":9,"y":1,"targetMapId":"route_43_mahogany_gate","targetX":4,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'mahogany_mart',
  name: "Mahogany Shop",
  tileset: 'traditional_house',
  blkFile: 'maps__GiftShop.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"mahogany_town","targetX":11,"targetY":7},{"x":4,"y":7,"targetMapId":"mahogany_town","targetX":11,"targetY":7},{"x":7,"y":3,"targetMapId":"team_rocket_base_b1f","targetX":27,"targetY":2}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'mahogany_gym',
  name: "Mahogany Gym",
  tileset: 'elite_four_room',
  blkFile: 'maps__MahoganyGym.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"mahogany_town","targetX":6,"targetY":13},{"x":5,"y":17,"targetMapId":"mahogany_town","targetX":6,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'mahogany_poke_center',
  name: "Mahogany Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"mahogany_town","targetX":15,"targetY":13},{"x":4,"y":7,"targetMapId":"mahogany_town","targetX":15,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'mahogany_red_gyarados_speech_house',
  name: "Mahogany House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"mahogany_town","targetX":17,"targetY":7},{"x":3,"y":7,"targetMapId":"mahogany_town","targetX":17,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'team_rocket_base_b1f',
  name: "Rocket Hideout B1F",
  tileset: 'facility',
  blkFile: 'maps__TeamRocketBaseB1F.blk',
  blocksW: 15,
  blocksH: 9,
  connections: {},
  warps: [{"x":27,"y":2,"targetMapId":"mahogany_mart","targetX":7,"targetY":3},{"x":3,"y":14,"targetMapId":"team_rocket_base_b2f","targetX":3,"targetY":14},{"x":5,"y":15,"targetMapId":"team_rocket_base_b1f","targetX":25,"targetY":2},{"x":25,"y":2,"targetMapId":"team_rocket_base_b1f","targetX":5,"targetY":15}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'team_rocket_base_b2f',
  name: "Rocket Hideout B2F",
  tileset: 'facility',
  blkFile: 'maps__TeamRocketBaseB2F.blk',
  blocksW: 15,
  blocksH: 9,
  connections: {},
  warps: [{"x":3,"y":14,"targetMapId":"team_rocket_base_b1f","targetX":3,"targetY":14},{"x":3,"y":2,"targetMapId":"team_rocket_base_b3f","targetX":3,"targetY":2},{"x":27,"y":2,"targetMapId":"team_rocket_base_b3f","targetX":27,"targetY":2},{"x":3,"y":6,"targetMapId":"team_rocket_base_b3f","targetX":3,"targetY":6},{"x":27,"y":14,"targetMapId":"team_rocket_base_b3f","targetX":27,"targetY":14}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'team_rocket_base_b3f',
  name: "Rocket Hideout B3F",
  tileset: 'facility',
  blkFile: 'maps__TeamRocketBaseB3F.blk',
  blocksW: 15,
  blocksH: 9,
  connections: {},
  warps: [{"x":3,"y":2,"targetMapId":"team_rocket_base_b2f","targetX":3,"targetY":2},{"x":27,"y":2,"targetMapId":"team_rocket_base_b2f","targetX":27,"targetY":2},{"x":3,"y":6,"targetMapId":"team_rocket_base_b2f","targetX":3,"targetY":6},{"x":27,"y":14,"targetMapId":"team_rocket_base_b2f","targetX":27,"targetY":14}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_43',
  name: "Route 43",
  tileset: 'johto',
  blkFile: 'maps__Route43.blk',
  blocksW: 10,
  blocksH: 27,
  roofGroup: 'mh',
  connections: {"NORTH":{"mapId":"lake_of_rage","offset":-10},"SOUTH":{"mapId":"mahogany_town","offset":0}},
  warps: [{"x":9,"y":51,"targetMapId":"route_43_mahogany_gate","targetX":4,"targetY":0},{"x":10,"y":51,"targetMapId":"route_43_mahogany_gate","targetX":5,"targetY":0},{"x":17,"y":35,"targetMapId":"route_43_gate","targetX":4,"targetY":7},{"x":17,"y":31,"targetMapId":"route_43_gate","targetX":4,"targetY":0},{"x":18,"y":31,"targetMapId":"route_43_gate","targetX":5,"targetY":0}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"sentret","minLevel":15,"maxLevel":15,"weight":30},{"speciesId":"pidgeotto","minLevel":16,"maxLevel":16,"weight":30},{"speciesId":"farfetchd","minLevel":16,"maxLevel":16,"weight":20},{"speciesId":"furret","minLevel":15,"maxLevel":17,"weight":15},{"speciesId":"raticate","minLevel":17,"maxLevel":17,"weight":5}],
});

buildMapFromBlk({
  id: 'route_43_mahogany_gate',
  name: "Route 43 Mahogany Gate",
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":4,"y":0,"targetMapId":"route_43","targetX":9,"targetY":51},{"x":5,"y":0,"targetMapId":"route_43","targetX":10,"targetY":51},{"x":4,"y":7,"targetMapId":"mahogany_town","targetX":9,"targetY":1},{"x":5,"y":7,"targetMapId":"mahogany_town","targetX":9,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_43_gate',
  name: "Route 43 Gate",
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":4,"y":0,"targetMapId":"route_43","targetX":17,"targetY":31},{"x":5,"y":0,"targetMapId":"route_43","targetX":18,"targetY":31},{"x":4,"y":7,"targetMapId":"route_43","targetX":17,"targetY":35},{"x":5,"y":7,"targetMapId":"route_43","targetX":17,"targetY":35}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lake_of_rage',
  name: "Lake of Rage",
  tileset: 'johto',
  blkFile: 'maps__unused__BetaLakeOfRage.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'lr',
  connections: {"SOUTH":{"mapId":"route_43","offset":10}},
  warps: [{"x":7,"y":3,"targetMapId":"lake_of_rage_hidden_power_house","targetX":2,"targetY":7},{"x":27,"y":31,"targetMapId":"lake_of_rage_magikarp_house","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lake_of_rage_hidden_power_house',
  name: "Hidden Power House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"lake_of_rage","targetX":7,"targetY":3},{"x":3,"y":7,"targetMapId":"lake_of_rage","targetX":7,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lake_of_rage_magikarp_house',
  name: "Magikarp House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"lake_of_rage","targetX":27,"targetY":31},{"x":3,"y":7,"targetMapId":"lake_of_rage","targetX":27,"targetY":31}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_44',
  name: "Route 44",
  tileset: 'johto',
  blkFile: 'maps__Route44.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'bt',
  connections: {"WEST":{"mapId":"mahogany_town","offset":0},"EAST":{"mapId":"blackthorn_city","offset":-18}},
  warps: [{"x":56,"y":7,"targetMapId":"ice_path_1f","targetX":4,"targetY":19}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"tangela","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"lickitung","minLevel":22,"maxLevel":26,"weight":40},{"speciesId":"bellsprout","minLevel":22,"maxLevel":22,"weight":20},{"speciesId":"weepinbell","minLevel":24,"maxLevel":24,"weight":10}],
});

buildMapFromBlk({
  id: 'ice_path_1f',
  name: "Ice Path 1F",
  tileset: 'ice_path',
  blkFile: 'maps__IcePath1F.blk',
  blocksW: 20,
  blocksH: 18,
  connections: {},
  warps: [{"x":4,"y":19,"targetMapId":"route_44","targetX":56,"targetY":7},{"x":36,"y":27,"targetMapId":"blackthorn_city","targetX":36,"targetY":9},{"x":37,"y":5,"targetMapId":"ice_path_b1f","targetX":3,"targetY":15},{"x":37,"y":13,"targetMapId":"ice_path_b1f","targetX":5,"targetY":25}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"swinub","minLevel":21,"maxLevel":23,"weight":40},{"speciesId":"zubat","minLevel":22,"maxLevel":22,"weight":30},{"speciesId":"golbat","minLevel":22,"maxLevel":24,"weight":30}],
});

buildMapFromBlk({
  id: 'ice_path_b1f',
  name: "Ice Path B1F",
  tileset: 'ice_path',
  blkFile: 'maps__IcePathB1F.blk',
  blocksW: 10,
  blocksH: 18,
  connections: {},
  warps: [{"x":3,"y":15,"targetMapId":"ice_path_1f","targetX":37,"targetY":5},{"x":17,"y":3,"targetMapId":"ice_path_b2f_mahogany_side","targetX":17,"targetY":1},{"x":11,"y":2,"targetMapId":"ice_path_b2f_mahogany_side","targetX":11,"targetY":4},{"x":4,"y":7,"targetMapId":"ice_path_b2f_mahogany_side","targetX":4,"targetY":6},{"x":5,"y":12,"targetMapId":"ice_path_b2f_mahogany_side","targetX":4,"targetY":12},{"x":12,"y":13,"targetMapId":"ice_path_b2f_mahogany_side","targetX":12,"targetY":12},{"x":5,"y":25,"targetMapId":"ice_path_1f","targetX":37,"targetY":13},{"x":11,"y":27,"targetMapId":"ice_path_b2f_blackthorn_side","targetX":3,"targetY":15}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"swinub","minLevel":22,"maxLevel":24,"weight":40},{"speciesId":"zubat","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"golbat","minLevel":23,"maxLevel":25,"weight":29},{"speciesId":"jynx","minLevel":22,"maxLevel":22,"weight":1}],
});

buildMapFromBlk({
  id: 'ice_path_b2f_mahogany_side',
  name: "Ice Path B2F",
  tileset: 'ice_path',
  blkFile: 'maps__IcePathB2FMahoganySide.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":17,"y":1,"targetMapId":"ice_path_b1f","targetX":17,"targetY":3},{"x":9,"y":11,"targetMapId":"ice_path_b3f","targetX":3,"targetY":5},{"x":11,"y":4,"targetMapId":"ice_path_b1f","targetX":11,"targetY":2},{"x":4,"y":6,"targetMapId":"ice_path_b1f","targetX":4,"targetY":7},{"x":4,"y":12,"targetMapId":"ice_path_b1f","targetX":5,"targetY":12},{"x":12,"y":12,"targetMapId":"ice_path_b1f","targetX":12,"targetY":13}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"swinub","minLevel":23,"maxLevel":25,"weight":40},{"speciesId":"zubat","minLevel":24,"maxLevel":24,"weight":30},{"speciesId":"golbat","minLevel":24,"maxLevel":26,"weight":25},{"speciesId":"jynx","minLevel":22,"maxLevel":24,"weight":5}],
});

buildMapFromBlk({
  id: 'ice_path_b2f_blackthorn_side',
  name: "Ice Path B2F",
  tileset: 'ice_path',
  blkFile: 'maps__IcePathB2FBlackthornSide.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":3,"y":15,"targetMapId":"ice_path_b1f","targetX":11,"targetY":27},{"x":3,"y":3,"targetMapId":"ice_path_b3f","targetX":15,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"swinub","minLevel":23,"maxLevel":25,"weight":40},{"speciesId":"zubat","minLevel":24,"maxLevel":24,"weight":30},{"speciesId":"golbat","minLevel":24,"maxLevel":26,"weight":25},{"speciesId":"jynx","minLevel":22,"maxLevel":24,"weight":5}],
});

buildMapFromBlk({
  id: 'ice_path_b3f',
  name: "Ice Path B3F",
  tileset: 'ice_path',
  blkFile: 'maps__IcePathB3F.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":3,"y":5,"targetMapId":"ice_path_b2f_mahogany_side","targetX":9,"targetY":11},{"x":15,"y":5,"targetMapId":"ice_path_b2f_blackthorn_side","targetX":3,"targetY":3}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"swinub","minLevel":24,"maxLevel":26,"weight":40},{"speciesId":"zubat","minLevel":25,"maxLevel":25,"weight":30},{"speciesId":"golbat","minLevel":25,"maxLevel":25,"weight":20},{"speciesId":"jynx","minLevel":22,"maxLevel":26,"weight":10}],
});

buildMapFromBlk({
  id: 'blackthorn_city',
  name: "Blackthorn City",
  tileset: 'johto',
  blkFile: 'maps__unused__BetaBlackthornCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'bt',
  connections: {"SOUTH":{"mapId":"route_45","offset":0},"WEST":{"mapId":"route_44","offset":18}},
  warps: [{"x":18,"y":11,"targetMapId":"blackthorn_gym_1f","targetX":4,"targetY":17},{"x":13,"y":21,"targetMapId":"blackthorn_dragon_speech_house","targetX":2,"targetY":7},{"x":29,"y":23,"targetMapId":"blackthorn_emys_house","targetX":2,"targetY":7},{"x":15,"y":29,"targetMapId":"blackthorn_mart","targetX":3,"targetY":7},{"x":21,"y":29,"targetMapId":"blackthorn_poke_center","targetX":3,"targetY":7},{"x":9,"y":31,"targetMapId":"move_deleters_house","targetX":2,"targetY":7},{"x":36,"y":9,"targetMapId":"ice_path_1f","targetX":36,"targetY":27},{"x":20,"y":1,"targetMapId":"dragons_den_1f","targetX":3,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'blackthorn_gym_1f',
  name: "Blackthorn Gym 1F",
  tileset: 'elite_four_room',
  blkFile: 'maps__BlackthornGym1F.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"blackthorn_city","targetX":18,"targetY":11},{"x":5,"y":17,"targetMapId":"blackthorn_city","targetX":18,"targetY":11},{"x":1,"y":7,"targetMapId":"blackthorn_gym_2f","targetX":1,"targetY":7},{"x":7,"y":9,"targetMapId":"blackthorn_gym_2f","targetX":7,"targetY":9},{"x":2,"y":6,"targetMapId":"blackthorn_gym_2f","targetX":2,"targetY":5},{"x":7,"y":7,"targetMapId":"blackthorn_gym_2f","targetX":8,"targetY":7},{"x":7,"y":6,"targetMapId":"blackthorn_gym_2f","targetX":8,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'blackthorn_gym_2f',
  name: "Blackthorn Gym 2F",
  tileset: 'elite_four_room',
  blkFile: 'maps__BlackthornGym2F.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":1,"y":7,"targetMapId":"blackthorn_gym_1f","targetX":1,"targetY":7},{"x":7,"y":9,"targetMapId":"blackthorn_gym_1f","targetX":7,"targetY":9},{"x":2,"y":5,"targetMapId":"blackthorn_gym_1f","targetX":2,"targetY":6},{"x":8,"y":7,"targetMapId":"blackthorn_gym_1f","targetX":7,"targetY":7},{"x":8,"y":3,"targetMapId":"blackthorn_gym_1f","targetX":7,"targetY":6}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'blackthorn_dragon_speech_house',
  name: "Dragon Speech House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"blackthorn_city","targetX":13,"targetY":21},{"x":3,"y":7,"targetMapId":"blackthorn_city","targetX":13,"targetY":21}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'blackthorn_emys_house',
  name: "Emy's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"blackthorn_city","targetX":29,"targetY":23},{"x":3,"y":7,"targetMapId":"blackthorn_city","targetX":29,"targetY":23}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'blackthorn_mart',
  name: "Blackthorn Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"blackthorn_city","targetX":15,"targetY":29},{"x":3,"y":7,"targetMapId":"blackthorn_city","targetX":15,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'blackthorn_poke_center',
  name: "Blackthorn Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"blackthorn_city","targetX":21,"targetY":29},{"x":4,"y":7,"targetMapId":"blackthorn_city","targetX":21,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'move_deleters_house',
  name: "Move Deleter's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"blackthorn_city","targetX":9,"targetY":31},{"x":3,"y":7,"targetMapId":"blackthorn_city","targetX":9,"targetY":31}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'dragons_den_1f',
  name: "Dragon's Den 1F",
  tileset: 'cave',
  blkFile: 'maps__DragonsDen1F.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":3,"y":5,"targetMapId":"blackthorn_city","targetX":20,"targetY":1},{"x":3,"y":3,"targetMapId":"dragons_den_1f","targetX":5,"targetY":13},{"x":5,"y":15,"targetMapId":"dragons_den_b1f","targetX":20,"targetY":3},{"x":5,"y":13,"targetMapId":"dragons_den_1f","targetX":3,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'dragons_den_b1f',
  name: "Dragon's Den",
  tileset: 'johto',
  blkFile: 'maps__DragonsDenB1F.blk',
  blocksW: 20,
  blocksH: 18,
  connections: {},
  warps: [{"x":20,"y":3,"targetMapId":"dragons_den_1f","targetX":5,"targetY":15},{"x":19,"y":29,"targetMapId":"dragon_shrine","targetX":4,"targetY":9}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'dragon_shrine',
  name: "Dragon Shrine",
  tileset: 'lab',
  blkFile: 'maps__DragonShrine.blk',
  blocksW: 5,
  blocksH: 5,
  connections: {},
  warps: [{"x":4,"y":9,"targetMapId":"dragons_den_b1f","targetX":19,"targetY":29},{"x":5,"y":9,"targetMapId":"dragons_den_b1f","targetX":19,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_45',
  name: "Route 45",
  tileset: 'johto',
  blkFile: 'maps__Route45.blk',
  blocksW: 10,
  blocksH: 45,
  roofGroup: 'bt',
  connections: {"NORTH":{"mapId":"blackthorn_city","offset":0},"WEST":{"mapId":"route_46","offset":72}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"geodude","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"graveler","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"gligar","minLevel":24,"maxLevel":24,"weight":20},{"speciesId":"donphan","minLevel":25,"maxLevel":30,"weight":15},{"speciesId":"skarmory","minLevel":27,"maxLevel":27,"weight":5}],
});

buildMapFromBlk({
  id: 'route_46',
  name: "Route 46",
  tileset: 'johto',
  blkFile: 'maps__Route46.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'bt',
  connections: {"SOUTH":{"mapId":"route_29","offset":-20},"EAST":{"mapId":"route_45","offset":-72}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"geodude","minLevel":2,"maxLevel":3,"weight":50},{"speciesId":"spearow","minLevel":2,"maxLevel":2,"weight":30},{"speciesId":"rattata","minLevel":2,"maxLevel":3,"weight":20}],
});
// >>> phase11 specs end

// >>> phase12 specs start

// ==========================================
// PHASE 12: JOHTO ENDGAME - ROUTES 26/27, TOHJO FALLS, VICTORY ROAD, INDIGO PLATEAU, ROUTE 28 & SILVER CAVE (auto-generated by build-phase.cjs)
// ==========================================
buildMapFromBlk({
  id: 'route_27',
  name: "Route 27",
  tileset: 'johto',
  blkFile: 'maps__Route27.blk',
  blocksW: 40,
  blocksH: 9,
  roofGroup: 'nb',
  connections: {"WEST":{"mapId":"new_bark_town","offset":0},"EAST":{"mapId":"route_26","offset":-90}},
  warps: [{"x":33,"y":7,"targetMapId":"route_27_sandstorm_house","targetX":2,"targetY":7},{"x":26,"y":5,"targetMapId":"tohjo_falls","targetX":13,"targetY":15},{"x":36,"y":5,"targetMapId":"tohjo_falls","targetX":25,"targetY":15}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_27_sandstorm_house',
  name: "Sandstorm House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_27","targetX":33,"targetY":7},{"x":3,"y":7,"targetMapId":"route_27","targetX":33,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_26',
  name: "Route 26",
  tileset: 'johto',
  blkFile: 'maps__Route26.blk',
  blocksW: 10,
  blocksH: 54,
  roofGroup: 'nb',
  connections: {"WEST":{"mapId":"route_27","offset":90}},
  warps: [{"x":7,"y":5,"targetMapId":"victory_road_gate","targetX":9,"targetY":17},{"x":15,"y":57,"targetMapId":"route_26_heal_house","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_26_heal_house',
  name: "Route 26 House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_26","targetX":15,"targetY":57},{"x":3,"y":7,"targetMapId":"route_26","targetX":15,"targetY":57}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'tohjo_falls',
  name: "Tohjo Falls",
  tileset: 'cave',
  blkFile: 'maps__TohjoFalls.blk',
  blocksW: 15,
  blocksH: 9,
  connections: {},
  warps: [{"x":13,"y":15,"targetMapId":"route_27","targetX":26,"targetY":5},{"x":25,"y":15,"targetMapId":"route_27","targetX":36,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'victory_road_gate',
  name: "Victory Road Gate",
  tileset: 'gate',
  blkFile: 'maps__VictoryRoadGate.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":17,"y":7,"targetMapId":"route_22","targetX":13,"targetY":5},{"x":18,"y":7,"targetMapId":"route_22","targetX":13,"targetY":5},{"x":9,"y":17,"targetMapId":"route_26","targetX":7,"targetY":5},{"x":10,"y":17,"targetMapId":"route_26","targetX":7,"targetY":5},{"x":9,"y":0,"targetMapId":"victory_road","targetX":9,"targetY":67},{"x":10,"y":0,"targetMapId":"victory_road","targetX":9,"targetY":67},{"x":1,"y":7,"targetMapId":"route_28","targetX":33,"targetY":5},{"x":2,"y":7,"targetMapId":"route_28","targetX":33,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'victory_road',
  name: "Victory Road",
  tileset: 'cave',
  blkFile: 'maps__VictoryRoad.blk',
  blocksW: 10,
  blocksH: 36,
  connections: {},
  warps: [{"x":9,"y":67,"targetMapId":"victory_road_gate","targetX":9,"targetY":0},{"x":1,"y":49,"targetMapId":"victory_road","targetX":1,"targetY":35},{"x":1,"y":35,"targetMapId":"victory_road","targetX":1,"targetY":49},{"x":13,"y":31,"targetMapId":"victory_road","targetX":13,"targetY":17},{"x":13,"y":17,"targetMapId":"victory_road","targetX":13,"targetY":31},{"x":17,"y":33,"targetMapId":"victory_road","targetX":17,"targetY":19},{"x":17,"y":19,"targetMapId":"victory_road","targetX":17,"targetY":33},{"x":0,"y":11,"targetMapId":"victory_road","targetX":0,"targetY":27},{"x":0,"y":27,"targetMapId":"victory_road","targetX":0,"targetY":11},{"x":13,"y":5,"targetMapId":"route_23","targetX":9,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_22',
  name: "Route 22",
  tileset: 'kanto',
  blkFile: 'maps__Route22.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'vi',
  connections: {},
  warps: [{"x":13,"y":5,"targetMapId":"victory_road_gate","targetX":17,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_23',
  name: "Route 23",
  tileset: 'kanto',
  blkFile: 'maps__unused__BetaRoute23.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'in',
  connections: {},
  warps: [{"x":9,"y":5,"targetMapId":"indigo_plateau_poke_center","targetX":5,"targetY":13},{"x":10,"y":5,"targetMapId":"indigo_plateau_poke_center","targetX":6,"targetY":13},{"x":9,"y":13,"targetMapId":"victory_road","targetX":13,"targetY":5},{"x":10,"y":13,"targetMapId":"victory_road","targetX":13,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'indigo_plateau_poke_center',
  name: "Indigo Plateau Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__IndigoPlateauPokecenter1F.blk',
  blocksW: 9,
  blocksH: 7,
  connections: {},
  warps: [{"x":5,"y":13,"targetMapId":"route_23","targetX":9,"targetY":5},{"x":6,"y":13,"targetMapId":"route_23","targetX":10,"targetY":5},{"x":14,"y":3,"targetMapId":"wills_room","targetX":5,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'wills_room',
  name: "Will's Room",
  tileset: 'elite_four_room',
  blkFile: 'maps__WillsRoom.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":5,"y":17,"targetMapId":"indigo_plateau_poke_center","targetX":14,"targetY":3},{"x":4,"y":2,"targetMapId":"kogas_room","targetX":4,"targetY":17},{"x":5,"y":2,"targetMapId":"kogas_room","targetX":5,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'kogas_room',
  name: "Koga's Room",
  tileset: 'elite_four_room',
  blkFile: 'maps__KogasRoom.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"wills_room","targetX":4,"targetY":2},{"x":5,"y":17,"targetMapId":"wills_room","targetX":5,"targetY":2},{"x":4,"y":2,"targetMapId":"brunos_room","targetX":4,"targetY":17},{"x":5,"y":2,"targetMapId":"brunos_room","targetX":5,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'brunos_room',
  name: "Bruno's Room",
  tileset: 'elite_four_room',
  blkFile: 'maps__BrunosRoom.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"kogas_room","targetX":4,"targetY":2},{"x":5,"y":17,"targetMapId":"kogas_room","targetX":5,"targetY":2},{"x":4,"y":2,"targetMapId":"karens_room","targetX":4,"targetY":17},{"x":5,"y":2,"targetMapId":"karens_room","targetX":5,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'karens_room',
  name: "Karen's Room",
  tileset: 'elite_four_room',
  blkFile: 'maps__KarensRoom.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"brunos_room","targetX":4,"targetY":2},{"x":5,"y":17,"targetMapId":"brunos_room","targetX":5,"targetY":2},{"x":4,"y":2,"targetMapId":"lances_room","targetX":4,"targetY":23},{"x":5,"y":2,"targetMapId":"lances_room","targetX":5,"targetY":23}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lances_room',
  name: "Lance's Room",
  tileset: 'champions_room',
  blkFile: 'maps__LancesRoom.blk',
  blocksW: 5,
  blocksH: 12,
  connections: {},
  warps: [{"x":4,"y":23,"targetMapId":"karens_room","targetX":4,"targetY":2},{"x":5,"y":23,"targetMapId":"karens_room","targetX":5,"targetY":2},{"x":4,"y":1,"targetMapId":"hall_of_fame","targetX":4,"targetY":13},{"x":5,"y":1,"targetMapId":"hall_of_fame","targetX":5,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'hall_of_fame',
  name: "Hall of Fame",
  tileset: 'ice_path',
  blkFile: 'maps__HallOfFame.blk',
  blocksW: 5,
  blocksH: 7,
  connections: {},
  warps: [{"x":4,"y":13,"targetMapId":"lances_room","targetX":4,"targetY":1},{"x":5,"y":13,"targetMapId":"lances_room","targetX":5,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_28',
  name: "Route 28",
  tileset: 'kanto',
  blkFile: 'maps__Route28.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'vi',
  connections: {"WEST":{"mapId":"silver_cave_outside","offset":-18}},
  warps: [{"x":7,"y":3,"targetMapId":"route_28_steel_wing_house","targetX":2,"targetY":7},{"x":33,"y":5,"targetMapId":"victory_road_gate","targetX":1,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_28_steel_wing_house',
  name: "Steel Wing House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_28","targetX":7,"targetY":3},{"x":3,"y":7,"targetMapId":"route_28","targetX":7,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'silver_cave_outside',
  name: "Silver Cave",
  tileset: 'kanto',
  blkFile: 'maps__unused__BetaSilverCaveOutside.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'in',
  connections: {"EAST":{"mapId":"route_28","offset":18}},
  warps: [{"x":23,"y":19,"targetMapId":"silver_cave_poke_center","targetX":3,"targetY":7},{"x":18,"y":11,"targetMapId":"silver_cave_room_1","targetX":9,"targetY":33}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"tangela","minLevel":41,"maxLevel":41,"weight":30},{"speciesId":"ponyta","minLevel":42,"maxLevel":42,"weight":30},{"speciesId":"arbok","minLevel":42,"maxLevel":42,"weight":20},{"speciesId":"rapidash","minLevel":44,"maxLevel":44,"weight":10},{"speciesId":"doduo","minLevel":41,"maxLevel":41,"weight":5},{"speciesId":"dodrio","minLevel":43,"maxLevel":43,"weight":5}],
});

buildMapFromBlk({
  id: 'silver_cave_poke_center',
  name: "Silver Cave Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"silver_cave_outside","targetX":23,"targetY":19},{"x":4,"y":7,"targetMapId":"silver_cave_outside","targetX":23,"targetY":19}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'silver_cave_room_1',
  name: "Mt. Silver 1F",
  tileset: 'cave',
  blkFile: 'maps__SilverCaveRoom1.blk',
  blocksW: 10,
  blocksH: 18,
  connections: {},
  warps: [{"x":9,"y":33,"targetMapId":"silver_cave_outside","targetX":18,"targetY":11},{"x":15,"y":1,"targetMapId":"silver_cave_room_2","targetX":17,"targetY":31}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"graveler","minLevel":43,"maxLevel":43,"weight":30},{"speciesId":"ursaring","minLevel":44,"maxLevel":44,"weight":30},{"speciesId":"onix","minLevel":42,"maxLevel":42,"weight":20},{"speciesId":"magmar","minLevel":45,"maxLevel":45,"weight":10},{"speciesId":"golbat","minLevel":45,"maxLevel":45,"weight":5},{"speciesId":"larvitar","minLevel":15,"maxLevel":20,"weight":5}],
});

buildMapFromBlk({
  id: 'silver_cave_room_2',
  name: "Mt. Silver 2F",
  tileset: 'cave',
  blkFile: 'maps__SilverCaveRoom2.blk',
  blocksW: 15,
  blocksH: 18,
  connections: {},
  warps: [{"x":17,"y":31,"targetMapId":"silver_cave_room_1","targetX":15,"targetY":1},{"x":11,"y":5,"targetMapId":"silver_cave_room_3","targetX":9,"targetY":33},{"x":13,"y":21,"targetMapId":"silver_cave_item_rooms","targetX":13,"targetY":3},{"x":23,"y":3,"targetMapId":"silver_cave_item_rooms","targetX":7,"targetY":15}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"golbat","minLevel":48,"maxLevel":48,"weight":30},{"speciesId":"machoke","minLevel":48,"maxLevel":48,"weight":30},{"speciesId":"ursaring","minLevel":47,"maxLevel":47,"weight":20},{"speciesId":"parasect","minLevel":46,"maxLevel":48,"weight":15},{"speciesId":"larvitar","minLevel":15,"maxLevel":20,"weight":5}],
});

buildMapFromBlk({
  id: 'silver_cave_room_3',
  name: "Mt. Silver Summit",
  tileset: 'cave',
  blkFile: 'maps__SilverCaveRoom3.blk',
  blocksW: 10,
  blocksH: 18,
  connections: {},
  warps: [{"x":9,"y":33,"targetMapId":"silver_cave_room_2","targetX":11,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"golbat","minLevel":51,"maxLevel":51,"weight":30},{"speciesId":"onix","minLevel":48,"maxLevel":48,"weight":30},{"speciesId":"graveler","minLevel":48,"maxLevel":48,"weight":20},{"speciesId":"ursaring","minLevel":50,"maxLevel":50,"weight":10},{"speciesId":"larvitar","minLevel":15,"maxLevel":20,"weight":9},{"speciesId":"pupitar","minLevel":20,"maxLevel":20,"weight":1}],
});

buildMapFromBlk({
  id: 'silver_cave_item_rooms',
  name: "Mt. Silver Item Rooms",
  tileset: 'cave',
  blkFile: 'maps__SilverCaveItemRooms.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":13,"y":3,"targetMapId":"silver_cave_room_2","targetX":13,"targetY":21},{"x":7,"y":15,"targetMapId":"silver_cave_room_2","targetX":23,"targetY":3}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"golbat","minLevel":46,"maxLevel":50,"weight":80},{"speciesId":"parasect","minLevel":46,"maxLevel":52,"weight":20}],
});
// >>> phase12 specs end

// >>> phase13 specs start

// ==========================================
// PHASE 13: WESTERN & CENTRAL KANTO - PALLET, VIRIDIAN, PEWTER, CERULEAN, ROUTES 1-4, 24-25 (auto-generated by build-phase.cjs)
// ==========================================
buildMapFromBlk({
  id: 'pallet_town',
  name: "Pallet Town",
  tileset: 'kanto',
  blkFile: 'maps__PalletTown.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'pa',
  connections: {"NORTH":{"mapId":"route_1","offset":0}},
  warps: [{"x":5,"y":5,"targetMapId":"reds_house_1f","targetX":2,"targetY":7},{"x":13,"y":5,"targetMapId":"blues_house","targetX":2,"targetY":7},{"x":12,"y":11,"targetMapId":"oaks_lab","targetX":4,"targetY":11}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'reds_house_1f',
  name: "Red's House 1F",
  tileset: 'players_house',
  blkFile: 'maps__RedsHouse1F.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"pallet_town","targetX":5,"targetY":5},{"x":3,"y":7,"targetMapId":"pallet_town","targetX":5,"targetY":5},{"x":7,"y":0,"targetMapId":"reds_house_2f","targetX":7,"targetY":0}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'reds_house_2f',
  name: "Red's House 2F",
  tileset: 'players_house',
  blkFile: 'maps__RedsHouse2F.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":7,"y":0,"targetMapId":"reds_house_1f","targetX":7,"targetY":0}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'blues_house',
  name: "Blue's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"pallet_town","targetX":13,"targetY":5},{"x":3,"y":7,"targetMapId":"pallet_town","targetX":13,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'oaks_lab',
  name: "Prof. Oak's Lab",
  tileset: 'lab',
  blkFile: 'maps__OaksLab.blk',
  blocksW: 5,
  blocksH: 6,
  connections: {},
  warps: [{"x":4,"y":11,"targetMapId":"pallet_town","targetX":12,"targetY":11},{"x":5,"y":11,"targetMapId":"pallet_town","targetX":12,"targetY":11}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_1',
  name: "Route 1",
  tileset: 'kanto',
  blkFile: 'maps__Route1.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'pa',
  connections: {"NORTH":{"mapId":"viridian_city","offset":-20},"SOUTH":{"mapId":"pallet_town","offset":0}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"pidgey","minLevel":2,"maxLevel":4,"weight":45},{"speciesId":"rattata","minLevel":2,"maxLevel":2,"weight":30},{"speciesId":"sentret","minLevel":3,"maxLevel":3,"weight":20},{"speciesId":"furret","minLevel":6,"maxLevel":6,"weight":5}],
});

buildMapFromBlk({
  id: 'viridian_city',
  name: "Viridian City",
  tileset: 'kanto',
  blkFile: 'maps__ViridianCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'vi',
  connections: {"NORTH":{"mapId":"route_2","offset":10},"SOUTH":{"mapId":"route_1","offset":20},"WEST":{"mapId":"route_22","offset":8}},
  warps: [{"x":32,"y":7,"targetMapId":"viridian_gym","targetX":4,"targetY":17},{"x":21,"y":9,"targetMapId":"viridian_nickname_house","targetX":2,"targetY":7},{"x":23,"y":15,"targetMapId":"trainer_house_1f","targetX":2,"targetY":13},{"x":29,"y":19,"targetMapId":"viridian_mart","targetX":3,"targetY":7},{"x":23,"y":25,"targetMapId":"viridian_poke_center","targetX":3,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'viridian_gym',
  name: "Viridian Gym",
  tileset: 'train_station',
  blkFile: 'maps__ViridianGym.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"viridian_city","targetX":32,"targetY":7},{"x":5,"y":17,"targetMapId":"viridian_city","targetX":32,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'viridian_poke_center',
  name: "Viridian Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"viridian_city","targetX":23,"targetY":25},{"x":4,"y":7,"targetMapId":"viridian_city","targetX":23,"targetY":25}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'viridian_mart',
  name: "Viridian Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"viridian_city","targetX":29,"targetY":19},{"x":3,"y":7,"targetMapId":"viridian_city","targetX":29,"targetY":19}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'viridian_nickname_house',
  name: "Nickname House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"viridian_city","targetX":21,"targetY":9},{"x":3,"y":7,"targetMapId":"viridian_city","targetX":21,"targetY":9}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'trainer_house_1f',
  name: "Trainer House 1F",
  tileset: 'house',
  blkFile: 'maps__TrainerHouse1F.blk',
  blocksW: 5,
  blocksH: 7,
  connections: {},
  warps: [{"x":2,"y":13,"targetMapId":"viridian_city","targetX":23,"targetY":15},{"x":3,"y":13,"targetMapId":"viridian_city","targetX":23,"targetY":15},{"x":8,"y":2,"targetMapId":"trainer_house_b1f","targetX":9,"targetY":4}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'trainer_house_b1f',
  name: "Trainer House B1F",
  tileset: 'facility',
  blkFile: 'maps__TrainerHouseB1F.blk',
  blocksW: 5,
  blocksH: 8,
  connections: {},
  warps: [{"x":9,"y":4,"targetMapId":"trainer_house_1f","targetX":8,"targetY":2}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_2',
  name: "Route 2",
  tileset: 'kanto',
  blkFile: 'maps__Route2.blk',
  blocksW: 10,
  blocksH: 27,
  roofGroup: 'pe',
  connections: {"NORTH":{"mapId":"pewter_city","offset":-10},"SOUTH":{"mapId":"viridian_city","offset":-10}},
  warps: [{"x":15,"y":15,"targetMapId":"route_2_nugget_house","targetX":2,"targetY":7},{"x":15,"y":31,"targetMapId":"route_2_gate","targetX":4,"targetY":7},{"x":16,"y":27,"targetMapId":"route_2_gate","targetX":4,"targetY":0},{"x":17,"y":27,"targetMapId":"route_2_gate","targetX":5,"targetY":0}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"caterpie","minLevel":3,"maxLevel":3,"weight":30},{"speciesId":"pidgey","minLevel":3,"maxLevel":5,"weight":50},{"speciesId":"butterfree","minLevel":7,"maxLevel":7,"weight":10},{"speciesId":"pidgeotto","minLevel":7,"maxLevel":7,"weight":5},{"speciesId":"pikachu","minLevel":4,"maxLevel":4,"weight":5}],
});

buildMapFromBlk({
  id: 'route_2_gate',
  name: "Route 2 Gate",
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":4,"y":0,"targetMapId":"route_2","targetX":16,"targetY":27},{"x":5,"y":0,"targetMapId":"route_2","targetX":17,"targetY":27},{"x":4,"y":7,"targetMapId":"route_2","targetX":15,"targetY":31},{"x":5,"y":7,"targetMapId":"route_2","targetX":15,"targetY":31}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_2_nugget_house',
  name: "Route 2 House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_2","targetX":15,"targetY":15},{"x":3,"y":7,"targetMapId":"route_2","targetX":15,"targetY":15}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'pewter_city',
  name: "Pewter City",
  tileset: 'kanto',
  blkFile: 'maps__PewterCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'pe',
  connections: {"SOUTH":{"mapId":"route_2","offset":10},"EAST":{"mapId":"route_3","offset":10}},
  warps: [{"x":29,"y":13,"targetMapId":"pewter_nidoran_house","targetX":2,"targetY":7},{"x":16,"y":17,"targetMapId":"pewter_gym","targetX":4,"targetY":13},{"x":23,"y":17,"targetMapId":"pewter_mart","targetX":3,"targetY":7},{"x":13,"y":25,"targetMapId":"pewter_poke_center","targetX":3,"targetY":7},{"x":7,"y":29,"targetMapId":"pewter_snooze_house","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'pewter_gym',
  name: "Pewter Gym",
  tileset: 'tower',
  blkFile: 'maps__PewterGym.blk',
  blocksW: 5,
  blocksH: 7,
  connections: {},
  warps: [{"x":4,"y":13,"targetMapId":"pewter_city","targetX":16,"targetY":17},{"x":5,"y":13,"targetMapId":"pewter_city","targetX":16,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'pewter_poke_center',
  name: "Pewter Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"pewter_city","targetX":13,"targetY":25},{"x":4,"y":7,"targetMapId":"pewter_city","targetX":13,"targetY":25}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'pewter_mart',
  name: "Pewter Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"pewter_city","targetX":23,"targetY":17},{"x":3,"y":7,"targetMapId":"pewter_city","targetX":23,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'pewter_nidoran_house',
  name: "Nidoran House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"pewter_city","targetX":29,"targetY":13},{"x":3,"y":7,"targetMapId":"pewter_city","targetX":29,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'pewter_snooze_house',
  name: "Snooze House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"pewter_city","targetX":7,"targetY":29},{"x":3,"y":7,"targetMapId":"pewter_city","targetX":7,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_3',
  name: "Route 3",
  tileset: 'kanto',
  blkFile: 'maps__Route3.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'pe',
  connections: {"WEST":{"mapId":"pewter_city","offset":-10},"EAST":{"mapId":"route_4","offset":0}},
  warps: [{"x":52,"y":1,"targetMapId":"mount_moon","targetX":3,"targetY":3}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"spearow","minLevel":5,"maxLevel":5,"weight":30},{"speciesId":"rattata","minLevel":5,"maxLevel":5,"weight":30},{"speciesId":"ekans","minLevel":8,"maxLevel":8,"weight":20},{"speciesId":"raticate","minLevel":10,"maxLevel":10,"weight":10},{"speciesId":"arbok","minLevel":10,"maxLevel":10,"weight":5},{"speciesId":"sandshrew","minLevel":10,"maxLevel":10,"weight":5}],
});

buildMapFromBlk({
  id: 'mount_moon',
  name: "Mt. Moon",
  tileset: 'cave',
  blkFile: 'maps__MountMoon.blk',
  blocksW: 15,
  blocksH: 9,
  connections: {},
  warps: [{"x":3,"y":3,"targetMapId":"route_3","targetX":52,"targetY":1},{"x":15,"y":15,"targetMapId":"route_4","targetX":2,"targetY":5},{"x":13,"y":3,"targetMapId":"mount_moon","targetX":25,"targetY":3},{"x":15,"y":11,"targetMapId":"mount_moon","targetX":25,"targetY":13},{"x":25,"y":5,"targetMapId":"mount_moon_square","targetX":20,"targetY":5},{"x":25,"y":15,"targetMapId":"mount_moon_square","targetX":22,"targetY":11},{"x":25,"y":3,"targetMapId":"mount_moon","targetX":13,"targetY":3},{"x":25,"y":13,"targetMapId":"mount_moon","targetX":15,"targetY":11}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"zubat","minLevel":6,"maxLevel":6,"weight":30},{"speciesId":"geodude","minLevel":8,"maxLevel":10,"weight":35},{"speciesId":"sandshrew","minLevel":8,"maxLevel":8,"weight":20},{"speciesId":"paras","minLevel":12,"maxLevel":12,"weight":10},{"speciesId":"clefairy","minLevel":8,"maxLevel":8,"weight":5}],
});

buildMapFromBlk({
  id: 'mount_moon_square',
  name: "Mt. Moon Square",
  tileset: 'kanto',
  blkFile: 'maps__MountMoonSquare.blk',
  blocksW: 15,
  blocksH: 9,
  roofGroup: 'ol',
  connections: {},
  warps: [{"x":20,"y":5,"targetMapId":"mount_moon","targetX":25,"targetY":5},{"x":22,"y":11,"targetMapId":"mount_moon","targetX":25,"targetY":15},{"x":13,"y":7,"targetMapId":"mount_moon_gift_shop","targetX":3,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'mount_moon_gift_shop',
  name: "Mt. Moon Gift Shop",
  tileset: 'traditional_house',
  blkFile: 'maps__GiftShop.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"mount_moon_square","targetX":13,"targetY":7},{"x":4,"y":7,"targetMapId":"mount_moon_square","targetX":13,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_4',
  name: "Route 4",
  tileset: 'kanto',
  blkFile: 'maps__Route4.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'ce',
  connections: {"WEST":{"mapId":"route_3","offset":0},"EAST":{"mapId":"cerulean_city","offset":-10}},
  warps: [{"x":2,"y":5,"targetMapId":"mount_moon","targetX":15,"targetY":15}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"spearow","minLevel":5,"maxLevel":5,"weight":30},{"speciesId":"rattata","minLevel":5,"maxLevel":5,"weight":30},{"speciesId":"ekans","minLevel":8,"maxLevel":8,"weight":20},{"speciesId":"raticate","minLevel":10,"maxLevel":10,"weight":10},{"speciesId":"arbok","minLevel":10,"maxLevel":10,"weight":5},{"speciesId":"sandshrew","minLevel":10,"maxLevel":10,"weight":5}],
});

buildMapFromBlk({
  id: 'cerulean_city',
  name: "Cerulean City",
  tileset: 'kanto',
  blkFile: 'maps__CeruleanCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'ce',
  connections: {"NORTH":{"mapId":"route_24","offset":12},"WEST":{"mapId":"route_4","offset":10}},
  warps: [{"x":7,"y":15,"targetMapId":"cerulean_badge_house","targetX":2,"targetY":7},{"x":28,"y":17,"targetMapId":"cerulean_police_station","targetX":2,"targetY":7},{"x":13,"y":19,"targetMapId":"cerulean_trade_house","targetX":2,"targetY":7},{"x":19,"y":21,"targetMapId":"cerulean_poke_center","targetX":3,"targetY":7},{"x":30,"y":23,"targetMapId":"cerulean_gym","targetX":4,"targetY":15},{"x":25,"y":29,"targetMapId":"cerulean_mart","targetX":3,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cerulean_gym',
  name: "Cerulean Gym",
  tileset: 'port',
  blkFile: 'maps__CeruleanGym.blk',
  blocksW: 5,
  blocksH: 8,
  connections: {},
  warps: [{"x":4,"y":15,"targetMapId":"cerulean_city","targetX":30,"targetY":23},{"x":5,"y":15,"targetMapId":"cerulean_city","targetX":30,"targetY":23}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cerulean_poke_center',
  name: "Cerulean Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"cerulean_city","targetX":19,"targetY":21},{"x":4,"y":7,"targetMapId":"cerulean_city","targetX":19,"targetY":21}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cerulean_mart',
  name: "Cerulean Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"cerulean_city","targetX":25,"targetY":29},{"x":3,"y":7,"targetMapId":"cerulean_city","targetX":25,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cerulean_police_station',
  name: "Cerulean Police Station",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"cerulean_city","targetX":28,"targetY":17},{"x":3,"y":7,"targetMapId":"cerulean_city","targetX":28,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cerulean_trade_house',
  name: "Cerulean Trade House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"cerulean_city","targetX":13,"targetY":19},{"x":3,"y":7,"targetMapId":"cerulean_city","targetX":13,"targetY":19}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cerulean_badge_house',
  name: "Badge Speech House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"cerulean_city","targetX":7,"targetY":15},{"x":3,"y":7,"targetMapId":"cerulean_city","targetX":7,"targetY":15}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_24',
  name: "Route 24",
  tileset: 'kanto',
  blkFile: 'maps__Route24.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'ce',
  connections: {"NORTH":{"mapId":"route_25","offset":0},"SOUTH":{"mapId":"cerulean_city","offset":-12}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"caterpie","minLevel":8,"maxLevel":10,"weight":50},{"speciesId":"sunkern","minLevel":12,"maxLevel":12,"weight":30},{"speciesId":"abra","minLevel":12,"maxLevel":12,"weight":10},{"speciesId":"bellsprout","minLevel":10,"maxLevel":10,"weight":5},{"speciesId":"butterfree","minLevel":14,"maxLevel":14,"weight":5}],
});

buildMapFromBlk({
  id: 'route_25',
  name: "Route 25",
  tileset: 'kanto',
  blkFile: 'maps__Route25.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'ce',
  connections: {"SOUTH":{"mapId":"route_24","offset":0}},
  warps: [{"x":47,"y":5,"targetMapId":"bills_house","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"caterpie","minLevel":10,"maxLevel":10,"weight":30},{"speciesId":"pidgey","minLevel":10,"maxLevel":10,"weight":30},{"speciesId":"pidgeotto","minLevel":12,"maxLevel":12,"weight":20},{"speciesId":"metapod","minLevel":12,"maxLevel":12,"weight":10},{"speciesId":"bellsprout","minLevel":10,"maxLevel":10,"weight":5},{"speciesId":"butterfree","minLevel":14,"maxLevel":14,"weight":5}],
});

buildMapFromBlk({
  id: 'bills_house',
  name: "Bill's Sea Cottage",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_25","targetX":47,"targetY":5},{"x":3,"y":7,"targetMapId":"route_25","targetX":47,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});
// >>> phase13 specs end


// >>> phase14 specs start

// ==========================================
// PHASE 14: CENTRAL & EASTERN KANTO - VERMILION, CELADON, LAVENDER, DIGLETTS CAVE, ROCK TUNNEL, ROUTES 5-11 (auto-generated by build-phase.cjs)
// ==========================================
buildMapFromBlk({
  id: 'route_5',
  name: "Route 5",
  tileset: 'kanto',
  blkFile: 'maps__Route5.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'sa',
  connections: {"NORTH":{"mapId":"cerulean_city","offset":-10}},
  warps: [{"x":17,"y":15,"targetMapId":"route_5_underground_entrance","targetX":3,"targetY":7},{"x":8,"y":17,"targetMapId":"route_5_saffron_gate","targetX":4,"targetY":0},{"x":9,"y":17,"targetMapId":"route_5_saffron_gate","targetX":5,"targetY":0},{"x":10,"y":11,"targetMapId":"route_5_cleanse_tag_house","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"pidgey","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"snubbull","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"pidgeotto","minLevel":15,"maxLevel":15,"weight":20},{"speciesId":"abra","minLevel":12,"maxLevel":14,"weight":15},{"speciesId":"jigglypuff","minLevel":14,"maxLevel":14,"weight":5}],
});

buildMapFromBlk({
  id: 'route_5_underground_entrance',
  name: "Route 5 Underground",
  tileset: 'gate',
  blkFile: 'maps__UndergroundPathEntrance.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"route_5","targetX":17,"targetY":15},{"x":4,"y":7,"targetMapId":"route_5","targetX":17,"targetY":15},{"x":4,"y":3,"targetMapId":"underground_path","targetX":3,"targetY":2}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_5_saffron_gate',
  name: "Route 5 Saffron Gate",
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":4,"y":0,"targetMapId":"route_5","targetX":8,"targetY":17},{"x":5,"y":0,"targetMapId":"route_5","targetX":9,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_5_cleanse_tag_house',
  name: "Cleanse Tag House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_5","targetX":10,"targetY":11},{"x":3,"y":7,"targetMapId":"route_5","targetX":10,"targetY":11}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'underground_path',
  name: "Underground Path",
  tileset: 'underground',
  blkFile: 'maps__UndergroundPath.blk',
  blocksW: 3,
  blocksH: 14,
  connections: {},
  warps: [{"x":3,"y":2,"targetMapId":"route_5_underground_entrance","targetX":4,"targetY":3},{"x":3,"y":24,"targetMapId":"route_6_underground_entrance","targetX":4,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_6',
  name: "Route 6",
  tileset: 'kanto',
  blkFile: 'maps__Route6.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 've',
  connections: {"SOUTH":{"mapId":"vermilion_city","offset":-10}},
  warps: [{"x":17,"y":3,"targetMapId":"route_6_underground_entrance","targetX":3,"targetY":7},{"x":6,"y":1,"targetMapId":"route_6_saffron_gate","targetX":4,"targetY":7}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"rattata","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"snubbull","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"magnemite","minLevel":14,"maxLevel":14,"weight":20},{"speciesId":"raticate","minLevel":15,"maxLevel":15,"weight":10},{"speciesId":"jigglypuff","minLevel":12,"maxLevel":12,"weight":5},{"speciesId":"granbull","minLevel":15,"maxLevel":15,"weight":5}],
});

buildMapFromBlk({
  id: 'route_6_underground_entrance',
  name: "Route 6 Underground",
  tileset: 'gate',
  blkFile: 'maps__UndergroundPathEntrance.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"route_6","targetX":17,"targetY":3},{"x":4,"y":7,"targetMapId":"route_6","targetX":17,"targetY":3},{"x":4,"y":3,"targetMapId":"underground_path","targetX":3,"targetY":24}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_6_saffron_gate',
  name: "Route 6 Saffron Gate",
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":4,"y":7,"targetMapId":"route_6","targetX":6,"targetY":1},{"x":5,"y":7,"targetMapId":"route_6","targetX":6,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_city',
  name: "Vermilion City",
  tileset: 'kanto',
  blkFile: 'maps__VermilionCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 've',
  connections: {"NORTH":{"mapId":"route_6","offset":10},"EAST":{"mapId":"route_11","offset":0}},
  warps: [{"x":5,"y":5,"targetMapId":"vermilion_fishing_house","targetX":2,"targetY":7},{"x":9,"y":5,"targetMapId":"vermilion_poke_center","targetX":3,"targetY":7},{"x":13,"y":13,"targetMapId":"vermilion_magnet_train_house","targetX":2,"targetY":7},{"x":21,"y":13,"targetMapId":"vermilion_mart","targetX":3,"targetY":7},{"x":21,"y":17,"targetMapId":"vermilion_digletts_house","targetX":2,"targetY":7},{"x":10,"y":19,"targetMapId":"vermilion_gym","targetX":4,"targetY":17},{"x":19,"y":31,"targetMapId":"vermilion_port_passage","targetX":15,"targetY":0},{"x":20,"y":31,"targetMapId":"vermilion_port_passage","targetX":16,"targetY":0},{"x":34,"y":7,"targetMapId":"digletts_cave","targetX":3,"targetY":33}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_gym',
  name: "Vermilion Gym",
  tileset: 'game_corner',
  blkFile: 'maps__VermilionGym.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"vermilion_city","targetX":10,"targetY":19},{"x":5,"y":17,"targetMapId":"vermilion_city","targetX":10,"targetY":19}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_poke_center',
  name: "Vermilion Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"vermilion_city","targetX":9,"targetY":5},{"x":4,"y":7,"targetMapId":"vermilion_city","targetX":9,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_mart',
  name: "Vermilion Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"vermilion_city","targetX":21,"targetY":13},{"x":3,"y":7,"targetMapId":"vermilion_city","targetX":21,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_fishing_house',
  name: "Fishing House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"vermilion_city","targetX":5,"targetY":5},{"x":3,"y":7,"targetMapId":"vermilion_city","targetX":5,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_magnet_train_house',
  name: "Magnet Train House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"vermilion_city","targetX":13,"targetY":13},{"x":3,"y":7,"targetMapId":"vermilion_city","targetX":13,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_digletts_house',
  name: "Diglett's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"vermilion_city","targetX":21,"targetY":17},{"x":3,"y":7,"targetMapId":"vermilion_city","targetX":21,"targetY":17}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_port_passage',
  name: "Port Passage",
  tileset: 'underground',
  blkFile: 'maps__PortPassage.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":15,"y":0,"targetMapId":"vermilion_city","targetX":19,"targetY":31},{"x":16,"y":0,"targetMapId":"vermilion_city","targetX":20,"targetY":31},{"x":15,"y":4,"targetMapId":"vermilion_port_passage","targetX":3,"targetY":2},{"x":3,"y":2,"targetMapId":"vermilion_port_passage","targetX":15,"targetY":4},{"x":3,"y":14,"targetMapId":"vermilion_port","targetX":9,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'vermilion_port',
  name: "Vermilion Port",
  tileset: 'port',
  blkFile: 'maps__VermilionPort.blk',
  blocksW: 10,
  blocksH: 18,
  connections: {},
  warps: [{"x":9,"y":5,"targetMapId":"vermilion_port_passage","targetX":3,"targetY":14},{"x":7,"y":17,"targetMapId":"fast_ship_1f","targetX":25,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fast_ship_1f',
  name: "S.S. Aqua 1F",
  tileset: 'lighthouse',
  blkFile: 'maps__FastShip1F.blk',
  blocksW: 16,
  blocksH: 9,
  connections: {},
  warps: [{"x":27,"y":8,"targetMapId":"fast_ship_cabins_nnw_nne_ne","targetX":2,"targetY":0},{"x":23,"y":8,"targetMapId":"fast_ship_cabins_nnw_nne_ne","targetX":2,"targetY":12},{"x":19,"y":8,"targetMapId":"fast_ship_cabins_nnw_nne_ne","targetX":2,"targetY":24},{"x":15,"y":8,"targetMapId":"fast_ship_cabins_sw_ssw_nw","targetX":2,"targetY":0},{"x":15,"y":15,"targetMapId":"fast_ship_cabins_sw_ssw_nw","targetX":2,"targetY":19},{"x":19,"y":15,"targetMapId":"fast_ship_cabins_sw_ssw_nw","targetX":2,"targetY":31},{"x":23,"y":15,"targetMapId":"fast_ship_cabins_se_sse_captains_cabin","targetX":2,"targetY":7},{"x":27,"y":15,"targetMapId":"fast_ship_cabins_se_sse_captains_cabin","targetX":2,"targetY":19},{"x":3,"y":13,"targetMapId":"fast_ship_cabins_se_sse_captains_cabin","targetX":2,"targetY":33},{"x":6,"y":12,"targetMapId":"fast_ship_b1f","targetX":5,"targetY":11},{"x":30,"y":14,"targetMapId":"fast_ship_b1f","targetX":31,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fast_ship_cabins_nnw_nne_ne',
  name: "S.S. Aqua Cabins North",
  tileset: 'lighthouse',
  blkFile: 'maps__FastShipCabins_NNW_NNE_NE.blk',
  blocksW: 4,
  blocksH: 16,
  connections: {},
  warps: [{"x":2,"y":0,"targetMapId":"fast_ship_1f","targetX":27,"targetY":8},{"x":2,"y":12,"targetMapId":"fast_ship_1f","targetX":23,"targetY":8},{"x":2,"y":24,"targetMapId":"fast_ship_1f","targetX":19,"targetY":8}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fast_ship_cabins_sw_ssw_nw',
  name: "S.S. Aqua Cabins West",
  tileset: 'lighthouse',
  blkFile: 'maps__FastShipCabins_SW_SSW_NW.blk',
  blocksW: 4,
  blocksH: 16,
  connections: {},
  warps: [{"x":2,"y":0,"targetMapId":"fast_ship_1f","targetX":15,"targetY":8},{"x":2,"y":19,"targetMapId":"fast_ship_1f","targetX":15,"targetY":15},{"x":3,"y":19,"targetMapId":"fast_ship_1f","targetX":15,"targetY":15},{"x":2,"y":31,"targetMapId":"fast_ship_1f","targetX":19,"targetY":15},{"x":3,"y":31,"targetMapId":"fast_ship_1f","targetX":19,"targetY":15}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fast_ship_cabins_se_sse_captains_cabin',
  name: "Captain's Cabin",
  tileset: 'lighthouse',
  blkFile: 'maps__FastShipCabins_SE_SSE_CaptainsCabin.blk',
  blocksW: 5,
  blocksH: 17,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"fast_ship_1f","targetX":23,"targetY":15},{"x":3,"y":7,"targetMapId":"fast_ship_1f","targetX":23,"targetY":15},{"x":2,"y":19,"targetMapId":"fast_ship_1f","targetX":27,"targetY":15},{"x":3,"y":19,"targetMapId":"fast_ship_1f","targetX":27,"targetY":15},{"x":2,"y":33,"targetMapId":"fast_ship_1f","targetX":3,"targetY":13},{"x":3,"y":33,"targetMapId":"fast_ship_1f","targetX":3,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fast_ship_b1f',
  name: "S.S. Aqua B1F",
  tileset: 'lighthouse',
  blkFile: 'maps__FastShipB1F.blk',
  blocksW: 16,
  blocksH: 8,
  connections: {},
  warps: [{"x":5,"y":11,"targetMapId":"fast_ship_1f","targetX":6,"targetY":12},{"x":31,"y":13,"targetMapId":"fast_ship_1f","targetX":30,"targetY":14}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'olivine_port_passage',
  name: "Olivine Port Passage",
  tileset: 'underground',
  blkFile: 'maps__PortPassage.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":15,"y":0,"targetMapId":"olivine_city","targetX":19,"targetY":27},{"x":16,"y":0,"targetMapId":"olivine_city","targetX":20,"targetY":27},{"x":15,"y":4,"targetMapId":"olivine_port_passage","targetX":3,"targetY":2},{"x":3,"y":2,"targetMapId":"olivine_port_passage","targetX":15,"targetY":4},{"x":3,"y":14,"targetMapId":"olivine_port","targetX":11,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'olivine_port',
  name: "Olivine Port",
  tileset: 'port',
  blkFile: 'maps__OlivinePort.blk',
  blocksW: 10,
  blocksH: 18,
  connections: {},
  warps: [{"x":11,"y":7,"targetMapId":"olivine_port_passage","targetX":3,"targetY":14},{"x":7,"y":23,"targetMapId":"fast_ship_1f","targetX":25,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_11',
  name: "Route 11",
  tileset: 'kanto',
  blkFile: 'maps__Route11.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 've',
  connections: {"WEST":{"mapId":"vermilion_city","offset":0}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"hoppip","minLevel":14,"maxLevel":16,"weight":35},{"speciesId":"raticate","minLevel":13,"maxLevel":13,"weight":30},{"speciesId":"magnemite","minLevel":15,"maxLevel":15,"weight":20},{"speciesId":"pidgeotto","minLevel":16,"maxLevel":16,"weight":10},{"speciesId":"rattata","minLevel":16,"maxLevel":16,"weight":5}],
});

buildMapFromBlk({
  id: 'digletts_cave',
  name: "Diglett's Cave",
  tileset: 'cave',
  blkFile: 'maps__DiglettsCave.blk',
  blocksW: 10,
  blocksH: 18,
  connections: {},
  warps: [{"x":3,"y":33,"targetMapId":"vermilion_city","targetX":34,"targetY":7},{"x":5,"y":31,"targetMapId":"digletts_cave","targetX":17,"targetY":33},{"x":15,"y":5,"targetMapId":"route_2","targetX":12,"targetY":7},{"x":17,"y":3,"targetMapId":"digletts_cave","targetX":3,"targetY":3},{"x":17,"y":33,"targetMapId":"digletts_cave","targetX":5,"targetY":31},{"x":3,"y":3,"targetMapId":"digletts_cave","targetX":17,"targetY":3}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"diglett","minLevel":2,"maxLevel":16,"weight":90},{"speciesId":"dugtrio","minLevel":16,"maxLevel":16,"weight":10}],
});

buildMapFromBlk({
  id: 'route_9',
  name: "Route 9",
  tileset: 'kanto',
  blkFile: 'maps__Route9.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'ce',
  connections: {"SOUTH":{"mapId":"route_10_north","offset":40},"WEST":{"mapId":"cerulean_city","offset":-18}},
  warps: [{"x":48,"y":15,"targetMapId":"rock_tunnel_1f","targetX":15,"targetY":3}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"rattata","minLevel":15,"maxLevel":15,"weight":30},{"speciesId":"spearow","minLevel":15,"maxLevel":15,"weight":30},{"speciesId":"raticate","minLevel":15,"maxLevel":15,"weight":20},{"speciesId":"fearow","minLevel":15,"maxLevel":15,"weight":15},{"speciesId":"marowak","minLevel":18,"maxLevel":18,"weight":5}],
});

buildMapFromBlk({
  id: 'route_10_north',
  name: "Route 10 North",
  tileset: 'kanto',
  blkFile: 'maps__Route10North.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'ce',
  connections: {"NORTH":{"mapId":"route_9","offset":-40},"SOUTH":{"mapId":"route_10_south","offset":0}},
  warps: [{"x":11,"y":1,"targetMapId":"route_10_poke_center","targetX":3,"targetY":7}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"spearow","minLevel":15,"maxLevel":15,"weight":30},{"speciesId":"voltorb","minLevel":17,"maxLevel":17,"weight":30},{"speciesId":"raticate","minLevel":15,"maxLevel":15,"weight":20},{"speciesId":"fearow","minLevel":15,"maxLevel":15,"weight":10},{"speciesId":"marowak","minLevel":15,"maxLevel":15,"weight":5},{"speciesId":"electabuzz","minLevel":18,"maxLevel":18,"weight":5}],
});

buildMapFromBlk({
  id: 'route_10_south',
  name: "Route 10 South",
  tileset: 'kanto',
  blkFile: 'maps__Route10South.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'la',
  connections: {"NORTH":{"mapId":"route_10_north","offset":0},"SOUTH":{"mapId":"lavender_town","offset":0}},
  warps: [{"x":6,"y":1,"targetMapId":"rock_tunnel_1f","targetX":11,"targetY":25}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_10_poke_center',
  name: "Route 10 Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"route_10_north","targetX":11,"targetY":1},{"x":4,"y":7,"targetMapId":"route_10_north","targetX":11,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'rock_tunnel_1f',
  name: "Rock Tunnel 1F",
  tileset: 'cave',
  blkFile: 'maps__RockTunnel1F.blk',
  blocksW: 15,
  blocksH: 18,
  connections: {},
  warps: [{"x":15,"y":3,"targetMapId":"route_9","targetX":48,"targetY":15},{"x":11,"y":25,"targetMapId":"route_10_south","targetX":6,"targetY":1},{"x":5,"y":3,"targetMapId":"rock_tunnel_b1f","targetX":23,"targetY":3},{"x":15,"y":9,"targetMapId":"rock_tunnel_b1f","targetX":17,"targetY":9},{"x":27,"y":3,"targetMapId":"rock_tunnel_b1f","targetX":25,"targetY":23},{"x":27,"y":13,"targetMapId":"rock_tunnel_b1f","targetX":3,"targetY":3}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"cubone","minLevel":10,"maxLevel":10,"weight":30},{"speciesId":"geodude","minLevel":11,"maxLevel":11,"weight":30},{"speciesId":"machop","minLevel":12,"maxLevel":12,"weight":20},{"speciesId":"zubat","minLevel":12,"maxLevel":12,"weight":10},{"speciesId":"machoke","minLevel":15,"maxLevel":15,"weight":5},{"speciesId":"marowak","minLevel":12,"maxLevel":12,"weight":5}],
});

buildMapFromBlk({
  id: 'rock_tunnel_b1f',
  name: "Rock Tunnel B1F",
  tileset: 'cave',
  blkFile: 'maps__RockTunnelB1F.blk',
  blocksW: 15,
  blocksH: 18,
  connections: {},
  warps: [{"x":3,"y":3,"targetMapId":"rock_tunnel_1f","targetX":27,"targetY":13},{"x":17,"y":9,"targetMapId":"rock_tunnel_1f","targetX":15,"targetY":9},{"x":23,"y":3,"targetMapId":"rock_tunnel_1f","targetX":5,"targetY":3},{"x":25,"y":23,"targetMapId":"rock_tunnel_1f","targetX":27,"targetY":3}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"cubone","minLevel":12,"maxLevel":12,"weight":30},{"speciesId":"geodude","minLevel":14,"maxLevel":14,"weight":30},{"speciesId":"onix","minLevel":16,"maxLevel":16,"weight":20},{"speciesId":"zubat","minLevel":12,"maxLevel":12,"weight":10},{"speciesId":"marowak","minLevel":15,"maxLevel":15,"weight":5},{"speciesId":"kangaskhan","minLevel":15,"maxLevel":15,"weight":5}],
});

buildMapFromBlk({
  id: 'lavender_town',
  name: "Lavender Town",
  tileset: 'kanto',
  blkFile: 'maps__LavenderTown.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'la',
  connections: {"NORTH":{"mapId":"route_10_south","offset":0},"WEST":{"mapId":"route_8","offset":0}},
  warps: [{"x":5,"y":5,"targetMapId":"lavender_poke_center","targetX":3,"targetY":7},{"x":3,"y":13,"targetMapId":"lavender_speech_house","targetX":2,"targetY":7},{"x":7,"y":13,"targetMapId":"lavender_name_rater","targetX":2,"targetY":7},{"x":1,"y":5,"targetMapId":"lavender_mart","targetX":3,"targetY":7},{"x":13,"y":11,"targetMapId":"soul_house","targetX":4,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lavender_poke_center',
  name: "Lavender Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"lavender_town","targetX":5,"targetY":5},{"x":4,"y":7,"targetMapId":"lavender_town","targetX":5,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lavender_mart',
  name: "Lavender Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"lavender_town","targetX":1,"targetY":5},{"x":3,"y":7,"targetMapId":"lavender_town","targetX":1,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lavender_speech_house',
  name: "Lavender Speech House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"lavender_town","targetX":3,"targetY":13},{"x":3,"y":7,"targetMapId":"lavender_town","targetX":3,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'lavender_name_rater',
  name: "Name Rater House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"lavender_town","targetX":7,"targetY":13},{"x":3,"y":7,"targetMapId":"lavender_town","targetX":7,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'soul_house',
  name: "Soul House",
  tileset: 'house',
  blkFile: 'maps__SoulHouse.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":4,"y":7,"targetMapId":"lavender_town","targetX":13,"targetY":11},{"x":5,"y":7,"targetMapId":"lavender_town","targetX":13,"targetY":11}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_8',
  name: "Route 8",
  tileset: 'kanto',
  blkFile: 'maps__Route8.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'la',
  connections: {"EAST":{"mapId":"lavender_town","offset":0}},
  warps: [{"x":4,"y":4,"targetMapId":"route_8_saffron_gate","targetX":9,"targetY":4},{"x":4,"y":5,"targetMapId":"route_8_saffron_gate","targetX":9,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"snubbull","minLevel":17,"maxLevel":17,"weight":30},{"speciesId":"pidgeotto","minLevel":19,"maxLevel":19,"weight":30},{"speciesId":"abra","minLevel":16,"maxLevel":16,"weight":20},{"speciesId":"growlithe","minLevel":17,"maxLevel":17,"weight":10},{"speciesId":"jigglypuff","minLevel":16,"maxLevel":16,"weight":5},{"speciesId":"kadabra","minLevel":18,"maxLevel":18,"weight":5}],
});

buildMapFromBlk({
  id: 'route_8_saffron_gate',
  name: "Route 8 Saffron Gate",
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":9,"y":4,"targetMapId":"route_8","targetX":4,"targetY":4},{"x":9,"y":5,"targetMapId":"route_8","targetX":4,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_7',
  name: "Route 7",
  tileset: 'kanto',
  blkFile: 'maps__Route7.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'cd',
  connections: {"WEST":{"mapId":"celadon_city","offset":-10}},
  warps: [{"x":15,"y":6,"targetMapId":"route_7_saffron_gate","targetX":0,"targetY":4},{"x":15,"y":7,"targetMapId":"route_7_saffron_gate","targetX":0,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"rattata","minLevel":17,"maxLevel":17,"weight":30},{"speciesId":"spearow","minLevel":17,"maxLevel":17,"weight":30},{"speciesId":"snubbull","minLevel":18,"maxLevel":18,"weight":20},{"speciesId":"raticate","minLevel":18,"maxLevel":18,"weight":10},{"speciesId":"jigglypuff","minLevel":18,"maxLevel":18,"weight":5},{"speciesId":"abra","minLevel":16,"maxLevel":16,"weight":5}],
});

buildMapFromBlk({
  id: 'route_7_saffron_gate',
  name: "Route 7 Saffron Gate",
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":0,"y":4,"targetMapId":"route_7","targetX":15,"targetY":6},{"x":0,"y":5,"targetMapId":"route_7","targetX":15,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_city',
  name: "Celadon City",
  tileset: 'kanto',
  blkFile: 'maps__CeladonCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'cd',
  connections: {"EAST":{"mapId":"route_7","offset":10}},
  warps: [{"x":4,"y":9,"targetMapId":"celadon_dept_store_1f","targetX":7,"targetY":7},{"x":16,"y":9,"targetMapId":"celadon_mansion_1f","targetX":6,"targetY":9},{"x":16,"y":3,"targetMapId":"celadon_mansion_1f","targetX":3,"targetY":0},{"x":17,"y":3,"targetMapId":"celadon_mansion_1f","targetX":3,"targetY":0},{"x":29,"y":9,"targetMapId":"celadon_poke_center","targetX":3,"targetY":7},{"x":18,"y":19,"targetMapId":"celadon_game_corner","targetX":14,"targetY":13},{"x":23,"y":19,"targetMapId":"celadon_game_corner_prize_room","targetX":2,"targetY":5},{"x":10,"y":29,"targetMapId":"celadon_gym","targetX":4,"targetY":17},{"x":25,"y":29,"targetMapId":"celadon_cafe","targetX":6,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_gym',
  name: "Celadon Gym",
  tileset: 'train_station',
  blkFile: 'maps__CeladonGym.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"celadon_city","targetX":10,"targetY":29},{"x":5,"y":17,"targetMapId":"celadon_city","targetX":10,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_poke_center',
  name: "Celadon Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"celadon_city","targetX":29,"targetY":9},{"x":4,"y":7,"targetMapId":"celadon_city","targetX":29,"targetY":9}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_dept_store_1f',
  name: "Celadon Dept Store 1F",
  tileset: 'mart',
  blkFile: 'maps__DeptStore1F.blk',
  blocksW: 8,
  blocksH: 4,
  connections: {},
  warps: [{"x":7,"y":7,"targetMapId":"celadon_city","targetX":4,"targetY":9},{"x":8,"y":7,"targetMapId":"celadon_city","targetX":4,"targetY":9},{"x":15,"y":0,"targetMapId":"celadon_dept_store_2f","targetX":15,"targetY":0},{"x":2,"y":0,"targetMapId":"celadon_dept_store_elevator","targetX":1,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_dept_store_2f',
  name: "Celadon Dept Store 2F",
  tileset: 'mart',
  blkFile: 'maps__DeptStore2F.blk',
  blocksW: 8,
  blocksH: 4,
  connections: {},
  warps: [{"x":12,"y":0,"targetMapId":"celadon_dept_store_3f","targetX":12,"targetY":0},{"x":15,"y":0,"targetMapId":"celadon_dept_store_1f","targetX":15,"targetY":0},{"x":2,"y":0,"targetMapId":"celadon_dept_store_elevator","targetX":1,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_dept_store_3f',
  name: "Celadon Dept Store 3F",
  tileset: 'mart',
  blkFile: 'maps__DeptStore3F.blk',
  blocksW: 8,
  blocksH: 4,
  connections: {},
  warps: [{"x":12,"y":0,"targetMapId":"celadon_dept_store_2f","targetX":12,"targetY":0},{"x":15,"y":0,"targetMapId":"celadon_dept_store_4f","targetX":15,"targetY":0},{"x":2,"y":0,"targetMapId":"celadon_dept_store_elevator","targetX":1,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_dept_store_4f',
  name: "Celadon Dept Store 4F",
  tileset: 'mart',
  blkFile: 'maps__DeptStore4F.blk',
  blocksW: 8,
  blocksH: 4,
  connections: {},
  warps: [{"x":12,"y":0,"targetMapId":"celadon_dept_store_5f","targetX":12,"targetY":0},{"x":15,"y":0,"targetMapId":"celadon_dept_store_3f","targetX":15,"targetY":0},{"x":2,"y":0,"targetMapId":"celadon_dept_store_elevator","targetX":1,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_dept_store_5f',
  name: "Celadon Dept Store 5F",
  tileset: 'mart',
  blkFile: 'maps__DeptStore5F.blk',
  blocksW: 8,
  blocksH: 4,
  connections: {},
  warps: [{"x":12,"y":0,"targetMapId":"celadon_dept_store_4f","targetX":12,"targetY":0},{"x":15,"y":0,"targetMapId":"celadon_dept_store_6f","targetX":15,"targetY":0},{"x":2,"y":0,"targetMapId":"celadon_dept_store_elevator","targetX":1,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_dept_store_6f',
  name: "Celadon Dept Store 6F",
  tileset: 'mart',
  blkFile: 'maps__DeptStore6F.blk',
  blocksW: 8,
  blocksH: 4,
  connections: {},
  warps: [{"x":15,"y":0,"targetMapId":"celadon_dept_store_5f","targetX":15,"targetY":0},{"x":2,"y":0,"targetMapId":"celadon_dept_store_elevator","targetX":1,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_dept_store_elevator',
  name: "Celadon Elevator",
  tileset: 'mart',
  blkFile: 'maps__DeptStoreElevator.blk',
  blocksW: 2,
  blocksH: 2,
  connections: {},
  warps: [],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_mansion_1f',
  name: "Celadon Mansion 1F",
  tileset: 'mansion',
  blkFile: 'maps__CeladonMansion1F.blk',
  blocksW: 4,
  blocksH: 5,
  connections: {},
  warps: [{"x":6,"y":9,"targetMapId":"celadon_city","targetX":16,"targetY":9},{"x":7,"y":9,"targetMapId":"celadon_city","targetX":16,"targetY":9},{"x":3,"y":0,"targetMapId":"celadon_city","targetX":16,"targetY":3},{"x":0,"y":0,"targetMapId":"celadon_mansion_2f","targetX":0,"targetY":0},{"x":7,"y":0,"targetMapId":"celadon_mansion_2f","targetX":7,"targetY":0}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_mansion_2f',
  name: "Celadon Mansion 2F",
  tileset: 'mansion',
  blkFile: 'maps__CeladonMansion2F.blk',
  blocksW: 4,
  blocksH: 5,
  connections: {},
  warps: [{"x":0,"y":0,"targetMapId":"celadon_mansion_1f","targetX":0,"targetY":0},{"x":1,"y":0,"targetMapId":"celadon_mansion_3f","targetX":1,"targetY":0},{"x":6,"y":0,"targetMapId":"celadon_mansion_3f","targetX":6,"targetY":0},{"x":7,"y":0,"targetMapId":"celadon_mansion_1f","targetX":7,"targetY":0}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_mansion_3f',
  name: "Celadon Mansion 3F",
  tileset: 'mansion',
  blkFile: 'maps__CeladonMansion3F.blk',
  blocksW: 4,
  blocksH: 5,
  connections: {},
  warps: [{"x":0,"y":0,"targetMapId":"celadon_mansion_roof","targetX":1,"targetY":1},{"x":1,"y":0,"targetMapId":"celadon_mansion_2f","targetX":1,"targetY":0},{"x":6,"y":0,"targetMapId":"celadon_mansion_2f","targetX":6,"targetY":0},{"x":7,"y":0,"targetMapId":"celadon_mansion_roof","targetX":6,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_mansion_roof',
  name: "Celadon Mansion Roof",
  tileset: 'mansion',
  blkFile: 'maps__CeladonMansionRoof.blk',
  blocksW: 4,
  blocksH: 5,
  connections: {},
  warps: [{"x":1,"y":1,"targetMapId":"celadon_mansion_3f","targetX":0,"targetY":0},{"x":6,"y":1,"targetMapId":"celadon_mansion_3f","targetX":7,"targetY":0},{"x":2,"y":5,"targetMapId":"celadon_mansion_roof_house","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_mansion_roof_house',
  name: "Mansion Penthouse",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"celadon_mansion_roof","targetX":2,"targetY":5},{"x":3,"y":7,"targetMapId":"celadon_mansion_roof","targetX":2,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_game_corner',
  name: "Celadon Game Corner",
  tileset: 'game_corner',
  blkFile: 'maps__CeladonGameCorner.blk',
  blocksW: 10,
  blocksH: 7,
  connections: {},
  warps: [{"x":14,"y":13,"targetMapId":"celadon_city","targetX":18,"targetY":19},{"x":15,"y":13,"targetMapId":"celadon_city","targetX":18,"targetY":19}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_game_corner_prize_room',
  name: "Game Corner Prize Room",
  tileset: 'game_corner',
  blkFile: 'maps__CeladonGameCornerPrizeRoom.blk',
  blocksW: 3,
  blocksH: 3,
  connections: {},
  warps: [{"x":2,"y":5,"targetMapId":"celadon_city","targetX":23,"targetY":19},{"x":3,"y":5,"targetMapId":"celadon_city","targetX":23,"targetY":19}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'celadon_cafe',
  name: "Celadon Café",
  tileset: 'game_corner',
  blkFile: 'maps__CeladonCafe.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":6,"y":7,"targetMapId":"celadon_city","targetX":25,"targetY":29},{"x":7,"y":7,"targetMapId":"celadon_city","targetX":25,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});
// >>> phase14 specs end




// >>> phase15 specs start

// ==========================================
// PHASE 15: SOUTHERN KANTO, SAFFRON & SEA ROUTES - SAFFRON, FUCHSIA, CINNABAR, CYCLING ROAD, SEAFOAM, ROUTES 12-21 (auto-generated by build-phase.cjs)
// ==========================================
buildMapFromBlk({
  id: 'saffron_city',
  name: "Saffron City",
  tileset: 'kanto',
  blkFile: 'maps__SaffronCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'sa',
  connections: {"NORTH":{"mapId":"route_5","offset":10},"SOUTH":{"mapId":"route_6","offset":10},"WEST":{"mapId":"route_7","offset":18},"EAST":{"mapId":"route_8","offset":18}},
  warps: [{"x":26,"y":3,"targetMapId":"fighting_dojo","targetX":4,"targetY":11},{"x":34,"y":3,"targetMapId":"saffron_gym","targetX":8,"targetY":17},{"x":25,"y":11,"targetMapId":"saffron_mart","targetX":3,"targetY":7},{"x":9,"y":29,"targetMapId":"saffron_poke_center","targetX":3,"targetY":7},{"x":27,"y":29,"targetMapId":"mr_psychics_house","targetX":2,"targetY":7},{"x":8,"y":3,"targetMapId":"saffron_magnet_train_station","targetX":9,"targetY":17},{"x":18,"y":21,"targetMapId":"silph_co_1f","targetX":2,"targetY":7},{"x":9,"y":11,"targetMapId":"copycats_house_1f","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'saffron_gym',
  name: "Saffron Gym",
  tileset: 'underground',
  blkFile: 'maps__SaffronGym.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":8,"y":17,"targetMapId":"saffron_city","targetX":34,"targetY":3},{"x":9,"y":17,"targetMapId":"saffron_city","targetX":34,"targetY":3},{"x":11,"y":15,"targetMapId":"saffron_gym","targetX":19,"targetY":17},{"x":19,"y":15,"targetMapId":"saffron_gym","targetX":19,"targetY":9},{"x":19,"y":11,"targetMapId":"saffron_gym","targetX":1,"targetY":9},{"x":1,"y":11,"targetMapId":"saffron_gym","targetX":5,"targetY":5},{"x":5,"y":3,"targetMapId":"saffron_gym","targetX":11,"targetY":3},{"x":11,"y":5,"targetMapId":"saffron_gym","targetX":1,"targetY":17},{"x":1,"y":15,"targetMapId":"saffron_gym","targetX":19,"targetY":5},{"x":19,"y":3,"targetMapId":"saffron_gym","targetX":15,"targetY":15},{"x":15,"y":17,"targetMapId":"saffron_gym","targetX":5,"targetY":15},{"x":5,"y":17,"targetMapId":"saffron_gym","targetX":5,"targetY":11},{"x":5,"y":9,"targetMapId":"saffron_gym","targetX":9,"targetY":5},{"x":9,"y":3,"targetMapId":"saffron_gym","targetX":15,"targetY":11},{"x":15,"y":9,"targetMapId":"saffron_gym","targetX":15,"targetY":3},{"x":15,"y":5,"targetMapId":"saffron_gym","targetX":1,"targetY":3},{"x":1,"y":5,"targetMapId":"saffron_gym","targetX":11,"targetY":9},{"x":19,"y":17,"targetMapId":"saffron_gym","targetX":11,"targetY":15},{"x":19,"y":9,"targetMapId":"saffron_gym","targetX":19,"targetY":15},{"x":1,"y":9,"targetMapId":"saffron_gym","targetX":19,"targetY":11},{"x":5,"y":5,"targetMapId":"saffron_gym","targetX":1,"targetY":11},{"x":11,"y":3,"targetMapId":"saffron_gym","targetX":5,"targetY":3},{"x":1,"y":17,"targetMapId":"saffron_gym","targetX":11,"targetY":5},{"x":19,"y":5,"targetMapId":"saffron_gym","targetX":1,"targetY":15},{"x":15,"y":15,"targetMapId":"saffron_gym","targetX":19,"targetY":3},{"x":5,"y":15,"targetMapId":"saffron_gym","targetX":15,"targetY":17},{"x":5,"y":11,"targetMapId":"saffron_gym","targetX":5,"targetY":17},{"x":9,"y":5,"targetMapId":"saffron_gym","targetX":5,"targetY":9},{"x":15,"y":11,"targetMapId":"saffron_gym","targetX":9,"targetY":3},{"x":15,"y":3,"targetMapId":"saffron_gym","targetX":15,"targetY":9},{"x":1,"y":3,"targetMapId":"saffron_gym","targetX":15,"targetY":5},{"x":11,"y":9,"targetMapId":"saffron_gym","targetX":1,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fighting_dojo',
  name: "Fighting Dojo",
  tileset: 'train_station',
  blkFile: 'maps__FightingDojo.blk',
  blocksW: 5,
  blocksH: 6,
  connections: {},
  warps: [{"x":4,"y":11,"targetMapId":"saffron_city","targetX":26,"targetY":3},{"x":5,"y":11,"targetMapId":"saffron_city","targetX":26,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'silph_co_1f',
  name: "Silph Co. 1F",
  tileset: 'facility',
  blkFile: 'maps__SilphCo1F.blk',
  blocksW: 8,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"saffron_city","targetX":18,"targetY":21},{"x":3,"y":7,"targetMapId":"saffron_city","targetX":18,"targetY":21}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'mr_psychics_house',
  name: "Mr. Psychic's House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"saffron_city","targetX":27,"targetY":29},{"x":3,"y":7,"targetMapId":"saffron_city","targetX":27,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'saffron_magnet_train_station',
  name: "Saffron Train Station",
  tileset: 'train_station',
  blkFile: 'maps__SaffronMagnetTrainStation.blk',
  blocksW: 10,
  blocksH: 9,
  connections: {},
  warps: [{"x":8,"y":17,"targetMapId":"saffron_city","targetX":8,"targetY":3},{"x":9,"y":17,"targetMapId":"saffron_city","targetX":8,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'saffron_poke_center',
  name: "Saffron Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"saffron_city","targetX":9,"targetY":29},{"x":4,"y":7,"targetMapId":"saffron_city","targetX":9,"targetY":29}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'saffron_mart',
  name: "Saffron Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"saffron_city","targetX":25,"targetY":11},{"x":3,"y":7,"targetMapId":"saffron_city","targetX":25,"targetY":11}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'copycats_house_1f',
  name: "Copycat's House 1F",
  tileset: 'players_house',
  blkFile: 'maps__CopycatsHouse1F.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"saffron_city","targetX":9,"targetY":11},{"x":3,"y":7,"targetMapId":"saffron_city","targetX":9,"targetY":11},{"x":2,"y":0,"targetMapId":"copycats_house_2f","targetX":3,"targetY":0}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'copycats_house_2f',
  name: "Copycat's House 2F",
  tileset: 'players_house',
  blkFile: 'maps__CopycatsHouse2F.blk',
  blocksW: 5,
  blocksH: 3,
  connections: {},
  warps: [{"x":3,"y":0,"targetMapId":"copycats_house_1f","targetX":2,"targetY":0}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_16',
  name: "Route 16",
  tileset: 'kanto',
  blkFile: 'maps__Route16.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'cd',
  connections: {"SOUTH":{"mapId":"route_17","offset":0},"EAST":{"mapId":"celadon_city","offset":-18}},
  warps: [{"x":3,"y":1,"targetMapId":"route_16_fuchsia_speech_house","targetX":2,"targetY":7},{"x":14,"y":6,"targetMapId":"route_16_gate","targetX":9,"targetY":4},{"x":14,"y":7,"targetMapId":"route_16_gate","targetX":9,"targetY":5},{"x":9,"y":6,"targetMapId":"route_16_gate","targetX":0,"targetY":4},{"x":9,"y":7,"targetMapId":"route_16_gate","targetX":0,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"grimer","minLevel":26,"maxLevel":28,"weight":50},{"speciesId":"fearow","minLevel":27,"maxLevel":29,"weight":40},{"speciesId":"slugma","minLevel":29,"maxLevel":29,"weight":5},{"speciesId":"muk","minLevel":30,"maxLevel":30,"weight":5}],
});

buildMapFromBlk({
  id: 'route_16_gate',
  name: "Route 16 Gate",
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":0,"y":4,"targetMapId":"route_16","targetX":9,"targetY":6},{"x":0,"y":5,"targetMapId":"route_16","targetX":9,"targetY":7},{"x":9,"y":4,"targetMapId":"route_16","targetX":14,"targetY":6},{"x":9,"y":5,"targetMapId":"route_16","targetX":14,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_16_fuchsia_speech_house',
  name: "Route 16 House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_16","targetX":3,"targetY":1},{"x":3,"y":7,"targetMapId":"route_16","targetX":3,"targetY":1}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_17',
  name: "Cycling Road (Route 17)",
  tileset: 'kanto',
  blkFile: 'maps__Route17.blk',
  blocksW: 10,
  blocksH: 45,
  roofGroup: 'fu',
  connections: {"NORTH":{"mapId":"route_16","offset":0},"EAST":{"mapId":"route_18","offset":76}},
  warps: [{"x":17,"y":82,"targetMapId":"route_17_route_18_gate","targetX":0,"targetY":4},{"x":17,"y":83,"targetMapId":"route_17_route_18_gate","targetX":0,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"fearow","minLevel":30,"maxLevel":32,"weight":40},{"speciesId":"slugma","minLevel":29,"maxLevel":32,"weight":35},{"speciesId":"grimer","minLevel":29,"maxLevel":29,"weight":20},{"speciesId":"muk","minLevel":33,"maxLevel":33,"weight":5}],
});

buildMapFromBlk({
  id: 'route_17_route_18_gate',
  name: "Cycling Road Gate",
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":0,"y":4,"targetMapId":"route_17","targetX":17,"targetY":82},{"x":0,"y":5,"targetMapId":"route_17","targetX":17,"targetY":83},{"x":9,"y":4,"targetMapId":"route_18","targetX":2,"targetY":6},{"x":9,"y":5,"targetMapId":"route_18","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_18',
  name: "Route 18",
  tileset: 'kanto',
  blkFile: 'maps__Route18.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'fu',
  connections: {"WEST":{"mapId":"route_17","offset":-76},"EAST":{"mapId":"fuchsia_city","offset":-14}},
  warps: [{"x":2,"y":6,"targetMapId":"route_17_route_18_gate","targetX":9,"targetY":4},{"x":2,"y":7,"targetMapId":"route_17_route_18_gate","targetX":9,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"grimer","minLevel":26,"maxLevel":28,"weight":50},{"speciesId":"fearow","minLevel":27,"maxLevel":29,"weight":40},{"speciesId":"slugma","minLevel":29,"maxLevel":29,"weight":5},{"speciesId":"muk","minLevel":30,"maxLevel":30,"weight":5}],
});

buildMapFromBlk({
  id: 'fuchsia_city',
  name: "Fuchsia City",
  tileset: 'kanto',
  blkFile: 'maps__FuchsiaCity.blk',
  blocksW: 20,
  blocksH: 18,
  roofGroup: 'fu',
  connections: {"SOUTH":{"mapId":"route_19","offset":0},"WEST":{"mapId":"route_18","offset":14},"EAST":{"mapId":"route_15","offset":18}},
  warps: [{"x":5,"y":13,"targetMapId":"fuchsia_mart","targetX":3,"targetY":7},{"x":22,"y":13,"targetMapId":"safari_zone_main_office","targetX":2,"targetY":7},{"x":8,"y":27,"targetMapId":"fuchsia_gym","targetX":4,"targetY":17},{"x":19,"y":27,"targetMapId":"fuchsia_poke_center","targetX":3,"targetY":7},{"x":27,"y":27,"targetMapId":"safari_zone_wardens_home","targetX":2,"targetY":7},{"x":37,"y":22,"targetMapId":"route_15_fuchsia_gate","targetX":0,"targetY":4},{"x":37,"y":23,"targetMapId":"route_15_fuchsia_gate","targetX":0,"targetY":5},{"x":7,"y":35,"targetMapId":"route_19_fuchsia_gate","targetX":4,"targetY":0},{"x":8,"y":35,"targetMapId":"route_19_fuchsia_gate","targetX":5,"targetY":0}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fuchsia_gym',
  name: "Fuchsia Gym",
  tileset: 'lab',
  blkFile: 'maps__FuchsiaGym.blk',
  blocksW: 5,
  blocksH: 9,
  connections: {},
  warps: [{"x":4,"y":17,"targetMapId":"fuchsia_city","targetX":8,"targetY":27},{"x":5,"y":17,"targetMapId":"fuchsia_city","targetX":8,"targetY":27}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fuchsia_poke_center',
  name: "Fuchsia Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"fuchsia_city","targetX":19,"targetY":27},{"x":4,"y":7,"targetMapId":"fuchsia_city","targetX":19,"targetY":27}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'fuchsia_mart',
  name: "Fuchsia Mart",
  tileset: 'mart',
  blkFile: 'maps__Mart.blk',
  blocksW: 6,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"fuchsia_city","targetX":5,"targetY":13},{"x":3,"y":7,"targetMapId":"fuchsia_city","targetX":5,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'safari_zone_main_office',
  name: "Safari Zone Office",
  tileset: 'game_corner',
  blkFile: 'maps__OlivineCafe.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"fuchsia_city","targetX":22,"targetY":13},{"x":3,"y":7,"targetMapId":"fuchsia_city","targetX":22,"targetY":13}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'safari_zone_wardens_home',
  name: "Warden's Home",
  tileset: 'house',
  blkFile: 'maps__PokemonFanClub.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"fuchsia_city","targetX":27,"targetY":27},{"x":3,"y":7,"targetMapId":"fuchsia_city","targetX":27,"targetY":27}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_19_fuchsia_gate',
  name: "Route 19 Gate",
  tileset: 'gate',
  blkFile: 'maps__NorthSouthGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":4,"y":0,"targetMapId":"fuchsia_city","targetX":7,"targetY":35},{"x":5,"y":0,"targetMapId":"fuchsia_city","targetX":8,"targetY":35},{"x":4,"y":7,"targetMapId":"route_19","targetX":7,"targetY":3},{"x":5,"y":7,"targetMapId":"route_19","targetX":7,"targetY":3}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_15_fuchsia_gate',
  name: "Route 15 Gate",
  tileset: 'gate',
  blkFile: 'maps__EastWestGate.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":0,"y":4,"targetMapId":"fuchsia_city","targetX":37,"targetY":22},{"x":0,"y":5,"targetMapId":"fuchsia_city","targetX":37,"targetY":23},{"x":9,"y":4,"targetMapId":"route_15","targetX":2,"targetY":4},{"x":9,"y":5,"targetMapId":"route_15","targetX":2,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_12',
  name: "Route 12",
  tileset: 'kanto',
  blkFile: 'maps__Route12.blk',
  blocksW: 10,
  blocksH: 27,
  roofGroup: 've',
  connections: {"NORTH":{"mapId":"lavender_town","offset":0},"SOUTH":{"mapId":"route_13","offset":-40},"WEST":{"mapId":"route_11","offset":18}},
  warps: [{"x":11,"y":33,"targetMapId":"route_12_super_rod_house","targetX":2,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_12_super_rod_house',
  name: "Super Rod House",
  tileset: 'house',
  blkFile: 'maps__House1.blk',
  blocksW: 4,
  blocksH: 4,
  connections: {},
  warps: [{"x":2,"y":7,"targetMapId":"route_12","targetX":11,"targetY":33},{"x":3,"y":7,"targetMapId":"route_12","targetX":11,"targetY":33}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_13',
  name: "Route 13",
  tileset: 'kanto',
  blkFile: 'maps__Route13.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'fu',
  connections: {"NORTH":{"mapId":"route_12","offset":40},"SOUTH":{"mapId":"route_14","offset":0}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"nidorino","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"nidorina","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"pidgeotto","minLevel":25,"maxLevel":25,"weight":20},{"speciesId":"hoppip","minLevel":25,"maxLevel":27,"weight":19},{"speciesId":"chansey","minLevel":25,"maxLevel":25,"weight":1}],
});

buildMapFromBlk({
  id: 'route_14',
  name: "Route 14",
  tileset: 'kanto',
  blkFile: 'maps__Route14.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'fu',
  connections: {"NORTH":{"mapId":"route_13","offset":0},"WEST":{"mapId":"route_15","offset":18}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"nidorino","minLevel":26,"maxLevel":26,"weight":30},{"speciesId":"nidorina","minLevel":26,"maxLevel":26,"weight":30},{"speciesId":"pidgeotto","minLevel":28,"maxLevel":28,"weight":20},{"speciesId":"hoppip","minLevel":28,"maxLevel":28,"weight":10},{"speciesId":"skiploom","minLevel":30,"maxLevel":30,"weight":9},{"speciesId":"chansey","minLevel":28,"maxLevel":28,"weight":1}],
});

buildMapFromBlk({
  id: 'route_15',
  name: "Route 15",
  tileset: 'kanto',
  blkFile: 'maps__Route15.blk',
  blocksW: 20,
  blocksH: 9,
  roofGroup: 'fu',
  connections: {"WEST":{"mapId":"fuchsia_city","offset":-18},"EAST":{"mapId":"route_14","offset":-18}},
  warps: [{"x":2,"y":4,"targetMapId":"route_15_fuchsia_gate","targetX":9,"targetY":4},{"x":2,"y":5,"targetMapId":"route_15_fuchsia_gate","targetX":9,"targetY":5}],
  bgEvents: [],
  grassEncounters: [{"speciesId":"nidorino","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"nidorina","minLevel":23,"maxLevel":23,"weight":30},{"speciesId":"pidgeotto","minLevel":25,"maxLevel":25,"weight":20},{"speciesId":"hoppip","minLevel":25,"maxLevel":27,"weight":19},{"speciesId":"chansey","minLevel":25,"maxLevel":25,"weight":1}],
});

buildMapFromBlk({
  id: 'route_19',
  name: "Route 19",
  tileset: 'kanto',
  blkFile: 'maps__Route19.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'fu',
  connections: {"NORTH":{"mapId":"fuchsia_city","offset":0},"WEST":{"mapId":"route_20","offset":18}},
  warps: [{"x":7,"y":3,"targetMapId":"route_19_fuchsia_gate","targetX":4,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_20',
  name: "Route 20",
  tileset: 'kanto',
  blkFile: 'maps__Route20.blk',
  blocksW: 30,
  blocksH: 9,
  roofGroup: 'cn',
  connections: {"WEST":{"mapId":"cinnabar_island","offset":0},"EAST":{"mapId":"route_19","offset":-18}},
  warps: [{"x":38,"y":7,"targetMapId":"seafoam_gym","targetX":5,"targetY":5}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'seafoam_gym',
  name: "Seafoam Gym",
  tileset: 'cave',
  blkFile: 'maps__SeafoamGym.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":5,"y":5,"targetMapId":"route_20","targetX":38,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cinnabar_island',
  name: "Cinnabar Island",
  tileset: 'kanto',
  blkFile: 'maps__CinnabarIsland.blk',
  blocksW: 10,
  blocksH: 9,
  roofGroup: 'cn',
  connections: {"NORTH":{"mapId":"route_21","offset":0},"EAST":{"mapId":"route_20","offset":0}},
  warps: [{"x":11,"y":11,"targetMapId":"cinnabar_poke_center","targetX":3,"targetY":7}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'cinnabar_poke_center',
  name: "Cinnabar Pokémon Center",
  tileset: 'pokecenter',
  blkFile: 'maps__Pokecenter1F.blk',
  blocksW: 5,
  blocksH: 4,
  connections: {},
  warps: [{"x":3,"y":7,"targetMapId":"cinnabar_island","targetX":11,"targetY":11},{"x":4,"y":7,"targetMapId":"cinnabar_island","targetX":11,"targetY":11}],
  bgEvents: [],
  grassEncounters: [],
});

buildMapFromBlk({
  id: 'route_21',
  name: "Route 21",
  tileset: 'kanto',
  blkFile: 'maps__Route21.blk',
  blocksW: 10,
  blocksH: 18,
  roofGroup: 'pa',
  connections: {"NORTH":{"mapId":"pallet_town","offset":0},"SOUTH":{"mapId":"cinnabar_island","offset":0}},
  warps: [],
  bgEvents: [],
  grassEncounters: [{"speciesId":"tangela","minLevel":30,"maxLevel":35,"weight":50},{"speciesId":"rattata","minLevel":25,"maxLevel":25,"weight":30},{"speciesId":"raticate","minLevel":20,"maxLevel":20,"weight":10},{"speciesId":"mrmime","minLevel":28,"maxLevel":30,"weight":10}],
});
// >>> phase15 specs end

console.log(`Total authentic 64x64 quadrant PNGs generated: ${generatedTiles.size}`);
console.log('TILE_LIST_JSON=' + JSON.stringify(Array.from(generatedTiles).sort()));
