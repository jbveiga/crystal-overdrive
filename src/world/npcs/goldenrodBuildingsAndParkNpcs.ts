/**
 * @fileoverview goldenrodBuildingsAndParkNpcs domain module implementation.
 * @module world/npcs/goldenrodBuildingsAndParkNpcs
 * @role goldenrodBuildingsAndParkNpcs Component
 * @exports createGoldenrodBuildingsAndParkNpcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-231: Implementation | L232-462: Handlers & Exports
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createGoldenrodBuildingsAndParkNpcs(): Record<string, GridEntity[]> {
  return {
    goldenrod_dept_store_1f: [
      makeNpc('dept_elevator_1f', 1, 1, 'DOWN', 'clerk', '🛗 ELEVATOR ATTENDANT', 
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc('dept_rec', 7, 2, 'DOWN', 'teacher', '👩‍💼 RECEPTIONIST', 
        [
          'Welcome to GOLDENROD DEPT. STORE!',
          '1F Service Counter, 2F Trainer’s Market, 3F Battle Collection, 4F Medicine Box, 5F TM Corner, 6F Rooftop Square!',
        ],
        { talkAcrossCounter: true }
      ),
    ],
    goldenrod_dept_store_2f: [
      makeNpc('dept_elevator_2f', 1, 1, 'DOWN', 'clerk', '🛗 ELEVATOR ATTENDANT', 
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc('dept_clerk_2f', 13, 5, 'DOWN', 'fat_man', '🏪 2F CLERK', 
        ['Welcome to the 2F TRAINER’S MARKET! Stock up on GREAT BALLS, SUPER POTIONS, and REVIVES!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    goldenrod_dept_store_3f: [
      makeNpc('dept_elevator_3f', 1, 1, 'DOWN', 'clerk', '🛗 ELEVATOR ATTENDANT', 
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc('dept_clerk_3f', 6, 1, 'DOWN', 'fat_man', '🏪 3F CLERK', 
        ['Welcome to the 3F BATTLE COLLECTION! X ATTACK, X DEFEND, and DIRE HIT give you the edge in GYM battles!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    goldenrod_dept_store_4f: [
      makeNpc('dept_elevator_4f', 1, 1, 'DOWN', 'clerk', '🛗 ELEVATOR ATTENDANT', 
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc('dept_clerk_4f', 13, 5, 'DOWN', 'fat_man', '🏪 4F CLERK', 
        ['Welcome to the 4F MEDICINE BOX! PROTEIN, IRON, CARBOS, and HP UP permanently boost your POKéMON stats!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    goldenrod_dept_store_5f: [
      makeNpc('dept_elevator_5f', 1, 1, 'DOWN', 'clerk', '🛗 ELEVATOR ATTENDANT', 
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc('dept_clerk_5f', 8, 5, 'UP', 'fat_man', '🏪 5F CLERK', 
        ['Welcome to the 5F TM CORNER! Teach your POKéMON game-changing moves like HEADBUTT, ROCK SMASH, and REFLECT!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
      makeNpc('dept_5f_receptionist', 7, 5, 'UP', 'girl', '👩 RECEPTIONIST', 
        ['I evaluate how close you are with your POKéMON! Visit me to see if your friendship shines!']
      ),
      makeNpc('dept_5f_mike', 6, 3, 'DOWN', 'boy', '🔄 CAMPER MIKE', 
        ['I love Fighting-type POKéMON! If you have a DROWZEE, I will trade you my MACHOP!']
      ),
    ],
    goldenrod_dept_store_6f: [
      makeNpc('dept_elevator_6f', 1, 1, 'DOWN', 'clerk', '🛗 ELEVATOR ATTENDANT', 
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc('dept_girl_6f', 6, 2, 'DOWN', 'girl', '👧 VENDING MACHINE FAN', 
        [
          'The rooftop vending machines dispense FRESH WATER, SODA POP, and LEMONADE! They restore more HP than regular POTIONS!',
        ]
      ),
      makeNpc('dept_vending_6f', 10, 1, 'DOWN', 'fat_man', '🥤 VENDING MACHINE', 
        ['VENDING MACHINE: Clang! Refreshing drinks in stock!'],
        { action: 'VENDING_MACHINE' }
      ),
    ],
    goldenrod_dept_store_roof: [
      makeNpc('dept_elevator_roof', 12, 1, 'DOWN', 'clerk', '🛗 ELEVATOR ATTENDANT', 
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc('rooftop_camper', 7, 4, 'DOWN', 'boy', '⛺ ROOFTOP CAMPER', 
        [
          'You can see the entire skyline of GOLDENROD CITY and the RADIO TOWER from up here! It’s breathtaking!',
        ]
      ),
      makeNpc('dept_vending_roof', 8, 2, 'DOWN', 'fat_man', '🥤 VENDING MACHINE', 
        ['VENDING MACHINE: Clang! Refreshing drinks in stock!'],
        { action: 'VENDING_MACHINE' }
      ),
    ],
    route_35_goldenrod_gate: [
      makeNpc('officer_randy', 2, 3, 'RIGHT', 'officer', '👮 OFFICER RANDY', 
        ['OFFICER RANDY: I have a favor to ask an energetic trainer!'],
        { action: 'OFFICER_RANDY_KENYA' }
      ),
      makeNpc('gate_pokefan_f', 6, 4, 'LEFT', 'girl', '👩 POKéFAN', 
        [
          'A big tree is blocking the road on ROUTE 36! It wiggles when you talk to it.',
          'I heard the FLORIST in GOLDENROD CITY knows how to make it budge with a SQUIRTBOTTLE!',
        ]
      ),
    ],
    radio_tower_1f: [
      makeNpc('radio_rec', 5, 6, 'DOWN', 'teacher', '📻 QUIZ RECEPTIONIST', 
        [
          'Welcome to GOLDENROD RADIO TOWER! Tune your POKéGEAR to our broadcast frequencies to hear daily music and tips!',
        ]
      ),
    ],
    radio_tower_2f: [
      makeNpc('buena', 6, 6, 'DOWN', 'girl', '🎙️ BUENA', 
        [
          "I'm BUENA! Tune into BUENA'S PASSWORD every night on the radio to earn points on your BLUE CARD!",
        ]
      ),
    ],
    radio_tower_3f: [
      makeNpc('sound_engineer', 6, 5, 'RIGHT', 'fat_man', '🎧 SOUND ENGINEER', 
        [
          'We broadcast the POKéMON MARCH to energize traveling trainers, and POKéMON LULLABY to soothe wild monsters!',
        ]
      ),
    ],
    radio_tower_4f: [
      makeNpc('dj_mary', 7, 4, 'DOWN', 'girl', '🎙️ DJ MARY', 
        [
          'PROF. OAK and I host the POKéMON TALK radio show every day! We announce where rare POKéMON are swarming in Johto!',
        ],
        { action: 'DJ_MARY_EVENT' }
      ),
      makeNpc('executive_proton_radio_4f', 14, 1, 'DOWN', 'rocket_grunt_m', '⚡ EXECUTIVE PROTON',
        ['PROTON: You! You took down our team at the SLOWPOKE WELL!', 'I will not lose to you again!'],
        {
          action: 'EXECUTIVE_PROTON_EVENT',
          trainerId: 'proton_radio',
          trainerName: 'Executive Proton',
          challengePages: ['PROTON: We are reclaiming JOHTO for GIOVANNI! Out of my way!'],
          trainerPokemon: { speciesId: 'weezing', level: 33, moves: ['sludge', 'smokescreen', 'tackle', 'toxic'] },
          trainerTeam: [{ speciesId: 'weezing', level: 33, moves: ['sludge', 'smokescreen', 'tackle', 'toxic'] }],
        }
      ),
    ],
    radio_tower_5f: [
      makeNpc('petrel_radio_5f', 5, 4, 'DOWN', 'elder', '📻 RADIO DIRECTOR (PETREL)', 
        [
          "DIRECTOR: Y-you! You drove us out of the MAHOGANY hideout!",
          "Hahaha! Fooled you! I am PETREL, EXECUTIVE of TEAM ROCKET!",
          "We are taking over this tower to broadcast across the globe to our lost leader GIOVANNI!",
        ],
        {
          action: 'FAKE_DIRECTOR_EVENT',
          trainerId: 'petrel_fake_director',
          trainerName: 'Executive Petrel',
          challengePages: [
            "PETREL: Hahaha! You fell right into my trap! I'm disguised as the DIRECTOR! Prepare to feel TEAM ROCKET's wrath!",
          ],
          trainerPokemon: { speciesId: 'koffing', level: 30, moves: ['sludge', 'smokescreen', 'tackle'] },
          trainerTeam: [
            { speciesId: 'koffing', level: 30, moves: ['sludge', 'smokescreen', 'tackle'] },
            { speciesId: 'koffing', level: 30, moves: ['sludge', 'smokescreen', 'tackle'] },
            { speciesId: 'koffing', level: 30, moves: ['sludge', 'smokescreen', 'tackle'] },
            { speciesId: 'weezing', level: 32, moves: ['sludge', 'explosion', 'tackle'] },
          ],
        }
      ),
      makeNpc('executive_ariana_radio_5f', 17, 2, 'LEFT', 'rocket_grunt_f', '⚡ EXECUTIVE ARIANA',
        ['ARIANA: I am ARIANA, one of TEAM ROCKET’s four EXECUTIVES!', 'You shall not pass this door!'],
        {
          action: 'EXECUTIVE_ARIANA_EVENT',
          trainerId: 'ariana_radio',
          trainerName: 'Executive Ariana',
          challengePages: ['ARIANA: I will show you why I am an EXECUTIVE of TEAM ROCKET!'],
          trainerPokemon: { speciesId: 'arbok', level: 32, moves: ['poisonsting', 'bite', 'glare', 'screech'] },
          trainerTeam: [
            { speciesId: 'arbok', level: 32, moves: ['poisonsting', 'bite', 'glare', 'screech'] },
            { speciesId: 'vileplume', level: 32, moves: ['absorb', 'sweetscent', 'acid', 'stunspore'] },
            { speciesId: 'murkrow', level: 32, moves: ['peck', 'pursuit', 'haze', 'nightshade'] },
          ],
        }
      ),
      makeNpc('archer_radio_5f', 5, 4, 'DOWN', 'rocket_grunt_m', '⚡ EXECUTIVE ARCHER', 
        [
          "ARCHER: It's no use! The broadcast has already reached maximum transmitter power!",
        ],
        {
          action: 'EXECUTIVE_ARCHER_EVENT',
          trainerId: 'archer_radio',
          trainerName: 'Executive Archer',
          challengePages: [
            "ARCHER: Giovanni will answer our signal! TEAM ROCKET will never perish! I will crush you where you stand!",
          ],
          trainerPokemon: { speciesId: 'houndour', level: 33, moves: ['bite', 'ember', 'smog'] },
          trainerTeam: [
            { speciesId: 'houndour', level: 33, moves: ['bite', 'ember', 'smog'] },
            { speciesId: 'koffing', level: 33, moves: ['sludge', 'smokescreen', 'poisongas'] },
            { speciesId: 'houndoom', level: 35, moves: ['flamethrower', 'crunch', 'roar'] },
          ],
        }
      ),
      makeNpc('liberated_director_radio_5f', 16, 5, 'DOWN', 'elder', '📻 DIRECTOR', 
        [
          "DIRECTOR: Thank you from the bottom of my heart for liberating our RADIO TOWER!",
          "Music and peace have returned to Johto!",
        ],
        { action: 'LIBERATED_DIRECTOR_EVENT' }
      ),
      makeNpc('radio_director', 5, 4, 'DOWN', 'elder', '📻 RADIO DIRECTOR', 
        [
          "DIRECTOR: Thank you from the bottom of my heart for liberating our RADIO TOWER!",
          "Music and peace have returned to Johto!",
        ]
      ),
    ],
    goldenrod_underground_warehouse: [
      makeNpc('real_director_warehouse', 8, 2, 'DOWN', 'elder', '📻 REAL DIRECTOR', 
        [
          "DIRECTOR: You came all the way down here to rescue me?! Thank you!",
          "TEAM ROCKET locked me away and hijacked the observation deck transmitter on 5F to summon GIOVANNI!",
          "Take this CARD KEY! It will unlock the 3F security shutters in the RADIO TOWER so you can stop them!",
        ],
        { action: 'UNDERGROUND_REAL_DIRECTOR' }
      ),
    ],
    route_35: [
      makeNpc('camper_ivan', 4, 19, 'DOWN', 'camper', '⛺ CAMPER IVAN', 
        ['I’ve been practicing ground maneuvers in the grass!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'camper_ivan',
          trainerName: 'Camper Ivan',
          visionRange: 2,
          challengePages: ['CAMPER IVAN: I’ve been practicing ground maneuvers in the grass!'],
          trainerPokemon: { speciesId: 'diglett', level: 10, moves: ['scratch', 'growl'] },
          trainerTeam: [
            { speciesId: 'diglett', level: 10, moves: ['scratch', 'growl'] },
            { speciesId: 'zubat', level: 10, moves: ['leechlife', 'supersonic'] },
            { speciesId: 'diglett', level: 14, moves: ['magnitude', 'scratch', 'sandattack'] },
          ],
        }
      ),
      makeNpc('camper_elliot', 8, 20, 'DOWN', 'camper', '⛺ CAMPER ELLIOT', 
        ["I'm heading up to the Bug-Catching Contest!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'camper_elliot',
          trainerName: 'Camper Elliot',
          visionRange: 3,
          challengePages: ["CAMPER ELLIOT: I'm off to the Bug-Catching Contest! Let's warm up!"],
          trainerPokemon: { speciesId: 'sandshrew', level: 13, moves: ['scratch', 'defensecurl'] },
          trainerTeam: [
            { speciesId: 'sandshrew', level: 13, moves: ['scratch', 'defensecurl'] },
            { speciesId: 'marill', level: 15, moves: ['tackle', 'defensecurl', 'watergun'] },
          ],
        }
      ),
      makeNpc('picnicker_brooke', 7, 20, 'DOWN', 'picnicker', '🧺 PICNICKER BROOKE', 
        ['My Pikachu is the cutest in all Johto!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'picnicker_brooke',
          trainerName: 'Picnicker Brooke',
          visionRange: 3,
          challengePages: ['PICNICKER BROOKE: My Pikachu is the cutest in all Johto!'],
          trainerPokemon: { speciesId: 'pikachu', level: 16, moves: ['thundershock', 'growl', 'quickattack', 'tailwhip'] },
          trainerTeam: [
            { speciesId: 'pikachu', level: 16, moves: ['thundershock', 'growl', 'quickattack', 'tailwhip'] },
          ],
        }
      ),
      makeNpc('picnicker_kim', 10, 26, 'LEFT', 'picnicker', '👧 PICNICKER KIM', 
        ['My VULPIX loves sunbathing by the roadside!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'picnicker_kim',
          trainerName: 'Picnicker Kim',
          visionRange: 1,
          challengePages: ['PICNICKER KIM: Are you heading to the NATIONAL PARK? Let’s battle first!'],
          trainerPokemon: { speciesId: 'vulpix', level: 15, moves: ['ember', 'tailwhip', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'vulpix', level: 15, moves: ['ember', 'tailwhip', 'quickattack'] },
          ],
        }
      ),
      makeNpc('bird_keeper_bryan', 14, 28, 'DOWN', 'bird_keeper', '🦅 BIRD KEEPER BRYAN', 
        ['Bird POKéMON glide high above the Goldenrod skyline!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bird_keeper_bryan',
          trainerName: 'Bird Keeper Bryan',
          visionRange: 3,
          challengePages: ['BIRD KEEPER BRYAN: Check out the wingspan of my trained birds!'],
          trainerPokemon: { speciesId: 'pidgey', level: 12, moves: ['tackle', 'sandattack', 'gust'] },
          trainerTeam: [
            { speciesId: 'pidgey', level: 12, moves: ['tackle', 'sandattack', 'gust'] },
            { speciesId: 'pidgeotto', level: 14, moves: ['gust', 'tackle', 'quickattack'] },
          ],
        }
      ),
      makeNpc('firebreather_walt', 2, 10, 'RIGHT', 'firebreather', '🔥 FIREBREATHER WALT', 
        ['I blow fiery embers into the night sky!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'firebreather_walt',
          trainerName: 'Firebreather Walt',
          visionRange: 2,
          challengePages: ['FIREBREATHER WALT: Breathe deep and ignite the flame!'],
          trainerPokemon: { speciesId: 'magmar', level: 11, moves: ['ember', 'leer'] },
          trainerTeam: [
            { speciesId: 'magmar', level: 11, moves: ['ember', 'leer'] },
            { speciesId: 'magmar', level: 13, moves: ['ember', 'smog'] },
          ],
        }
      ),
      makeNpc('bug_catcher_arnie', 16, 7, 'DOWN', 'bug_catcher', '🐛 BUG CATCHER ARNIE', 
        ["I'll call you whenever a Yanma swarm appears!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_arnie',
          trainerName: 'Bug Catcher Arnie',
          visionRange: 3,
          challengePages: ["BUG CATCHER ARNIE: I'll show you my prized bug Pokémon!"],
          trainerPokemon: { speciesId: 'venonat', level: 15, moves: ['tackle', 'disable', 'leechlife'] },
          trainerTeam: [
            { speciesId: 'venonat', level: 15, moves: ['tackle', 'disable', 'leechlife'] },
          ],
        }
      ),
      makeNpc('juggler_irwin', 5, 10, 'RIGHT', 'juggler', '🎪 JUGGLER IRWIN', 
        ['Behold my incredible juggling act!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'juggler_irwin',
          trainerName: 'Juggler Irwin',
          visionRange: 2,
          challengePages: ['JUGGLER IRWIN: Behold my incredible juggling act!'],
          trainerPokemon: { speciesId: 'voltorb', level: 2, moves: ['tackle', 'screech'] },
          trainerTeam: [
            { speciesId: 'voltorb', level: 2, moves: ['tackle', 'screech'] },
            { speciesId: 'voltorb', level: 6, moves: ['tackle', 'sonicboom'] },
            { speciesId: 'voltorb', level: 10, moves: ['tackle', 'sonicboom'] },
            { speciesId: 'voltorb', level: 14, moves: ['spark', 'sonicboom'] },
          ],
        }
      ),
      makeNpc('officer_dirk', 5, 6, 'DOWN', 'officer', '👮 OFFICER DIRK', 
        ['I patrol Route 35 to keep trainers safe at night.'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'officer_dirk',
          trainerName: 'Officer Dirk',
          visionRange: 2,
          challengePages: ['OFFICER DIRK: Halt! Who goes there after dark?'],
          trainerPokemon: { speciesId: 'growlithe', level: 14, moves: ['bite', 'roar'] },
          trainerTeam: [
            { speciesId: 'growlithe', level: 14, moves: ['bite', 'roar'] },
            { speciesId: 'growlithe', level: 14, moves: ['bite', 'ember'] },
          ],
        }
      ),
    ],
    route_35_national_park_gate: [
      makeNpc('park_gate_officer', 2, 3, 'DOWN', 'officer', '👮 PARK OFFICER', 
        [
          'Welcome to the NATIONAL PARK!',
          'The Bug-Catching Contest is held every Tuesday, Thursday, and Saturday! You could win a rare SUN STONE!',
        ],
        { action: 'BUG_CONTEST_OFFICER_EVENT' }
      ),
      makeNpc('gate_civilian', 6, 4, 'DOWN', 'youngster', '👦 VISITOR', 
        ['The Bug-Catching Contest is tough! High level and rare species score higher!']
      ),
    ],
    national_park: [
      makeNpc('quick_claw_teacher', 27, 40, 'DOWN', 'teacher', '👩‍🏫 TEACHER', 
        [
          'Pay attention, please!',
          '…Oops, I have to quit thinking like a teacher all the time.',
          "You must be a POKéMON trainer.",
          "Since you're working so hard, I want you to have this.",
        ],
        { action: 'QUICK_CLAW_EVENT' }
      ),
      makeNpc('schoolboy_jack', 27, 23, 'LEFT', 'schoolboy', '👦 SCHOOLBOY JACK', 
        ['I read all about electric and grass types in my academy textbooks!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'schoolboy_jack',
          trainerName: 'Schoolboy Jack',
          visionRange: 3,
          challengePages: ['SCHOOLBOY JACK: The Bug-Catching Contest is thrilling, but regular battles are great too!'],
          trainerPokemon: { speciesId: 'oddish', level: 12, moves: ['absorb', 'sweetscent'] },
          trainerTeam: [
            { speciesId: 'oddish', level: 12, moves: ['absorb', 'sweetscent'] },
            { speciesId: 'voltorb', level: 15, moves: ['tackle', 'screech', 'sonicboom'] },
          ],
        }
      ),
      makeNpc('pokefan_m_william', 16, 9, 'DOWN', 'pokefan_m', '🧢 POKéFAN WILLIAM', 
        ['We take great pride in our beloved companions!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokefan_m_william',
          trainerName: 'Pokéfan William',
          visionRange: 2,
          challengePages: ['POKéFAN WILLIAM: We take great pride in our beloved companions!'],
          trainerPokemon: { speciesId: 'raichu', level: 14, moves: ['thundershock', 'tailwhip', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'raichu', level: 14, moves: ['thundershock', 'tailwhip', 'quickattack'] },
          ],
        }
      ),
      makeNpc('pokefan_f_beverly', 18, 29, 'DOWN', 'pokefan_f', '🎀 POKéFAN BEVERLY', 
        ['My SNUBBULL has the best manners!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokefan_f_beverly',
          trainerName: 'Pokéfan Beverly',
          visionRange: 2,
          challengePages: ['POKéFAN BEVERLY: My darling POKéMON loves greeting new trainers!'],
          trainerPokemon: { speciesId: 'snubbull', level: 14, moves: ['tackle', 'scaryface', 'charm'] },
          trainerTeam: [
            { speciesId: 'snubbull', level: 14, moves: ['tackle', 'scaryface', 'charm', 'bite'] },
          ],
        }
      ),
      makeNpc('lass_krise', 8, 14, 'RIGHT', 'lass', '👧 LASS KRISE', 
        ['Have you seen the cute Bug Pokémon in the grass?'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'lass_krise',
          trainerName: 'Lass Krise',
          visionRange: 3,
          challengePages: ['LASS KRISE: Have you seen the cute Bug Pokémon in the grass?'],
          trainerPokemon: { speciesId: 'oddish', level: 12, moves: ['absorb', 'poisonpowder'] },
          trainerTeam: [
            { speciesId: 'oddish', level: 12, moves: ['absorb', 'poisonpowder'] },
            { speciesId: 'cubone', level: 15, moves: ['growl', 'boneclub', 'tailwhip'] },
          ],
        }
      ),
      makeNpc('park_gameboy_kid', 26, 6, 'DOWN', 'youngster', '👦 GAMEBOY KID', 
        ["I'm trading mail with my buddy over the Game Link cable!"]
      ),
      makeNpc('park_fountain_lass', 15, 24, 'DOWN', 'lass', '👧 PARK VISITOR', 
        ['Relaxation Square in the center of the park is so peaceful!']
      ),
    ],
    route_36_national_park_gate: [
      makeNpc('gate_guard', 4, 2, 'DOWN', 'officer', '👮 GATE OFFICER', 
        [
          'ROUTE 36 is straight ahead to the east.',
          'There’s an odd tree blocking the road intersection that wiggles whenever it rains!',
        ]
      ),
    ],
    route_36: [
      makeNpc('sudowoodo', 35, 9, 'DOWN', 'sudowoodo', '🌲 SUDOWOODO', 
        [
          "It's a weird tree. It seems to wiggle when touched!",
          'Sudowoodo hated the water! It attacked!',
        ],
        { action: 'SUDOWOODO_EVENT' }
      ),
      makeNpc('hard_rock_guy', 44, 9, 'LEFT', 'fisherman', '🥊 ROCK SMASH GUY', 
        [
          'Wa-hey!',
          'I was going to snap that tree with my straight-arm punch.',
          "But I couldn't! I'm a failure!",
        ],
        { action: 'ROCK_SMASH_GUY_EVENT' }
      ),
      makeNpc('psychic_mark', 20, 13, 'RIGHT', 'psychic', '🔮 PSYCHIC MARK', 
        ['I foresaw that you would approach this intersection!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'psychic_mark',
          trainerName: 'Psychic Mark',
          visionRange: 3,
          challengePages: ['PSYCHIC MARK: Can you outthink the power of telekinesis?'],
          trainerPokemon: { speciesId: 'abra', level: 13, moves: ['teleport'] },
          trainerTeam: [
            { speciesId: 'abra', level: 13, moves: ['teleport'] },
            { speciesId: 'abra', level: 13, moves: ['teleport'] },
            { speciesId: 'kadabra', level: 15, moves: ['confusion', 'kinesis', 'disable'] },
          ],
        }
      ),
      makeNpc('schoolboy_alan', 31, 14, 'LEFT', 'schoolboy', '👦 SCHOOLBOY ALAN', 
        ['TANGELA vines are remarkably stretchy!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'schoolboy_alan',
          trainerName: 'Schoolboy Alan',
          visionRange: 5,
          challengePages: ['SCHOOLBOY ALAN: My grass POKéMON loves sunny days on Route 36!'],
          trainerPokemon: { speciesId: 'tangela', level: 16, moves: ['constrict', 'vinewhip', 'absorb'] },
          trainerTeam: [
            { speciesId: 'tangela', level: 16, moves: ['constrict', 'vinewhip', 'absorb'] },
          ],
        }
      ),
      makeNpc('arthur_of_thursday', 46, 6, 'DOWN', 'youngster', '🪨 ARTHUR OF THURSDAY', 
        [
          "ARTHUR: Who am I? I'm ARTHUR of Thursday! Pleased to make your acquaintance!",
          'Here, take this HARD STONE! It powers up ROCK-type moves!',
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
      makeNpc('route_36_lass', 51, 8, 'LEFT', 'lass', '👧 VIOLET TRAVELER', 
        ['VIOLET CITY is just through this path past the trees!']
      ),
    ],
    route_36_ruins_of_alph_gate: [
      makeNpc('alph_gate_guard', 4, 2, 'DOWN', 'officer', '👮 OFFICER', 
        ['The northern chamber entrance to RUINS OF ALPH is down these stairs.']
      ),
    ],
  };
}
