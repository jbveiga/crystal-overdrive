/**
 * @fileoverview VictoryRoadGateInteractions domain module implementation.
 * @module world/interactions/VictoryRoadGateInteractions
 * @role Victory Road Reception Gate & 8-Badge Security Gauntlet Component
 * @exports getVictoryRoadGateInteractions, victoryRoadGateInteractions, checkHasAllJohtoBadges, handleVictoryRoadGateOfficer, handleMtSilverGateGuard, handleKantoGateGuard, handleVictoryRoadGateStep
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-60: Badge Verification Logic | L61-120: Dialogue Handlers | L121-175: Step Interceptor | L176-210: Registration Factory
 */

import type { MapData } from '../../types/game';
import type { GridEntity } from '../GridPhysics';
import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';

export interface VictoryRoadGateStepContext {
  player: GridEntity;
  inventory: { badges?: string[] };
  storyFlags: Set<string>;
  openDialogue: (pages: string[], speaker?: string, onClose?: () => void) => void;
  showToast?: (message: string) => void;
}

const REQUIRED_JOHTO_BADGES = [
  'zephyr',
  'hive',
  'plain',
  'fog',
  'storm',
  'mineral',
  'glacier',
  'rising',
] as const;

/**
 * Checks whether the player holds all 8 Johto badges.
 */
export function checkHasAllJohtoBadges(
  badges: string[] = [],
  storyFlags: Set<string> = new Set()
): boolean {
  if (storyFlags.has('has_rising_badge')) return true;
  const normalized = (badges || []).map((b) => b.toLowerCase().replace(/_badge$/, ''));
  return REQUIRED_JOHTO_BADGES.every((req) => normalized.includes(req));
}

/**
 * 1. Victory Road Gate Officer Interaction Handler
 */
export const handleVictoryRoadGateOfficer: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const has8Badges = checkHasAllJohtoBadges(ctx.inventory.badges, ctx.storyFlags);

  if (!has8Badges) {
    ctx.openDialogue(
      [
        'OFFICER: Only trainers who have proven themselves may pass.',
        "You don't have all the GYM BADGES of JOHTO. I'm sorry, but I can't let you go through.",
      ],
      targetNpc.speaker || '👮 OFFICER'
    );
    return true;
  }

  const firstUnlock = !ctx.storyFlags.has('victory_road_gate_cleared');
  if (firstUnlock) {
    ctx.storyFlags.add('victory_road_gate_cleared');
    BattleAudio.playOverworldSound('KEY_ITEM');
  }

  ctx.openDialogue(
    [
      'OFFICER: Oh! The eight BADGES of JOHTO! ZEPHYR, HIVE, PLAIN, FOG, STORM, MINERAL, GLACIER, and RISING!',
      'Please, go right on through to VICTORY ROAD!',
    ],
    targetNpc.speaker || '👮 OFFICER',
    () => {
      if (firstUnlock) {
        ctx.showToast?.('🛡️ 8 Johto Badges Verified! Victory Road unlocked!');
        ctx.saveCurrentGame?.();
      }
    }
  );
  return true;
};

/**
 * 2. Mt. Silver Gate Guard Interaction Handler (Route 28 West Passage)
 */
export const handleMtSilverGateGuard: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!ctx.storyFlags.has('champion_defeated')) {
    ctx.openDialogue(
      [
        'BLACK BELT: Hold on! This way leads to MT. SILVER.',
        'Only a verified CHAMPION who has conquered both JOHTO and KANTO may pass!',
      ],
      targetNpc.speaker || '🥋 BLACK BELT'
    );
  } else {
    ctx.openDialogue(
      ['Welcome, CHAMPION! The path to MT. SILVER is open to you. Train hard!'],
      targetNpc.speaker || '🥋 BLACK BELT'
    );
  }
  return true;
};

/**
 * 3. Kanto Gate Guard Interaction Handler (Route 22 East Passage)
 */
