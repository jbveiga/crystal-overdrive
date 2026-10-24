import type { Direction } from '../types/game';
import type { GridEntity } from './GridPhysics';
import { GENERATED_NPCS } from './generatedNpcs';

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

export interface GuideGentTourLegDef {
  leg: number;
  name: string;
  steps: Direction[];
  guideEnd: { x: number; y: number; direction: Direction };
  playerEnd: { x: number; y: number; direction: Direction };
  dialoguePages?: string[];
  isRetireLeg?: boolean;
}

export const GUIDE_GENT_TOUR_LEGS: GuideGentTourLegDef[] = [
  {
    leg: 1,
    name: 'Pokemon Center',
    steps: ['LEFT', 'LEFT', 'UP', 'LEFT'],
    guideEnd: { x: 29, y: 5, direction: 'UP' },
    playerEnd: { x: 30, y: 5, direction: 'UP' },
    dialoguePages: [
      "GUIDE GENT: This is a POKéMON CENTER. They heal your POKéMON in no time at all. You'll be relying on them a lot, so you ought to know about them.",
    ],
  },
  {
    leg: 2,
    name: 'Pokemon Mart',
    steps: ['LEFT', 'LEFT', 'LEFT', 'LEFT', 'LEFT', 'LEFT'],
    guideEnd: { x: 23, y: 5, direction: 'UP' },
    playerEnd: { x: 24, y: 5, direction: 'UP' },
    dialoguePages: [
      "GUIDE GENT: This is a POKéMON MART. They sell BALLS for catching wild POKéMON and other useful items.",
    ],
  },
  {
    leg: 3,
    name: 'Route 30 Road',
    steps: ['LEFT', 'LEFT', 'LEFT', 'LEFT', 'LEFT', 'LEFT', 'LEFT'],
    guideEnd: { x: 16, y: 5, direction: 'UP' },
    playerEnd: { x: 17, y: 5, direction: 'UP' },
    dialoguePages: [
      "GUIDE GENT: ROUTE 30 is out this way. Trainers will be battling their prized POKéMON there.",
    ],
  },
  {
    leg: 4,
    name: 'The Sea',
    steps: ['LEFT', 'LEFT', 'LEFT', 'DOWN', 'LEFT', 'LEFT', 'LEFT', 'DOWN'],
    guideEnd: { x: 10, y: 7, direction: 'LEFT' },
    playerEnd: { x: 10, y: 6, direction: 'LEFT' },
    dialoguePages: [
      "GUIDE GENT: This is the sea, as you can see. Some POKéMON are found only in water.",
    ],
  },
  {
    leg: 5,
    name: "Guide Gent's House Porch",
    steps: [
      'DOWN',
      'DOWN',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'DOWN',
      'DOWN',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
      'RIGHT',
    ],
    guideEnd: { x: 25, y: 11, direction: 'LEFT' },
    playerEnd: { x: 24, y: 11, direction: 'RIGHT' },
    dialoguePages: [
      "GUIDE GENT: Here... It's my house! Thanks for your company. I'd like you to have this!",
    ],
  },
  {
    leg: 6,
    name: 'Retire Inside House',
    steps: ['UP', 'UP'],
    guideEnd: { x: 25, y: 9, direction: 'UP' },
    playerEnd: { x: 24, y: 11, direction: 'UP' },
    isRetireLeg: true,
  },
];

export function calculateTourLegCoordinates(
  initialGuidePos: { x: number; y: number } = { x: 32, y: 6 },
  initialPlayerPos: { x: number; y: number } = { x: 32, y: 7 },
  legs: GuideGentTourLegDef[] = GUIDE_GENT_TOUR_LEGS
): Array<{
  leg: number;
  name: string;
  guideEnd: { x: number; y: number; direction: Direction };
  playerEnd: { x: number; y: number; direction: Direction };
  path: Array<{
    guide: { x: number; y: number };
    player: { x: number; y: number };
  }>;
}> {
  const deltas: Record<Direction, { dx: number; dy: number }> = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 },
  };

  let curGuide = { ...initialGuidePos };
  let curPlayer = { ...initialPlayerPos };
  const results: Array<{
    leg: number;
    name: string;
    guideEnd: { x: number; y: number; direction: Direction };
    playerEnd: { x: number; y: number; direction: Direction };
    path: Array<{
      guide: { x: number; y: number };
      player: { x: number; y: number };
    }>;
  }> = [];

  for (const leg of legs) {
    const path: Array<{
      guide: { x: number; y: number };
      player: { x: number; y: number };
    }> = [];

    for (const step of leg.steps) {
      const d = deltas[step];
      const nextGuide = { x: curGuide.x + d.dx, y: curGuide.y + d.dy };
      if (!leg.isRetireLeg) {
        curPlayer = { x: curGuide.x, y: curGuide.y };
      }
      curGuide = nextGuide;
      path.push({
        guide: { ...curGuide },
        player: { ...curPlayer },
      });
    }

    results.push({
      leg: leg.leg,
      name: leg.name,
      guideEnd: { ...curGuide, direction: leg.guideEnd.direction },
      playerEnd: { ...curPlayer, direction: leg.playerEnd.direction },
      path,
    });
  }

  return results;
}

export interface DaySiblingInfo {
  id: string;
  name: string;
  day: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | string;
  dayOfWeekIndex: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  mapId: string;
  itemId: string;
  itemName: string;
  flag: string;
  speaker: string;
  giftPages: string[];
  alreadyGivenPages: string[];
  wrongDayPages: string[];
}

export const DAY_SIBLINGS: Record<string, DaySiblingInfo> = {
  monica_of_monday: {
    id: 'monica_of_monday',
    name: 'Monica of Monday',
    day: 'Monday',
    dayOfWeekIndex: 1,
    mapId: 'route_40',
    itemId: 'sharp_beak',
    itemName: 'SHARP BEAK',
    flag: 'received_item_monica',
    speaker: '🎀 MONICA OF MONDAY',
    giftPages: [
      "MONICA: Hello! I'm MONICA of Monday! As a token of friendship, please take this!",
      "It's a SHARP BEAK! It boosts the power of FLYING-type moves!",
    ],
    alreadyGivenPages: [
      "MONICA: My siblings are all across JOHTO! Did you meet them yet?",
    ],
    wrongDayPages: [
      "MONICA: Today's not Monday. How disappointing.",
    ],
  },
  tuscany_of_tuesday: {
    id: 'tuscany_of_tuesday',
    name: 'Tuscany of Tuesday',
    day: 'Tuesday',
    dayOfWeekIndex: 2,
    mapId: 'route_29',
    itemId: 'pink_bow',
    itemName: 'PINK BOW',
    flag: 'received_item_tuscany',
    speaker: '🎀 TUSCANY OF TUESDAY',
    giftPages: [
      "TUSCANY: Yahoo! I'm TUSCANY of Tuesday! Nice to meet you!",
      "Take this PINK BOW! It strengthens NORMAL-type moves!",
    ],
    alreadyGivenPages: [
      "TUSCANY: Do my siblings know you? We appear on different days of the week!",
    ],
    wrongDayPages: [
      "TUSCANY: Today's not Tuesday. How disappointing.",
    ],
  },
  wesley_of_wednesday: {
    id: 'wesley_of_wednesday',
    name: 'Wesley of Wednesday',
    day: 'Wednesday',
    dayOfWeekIndex: 3,
    mapId: 'lake_of_rage',
    itemId: 'black_belt',
    itemName: 'BLACK BELT',
    flag: 'received_item_wesley',
    speaker: '🥋 WESLEY OF WEDNESDAY',
    giftPages: [
      "WESLEY: Yo! I'm WESLEY of Wednesday! You must train diligently!",
      "Here's a BLACK BELT! It boosts the power of FIGHTING-type moves!",
    ],
    alreadyGivenPages: [
      "WESLEY: Keep training! Dedication is the path to strength!",
    ],
    wrongDayPages: [
      "WESLEY: Today's not Wednesday. How disappointing.",
    ],
  },
  arthur_of_thursday: {
    id: 'arthur_of_thursday',
    name: 'Arthur of Thursday',
    day: 'Thursday',
    dayOfWeekIndex: 4,
    mapId: 'route_36',
    itemId: 'hard_stone',
    itemName: 'HARD STONE',
    flag: 'received_item_arthur',
    speaker: '🪨 ARTHUR OF THURSDAY',
    giftPages: [
      "ARTHUR: Who am I? I'm ARTHUR of Thursday! Pleased to make your acquaintance!",
      "Here, take this HARD STONE! It powers up ROCK-type moves!",
    ],
    alreadyGivenPages: [
      "ARTHUR: A stone is solid and unwavering. Be like a rock in your journey!",
    ],
    wrongDayPages: [
      "ARTHUR: Today's not Thursday. How disappointing.",
    ],
  },
  frieda: {
    id: 'frieda',
    name: 'Frieda of Friday',
    day: 'Friday',
    dayOfWeekIndex: 5,
    mapId: 'route_32',
    itemId: 'poison_barb',
    itemName: 'POISON BARB',
    flag: 'received_item_frieda',
    speaker: '🎀 FRIEDA OF FRIDAY',
    giftPages: [
      "FRIEDA: Yahoo! It's Friday! I'm FRIEDA of Friday! Nice to meet you!",
      "Here's a POISON BARB to power up POISON-type moves!",
    ],
    alreadyGivenPages: [
      "FRIEDA: Isn't Friday wonderful? I hope your weekend is full of adventures!",
    ],
    wrongDayPages: [
      "FRIEDA: Today's not Friday. How disappointing.",
    ],
  },
  santos_of_saturday: {
    id: 'santos_of_saturday',
    name: 'Santos of Saturday',
    day: 'Saturday',
    dayOfWeekIndex: 6,
    mapId: 'blackthorn_city',
    itemId: 'spell_tag',
    itemName: 'SPELL TAG',
    flag: 'received_item_santos',
    speaker: '👻 SANTOS OF SATURDAY',
    giftPages: [
      "SANTOS: It's Saturday! I'm SANTOS of Saturday! Good to see you, trainer!",
      "Take this SPELL TAG! It boosts the power of GHOST-type moves!",
    ],
    alreadyGivenPages: [
      "SANTOS: Have you met my other six siblings? We are scattered all over!",
    ],
    wrongDayPages: [
      "SANTOS: Today's not Saturday. How disappointing.",
    ],
  },
  sunny_of_sunday: {
    id: 'sunny_of_sunday',
    name: 'Sunny of Sunday',
    day: 'Sunday',
    dayOfWeekIndex: 0,
    mapId: 'route_37',
    itemId: 'magnet',
    itemName: 'MAGNET',
    flag: 'received_item_sunny',
    speaker: '⚡ SUNNY OF SUNDAY',
    giftPages: [
      "SUNNY: Hi! I'm SUNNY of Sunday! Nice to meet you!",
      "Here is a MAGNET to power up ELECTRIC-type moves!",
    ],
    alreadyGivenPages: [
      "SUNNY: Sunday is the best day to recharge! Enjoy your day!",
    ],
    wrongDayPages: [
      "SUNNY: Today's not Sunday. How disappointing.",
    ],
  },
};
DAY_SIBLINGS['frieda_of_friday'] = DAY_SIBLINGS['frieda'];

