/**
 * @fileoverview World map registry, asynchronous streaming, collision evaluation, and wild encounter queries.
 * @module world/MapManager
 * @role Map Manager & Collision Engine
 * @exports MapManager, WildEncounterResult
 * @layer world
 */

import type { BgEvent, Direction, EncounterRateMode, MapData, TileCoord, WarpEvent, WarpSoundCue, WarpTransitionConfig } from '../types/game';
import type { AdjacentMapPrefetcher } from './AdjacentMapPrefetcher';
import {
  isOutdoorMap,
  isCaveMap,
  isDungeonOrCaveMap,
  canTriggerWildEncounter,
  getRequiredWarpDirection,
  isCarpetWarp,
  resolveWarpTransition,
} from './map/MapClassificationAndWarpRules';

export interface WildEncounterResult {
  speciesId: string;
  level: number;
  isRoamer?: boolean;
}

export interface MapNpcLifecycleCallbacks {
  onMapLoaded?: (map: MapData) => void | Promise<void>;
  onMapEvicted?: (mapId: string) => void;
}

export class MapManager {
  public static readonly GRACE_STEPS_DEFAULT = 4;
  public static readonly GRASS_CAP_NORMAL = 0.0625;  // 6.25% (1 in 16 steps)
  public static readonly GRASS_CAP_RELAXED = 0.04;   // 4.00% (1 in 25 steps)
  public static readonly GRASS_CAP_CLASSIC = 0.10;   // 10.0% (1 in 10 steps)
  public static readonly CAVE_CAP_NORMAL = 0.04;     // 4.00% (1 in 25 steps)
  public static readonly CAVE_CAP_RELAXED = 0.025;   // 2.50% (1 in 40 steps)
  public static readonly CAVE_CAP_CLASSIC = 0.0625;  // 6.25% (1 in 16 steps)

  public static readonly MAX_RESIDENT_MAPS = 16;

  private currentMap: MapData | null = null;
  private neighborScratchMap: MapData | null = null;
  private maps: Map<string, MapData> = new Map();
  private inFlightLoads: Map<string, Promise<MapData | undefined>> = new Map();
  private graceStepsRemaining: number = 0;
  private stepsSinceGraceEnd: number = 4;
  private pacingEnabled: boolean = false;
  private repelStepsRemaining: number = 0;
  private encounterRateMode: EncounterRateMode = 'NORMAL';
  private surfEnabled: boolean = false;
  private prefetcher: AdjacentMapPrefetcher | null = null;
  private spatialWarpCache: Map<string, Map<string, WarpEvent>> = new Map();
  private spatialBgEventCache: Map<string, Map<string, BgEvent>> = new Map();

  private getSpatialWarps(map: MapData): Map<string, WarpEvent> {
    let index = this.spatialWarpCache.get(map.id);
    if (!index) {
      index = new Map();
      for (const w of map.warps) {
        index.set(`${w.x},${w.y}`, w);
      }
      this.spatialWarpCache.set(map.id, index);
    }
    return index;
  }

  private getSpatialBgEvents(map: MapData): Map<string, BgEvent> {
    let index = this.spatialBgEventCache.get(map.id);
    if (!index) {
      index = new Map();
      if (map.bgEvents) {
        for (const bg of map.bgEvents) {
          index.set(`${bg.x},${bg.y}`, bg);
        }
      }
      this.spatialBgEventCache.set(map.id, index);
    }
    return index;
  }

  public setSurfEnabled(enabled: boolean): void {
    this.surfEnabled = enabled;
  }

  public isSurfEnabled(): boolean {
    return this.surfEnabled;
  }

  public invalidateSpatialCache(mapId?: string): void {
    if (mapId) {
      this.spatialWarpCache.delete(mapId);
      this.spatialBgEventCache.delete(mapId);
    } else {
      this.spatialWarpCache.clear();
      this.spatialBgEventCache.clear();
    }
  }

  private mapAccessTimestamps: Map<string, number> = new Map();
  private npcLifecycleCallbacks?: MapNpcLifecycleCallbacks;

  public setNpcLifecycleCallbacks(callbacks: MapNpcLifecycleCallbacks): void {
    this.npcLifecycleCallbacks = callbacks;
  }

  registerMap(map: MapData): void {
    this.maps.set(map.id, map);
    this.mapAccessTimestamps.set(map.id, Date.now());
    if (this.npcLifecycleCallbacks?.onMapLoaded) {
      try {
        void this.npcLifecycleCallbacks.onMapLoaded(map);
      } catch (err) {
        console.warn(`Error in onMapLoaded callback for map "${map.id}":`, err);
      }
    }
  }

  touchMap(mapId: string): void {
    if (this.maps.has(mapId)) {
      this.mapAccessTimestamps.set(mapId, Date.now());
    }
  }

