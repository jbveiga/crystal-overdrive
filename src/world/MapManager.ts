import type { BgEvent, Direction, EncounterRateMode, MapData, TileCoord, WarpEvent, WarpSoundCue, WarpTransitionConfig } from '../types/game';

export interface WildEncounterResult {
  speciesId: string;
  level: number;
  isRoamer?: boolean;
}

export class MapManager {
  public static readonly GRACE_STEPS_DEFAULT = 4;
  public static readonly GRASS_CAP_NORMAL = 0.0625;  // 6.25% (1 in 16 steps)
  public static readonly GRASS_CAP_RELAXED = 0.04;   // 4.00% (1 in 25 steps)
  public static readonly GRASS_CAP_CLASSIC = 0.10;   // 10.0% (1 in 10 steps)
  public static readonly CAVE_CAP_NORMAL = 0.04;     // 4.00% (1 in 25 steps)
  public static readonly CAVE_CAP_RELAXED = 0.025;   // 2.50% (1 in 40 steps)
  public static readonly CAVE_CAP_CLASSIC = 0.0625;  // 6.25% (1 in 16 steps)

  private currentMap: MapData | null = null;
  private neighborScratchMap: MapData | null = null;
  private maps: Map<string, MapData> = new Map();
  private graceStepsRemaining: number = 0;
  private stepsSinceGraceEnd: number = 4;
  private pacingEnabled: boolean = false;
  private repelStepsRemaining: number = 0;
  private encounterRateMode: EncounterRateMode = 'NORMAL';

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
   * Sets the temporary neighbor scratch map used by zero-allocation neighbor NPC stepping.
   */
  setNeighborScratchMap(map: MapData | null): void {
    this.neighborScratchMap = map;
  }

