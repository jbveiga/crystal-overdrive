/**
 * @fileoverview MahoganyTownAndLakeInteractions domain module implementation.
 * @module world/interactions/MahoganyTownAndLakeInteractions
 * @role Mahogany Town and Lake of Rage Interactions Component
 * @exports getMahoganyTownAndLakeInteractions, handleRedGyarados, handleLakeLance, handleMahoganyGymBlocker, handleLanceMartReveal, handleRageCandyBarSalesman, handleRoute43GateOfficer, handleHiddenPowerGuru, handleMagikarpLengthGuru
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-120: Lake of Rage Handlers | L121-220: Mahogany Town & Gate Handlers | L221-270: Registration Factory
 */

import type {
  NpcInteractionContext,
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

/**
 * 1. Lake of Rage: Shiny Red Gyarados Boss Encounter
 */
export const handleRedGyarados: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('red_gyarados_subdued') || ctx.storyFlags.has('EVENT_LAKE_OF_RAGE_RED_GYARADOS')) {
    return true;
  }
  BattleAudio.playCry('gyarados');
  ctx.openDialogue(
    [
      'GYARADOS: Gyashaa!!',
      "The lake's surface churns violently as the crimson Gyarados thrashes with uncontrollable fury!",
      'It lunges at you from the swirling waters!',
    ],
    '🐉 RED GYARADOS',
    () => {
      const redGyarados = PokemonFactory.createShinyRedGyarados(30);
      ctx.triggerBattle(redGyarados, {
        onBattleEnd: (result) => {
          if (result.winner === 'PLAYER' || result.caught) {
            ctx.storyFlags.add('red_gyarados_subdued');
            ctx.storyFlags.add('EVENT_LAKE_OF_RAGE_RED_GYARADOS');
            ctx.addOverworldItemToInventory('red_scale');
            ctx.missionManager?.checkStoryFlags?.(ctx.storyFlags);
            ctx.audioManager?.playSfx?.('sfx_badge_get');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.openDialogue(
              [
                'GYARADOS calmed down and submerged into the serene depths of the lake...',
                'As the waters quieted, you recovered the dropped RED SCALE!',
              ],
              '🐉 RED GYARADOS',
              () => {
                const curMap = ctx.mapManager.getCurrentMap();
                if (curMap) {
                  ctx.renderMap?.(curMap);
                  ctx.syncMapOverworldItems?.(curMap);
                }
                ctx.saveCurrentGame();
                ctx.showToast('🐉 Obtained RED SCALE! Meet Lance at the shoreline.');
              }
            );
          }
        },
      });
    }
  );
  return true;
};

/**
 * 2. Lake of Rage Shoreline: Champion Lance Briefing
 */
export const handleLakeLance: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  const isGyaradosQuelled =
    ctx.storyFlags.has('red_gyarados_subdued') || ctx.storyFlags.has('EVENT_LAKE_OF_RAGE_RED_GYARADOS');

  if (!isGyaradosQuelled) {
    ctx.openDialogue(
      ['LANCE: ...Something unnatural is disturbing this lake. Look at the water churn!'],
      '🏆 LANCE'
    );
    return true;
  }

  ctx.openDialogue(
    [
      "...So you're the trainer who quelled that raging Gyarados. Outstanding courage and skill!",
      "My name is LANCE. I'm a dragon trainer investigating the rumors of forced evolution in this lake.",
      'The Magikarp here were forced to evolve by a sinister, high-frequency radio broadcast.',
      'The signal originates from MAHOGANY TOWN. There must be a subterranean TEAM ROCKET base hidden there!',
      'Will you join forces with me to storm their hideout and shut down the transmitter?',
      'Splendid! Rendezvous with me inside the souvenir shop in Mahogany Town. I will go on ahead!',
    ],
    '🏆 LANCE',
    () => {
      ctx.storyFlags.add('lance_lake_talked');
      ctx.storyFlags.add('EVENT_DECIDED_TO_HELP_LANCE');
      ctx.missionManager?.checkStoryFlags?.(ctx.storyFlags);
      const curMap = ctx.mapManager.getCurrentMap();
      if (curMap) {
        ctx.renderMap?.(curMap);
        ctx.syncMapOverworldItems?.(curMap);
      }
      ctx.saveCurrentGame();
      ctx.showToast('Rendezvous with Lance at the Mahogany Souvenir Shop!');
    }
  );
  return true;
};

