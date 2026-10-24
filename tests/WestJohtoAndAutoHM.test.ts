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

describe('Unbound-Style Auto-HM Settings & Extended Modern HM System', () => {
  it('1. defaults autoHm to true in SaveManager.getDefaultOptions()', () => {
    const opts = SaveManager.getDefaultOptions();
    expect(opts.autoHm).toBe(true);
  });

  it('2. evaluates HM03 Surf availability via ModernHMHandler.checkSurf with Fog Badge + HM03', () => {
    const totodile = PokemonFactory.create('totodile', 18);
    const noBadgeInv = createMockInventory(['zephyr', 'hive', 'plain'], ['HM03']);
    const noBadgeCheck = ModernHMHandler.checkSurf(noBadgeInv, new Set(), [totodile]);
    expect(noBadgeCheck.canUse).toBe(false);
    expect(noBadgeCheck.missingReason).toContain('FOG BADGE');

    const validInv = createMockInventory(['zephyr', 'hive', 'plain', 'fog'], ['HM03']);
    const validCheck = ModernHMHandler.checkSurf(validInv, new Set(['morty_defeated']), [totodile]);
    expect(validCheck.canUse).toBe(true);
    expect(validCheck.hasBadge).toBe(true);
    expect(validCheck.hasHM).toBe(true);
    expect(validCheck.userPokemon?.speciesId).toBe('totodile');
  });

  it('3. evaluates HM04 Strength availability via ModernHMHandler.checkStrength with Plain Badge + HM04', () => {
    const geodude = PokemonFactory.create('geodude', 20);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain'], ['HM04']);
    const validCheck = ModernHMHandler.checkStrength(validInv, new Set(['whitney_defeated']), [geodude]);
    expect(validCheck.canUse).toBe(true);
    expect(validCheck.userPokemon?.speciesId).toBe('geodude');
  });

  it('4. evaluates HM02 Fly availability via ModernHMHandler.checkFly with Storm Badge + HM02', () => {
    const pidgeotto = PokemonFactory.create('pidgeotto', 22);
    const validInv = createMockInventory(['zephyr', 'hive', 'plain', 'fog', 'storm'], ['HM02']);
    const validCheck = ModernHMHandler.checkFly(validInv, new Set(['chuck_defeated']), [pidgeotto]);
    expect(validCheck.canUse).toBe(true);
    expect(validCheck.userPokemon?.speciesId).toBe('pidgeotto');
  });

  it('5. controls water tile walkability seamlessly in MapManager via setSurfEnabled', () => {
    const map = createWaterMap();
    const mm = new MapManager();
    mm.registerMap(map);
    mm.setCurrentMap('route_40');

    // On ground tile (0, 0)
    expect(mm.isWalkable(0, 0)).toBe(true);

    // On water tile (1, 1) when Surf is disabled
    mm.setSurfEnabled(false);
    expect(mm.isWalkable(1, 1)).toBe(false);

    // On water tile (1, 1) when Surf is enabled (Auto-HM ON)
    mm.setSurfEnabled(true);
    expect(mm.isWalkable(1, 1)).toBe(true);
  });
});
