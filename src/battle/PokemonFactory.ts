/**
 * @fileoverview PokemonFactory domain module implementation.
 * @module battle/PokemonFactory
 * @role PokemonFactory Component
 * @exports PartyExpAward, PokemonFactory
 * @layer battle
 * @sections L1-15: Micro-Header & Imports | L16-310: Implementation | L311-621: Handlers & Exports
 */

import { Dex } from '@pkmn/dex';
import type {
  PokemonInstance,
  MoveData,
  PokemonType,
  MoveCategory,
  StatusCondition,
  StatStages,
  ExpShareMode,
  OddEggCandidate,
} from '../types/game';

import {
  type PartyExpAward,
  LEVEL_CAPS_BY_BADGE,
  GYM_ACE_LEVELS_BY_BADGE,
  PokemonExpAndBadgeScaling,
} from './PokemonExpAndBadgeScaling';

export type { PartyExpAward };

/** Monotonic counter guaranteeing unique uids even for Pokémon created within the same millisecond. */
let uidCounter = 0;

export class PokemonFactory {
  private static learnsetCache = new Map<string, Record<string, string[]>>();
  private static moveDataCache = new Map<string, MoveData>();

  public static createDefaultStatStages(): StatStages {
    return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  }

  /**
   * Formats a species ID into its canonical Gen 2 display name (e.g. NIDORAN♂ and NIDORAN♀)
   */
  /**
   * Resolves the full evolutionary lineage of a species (current species and all ancestral pre-evolutions)
   * using Showdown Dex data. Guarantees that evolving never loses Pokédex caught status for prior stages.
   */
  /**
   * Returns all species IDs that this specific instance has ever belonged to (its current species
   * and any previous stages recorded in previousSpeciesIds during actual evolution events).
   * Does NOT grant pre-evolutions for Pokémon caught directly in their evolved forms (e.g. wild Golem).
   */
  public static getOwnedAndEvolvedSpeciesIds(pokemon: PokemonInstance): string[] {
    const ids = new Set<string>();
    if (pokemon.speciesId) {
      ids.add(pokemon.speciesId.toLowerCase().trim());
    }
    if (pokemon.previousSpeciesIds) {
      for (const prevId of pokemon.previousSpeciesIds) {
        if (prevId) {
          ids.add(prevId.toLowerCase().trim());
        }
      }
    }
    return Array.from(ids);
  }

  public static getSpeciesLineageIds(speciesId: string): string[] {
    const lineage = new Set<string>();
    let currentId: string | undefined = speciesId.toLowerCase().trim();
    while (currentId) {
      lineage.add(currentId);
      try {
        const spec = Dex.species.get(currentId);
        if (spec && spec.prevo) {
          currentId = spec.prevo.toLowerCase().trim();
        } else {
          currentId = undefined;
        }
      } catch {
        currentId = undefined;
      }
    }
    return Array.from(lineage);
  }

  public static formatSpeciesName(speciesId: string, fallbackName?: string): string {
    const id = speciesId.toLowerCase().trim();
    if (id === 'nidoran-m' || id === 'nidoranm') return 'NIDORAN♂';
    if (id === 'nidoran-f' || id === 'nidoranf') return 'NIDORAN♀';
    if (id === 'mr__mime' || id === 'mr_mime' || id === 'mrmime') return 'MR. MIME';
    if (id === 'ho_oh' || id === 'ho-oh') return 'HO-OH';
    if (fallbackName) return fallbackName;
    try {
      const sp = Dex.species.get(speciesId);
      return sp.exists ? sp.name.toUpperCase() : speciesId.toUpperCase();
    } catch {
      return speciesId.toUpperCase();
    }
  }

