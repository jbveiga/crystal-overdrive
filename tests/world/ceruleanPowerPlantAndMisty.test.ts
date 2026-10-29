import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/game';
import { createKantoCeruleanNpcs } from '../../src/world/npcs/kantoCeruleanNpcs';
import {
  handlePowerPlantManager,
  handleCeruleanGymMachinePart,
  handleCeruleanGymGrunt,
  handleRoute24RocketGrunt,
  handleCeruleanCapeMistyDate,
  handleMistyInteraction,
  handleCeruleanGymTrainer,
  handleCeruleanGymGuideAndStatues,
  handleLavenderRadioTowerDirector,
  handleSleepingSnorlaxAwakening,
  handleRoute5CleanseTagGrandma,
  getCeruleanPowerPlantAndMistyInteractions,
} from '../../src/world/interactions/CeruleanPowerPlantAndMistyInteractions';
import { getNpcsForMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-POWER-PLANT-CERULEAN-MISTY-01: Cerulean City, Power Plant & Snorlax Verification', () => {
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
    currentMap = loadMap('cerulean_city');

    mockContext = {
      playerName: 'GOLD',
      player: { x: 10, y: 10, direction: 'DOWN' } as any,
      playerParty: [
        {
          nickname: 'TYPHLOSION',
          speciesId: 'typhlosion',
          level: 50,
          currentHp: 160,
          maxHp: 160,
          moves: [
            {
              moveId: 'flamethrower',
              name: 'Flamethrower',
              pp: 15,
              maxPp: 15,
              currentPp: 15,
              power: 90,
              accuracy: 100,
              type: 'fire',
              category: 'special',
            },
          ],
          types: ['fire'],
          isEgg: false,
        } as any,
      ],
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      inventory: {
        badges: [
          'zephyr',
          'hive',
          'plain',
          'fog',
          'storm',
          'mineral',
          'glacier',
          'rising',
          'thunder',
          'marsh',
          'rainbow',
        ],
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
      npcsByMap: {
        ...createKantoCeruleanNpcs(),
        vermilion_city: [
          { id: 'vermilion_city_snorlax', x: 34, y: 8, speaker: '💤 SNORLAX' } as any,
        ],
      },
      openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
        openedDialogues.push({ pages, speaker });
        if (onComplete) onComplete();
      },
      triggerBattle: (oppPokemon: any, opts: any) => {
        triggeredBattles.push({ oppPokemon, opts });
        if (opts.onBattleEnd) opts.onBattleEnd();
        if (opts.onVictory) opts.onVictory();
      },
      saveCurrentGame: () => {},
      showToast: () => {},
      renderMap: () => {},
      syncMapOverworldItems: () => {},
    } as any;
  });

  describe('1. Map Connectivity & Reciprocal Warps', () => {
    it('verifies route_10_north has door warp to power_plant at (3, 9)', () => {
      const r10n = loadMap('route_10_north');
      const ppWarp = r10n.warps.find((w) => w.targetMapId === 'power_plant');
      expect(ppWarp).toBeDefined();
      expect(ppWarp).toEqual(
        expect.objectContaining({ x: 3, y: 9, targetMapId: 'power_plant', targetX: 2, targetY: 17 })
      );
      expect(r10n.collisionGrid[9 * r10n.width + 3]).toBe(0);
    });

    it('verifies power_plant has reciprocal exit warps to route_10_north at (2..3, 17)', () => {
      const pp = loadMap('power_plant');
      expect(pp.width).toBe(20);
      expect(pp.height).toBe(18);
      const exitWarps = pp.warps.filter((w) => w.targetMapId === 'route_10_north');
      expect(exitWarps.length).toBe(2);
      expect(pp.collisionGrid[17 * pp.width + 2]).toBe(0);
      expect(pp.collisionGrid[17 * pp.width + 3]).toBe(0);
    });

    it('verifies lavender_town has door warp to lavender_radio_tower_1f at (14, 5)', () => {
      const lav = loadMap('lavender_town');
      const radioWarp = lav.warps.find((w) => w.targetMapId === 'lavender_radio_tower_1f');
      expect(radioWarp).toBeDefined();
      expect(radioWarp).toEqual(
        expect.objectContaining({
          x: 14,
          y: 5,
          targetMapId: 'lavender_radio_tower_1f',
          targetX: 2,
          targetY: 7,
        })
      );
      expect(lav.collisionGrid[5 * lav.width + 14]).toBe(0);
    });

    it('verifies lavender_radio_tower_1f has exit warps to lavender_town at (2..3, 7)', () => {
      const lrt = loadMap('lavender_radio_tower_1f');
      expect(lrt.width).toBe(18);
      expect(lrt.height).toBe(8);
      const exits = lrt.warps.filter((w) => w.targetMapId === 'lavender_town');
      expect(exits.length).toBe(2);
      expect(lrt.collisionGrid[7 * lrt.width + 2]).toBe(0);
      expect(lrt.collisionGrid[7 * lrt.width + 3]).toBe(0);
    });

    it('verifies route_5_saffron_gate connects south to saffron_city', () => {
      const gate = loadMap('route_5_saffron_gate');
      const southWarps = gate.warps.filter((w) => w.targetMapId === 'saffron_city');
      expect(southWarps.length).toBeGreaterThanOrEqual(2);
      expect(gate.collisionGrid[7 * gate.width + 4]).toBe(0);
      expect(gate.collisionGrid[7 * gate.width + 5]).toBe(0);
    });

    it('verifies saffron_city north gate warps back to route_5_saffron_gate', () => {
      const saffron = loadMap('saffron_city');
      const northWarps = saffron.warps.filter((w) => w.targetMapId === 'route_5_saffron_gate');
      expect(northWarps.length).toBeGreaterThanOrEqual(1);
      expect(saffron.collisionGrid[3 * saffron.width + 18]).toBe(0);
    });

    it('verifies world_maps.json contains all 338 maps including power_plant and lavender_radio_tower_1f', () => {
      const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
      expect(bundle.length).toBe(338);
      expect(bundle.some((m: any) => m.id === 'power_plant')).toBe(true);
      expect(bundle.some((m: any) => m.id === 'lavender_radio_tower_1f')).toBe(true);
    });
  });

  describe('2. Power Plant Crisis Questline', () => {
    it('sets EVENT_LEARNED_ABOUT_MACHINE_PART when speaking to Power Plant Manager initially', () => {
      const npcs = createKantoCeruleanNpcs();
      const manager = npcs.power_plant.find((n) => n.id === 'power_plant_manager')!;

      handlePowerPlantManager(manager, mockContext);
      expect(mockContext.storyFlags.has('EVENT_LEARNED_ABOUT_MACHINE_PART')).toBe(true);
      expect(openedDialogues[0].pages[0]).toContain('Someone stole an essential MACHINE PART');
    });

    it('handles Cerulean Gym Rocket Grunt fleeing north to Route 24', () => {
      const npcs = createKantoCeruleanNpcs();
      const grunt = npcs.cerulean_gym.find((n) => n.id === 'cerulean_gym_rocket_grunt')!;

      handleCeruleanGymGrunt(grunt, mockContext);
      expect(mockContext.storyFlags.has('EVENT_MET_ROCKET_GRUNT_AT_CERULEAN_GYM')).toBe(true);
      expect(openedDialogues[0].pages[0]).toContain('Oops! I so sorry!');
    });

    it('battles Rocket Grunt on Route 24 and learns machine part location on defeat', () => {
      mockContext.storyFlags.add('EVENT_MET_ROCKET_GRUNT_AT_CERULEAN_GYM');
      const npcs = createKantoCeruleanNpcs();
      const grunt = npcs.route_24.find((n) => n.id === 'route_24_rocket_grunt')!;

      handleRoute24RocketGrunt(grunt, mockContext);
      expect(triggeredBattles.length).toBe(1);
      expect(triggeredBattles[0].oppPokemon.speciesId).toBe('golbat');
      expect(mockContext.storyFlags.has('EVENT_DEFEATED_ROUTE24_GRUNT')).toBe(true);
      expect(openedDialogues[1].pages[1]).toContain('hide it I did in GYM of the CERULEAN');
    });

    it('retrieves Machine Part from Cerulean Gym pool at (4, 8) after defeating Route 24 Grunt', () => {
      // Before defeating grunt: pool is ordinary
      handleCeruleanGymMachinePart(mockContext, 4, 8);
      expect(mockContext.storyFlags.has('EVENT_FOUND_MACHINE_PART')).toBe(false);

      // After defeating grunt: pool awards machine-part
      mockContext.storyFlags.add('EVENT_DEFEATED_ROUTE24_GRUNT');
      handleCeruleanGymMachinePart(mockContext, 4, 8);
      expect(mockContext.storyFlags.has('EVENT_FOUND_MACHINE_PART')).toBe(true);
      expect(mockContext.inventory.keyItems).toContain('machine-part');
    });

    it('returns Machine Part to Manager, restoring power and awarding TM07 Zap Cannon', () => {
      mockContext.storyFlags.add('EVENT_FOUND_MACHINE_PART');
      mockContext.inventory.keyItems.push('machine-part');
      const npcs = createKantoCeruleanNpcs();
      const manager = npcs.power_plant.find((n) => n.id === 'power_plant_manager')!;

      handlePowerPlantManager(manager, mockContext);
      expect(mockContext.storyFlags.has('EVENT_RESTORED_POWER_TO_KANTO')).toBe(true);
      expect(mockContext.inventory.keyItems).not.toContain('machine-part');
      expect(mockContext.inventory.tms).toContain('TM07');
    });
  });

  describe('3. Cerulean Cape & Leader Misty Boss Battle', () => {
    it('interrupts Misty date at Route 25 (25, 4) and sends Misty back to Gym', () => {
      const npcs = createKantoCeruleanNpcs();
      const misty = npcs.route_25.find((n) => n.id === 'route_25_misty')!;

      handleCeruleanCapeMistyDate(misty, mockContext);
      expect(mockContext.storyFlags.has('EVENT_MET_MISTY_AT_CERULEAN_CAPE')).toBe(true);
      expect(openedDialogues[0].pages[0]).toContain('Why did you have to show up and ruin my date?!');
    });

    it('verifies Cerulean Gym statues reflect Misty date status and defeat state', () => {
      // 1. Before date interrupted
      handleCeruleanGymGuideAndStatues({ id: 'cerulean_gym_statue', x: 2, y: 13, action: 'CERULEAN_GYM_STATUE' }, mockContext);
      expect(openedDialogues[openedDialogues.length - 1].pages[0]).toContain("Sorry, I'll be out for a while");

      // 2. After date interrupted, before defeat
      mockContext.storyFlags.add('EVENT_MET_MISTY_AT_CERULEAN_CAPE');
      handleCeruleanGymGuideAndStatues({ id: 'cerulean_gym_statue', x: 2, y: 13, action: 'CERULEAN_GYM_STATUE' }, mockContext);
      expect(openedDialogues[openedDialogues.length - 1].pages[0]).toBe(
        'CERULEAN CITY POKéMON GYM\nLEADER: MISTY\n\nWINNING TRAINERS:\nRED'
      );

      // 3. After defeat
      mockContext.storyFlags.add('misty_defeated');
      handleCeruleanGymGuideAndStatues({ id: 'cerulean_gym_statue', x: 2, y: 13, action: 'CERULEAN_GYM_STATUE' }, mockContext);
      expect(openedDialogues[openedDialogues.length - 1].pages[0]).toContain('RED\nGOLD');
    });

    it('battles Gym Leader Misty and awards Cascade Badge', () => {
      mockContext.storyFlags.add('EVENT_MET_MISTY_AT_CERULEAN_CAPE');
      const npcs = createKantoCeruleanNpcs();
      const misty = npcs.cerulean_gym.find((n) => n.id === 'cerulean_gym_misty')!;

      handleMistyInteraction(misty, mockContext);
      expect(triggeredBattles.length).toBe(1);
      expect(triggeredBattles[0].opts.isGymLeader).toBe(true);
      expect(triggeredBattles[0].opts.trainerName).toBe('Leader Misty');
      expect(mockContext.inventory.badges).toContain('cascade');
      expect(mockContext.storyFlags.has('misty_defeated')).toBe(true);
    });

    it('verifies Cerulean Gym swimmers battle correctly', () => {
      const npcs = createKantoCeruleanNpcs();
      const diana = npcs.cerulean_gym.find((n) => n.id === 'cerulean_gym_swimmer_diana')!;

      handleCeruleanGymTrainer(diana, mockContext);
      expect(triggeredBattles.length).toBe(1);
      expect(mockContext.defeatedTrainers.has('cerulean_gym_diana')).toBe(true);
    });
  });

  describe('4. Lavender Radio Tower & Snorlax Awakening', () => {
    it('withholds EXPN Card from Director until power is restored', () => {
      const npcs = createKantoCeruleanNpcs();
      const director = npcs.lavender_radio_tower_1f.find((n) => n.id === 'lavender_radio_tower_director')!;

      handleLavenderRadioTowerDirector(director, mockContext);
      expect(mockContext.inventory.keyItems).not.toContain('expn-card');
      expect(openedDialogues[0].pages[0]).toContain('cannot transmit without power');
    });

    it('awards EXPN Card once power is restored', () => {
      mockContext.storyFlags.add('EVENT_RESTORED_POWER_TO_KANTO');
      const npcs = createKantoCeruleanNpcs();
      const director = npcs.lavender_radio_tower_1f.find((n) => n.id === 'lavender_radio_tower_director')!;

      handleLavenderRadioTowerDirector(director, mockContext);
      expect(mockContext.storyFlags.has('has_expn_card')).toBe(true);
      expect(mockContext.inventory.keyItems).toContain('expn-card');
    });

    it('Sleeping Snorlax remains asleep without EXPN Card', () => {
      const snorlax = { id: 'vermilion_city_snorlax', x: 34, y: 8, speaker: '💤 SNORLAX' } as any;
      handleSleepingSnorlaxAwakening(snorlax, mockContext);

      expect(triggeredBattles.length).toBe(0);
      expect(openedDialogues[0].pages[0]).toContain('snoring peacefully');
    });

    it('awakens Snorlax with EXPN Card Poké Flute tune and clears the obstacle', () => {
      mockContext.storyFlags.add('has_expn_card');
      mockContext.inventory.keyItems.push('expn-card');
      const snorlax = { id: 'vermilion_city_snorlax', x: 34, y: 8, speaker: '💤 SNORLAX' } as any;

      handleSleepingSnorlaxAwakening(snorlax, mockContext);
      expect(triggeredBattles.length).toBe(1);
      expect(triggeredBattles[0].oppPokemon.speciesId).toBe('snorlax');
      expect(triggeredBattles[0].oppPokemon.level).toBe(50);
      expect(triggeredBattles[0].oppPokemon.heldItem).toBe('leftovers');
      expect(mockContext.storyFlags.has('snorlax_cleared')).toBe(true);
      expect(mockContext.storyFlags.has('EVENT_FOUGHT_SNORLAX')).toBe(true);
    });
  });

  describe('5. Route 5 Cleanse Tag House', () => {
    it('awards CLEANSE TAG to player from Grandma', () => {
      const npcs = createKantoCeruleanNpcs();
      const grandma = npcs.route_5_cleanse_tag_house.find((n) => n.id === 'route_5_cleanse_tag_grandma')!;

      handleRoute5CleanseTagGrandma(grandma, mockContext);
      expect(mockContext.storyFlags.has('got_cleanse_tag')).toBe(true);
      expect(mockContext.inventory.items['cleanse-tag']).toBe(1);
    });
  });

  describe('6. NPC Story Flag Visibility Invariants', () => {
    it('verifies Snorlax despawns when snorlax_cleared is set', () => {
      expect(isNpcActiveForStoryFlags('vermilion_city_snorlax', new Set())).toBe(true);
      expect(isNpcActiveForStoryFlags('vermilion_city_snorlax', new Set(['snorlax_cleared']))).toBe(false);
    });

    it('verifies Route 25 Misty despawns after date and appears in Cerulean Gym', () => {
      expect(isNpcActiveForStoryFlags('route_25_misty', new Set())).toBe(true);
      expect(isNpcActiveForStoryFlags('cerulean_gym_misty', new Set())).toBe(false);

      const flagsAfterDate = new Set(['EVENT_MET_MISTY_AT_CERULEAN_CAPE']);
      expect(isNpcActiveForStoryFlags('route_25_misty', flagsAfterDate)).toBe(false);
      expect(isNpcActiveForStoryFlags('cerulean_gym_misty', flagsAfterDate)).toBe(true);
    });

    it('verifies Route 24 Grunt only spawns after Gym encounter and despawns after defeat', () => {
      expect(isNpcActiveForStoryFlags('route_24_rocket_grunt', new Set())).toBe(false);

      const flagsAfterGym = new Set(['EVENT_MET_ROCKET_GRUNT_AT_CERULEAN_GYM']);
      expect(isNpcActiveForStoryFlags('route_24_rocket_grunt', flagsAfterGym)).toBe(true);

      const flagsAfterDefeat = new Set([
        'EVENT_MET_ROCKET_GRUNT_AT_CERULEAN_GYM',
        'EVENT_DEFEATED_ROUTE24_GRUNT',
      ]);
      expect(isNpcActiveForStoryFlags('route_24_rocket_grunt', flagsAfterDefeat)).toBe(false);
    });
  });

  describe('7. Architectural & File Size Invariants', () => {
    it('verifies router exports all required domain handlers', () => {
      const handlers = getCeruleanPowerPlantAndMistyInteractions();
      expect(handlers.length).toBeGreaterThanOrEqual(10);
    });

    it('verifies single-window file budget (<750 lines) on all created modules', () => {
      const files = [
        'src/world/npcs/kantoCeruleanNpcs.ts',
        'src/world/interactions/CeruleanPowerPlantAndMistyInteractions.ts',
      ];
      for (const file of files) {
        const lineCount = fs.readFileSync(path.join(root, file), 'utf8').split('\n').length;
        expect(lineCount).toBeLessThan(750);
      }
    });

    it('verifies zero DOM and zero PixiJS imports in world domain files', () => {
      const files = [
        'src/world/npcs/kantoCeruleanNpcs.ts',
        'src/world/interactions/CeruleanPowerPlantAndMistyInteractions.ts',
      ];
      for (const file of files) {
        const content = fs.readFileSync(path.join(root, file), 'utf8');
        expect(content).not.toMatch(/from\s+['"]pixi\.js['"]/);
        expect(content).not.toMatch(/from\s+['"]@pixi\//);
        expect(content).not.toMatch(/\bdocument\./);
        expect(content).not.toMatch(/\bwindow\./);
      }
    });
  });
});
