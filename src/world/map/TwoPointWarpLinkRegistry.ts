/**
 * @fileoverview TwoPointWarpLinkRegistry — Bidirectional 2-point entrance/exit link mapping and property-preserving player teleportation (Issue #50).
 * @module world/map/TwoPointWarpLinkRegistry
 * @role Two-Point Entrance/Exit Link Registry & Player State Preserver
 * @exports TwoPointWarpLinkRegistry, WarpLinkEndpoint, TwoPointWarpLink
 * @layer world
 * @sections L1-25: Micro-Header & Contracts | L26-135: Link Registration & Lookup | L136-190: Property-Preserving Teleport
 */

import type { Direction, GridEntity, MapData, WarpEvent, WarpTransitionConfig } from '../../types/game';

export interface WarpLinkEndpoint {
  mapId: string;
  x: number;
  y: number;
  direction?: Direction;
}

export interface TwoPointWarpLink {
  id: string;
  pointA: WarpLinkEndpoint;
  pointB: WarpLinkEndpoint;
}

export class TwoPointWarpLinkRegistry {
  private static linksByEndpointKey: Map<string, WarpEvent> = new Map();
  private static allLinks: Map<string, TwoPointWarpLink> = new Map();

  public static makeEndpointKey(mapId: string, x: number, y: number): string {
    return `${mapId}:${x},${y}`;
  }

  /**
   * Registers all entrance/exit warps on a loaded MapData as 2-point links.
   * If the reciprocal endpoint is not yet registered, a reverse link entry is also seeded
   * so reaching either point of the 2-point link always teleports the player to its partner.
   */
  public static registerMapLinks(map: MapData): void {
    if (!map.warps) return;
    for (let i = 0; i < map.warps.length; i++) {
      const w = map.warps[i];
      const forwardKey = this.makeEndpointKey(map.id, w.x, w.y);
      this.linksByEndpointKey.set(forwardKey, w);

      const reverseKey = this.makeEndpointKey(w.targetMapId, w.targetX, w.targetY);
      if (!this.linksByEndpointKey.has(reverseKey)) {
        this.linksByEndpointKey.set(reverseKey, {
          x: w.targetX,
          y: w.targetY,
          targetMapId: map.id,
          targetX: w.x,
          targetY: w.y,
        });
      }

      const pairId =
        forwardKey < reverseKey ? `${forwardKey}<->${reverseKey}` : `${reverseKey}<->${forwardKey}`;
      this.allLinks.set(pairId, {
        id: pairId,
        pointA: { mapId: map.id, x: w.x, y: w.y, direction: w.direction },
        pointB: { mapId: w.targetMapId, x: w.targetX, y: w.targetY },
      });
    }
  }

  /**
   * Resolves the linked destination WarpEvent when either point of a 2-point link is reached.
   */
  public static resolveLinkAt(mapId: string, x: number, y: number, fallbackWarp?: WarpEvent | null): WarpEvent | null {
    const key = this.makeEndpointKey(mapId, x, y);
    return this.linksByEndpointKey.get(key) ?? fallbackWarp ?? null;
  }

  public static getAllRegisteredLinks(): TwoPointWarpLink[] {
    return Array.from(this.allLinks.values());
  }

  public static clear(): void {
    this.linksByEndpointKey.clear();
    this.allLinks.clear();
  }

  /**
   * Teleports a player GridEntity to the resolved 2-point link destination while strictly
   * preserving all player properties (id, speed, spriteType, isSurfing, isBiking, custom state)
   * and synchronizing all grid/render/target coordinates.
   */
  public static applyTeleportPreservingPlayerState(
    player: GridEntity,
    transitionConfig: Pick<WarpTransitionConfig, 'landingX' | 'landingY' | 'landingFacing'>
  ): GridEntity {
    player.isMoving = false;
    player.progress = 0;
    player.direction = transitionConfig.landingFacing;
    player.x = transitionConfig.landingX;
    player.y = transitionConfig.landingY;
    player.gridX = transitionConfig.landingX;
    player.gridY = transitionConfig.landingY;
    player.targetX = transitionConfig.landingX;
    player.targetY = transitionConfig.landingY;
    player.renderX = transitionConfig.landingX;
    player.renderY = transitionConfig.landingY;
    return player;
  }
}
