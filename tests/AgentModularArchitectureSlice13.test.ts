import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import {
  JOHTO_LANDMARKS,
  JOHTO_CONNECTIONS,
  resolveCurrentLandmark,
  computeLandmarkDistance,
  findHabitatsForSpecies,
} from '../src/world/townMapData';
import {
  resolveCurrentLandmark as extractedResolveLandmark,
  computeLandmarkDistance as extractedComputeDistance,
  findHabitatsForSpecies as extractedFindHabitats,
} from '../src/world/map/townMapResolvers';

import {
  createOlivineToIndigoNpcs,
  createMahoganyToIndigoNpcs,
} from '../src/world/npcs/olivineToIndigoNpcs';
import { createMahoganyToIndigoNpcs as extractedMahoganyNpcs } from '../src/world/npcs/mahoganyToIndigoNpcs';

import {
  getGymLeaderInteractions,
  getKantoAndLeagueInteractions,
} from '../src/world/interactions/GymLeaderInteractions';
import { getKantoAndLeagueInteractions as extractedKantoInteractions } from '../src/world/interactions/KantoAndLeagueInteractions';

import {
  MID_TO_LATE_JOHTO_MISSIONS,
  LATE_JOHTO_AND_LEAGUE_MISSIONS,
} from '../src/world/missions/midToLateJohtoMissions';
import { LATE_JOHTO_AND_LEAGUE_MISSIONS as EXTRACTED_LATE_MISSIONS } from '../src/world/missions/lateJohtoAndLeagueMissions';

