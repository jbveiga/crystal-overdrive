/**
 * @fileoverview GoldenrodExpansionInteractions domain module implementation.
 * @module world/interactions/GoldenrodExpansionInteractions
 * @role GoldenrodExpansionInteractions Component
 * @exports getGoldenrodExpansionInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-160: Quests & Trades | L161-320: Game Corner & Services
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

export interface SpecialtyShopItem {
  id: string;
  name: string;
  price: number;
  category: 'MEDICINE' | 'VALUABLE';
  resalePrice?: number;
}

export const BITTER_HERB_SHOP_ITEMS: SpecialtyShopItem[] = [
  { id: 'energypowder', name: 'ENERGYPOWDER', price: 500, category: 'MEDICINE' },
  { id: 'energy_root', name: 'ENERGY ROOT', price: 800, category: 'MEDICINE' },
  { id: 'heal_powder', name: 'HEAL POWDER', price: 450, category: 'MEDICINE' },
  { id: 'revival_herb', name: 'REVIVAL HERB', price: 2800, category: 'MEDICINE' },
];

export const BARGAIN_SHOP_ITEMS: SpecialtyShopItem[] = [
  { id: 'nugget', name: 'NUGGET', price: 4500, resalePrice: 5000, category: 'VALUABLE' },
  { id: 'pearl', name: 'PEARL', price: 650, resalePrice: 700, category: 'VALUABLE' },
  { id: 'big_pearl', name: 'BIG PEARL', price: 3500, resalePrice: 3750, category: 'VALUABLE' },
  { id: 'stardust', name: 'STARDUST', price: 950, resalePrice: 1000, category: 'VALUABLE' },
  { id: 'star_piece', name: 'STAR PIECE', price: 4600, resalePrice: 4900, category: 'VALUABLE' },
];

/**
 * GoldenrodExpansionInteractions — Gatehouse quests, Department store trades & services,
 * Game Corner coin & prizes, Underground haircut brothers, and Underground specialty merchants.
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getGoldenrodExpansionInteractions(): NpcInteractionRegistration[] {
  return [
    // 1. Route 35 Officer Dirk Daytime Patrol Check
    {
      npcIds: ['officer_dirk'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.gameClock.getTimeOfDay() !== 'NIGHT') {
          ctx.openDialogue(
            [
              'OFFICER DIRK: Your POKéMON look pretty tough. You could go anywhere safely.',
              'Still, be careful on patrol after dark!',
            ],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },

    // 2. Route 34 Cooltrainer Kate Soft Sand
    {
      npcIds: ['cooltrainer_kate'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.defeatedTrainers.has('cooltrainer_kate')) {
          if (!ctx.storyFlags.has('EVENT_GOT_SOFT_SAND_FROM_KATE') && !ctx.storyFlags.has('KATE_DEFEATED_REWARD')) {
            if (!ctx.inventory.items) ctx.inventory.items = {};
            ctx.inventory.items['soft-sand'] = (ctx.inventory.items['soft-sand'] || 0) + 1;
            ctx.inventory.items['soft_sand'] = (ctx.inventory.items['soft_sand'] || 0) + 1;
            ctx.storyFlags.add('EVENT_GOT_SOFT_SAND_FROM_KATE');
            ctx.storyFlags.add('KATE_DEFEATED_REWARD');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.openDialogue(
              [
                "COOLTRAINER KATE: You're really strong! Take this SOFT SAND—it boosts the power of GROUND-type moves!",
              ],
              targetNpc.speaker,
              () => {
                ctx.saveCurrentGame();
                ctx.showToast('🏜️ Received Soft Sand from Cooltrainer Kate!');
              }
            );
            return true;
          }
          ctx.openDialogue(
            ['COOLTRAINER KATE: Ground-type moves hit with much greater power when holding Soft Sand!'],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },

    // 3. Route 35 Gate Officer Randy & Route 31 Kenya/TM50 Nightmare Quest
    {
      actions: ['OFFICER_RANDY_KENYA'],
      npcIds: ['officer_randy'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_GOT_TM50_NIGHTMARE') || ctx.storyFlags.has('EVENT_GAVE_KENYA')) {
          ctx.openDialogue(
            [
              'OFFICER RANDY: Thank you so much for delivering that letter to my friend on ROUTE 31!',
              'Kenya the Spearow was happy to fly again, too!',
            ],
            targetNpc.speaker
          );
          return true;
        }

        if (ctx.storyFlags.has('EVENT_GOT_KENYA')) {
          ctx.openDialogue(
            [
              'OFFICER RANDY: Please deliver that SPEAROW (KENYA) with the FLOWER MAIL to my friend sleeping by DARK CAVE on ROUTE 31!',
            ],
            targetNpc.speaker
          );
          return true;
        }

        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items['flower-mail'] = (ctx.inventory.items['flower-mail'] || 0) + 1;
        if (ctx.playerParty.length < 6) {
          const kenya = PokemonFactory.create('spearow', 10, ['peck', 'growl', 'leer', 'furyattack']);
          kenya.nickname = 'KENYA';
          kenya.heldItem = 'flower-mail';
          kenya.originalTrainer = 'RANDY';
          ctx.playerParty.push(kenya);
        }
        ctx.storyFlags.add('EVENT_GOT_KENYA');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            'OFFICER RANDY: Hey, trainer! Could you do me a favor? My friend is resting on ROUTE 31 by DARK CAVE.',
            'Take this SPEAROW—its name is KENYA—carrying FLOWER MAIL, and deliver it to him!',
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('🐦 Received KENYA (Spearow Lv. 10) holding Flower Mail!');
          }
        );
        return true;
      },
    },
    {
      npcIds: ['r31_sleepy_man', 'r31_mail_guy'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_GOT_KENYA') && !ctx.storyFlags.has('EVENT_GOT_TM50_NIGHTMARE')) {
          ctx.storyFlags.add('EVENT_GAVE_KENYA');
          ctx.storyFlags.add('EVENT_GOT_TM50_NIGHTMARE');
          if (!ctx.inventory.tms) ctx.inventory.tms = [];
          if (!ctx.inventory.tms.includes('TM50')) ctx.inventory.tms.push('TM50');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              'SLEEPY MAN: …Hnuurg… Huh? You brought mail for me from OFFICER RANDY?',
              "Let's see… 'Dark Cave leads to another road'… Thanks a bunch, kid! Take this TM50 NIGHTMARE as my thanks!",
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('💿 Received TM50 NIGHTMARE!');
            }
          );
          return true;
        }
        if (ctx.storyFlags.has('EVENT_GOT_TM50_NIGHTMARE')) {
          ctx.openDialogue(
            ['SLEEPY MAN: …Zzz… NIGHTMARE drains HP each turn a sleeping foe is tormented… Zzz…'],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },

    // 4. Dept. Store 5F Receptionist (Sunday Happiness Lady — TM27 Return / TM21 Frustration)
    {
      npcIds: ['dept_5f_receptionist'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('ENGINE_GOLDENROD_DEPT_STORE_TM27_RETURN')) {
          ctx.openDialogue(
            ['RECEPTIONIST: Praise your POKéMON and treat them with kindness every day! Your bond will shine!'],
            targetNpc.speaker
          );
          return true;
        }

        const lead = ctx.playerParty[0];
        const friendship = lead?.friendship ?? 70;
        if (!ctx.inventory.tms) ctx.inventory.tms = [];
        ctx.storyFlags.add('ENGINE_GOLDENROD_DEPT_STORE_TM27_RETURN');
        BattleAudio.playOverworldSound('KEY_ITEM');

        if (friendship < 50) {
          if (!ctx.inventory.tms.includes('TM21')) ctx.inventory.tms.push('TM21');
          ctx.openDialogue(
            [
              "RECEPTIONIST: Hmm… It looks like your POKéMON isn't very fond of you yet…",
              'Here, take this TM21 FRUSTRATION. It strikes harder when a POKéMON is upset!',
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('💿 Received TM21 FRUSTRATION!');
            }
          );
        } else {
          if (!ctx.inventory.tms.includes('TM27')) ctx.inventory.tms.push('TM27');
          ctx.openDialogue(
            [
              'RECEPTIONIST: Wow! Your POKéMON trusts you completely! It clearly adores you!',
              'Take this TM27 RETURN as a reward for your deep friendship!',
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('💿 Received TM27 RETURN!');
            }
          );
        }
        return true;
      },
    },

    // 5. Dept. Store 5F Camper Mike Trade (Drowzee for Machop "CHRIS")
    {
      actions: ['DEPT_STORE_TRADE_MIKE'],
      npcIds: ['dept_5f_mike'],
      handler: (targetNpc, _map, ctx) => {
        if (
          ctx.storyFlags.has('traded_machop_chris') ||
          ctx.storyFlags.has('EVENT_TRADED_MACHOP_CHRIS') ||
          ctx.storyFlags.has('EVENT_TRADED_MIKE_MACHOP')
        ) {
          ctx.openDialogue(
            ["MIKE: How is that MACHOP I traded you doing? My DROWZEE is getting so strong!"],
            targetNpc.speaker
          );
          return true;
        }

        const drowzeeIdx = ctx.playerParty.findIndex((p) => p.speciesId.toLowerCase() === 'drowzee');
        if (drowzeeIdx === -1) {
          ctx.openDialogue(
            [
              "MIKE: Hi! I'm looking for a DROWZEE! Would you trade one for my MACHOP?",
            ],
            targetNpc.speaker
          );
          return true;
        }

        const machop = PokemonFactory.create('machop', 15, ['karatechop', 'lowkick', 'leer', 'focusenergy']);
        machop.nickname = 'CHRIS';
        machop.heldItem = 'gold-berry';
        machop.originalTrainer = 'MIKE';
        machop.otId = '25740';
        ctx.playerParty[drowzeeIdx] = machop;
        ctx.storyFlags.add('traded_machop_chris');
        ctx.storyFlags.add('EVENT_TRADED_MACHOP_CHRIS');
        ctx.storyFlags.add('EVENT_TRADED_MIKE_MACHOP');
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            'MIKE: Whoa! Thank you so much for the DROWZEE!',
            `${ctx.playerName} traded DROWZEE for MIKE's MACHOP (CHRIS)!`,
            'MIKE: Take good care of CHRIS! It has tremendous Fighting power!',
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame?.();
            ctx.showToast?.('🔄 Traded DROWZEE for MIKE’s MACHOP (CHRIS)!');
          }
        );
        return true;
      },
    },

    // 6. Dept. Store 6F & Roof Vending Machines
    {
      actions: ['VENDING_MACHINE'],
      npcIds: ['dept_vending_6f', 'dept_vending_roof'],
      handler: (targetNpc, _map, ctx) => {
        ctx.openDialogue(
          ['VENDING MACHINE: Clang! Refreshing drinks in stock—Fresh Water (¥200), Soda Pop (¥300), and Lemonade (¥350)!'],
          targetNpc.speaker,
          () => {
            ctx.openMart('goldenrod_dept_store_6f');
          }
        );
        return true;
      },
    },

    // 7. Game Corner Clerks: Coins, TM Prizes & Pokémon Prizes
    {
      actions: ['GAME_CORNER_COIN_CLERK'],
      npcIds: ['game_corner_coin_clerk'],
      handler: (targetNpc, _map, ctx) => {
        const hasCoinCase =
          ctx.storyFlags.has('has_coin_case') ||
          ctx.storyFlags.has('EVENT_GOT_COIN_CASE') ||
          Boolean(ctx.inventory.keyItems?.includes('coin_case'));

        if (!hasCoinCase) {
          ctx.openDialogue(
            [
              'COIN VENDOR: Welcome to the GOLDENROD GAME CORNER! You need a COIN CASE to hold coins—people say there is one lost in the GOLDENROD UNDERGROUND!',
            ],
            targetNpc.speaker
          );
          return true;
        }

        if (!ctx.inventory.items) ctx.inventory.items = {};

        if (!ctx.storyFlags.has('EVENT_GAME_CORNER_STARTER_COINS')) {
          ctx.storyFlags.add('EVENT_GAME_CORNER_STARTER_COINS');
          ctx.inventory.items['coins'] = (ctx.inventory.items['coins'] || 0) + 500;
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            ['COIN VENDOR: Welcome! Here are 500 complimentary starter coins to get you playing!'],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🪙 Received 500 complimentary Game Corner Coins!');
            }
          );
          return true;
        }

        if (ctx.inventory.money >= 1000) {
          ctx.inventory.money -= 1000;
          ctx.inventory.items['coins'] = (ctx.inventory.items['coins'] || 0) + 500;
          BattleAudio.playMenuSound('CONFIRM');
          ctx.openDialogue(
            [`COIN VENDOR: Here are your 500 coins! Current Coin Balance: ${ctx.inventory.items['coins']}`],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🪙 Purchased 500 Coins for ¥1,000!');
            }
          );
          return true;
        }

        ctx.openDialogue(
          ["COIN VENDOR: Coins are ¥1,000 for 500 coins. You don't have enough money right now!"],
          targetNpc.speaker
        );
        return true;
      },
    },
    {
      actions: ['GAME_CORNER_TM_PRIZE'],
      npcIds: ['game_corner_tm_clerk'],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.inventory.tms) ctx.inventory.tms = [];
        const prizeTms = ['TM25', 'TM14', 'TM38'];
        const neededTm = prizeTms.find((tm) => !ctx.inventory.tms.includes(tm));

        if (!neededTm) {
          ctx.openDialogue(
            ['TM PRIZE CLERK: You have already claimed all available TM prizes! Congratulations!'],
            targetNpc.speaker
          );
          return true;
        }

        if (!ctx.inventory.items) ctx.inventory.items = {};
        const coins = ctx.inventory.items['coins'] || 0;

        if (coins >= 5500) {
          ctx.inventory.items['coins'] -= 5500;
          ctx.inventory.tms.push(neededTm);
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [`TM PRIZE CLERK: Here is your ${neededTm}! Thank you for playing at the GAME CORNER!`],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast(`🎁 Exchanged 5,500 coins for ${neededTm}!`);
            }
          );
          return true;
        }

        if (ctx.inventory.money >= 5500) {
          ctx.inventory.money -= 5500;
          ctx.inventory.tms.push(neededTm);
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [`TM PRIZE CLERK: Here is your ${neededTm}! Thank you for playing at the GAME CORNER!`],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast(`🎁 Exchanged ¥5,500 for ${neededTm}!`);
            }
          );
          return true;
        }

        if (coins >= 500) {
          ctx.inventory.items['coins'] -= 500;
          ctx.inventory.tms.push(neededTm);
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [`TM PRIZE CLERK: Here is your ${neededTm}! Promotional discount applied!`],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast(`🎁 Exchanged 500 promotional coins for ${neededTm}!`);
            }
          );
          return true;
        }

        ctx.openDialogue(
          ['TM PRIZE CLERK: We offer TM25 (Thunder), TM14 (Blizzard), and TM38 (Fire Blast) for 5,500 coins each!'],
          targetNpc.speaker
        );
        return true;
      },
    },
    {
      actions: ['GAME_CORNER_MON_PRIZE'],
      npcIds: ['game_corner_mon_clerk'],
      handler: (targetNpc, _map, ctx) => {
        let prize: { flag: string; speciesId: string; level: number; moves: string[]; cost: number; name: string } | null = null;
        if (!ctx.storyFlags.has('EVENT_GOT_GAME_CORNER_ABRA')) {
          prize = { flag: 'EVENT_GOT_GAME_CORNER_ABRA', speciesId: 'abra', level: 5, moves: ['teleport'], cost: 100, name: 'ABRA' };
        } else if (!ctx.storyFlags.has('EVENT_GOT_GAME_CORNER_CUBONE')) {
          prize = { flag: 'EVENT_GOT_GAME_CORNER_CUBONE', speciesId: 'cubone', level: 15, moves: ['growl', 'tailwhip', 'boneclub', 'headbutt'], cost: 800, name: 'CUBONE' };
        } else if (!ctx.storyFlags.has('EVENT_GOT_GAME_CORNER_WOBBUFFET')) {
          prize = { flag: 'EVENT_GOT_GAME_CORNER_WOBBUFFET', speciesId: 'wobbuffet', level: 15, moves: ['counter', 'mirrorcoat', 'safeguard', 'destinybond'], cost: 1500, name: 'WOBBUFFET' };
        }

        if (!prize) {
          ctx.openDialogue(
            ['POKéMON PRIZE CLERK: You have already won all our rare POKéMON prizes! Congratulations!'],
            targetNpc.speaker
          );
          return true;
        }

        if (!ctx.inventory.items) ctx.inventory.items = {};
        const coins = ctx.inventory.items['coins'] || 0;

        if (coins < prize.cost && ctx.inventory.money < prize.cost * 10) {
          ctx.openDialogue(
            [`POKéMON PRIZE CLERK: You need ${prize.cost} coins to claim ${prize.name}!`],
            targetNpc.speaker
          );
          return true;
        }

        if (coins >= prize.cost) {
          ctx.inventory.items['coins'] -= prize.cost;
        } else {
          ctx.inventory.money -= prize.cost * 10;
        }

        const mon = PokemonFactory.create(prize.speciesId, prize.level, prize.moves);
        ctx.storyFlags.add(prize.flag);
        BattleAudio.playOverworldSound('KEY_ITEM');
        if (ctx.playerParty.length < 6) {
          ctx.playerParty.push(mon);
        } else if (ctx.boxManager) {
          ctx.boxManager.deposit(mon);
        }

        const monName = prize.name;
        const monLvl = prize.level;
        ctx.openDialogue(
          [`POKéMON PRIZE CLERK: Here is your ${monName}! Take wonderful care of it!`],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast(`🎁 Claimed ${monName} (Lv. ${monLvl}) prize!`);
          }
        );
        return true;
      },
    },

    // 8. Underground Haircut Brothers
    {
      actions: ['OLDER_HAIRCUT_BROTHER'],
      npcIds: ['older_haircut_brother'],
      handler: (targetNpc, _map, ctx) => {
        const day = ctx.gameClock?.getDayOfWeek
          ? ctx.gameClock.getDayOfWeek()
          : (ctx.gameClock ? -1 : new Date().getDay());

        if (day !== -1 && day !== 2 && day !== 4 && day !== 6) {
          ctx.openDialogue(
            ["OLDER HAIRCUT BROTHER: I'm off duty today. I only work on Tuesday, Thursday, and Saturday!"],
            targetNpc.speaker
          );
          return true;
        }

        if (ctx.storyFlags.has('ENGINE_GOLDENROD_UNDERGROUND_GOT_HAIRCUT') || ctx.storyFlags.has('HAIRCUT_TODAY')) {
          ctx.openDialogue(
            ['OLDER HAIRCUT BROTHER: That’s it for today! Come back tomorrow for another stylish haircut!'],
            targetNpc.speaker
          );
          return true;
        }

        if ((ctx.inventory?.money ?? 0) < 500) {
          ctx.openDialogue(
            ["OLDER HAIRCUT BROTHER: A premier haircut costs ¥500. You don't have enough money!"],
            targetNpc.speaker
          );
          return true;
        }

        ctx.inventory.money -= 500;
        const lead = ctx.playerParty[0];
        if (lead) {
          lead.friendship = Math.min(255, (lead.friendship ?? 70) + 15);
        }
        ctx.storyFlags.add('ENGINE_GOLDENROD_UNDERGROUND_GOT_HAIRCUT');
        ctx.storyFlags.add('HAIRCUT_TODAY');
        BattleAudio.playMenuSound('HEAL');
        ctx.openDialogue(
          ['OLDER HAIRCUT BROTHER: Snip snip… All done! Your POKéMON looks radiant and delighted!'],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('✂️ Lead Pokémon looks delighted after its haircut! (+15 Friendship)');
          }
        );
        return true;
      },
    },
    {
      actions: ['YOUNGER_HAIRCUT_BROTHER'],
      npcIds: ['younger_haircut_brother'],
      handler: (targetNpc, _map, ctx) => {
        const day = ctx.gameClock?.getDayOfWeek
          ? ctx.gameClock.getDayOfWeek()
          : (ctx.gameClock ? -1 : new Date().getDay());

        if (day !== -1 && day !== 0 && day !== 3 && day !== 5) {
          ctx.openDialogue(
            ["YOUNGER HAIRCUT BROTHER: I'm taking a break today. I work on Sunday, Wednesday, and Friday!"],
            targetNpc.speaker
          );
          return true;
        }

        if (ctx.storyFlags.has('ENGINE_GOLDENROD_UNDERGROUND_GOT_HAIRCUT') || ctx.storyFlags.has('HAIRCUT_TODAY')) {
          ctx.openDialogue(
            ['YOUNGER HAIRCUT BROTHER: I only do one haircut per day. Check back tomorrow!'],
            targetNpc.speaker
          );
          return true;
        }

        if ((ctx.inventory?.money ?? 0) < 300) {
          ctx.openDialogue(
            ["YOUNGER HAIRCUT BROTHER: A trim costs ¥300. You don't have enough money!"],
            targetNpc.speaker
          );
          return true;
        }

        ctx.inventory.money -= 300;
        const lead = ctx.playerParty[0];
        if (lead) {
          lead.friendship = Math.min(255, (lead.friendship ?? 70) + 10);
        }
        ctx.storyFlags.add('ENGINE_GOLDENROD_UNDERGROUND_GOT_HAIRCUT');
        ctx.storyFlags.add('HAIRCUT_TODAY');
        BattleAudio.playMenuSound('HEAL');
        ctx.openDialogue(
          ['YOUNGER HAIRCUT BROTHER: Snip snip… Finished! Your POKéMON looks tidy and happy!'],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('✂️ Lead Pokémon looks happy after its trim! (+10 Friendship)');
          }
        );
        return true;
      },
    },

    // 9. Underground Specialty Merchants (Bitter Herb Shop & Bargain Merchant)
    {
      actions: ['BITTER_MERCHANT'],
      npcIds: ['bitter_merchant'],
      handler: (targetNpc, _map, ctx) => {
        const day = ctx.gameClock?.getDayOfWeek
          ? ctx.gameClock.getDayOfWeek()
          : (ctx.gameClock ? -1 : new Date().getDay());

        if (day !== -1 && day !== 0 && day !== 6) {
          ctx.openDialogue(
            ["We're not open today. We only sell our herbs on weekends!"],
            targetNpc.speaker
          );
          return true;
        }

        let selected = BITTER_HERB_SHOP_ITEMS[0];
        for (const item of BITTER_HERB_SHOP_ITEMS) {
          if (!ctx.inventory?.items?.[item.id] && (ctx.inventory?.money ?? 0) >= item.price) {
            selected = item;
            break;
          }
        }
        if ((ctx.inventory?.money ?? 0) < selected.price) {
          const affordable = BITTER_HERB_SHOP_ITEMS.filter((i) => (ctx.inventory?.money ?? 0) >= i.price);
          if (affordable.length > 0) {
            selected = affordable[0];
          } else {
            ctx.openDialogue(
              [
                "HERB MERCHANT: Welcome to the HERB SHOP! Our bitter herbs heal thoroughly, but they taste dreadful!",
                "You don't have enough money right now!",
              ],
              targetNpc.speaker
            );
            return true;
          }
        }

        ctx.inventory.money -= selected.price;
        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items[selected.id] = (ctx.inventory.items[selected.id] || 0) + 1;
        BattleAudio.playMenuSound('CONFIRM');
        ctx.openDialogue(
          [
            `HERB MERCHANT: Here is your ${selected.name}! It may taste bitter, but it heals thoroughly!`,
            `(Purchased 1x ${selected.name} for ¥${selected.price})`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast(`🌿 Purchased ${selected.name} for ¥${selected.price}!`);
          }
        );
        return true;
      },
    },
    {
      actions: ['BARGAIN_MERCHANT'],
      npcIds: ['bargain_merchant'],
      handler: (targetNpc, _map, ctx) => {
        const day = ctx.gameClock?.getDayOfWeek
          ? ctx.gameClock.getDayOfWeek()
          : (ctx.gameClock ? -1 : new Date().getDay());

        if (day !== -1 && day !== 1) {
          ctx.openDialogue(
            ['Come back next Monday morning for more bargain goods!'],
            targetNpc.speaker
          );
          return true;
        }

        if (ctx.storyFlags.has('BARGAIN_SHOP_BOUGHT_OUT')) {
          ctx.openDialogue(
            ['Come back next Monday morning for more bargain goods!'],
            targetNpc.speaker
          );
          return true;
        }

        const nextItem = BARGAIN_SHOP_ITEMS.find(
          (item) => !ctx.storyFlags.has(`BARGAIN_BOUGHT_${item.id.toUpperCase()}`)
        );

        if (!nextItem) {
          ctx.storyFlags.add('BARGAIN_SHOP_BOUGHT_OUT');
          ctx.openDialogue(
            ['Come back next Monday morning for more bargain goods!'],
            targetNpc.speaker
          );
          return true;
        }

        if ((ctx.inventory?.money ?? 0) < nextItem.price) {
          ctx.openDialogue(
            [
              `BARGAIN MERCHANT: Today's special is a ${nextItem.name} for just ¥${nextItem.price}!`,
              "You don't have enough money right now!",
            ],
            targetNpc.speaker
          );
          return true;
        }

        ctx.inventory.money -= nextItem.price;
        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items[nextItem.id] = (ctx.inventory.items[nextItem.id] || 0) + 1;
        ctx.storyFlags.add(`BARGAIN_BOUGHT_${nextItem.id.toUpperCase()}`);

        const remaining = BARGAIN_SHOP_ITEMS.filter(
          (item) => !ctx.storyFlags.has(`BARGAIN_BOUGHT_${item.id.toUpperCase()}`)
        );
        if (remaining.length === 0) {
          ctx.storyFlags.add('BARGAIN_SHOP_BOUGHT_OUT');
        }

        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            `BARGAIN MERCHANT: Step right up! Here's your bargain ${nextItem.name} for ¥${nextItem.price}!`,
            `Thank you for your purchase!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast(`💎 Purchased ${nextItem.name} for ¥${nextItem.price}!`);
          }
        );
        return true;
      },
    },
  ];
}
