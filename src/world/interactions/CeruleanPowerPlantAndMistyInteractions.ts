/**
 * @fileoverview CeruleanPowerPlantAndMistyInteractions domain module implementation.
 * Handles Route 5, Cerulean City, Power Plant Crisis, Cerulean Gym Leader Misty,
 * Lavender Radio Tower EXPN Card, and Sleeping Snorlax awakening.
 * @module world/interactions/CeruleanPowerPlantAndMistyInteractions
 * @role Domain Interaction Logic
 * @exports getCeruleanPowerPlantAndMistyInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-350: Power Plant & Gym Grunt | L351-743: Misty, Snorlax & Handlers
 */

import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionContext, NpcInteractionRegistration } from '../../types/worldContext';

function resolveTrainerInstances(npc: GridEntity, ctx: NpcInteractionContext, fallback: any[]): any[] {
  let team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(npc) : [];
  if (!team || team.length === 0) {
    const raw = npc.trainerTeam || (npc as any).team || fallback;
    team = (raw || []).map((m: any) => PokemonFactory.create(m.speciesId, m.level, m.moves));
  }
  return team;
}

/**
 * Handles Power Plant Manager interaction, theft briefing, part return, and power restoration.
 */
export function handlePowerPlantManager(
  _managerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('EVENT_RESTORED_POWER_TO_KANTO')) {
    ctx.openDialogue(
      [
        'MANAGER: The generator is humming beautifully! Electricity is coursing through all of KANTO!',
        'The MAGNET TRAIN between Goldenrod and Saffron is running at full speed thanks to you!',
      ],
      '⚡ MANAGER'
    );
    return true;
  }

  const hasMachinePart =
    ctx.storyFlags.has('EVENT_FOUND_MACHINE_PART') ||
    Boolean(
      ctx.inventory.keyItems?.some(
        (k) =>
          k.toLowerCase() === 'machine-part' ||
          k.toLowerCase() === 'machine_part' ||
          k.toLowerCase() === 'machine part'
      )
    ) ||
    Boolean(ctx.inventory.items?.['machine-part'] || ctx.inventory.items?.['machine_part']);

  if (hasMachinePart) {
    ctx.openDialogue(
      [
        "MANAGER: Ah! That component in your hands! That's the missing MACHINE PART from our generator!",
        'You retrieved it from the CERULEAN GYM pool?! Incredible! Let me install it right away!',
        '...CLANK! WHIRRRR! BZZZZT!',
        "My beloved generator! It's pumping electricity across KANTO again!",
        'Take this TM as a token of my deepest gratitude!',
      ],
      '⚡ MANAGER',
      () => {
        if (ctx.inventory.keyItems) {
          ctx.inventory.keyItems = ctx.inventory.keyItems.filter(
            (k) =>
              k.toLowerCase() !== 'machine-part' &&
              k.toLowerCase() !== 'machine_part' &&
              k.toLowerCase() !== 'machine part'
          );
        }
        if (ctx.inventory.items) {
          delete ctx.inventory.items['machine-part'];
          delete ctx.inventory.items['machine_part'];
        }

        if (!ctx.inventory.tms) ctx.inventory.tms = [];
        if (!ctx.inventory.tms.includes('TM07')) ctx.inventory.tms.push('TM07');
        if (ctx.inventory.items) {
          ctx.inventory.items['TM07'] = (ctx.inventory.items['TM07'] || 0) + 1;
        }

        ctx.storyFlags.add('EVENT_RESTORED_POWER_TO_KANTO');
        ctx.storyFlags.add('power_plant_restored');

        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.showToast('⚡ Restored electrical power across KANTO & received TM07 ZAP CANNON!');
        ctx.saveCurrentGame();
      }
    );
    return true;
  }

  ctx.storyFlags.add('EVENT_LEARNED_ABOUT_MACHINE_PART');

  if (ctx.storyFlags.has('EVENT_DEFEATED_ROUTE24_GRUNT')) {
    ctx.openDialogue(
      [
        'MANAGER: The thief who stole the MACHINE PART dropped it in the CERULEAN GYM pool?',
        'Please! Go search the waters in the center of Cerulean Gym and bring it back!',
      ],
      '⚡ MANAGER'
    );
  } else {
    ctx.openDialogue(
      [
        'MANAGER: Someone stole an essential MACHINE PART from our generator!',
        'Without it, electricity cannot flow anywhere in KANTO!',
        'The MAGNET TRAIN is stalled and radio towers have no transmission power!',
      ],
      '⚡ MANAGER'
    );
  }
  return true;
}

