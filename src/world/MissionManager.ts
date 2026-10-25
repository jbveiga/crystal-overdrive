import type { Mission, MissionFilter, MissionStep, SerializedMissionState } from '../types/game';
import { createDefaultMissions } from './missionData';

export interface MissionManagerCallbacks {
  onMissionUnlocked?: (mission: Mission) => void;
  onMissionAdvanced?: (mission: Mission, step: MissionStep) => void;
  onMissionCompleted?: (mission: Mission) => void;
}

export class MissionManager {
  private missions: Map<string, Mission> = new Map();
  private callbacks: MissionManagerCallbacks;

  constructor(initialMissions: Mission[] = createDefaultMissions(), callbacks: MissionManagerCallbacks = {}) {
    this.callbacks = callbacks;
    for (const m of initialMissions) {
      this.missions.set(m.id, {
        ...m,
        steps: m.steps.map((s) => ({ ...s })),
        rewards: m.rewards.map((r) => ({ ...r })),
      });
    }
  }

  public setCallbacks(callbacks: MissionManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getMissions(filter: MissionFilter = 'ALL'): Mission[] {
    const all = Array.from(this.missions.values());
    if (filter === 'MAIN') {
      return all.filter((m) => m.category === 'MAIN');
    }
    if (filter === 'SIDE') {
      return all.filter((m) => m.category === 'SIDE');
    }
    if (filter === 'COMPLETED') {
      return all.filter((m) => m.status === 'COMPLETED');
    }
    return all;
  }

  public getMission(id: string): Mission | undefined {
    return this.missions.get(id);
  }

  public unlockMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission || mission.status !== 'LOCKED') return false;
    mission.status = 'ACTIVE';
    this.callbacks.onMissionUnlocked?.(mission);
    return true;
  }

  public advanceStep(missionId: string, stepIndexOrId?: number | string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission || mission.status === 'COMPLETED') return false;

    if (mission.status === 'LOCKED') {
      mission.status = 'ACTIVE';
      this.callbacks.onMissionUnlocked?.(mission);
    }

    let targetIdx = mission.currentStepIndex;
    if (typeof stepIndexOrId === 'number') {
      targetIdx = stepIndexOrId;
    } else if (typeof stepIndexOrId === 'string') {
      targetIdx = mission.steps.findIndex((s) => s.id === stepIndexOrId);
    }

    const step = mission.steps[targetIdx];
    if (!step || step.completed) return false;

    step.completed = true;

    // Advance currentStepIndex to the next incomplete step
    const nextIncomplete = mission.steps.findIndex((s) => !s.completed);
    if (nextIncomplete === -1) {
      mission.currentStepIndex = Math.max(0, mission.steps.length - 1);
      mission.status = 'COMPLETED';
      this.callbacks.onMissionCompleted?.(mission);
    } else {
      mission.currentStepIndex = nextIncomplete;
      this.callbacks.onMissionAdvanced?.(mission, step);
    }

    return true;
  }

  public completeMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (!mission || mission.status === 'COMPLETED') return false;

    for (const s of mission.steps) {
      s.completed = true;
    }
    mission.currentStepIndex = Math.max(0, mission.steps.length - 1);
    mission.status = 'COMPLETED';
    this.callbacks.onMissionCompleted?.(mission);
    return true;
  }

  /**
   * Registers story flags for entering a map (e.g., entered_azalea_town, entered_ecruteak, etc.)
   * and evaluates mission progression.
   */
  public registerMapEntry(
    mapId: string,
    storyFlags: Set<string>
  ): { newlyUnlocked: Mission[]; newlyCompleted: Mission[]; advanced: Mission[] } {
    if (mapId) {
      storyFlags.add(`entered_${mapId}`);
      if (mapId === 'ecruteak_city') storyFlags.add('entered_ecruteak');
      if (mapId === 'cianwood_city') storyFlags.add('entered_cianwood');
      if (mapId === 'mahogany_town') storyFlags.add('entered_mahogany');
      if (mapId === 'kurts_house' || mapId === 'slowpoke_well_b1f' || mapId === 'azalea_poke_center' || mapId === 'azalea_mart' || mapId === 'azalea_gym') {
        storyFlags.add('entered_azalea_town');
      }
    }
    return this.checkStoryFlags(storyFlags);
  }

  /**
   * Evaluates story flags to automatically unlock missions, advance steps, and complete quests.
   */
  public checkStoryFlags(
    flagsInput: Set<string> | string[]
  ): { newlyUnlocked: Mission[]; newlyCompleted: Mission[]; advanced: Mission[] } {
    const flagSet = flagsInput instanceof Set ? flagsInput : new Set(flagsInput);
    const newlyUnlocked: Mission[] = [];
    const newlyCompleted: Mission[] = [];
    const advanced: Mission[] = [];

    for (const mission of this.missions.values()) {
      const wasLocked = mission.status === 'LOCKED';
      const wasCompleted = mission.status === 'COMPLETED';
      if (wasCompleted) continue;

      // 1. Check unlock trigger flag
      if (mission.status === 'LOCKED' && mission.unlockedAtStoryFlag && flagSet.has(mission.unlockedAtStoryFlag)) {
        mission.status = 'ACTIVE';
      }

      // 2. Check individual step flags
      let stepChanged = false;
      let latestAdvancedStep: MissionStep | null = null;
      for (const step of mission.steps) {
        const hasDirectFlag = Boolean(step.storyFlag && flagSet.has(step.storyFlag));
        const hasEnteredTargetFlag = Boolean(
          step.storyFlag &&
            step.storyFlag.startsWith('entered_') &&
            step.targetMapId &&
            flagSet.has(`entered_${step.targetMapId}`)
        );
        if (!step.completed && (hasDirectFlag || hasEnteredTargetFlag)) {
          step.completed = true;
          stepChanged = true;
          latestAdvancedStep = step;
          if (mission.status === 'LOCKED') {
            mission.status = 'ACTIVE';
          }
        }
      }

      // 3. Check mission completion trigger flag or all steps finished
      const allStepsDone = mission.steps.length > 0 && mission.steps.every((s) => s.completed);
      const completionFlagHit = Boolean(mission.completedAtStoryFlag && flagSet.has(mission.completedAtStoryFlag));

      if (allStepsDone || completionFlagHit) {
        for (const s of mission.steps) {
          s.completed = true;
        }
        mission.currentStepIndex = Math.max(0, mission.steps.length - 1);
        mission.status = 'COMPLETED';
        newlyCompleted.push(mission);
        this.callbacks.onMissionCompleted?.(mission);
        continue;
      }

      // Update currentStepIndex if steps changed
      if (stepChanged) {
        const nextIncomplete = mission.steps.findIndex((s) => !s.completed);
        mission.currentStepIndex = nextIncomplete >= 0 ? nextIncomplete : 0;
      }

      if (wasLocked && mission.status === 'ACTIVE') {
        newlyUnlocked.push(mission);
        this.callbacks.onMissionUnlocked?.(mission);
      } else if (stepChanged && latestAdvancedStep) {
        advanced.push(mission);
        this.callbacks.onMissionAdvanced?.(mission, latestAdvancedStep);
      }
    }

    return { newlyUnlocked, newlyCompleted, advanced };
  }

  public serialize(): Record<string, SerializedMissionState> {
    const out: Record<string, SerializedMissionState> = {};
    for (const [id, mission] of this.missions.entries()) {
      out[id] = {
        status: mission.status,
        currentStepIndex: mission.currentStepIndex,
        stepsCompleted: mission.steps.map((s) => s.completed),
      };
    }
    return out;
  }

  public deserialize(data: Record<string, SerializedMissionState> | undefined): void {
    if (!data) return;
    for (const [id, state] of Object.entries(data)) {
      const mission = this.missions.get(id);
      if (!mission || !state) continue;
      mission.status = state.status;
      mission.currentStepIndex = state.currentStepIndex ?? 0;
      if (Array.isArray(state.stepsCompleted)) {
        mission.steps.forEach((step, idx) => {
          if (typeof state.stepsCompleted[idx] === 'boolean') {
            step.completed = state.stepsCompleted[idx];
          }
        });
      }
    }
  }
}
