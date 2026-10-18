import { describe, it, expect } from 'vitest';
import type { SaveData } from '../src/core/SaveManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';

describe('SaveManager Data Contracts', () => {
  it('validates SaveData structure and serializability', () => {
    const starter = PokemonFactory.create('cyndaquil', 5);

    const mockSave: SaveData = {
      version: 1,
      timestamp: Date.now(),
      player: {
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
    };

    // Serialize and deserialize
    const jsonStr = JSON.stringify(mockSave);
    const restored: SaveData = JSON.parse(jsonStr);

    expect(restored.version).toBe(1);
    expect(restored.player.mapId).toBe('new_bark_town');
    expect(restored.party[0].speciesId).toBe('cyndaquil');
    expect(restored.inventory.tms).toEqual(['TM54', 'TM73', 'TM99']);
    expect(restored.roamers[0].speciesId).toBe('raikou');
    expect(restored.defeatedTrainers).toContain('youngster_joey');
  });
});
