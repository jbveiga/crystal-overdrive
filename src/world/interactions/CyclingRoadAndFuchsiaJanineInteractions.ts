/**
 * @fileoverview CyclingRoadAndFuchsiaJanineInteractions domain module implementation.
 * Handles Route 16 secluded speech house, Route 17 Cycling Road Bikers, Route 18 Bird Keepers,
 * Safari Zone Warden Granddaughter, Fuchsia Gym invisible maze, Decoys, and Gym Leader Janine.
 * @module world/interactions/CyclingRoadAndFuchsiaJanineInteractions
 * @role Domain Interaction Logic
 * @exports getCyclingRoadAndFuchsiaJanineInteractions, handleJanineInteraction, handleFuchsiaGymDecoy, handleFuchsiaGymGuideAndStatues, handleRoute16SpeechHouse, handleBikerTrainer, handleBirdKeeperTrainer, handleWardenGranddaughter
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-160: Fuchsia Gym Janine & Decoys | L161-260: Gym Guide, Statues & Recluse | L261-420: Bikers, Bird Keepers, Granddaughter & Registration
 */

import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import type { GridEntity } from '../GridPhysics';
import type {
  NpcInteractionContext,
  NpcInteractionRegistration,
} from '../../types/worldContext';

function resolveTrainerInstances(
  npc: GridEntity,
  ctx: NpcInteractionContext,
  fallback: any[]
): any[] {
  let team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(npc) : [];
  if (!team || team.length === 0) {
    const raw = npc.trainerTeam || (npc as any).team || fallback;
    team = (raw || []).map((m: any) => PokemonFactory.create(m.speciesId, m.level, m.moves));
  }
  return team;
}

/**
 * Handles Janine boss interaction, pre-battle ninja monologue, boss battle,
 * Soul Badge award, and TM06 Toxic award.
 */
export function handleJanineInteraction(
  janineNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('janine_defeated') || (ctx.inventory?.badges && ctx.inventory.badges.includes('soul'))) {
    ctx.openDialogue(
      [
        "JANINE: I'm going to train day and night until my ninja poison skills surpass even my father's!",
        'One day, I will become an ELITE FOUR master just like him!',
      ],
      janineNpc.speaker || '🏆 LEADER JANINE'
    );
    return true;
  }

  ctx.openDialogue(
    janineNpc.pages || [
      "Fufufufu... I'm JANINE, the real GYM LEADER!",
      'My father is KOGA of the ELITE FOUR. I am training hard to surpass my father ninja techniques and poison skills!',
      'You will never see through my illusions and venomous arts! Prepare yourself!',
    ],
    janineNpc.speaker || '🏆 LEADER JANINE',
    () => {
      const instances = resolveTrainerInstances(janineNpc, ctx, [
        { speciesId: 'crobat', level: 36, moves: ['confuseray', 'screech', 'leechlife', 'wingattack'] },
        { speciesId: 'weezing', level: 36, moves: ['sludgebomb', 'smog', 'toxic', 'explosion'] },
        { speciesId: 'weezing', level: 36, moves: ['sludgebomb', 'smog', 'toxic', 'explosion'] },
        { speciesId: 'ariados', level: 33, moves: ['scaryface', 'gigadrain', 'stringshot', 'nightshade'] },
        { speciesId: 'venomoth', level: 39, moves: ['gust', 'supersonic', 'toxic', 'psychic'] },
      ]);
      if (instances.length === 0) return;

      let awarded = false;
      const onBattleWon = () => {
        if (awarded) return;
        awarded = true;

        if (!ctx.inventory.badges) ctx.inventory.badges = [];
        if (!ctx.inventory.badges.includes('soul')) {
          ctx.inventory.badges.push('soul');
        }

        if (!ctx.inventory.tms) ctx.inventory.tms = [];
        if (!ctx.inventory.tms.includes('TM06')) {
          ctx.inventory.tms.push('TM06');
        }

        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('tm06');
        }

        ctx.storyFlags.add('janine_defeated');
        ctx.storyFlags.add('EVENT_BEAT_JANINE');
        ctx.defeatedTrainers.add('janine');
        ctx.defeatedTrainers.add('fuchsia_gym_janine');

        BattleAudio.playOverworldSound('KEY_ITEM');

        ctx.openDialogue(
          [
            'JANINE: You really are something... My father spoke of formidable trainers like you.',
            'Here, take this. It is the official POKéMON LEAGUE SOULBADGE!',
            `${ctx.playerName || 'Trainer'} received the SOULBADGE from JANINE!`,
            'JANINE: Also, take this TM. It contains my signature technique!',
            `${ctx.playerName || 'Trainer'} received TM06 TOXIC!`,
            'JANINE: TM06 is TOXIC. It inflicts insidious poison that worsens with every passing turn! It is the ultimate ninja poison art!',
          ],
          janineNpc.speaker || '🏆 LEADER JANINE',
          () => {
            BattleAudio.playOverworldSound('FANFARE');
            ctx.showToast?.('🥷 Defeated Gym Leader Janine & received the SOULBADGE and TM06 TOXIC!');
            ctx.saveCurrentGame?.();
          }
        );
      };

      ctx.triggerBattle(instances[0], {
        isTrainer: true,
        isGymLeader: true,
        trainerName: 'Leader Janine',
        trainerTeam: instances,
        onVictory: () => onBattleWon(),
        onBattleEnd: (res?: any) => {
          if (res && res.winner && res.winner !== 'PLAYER') return;
          onBattleWon();
        },
      });
    }
  );
  return true;
}

