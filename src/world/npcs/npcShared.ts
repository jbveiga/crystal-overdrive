/**
 * @fileoverview npcShared domain module implementation.
 * @module world/npcs/npcShared
 * @role npcShared Component
 * @exports makeNpc, GuideGentTourLegDef, GUIDE_GENT_TOUR_LEGS
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-327: Implementation | L328-655: Handlers & Exports
 */

import type { Direction } from '../../types/game';
import type { GridEntity, NpcMovementType } from '../GridPhysics';

const STATIONARY_SPRITE_TYPES = new Set<GridEntity['spriteType']>([
  'nurse',
  'clerk',
  'receptionist',
  'bike_shop_owner',
  'sudowoodo',
  'lapras',
  'suicune',
  'raikou',
  'entei',
  'ho_oh',
  'lugia',
  'gyarados',
  'electrode',
  'voltorb',
  'boulder',
  'fruit_tree',
  'farfetchd',
  'murkrow',
  'slowpoke',
  'miltank',
  'butterfree',
  'prof_elm',
  'oak',
  'mom',
  'elder_li',
  'falkner',
  'whitney',
  'morty',
  'clair',
  'pryce',
  'silver',
]);

const STATIONARY_NPC_ID_PATTERNS = [
  'nurse',
  'clerk',
  'guard',
  'blocker',
  'officer',
  'guide',
  'statue',
  'sign',
  'shutter',
  'door',
  'switch',
  'elevator',
  'cut_tree',
  'boulder',
  'snorlax',
  'sudowoodo',
  'gyarados',
  'suicune',
  'raikou',
  'entei',
  'beasts',
  'lugia',
  'ho_oh',
  'rival',
  'silver',
  'kurt',
  'elm',
  'oak',
  'mom',
  'bill',
  'lance',
  'falkner',
  'bugsy',
  'whitney',
  'morty',
  'chuck',
  'jasmine',
  'pryce',
  'clair',
  'brock',
  'misty',
  'surge',
  'erika',
  'janine',
  'sabrina',
  'blaine',
  'blue',
  'will',
  'koga',
  'bruno',
  'karen',
  'proton',
  'petrel',
  'ariana',
  'archer',
  'director',
  'kimono',
  'farfetchd',
  'apprentice',
  'cut_master',
  'tutor',
  'day_care',
  'daycare',
  'namerater',
  'name_rater',
  'move_deleter',
  'deleter',
  'guru',
  'mania',
  'recluse',
  'warden',
  'captain',
  'conductor',
  'salesman',
  'merchant',
  'haircut',
  'brother',
  'trade',
  'sibling',
  'monica',
  'tuscany',
  'wesley',
  'arthur',
  'frieda',
  'santos',
  'sunny',
  'kenya',
  'randy',
];

