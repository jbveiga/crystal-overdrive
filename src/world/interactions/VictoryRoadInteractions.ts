/**
 * @fileoverview Victory Road Cavern domain interactions: Rival Silver Ambush & Strength Boulders.
 * @module world/interactions/VictoryRoadInteractions
 * @role Victory Road Domain Interaction Handler
 * @exports VictoryRoadInteractions, handleVictoryRoadRival, handleVictoryRoadBoulder, handleVictoryRoadStep, getVictoryRoadInteractions, getVictoryRoadRivalTeam
 * @sections
 * 1. Types & Dialogue Constants
 * 2. Rival Team Dynamic Starter Resolver
 * 3. Rival Silver Confrontation & Battle Handler
 * 4. Strength Boulder Pusher Handler
 * 5. Victory Road Delegated Step Interceptor
 * 6. Interaction Registration Factory
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */

import type { MapData } from '../../types/game';
import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionHandler, NpcInteractionRegistration } from '../../types/gameContext';
import type { NpcInteractionContext } from '../../types/worldContext';
import type { PokemonInstance } from '../../types/pokemon';
import { ModernHMHandler } from '../ModernHMHandler';
import { BattleAudio } from '../../audio/BattleAudio';

// ============================================================================
// 1. Types & Dialogue Constants
// ============================================================================

export const VICTORY_ROAD_RIVAL_CHALLENGE: string[] = [
  'RIVAL: Hold it.',
  '…Are you going to take the POKéMON LEAGUE challenge?',
  "…Don't make me laugh. You're so much weaker than I am.",
  "I'm not like I was before. I now have the best and strongest POKéMON with me.",
  "I'm invincible! I'll crush you before you even see the LEAGUE doors!",
  'I challenge you!',
];

export const VICTORY_ROAD_RIVAL_DEFEAT: string[] = [
  "RIVAL: …I couldn't win…",
  'I gave it everything I had…',
  'What you possess, and what I lack…',
  "I'm beginning to understand what that dragon master said to me…",
  "…I haven't given up on becoming the greatest trainer…",
  "I'm going to find out why I can't win and become stronger…",
  'When I do, I will challenge you. And I will beat you down with all my power.',
  '…Humph! You keep at it until then.',
];

export const VICTORY_ROAD_RIVAL_POST_DEFEAT: string[] = [
  'RIVAL: …Go on to the LEAGUE. Next time we battle, I will prove that I have changed!',
];

// ============================================================================
// 2. Rival Team Dynamic Starter Resolver
// ============================================================================

export interface RivalPokemonSpec {
  speciesId: string;
  level: number;
  moves: string[];
}

export function getVictoryRoadRivalTeam(
  playerParty: PokemonInstance[] = [],
  storyFlags: ReadonlySet<string> = new Set()
): RivalPokemonSpec[] {
  let starterSpeciesId = 'feraligatr';
  let starterMoves = ['surf', 'bite', 'slash', 'scaryface'];

  if (
    storyFlags.has('starter_cyndaquil') ||
    playerParty.some((p) => p.speciesId === 'cyndaquil' || p.speciesId === 'quilava' || p.speciesId === 'typhlosion')
  ) {
    starterSpeciesId = 'feraligatr';
    starterMoves = ['surf', 'bite', 'slash', 'scaryface'];
  } else if (
    storyFlags.has('starter_totodile') ||
    playerParty.some((p) => p.speciesId === 'totodile' || p.speciesId === 'croconaw' || p.speciesId === 'feraligatr')
  ) {
    starterSpeciesId = 'meganium';
    starterMoves = ['solarbeam', 'razorleaf', 'bodyslam', 'reflect'];
  } else if (
    storyFlags.has('starter_chikorita') ||
    playerParty.some((p) => p.speciesId === 'chikorita' || p.speciesId === 'bayleef' || p.speciesId === 'meganium')
  ) {
    starterSpeciesId = 'typhlosion';
    starterMoves = ['flamethrower', 'quickattack', 'smokescreen', 'swift'];
  }

  return [
    { speciesId: 'sneasel', level: 36, moves: ['slash', 'feint-attack', 'quickattack'] },
    { speciesId: 'golbat', level: 36, moves: ['wing-attack', 'bite', 'confuseray'] },
    { speciesId: 'magneton', level: 35, moves: ['thundershock', 'sonicboom', 'supersonic'] },
    { speciesId: 'kadabra', level: 35, moves: ['psybeam', 'recover', 'disable'] },
    { speciesId: 'haunter', level: 35, moves: ['shadowball', 'curse', 'night-shade'] },
    { speciesId: starterSpeciesId, level: 38, moves: starterMoves },
  ];
}

