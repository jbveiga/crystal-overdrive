import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MapManager } from '../../src/world/MapManager';
import { TwoPointWarpLinkRegistry } from '../../src/world/map/TwoPointWarpLinkRegistry';
import type { MapData } from '../../src/types/game';

describe('Issue #61 — Route 34 & Day-Care Bidirectional Entrance/Exit Mappings', () => {
  const route34Path = path.resolve(__dirname, '../../public/assets/data/maps/route_34.json');
  const dayCarePath = path.resolve(__dirname, '../../public/assets/data/maps/day_care.json');

  const route34Map: MapData = JSON.parse(fs.readFileSync(route34Path, 'utf8'));
  const dayCareMap: MapData = JSON.parse(fs.readFileSync(dayCarePath, 'utf8'));

  beforeEach(() => {
    TwoPointWarpLinkRegistry.clear();
  });

  it('maps Route 34 left Day-Care entrance (11, 14) and (11, 15) to Day-Care left interior (0, 5) and (0, 6)', () => {
    const leftTop = route34Map.warps.find((w) => w.x === 11 && w.y === 14);
    const leftBottom = route34Map.warps.find((w) => w.x === 11 && w.y === 15);

    expect(leftTop).toEqual({
      x: 11,
      y: 14,
      targetMapId: 'day_care',
      targetX: 0,
      targetY: 5,
    });
    expect(leftBottom).toEqual({
      x: 11,
      y: 15,
      targetMapId: 'day_care',
      targetX: 0,
      targetY: 6,
    });
  });

  it('enforces (12, 15) as a solid building wall with no warp, and maps the single bottom door (13, 15) to Day-Care down interior (2, 7)', () => {
    const wallWarp = route34Map.warps.find((w) => w.x === 12 && w.y === 15);
    expect(wallWarp).toBeUndefined();
    expect(route34Map.collisionGrid[15 * route34Map.width + 12]).toBe(1);

    const singleBottomDoor = route34Map.warps.find((w) => w.x === 13 && w.y === 15);
    expect(singleBottomDoor).toEqual({
      x: 13,
      y: 15,
      targetMapId: 'day_care',
      targetX: 2,
      targetY: 7,
    });
  });

  it('exits Day-Care left doorway (0, 5) and (0, 6) onto Route 34 main road (10, 14) and (10, 15) facing LEFT', () => {
    const exitLeftTop = dayCareMap.warps.find((w) => w.x === 0 && w.y === 5)!;
    const exitLeftBottom = dayCareMap.warps.find((w) => w.x === 0 && w.y === 6)!;

    expect(MapManager.getRequiredWarpDirection(exitLeftTop, dayCareMap)).toBe('LEFT');
    expect(MapManager.getRequiredWarpDirection(exitLeftBottom, dayCareMap)).toBe('LEFT');
    expect(MapManager.isCarpetWarp(exitLeftTop, dayCareMap)).toBe(false);
    expect(MapManager.isCarpetWarp(exitLeftBottom, dayCareMap)).toBe(false);

    const cfgTop = MapManager.resolveWarpTransition(exitLeftTop, dayCareMap, route34Map);
    expect([cfgTop.landingX, cfgTop.landingY, cfgTop.landingFacing]).toEqual([10, 14, 'LEFT']);

    const cfgBottom = MapManager.resolveWarpTransition(exitLeftBottom, dayCareMap, route34Map);
    expect([cfgBottom.landingX, cfgBottom.landingY, cfgBottom.landingFacing]).toEqual([10, 15, 'LEFT']);
  });

  it('exits Day-Care down carpet (2, 7) and (3, 7) through the single bottom door (13, 15) into the yard at (13, 16) facing DOWN', () => {
    const exitDownLeft = dayCareMap.warps.find((w) => w.x === 2 && w.y === 7)!;
    const exitDownRight = dayCareMap.warps.find((w) => w.x === 3 && w.y === 7)!;

    expect(MapManager.getRequiredWarpDirection(exitDownLeft, dayCareMap)).toBe('DOWN');
    expect(MapManager.getRequiredWarpDirection(exitDownRight, dayCareMap)).toBe('DOWN');
    expect(MapManager.isCarpetWarp(exitDownLeft, dayCareMap)).toBe(true);
    expect(MapManager.isCarpetWarp(exitDownRight, dayCareMap)).toBe(true);

    const cfgDownLeft = MapManager.resolveWarpTransition(exitDownLeft, dayCareMap, route34Map);
    expect([cfgDownLeft.landingX, cfgDownLeft.landingY, cfgDownLeft.landingFacing]).toEqual([13, 16, 'DOWN']);

    const cfgDownRight = MapManager.resolveWarpTransition(exitDownRight, dayCareMap, route34Map);
    expect([cfgDownRight.landingX, cfgDownRight.landingY, cfgDownRight.landingFacing]).toEqual([13, 16, 'DOWN']);
  });
});
