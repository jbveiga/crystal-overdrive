import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createOlivineToIndigoNpcs(): Record<string, GridEntity[]> {
  return {
    olivine_city: [
      makeNpc('olivine_sailor_1', 26, 27, 'DOWN', 'fisherman', '⚓ SAILOR', [
        'The S.S. AQUA sails from this port all the way to Vermilion City in Kanto.',
      ]),
      makeNpc('olivine_youngster', 20, 13, 'DOWN', 'boy', '👦 YOUNGSTER', [
        'Have you visited the glittering Olivine Lighthouse? It shines bright over the sea!',
      ]),
      makeNpc('olivine_sailor_2', 17, 21, 'DOWN', 'fisherman', '⚓ SAILOR', [
        'Rough seas separate Olivine and Cianwood. Only strong swimmers or Surfers can cross!',
      ]),
    ],

    olivine_poke_center: [
      makeNpc(
        'olivine_nurse',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE JOY',
        ['Welcome to the Olivine Pokémon Center!', 'We can heal your Pokémon to full health.'],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('olivine_fisher', 2, 3, 'DOWN', 'fisherman', '🎣 FISHER', [
        'Fishing off the piers here can net you some rare sea POKéMON!',
      ]),
    ],

    olivine_mart: [
      makeNpc(
        'olivine_clerk',
        1,
        3,
        'DOWN',
        'boy',
        '🏪 CLERK',
        ['Welcome to Olivine Poké Mart! How may I help you?'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],

    olivine_gym: [
      makeNpc(
        'leader_jasmine',
        5,
        3,
        'DOWN',
        'girl',
        '🔩 LEADER JASMINE',
        [
          'JASMINE: …Thank you for your kindness at the LIGHTHOUSE.',
          'Steel-clad determination will illuminate your path across Johto!',
        ],
        {
          action: 'JASMINE_EVENT',
          trainerId: 'jasmine',
          trainerName: 'Leader Jasmine',
          challengePages: [
            'JASMINE: …Thank you for your help at the LIGHTHOUSE. But as a GYM LEADER, I will use my full power!',
            'POKéMON of steel… Clad in diamond-hard scales! Steelix, let us begin!',
          ],
          trainerPokemon: { speciesId: 'magnemite', level: 30, moves: ['thunderbolt', 'thunderwave', 'sonicboom', 'supersonic'] },
          trainerTeam: [
            { speciesId: 'magnemite', level: 30, moves: ['thunderbolt', 'thunderwave', 'sonicboom', 'supersonic'] },
            { speciesId: 'magnemite', level: 30, moves: ['thunderbolt', 'thunderwave', 'sonicboom', 'supersonic'] },
            { speciesId: 'steelix', level: 35, moves: ['irontail', 'rockthrow', 'sunnyday', 'screech'] },
          ],
        }
      ),
      makeNpc(
        'olivine_gym_guide',
        7,
        14,
        'DOWN',
        'boy',
        '🏆 GYM GUIDE',
        [
          'Yo! CHAMP in the making!',
          'Jasmine specializes in the newly discovered STEEL type!',
          'Steel Pokémon have impenetrable defenses against Normal, Flying, Rock, Bug, Ghost, Steel, Grass, Psychic, Ice, and Dragon!',
          'Strike them with FIRE, FIGHTING, or GROUND attacks to crack their armor!',
        ]
      ),
    ],

    olivine_cafe: [
      makeNpc('cafe_chef', 1, 2, 'DOWN', 'fat_man', '👨‍🍳 CHEF', [
        'Welcome to the Olivine Café! Our sailors love hearty stew after long voyages.',
      ]),
      makeNpc('cafe_sailor', 3, 4, 'DOWN', 'fisherman', '⚓ SAILOR', [
        'Gulp! Nothing beats a hot meal after surviving the waves!',
      ]),
    ],

    olivine_tims_house: [
      makeNpc('olivine_tim', 2, 3, 'DOWN', 'boy', '👦 TIM', [
        'My dad is a sailor. He travels all over the world and brings back amazing stories!',
      ]),
    ],

    olivine_good_rod_house: [
      makeNpc('good_rod_guru', 2, 3, 'DOWN', 'fisherman', '🎣 FISHING GURU', [
        'The sea holds endless mysteries. With a good rod, you can reel in wondrous partners!',
      ]),
    ],

    olivine_lighthouse_1f: [
      makeNpc('lighthouse_sailor_1f', 8, 2, 'DOWN', 'fisherman', '⚓ SAILOR', [
        'People and POKéMON train by climbing up and down this lighthouse!',
      ]),
      makeNpc('lighthouse_lady_1f', 16, 9, 'DOWN', 'teacher', '👩 LADY', [
        'At the very top of the tower rests Amphy, the Ampharos whose light guides our port.',
      ]),
    ],

    olivine_lighthouse_2f: [
      makeNpc('sailor_huey', 9, 3, 'DOWN', 'fisherman', '⚓ SAILOR HUEY', ['Poliwhirl keeps me fit!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'sailor_huey',
        trainerName: 'Sailor Huey',
        visionRange: 2,
        challengePages: ['HUEY: Training in the lighthouse makes us tough as steel!'],
        trainerPokemon: { speciesId: 'poliwhirl', level: 20, moves: ['watergun', 'hypnosis', 'doubleslap'] },
        trainerTeam: [{ speciesId: 'poliwhirl', level: 20, moves: ['watergun', 'hypnosis', 'doubleslap'] }],
      }),
    ],

    olivine_lighthouse_3f: [
      makeNpc('bird_keeper_theo', 3, 9, 'UP', 'bird_keeper', '🦅 BIRD KEEPER THEO', ['Fearow soars above the sea.'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'bird_keeper_theo',
        trainerName: 'Bird Keeper Theo',
        visionRange: 2,
        challengePages: ['THEO: The sea breeze from up high is perfect for Flying Pokémon!'],
        trainerPokemon: { speciesId: 'fearow', level: 20, moves: ['peck', 'leer', 'furyattack'] },
        trainerTeam: [{ speciesId: 'fearow', level: 20, moves: ['peck', 'leer', 'furyattack'] }],
      }),
      makeNpc('sailor_terrell', 9, 2, 'DOWN', 'fisherman', '⚓ SAILOR TERRELL', ['Anchors away!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'sailor_terrell',
        trainerName: 'Sailor Terrell',
        visionRange: 2,
        challengePages: ['TERRELL: Sailor muscles never rest! Prepare yourself!'],
        trainerPokemon: { speciesId: 'poliwhirl', level: 18, moves: ['watergun', 'hypnosis'] },
        trainerTeam: [
          { speciesId: 'poliwhirl', level: 18, moves: ['watergun', 'hypnosis'] },
          { speciesId: 'poliwhirl', level: 20, moves: ['watergun', 'doubleslap'] },
        ],
      }),
    ],

    olivine_lighthouse_4f: [
      makeNpc('lass_connie', 7, 14, 'DOWN', 'girl', '🎀 LASS CONNIE', ['Marill floats like a buoy!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'lass_connie',
        trainerName: 'Lass Connie',
        visionRange: 2,
        challengePages: ['CONNIE: Are you going to see Amphy? Battle me first!'],
        trainerPokemon: { speciesId: 'marill', level: 21, moves: ['tackle', 'watergun', 'rollout'] },
        trainerTeam: [{ speciesId: 'marill', level: 21, moves: ['tackle', 'watergun', 'rollout'] }],
      }),
    ],

    olivine_lighthouse_5f: [
      makeNpc('sailor_ernest', 8, 13, 'DOWN', 'fisherman', '⚓ SAILOR ERNEST', ['Machop’s karate chops are fierce!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'sailor_ernest',
        trainerName: 'Sailor Ernest',
        visionRange: 2,
        challengePages: ['ERNEST: Almost at the top! Can you overcome my physical power?'],
        trainerPokemon: { speciesId: 'machop', level: 18, moves: ['karatechop', 'lowkick', 'leer'] },
        trainerTeam: [
          { speciesId: 'machop', level: 18, moves: ['karatechop', 'lowkick', 'leer'] },
          { speciesId: 'poliwhirl', level: 20, moves: ['watergun', 'hypnosis', 'slam'] },
        ],
      }),
    ],

    olivine_lighthouse_6f: [
      makeNpc(
        'lighthouse_jasmine',
        8,
        8,
        'DOWN',
        'girl',
        '🔩 JASMINE',
        [
          'JASMINE: …Amphy is sick. It used to shine so brightly across the dark sea…',
          'I heard there is a pharmacy in CIANWOOD CITY across the sea that carries miracle medicine…',
        ],
        { action: 'AMPHY_EVENT' }
      ),
      makeNpc(
        'lighthouse_amphy',
        9,
        8,
        'DOWN',
        'fat_man',
        '💡 AMPHAROS',
        ['AMPHAROS: …Palu… (It looks pale and feverish…)'],
        { action: 'AMPHY_EVENT' }
      ),
    ],

    route_40: [
      makeNpc('swimmer_simon', 12, 6, 'DOWN', 'boy', '🏊 SWIMMER SIMON', ['The ocean currents are strong!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmer_simon',
        trainerName: 'Swimmer Simon',
        visionRange: 2,
        challengePages: ['SIMON: Ready for a swim battle in the waves of Route 40?'],
        trainerPokemon: { speciesId: 'tentacool', level: 20, moves: ['poisonsting', 'watergun', 'constrict'] },
        trainerTeam: [
          { speciesId: 'tentacool', level: 20, moves: ['poisonsting', 'watergun', 'constrict'] },
          { speciesId: 'staryu', level: 20, moves: ['tackle', 'watergun', 'harden'] },
        ],
      }),
      makeNpc('swimmer_elaine', 14, 5, 'DOWN', 'girl', '🏊‍♀️ SWIMMER ELAINE', ['Staryu spins smoothly through water!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmer_elaine',
        trainerName: 'Swimmer Elaine',
        visionRange: 2,
        challengePages: ['ELAINE: Swimming across to Cianwood is my morning exercise!'],
        trainerPokemon: { speciesId: 'staryu', level: 21, moves: ['watergun', 'swift', 'recover'] },
        trainerTeam: [{ speciesId: 'staryu', level: 21, moves: ['watergun', 'swift', 'recover'] }],
      }),
      makeNpc(
        'monica_of_monday',
        10,
        12,
        'DOWN',
        'girl',
        '🎀 MONICA OF MONDAY',
        [
          "MONICA: Hello! I'm MONICA of Monday! As a token of friendship, please take this!",
          "It's a SHARP BEAK! It boosts the power of FLYING-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
    ],

    route_41: [
      makeNpc('swimmer_charlie', 12, 19, 'DOWN', 'boy', '🏊 SWIMMER CHARLIE', ['Shellder clamps tight on foes!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmer_charlie',
        trainerName: 'Swimmer Charlie',
        visionRange: 2,
        challengePages: ['CHARLIE: The whirlpools ahead are treacherous! Turn back unless you have Surf!'],
        trainerPokemon: { speciesId: 'shellder', level: 21, moves: ['tackle', 'withdraw', 'iciclespear'] },
        trainerTeam: [
          { speciesId: 'shellder', level: 21, moves: ['tackle', 'withdraw', 'iciclespear'] },
          { speciesId: 'cloyster', level: 23, moves: ['aurorabeam', 'spikycannon', 'protect'] },
        ],
      }),
      makeNpc('swimmer_denise', 36, 21, 'DOWN', 'girl', '🏊‍♀️ SWIMMER DENISE', ['Dewgong swims gracefully in cold seas.'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'swimmer_denise',
        trainerName: 'Swimmer Denise',
        visionRange: 2,
        challengePages: ['DENISE: Have you seen the mysterious caverns inside the Whirl Islands?'],
        trainerPokemon: { speciesId: 'seel', level: 22, moves: ['headbutt', 'aurorabeam', 'growl'] },
        trainerTeam: [
          { speciesId: 'seel', level: 22, moves: ['headbutt', 'aurorabeam', 'growl'] },
          { speciesId: 'dewgong', level: 24, moves: ['aurorabeam', 'surf', 'rest'] },
        ],
      }),
    ],

    cianwood_city: [
      makeNpc('cianwood_youngster', 21, 37, 'DOWN', 'boy', '👦 YOUNGSTER', [
        'Cianwood City is isolated across the sea. We get goods delivered from Olivine!',
      ]),
      makeNpc('cianwood_pokefan_m', 17, 33, 'DOWN', 'fat_man', '🧢 POKéFAN', [
        'The crashing waves here are invigorating. Perfect for rigorous martial arts training!',
      ]),
      makeNpc('cianwood_lass', 14, 42, 'DOWN', 'girl', '👧 LASS', [
        'Leader Chuck trains all day long under the crashing waterfall!',
      ]),
      makeNpc('chucks_wife', 10, 46, 'DOWN', 'teacher', '👩 CHUCK’S WIFE', [
        'My husband Chuck is always doing push-ups and breaking boulders!',
      ]),
      makeNpc('cianwood_eusine', 11, 21, 'UP', 'boy', '🎩 EUSINE', [
        'EUSINE: Suicune! I caught a glimpse of its crystal silhouette leaping gracefully across the waves!',
        'Its crystal-clear aura purifies all waters… One day, I will prove myself worthy to witness its majesty!',
      ]),
    ],

    cianwood_poke_center: [
      makeNpc(
        'cianwood_nurse',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE JOY',
        ['Welcome to the Cianwood Pokémon Center!', 'We can heal your Pokémon to full health.'],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
    ],

    cianwood_gym: [
      makeNpc(
        'leader_chuck',
        4,
        2,
        'DOWN',
        'fat_man',
        '🥋 LEADER CHUCK',
        [
          'CHUCK: WAHAHA! The STORMBADGE proves you have true fighting spirit!',
          'Never back down, and face every obstacle head on!',
        ],
        {
          action: 'CHUCK_EVENT',
          trainerId: 'chuck',
          trainerName: 'Leader Chuck',
          challengePages: [
            'CHUCK: WAHAHA! So you’ve come this far! We train day and night beneath the raging waterfalls of Cianwood!',
            'My roaring fists and my partners will shatter any defense! Prepare yourself!',
          ],
          trainerPokemon: { speciesId: 'primeape', level: 27, moves: ['karatechop', 'furyswipes', 'leer', 'rage'] },
          trainerTeam: [
            { speciesId: 'primeape', level: 27, moves: ['karatechop', 'furyswipes', 'leer', 'rage'] },
            { speciesId: 'poliwrath', level: 30, moves: ['dynamicpunch', 'hypnosis', 'surf', 'mindreader'] },
          ],
        }
      ),
      makeNpc(
        'cianwood_gym_guide',
        7,
        14,
        'DOWN',
        'boy',
        '🏆 GYM GUIDE',
        [
          'Yo! CHAMP in the making!',
          'Chuck is a master of FIGHTING-type POKéMON!',
          'FIGHTING attacks will smash through NORMAL, ROCK, STEEL, and ICE types!',
          'Counter them with FLYING and PSYCHIC moves to dodge their physical blows and strike from above!',
        ]
      ),
      makeNpc('blackbelt_yoshi', 2, 12, 'RIGHT', 'boy', '🥋 BLACKBELT YOSHI', ['My kicks strike like lightning!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'blackbelt_yoshi',
        trainerName: 'Blackbelt Yoshi',
        visionRange: 2,
        challengePages: ['YOSHI: We hone our bodies against iron rocks! Let’s see your technique!'],
        trainerPokemon: { speciesId: 'hitmonlee', level: 27, moves: ['doublekick', 'jumpkick', 'meditate'] },
        trainerTeam: [{ speciesId: 'hitmonlee', level: 27, moves: ['doublekick', 'jumpkick', 'meditate'] }],
      }),
    ],

    cianwood_pharmacy: [
      makeNpc(
        'cianwood_pharmacist',
        2,
        3,
        'DOWN',
        'fat_man',
        '💊 PHARMACIST',
        ['Welcome to Cianwood Pharmacy! 500 years of herbal tradition in every bottle.'],
        { action: 'PHARMACY_SECRET_POTION_EVENT' }
      ),
    ],

    cianwood_photo_studio: [
      makeNpc('cianwood_photographer', 2, 3, 'DOWN', 'fisherman', '📸 CAMERAMAN', [
        'Say cheese! I take commemorative photos for trainers and their beloved POKéMON!',
      ]),
    ],

    cianwood_lugia_speech_house: [
      makeNpc('lugia_storyteller', 2, 4, 'DOWN', 'teacher', '📜 STORYTELLER', [
        'Long ago, a majestic silver dragon guardian rested in the deep ocean whirlpools…',
        'When the world falls into peril, its wings stir hurricanes to quell the fury of the sea.',
      ]),
    ],

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
