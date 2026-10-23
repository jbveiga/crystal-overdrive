import { describe, it, expect } from 'vitest';
import { MapManager } from '../src/world/MapManager';
import { GridPhysics, type GridEntity } from '../src/world/GridPhysics';
import { BattleStateMachine } from '../src/battle/BattleStateMachine';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { MART_REPEL_CATALOG } from '../src/ui/BagAndMartUI';
import type { MapData } from '../src/types/game';

const createMockGrassMap = (id: string = 'route_29'): MapData => ({
  id,
  name: 'Route 29',
  width: 10,
  height: 10,
  tileSize: 64,
  groundLayer: new Array(100).fill(0),
  objectLayer: new Array(100).fill(0),
  collisionGrid: new Array(100).fill(2), // All tall grass
  connections: {},
  warps: [],
  grassEncounters: [
    { speciesId: 'pidgey', minLevel: 2, maxLevel: 4, weight: 50, timeOfDay: 'MORNING' },
    { speciesId: 'sentret', minLevel: 2, maxLevel: 3, weight: 50, timeOfDay: 'DAY' },
    { speciesId: 'hoothoot', minLevel: 2, maxLevel: 4, weight: 50, timeOfDay: 'NIGHT' },
    { speciesId: 'rattata', minLevel: 2, maxLevel: 4, weight: 50, timeOfDay: 'ANY' },
  ],
});

