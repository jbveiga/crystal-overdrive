/**
 * @fileoverview Route44AndIcePathInteractions domain module implementation.
 * @module world/interactions/Route44AndIcePathInteractions
 * @role Route 44 & Ice Path Cavern Network Interactions Component
 * @exports getRoute44AndIcePathInteractions, handleStrengthBoulderDrop, handleIcePathWaterfallItem, handleBlackthornCityExitPrompt
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-90: Boulder Drop Puzzle | L91-140: Waterfall & Blackthorn Exit | L141-175: Registration Factory
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { ModernHMHandler } from '../ModernHMHandler';

/**
 * 1. Ice Path B1F: Strength Boulder Drop Puzzle
 * Pushing a boulder into a cavern hole drops it down to B2F as an ice-sliding stopper.
 */
export const handleStrengthBoulderDrop: NpcInteractionHandler = (targetNpc, currentMap, ctx) => {
  const strCheck = ModernHMHandler.canUseStrength(
    ctx.playerParty,
    ctx.inventory,
    ctx.storyFlags
  );

  const boulderId = targetNpc?.id || 'ice_path_b1f_boulder_1';
  const numMatch = boulderId.match(/\d+$/);
  const boulderNum = numMatch ? numMatch[0] : '1';
  const eventFlag = `EVENT_BOULDER_IN_ICE_PATH_${boulderNum}`;

  if (!strCheck.canUse) {
    ctx.openDialogue(
      [
        'A giant boulder rests beside the cavern abyss!',
        strCheck.missingReason ||
          'A POKéMON with STRENGTH and the PLAIN BADGE from Goldenrod Gym could shove it into the hole.',
      ],
      '🪨 BOULDER'
    );
    return true;
  }

  const user = strCheck.userPokemon || strCheck.compatiblePokemon || ctx.playerParty[0];
  const userName = user ? user.nickname || user.speciesId.toUpperCase() : ctx.playerName;

  BattleAudio.playOverworldSound('RUSTLE');
  ctx.openDialogue(
    [
      `${userName}'s STRENGTH moved the boulder!`,
      'The massive rock plunged through the hole into the icy lake on the floor below!',
    ],
    '🪨 BOULDER',
    () => {
      ctx.storyFlags.add(eventFlag);
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast(`🪨 Dropped boulder #${boulderNum} to B2F!`);
      if (currentMap) ctx.renderMap?.(currentMap);
      ctx.saveCurrentGame();
    }
  );
  return true;
};

/**
 * 2. Ice Path 1F: HM07 Waterfall Discovery
 */
export const handleIcePathWaterfallItem: NpcInteractionHandler = (_targetNpc, _currentMap, ctx) => {
  if (ctx.storyFlags.has('EVENT_GOT_HM07_WATERFALL') || ctx.storyFlags.has('has_hm07_waterfall')) {
    ctx.openDialogue(
      ['The spot where the HM ball rested is now empty.'],
      '🔴 ITEM BALL'
    );
    return true;
  }

  ctx.storyFlags.add('EVENT_GOT_HM07_WATERFALL');
  ctx.storyFlags.add('has_hm07_waterfall');
  if (!ctx.inventory.tms.includes('HM07')) {
    ctx.inventory.tms.push('HM07');
  }

  BattleAudio.playOverworldSound('KEY_ITEM');
  ctx.audioManager?.playSfx?.('sfx_badge_get');
  ctx.openDialogue(
    [
      `${ctx.playerName} found HM07 WATERFALL!`,
      `${ctx.playerName} put the HM07 in the TM POCKET.`,
      'HM07 contains WATERFALL! A POKéMON can scale cascading waterfalls with the RISING BADGE!',
    ],
    '🔴 ITEM BALL',
    () => {
      ctx.saveCurrentGame();
      ctx.showToast('🌊 Obtained HM07 Waterfall!');
    }
  );
  return true;
};

/**
 * 3. Ice Path 1F: Blackthorn City Cavern Exit Threshold
 */
export const handleBlackthornCityExitPrompt: NpcInteractionHandler = (_targetNpc, _currentMap, ctx) => {
  ctx.openDialogue(
    [
      'A warm mountain breeze drafts into the cavern from the southern opening.',
      'Beyond lies BLACKTHORN CITY, the mountain redoubt of master dragon tamers!',
    ],
    '🏔️ CAVERN EXIT'
  );
  return true;
};

/**
 * Registers all Route 44 & Ice Path interactions for constant-time O(1) routing.
 */
export function getRoute44AndIcePathInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['STRENGTH_BOULDER'],
      npcIds: [
        'ice_path_b1f_boulder_1',
        'ice_path_b1f_boulder_2',
        'ice_path_b1f_boulder_3',
        'ice_path_b1f_boulder_4',
      ],
      handler: handleStrengthBoulderDrop,
    },
    {
      actions: ['ICE_PATH_WATERFALL_ITEM'],
      npcIds: ['ice_path_1f_31_7_hm_waterfall'],
      handler: handleIcePathWaterfallItem,
    },
    {
      actions: ['BLACKTHORN_EXIT_EVENT'],
      npcIds: ['ice_path_exit_blackthorn'],
      handler: handleBlackthornCityExitPrompt,
    },
  ];
}
