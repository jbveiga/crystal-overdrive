/**
 * @fileoverview BattleMoveAndItemExecutor domain module implementation.
 * @module battle/state/BattleMoveAndItemExecutor
 * @role BattleMoveAndItemExecutor Component
 * @exports SPREAD_MOVE_IDS, STAT_LABELS, getWeatherDamageMultiplier
 * @layer battle
 * @sections L1-15: Micro-Header & Imports | L16-261: Implementation | L262-522: Handlers & Exports
 */

import type { MoveData, PokemonInstance, PokemonType, StatId } from '../../types/game';
import type { BattleEvent, StadiumWeather } from '../BattleStateMachine';
import { DamageCalculator } from '../DamageCalculator';
import { EffectivenessHelper } from '../EffectivenessHelper';
import { PokemonFactory } from '../PokemonFactory';

export const SPREAD_MOVE_IDS: Set<string> = new Set([
  'surf',
  'earthquake',
  'razorleaf',
  'icywind',
  'rockslide',
  'mudslap',
  'swift',
]);

export const STAT_LABELS: Record<StatId, string> = {
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
  acc: 'Accuracy',
  eva: 'Evasion',
};

/**
 * Calculates the weather damage multiplier (Sun boosts Fire / reduces Water; Rain boosts Water / reduces Fire).
 */
export function getWeatherDamageMultiplier(
  moveType: PokemonType,
  weather: StadiumWeather = 'NONE'
): number {
  if (weather === 'SUN') {
    if (moveType === 'Fire') return 1.5;
    if (moveType === 'Water') return 0.5;
  } else if (weather === 'RAIN') {
    if (moveType === 'Water') return 1.5;
    if (moveType === 'Fire') return 0.5;
  }
  return 1.0;
}

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

export interface ExecuteMoveParams {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  move: MoveData;
  events: BattleEvent[];
  spreadMultiplier?: number;
  furyCutterStreaks: Map<string, number>;
  weather?: StadiumWeather;
}

/**
 * Executes a combat move (sleep/paralysis check, attack declaration, accuracy, stat changes, status, damage, secondary effects).
 */
