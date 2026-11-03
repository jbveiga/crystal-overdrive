/**
 * @fileoverview OlivineAndVictoryRoadQuestInteractions domain module implementation.
 * Handles Tin Tower Suicune Altar, Victory Road Rival Final Battle, Olivine Tim's Voltorb Trade,
 * Cianwood Mania's Shuckie Gift, Cianwood Photo Studio, and Olivine Port Sailor Guard.
 * @module world/interactions/OlivineAndVictoryRoadQuestInteractions
 * @role OlivineAndVictoryRoadQuestInteractions Component
 * @exports getOlivineAndVictoryRoadQuestInteractions
 * @layer world
 * @sections L1-16: Micro-Header & Imports | L17-125: Tin Tower Suicune & Victory Road Rival | L126-260: Olivine Trade, Shuckie & Photo Studio
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { handlePortSailorGuard } from './FastShipAndVermilionInteractions';

export function getOlivineAndVictoryRoadQuestInteractions(): NpcInteractionRegistration[] {
  return [
    // 13. Tin Tower: Legendary Suicune Altar Encounter
    {
      actions: ['SUICUNE_TIN_TOWER_EVENT'],
      npcIds: ['suicune_altar'],
      handler: (_targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('suicune_caught_or_defeated')) {
          ctx.openDialogue(
            ['The ancient stone altar is serene, bathed in warm, crystal light.'],
            '💎 TIN TOWER ALTAR'
          );
          return true;
        }

        if (!ctx.storyFlags.has('wise_trio_cleared') && !ctx.storyFlags.has('EVENT_BEAT_WISE_TRIO')) {
          ctx.openDialogue(
            [
              'SUICUNE stands motionless atop the sacred crystal altar, surrounded by shimmering azure mist.',
              'The WISE TRIO must test your spirit in trial before the legendary crystal beast will accept your challenge!',
            ],
            '💎 TIN TOWER ALTAR'
          );
          return true;
        }

        BattleAudio.playCry('suicune');
        ctx.openDialogue(
          [
            'SUICUNE: Gurr-oooh!',
            'The sacred north wind swirls through the chamber! The crystal beast tests your worthiness!',
          ],
          '💎 SUICUNE',
          () => {
            const suicunePkmn = PokemonFactory.create('suicune', 40, ['aurorabeam', 'gust', 'raindance', 'surf']);
            ctx.triggerBattle(suicunePkmn, {
              onBattleEnd: (_res) => {
                if (_res.winner === 'PLAYER' || _res.caught) {
                  ctx.storyFlags.add('suicune_caught_or_defeated');
                  ctx.storyFlags.add('suicune_altar_reached');
                  ctx.storyFlags.add('wise_trio_cleared');
                  ctx.storyFlags.add('EVENT_FOUGHT_SUICUNE');
                  if (_res.caught) {
                    ctx.storyFlags.add('EVENT_CAUGHT_SUICUNE');
                  }
                  ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                  ctx.missionManager.completeMission('M11');
                  const curMap = ctx.mapManager.getCurrentMap();
                  if (curMap) {
                    ctx.renderMap?.(curMap);
                    ctx.syncMapOverworldItems?.(curMap);
                  }
                  ctx.saveCurrentGame();
                  ctx.openDialogue(
                    [
                      'SUICUNE bowed with divine elegance before bounding toward the endless horizons!',
                      'EUSINE: Staggering! The crystal beast recognized your heroic bond and valor!',
                    ],
                    '🎩 EUSINE',
                    () => {
                      ctx.showToast('💎 Cleared the Suicune Trial at Tin Tower!');
                    }
                  );
                }
              },
            });
          }
        );
        return true;
      },
    },

    // 15. Victory Road: Rival Final Johto Battle
    {
      actions: ['VICTORY_ROAD_RIVAL_EVENT'],
      npcIds: ['victory_road_rival'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('victory_road_rival_defeated')) {
          ctx.openDialogue(
            ['RIVAL: …Go on to the LEAGUE. Next time we battle, I will prove that I have changed!'],
            targetNpc.speaker
          );
          return true;
        }
        const challenge =
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : ["RIVAL: I have assembled the ultimate team of ruthless, powerful POKéMON! Let's finish this!"];
        ctx.openDialogue(challenge, targetNpc.speaker, () => {
          const team = ctx.buildTrainerTeamInstances(targetNpc);
          if (team.length === 0) return;
          ctx.triggerBattle(team[0], {
            isTrainer: true,
            isGymLeader: true,
            trainerName: targetNpc.trainerName || 'Rival',
            trainerTeam: team,
            onVictory: () => {
              ctx.defeatedTrainers.add('rival_victory_road');
              ctx.storyFlags.add('victory_road_rival_defeated');
              ctx.storyFlags.add('badge_gates_passed');
              ctx.storyFlags.add('crossed_tohjo_falls');
              ctx.missionManager.checkStoryFlags(ctx.storyFlags);
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  "RIVAL: …I couldn't win… Even after pushing my POKéMON to their absolute limits…",
                  'Is it true what LANCE said to me back in Mahogany? That I lacked trust and affection for my partners…?',
                  '…I won\'t give up. Go on to the LEAGUE! Become the CHAMPION so I have someone worthy to chase!',
                ],
                targetNpc.speaker,
                () => {
                  const curMap = ctx.mapManager.getCurrentMap();
                  if (curMap) {
                    ctx.renderMap?.(curMap);
                    ctx.syncMapOverworldItems?.(curMap);
                  }
                  ctx.saveCurrentGame();
                  ctx.showToast('🔴 Defeated Rival on Victory Road!');
                }
              );
            },
          });
        });
        return true;
      },
    },

    // 21. Olivine City: Tim's Krabby for Voltorb Trade
    {
      actions: ['TIM_TRADE'],
      npcIds: ['olivine_tim'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_TRADED_TIM_VOLTORB')) {
          ctx.openDialogue(
            ["TIM: Hi! How's that VOLTORB I traded you? My KRABBY is growing bigger every day!"],
            targetNpc.speaker
          );
          return true;
        }

        const executeTimTrade = () => {
          const krabbyIndex = ctx.playerParty.findIndex((p) => p.speciesId.toLowerCase() === 'krabby');
          if (krabbyIndex === -1) {
            BattleAudio.playMenuSound('CANCEL');
            ctx.openDialogue(
              [
                "TIM: Oh, you don't have a KRABBY with you!",
                'Try fishing or smashing rocks along the coast to catch a KRABBY!',
              ],
              targetNpc.speaker
            );
            return;
          }

          const voltorb = PokemonFactory.create('voltorb', 20, ['tackle', 'screech', 'sonicboom', 'spark']);
          voltorb.nickname = 'VOLTY';
          voltorb.heldItem = 'cheri-berry';
          voltorb.originalTrainer = 'TIM';

          ctx.playerParty[krabbyIndex] = voltorb;
          ctx.storyFlags.add('EVENT_TRADED_TIM_VOLTORB');

          const finishTradeDialogue = () => {
            BattleAudio.playOverworldSound('FANFARE');
            ctx.openDialogue(
              [
                'TIM: Wow! A real KRABBY! Thank you so much!',
                `${ctx.playerName} traded KRABBY for TIM's VOLTORB (VOLTY)!`,
                "TIM: Take good care of VOLTY! It's super fast!",
              ],
              targetNpc.speaker,
              () => {
                ctx.saveCurrentGame();
                ctx.showToast('⚡ Traded KRABBY for TIM’s VOLTORB (VOLTY)!');
              }
            );
          };

          if (ctx.playTradeAnimation) {
            ctx.playTradeAnimation(
              {
                givenSpeciesId: 'krabby',
                givenName: 'KRABBY',
                receivedSpeciesId: 'voltorb',
                receivedName: 'VOLTORB (VOLTY)',
                traderName: 'TIM',
              },
              finishTradeDialogue
            );
          } else {
            finishTradeDialogue();
          }
        };

        if (ctx.openChoiceDialogue) {
          ctx.openChoiceDialogue(
            [
              'TIM: I love sea POKéMON! Do you have a KRABBY?',
              "If you trade me a KRABBY, I'll give you my prized VOLTORB (VOLTY)! Would you like to trade?",
            ],
            targetNpc.speaker,
            (choice) => {
              if (choice === 'YES') {
                executeTimTrade();
              } else {
                BattleAudio.playMenuSound('CANCEL');
                ctx.openDialogue(["TIM: Oh, you don't want to trade? Let me know if you change your mind!"], targetNpc.speaker);
              }
            }
          );
          return true;
        }

        const krabbyIndex = ctx.playerParty.findIndex((p) => p.speciesId.toLowerCase() === 'krabby');
        if (krabbyIndex === -1) {
          ctx.openDialogue(
            [
              'TIM: I love sea POKéMON! Do you have a KRABBY?',
              "If you trade me a KRABBY, I'll give you my prized VOLTORB (VOLTY)!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        executeTimTrade();
        return true;
      },
    },

    // 23. Mania's House: Kirk Shuckie Gift
    {
      actions: ['MANIA_SHUCKLE_EVENT'],
      npcIds: ['cianwood_kirk'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('received_shuckie')) {
          ctx.openDialogue(
            ["KIRK: Hi, " + ctx.playerName + "! How is SHUCKIE doing? It seems to really like you! Why don't you keep it?"],
            targetNpc.speaker
          );
          return true;
        }

        if (ctx.playerParty && ctx.playerParty.length >= 6) {
          ctx.openDialogue(['KIRK: Your party is full! Please make room in your party first!'], targetNpc.speaker);
          return true;
        }

        const shuckie = PokemonFactory.create('shuckle', 20, ['constrict', 'bide', 'encore', 'safeguard']);
        shuckie.nickname = 'SHUCKIE';
        shuckie.heldItem = 'berry';
        shuckie.originalTrainer = 'KIRK';
        if (ctx.playerParty && ctx.playerParty.length < 6) {
          ctx.playerParty.push(shuckie);
        } else if (ctx.boxManager) {
          ctx.boxManager.deposit(shuckie);
        } else if (ctx.playerBox) {
          ctx.playerBox.push(shuckie);
        }
        ctx.seenSpecies?.add('shuckle');
        ctx.caughtSpecies?.add('shuckle');

        ctx.storyFlags.add('received_shuckie');
        ctx.storyFlags.add('EVENT_GOT_SHUCKIE');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            'KIRK: I, I am in shock! A guy with mean eyes and red hair barged in on me and took my prized POKéMON!',
            'I still have one left, but what if he comes back? You look tough. Please look after my POKéMON!',
            `${ctx.playerName} received SHUCKIE the SHUCKLE from KIRK!`,
            'KIRK: Its name is SHUCKIE. Treat it with lots of love!',
          ],
          targetNpc.speaker,
          () => {
            void ctx.saveCurrentGame();
            ctx.showToast('🐢 Received SHUCKIE from Kirk!');
          }
        );
        return true;
      },
    },

    // 24. Cianwood Photo Studio: Commemorative Photo
    {
      actions: ['PHOTO_STUDIO_EVENT'],
      npcIds: ['cianwood_photographer'],
      handler: (targetNpc, _map, ctx) => {
        ctx.storyFlags.add('photo_taken');
        ctx.storyFlags.add('EVENT_TOOK_PHOTO_IN_CIANWOOD');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          ['CAMERAMAN: Say cheese! Looking great!', 'There! That is a wonderful keepsake of your journey across Johto!'],
          targetNpc.speaker,
          () => {
            void ctx.saveCurrentGame();
            ctx.showToast('📸 Commemorative photo taken at Cianwood Photo Studio!');
          }
        );
        return true;
      },
    },

    // 25. Olivine Port Sailor Ticket Guard (Cross-compatibility registration)
    {
      actions: ['PORT_SAILOR_GUARD'],
      npcIds: ['port_sailor_guard', 'olivine_port_sailor_0'],
      handler: handlePortSailorGuard,
    },
  ];
}
