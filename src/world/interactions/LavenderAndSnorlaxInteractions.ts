/**
 * @fileoverview LavenderAndSnorlaxInteractions domain module implementation.
 * Handles Lavender Radio Tower Director EXPN Card, Sleeping Snorlax Poké Flute awakening,
 * and Route 5 Cleanse Tag Grandma.
 * @module world/interactions/LavenderAndSnorlaxInteractions
 * @role Domain Interaction Logic
 * @exports handleLavenderRadioTowerDirector, handleSleepingSnorlaxAwakening, handleRoute5CleanseTagGrandma, getLavenderAndSnorlaxInteractions
 * @layer world
 * @sections L1-16: Micro-Header & Imports | L17-145: Lavender Radio & Snorlax | L146-215: Route 5 & Registration
 */

import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionContext, NpcInteractionRegistration } from '../../types/worldContext';

/**
 * Handles Lavender Radio Tower Director awarding the EXPN Card.
 */
export function handleLavenderRadioTowerDirector(
  _directorNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (!ctx.storyFlags.has('EVENT_RESTORED_POWER_TO_KANTO')) {
    ctx.openDialogue(
      [
        'DIRECTOR: Oh, no, no, no! Our broadcast antennas cannot transmit without power from the POWER PLANT!',
        'If the generator is not fixed soon, all of KANTO will remain without radio programs!',
      ],
      '📻 DIRECTOR'
    );
    return true;
  }

  const hasExpnCard =
    ctx.storyFlags.has('has_expn_card') ||
    ctx.storyFlags.has('EVENT_GOT_EXPN_CARD') ||
    Boolean(
      ctx.inventory.keyItems?.some(
        (k) =>
          k.toLowerCase() === 'expn-card' ||
          k.toLowerCase() === 'expn_card' ||
          k.toLowerCase() === 'expn card'
      )
    ) ||
    Boolean(ctx.inventory.items?.['expn-card']);

  if (!hasExpnCard) {
    ctx.openDialogue(
      [
        'DIRECTOR: Ah! The power has finally returned! Electricity is surging through our transmission antennas!',
        'You played a major role in restoring the Power Plant? That is magnificent!',
        'As the Director of the KANTO RADIO TOWER, please accept this EXPN CARD!',
        `${ctx.playerName || 'Gold'} received the EXPN CARD!`,
        'With this EXPN CARD installed into your POKéGEAR, you can tune into all KANTO radio channels, including the # FLUTE channel!',
      ],
      '📻 DIRECTOR',
      () => {
        if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
        if (!ctx.inventory.keyItems.includes('expn-card')) {
          ctx.inventory.keyItems.push('expn-card');
        }
        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items['expn-card'] = 1;

        ctx.storyFlags.add('has_expn_card');
        ctx.storyFlags.add('EVENT_GOT_EXPN_CARD');

        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.showToast('📻 Received EXPN CARD! Kanto radio frequencies unlocked!');
        ctx.saveCurrentGame();
      }
    );
    return true;
  }

  ctx.openDialogue(
    [
      'DIRECTOR: The radio broadcasts are reaching every corner of KANTO!',
      'Thank you for helping restore power to our station!',
    ],
    '📻 DIRECTOR'
  );
  return true;
}

/**
 * Handles Sleeping Snorlax awakening via EXPN Card Poké Flute melody.
 */