  /**
   * Looks up MoveData from Showdown Dex
   */
  public static getMoveData(moveId: string): MoveData {
    const cached = PokemonFactory.moveDataCache.get(moveId);
    if (cached) return cached;

    const dexMove = Dex.moves.get(moveId);
    if (!dexMove.exists) {
      throw new Error(`Move "${moveId}" does not exist in Dex.`);
    }

    const type = dexMove.type as PokemonType;
    const category = dexMove.category as MoveCategory;

    let leavesOneHp = false;
    let trapsTarget = false;
    let inflictsStatus: StatusCondition | undefined = undefined;
    let secondaryStatus: MoveData['secondaryStatus'] = undefined;
    let statChanges: MoveData['statChanges'] = undefined;

    if (dexMove.id === 'falseswipe') {
      leavesOneHp = true;
    }
    if (dexMove.id === 'meanlook' || dexMove.id === 'block' || dexMove.id === 'spiderweb') {
      trapsTarget = true;
    }
    if (dexMove.id === 'thunderwave') {
      inflictsStatus = 'PAR';
    } else if (dexMove.id === 'spore' || dexMove.id === 'hypnosis' || dexMove.id === 'sleeppowder') {
      inflictsStatus = 'SLP';
    } else if (dexMove.id === 'poisonpowder') {
      inflictsStatus = 'PSN';
    }

    if (dexMove.id === 'ember' || dexMove.id === 'flamethrower' || dexMove.id === 'firepunch') {
      secondaryStatus = { status: 'BRN', chance: 0.1 };
    } else if (dexMove.id === 'thundershock') {
      secondaryStatus = { status: 'PAR', chance: 0.1 };
    } else if (dexMove.id === 'spark' || dexMove.id === 'lick') {
      secondaryStatus = { status: 'PAR', chance: 0.3 };
    } else if (dexMove.id === 'poisonsting') {
      secondaryStatus = { status: 'PSN', chance: 0.3 };
    }

    if (dexMove.id === 'leer' || dexMove.id === 'tailwhip') {
      statChanges = { target: 'foe', stat: 'def', stages: -1 };
    } else if (dexMove.id === 'growl') {
      statChanges = { target: 'foe', stat: 'atk', stages: -1 };
    } else if (dexMove.id === 'stringshot') {
      statChanges = { target: 'foe', stat: 'spe', stages: -1 };
    } else if (
      dexMove.id === 'sandattack' ||
      dexMove.id === 'smokescreen' ||
      dexMove.id === 'flash' ||
      dexMove.id === 'mudslap'
    ) {
      statChanges = { target: 'foe', stat: 'acc', stages: -1 };
    } else if (dexMove.id === 'defensecurl' || dexMove.id === 'harden') {
      statChanges = { target: 'self', stat: 'def', stages: 1 };
    } else if (dexMove.id === 'growth') {
      statChanges = { target: 'self', stat: 'spa', stages: 1 };
    } else if (dexMove.id === 'swordsdance') {
      statChanges = { target: 'self', stat: 'atk', stages: 2 };
    } else if (dexMove.id === 'agility') {
      statChanges = { target: 'self', stat: 'spe', stages: 2 };
    } else if (dexMove.id === 'screech') {
      statChanges = { target: 'foe', stat: 'def', stages: -2 };
    } else if (dexMove.id === 'scaryface') {
      statChanges = { target: 'foe', stat: 'spe', stages: -2 };
    }

    // Dynamically hydrate stat boosts & status conditions from @pkmn/dex for all remaining moves
    if (!statChanges && dexMove.boosts) {
      const statMap: Record<string, 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'acc' | 'eva'> = {
        atk: 'atk', def: 'def', spa: 'spa', spd: 'spd', spe: 'spe', accuracy: 'acc', evasion: 'eva',
      };
      for (const [k, v] of Object.entries(dexMove.boosts)) {
        if (typeof v === 'number' && v !== 0 && statMap[k]) {
          const isSelf = dexMove.target === 'self' || v > 0;
          statChanges = { target: isSelf ? 'self' : 'foe', stat: statMap[k], stages: v };
          break;
        }
      }
    }
    if (!inflictsStatus && dexMove.status) {
      const statusMap: Record<string, StatusCondition> = {
        par: 'PAR', slp: 'SLP', psn: 'PSN', tox: 'PSN', brn: 'BRN', frz: 'FRZ',
      };
      if (statusMap[dexMove.status]) {
        inflictsStatus = statusMap[dexMove.status];
      }
    }

    // Canonical healing, drain, recoil, and fixed damage
    let healFraction: number | undefined = undefined;
    let isWeatherHeal = false;
    let isRest = false;
    let drainFraction: number | undefined = undefined;
    let recoilFraction: number | undefined = undefined;
    let fixedDamage: MoveData['fixedDamage'] = undefined;

    if (dexMove.id === 'synthesis' || dexMove.id === 'morningsun' || dexMove.id === 'moonlight') {
      healFraction = 0.5;
      isWeatherHeal = true;
    } else if (dexMove.id === 'recover' || dexMove.id === 'softboiled' || dexMove.id === 'milkdrink') {
      healFraction = 0.5;
    } else if (dexMove.id === 'rest') {
      healFraction = 1.0;
      isRest = true;
    }

    if (dexMove.id === 'gigadrain' || dexMove.id === 'megadrain' || dexMove.id === 'absorb' || dexMove.id === 'leechlife' || dexMove.id === 'dreameater') {
      drainFraction = 0.5;
    }

    if (dexMove.id === 'doubleedge' || dexMove.id === 'takedown' || dexMove.id === 'submission') {
      recoilFraction = 0.25;
    } else if (dexMove.id === 'struggle') {
      recoilFraction = 0.25;
    }

    if (dexMove.id === 'nightshade' || dexMove.id === 'seismictoss') {
      fixedDamage = 'level';
    } else if (dexMove.id === 'dragonrage') {
      fixedDamage = 40;
    } else if (dexMove.id === 'sonicboom') {
      fixedDamage = 20;
    } else if (dexMove.id === 'superfang') {
      fixedDamage = 'half_current_hp';
    }

    const moveObj: MoveData = {
      id: dexMove.id,
      name: dexMove.name,
      type,
      category,
      power: dexMove.basePower,
      accuracy: typeof dexMove.accuracy === 'number' ? dexMove.accuracy : 100,
      pp: dexMove.pp,
      priority: dexMove.priority,
      leavesOneHp,
      trapsTarget,
      inflictsStatus,
      secondaryStatus,
      statChanges,
      healFraction,
      isWeatherHeal,
      isRest,
      drainFraction,
      recoilFraction,
      fixedDamage,
    };
    PokemonFactory.moveDataCache.set(moveId, moveObj);
    return moveObj;
  }