/**
 * 3. Mahogany Town: Gym Entrance Blocker (Pryce investigating Lake)
 */
export const handleMahoganyGymBlocker: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'TOWN RESIDENT: Gym Leader Pryce went to the Lake of Rage to investigate the strange disturbance.',
      'The Gym is closed until the emergency at the lake and the souvenir shop is fully resolved!',
    ],
    'TOWN RESIDENT'
  );
  return true;
};

/**
 * 4. Mahogany Mart 1F: Lance Secret Staircase Reveal
 */
export const handleLanceMartReveal: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'LANCE: You made it! The transmitter signal is emanating directly from beneath this floor.',
      'Lance firmly slides the heavy oak cabinet aside, revealing a concealed stairway leading underground!',
      'LANCE: Team Rocket has set up an entire subterranean facility below this shop.',
      'Follow me down! We must fight our way to the power generator and free the Electrodes powering their machine!',
    ],
    '🏆 LANCE',
    () => {
      ctx.storyFlags.add('lance_hideout_briefed');
      ctx.storyFlags.add('EVENT_UNCOVERED_STAIRCASE_IN_MAHOGANY_MART');
      ctx.missionManager?.checkStoryFlags?.(ctx.storyFlags);
      ctx.saveCurrentGame();
      ctx.showToast('Infiltrate Team Rocket Hideout B1F via secret stairs!');
    }
  );
  return true;
};

/**
 * 5. Mahogany Town: RageCandyBar Salesman (East Route 44 Blocker & Vendor)
 */
export const handleRageCandyBarSalesman: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  const isHideoutCleared =
    ctx.storyFlags.has('rocket_base_generator_cleared') || ctx.storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');

  if (isHideoutCleared) {
    ctx.openDialogue(
      ['RAGECANDYBAR is sold out. I am packing up to head out soon!'],
      '🍬 RAGECANDYBAR SALESMAN'
    );
    return true;
  }

  const price = 300;
  if (ctx.inventory.money >= price) {
    ctx.inventory.money -= price;
    ctx.addOverworldItemToInventory('rage_candy_bar');
    BattleAudio.playOverworldSound('KEY_ITEM');
    ctx.openDialogue(
      [
        'Hiya, kid! I see you are new in MAHOGANY TOWN.',
        'Since you are new, you should try a yummy RAGECANDYBAR!',
        'Paid ¥300 for a delicious RAGECANDYBAR!',
        'Savor it! It completely restores the HP of any POKéMON!',
      ],
      '🍬 RAGECANDYBAR SALESMAN',
      () => {
        ctx.saveCurrentGame();
        ctx.showToast('Obtained RAGECANDYBAR!');
      }
    );
  } else {
    ctx.openDialogue(
      [
        'Hiya, kid! I see you are new in MAHOGANY TOWN.',
        'Since you are new, you should try a yummy RAGECANDYBAR!',
        'Right now, it can be yours for just ¥300!',
        'You do not have enough money! Come back when you have ¥300.',
      ],
      '🍬 RAGECANDYBAR SALESMAN'
    );
  }
  return true;
};

/**
 * 6. Route 43 Gatehouse: Officer TM36 Sludge Bomb Grant
 */
export const handleRoute43GateOfficer: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  const isHideoutCleared =
    ctx.storyFlags.has('rocket_base_generator_cleared') || ctx.storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');

  if (!isHideoutCleared) {
    ctx.openDialogue(
      ['OFFICER: Be careful! Suspicious characters in black uniforms have taken over the gatehouse up ahead!'],
      '👮 OFFICER'
    );
    return true;
  }

  if (ctx.storyFlags.has('EVENT_GOT_TM36_SLUDGE_BOMB')) {
    ctx.openDialogue(['OFFICER: Use this gate to avoid walking in the tall grass.'], '👮 OFFICER');
    return true;
  }

  ctx.openDialogue(
    [
      'OFFICER: I got chased from my post by those thugs in black.',
      'They left this behind when they fled. It makes me uncomfortable. Could you take it away?',
      'Received TM36 SLUDGE BOMB!',
      'OFFICER: TM36 is SLUDGE BOMB! It has a high chance of badly poisoning the target.',
    ],
    '👮 OFFICER',
    () => {
      ctx.storyFlags.add('EVENT_GOT_TM36_SLUDGE_BOMB');
      ctx.addOverworldItemToInventory('TM36');
      ctx.audioManager?.playSfx?.('sfx_badge_get');
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.saveCurrentGame();
      ctx.showToast('Obtained TM36 SLUDGE BOMB!');
    }
  );
  return true;
};

