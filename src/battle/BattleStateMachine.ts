import type { PokemonInstance, MoveData } from '../types/game';
import { DamageCalculator } from './DamageCalculator';
import { PokemonFactory } from './PokemonFactory';

export type BattleActionType = 'FIGHT' | 'RUN' | 'BAG';

export interface BattleAction {
  type: BattleActionType;
  moveId?: string;
}

export interface BattleTurnResult {
  turnNumber: number;
  events: BattleEvent[];
  isBattleOver: boolean;
  winner?: 'PLAYER' | 'ENEMY' | 'NONE';
}

export type BattleEvent =
  | { type: 'MESSAGE'; text: string }
  | { type: 'ATTACK'; attackerId: string; defenderId: string; moveName: string }
  | { type: 'DAMAGE'; targetId: string; damage: number; remainingHp: number; effectiveness: number; isCritical: boolean }
  | { type: 'FAINT'; targetId: string }
  | { type: 'FLEE'; runnerId: string; success: boolean }
  | { type: 'STATUS'; targetId: string; status: string };

export class BattleStateMachine {
  public playerPokemon: PokemonInstance;
  public enemyPokemon: PokemonInstance;
  public isRoamer: boolean;
  public turnCount: number = 0;
  public isBattleOver: boolean = false;

  constructor(playerPokemon: PokemonInstance, enemyPokemon: PokemonInstance, isRoamer: boolean = false) {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.isRoamer = isRoamer;
  }

  /**
   * Executes a full battle round based on player's chosen action
   */
  public executeRound(playerAction: BattleAction): BattleTurnResult {
    if (this.isBattleOver) {
      return { turnNumber: this.turnCount, events: [], isBattleOver: true };
    }

    this.turnCount++;
    const events: BattleEvent[] = [];

    // 1. Handle Run action
    if (playerAction.type === 'RUN') {
      // Roamers can't trap player, player can flee from wild battles
      events.push({ type: 'MESSAGE', text: 'Got away safely!' });
      this.isBattleOver = true;
      return {
        turnNumber: this.turnCount,
        events,
        isBattleOver: true,
        winner: 'NONE',
      };
    }

    // 2. Determine Enemy Action
    // Check Roaming Beast 2-turn grace window flee rule
    if (this.isRoamer && this.turnCount >= 3) {
      const canFlee = !this.enemyPokemon.isTrapped && this.enemyPokemon.status !== 'SLP' && this.enemyPokemon.status !== 'FRZ';
      if (canFlee) {
        events.push({ type: 'MESSAGE', text: `Wild ${this.enemyPokemon.nickname} fled!` });
        events.push({ type: 'FLEE', runnerId: this.enemyPokemon.uid, success: true });
        this.isBattleOver = true;
        return {
          turnNumber: this.turnCount,
          events,
          isBattleOver: true,
          winner: 'NONE',
        };
      }
    }

    // Pick enemy move
    const enemyMoves = this.enemyPokemon.moves;
    const enemyMoveId = enemyMoves[Math.floor(Math.random() * enemyMoves.length)].moveId;
    const enemyMove = PokemonFactory.getMoveData(enemyMoveId);

    // 3. Resolve Turn Order (Priority > Speed > 50/50 Coin flip)
    let playerMove: MoveData | null = null;
    if (playerAction.moveId) {
      playerMove = PokemonFactory.getMoveData(playerAction.moveId);
    }

    const playerPriority = playerMove?.priority ?? 0;
    const enemyPriority = enemyMove.priority;

    let playerFirst = true;
    if (playerPriority !== enemyPriority) {
      playerFirst = playerPriority > enemyPriority;
    } else if (this.playerPokemon.stats.speed !== this.enemyPokemon.stats.speed) {
      playerFirst = this.playerPokemon.stats.speed > this.enemyPokemon.stats.speed;
    } else {
      playerFirst = Math.random() < 0.5;
    }

    const firstAttacker = playerFirst ? this.playerPokemon : this.enemyPokemon;
    const firstDefender = playerFirst ? this.enemyPokemon : this.playerPokemon;
    const firstMove = playerFirst ? playerMove : enemyMove;

    const secondAttacker = playerFirst ? this.enemyPokemon : this.playerPokemon;
    const secondDefender = playerFirst ? this.playerPokemon : this.enemyPokemon;
    const secondMove = playerFirst ? enemyMove : playerMove;

    // Execute First Attack
    if (firstMove) {
      this.executeMove(firstAttacker, firstDefender, firstMove, events);
    }

    // Check if defender fainted
    if (firstDefender.currentHp <= 0) {
      firstDefender.currentHp = 0;
      events.push({ type: 'FAINT', targetId: firstDefender.uid });
      events.push({ type: 'MESSAGE', text: `${firstDefender.nickname} fainted!` });
      this.isBattleOver = true;
      return {
        turnNumber: this.turnCount,
        events,
        isBattleOver: true,
        winner: playerFirst ? 'PLAYER' : 'ENEMY',
      };
    }

    // Execute Second Attack
    if (secondMove) {
      this.executeMove(secondAttacker, secondDefender, secondMove, events);
    }

    if (secondDefender.currentHp <= 0) {
      secondDefender.currentHp = 0;
      events.push({ type: 'FAINT', targetId: secondDefender.uid });
      events.push({ type: 'MESSAGE', text: `${secondDefender.nickname} fainted!` });
      this.isBattleOver = true;
      return {
        turnNumber: this.turnCount,
        events,
        isBattleOver: true,
        winner: playerFirst ? 'ENEMY' : 'PLAYER',
      };
    }

    return {
      turnNumber: this.turnCount,
      events,
      isBattleOver: false,
    };
  }