// ============================================================================
// 3. Rival Silver Confrontation & Battle Handler
// ============================================================================

export const handleVictoryRoadRival: NpcInteractionHandler = (
  targetNpc: GridEntity,
  currentMap: MapData,
  ctx: NpcInteractionContext
) => {
  const speaker = targetNpc?.speaker || '🔴 RIVAL SILVER';
  const openDialogue = ctx.openDialogue || (ctx as any).overworldHUD?.openDialogue?.bind((ctx as any).overworldHUD);
  const showToast = ctx.showToast || (ctx as any).overworldHUD?.showToast?.bind((ctx as any).overworldHUD);

  if (ctx.storyFlags.has('victory_road_rival_defeated')) {
    openDialogue?.(VICTORY_ROAD_RIVAL_POST_DEFEAT, speaker);
    return true;
  }

  const teamSpecs = getVictoryRoadRivalTeam(ctx.playerParty, ctx.storyFlags);
  targetNpc.trainerTeam = teamSpecs;
  targetNpc.trainerPokemon = teamSpecs[0];

  openDialogue?.(VICTORY_ROAD_RIVAL_CHALLENGE, speaker, () => {
    const team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(targetNpc) : [];
    if (team.length === 0) return;

    ctx.audioManager?.playBattleBgm?.('trainer');
    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: targetNpc.trainerName || 'Rival Silver',
      trainerTeam: team,
      onVictory: () => {
        ctx.storyFlags.add('victory_road_rival_defeated');
        ctx.defeatedTrainers.add('rival_victory_road');

        // Silver steps aside to (12, 7) facing RIGHT, clearing exit ladder at (13, 5)
        targetNpc.x = 12;
        targetNpc.y = 7;
        targetNpc.gridX = 12;
        targetNpc.gridY = 7;
        targetNpc.targetX = 12;
        targetNpc.targetY = 7;
        targetNpc.renderX = 12;
        targetNpc.renderY = 7;
        targetNpc.direction = 'RIGHT';
        targetNpc.isMoving = false;
        targetNpc.progress = 0;

        BattleAudio.playOverworldSound('KEY_ITEM');
        openDialogue?.(VICTORY_ROAD_RIVAL_DEFEAT, speaker, () => {
          showToast?.('⚔️ Rival Silver accepted defeat and stepped aside!');
          ctx.saveCurrentGame?.();
          if (currentMap) ctx.renderMap?.(currentMap);
        });
      },
    });
  });

  return true;
};

// ============================================================================
// 4. Strength Boulder Pusher Handler
// ============================================================================

