import { describe, it, expect } from 'vitest';
import { BattleStateMachine } from '../src/battle/BattleStateMachine';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { BattleHUD, BATTLE_ITEM_CATALOG } from '../src/ui/BattleHUD';

describe('Tactical Battle HUD, Move Previews, and In-Battle Bag Item Usage', () => {
  it('1. heals active or party Pokémon when USE_ITEM is executed with a Potion or Berry', () => {
    const player = PokemonFactory.create('cyndaquil', 15);
    const foe = PokemonFactory.create('sentret', 5);
    player.currentHp = Math.max(1, player.stats.hp - 15);
    const initialHp = player.currentHp;

    const bsm = new BattleStateMachine(player, foe);
    const result = bsm.executeRound({
      type: 'USE_ITEM',
      itemId: 'potion',
      targetPokemon: player,
    });

    const healEvent = result.events.find((e) => e.type === 'HEAL');
    expect(healEvent).toBeDefined();
    if (healEvent && healEvent.type === 'HEAL') {
      expect(healEvent.healedAmount).toBeGreaterThan(0);
      expect(healEvent.remainingHp).toBe(initialHp + healEvent.healedAmount);
    }
  });

  it('2. cures status conditions when USE_ITEM is executed with Antidote or Full Heal', () => {
    const player = PokemonFactory.create('totodile', 15);
    const foe = PokemonFactory.create('rattata', 5);
    player.status = 'PSN';

    const bsm = new BattleStateMachine(player, foe);
    const result = bsm.executeRound({
      type: 'USE_ITEM',
      itemId: 'antidote',
      targetPokemon: player,
    });

    const statusEvent = result.events.find(
      (e) => e.type === 'STATUS' && e.targetId === player.uid && e.status === 'NONE'
    );
    expect(statusEvent).toBeDefined();
  });

  it('3. revives a fainted party Pokémon when USE_ITEM is executed with Revive', () => {
    const activePlayer = PokemonFactory.create('chikorita', 16);
    const faintedBenched = PokemonFactory.create('pidgey', 12);
    faintedBenched.currentHp = 0;
    const foe = PokemonFactory.create('hoothoot', 5);

    const bsm = new BattleStateMachine(activePlayer, foe);
    const result = bsm.executeRound({
      type: 'USE_ITEM',
      itemId: 'revive',
      targetPokemon: faintedBenched,
    });

    expect(faintedBenched.currentHp).toBe(Math.max(1, Math.floor(faintedBenched.stats.hp / 2)));
    const healEvent = result.events.find(
      (e) => e.type === 'HEAL' && e.targetId === faintedBenched.uid
    );
    expect(healEvent).toBeDefined();
  });

  it('4. boosts active Pokémon stat stages when USE_ITEM is executed with X Attack', () => {
    const player = PokemonFactory.create('pikachu', 18);
    const foe = PokemonFactory.create('geodude', 5);

    const bsm = new BattleStateMachine(player, foe);
    const result = bsm.executeRound({
      type: 'USE_ITEM',
      itemId: 'x-attack',
      targetPokemon: player,
    });

    expect(bsm.playerPokemon.statStages?.atk).toBeGreaterThanOrEqual(1);
    const statEvent = result.events.find(
      (e) => e.type === 'STAT_CHANGE' && e.targetId === player.uid && e.stat === 'atk'
    );
    expect(statEvent).toBeDefined();
  });

  it('5. generates tactical move effect descriptions for damaging, status, and stat moves', () => {
    const emberDesc = BattleHUD.getMoveEffectDescription(PokemonFactory.getMoveData('ember'));
    expect(emberDesc).toContain('BRN');

    const growlDesc = BattleHUD.getMoveEffectDescription(PokemonFactory.getMoveData('growl'));
    expect(growlDesc).toContain('Lowers foe');

    const tackleDesc = BattleHUD.getMoveEffectDescription(PokemonFactory.getMoveData('tackle'));
    expect(tackleDesc.length).toBeGreaterThan(10);
  });

  it('6. includes Medicine, Status Heals, Revives, Berries, and Battle Items in BATTLE_ITEM_CATALOG', () => {
    const ids = new Set(BATTLE_ITEM_CATALOG.map((item) => item.id));
    expect(ids.has('potion')).toBe(true);
    expect(ids.has('super-potion')).toBe(true);
    expect(ids.has('antidote')).toBe(true);
    expect(ids.has('revive')).toBe(true);
    expect(ids.has('berry')).toBe(true);
    expect(ids.has('x-attack')).toBe(true);
  });
});
