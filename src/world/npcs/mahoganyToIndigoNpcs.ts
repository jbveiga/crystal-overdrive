import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createMahoganyToIndigoNpcs(): Record<string, GridEntity[]> {
  return {
    lake_of_rage: [
      makeNpc(
        'lake_of_rage_red_gyarados',
        21,
        15,
        'DOWN',
        'lapras',
        '🐉 GYARADOS',
        [
          "GYARADOS: Gyashaa! The lake's waters churn violently as the crimson Gyarados thrashes with fury!",
        ],
        { action: 'RED_GYARADOS_EVENT' }
      ),
      makeNpc(
        'lake_of_rage_lance',
        21,
        30,
        'UP',
        'gentleman',
        '🏆 CHAMPION LANCE',
        [
          "LANCE: ...So you're the one who quelled that Gyarados. Impressive!",
        ],
        { action: 'LANCE_LAKE_EVENT' }
      ),
      makeNpc(
        'wesley_of_wednesday',
        8,
        18,
        'DOWN',
        'boy',
        '🥋 WESLEY OF WEDNESDAY',
        [
          "WESLEY: Yo! I'm WESLEY of Wednesday! You must train diligently!",
          "Here's a BLACK BELT! It boosts the power of FIGHTING-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
    ],

    mahogany_town: [
      makeNpc(
        'mahogany_gym_blocker',
        6,
        14,
        'DOWN',
        'fat_man',
        'TOWN RESIDENT',
        [
          "Gym Leader Pryce went up to the Lake of Rage to investigate the strange Pokémon disturbance.",
          "The Gym is closed until the emergency at the lake and the souvenir shop is resolved!",
        ],
        { action: 'MAHOGANY_GYM_BLOCKER' }
      ),
    ],

    mahogany_mart: [
      makeNpc(
        'mahogany_mart_lance',
        4,
        4,
        'UP',
        'gentleman',
        '🏆 CHAMPION LANCE',
        [
          "LANCE: You made it! The transmitter signal is emanating right from beneath this floor.",
          "Lance moves the heavy cabinet to reveal a secret stairway descending underground!",
          "LANCE: Follow me down! We need to shut down the generator Electrodes powering their broadcast!",
        ],
        { action: 'LANCE_MART_EVENT' }
      ),
    ],

    team_rocket_base_b2f: [
      makeNpc(
        'team_rocket_base_b2f_lance',
        18,
        10,
        'DOWN',
        'gentleman',
        '🏆 CHAMPION LANCE',
        [
          "LANCE: Are your Pokémon holding up? Here, let me restore your team to full fighting strength!",
        ],
        { action: 'LANCE_BASE_HEAL' }
      ),
    ],

    team_rocket_base_b3f: [
      makeNpc(
        'b3f_electrode_1',
        20,
        5,
        'DOWN',
        'pokefan_m',
        '⚡ ELECTRODE',
        ["⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"],
        { action: 'ROCKET_GENERATOR_ELECTRODE' }
      ),
      makeNpc(
        'b3f_electrode_2',
        20,
        7,
        'DOWN',
        'pokefan_m',
        '⚡ ELECTRODE',
        ["⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"],
        { action: 'ROCKET_GENERATOR_ELECTRODE' }
      ),
      makeNpc(
        'b3f_electrode_3',
        20,
        9,
        'DOWN',
        'pokefan_m',
        '⚡ ELECTRODE',
        ["⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"],
        { action: 'ROCKET_GENERATOR_ELECTRODE' }
      ),
      makeNpc(
        'b3f_electrode_4',
        25,
        5,
        'DOWN',
        'pokefan_m',
        '⚡ ELECTRODE',
        ["⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"],
        { action: 'ROCKET_GENERATOR_ELECTRODE' }
      ),
      makeNpc(
        'b3f_electrode_5',
        25,
        7,
        'DOWN',
        'pokefan_m',
        '⚡ ELECTRODE',
        ["⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"],
        { action: 'ROCKET_GENERATOR_ELECTRODE' }
      ),
      makeNpc(
        'b3f_electrode_6',
        25,
        9,
        'DOWN',
        'pokefan_m',
        '⚡ ELECTRODE',
        ["⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"],
        { action: 'ROCKET_GENERATOR_ELECTRODE' }
      ),
    ],

    blackthorn_city: [
      makeNpc(
        'santos_of_saturday',
        16,
        16,
        'DOWN',
        'boy',
        '🏖️ SANTOS OF SATURDAY',
        [
          "SANTOS: It's Saturday! I'm SANTOS of Saturday! Good to see you, trainer!",
          "Take this SOFT SAND! It boosts the power of GROUND-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
    ],

    dragon_shrine: [
      makeNpc(
        'dragon_elder',
        5,
        3,
        'DOWN',
        'elder',
        '🐉 DRAGON MASTER ELDER',
        [
          "ELDER: Welcome, young trainer, to the sacred DRAGON SHRINE.",
          "CLAIR brought you here to test your worthiness as a true dragon disciple.",
        ],
        { action: 'DRAGON_ELDER_EVENT' }
      ),
    ],

    victory_road: [
      makeNpc(
        'victory_road_rival',
        10,
        4,
        'DOWN',
        'super_nerd',
        '🔴 RIVAL',
        [
          "RIVAL: You really made it through VICTORY ROAD? Don't think for a second that you're stronger than me!",
        ],
        {
          action: 'VICTORY_ROAD_RIVAL_EVENT',
          trainerId: 'rival_victory_road',
          trainerName: 'Rival',
          visionRange: 3,
          challengePages: [
            "RIVAL: I have assembled the ultimate team of ruthless, powerful POKéMON! I'll crush you before you even see the LEAGUE doors!",
          ],
          trainerPokemon: { speciesId: 'sneasel', level: 36, moves: ['slash', 'feint-attack', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'sneasel', level: 36, moves: ['slash', 'feint-attack', 'quickattack'] },
            { speciesId: 'golbat', level: 36, moves: ['wing-attack', 'bite', 'confuseray'] },
            { speciesId: 'magneton', level: 35, moves: ['thundershock', 'sonicboom', 'supersonic'] },
            { speciesId: 'kadabra', level: 35, moves: ['psybeam', 'recover', 'disable'] },
            { speciesId: 'haunter', level: 35, moves: ['shadowball', 'curse', 'night-shade'] },
            { speciesId: 'feraligatr', level: 38, moves: ['surf', 'bite', 'slash', 'scaryface'] },
          ],
        }
      ),
    ],

    wills_room: [
      makeNpc(
        'e4_will',
        5,
        5,
        'DOWN',
        'psychic',
        '🎭 ELITE FOUR WILL',
        [
          "WILL: Welcome to the POKéMON LEAGUE! I am WILL, master of psychic power!",
        ],
        {
          action: 'E4_WILL_EVENT',
          trainerId: 'will',
          trainerName: 'Elite Four Will',
          challengePages: [
            "WILL: I have trained all over the world to hone my psychic powers. Even if you defeated all 8 GYM LEADERS, you cannot break through my mind!",
          ],
          trainerPokemon: { speciesId: 'xatu', level: 40, moves: ['confuseray', 'psychic', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'xatu', level: 40, moves: ['confuseray', 'psychic', 'quickattack'] },
            { speciesId: 'jynx', level: 41, moves: ['icepunch', 'lovelykiss', 'psychic'] },
            { speciesId: 'exeggutor', level: 41, moves: ['reflect', 'eggbomb', 'psychic'] },
            { speciesId: 'slowbro', level: 41, moves: ['amnesia', 'surf', 'psychic'] },
            { speciesId: 'xatu', level: 42, moves: ['confuseray', 'psychic', 'future-sight'] },
          ],
        }
      ),
    ],

    kogas_room: [
      makeNpc(
        'e4_koga',
        5,
        5,
        'DOWN',
        'super_nerd',
        '🥷 ELITE FOUR KOGA',
        [
          "KOGA: Fwahahaha! A mere child reached me?! I am KOGA of the ELITE FOUR!",
        ],
        {
          action: 'E4_KOGA_EVENT',
          trainerId: 'koga',
          trainerName: 'Elite Four Koga',
          challengePages: [
            "KOGA: I have mastered ancient ninja techniques and toxic poisons! Feel the creeping dread of darkness!",
          ],
          trainerPokemon: { speciesId: 'ariados', level: 40, moves: ['giga-drain', 'spiderweb', 'sludge-bomb'] },
          trainerTeam: [
            { speciesId: 'ariados', level: 40, moves: ['giga-drain', 'spiderweb', 'sludge-bomb'] },
            { speciesId: 'venomoth', level: 41, moves: ['supersonic', 'gust', 'toxic'] },
            { speciesId: 'forretress', level: 43, moves: ['spikes', 'swift', 'explosion'] },
            { speciesId: 'muk', level: 42, moves: ['minimize', 'acid-armor', 'sludge-bomb'] },
            { speciesId: 'crobat', level: 44, moves: ['wing-attack', 'confuseray', 'toxic'] },
          ],
        }
      ),
    ],

    brunos_room: [
      makeNpc(
        'e4_bruno',
        5,
        5,
        'DOWN',
        'blackbelt',
        '🥋 ELITE FOUR BRUNO',
        [
          "BRUNO: I am BRUNO of the ELITE FOUR! Through rigorous training, humans and POKéMON become one!",
        ],
        {
          action: 'E4_BRUNO_EVENT',
          trainerId: 'bruno',
          trainerName: 'Elite Four Bruno',
          challengePages: [
            "BRUNO: We have lived and trained together in the deepest mountains! Feel our iron fists!",
          ],
          trainerPokemon: { speciesId: 'hitmontop', level: 42, moves: ['pursuit', 'quickattack', 'dig'] },
          trainerTeam: [
            { speciesId: 'hitmontop', level: 42, moves: ['pursuit', 'quickattack', 'dig'] },
            { speciesId: 'hitmonlee', level: 42, moves: ['jump-kick', 'high-jump-kick', 'foresight'] },
            { speciesId: 'hitmonchan', level: 42, moves: ['thunderpunch', 'icepunch', 'firepunch'] },
            { speciesId: 'onix', level: 43, moves: ['rock-throw', 'earthquake', 'slam'] },
            { speciesId: 'machamp', level: 46, moves: ['cross-chop', 'rock-slide', 'vital-throw'] },
          ],
        }
      ),
    ],

    karens_room: [
      makeNpc(
        'e4_karen',
        5,
        5,
        'DOWN',
        'cooltrainer_f',
        '🌙 ELITE FOUR KAREN',
        [
          "KAREN: I am KAREN of the ELITE FOUR. Strong POKéMON. Weak POKéMON. That is only the selfish perception of people.",
        ],
        {
          action: 'E4_KAREN_EVENT',
          trainerId: 'karen',
          trainerName: 'Elite Four Karen',
          challengePages: [
            "KAREN: Truly skilled trainers should try to win with their favorites. Let me show you what real bond means!",
          ],
          trainerPokemon: { speciesId: 'umbreon', level: 42, moves: ['confuseray', 'feint-attack', 'sand-attack'] },
          trainerTeam: [
            { speciesId: 'umbreon', level: 42, moves: ['confuseray', 'feint-attack', 'sand-attack'] },
            { speciesId: 'vileplume', level: 42, moves: ['stun-spore', 'acid', 'moonlight', 'petaldance'] },
            { speciesId: 'gengar', level: 45, moves: ['shadowball', 'spite', 'curse', 'lick'] },
            { speciesId: 'murkrow', level: 44, moves: ['faint-attack', 'wing-attack', 'whirlwind'] },
            { speciesId: 'houndoom', level: 47, moves: ['flamethrower', 'crunch', 'roar'] },
          ],
        }
      ),
    ],

    lances_room: [
      makeNpc(
        'champion_lance',
        5,
        6,
        'DOWN',
        'cooltrainer_m',
        '👑 CHAMPION LANCE',
        [
          "LANCE: I have been waiting for you, trainer. I knew that you, with your valor and bond, would reach me.",
        ],
        {
          action: 'CHAMPION_LANCE_EVENT',
          trainerId: 'lance',
          trainerName: 'Champion Lance',
          challengePages: [
            "LANCE: As the POKéMON LEAGUE CHAMPION, I accept your challenge! Dragon-types are invincible! Let's begin!",
          ],
          trainerPokemon: { speciesId: 'gyarados', level: 44, moves: ['hyperbeam', 'surf', 'bite'] },
          trainerTeam: [
            { speciesId: 'gyarados', level: 44, moves: ['hyperbeam', 'surf', 'bite'] },
            { speciesId: 'dragonite', level: 47, moves: ['thunderwave', 'twister', 'hyperbeam'] },
            { speciesId: 'dragonite', level: 47, moves: ['blizzard', 'twister', 'hyperbeam'] },
            { speciesId: 'aerodactyl', level: 46, moves: ['wing-attack', 'rock-slide', 'hyperbeam'] },
            { speciesId: 'charizard', level: 46, moves: ['flamethrower', 'wing-attack', 'slash'] },
            { speciesId: 'dragonite', level: 50, moves: ['outrage', 'safeguard', 'hyperbeam', 'fire-blast'] },
          ],
        }
      ),
    ],
  };
}
