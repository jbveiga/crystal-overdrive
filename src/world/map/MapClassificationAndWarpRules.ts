/**
 * @fileoverview MapClassificationAndWarpRules domain module implementation.
 * @module world/map/MapClassificationAndWarpRules
 * @role MapClassificationAndWarpRules Component
 * @exports isOutdoorMap, isCaveMap, isDungeonOrCaveMap
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-133: Implementation | L134-266: Handlers & Exports
 */

import type { Direction, MapData, WarpEvent, WarpSoundCue, WarpTransitionConfig } from '../../types/game';

/**
 * Checks whether a map ID represents an outdoor overworld environment (town, route, park, lake, etc.).
 */
export function isOutdoorMap(mapId: string): boolean {
  return [
    'new_bark_town',
    'route_29',
    'cherrygrove_city',
    'route_30',
    'route_31',
    'violet_city',
    'route_32',
    'ruins_of_alph_outside',
    'route_33',
    'azalea_town',
    'ilex_forest',
    'route_34',
    'goldenrod_city',
    'goldenrod_dept_store_roof',
    'route_35',
    'national_park',
    'route_36',
    'route_37',
    'ecruteak_city',
    'route_38',
    'route_39',
    'olivine_city',
    'route_40',
    'route_41',
    'cianwood_city',
    'route_42',
    'mahogany_town',
    'route_43',
    'lake_of_rage',
    'route_44',
    'blackthorn_city',
    'route_45',
    'route_46',
    'route_26',
    'route_27',
    'route_22',
    'route_23',
    'route_28',
    'silver_cave_outside',
    // Phase 13: Western & Central Kanto
    'pallet_town',
    'route_1',
    'viridian_city',
    'route_2',
    'pewter_city',
    'route_3',
    'mount_moon_square',
    'route_4',
    'cerulean_city',
    'route_24',
    'route_25',
    // Phase 14: Central & Eastern Kanto
    'route_5',
    'route_6',
    'vermilion_city',
    'vermilion_port',
    'olivine_port',
    'route_11',
    'route_9',
    'route_10_north',
    'route_10_south',
    'lavender_town',
    'route_8',
    'route_7',
    'celadon_city',
    // Phase 15: Southern Kanto, Saffron & Sea Routes
    'saffron_city',
    'route_16',
    'route_17',
    'route_18',
    'fuchsia_city',
    'route_12',
    'route_13',
    'route_14',
    'route_15',
    'route_19',
    'route_20',
    'cinnabar_island',
    'route_21',
  ].includes(mapId);
}

/**
 * Checks whether a map ID represents a cave, well, tunnel, or subterranean interior.
 */
export function isCaveMap(mapId: string): boolean {
  return /cave|well|tunnel|whirl_island|ice_path|dragons_den|rock_tunnel|digletts_cave|mount_moon|victory_road|silver_cave|tohjo_falls/i.test(
    mapId
  );
}

/**
 * Checks whether a map ID represents a cave, dungeon, tower, ruins, or forest interior
 * where wild encounters can trigger on standard walkable floor tiles (tileType === 0).
 */
export function isDungeonOrCaveMap(mapId: string): boolean {
  return (
    isCaveMap(mapId) ||
    mapId.includes('ruins_of_alph') ||
    mapId.includes('sprout_tower') ||
    mapId.includes('burned_tower') ||
    mapId.includes('tin_tower') ||
    mapId.includes('mount_mortar') ||
    mapId === 'ilex_forest'
  );
}

/**
 * Unified check for whether stepping on a tileType in a given map can roll a wild encounter.
 * Supports tall grass (2), surfing water (3), and walkable dungeon/forest floors (0).
 */
export function canTriggerWildEncounter(mapId: string, tileType: number): boolean {
  const isWater = tileType === 3;
  const isGrass = tileType === 2;
  const isDungeonFloor = tileType === 0 && isDungeonOrCaveMap(mapId);
  return isGrass || isWater || isDungeonFloor;
}

/**
 * Determines the required player direction to trigger a boundary or doorway warp in an indoor map.
 * - North doorway (warp.y <= 1): requires 'UP'
 * - South doorway (warp.y >= currentMap.height - 2): requires 'DOWN'
 * - West doorway (warp.x <= 1): requires 'LEFT'
 * - East doorway (warp.x >= currentMap.width - 2): requires 'RIGHT'
 * - Interior warps (stairs/holes): null (triggered from any direction)
 */