export const handleKantoGateGuard: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!ctx.storyFlags.has('champion_defeated')) {
    ctx.openDialogue(
      [
        'BLACK BELT: Off to the POKéMON LEAGUE, are you?',
        'The route to VIRIDIAN CITY is closed to incoming challengers. Proceed through VICTORY ROAD!',
      ],
      targetNpc.speaker || '🥋 BLACK BELT'
    );
  } else {
    ctx.openDialogue(
      ['The road to VIRIDIAN CITY is open! Safe travels across KANTO!'],
      targetNpc.speaker || '🥋 BLACK BELT'
    );
  }
  return true;
};

/**
 * 4. Step Coordinate Interceptor for Victory Road Gate
 * Halts tick processing and bounces unauthorized players away from restricted doorways.
 */
export function handleVictoryRoadGateStep(
  coord: { x: number; y: number },
  currentMap: MapData,
  ctx: VictoryRoadGateStepContext
): boolean {
  if (currentMap.id !== 'victory_road_gate') return false;

  // North passage to Victory Road: (9..10, 11)
  if ((coord.x === 9 || coord.x === 10) && coord.y === 11) {
    const has8Badges = checkHasAllJohtoBadges(ctx.inventory.badges, ctx.storyFlags);
    if (!has8Badges) {
      ctx.player.x = 10;
      ctx.player.y = 12;
      ctx.player.direction = 'UP';
      BattleAudio.playMenuSound('CANCEL');
      ctx.openDialogue(
        [
          'OFFICER: Only trainers who have proven themselves may pass.',
          "You don't have all the GYM BADGES of JOHTO. I'm sorry, but I can't let you go through.",
        ],
        '👮 OFFICER'
      );
      return true;
    }

    if (!ctx.storyFlags.has('victory_road_gate_cleared')) {
      ctx.storyFlags.add('victory_road_gate_cleared');
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.openDialogue(
        [
          'OFFICER: Oh! The eight BADGES of JOHTO! ZEPHYR, HIVE, PLAIN, FOG, STORM, MINERAL, GLACIER, and RISING!',
          'Please, go right on through to VICTORY ROAD!',
        ],
        '👮 OFFICER',
        () => {
          ctx.showToast?.('🛡️ 8 Johto Badges Verified! Victory Road unlocked!');
        }
      );
      return true;
    }
  }

  // West passage to Mt. Silver / Route 28: (1..2, 7)
  if ((coord.x === 1 || coord.x === 2) && coord.y === 7) {
    if (!ctx.storyFlags.has('champion_defeated')) {
      ctx.player.x = 3;
      ctx.player.y = 7;
      ctx.player.direction = 'RIGHT';
      BattleAudio.playMenuSound('CANCEL');
      ctx.openDialogue(
        [
          'BLACK BELT: Hold on! This way leads to MT. SILVER.',
          'Only a verified CHAMPION who has conquered both JOHTO and KANTO may pass!',
        ],
        '🥋 BLACK BELT'
      );
      return true;
    }
  }

  // East passage to Viridian City / Route 22: (17..18, 7)
  if ((coord.x === 17 || coord.x === 18) && coord.y === 7) {
    if (!ctx.storyFlags.has('champion_defeated')) {
      ctx.player.x = 16;
      ctx.player.y = 7;
      ctx.player.direction = 'LEFT';
      BattleAudio.playMenuSound('CANCEL');
      ctx.openDialogue(
        [
          'BLACK BELT: Off to the POKéMON LEAGUE, are you?',
          'The route to VIRIDIAN CITY is closed to incoming challengers. Proceed through VICTORY ROAD!',
        ],
        '🥋 BLACK BELT'
      );
      return true;
    }
  }

  return false;
}

/**
 * Returns interaction registrations for Victory Road Gate NPCs.
 */
export function getVictoryRoadGateInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['VICTORY_ROAD_GATE_OFFICER'],
      npcIds: ['victory_road_gate_officer'],
      handler: handleVictoryRoadGateOfficer,
    },
    {
      actions: ['MT_SILVER_GATE_GUARD'],
      npcIds: ['victory_road_gate_mt_silver_guard'],
      handler: handleMtSilverGateGuard,
    },
    {
      actions: ['KANTO_GATE_GUARD'],
      npcIds: ['victory_road_gate_kanto_guard'],
      handler: handleKantoGateGuard,
    },
  ];
}

export const victoryRoadGateInteractions = getVictoryRoadGateInteractions();
