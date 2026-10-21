export type SpeedMultiplier = 1 | 2 | 3 | 4;
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type PlayerGender = 'BOY' | 'GIRL';
export type SpriteType =
  | 'boy'
  | 'girl'
  | 'fat_man'
  | 'kris'
  | 'silver'
  | 'fisherman'
  | 'bug_catcher'
  | 'teacher'
  | 'mom'
  | 'prof_elm'
  | 'sage'
  | 'elder'
  | 'elder_li'
  | 'falkner'
  | 'bird_keeper'
  | 'earl'
  | 'oak'
  | 'sudowoodo';

export type TouchControlStyle = 'DPAD' | 'JOYSTICK';
export type ExpShareMode = 'OFF' | 'ALL' | 'CAPPED';
export type ExpShareSetting = ExpShareMode;

export interface PlayerProfile {
  name: string;
  gender: PlayerGender;
  rivalName?: string;
}

export interface GameOptions {
  soundVolume: number;      // 0.0 - 1.0 (default: 0.7)
  bgmVolume: number;        // 0.0 - 1.0 (default: 0.7)
  textSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT'; // (default: 'MID')
  battleAnimations: boolean; // (default: true)
  playerSpeedDefault: SpeedMultiplier; // (default: 1)
  battleSpeedMultiplier?: SpeedMultiplier; // (default: 1)
  touchControlStyle?: TouchControlStyle; // (default: 'DPAD')
  expShare?: ExpShareMode;  // (default: 'CAPPED')
}

export interface RadarPing {
  active: boolean;
  hasItemInRange: boolean;
  nearestItem: {
    eventFlag: string;
    itemId: string;
    x: number;
    y: number;
    distance: number;
    dx: number;
    dy: number;
  } | null;
  distance: number | null;
  dx: number;
  dy: number;
  bearing: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'HERE' | 'NONE';
  bearingAngleDeg: number; // 0 = East, 90 = South, 180 = West, 270 = North
  angleRad: number;
  isFacingTarget: boolean;
  isFacingDirectly: boolean;
  proximityBand: 'NONE' | 'FAR' | 'MEDIUM' | 'CLOSE' | 'FACING';
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
  rivalName?: string;
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
  | 'timer-ball' | 'repeat-ball' | 'fast-ball' | 'dream-ball'
  | 'lure-ball' | 'level-ball' | 'heavy-ball' | 'love-ball' | 'friend-ball' | 'moon-ball';

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
  /** Optional facing direction after arriving through this warp (overrides default heuristics). */
  direction?: Direction;
}

export interface WildEncounterSlot {
  speciesId: string;
  minLevel: number;
  maxLevel: number;
  weight: number;
  timeOfDay?: 'MORNING' | 'DAY' | 'NIGHT' | 'ANY';
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
  action?:
    | 'HEAL_AND_SAVE'
    | 'OPEN_MART'
    | 'OPEN_POKEGEAR'
    | 'OPEN_PC'
    | 'STARTER_CYNDAQUIL'
    | 'STARTER_TOTODILE'
    | 'STARTER_CHIKORITA';
}

export interface MapData {
  id: string;
  name: string;
  isIndoor?: boolean;
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
  friendship?: number; // 0-255 (default 70 for wild caught, 120 for hatched eggs)
  heldItem?: string;
  ivs?: Partial<BaseStats>;
  evs?: Partial<BaseStats>;
  nature?: string;
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

export type MissionCategory = 'MAIN' | 'SIDE';
export type MissionStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED';
export type MissionFilter = 'ALL' | 'MAIN' | 'SIDE' | 'COMPLETED';

export interface MissionStep {
  id: string;
  description: string;
  completed: boolean;
  targetMapId?: string;
  storyFlag?: string;
}

export interface MissionReward {
  type: 'ITEM' | 'MONEY' | 'BADGE' | 'TM' | 'POKEMON';
  value: string | number;
  label: string;
}

export interface Mission {
  id: string;
  title: string;
  category: MissionCategory;
  act: number;
  summary: string;
  location: string;
  giver: string;
  status: MissionStatus;
  steps: MissionStep[];
  currentStepIndex: number;
  rewards: MissionReward[];
  unlockedAtStoryFlag?: string;
  completedAtStoryFlag?: string;
}

export interface SerializedMissionState {
  status: MissionStatus;
  currentStepIndex: number;
  stepsCompleted: boolean[];
}

export type ItemPocket = 'BALLS' | 'ITEMS' | 'KEY_ITEMS' | 'TMS' | 'BERRIES';

export interface OverworldItemBall {
  id: string;
  mapId: string;
  region: 'johto' | 'kanto';
  x: number;
  y: number;
  itemId: string;
  eventFlag: string;
}
export type ItemBallEntry = OverworldItemBall;

export interface OverworldHiddenItem {
  id: string;
  mapId: string;
  region: 'johto' | 'kanto';
  x: number;
  y: number;
  itemId: string;
  eventFlag: string;
}
export type HiddenItemEntry = OverworldHiddenItem;

export interface OverworldFruitTree {
  id: string;
  mapId: string;
  region: 'johto' | 'kanto';
  x: number;
  y: number;
  berryId: string;
  treeId: string;
}
export type FruitTreeEntry = OverworldFruitTree;

export interface StorageBox {
  id: number; // 0 to 13 (Boxes 1–14)
  name: string; // "BOX 1", "BOX 2", etc.
  pokemon: (PokemonInstance | null)[]; // 20 slots per box
  wallpaper?: string;
}

export interface PokemonStorageState {
  currentBoxIndex: number; // Active box (0–13)
  boxes: StorageBox[]; // 14 boxes total (280 total capacity)
}

export interface OverworldItemsDataset {
  summary: {
    totalItemBalls: number;
    totalHiddenItems: number;
    totalFruitTrees: number;
    total?: number;
    totalMapsWithItems?: number;
    johto?: { itemBalls: number; hiddenItems: number; fruitTrees: number; total: number };
    kanto?: { itemBalls: number; hiddenItems: number; fruitTrees: number; total: number };
  };
  itemBalls: OverworldItemBall[];
  hiddenItems: OverworldHiddenItem[];
  fruitTrees: OverworldFruitTree[];
  byMap: Record<
    string,
    {
      mapId?: string;
      region?: 'johto' | 'kanto';
      itemBalls: OverworldItemBall[];
      hiddenItems: OverworldHiddenItem[];
      fruitTrees: OverworldFruitTree[];
    }
  >;
}
