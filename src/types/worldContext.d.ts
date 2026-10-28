/**
 * @fileoverview Interface-first context contracts for overworld transitions, interactions, ticker, and trainer sight.
 * @module types/worldContext
 * @layer types
 */

import type { PokemonInstance } from './pokemon';
import type { Direction, MapData } from './map';
import type { TriggerBattleOptions } from './battleContext';
import type { GridEntity } from '../world/GridPhysics';
import type { BagInventory } from '../ui/BagAndMartUI';
import type { MapManager } from '../world/MapManager';
import type { OverworldItemManager } from '../world/OverworldItemManager';
import type { MissionManager } from '../world/MissionManager';
import type { RoamingManager } from '../world/RoamingManager';
import type { DayCareManager } from '../world/DayCareManager'; import type { KurtCraftingManager } from '../world/KurtCraftingManager';
import type { BoxManager } from '../world/BoxManager'; import type { BugContestManager } from '../world/BugContestManager';
import type { StadiumArenaManager } from '../battle/StadiumArenaManager'; import type { GameClock } from '../core/GameClock';
import type { StoryCutsceneContext } from '../world/StoryCutscenes'; import type { AdjacentMapPrefetcher } from '../world/AdjacentMapPrefetcher';
import type { OverworldHUD } from '../ui/OverworldHUD'; import type { ItemfinderHUD } from '../ui/ItemfinderHUD';

export interface FieldObstacleContext {
  playerName: string; playerParty: PokemonInstance[]; inventory: BagInventory; storyFlags: Set<string>;
  player: { x: number; y: number; direction: Direction };
  mapManager: MapManager; overworldItemManager: OverworldItemManager; missionManager: MissionManager;
  visitedMaps: Set<string>; roamingManager: RoamingManager; detectChosenStarterSpecies: () => string | null;
  openStarterChoiceModal: (speciesId: 'cyndaquil' | 'totodile' | 'chikorita', name: string, type: string, onConfirm: () => void, onCancel: () => void) => void;
  openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => void;
  showToast: (msg: string) => void; openPcStorage: () => void;
  openTownMap: (mapId: string, visited: Set<string>, roamers: any) => void;
  openRuinsPuzzleModal: (callbacks: { onSolve: (puzzleId: string) => void; onClose: () => void }) => void;
  handleRuinsPuzzleSolve: (puzzleId: string) => void; openMart: (martId?: string) => void; healPlayerParty: (playAnim?: boolean) => void;
  playHealingAnimation: (partyCount: number) => void; playFieldRestAnimation: () => void;
  playFlashEffect: () => void; playCutSlashEffect: (x: number, y: number) => void;
  addOverworldItemToInventory: (itemId: string) => void; removeItemBall: (eventFlag: string) => void;
  syncMapOverworldItems: (map: MapData) => void; refreshItemfinderRadar: (playSonar?: boolean) => void;
  saveCurrentGame: () => void; renderMap: (map: MapData) => void; setSurfEnabled: (enabled: boolean) => void;
  triggerBattle: (pokemon: PokemonInstance, options?: TriggerBattleOptions) => Promise<void>;
  isItemfinderActive: () => boolean;
  openDeptElevatorModal?: (currentMapId: string, onSelectFloor: (targetMapId: string) => void) => void;
  executeWarpTransition?: (warp: any) => void | Promise<void>;
}

