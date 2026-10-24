import { describe, it, expect } from 'vitest';
import { SaveManager } from '../src/core/SaveManager';
import { ModernHMHandler } from '../src/world/ModernHMHandler';
import { MapManager } from '../src/world/MapManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import type { BagInventory } from '../src/ui/BagAndMartUI';
import type { MapData } from '../src/types/game';

const createMockInventory = (badges: string[], tms: string[], keyItems: string[] = []): BagInventory => ({
  money: 5000,
  balls: { pokeball: 10 },
  items: {},
  tms,
  keyItems,
  badges,
});

const createWaterMap = (): MapData => ({
  id: 'route_40',
  name: 'Route 40',
  width: 5,
  height: 5,
  tileSize: 64,
  groundLayer: new Array(25).fill(0),
  objectLayer: new Array(25).fill(0),
  collisionGrid: [
    0, 0, 0, 0, 0,
    0, 3, 3, 3, 0,
    0, 3, 3, 3, 0,
    0, 3, 3, 3, 0,
    0, 0, 0, 0, 0,
  ],
  connections: {},
  warps: [],
  grassEncounters: [],
  waterEncounters: [
    { speciesId: 'tentacool', minLevel: 15, maxLevel: 20, weight: 60 },
  ],
});

describe('Auto-HM Settings & Strict Taught Battle Slot Move Requirement', () => {
  it('1. defaults autoHm to true in SaveManager.getDefaultOptions()', () => {
    const opts = SaveManager.getDefaultOptions();
    expect(opts.autoHm).toBe(true);
  });

  it('2. requires a party Pokémon to have SURF taught in its battle move slots', () => {
    const totodileNoSurf = PokemonFactory.create('totodile', 18, ['scratch', 'watergun']);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain', 'fog'], ['HM03']);

    // Check without move taught
    const checkNoMove = ModernHMHandler.checkSurf(validInv, new Set(['morty_defeated']), [totodileNoSurf]);
    expect(checkNoMove.canUse).toBe(false);
    expect(checkNoMove.missingReason).toContain('must know SURF in its battle moves');

    // Check with SURF taught
    const totodileWithSurf = PokemonFactory.create('totodile', 18, ['surf', 'watergun', 'bite']);
    const checkWithMove = ModernHMHandler.checkSurf(validInv, new Set(['morty_defeated']), [totodileWithSurf]);
    expect(checkWithMove.canUse).toBe(true);
    expect(checkWithMove.hasBadge).toBe(true);
    expect(checkWithMove.hasHM).toBe(true);
    expect(checkWithMove.userPokemon?.speciesId).toBe('totodile');
  });

  it('3. requires a party Pokémon to have STRENGTH taught in its battle move slots', () => {
    const geodudeNoStrength = PokemonFactory.create('geodude', 20, ['tackle', 'defensecurl']);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain'], ['HM04']);

    const checkNoMove = ModernHMHandler.checkStrength(validInv, new Set(['whitney_defeated']), [geodudeNoStrength]);
    expect(checkNoMove.canUse).toBe(false);
    expect(checkNoMove.missingReason).toContain('must know STRENGTH in its battle moves');

    const geodudeWithStrength = PokemonFactory.create('geodude', 20, ['strength', 'rockthrow']);
    const checkWithMove = ModernHMHandler.checkStrength(validInv, new Set(['whitney_defeated']), [geodudeWithStrength]);
    expect(checkWithMove.canUse).toBe(true);
    expect(checkWithMove.userPokemon?.speciesId).toBe('geodude');
  });

  it('4. requires a party Pokémon to have FLY taught in its battle move slots', () => {
    const pidgeottoNoFly = PokemonFactory.create('pidgeotto', 22, ['gust', 'quickattack']);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain', 'fog', 'storm'], ['HM02']);

    const checkNoMove = ModernHMHandler.checkFly(validInv, new Set(['chuck_defeated']), [pidgeottoNoFly]);
    expect(checkNoMove.canUse).toBe(false);
    expect(checkNoMove.missingReason).toContain('must know FLY in its battle moves');

    const pidgeottoWithFly = PokemonFactory.create('pidgeotto', 22, ['fly', 'gust', 'quickattack']);
    const checkWithMove = ModernHMHandler.checkFly(validInv, new Set(['chuck_defeated']), [pidgeottoWithFly]);
    expect(checkWithMove.canUse).toBe(true);
    expect(checkWithMove.userPokemon?.speciesId).toBe('pidgeotto');
  });

  it('5. controls water tile walkability seamlessly in MapManager via setSurfEnabled', () => {
    const map = createWaterMap();
    const mm = new MapManager();
    mm.registerMap(map);
    mm.setCurrentMap('route_40');

    expect(mm.isWalkable(0, 0)).toBe(true);

    mm.setSurfEnabled(false);
    expect(mm.isWalkable(1, 1)).toBe(false);

    mm.setSurfEnabled(true);
    expect(mm.isWalkable(1, 1)).toBe(true);
  });
});
