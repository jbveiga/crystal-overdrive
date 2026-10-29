/**
 * @fileoverview VermilionGymInteractions domain module implementation.
 * @module world/interactions/VermilionGymInteractions
 * @role Vermilion Gym Lt. Surge Battle, Trash Can Puzzle & Pokemon Fan Club Component
 * @exports getVermilionGymInteractions, handleVermilionGymTrashCan, handleLtSurgeInteraction, handleVermilionGymTrainer, handleVermilionGymGuideAndStatues, handlePokemonFanClubInteractions, handleVermilionCutTree, getPuzzleState, resetPuzzleState, setPuzzleState, initPuzzleState, TRASH_CAN_COORDINATES, TRASH_CAN_NEIGHBORS
 * @layer world
 * @sections L1-40: Micro-Header & Puzzle State | L41-130: Trash Can Puzzle Mechanics | L131-230: Lt. Surge Battle & Gym Trainers | L231-310: Fan Club & Vermilion Cut Tree | L311-370: Registrations
 */

import type { GridEntity } from '../GridPhysics';
import type {
  NpcInteractionContext,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { ModernHMHandler } from '../ModernHMHandler';

export interface VermilionGymPuzzleState {
  firstSwitchIndex: number;
  secondSwitchIndex: number;
  firstSwitchPressed: boolean;
  barrierOpen: boolean;
}

export const TRASH_CAN_COORDINATES: Array<{ x: number; y: number }> = [
  { x: 1, y: 7 },
  { x: 3, y: 7 },
  { x: 5, y: 7 },
  { x: 7, y: 7 },
  { x: 9, y: 7 },
  { x: 1, y: 9 },
  { x: 3, y: 9 },
  { x: 5, y: 9 },
  { x: 7, y: 9 },
  { x: 9, y: 9 },
  { x: 1, y: 11 },
  { x: 3, y: 11 },
  { x: 5, y: 11 },
  { x: 7, y: 11 },
  { x: 9, y: 11 },
];

export const TRASH_CAN_NEIGHBORS: number[][] = [
  [1, 5],
  [0, 2, 6],
  [1, 3, 7],
  [2, 4, 8],
  [3, 9],
  [0, 6, 10],
  [1, 5, 7, 11],
  [2, 6, 8, 12],
  [3, 7, 9, 13],
  [4, 8, 14],
  [5, 11],
  [6, 10, 12],
  [7, 11, 13],
  [8, 12, 14],
  [9, 13],
];

export function initPuzzleState(): VermilionGymPuzzleState {
  const first = Math.floor(Math.random() * 15);
  const neighbors = TRASH_CAN_NEIGHBORS[first];
  const second = neighbors[Math.floor(Math.random() * neighbors.length)];
  return {
    firstSwitchIndex: first,
    secondSwitchIndex: second,
    firstSwitchPressed: false,
    barrierOpen: false,
  };
}

let puzzleState: VermilionGymPuzzleState = initPuzzleState();

export function resetPuzzleState(): VermilionGymPuzzleState {
  puzzleState = initPuzzleState();
  return puzzleState;
}

export function getPuzzleState(): VermilionGymPuzzleState {
  return puzzleState;
}

export function setPuzzleState(state: Partial<VermilionGymPuzzleState>): void {
  puzzleState = { ...puzzleState, ...state };
}

/**
 * Handles trash can switch inspection in Vermilion Gym.
 */
export function handleVermilionGymTrashCan(
  canIndex: number,
  ctx: NpcInteractionContext
): boolean {
  if (
    puzzleState.barrierOpen ||
    ctx.storyFlags.has('vermilion_gym_barrier_open') ||
    ctx.storyFlags.has('surge_defeated')
  ) {
    ctx.openDialogue(['Nope! Nothing here but trash.'], '🗑️ TRASH CAN');
    return true;
  }

  if (!puzzleState.firstSwitchPressed) {
    if (canIndex === puzzleState.firstSwitchIndex) {
      puzzleState.firstSwitchPressed = true;
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.openDialogue(
        [
          "Hey! There's a switch inside the trash can! Pressed it!",
          'The first electric lock was deactivated!',
        ],
        '🗑️ TRASH CAN'
      );
      return true;
    }
    ctx.openDialogue(['Nope! Nothing here but trash.'], '🗑️ TRASH CAN');
    return true;
  }

  // Second switch check
  if (canIndex === puzzleState.secondSwitchIndex) {
    puzzleState.barrierOpen = true;
    ctx.storyFlags.add('vermilion_gym_barrier_open');
    const curMap = ctx.mapManager.getCurrentMap();
    if (curMap && curMap.id === 'vermilion_gym') {
      curMap.collisionGrid[4 * curMap.width + 4] = 0;
      curMap.collisionGrid[4 * curMap.width + 5] = 0;
    }
    BattleAudio.playOverworldSound('KEY_ITEM');
    ctx.openDialogue(
      [
        "Hey! There's another switch inside this trash can! Pressed it!",
        'The second electric lock opened!',
      ],
      '🗑️ TRASH CAN',
      () => {
        ctx.showToast?.('⚡ The electric fences in Vermilion Gym deactivated!');
        ctx.saveCurrentGame?.();
      }
    );
    return true;
  }

  // Failed second switch - reset puzzle
  puzzleState.firstSwitchPressed = false;
  const newFirst = Math.floor(Math.random() * 15);
  const neighbors = TRASH_CAN_NEIGHBORS[newFirst];
  puzzleState.firstSwitchIndex = newFirst;
  puzzleState.secondSwitchIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
  BattleAudio.playOverworldSound('BUMP');
  ctx.openDialogue(
    ['Hey! The electric fences are back on! The switches reset!'],
    '🗑️ TRASH CAN'
  );
  return true;
}

/**
 * Handles Lt. Surge interaction, dialogue, pre-battle monologue, and victory rewards.
 */
export function handleLtSurgeInteraction(
  surgeNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('surge_defeated')) {
    ctx.openDialogue(
      [
        'LT. SURGE: Hey, kid! Still shocking your opponents? An electric soul never dims!',
        'Keep marching forward toward the KANTO LEAGUE!',
      ],
      surgeNpc.speaker || '⚡ LT. SURGE'
    );
    return true;
  }

  const preBattlePages =
    surgeNpc.challengePages && surgeNpc.challengePages.length > 0
      ? surgeNpc.challengePages
      : [
          'Hey, you little tyke! I have to hand it to you. It may not be very smart to challenge me, but it takes guts!',
          "When it comes to electric POKéMON, I'm number one! I've never lost on the battlefield.",
          "I'll zap you just like I did my enemies in war!",
        ];

  ctx.openDialogue(preBattlePages, surgeNpc.speaker || '⚡ LT. SURGE', () => {
    let team = ctx.buildTrainerTeamInstances?.(surgeNpc);
    if (!team || team.length === 0) {
      team = [
        PokemonFactory.create('raichu', 44, ['thunderbolt', 'quickattack', 'thunderwave', 'doubleteam']),
        PokemonFactory.create('electrode', 40, ['screech', 'swift', 'doubleteam', 'thunder']),
        PokemonFactory.create('magneton', 40, ['zapcannon', 'swift', 'lockon', 'supersonic']),
        PokemonFactory.create('electrode', 40, ['screech', 'swift', 'doubleteam', 'thunder']),
        PokemonFactory.create('electabuzz', 46, ['thunderpunch', 'quickattack', 'leer', 'lightscreen']),
      ];
    }

    ctx.triggerBattle(team[0], {
      isTrainer: true,
      isGymLeader: true,
      trainerName: 'LT. SURGE',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add('lt_surge');
        ctx.defeatedTrainers.add(surgeNpc.id);
        ctx.storyFlags.add('surge_defeated');
        ctx.storyFlags.add('thunder_badge');
        ctx.storyFlags.add('vermilion_gym_barrier_open');

        if (ctx.inventory) {
          ctx.inventory.badges = ctx.inventory.badges || [];
          if (!ctx.inventory.badges.includes('thunder')) {
            ctx.inventory.badges.push('thunder');
          }
          ctx.inventory.tms = ctx.inventory.tms || [];
          if (!ctx.inventory.tms.includes('TM34')) {
            ctx.inventory.tms.push('TM34');
          }
        }
        ctx.addOverworldItemToInventory?.('tm34');
        ctx.audioManager.playSfx?.('sfx_badge_get');
        BattleAudio.playOverworldSound('KEY_ITEM');

        ctx.openDialogue(
          [
            "LT. SURGE: Whoa! You're the real deal, kid! You zapped me good!",
            'Take this official POKéMON LEAGUE THUNDERBADGE!',
            `${ctx.playerName} received the THUNDERBADGE from LT. SURGE!`,
            "The THUNDERBADGE boosts your POKéMON's SPEED in battle!",
            'Also, take this TM as proof of your victory!',
            `${ctx.playerName} received TM34 SWAGGER!`,
            'LT. SURGE: TM34 contains SWAGGER! It confuses the target while pumping up its ATTACK power! High risk, high reward!',
          ],
          surgeNpc.speaker || '⚡ LT. SURGE',
          () => {
            const curMap = ctx.mapManager.getCurrentMap();
            if (curMap) {
              ctx.renderMap?.(curMap);
              ctx.syncMapOverworldItems?.(curMap);
            }
            ctx.saveCurrentGame?.();
            ctx.showToast?.('⚡ Defeated Leader Lt. Surge & received the THUNDERBADGE and TM34 SWAGGER!');
          }
        );
      },
    });
  });
  return true;
}

