import { describe, it, expect, vi } from 'vitest';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { SaveManager, type SaveData } from '../src/core/SaveManager';

describe('Pokémon Unbound-Style Exp. Share & Level Cap System (TICKET-KEY-ITEMS-UNBOUND-01)', () => {
  it('defaults SaveManager.getDefaultOptions().expShare to CAPPED and hydrates legacy saves', async () => {
    const defaults = SaveManager.getDefaultOptions();
    expect(defaults.expShare).toBe('CAPPED');

    const saveManager = new SaveManager();
    const legacySave = {
      version: 1,
      timestamp: Date.now(),
      player: {
        name: 'GOLD',
        gender: 'BOY',
        mapId: 'new_bark_town',
        x: 4,
        y: 6,
        direction: 'DOWN',
        speedMultiplier: 1,
        badges: [],
        money: 3000,
      },
      party: [],
      box: [],
      inventory: { balls: {}, tms: [] },
      roamers: [],
      defeatedTrainers: [],
      options: {
        soundVolume: 0.7,
        bgmVolume: 0.7,
        textSpeed: 'MID',
        battleAnimations: true,
      },
    } as unknown as SaveData;

    await saveManager.saveGame(legacySave);
    const loaded = await saveManager.loadGame();
    expect(loaded?.options?.expShare).toBe('CAPPED');
  });

  it('returns accurate Johto + Kanto level caps and Gym Ace levels by badge count', () => {
    expect(PokemonFactory.getLevelCapForBadges(0)).toBe(15);
    expect(PokemonFactory.getLevelCapForBadges(1)).toBe(18);
    expect(PokemonFactory.getLevelCapForBadges(2)).toBe(22);
    expect(PokemonFactory.getLevelCapForBadges(3)).toBe(27);
    expect(PokemonFactory.getLevelCapForBadges(4)).toBe(32);
    expect(PokemonFactory.getLevelCapForBadges(5)).toBe(37);
    expect(PokemonFactory.getLevelCapForBadges(6)).toBe(37);
    expect(PokemonFactory.getLevelCapForBadges(7)).toBe(42);
    expect(PokemonFactory.getLevelCapForBadges(8)).toBe(52);
    expect(PokemonFactory.getLevelCapForBadges(16)).toBe(85);

    expect(PokemonFactory.getGymAceLevelForBadges(0)).toBe(13);
    expect(PokemonFactory.getGymAceLevelForBadges(8)).toBe(50);
    expect(PokemonFactory.getGymAceLevelForBadges(16)).toBe(81);
  });

  it('awards 100% EXP strictly to active battler when mode is OFF', () => {
    const active = PokemonFactory.create('cyndaquil', 8);
    const bench = PokemonFactory.create('pidgey', 6);
    const party = [active, bench];

    const awards = PokemonFactory.distributePartyExp(party, active, 120, 'OFF', 0);
    expect(awards).toHaveLength(1);
    expect(awards[0].pokemon.uid).toBe(active.uid);
    expect(awards[0].expAwarded).toBe(120);
    expect(awards[0].isCapped).toBe(false);
    expect(awards[0].isActiveBattler).toBe(true);
  });

  it('awards 100% EXP to active battler and 50% EXP to conscious non-egg bench members when mode is ALL', () => {
    const active = PokemonFactory.create('cyndaquil', 15);
    const benchConscious = PokemonFactory.create('pidgey', 10);
    const benchFainted = PokemonFactory.create('rattata', 10);
    benchFainted.currentHp = 0;
    const benchEgg = PokemonFactory.createEgg('togepi');
    const party = [active, benchConscious, benchFainted, benchEgg];

    const awards = PokemonFactory.distributePartyExp(party, active, 100, 'ALL', 0);
    expect(awards).toHaveLength(2);
    expect(awards[0].pokemon.uid).toBe(active.uid);
    expect(awards[0].expAwarded).toBe(100);
    expect(awards[0].isCapped).toBe(false);

    expect(awards[1].pokemon.uid).toBe(benchConscious.uid);
    expect(awards[1].expAwarded).toBe(50);
    expect(awards[1].isCapped).toBe(false);
  });

  it('clamps EXP to 1 for any party member at or above the current badge level cap when mode is CAPPED', () => {
    // 0 badges -> Level Cap 15
    const activeCapped = PokemonFactory.create('cyndaquil', 15);
    const benchBelowCap = PokemonFactory.create('pidgey', 12);
    const benchAboveCap = PokemonFactory.create('totodile', 16);
    const party = [activeCapped, benchBelowCap, benchAboveCap];

    const awards = PokemonFactory.distributePartyExp(party, activeCapped, 140, 'CAPPED', 0);
    expect(awards).toHaveLength(3);

    // Active battler at Lv. 15 -> clamped to 1 EXP
    expect(awards[0].pokemon.uid).toBe(activeCapped.uid);
    expect(awards[0].expAwarded).toBe(1);
    expect(awards[0].isCapped).toBe(true);
    expect(awards[0].levelCap).toBe(15);

    // Bench member at Lv. 12 -> full 50% share (70 EXP)
    expect(awards[1].pokemon.uid).toBe(benchBelowCap.uid);
    expect(awards[1].expAwarded).toBe(70);
    expect(awards[1].isCapped).toBe(false);

    // Bench member at Lv. 16 -> clamped to 1 EXP
    expect(awards[2].pokemon.uid).toBe(benchAboveCap.uid);
    expect(awards[2].expAwarded).toBe(1);
    expect(awards[2].isCapped).toBe(true);
  });
});
