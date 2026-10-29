/**
 * @fileoverview FastShipAndVermilionInteractions domain module implementation.
 * @module world/interactions/FastShipAndVermilionInteractions
 * @role S.S. Aqua Fast Ship & Vermilion City Interactions Component
 * @exports getFastShipAndVermilionInteractions, handlePortSailorGuard, handleFastShipSailorExit, handleFastShipCabinRest, handleFastShipGrandpa, handleFastShipGranddaughter, handleFastShipCaptain, handleVermilionPortSailor, handleSleepingSnorlax, evaluateFastShipWarp
 * @layer world
 * @sections L1-35: Micro-Header & Imports | L36-95: Port Guard & Sailor Exit | L96-180: Cabin Rest & Grandpa Quest | L181-255: Vermilion Lore & Snorlax | L256-340: Dynamic Warp Gate Evaluator & Registrations
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * Checks whether the player holds a valid S.S. Ticket in keyItems, items, or story flags.
 */
export function hasValidSsTicket(ctx: {
  inventory: { keyItems?: string[]; items?: Record<string, number> };
  storyFlags: ReadonlySet<string>;
}): boolean {
  return (
    (ctx.inventory.keyItems || []).includes('ss-ticket') ||
    (ctx.inventory.keyItems || []).includes('ss_ticket') ||
    (ctx.inventory.keyItems || []).includes('S.S. TICKET') ||
    Boolean(ctx.inventory.items?.['ss-ticket']) ||
    Boolean(ctx.inventory.items?.['ss_ticket']) ||
    ctx.storyFlags.has('has_ss_ticket') ||
    ctx.storyFlags.has('hall_of_fame_inducted') ||
    ctx.storyFlags.has('EVENT_GOT_SS_TICKET')
  );
}

/**
 * 1. Olivine Port Sailor Guard (S.S. Ticket Verification & Pier Passage)
 */
export const handlePortSailorGuard: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!hasValidSsTicket(ctx)) {
    ctx.openDialogue(
      [
        "SAILOR: We don't want you to fall into the sea, so you're not allowed onto the pier without an S.S. TICKET!",
        'Only certified trainers who have conquered the JOHTO LEAGUE receive a ticket from PROF. ELM.',
      ],
      targetNpc.speaker || '⚓ SAILOR'
    );
    return true;
  }

  // Clear barrier and welcome player
  targetNpc.x = 6;
  if (targetNpc.originX !== undefined) targetNpc.originX = 6;
  ctx.storyFlags.add('port_barrier_cleared');
  ctx.storyFlags.add('ship_bound_vermilion');
  ctx.storyFlags.delete('ship_bound_olivine');

  ctx.openDialogue(
    [
      'SAILOR: Welcome aboard the FAST SHIP S.S. AQUA!',
      'Your S.S. TICKET is confirmed! Please proceed down the gangway ahead to board the ship.',
    ],
    targetNpc.speaker || '⚓ SAILOR'
  );
  return true;
};

/**
 * 2. Fast Ship Sailor Exit / Gangway Attendant
 */
export const handleFastShipSailorExit: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const boundToOlivine = ctx.storyFlags.has('ship_bound_olivine');
  const hasArrived = boundToOlivine
    ? ctx.storyFlags.has('fast_ship_arrived_olivine')
    : (ctx.storyFlags.has('fast_ship_arrived_vermilion') || ctx.storyFlags.has('EVENT_FAST_SHIP_ARRIVED_VERMILION'));

  const destCity = boundToOlivine ? 'OLIVINE CITY' : 'VERMILION CITY';
  const regionName = boundToOlivine ? 'JOHTO' : 'KANTO';

  if (!hasArrived) {
    ctx.openDialogue(
      [
        `SAILOR: FAST SHIP S.S. AQUA is en route to ${destCity}.`,
        'We will make an announcement when we arrive. Feel free to relax in your cabin or explore the deck!',
      ],
      targetNpc.speaker || '⚓ SAILOR'
    );
    return true;
  }

  ctx.openDialogue(
    [
      `SAILOR: FAST SHIP S.S. AQUA has arrived in ${destCity}.`,
      `Have a wonderful time in ${regionName}! Watch your step as you disembark.`,
    ],
    targetNpc.speaker || '⚓ SAILOR'
  );
  return true;
};

