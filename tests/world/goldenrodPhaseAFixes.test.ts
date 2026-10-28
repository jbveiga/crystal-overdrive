import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getGoldenrodExpansionInteractions,
  BITTER_HERB_SHOP_ITEMS,
  BARGAIN_SHOP_ITEMS,
} from '../../src/world/interactions/GoldenrodExpansionInteractions';
import { getGoldenrodAndRoute34Interactions } from '../../src/world/interactions/GoldenrodAndRoute34Interactions';
import { createGoldenrodCityNpcs } from '../../src/world/npcs/goldenrodCityNpcs';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-GOLDENROD-PHASE-A-01: Bike Shop, Day-Care Warps & Underground Merchants', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');

  describe('1. Goldenrod Bike Shop Tileset & Bicycle BgEvents', () => {
    it('uses authentic champions_room tileset and valid dimensions (8x8)', () => {
      const bikeShop: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_bike_shop.json'), 'utf8')
      );
      expect(bikeShop.id).toBe('goldenrod_bike_shop');
      expect(bikeShop.width).toBe(8);
      expect(bikeShop.height).toBe(8);

      // Verify all tiles use in_champions_room prefix
      for (const tileId of bikeShop.tileMap) {
        expect(tileId).toMatch(/^in_champions_room_/);
      }

      // Exit carpets at (2, 7) and (3, 7)
      expect(bikeShop.collisionGrid[7 * 8 + 2]).toBe(0);
      expect(bikeShop.collisionGrid[7 * 8 + 3]).toBe(0);

      // Counter in front of clerk at (6, 2) is solid 1, clerk floor at (7, 2) is walkable 0
      expect(bikeShop.collisionGrid[2 * 8 + 6]).toBe(1);
      expect(bikeShop.collisionGrid[2 * 8 + 7]).toBe(0);
    });

    it('asserts Clerk NPC stands behind counter at (7, 2) facing LEFT with BIKE_SHOP_CLERK action', () => {
      const cityNpcs = createGoldenrodCityNpcs();
      const npcs = cityNpcs.goldenrod_bike_shop;
      expect(npcs).toBeDefined();
      const clerk = npcs.find((n) => n.id === 'goldenrod_bike_shop_clerk');
      expect(clerk).toBeDefined();
      expect(clerk?.x).toBe(7);
      expect(clerk?.y).toBe(2);
      expect(clerk?.direction).toBe('LEFT');
      expect(clerk?.action).toBe('BIKE_SHOP_CLERK');
    });

    it('asserts all 9 canonical bicycle bgEvents exist with authentic dialogue', () => {
      const bikeShop: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_bike_shop.json'), 'utf8')
      );
      const expectedCoords = [
        { x: 1, y: 2 },
        { x: 0, y: 3 },
        { x: 1, y: 3 },
        { x: 0, y: 5 },
        { x: 1, y: 5 },
        { x: 0, y: 6 },
        { x: 1, y: 6 },
        { x: 6, y: 6 },
        { x: 7, y: 6 },
      ];

      expect(bikeShop.bgEvents).toHaveLength(9);
      for (const coord of expectedCoords) {
        const bgEvent = bikeShop.bgEvents.find((e) => e.x === coord.x && e.y === coord.y);
        expect(bgEvent, `Expected bicycle bgEvent at (${coord.x}, ${coord.y})`).toBeDefined();
        expect(bgEvent?.speaker).toBe('🚲 BICYCLE');
        expect(bgEvent?.pages).toContain("It's a shiny new BICYCLE!");
      }
    });

    it('verifies Bike Shop Clerk awards BICYCLE with BIKE_SHOP_CLERK action in interactions', () => {
      const interactions = getGoldenrodAndRoute34Interactions();
      const bikeReg = interactions.find(
        (i) => i.actions?.includes('BIKE_SHOP_CLERK') || i.npcIds?.includes('goldenrod_bike_shop_clerk')
      );
      expect(bikeReg).toBeDefined();

      let dialogueShown: string[] = [];
      const mockCtx: Partial<NpcInteractionContext> = {
        playerName: 'Gold',
        storyFlags: new Set<string>(),
        inventory: { money: 1000, badges: [], items: {}, balls: {}, tms: [], keyItems: [] },
        openDialogue: (pages) => {
          dialogueShown = pages;
        },
        saveCurrentGame: () => {},
        showToast: () => {},
      };

      const cityNpcs = createGoldenrodCityNpcs();
      const clerkNpc = cityNpcs.goldenrod_bike_shop.find(
        (n) => n.id === 'goldenrod_bike_shop_clerk'
      )!;
      bikeReg!.handler(clerkNpc, {} as any, mockCtx as NpcInteractionContext);

      expect(mockCtx.storyFlags!.has('HAS_BICYCLE')).toBe(true);
      expect(mockCtx.storyFlags!.has('EVENT_GOT_BICYCLE')).toBe(true);
      expect(mockCtx.inventory!.keyItems).toContain('BICYCLE');
      expect(dialogueShown.some((p) => p.includes('borrowed a BICYCLE'))).toBe(true);
    });
  });

  describe('2. Day-Care Side Warps & Route 34 Yard Reciprocity', () => {
    it('verifies day_care.json side warps (0, 5) and (0, 6) lead into Route 34 fenced yard (13, 15)', () => {
      const dayCare: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'day_care.json'), 'utf8')
      );
      const sideWarps = dayCare.warps.filter((w) => w.targetMapId === 'route_34');
      expect(sideWarps.length).toBeGreaterThanOrEqual(4);

      const warp05 = sideWarps.find((w) => w.x === 0 && w.y === 5);
      const warp06 = sideWarps.find((w) => w.x === 0 && w.y === 6);

      expect(warp05).toEqual({ x: 0, y: 5, targetMapId: 'route_34', targetX: 13, targetY: 15 });
      expect(warp06).toEqual({ x: 0, y: 6, targetMapId: 'route_34', targetX: 13, targetY: 15 });

      // Landing tiles in day_care are walkable 0
      expect(dayCare.collisionGrid[5 * dayCare.width + 0]).toBe(0);
      expect(dayCare.collisionGrid[6 * dayCare.width + 0]).toBe(0);
    });

    it('verifies route_34.json reciprocal yard warp at (13, 15) leads back into day_care (0, 5)', () => {
      const route34: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'route_34.json'), 'utf8')
      );
      const yardWarp = route34.warps.find(
        (w) => w.targetMapId === 'day_care' && w.x === 13 && w.y === 15
      );
      expect(yardWarp).toBeDefined();
      expect(yardWarp).toEqual({ x: 13, y: 15, targetMapId: 'day_care', targetX: 0, targetY: 5 });

      // Landing tile in Route 34 yard is walkable 0
      expect(route34.collisionGrid[15 * route34.width + 13]).toBe(0);
    });
  });

  describe('3. Underground Specialty Merchants (Bitter Herbs & Bargain Shop)', () => {
    let mockContext: Partial<NpcInteractionContext>;

    beforeEach(() => {
      mockContext = {
        playerName: 'Gold',
        playerParty: [PokemonFactory.create('totodile', 12)],
        inventory: { money: 10000, badges: [], items: {}, balls: {}, tms: [], keyItems: [] },
        storyFlags: new Set<string>(),
        openDialogue: (_pages, _speaker, onComplete) => {
          if (onComplete) onComplete();
        },
        showToast: () => {},
        saveCurrentGame: () => {},
        openMart: () => {},
      };
    });

    it('exports authentic BITTER_HERB_SHOP_ITEMS catalog and pricing', () => {
      expect(BITTER_HERB_SHOP_ITEMS).toEqual([
        { id: 'energypowder', name: 'ENERGYPOWDER', price: 500, category: 'MEDICINE' },
        { id: 'energy_root', name: 'ENERGY ROOT', price: 800, category: 'MEDICINE' },
        { id: 'heal_powder', name: 'HEAL POWDER', price: 450, category: 'MEDICINE' },
        { id: 'revival_herb', name: 'REVIVAL HERB', price: 2800, category: 'MEDICINE' },
      ]);
    });

    it('exports authentic BARGAIN_SHOP_ITEMS catalog, pricing, and resale margins', () => {
      expect(BARGAIN_SHOP_ITEMS).toEqual([
        { id: 'nugget', name: 'NUGGET', price: 4500, resalePrice: 5000, category: 'VALUABLE' },
        { id: 'pearl', name: 'PEARL', price: 650, resalePrice: 700, category: 'VALUABLE' },
        { id: 'big_pearl', name: 'BIG PEARL', price: 3500, resalePrice: 3750, category: 'VALUABLE' },
        { id: 'stardust', name: 'STARDUST', price: 950, resalePrice: 1000, category: 'VALUABLE' },
        { id: 'star_piece', name: 'STAR PIECE', price: 4600, resalePrice: 4900, category: 'VALUABLE' },
      ]);
    });

    it('asserts Bitter Merchant is closed on weekdays (Mon-Fri) and informs player', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const bitterReg = interactions.find((i) => i.actions?.includes('BITTER_MERCHANT'));
      expect(bitterReg).toBeDefined();

      let dialogueShown: string[] = [];
      mockContext.openDialogue = (pages) => {
        dialogueShown = pages;
      };

      // Test Wednesday (day 3)
      mockContext.gameClock = { getDayOfWeek: () => 3, getTimeOfDay: () => 'DAY' } as any;
      const targetNpc = { id: 'bitter_merchant', speaker: '🌿 HERB SHOP', x: 2, y: 6 } as any;

      bitterReg!.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(dialogueShown[0]).toContain("We're not open today. We only sell our herbs on weekends!");
      expect(mockContext.inventory!.money).toBe(10000); // No money deducted
    });

    it('asserts Bitter Merchant opens on Saturday/Sunday and sells herbal medicine', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const bitterReg = interactions.find((i) => i.actions?.includes('BITTER_MERCHANT'))!;

      let toastShown = '';
      mockContext.showToast = (msg) => {
        toastShown = msg;
      };

      // Saturday (day 6)
      mockContext.gameClock = { getDayOfWeek: () => 6, getTimeOfDay: () => 'DAY' } as any;
      const targetNpc = { id: 'bitter_merchant', speaker: '🌿 HERB SHOP', x: 2, y: 6 } as any;

      bitterReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);

      // Should purchase first item: ENERGYPOWDER for ¥500
      expect(mockContext.inventory!.money).toBe(9500);
      expect(mockContext.inventory!.items['energypowder']).toBe(1);
      expect(toastShown).toContain('ENERGYPOWDER');
    });

    it('asserts Bargain Merchant is closed Tuesday through Sunday', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const bargainReg = interactions.find((i) => i.actions?.includes('BARGAIN_MERCHANT'))!;

      let dialogueShown: string[] = [];
      mockContext.openDialogue = (pages) => {
        dialogueShown = pages;
      };

      // Sunday (day 0)
      mockContext.gameClock = { getDayOfWeek: () => 0, getTimeOfDay: () => 'DAY' } as any;
      const targetNpc = { id: 'bargain_merchant', speaker: '💎 BARGAIN SHOP', x: 2, y: 8 } as any;

      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(dialogueShown[0]).toContain('Come back next Monday morning');
      expect(mockContext.inventory!.money).toBe(10000);
    });

    it('asserts Bargain Merchant opens on Monday, sells valuable items, and enforces 1-per-week buyout', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const bargainReg = interactions.find((i) => i.actions?.includes('BARGAIN_MERCHANT'))!;

      mockContext.gameClock = { getDayOfWeek: () => 1, getTimeOfDay: () => 'DAY' } as any;
      const targetNpc = { id: 'bargain_merchant', speaker: '💎 BARGAIN SHOP', x: 2, y: 8 } as any;

      // 1. Buy Nugget (¥4500)
      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(5500);
      expect(mockContext.inventory!.items['nugget']).toBe(1);
      expect(mockContext.storyFlags!.has('BARGAIN_BOUGHT_NUGGET')).toBe(true);

      // 2. Buy Pearl (¥650)
      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(4850);
      expect(mockContext.inventory!.items['pearl']).toBe(1);

      // 3. Buy Big Pearl (¥3500)
      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(1350);
      expect(mockContext.inventory!.items['big_pearl']).toBe(1);

      // 4. Buy Stardust (¥950)
      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(400);
      expect(mockContext.inventory!.items['stardust']).toBe(1);

      // 5. Star Piece costs ¥4600, but player only has ¥400
      let dialogue = '';
      mockContext.openDialogue = (pages) => {
        dialogue = pages[1] || pages[0];
      };
      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(dialogue).toContain("You don't have enough money right now!");

      // Give money and finish buying Star Piece
      mockContext.inventory!.money = 5000;
      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(400);
      expect(mockContext.inventory!.items['star_piece']).toBe(1);
      expect(mockContext.storyFlags!.has('BARGAIN_SHOP_BOUGHT_OUT')).toBe(true);

      // Subsequent interaction after bought out informs player to return next Monday
      bargainReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(dialogue).toContain('Come back next Monday morning');
    });
  });

  describe('4. Haircut Brothers Schedule, Pricing & Friendship Boosts', () => {
    let mockContext: Partial<NpcInteractionContext>;

    beforeEach(() => {
      mockContext = {
        playerName: 'Gold',
        playerParty: [PokemonFactory.create('pikachu', 15)],
        inventory: { money: 1000, badges: [], items: {}, balls: {}, tms: [], keyItems: [] },
        storyFlags: new Set<string>(),
        openDialogue: (_pages, _speaker, onComplete) => {
          if (onComplete) onComplete();
        },
        showToast: () => {},
        saveCurrentGame: () => {},
      };
      mockContext.playerParty![0].friendship = 100;
    });

    it('asserts Older Brother works Tue/Thu/Sat for ¥500 with +15 friendship', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const olderReg = interactions.find((i) => i.actions?.includes('OLDER_HAIRCUT_BROTHER'))!;
      const targetNpc = { id: 'older_haircut_brother', speaker: '✂️ OLDER HAIRCUT BROTHER' } as any;

      // Wednesday (day 3) -> off duty
      mockContext.gameClock = { getDayOfWeek: () => 3, getTimeOfDay: () => 'DAY' } as any;
      let text = '';
      mockContext.openDialogue = (pages) => {
        text = pages[0];
      };
      olderReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(text).toContain("I'm off duty today. I only work on Tuesday, Thursday, and Saturday!");

      // Tuesday (day 2) -> active
      mockContext.gameClock = { getDayOfWeek: () => 2, getTimeOfDay: () => 'DAY' } as any;
      olderReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(500);
      expect(mockContext.playerParty![0].friendship).toBe(115);
      expect(mockContext.storyFlags!.has('ENGINE_GOLDENROD_UNDERGROUND_GOT_HAIRCUT')).toBe(true);
      expect(mockContext.storyFlags!.has('HAIRCUT_TODAY')).toBe(true);

      // Same day second attempt blocked
      olderReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(text).toContain('That’s it for today! Come back tomorrow');
    });

    it('asserts Younger Brother works Sun/Wed/Fri for ¥300 with +10 friendship', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const youngerReg = interactions.find((i) => i.actions?.includes('YOUNGER_HAIRCUT_BROTHER'))!;
      const targetNpc = { id: 'younger_haircut_brother', speaker: '✂️ YOUNGER HAIRCUT BROTHER' } as any;

      // Thursday (day 4) -> taking a break
      mockContext.gameClock = { getDayOfWeek: () => 4, getTimeOfDay: () => 'DAY' } as any;
      let text = '';
      mockContext.openDialogue = (pages) => {
        text = pages[0];
      };
      youngerReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(text).toContain("I'm taking a break today. I work on Sunday, Wednesday, and Friday!");

      // Friday (day 5) -> active
      mockContext.gameClock = { getDayOfWeek: () => 5, getTimeOfDay: () => 'DAY' } as any;
      youngerReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(700);
      expect(mockContext.playerParty![0].friendship).toBe(110);
      expect(mockContext.storyFlags!.has('ENGINE_GOLDENROD_UNDERGROUND_GOT_HAIRCUT')).toBe(true);
      expect(mockContext.storyFlags!.has('HAIRCUT_TODAY')).toBe(true);

      // Same day second attempt blocked
      youngerReg.handler(targetNpc, {} as any, mockContext as NpcInteractionContext);
      expect(text).toContain('I only do one haircut per day. Check back tomorrow!');
    });
  });
});
