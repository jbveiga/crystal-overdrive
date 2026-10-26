import type { MapData } from '../../types/game';
import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionContext, NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * GymLeaderInteractions — Handlers for Johto & Kanto Gym Leaders, Elite Four & Champions
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
          ctx.openDialogue(
            ["WHITNEY: …Sniffle… …Waaaaaaah! What a meanie! Leave me alone! Waaaaah!"],
            targetNpc.speaker
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
          ['WHITNEY: The PLAINBADGE proves your strength! Normal-type POKéMON have so much versatility. Keep believing in your team!'],
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
        if (!ctx.storyFlags.has('jasmine_defeated')) {
          if (!ctx.storyFlags.has('amphy_cured')) {
            ctx.openDialogue(
              ["JASMINE: …I'm sorry. I must care for Amphy at the LIGHTHOUSE. Please meet me there…"],
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
        }
        return false;
      },
    },

    // 8. Mahogany Gym: Pryce
    {
      actions: ['PRYCE_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('pryce_defeated')) {
          ctx.openDialogue(
            [
              "PRYCE: POKéMON and humans both grow stronger as they endure life's bitter cold.",
              'Continue striving with an unyielding spirit!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : ['PRYCE: In my 60 years of training, I have seen it all. Let me show you the power of ice!'],
          targetNpc.speaker,
          () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Pryce',
              trainerTeam: team,
              onVictory: () => {
                ctx.defeatedTrainers.add('pryce');
                ctx.storyFlags.add('pryce_defeated');
                if (!ctx.inventory.badges.includes('glacier')) ctx.inventory.badges.push('glacier');
                if (!ctx.inventory.tms.includes('TM16')) ctx.inventory.tms.push('TM16');
                ctx.audioManager.playSfx?.('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                ctx.missionManager.completeMission('M08');
                ctx.openDialogue(
                  ['PRYCE: Your strong bond is clear. Take the GLACIERBADGE and TM16 ICY WIND!'],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast('❄️ Received GLACIER BADGE & TM16 from Leader Pryce!');
                  }
                );
              },
            });
          }
        );
        return true;
      },
    },

    // 9. Blackthorn Gym: Clair
    {
      actions: ['CLAIR_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('dragon_elder_quiz_passed') || ctx.storyFlags.has('clair_conceded')) {
          ctx.openDialogue(
            ["CLAIR: You passed the DRAGON ELDER's test and earned the RISINGBADGE! Good luck at the POKéMON LEAGUE!"],
            targetNpc.speaker
          );
          return true;
        }
        if (ctx.storyFlags.has('clair_defeated')) {
          ctx.openDialogue(
            [
              "CLAIR: I won't acknowledge this loss yet!",
              "Go behind the GYM into the DRAGON'S DEN and pass the DRAGON ELDER's trial if you want the RISINGBADGE!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : ['CLAIR: I am the best dragon master! Not even you can defeat me!'],
          targetNpc.speaker,
          () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Clair',
              trainerTeam: team,
              onVictory: () => {
                ctx.defeatedTrainers.add('clair');
                ctx.storyFlags.add('clair_defeated');
                ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                ctx.openDialogue(
                  [
                    "CLAIR: I... I lost?! But... I won't acknowledge it!",
                    "I refuse to hand over the BADGE until you take the DRAGON USER's test!",
                    "Enter the DRAGON'S DEN behind the GYM and pass the DRAGON ELDER's trial!",
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast("🐉 Defeated Leader Clair! Enter Dragon's Den for the Elder's trial!");
                  }
                );
              },
            });
          }
        );
        return true;
      },
    },

    // 10. Kanto Gym Leaders (Brock, Misty, Surge, Erika, Janine, Sabrina, Blaine, Blue)
    {
      actions: [
        'BROCK_EVENT',
        'MISTY_EVENT',
        'SURGE_EVENT',
        'ERIKA_EVENT',
        'JANINE_EVENT',
        'SABRINA_EVENT',
        'BLAINE_EVENT',
        'BLUE_EVENT',
      ],
      handler: (targetNpc, _map, ctx) => {
        const kantoLeaderConfigs: Record<
          string,
          { flag: string; badge: string; tm: string; toast: string; dialogue: string; fallbackChallenge: string }
        > = {
          BROCK_EVENT: {
            flag: 'brock_defeated',
            badge: 'boulder',
            tm: 'TM34',
            toast: '🪨 Received BOULDER BADGE & TM34 from Leader Brock!',
            dialogue: 'BROCK: My rock-hard willpower was shaken! Take the BOULDERBADGE and TM34 ROLLOUT!',
            fallbackChallenge: 'BROCK: I am Brock, the Pewter Gym Leader! My rock Pokémon are solid defense!',
          },
          MISTY_EVENT: {
            flag: 'misty_defeated',
            badge: 'cascade',
            tm: 'TM03',
            toast: '💧 Received CASCADE BADGE & TM03 from Leader Misty!',
            dialogue: 'MISTY: You really are an exceptional trainer! Take the CASCADEBADGE and TM03 WATER PULSE!',
            fallbackChallenge: 'MISTY: I am Misty, the world-famous water Pokémon master!',
          },
          SURGE_EVENT: {
            flag: 'surge_defeated',
            badge: 'thunder',
            tm: 'TM25',
            toast: '⚡ Received THUNDER BADGE & TM25 from Leader Lt. Surge!',
            dialogue: 'LT. SURGE: Ten-hut! You zapped right through my defenses! Take the THUNDERBADGE and TM25 THUNDER!',
            fallbackChallenge: 'LT. SURGE: Hey kid, what do you think you are doing? Electric Pokémon will shock you!',
          },
          ERIKA_EVENT: {
            flag: 'erika_defeated',
            badge: 'rainbow',
            tm: 'TM19',
            toast: '🌸 Received RAINBOW BADGE & TM19 from Leader Erika!',
            dialogue: 'ERIKA: Oh, what a splendid battle. You deserve this RAINBOWBADGE and TM19 GIGA DRAIN.',
            fallbackChallenge: "ERIKA: Hello... Lovely weather, isn't it? I only study grass-type Pokémon.",
          },
          JANINE_EVENT: {
            flag: 'janine_defeated',
            badge: 'soul',
            tm: 'TM06',
            toast: '🥷 Received SOUL BADGE & TM06 from Leader Janine!',
            dialogue: 'JANINE: Fooled by my poison techniques? No, you saw right through them! Take the SOULBADGE and TM06 TOXIC!',
            fallbackChallenge: 'JANINE: Fufufu! I am the poison ninja master Janine! Try to hit what you cannot see!',
          },
          SABRINA_EVENT: {
            flag: 'sabrina_defeated',
            badge: 'marsh',
            tm: 'TM29',
            toast: '🔮 Received MARSH BADGE & TM29 from Leader Sabrina!',
            dialogue: 'SABRINA: I foresaw your victory... Take the MARSHBADGE and TM29 PSYCHIC.',
            fallbackChallenge: 'SABRINA: I knew you would challenge me. Psychic power cannot be overcome so easily.',
          },
          BLAINE_EVENT: {
            flag: 'blaine_defeated',
            badge: 'volcano',
            tm: 'TM38',
            toast: '🌋 Received VOLCANO BADGE & TM38 from Leader Blaine!',
            dialogue: 'BLAINE: Hah! My fiery spirit was extinguished! Take the VOLCANOBADGE and TM38 FIRE BLAST!',
            fallbackChallenge: 'BLAINE: Hah! I am Blaine, the red-hot quiz master of Cinnabar!',
          },
          BLUE_EVENT: {
            flag: 'blue_defeated',
            badge: 'earth',
            tm: 'TM26',
            toast: '🌍 Received EARTH BADGE & TM26 from Leader Blue!',
            dialogue: 'BLUE: Unbelievable... You really are something else! Take the EARTHBADGE and TM26 EARTHQUAKE!',
            fallbackChallenge: 'BLUE: Yo! You finally made it to the Viridian Gym. Show me what Johto trainers are made of!',
          },
        };

        const leaderConfig = kantoLeaderConfigs[targetNpc.action || ''];
        if (leaderConfig && !ctx.storyFlags.has(leaderConfig.flag)) {
          ctx.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [leaderConfig.fallbackChallenge],
            targetNpc.speaker,
            () => {
              const team = ctx.buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              ctx.triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Gym Leader',
                trainerTeam: team,
                onVictory: () => {
                  ctx.defeatedTrainers.add(targetNpc.trainerId || leaderConfig.flag);
                  ctx.storyFlags.add(leaderConfig.flag);
                  if (!ctx.inventory.badges.includes(leaderConfig.badge)) ctx.inventory.badges.push(leaderConfig.badge);
                  if (!ctx.inventory.tms.includes(leaderConfig.tm)) ctx.inventory.tms.push(leaderConfig.tm);
                  ctx.audioManager.playSfx?.('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  ctx.openDialogue(
                    [leaderConfig.dialogue],
                    targetNpc.speaker,
                    () => {
                      ctx.saveCurrentGame();
                      ctx.showToast(leaderConfig.toast);
                    }
                  );
                },
              });
            }
          );
          return true;
        }
        return false;
      },
    },

    // 11. Elite Four, Champion Lance & Red
    {
      actions: [
        'E4_EVENT',
        'CHAMPION_LANCE_EVENT',
        'E4_WILL_EVENT',
        'E4_KOGA_EVENT',
        'E4_BRUNO_EVENT',
        'E4_KAREN_EVENT',
        'CHAMPION_EVENT',
        'RED_EVENT',
      ],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has(`${targetNpc.trainerId}_defeated`)) {
          ctx.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0 ? targetNpc.challengePages : ['Prepare yourself!'],
            targetNpc.speaker,
            () => {
              const team = ctx.buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              ctx.triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Elite Trainer',
                trainerTeam: team,
                onVictory: () => {
                  ctx.defeatedTrainers.add(targetNpc.trainerId || 'e4');
                  ctx.storyFlags.add(`${targetNpc.trainerId}_defeated`);
                  if (targetNpc.trainerId === 'karen') {
                    ctx.storyFlags.add('karen_defeated');
                  }
                  ctx.audioManager.playSfx?.('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  const champion = targetNpc.trainerId === 'lance';
                  if (champion) {
                    ctx.storyFlags.add('lance_defeated');
                    ctx.storyFlags.add('champion_lance_defeated');
                    ctx.storyFlags.add('champion_defeated');
                    ctx.addOverworldItemToInventory('ss-ticket');
                    ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                    ctx.missionManager.completeMission('M12');
                  }
                  ctx.openDialogue(
                    [
                      champion
                        ? 'LANCE: ...It is over. You and your Pokémon possess unbreakable spirit and mutual trust! Welcome to the HALL OF FAME! You are the new POKéMON LEAGUE CHAMPION! Please accept this S.S. AQUA TICKET for your travels to Kanto!'
                        : `${targetNpc.speaker}: You have defeated me! Proceed to the next chamber!`,
                    ],
                    targetNpc.speaker,
                    () => {
                      ctx.saveCurrentGame();
                      ctx.showToast(
                        champion
                          ? '👑 INDUCTED INTO THE HALL OF FAME! YOU ARE THE LEAGUE CHAMPION!'
                          : `⭐ Defeated ${targetNpc.trainerName || targetNpc.speaker}!`
                      );
                    }
                  );
                },
              });
            }
          );
          return true;
        }
        return false;
      },
    },

    // 12. Stadium Host Interaction
    {
      actions: ['STADIUM_HOST_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        ctx.openDialogue(
          [
            'STADIUM HOST: Welcome to the POKéMON STADIUM Arena!',
            'Here trainers engage in standard and double battles under special rules.',
          ],
          targetNpc.speaker,
          () => {
            if (targetNpc.trainerId) {
              ctx.launchStadiumChallenge(targetNpc.trainerId, 'prime_cup');
            }
          }
        );
        return true;
      },
    },
  ];
}
