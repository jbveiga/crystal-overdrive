/**
 * @fileoverview Route27AndTohjoFallsInteractions domain module implementation.
 * @module world/interactions/Route27AndTohjoFallsInteractions
 * @role Route 27, Tohjo Falls & Route 26 Kanto Border Interactions Component
 * @exports getRoute27AndTohjoFallsInteractions, route27AndTohjoFallsInteractions, handleFirstStepKantoFisher, handleRoute27Sandstorm, handleRoute26Heal, handleRoute27And26Trainer
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-65: Fisher & Sandstorm Handlers | L66-105: Heal House Handler | L106-145: Route 26/27 Trainers Handler | L146-190: Registration Factory
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * 1. Route 27 First Step into Kanto Fisher
 */
export const handleFirstStepKantoFisher: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'Hey! Do you know what you just did?',
      "You've taken your first step into KANTO! Check your POKéGEAR MAP and see!",
    ],
    targetNpc.speaker || '🎣 FISHER',
    () => {
      if (!ctx.storyFlags.has('first_step_into_kanto')) {
        ctx.storyFlags.add('first_step_into_kanto');
        ctx.storyFlags.add('EVENT_FIRST_STEP_INTO_KANTO');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.showToast?.('🗺️ Arrived in the Kanto Region!');
      }
    }
  );
  return true;
};

/**
 * 2. Route 27 Sandstorm House Woman (TM37 Sandstorm Gift)
 */
export const handleRoute27Sandstorm: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!ctx.storyFlags.has('EVENT_GOT_TM37_SANDSTORM')) {
    ctx.openDialogue(
      [
        'Where are you going in such a rush?',
        'Your POKéMON look very attached to you! Take this TM37 SANDSTORM!',
      ],
      targetNpc.speaker || '👩 WOMAN',
      () => {
        if (!ctx.inventory.tms) ctx.inventory.tms = [];
        ctx.inventory.tms.push('TM37_SANDSTORM');
        ctx.storyFlags.add('EVENT_GOT_TM37_SANDSTORM');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.showToast?.('Received TM37 Sandstorm!');
      }
    );
  } else {
    ctx.openDialogue(
      ['Sandstorm damages all POKéMON other than Rock, Ground, and Steel types.'],
      targetNpc.speaker || '👩 WOMAN'
    );
  }
  return true;
};

/**
 * 3. Route 26 Rest & Heal House Kind Woman
 */
export const handleRoute26Heal: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    ['Hello, young traveler! Rest here before challenging the POKéMON LEAGUE.'],
    targetNpc.speaker || '👩 KIND WOMAN',
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
      BattleAudio.playMenuSound('HEAL');
      const onRefreshed = () => {
        ctx.openDialogue(
          ['Your POKéMON are fully refreshed! Keep giving it your all!'],
          targetNpc.speaker || '👩 KIND WOMAN'
        );
      };
      if (ctx.playFieldRestAnimation) {
        ctx.playFieldRestAnimation(onRefreshed);
      } else if (ctx.playHealingAnimation) {
        ctx.playHealingAnimation(ctx.playerParty?.length || 1, onRefreshed);
      } else {
        onRefreshed();
      }
    }
  );
  return true;
};

/**
 * 4. Route 27 & Route 26 Trainers
 */
export const handleRoute27And26Trainer: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!targetNpc.trainerId) return false;

  if (ctx.defeatedTrainers.has(targetNpc.trainerId)) {
    const pages =
      targetNpc.pages && targetNpc.pages.length > 0
        ? targetNpc.pages
        : [`${targetNpc.trainerName || 'TRAINER'}: You fought well!`];
    ctx.openDialogue(pages, targetNpc.speaker || targetNpc.trainerName);
    return true;
  }

  const pagesToUse =
    targetNpc.challengePages && targetNpc.challengePages.length > 0
      ? targetNpc.challengePages
      : targetNpc.pages || [`${targetNpc.trainerName || 'TRAINER'}: Let's battle!`];

  ctx.openDialogue(pagesToUse, targetNpc.speaker || targetNpc.trainerName, () => {
    const team = ctx.buildTrainerTeamInstances(targetNpc);
    if (team.length === 0) return;
    ctx.defeatedTrainers.add(targetNpc.trainerId!);
    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: targetNpc.trainerName || targetNpc.speaker || 'Trainer',
      trainerTeam: team,
      onVictory: () => {
        ctx.handleTrainerDefeatRewards(targetNpc);
      },
    });
  });
  return true;
};

/**
 * Registration factory for Route 27, Tohjo Falls & Route 26 interactions
 */
export function getRoute27AndTohjoFallsInteractions(): NpcInteractionRegistration[] {
  return [
    {
      npcIds: ['route_27_fisher'],
      actions: ['FIRST_STEP_KANTO_FISHER'],
      handler: handleFirstStepKantoFisher,
    },
    {
      npcIds: ['route_27_sandstorm_woman'],
      actions: ['ROUTE27_SANDSTORM_EVENT'],
      handler: handleRoute27Sandstorm,
    },
    {
      npcIds: ['route_26_heal_woman'],
      actions: ['ROUTE26_HEAL_EVENT'],
      handler: handleRoute26Heal,
    },
    {
      npcIds: [
        'cooltrainer_m_blake',
        'cooltrainer_m_brian',
        'cooltrainer_f_reena',
        'cooltrainer_f_megan',
        'psychic_gilbert',
        'bird_keeper_jose',
        'cooltrainer_m_jake',
        'cooltrainer_m_gaven',
        'cooltrainer_f_joyce',
        'cooltrainer_f_beth',
        'psychic_richard',
        'fisher_scott',
      ],
      handler: handleRoute27And26Trainer,
    },
  ];
}

export const route27AndTohjoFallsInteractions = getRoute27AndTohjoFallsInteractions();
