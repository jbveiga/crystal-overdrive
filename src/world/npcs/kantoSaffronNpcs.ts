/**
 * @fileoverview kantoSaffronNpcs domain module implementation.
 * @module world/npcs/kantoSaffronNpcs
 * @role Saffron City, Saffron Gym, Copycat, Landmarks & Route 6 NPCs Component
 * @exports createKantoSaffronNpcs
 * @layer world
 * @sections L1-20: Micro-Header & Imports | L21-120: Route 6 & Gate | L121-220: Saffron City & Gym | L221-340: Landmarks
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

/**
 * Creates NPC lists for Route 6, Saffron City, Saffron Gym, Copycat's House,
 * Silph Co. 1F, Mr. Psychic's House, Fighting Dojo, and Saffron Magnet Train Station.
 */
export function createKantoSaffronNpcs(): Record<string, GridEntity[]> {
  return {
    route_6: [
      makeNpc(
        'route_6_rex',
        9,
        12,
        'RIGHT',
        'pokefan_m',
        '⚔️ POKéFAN REX',
        ['Aww! My PHANPY fought bravely!'],
        {
          action: 'ROUTE_6_TRAINER',
          trainerId: 'route_6_rex',
          trainerName: 'Pokéfan Rex',
          challengePages: ['REX: My PHANPY is the cutest and toughest POKéMON in KANTO!'],
          trainerTeam: [
            { speciesId: 'phanpy', level: 35, moves: ['rollout', 'flail', 'tackle', 'defensecurl'] },
          ],
        }
      ),
      makeNpc(
        'route_6_allan',
        10,
        12,
        'LEFT',
        'pokefan_m',
        '⚔️ POKéFAN ALLAN',
        ['My fortune ran out today...'],
        {
          action: 'ROUTE_6_TRAINER',
          trainerId: 'route_6_allan',
          trainerName: 'Pokéfan Allan',
          challengePages: ["ALLAN: My TEDDIURSA's crescent mark brings me endless good fortune!"],
          trainerTeam: [
            { speciesId: 'teddiursa', level: 35, moves: ['furyswipes', 'feintattack', 'rest', 'snore'] },
          ],
        }
      ),
      makeNpc(
        'route_6_jerry',
        4,
        8,
        'RIGHT',
        'camper',
        '⚔️ CAMPER JERRY',
        ["I wasn't prepared for your skill!"],
        {
          action: 'ROUTE_6_TRAINER',
          trainerId: 'route_6_jerry',
          trainerName: 'Camper Jerry',
          challengePages: ['JERRY: The wilderness along Route 6 is perfect for training!'],
          trainerTeam: [
            { speciesId: 'sandslash', level: 34, moves: ['slash', 'poisonsting', 'defensecurl', 'swift'] },
          ],
        }
      ),
      makeNpc(
        'route_6_debby',
        15,
        15,
        'LEFT',
        'picnicker',
        '⚔️ PICNICKER DEBBY',
        ['Oh! You blew us right away!'],
        {
          action: 'ROUTE_6_TRAINER',
          trainerId: 'route_6_debby',
          trainerName: 'Picnicker Debby',
          challengePages: ["DEBBY: I'm taking a picnic break, but my POKéMON are always ready!"],
          trainerTeam: [
            { speciesId: 'jumpluff', level: 32, moves: ['cottonspore', 'megadrain', 'leechseed', 'tackle'] },
          ],
        }
      ),
    ],

    route_6_saffron_gate: [
      makeNpc('route_6_saffron_gate_officer', 0, 4, 'RIGHT', 'officer', '👮 GATE OFFICER', [
        'Welcome to SAFFRON CITY, the central metropolis of KANTO!',
        'North leads to the heart of the city and the high-speed MAGNET TRAIN.',
      ]),
    ],

    saffron_city: [
      makeNpc('saffron_city_lass', 7, 14, 'LEFT', 'girl', '👧 LASS', [
        'SAFFRON CITY has so many high-rise buildings and busy streets!',
      ]),
      makeNpc('saffron_city_fat_man', 19, 30, 'LEFT', 'fat_man', '👨 CITIZEN', [
        'The MAGNET TRAIN station is in the north of the city! It connects directly to GOLDENROD CITY!',
      ]),
      makeNpc('saffron_city_boy', 32, 7, 'LEFT', 'boy', '👦 YOUNGSTER', [
        'SABRINA, the GYM LEADER, is said to have uncanny psychic visions!',
      ]),
      makeNpc('saffron_city_girl', 20, 24, 'LEFT', 'girl', '👩 CITIZEN', [
        'SILPH CO. is the corporate pride of KANTO. Their gadgets are renowned across the globe!',
      ]),
      makeNpc('saffron_city_fisherman', 27, 12, 'DOWN', 'fisherman', '🎣 TRAVELER', [
        'MR. PSYCHIC lives down south. People say he hands out miraculous TMs to travelers.',
      ]),
      makeNpc('saffron_city_youngster', 15, 19, 'UP', 'boy', '👦 BOY', [
        'Next door to the GYM is the FIGHTING DOJO. Their master is away training in JOHTO, though.',
      ]),
      makeNpc('saffron_city_cooltrainer', 35, 22, 'DOWN', 'boy', '🧢 TRAINER', [
        'COPYCAT lives in the northwest house. She can imitate anyone perfectly!',
      ]),
      makeNpc('saffron_city_beauty', 19, 8, 'DOWN', 'girl', '👩 BEAUTY', [
        'Saffron City is the bustling crossroads of the whole Kanto region!',
      ]),
    ],

    saffron_gym: [
      makeNpc(
        'saffron_gym_guide',
        9,
        16,
        'UP',
        'fat_man',
        '🏆 GYM GUIDE',
        [
          'Yo, CHAMP in making!',
          'SABRINA and her disciples use PSYCHIC-type Pokémon! Dark and Ghost-type moves are super effective against them! Bug-type moves will also hit hard!',
        ],
        { action: 'SAFFRON_GYM_GUIDE' }
      ),
      makeNpc(
        'saffron_gym_statue_left',
        7,
        16,
        'DOWN',
        'boulder',
        '🏆 GYM STATUE',
        ['SAFFRON CITY POKéMON GYM', 'LEADER: SABRINA', 'WINNING TRAINERS:\nRED'],
        { action: 'SAFFRON_GYM_STATUE' }
      ),
      makeNpc(
        'saffron_gym_statue_right',
        10,
        16,
        'DOWN',
        'boulder',
        '🏆 GYM STATUE',
        ['SAFFRON CITY POKéMON GYM', 'LEADER: SABRINA', 'WINNING TRAINERS:\nRED'],
        { action: 'SAFFRON_GYM_STATUE' }
      ),
      makeNpc(
        'saffron_gym_rebecca',
        17,
        16,
        'DOWN',
        'teacher',
        '🔮 MEDIUM REBECCA',
        ['What magnificent spiritual clarity you possess!'],
        {
          action: 'SAFFRON_GYM_TRAINER',
          trainerId: 'saffron_gym_rebecca',
          trainerName: 'Medium Rebecca',
          challengePages: ['The power of the unseen world flows through us!'],
          trainerTeam: [
            { speciesId: 'drowzee', level: 35, moves: ['hypnosis', 'dreameater', 'headbutt'] },
            { speciesId: 'hypno', level: 35, moves: ['hypnosis', 'dreameater', 'psychic', 'meditate'] },
          ],
        }
      ),
      makeNpc(
        'saffron_gym_franklin',
        3,
        16,
        'DOWN',
        'boy',
        '🔮 PSYCHIC FRANKLIN',
        ['My telekinetic focus was shattered!'],
        {
          action: 'SAFFRON_GYM_TRAINER',
          trainerId: 'saffron_gym_franklin',
          trainerName: 'Psychic Franklin',
          challengePages: ['Psychic power bends reality itself!'],
          trainerTeam: [
            { speciesId: 'kadabra', level: 37, moves: ['psybeam', 'recover', 'disable', 'confusion'] },
          ],
        }
      ),
      makeNpc(
        'saffron_gym_doris',
        3,
        4,
        'DOWN',
        'teacher',
        '🔮 MEDIUM DORIS',
        ['You saw through all of my predictions!'],
        {
          action: 'SAFFRON_GYM_TRAINER',
          trainerId: 'saffron_gym_doris',
          trainerName: 'Medium Doris',
          challengePages: ['Foresight alone cannot win battles without pure resolve!'],
          trainerTeam: [
            { speciesId: 'slowpoke', level: 34, moves: ['confusion', 'watergun', 'growl', 'yawn'] },
            { speciesId: 'slowbro', level: 36, moves: ['confusion', 'surf', 'amnesia', 'disable'] },
          ],
        }
      ),
      makeNpc(
        'saffron_gym_jared',
        17,
        4,
        'DOWN',
        'boy',
        '🔮 PSYCHIC JARED',
        ['You navigated the warp maze effortlessly!'],
        {
          action: 'SAFFRON_GYM_TRAINER',
          trainerId: 'saffron_gym_jared',
          trainerName: 'Psychic Jared',
          challengePages: ['Teleporting pads will confuse any untrained challenger!'],
          trainerTeam: [
            { speciesId: 'mrmime', level: 32, moves: ['confusion', 'barrier', 'lightscreen'] },
            { speciesId: 'exeggcute', level: 32, moves: ['hypnosis', 'leechseed', 'barrage'] },
            { speciesId: 'exeggcute', level: 35, moves: ['hypnosis', 'leechseed', 'confusion'] },
          ],
        }
      ),
      makeNpc(
        'saffron_gym_sabrina',
        9,
        8,
        'DOWN',
        'cooltrainer_f',
        '🔮 LEADER SABRINA',
        [
          "I had a vision of your arrival! I have had psychic powers since I was a child. It started when a spoon I carelessly threw didn't fall to the floor! You desire the MARSHBADGE? I do not like to fight, but it is my duty as a GYM LEADER to confer BADGES on anyone who has proven themselves worthy!",
        ],
        {
          action: 'SABRINA_EVENT',
          trainerId: 'sabrina',
          trainerName: 'Leader Sabrina',
          challengePages: [
            "I had a vision of your arrival! I have had psychic powers since I was a child. It started when a spoon I carelessly threw didn't fall to the floor! You desire the MARSHBADGE? I do not like to fight, but it is my duty as a GYM LEADER to confer BADGES on anyone who has proven themselves worthy!",
          ],
          trainerTeam: [
            { speciesId: 'alakazam', level: 48, moves: ['psychic', 'reflect', 'futuresight', 'recover'] },
            { speciesId: 'espeon', level: 46, moves: ['psychic', 'swift', 'quickattack', 'sandattack'] },
            { speciesId: 'mrmime', level: 46, moves: ['psychic', 'barrier', 'lightscreen', 'batonpass'] },
          ],
        }
      ),
    ],

    copycats_house_1f: [
      makeNpc('copycats_house_1f_father', 2, 3, 'DOWN', 'fat_man', '👨 FATHER', [
        'My daughter loves to mimic people and collect dolls! Her room is right upstairs.',
      ]),
      makeNpc('copycats_house_1f_mother', 5, 4, 'LEFT', 'teacher', '👩 MOTHER', [
        'My daughter lost her precious CLEFAIRY DOLL recently. She has been very sad about it.',
      ]),
    ],

    copycats_house_2f: [
      makeNpc(
        'copycat',
        4,
        3,
        'DOWN',
        'girl',
        '👧 COPYCAT',
        [
          "Hi! Do you like POKéMON? Uh... What? You're asking about me? ...I lost my favorite CLEFAIRY DOLL in VERMILION CITY! If someone found it, I'd give them a PASS for the MAGNET TRAIN!",
        ],
        { action: 'COPYCAT_EVENT' }
      ),
      makeNpc('copycats_doduo', 6, 3, 'LEFT', 'bird_keeper', '🐦 DODUO', [
        'DODUO: Giga giga!',
      ]),
      makeNpc('copycats_doll', 1, 4, 'DOWN', 'girl', '🧸 CLEFAIRY DOLL', [
        "It's a rare and cuddly CLEFAIRY DOLL!",
      ]),
    ],

    silph_co_1f: [
      makeNpc(
        'silph_co_guard',
        4,
        2,
        'DOWN',
        'officer',
        '👮 SILPH CO. GUARD',
        [
          'Welcome to SILPH CO.! We develop state-of-the-art items for trainers. Here, take this sample of our newest product!',
        ],
        { action: 'SILPH_CO_GUARD' }
      ),
      makeNpc('silph_co_receptionist', 13, 1, 'DOWN', 'receptionist', '👩 RECEPTIONIST', [
        'Welcome to SILPH CO. HEAD OFFICE! Our security is top-notch.',
      ]),
    ],

    mr_psychics_house: [
      makeNpc(
        'mr_psychic',
        2,
        3,
        'RIGHT',
        'psychic',
        '🔮 MR. PSYCHIC',
        [
          "... ... ... ... ... ... ... ... ... ... ... ...I knew you were coming! I foresaw it! You want this TM, don't you? Take it!",
        ],
        { action: 'MR_PSYCHIC' }
      ),
    ],

    fighting_dojo: [
      makeNpc(
        'fighting_dojo_disciple',
        4,
        4,
        'DOWN',
        'black_belt',
        '🥋 KARATE MASTER',
        [
          'Hello! KARATE KING, the master of the FIGHTING DOJO, is currently training in MT. MORTAR in JOHTO!',
          'Without him, we cannot officially hand out badges, but you can feel free to train your spirit here!',
        ],
        { action: 'FIGHTING_DOJO_DISCIPLE' }
      ),
    ],

    saffron_magnet_train_station: [
      makeNpc(
        'saffron_train_conductor',
        9,
        9,
        'DOWN',
        'officer',
        '👮 STATION CONDUCTOR',
        ['You need a PASS to ride the MAGNET TRAIN! Only authorized travelers with a RAIL PASS may board.'],
        { action: 'MAGNET_TRAIN_CONDUCTOR' }
      ),
      makeNpc('saffron_station_guide', 10, 14, 'DOWN', 'fat_man', '🏆 GYM GUIDE', [
        "The MAGNET TRAIN connects SAFFRON CITY with GOLDENROD CITY in JOHTO! It's marvelously fast!",
      ]),
      makeNpc('saffron_station_passenger', 5, 11, 'RIGHT', 'teacher', '👩 COMMUTER', [
        'I commute between JOHTO and KANTO for work. The MAGNET TRAIN makes the trip a breeze!',
      ]),
    ],
  };
}
