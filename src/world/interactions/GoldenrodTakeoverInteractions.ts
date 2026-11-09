/**
 * @fileoverview GoldenrodTakeoverInteractions domain module implementation.
 * @module world/interactions/GoldenrodTakeoverInteractions
 * @role Goldenrod Takeover Interactions Component
 * @exports createGoldenrodTakeoverInteractions
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-140: Basement & Warehouse Handlers | L141-280: Radio Tower Executives & Rewards
 */

import type {
  NpcInteractionContext,
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

/**
 * 1. Underground Basement Door
 */
export const handleBasementDoor: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const hasKey =
    ctx.storyFlags.has('has_basement_key') ||
    ctx.storyFlags.has('EVENT_USED_BASEMENT_KEY') ||
    Boolean(ctx.inventory.keyItems?.some((k) => k.toLowerCase().includes('basement'))) ||
    Boolean(ctx.inventory.items?.['basement-key']);

  if (!hasKey) {
    ctx.openDialogue(
      ['The heavy steel door is securely locked. A slot for the BASEMENT KEY is visible.'],
      targetNpc.speaker || '🚪 BASEMENT DOOR'
    );
    return true;
  }

  ctx.storyFlags.add('EVENT_USED_BASEMENT_KEY');
  BattleAudio.playOverworldSound('KEY_ITEM');
  ctx.openDialogue(
    [`${ctx.playerName} inserted the BASEMENT KEY!`, 'The lock clicked and the steel door opened!'],
    targetNpc.speaker || '🚪 BASEMENT DOOR',
    () => {
      ctx.saveCurrentGame();
    }
  );
  return true;
};

/**
 * 2. Underground Shutter Switches
 */
export const handleShutterSwitches: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const switchId = targetNpc.id || `switch_${targetNpc.x}_${targetNpc.y}`;
  let flagName = 'SWITCH_1_ON';
  let label = 'SWITCH 1';

  if (targetNpc.x === 10 || switchId.includes('2')) {
    flagName = 'SWITCH_2_ON';
    label = 'SWITCH 2';
  } else if (targetNpc.x === 2 || switchId.includes('3')) {
    flagName = 'SWITCH_3_ON';
    label = 'SWITCH 3';
  } else if (targetNpc.x === 20 || switchId.includes('emergency')) {
    flagName = 'SWITCH_EMERGENCY_ON';
    label = 'EMERGENCY SWITCH';
  }

  const toggleSwitch = () => {
    const wasOn = ctx.storyFlags.has(flagName);
    if (wasOn) {
      ctx.storyFlags.delete(flagName);
    } else {
      ctx.storyFlags.add(flagName);
    }

    BattleAudio.playMenuSound('CONFIRM');
    const stateText = wasOn ? 'Turned it OFF.' : 'Turned it ON.';
    ctx.openDialogue(
      [`It's labeled ${label}. Click! ${stateText}`],
      targetNpc.speaker || '🔌 WALL SWITCH'
    );
  };

  if (ctx.openChoiceDialogue) {
    const isCurrentlyOn = ctx.storyFlags.has(flagName);
    ctx.openChoiceDialogue(
      [`It's labeled ${label} (currently ${isCurrentlyOn ? 'ON' : 'OFF'}). Press it?`],
      targetNpc.speaker || '🔌 WALL SWITCH',
      (choice) => {
        if (choice === 'YES') {
          toggleSwitch();
        } else {
          ctx.openDialogue(['Left the switch alone.'], targetNpc.speaker || '🔌 WALL SWITCH');
        }
      }
    );
    return true;
  }

  toggleSwitch();
  return true;
};

/**
 * 3. Warehouse Real Director Rescue
 */
