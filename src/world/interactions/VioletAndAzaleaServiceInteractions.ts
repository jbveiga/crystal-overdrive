/**
 * @fileoverview VioletAndAzaleaServiceInteractions domain module implementation.
 * Handles Union Cave Friday Lapras, Violet City Kyle Trade, Earl's Academy,
 * Azalea Town Charcoal Kiln, and Kurt's Apricorn Poké Ball Crafting House.
 * @module world/interactions/VioletAndAzaleaServiceInteractions
 * @role VioletAndAzaleaServiceInteractions Component
 * @exports getVioletAndAzaleaServiceInteractions
 * @layer world
 * @sections L1-16: Micro-Header & Imports | L17-155: Lapras, Kyle Trade & Earl's Academy | L156-325: Charcoal Kiln & Kurt's House
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

export function getVioletAndAzaleaServiceInteractions(): NpcInteractionRegistration[] {
  return [
    // 0a. Route 32 Pokémon Center: Fisherman gifts the Old Rod
    {
      npcIds: ['r32_old_rod_fisherman'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('has_old_rod')) {
          ctx.openDialogue(['FISHERMAN: Fishing is all about patience. Keep casting that OLD ROD!'], targetNpc.speaker);
          return true;
        }
        ctx.storyFlags.add('has_old_rod');
        ctx.storyFlags.add('EVENT_GOT_OLD_ROD');
        if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
        if (!ctx.inventory.keyItems.includes('old_rod')) ctx.inventory.keyItems.push('old_rod');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            'FISHERMAN: Ah, a young trainer! The water is full of POKéMON waiting to be caught.',
            'Take this OLD ROD! Cast it at any pond, lake or shore.',
            `${ctx.playerName} received OLD ROD!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('🎣 Received OLD ROD from the Fisherman!');
          }
        );
        return true;
      },
    },
    // 0. Violet City south exit: Route 32 attendant checkpoint & Miracle Seed
    {
      npcIds: ['violet_r32_attendant_w', 'violet_r32_attendant_e', 'violet_r32_attendant_side'],
      handler: (targetNpc, _map, ctx) => {
        const hasBadge = ctx.storyFlags.has('falkner_defeated') || ctx.inventory.badges?.includes('zephyr');
        const hasEgg = ctx.storyFlags.has('togepi_egg_received');
        if (!hasBadge || !hasEgg) {
          const missing = !hasBadge && !hasEgg ? 'the ZEPHYR BADGE and the MYSTERY EGG' : !hasBadge ? 'the ZEPHYR BADGE' : 'the MYSTERY EGG from PROF. ELM\'S AIDE';
          ctx.openDialogue(
            [
              'ATTENDANT: The road south to ROUTE 32 is dangerous.',
              `I can only let trainers through once they have ${missing}.`,
            ],
            targetNpc.speaker
          );
          return true;
        }
        if (ctx.storyFlags.has('received_miracle_seed')) return false;
        ctx.storyFlags.add('received_miracle_seed');
        ctx.storyFlags.add('route32_attendant_cleared');
        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items['miracle_seed'] = (ctx.inventory.items['miracle_seed'] || 0) + 1;
        BattleAudio.playOverworldSound('FANFARE');
        ctx.openDialogue(
          [
            'ATTENDANT: You have the ZEPHYR BADGE and a POKéMON EGG! You are ready for ROUTE 32.',
            'Please take this MIRACLE SEED. It boosts Grass-type moves when held by a POKéMON.',
            `${ctx.playerName} received MIRACLE SEED!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('🌱 Received MIRACLE SEED! The road to ROUTE 32 is open.');
          }
        );
        return true;
      },
    },
    // 9. Union Cave B2F: Friday Lapras
    {
      actions: ['LAPRAS_EVENT'],
      npcIds: ['union_cave_lapras'],
      handler: (_targetNpc, _map, ctx) => {
        BattleAudio.playCry('lapras');
        ctx.openDialogue(['LAPRAS: Gyaoo!'], '🌊 LAPRAS', () => {
          const laprasPkmn = PokemonFactory.create('lapras', 20, ['watergun', 'growl', 'sing', 'mist']);
          ctx.triggerBattle(laprasPkmn, {
            onBattleEnd: () => {
              ctx.storyFlags.add('defeated_lapras_union_cave');
              if (ctx.npcsByMap.union_cave_b2f) {
                ctx.npcsByMap.union_cave_b2f = ctx.npcsByMap.union_cave_b2f.filter(
                  (n) => n.id !== 'union_cave_lapras'
                );
              }
              const mapNow = ctx.mapManager.getCurrentMap();
              if (mapNow) {
                ctx.renderMap?.(mapNow);
                ctx.syncMapOverworldItems?.(mapNow);
              }
              ctx.saveCurrentGame();
            },
          });
        });
        return true;
      },
    },

    // 10. Violet City: Kyle's Trade
    {
      npcIds: ['kyle'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('traded_onix_rocky')) {
          ctx.openDialogue(
            ['KYLE: How is that ONIX I traded you doing? ROCKY loves battling strong Gym Leaders!'],
            targetNpc.speaker
          );
          return true;
        }

        const findBellsprout = () => {
          const partyIdx = ctx.playerParty.findIndex((p) => p.speciesId === 'bellsprout');
          const boxState = ctx.boxManager?.getState();
          let boxFound: { boxIdx: number; slotIdx: number; level: number } | null = null;
          if (partyIdx === -1 && boxState) {
            for (let b = 0; b < boxState.boxes.length; b++) {
              const idx = boxState.boxes[b].pokemon.findIndex((p) => p.speciesId === 'bellsprout');
              if (idx !== -1) {
                boxFound = { boxIdx: b, slotIdx: idx, level: boxState.boxes[b].pokemon[idx].level };
                break;
              }
            }
          }
          return { partyIdx, boxState, boxFound };
        };

        const executeKyleTrade = () => {
          const { partyIdx, boxState, boxFound } = findBellsprout();
          if (partyIdx === -1 && !boxFound) {
            BattleAudio.playMenuSound('CANCEL');
            ctx.openDialogue(
              [
                "KYLE: Awww! You don't have a BELLSPROUT!",
                'You can catch wild BELLSPROUT in the tall grass on ROUTE 31 or ROUTE 32. Come back when you have one!',
              ],
              targetNpc.speaker
            );
            return;
          }

          const tradeLevel =
            partyIdx !== -1 ? Math.max(5, ctx.playerParty[partyIdx].level) : Math.max(5, boxFound!.level);
          const rockyOnix = PokemonFactory.create('onix', tradeLevel);
          rockyOnix.nickname = 'ROCKY';
          rockyOnix.heldItem = 'persim-berry';

          if (partyIdx !== -1) {
            ctx.playerParty[partyIdx] = rockyOnix;
          } else if (boxFound && boxState) {
            boxState.boxes[boxFound.boxIdx].pokemon[boxFound.slotIdx] = rockyOnix;
          }

          ctx.storyFlags.add('traded_onix_rocky');
          ctx.missionManager.checkStoryFlags(ctx.storyFlags);

          const finishTradeDialogue = () => {
            BattleAudio.playOverworldSound('FANFARE');
            ctx.showToast('🪨 Traded BELLSPROUT for ONIX ("ROCKY")!');
            ctx.saveCurrentGame();

            ctx.openDialogue(
              [
                'KYLE: Yay! Thanks! We traded BELLSPROUT for ONIX!',
                'Take good care of ROCKY! Rock-type moves are super effective against FALKNER at the VIOLET GYM!',
              ],
              targetNpc.speaker
            );
          };

          if (ctx.playTradeAnimation) {
            ctx.playTradeAnimation(
              {
                givenSpeciesId: 'bellsprout',
                givenName: 'BELLSPROUT',
                receivedSpeciesId: 'onix',
                receivedName: 'ONIX (ROCKY)',
                traderName: 'KYLE',
              },
              finishTradeDialogue
            );
          } else {
            finishTradeDialogue();
          }
        };

        const cancelKyleTrade = () => {
          BattleAudio.playMenuSound('CANCEL');
          ctx.openDialogue(["KYLE: Oh, you don't want to trade? That's okay then."], targetNpc.speaker);
        };

        if (ctx.openChoiceDialogue) {
          ctx.openChoiceDialogue(
            ['KYLE: I collect POKéMON! Do you have a BELLSPROUT?', 'Want to trade your BELLSPROUT for my ONIX?'],
            targetNpc.speaker,
            (choice) => {
              if (choice === 'YES') {
                executeKyleTrade();
              } else {
                cancelKyleTrade();
              }
            }
          );
          return true;
        }

        ctx.openDialogue(
          ['KYLE: I collect POKéMON! Do you have a BELLSPROUT?', 'Want to trade your BELLSPROUT for my ONIX?'],
          targetNpc.speaker,
          () => {
            const { partyIdx } = findBellsprout();
            ctx.openKyleTradeModal({
              bellsproutIndex: partyIdx,
              onConfirm: executeKyleTrade,
              onCancel: cancelKyleTrade,
            });
          }
        );
        return true;
      },
    },

    // 11. Violet City: Earl's Academy
    {
      npcIds: ['earl_teacher'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has('earls_academy_graduated')) {
          ctx.storyFlags.add('earls_academy_graduated');
          if (!ctx.inventory.items) ctx.inventory.items = {};
          ctx.inventory.items['parlyz-heal'] = (ctx.inventory.items['parlyz-heal'] || 0) + 1;
          ctx.inventory.items['antidote'] = (ctx.inventory.items['antidote'] || 0) + 1;
          ctx.inventory.items['awakening'] = (ctx.inventory.items['awakening'] || 0) + 1;
          ctx.missionManager.checkStoryFlags(ctx.storyFlags);
          BattleAudio.playOverworldSound('FANFARE');
          ctx.showToast('🎓 Received Status Cure Kit (Parlyz Heal, Antidote & Awakening)!');
          ctx.saveCurrentGame();
          ctx.openDialogue(
            [
              "Twirl! Welcome to EARL'S POKéMON ACADEMY!",
              "In battle, a move matching your POKéMON's own type deals 1.5x damage! And always carry cures for status conditions!",
              'Received the STATUS CURE KIT (PARLYZ HEAL, ANTIDOTE, and AWAKENING) from PROF. EARL!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },

    // 12. Azalea Town: Charcoal Kiln Boss & Apprentice
    {
      npcIds: ['kiln_boss'],
      handler: (targetNpc, _map, ctx) => {
        const isFarfetchdReturned =
          ctx.storyFlags.has('EVENT_HERDED_FARFETCHD') ||
          ctx.storyFlags.has('forest_farfetchd_herded') ||
          ctx.storyFlags.has('has_hm01_cut') ||
          ctx.storyFlags.has('EVENT_GOT_HM01_CUT');
        if (!isFarfetchdReturned) {
          ctx.openDialogue(
            [
              'KILN BOSS: All the SLOWPOKE have disappeared from the town... TEAM ROCKET must be up to no good.',
              "And my apprentice went into ILEX FOREST to look for our runaway FARFETCH'D!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },
    {
      actions: ['CHARCOAL_KILN_APPRENTICE_EVENT'],
      npcIds: ['kiln_apprentice'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('got_charcoal_from_kiln')) {
          ctx.openDialogue(
            [
              "APPRENTICE: FARFETCH'D is back and our charcoal kiln is burning bright! Have a Pokémon hold CHARCOAL to boost FIRE-type moves!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.storyFlags.add('got_charcoal_from_kiln');
        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items['charcoal'] = (ctx.inventory.items['charcoal'] || 0) + 1;
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            "APPRENTICE: Thank you so much for chasing down FARFETCH'D in ILEX FOREST!",
            'Please take this CHARCOAL that we cured in our kiln! Having a POKéMON hold it powers up FIRE-type moves!',
            `${ctx.playerName} received CHARCOAL!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('🔥 Received CHARCOAL from the Charcoal Kiln!');
          }
        );
        return true;
      },
    },

    // 13. Azalea Town: Kurt's House (Granddaughter & Kurt)
    {
      npcIds: ['kurt_granddaughter'],
      handler: (targetNpc, _map, ctx) => {
        const isWellCleared =
          ctx.storyFlags.has('slowpoke_well_cleared') ||
          ctx.storyFlags.has('cleared_slowpoke_well') ||
          ctx.storyFlags.has('EVENT_CLEARED_SLOWPOKE_WELL');
        if (ctx.storyFlags.has('EVENT_KURT_LEFT_FOR_WELL') && !isWellCleared) {
          ctx.openDialogue(
            [
              'GRANDDAUGHTER: Grandpa dashed off to SLOWPOKE WELL all by himself!',
              "I'm so worried about him—please go to SLOWPOKE WELL and help Grandpa!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },
    {
      npcIds: ['kurt_house_kurt'],
      handler: (targetNpc, _map, ctx) => {
        const isWellCleared =
          ctx.storyFlags.has('slowpoke_well_cleared') ||
          ctx.storyFlags.has('cleared_slowpoke_well') ||
          ctx.storyFlags.has('EVENT_CLEARED_SLOWPOKE_WELL');

        if (!isWellCleared) {
          ctx.openDialogue(
            [
              'KURT: Hmph! TEAM ROCKET is back and chopping off priceless SLOWPOKE tails at the well!',
              "I won't let them get away with this! I'm going to SLOWPOKE WELL to drive them off myself! Follow me, kid!",
              'Kurt grabbed his walking stick and bolted out the door towards SLOWPOKE WELL!',
            ],
            targetNpc.speaker,
            () => {
              BattleAudio.playOverworldSound('DOOR');
              ctx.storyFlags.add('EVENT_KURT_LEFT_FOR_WELL');
              if (ctx.npcsByMap.azalea_town) {
                ctx.npcsByMap.azalea_town = ctx.npcsByMap.azalea_town.filter((n) => n.id !== 'azalea_well_grunt');
              }
              ctx.saveCurrentGame();
              ctx.showToast('👴 Kurt rushed into Slowpoke Well!');
            }
          );
          return true;
        }

        if (!ctx.storyFlags.has('EVENT_KURT_GAVE_YOU_LURE_BALL')) {
          if (!ctx.inventory.balls) ctx.inventory.balls = {};
          ctx.inventory.balls['lure-ball'] = (ctx.inventory.balls['lure-ball'] || 0) + 1;
          ctx.storyFlags.add('EVENT_KURT_GAVE_YOU_LURE_BALL');
          ctx.storyFlags.add('APRICORN_CRAFTING_UNLOCKED');
          ctx.missionManager.checkStoryFlags(ctx.storyFlags);
          BattleAudio.playOverworldSound('FANFARE');
          ctx.showToast('Received LURE BALL!');
          ctx.saveCurrentGame();
          ctx.openDialogue(
            [
              "KURT: You drove off TEAM ROCKET from SLOWPOKE WELL? You're a wonderful trainer!",
              'Take this LURE BALL as my thanks!',
              "Bring me any APRICORNS you find on trees, and I'll gladly craft custom POKé BALLS for you free of charge!",
            ],
            targetNpc.speaker
          );
          return true;
        }

        const hasGsBall =
          ctx.inventory.keyItems?.includes('GS_BALL') ||
          ctx.inventory.keyItems?.includes('gs_ball') ||
          ctx.storyFlags.has('HAS_GS_BALL');

        if (hasGsBall && !ctx.storyFlags.has('KURT_CHECKED_GS_BALL')) {
          ctx.storyFlags.add('KURT_CHECKED_GS_BALL');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              'KURT: Wh-what is that?! ...A GS BALL?!',
              'I have never seen anything like this in all my years of ball crafting! The metal and latch are completely seamless...',
              'Wait! An ancient legend in AZALEA speaks of a golden ball and the guardian deity of ILEX FOREST!',
              'Take this GS BALL to the ILEX FOREST SHRINE! If the forest spirit senses its presence, a miracle may occur!',
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('⛩️ Kurt inspected the GS BALL! Take it to Ilex Forest Shrine!');
            }
          );
          return true;
        }

        if (ctx.kurtCraftingManager?.activeOrder?.isReady) {
          const finished = ctx.kurtCraftingManager.collectOrder()!;
          if (!ctx.inventory.balls) ctx.inventory.balls = {};
          ctx.inventory.balls[finished.ballId] = (ctx.inventory.balls[finished.ballId] || 0) + finished.quantity;
          ctx.storyFlags.delete('ENGINE_KURT_MAKING_BALLS');
          targetNpc.x = 3;
          targetNpc.y = 2;
          targetNpc.renderX = 3;
          targetNpc.renderY = 2;
          targetNpc.direction = 'DOWN';
          BattleAudio.playOverworldSound('FANFARE');
          const ballName = finished.ballId.toUpperCase().replace(/-/g, ' ');
          ctx.showToast(`Received ${finished.quantity}x ${ballName}!`);
          ctx.saveCurrentGame();
          ctx.openDialogue(
            [
              'KURT: Thanks for waiting! Your custom Poké Balls are ready!',
              `Handed over ${finished.quantity}x ${ballName}!`,
              "Bring me more Apricorns whenever you'd like another batch!",
            ],
            targetNpc.speaker
          );
          return true;
        }

        if (ctx.storyFlags.has('ENGINE_KURT_MAKING_BALLS')) {
          ctx.openDialogue(
            [
              "KURT: I'm working! Don't bother me!",
              'Crafting custom Poké Balls takes intense focus and delicate hammer work!',
            ],
            targetNpc.speaker
          );
          return true;
        }

        ctx.openKurtCraftingModal({
          onOrderPlaced: () => {
            targetNpc.x = 14;
            targetNpc.y = 3;
            targetNpc.renderX = 14;
            targetNpc.renderY = 3;
            targetNpc.direction = 'UP';
          },
        });
        return true;
      },
    },
  ];
}
