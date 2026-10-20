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

      // Every indoor map has 2 exit carpet warps at the bottom row
      expect(mapData.warps.length).toBe(2);
      for (const warp of mapData.warps) {
        const idx = warp.y * mapData.width + warp.x;
        expect(mapData.collisionGrid[idx]).toBe(0);
      }
    }
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
});

