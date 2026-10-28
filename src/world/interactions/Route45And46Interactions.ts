/**
 * @fileoverview Route45And46Interactions domain module implementation.
 * @module world/interactions/Route45And46Interactions
 * @role Route 45, Route 46 & Route 29/46 Gatehouse Interactions Component
 * @exports getRoute45And46Interactions, route45And46Interactions, handleRoute46GateOfficer, handleRoute46GateYoungster, handleRoute45And46Trainer
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-60: Gatehouse Handlers | L61-105: Mountain Trainers Handler | L106-135: Registration Factory
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';

/**
 * 1. Route 29 / Route 46 Gatehouse Officer
 */
export const handleRoute46GateOfficer: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'ROUTE 45 and 46 can only be traversed one-way downhill from BLACKTHORN CITY.',
      'Ledges prevent climbing back up! If you need to return north, take the western routes through MAHOGANY TOWN.',
    ],
    targetNpc.speaker || '👮 OFFICER'
  );
  return true;
};

/**
 * 2. Route 29 / Route 46 Gatehouse Youngster
 */
export const handleRoute46GateYoungster: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'If you jump down ledges, you cannot get back up without circling around.',
      'Be sure you picked up all the items on the mountain before leaping!',
    ],
    targetNpc.speaker || '👦 BOY'
  );
  return true;
};

/**
 * 3. Route 45 & Route 46 Mountain Trail Trainers
 */
export const handleRoute45And46Trainer: NpcInteractionHandler = (targetNpc, _map, ctx) => {
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
 * Registration factory for Route 45 & Route 46 interactions
 */
export function getRoute45And46Interactions(): NpcInteractionRegistration[] {
  return [
    {
      npcIds: ['route_29_route_46_gate_officer'],
      actions: ['ROUTE_46_GATE_OFFICER'],
      handler: handleRoute46GateOfficer,
    },
    {
      npcIds: ['route_29_route_46_gate_youngster'],
      actions: ['ROUTE_46_GATE_YOUNGSTER'],
      handler: handleRoute46GateYoungster,
    },
    {
      npcIds: [
        'route_45_hiker_erik',
        'route_45_hiker_michael',
        'route_45_hiker_parry',
        'route_45_hiker_timothy',
        'route_45_blackbelt_kenji',
        'route_45_cooltrainer_m_ryan',
        'route_45_cooltrainer_f_kelly',
        'route_45_camper_quentin',
        'route_46_hiker_bailey',
        'route_46_camper_ted',
        'route_46_picnicker_erin',
      ],
      handler: handleRoute45And46Trainer,
    },
  ];
}

export const route45And46Interactions = getRoute45And46Interactions();