/**
 * 3. Fast Ship Cabin SW Rest (Field Rest, Party Healing & Arrival Trigger)
 */
export const handleFastShipCabinRest: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    ['A comfortable ship cabin bed. Time for a quick rest!'],
    targetNpc.speaker || '🛏️ CABIN BED',
    () => {
      ctx.healPlayerParty(false);
      if (ctx.playerParty) {
        for (const p of ctx.playerParty) {
          p.currentHp = p.stats.hp;
          p.status = undefined;
          if (p.moves) {
            for (const m of p.moves) {
              m.currentPp = m.maxPp;
            }
          }
        }
      }
      ctx.saveCurrentGame?.();
      BattleAudio.playMenuSound('HEAL');

      const boundToOlivine = ctx.storyFlags.has('ship_bound_olivine');
      const isAlreadyArrived = boundToOlivine
        ? ctx.storyFlags.has('fast_ship_arrived_olivine')
        : (ctx.storyFlags.has('fast_ship_arrived_vermilion') || ctx.storyFlags.has('EVENT_FAST_SHIP_ARRIVED_VERMILION'));

      const onDone = () => {
        ctx.showToast?.('Your Pokémon were fully restored!');
        // Canon GSC: ship arrives while you sleep if not arrived already
        if (!isAlreadyArrived) {
          if (boundToOlivine) {
            ctx.storyFlags.add('fast_ship_arrived_olivine');
            ctx.openDialogue(
              [
                'DING-DONG!',
                'FAST SHIP S.S. AQUA has arrived in OLIVINE CITY, JOHTO!',
              ],
              '📢 SHIP ANNOUNCER'
            );
          } else {
            ctx.storyFlags.add('fast_ship_arrived_vermilion');
            ctx.storyFlags.add('EVENT_FAST_SHIP_ARRIVED_VERMILION');
            ctx.openDialogue(
              [
                'DING-DONG!',
                'FAST SHIP S.S. AQUA has arrived in VERMILION CITY, KANTO!',
              ],
              '📢 SHIP ANNOUNCER'
            );
          }
        }
      };

      if (ctx.playFieldRestAnimation) {
        ctx.playFieldRestAnimation(onDone);
      } else {
        onDone();
      }
    }
  );
  return true;
};

/**
 * 4. Fast Ship Grandpa Quest (Lost Granddaughter Search & Metal Coat Reward)
 */
export const handleFastShipGrandpa: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const granddaughterFound =
    ctx.storyFlags.has('granddaughter_found') ||
    ctx.storyFlags.has('granddaughter_returned');

  if (!granddaughterFound) {
    ctx.openDialogue(
      [
        'Oh dear, oh dear! Where did my little granddaughter wander off to?',
        'She was right beside me a moment ago! Please help an old man find her on this huge ship!',
      ],
      targetNpc.speaker || '👴 WORRIED GENTLEMAN'
    );
    return true;
  }

  if (!ctx.storyFlags.has('got_metal_coat')) {
    ctx.openDialogue(
      [
        'Ah! My granddaughter is safe! Thank you so much, young trainer!',
        'I was so worried about her. Please take this as a token of my gratitude!',
      ],
      targetNpc.speaker || '👴 WORRIED GENTLEMAN',
      () => {
        ctx.storyFlags.add('got_metal_coat');
        ctx.storyFlags.add('granddaughter_returned');

        // Award exactly once via addOverworldItemToInventory only
        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('metal_coat');
        } else {
          if (!ctx.inventory.items) ctx.inventory.items = {};
          ctx.inventory.items['metal-coat'] = (ctx.inventory.items['metal-coat'] || 0) + 1;
        }

        const boundToOlivine = ctx.storyFlags.has('ship_bound_olivine');
        if (boundToOlivine) {
          ctx.storyFlags.add('fast_ship_arrived_olivine');
        } else {
          ctx.storyFlags.add('fast_ship_arrived_vermilion');
          ctx.storyFlags.add('EVENT_FAST_SHIP_ARRIVED_VERMILION');
        }
        ctx.saveCurrentGame?.();

        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.showToast?.('Received METAL COAT from Grandpa!');

        // Ship PA arrival chime
        const dest = boundToOlivine ? 'OLIVINE CITY, JOHTO' : 'VERMILION CITY, KANTO';
        ctx.openDialogue(
          [
            'DING-DONG!',
            `FAST SHIP S.S. AQUA has arrived in ${dest}!`,
          ],
          '📢 SHIP ANNOUNCER'
        );
      }
    );
    return true;
  }

  ctx.openDialogue(
    ['Thank you again for looking after my granddaughter! Have a wonderful trip!'],
    targetNpc.speaker || '👴 WORRIED GENTLEMAN'
  );
  return true;
};