export const handleRealDirectorRescue: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('card_key_obtained')) {
    ctx.openDialogue(
      ['DIRECTOR: Please use that CARD KEY to unlock the 3F security shutters and save the RADIO TOWER!'],
      targetNpc.speaker
    );
    return true;
  }

  ctx.storyFlags.add('warehouse_unlocked');
  ctx.storyFlags.add('card_key_obtained');
  ctx.storyFlags.add('has_card_key');
  if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
  if (!ctx.inventory.keyItems.includes('CARD KEY')) ctx.inventory.keyItems.push('CARD KEY');
  if (ctx.addOverworldItemToInventory) ctx.addOverworldItemToInventory('card-key');
  ctx.missionManager?.checkStoryFlags(ctx.storyFlags);
  ctx.audioManager?.playSfx?.('sfx_badge_get');
  BattleAudio.playOverworldSound('KEY_ITEM');

  ctx.openDialogue(
    [
      'DIRECTOR: You came all the way down here to rescue me?! Thank you, thank you!',
      'TEAM ROCKET locked me away and hijacked the observation deck transmitter on 5F to summon GIOVANNI!',
      'Take this CARD KEY! It will unlock the 3F security shutters in the RADIO TOWER so you can stop them!',
      `${ctx.playerName} received the CARD KEY!`,
    ],
    targetNpc.speaker,
    () => {
      ctx.saveCurrentGame();
      ctx.showToast('💳 Rescued the Director & received CARD KEY!');
    }
  );
  return true;
};

/**
 * 4. Radio Tower 3F Card Key Shutter
 */
export const handleCardKeyShutter: NpcInteractionHandler = (targetNpc, map, ctx) => {
  const hasCardKey =
    ctx.storyFlags.has('card_key_obtained') ||
    ctx.storyFlags.has('has_card_key') ||
    Boolean(ctx.inventory.keyItems?.some((k) => k.toLowerCase().includes('card')));

  if (ctx.storyFlags.has('EVENT_USED_CARD_KEY')) {
    ctx.openDialogue(['The 3F security shutter is fully open.'], targetNpc.speaker || '💳 CARD KEY SHUTTER');
    return true;
  }

  if (!hasCardKey) {
    ctx.openDialogue(
      ['A heavy security shutter blocks the stairwell. A CARD KEY slot is installed next to the door.'],
      targetNpc.speaker || '💳 CARD KEY SHUTTER'
    );
    return true;
  }

  ctx.storyFlags.add('EVENT_USED_CARD_KEY');
  if (map && map.collisionGrid && map.id === 'radio_tower_3f') {
    map.collisionGrid[7 * map.width + 0] = 0;
  }
  BattleAudio.playOverworldSound('KEY_ITEM');
  ctx.openDialogue(
    [`${ctx.playerName} inserted the CARD KEY!`, 'The 3F security shutter retracted into the ceiling!', 'Two TEAM ROCKET EXECUTIVES, ARIANA and ARCHER, step out of the shadows!'],
    targetNpc.speaker || '💳 CARD KEY SHUTTER',
    () => {
      ctx.saveCurrentGame();
      ctx.showToast('💳 Used CARD KEY! 3F security shutter opened!');
    }
  );
  return true;
};

/**
 * 5. Executive Proton (4F)
 */
export const handleExecutiveProton: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('radio_tower_proton_defeated')) {
    ctx.openDialogue(['PROTON: Tch! We will never surrender!'], targetNpc.speaker);
    return true;
  }

  const challenge =
    targetNpc.challengePages && targetNpc.challengePages.length > 0
      ? targetNpc.challengePages
      : ['PROTON: We are reclaiming JOHTO for GIOVANNI! Out of my way!'];

  ctx.openDialogue(challenge, targetNpc.speaker, () => {
    const team = ctx.buildTrainerTeamInstances
      ? ctx.buildTrainerTeamInstances(targetNpc)
      : [PokemonFactory.create('weezing', 33, ['sludge', 'smokescreen', 'tackle', 'toxic'])];

    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: targetNpc.trainerName || 'Executive Proton',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add('proton_radio');
        ctx.storyFlags.add('radio_tower_proton_defeated');
        ctx.storyFlags.add('proton_defeated');
        ctx.openDialogue(
          [
            'PROTON: Grr... You got lucky here!',
            'But EXECUTIVES ARIANA and ARCHER on 5F are on a completely different level!',
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('⚡ Defeated Executive Proton on 4F!');
          }
        );
      },
    });
  });
  return true;
};

/**
 * 0. Disguise infiltration (Topic 7.1): photo-studio operative, 1F guard, Rival unmasking
 */
