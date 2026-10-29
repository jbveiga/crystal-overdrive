import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/game';
import { createKantoCeladonNpcs } from '../../src/world/npcs/kantoCeladonNpcs';
import {
  handleErikaInteraction,
  handleCeladonGymTrainer,
  handleCeladonGymGuideAndStatues,
  handleCeladonCutTree,
  handleCeladonCafeTrashCan,
  handleCeladonMansionInteractions,
  handleRoute8Trainer,
  getCeladonAndGymErikaInteractions,
} from '../../src/world/interactions/CeladonAndGymErikaInteractions';
import { OverworldItemManager } from '../../src/world/OverworldItemManager';
import { getNpcsForMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';
import { OverworldWarpAndMapTransitionController } from '../../src/world/OverworldWarpAndMapTransitionController';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-CELADON-AND-GYM-ERIKA-01: Celadon City, Celadon Gym & Route 8 Verification', () => {
  const root = path.resolve(__dirname, '../..');
  const mapsDir = path.join(root, 'public/assets/data/maps');
  const bundlePath = path.join(root, 'public/assets/data/world_maps.json');

  const loadMap = (id: string): MapData => {
    const file = path.join(mapsDir, `${id}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  };

  let mockContext: NpcInteractionContext;
  let openedDialogues: Array<{ pages: string[]; speaker?: string }> = [];
  let triggeredBattles: any[] = [];
  let currentMap: MapData;

  beforeEach(() => {
    openedDialogues = [];
    triggeredBattles = [];
    currentMap = loadMap('celadon_city');

    mockContext = {
      playerName: 'GOLD',
      player: { x: 10, y: 32, direction: 'UP' } as any,
      playerParty: [
        {
          nickname: 'TYPHLOSION',
          speciesId: 'typhlosion',
          level: 48,
          currentHp: 150,
          maxHp: 150,
          moves: [{ moveId: 'flamethrower', name: 'Flamethrower', pp: 15, maxPp: 15, currentPp: 15, power: 90, accuracy: 100, type: 'fire', category: 'special' }],
          types: ['fire'],
          isEgg: false,
        } as any,
      ],
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      inventory: {
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising', 'thunder', 'marsh'],
        items: {},
        keyItems: [],
        tms: [],
        money: 50000,
        balls: {},
      } as any,
      mapManager: {
        getCurrentMap: () => currentMap,
        loadMap: (id: string) => {
          currentMap = loadMap(id);
        },
      } as any,
      openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
        openedDialogues.push({ pages, speaker });
        if (onComplete) onComplete();
      },
      triggerBattle: (oppPokemon: any, opts: any) => {
        triggeredBattles.push({ oppPokemon, opts });
        if (opts.onVictory) opts.onVictory();
      },
      addOverworldItemToInventory: (itemId: string) => {
        if (itemId.startsWith('tm')) {
          const tmKey = itemId.toUpperCase();
          if (!mockContext.inventory.tms.includes(tmKey)) {
            mockContext.inventory.tms.push(tmKey);
          }
        } else {
          mockContext.inventory.items[itemId] = (mockContext.inventory.items[itemId] || 0) + 1;
        }
      },
      saveCurrentGame: () => {},
      showToast: () => {},
      renderMap: () => {},
      syncMapOverworldItems: () => {},
    } as any;
  });

  describe('1. Map Connectivity & Reciprocal Warps', () => {
    it('verifies route_7_saffron_gate contains east warps to saffron_city at (9, 4..5)', () => {
      const r7Gate = loadMap('route_7_saffron_gate');
      const eastWarps = r7Gate.warps.filter((w) => w.targetMapId === 'saffron_city');
      expect(eastWarps.length).toBe(2);
      expect(eastWarps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: 9, y: 4, targetMapId: 'saffron_city', targetX: 0, targetY: 18 }),
          expect.objectContaining({ x: 9, y: 5, targetMapId: 'saffron_city', targetX: 0, targetY: 19 }),
        ])
      );
    });

    it('verifies saffron_city contains west warps to route_7_saffron_gate at (0, 18..19)', () => {
      const saffron = loadMap('saffron_city');
      const westGateWarps = saffron.warps.filter((w) => w.targetMapId === 'route_7_saffron_gate');
      expect(westGateWarps.length).toBe(2);
      expect(westGateWarps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: 0, y: 18, targetMapId: 'route_7_saffron_gate', targetX: 9, targetY: 4 }),
          expect.objectContaining({ x: 0, y: 19, targetMapId: 'route_7_saffron_gate', targetX: 9, targetY: 5 }),
        ])
      );
      // Verify walkability of west gate threshold
      expect(saffron.collisionGrid[18 * saffron.width + 0]).toBe(0);
      expect(saffron.collisionGrid[19 * saffron.width + 0]).toBe(0);
    });

    it('verifies route_8_saffron_gate contains west warps to saffron_city at (0, 4..5)', () => {
      const r8Gate = loadMap('route_8_saffron_gate');
      const westWarps = r8Gate.warps.filter((w) => w.targetMapId === 'saffron_city');
      expect(westWarps.length).toBe(2);
      expect(westWarps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: 0, y: 4, targetMapId: 'saffron_city', targetX: 39, targetY: 18 }),
          expect.objectContaining({ x: 0, y: 5, targetMapId: 'saffron_city', targetX: 39, targetY: 19 }),
        ])
      );
    });

    it('verifies saffron_city contains east warps to route_8_saffron_gate at (39, 18..19)', () => {
      const saffron = loadMap('saffron_city');
      const eastGateWarps = saffron.warps.filter((w) => w.targetMapId === 'route_8_saffron_gate');
      expect(eastGateWarps.length).toBe(2);
      expect(eastGateWarps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: 39, y: 18, targetMapId: 'route_8_saffron_gate', targetX: 0, targetY: 4 }),
          expect.objectContaining({ x: 39, y: 19, targetMapId: 'route_8_saffron_gate', targetX: 0, targetY: 5 }),
        ])
      );
      // Verify walkability of east gate threshold
      expect(saffron.collisionGrid[18 * saffron.width + 39]).toBe(0);
      expect(saffron.collisionGrid[19 * saffron.width + 39]).toBe(0);
    });

    it('verifies Celadon Dept Store elevator and floor warp network (1F-6F)', () => {
      const elevator = loadMap('celadon_dept_store_elevator');
      expect(elevator.warps.length).toBe(2);
      expect(elevator.warps[0]).toEqual(expect.objectContaining({ targetMapId: 'celadon_dept_store_1f', targetX: 2, targetY: 1 }));

      const f1 = loadMap('celadon_dept_store_1f');
      const f1ElevatorWarp = f1.warps.find((w) => w.targetMapId === 'celadon_dept_store_elevator');
      expect(f1ElevatorWarp).toBeDefined();

      const f6 = loadMap('celadon_dept_store_6f');
      const f6ElevatorWarp = f6.warps.find((w) => w.targetMapId === 'celadon_dept_store_elevator');
      expect(f6ElevatorWarp).toBeDefined();
    });

    it('verifies world_maps.json bundle includes updated warps', () => {
      const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
      const saffronInBundle = bundle.find((m: any) => m.id === 'saffron_city');
      expect(saffronInBundle).toBeDefined();
      expect(saffronInBundle.warps.some((w: any) => w.targetMapId === 'route_7_saffron_gate')).toBe(true);
      expect(saffronInBundle.warps.some((w: any) => w.targetMapId === 'route_8_saffron_gate')).toBe(true);
    });
  });

  describe('2. Celadon City Cut Tree Obstacle at (10, 31)', () => {
    it('blocks traversal when celadon_cut_tree_cleared flag is absent', () => {
      currentMap = loadMap('celadon_city');
      OverworldWarpAndMapTransitionController.applyMapStoryMutations(mockContext as any, currentMap);
      expect(currentMap.collisionGrid[31 * currentMap.width + 10]).toBe(1);
    });

    it('clears Cut tree when player possesses Cut and Hive Badge', () => {
      currentMap = loadMap('celadon_city');
      mockContext.inventory.keyItems.push('hm01');
      // Player party Typhlosion can cut or compatible pokemon
      mockContext.playerParty[0].moves.push({ moveId: 'cut', name: 'Cut', pp: 30, maxPp: 30, currentPp: 30, power: 50, accuracy: 95, type: 'normal', category: 'physical' });

      const result = handleCeladonCutTree(mockContext, 10, 31);
      expect(result).toBe(true);
      expect(mockContext.storyFlags.has('celadon_cut_tree_cleared')).toBe(true);
      expect(currentMap.collisionGrid[31 * currentMap.width + 10]).toBe(0);
    });

    it('removes celadon_city_cut_tree entity when celadon_cut_tree_cleared is active', () => {
      expect(isNpcActiveForStoryFlags('celadon_city_cut_tree', new Set())).toBe(true);
      expect(isNpcActiveForStoryFlags('celadon_city_cut_tree', new Set(['celadon_cut_tree_cleared']))).toBe(false);
    });
  });

  describe('3. Gym Leader Erika Boss Battle & Rainbow Badge', () => {
    it('triggers Erika battle, awards Rainbow Badge and TM19 Giga Drain', () => {
      const npcs = createKantoCeladonNpcs();
      const erikaNpc = npcs.celadon_gym.find((n) => n.id === 'celadon_gym_erika')!;
      expect(erikaNpc).toBeDefined();

      const handled = handleErikaInteraction(erikaNpc, mockContext);
      expect(handled).toBe(true);
      expect(triggeredBattles.length).toBe(1);
      expect(triggeredBattles[0].opts.trainerName).toBe('LEADER ERIKA');
      expect(triggeredBattles[0].opts.trainerTeam.length).toBe(4);

      // Verify victory awards
      expect(mockContext.storyFlags.has('erika_defeated')).toBe(true);
      expect(mockContext.inventory.badges).toContain('rainbow');
      expect(mockContext.inventory.tms).toContain('TM19');
    });

    it('shows post-battle dialogue when interacting with Erika after victory', () => {
      const npcs = createKantoCeladonNpcs();
      const erikaNpc = npcs.celadon_gym.find((n) => n.id === 'celadon_gym_erika')!;
      mockContext.storyFlags.add('erika_defeated');
      mockContext.inventory.badges.push('rainbow');

      const handled = handleErikaInteraction(erikaNpc, mockContext);
      expect(handled).toBe(true);
      expect(triggeredBattles.length).toBe(0);
      expect(openedDialogues[0].pages[0]).toContain('Losing leaves a bitter aftertaste');
    });
  });

  describe('4. Celadon Gym Guide, Statues & Trainers', () => {
    it('dynamically displays winning trainers on Gym Statues based on Erika defeat', () => {
      const dummyStatue = { id: 'celadon_gym_statue', x: 3, y: 15, action: 'CELADON_GYM_STATUE' } as any;

      // Before defeat
      handleCeladonGymGuideAndStatues(dummyStatue, mockContext);
      expect(openedDialogues[0].pages[2]).toBe('WINNING TRAINERS:\nRED');

      // After defeat
      openedDialogues = [];
      mockContext.storyFlags.add('erika_defeated');
      handleCeladonGymGuideAndStatues(dummyStatue, mockContext);
      expect(openedDialogues[0].pages[2]).toBe('WINNING TRAINERS:\nRED\nGOLD');
    });

    it('verifies Gym Guide advice before and after victory', () => {
      const guideNpc = { id: 'celadon_gym_guide', x: 3, y: 16, action: 'CELADON_GYM_GUIDE' } as any;

      handleCeladonGymGuideAndStatues(guideNpc, mockContext);
      expect(openedDialogues[0].pages[0]).toContain('Yo, CHAMP in making!');

      openedDialogues = [];
      mockContext.storyFlags.add('erika_defeated');
      handleCeladonGymGuideAndStatues(guideNpc, mockContext);
      expect(openedDialogues[0].pages[0]).toContain('withered ERIKA');
    });

    it('verifies 4 Celadon Gym trainers: Michelle, Tanya, Julia, Twins Jo & Zoe', () => {
      const npcs = createKantoCeladonNpcs();
      const gymTrainers = npcs.celadon_gym.filter((n) => n.action === 'CELADON_GYM_TRAINER');
      expect(gymTrainers.length).toBe(5); // Michelle, Tanya, Julia, Twins 1 & 2

      const michelle = gymTrainers.find((t) => t.id === 'celadon_gym_michelle')!;
      handleCeladonGymTrainer(michelle, mockContext);
      expect(mockContext.defeatedTrainers.has('celadon_gym_michelle')).toBe(true);
    });
  });

  describe('5. Celadon Landmarks: Cafe Leftovers & Mansion TM03 Curse', () => {
    it('awards LEFTOVERS from Celadon Cafe trash can and gates repeat pickups', () => {
      const handled = handleCeladonCafeTrashCan(mockContext);
      expect(handled).toBe(true);
      expect(mockContext.storyFlags.has('got_celadon_restaurant_leftovers')).toBe(true);
      expect(mockContext.inventory.items['leftovers']).toBe(1);

      // Repeat inspection
      openedDialogues = [];
      const repeatHandled = handleCeladonCafeTrashCan(mockContext);
      expect(repeatHandled).toBe(true);
      expect(openedDialogues[0].pages[0]).toContain('Nothing here but trash');
      expect(mockContext.inventory.items['leftovers']).toBe(1);
    });

    it('awards TM03 CURSE from Celadon Mansion Penthouse Storyteller', () => {
      const storyteller = { id: 'celadon_mansion_storyteller', x: 3, y: 2, action: 'CELADON_MANSION_STORYTELLER' } as any;

      const handled = handleCeladonMansionInteractions(storyteller, mockContext);
      expect(handled).toBe(true);
      expect(mockContext.storyFlags.has('got_celadon_tm03_curse')).toBe(true);
      expect(mockContext.inventory.tms).toContain('TM03');

      // Post-gift dialogue
      openedDialogues = [];
      handleCeladonMansionInteractions(storyteller, mockContext);
      expect(openedDialogues[0].pages[0]).toContain('TM03 is CURSE');
    });
  });

  describe('6. Route 8 Canonical Trainers', () => {
    it('verifies 5 canonical Route 8 trainers: Dwayne, Harris, Zeke, Sam, Tom', () => {
      const npcs = createKantoCeladonNpcs();
      const r8Trainers = npcs.route_8.filter((n) => n.action === 'ROUTE_8_TRAINER');
      expect(r8Trainers.length).toBe(5);

      const dwayne = r8Trainers.find((t) => t.trainerId === 'biker_dwayne')!;
      expect(dwayne).toBeDefined();
      expect(dwayne.trainerTeam?.length).toBe(2);

      const harris = r8Trainers.find((t) => t.trainerId === 'biker_harris')!;
      expect(harris).toBeDefined();
      expect(harris.trainerTeam?.[0].speciesId).toBe('flareon');

      handleRoute8Trainer(dwayne, mockContext);
      expect(mockContext.defeatedTrainers.has('biker_dwayne')).toBe(true);
    });
  });

  describe('7. NPC Walkability & Router Integrity', () => {
    it('verifies 100% of Celadon and Route 8 NPCs stand on strictly walkable tiles (0 or 2)', () => {
      const npcsByMap = createKantoCeladonNpcs();
      for (const [mapId, npcList] of Object.entries(npcsByMap)) {
        const map = loadMap(mapId);
        for (const npc of npcList) {
          const coll = map.collisionGrid[npc.y * map.width + npc.x];
          expect(
            coll === 0 || coll === 2,
            `NPC ${npc.id} on map ${mapId} at (${npc.x}, ${npc.y}) has non-walkable collision ${coll}`
          ).toBe(true);
        }
      }
    });

    it('verifies getCeladonAndGymErikaInteractions returns all 8 required action routes', () => {
      const routes = getCeladonAndGymErikaInteractions();
      expect(routes.length).toBe(8);
      const actions = routes.flatMap((r) => r.actions || []);
      expect(actions).toEqual(
        expect.arrayContaining([
          'ERIKA_EVENT',
          'CELADON_GYM_TRAINER',
          'CELADON_GYM_GUIDE',
          'CELADON_GYM_STATUE',
          'CELADON_CUT_TREE',
          'CELADON_CAFE_TRASH',
          'CELADON_MANSION_STORYTELLER',
          'ROUTE_8_TRAINER',
        ])
      );
    });
  });
});
