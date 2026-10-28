import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getWhirlIslandsInteractions,
  handleLugiaShrineOrBoss,
  handleWhirlpoolObstacle,
  handleWhirlIslandsLoreSage,
} from '../../src/world/interactions/WhirlIslandsInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { createSeaRoutesNpcs } from '../../src/world/npcs/seaRoutesNpcs';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { ModernHMHandler } from '../../src/world/ModernHMHandler';
import { OverworldWarpAndMapTransitionController } from '../../src/world/OverworldWarpAndMapTransitionController';
import { MAP_BGM_TABLE } from '../../src/audio/mapBgmTable';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-WORLD-WHIRL-ISLANDS-CAVERNS-01: Caverns, Whirlpools & Silver Wing Lugia', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;
  let triggeredBattleEnemy: any = null;
  let triggeredBattleOptions: any = null;

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    triggeredBattleEnemy = null;
    triggeredBattleOptions = null;

    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('feraligatr', 45, ['surf', 'whirlpool', 'bite', 'slash'])],
      player: {
        id: 'player',
        x: 12,
        y: 18,
        targetX: 12,
        targetY: 18,
        renderX: 12 * 64,
        renderY: 18 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 50000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'],
        items: {},
        balls: {},
        tms: ['hm06'],
        keyItems: [],
      },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      openDialogue: (pages, speaker, onComplete) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        if (onComplete) onComplete();
      },
      showToast: () => {},
      saveCurrentGame: () => {},
      triggerBattle: (enemy, opts) => {
        triggeredBattleEnemy = enemy;
        triggeredBattleOptions = opts;
      },
      audioManager: {
        playSfx: () => {},
      } as any,
    };
  });

  describe('1. 7-Map Whirl Islands Cavern Complex Geometry & Warp Reciprocity', () => {
    const whirlIslandMaps = [
      'whirl_island_ne',
      'whirl_island_nw',
      'whirl_island_se',
      'whirl_island_sw',
      'whirl_island_b1f',
      'whirl_island_b2f',
      'whirl_island_lugia_chamber',
    ];

    it('asserts all 7 cavern map files exist with valid dimensions and collision data', () => {
      for (const mapId of whirlIslandMaps) {
        const filePath = path.join(mapsDir, `${mapId}.json`);
        expect(fs.existsSync(filePath), `Map file for ${mapId} must exist on disk`).toBe(true);

        const mapData: MapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        expect(mapData.id).toBe(mapId);
        expect(mapData.width).toBeGreaterThan(0);
        expect(mapData.height).toBeGreaterThan(0);
        expect(mapData.collisionGrid.length).toBe(mapData.width * mapData.height);
      }
    });

    it('asserts Route 41 contains warps into the 4 Whirl Island entrance caverns', () => {
      const r41Path = path.join(mapsDir, 'route_41.json');
      const r41Data: MapData = JSON.parse(fs.readFileSync(r41Path, 'utf8'));

      const targets = r41Data.warps.map((w) => w.targetMapId);
      expect(targets).toContain('whirl_island_nw');
      expect(targets).toContain('whirl_island_ne');
      expect(targets).toContain('whirl_island_sw');
      expect(targets).toContain('whirl_island_se');

      const nwWarp = r41Data.warps.find((w) => w.targetMapId === 'whirl_island_nw');
      expect(nwWarp).toEqual({ x: 12, y: 17, targetMapId: 'whirl_island_nw', targetX: 5, targetY: 7 });

      const neWarp = r41Data.warps.find((w) => w.targetMapId === 'whirl_island_ne');
      expect(neWarp).toEqual({ x: 36, y: 19, targetMapId: 'whirl_island_ne', targetX: 3, targetY: 13 });

      const swWarp = r41Data.warps.find((w) => w.targetMapId === 'whirl_island_sw');
      expect(swWarp).toEqual({ x: 12, y: 37, targetMapId: 'whirl_island_sw', targetX: 5, targetY: 7 });

      const seWarp = r41Data.warps.find((w) => w.targetMapId === 'whirl_island_se');
      expect(seWarp).toEqual({ x: 36, y: 45, targetMapId: 'whirl_island_se', targetX: 5, targetY: 13 });
    });

    it('asserts entrance caverns have valid return warps leading back outside the whirlpools', () => {
      const neData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'whirl_island_ne.json'), 'utf8'));
      const neExit = neData.warps.find((w) => w.targetMapId === 'route_41');
      expect(neExit).toEqual({ x: 3, y: 13, targetMapId: 'route_41', targetX: 36, targetY: 20 });

      const nwData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'whirl_island_nw.json'), 'utf8'));
      const nwExit = nwData.warps.find((w) => w.targetMapId === 'route_41');
      expect(nwExit).toEqual({ x: 5, y: 7, targetMapId: 'route_41', targetX: 12, targetY: 18 });

      const swData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'whirl_island_sw.json'), 'utf8'));
      const swExit = swData.warps.find((w) => w.targetMapId === 'route_41');
      expect(swExit).toEqual({ x: 5, y: 7, targetMapId: 'route_41', targetX: 12, targetY: 38 });

      const seData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'whirl_island_se.json'), 'utf8'));
      const seExit = seData.warps.find((w) => w.targetMapId === 'route_41');
      expect(seExit).toEqual({ x: 5, y: 13, targetMapId: 'route_41', targetX: 36, targetY: 46 });
    });

    it('asserts reciprocal warp connection between B2F and Lugia Chamber', () => {
      const b2fData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'whirl_island_b2f.json'), 'utf8'));
      const lugiaChamberData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'whirl_island_lugia_chamber.json'), 'utf8')
      );

      const b2fToLugia = b2fData.warps.find((w) => w.targetMapId === 'whirl_island_lugia_chamber');
      expect(b2fToLugia).toBeDefined();
      expect(b2fToLugia).toEqual({
        x: 7,
        y: 25,
        targetMapId: 'whirl_island_lugia_chamber',
        targetX: 9,
        targetY: 13,
      });

      const lugiaToB2f = lugiaChamberData.warps.find((w) => w.targetMapId === 'whirl_island_b2f');
      expect(lugiaToB2f).toBeDefined();
      expect(lugiaToB2f).toEqual({
        x: 9,
        y: 13,
        targetMapId: 'whirl_island_b2f',
        targetX: 7,
        targetY: 25,
      });
    });

    it('asserts all warps across all 7 Whirl Island maps target valid map files and coordinates', () => {
      for (const mapId of whirlIslandMaps) {
        const mapData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, `${mapId}.json`), 'utf8'));
        for (const warp of mapData.warps) {
          const targetPath = path.join(mapsDir, `${warp.targetMapId}.json`);
          expect(fs.existsSync(targetPath), `Target map ${warp.targetMapId} must exist`).toBe(true);

          const targetData: MapData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
          expect(warp.targetX).toBeGreaterThanOrEqual(0);
          expect(warp.targetX).toBeLessThan(targetData.width);
          expect(warp.targetY).toBeGreaterThanOrEqual(0);
          expect(warp.targetY).toBeLessThan(targetData.height);
        }
      }
    });
  });

  describe('2. Route 41 Whirlpool Field Obstacles & HM06 Logic', () => {
    it('rejects crossing or clearing whirlpool if Glacier Badge is missing', () => {
      mockContext.inventory!.badges = ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral']; // Missing glacier
      const mockRoute41: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_41.json'), 'utf8'));

      const handled = handleWhirlpoolObstacle(null, mockRoute41, mockContext as NpcInteractionContext, {
        targetCoord: { x: 12, y: 17 },
      });
      expect(handled).toBe(true);
      expect(lastDialoguePages[0]).toContain('A vicious whirlpool is spinning violently!');
      expect(lastDialoguePages[1]).toContain('GLACIER BADGE');
      expect(mockContext.storyFlags!.has('whirlpool_cleared_12_17')).toBe(false);
    });

    it('rejects crossing or clearing whirlpool if HM06 Whirlpool is missing', () => {
      mockContext.inventory!.tms = [];
      mockContext.playerParty = [PokemonFactory.create('feraligatr', 45, ['surf', 'bite', 'slash'])];
      const mockRoute41: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_41.json'), 'utf8'));

      const handled = handleWhirlpoolObstacle(null, mockRoute41, mockContext as NpcInteractionContext, {
        targetCoord: { x: 12, y: 17 },
      });
      expect(handled).toBe(true);
      expect(lastDialoguePages[1]).toContain('HM06 WHIRLPOOL');
      expect(mockContext.storyFlags!.has('whirlpool_cleared_12_17')).toBe(false);
    });

    it('successfully clears whirlpool and sets collision to 0 when player has Glacier Badge & HM06', () => {
      const mockRoute41: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_41.json'), 'utf8'));
      const idx = 17 * mockRoute41.width + 12;
      expect(mockRoute41.collisionGrid[idx]).toBe(1);

      const handled = handleWhirlpoolObstacle(null, mockRoute41, mockContext as NpcInteractionContext, {
        targetCoord: { x: 12, y: 17 },
      });
      expect(handled).toBe(true);
      expect(lastDialoguePages[1]).toContain('used WHIRLPOOL to calm the churning waters!');
      expect(mockContext.storyFlags!.has('whirlpool_cleared_12_17')).toBe(true);
      expect(mockRoute41.collisionGrid[idx]).toBe(0);
    });

    it('applies map story mutations to dynamically persist cleared whirlpools on Route 41', () => {
      const mockRoute41: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_41.json'), 'utf8'));
      mockContext.storyFlags!.add('whirlpool_cleared_36_19');

      OverworldWarpAndMapTransitionController.applyMapStoryMutations(mockContext as any, mockRoute41);

      const clearedIdx = 19 * mockRoute41.width + 36;
      const unclearedIdx = 17 * mockRoute41.width + 12;
      expect(mockRoute41.collisionGrid[clearedIdx]).toBe(0);
      expect(mockRoute41.collisionGrid[unclearedIdx]).toBe(1);
    });
  });

  describe('3. Whirl Islands Overworld Items & Hidden Cache Verification', () => {
    it('verifies itemballs and hidden items are cataloged in overworld_items.json', () => {
      const itemsPath = path.resolve(__dirname, '../../public/assets/data/overworld_items.json');
      const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

      expect(itemsData.byMap.whirl_island_b1f).toBeDefined();
      expect(itemsData.byMap.whirl_island_b1f.itemBalls.length).toBe(5);
      expect(itemsData.byMap.whirl_island_b1f.hiddenItems.length).toBe(3);

      expect(itemsData.byMap.whirl_island_b2f).toBeDefined();
      expect(itemsData.byMap.whirl_island_b2f.itemBalls.length).toBe(3);

      expect(itemsData.byMap.whirl_island_ne).toBeDefined();
      expect(itemsData.byMap.whirl_island_ne.itemBalls.length).toBe(1);

      expect(itemsData.byMap.whirl_island_sw).toBeDefined();
      expect(itemsData.byMap.whirl_island_sw.itemBalls.length).toBe(1);
    });
  });

  describe('4. Silver Wing Lugia Chamber Awakening & Battle Flow', () => {
    it('displays lore monologue when player inspects basin without Silver Wing', () => {
      const chamberData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'whirl_island_lugia_chamber.json'), 'utf8')
      );

      const handled = handleLugiaShrineOrBoss(null, chamberData, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(lastSpeaker).toBe('🌊 LUGIA BASIN');
      expect(lastDialoguePages.some((p) => p.includes('Silver-Winged guardian of the seas'))).toBe(true);
      expect(lastDialoguePages.some((p) => p.includes('A silver, feather-shaped artifact'))).toBe(true);
      expect(triggeredBattleEnemy).toBeNull();
    });

    it('awakens Lugia and triggers Lv. 60 Legendary battle when player possesses Silver Wing', () => {
      mockContext.storyFlags!.add('has_silver_wing');
      const chamberData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'whirl_island_lugia_chamber.json'), 'utf8')
      );

      const handled = handleLugiaShrineOrBoss(null, chamberData, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(triggeredBattleEnemy).not.toBeNull();
      expect(triggeredBattleEnemy.speciesId).toBe('lugia');
      expect(triggeredBattleEnemy.level).toBe(60);

      const moves = triggeredBattleEnemy.moves.map((m: any) => m.moveId);
      expect(moves).toContain('aeroblast');
      expect(moves).toContain('safeguard');
      expect(moves).toContain('gust');
      expect(moves).toContain('recover');
    });

    it('sets lugia_defeated and EVENT_FOUGHT_LUGIA upon victorious battle completion', () => {
      mockContext.storyFlags!.add('EVENT_GOT_SILVER_WING');
      const chamberData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'whirl_island_lugia_chamber.json'), 'utf8')
      );

      handleLugiaShrineOrBoss(null, chamberData, mockContext as NpcInteractionContext);
      expect(triggeredBattleOptions).toBeDefined();

      // Simulate player victory
      triggeredBattleOptions.onBattleEnd({ winner: 'PLAYER', caught: false });

      expect(mockContext.storyFlags!.has('lugia_defeated')).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_FOUGHT_LUGIA')).toBe(true);
      expect(lastSpeaker).toBe('🌊 LUGIA');
      expect(lastDialoguePages[0]).toContain('LUGIA gave a solemn, resonant cry');
    });

    it('displays tranquil basin message post-defeat without re-triggering battle', () => {
      mockContext.storyFlags!.add('lugia_defeated');
      mockContext.storyFlags!.add('has_silver_wing');
      const chamberData: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'whirl_island_lugia_chamber.json'), 'utf8')
      );

      const handled = handleLugiaShrineOrBoss(null, chamberData, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(lastSpeaker).toBe('🌊 LUGIA BASIN');
      expect(lastDialoguePages[1]).toContain('The guardian of the seas rests peacefully in deep slumber.');
      expect(triggeredBattleEnemy).toBeNull();
    });
  });

  describe('5. NPC Entity Lifecycle & Story Flag Active Checks', () => {
    it('hides whirl_island_lugia after Lugia is defeated or caught', () => {
      const activeBefore = isNpcActiveForStoryFlags('whirl_island_lugia', new Set<string>());
      expect(activeBefore).toBe(true);

      const activeAfterDefeat = isNpcActiveForStoryFlags('whirl_island_lugia', new Set<string>(['lugia_defeated']));
      expect(activeAfterDefeat).toBe(false);

      const activeAfterCaught = isNpcActiveForStoryFlags('whirl_island_lugia', new Set<string>(['EVENT_FOUGHT_LUGIA']));
      expect(activeAfterCaught).toBe(false);
    });

    it('instantiates whirl_island_lugia and whirl_islands_lore_sage in createSeaRoutesNpcs', () => {
      const npcs = createSeaRoutesNpcs();

      expect(npcs.whirl_island_lugia_chamber).toBeDefined();
      const lugiaNpc = npcs.whirl_island_lugia_chamber.find((n) => n.id === 'whirl_island_lugia');
      expect(lugiaNpc).toBeDefined();
      expect(lugiaNpc!.action).toBe('LUGIA_BOSS_EVENT');
      expect(lugiaNpc!.x).toBe(9);
      expect(lugiaNpc!.y).toBe(9);

      expect(npcs.whirl_island_b1f).toBeDefined();
      const sageNpc = npcs.whirl_island_b1f.find((n) => n.id === 'whirl_islands_lore_sage');
      expect(sageNpc).toBeDefined();
      expect(sageNpc!.action).toBe('WHIRL_ISLAND_LORE_EVENT');
      expect(sageNpc!.x).toBe(23);
      expect(sageNpc!.y).toBe(27);
    });

    it('provides rich lore text through handleWhirlIslandsLoreSage', () => {
      const handled = handleWhirlIslandsLoreSage(null, null, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(lastSpeaker).toBe('🧭 CAVE EXPLORER');
      expect(lastDialoguePages[0]).toContain('These sea caverns are a treacherous labyrinth');
    });
  });

  describe('6. Router Registration & Audio BGM Table Verification', () => {
    it('registers and dispatches Whirl Islands interactions via createDefaultNpcInteractionRouter', () => {
      const router = createDefaultNpcInteractionRouter();
      const mockChamber: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'whirl_island_lugia_chamber.json'), 'utf8')
      );
      const mockB1f: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'whirl_island_b1f.json'), 'utf8')
      );

      const lugiaDispatched = router.dispatch(
        { id: 'whirl_island_lugia', action: 'LUGIA_BOSS_EVENT', isMoving: false, direction: 'DOWN' } as any,
        mockChamber,
        mockContext as NpcInteractionContext
      );
      expect(lugiaDispatched).toBe(true);

      const sageDispatched = router.dispatch(
        { id: 'whirl_islands_lore_sage', action: 'WHIRL_ISLAND_LORE_EVENT', isMoving: false, direction: 'DOWN' } as any,
        mockB1f,
        mockContext as NpcInteractionContext
      );
      expect(sageDispatched).toBe(true);
    });

    it('verifies all 7 Whirl Islands cavern maps are mapped to cave BGM', () => {
      expect(MAP_BGM_TABLE.whirl_island_ne).toBe('bgm_sprout_tower');
      expect(MAP_BGM_TABLE.whirl_island_nw).toBe('bgm_sprout_tower');
      expect(MAP_BGM_TABLE.whirl_island_se).toBe('bgm_sprout_tower');
      expect(MAP_BGM_TABLE.whirl_island_sw).toBe('bgm_sprout_tower');
      expect(MAP_BGM_TABLE.whirl_island_b1f).toBe('bgm_sprout_tower');
      expect(MAP_BGM_TABLE.whirl_island_b2f).toBe('bgm_sprout_tower');
      expect(MAP_BGM_TABLE.whirl_island_lugia_chamber).toBe('bgm_sprout_tower');
    });

    it('verifies Lugia sprites exist on disk', () => {
      const frontSprite = path.resolve(__dirname, '../../public/assets/sprites/pokemon/lugia_front.png');
      const backSprite = path.resolve(__dirname, '../../public/assets/sprites/pokemon/lugia_back.png');
      const iconSprite = path.resolve(__dirname, '../../public/assets/sprites/pokemon/icons/lugia.png');

      expect(fs.existsSync(frontSprite), 'Lugia front sprite must exist').toBe(true);
      expect(fs.existsSync(backSprite), 'Lugia back sprite must exist').toBe(true);
      expect(fs.existsSync(iconSprite), 'Lugia icon sprite must exist').toBe(true);
    });
  });
});
