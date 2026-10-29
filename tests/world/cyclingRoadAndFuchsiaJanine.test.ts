import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/game';
import { createKantoFuchsiaNpcs } from '../../src/world/npcs/kantoFuchsiaNpcs';
import {
  handleJanineInteraction,
  handleFuchsiaGymDecoy,
  handleFuchsiaGymGuideAndStatues,
  handleRoute16SpeechHouse,
  handleBikerTrainer,
  handleBirdKeeperTrainer,
  handleWardenGranddaughter,
  getCyclingRoadAndFuchsiaJanineInteractions,
} from '../../src/world/interactions/CyclingRoadAndFuchsiaJanineInteractions';
import { getNpcsForMap } from '../../src/world/npcData';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-CYCLING-ROAD-FUCHSIA-JANINE-01: Cycling Road, Fuchsia City & Leader Janine Verification', () => {
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
  let shownToasts: string[] = [];
  let currentMap: MapData;

  beforeEach(() => {
    openedDialogues = [];
    triggeredBattles = [];
    shownToasts = [];
    currentMap = loadMap('fuchsia_gym');

    mockContext = {
      playerName: 'GOLD',
      player: { x: 4, y: 16, direction: 'UP' } as any,
      playerParty: [
        {
          nickname: 'TYPHLOSION',
          speciesId: 'typhlosion',
          level: 52,
          currentHp: 165,
          maxHp: 165,
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
            },
          ],
        } as any,
      ],
      inventory: {
        items: {},
        keyItems: [],
        balls: {},
        tms: [],
        berries: {},
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
          'cascade',
        ],
      } as any,
      storyFlags: new Set<string>([
        'EVENT_TALKED_TO_OAK_KANTO',
        'EVENT_RESTORED_POWER_KANTO',
      ]),
      defeatedTrainers: new Set<string>(),
      npcsByMap: {},
      mapManager: {
        getCurrentMap: () => currentMap,
      } as any,
      gameClock: { getDayOfWeek: () => 'WEDNESDAY' } as any,
      audioManager: {
        playBattleBgm: () => {},
        restoreOverworldBgm: () => {},
        playMapBgm: () => {},
        playSfx: () => {},
      },
      missionManager: { checkStoryFlags: () => {} } as any,
      bugContestManager: {} as any,
      dayCareManager: {} as any,
      lastVisitedPokecenter: { mapId: 'fuchsia_poke_center', x: 3, y: 3 },
      setLastVisitedPokecenter: () => {},
      openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
        openedDialogues.push({ pages, speaker });
        if (onComplete) onComplete();
      },
      showToast: (msg: string) => {
        shownToasts.push(msg);
      },
      healPlayerParty: () => {},
      playHealingAnimation: () => {},
      playFieldRestAnimation: () => {},
      saveCurrentGame: () => {},
      openMart: () => {},
      openPcStorage: () => {},
      openTownMap: () => {},
      addOverworldItemToInventory: (itemId: string) => {
        mockContext.inventory.items[itemId] = (mockContext.inventory.items[itemId] || 0) + 1;
      },
      triggerBattle: async (pokemon: any, options: any) => {
        triggeredBattles.push({ pokemon, options });
        if (options?.onVictory) {
          options.onVictory();
        } else if (options?.onBattleEnd) {
          options.onBattleEnd({ outcome: 'VICTORY' });
        }
      },
      buildTrainerTeamInstances: (_trainer: any) => [
        {
          nickname: 'LEAD',
          speciesId: 'crobat',
          level: 36,
          currentHp: 110,
          maxHp: 110,
          moves: [],
        } as any,
      ],
      handleTrainerDefeatRewards: () => {},
      getOppositeDirection: () => 'UP',
      launchStadiumChallenge: () => {},
      runGuideGentWalkingTour: async () => {},
      triggerBeastsAwakeningCutscene: () => {},
      triggerBurnedTowerRivalBattle: () => {},
      triggerAzaleaRivalAmbush: () => {},
      triggerCherrygroveRivalAmbush: () => {},
      triggerSlowpokeWellGruntIntercept: async () => {},
      setCutsceneLocked: () => {},
      getCutsceneContext: () => ({} as any),
    };
  });

  describe('1. Map Continuity & Reciprocal Warps', () => {
    it('verifies seamless connection Route 16 <-> Route 17 <-> Route 18 <-> Fuchsia City', () => {
      const r16 = loadMap('route_16');
      const r17 = loadMap('route_17');
      const r18 = loadMap('route_18');
      const fc = loadMap('fuchsia_city');

      expect(r16.connections.SOUTH?.mapId).toBe('route_17');
      expect(r17.connections.NORTH?.mapId).toBe('route_16');
      expect(r17.connections.EAST?.mapId).toBe('route_18');
      expect(r18.connections.WEST?.mapId).toBe('route_17');
      expect(r18.connections.EAST?.mapId).toBe('fuchsia_city');
      expect(fc.connections.WEST?.mapId).toBe('route_18');
    });

    it('verifies reciprocal warps for Fuchsia Gym, Poke Center, Mart, and Safari Warden Home', () => {
      const fc = loadMap('fuchsia_city');
      const gym = loadMap('fuchsia_gym');
      const pc = loadMap('fuchsia_poke_center');
      const mart = loadMap('fuchsia_mart');
      const warden = loadMap('safari_zone_wardens_home');

      // Fuchsia City -> Fuchsia Gym (8, 27)
      const gymEntranceWarp = fc.warps.find((w) => w.targetMapId === 'fuchsia_gym');
      expect(gymEntranceWarp).toBeDefined();
      expect(gymEntranceWarp?.x).toBe(8);
      expect(gymEntranceWarp?.y).toBe(27);

      // Fuchsia Gym -> Fuchsia City
      const gymExitWarp = gym.warps.find((w) => w.targetMapId === 'fuchsia_city');
      expect(gymExitWarp).toBeDefined();
      expect(gymExitWarp?.targetX).toBe(8);
      expect(gymExitWarp?.targetY).toBe(28);

      // Poké Center
      const pcExitWarp = pc.warps.find((w) => w.targetMapId === 'fuchsia_city');
      expect(pcExitWarp?.targetX).toBe(19);
      expect(pcExitWarp?.targetY).toBe(28);

      // Mart
      const martExitWarp = mart.warps.find((w) => w.targetMapId === 'fuchsia_city');
      expect(martExitWarp?.targetX).toBe(5);
      expect(martExitWarp?.targetY).toBe(14);

      // Warden Home
      const wardenExitWarp = warden.warps.find((w) => w.targetMapId === 'fuchsia_city');
      expect(wardenExitWarp?.targetX).toBe(27);
      expect(wardenExitWarp?.targetY).toBe(28);
    });

    it('verifies Route 16 Secluded Speech House reciprocal warps', () => {
      const r16 = loadMap('route_16');
      const house = loadMap('route_16_fuchsia_speech_house');

      const entrance = r16.warps.find((w) => w.targetMapId === 'route_16_fuchsia_speech_house');
      expect(entrance).toBeDefined();
      expect(entrance?.x).toBe(3);
      expect(entrance?.y).toBe(1);

      const exit = house.warps.find((w) => w.targetMapId === 'route_16');
      expect(exit).toBeDefined();
      expect(exit?.targetX).toBe(3);
      expect(exit?.targetY).toBe(2);
    });
  });

  describe('2. Fuchsia Gym Invisible Glass Wall Maze & Collision Integrity', () => {
    it('verifies pre-baked invisible glass walls in fuchsia_gym.json collisionGrid', () => {
      const gym = loadMap('fuchsia_gym');
      expect(gym.width).toBe(10);
      expect(gym.height).toBe(18);

      // Glass wall tiles have collision 1 (blocking movement)
      const tileAt = (x: number, y: number) => gym.collisionGrid[y * gym.width + x];

      // Outer walls
      expect(tileAt(0, 0)).toBe(1);
      expect(tileAt(9, 0)).toBe(1);

      // Pre-baked internal invisible glass walls
      expect(tileAt(4, 4)).toBe(1);
      expect(tileAt(7, 4)).toBe(1);
      expect(tileAt(2, 8)).toBe(1);
      expect(tileAt(6, 8)).toBe(1);

      // Walkable corridors through the maze
      expect(tileAt(4, 16)).toBe(0); // Entrance corridor
      expect(tileAt(5, 16)).toBe(0);
      expect(tileAt(1, 10)).toBe(0); // Janine's stand
      expect(tileAt(5, 7)).toBe(0); // Alice's stand
      expect(tileAt(5, 11)).toBe(0); // Linda's stand
      expect(tileAt(9, 4)).toBe(0); // Cindy's stand
      expect(tileAt(4, 2)).toBe(0); // Barry's stand
      expect(tileAt(7, 15)).toBe(0); // Guide's stand
    });

    it('verifies Gym Statues registered as bgEvents at (3, 15) and (6, 15)', () => {
      const gym = loadMap('fuchsia_gym');
      expect(gym.bgEvents).toBeDefined();
      const statue1 = gym.bgEvents?.find((e) => e.x === 3 && e.y === 15);
      const statue2 = gym.bgEvents?.find((e) => e.x === 6 && e.y === 15);

      expect(statue1).toBeDefined();
      expect(statue1?.action).toBe('FUCHSIA_GYM_STATUE');
      expect(statue2).toBeDefined();
      expect(statue2?.action).toBe('FUCHSIA_GYM_STATUE');
    });
  });

  describe('3. Leader Janine Boss Battle, Soul Badge & TM06 Toxic', () => {
    it('executes pre-battle ninja dialogue, triggers gym leader battle, and awards Soul Badge + TM06', () => {
      const npcs = getNpcsForMap('fuchsia_gym');
      const janine = npcs.find((n) => n.id === 'fuchsia_gym_janine');
      expect(janine).toBeDefined();

      const handled = handleJanineInteraction(janine!, mockContext);
      expect(handled).toBe(true);

      // Pre-battle dialogue opened
      expect(openedDialogues.length).toBeGreaterThan(0);
      expect(openedDialogues[0].speaker).toBe('🏆 LEADER JANINE');
      expect(openedDialogues[0].pages[0]).toContain("I'm JANINE, the real GYM LEADER!");

      // Battle triggered
      expect(triggeredBattles.length).toBe(1);
      expect(triggeredBattles[0].options.isGymLeader).toBe(true);
      expect(triggeredBattles[0].options.trainerName).toBe('Leader Janine');

      // State transitions
      expect(mockContext.storyFlags.has('janine_defeated')).toBe(true);
      expect(mockContext.storyFlags.has('EVENT_BEAT_JANINE')).toBe(true);
      expect(mockContext.defeatedTrainers.has('janine')).toBe(true);
      expect(mockContext.inventory.badges).toContain('soul');
      expect(mockContext.inventory.tms).toContain('TM06');
      expect(mockContext.inventory.items['tm06']).toBe(1);

      // Toast announced
      expect(shownToasts.some((t) => t.includes('SOULBADGE') && t.includes('TM06 TOXIC'))).toBe(true);

      // Repeat interaction gives post-battle dialogue
      openedDialogues = [];
      const repeatHandled = handleJanineInteraction(janine!, mockContext);
      expect(repeatHandled).toBe(true);
      expect(openedDialogues[0].pages[0]).toContain('train day and night until my ninja poison skills surpass');
    });
  });

  describe('4. Fuchsia Gym 4 Decoy Trainers (Alice, Linda, Cindy, Barry)', () => {
    it('verifies all 4 decoys disguise with Janine pre-battle speech and reveal identity on defeat', () => {
      const npcs = getNpcsForMap('fuchsia_gym');
      const decoys = [
        { id: 'fuchsia_gym_alice', realSpeaker: '🌸 LASS ALICE', mon: 'gloom' },
        { id: 'fuchsia_gym_linda', realSpeaker: '🌸 LASS LINDA', mon: 'bulbasaur' },
        { id: 'fuchsia_gym_cindy', realSpeaker: '🏕️ PICNICKER CINDY', mon: 'nidoqueen' },
        { id: 'fuchsia_gym_barry', realSpeaker: '🏕️ CAMPER BARRY', mon: 'nidoking' },
      ];

      for (const decoy of decoys) {
        openedDialogues = [];
        triggeredBattles = [];

        const npc = npcs.find((n) => n.id === decoy.id);
        expect(npc, `Decoy ${decoy.id} must exist`).toBeDefined();

        // 1st interaction: disguised pre-battle speech
        handleFuchsiaGymDecoy(npc!, mockContext);
        expect(openedDialogues[0].speaker).toBe('🏆 LEADER JANINE');
        expect(triggeredBattles.length).toBe(1);
        expect(mockContext.defeatedTrainers.has(decoy.id)).toBe(true);

        // 2nd interaction: revealed identity
        openedDialogues = [];
        handleFuchsiaGymDecoy(npc!, mockContext);
        expect(openedDialogues[0].speaker).toBe(decoy.realSpeaker);
      }
    });
  });

  describe('5. Fuchsia Gym Guide and Dynamic Statues', () => {
    it('verifies Gym Guide gives illusion advice before defeat and praise after defeat', () => {
      const guideNpc = { id: 'fuchsia_gym_guide', action: 'FUCHSIA_GYM_GUIDE' } as any;

      // Before Janine defeat
      openedDialogues = [];
      mockContext.storyFlags.delete('janine_defeated');
      mockContext.inventory.badges = mockContext.inventory.badges.filter((b) => b !== 'soul');
      handleFuchsiaGymGuideAndStatues(guideNpc, mockContext);
      expect(openedDialogues[0].speaker).toBe('🏋️ GYM GUIDE');
      expect(openedDialogues[0].pages[0]).toContain('Yo, CHAMP in making!');
      expect(openedDialogues[0].pages[1]).toContain('The trainers all look like JANINE!');

      // After Janine defeat
      openedDialogues = [];
      mockContext.storyFlags.add('janine_defeated');
      handleFuchsiaGymGuideAndStatues(guideNpc, mockContext);
      expect(openedDialogues[0].pages[0]).toContain('That was a great battle, trainer from JOHTO!');
    });

    it('verifies Gym Statue dynamically displays winner roster', () => {
      const statue = { id: 'fuchsia_gym_statue', action: 'FUCHSIA_GYM_STATUE' } as any;

      // Before defeat
      openedDialogues = [];
      mockContext.storyFlags.delete('janine_defeated');
      mockContext.inventory.badges = mockContext.inventory.badges.filter((b) => b !== 'soul');
      handleFuchsiaGymGuideAndStatues(statue, mockContext);
      expect(openedDialogues[0].pages[2]).toBe('WINNING TRAINERS:\nKOGA');

      // After defeat
      openedDialogues = [];
      mockContext.storyFlags.add('janine_defeated');
      mockContext.inventory.badges.push('soul');
      handleFuchsiaGymGuideAndStatues(statue, mockContext);
      expect(openedDialogues[0].pages[2]).toBe('WINNING TRAINERS:\nKOGA\nGOLD');
    });
  });

  describe('6. Route 16 Secluded Speech House Recluse', () => {
    it('awards TM02 Headbutt on first visit and tranquil dialogue on subsequent visits', () => {
      const recluseNpc = { id: 'route_16_recluse', action: 'ROUTE_16_RECLUSE' } as any;

      // First visit
      openedDialogues = [];
      handleRoute16SpeechHouse(recluseNpc, mockContext);
      expect(mockContext.storyFlags.has('got_route16_speech_house_gift')).toBe(true);
      expect(mockContext.inventory.tms).toContain('TM02');
      expect(mockContext.inventory.items['tm02']).toBe(1);
      expect(shownToasts.some((t) => t.includes('TM02 HEADBUTT'))).toBe(true);

      // Repeat visit
      openedDialogues = [];
      handleRoute16SpeechHouse(recluseNpc, mockContext);
      expect(openedDialogues[0].pages[0]).toContain('Quiet, please... The soothing wind through the trees');
    });
  });

  describe('7. Route 17 Cycling Road Bikers', () => {
    it('verifies all 4 Bikers battle and track defeat', () => {
      const npcs = getNpcsForMap('route_17');
      expect(npcs.length).toBe(4);

      const bikers = [
        'route_17_biker_riley',
        'route_17_biker_glenn',
        'route_17_biker_joel',
        'route_17_biker_charles',
      ];

      for (const bikerId of bikers) {
        const npc = npcs.find((n) => n.id === bikerId);
        expect(npc).toBeDefined();

        openedDialogues = [];
        triggeredBattles = [];
        handleBikerTrainer(npc!, mockContext);

        expect(triggeredBattles.length).toBe(1);
        expect(mockContext.defeatedTrainers.has(bikerId)).toBe(true);

        // Repeat interaction shows defeat dialogue
        openedDialogues = [];
        handleBikerTrainer(npc!, mockContext);
        expect(openedDialogues.length).toBe(1);
        expect(openedDialogues[0].speaker).toBe(npc!.speaker);
      }
    });
  });

  describe('8. Route 18 Bird Keepers', () => {
    it('verifies both Bird Keepers battle and track defeat', () => {
      const npcs = getNpcsForMap('route_18');
      expect(npcs.length).toBe(2);

      const birdKeepers = ['route_18_bird_keeper_boris', 'route_18_bird_keeper_bob'];

      for (const bkId of birdKeepers) {
        const npc = npcs.find((n) => n.id === bkId);
        expect(npc).toBeDefined();

        openedDialogues = [];
        triggeredBattles = [];
        handleBirdKeeperTrainer(npc!, mockContext);

        expect(triggeredBattles.length).toBe(1);
        expect(mockContext.defeatedTrainers.has(bkId)).toBe(true);

        // Repeat interaction shows defeat dialogue
        openedDialogues = [];
        handleBirdKeeperTrainer(npc!, mockContext);
        expect(openedDialogues.length).toBe(1);
        expect(openedDialogues[0].speaker).toBe(npc!.speaker);
      }
    });
  });

  describe('9. Safari Zone Warden Granddaughter & City Lore', () => {
    it('verifies Granddaughter dialogue explaining Safari Zone closure', () => {
      const npcs = getNpcsForMap('safari_zone_wardens_home');
      const gd = npcs.find((n) => n.id === 'safari_zone_granddaughter');
      expect(gd).toBeDefined();

      openedDialogues = [];
      handleWardenGranddaughter(gd!, mockContext);
      expect(openedDialogues[0].speaker).toBe('👧 GRANDDAUGHTER');
      expect(openedDialogues[0].pages[1]).toContain('SAFARI ZONE is temporarily closed');
    });

    it('verifies Fuchsia City, Poke Center and Mart NPCs exist', () => {
      const cityNpcs = getNpcsForMap('fuchsia_city');
      expect(cityNpcs.length).toBeGreaterThanOrEqual(3);

      const pcNpcs = getNpcsForMap('fuchsia_poke_center');
      expect(pcNpcs.some((n) => n.action === 'HEAL_AND_SAVE')).toBe(true);

      const martNpcs = getNpcsForMap('fuchsia_mart');
      expect(martNpcs.some((n) => n.action === 'OPEN_MART')).toBe(true);
    });
  });

  describe('10. Router Integrity & Architectural Compliance', () => {
    it('verifies all interactions register properly with NpcInteractionRegistration', () => {
      const registrations = getCyclingRoadAndFuchsiaJanineInteractions();
      expect(registrations.length).toBe(7);

      const registeredActions = registrations.flatMap((r) => r.actions);
      expect(registeredActions).toContain('JANINE_EVENT');
      expect(registeredActions).toContain('FUCHSIA_GYM_DECOY');
      expect(registeredActions).toContain('FUCHSIA_GYM_GUIDE');
      expect(registeredActions).toContain('FUCHSIA_GYM_STATUE');
      expect(registeredActions).toContain('ROUTE_16_RECLUSE');
      expect(registeredActions).toContain('BIKER_TRAINER');
      expect(registeredActions).toContain('BIRD_KEEPER_TRAINER');
      expect(registeredActions).toContain('WARDEN_GRANDDAUGHTER');
    });

    it('verifies zero PixiJS or DOM imports in newly created world modules', () => {
      const files = [
        path.join(root, 'src/world/npcs/kantoFuchsiaNpcs.ts'),
        path.join(root, 'src/world/interactions/CyclingRoadAndFuchsiaJanineInteractions.ts'),
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        expect(content).not.toMatch(/from ['"]pixi\.js['"]/);
        expect(content).not.toMatch(/from ['"]@pixi\//);
        expect(content).not.toMatch(/\bdocument\./);
        expect(content).not.toMatch(/\bwindow\./);
      }
    });

    it('verifies single-window file ceiling (< 800 lines) for all modified files', () => {
      const files = [
        path.join(root, 'src/world/npcs/kantoFuchsiaNpcs.ts'),
        path.join(root, 'src/world/interactions/CyclingRoadAndFuchsiaJanineInteractions.ts'),
        path.join(root, 'src/world/interactions/FieldObstacleDispatcher.ts'),
      ];

      for (const file of files) {
        const lines = fs.readFileSync(file, 'utf8').split('\n').length;
        expect(lines, `${path.basename(file)} must be <= 800 lines`).toBeLessThanOrEqual(800);
      }
    });
  });
});
