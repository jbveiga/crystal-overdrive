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
import { getRoute27AndTohjoFallsInteractions } from './Route27AndTohjoFallsInteractions';
import { getVictoryRoadGateInteractions } from './VictoryRoadGateInteractions';
import { getVictoryRoadInteractions } from './VictoryRoadInteractions';
import { getEliteFourAndChampionInteractions } from './EliteFourAndChampionInteractions';
import { getFastShipAndVermilionInteractions } from './FastShipAndVermilionInteractions';
import { getVermilionGymInteractions } from './VermilionGymInteractions';
import { getSaffronAndRoute6Interactions } from './SaffronAndRoute6Interactions';
import { getCeladonAndGymErikaInteractions } from './CeladonAndGymErikaInteractions';
import { getCeruleanPowerPlantAndMistyInteractions } from './CeruleanPowerPlantAndMistyInteractions';

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
export * from './Route27AndTohjoFallsInteractions';
export * from './VictoryRoadGateInteractions';
export * from './VictoryRoadInteractions';
export * from './EliteFourAndChampionInteractions';
export * from './FastShipAndVermilionInteractions';
export * from './VermilionGymInteractions';
export * from './SaffronAndRoute6Interactions';
export * from './CeladonAndGymErikaInteractions';
export * from './CeruleanPowerPlantAndMistyInteractions';

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
    ...getRoute27AndTohjoFallsInteractions(),
    ...getVictoryRoadGateInteractions(),
    ...getVictoryRoadInteractions(),
    ...getEliteFourAndChampionInteractions(),
    ...getFastShipAndVermilionInteractions(),
    ...getVermilionGymInteractions(),
    ...getSaffronAndRoute6Interactions(),
    ...getCeladonAndGymErikaInteractions(),
    ...getCeruleanPowerPlantAndMistyInteractions(),
  ]);
}
