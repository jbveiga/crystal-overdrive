/**
 * @fileoverview CeladonAndGymErikaInteractions domain module implementation.
 * @module world/interactions/CeladonAndGymErikaInteractions
 * @role Celadon City, Celadon Gym Erika, Dept Store, Mansion, Cafe & Route 8 Interactions Component
 * @exports handleErikaInteraction, handleCeladonGymTrainer, handleCeladonGymGuideAndStatues,
 *          handleCeladonCutTree, handleCeladonCafeTrashCan, handleCeladonMansionInteractions,
 *          handleRoute8Trainer, getCeladonAndGymErikaInteractions
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-115: Erika & Celadon Gym | L116-200: Cut Tree & Cafe | L201-300: Mansion & Route 8 | L301-380: Router Registration
 */

import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionContext, NpcInteractionRegistration } from '../../types/worldContext';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';
import { ModernHMHandler } from '../ModernHMHandler';

/**
 * Handles Erika boss interaction, dialogue, pre-battle floral monologue, and victory rewards.
 */
export function handleErikaInteraction(
  erikaNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const hasWon =
    ctx.storyFlags.has('erika_defeated') ||
    (ctx.inventory?.badges && ctx.inventory.badges.includes('rainbow'));

  if (hasWon) {
    ctx.openDialogue(
      [
        "ERIKA: Losing leaves a bitter aftertaste…",
        "But knowing that there are strong trainers spurs me to do better…",
        "Please take good care of TM19 GIGA DRAIN. It will serve you and your Pokémon well on your travels.",
      ],
      erikaNpc.speaker || '🌸 LEADER ERIKA'
    );
    return true;
  }

  const preBattleSpeech = [
    "Hello… Lovely weather, isn't it? It's so pleasant… …I'm afraid I might doze off…",
    "My name is ERIKA. I am the LEADER of CELADON GYM.",
    "…Oh? All the way from JOHTO, you say? How delightful…",
    "But I must warn you… I will not lose easily to a trainer of your caliber. Shall we begin?",
  ];

  ctx.openDialogue(preBattleSpeech, erikaNpc.speaker || '🌸 LEADER ERIKA', () => {
    let team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(erikaNpc) : [];
    if (!team || team.length === 0) {
      team = [
        PokemonFactory.create('tangela', 42, ['gigadrain', 'vinewhip', 'bind', 'sleeppowder']),
        PokemonFactory.create('jumpluff', 41, ['gigadrain', 'megadrain', 'leechseed', 'cottonspore']),
        PokemonFactory.create('victreebel', 46, ['gigadrain', 'sludgebomb', 'razorleaf', 'sweetscent']),
        PokemonFactory.create('bellossom', 46, ['gigadrain', 'sunnyday', 'solarbeam', 'synthesis']),
      ];
    }

    ctx.triggerBattle(team[0], {
      isTrainer: true,
      isGymLeader: true,
      trainerName: 'LEADER ERIKA',
      trainerTeam: team,
      onVictory: () => {
        ctx.storyFlags.add('erika_defeated');
        if (ctx.inventory?.badges && !ctx.inventory.badges.includes('rainbow')) {
          ctx.inventory.badges.push('rainbow');
        }
        if (ctx.inventory?.tms && !ctx.inventory.tms.includes('TM19')) {
          ctx.inventory.tms.push('TM19');
        }
        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('tm19');
        }

        BattleAudio.playOverworldSound('KEY_ITEM');

        ctx.openDialogue(
          [
            "ERIKA: Oh! I concede defeat… You are remarkably strong…",
            `${ctx.playerName} received the RAINBOWBADGE from ERIKA!`,
            "ERIKA: That was a delightful match. I felt inspired. Please, I wish you to have this TM.",
            `${ctx.playerName} received TM19 GIGA DRAIN!`,
            "ERIKA: TM19 is GIGA DRAIN. It is a wonderful move that drains half the damage it inflicts to heal your Pokémon.",
            "Please use it if it pleases you…",
          ],
          erikaNpc.speaker || '🌸 LEADER ERIKA',
          () => {
            const curMap = ctx.mapManager.getCurrentMap();
            if (curMap) {
              ctx.renderMap?.(curMap);
              ctx.syncMapOverworldItems?.(curMap);
            }
            ctx.saveCurrentGame?.();
            ctx.showToast?.('🌸 Defeated Gym Leader Erika & received the RAINBOWBADGE and TM19 GIGA DRAIN!');
          }
        );
      },
    });
  });
  return true;
}

