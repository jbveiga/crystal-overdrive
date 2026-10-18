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
   * Calculates Gen 4+ damage with Physical/Special split, STAB, type effectiveness,
   * random variance, and False Swipe clamp.
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

    // 3. Attack and Defense based on Gen 4+ Split
    let attackStat: number;
    let defenseStat: number;

    if (move.category === 'Physical') {
      attackStat = attacker.stats.attack;
      defenseStat = defender.stats.defense;
    } else {
      attackStat = attacker.stats.spAttack;
      defenseStat = defender.stats.spDefense;
    }

    // Safeguard against divide by zero
    defenseStat = Math.max(1, defenseStat);

    // 4. Critical hit check (~6.25% base or forced)
    const isCritical = options?.forceCritical ?? rng() < 0.0625;
    const criticalMult = isCritical ? 1.5 : 1.0;

    // 5. STAB (Same-Type Attack Bonus)
    const isStab = attacker.types.includes(move.type);
    const stabMult = isStab ? 1.5 : 1.0;

    // 6. Base damage formula
    const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
    const baseDamage = Math.floor((levelFactor * move.power * (attackStat / defenseStat)) / 50) + 2;

    // 7. Modifiers (Critical, STAB, Type Effectiveness, Random [0.85, 1.00])
    const randomFactor = 0.85 + rng() * 0.15;
    let totalDamage = Math.floor(
      baseDamage * criticalMult * stabMult * effectiveness * randomFactor
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
