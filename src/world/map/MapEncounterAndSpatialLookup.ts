/**
 * @fileoverview MapEncounterAndSpatialLookup domain module implementation.
 * @module world/map/MapEncounterAndSpatialLookup
 * @role Spatial BgEvent/Connection walkability lookup and wild encounter rolling helper
 * @exports MapEncounterAndSpatialLookup
 * @layer world
 * @sections L1-100: Spatial BgEvent & Border Connection Walkability | L101-215: Wild Encounter Roller
 */

import type { BgEvent, MapData } from '../../types/game';
import type { WildEncounterResult } from '../MapManager';
import { canTriggerWildEncounter, isDungeonOrCaveMap } from './MapClassificationAndWarpRules';

export class MapEncounterAndSpatialLookup {
  public static checkBgEventAcrossConnections(opts: {
    currentMap: MapData | null;
    maps: Map<string, MapData>;
    getSpatialBgEvents: (map: MapData) => Map<string, BgEvent>;
    x: number;
    y: number;
  }): BgEvent | undefined {
    const { currentMap, maps, getSpatialBgEvents, x, y } = opts;
    if (!currentMap) return undefined;
    if (x < 0 && currentMap.connections.WEST) {
      const conn = currentMap.connections.WEST;
      const westMap = maps.get(conn.mapId);
      if (westMap) {
        return getSpatialBgEvents(westMap).get(`${x + westMap.width},${y - conn.offset}`);
      }
      return undefined;
    }
    if (x >= currentMap.width && currentMap.connections.EAST) {
      const conn = currentMap.connections.EAST;
      const eastMap = maps.get(conn.mapId);
      if (eastMap) {
        return getSpatialBgEvents(eastMap).get(`${x - currentMap.width},${y - conn.offset}`);
      }
      return undefined;
    }
    if (y < 0 && currentMap.connections.NORTH) {
      const conn = currentMap.connections.NORTH;
      const northMap = maps.get(conn.mapId);
      if (northMap) {
        return getSpatialBgEvents(northMap).get(`${x - conn.offset},${y + northMap.height}`);
      }
      return undefined;
    }
    if (y >= currentMap.height && currentMap.connections.SOUTH) {
      const conn = currentMap.connections.SOUTH;
      const southMap = maps.get(conn.mapId);
      if (southMap) {
        return getSpatialBgEvents(southMap).get(`${x - conn.offset},${y - currentMap.height}`);
      }
      return undefined;
    }
    return getSpatialBgEvents(currentMap).get(`${x},${y}`);
  }

  public static checkConnectionWalkable(opts: {
    currentMap: MapData | null;
    maps: Map<string, MapData>;
    surfEnabled: boolean;
    x: number;
    y: number;
  }): boolean {
    const { currentMap, maps, surfEnabled, x, y } = opts;
    if (!currentMap) return false;

    const isWalkableTile = (tile: number): boolean => {
      if (tile === 3) return surfEnabled;
      return tile === 0 || tile === 2;
    };

    if (x < 0 && currentMap.connections.WEST) {
      const conn = currentMap.connections.WEST;
      const targetMap = maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = targetMap.width - 1;
      const targetY = y - conn.offset;
      if (targetY < 0 || targetY >= targetMap.height) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return isWalkableTile(tileType);
    }

    if (x >= currentMap.width && currentMap.connections.EAST) {
      const conn = currentMap.connections.EAST;
      const targetMap = maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = 0;
      const targetY = y - conn.offset;
      if (targetY < 0 || targetY >= targetMap.height) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return isWalkableTile(tileType);
    }

    if (y < 0 && currentMap.connections.NORTH) {
      const conn = currentMap.connections.NORTH;
      const targetMap = maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = x - conn.offset;
      const targetY = targetMap.height - 1;
      if (targetX < 0 || targetX >= targetMap.width) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return isWalkableTile(tileType);
    }

    if (y >= currentMap.height && currentMap.connections.SOUTH) {
      const conn = currentMap.connections.SOUTH;
      const targetMap = maps.get(conn.mapId);
      if (!targetMap) return false;
      const targetX = x - conn.offset;
      const targetY = 0;
      if (targetX < 0 || targetX >= targetMap.width) return false;
      const tileType = targetMap.collisionGrid[targetY * targetMap.width + targetX];
      return isWalkableTile(tileType);
    }

    return false;
  }

