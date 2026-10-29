/**
 * @fileoverview SaffronAndRoute6Interactions domain module implementation.
 * @module world/interactions/SaffronAndRoute6Interactions
 * @role Saffron City, Saffron Gym, Magnet Train & Route 6 Interactions Component
 * @exports handleSabrinaInteraction, handleSaffronGymTrainer, handleSaffronGymGuideAndStatues,
 *          handleCopycatInteraction, handleMagnetTrainConductor, handleSaffronLandmarkGifts,
 *          handleRoute6Trainer, getSaffronAndRoute6Interactions
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-115: Sabrina & Saffron Gym | L116-210: Copycat & Magnet Train | L211-315: Landmarks & Route 6 | L316-390: Router Registration
 */

import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionContext, NpcInteractionRegistration } from '../../types/worldContext';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * Handles Sabrina boss interaction, dialogue, pre-battle clairvoyance, and victory rewards.
 */
export function handleSabrinaInteraction(
  sabrinaNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const hasWon =
    ctx.storyFlags.has('sabrina_defeated') ||
    ctx.defeatedTrainers.has('sabrina') ||
    ctx.defeatedTrainers.has(sabrinaNpc.id);

  if (hasWon) {
    ctx.openDialogue(
      [
        'SABRINA: Your love for your POKéMON overcame my psychic power...',
        'The ability to believe in each other is power in itself.',
      ],
      sabrinaNpc.speaker || '🔮 LEADER SABRINA'
    );
    return true;
  }

  const preBattleDialogue = [
    'I had a vision of your arrival! I have had psychic powers since I was a child.',
    "It started when a spoon I carelessly threw didn't fall to the floor!",
    'You desire the MARSHBADGE? I do not like to fight, but it is my duty as a GYM LEADER to confer BADGES on anyone who has proven themselves worthy!',
  ];

  ctx.openDialogue(preBattleDialogue, sabrinaNpc.speaker || '🔮 LEADER SABRINA', () => {
    let team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(sabrinaNpc) : [];
    if (!team || team.length === 0) {
      team = [
        PokemonFactory.create('alakazam', 48, ['psychic', 'reflect', 'futuresight', 'recover']),
        PokemonFactory.create('espeon', 46, ['psychic', 'swift', 'quickattack', 'sandattack']),
        PokemonFactory.create('mrmime', 46, ['psychic', 'barrier', 'lightscreen', 'batonpass']),
      ];
    }

    ctx.audioManager.playBattleBgm?.('gym_leader');
    ctx.triggerBattle(team[0], {
      isTrainer: true,
      isGymLeader: true,
      trainerName: 'SABRINA',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add('sabrina');
        ctx.defeatedTrainers.add(sabrinaNpc.id);
        ctx.storyFlags.add('sabrina_defeated');
        ctx.storyFlags.add('marsh_badge');

        if (ctx.inventory) {
          ctx.inventory.badges = ctx.inventory.badges || [];
          if (!ctx.inventory.badges.includes('marsh')) {
            ctx.inventory.badges.push('marsh');
          }
        }

        ctx.audioManager.playSfx?.('sfx_badge_get');
        BattleAudio.playOverworldSound('KEY_ITEM');

        ctx.openDialogue(
          [
            'SABRINA: I am shocked! But a defeat is a defeat. I shall admit our loss.',
            `${ctx.playerName} received the MARSHBADGE from SABRINA!`,
            'The MARSHBADGE proves you have mastered the psychic mind over matter!',
          ],
          sabrinaNpc.speaker || '🔮 LEADER SABRINA',
          () => {
            const curMap = ctx.mapManager.getCurrentMap();
            if (curMap) {
              ctx.renderMap?.(curMap);
              ctx.syncMapOverworldItems?.(curMap);
            }
            ctx.saveCurrentGame?.();
            ctx.showToast?.('🔮 Defeated Gym Leader Sabrina & received the MARSHBADGE!');
          }
        );
      },
    });
  });
  return true;
}

/**
 * Handles Saffron Gym trainers (Rebecca, Franklin, Doris, Jared).
 */
export function handleSaffronGymTrainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId) || ctx.defeatedTrainers.has(trainerNpc.id)) {
    const rawDefeat = (trainerNpc as any).defeatPages;
    const defeatPages =
      rawDefeat && rawDefeat.length > 0
        ? rawDefeat
        : trainerNpc.pages && trainerNpc.pages.length > 0
        ? trainerNpc.pages
        : ['Your spiritual resolve completely shattered our psychic focus!'];
    ctx.openDialogue(defeatPages, trainerNpc.speaker);
    return true;
  }

  const challenge =
    trainerNpc.challengePages && trainerNpc.challengePages.length > 0
      ? trainerNpc.challengePages
      : ['Feel the unseen psychic energy bend reality!'];

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
            : trainerNpc.pages && trainerNpc.pages.length > 0
            ? trainerNpc.pages
            : ['Incredible! Your mind remains unshakable!'];
        ctx.openDialogue(postPages, trainerNpc.speaker, () => {
          ctx.saveCurrentGame?.();
        });
      },
    });
  });
  return true;
}

