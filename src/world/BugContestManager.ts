/**
 * @fileoverview BugContestManager domain module implementation.
 * @module world/BugContestManager
 * @role BugContestManager Component
 * @exports SudowoodoObstacle, getSudowoodoObstacle, BugContestState
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-185: Implementation | L186-371: Handlers & Exports
 */

/**
 * BugContestManager.ts
 * Pure TypeScript domain logic for the National Park Bug-Catching Contest and Sudowoodo Obstacle (Ticket Sprint 15 / TICKET-WORLD-ROUTE35-NATIONAL-PARK-01).
 * Zero DOM or PixiJS dependencies.
 */
import type { PokemonInstance } from '../types/game';

export interface SudowoodoObstacle {
  x: number;
  y: number;
  isCleared: boolean;
}

export function getSudowoodoObstacle(storyFlags: Set<string>): SudowoodoObstacle {
  return {
    x: 35,
    y: 9,
    isCleared: storyFlags.has('sudowoodo_cleared') || storyFlags.has('EVENT_FOUGHT_SUDOWOODO'),
  };
}

export interface BugContestState {
  isActive: boolean;
  ballsRemaining: number;
  bestCaughtPokemon?: PokemonInstance;
  timeRemainingSec: number;
}

export interface BugContestJudgeResult {
  rank: number;
  score: number;
  grade: string;
  prizeItem: string;
  prizeName: string;
  bestPokemon?: PokemonInstance;
  isNewPersonalBest?: boolean;
}

export interface BugContestLeaderboardEntry {
  id: string;
  trainerName: string;
  speciesId: string;
  level: number;
  score: number;
  grade: string;
  rank: number;
  prizeName: string;
  timestamp: number;
  isPlayer: boolean;
}

export const DEFAULT_NPC_CONTEST_RECORDS: BugContestLeaderboardEntry[] = [
  {
    id: 'npc_cooltrainer_nick',
    trainerName: 'COOLTRAINER NICK',
    speciesId: 'scyther',
    level: 14,
    score: 236,
    grade: 'GRADE A',
    rank: 1,
    prizeName: 'SUN STONE',
    timestamp: 1000000000000,
    isPlayer: false,
  },
  {
    id: 'npc_pokefan_william',
    trainerName: 'POKéFAN WILLIAM',
    speciesId: 'pinsir',
    level: 13,
    score: 214,
    grade: 'GRADE B',
    rank: 1,
    prizeName: 'SUN STONE',
    timestamp: 1000000000000,
    isPlayer: false,
  },
  {
    id: 'npc_bug_catcher_benny',
    trainerName: 'BUG CATCHER BENNY',
    speciesId: 'butterfree',
    level: 14,
    score: 196,
    grade: 'GRADE B',
    rank: 1,
    prizeName: 'SUN STONE',
    timestamp: 1000000000000,
    isPlayer: false,
  },
  {
    id: 'npc_camper_barry',
    trainerName: 'CAMPER BARRY',
    speciesId: 'venonat',
    level: 13,
    score: 168,
    grade: 'GRADE C',
    rank: 2,
    prizeName: 'EVERSTONE',
    timestamp: 1000000000000,
    isPlayer: false,
  },
  {
    id: 'npc_bug_catcher_don',
    trainerName: 'BUG CATCHER DON',
    speciesId: 'kakuna',
    level: 12,
    score: 142,
    grade: 'GRADE C',
    rank: 2,
    prizeName: 'EVERSTONE',
    timestamp: 1000000000000,
    isPlayer: false,
  },
];

export const BUG_CONTEST_BASE_SCORES: Record<string, number> = {
  pinsir: 80,
  scyther: 80,
  butterfree: 70,
  beedrill: 70,
  venonat: 60,
  paras: 60,
  kakuna: 50,
  metapod: 50,
  weedle: 40,
  caterpie: 40,
};

