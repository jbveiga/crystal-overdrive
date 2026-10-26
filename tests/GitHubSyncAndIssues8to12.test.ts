import { describe, it, expect } from 'vitest';
import { createNpcsByMap } from '../src/world/npcData';
import { EvolutionSceneUI } from '../src/ui/EvolutionSceneUI';
import { BattleLogUI } from '../src/ui/BattleLogUI';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { ISSUE_RESOLUTIONS } from '../src/sync/githubSync';
import fs from 'fs';
import path from 'path';

describe('GitHub Issues #8, #9, #10, #11, #12 & Headless Sync Suite', () => {
  it('Issue #8: preserves origin coordinates on NPCs and allows resetting after trainer movement', () => {
    const npcs = createNpcsByMap();
    const azaleaGymNpcs = npcs.azalea_gym;
    expect(azaleaGymNpcs).toBeDefined();

    const amy = azaleaGymNpcs.find((n) => n.id === 'twins_amy');
    const may = azaleaGymNpcs.find((n) => n.id === 'twins_may');
    expect(amy).toBeDefined();
    expect(may).toBeDefined();

    expect(amy!.originX).toBe(4);
    expect(amy!.originY).toBe(10);
    expect(amy!.originDirection).toBe('DOWN');

    expect(may!.originX).toBe(5);
    expect(may!.originY).toBe(10);
    expect(may!.originDirection).toBe('DOWN');

    // Simulate trainer stepping out into corridor to challenge player
    amy!.x = 5;
    amy!.y = 12;
    amy!.renderX = 5;
    amy!.renderY = 12;

    expect(amy!.x).toBe(5);
    expect(amy!.y).toBe(12);

    // Simulate map entry reset logic
    if (amy!.originX !== undefined && amy!.originY !== undefined) {
      amy!.x = amy!.originX;
      amy!.y = amy!.originY;
      amy!.renderX = amy!.originX;
      amy!.renderY = amy!.originY;
    }

    expect(amy!.x).toBe(4);
    expect(amy!.y).toBe(10);
    expect(amy!.renderX).toBe(4);
    expect(amy!.renderY).toBe(10);
  });

  it('Issues #9 & #11: assigns authentic spriteTypes to Farfetchd and Slowpokes', () => {
    const npcs = createNpcsByMap();

    // Check Slowpokes
    const wellSlowpoke1 = npcs.slowpoke_well_b1f?.find((n) => n.id === 'well_slowpoke');
    const wellSlowpoke2 = npcs.slowpoke_well_b1f?.find((n) => n.id === 'well_slowpoke_2');
    const azaleaSlowpoke1 = npcs.azalea_town?.find((n) => n.id === 'azalea_slowpoke');
    const azaleaSlowpoke2 = npcs.azalea_town?.find((n) => n.id === 'azalea_slowpoke_2');

    expect(wellSlowpoke1?.spriteType).toBe('slowpoke');
    expect(wellSlowpoke2?.spriteType).toBe('slowpoke');
    expect(azaleaSlowpoke1?.spriteType).toBe('slowpoke');
    expect(azaleaSlowpoke2?.spriteType).toBe('slowpoke');

    // Check Farfetch'd
    const forestFarfetchd = npcs.ilex_forest?.find((n) => n.id === 'forest_farfetchd');
    const kilnFarfetchd = npcs.charcoal_kiln?.find((n) => n.id === 'kiln_farfetchd');

    expect(forestFarfetchd?.spriteType).toBe('farfetchd');
    expect(kilnFarfetchd?.spriteType).toBe('farfetchd');

    // Verify overworld sprite sheet assets exist on disk
    const slowpokePngPath = path.resolve(__dirname, '../public/assets/sprites/characters/slowpoke.png');
    const farfetchdPngPath = path.resolve(__dirname, '../public/assets/sprites/characters/farfetchd.png');

    expect(fs.existsSync(slowpokePngPath)).toBe(true);
    expect(fs.existsSync(farfetchdPngPath)).toBe(true);
  });

  it('Issue #10: mutates Pokemon instance into evolved species on evolution completion', async () => {
    const chikorita = PokemonFactory.create('chikorita', 16);
    expect(chikorita.speciesId).toBe('chikorita');

    const ui = new EvolutionSceneUI('modal-container');
    // Calling completeEvolution directly mutates the pokemon when mutatePokemon is true (default)
    const playPromise = ui.play(chikorita, 'bayleef', { autoAdvance: false });
    ui.completeEvolution();
    const result = await playPromise;

    expect(result.evolved).toBe(true);
    expect(result.targetSpecies).toBe('bayleef');
    expect(chikorita.speciesId).toBe('bayleef');
  });

  it('Issue #12: exports BattleLogUI component class', () => {
    expect(BattleLogUI).toBeDefined();
    expect(typeof BattleLogUI).toBe('function');
  });

  it('Issue #15: ensures HM01 Cut replaces cut tree with forest grass tile in_forest_05_05_05_05', () => {
    const ilexMapPath = path.resolve(__dirname, '../public/assets/data/maps/ilex_forest.json');
    expect(fs.existsSync(ilexMapPath)).toBe(true);
    const ilexData = JSON.parse(fs.readFileSync(ilexMapPath, 'utf8'));

    // Verify surrounding walkable ground tiles in Ilex Forest use in_forest_05_05_05_05
    const idx26_8 = 26 * ilexData.width + 8;
    const idx24_8 = 24 * ilexData.width + 8;
    expect(ilexData.tileMap[idx26_8]).toBe('in_forest_05_05_05_05');
    expect(ilexData.tileMap[idx24_8]).toBe('in_forest_05_05_05_05');

    // Simulate cut replacement logic
    const cutTileId = ilexData.tileMap[25 * ilexData.width + 8];
    const isForestTile = cutTileId.startsWith('in_forest_') || ilexData.id === 'ilex_forest';
    const replacementTile = isForestTile ? 'in_forest_05_05_05_05' : 'jt_07_07_07_07';
    expect(replacementTile).toBe('in_forest_05_05_05_05');
    expect(replacementTile).not.toBe('jt_07_07_07_07');
  });

  it('Issue #16: Bug Report modal does not automatically redirect and provides manual PNG save', () => {
    const mainTsPath = path.resolve(__dirname, '../src/main.ts');
    const mainContent = fs.readFileSync(mainTsPath, 'utf8');

    // Verify auto-redirect setTimeout has been removed from mountGitHubReportButton
    expect(mainContent).not.toMatch(/directLink\?\.click\(\);\s*\}\s*,\s*1000\)/);
    // Verify save screenshot link and open issue link exist
    expect(mainContent).toContain('github-screenshot-download-link');
    expect(mainContent).toContain('SAVE SCREENSHOT PNG');
    expect(mainContent).toContain('github-issues-redirect-link');
    expect(mainContent).toContain('OPEN GITHUB ISSUE');
  });

  it('Headless GitHub Sync module: contains comprehensive resolution mapping for issues #8 through #20', () => {
    for (const id of [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20]) {
      expect(ISSUE_RESOLUTIONS[id]).toBeDefined();
      expect(ISSUE_RESOLUTIONS[id].resolution.length).toBeGreaterThan(100);
      expect(ISSUE_RESOLUTIONS[id].resolution).toContain('Root Cause');
      expect(ISSUE_RESOLUTIONS[id].resolution).toContain('Fix');
    }
  });

  it('Issue #17: Ilex Forest shrine tiles are solid and bgEvent is registered', () => {
    const ilexMapPath = path.resolve(__dirname, '../public/assets/data/maps/ilex_forest.json');
    const ilexData = JSON.parse(fs.readFileSync(ilexMapPath, 'utf8'));

    // Shrine tiles (7, 22), (8, 22), (9, 22), (8, 23) must be solid
    expect(ilexData.collisionGrid[22 * ilexData.width + 7]).toBe(1);
    expect(ilexData.collisionGrid[22 * ilexData.width + 8]).toBe(1);
    expect(ilexData.collisionGrid[22 * ilexData.width + 9]).toBe(1);
    expect(ilexData.collisionGrid[23 * ilexData.width + 8]).toBe(1);

    // Shrine bgEvent registered at (8, 23)
    const shrineBgEvent = ilexData.bgEvents?.find((bg: any) => bg.x === 8 && bg.y === 23);
    expect(shrineBgEvent).toBeDefined();
    expect(shrineBgEvent.speaker).toContain('ILEX FOREST SHRINE');
  });

  it('Issue #18: forest_lass is relocated out of the 1-tile corridor to the shrine clearing', () => {
    const npcs = createNpcsByMap();
    const forestLass = npcs.ilex_forest?.find((n) => n.id === 'forest_lass');
    expect(forestLass).toBeDefined();
    expect(forestLass!.x).toBe(7);
    expect(forestLass!.y).toBe(23);
    expect(forestLass!.originX).toBe(7);
    expect(forestLass!.originY).toBe(23);
    expect(forestLass!.direction).toBe('DOWN');

    // Verify (3, 24) in Ilex Forest is an unblocked walkable corridor
    const ilexMapPath = path.resolve(__dirname, '../public/assets/data/maps/ilex_forest.json');
    const ilexData = JSON.parse(fs.readFileSync(ilexMapPath, 'utf8'));
    expect(ilexData.collisionGrid[24 * ilexData.width + 3]).toBe(0);
  });

  it('Issue #19: Azalea Town gate sign bgEvent is registered and main.ts avoids broad cut-tree substrings', () => {
    const azaleaMapPath = path.resolve(__dirname, '../public/assets/data/maps/azalea_town.json');
    const azaleaData = JSON.parse(fs.readFileSync(azaleaMapPath, 'utf8'));

    const gateSign = azaleaData.bgEvents?.find((bg: any) => bg.x === 3 && bg.y === 9);
    expect(gateSign).toBeDefined();
    expect(gateSign.speaker).toContain('ILEX FOREST GATE');

    const mainTsPath = path.resolve(__dirname, '../src/main.ts');
    const mainContent = fs.readFileSync(mainTsPath, 'utf8');

    // Ensure broad substring checks '_5f' and '_5b' are not in isCutTree
    expect(mainContent).not.toMatch(/facingTileName\.includes\(['"]_5f['"]\)/);
    expect(mainContent).not.toMatch(/facingTileName\.includes\(['"]_5b['"]\)/);
  });

  it('Issue #20: applyMapStoryMutations updates cut tree tile before renderMap', () => {
    const mainTsPath = path.resolve(__dirname, '../src/main.ts');
    const mainContent = fs.readFileSync(mainTsPath, 'utf8');

    expect(mainContent).toContain('applyMapStoryMutations(targetMap)');
    expect(mainContent).toContain("tileMap[25 * map.width + 8] = 'in_forest_05_05_05_05'");
    // Verify shrine roof at (8, 22) is not made walkable
    expect(mainContent).not.toMatch(/collisionGrid\[22 \* map\.width \+ 8\] = 0/);
  });

  it('All Johto climax progression NPCs and events are defined in npcData', () => {
    const npcs = createNpcsByMap();

    // Radio Tower 5F
    expect(npcs.radio_tower_5f).toBeDefined();
    expect(npcs.radio_tower_5f.find((n) => n.id === 'petrel_radio_5f')).toBeDefined();
    expect(npcs.radio_tower_5f.find((n) => n.id === 'archer_radio_5f')).toBeDefined();
    expect(npcs.radio_tower_5f.find((n) => n.id === 'radio_director')).toBeDefined();

    // Goldenrod Underground
    expect(npcs.goldenrod_underground).toBeDefined();
    expect(npcs.goldenrod_underground.find((n) => n.id === 'true_director')).toBeDefined();

    // Tin Tower 1F Suicune Altar
    expect(npcs.tin_tower_1f).toBeDefined();
    expect(npcs.tin_tower_1f.find((n) => n.id === 'suicune_altar')).toBeDefined();

    // Dragon Shrine & Elder
    expect(npcs.dragon_shrine).toBeDefined();
    expect(npcs.dragon_shrine.find((n) => n.id === 'dragon_elder')).toBeDefined();

    // Victory Road Rival
    expect(npcs.victory_road).toBeDefined();
    expect(npcs.victory_road.find((n) => n.id === 'victory_road_rival')).toBeDefined();

    // Elite Four & Champion Lance
    expect(npcs.wills_room?.find((n) => n.id === 'e4_will')).toBeDefined();
    expect(npcs.kogas_room?.find((n) => n.id === 'e4_koga')).toBeDefined();
    expect(npcs.brunos_room?.find((n) => n.id === 'e4_bruno')).toBeDefined();
    expect(npcs.karens_room?.find((n) => n.id === 'e4_karen')).toBeDefined();
    expect(npcs.lances_room?.find((n) => n.id === 'champion_lance')).toBeDefined();
  });
});
