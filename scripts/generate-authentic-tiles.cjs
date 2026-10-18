const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const TILES_DIR = path.join(projectRoot, 'public/assets/tiles');

if (!fs.existsSync(TILES_DIR)) {
  fs.mkdirSync(TILES_DIR, { recursive: true });
}

function hexToRgba(hex) {
  if (hex === 'transparent' || hex === 'none') {
    return [0, 0, 0, 0];
  }
  hex = hex.replace('#', '');
  const num = parseInt(hex, 16);
  if (hex.length === 8) {
    return [(num >> 24) & 255, (num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
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

function render16x16To64(rows, palette) {
  const buf = Buffer.alloc(64 * 64 * 4);
  const rgbaPal = {};
  for (const [k, v] of Object.entries(palette)) {
    rgbaPal[k] = hexToRgba(v);
  }

  for (let y16 = 0; y16 < 16; y16++) {
    const row = rows[y16] || '';
    for (let x16 = 0; x16 < 16; x16++) {
      const char = row[x16] || '.';
      const rgba = rgbaPal[char] || [0, 0, 0, 0];
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const px = x16 * 4 + dx;
          const py = y16 * 4 + dy;
          const idx = (py * 64 + px) * 4;
          buf[idx] = rgba[0];
          buf[idx + 1] = rgba[1];
          buf[idx + 2] = rgba[2];
          buf[idx + 3] = rgba[3];
        }
      }
    }
  }
  return buf;
}

// ==========================================
// PALETTES
// ==========================================
const G = {
  g0: '#488828', // grass shadow
  g1: '#60a838', // grass dark
  g2: '#78c850', // grass base
  g3: '#90e068', // grass light
  g4: '#b0f088', // grass highlight
};

const P = {
  p0: '#887048', // path shadow
  p1: '#b09868', // path dark
  p2: '#d8c088', // path base
  p3: '#e8d4a0', // path light
  p4: '#f8e8b8', // path pebble/highlight
};

const T = {
  t0: '#082810', // tree outline
  t1: '#185018', // tree shadow
  t2: '#288028', // tree mid dark
  t3: '#48a838', // tree mid
  t4: '#70d050', // tree light
  t5: '#98f070', // tree leaf highlight
  b0: '#382010', // bark shadow
  b1: '#583818', // bark mid
  b2: '#805028', // bark light
};

const HR = { // House Roof (Terracotta / Red shingle)
  r0: '#300808', // outline
  r1: '#781818', // deep shade
  r2: '#b82828', // shadow shingle
  r3: '#d84038', // base shingle
  r4: '#f06050', // light shingle
  r5: '#f89080', // highlight
  c0: '#402018', // chimney brick shadow
  c1: '#884830', // chimney brick
  c2: '#c07050', // chimney brick light
  c3: '#201818', // chimney cap
};

const LR = { // Lab Roof (Slate Blue Tech)
  s0: '#101828', // outline
  s1: '#203048', // deep shade
  s2: '#385070', // shadow slate
  s3: '#507098', // base slate
  s4: '#7098c0', // light slate
  s5: '#98c0e8', // metallic highlight
  v0: '#182028', // vent dark
  v1: '#404850', // vent mid
  v2: '#808890', // vent light
};

const W = { // Wall & Door & Window
  w0: '#484038', // wall shadow
  w1: '#b8b0a0', // wall shade
  w2: '#ded8c8', // wall clapboard light
  w3: '#f4f0e4', // wall clapboard base
  g0: '#183860', // glass dark
  g1: '#3068a8', // glass mid
  g2: '#68a8e8', // glass light
  g3: '#b0d8f8', // glass glint
  d0: '#301808', // door frame
  d1: '#683818', // door dark
  d2: '#985828', // door mid
  d3: '#c88040', // door light
  k0: '#f8d030', // gold knob
  f0: '#908878', // stone step
  f1: '#c0b8a8', // stone step light
};

const O = { // Ocean Water
  w0: '#102868', // deep ocean
  w1: '#184098', // shadow water
  w2: '#2860c8', // base water
  w3: '#4888e8', // wave mid
  w4: '#78b8f8', // wave light
  w5: '#d8f0ff', // foam crest
  s0: '#c0b080', // shore sand dark
  s1: '#e0d098', // shore sand base
};

const propsPal = {
  ...G, ...P, ...W,
  fn0: '#383028', // fence dark
  fn1: '#706858', // fence mid
  fn2: '#b8b098', // fence light
  fn3: '#f0e8d0', // fence white
  mb0: '#183068', // mailbox blue dark
  mb1: '#2858b8', // mailbox blue
  mb2: '#e03030', // mailbox flag red
  fl0: '#880820', // flower red dark
  fl1: '#d82040', // flower red
  fl2: '#f85070', // flower pink
  fl3: '#f8d838', // flower eye yellow
  fy0: '#887010', // flower yellow dark
  fy1: '#e8b820', // flower yellow
  fy2: '#f8e850', // flower yellow light
  fy3: '#ffffff', // flower daisy white
};

// ==========================================
// TILE DEFINITIONS (16x16 ASCII Art)
// ==========================================
const tiles = {};

// 1. Grass
tiles['grass'] = {
  pal: { '.': G.g2, ':': G.g1, 'x': G.g0, '^': G.g3, '*': G.g4 },
  rows: [
    '..:.....^.......',
    '....x.....:.....',
    '..:.....*...:...',
    '.....:.....x....',
    '.^.......:......',
    '....x.......:...',
    '..:.....^.......',
    '.....:.....x....',
    '..:.....^.......',
    '....x.....:.....',
    '..:.....*.......',
    '.....:.....x....',
    '.^.......:......',
    '....x.......:...',
    '..:.....^.......',
    '.....:.....x....',
  ],
};

// 2. Tall Grass (Wild Encounters)
tiles['tall_grass'] = {
  pal: { '.': G.g2, ':': G.g1, 'x': G.g0, '^': G.g3, 'X': '#082808', 'L': '#287018', 'H': '#88e040' },
  rows: [
    '..X.X.....X.X...',
    '.XL.LX...XL.LX..',
    'XLLHLLX.XLLHLLX.',
    'XLHHLHX.XLHHLHX.',
    'XLLHLLX.XLLHLLX.',
    '.XL.LX...XL.LX..',
    '..X.X.X.X.X.X...',
    '.....XL.LX......',
    '..X.XLLHLLX.X...',
    '.XL.XLHHLHX.LX..',
    'XLLHXLLHLLXXLLX.',
    'XLHHXXL.LXXLHHLX',
    'XLLHL.X.X.LHLLX.',
    '.XL.L.....L.LX..',
    '..X.X.....X.X...',
    '................',
  ],
};

// 3. Path (Authentic Johto dirt)
tiles['path'] = {
  pal: { '.': P.p2, ':': P.p1, 'x': P.p0, '^': P.p3, '*': P.p4 },
  rows: [
    '..:.....^.......',
    '....x.....:..*..',
    '..:.....^.......',
    '.....:.....x....',
    '.^.......:......',
    '....*.......:...',
    '..:.....^.......',
    '.....:.....x....',
    '..:.....^.......',
    '....x.....:.....',
    '..:.....^....*..',
    '.....:.....x....',
    '.^.......:......',
    '....x.......:...',
    '..:.....^.......',
    '.....:.....x....',
  ],
};

// 4. Gravel Path
tiles['path_gravel'] = {
  pal: { '.': P.p2, ':': P.p1, 'x': P.p0, '^': P.p3, '*': P.p4, 'g': '#988870', 'w': '#c8b898' },
  rows: [
    '..g:....w^......',
    '..w.x..g..:..*..',
    '..:.....^..g....',
    '.g...:..w..x.w..',
    '.^..w....:......',
    '....*...g...:...',
    '..:..w..^..w....',
    '..g..:.....x....',
    '..:..g..^..g....',
    '....x.....:..w..',
    '.w:.....^....*..',
    '.....:.w...x....',
    '.^...g...:......',
    '..w.x...w...:...',
    '..:...g.^.......',
    '.g...:.....x.w..',
  ],
};

// 5. Tree Tall (Canopy - Top half)
tiles['tree_tall_0'] = {
  pal: { '.': G.g2, 'X': T.t0, 'D': T.t1, 'M': T.t2, 'L': T.t3, 'H': T.t4, '*': T.t5 },
  rows: [
    '.....XXXXXX.....',
    '...XXLLHHLLXX...',
    '..XLLHHHHHHLLX..',
    '.XLLHH****HHLLX.',
    '.XLHH******HHLLX',
    'XLLHH******HHLLX',
    'XLHH********HHLL',
    'XLH**********HHL',
    'XLLHH******HHLLX',
    'XDLLHH****HLLLDX',
    'XDDLLHHHHHHLLDDX',
    'XDDDLLLLLLLLDDDX',
    'XDDDDLLLLLLDDDDX',
    '.XDDDDDDDDDDDDX.',
    '..XXDDDDDDDDXX..',
    '....XXXXXXXX....',
  ],
};

// 6. Tree Tall (Trunk / Base - Bottom half)
tiles['tree_tall_1'] = {
  pal: { '.': G.g2, ':': G.g1, 'X': T.t0, 'D': T.t1, 'L': T.t3, 'H': T.t4, 'b': T.b0, 'B': T.b1, 'W': T.b2 },
  rows: [
    '....XXXXXXXX....',
    '..XXLLHHLLHHXX..',
    '.XLLHHHHHHHHLLX.',
    'XLLHHHHHHHHHHLLX',
    'XDLLLLLLLLLLLLDX',
    'XDDDLLXbbXLLDDDX',
    '.XXDDXbBBbXDDXX.',
    '..XXXbBBBBbXXX..',
    '....XbBBWWBbX...',
    '....XbBBWWBbX...',
    '....XbBBWWBbX...',
    '....XbBBWWBbX...',
    '....XbBBWWBbX...',
    '...XbbBBWWBbbX..',
    '..XbbbBBWWBbbbX.',
    '..XXXXXXXXXXXX..',
  ],
};

// 7. Tree Short (Shrub / Bush)
tiles['tree_short_0'] = {
  pal: { '.': G.g2, 'X': T.t0, 'D': T.t1, 'M': T.t2, 'L': T.t3, 'H': T.t4, '*': T.t5 },
  rows: [
    '.....XXXXXX.....',
    '...XXLLHHLLXX...',
    '..XLLHHHHHHLLX..',
    '.XLLHH****HHLLX.',
    '.XLHH******HHLLX',
    'XLLHH******HHLLX',
    'XLHH********HHLL',
    'XLH**********HHL',
    'XLLHH******HHLLX',
    'XDLLHH****HLLLDX',
    'XDDLLHHHHHHLLDDX',
    'XDDDLLLLLLLLDDDX',
    'XDDDDLLLLLLDDDDX',
    '.XDDDDDDDDDDDDX.',
    '..XXDDDDDDDDXX..',
    '....XXXXXXXX....',
  ],
};

// 8. House Roof Top-Left
tiles['house_roof_tl'] = {
  pal: { '.': G.g2, 'X': HR.r0, 'D': HR.r1, 'S': HR.r2, 'B': HR.r3, 'L': HR.r4, 'H': HR.r5 },
  rows: [
    '............XXXX',
    '..........XXLLBB',
    '........XXLLBBBB',
    '......XXLLBBBBSS',
    '....XXLLBBBBSSDD',
    '..XXLLBBBBSSDDXX',
    '.XLLBBBBSSDDXXXX',
    '.XBBBBSSDDXXXX..',
    'XBBSSDDXXXX.....',
    'XSSDDXXXX.......',
    'XDDXXXX.........',
    'XXXX............',
    '................',
    '................',
    '................',
    '................',
  ],
};

// 9. House Roof Top-Ridge
tiles['house_roof_top'] = {
  pal: { 'X': HR.r0, 'D': HR.r1, 'S': HR.r2, 'B': HR.r3, 'L': HR.r4, 'H': HR.r5 },
  rows: [
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLL',
    'HHHHHHHHHHHHHHHH',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'SSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
  ],
};

// 10. House Roof Top-Right (With Chimney)
tiles['house_roof_tr'] = {
  pal: {
    '.': G.g2, 'X': HR.r0, 'D': HR.r1, 'S': HR.r2, 'B': HR.r3, 'L': HR.r4, 'H': HR.r5,
    'C': HR.c3, 'c': HR.c0, 'm': HR.c1, 'l': HR.c2,
  },
  rows: [
    'XXXX....CCCCCC..',
    'BBLLXX..CclmmC..',
    'BBBBLLXXCclmmC..',
    'SSBBBBLLCclmmC..',
    'DDSSBBBBXXXXXXXX',
    'XXDDSSBBBBSSDDXX',
    'XXXXDDSSBBBBSSDX',
    '..XXXXDDSSBBBBXX',
    '.....XXXXDDSSBXX',
    '.......XXXXDDSXX',
    '.........XXXXDXX',
    '............XXXX',
    '................',
    '................',
    '................',
    '................',
  ],
};

// 11. House Roof Front Left
tiles['house_roof_front_l'] = {
  pal: { 'X': HR.r0, 'D': HR.r1, 'S': HR.r2, 'B': HR.r3, 'L': HR.r4, 'H': HR.r5 },
  rows: [
    'XLLLLLLLLLLLLLLL',
    'XHHHHHHHHHHHHHHH',
    'XLLLLLLLLLLLLLLL',
    'XBBBBBBBBBBBBBBB',
    'XBBBBBBBBBBBBBBB',
    'XSSSSSSSSSSSSSSS',
    'XDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'XLLLLLLLLLLLLLLL',
    'XHHHHHHHHHHHHHHH',
    'XLLLLLLLLLLLLLLL',
    'XBBBBBBBBBBBBBBB',
    'XSSSSSSSSSSSSSSS',
    'XDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'DDDDDDDDDDDDDDDD',
  ],
};

// 12. House Roof Front Mid
tiles['house_roof_front_m'] = {
  pal: { 'X': HR.r0, 'D': HR.r1, 'S': HR.r2, 'B': HR.r3, 'L': HR.r4, 'H': HR.r5 },
  rows: [
    'LLLLLLLLLLLLLLLL',
    'HHHHHHHHHHHHHHHH',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLL',
    'HHHHHHHHHHHHHHHH',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'DDDDDDDDDDDDDDDD',
  ],
};

// 13. House Roof Front Right
tiles['house_roof_front_r'] = {
  pal: { 'X': HR.r0, 'D': HR.r1, 'S': HR.r2, 'B': HR.r3, 'L': HR.r4, 'H': HR.r5 },
  rows: [
    'LLLLLLLLLLLLLLLX',
    'HHHHHHHHHHHHHHHX',
    'LLLLLLLLLLLLLLLX',
    'BBBBBBBBBBBBBBBX',
    'BBBBBBBBBBBBBBBX',
    'SSSSSSSSSSSSSSSX',
    'DDDDDDDDDDDDDDDX',
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLX',
    'HHHHHHHHHHHHHHHX',
    'LLLLLLLLLLLLLLLX',
    'BBBBBBBBBBBBBBBX',
    'SSSSSSSSSSSSSSSX',
    'DDDDDDDDDDDDDDDX',
    'XXXXXXXXXXXXXXXX',
    'DDDDDDDDDDDDDDDD',
  ],
};

// 14. House Wall (Clapboard)
tiles['house_wall'] = {
  pal: { 'X': W.w0, 's': W.w1, 'l': W.w2, '.': W.w3 },
  rows: [
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
  ],
};

// 15. House Window
tiles['house_window'] = {
  pal: {
    'X': W.w0, 's': W.w1, 'l': W.w2, '.': W.w3,
    'F': '#302820', 'd': W.g0, 'm': W.g1, 'g': W.g2, 'H': W.g3,
  },
  rows: [
    '................',
    '..FFFFFFFFFFFF..',
    '..FddmFFmggHFF..',
    'XXFddmFFmggHFFXX',
    '..FmmgFFggHHFF..',
    '..FFFFFFFFFFFF..',
    '..FddmFFmggHFF..',
    'XXFddmFFmggHFFXX',
    '..FmmgFFggHHFF..',
    '..FFFFFFFFFFFF..',
    '..ssssssssssss..',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
  ],
};

// 16. House Door
tiles['house_door'] = {
  pal: {
    'X': W.w0, 's': W.w1, '.': W.w3,
    'F': W.d0, 'd': W.d1, 'm': W.d2, 'l': W.d3, 'K': W.k0,
    'S': W.f0, 's2': W.f1,
  },
  rows: [
    '..FFFFFFFFFFFF..',
    '..FddddddddddF..',
    '..FdmmmmmmmmdF..',
    'XXFdmmllllmmdFXX',
    '..FdmmllllmmdF..',
    '..FdmmllllmmdF..',
    '..FdmmmmmmmmdF..',
    'XXFdmmKmmllmdFXX',
    '..FdmmllllmmdF..',
    '..FdmmllllmmdF..',
    '..FdmmmmmmmmdF..',
    'XXFdmmllllmmdFXX',
    '..FdmmllllmmdF..',
    '..FFFFFFFFFFFF..',
    '.s2s2s2s2s2s2s2.',
    'SSSSSSSSSSSSSSSS',
  ],
};

// 17. Lab Roof Top-Left
tiles['lab_roof_tl'] = {
  pal: { '.': G.g2, 'X': LR.s0, 'D': LR.s1, 'S': LR.s2, 'B': LR.s3, 'L': LR.s4, 'H': LR.s5 },
  rows: [
    '............XXXX',
    '..........XXLLBB',
    '........XXLLBBBB',
    '......XXLLBBBBSS',
    '....XXLLBBBBSSDD',
    '..XXLLBBBBSSDDXX',
    '.XLLBBBBSSDDXXXX',
    '.XBBBBSSDDXXXX..',
    'XBBSSDDXXXX.....',
    'XSSDDXXXX.......',
    'XDDXXXX.........',
    'XXXX............',
    '................',
    '................',
    '................',
    '................',
  ],
};

// 18. Lab Roof Top (With Vent/Flue)
tiles['lab_roof_top'] = {
  pal: {
    'X': LR.s0, 'D': LR.s1, 'S': LR.s2, 'B': LR.s3, 'L': LR.s4, 'H': LR.s5,
    'v0': LR.v0, 'v1': LR.v1, 'v2': LR.v2,
  },
  rows: [
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLL',
    'HHHH..v2v2..HHHH',
    'LLLL.v1v2v2.LLLL',
    'BBBB.v0v1v1.BBBB',
    'BBBB..v0v0..BBBB',
    'SSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
  ],
};

// 19. Lab Roof Top-Right
tiles['lab_roof_tr'] = {
  pal: { '.': G.g2, 'X': LR.s0, 'D': LR.s1, 'S': LR.s2, 'B': LR.s3, 'L': LR.s4, 'H': LR.s5 },
  rows: [
    'XXXX............',
    'BBLLXX..........',
    'BBBBLLXX........',
    'SSBBBBLLXX......',
    'DDSSBBBBLLXX....',
    'XXDDSSBBBBLLXX..',
    'XXXXDDSSBBBBLLX.',
    '..XXXXDDSSBBBBX.',
    '.....XXXXDDSSBBX',
    '.......XXXXDDSSX',
    '.........XXXXDDX',
    '............XXXX',
    '................',
    '................',
    '................',
    '................',
  ],
};

// 20. Lab Roof Front Left
tiles['lab_roof_front_l'] = {
  pal: { 'X': LR.s0, 'D': LR.s1, 'S': LR.s2, 'B': LR.s3, 'L': LR.s4, 'H': LR.s5 },
  rows: [
    'XLLLLLLLLLLLLLLL',
    'XHHHHHHHHHHHHHHH',
    'XLLLLLLLLLLLLLLL',
    'XBBBBBBBBBBBBBBB',
    'XBBBBBBBBBBBBBBB',
    'XSSSSSSSSSSSSSSS',
    'XDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'XLLLLLLLLLLLLLLL',
    'XHHHHHHHHHHHHHHH',
    'XLLLLLLLLLLLLLLL',
    'XBBBBBBBBBBBBBBB',
    'XSSSSSSSSSSSSSSS',
    'XDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'DDDDDDDDDDDDDDDD',
  ],
};

// 21. Lab Roof Front Mid
tiles['lab_roof_front_m'] = {
  pal: { 'X': LR.s0, 'D': LR.s1, 'S': LR.s2, 'B': LR.s3, 'L': LR.s4, 'H': LR.s5 },
  rows: [
    'LLLLLLLLLLLLLLLL',
    'HHHHHHHHHHHHHHHH',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLL',
    'HHHHHHHHHHHHHHHH',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'SSSSSSSSSSSSSSSS',
    'DDDDDDDDDDDDDDDD',
    'XXXXXXXXXXXXXXXX',
    'DDDDDDDDDDDDDDDD',
  ],
};

// 22. Lab Roof Front Right
tiles['lab_roof_front_r'] = {
  pal: { 'X': LR.s0, 'D': LR.s1, 'S': LR.s2, 'B': LR.s3, 'L': LR.s4, 'H': LR.s5 },
  rows: [
    'LLLLLLLLLLLLLLLX',
    'HHHHHHHHHHHHHHHX',
    'LLLLLLLLLLLLLLLX',
    'BBBBBBBBBBBBBBBX',
    'BBBBBBBBBBBBBBBX',
    'SSSSSSSSSSSSSSSX',
    'DDDDDDDDDDDDDDDX',
    'XXXXXXXXXXXXXXXX',
    'LLLLLLLLLLLLLLLX',
    'HHHHHHHHHHHHHHHX',
    'LLLLLLLLLLLLLLLX',
    'BBBBBBBBBBBBBBBX',
    'SSSSSSSSSSSSSSSX',
    'DDDDDDDDDDDDDDDX',
    'XXXXXXXXXXXXXXXX',
    'DDDDDDDDDDDDDDDD',
  ],
};

// 23. Lab Wall
tiles['lab_wall'] = {
  pal: { 'X': '#283038', 's': '#707880', 'l': '#b0b8c0', '.': '#d8e0e8' },
  rows: [
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
  ],
};

// 24. Lab Window (Tech observation pane)
tiles['lab_window'] = {
  pal: {
    'X': '#283038', 's': '#707880', '.': '#d8e0e8',
    'F': '#182028', 'd': '#184878', 'm': '#2878b8', 'g': '#58b0f8', 'H': '#a0e0ff',
  },
  rows: [
    '................',
    '.FFFFFFFFFFFFFF.',
    '.FddddmFFmggggF.',
    'XFddddmFFmggggFX',
    '.FmmmmgFFgHHHHF.',
    '.FFFFFFFFFFFFFF.',
    '.FddddmFFmggggF.',
    'XFddddmFFmggggFX',
    '.FmmmmgFFgHHHHF.',
    '.FFFFFFFFFFFFFF.',
    '.ssssssssssssss.',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    'ssssssssssssssss',
    'XXXXXXXXXXXXXXXX',
  ],
};

// 25. Lab Door (Automatic Glass Door)
tiles['lab_door'] = {
  pal: {
    'X': '#283038', '.': '#d8e0e8',
    'F': '#182028', 'm': '#3078b8', 'g': '#68c0f8', 'H': '#b8ecff',
    'P': '#d03838', 'S': '#505860',
  },
  rows: [
    '.FFFFFFFFFF.FFFF',
    '.FmmggHFFHggmmF.',
    '.FmmggHFFHggmmF.',
    'XFmmggHFFHggmmFX',
    '.FmmggHFFHggmmF.',
    '.FmmggHFFHggmmF.',
    '.FmmggHFFHggmmF.',
    'XFmmggHFFHggmmFX',
    '.FmmPPHFFHPPmmF.',
    '.FmmggHFFHggmmF.',
    '.FmmggHFFHggmmF.',
    'XFmmggHFFHggmmFX',
    '.FmmggHFFHggmmF.',
    '.FFFFFFFFFF.FFFF',
    'SSSSSSSSSSSSSSSS',
    'XXXXXXXXXXXXXXXX',
  ],
};

// 26. Wooden Fence Horizontal
tiles['fence_horizontal'] = {
  pal: {
    '.': G.g2, ':': G.g1,
    'X': propsPal.fn0, 'd': propsPal.fn1, 'm': propsPal.fn2, 'w': propsPal.fn3,
  },
  rows: [
    '................',
    '................',
    '................',
    '..XX........XX..',
    '..XwX.XXXXXX.XwX',
    '..XwmXwwwwwwXwmX',
    '..XmddmmmmmmXmdd',
    '..XXdXXXXXXXXdXX',
    '..XX..XXXXXX..XX',
    '..XwX.XwwwwX.XwX',
    '..XwmXXmmmmXXwmX',
    '..XmddXXXXXXmddX',
    '..XXdXXXXXXXXdXX',
    '..XX........XX..',
    '................',
    '................',
  ],
};

// 27. Town Sign ("New Bark Town")
tiles['sign_town'] = {
  pal: {
    '.': G.g2, ':': G.g1,
    'X': '#281808', 'd': '#583818', 'm': '#885828', 'l': '#b88040', 't': '#e8b870',
    'b': '#402810',
  },
  rows: [
    '................',
    '................',
    '...XXXXXXXXXX...',
    '..XllllllllllX..',
    '..XlttttttttmX..',
    '..XltmmmmmmtmX..',
    '..XltmXXXXmtmX..',
    '..XltmX..XmtmX..',
    '..XltmmmmmmtmX..',
    '..XmmmmmmmmmmX..',
    '...XXXXXXXXXX...',
    '......XbbX......',
    '......XbbX......',
    '......XbbX......',
    '......XXXX......',
    '................',
  ],
};

// 28. Lab Sign ("Elm Pokémon Lab")
tiles['sign_lab'] = {
  pal: {
    '.': G.g2, ':': G.g1,
    'X': '#102038', 'd': '#204878', 'm': '#3878b8', 'l': '#60a8e8', 't': '#b8e0ff',
    'P': '#e83838', 'W': '#ffffff', 'b': '#404850',
  },
  rows: [
    '................',
    '................',
    '...XXXXXXXXXX...',
    '..XllllllllllX..',
    '..XlttttttttmX..',
    '..XltmXPPXmtmX..',
    '..XltmXWWXmtmX..',
    '..XltmXXXXmtmX..',
    '..XltmmmmmmtmX..',
    '..XmmmmmmmmmmX..',
    '...XXXXXXXXXX...',
    '......XbbX......',
    '......XbbX......',
    '......XbbX......',
    '......XXXX......',
    '................',
  ],
};

// 29. Mailbox
tiles['mailbox'] = {
  pal: {
    '.': G.g2, ':': G.g1,
    'X': '#101828', 'b': '#2858a8', 'l': '#4888e8', 'F': '#e02828', 'f': '#ff6060',
    'p': '#583818',
  },
  rows: [
    '................',
    '................',
    '.....XXXXX......',
    '....XlllllX.FF..',
    '...XlbbbbblX.F..',
    '...XlbbbbblXFF..',
    '...XlbbbbbllX...',
    '...XXXXXXXXXX...',
    '......XppX......',
    '......XppX......',
    '......XppX......',
    '......XppX......',
    '......XXXX......',
    '................',
    '................',
    '................',
  ],
};

// 30. Red Flowers in Grass
tiles['flower_red'] = {
  pal: {
    '.': G.g2, ':': G.g1, 'x': G.g0,
    'X': propsPal.fl0, 'r': propsPal.fl1, 'p': propsPal.fl2, 'y': propsPal.fl3,
  },
  rows: [
    '..:.....^.......',
    '..XppX...XppX...',
    '.XprrX...XprrX..',
    '.XryrX...XryrX..',
    '..XrrX....XrrX..',
    '...XX......XX...',
    '.....x.......:..',
    '........XppX....',
    '..:....XprrX....',
    '.......XryrX.x..',
    '..:.....XrrX....',
    '.........XX.....',
    '....XppX...:....',
    '...XprrX........',
    '...XryrX....^...',
    '....XrrX........',
  ],
};

// 31. Yellow Flowers in Grass
tiles['flower_yellow'] = {
  pal: {
    '.': G.g2, ':': G.g1, 'x': G.g0,
    'X': propsPal.fy0, 'y': propsPal.fy1, 'l': propsPal.fy2, 'w': propsPal.fy3,
  },
  rows: [
    '..:.....^.......',
    '..XllX...XllX...',
    '.XlyyX...XlyyX..',
    '.XywyX...XywyX..',
    '..XyyX....XyyX..',
    '...XX......XX...',
    '.....x.......:..',
    '........XllX....',
    '..:....XlyyX....',
    '.......XywyX.x..',
    '..:.....XyyX....',
    '.........XX.....',
    '....XllX...:....',
    '...XlyyX........',
    '...XywyX....^...',
    '....XyyX........',
  ],
};

// 32. Water (Ocean Deep)
tiles['water'] = {
  pal: { '.': O.w2, 'd': O.w1, 'x': O.w0, 'l': O.w3, 'w': O.w4, 'c': O.w5 },
  rows: [
    '..l.w.c.w.l.....',
    '....d.x.d.......',
    '..........l.w.l.',
    '............d...',
    '.l.w.l..........',
    '...d............',
    '........l.w.c.w.',
    '..........d.x.d.',
    '..l.w.c.w.l.....',
    '....d.x.d.......',
    '..........l.w.l.',
    '............d...',
    '.l.w.l..........',
    '...d............',
    '........l.w.c.w.',
    '..........d.x.d.',
  ],
};

// 33. Water Shore North (Grass/Sand Bank -> Water)
tiles['water_shore_n'] = {
  pal: {
    'g': G.g2, 'd': G.g1, 's': O.s1, 'S': O.s0,
    'c': O.w5, 'w': O.w4, 'm': O.w3, '.': O.w2, 'x': O.w1,
  },
  rows: [
    'gggggggggggggggg',
    'ggggddggggddgggg',
    'ssssssssssssssss',
    'SSSSSSSSSSSSSSSS',
    'cccccccccccccccc',
    'wwwwwwwwwwwwwwww',
    'mmmmmmmmmmmmmmmm',
    '................',
    '..m.w.c.w.m.....',
    '....x...x.......',
    '..........m.w.m.',
    '............x...',
    '.m.w.m..........',
    '...x............',
    '........m.w.c.w.',
    '..........x...x.',
  ],
};

// 34. Water Shore West (Grass/Sand Bank on West -> Water on East)
tiles['water_shore_w'] = {
  pal: {
    'g': G.g2, 's': O.s1, 'S': O.s0,
    'c': O.w5, 'w': O.w4, 'm': O.w3, '.': O.w2, 'x': O.w1,
  },
  rows: [
    'ggsSccw.m.w.c.w.',
    'ggsSccw...x...x.',
    'ggsSccw.........',
    'ggsSccw.m.w.m...',
    'ggsSccw...x.....',
    'ggsSccw.........',
    'ggsSccw..m.w.c.w',
    'ggsSccw....x...x',
    'ggsSccw.........',
    'ggsSccw.m.w.m...',
    'ggsSccw...x.....',
    'ggsSccw.........',
    'ggsSccw..m.w.c.w',
    'ggsSccw....x...x',
    'ggsSccw.........',
    'ggsSccw.m.w.m...',
  ],
};

// 35. Water Shore NW Corner
tiles['water_shore_nw'] = {
  pal: {
    'g': G.g2, 's': O.s1, 'S': O.s0,
    'c': O.w5, 'w': O.w4, 'm': O.w3, '.': O.w2, 'x': O.w1,
  },
  rows: [
    'gggggggggggggggg',
    'ggggddggggddgggg',
    'ggssssssssssssss',
    'ggsSSSSSSSSSSSSS',
    'ggsScccccccccccc',
    'ggsScwwwwwwwwwww',
    'ggsScwmmmmmmmmmm',
    'ggsScw..........',
    'ggsScw.m.w.c.w.m',
    'ggsScw...x...x..',
    'ggsScw..........',
    'ggsScw...m.w.m..',
    'ggsScw.....x....',
    'ggsScw..........',
    'ggsScw..m.w.c.w.',
    'ggsScw....x...x.',
  ],
};

// Overwrite legacy aliases so older references also resolve to authentic tiles
tiles['door'] = tiles['house_door'];
tiles['wall'] = tiles['house_wall'];
tiles['roof'] = tiles['house_roof_front_m'];
tiles['sign'] = tiles['sign_town'];
tiles['flower_0'] = tiles['flower_red'];
tiles['flower_1'] = tiles['flower_yellow'];
tiles['water_edge'] = tiles['water_shore_n'];

console.log(`Generating ${Object.keys(tiles).length} authentic 64x64 Johto pixel art tiles...`);

for (const [name, def] of Object.entries(tiles)) {
  const buf = render16x16To64(def.rows, def.pal);
  const png = createPNG(64, 64, buf);
  const destPath = path.join(TILES_DIR, `${name}.png`);
  fs.writeFileSync(destPath, png);
  console.log(`✔ Generated ${name}.png (${png.length} bytes)`);
}

// Clean up test file if it exists
if (fs.existsSync(path.join(TILES_DIR, 'test_grass.png'))) {
  fs.unlinkSync(path.join(TILES_DIR, 'test_grass.png'));
}

console.log('✅ All authentic Pokémon Crystal tiles generated successfully!');