/**
 * Handles Celadon Gym trainers (Jo & Zoe, Tanya, Julia, Michelle).
 */
export function handleCeladonGymTrainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId) || ctx.defeatedTrainers.has(trainerNpc.id)) {
    const rawDefeat = trainerNpc.defeatPages;
    const defeatPages =
      rawDefeat && rawDefeat.length > 0
        ? rawDefeat
        : trainerNpc.pages && trainerNpc.pages.length > 0
        ? trainerNpc.pages
        : ['Your floral tactics completely bloomed!'];
    ctx.openDialogue(defeatPages, trainerNpc.speaker);
    return true;
  }

  const challenge =
    trainerNpc.challengePages && trainerNpc.challengePages.length > 0
      ? trainerNpc.challengePages
      : ['Prepare to face our graceful Grass Pokémon!'];

  ctx.openDialogue(challenge, trainerNpc.speaker, () => {
    let team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(trainerNpc) : [];
    if (!team || team.length === 0) {
      const sourceTeam = trainerNpc.trainerTeam || trainerNpc.team;
      if (sourceTeam && sourceTeam.length > 0) {
        team = sourceTeam.map((m) =>
          PokemonFactory.create(m.speciesId, m.level, m.moves)
        );
      }
    }
    if (!team || team.length === 0) return;
    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: trainerNpc.trainerName || trainerNpc.speaker || 'TRAINER',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add(trainerId);
        ctx.defeatedTrainers.add(trainerNpc.id);
        const rawDefeat = trainerNpc.defeatPages;
        const postPages =
          rawDefeat && rawDefeat.length > 0
            ? rawDefeat
            : trainerNpc.pages && trainerNpc.pages.length > 0
            ? trainerNpc.pages
            : ['Incredible floral finesse!'];
        ctx.openDialogue(postPages, trainerNpc.speaker, () => {
          ctx.saveCurrentGame?.();
        });
      },
    });
  });
  return true;
}

/**
 * Handles Celadon Gym Guide and dynamic Gym Statues.
 */
export function handleCeladonGymGuideAndStatues(
  entity: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (entity.action === 'CELADON_GYM_GUIDE' || entity.id.includes('guide')) {
    if (ctx.storyFlags.has('erika_defeated')) {
      ctx.openDialogue(
        ['You withered ERIKA\'s defenses! That was a blooming marvelous battle!'],
        entity.speaker || '🏆 GYM GUIDE'
      );
      return true;
    }
    ctx.openDialogue(
      [
        'Yo, CHAMP in making!',
        'CELADON GYM is full of graceful Grass-type Pokémon users.',
        'Fire, Flying, and Ice attacks will wither their floral defenses!',
      ],
      entity.speaker || '🏆 GYM GUIDE'
    );
    return true;
  }

  // Gym Statue
  const hasBeaten = ctx.storyFlags.has('erika_defeated') || (ctx.inventory?.badges && ctx.inventory.badges.includes('rainbow'));
  const winner = hasBeaten ? `WINNING TRAINERS:\nRED\n${ctx.playerName}` : 'WINNING TRAINERS:\nRED';
  ctx.openDialogue(
    ['CELADON CITY POKéMON GYM', 'LEADER: ERIKA', winner],
    entity.speaker || '🏆 GYM STATUE'
  );
  return true;
}

/**
 * Handles Celadon Cut tree obstacle at (10, 31).
 */
