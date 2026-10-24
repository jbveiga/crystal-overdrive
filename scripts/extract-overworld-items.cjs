/**
 * extract-overworld-items.cjs
 * Comprehensive extraction script for Pokémon Crystal scattered overworld items:
 * - Visible Item Balls (OBJECTTYPE_ITEMBALL)
 * - Hidden Items (BGEVENT_ITEM)
 * - Fruit Trees (SPRITE_FRUIT_TREE / fruittree)
 *
 * Source: scripts/pokecrystal_raw/maps__*.asm
 * Target: public/assets/data/overworld_items.json
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const RAW_DIR = path.join(__dirname, 'pokecrystal_raw');
const OUTPUT_FILE = path.join(projectRoot, 'public/assets/data/overworld_items.json');
const MAPS_DIR = path.join(projectRoot, 'public/assets/data/maps');

// 1. Fruit tree berry table from pokecrystal data/items/fruit_trees.asm
const FRUIT_TREE_ITEMS = {
  FRUITTREE_ROUTE_29: 'berry',
  FRUITTREE_ROUTE_30_1: 'berry',
  FRUITTREE_ROUTE_38: 'berry',
  FRUITTREE_ROUTE_46_1: 'berry',
  FRUITTREE_ROUTE_30_2: 'psncureberry',
  FRUITTREE_ROUTE_33: 'psncureberry',
  FRUITTREE_ROUTE_31: 'bitter_berry',
  FRUITTREE_ROUTE_43: 'bitter_berry',
  FRUITTREE_VIOLET_CITY: 'przcureberry',
  FRUITTREE_ROUTE_46_2: 'przcureberry',
  FRUITTREE_ROUTE_35: 'mysteryberry',
  FRUITTREE_ROUTE_45: 'mysteryberry',
  FRUITTREE_ROUTE_36: 'ice_berry',
  FRUITTREE_ROUTE_26: 'ice_berry',
  FRUITTREE_ROUTE_39: 'mint_berry',
  FRUITTREE_ROUTE_44: 'burnt_berry',
  FRUITTREE_ROUTE_37_1: 'red_apricorn',
  FRUITTREE_ROUTE_37_2: 'blu_apricorn',
  FRUITTREE_ROUTE_37_3: 'blk_apricorn',
  FRUITTREE_AZALEA_TOWN: 'wht_apricorn',
  FRUITTREE_ROUTE_42_1: 'pnk_apricorn',
  FRUITTREE_ROUTE_42_2: 'grn_apricorn',
  FRUITTREE_ROUTE_42_3: 'ylw_apricorn',
  FRUITTREE_ROUTE_11: 'berry',
  FRUITTREE_ROUTE_2: 'psncureberry',
  FRUITTREE_ROUTE_1: 'bitter_berry',
  FRUITTREE_ROUTE_8: 'przcureberry',
  FRUITTREE_PEWTER_CITY_1: 'ice_berry',
  FRUITTREE_PEWTER_CITY_2: 'mint_berry',
  FRUITTREE_FUCHSIA_CITY: 'burnt_berry',
};

// 2. Kanto Landmark set for regional division
const KANTO_LANDMARKS = new Set([
  'LANDMARK_PALLET_TOWN',
  'LANDMARK_VIRIDIAN_CITY',
  'LANDMARK_PEWTER_CITY',
  'LANDMARK_CERULEAN_CITY',
  'LANDMARK_VERMILION_CITY',
  'LANDMARK_LAVENDER_TOWN',
  'LANDMARK_CELADON_CITY',
  'LANDMARK_FUCHSIA_CITY',
  'LANDMARK_SAFFRON_CITY',
  'LANDMARK_CINNABAR_ISLAND',
  'LANDMARK_INDIGO_PLATEAU',
  'LANDMARK_ROUTE_1',
  'LANDMARK_ROUTE_2',
  'LANDMARK_ROUTE_3',
  'LANDMARK_ROUTE_4',
  'LANDMARK_ROUTE_5',
  'LANDMARK_ROUTE_6',
  'LANDMARK_ROUTE_7',
  'LANDMARK_ROUTE_8',
  'LANDMARK_ROUTE_9',
  'LANDMARK_ROUTE_10',
  'LANDMARK_ROUTE_11',
  'LANDMARK_ROUTE_12',
  'LANDMARK_ROUTE_13',
  'LANDMARK_ROUTE_14',
  'LANDMARK_ROUTE_15',
  'LANDMARK_ROUTE_16',
  'LANDMARK_ROUTE_17',
  'LANDMARK_ROUTE_18',
  'LANDMARK_ROUTE_19',
  'LANDMARK_ROUTE_20',
  'LANDMARK_ROUTE_21',
  'LANDMARK_ROUTE_22',
  'LANDMARK_ROUTE_23',
  'LANDMARK_ROUTE_24',
  'LANDMARK_ROUTE_25',
  'LANDMARK_ROUTE_26',
  'LANDMARK_ROUTE_27',
  'LANDMARK_ROUTE_28',
  'LANDMARK_MT_MOON',
  'LANDMARK_ROCK_TUNNEL',
  'LANDMARK_DIGLETTS_CAVE',
  'LANDMARK_UNDERGROUND_PATH',
  'LANDMARK_POWER_PLANT',
  'LANDMARK_SEAFOAM_ISLANDS',
  'LANDMARK_VICTORY_ROAD',
  'LANDMARK_TOHJO_FALLS',
  'LANDMARK_SILVER_CAVE',
  'LANDMARK_LAV_RADIO_TOWER',
]);

// 3. Known Map overrides
const CUSTOM_MAP = {
  BillsFamilysHouse: 'goldenrod_bill_house',
  CeruleanGymBadgeSpeechHouse: 'cerulean_badge_house',
  CeruleanTradeSpeechHouse: 'cerulean_trade_house',
  MahoganyMart1F: 'mahogany_mart',
  PewterNidoranSpeechHouse: 'pewter_nidoran_house',
  PewterSnoozeSpeechHouse: 'pewter_snooze_house',
  Route5UndergroundPathEntrance: 'route_5_underground_entrance',
  Route6UndergroundPathEntrance: 'route_6_underground_entrance',
  VermilionDiglettsCaveSpeechHouse: 'vermilion_digletts_house',
  VermilionFishingSpeechHouse: 'vermilion_fishing_house',
  VermilionMagnetTrainSpeechHouse: 'vermilion_magnet_train_house',
  ViridianNicknameSpeechHouse: 'viridian_nickname_house',
};

const existingJsonMaps = new Set(
  fs.existsSync(MAPS_DIR)
    ? fs
        .readdirSync(MAPS_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''))
    : []
);

function pascalToSnake(str) {
  return str
    .replace(/(B?\d+)F(?=[A-Z]|$)/g, '_$1f_')
    .replace(/(Route)(\d+)([A-Z])/g, '$1_$2_$3')
    .replace(/(Route)(\d+)/g, '$1_$2')
    .replace(/Pokecenter/g, 'PokeCenter')
    .replace(/Room(\d)/g, 'Room_$1')
    .replace(/Gate/g, '_Gate')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function resolveMapId(asmName) {
  if (CUSTOM_MAP[asmName]) return CUSTOM_MAP[asmName];
  const snake = pascalToSnake(asmName);
  if (existingJsonMaps.has(snake)) return snake;
  if (snake.endsWith('_poke_center_1f')) {
    const alt = snake.replace(/_poke_center_1f$/, '_poke_center');
    if (existingJsonMaps.has(alt)) return alt;
  }
  return snake;
}

// Read Landmark mappings
const mapsAsmPath = path.join(RAW_DIR, 'data__maps__maps.asm');
const mapToLandmark = {};
if (fs.existsSync(mapsAsmPath)) {
  const mapsAsm = fs.readFileSync(mapsAsmPath, 'utf8');
  for (const m of mapsAsm.matchAll(/map\s+(\w+),\s*\w+,\s*\w+,\s*(\w+)/g)) {
    mapToLandmark[m[1]] = m[2];
  }
}

function getRegion(asmName) {
  const landmark = mapToLandmark[asmName];
  if (landmark && KANTO_LANDMARKS.has(landmark)) return 'kanto';
  return 'johto';
}

function main() {
  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.startsWith('maps__') && f.endsWith('.asm'))
    .sort();

  const itemBalls = [];
  const hiddenItems = [];
  const fruitTrees = [];
  const byMap = {};

  function ensureMapEntry(mapId, region) {
    if (!byMap[mapId]) {
      byMap[mapId] = {
        mapId,
        region,
        itemBalls: [],
        hiddenItems: [],
        fruitTrees: [],
      };
    }
    return byMap[mapId];
  }

  for (const file of files) {
    const asmName = file.replace('maps__', '').replace('.asm', '');
    const content = fs.readFileSync(path.join(RAW_DIR, file), 'utf8');
    const mapId = resolveMapId(asmName);
    const region = getRegion(asmName);

    // 1. Visible Item Balls
    const itemBallRegex =
      /object_event\s+(\d+),\s*(\d+),\s*SPRITE_POKE_BALL,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*OBJECTTYPE_ITEMBALL,\s*[^,]+,\s*([A-Za-z0-9_]+),\s*([A-Za-z0-9_]+)/g;
    let match;
    while ((match = itemBallRegex.exec(content)) !== null) {
      const [_, xStr, yStr, label, eventFlag] = match;
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);

      const labelRegex = new RegExp(`${label}:\\s*(?:\\r?\\n)\\s*itemball\\s+([A-Za-z0-9_]+)`);
      const labelMatch = content.match(labelRegex);
      if (!labelMatch) {
        throw new Error(`Failed to resolve itemball label ${label} in ${file}`);
      }

      const rawItem = labelMatch[1];
      const itemId = rawItem.toLowerCase();
      const entryId = `${mapId}_${x}_${y}_${itemId}`;

      const entry = {
        id: entryId,
        mapId,
        region,
        x,
        y,
        itemId,
        eventFlag,
      };

      itemBalls.push(entry);
      ensureMapEntry(mapId, region).itemBalls.push(entry);
    }

    // 2. Hidden Items
    const hiddenRegex = /bg_event\s+(\d+),\s*(\d+),\s*BGEVENT_ITEM,\s*([A-Za-z0-9_]+)/g;
    while ((match = hiddenRegex.exec(content)) !== null) {
      const [_, xStr, yStr, label] = match;
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);

      const labelRegex = new RegExp(
        `${label}:\\s*(?:\\r?\\n)\\s*hiddenitem\\s+([A-Za-z0-9_]+),\\s*([A-Za-z0-9_]+)`
      );
      const labelMatch = content.match(labelRegex);
      if (!labelMatch) {
        throw new Error(`Failed to resolve hiddenitem label ${label} in ${file}`);
      }

      const rawItem = labelMatch[1];
      const eventFlag = labelMatch[2];
      const itemId = rawItem.toLowerCase();
      const entryId = `${mapId}_hidden_${x}_${y}_${itemId}`;

      const entry = {
        id: entryId,
        mapId,
        region,
        x,
        y,
        itemId,
        eventFlag,
      };

      hiddenItems.push(entry);
      ensureMapEntry(mapId, region).hiddenItems.push(entry);
    }

    // 3. Fruit Trees
    const fruitRegex =
      /object_event\s+(\d+),\s*(\d+),\s*SPRITE_FRUIT_TREE,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*OBJECTTYPE_SCRIPT,\s*[^,]+,\s*([A-Za-z0-9_]+),\s*-1/g;
    while ((match = fruitRegex.exec(content)) !== null) {
      const [_, xStr, yStr, label] = match;
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);

      const labelRegex = new RegExp(`${label}:\\s*(?:\\r?\\n)\\s*fruittree\\s+([A-Za-z0-9_]+)`);
      const labelMatch = content.match(labelRegex);
      if (!labelMatch) {
        throw new Error(`Failed to resolve fruittree label ${label} in ${file}`);
      }

      const treeId = labelMatch[1];
      const berryId = FRUIT_TREE_ITEMS[treeId];
      if (!berryId) {
        throw new Error(`Unknown fruit tree constant ${treeId} in ${file}`);
      }

      const entryId = `${mapId}_tree_${x}_${y}_${berryId}`;

      const entry = {
        id: entryId,
        mapId,
        region,
        x,
        y,
        berryId,
        treeId,
      };

      fruitTrees.push(entry);
      ensureMapEntry(mapId, region).fruitTrees.push(entry);
    }
  }

  // Summary statistics calculation
  const johto = {
    itemBalls: itemBalls.filter((i) => i.region === 'johto').length,
    hiddenItems: hiddenItems.filter((i) => i.region === 'johto').length,
    fruitTrees: fruitTrees.filter((i) => i.region === 'johto').length,
    total: 0,
  };
  johto.total = johto.itemBalls + johto.hiddenItems + johto.fruitTrees;

  const kanto = {
    itemBalls: itemBalls.filter((i) => i.region === 'kanto').length,
    hiddenItems: hiddenItems.filter((i) => i.region === 'kanto').length,
    fruitTrees: fruitTrees.filter((i) => i.region === 'kanto').length,
    total: 0,
  };
  kanto.total = kanto.itemBalls + kanto.hiddenItems + kanto.fruitTrees;

  const summary = {
    totalItemBalls: itemBalls.length,
    totalHiddenItems: hiddenItems.length,
    totalFruitTrees: fruitTrees.length,
    total: itemBalls.length + hiddenItems.length + fruitTrees.length,
    totalMapsWithItems: Object.keys(byMap).length,
    johto,
    kanto,
  };

  const outputData = {
    summary,
    itemBalls,
    hiddenItems,
    fruitTrees,
    byMap,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf8');

  console.log('✅ Overworld item extraction complete!');
  console.log(`📁 Saved to: ${OUTPUT_FILE}`);
  console.log('📊 Summary:');
  console.log(JSON.stringify(summary, null, 2));
}

main();
