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

  it('validates all 9 authentic indoor maps, their tile PNGs, and exit warps', () => {
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
});

