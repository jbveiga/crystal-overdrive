import { NpcInteractionRouter } from './NpcInteractionRouter';
import { getGymLeaderInteractions } from './GymLeaderInteractions';
import { getEarlyJohtoQuestInteractions } from './EarlyJohtoQuestInteractions';
import { getMidToLateJohtoQuestInteractions } from './MidToLateJohtoQuestInteractions';
import { getGoldenrodAndRoute34Interactions } from './GoldenrodAndRoute34Interactions';
import { getJohtoTownServiceInteractions } from './JohtoTownServiceInteractions';

export * from './NpcInteractionRouter';
export * from './FieldObstacleDispatcher';
export * from './GymLeaderInteractions';
export * from './EarlyJohtoQuestInteractions';
export * from './IlexForestInteractions';
export * from './MidToLateJohtoQuestInteractions';
export * from './GoldenrodAndRoute34Interactions';
export * from './JohtoTownServiceInteractions';

/**
 * Creates and initializes the default NpcInteractionRouter with all Johto & Kanto interactions.
 */
export function createDefaultNpcInteractionRouter(): NpcInteractionRouter {
  return new NpcInteractionRouter([
    ...getGymLeaderInteractions(),
    ...getEarlyJohtoQuestInteractions(),
    ...getMidToLateJohtoQuestInteractions(),
    ...getGoldenrodAndRoute34Interactions(),
    ...getJohtoTownServiceInteractions(),
  ]);
}
