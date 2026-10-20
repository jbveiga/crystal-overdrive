export type SpeedMultiplier = 1 | 2 | 3 | 4;
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type PlayerGender = 'BOY' | 'GIRL';

export interface GameOptions {
  soundVolume: number;      // 0.0 - 1.0 (default: 0.7)
  bgmVolume: number;        // 0.0 - 1.0 (default: 0.7)
  textSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT'; // (default: 'MID')
  battleAnimations: boolean; // (default: true)
  playerSpeedDefault: SpeedMultiplier; // (default: 1)
}

export interface SavePreview {
  playerName: string;
  gender: PlayerGender;
  badgeCount: number;
  pokedexCount: number;
  playTimeFormatted: string; // "HH:MM" e.g. "01:24"
  currentLocationName: string; // e.g. "Player's House" or "New Bark Town"
  partyLeadSpeciesId?: string;
  partyLeadLevel?: number;
  timestamp: number;
}

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
  | 'timer-ball' | 'repeat-ball' | 'fast-ball' | 'dream-ball';

export type MedicineId =
  | 'potion'
  | 'super-potion'
  | 'antidote'
  | 'parlyz-heal'
  | 'awakening'
  | 'revive';

export interface TileCoord {
  x: number;
  y: number;
}

export interface WarpEvent {
  x: number;
  y: number;
  targetMapId: string;
  targetX: number;
  targetY: number;
}

export interface WildEncounterSlot {
  speciesId: string;
  minLevel: number;
  maxLevel: number;
  weight: number;
}

export interface MapConnection {
  mapId: string;
  offset: number;
}

export interface BgEvent {
  x: number;
  y: number;
  speaker?: string;
  pages: string[];
  action?: 'HEAL_AND_SAVE' | 'OPEN_MART' | 'OPEN_POKEGEAR';
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number; // 64 (16x16 original upscaled 4x)
  groundLayer: number[];
  objectLayer: number[];
  collisionGrid: number[]; // 0 = walkable, 1 = solid, 2 = tall grass, 3 = water
  tileMap?: string[];
  overlayMap?: (string | null)[];
  connections: Partial<Record<'NORTH' | 'EAST' | 'SOUTH' | 'WEST', MapConnection>>;
  warps: WarpEvent[];
  bgEvents?: BgEvent[];
  grassEncounters: WildEncounterSlot[];
}

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
  secondaryStatus?: {
    status: StatusCondition;
    chance: number;
  };
  statChanges?: {
    target: 'self' | 'foe';
    stat: StatId;
    stages: number;
  };
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
}

export interface RoamerState {
  speciesId: 'raikou' | 'entei' | 'suicune';
  currentMapId: string;
  pokemon: PokemonInstance;
  isAwakened: boolean;
  isCaught: boolean;
  isDefeated: boolean;
}