/**
 * Calculates authentic Gen 2 Bug-Catching Contest score:
 * Score = Base Species Score + (Level * 4) + IV Total + round((Current HP / Max HP) * 100)
 */
export function calculateJudgeScore(pkmn?: PokemonInstance): number {
  if (!pkmn) return 0;
  const baseScore = BUG_CONTEST_BASE_SCORES[pkmn.speciesId.toLowerCase()] ?? 40;
  const levelScore = (pkmn.level || 1) * 4;

  let ivTotal = 0;
  if (pkmn.ivs) {
    ivTotal =
      (pkmn.ivs.hp ?? 8) +
      (pkmn.ivs.attack ?? 8) +
      (pkmn.ivs.defense ?? 8) +
      (pkmn.ivs.spAttack ?? 8) +
      (pkmn.ivs.spDefense ?? 8) +
      (pkmn.ivs.speed ?? 8);
  } else {
    ivTotal = 40; // Default median DV score
  }

  const maxHp = pkmn.stats?.hp || pkmn.baseStats?.hp || 30;
  const currentHp = Math.min(maxHp, Math.max(1, pkmn.currentHp ?? maxHp));
  const hpBonus = Math.round((currentHp / maxHp) * 100);

  return baseScore + levelScore + ivTotal + hpBonus;
}

export function getJudgeGrade(score: number): string {
  if (score >= 260) return 'GRADE A+';
  if (score >= 220) return 'GRADE A';
  if (score >= 180) return 'GRADE B';
  if (score >= 140) return 'GRADE C';
  return 'GRADE D';
}

/**
 * Bug-Catching Contest is canonically held on Tuesday (2), Thursday (4), and Saturday (6).
 */
export function isContestDay(dayOfWeekIndex: number): boolean {
  return dayOfWeekIndex === 2 || dayOfWeekIndex === 4 || dayOfWeekIndex === 6;
}

export class BugContestManager {
  public static readonly INITIAL_BALLS = 20;
  public static readonly INITIAL_TIME_SECONDS = 1200; // 20 minutes

  public state: BugContestState;
  private leaderboard: BugContestLeaderboardEntry[];
  private personalBestScore: number = 0;

  constructor(savedRecords?: BugContestLeaderboardEntry[]) {
    this.state = {
      isActive: false,
      ballsRemaining: 0,
      bestCaughtPokemon: undefined,
      timeRemainingSec: 0,
    };
    this.leaderboard = [...DEFAULT_NPC_CONTEST_RECORDS];
    if (savedRecords && Array.isArray(savedRecords)) {
      this.deserializeRecords(savedRecords);
    }
  }

  public startContest(): BugContestState {
    this.state = {
      isActive: true,
      ballsRemaining: BugContestManager.INITIAL_BALLS,
      bestCaughtPokemon: undefined,
      timeRemainingSec: BugContestManager.INITIAL_TIME_SECONDS,
    };
    return { ...this.state };
  }

  public useBall(): boolean {
    if (!this.state.isActive || this.state.ballsRemaining <= 0) {
      return false;
    }
    this.state.ballsRemaining--;
    if (this.state.ballsRemaining <= 0) {
      // Out of balls ends contest
      this.state.isActive = false;
    }
    return true;
  }

  public tick(seconds: number = 1): boolean {
    if (!this.state.isActive) return false;
    this.state.timeRemainingSec = Math.max(0, this.state.timeRemainingSec - seconds);
    if (this.state.timeRemainingSec <= 0) {
      this.state.isActive = false;
      return true; // Timer expired
    }
    return false;
  }

  /**
   * Evaluates a newly caught Pokémon in the Bug-Catching Contest.
   * If player has no specimen yet, keeps it automatically without prompting.
   * If player already holds a specimen, signals that a swap decision is required.
   */
  public recordCatch(newCatch: PokemonInstance): { promptSwap: boolean; kept: boolean } {
    if (!this.state.isActive) {
      return { promptSwap: false, kept: false };
    }

    if (!this.state.bestCaughtPokemon) {
      this.state.bestCaughtPokemon = newCatch;
      return { promptSwap: false, kept: true };
    }

    // Already holding a specimen; prompt trainer to compare and decide
    return { promptSwap: true, kept: false };
  }

