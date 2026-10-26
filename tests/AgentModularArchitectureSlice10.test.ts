import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock minimal browser globals for DOM tests
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'node', maxTouchPoints: 0 },
  configurable: true,
  writable: true,
});
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
    }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    getElementById: () => null,
  };
}

import { CANONICAL_MISSIONS, createDefaultMissions } from '../src/world/missionData';
import { EARLY_JOHTO_MISSIONS } from '../src/world/missions/earlyJohtoMissions';
import { MID_TO_LATE_JOHTO_MISSIONS } from '../src/world/missions/midToLateJohtoMissions';

import { IntroSequenceUI, BOY_NAME_PRESETS, GIRL_NAME_PRESETS } from '../src/ui/IntroSequenceUI';
import {
  injectIntroStyles,
  renderSpotlightDais,
  renderGenderSelectStage,
  renderNameInputStage,
  renderClockSetupStage,
  renderShrinkWarpStage,
} from '../src/ui/intro/IntroStageRenderersAndStyles';

import { MapManager } from '../src/world/MapManager';
import {
  isOutdoorMap,
  isCaveMap,
  isDungeonOrCaveMap,
  canTriggerWildEncounter,
  getRequiredWarpDirection,
  isCarpetWarp,
  resolveWarpTransition,
} from '../src/world/map/MapClassificationAndWarpRules';
import type { MapData, WarpEvent } from '../src/types/game';

