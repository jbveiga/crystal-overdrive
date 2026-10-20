import type { MoveData, PokemonInstance } from '../types/game';
import { EffectivenessHelper } from './EffectivenessHelper';

export interface DamageResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
  isStab: boolean;
}

export class DamageCalculator {
  /**
   * Standard stat stage multiplier for Attack, Defense, Sp.Atk, Sp.Def, Speed (-6 to +6)
   */
  public static getStatStageMultiplier(stage: number = 0): number {
    const clamped = Math.max(-6, Math.min(6, stage));
    return clamped >= 0 ? (2 + clamped) / 2 : 2 / (2 - clamped);
  }

  /**
   * Accuracy / Evasion stage multiplier (-6 to +6)
   */
  public static getAccEvaStageMultiplier(stage: number = 0): number {
    const clamped = Math.max(-6, Math.min(6, stage));
    return clamped >= 0 ? (3 + clamped) / 3 : 3 / (3 - clamped);
  }

  /**
   * Calculates Gen 4+ damage with Physical/Special split, Stat Stages, Burn penalty,
   * STAB, type effectiveness, random variance, and False Swipe clamp.
   */
  public static calculate(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    options?: {
      rng?: () => number;
      forceCritical?: boolean;
    }
  ): DamageResult {
    // 1. Status moves deal 0 direct damage
    if (move.category === 'Status' || move.power === 0) {
      return {
        damage: 0,
        effectiveness: 1,
        isCritical: false,
        isStab: false,
      };
    }

    const rng = options?.rng || Math.random;

    // 2. Type effectiveness
    const effectiveness = EffectivenessHelper.calculateMultiplier(move.type, defender.types);
    if (effectiveness === 0) {
      return {
        damage: 0,
        effectiveness: 0,
        isCritical: false,
        isStab: false,
      };
    }

    // 3. Critical hit check (~6.25% base or forced)
    const isCritical = options?.forceCritical ?? rng() < 0.0625;
    const criticalMult = isCritical ? 1.5 : 1.0;

    // 4. Attack and Defense based on Gen 4+ Split + Stat Stages
    // Authentic rule: Critical hits ignore attacker's negative stages and defender's positive stages
    let attackStat: number;
    let defenseStat: number;

    if (move.category === 'Physical') {
      const rawAtkStage = attacker.statStages?.atk ?? 0;
      const rawDefStage = defender.statStages?.def ?? 0;
      const atkStage = isCritical ? Math.max(0, rawAtkStage) : rawAtkStage;
      const defStage = isCritical ? Math.min(0, rawDefStage) : rawDefStage;
      attackStat = attacker.stats.attack * this.getStatStageMultiplier(atkStage);
      defenseStat = defender.stats.defense * this.getStatStageMultiplier(defStage);
    } else {
      const rawSpaStage = attacker.statStages?.spa ?? 0;
      const rawSpdStage = defender.statStages?.spd ?? 0;
      const spaStage = isCritical ? Math.max(0, rawSpaStage) : rawSpaStage;
      const spdStage = isCritical ? Math.min(0, rawSpdStage) : rawSpdStage;
      attackStat = attacker.stats.spAttack * this.getStatStageMultiplier(spaStage);
      defenseStat = defender.stats.spDefense * this.getStatStageMultiplier(spdStage);
    }

    // Safeguard against divide by zero
    defenseStat = Math.max(1, defenseStat);

    // 5. STAB (Same-Type Attack Bonus) & Burn Physical Penalty
    const isStab = attacker.types.includes(move.type);
    const stabMult = isStab ? 1.5 : 1.0;
    const burnMult = move.category === 'Physical' && attacker.status === 'BRN' && !move.leavesOneHp ? 0.5 : 1.0;

    // 6. Base damage formula
    const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
    const baseDamage = Math.floor((levelFactor * move.power * (attackStat / defenseStat)) / 50) + 2;

    // 7. Modifiers (Critical, STAB, Burn, Type Effectiveness, Random [0.85, 1.00])
    const randomFactor = 0.85 + rng() * 0.15;
    let totalDamage = Math.floor(
      baseDamage * criticalMult * stabMult * burnMult * effectiveness * randomFactor
    );

    // Guaranteed at least 1 damage if not immune
    totalDamage = Math.max(1, totalDamage);

    // 8. False Swipe clamp (leaves target with at least 1 HP)
    if (move.leavesOneHp) {
      const maxAllowedDamage = Math.max(0, defender.currentHp - 1);
      totalDamage = Math.min(totalDamage, maxAllowedDamage);
    }

    return {
      damage: totalDamage,
      effectiveness,
      isCritical,
      isStab,
    };
  }
}
