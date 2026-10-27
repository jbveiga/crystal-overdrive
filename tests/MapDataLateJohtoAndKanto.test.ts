import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../src/types/game';
import { MapManager } from '../src/world/MapManager';
import { npcsByMap, getNpcsForMap } from '../src/world/npcData';
import { OverworldItemManager } from '../src/world/OverworldItemManager';
import { MissionManager } from '../src/world/MissionManager';

const getAllInteractionSrc = () => {
  const interactionsDir = path.resolve(__dirname, '../src/world/interactions');
  const worldDir = path.resolve(__dirname, '../src/world');
  let src = fs
    .readdirSync(interactionsDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => fs.readFileSync(path.join(interactionsDir, f), 'utf8'))
    .join('\n');
  const overworldFiles = [
    'OverworldWarpAndMapTransitionController.ts',
    'OverworldTrainerSightAndTourController.ts',
    'OverworldTickerCoordinator.ts',
  ];
  for (const ofile of overworldFiles) {
    const p = path.join(worldDir, ofile);
    if (fs.existsSync(p)) {
      src += '\n' + fs.readFileSync(p, 'utf8');
    }
  }
  return src;
};

const getAllNpcDataSrc = () => {
  const npcDataPath = path.resolve(__dirname, '../src/world/npcData.ts');
  const npcsDir = path.resolve(__dirname, '../src/world/npcs');
  let src = fs.readFileSync(npcDataPath, 'utf8');
  if (fs.existsSync(npcsDir)) {
    const files = fs.readdirSync(npcsDir).filter((f) => f.endsWith('.ts'));
    for (const f of files) {
      src += '\n' + fs.readFileSync(path.join(npcsDir, f), 'utf8');
    }
  }
  return src;
};

const getAllStartMenuSrc = () => {
  const startMenuPath = path.resolve(__dirname, '../src/ui/StartMenuUI.ts');
  const startMenuDir = path.resolve(__dirname, '../src/ui/start-menu');
  let src = fs.readFileSync(startMenuPath, 'utf8');
  if (fs.existsSync(startMenuDir)) {
    const files = fs.readdirSync(startMenuDir).filter((f) => f.endsWith('.ts'));
    for (const f of files) {
      src += '\n' + fs.readFileSync(path.join(startMenuDir, f), 'utf8');
    }
  }
  return src;
};