export interface OverworldTransitionContext {
  mapManager: MapManager; storyFlags: Set<string>; visitedMaps: Set<string>; inventory: BagInventory;
  playerParty: PokemonInstance[]; player: GridEntity; playerName: string;
  isCutsceneLocked: () => boolean; setCutsceneLocked: (locked: boolean) => void;
  audioManager: { playMapBgm: (mapId: string, volume?: number) => void };
  overworldRenderer: {
    renderMap: (map: MapData, lookupMap: (id: string) => MapData | undefined) => void;
    playDoorwayFade: (onBlackout: () => Promise<void>, durationMs?: number) => Promise<void>;
    ensureMapTilesLoaded: (map: MapData, lookupMap: (id: string) => MapData | undefined, options?: any) => Promise<void>;
    evictDistantTileTextures: (map: MapData, lookupMap: (id: string) => MapData | undefined) => void;
    renderOverworldItems?: (itemBalls: any[], fruitTrees: any[], harvestedTreeIds: Set<string>) => void;
  };
  overworldHUD: {
    openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => void;
    updateRouteName: (name: string) => void; showRoamerAlert: (speciesId: string, routeId: string) => void;
    hideRoamerAlert: () => void; playFieldRestAnimation?: (onComplete?: () => void) => void;
    showToast?: (msg: string) => void; show?: () => void; playHealingAnimation?: (count: number, cb?: () => void) => void;
  };
  missionManager: MissionManager;
  activeNpcCache: { invalidate: (mapId: string) => void; evictMapsNotIn: (protectedMapIds: Set<string>) => void };
  npcsByMap: Record<string, GridEntity[]>; getActiveMapNpcs: (mapId: string) => GridEntity[];
  defeatedTrainers: Set<string>; lookupMap: (id: string) => MapData | undefined; saveCurrentGame: () => void;
  roamingManager: RoamingManager; eventBus: { emit: (event: string, payload: any) => void };
  getLastVisitedPokecenter: () => { mapId: string; x: number; y: number };
  setLastVisitedPokecenter: (loc: { mapId: string; x: number; y: number }) => void;
  triggerAzaleaRivalAmbush: () => void; triggerCanvasEarthquake?: () => void; adjacentMapPrefetcher?: AdjacentMapPrefetcher;
  overworldItemManager: OverworldItemManager; detectChosenStarterSpecies: () => 'cyndaquil' | 'totodile' | 'chikorita' | undefined;
}

export interface OverworldTrainerSightContext {
  player: GridEntity; playerName: string; rivalName: string; playerParty: PokemonInstance[];
  inventory: BagInventory; storyFlags: Set<string>; defeatedTrainers: Set<string>;
  npcsByMap: Record<string, GridEntity[]>; gameState: () => 'TITLE' | 'OVERWORLD' | 'BATTLE';
  isCutsceneLocked: () => boolean; setCutsceneLocked: (locked: boolean) => void;
  audioManager: {
    playBattleBgm: (type: 'wild' | 'trainer' | 'gym_leader') => void;
    restoreOverworldBgm: (volume?: number) => void; playMapBgm: (mapId: string, volume?: number) => void; playSfx?: (name: string) => void;
  };
  overworldRenderer: { renderMap: (map: MapData, lookupMap: (id: string) => MapData | undefined) => void };
  overworldHUD: {
    openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => void;
    showToast: (msg: string) => void; playFieldRestAnimation: (onComplete?: () => void) => void; updateRouteName: (name: string) => void;
  };
  mapManager: MapManager; missionManager: MissionManager; roamingManager: RoamingManager; gameClock: GameClock;
  stadiumArenaManager: StadiumArenaManager; triggerBattle: (pokemon: PokemonInstance, options?: TriggerBattleOptions) => Promise<void>;
  healPlayerParty: (playAnim?: boolean) => void; saveCurrentGame: () => void;
  lookupMap: (id: string) => MapData | undefined; syncMapOverworldItems: (map: MapData | null) => void;
}

export interface OverworldTickerContext {
  getGameState: () => 'TITLE' | 'OVERWORLD' | 'BATTLE';
  isCutsceneLocked: () => boolean; isDialogueOpen: () => boolean; isMenuOpen: () => boolean; isAnyModalOpen: () => boolean;
  player: GridEntity; mapManager: MapManager; overworldItemManager: OverworldItemManager; gameClock: GameClock;
  storyFlags: Set<string>; visitedMaps: Set<string>; roamingManager: RoamingManager; missionManager: MissionManager;
  itemfinderHUD: ItemfinderHUD; overworldHUD: OverworldHUD; audioManager: any; overworldRenderer: any;
  getActiveMapNpcs: (mapId: string) => GridEntity[]; populateWorldNpcs: (map: MapData | null) => GridEntity[];
  handleMapTransition: (entity: GridEntity) => void; executeWarpTransition: (warp: any) => Promise<void>;
  runTrainerSightSequence: (trainer: GridEntity) => Promise<void>; triggerSlowpokeWellGruntIntercept: (grunt: GridEntity) => Promise<void>;
  triggerBeastsAwakeningCutscene: () => void; triggerBurnedTowerRivalBattle: () => void; triggerCherrygroveRivalAmbush: () => void;
  saveCurrentGame: () => void | Promise<void>; triggerWildEncounter: (encounter: any, options?: any) => Promise<void>;
  addPlayTimeDelta: (dtSec: number) => void; isSurfEnabled: () => boolean;
  openDeptElevatorModal?: (currentMapId: string, onSelectFloor: (targetMapId: string) => void) => void;
  triggerOlivineRivalConfrontation?: () => void;
}

