import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MapManager } from '../../src/world/MapManager';
import { TwoPointWarpLinkRegistry } from '../../src/world/map/TwoPointWarpLinkRegistry';
import type { GridEntity, MapData } from '../../src/types/game';

describe('Issue #50 — route_31_violet_gate (0, 5) & 2-Point Entrance/Exit Link Registry', () => {
  const gatePath = path.resolve(__dirname, '../../public/assets/data/maps/route_31_violet_gate.json');
  const violetPath = path.resolve(__dirname, '../../public/assets/data/maps/violet_city.json');
  const route31Path = path.resolve(__dirname, '../../public/assets/data/maps/route_31.json');

  const gateMap: MapData = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
  const violetMap: MapData = JSON.parse(fs.readFileSync(violetPath, 'utf8'));
  const route31Map: MapData = JSON.parse(fs.readFileSync(route31Path, 'utf8'));

  beforeEach(() => {
    TwoPointWarpLinkRegistry.clear();
  });

  it('resolves required warp direction at route_31_violet_gate (0, 4) and (0, 5) as LEFT and (9, 4) and (9, 5) as RIGHT', () => {
    const warpLeftTop = gateMap.warps.find((w) => w.x === 0 && w.y === 4)!;
    const warpLeftBottom = gateMap.warps.find((w) => w.x === 0 && w.y === 5)!;
    const warpRightTop = gateMap.warps.find((w) => w.x === 9 && w.y === 4)!;
    const warpRightBottom = gateMap.warps.find((w) => w.x === 9 && w.y === 5)!;

    expect(MapManager.getRequiredWarpDirection(warpLeftTop, gateMap)).toBe('LEFT');
    expect(MapManager.getRequiredWarpDirection(warpLeftBottom, gateMap)).toBe('LEFT');
    expect(MapManager.getRequiredWarpDirection(warpRightTop, gateMap)).toBe('RIGHT');
    expect(MapManager.getRequiredWarpDirection(warpRightBottom, gateMap)).toBe('RIGHT');

    expect(MapManager.isCarpetWarp(warpLeftBottom, gateMap)).toBe(false);
    expect(MapManager.isCarpetWarp(warpRightBottom, gateMap)).toBe(false);
  });

  it('maps entrances and exits as bidirectional 2-point links and teleports player while preserving all properties', () => {
    TwoPointWarpLinkRegistry.registerMapLinks(gateMap);
    TwoPointWarpLinkRegistry.registerMapLinks(violetMap);
    TwoPointWarpLinkRegistry.registerMapLinks(route31Map);

    // Reaching (0, 5) in route_31_violet_gate resolves link to violet_city (38, 25)
    const linkFromGate = TwoPointWarpLinkRegistry.resolveLinkAt('route_31_violet_gate', 0, 5);
    expect(linkFromGate).toBeDefined();
    expect(linkFromGate?.targetMapId).toBe('violet_city');
    expect([linkFromGate?.targetX, linkFromGate?.targetY]).toEqual([38, 25]);

    // Reaching (39, 25) in violet_city resolves link to route_31_violet_gate (0, 5)
    const linkFromViolet = TwoPointWarpLinkRegistry.resolveLinkAt('violet_city', 39, 25);
    expect(linkFromViolet).toBeDefined();
    expect(linkFromViolet?.targetMapId).toBe('route_31_violet_gate');
    expect([linkFromViolet?.targetX, linkFromViolet?.targetY]).toEqual([0, 5]);

    const player: GridEntity & { customBadgeCount?: number; isBiking?: boolean } = {
      id: 'gold',
      x: 0,
      y: 5,
      gridX: 0,
      gridY: 5,
      targetX: 0,
      targetY: 5,
      renderX: 0,
      renderY: 5,
      direction: 'LEFT',
      isMoving: true,
      progress: 0.75,
      speed: 8,
      spriteType: 'gold',
      isSurfing: false,
      isBiking: true,
      customBadgeCount: 1,
    };

    const config = MapManager.resolveWarpTransition(linkFromGate!, gateMap, violetMap);
    TwoPointWarpLinkRegistry.applyTeleportPreservingPlayerState(player, config);

    expect(player.x).toBe(38);
    expect(player.y).toBe(25);
    expect(player.gridX).toBe(38);
    expect(player.gridY).toBe(25);
    expect(player.targetX).toBe(38);
    expect(player.targetY).toBe(25);
    expect(player.renderX).toBe(38);
    expect(player.renderY).toBe(25);
    expect(player.direction).toBe('LEFT');
    expect(player.isMoving).toBe(false);
    expect(player.progress).toBe(0);
    // All character properties preserved
    expect(player.id).toBe('gold');
    expect(player.speed).toBe(8);
    expect(player.spriteType).toBe('gold');
    expect(player.isBiking).toBe(true);
    expect(player.customBadgeCount).toBe(1);
  });
});
