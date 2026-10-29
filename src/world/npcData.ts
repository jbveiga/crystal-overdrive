/**
 * @fileoverview npcData domain module implementation.
 * @module world/npcData
 * @role npcData Component
 * @exports createNpcsByMap, npcsByMap, getNpcsForMap
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-166: Implementation | L167-333: Handlers & Exports
 */

import type { GridEntity } from './GridPhysics';
import { GENERATED_NPCS } from './generatedNpcs';
import {
  makeNpc,
  isNpcActiveForStoryFlags,
} from './npcs/npcShared';
import { createNewBarkToSproutTowerNpcs } from './npcs/newBarkToSproutTowerNpcs';
import { createVioletToUnionCaveNpcs } from './npcs/violetToUnionCaveNpcs';
import { createAzaleaToIlexNpcs } from './npcs/azaleaToIlexNpcs';
import { createGoldenrodCityNpcs } from './npcs/goldenrodCityNpcs';
import { createGoldenrodBuildingsAndParkNpcs } from './npcs/goldenrodBuildingsAndParkNpcs';
import { createEcruteakToRoute39Npcs } from './npcs/ecruteakToRoute39Npcs';
import { createOlivineToIndigoNpcs } from './npcs/olivineToIndigoNpcs';
import { createKantoVermilionNpcs } from './npcs/kantoVermilionNpcs';
import { createKantoSaffronNpcs } from './npcs/kantoSaffronNpcs';
import { createKantoCeladonNpcs } from './npcs/kantoCeladonNpcs';
import { createKantoCeruleanNpcs } from './npcs/kantoCeruleanNpcs';
import { createKantoFuchsiaNpcs } from './npcs/kantoFuchsiaNpcs';

// Re-export shared entities, types, and functions for 100% backward compatibility
export {
  makeNpc,
  GUIDE_GENT_TOUR_LEGS,
  calculateTourLegCoordinates,
  isNpcActiveForStoryFlags,
  DAY_SIBLINGS,
  DAY_OF_WEEK_SIBLINGS,
  resolveDaySiblingInteraction,
  resolveElmLabDialogue,
  type GuideGentTourLegDef,
  type GuideGentTourLeg,
  type DaySiblingInfo,
  type DaySiblingConfig,
} from './npcs/npcShared';

export function createNpcsByMap(): Record<string, GridEntity[]> {
  const base: Record<string, GridEntity[]> = {
    ...createNewBarkToSproutTowerNpcs(),
    ...createVioletToUnionCaveNpcs(),
    ...createAzaleaToIlexNpcs(),
    ...createGoldenrodCityNpcs(),
    ...createGoldenrodBuildingsAndParkNpcs(),
    ...createEcruteakToRoute39Npcs(),
    ...createOlivineToIndigoNpcs(),
    ...createKantoVermilionNpcs(),
    ...createKantoSaffronNpcs(),
    ...createKantoCeladonNpcs(),
    ...createKantoCeruleanNpcs(),
    ...createKantoFuchsiaNpcs(),
  };

  const DEFAULT_LORE = [
    'The weather has been fierce lately, but the POKéMON here are tough!',
    'Trainers from all over pass through here on their way to the POKéMON LEAGUE.',
    'If your POKéMON gets hurt, head to the nearest POKéMON CENTER.',
  ];

  const buildGeneratedNpcsForMap = (mapId: string): GridEntity[] => {
    const list = GENERATED_NPCS[mapId];
    if (!list || list.length === 0) return [];
    return list.map((n, idx) => {
      const generatedId = n.id || `${mapId}_${n.sprite}_${idx}`;
      return makeNpc(
        generatedId,
        n.x,
        n.y,
        n.dir,
        n.sprite as GridEntity['spriteType'],
        n.speaker || n.sprite.replace(/_/g, ' ').toUpperCase(),
        n.pages && n.pages.length > 0
          ? n.pages
          : n.team
          ? [`${n.speaker || 'TRAINER'}: That was a great battle!`]
          : [DEFAULT_LORE[(n.x + n.y) % DEFAULT_LORE.length]],
        {
          talkAcrossCounter: n.counter,
          action: (n.action || (n.team ? 'TRAINER_BATTLE' : undefined)) as GridEntity['action'],
          trainerId: n.trainerId || (n.team ? generatedId : undefined),
          trainerName: n.trainerName,
          visionRange: n.vision,
          challengePages: n.challenge || (n.team ? [`${n.speaker || 'TRAINER'}: Let's battle!`] : undefined),
          trainerPokemon: n.team?.[0],
          trainerTeam: n.team,
        }
      );
    });
  };

  const allKnownKeys = new Set([...Object.keys(base), ...Object.keys(GENERATED_NPCS)]);
  const generatedAppended = new Set<string>();

  const ensureMapHydrated = (mapId: string) => {
    if (!generatedAppended.has(mapId)) {
      generatedAppended.add(mapId);
      const generatedList = buildGeneratedNpcsForMap(mapId);
      if (generatedList.length > 0) {
        if (base[mapId]) {
          const existingCoords = new Set(base[mapId].map((n) => `${n.x},${n.y}`));
          for (const gen of generatedList) {
            if (!existingCoords.has(`${gen.x},${gen.y}`)) {
              base[mapId].push(gen);
            }
          }
        } else {
          base[mapId] = generatedList;
        }
      }
    }
  };

  return new Proxy(base, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'string') {
        ensureMapHydrated(prop);
      }
      return Reflect.get(target, prop);
    },
    set(target, prop: string | symbol, value) {
      if (typeof prop === 'string') {
        generatedAppended.add(prop);
      }
      return Reflect.set(target, prop, value);
    },
    has(target, prop: string | symbol) {
      if (typeof prop === 'string') {
        return allKnownKeys.has(prop) || Reflect.has(target, prop);
      }
      return Reflect.has(target, prop);
    },
    ownKeys(target) {
      for (const k of allKnownKeys) {
        ensureMapHydrated(k);
      }
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop: string | symbol) {
      if (typeof prop === 'string') {
        ensureMapHydrated(prop);
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  });
}