/**
 * Handles Vermilion Gym trainers (Juggler Horton, Gentleman Gregory, Guitarist Vincent).
 */
export function handleVermilionGymTrainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId) || ctx.defeatedTrainers.has(trainerNpc.id)) {
    const rawDefeat = (trainerNpc as any).defeatPages;
    const defeatPages =
      rawDefeat && rawDefeat.length > 0
        ? rawDefeat
        : (trainerNpc.pages && trainerNpc.pages.length > 0 ? trainerNpc.pages : ['Your electric tactics completely overpowered me!']);
    ctx.openDialogue(defeatPages, trainerNpc.speaker);
    return true;
  }

  const challenge =
    trainerNpc.challengePages && trainerNpc.challengePages.length > 0
      ? trainerNpc.challengePages
      : ['Prepare to face my electrifying team!'];

  ctx.openDialogue(challenge, trainerNpc.speaker, () => {
    let team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(trainerNpc) : [];
    if (!team || team.length === 0) {
      const sourceTeam = trainerNpc.trainerTeam || (trainerNpc as any).team;
      if (sourceTeam && sourceTeam.length > 0) {
        team = sourceTeam.map((m: any) =>
          PokemonFactory.create(m.speciesId, m.level, m.moves)
        );
      }
    }
    if (!team || team.length === 0) return;
    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: trainerNpc.trainerName || trainerNpc.speaker || 'TRAINER',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add(trainerId);
        ctx.defeatedTrainers.add(trainerNpc.id);
        const rawDefeat = (trainerNpc as any).defeatPages;
        const postPages =
          rawDefeat && rawDefeat.length > 0
            ? rawDefeat
            : (trainerNpc.pages && trainerNpc.pages.length > 0 ? trainerNpc.pages : ['Incredible! What electrifying skill!']);
        ctx.openDialogue(postPages, trainerNpc.speaker, () => {
          ctx.saveCurrentGame?.();
        });
      },
    });
  });
  return true;
}

