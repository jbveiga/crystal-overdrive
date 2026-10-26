import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MapManager } from '../src/world/MapManager';
import type { MapData } from '../src/types/game';
import { ANIMATED_WATER_TILES } from '../src/render/tileConstants';

describe('GitHub Issue #24: Route 34 (15, 36) Johto Modern Tileset & Walkability', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

  const loadMap = (id: string): MapData =>
    JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8')) as MapData;

  it('builds route_34, goldenrod_city, azalea_town, and route_33 with authentic johto_modern (jt_m_*) tiles', () => {
    for (const mapId of ['route_34', 'goldenrod_city', 'azalea_town', 'route_33']) {
      const map = loadMap(mapId);
      expect(map.tileMap.length).toBe(map.width * map.height);
      expect(map.tileMap.every((tile) => tile.startsWith('jt_m_'))).toBe(true);

      // Verify every referenced PNG tile exists in public/assets/tiles
      const uniqueTiles = new Set(map.tileMap);
      for (const tile of uniqueTiles) {
        expect(fs.existsSync(path.join(tilesDir, `${tile}.png`))).toBe(true);
      }
    }
  });

  it('clears the false water buoy barrier at route_34 (15, 36) and provides an unobstructed walkable road north to Goldenrod City', () => {
    const route34 = loadMap('route_34');
    const goldenrod = loadMap('goldenrod_city');

    const mapManager = new MapManager();
    mapManager.registerMap(route34);
    mapManager.registerMap(goldenrod);
    mapManager.setCurrentMap('route_34');

    // Coordinate (15, 36) directly north of Ilex Forest Gate exit (13..14, 37) must be walkable road (0)
    expect(mapManager.getTileType(15, 36)).toBe(0);
    expect(mapManager.isWalkable(15, 36)).toBe(true);

    // Verify the paved road column (x = 16 or x = 15..16) from y = 36 north through y = 22 is walkable (0 or 2), not water (3)
    for (let y = 22; y <= 36; y++) {
      const rowWalkable = [12, 13, 14, 15, 16, 17].some((x) => {
        const t = mapManager.getTileType(x, y);
        return t === 0 || t === 2;
      });
      expect(rowWalkable).toBe(true);
    }

    // Specifically verify y = 34 and y = 35 at x = 12..15 (where metatile 0x32 sits) are walkable road (0), not water (3)
    for (const y of [34, 35]) {
      for (const x of [12, 13, 14, 15]) {
        expect(mapManager.getTileType(x, y)).toBe(0);
        expect(mapManager.isWalkable(x, y)).toBe(true);
      }
    }
  });

  it('registers johto_modern water tiles in ANIMATED_WATER_TILES with __w1 and __w2 shimmer frames', () => {
    const jtmWaterTiles = [
      'jt_m_14_14_14_14',
      'jt_m_14_3b_14_3b',
      'jt_m_14_4b_14_14',
      'jt_m_3d_14_3d_14',
      'jt_m_4c_4c_14_14',
      'jt_m_4c_5d_14_3b',
      'jt_m_4d_14_14_14',
      'jt_m_5c_4c_3d_14',
    ];

    for (const tile of jtmWaterTiles) {
      expect(ANIMATED_WATER_TILES).toContain(tile);
      expect(fs.existsSync(path.join(tilesDir, `${tile}.png`))).toBe(true);
      expect(fs.existsSync(path.join(tilesDir, `${tile}__w1.png`))).toBe(true);
      expect(fs.existsSync(path.join(tilesDir, `${tile}__w2.png`))).toBe(true);
    }
  });
});
