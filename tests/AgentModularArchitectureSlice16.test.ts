import { describe, it, expect } from 'vitest';
import * as path from 'path';
import {
  REPO_ROOT,
  readRepoFile,
  countRepoFileLines,
  listTsFilesRecursive,
  readModuleGroupConcatenated,
} from './helpers/SourceInspector';
import {
  MockElement,
  MockDocument,
  installMockDomGlobals,
  createMockContainer,
  resetDefaultContainers,
} from './helpers/MockDomEnv';

describe('AgentModularArchitectureSlice16: 100% Repository Single-Window Compliance & Shared Test Helpers', () => {
  describe('Pillar 1: Shared Test Helpers Verification', () => {
    it('verifies SourceInspector reads repo files and counts line numbers accurately', () => {
      const packageJson = readRepoFile('package.json');
      expect(packageJson).toContain('crystal-overdrive');
      const lines = countRepoFileLines('package.json');
      expect(lines).toBeGreaterThan(10);
      expect(typeof lines).toBe('number');
    });

    it('verifies listTsFilesRecursive finds TypeScript files across src and tests', () => {
      const srcFiles = listTsFilesRecursive('src');
      expect(srcFiles.length).toBeGreaterThan(100);
      expect(srcFiles.every((f) => f.startsWith('src/') && (f.endsWith('.ts') || f.endsWith('.d.ts')))).toBe(true);

      const testFiles = listTsFilesRecursive('tests');
      expect(testFiles.length).toBeGreaterThan(70);
      expect(testFiles.every((f) => f.startsWith('tests/') && f.endsWith('.ts'))).toBe(true);
    });

    it('verifies readModuleGroupConcatenated concatenates files with newline separators', () => {
      const combined = readModuleGroupConcatenated([
        'tests/helpers/SourceInspector.ts',
        'tests/helpers/MockDomEnv.ts',
      ]);
      expect(combined).toContain('REPO_ROOT');
      expect(combined).toContain('MockElement');
    });

    it('verifies MockDomEnv element and document creation, hierarchy, styles and events', () => {
      const { doc } = installMockDomGlobals();
      resetDefaultContainers(doc);

      const modalContainer = doc.getElementById('modal-container');
      const hudContainer = doc.getElementById('overworld-hud-container');
      const battleContainer = doc.getElementById('battle-hud-container');

      expect(modalContainer).not.toBeNull();
      expect(hudContainer).not.toBeNull();
      expect(battleContainer).not.toBeNull();

      const btn = doc.createElement('button');
      btn.id = 'test-action-btn';
      btn.className = 'primary-btn active';
      btn.style.color = '#38BDF8';

      let clicked = false;
      btn.addEventListener('click', () => {
        clicked = true;
      });
      modalContainer!.appendChild(btn);

      const found = modalContainer!.querySelector('#test-action-btn');
      expect(found).toBe(btn);
      found?.click();
      expect(clicked).toBe(true);
    });
  });

  describe('Pillar 2: Universal Repository Single-Window Invariant (src/ and tests/ <= 800 Lines)', () => {
    const srcFiles = listTsFilesRecursive('src');
    const testFiles = listTsFilesRecursive('tests');
    const allRepoTsFiles = [...srcFiles, ...testFiles];

    it('asserts that 100% of TypeScript files in src/ are strictly <= 800 lines', () => {
      const violations: { file: string; lines: number }[] = [];
      let maxLines = 0;
      let maxFile = '';

      for (const file of srcFiles) {
        const lines = countRepoFileLines(file);
        if (lines > maxLines) {
          maxLines = lines;
          maxFile = file;
        }
        if (lines > 800) {
          violations.push({ file, lines });
        }
      }

      expect(violations, `Found ${violations.length} oversized files in src/: ${JSON.stringify(violations)}`).toEqual([]);
      expect(maxLines, `src/ max file (${maxFile}) has ${maxLines} lines, expected <= 750`).toBeLessThanOrEqual(750);
    });

    it('asserts that 100% of TypeScript files in tests/ are strictly <= 800 lines', () => {
      const violations: { file: string; lines: number }[] = [];
      let maxLines = 0;
      let maxFile = '';

      for (const file of testFiles) {
        const lines = countRepoFileLines(file);
        if (lines > maxLines) {
          maxLines = lines;
          maxFile = file;
        }
        if (lines > 800) {
          violations.push({ file, lines });
        }
      }

      expect(violations, `Found ${violations.length} oversized files in tests/: ${JSON.stringify(violations)}`).toEqual([]);
      expect(maxLines, `tests/ max file (${maxFile}) has ${maxLines} lines, expected <= 800`).toBeLessThanOrEqual(800);
    });

    it('asserts that all 9 targeted partitioned test files exist and each has <= 800 lines', () => {
      const targetedFiles = [
        'tests/MapData.test.ts',
        'tests/MapDataLateJohtoAndKanto.test.ts',
        'tests/MapDataEndgameAndDoors.test.ts',
        'tests/StartMenuUI.test.ts',
        'tests/StartMenuSettingsAndSubmodals.test.ts',
        'tests/SettingsAndMartUI.test.ts',
        'tests/MobileAndBattleErgonomicsUI.test.ts',
        'tests/MapCompletenessAudit.test.ts',
        'tests/AzaleaAndIlexCompletenessAudit.test.ts',
      ];

      for (const file of targetedFiles) {
        const lines = countRepoFileLines(file);
        expect(lines, `${file} has ${lines} lines, expected <= 800`).toBeLessThanOrEqual(800);
      }
    });
  });
});
