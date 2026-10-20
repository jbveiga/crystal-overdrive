import type { PokemonInstance, MoveData, PokeballId, PokemonType, MoveCategory, StatId } from '../types/game';
import { DamageCalculator } from './DamageCalculator';
import { PokemonFactory } from './PokemonFactory';
import { CatchCalculator } from './CatchCalculator';
import { EffectivenessHelper } from './EffectivenessHelper';

export type BattleActionType = 'FIGHT' | 'RUN' | 'BAG' | 'SWITCH';

export interface BattleAction {
  type: BattleActionType;
  moveId?: string;
  ballId?: PokeballId;
  switchPokemon?: PokemonInstance;
}

export interface BattleTurnResult {
  turnNumber: number;
  events: BattleEvent[];
  isBattleOver: boolean;
  winner?: 'PLAYER' | 'ENEMY' | 'NONE';
  caught?: boolean;
}

export type BattleEvent =
  | { type: 'MESSAGE'; text: string }
  | {
      type: 'ATTACK';
      attackerId: string;
      defenderId: string;
      moveName: string;
      moveType?: PokemonType;
      moveCategory?: MoveCategory;
    }
  | { type: 'MISS'; attackerId: string }
  | { type: 'DAMAGE'; targetId: string; damage: number; remainingHp: number; effectiveness: number; isCritical: boolean }
  | { type: 'STAT_CHANGE'; targetId: string; stat: StatId; stages: number }
  | { type: 'RESIDUAL_DAMAGE'; targetId: string; damage: number; remainingHp: number; status: string }
  | { type: 'SWITCH'; newPokemon: PokemonInstance }
  | { type: 'FAINT'; targetId: string }
  | { type: 'FLEE'; runnerId: string; success: boolean }
  | { type: 'STATUS'; targetId: string; status: string }
  | { type: 'THROW_BALL'; ballId: PokeballId }
  | { type: 'SHAKE'; shakes: 0 | 1 | 2 | 3 | 4; caught: boolean }
  | { type: 'CAUGHT'; targetId: string };

