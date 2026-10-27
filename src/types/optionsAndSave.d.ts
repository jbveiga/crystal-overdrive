/**
 * @fileoverview Domain type contracts for game options, missions, save data, and player profiles.
 * @module types/optionsAndSave
 * @layer types
 */

export type SpeedMultiplier = 1 | 2 | 3 | 4;
export type PlayerGender = 'BOY' | 'GIRL';
export type TouchControlStyle = 'DPAD' | 'JOYSTICK';
export type ExpShareMode = 'OFF' | 'ALL' | 'CAPPED';
export type ExpShareSetting = ExpShareMode;
export type EncounterRateMode = 'NORMAL' | 'RELAXED' | 'CLASSIC';
export type GbcPaletteMode = 'VIBRANT' | 'POCKET' | 'DMG' | 'NIGHT';
export type BattleStyleMode = 'SHIFT' | 'SET';
export type RepelId = 'repel' | 'super-repel' | 'max-repel';

export interface PlayerProfile {
  name: string;
  gender: PlayerGender;
  rivalName?: string;
}

export interface GameOptions {
  soundVolume: number;
  bgmVolume: number;
  muted?: boolean;
  textSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT';
  battleStyle?: BattleStyleMode;
  battleAnimations: boolean;
  playerSpeedDefault: SpeedMultiplier;
  battleSpeedMultiplier?: SpeedMultiplier;
  touchControlStyle?: TouchControlStyle;
  gamepadActive?: boolean;
  expShare?: ExpShareMode;
  encounterRateMode?: EncounterRateMode;
  autoHm?: boolean;
  crtScanlines?: boolean;
  gbcPalette?: GbcPaletteMode;
  lowHpBeepEnabled?: boolean;
  chiptuneMode?: boolean;
}

export interface SavePreview {
  playerName: string;
  gender: PlayerGender;
  badgeCount: number;
  pokedexCount: number;
  playTimeFormatted: string;
  currentLocationName: string;
  partyLeadSpeciesId?: string;
  partyLeadLevel?: number;
  timestamp: number;
  rivalName?: string;
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