describe('Overworld Encounter Pacing, Repel & Trainer Combat Mechanics', () => {
  it('enforces a guaranteed 4-step grace buffer (0% encounter rate) and ramps up to a 6.25% max cap in tall grass', () => {
    const mm = new MapManager();
    mm.registerMap(createMockGrassMap('route_29'));
    mm.setCurrentMap('route_29');

    // Activate 4-step grace period (post-battle / route entry)
    mm.activateEncounterGracePeriod(4);
    expect(mm.getGraceStepsRemaining()).toBe(4);

    // Steps 1 to 4: Even with rng returning 0.0001, grace buffer guarantees 0% encounters
    for (let s = 1; s <= 4; s++) {
      const res = mm.rollWildEncounter(2, undefined, () => 0.0001, 'DAY');
      expect(res).toBeNull();
      expect(mm.getGraceStepsRemaining()).toBe(4 - s);
    }

    // Step 5 (1st step after grace): threshold is 2.0% (0.02)
    expect(mm.getEncounterProbabilityForStep(1, false)).toBeCloseTo(0.02, 5);
    const step5Miss = mm.rollWildEncounter(2, undefined, () => 0.025, 'DAY');
    expect(step5Miss).toBeNull();

    // Step 6 (2nd step after grace): threshold is 3.5% (0.035)
    expect(mm.getEncounterProbabilityForStep(2, false)).toBeCloseTo(0.035, 5);
    const step6Miss = mm.rollWildEncounter(2, undefined, () => 0.04, 'DAY');
    expect(step6Miss).toBeNull();

    // Step 7 (3rd step after grace): threshold is 5.0% (0.05)
    expect(mm.getEncounterProbabilityForStep(3, false)).toBeCloseTo(0.05, 5);
    const step7Miss = mm.rollWildEncounter(2, undefined, () => 0.055, 'DAY');
    expect(step7Miss).toBeNull();

    // Step 8+ (4th+ step after grace): capped permanently at 6.25% (0.0625)
    expect(mm.getEncounterProbabilityForStep(4, false)).toBeCloseTo(0.0625, 5);
    expect(mm.getEncounterProbabilityForStep(20, false)).toBeCloseTo(0.0625, 5);

    // Roll of 0.07 (> 0.0625) does not trigger
    expect(mm.rollWildEncounter(2, undefined, () => 0.07, 'DAY')).toBeNull();

    // Roll of 0.06 (<= 0.0625) triggers encounter AND automatically resets the 4-step grace period
    const hit = mm.rollWildEncounter(2, undefined, () => 0.06, 'DAY');
    expect(hit).not.toBeNull();
    expect(mm.getGraceStepsRemaining()).toBe(4);

    // Immediately next step is protected again by the 4-step grace buffer (no back-to-back ambush)
    expect(mm.rollWildEncounter(2, undefined, () => 0.0001, 'DAY')).toBeNull();
  });

  it('caps cave encounters at 4.0% in NORMAL mode and supports RELAXED (4.0% grass / 2.5% cave) and CLASSIC (10.0% grass) modes', () => {
    const mm = new MapManager();
    const caveMap = createMockGrassMap('dark_cave');
    caveMap.collisionGrid.fill(0); // Cave floor
    mm.registerMap(caveMap);
    mm.setCurrentMap('dark_cave');

    expect(mm.getMaxEncounterCap(false)).toBeCloseTo(0.0625, 5);
    expect(mm.getMaxEncounterCap(true)).toBeCloseTo(0.04, 5);

    mm.setEncounterRateMode('RELAXED');
    expect(mm.getEncounterRateMode()).toBe('RELAXED');
    expect(mm.getMaxEncounterCap(false)).toBeCloseTo(0.04, 5);
    expect(mm.getMaxEncounterCap(true)).toBeCloseTo(0.025, 5);

    mm.setEncounterRateMode('CLASSIC');
    expect(mm.getMaxEncounterCap(false)).toBeCloseTo(0.10, 5);
    expect(mm.getMaxEncounterCap(true)).toBeCloseTo(0.0625, 5);
  });

  it('suppresses wild encounters while Repel is active and notifies on step expiration', () => {
    const mm = new MapManager();
    mm.registerMap(createMockGrassMap('route_29'));
    mm.setCurrentMap('route_29');

    expect(MART_REPEL_CATALOG.map((r) => r.id)).toEqual(['repel', 'super-repel', 'max-repel']);
    expect(MART_REPEL_CATALOG.map((r) => r.steps)).toEqual([100, 200, 250]);

    mm.setRepelSteps(2);
    expect(mm.getRepelSteps()).toBe(2);

    // Even with rng = 0.0001, Repel blocks wild encounters
    expect(mm.rollWildEncounter(2, undefined, () => 0.0001, 'DAY')).toBeNull();

    const step1 = mm.decrementRepelStep();
    expect(step1).toEqual({ active: true, expiredJustNow: false, remaining: 1 });
    expect(mm.rollWildEncounter(2, undefined, () => 0.0001, 'DAY')).toBeNull();

    const step2 = mm.decrementRepelStep();
    expect(step2).toEqual({ active: false, expiredJustNow: true, remaining: 0 });

    // Once expired, wild encounters can occur again
    const postRepelHit = mm.rollWildEncounter(2, undefined, () => 0.01, 'DAY');
    expect(postRepelHit).not.toBeNull();
  });

  it('validates Trainer line-of-sight raycasting and Gen 2 escape & trainer payout formulas', () => {
    const player: GridEntity = {
      id: 'player',
      x: 5,
      y: 5,
      targetX: 5,
      targetY: 5,
      renderX: 5,
      renderY: 5,
      direction: 'LEFT',
      isMoving: false,
      progress: 0,
      isPlayer: true,
    };

    const trainer: GridEntity = {
      id: 'youngster_joey',
      x: 5,
      y: 2,
      targetX: 5,
      targetY: 2,
      renderX: 5,
      renderY: 2,
      direction: 'DOWN',
      isMoving: false,
      progress: 0,
      isPlayer: false,
      trainerId: 'youngster_joey',
      trainerName: 'Youngster Joey',
      visionRange: 4,
    };

    const defeated = new Set<string>();

    // Clear line of sight (tileType = 0)
    const spotted = GridPhysics.checkTrainerLineOfSight(player, [trainer], defeated, () => 0);
    expect(spotted).toBe(trainer);

    // Blocked by wall at (5, 3)
    const blocked = GridPhysics.checkTrainerLineOfSight(player, [trainer], defeated, (x, y) =>
      x === 5 && y === 3 ? 1 : 0
    );
    expect(blocked).toBeNull();

    // Defeated trainer ignores player
    defeated.add('youngster_joey');
    expect(GridPhysics.checkTrainerLineOfSight(player, [trainer], defeated, () => 0)).toBeNull();

    // Gen 2 Escape calculation & Trainer Payout
    const fastPlayer = PokemonFactory.create('cyndaquil', 15);
    const slowEnemy = PokemonFactory.create('rattata', 4);
    const bsm = new BattleStateMachine(fastPlayer, slowEnemy);
    expect(bsm.calculateEscapeSuccess(() => 0.99)).toBe(true);

    const payout = BattleStateMachine.calculateTrainerPayout([slowEnemy, fastPlayer], 40);
    expect(payout).toBe(600); // 15 * 40
  });
});