/**
 * Handles Fuchsia Gym decoy trainers disguised as Janine (Alice, Linda, Cindy, Barry).
 */
export function handleFuchsiaGymDecoy(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  const realSpeaker =
    trainerId === 'fuchsia_gym_alice'
      ? '🌸 LASS ALICE'
      : trainerId === 'fuchsia_gym_linda'
      ? '🌸 LASS LINDA'
      : trainerId === 'fuchsia_gym_cindy'
      ? '🏕️ PICNICKER CINDY'
      : '🏕️ CAMPER BARRY';

  if (ctx.defeatedTrainers.has(trainerId)) {
    const postDialogue =
      trainerNpc.defeatPages ||
      (trainerId === 'fuchsia_gym_alice'
        ? ['Aww, you saw right through my illusion! The real JANINE is much stealthier!']
        : trainerId === 'fuchsia_gym_linda'
        ? ['Well done! Can you find the real JANINE in this maze?']
        : trainerId === 'fuchsia_gym_cindy'
        ? ['My poison power was not enough! The real JANINE is somewhere deeper!']
        : ['Drat! Disguising as a girl ninja is harder than it looks!']);
    ctx.openDialogue(postDialogue, realSpeaker);
    return true;
  }

  ctx.openDialogue(
    trainerNpc.pages || ["Fufufu! I'm JANINE, the GYM LEADER! ...Gotcha! I'm just a decoy!"],
    trainerNpc.speaker || '🏆 LEADER JANINE',
    () => {
      const instances = resolveTrainerInstances(trainerNpc, ctx, [{ speciesId: 'gloom', level: 30 }]);
      if (instances.length === 0) return;

      let awarded = false;
      const onDefeat = () => {
        if (awarded) return;
        awarded = true;
        ctx.defeatedTrainers.add(trainerId);

        const defeatDialogue =
          trainerNpc.defeatPages ||
          (trainerId === 'fuchsia_gym_alice'
            ? ['Aww, you saw right through my illusion! The real JANINE is much stealthier!']
            : trainerId === 'fuchsia_gym_linda'
            ? ['Well done! Can you find the real JANINE in this maze?']
            : trainerId === 'fuchsia_gym_cindy'
            ? ['My poison power was not enough! The real JANINE is somewhere deeper!']
            : ['Drat! Disguising as a girl ninja is harder than it looks!']);

        ctx.openDialogue(defeatDialogue, realSpeaker, () => {
          ctx.saveCurrentGame?.();
        });
      };

      ctx.triggerBattle(instances[0], {
        isTrainer: true,
        trainerName: trainerNpc.trainerName || 'Gym Decoy',
        trainerTeam: instances,
        onVictory: () => onDefeat(),
        onBattleEnd: (res?: any) => {
          if (res && res.winner && res.winner !== 'PLAYER') return;
          onDefeat();
        },
      });
    }
  );
  return true;
}

/**
 * Handles Fuchsia Gym Guide and dynamic Gym Statues.
 */
