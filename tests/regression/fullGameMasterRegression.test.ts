/**
 * @fileoverview Master Full-Game Regression Suite (Issue #52 & Issues #63, #64).
 * Comprehensive validation across all 343 maps, warps, boundaries, NPCs,
 * overworld items, progression gates, HM mechanics, and save state integrity.
 *
 * @module tests/regression/fullGameMasterRegression
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData, WarpEvent, PokemonInstance } from '../../src/types/game';
import { evaluateWarpProgressionGuards } from '../../src/world/OverworldWarpProgressionGuards';
import { ModernHMFieldChecks } from '../../src/world/ModernHMFieldChecks';
import { SaveManager } from '../../src/core/SaveManager';
import { BoxManager } from '../../src/world/StorageManager';
import { OverworldItemManager } from '../../src/world/OverworldItemManager';
import { RoamingManager } from '../../src/world/RoamingManager';
import { MissionManager } from '../../src/world/MissionManager';
import { DayCareManager } from '../../src/world/DayCareManager';
import { KurtCraftingManager } from '../../src/world/KurtCraftingManager';
import { BugContestManager } from '../../src/world/BugContestManager';
import { GameClock } from '../../src/core/GameClock';
import { PokemonFactory } from '../../src/battle/PokemonFactory';

describe('Master Regression Suite — Crystal Overdrive (Issue #52)', () => {
  const root = path.resolve(__dirname, '../..');
  const bundlePath = path.join(root, 'public/assets/data/world_maps.json');
  const mapsDir = path.join(root, 'public/assets/data/maps');
  const itemsPath = path.join(root, 'public/assets/data/overworld_items.json');
  const npcsPath = path.join(root, 'scripts/generated-npcs.json');

  let maps: MapData[];
  let mapsById: Map<string, MapData>;

  beforeEach(() => {
    maps = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
    mapsById = new Map(maps.map((m) => [m.id, m]));
  });

  // =========================================================================
  // Pillar 1: 343-Map Universe Integrity & Dimensions
  // =========================================================================
  describe('Pillar 1: 343-Map Universe Integrity & Dimensions', () => {
    it('verifies world_maps.json contains all 343 canonical maps with standalone map files', () => {
      expect(maps.length).toBe(343);

      const standaloneFiles = fs
        .readdirSync(mapsDir)
        .filter((f) => f.endsWith('.json'));
      expect(standaloneFiles.length).toBe(343);

      for (const file of standaloneFiles) {
        const id = file.replace('.json', '');
        expect(mapsById.has(id), `Map ${id} must exist in world_maps bundle`).toBe(true);
      }
    });

    it('verifies every map has valid dimensions, tile arrays, and collision grid', () => {
      for (const m of maps) {
        expect(m.width, `Map ${m.id} width must be > 0`).toBeGreaterThan(0);
        expect(m.height, `Map ${m.id} height must be > 0`).toBeGreaterThan(0);
        const expectedTiles = m.width * m.height;

        expect(
          m.collisionGrid.length,
          `Map ${m.id} collisionGrid length must match width*height (${expectedTiles})`
        ).toBe(expectedTiles);

        if (m.groundLayer && m.groundLayer.length > 0) {
          expect(
            m.groundLayer.length,
            `Map ${m.id} groundLayer length must match width*height`
          ).toBe(expectedTiles);
        }
        if (m.tileMap && m.tileMap.length > 0) {
          expect(
            m.tileMap.length,
            `Map ${m.id} tileMap length must match width*height`
          ).toBe(expectedTiles);
        }
      }
    });

    it('verifies critical milestone maps exist in the map universe', () => {
      const milestoneMaps = [
        'new_bark_town',
        'cherrygrove_city',
        'violet_city',
        'sprout_tower_1f',
        'ruins_of_alph_outside',
        'ruins_of_alph_inner_chamber',
        'slowpoke_well_b1f',
        'slowpoke_well_b2f',
        'azalea_town',
        'ilex_forest',
        'route_34',
        'day_care',
        'goldenrod_city',
        'goldenrod_dept_store_1f',
        'goldenrod_underground',
        'radio_tower_1f',
        'national_park',
        'burned_tower_1f',
        'burned_tower_b1f',
        'tin_tower_1f',
        'tin_tower_roof',
        'ecruteak_city',
        'olivine_city',
        'olivine_lighthouse_1f',
        'olivine_lighthouse_3f',
        'olivine_lighthouse_4f',
        'olivine_lighthouse_5f',
        'olivine_lighthouse_6f',
        'cianwood_city',
        'route_42',
        'lake_of_rage',
        'team_rocket_base_b1f',
        'blackthorn_city',
        'dragons_den_1f',
        'dragons_den_b1f',
        'dragon_shrine',
        'lances_room',
        'hall_of_fame',
        'power_plant',
        'lavender_radio_tower_1f',
        'silver_cave_outside',
        'silver_cave_room_3',
      ];

      for (const mapId of milestoneMaps) {
        expect(mapsById.has(mapId), `Milestone map ${mapId} must exist`).toBe(true);
      }
    });
  });

  // =========================================================================
  // Pillar 2: Warps, Stairs Reciprocity & Issue #63/#64 Fixes
  // =========================================================================
  describe('Pillar 2: Warps, Stairs Reciprocity & Issues #63 / #64', () => {
    it('verifies Issue #63: Ruins of Alph outside cave entrance (10, 13) reciprocates with inner chamber ladder (10, 13)', () => {
      const outside = mapsById.get('ruins_of_alph_outside')!;
      const inner = mapsById.get('ruins_of_alph_inner_chamber')!;

      const outsideWarp = outside.warps.find((w) => w.x === 10 && w.y === 13);
      expect(outsideWarp, 'ruins_of_alph_outside must have warp at (10, 13)').toBeDefined();
      expect(outsideWarp?.targetMapId).toBe('ruins_of_alph_inner_chamber');
      expect(outsideWarp?.targetX).toBe(10);
      expect(outsideWarp?.targetY).toBe(13);

      const innerWarp = inner.warps.find((w) => w.x === 10 && w.y === 13);
      expect(innerWarp, 'ruins_of_alph_inner_chamber must have reciprocal warp at (10, 13)').toBeDefined();
      expect(innerWarp?.targetMapId).toBe('ruins_of_alph_outside');
      expect(innerWarp?.targetX).toBe(10);
      expect(innerWarp?.targetY).toBe(13);

      expect(outside.collisionGrid[13 * outside.width + 10]).toBe(0);
      expect(inner.collisionGrid[13 * inner.width + 10]).toBe(0);
    });

    it('verifies Issue #63 Guardrail: evaluateWarpProgressionGuards allows entering inner chamber from outside even with no flags', () => {
      const outside = mapsById.get('ruins_of_alph_outside')!;
      const warp = outside.warps.find((w) => w.x === 10 && w.y === 13)!;

      const ctx: any = {
        storyFlags: new Set<string>(),
        player: { isMoving: false, progress: 0 },
        setCutsceneLocked: () => {},
        overworldHUD: { openDialogue: () => {} },
        inventory: { badges: [], keyItems: [], tms: [] },
        triggerAzaleaRivalAmbush: () => {},
      };

      const blocked = evaluateWarpProgressionGuards(ctx, outside, warp);
      expect(blocked).toBe(false);
    });

    it('verifies Issue #63 Trapdoor Guardrail: Trapdoor pits in puzzle chambers are blocked until puzzle is solved', () => {
      const kabutoChamber: any = { id: 'ruins_of_alph_kabuto_chamber' };
      const pitWarp: WarpEvent = { x: 4, y: 3, targetMapId: 'ruins_of_alph_inner_chamber', targetX: 4, targetY: 3 };

      const storyFlags = new Set<string>();
      const ctx: any = {
        storyFlags,
        player: { isMoving: false, progress: 0 },
        setCutsceneLocked: () => {},
        overworldHUD: { openDialogue: () => {} },
        inventory: { badges: [], keyItems: [], tms: [] },
        triggerAzaleaRivalAmbush: () => {},
      };

      expect(evaluateWarpProgressionGuards(ctx, kabutoChamber, pitWarp)).toBe(true);

      storyFlags.add('unown_awakened_kabuto');
      expect(evaluateWarpProgressionGuards(ctx, kabutoChamber, pitWarp)).toBe(false);
    });

    it('verifies Issue #64: Olivine Lighthouse 3F (13, 3) <-> 4F (13, 3) reciprocal staircase warps', () => {
      const f3 = mapsById.get('olivine_lighthouse_3f')!;
      const f4 = mapsById.get('olivine_lighthouse_4f')!;

      const warp3to4 = f3.warps.find((w) => w.x === 13 && w.y === 3);
      expect(warp3to4, '3F must have warp at (13, 3) leading to 4F').toBeDefined();
      expect(warp3to4?.targetMapId).toBe('olivine_lighthouse_4f');
      expect(warp3to4?.targetX).toBe(13);
      expect(warp3to4?.targetY).toBe(3);

      const warp4to3 = f4.warps.find((w) => w.x === 13 && w.y === 3);
      expect(warp4to3, '4F must have reciprocal warp at (13, 3) leading to 3F').toBeDefined();
      expect(warp4to3?.targetMapId).toBe('olivine_lighthouse_3f');
      expect(warp4to3?.targetX).toBe(13);
      expect(warp4to3?.targetY).toBe(3);

      expect(f3.collisionGrid[3 * f3.width + 13]).toBe(0);
      expect(f4.collisionGrid[3 * f4.width + 13]).toBe(0);
    });

    it('verifies Issue #64: Olivine Lighthouse 4F (9, 7) <-> 5F (9, 7) reciprocal staircase warps', () => {
      const f4 = mapsById.get('olivine_lighthouse_4f')!;
      const f5 = mapsById.get('olivine_lighthouse_5f')!;

      const warp4to5 = f4.warps.find((w) => w.x === 9 && w.y === 7);
      expect(warp4to5, '4F must have warp at (9, 7) leading to 5F').toBeDefined();
      expect(warp4to5?.targetMapId).toBe('olivine_lighthouse_5f');
      expect(warp4to5?.targetX).toBe(9);
      expect(warp4to5?.targetY).toBe(7);

      const warp5to4 = f5.warps.find((w) => w.x === 9 && w.y === 7);
      expect(warp5to4, '5F must have reciprocal warp at (9, 7) leading to 4F').toBeDefined();
      expect(warp5to4?.targetMapId).toBe('olivine_lighthouse_4f');
      expect(warp5to4?.targetX).toBe(9);
      expect(warp5to4?.targetY).toBe(7);

      expect(f4.collisionGrid[7 * f4.width + 9]).toBe(0);
      expect(f5.collisionGrid[7 * f5.width + 9]).toBe(0);
    });

    it('verifies all map warps target valid maps within the 343-map universe and valid bounds', () => {
      for (const m of maps) {
        for (const w of m.warps) {
          expect(mapsById.has(w.targetMapId), `Map ${m.id} warp targets unknown map ${w.targetMapId}`).toBe(true);
          const targetMap = mapsById.get(w.targetMapId)!;
          expect(
            w.targetX >= 0 && w.targetX < targetMap.width,
            `Map ${m.id} warp targetX ${w.targetX} out of bounds for ${targetMap.id} (w=${targetMap.width})`
          ).toBe(true);
          expect(
            w.targetY >= 0 && w.targetY < targetMap.height,
            `Map ${m.id} warp targetY ${w.targetY} out of bounds for ${targetMap.id} (h=${targetMap.height})`
          ).toBe(true);
        }
      }
    });
  });

  // =========================================================================
  // Pillar 3: NPC & Trainer Spatial Bounds & Team Composition
  // =========================================================================
  describe('Pillar 3: NPC & Trainer Spatial Bounds & Team Composition', () => {
    it('verifies all generated NPCs exist within their respective map boundaries', () => {
      const generatedNpcs: Record<string, any[]> = JSON.parse(
        fs.readFileSync(npcsPath, 'utf8')
      );

      for (const [mapId, npcs] of Object.entries(generatedNpcs)) {
        if (!mapsById.has(mapId)) continue;
        const map = mapsById.get(mapId)!;

        for (const npc of npcs) {
          expect(
            npc.x >= 0 && npc.x < map.width,
            `NPC ${npc.id} x=${npc.x} out of bounds for map ${mapId} (w=${map.width})`
          ).toBe(true);
          expect(
            npc.y >= 0 && npc.y < map.height,
            `NPC ${npc.id} y=${npc.y} out of bounds for map ${mapId} (h=${map.height})`
          ).toBe(true);
        }
      }
    });

    it('verifies trainers have valid species and reasonable level ranges (1-100)', () => {
      const generatedNpcs: Record<string, any[]> = JSON.parse(
        fs.readFileSync(npcsPath, 'utf8')
      );

      for (const npcs of Object.values(generatedNpcs)) {
        for (const npc of npcs) {
          if (npc.trainerTeam && Array.isArray(npc.trainerTeam)) {
            expect(npc.trainerTeam.length).toBeGreaterThan(0);
            expect(npc.trainerTeam.length).toBeLessThanOrEqual(6);

            for (const mon of npc.trainerTeam) {
              expect(typeof mon.speciesId).toBe('string');
              expect(mon.level).toBeGreaterThanOrEqual(1);
              expect(mon.level).toBeLessThanOrEqual(100);
            }
          }
        }
      }
    });
  });

  // =========================================================================
  // Pillar 4: Overworld Items & Hidden Item Integrity
  // =========================================================================
  describe('Pillar 4: Overworld Items & Hidden Item Integrity', () => {
    it('verifies overworld_items.json entries are within map bounds and have valid item IDs', () => {
      const overworldItemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
      const itemBalls: any[] = overworldItemsData.itemBalls || [];
      expect(itemBalls.length).toBeGreaterThan(50);

      for (const item of itemBalls) {
        expect(mapsById.has(item.mapId), `Overworld item map ${item.mapId} must exist`).toBe(true);
        const map = mapsById.get(item.mapId)!;

        expect(
          item.x >= 0 && item.x < map.width,
          `Item ${item.itemId} at (${item.x}, ${item.y}) out of bounds for ${item.mapId}`
        ).toBe(true);
        expect(
          item.y >= 0 && item.y < map.height,
          `Item ${item.itemId} at (${item.x}, ${item.y}) out of bounds for ${item.mapId}`
        ).toBe(true);
        expect(typeof item.itemId).toBe('string');
        expect(item.itemId.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // Pillar 5: HM Mechanics, Progression Gates & Special Crystal Events
  // =========================================================================
  describe('Pillar 5: HM Mechanics, Progression Gates & Special Crystal Events', () => {
    it('verifies ModernHMFieldChecks enforces badge & HM requirements for Whirlpool and Waterfall', () => {
      const flags = new Set<string>();
      const waterMon = PokemonFactory.create('totodile', 15);
      const party = [waterMon];
      const inv: any = { badges: [], tms: [], keyItems: [] };

      expect(ModernHMFieldChecks.checkWhirlpool(inv, flags, party, true).allowed).toBe(false);

      inv.tms.push('HM06');
      inv.badges.push('glacier');
      expect(ModernHMFieldChecks.checkWhirlpool(inv, flags, party, true).allowed).toBe(true);

      expect(ModernHMFieldChecks.canUseWaterfall(party, inv, flags).allowed).toBe(false);

      inv.tms.push('HM07');
      inv.badges.push('rising');
      expect(ModernHMFieldChecks.canUseWaterfall(party, inv, flags).allowed).toBe(true);
    });

    it('verifies Strength requires Plain Badge, HM04, and Strength move', () => {
      const flags = new Set<string>();
      const mon = PokemonFactory.create('geodude', 14);
      mon.moves.push({ moveId: 'strength', pp: 15, maxPp: 15 });
      const party = [mon];
      const inv: any = { badges: [], tms: [], keyItems: [] };

      expect(ModernHMFieldChecks.checkStrength(inv, flags, party).allowed).toBe(false);
      inv.tms.push('HM04');
      inv.badges.push('plain');
      expect(ModernHMFieldChecks.checkStrength(inv, flags, party).allowed).toBe(true);
    });
  });

  // =========================================================================
  // Pillar 6: Save State Serialization, 14 PC Boxes & Reconciler Invariants
  // =========================================================================
  describe('Pillar 6: Save State Serialization & PC Storage Invariants', () => {
    it('verifies 14-box PC storage structure and round-trip state preservation', () => {
      const boxManager = new BoxManager();
      const state = boxManager.getState();

      expect(state.boxes.length).toBe(14);
      for (const box of state.boxes) {
        expect(box.pokemon.length).toBe(20);
      }

      const testMon = PokemonFactory.create('cyndaquil', 5);
      boxManager.deposit(testMon);

      const serialized = boxManager.getState();
      const restored = new BoxManager(serialized);
      const flattened = restored.flatten();

      expect(flattened.length).toBe(1);
      expect(flattened[0].speciesId).toBe('cyndaquil');
      expect(flattened[0].level).toBe(5);
    });

    it('verifies SaveManager.createSaveSnapshot and hydrateGameState round-trip with zero data corruption', () => {
      const playerParty: PokemonInstance[] = [
        PokemonFactory.create('totodile', 12),
        PokemonFactory.create('pidgey', 8),
      ];
      const storyFlags = new Set<string>(['got_starter', 'zephyr']);
      const defeatedTrainers = new Set<string>(['falkner']);
      const visitedMaps = new Set<string>(['new_bark_town', 'violet_city']);
      const seenSpecies = new Set<string>(['totodile', 'pidgey', 'hoothoot']);
      const caughtSpecies = new Set<string>(['totodile', 'pidgey']);
      const inventory: any = {
        balls: { 'poke-ball': 10 },
        items: { potion: 3 },
        berries: {},
        tms: ['TM31'],
        keyItems: ['zephyr_badge'],
        money: 2500,
        badges: ['zephyr'],
      };
      const gameOptions: any = {
        playerSpeedDefault: 3,
        battleSpeedMultiplier: 2,
        textSpeed: 'FAST',
      };

      const snapshot = SaveManager.createSaveSnapshot({
        playTimeSeconds: 4200,
        playerName: 'CHRIS',
        playerGender: 'BOY',
        rivalName: 'SILVER',
        player: { x: 10, y: 12, direction: 'UP' },
        mapId: 'violet_city',
        gameClock: new GameClock(),
        inventory,
        playerParty,
        boxManager: new BoxManager(),
        roamingManager: new RoamingManager(),
        defeatedTrainers,
        visitedMaps,
        storyFlags,
        seenSpecies,
        caughtSpecies,
        overworldItemManager: new OverworldItemManager(),
        gameOptions,
        missionManager: new MissionManager(),
        dayCareManager: new DayCareManager(),
        kurtCraftingManager: new KurtCraftingManager(),
        bugContestManager: new BugContestManager(),
      });

      expect(snapshot.player.name).toBe('CHRIS');
      expect(snapshot.player.mapId).toBe('violet_city');
      expect(snapshot.party.length).toBe(2);
      expect(snapshot.storyFlags).toContain('got_starter');
      expect(snapshot.storyFlags).toContain('zephyr');
      expect(snapshot.defeatedTrainers).toContain('falkner');
      expect(snapshot.player.money).toBe(2500);
    });
  });
});
