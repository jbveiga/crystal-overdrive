/**
 * @fileoverview mahoganyToIndigoNpcs domain module implementation.
 * @module world/npcs/mahoganyToIndigoNpcs
 * @role mahoganyToIndigoNpcs Component
 * @exports createMahoganyToIndigoNpcs
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-130: Implementation | L131-261: Handlers & Exports
 */

import type { GridEntity } from '../GridPhysics';
import { makeNpc } from './npcShared';
import { createRoute26And27Npcs } from './route26And27Npcs';

export function createMahoganyToIndigoNpcs(): Record<string, GridEntity[]> {
  return {
    route_42: [
      makeNpc('route_42_fisher_tully', 40, 10, 'LEFT', 'fisherman', '🎣 FISHER TULLY', [
        "Let's see if the fish are biting!",
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'fisher_tully',
        trainerName: 'Fisher Tully',
        visionRange: 1,
        challengePages: ["TULLY: Let's see if the fish are biting!"],
        trainerPokemon: { speciesId: 'qwilfish', level: 19, moves: ['tackle', 'poisonsting', 'watergun', 'harden'] },
        trainerTeam: [{ speciesId: 'qwilfish', level: 19, moves: ['tackle', 'poisonsting', 'watergun', 'harden'] }],
      }),
      makeNpc('route_42_hiker_benjamin', 51, 9, 'DOWN', 'fat_man', '🥾 HIKER BENJAMIN', [
        "The mountain trails keep my legs strong!",
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'hiker_benjamin',
        trainerName: 'Hiker Benjamin',
        wanders: true,
        visionRange: 3,
        challengePages: ["BENJAMIN: The mountain trails keep my legs strong! Let's battle!"],
        trainerPokemon: { speciesId: 'diglett', level: 14, moves: ['scratch', 'growl', 'magnitude'] },
        trainerTeam: [{ speciesId: 'diglett', level: 14, moves: ['scratch', 'growl', 'magnitude'] }, { speciesId: 'geodude', level: 14, moves: ['tackle', 'defensecurl', 'rockthrow'] }, { speciesId: 'dugtrio', level: 16, moves: ['scratch', 'growl', 'magnitude', 'dig'] }],
      }),
      makeNpc('route_42_pokemaniac_shane', 47, 8, 'DOWN', 'super_nerd', '🎒 POKéMANIAC SHANE', [
        "I'm looking for rare Pokémon inside Mt. Mortar!",
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'pokemaniac_shane',
        trainerName: 'Pokémaniac Shane',
        visionRange: 3,
        challengePages: ["SHANE: I'm looking for rare Pokémon inside Mt. Mortar! Are you tough enough?"],
        trainerPokemon: { speciesId: 'nidorina', level: 16, moves: ['growl', 'tackle', 'scratch', 'poisonsting'] },
        trainerTeam: [{ speciesId: 'nidorina', level: 16, moves: ['growl', 'tackle', 'scratch', 'poisonsting'] }, { speciesId: 'nidorino', level: 16, moves: ['leer', 'tackle', 'hornattack', 'poisonsting'] }],
      }),
      makeNpc('route_42_suicune', 26, 16, 'DOWN', 'suicune', '💎 SUICUNE', [
        'SUICUNE: Gurr-oooh!',
      ], { action: 'ROUTE_42_SUICUNE_EVENT' }),
    ],

    route_42_ecruteak_gate: [
      makeNpc('route_42_gate_officer', 5, 2, 'DOWN', 'officer', '👮 OFFICER', [
        'MT. MORTAR is like a maze inside.',
        'Be careful if you get lost, you might wander forever without FLASH or ESCAPE ROPES!',
      ], { action: 'ROUTE_42_GATE_OFFICER' }),
    ],

    mount_mortar_1f_inside: [
      makeNpc('mount_mortar_1f_inside_miller', 33, 43, 'LEFT', 'super_nerd', '🎒 POKéMANIAC MILLER', [
        'I love rare horned Pokémon!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'pokemaniac_miller',
        trainerName: 'Pokémaniac Miller',
        visionRange: 3,
        challengePages: ["MILLER: My horned beasts rule this cavern! Let's see your team!"],
        trainerPokemon: { speciesId: 'nidoking', level: 17, moves: ['tackle', 'hornattack', 'poisonsting', 'focusenergy'] },
        trainerTeam: [
          { speciesId: 'nidoking', level: 17, moves: ['tackle', 'hornattack', 'poisonsting', 'focusenergy'] },
          { speciesId: 'nidoqueen', level: 17, moves: ['tackle', 'scratch', 'poisonsting', 'tailwhip'] },
        ],
      }),
      makeNpc('mount_mortar_1f_inside_markus', 24, 28, 'DOWN', 'super_nerd', '🤓 SUPER NERD MARKUS', [
        'I came in here exploring with my research partner HUGH, but we got separated in the darkness!',
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'super_nerd_markus',
        trainerName: 'Super Nerd Markus',
        visionRange: 3,
        challengePages: ["MARKUS: Hey! Did you see my partner HUGH? No? Then let's battle while I search!"],
        trainerPokemon: { speciesId: 'slowpoke', level: 19, moves: ['tackle', 'growl', 'watergun', 'confusion'] },
        trainerTeam: [{ speciesId: 'slowpoke', level: 19, moves: ['tackle', 'growl', 'watergun', 'confusion'] }],
      }),
      makeNpc('mount_mortar_1f_inside_boulder', 21, 43, 'DOWN', 'boulder', '🪨 BOULDER', [
        'A large boulder blocks the path.',
        'A Pokémon with STRENGTH could shove it aside!',
      ], { action: 'STRENGTH_BOULDER' }),
    ],

    mount_mortar_2f_inside: [
      makeNpc('mount_mortar_2f_inside_hugh', 13, 26, 'DOWN', 'super_nerd', '🤓 SUPER NERD HUGH', [
        "I'm looking for my buddy MARKUS. He's probably lost on the lower levels…",
      ], {
        action: 'TRAINER_BATTLE',
        trainerId: 'super_nerd_hugh',
        trainerName: 'Super Nerd Hugh',
        visionRange: 2,
        challengePages: ["HUGH: Yo! I've been training up here on the high cliffs of Mt. Mortar!"],
        trainerPokemon: { speciesId: 'seadra', level: 39, moves: ['bubblebeam', 'smokescreen', 'twister', 'agility'] },
        trainerTeam: [{ speciesId: 'seadra', level: 39, moves: ['bubblebeam', 'smokescreen', 'twister', 'agility'] }],
      }),
    ],

    mount_mortar_b1f: [
      makeNpc('mount_mortar_b1f_kiyo', 16, 4, 'DOWN', 'black_belt', '🥋 KARATE KING KIYO', [
        'KIYO: Hey! I am the KARATE KING! I train alone here in the dark depths of Mt. Mortar!',
      ], {
        action: 'KIYO_EVENT',
        trainerId: 'blackbelt_kiyo',
        trainerName: 'Karate King Kiyo',
        challengePages: [
          'KIYO: Hey! I am the KARATE KING!',
          'I train alone here in the dark! You want to challenge me? Prepare yourself!',
        ],
        trainerPokemon: { speciesId: 'hitmonlee', level: 34, moves: ['doublekick', 'meditate', 'jumpkick', 'focusenergy'] },
        trainerTeam: [
          { speciesId: 'hitmonlee', level: 34, moves: ['doublekick', 'meditate', 'jumpkick', 'focusenergy'] },
          { speciesId: 'hitmonchan', level: 34, moves: ['cometpunch', 'agility', 'firepunch', 'icepunch'] },
        ],
      }),
      makeNpc('mount_mortar_b1f_boulder', 9, 10, 'DOWN', 'boulder', '🪨 BOULDER', [
        'A large boulder blocks the path.',
        'A Pokémon with STRENGTH could shove it aside!',
      ], { action: 'STRENGTH_BOULDER' }),
    ],

    lake_of_rage: [
      makeNpc('lake_of_rage_red_gyarados', 21, 15, 'DOWN', 'lapras', '🐉 GYARADOS', 
        [
          "GYARADOS: Gyashaa! The lake's waters churn violently as the crimson Gyarados thrashes with fury!",
        ],
        { action: 'RED_GYARADOS_EVENT' }
      ),
      makeNpc('lake_of_rage_lance', 21, 30, 'UP', 'gentleman', '🏆 CHAMPION LANCE', 
        [
          "LANCE: ...So you're the one who quelled that Gyarados. Impressive!",
        ],
        { action: 'LANCE_LAKE_EVENT' }
      ),
      makeNpc('wesley_of_wednesday', 8, 18, 'DOWN', 'black_belt', '🥋 WESLEY OF WEDNESDAY', 
        [
          "WESLEY: Yo! I'm WESLEY of Wednesday! You must train diligently!",
          "Here's a BLACK BELT! It boosts the power of FIGHTING-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
    ],

    mahogany_town: [
      makeNpc('mahogany_gym_blocker', 6, 14, 'DOWN', 'fat_man', 'TOWN RESIDENT', [
        "Gym Leader Pryce went up to the Lake of Rage to investigate the strange Pokémon disturbance.",
        "The Gym is closed until the emergency at the lake and the souvenir shop is resolved!",
      ], { action: 'MAHOGANY_GYM_BLOCKER' }),
      makeNpc('mahogany_rage_candy_bar_salesman', 19, 8, 'DOWN', 'pokefan_m', '🍬 RAGECANDYBAR SALESMAN', [
        'While visiting MAHOGANY TOWN, try a delicious RAGECANDYBAR!',
      ], { action: 'MAHOGANY_RAGECANDYBAR_SALESMAN' }),
      makeNpc('mahogany_town_rocket_1', 16, 13, 'DOWN', 'rocket_grunt_m', '⚡ ROCKET GRUNT', [
        "TEAM ROCKET: What are you looking at? Mind your own business, brat!",
      ]),
    ],

    mahogany_mart: [
      makeNpc('mahogany_mart_lance', 4, 4, 'UP', 'gentleman', '🏆 CHAMPION LANCE', [
        "LANCE: You made it! The transmitter signal is emanating right from beneath this floor.",
        "Lance moves the heavy cabinet to reveal a secret stairway descending underground!",
        "LANCE: Follow me down! We need to shut down the generator Electrodes powering their broadcast!",
      ], { action: 'LANCE_MART_EVENT' }),
      makeNpc('mahogany_mart_rocket', 3, 3, 'DOWN', 'rocket_grunt_m', '⚡ SOUVENIR CLERK', [
        "TEAM ROCKET: We only sell the finest souvenirs... Hey, don't snoop around back there!",
      ]),
    ],

    route_43_gate: [
      makeNpc('route_43_gate_rocket_1', 2, 4, 'RIGHT', 'rocket_grunt_m', '⚡ ROCKET GRUNT', [
        "TEAM ROCKET: This gate belongs to TEAM ROCKET! Pay the ¥1000 toll if you want to pass!",
      ]),
      makeNpc('route_43_gate_rocket_2', 7, 4, 'LEFT', 'rocket_grunt_m', '⚡ ROCKET GRUNT', [
        "TEAM ROCKET: Don't complain to us! If you can't afford ¥1000, go through the grass maze!",
      ]),
    ],

    team_rocket_base_b1f: [
      makeNpc('team_rocket_base_b1f_switch', 19, 11, 'UP', 'super_nerd', '💻 SECURITY TERMINAL', [
        "A surveillance camera control terminal.", "The security switch is right here!",
      ], { action: 'ROCKET_BASE_SECURITY_SWITCH' }),
      makeNpc('team_rocket_base_b1f_grunt_1', 17, 6, 'LEFT', 'rocket_grunt_m', '⚡ ROCKET GRUNT', [
        "ROCKET GRUNT: The Persian statues watch every move! You'll never slip past our surveillance network!",
      ]),
    ],

    team_rocket_base_b2f: [
      makeNpc('team_rocket_base_b2f_lance', 18, 10, 'DOWN', 'gentleman', '🏆 CHAMPION LANCE', [
        "LANCE: Are your Pokémon holding up? Here, let me restore your team to full fighting strength!",
      ], { action: 'LANCE_BASE_HEAL' }),
      makeNpc('team_rocket_base_b2f_ariana', 15, 10, 'DOWN', 'rocket_grunt_f', '⚡ EXECUTIVE ARIANA', [
        "ARIANA: You've meddled in TEAM ROCKET's affairs for the last time!",
      ], { action: 'ROCKET_BASE_ARIANA_EVENT' }),
      makeNpc('b2f_electrode_1', 7, 5, 'DOWN', 'voltorb', '⚡ ELECTRODE', [
        "⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"
      ], { action: 'ROCKET_GENERATOR_ELECTRODE' }),
      makeNpc('b2f_electrode_2', 7, 7, 'DOWN', 'voltorb', '⚡ ELECTRODE', [
        "⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"
      ], { action: 'ROCKET_GENERATOR_ELECTRODE' }),
      makeNpc('b2f_electrode_3', 7, 9, 'DOWN', 'voltorb', '⚡ ELECTRODE', [
        "⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"
      ], { action: 'ROCKET_GENERATOR_ELECTRODE' }),
    ],

    team_rocket_base_b3f: [
      makeNpc('team_rocket_base_b3f_grunt_f', 21, 7, 'LEFT', 'rocket_grunt_f', '⚡ ROCKET GRUNT', [
        "ROCKET GRUNT: You want the password to the BOSS's office? You'll have to beat me first!",
      ], { action: 'ROCKET_BASE_PASSWORD_GRUNT_F' }),
      makeNpc('team_rocket_base_b3f_grunt_m', 5, 14, 'UP', 'rocket_grunt_m', '⚡ ROCKET GRUNT', [
        "ROCKET GRUNT: The password? I'd never leak that to a meddling kid like you!",
      ], { action: 'ROCKET_BASE_PASSWORD_GRUNT_M' }),
      makeNpc('team_rocket_base_b3f_petrel', 10, 3, 'DOWN', 'super_nerd', '⚡ EXECUTIVE PETREL', [
        "PETREL: What? Who let a child into the Executive Suite?",
      ], { action: 'ROCKET_BASE_PETREL_EVENT' }),
      makeNpc('team_rocket_base_b3f_murkrow', 10, 2, 'DOWN', 'farfetchd', '🐦 MURKROW', [
        "MURKROW: Squawk! Hail GIOVANNI!",
      ], { action: 'ROCKET_BASE_MURKROW_EVENT' }),
      makeNpc('b3f_electrode_1', 20, 5, 'DOWN', 'voltorb', '⚡ ELECTRODE', [
        "⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"
      ], { action: 'ROCKET_GENERATOR_ELECTRODE' }),
      makeNpc('b3f_electrode_2', 20, 7, 'DOWN', 'voltorb', '⚡ ELECTRODE', [
        "⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"
      ], { action: 'ROCKET_GENERATOR_ELECTRODE' }),
      makeNpc('b3f_electrode_3', 20, 9, 'DOWN', 'voltorb', '⚡ ELECTRODE', [
        "⚡ The ELECTRODE is locked into the generator, crackling with violent electrical surge!"
      ], { action: 'ROCKET_GENERATOR_ELECTRODE' }),
    ],

    blackthorn_city: [
      makeNpc('santos_of_saturday', 16, 16, 'DOWN', 'pokefan_m', '🏖️ SANTOS OF SATURDAY', 
        [
          "SANTOS: It's Saturday! I'm SANTOS of Saturday! Good to see you, trainer!",
          "Take this SOFT SAND! It boosts the power of GROUND-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
    ],

    dragon_shrine: [
      makeNpc('dragon_elder', 5, 3, 'DOWN', 'elder', '🐉 DRAGON MASTER ELDER', 
        [
          "ELDER: Welcome, young trainer, to the sacred DRAGON SHRINE.",
          "CLAIR brought you here to test your worthiness as a true dragon disciple.",
        ],
        { action: 'DRAGON_ELDER_EVENT' }
      ),
    ],

    victory_road: [
      // Rival Silver Ambush at exit chokepoint
      makeNpc('victory_road_rival', 13, 7, 'DOWN', 'silver', '🔴 RIVAL SILVER', [
        "RIVAL: You really made it through VICTORY ROAD? Don't think for a second that you're stronger than me!",
      ], {
        action: 'VICTORY_ROAD_RIVAL_EVENT',
        trainerId: 'rival_victory_road',
        trainerName: 'Rival Silver',
        visionRange: 2,
        challengePages: [
          "RIVAL: Hold it! You really made it this far? Don't think for a second that you're stronger than me!",
          "I have assembled the ultimate team of ruthless, powerful POKéMON! I'll crush you before you even see the LEAGUE doors!",
        ],
        trainerPokemon: { speciesId: 'sneasel', level: 36, moves: ['slash', 'feintattack', 'quickattack'] },
        trainerTeam: [
          { speciesId: 'sneasel', level: 36, moves: ['slash', 'feintattack', 'quickattack'] },
          { speciesId: 'golbat', level: 36, moves: ['wingattack', 'bite', 'confuseray'] },
          { speciesId: 'magneton', level: 35, moves: ['thundershock', 'sonicboom', 'supersonic'] },
          { speciesId: 'kadabra', level: 35, moves: ['psybeam', 'recover', 'disable'] },
          { speciesId: 'haunter', level: 35, moves: ['shadowball', 'curse', 'nightshade'] },
          { speciesId: 'feraligatr', level: 38, moves: ['surf', 'bite', 'slash', 'scaryface'] },
        ],
      }),

      // Strength Boulders on 2F
      makeNpc('victory_road_boulder_1', 4, 28, 'DOWN', 'boulder', '🪨 BOULDER', [
        'A giant boulder! It can be moved with STRENGTH.',
      ], { action: 'STRENGTH_BOULDER' }),
      makeNpc('victory_road_boulder_2', 16, 33, 'DOWN', 'boulder', '🪨 BOULDER', [
        'A giant boulder! It can be moved with STRENGTH.',
      ], { action: 'STRENGTH_BOULDER' }),
    ],

    wills_room: [
      makeNpc('e4_will', 5, 5, 'DOWN', 'psychic', '🎭 ELITE FOUR WILL', ["WILL: Welcome to the POKéMON LEAGUE! I am WILL, master of psychic power!"], {
        action: 'E4_EVENT', trainerId: 'will', trainerName: 'Elite Four Will',
        challengePages: ["WILL: I have trained all over the world to hone my psychic powers. Even if you defeated all 8 GYM LEADERS, you cannot break through my mind!"],
        trainerPokemon: { speciesId: 'xatu', level: 40, moves: ['confuseray', 'psychic', 'quickattack'] },
        trainerTeam: [{ speciesId: 'xatu', level: 40, moves: ['confuseray', 'psychic', 'quickattack'] }, { speciesId: 'jynx', level: 41, moves: ['icepunch', 'lovelykiss', 'psychic'] }, { speciesId: 'exeggutor', level: 41, moves: ['reflect', 'eggbomb', 'psychic'] }, { speciesId: 'slowbro', level: 41, moves: ['amnesia', 'surf', 'psychic'] }, { speciesId: 'xatu', level: 42, moves: ['confuseray', 'psychic', 'futuresight'] }],
      }),
    ],

    kogas_room: [
      makeNpc('e4_koga', 5, 5, 'DOWN', 'super_nerd', '🥷 ELITE FOUR KOGA', ["KOGA: Fwahahaha! A mere child reached me?! I am KOGA of the ELITE FOUR!"], {
        action: 'E4_EVENT', trainerId: 'koga', trainerName: 'Elite Four Koga',
        challengePages: ["KOGA: I have mastered ancient ninja techniques and toxic poisons! Feel the creeping dread of darkness!"],
        trainerPokemon: { speciesId: 'ariados', level: 40, moves: ['gigadrain', 'spiderweb', 'sludgebomb'] },
        trainerTeam: [{ speciesId: 'ariados', level: 40, moves: ['gigadrain', 'spiderweb', 'sludgebomb'] }, { speciesId: 'venomoth', level: 41, moves: ['supersonic', 'gust', 'toxic'] }, { speciesId: 'forretress', level: 43, moves: ['spikes', 'swift', 'explosion'] }, { speciesId: 'muk', level: 42, moves: ['minimize', 'acidarmor', 'sludgebomb'] }, { speciesId: 'crobat', level: 44, moves: ['wingattack', 'confuseray', 'toxic'] }],
      }),
    ],

    brunos_room: [
      makeNpc('e4_bruno', 5, 5, 'DOWN', 'blackbelt', '🥋 ELITE FOUR BRUNO', ["BRUNO: I am BRUNO of the ELITE FOUR! Through rigorous training, humans and POKéMON become one!"], {
        action: 'E4_EVENT', trainerId: 'bruno', trainerName: 'Elite Four Bruno',
        challengePages: ["BRUNO: We have lived and trained together in the deepest mountains! Feel our iron fists!"],
        trainerPokemon: { speciesId: 'hitmontop', level: 42, moves: ['pursuit', 'quickattack', 'dig'] },
        trainerTeam: [{ speciesId: 'hitmontop', level: 42, moves: ['pursuit', 'quickattack', 'dig'] }, { speciesId: 'hitmonlee', level: 42, moves: ['jumpkick', 'highjumpkick', 'foresight'] }, { speciesId: 'hitmonchan', level: 42, moves: ['thunderpunch', 'icepunch', 'firepunch'] }, { speciesId: 'onix', level: 43, moves: ['rockthrow', 'earthquake', 'slam'] }, { speciesId: 'machamp', level: 46, moves: ['crosschop', 'rockslide', 'vitalthrow'] }],
      }),
    ],

    karens_room: [
      makeNpc('e4_karen', 5, 5, 'DOWN', 'cooltrainer_f', '🌙 ELITE FOUR KAREN', ["KAREN: I am KAREN of the ELITE FOUR. Strong POKéMON. Weak POKéMON. That is only the selfish perception of people."], {
        action: 'E4_EVENT', trainerId: 'karen', trainerName: 'Elite Four Karen',
        challengePages: ["KAREN: Truly skilled trainers should try to win with their favorites. Let me show you what real bond means!"],
        trainerPokemon: { speciesId: 'umbreon', level: 42, moves: ['confuseray', 'feintattack', 'sandattack'] },
        trainerTeam: [{ speciesId: 'umbreon', level: 42, moves: ['confuseray', 'feintattack', 'sandattack'] }, { speciesId: 'vileplume', level: 42, moves: ['stunspore', 'acid', 'moonlight', 'petaldance'] }, { speciesId: 'gengar', level: 45, moves: ['shadowball', 'spite', 'curse', 'lick'] }, { speciesId: 'murkrow', level: 44, moves: ['faintattack', 'wingattack', 'whirlwind'] }, { speciesId: 'houndoom', level: 47, moves: ['flamethrower', 'crunch', 'roar'] }],
      }),
    ],

    lances_room: [
      makeNpc('champion_lance', 5, 6, 'DOWN', 'cooltrainer_m', '👑 CHAMPION LANCE', ["LANCE: I have been waiting for you, trainer. I knew that you, with your valor and bond, would reach me."], {
        action: 'E4_EVENT', trainerId: 'lance', trainerName: 'Champion Lance',
        challengePages: ["LANCE: As the POKéMON LEAGUE CHAMPION, I accept your challenge! Dragon-types are invincible! Let's begin!"],
        trainerPokemon: { speciesId: 'gyarados', level: 44, moves: ['hyperbeam', 'surf', 'bite'] },
        trainerTeam: [{ speciesId: 'gyarados', level: 44, moves: ['hyperbeam', 'surf', 'bite'] }, { speciesId: 'dragonite', level: 47, moves: ['thunderwave', 'twister', 'hyperbeam'] }, { speciesId: 'dragonite', level: 47, moves: ['blizzard', 'twister', 'hyperbeam'] }, { speciesId: 'aerodactyl', level: 46, moves: ['wingattack', 'rockslide', 'hyperbeam'] }, { speciesId: 'charizard', level: 46, moves: ['flamethrower', 'wingattack', 'slash'] }, { speciesId: 'dragonite', level: 50, moves: ['outrage', 'safeguard', 'hyperbeam', 'fireblast'] }],
      }),
    ],

    ice_path_b1f: [
      makeNpc('ice_path_b1f_boulder_1', 11, 7, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder! It can be moved with STRENGTH.'], { action: 'STRENGTH_BOULDER' }),
      makeNpc('ice_path_b1f_boulder_2', 7, 8, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder! It can be moved with STRENGTH.'], { action: 'STRENGTH_BOULDER' }),
      makeNpc('ice_path_b1f_boulder_3', 8, 9, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder! It can be moved with STRENGTH.'], { action: 'STRENGTH_BOULDER' }),
      makeNpc('ice_path_b1f_boulder_4', 17, 7, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder! It can be moved with STRENGTH.'], { action: 'STRENGTH_BOULDER' }),
    ],

    ice_path_b2f_mahogany_side: [
      makeNpc('ice_path_b2f_boulder_1', 11, 4, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder that fell from the floor above!']),
      makeNpc('ice_path_b2f_boulder_2', 4, 6, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder that fell from the floor above!']),
      makeNpc('ice_path_b2f_boulder_3', 4, 12, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder that fell from the floor above!']),
      makeNpc('ice_path_b2f_boulder_4', 12, 12, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder that fell from the floor above!']),
    ],

    blackthorn_gym_2f: [
      makeNpc('blackthorn_gym_2f_boulder_1', 8, 2, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder! It can be moved with STRENGTH.'], { action: 'BLACKTHORN_BOULDER' }),
      makeNpc('blackthorn_gym_2f_boulder_2', 3, 7, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder! It can be moved with STRENGTH.'], { action: 'BLACKTHORN_BOULDER' }),
      makeNpc('blackthorn_gym_2f_boulder_3', 3, 15, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder! It can be moved with STRENGTH.'], { action: 'BLACKTHORN_BOULDER' }),
    ],

    blackthorn_gym_1f: [
      makeNpc('blackthorn_gym_1f_boulder_1', 7, 6, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder that fell from 2F, bridging the lava!']),
      makeNpc('blackthorn_gym_1f_boulder_2', 3, 7, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder that fell from 2F, bridging the lava!']),
      makeNpc('blackthorn_gym_1f_boulder_3', 4, 14, 'DOWN', 'boulder', '🪨 BOULDER', ['A giant boulder that fell from 2F, bridging the lava!']),
    ],

    route_45: [
      makeNpc('route_45_hiker_erik', 10, 16, 'RIGHT', 'fat_man', '⛰️ HIKER ERIK', ['ERIK: Whew! Beaten by an energetic youngster!'], { action: 'TRAINER_BATTLE', trainerId: 'hiker_erik', trainerName: 'Hiker Erik', visionRange: 2, challengePages: ['ERIK: My legs are built on these mountain trails! Be ready!'], trainerPokemon: { speciesId: 'machop', level: 24, moves: ['lowkick', 'karatechop', 'leer'] }, trainerTeam: [{ speciesId: 'machop', level: 24, moves: ['lowkick', 'karatechop', 'leer'] }, { speciesId: 'graveler', level: 27, moves: ['rockthrow', 'defensecurl', 'magnitude'] }, { speciesId: 'machop', level: 27, moves: ['lowkick', 'karatechop', 'seismictoss'] }] }),
      makeNpc('route_45_hiker_michael', 15, 65, 'RIGHT', 'fat_man', '⛰️ HIKER MICHAEL', ['MICHAEL: My rocks crumbled against your skill!'], { action: 'TRAINER_BATTLE', trainerId: 'hiker_michael', trainerName: 'Hiker Michael', visionRange: 2, challengePages: ['MICHAEL: No matter how tough the path, rock POKéMON can climb it!'], trainerPokemon: { speciesId: 'geodude', level: 25, moves: ['rockthrow', 'defensecurl', 'magnitude'] }, trainerTeam: [{ speciesId: 'geodude', level: 25, moves: ['rockthrow', 'defensecurl', 'magnitude'] }, { speciesId: 'graveler', level: 25, moves: ['rockthrow', 'defensecurl', 'magnitude'] }, { speciesId: 'golem', level: 25, moves: ['rockthrow', 'magnitude', 'rollout'] }] }),
      makeNpc('route_45_hiker_parry', 5, 28, 'UP', 'fat_man', '⛰️ HIKER PARRY', ['PARRY: Even iron will break against true power!'], { action: 'TRAINER_BATTLE', trainerId: 'hiker_parry', trainerName: 'Hiker Parry', visionRange: 2, challengePages: ['PARRY: My team can smash through any boulder!'], trainerPokemon: { speciesId: 'onix', level: 35, moves: ['slam', 'rockthrow', 'screech', 'rage'] }, trainerTeam: [{ speciesId: 'onix', level: 35, moves: ['slam', 'rockthrow', 'screech', 'rage'] }, { speciesId: 'swinub', level: 33, moves: ['tackle', 'powdersnow', 'endure', 'takedown'] }] }),
      makeNpc('route_45_hiker_timothy', 9, 65, 'LEFT', 'fat_man', '⛰️ HIKER TIMOTHY', ['TIMOTHY: You dug right through my defenses!'], { action: 'TRAINER_BATTLE', trainerId: 'hiker_timothy', trainerName: 'Hiker Timothy', visionRange: 2, challengePages: ['TIMOTHY: The best treasures are buried in the mountain soil!'], trainerPokemon: { speciesId: 'diglett', level: 27, moves: ['slash', 'dig', 'mudslap', 'growl'] }, trainerTeam: [{ speciesId: 'diglett', level: 27, moves: ['slash', 'dig', 'mudslap', 'growl'] }, { speciesId: 'dugtrio', level: 27, moves: ['slash', 'dig', 'mudslap', 'growl'] }] }),
      makeNpc('route_45_blackbelt_kenji', 11, 50, 'DOWN', 'blackbelt', '🥋 BLACKBELT KENJI', ['KENJI: My training still has a long way to go!'], { action: 'TRAINER_BATTLE', trainerId: 'blackbelt_kenji', trainerName: 'Blackbelt Kenji', visionRange: 2, challengePages: ['KENJI: I train my body day and night under roaring mountain waterfalls!'], trainerPokemon: { speciesId: 'onix', level: 27, moves: ['slam', 'bind', 'rockthrow'] }, trainerTeam: [{ speciesId: 'onix', level: 27, moves: ['slam', 'bind', 'rockthrow'] }, { speciesId: 'hitmonlee', level: 30, moves: ['jumpkick', 'rollingkick', 'meditate'] }, { speciesId: 'machoke', level: 32, moves: ['karatechop', 'lowkick', 'focusenergy'] }] }),
      makeNpc('route_45_cooltrainer_m_ryan', 17, 18, 'LEFT', 'cooltrainer_m', '⚡ COOLTRAINER♂ RYAN', ['RYAN: Impressive! You have genuine speed and skill!'], { action: 'TRAINER_BATTLE', trainerId: 'cooltrainer_m_ryan', trainerName: 'Cooltrainer Ryan', visionRange: 3, challengePages: ["RYAN: I've conquered every peak in Johto! Can you withstand my speed?"], trainerPokemon: { speciesId: 'pidgeot', level: 25, moves: ['wingattack', 'quickattack', 'whirlwind'] }, trainerTeam: [{ speciesId: 'pidgeot', level: 25, moves: ['wingattack', 'quickattack', 'whirlwind'] }, { speciesId: 'electabuzz', level: 27, moves: ['thunderpunch', 'quickattack', 'lightscreen', 'swift'] }] }),
      makeNpc('route_45_cooltrainer_f_kelly', 5, 36, 'DOWN', 'cooltrainer_f', '🌺 COOLTRAINER♀ KELLY', ['KELLY: You battle with extraordinary composure!'], { action: 'TRAINER_BATTLE', trainerId: 'cooltrainer_f_kelly', trainerName: 'Cooltrainer Kelly', visionRange: 3, challengePages: ["KELLY: Battling in the high altitude sharpens our senses! Let's go!"], trainerPokemon: { speciesId: 'marill', level: 27, moves: ['bubblebeam', 'rollout', 'defensecurl', 'tailwhip'] }, trainerTeam: [{ speciesId: 'marill', level: 27, moves: ['bubblebeam', 'rollout', 'defensecurl', 'tailwhip'] }, { speciesId: 'wartortle', level: 24, moves: ['watergun', 'bite', 'withdraw', 'rapidspin'] }, { speciesId: 'wartortle', level: 24, moves: ['watergun', 'bite', 'withdraw', 'rapidspin'] }] }),
      makeNpc('route_45_camper_quentin', 4, 70, 'DOWN', 'camper', '⛺ CAMPER QUENTIN', ['QUENTIN: Even wild instincts weren\'t enough!'], { action: 'TRAINER_BATTLE', trainerId: 'camper_quentin', trainerName: 'Camper Quentin', visionRange: 2, challengePages: ['QUENTIN: Camping up here teaches you pure wilderness survival!'], trainerPokemon: { speciesId: 'fearow', level: 30, moves: ['drillpeck', 'furyattack', 'leer', 'pursuit'] }, trainerTeam: [{ speciesId: 'fearow', level: 30, moves: ['drillpeck', 'furyattack', 'leer', 'pursuit'] }, { speciesId: 'primeape', level: 30, moves: ['karatechop', 'rage', 'seismictoss'] }, { speciesId: 'tauros', level: 30, moves: ['hornattack', 'tailwhip', 'rage', 'pursuit'] }] }),
    ],

    route_46: [
      makeNpc('route_46_hiker_bailey', 12, 19, 'LEFT', 'fat_man', '⛰️ HIKER BAILEY', ['BAILEY: All five of my Geodude... tumbled down!'], { action: 'TRAINER_BATTLE', trainerId: 'hiker_bailey', trainerName: 'Hiker Bailey', visionRange: 2, challengePages: ["BAILEY: You'll never get through my unbreakable wall of Geodude!"], trainerPokemon: { speciesId: 'geodude', level: 13, moves: ['tackle', 'defensecurl', 'rockthrow'] }, trainerTeam: [{ speciesId: 'geodude', level: 13, moves: ['tackle', 'defensecurl', 'rockthrow'] }, { speciesId: 'geodude', level: 13, moves: ['tackle', 'defensecurl', 'rockthrow'] }, { speciesId: 'geodude', level: 13, moves: ['tackle', 'defensecurl', 'rockthrow'] }, { speciesId: 'geodude', level: 13, moves: ['tackle', 'defensecurl', 'rockthrow'] }, { speciesId: 'geodude', level: 13, moves: ['tackle', 'defensecurl', 'rockthrow'] }] }),
      makeNpc('route_46_camper_ted', 4, 14, 'UP', 'camper', '⛺ CAMPER TED', ['TED: Mankey lost its temper!'], { action: 'TRAINER_BATTLE', trainerId: 'camper_ted', trainerName: 'Camper Ted', visionRange: 2, challengePages: ['TED: Mankey and I are practicing our mountain sprint!'], trainerPokemon: { speciesId: 'mankey', level: 17, moves: ['scratch', 'lowkick', 'karatechop', 'furyswipes'] }, trainerTeam: [{ speciesId: 'mankey', level: 17, moves: ['scratch', 'lowkick', 'karatechop', 'furyswipes'] }] }),
      makeNpc('route_46_picnicker_erin', 2, 13, 'DOWN', 'picnicker', '🧺 PICNICKER ERIN', ['ERIN: Oh no, my Ponyta was outpaced!'], { action: 'TRAINER_BATTLE', trainerId: 'picnicker_erin', trainerName: 'Picnicker Erin', visionRange: 2, challengePages: ['ERIN: My Ponyta can leap right over these mountain ledges!'], trainerPokemon: { speciesId: 'ponyta', level: 16, moves: ['tackle', 'ember', 'growl', 'tailwhip'] }, trainerTeam: [{ speciesId: 'ponyta', level: 16, moves: ['tackle', 'ember', 'growl', 'tailwhip'] }, { speciesId: 'ponyta', level: 16, moves: ['tackle', 'ember', 'growl', 'tailwhip'] }] }),
    ],

    route_29_route_46_gate: [
      makeNpc('route_29_route_46_gate_officer', 0, 4, 'RIGHT', 'officer', '👮 OFFICER', [
        'ROUTE 45 and 46 can only be traversed one-way downhill from BLACKTHORN CITY.',
        'Ledges prevent climbing back up!',
      ], { action: 'ROUTE_46_GATE_OFFICER' }),
      makeNpc('route_29_route_46_gate_youngster', 6, 4, 'LEFT', 'youngster', '👦 BOY', [
        'If you jump down ledges, you cannot get back up without circling around.',
      ], { action: 'ROUTE_46_GATE_YOUNGSTER' }),
    ],

    indigo_plateau_poke_center: [
      makeNpc('indigo_plateau_nurse', 3, 7, 'DOWN', 'teacher', '👩‍⚕️ NURSE JOY', [
        'Welcome to the POKéMON LEAGUE POKéMON CENTER!',
        'We can heal your POKéMON to perfect health before your big challenge.',
      ], { action: 'HEAL_AND_SAVE', talkAcrossCounter: true }),
      makeNpc('indigo_plateau_clerk', 11, 7, 'DOWN', 'clerk', '🏪 MART CLERK', [
        'Welcome! Stock up on medicine and ULTRA BALLS before challenging the ELITE FOUR!',
      ], { action: 'OPEN_MART', talkAcrossCounter: true }),
      makeNpc('indigo_teleport_guy', 1, 9, 'DOWN', 'gramps', '👴 TELEPORT GRAMPS', [
        'Ah! You are challenging the ELITE FOUR? If you need to train some more, my ABRA can TELEPORT you home to NEW BARK TOWN!',
      ], { action: 'INDIGO_TELEPORT_EVENT' }),
      makeNpc('indigo_teleport_abra', 0, 9, 'DOWN', 'psychic', '🔮 ABRA', [
        'ABRA: Aabra…',
      ]),
      makeNpc('indigo_league_guard', 14, 4, 'DOWN', 'officer', '👮 LEAGUE GUARD', [
        'Beyond this door lie the chambers of the ELITE FOUR!',
      ], { action: 'INDIGO_LEAGUE_GUARD' }),
      makeNpc('indigo_cooltrainer_m', 11, 11, 'DOWN', 'cooltrainer_m', '👦 COOLTRAINER', [
        'The ELITE FOUR use psychic, poison, fighting, and dark types. Prepare your party well!',
      ]),
    ],

    hall_of_fame: [
      makeNpc('hall_of_fame_lance', 4, 2, 'DOWN', 'cooltrainer_m', '👑 CHAMPION LANCE', [
        'Welcome to the HALL OF FAME!',
        'Step forward to the induction machine to record your victory for all eternity!',
      ], { action: 'HALL_OF_FAME_EVENT' }),
    ],

    ...createRoute26And27Npcs(),
  };
}
