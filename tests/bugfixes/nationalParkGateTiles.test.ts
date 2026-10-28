import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';

describe('TICKET-BUGFIX-NATIONAL-PARK-GATE-TILES-01: Authentic Route 35 & 36 National Park Gates', () => {
  const root = path.resolve(__dirname, '../..');
  const r35Path = path.join(root, 'public/assets/data/maps/route_35_national_park_gate.json');
  const r36Path = path.join(root, 'public/assets/data/maps/route_36_national_park_gate.json');

  const r35Map = JSON.parse(fs.readFileSync(r35Path, 'utf8'));
  const r36Map = JSON.parse(fs.readFileSync(r36Path, 'utf8'));
  const npcs = createNpcsByMap();

  it('1. route_35_national_park_gate has authentic 8x8 dimensions', () => {
    expect(r35Map.width).toBe(8);
    expect(r35Map.height).toBe(8);
    expect(r35Map.collisionGrid.length).toBe(64);
  });

  it('2. route_35_national_park_gate central corridor x=3..4, y=1..7 is 100% walkable (collision 0)', () => {
    for (let y = 1; y <= 7; y++) {
      expect(r35Map.collisionGrid[y * r35Map.width + 3]).toBe(0);
      expect(r35Map.collisionGrid[y * r35Map.width + 4]).toBe(0);
    }
  });

  it('3. route_35_national_park_gate counter at x=1, y=2..5 has solid collision 1', () => {
    for (let y = 2; y <= 5; y++) {
      expect(r35Map.collisionGrid[y * r35Map.width + 1]).toBe(1);
    }
  });

  it('4. park_gate_officer at (0, 3) stands on walkable collision 0 behind counter with talkAcrossCounter', () => {
    expect(r35Map.collisionGrid[3 * r35Map.width + 0]).toBe(0);
    const officer = npcs.route_35_national_park_gate.find((n) => n.id === 'park_gate_officer');
    expect(officer).toBeDefined();
    expect(officer?.x).toBe(0);
    expect(officer?.y).toBe(3);
    expect(officer?.direction).toBe('RIGHT');
    expect(officer?.talkAcrossCounter).toBe(true);
    expect(officer?.action).toBe('BUG_CONTEST_OFFICER_EVENT');
  });

  it('5. gate_civilian at (6, 4) stands on walkable collision 0', () => {
    expect(r35Map.collisionGrid[4 * r35Map.width + 6]).toBe(0);
    const civilian = npcs.route_35_national_park_gate.find((n) => n.id === 'gate_civilian');
    expect(civilian).toBeDefined();
    expect(civilian?.x).toBe(6);
    expect(civilian?.y).toBe(4);
  });

  it('6. all 4 warps in route_35_national_park_gate have walkable collision 0', () => {
    expect(r35Map.warps.length).toBe(4);
    for (const warp of r35Map.warps) {
      expect(r35Map.collisionGrid[warp.y * r35Map.width + warp.x]).toBe(0);
    }
  });

  it('7. route_36_national_park_gate has authentic 10x8 dimensions', () => {
    expect(r36Map.width).toBe(10);
    expect(r36Map.height).toBe(8);
    expect(r36Map.collisionGrid.length).toBe(80);
  });

  it('8. all 4 warps in route_36_national_park_gate have walkable collision 0', () => {
    expect(r36Map.warps.length).toBe(4);
    for (const warp of r36Map.warps) {
      expect(r36Map.collisionGrid[warp.y * r36Map.width + warp.x]).toBe(0);
    }
  });

  it('9. gate_guard at (4, 2) in Route 36 gate stands on walkable collision 0 behind counter (4, 3)', () => {
    expect(r36Map.collisionGrid[2 * r36Map.width + 4]).toBe(0);
    expect(r36Map.collisionGrid[3 * r36Map.width + 4]).toBe(1); // solid counter in front
    const guard = npcs.route_36_national_park_gate.find((n) => n.id === 'gate_guard');
    expect(guard).toBeDefined();
    expect(guard?.x).toBe(4);
    expect(guard?.y).toBe(2);
    expect(guard?.direction).toBe('DOWN');
    expect(guard?.talkAcrossCounter).toBe(true);
  });

  it('10. reciprocal warps between Route 35, Route 36, and National Park match correctly', () => {
    const parkPath = path.join(root, 'public/assets/data/maps/national_park.json');
    const parkMap = JSON.parse(fs.readFileSync(parkPath, 'utf8'));

    // R35 Gate south entrance in National Park
    const parkToR35 = parkMap.warps.filter((w: any) => w.targetMapId === 'route_35_national_park_gate');
    expect(parkToR35.length).toBeGreaterThanOrEqual(2);
    expect(parkToR35.some((w: any) => w.targetX === 3 && w.targetY === 0)).toBe(true);
    expect(parkToR35.some((w: any) => w.targetX === 4 && w.targetY === 0)).toBe(true);

    // R36 Gate east entrance in National Park
    const parkToR36 = parkMap.warps.filter((w: any) => w.targetMapId === 'route_36_national_park_gate');
    expect(parkToR36.length).toBeGreaterThanOrEqual(2);
    expect(parkToR36.some((w: any) => w.targetX === 0 && w.targetY === 4)).toBe(true);
    expect(parkToR36.some((w: any) => w.targetX === 0 && w.targetY === 5)).toBe(true);
  });
});
