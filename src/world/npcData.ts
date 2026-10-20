import type { Direction } from '../types/game';
import type { GridEntity } from './GridPhysics';

export const makeNpc = (
  id: string,
  x: number,
  y: number,
  direction: Direction,
  spriteType: GridEntity['spriteType'],
  speaker: string,
  pages: string[],
  opts: {
    wanders?: boolean;
    talkAcrossCounter?: boolean;
    action?: GridEntity['action'];
    trainerId?: string;
    trainerName?: string;
    visionRange?: number;
    challengePages?: string[];
    trainerPokemon?: GridEntity['trainerPokemon'];
    trainerTeam?: GridEntity['trainerTeam'];
  } = {}
): GridEntity => ({
  id,
  x,
  y,
  gridX: x,
  gridY: y,
  targetX: x,
  targetY: y,
  renderX: x,
  renderY: y,
  direction,
  isMoving: false,
  progress: 0,
  isPlayer: false,
  spriteType,
  speaker,
  pages,
  wanders: opts.wanders ?? false,
  talkAcrossCounter: opts.talkAcrossCounter ?? false,
  action: opts.action,
  trainerId: opts.trainerId,
  trainerName: opts.trainerName,
  visionRange: opts.visionRange,
  challengePages: opts.challengePages,
  trainerPokemon: opts.trainerPokemon,
  trainerTeam: opts.trainerTeam,
});

