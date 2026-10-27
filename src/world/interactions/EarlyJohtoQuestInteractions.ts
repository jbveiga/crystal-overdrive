/**
 * @fileoverview EarlyJohtoQuestInteractions domain module implementation.
 * @module world/interactions/EarlyJohtoQuestInteractions
 * @role EarlyJohtoQuestInteractions Component
 * @exports completeSlowpokeWellProtonVictory, getEarlyJohtoQuestInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-323: Implementation | L324-647: Handlers & Exports
 */

import type { MapData } from '../../types/game';
import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionContext, NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { GridPhysics } from '../GridPhysics';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { resolveElmLabDialogue } from '../npcData';
import { getIlexForestInteractions } from './IlexForestInteractions';

export function completeSlowpokeWellProtonVictory(ctx: NpcInteractionContext): void {
  ctx.defeatedTrainers.add('executive_proton');
  ctx.storyFlags.add('proton_defeated');
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

/**
 * EarlyJohtoQuestInteractions — New Bark, Cherrygrove, Violet, Azalea & Ilex Quests
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getEarlyJohtoQuestInteractions(): NpcInteractionRegistration[] {
  return [
    // 1. Mr. Pokémon's House (Mystery Egg & Pokédex)
    {
      actions: ['MR_POKEMON_EVENT'],
      npcIds: ['mr_pokemon_npc'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('HAS_MYSTERY_EGG')) {
          ctx.storyFlags.add('HAS_MYSTERY_EGG');
          ctx.storyFlags.add('HAS_POKEDEX');
          if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
          if (!ctx.inventory.keyItems.includes('MYSTERY EGG')) ctx.inventory.keyItems.push('MYSTERY EGG');
          if (!ctx.inventory.keyItems.includes('POKéDEX')) ctx.inventory.keyItems.push('POKéDEX');
          ctx.healPlayerParty();
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              `MR. POKéMON: Hello, hello! You must be ${ctx.playerName}, sent by PROF. ELM!`,
              `This is the rare egg I asked PROF. ELM to examine—${ctx.playerName} received the MYSTERY EGG!`,
              `PROF. OAK: Aha! So you are ${ctx.playerName}! Your ${ctx.playerParty[0]?.nickname || 'POKéMON'} seems very attached to you!`,
              'PROF. OAK: You look like a dependable trainer! Take this latest-model POKéDEX!',
              'PROF. OAK: I am off to GOLDENROD CITY for my radio show. Good luck on your journey!',
              '🎩 MR. POKéMON also restored your party to full health before your journey back!',
            ],
            '🎩 MR. POKéMON & 🎓 PROF. OAK',
            () => {
              if (ctx.npcsByMap.mr_pokemons_house) {
                ctx.npcsByMap.mr_pokemons_house = ctx.npcsByMap.mr_pokemons_house.filter(
                  (n) => n.id !== 'prof_oak_npc'
                );
              }
              if (ctx.npcsByMap.new_bark_town) {
                ctx.npcsByMap.new_bark_town = ctx.npcsByMap.new_bark_town.filter((n) => n.id !== 'nbt_rival');
              }
              ctx.saveCurrentGame();
              ctx.showToast('🥚 Received MYSTERY EGG & 📕 POKéDEX! (Check START MENU -> POKéDEX)');
            }
          );
          return true;
        }

        if (!ctx.storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')) {
          ctx.openDialogue(
            [
              "MR. POKéMON: I'm depending on you!",
              'Please deliver that rare EGG to PROF. ELM safely!',
            ],
            targetNpc.speaker,
            () => {
              ctx.healPlayerParty(false);
              ctx.saveCurrentGame();
              ctx.playFieldRestAnimation();
            }
          );
          return true;
        }

        ctx.openDialogue(
          ['MR. POKéMON: Life is wonderful! Always new discoveries to be made!'],
          targetNpc.speaker,
          () => {
            ctx.healPlayerParty(false);
            ctx.saveCurrentGame();
            ctx.playFieldRestAnimation();
          }
        );
        return true;
      },
    },

    // 2. Route 30 Berry House Potion Gift
    {
      actions: ['BERRY_MAN_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('RECEIVED_ROUTE30_BERRY_POTION')) {
          ctx.storyFlags.add('RECEIVED_ROUTE30_BERRY_POTION');
          if (!ctx.inventory.items) ctx.inventory.items = {};
          ctx.inventory.items.potion = (ctx.inventory.items.potion || 0) + 1;
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(targetNpc.pages || [], targetNpc.speaker, () => {
            ctx.saveCurrentGame();
            ctx.showToast('🧪 Received POTION from the Route 30 Berry House!');
          });
          return true;
        }
        return false;
      },
    },

    // 3. Cherrygrove Guide Gent Walking Tour & Map Card
    {
      actions: ['GUIDE_GENT_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('has_map_card')) {
          ctx.openDialogue(
            [
              'GUIDE GENT: POKéGEAR becomes more useful as you add CARDS. I wish you luck on your journey!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        const introPages = [
          "GUIDE GENT: You're a rookie trainer, aren't you? I can tell!",
          "That's OK! Everyone is a rookie at some point! If you'd like, I can teach you a few things.",
          'OK, then! Follow me!',
        ];
        ctx.openDialogue(introPages, targetNpc.speaker, async () => {
          await ctx.runGuideGentWalkingTour(targetNpc);
        });
        return true;
      },
    },

    // 4. Sprout Tower Elder Li (HM05 Flash)
    {
      actions: ['ELDER_LI_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('sprout_tower_cleared')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  'ELDER LI: So, you have come seeking enlightenment with your POKéMON. As the ELDER of SPROUT TOWER, I shall test the bond between you and your partners!',
                ];
          ctx.openDialogue(introPages, targetNpc.speaker, () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              trainerName: targetNpc.trainerName || 'Elder Li',
              trainerTeam: team,
              onVictory: () => {
                ctx.defeatedTrainers.add('elder_li');
                ctx.storyFlags.add('sprout_tower_cleared');
                ctx.storyFlags.add('EVENT_GOT_HM05_FLASH');
                if (!ctx.inventory.tms.includes('HM05')) ctx.inventory.tms.push('HM05');
                ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.openDialogue(
                  [
                    'ELDER LI: Ah, splendid! You truly possess the heart of a true trainer! As proof of your mastery, take this HIDDEN MACHINE: HM05 FLASH!',
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast('⚡ Defeated Elder Li & received HM05 FLASH!');
                  }
                );
              },
            });
          });
          return true;
        }
        return false;
      },
    },

    // 5. Elm's Aide: Post-Falkner Togepi Mystery Egg
    {
      actions: ['ELMS_AIDE_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('falkner_defeated')) {
          ctx.openDialogue(
            ["AIDE: I'm waiting for a promising young trainer on behalf of PROF. ELM."],
            targetNpc.speaker
          );
          return true;
        }

        if (ctx.storyFlags.has('falkner_defeated') && !ctx.storyFlags.has('togepi_egg_received')) {
          if (ctx.playerParty.length >= 6) {
            ctx.openDialogue(
              [
                'AIDE: Oh, your party is full! Please make room in your party using the PC and come back!',
              ],
              targetNpc.speaker
            );
            return true;
          }

          ctx.playerParty.push(PokemonFactory.createEgg('togepi', 256));
          ctx.storyFlags.add('togepi_egg_received');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              `AIDE: ${ctx.playerName}! Long time, no see! PROF. ELM asked me to find you!`,
              `${ctx.playerName} received the MYSTERY EGG from PROF. ELM's AIDE!`,
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast("🥚 Received the Togepi MYSTERY EGG from Prof. Elm's Aide!");
            }
          );
          return true;
        }

        ctx.openDialogue(
          ["AIDE: Take good care of that EGG! I'm sure something wonderful will hatch from it!"],
          targetNpc.speaker
        );
        return true;
      },
    },

    // 6. New Bark Town: Peeking Rival Shove Mechanism
    {
      npcIds: ['nbt_rival'],
      handler: (targetNpc, currentMap, ctx) => {
        const executeShove = () => {
          BattleAudio.playOverworldSound('BUMP');
          ctx.shakeScreen(400);

          let pushX = ctx.player.x;
          let pushY = ctx.player.y;

          const activeMapNpcs = ctx.npcsByMap[currentMap?.id || ''] || [];
          if (
            ctx.mapManager.isWalkable(ctx.player.x, ctx.player.y + 1) &&
            !GridPhysics.isTileOccupiedByEntities(ctx.player.x, ctx.player.y + 1, ctx.player, activeMapNpcs)
          ) {
            pushX = ctx.player.x;
            pushY = ctx.player.y + 1;
          } else {
            const backDir = ctx.getOppositeDirection(ctx.player.direction);
            const bdx = backDir === 'LEFT' ? -1 : backDir === 'RIGHT' ? 1 : 0;
            const bdy = backDir === 'UP' ? -1 : backDir === 'DOWN' ? 1 : 0;
            if (
              ctx.mapManager.isWalkable(ctx.player.x + bdx, ctx.player.y + bdy) &&
              !GridPhysics.isTileOccupiedByEntities(ctx.player.x + bdx, ctx.player.y + bdy, ctx.player, activeMapNpcs)
            ) {
              pushX = ctx.player.x + bdx;
              pushY = ctx.player.y + bdy;
            } else {
              const offsets = [
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: -1 },
              ];
              for (const off of offsets) {
                const ox = ctx.player.x + off.dx;
                const oy = ctx.player.y + off.dy;
                if (
                  ctx.mapManager.isWalkable(ox, oy) &&
                  !GridPhysics.isTileOccupiedByEntities(ox, oy, ctx.player, activeMapNpcs)
                ) {
                  pushX = ox;
                  pushY = oy;
                  break;
                }
              }
            }
          }

          if (pushX !== ctx.player.x || pushY !== ctx.player.y) {
            ctx.player.isMoving = true;
            ctx.player.targetX = pushX;
            ctx.player.targetY = pushY;
            ctx.player.progress = 0.0;
            if (pushY > targetNpc.y) {
              ctx.player.direction = 'UP';
            } else if (pushX < targetNpc.x) {
              ctx.player.direction = 'RIGHT';
            }
          }
        };

        if (ctx.player.x < targetNpc.x) targetNpc.direction = 'LEFT';
        else if (ctx.player.y > targetNpc.y) targetNpc.direction = 'DOWN';
        else if (ctx.player.x > targetNpc.x) targetNpc.direction = 'RIGHT';
        else if (ctx.player.y < targetNpc.y) targetNpc.direction = 'UP';

        let shoved = false;
        ctx.openDialogue(
          [
            '<……>\nSo this is the famous ELM POKéMON LAB…',
            '…What are you staring at?',
            '*BUMP!* The boy shoved you away from the window!',
          ],
          '❓ RIVAL ???',
          () => {
            if (!shoved) {
              shoved = true;
              executeShove();
            }
            setTimeout(() => {
              targetNpc.direction = 'RIGHT';
            }, 450);
          }
        );
        return true;
      },
    },

    // 7. Police Officer Interrogation & Rival Naming in Elm's Lab
    {
      actions: ['POLICE_RIVAL_NAMING'],
      npcIds: ['lab_police_officer'],
      handler: (targetNpc, _map, ctx) => {
        ctx.openDialogue(
          [
            'OFFICER: I heard a POKéMON was stolen here…',
            'Apparently, it was a young male with long, red hair…',
            'What? You battled a trainer like that? Did you happen to get his name?',
          ],
          '👮 POLICE OFFICER',
          () => {
            ctx.openNamingModal('👮 RIVAL IDENTIFICATION', ctx.getRivalName?.() || 'SILVER', (chosenName) => {
              ctx.setRivalName?.(chosenName);
              ctx.storyFlags.add('EVENT_RIVAL_NAMED');
              if (ctx.npcsByMap.elms_lab) {
                ctx.npcsByMap.elms_lab = ctx.npcsByMap.elms_lab.filter((n) => n.id !== 'lab_police_officer');
              }
              ctx.openDialogue(
                [
                  `OFFICER: OK! So ${chosenName} was his name. Thanks for helping our investigation!`,
                  'The police officer tipped his hat and hurried out of the lab!',
                ],
                '👮 POLICE OFFICER',
                () => {
                  ctx.saveCurrentGame();
                  ctx.showToast(`👮 Suspect identified as ${chosenName}!`);
                }
              );
            });
          }
        );
        return true;
      },
    },

    // 8. Prof. Elm Lab Starter Dialogue & Errands
    {
      npcIds: ['elm_npc'],
      handler: (targetNpc, _map, ctx) => {
        ctx.missionManager.reconcileStarterState(ctx.playerParty, ctx.storyFlags);
        const elmDialogue = resolveElmLabDialogue(ctx.playerName, ctx.storyFlags, ctx.playerParty);

        if (elmDialogue.action === 'PROMPT_STARTER') {
          ctx.openDialogue(elmDialogue.pages, targetNpc.speaker);
          return true;
        }

        if (elmDialogue.action === 'PROMPT_POLICE') {
          ctx.openDialogue(elmDialogue.pages, '🔬 PROF. ELM');
          return true;
        }

        if (elmDialogue.action === 'DELIVER_MYSTERY_EGG') {
          ctx.storyFlags.add('EVENT_GAVE_MYSTERY_EGG_TO_ELM');
          if (ctx.inventory.keyItems) {
            ctx.inventory.keyItems = ctx.inventory.keyItems.filter((k) => k !== 'MYSTERY EGG');
          }
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            elmDialogue.pages,
            '🔬 PROF. ELM',
            () => {
              ctx.inventory.balls['poke-ball'] = (ctx.inventory.balls['poke-ball'] || 0) + 5;
              ctx.missionManager.checkStoryFlags(ctx.storyFlags);
              ctx.openDialogue(
                [
                  `ELM'S AIDE: ${ctx.playerName}! Take these POKé BALLS for your journey!`,
                  'Wild POKéMON can be caught once you weaken them in battle!',
                ],
                "👨‍🔬 ELM'S AIDE",
                () => {
                  ctx.saveCurrentGame();
                  ctx.showToast('🎒 Received 5 POKé BALLS!');
                }
              );
            }
          );
          return true;
        }

        if (elmDialogue.action === 'HEAL_AND_SAVE') {
          ctx.openDialogue(elmDialogue.pages, '🔬 PROF. ELM', () => {
            ctx.healPlayerParty(false);
            ctx.saveCurrentGame();
            ctx.playFieldRestAnimation();
          });
          return true;
        }

        return false;
      },
    },

    // 9. Mom: New Bark Town Home Base
    {
      npcIds: ['mom_npc'],
      handler: (_targetNpc, _map, ctx) => {
        let momPages: string[];
        const hasStarter = ctx.storyFlags.has('starter_chosen') || ctx.playerParty.length > 0;
        const hasEgg = ctx.storyFlags.has('HAS_MYSTERY_EGG');
        const deliveredEgg = ctx.storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM');
        const badgeCount = ctx.inventory.badges.length;

        if (!hasStarter) {
          momPages = [
            `Oh, ${ctx.playerName}…! Your POKéMON GEAR is back from the repair shop.`,
            "PROF. ELM was looking for you. He said he had a favor to ask. You will go over to the LAB right now, won't you?",
          ];
        } else if (hasEgg && !deliveredEgg) {
          momPages = [
            `Oh, ${ctx.playerName}! Did you hear? Someone broke into PROF. ELM's LAB!`,
            'PROF. ELM is waiting for you! Go see him right away, dear!',
          ];
        } else if (!deliveredEgg) {
          momPages = [
            'So, PROF. ELM gave you a POKéMON! How cute!',
            'Mr. POKéMON lives just north of CHERRYGROVE CITY. Take care on your errand!',
            'Rest up for a moment, sweetheart! Your POKéMON are looking fit and energized!',
          ];
        } else {
          const badgeLine =
            badgeCount > 0
              ? `Wow, look at your TRAINER CARD! You have already earned ${badgeCount} GYM ${badgeCount === 1 ? 'BADGE' : 'BADGES'}! I am so proud of you, sweetheart!`
              : 'Taking on the JOHTO GYM LEADERS sounds like such a grand journey! I am cheering for you!';
          momPages = [
            `Hi, ${ctx.playerName}! Welcome home! You are trying very hard, I see.`,
            badgeLine,
            'Rest up for a moment, darling! A good rest will do you and your POKéMON a world of good!',
          ];
        }

        ctx.openDialogue(momPages, '🏠 MOM', () => {
          if (hasStarter) {
            ctx.healPlayerParty(false);
            ctx.saveCurrentGame();
            ctx.playFieldRestAnimation();
          }
        });
        return true;
      },
    },

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
