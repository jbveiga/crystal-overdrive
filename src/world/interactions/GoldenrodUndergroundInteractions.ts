/**
 * @fileoverview GoldenrodUndergroundInteractions domain module implementation.
 * Handles Goldenrod Underground Haircut Brothers, Bitter Herb Shop, and Monday Bargain Merchant.
 * @module world/interactions/GoldenrodUndergroundInteractions
 * @role GoldenrodUndergroundInteractions Component
 * @exports SpecialtyShopItem, BITTER_HERB_SHOP_ITEMS, BARGAIN_SHOP_ITEMS, getGoldenrodUndergroundInteractions
 * @layer world
 * @sections L1-38: Micro-Header & Shop Catalogs | L39-145: Haircut Brothers | L146-278: Herb & Bargain Merchants
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';

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

export function getGoldenrodUndergroundInteractions(): NpcInteractionRegistration[] {
  return [
    // 8. Underground Haircut Brothers
    {
      actions: ['OLDER_HAIRCUT_BROTHER'],
      npcIds: ['older_haircut_brother'],
      handler: (targetNpc, _map, ctx) => {
        const day = ctx.gameClock?.getDayOfWeek
          ? ctx.gameClock.getDayOfWeek()
          : ctx.gameClock
            ? -1
            : new Date().getDay();

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
          : ctx.gameClock
            ? -1
            : new Date().getDay();

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
          : ctx.gameClock
            ? -1
            : new Date().getDay();

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
          : ctx.gameClock
            ? -1
            : new Date().getDay();

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