export function getRequiredWarpDirection(warp: WarpEvent, currentMap: MapData): Direction | null {
  if (isOutdoorMap(currentMap.id)) return null;
  if (warp.direction) return warp.direction;

  // Check cardinal boundary edge thresholds on indoor/gate maps
  if (warp.y <= 1) {
    return 'UP';
  }
  if (warp.y >= currentMap.height - 2) {
    return 'DOWN';
  }
  if (warp.x <= 1) {
    return 'LEFT';
  }
  if (warp.x >= currentMap.width - 2) {
    return 'RIGHT';
  }
  return null;
}

/**
 * Identifies whether a warp tile acts as an authentic GBC exit carpet (COLL_WARP_CARPET_DOWN).
 * In indoor maps, entrance/exit carpets are situated at the bottom doorway threshold.
 */
export function isCarpetWarp(warp: WarpEvent, currentMap: MapData): boolean {
  if (isOutdoorMap(currentMap.id)) return false;
  return warp.y >= currentMap.height - 2;
}

/**
 * Resolves canonical building/cave/stair transition configuration adhering to pret/pokecrystal:
 * - Exiting to overworld spawns 1 tile in front of the door (targetX, targetY + 1) facing DOWN,
 *   or on the north apron (targetX, targetY - 1) facing UP for North gate exits
 * - Entering indoor spawns at door facing UP
 * - Selects authentic sound cues (DOOR_ENTER, DOOR_EXIT, STAIRS_STEP, CAVE_WARP)
 * - Enforces 160ms/160ms transition pacing
 */
export function resolveWarpTransition(
  warp: WarpEvent,
  currentMap: MapData,
  targetMap?: MapData
): WarpTransitionConfig {
  const currentOutdoor = isOutdoorMap(currentMap.id);
  const targetOutdoor = isOutdoorMap(warp.targetMapId);
  const isEnteringIndoor = currentOutdoor && !targetOutdoor;
  const isExitingToOverworld = !currentOutdoor && targetOutdoor;
  const isCave = isCaveMap(currentMap.id) || isCaveMap(warp.targetMapId);
  const isStairs = !isCave && !isEnteringIndoor && !isExitingToOverworld;

  let soundCue: WarpSoundCue = 'DOOR_ENTER';
  if (isCave) {
    soundCue = 'CAVE_WARP';
  } else if (isStairs) {
    soundCue = 'STAIRS_STEP';
  } else if (isExitingToOverworld) {
    soundCue = 'DOOR_EXIT';
  } else if (isEnteringIndoor) {
    soundCue = 'DOOR_ENTER';
  }

  let landingX = warp.targetX;
  let landingY = warp.targetY;
  let landingFacing: Direction = 'DOWN';

  if (warp.direction) {
    landingFacing = warp.direction;
  } else if (isCave) {
    landingFacing = 'DOWN';
  } else if (isExitingToOverworld) {
    // Cardinal Doorstep Landings for Gatehouses & Buildings:
    if (warp.y <= 1) {
      landingFacing = 'UP';
      const isDoorTile = targetMap
        ? targetMap.warps?.some((w) => w.x === warp.targetX && w.y === warp.targetY) ?? true
        : true;
      if (isDoorTile) {
        landingY = Math.max(0, warp.targetY - 1);
      }
    } else if (warp.x <= 1) {
      landingFacing = 'LEFT';
      const isDoorTile = targetMap
        ? targetMap.warps?.some((w) => w.x === warp.targetX && w.y === warp.targetY) ?? true
        : true;
      if (isDoorTile) {
        landingX = Math.max(0, warp.targetX - 1);
      }
    } else if (warp.x >= currentMap.width - 2) {
      landingFacing = 'RIGHT';
      const isDoorTile = targetMap
        ? targetMap.warps?.some((w) => w.x === warp.targetX && w.y === warp.targetY) ?? true
        : true;
      if (isDoorTile) {
        landingX = warp.targetX + 1;
      }
    } else {
      // Standard South doorway exit
      landingFacing = 'DOWN';
      const isDoorTile = targetMap
        ? targetMap.warps?.some((w) => w.x === warp.targetX && w.y === warp.targetY) ?? true
        : true;
      if (isDoorTile) {
        landingY = warp.targetY + 1;
      }
    }
  } else if (isEnteringIndoor) {
    landingFacing = 'UP';
  } else if (isStairs) {
    landingFacing = warp.targetY <= 1 ? 'DOWN' : 'UP';
  }

  return {
    previousMapId: currentMap.id,
    targetMapId: warp.targetMapId,
    isEnteringIndoor,
    isExitingToOverworld,
    isStairs,
    isCave,
    landingX,
    landingY,
    landingFacing,
    soundCue,
    fadeDurationMs: 160,
  };
}
