import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../src/types/game';

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
    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');

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
    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
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
    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');

    expect(mainSrc).toContain("'elms_aide'");
    expect(mainSrc).toContain("action: 'ELMS_AIDE_EVENT'");
    expect(mainSrc).toContain("PokemonFactory.createEgg('togepi', 256)");
    expect(mainSrc).toContain("storyFlags.add('togepi_egg_received')");
    expect(mainSrc).toContain("p.nickname = 'TOGEPI'");
    expect(mainSrc).toContain("Huh? The EGG hatched! ... A lively TOGEPI hatched from the EGG!");
  });
});

