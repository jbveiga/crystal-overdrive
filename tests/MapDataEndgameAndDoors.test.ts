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


describe("MapData & Authentic Tile Integrity — Kanto, Bugfixes & Doors", () => {
  it('validates Phase 13 Western & Central Kanto: Pallet, Viridian, Pewter, Cerulean, Routes 1-4, 24-25', () => {
    const phase13Maps = [
      'pallet_town', 'reds_house_1f', 'reds_house_2f', 'blues_house', 'oaks_lab',
      'route_1', 'viridian_city', 'viridian_gym', 'viridian_poke_center', 'viridian_mart',
      'viridian_nickname_house', 'trainer_house_1f', 'trainer_house_b1f',
      'route_2', 'route_2_gate', 'route_2_nugget_house',
      'pewter_city', 'pewter_gym', 'pewter_poke_center', 'pewter_mart',
      'pewter_nidoran_house', 'pewter_snooze_house',
      'route_3', 'mount_moon', 'mount_moon_square', 'mount_moon_gift_shop',
      'route_4', 'cerulean_city', 'cerulean_gym', 'cerulean_poke_center',
      'cerulean_mart', 'cerulean_police_station', 'cerulean_trade_house', 'cerulean_badge_house',
      'route_24', 'route_25', 'bills_house',
    ];
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    const load = (id: string): MapData => JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8'));

    for (const mapId of phase13Maps) {
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

    // Reciprocal connections
    expect(load('route_22').connections.EAST?.mapId).toBe('viridian_city');
    expect(load('viridian_city').connections.WEST?.mapId).toBe('route_22');
    expect(load('pallet_town').connections.NORTH?.mapId).toBe('route_1');
    expect(load('route_1').connections.SOUTH?.mapId).toBe('pallet_town');
    expect(load('route_1').connections.NORTH?.mapId).toBe('viridian_city');
    expect(load('viridian_city').connections.SOUTH?.mapId).toBe('route_1');
    expect(load('viridian_city').connections.NORTH?.mapId).toBe('route_2');
    expect(load('route_2').connections.SOUTH?.mapId).toBe('viridian_city');
    expect(load('route_2').connections.NORTH?.mapId).toBe('pewter_city');
    expect(load('pewter_city').connections.SOUTH?.mapId).toBe('route_2');
    expect(load('pewter_city').connections.EAST?.mapId).toBe('route_3');
    expect(load('route_3').connections.WEST?.mapId).toBe('pewter_city');
    expect(load('route_3').connections.EAST?.mapId).toBe('route_4');
    expect(load('route_4').connections.WEST?.mapId).toBe('route_3');
    expect(load('route_4').connections.EAST?.mapId).toBe('cerulean_city');
    expect(load('cerulean_city').connections.WEST?.mapId).toBe('route_4');
    expect(load('cerulean_city').connections.NORTH?.mapId).toBe('route_24');
    expect(load('route_24').connections.SOUTH?.mapId).toBe('cerulean_city');
    expect(load('route_24').connections.NORTH?.mapId).toBe('route_25');
    expect(load('route_25').connections.SOUTH?.mapId).toBe('route_24');

    // Gym Leaders
    const brock = npcsByMap.pewter_gym?.find((n) => n.action === 'BROCK_EVENT');
    expect(brock).toBeDefined();
    expect(brock?.trainerId).toBe('brock');

    const misty = npcsByMap.cerulean_gym?.find((n) => n.action === 'MISTY_EVENT');
    expect(misty).toBeDefined();
    expect(misty?.trainerId).toBe('misty');

    const blue = npcsByMap.viridian_gym?.find((n) => n.action === 'BLUE_EVENT');
    expect(blue).toBeDefined();
    expect(blue?.trainerId).toBe('blue');

    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      ) +
      '\n' +
      getAllInteractionSrc();
    expect(mainSrc).toContain('BROCK_EVENT:');
    expect(mainSrc).toContain('MISTY_EVENT:');
    expect(mainSrc).toContain('BLUE_EVENT:');
    expect(mainSrc).toContain("inventory.badges.includes(leaderConfig.badge)");
  });

  it('validates Phase 14 Central & Eastern Kanto: Vermilion, Celadon, Lavender, Rock Tunnel, Routes 5-11', () => {
    const phase14Maps = [
      'route_5', 'route_5_underground_entrance', 'route_5_saffron_gate', 'route_5_cleanse_tag_house', 'underground_path',
      'route_6', 'route_6_underground_entrance', 'route_6_saffron_gate',
      'vermilion_city', 'vermilion_gym', 'vermilion_poke_center', 'vermilion_mart',
      'vermilion_fishing_house', 'vermilion_magnet_train_house', 'vermilion_digletts_house',
      'vermilion_port_passage', 'vermilion_port',
      'fast_ship_1f', 'fast_ship_cabins_nnw_nne_ne', 'fast_ship_cabins_sw_ssw_nw', 'fast_ship_cabins_se_sse_captains_cabin', 'fast_ship_b1f',
      'olivine_port_passage', 'olivine_port',
      'route_11', 'digletts_cave', 'route_9', 'route_10_north', 'route_10_south', 'route_10_poke_center',
      'rock_tunnel_1f', 'rock_tunnel_b1f',
      'lavender_town', 'lavender_poke_center', 'lavender_mart', 'lavender_speech_house', 'lavender_name_rater', 'soul_house',
      'route_8', 'route_8_saffron_gate', 'route_7', 'route_7_saffron_gate',
      'celadon_city', 'celadon_gym', 'celadon_poke_center',
      'celadon_dept_store_1f', 'celadon_dept_store_2f', 'celadon_dept_store_3f', 'celadon_dept_store_4f', 'celadon_dept_store_5f', 'celadon_dept_store_6f', 'celadon_dept_store_elevator',
      'celadon_mansion_1f', 'celadon_mansion_2f', 'celadon_mansion_3f', 'celadon_mansion_roof', 'celadon_mansion_roof_house',
      'celadon_game_corner', 'celadon_game_corner_prize_room', 'celadon_cafe',
    ];
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    const load = (id: string): MapData => JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8'));

    for (const mapId of phase14Maps) {
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

    // Connections
    expect(load('cerulean_city').connections.SOUTH?.mapId).toBe('route_5');
    expect(load('route_5').connections.NORTH?.mapId).toBe('cerulean_city');
    expect(load('cerulean_city').connections.EAST?.mapId).toBe('route_9');
    expect(load('route_9').connections.WEST?.mapId).toBe('cerulean_city');
    expect(load('route_9').connections.SOUTH?.mapId).toBe('route_10_north');
    expect(load('route_10_north').connections.SOUTH?.mapId).toBe('route_10_south');
    expect(load('route_10_south').connections.NORTH?.mapId).toBe('route_10_north');
    expect(load('route_10_south').connections.SOUTH?.mapId).toBe('lavender_town');
    expect(load('lavender_town').connections.NORTH?.mapId).toBe('route_10_south');
    expect(load('lavender_town').connections.WEST?.mapId).toBe('route_8');
    expect(load('route_8').connections.EAST?.mapId).toBe('lavender_town');
    expect(load('celadon_city').connections.EAST?.mapId).toBe('route_7');
    expect(load('route_7').connections.WEST?.mapId).toBe('celadon_city');
    expect(load('route_6').connections.SOUTH?.mapId).toBe('vermilion_city');
    expect(load('vermilion_city').connections.NORTH?.mapId).toBe('route_6');
    expect(load('vermilion_city').connections.EAST?.mapId).toBe('route_11');
    expect(load('route_11').connections.WEST?.mapId).toBe('vermilion_city');

    // Gym Leaders
    const surge = npcsByMap.vermilion_gym?.find((n) => n.action === 'SURGE_EVENT');
    expect(surge).toBeDefined();
    expect(surge?.trainerId).toBe('surge');

    const erika = npcsByMap.celadon_gym?.find((n) => n.action === 'ERIKA_EVENT');
    expect(erika).toBeDefined();
    expect(erika?.trainerId).toBe('erika');
  });

  it('validates Phase 15 Southern Kanto, Saffron & Sea Routes: Saffron, Fuchsia, Cinnabar, Cycling Road, Seafoam, Routes 12-21', () => {
    const phase15Maps = [
      'saffron_city', 'saffron_gym', 'fighting_dojo', 'silph_co_1f', 'mr_psychics_house',
      'saffron_magnet_train_station', 'saffron_poke_center', 'saffron_mart',
      'copycats_house_1f', 'copycats_house_2f',
      'route_16', 'route_16_gate', 'route_16_fuchsia_speech_house',
      'route_17', 'route_17_route_18_gate', 'route_18',
      'fuchsia_city', 'fuchsia_gym', 'fuchsia_poke_center', 'fuchsia_mart',
      'safari_zone_main_office', 'safari_zone_wardens_home',
      'route_19_fuchsia_gate', 'route_15_fuchsia_gate',
      'route_12', 'route_12_super_rod_house',
      'route_13', 'route_14', 'route_15',
      'route_19', 'route_20', 'seafoam_gym',
      'cinnabar_island', 'cinnabar_poke_center', 'route_21',
    ];
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    const load = (id: string): MapData => JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8'));

    for (const mapId of phase15Maps) {
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

    // Closed-loop world connectivity
    expect(load('pallet_town').connections.SOUTH?.mapId).toBe('route_21');
    expect(load('route_21').connections.NORTH?.mapId).toBe('pallet_town');
    expect(load('route_21').connections.SOUTH?.mapId).toBe('cinnabar_island');
    expect(load('cinnabar_island').connections.NORTH?.mapId).toBe('route_21');
    expect(load('cinnabar_island').connections.EAST?.mapId).toBe('route_20');
    expect(load('route_20').connections.WEST?.mapId).toBe('cinnabar_island');
    expect(load('route_20').connections.EAST?.mapId).toBe('route_19');
    expect(load('route_19').connections.WEST?.mapId).toBe('route_20');
    expect(load('route_19').connections.NORTH?.mapId).toBe('fuchsia_city');
    expect(load('fuchsia_city').connections.SOUTH?.mapId).toBe('route_19');
    expect(load('fuchsia_city').connections.WEST?.mapId).toBe('route_18');
    expect(load('route_18').connections.EAST?.mapId).toBe('fuchsia_city');
    expect(load('fuchsia_city').connections.EAST?.mapId).toBe('route_15');
    expect(load('route_15').connections.WEST?.mapId).toBe('fuchsia_city');
    expect(load('route_17').connections.EAST?.mapId).toBe('route_18');
    expect(load('route_18').connections.WEST?.mapId).toBe('route_17');
    expect(load('route_16').connections.SOUTH?.mapId).toBe('route_17');
    expect(load('route_17').connections.NORTH?.mapId).toBe('route_16');
    expect(load('celadon_city').connections.WEST?.mapId).toBe('route_16');
    expect(load('route_16').connections.EAST?.mapId).toBe('celadon_city');
    expect(load('route_15').connections.EAST?.mapId).toBe('route_14');
    expect(load('route_14').connections.WEST?.mapId).toBe('route_15');
    expect(load('route_14').connections.NORTH?.mapId).toBe('route_13');
    expect(load('route_13').connections.SOUTH?.mapId).toBe('route_14');
    expect(load('route_13').connections.NORTH?.mapId).toBe('route_12');
    expect(load('route_12').connections.SOUTH?.mapId).toBe('route_13');
    expect(load('lavender_town').connections.SOUTH?.mapId).toBe('route_12');
    expect(load('route_12').connections.NORTH?.mapId).toBe('lavender_town');
    expect(load('route_11').connections.EAST?.mapId).toBe('route_12');
    expect(load('route_12').connections.WEST?.mapId).toBe('route_11');

    // Saffron Hub
    expect(load('route_5').connections.SOUTH?.mapId).toBe('saffron_city');
    expect(load('saffron_city').connections.NORTH?.mapId).toBe('route_5');
    expect(load('route_6').connections.NORTH?.mapId).toBe('saffron_city');
    expect(load('saffron_city').connections.SOUTH?.mapId).toBe('route_6');
    expect(load('route_7').connections.EAST?.mapId).toBe('saffron_city');
    expect(load('saffron_city').connections.WEST?.mapId).toBe('route_7');
    expect(load('route_8').connections.WEST?.mapId).toBe('saffron_city');
    expect(load('saffron_city').connections.EAST?.mapId).toBe('route_8');

    // Gym Leaders
    const sabrina = npcsByMap.saffron_gym?.find((n) => n.action === 'SABRINA_EVENT');
    expect(sabrina).toBeDefined();
    expect(sabrina?.trainerId).toBe('sabrina');

    const janine = npcsByMap.fuchsia_gym?.find((n) => n.action === 'JANINE_EVENT');
    expect(janine).toBeDefined();
    expect(janine?.trainerId).toBe('janine');

    const blaine = npcsByMap.seafoam_gym?.find((n) => n.action === 'BLAINE_EVENT');
    expect(blaine).toBeDefined();
    expect(blaine?.trainerId).toBe('blaine');
  });

  it('validates Sprint 09 Animated Retro GBC Loader and single-payload world_maps.json consolidation', () => {
    const htmlSrc = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    expect(htmlSrc).toContain('id="retro-loader"');
    expect(htmlSrc).toContain('class="loader-pokeball"');
    expect(htmlSrc).toContain('id="loader-progress-fill"');
    expect(htmlSrc).toContain('id="loader-status-text"');
    expect(htmlSrc).toContain('window.updateLoaderProgress');
    expect(htmlSrc).toContain('window.dismissLoader');

    const worldMapsPath = path.resolve(__dirname, '../public/assets/data/world_maps.json');
    expect(fs.existsSync(worldMapsPath)).toBe(true);
    const bundledMaps: MapData[] = JSON.parse(fs.readFileSync(worldMapsPath, 'utf8'));
    expect(bundledMaps.length).toBeGreaterThanOrEqual(315);

    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      ) +
      '\n' +
      fs.readFileSync(
        path.resolve(__dirname, '../src/world/OverworldWarpAndMapTransitionController.ts'),
        'utf8'
      );
    expect(mainSrc).toContain('./assets/data/world_maps.json');
    expect(mainSrc).toContain('window.updateLoaderProgress?.(');
    expect(mainSrc).toContain('window.dismissLoader?.()');
  });

  it('validates BUGFIX-NARRATIVE-01: Starter Poké Ball table sprites, Prof. Oak departure in Mr. Pokémon House, and Elm Egg handover', () => {
    const flags = new Set<string>();

    // 1. Starter Poké Ball table sprites in Elm's Lab
    const initialBalls = OverworldItemManager.getStarterBallsForLab(flags);
    expect(initialBalls).toHaveLength(3);
    expect(initialBalls.map((b) => ({ id: b.id, x: b.x, y: b.y }))).toEqual([
      { id: 'cyndaquil_ball', x: 6, y: 3 },
      { id: 'totodile_ball', x: 7, y: 3 },
      { id: 'chikorita_ball', x: 8, y: 3 },
    ]);

    // Player picks Cyndaquil -> Cyndaquil ball at (6, 3) despawns immediately
    flags.add('starter_chosen');
    flags.add('starter_cyndaquil');
    const afterChoice = OverworldItemManager.getStarterBallsForLab(flags);
    expect(afterChoice.map((b) => b.id)).toEqual(['totodile_ball', 'chikorita_ball']);

    // Rival steals counter-pick (Totodile) after Elm's call -> only Chikorita ball at (8, 3) remains
    flags.add('ELM_CALLED_ABOUT_THEFT');
    const afterTheft = OverworldItemManager.getStarterBallsForLab(flags);
    expect(afterTheft.map((b) => b.id)).toEqual(['chikorita_ball']);

    // Counter-pick verification for Totodile (Rival steals Chikorita) and Chikorita (Rival steals Cyndaquil)
    const totoFlags = new Set(['starter_chosen', 'starter_totodile', 'ELM_CALLED_ABOUT_THEFT']);
    expect(OverworldItemManager.getStarterBallsForLab(totoFlags).map((b) => b.id)).toEqual(['cyndaquil_ball']);

    const chikoFlags = new Set(['starter_chosen', 'starter_chikorita', 'ELM_CALLED_ABOUT_THEFT']);
    expect(OverworldItemManager.getStarterBallsForLab(chikoFlags).map((b) => b.id)).toEqual(['totodile_ball']);

    // 2. Mr. Pokémon's House NPC departure, Prof. Oak authentic 'oak' sprite sheet, & walkable path
    const oakSpritePath = path.resolve(__dirname, '../public/assets/sprites/characters/oak.png');
    expect(fs.existsSync(oakSpritePath)).toBe(true);
    const oakBuf = fs.readFileSync(oakSpritePath);
    expect(oakBuf.readUInt32BE(16)).toBe(144);
    expect(oakBuf.readUInt32BE(20)).toBe(32);

    const preEggNpcs = getNpcsForMap('mr_pokemons_house', new Set());
    expect(preEggNpcs.map((n) => n.id)).toEqual(['mr_pokemon_npc', 'prof_oak_npc']);
    const profOakNpc = preEggNpcs.find((n) => n.id === 'prof_oak_npc');
    expect(profOakNpc?.spriteType).toBe('oak');

    flags.add('HAS_MYSTERY_EGG');
    flags.add('HAS_POKEDEX');
    const postEggNpcs = getNpcsForMap('mr_pokemons_house', flags);
    expect(postEggNpcs.map((n) => n.id)).toEqual(['mr_pokemon_npc']);

    const mrPkmnMap: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/mr_pokemons_house.json'), 'utf8')
    );
    // Walkable corridor from entrance door (2, 7)/(3, 7) straight up to Mr. Pokémon (3, 3) and Prof. Oak (5, 3)
    for (let y = 3; y <= 7; y++) {
      expect(mrPkmnMap.collisionGrid[y * mrPkmnMap.width + 2]).toBe(0);
      expect(mrPkmnMap.collisionGrid[y * mrPkmnMap.width + 3]).toBe(0);
      expect(mrPkmnMap.collisionGrid[y * mrPkmnMap.width + 5]).toBe(0);
    }

    // 3. Handing Mystery Egg to Prof. Elm completes Mission M01 and unlocks M02
    const missionManager = new MissionManager();
    flags.add('EVENT_GAVE_MYSTERY_EGG_TO_ELM');
    missionManager.checkStoryFlags(flags);
    expect(missionManager.getMission('M01')?.status).toBe('COMPLETED');
    expect(missionManager.getMission('M02')?.status).toBe('ACTIVE');
  });

  it('validates BUGFIX-RUINS-OF-ALPH-WARPS-COLLISION-01: solid cave roofs, Route 36 reciprocal warps, and Sudowoodo sprite', () => {
    const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
    const load = (id: string): MapData => JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8'));
    const ruins = load('ruins_of_alph_outside');
    const gate = load('route_36_ruins_of_alph_gate');
    const route36 = load('route_36');

    // 1. All 108 cave roof tiles are solid
    const roofIdx = ruins.tileMap.map((t, i) => (t === 'jt_3c_3c_3c_3c' ? i : -1)).filter((i) => i >= 0);
    expect(roofIdx).toHaveLength(108);
    for (const i of roofIdx) {
      expect(ruins.collisionGrid[i]).toBe(1);
    }

    // 2. Doorway entrances stay walkable and warp tiles are walkable
    const walkable = (m: MapData, x: number, y: number) => m.collisionGrid[y * m.width + x] === 0;
    expect(walkable(ruins, 7, 5)).toBe(true);
    expect(walkable(ruins, 7, 6)).toBe(true);

    // 3. Bidirectional warp reciprocity between the gate and Ruins of Alph
    for (const sx of [4, 5]) {
      const south = gate.warps.find((w) => w.x === sx && w.y === 7)!;
      expect(south.targetMapId).toBe('ruins_of_alph_outside');
      expect([south.targetX, south.targetY]).toEqual([7, 6]);
      expect(walkable(ruins, south.targetX, south.targetY)).toBe(true);
    }
    const back = ruins.warps.find((w) => w.x === 7 && w.y === 5);
    expect(back).toBeDefined();
    expect(back!.targetMapId).toBe('route_36_ruins_of_alph_gate');
    expect([back!.targetX, back!.targetY]).toEqual([4, 6]);
    expect(walkable(gate, 4, 6)).toBe(true);

    // 4. North exits land one tile above Route 36's gate doors, walkable, facing UP
    for (const nx of [4, 5]) {
      const north = gate.warps.find((w) => w.x === nx && w.y === 0)!;
      expect(north.targetMapId).toBe('route_36');
      expect([north.targetX, north.targetY]).toEqual([nx + 43, 12]);
      expect(north.direction).toBe('UP');
      expect(walkable(route36, north.targetX, north.targetY)).toBe(true);
      const door = route36.warps.find((w) => w.targetMapId === 'route_36_ruins_of_alph_gate' && w.targetX === nx);
      expect(door).toBeDefined();
    }

    // 5. Sudowoodo uses its own sprite and the asset exists on disk
    const sudowoodo = npcsByMap.route_36.find((n) => n.id === 'sudowoodo')!;
    expect(sudowoodo.spriteType).toBe('sudowoodo');
    const assetPath = path.resolve(__dirname, '../public/assets/sprites/characters/sudowoodo.png');
    expect(fs.existsSync(assetPath)).toBe(true);
    const rendererSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/render/OverworldRenderer.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(path.resolve(__dirname, '../src/render/OverworldNpcAndItemSprites.ts'), 'utf8');
    expect(rendererSrc).toContain("sudowoodo: './assets/sprites/characters/sudowoodo.png'");
  });

  describe('Authentic GBC Door Transitions & Doorstep Landing (TICKET-POLISH-AUTHENTIC-DOOR-MECHANICS-01)', () => {
    const indoorHouse: MapData = {
      id: 'players_house_1f',
      name: "Player's House",
      width: 10,
      height: 8,
      tileSize: 64,
      groundLayer: [],
      objectLayer: [],
      collisionGrid: new Array(80).fill(0),
      connections: {},
      warps: [
        { x: 6, y: 7, targetMapId: 'new_bark_town', targetX: 13, targetY: 5 },
        { x: 9, y: 0, targetMapId: 'players_house_2f', targetX: 7, targetY: 1 },
      ],
      grassEncounters: [],
    };

    const outdoorTown: MapData = {
      id: 'new_bark_town',
      name: 'New Bark Town',
      width: 20,
      height: 18,
      tileSize: 64,
      groundLayer: [],
      objectLayer: [],
      collisionGrid: new Array(360).fill(0),
      connections: {},
      warps: [
        { x: 13, y: 5, targetMapId: 'players_house_1f', targetX: 6, targetY: 6 },
      ],
      grassEncounters: [],
    };

    it('identifies carpet warps correctly vs stairs and outdoor doors', () => {
      // Indoor exit warp at bottom of room is a carpet warp
      expect(MapManager.isCarpetWarp(indoorHouse.warps[0], indoorHouse)).toBe(true);
      // Indoor stairs at (9, 0) is NOT a carpet warp
      expect(MapManager.isCarpetWarp(indoorHouse.warps[1], indoorHouse)).toBe(false);
      // Outdoor entrance door is NOT a carpet warp
      expect(MapManager.isCarpetWarp(outdoorTown.warps[0], outdoorTown)).toBe(false);
    });

    it('resolves outdoor exit landing 1 tile below the door (targetX, targetY + 1) facing DOWN with DOOR_EXIT audio', () => {
      const exitWarp = indoorHouse.warps[0]; // targetX: 13, targetY: 5
      const config = MapManager.resolveWarpTransition(exitWarp, indoorHouse, outdoorTown);

      expect(config.isExitingToOverworld).toBe(true);
      expect(config.isEnteringIndoor).toBe(false);
      expect(config.landingX).toBe(13);
      expect(config.landingY).toBe(6); // 5 + 1: Safe doorstep apron in front of door
      expect(config.landingFacing).toBe('DOWN');
      expect(config.soundCue).toBe('DOOR_EXIT');
      expect(config.fadeDurationMs).toBe(160);
    });

    it('resolves indoor entrance landing at (targetX, targetY) facing UP with DOOR_ENTER audio', () => {
      const enterWarp = outdoorTown.warps[0]; // targetX: 6, targetY: 6
      const config = MapManager.resolveWarpTransition(enterWarp, outdoorTown, indoorHouse);

      expect(config.isEnteringIndoor).toBe(true);
      expect(config.isExitingToOverworld).toBe(false);
      expect(config.landingX).toBe(6);
      expect(config.landingY).toBe(6);
      expect(config.landingFacing).toBe('UP');
      expect(config.soundCue).toBe('DOOR_ENTER');
      expect(config.fadeDurationMs).toBe(160);
    });

    it('resolves staircase warp to STAIRS_STEP audio cue', () => {
      const stairWarp = indoorHouse.warps[1]; // players_house_2f (targetY: 1)
      const house2f: MapData = { ...indoorHouse, id: 'players_house_2f' };
      const config = MapManager.resolveWarpTransition(stairWarp, indoorHouse, house2f);

      expect(config.isStairs).toBe(true);
      expect(config.soundCue).toBe('STAIRS_STEP');
      expect(config.landingFacing).toBe('DOWN');
    });

    it('resolves cave entrance and subterranean traversal to CAVE_WARP audio cue', () => {
      const caveWarp = { x: 6, y: 79, targetMapId: 'union_cave_1f', targetX: 3, targetY: 5 };
      const route32: MapData = { ...outdoorTown, id: 'route_32' };
      const unionCave: MapData = { ...indoorHouse, id: 'union_cave_1f' };
      const config = MapManager.resolveWarpTransition(caveWarp, route32, unionCave);

      expect(config.isCave).toBe(true);
      expect(config.soundCue).toBe('CAVE_WARP');
      expect(config.landingFacing).toBe('DOWN');
    });
  });
});
