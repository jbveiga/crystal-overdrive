import { describe, it, expect } from 'vitest';
import { DamageCalculator } from '../src/battle/DamageCalculator';
import { EffectivenessHelper } from '../src/battle/EffectivenessHelper';
import { PokemonFactory } from '../src/battle/PokemonFactory';

describe('EffectivenessHelper', () => {
  it('identifies super effective moves correctly (Fire vs Grass = 2x)', () => {
    const ember = PokemonFactory.getMoveData('ember');
    const chikorita = PokemonFactory.create('chikorita', 5);
    const badge = EffectivenessHelper.evaluate(ember, chikorita);

    expect(badge.multiplier).toBe(2);
    expect(badge.label).toBe('2x SUPER');
  });

  it('identifies ultra effective moves against dual types (Water vs Fire/Rock = 4x)', () => {
    const waterGun = PokemonFactory.getMoveData('watergun');
    const magcargo = PokemonFactory.create('magcargo', 30);
    const badge = EffectivenessHelper.evaluate(waterGun, magcargo);

    expect(badge.multiplier).toBe(4);
    expect(badge.label).toBe('4x ULTRA');
  });

  it('identifies resisted moves correctly (Fire vs Water = 0.5x)', () => {
    const ember = PokemonFactory.getMoveData('ember');
    const totodile = PokemonFactory.create('totodile', 5);
    const badge = EffectivenessHelper.evaluate(ember, totodile);

    expect(badge.multiplier).toBe(0.5);
    expect(badge.label).toBe('0.5x RESIST');
  });

  it('identifies immunities (Electric vs Ground = 0x)', () => {
    const thunderShock = PokemonFactory.getMoveData('thundershock');
    const geodude = PokemonFactory.create('geodude', 5);
    const badge = EffectivenessHelper.evaluate(thunderShock, geodude);

    expect(badge.multiplier).toBe(0);
    expect(badge.label).toBe('0x IMMUNE');
  });

  it('identifies status move immunities (Thunder Wave vs Ground = 0x IMMUNE)', () => {
    const thunderWave = PokemonFactory.getMoveData('thunderwave');
    const geodude = PokemonFactory.create('geodude', 5);
    const badge = EffectivenessHelper.evaluate(thunderWave, geodude);

    expect(badge.multiplier).toBe(0);
    expect(badge.label).toBe('0x IMMUNE');
  });
});

describe('DamageCalculator', () => {
  it('applies Gen 4+ Physical/Special split correctly', () => {
    const cyndaquil = PokemonFactory.create('cyndaquil', 20);
    const sentret = PokemonFactory.create('sentret', 20);

    // Give cyndaquil boosted Special Attack and lower Physical Attack
    cyndaquil.stats.spAttack = 100;
    cyndaquil.stats.attack = 30;
    sentret.stats.defense = 40;
    sentret.stats.spDefense = 40;

    const flamethrower = PokemonFactory.getMoveData('flamethrower'); // Special
    const firePunch = PokemonFactory.getMoveData('firepunch'); // Physical (Gen 4+!)

    // Both have similar base power (Flamethrower 90, Fire Punch 75)
    // Because SpAttack is 100 vs Attack 30, Flamethrower should do far more damage
    const specialRes = DamageCalculator.calculate(cyndaquil, sentret, flamethrower, {
      rng: () => 1.0,
      forceCritical: false,
    });
    const physicalRes = DamageCalculator.calculate(cyndaquil, sentret, firePunch, {
      rng: () => 1.0,
      forceCritical: false,
    });

    expect(specialRes.damage).toBeGreaterThan(physicalRes.damage * 2);
  });

  it('applies STAB (Same-Type Attack Bonus) 1.5x multiplier', () => {
    const cyndaquil = PokemonFactory.create('cyndaquil', 10);
    const sentret = PokemonFactory.create('sentret', 10);

    // Swift (Normal) vs Ember (Fire - STAB on Cyndaquil)
    const swift = PokemonFactory.getMoveData('swift'); // 60 power, Special
    const ember = PokemonFactory.getMoveData('ember'); // 40 power, Special -> with 1.5 STAB behaves like 60 power!

    const swiftRes = DamageCalculator.calculate(cyndaquil, sentret, swift, {
      rng: () => 1.0,
      forceCritical: false,
    });
    const emberRes = DamageCalculator.calculate(cyndaquil, sentret, ember, {
      rng: () => 1.0,
      forceCritical: false,
    });

    expect(swiftRes.isStab).toBe(false);
    expect(emberRes.isStab).toBe(true);
    expect(emberRes.damage).toBeCloseTo(swiftRes.damage, -1);
  });

  it('never reduces HP below 1 when move.leavesOneHp is true (False Swipe)', () => {
    const highLevelAttacker = PokemonFactory.create('cyndaquil', 50);
    const weakDefender = PokemonFactory.create('pidgey', 2);
    weakDefender.currentHp = 10;

    const falseSwipe = PokemonFactory.getMoveData('falseswipe');
    expect(falseSwipe.leavesOneHp).toBe(true);

    const result = DamageCalculator.calculate(highLevelAttacker, weakDefender, falseSwipe, {
      rng: () => 1.0,
    });

    // Defender had 10 HP, so max damage allowed is 10 - 1 = 9
    expect(result.damage).toBe(9);
  });
});
