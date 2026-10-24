import type { Direction, RadarPing } from '../types/game';
import { GridPhysics } from './GridPhysics';

export type { RadarPing };

export interface HiddenItemTarget {
  eventFlag: string;
  itemId: string;
  x: number;
  y: number;
}

/**
 * Pure TypeScript domain logic for Pokémon Unbound-Style Live Itemfinder Radar.
 * Zero DOM or PixiJS imports.
 */
export class ItemfinderRadar {
  public static readonly SCAN_RADIUS: number = 8;

  /**
   * Computes dynamic WebAudio sonar pitch in Hz based on tile distance d in [0, 8]:
   * f(d) = 880 + (8 - d) * 120 Hz
   */
  public static getSonarFrequency(distance: number): number {
    const clamped = Math.max(0, Math.min(this.SCAN_RADIUS, distance));
    return Math.round(880 + (this.SCAN_RADIUS - clamped) * 120);
  }

  /**
   * Computes sonar ping cadence interval in seconds based on tile distance d:
   * T(d) = 0.25s + d * 0.1s
   */
  public static getSonarIntervalSec(distance: number): number {
    const clamped = Math.max(0, Math.min(this.SCAN_RADIUS, distance));
    return Number((0.25 + clamped * 0.1).toFixed(2));
  }

  /**
   * Resolves 8-way compass bearing label from (dx, dy)
   */
  public static resolveBearing(
    dx: number,
    dy: number
  ): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'HERE' {
    if (dx === 0 && dy === 0) return 'HERE';
    if (dx === 0 && dy < 0) return 'N';
    if (dx > 0 && dy < 0) return 'NE';
    if (dx > 0 && dy === 0) return 'E';
    if (dx > 0 && dy > 0) return 'SE';
    if (dx === 0 && dy > 0) return 'S';
    if (dx < 0 && dy > 0) return 'SW';
    if (dx < 0 && dy === 0) return 'W';
    return 'NW';
  }

  /**
   * Scans an 8-tile radius around (playerX, playerY) for the closest uncollected hidden item.
   */
  public static scan(
    playerX: number,
    playerY: number,
    playerDir: Direction,
    hiddenItems: readonly HiddenItemTarget[],
    collectedFlags: ReadonlySet<string> = new Set(),
    radius: number = ItemfinderRadar.SCAN_RADIUS
  ): RadarPing {
    let closest: HiddenItemTarget | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < hiddenItems.length; i++) {
      const item = hiddenItems[i];
      if (collectedFlags.has(item.eventFlag)) continue;

      const dist = Math.hypot(item.x - playerX, item.y - playerY);
      if (dist <= radius && dist < minDistance) {
        minDistance = dist;
        closest = item;
      }
    }

    if (!closest) {
      return {
        active: true,
        hasItemInRange: false,
        nearestItem: null,
        distance: null,
        dx: 0,
        dy: 0,
        bearing: 'NONE',
        bearingAngleDeg: 0,
        angleRad: 0,
        isFacingTarget: false,
        isFacingDirectly: false,
        proximityBand: 'NONE',
      };
    }

    const dx = closest.x - playerX;
    const dy = closest.y - playerY;
    const angleRad = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx);
    const bearingAngleDeg = dx === 0 && dy === 0 ? 0 : ((angleRad * 180) / Math.PI + 360) % 360;
    const bearing = this.resolveBearing(dx, dy);

    const dirDelta = GridPhysics.getDirectionDelta(playerDir);
    const isAdjacentFacing = (dx === dirDelta.dx && dy === dirDelta.dy) || (dx === 0 && dy === 0);

    let proximityBand: RadarPing['proximityBand'] = 'FAR';
    if (isAdjacentFacing) {
      proximityBand = 'FACING';
    } else if (minDistance <= 1.5) {
      proximityBand = 'CLOSE';
    } else if (minDistance <= 4) {
      proximityBand = 'MEDIUM';
    } else {
      proximityBand = 'FAR';
    }

    return {
      active: true,
      hasItemInRange: true,
      nearestItem: {
        eventFlag: closest.eventFlag,
        itemId: closest.itemId,
        x: closest.x,
        y: closest.y,
        distance: minDistance,
        dx,
        dy,
      },
      distance: minDistance,
      dx,
      dy,
      bearing,
      bearingAngleDeg,
      angleRad,
      isFacingTarget: isAdjacentFacing,
      isFacingDirectly: isAdjacentFacing,
      proximityBand,
    };
  }
}
