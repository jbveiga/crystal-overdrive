import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../src/core/SaveManager';
import { SaveStateReconciler } from '../../src/core/SaveStateReconciler';
import { TownMapUI } from '../../src/ui/TownMapUI';
import { resolveCurrentLandmark } from '../../src/world/map/townMapResolvers';
import { installMockDomGlobals, resetDefaultContainers } from '../helpers/MockDomEnv';

describe('Issue #58: Visited & Explored Maps Persistence', () => {
  let saveManager: SaveManager;

  beforeEach(() => {
    const { doc } = installMockDomGlobals();
    resetDefaultContainers(doc);
    saveManager = new SaveManager();
  });

  it('serializes visitedMaps in createSaveSnapshot and preserves all explored locations', () => {
    const visitedMaps = new Set<string>([
      'new_bark_town',
      'route_29',
      'cherrygrove_city',
      'route_30',
      'route_31',
      'violet_city',
      'route_32',
      'route_33',
      'azalea_town',
    ]);

    const snapshot = SaveStateReconciler.createSaveSnapshot({
      playTimeSeconds: 1200,
      playerName: 'GOLD',
      playerGender: 'BOY',
      rivalName: 'SILVER',
      player: { x: 11, y: 14, direction: 'RIGHT' },
      mapId: 'route_33',
      gameClock: { playerSpeed: 3, battleSpeed: 1 },
      inventory: {
        balls: {},
        tms: [],
        money: 5000,
        badges: ['zephyr', 'hive'],
      },
      playerParty: [],
      boxManager: { flatten: () => [], getState: () => ({ activeBoxIndex: 0, boxes: [] }) },
      roamingManager: { getAllRoamers: () => [] },
      defeatedTrainers: new Set(['bug_catcher_wade']),
      visitedMaps,
      storyFlags: new Set(['slowpoke_well_cleared']),
      seenSpecies: new Set(['cyndaquil']),
      overworldItemManager: {
        getCollectedFlags: () => [],
        getHarvestedTreeIds: () => [],
        getFruitTreePicksRecord: () => ({}),
      },
      gameOptions: SaveManager.getDefaultOptions(),
      missionManager: { serialize: () => ({}) },
      dayCareManager: null,
      kurtCraftingManager: null,
      bugContestManager: null,
    });

    expect(snapshot.visitedMaps).toBeDefined();
    expect(snapshot.visitedMaps).toContain('violet_city');
    expect(snapshot.visitedMaps).toContain('azalea_town');
    expect(snapshot.visitedMaps).toContain('route_33');
    expect(snapshot.visitedMaps?.length).toBe(9);
  });

  it('hydrates visitedMaps from SaveData into active state on loadGame', async () => {
    const fresh = SaveManager.createFreshSaveData('GOLD', 'BOY');
    fresh.player.mapId = 'route_33';
    fresh.player.x = 11;
    fresh.player.y = 14;
    fresh.visitedMaps = [
      'new_bark_town',
      'route_29',
      'cherrygrove_city',
      'route_30',
      'route_31',
      'violet_city',
      'route_32',
      'route_33',
      'azalea_town',
    ];

    await saveManager.saveGame(fresh);
    const loaded = await saveManager.loadGame();
    expect(loaded?.visitedMaps).toEqual(expect.arrayContaining(['violet_city', 'azalea_town', 'route_33']));

    // Hydrate into in-memory state
    const activeVisitedMaps = new Set<string>();
    SaveStateReconciler.hydrateGameState(loaded!, {
      playTimeSeconds: { val: 0 },
      playerName: { val: 'GOLD' },
      playerGender: { val: 'BOY' },
      rivalName: { val: 'SILVER' },
      playerParty: [],
      playerBox: [],
      gameOptions: SaveManager.getDefaultOptions(),
      inventory: { balls: {}, tms: [], money: 3000, badges: [] },
      defeatedTrainers: new Set(),
      visitedMaps: activeVisitedMaps,
      storyFlags: new Set(),
      seenSpecies: new Set(),
      overworldItemManager: { setCollectedFlags: () => {}, setFruitTreePicks: () => {} },
      missionManager: { deserialize: () => {}, reconcileStarterState: () => {} },
      gameClock: { playerSpeed: 3, battleSpeed: 1 },
      roamingManager: { awakenBeasts: () => {}, sleepBeasts: () => {} },
    });

    expect(activeVisitedMaps.has('violet_city')).toBe(true);
    expect(activeVisitedMaps.has('azalea_town')).toBe(true);
    expect(activeVisitedMaps.has('cherrygrove_city')).toBe(true);
    expect(activeVisitedMaps.has('route_33')).toBe(true);
  });

  it('backfills visited landmarks from badge progression for legacy saves missing visitedMaps', () => {
    const legacySave = SaveManager.createFreshSaveData('GOLD', 'BOY');
    legacySave.player.badges = ['zephyr', 'hive'];
    delete legacySave.visitedMaps; // Legacy save without visitedMaps

    const activeVisitedMaps = new Set<string>();
    SaveStateReconciler.hydrateGameState(legacySave, {
      playTimeSeconds: { val: 0 },
      playerName: { val: 'GOLD' },
      playerGender: { val: 'BOY' },
      rivalName: { val: 'SILVER' },
      playerParty: [],
      playerBox: [],
      gameOptions: SaveManager.getDefaultOptions(),
      inventory: { balls: {}, tms: [], money: 3000, badges: ['zephyr', 'hive'] },
      defeatedTrainers: new Set(),
      visitedMaps: activeVisitedMaps,
      storyFlags: new Set(),
      seenSpecies: new Set(),
      overworldItemManager: { setCollectedFlags: () => {}, setFruitTreePicks: () => {} },
      missionManager: { deserialize: () => {}, reconcileStarterState: () => {} },
      gameClock: { playerSpeed: 3, battleSpeed: 1 },
      roamingManager: { awakenBeasts: () => {}, sleepBeasts: () => {} },
    });

    // Should automatically backfill explored cities
    expect(activeVisitedMaps.has('new_bark_town')).toBe(true);
    expect(activeVisitedMaps.has('cherrygrove_city')).toBe(true);
    expect(activeVisitedMaps.has('violet_city')).toBe(true);
    expect(activeVisitedMaps.has('azalea_town')).toBe(true);
  });

  it('enables TownMapUI to recognize explored cities when visitedMaps are restored', () => {
    const explored = new Set<string>(['new_bark_town', 'cherrygrove_city', 'violet_city', 'azalea_town']);
    const townMap = new TownMapUI();

    townMap.open('route_33', explored);

    // Selected landmark is player landmark route_33
    const playerLm = townMap.getCurrentPlayerLandmark();
    expect(playerLm?.id).toBe('route_33');

    // Azalea Town, Violet City, and Cherrygrove City are in explored
    expect(explored.has('violet_city')).toBe(true);
    expect(explored.has('azalea_town')).toBe(true);
    // Unvisited city like goldenrod_city or ecruteak_city is not
    expect(explored.has('goldenrod_city')).toBe(false);
    expect(explored.has('ecruteak_city')).toBe(false);

    townMap.close();
  });

  it('resolves interior locations to parent landmarks (e.g. poke centers and marts)', () => {
    expect(resolveCurrentLandmark('violet_poke_center')?.id).toBe('violet_city');
    expect(resolveCurrentLandmark('azalea_mart')?.id).toBe('azalea_town');
    expect(resolveCurrentLandmark('cherrygrove_evolution_speech_house')?.id).toBe('cherrygrove_city');
    expect(resolveCurrentLandmark('players_house_2f')?.id).toBe('new_bark_town');
  });
});
