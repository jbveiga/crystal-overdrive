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

function hasMasteredSuicune(ctx: Parameters<NpcInteractionHandler>[2]): boolean {
  return Boolean(
    ctx.storyFlags.has('suicune_caught_or_defeated') ||
      ctx.storyFlags.has('EVENT_CAUGHT_SUICUNE') ||
      ctx.storyFlags.has('EVENT_FOUGHT_SUICUNE') ||
      ctx.caughtSpecies?.has('suicune') ||
      ctx.caughtSpecies?.has('245') ||
      ctx.playerParty?.some((p) => p.speciesId === 'suicune' || p.speciesId === '245') ||
      ctx.playerBox?.some((p) => p.speciesId === 'suicune' || p.speciesId === '245')
  );
}

/** True once Suicune has been faced AND Raikou and Entei have been caught/defeated (or the `beasts_mastered` override). */
export function hasMasteredAllBeasts(ctx: Parameters<NpcInteractionHandler>[2]): boolean {
  const beast = (name: 'raikou' | 'entei', num: string): boolean =>
    Boolean(
      ctx.caughtSpecies?.has(name) ||
        ctx.caughtSpecies?.has(num) ||
        ctx.storyFlags.has(`caught_${name}`) ||
        ctx.storyFlags.has(`${name}_defeated`) ||
        ctx.storyFlags.has(`EVENT_CAUGHT_${name.toUpperCase()}`) ||
        ctx.storyFlags.has(`EVENT_FOUGHT_${name.toUpperCase()}`) ||
        ctx.playerParty?.some((p) => p.speciesId === name || p.speciesId === num) ||
        ctx.playerBox?.some((p) => p.speciesId === name || p.speciesId === num)
    );
  return (hasMasteredSuicune(ctx) && beast('raikou', '243') && beast('entei', '244')) || ctx.storyFlags.has('beasts_mastered');
}

/** Awards the Rainbow Wing (key item + flags) with the sages' recognition dialogue. Idempotent. */
export function bestowRainbowWing(
  ctx: Parameters<NpcInteractionHandler>[2],
  speaker: string,
  map?: Parameters<NpcInteractionHandler>[1]
): boolean {
  if (ctx.storyFlags.has('has_rainbow_wing')) return false;
  ctx.storyFlags.add('has_rainbow_wing');
  ctx.storyFlags.add('EVENT_GOT_RAINBOW_WING');
  if (Array.isArray(ctx.inventory?.keyItems)) {
    if (!ctx.inventory.keyItems.includes('RAINBOW WING') && !ctx.inventory.keyItems.includes('rainbow_wing')) {
      ctx.inventory.keyItems.push('RAINBOW WING');
    }
  }
  const inv = ctx.inventory as { items?: Record<string, number> };
  if (inv.items && typeof inv.items === 'object') inv.items.rainbow_wing = 1;
  ctx.audioManager?.playSfx?.('sfx_badge_get');
  BattleAudio.playOverworldSound('KEY_ITEM');
  ctx.openDialogue(
    [
      'WISE TRIO: Remarkable! The spirits of the three legendary beasts—RAIKOU of the lightning, ENTEI of the flames, and SUICUNE of the pure rain—reverberate through you!',
      'You are truly the chosen bearer of the sacred skies. Take this sacred relic!',
      `${ctx.playerName || 'Player'} received the RAINBOW WING!`,
      'With the CLEAR BELL and RAINBOW WING in hand, the stairway to the summit of TIN TOWER is open to you!',
    ],
    speaker,
    () => {
      ctx.showToast?.('🌈 Received the Rainbow Wing from the Wise Trio!');
      ctx.saveCurrentGame?.();
      if (map) ctx.renderMap?.(map);
    }
  );
  return true;
}

