/**
 * @fileoverview ModernHMHandler domain module implementation.
 * @module world/ModernHMHandler
 * @role ModernHMHandler Component
 * @exports HMFieldMoveId, HMFieldCheckResult, ModernHMHandler
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-285: Implementation | L286-570: Handlers & Exports
 */

import type { PokemonInstance } from '../types/game';
import type { BagInventory } from '../ui/BagAndMartUI';

export type HMFieldMoveId = 'cut' | 'flash' | 'surf' | 'strength' | 'fly' | 'whirlpool' | 'waterfall';

export interface HMFieldCheckResult {
  allowed: boolean;
  canUse: boolean;
  hasBadge: boolean;
  hasHM: boolean;
  compatiblePokemon: PokemonInstance | null;
  compatiblePokemonName?: string;
  userPokemon: PokemonInstance | null;
  reason?: string;
  missingReason?: string;
}

/**
 * Canonical Gen 2 species families capable of using HM01 Cut in the field
 * without requiring the move to occupy one of the 4 active combat move slots.
 */
const CUT_COMPATIBLE_SPECIES = new Set<string>([
  // Johto & Kanto starters & evolutions
  'chikorita', 'bayleef', 'meganium',
  'cyndaquil', 'quilava', 'typhlosion',
  'totodile', 'croconaw', 'feraligatr',
  'bulbasaur', 'ivysaur', 'venusaur',
  'charmander', 'charmeleon', 'charizard',
  // Common Johto early/mid-game species
  'sentret', 'furret',
  'rattata', 'raticate',
  'bellsprout', 'weepinbell', 'victreebel',
  'oddish', 'gloom', 'vileplume', 'bellossom',
  'paras', 'parasect',
  'scyther', 'scizor',
  'pinsir', 'heracross',
  'farfetchd',
  'krabby', 'kingler',
  'sandshrew', 'sandslash',
  'diglett', 'dugtrio',
  'meowth', 'persian',
  'gligar',
  'teddiursa', 'ursaring',
  'aipom',
  'sneasel',
  'skarmory',
  'raikou', 'entei', 'suicune',
  'mew', 'celebi',
]);

/**
 * Canonical Gen 2 species families capable of using HM05 Flash in the field
 * without requiring the move to occupy one of the 4 active combat move slots.
 */
const FLASH_COMPATIBLE_SPECIES = new Set<string>([
  'chikorita', 'bayleef', 'meganium',
  'bulbasaur', 'ivysaur', 'venusaur',
  'pikachu', 'raichu', 'pichu',
  'mareep', 'flaaffy', 'ampharos',
  'magnemite', 'magneton',
  'voltorb', 'electrode',
  'jolteon', 'espeon', 'umbreon',
  'hoothoot', 'noctowl',
  'ledyba', 'ledian',
  'spinarak', 'ariados',
  'bellsprout', 'weepinbell', 'victreebel',
  'oddish', 'gloom', 'vileplume', 'bellossom',
  'paras', 'parasect',
  'abra', 'kadabra', 'alakazam',
  'drowzee', 'hypno',
  'slowpoke', 'slowbro', 'slowking',
  'staryu', 'starmie',
  'clefairy', 'clefable', 'cleffa',
  'jigglypuff', 'wigglytuff', 'igglybuff',
  'togepi', 'togetic',
  'natu', 'xatu',
  'girafarig',
  'dunsparce',
  'snubbull', 'granbull',
  'shuckle',
  'wooper', 'quagsire',
  'chinchou', 'lanturn',
  'elekid', 'electabuzz',
  'smoochum', 'jynx',
  'porygon', 'porygon2',
  'blissey', 'chansey',
  'raikou', 'entei', 'suicune',
  'mewtwo', 'mew', 'celebi',
]);