  /**
   * Zero-allocation bound collision callback for neighbor map NPC stepping.
   */
  isWalkableInNeighborBounds = (x: number, y: number): boolean => {
    if (!this.neighborScratchMap) return false;
    return this.isWalkableInMapBounds(this.neighborScratchMap, x, y);
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
   * Activates the post-battle / route-entry grace buffer (default 4 guaranteed safe steps with 0% encounter chance)
   * and resets the step ramp counter so players never experience back-to-back encounters.
   */
  public activateEncounterGracePeriod(graceSteps: number = MapManager.GRACE_STEPS_DEFAULT): void {
    this.graceStepsRemaining = Math.max(0, Math.floor(graceSteps));
    this.stepsSinceGraceEnd = 0;
    this.pacingEnabled = true;
  }

  public getGraceStepsRemaining(): number {
    return this.graceStepsRemaining;
  }

  public getStepsSinceLastEncounter(): number {
    if (this.graceStepsRemaining > 0) {
      return Math.max(0, MapManager.GRACE_STEPS_DEFAULT - this.graceStepsRemaining);
    }
    return MapManager.GRACE_STEPS_DEFAULT + this.stepsSinceGraceEnd;
  }

  public setEncounterRateMode(mode: EncounterRateMode): void {
    this.encounterRateMode = mode;
  }

  public getEncounterRateMode(): EncounterRateMode {
    return this.encounterRateMode;
  }

  public setRepelSteps(steps: number): void {
    this.repelStepsRemaining = Math.max(0, Math.floor(steps));
  }

  public getRepelSteps(): number {
    return this.repelStepsRemaining;
  }

  public decrementRepelStep(): { active: boolean; expiredJustNow: boolean; remaining: number } {
    if (this.repelStepsRemaining <= 0) {
      return { active: false, expiredJustNow: false, remaining: 0 };
    }
    this.repelStepsRemaining--;
    return {
      active: this.repelStepsRemaining > 0,
      expiredJustNow: this.repelStepsRemaining === 0,
      remaining: this.repelStepsRemaining,
    };
  }

  public getMaxEncounterCap(isCaveOrRuins: boolean = false): number {
    if (isCaveOrRuins) {
      if (this.encounterRateMode === 'RELAXED') return MapManager.CAVE_CAP_RELAXED;
      if (this.encounterRateMode === 'CLASSIC') return MapManager.CAVE_CAP_CLASSIC;
      return MapManager.CAVE_CAP_NORMAL;
    }
    if (this.encounterRateMode === 'RELAXED') return MapManager.GRASS_CAP_RELAXED;
    if (this.encounterRateMode === 'CLASSIC') return MapManager.GRASS_CAP_CLASSIC;
    return MapManager.GRASS_CAP_NORMAL;
  }

  /**
   * Computes the current step's encounter probability threshold:
   * - If Repel is active or within the 4-step grace period: 0%
   * - Step 4 (1st step after grace): 2.0% (scaled proportionally to max cap)
   * - Step 5 (2nd step after grace): 3.5%
   * - Step 6 (3rd step after grace): 5.0%
   * - Step 7+ (4th+ step after grace): Capped at 6.25% in Grass (4.0% in Caves)
   */
  public getEncounterProbabilityForStep(stepAfterGrace: number, isCaveOrRuins: boolean = false): number {
    if (this.repelStepsRemaining > 0 || this.graceStepsRemaining > 0 || stepAfterGrace <= 0) {
      return 0;
    }
    const maxCap = this.getMaxEncounterCap(isCaveOrRuins);
    const scale = maxCap / MapManager.GRASS_CAP_NORMAL;
    if (stepAfterGrace === 1) return Number((0.02 * scale).toFixed(5));
    if (stepAfterGrace === 2) return Number((0.035 * scale).toFixed(5));
    if (stepAfterGrace === 3) return Number((0.05 * scale).toFixed(5));
    return maxCap;
  }

  /**
   * Evaluates wild encounter on entering a tile.
   * In tall grass (type 2) or cave/ruins floor (type 0), rolls for wild encounter using the
   * 4-step grace buffer and ramping probability capped at 6.25% (Grass) / 4.0% (Caves).
   * If a roaming beast is on this route, gives it a 25% priority encounter rate.
   */
  rollWildEncounter(
    tileType: number,
    activeRoamerSpeciesId?: string,
    rng: () => number = Math.random,
    timeOfDay?: 'MORNING' | 'DAY' | 'NIGHT'
  ): WildEncounterResult | null {
    if (!this.currentMap) {
      return null;
    }

    const isWaterTile = tileType === 3;
    const isCaveOrRuins =
      MapManager.isCaveMap(this.currentMap.id) ||
      this.currentMap.id.includes('ruins_of_alph') ||
      this.currentMap.id.includes('sprout_tower') ||
      this.currentMap.id.includes('burned_tower') ||
      this.currentMap.id.includes('tin_tower') ||
      this.currentMap.id.includes('mount_mortar') ||
      this.currentMap.id === 'ilex_forest';
    if (tileType !== 2 && !isWaterTile && !(isCaveOrRuins && tileType === 0)) {
      return null;
    }

    // Active Repel suppresses wild encounters completely
    if (this.repelStepsRemaining > 0) {
      return null;
    }

    // Guaranteed 4-step grace buffer after a battle or route transition
    if (this.graceStepsRemaining > 0) {
      this.graceStepsRemaining--;
      return null;
    }

    if (this.pacingEnabled) {
      this.stepsSinceGraceEnd++;
    }

    const threshold = this.getEncounterProbabilityForStep(
      this.stepsSinceGraceEnd,
      isCaveOrRuins || isWaterTile
    );
    const encounterRoll = rng();
    if (encounterRoll > threshold) {
      return null;
    }

    const finalizeEncounter = (result: WildEncounterResult): WildEncounterResult => {
      if (this.pacingEnabled) {
        this.graceStepsRemaining = MapManager.GRACE_STEPS_DEFAULT;
        this.stepsSinceGraceEnd = 0;
      }
      return result;
    };

    // If an active roaming beast is present on this route, 25% chance of encountering it
    if (activeRoamerSpeciesId) {
      const roamerRoll = rng();
      if (roamerRoll < 0.25) {
        return finalizeEncounter({
          speciesId: activeRoamerSpeciesId,
          level: 40,
          isRoamer: true,
        });
      }
    }

    let slots = isWaterTile
      ? this.currentMap.waterEncounters
      : this.currentMap.grassEncounters;
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
        return finalizeEncounter({
          speciesId: slot.speciesId,
          level,
          isRoamer: false,
        });
      }
      chosenWeight -= slot.weight;
    }

