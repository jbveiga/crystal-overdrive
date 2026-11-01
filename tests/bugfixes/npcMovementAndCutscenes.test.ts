import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GridPhysics, type GridEntity } from '../../src/world/GridPhysics';
import { createNpcsByMap } from '../../src/world/npcData';
import {
  FARFETCHD_WAYPOINTS,
  FARFETCHD_PATH_SEGMENTS,
  getIlexForestInteractions,
} from '../../src/world/interactions/IlexForestInteractions';
import { getEarlyJohtoQuestInteractions } from '../../src/world/interactions/EarlyJohtoQuestInteractions';
import { StoryCutscenes } from '../../src/world/StoryCutscenes';
import { RoamingManager } from '../../src/world/RoamingManager';

describe('Gen 2 NPC Movement, Ilex Forest Farfetchd Pathing, Burned Tower Cutscenes & Issue #62', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GitHub Issue #62: public/favicon.ico & index.html', () => {
    it('provides a valid ICO binary at public/favicon.ico and links it in index.html', () => {
      const icoPath = path.resolve(process.cwd(), 'public/favicon.ico');
      expect(fs.existsSync(icoPath)).toBe(true);

      const icoBuf = fs.readFileSync(icoPath);
      expect(icoBuf.length).toBeGreaterThan(100);
      // ICO header: 00 00 01 00 (Reserved = 0, Type = 1 ICO)
      expect(icoBuf.readUInt16LE(0)).toBe(0);
      expect(icoBuf.readUInt16LE(2)).toBe(1);
      expect(icoBuf.readUInt16LE(4)).toBeGreaterThanOrEqual(1);

      const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
      expect(indexHtml).toContain('href="./favicon.ico"');
      expect(indexHtml).toContain('rel="icon"');
    });
  });

  describe('GridPhysics & OverworldNpcs Gen 2 Movement Assignment', () => {
    it('syncs gridX and gridY when GridPhysics.updateEntity finishes a tile step', () => {
      const npc: GridEntity = {
        id: 'test_walker',
        x: 5,
        y: 5,
        gridX: 5,
        gridY: 5,
        targetX: 6,
        targetY: 5,
        renderX: 5,
        renderY: 5,
        direction: 'RIGHT',
        isMoving: true,
        progress: 0.9,
        speed: 4,
        frame: 1,
        animTimer: 0,
      };

      GridPhysics.updateEntity(npc, 0.1);
      expect(npc.isMoving).toBe(false);
      expect(npc.x).toBe(6);
      expect(npc.y).toBe(5);
      expect(npc.gridX).toBe(6);
      expect(npc.gridY).toBe(5);
    });

    it('assigns movementType and wanderRadius to ambient townsfolk while keeping clerks and trainers stationary', () => {
      const npcsByMap = createNpcsByMap();
      const cherrygroveNpcs = npcsByMap.cherrygrove_city || [];
      const guideGent = cherrygroveNpcs.find((n) => n.id.includes('guide'));
      expect(guideGent).toBeDefined();
      expect(guideGent?.movementType).toBe('STILL');

      const ambientMovers = cherrygroveNpcs.filter(
        (n) => !n.id.includes('guide') && n.movementType && n.movementType !== 'STILL'
      );
      expect(ambientMovers.length).toBeGreaterThan(0);

      const route29Npcs = npcsByMap.route_29 || [];
      const joey = route29Npcs.find((n) => n.id === 'youngster_joey');
      expect(joey?.movementType).toBe('STILL');
    });

    it('assigns authentic Gen 2 movement types to Burned Tower 1F NPCs', () => {
      const npcsByMap = createNpcsByMap();
      const burned1fNpcs = npcsByMap.burned_tower_1f || [];
      const eusine = burned1fNpcs.find((n) => n.id === 'eusine');
      const morty = burned1fNpcs.find((n) => n.id === 'morty_burned');
      const ned = burned1fNpcs.find((n) => n.id === 'firebreather_ned');
      const richard = burned1fNpcs.find((n) => n.id === 'firebreather_richard');

      expect(eusine?.movementType).toBe('WANDER');
      expect(eusine?.wanderRadius).toBe(1);
      expect(morty?.movementType).toBe('SPINRANDOM');
      expect(ned?.movementType).toBe('SPINRANDOM');
      expect(richard?.movementType).toBe('SPINRANDOM');
    });
  });

  describe('Ilex Forest Farfetchd Tile-by-Tile Pathing & HM01 Cut', () => {
    it('defines 5 waypoints and 4 walkable tile-by-tile path segments on ilex_forest.json', () => {
      const mapPath = path.resolve(process.cwd(), 'public/assets/data/maps/ilex_forest.json');
      const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

      expect(FARFETCHD_WAYPOINTS).toEqual([
        { x: 15, y: 23 },
        { x: 20, y: 24 },
        { x: 29, y: 24 },
        { x: 22, y: 31 },
        { x: 15, y: 29 },
      ]);
      expect(FARFETCHD_PATH_SEGMENTS.length).toBe(4);

      for (let segIdx = 0; segIdx < FARFETCHD_PATH_SEGMENTS.length; segIdx++) {
        const segment = FARFETCHD_PATH_SEGMENTS[segIdx];
        let prev = FARFETCHD_WAYPOINTS[segIdx];
        for (const step of segment) {
          // Each step must be strictly Manhattan distance 1 from previous tile
          const dist = Math.abs(step.x - prev.x) + Math.abs(step.y - prev.y);
          expect(dist).toBe(1);
          // Must be walkable on ilex_forest.json (collision === 0)
          const tileCollision = mapData.collisionGrid[step.y * mapData.width + step.x];
          expect(tileCollision).toBe(0);
          prev = { x: step.x, y: step.y };
        }
        expect(prev).toEqual(FARFETCHD_WAYPOINTS[segIdx + 1]);
      }
    });

    it('animates Farfetchd tile-by-tile across all 4 segments when talked to from any side and grants canonical HM01', () => {
      const storyFlags = new Set<string>();
      const inventory = {
        items: {},
        balls: {},
        keyItems: [] as string[],
        tms: [] as string[],
      };

      const farfetchd: GridEntity = {
        id: 'forest_farfetchd',
        x: 15,
        y: 23,
        gridX: 15,
        gridY: 23,
        targetX: 15,
        targetY: 23,
        renderX: 15,
        renderY: 23,
        originX: 15,
        originY: 23,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
        speed: 4,
        frame: 0,
        animTimer: 0,
        speaker: "FARFETCH'D",
        action: 'FARFETCHD_HERD_EVENT',
      };

      const mockContext: any = {
        storyFlags,
        inventory,
        playerName: 'GOLD',
        openDialogue: (_lines: string[], _speaker?: string, cb?: () => void) => {
          if (cb) cb();
        },
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
      };

      const registrations = getIlexForestInteractions();
      const farfetchdReg = registrations.find((r) => r.npcIds?.includes('forest_farfetchd'));
      expect(farfetchdReg).toBeDefined();

      // Leg 0: (15,23) -> (20,24)
      farfetchdReg!.handler(farfetchd, {} as any, mockContext);
      expect(farfetchd.x).toBe(20);
      expect(farfetchd.y).toBe(24);
      // Mid-animation check
      vi.advanceTimersByTime(150);
      expect(farfetchd.isMoving).toBe(true);
      vi.advanceTimersByTime(1000);
      expect(farfetchd.isMoving).toBe(false);
      expect(farfetchd.renderX).toBe(20);
      expect(farfetchd.renderY).toBe(24);

      // Leg 1: (20,24) -> (29,24)
      farfetchdReg!.handler(farfetchd, {} as any, mockContext);
      expect(farfetchd.x).toBe(29);
      expect(farfetchd.y).toBe(24);
      vi.advanceTimersByTime(1500);
      expect(farfetchd.renderX).toBe(29);
      expect(farfetchd.renderY).toBe(24);

      // Leg 2: (29,24) -> (22,31)
      farfetchdReg!.handler(farfetchd, {} as any, mockContext);
      expect(farfetchd.x).toBe(22);
      expect(farfetchd.y).toBe(31);
      vi.advanceTimersByTime(2000);
      expect(farfetchd.renderX).toBe(22);
      expect(farfetchd.renderY).toBe(31);

      // Leg 3: (22,31) -> (15,29)
      farfetchdReg!.handler(farfetchd, {} as any, mockContext);
      expect(farfetchd.x).toBe(15);
      expect(farfetchd.y).toBe(29);
      vi.advanceTimersByTime(1500);
      expect(farfetchd.renderX).toBe(15);
      expect(farfetchd.renderY).toBe(29);
      expect(storyFlags.has('EVENT_HERDED_FARFETCHD')).toBe(true);
      expect(storyFlags.has('has_hm01_cut')).toBe(true);
      expect(inventory.tms).toContain('HM01');
      expect(inventory.tms).not.toContain('HM01_CUT');
    });
  });

  describe('Burned Tower Cutscenes & Ruins of Alph Unown Dex Edge Cases', () => {
    it('spawns Eusine on burned_tower_b1f after the Legendary Beasts flee and cleans up on finish', () => {
      const roamingManager = new RoamingManager();
      const storyFlags = new Set<string>();
      const raikouObj: any = { id: 'burned_raikou', x: 8, y: 3, renderX: 8, renderY: 3, gridX: 8, gridY: 3, targetX: 8, targetY: 3 };
      const suicuneObj: any = { id: 'beasts', x: 10, y: 3, renderX: 10, renderY: 3, gridX: 10, gridY: 3, targetX: 10, targetY: 3 };
      const enteiObj: any = { id: 'burned_entei', x: 12, y: 3, renderX: 12, renderY: 3, gridX: 12, gridY: 3, targetX: 12, targetY: 3 };
      const b1fList: any[] = [raikouObj, suicuneObj, enteiObj];

      let sawEusineDuringCutscene = false;
      const ctx: any = {
        player: { x: 10, y: 6, direction: 'UP', isMoving: false, progress: 0 },
        storyFlags,
        defeatedTrainers: new Set<string>(),
        playerParty: [],
        starterId: 158,
        playerName: 'KRIS',
        rivalName: 'SILVER',
        npcsByMap: {
          burned_tower_b1f: b1fList,
          burned_tower_1f: [],
        },
        roamingManager,
        overworldRenderer: {
          checkStoryFlags: vi.fn(),
        },
        overworldHUD: {
          openDialogue: (_pages: string[], _speaker?: string, onComplete?: () => void) => {
            if (ctx.npcsByMap.burned_tower_b1f.some((n: any) => n.id === 'eusine_b1f_cutscene')) {
              sawEusineDuringCutscene = true;
            }
            if (onComplete) onComplete();
          },
          updatePokegear: vi.fn(),
          showToast: vi.fn(),
        },
        audioManager: {
          playTrack: vi.fn(),
          playBattleBgm: vi.fn(),
          playSfx: vi.fn(),
          restoreOverworldBgm: vi.fn(),
        },
        setCutsceneLocked: vi.fn(),
        saveCurrentGame: vi.fn(),
      };

      StoryCutscenes.triggerBeastsAwakeningCutscene(ctx);
      vi.advanceTimersByTime(500);
      vi.advanceTimersByTime(500);
      vi.advanceTimersByTime(500);
      vi.advanceTimersByTime(1000);

      expect(sawEusineDuringCutscene).toBe(true);
      expect(storyFlags.has('beasts_awakened')).toBe(true);
      expect(ctx.npcsByMap.burned_tower_b1f.some((n: any) => n.id === 'eusine_b1f_cutscene')).toBe(false);
    });

    it('animates Rival Silver stepping aside after Burned Tower 1F battle', () => {
      const storyFlags = new Set<string>();
      const rival: any = {
        id: 'silver_burned',
        x: 9,
        y: 10,
        gridX: 9,
        gridY: 10,
        targetX: 9,
        targetY: 10,
        renderX: 9,
        renderY: 10,
        direction: 'DOWN',
        isMoving: false,
        frame: 0,
      };
      const ctx: any = {
        player: { x: 10, y: 10, direction: 'LEFT', isMoving: false, progress: 0 },
        storyFlags,
        defeatedTrainers: new Set<string>(),
        playerParty: [],
        starterId: 155,
        playerName: 'GOLD',
        rivalName: 'SILVER',
        npcsByMap: {
          burned_tower_1f: [rival],
        },
        overworldRenderer: {
          checkStoryFlags: vi.fn(),
        },
        overworldHUD: {
          openDialogue: (_lines: string[], _speaker?: string, cb?: () => void) => {
            if (cb) cb();
          },
          showToast: vi.fn(),
        },
        audioManager: {
          playTrack: vi.fn(),
          playBattleBgm: vi.fn(),
          playSfx: vi.fn(),
          restoreOverworldBgm: vi.fn(),
        },
        setCutsceneLocked: vi.fn(),
        triggerBattle: (_lead: any, opts: any) => {
          if (opts.onVictory) opts.onVictory();
        },
        saveCurrentGame: vi.fn(),
      };

      StoryCutscenes.triggerBurnedTowerRivalBattle(ctx);
      vi.advanceTimersByTime(300);
      expect(rival.x).toBe(8);
      expect(rival.y).toBe(10);
      expect(rival.renderX).toBe(8);
      expect(rival.renderY).toBe(10);
      expect(storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER')).toBe(true);
      expect(ctx.defeatedTrainers.has('silver_burned')).toBe(true);
    });

    it('grants Unown Dex when a non-Kabuto chamber (e.g., Omanyte) was solved', () => {
      const storyFlags = new Set<string>(['unown_awakened_omanyte']);
      const ctx: any = {
        storyFlags,
        playerName: 'GOLD',
        openDialogue: (_lines: string[], _speaker?: string, cb?: () => void) => {
          if (cb) cb();
        },
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
      };
      const registrations = getEarlyJohtoQuestInteractions();
      const unownDexReg = registrations.find((r) => r.actions?.includes('UNOWN_DEX_EVENT'));
      expect(unownDexReg).toBeDefined();

      const scientistNpc: any = {
        id: 'ruins_lab_scientist_1',
        speaker: 'SCIENTIST',
        action: 'UNOWN_DEX_EVENT',
      };
      unownDexReg!.handler(scientistNpc, {} as any, ctx);
      expect(storyFlags.has('ENGINE_UNOWN_DEX')).toBe(true);
    });
  });
});