export function handleCeladonCutTree(
  ctx: NpcInteractionContext,
  x: number = 10,
  y: number = 31
): boolean {
  const cutCheck = ModernHMHandler.checkCut(
    ctx.inventory,
    ctx.storyFlags,
    ctx.playerParty
  );

  if (cutCheck.canUse || (cutCheck.hasBadge && cutCheck.hasHM && cutCheck.compatiblePokemon)) {
    const cutter = cutCheck.compatiblePokemon || ctx.playerParty.find((p) => !p.isEgg) || ctx.playerParty[0];
    const cutterName = cutter ? cutter.nickname : ctx.playerName;
    BattleAudio.playOverworldSound('RUSTLE');
    ctx.openDialogue(
      ['This tree looks like it can be CUT down!', `${cutterName} hacked away with CUT!`],
      '🌳 CUTTABLE TREE',
      () => {
        ctx.storyFlags.add('celadon_cut_tree_cleared');
        if (ctx.npcsByMap && ctx.npcsByMap.celadon_city) {
          ctx.npcsByMap.celadon_city = ctx.npcsByMap.celadon_city.filter(
            (n) => n.id !== 'celadon_city_cut_tree' && !(n.x === x && n.y === y)
          );
        }
        const curMap = ctx.mapManager.getCurrentMap();
        if (curMap) {
          curMap.collisionGrid[y * curMap.width + x] = 0;
          ctx.renderMap?.(curMap);
          ctx.syncMapOverworldItems?.(curMap);
        }
        ctx.saveCurrentGame?.();
        ctx.showToast?.('🌳 The tree was cut down!');
      }
    );
    return true;
  }

  ctx.openDialogue(
    [
      'This tree looks like it can be CUT down!',
      cutCheck.missingReason || 'You need HM01 CUT and the HIVE BADGE to clear this tree.',
    ],
    '🌳 CUTTABLE TREE'
  );
  return true;
}

/**
 * Handles Celadon Cafe trash can inspection for Leftovers.
 */
export function handleCeladonCafeTrashCan(
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('got_celadon_restaurant_leftovers')) {
    ctx.openDialogue(
      ['Nope! Nothing here but trash.'],
      '🗑️ TRASH CAN'
    );
    return true;
  }

  ctx.storyFlags.add('got_celadon_restaurant_leftovers');
  if (ctx.addOverworldItemToInventory) {
    ctx.addOverworldItemToInventory('leftovers');
  } else if (ctx.inventory?.items) {
    ctx.inventory.items['leftovers'] = (ctx.inventory.items['leftovers'] || 0) + 1;
  }
  BattleAudio.playOverworldSound('KEY_ITEM');
  ctx.openDialogue(
    [
      `${ctx.playerName} found LEFTOVERS inside the trash can!`,
      'An item to be held by a Pokémon. The holder\'s HP gradually restores throughout the battle.',
    ],
    '🗑️ TRASH CAN',
    () => {
      ctx.saveCurrentGame?.();
      ctx.showToast?.('🥡 Found LEFTOVERS inside the trash can!');
    }
  );
  return true;
}

/**
 * Handles Celadon Mansion interactions (1F-3F and Penthouse TM03 Curse).
 */
export function handleCeladonMansionInteractions(
  entity: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (entity.action === 'CELADON_MANSION_STORYTELLER' || entity.id.includes('storyteller')) {
    if (ctx.storyFlags.has('got_celadon_tm03_curse')) {
      ctx.openDialogue(
        [
          "STORYTELLER: TM03 is CURSE.",
          "It's a terrifying move that slowly whittles down the victim's HP… Hehehe!",
        ],
        entity.speaker || '📖 STORYTELLER'
      );
      return true;
    }

    ctx.openDialogue(
      [
        "Let me recount a terrifying tale…",
        "Once upon a time, there was a little boy who was given a new BICYCLE…",
        "He wanted to try it right away… He was having so much fun that he didn't notice the sun had set…",
        "While riding home in the pitch-black night, the bike suddenly slowed! The pedals became heavy!",
        "When he stopped pedaling, the bike began slipping backwards! It was as if the bike were cursed and trying to drag him into oblivion!",
        "… … SHRIEEEEK! The boy had been riding uphill on CYCLING ROAD!",
        "… Ba-dum ba-dum! For listening so patiently, you may take this--TM03!",
      ],
      entity.speaker || '📖 STORYTELLER',
      () => {
        ctx.storyFlags.add('got_celadon_tm03_curse');
        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('tm03');
        }
        if (ctx.inventory?.tms && !ctx.inventory.tms.includes('TM03')) {
          ctx.inventory.tms.push('TM03');
        }
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            `${ctx.playerName} received TM03 CURSE from the STORYTELLER!`,
            "TM03 is CURSE. It works differently depending on whether the user is a Ghost-type or not!",
          ],
          entity.speaker || '📖 STORYTELLER',
          () => {
            ctx.saveCurrentGame?.();
            ctx.showToast?.('📜 Received TM03 CURSE from Storyteller!');
          }
        );
      }
    );
    return true;
  }

  // Default Mansion interaction
  ctx.openDialogue(
    entity.pages && entity.pages.length > 0
      ? entity.pages
      : ['Welcome to the CELADON MANSION!'],
    entity.speaker
  );
  return true;
}

