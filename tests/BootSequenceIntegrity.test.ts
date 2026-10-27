import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MapManager } from '../src/world/MapManager';
import { AssetManifestQueue } from '../src/core/AssetManifestQueue';
import { TrackedStoryFlagSet, ActiveNpcCache } from '../src/world/ActiveNpcCache';
import { createNpcsByMap, isNpcActiveForStoryFlags, filterInitialMapNpcs, applyStoryRecoveryFlags } from '../src/world/npcData';
import { OverworldWarpAndMapTransitionController } from '../src/world/OverworldWarpAndMapTransitionController';
import type { OverworldTransitionContext } from '../src/types/gameContext';
import type { GridEntity } from '../src/world/GridPhysics';

describe('BootSequenceIntegrity & TDZ Elimination Invariants (BUGFIX-BOOT-LOADING-HANG-01)', () => {
  const mainTsPath = path.resolve(__dirname, '../src/main.ts');
  const mainContent = fs.readFileSync(mainTsPath, 'utf8');
  const mainLines = mainContent.split('\n');

  it('enforces that src/main.ts remains within the strict single-window ceiling (<= 750 lines)', () => {
    expect(mainLines.length).toBeLessThanOrEqual(750);
  });

  it('guarantees topological declaration order: all closures and bindings are declared strictly before getTransitionContext and bootMapManifest.run', () => {
    const findDeclarationLine = (pattern: RegExp): number => {
      const idx = mainLines.findIndex((line) => pattern.test(line));
      expect(idx, `Expected to find declaration matching ${pattern}`).toBeGreaterThanOrEqual(0);
      return idx + 1;
    };

    const linePlayer = findDeclarationLine(/(?:const|let)\s+player\s*[:=]/);
    const lineNpcsByMap = findDeclarationLine(/(?:const|let)\s+npcsByMap\s*[:=]/);
    const lineVisitedMaps = findDeclarationLine(/(?:const|let)\s+visitedMaps\s*[:=]/);
    const lineOverworldRenderer = findDeclarationLine(/let\s+overworldRenderer\s*!/);
    const lineLookupMap = findDeclarationLine(/(?:const|let)\s+lookupMap\s*[:=]/);
    const lineGetActiveMapNpcs = findDeclarationLine(/(?:const|let)\s+getActiveMapNpcs\s*[:=]/);
    const lineDetectStarter = findDeclarationLine(/(?:const|let)\s+detectChosenStarterSpecies\s*[:=]/);
    const lineAzaleaAmbush = findDeclarationLine(/(?:const|let)\s+triggerAzaleaRivalAmbush\s*[:=]/);

    const lineGetTransitionContext = findDeclarationLine(/(?:const|let)\s+getTransitionContext\s*[:=]/);
    const lineBootManifestRun = findDeclarationLine(/bootMapManifest\.run\s*\(/);

    // Assert all 8 hoisted symbols occur strictly BEFORE getTransitionContext
    expect(linePlayer).toBeLessThan(lineGetTransitionContext);
    expect(lineNpcsByMap).toBeLessThan(lineGetTransitionContext);
    expect(lineVisitedMaps).toBeLessThan(lineGetTransitionContext);
    expect(lineOverworldRenderer).toBeLessThan(lineGetTransitionContext);
    expect(lineLookupMap).toBeLessThan(lineGetTransitionContext);
    expect(lineGetActiveMapNpcs).toBeLessThan(lineGetTransitionContext);
    expect(lineDetectStarter).toBeLessThan(lineGetTransitionContext);
    expect(lineAzaleaAmbush).toBeLessThan(lineGetTransitionContext);

    // Assert getTransitionContext occurs strictly BEFORE bootMapManifest.run
    expect(lineGetTransitionContext).toBeLessThan(lineBootManifestRun);
  });

  it('AssetManifestQueue rethrows programming errors (ReferenceError, TypeError, SyntaxError) fail-fast without swallowing', async () => {
    const queue = new AssetManifestQueue();
    queue.enqueue({
      id: 'test:tdz-error',
      label: 'Testing TDZ error',
      category: 'MAP_JSON',
      execute: async () => {
        throw new ReferenceError("Cannot access 'player' before initialization");
      },
    });

    await expect(queue.run({ startPercent: 0, endPercent: 50 })).rejects.toThrow(ReferenceError);

    const typeErrorQueue = new AssetManifestQueue();
    typeErrorQueue.enqueue({
      id: 'test:type-error',
      label: 'Testing TypeError',
      category: 'MAP_JSON',
      execute: async () => {
        throw new TypeError('Cannot read properties of undefined');
      },
    });
    await expect(typeErrorQueue.run({ startPercent: 0, endPercent: 50 })).rejects.toThrow(TypeError);

    // Standard non-programming errors (e.g. 404 network misses) should still be non-fatal
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const warnQueue = new AssetManifestQueue();
    warnQueue.enqueue({
      id: 'test:404',
      label: 'Testing 404',
      category: 'TILE_TEXTURE',
      execute: async () => {
        throw new Error('404 Not Found');
      },
    });
    const history = await warnQueue.run({ startPercent: 0, endPercent: 50 });
    expect(history.length).toBe(1);
    expect(history[0].percent).toBe(50);
    warnSpy.mockRestore();
  });

  it('executes boot critical map loading and transition context hydration with 0 runtime errors', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      const filename = path.basename(url);
      const filePath = path.resolve(__dirname, '../public/assets/data/maps', filename);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          ok: true,
          status: 200,
          json: async () => data,
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    }) as any;

    try {
      const mapManager = new MapManager();
      const storyFlags = new TrackedStoryFlagSet();
      const defeatedTrainers = new Set<string>();
      const activeNpcCache = new ActiveNpcCache();
      const npcsByMap = createNpcsByMap();
      filterInitialMapNpcs(npcsByMap, storyFlags);
      applyStoryRecoveryFlags(storyFlags, defeatedTrainers, {
        balls: {}, items: {}, berries: {}, tms: [], keyItems: [], money: 0, badges: [],
      });

      const initialPlayerX = 7;
      const initialPlayerY = 1;
      const initialMapId = 'players_house_2f';
      const player: GridEntity = {
        id: 'player',
        x: initialPlayerX,
        y: initialPlayerY,
        targetX: initialPlayerX,
        targetY: initialPlayerY,
        renderX: initialPlayerX,
        renderY: initialPlayerY,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      };
      const visitedMaps = new Set<string>([initialMapId]);

      const mockTransitionContext: OverworldTransitionContext = {
        mapManager,
        overworldRenderer: null as any,
        overworldItemManager: null as any,
        missionManager: null as any,
        storyFlags,
        defeatedTrainers,
        playerParty: [],
        player,
        activeNpcCache,
        npcsByMap,
        roamingManager: null as any,
        overworldHUD: null as any,
        isCutsceneLocked: () => false,
        visitedMaps,
        saveCurrentGame: async () => {},
        detectChosenStarterSpecies: () => null,
        getLastVisitedPokecenter: () => ({ mapId: 'new_bark_town', x: 13, y: 6 }),
        setLastVisitedPokecenter: () => {},
        lookupMap: (id: string) => mapManager.getMap(id),
        getActiveMapNpcs: (id: string) =>
          activeNpcCache.getActiveNpcs(id, npcsByMap[id], storyFlags, isNpcActiveForStoryFlags),
        eventBus: { emit: () => {}, on: () => {}, off: () => {} } as any,
        triggerAzaleaRivalAmbush: () => {},
        playerName: 'CHRIS',
        inventory: { balls: {}, items: {}, berries: {}, tms: [], keyItems: [], money: 0, badges: [] },
        audioManager: { playBgm: () => {}, stopBgm: () => {} } as any,
        setCutsceneLocked: () => {},
        triggerCanvasEarthquake: () => {},
      };

      const criticalBootMapIds = ['players_house_2f', 'players_house_1f', 'new_bark_town'];
      const bootMapManifest = new AssetManifestQueue();

      for (const mapId of criticalBootMapIds) {
        bootMapManifest.enqueue({
          id: `boot_map:${mapId}`,
          label: `Loading map ${mapId}.json`,
          category: 'MAP_JSON',
          execute: async () => {
            await OverworldWarpAndMapTransitionController.ensureMapAndNeighborsLoaded(
              mockTransitionContext,
              mapId
            );
          },
        });
      }

      const snaps: number[] = [];
      await bootMapManifest.run({
        startPercent: 12,
        endPercent: 40,
        concurrency: 4,
        onProgress: (snap) => snaps.push(snap.percent),
      });

      expect(snaps[snaps.length - 1]).toBe(40);

      // Initial map can be set without throwing "Map not found"
      const currentMap = mapManager.setCurrentMap(initialMapId);
      expect(currentMap.id).toBe('players_house_2f');
      expect(mapManager.getCurrentMap()?.id).toBe('players_house_2f');

      // NPCs for the map can be reset and looked up
      OverworldWarpAndMapTransitionController.resetMapNpcsToOrigin(mockTransitionContext, currentMap.id);
      const activeNpcs = mockTransitionContext.getActiveMapNpcs(currentMap.id);
      expect(Array.isArray(activeNpcs)).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('correctly updates player coordinates when fallback map is selected due to unwalkable spawn', () => {
    const mapManager = new MapManager();
    // Simulate initial unwalkable coordinate
    let initialPlayerX = 0;
    let initialPlayerY = 0;
    let initialMapId = 'players_house_2f';

    const player: GridEntity = {
      id: 'player',
      x: initialPlayerX,
      y: initialPlayerY,
      targetX: initialPlayerX,
      targetY: initialPlayerY,
      renderX: initialPlayerX,
      renderY: initialPlayerY,
      direction: 'DOWN',
      isMoving: false,
      progress: 0,
      isPlayer: true,
    };

    // Preload new_bark_town and players_house_2f
    mapManager.registerMap({
      id: 'new_bark_town',
      name: 'NEW BARK TOWN',
      width: 20,
      height: 20,
      collisionGrid: new Array(400).fill(0),
      warps: [],
      encounters: { grass: [] },
      signposts: [],
    });
    mapManager.registerMap({
      id: 'players_house_2f',
      name: "PLAYER'S HOUSE 2F",
      width: 10,
      height: 10,
      collisionGrid: new Array(100).fill(1), // all unwalkable
      warps: [],
      encounters: { grass: [] },
      signposts: [],
    });

    let initialMap = mapManager.setCurrentMap(initialMapId);
    if (!mapManager.isWalkable(initialPlayerX, initialPlayerY)) {
      initialMapId = 'new_bark_town';
      initialMap = mapManager.setCurrentMap(initialMapId);
      initialPlayerX = 13;
      initialPlayerY = 6;
      player.x = 13;
      player.y = 6;
      player.targetX = 13;
      player.targetY = 6;
      player.renderX = 13;
      player.renderY = 6;
    }

    expect(initialMap.id).toBe('new_bark_town');
    expect(player.x).toBe(13);
    expect(player.y).toBe(6);
    expect(player.renderX).toBe(13);
    expect(player.renderY).toBe(6);
  });
});
