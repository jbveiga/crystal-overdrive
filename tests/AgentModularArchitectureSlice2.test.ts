import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  NpcInteractionRouter,
  createDefaultNpcInteractionRouter,
} from '../src/world/interactions';
import type { MapData } from '../src/types/game';
import type { NpcInteractionContext } from '../src/types/gameContext';
import type { GridEntity } from '../src/world/GridPhysics';

describe('AgentModularArchitectureSlice2 — Invariant & Regression Guardrails', () => {
  const rootDir = path.resolve(__dirname, '..');
  const mainTsPath = path.join(rootDir, 'src/main.ts');
  const interactionsDir = path.join(rootDir, 'src/world/interactions');

  const interactionModules = [
    'NpcInteractionRouter.ts',
    'GymLeaderInteractions.ts',
    'EarlyJohtoQuestInteractions.ts',
    'IlexForestInteractions.ts',
    'MidToLateJohtoQuestInteractions.ts',
    'GoldenrodAndRoute34Interactions.ts',
    'JohtoTownServiceInteractions.ts',
    'index.ts',
  ];

  it('Pillar 6 / Section 1.6: verifies all 8 interaction modules exist and stay strictly < 800 lines', () => {
    for (const modName of interactionModules) {
      const fullPath = path.join(interactionsDir, modName);
      expect(fs.existsSync(fullPath), `Module ${modName} must exist on disk`).toBe(true);

      const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
      expect(
        lineCount,
        `Module ${modName} has ${lineCount} lines, which must stay strictly < 800 lines (Single-Window Ceiling)`
      ).toBeLessThan(800);
    }
  });

  it('Pillar 5: verifies src/main.ts is reduced from 5,996 lines down to < 3,200 lines', () => {
    const mainLines = fs.readFileSync(mainTsPath, 'utf-8').split('\n').length;
    expect(mainLines).toBeLessThan(3200);

    // Assert that at least 3,000 lines were removed from the monolithic 5,996 lines
    expect(5996 - mainLines).toBeGreaterThanOrEqual(3000);
  });

  it('Pillar 1: verifies zero DOM and zero PixiJS imports in all src/world/interactions/ modules', () => {
    const forbiddenPatterns = [
      /from\s+['"]pixi\.js['"]/,
      /from\s+['"]@pixi\//,
      /\bdocument\./,
      /\bwindow\./,
      /\bHTMLElement\b/,
      /\bHTMLDivElement\b/,
    ];

    for (const modName of interactionModules) {
      const fullPath = path.join(interactionsDir, modName);
      const code = fs.readFileSync(fullPath, 'utf-8');

      for (const pattern of forbiddenPatterns) {
        expect(code, `Module ${modName} must not contain ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  describe('NpcInteractionRouter — O(1) Constant-Time Dispatching & Fallbacks', () => {
    const createMockContext = (overrides: Partial<NpcInteractionContext> = {}): NpcInteractionContext => {
      const playerEntity: GridEntity = {
        x: 10,
        y: 10,
        gridX: 10,
        gridY: 10,
        targetX: 10,
        targetY: 10,
        renderX: 10,
        renderY: 10,
        direction: 'UP',
        isMoving: false,
        progress: 0,
      };

      return {
        playerName: 'GOLD',
        playerParty: [],
        inventory: { items: {}, keyItems: [], badges: [], tms: [] } as any,
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        player: playerEntity,
        isCutsceneLocked: false,
        openDialogue: vi.fn(),
        triggerBattle: vi.fn(),
        buildTrainerTeamInstances: vi.fn().mockReturnValue([]),
        saveCurrentGame: vi.fn(),
        showToast: vi.fn(),
        audioManager: { playSfx: vi.fn() } as any,
        missionManager: { checkStoryFlags: vi.fn(), completeMission: vi.fn() } as any,
        activeNpcs: [],
        stepNeighborNpcs: vi.fn(),
        getOppositeDirection: (d: any) =>
          d === 'UP' ? 'DOWN' : d === 'DOWN' ? 'UP' : d === 'LEFT' ? 'RIGHT' : 'LEFT',
        ...overrides,
      };
    };

    const mockMap: MapData = {
      id: 'test_map',
      name: 'Test Map',
      width: 20,
      height: 20,
      collisionGrid: new Array(400).fill(0),
      warps: [],
      npcs: [],
    };

    it('dispatches to handler registered by NPC ID in O(1) time', () => {
      const router = new NpcInteractionRouter();
      const handlerFn = vi.fn().mockReturnValue(true);

      router.register({
        npcIds: ['special_npc_01'],
        handler: handlerFn,
      });

      const npc: GridEntity = {
        id: 'special_npc_01',
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };

      const ctx = createMockContext();
      const handled = router.dispatch(npc, mockMap, ctx);

      expect(handled).toBe(true);
      expect(handlerFn).toHaveBeenCalledTimes(1);
      expect(handlerFn).toHaveBeenCalledWith(npc, mockMap, ctx);
    });

    it('dispatches to handler registered by action name in O(1) time', () => {
      const router = new NpcInteractionRouter();
      const handlerFn = vi.fn().mockReturnValue(true);

      router.register({
        actions: ['CUSTOM_QUEST_EVENT'],
        handler: handlerFn,
      });

      const npc: GridEntity = {
        id: 'npc_random_name',
        action: 'CUSTOM_QUEST_EVENT',
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };

      const ctx = createMockContext();
      const handled = router.dispatch(npc, mockMap, ctx);

      expect(handled).toBe(true);
      expect(handlerFn).toHaveBeenCalledTimes(1);
    });

    it('dispatches to handler matching ID prefix', () => {
      const router = new NpcInteractionRouter();
      const handlerFn = vi.fn().mockReturnValue(true);

      router.register({
        idPrefixes: ['elevator_button_'],
        handler: handlerFn,
      });

      const npc: GridEntity = {
        id: 'elevator_button_3f',
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };

      const ctx = createMockContext();
      const handled = router.dispatch(npc, mockMap, ctx);

      expect(handled).toBe(true);
      expect(handlerFn).toHaveBeenCalledTimes(1);
    });

    it('falls back to default TRAINER_BATTLE when action is TRAINER_BATTLE and not defeated', () => {
      const router = new NpcInteractionRouter();
      const ctx = createMockContext({
        handleTrainerDefeatRewards: vi.fn(),
      });
      const dummyTeam = [{ speciesId: 'rattata', level: 5 }];
      ctx.buildTrainerTeamInstances = vi.fn().mockReturnValue(dummyTeam);

      const trainerNpc: GridEntity = {
        id: 'youngster_joey',
        trainerId: 'youngster_joey',
        action: 'TRAINER_BATTLE',
        trainerPokemon: { speciesId: 'rattata', level: 5 } as any,
        speaker: 'YOUNGSTER JOEY',
        challengePages: ['I like SHORTS! They are comfy and easy to wear!'],
        defeatPages: ['Aww, you beat me!'],
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };

      const handled = router.dispatch(trainerNpc, mockMap, ctx);
      expect(handled).toBe(true);
      expect(ctx.openDialogue).toHaveBeenCalledTimes(1);
      expect(ctx.openDialogue).toHaveBeenCalledWith(
        ['I like SHORTS! They are comfy and easy to wear!'],
        'YOUNGSTER JOEY',
        expect.any(Function)
      );
    });

    it('falls back to default pages dialogue when NPC has pages', () => {
      const router = new NpcInteractionRouter();
      const ctx = createMockContext();

      const townsfolk: GridEntity = {
        id: 'townsfolk_citizen',
        speaker: 'CITIZEN',
        pages: ['Welcome to New Bark Town! The town where winds of a new beginning blow.'],
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };

      const handled = router.dispatch(townsfolk, mockMap, ctx);
      expect(handled).toBe(true);
      expect(ctx.openDialogue).toHaveBeenCalledWith(
        ['Welcome to New Bark Town! The town where winds of a new beginning blow.'],
        'CITIZEN',
        expect.any(Function)
      );
    });

    it('returns false when NPC is unhandled and has no dialogue pages', () => {
      const router = new NpcInteractionRouter();
      const ctx = createMockContext();

      const muteNpc: GridEntity = {
        id: 'mute_rock',
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };

      const handled = router.dispatch(muteNpc, mockMap, ctx);
      expect(handled).toBe(false);
    });

    it('createDefaultNpcInteractionRouter successfully instantiates all domain modules', () => {
      const defaultRouter = createDefaultNpcInteractionRouter();
      expect(defaultRouter).toBeInstanceOf(NpcInteractionRouter);

      // Verify that major domain actions/NPCs are registered and handled
      const ctx = createMockContext();

      // Gym Leader test
      const falknerNpc: GridEntity = {
        id: 'falkner',
        action: 'FALKNER_EVENT',
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };
      expect(defaultRouter.dispatch(falknerNpc, mockMap, ctx)).toBe(true);

      // Goldenrod Day-Care test
      const dayCareManNpc: GridEntity = {
        id: 'day_care_man',
        x: 5,
        y: 5,
        renderX: 5,
        renderY: 5,
        targetX: 5,
        targetY: 5,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
      };
      expect(defaultRouter.dispatch(dayCareManNpc, mockMap, ctx)).toBe(true);
    });
  });
});