  /**
   * Checks whether a Pokémon species can learn a specific move in Gen 2.
   * Traverses current species and pre-evolution chain using Showdown Gen 2 Dex.
   */
  public static async canLearnMove(speciesId: string, moveId: string): Promise<boolean> {
    const dexMove = Dex.moves.get(moveId);
    if (!dexMove.exists) return false;
    const normalizedMoveId = dexMove.id;

    const gen2 = Dex.forGen(2);
    let currentSpecies = gen2.species.get(speciesId);
    if (!currentSpecies.exists) {
      currentSpecies = Dex.species.get(speciesId);
      if (!currentSpecies.exists) return false;
    }

    let curr: any = currentSpecies;
    while (curr && curr.exists) {
      let lsMap = PokemonFactory.learnsetCache.get(curr.id);
      if (!lsMap) {
        try {
          const ls = await gen2.learnsets.get(curr.id);
          if (ls && ls.learnset) {
            lsMap = ls.learnset as Record<string, string[]>;
            PokemonFactory.learnsetCache.set(curr.id, lsMap);
          }
        } catch {
          // Fallback if learnset cannot be loaded
        }
      }

      if (lsMap && lsMap[normalizedMoveId]) {
        const sources = lsMap[normalizedMoveId];
        // In Gen 2, moves learned in Gen 2 ('2M', '2L', '2T', '2E', etc.) or Gen 1 transfer ('1M', '1L', etc.)
        if (Array.isArray(sources) && sources.some((s) => s.startsWith('2') || s.startsWith('1'))) {
          return true;
        }
      }

      if (!curr.prevo) break;
      curr = gen2.species.get(curr.prevo);
    }

    return false;
  }