  /**
   * Returns the exact 1-hop protected zone set:
   * activeMapId, currentMap.id, cardinal NORTH/SOUTH/EAST/WEST neighbors, and direct warps.targetMapId.
   */
  public getProtectedMapIds(activeMapId: string): Set<string> {
    const protectedMapIds = new Set<string>();
    if (activeMapId) protectedMapIds.add(activeMapId);
    if (this.currentMap) protectedMapIds.add(this.currentMap.id);

    const active = this.maps.get(activeMapId) || this.currentMap;
    if (active) {
      if (active.connections) {
        if (active.connections.NORTH?.mapId) protectedMapIds.add(active.connections.NORTH.mapId);
        if (active.connections.SOUTH?.mapId) protectedMapIds.add(active.connections.SOUTH.mapId);
        if (active.connections.WEST?.mapId) protectedMapIds.add(active.connections.WEST.mapId);
        if (active.connections.EAST?.mapId) protectedMapIds.add(active.connections.EAST.mapId);
      }
      if (active.warps) {
        for (const w of active.warps) {
          if (w.targetMapId) {
            protectedMapIds.add(w.targetMapId);
          }
        }
      }
    }
    return protectedMapIds;
  }

  /**
   * Evicts distant maps when loaded maps exceed maxResident (default 16).
   * Never evicts activeMapId, currentMap, 1-hop connected neighbors, or direct warp targets.
   */
  evictDistantMaps(activeMapId: string, maxResident: number = MapManager.MAX_RESIDENT_MAPS): number {
    if (this.maps.size <= maxResident) return 0;

    const protectedMapIds = this.getProtectedMapIds(activeMapId);

    const candidateEntries: Array<{ mapId: string; time: number }> = [];
    for (const [id] of this.maps) {
      if (!protectedMapIds.has(id)) {
        candidateEntries.push({ mapId: id, time: this.mapAccessTimestamps.get(id) || 0 });
      }
    }

    candidateEntries.sort((a, b) => a.time - b.time);
    let evictedCount = 0;
    while (this.maps.size > maxResident && candidateEntries.length > 0) {
      const candidate = candidateEntries.shift()!;
      this.maps.delete(candidate.mapId);
      this.mapAccessTimestamps.delete(candidate.mapId);
      this.invalidateSpatialCache(candidate.mapId);
      if (this.npcLifecycleCallbacks?.onMapEvicted) {
        try {
          this.npcLifecycleCallbacks.onMapEvicted(candidate.mapId);
        } catch (err) {
          console.warn(`Error in onMapEvicted callback for map "${candidate.mapId}":`, err);
        }
      }
      evictedCount++;
    }
    return evictedCount;
  }

  /**
   * Lazily retrieves a map from cache or fetches it on-demand from ./assets/data/maps/${mapId}.json.
   * Deduplicates concurrent in-flight requests for the same mapId.
   */
  async ensureMapLoaded(mapId: string): Promise<MapData | undefined> {
    if (!mapId) return undefined;
    const existing = this.maps.get(mapId);
    if (existing) {
      this.touchMap(mapId);
      return existing;
    }

    const inFlight = this.inFlightLoads.get(mapId);
    if (inFlight) {
      return inFlight;
    }

    const loadPromise = (async () => {
      try {
        const res = await fetch(`./assets/data/maps/${mapId}.json`);
        if (res.ok) {
          const data: MapData = await res.json();
          this.registerMap(data);
          return data;
        }
      } catch (err) {
        console.warn(`Could not lazy load map "${mapId}":`, err);
      }
      return undefined;
    })().finally(() => {
      this.inFlightLoads.delete(mapId);
    });

    this.inFlightLoads.set(mapId, loadPromise);
    return loadPromise;
  }

  /**
   * Loads the requested map and preloads its immediate 1-hop connections:
   * 1. Awaits the target active map and its cardinal border neighbors (NORTH, SOUTH, EAST, WEST).
   * 2. Kicks off non-blocking preloading for all unique local door/cave/stair warp target maps.
   */
  async ensureZoneAndConnectionsLoaded(mapId: string): Promise<MapData | undefined> {
    const activeMap = await this.ensureMapLoaded(mapId);
    if (!activeMap) return undefined;

    // 1-hop cardinal neighbor preloading (blocking for smooth border scrolling)
    const cardinalIds: string[] = [];
    if (activeMap.connections) {
      if (activeMap.connections.NORTH?.mapId) cardinalIds.push(activeMap.connections.NORTH.mapId);
      if (activeMap.connections.SOUTH?.mapId) cardinalIds.push(activeMap.connections.SOUTH.mapId);
      if (activeMap.connections.WEST?.mapId) cardinalIds.push(activeMap.connections.WEST.mapId);
      if (activeMap.connections.EAST?.mapId) cardinalIds.push(activeMap.connections.EAST.mapId);
    }
    if (cardinalIds.length > 0) {
      await Promise.all(cardinalIds.map(id => this.ensureMapLoaded(id)));
    }

    // 1-hop door & warp targets (non-blocking prefetch for fast door transitions)
    if (this.prefetcher) {
      void this.prefetcher.prefetchAroundMap(mapId);
    } else if (activeMap.warps && activeMap.warps.length > 0) {
      const warpTargets = new Set<string>();
      for (const w of activeMap.warps) {
        if (w.targetMapId && !this.maps.has(w.targetMapId)) {
          warpTargets.add(w.targetMapId);
        }
      }
      for (const targetId of warpTargets) {
        void this.ensureMapLoaded(targetId);
      }
    }

    return activeMap;
  }

