/**
 * @fileoverview WhirlIslandsInteractions domain module implementation.
 * @module world/interactions/WhirlIslandsInteractions
 * @role Whirl Islands Caverns & Silver Wing Lugia Chamber Interactions Component
 * @exports getWhirlIslandsInteractions, handleLugiaShrineOrBoss, handleWhirlpoolObstacle, handleWhirlIslandsLoreSage
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-115: Lugia Shrine & Boss Encounter | L116-160: Whirlpools & Lore | L161-200: Registration Factory
 */

import type {
  NpcInteractionContext,
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { ModernHMHandler } from '../ModernHMHandler';

/**
 * 1. Whirl Islands Lugia Chamber: Sacred Basin & Silver Wing Awakening
 */
export const handleLugiaShrineOrBoss: NpcInteractionHandler = (_targetNpc, currentMap, ctx) => {
  if (ctx.storyFlags.has('lugia_defeated') || ctx.storyFlags.has('EVENT_FOUGHT_LUGIA')) {
    ctx.openDialogue(
      [
        'The sacred underground waterfall cascades into the tranquil basin.',
        'The guardian of the seas rests peacefully in deep slumber.',
      ],
      '🌊 LUGIA BASIN'
    );
    return true;
  }

  const hasSilverWing =
    ctx.storyFlags.has('has_silver_wing') ||
    ctx.storyFlags.has('EVENT_GOT_SILVER_WING') ||
    Boolean((ctx.inventory as any)?.items?.silver_wing) ||
    Boolean((ctx.inventory as any)?.items?.['silver-wing']) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('silver_wing')) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('silver-wing')) ||
    Boolean((ctx.inventory as any)?.keyItems?.some?.((k: string) => k.toLowerCase().includes('silver')));

  if (!hasSilverWing) {
    ctx.openDialogue(
      [
        'A cascading underground waterfall echoes through the sacred chamber…',
        'Deep within the basin, the legendary Silver-Winged guardian of the seas, LUGIA, rests in slumber.',
        'A silver, feather-shaped artifact is said to awaken the guardian.',
      ],
      '🌊 LUGIA BASIN'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'The SILVER WING begins to glow with an intense, iridescent light!',
      'The subterranean waterfall basin surges as a massive shadow ascends from the depths!',
    ],
    '🌊 LUGIA BASIN',
    () => {
      BattleAudio.playCry('lugia');
      ctx.openDialogue(
        ['LUGIA: Gyaoooon!'],
        '🌊 LUGIA',
        () => {
          const lugia = PokemonFactory.create('lugia', 60, [
            'aeroblast',
            'safeguard',
            'gust',
            'recover',
          ]);
          ctx.triggerBattle(lugia, {
            onBattleEnd: (result) => {
              if (result.winner === 'PLAYER' || result.caught) {
                ctx.storyFlags.add('lugia_defeated');
                ctx.storyFlags.add('EVENT_FOUGHT_LUGIA');
                ctx.audioManager?.playSfx?.('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.openDialogue(
                  [
                    'LUGIA gave a solemn, resonant cry and submerged into the sacred depths.',
                    'A serene calm settled over the cavern basin.',
                  ],
                  '🌊 LUGIA',
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast('🌊 Quelled the Legendary Guardian Lugia!');
                    if (currentMap) ctx.renderMap?.(currentMap);
                  }
                );
              }
            },
          });
        }
      );
    }
  );
  return true;
};

/**
 * 2. Route 41 Ocean Whirlpools: Field Obstacle Calming Interaction
 */
export const handleWhirlpoolObstacle: NpcInteractionHandler = (
  _targetNpc,
  currentMap,
  ctx,
  opts?: { targetCoord?: { x: number; y: number } }
) => {
  const wpCheck = ModernHMHandler.canUseWhirlpool(
    ctx.playerParty,
    ctx.inventory,
    ctx.storyFlags
  );

  const targetX = (opts as any)?.targetCoord?.x ?? ctx.player.x;
  const targetY = (opts as any)?.targetCoord?.y ?? ctx.player.y;

  if (wpCheck.canUse) {
    const user =
      wpCheck.userPokemon ||
      wpCheck.compatiblePokemon ||
      ctx.playerParty.find((p) => !p.isEgg) ||
      ctx.playerParty[0];
    const userName = user
      ? user.nickname || user.speciesId.toUpperCase()
      : ctx.playerName;
    BattleAudio.playOverworldSound('RUSTLE');
    ctx.openDialogue(
      [
        'A swirling whirlpool blocks the path!',
        `${userName} used WHIRLPOOL to calm the churning waters!`,
      ],
      '🌀 WHIRLPOOL',
      () => {
        ctx.storyFlags.add(`whirlpool_cleared_${targetX}_${targetY}`);
        if (currentMap?.collisionGrid) {
          currentMap.collisionGrid[targetY * currentMap.width + targetX] = 0;
        }
        ctx.renderMap?.(currentMap);
        ctx.saveCurrentGame();
        ctx.showToast('🌀 The whirlpool subsided!');
      }
    );
  } else {
    ctx.openDialogue(
      [
        'A vicious whirlpool is spinning violently!',
        wpCheck.missingReason ||
          'You need HM06 WHIRLPOOL and the GLACIER BADGE from Mahogany Gym to cross.',
      ],
      '🌀 WHIRLPOOL'
    );
  }
  return true;
};

/**
 * 3. Whirl Islands Caverns: Lore Sage / Explorer Dialogue
 */
export const handleWhirlIslandsLoreSage: NpcInteractionHandler = (_targetNpc, _currentMap, ctx) => {
  ctx.openDialogue(
    [
      'EXPLORER: These sea caverns are a treacherous labyrinth beneath Route 41.',
      'Waterfalls surge underground, carving deep abysses into the rock.',
      'They say the legendary silver beast fled from Ecruteak City long ago to nest in these ocean depths.',
    ],
    '🧭 CAVE EXPLORER'
  );
  return true;
};

/**
 * Registers all Whirl Islands interactions for constant-time O(1) routing.
 */
export function getWhirlIslandsInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['LUGIA_SHRINE_EVENT', 'LUGIA_BOSS_EVENT'],
      npcIds: ['whirl_island_lugia', 'lugia_shrine'],
      handler: handleLugiaShrineOrBoss,
    },
    {
      actions: ['WHIRLPOOL_OBSTACLE_EVENT'],
      npcIds: ['route_41_whirlpool'],
      handler: handleWhirlpoolObstacle,
    },
    {
      actions: ['WHIRL_ISLAND_LORE_EVENT'],
      npcIds: ['whirl_islands_lore_sage'],
      handler: handleWhirlIslandsLoreSage,
    },
  ];
}