export function executeMove({
  attacker,
  defender,
  move,
  events,
  spreadMultiplier = 1.0,
  furyCutterStreaks,
  weather = 'NONE',
}: ExecuteMoveParams): void {
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
    furyCutterStreaks.set(attacker.uid, 0);
  }

  // 4. Accuracy & Evasion Check (Self-targeting status moves and Swift never miss)
  const isSelfStatus = move.category === 'Status' && (move.statChanges?.target === 'self' || move.healFraction !== undefined || move.isRest);
  if (!isSelfStatus && move.id !== 'swift') {
    const accStage = attacker.statStages?.acc ?? 0;
    const evaStage = defender.statStages?.eva ?? 0;
    const accMult = DamageCalculator.getAccEvaStageMultiplier(accStage);
    const evaMult = DamageCalculator.getAccEvaStageMultiplier(evaStage);
    const hitChance = (move.accuracy / 100) * (accMult / evaMult);

    if (Math.random() > hitChance) {
      furyCutterStreaks.set(attacker.uid, 0);
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

  // 6b. Self-Healing & Rest Moves (Synthesis, Morning Sun, Moonlight, Recover, Soft-Boiled, Milk Drink, Rest)
  if (move.healFraction !== undefined || move.isRest) {
    if (move.isRest) {
      if (attacker.currentHp >= attacker.stats.hp) {
        events.push({ type: 'MESSAGE', text: 'But it failed!' });
        return;
      }
      attacker.currentHp = attacker.stats.hp;
      attacker.status = 'SLP';
      attacker.sleepTurns = 2;
      events.push({ type: 'STATUS', targetId: attacker.uid, status: 'SLP' });
      events.push({
        type: 'HEAL',
        targetId: attacker.uid,
        healedAmount: attacker.stats.hp,
        remainingHp: attacker.currentHp,
      });
      events.push({ type: 'MESSAGE', text: `${attacker.nickname} went to sleep and became healthy!` });
      return;
    }

    if (attacker.currentHp >= attacker.stats.hp) {
      events.push({ type: 'MESSAGE', text: `${attacker.nickname}'s HP is full!` });
      return;
    }

    let healMult = move.healFraction ?? 0.5;
    if (move.isWeatherHeal) {
      if (weather === 'SUN') healMult = 2 / 3;
      else if (weather === 'RAIN' || weather === 'SANDSTORM') healMult = 1 / 4;
      else healMult = 1 / 2;
    }

    const healAmount = Math.max(1, Math.floor(attacker.stats.hp * healMult));
    const prevHp = attacker.currentHp;
    attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healAmount);
    const actualHealed = attacker.currentHp - prevHp;

    events.push({
      type: 'HEAL',
      targetId: attacker.uid,
      healedAmount: actualHealed,
      remainingHp: attacker.currentHp,
    });
    events.push({
      type: 'MESSAGE',
      text: `${attacker.nickname}'s HP was restored!`,
    });
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

  // 7b. Guard against unhandled pure Status moves falling through to damage calculation
  if (move.category === 'Status' && move.power <= 0) {
    events.push({ type: 'MESSAGE', text: 'But nothing happened!' });
    return;
  }

  // 8. Calculate & Apply Direct Damage (including TM49 Fury Cutter consecutive streak doubling, Weather & Spread modifiers)
  let effectiveMove = move;
  if (move.id === 'furycutter') {
    const streak = furyCutterStreaks.get(attacker.uid) ?? 0;
    const scaledPower = Math.min(160, move.power * Math.pow(2, streak));
    effectiveMove = { ...move, power: scaledPower };
    furyCutterStreaks.set(attacker.uid, Math.min(4, streak + 1));
  }

  const weatherMult = getWeatherDamageMultiplier(effectiveMove.type, weather);
  const totalPowerMult = weatherMult * spreadMultiplier;
  if (totalPowerMult !== 1.0 && effectiveMove.power > 0) {
    effectiveMove = {
      ...effectiveMove,
      power: Math.max(1, Math.round(effectiveMove.power * totalPowerMult)),
    };
  }

  let result = DamageCalculator.calculate(attacker, defender, effectiveMove);

  // Fixed Damage Overrides (Night Shade, Seismic Toss, Dragon Rage, Sonic Boom, Super Fang)
  if (move.fixedDamage !== undefined) {
    let fixVal = 0;
    if (move.fixedDamage === 'level') {
      fixVal = attacker.level || 50;
    } else if (move.fixedDamage === 'half_current_hp') {
      fixVal = Math.max(1, Math.floor(defender.currentHp / 2));
    } else if (typeof move.fixedDamage === 'number') {
      fixVal = move.fixedDamage;
    }
    result = {
      damage: fixVal,
      effectiveness: 1,
      isCritical: false,
    };
  }

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

  // Drain Effect (Absorb, Mega Drain, Giga Drain, Leech Life, Dream Eater)
  if (move.drainFraction && result.damage > 0 && attacker.currentHp < attacker.stats.hp) {
    const drainHeal = Math.max(1, Math.floor(result.damage * move.drainFraction));
    const prevAttackerHp = attacker.currentHp;
    attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + drainHeal);
    const actualDrained = attacker.currentHp - prevAttackerHp;
    events.push({
      type: 'HEAL',
      targetId: attacker.uid,
      healedAmount: actualDrained,
      remainingHp: attacker.currentHp,
    });
    events.push({
      type: 'MESSAGE',
      text: `${attacker.nickname} sucked energy from ${defender.nickname}!`,
    });
  }

  // Recoil Effect (Double-Edge, Take Down, Submission, Struggle)
  if (move.recoilFraction && result.damage > 0 && attacker.currentHp > 0) {
    const recoilDamage = Math.max(1, Math.floor(result.damage * move.recoilFraction));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
    events.push({
      type: 'DAMAGE',
      targetId: attacker.uid,
      damage: recoilDamage,
      remainingHp: attacker.currentHp,
      effectiveness: 1,
      isCritical: false,
    });
    events.push({
      type: 'MESSAGE',
      text: `${attacker.nickname} is hit with recoil!`,
    });
    if (attacker.currentHp === 0) {
      events.push({ type: 'FAINT', targetId: attacker.uid });
      events.push({ type: 'MESSAGE', text: `${attacker.nickname} fainted!` });
    }
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
