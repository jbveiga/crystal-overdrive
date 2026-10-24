import type { PokemonInstance, StorageBox, PokemonStorageState } from '../types/game';

export interface DepositResult {
  boxIndex: number;
  slotIndex: number;
  rolledOver: boolean;
}

export interface ReleaseResult {
  success: boolean;
  reason?: string;
}

/**
 * Pure TypeScript domain engine for Bill's PC Pokémon Storage System.
 * Zero DOM or PixiJS dependencies.
 */
export class StorageManager {
  public static readonly BOX_CAPACITY = 20;
  public static readonly TOTAL_BOXES = 14;
  public static readonly TOTAL_CAPACITY = StorageManager.BOX_CAPACITY * StorageManager.TOTAL_BOXES; // 280

  public static readonly PROTECTED_LEGENDARIES = new Set<string>(['raikou', 'entei', 'suicune']);

  /**
   * Initializes a fresh 14-box storage state, migrating legacy flat box array if provided.
   */
  public static createDefaultStorage(legacyBox?: PokemonInstance[]): PokemonStorageState {
    const boxes: StorageBox[] = [];
    for (let i = 0; i < this.TOTAL_BOXES; i++) {
      boxes.push({
        id: i,
        name: `BOX ${i + 1}`,
        pokemon: new Array(this.BOX_CAPACITY).fill(null),
      });
    }

    const state: PokemonStorageState = {
      currentBoxIndex: 0,
      boxes,
    };

    if (Array.isArray(legacyBox) && legacyBox.length > 0) {
      let bIdx = 0;
      let sIdx = 0;
      for (const pkmn of legacyBox) {
        if (!pkmn) continue;
        if (bIdx >= this.TOTAL_BOXES) break;
        boxes[bIdx].pokemon[sIdx] = pkmn;
        sIdx++;
        if (sIdx >= this.BOX_CAPACITY) {
          sIdx = 0;
          bIdx++;
        }
      }
    }

    return state;
  }

  /**
   * Returns the count of non-null Pokémon stored in a single box.
   */
  public static getBoxCount(box: StorageBox): number {
    let count = 0;
    for (let i = 0; i < box.pokemon.length; i++) {
      if (box.pokemon[i] !== null) count++;
    }
    return count;
  }

  /**
   * Returns the total count of non-null Pokémon stored across all 14 boxes.
   */
  public static getTotalStoredCount(state: PokemonStorageState): number {
    let total = 0;
    for (const b of state.boxes) {
      total += this.getBoxCount(b);
    }
    return total;
  }

  /**
   * Flattens all stored Pokémon into a flat array for legacy save compatibility.
   */
  public static flattenStorage(state: PokemonStorageState): PokemonInstance[] {
    const flat: PokemonInstance[] = [];
    for (const b of state.boxes) {
      for (const p of b.pokemon) {
        if (p) flat.push(p);
      }
    }
    return flat;
  }

  /**
   * Deposits a Pokémon into the current active box (or requested box).
   * Automatically rolls over to next available box if the current box is full.
   */
  public static depositPokemon(
    state: PokemonStorageState,
    pokemon: PokemonInstance,
    targetBoxIndex?: number
  ): DepositResult {
    const startBox =
      typeof targetBoxIndex === 'number' && targetBoxIndex >= 0 && targetBoxIndex < this.TOTAL_BOXES
        ? targetBoxIndex
        : state.currentBoxIndex;

    // Search sequentially starting from startBox
    for (let offset = 0; offset < this.TOTAL_BOXES; offset++) {
      const boxIdx = (startBox + offset) % this.TOTAL_BOXES;
      const box = state.boxes[boxIdx];
      const emptySlotIdx = box.pokemon.findIndex((p) => p === null);

      if (emptySlotIdx !== -1) {
        box.pokemon[emptySlotIdx] = pokemon;
        const rolledOver = boxIdx !== startBox;
        if (rolledOver) {
          state.currentBoxIndex = boxIdx;
        }
        return {
          boxIndex: boxIdx,
          slotIndex: emptySlotIdx,
          rolledOver,
        };
      }
    }

    throw new Error('All Pokémon storage boxes are completely full (280/280)!');
  }

  /**
   * Withdraws a Pokémon from a specific box and slot, clearing the box slot.
   */
  public static withdrawPokemon(
    state: PokemonStorageState,
    boxIndex: number,
    slotIndex: number
  ): PokemonInstance | null {
    if (boxIndex < 0 || boxIndex >= this.TOTAL_BOXES) return null;
    const box = state.boxes[boxIndex];
    if (slotIndex < 0 || slotIndex >= this.BOX_CAPACITY) return null;

    const pkmn = box.pokemon[slotIndex];
    if (pkmn) {
      box.pokemon[slotIndex] = null;
    }
    return pkmn;
  }

