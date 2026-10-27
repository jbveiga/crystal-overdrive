/**
 * @fileoverview Predictive background preloader for 1-hop cardinal neighbor maps, warp targets, NPC registries, and sprite/tile warmup delegates.
 * @module world/AdjacentMapPrefetcher
 * @role Predictive Neighbor & Warp Preloading Coordinator
 * @exports AdjacentMapPrefetcher, PrefetchTargetDescriptor, PrefetchStats, AdjacentMapPrefetcherOptions
 * @layer world
 */

import type { MapData } from '../types/game';
import type { GridEntity, NpcSpriteType } from './GridPhysics';
import type { MapManager } from './MapManager';
import type { ActiveNpcCache } from './ActiveNpcCache';

export interface PrefetchTargetDescriptor {
  mapId: string;
  relation: 'CARDINAL' | 'WARP';
  direction?: 'NORTH' | 'SOUTH' | 'WEST' | 'EAST';
}

export interface PrefetchStats {
  /** Total unique mapIds warmed since initialization */
  prefetchedMapCount: number;
  /** Number of synchronous cache hits when resolving maps via prefetcher/transitions */
  cacheHits: number;
  /** Number of cold cache misses requiring async map JSON load */
  cacheMisses: number;
  /** Total unique NpcSpriteType assets warmed across sessions */
  warmedSpriteTypeCount: number;
  /** Currently active background prefetch jobs */
  inFlightCount: number;
  /** Most recent center mapId for which prefetchAroundMap completed */
  lastCenterMapId: string | null;
}

export interface AdjacentMapPrefetcherOptions {
  mapManager: MapManager;
  activeNpcCache?: ActiveNpcCache;
  /**
   * Synchronous or async hook to reset/mutate NPCs for a target map and populate ActiveNpcCache,
   * returning the active GridEntity[] list for that map.
   */
  prepareMapNpcs?: (mapId: string) => GridEntity[];
  /**
   * Optional renderer delegate to warm NPC character spritesheets for discovered NpcSpriteTypes.
   */
  onWarmNpcSprites?: (spriteTypes: NpcSpriteType[]) => Promise<void> | void;
  /**
   * Optional renderer delegate to warm map tile textures for an adjacent map.
   */
  onWarmMapTiles?: (map: MapData) => Promise<void> | void;
  /**
   * Maximum resident maps to keep in MapManager LRU (default: 20).
   */
  maxResidentMaps?: number;
}

export class AdjacentMapPrefetcher {
  private mapManager: MapManager;
  private activeNpcCache?: ActiveNpcCache;
  private options: AdjacentMapPrefetcherOptions;

  private prefetchedMapIds: Set<string> = new Set();
  private warmedSpriteTypes: Set<NpcSpriteType> = new Set();
  private inFlightMapLoads: Map<string, Promise<MapData | undefined>> = new Map();
  private inFlightCenterPrefetches: Map<string, Promise<string[]>> = new Map();

  private stats: PrefetchStats = {
    prefetchedMapCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    warmedSpriteTypeCount: 0,
    inFlightCount: 0,
    lastCenterMapId: null,
  };

  constructor(options: AdjacentMapPrefetcherOptions) {
    this.options = options;
    this.mapManager = options.mapManager;
    this.activeNpcCache = options.activeNpcCache;
  }

  /**
   * Discovers 1-hop cardinal neighbor maps and unique warp target maps from a given map.
   * Cardinal connections are prioritized first, followed by warp targets.
   * Excludes center map.id and deduplicates any targets.
   */
  public collectAdjacentTargets(map: MapData): PrefetchTargetDescriptor[] {
    const targets: PrefetchTargetDescriptor[] = [];
    const seenMapIds = new Set<string>();
    if (map.id) {
      seenMapIds.add(map.id);
    }

    // 1. Cardinal neighbors (NORTH, SOUTH, WEST, EAST)
    if (map.connections) {
      const directions: Array<'NORTH' | 'SOUTH' | 'WEST' | 'EAST'> = ['NORTH', 'SOUTH', 'WEST', 'EAST'];
      for (let i = 0; i < directions.length; i++) {
        const dir = directions[i];
        const conn = map.connections[dir];
        if (conn && conn.mapId && !seenMapIds.has(conn.mapId)) {
          seenMapIds.add(conn.mapId);
          targets.push({
            mapId: conn.mapId,
            relation: 'CARDINAL',
            direction: dir,
          });
        }
      }
    }

    // 2. Local warp/door targets
    if (map.warps && Array.isArray(map.warps)) {
      for (let i = 0; i < map.warps.length; i++) {
        const warp = map.warps[i];
        if (warp && warp.targetMapId && !seenMapIds.has(warp.targetMapId)) {
          seenMapIds.add(warp.targetMapId);
          targets.push({
            mapId: warp.targetMapId,
            relation: 'WARP',
          });
        }
      }
    }

    return targets;
  }

