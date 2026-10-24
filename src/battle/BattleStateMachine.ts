import type { PokemonInstance, MoveData, PokeballId, PokemonType, MoveCategory, StatId } from '../types/game';
import { DamageCalculator } from './DamageCalculator';
import { PokemonFactory } from './PokemonFactory';
import { CatchCalculator } from './CatchCalculator';
import { EffectivenessHelper } from './EffectivenessHelper';

export type BattleActionType = 'FIGHT' | 'RUN' | 'BAG' | 'SWITCH' | 'USE_ITEM';

export type StadiumWeather = 'NONE' | 'SUN' | 'RAIN' | 'SANDSTORM';

export interface StadiumRuleSet {
  cupId?: string;
  cupName?: string;
  isDoubleBattle?: boolean;
  weather?: StadiumWeather;
  itemClause?: boolean;
  levelCap?: number;
}

export interface DoubleBattleConfig {
  isDoubleBattle?: boolean;
  playerPartner?: PokemonInstance;
  enemyPartner?: PokemonInstance;
  stadiumRules?: StadiumRuleSet;
}

export const SPREAD_MOVE_IDS: Set<string> = new Set([
  'surf',
  'earthquake',
  'razorleaf',
  'icywind',
  'rockslide',
  'mudslap',
  'swift',
]);

export interface BattleAction {
  type: BattleActionType;
  moveId?: string;
  partnerMoveId?: string;
  targetSlot?: 0 | 1;
  partnerTargetSlot?: 0 | 1;
  ballId?: PokeballId;
  switchPokemon?: PokemonInstance;
  itemId?: string;
  targetPokemon?: PokemonInstance;
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
  | { type: 'HEAL'; targetId: string; healedAmount: number; remainingHp: number }
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
  public playerPartner?: PokemonInstance;
  public enemyPartner?: PokemonInstance;
  public isDoubleBattle: boolean = false;
  public stadiumRules?: StadiumRuleSet;
  public isRoamer: boolean;
  public turnCount: number = 0;
  public escapeAttempts: number = 0;
  public isBattleOver: boolean = false;
  public furyCutterStreaks: Map<string, number> = new Map();

  constructor(
    playerPokemon: PokemonInstance,
    enemyPokemon: PokemonInstance,
    isRoamer: boolean = false,
    doubleConfig?: DoubleBattleConfig
  ) {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.isRoamer = isRoamer;
    this.playerPokemon.statStages = PokemonFactory.createDefaultStatStages();
    this.enemyPokemon.statStages = PokemonFactory.createDefaultStatStages();

    if (doubleConfig) {
      this.isDoubleBattle = Boolean(
        doubleConfig.isDoubleBattle ||
          doubleConfig.playerPartner ||
          doubleConfig.enemyPartner ||
          doubleConfig.stadiumRules?.isDoubleBattle
      );
      this.playerPartner = doubleConfig.playerPartner;
      this.enemyPartner = doubleConfig.enemyPartner;
      this.stadiumRules = doubleConfig.stadiumRules;
      if (this.playerPartner) {
        this.playerPartner.statStages = PokemonFactory.createDefaultStatStages();
      }
      if (this.enemyPartner) {
        this.enemyPartner.statStages = PokemonFactory.createDefaultStatStages();
      }
    }
  }

  public getEffectiveSpeed(pkmn: PokemonInstance): number {
    const stageMult = DamageCalculator.getStatStageMultiplier(pkmn.statStages?.spe ?? 0);
    const parMult = pkmn.status === 'PAR' ? 0.5 : 1.0;
    return Math.max(1, Math.floor(pkmn.stats.speed * stageMult * parMult));
  }

  /**
   * Authentic Gen 2 Run escape calculation:
   * F = floor((PlayerSpeed * 128) / EnemySpeed) + 30 * escapeAttempts
   * Always succeeds if PlayerSpeed >= EnemySpeed or F >= 255.
   */
  public calculateEscapeSuccess(rng: () => number = Math.random): boolean {
    this.escapeAttempts++;
    const playerSpeed = this.getEffectiveSpeed(this.playerPokemon);
    const enemySpeed = Math.max(1, this.getEffectiveSpeed(this.enemyPokemon));
    if (playerSpeed >= enemySpeed) {
      return true;
    }
    const f = Math.floor((playerSpeed * 128) / enemySpeed) + 30 * this.escapeAttempts;
    if (f >= 255) {
      return true;
    }
    return Math.floor(rng() * 256) < f;
  }