export const handleVictoryRoadBoulder: NpcInteractionHandler = (
  targetNpc: GridEntity,
  currentMap: MapData,
  ctx: NpcInteractionContext
) => {
  const openDialogue = ctx.openDialogue || (ctx as any).overworldHUD?.openDialogue?.bind((ctx as any).overworldHUD);
  const showToast = ctx.showToast || (ctx as any).overworldHUD?.showToast?.bind((ctx as any).overworldHUD);
  const strCheck = ModernHMHandler.canUseStrength(ctx.playerParty, ctx.inventory, ctx.storyFlags);

  if (!strCheck.canUse) {
    openDialogue?.(
      [
        'A giant boulder blocks the path!',
        strCheck.missingReason || 'A POKéMON with STRENGTH could shove it aside with the PLAIN BADGE.',
      ],
      '🪨 BOULDER'
    );
    return true;
  }

  const user = strCheck.userPokemon || strCheck.compatiblePokemon || ctx.playerParty[0];
  const userName = user ? user.nickname || user.speciesId.toUpperCase() : ctx.playerName;

  const playerDir = ctx.player?.direction || 'UP';
  let dx = 0;
  let dy = 0;
  if (playerDir === 'UP') dy = -1;
  else if (playerDir === 'DOWN') dy = 1;
  else if (playerDir === 'LEFT') dx = -1;
  else if (playerDir === 'RIGHT') dx = 1;

  const targetX = targetNpc.x + dx;
  const targetY = targetNpc.y + dy;

  const isOutOfBounds = targetX < 0 || targetX >= currentMap.width || targetY < 0 || targetY >= currentMap.height;
  const tileCollision = !isOutOfBounds ? currentMap.collisionGrid[targetY * currentMap.width + targetX] : 1;
  const isOccupiedByNpc = (ctx.npcsByMap?.[currentMap.id] || []).some(
    (n) => n.id !== targetNpc.id && n.x === targetX && n.y === targetY
  );

  if (isOutOfBounds || tileCollision !== 0 || isOccupiedByNpc) {
    BattleAudio.playOverworldSound('BUMP');
    openDialogue?.([`${userName}'s STRENGTH couldn't budge the boulder in that direction!`], '🪨 BOULDER');
    return true;
  }

  targetNpc.x = targetX;
  targetNpc.y = targetY;
  targetNpc.gridX = targetX;
  targetNpc.gridY = targetY;
  targetNpc.targetX = targetX;
  targetNpc.targetY = targetY;
  targetNpc.renderX = targetX;
  targetNpc.renderY = targetY;

  const flag =
    targetNpc.id === 'victory_road_boulder_1'
      ? 'EVENT_VICTORY_ROAD_BOULDER_1_MOVED'
      : targetNpc.id === 'victory_road_boulder_2'
      ? 'EVENT_VICTORY_ROAD_BOULDER_2_MOVED'
      : `${targetNpc.id}_moved`;
  ctx.storyFlags.add(flag);

  BattleAudio.playOverworldSound('RUSTLE');
  openDialogue?.([`${userName}'s STRENGTH moved the boulder!`], '🪨 BOULDER', () => {
    BattleAudio.playOverworldSound('KEY_ITEM');
    showToast?.(`🪨 Moved boulder to (${targetX}, ${targetY})!`);
    if (currentMap) ctx.renderMap?.(currentMap);
    ctx.saveCurrentGame?.();
  });

  return true;
};

// ============================================================================
// 5. Victory Road Delegated Step Interceptor
// ============================================================================

export function handleVictoryRoadStep(
  coord: { x: number; y: number },
  currentMap: MapData,
  ctx: any
): boolean {
  if (currentMap.id !== 'victory_road') return false;
  if (ctx.storyFlags?.has('victory_road_rival_defeated')) return false;

  // Exit ladder chokepoint at (12..14, 8) heading north
  if (coord.y === 8 && coord.x >= 12 && coord.x <= 14) {
    if (ctx.player) {
      ctx.player.isMoving = false;
      ctx.player.progress = 0;
      ctx.player.direction = 'UP';
    }
    BattleAudio.playOverworldSound('EXCLAMATION');

    const npcs = ctx.npcsByMap?.victory_road || [];
    let rival = npcs.find((n: GridEntity) => n.id === 'victory_road_rival');
    if (!rival) {
      rival = {
        id: 'victory_road_rival',
        x: 13,
        y: 7,
        gridX: 13,
        gridY: 7,
        renderX: 13,
        renderY: 7,
        targetX: 13,
        targetY: 7,
        direction: 'DOWN',
        sprite: 'silver',
        speaker: '🔴 RIVAL SILVER',
        action: 'VICTORY_ROAD_RIVAL_EVENT',
      };
    }

    handleVictoryRoadRival(rival, currentMap, ctx);
    return true;
  }

  return false;
}

// ============================================================================
// 6. Interaction Registration Factory
// ============================================================================

export function getVictoryRoadInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['VICTORY_ROAD_RIVAL_EVENT'],
      npcIds: ['victory_road_rival'],
      handler: handleVictoryRoadRival,
    },
    {
      npcIds: ['victory_road_boulder_1', 'victory_road_boulder_2'],
      handler: handleVictoryRoadBoulder,
    },
  ];
}
