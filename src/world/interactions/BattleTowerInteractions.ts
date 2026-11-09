/**
 * @fileoverview BattleTowerInteractions domain module implementation.
 * @module world/interactions/BattleTowerInteractions
 * @role Battle Tower Receptionist: 7-trainer streak gauntlet with a 5-vitamin bundle reward (Crystal international rules)
 * @exports BATTLE_TOWER_STREAK, BATTLE_TOWER_VITAMINS, BATTLE_TOWER_POOL, battleTowerLevel, buildBattleTowerOpponent, awardBattleTowerPrize, handleBattleTowerReceptionist, createBattleTowerInteractions
 * @layer world
 * @sections L1-20: Header | L21-70: Rules & opponent generator | L71-140: Handler | L141-160: Registration
 */

import type { NpcInteractionHandler, NpcInteractionRegistration } from '../../types/gameContext';
import type { PokemonInstance } from '../../types/game';
import { PokemonFactory } from '../../battle/PokemonFactory';

/** Trainers to beat in a row to earn the prize. */
export const BATTLE_TOWER_STREAK = 7;
/** Crystal (international) prize pool: a bundle of 5 of one random vitamin. */
export const BATTLE_TOWER_VITAMINS = ['hp-up', 'protein', 'iron', 'carbos', 'calcium'] as const;
export const BATTLE_TOWER_PRIZE_QTY = 5;
export const BATTLE_TOWER_MIN_PARTY = 3;

interface TowerTrainerTemplate { title: string; name: string; team: [string, string[]][] }

/** Opponent templates; levels are set at runtime to match the challenger's party. */
export const BATTLE_TOWER_POOL: TowerTrainerTemplate[] = [
  { title: 'YOUNGSTER', name: 'Dan', team: [['raticate', ['bite', 'hyperfang', 'quickattack', 'swordsdance']], ['pidgeotto', ['wingattack', 'quickattack', 'gust', 'sandattack']], ['nidorino', ['hornattack', 'poisonsting', 'doublekick', 'focusenergy']]] },
  { title: 'LASS', name: 'Mia', team: [['clefairy', ['doubleslap', 'sing', 'metronome', 'minimize']], ['jigglypuff', ['sing', 'pound', 'rest', 'doubleedge']], ['snubbull', ['bite', 'charm', 'leer', 'scaryface']]] },
  { title: 'BLACKBELT', name: 'Ken', team: [['machoke', ['karatechop', 'seismictoss', 'leer', 'lowkick']], ['hitmonlee', ['highjumpkick', 'doublekick', 'meditate', 'rollingkick']], ['primeape', ['furyswipes', 'crosschop', 'rage', 'thrash']]] },
  { title: 'PSYCHIC', name: 'Ira', team: [['kadabra', ['psychic', 'recover', 'reflect', 'disable']], ['hypno', ['hypnosis', 'psychic', 'headbutt', 'meanlook']], ['starmie', ['surf', 'psychic', 'recover', 'swift']]] },
  { title: 'BIRD KEEPER', name: 'Abe', team: [['fearow', ['drillpeck', 'agility', 'mirrormove', 'furyattack']], ['dodrio', ['triattack', 'drillpeck', 'agility', 'rage']], ['noctowl', ['hypnosis', 'reflect', 'peck', 'takedown']]] },
  { title: 'POKéMANIAC', name: 'Rex', team: [['rhydon', ['earthquake', 'rockslide', 'megahorn', 'tailwhip']], ['kangaskhan', ['megapunch', 'bite', 'earthquake', 'rest']], ['tauros', ['takedown', 'hyperbeam', 'earthquake', 'rest']]] },
  { title: 'SAILOR', name: 'Gus', team: [['poliwrath', ['hydropump', 'submission', 'icebeam', 'mindreader']], ['tentacruel', ['surf', 'sludgebomb', 'screech', 'barrier']], ['kingler', ['crabhammer', 'stomp', 'guillotine', 'harden']]] },
  { title: 'BEAUTY', name: 'Zoe', team: [['vileplume', ['petaldance', 'sleeppowder', 'acid', 'moonlight']], ['ninetales', ['flamethrower', 'confuseray', 'quickattack', 'safeguard']], ['seaking', ['waterfall', 'horndrill', 'supersonic', 'furyattack']]] },
  { title: 'GENTLEMAN', name: 'Alf', team: [['persian', ['slash', 'fakeout', 'screech', 'bite']], ['growlithe', ['flamethrower', 'bite', 'roar', 'takedown']], ['dewgong', ['icebeam', 'surf', 'rest', 'aurorabeam']]] },
  { title: 'COOLTRAINER', name: 'Nia', team: [['dragonair', ['dragonrage', 'slam', 'thunderwave', 'hyperbeam']], ['lapras', ['surf', 'icebeam', 'confuseray', 'sing']], ['arcanine', ['flamethrower', 'extremespeed', 'bite', 'roar']]] },
];

