import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../src/types/game';
import { MapManager } from '../src/world/MapManager';
import { npcsByMap, getNpcsForMap } from '../src/world/npcData';
import { OverworldItemManager } from '../src/world/OverworldItemManager';
import { MissionManager } from '../src/world/MissionManager';

describe('MapData & Authentic Tile Integrity', () => {
  it('validates new_bark_town.json structure, tileMap dimensions, and asset presence', () => {
    const mapPath = path.resolve(__dirname, '../public/assets/data/maps/new_bark_town.json');
    expect(fs.existsSync(mapPath)).toBe(true);

    const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

    expect(mapData.id).toBe('new_bark_town');
    expect(mapData.width).toBe(20);
    expect(mapData.height).toBe(18);
    expect(mapData.tileSize).toBe(64);

    const totalExpectedTiles = mapData.width * mapData.height;
    expect(mapData.collisionGrid.length).toBe(totalExpectedTiles);
    expect(mapData.tileMap).toBeDefined();
    expect(mapData.tileMap!.length).toBe(totalExpectedTiles);

    // Verify all referenced tiles exist in public/assets/tiles/
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    const uniqueTiles = new Set(mapData.tileMap!);

    for (const tileName of uniqueTiles) {
      const tileFile = path.join(tilesDir, `${tileName}.png`);
      expect(fs.existsSync(tileFile)).toBe(true);
    }

    // Verify Warps (Authentic pret/pokecrystal coordinates)
    expect(mapData.warps.length).toBeGreaterThanOrEqual(4);
    const labWarp = mapData.warps.find((w) => w.targetMapId === 'elms_lab');
    expect(labWarp).toBeDefined();
    expect(labWarp?.x).toBe(6);
    expect(labWarp?.y).toBe(3);

    const houseWarp = mapData.warps.find((w) => w.targetMapId === 'players_house_1f');
    expect(houseWarp).toBeDefined();
    expect(houseWarp?.x).toBe(13);
    expect(houseWarp?.y).toBe(5);

    // Ensure all warp door coordinates are walkable (collisionGrid === 0)
    for (const warp of mapData.warps) {
      const idx = warp.y * mapData.width + warp.x;
      expect(mapData.collisionGrid[idx]).toBe(0);
    }

    // Verify Route 29 West Connection
    expect(mapData.connections.WEST).toBeDefined();
    expect(mapData.connections.WEST?.mapId).toBe('route_29');
  });

  it('validates route_29.json structure, tileMap dimensions, and asset presence', () => {
    const mapPath = path.resolve(__dirname, '../public/assets/data/maps/route_29.json');
    expect(fs.existsSync(mapPath)).toBe(true);

    const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    expect(mapData.id).toBe('route_29');
    expect(mapData.width).toBe(60);
    expect(mapData.height).toBe(18);

    const totalExpectedTiles = mapData.width * mapData.height;
    expect(mapData.collisionGrid.length).toBe(totalExpectedTiles);
    expect(mapData.tileMap).toBeDefined();
    expect(mapData.tileMap!.length).toBe(totalExpectedTiles);

    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    for (const tileName of new Set(mapData.tileMap!)) {
      expect(fs.existsSync(path.join(tilesDir, `${tileName}.png`))).toBe(true);
    }

    expect(mapData.connections.EAST?.mapId).toBe('new_bark_town');
    expect(mapData.connections.WEST?.mapId).toBe('cherrygrove_city');
  });

  it('validates cherrygrove_city.json structure, tileMap dimensions, and walkable Poke Center/Mart warps', () => {
    const mapPath = path.resolve(__dirname, '../public/assets/data/maps/cherrygrove_city.json');
    expect(fs.existsSync(mapPath)).toBe(true);

    const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    expect(mapData.id).toBe('cherrygrove_city');
    expect(mapData.width).toBe(40);
    expect(mapData.height).toBe(18);

    const totalExpectedTiles = mapData.width * mapData.height;
    expect(mapData.collisionGrid.length).toBe(totalExpectedTiles);
    expect(mapData.tileMap).toBeDefined();
    expect(mapData.tileMap!.length).toBe(totalExpectedTiles);

    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
    for (const tileName of new Set(mapData.tileMap!)) {
      expect(fs.existsSync(path.join(tilesDir, `${tileName}.png`))).toBe(true);
    }

    const pokeCenterWarp = mapData.warps.find((w) => w.targetMapId === 'cherrygrove_poke_center');
    const martWarp = mapData.warps.find((w) => w.targetMapId === 'cherrygrove_mart');
    expect(pokeCenterWarp).toBeDefined();
    expect(martWarp).toBeDefined();

    for (const warp of mapData.warps) {
      const idx = warp.y * mapData.width + warp.x;
      expect(mapData.collisionGrid[idx]).toBe(0);
    }
  });

  it('validates all 11 authentic indoor maps, their tile PNGs, and exit warps', () => {
    const indoorMapIds = [
      'elms_lab',
      'players_house_1f',
      'players_neighbors_house',
      'elms_house',
      'cherrygrove_mart',
      'cherrygrove_poke_center',
      'guide_gents_house',
      'cherrygrove_gym_speech_house',
      'cherrygrove_evolution_speech_house',
      'mr_pokemons_house',
      'route_30_berry_house',
    ];
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    for (const mapId of indoorMapIds) {
      const mapPath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
      expect(fs.existsSync(mapPath)).toBe(true);

      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(mapData.id).toBe(mapId);
      expect(mapData.tileMap).toBeDefined();
      expect(mapData.tileMap!.length).toBe(mapData.width * mapData.height);
      expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);

      for (const tileName of new Set(mapData.tileMap!)) {
        expect(fs.existsSync(path.join(tilesDir, `${tileName}.png`))).toBe(true);
      }

      // Every indoor map has at least 2 exit carpet warps at the bottom row (plus staircase warps where applicable)
      expect(mapData.warps.length).toBeGreaterThanOrEqual(2);
      for (const warp of mapData.warps) {
        const idx = warp.y * mapData.width + warp.x;
        expect(mapData.collisionGrid[idx]).toBe(0);
      }
    }
  });

  it('validates players_house_2f.json bedroom schema, bgEvents, and reciprocal staircase warps with players_house_1f', () => {
    const h1Path = path.resolve(__dirname, '../public/assets/data/maps/players_house_1f.json');
    const h2Path = path.resolve(__dirname, '../public/assets/data/maps/players_house_2f.json');
    expect(fs.existsSync(h1Path)).toBe(true);
    expect(fs.existsSync(h2Path)).toBe(true);

    const h1: MapData = JSON.parse(fs.readFileSync(h1Path, 'utf8'));
    const h2: MapData = JSON.parse(fs.readFileSync(h2Path, 'utf8'));
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    expect(h2.id).toBe('players_house_2f');
    expect(h2.width).toBe(8);
    expect(h2.height).toBe(6);
    expect(h2.tileSize).toBe(64);
    expect(h2.groundLayer.length).toBe(48);
    expect(h2.collisionGrid.length).toBe(48);
    expect(h2.tileMap?.length).toBe(48);

    for (const tileName of new Set(h2.tileMap!)) {
      expect(fs.existsSync(path.join(tilesDir, `${tileName}.png`))).toBe(true);
    }

    // Reciprocal staircase warps: 1F (9, 0) -> 2F (7, 1) and 2F (7, 0) -> 1F (9, 1)
    const warpUp = h1.warps.find((w) => w.x === 9 && w.y === 0);
    expect(warpUp).toEqual({
      x: 9,
      y: 0,
      targetMapId: 'players_house_2f',
      targetX: 7,
      targetY: 1,
    });
    expect(h1.collisionGrid[0 * h1.width + 9]).toBe(0); // Walkable staircase on 1F

    const warpDown = h2.warps.find((w) => w.x === 7 && w.y === 0);
    expect(warpDown).toEqual({
      x: 7,
      y: 0,
      targetMapId: 'players_house_1f',
      targetX: 9,
      targetY: 1,
    });
    expect(h2.collisionGrid[0 * h2.width + 7]).toBe(0); // Walkable staircase on 2F
    expect(h2.collisionGrid[1 * h2.width + 7]).toBe(0); // Walkable arrival tile (7, 1) on 2F
    // Single canonical bed at x=0 (solid) and walkable floor beside bed at x=1 (1, 1) and (1, 2)
    expect(h2.collisionGrid[1 * h2.width + 0]).toBe(1);
    expect(h2.collisionGrid[2 * h2.width + 0]).toBe(1);
    expect(h2.collisionGrid[1 * h2.width + 1]).toBe(0);
    expect(h2.collisionGrid[2 * h2.width + 1]).toBe(0);
    expect(h2.tileMap![1 * h2.width + 1]).toBe('in_players_house_01_01_01_01');
    expect(h2.tileMap![2 * h2.width + 1]).toBe('in_players_house_01_01_01_01');

    // Verify 2F interactive bedroom objects (PC, Radio, Bookshelf, Nintendo 64)
    expect(h2.bgEvents?.length).toBe(4);
    expect(h2.bgEvents?.find((e) => e.x === 2 && e.y === 1)?.speaker).toContain('PC');
    expect(h2.bgEvents?.find((e) => e.x === 3 && e.y === 1)?.speaker).toContain('RADIO');
    expect(h2.bgEvents?.find((e) => e.x === 5 && e.y === 1)?.speaker).toContain('BOOKSHELF');
    expect(h2.bgEvents?.find((e) => e.x === 4 && e.y === 2)?.speaker).toContain('NINTENDO 64');
  });

  it('validates route_30.json and route_31.json dimensions, tiles, ledges, warps, and NORTH/SOUTH connections', () => {
    const r30Path = path.resolve(__dirname, '../public/assets/data/maps/route_30.json');
    const r31Path = path.resolve(__dirname, '../public/assets/data/maps/route_31.json');
    expect(fs.existsSync(r30Path)).toBe(true);
    expect(fs.existsSync(r31Path)).toBe(true);

    const r30: MapData = JSON.parse(fs.readFileSync(r30Path, 'utf8'));
    const r31: MapData = JSON.parse(fs.readFileSync(r31Path, 'utf8'));
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    expect(r30.width).toBe(20);
    expect(r30.height).toBe(54);
    expect(r30.connections.SOUTH?.mapId).toBe('cherrygrove_city');
    expect(r30.connections.NORTH?.mapId).toBe('route_31');
    expect(r30.collisionGrid.includes(4)).toBe(true); // South Ledge tiles present

    for (const tileName of new Set(r30.tileMap!)) {
      expect(fs.existsSync(path.join(tilesDir, `${tileName}.png`))).toBe(true);
    }

    const mrPkmnWarp = r30.warps.find((w) => w.targetMapId === 'mr_pokemons_house');
    const berryWarp = r30.warps.find((w) => w.targetMapId === 'route_30_berry_house');
    expect(mrPkmnWarp).toBeDefined();
    expect(berryWarp).toBeDefined();

    expect(r31.width).toBe(40);
    expect(r31.height).toBe(18);
    expect(r31.connections.SOUTH?.mapId).toBe('route_30');
    expect(r31.collisionGrid.includes(4)).toBe(true);

    for (const tileName of new Set(r31.tileMap!)) {
      expect(fs.existsSync(path.join(tilesDir, `${tileName}.png`))).toBe(true);
    }
  });

  it('validates authentic street signs and indoor bgEvents across maps', () => {
    const nbt: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/new_bark_town.json'), 'utf8')
    );
    expect(nbt.bgEvents).toBeDefined();
    expect(nbt.bgEvents!.length).toBe(4);
    const townSign = nbt.bgEvents!.find((bg) => bg.x === 8 && bg.y === 8);
    expect(townSign).toBeDefined();
    expect(townSign?.pages[0]).toContain('NEW BARK TOWN');

    const lab: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/elms_lab.json'), 'utf8')
    );
    expect(lab.bgEvents).toBeDefined();
    const healMachine = lab.bgEvents!.find((bg) => bg.x === 2 && bg.y === 1);
    expect(healMachine?.action).toBe('HEAL_AND_SAVE');

    // Elm's Lab Starter Choice Pokéballs (Ticket 6.1)
    const cyndaquilBall = lab.bgEvents!.find((bg) => bg.x === 6 && bg.y === 3);
    const totodileBall = lab.bgEvents!.find((bg) => bg.x === 7 && bg.y === 3);
    const chikoritaBall = lab.bgEvents!.find((bg) => bg.x === 8 && bg.y === 3);
    expect(cyndaquilBall?.action).toBe('STARTER_CYNDAQUIL');
    expect(totodileBall?.action).toBe('STARTER_TOTODILE');
    expect(chikoritaBall?.action).toBe('STARTER_CHIKORITA');
  });

  it('validates Phase 4 Violet City, Violet Gym, Sprout Tower, and interior maps', () => {
    const phase4Maps = [
      { id: 'violet_city', w: 40, h: 36, minWarps: 8 },
      { id: 'sprout_tower_1f', w: 20, h: 16, minWarps: 4 },
      { id: 'sprout_tower_2f', w: 20, h: 16, minWarps: 4 },
      { id: 'sprout_tower_3f', w: 20, h: 16, minWarps: 1 },
      { id: 'violet_gym', w: 10, h: 16, minWarps: 2 },
      { id: 'earls_pokemon_academy', w: 8, h: 16, minWarps: 2 },
      { id: 'violet_mart', w: 12, h: 8, minWarps: 2 },
      { id: 'violet_poke_center', w: 10, h: 8, minWarps: 2 },
      { id: 'violet_nickname_speech_house', w: 8, h: 8, minWarps: 2 },
      { id: 'violet_kyles_house', w: 8, h: 8, minWarps: 2 },
      { id: 'route_31_violet_gate', w: 10, h: 8, minWarps: 4 },
    ];
    const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

    for (const m of phase4Maps) {
      const mapPath = path.resolve(__dirname, `../public/assets/data/maps/${m.id}.json`);
      expect(fs.existsSync(mapPath)).toBe(true);

      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      expect(mapData.id).toBe(m.id);
      expect(mapData.width).toBe(m.w);
      expect(mapData.height).toBe(m.h);
      expect(mapData.tileMap).toBeDefined();
      expect(mapData.tileMap!.length).toBe(m.w * m.h);
      expect(mapData.collisionGrid.length).toBe(m.w * m.h);
      expect(mapData.warps.length).toBeGreaterThanOrEqual(m.minWarps);

      for (const warp of mapData.warps) {
        const idx = warp.y * mapData.width + warp.x;
        expect(mapData.collisionGrid[idx]).toBe(0);
      }

      for (const tile of new Set(mapData.tileMap!)) {
        const tilePath = path.join(tilesDir, `${tile}.png`);
        expect(fs.existsSync(tilePath)).toBe(true);
      }
    }
  });

  it('validates Ticket 5.1 reciprocal Route 31 <-> Violet Gate <-> Violet City and Sprout Tower 1F/2F/3F warps', () => {
    const r31: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_31.json'), 'utf8')
    );
    const gate: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_31_violet_gate.json'), 'utf8')
    );
    const vc: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/violet_city.json'), 'utf8')
    );
    const st1: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/sprout_tower_1f.json'), 'utf8')
    );
    const st2: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/sprout_tower_2f.json'), 'utf8')
    );
    const st3: MapData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/sprout_tower_3f.json'), 'utf8')
    );

    // 1. Route 31 (4,6)/(4,7) <-> Route 31 Violet Gate (9,4)/(9,5)
    expect(r31.warps).toEqual(
      expect.arrayContaining([
        { x: 4, y: 6, targetMapId: 'route_31_violet_gate', targetX: 9, targetY: 4 },
        { x: 4, y: 7, targetMapId: 'route_31_violet_gate', targetX: 9, targetY: 5 },
      ])
    );
    expect(gate.warps).toEqual(
      expect.arrayContaining([
        { x: 9, y: 4, targetMapId: 'route_31', targetX: 5, targetY: 6 },
        { x: 9, y: 5, targetMapId: 'route_31', targetX: 5, targetY: 7 },
        { x: 0, y: 4, targetMapId: 'violet_city', targetX: 38, targetY: 24 },
        { x: 0, y: 5, targetMapId: 'violet_city', targetX: 38, targetY: 25 },
      ])
    );

    // 2. Violet City schema, non-empty groundLayer, and warps to Gate, Gym, Mart, Center, Academy, Houses, and Sprout Tower
    expect(vc.width).toBe(40);
    expect(vc.height).toBe(36);
    expect(vc.groundLayer.length).toBe(40 * 36);
    expect(vc.warps).toEqual(
      expect.arrayContaining([
        { x: 39, y: 24, targetMapId: 'route_31_violet_gate', targetX: 0, targetY: 4 },
        { x: 39, y: 25, targetMapId: 'route_31_violet_gate', targetX: 0, targetY: 5 },
        { x: 9, y: 17, targetMapId: 'violet_mart', targetX: 2, targetY: 7 },
        { x: 18, y: 17, targetMapId: 'violet_gym', targetX: 4, targetY: 15 },
        { x: 30, y: 17, targetMapId: 'earls_pokemon_academy', targetX: 3, targetY: 15 },
        { x: 31, y: 25, targetMapId: 'violet_poke_center', targetX: 3, targetY: 7 },
        { x: 21, y: 29, targetMapId: 'violet_kyles_house', targetX: 3, targetY: 7 },
        { x: 3, y: 15, targetMapId: 'violet_nickname_speech_house', targetX: 3, targetY: 7 },
        { x: 23, y: 5, targetMapId: 'sprout_tower_1f', targetX: 9, targetY: 15 },
      ])
    );

    // 3. Sprout Tower 1F <-> 2F <-> 3F staircase connectivity
    expect(st1.warps).toEqual(
      expect.arrayContaining([
        { x: 9, y: 15, targetMapId: 'violet_city', targetX: 23, targetY: 6 },
        { x: 10, y: 15, targetMapId: 'violet_city', targetX: 23, targetY: 6 },
        { x: 6, y: 4, targetMapId: 'sprout_tower_2f', targetX: 6, targetY: 4 },
        { x: 2, y: 6, targetMapId: 'sprout_tower_2f', targetX: 2, targetY: 6 },
        { x: 17, y: 3, targetMapId: 'sprout_tower_2f', targetX: 17, targetY: 3 },
      ])
    );
    expect(st2.warps).toEqual(
      expect.arrayContaining([
        { x: 6, y: 4, targetMapId: 'sprout_tower_1f', targetX: 6, targetY: 4 },
        { x: 2, y: 6, targetMapId: 'sprout_tower_1f', targetX: 2, targetY: 6 },
        { x: 17, y: 3, targetMapId: 'sprout_tower_1f', targetX: 17, targetY: 3 },
        { x: 10, y: 14, targetMapId: 'sprout_tower_3f', targetX: 10, targetY: 14 },
      ])
    );
    expect(st3.warps).toEqual([
      { x: 10, y: 14, targetMapId: 'sprout_tower_2f', targetX: 10, targetY: 14 },
    ]);
  });

  it('validates Phase 4 character walk sheets, battle sprites, and audio assets', () => {
    const charsDir = path.resolve(__dirname, '../public/assets/sprites/characters');
    const trainersDir = path.resolve(__dirname, '../public/assets/sprites/trainers');
    const pokemonDir = path.resolve(__dirname, '../public/assets/sprites/pokemon');
    const bgmDir = path.resolve(__dirname, '../public/assets/audio/bgm');
    const sfxDir = path.resolve(__dirname, '../public/assets/audio/sfx');

    const expectedChars = ['falkner.png', 'sage.png', 'earl.png', 'bird_keeper.png', 'elder.png', 'elder_li.png'];
    for (const c of expectedChars) {
      const p = path.join(charsDir, c);
      expect(fs.existsSync(p)).toBe(true);
      const buf = fs.readFileSync(p);
      expect(buf.readUInt32BE(16)).toBe(144);
      expect(buf.readUInt32BE(20)).toBe(32);
    }

    const expectedTrainers = [
      'falkner_front.png',
      'bird_keeper_front.png',
      'sage_front.png',
      'elder_front.png',
      'elder_li_front.png',
    ];
    for (const t of expectedTrainers) {
      expect(fs.existsSync(path.join(trainersDir, t))).toBe(true);
    }

    const expectedPokemon = [
      'pidgeotto_front.png',
      'pidgeotto_back.png',
      'spearow_front.png',
      'spearow_back.png',
      'poliwag_front.png',
      'poliwag_back.png',
      'poliwhirl_front.png',
      'poliwhirl_back.png',
      'marill_front.png',
      'marill_back.png',
      'togepi_front.png',
      'togepi_back.png',
    ];
    for (const p of expectedPokemon) {
      expect(fs.existsSync(path.join(pokemonDir, p))).toBe(true);
    }

    const expectedBgm = [
      'bgm_new_bark_town',
      'bgm_route_29',
      'bgm_cherrygrove_city',
      'bgm_elms_lab',
      'bgm_wild_battle',
      'bgm_trainer_battle',
      'bgm_violet_city',
      'bgm_sprout_tower',
      'bgm_gym',
      'bgm_gym_leader_battle',
    ];
    for (const b of expectedBgm) {
      expect(fs.existsSync(path.join(bgmDir, `${b}.mp3`))).toBe(true);
      expect(fs.existsSync(path.join(bgmDir, `${b}.webm`))).toBe(true);
    }

    expect(fs.existsSync(path.join(sfxDir, 'sfx_badge_get.mp3'))).toBe(true);
    expect(fs.existsSync(path.join(sfxDir, 'sfx_badge_get.webm'))).toBe(true);
  });

  it('validates directional ledge/fence hop collision codes in Route 29 and Route 31', () => {
    const r29Path = path.resolve(__dirname, '../public/assets/data/maps/route_29.json');
    const r29Data: MapData = JSON.parse(fs.readFileSync(r29Path, 'utf8'));
    const r29Codes = new Set(r29Data.collisionGrid);

    // Route 29 has HOP_DOWN (4), HOP_LEFT (6), HOP_RIGHT (7), HOP_DOWN_LEFT (8), HOP_DOWN_RIGHT (9)
    expect(r29Codes.has(4)).toBe(true);
    expect(r29Codes.has(6)).toBe(true);
    expect(r29Codes.has(7)).toBe(true);
    expect(r29Codes.has(8)).toBe(true);
    expect(r29Codes.has(9)).toBe(true);

    const r31Path = path.resolve(__dirname, '../public/assets/data/maps/route_31.json');
    const r31Data: MapData = JSON.parse(fs.readFileSync(r31Path, 'utf8'));
    const r31Codes = new Set(r31Data.collisionGrid);
    expect(r31Codes.has(4)).toBe(true);
    expect(r31Codes.has(7)).toBe(true);
    expect(r31Codes.has(9)).toBe(true);
  });

  it('validates authentic Pokéball sprites and in-battle attack animation VFX', () => {
    const itemsDir = path.resolve(__dirname, '../public/assets/sprites/items');
    const pokeballsDir = path.resolve(__dirname, '../public/assets/sprites/pokeballs');
    const fxDir = path.resolve(__dirname, '../public/assets/sprites/fx');
    const battleFxDir = path.resolve(__dirname, '../public/assets/sprites/battle_fx');

    const expectedBalls = [
      'poke-ball.png',
      'great-ball.png',
      'ultra-ball.png',
      'master-ball.png',
      'fast-ball.png',
      'heavy-ball.png',
      'level-ball.png',
      'lure-ball.png',
      'moon-ball.png',
      'friend-ball.png',
      'love-ball.png',
      'dusk-ball.png',
      'net-ball.png',
      'quick-ball.png',
      'timer-ball.png',
      'repeat-ball.png',
      'nest-ball.png',
    ];

    for (const b of expectedBalls) {
      expect(fs.existsSync(path.join(itemsDir, b))).toBe(true);
      expect(fs.existsSync(path.join(pokeballsDir, b))).toBe(true);
    }

    const expectedFx = [
      'hit.png',
      'cut.png',
      'fire.png',
      'water.png',
      'bubble.png',
      'lightning.png',
      'ice.png',
      'plant.png',
      'rocks.png',
      'smoke.png',
      'shine.png',
      'poison.png',
      'wind.png',
      'speed.png',
      'impact_burst.png',
      'scratch_slash.png',
      'ember_flame.png',
      'water_bubble.png',
      'thunder_spark.png',
      'razor_leaf.png',
      'smoke_puff.png',
    ];

    for (const f of expectedFx) {
      expect(fs.existsSync(path.join(fxDir, f))).toBe(true);
      expect(fs.existsSync(path.join(battleFxDir, f))).toBe(true);
    }
  });

  it('validates Ticket 5.2 Sprout Tower 1F-3F Sages and Elder Li boss encounter registration in main.ts', () => {
    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(path.resolve(__dirname, '../src/world/npcData.ts'), 'utf8');

    const expectedTrainerIds = [
      'sage_chow',
      'sage_nico',
      'sage_edmond',
      'sage_jin',
      'sage_neal',
      'sage_troy',
      'elder_li',
    ];
    for (const id of expectedTrainerIds) {
      expect(mainSrc).toContain(`trainerId: '${id}'`);
    }

    expect(mainSrc).toContain("action: 'ELDER_LI_EVENT'");
    expect(mainSrc).toContain("speciesId: 'bellsprout', level: 7");
    expect(mainSrc).toContain("speciesId: 'hoot-hoot', level: 10");
    expect(mainSrc).toContain("inventory.tms.push('HM05')");
    expect(mainSrc).toContain("inventory.tms.push('TM70')");
    expect(mainSrc).toContain("storyFlags.add('sprout_tower_cleared')");
  });

  it('validates Ticket 5.3 Violet Gym minions, Leader Falkner boss encounter, Zephyr Badge, and TM31 Mud-Slap', () => {
    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(path.resolve(__dirname, '../src/world/npcData.ts'), 'utf8');
    const startMenuSrc = fs.readFileSync(path.resolve(__dirname, '../src/ui/StartMenuUI.ts'), 'utf8');

    expect(mainSrc).toContain("'gym_guide'");
    expect(mainSrc).toContain("trainerId: 'bird_keeper_abe'");
    expect(mainSrc).toContain("trainerId: 'bird_keeper_rod'");
    expect(mainSrc).toContain("trainerId: 'falkner'");
    expect(mainSrc).toContain("action: 'FALKNER_EVENT'");
    expect(mainSrc).toContain("speciesId: 'spearow', level: 9");
    expect(mainSrc).toContain("speciesId: 'pidgey', level: 9, moves: ['tackle', 'sandattack', 'mudslap']");
    expect(mainSrc).toContain("speciesId: 'pidgeotto', level: 13, moves: ['gust', 'tackle', 'mudslap', 'roost']");
    expect(mainSrc).toContain("isGymLeader: true");
    expect(mainSrc).toContain("inventory.badges.push('zephyr')");
    expect(mainSrc).toContain("inventory.tms.push('TM31')");
    expect(mainSrc).toContain("storyFlags.add('falkner_defeated')");

    // StartMenuUI Trainer Card Zephyr Badge entry
    expect(startMenuSrc).toContain("{ id: 'zephyr', name: 'Zephyr', leader: 'Falkner', icon: '🦅' }");
  });

  it('validates Ticket 5.4 Post-Gym Elm Aide Togepi Egg delivery and step-based hatching in main.ts', () => {
    const mainSrc =
      fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
      '\n' +
      fs.readFileSync(path.resolve(__dirname, '../src/world/npcData.ts'), 'utf8');

    expect(mainSrc).toContain("'elms_aide'");
    expect(mainSrc).toContain("action: 'ELMS_AIDE_EVENT'");
    expect(mainSrc).toContain("PokemonFactory.createEgg('togepi', 256)");
    expect(mainSrc).toContain("storyFlags.add('togepi_egg_received')");
    expect(mainSrc).toContain("p.nickname = 'TOGEPI'");
    expect(mainSrc).toContain("Huh? The EGG hatched! ... A lively TOGEPI hatched from the EGG!");
  });

  it('asserts that every NPC across all maps stands on a strictly walkable tile (0 or 2) and Violet City interiors are populated (Ticket 5.5)', () => {
    expect(npcsByMap.violet_city?.length).toBeGreaterThanOrEqual(3);
    expect(npcsByMap.earls_pokemon_academy?.length).toBeGreaterThanOrEqual(3);
    expect(npcsByMap.violet_kyles_house?.length).toBeGreaterThanOrEqual(2);
    expect(npcsByMap.violet_nickname_speech_house?.length).toBeGreaterThanOrEqual(1);

    for (const [mapId, npcs] of Object.entries(npcsByMap)) {
      const mapPath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
      expect(fs.existsSync(mapPath), `Map file for ${mapId} must exist`).toBe(true);
      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      for (const npc of npcs) {
        const gx = npc.gridX ?? npc.x;
        const gy = npc.gridY ?? npc.y;
        const tileVal = mapData.collisionGrid[gy * mapData.width + gx];
        expect(
          [0, 2],
          `NPC ${npc.id} in ${mapId} at (${gx}, ${gy}) must be on a walkable tile (0 or 2) but found ${tileVal}`
        ).toContain(tileVal);
      }
    }
  });

  it("validates Ticket 6.1 Elm's Lab starter Poké Ball bgEvents, Route 29 roadblock, and starter choice modal", () => {
    const labPath = path.resolve(__dirname, '../public/assets/data/maps/elms_lab.json');
    const labData: MapData = JSON.parse(fs.readFileSync(labPath, 'utf8'));
    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');

    const cyndaquilBall = labData.bgEvents?.find((e) => e.x === 6 && e.y === 3);
    const totodileBall = labData.bgEvents?.find((e) => e.x === 7 && e.y === 3);
    const chikoritaBall = labData.bgEvents?.find((e) => e.x === 8 && e.y === 3);

    expect(cyndaquilBall?.action).toBe('STARTER_CYNDAQUIL');
    expect(cyndaquilBall?.pages[0]).toContain("It's CYNDAQUIL, a FIRE POKéMON!");
    expect(totodileBall?.action).toBe('STARTER_TOTODILE');
    expect(totodileBall?.pages[0]).toContain("It's TOTODILE, a WATER POKéMON!");
    expect(chikoritaBall?.action).toBe('STARTER_CHIKORITA');
    expect(chikoritaBall?.pages[0]).toContain("It's CHIKORITA, a GRASS POKéMON!");

    // Walkable floor tiles directly in front of the table at (6, 4), (7, 4), (8, 4)
    expect(labData.collisionGrid[4 * labData.width + 6]).toBe(0);
    expect(labData.collisionGrid[4 * labData.width + 7]).toBe(0);
    expect(labData.collisionGrid[4 * labData.width + 8]).toBe(0);

    // Starter modal & Route 29 roadblock checks
    expect(mainSrc).toContain('overworldHUD.openStarterChoiceModal');
    expect(mainSrc).toContain("storyFlags.add('starter_chosen')");
    expect(mainSrc).toContain("It's an empty POKé BALL.");
    expect(mainSrc).toContain("current.id === 'new_bark_town' && conn.mapId === 'route_29' && playerParty.length === 0");
  });

  it('validates Ticket 6.2 Real-Time Day / Night wild encounters & outdoor classification in MapManager', () => {
    const route29Path = path.resolve(__dirname, '../public/assets/data/maps/route_29.json');
    const route29Data: MapData = JSON.parse(fs.readFileSync(route29Path, 'utf8'));

    const mm = new MapManager();
    mm.registerMap(route29Data);
    mm.setCurrentMap('route_29');

    expect(mm.isCurrentMapOutdoor()).toBe(true);
    expect(MapManager.isOutdoorMap('route_29')).toBe(true);
    expect(MapManager.isOutdoorMap('elms_lab')).toBe(false);

    // Guaranteed encounter trigger (rng = 0.05 < 0.125)
    // Force slot selection with rng = 0.0
    const morningRoll = mm.rollWildEncounter(2, undefined, () => 0.05, 'MORNING');
    expect(morningRoll).not.toBeNull();
    expect(['pidgey', 'sentret']).toContain(morningRoll?.speciesId);

    const nightRoll = mm.rollWildEncounter(2, undefined, () => 0.05, 'NIGHT');
    expect(nightRoll).not.toBeNull();
    expect(['hoothoot', 'rattata']).toContain(nightRoll?.speciesId);
  });

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

    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
    expect(mainSrc).toContain("action === 'BUGSY_EVENT'");
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

    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
    expect(mainSrc).toContain("action === 'WHITNEY_EVENT'");
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

    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
    expect(mainSrc).toContain("action === 'MORTY_EVENT'");
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

    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
    expect(mainSrc).toContain("action === 'JASMINE_EVENT'");
    expect(mainSrc).toContain("action === 'CHUCK_EVENT'");
    expect(mainSrc).toContain("action === 'AMPHY_EVENT'");
    expect(mainSrc).toContain("action === 'PHARMACY_SECRET_POTION_EVENT'");
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

    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
    expect(mainSrc).toContain("action === 'PRYCE_EVENT'");
    expect(mainSrc).toContain("action === 'CLAIR_EVENT'");
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
    expect(fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8')).toContain("action === 'E4_EVENT'");
  });

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

    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
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

    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
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
});
