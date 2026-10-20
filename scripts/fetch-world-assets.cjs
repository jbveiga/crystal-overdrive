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

const PHASE8_MAP_FILES = [
  // Ilex Forest & Route 34
  'maps/IlexForest.blk',
  'maps/IlexForest.asm',
  'maps/Route34.blk',
  'maps/Route34.asm',
  'maps/Route34IlexForestGate.blk',
  'maps/Route34IlexForestGate.asm',
  'maps/DayCare.blk',
  'maps/DayCare.asm',
  // Goldenrod City
  'maps/GoldenrodCity.blk',
  'maps/GoldenrodCity.asm',
  'maps/GoldenrodPokecenter1F.blk',
  'maps/GoldenrodPokecenter1F.asm',
  'maps/GoldenrodGym.blk',
  'maps/GoldenrodGym.asm',
  'maps/GoldenrodBikeShop.blk',
  'maps/GoldenrodBikeShop.asm',
  'maps/GoldenrodGameCorner.blk',
  'maps/GoldenrodGameCorner.asm',
  'maps/GoldenrodFlowerShop.blk',
  'maps/GoldenrodFlowerShop.asm',
  'maps/GoldenrodNameRater.blk',
  'maps/GoldenrodNameRater.asm',
  'maps/GoldenrodMagnetTrainStation.blk',
  'maps/GoldenrodMagnetTrainStation.asm',
  'maps/GoldenrodBillsHouse.blk',
  'maps/GoldenrodBillsHouse.asm',
  // Goldenrod Underground
  'maps/GoldenrodUnderground.blk',
  'maps/GoldenrodUnderground.asm',
  'maps/GoldenrodUndergroundSwitchRoomEntrances.blk',
  'maps/GoldenrodUndergroundSwitchRoomEntrances.asm',
  // Goldenrod Dept Store
  'maps/GoldenrodDeptStore1F.blk',
  'maps/GoldenrodDeptStore1F.asm',
  'maps/GoldenrodDeptStore2F.blk',
  'maps/GoldenrodDeptStore2F.asm',
  'maps/GoldenrodDeptStore3F.blk',
  'maps/GoldenrodDeptStore3F.asm',
  'maps/GoldenrodDeptStore4F.blk',
  'maps/GoldenrodDeptStore4F.asm',
  'maps/GoldenrodDeptStore5F.blk',
  'maps/GoldenrodDeptStore5F.asm',
  'maps/GoldenrodDeptStore6F.blk',
  'maps/GoldenrodDeptStore6F.asm',
  'maps/GoldenrodDeptStoreElevator.blk',
  'maps/GoldenrodDeptStoreElevator.asm',
  'maps/GoldenrodDeptStoreRoof.blk',
  'maps/GoldenrodDeptStoreRoof.asm',
  // Radio Tower
  'maps/RadioTower1F.blk',
  'maps/RadioTower1F.asm',
  'maps/RadioTower2F.blk',
  'maps/RadioTower2F.asm',
  'maps/RadioTower3F.blk',
  'maps/RadioTower3F.asm',
  'maps/RadioTower4F.blk',
  'maps/RadioTower4F.asm',
  'maps/RadioTower5F.blk',
  'maps/RadioTower5F.asm',
];

const PHASE9_MAP_FILES = [
  // Route 35, National Park, Route 36, Route 37
  'maps/Route35.blk',
  'maps/Route35.asm',
  'maps/Route35NationalParkGate.asm',
  'maps/Route36NationalParkGate.asm',
  'maps/NationalPark.blk',
  'maps/NationalPark.asm',
  'maps/Route36.blk',
  'maps/Route36.asm',
  'maps/Route36RuinsOfAlphGate.asm',
  'maps/Route37.blk',
  'maps/Route37.asm',
  // Ecruteak City
  'maps/EcruteakCity.blk',
  'maps/EcruteakCity.asm',
  'maps/EcruteakPokecenter1F.asm',
  'maps/EcruteakMart.asm',
  'maps/EcruteakGym.blk',
  'maps/EcruteakGym.asm',
  'maps/DanceTheater.blk',
  'maps/DanceTheater.asm',
  'maps/EcruteakItemfinderHouse.asm',
  // Burned Tower & Tin Tower
  'maps/BurnedTower1F.blk',
  'maps/BurnedTower1F.asm',
  'maps/BurnedTowerB1F.blk',
  'maps/BurnedTowerB1F.asm',
  'maps/TinTower1F.blk',
  'maps/TinTower1F.asm',
  'maps/TinTowerRoof.blk',
  'maps/TinTowerRoof.asm',
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
  console.log('Downloading Phase 7, 8 & 9 tilesets and map files from pret/pokecrystal...');
  for (const f of [...TILESET_FILES, ...PHASE7_MAP_FILES, ...PHASE8_MAP_FILES, ...PHASE9_MAP_FILES]) {
    await download(f);
  }
  console.log('Downloads complete.');
}

main().catch(console.error);