export const handleDisguiseOperative: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('rocket_guard_bluffed')) {
    ctx.openDialogue(['Good luck up there. Try not to run into that red-haired kid!'], targetNpc.speaker);
    return true;
  }
  if (ctx.storyFlags.has('rocket_disguise_worn')) {
    ctx.openDialogue(['The uniform suits you. Now bluff the GUARD in the RADIO TOWER lobby!'], targetNpc.speaker);
    return true;
  }
  ctx.openDialogue(
    [
      'TEAM ROCKET has seized the RADIO TOWER! The lobby guard only lets their own people in.',
      'Hold still... Say cheese!',
      `${ctx.playerName} put on a TEAM ROCKET uniform!`,
    ],
    targetNpc.speaker,
    () => {
      ctx.storyFlags.add('rocket_disguise_worn');
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast('🕶️ Disguised as a TEAM ROCKET grunt!');
      ctx.saveCurrentGame();
    }
  );
  return true;
};

export const handleRadioTowerGuard: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('rocket_guard_bluffed')) {
    ctx.openDialogue(['ROCKET GUARD: Move along, recruit.'], targetNpc.speaker);
    return true;
  }
  if (!ctx.storyFlags.has('rocket_disguise_worn')) {
    ctx.openDialogue(
      [
        'ROCKET GUARD: Halt! The RADIO TOWER belongs to TEAM ROCKET now. Scram!',
        'Only TEAM ROCKET members get past me. (Maybe the UNDERGROUND has a way to look the part...)',
      ],
      targetNpc.speaker
    );
    return true;
  }
  ctx.openDialogue(
    ['ROCKET GUARD: Hm? A new recruit? Nobody told me about you.', 'Well, the uniform checks out. Go on up!'],
    targetNpc.speaker,
    () => {
      ctx.storyFlags.add('rocket_guard_bluffed');
      ctx.showToast('🕶️ The disguise worked! Head up the stairs.');
      ctx.saveCurrentGame();
    }
  );
  return true;
};

export const handleRivalUnmask: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  const rName = (ctx.getRivalName?.() || 'SILVER').toUpperCase();
  const speaker = `❓ RIVAL ${rName}`;
  if (ctx.storyFlags.has('rival_radio_defeated')) {
    ctx.openDialogue([`${rName}: …Tch. Go on, then.`], speaker);
    return true;
  }
  ctx.openDialogue(
    [
      `${rName}: …Hmph. A TEAM ROCKET uniform? Pathetic.`,
      `${rName} rips the disguise right off ${ctx.playerName}! Your cover is blown!`,
      `${rName}: Did you really think a cheap costume could fool me? Get ready!`,
    ],
    speaker,
    () => {
      ctx.storyFlags.delete('rocket_disguise_worn');
      ctx.storyFlags.add('rocket_disguise_exposed');
      const team = ctx.buildTrainerTeamInstances
        ? ctx.buildTrainerTeamInstances(targetNpc)
        : [
            PokemonFactory.create('haunter', 28, ['nightshade', 'curse', 'spite', 'hypnosis']),
            PokemonFactory.create('magneton', 28, ['thundershock', 'supersonic', 'sonicboom', 'thunderwave']),
            PokemonFactory.create('golbat', 28, ['bite', 'confuseray', 'wingattack', 'supersonic']),
            PokemonFactory.create('sneasel', 30, ['scratch', 'faintattack', 'screech', 'furycutter']),
          ];
      ctx.triggerBattle(team[0], {
        isTrainer: true,
        trainerName: `Rival ${rName}`,
        trainerTeam: team,
        onVictory: () => {
          ctx.defeatedTrainers.add('rival_radio_2f');
          ctx.storyFlags.add('rival_radio_defeated');
          ctx.openDialogue(
            [`${rName}: …Tch. Don't think this makes us even. TEAM ROCKET's bosses are higher up. Go bother them instead.`],
            speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast(`⚔️ Defeated ${rName} on 2F!`);
            }
          );
        },
      });
    }
  );
  return true;
};

/**
 * 6. Executive Ariana (3F, behind the Card Key shutter)
 */
