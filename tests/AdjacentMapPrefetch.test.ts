import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock minimal browser globals for PixiJS environment hydration in node
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'node' },
  configurable: true,
  writable: true,
});
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
    }),
  };
}

import { MapManager } from '../src/world/MapManager';
import { ActiveNpcCache, TrackedStoryFlagSet } from '../src/world/ActiveNpcCache';
import {
  AdjacentMapPrefetcher,
  type PrefetchTargetDescriptor,
} from '../src/world/AdjacentMapPrefetcher';
import type { MapData } from '../src/types/game';
import type { GridEntity, NpcSpriteType } from '../src/world/GridPhysics';

describe('TICKET-PREDICTIVE-ADJACENT-MAP-PREFETCH-01: AdjacentMapPrefetcher & Zero-Latency Transitions', () => {
  let mapManager: MapManager;
  let activeNpcCache: ActiveNpcCache;
  let storyFlags: TrackedStoryFlagSet;

  // Load real maps from public/assets/data/maps
  const loadMapFromDisk = (mapId: string): MapData => {
    const filePath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Map file not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  };

  beforeEach(() => {
    mapManager = new MapManager();
    activeNpcCache = new ActiveNpcCache();
    storyFlags = new TrackedStoryFlagSet();

    // Mock global fetch to return real maps from public/assets/data/maps
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      const match = url.match(/\/assets\/data\/maps\/([a-zA-Z0-9_]+)\.json$/);
      if (match) {
        const mapId = match[1];
        const filePath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return {
            ok: true,
            status: 200,
            json: async () => data,
          };
        }
      }
      return { ok: false, status: 404 };
    });
  });

  describe('1. Topology Discovery (collectAdjacentTargets)', () => {
    it('discovers 1-hop cardinal connections first, then warp targets for New Bark Town', () => {
      const newBarkMap = loadMapFromDisk('new_bark_town');
      const prefetcher = new AdjacentMapPrefetcher({ mapManager });

      const targets = prefetcher.collectAdjacentTargets(newBarkMap);

      // Verify cardinal connections are listed first
      const cardinalTargets = targets.filter((t) => t.relation === 'CARDINAL');
      const warpTargets = targets.filter((t) => t.relation === 'WARP');

      expect(cardinalTargets.length).toBeGreaterThanOrEqual(1);
      expect(warpTargets.length).toBeGreaterThanOrEqual(1);

      // Verify New Bark Town has Route 29 as a cardinal neighbor
      expect(cardinalTargets.some((t) => t.mapId === 'route_29')).toBe(true);

      // Verify New Bark Town has Elm's Lab, Player's House, and neighbor houses as warps
      expect(warpTargets.some((t) => t.mapId === 'elms_lab')).toBe(true);
      expect(warpTargets.some((t) => t.mapId === 'players_house_1f')).toBe(true);
      expect(warpTargets.some((t) => t.mapId === 'players_neighbors_house')).toBe(true);
      expect(warpTargets.some((t) => t.mapId === 'elms_house')).toBe(true);

      // Verify order: cardinal connections precede warp targets
      const firstWarpIdx = targets.findIndex((t) => t.relation === 'WARP');
      const lastCardinalIdx = targets.findLastIndex((t) => t.relation === 'CARDINAL');
      expect(lastCardinalIdx).toBeLessThan(firstWarpIdx);

      // Verify self (new_bark_town) is never included in targets
      expect(targets.some((t) => t.mapId === 'new_bark_town')).toBe(false);

      // Verify zero duplicate mapIds
      const uniqueIds = new Set(targets.map((t) => t.mapId));
      expect(uniqueIds.size).toBe(targets.length);
    });

    it('safely handles maps without connections or warps without throwing', () => {
      const isolatedMap: MapData = {
        id: 'isolated_cell',
        name: 'Isolated Cell',
        width: 10,
        height: 10,
        tileSize: 16,
        collisionGrid: new Array(100).fill(0),
        connections: {},
        warps: [],
      };
      const prefetcher = new AdjacentMapPrefetcher({ mapManager });
      const targets = prefetcher.collectAdjacentTargets(isolatedMap);
      expect(targets).toEqual([]);
    });
  });

  describe('2. End-to-End Predictive Map, NPC & Sprite Warming (prefetchAroundMap)', () => {
    it('warms maps, active NPC cache, NPC spritesheets, and map tiles across 1-hop ring', async () => {
      const warmedSprites: NpcSpriteType[] = [];
      const warmedTileMaps: string[] = [];

      // Mock NPC population for maps
      const mockNpcDb: Record<string, GridEntity[]> = {
        new_bark_town: [
          { id: 'nbt_teacher', x: 10, y: 10, targetX: 10, targetY: 10, renderX: 10, renderY: 10, direction: 'DOWN', isMoving: false, progress: 0, spriteType: 'teacher' },
        ],
        elms_lab: [
          { id: 'prof_elm', x: 4, y: 2, targetX: 4, targetY: 2, renderX: 4, renderY: 2, direction: 'DOWN', isMoving: false, progress: 0, spriteType: 'prof_elm' },
          { id: 'elms_aide', x: 2, y: 6, targetX: 2, targetY: 6, renderX: 2, renderY: 2, direction: 'RIGHT', isMoving: false, progress: 0, spriteType: 'aide' },
        ],
        players_house_1f: [
          { id: 'mom', x: 6, y: 4, targetX: 6, targetY: 4, renderX: 6, renderY: 4, direction: 'LEFT', isMoving: false, progress: 0, spriteType: 'mom' },
        ],
      };

      const prefetcher = new AdjacentMapPrefetcher({
        mapManager,
        activeNpcCache,
        prepareMapNpcs: (id: string) => {
          const raw = mockNpcDb[id] || [];
          return activeNpcCache.getActiveNpcs(id, raw, storyFlags, () => true);
        },
        onWarmNpcSprites: (types: NpcSpriteType[]) => {
          warmedSprites.push(...types);
        },
        onWarmMapTiles: (map: MapData) => {
          warmedTileMaps.push(map.id);
        },
      });

      const warmedIds = await prefetcher.prefetchAroundMap('new_bark_town');

      // Verify return array includes adjacent maps
      expect(warmedIds).toContain('route_29');
      expect(warmedIds).toContain('elms_lab');
      expect(warmedIds).toContain('players_house_1f');

      // Verify maps are resident in MapManager
      expect(mapManager.getMap('new_bark_town')).toBeDefined();
      expect(mapManager.getMap('route_29')).toBeDefined();
      expect(mapManager.getMap('elms_lab')).toBeDefined();
      expect(mapManager.getMap('players_house_1f')).toBeDefined();

      // Verify isMapWarm returns true
      expect(prefetcher.isMapWarm('new_bark_town')).toBe(true);
      expect(prefetcher.isMapWarm('elms_lab')).toBe(true);
      expect(prefetcher.isMapWarm('players_house_1f')).toBe(true);

      // Verify ActiveNpcCache has cached entries for maps with NPCs
      expect(activeNpcCache.hasMap('new_bark_town')).toBe(true);
      expect(activeNpcCache.hasMap('elms_lab')).toBe(true);
      expect(activeNpcCache.hasMap('players_house_1f')).toBe(true);

      // Verify unique NpcSpriteTypes were warmed (teacher, prof_elm, aide, mom)
      expect(warmedSprites).toContain('teacher');
      expect(warmedSprites).toContain('prof_elm');
      expect(warmedSprites).toContain('aide');
      expect(warmedSprites).toContain('mom');

      // Verify tile warming delegate was called for adjacent maps
      expect(warmedTileMaps).toContain('route_29');
      expect(warmedTileMaps).toContain('elms_lab');

      // Verify telemetry stats
      const stats = prefetcher.getStats();
      expect(stats.prefetchedMapCount).toBeGreaterThanOrEqual(4);
      expect(stats.warmedSpriteTypeCount).toBeGreaterThanOrEqual(4);
      expect(stats.lastCenterMapId).toBe('new_bark_town');
      expect(stats.inFlightCount).toBe(0);
    });
  });

  describe('3. Zero-Latency Synchronous Cache Hit (< 1ms) & In-Flight Deduplication', () => {
    it('resolves warmed maps synchronously with 0 network fetch and tracks cache hits', async () => {
      const mockElm: GridEntity = {
        id: 'prof_elm',
        x: 4,
        y: 2,
        targetX: 4,
        targetY: 2,
        renderX: 4,
        renderY: 2,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
        spriteType: 'prof_elm',
      };

      const prefetcher = new AdjacentMapPrefetcher({
        mapManager,
        activeNpcCache,
        prepareMapNpcs: (id) =>
          activeNpcCache.getActiveNpcs(id, id === 'elms_lab' ? [mockElm] : [], storyFlags, () => true),
      });

      // Before prefetch, elms_lab is cold
      expect(prefetcher.isMapWarm('elms_lab')).toBe(false);
      expect(prefetcher.recordTransitionLookup('elms_lab')).toBe(false);
      expect(prefetcher.getStats().cacheMisses).toBe(1);

      // Execute prefetch
      await prefetcher.prefetchAroundMap('new_bark_town');

      const fetchCallCountBefore = (globalThis.fetch as any).mock.calls.length;

      // After prefetch, elms_lab is warm
      expect(prefetcher.isMapWarm('elms_lab')).toBe(true);

      const startTime = performance.now();
      const lookupHit = prefetcher.recordTransitionLookup('elms_lab');
      const mapSync = mapManager.getMap('elms_lab');
      const elapsedMs = performance.now() - startTime;

      expect(lookupHit).toBe(true);
      expect(mapSync).toBeDefined();
      expect(mapSync?.id).toBe('elms_lab');
      expect(elapsedMs).toBeLessThan(1.0); // Sub-millisecond synchronous resolution
      expect((globalThis.fetch as any).mock.calls.length).toBe(fetchCallCountBefore); // Zero network calls
      expect(prefetcher.getStats().cacheHits).toBeGreaterThanOrEqual(1);
    });

    it('deduplicates concurrent prefetchAroundMap calls for the same center map', async () => {
      const prefetcher = new AdjacentMapPrefetcher({ mapManager });

      // Launch 3 concurrent prefetch calls simultaneously
      const [res1, res2, res3] = await Promise.all([
        prefetcher.prefetchAroundMap('new_bark_town'),
        prefetcher.prefetchAroundMap('new_bark_town'),
        prefetcher.prefetchAroundMap('new_bark_town'),
      ]);

      expect(res1).toEqual(res2);
      expect(res2).toEqual(res3);
      expect(res1).toContain('elms_lab');

      // Fetch calls should be minimal and deduplicated across the concurrent promises
      const elmsLabFetches = (globalThis.fetch as any).mock.calls.filter((call: any[]) =>
        call[0].includes('elms_lab.json')
      );
      expect(elmsLabFetches.length).toBe(1);
    });
  });

  describe('4. Warp Target Tile Texture Eviction Protection', () => {
    it('protects tile textures of 1-hop warp targets from eviction in OverworldRenderer', async () => {
      const { OverworldRenderer } = await import('../src/render/OverworldRenderer');
      const newBarkMap = loadMapFromDisk('new_bark_town');
      const elmsLabMap = loadMapFromDisk('elms_lab');
      const distantVioletMap = loadMapFromDisk('violet_city');

      const lookupMap = (id: string): MapData | undefined => {
        if (id === 'new_bark_town') return newBarkMap;
        if (id === 'elms_lab') return elmsLabMap;
        if (id === 'violet_city') return distantVioletMap;
        return undefined;
      };

      // Mock textures map
      const mockDestroy = vi.fn();
      const mockTileTextures = new Map<string, any>();

      // Tile belonging to New Bark Town
      mockTileTextures.set('new_bark_tile_01', { destroy: mockDestroy });
      // Tile belonging ONLY to Elm's Lab (1-hop warp target)
      mockTileTextures.set('elms_lab_tile_01', { destroy: mockDestroy });
      // Tile belonging ONLY to distant Violet City (not in New Bark warps or connections)
      mockTileTextures.set('distant_violet_tile_01', { destroy: mockDestroy });

      // Assign tile arrays to maps
      (newBarkMap as any).tileMap = ['new_bark_tile_01'];
      (elmsLabMap as any).tileMap = ['elms_lab_tile_01'];
      (distantVioletMap as any).tileMap = ['distant_violet_tile_01'];

      // Construct mock OverworldRenderer adhering to interface
      const mockRenderer: any = {
        tileTextures: mockTileTextures,
        waterAnimFrames: new Map(),
        evictDistantNpcSprites: vi.fn(),
        getConnectedMaps: OverworldRenderer.prototype.getConnectedMaps,
        evictDistantTileTextures: OverworldRenderer.prototype.evictDistantTileTextures,
      };

      const evicted = mockRenderer.evictDistantTileTextures(newBarkMap, lookupMap);

      // Verify that Elm's Lab tile was NOT evicted (protected by 1-hop warp target scanning)
      expect(mockTileTextures.has('new_bark_tile_01')).toBe(true);
      expect(mockTileTextures.has('elms_lab_tile_01')).toBe(true);

      // Verify that distant Violet tile WAS evicted
      expect(mockTileTextures.has('distant_violet_tile_01')).toBe(false);
      expect(evicted).toBe(1);
    });
  });

  describe('5. MapManager & Cache Invalidation Guarantees', () => {
    it('integrates prefetcher with MapManager.ensureZoneAndConnectionsLoaded', async () => {
      const prefetcher = new AdjacentMapPrefetcher({ mapManager });
      const prefetchSpy = vi.spyOn(prefetcher, 'prefetchAroundMap');

      mapManager.setPrefetcher(prefetcher);
      expect(mapManager.getPrefetcher()).toBe(prefetcher);

      await mapManager.ensureZoneAndConnectionsLoaded('new_bark_town');

      expect(prefetchSpy).toHaveBeenCalledWith('new_bark_town');
    });

    it('protects center map, cardinal connections, and warps in getProtectedMapIds', () => {
      const newBarkMap = loadMapFromDisk('new_bark_town');
      mapManager.registerMap(newBarkMap);
      mapManager.setCurrentMap('new_bark_town');

      const prefetcher = new AdjacentMapPrefetcher({ mapManager });
      const protectedIds = prefetcher.getProtectedMapIds('new_bark_town');

      expect(protectedIds.has('new_bark_town')).toBe(true);
      expect(protectedIds.has('route_29')).toBe(true);
      expect(protectedIds.has('elms_lab')).toBe(true);
      expect(protectedIds.has('players_house_1f')).toBe(true);
    });

    it('clears warm cache cleanly without residual state', async () => {
      const prefetcher = new AdjacentMapPrefetcher({ mapManager });
      await prefetcher.prefetchAroundMap('new_bark_town');

      expect(prefetcher.getStats().prefetchedMapCount).toBeGreaterThan(0);

      prefetcher.clearWarmCache();

      const stats = prefetcher.getStats();
      expect(stats.prefetchedMapCount).toBe(0);
      expect(stats.warmedSpriteTypeCount).toBe(0);
      expect(stats.lastCenterMapId).toBeNull();
    });
  });
});
