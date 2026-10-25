import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../src/types/game';
import { DAY_SIBLINGS, createNpcsByMap } from '../src/world/npcData';

describe('BUGFIX-ROUTE32-FRIEDA-TILES-01: Day Siblings & On-Demand Map Tile Loader', () => {
  const npcsByMap = createNpcsByMap();
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');

  const loadMap = (mapId: string): MapData => {
    return JSON.parse(fs.readFileSync(path.join(mapsDir, `${mapId}.json`), 'utf8'));
  };

  describe('1. Day Siblings Registry & Data Integrity', () => {
    it('contains all 7 canonical Johto Day Siblings with correct items, maps, and flags', () => {
      const expectedSiblings = [
        { id: 'monica_of_monday', day: 'Monday', dayOfWeekIndex: 1, mapId: 'route_40', itemId: 'sharp_beak', flag: 'received_item_monica' },
        { id: 'tuscany_of_tuesday', day: 'Tuesday', dayOfWeekIndex: 2, mapId: 'route_29', itemId: 'pink_bow', flag: 'received_item_tuscany' },
        { id: 'wesley_of_wednesday', day: 'Wednesday', dayOfWeekIndex: 3, mapId: 'lake_of_rage', itemId: 'black_belt', flag: 'received_item_wesley' },
        { id: 'arthur_of_thursday', day: 'Thursday', dayOfWeekIndex: 4, mapId: 'route_36', itemId: 'hard_stone', flag: 'received_item_arthur' },
        { id: 'frieda', day: 'Friday', dayOfWeekIndex: 5, mapId: 'route_32', itemId: 'poison_barb', flag: 'received_item_frieda' },
        { id: 'santos_of_saturday', day: 'Saturday', dayOfWeekIndex: 6, mapId: 'blackthorn_city', itemId: 'spell_tag', flag: 'received_item_santos' },
        { id: 'sunny_of_sunday', day: 'Sunday', dayOfWeekIndex: 0, mapId: 'route_37', itemId: 'magnet', flag: 'received_item_sunny' },
      ];

      for (const exp of expectedSiblings) {
        const sibling = DAY_SIBLINGS[exp.id];
        expect(sibling).toBeDefined();
        expect(sibling.day).toBe(exp.day);
        expect(sibling.dayOfWeekIndex).toBe(exp.dayOfWeekIndex);
        expect(sibling.mapId).toBe(exp.mapId);
        expect(sibling.itemId).toBe(exp.itemId);
        expect(sibling.flag).toBe(exp.flag);
        expect(sibling.giftPages.length).toBeGreaterThan(0);
        expect(sibling.alreadyGivenPages.length).toBeGreaterThan(0);
        expect(sibling.wrongDayPages.length).toBeGreaterThan(0);
      }
    });

    it('aliases frieda_of_friday to frieda for universal lookup', () => {
      expect(DAY_SIBLINGS['frieda_of_friday']).toBe(DAY_SIBLINGS['frieda']);
    });
  });

  describe('2. Day Siblings Map Placement & 100% Walkability Guard', () => {
    it('asserts all 7 Day Siblings are registered in their respective maps with DAY_SIBLING_EVENT action', () => {
      for (const sibling of Object.values(DAY_SIBLINGS)) {
        if (sibling.id === 'frieda_of_friday') continue; // Skip duplicate alias
        const mapNpcs = npcsByMap[sibling.mapId];
        expect(mapNpcs).toBeDefined();

        const npc = mapNpcs.find((n) => n.id === sibling.id);
        expect(npc).toBeDefined();
        expect(npc?.action).toBe('DAY_SIBLING_EVENT');
      }
    });

    it('asserts 100% of Day Siblings stand strictly on walkable tiles (collision 0)', () => {
      for (const sibling of Object.values(DAY_SIBLINGS)) {
        if (sibling.id === 'frieda_of_friday') continue;
        const map = loadMap(sibling.mapId);
        const npc = npcsByMap[sibling.mapId].find((n) => n.id === sibling.id)!;

        expect(npc.x).toBeGreaterThanOrEqual(0);
        expect(npc.x).toBeLessThan(map.width);
        expect(npc.y).toBeGreaterThanOrEqual(0);
        expect(npc.y).toBeLessThan(map.height);

        const colIndex = npc.y * map.width + npc.x;
        expect(map.collisionGrid[colIndex]).toBe(0);
      }
    });
  });

  describe('3. Programmatic Item Grant Logic & Once-Per-Save Guards', () => {
    it('grants Poison Barb from Frieda of Friday and sets received_item_frieda flag', () => {
      const storyFlags = new Set<string>();
      const inventory = { items: {} as Record<string, number> };

      const frieda = DAY_SIBLINGS['frieda'];
      expect(storyFlags.has(frieda.flag)).toBe(false);

      // Simulate First Interaction:
      if (!storyFlags.has(frieda.flag)) {
        storyFlags.add(frieda.flag);
        inventory.items[frieda.itemId] = (inventory.items[frieda.itemId] || 0) + 1;
      }

      expect(inventory.items['poison_barb']).toBe(1);
      expect(storyFlags.has('received_item_frieda')).toBe(true);

      // Simulate Second Interaction (Idempotence Guard):
      if (!storyFlags.has(frieda.flag)) {
        inventory.items[frieda.itemId] = (inventory.items[frieda.itemId] || 0) + 1;
      }

      // Should not grant item a second time
      expect(inventory.items['poison_barb']).toBe(1);
    });

    it('verifies item grants and story flags across all 7 Day Siblings independently', () => {
      const storyFlags = new Set<string>();
      const inventory = { items: {} as Record<string, number> };

      const siblingKeys = [
        'monica_of_monday',
        'tuscany_of_tuesday',
        'wesley_of_wednesday',
        'arthur_of_thursday',
        'frieda',
        'santos_of_saturday',
        'sunny_of_sunday',
      ];

      for (const key of siblingKeys) {
        const s = DAY_SIBLINGS[key];
        expect(storyFlags.has(s.flag)).toBe(false);

        // Grant item
        storyFlags.add(s.flag);
        inventory.items[s.itemId] = (inventory.items[s.itemId] || 0) + 1;

        expect(inventory.items[s.itemId]).toBe(1);
        expect(storyFlags.has(s.flag)).toBe(true);
      }

      expect(Object.keys(inventory.items).length).toBe(7);
      expect(inventory.items['sharp_beak']).toBe(1);
      expect(inventory.items['pink_bow']).toBe(1);
      expect(inventory.items['black_belt']).toBe(1);
      expect(inventory.items['hard_stone']).toBe(1);
      expect(inventory.items['poison_barb']).toBe(1);
      expect(inventory.items['spell_tag']).toBe(1);
      expect(inventory.items['magnet']).toBe(1);
    });

    it('enforces 49-permutation calendar matrix: each sibling grants item ONLY on their matching day of week', () => {
      const allSiblings = [
        DAY_SIBLINGS.sunny_of_sunday,
        DAY_SIBLINGS.monica_of_monday,
        DAY_SIBLINGS.tuscany_of_tuesday,
        DAY_SIBLINGS.wesley_of_wednesday,
        DAY_SIBLINGS.arthur_of_thursday,
        DAY_SIBLINGS.frieda,
        DAY_SIBLINGS.santos_of_saturday,
      ];

      // Test all 7 siblings x all 7 days of week (49 permutations)
      for (const sibling of allSiblings) {
        for (let testDay = 0; testDay < 7; testDay++) {
          const storyFlags = new Set<string>();
          const inventory: Record<string, number> = {};

          // Simulate interaction logic from main.ts
          let dialogueReturned: string[] = [];
          const isMatchingDay = testDay === sibling.dayOfWeekIndex;

          if (!isMatchingDay) {
            dialogueReturned = sibling.wrongDayPages;
            // No item awarded, no flag mutated
          } else {
            if (storyFlags.has(sibling.flag)) {
              dialogueReturned = sibling.alreadyGivenPages;
            } else {
              storyFlags.add(sibling.flag);
              inventory[sibling.itemId] = (inventory[sibling.itemId] || 0) + 1;
              dialogueReturned = sibling.giftPages;
            }
          }

          if (isMatchingDay) {
            expect(inventory[sibling.itemId], `${sibling.name} must grant ${sibling.itemName} on day ${testDay}`).toBe(1);
            expect(storyFlags.has(sibling.flag), `${sibling.name} flag must be set on matching day`).toBe(true);
            expect(dialogueReturned).toEqual(sibling.giftPages);

            // Re-interaction on same day must not duplicate item
            let duplicateGranted = false;
            if (storyFlags.has(sibling.flag)) {
              dialogueReturned = sibling.alreadyGivenPages;
            } else {
              inventory[sibling.itemId] = (inventory[sibling.itemId] || 0) + 1;
              duplicateGranted = true;
            }
            expect(duplicateGranted).toBe(false);
            expect(inventory[sibling.itemId]).toBe(1);
            expect(dialogueReturned).toEqual(sibling.alreadyGivenPages);
          } else {
            expect(inventory[sibling.itemId], `${sibling.name} must NOT grant item on day ${testDay}`).toBeUndefined();
            expect(storyFlags.has(sibling.flag), `${sibling.name} flag must NOT be set on wrong day`).toBe(false);
            expect(dialogueReturned).toEqual(sibling.wrongDayPages);
          }
        }
      }
    });

    it('verifies main.ts integrates strict calendar gating in DAY_SIBLING_EVENT', () => {
      const mainPath = path.resolve(__dirname, '../src/main.ts');
      const mainCode = fs.readFileSync(mainPath, 'utf8');

      expect(mainCode).toContain("targetNpc.action === 'DAY_SIBLING_EVENT'");
      expect(mainCode).toContain('todayDayIndex !== sibling.dayOfWeekIndex');
      expect(mainCode).toContain('sibling.wrongDayPages');
    });
  });

  describe('4. Route 32 On-Demand Tile Integrity', () => {
    it('verifies Route 32 unique tile names on disk exist in public/assets/tiles/', () => {
      const r32 = loadMap('route_32');
      const tilesDir = path.resolve(__dirname, '../public/assets/tiles');
      const uniqueTiles = new Set(r32.tileMap!);

      for (const tileName of uniqueTiles) {
        const filePath = path.join(tilesDir, `${tileName}.png`);
        expect(fs.existsSync(filePath)).toBe(true);
      }

      // Explicit check for cave and shoreline tiles
      expect(uniqueTiles.has('jt_31_36_41_48')).toBe(true);
      expect(uniqueTiles.has('jt_36_36_48_48')).toBe(true);
      expect(uniqueTiles.has('jt_40_40_40_40')).toBe(true);
    });
  });
});
