import type { PokemonType, MoveData, PokemonInstance, EffectivenessBadge } from '../types/game';

// Multiplier chart: TypeChart[attackingType][defendingType]
export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  Normal: {
    Rock: 0.5,
    Ghost: 0,
    Steel: 0.5,
  },
  Fire: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 2,
    Bug: 2,
    Rock: 0.5,
    Dragon: 0.5,
    Steel: 2,
  },
  Water: {
    Fire: 2,
    Water: 0.5,
    Grass: 0.5,
    Ground: 2,
    Rock: 2,
    Dragon: 0.5,
  },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5,
  },
  Electric: {
    Water: 2,
    Grass: 0.5,
    Electric: 0.5,
    Ground: 0,
    Flying: 2,
    Dragon: 0.5,
  },
  Ice: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 0.5,
    Ground: 2,
    Flying: 2,
    Dragon: 2,
    Steel: 0.5,
  },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
  },
  Poison: {
    Grass: 2,
    Poison: 0.5,
    Ground: 0.5,
    Rock: 0.5,
    Ghost: 0.5,
    Steel: 0,
  },
  Ground: {
    Fire: 2,
    Electric: 2,
    Grass: 0.5,
    Poison: 2,
    Flying: 0,
    Bug: 0.5,
    Rock: 2,
    Steel: 2,
  },
  Flying: {
    Electric: 0.5,
    Grass: 2,
    Fighting: 2,
    Bug: 2,
    Rock: 0.5,
    Steel: 0.5,
  },
  Psychic: {
    Fighting: 2,
    Poison: 2,
    Psychic: 0.5,
    Dark: 0,
    Steel: 0.5,
  },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
  },
  Rock: {
    Fire: 2,
    Ice: 2,
    Fighting: 0.5,
    Ground: 0.5,
    Flying: 2,
    Bug: 2,
    Steel: 0.5,
  },
  Ghost: {
    Normal: 0,
    Psychic: 2,
    Ghost: 2,
    Dark: 0.5,
    Steel: 0.5,
  },
  Dragon: {
    Dragon: 2,
    Steel: 0.5,
  },
  Steel: {
    Fire: 0.5,
    Water: 0.5,
    Electric: 0.5,
    Ice: 2,
    Rock: 2,
    Steel: 0.5,
  },
  Dark: {
    Fighting: 0.5,
    Psychic: 2,
    Ghost: 2,
    Dark: 0.5,
    Steel: 0.5,
  },
};

export class EffectivenessHelper {
  /**
   * Calculates elemental type multiplier against a single type or dual-type Pokémon
   */
  public static calculateMultiplier(attackType: PokemonType, defenderTypes: PokemonType[]): number {
    let mult = 1.0;
    for (const defType of defenderTypes) {
      const typeMod = TYPE_CHART[attackType]?.[defType];
      if (typeMod !== undefined) {
        mult *= typeMod;
      }
    }
    return mult;
  }

  /**
   * Evaluates a move against a defending Pokémon and generates the Unbound Live Effectiveness Badge
   */
  public static evaluate(move: MoveData, defender: PokemonInstance): EffectivenessBadge {
    // 1. Status Move checks (Immunities)
    if (move.category === 'Status') {
      // Thunder Wave vs Ground
      if (move.type === 'Electric' && defender.types.includes('Ground')) {
        return { multiplier: 0, label: '0x IMMUNE', colorClass: 'badge-immune' };
      }
      // Poison status vs Poison or Steel
      if (move.type === 'Poison' && (defender.types.includes('Poison') || defender.types.includes('Steel'))) {
        return { multiplier: 0, label: '0x IMMUNE', colorClass: 'badge-immune' };
      }
      // General status move
      return { multiplier: 1, label: 'STATUS', colorClass: 'badge-status' };
    }

    // 2. Damaging Move multiplier
    const rawMult = this.calculateMultiplier(move.type, defender.types);

    if (rawMult === 0) {
      return { multiplier: 0, label: '0x IMMUNE', colorClass: 'badge-immune' };
    }
    if (rawMult >= 4) {
      return { multiplier: 4, label: '4x ULTRA', colorClass: 'badge-ultra' };
    }
    if (rawMult >= 2) {
      return { multiplier: 2, label: '2x SUPER', colorClass: 'badge-super' };
    }
    if (rawMult <= 0.25) {
      return { multiplier: 0.25, label: '0.25x RESIST', colorClass: 'badge-resist' };
    }
    if (rawMult <= 0.5) {
      return { multiplier: 0.5, label: '0.5x RESIST', colorClass: 'badge-resist' };
    }

    return { multiplier: 1, label: '1x NORMAL', colorClass: 'badge-normal' };
  }
}
