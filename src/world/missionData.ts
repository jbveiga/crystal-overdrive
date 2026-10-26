import type { Mission } from '../types/game';
import { EARLY_JOHTO_MISSIONS } from './missions/earlyJohtoMissions';
import { MID_TO_LATE_JOHTO_MISSIONS } from './missions/midToLateJohtoMissions';

export { EARLY_JOHTO_MISSIONS } from './missions/earlyJohtoMissions';
export { MID_TO_LATE_JOHTO_MISSIONS } from './missions/midToLateJohtoMissions';

export const CANONICAL_MISSIONS: ReadonlyArray<Mission> = [
  ...EARLY_JOHTO_MISSIONS,
  ...MID_TO_LATE_JOHTO_MISSIONS,
];

export function createDefaultMissions(): Mission[] {
  return CANONICAL_MISSIONS.map((m) => ({
    ...m,
    steps: m.steps.map((s) => ({ ...s })),
    rewards: m.rewards.map((r) => ({ ...r })),
  }));
}