  public swapSpecimen(newCatch: PokemonInstance): void {
    if (this.state.isActive) {
      this.state.bestCaughtPokemon = newCatch;
    }
  }

  public keepCurrentSpecimen(): void {
    // Current specimen is preserved, new catch is released back to the park
  }

  public endContest(trainerName: string = 'GOLD'): BugContestJudgeResult {
    this.state.isActive = false;
    const best = this.state.bestCaughtPokemon;
    const score = calculateJudgeScore(best);
    const grade = getJudgeGrade(score);

    // Canonical Gen 2 Crystal tournament prizes:
    // 1st Prize: Sun Stone (Score >= 180 or any valid bug specimen caught)
    // 2nd Prize: Everstone
    // 3rd Prize: Gold Berry
    // Consolation: Berry
    let rank = 1;
    let prizeItem = 'sun_stone';
    let prizeName = 'SUN STONE';

    if (!best || score === 0) {
      rank = 4;
      prizeItem = 'berry';
      prizeName = 'BERRY';
    } else if (score < 140) {
      rank = 3;
      prizeItem = 'goldberry';
      prizeName = 'GOLD BERRY';
    } else if (score < 180) {
      rank = 2;
      prizeItem = 'everstone';
      prizeName = 'EVERSTONE';
    } else {
      rank = 1;
      prizeItem = 'sun_stone';
      prizeName = 'SUN STONE';
    }

    let isNewPersonalBest = false;
    if (best && score > 0) {
      if (score > this.personalBestScore) {
        this.personalBestScore = score;
        isNewPersonalBest = true;
      }
      this.recordLeaderboardEntry({
        id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        trainerName: trainerName.toUpperCase(),
        speciesId: best.speciesId.toLowerCase(),
        level: best.level || 10,
        score,
        grade,
        rank,
        prizeName,
        timestamp: Date.now(),
        isPlayer: true,
      });
    }

    return {
      rank,
      score,
      grade,
      prizeItem,
      prizeName,
      bestPokemon: best,
      isNewPersonalBest,
    };
  }

  public recordLeaderboardEntry(entry: BugContestLeaderboardEntry): void {
    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    if (this.leaderboard.length > 10) {
      this.leaderboard.length = 10;
    }
    const maxPlayer = this.leaderboard
      .filter((e) => e.isPlayer)
      .reduce((max, e) => Math.max(max, e.score), 0);
    if (maxPlayer > this.personalBestScore) {
      this.personalBestScore = maxPlayer;
    }
  }

  public getTopLeaderboard(limit: number = 5): BugContestLeaderboardEntry[] {
    return [...this.leaderboard].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  public getPersonalBestScore(): number {
    return this.personalBestScore;
  }

  public getPersonalBestRecord(): BugContestLeaderboardEntry | null {
    const playerEntries = this.leaderboard
      .filter((e) => e.isPlayer)
      .sort((a, b) => b.score - a.score);
    return playerEntries[0] || null;
  }

  public serializeRecords(): BugContestLeaderboardEntry[] {
    return this.leaderboard.filter((e) => e.isPlayer);
  }

  public deserializeRecords(savedPlayerEntries?: BugContestLeaderboardEntry[]): void {
    this.leaderboard = [...DEFAULT_NPC_CONTEST_RECORDS];
    this.personalBestScore = 0;
    if (!savedPlayerEntries || !Array.isArray(savedPlayerEntries)) return;
    for (const entry of savedPlayerEntries) {
      if (entry && typeof entry.score === 'number') {
        this.recordLeaderboardEntry({ ...entry, isPlayer: true });
      }
    }
  }
}

