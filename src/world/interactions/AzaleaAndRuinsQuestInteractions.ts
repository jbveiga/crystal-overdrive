/**
 * @fileoverview AzaleaAndRuinsQuestInteractions domain module implementation.
 * Handles Ruins of Alph Unown Dex Researcher, Azalea Town Slowpoke Well Proton victory,
 * King's Rock explorer, and Ilex Forest interactions.
 * @module world/interactions/AzaleaAndRuinsQuestInteractions
 * @role AzaleaAndRuinsQuestInteractions Component
 * @exports completeSlowpokeWellProtonVictory, getAzaleaAndRuinsQuestInteractions
 * @layer world
 * @sections L1-50: Micro-Header & Slowpoke Well Completion | L51-198: Ruins of Alph, Slowpoke Well & Ilex Forest
 */

import type { NpcInteractionContext, NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { getIlexForestInteractions } from './IlexForestInteractions';

export function completeSlowpokeWellProtonVictory(ctx: NpcInteractionContext): void {
  ctx.defeatedTrainers.add('executive_proton');
  ctx.storyFlags.add('slowpoke_well_proton_defeated');
  ctx.storyFlags.add('slowpoke_well_cleared');
  if (ctx.npcsByMap.slowpoke_well_b1f) {
    ctx.npcsByMap.slowpoke_well_b1f = ctx.npcsByMap.slowpoke_well_b1f.filter(
      (n) => n.id !== 'executive_proton' && n.id !== 'well_kurt'
    );
  }
  if (ctx.npcsByMap.azalea_town) {
    ctx.npcsByMap.azalea_town = ctx.npcsByMap.azalea_town.filter(
      (n) => n.id !== 'azalea_well_grunt' && n.id !== 'azalea_gym_grunt'
    );
  }
  if (!ctx.inventory.items) ctx.inventory.items = {};
  ctx.inventory.items['lure-ball'] = (ctx.inventory.items['lure-ball'] || 0) + 1;
  ctx.inventory.items['lure_ball'] = (ctx.inventory.items['lure_ball'] || 0) + 1;
  BattleAudio.playOverworldSound('FANFARE');
  ctx.openDialogue(
    [
      'KURT: Way to go, young trainer! TEAM ROCKET took off and the SLOWPOKE are safe!',
      'My aching back feels much better now! Let us head back to my house in AZALEA TOWN.',
      `${ctx.playerName} received a LURE BALL from KURT as thanks!`,
    ],
    '👴 KURT',
    () => {
      ctx.saveCurrentGame();
      ctx.showToast('🐢 Slowpoke Well cleared! Team Rocket fled Azalea Town!');
    }
  );
}

export function getAzaleaAndRuinsQuestInteractions(): NpcInteractionRegistration[] {
  return [
    // 10. Ruins of Alph Unown Dex Researcher
    {
      actions: ['UNOWN_DEX_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('unown_awakened_kabuto')) {
          if (!ctx.storyFlags.has('ENGINE_UNOWN_DEX')) {
            ctx.storyFlags.add('ENGINE_UNOWN_DEX');
            ctx.openDialogue(
              [
                'HEAD RESEARCHER: You discovered how to awaken the UNOWN in the ruins? That is incredible news!',
                `${ctx.playerName}'s POKéDEX was upgraded with the UNOWN DEX!`,
                'Use your POKéDEX to catalog all 26 distinct forms of UNOWN!',
              ],
              targetNpc.speaker,
              () => {
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.saveCurrentGame();
              }
            );
          } else {
            ctx.openDialogue(['The UNOWN DEX records all forms of UNOWN you encounter!'], targetNpc.speaker);
          }
        } else {
          ctx.openDialogue(
            [
              'The ruins are quiet today... We are researching ancient glyphs, but our equipment detects no active signals from the chambers.',
            ],
            targetNpc.speaker
          );
        }
        return true;
      },
    },

    // 11. Azalea Town & Slowpoke Well
    {
      npcIds: ['azalea_kurt'],
      handler: (targetNpc, _map, ctx) => {
        ctx.storyFlags.add('EVENT_KURT_LEFT_FOR_WELL');
        if (ctx.npcsByMap.azalea_town) {
          ctx.npcsByMap.azalea_town = ctx.npcsByMap.azalea_town.filter((n) => n.id !== 'azalea_well_grunt');
        }
        ctx.openDialogue(
          [
            'KURT: Those dastardly TEAM ROCKET villains are chopping off SLOWPOKE tails in the well!',
            "I'm going in there to drive them off myself! Stay back, kid!",
            'Kurt grabbed his walking stick and stormed towards SLOWPOKE WELL!',
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('👴 Kurt rushed into Slowpoke Well!');
          }
        );
        return true;
      },
    },
    {
      npcIds: ['azalea_well_grunt'],
      handler: (targetNpc, _map, ctx) => {
        ctx.openDialogue(
          [
            "ROCKET GRUNT: Beat it, kid! SLOWPOKE WELL is off-limits today! We're busy collecting... er, doing maintenance!",
          ],
          targetNpc.speaker
        );
        return true;
      },
    },
    {
      npcIds: ['azalea_gym_grunt'],
      handler: (targetNpc, _map, ctx) => {
        ctx.openDialogue(['ROCKET GRUNT: No one gets in the GYM! Buzz off, brat!'], targetNpc.speaker);
        return true;
      },
    },
    {
      npcIds: ['well_kurt'],
      handler: (_targetNpc, _map, ctx) => {
        if (ctx.defeatedTrainers.has('executive_proton') && !ctx.storyFlags.has('slowpoke_well_cleared')) {
          completeSlowpokeWellProtonVictory(ctx);
          return true;
        }
        return false;
      },
    },
    {
      actions: ['PROTON_EVENT'],
      npcIds: ['executive_proton'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.defeatedTrainers.has('executive_proton') && !ctx.storyFlags.has('slowpoke_well_cleared')) {
          completeSlowpokeWellProtonVictory(ctx);
          return true;
        }
        if (!ctx.storyFlags.has('proton_defeated')) {
          const introPages = [
            "PROTON: What do you want? If you interrupt our work, don't expect any mercy! We're TEAM ROCKET, and we'll do anything for money!",
          ];
          ctx.openDialogue(introPages, targetNpc.speaker, () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              trainerName: 'Executive Proton',
              trainerTeam: team,
              onVictory: () => {
                completeSlowpokeWellProtonVictory(ctx);
              },
            });
          });
          return true;
        }
        return false;
      },
    },
    {
      actions: ['KINGS_ROCK_EVENT'],
      npcIds: ['well_guide'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('GOT_KINGS_ROCK_IN_SLOWPOKE_WELL')) {
          ctx.openDialogue(
            ["CAVERN EXPLORER: I'm going to be like SLOWPOKE. I'll wait patiently, so I can see one evolve."],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          [
            "CAVERN EXPLORER: I'm waiting to see SLOWPOKE's moment of evolution.",
            'Through observation, I made a new discovery.',
            "A SLOWPOKE with a KING'S ROCK often gets bitten by a SHELLDER.",
            "Here, I'll share a KING'S ROCK with you!",
            `${ctx.playerName} received KING'S ROCK!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.storyFlags.add('GOT_KINGS_ROCK_IN_SLOWPOKE_WELL');
            if (!ctx.inventory.items) ctx.inventory.items = {};
            ctx.inventory.items['kings_rock'] = (ctx.inventory.items['kings_rock'] || 0) + 1;
            ctx.inventory.items['kings-rock'] = (ctx.inventory.items['kings-rock'] || 0) + 1;
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.saveCurrentGame();
            ctx.showToast("👑 Received KING'S ROCK from the Cavern Explorer!");
          }
        );
        return true;
      },
    },

    // 12. Ilex Forest Interactions
    ...getIlexForestInteractions(),
  ];
}
