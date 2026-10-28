import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import { createGoldenrodBuildingsAndParkNpcs } from '../../src/world/npcs/goldenrodBuildingsAndParkNpcs';
import { getGoldenrodExpansionInteractions } from '../../src/world/interactions/GoldenrodExpansionInteractions';
import { FieldObstacleDispatcher } from '../../src/world/interactions/FieldObstacleDispatcher';
import { DEPT_STORE_FLOORS } from '../../src/ui/DeptStoreElevatorUI';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-BUGFIX-GITHUB-ISSUES-27-THROUGH-34-01: GitHub Issues #27 - #34 Fixes', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');

  // =========================================================================
  // Issue #27: Goldenrod Underground Switch Room Entrances Map & Warps
  // =========================================================================
  describe('Issue #27: Goldenrod Underground Switch Room Entrances Map & Warps', () => {
    const mapPath = path.join(mapsDir, 'goldenrod_underground_switch_room_entrances.json');
    const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

    it('has authentic 30x36 dimensions (15x18 metatile blocks)', () => {
      expect(mapData.id).toBe('goldenrod_underground_switch_room_entrances');
      expect(mapData.width).toBe(30);
      expect(mapData.height).toBe(36);
      expect(mapData.tileMap.length).toBe(30 * 36);
      expect(mapData.collisionGrid.length).toBe(30 * 36);
    });

    it('has exactly 9 canonical warps with correct target maps and coordinates', () => {
      expect(mapData.warps.length).toBe(9);

      // 1. Warp to goldenrod_underground (18, 6) from (23, 3)
      const w1 = mapData.warps.find((w) => w.x === 23 && w.y === 3);
      expect(w1).toBeDefined();
      expect(w1?.targetMapId).toBe('goldenrod_underground');
      expect(w1?.targetX).toBe(18);
      expect(w1?.targetY).toBe(6);

      // 2 & 3. Warps to goldenrod_underground_warehouse from (22, 10) & (23, 10)
      const w2 = mapData.warps.find((w) => w.x === 22 && w.y === 10);
      expect(w2?.targetMapId).toBe('goldenrod_underground_warehouse');
      expect(w2?.targetX).toBe(1);
      expect(w2?.targetY).toBe(1);

      const w3 = mapData.warps.find((w) => w.x === 23 && w.y === 10);
      expect(w3?.targetMapId).toBe('goldenrod_underground_warehouse');
      expect(w3?.targetX).toBe(2);
      expect(w3?.targetY).toBe(1);

      // 4. Warp to goldenrod_underground (3, 34) from (5, 25)
      const w4 = mapData.warps.find((w) => w.x === 5 && w.y === 25);
      expect(w4?.targetMapId).toBe('goldenrod_underground');
      expect(w4?.targetX).toBe(3);
      expect(w4?.targetY).toBe(34);

      // 5 & 6. Warps to goldenrod_city (11, 30) from (4, 29) & (5, 29)
      const w5 = mapData.warps.find((w) => w.x === 4 && w.y === 29);
      expect(w5?.targetMapId).toBe('goldenrod_city');
      expect(w5?.targetX).toBe(11);
      expect(w5?.targetY).toBe(30);

      const w6 = mapData.warps.find((w) => w.x === 5 && w.y === 29);
      expect(w6?.targetMapId).toBe('goldenrod_city');
      expect(w6?.targetX).toBe(11);
      expect(w6?.targetY).toBe(30);

      // 7. Warp to goldenrod_underground (3, 2) from (21, 25)
      const w7 = mapData.warps.find((w) => w.x === 21 && w.y === 25);
      expect(w7?.targetMapId).toBe('goldenrod_underground');
      expect(w7?.targetX).toBe(3);
      expect(w7?.targetY).toBe(2);

      // 8 & 9. Warps to goldenrod_city (9, 6) from (20, 29) & (21, 29)
      const w8 = mapData.warps.find((w) => w.x === 20 && w.y === 29);
      expect(w8?.targetMapId).toBe('goldenrod_city');
      expect(w8?.targetX).toBe(9);
      expect(w8?.targetY).toBe(6);

      const w9 = mapData.warps.find((w) => w.x === 21 && w.y === 29);
      expect(w9?.targetMapId).toBe('goldenrod_city');
      expect(w9?.targetX).toBe(9);
      expect(w9?.targetY).toBe(6);
    });

    it('has walkable tiles at warp origins', () => {
      for (const warp of mapData.warps) {
        expect(mapData.collisionGrid[warp.y * mapData.width + warp.x]).toBe(0);
      }
    });
  });

  // =========================================================================
  // Issue #28: Route 34 Day-Care Entrance & Reciprocal Warps
  // =========================================================================
  describe('Issue #28: Route 34 Day-Care Entrance & Reciprocal Warps', () => {
    const route34: MapData = JSON.parse(
      fs.readFileSync(path.join(mapsDir, 'route_34.json'), 'utf8')
    );
    const dayCare: MapData = JSON.parse(
      fs.readFileSync(path.join(mapsDir, 'day_care.json'), 'utf8')
    );

    it('asserts Route 34 (12, 15) is walkable 0 with warp targeting day_care (2, 7)', () => {
      expect(route34.collisionGrid[15 * route34.width + 12]).toBe(0);
      const warp = route34.warps.find((w) => w.x === 12 && w.y === 15);
      expect(warp).toBeDefined();
      expect(warp?.targetMapId).toBe('day_care');
      expect(warp?.targetX).toBe(2);
      expect(warp?.targetY).toBe(7);
    });

    it('asserts Route 34 step tile (12, 16) is walkable 0', () => {
      expect(route34.collisionGrid[16 * route34.width + 12]).toBe(0);
    });

    it('asserts day_care interior warps reciprocal back to Route 34 (12, 16) and side yard (13, 15)', () => {
      const exit1 = dayCare.warps.find((w) => w.x === 2 && w.y === 7);
      expect(exit1).toBeDefined();
      expect(exit1?.targetMapId).toBe('route_34');
      expect(exit1?.targetX).toBe(12);
      expect(exit1?.targetY).toBe(16);

      const exit2 = dayCare.warps.find((w) => w.x === 3 && w.y === 7);
      expect(exit2).toBeDefined();
      expect(exit2?.targetMapId).toBe('route_34');
      expect(exit2?.targetX).toBe(12);
      expect(exit2?.targetY).toBe(16);

      const yard1 = dayCare.warps.find((w) => w.x === 0 && w.y === 5);
      expect(yard1).toBeDefined();
      expect(yard1?.targetMapId).toBe('route_34');
      expect(yard1?.targetX).toBe(13);
      expect(yard1?.targetY).toBe(15);
    });
  });

  // =========================================================================
  // Issues #29 & #33: Goldenrod Dept Store Elevator Map, Attendant & Floors
  // =========================================================================
  describe('Issues #29 & #33: Goldenrod Dept Store Elevator & Attendant', () => {
    it('goldenrod_dept_store_elevator.json exists with 6x6 dimensions and exit warps', () => {
      const elevatorPath = path.join(mapsDir, 'goldenrod_dept_store_elevator.json');
      expect(fs.existsSync(elevatorPath)).toBe(true);

      const elevator: MapData = JSON.parse(fs.readFileSync(elevatorPath, 'utf8'));
      expect(elevator.id).toBe('goldenrod_dept_store_elevator');
      expect(elevator.width).toBe(6);
      expect(elevator.height).toBe(6);

      const exitWarp = elevator.warps.find((w) => w.targetMapId === 'goldenrod_dept_store_1f');
      expect(exitWarp).toBeDefined();
    });

    it('has Elevator Panel bgEvent at (4, 1) with action DEPT_ELEVATOR_PANEL', () => {
      const elevator: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_dept_store_elevator.json'), 'utf8')
      );
      const panel = elevator.bgEvents?.find((bg) => bg.x === 4 && bg.y === 1);
      expect(panel).toBeDefined();
      expect(panel?.action).toBe('DEPT_ELEVATOR_PANEL');
    });

    it('restricts DEPT_STORE_FLOORS strictly to B1F-6F and excludes Roof', () => {
      expect(DEPT_STORE_FLOORS).toHaveLength(7);
      const floorIds = DEPT_STORE_FLOORS.map((f) => f.id);
      expect(floorIds).toEqual(['6f', '5f', '4f', '3f', '2f', '1f', 'b1f']);
      expect(floorIds).not.toContain('roof');
    });

    it('places Elevator Attendant NPC in goldenrod_dept_store_elevator at (2, 1)', () => {
      const npcs = createGoldenrodBuildingsAndParkNpcs().goldenrod_dept_store_elevator;
      expect(npcs).toBeDefined();
      const attendant = npcs.find((n) => n.id === 'dept_elevator_attendant');
      expect(attendant).toBeDefined();
      expect(attendant?.x).toBe(2);
      expect(attendant?.y).toBe(1);
      expect(attendant?.direction).toBe('DOWN');
      expect(attendant?.action).toBe('DEPT_ELEVATOR');
    });

    it('asserts Dept Store floors 1F through 6F have elevator door warps at (2, 0)', () => {
      const floors = ['1f', '2f', '3f', '4f', '5f', '6f'];
      for (const floor of floors) {
        const floorMap: MapData = JSON.parse(
          fs.readFileSync(path.join(mapsDir, `goldenrod_dept_store_${floor}.json`), 'utf8')
        );
        const elevatorWarp = floorMap.warps.find((w) => w.x === 2 && w.y === 0);
        expect(elevatorWarp).toBeDefined();
        expect(elevatorWarp?.targetMapId).toBe('goldenrod_dept_store_elevator');
      }
    });
  });

  // =========================================================================
  // Issue #30: Goldenrod Dept Store 1F Receptionist Placement & Counter
  // =========================================================================
  describe('Issue #30: Goldenrod Dept Store 1F Receptionist Placement', () => {
    it('positions receptionist at (10, 1) facing DOWN with talkAcrossCounter: true', () => {
      const npcs = createGoldenrodBuildingsAndParkNpcs().goldenrod_dept_store_1f;
      expect(npcs).toBeDefined();
      const rec = npcs.find((n) => n.id === 'dept_rec');
      expect(rec).toBeDefined();
      expect(rec?.x).toBe(10);
      expect(rec?.y).toBe(1);
      expect(rec?.direction).toBe('DOWN');
      expect(rec?.talkAcrossCounter).toBe(true);
    });

    it('has solid counter at (10, 2) with walkable tiles for receptionist (10, 1) and player (10, 3)', () => {
      const dept1f: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_dept_store_1f.json'), 'utf8')
      );
      // Receptionist floor at (10, 1) is walkable
      expect(dept1f.collisionGrid[1 * dept1f.width + 10]).toBe(0);
      // Counter at (10, 2) is solid (1)
      expect(dept1f.collisionGrid[2 * dept1f.width + 10]).toBe(1);
      // Player floor at (10, 3) is walkable
      expect(dept1f.collisionGrid[3 * dept1f.width + 10]).toBe(0);
    });
  });

  // =========================================================================
  // Issue #31: Goldenrod Dept Store 5F Camper Mike Trade (Drowzee for Machop)
  // =========================================================================
  describe('Issue #31: Goldenrod Dept Store 5F Camper Mike Trade', () => {
    let mockContext: NpcInteractionContext;
    let storyFlags: Set<string>;
    let openDialogueSpy: any;
    let showToastSpy: any;
    let targetNpc: any;

    beforeEach(() => {
      storyFlags = new Set<string>();
      openDialogueSpy = vi.fn((pages: string[], speaker?: string, onClose?: () => void) => {
        onClose?.();
      });
      showToastSpy = vi.fn();

      mockContext = {
        player: { x: 7, y: 4, direction: 'UP' } as any,
        playerName: 'GOLD',
        playerParty: [],
        storyFlags,
        openDialogue: openDialogueSpy,
        showToast: showToastSpy,
        openMart: vi.fn(),
        openDeptElevatorModal: vi.fn(),
        saveCurrentGame: vi.fn(),
        mapManager: {
          getCurrentMap: () => ({ id: 'goldenrod_dept_store_5f' }) as any,
        } as any,
      } as unknown as NpcInteractionContext;

      const npcs = createGoldenrodBuildingsAndParkNpcs().goldenrod_dept_store_5f;
      targetNpc = npcs.find((n) => n.id === 'dept_5f_mike');
    });

    it('registers Camper Mike NPC at (7, 3) facing DOWN with DEPT_STORE_TRADE_MIKE action', () => {
      expect(targetNpc).toBeDefined();
      expect(targetNpc.x).toBe(7);
      expect(targetNpc.y).toBe(3);
      expect(targetNpc.direction).toBe('DOWN');
      expect(targetNpc.action).toBe('DEPT_STORE_TRADE_MIKE');
    });

    it('asks for Drowzee if player does not have one in party and does not set flag', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const tradeHandler = interactions.find((i) => i.actions?.includes('DEPT_STORE_TRADE_MIKE'));
      expect(tradeHandler).toBeDefined();

      // Party contains only Cyndaquil
      mockContext.playerParty = [PokemonFactory.create('cyndaquil', 15)];

      const handled = tradeHandler?.handler(targetNpc, {} as any, mockContext);
      expect(handled).toBe(true);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("I'm looking for a DROWZEE!")]),
        targetNpc.speaker
      );
      expect(storyFlags.has('traded_machop_chris')).toBe(false);
    });

    it('trades Drowzee for Machop "CHRIS" Lv. 15 with canonical OT, ID, moves and Gold Berry', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const tradeHandler = interactions.find((i) => i.actions?.includes('DEPT_STORE_TRADE_MIKE'));

      const drowzee = PokemonFactory.create('drowzee', 14);
      mockContext.playerParty = [drowzee];

      const handled = tradeHandler?.handler(targetNpc, {} as any, mockContext);
      expect(handled).toBe(true);

      // Verify flag is set
      expect(storyFlags.has('traded_machop_chris')).toBe(true);

      // Verify party slot 0 is now Machop "CHRIS"
      const receivedMachop = mockContext.playerParty[0];
      expect(receivedMachop.speciesId.toLowerCase()).toBe('machop');
      expect(receivedMachop.level).toBe(15);
      expect(receivedMachop.nickname).toBe('CHRIS');
      expect(receivedMachop.originalTrainer).toBe('MIKE');
      expect(receivedMachop.otId).toBe('25740');
      expect(receivedMachop.heldItem).toBe('gold-berry');
      expect(receivedMachop.moves.map((m) => m.moveId)).toEqual([
        'karatechop',
        'lowkick',
        'leer',
        'focusenergy',
      ]);

      // Toast displayed
      expect(showToastSpy).toHaveBeenCalledWith(expect.stringContaining('CHRIS'));
    });

    it('returns post-trade dialogue on subsequent interactions', () => {
      const interactions = getGoldenrodExpansionInteractions();
      const tradeHandler = interactions.find((i) => i.actions?.includes('DEPT_STORE_TRADE_MIKE'));

      storyFlags.add('traded_machop_chris');

      const handled = tradeHandler?.handler(targetNpc, {} as any, mockContext);
      expect(handled).toBe(true);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('How is that MACHOP I traded you doing?')]),
        targetNpc.speaker
      );
    });
  });

  // =========================================================================
  // Issue #32: Goldenrod Dept Store 6F Vending Machines
  // =========================================================================
  describe('Issue #32: Goldenrod Dept Store 6F Vending Machines', () => {
    it('verifies fat man NPC is completely removed from Dept Store 6F (10, 1)', () => {
      const npcs = createGoldenrodBuildingsAndParkNpcs().goldenrod_dept_store_6f;
      const fatManAtCounter = npcs?.find((n) => n.x === 10 && n.y === 1);
      expect(fatManAtCounter).toBeUndefined();
      const vendingNpc = npcs?.find((n) => n.id === 'dept_vending_6f');
      expect(vendingNpc).toBeUndefined();
    });

    it('has 3 VENDING_MACHINE bgEvents at (8, 1), (9, 1), and (10, 1)', () => {
      const dept6f: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_dept_store_6f.json'), 'utf8')
      );
      expect(dept6f.bgEvents).toBeDefined();

      const vm8 = dept6f.bgEvents?.find((bg) => bg.x === 8 && bg.y === 1);
      expect(vm8).toBeDefined();
      expect(vm8?.action).toBe('VENDING_MACHINE');

      const vm9 = dept6f.bgEvents?.find((bg) => bg.x === 9 && bg.y === 1);
      expect(vm9).toBeDefined();
      expect(vm9?.action).toBe('VENDING_MACHINE');

      const vm10 = dept6f.bgEvents?.find((bg) => bg.x === 10 && bg.y === 1);
      expect(vm10).toBeDefined();
      expect(vm10?.action).toBe('VENDING_MACHINE');
    });

    it('dispatches vending mart modal when interacting with VENDING_MACHINE bgEvent', () => {
      const dept6f: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_dept_store_6f.json'), 'utf8')
      );
      const openMartSpy = vi.fn();
      const openDialogueSpy = vi.fn((pages: string[], speaker?: string, onClose?: () => void) => {
        onClose?.();
      });

      const mockCtx = {
        openDialogue: openDialogueSpy,
        openMart: openMartSpy,
        mapManager: {
          getCurrentMap: () => dept6f,
          checkBgEvent: (x: number, y: number) =>
            dept6f.bgEvents?.find((bg) => bg.x === x && bg.y === y),
        },
      } as any;

      const handled = FieldObstacleDispatcher.handleFieldAndBgInteraction(
        mockCtx,
        dept6f,
        8,
        1
      );

      expect(handled).toBe(true);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        ['VENDING MACHINE: Clang! Refreshing drinks in stock!'],
        '🥤 VENDING MACHINE',
        expect.any(Function)
      );
      expect(openMartSpy).toHaveBeenCalledWith('goldenrod_dept_store_6f');
    });
  });

  // =========================================================================
  // Issue #34: Goldenrod Magnet Train Station Tileset & Geometry
  // =========================================================================
  describe('Issue #34: Goldenrod Magnet Train Station Tileset', () => {
    const stationPath = path.join(mapsDir, 'goldenrod_magnet_train_station.json');
    const station: MapData = JSON.parse(fs.readFileSync(stationPath, 'utf8'));

    it('uses authentic train_station tileset with in_train_station_ tile prefix', () => {
      expect(station.id).toBe('goldenrod_magnet_train_station');
      for (const tileId of station.tileMap) {
        expect(tileId).toMatch(/^in_train_station_/);
      }
    });

    it('has valid exit warps targeting Goldenrod City with walkable exit tiles', () => {
      const exitWarps = station.warps.filter((w) => w.targetMapId === 'goldenrod_city');
      expect(exitWarps.length).toBeGreaterThan(0);
      for (const warp of exitWarps) {
        expect(station.collisionGrid[warp.y * station.width + warp.x]).toBe(0);
      }
    });
  });
});