/**
 * Handles Cerulean Gym pool interaction for hidden Machine Part.
 */
export function handleCeruleanGymMachinePart(
  ctx: NpcInteractionContext,
  x: number,
  y: number
): boolean {
  const isTargetTile =
    (x === 4 && y === 8) ||
    (x === 3 && y === 8) ||
    (x === 4 && y === 7) ||
    (x === 4 && y === 9);

  if (!isTargetTile) return false;

  if (
    ctx.storyFlags.has('EVENT_FOUND_MACHINE_PART') ||
    ctx.storyFlags.has('EVENT_RESTORED_POWER_TO_KANTO') ||
    Boolean(
      ctx.inventory.keyItems?.some(
        (k) =>
          k.toLowerCase() === 'machine-part' ||
          k.toLowerCase() === 'machine_part' ||
          k.toLowerCase() === 'machine part'
      )
    )
  ) {
    ctx.openDialogue(['The gym pool water is crystal clear and calm.'], '💧 CERULEAN GYM POOL');
    return true;
  }

  if (!ctx.storyFlags.has('EVENT_DEFEATED_ROUTE24_GRUNT')) {
    ctx.openDialogue(['The gym pool water is cool and deep.'], '💧 CERULEAN GYM POOL');
    return true;
  }

  ctx.openDialogue(
    [
      "What's this submerged at the bottom of the gym pool...?",
      '⚙️ Retrieved the missing MACHINE PART from the gym pool!',
    ],
    '💧 CERULEAN GYM POOL',
    () => {
      if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
      if (!ctx.inventory.keyItems.includes('machine-part')) {
        ctx.inventory.keyItems.push('machine-part');
      }
      if (!ctx.inventory.items) ctx.inventory.items = {};
      ctx.inventory.items['machine-part'] = 1;

      ctx.storyFlags.add('EVENT_FOUND_MACHINE_PART');
      ctx.storyFlags.add('got_machine_part');

      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast('⚙️ Retrieved the missing MACHINE PART from the gym pool!');
      ctx.saveCurrentGame();
    }
  );
  return true;
}

/**
 * Handles Cerulean Gym shady Rocket Grunt bumping into player and fleeing.
 */
export function handleCeruleanGymGrunt(
  gruntNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  ctx.openDialogue(
    [
      'Oops! I so sorry! You not hurt, okay?',
      'I very busy! No time for talking with you! Not good for me if seen by somebody!',
      'Oh no! You seen me already! I make big mistake!',
      'Hey, you! Forget you see me, okay? You see, hear, know nothing!',
      'Bye, kid! Bye-bye a go-go!',
    ],
    '🚀 ROCKET GRUNT',
    () => {
      ctx.storyFlags.add('EVENT_MET_ROCKET_GRUNT_AT_CERULEAN_GYM');
      if (ctx.npcsByMap.cerulean_gym) {
        ctx.npcsByMap.cerulean_gym = ctx.npcsByMap.cerulean_gym.filter((n) => n.id !== gruntNpc.id);
      }
      const currentMap = ctx.mapManager.getCurrentMap();
      if (currentMap) {
        ctx.renderMap?.(currentMap);
      }
      BattleAudio.playOverworldSound('FANFARE');
      ctx.showToast('🚀 Shady Rocket Grunt fled Cerulean Gym north towards Route 24!');
      ctx.saveCurrentGame();
    }
  );
  return true;
}

/**
 * Handles Route 24 Nugget Bridge Rocket Grunt ambush and confession.
 */
