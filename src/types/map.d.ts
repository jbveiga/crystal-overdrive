/**
 * @fileoverview Domain type contracts for maps, warps, wild encounters, overworld items, and coordinates.
 * @module types/map
 * @layer types
 */

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type SpriteType =
  | 'boy' | 'girl' | 'fat_man' | 'kris' | 'silver' | 'fisherman'
  | 'bug_catcher' | 'teacher' | 'mom' | 'prof_elm' | 'sage' | 'elder'
  | 'elder_li' | 'falkner' | 'bird_keeper' | 'earl' | 'oak' | 'sudowoodo';

export interface TileCoord { x: number; y: number; }
export interface WarpEvent { x: number; y: number; targetMapId: string; targetX: number; targetY: number; direction?: Direction; }
export type WarpSoundCue = 'DOOR_ENTER' | 'DOOR_EXIT' | 'STAIRS_STEP' | 'CAVE_WARP';

export interface WarpTransitionConfig {
  previousMapId: string; targetMapId: string;
  isEnteringIndoor: boolean; isExitingToOverworld: boolean;
  isStairs: boolean; isCave: boolean;
  landingX: number; landingY: number; landingFacing: Direction;
  soundCue: WarpSoundCue; fadeDurationMs: number;
}

export interface WildEncounterSlot {
  speciesId: string; minLevel: number; maxLevel: number; weight: number;
  timeOfDay?: 'MORNING' | 'DAY' | 'NIGHT' | 'ANY';
}

export interface MapConnection { mapId: string; offset: number; }

export interface BgEvent {
  x: number; y: number; speaker?: string; pages: string[];
  action?: 'HEAL_AND_SAVE' | 'OPEN_MART' | 'OPEN_POKEGEAR' | 'POKECENTER_MAP'
    | 'OPEN_MAP' | 'OPEN_PC' | 'STARTER_CYNDAQUIL' | 'STARTER_TOTODILE' | 'STARTER_CHIKORITA';
}

export interface MapData {
  id: string; name: string; isIndoor?: boolean;
  width: number; height: number; tileSize: number;
  groundLayer: number[]; objectLayer: number[]; collisionGrid: number[];
  tileMap?: string[]; overlayMap?: (string | null)[];
  connections: Partial<Record<'NORTH' | 'EAST' | 'SOUTH' | 'WEST', MapConnection>>;
  warps: WarpEvent[]; bgEvents?: BgEvent[];
  grassEncounters: WildEncounterSlot[]; waterEncounters?: WildEncounterSlot[];
}

export type ItemPocket = 'BALLS' | 'ITEMS' | 'KEY_ITEMS' | 'TMS' | 'BERRIES';

export interface OverworldItemBall { id: string; mapId: string; region: 'johto' | 'kanto'; x: number; y: number; itemId: string; eventFlag: string; }
export type ItemBallEntry = OverworldItemBall;

export interface OverworldHiddenItem { id: string; mapId: string; region: 'johto' | 'kanto'; x: number; y: number; itemId: string; eventFlag: string; }
export type HiddenItemEntry = OverworldHiddenItem;

export interface OverworldFruitTree { id: string; mapId: string; region: 'johto' | 'kanto'; x: number; y: number; berryId: string; treeId: string; }
export type FruitTreeEntry = OverworldFruitTree;

export interface OverworldItemsDataset {
  summary: {
    totalItemBalls: number; totalHiddenItems: number; totalFruitTrees: number;
    total?: number; totalMapsWithItems?: number;
    johto?: { itemBalls: number; hiddenItems: number; fruitTrees: number; total: number };
    kanto?: { itemBalls: number; hiddenItems: number; fruitTrees: number; total: number };
  };
  itemBalls: OverworldItemBall[]; hiddenItems: OverworldHiddenItem[]; fruitTrees: OverworldFruitTree[];
  byMap: Record<string, { mapId?: string; region?: 'johto' | 'kanto'; itemBalls: OverworldItemBall[]; hiddenItems: OverworldHiddenItem[]; fruitTrees: OverworldFruitTree[]; }>;
}

export interface RadarPing {
  active: boolean; hasItemInRange: boolean;
  nearestItem: { eventFlag: string; itemId: string; x: number; y: number; distance: number; dx: number; dy: number; } | null;
  distance: number | null; dx: number; dy: number;
  bearing: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'HERE' | 'NONE';
  bearingAngleDeg: number; angleRad: number;
  isFacingTarget: boolean; isFacingDirectly: boolean;
  proximityBand: 'NONE' | 'FAR' | 'MEDIUM' | 'CLOSE' | 'FACING';
}
