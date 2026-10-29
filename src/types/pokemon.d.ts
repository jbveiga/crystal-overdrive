/**
 * @fileoverview Domain type contracts for Pokémon entities, stats, moves, evolutions, and storage.
 * @module types/pokemon
 * @layer types
 */

export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic'
  | 'Bug' | 'Rock' | 'Ghost' | 'Dragon' | 'Steel' | 'Dark';

export type MoveCategory = 'Physical' | 'Special' | 'Status';
export type StatusCondition = 'NONE' | 'PAR' | 'SLP' | 'FRZ' | 'BRN' | 'PSN' | 'TOX';
export type StatId = 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'acc' | 'eva';
export type StatStages = Record<StatId, number>;

export type PokeballId =
  | 'poke-ball' | 'great-ball' | 'ultra-ball' | 'master-ball'
  | 'quick-ball' | 'dusk-ball' | 'net-ball' | 'nest-ball'
  | 'timer-ball' | 'repeat-ball' | 'fast-ball' | 'dream-ball'
  | 'lure-ball' | 'level-ball' | 'heavy-ball' | 'love-ball' | 'friend-ball' | 'moon-ball';

export type MedicineId =
  | 'potion' | 'super-potion' | 'moomoo-milk' | 'antidote' | 'parlyz-heal' | 'awakening' | 'revive'
  | 'fresh-water' | 'soda-pop' | 'lemonade'
  | 'hp-up' | 'protein' | 'iron' | 'carbos' | 'calcium'
  | 'x-attack' | 'x-defend' | 'x-speed' | 'x-special' | 'dire-hit' | 'guard-spec';

export interface MoveData {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  priority: number;
  trapsTarget?: boolean;
  leavesOneHp?: boolean;
  inflictsStatus?: StatusCondition;
  secondaryStatus?: { status: StatusCondition; chance: number };
  statChanges?: { target: 'self' | 'foe'; stat: StatId; stages: number };
  healFraction?: number;
  drainFraction?: number;
  recoilFraction?: number;
  fixedDamage?: number | 'level' | 'half_current_hp';
  isWeatherHeal?: boolean;
  isRest?: boolean;
}

export interface EffectivenessBadge {
  multiplier: 0 | 0.25 | 0.5 | 1 | 2 | 4;
  label: string;
  colorClass: string;
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface PokemonInstance {
  uid: string;
  speciesId: string;
  nickname: string;
  level: number;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: BaseStats;
  stats: BaseStats;
  currentHp: number;
  status: StatusCondition;
  sleepTurns?: number;
  statStages?: StatStages;
  exp?: number;
  nextLevelExp?: number;
  isTrapped: boolean;
  moves: Array<{ moveId: string; currentPp: number; maxPp: number }>;
  catchRate: number;
  isEgg?: boolean;
  eggSteps?: number;
  isOddEgg?: boolean;
  isShiny?: boolean;
  friendship?: number;
  originalTrainer?: string;
  otId?: string;
  heldItem?: string;
  ivs?: Partial<BaseStats>;
  evs?: Partial<BaseStats>;
  nature?: string;
}

export type OddEggCandidate = 'pichu' | 'cleffa' | 'igglybuff' | 'tyrogue' | 'smoochum' | 'elekid' | 'magby';

export interface OddEggGrant {
  isGranted: boolean;
  speciesCandidate: OddEggCandidate;
  specialMove: 'Dizzy Punch';
  isShinyChance: number;
}

export type EvolutionTriggerType = 'LEVEL_UP' | 'ITEM' | 'FRIENDSHIP';

export interface EvolutionCheckContext {
  trigger: EvolutionTriggerType;
  level?: number;
  itemId?: string;
  timeOfDay?: 'MORNING' | 'DAY' | 'NIGHT';
}

export interface EvolutionCandidate {
  currentSpeciesId: string;
  targetSpeciesId: string;
  targetSpeciesName: string;
  method: string;
}

export interface RoamerState {
  speciesId: 'raikou' | 'entei' | 'suicune';
  currentMapId: string;
  pokemon: PokemonInstance;
  isAwakened: boolean;
  isCaught: boolean;
  isDefeated: boolean;
}

export interface StorageBox {
  id: number;
  name: string;
  pokemon: (PokemonInstance | null)[];
  wallpaper?: string;
}

export interface PokemonStorageState {
  currentBoxIndex: number;
  boxes: StorageBox[];
}
