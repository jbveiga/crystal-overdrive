import { Dex } from '@pkmn/dex';
import type { PokemonInstance, MoveData, PokemonType, MoveCategory, StatusCondition, StatStages } from '../types/game';

export class PokemonFactory {
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
}
