import { describe, it, expect, beforeEach } from 'vitest';
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
  applyMapNpcStoryMutations,
  isNpcActiveForStoryFlags,
  makeNpc,
} from '../src/world/npcData';
import type { MapData } from '../src/types/game';
import type { GridEntity } from '../src/world/GridPhysics';

describe('TICKET-ARCH-NPC-SPAWN-MAP-LIFECYCLE-SYNC-01: NPC & Map Lifecycle Synchronization', () => {
  let mapManager: MapManager;
  let activeNpcCache: ActiveNpcCache;
  let storyFlags: TrackedStoryFlagSet;

  const mockMap = (
    id: string,
    width = 10,
    height = 10,
    connections?: MapData['connections'],
    warps: MapData['warps'] = []
  ): MapData => ({
    id,
    name: id.toUpperCase(),
    width,
    height,
    tileSize: 16,
    collisionGrid: new Array(width * height).fill(0),
    connections: connections || {},
    warps,
  });

  beforeEach(() => {
    mapManager = new MapManager();
    activeNpcCache = new ActiveNpcCache();
    storyFlags = new TrackedStoryFlagSet();
  });

  describe('1. 1:1 Hydration & 1-Hop Preload Sync', () => {
    it('notifies onMapLoaded lifecycle callback when maps are registered or activated', () => {
      const loadedMaps: string[] = [];
      mapManager.setNpcLifecycleCallbacks({
        onMapLoaded: (map) => {
          loadedMaps.push(map.id);
        },
      });

      const mapA = mockMap('new_bark_town');
      const mapB = mockMap('route_29');

      mapManager.registerMap(mapA);
      mapManager.registerMap(mapB);

      expect(loadedMaps).toContain('new_bark_town');
      expect(loadedMaps).toContain('route_29');
    });

    it('protects active map, current map, 1-hop cardinal neighbors, and warp targets from eviction', () => {
      const active = mockMap(
        'cherrygrove_city',
        20,
        20,
        {
          EAST: { mapId: 'route_29', offset: 0 },
          NORTH: { mapId: 'route_30', offset: 0 },
        },
        [
          { x: 5, y: 5, targetMapId: 'cherrygrove_poke_center', targetX: 3, targetY: 5 },
          { x: 10, y: 5, targetMapId: 'cherrygrove_mart', targetX: 3, targetY: 5 },
        ]
      );
      mapManager.registerMap(active);
      mapManager.setCurrentMap('cherrygrove_city');

      const protectedIds = mapManager.getProtectedMapIds('cherrygrove_city');

      expect(protectedIds.has('cherrygrove_city')).toBe(true);
      expect(protectedIds.has('route_29')).toBe(true);
      expect(protectedIds.has('route_30')).toBe(true);
      expect(protectedIds.has('cherrygrove_poke_center')).toBe(true);
      expect(protectedIds.has('cherrygrove_mart')).toBe(true);
      expect(protectedIds.has('violet_city')).toBe(false);
    });

    it('synchronizes 1-hop active NPC cache and evicts distant NPC maps in lockstep with MapManager', () => {
      const evictedFromCallback: string[] = [];
      mapManager.setNpcLifecycleCallbacks({
        onMapEvicted: (mapId) => {
          evictedFromCallback.push(mapId);
          activeNpcCache.invalidate(mapId);
        },
      });

      const centerMap = mockMap('center_hub');
      mapManager.registerMap(centerMap);
      mapManager.setCurrentMap('center_hub');

      // Populate 20 maps into mapManager (max resident is 16)
      for (let i = 1; i <= 20; i++) {
        const distantMap = mockMap(`distant_map_${i}`);
        mapManager.registerMap(distantMap);

        // Populate active NPC cache
        const dummyNpc = makeNpc(`npc_${i}`, 5, 5, 'DOWN', 'boy', 'NPC', ['Hello']);
        activeNpcCache.getActiveNpcs(`distant_map_${i}`, [dummyNpc], storyFlags, () => true);
      }

      // Assert ActiveNpcCache has cached maps
      expect(activeNpcCache.getStats().cachedMaps).toBe(20);

      // Trigger eviction with cap of 10
      const evictedCount = mapManager.evictDistantMaps('center_hub', 10);
      expect(evictedCount).toBeGreaterThan(0);

      // Verify onMapEvicted evicted them from activeNpcCache
      for (const id of evictedFromCallback) {
        expect(activeNpcCache.hasMap(id)).toBe(false);
      }

      // Verify evictMapsNotIn cleans up any remaining non-protected maps
      const protectedIds = mapManager.getProtectedMapIds('center_hub');
      activeNpcCache.evictMapsNotIn(protectedIds);
      expect(activeNpcCache.getStats().cachedMaps).toBeLessThanOrEqual(10);
    });
  });

  describe('2. Story-Flag & Day-of-Week Spawn Filtering Consistency', () => {
    it('applies Route 36 Sudowoodo spawn filtering and origin resetting', () => {
      const sudoNpc = makeNpc('sudowoodo', 10, 12, 'DOWN', 'boy', 'SUDOWOODO', ['...']);
      sudoNpc.x = 99; // Mutated coordinates mid-game
      sudoNpc.isMoving = true;

      // Before clearing Sudowoodo
      const activeBefore = applyMapNpcStoryMutations('route_36', [sudoNpc], storyFlags);
      expect(activeBefore.length).toBe(1);
      expect(activeBefore[0].x).toBe(10); // Reset to originX
      expect(activeBefore[0].isMoving).toBe(false);

      // After clearing Sudowoodo
      storyFlags.add('sudowoodo_cleared');
      const activeAfter = applyMapNpcStoryMutations('route_36', [sudoNpc], storyFlags);
      expect(activeAfter.length).toBe(0);
    });

    it('enforces New Bark Town Rival peeking into Elm lab window only before Mystery Egg', () => {
      const rivalNpc = makeNpc('nbt_rival', 3, 4, 'UP', 'silver', '???', ['...']);

      // Before egg
      expect(applyMapNpcStoryMutations('new_bark_town', [rivalNpc], storyFlags).length).toBe(1);

      // After egg received
      storyFlags.add('HAS_MYSTERY_EGG');
      expect(applyMapNpcStoryMutations('new_bark_town', [rivalNpc], storyFlags).length).toBe(0);
    });

    it('enforces Guide Gent single presence (outside before Map Card, inside house after)', () => {
      const outsideGent = makeNpc('cg_guide_gent', 15, 8, 'DOWN', 'gramps', 'GUIDE GENT', ['Tour']);
      const insideGent = makeNpc('house_guide_gent', 4, 3, 'RIGHT', 'gramps', 'GUIDE GENT', ['Rest']);

      // Before Map Card
      expect(isNpcActiveForStoryFlags('cg_guide_gent', storyFlags)).toBe(true);
      expect(isNpcActiveForStoryFlags('house_guide_gent', storyFlags)).toBe(false);

      // After Map Card
      storyFlags.add('has_map_card');
      expect(isNpcActiveForStoryFlags('cg_guide_gent', storyFlags)).toBe(false);
      expect(isNpcActiveForStoryFlags('house_guide_gent', storyFlags)).toBe(true);
    });

    it('enforces Friday Lapras in Union Cave B2F with Friday toggle and capture flags', () => {
      const lapras = makeNpc('union_cave_lapras', 12, 14, 'DOWN', 'monster', 'LAPRAS', ['Awooo!']);

      // Non-Friday
      expect(applyMapNpcStoryMutations('union_cave_b2f', [lapras], storyFlags, undefined, false).length).toBe(0);

      // Friday, uncaptured
      expect(applyMapNpcStoryMutations('union_cave_b2f', [lapras], storyFlags, undefined, true).length).toBe(1);

      // Friday, already caught
      storyFlags.add('caught_lapras');
      expect(applyMapNpcStoryMutations('union_cave_b2f', [lapras], storyFlags, undefined, true).length).toBe(0);
    });

    it('preserves unherded Farfetchd position in Ilex Forest until returned to Charcoal Kiln', () => {
      const farfetchd = makeNpc('forest_farfetchd', 10, 10, 'DOWN', 'bird', 'FARFETCHD', ['Quaa!']);
      farfetchd.x = 18; // Chased to (18, 22) during mini-game
      farfetchd.y = 22;

      // While unherded, applyMapNpcStoryMutations must preserve its chase position
      const activeUnherded = applyMapNpcStoryMutations('ilex_forest', [farfetchd], storyFlags);
      expect(activeUnherded.length).toBe(1);
      expect(activeUnherded[0].x).toBe(18);
      expect(activeUnherded[0].y).toBe(22);

      // Once herded and HM01 Cut awarded, forest_farfetchd despawns and appears in Charcoal Kiln
      storyFlags.add('has_hm01_cut');
      const activeHerded = applyMapNpcStoryMutations('ilex_forest', [farfetchd], storyFlags);
      expect(activeHerded.length).toBe(0);
    });
  });

  describe('3. OverworldRenderer API & Transition Veil Invariant Contracts', () => {
    it('verifies OverworldRenderer exposes NPC lifecycle, preload, and observability signatures', async () => {
      const { OverworldRenderer } = await import('../src/render/OverworldRenderer');
      expect(typeof OverworldRenderer.prototype.setNpcLookup).toBe('function');
      expect(typeof OverworldRenderer.prototype.ensureMapNpcSpritesLoaded).toBe('function');
      expect(typeof OverworldRenderer.prototype.spawnMapNpcs).toBe('function');
      expect(typeof OverworldRenderer.prototype.evictDistantNpcSprites).toBe('function');
      expect(typeof OverworldRenderer.prototype.hasNpcSpriteLoaded).toBe('function');
      expect(typeof OverworldRenderer.prototype.hasSpawnedNpcSprite).toBe('function');
      expect(typeof OverworldRenderer.prototype.getSpawnedNpcSpriteCount).toBe('function');
    });

    it('verifies OverworldRenderer.ensureMapTilesLoaded preloads character sprite sheets into manifest', () => {
      const rendererSrc =
        fs.readFileSync(path.resolve(__dirname, '../src/render/OverworldRenderer.ts'), 'utf8') +
        '\n' +
        fs.readFileSync(path.resolve(__dirname, '../src/render/OverworldNpcAndItemSprites.ts'), 'utf8');

      // Verify ensureMapTilesLoaded collects NPC character sheets and queues them into manifest
      expect(rendererSrc).toContain('missingSpriteTypes');
      expect(rendererSrc).toContain("category: 'CHARACTER_SPRITE'");
      expect(rendererSrc).toContain('await this.ensureNpcSpriteLoaded(spriteType)');

      // Verify renderMap calls spawnMapNpcs synchronously
      expect(rendererSrc).toContain('this.spawnMapNpcs(undefined, lookupMap)');

      // Verify evictDistantTileTextures calls evictDistantNpcSprites
      expect(rendererSrc).toContain('this.evictDistantNpcSprites()');
    });

    it('verifies src/main.ts wires MapManager lifecycle callbacks and OverworldRenderer NPC lookup', () => {
      const transitionControllerPath = path.resolve(
        __dirname,
        '../src/world/OverworldWarpAndMapTransitionController.ts'
      );
      const mainSrc =
        fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8') +
        (fs.existsSync(transitionControllerPath)
          ? '\n' + fs.readFileSync(transitionControllerPath, 'utf8')
          : '');

      // Assert setNpcLifecycleCallbacks is registered
      expect(mainSrc).toContain('mapManager.setNpcLifecycleCallbacks');
      expect(mainSrc).toContain('overworldRenderer.setNpcLookup');
      expect(mainSrc).toContain('applyMapNpcStoryMutations');

      // Assert ensureMapTilesLoaded is strictly awaited before renderMap in doorway transitions
      const warpWording = mainSrc.indexOf('await overworldRenderer.ensureMapTilesLoaded(targetMap');
      const renderWording = mainSrc.indexOf('overworldRenderer.renderMap(targetMap');
      expect(warpWording).toBeGreaterThan(0);
      expect(renderWording).toBeGreaterThan(0);
      expect(warpWording).toBeLessThan(renderWording);
    });
  });
});
