/**
 * @fileoverview BlackthornGymAndDragonDenInteractions domain module implementation.
 * @module world/interactions/BlackthornGymAndDragonDenInteractions
 * @role Blackthorn Gym Leader Clair & Dragon's Den Master Trial Interactions
 * @exports getBlackthornGymAndDragonDenInteractions, handleClairInteraction, handleDragonMasterElder, handleBlackthornGymBoulderDrop, handleBlackthornGymGuide, handleBlackthornGymStatue, handleDragonsDenGuard
 * @layer world
 * @sections L1-30: Micro-Header & Imports | L31-110: Leader Clair Boss Battle | L111-200: Dragon Shrine Master Elder Quiz & Awards | L201-270: Boulders, Guard & Gym Guide | L271-330: Registration Factory
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
  NpcInteractionContext,
} from '../../types/gameContext';
import type { GridEntity } from '../GridPhysics';
import type { MapData } from '../../types/map';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { ModernHMHandler } from '../ModernHMHandler';

/**
 * 1. Blackthorn Gym 1F: Leader Clair Boss Battle & Stubborn Refusal
 */
export const handleClairInteraction: NpcInteractionHandler = (targetNpc: GridEntity, currentMap: MapData, ctx: NpcInteractionContext) => {
  // If player is in Dragon Shrine
  if (currentMap?.id === 'dragon_shrine' || targetNpc?.id === 'dragon_shrine_clair_3') {
    if (ctx.storyFlags.has('has_tm24_dragonbreath')) {
      ctx.openDialogue(
        [
          'CLAIR: You have proven yourself to both me and the DRAGON MASTER ELDER.',
          'Go forth to INDIGO PLATEAU and represent BLACKTHORN CITY with pride at the POKéMON LEAGUE!',
        ],
        targetNpc.speaker || '🏆 LEADER CLAIR'
      );
      return true;
    }
    if (ctx.storyFlags.has('has_rising_badge') || ctx.storyFlags.has('clair_conceded')) {
      if (!ctx.inventory.tms.includes('TM24')) {
        ctx.inventory.tms.push('TM24');
      }
      ctx.storyFlags.add('has_tm24_dragonbreath');
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.audioManager?.playSfx?.('sfx_badge_get');
      ctx.openDialogue(
        [
          'CLAIR: Here is TM24 as well. It contains DRAGONBREATH!',
          'It unleashes a ferocious breath of dragon fire that may paralyze the target!',
        ],
        targetNpc.speaker || '🏆 LEADER CLAIR',
        () => {
          ctx.showToast('📀 Obtained TM24 DragonBreath!');
          ctx.saveCurrentGame();
        }
      );
      return true;
    }
  }

  // Inside Blackthorn Gym 1F
  if (ctx.storyFlags.has('dragon_elder_quiz_passed') || ctx.storyFlags.has('has_rising_badge')) {
    ctx.openDialogue(
      [
        "CLAIR: You passed the DRAGON ELDER's trial and earned the RISINGBADGE!",
        'Good luck at the POKéMON LEAGUE! Show the ELITE FOUR the majesty of dragon power!',
      ],
      targetNpc.speaker || '🏆 LEADER CLAIR'
    );
    return true;
  }

  if (ctx.storyFlags.has('clair_defeated')) {
    ctx.openDialogue(
      [
        "CLAIR: I won't acknowledge this loss yet!",
        "Go behind the GYM into the DRAGON'S DEN and pass the DRAGON ELDER's trial if you want the RISINGBADGE!",
      ],
      targetNpc.speaker || '🏆 LEADER CLAIR'
    );
    return true;
  }

  const introPages =
    targetNpc.challengePages && targetNpc.challengePages.length > 0
      ? targetNpc.challengePages
      : [
          "CLAIR: I am CLAIR. The world's best dragon master!",
          'I can hold my own against even the POKéMON LEAGUE’s ELITE FOUR.',
          'Do you still want to battle me? Fine, let’s do it!',
          'As a GYM LEADER, I will use my full power to crush any challenger!',
        ];

  ctx.openDialogue(introPages, targetNpc.speaker || '🏆 LEADER CLAIR', () => {
    const rawTeam = targetNpc.trainerPokemon
      ? [targetNpc.trainerPokemon]
      : (targetNpc as any).team || [];

    const team = rawTeam.length > 0
      ? ctx.buildTrainerTeamInstances(targetNpc)
      : [
          PokemonFactory.create('dragonair', 37, ['thunderwave', 'surf', 'slam', 'dragonbreath']),
          PokemonFactory.create('dragonair', 37, ['thunderwave', 'thunderbolt', 'slam', 'dragonbreath']),
          PokemonFactory.create('dragonair', 37, ['thunderwave', 'icebeam', 'slam', 'dragonbreath']),
          PokemonFactory.create('kingdra', 40, ['smokescreen', 'surf', 'hyperbeam', 'dragonbreath']),
        ];

    ctx.triggerBattle(team[0], {
      isTrainer: true,
      isGymLeader: true,
      trainerName: targetNpc.trainerName || 'Leader Clair',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add('clair');
        ctx.storyFlags.add('clair_defeated');
        ctx.missionManager?.checkStoryFlags(ctx.storyFlags);

        ctx.openDialogue(
          [
            "CLAIR: I... I lost?! But... I won't acknowledge it!",
            "I refuse to hand over the BADGE until you take the DRAGON USER's test!",
            "Enter the DRAGON'S DEN behind the GYM and pass the DRAGON ELDER's trial!",
          ],
          targetNpc.speaker || '🏆 LEADER CLAIR',
          () => {
            ctx.saveCurrentGame();
            ctx.showToast("🐉 Defeated Leader Clair! Enter Dragon's Den for the Elder's trial!");
          }
        );
      },
    });
  });
  return true;
};