describe('TICKET-REFACTOR-AGENT-OPT-SLICE-10: Agent-Optimized World & Story Decomposition', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('Pillar 1: Single-Window File Ceiling (< 800 Lines / Facades < 750 Lines)', () => {
    it('asserts missionData.ts is strictly < 750 lines (barrel export)', () => {
      const filePath = path.join(rootDir, 'src/world/missionData.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts earlyJohtoMissions.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/world/missions/earlyJohtoMissions.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });

    it('asserts midToLateJohtoMissions.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/world/missions/midToLateJohtoMissions.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });

    it('asserts IntroSequenceUI.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/IntroSequenceUI.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts IntroStageRenderersAndStyles.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/ui/intro/IntroStageRenderersAndStyles.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });

    it('asserts MapManager.ts is strictly < 750 lines', () => {
      const filePath = path.join(rootDir, 'src/world/MapManager.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(750);
    });

    it('asserts MapClassificationAndWarpRules.ts is strictly < 800 lines', () => {
      const filePath = path.join(rootDir, 'src/world/map/MapClassificationAndWarpRules.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(800);
    });
  });

  describe('Pillar 2: Facade Method & Type Preservation', () => {
    it('preserves 100% of mission definitions and lookup contracts in missionData.ts', () => {
      expect(CANONICAL_MISSIONS.length).toBe(36);
      const defaults = createDefaultMissions();
      expect(defaults.length).toBe(36);

      const m01 = defaults.find((m) => m.id === 'M01');
      expect(m01).toBeDefined();
      expect(m01?.id).toBe('M01');
      expect(m01?.title).toContain('A New Beginning');

      const m15 = defaults.find((m) => m.id === 'M15');
      expect(m15).toBeDefined();
      expect(m15?.id).toBe('M15');
      expect(m15?.title).toContain('Peak of Legends');

      const s01 = defaults.find((m) => m.id === 'S01');
      expect(s01).toBeDefined();
      expect(s01?.id).toBe('S01');
    });

    it('preserves 100% of public methods, presets, and constants on IntroSequenceUI', () => {
      expect(IntroSequenceUI.MAX_NAME_LENGTH).toBe(15);
      expect(BOY_NAME_PRESETS).toContain('GOLD');
      expect(GIRL_NAME_PRESETS).toContain('KRIS');

      const ui = new IntroSequenceUI({ onComplete: () => {} });
      expect(typeof ui.isActive).toBe('function');
      expect(typeof ui.getStage).toBe('function');
      expect(typeof ui.getValidatedName).toBe('function');
      expect(typeof ui.getSelectedGender).toBe('function');
      expect(typeof ui.getClockStatus).toBe('function');
      expect(typeof ui.start).toBe('function');
      expect(typeof ui.destroy).toBe('function');
      expect(typeof ui.advance).toBe('function');
      expect(typeof ui.selectGender).toBe('function');
      expect(typeof ui.selectPresetName).toBe('function');
      expect(typeof ui.appendNameChar).toBe('function');
      expect(typeof ui.backspaceName).toBe('function');

      expect(ui.isActive()).toBe(false);
      expect(ui.getStage()).toBe('WELCOME');
      expect(ui.getValidatedName()).toBe('GOLD');
      expect(ui.getSelectedGender()).toBe('BOY');
    });

    it('preserves 100% of static and instance classification and warp methods on MapManager', () => {
      expect(typeof MapManager.isOutdoorMap).toBe('function');
      expect(typeof MapManager.isCaveMap).toBe('function');
      expect(typeof MapManager.isDungeonOrCaveMap).toBe('function');
      expect(typeof MapManager.canTriggerWildEncounter).toBe('function');
      expect(typeof MapManager.getRequiredWarpDirection).toBe('function');
      expect(typeof MapManager.isCarpetWarp).toBe('function');
      expect(typeof MapManager.resolveWarpTransition).toBe('function');

      const manager = new MapManager();
      expect(typeof manager.isCurrentMapOutdoor).toBe('function');
      expect(typeof manager.resolveWarpTransition).toBe('function');
      expect(typeof manager.getCurrentMap).toBe('function');
      expect(typeof manager.setCurrentMap).toBe('function');
      expect(typeof manager.ensureMapLoaded).toBe('function');
      expect(typeof manager.registerMap).toBe('function');
      expect(typeof manager.touchMap).toBe('function');
      expect(typeof manager.evictDistantMaps).toBe('function');
      expect(typeof manager.isWalkable).toBe('function');
      expect(typeof manager.getTileType).toBe('function');
      expect(typeof manager.checkWarp).toBe('function');
      expect(typeof manager.checkBgEvent).toBe('function');
    });
  });

  describe('Pillar 3: Extracted Sub-module Functions and Contracts', () => {
    it('earlyJohtoMissions and midToLateJohtoMissions export complete mission partitions', () => {
      expect(EARLY_JOHTO_MISSIONS.length).toBe(10);
      expect(EARLY_JOHTO_MISSIONS[0].id).toBe('M01');
      expect(EARLY_JOHTO_MISSIONS[9].id).toBe('M10');

      expect(MID_TO_LATE_JOHTO_MISSIONS.length).toBe(26);
      expect(MID_TO_LATE_JOHTO_MISSIONS[0].id).toBe('M11');
      expect(MID_TO_LATE_JOHTO_MISSIONS[4].id).toBe('M15');
      expect(MID_TO_LATE_JOHTO_MISSIONS[5].id).toBe('S01');
      expect(MID_TO_LATE_JOHTO_MISSIONS[25].id).toBe('S21');
    });

    it('IntroStageRenderersAndStyles renders authentic spotlight markup', () => {
      expect(typeof injectIntroStyles).toBe('function');

      const daisWithoutPokemon = renderSpotlightDais(false);
      expect(daisWithoutPokemon).toContain('prof_elm.png');
      expect(daisWithoutPokemon).not.toContain('marill_front.png');

      const daisWithPokemon = renderSpotlightDais(true);
      expect(daisWithPokemon).toContain('prof_elm.png');
      expect(daisWithPokemon).toContain('marill_front.png');
      expect(daisWithPokemon).toContain('✨ MARILL!');
    });

    it('MapClassificationAndWarpRules correctly classifies maps and calculates warp transitions', () => {
      expect(isOutdoorMap('new_bark_town')).toBe(true);
      expect(isOutdoorMap('route_29')).toBe(true);
      expect(isOutdoorMap('elm_lab')).toBe(false);

      expect(isCaveMap('union_cave_1f')).toBe(true);
      expect(isCaveMap('silver_cave_room_1')).toBe(true);
      expect(isCaveMap('violet_city')).toBe(false);

      expect(isDungeonOrCaveMap('sprout_tower_1f')).toBe(true);
      expect(isDungeonOrCaveMap('ilex_forest')).toBe(true);
      expect(isDungeonOrCaveMap('new_bark_town')).toBe(false);

      expect(canTriggerWildEncounter('route_29', 2)).toBe(true); // tall grass
      expect(canTriggerWildEncounter('route_29', 3)).toBe(true); // surfing water
      expect(canTriggerWildEncounter('route_29', 0)).toBe(false); // regular floor on route
      expect(canTriggerWildEncounter('union_cave_1f', 0)).toBe(true); // cave floor

      const mockIndoorMap: MapData = {
        id: 'elm_lab',
        name: "Elm's Lab",
        width: 10,
        height: 10,
        collisionGrid: new Uint8Array(100),
        warps: [{ x: 4, y: 9, targetMapId: 'new_bark_town', targetX: 13, targetY: 10 }],
        npcs: [],
        connections: {},
      };

      const warp: WarpEvent = {
        x: 4,
        y: 9,
        targetMapId: 'new_bark_town',
        targetX: 13,
        targetY: 10,
      };

      expect(isCarpetWarp(warp, mockIndoorMap)).toBe(true);
      expect(getRequiredWarpDirection(warp, mockIndoorMap)).toBe('DOWN');

      const transition = resolveWarpTransition(warp, mockIndoorMap);
      expect(transition.isExitingToOverworld).toBe(true);
      expect(transition.soundCue).toBe('DOOR_EXIT');
      expect(transition.landingFacing).toBe('DOWN');
      expect(transition.landingY).toBe(11); // 1 tile below doorway
    });
  });
});
