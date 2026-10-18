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
    expect(mapData.width).toBe(16);
    expect(mapData.height).toBe(12);
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

    // Verify Warps
    expect(mapData.warps.length).toBeGreaterThanOrEqual(2);
    const labWarp = mapData.warps.find((w) => w.targetMapId === 'elms_lab');
    expect(labWarp).toBeDefined();
    expect(labWarp?.x).toBe(4);
    expect(labWarp?.y).toBe(3);

    const houseWarp = mapData.warps.find((w) => w.targetMapId === 'players_house_1f');
    expect(houseWarp).toBeDefined();
    expect(houseWarp?.x).toBe(12);
    expect(houseWarp?.y).toBe(3);

    // Verify Route 29 West Connection
    expect(mapData.connections.WEST).toBeDefined();
    expect(mapData.connections.WEST?.mapId).toBe('route_29');
  });
});