describe('TICKET-REFACTOR-AGENT-OPT-SLICE-13: Advanced Token Ergonomics (Top World Modules Split)', () => {
  const rootDir = path.resolve(__dirname, '..');

  const slice13Files = [
    { relPath: 'src/world/townMapData.ts', maxLines: 500 },
    { relPath: 'src/world/map/townMapResolvers.ts', maxLines: 450 },
    { relPath: 'src/world/npcs/olivineToIndigoNpcs.ts', maxLines: 450 },
    { relPath: 'src/world/npcs/mahoganyToIndigoNpcs.ts', maxLines: 450 },
    { relPath: 'src/world/interactions/GymLeaderInteractions.ts', maxLines: 480 },
    { relPath: 'src/world/interactions/KantoAndLeagueInteractions.ts', maxLines: 450 },
    { relPath: 'src/world/missions/midToLateJohtoMissions.ts', maxLines: 450 },
    { relPath: 'src/world/missions/lateJohtoAndLeagueMissions.ts', maxLines: 450 },
  ];

  describe('Pillar 1: Single-Window Sweet-Spot File Ceilings (< 480 Lines Target)', () => {
    slice13Files.forEach(({ relPath, maxLines }) => {
      it(`asserts ${relPath} is strictly <= ${maxLines} lines`, () => {
        const fullPath = path.join(rootDir, relPath);
        expect(fs.existsSync(fullPath), `File ${relPath} must exist`).toBe(true);
        const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
        expect(lines).toBeLessThanOrEqual(maxLines);
      });
    });

    it('asserts maximum line count across all 124 TypeScript files in src/ is <= 750 lines', () => {
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
      expect(allTsFiles.length).toBeGreaterThanOrEqual(124);

      let maxLineCount = 0;
      let maxFilePath = '';
      for (const file of allTsFiles) {
        const count = fs.readFileSync(file, 'utf-8').split('\n').length;
        if (count > maxLineCount) {
          maxLineCount = count;
          maxFilePath = file;
        }
      }

      expect(maxLineCount).toBeLessThanOrEqual(750);
    });
  });

  describe('Pillar 2: Pure TypeScript Layer Boundaries', () => {
    it('verifies zero DOM and zero PixiJS imports across all 8 target modules', () => {
      const forbiddenPatterns = [
        /from ['"]pixi\.js['"]/,
        /from ['"]@pixi\//,
        /\bdocument\./,
        /\bwindow\./,
        /\bHTMLElement\b/,
        /\bHTMLDivElement\b/,
      ];

      for (const { relPath } of slice13Files) {
        const content = fs.readFileSync(path.join(rootDir, relPath), 'utf-8');
        for (const pattern of forbiddenPatterns) {
          expect(pattern.test(content), `${relPath} must not contain ${pattern}`).toBe(false);
        }
      }
    });
  });

  describe('Pillar 3: Data Parity & Re-Export Preservation', () => {
    it('preserves 100% of town map landmark and resolver functions', () => {
      expect(resolveCurrentLandmark).toBe(extractedResolveLandmark);
      expect(computeLandmarkDistance).toBe(extractedComputeDistance);
      expect(findHabitatsForSpecies).toBe(extractedFindHabitats);

      expect(resolveCurrentLandmark('new_bark_town')?.name).toBe('New Bark Town');
      expect(resolveCurrentLandmark('players_house_1f')?.id).toBe('new_bark_town');
      expect(resolveCurrentLandmark('elms_lab')?.id).toBe('new_bark_town');
      expect(computeLandmarkDistance('new_bark_town', 'cherrygrove_city')).toBe(2);
      expect(findHabitatsForSpecies('raikou').length).toBeGreaterThan(0);
    });

    it('preserves 100% of NPC dataset across Olivine, Cianwood, Mahogany, and Indigo Plateau', () => {
      expect(createMahoganyToIndigoNpcs).toBe(extractedMahoganyNpcs);

      const allNpcs = createOlivineToIndigoNpcs();
      const mahoganyNpcs = createMahoganyToIndigoNpcs();

      // Verify Olivine & Cianwood maps exist
      expect(allNpcs['olivine_city']).toBeDefined();
      expect(allNpcs['cianwood_gym']).toBeDefined();

      // Verify Mahogany to Indigo maps exist in combined set
      expect(allNpcs['lake_of_rage']).toBeDefined();
      expect(allNpcs['mahogany_town']).toBeDefined();
      expect(allNpcs['dragon_shrine']).toBeDefined();
      expect(allNpcs['lances_room']).toBeDefined();

      // Verify mahogany module directly contains the partitioned maps
      expect(mahoganyNpcs['lake_of_rage']).toEqual(allNpcs['lake_of_rage']);
      expect(mahoganyNpcs['lances_room']).toEqual(allNpcs['lances_room']);
    });

    it('preserves 100% of Gym Leader and Kanto/League interaction handlers', () => {
      expect(getKantoAndLeagueInteractions).toBe(extractedKantoInteractions);

      const allInteractions = getGymLeaderInteractions();
      const kantoInteractions = getKantoAndLeagueInteractions();

      const registeredActions = new Set<string>();
      allInteractions.forEach((reg) => {
        reg.actions?.forEach((act) => registeredActions.add(act));
      });

      // Assert Johto leaders
      expect(registeredActions.has('FALKNER_EVENT')).toBe(true);
      expect(registeredActions.has('BUGSY_EVENT')).toBe(true);
      expect(registeredActions.has('WHITNEY_EVENT')).toBe(true);
      expect(registeredActions.has('MORTY_EVENT')).toBe(true);
      expect(registeredActions.has('CHUCK_EVENT')).toBe(true);
      expect(registeredActions.has('JASMINE_EVENT')).toBe(true);
      expect(registeredActions.has('PRYCE_EVENT')).toBe(true);
      expect(registeredActions.has('CLAIR_EVENT')).toBe(true);

      // Assert Kanto & League
      expect(registeredActions.has('BROCK_EVENT')).toBe(true);
      expect(registeredActions.has('BLUE_EVENT')).toBe(true);
      expect(registeredActions.has('E4_EVENT')).toBe(true);
      expect(registeredActions.has('CHAMPION_EVENT')).toBe(true);
      expect(registeredActions.has('RED_EVENT')).toBe(true);
      expect(registeredActions.has('STADIUM_HOST_EVENT')).toBe(true);

      expect(kantoInteractions.length).toBeGreaterThan(0);
    });

    it('preserves 100% of mid-to-late missions and side missions array sequence', () => {
      expect(LATE_JOHTO_AND_LEAGUE_MISSIONS).toBe(EXTRACTED_LATE_MISSIONS);

      expect(MID_TO_LATE_JOHTO_MISSIONS.length).toBe(26);
      expect(MID_TO_LATE_JOHTO_MISSIONS[0].id).toBe('M11');
      expect(MID_TO_LATE_JOHTO_MISSIONS[4].id).toBe('M15');
      expect(MID_TO_LATE_JOHTO_MISSIONS[5].id).toBe('S01');
      expect(MID_TO_LATE_JOHTO_MISSIONS[10].id).toBe('S06');
      expect(MID_TO_LATE_JOHTO_MISSIONS[25].id).toBe('S21');

      expect(LATE_JOHTO_AND_LEAGUE_MISSIONS.length).toBe(16);
      expect(LATE_JOHTO_AND_LEAGUE_MISSIONS[0].id).toBe('S06');
      expect(LATE_JOHTO_AND_LEAGUE_MISSIONS[15].id).toBe('S21');
    });
  });
});