export function handleRoute24RocketGrunt(
  gruntNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('EVENT_DEFEATED_ROUTE24_GRUNT')) {
    ctx.openDialogue(
      [
        'OK. Tell you mine secret will I. MACHINE PART steal by me, hide it I did in GYM of the CERULEAN.',
        'Inside water put it I did. Look in water center of GYM at!',
      ],
      '🚀 ROCKET GRUNT'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'Hey, kid! Me am a TEAM ROCKET member kind of guy!',
      'Come from another country, a trainer number one, me!',
      'Think I did, if stop the energy, be big panic for here people!',
      'Secret it is my mission, so tell you I not!',
      'But! If win you do versus me, a man I be and mine secret to you I tell.',
      'Hey, kid! Battle begin we do!',
    ],
    '🚀 ROCKET GRUNT',
    () => {
      const instances = resolveTrainerInstances(gruntNpc, ctx, [
        { speciesId: 'golbat', level: 30, moves: ['wingattack', 'confuseray', 'bite', 'leechlife'] },
      ]);
      if (instances.length === 0) return;
      ctx.triggerBattle(instances[0], {
        isTrainer: true,
        trainerName: 'Rocket Grunt',
        trainerTeam: instances,
        onBattleEnd: (res?: any) => {
          if (res && res.winner && res.winner !== 'PLAYER') return; ctx.storyFlags.add('EVENT_DEFEATED_ROUTE24_GRUNT');
          ctx.storyFlags.add('route_24_grunt_defeated');
          ctx.defeatedTrainers.add(gruntNpc.trainerId || gruntNpc.id);

          ctx.openDialogue(
            [
              "Ayieeeh! No, no, no, believe it I can't! Strong very much be you!",
              'OK. Tell you mine secret will I. MACHINE PART steal by me, hide it I did in GYM of the CERULEAN.',
              'Inside water put it I did. Look for in water center of GYM at.',
              '...You say what? TEAM ROCKET bye-bye a go-go? Broken it is says you? Oh, no! Should I do what now on from, me?',
            ],
            '🚀 ROCKET GRUNT',
            () => {
              if (ctx.npcsByMap.route_24) {
                ctx.npcsByMap.route_24 = ctx.npcsByMap.route_24.filter((n) => n.id !== gruntNpc.id);
              }
              const mapNow = ctx.mapManager.getCurrentMap();
              if (mapNow) {
                ctx.renderMap?.(mapNow);
              }
              BattleAudio.playOverworldSound('FANFARE');
              ctx.showToast('💡 Learned the hidden location of the MACHINE PART inside Cerulean Gym!');
              ctx.saveCurrentGame();
            }
          );
        },
      });
    }
  );
  return true;
}

/**
 * Handles Route 25 Cerulean Cape Misty date confrontation.
 */
export function handleCeruleanCapeMistyDate(
  _mistyNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('EVENT_MET_MISTY_AT_CERULEAN_CAPE')) {
    return false;
  }

  ctx.openDialogue(
    [
      'Aaaah! Why did you have to show up and ruin my date?!',
      'Do you know what they call people like you? PESTS! You heard me right, pest!',
      '...Wait! Those BADGES you have... Are they JOHTO GYM BADGES?!',
      'If you have eight badges, you must be pretty skilled...',
      "OK, then! Come to CERULEAN GYM! I'll be happy to take you on!",
      "I'm MISTY, the GYM LEADER in CERULEAN!",
    ],
    '🏆 MISTY',
    () => {
      ctx.storyFlags.add('EVENT_MET_MISTY_AT_CERULEAN_CAPE');
      ctx.storyFlags.add('misty_returned_to_gym');

      if (ctx.npcsByMap.route_25) {
        ctx.npcsByMap.route_25 = ctx.npcsByMap.route_25.filter(
          (n) => n.id !== 'route_25_misty' && n.id !== 'route_25_misty_date'
        );
      }
      const mapNow = ctx.mapManager.getCurrentMap();
      if (mapNow) {
        ctx.renderMap?.(mapNow);
      }
      BattleAudio.playOverworldSound('FANFARE');
      ctx.showToast('💧 Gym Leader Misty returned to Cerulean Gym!');
      ctx.saveCurrentGame();
    }
  );
  return true;
}

