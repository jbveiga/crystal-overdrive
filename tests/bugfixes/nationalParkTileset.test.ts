import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';

describe('TICKET-BUGFIX-NATIONAL-PARK-TILESET-01: National Park Tree Metatile & Tileset Prefix Integrity Fix', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const mapPath = path.join(rootDir, 'public/assets/data/maps/national_park.json');
  const tilesDir = path.join(rootDir, 'public/assets/tiles');

  const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  it('should not contain any _nb roof suffixes in national_park.json', () => {
    const nbTiles = mapData.tileMap.filter((t) => t.includes('_nb'));
    expect(nbTiles).toEqual([]);
  });

  it('should have all tiles prefixed with park_ in national_park.json', () => {
    const nonParkTiles = mapData.tileMap.filter((t) => !t.startsWith('park_'));
    expect(nonParkTiles).toEqual([]);
  });

  it('should generate authentic tree top-left tile park_0c_0d_1c_1d.png on disk', () => {
    const tilePath = path.join(tilesDir, 'park_0c_0d_1c_1d.png');
    expect(fs.existsSync(tilePath)).toBe(true);
    const stat = fs.statSync(tilePath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should generate authentic tree top-right tile park_0e_0f_1e_1f.png on disk', () => {
    const tilePath = path.join(tilesDir, 'park_0e_0f_1e_1f.png');
    expect(fs.existsSync(tilePath)).toBe(true);
    const stat = fs.statSync(tilePath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should generate authentic tree bottom-left tile park_2c_2d_3c_3d.png on disk', () => {
    const tilePath = path.join(tilesDir, 'park_2c_2d_3c_3d.png');
    expect(fs.existsSync(tilePath)).toBe(true);
    const stat = fs.statSync(tilePath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should generate authentic tree bottom-right tile park_2e_2f_3e_3f.png on disk', () => {
    const tilePath = path.join(tilesDir, 'park_2e_2f_3e_3f.png');
    expect(fs.existsSync(tilePath)).toBe(true);
    const stat = fs.statSync(tilePath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('should preserve all reciprocal warps connecting to Route 35 and Route 36 gates', () => {
    expect(mapData.warps).toHaveLength(4);

    // Route 36 Gate East exits
    const wR36_1 = mapData.warps.find((w) => w.x === 33 && w.y === 18);
    expect(wR36_1).toBeDefined();
    expect(wR36_1?.targetMapId).toBe('route_36_national_park_gate');
    expect(wR36_1?.targetX).toBe(0);
    expect(wR36_1?.targetY).toBe(4);

    const wR36_2 = mapData.warps.find((w) => w.x === 33 && w.y === 19);
    expect(wR36_2).toBeDefined();
    expect(wR36_2?.targetMapId).toBe('route_36_national_park_gate');
    expect(wR36_2?.targetX).toBe(0);
    expect(wR36_2?.targetY).toBe(5);

    // Route 35 Gate South exits
    const wR35_1 = mapData.warps.find((w) => w.x === 10 && w.y === 47);
    expect(wR35_1).toBeDefined();
    expect(wR35_1?.targetMapId).toBe('route_35_national_park_gate');
    expect(wR35_1?.targetX).toBe(3);
    expect(wR35_1?.targetY).toBe(0);

    const wR35_2 = mapData.warps.find((w) => w.x === 11 && w.y === 47);
    expect(wR35_2).toBeDefined();
    expect(wR35_2?.targetMapId).toBe('route_35_national_park_gate');
    expect(wR35_2?.targetX).toBe(4);
    expect(wR35_2?.targetY).toBe(0);
  });
});
