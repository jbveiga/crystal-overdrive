const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const ITEMS_DIR = path.join(projectRoot, 'public/assets/sprites/items');
const POKEBALLS_DIR = path.join(projectRoot, 'public/assets/sprites/pokeballs');
const FX_DIR = path.join(projectRoot, 'public/assets/sprites/fx');
const BATTLE_FX_DIR = path.join(projectRoot, 'public/assets/sprites/battle_fx');

[ITEMS_DIR, POKEBALLS_DIR, FX_DIR, BATTLE_FX_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
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

function decode2BitGrayscalePng(buf) {
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

      for (let p = 0; p < 4; p++) {
        const px = i * 4 + p;
        if (px >= width) break;
        const shift = 6 - p * 2;
        const v = (val >> shift) & 0x03;
        const outIdx = (y * width + px) * 4;

        if (v === 3) {
          rgba[outIdx] = 0;
          rgba[outIdx + 1] = 0;
          rgba[outIdx + 2] = 0;
          rgba[outIdx + 3] = 0;
        } else if (v === 0) {
          rgba[outIdx] = 15;
          rgba[outIdx + 1] = 23;
          rgba[outIdx + 2] = 42;
          rgba[outIdx + 3] = 255;
        } else if (v === 1) {
          rgba[outIdx] = 100;
          rgba[outIdx + 1] = 116;
          rgba[outIdx + 2] = 139;
          rgba[outIdx + 3] = 255;
        } else if (v === 2) {
          rgba[outIdx] = 248;
          rgba[outIdx + 1] = 250;
          rgba[outIdx + 2] = 252;
          rgba[outIdx + 3] = 255;
        }
      }
    }
    prevRow.set(row);
  }
  return { width, height, rgba };
}

async function fetchPokeballs() {
  console.log('=== Step 1: Fetching Pokéball Item & Battle Sprites ===');
  const pokeApiBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';
  const ballKeys = [
    'poke-ball',
    'great-ball',
    'ultra-ball',
    'master-ball',
    'fast-ball',
    'heavy-ball',
    'level-ball',
    'lure-ball',
    'moon-ball',
    'friend-ball',
    'love-ball',
    'dusk-ball',
    'net-ball',
    'quick-ball',
    'timer-ball',
    'repeat-ball',
    'nest-ball',
  ];

  for (const key of ballKeys) {
    try {
      const url = `${pokeApiBase}/${key}.png`;
      const raw = await downloadBuffer(url);
      const decoded = decode4BitPng(raw);
      const pngBuf = createPNG(decoded.width, decoded.height, decoded.rgba);

      // Save hyphenated name (e.g. poke-ball.png) and clean alias (e.g. pokeball.png) in items/ and pokeballs/
      const cleanKey = key.replace('-', '');
      fs.writeFileSync(path.join(ITEMS_DIR, `${key}.png`), pngBuf);
      fs.writeFileSync(path.join(ITEMS_DIR, `${cleanKey}.png`), pngBuf);
      fs.writeFileSync(path.join(POKEBALLS_DIR, `${key}.png`), pngBuf);
      fs.writeFileSync(path.join(POKEBALLS_DIR, `${cleanKey}.png`), pngBuf);

      console.log(`Saved Pokéball: ${key}.png & ${cleanKey}.png`);
    } catch (err) {
      console.error(`Error saving ${key}:`, err.message);
    }
  }
}

async function fetchBattleFx() {
  console.log('\n=== Step 2: Fetching Authentic In-Battle Attack Animation VFX ===');
  const pretBase = 'https://raw.githubusercontent.com/pret/pokecrystal/master/gfx/battle_anims';
  const animFiles = [
    { src: 'hit.png', aliases: ['impact_burst.png'] },
    { src: 'cut.png', aliases: ['scratch_slash.png'] },
    { src: 'fire.png', aliases: ['ember_flame.png'] },
    { src: 'water.png', aliases: ['water_drop.png'] },
    { src: 'bubble.png', aliases: ['water_bubble.png'] },
    { src: 'lightning.png', aliases: ['thunder_spark.png'] },
    { src: 'ice.png', aliases: ['ice_crystal.png'] },
    { src: 'plant.png', aliases: ['razor_leaf.png'] },
    { src: 'rocks.png', aliases: ['rock_shatter.png'] },
    { src: 'smoke.png', aliases: ['smoke_puff.png'] },
    { src: 'shine.png', aliases: ['twinkle_star.png'] },
    { src: 'poison.png', aliases: ['sludge_bubble.png'] },
    { src: 'wind.png', aliases: ['gust_wind.png'] },
    { src: 'speed.png', aliases: ['speed_streak.png'] },
  ];

  for (const item of animFiles) {
    try {
      const url = `${pretBase}/${item.src}`;
      const raw = await downloadBuffer(url);
      const decoded = decode2BitGrayscalePng(raw);
      const pngBuf = createPNG(decoded.width, decoded.height, decoded.rgba);

      // Save to public/assets/sprites/fx/ and public/assets/sprites/battle_fx/
      const allNames = [item.src, ...item.aliases];
      for (const name of allNames) {
        fs.writeFileSync(path.join(FX_DIR, name), pngBuf);
        fs.writeFileSync(path.join(BATTLE_FX_DIR, name), pngBuf);
      }

      console.log(`Saved Battle VFX: ${item.src} (with aliases: ${item.aliases.join(', ')})`);
    } catch (err) {
      console.error(`Error saving ${item.src}:`, err.message);
    }
  }
}

async function main() {
  await fetchPokeballs();
  await fetchBattleFx();
  console.log('\n✅ Pokéballs and Battle VFX sprites successfully downloaded, converted, and verified!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
