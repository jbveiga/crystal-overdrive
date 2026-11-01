// Mock minimal browser globals for PixiJS environment hydration in node
if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import { NPC_SHEET_PATHS } from '../../src/render/OverworldNpcAndItemSprites';
import type { MapData } from '../../src/types/map';

describe('GitHub Issues #65 & #66 Verification Suite', () => {
  it('Issue #65: Amphy in Olivine Lighthouse 6F uses authentic ampharos sprite sheet instead of fat_man', () => {
    expect(NPC_SHEET_PATHS.ampharos).toBe('./assets/sprites/characters/ampharos.png');

    const ampharosPath = path.resolve(__dirname, '../../public/assets/sprites/characters/ampharos.png');
    expect(fs.existsSync(ampharosPath)).toBe(true);

    const buf = fs.readFileSync(ampharosPath);
    expect(buf.readUInt32BE(16)).toBe(144);
    expect(buf.readUInt32BE(20)).toBe(32);

    const npcs = createNpcsByMap();
    const amphy = npcs.olivine_lighthouse_6f.find((n) => n.id === 'lighthouse_amphy');
    expect(amphy).toBeDefined();
    expect(amphy?.spriteType).toBe('ampharos');
    expect(amphy?.spriteType).not.toBe('fat_man');
  });

  it('Issue #65 & #66: whirlpools do NOT render on beds in olivine_lighthouse_6f or interior tiles in olivine_gym', () => {
    const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
    const gym: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'olivine_gym.json'), 'utf8'));
    const lh6f: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'olivine_lighthouse_6f.json'), 'utf8'));
    const r41: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_41.json'), 'utf8'));

    const isWhirlpoolTile = (map: MapData, index: number, tileName: string, x: number, y: number): boolean => {
      return (
        map.collisionGrid[index] === 1 &&
        (tileName.includes('whirlpool') ||
          (map.id === 'route_41' &&
            ((x === 12 && y === 17) ||
              (x === 36 && y === 19) ||
              (x === 12 && y === 37) ||
              (x === 36 && y === 45))))
      );
    };

    // Check Olivine Gym has 0 whirlpool tiles
    let gymWhirlpools = 0;
    gym.tileMap.forEach((tileName, index) => {
      const x = index % gym.width;
      const y = Math.floor(index / gym.width);
      if (isWhirlpoolTile(gym, index, tileName, x, y)) gymWhirlpools++;
    });
    expect(gymWhirlpools).toBe(0);

    // Check Olivine Lighthouse 6F has 0 whirlpool tiles
    let lh6fWhirlpools = 0;
    lh6f.tileMap.forEach((tileName, index) => {
      const x = index % lh6f.width;
      const y = Math.floor(index / lh6f.width);
      if (isWhirlpoolTile(lh6f, index, tileName, x, y)) lh6fWhirlpools++;
    });
    expect(lh6fWhirlpools).toBe(0);

    // Verify Route 41 correctly retains its 4 canonical whirlpools
    let r41Whirlpools = 0;
    r41.tileMap.forEach((tileName, index) => {
      const x = index % r41.width;
      const y = Math.floor(index / r41.width);
      if (isWhirlpoolTile(r41, index, tileName, x, y)) r41Whirlpools++;
    });
    expect(r41Whirlpools).toBe(4);
  });
});
