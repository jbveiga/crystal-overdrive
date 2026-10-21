import { describe, it, expect } from 'vitest';
import { EvolutionManager } from '../src/world/EvolutionManager';
import { PokemonFactory } from '../src/battle/PokemonFactory';

describe('EvolutionManager (Ticket 14.1 Pure Domain Evolution Engine)', () => {
  describe('1. Level-Up Evolutions', () => {
    it('blocks evolution below canonical level threshold', () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 13);
      const candidate = EvolutionManager.canEvolve(cyndaquil, { trigger: 'LEVEL_UP', level: 13 });
      expect(candidate).toBeNull();
    });

    it('triggers Johto starter evolutions at exact canonical thresholds', () => {
      // Cyndaquil -> Quilava (Lv. 14) -> Typhlosion (Lv. 36)
      const cyndaquil = PokemonFactory.create('cyndaquil', 14);
      const c1 = EvolutionManager.canEvolve(cyndaquil, { trigger: 'LEVEL_UP', level: 14 });
      expect(c1).not.toBeNull();
      expect(c1?.targetSpeciesId).toBe('quilava');

      const quilava = PokemonFactory.create('quilava', 36);
      const c2 = EvolutionManager.canEvolve(quilava, { trigger: 'LEVEL_UP', level: 36 });
      expect(c2).not.toBeNull();
      expect(c2?.targetSpeciesId).toBe('typhlosion'); // Assert canonical Gen 2 (not Hisui)

      // Totodile -> Croconaw (Lv. 18) -> Feraligatr (Lv. 30)
      const totodile = PokemonFactory.create('totodile', 18);
      expect(EvolutionManager.canEvolve(totodile, { trigger: 'LEVEL_UP', level: 18 })?.targetSpeciesId).toBe('croconaw');

      const croconaw = PokemonFactory.create('croconaw', 30);
      expect(EvolutionManager.canEvolve(croconaw, { trigger: 'LEVEL_UP', level: 30 })?.targetSpeciesId).toBe('feraligatr');

      // Chikorita -> Bayleef (Lv. 16) -> Meganium (Lv. 32)
      const chikorita = PokemonFactory.create('chikorita', 16);
      expect(EvolutionManager.canEvolve(chikorita, { trigger: 'LEVEL_UP', level: 16 })?.targetSpeciesId).toBe('bayleef');

      const bayleef = PokemonFactory.create('bayleef', 32);
      expect(EvolutionManager.canEvolve(bayleef, { trigger: 'LEVEL_UP', level: 32 })?.targetSpeciesId).toBe('meganium');
    });

    it('branches Tyrogue into Hitmonlee, Hitmonchan, or Hitmontop based on Atk vs Def stats', () => {
      const tyrogueLee = PokemonFactory.create('tyrogue', 20);
      tyrogueLee.stats.attack = 40;
      tyrogueLee.stats.defense = 30;
      expect(EvolutionManager.canEvolve(tyrogueLee, { trigger: 'LEVEL_UP', level: 20 })?.targetSpeciesId).toBe('hitmonlee');

      const tyrogueChan = PokemonFactory.create('tyrogue', 20);
      tyrogueChan.stats.attack = 30;
      tyrogueChan.stats.defense = 40;
      expect(EvolutionManager.canEvolve(tyrogueChan, { trigger: 'LEVEL_UP', level: 20 })?.targetSpeciesId).toBe('hitmonchan');

      const tyrogueTop = PokemonFactory.create('tyrogue', 20);
      tyrogueTop.stats.attack = 35;
      tyrogueTop.stats.defense = 35;
      expect(EvolutionManager.canEvolve(tyrogueTop, { trigger: 'LEVEL_UP', level: 20 })?.targetSpeciesId).toBe('hitmontop');
    });
  });

  describe('2. Everstone Evolution Suppression Invariant', () => {
    it('completely suppresses level-up evolution when holding Everstone', () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 14);
      cyndaquil.heldItem = 'everstone';
      expect(EvolutionManager.canEvolve(cyndaquil, { trigger: 'LEVEL_UP', level: 14 })).toBeNull();
    });

    it('completely suppresses item/stone evolution when holding Everstone', () => {
      const eevee = PokemonFactory.create('eevee', 25);
      eevee.heldItem = 'everstone';
      expect(EvolutionManager.canEvolve(eevee, { trigger: 'ITEM', itemId: 'water-stone' })).toBeNull();
    });

    it('completely suppresses trade/Link Cable evolution when holding Everstone', () => {
      const kadabra = PokemonFactory.create('kadabra', 28);
      kadabra.heldItem = 'everstone';
      expect(EvolutionManager.canEvolve(kadabra, { trigger: 'ITEM', itemId: 'link-cable' })).toBeNull();
    });

    it('completely suppresses friendship evolution when holding Everstone', () => {
      const togepi = PokemonFactory.create('togepi', 15);
      togepi.friendship = 255;
      togepi.heldItem = 'everstone';
      expect(EvolutionManager.canEvolve(togepi, { trigger: 'LEVEL_UP', level: 15 })).toBeNull();
    });
  });

  describe('3. Evolutionary Stones', () => {
    it('evolves Eevee into Vaporeon, Jolteon, or Flareon with elemental stones', () => {
      const eevee = PokemonFactory.create('eevee', 20);

      const water = EvolutionManager.canEvolve(eevee, { trigger: 'ITEM', itemId: 'water-stone' });
      expect(water?.targetSpeciesId).toBe('vaporeon');

      const thunder = EvolutionManager.canEvolve(eevee, { trigger: 'ITEM', itemId: 'thunder-stone' });
      expect(thunder?.targetSpeciesId).toBe('jolteon');

      const fire = EvolutionManager.canEvolve(eevee, { trigger: 'ITEM', itemId: 'fire-stone' });
      expect(fire?.targetSpeciesId).toBe('flareon');
    });

    it('evolves Gloom into Vileplume (Leaf Stone) or Bellossom (Sun Stone)', () => {
      const gloom = PokemonFactory.create('gloom', 25);

      const vileplume = EvolutionManager.canEvolve(gloom, { trigger: 'ITEM', itemId: 'leaf-stone' });
      expect(vileplume?.targetSpeciesId).toBe('vileplume');

      const bellossom = EvolutionManager.canEvolve(gloom, { trigger: 'ITEM', itemId: 'sun-stone' });
      expect(bellossom?.targetSpeciesId).toBe('bellossom');
    });

    it('returns null when an incompatible stone is used', () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 14);
      expect(EvolutionManager.canEvolve(cyndaquil, { trigger: 'ITEM', itemId: 'water-stone' })).toBeNull();
    });
  });

  describe('4. Single-Player Trade Evolutions (Link Cable / Link Stone)', () => {
    it('triggers pure trade evolutions via Link Cable or Link Stone', () => {
      const kadabra = PokemonFactory.create('kadabra', 25);
      expect(EvolutionManager.canEvolve(kadabra, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('alakazam');

      const machoke = PokemonFactory.create('machoke', 30);
      expect(EvolutionManager.canEvolve(machoke, { trigger: 'ITEM', itemId: 'link-stone' })?.targetSpeciesId).toBe('machamp');

      const haunter = PokemonFactory.create('haunter', 28);
      expect(EvolutionManager.canEvolve(haunter, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('gengar');

      const graveler = PokemonFactory.create('graveler', 28);
      expect(EvolutionManager.canEvolve(graveler, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('golem');
    });

    it('triggers held-item trade evolutions via Link Cable when holding the required item', () => {
      // Onix + Metal Coat -> Steelix
      const onix = PokemonFactory.create('onix', 30);
      expect(EvolutionManager.canEvolve(onix, { trigger: 'ITEM', itemId: 'link-cable' })).toBeNull(); // Missing held item
      onix.heldItem = 'metal-coat';
      expect(EvolutionManager.canEvolve(onix, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('steelix');

      // Scyther + Metal Coat -> Scizor
      const scyther = PokemonFactory.create('scyther', 30);
      scyther.heldItem = 'metal-coat';
      expect(EvolutionManager.canEvolve(scyther, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('scizor');

      // Seadra + Dragon Scale -> Kingdra
      const seadra = PokemonFactory.create('seadra', 32);
      seadra.heldItem = 'dragon-scale';
      expect(EvolutionManager.canEvolve(seadra, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('kingdra');

      // Slowpoke + King's Rock -> Slowking
      const slowpoke = PokemonFactory.create('slowpoke', 25);
      slowpoke.heldItem = 'kings-rock';
      expect(EvolutionManager.canEvolve(slowpoke, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('slowking');

      // Poliwhirl + King's Rock -> Politoed
      const poliwhirl = PokemonFactory.create('poliwhirl', 25);
      poliwhirl.heldItem = 'kings-rock';
      expect(EvolutionManager.canEvolve(poliwhirl, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('politoed');

      // Porygon + Up-Grade -> Porygon2
      const porygon = PokemonFactory.create('porygon', 20);
      porygon.heldItem = 'up-grade';
      expect(EvolutionManager.canEvolve(porygon, { trigger: 'ITEM', itemId: 'link-cable' })?.targetSpeciesId).toBe('porygon2');
    });

    it('allows direct use of the trade-evolution item (Unbound single-player quality of life)', () => {
      const onix = PokemonFactory.create('onix', 30);
      expect(EvolutionManager.canEvolve(onix, { trigger: 'ITEM', itemId: 'metal-coat' })?.targetSpeciesId).toBe('steelix');

      const seadra = PokemonFactory.create('seadra', 32);
      expect(EvolutionManager.canEvolve(seadra, { trigger: 'ITEM', itemId: 'dragon-scale' })?.targetSpeciesId).toBe('kingdra');
    });
  });

  describe('5. Friendship / Happiness Evolutions', () => {
    it('requires friendship >= 220 threshold', () => {
      const togepi = PokemonFactory.create('togepi', 15);
      togepi.friendship = 219;
      expect(EvolutionManager.canEvolve(togepi, { trigger: 'LEVEL_UP', level: 15 })).toBeNull();

      togepi.friendship = 220;
      expect(EvolutionManager.canEvolve(togepi, { trigger: 'LEVEL_UP', level: 15 })?.targetSpeciesId).toBe('togetic');
    });

    it('branches Eevee into Espeon (Day/Morning) vs Umbreon (Night)', () => {
      const eevee = PokemonFactory.create('eevee', 20);
      eevee.friendship = 230;

      // Morning / Day -> Espeon
      const morningEvo = EvolutionManager.canEvolve(eevee, { trigger: 'LEVEL_UP', level: 20, timeOfDay: 'MORNING' });
      expect(morningEvo?.targetSpeciesId).toBe('espeon');

      const dayEvo = EvolutionManager.canEvolve(eevee, { trigger: 'LEVEL_UP', level: 20, timeOfDay: 'DAY' });
      expect(dayEvo?.targetSpeciesId).toBe('espeon');

      // Night -> Umbreon
      const nightEvo = EvolutionManager.canEvolve(eevee, { trigger: 'LEVEL_UP', level: 20, timeOfDay: 'NIGHT' });
      expect(nightEvo?.targetSpeciesId).toBe('umbreon');
    });

    it('evolves Golbat into Crobat and Chansey into Blissey upon high friendship', () => {
      const golbat = PokemonFactory.create('golbat', 28);
      golbat.friendship = 220;
      expect(EvolutionManager.canEvolve(golbat, { trigger: 'LEVEL_UP', level: 28 })?.targetSpeciesId).toBe('crobat');

      const chansey = PokemonFactory.create('chansey', 35);
      chansey.friendship = 225;
      expect(EvolutionManager.canEvolve(chansey, { trigger: 'LEVEL_UP', level: 35 })?.targetSpeciesId).toBe('blissey');
    });

    it('evolves baby Pokémon (Pichu, Cleffa, Igglybuff) on high friendship', () => {
      const pichu = PokemonFactory.create('pichu', 10);
      pichu.friendship = 220;
      expect(EvolutionManager.canEvolve(pichu, { trigger: 'LEVEL_UP', level: 10 })?.targetSpeciesId).toBe('pikachu');

      const cleffa = PokemonFactory.create('cleffa', 10);
      cleffa.friendship = 220;
      expect(EvolutionManager.canEvolve(cleffa, { trigger: 'LEVEL_UP', level: 10 })?.targetSpeciesId).toBe('clefairy');

      const igglybuff = PokemonFactory.create('igglybuff', 10);
      igglybuff.friendship = 220;
      expect(EvolutionManager.canEvolve(igglybuff, { trigger: 'LEVEL_UP', level: 10 })?.targetSpeciesId).toBe('jigglypuff');
    });
  });

  describe('6. Transformation, Stat Recalculation & HP Preservation', () => {
    it('executes evolution, recomputes stats, updates species, and preserves proportional HP', () => {
      const cyndaquil = PokemonFactory.create('cyndaquil', 14);
      const oldMaxHp = cyndaquil.stats.hp;
      // Simulate half HP
      cyndaquil.currentHp = Math.floor(oldMaxHp / 2);
      const halfRatio = cyndaquil.currentHp / oldMaxHp;

      const evolved = EvolutionManager.executeEvolution(cyndaquil, 'quilava');

      expect(evolved.speciesId).toBe('quilava');
      expect(evolved.nickname).toBe('Quilava');
      expect(evolved.types).toEqual(['Fire']);
      expect(evolved.baseStats.hp).toBe(58);
      expect(evolved.stats.hp).toBeGreaterThan(oldMaxHp);

      // Check proportional HP
      const expectedHp = Math.max(1, Math.floor(halfRatio * evolved.stats.hp));
      expect(evolved.currentHp).toBe(expectedHp);
    });

    it('preserves custom nickname when evolving', () => {
      const totodile = PokemonFactory.create('totodile', 18);
      totodile.nickname = 'CHOMPER';

      const evolved = EvolutionManager.executeEvolution(totodile, 'croconaw');
      expect(evolved.speciesId).toBe('croconaw');
      expect(evolved.nickname).toBe('CHOMPER');
    });

    it('prevents eggs from evolving', () => {
      const egg = PokemonFactory.createEgg('cyndaquil', 100);
      expect(EvolutionManager.canEvolve(egg, { trigger: 'LEVEL_UP', level: 14 })).toBeNull();
      expect(EvolutionManager.canEvolve(egg, { trigger: 'ITEM', itemId: 'fire-stone' })).toBeNull();
    });
  });
});
