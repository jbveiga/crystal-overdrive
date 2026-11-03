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
import type { MapData } from '../../src/types/game';

describe('GitHub Issues #67 & #68 Verification Suite', () => {
  it('Issue #67: Strength boulder in Mount Mortar uses authentic boulder.png sprite sheet, distinct from Sudowoodo', () => {
    expect(NPC_SHEET_PATHS.boulder).toBe('./assets/sprites/characters/boulder.png');

    const boulderPath = path.resolve(__dirname, '../../public/assets/sprites/characters/boulder.png');
    const sudowoodoPath = path.resolve(__dirname, '../../public/assets/sprites/characters/sudowoodo.png');
    expect(fs.existsSync(boulderPath)).toBe(true);
    expect(fs.existsSync(sudowoodoPath)).toBe(true);

    const bBuf = fs.readFileSync(boulderPath);
    const sBuf = fs.readFileSync(sudowoodoPath);

    // Boulder is 144x32
    expect(bBuf.readUInt32BE(16)).toBe(144);
    expect(bBuf.readUInt32BE(20)).toBe(32);

    // Boulder is not a copy of Sudowoodo
    expect(bBuf.equals(sBuf)).toBe(false);

    // Verify Mount Mortar NPC definition uses spriteType boulder
    const npcs = createNpcsByMap();
    const mmBoulders = (npcs.mount_mortar_1f_inside || []).filter((n) => n.id.includes('boulder'));
    expect(mmBoulders.length).toBeGreaterThan(0);
    for (const b of mmBoulders) {
      expect(b.spriteType).toBe('boulder');
    }
  });

  it('Issue #68: Mahogany Town Pokémon Center and Gym doors are canonically aligned with their warps and signs', () => {
    const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
    const mt: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_town.json'), 'utf8'));

    // 1. Gym warp at (6, 13) leading to mahogany_gym (4, 17)
    const gymWarp = mt.warps.find((w) => w.targetMapId === 'mahogany_gym');
    expect(gymWarp).toBeDefined();
    expect(gymWarp?.x).toBe(6);
    expect(gymWarp?.y).toBe(13);

    // 2. Poké Center warp at (15, 13) leading to mahogany_poke_center (3, 7)
    const pcWarp = mt.warps.find((w) => w.targetMapId === 'mahogany_poke_center' && w.x === 15);
    expect(pcWarp).toBeDefined();
    expect(pcWarp?.x).toBe(15);
    expect(pcWarp?.y).toBe(13);

    // 3. Compatibility fallback warp for players at (3, 13)
    const compatWarp = mt.warps.find((w) => w.targetMapId === 'mahogany_poke_center' && w.x === 3);
    expect(compatWarp).toBeDefined();

    // 4. Verify canonical door mat tiles (37_38_39_3a) at (6, 13) and (15, 13)
    const gymDoorTile = mt.tileMap[13 * mt.width + 6];
    const pcDoorTile = mt.tileMap[13 * mt.width + 15];
    expect(gymDoorTile).toContain('37_38_39_3a');
    expect(pcDoorTile).toContain('37_38_39_3a');

    // 5. Verify signs are positioned adjacent to respective buildings
    const gymSign = mt.bgEvents.find((bg) => bg.x === 3 && bg.y === 13);
    expect(gymSign).toBeDefined();
    expect(gymSign?.text).toContain('MAHOGANY TOWN POKéMON GYM');

    const pcSign = mt.bgEvents.find((bg) => bg.x === 16 && bg.y === 13);
    expect(pcSign).toBeDefined();
    expect(pcSign?.text).toContain('POKéMON CENTER');
  });
});
