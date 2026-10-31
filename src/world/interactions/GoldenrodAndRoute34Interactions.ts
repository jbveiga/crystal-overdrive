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
import { getRoute36AndNationalParkInteractions } from './Route36AndNationalParkInteractions';

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
        ctx.seenSpecies?.add('eevee');
        ctx.caughtSpecies?.add('eevee');
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
      actions: ['DEPT_ELEVATOR', 'DEPT_ELEVATOR_PANEL'],
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

    // 10-13. Route 36 Sudowoodo, Rock Smash TM08, Quick Claw & Bug-Catching Contest (bug POKéMON you catch!)
    ...getRoute36AndNationalParkInteractions(),
  ];
}
