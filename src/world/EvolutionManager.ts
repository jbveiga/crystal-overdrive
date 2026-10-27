/**
 * @fileoverview EvolutionManager domain module implementation.
 * @module world/EvolutionManager
 * @role EvolutionManager Component
 * @exports EvolutionManager
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-171: Implementation | L172-343: Handlers & Exports
 */

import { Dex } from '@pkmn/dex';
import type {
  PokemonInstance,
  PokemonType,
  BaseStats,
  EvolutionCheckContext,
  EvolutionCandidate,
} from '../types/game';

/**
 * Pure domain Evolution Engine for Crystal Overdrive (Ticket 14.1).
 * Completely decoupled from PixiJS and browser DOM.
 * Handles:
 * - Level-up evolutions across Generation 1 & 2 species
 * - Evolutionary stones (Fire, Water, Thunder, Leaf, Moon, Sun)
 * - Single-player Link Cable / Link Stone trade evolutions (Unbound-style)
 * - Friendship / Happiness scale (0-255, threshold >= 220) with Day/Night branching
 * - Stat recalculation preserving IVs, EVs, nature, and proportional HP
 * - Everstone evolution suppression
 */
export class EvolutionManager {
  public static readonly FRIENDSHIP_THRESHOLD = 220;
  public static readonly DEFAULT_BASE_IV = 15;

