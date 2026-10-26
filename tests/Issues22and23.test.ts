import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData, WarpEvent } from '../src/types/game';
import { MapManager } from '../src/world/MapManager';
import { ANIMATED_WATER_TILES } from '../src/render/tileConstants';
import { ISSUE_RESOLUTIONS } from '../src/sync/githubSync';

describe('GitHub Issues #22 & #23 Regression & Validation Suite', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

  function loadMap(id: string): MapData {
    const filePath = path.join(mapsDir, `${id}.json`);
    expect(fs.existsSync(filePath), `Map file ${id}.json must exist`).toBe(true);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  describe('Issue #22: Route 34 Gate Cardinal Warps & Door Threshold Navigation', () => {
    it('detects required warp directions accurately for cardinal boundaries', () => {
      const gateMap = loadMap('route_34_ilex_forest_gate');
      expect(gateMap).toBeDefined();

      const northWarp: WarpEvent = { x: 4, y: 0, targetMapId: 'route_34', targetX: 10, targetY: 56 };
      const southWarp1: WarpEvent = { x: 4, y: 7, targetMapId: 'ilex_forest', targetX: 20, targetY: 5 };
      const southWarp2: WarpEvent = { x: 5, y: 7, targetMapId: 'ilex_forest', targetX: 21, targetY: 5 };

      expect(MapManager.getRequiredWarpDirection(northWarp, gateMap)).toBe('UP');
      expect(MapManager.getRequiredWarpDirection(southWarp1, gateMap)).toBe('DOWN');
      expect(MapManager.getRequiredWarpDirection(southWarp2, gateMap)).toBe('DOWN');

      // Test east/west synthetic warps
      const dummyMap: MapData = {
        id: 'test_gate',
        name: 'Test Gate',
        width: 10,
        height: 10,
        collisionGrid: new Array(100).fill(0),
        tileMap: new Array(100).fill('test'),
        warps: [],
        doors: [],
        bgEvents: [],
      };
      const westWarp: WarpEvent = { x: 0, y: 5, targetMapId: 'west_route', targetX: 10, targetY: 10 };
      const eastWarp: WarpEvent = { x: 9, y: 5, targetMapId: 'east_route', targetX: 0, targetY: 10 };

      expect(MapManager.getRequiredWarpDirection(westWarp, dummyMap)).toBe('LEFT');
      expect(MapManager.getRequiredWarpDirection(eastWarp, dummyMap)).toBe('RIGHT');
    });

    it('correctly distinguishes south carpet warps from north doorway warps', () => {
      const gateMap = loadMap('route_34_ilex_forest_gate');
      const northWarp: WarpEvent = { x: 4, y: 0, targetMapId: 'route_34', targetX: 10, targetY: 56 };
      const southWarp: WarpEvent = { x: 4, y: 7, targetMapId: 'ilex_forest', targetX: 20, targetY: 5 };

      expect(MapManager.isCarpetWarp(northWarp, gateMap)).toBe(false);
      expect(MapManager.isCarpetWarp(southWarp, gateMap)).toBe(true);
    });

    it('spawns player north of doorway (targetY - 1, facing UP) when exiting via north gate', () => {
      const gateMap = loadMap('route_34_ilex_forest_gate');
      const northWarp: WarpEvent = { x: 4, y: 0, targetMapId: 'route_34', targetX: 10, targetY: 56 };

      const transition = MapManager.resolveWarpTransition(northWarp, gateMap);
      expect(transition.targetMapId).toBe('route_34');
      expect(transition.landingX).toBe(10);
      expect(transition.landingY).toBe(55); // targetY - 1 for north gate
      expect(transition.landingFacing).toBe('UP');
    });

    it('spawns player south of doorway (targetY + 1, facing DOWN) when exiting via south gate', () => {
      const gateMap = loadMap('route_34_ilex_forest_gate');
      const southWarp: WarpEvent = { x: 4, y: 7, targetMapId: 'ilex_forest', targetX: 20, targetY: 5 };

      const transition = MapManager.resolveWarpTransition(southWarp, gateMap);
      expect(transition.targetMapId).toBe('ilex_forest');
      expect(transition.landingX).toBe(20);
      expect(transition.landingY).toBe(6); // targetY + 1 for south gate
      expect(transition.landingFacing).toBe('DOWN');
    });
  });

  describe('Issue #23: Ilex Forest Animated Water Tiles & Shimmer Assets', () => {
    it('asserts all water collision (3) tiles in ilex_forest are registered in ANIMATED_WATER_TILES', () => {
      const forestMap = loadMap('ilex_forest');
      const waterTiles = new Set<string>();

      for (let i = 0; i < forestMap.collisionGrid.length; i++) {
        if (forestMap.collisionGrid[i] === 3) {
          waterTiles.add(forestMap.tileMap[i]);
        }
      }

      expect(waterTiles.size).toBeGreaterThan(0);

      for (const tileName of waterTiles) {
        expect(
          ANIMATED_WATER_TILES.includes(tileName),
          `Tile "${tileName}" in ilex_forest with water collision must be registered in ANIMATED_WATER_TILES`
        ).toBe(true);
      }
    });

    it('verifies that all forest animated water tiles exist with valid PNG frames on disk', () => {
      const forestWaterTiles = [
        'in_forest_14_14_14_14',
        'in_forest_09_2a_1b_14',
        'in_forest_2a_2a_14_14',
        'in_forest_2a_0b_14_19',
        'in_forest_1b_14_1b_14',
        'in_forest_14_19_14_19',
      ];

      const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      for (const tile of forestWaterTiles) {
        const baseFile = path.join(tilesDir, `${tile}.png`);
        const w1File = path.join(tilesDir, `${tile}__w1.png`);
        const w2File = path.join(tilesDir, `${tile}__w2.png`);

        expect(fs.existsSync(baseFile), `Base tile ${tile}.png must exist`).toBe(true);
        expect(fs.existsSync(w1File), `Frame __w1 ${tile}__w1.png must exist`).toBe(true);
        expect(fs.existsSync(w2File), `Frame __w2 ${tile}__w2.png must exist`).toBe(true);

        const w1Buf = fs.readFileSync(w1File);
        const w2Buf = fs.readFileSync(w2File);
        expect(w1Buf.subarray(0, 4).equals(pngMagic)).toBe(true);
        expect(w2Buf.subarray(0, 4).equals(pngMagic)).toBe(true);
      }
    });
  });

  describe('GitHub Headless Resolution Consistency', () => {
    it('contains complete resolution narratives for Issue #22 and Issue #23', () => {
      expect(ISSUE_RESOLUTIONS[22]).toBeDefined();
      expect(ISSUE_RESOLUTIONS[22].titleMatch).toContain('route_34_ilex_forest_gate');
      expect(ISSUE_RESOLUTIONS[22].resolution).toContain('MapManager.getRequiredWarpDirection');

      expect(ISSUE_RESOLUTIONS[23]).toBeDefined();
      expect(ISSUE_RESOLUTIONS[23].titleMatch).toContain('ilex_forest');
      expect(ISSUE_RESOLUTIONS[23].resolution).toContain('ANIMATED_WATER_TILES');
      expect(ISSUE_RESOLUTIONS[23].resolution).toContain('in_forest_14_14_14_14');
    });
  });
});