    const last = slots[slots.length - 1];
    return finalizeEncounter({
      speciesId: last.speciesId,
      level: last.minLevel,
      isRoamer: false,
    });
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
      // Phase 14: Central & Eastern Kanto
      'route_5',
      'route_6',
      'vermilion_city',
      'vermilion_port',
      'olivine_port',
      'route_11',
      'route_9',
      'route_10_north',
      'route_10_south',
      'lavender_town',
      'route_8',
      'route_7',
      'celadon_city',
      // Phase 15: Southern Kanto, Saffron & Sea Routes
      'saffron_city',
      'route_16',
      'route_17',
      'route_18',
      'fuchsia_city',
      'route_12',
      'route_13',
      'route_14',
      'route_15',
      'route_19',
      'route_20',
      'cinnabar_island',
      'route_21',
    ].includes(mapId);
  }

  public isCurrentMapOutdoor(): boolean {
    if (!this.currentMap) return true;
    if (typeof this.currentMap.isIndoor === 'boolean') {
      return !this.currentMap.isIndoor;
    }
    return MapManager.isOutdoorMap(this.currentMap.id);
  }

  /**
   * Checks whether a map ID represents a cave, well, tunnel, or subterranean interior
   */
  public static isCaveMap(mapId: string): boolean {
    return /cave|well|tunnel|whirl_island|ice_path|dragons_den|rock_tunnel|digletts_cave|mount_moon|victory_road|silver_cave|tohjo_falls/i.test(
      mapId
    );
  }

  /**
   * Identifies whether a warp tile acts as an authentic GBC exit carpet (COLL_WARP_CARPET_DOWN).
   * In indoor maps, entrance/exit carpets are situated at the doorway threshold (leading outdoor or at the bottom row).
   */
  public static isCarpetWarp(warp: WarpEvent, currentMap: MapData): boolean {
    if (MapManager.isOutdoorMap(currentMap.id)) return false;
    return MapManager.isOutdoorMap(warp.targetMapId) || warp.y >= currentMap.height - 2;
  }

  /**
   * Resolves canonical building/cave/stair transition configuration adhering to pret/pokecrystal:
   * - Exiting to overworld spawns 1 tile in front of the door (targetX, targetY + 1) facing DOWN
   * - Entering indoor spawns at door facing UP
   * - Selects authentic sound cues (DOOR_ENTER, DOOR_EXIT, STAIRS_STEP, CAVE_WARP)
   * - Enforces 160ms/160ms transition pacing
   */
  public static resolveWarpTransition(
    warp: WarpEvent,
    currentMap: MapData,
    targetMap?: MapData
  ): WarpTransitionConfig {
    const currentOutdoor = MapManager.isOutdoorMap(currentMap.id);
    const targetOutdoor = MapManager.isOutdoorMap(warp.targetMapId);
    const isEnteringIndoor = currentOutdoor && !targetOutdoor;
    const isExitingToOverworld = !currentOutdoor && targetOutdoor;
    const isCave = MapManager.isCaveMap(currentMap.id) || MapManager.isCaveMap(warp.targetMapId);
    const isStairs = !isCave && !isEnteringIndoor && !isExitingToOverworld;

    let soundCue: WarpSoundCue = 'DOOR_ENTER';
    if (isCave) {
      soundCue = 'CAVE_WARP';
    } else if (isStairs) {
      soundCue = 'STAIRS_STEP';
    } else if (isExitingToOverworld) {
      soundCue = 'DOOR_EXIT';
    } else if (isEnteringIndoor) {
      soundCue = 'DOOR_ENTER';
    }

    let landingX = warp.targetX;
    let landingY = warp.targetY;
    let landingFacing: Direction = 'DOWN';

    if (warp.direction) {
      landingFacing = warp.direction;
    } else if (isCave) {
      landingFacing = 'DOWN';
    } else if (isExitingToOverworld) {
      landingFacing = 'DOWN';
    } else if (isEnteringIndoor) {
      landingFacing = 'UP';
    } else if (isStairs) {
      landingFacing = warp.targetY <= 1 ? 'DOWN' : 'UP';
    }

    if (isExitingToOverworld) {
      landingFacing = 'DOWN';
      // Canonical Outdoor Doorstep Landing:
      // If targetMap has an entrance warp at (targetX, targetY), or if targetMap is undefined,
      // (targetX, targetY) is the door tile and the player spawns 1 tile in front of the door (targetY + 1).
      // If targetMap already has targetY on the safe apron, preserve targetY.
      const isDoorTile = targetMap
        ? targetMap.warps?.some((w) => w.x === warp.targetX && w.y === warp.targetY) ?? true
        : true;
      if (isDoorTile) {
        landingY = warp.targetY + 1;
      }
    }

    return {
      previousMapId: currentMap.id,
      targetMapId: warp.targetMapId,
      isEnteringIndoor,
      isExitingToOverworld,
      isStairs,
      isCave,
      landingX,
      landingY,
      landingFacing,
      soundCue,
      fadeDurationMs: 160,
    };
  }

  public resolveWarpTransition(warp: WarpEvent): WarpTransitionConfig {
    if (!this.currentMap) {
      throw new Error('No current map set.');
    }
    return MapManager.resolveWarpTransition(
      warp,
      this.currentMap,
      this.maps.get(warp.targetMapId)
    );
  }
}
