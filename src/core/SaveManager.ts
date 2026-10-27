/**
 * @fileoverview SaveManager domain module implementation.
 * @module core/SaveManager
 * @role SaveManager Component
 * @exports SaveData, LEGACY_STORAGE_KEYS, STARTER_LINEAGE_MAP
 * @layer core
 * @sections L1-15: Micro-Header & Imports | L16-362: Implementation | L363-725: Handlers & Exports
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
import type { KurtCraftingOrder } from '../world/KurtCraftingManager';
import type { BugContestLeaderboardEntry } from '../world/BugContestManager';

export interface SaveData {
  version: number;
  timestamp: number;
  playTimeSeconds?: number;
  player: {
    name: string;
    gender: PlayerGender;
    mapId: string;
    x: number;
    y: number;
    direction: Direction;
    speedMultiplier: SpeedMultiplier;
    battleSpeedMultiplier?: SpeedMultiplier;
    badges: string[];
    money: number;
    rivalName?: string;
  };
  rivalName?: string;
  party: PokemonInstance[];
  box?: PokemonInstance[];
  storage?: PokemonStorageState;
  inventory: {
    balls: Partial<Record<PokeballId, number>>;
    items?: Partial<Record<MedicineId, number>>;
    tms: string[];
    berries?: Partial<Record<string, number>>;
    keyItems?: string[];
  };
  roamers: RoamerState[];
  defeatedTrainers: string[];
  storyFlags?: string[];
  seenSpecies?: string[];
  options?: GameOptions;
  missions?: Record<string, SerializedMissionState>;
  collectedItems?: string[];
  collectedItemFlags?: string[];
  harvestedFruitTrees?: string[];
  fruitTreePicks?: Record<string, number>;
  dayCare?: DayCareState;
  kurtCraftingOrder?: KurtCraftingOrder;
  bugContestRecords?: BugContestLeaderboardEntry[];
}
const DB_NAME = 'crystal-overdrive-db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'main-save';
export const LEGACY_STORAGE_KEYS = [
  'crystal-overdrive-save',
  'crystal_overdrive_save',
  'main-save',
  'saveData',
];
export const STARTER_LINEAGE_MAP: Readonly<Record<string, 'cyndaquil' | 'totodile' | 'chikorita'>> = {
  cyndaquil: 'cyndaquil',
  quilava: 'cyndaquil',
  typhlosion: 'cyndaquil',
  totodile: 'totodile',
  croconaw: 'totodile',
  feraligatr: 'totodile',
  chikorita: 'chikorita',
  bayleef: 'chikorita',
  meganium: 'chikorita',
};
const LOCATION_NAME_TABLE: Record<string, string> = {
  new_bark_town: 'New Bark Town',
  players_house_1f: "Player's House",
  players_house_2f: "Player's Room",
  players_neighbors_house: "Neighbor's House",
  elms_lab: "Elm's Lab",
  elms_house: "Elm's House",
  route_29: 'Route 29',
  cherrygrove_city: 'Cherrygrove City',
  cherrygrove_mart: 'Cherrygrove Mart',
  cherrygrove_poke_center: 'Cherrygrove Poké Center',
  guide_gents_house: "Guide Gent's House",
  cherrygrove_gym_speech_house: 'Cherrygrove Gym Speech House',
  cherrygrove_evolution_speech_house: 'Cherrygrove Evolution House',
  route_30: 'Route 30',
  mr_pokemons_house: "Mr. Pokémon's House",
  route_30_berry_house: 'Route 30 Berry House',
  route_31: 'Route 31',
  violet_city: 'Violet City',
  violet_mart: 'Violet Mart',
  violet_poke_center: 'Violet Poké Center',
  earls_pokemon_academy: "Earl's Pokémon Academy",
  violet_nickname_speech_house: 'Violet Nickname House',
  violet_kyles_house: "Kyle's House",
  route_31_violet_gate: 'Route 31 Violet Gate',
  sprout_tower_1f: 'Sprout Tower 1F',
  sprout_tower_2f: 'Sprout Tower 2F',
  sprout_tower_3f: 'Sprout Tower 3F',
  violet_gym: 'Violet Gym',
};
export class SaveManager {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private memoryStore: Map<string, SaveData> = new Map();
  constructor() {
    if (typeof indexedDB !== 'undefined') {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    }
  }

  /**
   * Returns canonical default GameOptions (Ticket 4.1 & TICKET-KEY-ITEMS-UNBOUND-01).
   */
  public static getDefaultOptions(): GameOptions {
    return {
      soundVolume: 0.7, bgmVolume: 0.7, muted: false, textSpeed: 'MID', battleStyle: 'SHIFT',
      battleAnimations: true, playerSpeedDefault: 3, battleSpeedMultiplier: 1, touchControlStyle: 'DPAD',
      gamepadActive: false, expShare: 'CAPPED', encounterRateMode: 'NORMAL', autoHm: true,
      crtScanlines: false, gbcPalette: 'VIBRANT', lowHpBeepEnabled: true, chiptuneMode: false,
    };
  }

  /**
   * Defensively normalizes user options against canonical defaults.
   */
  public static normalizeOptions(
    raw?: Partial<GameOptions> | null,
    player?: Partial<SaveData['player']> | null
  ): GameOptions {
    const def = SaveManager.getDefaultOptions();
    const r = raw && typeof raw === 'object' ? raw : {};
    const cv = (v: any, d: number): number => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : d; };
    const pick = <T>(v: any, valid: T[], d: T): T => (valid.includes(v) ? v : d);
    const b = (v: any, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
    const pSpeed = [1, 2, 3, 4].includes(r.playerSpeedDefault as any) ? r.playerSpeedDefault! : [1, 2, 3, 4].includes(player?.speedMultiplier as any) ? player!.speedMultiplier! : def.playerSpeedDefault;
    const bSpeed = [1, 2, 3, 4].includes(r.battleSpeedMultiplier as any) ? r.battleSpeedMultiplier! : [1, 2, 3, 4].includes(player?.battleSpeedMultiplier as any) ? player!.battleSpeedMultiplier! : def.battleSpeedMultiplier!;
    return {
      soundVolume: cv(r.soundVolume, def.soundVolume), bgmVolume: cv(r.bgmVolume, def.bgmVolume), muted: b(r.muted, def.muted!),
      textSpeed: pick(r.textSpeed, ['SLOW', 'MID', 'FAST', 'INSTANT'], def.textSpeed),
      battleStyle: pick(r.battleStyle, ['SHIFT', 'SET'], def.battleStyle!),
      battleAnimations: b(r.battleAnimations, def.battleAnimations),
      playerSpeedDefault: pSpeed as SpeedMultiplier, battleSpeedMultiplier: bSpeed as SpeedMultiplier,
      touchControlStyle: pick(r.touchControlStyle, ['DPAD', 'JOYSTICK'], def.touchControlStyle!),
      gamepadActive: b(r.gamepadActive, def.gamepadActive!), expShare: pick(r.expShare, ['OFF', 'ALL', 'CAPPED'], def.expShare!),
      encounterRateMode: pick(r.encounterRateMode, ['NORMAL', 'RELAXED', 'CLASSIC'], def.encounterRateMode!),
      autoHm: b(r.autoHm, def.autoHm!), crtScanlines: b(r.crtScanlines, def.crtScanlines!),
      gbcPalette: pick(r.gbcPalette, ['VIBRANT', 'POCKET', 'DMG', 'NIGHT'], def.gbcPalette!),
      lowHpBeepEnabled: b(r.lowHpBeepEnabled, def.lowHpBeepEnabled!), chiptuneMode: b(r.chiptuneMode, def.chiptuneMode!),
    };
  }

  /**
   * Returns a fresh, pristine SaveData structure for a new game adventure (Ticket 4.3).
   */
  public static createFreshSaveData(name: string, gender: PlayerGender): SaveData {
    return {
      version: 1,
      timestamp: Date.now(),
      playTimeSeconds: 0,
      player: {
        name,
        gender,
        mapId: 'players_house_2f',
        x: 7,
        y: 1,
        direction: 'DOWN',
        speedMultiplier: 3,
        battleSpeedMultiplier: 1,
        badges: [],
        money: 3000,
        rivalName: 'SILVER',
      },
      rivalName: 'SILVER',
      party: [],
      box: [],
      storage: StorageManager.createDefaultStorage(),
      inventory: {
        balls: {
          'quick-ball': 5,
          'fast-ball': 5,
          'net-ball': 5,
          'ultra-ball': 10,
          'great-ball': 15,
          'poke-ball': 30,
          'master-ball': 1,
        },
        items: {
          potion: 5,
          'super-potion': 2,
          antidote: 3,
          'parlyz-heal': 2,
          awakening: 2,
          revive: 1,
        },
        berries: {},
        tms: ['TM54', 'TM73', 'TM99'],
        keyItems: [],
      },
      roamers: [],
      defeatedTrainers: [],
      storyFlags: [],
      collectedItems: [],
      collectedItemFlags: [],
      harvestedFruitTrees: [],
      fruitTreePicks: {},
      seenSpecies: [],
      options: SaveManager.getDefaultOptions(),
    };
  }

  /**
   * Formats total elapsed seconds into canonical `"HH:MM:ss"` (e.g. `0` -> `"00:00:00"`, `65` -> `"00:01:05"`, `3665` -> `"01:01:05"`).
   */
  public static formatPlayTime(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Resolves a human-readable location title from a `mapId`.
   */
  public static formatLocationName(mapId?: string): string {
    if (!mapId) return 'New Bark Town';
    if (LOCATION_NAME_TABLE[mapId]) {
      return LOCATION_NAME_TABLE[mapId];
    }
    return mapId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Reconciles legacy save states where the player already owns a starter (or party Pokémon)
   * from an earlier game version but lacks 'starter_chosen' / 'starter_<species>' in storyFlags.
   */
  public static reconcileStarterFlags(save: SaveData): void {
    if (!save) return;
    save.storyFlags = Array.isArray(save.storyFlags) ? save.storyFlags : [];

    // 1. Gather all candidate Pokémon from party, box, and storage boxes
    const candidatePkmn: Array<{ speciesId?: string; isEgg?: boolean }> = [];
    if (Array.isArray(save.party)) {
      for (const p of save.party) {
        if (p && typeof p === 'object') candidatePkmn.push(p);
      }
    }
    if (Array.isArray(save.box)) {
      for (const p of save.box) {
        if (p && typeof p === 'object') candidatePkmn.push(p);
      }
    }
    if (save.storage && Array.isArray(save.storage.boxes)) {
      for (const b of save.storage.boxes) {
        if (b && Array.isArray(b.pokemon)) {
          for (const p of b.pokemon) {
            if (p && typeof p === 'object') candidatePkmn.push(p);
          }
        }
      }
    }

    const nonEggPkmn = candidatePkmn.filter((p) => Boolean(p && !p.isEgg && p.speciesId));
    if (nonEggPkmn.length === 0 && (!Array.isArray(save.party) || save.party.length === 0)) {
      return;
    }

    // 2. Check for starter lineage
    let baseStarter: 'cyndaquil' | 'totodile' | 'chikorita' | undefined;
    for (const p of nonEggPkmn) {
      const sid = (p.speciesId || '').toLowerCase();
      if (STARTER_LINEAGE_MAP[sid]) {
        baseStarter = STARTER_LINEAGE_MAP[sid];
        break;
      }
    }

    // Fallback: check seenSpecies
    if (!baseStarter && Array.isArray(save.seenSpecies)) {
      for (const s of save.seenSpecies) {
        const sid = (s || '').toLowerCase();
        if (STARTER_LINEAGE_MAP[sid]) {
          baseStarter = STARTER_LINEAGE_MAP[sid];
          break;
        }
      }
    }

    const hasPartyPokemon = Array.isArray(save.party) && save.party.some((p) => Boolean(p && !p.isEgg));
    if (baseStarter || hasPartyPokemon) {
      if (!save.storyFlags.includes('starter_chosen')) {
        save.storyFlags.push('starter_chosen');
      }
      if (baseStarter) {
        const hasSpecificStarter =
          save.storyFlags.includes('starter_cyndaquil') ||
          save.storyFlags.includes('starter_totodile') ||
          save.storyFlags.includes('starter_chikorita');
        if (!hasSpecificStarter) {
          save.storyFlags.push(`starter_${baseStarter}`);
        }
      }
    }
  }

  public async saveGame(data: SaveData): Promise<boolean> {
    try {
      SaveManager.reconcileStarterFlags(data);
      data.timestamp = Date.now();
      this.memoryStore.set(SAVE_KEY, JSON.parse(JSON.stringify(data)));
      if (this.dbPromise) {
        const db = await this.dbPromise;
        await db.put(STORE_NAME, data, SAVE_KEY);
      }
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('crystal-overdrive-save', JSON.stringify(data));
        } catch (err) {
          console.warn('Could not mirror save to localStorage:', err);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to save game to IndexedDB:', err);
      return false;
    }
  }

  public async loadGame(): Promise<SaveData | null> {
    try {
      let loaded: SaveData | null = null;
      if (this.dbPromise) {
        const db = await this.dbPromise;
        const save = await db.get(STORE_NAME, SAVE_KEY);
        if (save) {
          loaded = save;
        } else {
          try {
            const allSaves = await db.getAll(STORE_NAME);
            const found = allSaves.find((s) => s && typeof s === 'object' && s.player);
            if (found) loaded = found;
          } catch {
            // ignore getAll errors
          }
        }
      }
      if (!loaded && typeof localStorage !== 'undefined') {
        for (const k of LEGACY_STORAGE_KEYS) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object' && parsed.player) {
                loaded = parsed;
                // Auto-migrate legacy localStorage save into IndexedDB
                if (this.dbPromise) {
                  const db = await this.dbPromise;
                  await db.put(STORE_NAME, loaded, SAVE_KEY);
                }
                break;
              }
            } catch {
              // Ignore corrupt legacy JSON
            }
          }
        }
        if (!loaded) {
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (!key) continue;
              const raw = localStorage.getItem(key);
              if (raw && (raw.startsWith('{') || raw.startsWith('"{\\'))) {
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed && typeof parsed === 'object' && parsed.player && Array.isArray(parsed.party)) {
                    loaded = parsed;
                    if (this.dbPromise) {
                      const db = await this.dbPromise;
                      await db.put(STORE_NAME, loaded, SAVE_KEY);
                    }
                    break;
                  }
                } catch {
                  // ignore
                }
              }
            }
          } catch {
            // ignore localStorage scan errors
          }
        }
      }
      if (!loaded) {
        const memSave = this.memoryStore.get(SAVE_KEY);
        loaded = memSave ? JSON.parse(JSON.stringify(memSave)) : null;
      }
      if (loaded) {
        try {
          if (Array.isArray(loaded.party)) {
            loaded.party = loaded.party.filter((p) => p && typeof p === 'object' && p.speciesId);
          }
          if (Array.isArray(loaded.box)) {
            loaded.box = loaded.box.filter((p) => p && typeof p === 'object' && p.speciesId);
          }
          SaveManager.reconcileStarterFlags(loaded);
          loaded.options = SaveManager.normalizeOptions(loaded.options, loaded.player);
          if (loaded.player && !loaded.player.rivalName && loaded.rivalName) {
            loaded.player.rivalName = loaded.rivalName;
          } else if (loaded.player && loaded.player.rivalName && !loaded.rivalName) {
            loaded.rivalName = loaded.player.rivalName;
          }
          // Gen 2 has no TM70: Flash is exclusively HM05. Prune legacy duplicate.
          if (loaded.inventory && Array.isArray(loaded.inventory.tms) && loaded.inventory.tms.includes('TM70')) {
            const hadHm05 = loaded.inventory.tms.includes('HM05');
            loaded.inventory.tms = loaded.inventory.tms.filter((id) => id !== 'TM70');
            if (!hadHm05 && loaded.storyFlags?.includes('sprout_tower_cleared')) {
              loaded.inventory.tms.push('HM05');
            }
          }
          if (!loaded.storage) {
            loaded.storage = StorageManager.createDefaultStorage(loaded.box);
          }
        } catch (normErr) {
          console.warn('Error normalizing loaded save:', normErr);
        }
      }
      return loaded;
    } catch (err) {
      console.error('Failed to load game from IndexedDB:', err);
      return this.memoryStore.get(SAVE_KEY) || null;
    }
  }

  public async hasSave(): Promise<boolean> {
    const save = await this.loadGame();
    return !!save;
  }

  public async deleteSave(): Promise<void> {
    this.memoryStore.delete(SAVE_KEY);
    if (this.dbPromise) {
      const db = await this.dbPromise;
      await db.delete(STORE_NAME, SAVE_KEY);
    }
    if (typeof localStorage !== 'undefined') {
      for (const k of LEGACY_STORAGE_KEYS) {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Queries the active save slot and constructs a lightweight `SavePreview` summary for the Title Screen (Ticket 4.1).
   * Gracefully handles legacy save objects lacking `player.name` or `player.gender`.
   */
  public async getSavePreview(): Promise<SavePreview | null> {
    const save = await this.loadGame();
    if (!save || !save.player) {
      return null;
    }

    const playerName = save.player.name || 'GOLD';
    const gender: PlayerGender = save.player.gender || 'BOY';
    const badgeCount = Array.isArray(save.player.badges) ? save.player.badges.length : 0;
    const pokedexCount = Array.isArray(save.seenSpecies) ? save.seenSpecies.length : 0;
    const playTimeFormatted = SaveManager.formatPlayTime(save.playTimeSeconds || 0);
    const currentLocationName = SaveManager.formatLocationName(save.player.mapId);
    const leadPokemon = Array.isArray(save.party) && save.party.length > 0 ? save.party[0] : undefined;
    const rivalName = save.rivalName || save.player.rivalName || 'SILVER';

    return {
      playerName,
      gender,
      badgeCount,
      pokedexCount,
      playTimeFormatted,
      currentLocationName,
      partyLeadSpeciesId: leadPokemon?.speciesId,
      partyLeadLevel: leadPokemon?.level,
      timestamp: save.timestamp || 0,
      rivalName,
    };
  }

  public async exportSaveJson(): Promise<string> {
    const save = await this.loadGame();
    if (!save) {
      throw new Error('No save state found to export.');
    }
    return JSON.stringify(save, null, 2);
  }

  public async importSaveJson(jsonStr: string): Promise<boolean> {
    try {
      const parsed: SaveData = JSON.parse(jsonStr);
      if (!parsed.player || !parsed.party) {
        throw new Error('Invalid save file format.');
      }
      return await this.saveGame(parsed);
    } catch (err) {
      console.error('Failed to import save file:', err);
      return false;
    }
  }

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
      seenSpecies: Set<string>;
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
      options: normalizedOpts,
      missions: missionManager.serialize(),
      dayCare: dayCareManager?.getState(),
      kurtCraftingOrder: kurtCraftingManager?.activeOrder,
      bugContestRecords: bugContestManager?.serializeRecords(),
    };
  }
}
