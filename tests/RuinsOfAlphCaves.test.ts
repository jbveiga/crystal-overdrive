import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../src/types/game';

describe('Ruins of Alph Cave Interiors & Chambers (TICKET-WORLD-RUINS-OF-ALPH-CAVES-01)', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

  function loadMap(id: string): MapData {
    const filePath = path.join(mapsDir, `${id}.json`);
    expect(fs.existsSync(filePath), `Map file ${id}.json should exist`).toBe(true);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  it('verifies authentic Kabuto Chamber structure, dimensions, and tiles', () => {
    const kabuto = loadMap('ruins_of_alph_kabuto_chamber');
    expect(kabuto.id).toBe('ruins_of_alph_kabuto_chamber');
    expect(kabuto.width).toBe(8);
    expect(kabuto.height).toBe(10);
    expect(kabuto.collisionGrid.length).toBe(80);
    expect(kabuto.tileMap.length).toBe(80);

    // Verify door tiles at (3, 9) and (4, 9) are walkable (0)
    expect(kabuto.collisionGrid[9 * 8 + 3]).toBe(0);
    expect(kabuto.collisionGrid[9 * 8 + 4]).toBe(0);

    // Verify all referenced tiles exist in public/assets/tiles/
    for (const tileName of kabuto.tileMap) {
      const tilePath = path.join(tilesDir, `${tileName}.png`);
      expect(fs.existsSync(tilePath), `Tile ${tileName}.png should exist`).toBe(true);
    }
  });

  it('verifies authentic Inner Chamber structure, dimensions, and wild Unown encounters', () => {
    const inner = loadMap('ruins_of_alph_inner_chamber');
    expect(inner.id).toBe('ruins_of_alph_inner_chamber');
    expect(inner.width).toBe(20);
    expect(inner.height).toBe(28);
    expect(inner.collisionGrid.length).toBe(560);
    expect(inner.tileMap.length).toBe(560);

    // Verify wild Unown encounter table (speciesId: 'unown', Lv. 5, weight: 100)
    expect(inner.grassEncounters).toBeDefined();
    expect(inner.grassEncounters?.length).toBeGreaterThanOrEqual(1);
    const unownEncounter = inner.grassEncounters?.find((e) => e.speciesId === 'unown');
    expect(unownEncounter).toBeDefined();
    expect(unownEncounter?.minLevel).toBe(5);
    expect(unownEncounter?.maxLevel).toBe(5);
    expect(unownEncounter?.weight).toBe(100);

    // Verify all referenced tiles exist in public/assets/tiles/
    for (const tileName of inner.tileMap) {
      const tilePath = path.join(tilesDir, `${tileName}.png`);
      expect(fs.existsSync(tilePath), `Tile ${tileName}.png should exist`).toBe(true);
    }
  });

  it('verifies reciprocal warps between exterior and cave chambers', () => {
    const outside = loadMap('ruins_of_alph_outside');
    const kabuto = loadMap('ruins_of_alph_kabuto_chamber');
    const inner = loadMap('ruins_of_alph_inner_chamber');
    const lab = loadMap('ruins_of_alph_research_center');

    // 1. Outside -> Kabuto Chamber at (14, 7)
    const warpToKabuto = outside.warps.find((w) => w.x === 14 && w.y === 7);
    expect(warpToKabuto).toBeDefined();
    expect(warpToKabuto?.targetMapId).toBe('ruins_of_alph_kabuto_chamber');
    // Landing point in Kabuto chamber must be walkable
    const kabutoTargetCol = kabuto.collisionGrid[warpToKabuto!.targetY * kabuto.width + warpToKabuto!.targetX];
    expect(kabutoTargetCol === 0 || kabutoTargetCol === 2).toBe(true);

    // Reciprocal: Kabuto Chamber -> Outside
    const exitFromKabuto = kabuto.warps.find((w) => w.targetMapId === 'ruins_of_alph_outside');
    expect(exitFromKabuto).toBeDefined();
    expect(exitFromKabuto?.targetX).toBe(14);
    expect(exitFromKabuto?.targetY).toBe(7);

    // 2. Outside -> Inner Chamber at (10, 13)
    const warpToInner = outside.warps.find((w) => w.x === 10 && w.y === 13);
    expect(warpToInner).toBeDefined();
    expect(warpToInner?.targetMapId).toBe('ruins_of_alph_inner_chamber');
    // Landing point in Inner chamber must be walkable
    const innerTargetCol = inner.collisionGrid[warpToInner!.targetY * inner.width + warpToInner!.targetX];
    expect(innerTargetCol === 0 || innerTargetCol === 2).toBe(true);

    // Reciprocal: Inner Chamber -> Outside
    const exitFromInner = inner.warps.find((w) => w.targetMapId === 'ruins_of_alph_outside');
    expect(exitFromInner).toBeDefined();
    expect(exitFromInner?.targetX).toBe(10);
    expect(exitFromInner?.targetY).toBe(13);

    // 3. Outside -> Research Center at (17, 11)
    const warpToLab = outside.warps.find((w) => w.x === 17 && w.y === 11);
    expect(warpToLab).toBeDefined();
    expect(warpToLab?.targetMapId).toBe('ruins_of_alph_research_center');
    const labTargetCol = lab.collisionGrid[warpToLab!.targetY * lab.width + warpToLab!.targetX];
    expect(labTargetCol === 0 || labTargetCol === 2).toBe(true);

    // Reciprocal: Research Center -> Outside
    const exitFromLab = lab.warps.find((w) => w.targetMapId === 'ruins_of_alph_outside');
    expect(exitFromLab).toBeDefined();
    expect(exitFromLab?.targetX).toBe(17);
    expect(exitFromLab?.targetY).toBe(11);
  });

  it('verifies both chamber map IDs are registered in main.ts fallback list', () => {
    const mainTsPath = path.resolve(__dirname, '../src/main.ts');
    const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

    expect(mainTsContent).toContain("'ruins_of_alph_kabuto_chamber'");
    expect(mainTsContent).toContain("'ruins_of_alph_inner_chamber'");
  });
});
