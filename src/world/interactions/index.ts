import { NpcInteractionRouter } from './NpcInteractionRouter';
import { getGymLeaderInteractions } from './GymLeaderInteractions';
import { getEarlyJohtoQuestInteractions } from './EarlyJohtoQuestInteractions';
import { getMidToLateJohtoQuestInteractions } from './MidToLateJohtoQuestInteractions';
import { getGoldenrodAndRoute34Interactions } from './GoldenrodAndRoute34Interactions';
import { getJohtoTownServiceInteractions } from './JohtoTownServiceInteractions';
import { getGoldenrodExpansionInteractions } from './GoldenrodExpansionInteractions';
import { getEastJohtoQuestInteractions } from './EastJohtoQuestInteractions';
import { createGoldenrodTakeoverInteractions } from './GoldenrodTakeoverInteractions';
import { getMahoganyTownAndLakeInteractions } from './MahoganyTownAndLakeInteractions';
import { getMahoganyRocketHideoutInteractions } from './MahoganyRocketHideoutInteractions';
import { getWhirlIslandsInteractions } from './WhirlIslandsInteractions';

export * from './NpcInteractionRouter';
export * from './FieldObstacleDispatcher';
export * from './GymLeaderInteractions';
export * from './EarlyJohtoQuestInteractions';
export * from './IlexForestInteractions';
export * from './MidToLateJohtoQuestInteractions';
export * from './GoldenrodAndRoute34Interactions';
export * from './JohtoTownServiceInteractions';
export * from './GoldenrodExpansionInteractions';
export * from './EastJohtoQuestInteractions';
export * from './GoldenrodTakeoverInteractions';
export * from './MahoganyTownAndLakeInteractions';
export * from './MahoganyRocketHideoutInteractions';
export * from './WhirlIslandsInteractions';

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
    ...getGoldenrodExpansionInteractions(),
    ...getEastJohtoQuestInteractions(),
    ...createGoldenrodTakeoverInteractions(),
    ...getMahoganyTownAndLakeInteractions(),
    ...getMahoganyRocketHideoutInteractions(),
    ...getWhirlIslandsInteractions(),
  ]);
}
