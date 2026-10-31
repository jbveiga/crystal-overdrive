/**
 * @fileoverview SaveStateReconciler — Hydrates loaded SaveData into active world/party state and builds save snapshots.
 * @module core/SaveStateReconciler
 * @role Save State Hydration & Snapshot Builder
 * @exports SaveStateReconciler
 * @layer core
 * @sections L1-20: Micro-Header & Imports | L21-130: Game State Hydration | L131-235: Save Snapshot Builder
 */

import { openDB, type IDBPDatabase } from 'idb';
import type {
  PokemonInstance,
  RoamerState,
  SpeedMultiplier,
  Direction,
  PokeballId,
  MedicineId,
  PlayerGender,
  GameOptions,
  SavePreview,
  SerializedMissionState,
  PokemonStorageState,
} from '../types/game';
import { StorageManager } from '../world/StorageManager';
import type { DayCareState } from '../world/DayCareManager';
import { deduplicateAndSortTms } from '../ui/bag/BagItemCatalogs';
import type { KurtCraftingOrder } from '../world/KurtCraftingManager';
import type { BugContestLeaderboardEntry } from '../world/BugContestManager';
import { SaveManager, type SaveData } from './SaveManager';

export class SaveStateReconciler {
  public static hydrateGameState(
    existingSave: SaveData,
    state: {
      playTimeSeconds: { val: number };
      playerName: { val: string };
      playerGender: { val: PlayerGender };
      rivalName: { val: string };
      playerParty: PokemonInstance[];
      playerBox: PokemonInstance[];
      gameOptions: GameOptions;
      inventory: {
        balls: Partial<Record<PokeballId, number>>;
        items?: Partial<Record<MedicineId, number>>;
        berries?: Partial<Record<string, number>>;
        keyItems?: string[];
        tms: string[];
        money: number;
        badges: string[];
      };
      defeatedTrainers: Set<string>;
      storyFlags: Set<string>;
      seenSpecies: Set<string>; caughtSpecies?: Set<string>;
      overworldItemManager: any;
      missionManager: any;
      gameClock: any;
      roamingManager: any;
    }
  ): {
    mapId: string;
    x: number;
    y: number;
    direction: Direction;
    lastVisitedPokecenter: { mapId: string; x: number; y: number };
  } {
    state.playTimeSeconds.val = existingSave.playTimeSeconds || 0;
    state.playerName.val = existingSave.player.name || 'GOLD';
    state.playerGender.val = existingSave.player.gender || 'BOY';
    state.rivalName.val = existingSave.player.rivalName || existingSave.rivalName || 'SILVER';
    const validParty = (existingSave.party || []).filter((p) => p && typeof p === 'object');
    const validBox = (existingSave.box || []).filter((p) => p && typeof p === 'object');
    state.playerParty.splice(0, state.playerParty.length, ...validParty);
    state.playerBox.splice(0, state.playerBox.length, ...validBox);
    const normalizedOpts = SaveManager.normalizeOptions(existingSave.options, existingSave.player);
    Object.assign(state.gameOptions, normalizedOpts);
    state.inventory.balls = existingSave.inventory?.balls || {};
    state.inventory.items = existingSave.inventory?.items || {};
    state.inventory.berries = existingSave.inventory?.berries || {};
    if (existingSave.inventory?.keyItems) state.inventory.keyItems = existingSave.inventory.keyItems;
    state.inventory.tms = existingSave.inventory?.tms || [];
    state.inventory.money = existingSave.player.money ?? 3000;
    state.inventory.badges = existingSave.player.badges || [];
    existingSave.defeatedTrainers?.forEach((t) => state.defeatedTrainers.add(t));
    existingSave.storyFlags?.forEach((f) => state.storyFlags.add(f));
    existingSave.seenSpecies?.forEach((s) => state.seenSpecies.add(s));
    if (state.caughtSpecies) existingSave.caughtSpecies?.forEach((s) => state.caughtSpecies!.add(s));
    state.playerParty.forEach((p) => { if (p && p.speciesId) state.seenSpecies.add(p.speciesId); });
    state.playerBox.forEach((p) => { if (p && p.speciesId) state.seenSpecies.add(p.speciesId); });

    state.overworldItemManager.setCollectedFlags([
      ...(existingSave.collectedItems || []),
      ...(existingSave.collectedItemFlags || []),
      ...Array.from(state.storyFlags),
    ]);
    state.overworldItemManager.setFruitTreePicks(
      existingSave.fruitTreePicks || existingSave.harvestedFruitTrees || {}
    );
    state.missionManager.deserialize(existingSave.missions);
    state.missionManager.reconcileStarterState(state.playerParty, state.storyFlags);

    const initialMapId = existingSave.player.mapId || 'new_bark_town';
    const initialPlayerX = existingSave.player.x ?? 7;
    const initialPlayerY = existingSave.player.y ?? 1;
    const initialPlayerDir = existingSave.player.direction || 'DOWN';
    let lastVisitedPokecenter = { mapId: 'new_bark_town', x: 13, y: 6 };
    if (initialMapId.endsWith('_poke_center')) {
      lastVisitedPokecenter = { mapId: initialMapId, x: 3, y: 3 };
    }

    state.gameClock.playerSpeed = normalizedOpts.playerSpeedDefault;
    state.gameClock.battleSpeed = normalizedOpts.battleSpeedMultiplier ?? 1;
    state.gameOptions.playerSpeedDefault = state.gameClock.playerSpeed;
    state.gameOptions.battleSpeedMultiplier = state.gameClock.battleSpeed;

    if (
      existingSave.storyFlags?.includes('beasts_awakened') ||
      state.storyFlags.has('beasts_awakened') ||
      state.inventory.badges.length >= 4
    ) {
      state.roamingManager.awakenBeasts();
    } else {
      state.roamingManager.sleepBeasts();
    }

    return {
      mapId: initialMapId,
      x: initialPlayerX,
      y: initialPlayerY,
      direction: initialPlayerDir,
      lastVisitedPokecenter,
    };
  }

