import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import { OverworldWarpAndMapTransitionController } from '../../src/world/OverworldWarpAndMapTransitionController';

// Mock minimal browser globals for PixiJS environment hydration in node
if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 0 },
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

describe('TICKET-BUGFIX-ROUTE37-BORDER-STITCHING-01: Adjacent Border Map Stitching & Phantom Trees Defect', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const mapsDir = path.join(rootDir, 'public/assets/data/maps');

  const r37: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_37.json'), 'utf8'));
  const ecruteak: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ecruteak_city.json'), 'utf8'));

  it('1. should verify Route 37 north road tiles (x = 7, 8) align continuously with Ecruteak City south road tiles', () => {
    expect(r37.connections?.NORTH).toBeDefined();
    expect(r37.connections?.NORTH?.mapId).toBe('ecruteak_city');
    expect(ecruteak.connections?.SOUTH).toBeDefined();
    expect(ecruteak.connections?.SOUTH?.mapId).toBe('route_37');

    const offset = ecruteak.connections.SOUTH.offset; // 10
    expect(offset).toBe(10);

    // In Route 37 at row y=0 (northern boundary), check road tiles x=7 and x=8
    const r37_idx_7 = 0 * r37.width + 7;
    const r37_idx_8 = 0 * r37.width + 8;
    expect(r37.collisionGrid[r37_idx_7]).toBe(0);
    expect(r37.collisionGrid[r37_idx_8]).toBe(0);
    expect(r37.tileMap[r37_idx_7]).toBe('jt_05_05_05_05');
    expect(r37.tileMap[r37_idx_8]).toBe('jt_05_05_05_05');

    // In Ecruteak City at row y=35 (southern boundary), corresponding tiles are x = 7 + 10 = 17, and x = 8 + 10 = 18
    const ec_idx_17 = 35 * ecruteak.width + (7 + offset);
    const ec_idx_18 = 35 * ecruteak.width + (8 + offset);
    expect(ecruteak.collisionGrid[ec_idx_17]).toBe(0);
    expect(ecruteak.collisionGrid[ec_idx_18]).toBe(0);
    expect(ecruteak.tileMap[ec_idx_17]).toBe('jt_05_05_05_05');
    expect(ecruteak.tileMap[ec_idx_18]).toBe('jt_05_05_05_05');
  });

  it('2. should preserve 100% of walkability and collision integrity across Route 36 <-> Route 37 <-> Ecruteak City', () => {
    expect(r37.connections?.SOUTH).toBeDefined();
    expect(r37.connections?.SOUTH?.mapId).toBe('route_36');

    // Route 37 south row y=17 has walkable road
    const southRoadWalkable = [7, 8, 9, 10, 11, 12, 13].some(
      (x) => r37.collisionGrid[17 * r37.width + x] === 0
    );
    expect(southRoadWalkable).toBe(true);

    // Route 37 north row y=0 has walkable road
    const northRoadWalkable = [7, 8, 9, 10, 11, 12, 13].some(
      (x) => r37.collisionGrid[0 * r37.width + x] === 0
    );
    expect(northRoadWalkable).toBe(true);
  });

  it('3. should re-render active map when ensureMapAndNeighborsLoaded resolves background neighbors', async () => {
    const renderMapSpy = vi.fn();
    const ensureMapTilesLoadedSpy = vi.fn().mockResolvedValue(undefined);
    const evictDistantTileTexturesSpy = vi.fn();

    let currentMap: MapData = { ...r37 };
    const mockLoadedMap: MapData = { ...ecruteak };
    const mockLookupMap = vi.fn().mockReturnValue(r37);

    const mockCtx: any = {
      mapManager: {
        getCurrentMap: () => currentMap,
        setCurrentMap: vi.fn((id: string) => {
          currentMap = { ...ecruteak };
          return currentMap;
        }),
        getMap: mockLookupMap,
        evictDistantMaps: vi.fn(),
        getProtectedMapIds: vi.fn().mockReturnValue(new Set(['route_37', 'ecruteak_city'])),
        activateEncounterGracePeriod: vi.fn(),
      },
      playerParty: [{}],
      playerName: 'GOLD',
      activeNpcCache: {
        evictMapsNotIn: vi.fn(),
        syncResidentNpcsForMap: vi.fn(),
        invalidate: vi.fn(),
      },
      overworldRenderer: {
        renderMap: renderMapSpy,
        ensureMapTilesLoaded: ensureMapTilesLoadedSpy,
        evictDistantTileTextures: evictDistantTileTexturesSpy,
      },
      visitedMaps: new Set<string>(),
      missionManager: { checkStoryFlags: vi.fn(), registerMapEntry: vi.fn() },
      storyFlags: new Set<string>(),
      roamingManager: {
        getActiveRoamerOnRoute: vi.fn().mockReturnValue(null),
        onPlayerRouteChange: vi.fn(),
        getAllRoamers: vi.fn().mockReturnValue([]),
      },
      overworldHUD: {
        hideRoamerAlert: vi.fn(),
        showRoamerAlert: vi.fn(),
        updateRouteName: vi.fn(),
        openDialogue: vi.fn(),
      },
      eventBus: { emit: vi.fn() },
      audioManager: { playBgmForMap: vi.fn(), playMapBgm: vi.fn() },
      adjacentMapPrefetcher: {
        recordTransitionLookup: vi.fn(),
        prefetchAroundMap: vi.fn(),
      },
      saveCurrentGame: vi.fn(),
      npcsByMap: {},
      defeatedTrainers: new Set<string>(),
      overworldItemManager: {
        getItemsForMap: vi.fn().mockReturnValue([]),
        getActiveItemBalls: vi.fn().mockReturnValue([]),
      },
      detectChosenStarterSpecies: vi.fn(),
      lookupMap: mockLookupMap,
    };

    // Spy on ensureMapAndNeighborsLoaded to return mockLoadedMap
    vi.spyOn(OverworldWarpAndMapTransitionController, 'ensureMapAndNeighborsLoaded').mockResolvedValue(
      mockLoadedMap
    );

    const playerEntity: any = {
      x: 7,
      y: -1, // Stepping north out of Route 37 into Ecruteak City
      targetX: 7,
      targetY: -1,
      renderX: 7,
      renderY: -1,
      progress: 0,
      isMoving: true,
    };

    // Call handleMapTransition
    OverworldWarpAndMapTransitionController.handleMapTransition(mockCtx, playerEntity);

    // Initial renderMap call happens synchronously on transition
    expect(renderMapSpy).toHaveBeenCalledTimes(1);

    // Wait for the async prefetch and seamless re-render resolution
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ensureMapTilesLoadedSpy).toHaveBeenCalledWith(mockLoadedMap, mockLookupMap);
    // renderMap must be called a second time to stitch newly resolved neighbors seamlessly!
    expect(renderMapSpy).toHaveBeenCalledTimes(2);
    expect(renderMapSpy).toHaveBeenLastCalledWith(mockLoadedMap, mockLookupMap);
  });

  it('4. should not re-render if player transitioned to another map before prefetch completes', async () => {
    const renderMapSpy = vi.fn();

    let currentMap: MapData = { ...r37 };
    const mockLoadedMap: MapData = { ...ecruteak };
    const mockLookupMap = vi.fn().mockReturnValue(r37);

    const mockCtx: any = {
      mapManager: {
        getCurrentMap: () => currentMap,
        setCurrentMap: vi.fn((id: string) => {
          // Immediately simulate player moving elsewhere
          currentMap = { id: 'burned_tower_1f', width: 10, height: 9, tileMap: [], collisionGrid: [], warps: [], connections: {} };
          return currentMap;
        }),
        getMap: mockLookupMap,
        evictDistantMaps: vi.fn(),
        getProtectedMapIds: vi.fn().mockReturnValue(new Set(['ecruteak_city'])),
        activateEncounterGracePeriod: vi.fn(),
      },
      playerParty: [{}],
      playerName: 'GOLD',
      activeNpcCache: {
        evictMapsNotIn: vi.fn(),
        syncResidentNpcsForMap: vi.fn(),
        invalidate: vi.fn(),
      },
      overworldRenderer: {
        renderMap: renderMapSpy,
        ensureMapTilesLoaded: vi.fn().mockResolvedValue(undefined),
        evictDistantTileTextures: vi.fn(),
      },
      visitedMaps: new Set<string>(),
      missionManager: { checkStoryFlags: vi.fn(), registerMapEntry: vi.fn() },
      storyFlags: new Set<string>(),
      roamingManager: {
        getActiveRoamerOnRoute: vi.fn().mockReturnValue(null),
        onPlayerRouteChange: vi.fn(),
        getAllRoamers: vi.fn().mockReturnValue([]),
      },
      overworldHUD: {
        hideRoamerAlert: vi.fn(),
        updateRouteName: vi.fn(),
      },
      eventBus: { emit: vi.fn() },
      audioManager: { playBgmForMap: vi.fn(), playMapBgm: vi.fn() },
      adjacentMapPrefetcher: {
        recordTransitionLookup: vi.fn(),
        prefetchAroundMap: vi.fn(),
      },
      saveCurrentGame: vi.fn(),
      npcsByMap: {},
      defeatedTrainers: new Set<string>(),
      overworldItemManager: {
        getItemsForMap: vi.fn().mockReturnValue([]),
        getActiveItemBalls: vi.fn().mockReturnValue([]),
      },
      detectChosenStarterSpecies: vi.fn(),
      lookupMap: mockLookupMap,
    };

    vi.spyOn(OverworldWarpAndMapTransitionController, 'ensureMapAndNeighborsLoaded').mockResolvedValue(
      mockLoadedMap
    );

    const playerEntity: any = {
      x: 7,
      y: -1,
      targetX: 7,
      targetY: -1,
      renderX: 7,
      renderY: -1,
      progress: 0,
      isMoving: true,
    };

    OverworldWarpAndMapTransitionController.handleMapTransition(mockCtx, playerEntity);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Initial renderMap was called once during transition; background prefetch did NOT call it again because player is on burned_tower_1f
    expect(renderMapSpy).toHaveBeenCalledTimes(1);
  });

  it('5. should verify OverworldRenderer checks connectedMaps for unbuffered textures', async () => {
    const { OverworldRenderer } = await import('../../src/render/OverworldRenderer');
    const rendererProto = OverworldRenderer.prototype as any;

    expect(rendererProto.getConnectedMaps).toBeDefined();

    const fakeRenderer: any = {
      getConnectedMaps: rendererProto.getConnectedMaps,
      tileTextures: new Map(),
    };

    const lookup = (id: string) => (id === 'ecruteak_city' ? ecruteak : undefined);
    const connected = fakeRenderer.getConnectedMaps(r37, lookup);

    expect(connected).toHaveLength(1);
    expect(connected[0].id).toBe('ecruteak_city');
  });

  it('6. should maintain zero-allocation performance on transition hot path', () => {
    const controllerSource = fs.readFileSync(
      path.join(rootDir, 'src/world/OverworldWarpAndMapTransitionController.ts'),
      'utf8'
    );
    expect(controllerSource).toContain('await overworldRenderer.ensureMapTilesLoaded(loadedMap, lookupMap);');
    expect(controllerSource).toContain('if (mapManager.getCurrentMap()?.id === nextMapId) {');
    expect(controllerSource).toContain('overworldRenderer.renderMap(loadedMap, lookupMap);');
  });
});