describe("MapData & Authentic Tile Integrity — Mid & Late Johto", () => {
  it('validates Phase 7 South Johto authentic maps, tile PNGs, reciprocal warps, and Azalea Gym Leader Bugsy', () => {
    const phase7Maps = [
      'route_32',
      'route_32_poke_center',
      'route_32_ruins_of_alph_gate',
      'ruins_of_alph_outside',
      'ruins_of_alph_research_center',
      'union_cave_1f',
      'union_cave_b1f',
      'union_cave_b2f',
      'route_33',
      'azalea_town',
      'azalea_poke_center',
      'azalea_mart',
      'azalea_gym',
      'kurts_house',
      'charcoal_kiln',
      'slowpoke_well_b1f',
      'slowpoke_well_b2f',
    ];

    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    for (const mapId of phase7Maps) {
      const mapPath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
      expect(fs.existsSync(mapPath), `Map file for ${mapId} must exist`).toBe(true);

      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(mapData.width).toBeGreaterThan(0);
      expect(mapData.height).toBeGreaterThan(0);
      expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);
      expect(mapData.tileMap?.length).toBe(mapData.width * mapData.height);

      // Verify referenced tiles exist on disk
      for (const tile of new Set(mapData.tileMap!)) {
        expect(fs.existsSync(path.join(tilesDir, `${tile}.png`)), `Tile ${tile}.png must exist for ${mapId}`).toBe(true);
      }
    }

    // Outdoor classification verification
    expect(MapManager.isOutdoorMap('route_32')).toBe(true);
    expect(MapManager.isOutdoorMap('ruins_of_alph_outside')).toBe(true);
    expect(MapManager.isOutdoorMap('route_33')).toBe(true);
    expect(MapManager.isOutdoorMap('azalea_town')).toBe(true);
    expect(MapManager.isOutdoorMap('azalea_gym')).toBe(false);
    expect(MapManager.isOutdoorMap('union_cave_1f')).toBe(false);

    // Reciprocal Warp Verifications
    const r32Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_32.json'), 'utf8'));
    const uc1fData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/union_cave_1f.json'), 'utf8'));
    const r33Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_33.json'), 'utf8'));
    const azaleaData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/azalea_town.json'), 'utf8'));
    const gymData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/azalea_gym.json'), 'utf8'));
    const wellB1fData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/slowpoke_well_b1f.json'), 'utf8'));

    // Route 32 <-> Union Cave 1F
    const r32ToUc = r32Data.warps.find((w) => w.targetMapId === 'union_cave_1f');
    expect(r32ToUc).toBeDefined();
    expect(r32ToUc?.x).toBe(6);
    expect(r32ToUc?.y).toBe(79);

    const ucToR32 = uc1fData.warps.find((w) => w.targetMapId === 'route_32');
    expect(ucToR32).toBeDefined();
    expect(ucToR32?.x).toBe(17);
    expect(ucToR32?.y).toBe(3);

    // Union Cave 1F <-> Route 33
    const ucToR33 = uc1fData.warps.find((w) => w.targetMapId === 'route_33');
    expect(ucToR33).toBeDefined();
    expect(ucToR33?.x).toBe(17);
    expect(ucToR33?.y).toBe(31);

    const r33ToUc = r33Data.warps.find((w) => w.targetMapId === 'union_cave_1f');
    expect(r33ToUc).toBeDefined();
    expect(r33ToUc?.x).toBe(11);
    expect(r33ToUc?.y).toBe(1);

    // Azalea Town <-> Azalea Gym
    const azaleaToGym = azaleaData.warps.find((w) => w.targetMapId === 'azalea_gym');
    expect(azaleaToGym).toBeDefined();
    expect(azaleaToGym?.x).toBe(10);
    expect(azaleaToGym?.y).toBe(15);

    const gymExit = gymData.warps.find((w) => w.targetMapId === 'azalea_town');
    expect(gymExit).toBeDefined();

    // Azalea Town <-> Slowpoke Well B1F
    const azaleaToWell = azaleaData.warps.find((w) => w.targetMapId === 'slowpoke_well_b1f');
    expect(azaleaToWell).toBeDefined();
    expect(azaleaToWell?.x).toBe(31);
    expect(azaleaToWell?.y).toBe(7);

    const wellExit = wellB1fData.warps.find((w) => w.targetMapId === 'azalea_town');
    expect(wellExit).toBeDefined();
    expect(wellExit?.x).toBe(17);
    expect(wellExit?.y).toBe(15);

    // Leader Bugsy boss registration in npcsByMap and main.ts
    const bugsyNpc = npcsByMap.azalea_gym.find((npc) => npc.id === 'bugsy');
    expect(bugsyNpc).toBeDefined();
    expect(bugsyNpc?.action).toBe('BUGSY_EVENT');
    expect(bugsyNpc?.trainerId).toBe('bugsy');
    expect(bugsyNpc?.trainerPokemon?.speciesId).toBe('scyther');
    expect(bugsyNpc?.trainerTeam?.length).toBe(3);

    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      ) +
      '\n' +
      getAllInteractionSrc();
    expect(mainSrc).toMatch(/(action === 'BUGSY_EVENT'|'BUGSY_EVENT')/);
    expect(mainSrc).toContain("inventory.badges.includes('hive')");
    expect(mainSrc).toContain("inventory.tms.includes('TM49')");
  });

  it('validates Phase 8 Goldenrod Metropolis & Day-Care Route 34 maps, reciprocal warps, and Leader Whitney', () => {
    const phase8Maps = [
      'ilex_forest',
      'route_34_ilex_forest_gate',
      'route_34',
      'day_care',
      'goldenrod_city',
      'goldenrod_gym',
      'goldenrod_poke_center',
      'goldenrod_bike_shop',
      'goldenrod_game_corner',
      'goldenrod_flower_shop',
      'goldenrod_name_rater',
      'goldenrod_bill_house',
      'goldenrod_magnet_train_station',
      'goldenrod_underground',
      'goldenrod_dept_store_1f',
      'goldenrod_dept_store_2f',
      'goldenrod_dept_store_3f',
      'goldenrod_dept_store_4f',
      'goldenrod_dept_store_5f',
      'goldenrod_dept_store_6f',
      'goldenrod_dept_store_roof',
      'radio_tower_1f',
      'radio_tower_2f',
      'radio_tower_3f',
      'radio_tower_4f',
      'radio_tower_5f',
    ];

    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    for (const mapId of phase8Maps) {
      const mapPath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
      expect(fs.existsSync(mapPath), `Map file for ${mapId} must exist`).toBe(true);

      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(mapData.width).toBeGreaterThan(0);
      expect(mapData.height).toBeGreaterThan(0);
      expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);
      expect(mapData.tileMap?.length).toBe(mapData.width * mapData.height);

      for (const tile of new Set(mapData.tileMap!)) {
        expect(fs.existsSync(path.join(tilesDir, `${tile}.png`)), `Tile ${tile}.png must exist for ${mapId}`).toBe(true);
      }
    }

    // Outdoor classification verification
    expect(MapManager.isOutdoorMap('route_34')).toBe(true);
    expect(MapManager.isOutdoorMap('goldenrod_city')).toBe(true);
    expect(MapManager.isOutdoorMap('goldenrod_dept_store_roof')).toBe(true);
    expect(MapManager.isOutdoorMap('goldenrod_gym')).toBe(false);
    expect(MapManager.isOutdoorMap('goldenrod_underground')).toBe(false);

    // Route 34 <-> Goldenrod City boundary connection
    const r34Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_34.json'), 'utf8'));
    const goldenrodData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/goldenrod_city.json'), 'utf8'));
    expect(r34Data.connections.NORTH?.mapId).toBe('goldenrod_city');
    expect(r34Data.connections.NORTH?.offset).toBe(-10);
    expect(goldenrodData.connections.SOUTH?.mapId).toBe('route_34');
    expect(goldenrodData.connections.SOUTH?.offset).toBe(10);

    // Azalea Town <-> Ilex Forest <-> Route 34 Gate <-> Route 34
    const azaleaData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/azalea_town.json'), 'utf8'));
    const ilexData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/ilex_forest.json'), 'utf8'));
    const gateData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_34_ilex_forest_gate.json'), 'utf8'));

    const azaleaToIlex = azaleaData.warps.find((w) => w.targetMapId === 'ilex_forest');
    expect(azaleaToIlex).toBeDefined();

    const ilexToAzalea = ilexData.warps.find((w) => w.targetMapId === 'azalea_town');
    expect(ilexToAzalea).toBeDefined();

    const ilexToGate = ilexData.warps.find((w) => w.targetMapId === 'route_34_ilex_forest_gate');
    expect(ilexToGate).toBeDefined();

    const gateToR34 = gateData.warps.find((w) => w.targetMapId === 'route_34');
    expect(gateToR34).toBeDefined();

    // Goldenrod City <-> Gym
    const cityToGym = goldenrodData.warps.find((w) => w.targetMapId === 'goldenrod_gym');
    expect(cityToGym).toBeDefined();
    expect(cityToGym?.x).toBe(24);
    expect(cityToGym?.y).toBe(7);

    const gymData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/goldenrod_gym.json'), 'utf8'));
    const gymExit = gymData.warps.find((w) => w.targetMapId === 'goldenrod_city');
    expect(gymExit).toBeDefined();

    // Dept Store vertical progression
    const dept1F: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/goldenrod_dept_store_1f.json'), 'utf8'));
    const dept2F: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/goldenrod_dept_store_2f.json'), 'utf8'));
    expect(dept1F.warps.find((w) => w.targetMapId === 'goldenrod_dept_store_2f')).toBeDefined();
    expect(dept2F.warps.find((w) => w.targetMapId === 'goldenrod_dept_store_1f')).toBeDefined();

    // Radio Tower vertical progression
    const rt1F: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/radio_tower_1f.json'), 'utf8'));
    const rt2F: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/radio_tower_2f.json'), 'utf8'));
    expect(rt1F.warps.find((w) => w.targetMapId === 'radio_tower_2f')).toBeDefined();
    expect(rt2F.warps.find((w) => w.targetMapId === 'radio_tower_1f')).toBeDefined();

    // Leader Whitney boss registration in npcsByMap and main.ts
    const whitneyNpc = npcsByMap.goldenrod_gym.find((npc) => npc.id === 'whitney');
    expect(whitneyNpc).toBeDefined();
    expect(whitneyNpc?.action).toBe('WHITNEY_EVENT');
    expect(whitneyNpc?.trainerId).toBe('whitney');
    expect(whitneyNpc?.trainerPokemon?.speciesId).toBe('miltank');
    expect(whitneyNpc?.trainerTeam?.length).toBe(2);

    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      ) +
      '\n' +
      getAllInteractionSrc();
    expect(mainSrc).toMatch(/(action === 'WHITNEY_EVENT'|'WHITNEY_EVENT')/);
    expect(mainSrc).toContain("inventory.badges.includes('plain')");
    expect(mainSrc).toContain("inventory.tms.includes('TM45')");
  });

  it('validates Phase 9 Central Johto maps, connections, reciprocal warps, and Leader Morty', () => {
    const phase9Maps = [
      'route_35',
      'route_35_national_park_gate',
      'national_park',
      'route_36_national_park_gate',
      'route_36',
      'route_36_ruins_of_alph_gate',
      'route_37',
      'ecruteak_city',
      'ecruteak_poke_center',
      'ecruteak_mart',
      'ecruteak_gym',
      'dance_theater',
      'ecruteak_itemfinder_house',
      'burned_tower_1f',
      'burned_tower_b1f',
      'tin_tower_1f',
    ];

    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    for (const mapId of phase9Maps) {
      const mapPath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
      expect(fs.existsSync(mapPath), `Map file for ${mapId} must exist`).toBe(true);

      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(mapData.width).toBeGreaterThan(0);
      expect(mapData.height).toBeGreaterThan(0);
      expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);
      expect(mapData.tileMap?.length).toBe(mapData.width * mapData.height);

      for (const tile of new Set(mapData.tileMap!)) {
        expect(fs.existsSync(path.join(tilesDir, `${tile}.png`)), `Tile ${tile}.png must exist for ${mapId}`).toBe(true);
      }
    }

    // Outdoor classification verification
    expect(MapManager.isOutdoorMap('route_35')).toBe(true);
    expect(MapManager.isOutdoorMap('national_park')).toBe(true);
    expect(MapManager.isOutdoorMap('route_36')).toBe(true);
    expect(MapManager.isOutdoorMap('route_37')).toBe(true);
    expect(MapManager.isOutdoorMap('ecruteak_city')).toBe(true);
    expect(MapManager.isOutdoorMap('ecruteak_gym')).toBe(false);
    expect(MapManager.isOutdoorMap('burned_tower_1f')).toBe(false);

    // Multi-route seamless overworld connections
    const r35Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_35.json'), 'utf8'));
    const r36Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_36.json'), 'utf8'));
    const r37Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_37.json'), 'utf8'));
    const ecruteakData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/ecruteak_city.json'), 'utf8'));
    const violetData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/violet_city.json'), 'utf8'));

    // Route 35 <-> Route 36
    expect(r35Data.connections.NORTH?.mapId).toBe('route_36');
    expect(r36Data.connections.SOUTH?.mapId).toBe('route_35');

    // Route 36 <-> Violet City
    expect(r36Data.connections.EAST?.mapId).toBe('violet_city');
    expect(violetData.connections.WEST?.mapId).toBe('route_36');

    // Route 36 <-> Route 37
    expect(r36Data.connections.NORTH?.mapId).toBe('route_37');
    expect(r37Data.connections.SOUTH?.mapId).toBe('route_36');

    // Route 37 <-> Ecruteak City
    expect(r37Data.connections.NORTH?.mapId).toBe('ecruteak_city');
    expect(ecruteakData.connections.SOUTH?.mapId).toBe('route_37');

    // Ecruteak Gym & Leader Morty verification
    const mortyNpc = npcsByMap.ecruteak_gym.find((npc) => npc.id === 'morty');
    expect(mortyNpc).toBeDefined();
    expect(mortyNpc?.action).toBe('MORTY_EVENT');
    expect(mortyNpc?.trainerId).toBe('morty');
    expect(mortyNpc?.trainerPokemon?.speciesId).toBe('gengar');
    expect(mortyNpc?.trainerTeam?.length).toBe(4);

    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      ) +
      '\n' +
      getAllInteractionSrc();
    expect(mainSrc).toMatch(/(action === 'MORTY_EVENT'|'MORTY_EVENT')/);
    expect(mainSrc).toContain("inventory.badges.includes('fog')");
    expect(mainSrc).toContain("inventory.tms.includes('TM30')");
  });

  it('validates Phase 10 Western Johto maps, connections, reciprocal warps, and Leaders Jasmine & Chuck', () => {
    const phase10Maps = [
      'route_38',
      'route_38_ecruteak_gate',
      'route_39',
      'route_39_barn',
      'route_39_farmhouse',
      'olivine_city',
      'olivine_poke_center',
      'olivine_mart',
      'olivine_gym',
      'olivine_cafe',
      'olivine_tims_house',
      'olivine_good_rod_house',
      'olivine_lighthouse_1f',
      'olivine_lighthouse_2f',
      'olivine_lighthouse_3f',
      'olivine_lighthouse_4f',
      'olivine_lighthouse_5f',
      'olivine_lighthouse_6f',
      'route_40',
      'route_41',
      'cianwood_city',
      'cianwood_poke_center',
      'cianwood_gym',
      'cianwood_pharmacy',
      'cianwood_photo_studio',
      'cianwood_lugia_speech_house',
      'whirl_island_ne',
      'whirl_island_se',
      'whirl_island_sw',
      'whirl_island_nw',
      'whirl_island_b1f',
      'whirl_island_b2f',
      'whirl_island_lugia_chamber',
    ];

    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    for (const mapId of phase10Maps) {
      const mapPath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
      expect(fs.existsSync(mapPath), `Map file for ${mapId} must exist`).toBe(true);

      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(mapData.width).toBeGreaterThan(0);
      expect(mapData.height).toBeGreaterThan(0);
      expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);
      expect(mapData.tileMap?.length).toBe(mapData.width * mapData.height);

      for (const tile of new Set(mapData.tileMap!)) {
        expect(fs.existsSync(path.join(tilesDir, `${tile}.png`)), `Tile ${tile}.png must exist for ${mapId}`).toBe(true);
      }
    }

    // Outdoor classification verification
    expect(MapManager.isOutdoorMap('route_38')).toBe(true);
    expect(MapManager.isOutdoorMap('route_39')).toBe(true);
    expect(MapManager.isOutdoorMap('olivine_city')).toBe(true);
    expect(MapManager.isOutdoorMap('route_40')).toBe(true);
    expect(MapManager.isOutdoorMap('route_41')).toBe(true);
    expect(MapManager.isOutdoorMap('cianwood_city')).toBe(true);
    expect(MapManager.isOutdoorMap('olivine_gym')).toBe(false);
    expect(MapManager.isOutdoorMap('olivine_lighthouse_1f')).toBe(false);
    expect(MapManager.isOutdoorMap('cianwood_gym')).toBe(false);
    expect(MapManager.isOutdoorMap('whirl_island_b1f')).toBe(false);

    // Multi-route seamless overworld connections
    const r38Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_38.json'), 'utf8'));
    const r39Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_39.json'), 'utf8'));
    const olivineData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/olivine_city.json'), 'utf8'));
    const r40Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_40.json'), 'utf8'));
    const r41Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_41.json'), 'utf8'));
    const cianwoodData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/cianwood_city.json'), 'utf8'));

    // Route 38 <-> Route 39
    expect(r38Data.connections.WEST?.mapId).toBe('route_39');
    expect(r39Data.connections.EAST?.mapId).toBe('route_38');

    // Route 39 <-> Olivine City
    expect(r39Data.connections.SOUTH?.mapId).toBe('olivine_city');
    expect(olivineData.connections.NORTH?.mapId).toBe('route_39');

    // Olivine City <-> Route 40
    expect(olivineData.connections.WEST?.mapId).toBe('route_40');
    expect(r40Data.connections.EAST?.mapId).toBe('olivine_city');

    // Route 40 <-> Route 41
    expect(r40Data.connections.SOUTH?.mapId).toBe('route_41');
    expect(r41Data.connections.NORTH?.mapId).toBe('route_40');

    // Route 41 <-> Cianwood City
    expect(r41Data.connections.WEST?.mapId).toBe('cianwood_city');
    expect(cianwoodData.connections.EAST?.mapId).toBe('route_41');

    // Reciprocal warps: Route 38 Gate <-> Route 38 & Ecruteak
    const gateData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_38_ecruteak_gate.json'), 'utf8'));
    const ecruteakData: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/ecruteak_city.json'), 'utf8'));

    const gateToR38 = gateData.warps.find((w) => w.targetMapId === 'route_38');
    expect(gateToR38).toBeDefined();
    const r38ToGate = r38Data.warps.find((w) => w.targetMapId === 'route_38_ecruteak_gate');
    expect(r38ToGate).toBeDefined();

    const gateToEcruteak = gateData.warps.find((w) => w.targetMapId === 'ecruteak_city');
    expect(gateToEcruteak).toBeDefined();
    const ecruteakToGate = ecruteakData.warps.find((w) => w.targetMapId === 'route_38_ecruteak_gate');
    expect(ecruteakToGate).toBeDefined();

    // Reciprocal warps: Lighthouse 1F <-> 2F <-> 3F <-> 4F <-> 5F <-> 6F
    const lh1Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/olivine_lighthouse_1f.json'), 'utf8'));
    const lh2Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/olivine_lighthouse_2f.json'), 'utf8'));
    const lh6Data: MapData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/olivine_lighthouse_6f.json'), 'utf8'));

    expect(lh1Data.warps.find((w) => w.targetMapId === 'olivine_lighthouse_2f')).toBeDefined();
    expect(lh2Data.warps.find((w) => w.targetMapId === 'olivine_lighthouse_1f')).toBeDefined();
    expect(lh6Data.warps.find((w) => w.targetMapId === 'olivine_lighthouse_5f')).toBeDefined();

    // Gym Leaders verification: Jasmine & Chuck
    const jasmineNpc = npcsByMap.olivine_gym.find((npc) => npc.id === 'leader_jasmine');
    expect(jasmineNpc).toBeDefined();
    expect(jasmineNpc?.action).toBe('JASMINE_EVENT');
    expect(jasmineNpc?.trainerId).toBe('jasmine');
    expect(jasmineNpc?.trainerPokemon?.speciesId).toBe('magnemite');
    expect(jasmineNpc?.trainerTeam?.length).toBe(3);

    const chuckNpc = npcsByMap.cianwood_gym.find((npc) => npc.id === 'leader_chuck');
    expect(chuckNpc).toBeDefined();
    expect(chuckNpc?.action).toBe('CHUCK_EVENT');
    expect(chuckNpc?.trainerId).toBe('chuck');
    expect(chuckNpc?.trainerPokemon?.speciesId).toBe('primeape');
    expect(chuckNpc?.trainerTeam?.length).toBe(2);

    // Amphy & SecretPotion event verification
    const amphyNpc = npcsByMap.olivine_lighthouse_6f.find((npc) => npc.id === 'lighthouse_amphy');
    expect(amphyNpc).toBeDefined();
    expect(amphyNpc?.action).toBe('AMPHY_EVENT');

    const pharmacistNpc = npcsByMap.cianwood_pharmacy.find((npc) => npc.id === 'cianwood_pharmacist');
    expect(pharmacistNpc).toBeDefined();
    expect(pharmacistNpc?.action).toBe('PHARMACY_SECRET_POTION_EVENT');

    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      ) +
      '\n' +
      getAllInteractionSrc();
    expect(mainSrc).toMatch(/(action === 'JASMINE_EVENT'|'JASMINE_EVENT')/);
    expect(mainSrc).toMatch(/(action === 'CHUCK_EVENT'|'CHUCK_EVENT')/);
    expect(mainSrc).toMatch(/(action === 'AMPHY_EVENT'|'AMPHY_EVENT')/);
    expect(mainSrc).toMatch(/(action === 'PHARMACY_SECRET_POTION_EVENT'|'PHARMACY_SECRET_POTION_EVENT')/);
    expect(mainSrc).toContain("inventory.badges.includes('mineral')");
    expect(mainSrc).toContain("inventory.badges.includes('storm')");
    expect(mainSrc).toContain("inventory.tms.includes('TM23')");
    expect(mainSrc).toContain("inventory.tms.includes('TM01')");
  });
  it('validates Phase 11 Mahogany, Lake of Rage & Blackthorn maps, connections, warps, and Leaders Pryce & Clair', () => {
    const phase11Maps = ['route_42', 'route_42_ecruteak_gate', 'mount_mortar_1f_outside', 'mount_mortar_1f_inside', 'mount_mortar_2f_inside', 'mount_mortar_b1f', 'mahogany_town', 'mahogany_mart', 'mahogany_gym', 'mahogany_poke_center', 'mahogany_red_gyarados_speech_house', 'team_rocket_base_b1f', 'team_rocket_base_b2f', 'team_rocket_base_b3f', 'route_43', 'route_43_mahogany_gate', 'route_43_gate', 'lake_of_rage', 'lake_of_rage_hidden_power_house', 'lake_of_rage_magikarp_house', 'route_44', 'ice_path_1f', 'ice_path_b1f', 'ice_path_b2f_mahogany_side', 'ice_path_b2f_blackthorn_side', 'ice_path_b3f', 'blackthorn_city', 'blackthorn_gym_1f', 'blackthorn_gym_2f', 'blackthorn_dragon_speech_house', 'blackthorn_emys_house', 'blackthorn_mart', 'blackthorn_poke_center', 'move_deleters_house', 'dragons_den_1f', 'dragons_den_b1f', 'dragon_shrine', 'route_45', 'route_46'];
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    const load = (id: string): MapData => JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8'));

    for (const mapId of phase11Maps) {
      expect(fs.existsSync(path.join(mapsDir, `${mapId}.json`)), `Map file for ${mapId} must exist`).toBe(true);
      const m = load(mapId);
      expect(m.collisionGrid.length).toBe(m.width * m.height);
      expect(m.tileMap?.length).toBe(m.width * m.height);
      for (const tile of new Set(m.tileMap!)) {
        expect(fs.existsSync(path.join(tilesDir, `${tile}.png`)), `Tile ${tile}.png must exist for ${mapId}`).toBe(true);
      }
      for (const w of m.warps) {
        const target = load(w.targetMapId);
        expect([0, 2], `${mapId} warp lands on walkable tile in ${w.targetMapId}`).toContain(
          target.collisionGrid[w.targetY * target.width + w.targetX]
        );
      }
    }

    expect(MapManager.isOutdoorMap('mahogany_town')).toBe(true);
    expect(MapManager.isOutdoorMap('blackthorn_city')).toBe(true);
    expect(MapManager.isOutdoorMap('ice_path_1f')).toBe(false);

    expect(load('ecruteak_city').connections.EAST?.mapId).toBe('route_42');
    expect(load('route_42').connections.WEST?.mapId).toBe('ecruteak_city');
    expect(load('route_42').connections.EAST?.mapId).toBe('mahogany_town');
    expect(load('mahogany_town').connections.NORTH?.mapId).toBe('route_43');
    expect(load('route_43').connections.NORTH?.mapId).toBe('lake_of_rage');
    expect(load('mahogany_town').connections.EAST?.mapId).toBe('route_44');
    expect(load('route_44').connections.EAST?.mapId).toBe('blackthorn_city');
    expect(load('blackthorn_city').connections.SOUTH?.mapId).toBe('route_45');
    expect(load('route_45').connections.WEST?.mapId).toBe('route_46');
    expect(load('route_46').connections.SOUTH?.mapId).toBe('route_29');
    expect(load('route_29').connections.NORTH?.mapId).toBe('route_46');
    expect(load('route_38').connections.EAST?.offset).toBe(-load('ecruteak_city').connections.WEST!.offset);

    const pryce = npcsByMap.mahogany_gym.find((n) => n.action === 'PRYCE_EVENT');
    expect(pryce?.trainerTeam?.length).toBe(3);
    const clair = npcsByMap.blackthorn_gym_2f.find((n) => n.action === 'CLAIR_EVENT') ?? npcsByMap.blackthorn_gym_1f.find((n) => n.action === 'CLAIR_EVENT');
    expect(clair?.trainerTeam?.length).toBe(4);

    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      ) +
      '\n' +
      getAllInteractionSrc();
    expect(mainSrc).toMatch(/(action === 'PRYCE_EVENT'|'PRYCE_EVENT')/);
    expect(mainSrc).toMatch(/(action === 'CLAIR_EVENT'|'CLAIR_EVENT')/);
    expect(mainSrc).toContain("inventory.badges.includes('glacier')");
    expect(mainSrc).toContain("inventory.badges.includes('rising')");
  });
  it('validates Phase 12 Johto endgame maps: Routes 26/27, Victory Road, Indigo Plateau, Elite Four, Mt. Silver', () => {
    const phase12Maps = ['route_27', 'route_27_sandstorm_house', 'route_26', 'route_26_heal_house', 'tohjo_falls', 'victory_road_gate', 'victory_road', 'route_22', 'route_23', 'indigo_plateau_poke_center', 'wills_room', 'kogas_room', 'brunos_room', 'karens_room', 'lances_room', 'hall_of_fame', 'route_28', 'route_28_steel_wing_house', 'silver_cave_outside', 'silver_cave_poke_center', 'silver_cave_room_1', 'silver_cave_room_2', 'silver_cave_room_3', 'silver_cave_item_rooms'];
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    const load = (id: string): MapData => JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8'));
    for (const mapId of phase12Maps) {
      const m = load(mapId);
      expect(m.collisionGrid.length).toBe(m.width * m.height);
      for (const tile of new Set(m.tileMap!)) {
        expect(fs.existsSync(path.join(tilesDir, `${tile}.png`)), `Tile ${tile}.png for ${mapId}`).toBe(true);
      }
      for (const w of m.warps) {
        const target = load(w.targetMapId);
        expect([0, 2], `${mapId} -> ${w.targetMapId}`).toContain(target.collisionGrid[w.targetY * target.width + w.targetX]);
      }
    }
    expect(load('new_bark_town').connections.EAST?.mapId).toBe('route_27');
    expect(load('route_27').connections.WEST?.mapId).toBe('new_bark_town');
    expect(load('route_26').connections.WEST?.mapId).toBe('route_27');
    expect(load('route_28').connections.WEST?.mapId).toBe('silver_cave_outside');
    expect(load('silver_cave_outside').connections.EAST?.mapId).toBe('route_28');
    const lance = npcsByMap.lances_room.find((n) => n.action === 'E4_EVENT');
    expect(lance?.trainerId).toBe('lance');
    for (const room of ['wills_room', 'kogas_room', 'brunos_room', 'karens_room']) {
      expect(npcsByMap[room].some((n) => n.action === 'E4_EVENT')).toBe(true);
    }
    const e4Src =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      getAllInteractionSrc();
    expect(e4Src).toMatch(/(action === 'E4_EVENT'|'E4_EVENT')/);
  });

});
