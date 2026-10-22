import { Dex } from '@pkmn/dex';
import type { PokemonInstance } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';

export interface DayCareSlot {
  pokemon: PokemonInstance;
  depositLevel: number;
  initialExp: number;
  stepsWalked: number;
}

export interface DayCareState {
  slot1: DayCareSlot | null;
  slot2: DayCareSlot | null;
  hasEgg: boolean;
  eggSpeciesId?: string;
  stepCounter: number;
}

export type CompatibilityTier = 0 | 1 | 2 | 3;

export interface CompatibilityInfo {
  tier: CompatibilityTier;
  message: string;
  color: string;
}

export class DayCareManager {
  private slot1: DayCareSlot | null = null;
  private slot2: DayCareSlot | null = null;
  private hasEgg: boolean = false;
  private eggSpeciesId?: string;
  private stepCounter: number = 0;

  constructor(initialState?: DayCareState | null) {
    if (initialState) {
      this.loadState(initialState);
    }
  }

  public getSlot(index: 0 | 1): DayCareSlot | null {
    return index === 0 ? this.slot1 : this.slot2;
  }

  public getOccupiedCount(): number {
    return (this.slot1 ? 1 : 0) + (this.slot2 ? 1 : 0);
  }

  public isEggReady(): boolean {
    return this.hasEgg;
  }

  public getEggSpeciesId(): string | undefined {
    return this.eggSpeciesId;
  }

  public setEggReady(ready: boolean, speciesId?: string): void {
    this.hasEgg = ready;
    this.eggSpeciesId = speciesId;
  }

  /**
   * Deposits a Pokémon into the first available slot.
   * Returns slot index (0 or 1), or -1 if full or invalid (e.g. Eggs cannot be deposited).
   */
  public deposit(pokemon: PokemonInstance): number {
    if (pokemon.isEgg) return -1;
    const slot: DayCareSlot = {
      pokemon,
      depositLevel: pokemon.level,
      initialExp: pokemon.exp ?? pokemon.level * pokemon.level * pokemon.level,
      stepsWalked: 0,
    };

    if (!this.slot1) {
      this.slot1 = slot;
      return 0;
    }
    if (!this.slot2) {
      this.slot2 = slot;
      return 1;
    }
    return -1;
  }

  /**
   * Withdraws a Pokémon from a slot, clearing the slot.
   */
  public withdraw(slotIndex: 0 | 1): PokemonInstance | null {
    if (slotIndex === 0) {
      const s = this.slot1;
      this.slot1 = null;
      return s ? s.pokemon : null;
    } else {
      const s = this.slot2;
      this.slot2 = null;
      return s ? s.pokemon : null;
    }
  }

  /**
   * Calculates retrieval fee: $100 base + $100 per level gained.
   */
  public static calculateFee(slot: DayCareSlot): number {
    const levelDelta = Math.max(0, slot.pokemon.level - slot.depositLevel);
    return 100 + 100 * levelDelta;
  }

  /**
   * Evaluates breeding compatibility between two deposited Pokémon.
   * Conforms to canonical Gen 2 compatibility messages and odds.
   */
  public getCompatibility(): CompatibilityInfo | null {
    if (!this.slot1 || !this.slot2) return null;
    return DayCareManager.evaluateCompatibility(this.slot1.pokemon, this.slot2.pokemon);
  }

  public static evaluateCompatibility(
    p1: PokemonInstance,
    p2: PokemonInstance
  ): CompatibilityInfo {
    const s1 = Dex.species.get(p1.speciesId);
    const s2 = Dex.species.get(p2.speciesId);

    const g1 = s1.eggGroups || [];
    const g2 = s2.eggGroups || [];

    // Undiscovered egg group (Baby Pokémon, Legendaries, Nidorina, Nidoqueen, Unown) cannot breed
    if (g1.includes('Undiscovered') || g2.includes('Undiscovered')) {
      return {
        tier: 0,
        message: 'The two prefer to play with other Pokémon.',
        color: '#8A9DBF',
      };
    }

    const isDitto1 = g1.includes('Ditto');
    const isDitto2 = g2.includes('Ditto');

    // Two Dittos cannot breed
    if (isDitto1 && isDitto2) {
      return {
        tier: 0,
        message: 'The two prefer to play with other Pokémon.',
        color: '#8A9DBF',
      };
    }

    // Gender check: opposite genders or one Ditto required
    // If genders aren't tracked, derive standard opposite compatibility
    const shareGroup =
      isDitto1 ||
      isDitto2 ||
      g1.some((group) => g2.includes(group));

    if (!shareGroup) {
      return {
        tier: 0,
        message: 'The two prefer to play with other Pokémon.',
        color: '#8A9DBF',
      };
    }

    // Same species check
    const isSameSpecies = s1.id === s2.id;
    // Check OT ID / uid to detect different trainers
    const isDifferentTrainer = p1.uid !== p2.uid;

    if (isSameSpecies && isDifferentTrainer) {
      return {
        tier: 3,
        message: 'The two seem to get along very well!',
        color: '#48C774',
      };
    }

    if (isSameSpecies || isDifferentTrainer) {
      return {
        tier: 2,
        message: 'The two seem to get along.',
        color: '#2A75D3',
      };
    }

    return {
      tier: 1,
      message: "The two don't seem to like each other much.",
      color: '#FFD028',
    };
  }