  private executeMove(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    events: BattleEvent[]
  ): void {
    events.push({
      type: 'ATTACK',
      attackerId: attacker.uid,
      defenderId: defender.uid,
      moveName: move.name,
    });
    events.push({
      type: 'MESSAGE',
      text: `${attacker.nickname} used ${move.name}!`,
    });

    // Trapping move check (e.g. Mean Look)
    if (move.trapsTarget) {
      defender.isTrapped = true;
      events.push({
        type: 'MESSAGE',
        text: `${defender.nickname} can no longer escape!`,
      });
      return;
    }

    // Status move check (e.g. Thunder Wave)
    if (move.inflictsStatus && defender.status === 'NONE') {
      defender.status = move.inflictsStatus;
      events.push({
        type: 'STATUS',
        targetId: defender.uid,
        status: move.inflictsStatus,
      });
      const statusText = move.inflictsStatus === 'PAR' ? 'paralyzed! It may be unable to move!' : 'fell asleep!';
      events.push({
        type: 'MESSAGE',
        text: `${defender.nickname} is ${statusText}`,
      });
      return;
    }

    // Calculate Damage
    const result = DamageCalculator.calculate(attacker, defender, move);

    defender.currentHp = Math.max(0, defender.currentHp - result.damage);

    events.push({
      type: 'DAMAGE',
      targetId: defender.uid,
      damage: result.damage,
      remainingHp: defender.currentHp,
      effectiveness: result.effectiveness,
      isCritical: result.isCritical,
    });

    if (result.isCritical) {
      events.push({ type: 'MESSAGE', text: 'A critical hit!' });
    }

    if (result.effectiveness >= 2) {
      events.push({ type: 'MESSAGE', text: "It's super effective!" });
    } else if (result.effectiveness > 0 && result.effectiveness < 1) {
      events.push({ type: 'MESSAGE', text: "It's not very effective..." });
    } else if (result.effectiveness === 0) {
      events.push({ type: 'MESSAGE', text: `It doesn't affect ${defender.nickname}...` });
    }
  }
}