export const handleExecutiveAriana: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('ariana_defeated')) {
    ctx.openDialogue(['ARIANA: You won this battle, but ARCHER will crush you!'], targetNpc.speaker);
    return true;
  }

  const challenge =
    targetNpc.challengePages && targetNpc.challengePages.length > 0
      ? targetNpc.challengePages
      : ['ARIANA: I will show you why I am an EXECUTIVE of TEAM ROCKET!'];

  ctx.openDialogue(challenge, targetNpc.speaker, () => {
    const team = ctx.buildTrainerTeamInstances
      ? ctx.buildTrainerTeamInstances(targetNpc)
      : [
          PokemonFactory.create('arbok', 32, ['poisonsting', 'bite', 'glare', 'screech']),
          PokemonFactory.create('vileplume', 32, ['absorb', 'sweetscent', 'acid', 'stunspore']),
          PokemonFactory.create('murkrow', 32, ['peck', 'pursuit', 'haze', 'nightshade']),
        ];

    ctx.triggerBattle(team[0], {
      isTrainer: true,
      trainerName: targetNpc.trainerName || 'Executive Ariana',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add('ariana_radio');
        ctx.storyFlags.add('ariana_defeated');
        ctx.openDialogue(
          [
            'ARIANA: How can a child be so powerful?!',
            'ARCHER is right behind me... Prepare yourself!',
          ],
          targetNpc.speaker,
          () => {
            ctx.saveCurrentGame();
            ctx.showToast('⚡ Defeated Executive Ariana on 3F!');
          }
        );
      },
    });
  });
  return true;
};

/**
 * 7. Executive Archer Boss (3F, behind the Card Key shutter)
 */
export const handleExecutiveArcherBoss: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('radio_tower_liberated')) {
    ctx.openDialogue(
      ['The broadcast console is powered down and the transmitter is peaceful once more.'],
      '📻 TRANSMITTER'
    );
    return true;
  }

  if (!ctx.storyFlags.has('ariana_defeated')) {
    ctx.openDialogue(
      ['ARCHER: Hmph. You will have to get past ARIANA first, kid.'],
      targetNpc.speaker
    );
    return true;
  }

  const challenge =
    targetNpc.challengePages && targetNpc.challengePages.length > 0
      ? targetNpc.challengePages
      : ['ARCHER: Giovanni will answer our signal! TEAM ROCKET will never perish!'];

  ctx.openDialogue(challenge, targetNpc.speaker, () => {
    const team = ctx.buildTrainerTeamInstances
      ? ctx.buildTrainerTeamInstances(targetNpc)
      : [
          PokemonFactory.create('houndour', 33, ['bite', 'ember', 'smog']),
          PokemonFactory.create('koffing', 33, ['sludge', 'smokescreen', 'poisongas']),
          PokemonFactory.create('houndoom', 35, ['flamethrower', 'crunch', 'roar']),
        ];

    ctx.triggerBattle(team[0], {
      isTrainer: true,
      isGymLeader: true,
      trainerName: targetNpc.trainerName || 'Executive Archer',
      trainerTeam: team,
      onVictory: () => {
        ctx.defeatedTrainers.add('archer');
        ctx.storyFlags.add('archer_defeated');
        ctx.storyFlags.add('radio_tower_liberated');
        ctx.storyFlags.add('TEAM_ROCKET_DISBANDED');
        ctx.storyFlags.add('reached_observation_deck');
        ctx.storyFlags.add('has_clear_bell');
        if (ctx.addOverworldItemToInventory) {
          ctx.addOverworldItemToInventory('clear-bell');
        }
        ctx.missionManager?.checkStoryFlags(ctx.storyFlags);
        ctx.missionManager?.completeMission?.('M09');
        ctx.audioManager?.playSfx?.('sfx_badge_get');
        BattleAudio.playOverworldSound('KEY_ITEM');

        ctx.openDialogue(
          [
            "ARCHER: How could this be...?! TEAM ROCKET's grand ambitions shattered again by a lone child?!",
            'It is finished... GIOVANNI will not return. TEAM ROCKET will disband this day!',
            'Executive Archer and the remaining grunts fled from Goldenrod City forever!',
            "DIRECTOR: You did it! You drove off TEAM ROCKET and saved all of JOHTO's airwaves!",
            'Please, take this sacred treasure: the CLEAR BELL! It is said to resonate with a legendary beast of Johto.',
            `${ctx.playerName} received the CLEAR BELL!`,
          ],
          targetNpc.speaker,
          () => {
            const curMap = ctx.mapManager.getCurrentMap();
            if (curMap) {
              ctx.renderMap?.(curMap);
              ctx.syncMapOverworldItems?.(curMap);
            }
            ctx.saveCurrentGame();
            ctx.showToast('🔔 Liberated Radio Tower! Received the CLEAR BELL!');
          }
        );
      },
    });
  });
  return true;
};

