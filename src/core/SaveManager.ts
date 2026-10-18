import { openDB, type IDBPDatabase } from 'idb';
import type { PokemonInstance, RoamerState, SpeedMultiplier, Direction, PokeballId } from '../types/game';

export interface SaveData {
  version: number;
  timestamp: number;
  player: {
    mapId: string;
    x: number;
    y: number;
    direction: Direction;
    speedMultiplier: SpeedMultiplier;
    badges: string[];
    money: number;
  };
  party: PokemonInstance[];
  box: PokemonInstance[];
  inventory: {
    balls: Partial<Record<PokeballId, number>>;
    tms: string[];
  };
  roamers: RoamerState[];
  defeatedTrainers: string[];
}

const DB_NAME = 'crystal-overdrive-db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'main-save';

export class SaveManager {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  public async saveGame(data: SaveData): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      data.timestamp = Date.now();
      await db.put(STORE_NAME, data, SAVE_KEY);
      return true;
    } catch (err) {
      console.error('Failed to save game to IndexedDB:', err);
      return false;
    }
  }

  public async loadGame(): Promise<SaveData | null> {
    try {
      const db = await this.dbPromise;
      const save = await db.get(STORE_NAME, SAVE_KEY);
      return save || null;
    } catch (err) {
      console.error('Failed to load game from IndexedDB:', err);
      return null;
    }
  }

  public async hasSave(): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      const save = await db.get(STORE_NAME, SAVE_KEY);
      return !!save;
    } catch {
      return false;
    }
  }

  public async deleteSave(): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, SAVE_KEY);
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
