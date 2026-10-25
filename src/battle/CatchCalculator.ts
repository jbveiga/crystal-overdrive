import type { PokemonInstance, PokeballId } from '../types/game';

export interface CatchAttemptResult {
  caught: boolean;
  shakes: 0 | 1 | 2 | 3 | 4;
  ballMultiplier: number;
  captureValue: number;
  baseFriendship?: number;
}

export interface CatchContext {
  turnNumber: number;
  isNight?: boolean;
  isCave?: boolean;
  isSpeciesRegistered?: boolean;
  isFishing?: boolean;
  playerLevel?: number;
  playerPokemon?: PokemonInstance;
  playerSpeciesId?: string;
  playerGender?: 'M' | 'F' | 'N';
  targetGender?: 'M' | 'F' | 'N';
  isOppositeGender?: boolean;
  isRoamer?: boolean;
  targetWeightKg?: number;
}

export const MOON_STONE_EVOLVERS = new Set([
  'nidoran_f',
  'nidoran-f',
  'nidorina',
  'nidoran_m',
  'nidoran-m',
  'nidorino',
  'clefairy',
  'jigglypuff',
]);

export class CatchCalculator {
  /**
   * Returns flat catch rate modifier for Heavy Ball based on target weight in kg (Gen 2 crystal canon)
   */
  public static getHeavyBallModifier(weightKg: number): number {
    if (weightKg >= 300) return 30;
    if (weightKg >= 200) return 20;
    if (weightKg >= 100) return 0;
    return -20;
  }

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

      case 'fast-ball': {
        const isRoamer = Boolean(
          context.isRoamer || ['raikou', 'entei', 'suicune'].includes(target.speciesId.toLowerCase())
        );
        return (target.baseStats?.speed ?? 0) >= 100 || isRoamer ? 4.0 : 1.0;
      }

      case 'dream-ball':
        return target.status === 'SLP' ? 4.0 : 1.0;

      case 'level-ball': {
        const playerLvl = context.playerLevel ?? context.playerPokemon?.level ?? 1;
        const targetLvl = target.level || 1;
        if (playerLvl <= targetLvl) return 1.0;
        if (playerLvl >= 4 * targetLvl) return 8.0;
        if (playerLvl >= 2 * targetLvl) return 4.0;
        return 2.0;
      }

      case 'lure-ball':
        return context.isFishing ? 3.0 : 1.0;

      case 'moon-ball': {
        const sId = target.speciesId.toLowerCase().replace(/-/g, '_');
        return MOON_STONE_EVOLVERS.has(sId) || MOON_STONE_EVOLVERS.has(target.speciesId.toLowerCase())
          ? 4.0
          : 1.0;
      }

      case 'friend-ball':
        return 1.0;

      case 'heavy-ball':
        return 1.0; // Flat catch rate addition handled in attemptCatch

      case 'love-ball': {
        const pSpecies = (context.playerSpeciesId || context.playerPokemon?.speciesId || '').toLowerCase();
        const tSpecies = target.speciesId.toLowerCase();
        const sameSpecies = Boolean(pSpecies && pSpecies === tSpecies);

        const pGender = context.playerGender || (context.playerPokemon as any)?.gender;
        const tGender = context.targetGender || (target as any)?.gender;
        const oppositeGender =
          Boolean(context.isOppositeGender) ||
          Boolean(pGender && tGender && pGender !== 'N' && tGender !== 'N' && pGender !== tGender);

        return sameSpecies && oppositeGender ? 8.0 : 1.0;
      }

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

    let baseCatchRate = target.catchRate;
    if (ballId === 'heavy-ball') {
      const weight = context.targetWeightKg ?? (target as any).weightKg ?? 50;
      const mod = this.getHeavyBallModifier(weight);
      baseCatchRate = Math.max(1, Math.min(255, baseCatchRate + mod));
    }

    // Modified catch rate X
    const numerator = (3 * hpMax - 2 * hpCurr) * baseCatchRate * ballMultiplier;
    const baseValue = Math.floor(numerator / (3 * hpMax));
    const X = Math.min(255, Math.floor(baseValue * statusMod));

    // Guaranteed catch check
    if (X >= 255) {
      return {
        caught: true,
        shakes: 4,
        ballMultiplier,
        captureValue: 255,
        baseFriendship: ballId === 'friend-ball' ? 200 : undefined,
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

    const caught = successfulShakes === 4;

    return {
      caught,
      shakes: successfulShakes,
      ballMultiplier,
      captureValue: X,
      baseFriendship: caught && ballId === 'friend-ball' ? 200 : undefined,
    };
  }
}