/**
 * Handles Saffron Gym Guide and dynamic Gym Statues.
 */
export function handleSaffronGymGuideAndStatues(
  entity: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (entity.action === 'SAFFRON_GYM_GUIDE' || entity.id.includes('guide')) {
    if (ctx.storyFlags.has('sabrina_defeated')) {
      ctx.openDialogue(
        [
          'Yo, CHAMP!',
          'You showed SABRINA the power of pure determination! Psychic powers cannot beat a brave heart!',
        ],
        entity.speaker || '🏆 GYM GUIDE'
      );
      return true;
    }
    ctx.openDialogue(
      [
        'Yo, CHAMP in making!',
        'SABRINA and her disciples use PSYCHIC-type Pokémon! Dark and Ghost-type moves are super effective against them! Bug-type moves will also hit hard!',
      ],
      entity.speaker || '🏆 GYM GUIDE'
    );
    return true;
  }

  // Saffron Gym Statue
  const hasBeaten = ctx.storyFlags.has('sabrina_defeated') || ctx.storyFlags.has('marsh_badge');
  const winner = hasBeaten
    ? `WINNING TRAINERS:\nRED\n${ctx.playerName}`
    : 'WINNING TRAINERS:\nRED';
  ctx.openDialogue(
    ['SAFFRON CITY POKéMON GYM', 'LEADER: SABRINA', winner],
    entity.speaker || '🏆 GYM STATUE'
  );
  return true;
}

/**
 * Handles Copycat 2F doll exchange for Magnet Train Pass.
 */
export function handleCopycatInteraction(
  copycatNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('got_magnet_train_pass')) {
    ctx.openDialogue(
      [
        'COPYCAT: Hi! Thanks for the CLEFAIRY DOLL!',
        'Riding the MAGNET TRAIN between KANTO and JOHTO is so fast and fun!',
      ],
      copycatNpc.speaker || '👧 COPYCAT'
    );
    return true;
  }

  const hasLostItem =
    ctx.inventory?.keyItems?.includes('lost-item') ||
    (ctx.inventory?.items && (ctx.inventory.items['lost-item'] ?? 0) > 0);

  if (hasLostItem) {
    ctx.openDialogue(
      [
        "COPYCAT: Yay! That's my CLEFAIRY DOLL! You found it! Thank you so much!",
        'Here, take this MAGNET TRAIN PASS in exchange!',
      ],
      copycatNpc.speaker || '👧 COPYCAT',
      () => {
        if (ctx.inventory?.keyItems) {
          ctx.inventory.keyItems = ctx.inventory.keyItems.filter((i) => i !== 'lost-item');
        }
        if (ctx.inventory?.items && ctx.inventory.items['lost-item']) {
          delete ctx.inventory.items['lost-item'];
        }

        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('pass');
        } else if (ctx.inventory) {
          ctx.inventory.keyItems = ctx.inventory.keyItems || [];
          if (!ctx.inventory.keyItems.includes('pass')) {
            ctx.inventory.keyItems.push('pass');
          }
        }
        ctx.storyFlags.add('got_magnet_train_pass');
        ctx.storyFlags.add('copycat_doll_returned');
        BattleAudio.playOverworldSound('KEY_ITEM');

        ctx.openDialogue(
          [`${ctx.playerName} received the MAGNET TRAIN PASS from COPYCAT!`],
          copycatNpc.speaker || '👧 COPYCAT',
          () => {
            const curMap = ctx.mapManager.getCurrentMap();
            if (curMap) {
              ctx.renderMap?.(curMap);
            }
            ctx.saveCurrentGame?.();
            ctx.showToast?.('🚄 Returned Clefairy Doll & received the MAGNET TRAIN PASS!');
          }
        );
      }
    );
    return true;
  }

  ctx.storyFlags.add('copycat_lost_doll');
  ctx.storyFlags.add('EVENT_MET_COPYCAT');
  ctx.storyFlags.add('quest_copycat_doll');

  ctx.openDialogue(
    [
      "COPYCAT: Hi! Do you like POKéMON? Uh... What? You're asking about me?",
      "...I lost my favorite CLEFAIRY DOLL in VERMILION CITY!",
      "If someone found it, I'd gladly give them a PASS for the MAGNET TRAIN!",
    ],
    copycatNpc.speaker || '👧 COPYCAT'
  );
  return true;
}

