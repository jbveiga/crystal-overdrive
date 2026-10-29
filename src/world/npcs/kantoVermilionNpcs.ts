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