export function handleFuchsiaGymGuideAndStatues(
  entity: GridEntity | { id: string; x: number; y: number; action?: string },
  ctx: NpcInteractionContext
): boolean {
  if (entity.action === 'FUCHSIA_GYM_GUIDE' || entity.id.includes('guide')) {
    if (ctx.storyFlags.has('janine_defeated') || (ctx.inventory?.badges && ctx.inventory.badges.includes('soul'))) {
      ctx.openDialogue(
        ['That was a great battle, trainer from JOHTO! You saw right through their sneaky ninja disguise!'],
        '🏋️ GYM GUIDE'
      );
      return true;
    }
    ctx.openDialogue(
      [
        'Yo, CHAMP in making! Whoops! Take a good look around you.',
        'The trainers all look like JANINE! Which one is the real JANINE? You will have to see through their illusions!',
      ],
      '🏋️ GYM GUIDE'
    );
    return true;
  }

  // Gym Statue
  const hasBeaten =
    ctx.storyFlags.has('janine_defeated') ||
    (ctx.inventory?.badges && ctx.inventory.badges.includes('soul'));
  const winner = hasBeaten
    ? `WINNING TRAINERS:\nKOGA\n${ctx.playerName || 'Trainer'}`
    : 'WINNING TRAINERS:\nKOGA';

  ctx.openDialogue(
    ['FUCHSIA CITY POKéMON GYM', 'LEADER: JANINE', winner],
    '🏛️ GYM STATUE'
  );
  return true;
}

/**
 * Handles Route 16 secluded speech house recluse interaction and TM02 Headbutt gift.
 */
export function handleRoute16SpeechHouse(
  _recluseNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('got_route16_speech_house_gift')) {
    ctx.openDialogue(
      [
        'Quiet, please... The soothing wind through the trees is music to my ears.',
        'I hope TM02 HEADBUTT serves you well on your journey!',
      ],
      '🧔 RECLUSE'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'Ah, a visitor... It is so peaceful living out here away from the hustle of the city.',
      'I found this technique while meditating in solitude. Here, take it!',
    ],
    '🧔 RECLUSE',
    () => {
      ctx.storyFlags.add('got_route16_speech_house_gift');
      if (!ctx.inventory.tms) ctx.inventory.tms = [];
      if (!ctx.inventory.tms.includes('TM02')) {
        ctx.inventory.tms.push('TM02');
      }
      if (ctx.addOverworldItemToInventory) {
        ctx.addOverworldItemToInventory('tm02');
      }

      BattleAudio.playOverworldSound('KEY_ITEM');

      ctx.openDialogue(
        [
          `${ctx.playerName || 'Trainer'} received TM02 HEADBUTT from the RECLUSE!`,
          'TM02 is HEADBUTT. Shake small trees with it, and wild Pokémon might tumble down!',
        ],
        '🧔 RECLUSE',
        () => {
          ctx.saveCurrentGame?.();
          ctx.showToast?.('📜 Received TM02 HEADBUTT from the Recluse!');
        }
      );
    }
  );
  return true;
}

/**
 * Handles Route 17 Cycling Road Bikers (Riley, Glenn, Charles, Joel).
 */
export function handleBikerTrainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId)) {
    ctx.openDialogue(
      trainerNpc.defeatPages || ['My engine sputtered out... Good race, kid!'],
      trainerNpc.speaker || '🏍️ BIKER'
    );
    return true;
  }

  ctx.openDialogue(
    trainerNpc.pages || ["Let's ride and battle!"],
    trainerNpc.speaker || '🏍️ BIKER',
    () => {
      const instances = resolveTrainerInstances(trainerNpc, ctx, [{ speciesId: 'weezing', level: 34 }]);
      if (instances.length === 0) return;

      let awarded = false;
      const onDefeat = () => {
        if (awarded) return;
        awarded = true;
        ctx.defeatedTrainers.add(trainerId);

        ctx.openDialogue(
          trainerNpc.defeatPages || ['My engine sputtered out... Good race, kid!'],
          trainerNpc.speaker || '🏍️ BIKER',
          () => {
            ctx.saveCurrentGame?.();
          }
        );
      };

      ctx.triggerBattle(instances[0], {
        isTrainer: true,
        trainerName: trainerNpc.trainerName || 'Biker',
        trainerTeam: instances,
        onVictory: () => onDefeat(),
        onBattleEnd: (res?: any) => {
          if (res && res.winner && res.winner !== 'PLAYER') return;
          onDefeat();
        },
      });
    }
  );
  return true;
}

