import { describe, it, expect, vi } from 'vitest';
import { MissionManager } from '../src/world/MissionManager';
import { createDefaultMissions } from '../src/world/missionData';

describe('MissionManager & Canonical Quest Progression (Ticket Sprint 11)', () => {
  it('hydrates all 15 Main Story Missions (M01-M15) and 21 Side Missions (S01-S21) with M01 active by default', () => {
    const manager = new MissionManager();
    const allMissions = manager.getMissions('ALL');
    const mainMissions = manager.getMissions('MAIN');
    const sideMissions = manager.getMissions('SIDE');
    const completedMissions = manager.getMissions('COMPLETED');

    expect(allMissions.length).toBe(36);
    expect(mainMissions.length).toBe(15);
    expect(sideMissions.length).toBe(21);
    expect(completedMissions.length).toBe(0);

    const m01 = manager.getMission('M01');
    expect(m01).toBeDefined();
    expect(m01?.title).toBe('A New Beginning');
    expect(m01?.status).toBe('ACTIVE');
    expect(m01?.steps.length).toBe(5);
    expect(m01?.rewards.length).toBeGreaterThan(0);

    const m15 = manager.getMission('M15');
    expect(m15).toBeDefined();
    expect(m15?.title).toBe('The Peak of Legends');
    expect(m15?.status).toBe('LOCKED');
  });

  it('advances steps sequentially and marks mission COMPLETED when final step finishes', () => {
    const onUnlocked = vi.fn();
    const onAdvanced = vi.fn();
    const onCompleted = vi.fn();

    const manager = new MissionManager(createDefaultMissions(), {
      onMissionUnlocked: onUnlocked,
      onMissionAdvanced: onAdvanced,
      onMissionCompleted: onCompleted,
    });

    // Advance M01 steps 0..3 -> stays ACTIVE
    expect(manager.advanceStep('M01')).toBe(true);
    expect(manager.getMission('M01')?.currentStepIndex).toBe(1);
    expect(onAdvanced).toHaveBeenCalledTimes(1);

    expect(manager.advanceStep('M01', 'm01_step_2')).toBe(true);
    expect(manager.advanceStep('M01', 2)).toBe(true);
    expect(manager.advanceStep('M01', 3)).toBe(true);
    expect(manager.getMission('M01')?.status).toBe('ACTIVE');

    // Final step 4 -> transitions to COMPLETED
    expect(manager.advanceStep('M01', 4)).toBe(true);
    expect(manager.getMission('M01')?.status).toBe('COMPLETED');
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(manager.getMissions('COMPLETED').map((m) => m.id)).toContain('M01');
  });

  it('evaluates story flags via checkStoryFlags() to auto-unlock, advance, and complete missions', () => {
    const onUnlocked = vi.fn();
    const onAdvanced = vi.fn();
    const onCompleted = vi.fn();

    const manager = new MissionManager(createDefaultMissions(), {
      onMissionUnlocked: onUnlocked,
      onMissionAdvanced: onAdvanced,
      onMissionCompleted: onCompleted,
    });

    // Choosing starter advances M01 step 1 and unlocks M02, S03, S04
    const res1 = manager.checkStoryFlags(new Set(['starter_chosen']));
    expect(res1.advanced.map((m) => m.id)).toContain('M01');
    expect(res1.newlyUnlocked.map((m) => m.id)).toEqual(expect.arrayContaining(['M02', 'S03', 'S04']));
    expect(manager.getMission('M01')?.steps[0].completed).toBe(true);
    expect(manager.getMission('M02')?.status).toBe('ACTIVE');

    // Defeating Falkner completes M02 and unlocks M03 & S05
    const res2 = manager.checkStoryFlags(new Set(['starter_chosen', 'falkner_defeated']));
    expect(res2.newlyCompleted.map((m) => m.id)).toContain('M02');
    expect(res2.newlyUnlocked.map((m) => m.id)).toEqual(expect.arrayContaining(['M03', 'S05']));
    expect(manager.getMission('M02')?.status).toBe('COMPLETED');
    expect(manager.getMission('M03')?.status).toBe('ACTIVE');
  });

  it('serializes and deserializes mission progression state losslessly', () => {
    const manager1 = new MissionManager();
    manager1.advanceStep('M01', 0);
    manager1.advanceStep('M01', 1);
    manager1.completeMission('S01');
    manager1.unlockMission('M02');

    const snapshot = manager1.serialize();
    expect(snapshot.M01.status).toBe('ACTIVE');
    expect(snapshot.M01.currentStepIndex).toBe(2);
    expect(snapshot.M01.stepsCompleted).toEqual([true, true, false, false, false]);
    expect(snapshot.S01.status).toBe('COMPLETED');
    expect(snapshot.M02.status).toBe('ACTIVE');

    const manager2 = new MissionManager();
    manager2.deserialize(snapshot);

    expect(manager2.getMission('M01')?.currentStepIndex).toBe(2);
    expect(manager2.getMission('M01')?.steps[0].completed).toBe(true);
    expect(manager2.getMission('M01')?.steps[1].completed).toBe(true);
    expect(manager2.getMission('M01')?.steps[2].completed).toBe(false);
    expect(manager2.getMission('S01')?.status).toBe('COMPLETED');
    expect(manager2.getMission('M02')?.status).toBe('ACTIVE');
  });

  it('registers Mission 3 Step 1 (m03_step_1) when entering azalea_town and completes S03 & S04', () => {
    const manager = new MissionManager();
    const flags = new Set<string>(['starter_chosen', 'falkner_defeated']);
    manager.checkStoryFlags(flags);

    const m03 = manager.getMission('M03');
    expect(m03?.status).toBe('ACTIVE');
    expect(m03?.steps[0].completed).toBe(false);

    manager.registerMapEntry('azalea_town', flags);
    expect(flags.has('entered_azalea_town')).toBe(true);
    expect(m03?.steps[0].completed).toBe(true);
    expect(m03?.currentStepIndex).toBe(1);

    // Side Mission S03 (Kyle's Onix trade) & Side Mission S04 (Earl's Academy)
    flags.add('traded_onix_rocky');
    flags.add('earls_academy_graduated');
    manager.checkStoryFlags(flags);
    expect(manager.getMission('S03')?.status).toBe('COMPLETED');
    expect(manager.getMission('S04')?.status).toBe('COMPLETED');
  });
});