/**
 * 8. Liberated Director Rewards (5F Office)
 */
export const handleLiberatedDirectorRewards: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!ctx.storyFlags.has('radio_tower_liberated')) {
    ctx.openDialogue(['DIRECTOR: Please save our station from TEAM ROCKET!'], targetNpc.speaker);
    return true;
  }

  ctx.storyFlags.add('has_clear_bell');
  ctx.storyFlags.add('poke_flute_channel_unlocked');
  if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
  if (!ctx.inventory.keyItems.includes('CLEAR BELL')) ctx.inventory.keyItems.push('CLEAR BELL');

  ctx.openDialogue(
    [
      `DIRECTOR: Hello, ${ctx.playerName}! Because of you, our broadcasts reach all corners of Johto and Kanto!`,
      "I've programmed your POKéGEAR Radio Card with the POKé FLUTE channel at frequency 20.0!",
      'Keep traveling and spreading the joy of POKéMON across our region!',
    ],
    targetNpc.speaker,
    () => {
      ctx.saveCurrentGame();
      ctx.showToast('📻 POKé FLUTE station unlocked on Pokégear!');
    }
  );
  return true;
};

/**
 * 9. DJ Mary Gratitude (4F)
 * DJ Mary only thanks the player. The Pink Bow comes exclusively from Tuscany of Tuesday (Route 29),
 * so there is a single canonical source. Saves that already hold a Pink Bow from DJ Mary keep it.
 */
export const handleDJMaryThanks: NpcInteractionHandler = (targetNpc, _map, ctx) => {
  if (!ctx.storyFlags.has('radio_tower_liberated')) {
    ctx.openDialogue(
      ['DJ MARY: Eek! TEAM ROCKET took over our broadcasting studio! Somebody help!'],
      targetNpc.speaker
    );
    return true;
  }
  ctx.openDialogue(
    [
      'DJ MARY: Oh, you’re the hero who defeated TEAM ROCKET! Thank you so much!',
      'Tune in to POKéMON TALK every day!',
    ],
    targetNpc.speaker
  );
  return true;
};

/**
 * Domain interactions registration entry point for Goldenrod Takeover Phase B.
 */
export function createGoldenrodTakeoverInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['UNDERGROUND_BASEMENT_DOOR'],
      handler: handleBasementDoor,
    },
    {
      actions: ['UNDERGROUND_SHUTTER_SWITCH'],
      handler: handleShutterSwitches,
    },
    {
      actions: ['UNDERGROUND_REAL_DIRECTOR', 'TRUE_DIRECTOR_EVENT'],
      npcIds: ['real_director_warehouse', 'true_director'],
      handler: handleRealDirectorRescue,
    },
    {
      actions: ['RADIO_TOWER_CARD_KEY_SHUTTER'],
      handler: handleCardKeyShutter,
    },
    {
      actions: ['EXECUTIVE_PROTON_EVENT'],
      npcIds: ['executive_proton_radio_4f'],
      handler: handleExecutiveProton,
    },
    { actions: ['ROCKET_DISGUISE_OPERATIVE'], npcIds: ['rocket_disguise_operative'], handler: handleDisguiseOperative },
    { actions: ['RADIO_TOWER_GUARD'], npcIds: ['radio_tower_1f_guard'], handler: handleRadioTowerGuard },
    { actions: ['RIVAL_RADIO_UNMASK'], npcIds: ['rival_radio_2f'], handler: handleRivalUnmask },
    {
      actions: ['EXECUTIVE_ARIANA_EVENT'],
      npcIds: ['executive_ariana_radio_3f'],
      handler: handleExecutiveAriana,
    },
    {
      actions: ['EXECUTIVE_ARCHER_EVENT', 'ARCHER_EVENT'],
      npcIds: ['archer_radio_3f'],
      handler: handleExecutiveArcherBoss,
    },
    {
      actions: ['LIBERATED_DIRECTOR_EVENT', 'RADIO_DIRECTOR_AFTER_EVENT'],
      npcIds: ['liberated_director_radio_5f', 'radio_director'],
      handler: handleLiberatedDirectorRewards,
    },
    {
      actions: ['DJ_MARY_EVENT'],
      npcIds: ['dj_mary', 'dj_mary_radio_4f'],
      handler: handleDJMaryThanks,
    },
  ];
}
