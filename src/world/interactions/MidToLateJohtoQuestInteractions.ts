/**
 * @fileoverview MidToLateJohtoQuestInteractions domain module implementation.
 * @module world/interactions/MidToLateJohtoQuestInteractions
 * @role MidToLateJohtoQuestInteractions Component
 * @exports getMidToLateJohtoQuestInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-313: Implementation | L314-626: Handlers & Exports
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

/**
 * MidToLateJohtoQuestInteractions — Burned Tower, Lake of Rage, Rocket Base, Radio Tower, Tin Tower, Dragon's Den & Victory Road
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getMidToLateJohtoQuestInteractions(): NpcInteractionRegistration[] {
  return [
    // 1. Burned Tower 1F Rival Silver Battle
    {
      actions: ['RIVAL_BURNED_TOWER_BATTLE'],
      npcIds: ['silver_burned'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER')) {
          ctx.openDialogue(["SILVER: …Tch! Keep moving! I don't want to look at your face!"], targetNpc.speaker);
          return true;
        }
        ctx.triggerBurnedTowerRivalBattle();
        return true;
      },
    },

    // 2. Burned Tower B1F Beasts Awakening
    {
      actions: ['BEASTS_AWAKENING'],
      npcIds: ['beasts'],
      handler: (_targetNpc, _map, ctx) => {
        ctx.triggerBeastsAwakeningCutscene();
        return true;
      },
    },

    // 3. Lake of Rage & Mahogany Town interactions modularized in MahoganyTownAndLakeInteractions.ts

    // 7. Team Rocket Base B2F: Lance Field Medic
    {
      actions: ['LANCE_BASE_HEAL'],
      npcIds: ['team_rocket_base_b2f_lance'],
      handler: (_targetNpc, _map, ctx) => {
        ctx.healPlayerParty(true);
        ctx.openDialogue(
          [
            'LANCE: Are your Pokémon holding up? Here, let me restore your team to peak fighting condition!',
            'Your Pokémon were fully healed and refreshed!',
            'LANCE: The central power room is located just down the stairs on B3F. Stay alert—Team Rocket executives are guarding it!',
          ],
          '🏆 LANCE',
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('✨ Team fully restored by Lance!');
          }
        );
        return true;
      },
    },

    // 8. Team Rocket Base B3F: Generator Electrodes Sabotage
    {
      actions: ['ROCKET_GENERATOR_ELECTRODE'],
      idPrefixes: ['b3f_electrode_'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has(targetNpc.id + '_cleared') || ctx.storyFlags.has('rocket_base_generator_cleared')) {
          ctx.openDialogue(['The power pod is offline and humming faintly.'], '⚡ GENERATOR');
          return true;
        }
        BattleAudio.playCry('electrode');
        ctx.openDialogue(
          [
            '⚡ The ELECTRODE is locked into the generator housing, radiating frantic, crackling electricity!',
            'It turned toward you and attacked in wild agitation!',
          ],
          '⚡ ELECTRODE',
          () => {
            const electrodePkmn = PokemonFactory.create('electrode', 23, ['spark', 'sonicboom', 'screech', 'selfdestruct']);
            ctx.triggerBattle(electrodePkmn, {
              onBattleEnd: (result) => {
                if (result.winner === 'PLAYER' || result.caught) {
                  ctx.storyFlags.add(targetNpc.id + '_cleared');
                  const clearedCount = [1, 2, 3, 4, 5, 6].filter((i) =>
                    ctx.storyFlags.has(`b3f_electrode_${i}_cleared`)
                  ).length;

                  if (clearedCount >= 3) {
                    ctx.storyFlags.add('rocket_base_generator_cleared');
                    if (!ctx.inventory.tms.includes('HM06')) {
                      ctx.inventory.tms.push('HM06');
                    }
                    ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                    ctx.audioManager.playSfx?.('sfx_badge_get');
                    BattleAudio.playOverworldSound('KEY_ITEM');
                    ctx.openDialogue(
                      [
                        "The generator's heavy hum abruptly sputters and dies! The broadcast transmitter has gone dead!",
                        'LANCE: Magnificent work, trainer! The forced evolution signal has been completely disabled!',
                        'The wild Magikarp and the Lake of Rage are peaceful once more.',
                        'Please, take this as a token of my sincere respect for your valor: HM06 WHIRLPOOL!',
                        'LANCE: With WHIRLPOOL, your Pokémon can safely carry you across dangerous ocean vortexes.',
                        'I must return to the Pokémon League at Indigo Plateau. Pryce should be waiting at the Mahogany Gym now. Good luck, trainer!',
                      ],
                      '🏆 LANCE',
                      () => {
                        const curMap = ctx.mapManager.getCurrentMap();
                        if (curMap) {
                          ctx.renderMap?.(curMap);
                          ctx.syncMapOverworldItems?.(curMap);
                        }
                        ctx.saveCurrentGame();
                        ctx.showToast('⚡ Transmitter Shut Down! Received HM06 WHIRLPOOL!');
                      }
                    );
                  } else {
                    ctx.openDialogue(
                      [`The ELECTRODE broke free from the generator pod! (${clearedCount}/3 generator cores disabled)`],
                      '⚡ GENERATOR',
                      () => {
                        const curMap = ctx.mapManager.getCurrentMap();
                        if (curMap) {
                          ctx.renderMap?.(curMap);
                          ctx.syncMapOverworldItems?.(curMap);
                        }
                        ctx.saveCurrentGame();
                      }
                    );
                  }
                }
              },
            });
          }
        );
        return true;
      },
    },

    // 9. Radio Tower: Fake Director Petrel
    {
      actions: ['FAKE_DIRECTOR_EVENT'],
      npcIds: ['petrel_radio_5f'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('fake_director_defeated')) {
          ctx.openDialogue(
            ["PETREL: Grr... The real DIRECTOR is hidden in the underground warehouse! But you'll never figure out the path!"],
            targetNpc.speaker
          );
          return true;
        }
        const challenge =
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : ["PETREL: Wahahaha! I'm an imposter! You'll never get the BASEMENT KEY!"];
        ctx.openDialogue(challenge, targetNpc.speaker, () => {
          const team = ctx.buildTrainerTeamInstances(targetNpc);
          if (team.length === 0) return;
          ctx.triggerBattle(team[0], {
            isTrainer: true,
            isGymLeader: true,
            trainerName: targetNpc.trainerName || 'Executive Petrel',
            trainerTeam: team,
            onVictory: () => {
              ctx.defeatedTrainers.add('petrel');
              ctx.storyFlags.add('fake_director_defeated');
              ctx.addOverworldItemToInventory('basement-key');
              ctx.storyFlags.add('has_basement_key');
              ctx.missionManager.checkStoryFlags(ctx.storyFlags);
              ctx.audioManager.playSfx?.('sfx_badge_get');
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  'PETREL: Wah! I lost?! Fine, take the BASEMENT KEY!',
                  "The real DIRECTOR is imprisoned deep inside the UNDERGROUND WAREHOUSE! But you'll never find him in that maze!",
                  `${ctx.playerName} received the BASEMENT KEY!`,
                ],
                targetNpc.speaker,
                () => {
                  const curMap = ctx.mapManager.getCurrentMap();
                  if (curMap) {
                    ctx.renderMap?.(curMap);
                    ctx.syncMapOverworldItems?.(curMap);
                  }
                  ctx.saveCurrentGame();
                  ctx.showToast('🗝️ Defeated Executive Petrel & received BASEMENT KEY!');
                }
              );
            },
          });
        });
        return true;
      },
    },

    // 10. Goldenrod Underground: True Director Rescue
    {
      actions: ['TRUE_DIRECTOR_EVENT'],
      npcIds: ['true_director'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('card_key_obtained')) {
          ctx.openDialogue(
            ['DIRECTOR: Please use that CARD KEY to unlock the 3F security shutters and save the RADIO TOWER!'],
            targetNpc.speaker
          );
          return true;
        }
        ctx.storyFlags.add('warehouse_unlocked');
        ctx.storyFlags.add('card_key_obtained');
        ctx.addOverworldItemToInventory('card-key');
        ctx.storyFlags.add('has_card_key');
        ctx.missionManager.checkStoryFlags(ctx.storyFlags);
        ctx.audioManager.playSfx?.('sfx_badge_get');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            'DIRECTOR: You came all the way down here to rescue me?! Thank you, thank you!',
            'TEAM ROCKET locked me away and hijacked the observation deck transmitter on 5F to summon GIOVANNI!',
            'Take this CARD KEY! It will unlock the 3F security shutters in the RADIO TOWER so you can stop them!',
            `${ctx.playerName} received the CARD KEY!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('💳 Rescued the Director & received CARD KEY!');
          }
        );
        return true;
      },
    },

    // 11. Radio Tower 5F: Executive Archer Boss
    {
      actions: ['ARCHER_EVENT'],
      npcIds: ['archer_radio_5f'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('radio_tower_liberated')) {
          ctx.openDialogue(
            ['The broadcast console is powered down and the transmitter is peaceful once more.'],
            '📻 TRANSMITTER'
          );
          return true;
        }
        const challenge =
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : ['ARCHER: TEAM ROCKET will never perish! Feel our ultimate might!'];
        ctx.openDialogue(challenge, targetNpc.speaker, () => {
          const team = ctx.buildTrainerTeamInstances(targetNpc);
          if (team.length === 0) return;
          ctx.triggerBattle(team[0], {
            isTrainer: true,
            isGymLeader: true,
            trainerName: targetNpc.trainerName || 'Executive Archer',
            trainerTeam: team,
            onVictory: () => {
              ctx.defeatedTrainers.add('archer');
              ctx.storyFlags.add('archer_defeated');
              ctx.storyFlags.add('radio_tower_liberated');
              ctx.storyFlags.add('reached_observation_deck');
              ctx.storyFlags.add('has_clear_bell');
              ctx.addOverworldItemToInventory('clear-bell');
              ctx.addOverworldItemToInventory('rainbow-wing');
              ctx.missionManager.checkStoryFlags(ctx.storyFlags);
              ctx.missionManager.completeMission('M09');
              ctx.audioManager.playSfx?.('sfx_badge_get');
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  "ARCHER: How could this be...?! TEAM ROCKET's grand ambitions shattered again by a lone child?!",
                  'It is finished... GIOVANNI will not return. TEAM ROCKET will disband this day!',
                  'Executive Archer and the remaining grunts fled from Goldenrod City forever!',
                  "DIRECTOR: You did it! You drove off TEAM ROCKET and saved all of JOHTO's airwaves!",
                  'Please, take these legendary sacred treasures: the CLEAR BELL and RAINBOW WING!',
                  `${ctx.playerName} received the CLEAR BELL and RAINBOW WING!`,
                ],
                targetNpc.speaker,
                () => {
                  const curMap = ctx.mapManager.getCurrentMap();
                  if (curMap) {
                    ctx.renderMap?.(curMap);
                    ctx.syncMapOverworldItems?.(curMap);
                  }
                  ctx.saveCurrentGame();
                  ctx.showToast('🔔 Liberated Radio Tower! Received CLEAR BELL & RAINBOW WING!');
                }
              );
            },
          });
        });
        return true;
      },
    },

    // 12. Radio Tower: Director Post-Liberation
    {
      actions: ['RADIO_DIRECTOR_AFTER_EVENT'],
      npcIds: ['radio_director'],
      handler: (targetNpc, _map, ctx) => {
        ctx.openDialogue(
          [
            'DIRECTOR: Hello, Gold! Thanks to your bravery, our music and news programs are broadcasting peacefully throughout JOHTO!',
            'You should visit the historic TIN TOWER in Ecruteak City with that CLEAR BELL in hand!',
          ],
          targetNpc.speaker
        );
        return true;
      },
    },

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
        BattleAudio.playCry('suicune');
        ctx.openDialogue(
          [
            'SUICUNE: Gurr-oooh!',
            'The sacred north wind swirls through the chamber! The crystal beast tests your worthiness!',
          ],
          '💎 SUICUNE',
          () => {
            const suicunePkmn = PokemonFactory.create('suicune', 40, ['aurorabeam', 'gust', 'rain-dance', 'surf']);
            ctx.triggerBattle(suicunePkmn, {
              onBattleEnd: (_res) => {
                ctx.storyFlags.add('suicune_caught_or_defeated');
                ctx.storyFlags.add('suicune_altar_reached');
                ctx.storyFlags.add('wise_trio_cleared');
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
              },
            });
          }
        );
        return true;
      },
    },

    // 14. Dragon's Den: Dragon Elder Quiz & Rising Badge Grant
    {
      actions: ['DRAGON_ELDER_EVENT'],
      npcIds: ['dragon_elder'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('dragon_elder_quiz_passed')) {
          ctx.openDialogue(
            [
              'ELDER: You possess the soul and empathy of a true master. May dragons watch over your path to the LEAGUE!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          [
            "ELDER: Hm! You have traversed the perilous DRAGON'S DEN to reach our sacred shrine.",
            'Before granting our blessing, I must test your true philosophy toward POKéMON.',
            'Question 1: What are POKéMON to you? ...A partner and friend.',
            'Question 2: What helps you triumph in battles? ...Training, strategy, and mutual trust.',
            'Question 3: What kind of trainer do you wish to battle? ...Tough opponents to grow together.',
            'Question 4: What is the most important thing for raising POKéMON? ...Love, knowledge, and compassion.',
            'Question 5: Strong POKéMON or weak POKéMON? ...Both are precious! True skill brings out the best in all!',
            'ELDER: Magnificent! You hold POKéMON in the highest esteem. Your answers are exemplary!',
            'CLAIR burst into the shrine chamber, gasping for breath!',
            "CLAIR: ELDER! Did this trainer truly pass the Dragon Clan's trial?!",
            "ELDER: They did, CLAIR. You must learn from this trainer's humility and deep devotion.",
            'CLAIR: ...I understand. I lost. You truly deserve this BADGE!',
            `${ctx.playerName} received the RISINGBADGE and TM24 DRAGONBREATH!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.storyFlags.add('dragon_elder_quiz_passed');
            ctx.storyFlags.add('reached_dragon_shrine');
            ctx.storyFlags.add('clair_conceded');
            ctx.storyFlags.add('clair_defeated');
            if (!ctx.inventory.badges.includes('rising')) ctx.inventory.badges.push('rising');
            if (!ctx.inventory.tms.includes('TM24')) ctx.inventory.tms.push('TM24');
            ctx.addOverworldItemToInventory('master-ball');
            if (ctx.playerParty.length < 6) {
              const dratini = PokemonFactory.create('dratini', 15, ['extremespeed', 'thunderwave', 'twister', 'dragonrage']);
              dratini.nickname = 'DRATINI';
              ctx.playerParty.push(dratini);
              ctx.storyFlags.add('received_shrine_dratini');
            }
            ctx.missionManager.checkStoryFlags(ctx.storyFlags);
            ctx.missionManager.completeMission('M10');
            ctx.audioManager.playSfx?.('sfx_badge_get');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.saveCurrentGame();
            ctx.showToast('🐉 Earned RISING BADGE, TM24, & Dratini from Dragon Shrine!');
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

        const krabbyIndex = ctx.playerParty.findIndex((p) => p.speciesId.toLowerCase() === 'krabby');
        if (krabbyIndex === -1) {
          ctx.openDialogue(
            [
              "TIM: I love sea POKéMON! Do you have a KRABBY?",
              "If you trade me a KRABBY, I'll give you my prized VOLTORB (VOLTY)!",
            ],
            targetNpc.speaker
          );
          return true;
        }

        const voltorb = PokemonFactory.create('voltorb', 20, ['tackle', 'screech', 'sonicboom', 'spark']);
        voltorb.nickname = 'VOLTY';
        voltorb.heldItem = 'cheri-berry';
        voltorb.originalTrainer = 'TIM';

        ctx.playerParty[krabbyIndex] = voltorb;
        ctx.storyFlags.add('EVENT_TRADED_TIM_VOLTORB');
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
        return true;
      },
    },

    // 22. Olivine Port Sailor Guard Ticket Barrier
    {
      actions: ['PORT_SAILOR_GUARD'],
      npcIds: ['port_sailor_guard'],
      handler: (targetNpc, _map, ctx) => {
        const hasTicket =
          Boolean(ctx.inventory.items?.['ss-ticket']) ||
          Boolean(ctx.inventory.items?.['ss_ticket']) ||
          ctx.storyFlags.has('has_ss_ticket') ||
          ctx.storyFlags.has('hall_of_fame_inducted') ||
          ctx.storyFlags.has('EVENT_GOT_SS_TICKET') ||
          (ctx.inventory.keyItems || []).includes('ss_ticket') ||
          (ctx.inventory.keyItems || []).includes('S.S. TICKET');

        if (!hasTicket) {
          ctx.openDialogue(
            [
              "SAILOR: We don't want you to fall into the sea, so you're not allowed onto the pier without an S.S. TICKET!",
              'Only certified trainers who have conquered the JOHTO LEAGUE receive a ticket from PROF. ELM.',
            ],
            targetNpc.speaker
          );
          return true;
        }

        ctx.openDialogue(
          ['SAILOR: Welcome aboard the FAST SHIP S.S. AQUA!', 'Have your ticket ready as you board the ship at the gangway ahead!'],
          targetNpc.speaker
        );
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
        if (ctx.playerParty) ctx.playerParty.push(shuckie);

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
  ];
}