/** Opponent level follows the challenger's three strongest Pokémon (clamped 10-100). */
export function battleTowerLevel(party: Pick<PokemonInstance, 'level'>[]): number {
  const top = party.map((p) => p.level).sort((a, b) => b - a).slice(0, BATTLE_TOWER_MIN_PARTY);
  if (top.length === 0) return 10;
  const avg = Math.round(top.reduce((a, b) => a + b, 0) / top.length);
  return Math.max(10, Math.min(100, avg));
}

export function buildBattleTowerOpponent(template: TowerTrainerTemplate, level: number): PokemonInstance[] {
  return template.team.map(([species, moves]) => PokemonFactory.create(species, level, moves));
}

export function awardBattleTowerPrize(
  items: Record<string, number>,
  rng: () => number = Math.random
): { itemId: string; qty: number } {
  const itemId = BATTLE_TOWER_VITAMINS[Math.floor(rng() * BATTLE_TOWER_VITAMINS.length) % BATTLE_TOWER_VITAMINS.length];
  items[itemId] = (items[itemId] || 0) + BATTLE_TOWER_PRIZE_QTY;
  return { itemId, qty: BATTLE_TOWER_PRIZE_QTY };
}

export const handleBattleTowerReceptionist: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const alive = ctx.playerParty.filter((p) => p.currentHp > 0);
  if (ctx.playerParty.length < BATTLE_TOWER_MIN_PARTY || alive.length < BATTLE_TOWER_MIN_PARTY) {
    ctx.openDialogue(
      [
        'Welcome to the BATTLE TOWER! Challengers face 7 trainers in a row.',
        `You need at least ${BATTLE_TOWER_MIN_PARTY} healthy POKéMON to enter. Come back when you're ready!`,
      ],
      targetNpc.speaker
    );
    return true;
  }

  const level = battleTowerLevel(ctx.playerParty);
  ctx.openDialogue(
    [
      'Welcome to the BATTLE TOWER!',
      `Defeat ${BATTLE_TOWER_STREAK} trainers in a row to win a bundle of vitamins. Opponents will be around Lv${level}.`,
      'If you lose, your streak ends. Good luck!',
    ],
    targetNpc.speaker,
    () => {
      // Shuffle pool without mutating it, then take the first BATTLE_TOWER_STREAK opponents
      const order = [...BATTLE_TOWER_POOL].sort(() => Math.random() - 0.5).slice(0, BATTLE_TOWER_STREAK);

      const fight = (round: number): void => {
        if (round >= BATTLE_TOWER_STREAK) {
          const prize = awardBattleTowerPrize(ctx.inventory.items);
          ctx.storyFlags.add('battle_tower_streak_won');
          ctx.openDialogue(
            [`Congratulations! You beat all ${BATTLE_TOWER_STREAK} trainers!`, `You received ${prize.qty} ${prize.itemId.toUpperCase()}!`],
            targetNpc.speaker,
            () => {
              ctx.showToast(`🏆 Battle Tower prize: ${prize.qty}x ${prize.itemId.toUpperCase()}`);
              ctx.saveCurrentGame();
            }
          );
          return;
        }
        const t = order[round];
        const team = buildBattleTowerOpponent(t, battleTowerLevel(ctx.playerParty));
        ctx.triggerBattle(team[0], {
          isTrainer: true,
          trainerName: `${t.title} ${t.name}`,
          trainerTeam: team,
          onVictory: () => {
            ctx.openDialogue(
              [round + 1 < BATTLE_TOWER_STREAK ? `Win ${round + 1}/${BATTLE_TOWER_STREAK}! Next challenger!` : `Win ${BATTLE_TOWER_STREAK}/${BATTLE_TOWER_STREAK}!`],
              '🏢 BATTLE TOWER',
              () => fight(round + 1)
            );
          },
        });
      };
      fight(0);
    }
  );
  return true;
};

export function createBattleTowerInteractions(): NpcInteractionRegistration[] {
  return [{ actions: ['BATTLE_TOWER_RECEPTIONIST'], npcIds: ['battle_tower_receptionist'], handler: handleBattleTowerReceptionist }];
}
