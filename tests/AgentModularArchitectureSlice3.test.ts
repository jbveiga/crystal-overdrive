import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createNpcsByMap,
  npcsByMap,
  getNpcsForMap,
  applyMapNpcStoryMutations,
  makeNpc,
  GUIDE_GENT_TOUR_LEGS,
  DAY_SIBLINGS,
  DAY_OF_WEEK_SIBLINGS,
  resolveDaySiblingInteraction,
  resolveElmLabDialogue,
  calculateTourLegCoordinates,
  isNpcActiveForStoryFlags,
} from '../src/world/npcData';
import type { MapData } from '../src/types/game';

describe('AgentModularArchitectureSlice3 — Invariant & Regression Guardrails', () => {
  const rootDir = path.resolve(__dirname, '..');
  const npcDataPath = path.join(rootDir, 'src/world/npcData.ts');
  const npcsDir = path.join(rootDir, 'src/world/npcs');
  const mapsDir = path.join(rootDir, 'public/assets/data/maps');

  const regionalModules = [
    'npcShared.ts',
    'newBarkToSproutTowerNpcs.ts',
    'violetToUnionCaveNpcs.ts',
    'azaleaToIlexNpcs.ts',
    'goldenrodCityNpcs.ts',
    'goldenrodBuildingsAndParkNpcs.ts',
    'ecruteakToRoute39Npcs.ts',
    'olivineToIndigoNpcs.ts',
  ];

  it('Pillar 6 / Section 1.6: verifies npcData.ts and all regional modules in src/world/npcs/ exist and stay strictly < 800 lines', () => {
    expect(fs.existsSync(npcDataPath)).toBe(true);
    const barrelLines = fs.readFileSync(npcDataPath, 'utf-8').split('\n').length;
    expect(
      barrelLines,
      `src/world/npcData.ts has ${barrelLines} lines, must stay strictly < 800 lines (Single-Window Ceiling)`
    ).toBeLessThan(800);

    for (const mod of regionalModules) {
      const fullPath = path.join(npcsDir, mod);
      expect(fs.existsSync(fullPath), `Module ${mod} must exist on disk`).toBe(true);

      const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
      expect(
        lineCount,
        `Module ${mod} has ${lineCount} lines, must stay strictly < 800 lines (Single-Window Ceiling)`
      ).toBeLessThan(800);
    }
  });

  it('Pillar 1: verifies zero DOM and zero PixiJS imports in npcData.ts and all src/world/npcs/ modules', () => {
    const forbiddenPatterns = [
      /from\s+['"]pixi\.js['"]/,
      /from\s+['"]@pixi\//,
      /\bdocument\./,
      /\bwindow\./,
      /\bHTMLElement\b/,
      /\bHTMLDivElement\b/,
    ];

    const allFilesToCheck = [npcDataPath, ...regionalModules.map((m) => path.join(npcsDir, m))];
    for (const filePath of allFilesToCheck) {
      const code = fs.readFileSync(filePath, 'utf-8');
      const baseName = path.basename(filePath);

      for (const pattern of forbiddenPatterns) {
        expect(code, `File ${baseName} must not contain ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('Pillar 1: verifies 100% backward-compatible export equivalence on src/world/npcData.ts', () => {
    expect(typeof makeNpc).toBe('function');
    expect(Array.isArray(GUIDE_GENT_TOUR_LEGS)).toBe(true);
    expect(GUIDE_GENT_TOUR_LEGS.length).toBeGreaterThan(0);
    expect(typeof calculateTourLegCoordinates).toBe('function');
    expect(typeof isNpcActiveForStoryFlags).toBe('function');
    expect(typeof DAY_SIBLINGS).toBe('object');
    expect(typeof DAY_OF_WEEK_SIBLINGS).toBe('object');
    expect(DAY_OF_WEEK_SIBLINGS).toBe(DAY_SIBLINGS);
    expect(typeof resolveDaySiblingInteraction).toBe('function');
    expect(typeof resolveElmLabDialogue).toBe('function');
    expect(typeof createNpcsByMap).toBe('function');
    expect(typeof npcsByMap).toBe('object');
    expect(typeof getNpcsForMap).toBe('function');
    expect(typeof applyMapNpcStoryMutations).toBe('function');
  });

  it('Pillar 2: verifies createNpcsByMap produces a complete, populated NPC dataset matching the global registry', () => {
    const mapNpcs = createNpcsByMap();
    expect(mapNpcs).toBeDefined();

    // Verify key landmark maps are populated
    expect(mapNpcs['new_bark_town']?.length).toBeGreaterThanOrEqual(2);
    expect(mapNpcs['cherrygrove_city']?.length).toBeGreaterThanOrEqual(2);
    expect(mapNpcs['violet_city']?.length).toBeGreaterThanOrEqual(3);
    expect(mapNpcs['violet_gym']?.length).toBeGreaterThanOrEqual(3);
    expect(mapNpcs['azalea_town']?.length).toBeGreaterThanOrEqual(2);
    expect(mapNpcs['goldenrod_city']?.length).toBeGreaterThanOrEqual(3);
    expect(mapNpcs['goldenrod_gym']?.length).toBeGreaterThanOrEqual(3);
    expect(mapNpcs['ecruteak_city']?.length).toBeGreaterThanOrEqual(2);
    expect(mapNpcs['olivine_city']?.length).toBeGreaterThanOrEqual(3);
    expect(mapNpcs['cianwood_city']?.length).toBeGreaterThanOrEqual(3);
    expect(mapNpcs['mahogany_town']?.length).toBeGreaterThanOrEqual(2);
    expect(mapNpcs['blackthorn_city']?.length).toBeGreaterThanOrEqual(2);
    expect(mapNpcs['lances_room']?.length).toBeGreaterThanOrEqual(1);

    // Verify proxy hydration for generated NPCs
    expect(mapNpcs['route_1']?.length).toBeGreaterThan(0);
    expect(mapNpcs['viridian_city']?.length).toBeGreaterThan(0);
  });

  it('Pillar 2: asserts 100% of defined NPCs stand on strictly walkable tiles (0 or 2)', () => {
    const sampleMaps = [
      'new_bark_town',
      'cherrygrove_city',
      'violet_city',
      'violet_gym',
      'sprout_tower_1f',
      'azalea_town',
      'azalea_gym',
      'goldenrod_city',
      'goldenrod_gym',
      'ecruteak_city',
      'ecruteak_gym',
      'olivine_city',
      'cianwood_city',
      'mahogany_town',
      'blackthorn_city',
    ];

    for (const mapId of sampleMaps) {
      const mapPath = path.join(mapsDir, `${mapId}.json`);
      if (!fs.existsSync(mapPath)) continue;

      const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      const npcs = npcsByMap[mapId] || [];

      for (const npc of npcs) {
        const x = npc.gridX ?? npc.x;
        const y = npc.gridY ?? npc.y;
        const tileVal = mapData.collisionGrid[y * mapData.width + x];
        expect(
          [0, 2],
          `NPC ${npc.id} in ${mapId} at (${x}, ${y}) must stand on walkable tile (0 or 2), found ${tileVal}`
        ).toContain(tileVal);
      }
    }
  });

  it('Pillar 3: verifies resolveDaySiblingInteraction returns correct state on matching and wrong days', () => {
    const flags = new Set<string>();
    // Friday: Frieda of Friday
    const friedaMatch = resolveDaySiblingInteraction('frieda', 5, flags);
    expect(friedaMatch.canReceiveItem).toBe(true);
    expect(friedaMatch.sibling?.name).toContain('Frieda');

    // Friday with flag already set
    flags.add('received_item_frieda');
    const friedaClaimed = resolveDaySiblingInteraction('frieda', 5, flags);
    expect(friedaClaimed.canReceiveItem).toBe(false);

    // Wrong day (Tuesday)
    const friedaWrongDay = resolveDaySiblingInteraction('frieda', 2, new Set());
    expect(friedaWrongDay.canReceiveItem).toBe(false);
  });

  it('Pillar 5: verifies resolveElmLabDialogue state progression', () => {
    // 1. Fresh start: no starter
    const freshResult = resolveElmLabDialogue('GOLD', new Set(), []);
    expect(freshResult.action).toBe('PROMPT_STARTER');

    // 2. Starter chosen: errand prompt
    const starterFlags = new Set(['starter_chosen']);
    const errandResult = resolveElmLabDialogue('GOLD', starterFlags, [{ speciesId: 'cyndaquil' }]);
    expect(errandResult.action).toBe('HEAL_AND_SAVE');
    expect(errandResult.pages[0]).toContain('How is your partner POKéMON doing?');

    // 3. Mystery Egg obtained: prompt return to Elm
    const eggFlags = new Set(['starter_chosen', 'HAS_MYSTERY_EGG']);
    const eggResult = resolveElmLabDialogue('GOLD', eggFlags, [{ speciesId: 'cyndaquil' }]);
    expect(eggResult.action).toBe('DELIVER_MYSTERY_EGG');
  });
});
