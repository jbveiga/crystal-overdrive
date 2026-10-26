import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GENERATED_NPCS } from '../src/world/generatedNpcs';
import { EAST_JOHTO_GENERATED_NPCS } from '../src/world/generated-npcs/eastJohtoGeneratedNpcs';
import { CENTRAL_JOHTO_GENERATED_NPCS } from '../src/world/generated-npcs/centralJohtoGeneratedNpcs';
import { WEST_AND_NORTH_JOHTO_GENERATED_NPCS } from '../src/world/generated-npcs/westAndNorthJohtoGeneratedNpcs';
import { createNpcsByMap } from '../src/world/npcData';

describe('AgentModularArchitectureSlice6 — generatedNpcs.ts Regionalization', () => {
  const rootDir = path.resolve(__dirname, '..');
  const barrelPath = path.join(rootDir, 'src/world/generatedNpcs.ts');
  const genNpcDir = path.join(rootDir, 'src/world/generated-npcs');
  const eastJohtoPath = path.join(genNpcDir, 'eastJohtoGeneratedNpcs.ts');
  const centralJohtoPath = path.join(genNpcDir, 'centralJohtoGeneratedNpcs.ts');
  const westNorthJohtoPath = path.join(genNpcDir, 'westAndNorthJohtoGeneratedNpcs.ts');
  const jsonPath = path.join(rootDir, 'scripts/generated-npcs.json');

  it('Pillar 6 / Section 1.6: verifies src/world/generatedNpcs.ts is strictly < 60 lines (Single-Window Ceiling)', () => {
    expect(fs.existsSync(barrelPath), 'src/world/generatedNpcs.ts must exist').toBe(true);
    const barrelLines = fs.readFileSync(barrelPath, 'utf-8').split('\n').length;
    expect(
      barrelLines,
      `src/world/generatedNpcs.ts has ${barrelLines} lines, must stay strictly < 60 lines`
    ).toBeLessThan(60);
  });

  it('Pillar 6 / Section 1.6: verifies all 3 regional modules exist and are strictly < 600 lines', () => {
    const modules = [
      { path: eastJohtoPath, name: 'eastJohtoGeneratedNpcs.ts' },
      { path: centralJohtoPath, name: 'centralJohtoGeneratedNpcs.ts' },
      { path: westNorthJohtoPath, name: 'westAndNorthJohtoGeneratedNpcs.ts' },
    ];

    for (const mod of modules) {
      expect(fs.existsSync(mod.path), `${mod.name} must exist on disk`).toBe(true);
      const lineCount = fs.readFileSync(mod.path, 'utf-8').split('\n').length;
      expect(
        lineCount,
        `${mod.name} has ${lineCount} lines, must stay strictly < 600 lines`
      ).toBeLessThan(600);
    }
  });

  it('Pillar 1: verifies zero PixiJS or DOM imports across all generated NPC modules', () => {
    const forbiddenPatterns = [
      /from\s+['"]pixi\.js['"]/,
      /from\s+['"]@pixi\//,
      /document\./,
      /window\./,
    ];

    const filesToCheck = [barrelPath, eastJohtoPath, centralJohtoPath, westNorthJohtoPath];
    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        expect(
          pattern.test(content),
          `File ${path.basename(filePath)} violates layer purity: contains matches for ${pattern}`
        ).toBe(false);
      }
    }
  });

  it('Pillar 2: validates 100% deep-equality dataset match between GENERATED_NPCS and source JSON', () => {
    expect(fs.existsSync(jsonPath), 'scripts/generated-npcs.json must exist').toBe(true);
    const sourceData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const sourceKeys = Object.keys(sourceData);
    const exportedKeys = Object.keys(GENERATED_NPCS);

    expect(exportedKeys.length).toBe(sourceKeys.length);
    expect(exportedKeys).toEqual(sourceKeys);

    for (const key of sourceKeys) {
      expect(
        GENERATED_NPCS[key],
        `Map ${key} generated NPCs must match source JSON identically`
      ).toEqual(sourceData[key]);
    }
  });

  it('Pillar 3: validates regional modules compose into full dataset without duplicate or missing keys', () => {
    const eastKeys = Object.keys(EAST_JOHTO_GENERATED_NPCS);
    const centralKeys = Object.keys(CENTRAL_JOHTO_GENERATED_NPCS);
    const westNorthKeys = Object.keys(WEST_AND_NORTH_JOHTO_GENERATED_NPCS);

    const totalRegionalKeys = eastKeys.length + centralKeys.length + westNorthKeys.length;
    const combinedSet = new Set([...eastKeys, ...centralKeys, ...westNorthKeys]);

    expect(combinedSet.size).toBe(totalRegionalKeys);
    expect(combinedSet.size).toBe(Object.keys(GENERATED_NPCS).length);
  });

  it('Pillar 5: validates createNpcsByMap seamlessly integrates with partitioned GENERATED_NPCS', () => {
    const allNpcs = createNpcsByMap();
    expect(allNpcs).toBeDefined();

    // Verify key Johto maps have NPCs instantiated
    expect(allNpcs.new_bark_town?.length).toBeGreaterThan(0);
    expect(allNpcs.cherrygrove_city?.length).toBeGreaterThan(0);
    expect(allNpcs.violet_city?.length).toBeGreaterThan(0);
    expect(allNpcs.goldenrod_city?.length).toBeGreaterThan(0);
    expect(allNpcs.ecruteak_city?.length).toBeGreaterThan(0);
  });
});