/**
 * Handles Cerulean Gym Leader Misty boss battle and victory rewards.
 */
export function handleMistyInteraction(
  mistyNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('misty_defeated') || ctx.storyFlags.has('EVENT_BEAT_MISTY')) {
    ctx.openDialogue(
      [
        'MISTY: Are there many strong trainers in JOHTO? Like you, I mean.',
        'I am going to travel one day, so I can battle more skilled trainers!',
      ],
      '🏆 LEADER MISTY'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'MISTY: I was expecting you, you pest!',
      "You may have a lot of JOHTO GYM BADGES, but you'd better not take me too lightly.",
      'My water-type POKéMON are tough! Let me show you!',
    ],
    '🏆 LEADER MISTY',
    () => {
      const instances = resolveTrainerInstances(mistyNpc, ctx, [
        { speciesId: 'golduck', level: 42, moves: ['surf', 'disable', 'psychup', 'psychic'] },
        { speciesId: 'quagsire', level: 42, moves: ['surf', 'amnesia', 'earthquake', 'raindance'] },
        { speciesId: 'lapras', level: 44, moves: ['surf', 'blizzard', 'bodyslam', 'raindance'] },
        { speciesId: 'starmie', level: 47, moves: ['surf', 'recover', 'confuseray', 'icebeam'] },
      ]);
      if (instances.length === 0) return;
      ctx.triggerBattle(instances[0], {
        isTrainer: true,
        isGymLeader: true,
        trainerName: 'Leader Misty',
        trainerTeam: instances,
        onBattleEnd: (res?: any) => {
          if (res && res.winner && res.winner !== 'PLAYER') return; if (!ctx.inventory.badges) ctx.inventory.badges = [];
          if (!ctx.inventory.badges.includes('cascade')) {
            ctx.inventory.badges.push('cascade');
          }

          ctx.storyFlags.add('misty_defeated');
          ctx.storyFlags.add('EVENT_BEAT_MISTY');
          ctx.defeatedTrainers.add('misty');

          ctx.openDialogue(
            [
              'MISTY: You really are good... I will admit that you are skilled.',
              'Here you go. It is the CASCADEBADGE!',
              `${ctx.playerName || 'Gold'} received the CASCADEBADGE!`,
            ],
            '🏆 LEADER MISTY',
            () => {
              BattleAudio.playOverworldSound('FANFARE');
              ctx.showToast('💧 Defeated Gym Leader Misty & received the CASCADEBADGE!');
              ctx.saveCurrentGame();
            }
          );
        },
      });
    }
  );
  return true;
}

/**
 * Handles Cerulean Gym Swimmer trainers (Diana, Briana, Parker).
 */
export function handleCeruleanGymTrainer(
  trainerNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  const trainerId = trainerNpc.trainerId || trainerNpc.id;
  if (ctx.defeatedTrainers.has(trainerId)) {
    ctx.openDialogue(
      trainerNpc.pages || ['That was a great battle! MISTY is tough, be careful!'],
      trainerNpc.speaker || 'TRAINER'
    );
    return true;
  }

  ctx.openDialogue(
    trainerNpc.challengePages || ["Let's battle in the water!"],
    trainerNpc.speaker || 'TRAINER',
    () => {
      const instances = resolveTrainerInstances(trainerNpc, ctx, [
        { speciesId: 'golduck', level: 37, moves: ['surf', 'disable', 'confusion', 'screech'] },
      ]);
      if (instances.length === 0) return;
      ctx.triggerBattle(instances[0], {
        isTrainer: true,
        trainerName: trainerNpc.trainerName || trainerNpc.speaker,
        trainerTeam: instances,
        onBattleEnd: (res?: any) => {
          if (res && res.winner && res.winner !== 'PLAYER') return; ctx.defeatedTrainers.add(trainerId);
          BattleAudio.playOverworldSound('FANFARE');
          ctx.saveCurrentGame();
        },
      });
    }
  );
  return true;
}

/**
 * Handles Cerulean Gym statues and Gym Guide.
 */