const STAT_LABELS: Record<StatId, string> = {
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
  acc: 'Accuracy',
  eva: 'Evasion',
};

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
    this.playerPokemon.statStages = PokemonFactory.createDefaultStatStages();
    this.enemyPokemon.statStages = PokemonFactory.createDefaultStatStages();
  }

  public getEffectiveSpeed(pkmn: PokemonInstance): number {
    const stageMult = DamageCalculator.getStatStageMultiplier(pkmn.statStages?.spe ?? 0);
    const parMult = pkmn.status === 'PAR' ? 0.5 : 1.0;
    return Math.max(1, Math.floor(pkmn.stats.speed * stageMult * parMult));
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
      events.push({ type: 'MESSAGE', text: 'Got away safely!' });
      this.isBattleOver = true;
      return {
        turnNumber: this.turnCount,
        events,
        isBattleOver: true,
        winner: 'NONE',
      };
    }

    // 2. Handle Party Switch action
    if (playerAction.type === 'SWITCH' && playerAction.switchPokemon) {
      const oldName = this.playerPokemon.nickname;
      this.playerPokemon.statStages = PokemonFactory.createDefaultStatStages();
      this.playerPokemon.isTrapped = false;

      this.playerPokemon = playerAction.switchPokemon;
      this.playerPokemon.statStages = PokemonFactory.createDefaultStatStages();

      events.push({ type: 'MESSAGE', text: `${oldName}, switch out! Come back!` });
      events.push({ type: 'SWITCH', newPokemon: this.playerPokemon });
      events.push({ type: 'MESSAGE', text: `Go! ${this.playerPokemon.nickname}!` });

      // Enemy acts after player switches
      const enemyMoves = this.enemyPokemon.moves;
      const enemyMoveId = enemyMoves[Math.floor(Math.random() * enemyMoves.length)].moveId;
      const enemyMove = PokemonFactory.getMoveData(enemyMoveId);
      this.executeMove(this.enemyPokemon, this.playerPokemon, enemyMove, events);

      const faintCheckAfterSwitch = this.checkFaints(events);
      if (faintCheckAfterSwitch) return faintCheckAfterSwitch;

      this.applyEndOfTurnResiduals(events);
      const faintCheckAfterResiduals = this.checkFaints(events);
      if (faintCheckAfterResiduals) return faintCheckAfterResiduals;

      return {
        turnNumber: this.turnCount,
        events,
        isBattleOver: false,
      };
    }

    // 3. Handle Bag (Pokéball Throw) action
    if (playerAction.type === 'BAG') {
      const ballId = playerAction.ballId || 'poke-ball';
      events.push({ type: 'THROW_BALL', ballId });
      events.push({ type: 'MESSAGE', text: `You threw a ${ballId.replace('-', ' ').toUpperCase()}!` });

      const catchResult = CatchCalculator.attemptCatch(ballId, this.enemyPokemon, {
        turnNumber: this.turnCount,
      });

      events.push({ type: 'SHAKE', shakes: catchResult.shakes, caught: catchResult.caught });

      if (catchResult.caught) {
        events.push({ type: 'CAUGHT', targetId: this.enemyPokemon.uid });
        events.push({ type: 'MESSAGE', text: `Gotcha! ${this.enemyPokemon.nickname} was caught!` });
        this.isBattleOver = true;
        return {
          turnNumber: this.turnCount,
          events,
          isBattleOver: true,
          winner: 'PLAYER',
          caught: true,
        };
      } else {
        const shakeMessages = [
          'Oh no! The Pokémon broke free!',
          'Aww! It appeared to be caught!',
          'Aargh! Almost had it!',
          'Shoot! It was so close, too!',
        ];
        events.push({ type: 'MESSAGE', text: shakeMessages[catchResult.shakes] || shakeMessages[0] });

        // Enemy gets to attack after failed catch
        const enemyMoves = this.enemyPokemon.moves;
        const enemyMoveId = enemyMoves[Math.floor(Math.random() * enemyMoves.length)].moveId;
        const enemyMove = PokemonFactory.getMoveData(enemyMoveId);
        this.executeMove(this.enemyPokemon, this.playerPokemon, enemyMove, events);

        const faintResult = this.checkFaints(events);
        if (faintResult) return faintResult;

        this.applyEndOfTurnResiduals(events);
        const residualFaintResult = this.checkFaints(events);
        if (residualFaintResult) return residualFaintResult;

        return {
          turnNumber: this.turnCount,
          events,
          isBattleOver: false,
        };
      }
    }

    // 4. Determine Enemy Action
    // Check Roaming Beast 2-turn grace window flee rule
    if (this.isRoamer && this.turnCount >= 3) {
      const canFlee =
        !this.enemyPokemon.isTrapped &&
        this.enemyPokemon.status !== 'SLP' &&
        this.enemyPokemon.status !== 'FRZ';
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

    // 5. Resolve Turn Order (Priority > Effective Speed [Stat Stage + PAR 0.5x] > 50/50 Coin flip)
    let playerMove: MoveData | null = null;
    if (playerAction.moveId) {
      playerMove = PokemonFactory.getMoveData(playerAction.moveId);
    }

    const playerPriority = playerMove?.priority ?? 0;
    const enemyPriority = enemyMove.priority;
    const playerSpeed = this.getEffectiveSpeed(this.playerPokemon);
    const enemySpeed = this.getEffectiveSpeed(this.enemyPokemon);

    let playerFirst = true;
    if (playerPriority !== enemyPriority) {
      playerFirst = playerPriority > enemyPriority;
    } else if (playerSpeed !== enemySpeed) {
      playerFirst = playerSpeed > enemySpeed;
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

    // Check if first defender fainted
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

    // 6. End-of-Turn Residuals (Burn / Poison)
    this.applyEndOfTurnResiduals(events);
    const residualFaint = this.checkFaints(events);
    if (residualFaint) return residualFaint;

    return {
      turnNumber: this.turnCount,
      events,
      isBattleOver: false,
    };
  }

  private checkFaints(events: BattleEvent[]): BattleTurnResult | null {
    if (this.enemyPokemon.currentHp <= 0) {
      this.enemyPokemon.currentHp = 0;
      events.push({ type: 'FAINT', targetId: this.enemyPokemon.uid });
      events.push({ type: 'MESSAGE', text: `${this.enemyPokemon.nickname} fainted!` });
      this.isBattleOver = true;
      return {
        turnNumber: this.turnCount,
        events,
        isBattleOver: true,
        winner: 'PLAYER',
      };
    }
    if (this.playerPokemon.currentHp <= 0) {
      this.playerPokemon.currentHp = 0;
      events.push({ type: 'FAINT', targetId: this.playerPokemon.uid });
      events.push({ type: 'MESSAGE', text: `${this.playerPokemon.nickname} fainted!` });
      this.isBattleOver = true;
      return {
        turnNumber: this.turnCount,
        events,
        isBattleOver: true,
        winner: 'ENEMY',
      };
    }
    return null;
  }

  private applyEndOfTurnResiduals(events: BattleEvent[]): void {
    const combatants = [this.playerPokemon, this.enemyPokemon];
    for (const pkmn of combatants) {
      if (pkmn.currentHp <= 0) continue;
      if (pkmn.status === 'BRN' || pkmn.status === 'PSN' || pkmn.status === 'TOX') {
        const dmg = Math.max(1, Math.floor(pkmn.stats.hp / 8));
        pkmn.currentHp = Math.max(0, pkmn.currentHp - dmg);
        const conditionWord = pkmn.status === 'BRN' ? 'burn' : 'poison';
        events.push({
          type: 'MESSAGE',
          text: `${pkmn.nickname} is hurt by its ${conditionWord}!`,
        });
        events.push({
          type: 'RESIDUAL_DAMAGE',
          targetId: pkmn.uid,
          damage: dmg,
          remainingHp: pkmn.currentHp,
          status: pkmn.status,
        });
        if (pkmn.currentHp <= 0) {
          break;
        }
      }
    }
  }

  private executeMove(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    events: BattleEvent[]
  ): void {
    // 1. Sleep Check
    if (attacker.status === 'SLP') {
      if (attacker.sleepTurns === undefined) {
        attacker.sleepTurns = 2;
      }
      if (attacker.sleepTurns > 0) {
        attacker.sleepTurns--;
        events.push({
          type: 'MESSAGE',
          text: `${attacker.nickname} is fast asleep.`,
        });
        return;
      } else {
        attacker.status = 'NONE';
        events.push({
          type: 'STATUS',
          targetId: attacker.uid,
          status: 'NONE',
        });
        events.push({
          type: 'MESSAGE',
          text: `${attacker.nickname} woke up!`,
        });
      }
    }

    // 2. Full Paralysis Check (25% chance to skip turn)
    if (attacker.status === 'PAR' && Math.random() < 0.25) {
      events.push({
        type: 'MESSAGE',
        text: `${attacker.nickname} is paralyzed! It can't move!`,
      });
      return;
    }

    // 3. Announce Attack
    events.push({
      type: 'ATTACK',
      attackerId: attacker.uid,
      defenderId: defender.uid,
      moveName: move.name,
      moveType: move.type,
      moveCategory: move.category,
    });
    events.push({
      type: 'MESSAGE',
      text: `${attacker.nickname} used ${move.name}!`,
    });

    // 4. Accuracy & Evasion Check (Self-targeting status moves and Swift never miss)
    if (move.statChanges?.target !== 'self' && move.id !== 'swift') {
      const accStage = attacker.statStages?.acc ?? 0;
      const evaStage = defender.statStages?.eva ?? 0;
      const accMult = DamageCalculator.getAccEvaStageMultiplier(accStage);
      const evaMult = DamageCalculator.getAccEvaStageMultiplier(evaStage);
      const hitChance = (move.accuracy / 100) * (accMult / evaMult);

      if (Math.random() > hitChance) {
        events.push({ type: 'MISS', attackerId: attacker.uid });
        events.push({
          type: 'MESSAGE',
          text: `${attacker.nickname}'s attack missed!`,
        });
        return;
      }
    }

    // 5. Trapping move check (e.g. Mean Look)
    if (move.trapsTarget) {
      defender.isTrapped = true;
      events.push({
        type: 'MESSAGE',
        text: `${defender.nickname} can no longer escape!`,
      });
      return;
    }

    // 6. Stat Stage Modification move check (e.g. Leer, Growl, Tail Whip, Sand-Attack, Defense Curl)
    if (move.statChanges && move.category === 'Status') {
      const targetPkmn = move.statChanges.target === 'self' ? attacker : defender;
      if (!targetPkmn.statStages) {
        targetPkmn.statStages = PokemonFactory.createDefaultStatStages();
      }
      const stat = move.statChanges.stat;
      const delta = move.statChanges.stages;
      const currentStage = targetPkmn.statStages[stat];
      const nextStage = Math.max(-6, Math.min(6, currentStage + delta));
      const statLabel = STAT_LABELS[stat];

      if (nextStage === currentStage) {
        const limitWord = delta > 0 ? 'higher' : 'lower';
        events.push({
          type: 'MESSAGE',
          text: `${targetPkmn.nickname}'s ${statLabel} won't go any ${limitWord}!`,
        });
      } else {
        targetPkmn.statStages[stat] = nextStage;
        events.push({
          type: 'STAT_CHANGE',
          targetId: targetPkmn.uid,
          stat,
          stages: delta,
        });
        const changeText =
          delta >= 2 ? 'sharply rose!' : delta === 1 ? 'rose!' : delta <= -2 ? 'harshly fell!' : 'fell!';
        events.push({
          type: 'MESSAGE',
          text: `${targetPkmn.nickname}'s ${statLabel} ${changeText}`,
        });
      }
      return;
    }

    // 7. Status move check (e.g. Thunder Wave, Hypnosis, Poison Powder)
    if (move.inflictsStatus) {
      const typeMult = EffectivenessHelper.calculateMultiplier(move.type, defender.types);
      if (typeMult === 0) {
        events.push({
          type: 'MESSAGE',
          text: `It doesn't affect ${defender.nickname}...`,
        });
        return;
      }
      if (defender.status !== 'NONE') {
        events.push({
          type: 'MESSAGE',
          text: 'But it failed!',
        });
        return;
      }

      defender.status = move.inflictsStatus;
      if (move.inflictsStatus === 'SLP') {
        defender.sleepTurns = 1 + Math.floor(Math.random() * 2);
      }
      events.push({
        type: 'STATUS',
        targetId: defender.uid,
        status: move.inflictsStatus,
      });
      const statusTextMap: Record<string, string> = {
        PAR: 'is paralyzed! It may be unable to move!',
        SLP: 'fell asleep!',
        PSN: 'was poisoned!',
        BRN: 'was burned!',
      };
      events.push({
        type: 'MESSAGE',
        text: `${defender.nickname} ${statusTextMap[move.inflictsStatus] || 'was afflicted!'}`,
      });
      return;
    }

    // 8. Calculate & Apply Direct Damage
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

    // 9. Secondary Status Effect Check (e.g. Ember 10% Burn, Spark 30% Paralysis)
    if (
      move.secondaryStatus &&
      defender.currentHp > 0 &&
      defender.status === 'NONE' &&
      result.effectiveness > 0
    ) {
      const sec = move.secondaryStatus;
      const isImmuneFireBurn = sec.status === 'BRN' && defender.types.includes('Fire');
      const isImmuneElecPar = sec.status === 'PAR' && defender.types.includes('Electric');

      if (!isImmuneFireBurn && !isImmuneElecPar && Math.random() < sec.chance) {
        defender.status = sec.status;
        events.push({
          type: 'STATUS',
          targetId: defender.uid,
          status: sec.status,
        });
        const secMsg =
          sec.status === 'BRN'
            ? `${defender.nickname} was burned!`
            : `${defender.nickname} is paralyzed! It may be unable to move!`;
        events.push({
          type: 'MESSAGE',
          text: secMsg,
        });
      }
    }
  }
}