/**
 * Handles Vermilion Gym Guide and dynamic Gym Statues.
 */
export function handleVermilionGymGuideAndStatues(
  entity: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (entity.action === 'VERMILION_GYM_GUIDE' || entity.id.includes('guide')) {
    if (ctx.storyFlags.has('surge_defeated')) {
      ctx.openDialogue(
        ['You zapped LT. SURGE! That was an electrifying battle!'],
        entity.speaker || '🏆 GYM GUIDE'
      );
      return true;
    }
    ctx.openDialogue(
      [
        'Yo, CHAMP in making!',
        'LT. SURGE is known as the LIGHTNING AMERICAN! His electric Pokémon pack serious voltage!',
        'Ground-type Pokémon are immune to electric attacks, making them your secret weapon!',
      ],
      entity.speaker || '🏆 GYM GUIDE'
    );
    return true;
  }

  // Gym Statue
  const hasBeaten = ctx.storyFlags.has('surge_defeated') || ctx.storyFlags.has('thunder_badge');
  const winner = hasBeaten ? `WINNING TRAINERS:\nRED\n${ctx.playerName}` : 'WINNING TRAINERS:\nRED';
  ctx.openDialogue(
    ['VERMILION CITY POKéMON GYM', 'LEADER: LT. SURGE', winner],
    entity.speaker || '🏆 GYM STATUE'
  );
  return true;
}

/**
 * Handles Pokémon Fan Club Chairman (Rare Candy) and Clefairy Guy (Lost Item).
 */
