import { describe, it, expect } from 'vitest';
import { CatchCalculator } from '../src/battle/CatchCalculator';
import { PokemonFactory } from '../src/battle/PokemonFactory';

describe('CatchCalculator', () => {
  it('gives Quick Ball 5.0x multiplier on Turn 1 and 1.0x on Turn 2', () => {
    const pidgey = PokemonFactory.create('pidgey', 3);

    const multTurn1 = CatchCalculator.getBallMultiplier('quick-ball', pidgey, { turnNumber: 1 });
    const multTurn2 = CatchCalculator.getBallMultiplier('quick-ball', pidgey, { turnNumber: 2 });

    expect(multTurn1).toBe(5.0);
    expect(multTurn2).toBe(1.0);
  });

  it('gives Fast Ball 4.0x multiplier against high-speed Pokémon (Base Speed >= 100)', () => {
    const raikou = PokemonFactory.create('raikou', 40); // Base speed 115
    const chikorita = PokemonFactory.create('chikorita', 5); // Base speed 45

    const raikouMult = CatchCalculator.getBallMultiplier('fast-ball', raikou, { turnNumber: 1 });
    const chikoritaMult = CatchCalculator.getBallMultiplier('fast-ball', chikorita, { turnNumber: 1 });

    expect(raikouMult).toBe(4.0);
    expect(chikoritaMult).toBe(1.0);
  });

  it('gives Net Ball 3.5x multiplier against Water or Bug Pokémon (Suicune)', () => {
    const suicune = PokemonFactory.create('suicune', 40); // Pure Water
    const entei = PokemonFactory.create('entei', 40); // Pure Fire

    const suicuneMult = CatchCalculator.getBallMultiplier('net-ball', suicune, { turnNumber: 1 });
    const enteiMult = CatchCalculator.getBallMultiplier('net-ball', entei, { turnNumber: 1 });

    expect(suicuneMult).toBe(3.5);
    expect(enteiMult).toBe(1.0);
  });

  it('gives Dream Ball 4.0x multiplier when target is asleep', () => {
    const target = PokemonFactory.create('sentret', 3);
    target.status = 'SLP';

    const asleepMult = CatchCalculator.getBallMultiplier('dream-ball', target, { turnNumber: 1 });
    target.status = 'NONE';
    const awakeMult = CatchCalculator.getBallMultiplier('dream-ball', target, { turnNumber: 1 });

    expect(asleepMult).toBe(4.0);
    expect(awakeMult).toBe(1.0);
  });

  it('guarantees Master Ball capture regardless of HP or status', () => {
    const fullHpRaikou = PokemonFactory.create('raikou', 40);
    const result = CatchCalculator.attemptCatch('master-ball', fullHpRaikou, { turnNumber: 1 });

    expect(result.caught).toBe(true);
    expect(result.shakes).toBe(4);
    expect(result.captureValue).toBe(255);
  });

  it('increases capture value when target has low HP and is asleep', () => {
    const target = PokemonFactory.create('sentret', 3);
    target.currentHp = target.stats.hp;
    target.status = 'NONE';

    const fullHpResult = CatchCalculator.attemptCatch('poke-ball', target, { turnNumber: 1 }, () => 0.0);

    // Apply False Swipe and Sleep
    target.currentHp = 1;
    target.status = 'SLP';
    const lowHpAsleepResult = CatchCalculator.attemptCatch('poke-ball', target, { turnNumber: 1 }, () => 0.0);

    expect(lowHpAsleepResult.captureValue).toBeGreaterThan(fullHpResult.captureValue * 2);
  });
});
