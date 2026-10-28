/**
 * @fileoverview GoldenrodAndRoute34Interactions domain module implementation.
 * @module world/interactions/GoldenrodAndRoute34Interactions
 * @role GoldenrodAndRoute34Interactions Component
 * @exports getGoldenrodAndRoute34Interactions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-305: Implementation | L306-610: Handlers & Exports
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { isContestDay } from '../BugContestManager';

/**
 * GoldenrodAndRoute34Interactions — Day-Care, Bike Shop, Florist, Bill, Name Rater,
 * Dept. Store Elevator, Sudowoodo, Rock Smash Guy, Quick Claw & Bug-Catching Contest.
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getGoldenrodAndRoute34Interactions(): NpcInteractionRegistration[] {
  return [
    // 1. Day-Care Man: Odd Egg Gift
    {
      npcIds: ['day_care_man'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('HAS_ODD_EGG')) {
          if (ctx.playerParty.length >= 6) {
            ctx.openDialogue(
              [
                "DAY-CARE MAN: I'm the DAY-CARE MAN! We were shocked to find an EGG in the meadow!",
                "You've no room for this in your party. Make room using a PC and come right back!",
              ],
              targetNpc.speaker
            );
            return true;
          }

          const oddEgg = PokemonFactory.createOddEgg();
          ctx.playerParty.push(oddEgg);
          ctx.storyFlags.add('HAS_ODD_EGG');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              "DAY-CARE MAN: I'm the DAY-CARE MAN! We were shocked to find a strange EGG in the meadow!",
              "Wouldn't you like this EGG? Please take good care of it!",
              `${ctx.playerName} received the ODD EGG!`,
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🥚 Received the ODD EGG from the Day-Care Man!');
            }
          );
          return true;
        }

        ctx.openDialogue(
          [
            'DAY-CARE MAN: Are your POKéMON growing strong?',
            'Raising POKéMON from EGGS creates unbreakable bonds!',
          ],
          targetNpc.speaker
        );
        return true;
      },
    },

    // 2. Day-Care Lady: Day-Care Management Overlay
    {
      npcIds: ['day_care_lady'],
      handler: (_targetNpc, _map, ctx) => {
        ctx.openDayCareModal();
        return true;
      },
    },

    // 3. Officer Keith: Night-time only challenge guard
    {
      npcIds: ['officer_keith'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.gameClock.getTimeOfDay() !== 'NIGHT') {
          ctx.openDialogue(
            [
              "OFFICER KEITH: I'm on patrol for suspicious individuals.",
              "It's safe now, but trouble stirs after dark.",
            ],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },

    // 4. Goldenrod Flower Shop: Squirtbottle Gift
    {
      npcIds: ['florist'],
      handler: (targetNpc, _map, ctx) => {
        if (
          ctx.storyFlags.has('has_squirtbottle') ||
          ctx.storyFlags.has('HAS_SQUIRTBOTTLE') ||
          ctx.storyFlags.has('EVENT_GOT_SQUIRTBOTTLE') ||
          Boolean(ctx.inventory.keyItems?.some((k) => k.toLowerCase() === 'squirtbottle'))
        ) {
          ctx.openDialogue(
            ['FLORIST: Did you try using that SQUIRTBOTTLE on the weird tree on ROUTE 36?'],
            targetNpc.speaker
          );
          return true;
        }
        if (
          !ctx.inventory.badges.includes('plain') &&
          !ctx.storyFlags.has('plain_badge_received') &&
          !ctx.storyFlags.has('ENGINE_PLAINBADGE')
        ) {
          ctx.openDialogue(
            [
              'FLORIST: Have you seen that weird, wiggling tree on ROUTE 36? Whenever anyone splashes water on it, it gets furious!',
              "I have a SQUIRTBOTTLE here, but it's dangerous outside. I can only lend it to a certified trainer who has conquered the GOLDENROD GYM and earned the PLAINBADGE!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.storyFlags.add('has_squirtbottle');
        ctx.storyFlags.add('HAS_SQUIRTBOTTLE');
        ctx.storyFlags.add('EVENT_GOT_SQUIRTBOTTLE');
        if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
        if (!ctx.inventory.keyItems.some((k) => k.toLowerCase() === 'squirtbottle')) {
          ctx.inventory.keyItems.push('SQUIRTBOTTLE');
        }
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            'FLORIST: Wow! You earned the PLAINBADGE from WHITNEY! You must be a really skilled trainer!',
            'Take this SQUIRTBOTTLE! Use it on that strange wiggling tree on ROUTE 36 and see what happens!',
            `${ctx.playerName} received the SQUIRTBOTTLE!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('💧 Received SQUIRTBOTTLE from Goldenrod Flower Shop!');
          }
        );
        return true;
      },
    },

    // 5. Goldenrod Bike Shop: Bicycle Loan
    {
      npcIds: ['goldenrod_bike_shop_clerk', 'bike_shop_owner'],
      actions: ['BIKE_SHOP_CLERK'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('HAS_BICYCLE') || ctx.storyFlags.has('EVENT_GOT_BICYCLE')) {
          ctx.openDialogue(
            ['BIKE SHOP OWNER: My BICYCLES are first-rate! Keep riding it around to advertise for me!'],
            targetNpc.speaker
          );
          return true;
        }
        ctx.storyFlags.add('HAS_BICYCLE');
        ctx.storyFlags.add('EVENT_GOT_BICYCLE');
        if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
        if (!ctx.inventory.keyItems.includes('BICYCLE')) ctx.inventory.keyItems.push('BICYCLE');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            'BIKE SHOP OWNER: Welcome to MIRACLE CYCLE! I moved here from CERULEAN CITY, but nobody knows my bikes yet!',
            "Would you take one of our BICYCLES and ride it everywhere to advertise for me? It'll double your travel speed!",
            `${ctx.playerName} borrowed a BICYCLE!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('🚲 Received BICYCLE from Miracle Cycle!');
          }
        );
        return true;
      },
    },

    // 6. Bill's House: Phone Number & Eevee Gift
    {
      npcIds: ['bills_sister'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('PHONE_BILL')) {
          ctx.storyFlags.add('PHONE_BILL');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              "BILL'S SISTER: Are you a trainer? My big brother BILL created the PC Storage System!",
              'Here, take his phone number! You can call him anytime to check your Box storage status!',
              `${ctx.playerName} registered BILL in the Pokégear!`,
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('📞 Registered BILL in Pokégear!');
            }
          );
          return true;
        }
        ctx.openDialogue(
          ["BILL'S SISTER: My big brother loves EEVEE! He brought an EEVEE home for a trustworthy trainer."],
          targetNpc.speaker
        );
        return true;
      },
    },
    {
      npcIds: ['bill'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('HAS_BILLS_EEVEE') || ctx.storyFlags.has('EVENT_GOT_EEVEE')) {
          ctx.openDialogue(
            [
              'BILL: How is that EEVEE doing? It has so many potential evolutions depending on stones, happiness, and time of day!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        if (ctx.playerParty.length >= 6) {
          ctx.openDialogue(
            ['BILL: Whoa, your party is full! Make room in your party and come back!'],
            targetNpc.speaker
          );
          return true;
        }
        const eevee = PokemonFactory.create('eevee', 20);
        ctx.playerParty.push(eevee);
        ctx.storyFlags.add('HAS_BILLS_EEVEE');
        ctx.storyFlags.add('EVENT_GOT_EEVEE');
        BattleAudio.playOverworldSound('FANFARE');
        ctx.openDialogue(
          [
            'BILL: Hi, Gold! Thanks for helping out with the PC Storage System!',
            "I was given this rare EEVEE by a friend, but I think you're the right trainer to raise it!",
            `${ctx.playerName} received EEVEE (Lv. 20) from BILL!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('🦊 Received EEVEE (Lv. 20) from Bill!');
          }
        );
        return true;
      },
    },

    // 7. Goldenrod Name Rater
    {
      npcIds: ['name_rater'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.playerParty.length === 0) {
          ctx.openDialogue(
            ['NAME RATER: Hello, hello! I am the official NAME RATER! But you don’t have any POKéMON with you!'],
            targetNpc.speaker
          );
          return true;
        }
        const leadPkmn = ctx.playerParty[0];
        if (leadPkmn.isEgg) {
          ctx.openDialogue(
            ["NAME RATER: Whoa, that's just an EGG! You can't rename an EGG until it hatches!"],
            targetNpc.speaker
          );
          return true;
        }
        if (leadPkmn.originalTrainer && leadPkmn.originalTrainer !== ctx.playerName && leadPkmn.originalTrainer !== '') {
          ctx.openDialogue(
            [
              `NAME RATER: What a magnificent nickname! "${leadPkmn.nickname || leadPkmn.speciesId.toUpperCase()}" is truly impeccable! It reflects the love of its original trainer, so we shouldn't change it!`,
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          [
            `NAME RATER: Shall I evaluate the nickname of your ${leadPkmn.nickname || leadPkmn.speciesId.toUpperCase()}? It is quite fine, but let's give it an even better name!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.openNamingModal(
              '✨ POKéMON NICKNAME',
              leadPkmn.nickname || leadPkmn.speciesId.toUpperCase(),
              (newName) => {
                leadPkmn.nickname = newName.trim();
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.openDialogue(
                  [
                    `NAME RATER: Done! From now on, this POKéMON shall be known as "${leadPkmn.nickname}"! What a magnificent name!`,
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast(`✨ Nicknamed ${leadPkmn.nickname}!`);
                  }
                );
              }
            );
          }
        );
        return true;
      },
    },

    // 8. Goldenrod Radio Tower Quiz
    {
      npcIds: ['radio_rec'],
      handler: (targetNpc, _map, ctx) => {
        if (
          ctx.storyFlags.has('has_radio_card') ||
          ctx.storyFlags.has('ENGINE_RADIO_CARD') ||
          ctx.storyFlags.has('HAS_RADIO_CARD')
        ) {
          ctx.openDialogue(
            ["QUIZ RECEPTIONIST: You're all certified! Tune in to our broadcasts with your POKéGEAR's RADIO CARD anytime!"],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          [
            'QUIZ RECEPTIONIST: Welcome to GOLDENROD RADIO TOWER!',
            'We are running a special promotional campaign! Answer our 5-question radio certification quiz to earn the official RADIO CARD for your POKéGEAR!',
          ],
          targetNpc.speaker,
          () => {
            ctx.openRadioTowerQuizModal({
              onComplete: () => {
                ctx.storyFlags.add('has_radio_card');
                ctx.storyFlags.add('ENGINE_RADIO_CARD');
                ctx.storyFlags.add('HAS_RADIO_CARD');
                if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
                if (!ctx.inventory.keyItems.includes('RADIO CARD')) ctx.inventory.keyItems.push('RADIO CARD');
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.openDialogue(
                  [
                    'QUIZ RECEPTIONIST: Congratulations! You got all 5 questions right!',
                    `${ctx.playerName} received the RADIO CARD for the POKéGEAR!`,
                    'QUIZ RECEPTIONIST: You can now tune into music, news, and Pokémon talk shows anywhere across Johto!',
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast('📻 Upgraded POKéGEAR with RADIO CARD!');
                  }
                );
              },
            });
          }
        );
        return true;
      },
    },

    // 9. Goldenrod Dept. Store Elevator
    {
      actions: ['DEPT_ELEVATOR'],
      idPrefixes: ['dept_elevator'],
      handler: (targetNpc, _map, ctx) => {
        const currentM = ctx.mapManager.getCurrentMap();
        ctx.openDeptElevatorModal(currentM?.id || 'goldenrod_dept_store_1f', (targetMapId) => {
          if (targetMapId === currentM?.id) {
            ctx.openDialogue(
              ['ELEVATOR ATTENDANT: You are already on this floor!'],
              targetNpc.speaker
            );
            return;
          }
          ctx.executeWarpTransition?.({
            x: ctx.player.x,
            y: ctx.player.y,
            targetMapId,
            targetX: targetMapId === 'goldenrod_dept_store_roof' ? 13 : 2,
            targetY: targetMapId === 'goldenrod_dept_store_roof' ? 2 : 1,
            direction: 'DOWN',
          });
        });
        return true;
      },
    },

    // 10. Route 36: Sudowoodo Boss Encounter
    {
      actions: ['SUDOWOODO_EVENT'],
      npcIds: ['sudowoodo'],
      handler: (targetNpc, _map, ctx) => {
        const wiggleTree = async () => {
          const origX = targetNpc.x;
          for (const offset of [-0.14, 0.14, -0.1, 0.1, 0]) {
            targetNpc.renderX = origX + offset;
            await new Promise((r) => setTimeout(r, 55));
          }
          targetNpc.renderX = origX;
        };

        const hasSquirtbottle =
          ctx.storyFlags.has('has_squirtbottle') ||
          ctx.storyFlags.has('HAS_SQUIRTBOTTLE') ||
          ctx.storyFlags.has('EVENT_GOT_SQUIRTBOTTLE') ||
          Boolean(ctx.inventory.keyItems?.some((k) => k.toLowerCase() === 'squirtbottle'));

        if (!hasSquirtbottle) {
          BattleAudio.playOverworldSound('RUSTLE');
          wiggleTree();
          ctx.openDialogue(["It's a weird tree. It seems to wiggle when touched!"], '🌲 WEIRD TREE');
          return true;
        }

        BattleAudio.playOverworldSound('RUSTLE');
        wiggleTree();
        ctx.openDialogue(
          [
            "It's a weird tree. Use SQUIRTBOTTLE?",
            `${ctx.playerName} sprinkled water with the SQUIRTBOTTLE!`,
            'Sudowoodo hated the water! It attacked!',
          ],
          '🌲 SUDOWOODO',
          () => {
            BattleAudio.playCry('sudowoodo');
            const sudowoodoPkmn = PokemonFactory.create('sudowoodo', 20, [
              'rockthrow',
              'flail',
              'lowkick',
              'mimic',
            ]);
            ctx.triggerBattle(sudowoodoPkmn, {
              onBattleEnd: () => {
                ctx.storyFlags.add('sudowoodo_cleared');
                ctx.storyFlags.add('EVENT_FOUGHT_SUDOWOODO');
                if (ctx.npcsByMap.route_36) {
                  ctx.npcsByMap.route_36 = ctx.npcsByMap.route_36.filter((n) => n.id !== 'sudowoodo');
                }
                const mapNow = ctx.mapManager.getCurrentMap();
                if (mapNow) {
                  ctx.renderMap?.(mapNow);
                  ctx.syncMapOverworldItems?.(mapNow);
                }
                ctx.saveCurrentGame();
              },
            });
          }
        );
        return true;
      },
    },

    // 11. Route 36: Rock Smash Guy TM08 Event
    {
      actions: ['ROCK_SMASH_GUY_EVENT'],
      npcIds: ['hard_rock_guy'],
      handler: (_targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_GOT_TM08_ROCK_SMASH')) {
          ctx.openDialogue(
            [
              'That happens to be ROCK SMASH.',
              'You can shatter rocks with just a single well-aimed smack.',
              "If any rocks are in your way, just smash 'em up!",
            ],
            '🥊 ROCK SMASH GUY'
          );
          return true;
        }

        if (ctx.storyFlags.has('EVENT_FOUGHT_SUDOWOODO') || ctx.storyFlags.has('sudowoodo_cleared')) {
          ctx.openDialogue(
            ['Did you clear that wretched tree?', "I'm impressed! I want you to have this."],
            '🥊 ROCK SMASH GUY',
            () => {
              BattleAudio.playOverworldSound('FANFARE');
              ctx.addOverworldItemToInventory('TM08');
              ctx.storyFlags.add('EVENT_GOT_TM08_ROCK_SMASH');
              ctx.saveCurrentGame();
              ctx.showToast('Received TM08 (ROCK SMASH)!');
              ctx.openDialogue(
                [
                  'That happens to be ROCK SMASH.',
                  'You can shatter rocks with just a single well-aimed smack.',
                  "If any rocks are in your way, just smash 'em up!",
                ],
                '🥊 ROCK SMASH GUY'
              );
            }
          );
          return true;
        }

        ctx.openDialogue(
          [
            'Wa-hey!',
            'I was going to snap that tree with my straight-arm punch.',
            "But I couldn't! I'm a failure!",
          ],
          '🥊 ROCK SMASH GUY'
        );
        return true;
      },
    },

    // 12. National Park: Quick Claw Teacher Event
    {
      actions: ['QUICK_CLAW_EVENT'],
      npcIds: ['quick_claw_teacher'],
      handler: (_targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_GOT_QUICK_CLAW')) {
          ctx.openDialogue(
            ['Let a POKéMON hold that QUICK CLAW.', 'Sometimes it will strike first during battle.'],
            '👩‍🏫 TEACHER'
          );
          return true;
        }

        ctx.openDialogue(
          [
            'Pay attention, please!',
            '…Oops, I have to quit thinking like a teacher all the time.',
            'You must be a POKéMON trainer.',
            "Since you're working so hard, I want you to have this.",
          ],
          '👩‍🏫 TEACHER',
          () => {
            BattleAudio.playOverworldSound('FANFARE');
            ctx.addOverworldItemToInventory('quick_claw');
            ctx.storyFlags.add('EVENT_GOT_QUICK_CLAW');
            ctx.saveCurrentGame();
            ctx.showToast('Received QUICK CLAW!');
            ctx.openDialogue(
              ['Let a POKéMON hold that QUICK CLAW.', 'Sometimes it will strike first during battle.'],
              '👩‍🏫 TEACHER'
            );
          }
        );
        return true;
      },
    },

    // 13. National Park Gates: Bug-Catching Contest Officer
    {
      actions: ['BUG_CONTEST_OFFICER_EVENT'],
      npcIds: ['park_gate_officer'],
      handler: (_targetNpc, _map, ctx) => {
        const dayIndex = ctx.gameClock.getDayOfWeek();
        const isContestActiveToday = isContestDay(dayIndex);

        if (!isContestActiveToday) {
          ctx.openDialogue(
            [
              'The Bug-Catching Contest is held on Tuesday, Thursday and Saturday.',
              'Not only do you earn a prize just for participating, you also get to keep the bug #MON you catch!',
            ],
            '👮 PARK OFFICER'
          );
          return true;
        }

        if (ctx.bugContestManager.state.isActive) {
          ctx.openDialogue(
            [
              "You're currently participating in the Bug-Catching Contest!",
              'Would you like to conclude your contest and tally your score now?',
            ],
            '👮 PARK OFFICER',
            () => {
              const result = ctx.bugContestManager.endContest(ctx.playerName);
              ctx.destroyBugContestHUD?.();
              BattleAudio.playOverworldSound('FANFARE');
              ctx.addOverworldItemToInventory(result.prizeItem);
              ctx.storyFlags.add('EVENT_BUG_CATCHING_CONTEST_COMPLETED');
              if (result.rank === 1) {
                ctx.storyFlags.add('EVENT_BUG_CATCHING_CONTEST_1ST_PRIZE');
              }
              ctx.saveCurrentGame();
              ctx.showToast(
                result.isNewPersonalBest
                  ? `🏆 New Personal Best (${result.score} pts)! Prize: ${result.prizeName}!`
                  : `Received Prize: ${result.prizeName}!`
              );
              ctx.openDialogue(
                [
                  `CONTEST RESULTS: You placed Rank ${result.rank}!`,
                  `Evaluated Grade: ${result.grade} with ${result.score} Points!${
                    result.isNewPersonalBest ? ' (NEW PERSONAL RECORD!)' : ''
                  }`,
                  `Here is your prize: ${result.prizeName}! View the Top 5 standings anytime in START MENU → CONTESTS!`,
                ],
                '🎤 CONTEST JUDGE'
              );
            }
          );
          return true;
        }

        ctx.openDialogue(
          [
            'Today is the Bug-Catching Contest!',
            'You get 20 Park Balls and 20 minutes to catch the strongest bug POKéMON in the park!',
            'Here are your 20 Park Balls! Good luck!',
          ],
          '👮 PARK OFFICER',
          () => {
            ctx.bugContestManager.startContest();
            ctx.mountBugContestHUD?.(20, 1200);
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.showToast('Bug-Catching Contest Started! (20 Park Balls)');
          }
        );
        return true;
      },
    },
  ];
}