  /**
   * Computes canonical Gen 2 trainer victory payout based on highest level Pokémon in the trainer's party.
   */
  public static calculateTrainerPayout(
    trainerTeam: PokemonInstance[],
    baseRewardPerLevel: number = 40
  ): number {
    if (!trainerTeam || trainerTeam.length === 0) return 200;
    const maxLevel = Math.max(...trainerTeam.map((p) => p.level || 5));
    return Math.max(200, maxLevel * baseRewardPerLevel);
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
      this.escapeAttempts++;
      events.push({ type: 'FLEE', runnerId: this.playerPokemon.uid, success: true });
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
      if (playerAction.switchPokemon.isEgg) {
        events.push({ type: 'MESSAGE', text: "An EGG can't battle!" });
        return {
          turnNumber: this.turnCount,
          events,
          isBattleOver: false,
        };
      }
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

    // 3b. Handle Medicine / Battle Item Usage
    if (playerAction.type === 'USE_ITEM' && playerAction.itemId) {
      if (this.stadiumRules?.itemClause) {
        events.push({
          type: 'MESSAGE',
          text: '🚫 Stadium Item Clause is active! Bag items are prohibited in this Cup!',
        });
        return {
          turnNumber: this.turnCount,
          events,
          isBattleOver: false,
        };
      }
      const target = playerAction.targetPokemon || this.playerPokemon;
      this.applyBattleItemEffect(playerAction.itemId, target, events);

      // Enemy acts after player uses an item
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

    // Delegate to 2v2 simultaneous combat resolution if Double Battle is active with FIGHT action
    if (this.isDoubleBattle && playerAction.type === 'FIGHT') {
      return this.executeDoubleRoundInternal(playerAction, events);
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

  /**
   * Executes a simultaneous 2v2 Double Battle round where up to 4 active Pokémon
   * act in Priority + Effective Speed order, with spread move and target redirection support.
   */
  public executeDoubleRound(
    slot1Action: BattleAction,
    slot2Action?: BattleAction
  ): BattleTurnResult {
    if (this.isBattleOver) {
      return { turnNumber: this.turnCount, events: [], isBattleOver: true };
    }
    this.isDoubleBattle = true;
    const mergedAction: BattleAction = {
      ...slot1Action,
      partnerMoveId: slot2Action?.moveId ?? slot1Action.partnerMoveId,
      partnerTargetSlot: slot2Action?.targetSlot ?? slot1Action.partnerTargetSlot,
    };
    return this.executeRound(mergedAction);
  }

  private executeDoubleRoundInternal(
    playerAction: BattleAction,
    events: BattleEvent[]
  ): BattleTurnResult {
    interface QueuedCombatTurn {
      attacker: PokemonInstance;
      isPlayerSide: boolean;
      move: MoveData;
      preferredTargetSlot: 0 | 1;
    }

    const queue: QueuedCombatTurn[] = [];
    const announcedFaints = new Set<string>();

    // 1. Player Slot 1
    if (this.playerPokemon.currentHp > 0) {
      const mId = playerAction.moveId || this.playerPokemon.moves[0]?.moveId || 'tackle';
      queue.push({
        attacker: this.playerPokemon,
        isPlayerSide: true,
        move: PokemonFactory.getMoveData(mId),
        preferredTargetSlot: playerAction.targetSlot ?? 0,
      });
    }

    // 2. Player Partner Slot 2
    if (this.playerPartner && this.playerPartner.currentHp > 0) {
      const pMoveId =
        playerAction.partnerMoveId || this.playerPartner.moves[0]?.moveId || 'tackle';
      queue.push({
        attacker: this.playerPartner,
        isPlayerSide: true,
        move: PokemonFactory.getMoveData(pMoveId),
        preferredTargetSlot: playerAction.partnerTargetSlot ?? 1,
      });
    }

    // 3. Enemy Slot 1
    if (this.enemyPokemon.currentHp > 0 && this.enemyPokemon.moves.length > 0) {
      const eMoveId =
        this.enemyPokemon.moves[Math.floor(Math.random() * this.enemyPokemon.moves.length)].moveId;
      queue.push({
        attacker: this.enemyPokemon,
        isPlayerSide: false,
        move: PokemonFactory.getMoveData(eMoveId),
        preferredTargetSlot: 0,
      });
    }

    // 4. Enemy Partner Slot 2
    if (this.enemyPartner && this.enemyPartner.currentHp > 0 && this.enemyPartner.moves.length > 0) {
      const epMoveId =
        this.enemyPartner.moves[Math.floor(Math.random() * this.enemyPartner.moves.length)].moveId;
      queue.push({
        attacker: this.enemyPartner,
        isPlayerSide: false,
        move: PokemonFactory.getMoveData(epMoveId),
        preferredTargetSlot: this.playerPartner && this.playerPartner.currentHp > 0 ? 1 : 0,
      });
    }

    // Sort by Move Priority (desc), then Effective Speed (desc)
    queue.sort((a, b) => {
      const pA = a.move.priority ?? 0;
      const pB = b.move.priority ?? 0;
      if (pA !== pB) return pB - pA;
      const sA = this.getEffectiveSpeed(a.attacker);
      const sB = this.getEffectiveSpeed(b.attacker);
      return sB - sA;
    });

    const recordAnyNewFaints = (): BattleTurnResult | null => {
      const allCombatants = [
        this.playerPokemon,
        this.playerPartner,
        this.enemyPokemon,
        this.enemyPartner,
      ].filter((p): p is PokemonInstance => Boolean(p));

      for (const c of allCombatants) {
        if (c.currentHp <= 0 && !announcedFaints.has(c.uid)) {
          c.currentHp = 0;
          announcedFaints.add(c.uid);
          events.push({ type: 'FAINT', targetId: c.uid });
          events.push({ type: 'MESSAGE', text: `${c.nickname} fainted!` });
        }
      }

      const enemyAlive =
        this.enemyPokemon.currentHp > 0 ||
        Boolean(this.enemyPartner && this.enemyPartner.currentHp > 0);
      if (!enemyAlive) {
        this.isBattleOver = true;
        return {
          turnNumber: this.turnCount,
          events,
          isBattleOver: true,
          winner: 'PLAYER',
        };
      }

      const playerAlive =
        this.playerPokemon.currentHp > 0 ||
        Boolean(this.playerPartner && this.playerPartner.currentHp > 0);
      if (!playerAlive) {
        this.isBattleOver = true;
        return {
          turnNumber: this.turnCount,
          events,
          isBattleOver: true,
          winner: 'ENEMY',
        };
      }

      return null;
    };

    for (const item of queue) {
      if (item.attacker.currentHp <= 0) continue;

      const opponents = item.isPlayerSide
        ? [this.enemyPokemon, this.enemyPartner].filter(
            (p): p is PokemonInstance => Boolean(p && p.currentHp > 0)
          )
        : [this.playerPokemon, this.playerPartner].filter(
            (p): p is PokemonInstance => Boolean(p && p.currentHp > 0)
          );

      if (opponents.length === 0) break;

      const isSpread =
        SPREAD_MOVE_IDS.has(item.move.id) &&
        item.move.category !== 'Status' &&
        opponents.length > 1;

      if (isSpread) {
        events.push({
          type: 'MESSAGE',
          text: `🌊 ${item.attacker.nickname}'s ${item.move.name} sweeps across both opponents!`,
        });
        for (const opp of opponents) {
          if (opp.currentHp <= 0) continue;
          this.executeMove(item.attacker, opp, item.move, events, 0.75);
        }
      } else {
        const slot0Candidate = item.isPlayerSide ? this.enemyPokemon : this.playerPokemon;
        const slot1Candidate = item.isPlayerSide ? this.enemyPartner : this.playerPartner;
        let target =
          item.preferredTargetSlot === 1 && slot1Candidate && slot1Candidate.currentHp > 0
            ? slot1Candidate
            : slot0Candidate && slot0Candidate.currentHp > 0
            ? slot0Candidate
            : opponents[0];

        this.executeMove(item.attacker, target, item.move, events, 1.0);
      }

      const outcome = recordAnyNewFaints();
      if (outcome) return outcome;
    }

    this.applyEndOfTurnResiduals(events);
    const residualOutcome = recordAnyNewFaints();
    if (residualOutcome) return residualOutcome;

    return {
      turnNumber: this.turnCount,
      events,
      isBattleOver: false,
    };
  }

  private checkFaints(events: BattleEvent[]): BattleTurnResult | null {
    const enemyAlive =
      this.enemyPokemon.currentHp > 0 ||
      Boolean(this.isDoubleBattle && this.enemyPartner && this.enemyPartner.currentHp > 0);
    if (!enemyAlive) {
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
    const playerAlive =
      this.playerPokemon.currentHp > 0 ||
      Boolean(this.isDoubleBattle && this.playerPartner && this.playerPartner.currentHp > 0);
    if (!playerAlive) {
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
    const combatants = [
      this.playerPokemon,
      this.playerPartner,
      this.enemyPokemon,
      this.enemyPartner,
    ].filter((p): p is PokemonInstance => Boolean(p));

    const weather = this.stadiumRules?.weather ?? 'NONE';

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
        if (pkmn.currentHp <= 0 && !this.isDoubleBattle) {
          break;
        }
      }

      if (pkmn.currentHp > 0 && weather === 'SANDSTORM') {
        const isSandImmune = pkmn.types.some(
          (t) => t === 'Rock' || t === 'Ground' || t === 'Steel'
        );
        if (!isSandImmune) {
          const sandDmg = Math.max(1, Math.floor(pkmn.stats.hp / 16));
          pkmn.currentHp = Math.max(0, pkmn.currentHp - sandDmg);
          events.push({
            type: 'MESSAGE',
            text: `🌪️ ${pkmn.nickname} is buffeted by the raging sandstorm!`,
          });
          events.push({
            type: 'RESIDUAL_DAMAGE',
            targetId: pkmn.uid,
            damage: sandDmg,
            remainingHp: pkmn.currentHp,
            status: 'SANDSTORM',
          });
        }
      }
    }
  }

  public getWeatherDamageMultiplier(moveType: PokemonType): number {
    const weather = this.stadiumRules?.weather ?? 'NONE';
    if (weather === 'SUN') {
      if (moveType === 'Fire') return 1.5;
      if (moveType === 'Water') return 0.5;
    } else if (weather === 'RAIN') {
      if (moveType === 'Water') return 1.5;
      if (moveType === 'Fire') return 0.5;
    }
    return 1.0;
  }

  private executeMove(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    events: BattleEvent[],
    spreadMultiplier: number = 1.0
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

    if (move.id !== 'furycutter') {
      this.furyCutterStreaks.set(attacker.uid, 0);
    }

    // 4. Accuracy & Evasion Check (Self-targeting status moves and Swift never miss)
    if (move.statChanges?.target !== 'self' && move.id !== 'swift') {
      const accStage = attacker.statStages?.acc ?? 0;
      const evaStage = defender.statStages?.eva ?? 0;
      const accMult = DamageCalculator.getAccEvaStageMultiplier(accStage);
      const evaMult = DamageCalculator.getAccEvaStageMultiplier(evaStage);
      const hitChance = (move.accuracy / 100) * (accMult / evaMult);

      if (Math.random() > hitChance) {
        this.furyCutterStreaks.set(attacker.uid, 0);
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

    // 8. Calculate & Apply Direct Damage (including TM49 Fury Cutter consecutive streak doubling, Weather & Spread modifiers)
    let effectiveMove = move;
    if (move.id === 'furycutter') {
      const streak = this.furyCutterStreaks.get(attacker.uid) ?? 0;
      const scaledPower = Math.min(160, move.power * Math.pow(2, streak));
      effectiveMove = { ...move, power: scaledPower };
      this.furyCutterStreaks.set(attacker.uid, Math.min(4, streak + 1));
    }

    const weatherMult = this.getWeatherDamageMultiplier(effectiveMove.type);
    const totalPowerMult = weatherMult * spreadMultiplier;
    if (totalPowerMult !== 1.0 && effectiveMove.power > 0) {
      effectiveMove = {
        ...effectiveMove,
        power: Math.max(1, Math.round(effectiveMove.power * totalPowerMult)),
      };
    }

    const result = DamageCalculator.calculate(attacker, defender, effectiveMove);

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

    // 9. Secondary Stat Stage Effect on Damaging Moves (e.g. TM31 Mud-Slap accuracy drop)
    if (
      move.statChanges &&
      move.category !== 'Status' &&
      defender.currentHp > 0 &&
      result.effectiveness > 0
    ) {
      const targetPkmn = move.statChanges.target === 'self' ? attacker : defender;
      if (!targetPkmn.statStages) {
        targetPkmn.statStages = PokemonFactory.createDefaultStatStages();
      }
      const stat = move.statChanges.stat;
      const delta = move.statChanges.stages;
      const currentStage = targetPkmn.statStages[stat];
      const nextStage = Math.max(-6, Math.min(6, currentStage + delta));
      const statLabel = STAT_LABELS[stat];

      if (nextStage !== currentStage) {
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
    }

    // 10. Secondary Status Effect Check (e.g. Ember 10% Burn, Spark 30% Paralysis)
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

  private applyBattleItemEffect(
    itemId: string,
    target: PokemonInstance,
    events: BattleEvent[]
  ): void {
    const normalized = itemId.toLowerCase().replace(/_/g, '-');
    const displayItem = normalized.replace(/-/g, ' ').toUpperCase();
    events.push({
      type: 'MESSAGE',
      text: `You used ${displayItem} on ${target.nickname}!`,
    });

    const healMap: Record<string, number> = {
      potion: 20,
      'super-potion': 50,
      'hyper-potion': 200,
      'max-potion': 9999,
      'full-restore': 9999,
      'fresh-water': 50,
      'soda-pop': 60,
      lemonade: 80,
      'moomoo-milk': 100,
      berry: 10,
      'oran-berry': 10,
      'gold-berry': 30,
      'sitrus-berry': 30,
    };

    if (normalized in healMap) {
      const before = target.currentHp;
      target.currentHp = Math.min(target.stats.hp, target.currentHp + healMap[normalized]);
      const healed = target.currentHp - before;
      if (normalized === 'full-restore' && target.status !== 'NONE') {
        target.status = 'NONE';
        target.sleepTurns = 0;
        events.push({ type: 'STATUS', targetId: target.uid, status: 'NONE' });
      }
      events.push({
        type: 'HEAL',
        targetId: target.uid,
        healedAmount: healed,
        remainingHp: target.currentHp,
      });
      events.push({
        type: 'MESSAGE',
        text: `${target.nickname}'s HP was restored by ${healed} point(s)!`,
      });
      return;
    }

    if (normalized === 'revive' || normalized === 'max-revive') {
      target.currentHp =
        normalized === 'max-revive'
          ? target.stats.hp
          : Math.max(1, Math.floor(target.stats.hp / 2));
      target.status = 'NONE';
      target.sleepTurns = 0;
      events.push({
        type: 'HEAL',
        targetId: target.uid,
        healedAmount: target.currentHp,
        remainingHp: target.currentHp,
      });
      events.push({
        type: 'MESSAGE',
        text: `${target.nickname} recovered from fainting!`,
      });
      return;
    }

    if (
      normalized === 'antidote' ||
      normalized === 'parlyz-heal' ||
      normalized === 'awakening' ||
      normalized === 'burn-heal' ||
      normalized === 'ice-heal' ||
      normalized === 'full-heal' ||
      normalized === 'psncureberry' ||
      normalized === 'przcureberry' ||
      normalized === 'mint-berry' ||
      normalized === 'burnt-berry' ||
      normalized === 'ice-berry' ||
      normalized === 'miracleberry'
    ) {
      target.status = 'NONE';
      target.sleepTurns = 0;
      events.push({ type: 'STATUS', targetId: target.uid, status: 'NONE' });
      events.push({
        type: 'MESSAGE',
        text: `${target.nickname} was cured of its status condition!`,
      });
      return;
    }

    const xStatMap: Record<string, StatId> = {
      'x-attack': 'atk',
      'x-defend': 'def',
      'x-speed': 'spe',
      'x-special': 'spa',
      'x-accuracy': 'acc',
    };
    if (normalized in xStatMap) {
      const stat = xStatMap[normalized];
      if (!target.statStages) {
        target.statStages = PokemonFactory.createDefaultStatStages();
      }
      target.statStages[stat] = Math.min(6, (target.statStages[stat] ?? 0) + 1);
      events.push({
        type: 'STAT_CHANGE',
        targetId: target.uid,
        stat,
        stages: 1,
      });
      events.push({
        type: 'MESSAGE',
        text: `${target.nickname}'s ${STAT_LABELS[stat]} rose!`,
      });
    }
  }
}
