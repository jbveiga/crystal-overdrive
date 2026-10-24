import type { PokemonInstance } from '../types/game';
import type { BagInventory } from '../ui/BagAndMartUI';

export type HMFieldMoveId = 'cut' | 'flash';

export interface HMFieldCheckResult {
  allowed: boolean;
  canUse: boolean;
  hasBadge: boolean;
  hasHM: boolean;
  compatiblePokemon: PokemonInstance | null;
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

    if (!compatiblePokemon) {
      return this.makeResult(
        false,
        true,
        true,
        null,
        'You need an active POKéMON in your party to use CUT!'
      );
    }

    return this.makeResult(true, true, true, compatiblePokemon);
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

    if (!compatiblePokemon) {
      return this.makeResult(
        false,
        true,
        true,
        null,
        'You need an active POKéMON in your party to use FLASH!'
      );
    }

    return this.makeResult(true, true, true, compatiblePokemon);
  }
}