/**
 * Handles Magnet Train Conductor boarding between Saffron Station and Goldenrod Station.
 */
export function handleMagnetTrainConductor(
  conductorNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const hasPass =
    ctx.inventory?.keyItems?.includes('pass') ||
    (ctx.inventory?.items && (ctx.inventory.items['pass'] ?? 0) > 0) ||
    ctx.storyFlags.has('got_magnet_train_pass');

  if (!hasPass) {
    ctx.openDialogue(
      [
        'CONDUCTOR: You need a PASS to ride the MAGNET TRAIN!',
        'Only authorized travelers with a RAIL PASS may board the train.',
      ],
      conductorNpc.speaker || '👮 STATION CONDUCTOR'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'CONDUCTOR: May I see your PASS? ...Right! Everything is in order!',
      'Please step aboard the MAGNET TRAIN! Next stop: full speed ahead!',
    ],
    conductorNpc.speaker || '👮 STATION CONDUCTOR',
    () => {
      const currentMapId = ctx.mapManager.getCurrentMap()?.id;
      const targetStation =
        currentMapId === 'saffron_magnet_train_station'
          ? 'goldenrod_magnet_train_station'
          : 'saffron_magnet_train_station';

      BattleAudio.playOverworldSound('KEY_ITEM');

      if (ctx.executeWarpTransition) {
        ctx.executeWarpTransition({
          x: 9,
          y: 6,
          targetMapId: targetStation,
          targetX: 9,
          targetY: 6,
          direction: 'DOWN',
        });
      } else {
        if (typeof (ctx.mapManager as any).loadMap === 'function') {
          (ctx.mapManager as any).loadMap(targetStation);
        } else if (ctx.mapManager?.setCurrentMap) {
          ctx.mapManager.setCurrentMap(targetStation);
        }
        ctx.player.x = 9;
        ctx.player.y = 6;
        ctx.player.direction = 'DOWN';
        const nextMap = ctx.mapManager.getCurrentMap();
        if (nextMap && ctx.renderMap) {
          ctx.renderMap(nextMap);
        }
      }
      ctx.showToast?.('🚄 Arrived via the Magnet Train!');
    }
  );
  return true;
}

/**
 * Handles Silph Co. Guard (Up-Grade), Mr. Psychic (TM29), and Fighting Dojo disciple.
 */
export function handleSaffronLandmarkGifts(
  entity: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (entity.action === 'SILPH_CO_GUARD' || entity.id.includes('silph_co_guard')) {
    if (ctx.storyFlags.has('got_silph_co_upgrade')) {
      ctx.openDialogue(
        ['SILPH CO. continues developing cutting-edge technology for trainers around the world.'],
        entity.speaker || '👮 SILPH CO. GUARD'
      );
      return true;
    }

    ctx.openDialogue(
      [
        'Welcome to SILPH CO.! We develop state-of-the-art items for trainers.',
        'Here, take this sample of our newest product as a gift!',
      ],
      entity.speaker || '👮 SILPH CO. GUARD',
      () => {
        ctx.storyFlags.add('got_silph_co_upgrade');
        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('up-grade');
        } else if (ctx.inventory?.items) {
          ctx.inventory.items['up-grade'] = (ctx.inventory.items['up-grade'] || 0) + 1;
        }
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            `${ctx.playerName} received UP-GRADE from the SILPH CO. GUARD!`,
            'The UP-GRADE is a transparent data device made by SILPH CO. It holds curious evolution data.',
          ],
          entity.speaker || '👮 SILPH CO. GUARD',
          () => {
            ctx.saveCurrentGame?.();
            ctx.showToast?.('💾 Received UP-GRADE from Silph Co. Guard!');
          }
        );
      }
    );
    return true;
  }

  if (entity.action === 'MR_PSYCHIC' || entity.id.includes('mr_psychic')) {
    if (ctx.storyFlags.has('got_tm29_psychic')) {
      ctx.openDialogue(
        ['MR. PSYCHIC: TM29 contains PSYCHIC! A mind attuned to the cosmos can move mountains.'],
        entity.speaker || '🔮 MR. PSYCHIC'
      );
      return true;
    }

    ctx.openDialogue(
      [
        '... ... ... ... ... ... ... ... ... ... ... ...',
        'I knew you were coming! I foresaw it! You want this TM, do you not? Take it!',
      ],
      entity.speaker || '🔮 MR. PSYCHIC',
      () => {
        ctx.storyFlags.add('got_tm29_psychic');
        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('tm29');
        } else if (ctx.inventory) {
          ctx.inventory.tms = ctx.inventory.tms || [];
          if (!ctx.inventory.tms.includes('TM29')) {
            ctx.inventory.tms.push('TM29');
          }
        }
        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.openDialogue(
          [
            `${ctx.playerName} received TM29 PSYCHIC from MR. PSYCHIC!`,
            'MR. PSYCHIC: TM29 is PSYCHIC! It unleashes devastating telekinetic energy and may lower the target’s SPECIAL DEFENSE!',
          ],
          entity.speaker || '🔮 MR. PSYCHIC',
          () => {
            ctx.saveCurrentGame?.();
            ctx.showToast?.('🔮 Received TM29 (Psychic) from Mr. Psychic!');
          }
        );
      }
    );
    return true;
  }

  if (entity.action === 'FIGHTING_DOJO_DISCIPLE' || entity.id.includes('fighting_dojo')) {
    ctx.openDialogue(
      [
        'Hello! KARATE KING, the master of the FIGHTING DOJO, is currently training in MT. MORTAR in JOHTO!',
        'Without him, we cannot officially hand out badges, but you can feel free to train your spirit here!',
      ],
      entity.speaker || '🥋 KARATE MASTER'
    );
    return true;
  }

  ctx.openDialogue(
    entity.pages && entity.pages.length > 0 ? entity.pages : ['Greetings, traveler!'],
    entity.speaker
  );
  return true;
}