/**
 * 1. Tin Tower 1F: Tower Sage Barrier Unblocking & Rainbow Wing Bestowal
 * Verifies Clear Bell, Suicune/Legendary Beasts mastery, and awards Rainbow Wing.
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

  // Case 1: Player already has both Clear Bell and Rainbow Wing
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

  // Case 2: Player has calmed Suicune and captured/accounted for Raikou & Entei -> Bestow Rainbow Wing!
  const hasSuicune = hasMasteredSuicune(ctx);
  if (!hasRainbowWing && hasMasteredAllBeasts(ctx)) {
    return bestowRainbowWing(ctx, targetNpc?.speaker || '🏮 TOWER SAGE', _map);
  }

  // Case 3: Missing requirements
  if (hasSuicune) {
    ctx.openDialogue(
      [
        'TOWER SAGE: You have proven yourself before SUICUNE at the altar.',
        'However, the sacred sky guardian HO-OH will only manifest for one who has demonstrated harmony with all three beasts: RAIKOU, ENTEI, and SUICUNE.',
        'Seek the running beasts across Johto and earn their recognition before ascending to the summit!',
      ],
      targetNpc?.speaker || '🏮 TOWER SAGE'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'TOWER SAGE: Only the chosen bearer of the CLEAR BELL and RAINBOW WING may ascend this sacred tower!',
      'Seek the sacred relics and quell the beast trials across Johto before daring to climb to the summit!',
    ],
    targetNpc?.speaker || '🏮 TOWER SAGE'
  );
  return true;
};

/**
 * 2. Wise Trio Trial: Sages Gaku, Masa, and Koji
 */
export const handleWiseTrioSage: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const sageId = targetNpc.trainerId || targetNpc.id;
  const isDefeated = ctx.defeatedTrainers?.has(sageId);

  // If already defeated: deliver ancient lore
  if (isDefeated) {
    // After the trial and once all three legendary beasts are mastered, the Wise Trio award the Rainbow Wing
    if (
      (ctx.storyFlags.has('wise_trio_cleared') || ctx.storyFlags.has('EVENT_BEAT_WISE_TRIO')) &&
      hasMasteredAllBeasts(ctx) &&
      bestowRainbowWing(ctx, targetNpc.speaker || '🏮 WISE TRIO', _map)
    ) {
      return true;
    }
    if (sageId === 'wise_trio_gaku') {
      ctx.openDialogue(
        [
          'SAGE GAKU: According to legend, when a sudden lightning bolt struck the Brass Tower and engulfed it in flames, three nameless Pokémon perished in the inferno.',
          'HO-OH descended from the heavens and breathed new life into them as the elements: lightning, fire, and rain!',
        ],
        targetNpc.speaker || '🏮 SAGE GAKU'
      );
      return true;
    }
    if (sageId === 'wise_trio_masa') {
      ctx.openDialogue(
        [
          'SAGE MASA: When lightning struck the tower, the legend of the beasts was born!',
          'RAIKOU embodies the speed and fury of lightning. ENTEI runs with the untamed passion of volcanic fire. And SUICUNE is the crystal rain that purifies all.',
        ],
        targetNpc.speaker || '🏮 SAGE MASA'
      );
      return true;
    }
    if (sageId === 'wise_trio_koji') {
      ctx.openDialogue(
        [
          'SAGE KOJI: SUICUNE is said to be the reincarnation of northern winds.',
          'It races across Johto and Kanto, purifying polluted water with every breath.',
          ctx.storyFlags.has('wise_trio_cleared') || ctx.storyFlags.has('EVENT_BEAT_WISE_TRIO')
            ? 'You have proven your worthy spirit to all three of us. Approach the crystal altar!'
            : 'Defeat my fellow sages, and SUICUNE will test your heart!',
        ],
        targetNpc.speaker || '🏮 SAGE KOJI'
      );
      return true;
    }

    ctx.openDialogue(
      ['You have proven your courage to the WISE TRIO. May the sacred crystal beast guide you!'],
      targetNpc.speaker || '🏮 SAGE'
    );
    return true;
  }

  // Not defeated yet: Challenge to battle!
  const challengeText = targetNpc.challengePages?.[0] || 'Prove your strength and spirit in trial!';
  ctx.openDialogue(
    [challengeText],
    targetNpc.speaker || '🏮 SAGE',
    () => {
      const team = targetNpc.trainerTeam || [
        { speciesId: 'noctowl', level: 32, moves: ['hypnosis', 'confusion', 'tackle', 'reflect'] }
      ];
      const trainerPkmn = team.map((p: any) =>
        PokemonFactory.create(p.speciesId, p.level, p.moves)
      );

      ctx.triggerBattle(trainerPkmn[0], {
        isTrainer: true,
        trainerName: targetNpc.trainerName || targetNpc.speaker?.replace(/^[^\w]+/, '').trim() || 'Sage',
        trainerTeam: trainerPkmn,
        onVictory: () => {
          ctx.defeatedTrainers?.add(sageId);
          // Check if all 3 sages are defeated
          const gakuBeat = ctx.defeatedTrainers?.has('wise_trio_gaku');
          const masaBeat = ctx.defeatedTrainers?.has('wise_trio_masa');
          const kojiBeat = ctx.defeatedTrainers?.has('wise_trio_koji');

          if (gakuBeat && masaBeat && kojiBeat) {
            ctx.storyFlags.add('wise_trio_cleared');
            ctx.storyFlags.add('EVENT_BEAT_WISE_TRIO');
            ctx.openDialogue(
              [
                'You have bested all three of us in sacred trial!',
                'The trial of the WISE TRIO is complete. SUICUNE will now accept your challenge at the altar!',
              ],
              targetNpc.speaker || '🏮 SAGE',
              () => {
                ctx.saveCurrentGame?.();
                ctx.showToast?.('🏮 Cleared the Wise Trio Trial! Suicune awaits at the altar!');
                if (_map) ctx.renderMap?.(_map);
              }
            );
          } else {
            const remaining = 3 - [gakuBeat, masaBeat, kojiBeat].filter(Boolean).length;
            ctx.openDialogue(
              [
                'Well fought! But you must overcome all three sages of TIN TOWER before SUICUNE will acknowledge your spirit.',
                `Remaining sages to face: ${remaining}.`,
              ],
              targetNpc.speaker || '🏮 SAGE',
              () => {
                ctx.saveCurrentGame?.();
                if (_map) ctx.renderMap?.(_map);
              }
            );
          }
        },
      });
    }
  );
  return true;
};

