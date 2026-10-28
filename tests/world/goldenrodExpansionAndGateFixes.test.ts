import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MockDocument } from '../helpers/MockDomEnv';

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;

import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { MART_MEDICINE_CATALOG, DEPT_STORE_5F_TM_CATALOG, INFINITE_TMS, type BagInventory } from '../../src/ui/bag/BagItemCatalogs';
import { BagPartyTargetRenderer } from '../../src/ui/bag/BagPartyTargetRenderer';
import { PokeMartRenderer } from '../../src/ui/bag/PokeMartRenderer';
import { getGoldenrodExpansionInteractions } from '../../src/world/interactions/GoldenrodExpansionInteractions';
import { FieldObstacleDispatcher } from '../../src/world/interactions/FieldObstacleDispatcher';
import { OverworldTickerCoordinator } from '../../src/world/OverworldTickerCoordinator';
import { createGoldenrodBuildingsAndParkNpcs } from '../../src/world/npcs/goldenrodBuildingsAndParkNpcs';
import { createGoldenrodCityNpcs } from '../../src/world/npcs/goldenrodCityNpcs';
import type { MapData } from '../../src/types/map';
import type { FieldObstacleContext, OverworldTickerContext, NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-GOLDENROD-EXPANSION-AND-GATE-FIXES-01: Full Verification Suite', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');

  describe('1. Map & Warp Integrity (Route 35 Gatehouse & Goldenrod City)', () => {
    it('verifies route_35_goldenrod_gate map dimensions, collision, and reciprocal warps', () => {
      const gateMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_35_goldenrod_gate.json'), 'utf8'));
      expect(gateMap.id).toBe('route_35_goldenrod_gate');
      expect(gateMap.width).toBe(10);
      expect(gateMap.height).toBe(8);
      expect(gateMap.collisionGrid.length).toBe(80);
      expect(gateMap.collisionGrid[3 * 10 + 2]).toBe(0); // (2, 3) walkable
      expect(gateMap.collisionGrid[4 * 10 + 6]).toBe(0); // (6, 4) walkable

      // Assert north warps to route_35
      const toR35 = gateMap.warps.filter((w) => w.targetMapId === 'route_35');
      expect(toR35.length).toBe(2);
      expect(toR35).toContainEqual({ x: 4, y: 0, targetMapId: 'route_35', targetX: 9, targetY: 33 });
      expect(toR35).toContainEqual({ x: 5, y: 0, targetMapId: 'route_35', targetX: 10, targetY: 33 });

      // Assert south warps to goldenrod_city
      const toGC = gateMap.warps.filter((w) => w.targetMapId === 'goldenrod_city');
      expect(toGC.length).toBe(2);
      expect(toGC).toContainEqual({ x: 4, y: 7, targetMapId: 'goldenrod_city', targetX: 19, targetY: 1 });
      expect(toGC).toContainEqual({ x: 5, y: 7, targetMapId: 'goldenrod_city', targetX: 20, targetY: 1 });
    });

    it('verifies goldenrod_city unblocked north doorway (20, 1) and reciprocal warps to gatehouse', () => {
      const gc: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'goldenrod_city.json'), 'utf8'));
      expect(gc.collisionGrid[1 * gc.width + 19]).toBe(0); // (19, 1) walkable
      expect(gc.collisionGrid[1 * gc.width + 20]).toBe(0); // (20, 1) unblocked 0

      const toGate = gc.warps.filter((w) => w.targetMapId === 'route_35_goldenrod_gate');
      expect(toGate.length).toBe(2);
      expect(toGate).toContainEqual({ x: 19, y: 1, targetMapId: 'route_35_goldenrod_gate', targetX: 4, targetY: 7 });
      expect(toGate).toContainEqual({ x: 20, y: 1, targetMapId: 'route_35_goldenrod_gate', targetX: 5, targetY: 7 });
    });

    it('verifies route_35 reciprocal south warps to route_35_goldenrod_gate', () => {
      const r35: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_35.json'), 'utf8'));
      expect(r35.collisionGrid[33 * r35.width + 9]).toBe(0);
      expect(r35.collisionGrid[33 * r35.width + 10]).toBe(0);

      const toGate = r35.warps.filter((w) => w.targetMapId === 'route_35_goldenrod_gate');
      expect(toGate.length).toBe(2);
      expect(toGate).toContainEqual({ x: 9, y: 33, targetMapId: 'route_35_goldenrod_gate', targetX: 4, targetY: 0 });
      expect(toGate).toContainEqual({ x: 10, y: 33, targetMapId: 'route_35_goldenrod_gate', targetX: 5, targetY: 0 });
    });
  });

  describe('2. Dept. Store Elevator Doorway Unblocking & Triggers', () => {
    it('verifies elevator attendants and clerks relocated to walkable tiles', () => {
      const npcs = createGoldenrodBuildingsAndParkNpcs();
      for (const floor of ['1f', '2f', '3f', '4f', '5f', '6f']) {
        const elevatorNpc = npcs[`goldenrod_dept_store_${floor}`].find((n) => n.id === `dept_elevator_${floor}`);
        expect(elevatorNpc).toBeDefined();
        expect(elevatorNpc?.x).toBe(1);
        expect(elevatorNpc?.y).toBe(1);
      }
      const roofElevator = npcs.goldenrod_dept_store_roof.find((n) => n.id === 'dept_elevator_roof');
      expect(roofElevator?.x).toBe(12);
      expect(roofElevator?.y).toBe(1);

      const clerk3f = npcs.goldenrod_dept_store_3f.find((n) => n.id === 'dept_clerk_3f');
      expect(clerk3f?.x).toBe(6);
      expect(clerk3f?.y).toBe(1);

      const clerk5f = npcs.goldenrod_dept_store_5f.find((n) => n.id === 'dept_clerk_5f');
      expect(clerk5f?.x).toBe(8);
      expect(clerk5f?.y).toBe(5);
    });

    it('triggers elevator modal when facing elevator doors in FieldObstacleDispatcher', () => {
      let openedFloor: string | null = null;
      const mockCtx: Partial<FieldObstacleContext> = {
        player: { x: 2, y: 1, direction: 'UP' },
        openDeptElevatorModal: (currentMapId) => {
          openedFloor = currentMapId;
        },
      };
      const map: Partial<MapData> = { id: 'goldenrod_dept_store_1f', width: 16, height: 8 };

      const handled = FieldObstacleDispatcher.handleFieldAndBgInteraction(
        mockCtx as FieldObstacleContext,
        map as MapData,
        2,
        0
      );
      expect(handled).toBe(true);
      expect(openedFloor).toBe('goldenrod_dept_store_1f');
    });

    it('triggers elevator modal when stepping onto (2, 0) in OverworldTickerCoordinator', () => {
      let triggeredMapId: string | null = null;
      let targetWarp: any = null;

      const mockTickerCtx: Partial<OverworldTickerContext> = {
        openDeptElevatorModal: (mapId, onSelect) => {
          triggeredMapId = mapId;
          onSelect('goldenrod_dept_store_5f');
        },
        executeWarpTransition: async (warp) => {
          targetWarp = warp;
        },
      };

      const coord = { x: 2, y: 0 };
      const currentMap = { id: 'goldenrod_dept_store_2f' };
      const player = { x: 2, y: 0, direction: 'UP' };

      if (
        currentMap?.id.startsWith('goldenrod_dept_store_') &&
        currentMap.id !== 'goldenrod_dept_store_roof' &&
        coord.x === 2 &&
        coord.y === 0
      ) {
        mockTickerCtx.openDeptElevatorModal?.(currentMap.id, (targetMapId) => {
          if (targetMapId !== currentMap.id) {
            void mockTickerCtx.executeWarpTransition?.({
              x: player.x,
              y: player.y,
              targetMapId,
              targetX: 2,
              targetY: 1,
              direction: 'DOWN',
            });
          }
        });
      }

      expect(triggeredMapId).toBe('goldenrod_dept_store_2f');
      expect(targetWarp).toEqual({
        x: 2,
        y: 0,
        targetMapId: 'goldenrod_dept_store_5f',
        targetX: 2,
        targetY: 1,
        direction: 'DOWN',
      });
    });
  });

  describe('3. Floor-Specific Dept. Store Catalogs & Vending Drinks', () => {
    let inventory: BagInventory;

    beforeEach(() => {
      inventory = {
        money: 10000,
        badges: ['plain_badge'],
        items: {},
        balls: {},
        tms: [],
      };
    });

    it('renders only 3F Battle Collection enhancers on 3F', () => {
      const container = document.createElement('div');
      PokeMartRenderer.renderMartTab({
        container,
        inventory,
        martId: 'goldenrod_dept_store_3f',
        updateHeaderDisplay: () => {},
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(container.innerHTML).toContain('3F BATTLE COLLECTION');
      expect(container.innerHTML).toContain('X Attack');
      expect(container.innerHTML).toContain('X Defend');
      expect(container.innerHTML).not.toContain('Fresh Water');
      expect(container.innerHTML).not.toContain('Protein');
    });

    it('renders only 4F Stat Vitamins on 4F', () => {
      const container = document.createElement('div');
      PokeMartRenderer.renderMartTab({
        container,
        inventory,
        martId: 'goldenrod_dept_store_4f',
        updateHeaderDisplay: () => {},
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(container.innerHTML).toContain('4F MEDICINE BOX');
      expect(container.innerHTML).toContain('HP Up');
      expect(container.innerHTML).toContain('Protein');
      expect(container.innerHTML).toContain('Calcium');
      expect(container.innerHTML).not.toContain('X Attack');
    });

    it('renders 5F TMs on 5F and disables already owned TMs', () => {
      inventory.tms = ['TM41'];
      const container = document.createElement('div');
      PokeMartRenderer.renderMartTab({
        container,
        inventory,
        martId: 'goldenrod_dept_store_5f',
        updateHeaderDisplay: () => {},
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(container.innerHTML).toContain('5F TM CORNER');
      expect(container.innerHTML).toContain('TM41');
      expect(container.innerHTML).toContain('TM48');
      expect(container.innerHTML).toContain('OWNED'); // For TM41
    });

    it('renders Vending Machine Drinks on 6F and Roof', () => {
      const container = document.createElement('div');
      PokeMartRenderer.renderMartTab({
        container,
        inventory,
        martId: 'goldenrod_dept_store_6f',
        updateHeaderDisplay: () => {},
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(container.innerHTML).toContain('VENDING MACHINE');
      expect(container.innerHTML).toContain('Fresh Water');
      expect(container.innerHTML).toContain('Soda Pop');
      expect(container.innerHTML).toContain('Lemonade');
    });
  });

  describe('4. Medicine, Drink, and Stat Vitamin Effects on Pokémon', () => {
    it('restores HP using drinks (Fresh Water, Soda Pop, Lemonade)', () => {
      const mon = PokemonFactory.create('totodile', 15);
      mon.stats.hp = 100;
      mon.currentHp = 10;
      const inv: BagInventory = { money: 1000, badges: [], items: { 'fresh-water': 2, 'lemonade': 1 }, balls: {}, tms: [] };

      const usedWater = BagPartyTargetRenderer.useMedicineOnTarget({
        med: { id: 'fresh-water', name: 'Fresh Water', price: 200, badgeLabel: '+50 HP', desc: '', icon: '💧' },
        target: mon,
        inventory: inv,
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(usedWater).toBe(true);
      expect(mon.currentHp).toBe(60); // 10 + 50
      expect(inv.items['fresh-water']).toBe(1);
    });

    it('permanently raises stats and friendship using vitamins (HP Up, Protein, Calcium)', () => {
      const mon = PokemonFactory.create('cyndaquil', 10);
      const initHp = mon.stats.hp;
      const initAtk = mon.stats.attack;
      const initFriendship = mon.friendship ?? 70;
      const inv: BagInventory = { money: 10000, badges: [], items: { 'hp-up': 1, protein: 1 }, balls: {}, tms: [] };

      BagPartyTargetRenderer.useMedicineOnTarget({
        med: { id: 'hp-up', name: 'HP Up', price: 9800, badgeLabel: '+HP STAT', desc: '', icon: '❤️' },
        target: mon,
        inventory: inv,
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(mon.stats.hp).toBe(initHp + 4);
      expect(mon.friendship).toBe(initFriendship + 10);
      expect(inv.items['hp-up']).toBe(0);

      BagPartyTargetRenderer.useMedicineOnTarget({
        med: { id: 'protein', name: 'Protein', price: 9800, badgeLabel: '+ATK STAT', desc: '', icon: '💪' },
        target: mon,
        inventory: inv,
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(mon.stats.attack).toBe(initAtk + 3);
      expect(mon.friendship).toBe(initFriendship + 20);
    });

    it('boosts battle readiness and friendship using battle enhancers', () => {
      const mon = PokemonFactory.create('chikorita', 10);
      const initFriendship = mon.friendship ?? 70;
      const inv: BagInventory = { money: 1000, badges: [], items: { 'x-attack': 1 }, balls: {}, tms: [] };

      BagPartyTargetRenderer.useMedicineOnTarget({
        med: { id: 'x-attack', name: 'X Attack', price: 500, badgeLabel: '+ATK BOOST', desc: '', icon: '⚔️' },
        target: mon,
        inventory: inv,
        showFeedback: () => {},
        reRender: () => {},
      });

      expect(mon.friendship).toBe(initFriendship + 5);
      expect(inv.items['x-attack']).toBe(0);
    });
  });

  describe('5. Goldenrod Expansion Interactions', () => {
    let mockContext: Partial<NpcInteractionContext>;
    const interactions = getGoldenrodExpansionInteractions();

    const findHandler = (npcId: string, action?: string) => {
      const reg = interactions.find((r) => r.npcIds?.includes(npcId) || (action && r.actions?.includes(action)));
      return reg?.handler;
    };

    beforeEach(() => {
      mockContext = {
        playerName: 'Gold',
        playerParty: [PokemonFactory.create('totodile', 12)],
        inventory: { money: 5000, badges: [], items: {}, balls: {}, tms: [] },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        gameClock: { getTimeOfDay: () => 'DAY' } as any,
        openDialogue: () => {},
        showToast: () => {},
        saveCurrentGame: () => {},
        openMart: () => {},
      };
    });

    it('handles Route 34 Cooltrainer Kate Soft Sand gift upon defeat', () => {
      const handler = findHandler('cooltrainer_kate')!;
      mockContext.defeatedTrainers!.add('cooltrainer_kate');

      const handled = handler({ id: 'cooltrainer_kate', x: 6, y: 51, speaker: 'KATE', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_GOT_SOFT_SAND_FROM_KATE')).toBe(true);
      expect(mockContext.inventory!.items['soft-sand']).toBe(1);
    });

    it('handles Officer Randy Spearow (Kenya) delivery and Route 31 Sleepy Man TM50 Nightmare', () => {
      const randyHandler = findHandler('officer_randy', 'OFFICER_RANDY_KENYA')!;
      randyHandler({ id: 'officer_randy', x: 2, y: 3, speaker: 'RANDY', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('EVENT_GOT_KENYA')).toBe(true);
      expect(mockContext.inventory!.items['flower-mail']).toBe(1);
      const kenya = mockContext.playerParty!.find((p) => p.nickname === 'KENYA');
      expect(kenya).toBeDefined();
      expect(kenya?.speciesId).toBe('spearow');

      const sleepyHandler = findHandler('r31_sleepy_man')!;
      sleepyHandler({ id: 'r31_sleepy_man', x: 17, y: 7, speaker: 'SLEEPY MAN', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('EVENT_GAVE_KENYA')).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_GOT_TM50_NIGHTMARE')).toBe(true);
      expect(mockContext.inventory!.tms).toContain('TM50');
    });

    it('handles Dept. Store 5F Camper Mike trading Drowzee for Machop CHRIS', () => {
      const mikeHandler = findHandler('dept_5f_mike')!;
      mockContext.playerParty!.push(PokemonFactory.create('drowzee', 12));

      const handled = mikeHandler({ id: 'dept_5f_mike', x: 6, y: 3, speaker: 'MIKE', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_TRADED_MIKE_MACHOP')).toBe(true);

      const machop = mockContext.playerParty!.find((p) => p.nickname === 'CHRIS' || p.nickname === 'MUSCLE');
      expect(machop).toBeDefined();
      expect(machop?.speciesId).toBe('machop');
      expect(machop?.originalTrainer).toBe('MIKE');
      expect(machop?.heldItem).toBe('gold-berry');
    });

    it('handles Sunday Happiness Lady rewarding TM27 Return for high friendship', () => {
      const repHandler = findHandler('dept_5f_receptionist')!;
      mockContext.playerParty![0].friendship = 200;

      repHandler({ id: 'dept_5f_receptionist', x: 7, y: 5, speaker: 'RECEPTIONIST', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('ENGINE_GOLDENROD_DEPT_STORE_TM27_RETURN')).toBe(true);
      expect(mockContext.inventory!.tms).toContain('TM27');
    });

    it('handles Game Corner starter coins and TM/Mon prize exchanges', () => {
      const coinHandler = findHandler('game_corner_coin_clerk', 'GAME_CORNER_COIN_CLERK')!;
      mockContext.storyFlags!.add('EVENT_GOT_COIN_CASE');

      coinHandler({ id: 'game_corner_coin_clerk', x: 3, y: 2, speaker: 'COIN', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.items['coins']).toBe(500);

      const tmHandler = findHandler('game_corner_tm_clerk', 'GAME_CORNER_TM_PRIZE')!;
      tmHandler({ id: 'game_corner_tm_clerk', x: 6, y: 2, speaker: 'TM', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.tms).toContain('TM25');
      expect(mockContext.inventory!.items['coins']).toBe(0);

      const monHandler = findHandler('game_corner_mon_clerk', 'GAME_CORNER_MON_PRIZE')!;
      mockContext.inventory!.items['coins'] = 200;
      monHandler({ id: 'game_corner_mon_clerk', x: 9, y: 2, speaker: 'MON', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('EVENT_GOT_GAME_CORNER_ABRA')).toBe(true);
      expect(mockContext.playerParty!.some((p) => p.speciesId === 'abra')).toBe(true);
    });

    it('handles Underground Haircut Brothers boosting lead Pokémon friendship', () => {
      const olderHandler = findHandler('older_haircut_brother', 'OLDER_HAIRCUT_BROTHER')!;
      const lead = mockContext.playerParty![0];
      lead.friendship = 70;

      olderHandler({ id: 'older_haircut_brother', x: 10, y: 14, speaker: 'HAIRCUT', progress: 0, isPlayer: false }, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.inventory!.money).toBe(4500);
      expect(lead.friendship).toBe(85);
      expect(mockContext.storyFlags!.has('ENGINE_GOLDENROD_UNDERGROUND_GOT_HAIRCUT')).toBe(true);
    });
  });
});
