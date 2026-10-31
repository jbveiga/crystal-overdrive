/**
 * @fileoverview PokemonExpAndBadgeScaling domain module implementation.
 * @module battle/PokemonExpAndBadgeScaling
 * @role EXP gain, badge level/obedience/stat caps, and Gen 2 learnset level lookup
 * @exports PartyExpAward, LEVEL_CAPS_BY_BADGE, GYM_ACE_LEVELS_BY_BADGE, PokemonExpAndBadgeScaling
 * @layer battle
 * @sections L1-165: Badge Caps & Stat Multipliers | L166-295: Party EXP Distribution & Learnset Lookup
 */

import { Dex } from '@pkmn/dex';
import type { ExpShareMode, PokemonInstance } from '../types/game';

export interface PartyExpAward {
  pokemon: PokemonInstance;
  expAwarded: number;
  isCapped: boolean;
  isActiveBattler: boolean;
  leveledUp: boolean;
  newLevel: number;
  levelCap: number;
}

export const LEVEL_CAPS_BY_BADGE: Record<number, number> = {
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

export const GYM_ACE_LEVELS_BY_BADGE: Record<number, number> = {
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

export class PokemonExpAndBadgeScaling {
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

  public static getLevelCapForBadges(badgeCount: number): number {
    const safeCount = Math.max(0, Math.floor(badgeCount || 0));
    if (safeCount >= 16) return 85;
    if (safeCount >= 9) return 85;
    return LEVEL_CAPS_BY_BADGE[safeCount] ?? 52;
  }

  public static getGymAceLevelForBadges(badgeCount: number): number {
    const safeCount = Math.max(0, Math.floor(badgeCount || 0));
    if (safeCount >= 16) return 81;
    if (safeCount >= 9) return 81;
    return GYM_ACE_LEVELS_BY_BADGE[safeCount] ?? 50;
  }

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