export const npcsByMap: Record<string, GridEntity[]> = createNpcsByMap();

/**
 * Returns the active NPCs for a given map filtered by dynamic story flags:
 * - `mr_pokemons_house`: `prof_oak_npc` departs after `HAS_MYSTERY_EGG` / `HAS_POKEDEX` is set.
 * - `route_36`: `sudowoodo` is cleared after `sudowoodo_cleared` is set.
 * - Phase 11 story maps: `lake_of_rage`, `mahogany_town`, `mahogany_mart`, `team_rocket_base_b2f`, `team_rocket_base_b3f`, `route_43_gate`.
 */
export function getNpcsForMap(
  mapId: string,
  storyFlags: Set<string>,
  registry: Record<string, GridEntity[]> = npcsByMap
): GridEntity[] {
  const list = registry[mapId] || [];
  return list.filter((n) => {
    if (
      mapId === 'route_43_gate' &&
      (storyFlags.has('rocket_base_generator_cleared') || storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')) &&
      n.id.includes('rocket')
    ) {
      return false;
    }
    return isNpcActiveForStoryFlags(n.id, storyFlags);
  });
}

/**
 * Pure, idempotent per-map spawn filter & origin reset function that applies all canonical
 * story-flag and day-of-week rules (sudowoodo_cleared, nbt_rival, cg_guide_gent, prof_oak_npc,
 * lab_police_officer, EVENT_KURT_LEFT_FOR_WELL, slowpoke_well_cleared, union_cave_lapras Friday check,
 * isNpcActiveForStoryFlags) and resets NPC coordinates (x, y, gridX, gridY, targetX, targetY,
 * renderX, renderY, direction) to their originX / originY / originDirection (preserving
 * forest_farfetchd when unherded).
 */
export function applyMapNpcStoryMutations(
  mapId: string,
  npcs: GridEntity[],
  storyFlags: Set<string>,
  _defeatedTrainers?: Set<string>,
  isFriday?: boolean
): GridEntity[] {
  if (!npcs || npcs.length === 0) return [];

  const friday =
    isFriday !== undefined ? isFriday : storyFlags.has('FORCE_FRIDAY') || new Date().getDay() === 5;

  const isWellCleared =
    storyFlags.has('slowpoke_well_cleared') ||
    storyFlags.has('cleared_slowpoke_well') ||
    storyFlags.has('EVENT_CLEARED_SLOWPOKE_WELL');

  const filtered: GridEntity[] = [];

  for (let i = 0; i < npcs.length; i++) {
    const npc = npcs[i];

    // Union Cave Lapras check
    if (npc.id === 'union_cave_lapras') {
      if (!friday || storyFlags.has('defeated_lapras_union_cave') || storyFlags.has('caught_lapras')) {
        continue;
      }
    }

    // Route 43 Gate rocket check
    if (
      mapId === 'route_43_gate' &&
      (storyFlags.has('rocket_base_generator_cleared') || storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')) &&
      npc.id.includes('rocket')
    ) {
      continue;
    }

    // Azalea Town / Slowpoke Well rocket checks
    if (npc.id === 'azalea_well_grunt') {
      if (storyFlags.has('EVENT_KURT_LEFT_FOR_WELL') || isWellCleared) {
        continue;
      }
    }
    if (npc.id === 'azalea_gym_grunt') {
      if (isWellCleared) {
        continue;
      }
    }
    if (mapId === 'slowpoke_well_b1f' && isWellCleared) {
      if (npc.id.startsWith('rocket_grunt') || npc.id === 'executive_proton') {
        continue;
      }
    }

    // General story flag & single presence check
    if (!isNpcActiveForStoryFlags(npc.id, storyFlags, friday)) {
      continue;
    }

    // Reset coordinates to origin (preserving forest_farfetchd when unherded)
    if (npc.originX !== undefined && npc.originY !== undefined) {
      const isUnherdedFarfetchd =
        npc.id === 'forest_farfetchd' &&
        !storyFlags.has('forest_farfetchd_herded') &&
        !storyFlags.has('EVENT_HERDED_FARFETCHD');

      if (!isUnherdedFarfetchd) {
        npc.x = npc.originX;
        npc.y = npc.originY;
        npc.gridX = npc.originX;
        npc.gridY = npc.originY;
        npc.targetX = npc.originX;
        npc.targetY = npc.originY;
        npc.renderX = npc.originX;
        npc.renderY = npc.originY;
        if (npc.originDirection) {
          npc.direction = npc.originDirection;
        }
        npc.isMoving = false;
        npc.progress = 0;
      }
    }

    if (npc.id === 'victory_road_rival' && storyFlags.has('victory_road_rival_defeated')) {
      npc.x = 12;
      npc.y = 7;
      npc.gridX = 12;
      npc.gridY = 7;
      npc.targetX = 12;
      npc.targetY = 7;
      npc.renderX = 12;
      npc.renderY = 7;
      npc.direction = 'RIGHT';
      npc.isMoving = false;
      npc.progress = 0;
    }

    filtered.push(npc);
  }

  return filtered;
}

export function applyStoryRecoveryFlags(
  storyFlags: Set<string>,
  defeatedTrainers: Set<string>,
  inventory: { balls: Record<string, number>; badges: string[]; tms: string[] }
): void {
  if (defeatedTrainers.has('executive_proton') && !storyFlags.has('slowpoke_well_cleared')) {
    storyFlags.add('proton_defeated');
    storyFlags.add('slowpoke_well_cleared');
    if (!storyFlags.has('EVENT_KURT_GAVE_YOU_LURE_BALL')) {
      inventory.balls['lure-ball'] = (inventory.balls['lure-ball'] || 0) + 1;
      storyFlags.add('EVENT_KURT_GAVE_YOU_LURE_BALL');
      storyFlags.add('APRICORN_CRAFTING_UNLOCKED');
    }
  }
  if (defeatedTrainers.has('falkner') && !storyFlags.has('falkner_defeated')) {
    storyFlags.add('falkner_defeated');
    storyFlags.add('CAN_USE_FLASH');
    if (!inventory.badges.includes('zephyr')) inventory.badges.push('zephyr');
    if (!inventory.tms.includes('TM31')) inventory.tms.push('TM31');
  }
  if (defeatedTrainers.has('bugsy') && !storyFlags.has('bugsy_defeated')) {
    storyFlags.add('bugsy_defeated');
    storyFlags.add('CAN_USE_CUT');
    if (!inventory.badges.includes('hive')) inventory.badges.push('hive');
    if (!inventory.tms.includes('TM49')) inventory.tms.push('TM49');
  }
  if (
    (storyFlags.has('EVENT_HERDED_FARFETCHD') || storyFlags.has('forest_farfetchd_herded')) &&
    !storyFlags.has('has_hm01_cut')
  ) {
    storyFlags.add('has_hm01_cut');
    storyFlags.add('EVENT_GOT_HM01_CUT');
    if (!inventory.tms.includes('HM01')) inventory.tms.push('HM01');
    if (!inventory.tms.includes('HM01_CUT')) inventory.tms.push('HM01_CUT');
  }
}

export function filterInitialMapNpcs(npcsByMap: Record<string, GridEntity[]>, storyFlags: Set<string>): void {
  if (storyFlags.has('sudowoodo_cleared') && npcsByMap.route_36) {
    npcsByMap.route_36 = npcsByMap.route_36.filter((n) => n.id !== 'sudowoodo');
  }
  if (
    (storyFlags.has('HAS_MYSTERY_EGG') ||
      storyFlags.has('mystery_egg_received') ||
      storyFlags.has('rival_1_defeated') ||
      storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') ||
      storyFlags.has('EVENT_RIVAL_NAMED')) &&
    npcsByMap.new_bark_town
  ) {
    npcsByMap.new_bark_town = npcsByMap.new_bark_town.filter((n) => n.id !== 'nbt_rival');
  }
  if (storyFlags.has('has_map_card') && npcsByMap.cherrygrove_city) {
    npcsByMap.cherrygrove_city = npcsByMap.cherrygrove_city.filter((n) => n.id !== 'cg_guide_gent');
  }
  if ((storyFlags.has('HAS_MYSTERY_EGG') || storyFlags.has('HAS_POKEDEX')) && npcsByMap.mr_pokemons_house) {
    npcsByMap.mr_pokemons_house = npcsByMap.mr_pokemons_house.filter((n) => n.id !== 'prof_oak_npc');
  }
  if ((!storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') || storyFlags.has('EVENT_RIVAL_NAMED')) && npcsByMap.elms_lab) {
    npcsByMap.elms_lab = npcsByMap.elms_lab.filter((n) => n.id !== 'lab_police_officer');
  }
}

export function resetStoryNpcSpawns(npcsByMap: Record<string, GridEntity[]>): void {
  const freshNpcs = createNpcsByMap();
  const resetKeys = [
    'mr_pokemons_house',
    'new_bark_town',
    'cherrygrove_city',
    'route_36',
    'elms_lab',
    'azalea_town',
    'slowpoke_well_b1f',
    'union_cave_b2f',
  ];
  for (const k of resetKeys) {
    if (freshNpcs[k]) npcsByMap[k] = freshNpcs[k];
  }
}

