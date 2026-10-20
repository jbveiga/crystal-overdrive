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
    token === 'LADDER' ||
    token === 'STAIRCASE' ||
    token === 'CAVE'
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
const roofViolet = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__violet.png'));
const roofAzalea = decode2BitPng(path.join(SOURCE_DIR, 'gfx__tilesets__roofs__azalea.png'));

const ROOF_GRAPHICS = {
  nb: roofNewBark,
  cg: roofNewBark,
  vc: roofViolet,
  az: roofAzalea,
};

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
  traditional_house: loadTileset('traditional_house', false),
  pokecenter: loadTileset('pokecenter', false),
  mart: loadTileset('mart', false),
  gate: loadTileset('gate', false),
  tower: loadTileset('tower', false),
  elite_four_room: loadTileset('elite_four_room', false),
  cave: loadTileset('cave', false),
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
      const isRoofTile = ts.isOutdoor && tid >= 0x0a && tid <= 0x12;

      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          let val2b;
          if (ts.isOutdoor && tid === 0x14) {
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
  const prefix = ts.isOutdoor ? 'jt' : `in_${ts.tsName}`;
  const hasRoof = ts.isOutdoor && (quad8x8.some((tid) => ts.pal0[tid] === 'ROOF') || quad8x8.some((tid) => tid >= 0x0a && tid <= 0x12));
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
  const filter = process.argv.slice(2);
  if (filter.length > 0 && !filter.includes(id)) {
    return;
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
    { x: 17, y: 11, targetMapId: 'ruins_of_alph_research_center', targetX: 2, targetY: 7 },
    { x: 13, y: 20, targetMapId: 'route_32_ruins_of_alph_gate', targetX: 0, targetY: 4 },
    { x: 13, y: 21, targetMapId: 'route_32_ruins_of_alph_gate', targetX: 0, targetY: 5 },
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

console.log(`Total authentic 64x64 quadrant PNGs generated: ${generatedTiles.size}`);
console.log('TILE_LIST_JSON=' + JSON.stringify(Array.from(generatedTiles).sort()));
