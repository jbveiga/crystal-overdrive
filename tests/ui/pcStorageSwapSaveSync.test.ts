import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../src/core/SaveManager';
import { SaveStateReconciler } from '../../src/core/SaveStateReconciler';
import { BoxManager } from '../../src/world/StorageManager';
import { BoxManagementUI } from '../../src/ui/BoxManagementUI';
import { installMockDomGlobals, resetDefaultContainers } from '../helpers/MockDomEnv';
import type { PokemonInstance } from '../../src/types/game';

describe('PC Storage Swap & Save Synchronization Invariant', () => {
  let saveManager: SaveManager;

  beforeEach(() => {
    const { doc } = installMockDomGlobals();
    resetDefaultContainers(doc);
    saveManager = new SaveManager();
  });

  it('guarantees that swapping a Pokemon between party and PC box updates outer boxManager state and prevents duplication/disappearance on save', async () => {
    // 1. Create party with Typhlosion and a PC box with Ampharos in slot 0
    const partyPokemon: PokemonInstance = {
      id: 'party_typhlosion_1',
      speciesId: 'typhlosion',
      level: 36,
      currentHp: 120,
      types: ['FIRE'],
      stats: { hp: 120, attack: 80, defense: 75, spAttack: 100, spDefense: 85, speed: 95 },
      moves: [{ id: 'flamethrower', moveId: 'flamethrower', pp: 15, maxPp: 15 }],
      ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
      evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    };

    const boxPokemon: PokemonInstance = {
      id: 'box_ampharos_1',
      speciesId: 'ampharos',
      level: 34,
      currentHp: 110,
      types: ['ELECTRIC'],
      stats: { hp: 110, attack: 70, defense: 70, spAttack: 105, spDefense: 85, speed: 50 },
      moves: [{ id: 'thunderbolt', moveId: 'thunderbolt', pp: 15, maxPp: 15 }],
      ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
      evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    };

    const outerParty: PokemonInstance[] = [partyPokemon];
    const outerBoxManager = new BoxManager();
    // Put Ampharos in Box 0, Slot 0
    outerBoxManager.getBox(0)!.pokemon[0] = boxPokemon;

    // 2. Simulate opening BoxManagementUI with outerParty and outerBoxManager state
    const boxUI = new BoxManagementUI();

    let saveCalled = false;
    boxUI.open(outerParty, outerBoxManager.getState(), {
      onSave: (_updatedParty, updatedStorage) => {
        if (updatedStorage) outerBoxManager.setState(updatedStorage);
        saveCalled = true;
      },
      onClose: (_updatedParty, updatedStorage) => {
        if (updatedStorage) outerBoxManager.setState(updatedStorage);
        saveCalled = true;
      },
    });

    // 3. Perform swap in UI: select party slot 0, initiate move, select box 0 slot 0
    boxUI.selectSlot('party', 0);
    boxUI.initiateMove();
    boxUI.selectSlot('box', 0);

    // Assert that outerParty now has Ampharos
    expect(outerParty[0].speciesId).toBe('ampharos');

    // Close PC UI
    boxUI.close();
    expect(saveCalled).toBe(true);

    // 4. Assert that outerBoxManager now has Typhlosion in Box 0 Slot 0
    const updatedBoxSlot0 = outerBoxManager.getBox(0)!.pokemon[0];
    expect(updatedBoxSlot0).not.toBeNull();
    expect(updatedBoxSlot0?.speciesId).toBe('typhlosion');

    // 5. Create save snapshot and verify total instances across party and PC
    const snapshot = SaveStateReconciler.createSaveSnapshot({
      playTimeSeconds: 500,
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
      seenSpecies: new Set(['typhlosion', 'ampharos']),
      overworldItemManager: { getCollectedFlags: () => [], getHarvestedTreeIds: () => [], getFruitTreePicksRecord: () => ({}) },
      gameOptions: SaveManager.getDefaultOptions(),
      missionManager: { serialize: () => ({}) },
      dayCareManager: null,
      kurtCraftingManager: null,
      bugContestManager: null,
    });

    await saveManager.saveGame(snapshot);
    const restored = await saveManager.loadGame();

    // Verify restored party has exactly 1 Typhlosion / 1 Ampharos across party and storage
    expect(restored?.party).toHaveLength(1);
    expect(restored?.party[0].speciesId).toBe('ampharos');

    const restoredBox0Slot0 = restored?.storage?.boxes[0].pokemon[0];
    expect(restoredBox0Slot0?.speciesId).toBe('typhlosion');

    // Count species occurrences in saved snapshot to strictly rule out duplication or loss
    const allSavedPokemon = [
      ...restored!.party,
      ...(restored!.storage?.boxes.flatMap((b) => b.pokemon.filter(Boolean)) || []),
    ];

    const typhlosionCount = allSavedPokemon.filter((p) => p?.speciesId === 'typhlosion').length;
    const ampharosCount = allSavedPokemon.filter((p) => p?.speciesId === 'ampharos').length;

    expect(typhlosionCount).toBe(1);
    expect(ampharosCount).toBe(1);
  });
});
