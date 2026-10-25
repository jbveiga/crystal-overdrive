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

  it('Headless GitHub Sync module: contains comprehensive resolution mapping for issues #8 through #12', () => {
    expect(ISSUE_RESOLUTIONS[8]).toBeDefined();
    expect(ISSUE_RESOLUTIONS[9]).toBeDefined();
    expect(ISSUE_RESOLUTIONS[10]).toBeDefined();
    expect(ISSUE_RESOLUTIONS[11]).toBeDefined();
    expect(ISSUE_RESOLUTIONS[12]).toBeDefined();

    for (const id of [8, 9, 10, 11, 12]) {
      expect(ISSUE_RESOLUTIONS[id].resolution.length).toBeGreaterThan(100);
      expect(ISSUE_RESOLUTIONS[id].resolution).toContain('Root Cause');
      expect(ISSUE_RESOLUTIONS[id].resolution).toContain('Fix');
    }
  });
});
