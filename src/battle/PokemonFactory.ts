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

export interface PartyExpAward {
  pokemon: PokemonInstance;
  expAwarded: number;
  isCapped: boolean;
  isActiveBattler: boolean;
  leveledUp: boolean;
  newLevel: number;
  levelCap: number;
}

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
      uid: `${species.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

  /**
   * Classic EXP Yield formula: (BaseEXP * DefeatedLevel * TrainerBonus) / 7
   */
  public static calculateExpGain(defeated: PokemonInstance, isTrainer: boolean = false): number {
    const baseExpSum =
      defeated.baseStats.hp +
      defeated.baseStats.attack +
      defeated.baseStats.defense +
      defeated.baseStats.spAttack +
      defeated.baseStats.spDefense +
      defeated.baseStats.speed;
    const baseYield = Math.max(45, Math.floor(baseExpSum * 0.25));
    const trainerMult = isTrainer ? 1.5 : 1.0;
    return Math.max(12, Math.floor((baseYield * defeated.level * trainerMult) / 5));
  }

  /**
   * Soft Level Caps by Badge Count for Unbound-style Capped Exp. Share:
   * Badge 0: Lv. 15 (Falkner Ace Lv. 13)
   * Badge 1: Lv. 18 (Bugsy Ace Lv. 16)
   * Badge 2: Lv. 22 (Whitney Ace Lv. 20)
   * Badge 3: Lv. 27 (Morty Ace Lv. 25)
   * Badge 4: Lv. 32 (Chuck Ace Lv. 30)
   * Badge 5: Lv. 37 (Jasmine Ace Lv. 35)
   * Badge 6: Lv. 37 (Pryce Ace Lv. 35)
   * Badge 7: Lv. 42 (Clair Ace Lv. 40)
   * Badge 8: Lv. 52 (Lance Ace Lv. 50)
   * 16 Badges: Lv. 85 (Red Ace Lv. 81)
   */
  public static readonly LEVEL_CAPS_BY_BADGE: Record<number, number> = {
    0: 15,
    1: 18,
    2: 22,
    3: 27,
    4: 32,
    5: 37,
    6: 37,
    7: 42,
    8: 52,
    16: 85,
  };

  public static readonly GYM_ACE_LEVELS_BY_BADGE: Record<number, number> = {
    0: 13,
    1: 16,
    2: 20,
    3: 25,
    4: 30,
    5: 35,
    6: 35,
    7: 40,
    8: 50,
    16: 81,
  };

  public static getLevelCapForBadges(badgeCount: number): number {
    const safeCount = Math.max(0, Math.floor(badgeCount || 0));
    if (safeCount >= 16) return 85;
    if (safeCount >= 9) return 85;
    return this.LEVEL_CAPS_BY_BADGE[safeCount] ?? 52;
  }

  public static getGymAceLevelForBadges(badgeCount: number): number {
    const safeCount = Math.max(0, Math.floor(badgeCount || 0));
    if (safeCount >= 16) return 81;
    if (safeCount >= 9) return 81;
    return this.GYM_ACE_LEVELS_BY_BADGE[safeCount] ?? 50;
  }

  /**
   * Returns the canonical Gen 2 obedience level cap for traded/outsider Pokémon based on earned badges:
   * - Zephyr Badge (1 badge): Lv. 20
   * - Hive Badge (2 badges): Lv. 30
   * - Fog Badge (4 badges): Lv. 50
   * - Storm Badge (5 badges): Lv. 70
   * - Rising Badge (8+ badges): Lv. 100
   */
  public static getObedienceCapForBadges(badgesOrCount: string[] | number): number {
    if (Array.isArray(badgesOrCount)) {
      const set = new Set(badgesOrCount.map((b) => b.toLowerCase()));
      if (set.has('rising') || set.size >= 8) return 100;
      if (set.has('storm') || set.size >= 5) return 70;
      if (set.has('fog') || set.size >= 4) return 50;
      if (set.has('hive') || set.has('hive_badge') || set.size >= 2) return 30;
      if (set.has('zephyr') || set.has('zephyr_badge') || set.size >= 1) return 20;
      return 10;
    }
    const count = Math.max(0, Math.floor(badgesOrCount || 0));
    if (count >= 8) return 100;
    if (count >= 5) return 70;
    if (count >= 4) return 50;
    if (count >= 2) return 30;
    if (count >= 1) return 20;
    return 10;
  }

  /**
   * Returns Gen 2 badge stat multipliers (+12.5% per corresponding Johto Gym Badge):
   * - Zephyr Badge: Attack x1.125
   * - Hive / Mineral Badge: Defense x1.125
   * - Plain Badge: Speed x1.125
   * - Fog / Glacier Badge: Special x1.125
   */
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

  public static getBadgeStatMultipliers(badges: string[] = []): {
    attack: number;
    defense: number;
    speed: number;
    special: number;
    atk: number;
    def: number;
    spe: number;
    spc: number;
  } {
    const set = new Set((badges || []).map((b) => b.toLowerCase()));
    const attack = set.has('zephyr') || set.has('zephyr_badge') ? 1.125 : 1.0;
    const defense =
      set.has('hive') || set.has('hive_badge') || set.has('mineral') || set.has('mineral_badge')
        ? 1.125
        : 1.0;
    const speed = set.has('plain') || set.has('plain_badge') ? 1.125 : 1.0;
    const special =
      set.has('fog') || set.has('fog_badge') || set.has('glacier') || set.has('glacier_badge')
        ? 1.125
        : 1.0;
    return {
      attack,
      defense,
      speed,
      special,
      atk: attack,
      def: defense,
      spe: speed,
      spc: special,
    };
  }

  /**
   * Distributes battle EXP across the party according to Unbound Exp. Share mode ('OFF' | 'ALL' | 'CAPPED').
   * - OFF: Only the active battler gains 100% EXP.
   * - ALL: Active battler gains 100% EXP; conscious non-egg bench members gain 50% split EXP.
   * - CAPPED: Same as ALL, except any Pokémon at or above the current level cap has its EXP clamped to 1 EXP.
   */
  public static distributePartyExp(
    party: PokemonInstance[],
    activeBattler: PokemonInstance,
    baseExpGained: number,
    mode: ExpShareMode = 'CAPPED',
    badgeCount: number = 0,
    explicitLevelCap?: number
  ): PartyExpAward[] {
    const levelCap =
      typeof explicitLevelCap === 'number' ? explicitLevelCap : this.getLevelCapForBadges(badgeCount);
    const awards: PartyExpAward[] = [];

    for (const member of party) {
      if (member.isEgg || member.currentHp <= 0) continue;

      const isActiveBattler = member === activeBattler || member.uid === activeBattler.uid;
      if (mode === 'OFF' && !isActiveBattler) {
        continue;
      }

      const rawShare = isActiveBattler ? baseExpGained : Math.max(1, Math.floor(baseExpGained * 0.5));
      const isCapped = mode === 'CAPPED' && member.level >= levelCap;
      const expAwarded = isCapped ? 1 : rawShare;

      const levelResult = this.gainExp(member, expAwarded);
      awards.push({
        pokemon: member,
        expAwarded,
        isCapped,
        isActiveBattler,
        leveledUp: levelResult.leveledUp,
        newLevel: levelResult.newLevel,
        levelCap,
      });
    }

    return awards;
  }

  /**
   * Formats a single consolidated Pokémon Unbound-style Exp. Share summary line for all
   * benched party recipients (`!award.isActiveBattler`). Returns `null` if no bench Pokémon gained EXP.
   */
  public static formatBenchExpShareSummary(awards: PartyExpAward[]): string | null {
    const benchAwards = awards.filter((a) => !a.isActiveBattler && a.expAwarded > 0);
    if (benchAwards.length === 0) return null;

    const uncappedBench = benchAwards.find((a) => !a.isCapped);
    if (!uncappedBench) {
      const cap = benchAwards[0].levelCap;
      return `🧢 The rest of your party is at the level cap (Lv. ${cap}) and received 1 EXP. Point via Exp. Share!`;
    }
    return `✨ The rest of your party received ${uncappedBench.expAwarded} EXP. Points via Exp. Share!`;
  }

  /**
   * Awards EXP to a Pokémon and recalculates stats if it levels up
   */
  public static gainExp(pokemon: PokemonInstance, amount: number): { leveledUp: boolean; newLevel: number } {
    if (pokemon.exp === undefined) {
      pokemon.exp = pokemon.level * pokemon.level * pokemon.level;
    }
    if (pokemon.nextLevelExp === undefined) {
      pokemon.nextLevelExp = (pokemon.level + 1) * (pokemon.level + 1) * (pokemon.level + 1);
    }

    pokemon.exp += amount;
    let leveledUp = false;
    const iv = 15;

    while (pokemon.exp >= pokemon.nextLevelExp && pokemon.level < 100) {
      pokemon.level++;
      leveledUp = true;
      pokemon.nextLevelExp = (pokemon.level + 1) * (pokemon.level + 1) * (pokemon.level + 1);

      const oldMaxHp = pokemon.stats.hp;
      const newMaxHp = Math.floor(((2 * pokemon.baseStats.hp + iv) * pokemon.level) / 100) + pokemon.level + 10;
      const hpDiff = Math.max(1, newMaxHp - oldMaxHp);

      pokemon.stats = {
        hp: newMaxHp,
        attack: Math.floor(((2 * pokemon.baseStats.attack + iv) * pokemon.level) / 100) + 5,
        defense: Math.floor(((2 * pokemon.baseStats.defense + iv) * pokemon.level) / 100) + 5,
        spAttack: Math.floor(((2 * pokemon.baseStats.spAttack + iv) * pokemon.level) / 100) + 5,
        spDefense: Math.floor(((2 * pokemon.baseStats.spDefense + iv) * pokemon.level) / 100) + 5,
        speed: Math.floor(((2 * pokemon.baseStats.speed + iv) * pokemon.level) / 100) + 5,
      };
      pokemon.currentHp = Math.min(newMaxHp, pokemon.currentHp + hpDiff);
    }

    return { leveledUp, newLevel: pokemon.level };
  }

  /**
   * Retrieves moves learned by species at the specified level in Gen 2 (Ticket 6.4)
   */
  public static async getLearnableMovesAtLevel(speciesId: string, level: number): Promise<string[]> {
    try {
      const learnsetData = await Dex.forGen(2).learnsets.get(speciesId);
      if (!learnsetData || !learnsetData.learnset) return [];

      const result: string[] = [];
      const targetTag = `2L${level}`;

      for (const [moveId, sources] of Object.entries(learnsetData.learnset)) {
        if (Array.isArray(sources)) {
          for (const src of sources) {
            if (src === targetTag) {
              result.push(moveId);
            }
          }
        }
      }
      return result;
    } catch {
      return [];
    }
  }
}
