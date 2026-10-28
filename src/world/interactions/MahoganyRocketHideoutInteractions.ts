/**
 * @fileoverview MahoganyRocketHideoutInteractions domain module implementation.
 * @module world/interactions/MahoganyRocketHideoutInteractions
 * @role Mahogany Rocket Hideout Interactions Component
 * @exports getMahoganyRocketHideoutInteractions, handleSecuritySwitch, handleLanceFieldMedic, handlePasswordGruntF, handlePasswordGruntM, handleOfficeDoor, handleExecutivePetrel, handlePetrelMurkrow, handleTransmitterDoor, handleMahoganyExecutiveAriana, handleGeneratorElectrode
 * @layer world
 * @sections L1-25: Micro-Header & Imports | L26-110: B1F & B2F Handlers | L111-230: B3F Passwords & Bosses | L231-310: Generator & Climax | L311-360: Registration Factory
 */

import type {
  NpcInteractionContext,
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';

/**
 * 1. Hideout B1F: Security Terminal Switch (Deactivates Persian camera alarms)
 */
export const handleSecuritySwitch: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('EVENT_SECURITY_CAMERA_DISABLED')) {
    ctx.openDialogue(
      [
        'The surveillance terminal display shows: [SECURITY SYSTEM: OFFLINE].',
        'The Persian statue cameras remain deactivated.',
      ],
      '💻 SECURITY TERMINAL'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'A surveillance camera control terminal.',
      'You flipped the security switch to OFF!',
      'The Persian surveillance system has been disabled!',
    ],
    '💻 SECURITY TERMINAL',
    () => {
      ctx.storyFlags.add('EVENT_SECURITY_CAMERA_DISABLED');
      ctx.storyFlags.add('security_cameras_disabled');
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast('🚨 Surveillance cameras deactivated!');
      ctx.saveCurrentGame();
    }
  );
  return true;
};

/**
 * 2. Hideout B2F: Champion Lance Field Medic (Heals party to 100% HP & PP)
 */
export const handleLanceFieldMedic: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  ctx.openDialogue(
    [
      'LANCE: Are your Pokémon holding up?',
      'Here, let me restore your team to full fighting strength!',
    ],
    '🏆 CHAMPION LANCE',
    () => {
      ctx.healPlayerParty(false);
      for (const p of ctx.playerParty) {
        p.currentHp = p.stats.hp;
        p.status = undefined;
        if (p.moves) {
          for (const m of p.moves) {
            m.currentPp = m.maxPp;
          }
        }
      }
      BattleAudio.playOverworldSound('HEAL_JINGLE');
      ctx.playHealingAnimation?.(ctx.playerParty.length, () => {
        ctx.openDialogue(
          [
            'Your Pokémon were restored to peak condition!',
            'LANCE: Stay alert, the Rocket Executives are lurking nearby.',
          ],
          '🏆 CHAMPION LANCE',
          () => ctx.saveCurrentGame()
        );
      });
      ctx.saveCurrentGame();
    }
  );
  return true;
};

/**
 * 3. Hideout B3F: Password Grunt Female (Teaches "SLOWPOKETAIL")
 */