const SURF_COMPATIBLE_SPECIES = new Set<string>([
  'totodile', 'croconaw', 'feraligatr', 'squirtle', 'wartortle', 'blastoise',
  'poliwag', 'poliwhirl', 'poliwrath', 'politoed', 'psyduck', 'golduck',
  'tentacool', 'tentacruel', 'slowpoke', 'slowbro', 'slowking', 'seel', 'dewgong',
  'shellder', 'cloyster', 'krabby', 'kingler', 'horsea', 'seadra', 'kingdra',
  'goldeen', 'seaking', 'staryu', 'starmie', 'gyarados', 'lapras', 'vaporeon',
  'omanyte', 'omastar', 'kabuto', 'kabutops', 'snorlax', 'dratini', 'dragonair', 'dragonite',
  'wooper', 'quagsire', 'qwilfish', 'corsola', 'remoraid', 'octillery', 'mantine',
  'suicune', 'lugia', 'mewtwo', 'mew', 'furret', 'sentret', 'azumarill', 'marill', 'chinchou', 'lanturn',
]);

const STRENGTH_COMPATIBLE_SPECIES = new Set<string>([
  'totodile', 'croconaw', 'feraligatr', 'meganium', 'typhlosion',
  'geodude', 'graveler', 'golem', 'onix', 'steelix', 'machop', 'machoke', 'machamp',
  'heracross', 'snorlax', 'ursaring', 'teddiursa', 'phanpy', 'donphan', 'tyranitar', 'pupitar', 'larvitar',
  'rhyhorn', 'rhydon', 'tauros', 'miltank', 'kangaskhan', 'pinsir', 'scizor', 'gyarados', 'poliwrath',
  'entei', 'raikou', 'suicune', 'mewtwo', 'mew',
]);

const FLY_COMPATIBLE_SPECIES = new Set<string>([
  'pidgey', 'pidgeotto', 'pidgeot', 'spearow', 'fearow', 'zubat', 'golbat', 'crobat',
  'farfetchd', 'doduo', 'dodrio', 'aerodactyl', 'dragonite', 'hoothoot', 'noctowl',
  'togetic', 'xatu', 'natu', 'murkrow', 'skarmory', 'charizard', 'lugia', 'ho-oh', 'mew',
]);

const WHIRLPOOL_COMPATIBLE_SPECIES = new Set<string>([
  'squirtle', 'wartortle', 'blastoise', 'psyduck', 'golduck', 'poliwag', 'poliwhirl', 'poliwrath',
  'tentacool', 'tentacruel', 'slowpoke', 'slowbro', 'seel', 'dewgong', 'shellder', 'cloyster',
  'krabby', 'kingler', 'horsea', 'seadra', 'goldeen', 'seaking', 'staryu', 'starmie', 'gyarados',
  'lapras', 'vaporeon', 'omanyte', 'omastar', 'kabuto', 'kabutops', 'totodile', 'croconaw',
  'feraligatr', 'chinchou', 'lanturn', 'marill', 'azumarill', 'politoed', 'wooper', 'quagsire',
  'slowking', 'qwilfish', 'corsola', 'remoraid', 'octillery', 'mantine', 'kingdra', 'suicune', 'lugia',
]);

export class ModernHMHandler {
  /**
   * Checks whether a given species is innately compatible with the specified HM field move.
   */
  public static canSpeciesUseFieldHM(speciesId: string, moveId: HMFieldMoveId): boolean {
    const normalized = (speciesId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalized) return false;
    if (moveId === 'cut') {
      return CUT_COMPATIBLE_SPECIES.has(normalized);
    }
    if (moveId === 'flash') {
      return FLASH_COMPATIBLE_SPECIES.has(normalized);
    }
    if (moveId === 'surf') {
      return SURF_COMPATIBLE_SPECIES.has(normalized);
    }
    if (moveId === 'strength') {
      return STRENGTH_COMPATIBLE_SPECIES.has(normalized);
    }
    if (moveId === 'fly') {
      return FLY_COMPATIBLE_SPECIES.has(normalized);
    }
    if (moveId === 'whirlpool' || moveId === 'waterfall') {
      return WHIRLPOOL_COMPATIBLE_SPECIES.has(normalized);
    }
    return false;
  }

