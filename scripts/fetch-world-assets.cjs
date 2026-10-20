const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'pokecrystal_raw');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'https://raw.githubusercontent.com/pret/pokecrystal/master';

const TILESET_FILES = [
  'gfx/tilesets/roofs/azalea.png',
  'gfx/tilesets/roofs/olivine.png',
  'gfx/tilesets/roofs/goldenrod.png',
  // Cave
  'gfx/tilesets/cave.png',
  'gfx/tilesets/cave_palette_map.asm',
  'data/tilesets/cave_metatiles.bin',
  'data/tilesets/cave_collision.asm',
  // Forest
  'gfx/tilesets/forest.png',
  'gfx/tilesets/forest_palette_map.asm',
  'data/tilesets/forest_metatiles.bin',
  'data/tilesets/forest_collision.asm',
  // Facility
  'gfx/tilesets/facility.png',
  'gfx/tilesets/facility_palette_map.asm',
  'data/tilesets/facility_metatiles.bin',
  'data/tilesets/facility_collision.asm',
  // Radio Tower
  'gfx/tilesets/radio_tower.png',
  'gfx/tilesets/radio_tower_palette_map.asm',
  'data/tilesets/radio_tower_metatiles.bin',
  'data/tilesets/radio_tower_collision.asm',
  // Traditional House
  'gfx/tilesets/traditional_house.png',
  'gfx/tilesets/traditional_house_palette_map.asm',
  'data/tilesets/traditional_house_metatiles.bin',
  'data/tilesets/traditional_house_collision.asm',
  // Underground
  'gfx/tilesets/underground.png',
  'gfx/tilesets/underground_palette_map.asm',
  'data/tilesets/underground_metatiles.bin',
  'data/tilesets/underground_collision.asm',
  // Park
  'gfx/tilesets/park.png',
  'gfx/tilesets/park_palette_map.asm',
  'data/tilesets/park_metatiles.bin',
  'data/tilesets/park_collision.asm',
];

const PHASE7_MAP_FILES = [
  // Route 32
  'maps/Route32.blk',
  'maps/Route32.asm',
  'maps/Route32RuinsOfAlphGate.blk',
  'maps/Route32RuinsOfAlphGate.asm',
  'maps/Route32Pokecenter1F.blk',
  'maps/Route32Pokecenter1F.asm',
  // Ruins of Alph
  'maps/RuinsOfAlphOutside.blk',
  'maps/RuinsOfAlphOutside.asm',
  'maps/RuinsOfAlphResearchCenter.blk',
  'maps/RuinsOfAlphResearchCenter.asm',
  // Union Cave
  'maps/UnionCave1F.blk',
  'maps/UnionCave1F.asm',
  'maps/UnionCaveB1F.blk',
  'maps/UnionCaveB1F.asm',
  'maps/UnionCaveB2F.blk',
  'maps/UnionCaveB2F.asm',
  // Route 33
  'maps/Route33.blk',
  'maps/Route33.asm',
  // Azalea Town
  'maps/AzaleaTown.blk',
  'maps/AzaleaTown.asm',
  'maps/AzaleaMart.blk',
  'maps/AzaleaMart.asm',
  'maps/AzaleaPokecenter1F.blk',
  'maps/AzaleaPokecenter1F.asm',
  'maps/AzaleaGym.blk',
  'maps/AzaleaGym.asm',
  'maps/KurtsHouse.blk',
  'maps/KurtsHouse.asm',
  'maps/CharcoalKiln.blk',
  'maps/CharcoalKiln.asm',
  // Slowpoke Well
  'maps/SlowpokeWellB1F.blk',
  'maps/SlowpokeWellB1F.asm',
  'maps/SlowpokeWellB2F.blk',
  'maps/SlowpokeWellB2F.asm',
];

async function download(relPath) {
  const dest = path.join(OUT_DIR, relPath.replace(/\//g, '__'));
  if (fs.existsSync(dest)) return;
  const url = `${BASE_URL}/${relPath}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ⚠️ Failed ${res.status}: ${relPath}`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`  Downloaded: ${relPath}`);
  } catch (err) {
    console.warn(`  ⚠️ Error fetching ${relPath}: ${err.message}`);
  }
}

async function main() {
  console.log('Downloading Phase 7 tilesets and map files from pret/pokecrystal...');
  for (const f of [...TILESET_FILES, ...PHASE7_MAP_FILES]) {
    await download(f);
  }
  console.log('Phase 7 downloads complete.');
}

main().catch(console.error);
