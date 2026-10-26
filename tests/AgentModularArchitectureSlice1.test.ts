import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FieldObstacleDispatcher } from '../src/world/interactions/FieldObstacleDispatcher';
import type { MapData } from '../src/types/game';
import type { FieldObstacleContext } from '../src/types/gameContext';

describe('AgentModularArchitectureSlice1 — Invariant & Regression Guardrails', () => {
  const rootDir = path.resolve(__dirname, '..');
  const mainTsPath = path.join(rootDir, 'src/main.ts');
  const gameContextPath = path.join(rootDir, 'src/types/gameContext.d.ts');
  const battleSessionControllerPath = path.join(rootDir, 'src/battle/BattleSessionController.ts');
  const fieldObstacleDispatcherPath = path.join(rootDir, 'src/world/interactions/FieldObstacleDispatcher.ts');
  const fieldObstacleDispatcherAliasPath = path.join(rootDir, 'src/world/FieldObstacleDispatcher.ts');

  it('Pillar 5: verifies file existence and line budget constraints (< 700 lines per module, < 6000 lines for main.ts)', () => {
    expect(fs.existsSync(gameContextPath)).toBe(true);
    expect(fs.existsSync(battleSessionControllerPath)).toBe(true);
    expect(fs.existsSync(fieldObstacleDispatcherPath)).toBe(true);
    expect(fs.existsSync(fieldObstacleDispatcherAliasPath)).toBe(true);

    const mainTsLines = fs.readFileSync(mainTsPath, 'utf-8').split('\n').length;
    const gameContextLines = fs.readFileSync(gameContextPath, 'utf-8').split('\n').length;
    const battleControllerLines = fs.readFileSync(battleSessionControllerPath, 'utf-8').split('\n').length;
    const fieldDispatcherLines = fs.readFileSync(fieldObstacleDispatcherPath, 'utf-8').split('\n').length;

    // Budget constraints
    expect(mainTsLines).toBeLessThan(6000);
    expect(gameContextLines).toBeLessThan(700);
    expect(battleControllerLines).toBeLessThan(700);
    expect(fieldDispatcherLines).toBeLessThan(700);

    // Reduction verification: previously 6,991 lines -> >= 950 lines removed
    expect(6991 - mainTsLines).toBeGreaterThanOrEqual(950);
  });

  it('Pillar 1: verifies zero DOM and zero PixiJS imports in BattleSessionController and FieldObstacleDispatcher', () => {
    const battleCode = fs.readFileSync(battleSessionControllerPath, 'utf-8');
    const fieldCode = fs.readFileSync(fieldObstacleDispatcherPath, 'utf-8');

    const forbiddenPatterns = [
      /from\s+['"]pixi\.js['"]/,
      /from\s+['"]@pixi\//,
      /\bdocument\./,
      /\bwindow\./,
      /\bHTMLElement\b/,
      /\bHTMLDivElement\b/,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(battleCode).not.toMatch(pattern);
      expect(fieldCode).not.toMatch(pattern);
    }
  });

  it('verifies resolveCutReplacementTile returns canonical ground tiles across maps and environments', () => {
    const dummyIlex = { id: 'ilex_forest', width: 10, height: 10, collisionGrid: [], tileMap: [] };
    const dummyRoute = { id: 'route_34', width: 10, height: 10, collisionGrid: [], tileMap: [] };
    const dummyAzalea = { id: 'azalea_town', width: 10, height: 10, collisionGrid: [], tileMap: [] };
    const dummyOther = { id: 'goldenrod_city', width: 10, height: 10, collisionGrid: [], tileMap: [] };

    expect(FieldObstacleDispatcher.resolveCutReplacementTile(dummyIlex as any, 5, 5)).toBe('in_forest_05_05_05_05');
    expect(FieldObstacleDispatcher.resolveCutReplacementTile(dummyRoute as any, 5, 5)).toBe('kt_0b_0b_0b_0b');
    expect(FieldObstacleDispatcher.resolveCutReplacementTile(dummyAzalea as any, 5, 5)).toBe('jt_m_07_07_07_07_az');
    expect(FieldObstacleDispatcher.resolveCutReplacementTile(dummyOther as any, 5, 5)).toBe('jt_07_07_07_07');
  });

  it('verifies handleFieldAndBgInteraction safely returns false when no obstacle or bgEvent exists at coordinate', () => {
    const dummyMap: MapData = {
      id: 'test_map',
      name: 'Test Map',
      width: 10,
      height: 10,
      tiles: Array.from({ length: 10 }, () => Array(10).fill(0)),
      collision: Array.from({ length: 10 }, () => Array(10).fill(0)),
      warps: [],
      npcs: [],
      bgEvents: [],
    };

    const mockContext = {
      playerName: 'RED',
      playerParty: [],
      inventory: { items: {}, keyItems: [] },
      storyFlags: new Set<string>(),
      player: { x: 5, y: 5, targetX: 5, targetY: 5, renderX: 5, renderY: 5, direction: 'UP', isMoving: false, progress: 0 },
      mapManager: {
        checkBgEvent: () => null,
      } as any,
      overworldItemManager: {
        getItemAt: () => null,
        getHiddenItemAt: () => null,
        checkItemBall: () => null,
        checkHiddenItemInteraction: () => null,
        checkFruitTree: () => null,
        collectItem: () => {},
        isFruitTreePickedToday: () => false,
        pickFruitTree: () => {},
      } as any,
      missionManager: {} as any,
      visitedMaps: new Set<string>(),
      roamingManager: {} as any,
      detectChosenStarterSpecies: () => null,
      openStarterChoiceModal: () => {},
      openDialogue: () => {},
      showToast: () => {},
      openPcStorage: () => {},
      openTownMap: () => {},
      openRuinsPuzzleModal: () => {},
      handleRuinsPuzzleSolve: () => {},
      openMart: () => {},
      healPlayerParty: () => {},
      playHealingAnimation: () => {},
      playFieldRestAnimation: () => {},
      playFlashEffect: () => {},
      playCutSlashEffect: () => {},
      addOverworldItemToInventory: () => {},
      removeItemBall: () => {},
      syncMapOverworldItems: () => {},
      refreshItemfinderRadar: () => {},
      saveCurrentGame: () => {},
      renderMap: () => {},
      setSurfEnabled: () => {},
      triggerBattle: async () => {},
      isItemfinderActive: () => false,
    } as FieldObstacleContext;

    const handled = FieldObstacleDispatcher.handleFieldAndBgInteraction(
      mockContext,
      dummyMap,
      5,
      4
    );

    expect(handled).toBe(false);
  });
});
