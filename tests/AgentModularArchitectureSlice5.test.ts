import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { OverworldWarpAndMapTransitionController } from '../src/world/OverworldWarpAndMapTransitionController';
import { OverworldTrainerSightAndTourController } from '../src/world/OverworldTrainerSightAndTourController';
import { OverworldTickerCoordinator } from '../src/world/OverworldTickerCoordinator';
import { OverworldModalRegistry } from '../src/ui/OverworldModalRegistry';
import { SaveManager } from '../src/core/SaveManager';
import { resetStoryNpcSpawns, detectChosenStarterSpecies } from '../src/world/npcData';

describe('AgentModularArchitectureSlice5 — main.ts Extraction & Overworld Controllers', () => {
  const rootDir = path.resolve(__dirname, '..');
  const mainPath = path.join(rootDir, 'src/main.ts');
  const transitionControllerPath = path.join(rootDir, 'src/world/OverworldWarpAndMapTransitionController.ts');
  const sightControllerPath = path.join(rootDir, 'src/world/OverworldTrainerSightAndTourController.ts');
  const tickerCoordinatorPath = path.join(rootDir, 'src/world/OverworldTickerCoordinator.ts');
  const modalRegistryPath = path.join(rootDir, 'src/ui/OverworldModalRegistry.ts');
  const saveManagerPath = path.join(rootDir, 'src/core/SaveManager.ts');
  const gameContextTypesPath = path.join(rootDir, 'src/types/gameContext.d.ts');
  const npcDataPath = path.join(rootDir, 'src/world/npcData.ts');

  it('Pillar 6 / Section 1.6: verifies src/main.ts is strictly < 750 lines (Single-Window Ceiling)', () => {
    expect(fs.existsSync(mainPath), 'src/main.ts must exist').toBe(true);
    const mainLines = fs.readFileSync(mainPath, 'utf-8').split('\n').length;
    expect(
      mainLines,
      `src/main.ts has ${mainLines} lines, must stay strictly < 750 lines`
    ).toBeLessThan(750);
  });

  it('Pillar 6 / Section 1.6: verifies all extracted modules strictly respect the < 800 line single-window ceiling', () => {
    const modulesToCheck = [
      { path: transitionControllerPath, name: 'OverworldWarpAndMapTransitionController.ts' },
      { path: sightControllerPath, name: 'OverworldTrainerSightAndTourController.ts' },
      { path: tickerCoordinatorPath, name: 'OverworldTickerCoordinator.ts' },
      { path: modalRegistryPath, name: 'OverworldModalRegistry.ts' },
      { path: saveManagerPath, name: 'SaveManager.ts' },
      { path: gameContextTypesPath, name: 'gameContext.d.ts' },
      { path: npcDataPath, name: 'npcData.ts' },
    ];

    for (const mod of modulesToCheck) {
      expect(fs.existsSync(mod.path), `${mod.name} must exist on disk`).toBe(true);
      const lineCount = fs.readFileSync(mod.path, 'utf-8').split('\n').length;
      expect(
        lineCount,
        `${mod.name} has ${lineCount} lines, must stay strictly < 800 lines`
      ).toBeLessThan(800);
    }
  });

  it('Pillar 1: verifies zero PixiJS imports in pure world controllers', () => {
    const forbiddenPatterns = [
      /from\s+['"]pixi\.js['"]/,
      /from\s+['"]@pixi\//,
    ];

    const worldControllers = [
      transitionControllerPath,
      sightControllerPath,
      tickerCoordinatorPath,
    ];

    for (const filePath of worldControllers) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        expect(
          pattern.test(content),
          `File ${path.basename(filePath)} violates layer purity: contains PixiJS imports matching ${pattern}`
        ).toBe(false);
      }
    }
  });

  it('Pillar 7: verifies zero per-frame scratch allocation in OverworldTickerCoordinator', () => {
    const content = fs.readFileSync(tickerCoordinatorPath, 'utf-8');
    expect(content).toContain('npcObstaclesScratch');
    expect(content).toContain('emptyNpcs');
    expect(content).toContain('directions');
  });

  it('Pillar 5: verifies SaveManager hydration and save snapshot round-trip', () => {
    const fresh = SaveManager.createFreshSaveData('GOLD', 'BOY');
    expect(fresh.player.name).toBe('GOLD');
    expect(fresh.player.gender).toBe('BOY');
    expect(fresh.player.money).toBe(3000);

    const playTimeBox = { val: 0 };
    const playerNameBox = { val: 'TEMP' };
    const playerGenderBox = { val: 'GIRL' as const };
    const rivalNameBox = { val: 'RIVAL' };
    const playerParty: any[] = [];
    const playerBox: any[] = [];
    const gameOptions: any = {};
    const inventory: any = { balls: {}, items: {}, berries: {}, tms: [], money: 0, badges: [] };
    const defeatedTrainers = new Set<string>();
    const storyFlags = new Set<string>();
    const seenSpecies = new Set<string>();
    const overworldItemManager: any = {
      setCollectedFlags: () => {},
      setFruitTreePicks: () => {},
    };
    const missionManager: any = {
      deserialize: () => {},
      reconcileStarterState: () => {},
    };
    const gameClock: any = { playerSpeed: 1, battleSpeed: 1 };
    const roamingManager: any = {
      awakenBeasts: () => {},
      sleepBeasts: () => {},
    };

    const loc = SaveManager.hydrateGameState(fresh, {
      playTimeSeconds: playTimeBox,
      playerName: playerNameBox,
      playerGender: playerGenderBox,
      rivalName: rivalNameBox,
      playerParty,
      playerBox,
      gameOptions,
      inventory,
      defeatedTrainers,
      storyFlags,
      seenSpecies,
      overworldItemManager,
      missionManager,
      gameClock,
      roamingManager,
    });

    expect(playerNameBox.val).toBe('GOLD');
    expect(playerGenderBox.val).toBe('BOY');
    expect(loc.mapId).toBe('players_house_2f');
    expect(loc.x).toBe(7);
    expect(loc.y).toBe(1);
    expect(loc.direction).toBe('DOWN');
  });

  it('Pillar 3: validates OverworldTrainerSightAndTourController helpers and starter detection', () => {
    expect(OverworldTrainerSightAndTourController.getOppositeDirection('UP')).toBe('DOWN');
    expect(OverworldTrainerSightAndTourController.getOppositeDirection('DOWN')).toBe('UP');
    expect(OverworldTrainerSightAndTourController.getOppositeDirection('LEFT')).toBe('RIGHT');
    expect(OverworldTrainerSightAndTourController.getOppositeDirection('RIGHT')).toBe('LEFT');

    const flags1 = new Set<string>(['starter_cyndaquil']);
    expect(OverworldTrainerSightAndTourController.detectChosenStarterSpecies(flags1, [], [], new Set())).toBe('cyndaquil');

    const flags2 = new Set<string>(['starter_totodile']);
    expect(OverworldTrainerSightAndTourController.detectChosenStarterSpecies(flags2, [], [], new Set())).toBe('totodile');

    const flags3 = new Set<string>(['starter_chikorita']);
    expect(OverworldTrainerSightAndTourController.detectChosenStarterSpecies(flags3, [], [], new Set())).toBe('chikorita');
  });

  it('Pillar 3: validates resetStoryNpcSpawns repopulates canonical story map NPC lists', () => {
    const npcsByMap: Record<string, any[]> = {
      new_bark_town: [],
      cherrygrove_city: [],
      route_36: [],
      elms_lab: [],
      azalea_town: [],
      slowpoke_well_b1f: [],
      union_cave_b2f: [],
      mr_pokemons_house: [],
    };

    resetStoryNpcSpawns(npcsByMap);
    expect(npcsByMap.new_bark_town.length).toBeGreaterThan(0);
    expect(npcsByMap.cherrygrove_city.length).toBeGreaterThan(0);
    expect(npcsByMap.elms_lab.length).toBeGreaterThan(0);
  });
});