export const handlePasswordGruntF: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('EVENT_LEARNED_SLOWPOKETAIL')) {
    ctx.openDialogue(
      ["ROCKET GRUNT: I already told you the password! It's SLOWPOKETAIL!"],
      '⚡ ROCKET GRUNT'
    );
    return true;
  }

  ctx.openDialogue(
    [
      "ROCKET GRUNT: You want the password to the BOSS's office?",
      "You'll have to beat me first!",
    ],
    '⚡ ROCKET GRUNT',
    () => {
      const gruntTeam = [
        PokemonFactory.create('arbok', 24, ['bite', 'poisonsting', 'glare']),
        PokemonFactory.create('gloom', 24, ['absorb', 'poisonpowder', 'acid']),
      ];
      ctx.triggerBattle(gruntTeam as any, {
        onBattleEnd: (result) => {
          if (result.winner === 'PLAYER') {
            ctx.storyFlags.add('EVENT_LEARNED_SLOWPOKETAIL');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.openDialogue(
              [
                'ROCKET GRUNT: Ugh! How could I lose to a kid?!',
                'Fine! The first password is... SLOWPOKETAIL!',
                "Don't you dare forget it!",
              ],
              '⚡ ROCKET GRUNT',
              () => {
                ctx.showToast('🔑 Learned password: "SLOWPOKETAIL"!');
                ctx.saveCurrentGame();
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
 * 4. Hideout B3F: Password Grunt Male (Teaches "RATICATE")
 */
export const handlePasswordGruntM: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  if (
    ctx.storyFlags.has('EVENT_LEARNED_RATICATETAIL') ||
    ctx.storyFlags.has('EVENT_LEARNED_RATICATE_TAIL')
  ) {
    ctx.openDialogue(
      ["ROCKET GRUNT: The second password is RATICATE. Now beat it!"],
      '⚡ ROCKET GRUNT'
    );
    return true;
  }

  ctx.openDialogue(
    [
      "ROCKET GRUNT: The password? I'd never leak that to a meddling kid like you!",
    ],
    '⚡ ROCKET GRUNT',
    () => {
      const gruntTeam = [
        PokemonFactory.create('drowzee', 24, ['pound', 'hypnosis', 'confusion']),
        PokemonFactory.create('raticate', 24, ['hyperfang', 'quickattack', 'bite']),
      ];
      ctx.triggerBattle(gruntTeam as any, {
        onBattleEnd: (result) => {
          if (result.winner === 'PLAYER') {
            ctx.storyFlags.add('EVENT_LEARNED_RATICATETAIL');
            ctx.storyFlags.add('EVENT_LEARNED_RATICATE_TAIL');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.openDialogue(
              [
                "ROCKET GRUNT: Tch! You're tougher than you look...",
                'The second password is... RATICATE! Now leave me alone!',
              ],
              '⚡ ROCKET GRUNT',
              () => {
                ctx.showToast('🔑 Learned password: "RATICATE"!');
                ctx.saveCurrentGame();
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
 * 5. Hideout B3F: Executive Petrel Office Door (Requires both passwords)
 */
export const handleOfficeDoor: NpcInteractionHandler = (_targetNpc, currentMap, ctx) => {
  if (ctx.storyFlags.has('EVENT_OPENED_DOOR_TO_GIOVANNIS_OFFICE')) {
    ctx.openDialogue(
      ["The door to GIOVANNI'S office is unlocked and open."],
      '🔒 BLAST DOOR'
    );
    return true;
  }

  const hasP1 = ctx.storyFlags.has('EVENT_LEARNED_SLOWPOKETAIL');
  const hasP2 =
    ctx.storyFlags.has('EVENT_LEARNED_RATICATETAIL') ||
    ctx.storyFlags.has('EVENT_LEARNED_RATICATE_TAIL');

  if (!hasP1 || !hasP2) {
    ctx.openDialogue(
      [
        'The heavy electronic blast door is securely locked.',
        'A keypad terminal requires two secret passwords to proceed!',
      ],
      '🔒 BLAST DOOR'
    );
    return true;
  }

  ctx.storyFlags.add('EVENT_OPENED_DOOR_TO_GIOVANNIS_OFFICE');
  if (currentMap?.collisionGrid) {
    currentMap.collisionGrid[9 * currentMap.width + 10] = 0;
    currentMap.collisionGrid[9 * currentMap.width + 11] = 0;
  }
  BattleAudio.playOverworldSound('KEY_ITEM');
  ctx.openDialogue(
    [
      'Entered the passwords: "SLOWPOKETAIL" and "RATICATE"!',
      "The electronic lock clicked and the blast door to the Executive Suite slid open!",
    ],
    '🔒 BLAST DOOR',
    () => {
      ctx.saveCurrentGame();
      ctx.renderMap?.(currentMap);
    }
  );
  return true;
};

/**
 * 6. Hideout B3F: Executive Petrel Boss Battle
 */
export const handleExecutivePetrel: NpcInteractionHandler = (_targetNpc, currentMap, ctx) => {
  if (ctx.storyFlags.has('EVENT_BEAT_ROCKET_EXECUTIVEM_4')) {
    return true;
  }

  ctx.openDialogue(
    [
      'PETREL: What? Who let a child into the Executive Suite?!',
      'I am PETREL, one of the four Executives of TEAM ROCKET!',
      'Our radio broadcast from this hideout will bring all Pokémon under our total control!',
      'You will not ruin our glorious comeback!',
    ],
    '⚡ EXECUTIVE PETREL',
    () => {
      const petrelTeam = [
        PokemonFactory.create('zubat', 22, ['leechlife', 'bite', 'confuseray', 'wingattack']),
        PokemonFactory.create('koffing', 22, ['tackle', 'smog', 'sludge', 'smokescreen']),
        PokemonFactory.create('raticate', 24, ['hyperfang', 'quickattack', 'scaryface', 'pursuit']),
      ];
      ctx.triggerBattle(petrelTeam as any, {
        onBattleEnd: (result) => {
          if (result.winner === 'PLAYER') {
            ctx.storyFlags.add('EVENT_BEAT_ROCKET_EXECUTIVEM_4');
            BattleAudio.playOverworldSound('FANFARE');
            ctx.openDialogue(
              [
                'PETREL: Gah! Unbelievable! Defeated by a mere brat?!',
                "No matter... You'll never open the transmitter room without the voice password!",
                "Only the BOSS's trusted Murkrow knows it, and it will never squawk it to you! Farewell!",
              ],
              '⚡ EXECUTIVE PETREL',
              () => {
                ctx.saveCurrentGame();
                ctx.renderMap?.(currentMap);
                ctx.showToast('⚡ Executive Petrel fled! Talk to Murkrow.');
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
 * 7. Hideout B3F: Petrel's Murkrow (Squawks "Hail GIOVANNI" voice password)
 */
export const handlePetrelMurkrow: NpcInteractionHandler = (_targetNpc, _map, ctx) => {
  if (ctx.storyFlags.has('EVENT_LEARNED_HAIL_GIOVANNI')) {
    ctx.openDialogue(
      ['MURKROW: Squawk! Hail GIOVANNI!'],
      '🐦 MURKROW'
    );
    return true;
  }

  BattleAudio.playCry('murkrow');
  ctx.openDialogue(
    [
      'MURKROW: Squawk! Hail GIOVANNI! Hail GIOVANNI!',
      'The Murkrow mimics the master voice password with uncanny accuracy!',
    ],
    '🐦 MURKROW',
    () => {
      ctx.storyFlags.add('EVENT_LEARNED_HAIL_GIOVANNI');
      BattleAudio.playOverworldSound('KEY_ITEM');
      ctx.showToast('🗣️ Learned Voice Password: "Hail GIOVANNI"!');
      ctx.saveCurrentGame();
    }
  );
  return true;
};

/**
 * 8. Hideout B2F: Master Generator Blast Door (Voice password unlock)
 */
export const handleTransmitterDoor: NpcInteractionHandler = (_targetNpc, currentMap, ctx) => {
  if (ctx.storyFlags.has('EVENT_OPENED_DOOR_TO_ROCKET_HIDEOUT_TRANSMITTER')) {
    ctx.openDialogue(
      ['The master blast door to the transmitter room is open.'],
      '🔒 BLAST DOOR'
    );
    return true;
  }

  if (!ctx.storyFlags.has('EVENT_LEARNED_HAIL_GIOVANNI')) {
    ctx.openDialogue(
      [
        'A massive blast door seals the generator room.',
        "The voice recognition terminal requires the commander's voice password!",
      ],
      '🔒 BLAST DOOR'
    );
    return true;
  }

  ctx.storyFlags.add('EVENT_OPENED_DOOR_TO_ROCKET_HIDEOUT_TRANSMITTER');
  if (currentMap?.collisionGrid) {
    currentMap.collisionGrid[12 * currentMap.width + 14] = 0;
    currentMap.collisionGrid[12 * currentMap.width + 15] = 0;
  }
  BattleAudio.playOverworldSound('KEY_ITEM');
  ctx.openDialogue(
    [
      'You spoke the voice password into the microphone: "Hail GIOVANNI"!',
      'The voice recognition system verified the passphrase! The blast door opened!',
    ],
    '🔒 BLAST DOOR',
    () => {
      ctx.saveCurrentGame();
      ctx.renderMap?.(currentMap);
    }
  );
  return true;
};

/**
 * 9. Hideout B2F: Executive Ariana Climax Battle
 */
export const handleMahoganyExecutiveAriana: NpcInteractionHandler = (_targetNpc, currentMap, ctx) => {
  if (ctx.storyFlags.has('EVENT_BEAT_ROCKET_EXECUTIVEF_2')) {
    ctx.openDialogue(
      ['The transmitter controls are exposed. Subdue the Electrodes to stop the broadcast!'],
      '⚡ TRANSMITTER'
    );
    return true;
  }

  ctx.openDialogue(
    [
      'ARIANA: Stop right there! How dare you trespass into the transmitter room!',
      "We won't let anyone interfere with our broadcast!",
      'LANCE: Hold on! Two against one is hardly fair.',
      'LANCE and DRAGONITE stepped in to back you up!',
      'LANCE: I will take on the Grunt. Leave the Executive to you!',
      'ARIANA: Insolent fools! Prepare to be crushed!',
    ],
    '⚡ EXECUTIVE ARIANA',
    () => {
      const arianaTeam = [
        PokemonFactory.create('arbok', 25, ['poisonsting', 'bite', 'glare', 'screech']),
        PokemonFactory.create('gloom', 25, ['absorb', 'poisonpowder', 'stunspore', 'sweetscent']),
        PokemonFactory.create('murkrow', 27, ['peck', 'pursuit', 'haze', 'nightshade']),
      ];
      ctx.triggerBattle(arianaTeam as any, {
        onBattleEnd: (result) => {
          if (result.winner === 'PLAYER') {
            ctx.storyFlags.add('EVENT_BEAT_ROCKET_EXECUTIVEF_2');
            BattleAudio.playOverworldSound('FANFARE');
            ctx.openDialogue(
              [
                'ARIANA: Tsk... Stronger than expected.',
                'TEAM ROCKET: Fall back! We must regroup at the Goldenrod Radio Tower!',
                'Executive Ariana and the Grunts fled the transmitter room!',
                'LANCE: Well done! Now we must shut down the power generator.',
                'LANCE: Subduing the three Electrodes powering the dynamos will halt the signal completely.',
              ],
              '⚡ EXECUTIVE ARIANA',
              () => {
                ctx.saveCurrentGame();
                ctx.renderMap?.(currentMap);
                ctx.showToast('⚡ Executive Ariana defeated! Sabotage the 3 Electrodes.');
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
 * 10. Hideout B2F/B3F: Generator Electrodes Sabotage & HM06 Whirlpool Grant
 */
export const handleGeneratorElectrode: NpcInteractionHandler = (targetNpc, currentMap, ctx) => {
  if (
    ctx.storyFlags.has('rocket_base_generator_cleared') ||
    ctx.storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
  ) {
    ctx.openDialogue(
      ['The generator dynamo is completely powered down.'],
      '⚡ GENERATOR'
    );
    return true;
  }

  const electrodeId = targetNpc.id;
  if (ctx.storyFlags.has(electrodeId + '_cleared')) {
    ctx.openDialogue(
      ['This dynamo slot is empty. The Electrode has been freed.'],
      '⚡ GENERATOR'
    );
    return true;
  }

  BattleAudio.playCry('electrode');
  ctx.openDialogue(
    [
      '⚡ The ELECTRODE is locked into the generator dynamo, crackling with electrical fury!',
      'It attacks frantically to break free!',
    ],
    '⚡ ELECTRODE',
    () => {
      const wildElectrode = PokemonFactory.create('electrode', 23, ['spark', 'sonicboom', 'screech', 'selfdestruct']);
      ctx.triggerBattle(wildElectrode, {
        onBattleEnd: (result) => {
          if (result.winner === 'PLAYER' || result.caught) {
            ctx.storyFlags.add(electrodeId + '_cleared');

            const e1 =
              ctx.storyFlags.has('b2f_electrode_1_cleared') ||
              ctx.storyFlags.has('b3f_electrode_1_cleared');
            const e2 =
              ctx.storyFlags.has('b2f_electrode_2_cleared') ||
              ctx.storyFlags.has('b3f_electrode_2_cleared');
            const e3 =
              ctx.storyFlags.has('b2f_electrode_3_cleared') ||
              ctx.storyFlags.has('b3f_electrode_3_cleared');

            const clearedCount = (e1 ? 1 : 0) + (e2 ? 1 : 0) + (e3 ? 1 : 0);

            if (clearedCount >= 3) {
              ctx.storyFlags.add('rocket_base_generator_cleared');
              ctx.storyFlags.add('EVENT_CLEARED_ROCKET_HIDEOUT');
              ctx.storyFlags.add('has_hm06_whirlpool');
              ctx.storyFlags.add('EVENT_GOT_HM06_WHIRLPOOL');
              if (!ctx.inventory.tms) ctx.inventory.tms = [];
              if (!ctx.inventory.tms.includes('HM06')) {
                ctx.inventory.tms.push('HM06');
              }
              ctx.addOverworldItemToInventory?.('HM06');
              ctx.missionManager?.checkStoryFlags?.(ctx.storyFlags);
              BattleAudio.playOverworldSound('FANFARE');

              ctx.openDialogue(
                [
                  '⚡ The final ELECTRODE was calmed and freed from the dynamo!',
                  'The generator hum whirred down to complete silence.',
                  'The sinister radio broadcast manipulating Lake of Rage has stopped!',
                  'LANCE: Outstanding work! Thanks to you, the wild Pokémon at Lake of Rage are safe.',
                  'LANCE: As a token of my gratitude, take this HIDDEN MACHINE!',
                  'Obtained HM06 WHIRLPOOL!',
                  'LANCE: With the GLACIER BADGE from MAHOGANY GYM, WHIRLPOOL will let you navigate treacherous ocean whirlpools.',
                  'LANCE: I must head off to investigate further rumors. Farewell, trainer!',
                ],
                '🏆 CHAMPION LANCE',
                () => {
                  ctx.saveCurrentGame();
                  ctx.renderMap?.(currentMap);
                  ctx.showToast('🌊 Obtained HM06 WHIRLPOOL! Generator stopped.');
                }
              );
            } else {
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  '⚡ The ELECTRODE was detached from the dynamo!',
                  `[${clearedCount}/3] Electrodes subdued. Keep going!`,
                ],
                '⚡ GENERATOR',
                () => {
                  ctx.saveCurrentGame();
                  ctx.renderMap?.(currentMap);
                }
              );
            }
          }
        },
      });
    }
  );
  return true;
};

/**
 * Registers all Mahogany Rocket Hideout interactions for constant-time O(1) routing.
 */
export function getMahoganyRocketHideoutInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['ROCKET_BASE_SECURITY_SWITCH'],
      npcIds: ['team_rocket_base_b1f_switch'],
      handler: handleSecuritySwitch,
    },
    {
      actions: ['LANCE_BASE_HEAL'],
      npcIds: ['team_rocket_base_b2f_lance'],
      handler: handleLanceFieldMedic,
    },
    {
      actions: ['ROCKET_BASE_PASSWORD_GRUNT_F'],
      npcIds: ['team_rocket_base_b3f_grunt_f'],
      handler: handlePasswordGruntF,
    },
    {
      actions: ['ROCKET_BASE_PASSWORD_GRUNT_M'],
      npcIds: ['team_rocket_base_b3f_grunt_m'],
      handler: handlePasswordGruntM,
    },
    {
      actions: ['ROCKET_BASE_OFFICE_DOOR'],
      npcIds: ['team_rocket_base_b3f_office_door'],
      handler: handleOfficeDoor,
    },
    {
      actions: ['ROCKET_BASE_PETREL_EVENT'],
      npcIds: ['team_rocket_base_b3f_petrel'],
      handler: handleExecutivePetrel,
    },
    {
      actions: ['ROCKET_BASE_MURKROW_EVENT'],
      npcIds: ['team_rocket_base_b3f_murkrow'],
      handler: handlePetrelMurkrow,
    },
    {
      actions: ['ROCKET_BASE_TRANSMITTER_DOOR'],
      npcIds: ['team_rocket_base_b2f_transmitter_door'],
      handler: handleTransmitterDoor,
    },
    {
      actions: ['ROCKET_BASE_ARIANA_EVENT'],
      npcIds: ['team_rocket_base_b2f_ariana'],
      handler: handleMahoganyExecutiveAriana,
    },
    {
      actions: ['ROCKET_GENERATOR_ELECTRODE'],
      npcIds: [
        'b2f_electrode_1',
        'b2f_electrode_2',
        'b2f_electrode_3',
        'b3f_electrode_1',
        'b3f_electrode_2',
        'b3f_electrode_3',
      ],
      handler: handleGeneratorElectrode,
    },
  ];
}
