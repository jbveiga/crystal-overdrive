/**
 * @fileoverview Interface-first context contracts for battle execution, callbacks, and engine orchestration.
 * @module types/battleContext
 * @layer types
 */

import type { PokemonInstance, MoveData } from './pokemon';
import type { Direction, MapData } from './map';
import type { SpeedMultiplier } from './optionsAndSave';
import type { BagInventory } from '../ui/BagAndMartUI';
import type { BattleStateMachine, BattleTurnResult, DoubleBattleConfig } from '../battle/BattleStateMachine';
import type { BattleHUD } from '../ui/BattleHUD';
import type { BattleRenderer } from '../render/BattleRenderer';
import type { BoxManager } from '../world/BoxManager';
import type { BugContestManager } from '../world/BugContestManager';
import type { RoamingManager } from '../world/RoamingManager';
import type { MissionManager } from '../world/MissionManager';
import type { MapManager } from '../world/MapManager';
import type { GameClock } from '../core/GameClock';

export type { DoubleBattleConfig };

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
