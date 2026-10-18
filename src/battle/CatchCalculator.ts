import type { PokemonInstance, PokeballId } from '../types/game';

export interface CatchAttemptResult {
  caught: boolean;
  shakes: 0 | 1 | 2 | 3 | 4;
  ballMultiplier: number;
  captureValue: number;
}

export interface CatchContext {
  turnNumber: number;
  isNight?: boolean;
  isCave?: boolean;
  isSpeciesRegistered?: boolean;
}

export class CatchCalculator {
  /**
   * Calculates the specific Pokéball multiplier based on battle context and target Pokémon
   */
  public static getBallMultiplier(
    ballId: PokeballId,
    target: PokemonInstance,
    context: CatchContext
  ): number {
    switch (ballId) {
      case 'master-ball':
        return 255.0;

      case 'ultra-ball':
        return 2.0;

      case 'great-ball':
        return 1.5;

      case 'quick-ball':
        return context.turnNumber === 1 ? 5.0 : 1.0;

      case 'net-ball':
        return target.types.includes('Water') || target.types.includes('Bug') ? 3.5 : 1.0;

      case 'nest-ball':
        return Math.max(1.0, (41 - target.level) / 10);

      case 'dusk-ball':
        return context.isNight || context.isCave ? 3.0 : 1.0;

      case 'timer-ball':
        return Math.min(4.0, 1.0 + 0.3 * context.turnNumber);

      case 'repeat-ball':
        return context.isSpeciesRegistered ? 3.5 : 1.0;

      case 'fast-ball':
        return target.baseStats.speed >= 100 ? 4.0 : 1.0;

      case 'dream-ball':
        return target.status === 'SLP' ? 4.0 : 1.0;

      case 'poke-ball':
      default:
        return 1.0;
    }
  }

  /**
   * Executes the full Gen 4+ modified catch check with 4-shake validation
   */
  public static attemptCatch(
    ballId: PokeballId,
    target: PokemonInstance,
    context: CatchContext,
    rng: () => number = Math.random
  ): CatchAttemptResult {
    const ballMultiplier = this.getBallMultiplier(ballId, target, context);

    if (ballId === 'master-ball') {
      return {
        caught: true,
        shakes: 4,
        ballMultiplier,
        captureValue: 255,
      };
    }

    // Status modifier
    let statusMod = 1.0;
    if (target.status === 'SLP' || target.status === 'FRZ') {
      statusMod = 2.5;
    } else if (target.status === 'PAR' || target.status === 'BRN' || target.status === 'PSN') {
      statusMod = 1.5;
    }

    const hpMax = target.stats.hp;
    const hpCurr = target.currentHp;
    const catchRate = target.catchRate;

    // Modified catch rate X
    const numerator = (3 * hpMax - 2 * hpCurr) * catchRate * ballMultiplier;
    const baseValue = Math.floor(numerator / (3 * hpMax));
    const X = Math.min(255, Math.floor(baseValue * statusMod));

    // Guaranteed catch check
    if (X >= 255) {
      return {
        caught: true,
        shakes: 4,
        ballMultiplier,
        captureValue: 255,
      };
    }

    // Shake probability threshold Y
    const Y = Math.floor(65536 * Math.pow(X / 255, 0.75));

    // Perform 4 shake checks
    let successfulShakes: 0 | 1 | 2 | 3 | 4 = 0;
    for (let i = 0; i < 4; i++) {
      const roll = Math.floor(rng() * 65536);
      if (roll < Y) {
        successfulShakes = (successfulShakes + 1) as 0 | 1 | 2 | 3 | 4;
      } else {
        break; // Failed this shake
      }
    }

    return {
      caught: successfulShakes === 4,
      shakes: successfulShakes,
      ballMultiplier,
      captureValue: X,
    };
  }
}