export type NpcInteractionHandler = (
  targetNpc: GridEntity, currentMap: MapData, ctx: NpcInteractionContext
) => boolean | void | Promise<boolean | void>;

export interface NpcInteractionRegistration {
  actions?: string[]; npcIds?: string[]; idPrefixes?: string[]; handler: NpcInteractionHandler;
}

export interface NpcInteractionContext {
  playerName: string; playerParty: PokemonInstance[]; inventory: BagInventory; storyFlags: Set<string>;
  defeatedTrainers: Set<string>; player: GridEntity; npcsByMap: Record<string, GridEntity[]>;
  mapManager: MapManager; gameClock: GameClock;
  getRivalName?: () => string; setRivalName?: (name: string) => void;
  audioManager: {
    playBattleBgm: (type: 'wild' | 'trainer' | 'gym_leader') => void; restoreOverworldBgm: (volume?: number) => void;
    playMapBgm: (mapId: string, volume?: number) => void; playSfx?: (name: string) => void;
  };
  missionManager: MissionManager; bugContestManager: BugContestManager; dayCareManager: DayCareManager;
  kurtCraftingManager?: KurtCraftingManager; boxManager?: BoxManager;
  lastVisitedPokecenter: { mapId: string; x: number; y: number }; setLastVisitedPokecenter: (loc: { mapId: string; x: number; y: number }) => void;
  openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => void;
  showToast: (msg: string) => void; healPlayerParty: (playAnim?: boolean) => void;
  playHealingAnimation: (partyCount?: number, onComplete?: () => void) => void;
  playFieldRestAnimation: (onComplete?: () => void) => void; saveCurrentGame: () => void;
  openMart: (martId?: string) => void; openPcStorage: () => void; openTownMap: (mapId: string, visited: Set<string>, roamers: any) => void;
  addOverworldItemToInventory: (itemId: string) => void; renderMap?: (map: MapData) => void;
  syncMapOverworldItems?: (map: MapData) => void; setSurfEnabled?: (enabled: boolean) => void;
  openDayCareModal: () => void; openNamingModal: (title: string, defaultName: string, onConfirm: (name: string) => void) => void;
  openDeptElevatorModal: (currentMapId: string, onSelectFloor: (targetMapId: string) => void) => void;
  openRadioTowerQuizModal: (callbacks: { onComplete: () => void }) => void; openKurtCraftingModal: (callbacks: { onOrderPlaced: () => void }) => void;
  openKyleTradeModal: (callbacks: { bellsproutIndex: number; onConfirm: () => void; onCancel: () => void }) => void; shakeScreen: (durationMs?: number) => void;
  mountBugContestHUD?: (balls: number, timeSec: number) => void; destroyBugContestHUD?: () => void;
  executeWarpTransition?: (warp: { x: number; y: number; targetMapId: string; targetX: number; targetY: number; direction?: Direction }) => void;
  triggerBattle: (pokemon: PokemonInstance, options?: TriggerBattleOptions) => Promise<void>;
  buildTrainerTeamInstances: (trainer: GridEntity) => PokemonInstance[]; handleTrainerDefeatRewards: (trainer: GridEntity) => void;
  getOppositeDirection: (dir: Direction) => Direction; launchStadiumChallenge: (challengerId: string, cupId: string) => void;
  runGuideGentWalkingTour: (guide: GridEntity) => Promise<void>; triggerBeastsAwakeningCutscene: () => void;
  triggerBurnedTowerRivalBattle: () => void; triggerAzaleaRivalAmbush: () => void; triggerCherrygroveRivalAmbush: () => void;
  triggerSlowpokeWellGruntIntercept: (grunt: GridEntity) => Promise<void>; setCutsceneLocked: (locked: boolean) => void;
  getCutsceneContext: () => StoryCutsceneContext;
}
