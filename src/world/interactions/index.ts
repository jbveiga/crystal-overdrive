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
import { getMahoganyGymInteractions } from './MahoganyGymInteractions';
import { getRoute44AndIcePathInteractions } from './Route44AndIcePathInteractions';
import { getBlackthornGymAndDragonDenInteractions } from './BlackthornGymAndDragonDenInteractions';
import { getRoute45And46Interactions } from './Route45And46Interactions';
import { getTinTowerHoOhInteractions } from './TinTowerHoOhInteractions';

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
export * from './MahoganyGymInteractions';
export * from './Route44AndIcePathInteractions';
export * from './BlackthornGymAndDragonDenInteractions';
export * from './Route45And46Interactions';
export * from './TinTowerHoOhInteractions';

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
    ...getRoute44AndIcePathInteractions(),
    ...getBlackthornGymAndDragonDenInteractions(),
    ...getRoute45And46Interactions(),
    ...getTinTowerHoOhInteractions(),
  ]);
}
