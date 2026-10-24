const fs = require('fs');
const path = require('path');

const MAPS_DIR = path.resolve(__dirname, '../public/assets/data/maps');
const RAW_DIR = path.resolve(__dirname, 'pokecrystal_raw');

const GRASS_WEIGHTS = [30, 30, 20, 10, 5, 4, 1];
const WATER_WEIGHTS = [60, 30, 10];

function normalizeSpecies(raw) {
  let s = raw.toLowerCase().trim();
  if (s === 'nidoran_m') return 'nidoran-m';
  if (s === 'nidoran_f') return 'nidoran-f';
  if (s === 'mr__mime' || s === 'mr_mime') return 'mrmime';
  if (s === 'ho_oh') return 'ho-oh';
  return s;
}

function parseGrassAsm(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const blocks = content.split(/def_grass_wildmons\s+/);
  const result = {};

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split('\n').map((l) => l.trim());
    const mapName = lines[0].toLowerCase();

    let currentPeriod = null;
    const slots = [];
    let periodSlotIndex = 0;

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.startsWith('end_grass_wildmons')) break;

      if (line.startsWith('; morn')) {
        currentPeriod = 'MORNING';
        periodSlotIndex = 0;
        continue;
      }
      if (line.startsWith('; day')) {
        currentPeriod = 'DAY';
        periodSlotIndex = 0;
        continue;
      }
      if (line.startsWith('; nite')) {
        currentPeriod = 'NIGHT';
        periodSlotIndex = 0;
        continue;
      }

      const match = line.match(/^db\s+(\d+)\s*,\s*([A-Za-z0-9_]+)/);
      if (match && currentPeriod) {
        const level = parseInt(match[1], 10);
        const speciesId = normalizeSpecies(match[2]);
        const weight = GRASS_WEIGHTS[periodSlotIndex % GRASS_WEIGHTS.length];
        slots.push({
          speciesId,
          minLevel: level,
          maxLevel: level,
          weight,
          timeOfDay: currentPeriod,
        });
        periodSlotIndex++;
      }
    }

    if (mapName === 'ruins_of_alph_inner_chamber' || mapName === 'ruins_of_alph_outside') {
      result[mapName] = [
        {
          speciesId: 'unown',
          minLevel: 5,
          maxLevel: 5,
          weight: 100,
        },
      ];
    } else if (mapName === 'union_cave_b2f') {
      slots.push({
        speciesId: 'wooper',
        minLevel: 18,
        maxLevel: 22,
        weight: 5,
        timeOfDay: 'NIGHT',
      });
      result[mapName] = slots;
    } else if (slots.length > 0) {
      result[mapName] = slots;
    }
  }

  return result;
}

function parseWaterAsm(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const blocks = content.split(/def_water_wildmons\s+/);
  const result = {};

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split('\n').map((l) => l.trim());
    const mapName = lines[0].toLowerCase();

    const slots = [];
    let slotIndex = 0;

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.startsWith('end_water_wildmons')) break;

      const match = line.match(/^db\s+(\d+)\s*,\s*([A-Za-z0-9_]+)/);
      if (match) {
        const level = parseInt(match[1], 10);
        const speciesId = normalizeSpecies(match[2]);
        const weight = WATER_WEIGHTS[slotIndex % WATER_WEIGHTS.length];
        slots.push({
          speciesId,
          minLevel: level,
          maxLevel: level,
          weight,
        });
        slotIndex++;
      }
    }

    if (slots.length > 0) {
      result[mapName] = slots;
    }
  }

  return result;
}

function run() {
  console.log('--- Syncing Authentic Pokemon Crystal Wild Encounters ---');

  const johtoGrass = parseGrassAsm(path.join(RAW_DIR, 'data__wild__johto_grass.asm'));
  const kantoGrass = parseGrassAsm(path.join(RAW_DIR, 'data__wild__kanto_grass.asm'));
  const allGrass = { ...johtoGrass, ...kantoGrass };

  const johtoWater = parseWaterAsm(path.join(RAW_DIR, 'data__wild__johto_water.asm'));

  let updatedGrassCount = 0;
  let updatedWaterCount = 0;

  for (const [mapId, encounters] of Object.entries(allGrass)) {
    const filePath = path.join(MAPS_DIR, `${mapId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const mapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        mapData.grassEncounters = encounters;
        fs.writeFileSync(filePath, JSON.stringify(mapData, null, 2) + '\n', 'utf8');
        updatedGrassCount++;
      } catch (err) {
        console.error(`Failed to update ${mapId}.json:`, err.message);
      }
    }
  }

  for (const [mapId, encounters] of Object.entries(johtoWater)) {
    const filePath = path.join(MAPS_DIR, `${mapId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const mapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        mapData.waterEncounters = encounters;
        fs.writeFileSync(filePath, JSON.stringify(mapData, null, 2) + '\n', 'utf8');
        updatedWaterCount++;
      } catch (err) {
        console.error(`Failed to update water for ${mapId}.json:`, err.message);
      }
    }
  }

  console.log(`Successfully updated grass encounters for ${updatedGrassCount} maps.`);
  console.log(`Successfully updated water encounters for ${updatedWaterCount} maps.`);
}

run();