  public static createSaveSnapshot(params: {
    playTimeSeconds: number;
    playerName: string;
    playerGender: PlayerGender;
    rivalName: string;
    player: { x: number; y: number; direction: Direction };
    mapId: string;
    gameClock: { playerSpeed: SpeedMultiplier; battleSpeed: SpeedMultiplier };
    inventory: {
      balls: Partial<Record<PokeballId, number>>;
      items?: Partial<Record<MedicineId, number>>;
      berries?: Partial<Record<string, number>>;
      keyItems?: string[];
      tms: string[];
      money: number;
      badges: string[];
    };
    playerParty: PokemonInstance[];
    boxManager: any;
    roamingManager: any;
    defeatedTrainers: Set<string>;
    storyFlags: Set<string>;
    seenSpecies: Set<string>;
    caughtSpecies?: Set<string>;
    overworldItemManager: any;
    gameOptions: GameOptions;
    missionManager: any;
    dayCareManager: any;
    kurtCraftingManager: any;
    bugContestManager: any;
  }): SaveData {
    const {
      playTimeSeconds,
      playerName,
      playerGender,
      rivalName,
      player,
      mapId,
      gameClock,
      inventory,
      playerParty,
      boxManager,
      roamingManager,
      defeatedTrainers,
      storyFlags,
      seenSpecies,
      caughtSpecies,
      overworldItemManager,
      gameOptions,
      missionManager,
      dayCareManager,
      kurtCraftingManager,
      bugContestManager,
    } = params;

    const normalizedOpts = SaveManager.normalizeOptions({
      ...gameOptions,
      playerSpeedDefault: gameClock.playerSpeed,
      battleSpeedMultiplier: gameClock.battleSpeed,
    });

    return {
      version: 1,
      timestamp: Date.now(),
      playTimeSeconds: Math.floor(playTimeSeconds),
      player: {
        name: playerName,
        gender: playerGender,
        mapId,
        x: player.x,
        y: player.y,
        direction: player.direction,
        speedMultiplier: normalizedOpts.playerSpeedDefault,
        battleSpeedMultiplier: normalizedOpts.battleSpeedMultiplier,
        badges: inventory.badges,
        money: inventory.money,
        rivalName,
      },
      rivalName,
      party: playerParty,
      box: boxManager.flatten(),
      storage: boxManager.getState(),
      inventory: {
        balls: inventory.balls,
        items: inventory.items,
        berries: inventory.berries,
        tms: inventory.tms,
        keyItems: inventory.keyItems,
      },
      roamers: roamingManager.getAllRoamers(),
      defeatedTrainers: Array.from(defeatedTrainers),
      storyFlags: Array.from(storyFlags),
      collectedItems: overworldItemManager.getCollectedFlags(),
      collectedItemFlags: overworldItemManager.getCollectedFlags(),
      harvestedFruitTrees: overworldItemManager.getHarvestedTreeIds(),
      fruitTreePicks: overworldItemManager.getFruitTreePicksRecord(),
      seenSpecies: Array.from(seenSpecies),
      caughtSpecies: caughtSpecies ? Array.from(caughtSpecies) : undefined,
      options: normalizedOpts,
      missions: missionManager.serialize(),
      dayCare: dayCareManager?.getState(),
      kurtCraftingOrder: kurtCraftingManager?.activeOrder,
      bugContestRecords: bugContestManager?.serializeRecords(),
    };
  }
}
