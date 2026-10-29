/**
 * @fileoverview kantoVermilionNpcs domain module implementation.
 * @module world/npcs/kantoVermilionNpcs
 * @role Vermilion City, Vermilion Port & S.S. Aqua Fast Ship NPCs Component
 * @exports createKantoVermilionNpcs
 * @layer world
 * @sections L1-20: Micro-Header & Imports | L21-120: Vermilion City & Port NPCs | L121-180: S.S. Aqua NPCs
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

/**
 * Creates NPC lists for Vermilion City, Vermilion Port, and S.S. Aqua Fast Ship.
 */
export function createKantoVermilionNpcs(): Record<string, GridEntity[]> {
  return {
    vermilion_city: [
      makeNpc('vermilion_city_teacher', 18, 9, 'DOWN', 'teacher', '👩 TEACHER', [
        "VERMILION PORT is KANTO's seaside gateway!",
        'The FAST SHIP S.S. AQUA docks here regularly from JOHTO.',
      ]),
      makeNpc('vermilion_city_machop_owner', 23, 6, 'RIGHT', 'gramps', '👴 LAND OWNER', [
        'My MACHOP is leveling the ground for a new building!',
        'Hard work builds character, just like training POKéMON!',
      ]),
      makeNpc('vermilion_city_machop', 26, 7, 'LEFT', 'fat_man', '🥊 MACHOP', [
        'MACHOP: Guo! Guoogwroo!',
        'MACHOP is stomping down the soil with all its might!',
      ]),
      makeNpc('vermilion_city_super_nerd', 14, 16, 'DOWN', 'super_nerd', '👓 SUPER NERD', [
        'There are eight GYMS in KANTO, each led by an extraordinary trainer!',
        'VERMILION GYM is right here in town, led by LT. SURGE, the Lightning American!',
      ]),
      makeNpc('vermilion_city_badge_guy', 31, 12, 'DOWN', 'pokefan_m', '🧢 POKéFAN', [
        'The GYM LEADERS of KANTO have honed their skills over many years.',
        'You will need supreme tactics and high-level POKéMON to collect all eight badges!',
      ]),
      makeNpc(
        'vermilion_city_snorlax',
        34,
        8,
        'DOWN',
        'boulder',
        '💤 SNORLAX',
        [
          'SNORLAX is snoring peacefully in front of the cave entrance...',
          'It is fast asleep and completely unresponsive! A POKéGEAR broadcast might wake it up.',
        ],
        { action: 'SNORLAX_OBSTACLE' }
      ),
      makeNpc(
        'vermilion_city_cut_tree',
        10,
        20,
        'DOWN',
        'fruit_tree',
        '🌳 CUTTABLE TREE',
        ['This tree looks like it can be CUT down!'],
        { action: 'VERMILION_CUT_TREE' }
      ),
    ],

    vermilion_gym: [
      makeNpc(
        'vermilion_gym_guide',
        2,
        16,
        'UP',
        'fat_man',
        '🏆 GYM GUIDE',
        [
          'Yo, CHAMP in making!',
          'LT. SURGE is known as the LIGHTNING AMERICAN! His electric Pokémon pack serious voltage!',
          'Ground-type Pokémon are immune to electric attacks, making them your secret weapon!',
        ],
        { action: 'VERMILION_GYM_GUIDE' }
      ),
      makeNpc(
        'vermilion_gym_juggler_horton',
        8,
        8,
        'LEFT',
        'juggler',
        '🤹 JUGGLER HORTON',
        ['Shocking! My balls dropped completely out of rhythm!'],
        {
          action: 'VERMILION_GYM_TRAINER',
          trainerId: 'juggler_horton',
          trainerName: 'Juggler Horton',
          challengePages: ['I may look like a clown, but my electric POKéMON are terrifyingly fast!'],
          trainerTeam: [
            { speciesId: 'electrode', level: 33, moves: ['screech', 'sonicboom', 'rollout', 'spark'] },
            { speciesId: 'electrode', level: 33, moves: ['screech', 'sonicboom', 'rollout', 'spark'] },
            { speciesId: 'electrode', level: 33, moves: ['screech', 'sonicboom', 'rollout', 'spark'] },
          ],
        }
      ),
      makeNpc(
        'vermilion_gym_gentleman_gregory',
        2,
        8,
        'RIGHT',
        'gentleman',
        '🎩 GENTLEMAN GREGORY',
        ['Most splendid! A truly dazzling demonstration of skill!'],
        {
          action: 'VERMILION_GYM_TRAINER',
          trainerId: 'gentleman_gregory',
          trainerName: 'Gentleman Gregory',
          challengePages: ['You stepped right into our electric domain, young traveler!'],
          trainerTeam: [
            { speciesId: 'pikachu', level: 37, moves: ['thunderbolt', 'quickattack', 'thunderwave', 'slam'] },
            { speciesId: 'flaaffy', level: 33, moves: ['thundershock', 'tackle', 'cottonspore', 'thunderpunch'] },
          ],
        }
      ),
      makeNpc(
        'vermilion_gym_guitarist_vincent',
        5,
        12,
        'UP',
        'super_nerd',
        '🎸 GUITARIST VINCENT',
        ['Burned out... My amp blew a master fuse!'],
        {
          action: 'VERMILION_GYM_TRAINER',
          trainerId: 'guitarist_vincent',
          trainerName: 'Guitarist Vincent',
          challengePages: ['Listen to the screaming electric riffs of my rock-and-roll team!'],
          trainerTeam: [
            { speciesId: 'magnemite', level: 27, moves: ['thundershock', 'tackle', 'sonicboom', 'supersonic'] },
            { speciesId: 'voltorb', level: 32, moves: ['screech', 'sonicboom', 'spark', 'tackle'] },
            { speciesId: 'magnemite', level: 32, moves: ['thundershock', 'sonicboom', 'swift', 'lockon'] },
            { speciesId: 'magneton', level: 32, moves: ['zapcannon', 'sonicboom', 'triattack', 'supersonic'] },
          ],
        }
      ),
      makeNpc(
        'vermilion_gym_surge',
        5,
        2,
        'DOWN',
        'officer',
        '⚡ LT. SURGE',
        [
          'Hey, you little tyke! I have to hand it to you. It may not be very smart to challenge me, but it takes guts!',
          "When it comes to electric POKéMON, I'm number one! I've never lost on the battlefield.",
          "I'll zap you just like I did my enemies in war!",
        ],
        {
          action: 'SURGE_EVENT',
          trainerId: 'surge',
          trainerName: 'Lt. Surge',
          challengePages: [
            'Hey, you little tyke! I have to hand it to you. It may not be very smart to challenge me, but it takes guts!',
            "When it comes to electric POKéMON, I'm number one! I've never lost on the battlefield.",
            "I'll zap you just like I did my enemies in war!",
          ],
          trainerTeam: [
            { speciesId: 'raichu', level: 44, moves: ['thunderbolt', 'quickattack', 'thunderwave', 'doubleteam'] },
            { speciesId: 'electrode', level: 40, moves: ['screech', 'swift', 'doubleteam', 'thunder'] },
            { speciesId: 'magneton', level: 40, moves: ['zapcannon', 'swift', 'lockon', 'supersonic'] },
            { speciesId: 'electrode', level: 40, moves: ['screech', 'swift', 'doubleteam', 'thunder'] },
            { speciesId: 'electabuzz', level: 46, moves: ['thunderpunch', 'quickattack', 'leer', 'lightscreen'] },
          ],
        }
      ),
    ],

    pokemon_fan_club: [
      makeNpc(
        'fan_club_chairman',
        3,
        1,
        'DOWN',
        'gentleman',
        '🎩 CHAIRMAN',
        [
          "I'm the Chairman of the POKéMON FAN CLUB! Did you know? RAPIDASH is my absolute favorite POKéMON!",
          "It's so cute... so sweet... yet fiery and noble! When it gallops, it's like a shooting star in the night sky!",
          "Hugging it while sleeping is so warm, though you might singe your pajamas if you're not careful!",
          "Ah! For listening so patiently to an old man's rambling, please take this!",
        ],
        { action: 'FAN_CLUB_CHAIRMAN' }
      ),
      makeNpc(
        'fan_club_clefairy_guy',
        7,
        4,
        'LEFT',
        'fat_man',
        '🧸 CLEFAIRY GUY',
        [
          'I just love CLEFAIRY! Their sweet little wagging fingers and plush faces are simply irresistible!',
        ],
        { action: 'FAN_CLUB_CLEFAIRY_GUY' }
      ),
      makeNpc(
        'fan_club_seel_fan',
        2,
        3,
        'RIGHT',
        'teacher',
        '👧 SEEL FAN',
        ['My SEEL loves swimming along the Vermilion harbor! Its sleek white coat glistens under the sunlight!'],
        { action: 'FAN_CLUB_SEEL_FAN' }
      ),
      makeNpc(
        'fan_club_rapidash',
        4,
        1,
        'DOWN',
        'fat_man',
        '🐴 RAPIDASH',
        ['RAPIDASH: Hii-ii-iin! Its blazing mane crackles with warm ember energy!']
      ),
    ],

    vermilion_fishing_house: [
      makeNpc(
        'vermilion_fishing_dude',
        2,
        3,
        'RIGHT',
        'fisherman',
        '🎣 FISHING DUDE',
        [
          'I am the FISHING DUDE, the oldest of the legendary FISHING BROTHERS!',
          'The seas around KANTO are filled with magnificent aquatic POKéMON!',
        ]
      ),
    ],

    vermilion_magnet_train_house: [
      makeNpc(
        'vermilion_magnet_train_fan',
        2,
        3,
        'RIGHT',
        'super_nerd',
        '🚄 TRAIN FAN',
        [
          'The MAGNET TRAIN connects Saffron City in KANTO to Goldenrod City in JOHTO!',
          'It travels faster than a Pidgeot in full dive!',
        ]
      ),
    ],

    vermilion_digletts_house: [
      makeNpc(
        'vermilion_digletts_fan',
        2,
        3,
        'RIGHT',
        'fat_man',
        '⛏️ DIGLETT LOVER',
        [
          "DIGLETT'S CAVE connects Vermilion City to Route 2!",
          'The DIGLETT dug that entire tunnel all by themselves!',
        ]
      ),
    ],

    vermilion_port: [
      makeNpc(
        'vermilion_port_sailor',
        8,
        11,
        'LEFT',
        'fisherman',
        '⚓ SAILOR',
        [
          'Welcome to VERMILION PORT!',
          'FAST SHIP S.S. AQUA sails between here and OLIVINE CITY in JOHTO.',
          'Step aboard whenever you are ready to embark on a voyage!',
        ],
        { action: 'VERMILION_PORT_SAILOR' }
      ),
      makeNpc('vermilion_port_sailor_1', 6, 11, 'RIGHT', 'fisherman', '⚓ SAILOR', [
        'The sea air in Kanto feels wonderfully refreshing after a long voyage.',
      ]),
      makeNpc('vermilion_port_super_nerd_2', 11, 11, 'LEFT', 'super_nerd', '👓 TOURIST', [
        'I came all the way from Goldenrod City on the S.S. AQUA! What an exquisite luxury cruise!',
      ]),
    ],

    vermilion_port_passage: [
      makeNpc('vermilion_port_passage_teacher_0', 17, 1, 'LEFT', 'teacher', '👩 ATTENDANT', [
        'Welcome to KANTO! VERMILION CITY is just beyond this passage to the north.',
      ]),
    ],

    fast_ship_1f: [
      makeNpc(
        'fast_ship_1f_sailor_0',
        24,
        2,
        'RIGHT',
        'fisherman',
        '⚓ SAILOR',
        [
          'FAST SHIP S.S. AQUA is en route to VERMILION CITY.',
          'We will make an announcement when we arrive.',
        ],
        { action: 'FAST_SHIP_SAILOR_EXIT' }
      ),
      makeNpc(
        'fast_ship_1f_gentleman_3',
        19,
        6,
        'RIGHT',
        'fat_man',
        '👴 WORRIED GENTLEMAN',
        [
          'Oh dear, oh dear! Where did my little granddaughter wander off to?',
          'Please help an old man find her on this huge ship!',
        ],
        { action: 'FAST_SHIP_GRANDPA' }
      ),
    ],

    fast_ship_cabins_se_sse_captains_cabin: [
      makeNpc(
        'fast_ship_cabins_se_sse_captains_cabin_twin_2',
        2,
        25,
        'DOWN',
        'girl',
        '👧 LITTLE GIRL',
        [
          "I'm playing with the Captain! ...Oh? Grandpa is worried about me? I'd better get back to our cabin right away!",
        ],
        { action: 'FAST_SHIP_GRANDDAUGHTER' }
      ),
      makeNpc(
        'fast_ship_cabins_se_sse_captains_cabin_gentleman_0',
        2,
        17,
        'RIGHT',
        'fat_man',
        '👨‍✈️ SHIP CAPTAIN',
        [
          'Ahoy! I was just keeping this little girl entertained while her grandfather was busy.',
        ],
        { action: 'FAST_SHIP_CAPTAIN' }
      ),
      makeNpc(
        'fast_ship_cabins_se_sse_captains_cabin_gentleman_cabin',
        2,
        5,
        'DOWN',
        'fat_man',
        '👴 REUNITED GENTLEMAN',
        ['My granddaughter is safe! Thank you so much!'],
        { action: 'FAST_SHIP_GRANDPA_CABIN' }
      ),
      makeNpc(
        'fast_ship_cabins_se_sse_captains_cabin_twin_cabin',
        3,
        5,
        'DOWN',
        'girl',
        '👧 REUNITED GIRL',
        ['Grandpa was so relieved! Thank you for finding me!'],
        { action: 'FAST_SHIP_GRANDDAUGHTER_CABIN' }
      ),
    ],
  };
}
