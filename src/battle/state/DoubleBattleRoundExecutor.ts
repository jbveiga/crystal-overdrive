/**
 * @fileoverview DoubleBattleRoundExecutor domain module implementation.
 * @module battle/state/DoubleBattleRoundExecutor
 * @role Simultaneous 2v2 Double Battle turn queue and spread move resolution
 * @exports executeDoubleRoundForBattleState
 * @layer battle
 * @sections L1-195: 2v2 Double Battle Round Resolution
 */

import type { MoveData, PokemonInstance } from '../../types/game';
import type { BattleAction, BattleEvent, BattleStateMachine, BattleTurnResult } from '../BattleStateMachine';
import { PokemonFactory } from '../PokemonFactory';
import { SPREAD_MOVE_IDS } from './BattleMoveAndItemExecutor';

export function executeDoubleRoundForBattleState(
  bsm: BattleStateMachine,
  playerAction: BattleAction,
  events: BattleEvent[],
  executeMoveFn: (
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    events: BattleEvent[],
    spreadMultiplier?: number
  ) => void,
  applyResidualsFn: (events: BattleEvent[]) => void
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
  if (bsm.playerPokemon.currentHp > 0) {
    const mId = playerAction.moveId || bsm.playerPokemon.moves[0]?.moveId || 'tackle';
    queue.push({
      attacker: bsm.playerPokemon,
      isPlayerSide: true,
      move: PokemonFactory.getMoveData(mId),
      preferredTargetSlot: playerAction.targetSlot ?? 0,
    });
  }

  // 2. Player Partner Slot 2
  if (bsm.playerPartner && bsm.playerPartner.currentHp > 0) {
    const pMoveId =
      playerAction.partnerMoveId || bsm.playerPartner.moves[0]?.moveId || 'tackle';
    queue.push({
      attacker: bsm.playerPartner,
      isPlayerSide: true,
      move: PokemonFactory.getMoveData(pMoveId),
      preferredTargetSlot: playerAction.partnerTargetSlot ?? 1,
    });
  }

  // 3. Enemy Slot 1
  if (bsm.enemyPokemon.currentHp > 0 && bsm.enemyPokemon.moves.length > 0) {
    const eMoveId =
      bsm.enemyPokemon.moves[Math.floor(Math.random() * bsm.enemyPokemon.moves.length)].moveId;
    queue.push({
      attacker: bsm.enemyPokemon,
      isPlayerSide: false,
      move: PokemonFactory.getMoveData(eMoveId),
      preferredTargetSlot: 0,
    });
  }

  // 4. Enemy Partner Slot 2
  if (bsm.enemyPartner && bsm.enemyPartner.currentHp > 0 && bsm.enemyPartner.moves.length > 0) {
    const epMoveId =
      bsm.enemyPartner.moves[Math.floor(Math.random() * bsm.enemyPartner.moves.length)].moveId;
    queue.push({
      attacker: bsm.enemyPartner,
      isPlayerSide: false,
      move: PokemonFactory.getMoveData(epMoveId),
      preferredTargetSlot: bsm.playerPartner && bsm.playerPartner.currentHp > 0 ? 1 : 0,
    });
  }

  // Sort by Move Priority (desc), then Effective Speed (desc)
  queue.sort((a, b) => {
    const pA = a.move.priority ?? 0;
    const pB = b.move.priority ?? 0;
    if (pA !== pB) return pB - pA;
    const sA = bsm.getEffectiveSpeed(a.attacker);
    const sB = bsm.getEffectiveSpeed(b.attacker);
    return sB - sA;
  });

  const recordAnyNewFaints = (): BattleTurnResult | null => {
    const allCombatants = [
      bsm.playerPokemon,
      bsm.playerPartner,
      bsm.enemyPokemon,
      bsm.enemyPartner,
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
      bsm.enemyPokemon.currentHp > 0 ||
      Boolean(bsm.enemyPartner && bsm.enemyPartner.currentHp > 0);
    if (!enemyAlive) {
      bsm.isBattleOver = true;
      return {
        turnNumber: bsm.turnCount,
        events,
        isBattleOver: true,
        winner: 'PLAYER',
      };
    }

    const playerAlive =
      bsm.playerPokemon.currentHp > 0 ||
      Boolean(bsm.playerPartner && bsm.playerPartner.currentHp > 0);
    if (!playerAlive) {
      bsm.isBattleOver = true;
      return {
        turnNumber: bsm.turnCount,
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
      ? [bsm.enemyPokemon, bsm.enemyPartner].filter(
          (p): p is PokemonInstance => Boolean(p && p.currentHp > 0)
        )
      : [bsm.playerPokemon, bsm.playerPartner].filter(
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
        executeMoveFn(item.attacker, opp, item.move, events, 0.75);
      }
    } else {
      const slot0Candidate = item.isPlayerSide ? bsm.enemyPokemon : bsm.playerPokemon;
      const slot1Candidate = item.isPlayerSide ? bsm.enemyPartner : bsm.playerPartner;
      const target =
        item.preferredTargetSlot === 1 && slot1Candidate && slot1Candidate.currentHp > 0
          ? slot1Candidate
          : slot0Candidate && slot0Candidate.currentHp > 0
          ? slot0Candidate
          : opponents[0];

      executeMoveFn(item.attacker, target, item.move, events, 1.0);
    }

    const outcome = recordAnyNewFaints();
    if (outcome) return outcome;
  }

  applyResidualsFn(events);
  const residualOutcome = recordAnyNewFaints();
  if (residualOutcome) return residualOutcome;

  return {
    turnNumber: bsm.turnCount,
    events,
    isBattleOver: false,
  };
}
