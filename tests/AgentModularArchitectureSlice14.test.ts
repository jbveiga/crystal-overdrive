import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('AgentModularArchitectureSlice14: Interface-First Domain Contracts & Micro-Headers', () => {
  const typesDir = path.resolve(__dirname, '../src/types');
  const typeFiles = [
    'game.d.ts',
    'gameContext.d.ts',
    'battleContext.d.ts',
    'map.d.ts',
    'optionsAndSave.d.ts',
    'pokemon.d.ts',
    'worldContext.d.ts',
  ];

  const coreControllers = [
    'src/main.ts',
    'src/battle/BattleSessionController.ts',
    'src/battle/BattleStateMachine.ts',
    'src/world/MapManager.ts',
    'src/world/OverworldWarpAndMapTransitionController.ts',
    'src/world/OverworldTickerCoordinator.ts',
    'src/world/interactions/NpcInteractionRouter.ts',
    'src/render/OverworldRenderer.ts',
    'src/render/BattleRenderer.ts',
    'src/ui/StartMenuUI.ts',
    'src/ui/BattleHUD.ts',
    'src/ui/OverworldHUD.ts',
  ];

  describe('Pillar 1: Interface-First Domain Contracts (src/types/*.d.ts <= 150 Lines)', () => {
    it('verifies that all 7 type contract files exist in src/types/', () => {
      for (const file of typeFiles) {
        const fullPath = path.join(typesDir, file);
        expect(fs.existsSync(fullPath), `Expected ${file} to exist in src/types/`).toBe(true);
      }
    });

    it('asserts that every domain type contract file in src/types/ is strictly <= 150 lines', () => {
      for (const file of typeFiles) {
        const fullPath = path.join(typesDir, file);
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
        expect(lines, `${file} has ${lines} lines, expected <= 150`).toBeLessThanOrEqual(150);
      }
    });

    it('asserts that barrel files game.d.ts and gameContext.d.ts are strictly <= 45 lines', () => {
      const gameLines = fs.readFileSync(path.join(typesDir, 'game.d.ts'), 'utf8').split('\n').length;
      const contextLines = fs.readFileSync(path.join(typesDir, 'gameContext.d.ts'), 'utf8').split('\n').length;

      expect(gameLines, `game.d.ts has ${gameLines} lines, expected <= 45`).toBeLessThanOrEqual(45);
      expect(contextLines, `gameContext.d.ts has ${contextLines} lines, expected <= 45`).toBeLessThanOrEqual(45);
    });

    it('asserts barrel game.d.ts re-exports pokemon, map, and optionsAndSave', () => {
      const content = fs.readFileSync(path.join(typesDir, 'game.d.ts'), 'utf8');
      expect(content).toContain("export * from './pokemon'");
      expect(content).toContain("export * from './map'");
      expect(content).toContain("export * from './optionsAndSave'");
    });

    it('asserts barrel gameContext.d.ts re-exports battleContext and worldContext', () => {
      const content = fs.readFileSync(path.join(typesDir, 'gameContext.d.ts'), 'utf8');
      expect(content).toContain("export * from './battleContext'");
      expect(content).toContain("export * from './worldContext'");
    });
  });

  describe('Pillar 2: Standardized @fileoverview Micro-Headers on 12 Core Controllers', () => {
    it('asserts that each of the 12 core controllers has @fileoverview, @module, @role, @exports, and @layer in lines 1-15', () => {
      for (const relativePath of coreControllers) {
        const fullPath = path.resolve(__dirname, '..', relativePath);
        expect(fs.existsSync(fullPath), `Expected ${relativePath} to exist`).toBe(true);

        const content = fs.readFileSync(fullPath, 'utf8');
        const first15Lines = content.split('\n').slice(0, 15).join('\n');

        expect(first15Lines, `${relativePath} missing @fileoverview in first 15 lines`).toContain('@fileoverview');
        expect(first15Lines, `${relativePath} missing @module in first 15 lines`).toContain('@module');
        expect(first15Lines, `${relativePath} missing @role in first 15 lines`).toContain('@role');
        expect(first15Lines, `${relativePath} missing @exports in first 15 lines`).toContain('@exports');
        expect(first15Lines, `${relativePath} missing @layer in first 15 lines`).toContain('@layer');
      }
    });

    it('asserts that all 12 core controllers remain strictly <= 750 lines after micro-header injection', () => {
      for (const relativePath of coreControllers) {
        const fullPath = path.resolve(__dirname, '..', relativePath);
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
        expect(lines, `${relativePath} has ${lines} lines, must be <= 750`).toBeLessThanOrEqual(750);
      }
    });
  });

  describe('Pillar 3: Maximum Line Count Invariant Across All TypeScript Files', () => {
    it('asserts that no TypeScript file in src/ exceeds 750 lines', () => {
      const srcDir = path.resolve(__dirname, '../src');

      function getAllTsFiles(dir: string): string[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files: string[] = [];
        for (const entry of entries) {
          const res = path.resolve(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...getAllTsFiles(res));
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
            files.push(res);
          }
        }
        return files;
      }

      const allTsFiles = getAllTsFiles(srcDir);
      expect(allTsFiles.length).toBeGreaterThan(100);

      for (const file of allTsFiles) {
        const lineCount = fs.readFileSync(file, 'utf8').split('\n').length;
        const relPath = path.relative(path.resolve(__dirname, '..'), file);
        expect(lineCount, `${relPath} has ${lineCount} lines, must be <= 750`).toBeLessThanOrEqual(750);
      }
    });
  });
});