function hashNpcKey(id: string, x: number, y: number): number {
  let h = (x * 37 + y * 101) | 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function resolveDefaultNpcMovement(
  id: string,
  x: number,
  y: number,
  spriteType: GridEntity['spriteType'],
  opts: {
    wanders?: boolean;
    movementType?: NpcMovementType;
    wanderRadius?: number;
    talkAcrossCounter?: boolean;
    action?: GridEntity['action'];
    trainerId?: string;
    visionRange?: number;
    trainerTeam?: GridEntity['trainerTeam'];
    team?: GridEntity['trainerTeam'];
  }
): { wanders: boolean; movementType: NpcMovementType; wanderRadius: number } {
  if (opts.movementType) {
    const isMovingType = opts.movementType !== 'STILL';
    return {
      wanders: opts.wanders ?? isMovingType,
      movementType: opts.movementType,
      wanderRadius: opts.wanderRadius ?? (opts.movementType === 'SPINRANDOM' ? 0 : 1),
    };
  }
  if (opts.wanders === true) {
    return {
      wanders: true,
      movementType: 'WANDER',
      wanderRadius: opts.wanderRadius ?? 1,
    };
  }
  if (
    opts.wanders === false ||
    opts.talkAcrossCounter ||
    opts.action ||
    opts.trainerId ||
    (opts.visionRange && opts.visionRange > 0) ||
    (opts.trainerTeam && opts.trainerTeam.length > 0) ||
    (opts.team && opts.team.length > 0) ||
    STATIONARY_SPRITE_TYPES.has(spriteType)
  ) {
    return { wanders: false, movementType: 'STILL', wanderRadius: 0 };
  }

  const lowerId = id.toLowerCase();
  for (let i = 0; i < STATIONARY_NPC_ID_PATTERNS.length; i++) {
    if (lowerId.includes(STATIONARY_NPC_ID_PATTERNS[i])) {
      return { wanders: false, movementType: 'STILL', wanderRadius: 0 };
    }
  }

  // Deterministic Gen 2 ambient NPC movement assignment (WANDER, WALK_LEFT_RIGHT, WALK_UP_DOWN, SPINRANDOM)
  const h = hashNpcKey(id, x, y) % 5;
  if (h === 0 || h === 1) {
    return { wanders: true, movementType: 'WANDER', wanderRadius: opts.wanderRadius ?? 1 };
  }
  if (h === 2) {
    return { wanders: true, movementType: 'WALK_LEFT_RIGHT', wanderRadius: opts.wanderRadius ?? 1 };
  }
  if (h === 3) {
    return { wanders: true, movementType: 'WALK_UP_DOWN', wanderRadius: opts.wanderRadius ?? 1 };
  }
  return { wanders: true, movementType: 'SPINRANDOM', wanderRadius: 0 };
}

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
    movementType?: NpcMovementType;
    wanderRadius?: number;
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
): GridEntity => {
  const movement = resolveDefaultNpcMovement(id, x, y, spriteType, opts);
  return {
    id, x, y, originX: x, originY: y, originDirection: direction,
    gridX: x, gridY: y, targetX: x, targetY: y, renderX: x, renderY: y,
    direction, isMoving: false, progress: 0, isPlayer: false,
    spriteType, speaker, pages,
    wanders: movement.wanders,
    movementType: movement.movementType,
    wanderRadius: movement.wanderRadius,
    talkAcrossCounter: opts.talkAcrossCounter ?? false,
    action: opts.action, trainerId: opts.trainerId, trainerName: opts.trainerName,
    visionRange: opts.visionRange, challengePages: opts.challengePages, defeatPages: opts.defeatPages,
    trainerPokemon: opts.trainerPokemon, trainerTeam: opts.trainerTeam || opts.team,
    team: opts.team || opts.trainerTeam,
  };
};

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

  // Violet City Route 32 checkpoint (attendants block the south corridor until Zephyr Badge + Mystery Egg)
  if (npcId === 'violet_r32_attendant_w' || npcId === 'violet_r32_attendant_e' || npcId === 'violet_r32_attendant_side') {
    const cleared = storyFlags.has('route32_attendant_cleared');
    // Save safety: players who are already past the checkpoint are never blocked
    const alreadyPast =
      storyFlags.has('route_32_entered') ||
      storyFlags.has('bugsy_defeated') ||
      storyFlags.has('slowpoke_well_cleared') ||
      storyFlags.has('EVENT_CLEARED_SLOWPOKE_WELL');
    if (npcId === 'violet_r32_attendant_side') return (cleared || alreadyPast) && !storyFlags.has('received_miracle_seed');
    return !cleared && !alreadyPast;
  }

  // Mt. Silver Summit: Red vanishes after his defeat
  if (npcId === 'silver_cave_room_3_red_0') return !storyFlags.has('red_defeated');

  // Route 36 Sudowoodo
  if (npcId === 'sudowoodo') return !storyFlags.has('sudowoodo_cleared') && !storyFlags.has('EVENT_FOUGHT_SUDOWOODO');

  // Phase 11: Lake of Rage, Mahogany Town, and Team Rocket Base
  const isRedGyaradosSubdued =
    storyFlags.has('red_gyarados_subdued') ||
    storyFlags.has('EVENT_LAKE_OF_RAGE_RED_GYARADOS') ||
    storyFlags.has('received_exp_share') ||
    storyFlags.has('EVENT_GOT_EXP_SHARE_FROM_MR_POKEMON');
  if (npcId === 'lake_of_rage_red_gyarados') return !isRedGyaradosSubdued;
  if (npcId === 'lake_of_rage_lance') return (
      isRedGyaradosSubdued &&
      !storyFlags.has('lance_lake_talked') &&
      !storyFlags.has('EVENT_DECIDED_TO_HELP_LANCE') &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (npcId === 'mahogany_gym_blocker') return !storyFlags.has('rocket_base_generator_cleared') && !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');
  if (npcId === 'mahogany_town_rocket_1') {
    return (
      !isRedGyaradosSubdued &&
      !storyFlags.has('lance_lake_talked') &&
      !storyFlags.has('EVENT_DECIDED_TO_HELP_LANCE') &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  }
  if (npcId === 'mahogany_mart_lance') return (
      (isRedGyaradosSubdued || storyFlags.has('lance_lake_talked') || storyFlags.has('EVENT_DECIDED_TO_HELP_LANCE')) &&
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  if (
    npcId === 'mahogany_mart_rocket' ||
    npcId.startsWith('team_rocket_base_b1f_') ||
    npcId === 'team_rocket_base_b2f_rocket_0' ||
    npcId === 'team_rocket_base_b3f_rocket_0' ||
    npcId === 'team_rocket_base_b3f_scientist_3' ||
    npcId === 'team_rocket_base_b3f_scientist_4' ||
    npcId === 'team_rocket_base_b3f_rocket_5'
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
  if (
    npcId === 'team_rocket_base_b3f_murkrow' ||
    npcId === 'team_rocket_base_b3f_grunt_f' ||
    npcId === 'team_rocket_base_b3f_grunt_m'
  ) {
    return (
      !storyFlags.has('rocket_base_generator_cleared') &&
      !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
    );
  }
  if (npcId === 'route_43_gate_rocket_1' || npcId === 'route_43_gate_rocket_2') return !storyFlags.has('rocket_base_generator_cleared') && !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT');

  // Radio Tower & Underground Takeover (Act 7)
  if (npcId === 'petrel_radio_5f') return storyFlags.has('pryce_defeated') && !storyFlags.has('fake_director_defeated');
  if (npcId === 'executive_proton_radio_4f') return storyFlags.has('card_key_obtained') && !storyFlags.has('radio_tower_proton_defeated') && !storyFlags.has('radio_tower_liberated');
  // Executives Ariana & Archer ambush on 3F once the Card Key shutter has been opened
  if (npcId === 'executive_ariana_radio_3f') return storyFlags.has('EVENT_USED_CARD_KEY') && !storyFlags.has('ariana_defeated') && !storyFlags.has('radio_tower_liberated');
  if (npcId === 'archer_radio_3f') return storyFlags.has('EVENT_USED_CARD_KEY') && !storyFlags.has('radio_tower_liberated');
  if (npcId === 'liberated_director_radio_5f' || npcId === 'radio_director') return !storyFlags.has('fake_director_defeated') || storyFlags.has('radio_tower_liberated');
  if (npcId === 'true_director' || npcId === 'real_director_warehouse') return storyFlags.has('fake_director_defeated') && !storyFlags.has('radio_tower_liberated');

  // Bill Lifecycle: In Ecruteak Poke Center until spoken to, then returns home to Goldenrod City
  if (npcId === 'bill_cameo') return !storyFlags.has('EVENT_MET_BILL_IN_ECRUTEAK') && !storyFlags.has('met_bill_ecruteak');
  if (npcId === 'goldenrod_bill') return storyFlags.has('EVENT_MET_BILL_IN_ECRUTEAK') || storyFlags.has('met_bill_ecruteak');

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

  const isSuicuneResolved =
    storyFlags.has('suicune_caught_or_defeated') ||
    storyFlags.has('EVENT_CAUGHT_SUICUNE') ||
    storyFlags.has('EVENT_FOUGHT_SUICUNE');

  // Route 36 Suicune (Story Arc A)
  if (npcId === 'route_36_suicune') {
    return (
      !isSuicuneResolved &&
      (storyFlags.has('sudowoodo_cleared') || storyFlags.has('EVENT_FOUGHT_SUDOWOODO')) &&
      (storyFlags.has('beasts_awakened') || storyFlags.has('EVENT_RELEASED_THE_BEASTS')) &&
      !storyFlags.has('EVENT_SAW_SUICUNE_ON_ROUTE_36')
    );
  }

  // Cianwood City Suicune & Eusine
  if (npcId === 'cianwood_suicune') return !isSuicuneResolved && !storyFlags.has('EVENT_SAW_SUICUNE_AT_CIANWOOD_CITY');
  if (npcId === 'cianwood_eusine') return !isSuicuneResolved && !storyFlags.has('EVENT_FOUGHT_EUSINE');

  // Route 42 Suicune
  if (npcId === 'route_42_suicune') return !isSuicuneResolved && !storyFlags.has('EVENT_SAW_SUICUNE_ON_ROUTE_42');

  // Vermilion Port Suicune (Story Arc A)
  if (npcId === 'vermilion_port_suicune') return !isSuicuneResolved && !storyFlags.has('EVENT_SAW_SUICUNE_AT_VERMILION_PORT');

  // Olivine Lighthouse 6F & Olivine Gym Jasmine lifecycle
  if (npcId === 'lighthouse_jasmine') return !storyFlags.has('amphy_cured');
  if (npcId === 'leader_jasmine') return storyFlags.has('amphy_cured');

  // Tin Tower Suicune Altar, Eusine Cameo & Ho-Oh Roof (Act 8 / Arc A)
  if (npcId === 'suicune_altar') return storyFlags.has('has_clear_bell') && !isSuicuneResolved;
  if (npcId === 'tin_tower_eusine') return isSuicuneResolved;
  if (npcId === 'ho_oh_boss') {
    return (
      !storyFlags.has('ho_oh_defeated') &&
      !storyFlags.has('EVENT_FOUGHT_HO_OH') &&
      !storyFlags.has('EVENT_CAUGHT_HO_OH')
    );
  }

  // Whirl Islands Lugia Chamber (Act 8 / Post-Radio Tower)
  if (npcId === 'whirl_island_lugia') {
    return (
      !storyFlags.has('lugia_defeated') &&
      !storyFlags.has('EVENT_FOUGHT_LUGIA') &&
      !storyFlags.has('EVENT_CAUGHT_LUGIA')
    );
  }

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
  if (npcId === 'e4_will') return true;
  if (npcId === 'e4_koga') return true;
  if (npcId === 'e4_bruno') return true;
  if (npcId === 'e4_karen') return true;
  if (npcId === 'champion_lance') return true;

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

export type GuideGentTourLeg = GuideGentTourLegDef;
export {
  type DaySiblingInfo,
  type DaySiblingConfig,
  DAY_SIBLINGS,
  DAY_OF_WEEK_SIBLINGS,
  resolveDaySiblingInteraction,
  resolveElmLabDialogue,
} from './daySiblingsAndElmDialogue';

