import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import { createEcruteakToRoute39Npcs } from '../../src/world/npcs/ecruteakToRoute39Npcs';

describe('TICKET-BUGFIX-ECRUTEAK-ITEMFINDER-HOUSE-01: Indoor Map & Tileset Dataset Integrity', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const mapsDir = path.join(rootDir, 'public/assets/data/maps');
  const tilesDir = path.join(rootDir, 'public/assets/tiles');

  const itemfinderMap: MapData = JSON.parse(
    fs.readFileSync(path.join(mapsDir, 'ecruteak_itemfinder_house.json'), 'utf8')
  );
  const researchMap: MapData = JSON.parse(
    fs.readFileSync(path.join(mapsDir, 'ruins_of_alph_research_center.json'), 'utf8')
  );
  const nicknameMap: MapData = JSON.parse(
    fs.readFileSync(path.join(mapsDir, 'violet_nickname_speech_house.json'), 'utf8')
  );

  it('1. should compile ecruteak_itemfinder_house with authentic traditional_house tileset and House2.blk', () => {
    expect(itemfinderMap.width).toBe(8);
    expect(itemfinderMap.height).toBe(8);
    // All tiles must belong to traditional_house tileset
    const nonTradTiles = itemfinderMap.tileMap.filter(
      (t) => !t.startsWith('in_traditional_house_')
    );
    expect(nonTradTiles).toEqual([]);
  });

  it('2. should place item_man at walkable coordinates (2, 3) in ecruteak_itemfinder_house', () => {
    const npcs = createEcruteakToRoute39Npcs();
    const houseNpcs = npcs.ecruteak_itemfinder_house;
    expect(houseNpcs).toBeDefined();

    const itemMan = houseNpcs?.find((n) => n.id === 'item_man');
    expect(itemMan).toBeDefined();
    expect(itemMan?.x).toBe(2);
    expect(itemMan?.y).toBe(3);
    expect(itemMan?.direction).toBe('DOWN');
  });

  it('3. should assert (2, 3) has collision 0 while table at (3, 3) has collision 1', () => {
    const floorIndex = 3 * itemfinderMap.width + 2;
    const tableIndex = 3 * itemfinderMap.width + 3;

    expect(itemfinderMap.collisionGrid[floorIndex]).toBe(0);
    expect(itemfinderMap.collisionGrid[tableIndex]).toBe(1);
  });

  it('4. should compile ruins_of_alph_research_center with authentic facility tileset and RuinsOfAlphResearchCenter.blk', () => {
    expect(researchMap.width).toBe(8);
    expect(researchMap.height).toBe(8);
    const nonFacilityTiles = researchMap.tileMap.filter((t) => !t.startsWith('in_facility_'));
    expect(nonFacilityTiles).toEqual([]);
  });

  it('5. should compile violet_nickname_speech_house with authentic traditional_house tileset', () => {
    expect(nicknameMap.width).toBe(8);
    expect(nicknameMap.height).toBe(8);
    const nonTradTiles = nicknameMap.tileMap.filter(
      (t) => !t.startsWith('in_traditional_house_')
    );
    expect(nonTradTiles).toEqual([]);
  });

  it('6. should preserve all warps at (3, 7) and (4, 7) in ecruteak_itemfinder_house with collision 0', () => {
    expect(itemfinderMap.warps.length).toBeGreaterThanOrEqual(2);
    const w1 = itemfinderMap.warps.find((w) => w.x === 3 && w.y === 7);
    const w2 = itemfinderMap.warps.find((w) => w.x === 4 && w.y === 7);

    expect(w1).toBeDefined();
    expect(w1?.targetMapId).toBe('ecruteak_city');
    expect(itemfinderMap.collisionGrid[7 * itemfinderMap.width + 3]).toBe(0);

    expect(w2).toBeDefined();
    expect(w2?.targetMapId).toBe('ecruteak_city');
    expect(itemfinderMap.collisionGrid[7 * itemfinderMap.width + 4]).toBe(0);
  });

  it('7. should preserve all warps in ruins_of_alph_research_center with collision 0', () => {
    expect(researchMap.warps.length).toBeGreaterThanOrEqual(2);
    for (const warp of researchMap.warps) {
      expect(warp.targetMapId).toBe('ruins_of_alph_outside');
      const coll = researchMap.collisionGrid[warp.y * researchMap.width + warp.x];
      expect(coll).toBe(0);
    }
  });

  it('8. should verify zero broken image tile references across all 3 recompiled maps', () => {
    const allUniqueTiles = new Set<string>([
      ...itemfinderMap.tileMap,
      ...researchMap.tileMap,
      ...nicknameMap.tileMap,
    ]);

    const missingTiles: string[] = [];
    for (const tileId of allUniqueTiles) {
      const tilePath = path.join(tilesDir, `${tileId}.png`);
      if (!fs.existsSync(tilePath)) {
        missingTiles.push(tileId);
      }
    }

    expect(missingTiles).toEqual([]);
  });
});
