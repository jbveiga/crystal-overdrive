import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createGoldenrodCityNpcs } from '../../src/world/npcs/goldenrodCityNpcs';

describe('TICKET-WORLD-GOLDENROD-SIGNS-UNDERGROUND-AND-TILES-01: Goldenrod Signs & Underground Verification', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const worldMapsPath = path.resolve(__dirname, '../../public/assets/data/world_maps.json');

  const cityMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'goldenrod_city.json'), 'utf8'));
  const undergroundMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'goldenrod_underground.json'), 'utf8'));

  describe('1. Goldenrod City Canonical Signs (13 Physical Metatiles)', () => {
    it('contains exactly 13 canonical signposts in bgEvents', () => {
      expect(cityMap.bgEvents).toBeDefined();
      expect(cityMap.bgEvents?.length).toBe(13);
    });

    const expectedSigns = [
      { x: 10, y: 14, speaker: '🚅 GOLDENROD MAGNET TRAIN STATION', snippet: 'Super High-Speed Magnet Train' },
      { x: 4, y: 17, speaker: '📻 RADIO TOWER', snippet: 'GOLDENROD CITY RADIO TOWER' },
      { x: 26, y: 27, speaker: '🏬 DEPT. STORE', snippet: 'Full Selection of POKéMON Goods!' },
      { x: 26, y: 9, speaker: '🏆 GOLDENROD GYM', snippet: 'LEADER: WHITNEY' },
      { x: 22, y: 18, speaker: '🏙️ GOLDENROD CITY', snippet: 'The Festive City of Opulent Charm' },
      { x: 28, y: 30, speaker: '🚲 BIKE SHOP', snippet: 'BIKE SHOP — MIRACLE CYCLE' },
      { x: 16, y: 22, speaker: '🎰 GAME CORNER', snippet: 'GOLDENROD CITY GAME CORNER' },
      { x: 12, y: 7, speaker: '👴 NAME RATER', snippet: 'Get Your POKéMON Nicknames Rated!' },
      { x: 8, y: 6, speaker: '🚇 UNDERGROUND ENTRANCE', snippet: 'Travel Beneath Goldenrod City' },
      { x: 12, y: 30, speaker: '🚇 UNDERGROUND ENTRANCE', snippet: 'Travel Beneath Goldenrod City' },
      { x: 16, y: 27, speaker: '🏥 POKéMON CENTER', snippet: 'Heal Your POKéMON to Full Health!' },
      { x: 30, y: 6, speaker: '🌸 FLOWER SHOP', snippet: 'Blooming Beautiful' },
      { x: 4, y: 25, speaker: "🏠 BILL'S HOUSE", snippet: "BILL'S HOUSE" },
    ];

    it.each(expectedSigns)('has valid signpost at ($x, $y) with title $speaker', ({ x, y, speaker, snippet }) => {
      const sign = cityMap.bgEvents?.find((s) => s.x === x && s.y === y);
      expect(sign).toBeDefined();
      expect(sign?.speaker).toBe(speaker);
      expect(sign?.pages.some((p) => p.includes(snippet))).toBe(true);

      // Signpost physical tile must be collision 1 (solid signpost / wall placard to talk against)
      const tileCollision = cityMap.collisionGrid[y * cityMap.width + x];
      expect(tileCollision).toBe(1);
    });
  });

  describe('2. Bidirectional Underground Warps & Reciprocity', () => {
    it('verifies Goldenrod City North and South Underground entry warps', () => {
      const northWarp = cityMap.warps.find((w) => w.x === 9 && w.y === 5);
      expect(northWarp).toBeDefined();
      expect(northWarp).toEqual({
        x: 9,
        y: 5,
        targetMapId: 'goldenrod_underground',
        targetX: 3,
        targetY: 3,
      });

      const southWarp = cityMap.warps.find((w) => w.x === 11 && w.y === 29);
      expect(southWarp).toBeDefined();
      expect(southWarp).toEqual({
        x: 11,
        y: 29,
        targetMapId: 'goldenrod_underground',
        targetX: 3,
        targetY: 33,
      });
    });

    it('verifies Goldenrod Underground exit warps to Goldenrod City street', () => {
      const northExit = undergroundMap.warps.find((w) => w.x === 3 && w.y === 2);
      expect(northExit).toBeDefined();
      expect(northExit).toEqual({
        x: 3,
        y: 2,
        targetMapId: 'goldenrod_city',
        targetX: 9,
        targetY: 6,
      });

      const southExit = undergroundMap.warps.find((w) => w.x === 3 && w.y === 34);
      expect(southExit).toBeDefined();
      expect(southExit).toEqual({
        x: 3,
        y: 34,
        targetMapId: 'goldenrod_city',
        targetX: 11,
        targetY: 30,
      });
    });

    it('asserts warp landing and target street tiles are 100% walkable', () => {
      // Goldenrod City: landing outside North entrance (9, 6) and South entrance (11, 30)
      expect(cityMap.collisionGrid[6 * cityMap.width + 9]).toBe(0);
      expect(cityMap.collisionGrid[30 * cityMap.width + 11]).toBe(0);

      // Goldenrod Underground: landing tiles from North (3, 3) and South (3, 33)
      expect(undergroundMap.collisionGrid[3 * undergroundMap.width + 3]).toBe(0);
      expect(undergroundMap.collisionGrid[33 * undergroundMap.width + 3]).toBe(0);

      // Underground stair warp tiles themselves must be walkable so warp triggers
      expect(undergroundMap.collisionGrid[2 * undergroundMap.width + 3]).toBe(0);
      expect(undergroundMap.collisionGrid[34 * undergroundMap.width + 3]).toBe(0);
    });
  });

  describe('3. Goldenrod Underground Authentic Tileset & Corridor Walkability', () => {
    it('verifies map dimensions and authentic gate tileset metatiles', () => {
      expect(undergroundMap.id).toBe('goldenrod_underground');
      expect(undergroundMap.width).toBe(30);
      expect(undergroundMap.height).toBe(36);
      expect(undergroundMap.collisionGrid.length).toBe(30 * 36);

      // Tileset check: verify tile textures use in_gate_*
      const hasGateTiles = undergroundMap.tileMap?.some((t) => typeof t === 'string' && t.startsWith('in_gate_'));
      expect(hasGateTiles).toBe(true);
    });

    it('ensures 100% walkable traversal along central corridor x=3, y=2..34', () => {
      for (let y = 2; y <= 34; y++) {
        const col = undergroundMap.collisionGrid[y * undergroundMap.width + 3];
        expect(col, `Expected corridor tile at (3, ${y}) to be walkable (0)`).toBe(0);
      }
    });
  });

  describe('4. Goldenrod Underground NPC Alignment & Counter Interactivity', () => {
    const npcs = createGoldenrodCityNpcs().goldenrod_underground;

    it('registers all 9 canonical NPCs in goldenrod_underground', () => {
      expect(npcs).toBeDefined();
      expect(npcs.length).toBe(9);
    });

    it('verifies Haircut Brothers and Merchants positions behind counters with talkAcrossCounter', () => {
      const olderBrother = npcs.find((n) => n.id === 'older_haircut_brother');
      expect(olderBrother).toBeDefined();
      expect(olderBrother?.x).toBe(2);
      expect(olderBrother?.y).toBe(11);
      expect(olderBrother?.direction).toBe('RIGHT');
      expect(olderBrother?.talkAcrossCounter).toBe(true);
      expect(olderBrother?.action).toBe('OLDER_HAIRCUT_BROTHER');

      const youngerBrother = npcs.find((n) => n.id === 'younger_haircut_brother');
      expect(youngerBrother).toBeDefined();
      expect(youngerBrother?.x).toBe(2);
      expect(youngerBrother?.y).toBe(12);
      expect(youngerBrother?.direction).toBe('RIGHT');
      expect(youngerBrother?.talkAcrossCounter).toBe(true);
      expect(youngerBrother?.action).toBe('YOUNGER_HAIRCUT_BROTHER');

      const bitterMerchant = npcs.find((n) => n.id === 'bitter_merchant');
      expect(bitterMerchant).toBeDefined();
      expect(bitterMerchant?.x).toBe(2);
      expect(bitterMerchant?.y).toBe(6);
      expect(bitterMerchant?.direction).toBe('RIGHT');
      expect(bitterMerchant?.talkAcrossCounter).toBe(true);
      expect(bitterMerchant?.action).toBe('OPEN_MART');

      const bargainMerchant = npcs.find((n) => n.id === 'bargain_merchant');
      expect(bargainMerchant).toBeDefined();
      expect(bargainMerchant?.x).toBe(2);
      expect(bargainMerchant?.y).toBe(8);
      expect(bargainMerchant?.direction).toBe('RIGHT');
      expect(bargainMerchant?.talkAcrossCounter).toBe(true);
      expect(bargainMerchant?.action).toBe('OPEN_MART');
    });

    it('verifies Underground trainers and Director positions', () => {
      const teru = npcs.find((n) => n.id === 'super_nerd_teru');
      expect(teru).toBeDefined();
      expect(teru?.x).toBe(6);
      expect(teru?.y).toBe(9);
      expect(teru?.direction).toBe('UP');

      const donald = npcs.find((n) => n.id === 'pokemaniac_donald');
      expect(donald).toBeDefined();
      expect(donald?.x).toBe(4);
      expect(donald?.y).toBe(14);
      expect(donald?.direction).toBe('UP');

      const issac = npcs.find((n) => n.id === 'pokemaniac_issac');
      expect(issac).toBeDefined();
      expect(issac?.x).toBe(3);
      expect(issac?.y).toBe(27);
      expect(issac?.direction).toBe('RIGHT');

      const eric = npcs.find((n) => n.id === 'super_nerd_eric');
      expect(eric).toBeDefined();
      expect(eric?.x).toBe(5);
      expect(eric?.y).toBe(31);
      expect(eric?.direction).toBe('LEFT');

      const director = npcs.find((n) => n.id === 'true_director');
      expect(director).toBeDefined();
      expect(director?.x).toBe(24);
      expect(director?.y).toBe(25);
      expect(director?.direction).toBe('DOWN');
      expect(director?.action).toBe('TRUE_DIRECTOR_EVENT');
    });

    it('asserts all 9 NPCs stand on valid walkable tiles in goldenrod_underground', () => {
      for (const npc of npcs) {
        const col = undergroundMap.collisionGrid[npc.y * undergroundMap.width + npc.x];
        expect(col, `NPC ${npc.id} at (${npc.x}, ${npc.y}) must stand on walkable tile (0)`).toBe(0);
      }
    });
  });

  describe('5. World Maps Bundling Verification', () => {
    it('verifies bundled world_maps.json matches goldenrod_city and goldenrod_underground', () => {
      const worldMaps: MapData[] = JSON.parse(fs.readFileSync(worldMapsPath, 'utf8'));
      const gc = worldMaps.find((m) => m.id === 'goldenrod_city');
      const gu = worldMaps.find((m) => m.id === 'goldenrod_underground');
      expect(gc).toBeDefined();
      expect(gu).toBeDefined();
      expect(gc?.bgEvents?.length).toBe(13);
      expect(gu?.width).toBe(30);
      expect(gu?.height).toBe(36);
    });
  });
});
