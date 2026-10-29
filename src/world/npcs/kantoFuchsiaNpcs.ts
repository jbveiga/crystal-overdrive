/**
 * @fileoverview Handcrafted canonical NPCs for Route 16, Cycling Road (Route 17),
 * Route 18, Fuchsia City, Fuchsia Gym, and Safari Zone Warden's Home.
 * @module world/npcs/kantoFuchsiaNpcs
 * @role NPC Definition Module
 * @exports createKantoFuchsiaNpcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-95: Fuchsia Gym & Janine | L96-170: Cycling Road & Route 18 | L171-250: Fuchsia City & Landmarks
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createKantoFuchsiaNpcs(): Record<string, GridEntity[]> {
  return {
    fuchsia_gym: [
      makeNpc(
        'fuchsia_gym_janine',
        1,
        10,
        'DOWN',
        'beauty',
        '🏆 LEADER JANINE',
        [
          "Fufufufu... I'm JANINE, the real GYM LEADER!",
          'My father is KOGA of the ELITE FOUR. I am training hard to surpass my father ninja techniques and poison skills!',
          'You will never see through my illusions and venomous arts! Prepare yourself!',
        ],
        {
          action: 'JANINE_EVENT',
          trainerId: 'janine',
          trainerName: 'Leader Janine',
          team: [
            { speciesId: 'crobat', level: 36, moves: ['confuseray', 'screech', 'leechlife', 'wingattack'] },
            { speciesId: 'weezing', level: 36, moves: ['sludgebomb', 'smog', 'toxic', 'explosion'] },
            { speciesId: 'weezing', level: 36, moves: ['sludgebomb', 'smog', 'toxic', 'explosion'] },
            { speciesId: 'ariados', level: 33, moves: ['scaryface', 'gigadrain', 'stringshot', 'nightshade'] },
            { speciesId: 'venomoth', level: 39, moves: ['gust', 'supersonic', 'toxic', 'psychic'] },
          ],
        }
      ),
      makeNpc(
        'fuchsia_gym_alice',
        5,
        7,
        'DOWN',
        'beauty',
        '🏆 LEADER JANINE',
        ["Fufufu! I'm JANINE, the GYM LEADER! ...Gotcha! I'm just a decoy!"],
        {
          action: 'FUCHSIA_GYM_DECOY',
          trainerId: 'fuchsia_gym_alice',
          trainerName: 'Lass Alice',
          defeatPages: ['Aww, you saw right through my illusion! The real JANINE is much stealthier!'],
          team: [
            { speciesId: 'gloom', level: 30 },
            { speciesId: 'arbok', level: 34 },
            { speciesId: 'vileplume', level: 30 },
          ],
        }
      ),
      makeNpc(
        'fuchsia_gym_linda',
        5,
        11,
        'DOWN',
        'beauty',
        '🏆 LEADER JANINE',
        ["Fooled you! You thought I was JANINE? Too bad, I'm LINDA!"],
        {
          action: 'FUCHSIA_GYM_DECOY',
          trainerId: 'fuchsia_gym_linda',
          trainerName: 'Lass Linda',
          defeatPages: ['Well done! Can you find the real JANINE in this maze?'],
          team: [
            { speciesId: 'bulbasaur', level: 30 },
            { speciesId: 'ivysaur', level: 32 },
            { speciesId: 'venusaur', level: 34 },
          ],
        }
      ),
      makeNpc(
        'fuchsia_gym_cindy',
        9,
        4,
        'DOWN',
        'beauty',
        '🏆 LEADER JANINE',
        ["I'm JANINE! How dare you challenge me! ...Just kidding! I'm CINDY!"],
        {
          action: 'FUCHSIA_GYM_DECOY',
          trainerId: 'fuchsia_gym_cindy',
          trainerName: 'Picnicker Cindy',
          defeatPages: ['My poison power was not enough! The real JANINE is somewhere deeper!'],
          team: [
            { speciesId: 'nidoqueen', level: 36 },
          ],
        }
      ),
      makeNpc(
        'fuchsia_gym_barry',
        4,
        2,
        'DOWN',
        'beauty',
        '🏆 LEADER JANINE',
        ["Fufufufu! I am JANINE! Wait, do I look convincing in this ninja disguise?"],
        {
          action: 'FUCHSIA_GYM_DECOY',
          trainerId: 'fuchsia_gym_barry',
          trainerName: 'Camper Barry',
          defeatPages: ['Drat! Disguising as a girl ninja is harder than it looks!'],
          team: [
            { speciesId: 'nidoking', level: 36 },
          ],
        }
      ),
      makeNpc(
        'fuchsia_gym_guide',
        7,
        15,
        'DOWN',
        'boy',
        '🏋️ GYM GUIDE',
        [
          'Yo, CHAMP in making! Whoops! Take a good look around you.',
          'The trainers all look like JANINE! Which one is the real JANINE? You will have to see through their illusions!',
        ],
        { action: 'FUCHSIA_GYM_GUIDE' }
      ),
    ],

    route_16_fuchsia_speech_house: [
      makeNpc(
        'route_16_recluse',
        2,
        3,
        'DOWN',
        'fat_man',
        '🧔 RECLUSE',
        [
          'Ah, a visitor... It is so peaceful living out here away from the hustle of the city.',
          'I found this technique while meditating in solitude. Here, take it!',
        ],
        { action: 'ROUTE_16_RECLUSE' }
      ),
    ],

    safari_zone_wardens_home: [
      makeNpc(
        'safari_zone_granddaughter',
        2,
        4,
        'RIGHT',
        'girl',
        '👧 GRANDDAUGHTER',
        [
          'My grandpa is the SAFARI ZONE WARDEN, but he is travelling abroad right now.',
          'Because he is away, the SAFARI ZONE is temporarily closed.',
        ],
        { action: 'WARDEN_GRANDDAUGHTER' }
      ),
    ],

    route_17: [
      makeNpc(
        'route_17_biker_riley',
        4,
        17,
        'DOWN',
        'boy',
        '🏍️ BIKER RILEY',
        ["Hey! Don't get in my way when I am riding down the slope!"],
        {
          action: 'BIKER_TRAINER',
          trainerId: 'route_17_biker_riley',
          trainerName: 'Biker Riley',
          visionRange: 4,
          defeatPages: ['Whoa, you blew past me like a gust of wind!'],
          team: [{ speciesId: 'weezing', level: 34 }],
        }
      ),
      makeNpc(
        'route_17_biker_glenn',
        3,
        53,
        'DOWN',
        'boy',
        '🏍️ BIKER GLENN',
        ['Feel the rush! CYCLING ROAD is made for pure downhill speed!'],
        {
          action: 'BIKER_TRAINER',
          trainerId: 'route_17_biker_glenn',
          trainerName: 'Biker Glenn',
          visionRange: 3,
          defeatPages: ['My engine sputtered out... Good race, kid!'],
          team: [
            { speciesId: 'koffing', level: 28 },
            { speciesId: 'magmar', level: 32 },
            { speciesId: 'weezing', level: 32 },
          ],
        }
      ),
      makeNpc(
        'route_17_biker_joel',
        9,
        68,
        'DOWN',
        'boy',
        '🏍️ BIKER JOEL',
        ['Nobody rides this highway without paying tribute in battle!'],
        {
          action: 'BIKER_TRAINER',
          trainerId: 'route_17_biker_joel',
          trainerName: 'Biker Joel',
          visionRange: 1,
          defeatPages: ["Burnt out completely! You're something else!"],
          team: [
            { speciesId: 'magmar', level: 32 },
            { speciesId: 'magmar', level: 32 },
          ],
        }
      ),
      makeNpc(
        'route_17_biker_charles',
        6,
        79,
        'RIGHT',
        'boy',
        '🏍️ BIKER CHARLES',
        ["Bikers rule the slopes! Let's see if your team has the grit!"],
        {
          action: 'BIKER_TRAINER',
          trainerId: 'route_17_biker_charles',
          trainerName: 'Biker Charles',
          visionRange: 4,
          defeatPages: ['Crash and burn! Your skills are top notch!'],
          team: [
            { speciesId: 'koffing', level: 30 },
            { speciesId: 'weezing', level: 30 },
            { speciesId: 'weezing', level: 30 },
          ],
        }
      ),
    ],

    route_18: [
      makeNpc(
        'route_18_bird_keeper_boris',
        9,
        12,
        'DOWN',
        'boy',
        '🦅 BIRD KEEPER BORIS',
        ['My flying partners soar above CYCLING ROAD!'],
        {
          action: 'BIRD_KEEPER_TRAINER',
          trainerId: 'route_18_bird_keeper_boris',
          trainerName: 'Bird Keeper Boris',
          visionRange: 3,
          defeatPages: ['My flock took a nosedive!'],
          team: [
            { speciesId: 'doduo', level: 30 },
            { speciesId: 'doduo', level: 32 },
            { speciesId: 'dodrio', level: 34 },
          ],
        }
      ),
      makeNpc(
        'route_18_bird_keeper_bob',
        13,
        6,
        'DOWN',
        'boy',
        '🦅 BIRD KEEPER BOB',
        ['The breeze from the sea makes this the best spot for bird training!'],
        {
          action: 'BIRD_KEEPER_TRAINER',
          trainerId: 'route_18_bird_keeper_bob',
          trainerName: 'Bird Keeper Bob',
          visionRange: 3,
          defeatPages: ['Grounded by superior tactics!'],
          team: [{ speciesId: 'noctowl', level: 34 }],
        }
      ),
    ],

    fuchsia_city: [
      makeNpc('fuchsia_city_boy', 23, 18, 'DOWN', 'boy', 'BOY', [
        'FUCHSIA CITY is known for its ninja heritage and the SAFARI ZONE!',
      ]),
      makeNpc('fuchsia_city_fat_man', 13, 8, 'DOWN', 'fat_man', 'MAN', [
        'KOGA used to be the GYM LEADER here before joining the ELITE FOUR. Now his daughter JANINE runs the GYM!',
      ]),
      makeNpc(
        'fuchsia_city_teacher',
        16,
        14,
        'DOWN',
        'teacher',
        'TEACHER',
        ['The poisonous smog from WEEZING and KOFFING is treated with great care by poison specialists.'],
        { wanders: true }
      ),
    ],

    fuchsia_poke_center: [
      makeNpc(
        'fuchsia_poke_center_nurse',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE',
        ['Welcome to our POKéMON CENTER!', 'We can heal your tired POKéMON back to full health.'],
        { action: 'HEAL_AND_SAVE', talkAcrossCounter: true }
      ),
      makeNpc('fuchsia_poke_center_boy', 8, 4, 'LEFT', 'boy', 'BOY', [
        "JANINE's ninjutsu illusion maze makes it tricky to find the real Gym Leader!",
      ]),
      makeNpc('fuchsia_poke_center_girl', 1, 4, 'LEFT', 'girl', 'GIRL', [
        'Poison-type moves inflict nasty status ailments like Toxic poison!',
      ]),
    ],

    fuchsia_mart: [
      makeNpc(
        'fuchsia_mart_clerk',
        1,
        3,
        'RIGHT',
        'boy',
        '🏪 CLERK',
        ['Welcome to FUCHSIA MART! What can I get for you today?'],
        { action: 'OPEN_MART', talkAcrossCounter: true }
      ),
      makeNpc('fuchsia_mart_customer_1', 3, 2, 'LEFT', 'fisherman', 'FISHER', [
        'I stock up on Antidotes whenever I come to Fuchsia City!',
      ]),
      makeNpc('fuchsia_mart_customer_2', 7, 6, 'LEFT', 'girl', 'GIRL', [
        'Hyper Potions and Full Heals are essential for long journeys through Kanto!',
      ]),
    ],
  };
}