  /**
   * Called each step taken by the player.
   * Advances EXP and levels for deposited Pokémon, and rolls for Egg discovery.
   */
  public onStepTaken(): void {
    this.stepCounter++;

    for (const slot of [this.slot1, this.slot2]) {
      if (!slot) continue;
      slot.stepsWalked++;
      if (slot.pokemon.level < 100) {
        slot.pokemon.exp = (slot.pokemon.exp ?? slot.pokemon.level ** 3) + 1;
        while (
          slot.pokemon.level < 100 &&
          slot.pokemon.exp >= (slot.pokemon.nextLevelExp ?? (slot.pokemon.level + 1) ** 3)
        ) {
          slot.pokemon.level++;
          slot.pokemon.nextLevelExp = (slot.pokemon.level + 1) ** 3;
          // Recalculate stats with factory
          const updated = PokemonFactory.create(slot.pokemon.speciesId, slot.pokemon.level);
          slot.pokemon.stats = updated.stats;
          slot.pokemon.currentHp = Math.min(slot.pokemon.currentHp + 2, updated.stats.hp);
        }
      }
    }

    // Every 256 steps, roll egg discovery chance if both slots occupied and compatible
    if (this.stepCounter % 256 === 0 && this.slot1 && this.slot2 && !this.hasEgg) {
      const compat = this.getCompatibility();
      if (compat && compat.tier > 0) {
        let chance = 0.2;
        if (compat.tier === 3) chance = 0.7;
        else if (compat.tier === 2) chance = 0.5;

        if (Math.random() < chance) {
          this.hasEgg = true;
          this.eggSpeciesId = DayCareManager.resolveEggSpecies(
            this.slot1.pokemon.speciesId,
            this.slot2.pokemon.speciesId
          );
        }
      }
    }
  }

  /**
   * Determines the hatched baby species (base evolutionary stage of mother or non-Ditto).
   */
  public static resolveEggSpecies(parent1Id: string, parent2Id: string): string {
    const s1 = Dex.species.get(parent1Id);
    const s2 = Dex.species.get(parent2Id);

    const isDitto1 = s1.eggGroups?.includes('Ditto');
    const targetParent = isDitto1 ? s2 : s1;

    let curr = targetParent;
    while (curr && curr.prevo) {
      curr = Dex.species.get(curr.prevo);
    }
    return curr?.id || targetParent.id;
  }

  /**
   * Collects the ready egg and resets egg state.
   */
  public collectEgg(): PokemonInstance | null {
    if (!this.hasEgg) return null;
    const species = this.eggSpeciesId || 'pichu';
    this.hasEgg = false;
    this.eggSpeciesId = undefined;
    return PokemonFactory.createEgg(species, 256);
  }

  public getState(): DayCareState {
    return {
      slot1: this.slot1 ? { ...this.slot1, pokemon: { ...this.slot1.pokemon } } : null,
      slot2: this.slot2 ? { ...this.slot2, pokemon: { ...this.slot2.pokemon } } : null,
      hasEgg: this.hasEgg,
      eggSpeciesId: this.eggSpeciesId,
      stepCounter: this.stepCounter,
    };
  }

  public loadState(state?: DayCareState | null): void {
    if (!state) return;
    this.slot1 = state.slot1 ? { ...state.slot1, pokemon: { ...state.slot1.pokemon } } : null;
    this.slot2 = state.slot2 ? { ...state.slot2, pokemon: { ...state.slot2.pokemon } } : null;
    this.hasEgg = Boolean(state.hasEgg);
    this.eggSpeciesId = state.eggSpeciesId;
    this.stepCounter = state.stepCounter || 0;
  }
}