/**
 * Handles Route 18 Bird Keepers (Bob, Boris).
 */
export function handleBirdKeeperTrainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId)) {
    ctx.openDialogue(
      trainerNpc.defeatPages || ['Grounded by superior tactics!'],
      trainerNpc.speaker || '🦅 BIRD KEEPER'
    );
    return true;
  }

  ctx.openDialogue(
    trainerNpc.pages || ['My birds rule the skies!'],
    trainerNpc.speaker || '🦅 BIRD KEEPER',
    () => {
      const instances = resolveTrainerInstances(trainerNpc, ctx, [{ speciesId: 'noctowl', level: 34 }]);
      if (instances.length === 0) return;

      let awarded = false;
      const onDefeat = () => {
        if (awarded) return;
        awarded = true;
        ctx.defeatedTrainers.add(trainerId);

        ctx.openDialogue(
          trainerNpc.defeatPages || ['Grounded by superior tactics!'],
          trainerNpc.speaker || '🦅 BIRD KEEPER',
          () => {
            ctx.saveCurrentGame?.();
          }
        );
      };

      ctx.triggerBattle(instances[0], {
        isTrainer: true,
        trainerName: trainerNpc.trainerName || 'Bird Keeper',
        trainerTeam: instances,
        onVictory: () => onDefeat(),
        onBattleEnd: (res?: any) => {
          if (res && res.winner && res.winner !== 'PLAYER') return;
          onDefeat();
        },
      });
    }
  );
  return true;
}

/**
 * Handles Safari Zone Warden's Granddaughter dialogue.
 */
export function handleWardenGranddaughter(
  _npc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  ctx.openDialogue(
    [
      'My grandpa is the SAFARI ZONE WARDEN, but he is travelling abroad right now.',
      'Because he is away, the SAFARI ZONE is temporarily closed.',
      "He left on a big vacation without telling anyone when he'd return... Grandpa is quite carefree!",
    ],
    '👧 GRANDDAUGHTER'
  );
  return true;
}

/**
 * Returns interaction registrations for Route 16, Cycling Road, Route 18, Fuchsia City, and Fuchsia Gym.
 */
export function getCyclingRoadAndFuchsiaJanineInteractions(): NpcInteractionRegistration[] {
  return [
    {
      npcIds: ['fuchsia_gym_janine'],
      actions: ['JANINE_EVENT'],
      handler: (targetNpc, _map, ctx) => handleJanineInteraction(targetNpc, ctx),
    },
    {
      npcIds: [
        'fuchsia_gym_alice',
        'fuchsia_gym_linda',
        'fuchsia_gym_cindy',
        'fuchsia_gym_barry',
      ],
      actions: ['FUCHSIA_GYM_DECOY'],
      handler: (targetNpc, _map, ctx) => handleFuchsiaGymDecoy(targetNpc, ctx),
    },
    {
      npcIds: ['fuchsia_gym_guide', 'fuchsia_gym_statue'],
      actions: ['FUCHSIA_GYM_GUIDE', 'FUCHSIA_GYM_STATUE'],
      handler: (targetNpc, _map, ctx) => handleFuchsiaGymGuideAndStatues(targetNpc, ctx),
    },
    {
      npcIds: ['route_16_recluse'],
      actions: ['ROUTE_16_RECLUSE'],
      handler: (targetNpc, _map, ctx) => handleRoute16SpeechHouse(targetNpc, ctx),
    },
    {
      npcIds: [
        'route_17_biker_riley',
        'route_17_biker_glenn',
        'route_17_biker_joel',
        'route_17_biker_charles',
      ],
      actions: ['BIKER_TRAINER'],
      handler: (targetNpc, _map, ctx) => handleBikerTrainer(targetNpc, ctx),
    },
    {
      npcIds: ['route_18_bird_keeper_boris', 'route_18_bird_keeper_bob'],
      actions: ['BIRD_KEEPER_TRAINER'],
      handler: (targetNpc, _map, ctx) => handleBirdKeeperTrainer(targetNpc, ctx),
    },
    {
      npcIds: ['safari_zone_granddaughter'],
      actions: ['WARDEN_GRANDDAUGHTER'],
      handler: (targetNpc, _map, ctx) => handleWardenGranddaughter(targetNpc, ctx),
    },
  ];
}
