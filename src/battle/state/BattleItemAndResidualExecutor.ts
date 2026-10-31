/**
 * @fileoverview BattleItemAndResidualExecutor domain module implementation.
 * @module battle/state/BattleItemAndResidualExecutor
 * @role End-of-turn residual status/weather damage and battle medicine/item effect executor
 * @exports EndOfTurnResidualsParams, applyEndOfTurnResiduals, applyBattleItemEffect
 * @layer battle
 * @sections L1-85: End-of-Turn Residuals | L86-215: Battle Item Effect Executor
 */

import type { PokemonInstance, StatId } from '../../types/game';
import type { BattleEvent, StadiumWeather } from '../BattleStateMachine';
import { PokemonFactory } from '../PokemonFactory';
import { STAT_LABELS } from './BattleMoveAndItemExecutor';

export interface EndOfTurnResidualsParams {
  combatants: PokemonInstance[];
  weather?: StadiumWeather;
  isDoubleBattle: boolean;
  events: BattleEvent[];
}

/**
 * Applies end-of-turn status residual damage (burn, poison, toxic) and environmental sandstorm damage.
 */
export function applyEndOfTurnResiduals({
  combatants,
  weather = 'NONE',
  isDoubleBattle,
  events,
}: EndOfTurnResidualsParams): void {
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
      if (pkmn.currentHp <= 0 && !isDoubleBattle) {
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

/**
 * Applies battle medicine, healing items, revives, status curatives, and X-Stat battle items.
 */
export function applyBattleItemEffect(
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