/**
 * Handles Route 6 trainers (Rex, Allan, Jerry, Debby).
 */
export function handleRoute6Trainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId) || ctx.defeatedTrainers.has(trainerNpc.id)) {
    const rawDefeat = (trainerNpc as any).defeatPages;
    const defeatPages =
      rawDefeat && rawDefeat.length > 0
        ? rawDefeat
        : trainerNpc.pages && trainerNpc.pages.length > 0
        ? trainerNpc.pages
        : ['That was a spirited battle!'];
    ctx.openDialogue(defeatPages, trainerNpc.speaker);
    return true;
  }

  const challenge =
    trainerNpc.challengePages && trainerNpc.challengePages.length > 0
      ? trainerNpc.challengePages
      : ["Let's have a battle!"];

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
            : trainerNpc.pages && trainerNpc.pages.length > 0
            ? trainerNpc.pages
            : ['You fought with admirable skill!'];
        ctx.openDialogue(postPages, trainerNpc.speaker, () => {
          ctx.saveCurrentGame?.();
        });
      },
    });
  });
  return true;
}

/**
 * Returns all interaction routes for Saffron City, Gym, Magnet Train, and Route 6.
 */
export function getSaffronAndRoute6Interactions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['SABRINA_EVENT'],
      npcIds: ['saffron_gym_sabrina'],
      handler: (targetNpc, _map, ctx) => handleSabrinaInteraction(targetNpc, ctx),
    },
    {
      actions: ['SAFFRON_GYM_TRAINER'],
      npcIds: [
        'saffron_gym_rebecca',
        'saffron_gym_franklin',
        'saffron_gym_doris',
        'saffron_gym_jared',
      ],
      handler: (targetNpc, _map, ctx) => handleSaffronGymTrainer(targetNpc, ctx),
    },
    {
      actions: ['SAFFRON_GYM_GUIDE'],
      npcIds: ['saffron_gym_guide'],
      handler: (targetNpc, _map, ctx) => handleSaffronGymGuideAndStatues(targetNpc, ctx),
    },
    {
      actions: ['SAFFRON_GYM_STATUE'],
      npcIds: ['saffron_gym_statue_left', 'saffron_gym_statue_right'],
      handler: (targetNpc, _map, ctx) => handleSaffronGymGuideAndStatues(targetNpc, ctx),
    },
    {
      actions: ['COPYCAT_EVENT'],
      npcIds: ['copycat'],
      handler: (targetNpc, _map, ctx) => handleCopycatInteraction(targetNpc, ctx),
    },
    {
      actions: ['MAGNET_TRAIN_CONDUCTOR'],
      npcIds: ['saffron_train_conductor', 'station_officer'],
      handler: (targetNpc, _map, ctx) => handleMagnetTrainConductor(targetNpc, ctx),
    },
    {
      actions: ['SILPH_CO_GUARD', 'MR_PSYCHIC', 'FIGHTING_DOJO_DISCIPLE'],
      npcIds: ['silph_co_guard', 'mr_psychic', 'fighting_dojo_disciple'],
      handler: (targetNpc, _map, ctx) => handleSaffronLandmarkGifts(targetNpc, ctx),
    },
    {
      actions: ['ROUTE_6_TRAINER'],
      npcIds: ['route_6_rex', 'route_6_allan', 'route_6_jerry', 'route_6_debby'],
      handler: (targetNpc, _map, ctx) => handleRoute6Trainer(targetNpc, ctx),
    },
  ];
}
