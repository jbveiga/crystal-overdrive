import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  createGoldenrodTakeoverInteractions,
  handleBasementDoor,
  handleShutterSwitches,
  handleRealDirectorRescue,
  handleCardKeyShutter,
  handleExecutiveProton,
  handleExecutiveAriana,
  handleExecutiveArcherBoss,
  handleLiberatedDirectorRewards,
  handleDJMaryPinkBow,
} from '../../src/world/interactions/GoldenrodTakeoverInteractions';
import { createGoldenrodBuildingsAndParkNpcs } from '../../src/world/npcs/goldenrodBuildingsAndParkNpcs';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-STORY-TEAM-ROCKET-GOLDENROD-TAKEOVER-01: Phase B Verification Suite', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;

  beforeEach(() => {
    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('typhlosion', 35)],
      inventory: { money: 10000, badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'], items: {}, balls: {}, tms: [], keyItems: [] },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      openDialogue: (_pages, _speaker, onComplete) => {
        if (onComplete) onComplete();
      },
      showToast: () => {},
      saveCurrentGame: () => {},
      triggerBattle: () => {},
      addOverworldItemToInventory: (item: string) => {
        if (!mockContext.inventory!.items) mockContext.inventory!.items = {};
        mockContext.inventory!.items[item] = (mockContext.inventory!.items[item] || 0) + 1;
      },
      buildTrainerTeamInstances: () => [PokemonFactory.create('weezing', 33)],
      mapManager: {
        getCurrentMap: () => null,
      } as any,
    };
  });

  describe('1. Map & Warp Architecture (Underground & Warehouse)', () => {
    it('verifies goldenrod_underground.json basement door warp at (18, 6)', () => {
      const ug: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_underground.json'), 'utf8')
      );
      const doorWarp = ug.warps.find((w) => w.x === 18 && w.y === 6);
      expect(doorWarp).toBeDefined();
      expect(doorWarp).toEqual({
        x: 18,
        y: 6,
        targetMapId: 'goldenrod_underground_switch_room_entrances',
        targetX: 23,
        targetY: 3,
      });
    });

    it('verifies goldenrod_underground_switch_room_entrances.json (30x36) dimensions and reciprocal warps', () => {
      const sr: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_underground_switch_room_entrances.json'), 'utf8')
      );
      expect(sr.id).toBe('goldenrod_underground_switch_room_entrances');
      expect(sr.width).toBe(30);
      expect(sr.height).toBe(36);

      // Reciprocal warp back to goldenrod_underground
      const toUg = sr.warps.find((w) => w.targetMapId === 'goldenrod_underground');
      expect(toUg).toEqual({ x: 23, y: 3, targetMapId: 'goldenrod_underground', targetX: 18, targetY: 6 });

      // Warps to goldenrod_underground_warehouse
      const toWh = sr.warps.filter((w) => w.targetMapId === 'goldenrod_underground_warehouse');
      expect(toWh.length).toBe(2);
      expect(toWh).toContainEqual({ x: 22, y: 10, targetMapId: 'goldenrod_underground_warehouse', targetX: 1, targetY: 1 });
      expect(toWh).toContainEqual({ x: 23, y: 10, targetMapId: 'goldenrod_underground_warehouse', targetX: 2, targetY: 1 });

      // BgEvents for the 4 wall switches
      expect(sr.bgEvents).toHaveLength(4);
      expect(sr.bgEvents.find((e) => e.x === 16 && e.y === 1)).toBeDefined();
      expect(sr.bgEvents.find((e) => e.x === 10 && e.y === 1)).toBeDefined();
      expect(sr.bgEvents.find((e) => e.x === 2 && e.y === 1)).toBeDefined();
      expect(sr.bgEvents.find((e) => e.x === 20 && e.y === 11)).toBeDefined();
    });

    it('verifies goldenrod_underground_warehouse.json (20x18) and Real Director placement', () => {
      const wh: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'goldenrod_underground_warehouse.json'), 'utf8')
      );
      expect(wh.id).toBe('goldenrod_underground_warehouse');
      expect(wh.width).toBe(20);
      expect(wh.height).toBe(18);

      // Warps back to Switch Room and exit to Dept Store 1F
      expect(wh.warps).toContainEqual({
        x: 1,
        y: 1,
        targetMapId: 'goldenrod_underground_switch_room_entrances',
        targetX: 22,
        targetY: 10,
      });
      expect(wh.warps).toContainEqual({
        x: 18,
        y: 1,
        targetMapId: 'goldenrod_dept_store_1f',
        targetX: 7,
        targetY: 7,
      });

      // Director standing spot at (8, 2) is walkable 0
      expect(wh.collisionGrid[2 * 20 + 8]).toBe(0);

      // Verify Real Director NPC registration
      const npcs = createGoldenrodBuildingsAndParkNpcs();
      const warehouseNpcs = npcs.goldenrod_underground_warehouse;
      expect(warehouseNpcs).toBeDefined();
      const director = warehouseNpcs.find((n) => n.id === 'real_director_warehouse');
      expect(director).toBeDefined();
      expect(director?.x).toBe(8);
      expect(director?.y).toBe(2);
      expect(director?.action).toBe('UNDERGROUND_REAL_DIRECTOR');
    });

    it('verifies radio_tower_3f.json has Card Key shutter bgEvents at (0, 7) and (14, 2)', () => {
      const rt3: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'radio_tower_3f.json'), 'utf8')
      );
      expect(rt3.bgEvents.some((e) => e.x === 0 && e.y === 7)).toBe(true);
      expect(rt3.bgEvents.some((e) => e.x === 14 && e.y === 2)).toBe(true);
    });
  });

  describe('2. Underground Basement Door & Switch Room Puzzle', () => {
    it('asserts Basement Door blocks entry without key and unlocks with BASEMENT KEY', () => {
      let dialogue: string[] = [];
      mockContext.openDialogue = (pages) => {
        dialogue = pages;
      };

      const doorNpc = { id: 'basement_door', speaker: '🚪 BASEMENT DOOR' } as any;

      // 1. Without key
      handleBasementDoor(doorNpc, {} as any, mockContext as NpcInteractionContext);
      expect(dialogue[0]).toContain('securely locked');
      expect(mockContext.storyFlags!.has('EVENT_USED_BASEMENT_KEY')).toBe(false);

      // 2. With key
      mockContext.storyFlags!.add('has_basement_key');
      handleBasementDoor(doorNpc, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('EVENT_USED_BASEMENT_KEY')).toBe(true);
      expect(dialogue.some((p) => p.includes('steel door opened'))).toBe(true);
    });

    it('asserts 4 wall switches toggle their respective state flags in Switch Room', () => {
      let dialogue: string[] = [];
      mockContext.openDialogue = (pages) => {
        dialogue = pages;
      };

      // Switch 1 at (16, 1)
      handleShutterSwitches({ id: 'switch_1', x: 16, y: 1 } as any, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('SWITCH_1_ON')).toBe(true);
      expect(dialogue[0]).toContain('Turned it ON');

      handleShutterSwitches({ id: 'switch_1', x: 16, y: 1 } as any, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('SWITCH_1_ON')).toBe(false);
      expect(dialogue[0]).toContain('Turned it OFF');

      // Switch 2 at (10, 1)
      handleShutterSwitches({ id: 'switch_2', x: 10, y: 1 } as any, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('SWITCH_2_ON')).toBe(true);

      // Switch 3 at (2, 1)
      handleShutterSwitches({ id: 'switch_3', x: 2, y: 1 } as any, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('SWITCH_3_ON')).toBe(true);

      // Emergency Switch at (20, 11)
      handleShutterSwitches({ id: 'switch_emergency', x: 20, y: 11 } as any, {} as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('SWITCH_EMERGENCY_ON')).toBe(true);
    });
  });

  describe('3. Real Director Rescue & CARD KEY Award', () => {
    it('asserts Real Director in Warehouse awards CARD KEY', () => {
      let toast = '';
      mockContext.showToast = (msg) => {
        toast = msg;
      };

      const directorNpc = { id: 'real_director_warehouse', speaker: '📻 REAL DIRECTOR' } as any;
      handleRealDirectorRescue(directorNpc, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('card_key_obtained')).toBe(true);
      expect(mockContext.storyFlags!.has('has_card_key')).toBe(true);
      expect(mockContext.inventory!.keyItems).toContain('CARD KEY');
      expect(toast).toContain('CARD KEY');

      // Subsequent interaction tells player to unlock 3F shutters
      let dialogue: string[] = [];
      mockContext.openDialogue = (pages) => {
        dialogue = pages;
      };
      handleRealDirectorRescue(directorNpc, {} as any, mockContext as NpcInteractionContext);
      expect(dialogue[0]).toContain('Please use that CARD KEY to unlock the 3F security shutters');
    });
  });

  describe('4. Radio Tower 3F Card Key Shutter & Infiltration', () => {
    it('asserts 3F shutter blocks without Card Key and opens with Card Key', () => {
      const mockMap = {
        id: 'radio_tower_3f',
        width: 18,
        height: 8,
        collisionGrid: new Array(18 * 8).fill(1),
      } as any;

      let dialogue: string[] = [];
      mockContext.openDialogue = (pages) => {
        dialogue = pages;
      };

      const shutterNpc = { id: 'shutter_gate', speaker: '💳 CARD KEY SHUTTER' } as any;

      // 1. Without card key
      handleCardKeyShutter(shutterNpc, mockMap, mockContext as NpcInteractionContext);
      expect(dialogue[0]).toContain('A CARD KEY slot is installed');
      expect(mockContext.storyFlags!.has('EVENT_USED_CARD_KEY')).toBe(false);

      // 2. With card key
      mockContext.storyFlags!.add('card_key_obtained');
      handleCardKeyShutter(shutterNpc, mockMap, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags!.has('EVENT_USED_CARD_KEY')).toBe(true);
      expect(mockMap.collisionGrid[7 * 18 + 0]).toBe(0); // Shutter retracted to walkable
      expect(dialogue.some((p) => p.includes('inserted the CARD KEY'))).toBe(true);
    });
  });

  describe('5. Upper Radio Tower Executive Battles & Climax', () => {
    it('asserts 4F Executive Proton battle defeat sets proton_defeated', () => {
      let battleTriggered = false;
      mockContext.triggerBattle = (_mon, opts: any) => {
        battleTriggered = true;
        opts.onVictory();
      };

      const protonNpc = {
        id: 'executive_proton_radio_4f',
        speaker: '⚡ EXECUTIVE PROTON',
        trainerName: 'Executive Proton',
      } as any;

      handleExecutiveProton(protonNpc, {} as any, mockContext as NpcInteractionContext);
      expect(battleTriggered).toBe(true);
      expect(mockContext.storyFlags!.has('proton_defeated')).toBe(true);
      expect(mockContext.defeatedTrainers!.has('proton_radio')).toBe(true);
    });

    it('asserts 5F Executive Ariana battle defeat sets ariana_defeated', () => {
      let battleTriggered = false;
      mockContext.triggerBattle = (_mon, opts: any) => {
        battleTriggered = true;
        opts.onVictory();
      };

      const arianaNpc = {
        id: 'executive_ariana_radio_5f',
        speaker: '⚡ EXECUTIVE ARIANA',
        trainerName: 'Executive Ariana',
      } as any;

      handleExecutiveAriana(arianaNpc, {} as any, mockContext as NpcInteractionContext);
      expect(battleTriggered).toBe(true);
      expect(mockContext.storyFlags!.has('ariana_defeated')).toBe(true);
      expect(mockContext.defeatedTrainers!.has('ariana_radio')).toBe(true);
    });

    it('asserts 5F Executive Archer Boss battle defeat disbands Team Rocket and awards Clear Bell & Rainbow Wing', () => {
      let battleTriggered = false;
      mockContext.triggerBattle = (_mon, opts: any) => {
        battleTriggered = true;
        opts.onVictory();
      };

      const archerNpc = {
        id: 'archer_radio_5f',
        speaker: '⚡ EXECUTIVE ARCHER',
        trainerName: 'Executive Archer',
      } as any;

      handleExecutiveArcherBoss(archerNpc, {} as any, mockContext as NpcInteractionContext);
      expect(battleTriggered).toBe(true);
      expect(mockContext.storyFlags!.has('archer_defeated')).toBe(true);
      expect(mockContext.storyFlags!.has('radio_tower_liberated')).toBe(true);
      expect(mockContext.storyFlags!.has('TEAM_ROCKET_DISBANDED')).toBe(true);
      expect(mockContext.storyFlags!.has('has_clear_bell')).toBe(true);
      expect(mockContext.inventory!.items['clear-bell']).toBe(1);
      expect(mockContext.inventory!.items['rainbow-wing']).toBe(1);
    });
  });

  describe('6. Post-Liberation Rewards (Liberated Director & DJ Mary)', () => {
    it('asserts Liberated Director in 5F office awards Clear Bell and unlocks Poké Flute channel', () => {
      mockContext.storyFlags!.add('radio_tower_liberated');

      let toast = '';
      mockContext.showToast = (msg) => {
        toast = msg;
      };

      const dirNpc = { id: 'liberated_director_radio_5f', speaker: '📻 DIRECTOR' } as any;
      handleLiberatedDirectorRewards(dirNpc, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('has_clear_bell')).toBe(true);
      expect(mockContext.storyFlags!.has('poke_flute_channel_unlocked')).toBe(true);
      expect(mockContext.inventory!.keyItems).toContain('CLEAR BELL');
      expect(toast).toContain('POKé FLUTE');
    });

    it('asserts DJ Mary on 4F awards Pink Bow after liberation', () => {
      mockContext.storyFlags!.add('radio_tower_liberated');

      let toast = '';
      mockContext.showToast = (msg) => {
        toast = msg;
      };

      const maryNpc = { id: 'dj_mary', speaker: '🎙️ DJ MARY' } as any;
      handleDJMaryPinkBow(maryNpc, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('EVENT_GOT_PINK_BOW_FROM_MARY')).toBe(true);
      expect(mockContext.inventory!.items['pink_bow']).toBe(1);
      expect(toast).toContain('PINK BOW');

      // Subsequent interaction explains Pink Bow effect
      let dialogue: string[] = [];
      mockContext.openDialogue = (pages) => {
        dialogue = pages;
      };
      handleDJMaryPinkBow(maryNpc, {} as any, mockContext as NpcInteractionContext);
      expect(dialogue[0]).toContain('Normal-type moves become more powerful');
    });
  });

  describe('7. Router Registration Completeness', () => {
    it('registers all Phase B actions and NPCs cleanly in router array', () => {
      const registrations = createGoldenrodTakeoverInteractions();
      expect(registrations.length).toBeGreaterThanOrEqual(9);

      const actions = registrations.flatMap((r) => r.actions || []);
      expect(actions).toContain('UNDERGROUND_BASEMENT_DOOR');
      expect(actions).toContain('UNDERGROUND_SHUTTER_SWITCH');
      expect(actions).toContain('UNDERGROUND_REAL_DIRECTOR');
      expect(actions).toContain('RADIO_TOWER_CARD_KEY_SHUTTER');
      expect(actions).toContain('EXECUTIVE_PROTON_EVENT');
      expect(actions).toContain('EXECUTIVE_ARIANA_EVENT');
      expect(actions).toContain('EXECUTIVE_ARCHER_EVENT');
      expect(actions).toContain('LIBERATED_DIRECTOR_EVENT');
      expect(actions).toContain('DJ_MARY_EVENT');
    });
  });
});