export function handlePokemonFanClubInteractions(
  entity: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (entity.action === 'FAN_CLUB_CHAIRMAN' || entity.id === 'fan_club_chairman') {
    if (ctx.storyFlags.has('got_fan_club_rare_candy')) {
      ctx.openDialogue(
        ['CHAIRMAN: Did I tell you about my RAPIDASH today? It is truly majestic!'],
        entity.speaker || '🎩 CHAIRMAN'
      );
      return true;
    }
    ctx.openDialogue(
      [
        "CHAIRMAN: I'm the Chairman of the POKéMON FAN CLUB! Did you know? RAPIDASH is my absolute favorite POKéMON!",
        "It's so cute... so sweet... yet fiery and noble! When it gallops, it's like a shooting star in the night sky!",
        "Hugging it while sleeping is so warm, though you might singe your pajamas if you're not careful!",
        "Ah! For listening so patiently to an old man's rambling, please take this!",
      ],
      entity.speaker || '🎩 CHAIRMAN',
      () => {
        ctx.storyFlags.add('got_fan_club_rare_candy');
        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('rare-candy');
        } else if (ctx.inventory?.items) {
          ctx.inventory.items['rare-candy'] = (ctx.inventory.items['rare-candy'] || 0) + 1;
        }
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            `${ctx.playerName} received RARE CANDY from the FAN CLUB CHAIRMAN!`,
            'CHAIRMAN: That RARE CANDY raises a POKéMON’s level by one! Give it to your most cherished partner!',
          ],
          entity.speaker || '🎩 CHAIRMAN',
          () => {
            ctx.saveCurrentGame?.();
            ctx.showToast?.('🍬 Received RARE CANDY from Fan Club Chairman!');
          }
        );
      }
    );
    return true;
  }

  if (entity.action === 'FAN_CLUB_CLEFAIRY_GUY' || entity.id === 'fan_club_clefairy_guy') {
    if (ctx.storyFlags.has('got_lost_item_clefairy_doll')) {
      ctx.openDialogue(
        ['I hope COPYCAT is overjoyed to have her lost CLEFAIRY doll back!'],
        entity.speaker || '🧸 CLEFAIRY GUY'
      );
      return true;
    }
    if (
      ctx.storyFlags.has('copycat_lost_doll') ||
      ctx.storyFlags.has('EVENT_MET_COPYCAT') ||
      ctx.storyFlags.has('quest_copycat_doll')
    ) {
      ctx.openDialogue(
        [
          'Are you looking for the CLEFAIRY doll that COPYCAT lost?',
          'Someone found it at the beach in Vermilion City and brought it here! You should return it to her!',
        ],
        entity.speaker || '🧸 CLEFAIRY GUY',
        () => {
          ctx.storyFlags.add('got_lost_item_clefairy_doll');
          ctx.storyFlags.add('has_lost_item');
          if (ctx.addOverworldItemToInventory) {
            ctx.addOverworldItemToInventory('lost-item');
          } else if (ctx.inventory?.keyItems && !ctx.inventory.keyItems.includes('lost-item')) {
            ctx.inventory.keyItems.push('lost-item');
          }
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [`${ctx.playerName} received the LOST ITEM from the POKéFAN!`],
            entity.speaker || '🧸 CLEFAIRY GUY',
            () => {
              ctx.saveCurrentGame?.();
              ctx.showToast?.('🧸 Received LOST ITEM (Clefairy Doll)!');
            }
          );
        }
      );
      return true;
    }
    ctx.openDialogue(
      ['I just love CLEFAIRY! Their sweet little wagging fingers and plush faces are simply irresistible!'],
      entity.speaker || '🧸 CLEFAIRY GUY'
    );
    return true;
  }

  if (entity.action === 'FAN_CLUB_SEEL_FAN' || entity.id === 'fan_club_seel_fan') {
    ctx.openDialogue(
      ['My SEEL loves swimming along the Vermilion harbor! Its sleek white coat glistens under the sunlight!'],
      entity.speaker || '👧 SEEL FAN'
    );
    return true;
  }

  ctx.openDialogue(
    entity.pages && entity.pages.length > 0
      ? entity.pages
      : ['Welcome to the POKéMON FAN CLUB!'],
    entity.speaker
  );
  return true;
}

/**
 * Handles Vermilion City Cut tree at (10, 20).
 */
