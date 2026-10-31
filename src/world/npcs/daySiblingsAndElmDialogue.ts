/**
 * @fileoverview daySiblingsAndElmDialogue domain module implementation.
 * @module world/npcs/daySiblingsAndElmDialogue
 * @role Day-of-Week Sibling item gift definitions and Prof. Elm lab dialogue resolver
 * @exports DaySiblingInfo, DAY_SIBLINGS, DAY_OF_WEEK_SIBLINGS, DaySiblingConfig, resolveDaySiblingInteraction, resolveElmLabDialogue
 * @layer world
 * @sections L1-190: Day-of-Week Siblings | L191-290: Prof. Elm Lab Dialogue Resolver
 */

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
      'MONICA: My siblings are all across JOHTO! Did you meet them yet?',
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
      'Take this PINK BOW! It strengthens NORMAL-type moves!',
    ],
    alreadyGivenPages: [
      'TUSCANY: Do my siblings know you? We appear on different days of the week!',
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
      'WESLEY: Keep training! Dedication is the path to strength!',
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
      'Here, take this HARD STONE! It powers up ROCK-type moves!',
    ],
    alreadyGivenPages: [
      'ARTHUR: A stone is solid and unwavering. Be like a rock in your journey!',
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
      'Take this SPELL TAG! It boosts the power of GHOST-type moves!',
    ],
    alreadyGivenPages: [
      'SANTOS: Have you met my other six siblings? We are scattered all over!',
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
      'Here is a MAGNET to power up ELECTRIC-type moves!',
    ],
    alreadyGivenPages: [
      'SUNNY: Sunday is the best day to recharge! Enjoy your day!',
    ],
    wrongDayPages: [
      "SUNNY: Today's not Sunday. How disappointing.",
    ],
  },
};
DAY_SIBLINGS['frieda_of_friday'] = DAY_SIBLINGS['frieda'];

export type DaySiblingConfig = DaySiblingInfo;
export const DAY_OF_WEEK_SIBLINGS = DAY_SIBLINGS;

/**
 * Resolves interaction state for a Day-of-Week Sibling.
 */
export function resolveDaySiblingInteraction(
  targetNpcId: string,
  todayDayIndex: number,
  storyFlags: ReadonlySet<string>
): { canReceiveItem: boolean; sibling?: DaySiblingInfo } {
  const sibling =
    DAY_SIBLINGS[targetNpcId] ||
    Object.values(DAY_SIBLINGS).find(
      (s) =>
        s.name.toLowerCase().includes(targetNpcId.toLowerCase()) ||
        targetNpcId.toLowerCase().includes(s.id.toLowerCase())
    );
  if (!sibling) return { canReceiveItem: false };
  const canReceive = todayDayIndex === sibling.dayOfWeekIndex && !storyFlags.has(sibling.flag);
  return { canReceiveItem: canReceive, sibling };
}

/**
 * Resolves Prof. Elm's lab dialogue and action state.
 * Guarantees that players who already own a partner Pokémon in party (or have 'starter_chosen')
 * are never prompted to pick a starter from the table again.
 */
export function resolveElmLabDialogue(
  playerName: string,
  storyFlags: ReadonlySet<string>,
  party: ReadonlyArray<{ speciesId: string; isEgg?: boolean }> = []
): {
  pages: string[];
  action: 'PROMPT_STARTER' | 'PROMPT_POLICE' | 'DELIVER_MYSTERY_EGG' | 'HEAL_AND_SAVE' | 'GIVE_MASTER_BALL';
} {
  const hasStarter = storyFlags.has('starter_chosen') || party.some((p) => !p.isEgg);

  if (!hasStarter) {
    return {
      action: 'PROMPT_STARTER',
      pages: [
        `PROF. ELM: Hi, ${playerName}! I've been waiting for you!`,
        'I want you to run an errand for me! MR. POKéMON beyond CHERRYGROVE CITY on ROUTE 30 sent word of a rare discovery.',
        "I'd like you to go examine it for me. Choose one of the POKéMON in the BALLS on that table to accompany you!",
      ],
    };
  }

  if (storyFlags.has('has_rising_badge')) {
    if (!storyFlags.has('EVENT_GOT_MASTER_BALL_FROM_ELM')) {
      return {
        action: 'GIVE_MASTER_BALL',
        pages: [
          `PROF. ELM: Hi, ${playerName}! Thanks to you, my research is going great!`,
          "Take this as a token of my appreciation! It's the ultimate POKé BALL that catches any wild POKéMON without fail!",
          `${playerName} received the MASTER BALL!`,
          'PROF. ELM: The POKéMON LEAGUE is waiting! Head east from NEW BARK TOWN across ROUTE 27 and TOHJO FALLS towards KANTO!',
        ],
      };
    }
    return {
      action: 'HEAL_AND_SAVE',
      pages: [
        `PROF. ELM: Hi, ${playerName}! Have you used the MASTER BALL yet?`,
        'Head east across the water from NEW BARK TOWN to reach ROUTE 27 and TOHJO FALLS—the gateway to the INDIGO PLATEAU!',
        "Let me heal your POKéMON and save your journey's progress!",
      ],
    };
  }

  if (storyFlags.has('HAS_MYSTERY_EGG') && !storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')) {
    if (storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') && !storyFlags.has('EVENT_RIVAL_NAMED')) {
      return {
        action: 'PROMPT_POLICE',
        pages: [
          `PROF. ELM: ${playerName}! Did the officer question you about the break-in?`,
          'Please speak to the POLICE OFFICER first so we can help the investigation!',
        ],
      };
    }

    return {
      action: 'DELIVER_MYSTERY_EGG',
      pages: [
        `PROF. ELM: ${playerName}! You're back!`,
        'And you brought the MYSTERY EGG!',
        "This... this is an incredible discovery! I'll examine it thoroughly at once!",
        `${playerName} handed the MYSTERY EGG to PROF. ELM!`,
        'PROF. ELM: Take on the JOHTO GYM CHALLENGE! Your first stop is the VIOLET CITY GYM!',
      ],
    };
  }

  if (storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')) {
    return {
      action: 'HEAL_AND_SAVE',
      pages: [
        `PROF. ELM: How is your POKéMON journey going, ${playerName}?`,
        'The GYM LEADER in VIOLET CITY is FALKNER, a master of BIRD POKéMON!',
        "Here—let me heal your team so you're ready!",
      ],
    };
  }

  return {
    action: 'HEAL_AND_SAVE',
    pages: [
      `PROF. ELM: Hi, ${playerName}! How is your partner POKéMON doing?`,
      'MR. POKéMON lives a bit past CHERRYGROVE CITY on ROUTE 30. Take care on your way!',
      'Here—let me heal your POKéMON and record your research progress!',
    ],
  };
}