  private static makeResult(
    allowed: boolean,
    hasBadge: boolean,
    hasHM: boolean,
    compatiblePokemon: PokemonInstance | null,
    reason?: string
  ): HMFieldCheckResult {
    return {
      allowed,
      canUse: allowed,
      hasBadge,
      hasHM,
      compatiblePokemon,
      compatiblePokemonName: compatiblePokemon
        ? compatiblePokemon.nickname || compatiblePokemon.speciesId.toUpperCase()
        : undefined,
      userPokemon: compatiblePokemon,
      reason,
      missingReason: reason,
    };
  }

  /**
   * Evaluates whether the player can use HM01 Cut in the overworld right now.
   * Modern HM System: Does NOT require any party Pokémon to sacrifice one of its 4 battle move slots.
   */
  public static checkCut(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[]
  ): HMFieldCheckResult {
    const badges = inventory?.badges || [];
    const tms = inventory?.tms || [];

    const hasBadge =
      badges.includes('hive') ||
      badges.includes('hive_badge') ||
      storyFlags.has('CAN_USE_CUT') ||
      storyFlags.has('bugsy_defeated');

    const partyKnowsCut = party.find(
      (p) => !p.isEgg && p.moves.some((m) => m.moveId.toLowerCase() === 'cut')
    );

    const hasHM =
      tms.includes('HM01') ||
      tms.includes('HM01_CUT') ||
      storyFlags.has('has_hm01_cut') ||
      storyFlags.has('EVENT_GOT_HM01_CUT') ||
      Boolean(partyKnowsCut);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsCut ||
      nonEggParty.find((p) => this.canSpeciesUseFieldHM(p.speciesId, 'cut')) ||
      nonEggParty.find((p) => p.types.includes('Grass') || p.types.includes('Bug') || p.types.includes('Normal')) ||
      nonEggParty[0] ||
      null;

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false,
        false,
        false,
        compatiblePokemon,
        'This tree looks like it can be CUT down! You need HM01 CUT and the HIVE BADGE from Azalea Gym.'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false,
        true,
        false,
        compatiblePokemon,
        'This tree looks like it can be CUT down! Help the Charcoal Master in Ilex Forest to obtain HM01 CUT.'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false,
        false,
        true,
        compatiblePokemon,
        'This tree looks like it can be CUT down! Defeat Leader Bugsy at Azalea Gym to earn the HIVE BADGE first.'
      );
    }

    if (!partyKnowsCut) {
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        compatiblePokemon,
        'A POKéMON in your party must know CUT in its battle moves to clear this tree!'
      );
    }

    return this.makeResult(true, true, true, partyKnowsCut);
  }

  /**
   * Evaluates whether the player can use HM05 Flash in the overworld right now.
   * Modern HM System: Does NOT require any party Pokémon to sacrifice one of its 4 battle move slots.
   */
  public static checkFlash(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[]
  ): HMFieldCheckResult {
    const badges = inventory?.badges || [];
    const tms = inventory?.tms || [];

    const hasBadge =
      badges.includes('zephyr') ||
      badges.includes('zephyr_badge') ||
      storyFlags.has('CAN_USE_FLASH') ||
      storyFlags.has('falkner_defeated');

    const partyKnowsFlash = party.find(
      (p) => !p.isEgg && p.moves.some((m) => m.moveId.toLowerCase() === 'flash')
    );

    const hasHM =
      tms.includes('HM05') ||
      tms.includes('HM05_FLASH') ||
      storyFlags.has('EVENT_GOT_HM05_FLASH') ||
      storyFlags.has('sprout_tower_cleared') ||
      Boolean(partyKnowsFlash);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsFlash ||
      nonEggParty.find((p) => this.canSpeciesUseFieldHM(p.speciesId, 'flash')) ||
      nonEggParty.find(
        (p) =>
          p.types.includes('Electric') ||
          p.types.includes('Psychic') ||
          p.types.includes('Grass') ||
          p.types.includes('Normal')
      ) ||
      nonEggParty[0] ||
      null;

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false,
        false,
        false,
        compatiblePokemon,
        'It is pitch-black inside! Obtain HM05 FLASH from Sprout Tower and the ZEPHYR BADGE from Violet Gym to light the way.'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false,
        true,
        false,
        compatiblePokemon,
        'It is pitch-black inside! Defeat Elder Li atop Sprout Tower to receive HM05 FLASH.'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false,
        false,
        true,
        compatiblePokemon,
        'It is pitch-black inside! Defeat Leader Falkner at Violet Gym to earn the ZEPHYR BADGE and use FLASH in the field.'
      );
    }

    if (!partyKnowsFlash) {
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        compatiblePokemon,
        'A POKéMON in your party must know FLASH in its battle moves to light up the dark!'
      );
    }

    return this.makeResult(true, true, true, partyKnowsFlash);
  }

  /**
   * Evaluates whether the player can use HM03 Surf in the overworld right now.
   */
  public static checkSurf(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[]
  ): HMFieldCheckResult {
    const badges = inventory?.badges || [];
    const tms = inventory?.tms || [];

    const hasBadge =
      badges.includes('fog') ||
      badges.includes('fog_badge') ||
      storyFlags.has('morty_defeated') ||
      storyFlags.has('CAN_USE_SURF');

    const partyKnowsSurf = party.find(
      (p) => !p.isEgg && p.moves.some((m) => m.moveId.toLowerCase() === 'surf')
    );

    const hasHM =
      tms.includes('HM03') ||
      tms.includes('HM03_SURF') ||
      storyFlags.has('has_hm03_surf') ||
      storyFlags.has('EVENT_GOT_HM03_SURF') ||
      Boolean(partyKnowsSurf);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsSurf ||
      nonEggParty.find((p) => this.canSpeciesUseFieldHM(p.speciesId, 'surf')) ||
      nonEggParty.find((p) => p.types.includes('Water')) ||
      nonEggParty[0] ||
      null;

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false,
        false,
        false,
        compatiblePokemon,
        'The water is dyed a deep blue... You need HM03 SURF and the FOG BADGE from Ecruteak Gym to surf!'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false,
        true,
        false,
        compatiblePokemon,
        'The water is dyed a deep blue... Defeat the Kimono Girls at Ecruteak Dance Theater to receive HM03 SURF!'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false,
        false,
        true,
        compatiblePokemon,
        'The water is dyed a deep blue... Defeat Leader Morty at Ecruteak Gym to earn the FOG BADGE and surf across water!'
      );
    }

    if (!partyKnowsSurf) {
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        compatiblePokemon,
        'A POKéMON in your party must know SURF in its battle moves to surf on water!'
      );
    }

    return this.makeResult(true, true, true, partyKnowsSurf);
  }

  /**
   * Evaluates whether the player can use HM04 Strength in the overworld right now.
   */
  public static checkStrength(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[]
  ): HMFieldCheckResult {
    const badges = inventory?.badges || [];
    const tms = inventory?.tms || [];

    const hasBadge =
      badges.includes('plain') ||
      badges.includes('plain_badge') ||
      storyFlags.has('whitney_defeated') ||
      storyFlags.has('CAN_USE_STRENGTH');

    const partyKnowsStrength = party.find(
      (p) => !p.isEgg && p.moves.some((m) => m.moveId.toLowerCase() === 'strength')
    );

    const hasHM =
      tms.includes('HM04') ||
      tms.includes('HM04_STRENGTH') ||
      storyFlags.has('has_hm04_strength') ||
      storyFlags.has('EVENT_GOT_HM04_STRENGTH') ||
      Boolean(partyKnowsStrength);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsStrength ||
      nonEggParty.find((p) => this.canSpeciesUseFieldHM(p.speciesId, 'strength')) ||
      nonEggParty.find((p) => p.types.includes('Rock') || p.types.includes('Fighting') || p.types.includes('Normal')) ||
      nonEggParty[0] ||
      null;

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false,
        false,
        false,
        compatiblePokemon,
        'A boulder is blocking the path! You need HM04 STRENGTH and the PLAIN BADGE from Goldenrod Gym.'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false,
        true,
        false,
        compatiblePokemon,
        'A boulder is blocking the path! Visit the Sailor at Olivine Café to receive HM04 STRENGTH.'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false,
        false,
        true,
        compatiblePokemon,
        'A boulder is blocking the path! Defeat Leader Whitney at Goldenrod Gym to earn the PLAIN BADGE and move boulders.'
      );
    }

    if (!partyKnowsStrength) {
      return this.makeResult(false, hasBadge, hasHM, compatiblePokemon,
        'A POKéMON in your party must know STRENGTH in its battle moves to push boulders!');
    }

    return this.makeResult(true, true, true, partyKnowsStrength);
  }

  public static canUseStrength(
    party: PokemonInstance[],
    inventory: BagInventory,
    storyFlags: Set<string> = new Set()
  ): HMFieldCheckResult {
    return this.checkStrength(inventory, storyFlags, party);
  }

  /**
   * Evaluates whether the player can use HM02 Fly in the overworld right now.
   */
  public static checkFly(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[]
  ): HMFieldCheckResult {
    const badges = inventory?.badges || [];
    const tms = inventory?.tms || [];

    const hasBadge =
      badges.includes('storm') ||
      badges.includes('storm_badge') ||
      storyFlags.has('chuck_defeated') ||
      storyFlags.has('CAN_USE_FLY');

    const partyKnowsFly = party.find(
      (p) => !p.isEgg && p.moves.some((m) => m.moveId.toLowerCase() === 'fly')
    );

    const hasHM =
      tms.includes('HM02') ||
      tms.includes('HM02_FLY') ||
      storyFlags.has('has_hm02_fly') ||
      storyFlags.has('EVENT_GOT_HM02_FLY') ||
      Boolean(partyKnowsFly);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsFly ||
      nonEggParty.find((p) => this.canSpeciesUseFieldHM(p.speciesId, 'fly')) ||
      nonEggParty.find((p) => p.types.includes('Flying')) ||
      nonEggParty[0] ||
      null;

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false,
        false,
        false,
        compatiblePokemon,
        'You need HM02 FLY and the STORM BADGE from Cianwood Gym to fly to previously visited towns!'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false,
        true,
        false,
        compatiblePokemon,
        'Talk to Chuck\'s Wife outside Cianwood Gym to receive HM02 FLY!'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false,
        false,
        true,
        compatiblePokemon,
        'Defeat Leader Chuck at Cianwood Gym to earn the STORM BADGE and use FLY in the field!'
      );
    }

    if (!partyKnowsFly) {
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        compatiblePokemon,
        'A POKéMON in your party must know FLY in its battle moves to fly across the sky!'
      );
    }

    return this.makeResult(true, true, true, partyKnowsFly);
  }

  /**
   * Evaluates whether the player can use HM06 Whirlpool in the overworld right now.
   * Requires Glacier Badge from Mahogany Gym and HM06 Whirlpool.
   */
  public static canUseWhirlpool(
    party: PokemonInstance[],
    inventory: BagInventory,
    storyFlags: Set<string>
  ): HMFieldCheckResult {
    return this.checkWhirlpool(inventory, storyFlags, party);
  }

  public static checkWhirlpool(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[]
  ): HMFieldCheckResult {
    const badges = inventory?.badges || [];
    const tms = inventory?.tms || [];

    const hasBadge =
      badges.includes('glacier') ||
      badges.includes('glacier_badge') ||
      storyFlags.has('pryce_defeated') ||
      storyFlags.has('glacierbadge');

    const partyKnowsWhirlpool = party.find(
      (p) => !p.isEgg && p.moves.some((m) => m.moveId.toLowerCase() === 'whirlpool')
    );

    const hasHM =
      tms.includes('HM06') ||
      tms.includes('HM06_WHIRLPOOL') ||
      storyFlags.has('has_hm06_whirlpool') ||
      storyFlags.has('EVENT_GOT_HM06_WHIRLPOOL') ||
      Boolean(partyKnowsWhirlpool);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsWhirlpool ||
      nonEggParty.find((p) => this.canSpeciesUseFieldHM(p.speciesId, 'whirlpool')) ||
      nonEggParty.find((p) => p.types.includes('Water')) ||
      null;

    if (!compatiblePokemon) {
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        null,
        'It is a fierce whirlpool! You need a compatible Pokémon that knows Whirlpool or can learn it.'
      );
    }

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false,
        false,
        false,
        compatiblePokemon,
        'It is a fierce whirlpool! You need HM06 WHIRLPOOL and the GLACIER BADGE from Mahogany Gym.'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false,
        true,
        false,
        compatiblePokemon,
        'It is a fierce whirlpool! Free the Pokémon in Team Rocket Hideout to receive HM06 WHIRLPOOL.'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false,
        false,
        true,
        compatiblePokemon,
        'It is a fierce whirlpool! Defeat Leader Pryce at Mahogany Gym to earn the GLACIER BADGE first.'
      );
    }

    return this.makeResult(true, true, true, compatiblePokemon);
  }

  /**
   * Evaluates requirements for traversing a vertical cascading waterfall (HM07 Waterfall).
   * Requires RISING BADGE from Blackthorn Gym and HM07 Waterfall.
   */
  public static canUseWaterfall(
    party: PokemonInstance[],
    inventory: BagInventory | Partial<BagInventory>,
    storyFlags: Set<string> = new Set()
  ): HMFieldCheckResult {
    const badges = (inventory.badges || []).map((b) => b.toLowerCase());
    const tms = (inventory.tms || []).map((t) => t.toUpperCase());

    const hasBadge =
      badges.includes('rising') ||
      badges.includes('rising_badge') ||
      badges.includes('risingbadge') ||
      storyFlags.has('clair_defeated') ||
      storyFlags.has('has_rising_badge') ||
      storyFlags.has('risingbadge');

    const partyKnowsWaterfall = party.find(
      (p) => !p.isEgg && p.moves?.some((m) => m.moveId.toLowerCase() === 'waterfall')
    );

    const hasHM =
      tms.includes('HM07') ||
      tms.includes('HM07_WATERFALL') ||
      storyFlags.has('has_hm07_waterfall') ||
      storyFlags.has('EVENT_GOT_HM07_WATERFALL') ||
      Boolean(partyKnowsWaterfall);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsWaterfall ||
      nonEggParty.find((p) => this.canSpeciesUseFieldHM(p.speciesId, 'waterfall')) ||
      nonEggParty.find((p) => p.types?.includes('Water')) ||
      null;

    if (!compatiblePokemon) {
      return this.makeResult(
        false, hasBadge, hasHM, null,
        'A wall of rushing water cascades downward! You need a compatible Pokémon that knows Waterfall or can learn it.'
      );
    }

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false, false, false, compatiblePokemon,
        'A wall of rushing water cascades downward! You need HM07 WATERFALL and the RISING BADGE from Blackthorn Gym.'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false, true, false, compatiblePokemon,
        'A wall of rushing water cascades downward! Explore the Ice Path to find HM07 WATERFALL.'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false, false, true, compatiblePokemon,
        'A wall of rushing water cascades downward! Defeat Leader Clair at Blackthorn Gym to earn the RISING BADGE first.'
      );
    }

    return this.makeResult(true, true, true, compatiblePokemon);
  }
}
