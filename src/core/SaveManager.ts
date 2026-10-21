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
} from '../types/game';

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
  };
  party: PokemonInstance[];
  box: PokemonInstance[];
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
}

const DB_NAME = 'crystal-overdrive-db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'main-save';

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
      soundVolume: 0.7,
      bgmVolume: 0.7,
      textSpeed: 'MID',
      battleAnimations: true,
      playerSpeedDefault: 1,
      battleSpeedMultiplier: 1,
      touchControlStyle: 'DPAD',
      expShare: 'CAPPED',
    };
  }

  /**
   * Formats total elapsed seconds into `"HH:MM"` (e.g. `84` -> `"00:01"`, `5040` -> `"01:24"`).
   */
  public static formatPlayTime(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const totalMinutes = Math.floor(safeSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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

  public async saveGame(data: SaveData): Promise<boolean> {
    try {
      data.timestamp = Date.now();
      this.memoryStore.set(SAVE_KEY, JSON.parse(JSON.stringify(data)));
      if (this.dbPromise) {
        const db = await this.dbPromise;
        await db.put(STORE_NAME, data, SAVE_KEY);
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
        if (save) loaded = save;
      }
      if (!loaded) {
        const memSave = this.memoryStore.get(SAVE_KEY);
        loaded = memSave ? JSON.parse(JSON.stringify(memSave)) : null;
      }
      if (loaded) {
        if (!loaded.options) {
          loaded.options = SaveManager.getDefaultOptions();
        } else if (!loaded.options.expShare) {
          loaded.options.expShare = 'CAPPED';
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
}