/**
 * 3. Tin Tower 1F: Eusine Post-Suicune Cameo & Acknowledgement
 */
export const handleTinTowerEusine: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      `EUSINE: Staggering, ${ctx.playerName || 'trainer'}! Absolutely magnificent!`,
      'All my life, I have pursued the legendary north wind beast across cities, shores, and mountains…',
      'Yet SUICUNE chose you. When I saw the crystal radiance in your battle, I understood why.',
      'You possess the true heart of a champion. Go on—seek the legendary guardian of the skies!',
    ],
    targetNpc.speaker || '🎩 EUSINE'
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
      npcIds: ['tin_tower_sage', 'wise_trio_gaku', 'wise_trio_masa', 'wise_trio_koji', 'tin_tower_eusine'],
      actions: ['TIN_TOWER_SAGE_EVENT', 'WISE_TRIO_SAGE_EVENT', 'TIN_TOWER_EUSINE_EVENT'],
      handler: (targetNpc, map, ctx) => {
        if (
          targetNpc.action === 'WISE_TRIO_SAGE_EVENT' ||
          ['wise_trio_gaku', 'wise_trio_masa', 'wise_trio_koji'].includes(targetNpc.id)
        ) {
          return handleWiseTrioSage(targetNpc, map, ctx);
        }
        if (targetNpc.action === 'TIN_TOWER_EUSINE_EVENT' || targetNpc.id === 'tin_tower_eusine') {
          return handleTinTowerEusine(targetNpc, map, ctx);
        }
        return handleTinTowerSage(targetNpc, map, ctx);
      },
    },
    {
      npcIds: ['ho_oh_boss'],
      actions: ['HO_OH_BOSS_EVENT'],
      handler: handleHoOhBoss,
    },
  ];
}

export const tinTowerHoOhInteractions = getTinTowerHoOhInteractions();