/**
 * 7. Lake of Rage: Hidden Power House TM10 Grant
 */
export const handleHiddenPowerGuru: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('EVENT_GOT_TM10_HIDDEN_POWER')) {
    ctx.openDialogue(
      ['I am meditating… Inside all POKéMON lies a power waiting to awaken.'],
      '🧘 MEDITATING GURU'
    );
    return true;
  }

  ctx.openDialogue(
    [
      '…You have strayed far…',
      'Here I have meditated. Inside me, a new power has been awakened.',
      'Let me share my power with your POKéMON. Take this, child.',
      'Received TM10 HIDDEN POWER!',
      'Do you see it? It is HIDDEN POWER! It draws out the power of POKéMON for attacking.',
      'Remember this: its type and power depend on the POKéMON using it.',
    ],
    '🧘 MEDITATING GURU',
    () => {
      ctx.storyFlags.add('EVENT_GOT_TM10_HIDDEN_POWER');
      ctx.addOverworldItemToInventory('TM10');
      ctx.audioManager?.playSfx?.('sfx_badge_get');
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.saveCurrentGame();
      ctx.showToast('Obtained TM10 HIDDEN POWER!');
    }
  );
  return true;
};

/**
 * 8. Lake of Rage: Magikarp Guru House Record Evaluation
 */
export const handleMagikarpLengthGuru: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  const hasMagikarp = ctx.playerParty?.some((p) => p.speciesId?.toLowerCase() === 'magikarp');

  if (hasMagikarp) {
    ctx.openDialogue(
      [
        'FISHING GURU: Magnificent! You brought a MAGIKARP!',
        'Let me measure its length... Hmm! This is an impressive, healthy specimen!',
        'Keep fishing! There are legends of truly titanic Magikarp swimming in Lake of Rage!',
      ],
      '🎣 FISHING GURU'
    );
  } else {
    ctx.openDialogue(
      [
        'FISHING GURU: Lake of Rage is famous for its monstrously huge MAGIKARP.',
        'If you catch a MAGIKARP with your ROD, bring it to me so I can rate its length!',
      ],
      '🎣 FISHING GURU'
    );
  }
  return true;
};

/**
 * Registration factory for Mahogany Town and Lake of Rage interactions
 */
export function getMahoganyTownAndLakeInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['RED_GYARADOS_EVENT'],
      npcIds: ['lake_of_rage_red_gyarados'],
      handler: handleRedGyarados,
    },
    {
      actions: ['LANCE_LAKE_EVENT'],
      npcIds: ['lake_of_rage_lance'],
      handler: handleLakeLance,
    },
    {
      actions: ['MAHOGANY_GYM_BLOCKER'],
      npcIds: ['mahogany_gym_blocker'],
      handler: handleMahoganyGymBlocker,
    },
    {
      actions: ['LANCE_MART_EVENT'],
      npcIds: ['mahogany_mart_lance'],
      handler: handleLanceMartReveal,
    },
    {
      actions: ['MAHOGANY_RAGECANDYBAR_SALESMAN'],
      npcIds: ['mahogany_rage_candy_bar_salesman'],
      handler: handleRageCandyBarSalesman,
    },
    {
      actions: ['ROUTE_43_GATE_OFFICER'],
      npcIds: ['route_43_gate_officer_0'],
      handler: handleRoute43GateOfficer,
    },
    {
      actions: ['LAKE_OF_RAGE_HIDDEN_POWER'],
      npcIds: ['lake_of_rage_hidden_power_house_fisher_0'],
      handler: handleHiddenPowerGuru,
    },
    {
      actions: ['LAKE_OF_RAGE_MAGIKARP_GURU'],
      npcIds: ['lake_of_rage_magikarp_house_fishing_guru_0'],
      handler: handleMagikarpLengthGuru,
    },
  ];
}
