import { Dex } from '@pkmn/dex';
import type { PokemonInstance, MoveData, PokemonType, MoveCategory, StatusCondition } from '../types/game';

export class PokemonFactory {
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
      isTrapped: false,
      moves,
      catchRate,
    };
  }
}
