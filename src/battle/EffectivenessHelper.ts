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

  /**
   * Returns the Unbound-style 2x2 Move Matrix effectiveness pill visual metadata (Ticket 3.9).
   */
  public static getPillStyle(
    multiplier: number,
    isStatus: boolean = false
  ): {
    label: string;
    background: string;
    pulse: boolean;
    strikethrough: boolean;
  } {
    if (multiplier === 0) {
      return {
        label: '0x IMMUNE',
        background: '#dc2626',
        pulse: false,
        strikethrough: true,
      };
    }
    if (isStatus) {
      return {
        label: 'STATUS',
        background: 'rgba(100, 116, 139, 0.45)',
        pulse: false,
        strikethrough: false,
      };
    }
    if (multiplier >= 4) {
      return {
        label: '4x ULTRA',
        background: '#ec4899',
        pulse: true,
        strikethrough: false,
      };
    }
    if (multiplier >= 2) {
      return {
        label: '2x SUPER',
        background: '#16a34a',
        pulse: false,
        strikethrough: false,
      };
    }
    if (multiplier <= 0.25) {
      return {
        label: '0.25x RESIST',
        background: '#b45309',
        pulse: false,
        strikethrough: false,
      };
    }
    if (multiplier <= 0.5) {
      return {
        label: '0.5x NOT VERY',
        background: '#d97706',
        pulse: false,
        strikethrough: false,
      };
    }
    return {
      label: '1x NORMAL',
      background: 'rgba(100, 116, 139, 0.45)',
      pulse: false,
      strikethrough: false,
    };
  }

  /**
   * Computes hit shake amplitude, base duration, and flash tint color for `BattleRenderer.animateDamage` (Ticket 3.9).
   */
  public static getDamageShakeSpec(
    effectiveness: number = 1,
    isCritical: boolean = false,
    moveCategory: 'Physical' | 'Special' | 'Status' = 'Physical'
  ): {
    amplitude: number;
    durationSec: number;
    flashTint: number;
    screenWhiteFlash: boolean;
  } {
    const isSuperOrCrit = isCritical || effectiveness >= 2;
    if (isSuperOrCrit) {
      return {
        amplitude: 8,
        durationSec: 0.22,
        flashTint: moveCategory === 'Physical' && !isCritical && effectiveness < 2 ? 0xef4444 : 0xffffff,
        screenWhiteFlash: true,
      };
    }
    if (effectiveness < 1) {
      return {
        amplitude: 2,
        durationSec: 0.1,
        flashTint: moveCategory === 'Special' ? 0xffffff : 0xef4444,
        screenWhiteFlash: false,
      };
    }
    return {
      amplitude: 4,
      durationSec: 0.15,
      flashTint: moveCategory === 'Special' ? 0xffffff : 0xef4444,
      screenWhiteFlash: false,
    };
  }

  /**
   * Resolves authentic Pokéball cap color, accent color, and sprite asset path for `BattleRenderer.animateThrowBall` (Ticket 3.9).
   */
  public static getPokeballPalette(ballId: string = 'poke-ball'): {
    normalizedId: string;
    topColor: number;
    accentColor: number;
    bottomColor: number;
    spritePath: string;
  } {
    const normalizedId = ballId.replace(/_/g, '-').toLowerCase();
    const table: Record<string, { topColor: number; accentColor: number; bottomColor: number }> = {
      'poke-ball': { topColor: 0xdc2626, accentColor: 0xef4444, bottomColor: 0xf8fafc },
      'great-ball': { topColor: 0x2563eb, accentColor: 0xef4444, bottomColor: 0xf8fafc },
      'ultra-ball': { topColor: 0x1e293b, accentColor: 0xfacc15, bottomColor: 0xf8fafc },
      'master-ball': { topColor: 0x7e22ce, accentColor: 0xec4899, bottomColor: 0xf8fafc },
      'quick-ball': { topColor: 0x0284c7, accentColor: 0xfacc15, bottomColor: 0x0284c7 },
      'fast-ball': { topColor: 0xea580c, accentColor: 0xfacc15, bottomColor: 0xf8fafc },
      'net-ball': { topColor: 0x0d9488, accentColor: 0x1e293b, bottomColor: 0xf8fafc },
      'dusk-ball': { topColor: 0x15803d, accentColor: 0xd97706, bottomColor: 0x1e293b },
      'timer-ball': { topColor: 0xf8fafc, accentColor: 0xdc2626, bottomColor: 0xf8fafc },
      'repeat-ball': { topColor: 0xdc2626, accentColor: 0xfacc15, bottomColor: 0xf8fafc },
      'nest-ball': { topColor: 0x65a30d, accentColor: 0xeab308, bottomColor: 0xf8fafc },
      'dream-ball': { topColor: 0xec4899, accentColor: 0xa855f7, bottomColor: 0xfbcfe8 },
    };
    const entry = table[normalizedId] ?? table['poke-ball'];
    return {
      normalizedId,
      ...entry,
      spritePath: `./assets/sprites/items/${normalizedId}.png`,
    };
  }
}