  /**
   * Asynchronously prefetches and warms 1-hop adjacent maps, their NPC states,
   * character sprites, and tile textures around a designated center map.
   */
  public async prefetchAroundMap(centerMapId: string): Promise<string[]> {
    if (!centerMapId) return [];

    const existingPrefetch = this.inFlightCenterPrefetches.get(centerMapId);
    if (existingPrefetch) {
      return existingPrefetch;
    }

    this.stats.inFlightCount++;

    const prefetchPromise = (async () => {
      try {
        // Ensure center map is loaded
        let centerMap = this.mapManager.getMap(centerMapId);
        if (!centerMap) {
          centerMap = await this.ensureTargetMapLoaded(centerMapId);
        }
        if (!centerMap) return [];

        const newlyDiscoveredSpriteTypes: Set<NpcSpriteType> = new Set();

        // Warm center map NPCs & sprites if prepareMapNpcs is available
        if (this.options.prepareMapNpcs) {
          try {
            const centerNpcs = this.options.prepareMapNpcs(centerMapId);
            for (let i = 0; i < centerNpcs.length; i++) {
              const st = (centerNpcs[i].spriteType || 'boy') as NpcSpriteType;
              if (!this.warmedSpriteTypes.has(st)) {
                newlyDiscoveredSpriteTypes.add(st);
                this.warmedSpriteTypes.add(st);
              }
            }
          } catch (err) {
            console.warn(`Error preparing NPCs for center map "${centerMapId}":`, err);
          }
        }

        const targets = this.collectAdjacentTargets(centerMap);
        const warmedMapIds: string[] = [];

        for (let i = 0; i < targets.length; i++) {
          const target = targets[i];
          const isResident = Boolean(this.mapManager.getMap(target.mapId));
          if (isResident) {
            this.stats.cacheHits++;
          } else {
            this.stats.cacheMisses++;
          }

          const targetMap = await this.ensureTargetMapLoaded(target.mapId);
          if (targetMap) {
            this.prefetchedMapIds.add(target.mapId);
            warmedMapIds.push(target.mapId);

            // Warm target map NPCs
            if (this.options.prepareMapNpcs) {
              try {
                const npcs = this.options.prepareMapNpcs(target.mapId);
                for (let j = 0; j < npcs.length; j++) {
                  const st = (npcs[j].spriteType || 'boy') as NpcSpriteType;
                  if (!this.warmedSpriteTypes.has(st)) {
                    newlyDiscoveredSpriteTypes.add(st);
                    this.warmedSpriteTypes.add(st);
                  }
                }
              } catch (err) {
                console.warn(`Error preparing NPCs for target map "${target.mapId}":`, err);
              }
            }

            // Warm map tiles
            if (this.options.onWarmMapTiles) {
              try {
                await this.options.onWarmMapTiles(targetMap);
              } catch (err) {
                console.warn(`Error warming map tiles for "${target.mapId}":`, err);
              }
            }
          }
        }

        // Warm all newly discovered NPC sprite types
        if (newlyDiscoveredSpriteTypes.size > 0 && this.options.onWarmNpcSprites) {
          try {
            await this.options.onWarmNpcSprites(Array.from(newlyDiscoveredSpriteTypes));
          } catch (err) {
            console.warn('Error warming NPC sprites:', err);
          }
        }

        this.stats.prefetchedMapCount = this.prefetchedMapIds.size;
        this.stats.warmedSpriteTypeCount = this.warmedSpriteTypes.size;
        this.stats.lastCenterMapId = centerMapId;

        // Evict distant maps if limit exceeded
        const maxResident = this.options.maxResidentMaps ?? 20;
        this.mapManager.evictDistantMaps(centerMapId, maxResident);
        if (this.activeNpcCache) {
          this.activeNpcCache.evictMapsNotIn(this.mapManager.getProtectedMapIds(centerMapId));
        }

        return warmedMapIds;
      } finally {
        this.stats.inFlightCount--;
        this.inFlightCenterPrefetches.delete(centerMapId);
      }
    })();

    this.inFlightCenterPrefetches.set(centerMapId, prefetchPromise);
    return prefetchPromise;
  }

  private ensureTargetMapLoaded(mapId: string): Promise<MapData | undefined> {
    const existing = this.mapManager.getMap(mapId);
    if (existing) {
      return Promise.resolve(existing);
    }
    const inFlight = this.inFlightMapLoads.get(mapId);
    if (inFlight) {
      return inFlight;
    }
    const loadPromise = this.mapManager
      .ensureMapLoaded(mapId)
      .finally(() => {
        this.inFlightMapLoads.delete(mapId);
      });
    this.inFlightMapLoads.set(mapId, loadPromise);
    return loadPromise;
  }

  /**
   * Checks whether a map is fully warm in memory:
   * Map JSON is loaded in MapManager AND its active NPCs are resident in ActiveNpcCache (if attached).
   */
  public isMapWarm(mapId: string): boolean {
    const hasMapData = this.mapManager.getMap(mapId) !== undefined;
    if (!hasMapData) return false;
    if (this.activeNpcCache) {
      return this.activeNpcCache.hasMap(mapId);
    }
    return true;
  }

  /**
   * Records a transition lookup attempt, incrementing cache hits if warm, misses if cold.
   * Returns whether the map was already warm.
   */
  public recordTransitionLookup(mapId: string): boolean {
    const warm = this.isMapWarm(mapId);
    if (warm) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    return warm;
  }

  /**
   * Returns the set of mapIds protected from eviction (center, cardinal connections, and warps).
   */
  public getProtectedMapIds(centerMapId: string): Set<string> {
    return this.mapManager.getProtectedMapIds(centerMapId);
  }

  /**
   * Returns a telemetry snapshot of prefetch performance.
   */
  public getStats(): PrefetchStats {
    return { ...this.stats };
  }

  /**
   * Clears the warmed cache registry (useful for testing or full state reset).
   */
  public clearWarmCache(): void {
    this.prefetchedMapIds.clear();
    this.warmedSpriteTypes.clear();
    this.inFlightMapLoads.clear();
    this.inFlightCenterPrefetches.clear();
    this.stats.prefetchedMapCount = 0;
    this.stats.warmedSpriteTypeCount = 0;
    this.stats.lastCenterMapId = null;
  }
}