export function createNpcsByMap(): Record<string, GridEntity[]> {
  const base: Record<string, GridEntity[]> = {
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
          trainerTeam: [
            {
              speciesId: 'rattata',
              level: 4,
              moves: ['tackle', 'tailwhip', 'quickattack'],
            },
          ],
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
      makeNpc(
        'tuscany_of_tuesday',
        29,
        12,
        'DOWN',
        'girl',
        '🎀 TUSCANY OF TUESDAY',
        [
          "TUSCANY: Yahoo! I'm TUSCANY of Tuesday! Nice to meet you!",
          "Take this PINK BOW! It strengthens NORMAL-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
    ],
    cherrygrove_city: [
      makeNpc(
        'cg_guide_gent',
        32,
        6,
        'DOWN',
        'fat_man',
        '👴 GUIDE GENT',
        [
          "You're a rookie trainer, aren't you? I can tell!",
          "That's OK! Everyone is a rookie at some point!",
          'POKéGEAR becomes more useful as you add CARDS. Head NORTH up ROUTE 30 to visit MR. POKéMON!',
        ],
        { action: 'GUIDE_GENT_EVENT' }
      ),
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
            speciesId: 'hoothoot',
            level: 4,
            moves: ['tackle', 'growl', 'peck', 'hypnosis'],
          },
          trainerTeam: [
            {
              speciesId: 'hoothoot',
              level: 4,
              moves: ['tackle', 'growl', 'peck', 'hypnosis'],
            },
          ],
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
          trainerTeam: [
            {
              speciesId: 'caterpie',
              level: 3,
              moves: ['tackle', 'stringshot'],
            },
          ],
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
          trainerTeam: [
            {
              speciesId: 'caterpie',
              level: 2,
              moves: ['tackle', 'stringshot'],
            },
            {
              speciesId: 'caterpie',
              level: 2,
              moves: ['tackle', 'stringshot'],
            },
            {
              speciesId: 'weedle',
              level: 3,
              moves: ['poisonsting', 'stringshot'],
            },
            {
              speciesId: 'caterpie',
              level: 2,
              moves: ['tackle', 'stringshot'],
            },
          ],
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
        'oak',
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
      makeNpc(
        'lab_police_officer',
        4,
        4,
        'DOWN',
        'fat_man',
        '👮 POLICE OFFICER',
        [
          'OFFICER: I heard a POKéMON was stolen here…',
          'Apparently, it was a young male with long, red hair…',
          'What? You battled a trainer like that? Did you happen to get his name?',
        ],
        { action: 'POLICE_RIVAL_NAMING' }
      ),
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
          trainerTeam: [
            {
              speciesId: 'bellsprout',
              level: 6,
              moves: ['vinewhip', 'growth'],
            },
          ],
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
          trainerTeam: [
            {
              speciesId: 'bellsprout',
              level: 6,
              moves: ['vinewhip', 'growth'],
            },
          ],
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
          'ELDER LI: You care deeply for your POKéMON. With HM05 FLASH, even the darkest caves will shine bright.',
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
    route_32: [
      makeNpc(
        'youngster_albert',
        12,
        22,
        'DOWN',
        'boy',
        '👦 YOUNGSTER ALBERT',
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
      makeNpc(
        'picnicker_liz',
        10,
        30,
        'LEFT',
        'girl',
        '👧 PICNICKER LIZ',
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
      makeNpc(
        'camper_roland',
        3,
        45,
        'RIGHT',
        'boy',
        '⛺ CAMPER ROLAND',
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
      makeNpc(
        'fisher_justin',
        8,
        49,
        'LEFT',
        'fisherman',
        '🎣 FISHER JUSTIN',
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
      makeNpc(
        'fisher_ralph',
        12,
        56,
        'LEFT',
        'fisherman',
        '🎣 FISHER RALPH',
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
      makeNpc(
        'frieda',
        12,
        67,
        'DOWN',
        'girl',
        '🎀 FRIEDA OF FRIDAY',
        [
          "FRIEDA: Yahoo! It's Friday! I'm FRIEDA of Friday! Nice to meet you!",
          "Here's a POISON BARB to power up POISON-type moves!",
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
      makeNpc(
        'salesman',
        11,
        82,
        'DOWN',
        'fat_man',
        '🕴️ SUSPICIOUS MAN',
        [
          'How would you like some tasty, nutritious SLOWPOKETAIL?',
          "It's only ¥9,800,000! What, you don't want it? Then step aside, kid!",
        ]
      ),
    ],
    route_32_poke_center: [
      makeNpc(
        'r32_nurse_joy',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE JOY',
        [
          'Welcome to the ROUTE 32 POKéMON CENTER!',
          'We heal your POKéMON to full health in no time.',
          'Your team is fully restored. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc(
        'r32_cooltrainer',
        1,
        6,
        'RIGHT',
        'boy',
        '🧢 COOLTRAINER',
        ['UNION CAVE ahead is labyrinthine! Make sure your team is rested and you have POTIONS ready!']
      ),
      makeNpc(
        'r32_gentleman',
        6,
        4,
        'LEFT',
        'fat_man',
        '🎩 GENTLEMAN',
        ['A fisherman gave me an OLD ROD here. It works on MAGIKARP, but you can find rarer fish deeper in caves!']
      ),
    ],
    route_32_ruins_of_alph_gate: [
      makeNpc(
        'alph_gate_officer',
        5,
        2,
        'DOWN',
        'fat_man',
        '👮 OFFICER',
        ['RUINS OF ALPH are to the west. Strange radio signals and patterns have been reported inside!']
      ),
      makeNpc(
        'alph_gate_youngster',
        1,
        4,
        'RIGHT',
        'boy',
        '👦 TOURIST',
        ['Have you heard the weird sounds on the POKéGEAR radio near the ruins? It gives me goosebumps!']
      ),
    ],
    ruins_of_alph_outside: [
      makeNpc(
        'alph_scientist',
        11,
        15,
        'DOWN',
        'sage',
        '🔬 ARCHEOLOGIST',
        ['The stone chambers contain sliding tile puzzles that awakened ancient hieroglyphic beings known as UNOWN!']
      ),
      makeNpc(
        'alph_youngster',
        7,
        20,
        'UP',
        'boy',
        '👦 BOY',
        ['I heard there are secret chambers behind hidden walls that open only if you use FLASH or ESCAPE ROPE!'],
        { wanders: true }
      ),
    ],
    ruins_of_alph_research_center: [
      makeNpc(
        'research_scientist1',
        3,
        2,
        'DOWN',
        'sage',
        '🔬 HEAD RESEARCHER',
        ['The ruins are quiet today... We are researching ancient glyphs, but our equipment detects no active signals from the chambers.'],
        { action: 'UNOWN_DEX_EVENT' }
      ),
      makeNpc(
        'research_scientist2',
        5,
        4,
        'LEFT',
        'sage',
        '🔬 RESEARCH ASSISTANT',
        ['The past and future intertwine in these ancient stones. They date back over 1,500 years!']
      ),
    ],
    ruins_of_alph_kabuto_chamber: [
      makeNpc(
        'kabuto_chamber_guide',
        5,
        5,
        'DOWN',
        'sage',
        '🏛️ CHAMBER GUIDE',
        [
          'Welcome to this chamber. There are sliding stone panels that depict a POKéMON drawn by the ancients. Slide the panels around to form the picture.',
        ]
      ),
    ],
    union_cave_1f: [
      makeNpc(
        'hiker_daniel',
        3,
        6,
        'RIGHT',
        'fat_man',
        '🥾 HIKER DANIEL',
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
      makeNpc(
        'pokemaniac_larry',
        4,
        21,
        'RIGHT',
        'boy',
        '🎒 POKÉMANIAC LARRY',
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
      makeNpc(
        'firebreather_ray',
        15,
        27,
        'LEFT',
        'fat_man',
        '🔥 FIREBREATHER RAY',
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
      makeNpc(
        'hiker_phillip',
        4,
        14,
        'RIGHT',
        'fat_man',
        '🥾 HIKER PHILLIP',
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
      makeNpc(
        'pokemaniac_andrew',
        15,
        23,
        'LEFT',
        'boy',
        '🎒 POKÉMANIAC ANDREW',
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
      makeNpc(
        'ace_trainer_nick',
        13,
        8,
        'DOWN',
        'boy',
        '⭐ ACE TRAINER NICK',
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
      makeNpc(
        'ace_trainer_gwen',
        5,
        21,
        'RIGHT',
        'girl',
        '⭐ ACE TRAINER GWEN',
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
      makeNpc(
        'lapras_fan',
        6,
        26,
        'UP',
        'girl',
        '🌊 LAPRAS ENTHUSIAST',
        [
          'Every Friday, a beautiful wild LAPRAS swims up in this underground lake!',
          'If you use SURF, you can meet it yourself!',
        ]
      ),
      makeNpc(
        'union_cave_lapras',
        11,
        31,
        'DOWN',
        'lapras',
        '🌊 LAPRAS',
        ['Gyaoo!'],
        {
          action: 'LAPRAS_EVENT',
        }
      ),
    ],
    route_33: [
      makeNpc(
        'hiker_anthony',
        13,
        11,
        'LEFT',
        'fat_man',
        '🥾 HIKER ANTHONY',
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
    azalea_town: [
      makeNpc(
        'azalea_kurt',
        9,
        6,
        'DOWN',
        'elder',
        '👴 KURT',
        [
          'KURT: Those dastardly TEAM ROCKET villains are chopping off SLOWPOKE tails in the well!',
          "I'm going in there to drive them off myself! Stay back, kid!",
        ]
      ),
      makeNpc(
        'azalea_well_grunt',
        31,
        9,
        'DOWN',
        'silver',
        '⚡ ROCKET GRUNT',
        [
          "ROCKET GRUNT: Beat it, kid! SLOWPOKE WELL is off-limits today! We're busy collecting... er, doing maintenance!",
        ]
      ),
      makeNpc(
        'azalea_gym_grunt',
        10,
        16,
        'DOWN',
        'silver',
        '⚡ ROCKET GRUNT',
        [
          "ROCKET GRUNT: No one gets in the GYM! Buzz off, brat!",
        ]
      ),
      makeNpc(
        'azalea_slowpoke',
        21,
        10,
        'DOWN',
        'fat_man',
        '🦛 SLOWPOKE',
        [
          'SLOWPOKE: ... ... ...',
          'Yaaawn? It seems peaceful and blissfully unbothered.',
        ]
      ),
      makeNpc(
        'azalea_slowpoke_2',
        15,
        13,
        'RIGHT',
        'fat_man',
        '🦛 SLOWPOKE',
        [
          'SLOWPOKE: ... ... ...',
          'Yaaawn? It seems to be enjoying the pleasant breeze in Azalea Town.',
        ]
      ),
      makeNpc(
        'azalea_apprentice',
        17,
        10,
        'UP',
        'boy',
        '👦 APPRENTICE',
        ['The master charcoal-maker uses wood from ILEX FOREST to fire the kiln.'],
        { wanders: true }
      ),
      makeNpc(
        'azalea_gramps',
        8,
        11,
        'DOWN',
        'elder',
        '👴 AZALEA ELDER',
        ["KURT creates handmade custom POKé BALLS from APRICORNS gathered from trees. No factory can match his touch!"]
      ),
    ],
    azalea_poke_center: [
      makeNpc(
        'azalea_nurse_joy',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE JOY',
        [
          'Welcome to the AZALEA TOWN POKéMON CENTER!',
          'We heal your POKéMON to full health.',
          'Your team is fully restored. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc(
        'azalea_pc_lass',
        8,
        4,
        'LEFT',
        'girl',
        '👧 LASS',
        ['KURT will make special POKé BALLS like FAST BALL, LURE BALL, or FRIEND BALL if you bring him APRICORNS!']
      ),
    ],
    azalea_mart: [
      makeNpc(
        'azalea_mart_clerk',
        1,
        3,
        'RIGHT',
        'fat_man',
        '🏪 MART CLERK',
        ['Welcome to AZALEA MART! Stock up on POTIONS and POKé BALLS before venturing into ILEX FOREST!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
      makeNpc(
        'azalea_mart_bug_catcher',
        6,
        6,
        'UP',
        'bug_catcher',
        '🐞 BUG CATCHER',
        ["CHARCOAL boosts FIRE-type moves! It's great against BUGSY's bug POKéMON in the GYM!"]
      ),
    ],
    azalea_gym: [
      makeNpc(
        'bugsy',
        5,
        7,
        'DOWN',
        'bug_catcher',
        '🐞 LEADER BUGSY',
        [
          'BUGSY: Bug POKéMON are deep and complex. There are so many mysteries to unravel!',
        ],
        {
          action: 'BUGSY_EVENT',
          trainerId: 'bugsy',
          trainerName: 'Leader Bugsy',
          challengePages: [
            "BUGSY: I'm BUGSY! I never lose when it comes to bug POKéMON. My research is going to make me the authority on bug POKéMON! Let me demonstrate what I've learned from my studies!",
          ],
          trainerPokemon: { speciesId: 'scyther', level: 16, moves: ['furycutter', 'quickattack', 'leer'] },
          trainerTeam: [
            { speciesId: 'metapod', level: 14, moves: ['tackle', 'stringshot'] },
            { speciesId: 'kakuna', level: 14, moves: ['poisonsting', 'harden'] },
            { speciesId: 'scyther', level: 16, moves: ['furycutter', 'quickattack', 'leer'] },
          ],
        }
      ),
      makeNpc(
        'bug_catcher_benny',
        5,
        3,
        'DOWN',
        'bug_catcher',
        '🐞 BUG CATCHER BENNY',
        ["Just evolving isn't enough!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_benny',
          trainerName: 'Bug Catcher Benny',
          visionRange: 3,
          challengePages: ['BUG CATCHER BENNY: Bug POKéMON evolve young. So they get stronger that much faster.'],
          trainerPokemon: { speciesId: 'weedle', level: 12, moves: ['poisonsting', 'stringshot'] },
          trainerTeam: [
            { speciesId: 'weedle', level: 12, moves: ['poisonsting', 'stringshot'] },
            { speciesId: 'kakuna', level: 12, moves: ['poisonsting', 'harden'] },
            { speciesId: 'beedrill', level: 12, moves: ['furyattack', 'poisonsting'] },
          ],
        }
      ),
      makeNpc(
        'bug_catcher_al',
        8,
        8,
        'LEFT',
        'bug_catcher',
        '🐞 BUG CATCHER AL',
        ['You proved how tough you are…'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_al',
          trainerName: 'Bug Catcher Al',
          visionRange: 3,
          challengePages: ["BUG CATCHER AL: Bug POKéMON are cool and tough! I'll prove it to you!"],
          trainerPokemon: { speciesId: 'caterpie', level: 12, moves: ['tackle', 'stringshot'] },
          trainerTeam: [
            { speciesId: 'caterpie', level: 12, moves: ['tackle', 'stringshot'] },
            { speciesId: 'metapod', level: 12, moves: ['harden', 'tackle'] },
          ],
        }
      ),
      makeNpc(
        'bug_catcher_josh',
        0,
        2,
        'RIGHT',
        'bug_catcher',
        '🐞 BUG CATCHER JOSH',
        ['Urrgggh!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_josh',
          trainerName: 'Bug Catcher Josh',
          visionRange: 3,
          challengePages: ["BUG CATCHER JOSH: You saved all the SLOWPOKE? Whew, you're mighty! But my grown-up POKéMON are pretty tough too!"],
          trainerPokemon: { speciesId: 'paras', level: 13, moves: ['scratch', 'stunspore', 'poisonpowder'] },
          trainerTeam: [
            { speciesId: 'paras', level: 13, moves: ['scratch', 'stunspore', 'poisonpowder'] },
          ],
        }
      ),
      makeNpc(
        'twins_amy',
        4,
        10,
        'DOWN',
        'girl',
        '👭 TWIN AMY',
        ['AMY: Oh, double goodness!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'twins_amy',
          trainerName: 'Twin Amy',
          visionRange: 2,
          challengePages: ["TWIN AMY: Hi! You want to see the LEADER? We come first!"],
          trainerPokemon: { speciesId: 'spinarak', level: 10, moves: ['poisonsting', 'stringshot', 'scaryface'] },
          trainerTeam: [
            { speciesId: 'spinarak', level: 10, moves: ['poisonsting', 'stringshot', 'scaryface'] },
          ],
        }
      ),
      makeNpc(
        'twins_may',
        5,
        10,
        'DOWN',
        'girl',
        '👭 TWIN MAY',
        ['MAY: Our bug POKéMON lost! Oh, what a shame.'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'twins_may',
          trainerName: 'Twin May',
          visionRange: 2,
          challengePages: ["TWIN MAY: Hi! You want to see the LEADER? We come first!"],
          trainerPokemon: { speciesId: 'ledyba', level: 10, moves: ['tackle', 'supersonic', 'cometpunch'] },
          trainerTeam: [
            { speciesId: 'ledyba', level: 10, moves: ['tackle', 'supersonic', 'cometpunch'] },
          ],
        }
      ),
      makeNpc(
        'azalea_gym_guide',
        7,
        13,
        'UP',
        'fat_man',
        '🥊 GYM GUIDE',
        [
          "Yo, challenger! BUGSY's young, but his knowledge of bug POKéMON is for real. Let's see… Bug POKéMON don't like fire. Flying-type moves are super-effective too.",
        ]
      ),
    ],
    kurts_house: [
      makeNpc(
        'kurt_house_kurt',
        3,
        2,
        'DOWN',
        'elder',
        '👴 KURT',
        [
          'KURT: You drove off TEAM ROCKET from SLOWPOKE WELL? You\'re a wonderful trainer!',
          "Bring me any APRICORNS you find on trees, and I'll gladly craft custom POKé BALLS for you free of charge!",
        ]
      ),
      makeNpc(
        'kurt_granddaughter',
        5,
        3,
        'LEFT',
        'girl',
        '👧 GRANDDAUGHTER',
        ['Grandpa makes the most reliable POKé BALLS in the whole world! Everyone in Johto knows his name!']
      ),
    ],
    charcoal_kiln: [
      makeNpc(
        'kiln_boss',
        2,
        3,
        'DOWN',
        'elder',
        '🧔 KILN BOSS',
        ['The kiln burns day and night to cure authentic AZALEA CHARCOAL. It boosts the power of FIRE-type moves!']
      ),
      makeNpc(
        'kiln_apprentice',
        5,
        3,
        'LEFT',
        'boy',
        '👦 APPRENTICE',
        ["Our FARFETCH'D ran off into ILEX FOREST! We need it back so we can continue collecting firewood!"]
      ),
    ],
    slowpoke_well_b1f: [
      makeNpc(
        'rocket_grunt_1',
        15,
        7,
        'DOWN',
        'silver',
        '⚡ ROCKET GRUNT',
        ["Sure, we've been hacking the tails off SLOWPOKE and selling them. Everything we do is for profit. That's right! We're TEAM ROCKET, and we'll do anything for money!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'rocket_grunt_1',
          trainerName: 'Rocket Grunt',
          visionRange: 3,
          challengePages: ["ROCKET GRUNT: Darn! I was standing guard up top when some old coot yelled at me. He startled me so much that I fell down here. I think I'll vent my anger by taking it out on you!"],
          trainerPokemon: { speciesId: 'rattata', level: 9, moves: ['tackle', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'rattata', level: 9, moves: ['tackle', 'quickattack'] },
            { speciesId: 'rattata', level: 9, moves: ['tackle', 'quickattack'] },
          ],
        }
      ),
      makeNpc(
        'rocket_grunt_2',
        5,
        6,
        'RIGHT',
        'silver',
        '⚡ ROCKET GRUNT',
        ["We need the money, but selling SLOWPOKETAILS? It's tough being a ROCKET GRUNT!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'rocket_grunt_2',
          trainerName: 'Rocket Grunt',
          visionRange: 3,
          challengePages: ['ROCKET GRUNT: Quit taking SLOWPOKETAILS? If we obeyed you, TEAM ROCKET\'s rep would be ruined!'],
          trainerPokemon: { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
          trainerTeam: [
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
            { speciesId: 'ekans', level: 11, moves: ['wrap', 'leer', 'poisonsting'] },
          ],
        }
      ),
      makeNpc(
        'rocket_grunt_3',
        10,
        4,
        'LEFT',
        'girl',
        '⚡ ROCKET GRUNT',
        ["SLOWPOKETAILS grow back fast! What's wrong with selling them?"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'rocket_grunt_3',
          trainerName: 'Rocket Grunt',
          visionRange: 3,
          challengePages: ["ROCKET GRUNT: Stop taking TAILS? Yeah, just try to defeat all of us!"],
          trainerPokemon: { speciesId: 'rattata', level: 7, moves: ['tackle', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'rattata', level: 7, moves: ['tackle', 'quickattack'] },
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
          ],
        }
      ),
      makeNpc(
        'executive_proton',
        5,
        2,
        'DOWN',
        'silver',
        '⚡ EXECUTIVE PROTON',
        ["PROTON: What do you want? If you interrupt our work, don't expect any mercy! We're TEAM ROCKET, and we'll do anything for money!"],
        {
          action: 'PROTON_EVENT',
          trainerId: 'executive_proton',
          trainerName: 'Executive Proton',
          visionRange: 3,
          challengePages: [
            "PROTON: What do you want? If you interrupt our work, don't expect any mercy! We're TEAM ROCKET, and we'll do anything for money!",
          ],
          trainerPokemon: { speciesId: 'koffing', level: 14, moves: ['tackle', 'smog', 'poisongas'] },
          trainerTeam: [
            { speciesId: 'zubat', level: 9, moves: ['leechlife', 'bite'] },
            { speciesId: 'koffing', level: 14, moves: ['tackle', 'smog', 'poisongas'] },
          ],
        }
      ),
      makeNpc(
        'well_kurt',
        16,
        14,
        'UP',
        'elder',
        '👴 KURT',
        [
          "KURT: Hey there, rookie! The guard up top took off when I shouted at him. But then I took a tumble down the WELL. I slammed down hard on my back, so I can't move. Rats! Show them how gutsy you are in my place!",
        ]
      ),
      makeNpc(
        'well_slowpoke',
        6,
        2,
        'DOWN',
        'fat_man',
        '🦛 RESCUED SLOWPOKE',
        [
          'SLOWPOKE: ... ... ...',
          'A SLOWPOKE with its TAIL cut off…',
        ]
      ),
      makeNpc(
        'well_slowpoke_2',
        7,
        4,
        'DOWN',
        'fat_man',
        '🦛 RESCUED SLOWPOKE',
        [
          'SLOWPOKE: ... ... ...',
          'A SLOWPOKE with its TAIL cut off… Huh? It has MAIL.',
          "<PLAYER> read the MAIL: 'Be good and look after the house with Grandpa and SLOWPOKE. Love, Dad'",
        ]
      ),
    ],
    slowpoke_well_b2f: [
      makeNpc(
        'well_guide',
        16,
        5,
        'DOWN',
        'fat_man',
        '🔦 CAVERN EXPLORER',
        [
          "CAVERN EXPLORER: I'm waiting to see SLOWPOKE's moment of evolution. Through observation, I made a new discovery.",
          "A SLOWPOKE with a KING'S ROCK often gets bitten by a SHELLDER. Here, I'll share a KING'S ROCK with you!",
        ],
        { action: 'KINGS_ROCK_EVENT' }
      ),
    ],
    ilex_forest: [
      makeNpc(
        'forest_apprentice',
        14,
        30,
        'UP',
        'boy',
        '👦 APPRENTICE',
        [
          "The boss's FARFETCH'D escaped deeper into the forest! Can you help me find it?",
          'If you sneak up behind it, you might be able to steer it back toward the charcoal kiln!',
        ]
      ),
      makeNpc(
        'forest_farfetchd',
        15,
        23,
        'DOWN',
        'bird_keeper',
        '🦆 FARFETCH’D',
        [
          "FARFETCH'D: Quaaack! It clutches its fresh green onion stalk proudly!",
        ],
        { action: 'FARFETCHD_HERD_EVENT' }
      ),
      makeNpc(
        'cut_master',
        8,
        23,
        'DOWN',
        'elder',
        '🧔 CHARCOAL MASTER',
        [
          "Thank you for finding our FARFETCH'D! Without it, we couldn't collect wood for the kiln!",
          'As a reward, take HM01 CUT! With the HIVEBADGE, you can cut down small thorny trees blocking paths!',
        ],
        { action: 'CHARCOAL_MASTER_EVENT' }
      ),
      makeNpc(
        'headbutt_tutor',
        15,
        14,
        'RIGHT',
        'boy',
        '🥊 HEADBUTT GUY',
        [
          "What am I doing? I'm shaking trees using HEADBUTT! It's so much fun!",
          "Rattle trees with HEADBUTT! Sometimes sleeping POKéMON fall right out on you!",
        ],
        { action: 'HEADBUTT_TUTOR_EVENT' }
      ),
      makeNpc(
        'bug_catcher_wayne',
        12,
        1,
        'DOWN',
        'bug_catcher',
        '🐛 BUG CATCHER WAYNE',
        [
          "BUG CATCHER WAYNE: I found all kinds of neat bug POKéMON in these woods! Don't step on them!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_wayne',
          trainerName: 'Bug Catcher Wayne',
          visionRange: 2,
          challengePages: ["BUG CATCHER WAYNE: Don't sneak up on me in the dark forest!"],
          trainerPokemon: { speciesId: 'paras', level: 10, moves: ['scratch', 'stunspore'] },
          trainerTeam: [
            { speciesId: 'paras', level: 10, moves: ['scratch', 'stunspore'] },
            { speciesId: 'spinarak', level: 12, moves: ['poisonsting', 'stringshot', 'scaryface'] },
          ],
        }
      ),
      makeNpc(
        'forest_lass',
        3,
        24,
        'RIGHT',
        'girl',
        '👧 LASS',
        [
          'Did something happen to the shrine deeper in the forest?',
          'My grandma said a mythical POKéMON watches over all the trees in ILEX FOREST.',
        ]
      ),
    ],
    route_34_ilex_forest_gate: [
      makeNpc(
        'gate_teacher',
        3,
        3,
        'RIGHT',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          'Leaving the deep woods? Here, take TM12 SWEET SCENT! It lures wild POKéMON right to you!',
          'Use it in tall grass to instantly trigger wild encounters without walking!',
        ]
      ),
    ],
    route_34: [
      makeNpc(
        'camper_todd',
        13,
        7,
        'LEFT',
        'boy',
        '⛺ CAMPER TODD',
        ["I'm confident in my ability to raise POKéMON. Want to see?"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'camper_todd',
          trainerName: 'Camper Todd',
          visionRange: 5,
          challengePages: ["CAMPER TODD: I'm confident in my ability to raise POKéMON. Want to see?"],
          trainerPokemon: { speciesId: 'psyduck', level: 14, moves: ['scratch', 'tailwhip', 'watergun', 'confusion'] },
          trainerTeam: [
            { speciesId: 'psyduck', level: 14, moves: ['scratch', 'tailwhip', 'watergun', 'confusion'] },
          ],
        }
      ),
      makeNpc(
        'youngster_samuel',
        15,
        32,
        'DOWN',
        'boy',
        '🧢 YOUNGSTER SAMUEL',
        ['This is where I do my training!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_samuel',
          trainerName: 'Youngster Samuel',
          visionRange: 3,
          challengePages: ['YOUNGSTER SAMUEL: This is where I do my training!'],
          trainerPokemon: { speciesId: 'rattata', level: 7, moves: ['tackle', 'tailwhip', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'rattata', level: 7, moves: ['tackle', 'tailwhip', 'quickattack'] },
            { speciesId: 'sandshrew', level: 10, moves: ['scratch', 'defensecurl', 'sandattack'] },
            { speciesId: 'spearow', level: 8, moves: ['peck', 'growl', 'leer'] },
            { speciesId: 'spearow', level: 8, moves: ['peck', 'growl', 'leer'] },
          ],
        }
      ),
      makeNpc(
        'youngster_ian',
        11,
        20,
        'DOWN',
        'boy',
        '🧢 YOUNGSTER IAN',
        ["I'm the best in my class at POKéMON."],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_ian',
          trainerName: 'Youngster Ian',
          visionRange: 3,
          challengePages: ["YOUNGSTER IAN: I'm the best in my class at POKéMON."],
          trainerPokemon: { speciesId: 'mankey', level: 10, moves: ['scratch', 'leer', 'lowkick', 'karatechop'] },
          trainerTeam: [
            { speciesId: 'mankey', level: 10, moves: ['scratch', 'leer', 'lowkick', 'karatechop'] },
            { speciesId: 'diglett', level: 12, moves: ['scratch', 'growl', 'sandattack'] },
          ],
        }
      ),
      makeNpc(
        'picnicker_gina',
        10,
        26,
        'RIGHT',
        'girl',
        '👧 PICNICKER GINA',
        ["Are you a trainer? Let's have a practice battle."],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'picnicker_gina',
          trainerName: 'Picnicker Gina',
          visionRange: 3,
          challengePages: ["PICNICKER GINA: Are you a trainer? Let's have a practice battle."],
          trainerPokemon: { speciesId: 'hoppip', level: 9, moves: ['splash', 'tailwhip', 'tackle'] },
          trainerTeam: [
            { speciesId: 'hoppip', level: 9, moves: ['splash', 'tailwhip', 'tackle'] },
            { speciesId: 'hoppip', level: 9, moves: ['splash', 'tailwhip', 'tackle'] },
            { speciesId: 'bulbasaur', level: 12, moves: ['tackle', 'growl', 'leechseed', 'vinewhip'] },
          ],
        }
      ),
      makeNpc(
        'officer_keith',
        9,
        11,
        'DOWN',
        'fat_man',
        '👮 OFFICER KEITH',
        ["I'm on patrol for suspicious individuals.", "It's safe now, but trouble stirs after dark."],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'officer_keith',
          trainerName: 'Officer Keith',
          visionRange: 3,
          challengePages: ['OFFICER KEITH: Who goes there? What are you up to?'],
          trainerPokemon: { speciesId: 'growlithe', level: 17, moves: ['bite', 'roar', 'ember', 'leer'] },
          trainerTeam: [
            { speciesId: 'growlithe', level: 17, moves: ['bite', 'roar', 'ember', 'leer'] },
          ],
        }
      ),
      makeNpc(
        'pokefan_brandon',
        18,
        28,
        'LEFT',
        'fat_man',
        '🎀 POKéFAN BRANDON',
        ["I just got my POKéMON back from DAY-CARE. Let's see how much stronger it got!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokefan_brandon',
          trainerName: 'Pokefan Brandon',
          visionRange: 3,
          challengePages: ["POKéFAN BRANDON: I just got my POKéMON back from DAY-CARE. Let's see how much stronger it got!"],
          trainerPokemon: { speciesId: 'snubbull', level: 13, moves: ['tackle', 'scaryface', 'bite', 'charm'], heldItem: 'berry' },
          trainerTeam: [
            { speciesId: 'snubbull', level: 13, moves: ['tackle', 'scaryface', 'bite', 'charm'], heldItem: 'berry' },
          ],
        }
      ),
      makeNpc(
        'cooltrainer_irene',
        11,
        48,
        'LEFT',
        'girl',
        '🏊 COOLTRAINER IRENE',
        ['Kyaaah! Someone entered our swimming lagoon!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'cooltrainer_irene',
          trainerName: 'Cooltrainer Irene',
          visionRange: 5,
          challengePages: ['COOLTRAINER IRENE: Kyaaah! Someone entered our swimming lagoon!'],
          trainerPokemon: { speciesId: 'goldeen', level: 22, moves: ['peck', 'tailwhip', 'supersonic', 'hornattack'] },
          trainerTeam: [
            { speciesId: 'goldeen', level: 22, moves: ['peck', 'tailwhip', 'supersonic', 'hornattack'] },
            { speciesId: 'seaking', level: 24, moves: ['peck', 'tailwhip', 'waterfall', 'hornattack'] },
          ],
        }
      ),
      makeNpc(
        'cooltrainer_jenn',
        3,
        48,
        'RIGHT',
        'girl',
        '🏊 COOLTRAINER JENN',
        ["You can't defeat the three of us!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'cooltrainer_jenn',
          trainerName: 'Cooltrainer Jenn',
          visionRange: 3,
          challengePages: ["COOLTRAINER JENN: You can't defeat the three of us!"],
          trainerPokemon: { speciesId: 'staryu', level: 24, moves: ['tackle', 'harden', 'watergun', 'recover'] },
          trainerTeam: [
            { speciesId: 'staryu', level: 24, moves: ['tackle', 'harden', 'watergun', 'recover'] },
            { speciesId: 'starmie', level: 26, moves: ['watergun', 'recover', 'swift', 'confuseray'] },
          ],
        }
      ),
      makeNpc(
        'cooltrainer_kate',
        6,
        51,
        'UP',
        'girl',
        '🏊 COOLTRAINER KATE',
        ["I'm the strongest sister! Let's see what you've got!"],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'cooltrainer_kate',
          trainerName: 'Cooltrainer Kate',
          visionRange: 2,
          challengePages: ["COOLTRAINER KATE: I'm the strongest sister! Let's see what you've got!"],
          trainerPokemon: { speciesId: 'shellder', level: 26, moves: ['tackle', 'withdraw', 'iciclespear', 'clamp'] },
          trainerTeam: [
            { speciesId: 'shellder', level: 26, moves: ['tackle', 'withdraw', 'iciclespear', 'clamp'] },
            { speciesId: 'cloyster', level: 28, moves: ['withdraw', 'aurorabeam', 'spikedepp', 'clamp'] },
          ],
        }
      ),
    ],
    day_care: [
      makeNpc(
        'day_care_man',
        2,
        3,
        'DOWN',
        'elder',
        '👴 DAY-CARE MAN',
        [
          "I'm the DAY-CARE MAN. We were shocked to find an EGG in the meadow!",
          "Wouldn't you like this EGG? Please take good care of it!",
        ]
      ),
      makeNpc(
        'day_care_lady',
        5,
        3,
        'DOWN',
        'mom',
        '👵 DAY-CARE LADY',
        [
          "I'm the DAY-CARE LADY. Should I raise a POKéMON for you?",
        ]
      ),
    ],
    goldenrod_city: [
      makeNpc(
        'goldenrod_pokefan',
        18,
        14,
        'DOWN',
        'fat_man',
        '🎩 GENTLEMAN',
        [
          'GOLDENROD CITY is the grandest metropolis in JOHTO!',
          'We have a 6-story DEPT. STORE, a bustling GAME CORNER, and the famous RADIO TOWER!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'goldenrod_lass',
        30,
        18,
        'LEFT',
        'girl',
        '👧 LASS',
        [
          'WHITNEY at the GYM is super cute, but her MILTANK’s ROLLOUT attack is terrifying!',
          'It builds up speed and power every single turn!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'goldenrod_cooltrainer',
        28,
        22,
        'UP',
        'boy',
        '🧢 COOLTRAINER',
        [
          'The MAGNET TRAIN station is just north of here! It connects JOHTO directly to KANTO at 340 miles per hour!',
        ]
      ),
      makeNpc(
        'goldenrod_fisher',
        12,
        9,
        'DOWN',
        'fisherman',
        '🎣 FISHER',
        [
          'You can take the UNDERGROUND tunnel to cross under town, browse the herb shop, and groom your POKéMON!',
        ]
      ),
    ],
    goldenrod_gym: [
      makeNpc(
        'whitney',
        10,
        3,
        'DOWN',
        'girl',
        '🎀 LEADER WHITNEY',
        [
          "WHITNEY: You're really amazing! The PLAINBADGE proves your strength!",
          'NORMAL-type POKéMON have so much versatility. Keep believing in your team!',
        ],
        {
          action: 'WHITNEY_EVENT',
          trainerId: 'whitney',
          trainerName: 'Leader Whitney',
          challengePages: [
            "WHITNEY: Hi! I'm WHITNEY! Everyone was into POKéMON, so I got into it too! POKéMON are super cute! You think you can beat mine? Don't cry if you lose!",
          ],
          trainerPokemon: { speciesId: 'miltank', level: 20, moves: ['rollout', 'attract', 'stomp', 'milkdrink'] },
          trainerTeam: [
            { speciesId: 'clefairy', level: 18, moves: ['doubleslap', 'mimic', 'encore', 'metronome'] },
            { speciesId: 'miltank', level: 20, moves: ['rollout', 'attract', 'stomp', 'milkdrink'] },
          ],
        }
      ),
      makeNpc(
        'lass_carrie',
        9,
        13,
        'DOWN',
        'girl',
        '👧 LASS CARRIE',
        ['Don’t underestimate our cute POKéMON!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'lass_carrie',
          trainerName: 'Lass Carrie',
          visionRange: 3,
          challengePages: ['LASS CARRIE: You want to see WHITNEY? You have to get through me first!'],
          trainerPokemon: { speciesId: 'snubbull', level: 18, moves: ['tackle', 'scaryface', 'bite'] },
          trainerTeam: [
            { speciesId: 'snubbull', level: 18, moves: ['tackle', 'scaryface', 'bite'] },
          ],
        }
      ),
      makeNpc(
        'lass_bridget',
        9,
        6,
        'LEFT',
        'girl',
        '👧 LASS BRIDGET',
        [
          'WHITNEY is so pretty, but she gets emotional after tough battles!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'lass_bridget',
          trainerName: 'Lass Bridget',
          visionRange: 3,
          challengePages: ['LASS BRIDGET: I like cute POKéMON! Do you like cute POKéMON too?'],
          trainerPokemon: { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
          trainerTeam: [
            { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
            { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
            { speciesId: 'jigglypuff', level: 15, moves: ['sing', 'pound', 'defensecurl'] },
          ],
        }
      ),
      makeNpc(
        'beauty_victoria',
        13,
        8,
        'LEFT',
        'girl',
        '💄 BEAUTY VICTORIA',
        ['SENTRET is so fluffy and quick!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'beauty_victoria',
          trainerName: 'Beauty Victoria',
          visionRange: 3,
          challengePages: ['BEAUTY VICTORIA: Oh, what a cute challenger! Let’s have a lovely battle!'],
          trainerPokemon: { speciesId: 'sentret', level: 17, moves: ['tackle', 'defensecurl', 'quickattack'] },
          trainerTeam: [
            { speciesId: 'sentret', level: 9, moves: ['tackle', 'defensecurl'] },
            { speciesId: 'sentret', level: 13, moves: ['tackle', 'defensecurl', 'quickattack'] },
            { speciesId: 'sentret', level: 17, moves: ['tackle', 'defensecurl', 'quickattack'] },
          ],
        }
      ),
      makeNpc(
        'beauty_samantha',
        5,
        9,
        'RIGHT',
        'girl',
        '💄 BEAUTY SAMANTHA',
        ['MEOWTH loves shiny coins and quick scratches!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'beauty_samantha',
          trainerName: 'Beauty Samantha',
          visionRange: 3,
          challengePages: ['BEAUTY SAMANTHA: Don’t blink or my MEOWTH will take your prize money!'],
          trainerPokemon: { speciesId: 'meowth', level: 16, moves: ['scratch', 'growl', 'bite', 'payday'] },
          trainerTeam: [
            { speciesId: 'meowth', level: 16, moves: ['scratch', 'growl', 'bite', 'payday'] },
            { speciesId: 'meowth', level: 16, moves: ['scratch', 'growl', 'bite', 'payday'] },
          ],
        }
      ),
      makeNpc(
        'goldenrod_gym_guide',
        3,
        15,
        'UP',
        'fat_man',
        '🥊 GYM GUIDE',
        [
          'Yo! CHAMP in the making!',
          'WHITNEY uses NORMAL-type POKéMON! FIGHTING-type moves are super effective against them!',
          'Beware of MILTANK’s MILK DRINK and ROLLOUT—if it rolls consecutively, it hits like a freight train!',
        ]
      ),
    ],
    goldenrod_poke_center: [
      makeNpc(
        'goldenrod_nurse_joy',
        3,
        1,
        'DOWN',
        'teacher',
        '👩‍⚕️ NURSE JOY',
        [
          'Welcome to the GOLDENROD POKéMON CENTER!',
          'We heal your POKéMON to full health in no time.',
          'Your team is fully restored. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc(
        'goldenrod_pc_clerk',
        1,
        6,
        'RIGHT',
        'fat_man',
        '👨‍💼 NETWORK CLERK',
        ['This POKéMON CENTER connects trainers across the globe through high-speed mobile communications!']
      ),
      makeNpc(
        'goldenrod_pc_lass',
        6,
        4,
        'LEFT',
        'girl',
        '👧 LASS',
        ['A boy on the 5th floor of the DEPT. STORE traded me a MACHOP named MUSCLE!']
      ),
    ],
    goldenrod_bike_shop: [
      makeNpc(
        'bike_shop_owner',
        2,
        3,
        'DOWN',
        'fat_man',
        '🚲 BIKE SHOP OWNER',
        [
          'Welcome to MIRACLE CYCLE! I moved here from CERULEAN CITY, but nobody knows my bikes yet!',
          'Would you take one of our BICYCLES and ride it everywhere to advertise for me? It’ll double your travel speed!',
        ]
      ),
    ],
    goldenrod_flower_shop: [
      makeNpc(
        'florist',
        2,
        3,
        'DOWN',
        'girl',
        '🌸 FLORIST',
        [
          'Have you seen that weird, wiggling tree on ROUTE 36? Whenever anyone splashes water on it, it gets furious!',
          'Take this SQUIRTBOTTLE! Use it on that tree and see what happens!',
        ]
      ),
    ],
    goldenrod_game_corner: [
      makeNpc(
        'coin_guy',
        14,
        6,
        'LEFT',
        'fat_man',
        '🎰 PRIZE CLERK',
        ['You can trade GAME CORNER coins for valuable TMs like BLIZZARD, FIRE BLAST, and THUNDER, or rare POKéMON!']
      ),
      makeNpc(
        'slot_player',
        5,
        8,
        'UP',
        'boy',
        '👦 SLOT PLAYER',
        ['7-7-7! Come on! Just one more match! The slot machines here are so addictive!']
      ),
    ],
    goldenrod_name_rater: [
      makeNpc(
        'name_rater',
        2,
        3,
        'DOWN',
        'elder',
        '👴 NAME RATER',
        [
          'Hello, hello! I am the official NAME RATER! I evaluate the nicknames of POKéMON!',
          'A fine nickname deepens the friendship between you and your companion!',
        ]
      ),
    ],
    goldenrod_bill_house: [
      makeNpc(
        'bills_mother',
        2,
        3,
        'DOWN',
        'mom',
        "👩 BILL'S MOM",
        [
          'My son BILL created the POKéMON STORAGE SYSTEM! He’s in ECRUTEAK CITY right now helping friends with the TIME CAPSULE.',
        ]
      ),
      makeNpc(
        'bills_sister',
        5,
        4,
        'LEFT',
        'girl',
        "👧 BILL'S SISTER",
        ['My big brother loves EEVEE! If you visit our family in Ecruteak, he might have a gift for you!']
      ),
      makeNpc(
        'bill',
        2,
        4,
        'RIGHT',
        'boy',
        '💻 BILL',
        [
          'BILL: Hi, Gold! Thanks for helping out with the PC Storage System!',
          'I have this rare EEVEE that was sent to me. Would you take good care of it?',
        ]
      ),
    ],
    goldenrod_magnet_train_station: [
      makeNpc(
        'station_officer',
        9,
        9,
        'DOWN',
        'fat_man',
        '👮 STATION OFFICER',
        [
          'The MAGNET TRAIN reaches speeds over 340 mph between GOLDENROD and SAFFRON CITY!',
          'Only authorized travelers with a RAIL PASS may board the train.',
        ]
      ),
      makeNpc(
        'train_passenger',
        5,
        14,
        'RIGHT',
        'boy',
        '👦 PASSENGER',
        ['I can’t wait to ride the bullet train all the way to KANTO!']
      ),
    ],
    goldenrod_underground: [
      makeNpc(
        'super_nerd_eric',
        8,
        12,
        'DOWN',
        'boy',
        '🤓 SUPER NERD ERIC',
        ['My electric and poison POKéMON thrive in the subterranean tunnels!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'super_nerd_eric',
          trainerName: 'Super Nerd Eric',
          visionRange: 3,
          challengePages: ['SUPER NERD ERIC: The underground is my secret laboratory! Prepare for a shock!'],
          trainerPokemon: { speciesId: 'grimer', level: 12, moves: ['pound', 'poisongas', 'harden'] },
          trainerTeam: [
            { speciesId: 'grimer', level: 12, moves: ['pound', 'poisongas', 'harden'] },
            { speciesId: 'magnemite', level: 12, moves: ['tackle', 'thundershock', 'supersonic'] },
          ],
        }
      ),
      makeNpc(
        'pokemaniac_donald',
        8,
        24,
        'UP',
        'boy',
        '🎒 POKÉMANIAC DONALD',
        ['SLOWPOKE may be slow, but its psychic power is immense!'],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'pokemaniac_donald',
          trainerName: 'Pokemaniac Donald',
          visionRange: 3,
          challengePages: ['POKÉMANIAC DONALD: Underground trainers have the best costume parties! Battle me!'],
          trainerPokemon: { speciesId: 'slowpoke', level: 13, moves: ['confusion', 'tackle', 'growl'] },
          trainerTeam: [
            { speciesId: 'slowpoke', level: 13, moves: ['confusion', 'tackle', 'growl'] },
          ],
        }
      ),
    ],
    goldenrod_dept_store_1f: [
      makeNpc(
        'dept_elevator_1f',
        2,
        0,
        'DOWN',
        'clerk',
        '🛗 ELEVATOR ATTENDANT',
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc(
        'dept_rec',
        7,
        2,
        'DOWN',
        'teacher',
        '👩‍💼 RECEPTIONIST',
        [
          'Welcome to GOLDENROD DEPT. STORE!',
          '1F Service Counter, 2F Trainer’s Market, 3F Battle Collection, 4F Medicine Box, 5F TM Corner, 6F Rooftop Square!',
        ],
        { talkAcrossCounter: true }
      ),
    ],
    goldenrod_dept_store_2f: [
      makeNpc(
        'dept_elevator_2f',
        2,
        0,
        'DOWN',
        'clerk',
        '🛗 ELEVATOR ATTENDANT',
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc(
        'dept_clerk_2f',
        13,
        5,
        'DOWN',
        'fat_man',
        '🏪 2F CLERK',
        ['Welcome to the 2F TRAINER’S MARKET! Stock up on GREAT BALLS, SUPER POTIONS, and REVIVES!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    goldenrod_dept_store_3f: [
      makeNpc(
        'dept_elevator_3f',
        2,
        0,
        'DOWN',
        'clerk',
        '🛗 ELEVATOR ATTENDANT',
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc(
        'dept_clerk_3f',
        13,
        5,
        'DOWN',
        'fat_man',
        '🏪 3F CLERK',
        ['Welcome to the 3F BATTLE COLLECTION! X ATTACK, X DEFEND, and DIRE HIT give you the edge in GYM battles!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    goldenrod_dept_store_4f: [
      makeNpc(
        'dept_elevator_4f',
        2,
        0,
        'DOWN',
        'clerk',
        '🛗 ELEVATOR ATTENDANT',
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc(
        'dept_clerk_4f',
        13,
        5,
        'DOWN',
        'fat_man',
        '🏪 4F CLERK',
        ['Welcome to the 4F MEDICINE BOX! PROTEIN, IRON, CARBOS, and HP UP permanently boost your POKéMON stats!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    goldenrod_dept_store_5f: [
      makeNpc(
        'dept_elevator_5f',
        2,
        0,
        'DOWN',
        'clerk',
        '🛗 ELEVATOR ATTENDANT',
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc(
        'dept_clerk_5f',
        13,
        5,
        'DOWN',
        'fat_man',
        '🏪 5F CLERK',
        ['Welcome to the 5F TM CORNER! Teach your POKéMON game-changing moves like HEADBUTT, ROCK SMASH, and REFLECT!'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    goldenrod_dept_store_6f: [
      makeNpc(
        'dept_elevator_6f',
        2,
        0,
        'DOWN',
        'clerk',
        '🛗 ELEVATOR ATTENDANT',
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc(
        'dept_girl_6f',
        6,
        2,
        'DOWN',
        'girl',
        '👧 VENDING MACHINE FAN',
        [
          'The rooftop vending machines dispense FRESH WATER, SODA POP, and LEMONADE! They restore more HP than regular POTIONS!',
        ]
      ),
    ],
    goldenrod_dept_store_roof: [
      makeNpc(
        'dept_elevator_roof',
        2,
        1,
        'DOWN',
        'clerk',
        '🛗 ELEVATOR ATTENDANT',
        ['ELEVATOR ATTENDANT: Welcome to the GOLDENROD DEPT. STORE elevator! Which floor would you like to visit?'],
        { action: 'DEPT_ELEVATOR' }
      ),
      makeNpc(
        'rooftop_camper',
        7,
        4,
        'DOWN',
        'boy',
        '⛺ ROOFTOP CAMPER',
        [
          'You can see the entire skyline of GOLDENROD CITY and the RADIO TOWER from up here! It’s breathtaking!',
        ]
      ),
    ],
    radio_tower_1f: [
      makeNpc(
        'radio_rec',
        5,
        6,
        'DOWN',
        'teacher',
        '📻 QUIZ RECEPTIONIST',
        [
          'Welcome to GOLDENROD RADIO TOWER! Tune your POKéGEAR to our broadcast frequencies to hear daily music and tips!',
        ]
      ),
    ],
    radio_tower_2f: [
      makeNpc(
        'buena',
        6,
        6,
        'DOWN',
        'girl',
        '🎙️ BUENA',
        [
          "I'm BUENA! Tune into BUENA'S PASSWORD every night on the radio to earn points on your BLUE CARD!",
        ]
      ),
    ],
    radio_tower_3f: [
      makeNpc(
        'sound_engineer',
        6,
        5,
        'RIGHT',
        'fat_man',
        '🎧 SOUND ENGINEER',
        [
          'We broadcast the POKéMON MARCH to energize traveling trainers, and POKéMON LULLABY to soothe wild monsters!',
        ]
      ),
    ],
    radio_tower_4f: [
      makeNpc(
        'dj_mary',
        7,
        4,
        'DOWN',
        'girl',
        '🎙️ DJ MARY',
        [
          'PROF. OAK and I host the POKéMON TALK radio show every day! We announce where rare POKéMON are swarming in Johto!',
        ]
      ),
    ],
    radio_tower_5f: [
      makeNpc(
        'radio_director',
        5,
        4,
        'DOWN',
        'elder',
        '📻 RADIO DIRECTOR',
        [
          "I'm the DIRECTOR of the GOLDENROD RADIO TOWER. Our broadcast tower reaches every corner of JOHTO and KANTO!",
          'Music and news unite trainers across all regions.',
        ]
      ),
    ],
    route_35: [
      makeNpc(
        'camper_ivan',
        4,
        19,
        'DOWN',
        'camper',
        '⛺ CAMPER IVAN',
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
      makeNpc(
        'camper_elliot',
        8,
        20,
        'DOWN',
        'camper',
        '⛺ CAMPER ELLIOT',
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
      makeNpc(
        'picnicker_brooke',
        7,
        20,
        'DOWN',
        'picnicker',
        '🧺 PICNICKER BROOKE',
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
      makeNpc(
        'picnicker_kim',
        10,
        26,
        'LEFT',
        'picnicker',
        '👧 PICNICKER KIM',
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
      makeNpc(
        'bird_keeper_bryan',
        14,
        28,
        'DOWN',
        'bird_keeper',
        '🦅 BIRD KEEPER BRYAN',
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
      makeNpc(
        'firebreather_walt',
        2,
        10,
        'RIGHT',
        'firebreather',
        '🔥 FIREBREATHER WALT',
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
      makeNpc(
        'bug_catcher_arnie',
        16,
        7,
        'DOWN',
        'bug_catcher',
        '🐛 BUG CATCHER ARNIE',
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
      makeNpc(
        'juggler_irwin',
        5,
        10,
        'RIGHT',
        'juggler',
        '🎪 JUGGLER IRWIN',
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
      makeNpc(
        'officer_dirk',
        5,
        6,
        'DOWN',
        'officer',
        '👮 OFFICER DIRK',
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
      makeNpc(
        'park_gate_officer',
        2,
        3,
        'DOWN',
        'officer',
        '👮 PARK OFFICER',
        [
          'Welcome to the NATIONAL PARK!',
          'The Bug-Catching Contest is held every Tuesday, Thursday, and Saturday! You could win a rare SUN STONE!',
        ],
        { action: 'BUG_CONTEST_OFFICER_EVENT' }
      ),
      makeNpc(
        'gate_civilian',
        6,
        4,
        'DOWN',
        'youngster',
        '👦 VISITOR',
        ['The Bug-Catching Contest is tough! High level and rare species score higher!']
      ),
    ],
    national_park: [
      makeNpc(
        'quick_claw_teacher',
        27,
        40,
        'DOWN',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          'Pay attention, please!',
          '…Oops, I have to quit thinking like a teacher all the time.',
          "You must be a POKéMON trainer.",
          "Since you're working so hard, I want you to have this.",
        ],
        { action: 'QUICK_CLAW_EVENT' }
      ),
      makeNpc(
        'schoolboy_jack',
        27,
        23,
        'LEFT',
        'schoolboy',
        '👦 SCHOOLBOY JACK',
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
      makeNpc(
        'pokefan_m_william',
        16,
        9,
        'DOWN',
        'pokefan_m',
        '🧢 POKéFAN WILLIAM',
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
      makeNpc(
        'pokefan_f_beverly',
        18,
        29,
        'DOWN',
        'pokefan_f',
        '🎀 POKéFAN BEVERLY',
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
      makeNpc(
        'lass_krise',
        8,
        14,
        'RIGHT',
        'lass',
        '👧 LASS KRISE',
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
      makeNpc(
        'park_gameboy_kid',
        26,
        6,
        'DOWN',
        'youngster',
        '👦 GAMEBOY KID',
        ["I'm trading mail with my buddy over the Game Link cable!"]
      ),
      makeNpc(
        'park_fountain_lass',
        15,
        24,
        'DOWN',
        'lass',
        '👧 PARK VISITOR',
        ['Relaxation Square in the center of the park is so peaceful!']
      ),
    ],
    route_36_national_park_gate: [
      makeNpc(
        'gate_guard',
        4,
        2,
        'DOWN',
        'officer',
        '👮 GATE OFFICER',
        [
          'ROUTE 36 is straight ahead to the east.',
          'There’s an odd tree blocking the road intersection that wiggles whenever it rains!',
        ]
      ),
    ],
    route_36: [
      makeNpc(
        'sudowoodo',
        35,
        9,
        'DOWN',
        'sudowoodo',
        '🌲 SUDOWOODO',
        [
          "It's a weird tree. It seems to wiggle when touched!",
          'Sudowoodo hated the water! It attacked!',
        ],
        { action: 'SUDOWOODO_EVENT' }
      ),
      makeNpc(
        'hard_rock_guy',
        44,
        9,
        'LEFT',
        'fisherman',
        '🥊 ROCK SMASH GUY',
        [
          'Wa-hey!',
          'I was going to snap that tree with my straight-arm punch.',
          "But I couldn't! I'm a failure!",
        ],
        { action: 'ROCK_SMASH_GUY_EVENT' }
      ),
      makeNpc(
        'psychic_mark',
        20,
        13,
        'RIGHT',
        'psychic',
        '🔮 PSYCHIC MARK',
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
      makeNpc(
        'schoolboy_alan',
        31,
        14,
        'LEFT',
        'schoolboy',
        '👦 SCHOOLBOY ALAN',
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
      makeNpc(
        'arthur_of_thursday',
        46,
        6,
        'DOWN',
        'youngster',
        '🪨 ARTHUR OF THURSDAY',
        [
          "ARTHUR: Who am I? I'm ARTHUR of Thursday! Pleased to make your acquaintance!",
          'Here, take this HARD STONE! It powers up ROCK-type moves!',
        ],
        { action: 'DAY_SIBLING_EVENT' }
      ),
      makeNpc(
        'route_36_lass',
        51,
        8,
        'LEFT',
        'lass',
        '👧 VIOLET TRAVELER',
        ['VIOLET CITY is just through this path past the trees!']
      ),
    ],
    route_36_ruins_of_alph_gate: [
      makeNpc(
        'alph_gate_guard',
        4,
        2,
        'DOWN',
        'officer',
        '👮 OFFICER',
        ['The northern chamber entrance to RUINS OF ALPH is down these stairs.']
      ),
    ],
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
          'This upgraded dowsing machine projects a real-time radar beam pointing straight toward buried treasures within 8 paces!',
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
        'tin_tower_sage',
        9,
        9,
        'DOWN',
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
  };

  const DEFAULT_LORE = [
    'The weather has been fierce lately, but the POKéMON here are tough!',
    'Trainers from all over pass through here on their way to the POKéMON LEAGUE.',
    'If your POKéMON gets hurt, head to the nearest POKéMON CENTER.',
  ];

  // Phase 11+ NPCs & trainers derived directly from pret/pokecrystal object events.
  for (const [mapId, list] of Object.entries(GENERATED_NPCS)) {
    const generatedList = list.map((n, idx) => {
      const generatedId = n.id || `${mapId}_${n.sprite}_${idx}`;
      return makeNpc(
        generatedId,
        n.x,
        n.y,
        n.dir,
        n.sprite as GridEntity['spriteType'],
        n.speaker || n.sprite.replace(/_/g, ' ').toUpperCase(),
        n.pages && n.pages.length > 0
          ? n.pages
          : n.team
          ? [`${n.speaker || 'TRAINER'}: That was a great battle!`]
          : [DEFAULT_LORE[(n.x + n.y) % DEFAULT_LORE.length]],
        {
          talkAcrossCounter: n.counter,
          action: (n.action || (n.team ? 'TRAINER_BATTLE' : undefined)) as GridEntity['action'],
          trainerId: n.trainerId || (n.team ? generatedId : undefined),
          trainerName: n.trainerName,
          visionRange: n.vision,
          challengePages: n.challenge || (n.team ? [`${n.speaker || 'TRAINER'}: Let's battle!`] : undefined),
          trainerPokemon: n.team?.[0],
          trainerTeam: n.team,
        }
      );
    });

    if (base[mapId]) {
      base[mapId].push(...generatedList);
    } else {
      base[mapId] = generatedList;
    }
  }
  return base;
}

export const npcsByMap: Record<string, GridEntity[]> = createNpcsByMap();

/**
 * Returns the active NPCs for a given map filtered by dynamic story flags:
 * - `mr_pokemons_house`: `prof_oak_npc` departs after `HAS_MYSTERY_EGG` / `HAS_POKEDEX` is set.
 * - `route_36`: `sudowoodo` is cleared after `sudowoodo_cleared` is set.
 */
export function getNpcsForMap(
  mapId: string,
  storyFlags: Set<string>,
  registry: Record<string, GridEntity[]> = npcsByMap
): GridEntity[] {
  const list = registry[mapId] || [];
  if (mapId === 'mr_pokemons_house' && (storyFlags.has('HAS_MYSTERY_EGG') || storyFlags.has('HAS_POKEDEX'))) {
    return list.filter((n) => n.id !== 'prof_oak_npc');
  }
  if (mapId === 'route_36' && (storyFlags.has('sudowoodo_cleared') || storyFlags.has('EVENT_FOUGHT_SUDOWOODO'))) {
    return list.filter((n) => n.id !== 'sudowoodo');
  }
  return list;
}