export function handleCeruleanGymGuideAndStatues(
  target: GridEntity | { id: string; x: number; y: number; action?: string },
  ctx: NpcInteractionContext
): boolean {
  if (target.action === 'CERULEAN_GYM_STATUE' || target.id === 'cerulean_gym_statue') {
    if (!ctx.storyFlags.has('EVENT_MET_MISTY_AT_CERULEAN_CAPE')) {
      ctx.openDialogue(
        [
          "CERULEAN CITY POKéMON GYM\nLEADER: MISTY\n\nSorry, I'll be out for a while.\n- MISTY, GYM LEADER",
          "Since MISTY's out, we'll be away too.\n- GYM TRAINERS",
        ],
        '🏛️ GYM STATUE'
      );
      return true;
    }

    if (ctx.storyFlags.has('misty_defeated') || ctx.storyFlags.has('EVENT_BEAT_MISTY')) {
      ctx.openDialogue(
        [
          `CERULEAN CITY POKéMON GYM\nLEADER: MISTY\n\nWINNING TRAINERS:\nRED\n${ctx.playerName || 'Gold'}`,
        ],
        '🏛️ GYM STATUE'
      );
    } else {
      ctx.openDialogue(
        ['CERULEAN CITY POKéMON GYM\nLEADER: MISTY\n\nWINNING TRAINERS:\nRED'],
        '🏛️ GYM STATUE'
      );
    }
    return true;
  }

  // Gym Guide
  if (!ctx.storyFlags.has('EVENT_MET_MISTY_AT_CERULEAN_CAPE')) {
    ctx.openDialogue(
      ['Yo! CHAMP in making! Since MISTY was away, I went out for some fun too. He-he-he.'],
      '🏋️ GYM GUIDE'
    );
  } else if (ctx.storyFlags.has('misty_defeated') || ctx.storyFlags.has('EVENT_BEAT_MISTY')) {
    ctx.openDialogue(
      ['Hoo, you showed me how tough you are! That was one heck of a great battle!'],
      '🏋️ GYM GUIDE'
    );
  } else {
    ctx.openDialogue(
      [
        'Yo! CHAMP in making! MISTY is a specialist who uses WATER-type POKéMON!',
        'ELECTRIC and GRASS moves will give you a decisive edge against her team!',
      ],
      '🏋️ GYM GUIDE'
    );
  }
  return true;
}

/**
 * Handles Lavender Radio Tower Director awarding the EXPN Card.
 */
export function handleLavenderRadioTowerDirector(
  _directorNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (!ctx.storyFlags.has('EVENT_RESTORED_POWER_TO_KANTO')) {
    ctx.openDialogue(
      [
        'DIRECTOR: Oh, no, no, no! Our broadcast antennas cannot transmit without power from the POWER PLANT!',
        'If the generator is not fixed soon, all of KANTO will remain without radio programs!',
      ],
      '📻 DIRECTOR'
    );
    return true;
  }

  const hasExpnCard =
    ctx.storyFlags.has('has_expn_card') ||
    ctx.storyFlags.has('EVENT_GOT_EXPN_CARD') ||
    Boolean(
      ctx.inventory.keyItems?.some(
        (k) =>
          k.toLowerCase() === 'expn-card' ||
          k.toLowerCase() === 'expn_card' ||
          k.toLowerCase() === 'expn card'
      )
    ) ||
    Boolean(ctx.inventory.items?.['expn-card']);

  if (!hasExpnCard) {
    ctx.openDialogue(
      [
        'DIRECTOR: Ah! The power has finally returned! Electricity is surging through our transmission antennas!',
        'You played a major role in restoring the Power Plant? That is magnificent!',
        'As the Director of the KANTO RADIO TOWER, please accept this EXPN CARD!',
        `${ctx.playerName || 'Gold'} received the EXPN CARD!`,
        'With this EXPN CARD installed into your POKéGEAR, you can tune into all KANTO radio channels, including the # FLUTE channel!',
      ],
      '📻 DIRECTOR',
      () => {
        if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
        if (!ctx.inventory.keyItems.includes('expn-card')) {
          ctx.inventory.keyItems.push('expn-card');
        }
        if (!ctx.inventory.items) ctx.inventory.items = {};
        ctx.inventory.items['expn-card'] = 1;

        ctx.storyFlags.add('has_expn_card');
        ctx.storyFlags.add('EVENT_GOT_EXPN_CARD');

        BattleAudio.playOverworldSound('KEY_ITEM');
        ctx.showToast('📻 Received EXPN CARD! Kanto radio frequencies unlocked!');
        ctx.saveCurrentGame();
      }
    );
    return true;
  }

  ctx.openDialogue(
    [
      'DIRECTOR: The radio broadcasts are reaching every corner of KANTO!',
      'Thank you for helping restore power to our station!',
    ],
    '📻 DIRECTOR'
  );
  return true;
}