  public setPrefetcher(prefetcher: AdjacentMapPrefetcher | null): void {
    this.prefetcher = prefetcher;
  }

  public getPrefetcher(): AdjacentMapPrefetcher | null {
    return this.prefetcher;
  }

  setCurrentMap(mapId: string): MapData {
    const map = this.maps.get(mapId);
    if (!map) {
      throw new Error(`Map with id "${mapId}" not found.`);
    }
    this.currentMap = map;
    this.touchMap(mapId);
    if (this.npcLifecycleCallbacks?.onMapLoaded) {
      try {
        void this.npcLifecycleCallbacks.onMapLoaded(map);
      } catch (err) {
        console.warn(`Error in onMapLoaded callback for map "${map.id}":`, err);
      }
    }
    this.evictDistantMaps(mapId);
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
    // Walkable on normal ground (0) and tall grass (2). Water (3) is walkable if Surfing is enabled. Solid (1) is blocked.
    if (tileType === 3) {
      return this.surfEnabled;
    }
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
   * Checks if coordinate lands on a warp point (O(1) spatial lookup)
   */
  checkWarp(coord: TileCoord): WarpEvent | undefined {
    if (!this.currentMap) return undefined;
    return this.getSpatialWarps(this.currentMap).get(`${coord.x},${coord.y}`);
  }

  /**
   * Checks if coordinate has an interactive sign or background event (including across connected map borders)
   */
  checkBgEvent(x: number, y: number): BgEvent | undefined {
    if (!this.currentMap) return undefined;
    if (x < 0 && this.currentMap.connections.WEST) {
      const conn = this.currentMap.connections.WEST;
      const westMap = this.maps.get(conn.mapId);
      if (westMap) {
        return this.getSpatialBgEvents(westMap).get(`${x + westMap.width},${y - conn.offset}`);
      }
      return undefined;
    }
    if (x >= this.currentMap.width && this.currentMap.connections.EAST) {
      const conn = this.currentMap.connections.EAST;
      const eastMap = this.maps.get(conn.mapId);
      if (eastMap) {
        return this.getSpatialBgEvents(eastMap).get(`${x - this.currentMap.width},${y - conn.offset}`);
      }
      return undefined;
    }
    if (y < 0 && this.currentMap.connections.NORTH) {
      const conn = this.currentMap.connections.NORTH;
      const northMap = this.maps.get(conn.mapId);
      if (northMap) {
        return this.getSpatialBgEvents(northMap).get(`${x - conn.offset},${y + northMap.height}`);
      }
      return undefined;
    }
    if (y >= this.currentMap.height && this.currentMap.connections.SOUTH) {
      const conn = this.currentMap.connections.SOUTH;
      const southMap = this.maps.get(conn.mapId);
      if (southMap) {
        return this.getSpatialBgEvents(southMap).get(`${x - conn.offset},${y - this.currentMap.height}`);
      }
      return undefined;
    }
    return this.getSpatialBgEvents(this.currentMap).get(`${x},${y}`);
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
    const isCaveOrRuins = MapManager.isDungeonOrCaveMap(this.currentMap.id);
    if (!MapManager.canTriggerWildEncounter(this.currentMap.id, tileType)) {
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
    return isOutdoorMap(mapId);
  }

  public isCurrentMapOutdoor(): boolean {
    if (!this.currentMap) return true;
    if (typeof this.currentMap.isIndoor === 'boolean') {
      return !this.currentMap.isIndoor;
    }
    return MapManager.isOutdoorMap(this.currentMap.id);
  }

  public static isCaveMap(mapId: string): boolean {
    return isCaveMap(mapId);
  }

  public static isDungeonOrCaveMap(mapId: string): boolean {
    return isDungeonOrCaveMap(mapId);
  }

  public static canTriggerWildEncounter(mapId: string, tileType: number): boolean {
    return canTriggerWildEncounter(mapId, tileType);
  }

  public static getRequiredWarpDirection(warp: WarpEvent, currentMap: MapData): Direction | null {
    return getRequiredWarpDirection(warp, currentMap);
  }

  public static isCarpetWarp(warp: WarpEvent, currentMap: MapData): boolean {
    return isCarpetWarp(warp, currentMap);
  }

  public static resolveWarpTransition(
    warp: WarpEvent,
    currentMap: MapData,
    targetMap?: MapData
  ): WarpTransitionConfig {
    return resolveWarpTransition(warp, currentMap, targetMap);
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
