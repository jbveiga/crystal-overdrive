/**
 * @fileoverview RivalTeams: canonical Crystal rival parties (RIVAL1 7-15) with starter-dependent final slot.
 * @module battle/RivalTeams
 * @role Single source of truth for rival team composition (species, levels, moves) across Burned Tower, Goldenrod Underground and Victory Road
 * @exports RivalStage, PlayerStarter, resolvePlayerStarter, getRivalTeamSpecs, buildRivalTeam
 * @layer battle
 * @sections L1-12: Header | L13-60: Data | L61-90: Resolver & builders
 */

import { PokemonFactory } from './PokemonFactory';
import type { PokemonInstance } from '../types/pokemon';

export type RivalStage = 'burned_tower' | 'goldenrod_underground' | 'victory_road';
export type PlayerStarter = 'chikorita' | 'cyndaquil' | 'totodile';
export interface RivalSpec { speciesId: string; level: number; moves: string[] }

/** The rival always picks the starter that beats the player's: Chikorita→Cyndaquil, Cyndaquil→Totodile, Totodile→Chikorita. */
const STARTER_SLOT: Record<RivalStage, Record<PlayerStarter, RivalSpec>> = {
  burned_tower: {
    chikorita: { speciesId: 'quilava', level: 22, moves: ['leer', 'smokescreen', 'ember', 'quickattack'] },
    cyndaquil: { speciesId: 'croconaw', level: 22, moves: ['leer', 'rage', 'watergun', 'bite'] },
    totodile: { speciesId: 'bayleef', level: 22, moves: ['growl', 'reflect', 'razorleaf', 'poisonpowder'] },
  },
  goldenrod_underground: {
    chikorita: { speciesId: 'quilava', level: 32, moves: ['smokescreen', 'ember', 'quickattack', 'flamewheel'] },
    cyndaquil: { speciesId: 'feraligatr', level: 32, moves: ['rage', 'watergun', 'bite', 'scaryface'] },
    totodile: { speciesId: 'meganium', level: 32, moves: ['reflect', 'razorleaf', 'poisonpowder', 'bodyslam'] },
  },
  victory_road: {
    chikorita: { speciesId: 'typhlosion', level: 38, moves: ['smokescreen', 'ember', 'quickattack', 'flamewheel'] },
    cyndaquil: { speciesId: 'feraligatr', level: 38, moves: ['rage', 'watergun', 'scaryface', 'slash'] },
    totodile: { speciesId: 'meganium', level: 38, moves: ['reflect', 'razorleaf', 'poisonpowder', 'bodyslam'] },
  },
};

const SHARED: Record<RivalStage, RivalSpec[]> = {
  burned_tower: [
    { speciesId: 'haunter', level: 20, moves: ['lick', 'spite', 'meanlook', 'curse'] },
    { speciesId: 'magnemite', level: 18, moves: ['tackle', 'thundershock', 'supersonic', 'sonicboom'] },
    { speciesId: 'zubat', level: 20, moves: ['leechlife', 'supersonic', 'bite', 'confuseray'] },
  ],
  goldenrod_underground: [
    { speciesId: 'golbat', level: 30, moves: ['leechlife', 'bite', 'confuseray', 'wingattack'] },
    { speciesId: 'magnemite', level: 28, moves: ['tackle', 'thundershock', 'sonicboom', 'thunderwave'] },
    { speciesId: 'haunter', level: 30, moves: ['lick', 'meanlook', 'curse', 'shadowball'] },
    { speciesId: 'sneasel', level: 32, moves: ['leer', 'quickattack', 'screech', 'faintattack'] },
  ],
  victory_road: [
    { speciesId: 'sneasel', level: 34, moves: ['quickattack', 'screech', 'faintattack', 'furycutter'] },
    { speciesId: 'golbat', level: 36, moves: ['leechlife', 'bite', 'confuseray', 'wingattack'] },
    { speciesId: 'magneton', level: 35, moves: ['thundershock', 'sonicboom', 'thunderwave', 'swift'] },
    { speciesId: 'haunter', level: 35, moves: ['meanlook', 'curse', 'shadowball', 'confuseray'] },
    { speciesId: 'kadabra', level: 35, moves: ['disable', 'psybeam', 'recover', 'futuresight'] },
  ],
};

export function resolvePlayerStarter(
  storyFlags: ReadonlySet<string>,
  party: ReadonlyArray<{ speciesId: string }>
): PlayerStarter {
  const has = (...ids: string[]) => party.some((p) => ids.includes(p.speciesId));
  if (storyFlags.has('starter_cyndaquil') || has('cyndaquil', 'quilava', 'typhlosion')) return 'cyndaquil';
  if (storyFlags.has('starter_totodile') || has('totodile', 'croconaw', 'feraligatr')) return 'totodile';
  return 'chikorita';
}

export function getRivalTeamSpecs(stage: RivalStage, starter: PlayerStarter): RivalSpec[] {
  // Canon order: the starter is the final (ace) slot
  const team = [...SHARED[stage], STARTER_SLOT[stage][starter]];
  // Canon quirk: the Victory Road party against a Cyndaquil player has a Lv34 (not Lv35) Magneton
  if (stage === 'victory_road' && starter === 'cyndaquil') {
    return team.map((s) => (s.speciesId === 'magneton' ? { ...s, level: 34 } : s));
  }
  return team;
}

export function buildRivalTeam(stage: RivalStage, starter: PlayerStarter): PokemonInstance[] {
  return getRivalTeamSpecs(stage, starter).map((s) => PokemonFactory.create(s.speciesId, s.level, s.moves));
}
