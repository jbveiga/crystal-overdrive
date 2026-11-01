/**
 * @fileoverview ModernHMFieldChecks domain module implementation.
 * @module world/ModernHMFieldChecks
 * @role Field move checks for Strength, Fly, Whirlpool, and Waterfall
 * @exports ModernHMFieldChecks
 * @layer world
 * @sections L1-165: Strength & Fly Checks | L166-325: Whirlpool & Waterfall Checks
 */

import type { PokemonInstance } from '../types/game';
import type { BagInventory } from '../ui/BagAndMartUI';
import { ModernHMHandler, type HMFieldCheckResult } from './ModernHMHandler';

export class ModernHMFieldChecks {
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
      nonEggParty.find((p) => ModernHMHandler.canSpeciesUseFieldHM(p.speciesId, 'strength')) ||
      nonEggParty.find(
        (p) =>
          p.types.includes('Rock') || p.types.includes('Fighting') || p.types.includes('Normal')
      ) ||
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
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        compatiblePokemon,
        'A POKéMON in your party must know STRENGTH in its battle moves to push boulders!'
      );
    }

    return this.makeResult(true, true, true, partyKnowsStrength);
  }

  public static checkFly(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[],
    autoHm: boolean = false
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
    const partyCanBeTaughtFly =
      partyKnowsFly ||
      nonEggParty.find((p) => ModernHMHandler.canSpeciesUseFieldHM(p.speciesId, 'fly')) ||
      null;

    const compatiblePokemon =
      partyCanBeTaughtFly ||
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
        "Talk to Chuck's Wife outside Cianwood Gym to receive HM02 FLY!"
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

    if (autoHm) {
      if (!partyCanBeTaughtFly) {
        return this.makeResult(
          false,
          hasBadge,
          hasHM,
          null,
          'You need a POKéMON in your party that can be taught FLY to use Fast Travel!'
        );
      }
      return this.makeResult(true, true, true, partyCanBeTaughtFly);
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

  private static extractKeys(val: unknown): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v));
    if (typeof val === 'object') return Object.keys(val as Record<string, unknown>);
    return [];
  }

  public static checkWhirlpool(
    inventory: BagInventory,
    storyFlags: Set<string>,
    party: PokemonInstance[],
    autoHm: boolean = true
  ): HMFieldCheckResult {
    const badges = this.extractKeys(inventory?.badges).map((b) => b.toLowerCase());
    const tms = this.extractKeys(inventory?.tms).map((t) => t.toUpperCase());
    const keyItems = this.extractKeys(inventory?.keyItems).map((k) => k.toUpperCase());

    const hasBadge =
      badges.includes('glacier') ||
      badges.includes('glacier_badge') ||
      badges.includes('glacierbadge') ||
      storyFlags.has('pryce_defeated') ||
      storyFlags.has('has_glacier_badge') ||
      storyFlags.has('glacierbadge');

    const partyKnowsWhirlpool = party.find(
      (p) => !p.isEgg && p.moves?.some((m) => m.moveId.toLowerCase() === 'whirlpool')
    );

    const hasHM =
      tms.includes('HM06') ||
      tms.includes('HM06_WHIRLPOOL') ||
      keyItems.includes('HM06') ||
      keyItems.includes('HM06_WHIRLPOOL') ||
      storyFlags.has('has_hm06_whirlpool') ||
      storyFlags.has('EVENT_GOT_HM06_WHIRLPOOL') ||
      Boolean(partyKnowsWhirlpool);

    const nonEggParty = party.filter((p) => !p.isEgg);
    const compatiblePokemon =
      partyKnowsWhirlpool ||
      nonEggParty.find((p) => ModernHMHandler.canSpeciesUseFieldHM(p.speciesId, 'whirlpool')) ||
      nonEggParty.find((p) => p.types?.includes('Water')) ||
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

    // Classic Gen 2 Mode (Auto-HM: OFF): strictly requires a Pokémon with WHIRLPOOL in its active moveset
    if (!autoHm && !partyKnowsWhirlpool) {
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        compatiblePokemon,
        'A POKéMON in your party must know WHIRLPOOL in its battle moves to pass vicious whirlpools!'
      );
    }

    return this.makeResult(true, true, true, partyKnowsWhirlpool || compatiblePokemon);
  }

  public static canUseWaterfall(
    party: PokemonInstance[],
    inventory: BagInventory | Partial<BagInventory>,
    storyFlags: Set<string> = new Set()
  ): HMFieldCheckResult {
    const badges = this.extractKeys(inventory.badges).map((b) => b.toLowerCase());
    const tms = this.extractKeys(inventory.tms).map((t) => t.toUpperCase());
    const keyItems = this.extractKeys(inventory.keyItems).map((k) => k.toUpperCase());

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
      nonEggParty.find((p) => ModernHMHandler.canSpeciesUseFieldHM(p.speciesId, 'waterfall')) ||
      nonEggParty.find((p) => p.types?.includes('Water')) ||
      null;

    if (!compatiblePokemon) {
      return this.makeResult(
        false,
        hasBadge,
        hasHM,
        null,
        'A wall of rushing water cascades downward! You need a compatible Pokémon that knows Waterfall or can learn it.'
      );
    }

    if (!hasBadge && !hasHM) {
      return this.makeResult(
        false,
        false,
        false,
        compatiblePokemon,
        'A wall of rushing water cascades downward! You need HM07 WATERFALL and the RISING BADGE from Blackthorn Gym.'
      );
    }

    if (!hasHM) {
      return this.makeResult(
        false,
        true,
        false,
        compatiblePokemon,
        'A wall of rushing water cascades downward! Explore the Ice Path to find HM07 WATERFALL.'
      );
    }

    if (!hasBadge) {
      return this.makeResult(
        false,
        false,
        true,
        compatiblePokemon,
        'A wall of rushing water cascades downward! Defeat Leader Clair at Blackthorn Gym to earn the RISING BADGE first.'
      );
    }

    return this.makeResult(true, true, true, compatiblePokemon);
  }
}
