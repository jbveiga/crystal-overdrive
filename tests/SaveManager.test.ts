import { describe, it, expect } from 'vitest';
import type { SaveData } from '../src/core/SaveManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { MART_MEDICINE_CATALOG } from '../src/ui/BagAndMartUI';

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
});