  /**
   * Swaps a party member with a box slot (or deposits/withdraws between party and box).
   * Enforces party-minimum invariant: party cannot be left with 0 conscious, battle-ready Pokémon.
   */
  public static swapPartyAndBox(
    party: PokemonInstance[],
    partyIndex: number,
    state: PokemonStorageState,
    boxIndex: number,
    slotIndex: number
  ): boolean {
    if (boxIndex < 0 || boxIndex >= this.TOTAL_BOXES) return false;
    if (slotIndex < 0 || slotIndex >= this.BOX_CAPACITY) return false;
    const box = state.boxes[boxIndex];
    const boxPkmn = box.pokemon[slotIndex];
    const partyPkmn = party[partyIndex];

    if (!partyPkmn && !boxPkmn) {
      return false;
    }

    // Case 1: Deposit from party to empty box slot
    if (partyPkmn && !boxPkmn) {
      // Must have at least one other conscious Pokémon in party
      const remainingConscious = party.filter(
        (p, idx) => idx !== partyIndex && !p.isEgg && p.currentHp > 0
      );
      if (remainingConscious.length === 0) {
        return false; // Invariant: Cannot deposit last conscious Pokémon
      }

      box.pokemon[slotIndex] = partyPkmn;
      party.splice(partyIndex, 1);
      return true;
    }

    // Case 2: Withdraw from box to empty party slot
    if (!partyPkmn && boxPkmn) {
      if (party.length >= 6) return false;
      party.push(boxPkmn);
      box.pokemon[slotIndex] = null;
      return true;
    }

    // Case 3: 1-to-1 Swap between Party slot and Box slot
    if (partyPkmn && boxPkmn) {
      // Check if swapping would leave party with 0 conscious Pokémon
      const partyWithoutCurrent = party.filter((_, idx) => idx !== partyIndex);
      const isBoxPkmnConscious = !boxPkmn.isEgg && boxPkmn.currentHp > 0;
      const otherConscious = partyWithoutCurrent.filter((p) => !p.isEgg && p.currentHp > 0);

      if (!isBoxPkmnConscious && otherConscious.length === 0) {
        return false; // Invariant: Cannot leave party with zero conscious Pokémon
      }

      party[partyIndex] = boxPkmn;
      box.pokemon[slotIndex] = partyPkmn;
      return true;
    }

    return false;
  }

  /**
   * Releases a Pokémon from a storage box slot.
   * Invariant: Protected Legendary Roaming Beasts (Raikou, Entei, Suicune) cannot be released.
   */
  public static releasePokemon(
    state: PokemonStorageState,
    boxIndex: number,
    slotIndex: number
  ): ReleaseResult {
    if (boxIndex < 0 || boxIndex >= this.TOTAL_BOXES) {
      return { success: false, reason: 'Invalid box index.' };
    }
    const box = state.boxes[boxIndex];
    if (slotIndex < 0 || slotIndex >= this.BOX_CAPACITY) {
      return { success: false, reason: 'Invalid slot index.' };
    }

    const pkmn = box.pokemon[slotIndex];
    if (!pkmn) {
      return { success: false, reason: 'Slot is already empty.' };
    }

    if (this.PROTECTED_LEGENDARIES.has(pkmn.speciesId.toLowerCase())) {
      return {
        success: false,
        reason: `A mysterious force protects ${pkmn.nickname || pkmn.speciesId.toUpperCase()}! It is protected and cannot be released!`,
      };
    }

    box.pokemon[slotIndex] = null;
    return { success: true };
  }
}

/**
 * Object-oriented BoxManager instance wrapper around PokemonStorageState.
 */
export class BoxManager {
  private state: PokemonStorageState;

  constructor(state?: PokemonStorageState, legacyBox?: PokemonInstance[]) {
    this.state = state || StorageManager.createDefaultStorage(legacyBox);
  }

  public getState(): PokemonStorageState {
    return this.state;
  }

  public getCurrentBoxIndex(): number {
    return this.state.currentBoxIndex;
  }

  public changeBox(index: number): boolean {
    if (index >= 0 && index < StorageManager.TOTAL_BOXES) {
      this.state.currentBoxIndex = index;
      return true;
    }
    return false;
  }

  public getBox(index: number): StorageBox | null {
    return this.state.boxes[index] || null;
  }

  public getCurrentBox(): StorageBox {
    return this.state.boxes[this.state.currentBoxIndex];
  }

  public deposit(pokemon: PokemonInstance, targetBoxIndex?: number): DepositResult {
    return StorageManager.depositPokemon(this.state, pokemon, targetBoxIndex);
  }

  public withdraw(boxIndex: number, slotIndex: number): PokemonInstance | null {
    return StorageManager.withdrawPokemon(this.state, boxIndex, slotIndex);
  }

  public swap(
    party: PokemonInstance[],
    partyIndex: number,
    boxIndex: number,
    slotIndex: number
  ): boolean {
    return StorageManager.swapPartyAndBox(party, partyIndex, this.state, boxIndex, slotIndex);
  }

  public release(boxIndex: number, slotIndex: number): ReleaseResult {
    return StorageManager.releasePokemon(this.state, boxIndex, slotIndex);
  }

  public getBoxCount(boxIndex: number): number {
    const b = this.getBox(boxIndex);
    return b ? StorageManager.getBoxCount(b) : 0;
  }

  public getTotalStoredCount(): number {
    return StorageManager.getTotalStoredCount(this.state);
  }

  public flatten(): PokemonInstance[] {
    return StorageManager.flattenStorage(this.state);
  }
}
