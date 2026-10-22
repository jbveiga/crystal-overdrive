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

  public static createDefaultStatStages(): StatStages {
    return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  }

  /**
   * Looks up MoveData from Showdown Dex
   */
  public static getMoveData(moveId: string): MoveData {
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
    } else if (dexMove.id === 'sandattack' || dexMove.id === 'smokescreen') {
      statChanges = { target: 'foe', stat: 'acc', stages: -1 };
    } else if (dexMove.id === 'defensecurl') {
      statChanges = { target: 'self', stat: 'def', stages: 1 };
    } else if (dexMove.id === 'growth') {
      statChanges = { target: 'self', stat: 'spa', stages: 1 };
    }

    return {
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
    };
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
    if (['raikou', 'entei', 'suicune'].includes(species.id)) {
      catchRate = 3;
    } else if (['cyndaquil', 'totodile', 'chikorita'].includes(species.id)) {
      catchRate = 45;
    }

    return {
      uid: `${species.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      speciesId: species.id,
      nickname: species.name,
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
