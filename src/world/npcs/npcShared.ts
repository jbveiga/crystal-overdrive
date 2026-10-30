/**
 * @fileoverview npcShared domain module implementation.
 * @module world/npcs/npcShared
 * @role npcShared Component
 * @exports makeNpc, GuideGentTourLegDef, GUIDE_GENT_TOUR_LEGS
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-327: Implementation | L328-655: Handlers & Exports
 */

import type { Direction } from '../../types/game';
import type { GridEntity } from '../GridPhysics';

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
    defeatPages?: string[];
    trainerPokemon?: GridEntity['trainerPokemon'];
    trainerTeam?: GridEntity['trainerTeam'];
    team?: GridEntity['trainerTeam'];
  } = {}
): GridEntity => ({
  id, x, y, originX: x, originY: y, originDirection: direction,
  gridX: x, gridY: y, targetX: x, targetY: y, renderX: x, renderY: y,
  direction, isMoving: false, progress: 0, isPlayer: false,
  spriteType, speaker, pages,
  wanders: opts.wanders ?? false, talkAcrossCounter: opts.talkAcrossCounter ?? false,
  action: opts.action, trainerId: opts.trainerId, trainerName: opts.trainerName,
  visionRange: opts.visionRange, challengePages: opts.challengePages, defeatPages: opts.defeatPages,
  trainerPokemon: opts.trainerPokemon, trainerTeam: opts.trainerTeam || opts.team,
  team: opts.team || opts.trainerTeam,
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
    steps: ['DOWN', 'DOWN', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'DOWN', 'DOWN', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT'],
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

/**
 * Enforces single-presence rules so moving NPCs (e.g., Guide Gent, Kurt) are never
 * present in two locations simultaneously.
 */
export function isNpcActiveForStoryFlags(
  npcId: string,
  storyFlags: ReadonlySet<string> = new Set(),
  isFriday?: boolean
): boolean {
  if (npcId === 'union_cave_lapras') {
    const friday =
      isFriday !== undefined ? isFriday : storyFlags.has('FORCE_FRIDAY') || new Date().getDay() === 5;
    return (
      friday &&
      !storyFlags.has('defeated_lapras_union_cave') &&
      !storyFlags.has('caught_lapras')
    );
  }

  const hasMapCard =
    storyFlags.has('has_map_card') ||
    storyFlags.has('HAS_MAP_CARD') ||
    storyFlags.has('EVENT_GUIDE_GENT_IN_HIS_HOUSE');

  // Guide Gent (Mission S02): Outside in Cherrygrove City BEFORE Map Card; inside his house AFTER Map Card
  if (npcId === 'cg_guide_gent') return !hasMapCard;
  if (npcId === 'house_guide_gent') return hasMapCard;

  // New Bark Town Rival peeking into Elm's Lab window: only before receiving Mystery Egg
  if (npcId === 'nbt_rival') return (
      !storyFlags.has('HAS_MYSTERY_EGG') &&
      !storyFlags.has('mystery_egg_received') &&
      !storyFlags.has('rival_1_defeated') &&
      !storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') &&
      !storyFlags.has('EVENT_RIVAL_NAMED')
    );

  // Mr. Pokémon's House: Prof. Oak departs after granting the Pokédex
  if (npcId === 'prof_oak_npc') return !storyFlags.has('HAS_MYSTERY_EGG') && !storyFlags.has('HAS_POKEDEX');

  // Prof. Elm's Lab Police Officer: Strictly present ONLY after Cherrygrove Rival battle and BEFORE naming Rival
  if (npcId === 'lab_police_officer') return (
      storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') &&
      !storyFlags.has('EVENT_RIVAL_NAMED')
    );

  // Kurt (Mission M03): Strictly in one place at one time:
  // 1) Before EVENT_KURT_LEFT_FOR_WELL -> inside Kurt's House (kurt_house_kurt)
  // 2) After EVENT_KURT_LEFT_FOR_WELL & before slowpoke_well_cleared -> inside Slowpoke Well B1F (well_kurt)
  // 3) After slowpoke_well_cleared -> back inside Kurt's House (kurt_house_kurt)
  const isWellCleared =
    storyFlags.has('slowpoke_well_cleared') ||
    storyFlags.has('cleared_slowpoke_well') ||
    storyFlags.has('EVENT_CLEARED_SLOWPOKE_WELL');
  const kurtInWell = storyFlags.has('EVENT_KURT_LEFT_FOR_WELL') && !isWellCleared;

  if (npcId === 'azalea_kurt') return false;
  if (npcId === 'kurt_house_kurt') return !kurtInWell;
  if (npcId === 'well_kurt') return kurtInWell;

  // Azalea Town & Slowpoke Well Rocket Siege lifecycle
  if (npcId === 'azalea_well_grunt') return !storyFlags.has('EVENT_KURT_LEFT_FOR_WELL') && !isWellCleared;
  if (npcId === 'azalea_gym_grunt') return !isWellCleared;
  if (
    npcId === 'rocket_grunt_1' ||
    npcId === 'rocket_grunt_2' ||
    npcId === 'rocket_grunt_3' ||
    npcId === 'executive_proton'
  ) {
    return !isWellCleared;
  }
  if (npcId === 'azalea_slowpoke' || npcId === 'azalea_slowpoke_2') return isWellCleared;

  // Charcoal Kiln & Ilex Forest Farfetch'd lifecycle
  const isFarfetchdReturned =
    storyFlags.has('has_hm01_cut') || storyFlags.has('EVENT_GOT_HM01_CUT');
  if (npcId === 'kiln_apprentice' || npcId === 'kiln_farfetchd') return (
      isFarfetchdReturned ||
      storyFlags.has('EVENT_HERDED_FARFETCHD') ||
      storyFlags.has('forest_farfetchd_herded')
    );
  if (npcId === 'forest_farfetchd') return !isFarfetchdReturned;

  // Route 36 Sudowoodo
  if (npcId === 'sudowoodo') return !storyFlags.has('sudowoodo_cleared') && !storyFlags.has('EVENT_FOUGHT_SUDOWOODO');

  // Phase 11: Lake of Rage, Mahogany Town, and Team Rocket Base
  if (npcId === 'lake_of_rage_red_gyarados') return !storyFlags.has('red_gyarados_subdued') && !storyFlags.has('EVENT_LAKE_OF_RAGE_RED_GYARADOS');
  if (npcId === 'lake_of_rage_lance') return (
      (storyFlags.has('red_gyarados_subdued') || storyFlags.has('EVENT_LAKE_OF_RAGE_RED_GYARADOS')) &&
      !storyFlags.has('lance_lake_talked') &&
      !storyFlags.has('EVENT_DECIDED_TO_HELP_LANCE')
    );
  if (npcId === 'mahogany_gym_blocker') return !storyFlags.has('rocket_base_generator_cleared') && !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');
  if (npcId === 'mahogany_mart_lance') return (
      (storyFlags.has('lance_lake_talked') || storyFlags.has('EVENT_DECIDED_TO_HELP_LANCE')) &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (
    npcId === 'mahogany_town_rocket_1' ||
    npcId === 'mahogany_mart_rocket' ||
    npcId.startsWith('team_rocket_base_b1f_')
  ) {
    return !storyFlags.has('rocket_base_generator_cleared') && !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');
  }
  if (npcId === 'team_rocket_base_b2f_lance') return !storyFlags.has('rocket_base_generator_cleared') && !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');
  if (npcId === 'team_rocket_base_b2f_ariana') return (
      !storyFlags.has('EVENT_BEAT_ROCKET_EXECUTIVEF_2') &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (npcId.startsWith('b3f_electrode_') || npcId.startsWith('b2f_electrode_')) {
    if (storyFlags.has('rocket_base_generator_cleared') || storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')) return false;
    return !storyFlags.has(npcId + '_cleared');
  }
  if (npcId === 'team_rocket_base_b3f_petrel') return (
      !storyFlags.has('EVENT_BEAT_ROCKET_EXECUTIVEM_4') &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (npcId === 'team_rocket_base_b3f_murkrow') return (
      storyFlags.has('EVENT_BEAT_ROCKET_EXECUTIVEM_4') &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (npcId === 'team_rocket_base_b3f_grunt_f') return (
      !storyFlags.has('EVENT_LEARNED_SLOWPOKETAIL') &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (npcId === 'team_rocket_base_b3f_grunt_m') return (
      !storyFlags.has('EVENT_LEARNED_RATICATETAIL') &&
      !storyFlags.has('EVENT_LEARNED_RATICATE_TAIL') &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (npcId === 'route_43_gate_rocket_1' || npcId === 'route_43_gate_rocket_2') return !storyFlags.has('rocket_base_generator_cleared') && !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');

  // Radio Tower & Underground Takeover (Act 7)
  if (npcId === 'petrel_radio_5f') return storyFlags.has('pryce_defeated') && !storyFlags.has('fake_director_defeated');
  if (npcId === 'executive_proton_radio_4f') return storyFlags.has('card_key_obtained') && !storyFlags.has('proton_defeated') && !storyFlags.has('radio_tower_liberated');
  if (npcId === 'executive_ariana_radio_5f') return storyFlags.has('card_key_obtained') && !storyFlags.has('ariana_defeated') && !storyFlags.has('radio_tower_liberated');
  if (npcId === 'archer_radio_5f') return storyFlags.has('card_key_obtained') && !storyFlags.has('radio_tower_liberated');
  if (npcId === 'liberated_director_radio_5f' || npcId === 'radio_director') return !storyFlags.has('pryce_defeated') || storyFlags.has('radio_tower_liberated');
  if (npcId === 'true_director' || npcId === 'real_director_warehouse') return storyFlags.has('fake_director_defeated') && !storyFlags.has('radio_tower_liberated');

  // Burned Tower 1F Rival Silver: despawn once defeated or beasts awaken
  if (npcId === 'silver_burned') {
    return (
      !storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER') &&
      !storyFlags.has('beasts_awakened') &&
      !storyFlags.has('EVENT_RELEASED_THE_BEASTS')
    );
  }

  // Ecruteak Gym Leader Morty: away at Burned Tower until beasts awaken (when active story flags are tracked)
  if (npcId === 'morty' && storyFlags.size > 0) {
    return (
      storyFlags.has('beasts_awakened') ||
      storyFlags.has('EVENT_RELEASED_THE_BEASTS') ||
      storyFlags.has('morty_defeated')
    );
  }

  // Burned Tower B1F Legendary Beasts & 1F Morty/Eusine: despawn once beasts awaken
  if (
    npcId === 'beasts' ||
    npcId === 'burned_raikou' ||
    npcId === 'burned_entei' ||
    npcId === 'morty_burned' ||
    npcId === 'eusine'
  ) {
    return !storyFlags.has('beasts_awakened') && !storyFlags.has('EVENT_RELEASED_THE_BEASTS');
  }

  // Cianwood City Suicune & Eusine
  if (npcId === 'cianwood_suicune') return !storyFlags.has('EVENT_SAW_SUICUNE_AT_CIANWOOD_CITY');
  if (npcId === 'cianwood_eusine') return !storyFlags.has('EVENT_FOUGHT_EUSINE');

  // Route 42 Suicune
  if (npcId === 'route_42_suicune') return !storyFlags.has('EVENT_SAW_SUICUNE_ON_ROUTE_42');

  // Olivine Lighthouse 6F & Olivine Gym Jasmine lifecycle
  if (npcId === 'lighthouse_jasmine') return !storyFlags.has('amphy_cured');
  if (npcId === 'leader_jasmine') return storyFlags.has('amphy_cured');

  // Tin Tower Suicune Altar (Act 8)
  if (npcId === 'suicune_altar') return storyFlags.has('has_clear_bell') && !storyFlags.has('suicune_caught_or_defeated');

  // Whirl Islands Lugia Chamber (Act 8 / Post-Radio Tower)
  if (npcId === 'whirl_island_lugia') return !storyFlags.has('lugia_defeated') && !storyFlags.has('EVENT_FOUGHT_LUGIA');

  // Ice Path B1F & B2F Strength Boulders
  if (npcId.startsWith('ice_path_b1f_boulder_')) {
    const num = npcId.split('_').pop();
    return !storyFlags.has(`EVENT_BOULDER_IN_ICE_PATH_${num}`);
  }
  if (npcId.startsWith('ice_path_b2f_boulder_')) {
    const num = npcId.split('_').pop();
    return storyFlags.has(`EVENT_BOULDER_IN_ICE_PATH_${num}`);
  }

  // Blackthorn Gym 2F & 1F Strength Boulders
  if (npcId.startsWith('blackthorn_gym_2f_boulder_')) {
    const num = npcId.split('_').pop();
    return !storyFlags.has(`EVENT_BOULDER_IN_BLACKTHORN_GYM_${num}`);
  }
  if (npcId.startsWith('blackthorn_gym_1f_boulder_')) {
    const num = npcId.split('_').pop();
    return storyFlags.has(`EVENT_BOULDER_IN_BLACKTHORN_GYM_${num}`);
  }
  if (npcId === 'dragon_shrine_clair_3') return storyFlags.has('dragon_elder_quiz_passed');

  // Victory Road Rival & Indigo Plateau Elite Four (Act 9)
  if (npcId === 'victory_road_rival') return true;
  if (npcId === 'e4_will') return !storyFlags.has('will_defeated');
  if (npcId === 'e4_koga') return !storyFlags.has('koga_defeated');
  if (npcId === 'e4_bruno') return !storyFlags.has('bruno_defeated');
  if (npcId === 'e4_karen') return !storyFlags.has('karen_defeated');
  if (npcId === 'champion_lance') return !storyFlags.has('champion_defeated');

  // Fast Ship S.S. Aqua & Copycat lifecycle
  const fastShipArrived =
    storyFlags.has('granddaughter_found') ||
    storyFlags.has('granddaughter_returned') ||
    storyFlags.has('fast_ship_arrived_vermilion');
  if (npcId === 'fast_ship_cabins_se_sse_captains_cabin_gentleman_cabin' || npcId === 'fast_ship_cabins_se_sse_captains_cabin_twin_cabin') return fastShipArrived;
  if (npcId === 'fast_ship_cabins_se_sse_captains_cabin_twin_2' || npcId === 'fast_ship_1f_gentleman_3') return !fastShipArrived;
  if (npcId === 'copycats_doll') return storyFlags.has('got_magnet_train_pass') || storyFlags.has('copycat_doll_returned') || storyFlags.has('EVENT_RETURNED_LOST_ITEM_TO_COPYCAT');

  // Kanto Cut Trees
  if (npcId === 'vermilion_city_cut_tree') return !storyFlags.has('vermilion_cut_tree_cleared');
  if (npcId === 'celadon_city_cut_tree') return !storyFlags.has('celadon_cut_tree_cleared');

  // Kanto Snorlax & Cerulean Questline NPCs
  if (npcId === 'vermilion_city_snorlax') return !storyFlags.has('snorlax_cleared') && !storyFlags.has('EVENT_FOUGHT_SNORLAX');
  if (npcId === 'cerulean_gym_rocket_grunt') return !storyFlags.has('EVENT_MET_ROCKET_GRUNT_AT_CERULEAN_GYM');
  if (npcId === 'route_24_rocket_grunt') return storyFlags.has('EVENT_MET_ROCKET_GRUNT_AT_CERULEAN_GYM') && !storyFlags.has('EVENT_DEFEATED_ROUTE24_GRUNT');
  if (npcId === 'route_25_misty' || npcId === 'route_25_misty_date') return !storyFlags.has('EVENT_MET_MISTY_AT_CERULEAN_CAPE');
  if (npcId === 'cerulean_gym_misty') return storyFlags.has('EVENT_MET_MISTY_AT_CERULEAN_CAPE');
  if (npcId === 'cerulean_gym_swimmer_diana' || npcId === 'cerulean_gym_swimmer_briana' || npcId === 'cerulean_gym_swimmer_parker') {
    return storyFlags.has('EVENT_MET_MISTY_AT_CERULEAN_CAPE');
  }

  return true;
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


export type GuideGentTourLeg = GuideGentTourLegDef;
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
): { pages: string[]; action: 'PROMPT_STARTER' | 'PROMPT_POLICE' | 'DELIVER_MYSTERY_EGG' | 'HEAL_AND_SAVE' | 'GIVE_MASTER_BALL' } {
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