  public static rollWildEncounter(opts: {
    currentMap: MapData | null;
    tileType: number;
    activeRoamerSpeciesId?: string;
    rng: () => number;
    timeOfDay?: 'MORNING' | 'DAY' | 'NIGHT';
    repelStepsRemaining: number;
    graceStepsRemaining: number;
    stepsSinceGraceEnd: number;
    pacingEnabled: boolean;
    graceStepsDefault: number;
    getEncounterProbabilityForStep: (stepAfterGrace: number, isCaveOrRuins: boolean) => number;
    setGraceAndStepState: (graceStepsRemaining: number, stepsSinceGraceEnd: number) => void;
  }): WildEncounterResult | null {
    const {
      currentMap,
      tileType,
      activeRoamerSpeciesId,
      rng,
      timeOfDay,
      repelStepsRemaining,
      graceStepsRemaining,
      stepsSinceGraceEnd,
      pacingEnabled,
      graceStepsDefault,
      getEncounterProbabilityForStep,
      setGraceAndStepState,
    } = opts;

    if (!currentMap) return null;

    const isWaterTile = tileType === 3;
    const isCaveOrRuins = isDungeonOrCaveMap(currentMap.id);
    if (!canTriggerWildEncounter(currentMap.id, tileType)) {
      return null;
    }

    if (repelStepsRemaining > 0) {
      return null;
    }

    if (graceStepsRemaining > 0) {
      setGraceAndStepState(graceStepsRemaining - 1, stepsSinceGraceEnd);
      return null;
    }

    let nextStepsSinceGraceEnd = stepsSinceGraceEnd;
    if (pacingEnabled) {
      nextStepsSinceGraceEnd++;
      setGraceAndStepState(graceStepsRemaining, nextStepsSinceGraceEnd);
    }

    const threshold = getEncounterProbabilityForStep(
      nextStepsSinceGraceEnd,
      isCaveOrRuins || isWaterTile
    );
    const encounterRoll = rng();
    if (encounterRoll > threshold) {
      return null;
    }

    const finalizeEncounter = (result: WildEncounterResult): WildEncounterResult => {
      if (pacingEnabled) {
        setGraceAndStepState(graceStepsDefault, 0);
      }
      return result;
    };

    if (activeRoamerSpeciesId) {
      const roamerRoll = rng();
      if (roamerRoll < 0.25) {
        return finalizeEncounter({
          speciesId: activeRoamerSpeciesId,
          level: 40,
          isRoamer: true,
        });
      }
    }

    let slots = isWaterTile ? currentMap.waterEncounters : currentMap.grassEncounters;
    if (!slots || slots.length === 0) {
      return null;
    }

    if (timeOfDay) {
      const timeFiltered = slots.filter(
        (s) => !s.timeOfDay || s.timeOfDay === 'ANY' || s.timeOfDay === timeOfDay
      );
      if (timeFiltered.length > 0) {
        slots = timeFiltered;
      }
    }

    const totalWeight = slots.reduce((sum, s) => sum + s.weight, 0);
    let chosenWeight = rng() * totalWeight;

    for (const slot of slots) {
      if (chosenWeight < slot.weight) {
        const level = Math.floor(rng() * (slot.maxLevel - slot.minLevel + 1)) + slot.minLevel;
        return finalizeEncounter({
          speciesId: slot.speciesId,
          level,
          isRoamer: false,
        });
      }
      chosenWeight -= slot.weight;
    }

    const last = slots[slots.length - 1];
    return finalizeEncounter({
      speciesId: last.speciesId,
      level: last.minLevel,
      isRoamer: false,
    });
  }
}
