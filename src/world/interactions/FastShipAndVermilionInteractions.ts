/**
 * @fileoverview FastShipAndVermilionInteractions domain module implementation.
 * @module world/interactions/FastShipAndVermilionInteractions
 * @role S.S. Aqua Fast Ship & Vermilion City Interactions Component
 * @exports getFastShipAndVermilionInteractions, handlePortSailorGuard, handleFastShipSailorExit, handleFastShipCabinRest, handleFastShipGrandpa, handleFastShipGranddaughter, handleFastShipCaptain, handleVermilionPortSailor, handleSleepingSnorlax
 * @layer world
 * @sections L1-30: Micro-Header & Imports | L31-85: Port Guard & Sailor Exit | L86-135: Cabin Rest & Quest | L136-190: Vermilion City & Registrations
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * 1. Olivine Port Sailor Guard (S.S. Ticket Verification & Pier Passage)
 */
export const handlePortSailorGuard: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const hasTicket =
    Boolean(ctx.inventory.items?.['ss-ticket']) ||
    Boolean(ctx.inventory.items?.['ss_ticket']) ||
    Boolean(ctx.inventory.items?.['S.S. TICKET']) ||
    (ctx.inventory.keyItems || []).includes('ss_ticket') ||
    (ctx.inventory.keyItems || []).includes('S.S. TICKET') ||
    ctx.storyFlags.has('has_ss_ticket') ||
    ctx.storyFlags.has('hall_of_fame_inducted') ||
    ctx.storyFlags.has('EVENT_GOT_SS_TICKET');

  if (!hasTicket) {
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
  const hasArrived =
    ctx.storyFlags.has('fast_ship_arrived_vermilion') ||
    ctx.storyFlags.has('EVENT_FAST_SHIP_ARRIVED_VERMILION');

  if (!hasArrived) {
    ctx.openDialogue(
      [
        'SAILOR: FAST SHIP S.S. AQUA is en route to VERMILION CITY.',
        'We will make an announcement when we arrive. Feel free to relax in your cabin or explore the deck!',
      ],
      targetNpc.speaker || '⚓ SAILOR'
    );
    return true;
  }

  // Clear gangway exit
  targetNpc.x = 24;
  if (targetNpc.originX !== undefined) targetNpc.originX = 24;

  ctx.openDialogue(
    [
      'SAILOR: FAST SHIP S.S. AQUA has arrived in VERMILION CITY.',
      'Have a wonderful time in KANTO! Watch your step as you disembark.',
    ],
    targetNpc.speaker || '⚓ SAILOR'
  );
  return true;
};

/**
 * 3. Fast Ship Cabin SW Rest (Field Rest & Party Healing)
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
      const onDone = () => {
        ctx.showToast?.('Your Pokémon were fully restored!');
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
        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items['metal_coat'] = (ctx.inventory.items['metal_coat'] || 0) + 1;
        ctx.inventory.items['metal-coat'] = (ctx.inventory.items['metal-coat'] || 0) + 1;
        ctx.addOverworldItemToInventory?.('metal_coat');

        ctx.storyFlags.add('got_metal_coat');
        ctx.storyFlags.add('granddaughter_returned');
        ctx.storyFlags.add('fast_ship_arrived_vermilion');
        ctx.storyFlags.add('EVENT_FAST_SHIP_ARRIVED_VERMILION');
        ctx.saveCurrentGame?.();

        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.showToast?.('Received METAL COAT from Grandpa!');

        // Ship PA arrival chime
        ctx.openDialogue(
          [
            'DING-DONG!',
            'FAST SHIP S.S. AQUA has arrived in VERMILION CITY, KANTO!',
          ],
          '📢 SHIP ANNOUNCER'
        );
      }
    );
    return true;
  }

  ctx.openDialogue(
    ['Thank you again for looking after my granddaughter! Have a wonderful trip in KANTO!'],
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
  ctx.openDialogue(
    [
      'SAILOR: Welcome to VERMILION PORT!',
      'FAST SHIP S.S. AQUA sails between here and OLIVINE CITY in JOHTO.',
      'Step aboard whenever you are ready to embark on a voyage!',
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
