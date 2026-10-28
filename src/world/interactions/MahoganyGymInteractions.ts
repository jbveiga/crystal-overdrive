/**
 * @fileoverview MahoganyGymInteractions domain module implementation.
 * @module world/interactions/MahoganyGymInteractions
 * @role Mahogany Gym & Leader Pryce Interactions Component
 * @exports getMahoganyGymInteractions, handlePryceBossBattle, handleMahoganyGymGuide, handleMahoganyGymStatue
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-110: Leader Pryce Boss Battle | L111-155: Gym Guide & Statues | L156-190: Registration Factory
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

/**
 * 1. Leader Pryce: Winter Discipline Monologue, 3-Mon Boss Battle & Glacier Badge
 */
export const handlePryceBossBattle: NpcInteractionHandler = (targetNpc, currentMap, ctx) => {
  if (ctx.storyFlags.has('pryce_defeated')) {
    ctx.openDialogue(
      [
        "PRYCE: POKéMON and humans both grow stronger as they endure life's bitter cold.",
        'Continue striving with an unyielding spirit! Cherish your POKéMON, and they will never fail you.',
      ],
      targetNpc?.speaker || '🏆 LEADER PRYCE'
    );
    return true;
  }

  const preBattlePages = [
    'PRYCE: POKéMON have many experiences in their lives, just like we do.',
    'I, too, have seen and suffered much in my life. Since I am your elder, let me show you what I mean.',
    'I have been with POKéMON since before you were born. I do not lose easily.',
    'I, PRYCE—the winter trainer—shall demonstrate my power!',
  ];

  ctx.openDialogue(
    preBattlePages,
    targetNpc?.speaker || '🏆 LEADER PRYCE',
    () => {
      let team = targetNpc ? ctx.buildTrainerTeamInstances(targetNpc) : [];
      if (team.length === 0) {
        team = [
          PokemonFactory.create('seel', 27, ['headbutt', 'icywind', 'aurorabeam', 'rest']),
          PokemonFactory.create('dewgong', 29, ['headbutt', 'icywind', 'aurorabeam', 'rest']),
          PokemonFactory.create('piloswine', 31, ['icywind', 'furyattack', 'mist', 'blizzard']),
        ];
      }

      ctx.triggerBattle(team[0], {
        isTrainer: true,
        isGymLeader: true,
        trainerName: targetNpc?.trainerName || 'Leader Pryce',
        trainerTeam: team,
        onVictory: () => {
          ctx.defeatedTrainers.add('pryce');
          if (targetNpc?.trainerId) {
            ctx.defeatedTrainers.add(targetNpc.trainerId);
          }
          ctx.storyFlags.add('pryce_defeated');
          ctx.storyFlags.add('has_glacier_badge');
          ctx.storyFlags.add('has_tm16_icy_wind');

          if (!ctx.inventory.badges.includes('glacier')) {
            ctx.inventory.badges.push('glacier');
          }
          if (!ctx.inventory.tms.includes('TM16')) {
            ctx.inventory.tms.push('TM16');
          }

          ctx.audioManager?.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.missionManager?.checkStoryFlags?.(ctx.storyFlags);
          ctx.missionManager?.completeMission?.('M08');

          ctx.openDialogue(
            [
              'PRYCE: Ah, I am impressed by your prowess. With your strong will, I know you will overcome all obstacles.',
              'You are worthy of this badge! Take the GLACIERBADGE!',
              'Received GLACIERBADGE from PRYCE!',
              'PRYCE: That GLACIERBADGE enables your POKéMON to use WHIRLPOOL anytime out of battle.',
              'Also, take this TM as a reward for your icy resolve.',
              'Obtained TM16 ICY WIND!',
              "PRYCE: That TM contains ICY WIND. It inflicts damage and reduces the foe's speed. It demonstrates the harshness of winter!",
            ],
            targetNpc?.speaker || '🏆 LEADER PRYCE',
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🏆 Earned the Glacier Badge & TM16 Icy Wind!');
              if (currentMap) ctx.renderMap?.(currentMap);
            }
          );
        },
      });
    }
  );
  return true;
};

/**
 * 2. Gym Guide: Tactical Advice & Post-Victory Congratulations
 */
export const handleMahoganyGymGuide: NpcInteractionHandler = (targetNpc, _currentMap, ctx) => {
  if (ctx.storyFlags.has('pryce_defeated')) {
    ctx.openDialogue(
      [
        "GYM GUIDE: Woohoo! That was an electrifying showdown! You melted PRYCE's cold exterior with pure passion!",
        'Bridging the generation gap like that takes true grit, champ-in-the-making!',
      ],
      targetNpc?.speaker || '🏆 GYM GUIDE'
    );
    return true;
  }

  ctx.openDialogue(
    [
      "GYM GUIDE: Yo! Champ in the making! MAHOGANY's GYM LEADER is PRYCE, a venerable veteran who has trained for over 50 years!",
      "They say he freezes opponents with ICE-type POKéMON. Don't let his frosty demeanor freeze your spirit!",
      'Melt him down with scorching FIRE, rock-crushing FIGHTING, or electric moves!',
      "And watch your step on the ice floor—once you start sliding, you won't stop until you hit an obstacle or a non-ice platform!",
    ],
    targetNpc?.speaker || '🏆 GYM GUIDE'
  );
  return true;
};

/**
 * 3. Gym Statues: Inspection & Dynamic Winning Trainers
 */
export const handleMahoganyGymStatue: NpcInteractionHandler = (targetNpc, _currentMap, ctx) => {
  const isPryceBeaten = ctx.storyFlags.has('pryce_defeated');
  const winningTrainers = isPryceBeaten
    ? `WINNING TRAINERS: SILVER, ${ctx.playerName.toUpperCase()}`
    : 'WINNING TRAINERS: SILVER';

  ctx.openDialogue(
    [
      `MAHOGANY TOWN POKéMON GYM\nLEADER: PRYCE\n${winningTrainers}`,
    ],
    targetNpc?.speaker || '🏛️ MAHOGANY GYM STATUE'
  );
  return true;
};

/**
 * Registers all Mahogany Gym interactions for constant-time O(1) routing.
 */
export function getMahoganyGymInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['PRYCE_EVENT'],
      npcIds: ['mahogany_gym_pryce_0', 'pryce', 'leader_pryce'],
      handler: handlePryceBossBattle,
    },
    {
      actions: ['MAHOGANY_GYM_GUIDE'],
      npcIds: ['mahogany_gym_gym_guide_6', 'mahogany_gym_guide', 'gym_guide'],
      handler: handleMahoganyGymGuide,
    },
    {
      actions: ['MAHOGANY_GYM_STATUE'],
      npcIds: ['mahogany_gym_statue_left', 'mahogany_gym_statue_right'],
      handler: handleMahoganyGymStatue,
    },
  ];
}
