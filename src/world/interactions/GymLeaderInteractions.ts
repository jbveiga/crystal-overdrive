/**
 * @fileoverview GymLeaderInteractions domain module implementation.
 * @module world/interactions/GymLeaderInteractions
 * @role GymLeaderInteractions Component
 * @exports getGymLeaderInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-216: Implementation | L217-432: Handlers & Exports
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { getKantoAndLeagueInteractions } from './KantoAndLeagueInteractions';
import { getMahoganyGymInteractions } from './MahoganyGymInteractions';

export { getKantoAndLeagueInteractions, getMahoganyGymInteractions };

/**
 * GymLeaderInteractions — Handlers for Early & Mid Johto Gym Leaders (Falkner, Bugsy, Whitney, Morty, Chuck, Jasmine)
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getGymLeaderInteractions(): NpcInteractionRegistration[] {
  return [
    // 1. Violet Gym: Falkner
    {
      actions: ['FALKNER_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('falkner_defeated')) {
          ctx.openDialogue(
            [
              "FALKNER: A trainer's real strength comes from their devotion to their POKéMON. Keep soaring toward the POKéMON LEAGUE!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        const introPages =
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : [
                "FALKNER: I'm FALKNER, the VIOLET CITY POKéMON GYM leader! People say you can clip flying-type wings with a jolt of electricity… I won't allow such insults to bird POKéMON! I'll show you the real power of the magnificent bird POKéMON!",
              ];
        ctx.openDialogue(introPages, targetNpc.speaker, () => {
          const team = ctx.buildTrainerTeamInstances(targetNpc);
          if (team.length === 0) return;
          ctx.triggerBattle(team[0], {
            isTrainer: true,
            isGymLeader: true,
            trainerName: targetNpc.trainerName || 'Leader Falkner',
            trainerTeam: team,
            onVictory: () => {
              ctx.defeatedTrainers.add('falkner');
              ctx.storyFlags.add('falkner_defeated');
              ctx.storyFlags.add('CAN_USE_FLASH');
              if (!ctx.inventory.badges.includes('zephyr')) ctx.inventory.badges.push('zephyr');
              if (!ctx.inventory.tms.includes('TM31')) ctx.inventory.tms.push('TM31');
              ctx.missionManager.checkStoryFlags(ctx.storyFlags);
              ctx.audioManager.playSfx?.('sfx_badge_get');
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  "FALKNER: …Darn! My dad's cherished bird POKéMON… All right. Take this. It's the official POKéMON LEAGUE ZEPHYRBADGE!",
                  "FALKNER: The ZEPHYRBADGE raises the ATTACK power of POKéMON and enables them to use FLASH anytime in dark caves! Here—take this too. It's TM31 MUD-SLAP!",
                ],
                targetNpc.speaker,
                () => {
                  ctx.saveCurrentGame();
                  ctx.showToast('🦅 Received ZEPHYR BADGE & TM31 MUD-SLAP from Leader Falkner!');
                }
              );
            },
          });
        });
        return true;
      },
    },

    // 2. Azalea Gym Guide
    {
      npcIds: ['azalea_gym_guide'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('bugsy_defeated')) {
          ctx.openDialogue(
            [
              'GYM GUIDE: Well done! That was a great clash of talented young trainers.',
              'With people like you, the future of POKéMON is bright!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          [
            "GYM GUIDE: Yo, challenger! BUGSY's young, but his knowledge of bug POKéMON is for real.",
            "Let's see… Bug POKéMON don't like fire. Flying-type moves are super-effective too.",
          ],
          targetNpc.speaker
        );
        return true;
      },
    },

    // 3. Azalea Gym: Bugsy
    {
      actions: ['BUGSY_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('bugsy_defeated')) {
          ctx.openDialogue(
            ['BUGSY: Bug POKéMON are deep and complex. There are so many mysteries to unravel!'],
            targetNpc.speaker
          );
          return true;
        }
        const introPages =
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : [
                "BUGSY: I'm BUGSY! I never lose when it comes to bug POKéMON. My research is going to make me the authority on bug POKéMON! Let me demonstrate what I've learned from my studies!",
              ];
        ctx.openDialogue(introPages, targetNpc.speaker, () => {
          const team = ctx.buildTrainerTeamInstances(targetNpc);
          if (team.length === 0) return;
          ctx.triggerBattle(team[0], {
            isTrainer: true,
            isGymLeader: true,
            trainerName: targetNpc.trainerName || 'Leader Bugsy',
            trainerTeam: team,
            onVictory: () => {
              ctx.defeatedTrainers.add('bugsy');
              ctx.storyFlags.add('bugsy_defeated');
              ctx.storyFlags.add('CAN_USE_CUT');
              if (!ctx.inventory.badges.includes('hive')) ctx.inventory.badges.push('hive');
              if (!ctx.inventory.tms.includes('TM49')) ctx.inventory.tms.push('TM49');
              ctx.missionManager.checkStoryFlags(ctx.storyFlags);
              ctx.missionManager.completeMission('M03');
              ctx.audioManager.playSfx?.('sfx_badge_get');
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  "BUGSY: Whoa, amazing! You're an expert on POKéMON! My research isn't complete yet… OK, you win. Take this BADGE.",
                  `${ctx.playerName} received the HIVEBADGE from BUGSY!`,
                  "BUGSY: If you have the HIVEBADGE, POKéMON up to Lv. 30 will obey you without question, even traded ones. POKéMON that know CUT will also be able to use it outside of battle to chop down small trees anytime! Here, I also want you to have this—TM49 FURY CUTTER!",
                ],
                targetNpc.speaker,
                () => {
                  ctx.saveCurrentGame();
                  ctx.showToast('🐞 Received HIVE BADGE & TM49 FURY CUTTER from Leader Bugsy!');
                }
              );
            },
          });
        });
        return true;
      },
    },

    // 4. Goldenrod Gym: Whitney & Lass Bridget
    {
      actions: ['WHITNEY_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('whitney_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  "WHITNEY: Hi! I'm WHITNEY! Everyone was into POKéMON, so I got into it too! POKéMON are super cute! You think you can beat mine? Don't cry if you lose!",
                ];
          ctx.openDialogue(introPages, targetNpc.speaker, () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Whitney',
              trainerTeam: team,
              onVictory: () => {
                ctx.defeatedTrainers.add('whitney');
                ctx.storyFlags.add('whitney_defeated');
                ctx.openDialogue(
                  [
                    "WHITNEY: …Sniff… …Waaaaaaah! What a meanie! I lost! You're horrible!",
                    "WHITNEY: …Sob… I can't believe I lost! Leave me alone! Waaaaah!",
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                  }
                );
              },
            });
          });
          return true;
        }

        if (!ctx.storyFlags.has('whitney_calmed')) {
          ctx.storyFlags.add('whitney_calmed');
          ctx.openDialogue(
            [
              "WHITNEY: …Sniffle… …Waaaaaaah! What a meanie! Leave me alone! Waaaaah!",
              "LASS BRIDGET: Oh, no. You made WHITNEY cry! It's OK, she'll stop soon. She always cries when she loses.",
              "Go on and talk to her again! She should be calmed down now.",
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
            }
          );
          return true;
        }

        if (!ctx.storyFlags.has('plain_badge_received')) {
          ctx.storyFlags.add('plain_badge_received');
          ctx.storyFlags.add('ENGINE_PLAINBADGE');
          if (!ctx.inventory.badges.includes('plain')) ctx.inventory.badges.push('plain');
          if (!ctx.inventory.tms.includes('TM45')) ctx.inventory.tms.push('TM45');
          ctx.audioManager.playSfx?.('sfx_badge_get');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              "WHITNEY: …Sniff… …Sigh… It's okay. You won fair and square. Take the PLAINBADGE!",
              `${ctx.playerName} received the PLAINBADGE from WHITNEY!`,
              "WHITNEY: The PLAINBADGE boosts your POKéMON's SPEED stat! It also lets your POKéMON use STRENGTH outside of battle. Oh, and take this too—it's TM45 ATTRACT!",
              `${ctx.playerName} received TM45 ATTRACT!`,
              'WHITNEY: Normal-type POKéMON have so much versatility. Keep believing in your team!',
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🎀 Received PLAIN BADGE & TM45 ATTRACT from Leader Whitney!');
            }
          );
          return true;
        }

        ctx.openDialogue(
          [
            'WHITNEY: Ah, that was a good cry! Come for a visit again! Bye-bye!',
            'Normal-type POKéMON have so much versatility. Keep believing in your team!',
          ],
          targetNpc.speaker
        );
        return true;
      },
    },
    {
      npcIds: ['lass_bridget'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('whitney_defeated')) {
          if (!ctx.storyFlags.has('whitney_calmed')) {
            ctx.storyFlags.add('whitney_calmed');
            ctx.openDialogue(
              [
                'LASS BRIDGET: Oh, no. You made WHITNEY cry.',
                "It's OK. She'll stop soon. She always cries when she loses.",
                'Go on back and talk to her now. She should be calmed down.',
              ],
              targetNpc.speaker
            );
            return true;
          }
          ctx.openDialogue(
            ["LASS BRIDGET: Give WHITNEY a moment to collect herself. She's just sensitive about losing!"],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },

    // 5. Ecruteak Gym: Guide & Morty
    {
      npcIds: ['ecruteak_gym_guide'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('beasts_awakened')) {
          ctx.openDialogue(
            [
              'Yo! CHAMP in the making!',
              'LEADER MORTY is not here right now! He went to the BURNED TOWER in the northwest of town.',
              'The rumors say the ancient legendary beasts have stirred beneath the charred beams!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },
    {
      actions: ['MORTY_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('beasts_awakened')) {
          ctx.openDialogue(
            [
              'MORTY: The sacred fire of the BURNED TOWER must not be disturbed without pure purpose.',
              'I am contemplating the legendary beasts. Please excuse me for now.',
            ],
            targetNpc.speaker
          );
          return true;
        }
        if (!ctx.storyFlags.has('morty_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  'MORTY: Where is the legendary rainbow bird? I have meditated with ghost POKéMON in solitude waiting for its arrival. I see a shadow of greatness within you… Let us test your spirit!',
                ];
          ctx.openDialogue(introPages, targetNpc.speaker, () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Morty',
              trainerTeam: team,
              onVictory: () => {
                ctx.defeatedTrainers.add('morty');
                ctx.storyFlags.add('morty_defeated');
                if (!ctx.inventory.badges.includes('fog')) ctx.inventory.badges.push('fog');
                if (!ctx.inventory.tms.includes('TM30')) ctx.inventory.tms.push('TM30');
                ctx.audioManager.playSfx?.('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.openDialogue(
                  [
                    'MORTY: I see… I was not the chosen one. Your bond with your POKéMON has guided you beyond my spectral realm. Take the official POKéMON LEAGUE FOGBADGE!',
                    'MORTY: By holding the FOGBADGE, POKéMON up to Lv. 50 will obey your every command. Your POKéMON will also be able to use SURF to cross open waters! Take this TM30 SHADOW BALL as well!',
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast('👻 Received FOG BADGE & TM30 SHADOW BALL from Leader Morty!');
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

    // 6. Cianwood Gym: Chuck
    {
      actions: ['CHUCK_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('chuck_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  'CHUCK: WAHAHA! So you’ve come this far! We train day and night beneath the raging waterfalls of Cianwood! My roaring fists and my partners will shatter any defense! Prepare yourself!',
                ];
          ctx.openDialogue(introPages, targetNpc.speaker, () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Chuck',
              trainerTeam: team,
              onVictory: () => {
                ctx.defeatedTrainers.add('chuck');
                ctx.storyFlags.add('chuck_defeated');
                if (!ctx.inventory.badges.includes('storm')) ctx.inventory.badges.push('storm');
                if (!ctx.inventory.tms.includes('TM01')) ctx.inventory.tms.push('TM01');
                ctx.audioManager.playSfx?.('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.openDialogue(
                  [
                    'CHUCK: WAHAHA! I lost! You broke right through our defenses! Here is the STORMBADGE!',
                    'The STORMBADGE allows your POKéMON to use FLY outside battle, and all POKéMON up to Lv. 70 will obey you! Also take this TM01 DYNAMICPUNCH!',
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast('🥊 Received STORM BADGE & TM01 DYNAMICPUNCH from Leader Chuck!');
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

    // 7. Olivine Gym: Jasmine
    {
      actions: ['JASMINE_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('jasmine_defeated')) {
          ctx.openDialogue(
            ["JASMINE: …Um… I don't know how to say this, but good luck on your journey!"],
            targetNpc.speaker
          );
          return true;
        }
        if (!ctx.storyFlags.has('amphy_cured')) {
          ctx.openDialogue(
            ["JASMINE: …I cannot battle now. Amphy is terribly ill at the top of the LIGHTHOUSE. Please… someone find help in CIANWOOD across the sea…"],
            targetNpc.speaker
          );
          return true;
        }
        const introPages =
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : [
                'JASMINE: …Thank you for your help at the LIGHTHOUSE. But this is different. As a GYM LEADER, I will use my full power. POKéMON of steel… Clad in diamond-hard scales! Steelix, let us begin!',
              ];
        ctx.openDialogue(introPages, targetNpc.speaker, () => {
          const team = ctx.buildTrainerTeamInstances(targetNpc);
          if (team.length === 0) return;
          ctx.triggerBattle(team[0], {
            isTrainer: true,
            isGymLeader: true,
            trainerName: targetNpc.trainerName || 'Leader Jasmine',
            trainerTeam: team,
            onVictory: () => {
              ctx.defeatedTrainers.add('jasmine');
              ctx.storyFlags.add('jasmine_defeated');
              if (!ctx.inventory.badges.includes('mineral')) ctx.inventory.badges.push('mineral');
              if (!ctx.inventory.tms.includes('TM23')) ctx.inventory.tms.push('TM23');
              ctx.audioManager.playSfx?.('sfx_badge_get');
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  'JASMINE: …You are truly strong. In accordance with LEAGUE rules, I confer upon you the MINERALBADGE!',
                  'The MINERALBADGE raises the DEFENSE of all your POKéMON and allows them to navigate waterfalls. Take this TM23 IRON TAIL as well!',
                ],
                targetNpc.speaker,
                () => {
                  ctx.saveCurrentGame();
                  ctx.showToast('🔩 Received MINERAL BADGE & TM23 IRON TAIL from Leader Jasmine!');
                }
              );
            },
          });
        });
        return true;
      },
    },

    // 7b. Olivine Gym: Gym Guide
    {
      npcIds: ['olivine_gym_guide'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('jasmine_defeated')) {
          ctx.openDialogue(['GYM GUIDE: That was awesome! The steel-type, huh? That was a close encounter of an unknown kind!'], targetNpc.speaker);
          return true;
        }
        if (!ctx.storyFlags.has('amphy_cured')) {
          ctx.openDialogue(["GYM GUIDE: Yo! CHAMP in the making! JASMINE, the GYM LEADER, is at the LIGHTHOUSE. She's looking after a sick POKéMON. A strong trainer has to be compassionate too."], targetNpc.speaker);
          return true;
        }
        ctx.openDialogue(
          [
            'Yo! CHAMP in the making!',
            'Jasmine specializes in the newly discovered STEEL type!',
            'Steel Pokémon have impenetrable defenses against Normal, Flying, Rock, Bug, Ghost, Steel, Grass, Psychic, Ice, and Dragon!',
            'Strike them with FIRE, FIGHTING, or GROUND attacks to crack their armor!',
          ],
          targetNpc.speaker
        );
        return true;
      },
    },
    ...getMahoganyGymInteractions(),
    ...getKantoAndLeagueInteractions(),
  ];
}
