import type {
  PokemonInstance,
  DoubleBattleConfig,
  Direction,
  MapData,
  BagInventory,
  MoveData,
  SpeedMultiplier,
} from './game';
import type { BattleStateMachine, BattleTurnResult } from '../battle/BattleStateMachine';
import type { BattleHUD } from '../ui/BattleHUD';
import type { BattleRenderer } from '../render/BattleRenderer';
import type { BoxManager } from '../world/BoxManager';
import type { BugContestManager } from '../world/BugContestManager';
import type { RoamingManager } from '../world/RoamingManager';
import type { MissionManager } from '../world/MissionManager';
import type { MapManager } from '../world/MapManager';
import type { OverworldItemManager } from '../world/OverworldItemManager';
import type { GameClock } from '../core/GameClock';

export interface TriggerBattleOptions {
  isRoamer?: boolean;
  isTrainer?: boolean;
  isGymLeader?: boolean;
  trainerName?: string;
  trainerTeam?: PokemonInstance[];
  doubleConfig?: DoubleBattleConfig;
  stadiumBadgeLabel?: string;
  onVictory?: () => Promise<void> | void;
  onBattleEnd?: (result: BattleTurnResult) => Promise<void> | void;
}

export interface BattleSessionContext {
  setGameState: (state: 'TITLE' | 'OVERWORLD' | 'BATTLE') => void;
  overworldHUD: {
    hide: () => void;
    show: () => void;
    showToast: (msg: string) => void;
    hideRoamerAlert: () => void;
  };
  itemfinderHUD: {
    suspend: () => void;
    resume: () => void;
  };
  player: {
    isMoving: boolean;
    progress: number;
    x: number;
    y: number;
    direction: Direction;
  };
  audioManager: {
    playBattleBgm: (type: 'wild' | 'trainer' | 'gym_leader') => void;
    restoreOverworldBgm: (volume?: number) => void;
  };
  seenSpecies: Set<string>;
  playerParty: PokemonInstance[];
  playerBox: PokemonInstance[];
  setPlayerBox: (box: PokemonInstance[]) => void;
  healPlayerParty: (playAnim?: boolean) => void;
  battleHUD: BattleHUD;
  battleRenderer: BattleRenderer;
  inventory: BagInventory;
  gameClock: GameClock;
  gameOptions: {
    expShare?: 'OFF' | 'ALL' | 'CAPPED';
  };
  eventBus: {
    emit: (event: string, payload: any) => void;
  };
  mapManager: MapManager;
  boxManager: BoxManager;
  storyFlags: Set<string>;
  bugContestManager: BugContestManager;
  roamingManager: RoamingManager;
  missionManager: MissionManager;
  playerName: string;
  cycleBattleSpeed: () => SpeedMultiplier;
  saveCurrentGame: () => void;
  respawnAtLastPokecenter: () => Promise<void>;
  promptBugContestSpecimenSwap: (newCatch: PokemonInstance) => Promise<void> | void;
  playEvolutionScene: (
    pokemon: PokemonInstance,
    targetSpeciesId: string
  ) => Promise<{ evolved: boolean; newSpeciesId?: string; targetSpecies?: string }>;
  openMoveReplacementModal: (pokemon: PokemonInstance, moveData: MoveData) => Promise<number | null>;
}

export interface FieldObstacleContext {
  playerName: string;
  playerParty: PokemonInstance[];
  inventory: BagInventory;
  storyFlags: Set<string>;
  player: {
    x: number;
    y: number;
    direction: Direction;
  };
  mapManager: MapManager;
  overworldItemManager: OverworldItemManager;
  missionManager: MissionManager;
  visitedMaps: Set<string>;
  roamingManager: RoamingManager;
  detectChosenStarterSpecies: () => string | null;
  openStarterChoiceModal: (
    speciesId: 'cyndaquil' | 'totodile' | 'chikorita',
    name: string,
    type: string,
    onConfirm: () => void,
    onCancel: () => void
  ) => void;
  openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => void;
  showToast: (msg: string) => void;
  openPcStorage: () => void;
  openTownMap: (mapId: string, visited: Set<string>, roamers: any) => void;
  openRuinsPuzzleModal: (callbacks: { onSolve: (puzzleId: string) => void; onClose: () => void }) => void;
  handleRuinsPuzzleSolve: (puzzleId: string) => void;
  openMart: () => void;
  healPlayerParty: (playAnim?: boolean) => void;
  playHealingAnimation: (partyCount: number) => void;
  playFieldRestAnimation: () => void;
  playFlashEffect: () => void;
  playCutSlashEffect: (x: number, y: number) => void;
  addOverworldItemToInventory: (itemId: string) => void;
  removeItemBall: (eventFlag: string) => void;
  syncMapOverworldItems: (map: MapData) => void;
  refreshItemfinderRadar: (playSonar?: boolean) => void;
  saveCurrentGame: () => void;
  renderMap: (map: MapData) => void;
  setSurfEnabled: (enabled: boolean) => void;
  triggerBattle: (pokemon: PokemonInstance, options?: TriggerBattleOptions) => Promise<void>;
  isItemfinderActive: () => boolean;
}