/**
 * Handles Sleeping Snorlax awakening via EXPN Card Poké Flute melody.
 */
export function handleSleepingSnorlaxAwakening(
  snorlaxNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('snorlax_cleared') || ctx.storyFlags.has('EVENT_FOUGHT_SNORLAX')) {
    return false;
  }

  const hasExpnCard =
    ctx.storyFlags.has('has_expn_card') ||
    ctx.storyFlags.has('EVENT_GOT_EXPN_CARD') ||
    Boolean(
      ctx.inventory.keyItems?.some(
        (k) =>
          k.toLowerCase() === 'expn-card' ||
          k.toLowerCase() === 'expn_card' ||
          k.toLowerCase() === 'expn card'
      )
    ) ||
    Boolean(ctx.inventory.items?.['expn-card']);

  if (!hasExpnCard) {
    ctx.openDialogue(
      [
        'SNORLAX is snoring peacefully in front of the cave entrance...',
        'It is fast asleep and completely unresponsive! A POKéGEAR broadcast might wake it up.',
      ],
      '💤 SNORLAX'
    );
    return true;
  }

  ctx.openDialogue(
    [
      "The POKéGEAR tuned into Kanto's # FLUTE broadcast channel...",
      'A soothing melody gently resonates through the air!',
      'SNORLAX woke up with a mighty yawn! It attacked in a grumpy rage!',
    ],
    '💤 SNORLAX',
    () => {
      BattleAudio.playCry('snorlax');
      const snorlaxPkmn = PokemonFactory.create('snorlax', 50, [
        'rest',
        'snore',
        'rollout',
        'bodyslam',
      ]);
      snorlaxPkmn.heldItem = 'leftovers';

      ctx.triggerBattle(snorlaxPkmn, {
        onBattleEnd: (res?: any) => {
          if (res?.fled || (res?.winner && res.winner !== 'PLAYER' && !res.caught)) return;
          ctx.storyFlags.add('snorlax_cleared');
          ctx.storyFlags.add('EVENT_FOUGHT_SNORLAX');

          if (ctx.npcsByMap.vermilion_city) {
            ctx.npcsByMap.vermilion_city = ctx.npcsByMap.vermilion_city.filter(
              (n) => n.id !== snorlaxNpc.id && n.id !== 'vermilion_city_snorlax'
            );
          }
          if (ctx.npcsByMap.route_11) {
            ctx.npcsByMap.route_11 = ctx.npcsByMap.route_11.filter(
              (n) => n.id !== snorlaxNpc.id && n.id !== 'vermilion_city_snorlax'
            );
          }

          const currentMap = ctx.mapManager.getCurrentMap();
          if (currentMap) {
            ctx.renderMap?.(currentMap);
            ctx.syncMapOverworldItems?.(currentMap);
          }

          ctx.showToast(
            "💤 Snorlax woke up and stomped away! The path to Diglett's Cave is clear!"
          );
          ctx.saveCurrentGame();
        },
      });
    }
  );
  return true;
}

/**
 * Handles Route 5 Cleanse Tag House Grandma.
 */
