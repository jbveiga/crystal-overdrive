const fs = require('fs');
const path = require('path');

const OUT_DIR = '/Users/bernardo/.gemini/antigravity/brain/4243653b-22ad-4a20-bb03-8ed14dca67e2/scratch/pokecrystal_raw';
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'https://raw.githubusercontent.com/pret/pokecrystal/master';

const FILES = [
  'gfx/tilesets/johto.png',
  'gfx/tilesets/roofs/new_bark.png',
  'gfx/tilesets/water/water.png',
  'gfx/tilesets/flower/cgb_1.png',
  'gfx/tilesets/bg_tiles.pal',
  'gfx/tilesets/roofs.pal',
  'gfx/tilesets/johto_palette_map.asm',
  'data/tilesets/johto_metatiles.bin',
  'data/tilesets/johto_collision.asm',
  'data/maps/roofs.asm',
  'data/maps/maps.asm',
  'maps/NewBarkTown.blk',
  'maps/NewBarkTown.asm',
  'maps/Route29.blk',
  'maps/Route29.asm',
  'maps/CherrygroveCity.blk',
  'maps/CherrygroveCity.asm',
];

async function main() {
  for (const relPath of FILES) {
    const url = `${BASE_URL}/${relPath}`;
    const dest = path.join(OUT_DIR, relPath.replace(/\//g, '__'));
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Warning: Failed to fetch ${url} (${res.status})`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`Fetched ${relPath} (${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
