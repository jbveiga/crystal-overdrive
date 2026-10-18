import type { SpeedMultiplier } from '../types/game';

export interface ClockDeltas {
  dtWorld: number;
  dtPlayer: number;
  dtBattle: number;
}

export class GameClock {
  private _playerSpeed: SpeedMultiplier = 1;
  private _battleSpeed: SpeedMultiplier = 1;
  private readonly maxDelta: number = 0.1; // Max 100ms clamp to prevent spiral of death

  constructor(initialPlayerSpeed: SpeedMultiplier = 1, initialBattleSpeed: SpeedMultiplier = 1) {
    this._playerSpeed = initialPlayerSpeed;
    this._battleSpeed = initialBattleSpeed;
  }

  get playerSpeed(): SpeedMultiplier {
    return this._playerSpeed;
  }

  set playerSpeed(speed: SpeedMultiplier) {
    if (speed === 1 || speed === 2 || speed === 3) {
      this._playerSpeed = speed;
    }
  }

  get battleSpeed(): SpeedMultiplier {
    return this._battleSpeed;
  }

  set battleSpeed(speed: SpeedMultiplier) {
    if (speed === 1 || speed === 2 || speed === 3) {
      this._battleSpeed = speed;
    }
  }

  /**
   * Cycles player speed between 1x -> 2x -> 3x -> 1x
   */
  cyclePlayerSpeed(): SpeedMultiplier {
    this._playerSpeed = ((this._playerSpeed % 3) + 1) as SpeedMultiplier;
    return this._playerSpeed;
  }

  /**
   * Cycles battle speed between 1x -> 2x -> 3x -> 1x
   */
  cycleBattleSpeed(): SpeedMultiplier {
    this._battleSpeed = ((this._battleSpeed % 3) + 1) as SpeedMultiplier;
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
