import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TrackedStoryFlagSet, ActiveNpcCache } from '../src/world/ActiveNpcCache';
import type { GridEntity } from '../src/world/GridPhysics';
import { MapManager } from '../src/world/MapManager';
import type { MapData } from '../src/types/game';

// Polyfill minimal browser globals for PixiJS in Node 20 environments
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node' },
    configurable: true,
    writable: true,
  });
}
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
    }),
  };
}

let Container: typeof import('pixi.js').Container;
let GraphicParticlePool: typeof import('../src/render/GraphicParticlePool').GraphicParticlePool;

beforeAll(async () => {
  const pixi = await import('pixi.js');
  Container = pixi.Container;
  const poolMod = await import('../src/render/GraphicParticlePool');
  GraphicParticlePool = poolMod.GraphicParticlePool;
});

describe('Full-Stack Performance & Efficiency Optimizations', () => {
  describe('1. GraphicParticlePool (Zero-Allocation Overworld Particle Recycling)', () => {
    it('pre-allocates initial capacity and recycles Graphics instances without new allocations', () => {
      const pool = new GraphicParticlePool(8);
      expect(pool.getTotalAllocated()).toBe(8);
      expect(pool.getAvailableCount()).toBe(8);
      expect(pool.getActiveCount()).toBe(0);

      const parent = new Container();
      const acquired = [];
      for (let i = 0; i < 4; i++) {
        const g = pool.acquire();
        g.position.set(100 + i, 200 + i);
        g.alpha = 0.5;
        parent.addChild(g);
        acquired.push(g);
      }

      expect(pool.getActiveCount()).toBe(4);
      expect(pool.getAvailableCount()).toBe(4);
      expect(pool.getTotalAllocated()).toBe(8);
      expect(parent.children.length).toBe(4);

      // Release all 4 back to pool
      for (const g of acquired) {
        pool.release(g);
      }

      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(8);
      expect(pool.getTotalAllocated()).toBe(8);
      expect(parent.children.length).toBe(0);

      // Re-acquiring reuses the exact same Graphics objects with reset transform & alpha
      const reused = pool.acquire();
      expect(acquired).toContain(reused);
      expect(reused.alpha).toBe(1);
      expect(reused.x).toBe(0);
      expect(reused.y).toBe(0);
      expect(reused.visible).toBe(true);
      expect(pool.getTotalAllocated()).toBe(8);
    });

    it('expands dynamically if simultaneous burst exceeds initial capacity', () => {
      const pool = new GraphicParticlePool(2);
      const g1 = pool.acquire();
      const g2 = pool.acquire();
      const g3 = pool.acquire();

      expect(pool.getActiveCount()).toBe(3);
      expect(pool.getTotalAllocated()).toBe(3);

      pool.release(g1);
      pool.release(g2);
      pool.release(g3);
      expect(pool.getAvailableCount()).toBe(3);
    });
  });

  describe('2. TrackedStoryFlagSet & ActiveNpcCache (60 FPS Ticker Memoization)', () => {
    const createMockNpc = (id: string): GridEntity => ({
      id,
      x: 5,
      y: 5,
      targetX: 5,
      targetY: 5,
      renderX: 5,
      renderY: 5,
      direction: 'DOWN',
      isMoving: false,
      progress: 0,
    });

    it('increments TrackedStoryFlagSet version only when set contents actually mutate', () => {
      const flags = new TrackedStoryFlagSet();
      expect(flags.version).toBe(0);

      flags.add('HAS_POKEDEX');
      expect(flags.version).toBe(1);

      // Adding duplicate flag does not bump version
      flags.add('HAS_POKEDEX');
      expect(flags.version).toBe(1);

      flags.add('EVENT_BEAT_FALKNER');
      expect(flags.version).toBe(2);

      // Deleting non-existent flag does not bump version
      flags.delete('NON_EXISTENT');
      expect(flags.version).toBe(2);

      flags.delete('HAS_POKEDEX');
      expect(flags.version).toBe(3);

      flags.clear();
      expect(flags.version).toBe(4);
    });

    it('returns memoized active NPC array in O(1) across 60 FPS frames and invalidates on flag change', () => {
      const flags = new TrackedStoryFlagSet();
      const cache = new ActiveNpcCache();
      const rawNpcs: GridEntity[] = [
        createMockNpc('elm'),
        createMockNpc('rival_blocker'),
        createMockNpc('aide'),
      ];

      const filterFn = vi.fn((npcId: string, f: Set<string>) => {
        if (npcId === 'rival_blocker' && f.has('STARTER_CHOSEN')) {
          return false;
        }
        return true;
      });

      // Frame 1: Cache miss -> evaluates filterFn for each NPC
      const frame1Result = cache.getActiveNpcs('new_bark_town', rawNpcs, flags, filterFn);
      expect(frame1Result.map((n) => n.id)).toEqual(['elm', 'rival_blocker', 'aide']);
      expect(filterFn).toHaveBeenCalledTimes(3);
      expect(cache.getStats()).toEqual({ hits: 0, misses: 1, cachedMaps: 1 });

      // Frames 2..60: Cache hit -> zero filterFn calls and identical array reference
      for (let frame = 2; frame <= 60; frame++) {
        const res = cache.getActiveNpcs('new_bark_town', rawNpcs, flags, filterFn);
        expect(res).toBe(frame1Result);
      }
      expect(filterFn).toHaveBeenCalledTimes(3);
      expect(cache.getStats().hits).toBe(59);
      expect(cache.getStats().misses).toBe(1);

      // Story flag mutation -> automatically invalidates and recomputes on next frame
      flags.add('STARTER_CHOSEN');
      const frame61Result = cache.getActiveNpcs('new_bark_town', rawNpcs, flags, filterFn);
      expect(frame61Result).not.toBe(frame1Result);
      expect(frame61Result.map((n) => n.id)).toEqual(['elm', 'aide']);
      expect(filterFn).toHaveBeenCalledTimes(6);
      expect(cache.getStats().misses).toBe(2);
    });
  });

  describe('3. MapManager Zone-Based Lazy-Loading & Deduplication (LRU=16)', () => {
    const createMockMap = (id: string, options: Partial<MapData> = {}): MapData => ({
      id,
      name: id.toUpperCase(),
      width: 10,
      height: 10,
      tileSize: 64,
      collisionGrid: new Array(100).fill(0),
      warps: [],
      connections: {},
      ...options,
    });

    it('deduplicates concurrent in-flight requests for the same mapId to a single fetch call', async () => {
      const mapManager = new MapManager();
      const mockRouteMap = createMockMap('route_29');

      let fetchCallCount = 0;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        fetchCallCount++;
        // Small artificial delay to ensure concurrent calls overlap
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          ok: true,
          json: async () => mockRouteMap,
        };
      }) as any;

      try {
        const [res1, res2, res3] = await Promise.all([
          mapManager.ensureMapLoaded('route_29'),
          mapManager.ensureMapLoaded('route_29'),
          mapManager.ensureMapLoaded('route_29'),
        ]);

        expect(fetchCallCount).toBe(1);
        expect(res1).toBe(res2);
        expect(res2).toBe(res3);
        expect(res1?.id).toBe('route_29');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('preloads 1-hop cardinal connections and background-prefetches local door warps', async () => {
      const mapManager = new MapManager();
      const activeMap = createMockMap('cherrygrove_city', {
        connections: {
          EAST: { mapId: 'route_29', offset: 0 },
          NORTH: { mapId: 'route_30', offset: 0 },
        },
        warps: [
          { x: 5, y: 5, targetMapId: 'cherrygrove_poke_center', targetX: 3, targetY: 5 },
          { x: 10, y: 5, targetMapId: 'cherrygrove_mart', targetX: 3, targetY: 5 },
        ],
      });

      const fetchedMaps: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        const match = url.match(/maps\/(.+)\.json$/);
        const id = match ? match[1] : 'unknown';
        fetchedMaps.push(id);
        const map = id === 'cherrygrove_city' ? activeMap : createMockMap(id);
        return {
          ok: true,
          json: async () => map,
        };
      }) as any;

      try {
        const result = await mapManager.ensureZoneAndConnectionsLoaded('cherrygrove_city');
        expect(result?.id).toBe('cherrygrove_city');

        // Cardinal neighbors must be loaded
        expect(mapManager.getMap('route_29')).toBeDefined();
        expect(mapManager.getMap('route_30')).toBeDefined();

        // Allow microtask queue to settle background warp prefetches
        await new Promise((resolve) => setTimeout(resolve, 25));

        expect(mapManager.getMap('cherrygrove_poke_center')).toBeDefined();
        expect(mapManager.getMap('cherrygrove_mart')).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('enforces LRU cap of 16 resident maps while strictly protecting active, neighbor, and warp maps', () => {
      const mapManager = new MapManager();
      expect(MapManager.MAX_RESIDENT_MAPS).toBe(16);

      const activeMap = createMockMap('violet_city', {
        connections: {
          SOUTH: { mapId: 'route_32', offset: 0 },
        },
        warps: [
          { x: 3, y: 3, targetMapId: 'violet_gym', targetX: 5, targetY: 10 },
        ],
      });

      mapManager.registerMap(activeMap);
      mapManager.registerMap(createMockMap('route_32'));
      mapManager.registerMap(createMockMap('violet_gym'));

      // Register 20 other distant maps
      for (let i = 1; i <= 20; i++) {
        mapManager.registerMap(createMockMap(`distant_map_${i}`));
      }

      // Total loaded before eviction: 23 maps
      // Default evictDistantMaps caps to MAX_RESIDENT_MAPS (16)
      const evicted = mapManager.evictDistantMaps('violet_city');
      expect(evicted).toBe(7); // 23 - 16 = 7

      // Active map, south route, and gym warp must NEVER be evicted
      expect(mapManager.getMap('violet_city')).toBeDefined();
      expect(mapManager.getMap('route_32')).toBeDefined();
      expect(mapManager.getMap('violet_gym')).toBeDefined();

      // Older distant maps should be evicted first
      expect(mapManager.getMap('distant_map_1')).toBeUndefined();
      expect(mapManager.getMap('distant_map_7')).toBeUndefined();
      expect(mapManager.getMap('distant_map_20')).toBeDefined();
    });
  });
});

