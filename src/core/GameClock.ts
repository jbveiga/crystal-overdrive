import type { SpeedMultiplier } from '../types/game';

export interface ClockDeltas {
  dtWorld: number;
  dtPlayer: number;
  dtBattle: number;
}

export type TimeOfDay = 'MORNING' | 'DAY' | 'NIGHT';

export interface AmbientTint {
  color: number;
  alpha: number;
}

export class GameClock {
  /** Battle simulation speed ceiling (dialogue speed is decoupled from this). */
  public static readonly MAX_BATTLE_SPEED: SpeedMultiplier = 3;
  /** Default overworld traversal speed. */
  public static readonly DEFAULT_PLAYER_SPEED: SpeedMultiplier = 3;

  private _playerSpeed: SpeedMultiplier = GameClock.DEFAULT_PLAYER_SPEED;
  private _battleSpeed: SpeedMultiplier = 1;
  private _simulatedHour?: number;
  private readonly maxDelta: number = 0.1; // Max 100ms clamp to prevent spiral of death

  constructor(
    initialPlayerSpeed: SpeedMultiplier = GameClock.DEFAULT_PLAYER_SPEED,
    initialBattleSpeed: SpeedMultiplier = 1
  ) {
    this._playerSpeed = initialPlayerSpeed;
    this._battleSpeed = Math.min(initialBattleSpeed, GameClock.MAX_BATTLE_SPEED) as SpeedMultiplier;
  }

  public setSimulatedHour(hour: number | undefined): void {
    this._simulatedHour = hour;
  }

  public getSimulatedHour(): number | undefined {
    return this._simulatedHour;
  }

  /**
   * Returns Johto time of day (Morning 4:00-9:59, Day 10:00-17:59, Night 18:00-3:59)
   */
  public getTimeOfDay(date: Date = new Date()): TimeOfDay {
    const hour = this._simulatedHour !== undefined ? this._simulatedHour : date.getHours();
    if (hour >= 4 && hour < 10) return 'MORNING';
    if (hour >= 10 && hour < 18) return 'DAY';
    return 'NIGHT';
  }

  /**
   * Returns color and opacity tint for ambient lighting (Ticket 6.2)
   */
  public static getAmbientTint(timeOfDay: TimeOfDay): AmbientTint {
    switch (timeOfDay) {
      case 'MORNING':
        return { color: 0xfbbf24, alpha: 0.12 };
      case 'DAY':
        return { color: 0x000000, alpha: 0.0 };
      case 'NIGHT':
        return { color: 0x0f172a, alpha: 0.38 };
    }
  }

  get playerSpeed(): SpeedMultiplier {
    return this._playerSpeed;
  }

  set playerSpeed(speed: SpeedMultiplier) {
    if (speed === 1 || speed === 2 || speed === 3 || speed === 4) {
      this._playerSpeed = speed;
    }
  }

  get battleSpeed(): SpeedMultiplier {
    return this._battleSpeed;
  }

  set battleSpeed(speed: SpeedMultiplier) {
    if (speed === 1 || speed === 2 || speed === 3 || speed === 4) {
      this._battleSpeed = Math.min(speed, GameClock.MAX_BATTLE_SPEED) as SpeedMultiplier;
    }
  }

  /**
   * Cycles player speed between 1x -> 2x -> 3x -> 4x -> 1x
   */
  cyclePlayerSpeed(): SpeedMultiplier {
    this._playerSpeed = ((this._playerSpeed % 4) + 1) as SpeedMultiplier;
    return this._playerSpeed;
  }

  /**
   * Cycles battle speed between 1x -> 2x -> 3x -> 1x (capped at MAX_BATTLE_SPEED)
   */
  cycleBattleSpeed(): SpeedMultiplier {
    this._battleSpeed = ((this._battleSpeed % GameClock.MAX_BATTLE_SPEED) + 1) as SpeedMultiplier;
    return this._battleSpeed;
  }

  /**
   * Clamps raw delta time and returns decoupled dt for world, player, and battle.
   * @param rawDeltaSec Delta time in seconds since previous tick
   */
  tick(rawDeltaSec: number): ClockDeltas {
    const clampedDt = Math.min(Math.max(0, rawDeltaSec), this.maxDelta);
    return {
      dtWorld: clampedDt * 1.0,
      dtPlayer: clampedDt * this._playerSpeed,
      dtBattle: clampedDt * this._battleSpeed,
    };
  }
}
