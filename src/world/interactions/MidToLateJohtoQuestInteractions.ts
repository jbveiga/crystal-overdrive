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
import { getOlivineAndVictoryRoadQuestInteractions } from './OlivineAndVictoryRoadQuestInteractions';

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
        const rName = ctx.getRivalName?.();
        const speaker = rName ? `❓ RIVAL ${rName.toUpperCase()}` : targetNpc.speaker;
        if (ctx.storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER')) {
          ctx.openDialogue(["SILVER: …Tch! Keep moving! I don't want to look at your face!"], speaker);
          return true;
        }
        ctx.triggerBurnedTowerRivalBattle();
        return true;
      },
    },

    // 2. Burned Tower B1F Beasts Awakening
    {
      actions: ['BEASTS_AWAKENING'],
      npcIds: ['beasts', 'burned_raikou', 'burned_entei'],
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

    // 11. Radio Tower 3F: Executive Archer Boss
    {
      actions: ['ARCHER_EVENT'],
      npcIds: ['archer_radio_3f'],
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
            const dratini = PokemonFactory.create('dratini', 15, ['extremespeed', 'thunderwave', 'twister', 'dragonrage']);
            dratini.nickname = 'DRATINI';
            if (ctx.playerParty.length < 6) {
              ctx.playerParty.push(dratini);
            } else if (ctx.boxManager) {
              ctx.boxManager.deposit(dratini);
            } else if (ctx.playerBox) {
              ctx.playerBox.push(dratini);
            }
            ctx.seenSpecies?.add('dratini');
            ctx.caughtSpecies?.add('dratini');
            ctx.storyFlags.add('received_shrine_dratini');
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

    // 13, 15, 21, 23-25. Tin Tower Suicune, Victory Road Rival, Olivine & Cianwood Quests
    ...getOlivineAndVictoryRoadQuestInteractions(),
  ];
}
