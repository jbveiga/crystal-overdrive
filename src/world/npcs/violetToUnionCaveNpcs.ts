/**
 * @fileoverview violetToUnionCaveNpcs domain module implementation.
 * @module world/npcs/violetToUnionCaveNpcs
 * @role violetToUnionCaveNpcs Component
 * @exports createVioletToUnionCaveNpcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-229: Implementation | L230-458: Handlers & Exports
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createVioletToUnionCaveNpcs(): Record<string, GridEntity[]> {
  return {
    violet_gym: [
      makeNpc('gym_guide', 7, 13, 'DOWN', 'fat_man', '🕶️ GYM GUIDE', 
        [
          "Yo! I'm no trainer, but I can give some advice! Believe me! If you believe, a championship dream can come true. You believe? Then listen.",
          'The grass-type is weak against the flying-type. Keep this in mind.',
        ]
      ),
      makeNpc('bird_keeper_abe', 2, 10, 'RIGHT', 'bird_keeper', '🦅 BIRD KEEPER ABE', 
        [
          "This can't be true!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bird_keeper_abe',
          trainerName: 'Bird Keeper Abe',
          visionRange: 3,
          challengePages: [
            'BIRD KEEPER ABE: Let me see if you are good enough to face FALKNER!',
          ],
          trainerPokemon: {
            speciesId: 'spearow',
            level: 9,
            moves: ['peck', 'growl', 'leer'],
          },
          trainerTeam: [
            { speciesId: 'spearow', level: 9, moves: ['peck', 'growl', 'leer'] },
          ],
        }
      ),
      makeNpc('bird_keeper_rod', 7, 6, 'LEFT', 'bird_keeper', '🦅 BIRD KEEPER ROD', 
        [
          "FALKNER's skills are for real! Don't get cocky just because you beat me!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bird_keeper_rod',
          trainerName: 'Bird Keeper Rod',
          visionRange: 3,
          challengePages: [
            'BIRD KEEPER ROD: The keyword is guts! Those here are training night and day to become bird POKéMON masters. Come on!',
          ],
          trainerPokemon: {
            speciesId: 'pidgey',
            level: 7,
            moves: ['tackle', 'sandattack'],
          },
          trainerTeam: [
            { speciesId: 'pidgey', level: 7, moves: ['tackle', 'sandattack'] },
            { speciesId: 'pidgey', level: 7, moves: ['tackle', 'sandattack'] },
          ],
        }
      ),
      makeNpc('falkner', 5, 1, 'DOWN', 'falkner', '🦅 LEADER FALKNER', 
        [
          "FALKNER: …Darn! My dad's cherished bird POKéMON… All right. Take this. It's the official POKéMON LEAGUE ZEPHYRBADGE!",
          "There are POKéMON GYMS in cities and towns ahead. You should test your skills at these GYMS. I'm going to train harder to become the greatest bird master!",
        ],
        {
          action: 'FALKNER_EVENT',
          trainerId: 'falkner',
          trainerName: 'Leader Falkner',
          challengePages: [
            "FALKNER: I'm FALKNER, the VIOLET CITY POKéMON GYM leader! People say you can clip flying-type wings with a jolt of electricity… I won't allow such insults to bird POKéMON! I'll show you the real power of the magnificent bird POKéMON!",
          ],
          trainerPokemon: {
            speciesId: 'pidgey',
            level: 9,
            moves: ['tackle', 'sandattack', 'mudslap'],
          },
          trainerTeam: [
            { speciesId: 'pidgey', level: 9, moves: ['tackle', 'sandattack', 'mudslap'] },
            { speciesId: 'pidgeotto', level: 13, moves: ['gust', 'tackle', 'mudslap', 'roost'] },
          ],
        }
      ),
    ],
    violet_poke_center: [
      makeNpc('nurse_violet', 3, 1, 'DOWN', 'mom', '💖 NURSE JOY', 
        [
          'Welcome to our POKéMON CENTER!',
          'We can heal your POKéMON back to perfect health in just a moment!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc(
        'elms_aide',
        1,
        4,
        'RIGHT',
        'teacher',
        "🔬 PROF. ELM'S AIDE",
        [
          "AIDE: I'm waiting for a promising young trainer on behalf of PROF. ELM.",
        ],
        {
          action: 'ELMS_AIDE_EVENT',
        }
      ),
    ],
    violet_mart: [
      makeNpc('mart_clerk_violet', 1, 3, 'RIGHT', 'boy', '🛒 MART CLERK', 
        ['Welcome to the VIOLET CITY POKéMON MART! How may I serve you?'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    violet_city: [
      makeNpc('earl', 28, 18, 'DOWN', 'earl', '🎓 EARL DERVISH', 
        [
          'Twirl! Twirl! Did you beat FALKNER at the GYM? Magnificent!',
          'I am EARL! I teach young trainers all about POKéMON at the POKéMON ACADEMY right behind me!',
        ],
        { wanders: true }
      ),
      makeNpc('violet_girl', 14, 20, 'RIGHT', 'girl', '👧 VIOLET LASS', 
        [
          'Ghosts are rumored to appear in SPROUT TOWER at night.',
          'Wait—you already climbed to the top and defeated ELDER LI?! Amazing!',
        ],
        { wanders: true }
      ),
      makeNpc('violet_bird_trainer', 26, 25, 'LEFT', 'bird_keeper', '🦅 BIRD FAN', 
        [
          'Hey, are you a POKéMON trainer? PIDGEY and SPEAROW are both Flying-types, but SPEAROW has a much fiercer Attack stat!',
        ]
      ),
    ],
    earls_pokemon_academy: [
      makeNpc('earl_teacher', 4, 3, 'UP', 'earl', '🎓 PROFESSOR EARL', 
        [
          'Twirl! Welcome to EARL\'S POKéMON ACADEMY!',
          'In battle, a move matching your POKéMON\'s own type deals 1.5x damage! That\'s Same-Type Attack Bonus!',
        ]
      ),
      makeNpc('academy_boy', 3, 5, 'UP', 'boy', '👦 STUDENT', 
        [
          "I'm taking notes from the blackboard! PARALYSIS cuts a POKéMON's Speed in half and may prevent it from moving!",
        ]
      ),
      makeNpc('academy_girl', 5, 5, 'UP', 'girl', '👧 STUDENT', 
        [
          'Electric- and Rock-type moves are super effective against Flying-types like FALKNER\'s bird POKéMON!',
        ]
      ),
    ],
    violet_kyles_house: [
      makeNpc('kyle', 2, 4, 'RIGHT', 'boy', '👦 KYLE', 
        [
          'A POKéMON you get in a trade grows quickly, even if it can be willful if you lack GYM BADGES!',
          'I love BELLSPROUT and POLIWAG!',
        ]
      ),
      makeNpc(
        'kyle_mom',
        5,
        4,
        'LEFT',
        'mom',
        "👩 KYLE'S MOM",
        [
          'Do you collect different kinds of POKéMON? My son KYLE is always looking to trade with other trainers!',
        ]
      ),
    ],
    violet_nickname_speech_house: [
      makeNpc('nickname_teacher', 2, 4, 'RIGHT', 'teacher', '👩 NICKNAME FAN', 
        [
          'She gives her POKéMON nicknames like STRAWBERRY! Giving a POKéMON a thoughtful nickname makes your bond even stronger!',
        ]
      ),
    ],
    route_32: [
      makeNpc('youngster_albert', 12, 22, 'DOWN', 'boy', '👦 YOUNGSTER ALBERT', 
        ['I gave it my all, but your POKéMON were too tough!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_albert',
          trainerName: 'Youngster Albert',
          visionRange: 3,
          challengePages: ["YOUNGSTER ALBERT: I haven't seen you around before! Let's see how good you are!"],
          trainerPokemon: { speciesId: 'rattata', level: 6, moves: ['tackle', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'rattata', level: 6, moves: ['tackle', 'quickattack'] },
            { speciesId: 'zubat', level: 8, moves: ['leechlife', 'bite'] },
          ],
        }
      ),
      makeNpc('picnicker_liz', 10, 30, 'LEFT', 'girl', '👧 PICNICKER LIZ', 
        ['My NIDORAN is the cutest! Be gentle with her!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'picnicker_liz',
          trainerName: 'Picnicker Liz',
          visionRange: 3,
          challengePages: ['PICNICKER LIZ: Uh-oh, a trainer! My NIDORAN wants to play!'],
          trainerPokemon: { speciesId: 'nidoran-f', level: 9, moves: ['tackle', 'growl', 'scratch'] },
          trainerTeam: [
            { speciesId: 'nidoran-f', level: 9, moves: ['tackle', 'growl', 'scratch'] },
          ],
        }
      ),
      makeNpc('camper_roland', 3, 45, 'RIGHT', 'boy', '⛺ CAMPER ROLAND', 
        ['Camping out here with my POKéMON is the best feeling in the world!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'camper_roland',
          trainerName: 'Camper Roland',
          visionRange: 3,
          challengePages: ["CAMPER ROLAND: Hey! Don't sneak up on my campsite! Let's battle!"],
          trainerPokemon: { speciesId: 'nidoran-m', level: 9, moves: ['tackle', 'leer', 'hornattack'] },
          trainerTeam: [
            { speciesId: 'nidoran-m', level: 9, moves: ['tackle', 'leer', 'hornattack'] },
          ],
        }
      ),
      makeNpc('fisher_justin', 8, 49, 'LEFT', 'fisherman', '🎣 FISHER JUSTIN', 
        ['Fish are biting, but you bit harder!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'fisher_justin',
          trainerName: 'Fisher Justin',
          visionRange: 3,
          challengePages: ['FISHER JUSTIN: Whoa! You startled the fish! You owe me a battle!'],
          trainerPokemon: { speciesId: 'magikarp', level: 5, moves: ['splash', 'tackle'] },
          trainerTeam: [
            { speciesId: 'magikarp', level: 5, moves: ['splash', 'tackle'] },
            { speciesId: 'poliwhirl', level: 10, moves: ['watergun', 'hypnosis', 'doubleslap'] },
          ],
        }
      ),
      makeNpc('fisher_ralph', 12, 56, 'LEFT', 'fisherman', '🎣 FISHER RALPH', 
        ["I'm saving up for a SUPER ROD! Then I'll catch giant water POKéMON!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'fisher_ralph',
          trainerName: 'Fisher Ralph',
          visionRange: 3,
          challengePages: ["FISHER RALPH: I'm not just good at fishing, I'm good at battling too!"],
          trainerPokemon: { speciesId: 'goldeen', level: 10, moves: ['peck', 'tailwhip', 'supersonic'] },
          trainerTeam: [
            { speciesId: 'goldeen', level: 10, moves: ['peck', 'tailwhip', 'supersonic'] },
          ],
        }
      ),
      makeNpc('frieda', 12, 67, 'DOWN', 'girl', '🎀 FRIEDA OF FRIDAY', 
        [
          "FRIEDA: Yahoo! It's Friday! I'm FRIEDA of Friday! Nice to meet you!",
          "Here's a POISON BARB to power up POISON-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
      makeNpc('salesman', 11, 82, 'DOWN', 'fat_man', '🕴️ SUSPICIOUS MAN', 
        [
          'How would you like some tasty, nutritious SLOWPOKETAIL?',
          "It's only ¥9,800,000! What, you don't want it? Then step aside, kid!",
        ]
      ),
    ],
    route_32_poke_center: [
      makeNpc('r32_nurse_joy', 3, 1, 'DOWN', 'teacher', '👩‍⚕️ NURSE JOY', 
        [
          'Welcome to the ROUTE 32 POKéMON CENTER!',
          'We heal your POKéMON to full health in no time.',
          'Your team is fully restored. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('r32_cooltrainer', 1, 6, 'RIGHT', 'boy', '🧢 COOLTRAINER', 
        ['UNION CAVE ahead is labyrinthine! Make sure your team is rested and you have POTIONS ready!']
      ),
      makeNpc('r32_gentleman', 6, 4, 'LEFT', 'fat_man', '🎩 GENTLEMAN', 
        ['A fisherman gave me an OLD ROD here. It works on MAGIKARP, but you can find rarer fish deeper in caves!']
      ),
    ],
    route_32_ruins_of_alph_gate: [
      makeNpc('alph_gate_officer', 5, 2, 'DOWN', 'fat_man', '👮 OFFICER', 
        ['RUINS OF ALPH are to the west. Strange radio signals and patterns have been reported inside!']
      ),
      makeNpc('alph_gate_youngster', 1, 4, 'RIGHT', 'boy', '👦 TOURIST', 
        ['Have you heard the weird sounds on the POKéGEAR radio near the ruins? It gives me goosebumps!']
      ),
    ],
    ruins_of_alph_outside: [
      makeNpc('alph_scientist', 11, 15, 'DOWN', 'sage', '🔬 ARCHEOLOGIST', 
        ['The stone chambers contain sliding tile puzzles that awakened ancient hieroglyphic beings known as UNOWN!']
      ),
      makeNpc('alph_youngster', 7, 20, 'UP', 'boy', '👦 BOY', 
        ['I heard there are secret chambers behind hidden walls that open only if you use FLASH or ESCAPE ROPE!'],
        { wanders: true }
      ),
    ],
    ruins_of_alph_research_center: [
      makeNpc('research_scientist1', 3, 2, 'DOWN', 'sage', '🔬 HEAD RESEARCHER', 
        ['The ruins are quiet today... We are researching ancient glyphs, but our equipment detects no active signals from the chambers.'],
        { action: 'UNOWN_DEX_EVENT' }
      ),
      makeNpc('research_scientist2', 5, 2, 'LEFT', 'sage', '🔬 RESEARCH ASSISTANT', 
        ['The past and future intertwine in these ancient stones. They date back over 1,500 years!']
      ),
    ],
    ruins_of_alph_kabuto_chamber: [
      makeNpc('kabuto_chamber_guide', 5, 5, 'DOWN', 'sage', '🏛️ CHAMBER GUIDE', 
        [
          'Welcome to this chamber. There are sliding stone panels that depict a POKéMON drawn by the ancients. Slide the panels around to form the picture.',
        ]
      ),
    ],
    union_cave_1f: [
      makeNpc('hiker_daniel', 3, 6, 'RIGHT', 'fat_man', '🥾 HIKER DANIEL', 
        ['Whoa! You broke through my rock defenses!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'hiker_daniel',
          trainerName: 'Hiker Daniel',
          visionRange: 3,
          challengePages: ['HIKER DANIEL: Whoa! A traveler! My rock POKéMON love tough challenges!'],
          trainerPokemon: { speciesId: 'onix', level: 11, moves: ['tackle', 'screech', 'rockthrow'] },
          trainerTeam: [
            { speciesId: 'onix', level: 11, moves: ['tackle', 'screech', 'rockthrow'] },
          ],
        }
      ),
      makeNpc('pokemaniac_larry', 4, 21, 'RIGHT', 'boy', '🎒 POKÉMANIAC LARRY', 
        ['My rare collection... beaten?! No way!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokemaniac_larry',
          trainerName: 'Pokemaniac Larry',
          visionRange: 3,
          challengePages: ['POKÉMANIAC LARRY: I scour dark caves to find the rarest monsters! Check mine out!'],
          trainerPokemon: { speciesId: 'slowpoke', level: 10, moves: ['confusion', 'tackle', 'yawn'] },
          trainerTeam: [
            { speciesId: 'slowpoke', level: 10, moves: ['confusion', 'tackle', 'yawn'] },
          ],
        }
      ),
      makeNpc('firebreather_ray', 15, 27, 'LEFT', 'fat_man', '🔥 FIREBREATHER RAY', 
        ['Whew! You totally quenched my flames!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'firebreather_ray',
          trainerName: 'Firebreather Ray',
          visionRange: 3,
          challengePages: ['FIREBREATHER RAY: In dark caves, a blazing flame keeps away the cold! Taste this heat!'],
          trainerPokemon: { speciesId: 'vulpix', level: 9, moves: ['ember', 'tailwhip', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'vulpix', level: 9, moves: ['ember', 'tailwhip', 'quickattack'] },
            { speciesId: 'magmar', level: 11, moves: ['ember', 'smog', 'leer'] },
          ],
        }
      ),
    ],
    union_cave_b1f: [
      makeNpc('hiker_phillip', 4, 14, 'RIGHT', 'fat_man', '🥾 HIKER PHILLIP', 
        ['I need to train harder in the subterranean depths!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'hiker_phillip',
          trainerName: 'Hiker Phillip',
          visionRange: 3,
          challengePages: ['HIKER PHILLIP: The lower you go, the tougher the rocks! Are you ready?!'],
          trainerPokemon: { speciesId: 'geodude', level: 10, moves: ['tackle', 'defensecurl', 'rockthrow'] },
          trainerTeam: [
            { speciesId: 'geodude', level: 10, moves: ['tackle', 'defensecurl', 'rockthrow'] },
          ],
        }
      ),
      makeNpc('pokemaniac_andrew', 15, 23, 'LEFT', 'boy', '🎒 POKÉMANIAC ANDREW', 
        ['My MARILL is totally out of energy!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokemaniac_andrew',
          trainerName: 'Pokemaniac Andrew',
          visionRange: 3,
          challengePages: ['POKÉMANIAC ANDREW: Look at my adorable round water buddy! Go MARILL!'],
          trainerPokemon: { speciesId: 'marill', level: 11, moves: ['watergun', 'tackle', 'tailwhip', 'defensecurl'] },
          trainerTeam: [
            { speciesId: 'marill', level: 11, moves: ['watergun', 'tackle', 'tailwhip', 'defensecurl'] },
          ],
        }
      ),
    ],
    union_cave_b2f: [
      makeNpc('ace_trainer_nick', 13, 8, 'DOWN', 'boy', '⭐ ACE TRAINER NICK', 
        ["Incredible skill! You're ready for anything the LEAGUE can throw at you!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'ace_trainer_nick',
          trainerName: 'Ace Trainer Nick',
          visionRange: 3,
          challengePages: ['ACE TRAINER NICK: Only elite trainers explore the deepest cavern waters! Battle with me!'],
          trainerPokemon: { speciesId: 'charmander', level: 12, moves: ['scratch', 'ember', 'smokescreen'] },
          trainerTeam: [
            { speciesId: 'charmander', level: 12, moves: ['scratch', 'ember', 'smokescreen'] },
            { speciesId: 'squirtle', level: 12, moves: ['tackle', 'watergun', 'tailwhip', 'withdraw'] },
          ],
        }
      ),
      makeNpc('ace_trainer_gwen', 5, 21, 'RIGHT', 'girl', '⭐ ACE TRAINER GWEN', 
        ['You and your POKéMON are in perfect sync! Remarkable battle!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'ace_trainer_gwen',
          trainerName: 'Ace Trainer Gwen',
          visionRange: 3,
          challengePages: ["ACE TRAINER GWEN: I'm training with my partner POKéMON in these secluded caverns! Let's see your strength!"],
          trainerPokemon: { speciesId: 'eevee', level: 12, moves: ['tackle', 'tailwhip', 'quickattack', 'sandattack'] },
          trainerTeam: [
            { speciesId: 'eevee', level: 12, moves: ['tackle', 'tailwhip', 'quickattack', 'sandattack'] },
            { speciesId: 'flareon', level: 12, moves: ['tackle', 'ember', 'tailwhip', 'quickattack'] },
          ],
        }
      ),
      makeNpc('lapras_fan', 6, 26, 'UP', 'girl', '🌊 LAPRAS ENTHUSIAST', 
        [
          'Every Friday, a beautiful wild LAPRAS swims up in this underground lake!',
          'If you use SURF, you can meet it yourself!',
        ]
      ),
      makeNpc('union_cave_lapras', 11, 31, 'DOWN', 'lapras', '🌊 LAPRAS', 
        ['Gyaoo!'],
        {
          action: 'LAPRAS_EVENT',
        }
      ),
    ],
    route_33: [
      makeNpc('hiker_anthony', 13, 11, 'LEFT', 'fat_man', '🥾 HIKER ANTHONY', 
        ["A rainstorm or a tough loss won't stop me from hiking through Johto!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'hiker_anthony',
          trainerName: 'Hiker Anthony',
          visionRange: 3,
          challengePages: ['HIKER ANTHONY: Route 33 is known for sudden rainstorms! Let\'s strike like lightning!'],
          trainerPokemon: { speciesId: 'geodude', level: 11, moves: ['tackle', 'rockthrow', 'magnitude'] },
          trainerTeam: [
            { speciesId: 'geodude', level: 11, moves: ['tackle', 'rockthrow', 'magnitude'] },
            { speciesId: 'machop', level: 11, moves: ['lowkick', 'leer', 'focusenergy'] },
          ],
        }
      ),
    ],
  };
}
