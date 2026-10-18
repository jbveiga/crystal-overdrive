import type { BgEvent, MapData, TileCoord, WarpEvent } from '../types/game';

export interface WildEncounterResult {
  speciesId: string;
  level: number;
  isRoamer?: boolean;
}

export class MapManager {
  private currentMap: MapData | null = null;
  private maps: Map<string, MapData> = new Map();

  registerMap(map: MapData): void {
    this.maps.set(map.id, map);
  }

  setCurrentMap(mapId: string): MapData {
    const map = this.maps.get(mapId);
    if (!map) {
      throw new Error(`Map with id "${mapId}" not found.`);
    }
    this.currentMap = map;
    return map;
  }

  getCurrentMap(): MapData | null {
    return this.currentMap;
  }

  getMap(mapId: string): MapData | undefined {
    return this.maps.get(mapId);
  }

  /**
   * Returns whether a tile coordinate is walkable for the Player (includes map border connections).
   * 0 = Walkable, 1 = Solid, 2 = Tall Grass, 3 = Water
   */
  isWalkable = (x: number, y: number): boolean => {
    if (!this.currentMap) return false;

    // Check bounds
    if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) {
      // Check if coordinate transitions into a connected map
      return this.checkConnectionWalkable(x, y);
    }

    const index = y * this.currentMap.width + x;
    const tileType = this.currentMap.collisionGrid[index];
    // Walkable on normal ground (0) and tall grass (2). Solid (1) and Water (3) are blocked.
    return tileType === 0 || tileType === 2;
  };

  /**
   * Returns whether a tile coordinate is walkable for NPCs (strictly within current map bounds, excluding warp doors).
   */
  isWalkableInBounds = (x: number, y: number): boolean => {
    if (!this.currentMap) return false;
    if (x <= 0 || x >= this.currentMap.width - 1 || y <= 0 || y >= this.currentMap.height - 1) {
      return false;
    }
    for (let i = 0; i < this.currentMap.warps.length; i++) {
      const w = this.currentMap.warps[i];
      if (w.x === x && w.y === y) return false;
    }
    const index = y * this.currentMap.width + x;
    const tileType = this.currentMap.collisionGrid[index];
    return tileType === 0 || tileType === 2;
  };

  /**
   * Returns tile type at coordinate: 0 = normal, 1 = solid, 2 = grass, 3 = water
   */
  getTileType = (x: number, y: number): number => {
    if (!this.currentMap) return 1;

    if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) {
      return 1;
    }

    const index = y * this.currentMap.width + x;
    return this.currentMap.collisionGrid[index] ?? 1;
  };

  /**
   * Checks if coordinate lands on a warp point
   */
  checkWarp(coord: TileCoord): WarpEvent | undefined {
    if (!this.currentMap) return undefined;
    return this.currentMap.warps.find((w) => w.x === coord.x && w.y === coord.y);
  }

  /**
   * Checks if coordinate has an interactive sign or background event
   */
  checkBgEvent(x: number, y: number): BgEvent | undefined {
    if (!this.currentMap || !this.currentMap.bgEvents) return undefined;
    return this.currentMap.bgEvents.find((bg) => bg.x === x && bg.y === y);
  }

  /**
   * Evaluates wild encounter on entering a tile.
   * In tall grass (type 2), rolls for wild encounter.
   * If a roaming beast is on this route, gives it a 25% priority encounter rate.
   */
  rollWildEncounter(
    tileType: number,
    activeRoamerSpeciesId?: string,
    rng: () => number = Math.random
  ): WildEncounterResult | null {
    if (tileType !== 2 || !this.currentMap) {
      return null;
    }

    // Typical grass encounter chance per step (~12.5% or 1/8)
    const encounterRoll = rng();
    if (encounterRoll > 0.125) {
      return null;
    }

    // If an active roaming beast is present on this route, 25% chance of encountering it
    if (activeRoamerSpeciesId) {
      const roamerRoll = rng();
      if (roamerRoll < 0.25) {
        return {
          speciesId: activeRoamerSpeciesId,
          level: 40,
          isRoamer: true,
        };
      }
    }

    const slots = this.currentMap.grassEncounters;
    if (!slots || slots.length === 0) {
      return null;
    }

    // Weighted random selection
    const totalWeight = slots.reduce((sum, s) => sum + s.weight, 0);
    let chosenWeight = rng() * totalWeight;

    for (const slot of slots) {
      if (chosenWeight < slot.weight) {
        const level = Math.floor(rng() * (slot.maxLevel - slot.minLevel + 1)) + slot.minLevel;
        return {
          speciesId: slot.speciesId,
          level,
          isRoamer: false,
        };
      }
      chosenWeight -= slot.weight;
    }

    const last = slots[slots.length - 1];
    return {
      speciesId: last.speciesId,
      level: last.minLevel,
      isRoamer: false,
    };
  }

  private checkConnectionWalkable(x: number, y: number): boolean {
    if (!this.currentMap) return false;

    // Check West
    if (x < 0 && this.currentMap.connections.WEST) {
      const conn = this.currentMap.connections.WEST;
      const targetMap = this.maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = targetMap.width - 1;
      const targetY = y + conn.offset;
      return targetY >= 0 && targetY < targetMap.height && targetMap.collisionGrid[targetY * targetMap.width + targetX] !== 1;
    }

    // Check East
    if (x >= this.currentMap.width && this.currentMap.connections.EAST) {
      const conn = this.currentMap.connections.EAST;
      const targetMap = this.maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = 0;
      const targetY = y + conn.offset;
      return targetY >= 0 && targetY < targetMap.height && targetMap.collisionGrid[targetY * targetMap.width + targetX] !== 1;
    }

    // Check North
    if (y < 0 && this.currentMap.connections.NORTH) {
      const conn = this.currentMap.connections.NORTH;
      const targetMap = this.maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = x + conn.offset;
      const targetY = targetMap.height - 1;
      return targetX >= 0 && targetX < targetMap.width && targetMap.collisionGrid[targetY * targetMap.width + targetX] !== 1;
    }

    // Check South
    if (y >= this.currentMap.height && this.currentMap.connections.SOUTH) {
      const conn = this.currentMap.connections.SOUTH;
      const targetMap = this.maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = x + conn.offset;
      const targetY = 0;
      return targetX >= 0 && targetX < targetMap.width && targetMap.collisionGrid[targetY * targetMap.width + targetX] !== 1;
    }

    return false;
  }
}