export function handleRoute5CleanseTagGrandma(
  _grandmaNpc: GridEntity,
  ctx: NpcInteractionContext
): boolean {
  if (ctx.storyFlags.has('got_cleanse_tag') || ctx.storyFlags.has('EVENT_GOT_CLEANSE_TAG')) {
    ctx.openDialogue(
      [
        'GRANDMA: Have you equipped the CLEANSE TAG to your lead POKéMON?',
        'It will ward off wild POKéMON encounters when held!',
      ],
      '👵 GRANDMA'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'GRANDMA: Many frightening spirits and fierce wild POKéMON roam the roads...',
      'Here, take this CLEANSE TAG. It will keep unwanted wild encounters away.',
      `${ctx.playerName || 'Gold'} received the CLEANSE TAG!`,
    ],
    '👵 GRANDMA',
    () => {
      if (!ctx.inventory.items) ctx.inventory.items = {};
      ctx.inventory.items['cleanse-tag'] = (ctx.inventory.items['cleanse-tag'] || 0) + 1;
      ctx.storyFlags.add('got_cleanse_tag');
      ctx.storyFlags.add('EVENT_GOT_CLEANSE_TAG');

      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast('🧿 Received CLEANSE TAG from Grandma!');
      ctx.saveCurrentGame();
    }
  );
  return true;
}

/**
 * Returns interaction configurations for Route 5, Cerulean City, Power Plant,
 * Route 24, Route 25, Lavender Radio Tower 1F, and Sleeping Snorlax.
 */
export function getCeruleanPowerPlantAndMistyInteractions(): NpcInteractionRegistration[] {
  return [
    {
      npcIds: ['power_plant_manager'],
      actions: ['POWER_PLANT_MANAGER'],
      handler: (targetNpc, _map, ctx) => handlePowerPlantManager(targetNpc, ctx),
    },
    {
      npcIds: ['cerulean_gym_rocket_grunt'],
      actions: ['CERULEAN_GYM_ROCKET_GRUNT'],
      handler: (targetNpc, _map, ctx) => handleCeruleanGymGrunt(targetNpc, ctx),
    },
    {
      npcIds: ['route_24_rocket_grunt'],
      actions: ['ROUTE_24_ROCKET_GRUNT'],
      handler: (targetNpc, _map, ctx) => handleRoute24RocketGrunt(targetNpc, ctx),
    },
    {
      npcIds: ['route_25_misty'],
      actions: ['ROUTE_25_MISTY_DATE'],
      handler: (targetNpc, _map, ctx) => handleCeruleanCapeMistyDate(targetNpc, ctx),
    },
    {
      npcIds: ['cerulean_gym_misty'],
      actions: ['MISTY_EVENT'],
      handler: (targetNpc, _map, ctx) => handleMistyInteraction(targetNpc, ctx),
    },
    {
      npcIds: [
        'cerulean_gym_swimmer_diana',
        'cerulean_gym_swimmer_briana',
        'cerulean_gym_swimmer_parker',
      ],
      actions: ['CERULEAN_GYM_TRAINER', 'ROUTE_25_TRAINER'],
      handler: (targetNpc, _map, ctx) => handleCeruleanGymTrainer(targetNpc, ctx),
    },
    {
      npcIds: ['cerulean_gym_guide'],
      actions: ['CERULEAN_GYM_GUIDE'],
      handler: (targetNpc, _map, ctx) => handleCeruleanGymGuideAndStatues(targetNpc, ctx),
    },
    {
      npcIds: ['lavender_radio_tower_director'],
      actions: ['LAVENDER_RADIO_TOWER_DIRECTOR'],
      handler: (targetNpc, _map, ctx) => handleLavenderRadioTowerDirector(targetNpc, ctx),
    },
    {
      npcIds: ['vermilion_city_snorlax'],
      actions: ['SNORLAX_OBSTACLE'],
      handler: (targetNpc, _map, ctx) => handleSleepingSnorlaxAwakening(targetNpc, ctx),
    },
    {
      npcIds: ['route_5_cleanse_tag_grandma'],
      actions: ['ROUTE_5_CLEANSE_TAG_GRANDMA'],
      handler: (targetNpc, _map, ctx) => handleRoute5CleanseTagGrandma(targetNpc, ctx),
    },
  ];
}
