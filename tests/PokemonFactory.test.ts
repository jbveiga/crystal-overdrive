import { describe, it, expect } from 'vitest';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { BattleStateMachine } from '../src/battle/BattleStateMachine';

describe('PokemonFactory & Egg Hatching System (Ticket 5.4)', () => {
  it('creates an unhatched Togepi Mystery Egg with expected schema', () => {
    const egg = PokemonFactory.createEgg('togepi', 256);

    expect(egg.isEgg).toBe(true);
    expect(egg.nickname).toBe('EGG');
    expect(egg.speciesId).toBe('togepi');
    expect(egg.level).toBe(1);
    expect(egg.eggSteps).toBe(256);
    expect(egg.currentHp).toBe(10);
    expect(egg.status).toBe('NONE');
    expect(egg.moves).toEqual([]);
  });

  it('prevents an unhatched Egg from entering battle via SWITCH', () => {
    const lead = PokemonFactory.create('cyndaquil', 12);
    const foe = PokemonFactory.create('pidgey', 9);
    const egg = PokemonFactory.createEgg('togepi', 128);

    const bsm = new BattleStateMachine(lead, foe);
    const result = bsm.executeRound({ type: 'SWITCH', switchPokemon: egg });

    expect(result.isBattleOver).toBe(false);
    expect(bsm.playerPokemon.uid).toBe(lead.uid);
    expect(result.events).toEqual([{ type: 'MESSAGE', text: "An EGG can't battle!" }]);
  });

  it('hydrates Togepi Lv.1 with Metronome and Charm upon hatching', () => {
    const togepi = PokemonFactory.create('togepi', 1, ['metronome', 'charm']);

    expect(togepi.speciesId).toBe('togepi');
    expect(togepi.level).toBe(1);
    expect(togepi.moves).toEqual([
      { moveId: 'metronome', currentPp: 10, maxPp: 10 },
      { moveId: 'charm', currentPp: 20, maxPp: 20 },
    ]);
  });

  it('creates authentic Johto Starters at Lv. 5 with canonical starter moves (Ticket 6.1)', () => {
    const cyndaquil = PokemonFactory.create('cyndaquil', 5);
    expect(cyndaquil.speciesId).toBe('cyndaquil');
    expect(cyndaquil.level).toBe(5);
    expect(cyndaquil.currentHp).toBeGreaterThan(0);
    expect(cyndaquil.moves.map((m) => m.moveId)).toEqual(['tackle', 'leer', 'smokescreen', 'ember']);

    const totodile = PokemonFactory.create('totodile', 5);
    expect(totodile.speciesId).toBe('totodile');
    expect(totodile.level).toBe(5);
    expect(totodile.currentHp).toBeGreaterThan(0);
    expect(totodile.moves.map((m) => m.moveId)).toEqual(['scratch', 'leer', 'rage', 'watergun']);

    const chikorita = PokemonFactory.create('chikorita', 5);
    expect(chikorita.speciesId).toBe('chikorita');
    expect(chikorita.level).toBe(5);
    expect(chikorita.currentHp).toBeGreaterThan(0);
    expect(chikorita.moves.map((m) => m.moveId)).toEqual(['tackle', 'growl', 'razorleaf', 'poisonpowder']);
  });

  it('retrieves learnable moves by species and level in Gen 2 (Ticket 6.4)', async () => {
    const cyndaquilLv6 = await PokemonFactory.getLearnableMovesAtLevel('cyndaquil', 6);
    expect(cyndaquilLv6).toContain('smokescreen');

    const totodileLv7 = await PokemonFactory.getLearnableMovesAtLevel('totodile', 7);
    expect(totodileLv7).toContain('rage');

    const chikoritaLv8 = await PokemonFactory.getLearnableMovesAtLevel('chikorita', 8);
    expect(chikoritaLv8).toContain('razorleaf');

    const cyndaquilLv12 = await PokemonFactory.getLearnableMovesAtLevel('cyndaquil', 12);
    expect(cyndaquilLv12).toContain('ember');

    const noMove = await PokemonFactory.getLearnableMovesAtLevel('cyndaquil', 99);
    expect(noMove).toEqual([]);
  });

  it('provides complete move inspect tooltip metadata (Ticket 6.4)', () => {
    const ember = PokemonFactory.getMoveData('ember');
    expect(ember.id).toBe('ember');
    expect(ember.type).toBe('Fire');
    expect(ember.category).toBe('Special');
    expect(ember.power).toBe(40);
    expect(ember.accuracy).toBe(100);
    expect(ember.pp).toBe(25);

    const growl = PokemonFactory.getMoveData('growl');
    expect(growl.id).toBe('growl');
    expect(growl.type).toBe('Normal');
    expect(growl.category).toBe('Status');
    expect(growl.power).toBe(0);
    expect(growl.accuracy).toBe(100);
  });
});
