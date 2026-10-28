import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getMahoganyTownAndLakeInteractions,
  handleRedGyarados,
  handleLakeLance,
  handleMahoganyGymBlocker,
  handleLanceMartReveal,
  handleRageCandyBarSalesman,
  handleRoute43GateOfficer,
  handleHiddenPowerGuru,
  handleMagikarpLengthGuru,
} from '../../src/world/interactions/MahoganyTownAndLakeInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { createMahoganyToIndigoNpcs } from '../../src/world/npcs/mahoganyToIndigoNpcs';
import { createNpcsByMap } from '../../src/world/npcData';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { OverworldTickerCoordinator } from '../../src/world/OverworldTickerCoordinator';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-MAHOGANY-TOWN-AND-LAKE-OF-RAGE-01: Verification Suite', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;

  beforeEach(() => {
    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('typhlosion', 35)],
      inventory: {
        money: 10000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'],
        items: {},
        balls: {},
        tms: [],
        keyItems: [],
      },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      openDialogue: (_pages, _speaker, onComplete) => {
        if (onComplete) onComplete();
      },
      showToast: () => {},
      saveCurrentGame: () => {},
      triggerBattle: (_opp, opts) => {
        if (opts?.onBattleEnd) {
          opts.onBattleEnd({ winner: 'PLAYER', caught: false });
        }
      },
      addOverworldItemToInventory: (item: string) => {
        if (item.toUpperCase().startsWith('TM')) {
          if (!mockContext.inventory!.tms.includes(item.toUpperCase())) {
            mockContext.inventory!.tms.push(item.toUpperCase());
          }
        } else if (item.includes('scale') || item.includes('key')) {
          if (!mockContext.inventory!.keyItems) mockContext.inventory!.keyItems = [];
          if (!mockContext.inventory!.keyItems.includes(item)) {
            mockContext.inventory!.keyItems.push(item);
          }
        } else {
          if (!mockContext.inventory!.items) mockContext.inventory!.items = {};
          mockContext.inventory!.items[item] = (mockContext.inventory!.items[item] || 0) + 1;
        }
      },
      mapManager: {
        getCurrentMap: () => null,
      } as any,
      audioManager: {
        playSfx: () => {},
        playBattleBgm: () => {},
        restoreOverworldBgm: () => {},
        playMapBgm: () => {},
      },
    };
  });

  describe('1. Map & Signpost Architecture (Mahogany, Route 43, Lake of Rage)', () => {
    it('verifies mahogany_town.json signpost bgEvents at (1, 5), (9, 7), (3, 13), (16, 13)', () => {
      const map: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'mahogany_town.json'), 'utf8')
      );
      expect(map.bgEvents).toBeDefined();
      expect(map.bgEvents.length).toBeGreaterThanOrEqual(4);

      const townSign = map.bgEvents.find((e) => e.x === 1 && e.y === 5);
      expect(townSign?.text).toContain('MAHOGANY TOWN');

      const rageSign = map.bgEvents.find((e) => e.x === 9 && e.y === 7);
      expect(rageSign?.text).toContain('RAGECANDYBAR');

      const gymSign = map.bgEvents.find((e) => e.x === 3 && e.y === 13);
      expect(gymSign?.text).toContain('PRYCE');

      const pokeSign = map.bgEvents.find((e) => e.x === 16 && e.y === 13);
      expect(pokeSign?.text).toContain('POKéMON CENTER');
    });

    it('verifies route_43.json signpost bgEvents at (13, 3), (11, 49), (16, 38)', () => {
      const map: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'route_43.json'), 'utf8')
      );
      expect(map.bgEvents).toBeDefined();
      expect(map.bgEvents.length).toBeGreaterThanOrEqual(3);

      const sign1 = map.bgEvents.find((e) => e.x === 13 && e.y === 3);
      expect(sign1?.text).toContain('ROUTE 43');

      const sign2 = map.bgEvents.find((e) => e.x === 11 && e.y === 49);
      expect(sign2?.text).toContain('ROUTE 43');

      const tips = map.bgEvents.find((e) => e.x === 16 && e.y === 38);
      expect(tips?.text).toContain('TRAINER TIPS');
    });

    it('verifies lake_of_rage.json signpost bgEvents at (21, 27) and (25, 31)', () => {
      const map: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'lake_of_rage.json'), 'utf8')
      );
      expect(map.bgEvents).toBeDefined();
      expect(map.bgEvents.length).toBeGreaterThanOrEqual(2);

      const lakeSign = map.bgEvents.find((e) => e.x === 21 && e.y === 27);
      expect(lakeSign?.text).toContain('LAKE OF RAGE');

      const guruSign = map.bgEvents.find((e) => e.x === 25 && e.y === 31);
      expect(guruSign?.text).toContain("FISHING GURU'S HOUSE");
    });

    it('verifies reciprocal warps between mahogany_mart (7, 3) and team_rocket_base_b1f (27, 2)', () => {
      const mart: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'mahogany_mart.json'), 'utf8')
      );
      const b1f: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'team_rocket_base_b1f.json'), 'utf8')
      );

      const martWarp = mart.warps.find((w) => w.x === 7 && w.y === 3);
      expect(martWarp).toEqual({
        x: 7,
        y: 3,
        targetMapId: 'team_rocket_base_b1f',
        targetX: 27,
        targetY: 2,
      });

      const b1fWarp = b1f.warps.find((w) => w.x === 27 && w.y === 2);
      expect(b1fWarp).toEqual({
        x: 27,
        y: 2,
        targetMapId: 'mahogany_mart',
        targetX: 7,
        targetY: 3,
      });
    });
  });

  describe('2. Walkability & NPC Coordinate Integrity', () => {
    it('verifies all registered NPCs in mahogany_town, route_43, route_43_gate, lake_of_rage stand on walkable tiles (0 or 2)', () => {
      const npcs = createNpcsByMap();
      const mapFiles = ['mahogany_town', 'route_43', 'route_43_gate', 'lake_of_rage'];

      for (const mapId of mapFiles) {
        const mapData: MapData = JSON.parse(
          fs.readFileSync(path.join(mapsDir, `${mapId}.json`), 'utf8')
        );
        const mapNpcs = npcs[mapId] || [];
        for (const npc of mapNpcs) {
          const tile = mapData.collisionGrid[npc.y * mapData.width + npc.x];
          expect(
            tile === 0 || tile === 2,
            `NPC ${npc.id} in ${mapId} at (${npc.x}, ${npc.y}) is on collision ${tile}`
          ).toBe(true);
        }
      }
    });

    it('verifies 6 canonical trainers exist on route_43 with valid teams', () => {
      const npcs = createNpcsByMap();
      const r43Npcs = npcs['route_43'] || [];
      const trainers = r43Npcs.filter((n) => n.action === 'TRAINER_BATTLE' || n.trainerPokemon || n.trainerTeam);
      expect(trainers.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('3. Mahogany Town Gym Blocker & RageCandyBar Salesman', () => {
    it('verifies mahogany_gym_blocker is active before hideout cleared and despawns after', () => {
      const flags = new Set<string>();
      expect(isNpcActiveForStoryFlags('mahogany_gym_blocker', flags)).toBe(true);

      flags.add('rocket_base_generator_cleared');
      expect(isNpcActiveForStoryFlags('mahogany_gym_blocker', flags)).toBe(false);

      flags.clear();
      flags.add('EVENT_CLEARED_ROCKET_HIDEOUT');
      expect(isNpcActiveForStoryFlags('mahogany_gym_blocker', flags)).toBe(false);
    });

    it('verifies handleMahoganyGymBlocker dialogue', () => {
      let dialogueSaid = '';
      mockContext.openDialogue = (pages) => {
        dialogueSaid = pages.join(' ');
      };
      handleMahoganyGymBlocker({} as any, {} as any, mockContext as NpcInteractionContext);
      expect(dialogueSaid).toContain('Gym Leader Pryce went to the Lake of Rage');
    });

    it('verifies handleRageCandyBarSalesman purchases candy when affordable', () => {
      mockContext.inventory!.money = 1000;
      handleRageCandyBarSalesman({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.inventory!.money).toBe(700);
      expect(mockContext.inventory!.items?.['rage_candy_bar']).toBe(1);
    });

    it('verifies handleRageCandyBarSalesman refuses when player is broke', () => {
      mockContext.inventory!.money = 100;
      let dialogueSaid = '';
      mockContext.openDialogue = (pages) => {
        dialogueSaid = pages.join(' ');
      };
      handleRageCandyBarSalesman({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.inventory!.money).toBe(100);
      expect(dialogueSaid).toContain('not have enough money');
    });

    it('verifies handleRageCandyBarSalesman sold out after hideout cleared', () => {
      mockContext.storyFlags!.add('rocket_base_generator_cleared');
      let dialogueSaid = '';
      mockContext.openDialogue = (pages) => {
        dialogueSaid = pages.join(' ');
      };
      handleRageCandyBarSalesman({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(dialogueSaid).toContain('sold out');
    });
  });

  describe('4. Route 43 Gatehouse Rocket Extortion & Sludge Bomb', () => {
    it('verifies handleRoute43GateOfficer gives TM36 Sludge Bomb after hideout cleared', () => {
      mockContext.storyFlags!.add('rocket_base_generator_cleared');
      handleRoute43GateOfficer({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('EVENT_GOT_TM36_SLUDGE_BOMB')).toBe(true);
      expect(mockContext.inventory!.tms).toContain('TM36');
    });

    it('verifies handleRoute43GateOfficer prevents duplicate TM36 gifts', () => {
      mockContext.storyFlags!.add('rocket_base_generator_cleared');
      mockContext.storyFlags!.add('EVENT_GOT_TM36_SLUDGE_BOMB');
      let dialogueSaid = '';
      mockContext.openDialogue = (pages) => {
        dialogueSaid = pages.join(' ');
      };
      handleRoute43GateOfficer({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(dialogueSaid).toContain('avoid walking in the tall grass');
    });

    it('verifies handleRoute43GateOfficer warns player when hideout is uncleared', () => {
      let dialogueSaid = '';
      mockContext.openDialogue = (pages) => {
        dialogueSaid = pages.join(' ');
      };
      handleRoute43GateOfficer({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(dialogueSaid).toContain('characters in black uniforms');
    });
  });

  describe('5. Lake of Rage Climax: Red Gyarados & Lance Handoff', () => {
    it('verifies Red Gyarados encounter awards red_scale and sets subdued flags', () => {
      handleRedGyarados({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('red_gyarados_subdued')).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_LAKE_OF_RAGE_RED_GYARADOS')).toBe(true);
      expect(mockContext.inventory!.keyItems).toContain('red_scale');
    });

    it('verifies Lance Lake of Rage briefing handoff to Mahogany Mart', () => {
      mockContext.storyFlags!.add('red_gyarados_subdued');
      handleLakeLance({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('lance_lake_talked')).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_DECIDED_TO_HELP_LANCE')).toBe(true);
    });

    it('verifies Lance in Mahogany Mart reveals secret staircase to B1F', () => {
      handleLanceMartReveal({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('lance_hideout_briefed')).toBe(true);
      expect(mockContext.storyFlags!.has('EVENT_UNCOVERED_STAIRCASE_IN_MAHOGANY_MART')).toBe(true);
    });
  });

  describe('6. Lake of Rage Houses: Hidden Power & Magikarp Guru', () => {
    it('verifies handleHiddenPowerGuru awards TM10 Hidden Power', () => {
      handleHiddenPowerGuru({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(mockContext.storyFlags!.has('EVENT_GOT_TM10_HIDDEN_POWER')).toBe(true);
      expect(mockContext.inventory!.tms).toContain('TM10');
    });

    it('verifies handleHiddenPowerGuru does not award duplicate TM10', () => {
      mockContext.storyFlags!.add('EVENT_GOT_TM10_HIDDEN_POWER');
      let dialogueSaid = '';
      mockContext.openDialogue = (pages) => {
        dialogueSaid = pages.join(' ');
      };
      handleHiddenPowerGuru({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(dialogueSaid).toContain('I am meditating');
    });

    it('verifies handleMagikarpLengthGuru evaluates party Magikarp', () => {
      mockContext.playerParty = [PokemonFactory.create('magikarp', 15)];
      let dialogueSaid = '';
      mockContext.openDialogue = (pages) => {
        dialogueSaid = pages.join(' ');
      };
      handleMagikarpLengthGuru({} as any, {} as any, mockContext as NpcInteractionContext);

      expect(dialogueSaid).toContain('Magnificent! You brought a MAGIKARP!');
    });
  });

  describe('7. Router & Lifecycle Integration', () => {
    it('verifies NpcInteractionRouter dispatches all 8 interactions', () => {
      const router = createDefaultNpcInteractionRouter();
      const registrations = getMahoganyTownAndLakeInteractions();
      expect(registrations.length).toBe(8);

      const testCtx = {
        ...mockContext,
        player: { direction: 'DOWN' },
        getOppositeDirection: () => 'UP',
      };

      for (const reg of registrations) {
        if (reg.actions) {
          for (const action of reg.actions) {
            const handled = router.dispatch(
              { id: 'test_npc', action, isMoving: false } as any,
              {} as any,
              testCtx as any
            );
            expect(handled).toBe(true);
          }
        }
      }
    });

    it('verifies isNpcActiveForStoryFlags lifecycle rules for all Phase 11 entities', () => {
      const flags = new Set<string>();

      // Red Gyarados active initially
      expect(isNpcActiveForStoryFlags('lake_of_rage_red_gyarados', flags)).toBe(true);
      flags.add('red_gyarados_subdued');
      expect(isNpcActiveForStoryFlags('lake_of_rage_red_gyarados', flags)).toBe(false);

      // Lance at Lake active after red gyarados subdued until talked
      expect(isNpcActiveForStoryFlags('lake_of_rage_lance', flags)).toBe(true);
      flags.add('lance_lake_talked');
      expect(isNpcActiveForStoryFlags('lake_of_rage_lance', flags)).toBe(false);

      // Lance at Mart active after lake talked until generator cleared
      expect(isNpcActiveForStoryFlags('mahogany_mart_lance', flags)).toBe(true);
      flags.add('rocket_base_generator_cleared');
      expect(isNpcActiveForStoryFlags('mahogany_mart_lance', flags)).toBe(false);

      // Route 43 Gate Rockets active until generator cleared
      flags.delete('rocket_base_generator_cleared');
      expect(isNpcActiveForStoryFlags('route_43_gate_rocket_1', flags)).toBe(true);
      flags.add('rocket_base_generator_cleared');
      expect(isNpcActiveForStoryFlags('route_43_gate_rocket_1', flags)).toBe(false);
    });
  });

  describe('8. Step Triggers in OverworldTickerCoordinator', () => {
    it('verifies Mahogany Town East Blocker step trigger pushes player left and opens dialogue', () => {
      let dialogueTriggered = false;
      const playerEntity = {
        id: 'player',
        x: 18,
        y: 8,
        targetX: 19,
        targetY: 8,
        renderX: 18 * 64,
        renderY: 8 * 64,
        direction: 'RIGHT' as const,
        isMoving: true,
        progress: 0.99,
        isPlayer: true,
      };

      const mockTickerCtx = {
        getGameState: () => 'OVERWORLD',
        isCutsceneLocked: () => false,
        player: playerEntity,
        mapManager: {
          getCurrentMap: () => ({ id: 'mahogany_town', width: 20, height: 18, collisionGrid: new Array(360).fill(0), connections: {} }),
          isCurrentMapOutdoor: () => true,
          getTileType: () => 0,
          isWalkable: () => true,
          checkWarp: () => null,
        },
        gameClock: {
          tick: (dt: number) => ({ dtWorld: dt, dtPlayer: dt }),
          getTimeOfDay: () => 'DAY',
        },
        overworldRenderer: {
          updateAmbientLighting: () => {},
          update: () => {},
        },
        overworldHUD: {
          isDialogueOpen: () => false,
          getHeldDirection: () => null,
          openDialogue: (pages: string[], speaker: string) => {
            dialogueTriggered = true;
            expect(speaker).toContain('RAGECANDYBAR SALESMAN');
            expect(pages[0]).toContain('Hiya, kid!');
          },
        },
        getActiveMapNpcs: () => [],
        populateWorldNpcs: () => [],
        handleMapTransition: () => {},
        executeWarpTransition: async () => {},
        runTrainerSightSequence: async () => {},
        triggerSlowpokeWellGruntIntercept: async () => {},
        triggerBeastsAwakeningCutscene: () => {},
        triggerBurnedTowerRivalBattle: () => {},
        triggerCherrygroveRivalAmbush: () => {},
        saveCurrentGame: () => {},
        triggerWildEncounter: async () => {},
        addPlayTimeDelta: () => {},
        overworldItemManager: { isSolidObstacle: () => false },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        roamingManager: { checkRoamerEncounter: () => null },
        itemfinderHUD: { isVisible: () => false },
        inventory: { money: 5000 },
      };

      // Tick forward so entity.progress advances past 1.0 into (19, 8)
      OverworldTickerCoordinator.updateOverworldTick(0.1, mockTickerCtx as any);

      expect(dialogueTriggered).toBe(true);
      expect(playerEntity.x).toBe(18);
      expect(playerEntity.targetX).toBe(18);
      expect(playerEntity.renderX).toBe(18);
    });

    it('verifies Route 43 Gate Rocket extortion step trigger deducts ¥1000 toll fee', () => {
      let dialogueTriggered = false;
      const playerEntity = {
        id: 'player',
        x: 4,
        y: 3,
        targetX: 4,
        targetY: 4,
        renderX: 4 * 64,
        renderY: 3 * 64,
        direction: 'DOWN' as const,
        isMoving: true,
        progress: 0.99,
        isPlayer: true,
      };

      const inventory = { money: 2500 };
      const mockTickerCtx = {
        getGameState: () => 'OVERWORLD',
        isCutsceneLocked: () => false,
        player: playerEntity,
        mapManager: {
          getCurrentMap: () => ({ id: 'route_43_gate', width: 10, height: 8, collisionGrid: new Array(80).fill(0), connections: {} }),
          isCurrentMapOutdoor: () => false,
          getTileType: () => 0,
          isWalkable: () => true,
          checkWarp: () => null,
        },
        gameClock: {
          tick: (dt: number) => ({ dtWorld: dt, dtPlayer: dt }),
          getTimeOfDay: () => 'DAY',
        },
        overworldRenderer: {
          updateAmbientLighting: () => {},
          update: () => {},
        },
        overworldHUD: {
          isDialogueOpen: () => false,
          getHeldDirection: () => null,
          openDialogue: (pages: string[], speaker: string) => {
            dialogueTriggered = true;
            expect(speaker).toContain('TEAM ROCKET');
            expect(pages[0]).toContain('toll gate');
          },
        },
        getActiveMapNpcs: () => [],
        populateWorldNpcs: () => [],
        handleMapTransition: () => {},
        executeWarpTransition: async () => {},
        runTrainerSightSequence: async () => {},
        triggerSlowpokeWellGruntIntercept: async () => {},
        triggerBeastsAwakeningCutscene: () => {},
        triggerBurnedTowerRivalBattle: () => {},
        triggerCherrygroveRivalAmbush: () => {},
        saveCurrentGame: () => {},
        triggerWildEncounter: async () => {},
        addPlayTimeDelta: () => {},
        overworldItemManager: { isSolidObstacle: () => false },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        roamingManager: { checkRoamerEncounter: () => null },
        itemfinderHUD: { isVisible: () => false },
        inventory,
      };

      OverworldTickerCoordinator.updateOverworldTick(0.1, mockTickerCtx as any);

      expect(dialogueTriggered).toBe(true);
      expect(inventory.money).toBe(1500);
    });

    it('verifies Route 43 Gate Rocket extortion takes all funds if player has less than ¥1000', () => {
      let dialogueTriggered = false;
      const playerEntity = {
        id: 'player',
        x: 4,
        y: 3,
        targetX: 4,
        targetY: 4,
        renderX: 4 * 64,
        renderY: 3 * 64,
        direction: 'DOWN' as const,
        isMoving: true,
        progress: 0.99,
        isPlayer: true,
      };

      const inventory = { money: 450 };
      const mockTickerCtx = {
        getGameState: () => 'OVERWORLD',
        isCutsceneLocked: () => false,
        player: playerEntity,
        mapManager: {
          getCurrentMap: () => ({ id: 'route_43_gate', width: 10, height: 8, collisionGrid: new Array(80).fill(0), connections: {} }),
          isCurrentMapOutdoor: () => false,
          getTileType: () => 0,
          isWalkable: () => true,
          checkWarp: () => null,
        },
        gameClock: {
          tick: (dt: number) => ({ dtWorld: dt, dtPlayer: dt }),
          getTimeOfDay: () => 'DAY',
        },
        overworldRenderer: {
          updateAmbientLighting: () => {},
          update: () => {},
        },
        overworldHUD: {
          isDialogueOpen: () => false,
          getHeldDirection: () => null,
          openDialogue: (pages: string[], speaker: string) => {
            dialogueTriggered = true;
            expect(speaker).toContain('TEAM ROCKET');
            expect(pages[2]).toContain('hand over everything you have got');
          },
        },
        getActiveMapNpcs: () => [],
        populateWorldNpcs: () => [],
        handleMapTransition: () => {},
        executeWarpTransition: async () => {},
        runTrainerSightSequence: async () => {},
        triggerSlowpokeWellGruntIntercept: async () => {},
        triggerBeastsAwakeningCutscene: () => {},
        triggerBurnedTowerRivalBattle: () => {},
        triggerCherrygroveRivalAmbush: () => {},
        saveCurrentGame: () => {},
        triggerWildEncounter: async () => {},
        addPlayTimeDelta: () => {},
        overworldItemManager: { isSolidObstacle: () => false },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        roamingManager: { checkRoamerEncounter: () => null },
        itemfinderHUD: { isVisible: () => false },
        inventory,
      };

      OverworldTickerCoordinator.updateOverworldTick(0.1, mockTickerCtx as any);

      expect(dialogueTriggered).toBe(true);
      expect(inventory.money).toBe(0);
    });
  });
});
