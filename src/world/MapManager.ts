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
   * Returns whether a tile coordinate is walkable for NPCs on a specific map (strictly within map bounds, excluding warp doors).
   */
  isWalkableInMapBounds(map: MapData, x: number, y: number): boolean {
    if (x <= 0 || x >= map.width - 1 || y <= 0 || y >= map.height - 1) {
      return false;
    }
    for (let i = 0; i < map.warps.length; i++) {
      const w = map.warps[i];
      if (w.x === x && w.y === y) return false;
    }
    const index = y * map.width + x;
    const tileType = map.collisionGrid[index];
    return tileType === 0 || tileType === 2;
  }

  /**
   * Returns whether a tile coordinate is walkable for NPCs on the current map (strictly within current map bounds, excluding warp doors).
   */
  isWalkableInBounds = (x: number, y: number): boolean => {
    if (!this.currentMap) return false;
    return this.isWalkableInMapBounds(this.currentMap, x, y);
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
   * Checks if coordinate has an interactive sign or background event (including across connected map borders)
   */
  checkBgEvent(x: number, y: number): BgEvent | undefined {
    if (!this.currentMap) return undefined;
    if (x < 0 && this.currentMap.connections.WEST) {
      const conn = this.currentMap.connections.WEST;
      const westMap = this.maps.get(conn.mapId);
      if (westMap?.bgEvents) {
        return westMap.bgEvents.find((bg) => bg.x === x + westMap.width && bg.y === y - conn.offset);
      }
      return undefined;
    }
    if (x >= this.currentMap.width && this.currentMap.connections.EAST) {
      const conn = this.currentMap.connections.EAST;
      const eastMap = this.maps.get(conn.mapId);
      if (eastMap?.bgEvents) {
        return eastMap.bgEvents.find((bg) => bg.x === x - this.currentMap!.width && bg.y === y - conn.offset);
      }
      return undefined;
    }
    if (y < 0 && this.currentMap.connections.NORTH) {
      const conn = this.currentMap.connections.NORTH;
      const northMap = this.maps.get(conn.mapId);
      if (northMap?.bgEvents) {
        return northMap.bgEvents.find((bg) => bg.x === x - conn.offset && bg.y === y + northMap.height);
      }
      return undefined;
    }
    if (y >= this.currentMap.height && this.currentMap.connections.SOUTH) {
      const conn = this.currentMap.connections.SOUTH;
      const southMap = this.maps.get(conn.mapId);
      if (southMap?.bgEvents) {
        return southMap.bgEvents.find((bg) => bg.x === x - conn.offset && bg.y === y - this.currentMap!.height);
      }
      return undefined;
    }
    if (!this.currentMap.bgEvents) return undefined;
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
    rng: () => number = Math.random,
    timeOfDay?: 'MORNING' | 'DAY' | 'NIGHT'
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

    let slots = this.currentMap.grassEncounters;
    if (!slots || slots.length === 0) {
      return null;
    }

    if (timeOfDay) {
      const timeFiltered = slots.filter(
        (s) => !s.timeOfDay || s.timeOfDay === 'ANY' || s.timeOfDay === timeOfDay
      );
      if (timeFiltered.length > 0) {
        slots = timeFiltered;
      }
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
      const targetY = y - conn.offset;
      if (targetY < 0 || targetY >= targetMap.height) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return tileType === 0 || tileType === 2;
    }

    // Check East
    if (x >= this.currentMap.width && this.currentMap.connections.EAST) {
      const conn = this.currentMap.connections.EAST;
      const targetMap = this.maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = 0;
      const targetY = y - conn.offset;
      if (targetY < 0 || targetY >= targetMap.height) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return tileType === 0 || tileType === 2;
    }

    // Check North
    if (y < 0 && this.currentMap.connections.NORTH) {
      const conn = this.currentMap.connections.NORTH;
      const targetMap = this.maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = x - conn.offset;
      const targetY = targetMap.height - 1;
      if (targetX < 0 || targetX >= targetMap.width) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return tileType === 0 || tileType === 2;
    }

    // Check South
    if (y >= this.currentMap.height && this.currentMap.connections.SOUTH) {
      const conn = this.currentMap.connections.SOUTH;
      const targetMap = this.maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = x - conn.offset;
      const targetY = 0;
      if (targetX < 0 || targetX >= targetMap.width) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return tileType === 0 || tileType === 2;
    }

    return false;
  }

  public static isOutdoorMap(mapId: string): boolean {
    return [
      'new_bark_town',
      'route_29',
      'cherrygrove_city',
      'route_30',
      'route_31',
      'violet_city',
      'route_32',
      'ruins_of_alph_outside',
      'route_33',
      'azalea_town',
      'route_34',
      'goldenrod_city',
      'goldenrod_dept_store_roof',
      'route_35',
      'national_park',
      'route_36',
      'route_37',
      'ecruteak_city',
      'route_38',
      'route_39',
      'olivine_city',
      'route_40',
      'route_41',
      'cianwood_city',
      'route_42',
      'mahogany_town',
      'route_43',
      'lake_of_rage',
      'route_44',
      'blackthorn_city',
      'route_45',
      'route_46',
      'route_26',
      'route_27',
      'route_22',
      'route_23',
      'route_28',
      'silver_cave_outside',
      // Phase 13: Western & Central Kanto
      'pallet_town',
      'route_1',
      'viridian_city',
      'route_2',
      'pewter_city',
      'route_3',
      'mount_moon_square',
      'route_4',
      'cerulean_city',
      'route_24',
      'route_25',
    ].includes(mapId);
  }

  public isCurrentMapOutdoor(): boolean {
    if (!this.currentMap) return true;
    if (typeof this.currentMap.isIndoor === 'boolean') {
      return !this.currentMap.isIndoor;
    }
    return MapManager.isOutdoorMap(this.currentMap.id);
  }
}