/**
 * 5. Fast Ship Lost Granddaughter (Captain's Cabin / Cabin SE)
 */
export const handleFastShipGranddaughter: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!ctx.storyFlags.has('granddaughter_found')) {
    ctx.openDialogue(
      [
        "I'm playing with the Captain!",
        "...Oh? Grandpa is worried about me? I'd better get back to our cabin right away!",
      ],
      targetNpc.speaker || '👧 LITTLE GIRL',
      () => {
        ctx.storyFlags.add('granddaughter_found');
        BattleAudio.playOverworldSound('FANFARE');
        ctx.showToast?.('Found Grandpa’s granddaughter!');
      }
    );
    return true;
  }

  ctx.openDialogue(
    ['Grandpa was so relieved! Thank you for finding me!'],
    targetNpc.speaker || '👧 LITTLE GIRL'
  );
  return true;
};

/**
 * 6. Fast Ship Captain
 */
export const handleFastShipCaptain: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'Ahoy! I was just keeping this little girl entertained while her grandfather was busy.',
      'Thanks for looking after her, trainer! S.S. AQUA is sailing smoothly on schedule.',
    ],
    targetNpc.speaker || '👨‍✈️ SHIP CAPTAIN'
  );
  return true;
};

/**
 * 7. Vermilion Port Sailor (Return Boarding to Olivine City)
 */
export const handleVermilionPortSailor: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!hasValidSsTicket(ctx)) {
    ctx.openDialogue(
      ['SAILOR: You need an S.S. TICKET to board FAST SHIP S.S. AQUA!'],
      targetNpc.speaker || '⚓ SAILOR'
    );
    return true;
  }

  ctx.storyFlags.add('ship_bound_olivine');
  ctx.storyFlags.delete('ship_bound_vermilion');
  ctx.storyFlags.delete('fast_ship_arrived_olivine');
  ctx.storyFlags.delete('fast_ship_arrived_vermilion');

  ctx.openDialogue(
    [
      'SAILOR: Welcome to VERMILION PORT!',
      'FAST SHIP S.S. AQUA is preparing to sail for OLIVINE CITY in JOHTO.',
      'Please proceed down the gangway ahead to board the ship whenever you are ready!',
    ],
    targetNpc.speaker || '⚓ SAILOR'
  );
  return true;
};

/**
 * 8. Sleeping Snorlax Diglett's Cave Obstacle
 */
export const handleSleepingSnorlax: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'SNORLAX is snoring peacefully in front of the cave entrance...',
      'It is fast asleep and completely unresponsive! A POKéGEAR broadcast might wake it up.',
    ],
    targetNpc.speaker || '💤 SNORLAX'
  );
  return true;
};

export interface FastShipWarpEvaluation {
  blocked: boolean;
  blockedMessages?: string[];
  blockedSpeaker?: string;
}

/**
 * Evaluates dynamic Fast Ship warps for exit gating, destination switching, and boarding tickets.
 */
