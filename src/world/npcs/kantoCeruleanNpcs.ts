/**
 * @fileoverview Handcrafted canonical NPCs for Route 5, Cerulean City, Cerulean Gym,
 * Route 24, Route 25, Power Plant, and Lavender Radio Tower 1F.
 * @module world/npcs/kantoCeruleanNpcs
 * @role NPC Definition Module
 * @exports createKantoCeruleanNpcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-115: Power Plant & Cerulean Gym | L116-260: Route 24/25 & Radio Tower
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createKantoCeruleanNpcs(): Record<string, GridEntity[]> {
  return {
    power_plant: [
      makeNpc('power_plant_manager', 14, 10, 'DOWN', 'fat_man', '⚡ MANAGER', [
        'Someone stole an essential MACHINE PART from our generator!',
        'Without it, electricity cannot flow anywhere in KANTO!',
      ], { action: 'POWER_PLANT_MANAGER' }),
      makeNpc('power_plant_officer_1', 2, 9, 'DOWN', 'officer', '👮 OFFICER', [
        'I am on guard duty. A shady character was seen lurking around the generator recently!',
      ]),
      makeNpc('power_plant_officer_2', 0, 3, 'RIGHT', 'officer', '👮 OFFICER', [
        'All generator systems are under tight surveillance.',
      ]),
      makeNpc('power_plant_worker_1', 8, 9, 'UP', 'super_nerd', '⚡ ENGINEER', [
        'The generator produces enough electricity for the entire KANTO region!',
      ]),
      makeNpc('power_plant_worker_2', 18, 13, 'LEFT', 'super_nerd', '⚡ TECHNICIAN', [
        'Without the generator, the MAGNET TRAIN cannot run at all!',
      ]),
    ],

    cerulean_city: [
      makeNpc('cerulean_city_cooltrainer_m', 15, 23, 'DOWN', 'boy', 'COOLTRAINER', [
        'KANTO and JOHTO are connected by the MAGNET TRAIN and the FAST SHIP.',
      ]),
      makeNpc('cerulean_city_super_nerd', 23, 15, 'DOWN', 'super_nerd', 'SUPER NERD', [
        'The CAPE out north is a popular date spot for young couples!',
      ]),
      makeNpc('cerulean_city_cooltrainer_f', 21, 24, 'LEFT', 'girl', 'COOLTRAINER', [
        'MISTY is the GYM LEADER here. She specializes in WATER-type POKéMON!',
      ]),
      makeNpc('cerulean_city_fisher', 30, 26, 'LEFT', 'fisherman', 'FISHER', [
        'The canal around the city is full of lively water POKéMON.',
      ]),
      makeNpc('cerulean_city_youngster', 6, 12, 'DOWN', 'youngster', 'YOUNGSTER', [
        'There is a hidden path behind the gym leading north!',
      ]),
    ],

    cerulean_gym: [
      makeNpc('cerulean_gym_rocket_grunt', 4, 10, 'DOWN', 'rocket_grunt_m', '🚀 ROCKET GRUNT', [
        'Oops! I so sorry! I not mean to bump! Bye-bye!',
      ], { action: 'CERULEAN_GYM_ROCKET_GRUNT' }),
      makeNpc('cerulean_gym_misty', 5, 3, 'DOWN', 'beauty', '🏆 LEADER MISTY', [
        'MISTY: I was expecting you, you pest!',
        'My water-type POKéMON are tough! Let me show you!',
      ], {
        action: 'MISTY_EVENT',
        trainerId: 'misty',
        trainerName: 'Leader Misty',
        team: [
          { speciesId: 'golduck', level: 42, moves: ['surf', 'disable', 'psychup', 'psychic'] },
          { speciesId: 'quagsire', level: 42, moves: ['surf', 'amnesia', 'earthquake', 'raindance'] },
          { speciesId: 'lapras', level: 44, moves: ['surf', 'blizzard', 'bodyslam', 'raindance'] },
          { speciesId: 'starmie', level: 47, moves: ['surf', 'recover', 'confuseray', 'icebeam'] },
        ],
      }),
      makeNpc('cerulean_gym_swimmer_diana', 4, 6, 'RIGHT', 'girl', '⚔️ SWIMMER DIANA', [
        'Diana: That was a great battle!',
      ], {
        action: 'CERULEAN_GYM_TRAINER',
        trainerId: 'cerulean_gym_diana',
        trainerName: 'Swimmer Diana',
        challengePages: ["DIANA: Let's battle in the water!"],
        team: [{ speciesId: 'golduck', level: 37, moves: ['surf', 'disable', 'confusion', 'screech'] }],
      }),
      makeNpc('cerulean_gym_swimmer_briana', 1, 9, 'RIGHT', 'girl', '⚔️ SWIMMER BRIANA', [
        'Briana: That was a great battle!',
      ], {
        action: 'CERULEAN_GYM_TRAINER',
        trainerId: 'cerulean_gym_briana',
        trainerName: 'Swimmer Briana',
        challengePages: ["BRIANA: Don't let my swimming unnerve you!"],
        team: [
          { speciesId: 'seaking', level: 35, moves: ['surf', 'waterfall', 'hornattack', 'flail'] },
          { speciesId: 'seaking', level: 35, moves: ['surf', 'waterfall', 'supersonic', 'furyattack'] },
        ],
      }),
      makeNpc('cerulean_gym_swimmer_parker', 8, 9, 'LEFT', 'boy', '⚔️ SWIMMER PARKER', [
        'Parker: That was a great battle!',
      ], {
        action: 'CERULEAN_GYM_TRAINER',
        trainerId: 'cerulean_gym_parker',
        trainerName: 'Swimmer Parker',
        challengePages: ["PARKER: Glub! I'm first, come and get me!"],
        team: [
          { speciesId: 'horsea', level: 32, moves: ['surf', 'twister', 'smokescreen', 'leer'] },
          { speciesId: 'horsea', level: 32, moves: ['surf', 'twister', 'bubblebeam', 'agility'] },
          { speciesId: 'seadra', level: 35, moves: ['surf', 'watergun', 'twister', 'dragonbreath'] },
        ],
      }),
      makeNpc('cerulean_gym_guide', 7, 13, 'DOWN', 'boy', '🏋️ GYM GUIDE', [
        'Yo! CHAMP in making!',
        'Since MISTY was away, I went out for some fun too. He-he-he.',
      ], { action: 'CERULEAN_GYM_GUIDE' }),
    ],

    route_24: [
      makeNpc('route_24_rocket_grunt', 11, 8, 'DOWN', 'rocket_grunt_m', '🚀 ROCKET GRUNT', [
        'Hey, kid! Me am a TEAM ROCKET member kind of guy!',
        'If win you do versus me, a man I be and mine secret to you I tell.',
      ], {
        action: 'ROUTE_24_ROCKET_GRUNT',
        trainerId: 'route_24_rocket_grunt',
        trainerName: 'Rocket Grunt',
        challengePages: ['Hey, kid! Battle begin we do!'],
        team: [{ speciesId: 'golbat', level: 30, moves: ['wingattack', 'confuseray', 'bite', 'leechlife'] }],
      }),
    ],

    route_25: [
      makeNpc('route_25_misty', 25, 4, 'DOWN', 'beauty', '🏆 MISTY', [
        'Aaaah! Why did you have to ruin my date?!',
        'Wait! Those are JOHTO GYM BADGES?!',
        "I'm MISTY, the GYM LEADER of CERULEAN! Come to my GYM and prove your skill!",
      ], { action: 'ROUTE_25_MISTY_DATE' }),
      makeNpc('route_25_misty_date', 26, 4, 'LEFT', 'cooltrainer_m', 'BOYFRIEND', [
        'Oh no! Someone saw us! I gotta run!',
      ]),
      makeNpc('route_25_schoolboy_dudley', 12, 8, 'DOWN', 'youngster', '⚔️ DUDLEY', [
        'Dudley: That was a great battle!',
      ], {
        action: 'ROUTE_25_TRAINER',
        trainerId: 'route_25_dudley',
        trainerName: 'Schoolboy Dudley',
        challengePages: ['Beat the six of us trainers to win a fabulous prize!'],
        team: [{ speciesId: 'oddish', level: 35, moves: ['absorb', 'sweetscent', 'poisonpowder', 'acid'] }],
      }),
      makeNpc('route_25_lass_ellen', 16, 11, 'UP', 'lass', '⚔️ ELLEN', [
        'Ellen: That was a great battle!',
      ], {
        action: 'ROUTE_25_TRAINER',
        trainerId: 'route_25_ellen',
        trainerName: 'Lass Ellen',
        challengePages: ["I'm second. Now it gets serious!"],
        team: [
          { speciesId: 'wigglytuff', level: 30, moves: ['sing', 'defensecurl', 'doubleslap', 'bodyslam'] },
          { speciesId: 'granbull', level: 34, moves: ['tackle', 'bite', 'scaryface', 'headbutt'] },
        ],
      }),
      makeNpc('route_25_schoolboy_joe', 21, 8, 'DOWN', 'youngster', '⚔️ JOE', [
        'Joe: That was a great battle!',
      ], {
        action: 'ROUTE_25_TRAINER',
        trainerId: 'route_25_joe',
        trainerName: 'Schoolboy Joe',
        challengePages: ["Here's No. 3! I won't be easy."],
        team: [
          { speciesId: 'tangela', level: 33, moves: ['vinewhip', 'bind', 'poisonpowder', 'absorb'] },
          { speciesId: 'vaporeon', level: 33, moves: ['surf', 'quickattack', 'aurorabeam', 'watergun'] },
        ],
      }),
      makeNpc('route_25_lass_laura', 22, 6, 'RIGHT', 'lass', '⚔️ LAURA', [
        'Laura: That was a great battle!',
      ], {
        action: 'ROUTE_25_TRAINER',
        trainerId: 'route_25_laura',
        trainerName: 'Lass Laura',
        challengePages: ["I'm number four! Let's do this!"],
        team: [
          { speciesId: 'gloom', level: 28, moves: ['absorb', 'sweetscent', 'poisonpowder', 'acid'] },
          { speciesId: 'pidgeotto', level: 31, moves: ['gust', 'quickattack', 'wingattack', 'sandattack'] },
          { speciesId: 'bellossom', level: 31, moves: ['absorb', 'sweetscent', 'petaldance', 'solarbeam'] },
        ],
      }),
      makeNpc('route_25_camper_lloyd', 28, 4, 'DOWN', 'camper', '⚔️ LLOYD', [
        'Lloyd: That was a great battle!',
      ], {
        action: 'ROUTE_25_TRAINER',
        trainerId: 'route_25_lloyd',
        trainerName: 'Camper Lloyd',
        challengePages: ["Here is number five! Don't hold back!"],
        team: [{ speciesId: 'nidoking', level: 34, moves: ['thrash', 'doublekick', 'poisonsting', 'focusenergy'] }],
      }),
      makeNpc('route_25_lass_shannon', 28, 11, 'UP', 'lass', '⚔️ SHANNON', [
        'Shannon: That was a great battle!',
      ], {
        action: 'ROUTE_25_TRAINER',
        trainerId: 'route_25_shannon',
        trainerName: 'Lass Shannon',
        challengePages: ["I'm the sixth trainer! Last one!"],
        team: [
          { speciesId: 'paras', level: 29, moves: ['scratch', 'stunspore', 'poisonpowder', 'leechlife'] },
          { speciesId: 'paras', level: 29, moves: ['scratch', 'spore', 'slash', 'leechlife'] },
          { speciesId: 'parasect', level: 32, moves: ['spore', 'slash', 'growth', 'gigadrain'] },
        ],
      }),
      makeNpc('route_25_super_nerd_pat', 31, 7, 'DOWN', 'super_nerd', '⚔️ PAT', [
        'Pat: That was a great battle!',
      ], {
        action: 'ROUTE_25_TRAINER',
        trainerId: 'route_25_pat',
        trainerName: 'Super Nerd Pat',
        challengePages: ['I love rare POKéMON! Have you seen PORYGON?'],
        team: [{ speciesId: 'porygon', level: 36, moves: ['conversion', 'triattack', 'recover', 'psybeam'] }],
      }),
      makeNpc('route_25_cooltrainer_kevin', 37, 8, 'LEFT', 'cooltrainer_m', 'COOLTRAINER KEVIN', [
        'You defeated the trainers of the Cape! You and your POKéMON are truly outstanding!',
      ]),
    ],

    lavender_radio_tower_1f: [
      makeNpc('lavender_radio_tower_director', 9, 2, 'DOWN', 'gentleman', '📻 DIRECTOR', [
        'Our broadcast antennas cannot transmit without power from the Power Plant!',
      ], { action: 'LAVENDER_RADIO_TOWER_DIRECTOR' }),
      makeNpc('lavender_radio_tower_receptionist', 2, 3, 'DOWN', 'receptionist', 'RECEPTIONIST', [
        'Welcome to KANTO RADIO TOWER! We broadcast programs throughout Kanto!',
      ]),
      makeNpc('lavender_radio_tower_super_nerd', 15, 3, 'LEFT', 'super_nerd', 'SUPER NERD', [
        'Our transmitter requires an EXPN CARD in your POKéGEAR to receive our radio signals.',
      ]),
    ],

    route_5: [
      makeNpc('route_5_pokefan_m', 17, 16, 'DOWN', 'pokefan_m', 'POKéFAN', [
        'The Underground Path connects Route 5 directly south to Route 6!',
      ]),
    ],

    route_5_saffron_gate: [
      makeNpc('route_5_saffron_gate_officer', 0, 4, 'RIGHT', 'officer', '👮 OFFICER', [
        'Welcome to SAFFRON CITY north gate. Please enjoy your stay!',
      ]),
    ],

    route_5_cleanse_tag_house: [
      makeNpc('route_5_cleanse_tag_grandma', 2, 3, 'DOWN', 'teacher', '👵 GRANDMA', [
        'A mysterious charm that repels wild POKéMON.',
      ], { action: 'ROUTE_5_CLEANSE_TAG_GRANDMA' }),
      makeNpc('route_5_cleanse_tag_teacher', 5, 3, 'LEFT', 'teacher', 'TEACHER', [
        'Grandma knows all about mysterious charms and talismans that ward off wild POKéMON.',
      ]),
    ],

    bills_house: [
      makeNpc('bills_house_gramps', 2, 3, 'UP', 'gramps', "👴 BILL'S GRANDPA", [
        'My grandson BILL is over in JOHTO visiting Goldenrod City right now!',
      ]),
    ],

    route_5_underground_entrance: [
      makeNpc('route_5_underground_teacher', 2, 2, 'DOWN', 'teacher', 'TEACHER', [
        'The Underground Path runs right underneath Saffron City all the way south to Route 6.',
      ]),
    ],
  };
}
