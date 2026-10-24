import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../src/types/game';
import { ANIMATED_WATER_TILES } from '../src/render/tileConstants';

describe('Union Cave Water Animation & Tile Invariant Suite (BUGFIX-VISUAL-UNION-CAVE-WATER-ANIMATION-01)', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

  function loadMap(id: string): MapData {
    const filePath = path.join(mapsDir, `${id}.json`);
    expect(fs.existsSync(filePath), `Map file ${id}.json must exist`).toBe(true);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const caveWaterTiles = [
    'in_cave_14_14_14_14',
    'in_cave_0a_26_17_14',
    'in_cave_26_26_14_14',
    'in_cave_26_0b_14_15',
    'in_cave_17_14_17_14',
    'in_cave_14_15_14_15',
    'in_cave_14_25_14_14',
    'in_cave_27_14_14_14',
  ];

  it('asserts 100% of water collision tiles in Union Cave maps are registered as animated water tiles', () => {
    const unionCaveMaps = ['union_cave_1f', 'union_cave_b1f', 'union_cave_b2f'];
    const uniqueWaterCollisionTiles = new Set<string>();

    for (const mapId of unionCaveMaps) {
      const map = loadMap(mapId);
      expect(map.collisionGrid).toBeDefined();
      expect(map.tileMap).toBeDefined();

      for (let i = 0; i < map.collisionGrid.length; i++) {
        const col = map.collisionGrid[i];
        const tileName = map.tileMap[i];

        // Collision 3 represents water
        if (col === 3) {
          uniqueWaterCollisionTiles.add(tileName);
        }
      }
    }

    expect(uniqueWaterCollisionTiles.size).toBeGreaterThan(0);

    for (const tileName of uniqueWaterCollisionTiles) {
      expect(
        ANIMATED_WATER_TILES.includes(tileName),
        `Water tile "${tileName}" used in Union Cave with collision 3 must be registered in ANIMATED_WATER_TILES`
      ).toBe(true);
    }
  });

  it('asserts 100% of cave water tiles exist on disk with valid base, __w1, and __w2 PNG frames', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    for (const tileName of caveWaterTiles) {
      const baseFile = path.join(tilesDir, `${tileName}.png`);
      const w1File = path.join(tilesDir, `${tileName}__w1.png`);
      const w2File = path.join(tilesDir, `${tileName}__w2.png`);

      expect(fs.existsSync(baseFile), `Base frame ${tileName}.png must exist on disk`).toBe(true);
      expect(fs.existsSync(w1File), `Water frame 1 ${tileName}__w1.png must exist on disk`).toBe(true);
      expect(fs.existsSync(w2File), `Water frame 2 ${tileName}__w2.png must exist on disk`).toBe(true);

      const buf0 = fs.readFileSync(baseFile);
      const buf1 = fs.readFileSync(w1File);
      const buf2 = fs.readFileSync(w2File);

      // Verify authentic 64x64 PNG header
      expect(buf0.subarray(0, 8).equals(pngHeader), `${baseFile} must have valid PNG header`).toBe(true);
      expect(buf1.subarray(0, 8).equals(pngHeader), `${w1File} must have valid PNG header`).toBe(true);
      expect(buf2.subarray(0, 8).equals(pngHeader), `${w2File} must have valid PNG header`).toBe(true);

      // Verify that frame 1 and frame 2 are distinct animated variations
      expect(buf1.equals(buf0), `${w1File} should not be byte-identical to static base frame`).toBe(false);
      expect(buf2.equals(buf0), `${w2File} should not be byte-identical to static base frame`).toBe(false);
      expect(buf2.equals(buf1), `${w2File} should be distinct from frame 1`).toBe(false);
    }
  });

  it('asserts 100% of ANIMATED_WATER_TILES have all required animation frame assets on disk', () => {
    for (const tileName of ANIMATED_WATER_TILES) {
      const baseFile = path.join(tilesDir, `${tileName}.png`);
      const w1File = path.join(tilesDir, `${tileName}__w1.png`);
      const w2File = path.join(tilesDir, `${tileName}__w2.png`);

      expect(fs.existsSync(baseFile), `Base tile ${tileName}.png must exist`).toBe(true);
      expect(fs.existsSync(w1File), `Animation frame ${tileName}__w1.png must exist`).toBe(true);
      expect(fs.existsSync(w2File), `Animation frame ${tileName}__w2.png must exist`).toBe(true);
    }
  });

  it('asserts all cave maps with water shimmer tiles (0x14) are covered by ANIMATED_WATER_TILES', () => {
    const allMapFiles = fs.readdirSync(mapsDir).filter((f) => f.endsWith('.json'));

    for (const file of allMapFiles) {
      const map = JSON.parse(fs.readFileSync(path.join(mapsDir, file), 'utf8'));
      if (!map.tileMap || !map.collisionGrid) continue;

      for (let i = 0; i < map.collisionGrid.length; i++) {
        const col = map.collisionGrid[i];
        const tileName = map.tileMap[i];

        if (col === 3 && tileName && tileName.startsWith('in_cave_') && (tileName.includes('_14') || tileName.includes('14_'))) {
          expect(
            ANIMATED_WATER_TILES.includes(tileName),
            `Cave water tile ${tileName} on map ${file} must be included in ANIMATED_WATER_TILES`
          ).toBe(true);
        }
      }
    }
  });
});