/**
 * Handles Route 8 trainers (Dwayne, Harris, Zeke, Sam, Tom).
 */
export function handleRoute8Trainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId) || ctx.defeatedTrainers.has(trainerNpc.id)) {
    const rawDefeat = trainerNpc.defeatPages;
    const defeatPages =
      rawDefeat && rawDefeat.length > 0
        ? rawDefeat
        : trainerNpc.pages && trainerNpc.pages.length > 0
        ? trainerNpc.pages
        : ['You defeated us fair and square!'];
    ctx.openDialogue(defeatPages, trainerNpc.speaker);
    return true;
  }

  const challenge =
    trainerNpc.challengePages && trainerNpc.challengePages.length > 0
      ? trainerNpc.challengePages
      : ["Prepare to battle!"];

  ctx.openDialogue(challenge, trainerNpc.speaker, () => {
    let team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(trainerNpc) : [];
    if (!team || team.length === 0) {
      const sourceTeam = trainerNpc.trainerTeam || trainerNpc.team;
      if (sourceTeam && sourceTeam.length > 0) {
        team = sourceTeam.map((m) =>
          PokemonFactory.create(m.speciesId, m.level, m.moves)
        );
      }
    }
    if (!team || team.length === 0) return;
    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: trainerNpc.trainerName || trainerNpc.speaker || 'TRAINER',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add(trainerId);
        ctx.defeatedTrainers.add(trainerNpc.id);
        const rawDefeat = trainerNpc.defeatPages;
        const postPages =
          rawDefeat && rawDefeat.length > 0
            ? rawDefeat
            : trainerNpc.pages && trainerNpc.pages.length > 0
            ? trainerNpc.pages
            : ['You fought with admirable skill!'];
        ctx.openDialogue(postPages, trainerNpc.speaker, () => {
          ctx.saveCurrentGame?.();
        });
      },
    });
  });
  return true;
}

/**
 * Returns all interaction routes for Celadon City, Celadon Gym, Cafe, Mansion, and Route 8.
 */
export function getCeladonAndGymErikaInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['ERIKA_EVENT'],
      npcIds: ['celadon_gym_erika'],
      handler: (targetNpc, _map, ctx) => handleErikaInteraction(targetNpc, ctx),
    },
    {
      actions: ['CELADON_GYM_TRAINER'],
      npcIds: [
        'celadon_gym_michelle',
        'celadon_gym_tanya',
        'celadon_gym_julia',
        'celadon_gym_twins_jo_zoe_1',
        'celadon_gym_twins_jo_zoe_2',
      ],
      handler: (targetNpc, _map, ctx) => handleCeladonGymTrainer(targetNpc, ctx),
    },
    {
      actions: ['CELADON_GYM_GUIDE'],
      npcIds: ['celadon_gym_guide'],
      handler: (targetNpc, _map, ctx) => handleCeladonGymGuideAndStatues(targetNpc, ctx),
    },
    {
      actions: ['CELADON_GYM_STATUE'],
      npcIds: ['celadon_gym_statue_left', 'celadon_gym_statue_right'],
      handler: (targetNpc, _map, ctx) => handleCeladonGymGuideAndStatues(targetNpc, ctx),
    },
    {
      actions: ['CELADON_CUT_TREE'],
      npcIds: ['celadon_city_cut_tree'],
      handler: (_targetNpc, _map, ctx) => handleCeladonCutTree(ctx, 10, 31),
    },
    {
      actions: ['CELADON_CAFE_TRASH'],
      npcIds: ['celadon_cafe_trash_can'],
      handler: (_targetNpc, _map, ctx) => handleCeladonCafeTrashCan(ctx),
    },
    {
      actions: ['CELADON_MANSION_STORYTELLER'],
      npcIds: ['celadon_mansion_storyteller'],
      handler: (targetNpc, _map, ctx) => handleCeladonMansionInteractions(targetNpc, ctx),
    },
    {
      actions: ['ROUTE_8_TRAINER'],
      npcIds: [
        'route_8_dwayne',
        'route_8_harris',
        'route_8_zeke',
        'route_8_sam',
        'route_8_tom',
      ],
      handler: (targetNpc, _map, ctx) => handleRoute8Trainer(targetNpc, ctx),
    },
  ];
}
