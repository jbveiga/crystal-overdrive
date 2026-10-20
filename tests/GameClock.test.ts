import { describe, it, expect } from 'vitest';
import { GameClock } from '../src/core/GameClock';

describe('GameClock', () => {
  it('initializes with default 1x speeds', () => {
    const clock = new GameClock();
    expect(clock.playerSpeed).toBe(1);
    expect(clock.battleSpeed).toBe(1);
  });

  it('cycles player speed correctly (1 -> 2 -> 3 -> 4 -> 1)', () => {
    const clock = new GameClock();
    expect(clock.cyclePlayerSpeed()).toBe(2);
    expect(clock.cyclePlayerSpeed()).toBe(3);
    expect(clock.cyclePlayerSpeed()).toBe(4);
    expect(clock.cyclePlayerSpeed()).toBe(1);
  });

  it('cycles battle speed correctly (1 -> 2 -> 3 -> 4 -> 1)', () => {
    const clock = new GameClock();
    expect(clock.cycleBattleSpeed()).toBe(2);
    expect(clock.cycleBattleSpeed()).toBe(3);
    expect(clock.cycleBattleSpeed()).toBe(4);
    expect(clock.cycleBattleSpeed()).toBe(1);
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
    expect(overdriveDeltas.dtBattle).toBeCloseTo(0.064);
  });

  it('clamps large delta time spikes to 100ms (0.1s)', () => {
    const clock = new GameClock(1, 1);
    const spikeDt = 0.5; // 500ms lag spike
    const deltas = clock.tick(spikeDt);

    expect(deltas.dtWorld).toBe(0.1);
    expect(deltas.dtPlayer).toBe(0.1);
    expect(deltas.dtBattle).toBe(0.1);
  });
});
