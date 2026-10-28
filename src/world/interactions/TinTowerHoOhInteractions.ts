/**
 * @fileoverview TinTowerHoOhInteractions domain module implementation.
 * @module world/interactions/TinTowerHoOhInteractions
 * @role Bell Tower (Tin Tower) Sages & Ho-Oh Legendary Rooftop Encounter
 * @exports getTinTowerHoOhInteractions, tinTowerHoOhInteractions, handleTinTowerSage, handleHoOhBoss
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-70: Tower Sage Barrier | L71-140: Ho-Oh Rooftop Encounter | L141-170: Registration Factory
 */

import type {
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

/**
 * 1. Tin Tower 1F: Tower Sage Barrier Unblocking
 * Verifies Clear Bell and Rainbow Wing progression items.
 */
export const handleTinTowerSage: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const hasClearBell =
    ctx.storyFlags.has('has_clear_bell') ||
    ctx.storyFlags.has('EVENT_GOT_CLEAR_BELL') ||
    Boolean((ctx.inventory as any)?.items?.clear_bell) ||
    Boolean((ctx.inventory as any)?.items?.['clear-bell']) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('clear_bell')) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('clear-bell')) ||
    Boolean((ctx.inventory as any)?.keyItems?.some?.((k: string) => k.toLowerCase().includes('clear bell') || k.toLowerCase().includes('clear_bell')));

  const hasRainbowWing =
    ctx.storyFlags.has('has_rainbow_wing') ||
    ctx.storyFlags.has('EVENT_GOT_RAINBOW_WING') ||
    Boolean((ctx.inventory as any)?.items?.rainbow_wing) ||
    Boolean((ctx.inventory as any)?.items?.['rainbow-wing']) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('rainbow_wing')) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('rainbow-wing')) ||
    Boolean((ctx.inventory as any)?.keyItems?.some?.((k: string) => k.toLowerCase().includes('rainbow')));

  if (hasClearBell && hasRainbowWing) {
    ctx.storyFlags.add('EVENT_TIN_TOWER_SAGE_UNBLOCKED');
    ctx.openDialogue(
      [
        'TOWER SAGE: Ah! You bear both the CLEAR BELL and the radiant RAINBOW WING!',
        'The sacred staircase to the upper heights is open to you.',
        'Ascend the ten sacred floors of TIN TOWER! May the legendary guardian of the skies look upon your courage with favor!',
      ],
      targetNpc?.speaker || '🏮 TOWER SAGE'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'TOWER SAGE: Only the chosen bearer of the CLEAR BELL and RAINBOW WING may ascend this sacred tower!',
      'Seek the sacred relics across Johto before daring to climb to the summit!',
    ],
    targetNpc?.speaker || '🏮 TOWER SAGE'
  );
  return true;
};

/**
 * 2. Tin Tower Roof: Legendary Sky Guardian Ho-Oh Boss Encounter
 */
export const handleHoOhBoss: NpcInteractionHandler = (_targetNpc, currentMap, ctx) => {
  if (
    ctx.storyFlags.has('ho_oh_defeated') ||
    ctx.storyFlags.has('EVENT_FOUGHT_HO_OH') ||
    ctx.storyFlags.has('EVENT_CAUGHT_HO_OH')
  ) {
    ctx.openDialogue(
      [
        'A serene calm settles over the sacred summit high above Ecruteak City.',
        'The winds whisper ancient tales of the rainbow bird that protects the skies.',
      ],
      '🌈 TIN TOWER ROOF'
    );
    return true;
  }

  const hasRainbowWing =
    ctx.storyFlags.has('has_rainbow_wing') ||
    ctx.storyFlags.has('EVENT_GOT_RAINBOW_WING') ||
    Boolean((ctx.inventory as any)?.items?.rainbow_wing) ||
    Boolean((ctx.inventory as any)?.items?.['rainbow-wing']) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('rainbow_wing')) ||
    Boolean((ctx.inventory as any)?.keyItems?.includes?.('rainbow-wing')) ||
    Boolean((ctx.inventory as any)?.keyItems?.some?.((k: string) => k.toLowerCase().includes('rainbow')));

  if (!hasRainbowWing) {
    ctx.openDialogue(
      [
        'The sacred rooftop altar stands silent.',
        'A rainbow-hued feather is said to summon the legendary guardian of the skies.',
      ],
      '🌈 TIN TOWER ROOF'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'The RAINBOW WING begins to shine with brilliant, celestial colors!',
      'High atop the sacred summit of TIN TOWER, the guardian bird of the skies descends!',
    ],
    '🌈 TIN TOWER ROOF',
    () => {
      BattleAudio.playCry('ho-oh');
      ctx.openDialogue(
        ['HO-OH: Shaoooh!'],
        '🌈 HO-OH',
        () => {
          const hoOh = PokemonFactory.create('ho-oh', 60, [
            'sacredfire',
            'fireblast',
            'recover',
            'sunnyday',
          ]);
          ctx.triggerBattle(hoOh, {
            onBattleEnd: (result) => {
              if (result.winner === 'PLAYER' || result.caught) {
                ctx.storyFlags.add('ho_oh_defeated');
                ctx.storyFlags.add('EVENT_FOUGHT_HO_OH');
                if (result.caught) {
                  ctx.storyFlags.add('EVENT_CAUGHT_HO_OH');
                }
                ctx.audioManager?.playSfx?.('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.openDialogue(
                  [
                    'HO-OH spread its radiant rainbow wings and ascended gracefully into the higher heavens!',
                    'A serene calm settles over the sacred summit high above Ecruteak City.',
                  ],
                  '🌈 HO-OH',
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast('🌈 Quelled the Legendary Sky Guardian Ho-Oh!');
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
 * Registration factory for Tin Tower & Ho-Oh interactions
 */
export function getTinTowerHoOhInteractions(): NpcInteractionRegistration[] {
  return [
    {
      npcIds: ['tin_tower_sage'],
      actions: ['TIN_TOWER_SAGE_EVENT'],
      handler: handleTinTowerSage,
    },
    {
      npcIds: ['ho_oh_boss'],
      actions: ['HO_OH_BOSS_EVENT'],
      handler: handleHoOhBoss,
    },
  ];
}

export const tinTowerHoOhInteractions = getTinTowerHoOhInteractions();