export function createNpcsByMap(): Record<string, GridEntity[]> {
  return {
    new_bark_town: [
      makeNpc(
        'nbt_teacher',
        6,
        8,
        'DOWN',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          'Wow, your POKéGEAR is impressive! Did your mom get it for you?',
          'Oh! Your POKéMON is adorable! I wish I had one!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'nbt_fisher',
        12,
        9,
        'DOWN',
        'fisherman',
        '🎣 FISHER',
        ['Yo, GOLD!', 'I hear PROF. ELM discovered some new POKéMON.'],
        { wanders: true }
      ),
      makeNpc('nbt_rival', 3, 2, 'RIGHT', 'silver', '❓ RIVAL ???', [
        '<……>\nSo this is the famous ELM POKéMON LAB…',
        '…What are you staring at?',
      ]),
    ],
    route_29: [
      makeNpc('r29_dude', 50, 12, 'DOWN', 'boy', '🧢 CATCHING DUDE', [
        "POKéMON hide in the grass. Who knows when they'll pop out…",
        'If you weaken them first, POKéMON are much easier to catch!',
      ]),
      makeNpc(
        'youngster_joey',
        28,
        6,
        'DOWN',
        'boy',
        '👦 YOUNGSTER JOEY',
        [
          'Yo! My RATTATA is in the top percentage of all RATTATA!',
          'If your POKéMON are weak and not ready for battle, keep out of the grass!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_joey',
          trainerName: 'Youngster Joey',
          visionRange: 3,
          challengePages: [
            "YOUNGSTER JOEY: I just lost, so I'm trying to find more POKéMON!",
            "Wait! You look weak! Come on, let's battle!",
          ],
          trainerPokemon: {
            speciesId: 'rattata',
            level: 4,
            moves: ['tackle', 'tailwhip', 'quickattack'],
          },
        }
      ),
      makeNpc(
        'r29_teacher',
        15,
        11,
        'RIGHT',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          "See those ledges? It's scary to jump off them.",
          'But you can go to NEW BARK without walking through the grass.',
        ],
        { wanders: true }
      ),
      makeNpc('r29_fisher', 25, 3, 'UP', 'fisherman', '🎣 FISHER', [
        'I wanted to take a break, so I saved to record my progress.',
      ]),
      makeNpc('r29_gate_officer', 27, 1, 'DOWN', 'teacher', '👮 GATE OFFICER', [
        'OFFICER: Hold on, rookie!',
        'The mountain path leading up to ROUTE 46 is steep and rugged.',
        "You can't climb up those jagged cliff ledges, and the mountain Pokémon up there are fierce!",
        'Get some more training under your belt before heading into the northern ridges!',
      ]),
    ],
    cherrygrove_city: [
      makeNpc('cg_guide_gent', 32, 6, 'DOWN', 'fat_man', '👴 GUIDE GENT', [
        "You're a rookie trainer, aren't you? I can tell!",
        "That's OK! Everyone is a rookie at some point!",
        'POKéGEAR becomes more useful as you add CARDS. Head NORTH up ROUTE 30 to visit MR. POKéMON!',
      ]),
      makeNpc(
        'cg_teacher',
        27,
        12,
        'LEFT',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          'Did you talk to the old man by the POKéMON CENTER?',
          "When you're with POKéMON, going anywhere is fun.",
        ],
        { wanders: true }
      ),
      makeNpc(
        'cg_youngster',
        23,
        7,
        'RIGHT',
        'boy',
        '👦 YOUNGSTER',
        [
          "MR. POKéMON's house is still farther up ahead on ROUTE 30.",
          "Be careful—trainers on ROUTE 30 will challenge you if you cross their line of sight!",
        ],
        { wanders: true }
      ),
      makeNpc('cg_fisher', 7, 12, 'RIGHT', 'fisherman', '🎣 MYSTIC WATER GUY', [
        "A POKéMON I caught had an item. I think it's MYSTIC WATER.",
        'Back to fishing for me, then.',
      ]),
    ],
    route_30: [
      makeNpc(
        'youngster_mikey',
        4,
        26,
        'RIGHT',
        'boy',
        '👦 YOUNGSTER MIKEY',
        [
          'Becoming a good trainer is really tough.',
          "I'm going to battle other people to get better.",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_mikey',
          trainerName: 'Youngster Mikey',
          visionRange: 3,
          challengePages: [
            "YOUNGSTER MIKEY: You're a POKéMON trainer, right?",
            'Then you have to battle!',
          ],
          trainerPokemon: {
            speciesId: 'hoot-hoot',
            level: 4,
            moves: ['tackle', 'growl', 'peck', 'hypnosis'],
          },
        }
      ),
      makeNpc(
        'bug_catcher_don',
        2,
        18,
        'RIGHT',
        'bug_catcher',
        '🐞 BUG CATCHER DON',
        [
          'I ran out of POKé BALLS while I was catching bugs.',
          'You should buy extra at CHERRYGROVE MART!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_don',
          trainerName: 'Bug Catcher Don',
          visionRange: 3,
          challengePages: [
            'BUG CATCHER DON: Instead of a bug POKéMON, I found a trainer!',
          ],
          trainerPokemon: {
            speciesId: 'caterpie',
            level: 3,
            moves: ['tackle', 'stringshot'],
          },
        }
      ),
      makeNpc(
        'r30_cooltrainer',
        11,
        40,
        'UP',
        'girl',
        '🧢 COOLTRAINER',
        [
          "MR. POKéMON's house is straight ahead on the right fork!",
          'The left path leads north to ROUTE 31 and VIOLET CITY.',
        ],
        { wanders: true }
      ),
    ],
    route_31: [
      makeNpc(
        'bug_catcher_wade',
        21,
        8,
        'LEFT',
        'bug_catcher',
        '🐞 BUG CATCHER WADE',
        [
          'You can catch POKéMON even if you already have six with you.',
          "They're automatically transferred to your BOX!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_wade',
          trainerName: 'Bug Catcher Wade',
          visionRange: 4,
          challengePages: [
            'BUG CATCHER WADE: I caught a bunch of POKéMON. Let me battle with you!',
          ],
          trainerPokemon: {
            speciesId: 'weedle',
            level: 4,
            moves: ['poisonsting', 'stringshot', 'tackle'],
          },
        }
      ),
      makeNpc('r31_sleepy_man', 17, 7, 'DOWN', 'fat_man', '😴 SLEEPY MAN', [
        '… Hnuurg… Huh?',
        'I walked too far today looking for POKéMON in DARK CAVE.',
        "My feet hurt and I'm sleepy… Zzz…",
      ]),
      makeNpc(
        'r31_mail_guy',
        28,
        9,
        'DOWN',
        'boy',
        '📬 KENYA DELIVERER',
        [
          'I found a good POKéMON in DARK CAVE.',
          "I'm going to raise it to take on FALKNER at VIOLET GYM!",
        ],
        { wanders: true }
      ),
    ],
    route_31_violet_gate: [
      makeNpc('r31_gate_officer', 5, 2, 'DOWN', 'teacher', '👮 GATE OFFICER', [
        'OFFICER: Hi there! Did you visit SPROUT TOWER?',
        'VIOLET CITY is just ahead to the west. Good luck at the GYM!',
      ]),
    ],
    mr_pokemons_house: [
      makeNpc(
        'mr_pokemon_npc',
        3,
        3,
        'DOWN',
        'fat_man',
        '🎩 MR. POKéMON',
        [
          'Hello, hello! You must be GOLD, sent by PROF. ELM!',
          'This is the rare egg I asked PROF. ELM to examine—the MYSTERY EGG!',
          'I know a couple who run a POKéMON DAY-CARE. They gave me that EGG.',
        ],
        { action: 'MR_POKEMON_EVENT' }
      ),
      makeNpc(
        'prof_oak_npc',
        5,
        3,
        'DOWN',
        'fat_man',
        '🎓 PROF. OAK',
        [
          'Aha! So you are GOLD! I am OAK, a POKéMON researcher.',
          'I was just visiting my old friend MR. POKéMON.',
          'Your CYNDAQUIL seems very attached to you! Here, take this latest-model POKéDEX!',
        ],
        { action: 'MR_POKEMON_EVENT' }
      ),
    ],
    route_30_berry_house: [
      makeNpc(
        'berry_man_npc',
        2,
        3,
        'DOWN',
        'fat_man',
        '🍎 BERRY HOUSE MAN',
        [
          'You know, POKéMON eat BERRIES.',
          'Well, my POKéMON got healthier by eating a BERRY! Here, share this POTION for the road!',
        ],
        { action: 'BERRY_MAN_EVENT' }
      ),
    ],
    elms_lab: [
      makeNpc(
        'elm_npc',
        5,
        2,
        'DOWN',
        'prof_elm',
        '🔬 PROF. ELM',
        [
          "Hi, GOLD! I've been researching unusual POKéMON evolutions here in NEW BARK TOWN.",
          "MR. POKéMON beyond CHERRYGROVE CITY on ROUTE 30 sent word of a rare discovery, and legends speak of three Legendary Beasts slumbering in ECRUTEAK's BURNED TOWER.",
          'Here—let me heal your POKéMON and record your research progress!',
        ],
        { action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('elm_aide', 2, 9, 'UP', 'boy', '🥼 LAB AIDE', [
        'There was a loud noise outside…',
        'To add to your POKéDEX, you have to catch POKéMON. Throw POKé BALLS at wild POKéMON to get them!',
      ]),
    ],
    players_house_1f: [
      makeNpc(
        'mom_npc',
        7,
        4,
        'LEFT',
        'mom',
        '🏠 MOM',
        [
          'Oh, GOLD…! Your POKéMON GEAR is back from the repair shop.',
          'Rest up for a moment, sweetheart! Your POKéMON are looking fit and energized!',
        ],
        { action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('neighbor_visit_npc', 4, 4, 'RIGHT', 'kris', '🏡 NEIGHBOR', [
        'Good day! PROF. ELM discovered that PIKACHU is an evolved POKéMON.',
        "My daughter is adamant about becoming PROF. ELM's assistant. She really loves POKéMON!",
      ]),
    ],
    players_neighbors_house: [
      makeNpc('neighbor_daughter', 2, 3, 'RIGHT', 'kris', "👧 NEIGHBOR'S DAUGHTER", [
        "PIKACHU is an evolved POKéMON. I was amazed by PROF. ELM's findings.",
        "He's so famous for his research on POKéMON evolution… I wish I could be a researcher like him…",
      ]),
    ],
    elms_house: [
      makeNpc('elms_wife', 1, 5, 'RIGHT', 'teacher', "👩 PROF. ELM'S WIFE", [
        "Hi, GOLD! My husband's always so busy—I hope he's OK.",
        "When he's caught up in his POKéMON research, he even forgets to eat.",
      ]),
      makeNpc('elms_son', 5, 4, 'UP', 'bug_catcher', "👦 PROF. ELM'S SON", [
        "When I grow up, I'm going to help my dad!",
        "I'm going to be a great POKéMON professor!",
      ]),
    ],
    cherrygrove_poke_center: [
      makeNpc(
        'nurse_joy',
        3,
        1,
        'DOWN',
        'girl',
        '👩‍⚕️ NURSE JOY',
        [
          'Welcome to our POKéMON CENTER!',
          'We can heal your POKéMON to perfect health in no time at all.',
          'Your fighting party has been restored to full HP & PP. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('pc_fisher', 2, 3, 'UP', 'fat_man', '🎣 FISHER', [
        "It's great. I can store any number of POKéMON, and it's all free.",
      ]),
      makeNpc('pc_gentleman', 8, 6, 'UP', 'fat_man', '🎩 GENTLEMAN', [
        'That PC in the corner is free for any trainer to use.',
      ]),
      makeNpc('pc_teacher', 1, 6, 'RIGHT', 'girl', '👩‍🏫 TEACHER', [
        'The COMMUNICATION CENTER upstairs was just built.',
        'I traded POKéMON there already!',
      ]),
    ],
    cherrygrove_mart: [
      makeNpc(
        'mart_clerk',
        1,
        3,
        'RIGHT',
        'fat_man',
        '🏪 MART CLERK',
        ['Welcome to CHERRYGROVE POKé MART! How may I serve you?'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
      makeNpc(
        'mart_cooltrainer',
        7,
        6,
        'LEFT',
        'boy',
        '🧢 COOLTRAINER',
        ['POKé BALLS are in stock! Now I can catch POKéMON!'],
        { wanders: true }
      ),
      makeNpc('mart_youngster', 2, 5, 'DOWN', 'boy', '👦 YOUNGSTER', [
        'When I was walking in the grass, a bug POKéMON poisoned my POKéMON!',
        'You should always keep an ANTIDOTE with you.',
      ]),
    ],
    guide_gents_house: [
      makeNpc('house_guide_gent', 2, 3, 'RIGHT', 'fat_man', '👴 GUIDE GENT', [
        'When I was a wee lad, I was a hot-shot trainer!',
        "Here's a word of advice: Catch lots of POKéMON! Treat them all with kindness!",
      ]),
    ],
    cherrygrove_gym_speech_house: [
      makeNpc('gym_speech_npc', 2, 3, 'RIGHT', 'boy', '👦 TRAINER', [
        "You're trying to see how good you are as a POKéMON trainer?",
        'You better visit the POKéMON GYMS all over JOHTO and collect BADGES!',
      ]),
    ],
    cherrygrove_evolution_speech_house: [
      makeNpc('evo_speech_npc', 3, 5, 'LEFT', 'girl', '👧 LASS', [
        'POKéMON gain experience in battle and change their form.',
        'Their appearance changes, and sometimes even their type!',
      ]),
    ],
    sprout_tower_1f: [
      makeNpc(
        'sage_chow',
        14,
        7,
        'DOWN',
        'sage',
        '🙏 SAGE CHOW',
        [
          'We stand guard in this tower.',
          'Here, we express our gratitude to honor all POKéMON.',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_chow',
          trainerName: 'Sage Chow',
          visionRange: 3,
          challengePages: [
            'SAGE CHOW: We stand guard in this tower! Here, we express our gratitude to honor all POKéMON!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 3,
            moves: ['vinewhip'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
          ],
        }
      ),
    ],
    sprout_tower_2f: [
      makeNpc(
        'sage_nico',
        12,
        12,
        'RIGHT',
        'sage',
        '🙏 SAGE NICO',
        [
          'However hard we battle, the TOWER will stand strong.',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_nico',
          trainerName: 'Sage Nico',
          visionRange: 3,
          challengePages: [
            'SAGE NICO: However hard we battle, the TOWER will stand strong!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 3,
            moves: ['vinewhip'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
          ],
        }
      ),
      makeNpc(
        'sage_edmond',
        9,
        4,
        'LEFT',
        'sage',
        '🙏 SAGE EDMOND',
        [
          '…Sway like leaves in the wind…',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_edmond',
          trainerName: 'Sage Edmond',
          visionRange: 3,
          challengePages: [
            'SAGE EDMOND: …Sway like leaves in the wind… Let us battle!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 3,
            moves: ['vinewhip'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
          ],
        }
      ),
    ],
    sprout_tower_3f: [
      makeNpc(
        'sage_jin',
        8,
        11,
        'RIGHT',
        'sage',
        '🙏 SAGE JIN',
        [
          'I train to find enlightenment in POKéMON!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_jin',
          trainerName: 'Sage Jin',
          visionRange: 3,
          challengePages: [
            'SAGE JIN: I train to find enlightenment in POKéMON!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 6,
            moves: ['vinewhip', 'growth'],
          },
        }
      ),
      makeNpc(
        'sage_neal',
        11,
        11,
        'LEFT',
        'sage',
        '🙏 SAGE NEAL',
        [
          "The ELDER's HM illuminates even the pitch-black darkness.",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_neal',
          trainerName: 'Sage Neal',
          visionRange: 3,
          challengePages: [
            "SAGE NEAL: The ELDER's HM illuminates even the pitch-black darkness!",
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 6,
            moves: ['vinewhip', 'growth'],
          },
        }
      ),
      makeNpc(
        'sage_troy',
        6,
        3,
        'DOWN',
        'sage',
        '🙏 SAGE TROY',
        [
          'It is not far to the ELDER.',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_troy',
          trainerName: 'Sage Troy',
          visionRange: 2,
          challengePages: [
            'SAGE TROY: Let me see how much you trust your POKéMON!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 7,
            moves: ['vinewhip', 'growth'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 7, moves: ['vinewhip', 'growth'] },
            { speciesId: 'hoot-hoot', level: 7, moves: ['tackle', 'growl', 'peck'] },
          ],
        }
      ),
      makeNpc(
        'elder_li',
        10,
        3,
        'DOWN',
        'elder_li',
        '🏮 ELDER LI',
        [
          'ELDER LI: You care deeply for your POKéMON. With TM70 / HM05 FLASH, even the darkest caves will shine bright.',
          'Go forth and challenge FALKNER at the VIOLET CITY GYM!',
        ],
        {
          action: 'ELDER_LI_EVENT',
          trainerId: 'elder_li',
          trainerName: 'Elder Li',
          challengePages: [
            'ELDER LI: So, you have come seeking enlightenment with your POKéMON. As the ELDER of SPROUT TOWER, I shall test the bond between you and your partners!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 7,
            moves: ['vinewhip', 'growth'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 7, moves: ['vinewhip', 'growth'] },
            { speciesId: 'bellsprout', level: 7, moves: ['vinewhip', 'wrap'] },
            { speciesId: 'hoot-hoot', level: 10, moves: ['tackle', 'hypnosis', 'peck'] },
          ],
        }
      ),
    ],
    violet_gym: [
      makeNpc(
        'gym_guide',
        7,
        13,
        'DOWN',
        'fat_man',
        '🕶️ GYM GUIDE',
        [
          "Yo! I'm no trainer, but I can give some advice! Believe me! If you believe, a championship dream can come true. You believe? Then listen.",
          'The grass-type is weak against the flying-type. Keep this in mind.',
        ]
      ),
      makeNpc(
        'bird_keeper_abe',
        2,
        10,
        'RIGHT',
        'bird_keeper',
        '🦅 BIRD KEEPER ABE',
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
      makeNpc(
        'bird_keeper_rod',
        7,
        6,
        'LEFT',
        'bird_keeper',
        '🦅 BIRD KEEPER ROD',
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
      makeNpc(
        'falkner',
        5,
        1,
        'DOWN',
        'falkner',
        '🦅 LEADER FALKNER',
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
      makeNpc(
        'nurse_violet',
        3,
        1,
        'DOWN',
        'mom',
        '💖 NURSE JOY',
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
      makeNpc(
        'mart_clerk_violet',
        1,
        3,
        'RIGHT',
        'boy',
        '🛒 MART CLERK',
        ['Welcome to the VIOLET CITY POKéMON MART! How may I serve you?'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    violet_city: [
      makeNpc(
        'earl',
        28,
        18,
        'DOWN',
        'earl',
        '🎓 EARL DERVISH',
        [
          'Twirl! Twirl! Did you beat FALKNER at the GYM? Magnificent!',
          'I am EARL! I teach young trainers all about POKéMON at the POKéMON ACADEMY right behind me!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'violet_girl',
        14,
        20,
        'RIGHT',
        'girl',
        '👧 VIOLET LASS',
        [
          'Ghosts are rumored to appear in SPROUT TOWER at night.',
          'Wait—you already climbed to the top and defeated ELDER LI?! Amazing!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'violet_bird_trainer',
        26,
        25,
        'LEFT',
        'bird_keeper',
        '🦅 BIRD FAN',
        [
          'Hey, are you a POKéMON trainer? PIDGEY and SPEAROW are both Flying-types, but SPEAROW has a much fiercer Attack stat!',
        ]
      ),
    ],
    earls_pokemon_academy: [
      makeNpc(
        'earl_teacher',
        4,
        3,
        'UP',
        'earl',
        '🎓 PROFESSOR EARL',
        [
          'Twirl! Welcome to EARL\'S POKéMON ACADEMY!',
          'In battle, a move matching your POKéMON\'s own type deals 1.5x damage! That\'s Same-Type Attack Bonus!',
        ]
      ),
      makeNpc(
        'academy_boy',
        3,
        5,
        'UP',
        'boy',
        '👦 STUDENT',
        [
          "I'm taking notes from the blackboard! PARALYSIS cuts a POKéMON's Speed in half and may prevent it from moving!",
        ]
      ),
      makeNpc(
        'academy_girl',
        5,
        5,
        'UP',
        'girl',
        '👧 STUDENT',
        [
          'Electric- and Rock-type moves are super effective against Flying-types like FALKNER\'s bird POKéMON!',
        ]
      ),
    ],
    violet_kyles_house: [
      makeNpc(
        'kyle',
        2,
        4,
        'RIGHT',
        'boy',
        '👦 KYLE',
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
      makeNpc(
        'nickname_teacher',
        2,
        4,
        'RIGHT',
        'teacher',
        '👩 NICKNAME FAN',
        [
          'She gives her POKéMON nicknames like STRAWBERRY! Giving a POKéMON a thoughtful nickname makes your bond even stronger!',
        ]
      ),
    ],
  };
}

export const npcsByMap: Record<string, GridEntity[]> = createNpcsByMap();
