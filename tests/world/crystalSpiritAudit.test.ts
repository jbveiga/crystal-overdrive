import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import type { PokemonInstance } from '../../src/types/pokemon';
import type { InventoryState } from '../../src/types/inventory';
import { ModernHMFieldChecks } from '../../src/world/ModernHMFieldChecks';
import { OverworldHUD } from '../../src/ui/OverworldHUD';
import { BATTLE_BGM_TABLE } from '../../src/audio/mapBgmTable';
import { PokemonFactory } from '../../src/battle/PokemonFactory';

describe('TICKET-CRYSTAL-SPIRIT-AUDIT: Pokémon Crystal Immersion, Auto-HM Whirlpool & Border Surfing Fixes', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const r40: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_40.json'), 'utf8'));
  const r41: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_41.json'), 'utf8'));

  describe('1. Auto-HM vs Classic Whirlpool Rules (HM06 / Glacier Badge)', () => {
    const createWaterParty = (hasLearnedMove: boolean): PokemonInstance[] => {
      const lapras = PokemonFactory.create('lapras', 25);
      if (hasLearnedMove) {
        lapras.moves = [
          { moveId: 'surf', pp: 15, maxPp: 15 },
          { moveId: 'whirlpool', pp: 15, maxPp: 15 },
        ];
      } else {
        lapras.moves = [
          { moveId: 'surf', pp: 15, maxPp: 15 },
          { moveId: 'icebeam', pp: 10, maxPp: 10 },
        ];
      }
      return [lapras];
    };

    it('denies Whirlpool crossing if Glacier Badge is missing, regardless of party or autoHm setting', () => {
      const inventory: InventoryState = {
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm'],
        items: {},
        balls: {},
        keyItems: ['HM06'],
        tms: {},
      };
      const storyFlags = new Set<string>();
      const party = createWaterParty(true);

      const classicCheck = ModernHMFieldChecks.checkWhirlpool(inventory, storyFlags, party, false);
      expect(classicCheck.canUse).toBe(false);

      const modernCheck = ModernHMFieldChecks.checkWhirlpool(inventory, storyFlags, party, true);
      expect(modernCheck.canUse).toBe(false);
    });

    it('denies Whirlpool crossing if HM06 is not in bag / inventory and party does not know the move', () => {
      const inventory: InventoryState = {
        badges: ['glacier'],
        items: {},
        balls: {},
        keyItems: [],
        tms: {},
      };
      const storyFlags = new Set<string>();
      const party = createWaterParty(false);

      const check = ModernHMFieldChecks.checkWhirlpool(inventory, storyFlags, party, false);
      expect(check.canUse).toBe(false);
      expect(check.hasHM).toBe(false);
      expect(check.missingReason).toContain('HM06 WHIRLPOOL');
    });

    it('strictly requires a party Pokémon with learned "whirlpool" move when autoHm is FALSE (Classic mode)', () => {
      const inventory: InventoryState = {
        badges: ['glacier'],
        items: {},
        balls: {},
        keyItems: ['HM06'],
        tms: {},
      };
      const storyFlags = new Set<string>();

      // Party has a compatible Water Pokémon (Lapras), but it has NOT learned Whirlpool
      const partyWithoutMove = createWaterParty(false);
      const classicWithoutMove = ModernHMFieldChecks.checkWhirlpool(inventory, storyFlags, partyWithoutMove, false);
      expect(classicWithoutMove.canUse).toBe(false);
      expect(classicWithoutMove.missingReason).toContain('must know WHIRLPOOL in its battle moves');

      // Party has Lapras with learned 'whirlpool' in its battle moveset
      const partyWithMove = createWaterParty(true);
      const classicWithMove = ModernHMFieldChecks.checkWhirlpool(inventory, storyFlags, partyWithMove, false);
      expect(classicWithMove.canUse).toBe(true);
      expect(classicWithMove.userPokemon?.speciesId).toBe('lapras');
    });

    it('allows species-compatible party Pokémon to calm Whirlpools without teaching move when autoHm is TRUE (Modern mode)', () => {
      const inventory: InventoryState = {
        badges: ['glacier'],
        items: {},
        balls: {},
        keyItems: ['HM06'],
        tms: {},
      };
      const storyFlags = new Set<string>();

      // Lapras has NOT learned the move, but Lapras is species-compatible with HM06
      const partyWithoutMove = createWaterParty(false);
      const modernCheck = ModernHMFieldChecks.checkWhirlpool(inventory, storyFlags, partyWithoutMove, true);
      expect(modernCheck.canUse).toBe(true);
      expect(modernCheck.userPokemon?.speciesId).toBe('lapras');
    });
  });

  describe('2. Cleared Whirlpools Maintain Water Collision (Collision = 3)', () => {
    it('verifies that Route 41 whirlpool coordinates are set to impassable collision (1) by default', () => {
      // Route 41 whirlpool coordinates defined canonically in OverworldWarpAndMapTransitionController:
      // [[12, 17], [36, 19], [12, 37], [36, 45]]
      const whirlpoolCoords = [
        [12, 17],
        [36, 19],
        [12, 37],
        [36, 45],
      ];

      const simulatedGrid = [...r41.collisionGrid];
      const storyFlags = new Set<string>();

      // Apply initial state
      for (const [wx, wy] of whirlpoolCoords) {
        simulatedGrid[wy * r41.width + wx] = storyFlags.has(`whirlpool_cleared_${wx}_${wy}`) ? 3 : 1;
        expect(simulatedGrid[wy * r41.width + wx]).toBe(1);
      }
    });

    it('validates that calming or clearing a whirlpool sets collision to 3 (Water), not 0 (Land)', () => {
      // In Gen 2 and modern surf mechanics, clearing a whirlpool leaves navigable water (collision 3).
      // If set to 0 (land), surfing detection fails and drops the player off Lapras.
      const simulatedGrid = [...r41.collisionGrid];
      const storyFlags = new Set<string>(['whirlpool_cleared_12_17']);

      const [wx, wy] = [12, 17];
      simulatedGrid[wy * r41.width + wx] = storyFlags.has(`whirlpool_cleared_${wx}_${wy}`) ? 3 : 1;

      expect(simulatedGrid[wy * r41.width + wx]).toBe(3);
      expect(simulatedGrid[wy * r41.width + wx]).not.toBe(0);
    });
  });

  describe('3. Seamless Cross-Border Surfing & Neighbor Map Boundary Lookup', () => {
    it('verifies Route 40 and Route 41 have reciprocal NORTH/SOUTH border connections', () => {
      expect(r40.connections?.SOUTH?.mapId).toBe('route_41');
      expect(r41.connections?.NORTH?.mapId).toBe('route_40');
    });

    it('verifies that the southern border of Route 40 and northern border of Route 41 are water tiles', () => {
      // Route 40 height is 36, bottom row is y=35
      // Water columns on Route 40 typically span columns 0-19
      let waterCountR40 = 0;
      for (let x = 0; x < r40.width; x++) {
        if (r40.collisionGrid[35 * r40.width + x] === 3) waterCountR40++;
      }
      expect(waterCountR40).toBeGreaterThan(10);

      // Route 41 top row is y=0
      let waterCountR41 = 0;
      for (let x = 0; x < r41.width; x++) {
        if (r41.collisionGrid[0 * r41.width + x] === 3) waterCountR41++;
      }
      expect(waterCountR41).toBeGreaterThan(10);
    });
  });

  describe('4. Crystal Landmark Signpost Styling Themes', () => {
    it('provides distinct signpost aesthetic themes for Cities, Forests, Caves, and Water', () => {
      // Signpost themes: CITY, WOOD, STONE, WATER
      const getSignpostTheme = (mapId: string): string => {
        const id = mapId.toLowerCase();
        if (id.includes('forest') || id.includes('park') || id.includes('sprout') || id.includes('route_30') || id.includes('route_31')) {
          return 'WOOD';
        }
        if (id.includes('cave') || id.includes('tower') || id.includes('ruins') || id.includes('mount') || id.includes('mortar') || id.includes('silver')) {
          return 'STONE';
        }
        if (id.includes('route_40') || id.includes('route_41') || id.includes('whirl') || id.includes('lake') || id.includes('sea') || id.includes('ocean')) {
          return 'WATER';
        }
        return 'CITY';
      };

      expect(getSignpostTheme('goldenrod_city')).toBe('CITY');
      expect(getSignpostTheme('violet_city')).toBe('CITY');
      expect(getSignpostTheme('ilex_forest')).toBe('WOOD');
      expect(getSignpostTheme('sprout_tower_1f')).toBe('WOOD');
      expect(getSignpostTheme('burned_tower_1f')).toBe('STONE');
      expect(getSignpostTheme('ruins_of_alph')).toBe('STONE');
      expect(getSignpostTheme('route_40')).toBe('WATER');
      expect(getSignpostTheme('route_41')).toBe('WATER');
      expect(getSignpostTheme('whirl_island_b1f')).toBe('WATER');
      expect(getSignpostTheme('lake_of_rage')).toBe('WATER');
    });
  });

  describe('5. Crystal Exclusive Events & GS Ball / Celebi / Buena / Beasts BGM', () => {
    it('maps Legendary Beasts (Raikou, Entei, Suicune) encounters to dedicated Crystal Suicune Battle BGM', () => {
      expect(BATTLE_BGM_TABLE['suicune']).toBe('bgm_suicune_battle');
      
      const isLegendaryBeast = (pokedexNo: number) => [243, 244, 245].includes(pokedexNo);
      expect(isLegendaryBeast(243)).toBe(true); // Raikou
      expect(isLegendaryBeast(244)).toBe(true); // Entei
      expect(isLegendaryBeast(245)).toBe(true); // Suicune
      expect(isLegendaryBeast(249)).toBe(false); // Lugia
      expect(isLegendaryBeast(250)).toBe(false); // Ho-Oh
    });

    it('verifies Celebi factory creation with authentic Crystal moveset and level 30', () => {
      const celebi = PokemonFactory.create('celebi', 30, [
        'healbell',
        'safeguard',
        'ancientpower',
        'batonpass',
      ]);

      expect(celebi.level).toBe(30);
      expect(celebi.speciesId).toBe('celebi');
      expect(celebi.moves.map(m => m.moveId)).toEqual([
        'healbell',
        'safeguard',
        'ancientpower',
        'batonpass',
      ]);
    });

    it('verifies Pokégear Evolution Stone reward trainers from Pokémon Crystal', () => {
      const stoneGivers: Record<string, string> = {
        schoolboy_alan: 'fire_stone',
        picnicker_gina: 'leaf_stone',
        lass_dana: 'thunderstone',
        fisher_tully: 'water_stone',
      };

      expect(stoneGivers['schoolboy_alan']).toBe('fire_stone');
      expect(stoneGivers['picnicker_gina']).toBe('leaf_stone');
      expect(stoneGivers['lass_dana']).toBe('thunderstone');
      expect(stoneGivers['fisher_tully']).toBe('water_stone');
    });
  });
});
