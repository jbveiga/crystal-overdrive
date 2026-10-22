import { describe, it, expect } from 'vitest';
import { GameClock } from '../src/core/GameClock';

describe('GameClock', () => {
  it('initializes with 3x player speed and 1x battle speed', () => {
    const clock = new GameClock();
    expect(clock.playerSpeed).toBe(3);
    expect(clock.battleSpeed).toBe(1);
  });

  it('cycles player speed correctly (1 -> 2 -> 3 -> 4 -> 1)', () => {
    const clock = new GameClock(1, 1);
    expect(clock.cyclePlayerSpeed()).toBe(2);
    expect(clock.cyclePlayerSpeed()).toBe(3);
    expect(clock.cyclePlayerSpeed()).toBe(4);
    expect(clock.cyclePlayerSpeed()).toBe(1);
  });

  it('cycles battle speed capped at 3x (1 -> 2 -> 3 -> 1) and clamps higher values', () => {
    const clock = new GameClock();
    expect(clock.cycleBattleSpeed()).toBe(2);
    expect(clock.cycleBattleSpeed()).toBe(3);
    expect(clock.cycleBattleSpeed()).toBe(1);
    clock.battleSpeed = 4;
    expect(clock.battleSpeed).toBe(3);
    expect(new GameClock(1, 4).battleSpeed).toBe(3);
  });

  it('decouples world, player, and battle delta times based on multipliers (including 4x Overdrive)', () => {
    const clock = new GameClock(2, 3);
    const rawDt = 0.016; // ~60fps frame
    const deltas = clock.tick(rawDt);

    expect(deltas.dtWorld).toBeCloseTo(0.016);
    expect(deltas.dtPlayer).toBeCloseTo(0.032);
    expect(deltas.dtBattle).toBeCloseTo(0.048);

    clock.playerSpeed = 4;
    clock.battleSpeed = 4;
    const overdriveDeltas = clock.tick(rawDt);
    expect(overdriveDeltas.dtWorld).toBeCloseTo(0.016);
    expect(overdriveDeltas.dtPlayer).toBeCloseTo(0.064);
    expect(overdriveDeltas.dtBattle).toBeCloseTo(0.048);
  });

  it('clamps large delta time spikes to 100ms (0.1s)', () => {
    const clock = new GameClock(1, 1);
    const spikeDt = 0.5; // 500ms lag spike
    const deltas = clock.tick(spikeDt);

    expect(deltas.dtWorld).toBe(0.1);
    expect(deltas.dtPlayer).toBe(0.1);
    expect(deltas.dtBattle).toBe(0.1);
  });

  it('calculates authentic Johto time of day and simulated hours (Ticket 6.2)', () => {
    const clock = new GameClock();

    // Morning: 04:00 - 09:59
    clock.setSimulatedHour(4);
    expect(clock.getTimeOfDay()).toBe('MORNING');
    clock.setSimulatedHour(9);
    expect(clock.getTimeOfDay()).toBe('MORNING');

    // Day: 10:00 - 17:59
    clock.setSimulatedHour(10);
    expect(clock.getTimeOfDay()).toBe('DAY');
    clock.setSimulatedHour(14);
    expect(clock.getTimeOfDay()).toBe('DAY');
    clock.setSimulatedHour(17);
    expect(clock.getTimeOfDay()).toBe('DAY');

    // Night: 18:00 - 03:59
    clock.setSimulatedHour(18);
    expect(clock.getTimeOfDay()).toBe('NIGHT');
    clock.setSimulatedHour(23);
    expect(clock.getTimeOfDay()).toBe('NIGHT');
    clock.setSimulatedHour(0);
    expect(clock.getTimeOfDay()).toBe('NIGHT');
    clock.setSimulatedHour(3);
    expect(clock.getTimeOfDay()).toBe('NIGHT');
  });

  it('provides ambient lighting tint parameters for morning, day, and night (Ticket 6.2)', () => {
    const morningTint = GameClock.getAmbientTint('MORNING');
    expect(morningTint.color).toBe(0xfbbf24);
    expect(morningTint.alpha).toBeCloseTo(0.12);

    const dayTint = GameClock.getAmbientTint('DAY');
    expect(dayTint.alpha).toBe(0.0);

    const nightTint = GameClock.getAmbientTint('NIGHT');
    expect(nightTint.color).toBe(0x0f172a);
    expect(nightTint.alpha).toBeCloseTo(0.38);
  });
});
