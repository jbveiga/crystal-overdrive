import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Setup minimal globals before dynamic imports
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
      style: {},
      setAttribute: () => {},
      removeAttribute: () => {},
    }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    getElementById: () => null,
  };
}

import { AudioManager, MAP_BGM_TABLE, BATTLE_BGM_TABLE } from '../src/audio/AudioManager';
import {
  MAP_BGM_TABLE as EXTRACTED_MAP_BGM_TABLE,
  BATTLE_BGM_TABLE as EXTRACTED_BATTLE_BGM_TABLE,
} from '../src/audio/mapBgmTable';

describe('TICKET-REFACTOR-AGENT-OPT-SLICE-12: 100% Repo-Wide < 800L Compliance & Slice 12 Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  let BattleRenderer: any;
  let animsModule: any;

  beforeAll(async () => {
    const battleMod = await import('../src/render/BattleRenderer');
    BattleRenderer = battleMod.BattleRenderer;
    animsModule = await import('../src/render/BattlePokeballAndSwitchAnimations');
  });

  describe('Pillar 1: Single-Window File Ceiling (< 800 Lines)', () => {
    it('asserts AudioManager.ts is strictly < 550 lines', () => {
      const filePath = path.join(rootDir, 'src/audio/AudioManager.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(550);
    });

    it('asserts mapBgmTable.ts is strictly < 450 lines', () => {
      const filePath = path.join(rootDir, 'src/audio/mapBgmTable.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(450);
    });

    it('asserts BattleRenderer.ts is strictly < 600 lines', () => {
      const filePath = path.join(rootDir, 'src/render/BattleRenderer.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(600);
    });

    it('asserts BattlePokeballAndSwitchAnimations.ts is strictly < 450 lines', () => {
      const filePath = path.join(rootDir, 'src/render/BattlePokeballAndSwitchAnimations.ts');
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
      expect(lines).toBeLessThan(450);
    });

    it('asserts 100% of all TypeScript files in src/ are strictly <= 800 lines with zero exceptions', () => {
      function getTsFilesRecursively(dir: string): string[] {
        let results: string[] = [];
        if (!fs.existsSync(dir)) return results;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(getTsFilesRecursively(full));
          } else if (entry.name.endsWith('.ts')) {
            results.push(full);
          }
        }
        return results;
      }

      const allTsFiles = getTsFilesRecursively(path.join(rootDir, 'src'));
      expect(allTsFiles.length).toBeGreaterThan(115);

      const violations: { file: string; lines: number }[] = [];
      for (const file of allTsFiles) {
        const lineCount = fs.readFileSync(file, 'utf-8').split('\n').length;
        if (lineCount > 800) {
          violations.push({ file: path.relative(rootDir, file), lines: lineCount });
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('Pillar 2: Audio Table Extraction & Backward Compatibility', () => {
    it('asserts AudioManager re-exports identical MAP_BGM_TABLE and BATTLE_BGM_TABLE instances', () => {
      expect(MAP_BGM_TABLE).toBe(EXTRACTED_MAP_BGM_TABLE);
      expect(BATTLE_BGM_TABLE).toBe(EXTRACTED_BATTLE_BGM_TABLE);
    });

    it('resolves authentic Johto and Kanto BGM tracks across key locations', () => {
      expect(MAP_BGM_TABLE['new_bark_town']).toBe('bgm_new_bark_town');
      expect(MAP_BGM_TABLE['route_29']).toBe('bgm_route_29');
      expect(MAP_BGM_TABLE['sprout_tower_1f']).toBe('bgm_sprout_tower');
      expect(MAP_BGM_TABLE['goldenrod_game_corner']).toBe('bgm_game_corner');
      expect(MAP_BGM_TABLE['lances_room']).toBe('bgm_gym');
      expect(MAP_BGM_TABLE['celadon_city']).toBe('bgm_goldenrod_city');
    });

    it('resolves battle BGM tracks across wild, trainer, and gym leader categories', () => {
      expect(BATTLE_BGM_TABLE.wild).toBe('bgm_wild_battle');
      expect(BATTLE_BGM_TABLE.trainer).toBe('bgm_trainer_battle');
      expect(BATTLE_BGM_TABLE.gym_leader).toBe('bgm_gym_leader_battle');
    });

    it('asserts AudioManager getTrackForMap matches table mapping with default fallback', () => {
      const audioMgr = new AudioManager();
      expect(audioMgr.getTrackForMap('new_bark_town')).toBe('bgm_new_bark_town');
      expect(audioMgr.getTrackForMap('route_29')).toBe('bgm_route_29');
      expect(audioMgr.getTrackForMap('sprout_tower_2f')).toBe('bgm_sprout_tower');
      expect(audioMgr.getTrackForMap('unknown_fantasy_zone')).toBe('bgm_new_bark_town'); // fallback
    });
  });

  describe('Pillar 3: Battle Animation Delegation & Interface Parity', () => {
    it('asserts BattleRenderer defines all animation delegation methods on its prototype', () => {
      expect(typeof BattleRenderer.prototype.animateSendOutNextPokemon).toBe('function');
      expect(typeof BattleRenderer.prototype.animateSwitchPlayerPokemon).toBe('function');
      expect(typeof BattleRenderer.prototype.animateFaint).toBe('function');
      expect(typeof BattleRenderer.prototype.animateThrowBall).toBe('function');
      expect(typeof BattleRenderer.prototype.animateShake).toBe('function');
    });

    it('asserts BattlePokeballAndSwitchAnimations exports standalone animation functions', () => {
      expect(typeof animsModule.animateSendOutNextPokemon).toBe('function');
      expect(typeof animsModule.animateSwitchPlayerPokemon).toBe('function');
      expect(typeof animsModule.animateFaint).toBe('function');
      expect(typeof animsModule.animateThrowBall).toBe('function');
      expect(typeof animsModule.animateShake).toBe('function');
    });
  });

  describe('Pillar 4: Periodic Health Review 800-Line Gate Invariant', () => {
    it('asserts scripts/project-optimization-review.cjs contains the single-window file ceiling hard gate', () => {
      const reviewScript = fs.readFileSync(
        path.join(rootDir, 'scripts/project-optimization-review.cjs'),
        'utf-8'
      );
      expect(reviewScript).toContain('Single-Window File Ceiling (< 800 Lines)');
      expect(reviewScript).toContain('lineCount > 800');
      expect(reviewScript).toContain('fileCeilingViolations');
    });
  });
});