/**
 * 2. Dragon Shrine: Master Elder 5-Question Quiz & Clair Concession
 */
export const handleDragonMasterElder: NpcInteractionHandler = (targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext) => {
  if (!ctx.storyFlags.has('clair_defeated')) {
    ctx.openDialogue(
      [
        'ELDER: Welcome to the sacred DRAGON SHRINE.',
        'Only those who have tested their spirit against CLAIR in battle may take our trial.',
      ],
      targetNpc.speaker || '🐉 DRAGON MASTER ELDER'
    );
    return true;
  }

  // If already completed and received Dratini
  if (ctx.storyFlags.has('gift_dratini_extremespeed')) {
    ctx.openDialogue(
      [
        'ELDER: Treat that DRATINI with devotion and love.',
        'It will grow into a noble dragon and soar across the heavens with you!',
      ],
      targetNpc.speaker || '🐉 DRAGON MASTER ELDER'
    );
    return true;
  }

  // If already passed trial, but needs to claim Dratini
  if (ctx.storyFlags.has('dragon_elder_quiz_passed')) {
    if (ctx.playerParty.length >= 6) {
      ctx.openDialogue(
        [
          'ELDER: You have no room in your party to carry another POKéMON!',
          'Make room in your party, then return to receive your sacred DRATINI!',
        ],
        targetNpc.speaker || '🐉 DRAGON MASTER ELDER'
      );
      return true;
    }

    const dratini = PokemonFactory.create('dratini', 15, ['extremespeed', 'wrap', 'leer', 'thunderwave']);
    ctx.playerParty.push(dratini);
    ctx.storyFlags.add('gift_dratini_extremespeed');
    ctx.storyFlags.add('EVENT_GOT_DRATINI');
    BattleAudio.playOverworldSound('KEY_ITEM');
    ctx.audioManager?.playSfx?.('sfx_badge_get');

    ctx.openDialogue(
      [
        "ELDER: As promised, take this DRATINI into your care.",
        `${ctx.playerName} received DRATINI from the DRAGON MASTER ELDER!`,
        'ELDER: That DRATINI was raised knowing EXTREMESPEED, an ancient technique of our clan!',
      ],
      targetNpc.speaker || '🐉 DRAGON MASTER ELDER',
      () => {
        ctx.saveCurrentGame();
        ctx.showToast('🐉 Received Dratini with ExtremeSpeed!');
      }
    );
    return true;
  }

  // Administer the 5 canonical questions
  ctx.openDialogue(
    [
      'ELDER: Welcome, challenger. I will now examine your heart through five sacred questions.',
      'Question 1: What are POKéMON to you? Are they partners and friends, or tools to be used?',
      'Question 2: What brings victory in battle? Strategy and training, or deceitful trickery?',
      'Question 3: What kind of trainer do you wish to battle? Anyone to learn together, or only weak foes?',
      'Question 4: What is the most important virtue in raising POKéMON? Love and knowledge, or harshness?',
      'Question 5: Strong POKéMON. Weak POKéMON. Which is more important? Both are precious, or only the strong?',
      'ELDER: Splendid! Your answers resonate with wisdom, love, and compassion for POKéMON!',
      'CLAIR: Wait! ELDER! How could you let an outsider pass so easily?!',
      'ELDER: Silence, CLAIR! This trainer understands the true essence of a dragon master. Give them the BADGE!',
      'CLAIR: ...I understand, ELDER. Trainer, take the RISINGBADGE.',
    ],
    targetNpc.speaker || '🐉 DRAGON MASTER ELDER',
    () => {
      ctx.storyFlags.add('dragon_elder_quiz_passed');
      ctx.storyFlags.add('clair_conceded');
      ctx.storyFlags.add('has_rising_badge');
      ctx.storyFlags.add('CAN_USE_WATERFALL');

      if (!ctx.inventory.badges.includes('rising')) {
        ctx.inventory.badges.push('rising');
      }
      if (!ctx.inventory.tms.includes('TM24')) {
        ctx.inventory.tms.push('TM24');
      }
      ctx.storyFlags.add('has_tm24_dragonbreath');

      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.audioManager?.playSfx?.('sfx_badge_get');

      // Attempt Dratini gift if party has space
      if (ctx.playerParty.length < 6) {
        const dratini = PokemonFactory.create('dratini', 15, ['extremespeed', 'wrap', 'leer', 'thunderwave']);
        ctx.playerParty.push(dratini);
        ctx.storyFlags.add('gift_dratini_extremespeed');
        ctx.storyFlags.add('EVENT_GOT_DRATINI');
      }

      ctx.missionManager?.checkStoryFlags(ctx.storyFlags);
      ctx.saveCurrentGame();
      ctx.showToast('🏆 Obtained the Rising Badge & TM24 DragonBreath!');
    }
  );
  return true;
};