  /**
   * Normalizes an item or species identifier by removing non-alphanumeric characters.
   */
  public static normalizeId(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Recalculates full stats based on new base stats, level, and optional IVs/EVs.
   */
  public static calculateStats(
    baseStats: BaseStats,
    level: number,
    ivs?: Partial<BaseStats>,
    evs?: Partial<BaseStats>
  ): BaseStats {
    const getIv = (stat: keyof BaseStats) => ivs?.[stat] ?? this.DEFAULT_BASE_IV;
    const getEv = (stat: keyof BaseStats) => evs?.[stat] ?? 0;

    const maxHp =
      Math.floor(((2 * baseStats.hp + getIv('hp') + Math.floor(getEv('hp') / 4)) * level) / 100) +
      level +
      10;

    const calcStat = (key: keyof Omit<BaseStats, 'hp'>) =>
      Math.floor(((2 * baseStats[key] + getIv(key) + Math.floor(getEv(key) / 4)) * level) / 100) +
      5;

    return {
      hp: maxHp,
      attack: calcStat('attack'),
      defense: calcStat('defense'),
      spAttack: calcStat('spAttack'),
      spDefense: calcStat('spDefense'),
      speed: calcStat('speed'),
    };
  }

  /**
   * Safely modifies friendship within the canonical [0, 255] range.
   */
  public static modifyFriendship(pokemon: PokemonInstance, delta: number): number {
    const current = pokemon.friendship ?? 70;
    const updated = Math.max(0, Math.min(255, current + delta));
    pokemon.friendship = updated;
    return updated;
  }

  /**
   * Retrieves all canonical Gen 1 & 2 evolution candidates for a given species.
   */
  public static getEvolutionCandidates(speciesId: string): EvolutionCandidate[] {
    const species = Dex.species.get(speciesId);
    if (!species.exists || !species.evos) {
      return [];
    }

    const candidates: EvolutionCandidate[] = [];

    for (const evoName of species.evos) {
      const evoSpecies = Dex.species.get(evoName);
      if (!evoSpecies.exists) continue;

      // Restrict strictly to Gen 1 & 2 canonical Pokédex (num 1..251) and base forms
      if (evoSpecies.num > 251 || evoSpecies.forme) continue;

      let method = 'Level Up';
      if (evoSpecies.evoType === 'useItem') {
        method = `Use ${evoSpecies.evoItem}`;
      } else if (evoSpecies.evoType === 'levelFriendship') {
        method = evoSpecies.evoCondition
          ? `Friendship (${evoSpecies.evoCondition})`
          : 'Friendship (>= 220)';
      } else if (evoSpecies.evoType === 'trade') {
        method = evoSpecies.evoItem ? `Trade holding ${evoSpecies.evoItem}` : 'Trade (Link Cable)';
      } else if (evoSpecies.evoLevel) {
        method = `Level ${evoSpecies.evoLevel}`;
      }

      candidates.push({
        currentSpeciesId: species.id,
        targetSpeciesId: evoSpecies.id,
        targetSpeciesName: evoSpecies.name,
        method,
      });
    }

    return candidates;
  }

  /**
   * Checks whether a Pokémon can evolve under the specified context.
   * Returns the EvolutionCandidate if eligible, or null otherwise.
   *
   * Invariant: Everstone held item completely suppresses evolution.
   */
  public static canEvolve(
    pokemon: PokemonInstance,
    context: EvolutionCheckContext
  ): EvolutionCandidate | null {
    if (pokemon.isEgg) return null;

    // Everstone Invariant: blocks all evolution triggers
    if (pokemon.heldItem && this.normalizeId(pokemon.heldItem) === 'everstone') {
      return null;
    }

    const species = Dex.species.get(pokemon.speciesId);
    if (!species.exists || !species.evos || species.evos.length === 0) {
      return null;
    }

    const currentLevel = context.level ?? pokemon.level;
    const currentFriendship = pokemon.friendship ?? 70;
    const usedItemNorm = context.itemId ? this.normalizeId(context.itemId) : null;
    const isLinkCable =
      usedItemNorm === 'linkcable' ||
      usedItemNorm === 'linkstone' ||
      usedItemNorm === 'linkingcord';

    for (const evoName of species.evos) {
      const evoSpecies = Dex.species.get(evoName);
      if (!evoSpecies.exists) continue;

      // Restrict to canonical Generation 1 & 2 species and base forms
      if (evoSpecies.num > 251 || evoSpecies.forme) continue;

      const candidate: EvolutionCandidate = {
        currentSpeciesId: species.id,
        targetSpeciesId: evoSpecies.id,
        targetSpeciesName: evoSpecies.name,
        method: '',
      };

      // -------------------------------------------------------------
      // 1. Level-Up Evolutions
      // -------------------------------------------------------------
      if (context.trigger === 'LEVEL_UP') {
        // A. Friendship during level-up
        if (evoSpecies.evoType === 'levelFriendship') {
          if (currentFriendship >= this.FRIENDSHIP_THRESHOLD) {
            if (this.matchesTimeCondition(evoSpecies.evoCondition, context.timeOfDay)) {
              candidate.method = `Friendship (${currentFriendship}/255)`;
              return candidate;
            }
          }
          continue;
        }

        // B. Standard Level Threshold
        if (evoSpecies.evoLevel && currentLevel >= evoSpecies.evoLevel) {
          // Tyrogue Stat Check Branching
          if (species.id === 'tyrogue') {
            const atk = pokemon.stats.attack;
            const def = pokemon.stats.defense;
            if (evoSpecies.id === 'hitmonlee' && atk > def) {
              candidate.method = `Level ${evoSpecies.evoLevel} (Atk > Def)`;
              return candidate;
            }
            if (evoSpecies.id === 'hitmonchan' && atk < def) {
              candidate.method = `Level ${evoSpecies.evoLevel} (Atk < Def)`;
              return candidate;
            }
            if (evoSpecies.id === 'hitmontop' && atk === def) {
              candidate.method = `Level ${evoSpecies.evoLevel} (Atk == Def)`;
              return candidate;
            }
            continue;
          }

          candidate.method = `Level ${evoSpecies.evoLevel}`;
          return candidate;
        }
      }

      // -------------------------------------------------------------
      // 2. Friendship Trigger Check
      // -------------------------------------------------------------
      if (context.trigger === 'FRIENDSHIP') {
        if (
          evoSpecies.evoType === 'levelFriendship' &&
          currentFriendship >= this.FRIENDSHIP_THRESHOLD
        ) {
          if (this.matchesTimeCondition(evoSpecies.evoCondition, context.timeOfDay)) {
            candidate.method = `Friendship (${currentFriendship}/255)`;
            return candidate;
          }
        }
      }

      // -------------------------------------------------------------
      // 3. Item Trigger Evolutions (Stones & Link Cable)
      // -------------------------------------------------------------
      if (context.trigger === 'ITEM' && usedItemNorm) {
        // A. Evolutionary Stones (useItem)
        if (evoSpecies.evoType === 'useItem' && evoSpecies.evoItem) {
          const requiredItemNorm = this.normalizeId(evoSpecies.evoItem);
          if (usedItemNorm === requiredItemNorm) {
            candidate.method = `Use ${evoSpecies.evoItem}`;
            return candidate;
          }
        }

        // B. Trade Evolutions via Link Cable / Link Stone (Unbound-Style)
        if (evoSpecies.evoType === 'trade') {
          // Case 1: Pure trade evolution (Kadabra -> Alakazam, Machoke -> Machamp, Haunter -> Gengar, Graveler -> Golem)
          if (!evoSpecies.evoItem) {
            if (isLinkCable) {
              candidate.method = 'Link Cable Trade';
              return candidate;
            }
          }
          // Case 2: Trade requiring an item (Onix + Metal Coat -> Steelix, Scyther + Metal Coat -> Scizor,
          // Seadra + Dragon Scale -> Kingdra, Poliwhirl + King's Rock -> Politoed, Slowpoke + King's Rock -> Slowking,
          // Porygon + Up-Grade -> Porygon2)
          else {
            const requiredItemNorm = this.normalizeId(evoSpecies.evoItem);
            const heldItemNorm = pokemon.heldItem ? this.normalizeId(pokemon.heldItem) : null;

            // Triggered if using Link Cable while holding the required item:
            if (isLinkCable && heldItemNorm === requiredItemNorm) {
              candidate.method = `Link Cable holding ${evoSpecies.evoItem}`;
              return candidate;
            }

            // Alternatively triggered by using the required item directly on the Pokémon (Unbound style convenience)
            if (usedItemNorm === requiredItemNorm) {
              candidate.method = `Use ${evoSpecies.evoItem}`;
              return candidate;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Executes the evolution transformation, updating species, types, base stats,
   * recalculating dynamic stats, and proportionally preserving current HP.
   */
  public static executeEvolution(
    pokemon: PokemonInstance,
    targetSpeciesId: string
  ): PokemonInstance {
    const oldSpecies = Dex.species.get(pokemon.speciesId);
    const targetSpecies = Dex.species.get(targetSpeciesId);

    if (!targetSpecies.exists) {
      throw new Error(`Target evolution species "${targetSpeciesId}" does not exist in Dex.`);
    }

    const newBaseStats: BaseStats = {
      hp: targetSpecies.baseStats.hp,
      attack: targetSpecies.baseStats.atk,
      defense: targetSpecies.baseStats.def,
      spAttack: targetSpecies.baseStats.spa,
      spDefense: targetSpecies.baseStats.spd,
      speed: targetSpecies.baseStats.spe,
    };

    const newStats = this.calculateStats(newBaseStats, pokemon.level, pokemon.ivs, pokemon.evs);

    // Proportionally recalculate current HP
    const oldMaxHp = Math.max(1, pokemon.stats.hp);
    const currentRatio = pokemon.currentHp / oldMaxHp;
    const newCurrentHp =
      pokemon.currentHp > 0
        ? Math.max(1, Math.min(newStats.hp, Math.floor(currentRatio * newStats.hp)))
        : 0;

    // Preserve custom nickname if one was assigned; otherwise update to new species name
    const wasDefaultName =
      pokemon.nickname.toLowerCase() === oldSpecies.name.toLowerCase() ||
      pokemon.nickname.toLowerCase() === oldSpecies.id.toLowerCase();

    const newNickname = wasDefaultName ? targetSpecies.name : pokemon.nickname;

    // Apply transformation
    pokemon.speciesId = targetSpecies.id;
    pokemon.nickname = newNickname;
    pokemon.types = targetSpecies.types as [PokemonType] | [PokemonType, PokemonType];
    pokemon.baseStats = newBaseStats;
    pokemon.stats = newStats;
    pokemon.currentHp = newCurrentHp;

    return pokemon;
  }

  /**
   * Evaluates time-of-day condition for branching evolutions (e.g. Eevee -> Espeon/Umbreon).
   */
  private static matchesTimeCondition(
    condition?: string,
    timeOfDay?: 'MORNING' | 'DAY' | 'NIGHT'
  ): boolean {
    if (!condition) return true;

    if (condition.includes('day')) {
      return timeOfDay === 'MORNING' || timeOfDay === 'DAY' || !timeOfDay;
    }

    if (condition.includes('night')) {
      return timeOfDay === 'NIGHT';
    }

    return true;
  }
}