export function handleVermilionCutTree(
  ctx: NpcInteractionContext,
  x: number = 10,
  y: number = 20
): boolean {
  const cutCheck = ModernHMHandler.checkCut(
    ctx.inventory,
    ctx.storyFlags,
    ctx.playerParty
  );

  if (cutCheck.canUse || (cutCheck.hasBadge && cutCheck.hasHM && cutCheck.compatiblePokemon)) {
    const cutter = cutCheck.compatiblePokemon || ctx.playerParty.find((p) => !p.isEgg) || ctx.playerParty[0];
    const cutterName = cutter ? cutter.nickname : ctx.playerName;
    BattleAudio.playOverworldSound('RUSTLE');
    ctx.openDialogue(
      ['This tree looks like it can be CUT down!', `${cutterName} hacked away with CUT!`],
      '🌳 CUTTABLE TREE',
      () => {
        ctx.storyFlags.add('vermilion_cut_tree_cleared');
        if (ctx.npcsByMap && ctx.npcsByMap.vermilion_city) {
          ctx.npcsByMap.vermilion_city = ctx.npcsByMap.vermilion_city.filter(
            (n) => n.id !== 'vermilion_city_cut_tree' && !(n.x === x && n.y === y)
          );
        }
        const curMap = ctx.mapManager.getCurrentMap();
        if (curMap) {
          curMap.collisionGrid[y * curMap.width + x] = 0;
          ctx.renderMap?.(curMap);
          ctx.syncMapOverworldItems?.(curMap);
        }
        ctx.saveCurrentGame?.();
        ctx.showToast?.('🌳 The tree was cut down!');
      }
    );
    return true;
  }

  ctx.openDialogue(
    [
      'This tree looks like it can be CUT down!',
      cutCheck.missingReason || 'You need HM01 CUT and the HIVE BADGE to clear this tree.',
    ],
    '🌳 CUTTABLE TREE'
  );
  return true;
}

/**
 * VermilionGymInteractions registrations for default interaction router.
 */
export function getVermilionGymInteractions(): NpcInteractionRegistration[] {
  const registrations: NpcInteractionRegistration[] = [
    {
      actions: ['SURGE_EVENT', 'VERMILION_GYM_SURGE', 'LT_SURGE_EVENT'],
      npcIds: ['vermilion_gym_surge', 'lt_surge', 'surge'],
      handler: (targetNpc, _map, ctx) => handleLtSurgeInteraction(targetNpc, ctx),
    },
    {
      actions: ['VERMILION_GYM_TRAINER'],
      npcIds: [
        'vermilion_gym_juggler_horton',
        'vermilion_gym_gentleman_gregory',
        'vermilion_gym_guitarist_vincent',
      ],
      handler: (targetNpc, _map, ctx) => handleVermilionGymTrainer(targetNpc, ctx),
    },
    {
      actions: ['VERMILION_GYM_GUIDE'],
      npcIds: ['vermilion_gym_guide'],
      handler: (targetNpc, _map, ctx) => handleVermilionGymGuideAndStatues(targetNpc, ctx),
    },
    {
      actions: ['VERMILION_GYM_STATUE'],
      npcIds: ['vermilion_gym_statue_left', 'vermilion_gym_statue_right'],
      handler: (targetNpc, _map, ctx) => handleVermilionGymGuideAndStatues(targetNpc, ctx),
    },
    {
      actions: [
        'FAN_CLUB_CHAIRMAN',
        'FAN_CLUB_CLEFAIRY_GUY',
        'FAN_CLUB_SEEL_FAN',
      ],
      npcIds: [
        'fan_club_chairman',
        'fan_club_clefairy_guy',
        'fan_club_seel_fan',
        'fan_club_rapidash',
      ],
      handler: (targetNpc, _map, ctx) => handlePokemonFanClubInteractions(targetNpc, ctx),
    },
    {
      actions: ['VERMILION_CUT_TREE'],
      npcIds: ['vermilion_city_cut_tree'],
      handler: (_targetNpc, _map, ctx) => handleVermilionCutTree(ctx, 10, 20),
    },
  ];

  for (let i = 0; i < 15; i++) {
    registrations.push({
      actions: [`VERMILION_GYM_TRASH_CAN_${i}`],
      handler: (_targetNpc, _map, ctx) => handleVermilionGymTrashCan(i, ctx),
    });
  }

  return registrations;
}
