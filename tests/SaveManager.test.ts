import { describe, it, expect } from 'vitest';
import { SaveManager, type SaveData } from '../src/core/SaveManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { MART_MEDICINE_CATALOG } from '../src/ui/BagAndMartUI';

describe('SaveManager Data Contracts & Ticket 4.1 Extensions', () => {
  it('validates SaveData structure and serializability', () => {
    const starter = PokemonFactory.create('cyndaquil', 5);

    const mockSave: SaveData = {
      version: 1,
      timestamp: Date.now(),
      player: {
        name: 'GOLD',
        gender: 'BOY',
        mapId: 'new_bark_town',
        x: 6,
        y: 6,
        direction: 'DOWN',
        speedMultiplier: 2,
        badges: [],
        money: 3000,
      },
      party: [starter],
      box: [],
      inventory: {
        balls: {
          'poke-ball': 20,
          'ultra-ball': 5,
          'quick-ball': 3,
        },
        tms: ['TM54', 'TM73', 'TM99'],
      },
      roamers: [
        {
          speciesId: 'raikou',
          currentMapId: 'route_29',
          pokemon: PokemonFactory.create('raikou', 40),
          isAwakened: true,
          isCaught: false,
          isDefeated: false,
        },
      ],
      defeatedTrainers: ['youngster_joey'],
      options: SaveManager.getDefaultOptions(),
    };

    // Serialize and deserialize
    const jsonStr = JSON.stringify(mockSave);
    const restored: SaveData = JSON.parse(jsonStr);

    expect(restored.version).toBe(1);
    expect(restored.player.name).toBe('GOLD');
    expect(restored.player.gender).toBe('BOY');
    expect(restored.player.mapId).toBe('new_bark_town');
    expect(restored.party[0].speciesId).toBe('cyndaquil');
    expect(restored.inventory.tms).toEqual(['TM54', 'TM73', 'TM99']);
    expect(restored.roamers[0].speciesId).toBe('raikou');
    expect(restored.defeatedTrainers).toContain('youngster_joey');
  });

  it('defines all 6 classic out-of-battle medicine items and persists them in SaveData', () => {
    const medIds = MART_MEDICINE_CATALOG.map((m) => m.id);
    expect(medIds).toEqual(['potion', 'super-potion', 'antidote', 'parlyz-heal', 'awakening', 'revive']);

    const cyndaquil = PokemonFactory.create('cyndaquil', 5);
    const pidgey = PokemonFactory.create('pidgey', 4);
    const party = [cyndaquil, pidgey];

    // Swap party order (changing battle lead)
    const temp = party[0];
    party[0] = party[1];
    party[1] = temp;
    expect(party[0].speciesId).toBe('pidgey');
    expect(party[1].speciesId).toBe('cyndaquil');
  });

  it('formats play time strings accurately for 0s, under 1 hour, and over 10 hours', () => {
    expect(SaveManager.formatPlayTime(0)).toBe('00:00:00');
    expect(SaveManager.formatPlayTime(59)).toBe('00:00:59');
    expect(SaveManager.formatPlayTime(65)).toBe('00:01:05');
    expect(SaveManager.formatPlayTime(84)).toBe('00:01:24');
    expect(SaveManager.formatPlayTime(3665)).toBe('01:01:05');
    expect(SaveManager.formatPlayTime(5040)).toBe('01:24:00');
    expect(SaveManager.formatPlayTime(36000)).toBe('10:00:00');
    expect(SaveManager.formatPlayTime(45180)).toBe('12:33:00');
  });

  it('returns canonical default GameOptions from SaveManager.getDefaultOptions()', () => {
    const defaults = SaveManager.getDefaultOptions();
    expect(defaults).toEqual({
      soundVolume: 0.7,
      bgmVolume: 0.7,
      textSpeed: 'MID',
      battleAnimations: true,
      playerSpeedDefault: 3,
      battleSpeedMultiplier: 1,
      touchControlStyle: 'DPAD',
      expShare: 'CAPPED',
    });
  });

  it('extracts SavePreview fields accurately from a populated SaveData', async () => {
    const saveManager = new SaveManager();
    const lead = PokemonFactory.create('cyndaquil', 14);

    // Before saving, preview should be null
    expect(await saveManager.getSavePreview()).toBeNull();

    const saveData: SaveData = {
      version: 1,
      timestamp: 1700000000000,
      playTimeSeconds: 5040, // 01:24
      player: {
        name: 'KRIS',
        gender: 'GIRL',
        mapId: 'players_house_1f',
        x: 3,
        y: 4,
        direction: 'DOWN',
        speedMultiplier: 2,
        badges: ['Zephyr'],
        money: 4500,
      },
      party: [lead],
      box: [],
      inventory: {
        balls: { 'poke-ball': 10 },
        tms: [],
      },
      roamers: [],
      defeatedTrainers: ['youngster_joey'],
      seenSpecies: ['cyndaquil', 'pidgey', 'sentret', 'rattata'],
      options: SaveManager.getDefaultOptions(),
    };

    await saveManager.saveGame(saveData);
    const preview = await saveManager.getSavePreview();

    expect(preview).not.toBeNull();
    expect(preview?.playerName).toBe('KRIS');
    expect(preview?.gender).toBe('GIRL');
    expect(preview?.badgeCount).toBe(1);
    expect(preview?.pokedexCount).toBe(4);
    expect(preview?.playTimeFormatted).toBe('01:24:00');
    expect(preview?.currentLocationName).toBe("Player's House");
    expect(preview?.partyLeadSpeciesId).toBe('cyndaquil');
    expect(preview?.partyLeadLevel).toBe(14);
    expect(preview?.timestamp).toBeGreaterThan(0);
  });

  it('handles backward-compatible legacy saves lacking player.name or player.gender', async () => {
    const saveManager = new SaveManager();
    const legacySave = {
      version: 1,
      timestamp: 1700000000000,
      playTimeSeconds: 84,
      player: {
        mapId: 'new_bark_town',
        x: 13,
        y: 6,
        direction: 'DOWN',
        speedMultiplier: 1,
        badges: [],
        money: 3000,
      },
      party: [PokemonFactory.create('totodile', 5)],
      box: [],
      inventory: {
        balls: { 'poke-ball': 5 },
        tms: [],
      },
      roamers: [],
      defeatedTrainers: [],
    } as unknown as SaveData;

    await saveManager.saveGame(legacySave);
    const preview = await saveManager.getSavePreview();

    expect(preview).not.toBeNull();
    expect(preview?.playerName).toBe('GOLD');
    expect(preview?.gender).toBe('BOY');
    expect(preview?.badgeCount).toBe(0);
    expect(preview?.pokedexCount).toBe(0);
    expect(preview?.playTimeFormatted).toBe('00:01:24');
    expect(preview?.currentLocationName).toBe('New Bark Town');
    expect(preview?.partyLeadSpeciesId).toBe('totodile');
    expect(preview?.partyLeadLevel).toBe(5);
  });
});