  /**
   * Instantiates a fully hydrated PokemonInstance based on species and level
   */
  public static create(speciesId: string, level: number, customMoves?: string[]): PokemonInstance {
    const species = Dex.species.get(speciesId);
    if (!species.exists) {
      throw new Error(`Species "${speciesId}" not found in Dex.`);
    }

    const iv = 15; // Balanced average IV
    const baseStats = {
      hp: species.baseStats.hp,
      attack: species.baseStats.atk,
      defense: species.baseStats.def,
      spAttack: species.baseStats.spa,
      spDefense: species.baseStats.spd,
      speed: species.baseStats.spe,
    };

    // Stat formula
    const maxHp = Math.floor(((2 * baseStats.hp + iv) * level) / 100) + level + 10;
    const stats = {
      hp: maxHp,
      attack: Math.floor(((2 * baseStats.attack + iv) * level) / 100) + 5,
      defense: Math.floor(((2 * baseStats.defense + iv) * level) / 100) + 5,
      spAttack: Math.floor(((2 * baseStats.spAttack + iv) * level) / 100) + 5,
      spDefense: Math.floor(((2 * baseStats.spDefense + iv) * level) / 100) + 5,
      speed: Math.floor(((2 * baseStats.speed + iv) * level) / 100) + 5,
    };

    // Default moves if not specified
    const defaultMovesMap: Record<string, string[]> = {
      cyndaquil: ['tackle', 'leer', 'smokescreen', 'ember'],
      totodile: ['scratch', 'leer', 'rage', 'watergun'],
      chikorita: ['tackle', 'growl', 'razorleaf', 'poisonpowder'],
      pidgey: ['tackle', 'sandattack', 'gust', 'quickattack'],
      sentret: ['scratch', 'defensecurl', 'quickattack'],
      rattata: ['tackle', 'tailwhip', 'quickattack', 'bite'],
      hoothoot: ['tackle', 'growl', 'hypnosis', 'peck'],
      caterpie: ['tackle', 'stringshot'],
      weedle: ['poisonsting', 'stringshot'],
      bellsprout: ['vinewhip', 'growth'],
      gastly: ['lick', 'hypnosis', 'spite'],
      geodude: ['tackle', 'defensecurl', 'rockthrow'],
      ledyba: ['tackle', 'supersonic'],
      spinarak: ['poisonsting', 'stringshot'],
      togepi: ['metronome', 'charm'],
      raikou: ['thundershock', 'quickattack', 'spark', 'bite'],
      entei: ['ember', 'firespin', 'stomp', 'bite'],
      suicune: ['watergun', 'gust', 'aurorabeam', 'bubblebeam'],
    };

    const moveIds = customMoves || defaultMovesMap[species.id] || ['tackle'];
    const moves = moveIds.map((mId) => {
      const moveData = this.getMoveData(mId);
      return {
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      };
    });

    const types = species.types as [PokemonType] | [PokemonType, PokemonType];

    // Catch rate from Gen 2 data (beasts = 3, starters = 45, route 29 common = 255)
    let catchRate = 255;
    if (['raikou', 'entei', 'suicune', 'lugia', 'hooh', 'ho-oh'].includes(species.id)) {
      catchRate = 3;
    } else if (['cyndaquil', 'totodile', 'chikorita'].includes(species.id)) {
      catchRate = 45;
    }

    let nickname: string = species.name;
    if (species.id === 'nidoranm' || speciesId === 'nidoran-m' || speciesId === 'nidoranm') {
      nickname = 'NIDORAN♂';
    } else if (species.id === 'nidoranf' || speciesId === 'nidoran-f' || speciesId === 'nidoranf') {
      nickname = 'NIDORAN♀';
    }

    return {
      uid: `${species.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}-${++uidCounter}`,
      speciesId: species.id,
      nickname,
      level,
      types,
      baseStats,
      stats,
      currentHp: maxHp,
      status: 'NONE',
      statStages: this.createDefaultStatStages(),
      exp: level * level * level,
      nextLevelExp: (level + 1) * (level + 1) * (level + 1),
      isTrapped: false,
      moves,
      catchRate,
    };
  }

  /**
   * Instantiates the canonical Shiny Red Gyarados at Lake of Rage (Level 30).
   * Fixed shiny, Gen 2 moveset: Dragon Rage, Twister, Leer, Bite.
   */
  public static createShinyRedGyarados(level: number = 30): PokemonInstance {
    const gyarados = this.create('gyarados', level, ['dragonrage', 'twister', 'leer', 'bite']);
    return {
      ...gyarados,
      nickname: 'GYARADOS',
      isShiny: true,
      heldItem: 'red-scale',
      catchRate: 45,
    };
  }