/**
 * 3. Blackthorn Gym 2F: Strength Boulder Drop Puzzle
 */
export const handleBlackthornGymBoulderDrop: NpcInteractionHandler = (targetNpc: GridEntity, currentMap: MapData, ctx: NpcInteractionContext) => {
  const strCheck = ModernHMHandler.canUseStrength(ctx.playerParty, ctx.inventory, ctx.storyFlags);
  const boulderId = targetNpc?.id || 'blackthorn_gym_2f_boulder_1';
  const numMatch = boulderId.match(/\d+$/);
  const boulderNum = numMatch ? numMatch[0] : '1';
  const eventFlag = `EVENT_BOULDER_IN_BLACKTHORN_GYM_${boulderNum}`;

  if (!strCheck.canUse) {
    ctx.openDialogue(
      [
        'A massive boulder rests beside the lava trench hole!',
        strCheck.missingReason ||
          'A POKéMON with STRENGTH and the PLAIN BADGE could shove it into the hole below.',
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
      'The massive rock plunged into the lava pit on 1F, filling the gap to form a bridge!',
    ],
    '🪨 BOULDER',
    () => {
      ctx.storyFlags.add(eventFlag);
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast(`🪨 Dropped boulder #${boulderNum} into 1F lava trench!`);
      if (currentMap) ctx.renderMap?.(currentMap);
      ctx.saveCurrentGame();
    }
  );
  return true;
};

/**
 * 4. Blackthorn City: Dragon's Den Guard
 */
export const handleDragonsDenGuard: NpcInteractionHandler = (targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext) => {
  if (ctx.storyFlags.has('clair_defeated')) {
    ctx.openDialogue(
      [
        'GRAMPS: CLAIR has instructed me to let you pass.',
        'Enter the DRAGON’S DEN behind the GYM and speak with the DRAGON MASTER ELDER.',
      ],
      targetNpc?.speaker || '👴 GRAMPS'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'GRAMPS: No! None may enter the DRAGON’S DEN unless granted permission by CLAIR, our GYM LEADER.',
      'Defeat CLAIR at the BLACKTHORN GYM first if you wish to enter!',
    ],
    targetNpc?.speaker || '👴 GRAMPS'
  );
  return true;
};

/**
 * 5. Blackthorn Gym: Gym Guide Tactical Advice
 */
export const handleBlackthornGymGuide: NpcInteractionHandler = (targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext) => {
  if (ctx.storyFlags.has('has_rising_badge')) {
    ctx.openDialogue(
      [
        'Yo! Champ in making! You conquered all eight JOHTO GYMS!',
        'Head east past Route 45 and Route 27 to INDIGO PLATEAU! The POKéMON LEAGUE awaits you!',
      ],
      targetNpc?.speaker || '🏆 GYM GUIDE'
    );
    return true;
  }

  if (ctx.storyFlags.has('clair_defeated')) {
    ctx.openDialogue(
      [
        'Yo! You beat CLAIR?! Unbelievable!',
        "She sent you to the DRAGON'S DEN behind the GYM?! Show the ELDER that you are truly worthy!",
      ],
      targetNpc?.speaker || '🏆 GYM GUIDE'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'Yo! Champ in making! CLAIR is a mythical dragon master!',
      'Dragon-type POKéMON have tremendous resistance! Ice-type moves and Dragon-type moves are your best strategy!',
    ],
    targetNpc?.speaker || '🏆 GYM GUIDE'
  );
  return true;
};

/**
 * 6. Blackthorn Gym: Statues Recognition
 */
export const handleBlackthornGymStatue: NpcInteractionHandler = (targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext) => {
  if (ctx.storyFlags.has('has_rising_badge')) {
    ctx.openDialogue(
      [
        `BLACKTHORN CITY POKéMON GYM\nLEADER: CLAIR\nWINNING TRAINERS:\n${ctx.playerName}`,
      ],
      targetNpc?.speaker || '🏆 GYM STATUE'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'BLACKTHORN CITY POKéMON GYM\nLEADER: CLAIR\nWINNING TRAINERS:\n...No challengers recorded',
    ],
    targetNpc?.speaker || '🏆 GYM STATUE'
  );
  return true;
};

/**
 * Registers all Blackthorn Gym and Dragon's Den interactions for O(1) routing.
 */
export function getBlackthornGymAndDragonDenInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['CLAIR_EVENT'],
      npcIds: ['blackthorn_gym_1f_clair_0', 'dragons_den_b1f_clair_0', 'dragon_shrine_clair_3'],
      handler: handleClairInteraction,
    },
    {
      actions: ['DRAGON_ELDER_EVENT'],
      npcIds: ['dragon_elder', 'dragon_shrine_elder_0', 'dragon_shrine_elder_1', 'dragon_shrine_elder_2'],
      handler: handleDragonMasterElder,
    },
    {
      actions: ['BLACKTHORN_BOULDER'],
      npcIds: [
        'blackthorn_gym_2f_boulder_1',
        'blackthorn_gym_2f_boulder_2',
        'blackthorn_gym_2f_boulder_3',
      ],
      handler: handleBlackthornGymBoulderDrop,
    },
    {
      actions: ['DRAGONS_DEN_GUARD'],
      npcIds: ['blackthorn_city_gramps_2'],
      handler: handleDragonsDenGuard,
    },
    {
      actions: ['BLACKTHORN_GYM_GUIDE'],
      npcIds: ['blackthorn_gym_1f_gym_guide_4'],
      handler: handleBlackthornGymGuide,
    },
    {
      actions: ['BLACKTHORN_GYM_STATUE'],
      npcIds: ['blackthorn_gym_1f_statue_left', 'blackthorn_gym_1f_statue_right'],
      handler: handleBlackthornGymStatue,
    },
  ];
}
