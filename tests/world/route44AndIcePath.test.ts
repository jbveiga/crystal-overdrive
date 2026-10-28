import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getRoute44AndIcePathInteractions,
  handleStrengthBoulderDrop,
  handleIcePathWaterfallItem,
  handleBlackthornCityExitPrompt,
} from '../../src/world/interactions/Route44AndIcePathInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { EAST_JOHTO_GENERATED_NPCS } from '../../src/world/generated-npcs/eastJohtoGeneratedNpcs';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { createMahoganyToIndigoNpcs } from '../../src/world/npcs/mahoganyToIndigoNpcs';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { ModernHMHandler } from '../../src/world/ModernHMHandler';
import { AudioManager } from '../../src/audio/AudioManager';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-WORLD-ROUTE44-AND-ICE-PATH-01: Route 44, 7 Trainers, 5-Floor Ice Path & HM07 Waterfall', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;
  let savedGameCalled = false;
  let lastToastMessage = '';

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    savedGameCalled = false;
    lastToastMessage = '';

    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('feraligatr', 40, ['strength', 'surf', 'bite', 'slash'])],
      player: {
        id: 'player',
        x: 31,
        y: 8,
        targetX: 31,
        targetY: 8,
        renderX: 31 * 64,
        renderY: 8 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 30000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'],
        items: {},
        balls: {},
        tms: ['HM04'],
        keyItems: [],
      },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      openDialogue: (pages, speaker, onComplete) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        if (onComplete) onComplete();
      },
      showToast: (msg) => {
        lastToastMessage = msg;
      },
      saveCurrentGame: () => {
        savedGameCalled = true;
      },
      audioManager: {
        playSfx: () => {},
      } as any,
      renderMap: () => {},
    };
  });

  describe('1. Map Geometry, Integrity & Boundaries', () => {
    const route44AndIcePathMaps = [
      'route_44',
      'ice_path_1f',
      'ice_path_b1f',
      'ice_path_b2f_mahogany_side',
      'ice_path_b2f_blackthorn_side',
      'ice_path_b3f',
    ];

    it('asserts all 6 map files exist with valid dimensions and collision data', () => {
      for (const mapId of route44AndIcePathMaps) {
        const filePath = path.join(mapsDir, `${mapId}.json`);
        expect(fs.existsSync(filePath), `Map file for ${mapId} must exist on disk`).toBe(true);

        const mapData: MapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        expect(mapData.id).toBe(mapId);
        expect(mapData.width).toBeGreaterThan(0);
        expect(mapData.height).toBeGreaterThan(0);
        expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);
      }
    });

    it('asserts seamless walkable boundary between Mahogany Town east exit and Route 44 west entrance', () => {
      const mahoData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'mahogany_town.json'), 'utf8')
      );
      const r44Data: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'route_44.json'), 'utf8')
      );

      // In mahogany_town.json (width 30, height 18), east edge x=29, y=8..9 are walkable (0)
      const mahoTileY8 = mahoData.collisionGrid[8 * mahoData.width + 29];
      const mahoTileY9 = mahoData.collisionGrid[9 * mahoData.width + 29];
      expect(mahoTileY8, 'Mahogany Town exit at (29, 8) must be walkable').toBe(0);
      expect(mahoTileY9, 'Mahogany Town exit at (29, 9) must be walkable').toBe(0);

      // In route_44.json, west edge x=0, y=8..9 are walkable (0)
      const r44TileY8 = r44Data.collisionGrid[8 * r44Data.width + 0];
      const r44TileY9 = r44Data.collisionGrid[9 * r44Data.width + 0];
      expect(r44TileY8, 'Route 44 entrance at (0, 8) must be walkable').toBe(0);
      expect(r44TileY9, 'Route 44 entrance at (0, 9) must be walkable').toBe(0);
    });

    it('asserts Route 44 bgEvents contain both canonical signs', () => {
      const r44Data: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'route_44.json'), 'utf8')
      );
      expect(r44Data.bgEvents).toBeDefined();

      const icePathAheadSign = r44Data.bgEvents?.find((bg) => bg.x === 53 && bg.y === 7);
      expect(icePathAheadSign).toBeDefined();
      const iceSignText = icePathAheadSign?.text || icePathAheadSign?.pages?.[0];
      expect(iceSignText).toContain('ICE PATH AHEAD');

      const route44TownSign = r44Data.bgEvents?.find((bg) => bg.x === 6 && bg.y === 10);
      expect(route44TownSign).toBeDefined();
      const townSignText = route44TownSign?.text || route44TownSign?.pages?.[0];
      expect(townSignText).toContain('MAHOGANY TOWN');
      expect(townSignText).toContain('BLACKTHORN CITY');
    });
  });

  describe('2. Reciprocal Warp Network (Route 44 <-> Ice Path <-> Blackthorn City)', () => {
    it('asserts Route 44 cave entrance warps to Ice Path 1F with reciprocal return', () => {
      const r44Data: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'route_44.json'), 'utf8')
      );
      const ip1fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'ice_path_1f.json'), 'utf8')
      );

      const r44Warp = r44Data.warps.find((w) => w.targetMapId === 'ice_path_1f');
      expect(r44Warp).toBeDefined();
      expect(r44Warp).toEqual({ x: 56, y: 7, targetMapId: 'ice_path_1f', targetX: 4, targetY: 19 });

      const ip1fExit = ip1fData.warps.find((w) => w.targetMapId === 'route_44');
      expect(ip1fExit).toBeDefined();
      expect(ip1fExit).toEqual({ x: 4, y: 19, targetMapId: 'route_44', targetX: 56, targetY: 6 });
    });

    it('asserts multi-floor stairs connect all 5 cavern levels reciprocally', () => {
      const ip1fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'ice_path_1f.json'), 'utf8')
      );
      const ipB1fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'ice_path_b1f.json'), 'utf8')
      );
      const ipB2fMaho: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'ice_path_b2f_mahogany_side.json'), 'utf8')
      );
      const ipB2fBlack: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'ice_path_b2f_blackthorn_side.json'), 'utf8')
      );
      const ipB3fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'ice_path_b3f.json'), 'utf8')
      );

      // 1F <-> B1F
      const warp1fToB1fA = ip1fData.warps.find((w) => w.x === 37 && w.y === 5);
      expect(warp1fToB1fA).toEqual({ x: 37, y: 5, targetMapId: 'ice_path_b1f', targetX: 3, targetY: 15 });
      const warpB1fTo1fA = ipB1fData.warps.find((w) => w.x === 3 && w.y === 15);
      expect(warpB1fTo1fA).toEqual({ x: 3, y: 15, targetMapId: 'ice_path_1f', targetX: 37, targetY: 5 });

      // B1F <-> B2F Mahogany Side stairs
      const warpB1fToB2fStairs = ipB1fData.warps.find((w) => w.x === 17 && w.y === 3);
      expect(warpB1fToB2fStairs).toEqual({
        x: 17,
        y: 3,
        targetMapId: 'ice_path_b2f_mahogany_side',
        targetX: 17,
        targetY: 1,
      });
      const warpB2fToB1fStairs = ipB2fMaho.warps.find((w) => w.x === 17 && w.y === 1);
      expect(warpB2fToB1fStairs).toEqual({
        x: 17,
        y: 1,
        targetMapId: 'ice_path_b1f',
        targetX: 17,
        targetY: 3,
      });

      // B2F Mahogany Side <-> B3F
      const warpB2fToB3f = ipB2fMaho.warps.find((w) => w.targetMapId === 'ice_path_b3f');
      expect(warpB2fToB3f).toEqual({ x: 9, y: 11, targetMapId: 'ice_path_b3f', targetX: 3, targetY: 5 });
      const warpB3fToB2fMaho = ipB3fData.warps.find((w) => w.targetMapId === 'ice_path_b2f_mahogany_side');
      expect(warpB3fToB2fMaho).toEqual({ x: 3, y: 5, targetMapId: 'ice_path_b2f_mahogany_side', targetX: 9, targetY: 11 });

      // B3F <-> B2F Blackthorn Side
      const warpB3fToB2fBlack = ipB3fData.warps.find((w) => w.targetMapId === 'ice_path_b2f_blackthorn_side');
      expect(warpB3fToB2fBlack).toEqual({ x: 15, y: 5, targetMapId: 'ice_path_b2f_blackthorn_side', targetX: 3, targetY: 3 });
      const warpB2fBlackToB3f = ipB2fBlack.warps.find((w) => w.targetMapId === 'ice_path_b3f');
      expect(warpB2fBlackToB3f).toEqual({ x: 3, y: 3, targetMapId: 'ice_path_b3f', targetX: 15, targetY: 5 });

      // B2F Blackthorn Side <-> B1F
      const warpB2fBlackToB1f = ipB2fBlack.warps.find((w) => w.targetMapId === 'ice_path_b1f');
      expect(warpB2fBlackToB1f).toEqual({ x: 3, y: 15, targetMapId: 'ice_path_b1f', targetX: 11, targetY: 27 });
    });

    it('asserts Ice Path 1F south exit connects to Blackthorn City reciprocally', () => {
      const ip1fData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'ice_path_1f.json'), 'utf8')
      );
      const blackthornData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'blackthorn_city.json'), 'utf8')
      );

      const exitToBlackthorn = ip1fData.warps.find((w) => w.targetMapId === 'blackthorn_city');
      expect(exitToBlackthorn).toEqual({
        x: 36,
        y: 27,
        targetMapId: 'blackthorn_city',
        targetX: 36,
        targetY: 10,
      });

      const entranceToIcePath = blackthornData.warps.find((w) => w.targetMapId === 'ice_path_1f');
      expect(entranceToIcePath).toEqual({
        x: 36,
        y: 9,
        targetMapId: 'ice_path_1f',
        targetX: 36,
        targetY: 27,
      });
    });
  });

  describe('3. Route 44 Canonical 7 Trainers & Overworld Items', () => {
    it('verifies all 7 canonical Route 44 trainers in EAST_JOHTO_GENERATED_NPCS', () => {
      const r44Npcs = EAST_JOHTO_GENERATED_NPCS.route_44;
      expect(r44Npcs).toBeDefined();
      expect(r44Npcs.length).toBe(7);

      const trainerIds = r44Npcs.map((n) => n.trainerId);
      expect(trainerIds).toEqual([
        'route_44_wilton',
        'route_44_edgar',
        'route_44_phil',
        'route_44_zach',
        'route_44_vance',
        'route_44_allen',
        'route_44_cybil',
      ]);

      const r44Data: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'route_44.json'), 'utf8')
      );

      for (const npc of r44Npcs) {
        expect(npc.team).toBeDefined();
        expect(npc.team!.length).toBeGreaterThan(0);
        expect(npc.vision).toBeGreaterThanOrEqual(1);

        // Assert all trainers stand on walkable coordinates (collision 0)
        const tile = r44Data.collisionGrid[npc.y * r44Data.width + npc.x];
        expect(tile, `Trainer ${npc.speaker || npc.name} at (${npc.x}, ${npc.y}) must stand on walkable tile`).toBe(0);
      }
    });

    it('verifies overworld items on Route 44 in overworld_items.json', () => {
      const itemsData = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/overworld_items.json'), 'utf8')
      );
      const r44 = itemsData.byMap['route_44'];
      expect(r44).toBeDefined();

      const itemBallIds = r44.itemBalls.map((b: any) => b.itemId);
      expect(itemBallIds).toContain('max_revive');
      expect(itemBallIds).toContain('ultra_ball');
      expect(itemBallIds).toContain('max_repel');

      const hiddenIds = r44.hiddenItems.map((h: any) => h.itemId);
      expect(hiddenIds).toContain('elixer');

      const fruitTree = r44.fruitTrees[0];
      expect(fruitTree).toBeDefined();
      expect(fruitTree.berryId).toBe('burnt_berry');
      expect(fruitTree.x).toBe(9);
      expect(fruitTree.y).toBe(5);
    });

    it('verifies overworld items across all 5 Ice Path cavern floors in overworld_items.json', () => {
      const itemsData = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/overworld_items.json'), 'utf8')
      );

      const ip1f = itemsData.byMap['ice_path_1f'];
      expect(ip1f.itemBalls.map((b: any) => b.itemId)).toEqual(
        expect.arrayContaining(['hm_waterfall', 'pp_up', 'protein'])
      );

      const ipB1f = itemsData.byMap['ice_path_b1f'];
      expect(ipB1f.itemBalls.map((b: any) => b.itemId)).toContain('iron');
      expect(ipB1f.hiddenItems.map((h: any) => h.itemId)).toContain('max_potion');

      const ipB2fMaho = itemsData.byMap['ice_path_b2f_mahogany_side'];
      expect(ipB2fMaho.itemBalls.map((b: any) => b.itemId)).toEqual(
        expect.arrayContaining(['full_heal', 'max_potion'])
      );
      expect(ipB2fMaho.hiddenItems.map((h: any) => h.itemId)).toContain('carbos');

      const ipB2fBlack = itemsData.byMap['ice_path_b2f_blackthorn_side'];
      expect(ipB2fBlack.itemBalls.map((b: any) => b.itemId)).toContain('tm_rest');
      expect(ipB2fBlack.hiddenItems.map((h: any) => h.itemId)).toContain('ice_heal');

      const ipB3f = itemsData.byMap['ice_path_b3f'];
      expect(ipB3f.itemBalls.map((b: any) => b.itemId)).toContain('nevermeltice');
    });
  });

  describe('4. HM07 Waterfall Discovery & Modern HM Authorization', () => {
    it('handleIcePathWaterfallItem grants HM07 Waterfall and updates flags & inventory', () => {
      const res = handleIcePathWaterfallItem(null as any, null as any, mockContext as NpcInteractionContext);
      expect(res).toBe(true);

      expect(mockContext.storyFlags?.has('EVENT_GOT_HM07_WATERFALL')).toBe(true);
      expect(mockContext.storyFlags?.has('has_hm07_waterfall')).toBe(true);
      expect(mockContext.inventory?.tms).toContain('HM07');
      expect(savedGameCalled).toBe(true);
      expect(lastToastMessage).toContain('Obtained HM07 Waterfall!');
      expect(lastDialoguePages[0]).toContain('found HM07 WATERFALL!');
    });

    it('handleIcePathWaterfallItem yields empty dialogue when already collected', () => {
      mockContext.storyFlags?.add('EVENT_GOT_HM07_WATERFALL');
      const res = handleIcePathWaterfallItem(null as any, null as any, mockContext as NpcInteractionContext);
      expect(res).toBe(true);

      expect(lastDialoguePages[0]).toContain('The spot where the HM ball rested is now empty.');
    });

    it('ModernHMHandler.canUseWaterfall rejects when player lacks Rising Badge', () => {
      const inventory = {
        money: 0,
        badges: ['glacier'], // lacks 'rising'
        items: {},
        balls: {},
        tms: ['HM07'],
        keyItems: [],
      };
      const party = [PokemonFactory.create('feraligatr', 40, ['surf', 'bite'])];

      const res = ModernHMHandler.canUseWaterfall(party, inventory);
      expect(res.canUse).toBe(false);
      expect(res.hasBadge).toBe(false);
      expect(res.missingReason).toContain('RISING BADGE');
    });

    it('ModernHMHandler.canUseWaterfall rejects when player lacks HM07 and no party mon knows Waterfall', () => {
      const inventory = {
        money: 0,
        badges: ['rising'],
        items: {},
        balls: {},
        tms: [], // no HM07
        keyItems: [],
      };
      const party = [PokemonFactory.create('feraligatr', 40, ['surf', 'bite'])];

      const res = ModernHMHandler.canUseWaterfall(party, inventory);
      expect(res.canUse).toBe(false);
      expect(res.hasHM).toBe(false);
      expect(res.missingReason).toContain('HM07 WATERFALL');
    });

    it('ModernHMHandler.canUseWaterfall authorizes when player has Rising Badge and party mon knows Waterfall', () => {
      const inventory = {
        money: 0,
        badges: ['rising'],
        items: {},
        balls: {},
        tms: [],
        keyItems: [],
      };
      const party = [PokemonFactory.create('gyarados', 40, ['waterfall', 'bite'])];

      const res = ModernHMHandler.canUseWaterfall(party, inventory);
      expect(res.canUse).toBe(true);
      expect(res.userPokemon).toBeDefined();
      expect(res.userPokemon?.speciesId).toBe('gyarados');
    });

    it('ModernHMHandler.canUseWaterfall authorizes when player has Rising Badge, HM07, and compatible Water species', () => {
      const inventory = {
        money: 0,
        badges: ['rising'],
        items: {},
        balls: {},
        tms: ['HM07'],
        keyItems: [],
      };
      const party = [PokemonFactory.create('seaking', 35, ['hornattack', 'supersonic'])];

      const res = ModernHMHandler.canUseWaterfall(party, inventory);
      expect(res.canUse).toBe(true);
      expect(res.compatiblePokemon).toBeDefined();
      expect(res.compatiblePokemon?.speciesId).toBe('seaking');
    });

    it('ModernHMHandler.canUseWaterfall rejects when party has no compatible species', () => {
      const inventory = {
        money: 0,
        badges: ['rising'],
        items: {},
        balls: {},
        tms: ['HM07'],
        keyItems: [],
      };
      const party = [PokemonFactory.create('pidgey', 10, ['tackle', 'gust'])];

      const res = ModernHMHandler.canUseWaterfall(party, inventory);
      expect(res.canUse).toBe(false);
      expect(res.missingReason).toContain('compatible Pokémon');
    });
  });

  describe('5. Ice Path B1F Strength Boulder Drop Puzzle & State Flags', () => {
    it('handleStrengthBoulderDrop prompts when player lacks Strength or Plain Badge', () => {
      mockContext.inventory!.badges = []; // lacks Plain Badge
      const boulderNpc = { id: 'ice_path_b1f_boulder_1', x: 11, y: 7 } as any;

      const res = handleStrengthBoulderDrop(boulderNpc, null as any, mockContext as NpcInteractionContext);
      expect(res).toBe(true);
      expect(lastSpeaker).toBe('🪨 BOULDER');
      expect(lastDialoguePages[1]).toContain('PLAIN BADGE');
      expect(mockContext.storyFlags?.has('EVENT_BOULDER_IN_ICE_PATH_1')).toBe(false);
    });

    it('handleStrengthBoulderDrop drops boulder to B2F when player has Strength and Plain Badge', () => {
      mockContext.inventory!.badges = ['plain'];
      mockContext.inventory!.tms = ['HM04'];
      mockContext.playerParty = [PokemonFactory.create('machamp', 40, ['strength', 'karatechop'])];
      const boulderNpc = { id: 'ice_path_b1f_boulder_3', x: 8, y: 9 } as any;

      const res = handleStrengthBoulderDrop(boulderNpc, null as any, mockContext as NpcInteractionContext);
      expect(res).toBe(true);
      expect(mockContext.storyFlags?.has('EVENT_BOULDER_IN_ICE_PATH_3')).toBe(true);
      expect(savedGameCalled).toBe(true);
      expect(lastToastMessage).toBe('🪨 Dropped boulder #3 to B2F!');
      expect(lastDialoguePages[0]).toContain('STRENGTH moved the boulder!');
      expect(lastDialoguePages[1]).toContain('plunged through the hole into the icy lake');
    });

    it('isNpcActiveForStoryFlags correctly despawns boulder from B1F and activates on B2F', () => {
      const storyFlags = new Set<string>();

      // Initially boulder 1 is NOT dropped
      const b1fBoulderId = 'ice_path_b1f_boulder_1';
      const b2fBoulderId = 'ice_path_b2f_boulder_1';

      expect(isNpcActiveForStoryFlags(b1fBoulderId, storyFlags)).toBe(true);
      expect(isNpcActiveForStoryFlags(b2fBoulderId, storyFlags)).toBe(false);

      // Now boulder 1 is dropped
      storyFlags.add('EVENT_BOULDER_IN_ICE_PATH_1');
      expect(isNpcActiveForStoryFlags(b1fBoulderId, storyFlags)).toBe(false);
      expect(isNpcActiveForStoryFlags(b2fBoulderId, storyFlags)).toBe(true);
    });

    it('createMahoganyToIndigoNpcs defines all 4 boulders on B1F and B2F Mahogany Side', () => {
      const allNpcs = createMahoganyToIndigoNpcs();
      const b1fNpcs = allNpcs['ice_path_b1f'];
      expect(b1fNpcs).toBeDefined();
      expect(b1fNpcs.length).toBe(4);
      expect(b1fNpcs.map((n) => n.id)).toEqual([
        'ice_path_b1f_boulder_1',
        'ice_path_b1f_boulder_2',
        'ice_path_b1f_boulder_3',
        'ice_path_b1f_boulder_4',
      ]);

      const b2fNpcs = allNpcs['ice_path_b2f_mahogany_side'];
      expect(b2fNpcs).toBeDefined();
      expect(b2fNpcs.length).toBe(4);
      expect(b2fNpcs.map((n) => n.id)).toEqual([
        'ice_path_b2f_boulder_1',
        'ice_path_b2f_boulder_2',
        'ice_path_b2f_boulder_3',
        'ice_path_b2f_boulder_4',
      ]);
    });
  });

  describe('6. Router Registration & Atmospheric Narratives', () => {
    it('getRoute44AndIcePathInteractions exports complete O(1) registration list', () => {
      const registrations = getRoute44AndIcePathInteractions();
      expect(registrations.length).toBe(3);

      const actions = registrations.flatMap((r) => r.actions || []);
      expect(actions).toContain('STRENGTH_BOULDER');
      expect(actions).toContain('ICE_PATH_WATERFALL_ITEM');
      expect(actions).toContain('BLACKTHORN_EXIT_EVENT');
    });

    it('createDefaultNpcInteractionRouter dispatches Route 44 & Ice Path interactions', () => {
      const router = createDefaultNpcInteractionRouter();

      const dummyBoulder = { id: 'ice_path_b1f_boulder_1', action: 'STRENGTH_BOULDER', isMoving: false } as any;
      expect(router.dispatch(dummyBoulder, null as any, mockContext as any)).toBe(true);

      const dummyItem = { id: 'ice_path_1f_31_7_hm_waterfall', action: 'ICE_PATH_WATERFALL_ITEM', isMoving: false } as any;
      expect(router.dispatch(dummyItem, null as any, mockContext as any)).toBe(true);

      const dummyExit = { id: 'ice_path_exit_blackthorn', action: 'BLACKTHORN_EXIT_EVENT', isMoving: false } as any;
      expect(router.dispatch(dummyExit, null as any, mockContext as any)).toBe(true);
    });

    it('handleBlackthornCityExitPrompt displays atmospheric narrative', () => {
      const res = handleBlackthornCityExitPrompt(null as any, null as any, mockContext as NpcInteractionContext);
      expect(res).toBe(true);
      expect(lastSpeaker).toBe('🏔️ CAVERN EXIT');
      expect(lastDialoguePages[0]).toContain('warm mountain breeze drafts into the cavern');
      expect(lastDialoguePages[1]).toContain('BLACKTHORN CITY');
    });
  });

  describe('7. Audio BGM Mapping & Architectural Invariants', () => {
    it('verifies canonical BGM track resolution for Route 44 and Ice Path', () => {
      const audioManager = new AudioManager();
      expect(audioManager.getTrackForMap('route_44')).toBe('bgm_route_29');
      expect(audioManager.getTrackForMap('ice_path_1f')).toBe('bgm_sprout_tower');
      expect(audioManager.getTrackForMap('ice_path_b1f')).toBe('bgm_sprout_tower');
      expect(audioManager.getTrackForMap('ice_path_b2f_mahogany_side')).toBe('bgm_sprout_tower');
      expect(audioManager.getTrackForMap('ice_path_b2f_blackthorn_side')).toBe('bgm_sprout_tower');
      expect(audioManager.getTrackForMap('ice_path_b3f')).toBe('bgm_sprout_tower');
    });

    it('asserts pure layer boundary with zero PixiJS or DOM imports', () => {
      const interactionCode = fs.readFileSync(
        path.resolve(__dirname, '../../src/world/interactions/Route44AndIcePathInteractions.ts'),
        'utf8'
      );
      expect(interactionCode).not.toContain('pixi.js');
      expect(interactionCode).not.toContain('@pixi/');
      expect(interactionCode).not.toContain('document.getElementById');

      const hmCode = fs.readFileSync(
        path.resolve(__dirname, '../../src/world/ModernHMHandler.ts'),
        'utf8'
      );
      expect(hmCode).not.toContain('pixi.js');
      expect(hmCode).not.toContain('@pixi/');
    });

    it('asserts single-window file budget (< 300 lines for interactions, < 750 for HM handler)', () => {
      const interactionLines = fs
        .readFileSync(
          path.resolve(__dirname, '../../src/world/interactions/Route44AndIcePathInteractions.ts'),
          'utf8'
        )
        .split('\n').length;
      expect(interactionLines).toBeLessThan(300);

      const hmLines = fs
        .readFileSync(
          path.resolve(__dirname, '../../src/world/ModernHMHandler.ts'),
          'utf8'
        )
        .split('\n').length;
      expect(hmLines).toBeLessThan(750);
    });
  });
});
