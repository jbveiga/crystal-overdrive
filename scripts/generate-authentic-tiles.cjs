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
  if (
    token === 'FLOOR' ||
    token === 'DOOR' ||
    token.startsWith('WARP_CARPET') ||
    token === 'LADDER' ||
    token === 'STAIRCASE'
  ) {
    return 0; // Walkable
  }
  if (token === 'TALL_GRASS') {
    return 2; // Tall grass
  }
  if (token === 'WATER' || token === 'WHIRLPOOL') {
    return 3; // Water
  }
  return 1; // Solid
}

const waterAnim = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__water__water.png'));
const roofNewBark = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__new_bark.png'));

function loadTileset(tsName, isOutdoor = false) {
  const png = decode2BitPng(path.join(SOURCE_DIR, `gfx__tilesets__${tsName}.png`));
  if (isOutdoor) {
    for (let i = 0; i < 9; i++) {
      const tid = 0x0a + i;
      const dstX = (tid % 16) * 8;
      const dstY = Math.floor(tid / 16) * 8;
      const srcX = (i % 3) * 8;
      const srcY = Math.floor(i / 3) * 8;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          png.pixels[(dstY + y) * png.width + (dstX + x)] = roofNewBark.pixels[(srcY + y) * 24 + (srcX + x)];
        }
      }
    }
  }

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
    return body.split(',').map((s) => mapCollToken(s.trim()));
  });

  const meta = fs.readFileSync(path.join(SOURCE_DIR, `data__tilesets__${tsName}_metatiles.bin`));
  return { tsName, isOutdoor, png, pal0, pal1, blockCollisions, meta };
}

const TILESETS = {
  johto: loadTileset('johto', true),
  lab: loadTileset('lab', false),
  players_house: loadTileset('players_house', false),
  house: loadTileset('house', false),
  pokecenter: loadTileset('pokecenter', false),
  mart: loadTileset('mart', false),
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
          ? ROOF_PALETTES[roofGroup]
          : palettes[palName] || palettes.GRAY;
      const pngTid = tid >= 0x80 ? (ts.png.height > 48 ? tid - 0x20 : tid - 0x80) : tid;
      const srcX = (pngTid % 16) * 8;
      const srcY = Math.floor(pngTid / 16) * 8;

      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          const val2b =
            ts.isOutdoor && tid === 0x14
              ? waterAnim.pixels[(waterFrameIdx * 8 + py) * 8 + px]
              : ts.png.pixels[(srcY + py) * ts.png.width + (srcX + px)];
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
  const prefix = ts.isOutdoor ? 'jt' : `in_${ts.tsName}`;
  const hasRoof = ts.isOutdoor && quad8x8.some((tid) => ts.pal0[tid] === 'ROOF');
  const hasWater = ts.isOutdoor && quad8x8.includes(0x14);
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
        collisionGrid[idx] = colls[q];
      }
    }
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
  blkFile: 'maps__House2.blk',
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

console.log(`Total authentic 64x64 quadrant PNGs generated: ${generatedTiles.size}`);
console.log('TILE_LIST_JSON=' + JSON.stringify(Array.from(generatedTiles).sort()));
