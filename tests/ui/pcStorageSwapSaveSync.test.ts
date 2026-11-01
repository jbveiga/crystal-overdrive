import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../src/core/SaveManager';
import { SaveStateReconciler } from '../../src/core/SaveStateReconciler';
import { BoxManager, StorageManager } from '../../src/world/StorageManager';
import { BoxManagementUI } from '../../src/ui/BoxManagementUI';
import { installMockDomGlobals, resetDefaultContainers } from '../helpers/MockDomEnv';
import type { PokemonInstance } from '../../src/types/game';

describe('Single Source of Truth: Party & PC Storage Synchronization Invariants', () => {
  let saveManager: SaveManager;

  beforeEach(() => {
    const { doc } = installMockDomGlobals();
    resetDefaultContainers(doc);
    saveManager = new SaveManager();
  });

  const makePkmn = (id: string, speciesId: string, level: number, type: string): PokemonInstance => ({
    id,
    speciesId,
    level,
    currentHp: 100,
    types: [type as any],
    stats: { hp: 100, attack: 80, defense: 75, spAttack: 90, spDefense: 85, speed: 85 },
    moves: [{ id: 'tackle', moveId: 'tackle', pp: 35, maxPp: 35 }],
    ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
    evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  });

  it('shares a single BoxManager instance, preserves party array reference across Party-to-Party and Party-to-Box swaps, and omits flat box field from SaveData', async () => {
    const typhlosion = makePkmn('pkmn_typhlosion_1', 'typhlosion', 36, 'FIRE');
    const feraligatr = makePkmn('pkmn_feraligatr_2', 'feraligatr', 35, 'WATER');
    const ampharos = makePkmn('pkmn_ampharos_3', 'ampharos', 34, 'ELECTRIC');

    const outerParty: PokemonInstance[] = [typhlosion, feraligatr];
    const outerBoxManager = new BoxManager();
    outerBoxManager.getBox(0)!.pokemon[0] = ampharos;

    const boxUI = new BoxManagementUI();
    let saveCalls = 0;

    // Pass the authoritative BoxManager instance directly (zero cloning)
    boxUI.open(outerParty, outerBoxManager, {
      onSave: () => {
        saveCalls++;
      },
      onClose: () => {
        saveCalls++;
      },
    });

    // 1. Perform Party-to-Party reorder first (swap slot 0 and slot 1)
    // Previously this detached `this.party` from `outerParty` via `.filter()`
    boxUI.selectSlot('party', 0);
    boxUI.initiateMove();
    boxUI.selectSlot('party', 1);

    expect(outerParty[0].id).toBe('pkmn_feraligatr_2');
    expect(outerParty[1].id).toBe('pkmn_typhlosion_1');
    expect(saveCalls).toBe(1);

    // 2. Now swap Party slot 1 (Typhlosion) with Box 0 slot 0 (Ampharos)
    boxUI.selectSlot('party', 1);
    boxUI.initiateMove();
    boxUI.selectSlot('box', 0);

    // Both outerParty and outerBoxManager must immediately reflect the swap in-place
    expect(outerParty.map((p) => p.speciesId)).toEqual(['feraligatr', 'ampharos']);
    expect(outerBoxManager.getBox(0)!.pokemon[0]?.speciesId).toBe('typhlosion');
    expect(saveCalls).toBe(2);

    // 3. Switch active box tab -> should also auto-save currentBoxIndex
    boxUI.changeBox(1);
    expect(outerBoxManager.getCurrentBoxIndex()).toBe(1);
    expect(saveCalls).toBe(3);

    boxUI.close();
    expect(saveCalls).toBe(4);

    // 4. Create snapshot and verify flat `box` field is completely absent
    const snapshot = SaveStateReconciler.createSaveSnapshot({
      playTimeSeconds: 600,
      playerName: 'GOLD',
      playerGender: 'BOY',
      rivalName: 'SILVER',
      player: { x: 5, y: 5, direction: 'DOWN' },
      mapId: 'violet_poke_center',
      gameClock: { playerSpeed: 3, battleSpeed: 1 },
      inventory: { balls: {}, tms: [], money: 5000, badges: ['zephyr'] },
      playerParty: outerParty,
      boxManager: outerBoxManager,
      roamingManager: { getAllRoamers: () => [] },
      defeatedTrainers: new Set(),
      visitedMaps: new Set(['new_bark_town', 'violet_city']),
      storyFlags: new Set(),
      seenSpecies: new Set(['typhlosion', 'feraligatr', 'ampharos']),
      overworldItemManager: { getCollectedFlags: () => [], getHarvestedTreeIds: () => [], getFruitTreePicksRecord: () => ({}) },
      gameOptions: SaveManager.getDefaultOptions(),
      missionManager: { serialize: () => ({}) },
      dayCareManager: null,
      kurtCraftingManager: null,
      bugContestManager: null,
    });

    expect((snapshot as any).box).toBeUndefined();
    expect(snapshot.storage).toBeDefined();

    await saveManager.saveGame(snapshot);
    const restored = await saveManager.loadGame();

    expect((restored as any).box).toBeUndefined();
    expect(restored?.party.map((p) => p.speciesId)).toEqual(['feraligatr', 'ampharos']);
    expect(restored?.storage?.boxes[0].pokemon[0]?.speciesId).toBe('typhlosion');

    // 5. Hydrate into fresh party & boxManager and verify 1:1 conservation
    const hydratedParty: PokemonInstance[] = [];
    const hydratedBoxManager = new BoxManager();
    SaveStateReconciler.hydrateGameState(restored!, {
      playTimeSeconds: { val: 0 },
      playerName: { val: '' },
      playerGender: { val: 'BOY' },
      rivalName: { val: '' },
      playerParty: hydratedParty,
      boxManager: hydratedBoxManager,
      gameOptions: SaveManager.getDefaultOptions(),
      inventory: { balls: {}, tms: [], money: 0, badges: [] },
      defeatedTrainers: new Set(),
      storyFlags: new Set(),
      seenSpecies: new Set(),
      overworldItemManager: { setCollectedFlags: () => {}, setFruitTreePicks: () => {} },
      missionManager: { deserialize: () => {}, reconcileStarterState: () => {} },
      gameClock: { playerSpeed: 3, battleSpeed: 1 },
      roamingManager: { awakenBeasts: () => {}, sleepBeasts: () => {} },
    });

    expect(hydratedParty.map((p) => p.speciesId)).toEqual(['feraligatr', 'ampharos']);
    expect(hydratedBoxManager.getBox(0)!.pokemon[0]?.speciesId).toBe('typhlosion');
    expect(hydratedBoxManager.getCurrentBoxIndex()).toBe(1);
  });

  it('purges any duplicate Pokemon instance from storage.boxes if the same Pokemon ID already exists in party', () => {
    const lugia = makePkmn('unique_lugia_1', 'lugia', 45, 'PSYCHIC');
    const party: PokemonInstance[] = [lugia];
    const storage = StorageManager.createDefaultStorage();
    // Simulate a corrupted duplicate in Box 0 Slot 3 and Box 2 Slot 5
    storage.boxes[0].pokemon[3] = { ...lugia };
    storage.boxes[2].pokemon[5] = lugia;

    StorageManager.reconcilePartyAndStorageIntegrity(party, storage);

    expect(party).toHaveLength(1);
    expect(party[0].id).toBe('unique_lugia_1');
    expect(storage.boxes[0].pokemon[3]).toBeNull();
    expect(storage.boxes[2].pokemon[5]).toBeNull();
    expect(StorageManager.getTotalStoredCount(storage)).toBe(0);
  });
});