export function evaluateFastShipWarp(
  currentMapId: string,
  warp: { x: number; y: number; targetMapId: string; targetX: number; targetY: number },
  storyFlags: Set<string>,
  inventory: { keyItems?: string[]; items?: Record<string, number> }
): FastShipWarpEvaluation {
  // 1. Disembarking from Fast Ship 1F at (25, 1)
  if (currentMapId === 'fast_ship_1f' && warp.x === 25 && warp.y === 1) {
    const boundToOlivine = storyFlags.has('ship_bound_olivine');
    const isArrived = boundToOlivine
      ? storyFlags.has('fast_ship_arrived_olivine')
      : (storyFlags.has('fast_ship_arrived_vermilion') || storyFlags.has('EVENT_FAST_SHIP_ARRIVED_VERMILION'));

    const dest = boundToOlivine ? 'OLIVINE CITY' : 'VERMILION CITY';

    if (!isArrived) {
      return {
        blocked: true,
        blockedMessages: [
          `SAILOR: FAST SHIP S.S. AQUA is en route to ${dest}.`,
          'We will make an announcement when we arrive. Feel free to relax in your cabin or explore the deck!',
        ],
        blockedSpeaker: '⚓ SAILOR',
      };
    }

    // Set destination and flip state for next voyage
    if (boundToOlivine) {
      warp.targetMapId = 'olivine_port';
      warp.targetX = 7;
      warp.targetY = 24;
      storyFlags.delete('fast_ship_arrived_olivine');
      storyFlags.delete('ship_bound_olivine');
      storyFlags.add('ship_bound_vermilion');
    } else {
      warp.targetMapId = 'vermilion_port';
      warp.targetX = 7;
      warp.targetY = 18;
      storyFlags.delete('fast_ship_arrived_vermilion');
      storyFlags.delete('EVENT_FAST_SHIP_ARRIVED_VERMILION');
      storyFlags.delete('ship_bound_vermilion');
      storyFlags.add('ship_bound_olivine');
    }
    return { blocked: false };
  }

  // 2. Boarding from Vermilion Port
  if (currentMapId === 'vermilion_port' && warp.targetMapId === 'fast_ship_1f') {
    if (!hasValidSsTicket({ inventory, storyFlags })) {
      return {
        blocked: true,
        blockedMessages: ['SAILOR: You need an S.S. TICKET to board FAST SHIP S.S. AQUA!'],
        blockedSpeaker: '⚓ SAILOR',
      };
    }
    storyFlags.add('ship_bound_olivine');
    storyFlags.delete('ship_bound_vermilion');
    storyFlags.delete('fast_ship_arrived_olivine');
    storyFlags.delete('fast_ship_arrived_vermilion');
    return { blocked: false };
  }

  // 3. Boarding from Olivine Port
  if (currentMapId === 'olivine_port' && warp.targetMapId === 'fast_ship_1f') {
    storyFlags.add('ship_bound_vermilion');
    storyFlags.delete('ship_bound_olivine');
    storyFlags.delete('fast_ship_arrived_olivine');
    storyFlags.delete('fast_ship_arrived_vermilion');
    return { blocked: false };
  }

  return { blocked: false };
}

/**
 * Returns all interaction registrations for S.S. Aqua and Vermilion City.
 */
export function getFastShipAndVermilionInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['PORT_SAILOR_GUARD'],
      npcIds: ['port_sailor_guard'],
      handler: handlePortSailorGuard,
    },
    {
      actions: ['FAST_SHIP_SAILOR_EXIT'],
      npcIds: ['fast_ship_1f_sailor_0'],
      handler: handleFastShipSailorExit,
    },
    {
      actions: ['FAST_SHIP_CABIN_REST'],
      handler: handleFastShipCabinRest,
    },
    {
      actions: ['FAST_SHIP_GRANDPA', 'FAST_SHIP_GRANDPA_CABIN'],
      npcIds: [
        'fast_ship_1f_gentleman_3',
        'fast_ship_cabins_se_sse_captains_cabin_gentleman_cabin',
      ],
      handler: handleFastShipGrandpa,
    },
    {
      actions: ['FAST_SHIP_GRANDDAUGHTER', 'FAST_SHIP_GRANDDAUGHTER_CABIN'],
      npcIds: [
        'fast_ship_cabins_se_sse_captains_cabin_twin_2',
        'fast_ship_cabins_se_sse_captains_cabin_twin_cabin',
      ],
      handler: handleFastShipGranddaughter,
    },
    {
      actions: ['FAST_SHIP_CAPTAIN'],
      npcIds: ['fast_ship_cabins_se_sse_captains_cabin_gentleman_0'],
      handler: handleFastShipCaptain,
    },
    {
      actions: ['VERMILION_PORT_SAILOR'],
      npcIds: ['vermilion_port_sailor', 'vermilion_port_sailor_0'],
      handler: handleVermilionPortSailor,
    },
    {
      actions: ['SNORLAX_OBSTACLE'],
      npcIds: ['vermilion_city_snorlax'],
      handler: handleSleepingSnorlax,
    },
  ];
}
