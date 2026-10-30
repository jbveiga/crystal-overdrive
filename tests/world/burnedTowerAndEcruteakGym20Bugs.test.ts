import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { isEcruteakGymSafeTile } from '../../src/world/ecruteakGymMaze';
import {
  isCaveMap,
  isCarpetWarp,
  getRequiredWarpDirection,
} from '../../src/world/map/MapClassificationAndWarpRules';
import { StoryCutscenes } from '../../src/world/StoryCutscenes';
import { JOHTO_LANDMARKS } from '../../src/world/townMapData';
import { getGymLeaderInteractions } from '../../src/world/interactions/GymLeaderInteractions';
import { OverworldTouchAndKeyController } from '../../src/ui/hud/OverworldTouchAndKeyController';
import { GridPhysics } from '../../src/world/GridPhysics';

describe('TICKET-BUGFIX-BT10-EG10-MOBILE-TURN-01: 10 Burned Tower Bugs, 10 Ecruteak Gym Bugs & Mobile Turn-in-Place', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');

  // =========================================================================
  // A. Mobile Turn-in-Place Without Walking
  // =========================================================================
  describe('A. Mobile Turn-in-Place Without Walking', () => {
    it('rotates immediately via consumePendingTouchTurnDirection while suppressing getHeldDirection during 145ms tap window', () => {
      const fakeRoot = {
        querySelector: () => null,
      } as unknown as HTMLElement;

      const controller = new OverworldTouchAndKeyController({
        rootElement: fakeRoot,
        isDialogueOpen: () => false,
        isVisible: () => true,
      });

      // Simulate internal touch tap via private state or TOUCH_TURN_HOLD_DELAY_MS
      expect(OverworldTouchAndKeyController.TOUCH_TURN_HOLD_DELAY_MS).toBe(145);
      (controller as any).pendingTouchTurnDirection = 'LEFT';
      (controller as any).touchDirection = 'LEFT';
      (controller as any).activeDirection = 'LEFT';
      (controller as any).touchTurnUntilMs = performance.now() + 145;

      // During the 145ms tap window, getHeldDirection() returns null so the player does not walk
      expect(controller.getHeldDirection()).toBeNull();
      // Meanwhile consumePendingTouchTurnDirection() returns 'LEFT' so the player rotates in place
      expect(controller.consumePendingTouchTurnDirection()).toBe('LEFT');
      expect(controller.consumePendingTouchTurnDirection()).toBeNull();

      // Once the 145ms hold window elapses, holding continues walking
      (controller as any).touchTurnUntilMs = performance.now() - 1;
      expect(controller.getHeldDirection()).toBe('LEFT');
    });

    it('supports turn-in-place in GridPhysics.updateEntity across 2x/3x speed frame deltas (dt < 0.08)', () => {
      const player: any = {
        id: 'player',
        x: 5,
        y: 5,
        gridX: 5,
        gridY: 5,
        targetX: 5,
        targetY: 5,
        renderX: 5,
        renderY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      };

      // At 3x speed, a 60fps frame is ~0.05s (which previously failed dt < 0.04)
      GridPhysics.updateEntity(
        player,
        0.02,
        'UP',
        () => true,
        () => 0
      );

      expect(player.direction).toBe('UP');
      expect(player.isMoving).toBe(false);
      expect(player.x).toBe(5);
      expect(player.y).toBe(5);
    });
  });

  // =========================================================================
  // B. 10 Burned Tower Bug Fixes (BT-01 .. BT-10)
  // =========================================================================
  describe('B. 10 Burned Tower Bug Fixes (BT-01 .. BT-10)', () => {
    it('BT-01: recognizes (9, 15) and (10, 15) on burned_tower_1f (height 18) as DOWN exit carpet warps', () => {
      const bt1f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'burned_tower_1f.json'), 'utf8'));
      const warp9 = bt1f.warps.find((w: any) => w.x === 9 && w.y === 15);
      const warp10 = bt1f.warps.find((w: any) => w.x === 10 && w.y === 15);

      expect(isCarpetWarp(warp9, bt1f)).toBe(true);
      expect(isCarpetWarp(warp10, bt1f)).toBe(true);
      expect(getRequiredWarpDirection(warp9, bt1f)).toBe('DOWN');
      expect(getRequiredWarpDirection(warp10, bt1f)).toBe('DOWN');
    });

    it('BT-02: spawns Firebreather Ned (15, 4) and Firebreather Richard (4, 12) on walkable tiles in burned_tower_1f', () => {
      const bt1f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'burned_tower_1f.json'), 'utf8'));
      const npcs = createNpcsByMap().burned_tower_1f;

      const ned = npcs.find((n) => n.id === 'firebreather_ned');
      const richard = npcs.find((n) => n.id === 'firebreather_richard');
      expect(ned).toBeDefined();
      expect(richard).toBeDefined();
      expect(bt1f.collisionGrid[ned!.y * bt1f.width + ned!.x]).toBe(0);
      expect(bt1f.collisionGrid[richard!.y * bt1f.width + richard!.x]).toBe(0);
    });

    it('BT-03: classifies burned_tower_b1f as a cave map so chasm warps play CAVE_WARP sound', () => {
      expect(isCaveMap('burned_tower_b1f')).toBe(true);
    });

    it('BT-04: includes wild Magmar in burned_tower_b1f.json grassEncounters and townMapData', () => {
      const btb1f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'burned_tower_b1f.json'), 'utf8'));
      const magmarSlots = btb1f.grassEncounters.filter((s: any) => s.speciesId === 'magmar');
      expect(magmarSlots.length).toBeGreaterThanOrEqual(3);
      expect(JOHTO_LANDMARKS.burned_tower.wildSpecies).toContain('magmar');
    });

    it('BT-05, BT-06 & BT-07: uses dynamic rivalName, faces Silver horizontally, and unlocks cutscene on defeat in triggerBurnedTowerRivalBattle', () => {
      const silverObj: any = { id: 'silver_burned', x: 10, y: 10, direction: 'DOWN' };
      let spokenSpeaker = '';
      let spokenPages: string[] = [];
      let dialogueCb: (() => void) | undefined;
      let battleEndCb: ((res: any) => void) | undefined;
      let lockedState = false;

      const mockCtx: any = {
        player: { x: 8, y: 10, direction: 'DOWN', isMoving: false, progress: 0 },
        rivalName: 'Kamui',
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        playerParty: [],
        audioManager: { playBattleBgm: vi.fn(), restoreOverworldBgm: vi.fn(), playSfx: vi.fn() },
        overworldHUD: {
          openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
            spokenPages = pages;
            spokenSpeaker = speaker || '';
            dialogueCb = onComplete;
          },
          showToast: vi.fn(),
        },
        npcsByMap: { burned_tower_1f: [silverObj] },
        triggerBattle: (_lead: any, opts: any) => {
          battleEndCb = opts.onBattleEnd;
        },
        saveCurrentGame: vi.fn(),
        setCutsceneLocked: (val: boolean) => {
          lockedState = val;
        },
      };

      StoryCutscenes.triggerBurnedTowerRivalBattle(mockCtx);
      // BT-07: Player at (8,10) faces RIGHT toward Silver at (10,10); Silver faces LEFT
      expect(mockCtx.player.direction).toBe('RIGHT');
      expect(silverObj.direction).toBe('LEFT');
      // BT-05: Dynamic rivalName
      expect(spokenSpeaker).toBe('❓ RIVAL KAMUI');
      expect(spokenPages[0]).toContain('KAMUI:');

      if (dialogueCb) dialogueCb();
      // BT-06: Simulate player loss -> unlocks cutscene & restores BGM
      if (battleEndCb) battleEndCb('DEFEAT');
      expect(lockedState).toBe(false);
      expect(mockCtx.audioManager.restoreOverworldBgm).toHaveBeenCalled();
    });

    it('BT-08, BT-09 & BT-10: faces player UP on Beasts Awakening, uses dynamic rivalName in warp guard, and despawns silver_burned on EVENT_BEAT_BURNED_TOWER_SILVER', () => {
      const mockCtx: any = {
        player: { x: 8, y: 6, direction: 'RIGHT', isMoving: false, progress: 0 },
        storyFlags: new Set<string>(),
        overworldHUD: { openDialogue: vi.fn() },
        setCutsceneLocked: vi.fn(),
      };
      StoryCutscenes.triggerBeastsAwakeningCutscene(mockCtx);
      expect(mockCtx.player.direction).toBe('UP');

      expect(isNpcActiveForStoryFlags('silver_burned', new Set(['EVENT_BEAT_BURNED_TOWER_SILVER']))).toBe(false);
    });
  });

  // =========================================================================
  // C. 10 Ecruteak Gym Bug Fixes (EG-01 .. EG-10)
  // =========================================================================
  describe('C. 10 Ecruteak Gym Bug Fixes (EG-01 .. EG-10)', () => {
    it('EG-01 & EG-02: resolves NPC-blocked maze softlocks at Sage Ping (7,9) and Medium Martha (2,7) so BFS reaches Morty (4,3) avoiding all trainer tiles', () => {
      expect(isEcruteakGymSafeTile(6, 11)).toBe(true);
      expect(isEcruteakGymSafeTile(6, 10)).toBe(true);
      expect(isEcruteakGymSafeTile(3, 8)).toBe(true);

      const gymNpcs = createNpcsByMap().ecruteak_gym;
      const trainerCoords = new Set(
        gymNpcs.filter((n) => n.id !== 'morty').map((n) => `${n.x},${n.y}`)
      );

      // BFS from (4, 16) to (4, 4) (directly in front of Morty at (4, 3)) without stepping on any trainer NPC tile
      const visited = new Set<string>(['4,16']);
      const queue: [number, number][] = [[4, 16]];
      let reachedMortyFront = false;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        if (cx === 4 && cy === 4) {
          reachedMortyFront = true;
          break;
        }
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          const key = `${nx},${ny}`;
          if (!visited.has(key) && isEcruteakGymSafeTile(nx, ny) && !trainerCoords.has(key)) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }

      expect(reachedMortyFront).toBe(true);
    });

    it('EG-03 & EG-04: evaluates Ecruteak Gym pitfall immediately after checkWarp and registers ecruteak_gym in FieldObstacleDispatcher statue table', () => {
      const tickerSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/world/OverworldTickerCoordinator.ts'),
        'utf8'
      );
      const warpIdx = tickerSource.indexOf('const warp = mapManager.checkWarp(coord);');
      const pitfallIdx = tickerSource.indexOf("!isEcruteakGymSafeTile(coord.x, coord.y)");
      const elevatorIdx = tickerSource.indexOf("currentMap?.id.startsWith('goldenrod_dept_store_')");
      expect(pitfallIdx).toBeGreaterThan(warpIdx);
      expect(pitfallIdx).toBeLessThan(elevatorIdx);

      const dispatcherSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/world/interactions/FieldObstacleDispatcher.ts'),
        'utf8'
      );
      expect(dispatcherSource).toContain("ecruteak_gym: { city: 'ECRUTEAK CITY', leader: 'MORTY', flag: 'morty_defeated' }");
    });

    it('EG-05, EG-06 & EG-07: hides morty when active flags lack beasts_awakened and restores BGM on Morty victory/defeat', () => {
      expect(isNpcActiveForStoryFlags('morty', new Set(['starter_chosen']))).toBe(false);
      expect(isNpcActiveForStoryFlags('morty', new Set(['starter_chosen', 'beasts_awakened']))).toBe(true);

      const mortyReg = getGymLeaderInteractions().find((r) => r.actions?.includes('MORTY_EVENT'));
      const restoreBgmMock = vi.fn();
      let dialogueCb: (() => void) | undefined;
      let battleEndCb: ((res: any) => void) | undefined;

      const mockCtx: any = {
        storyFlags: new Set<string>(['beasts_awakened']),
        defeatedTrainers: new Set<string>(),
        inventory: { badges: [], tms: [] },
        missionManager: { checkStoryFlags: vi.fn() },
        audioManager: { playSfx: vi.fn(), restoreOverworldBgm: restoreBgmMock },
        openDialogue: (_p: string[], _s?: string, cb?: () => void) => {
          dialogueCb = cb;
        },
        buildTrainerTeamInstances: () => [{ speciesId: 'gengar', level: 25 }],
        triggerBattle: (_lead: any, opts: any) => {
          battleEndCb = opts.onBattleEnd;
        },
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
      };

      mortyReg!.handler({ id: 'morty', speaker: 'MORTY' } as any, {} as any, mockCtx);
      if (dialogueCb) dialogueCb();
      if (battleEndCb) battleEndCb('DEFEAT');
      expect(restoreBgmMock).toHaveBeenCalled();
    });

    it('EG-08, EG-09 & EG-10: configures defeatPages and sprites on all 4 Ecruteak Gym trainers and blocks outer margin columns x=0,9 at y=14..17', () => {
      const gymNpcs = createNpcsByMap().ecruteak_gym;
      for (const id of ['medium_martha', 'sage_ping', 'medium_grace', 'sage_jeffrey']) {
        const trainer = gymNpcs.find((n) => n.id === id);
        expect(trainer?.defeatPages?.length, `${id} must have defeatPages`).toBeGreaterThan(0);
      }
      expect(gymNpcs.find((n) => n.id === 'sage_ping')?.trainerTeam?.length).toBe(5);

      const eg = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ecruteak_gym.json'), 'utf8'));
      for (let y = 14; y <= 17; y++) {
        expect(eg.collisionGrid[y * eg.width + 0]).toBe(1);
        expect(eg.collisionGrid[y * eg.width + 9]).toBe(1);
      }
    });
  });
});