  /**
   * Instantiates an unhatched Pokémon Egg (Ticket 5.4)
   */
  public static createEgg(speciesId: string, hatchSteps: number = 256): PokemonInstance {
    const base = this.create(speciesId, 1, []);
    return {
      ...base,
      nickname: 'EGG',
      level: 1,
      currentHp: 10,
      status: 'NONE',
      moves: [],
      isEgg: true,
      eggSteps: hatchSteps,
    };
  }

  public static readonly ODD_EGG_CANDIDATES: readonly OddEggCandidate[] = [
    'pichu',
    'cleffa',
    'igglybuff',
    'tyrogue',
    'smoochum',
    'elekid',
    'magby',
  ];

  /**
   * Instantiates the Crystal-exclusive Odd Egg (Ticket TICKET-WORLD-ROUTE34-DAYCARE-01).
   * Generates one of the 7 baby Pokémon candidates with 14% shiny chance.
   */
  public static createOddEgg(
    candidateSpeciesId?: OddEggCandidate,
    isShinyChance: number = 0.14,
    hatchSteps: number = 256
  ): PokemonInstance {
    const speciesId =
      candidateSpeciesId ??
      this.ODD_EGG_CANDIDATES[Math.floor(Math.random() * this.ODD_EGG_CANDIDATES.length)];
    const egg = this.createEgg(speciesId, hatchSteps);
    const isShiny = Math.random() < isShinyChance;
    return {
      ...egg,
      isOddEgg: true,
      isShiny,
    };
  }

  public static calculateExpGain(defeated: PokemonInstance, isTrainer: boolean = false): number {
    return PokemonExpAndBadgeScaling.calculateExpGain(defeated, isTrainer);
  }

  public static readonly LEVEL_CAPS_BY_BADGE: Record<number, number> = LEVEL_CAPS_BY_BADGE;

  public static readonly GYM_ACE_LEVELS_BY_BADGE: Record<number, number> = GYM_ACE_LEVELS_BY_BADGE;

  public static getLevelCapForBadges(badgeCount: number): number {
    return PokemonExpAndBadgeScaling.getLevelCapForBadges(badgeCount);
  }

  public static getGymAceLevelForBadges(badgeCount: number): number {
    return PokemonExpAndBadgeScaling.getGymAceLevelForBadges(badgeCount);
  }

  public static getObedienceCapForBadges(badgesOrCount: string[] | number): number {
    return PokemonExpAndBadgeScaling.getObedienceCapForBadges(badgesOrCount);
  }

  public static createMoveInstance(moveId: string): {
    moveId: string;
    currentPp: number;
    maxPp: number;
  } {
    const moveData = this.getMoveData(moveId);
    return {
      moveId: moveData.id,
      currentPp: moveData.pp,
      maxPp: moveData.pp,
    };
  }

  public static getBadgeStatMultipliers(badges: string[] = []) {
    return PokemonExpAndBadgeScaling.getBadgeStatMultipliers(badges);
  }

  public static distributePartyExp(
    party: PokemonInstance[],
    activeBattler: PokemonInstance,
    baseExpGained: number,
    mode: ExpShareMode = 'CAPPED',
    badgeCount: number = 0,
    explicitLevelCap?: number
  ): PartyExpAward[] {
    return PokemonExpAndBadgeScaling.distributePartyExp(
      party,
      activeBattler,
      baseExpGained,
      mode,
      badgeCount,
      explicitLevelCap
    );
  }

  public static formatBenchExpShareSummary(awards: PartyExpAward[]): string | null {
    return PokemonExpAndBadgeScaling.formatBenchExpShareSummary(awards);
  }

  public static gainExp(pokemon: PokemonInstance, amount: number): { leveledUp: boolean; newLevel: number } {
    return PokemonExpAndBadgeScaling.gainExp(pokemon, amount);
  }

  public static async getLearnableMovesAtLevel(speciesId: string, level: number): Promise<string[]> {
    return PokemonExpAndBadgeScaling.getLearnableMovesAtLevel(speciesId, level);
  }
}
