// Mock minimal browser globals for PixiJS environment hydration in node
if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { StoryCutscenes } from '../../src/world/StoryCutscenes';
import { RoamingManager } from '../../src/world/RoamingManager';

describe('TICKET-BUGFIX-BURNED-TOWER-01: Burned Tower Events & Three Beasts Awakening Audit', () => {
  // =========================================================================
  // 1. All Three Legendary Beasts & Authentic Sprites
  // =========================================================================
  describe('1. Legendary Beasts & NPC Sprite Assignments', () => {
    it('registers raikou, entei, morty, and eusine in NPC_SHEET_PATHS', async () => {
      const { NPC_SHEET_PATHS } = await import('../../src/render/OverworldNpcAndItemSprites');
      expect(NPC_SHEET_PATHS.raikou).toBe('./assets/sprites/characters/raikou.png');
      expect(NPC_SHEET_PATHS.entei).toBe('./assets/sprites/characters/entei.png');
      expect(NPC_SHEET_PATHS.suicune).toBe('./assets/sprites/characters/suicune.png');
      expect(NPC_SHEET_PATHS.morty).toBe('./assets/sprites/characters/morty.png');
      expect(NPC_SHEET_PATHS.eusine).toBe('./assets/sprites/characters/eusine.png');
    });

    it('spawns all three Legendary Beasts on burned_tower_b1f pedestal with authentic sprites', () => {
      const npcs = createNpcsByMap();
      const b1fNpcs = npcs.burned_tower_b1f;
      expect(b1fNpcs).toBeDefined();

      const raikou = b1fNpcs.find((n) => n.id === 'burned_raikou');
      expect(raikou).toBeDefined();
      expect(raikou?.spriteType).toBe('raikou');
      expect(raikou?.x).toBe(8);
      expect(raikou?.y).toBe(3);

      const suicune = b1fNpcs.find((n) => n.id === 'beasts');
      expect(suicune).toBeDefined();
      expect(suicune?.spriteType).toBe('suicune');
      expect(suicune?.x).toBe(10);
      expect(suicune?.y).toBe(3);

      const entei = b1fNpcs.find((n) => n.id === 'burned_entei');
      expect(entei).toBeDefined();
      expect(entei?.spriteType).toBe('entei');
      expect(entei?.x).toBe(12);
      expect(entei?.y).toBe(3);
    });

    it('spawns Eusine with eusine sprite and Morty with morty sprite in burned_tower_1f', () => {
      const npcs = createNpcsByMap();
      const bt1fNpcs = npcs.burned_tower_1f;

      const eusine = bt1fNpcs.find((n) => n.id === 'eusine');
      expect(eusine).toBeDefined();
      expect(eusine?.spriteType).toBe('eusine');

      const morty = bt1fNpcs.find((n) => n.id === 'morty_burned');
      expect(morty).toBeDefined();
      expect(morty?.spriteType).toBe('morty');
    });
  });

  // =========================================================================
  // 2. Awakening Cutscene: Suicune Movement Past Player & Immediate Despawning
  // =========================================================================
  describe('2. Beasts Awakening Cutscene & Immediate Despawn', () => {
    it('sets flags, checks missions, and immediately removes all 3 beasts and 1F story NPCs from npcsByMap', () => {
      const roamingManager = new RoamingManager();
      const storyFlags = new Set<string>();
      const defeatedTrainers = new Set<string>();

      const mockNpcsByMap: Record<string, any[]> = {
        burned_tower_1f: [
          { id: 'eusine', x: 10, y: 12 },
          { id: 'morty_burned', x: 12, y: 12 },
          { id: 'silver_burned', x: 10, y: 10 },
        ],
        burned_tower_b1f: [
          { id: 'burned_raikou', x: 8, y: 3 },
          { id: 'beasts', x: 10, y: 3 },
          { id: 'burned_entei', x: 12, y: 3 },
        ],
      };

      const checkStoryFlagsMock = vi.fn();
      let lastDialoguePages: string[] = [];
      let dialogueCompleteCb: (() => void) | undefined;

      const mockContext: any = {
        player: { x: 10, y: 6, direction: 'UP' },
        storyFlags,
        defeatedTrainers,
        playerParty: [],
        audioManager: {
          playBattleBgm: vi.fn(),
          restoreOverworldBgm: vi.fn(),
          playMapBgm: vi.fn(),
          playSfx: vi.fn(),
        },
        overworldRenderer: {} as any,
        overworldHUD: {
          openDialogue: (pages: string[], _speaker?: string, onComplete?: () => void) => {
            lastDialoguePages = pages;
            dialogueCompleteCb = onComplete;
          },
          updatePokegear: vi.fn(),
          showToast: vi.fn(),
        },
        npcsByMap: mockNpcsByMap,
        gameClock: { playerSpeed: 1, battleSpeed: 1 },
        mapManager: {} as any,
        roamingManager,
        missionManager: {
          checkStoryFlags: checkStoryFlagsMock,
        },
        triggerBattle: vi.fn(),
        buildTrainerTeamInstances: vi.fn(),
        handleTrainerDefeatRewards: vi.fn(),
        saveCurrentGame: vi.fn(),
        setCutsceneLocked: vi.fn(),
      };

      vi.useFakeTimers();

      // Trigger Beasts Awakening
      StoryCutscenes.triggerBeastsAwakeningCutscene(mockContext);

      // Step 1: Open initial dialogue
      expect(lastDialoguePages[0]).toContain('Three legendary beasts stand frozen');
      if (dialogueCompleteCb) dialogueCompleteCb();

      // Advance timers for cries and beast movement
      vi.advanceTimersByTime(400); // Entei leap
      vi.advanceTimersByTime(400); // Suicune step down to (10, 4)
      vi.advanceTimersByTime(500); // Second dialogue trigger

      expect(lastDialoguePages[0]).toContain('RAIKOU and ENTEI roar fiercely');
      expect(lastDialoguePages[1]).toContain('SUICUNE slowly steps down');

      // Player completes second dialogue -> Suicune moves past player to (10, 8)
      if (dialogueCompleteCb) dialogueCompleteCb();

      vi.advanceTimersByTime(500); // Third dialogue: Eusine & Morty
      expect(lastDialoguePages[1]).toContain('EUSINE rushes down the ladder');

      // Complete cutscene
      if (dialogueCompleteCb) dialogueCompleteCb();

      // Verify story flags
      expect(storyFlags.has('beasts_awakened')).toBe(true);
      expect(storyFlags.has('EVENT_RELEASED_THE_BEASTS')).toBe(true);
      expect(storyFlags.has('burned_tower_beasts_awakened')).toBe(true);
      expect(checkStoryFlagsMock).toHaveBeenCalledWith(storyFlags);

      // Verify roamers awakened
      expect(roamingManager.areBeastsAwakened()).toBe(true);

      // Verify immediate despawning from npcsByMap
      expect(mockNpcsByMap.burned_tower_b1f.some((n) => n.id === 'burned_raikou')).toBe(false);
      expect(mockNpcsByMap.burned_tower_b1f.some((n) => n.id === 'beasts')).toBe(false);
      expect(mockNpcsByMap.burned_tower_b1f.some((n) => n.id === 'burned_entei')).toBe(false);

      expect(mockNpcsByMap.burned_tower_1f.some((n) => n.id === 'morty_burned')).toBe(false);
      expect(mockNpcsByMap.burned_tower_1f.some((n) => n.id === 'eusine')).toBe(false);
      expect(mockNpcsByMap.burned_tower_1f.some((n) => n.id === 'silver_burned')).toBe(false);

      vi.useRealTimers();
    });
  });

  // =========================================================================
  // 3. Persistent Despawn Rules in npcShared.ts
  // =========================================================================
  describe('3. Persistent NPC Despawning via isNpcActiveForStoryFlags', () => {
    it('returns true before beasts_awakened and false once beasts_awakened is active', () => {
      const preAwakened = new Set<string>();
      const postAwakened = new Set<string>(['beasts_awakened']);

      const burnedNpcIds = [
        'beasts',
        'burned_raikou',
        'burned_entei',
        'morty_burned',
        'eusine',
        'silver_burned',
      ];

      for (const id of burnedNpcIds) {
        expect(isNpcActiveForStoryFlags(id, preAwakened), `${id} must be active before awakening`).toBe(true);
        expect(isNpcActiveForStoryFlags(id, postAwakened), `${id} must be inactive after awakening`).toBe(false);
      }
    });
  });

  // =========================================================================
  // 4. Rival Silver Ambush Precedence Over Chasm Warps
  // =========================================================================
  describe('4. Rival Silver Ambush Precedence', () => {
    it('ensures OverworldTickerCoordinator evaluates burned_tower_1f ambush before checkWarp with radius <= 2', () => {
      const tickerPath = path.resolve(__dirname, '../../src/world/OverworldTickerCoordinator.ts');
      const source = fs.readFileSync(tickerPath, 'utf8');

      const ambushIdx = source.indexOf('Math.abs(coord.x - 10) + Math.abs(coord.y - 10) <= 2');
      const checkWarpIdx = source.indexOf('const warp = mapManager.checkWarp(coord);');

      expect(ambushIdx).toBeGreaterThan(0);
      expect(checkWarpIdx).toBeGreaterThan(0);
      expect(ambushIdx).toBeLessThan(checkWarpIdx);
    });
  });

  // =========================================================================
  // 5. Overworld BGM Restoration on Rival Silver Defeat
  // =========================================================================
  describe('5. BGM Restoration on Rival Silver Defeat', () => {
    it('restores overworld BGM upon defeating Rival Silver in triggerBurnedTowerRivalBattle', () => {
      const cutscenesPath = path.resolve(__dirname, '../../src/world/StoryCutscenes.ts');
      const source = fs.readFileSync(cutscenesPath, 'utf8');

      const battleIdx = source.indexOf('public static triggerBurnedTowerRivalBattle');
      const restoreBgmIdx = source.indexOf('ctx.audioManager.restoreOverworldBgm()', battleIdx);

      expect(restoreBgmIdx).toBeGreaterThan(battleIdx);
      expect(restoreBgmIdx).toBeLessThan(source.indexOf('public static triggerOlivineRivalConfrontation'));
    });
  });

  // =========================================================================
  // 6. Visual Sprite Position Synchronization (renderX/renderY & gridX/gridY)
  // =========================================================================
  describe('6. Visual Sprite Coordinate Synchronization & Chasm Drop', () => {
    it('updates renderX, renderY, gridX, gridY, targetX, and targetY on Raikou, Entei, and Suicune during awakening', () => {
      const roamingManager = new RoamingManager();
      const storyFlags = new Set<string>();
      const raikouObj: any = { id: 'burned_raikou', x: 8, y: 3, renderX: 8, renderY: 3, gridX: 8, gridY: 3, targetX: 8, targetY: 3 };
      const suicuneObj: any = { id: 'beasts', x: 10, y: 3, renderX: 10, renderY: 3, gridX: 10, gridY: 3, targetX: 10, targetY: 3 };
      const enteiObj: any = { id: 'burned_entei', x: 12, y: 3, renderX: 12, renderY: 3, gridX: 12, gridY: 3, targetX: 12, targetY: 3 };

      let dialogueCompleteCb: (() => void) | undefined;
      const mockContext: any = {
        player: { x: 10, y: 6, direction: 'UP' },
        storyFlags,
        defeatedTrainers: new Set<string>(),
        playerParty: [],
        audioManager: { playBattleBgm: vi.fn(), restoreOverworldBgm: vi.fn(), playMapBgm: vi.fn(), playSfx: vi.fn() },
        overworldRenderer: {} as any,
        overworldHUD: {
          openDialogue: (_pages: string[], _speaker?: string, onComplete?: () => void) => {
            dialogueCompleteCb = onComplete;
          },
          updatePokegear: vi.fn(),
          showToast: vi.fn(),
        },
        npcsByMap: {
          burned_tower_b1f: [raikouObj, suicuneObj, enteiObj],
        },
        gameClock: { playerSpeed: 1, battleSpeed: 1 },
        mapManager: {} as any,
        roamingManager,
        triggerBattle: vi.fn(),
        buildTrainerTeamInstances: vi.fn(),
        handleTrainerDefeatRewards: vi.fn(),
        saveCurrentGame: vi.fn(),
        setCutsceneLocked: vi.fn(),
      };

      vi.useFakeTimers();
      StoryCutscenes.triggerBeastsAwakeningCutscene(mockContext);
      if (dialogueCompleteCb) dialogueCompleteCb();

      // Immediately after first dialogue closes, Raikou leaps to (6, 8)
      expect(raikouObj.renderX).toBe(6);
      expect(raikouObj.renderY).toBe(8);

      vi.advanceTimersByTime(400);
      expect(enteiObj.renderX).toBe(14);
      expect(enteiObj.renderY).toBe(8);

      vi.advanceTimersByTime(400);
      expect(suicuneObj.renderX).toBe(10);
      expect(suicuneObj.renderY).toBe(4);

      vi.advanceTimersByTime(500);
      // Complete second dialogue -> Suicune moves past player to (10, 8)
      if (dialogueCompleteCb) dialogueCompleteCb();
      expect(suicuneObj.renderX).toBe(10);
      expect(suicuneObj.renderY).toBe(8);

      vi.useRealTimers();
    });

    it('updates Silver renderX/renderY and triggers chasm warp drop into B1F when player stands on a chasm tile', () => {
      const silverObj: any = { id: 'silver_burned', x: 10, y: 10, renderX: 10, renderY: 10, gridX: 10, gridY: 10, targetX: 10, targetY: 10 };
      const executeWarpMock = vi.fn();
      let dialogueCompleteCb: (() => void) | undefined;
      let battleVictoryCb: (() => void) | undefined;

      const mockContext: any = {
        player: { x: 10, y: 11, direction: 'UP' },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        playerParty: [],
        audioManager: { playBattleBgm: vi.fn(), restoreOverworldBgm: vi.fn(), playSfx: vi.fn() },
        overworldHUD: {
          openDialogue: (_pages: string[], _speaker?: string, onComplete?: () => void) => {
            dialogueCompleteCb = onComplete;
          },
          showToast: vi.fn(),
        },
        npcsByMap: { burned_tower_1f: [silverObj] },
        mapManager: {
          checkWarp: ({ x, y }: { x: number; y: number }) =>
            x === 10 && y === 11 ? { x: 10, y: 11, targetMapId: 'burned_tower_b1f', targetX: 10, targetY: 9 } : null,
        },
        executeWarpTransition: executeWarpMock,
        triggerBattle: (_opp: any, opts: any) => {
          battleVictoryCb = opts.onVictory;
        },
        saveCurrentGame: vi.fn(),
        setCutsceneLocked: vi.fn(),
      };

      StoryCutscenes.triggerBurnedTowerRivalBattle(mockContext);
      if (dialogueCompleteCb) dialogueCompleteCb();
      if (battleVictoryCb) battleVictoryCb();
      if (dialogueCompleteCb) dialogueCompleteCb();

      expect(silverObj.x).toBe(8);
      expect(silverObj.renderX).toBe(8);
      expect(silverObj.renderY).toBe(10);
      expect(executeWarpMock).toHaveBeenCalledWith({
        x: 10,
        y: 11,
        targetMapId: 'burned_tower_b1f',
        targetX: 10,
        targetY: 9,
      });
    });

    it('ensures burned_raikou and burned_entei have BEASTS_AWAKENING action and exterior void tiles on B1F are solid (1)', () => {
      const npcs = createNpcsByMap();
      const b1fNpcs = npcs.burned_tower_b1f;
      expect(b1fNpcs.find((n) => n.id === 'burned_raikou')?.action).toBe('BEASTS_AWAKENING');
      expect(b1fNpcs.find((n) => n.id === 'burned_entei')?.action).toBe('BEASTS_AWAKENING');

      const b1fMapPath = path.resolve(__dirname, '../../public/assets/data/maps/burned_tower_b1f.json');
      const b1fMap = JSON.parse(fs.readFileSync(b1fMapPath, 'utf8'));
      expect(b1fMap.collisionGrid[0]).toBe(1);
      expect(b1fMap.collisionGrid[(b1fMap.height - 1) * b1fMap.width]).toBe(1);
    });
  });
});
