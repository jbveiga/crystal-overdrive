import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';

export function createEcruteakToRoute39Npcs(): Record<string, GridEntity[]> {
  return {
    route_37: [
      makeNpc(
        'twins_ann_anne',
        7,
        6,
        'DOWN',
        'girl',
        '👭 TWINS ANN & ANNE',
        ['We train together every single afternoon!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'twins_ann_anne',
          trainerName: 'Twins Ann & Anne',
          visionRange: 2,
          challengePages: ['TWINS ANN & ANNE: Double the cuteness, double the battle power!'],
          trainerPokemon: { speciesId: 'clefairy', level: 16, moves: ['pound', 'doubleslap', 'sing'] },
          trainerTeam: [
            { speciesId: 'clefairy', level: 16, moves: ['pound', 'doubleslap', 'sing'] },
            { speciesId: 'jigglypuff', level: 16, moves: ['sing', 'pound', 'defensecurl'] },
          ],
        }
      ),
      makeNpc(
        'sunny_of_sunday',
        14,
        10,
        'LEFT',
        'girl',
        '⚡ SUNNY OF SUNDAY',
        [
          "SUNNY: Hi! I'm SUNNY of Sunday! Nice to meet you!",
          'Here is a MAGNET to power up ELECTRIC-type moves!',
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
      makeNpc(
        'psychic_greg',
        6,
        12,
        'UP',
        'youngster',
        '🔮 PSYCHIC GREG',
        ['POKéMON can’t do a thing if they are asleep!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'psychic_greg',
          trainerName: 'Psychic Greg',
          visionRange: 3,
          challengePages: [
            "PSYCHIC GREG: POKéMON can't do a thing if they are asleep! I'll show you how scary that is!",
          ],
          trainerPokemon: { speciesId: 'drowzee', level: 17, moves: ['hypnosis', 'disable', 'confusion'] },
          trainerTeam: [
            { speciesId: 'drowzee', level: 17, moves: ['hypnosis', 'disable', 'confusion'] },
          ],
        }
      ),
    ],
    ecruteak_city: [
      makeNpc(
        'ecruteak_sage',
        22,
        14,
        'DOWN',
        'sage',
        '🏮 ECRUTEAK SAGE',
        [
          'ECRUTEAK CITY is steeped in ancient lore.',
          'Long ago, two magnificent towers stood tall to honor the great silver bird LUGIA and rainbow bird HO-OH.',
        ]
      ),
      makeNpc(
        'ecruteak_girl',
        10,
        20,
        'RIGHT',
        'girl',
        '👧 TOWN GIRL',
        [
          'The KIMONO GIRLS in the DANCE THEATER dance gracefully with their five evolved EEVEE partners!',
        ]
      ),
      makeNpc(
        'ecruteak_gramps',
        32,
        26,
        'DOWN',
        'elder',
        '👴 ELDER CITIZEN',
        [
          'MORTY is our GYM LEADER. His spectral powers allow him to communicate with GHOST POKéMON across generations.',
        ]
      ),
    ],
    ecruteak_poke_center: [
      makeNpc(
        'ecruteak_nurse_joy',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE JOY',
        [
          'Welcome to the ECRUTEAK CITY POKéMON CENTER!',
          'We heal your POKéMON to full health in no time.',
          'Your team is fully restored. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc(
        'bill_cameo',
        6,
        4,
        'DOWN',
        'boy',
        '💻 BILL',
        [
          'BILL: Hey Gold! I just finished setting up the TIME CAPSULE upstairs!',
          'Come visit my family in GOLDENROD CITY sometime—I might have an EEVEE looking for a good home!',
        ]
      ),
    ],
    ecruteak_mart: [
      makeNpc(
        'ecruteak_clerk',
        1,
        3,
        'RIGHT',
        'fat_man',
        '🏪 MART CLERK',
        ['Welcome to ECRUTEAK MART! Stock up on AWAKENINGS and HYPER POTIONS before entering the towers!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
      makeNpc(
        'mart_trainer',
        6,
        6,
        'UP',
        'boy',
        '🧢 TRAINER',
        ['GHOST POKéMON love putting opponents to sleep with HYPNOSIS! Always carry AWAKENING!']
      ),
    ],
    ecruteak_gym: [
      makeNpc(
        'morty',
        4,
        3,
        'DOWN',
        'sage',
        '👻 LEADER MORTY',
        [
          'MORTY: The FOGBADGE is proof of your extraordinary spiritual bond with your partners.',
          'Continue on your journey with courage and quiet contemplation.',
        ],
        {
          action: 'MORTY_EVENT',
          trainerId: 'morty',
          trainerName: 'Leader Morty',
          challengePages: [
            "MORTY: Where is the legendary rainbow bird? I have meditated with ghost POKéMON in solitude waiting for its arrival. I see a shadow of greatness within you… Let us test your spirit!",
          ],
          trainerPokemon: { speciesId: 'gengar', level: 25, moves: ['shadowball', 'hypnosis', 'dreameater', 'meanlook'] },
          trainerTeam: [
            { speciesId: 'gastly', level: 21, moves: ['lick', 'spite', 'curse', 'meanlook'] },
            { speciesId: 'haunter', level: 21, moves: ['hypnosis', 'dreameater', 'curse', 'nightshade'] },
            { speciesId: 'gengar', level: 25, moves: ['shadowball', 'hypnosis', 'dreameater', 'meanlook'] },
            { speciesId: 'haunter', level: 23, moves: ['spite', 'curse', 'nightshade', 'confuseray'] },
          ],
        }
      ),
      makeNpc(
        'medium_martha',
        2,
        7,
        'RIGHT',
        'girl',
        '🔮 MEDIUM MARTHA',
        ['I communicate with wandering spirits in the mist!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'medium_martha',
          trainerName: 'Medium Martha',
          visionRange: 3,
          challengePages: ['MEDIUM MARTHA: Can you find the invisible path through our gym?'],
          trainerPokemon: { speciesId: 'gastly', level: 20, moves: ['lick', 'spite', 'nightshade'] },
          trainerTeam: [
            { speciesId: 'gastly', level: 20, moves: ['lick', 'spite', 'nightshade'] },
            { speciesId: 'haunter', level: 20, moves: ['spite', 'curse', 'nightshade'] },
          ],
        }
      ),
      makeNpc(
        'sage_ping',
        7,
        9,
        'LEFT',
        'sage',
        '🙏 SAGE PING',
        ['Our gym floor hides an abyss beneath invisible glass tiles!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_ping',
          trainerName: 'Sage Ping',
          visionRange: 3,
          challengePages: ['SAGE PING: Step carefully, challenger! Fear makes the spirit falter!'],
          trainerPokemon: { speciesId: 'haunter', level: 22, moves: ['nightshade', 'curse', 'hypnosis'] },
          trainerTeam: [
            { speciesId: 'haunter', level: 22, moves: ['nightshade', 'curse', 'hypnosis'] },
          ],
        }
      ),
      makeNpc(
        'medium_grace',
        3,
        13,
        'RIGHT',
        'girl',
        '🔮 MEDIUM GRACE',
        ['The spirits illuminate only those who tread with steady resolve.'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'medium_grace',
          trainerName: 'Medium Grace',
          visionRange: 3,
          challengePages: ['MEDIUM GRACE: You shall vanish into the shadow realm!'],
          trainerPokemon: { speciesId: 'gastly', level: 20, moves: ['hypnosis', 'lick', 'dreameater'] },
          trainerTeam: [
            { speciesId: 'gastly', level: 20, moves: ['hypnosis', 'lick', 'dreameater'] },
            { speciesId: 'haunter', level: 20, moves: ['nightshade', 'curse', 'confuseray'] },
          ],
        }
      ),
      makeNpc(
        'sage_jeffrey',
        6,
        5,
        'LEFT',
        'sage',
        '🙏 SAGE JEFFREY',
        ['Beyond this misty bridge awaits LEADER MORTY himself!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_jeffrey',
          trainerName: 'Sage Jeffrey',
          visionRange: 3,
          challengePages: ['SAGE JEFFREY: Prove that your heart does not harbor fear!'],
          trainerPokemon: { speciesId: 'haunter', level: 22, moves: ['nightshade', 'hypnosis', 'dreameater'] },
          trainerTeam: [
            { speciesId: 'haunter', level: 22, moves: ['nightshade', 'hypnosis', 'dreameater'] },
          ],
        }
      ),
      makeNpc(
        'ecruteak_gym_guide',
        2,
        16,
        'UP',
        'fat_man',
        '🥊 GYM GUIDE',
        [
          'Yo! CHAMP in the making!',
          'MORTY uses GHOST-type POKéMON! NORMAL and FIGHTING moves cannot damage them at all!',
          'Bring PSYCHIC, GROUND, or GHOST moves to banish their spooky illusions!',
        ]
      ),
    ],
    dance_theater: [
      makeNpc(
        'kimono_naoko',
        2,
        5,
        'DOWN',
        'girl',
        '👘 KIMONO NAOKO',
        ['My FLAREON’s flame burns bright!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'kimono_naoko',
          trainerName: 'Kimono Girl Naoko',
          visionRange: 2,
          challengePages: ['KIMONO NAOKO: Welcome to our stage! Watch our traditional dance of fire!'],
          trainerPokemon: { speciesId: 'flareon', level: 17, moves: ['ember', 'quickattack', 'sandattack'] },
          trainerTeam: [
            { speciesId: 'flareon', level: 17, moves: ['ember', 'quickattack', 'sandattack'] },
          ],
        }
      ),
      makeNpc(
        'kimono_sayo',
        4,
        5,
        'DOWN',
        'girl',
        '👘 KIMONO SAYO',
        ['My ESPEON sees the dance of the sun!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'kimono_sayo',
          trainerName: 'Kimono Girl Sayo',
          visionRange: 2,
          challengePages: ['KIMONO SAYO: Psychic power and graceful steps flow together!'],
          trainerPokemon: { speciesId: 'espeon', level: 17, moves: ['confusion', 'quickattack', 'tailwhip'] },
          trainerTeam: [
            { speciesId: 'espeon', level: 17, moves: ['confusion', 'quickattack', 'tailwhip'] },
          ],
        }
      ),
      makeNpc(
        'kimono_zuki',
        6,
        5,
        'DOWN',
        'girl',
        '👘 KIMONO ZUKI',
        ['My UMBREON dances beneath the moon!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'kimono_zuki',
          trainerName: 'Kimono Girl Zuki',
          visionRange: 2,
          challengePages: ['KIMONO ZUKI: Moonlight reveals the true bond of friendship!'],
          trainerPokemon: { speciesId: 'umbreon', level: 17, moves: ['pursuit', 'quickattack', 'sandattack'] },
          trainerTeam: [
            { speciesId: 'umbreon', level: 17, moves: ['pursuit', 'quickattack', 'sandattack'] },
          ],
        }
      ),
      makeNpc(
        'kimono_kuni',
        8,
        5,
        'DOWN',
        'girl',
        '👘 KIMONO KUNI',
        ['My VAPOREON melts into pure water!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'kimono_kuni',
          trainerName: 'Kimono Girl Kuni',
          visionRange: 2,
          challengePages: ['KIMONO KUNI: Flow gracefully like a sparkling stream!'],
          trainerPokemon: { speciesId: 'vaporeon', level: 17, moves: ['watergun', 'quickattack', 'sandattack'] },
          trainerTeam: [
            { speciesId: 'vaporeon', level: 17, moves: ['watergun', 'quickattack', 'sandattack'] },
          ],
        }
      ),
      makeNpc(
        'kimono_miki',
        10,
        4,
        'DOWN',
        'girl',
        '👘 KIMONO MIKI',
        ['My JOLTEON strikes like a crack of lightning!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'kimono_miki',
          trainerName: 'Kimono Girl Miki',
          visionRange: 2,
          challengePages: ['KIMONO MIKI: Feel the electric pulse of our sacred dance!'],
          trainerPokemon: { speciesId: 'jolteon', level: 17, moves: ['thundershock', 'quickattack', 'sandattack'] },
          trainerTeam: [
            { speciesId: 'jolteon', level: 17, moves: ['thundershock', 'quickattack', 'sandattack'] },
          ],
        }
      ),
      makeNpc(
        'surf_gentleman',
        9,
        10,
        'UP',
        'fat_man',
        '🎩 ADMIRER',
        [
          'Bravo! Magnificent! You defeated all five KIMONO GIRLS with peerless grace!',
          'Take this HM03 SURF! With the FOGBADGE, your POKéMON can carry you across oceans and lakes!',
        ]
      ),
    ],
    ecruteak_itemfinder_house: [
      makeNpc(
        'item_man',
        3,
        3,
        'DOWN',
        'fat_man',
        '🔍 ITEM COLLECTOR',
        [
          "There are countless items hidden in the grass, rocks, and ruins of Johto that aren't obvious to the naked eye.",
          'Aha! I see you already have the upgraded Neo-Kanto Dowsing Machine equipped! It projects a real-time radar beam pointing straight toward buried treasures within 8 paces!',
        ]
      ),
    ],
    burned_tower_1f: [
      makeNpc(
        'eusine',
        10,
        12,
        'DOWN',
        'silver',
        '🎩 EUSINE',
        [
          "I'm EUSINE! I’ve spent my entire life pursuing the legendary SUICUNE across the world!",
          'It is said to represent the north wind and pure water!',
          'Morty and I have been investigating the mysterious aura pulsating beneath this floor.',
        ]
      ),
      makeNpc(
        'morty_burned',
        12,
        12,
        'LEFT',
        'sage',
        '👻 MORTY',
        [
          'ECRUTEAK GYM LEADER MORTY: The BURNED TOWER burned down 150 years ago in a lightning storm.',
          'Three nameless POKéMON perished here, but were revived by the rainbow phoenix into legends.',
          'Until the spirits show themselves, I meditate here in solemn contemplation.',
        ]
      ),
      makeNpc(
        'silver_burned',
        10,
        10,
        'DOWN',
        'silver',
        '❓ RIVAL SILVER',
        [
          'SILVER: …Hmph! What are you doing here?',
          'Only weak trainers talk about legendaries. I only care about strong, ruthless POKéMON!',
        ],
        {
          action: 'RIVAL_BURNED_TOWER_BATTLE',
          trainerId: 'silver_burned',
          trainerName: 'Passerby Silver',
          challengePages: [
            'SILVER: …Hmph! You followed me all the way to ECRUTEAK?',
            "Don't tell me you're chasing myths about legendary beasts too! Weaklings need legends. I only need supreme power!",
            "Get out of my way! I'll show you what real strength looks like!",
          ],
        }
      ),
    ],
    burned_tower_b1f: [
      makeNpc(
        'beasts',
        10,
        3,
        'DOWN',
        'fat_man',
        '⚡ LEGENDARY BEASTS',
        [
          'Three majestic beasts stand petrified in stone: RAIKOU, ENTEI, and SUICUNE!',
          'As you approach, their eyes glow with ancient celestial energy!',
          'They roar and leap from the subterranean cavern, scattering across the Johto overworld!',
        ],
        {
          action: 'BEASTS_AWAKENING',
        }
      ),
    ],
    tin_tower_1f: [
      makeNpc(
        'suicune_altar',
        9,
        9,
        'DOWN',
        'lapras',
        '💎 SUICUNE',
        [
          "SUICUNE: Gurr-oooh! The crystal beast radiates pure, divine luminescence!",
        ],
        { action: 'SUICUNE_TIN_TOWER_EVENT' }
      ),
      makeNpc(
        'tin_tower_sage',
        7,
        13,
        'RIGHT',
        'sage',
        '🏮 TOWER SAGE',
        [
          'Only those who carry the CLEAR BELL and RAINBOW WING may ascend the sacred staircase to the summit of TIN TOWER!',
        ]
      ),
    ],

    // ==========================================
    // PHASE 10: WESTERN JOHTO NPCS
    // ==========================================

    route_38: [
      makeNpc('schoolboy_chad', 4, 1, 'RIGHT', 'boy', '🎒 SCHOOLBOY CHAD', ['Mr. Mime creates invisible walls!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'schoolboy_chad',
        trainerName: 'Schoolboy Chad',
        visionRange: 2,
        challengePages: ['CHAD: I study Pokémon battle theory every single day! Let me show you!'],
        trainerPokemon: { speciesId: 'mrmime', level: 19, moves: ['confusion', 'lightscreen', 'reflect'] },
        trainerTeam: [{ speciesId: 'mrmime', level: 19, moves: ['confusion', 'lightscreen', 'reflect'] }],
      }),
      makeNpc('lass_dana', 15, 3, 'DOWN', 'girl', '🎀 LASS DANA', ['Flaaffy’s wool is so soft and warm!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'lass_dana',
        trainerName: 'Lass Dana',
        visionRange: 2,
        challengePages: ['DANA: My Flaaffy is cute and shockingly strong!'],
        trainerPokemon: { speciesId: 'flaaffy', level: 18, moves: ['thundershock', 'thunderwave', 'tackle'] },
        trainerTeam: [{ speciesId: 'flaaffy', level: 18, moves: ['thundershock', 'thunderwave', 'tackle'] }],
      }),
      makeNpc('beauty_valerie', 19, 9, 'DOWN', 'girl', '💄 BEAUTY VALERIE', ['Dandelion Pokémon drift on the breeze.'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'beauty_valerie',
        trainerName: 'Beauty Valerie',
        visionRange: 2,
        challengePages: ['VALERIE: Hi there! Care for a lovely battle along Route 38?'],
        trainerPokemon: { speciesId: 'hoppip', level: 17, moves: ['tackle', 'tailwhip', 'synthesis'] },
        trainerTeam: [
          { speciesId: 'hoppip', level: 17, moves: ['tackle', 'tailwhip', 'synthesis'] },
          { speciesId: 'skiploom', level: 17, moves: ['tackle', 'tailwhip', 'leechseed'] },
        ],
      }),
      makeNpc('sailor_harry', 24, 5, 'LEFT', 'fisherman', '⚓ SAILOR HARRY', ['Wooper loves damp marshes!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'sailor_harry',
        trainerName: 'Sailor Harry',
        visionRange: 2,
        challengePages: ['HARRY: Ahoy! A sailor never shies away from a brisk battle!'],
        trainerPokemon: { speciesId: 'wooper', level: 19, moves: ['watergun', 'slam', 'tailwhip'] },
        trainerTeam: [{ speciesId: 'wooper', level: 19, moves: ['watergun', 'slam', 'tailwhip'] }],
      }),
    ],

    route_38_ecruteak_gate: [
      makeNpc('route_38_officer', 5, 2, 'DOWN', 'teacher', '👮 OFFICER', [
        'Where are you headed? Olivine City is further west across Route 39.',
      ]),
    ],

    route_39: [
      makeNpc('sailor_eugene', 13, 29, 'LEFT', 'fisherman', '⚓ SAILOR EUGENE', ['Poliwhirl spins like a whirlpool!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'sailor_eugene',
        trainerName: 'Sailor Eugene',
        visionRange: 2,
        challengePages: ['EUGENE: Just docking from sea! Let’s test your strength!'],
        trainerPokemon: { speciesId: 'poliwhirl', level: 20, moves: ['watergun', 'hypnosis', 'doubleslap'] },
        trainerTeam: [{ speciesId: 'poliwhirl', level: 20, moves: ['watergun', 'hypnosis', 'doubleslap'] }],
      }),
      makeNpc('pokefan_derek', 10, 21, 'UP', 'fat_man', '🧢 POKéFAN DEREK', ['Pikachu’s cheeks spark with joy!'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'pokefan_derek',
        trainerName: 'Pokéfan Derek',
        visionRange: 2,
        challengePages: ['DEREK: Look at my adorable partner Pikachu! Isn’t it the greatest?'],
        trainerPokemon: { speciesId: 'pikachu', level: 18, moves: ['thunderbolt', 'quickattack', 'tailwhip'] },
        trainerTeam: [{ speciesId: 'pikachu', level: 18, moves: ['thunderbolt', 'quickattack', 'tailwhip'] }],
      }),
      makeNpc('pokefan_ruth', 11, 19, 'RIGHT', 'teacher', '👒 POKéFAN RUTH', ['Clefairy dances under the moon.'], {
        action: 'TRAINER_BATTLE',
        trainerId: 'pokefan_ruth',
        trainerName: 'Pokéfan Ruth',
        visionRange: 2,
        challengePages: ['RUTH: My darling Clefairy loves to meet new travelers!'],
        trainerPokemon: { speciesId: 'clefairy', level: 18, moves: ['metronome', 'pound', 'sing'] },
        trainerTeam: [{ speciesId: 'clefairy', level: 18, moves: ['metronome', 'pound', 'sing'] }],
      }),
      makeNpc('pokefan_jaime', 4, 22, 'DOWN', 'teacher', '🌾 POKéFAN JAIME', [
        'The Miltank here produce the richest milk in all of Johto!',
      ]),
    ],

    route_39_barn: [
      makeNpc('moomoo_miltank', 3, 3, 'DOWN', 'fat_man', '🐮 MILTANK', [
        'MILTANK: Mooo! (It looks healthy and full of life!)',
      ]),
      makeNpc('barn_twin_1', 2, 3, 'RIGHT', 'girl', '👧 TWIN LULU', [
        'We take good care of Miltank every single day!',
      ]),
      makeNpc('barn_twin_2', 4, 3, 'LEFT', 'girl', '👧 TWIN NANA', [
        'Fresh Moomoo Milk makes both humans and POKéMON strong!',
      ]),
    ],

    route_39_farmhouse: [
      makeNpc('dairy_farmer', 3, 2, 'DOWN', 'fat_man', '👨‍🌾 DAIRY FARMER', [
        'Welcome to MOOMOO FARM! Our Moomoo Milk is famous all across Johto and Kanto.',
      ]),
      makeNpc('farmer_wife', 2, 3, 'RIGHT', 'teacher', '👩‍🌾 FARMER’S WIFE', [
        'Drinking nutritious milk every morning keeps our family full of energy!',
      ]),
    ],

  };
}