export function handleSleepingSnorlaxAwakening(
  snorlaxNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('snorlax_cleared') || ctx.storyFlags.has('EVENT_FOUGHT_SNORLAX')) {
    return false;
  }

  const hasExpnCard =
    ctx.storyFlags.has('has_expn_card') ||
    ctx.storyFlags.has('EVENT_GOT_EXPN_CARD') ||
    Boolean(
      ctx.inventory.keyItems?.some(
        (k) =>
          k.toLowerCase() === 'expn-card' ||
          k.toLowerCase() === 'expn_card' ||
          k.toLowerCase() === 'expn card'
      )
    ) ||
    Boolean(ctx.inventory.items?.['expn-card']);

  if (!hasExpnCard) {
    ctx.openDialogue(
      [
        'SNORLAX is snoring peacefully in front of the cave entrance...',
        'It is fast asleep and completely unresponsive! A POKéGEAR broadcast might wake it up.',
      ],
      '💤 SNORLAX'
    );
    return true;
  }

  ctx.openDialogue(
    [
      "The POKéGEAR tuned into Kanto's # FLUTE broadcast channel...",
      'A soothing melody gently resonates through the air!',
      'SNORLAX woke up with a mighty yawn! It attacked in a grumpy rage!',
    ],
    '💤 SNORLAX',
    () => {
      BattleAudio.playCry('snorlax');
      const snorlaxPkmn = PokemonFactory.create('snorlax', 50, [
        'rest',
        'snore',
        'rollout',
        'bodyslam',
      ]);
      snorlaxPkmn.heldItem = 'leftovers';

      ctx.triggerBattle(snorlaxPkmn, {
        onBattleEnd: (res?: any) => {
          if (res?.fled || (res?.winner && res.winner !== 'PLAYER' && !res.caught)) return;
          ctx.storyFlags.add('snorlax_cleared');
          ctx.storyFlags.add('EVENT_FOUGHT_SNORLAX');

          if (ctx.npcsByMap.vermilion_city) {
            ctx.npcsByMap.vermilion_city = ctx.npcsByMap.vermilion_city.filter(
              (n) => n.id !== snorlaxNpc.id && n.id !== 'vermilion_city_snorlax'
            );
          }
          if (ctx.npcsByMap.route_11) {
            ctx.npcsByMap.route_11 = ctx.npcsByMap.route_11.filter(
              (n) => n.id !== snorlaxNpc.id && n.id !== 'vermilion_city_snorlax'
            );
          }

          const currentMap = ctx.mapManager.getCurrentMap();
          if (currentMap) {
            ctx.renderMap?.(currentMap);
            ctx.syncMapOverworldItems?.(currentMap);
          }

          ctx.showToast(
            "💤 Snorlax woke up and stomped away! The path to Diglett's Cave is clear!"
          );
          ctx.saveCurrentGame();
        },
      });
    }
  );
  return true;
}

/**
 * Handles Route 5 Cleanse Tag House Grandma.
 */
export function handleRoute5CleanseTagGrandma(
  _grandmaNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('got_cleanse_tag') || ctx.storyFlags.has('EVENT_GOT_CLEANSE_TAG')) {
    ctx.openDialogue(
      [
        'GRANDMA: Have you equipped the CLEANSE TAG to your lead POKéMON?',
        'It will ward off wild POKéMON encounters when held!',
      ],
      '👵 GRANDMA'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'GRANDMA: Many frightening spirits and fierce wild POKéMON roam the roads...',
      'Here, take this CLEANSE TAG. It will keep unwanted wild encounters away.',
      `${ctx.playerName || 'Gold'} received the CLEANSE TAG!`,
    ],
    '👵 GRANDMA',
    () => {
      if (!ctx.inventory.items) ctx.inventory.items = {};
      ctx.inventory.items['cleanse-tag'] = (ctx.inventory.items['cleanse-tag'] || 0) + 1;
      ctx.storyFlags.add('got_cleanse_tag');
      ctx.storyFlags.add('EVENT_GOT_CLEANSE_TAG');

      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast('🧿 Received CLEANSE TAG from Grandma!');
      ctx.saveCurrentGame();
    }
  );
  return true;
}

export function getLavenderAndSnorlaxInteractions(): NpcInteractionRegistration[] {
  return [
    {
      npcIds: ['lavender_radio_tower_director'],
      actions: ['LAVENDER_RADIO_TOWER_DIRECTOR'],
      handler: (targetNpc, _map, ctx) => handleLavenderRadioTowerDirector(targetNpc, ctx),
    },
    {
      npcIds: ['vermilion_city_snorlax'],
      actions: ['SNORLAX_OBSTACLE'],
      handler: (targetNpc, _map, ctx) => handleSleepingSnorlaxAwakening(targetNpc, ctx),
    },
    {
      npcIds: ['route_5_cleanse_tag_grandma'],
      actions: ['ROUTE_5_CLEANSE_TAG_GRANDMA'],
      handler: (targetNpc, _map, ctx) => handleRoute5CleanseTagGrandma(targetNpc, ctx),
    },
  ];
}
