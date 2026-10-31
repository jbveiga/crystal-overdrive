/**
 * @fileoverview EastJohtoQuestInteractions domain module implementation.
 * @module world/interactions/EastJohtoQuestInteractions
 * @role EastJohtoQuestInteractions Component
 * @exports getEastJohtoQuestInteractions, createEastJohtoQuestInteractions, handleKarateKingKiyo, handleRoute42GateOfficer, handleRoute42SuicuneInteraction, handleMortarSuperNerds
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-125: Handlers | L126-165: Factory & Exports
 */

import type { NpcInteractionRegistration, NpcInteractionContext } from '../../types/gameContext';
import type { GridEntity } from '../GridPhysics';
import type { MapData } from '../../types/map';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

export function handleKarateKingKiyo(targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext): boolean {
  if (ctx.storyFlags.has('received_kiyo_tyrogue')) {
    ctx.openDialogue(
      ['KIYO: Keep training your TYROGUE with dedication! True strength comes from within!'],
      targetNpc.speaker
    );
    return true;
  }

  if (ctx.storyFlags.has('EVENT_BEAT_BLACKBELT_KIYO')) {
    if (ctx.playerParty.length >= 6) {
      ctx.openDialogue(
        [
          'KIYO: You have no room in your party to carry another POKéMON!',
          'Go make room in your party, then return to claim your partner!',
        ],
        targetNpc.speaker
      );
      return true;
    }

    const tyrogue = PokemonFactory.create('tyrogue', 10, ['tackle', 'foresight', 'dizzypunch']);
    ctx.playerParty.push(tyrogue);
    ctx.seenSpecies?.add('tyrogue');
    ctx.caughtSpecies?.add('tyrogue');
    ctx.storyFlags.add('received_kiyo_tyrogue');
    ctx.storyFlags.add('EVENT_GOT_TYROGUE_FROM_KIYO');
    ctx.audioManager.playSfx?.('sfx_badge_get');
    BattleAudio.playOverworldSound('KEY_ITEM');

    ctx.openDialogue(
      [
        'KIYO: You have proven your fighting spirit! As promised, take this TYROGUE!',
        `${ctx.playerName} received TYROGUE from the KARATE KING!`,
        'KIYO: That TYROGUE is full of fighting spirit! It can evolve into different POKéMON depending on how it is trained!',
      ],
      targetNpc.speaker,
      () => {
        ctx.saveCurrentGame();
        ctx.showToast('🥋 Received TYROGUE from Karate King Kiyo!');
      }
    );
    return true;
  }

  const introPages =
    targetNpc.challengePages && targetNpc.challengePages.length > 0
      ? targetNpc.challengePages
      : [
          'KIYO: Hey! I am the KARATE KING!',
          'I train alone here in the dark! You want to challenge me? Prepare yourself!',
        ];

  ctx.openDialogue(introPages, targetNpc.speaker, () => {
    const team = ctx.buildTrainerTeamInstances
      ? ctx.buildTrainerTeamInstances(targetNpc)
      : [
          PokemonFactory.create('hitmonlee', 34, ['doublekick', 'meditate', 'jumpkick', 'focusenergy']),
          PokemonFactory.create('hitmonchan', 34, ['cometpunch', 'agility', 'firepunch', 'icepunch']),
        ];
    if (team.length === 0) return;

    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: targetNpc.trainerName || 'Karate King Kiyo',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add('mount_mortar_b1f_kiyo');
        ctx.defeatedTrainers.add('blackbelt_kiyo');
        ctx.storyFlags.add('EVENT_BEAT_BLACKBELT_KIYO');

        if (ctx.playerParty.length >= 6) {
          ctx.openDialogue(
            [
              'KIYO: I... I lost! You have exceptional strength!',
              'I wanted to give you a rare fighting POKéMON, but you have no room in your party!',
              'Go make room in your party, then come back to see me!',
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🥋 Defeated Karate King Kiyo! Make room in party for reward.');
            }
          );
          return;
        }

        const tyrogue = PokemonFactory.create('tyrogue', 10, ['tackle', 'foresight', 'dizzypunch']);
        ctx.playerParty.push(tyrogue);
        ctx.seenSpecies?.add('tyrogue');
        ctx.caughtSpecies?.add('tyrogue');
        ctx.storyFlags.add('received_kiyo_tyrogue');
        ctx.storyFlags.add('EVENT_GOT_TYROGUE_FROM_KIYO');
        ctx.audioManager.playSfx?.('sfx_badge_get');
        BattleAudio.playOverworldSound('KEY_ITEM');

        ctx.openDialogue(
          [
            'KIYO: I... I lost! You have exceptional strength!',
            'As a reward for your fighting spirit, take this TYROGUE!',
            `${ctx.playerName} received TYROGUE from the KARATE KING!`,
            'KIYO: That TYROGUE is full of fighting spirit! It can evolve into different POKéMON depending on how it is trained!',
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('🥋 Received TYROGUE from Karate King Kiyo!');
          }
        );
      },
    });
  });

  return true;
}

export function handleRoute42GateOfficer(targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext): boolean {
  ctx.openDialogue(
    [
      'OFFICER: MT. MORTAR is like a maze inside.',
      'Be careful if you get lost, you might wander forever without FLASH or ESCAPE ROPES!',
    ],
    targetNpc.speaker
  );
  return true;
}

export function handleRoute42SuicuneInteraction(targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext): boolean {
  BattleAudio.playCry('suicune');
  ctx.openDialogue(
    ['SUICUNE: Gurr-oooh! (It gazes intently before preparing to leap across the waters!)'],
    targetNpc.speaker
  );
  return true;
}

export function handleMortarSuperNerds(targetNpc: GridEntity, _map: MapData, ctx: NpcInteractionContext): boolean {
  const trainerId = targetNpc.trainerId || targetNpc.id;
  if (ctx?.defeatedTrainers && !ctx.defeatedTrainers.has(trainerId)) {
    return false;
  }

  if (targetNpc.id === 'mount_mortar_1f_inside_markus') {
    ctx.openDialogue(
      ['MARKUS: HUGH and I were researching the ancient geology of Mt. Mortar, but we took a wrong turn.'],
      targetNpc.speaker
    );
    return true;
  }
  if (targetNpc.id === 'mount_mortar_2f_inside_hugh') {
    ctx.openDialogue(
      ['HUGH: This cavern has so many waterfalls and ledges. I hope MARKUS is okay down there.'],
      targetNpc.speaker
    );
    return true;
  }
  if (targetNpc.id === 'mount_mortar_1f_inside_miller') {
    ctx.openDialogue(
      ['MILLER: Mt. Mortar is packed with rare Pokémon and hidden treasures for those who know SURF and WATERFALL!'],
      targetNpc.speaker
    );
    return true;
  }
  return false;
}

export function createEastJohtoQuestInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['KIYO_EVENT'],
      npcIds: ['mount_mortar_b1f_kiyo'],
      handler: handleKarateKingKiyo,
    },
    {
      actions: ['ROUTE_42_SUICUNE_EVENT'],
      npcIds: ['route_42_suicune'],
      handler: handleRoute42SuicuneInteraction,
    },
    {
      actions: ['ROUTE_42_GATE_OFFICER'],
      npcIds: ['route_42_gate_officer'],
      handler: handleRoute42GateOfficer,
    },
    {
      npcIds: [
        'mount_mortar_1f_inside_miller',
        'mount_mortar_1f_inside_markus',
        'mount_mortar_2f_inside_hugh',
      ],
      handler: handleMortarSuperNerds,
    },
  ];
}

export const getEastJohtoQuestInteractions = createEastJohtoQuestInteractions;
