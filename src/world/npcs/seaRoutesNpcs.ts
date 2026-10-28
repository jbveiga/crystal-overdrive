/**
 * @fileoverview seaRoutesNpcs domain module implementation for Route 40 and Route 41.
 * @module world/npcs/seaRoutesNpcs
 * @role seaRoutesNpcs Component
 * @exports createSeaRoutesNpcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-120: Route 40 & Gate | L121-240: Route 41 Swimmers
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createSeaRoutesNpcs(): Record<string, GridEntity[]> {
  return {
    route_40: [
      makeNpc('monica_of_monday', 8, 10, 'DOWN', 'girl', '🎀 MONICA OF MONDAY', 
        [
          "MONICA: Hello! I'm MONICA of Monday! As a token of friendship, please take this!",
          "It's a SHARP BEAK! It boosts the power of FLYING-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
      makeNpc('route_40_lass1', 11, 13, 'DOWN', 'girl', '👧 LASS', [
        "Although you can't see it from here, CIANWOOD is across the sea.",
      ]),
      makeNpc('route_40_pokefan_m', 7, 6, 'DOWN', 'pokefan_m', '🧢 POKéFAN', [
        "Hm! There's a big building up ahead! What is it?",
      ]),
      makeNpc('route_40_lass2', 13, 4, 'DOWN', 'girl', '👧 LASS', [
        'I came to OLIVINE by ship to see the sights and soak up the atmosphere. Being a port, it feels so different from a big city.',
      ]),
      makeNpc('route_40_standing_youngster', 16, 9, 'DOWN', 'youngster', '👦 YOUNGSTER', [
        'Have you gone to the BATTLE TOWER? I think a lot of tough trainers have gathered there already.',
      ]),
      makeNpc('swimmerm_simon', 14, 15, 'RIGHT', 'boy', '🏊 SWIMMER SIMON', [
        'CIANWOOD CITY is a good distance away from here.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerm_simon',
        trainerName: 'Swimmer Simon',
        visionRange: 4,
        challengePages: ["SIMON: You have to warm up before going into the water. That's basic."],
        trainerPokemon: { speciesId: 'tentacool', level: 20, moves: ['poisonsting', 'supersonic', 'constrict', 'acid'] },
        trainerTeam: [
          { speciesId: 'tentacool', level: 20, moves: ['poisonsting', 'supersonic', 'constrict', 'acid'] },
          { speciesId: 'tentacool', level: 20, moves: ['poisonsting', 'supersonic', 'constrict', 'acid'] },
        ],
      }),
      makeNpc('swimmerm_randall', 18, 30, 'LEFT', 'boy', '🏊 SWIMMER RANDALL', [
        'Swimming exercises your entire body. It’s healthy.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerm_randall',
        trainerName: 'Swimmer Randall',
        visionRange: 5,
        challengePages: ["RANDALL: Hey, you're young and fit! Don't ride your POKéMON! Swim!"],
        trainerPokemon: { speciesId: 'shellder', level: 18, moves: ['tackle', 'withdraw', 'iciclespear'] },
        trainerTeam: [
          { speciesId: 'shellder', level: 18, moves: ['tackle', 'withdraw', 'iciclespear'] },
          { speciesId: 'wartortle', level: 20, moves: ['tackle', 'tailwhip', 'bubble', 'watergun'] },
          { speciesId: 'shellder', level: 18, moves: ['tackle', 'withdraw', 'iciclespear'] },
        ],
      }),
      makeNpc('swimmerf_elaine', 3, 19, 'RIGHT', 'girl', '🏊‍♀️ SWIMMER ELAINE', [
        "I'd say I'm a better swimmer than you. Yeah!",
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerf_elaine',
        trainerName: 'Swimmer Elaine',
        visionRange: 4,
        challengePages: ['ELAINE: Are you going to CIANWOOD? How about a quick battle first?'],
        trainerPokemon: { speciesId: 'staryu', level: 21, moves: ['tackle', 'watergun', 'recover', 'swift'] },
        trainerTeam: [
          { speciesId: 'staryu', level: 21, moves: ['tackle', 'watergun', 'recover', 'swift'] },
        ],
      }),
      makeNpc('swimmerf_paula', 10, 25, 'DOWN', 'girl', '🏊‍♀️ SWIMMER PAULA', [
        'While I float like this, the waves carry me along.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerf_paula',
        trainerName: 'Swimmer Paula',
        visionRange: 3,
        challengePages: ["PAULA: No inner tube for me. I'm hanging on to a sea POKéMON!"],
        trainerPokemon: { speciesId: 'staryu', level: 19, moves: ['watergun', 'swift', 'recover', 'tackle'] },
        trainerTeam: [
          { speciesId: 'staryu', level: 19, moves: ['watergun', 'swift', 'recover', 'tackle'] },
          { speciesId: 'shellder', level: 19, moves: ['tackle', 'withdraw', 'iciclespear'] },
        ],
      }),
    ],

    route_40_battle_tower_gate: [
      makeNpc('route_40_gate_officer', 5, 2, 'DOWN', 'officer', '👮 GATE OFFICER', [
        'Beyond lies the BATTLE TOWER, where elite trainers test their bonds! It is currently undergoing preparations for the grand championship.',
      ]),
    ],

    route_41: [
      makeNpc('swimmerm_charlie', 32, 6, 'DOWN', 'boy', '🏊 SWIMMER CHARLIE', [
        'Isn’t it relaxing just floating like this?',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerm_charlie',
        trainerName: 'Swimmer Charlie',
        visionRange: 3,
        challengePages: ["CHARLIE: The water's warm here. I'm loose and limber. Sure, I'll take you on!"],
        trainerPokemon: { speciesId: 'shellder', level: 21, moves: ['tackle', 'withdraw', 'iciclespear', 'aurorabeam'] },
        trainerTeam: [
          { speciesId: 'shellder', level: 21, moves: ['tackle', 'withdraw', 'iciclespear', 'aurorabeam'] },
          { speciesId: 'tentacool', level: 19, moves: ['poisonsting', 'supersonic', 'constrict', 'acid'] },
          { speciesId: 'tentacruel', level: 19, moves: ['poisonsting', 'supersonic', 'constrict', 'acid'] },
        ],
      }),
      makeNpc('swimmerm_george', 46, 8, 'DOWN', 'boy', '🏊 SWIMMER GEORGE', [
        "It's so far to CIANWOOD. But it's no easy return trip to OLIVINE either. What should I do?",
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerm_george',
        trainerName: 'Swimmer George',
        visionRange: 3,
        challengePages: ["GEORGE: I'm a bit tired. If I win, lend me your POKéMON."],
        trainerPokemon: { speciesId: 'tentacool', level: 16, moves: ['poisonsting', 'supersonic', 'constrict'] },
        trainerTeam: [
          { speciesId: 'tentacool', level: 16, moves: ['poisonsting', 'supersonic', 'constrict'] },
          { speciesId: 'tentacool', level: 17, moves: ['poisonsting', 'supersonic', 'constrict'] },
          { speciesId: 'tentacool', level: 16, moves: ['poisonsting', 'supersonic', 'constrict'] },
          { speciesId: 'staryu', level: 19, moves: ['tackle', 'watergun', 'recover'] },
          { speciesId: 'tentacool', level: 17, moves: ['poisonsting', 'supersonic', 'constrict', 'acid'] },
          { speciesId: 'remoraid', level: 19, moves: ['watergun', 'lockon', 'psybeam', 'aurorabeam'] },
        ],
      }),
      makeNpc('swimmerm_berke', 20, 26, 'DOWN', 'boy', '🏊 SWIMMER BERKE', [
        'It was a dark and stormy night… I saw this giant POKéMON flying from the islands. It was scattering feathers from its silver wings.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerm_berke',
        trainerName: 'Swimmer Berke',
        visionRange: 3,
        challengePages: ['BERKE: See those islands that are blocked by whirlpools? There just has to be a secret!'],
        trainerPokemon: { speciesId: 'qwilfish', level: 23, moves: ['spikes', 'pinmissile', 'poisonsting', 'watergun'] },
        trainerTeam: [
          { speciesId: 'qwilfish', level: 23, moves: ['spikes', 'pinmissile', 'poisonsting', 'watergun'] },
        ],
      }),
      makeNpc('swimmerm_kirk', 32, 30, 'DOWN', 'boy', '🏊 SWIMMER KIRK', [
        'The currents keep me from reaching that island.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerm_kirk',
        trainerName: 'Swimmer Kirk',
        visionRange: 3,
        challengePages: ['KIRK: The waves are wild here. They tire you out while you swim.'],
        trainerPokemon: { speciesId: 'gyarados', level: 20, moves: ['bite', 'dragonrage', 'leer', 'twister'] },
        trainerTeam: [
          { speciesId: 'gyarados', level: 20, moves: ['bite', 'dragonrage', 'leer', 'twister'] },
          { speciesId: 'gyarados', level: 20, moves: ['bite', 'dragonrage', 'leer', 'twister'] },
        ],
      }),
      makeNpc('swimmerm_mathew', 19, 46, 'DOWN', 'boy', '🏊 SWIMMER MATHEW', [
        "A secret about WHIRL ISLANDS… It's pitch-black inside!",
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerm_mathew',
        trainerName: 'Swimmer Mathew',
        visionRange: 3,
        challengePages: ['MATHEW: Are you seeking the secrets of WHIRL ISLANDS?'],
        trainerPokemon: { speciesId: 'krabby', level: 23, moves: ['bubble', 'vicegrip', 'leer', 'harden'] },
        trainerTeam: [
          { speciesId: 'krabby', level: 23, moves: ['bubble', 'vicegrip', 'leer', 'harden'] },
        ],
      }),
      makeNpc('swimmerf_kaylee', 17, 4, 'DOWN', 'girl', '🏊‍♀️ SWIMMER KAYLEE', [
        'There is supposed to be a big POKéMON deep beneath WHIRL ISLANDS. I wonder what it could be?',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerf_kaylee',
        trainerName: 'Swimmer Kaylee',
        visionRange: 3,
        challengePages: ["KAYLEE: I'm on my way to WHIRL ISLANDS. I'm going exploring with friends."],
        trainerPokemon: { speciesId: 'goldeen', level: 18, moves: ['peck', 'tailwhip', 'supersonic'] },
        trainerTeam: [
          { speciesId: 'goldeen', level: 18, moves: ['peck', 'tailwhip', 'supersonic'] },
          { speciesId: 'goldeen', level: 20, moves: ['peck', 'tailwhip', 'supersonic', 'hornattack'] },
          { speciesId: 'seaking', level: 20, moves: ['peck', 'tailwhip', 'supersonic', 'hornattack'] },
        ],
      }),
      makeNpc('swimmerf_susie', 23, 19, 'UP', 'girl', '🏊‍♀️ SWIMMER SUSIE', [
        'Wasn’t there a hit song about a boy riding a LAPRAS?',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerf_susie',
        trainerName: 'Swimmer Susie',
        visionRange: 3,
        challengePages: ['SUSIE: You look so elegant, riding your POKéMON.'],
        trainerPokemon: { speciesId: 'psyduck', level: 20, moves: ['scratch', 'tailwhip', 'disable', 'confusion'] },
        trainerTeam: [
          { speciesId: 'psyduck', level: 20, moves: ['scratch', 'tailwhip', 'disable', 'confusion'] },
          { speciesId: 'goldeen', level: 22, moves: ['peck', 'tailwhip', 'supersonic', 'hornattack'] },
        ],
      }),
      makeNpc('swimmerf_denise', 27, 34, 'LEFT', 'girl', '🏊‍♀️ SWIMMER DENISE', [
        'A sunburn is the worst for skin. But I don’t use a sunblock. I won’t pollute the water.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerf_denise',
        trainerName: 'Swimmer Denise',
        visionRange: 3,
        challengePages: ['DENISE: The weather is so beautiful, I am in a daze!'],
        trainerPokemon: { speciesId: 'seel', level: 22, moves: ['headbutt', 'growl', 'aurorabeam', 'rest'] },
        trainerTeam: [
          { speciesId: 'seel', level: 22, moves: ['headbutt', 'growl', 'aurorabeam', 'rest'] },
        ],
      }),
      makeNpc('swimmerf_kara', 44, 28, 'RIGHT', 'girl', '🏊‍♀️ SWIMMER KARA', [
        'I heard roars from deep inside the ISLANDS.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerf_kara',
        trainerName: 'Swimmer Kara',
        visionRange: 4,
        challengePages: ['KARA: If you need to rest, just tread water. You will get your wind back!'],
        trainerPokemon: { speciesId: 'staryu', level: 20, moves: ['tackle', 'watergun', 'recover', 'swift'] },
        trainerTeam: [
          { speciesId: 'staryu', level: 20, moves: ['tackle', 'watergun', 'recover', 'swift'] },
          { speciesId: 'starmie', level: 20, moves: ['watergun', 'swift', 'recover', 'rapidspin'] },
        ],
      }),
      makeNpc('swimmerf_wendy', 9, 50, 'DOWN', 'girl', '🏊‍♀️ SWIMMER WENDY', [
        'The clusters of STARYU light up at the same time. It’s so beautiful, it’s scary.',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmerf_wendy',
        trainerName: 'Swimmer Wendy',
        visionRange: 2,
        challengePages: ["WENDY: At night, STARYU gather near the water's surface."],
        trainerPokemon: { speciesId: 'horsea', level: 21, moves: ['bubble', 'smokescreen', 'leer', 'watergun'] },
        trainerTeam: [
          { speciesId: 'horsea', level: 21, moves: ['bubble', 'smokescreen', 'leer', 'watergun'] },
          { speciesId: 'horsea', level: 21, moves: ['dragonrage', 'smokescreen', 'leer', 'watergun'] },
        ],
      }),
    ],

    whirl_island_lugia_chamber: [
      makeNpc(
        'whirl_island_lugia',
        9,
        9,
        'DOWN',
        'lapras',
        '🌊 LUGIA',
        ['Gyaoooon!'],
        { action: 'LUGIA_BOSS_EVENT' }
      ),
    ],

    whirl_island_b1f: [
      makeNpc(
        'whirl_islands_lore_sage',
        23,
        27,
        'DOWN',
        'super_nerd',
        '🧭 CAVE EXPLORER',
        ['EXPLORER: These sea caverns are a treacherous labyrinth beneath Route 41.'],
        { action: 'WHIRL_ISLAND_LORE_EVENT' }
      ),
    ],
  };
}
