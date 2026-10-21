import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../src/types/game';
import { createNpcsByMap } from '../src/world/npcData';

describe('Union Cave Full Mapping & Level Audit (TICKET-WORLD-UNION-CAVE-MAPPING-01)', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

  function loadMap(id: string): MapData {
    const filePath = path.join(mapsDir, `${id}.json`);
    expect(fs.existsSync(filePath), `Map file ${id}.json should exist`).toBe(true);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const isWalkable = (m: MapData, x: number, y: number) => {
    const col = m.collisionGrid[y * m.width + x];
    return col === 0 || col === 2;
  };

  it('verifies 1F traversability between Route 32 and Route 33 with reciprocal warps', () => {
    const uc1f = loadMap('union_cave_1f');
    const r32 = loadMap('route_32');
    const r33 = loadMap('route_33');

    expect(uc1f.width).toBe(20);
    expect(uc1f.height).toBe(36);

    // North entrance (17, 3) <-> Route 32 (6, 79)
    const warpToR32 = uc1f.warps.find((w) => w.x === 17 && w.y === 3);
    expect(warpToR32).toBeDefined();
    expect(warpToR32?.targetMapId).toBe('route_32');
    expect(isWalkable(r32, warpToR32!.targetX, warpToR32!.targetY)).toBe(true);

    const r32Warp = r32.warps.find((w) => w.x === 6 && w.y === 79);
    expect(r32Warp).toBeDefined();
    expect(r32Warp?.targetMapId).toBe('union_cave_1f');
    expect([r32Warp?.targetX, r32Warp?.targetY]).toEqual([17, 3]);
    expect(isWalkable(uc1f, 17, 3)).toBe(true);

    // South exit (17, 31) <-> Route 33 (11, 1)
    const warpToR33 = uc1f.warps.find((w) => w.x === 17 && w.y === 31);
    expect(warpToR33).toBeDefined();
    expect(warpToR33?.targetMapId).toBe('route_33');
    expect(isWalkable(r33, warpToR33!.targetX, warpToR33!.targetY)).toBe(true);

    const r33Warp = r33.warps.find((w) => w.x === 11 && w.y === 1);
    expect(r33Warp).toBeDefined();
    expect(r33Warp?.targetMapId).toBe('union_cave_1f');
    expect([r33Warp?.targetX, r33Warp?.targetY]).toEqual([17, 31]);
    expect(isWalkable(uc1f, 17, 31)).toBe(true);
  });

  it('verifies subterranean ladders and stair reciprocity across 1F, B1F, and B2F', () => {
    const uc1f = loadMap('union_cave_1f');
    const ucb1f = loadMap('union_cave_b1f');
    const ucb2f = loadMap('union_cave_b2f');
    const ruins = loadMap('ruins_of_alph_outside');

    // 1. 1F NW ladder (5, 19) <-> B1F (3, 3)
    const toB1Fnw = uc1f.warps.find((w) => w.x === 5 && w.y === 19);
    expect(toB1Fnw).toBeDefined();
    expect(toB1Fnw?.targetMapId).toBe('union_cave_b1f');
    expect(isWalkable(ucb1f, toB1Fnw!.targetX, toB1Fnw!.targetY)).toBe(true);

    const fromB1Fnw = ucb1f.warps.find((w) => w.x === 3 && w.y === 3);
    expect(fromB1Fnw).toBeDefined();
    expect(fromB1Fnw?.targetMapId).toBe('union_cave_1f');
    expect([fromB1Fnw?.targetX, fromB1Fnw?.targetY]).toEqual([5, 19]);
    expect(isWalkable(uc1f, 5, 19)).toBe(true);

    // 2. 1F SW ladder (3, 33) <-> B1F (3, 33)
    const toB1Fsw = uc1f.warps.find((w) => w.x === 3 && w.y === 33);
    expect(toB1Fsw).toBeDefined();
    expect(toB1Fsw?.targetMapId).toBe('union_cave_b1f');
    expect(isWalkable(ucb1f, toB1Fsw!.targetX, toB1Fsw!.targetY)).toBe(true);

    const fromB1Fsw = ucb1f.warps.find((w) => w.x === 3 && w.y === 33);
    expect(fromB1Fsw).toBeDefined();
    expect(fromB1Fsw?.targetMapId).toBe('union_cave_1f');
    expect([fromB1Fsw?.targetX, fromB1Fsw?.targetY]).toEqual([3, 33]);
    expect(isWalkable(uc1f, 3, 33)).toBe(true);

    // 3. B1F stairs (17, 31) <-> B2F (5, 3)
    const toB2F = ucb1f.warps.find((w) => w.x === 17 && w.y === 31);
    expect(toB2F).toBeDefined();
    expect(toB2F?.targetMapId).toBe('union_cave_b2f');
    expect(isWalkable(ucb2f, toB2F!.targetX, toB2F!.targetY)).toBe(true);

    const fromB2F = ucb2f.warps.find((w) => w.x === 5 && w.y === 3);
    expect(fromB2F).toBeDefined();
    expect(fromB2F?.targetMapId).toBe('union_cave_b1f');
    expect([fromB2F?.targetX, fromB2F?.targetY]).toEqual([17, 31]);
    expect(isWalkable(ucb1f, 17, 31)).toBe(true);

    // 4. B1F Northwest ladder (17, 19) <-> Ruins of Alph (6, 19)
    const toRuins = ucb1f.warps.find((w) => w.x === 17 && w.y === 19);
    expect(toRuins).toBeDefined();
    expect(toRuins?.targetMapId).toBe('ruins_of_alph_outside');
    expect(isWalkable(ruins, toRuins!.targetX, toRuins!.targetY)).toBe(true);

    const fromRuins = ruins.warps.find((w) => w.x === 6 && w.y === 19);
    expect(fromRuins).toBeDefined();
    expect(fromRuins?.targetMapId).toBe('union_cave_b1f');
    expect([fromRuins?.targetX, fromRuins?.targetY]).toEqual([17, 19]);
  });

  it('verifies wild encounter tables across all 3 levels', () => {
    const uc1f = loadMap('union_cave_1f');
    const ucb1f = loadMap('union_cave_b1f');
    const ucb2f = loadMap('union_cave_b2f');

    const species1f = uc1f.grassEncounters?.map((e) => e.speciesId) || [];
    expect(species1f).toContain('geodude');
    expect(species1f).toContain('zubat');

    const speciesB1f = ucb1f.grassEncounters?.map((e) => e.speciesId) || [];
    expect(speciesB1f).toContain('geodude');
    expect(speciesB1f).toContain('onix');

    const speciesB2f = ucb2f.grassEncounters?.map((e) => e.speciesId) || [];
    expect(speciesB2f).toContain('wooper');
    expect(speciesB2f).toContain('quagsire');
    expect(speciesB2f).toContain('golbat');
  });

  it('verifies Friday Lapras entity definition, sprite, and walkability', () => {
    const npcs = createNpcsByMap();
    const b2fNpcs = npcs.union_cave_b2f;
    expect(b2fNpcs).toBeDefined();

    const lapras = b2fNpcs.find((n) => n.id === 'union_cave_lapras');
    expect(lapras).toBeDefined();
    expect(lapras?.x).toBe(11);
    expect(lapras?.y).toBe(31);
    expect(lapras?.spriteType).toBe('lapras');
    expect(lapras?.action).toBe('LAPRAS_EVENT');

    // Walkability check on B2F map
    const ucb2f = loadMap('union_cave_b2f');
    expect(isWalkable(ucb2f, 11, 31)).toBe(true);

    // Sprite asset presence on disk
    const spritePath = path.resolve(__dirname, '../public/assets/sprites/characters/lapras.png');
    expect(fs.existsSync(spritePath)).toBe(true);
  });
});
