/**
 * Pure TypeScript Johto Regional Cartography & Landmark Domain.
 * ZERO DOM / Pixi imports (Separation of Concerns).
 *
 * Synchronized with Google Stitch Neo-Kanto Protocol (Ticket: TICKET-FEATURE-TOWN-MAP-ENGINE-01).
 */

export interface TownMapLandmark {
  id: string;
  name: string;
  subtitle: string;
  gridX: number; // 0..15 on tactical radar matrix
  gridY: number; // 0..13
  type: 'town' | 'city' | 'route' | 'dungeon' | 'landmark';
  gymLeader?: string;
  badgeName?: string;
  badgeIcon?: string;
  flyable?: boolean;
  wildSpecies?: string[];
}

export interface TownMapConnection {
  from: string;
  to: string;
}

export const JOHTO_LANDMARKS: Record<string, TownMapLandmark> = {
  new_bark_town: {
    id: 'new_bark_town',
    name: 'New Bark Town',
    subtitle: 'The Town Where the Winds of a New Beginning Blow',
    gridX: 14,
    gridY: 10,
    type: 'town',
    flyable: true,
  },
  route_29: {
    id: 'route_29',
    name: 'Route 29',
    subtitle: 'Connecting New Bark Town and Cherrygrove City',
    gridX: 12,
    gridY: 10,
    type: 'route',
    wildSpecies: ['pidgey', 'rattata', 'sentret', 'hoothoot'],
  },
  cherrygrove_city: {
    id: 'cherrygrove_city',
    name: 'Cherrygrove City',
    subtitle: 'The City of Fragrant Flowers',
    gridX: 10,
    gridY: 10,
    type: 'city',
    flyable: true,
  },
  route_30: {
    id: 'route_30',
    name: 'Route 30',
    subtitle: "Route to Mr. Pokémon's House",
    gridX: 10,
    gridY: 8,
    type: 'route',
    wildSpecies: ['caterpie', 'weedle', 'pidgey', 'spinarak', 'ledyba'],
  },
  route_31: {
    id: 'route_31',
    name: 'Route 31',
    subtitle: 'Gateway to Violet City & Dark Cave Entrance',
    gridX: 9,
    gridY: 6,
    type: 'route',
    wildSpecies: ['caterpie', 'weedle', 'bellsprout', 'poliwag'],
  },
  violet_city: {
    id: 'violet_city',
    name: 'Violet City',
    subtitle: 'The City of Nostalgic Scents',
    gridX: 8,
    gridY: 6,
    type: 'city',
    gymLeader: 'Falkner',
    badgeName: 'Zephyr Badge',
    badgeIcon: '🦅',
    flyable: true,
  },
  sprout_tower: {
    id: 'sprout_tower',
    name: 'Sprout Tower',
    subtitle: 'Sacred Bellsprout Pagoda',
    gridX: 8,
    gridY: 5,
    type: 'dungeon',
    wildSpecies: ['rattata', 'gastly'],
  },
  ruins_of_alph: {
    id: 'ruins_of_alph',
    name: 'Ruins of Alph',
    subtitle: 'Ancient Chamber of the Unown',
    gridX: 7,
    gridY: 8,
    type: 'dungeon',
    wildSpecies: ['unown'],
  },
  route_32: {
    id: 'route_32',
    name: 'Route 32',
    subtitle: 'Coastal Avenue to Union Cave',
    gridX: 8,
    gridY: 8,
    type: 'route',
    wildSpecies: ['mareep', 'wooper', 'bellsprout', 'zubat'],
  },
  union_cave: {
    id: 'union_cave',
    name: 'Union Cave',
    subtitle: 'Underground Passage to Azalea Town',
    gridX: 8,
    gridY: 10,
    type: 'dungeon',
    wildSpecies: ['geodude', 'zubat', 'onix', 'wooper', 'lapras'],
  },
  route_33: {
    id: 'route_33',
    name: 'Route 33',
    subtitle: 'Rainy Road to Azalea Town',
    gridX: 7,
    gridY: 10,
    type: 'route',
    wildSpecies: ['rattata', 'spearow', 'geodude', 'zubat'],
  },
  azalea_town: {
    id: 'azalea_town',
    name: 'Azalea Town',
    subtitle: 'Where People and Pokémon Live in Happy Harmony',
    gridX: 6,
    gridY: 10,
    type: 'town',
    gymLeader: 'Bugsy',
    badgeName: 'Hive Badge',
    badgeIcon: '🐞',
    flyable: true,
  },
  slowpoke_well: {
    id: 'slowpoke_well',
    name: 'Slowpoke Well',
    subtitle: "Kurt's Ancestral Water Shrine",
    gridX: 6,
    gridY: 9,
    type: 'dungeon',
    wildSpecies: ['zubat', 'slowpoke'],
  },
  ilex_forest: {
    id: 'ilex_forest',
    name: 'Ilex Forest',
    subtitle: 'Shrine of the Forest Guardian Celebi',
    gridX: 5,
    gridY: 10,
    type: 'dungeon',
    wildSpecies: ['caterpie', 'metapod', 'weedle', 'kakuna', 'zubat', 'paras'],
  },
  route_34: {
    id: 'route_34',
    name: 'Route 34',
    subtitle: 'Day-Care Meadow to Goldenrod City',
    gridX: 5,
    gridY: 8,
    type: 'route',
    wildSpecies: ['rattata', 'snubbull', 'ditto', 'drowzee'],
  },
  goldenrod_city: {
    id: 'goldenrod_city',
    name: 'Goldenrod City',
    subtitle: 'The Festive City of Opulent Charm',
    gridX: 5,
    gridY: 7,
    type: 'city',
    gymLeader: 'Whitney',
    badgeName: 'Plain Badge',
    badgeIcon: '🩷',
    flyable: true,
  },
  route_35: {
    id: 'route_35',
    name: 'Route 35',
    subtitle: 'North Passage to National Park',
    gridX: 5,
    gridY: 6,
    type: 'route',
    wildSpecies: ['pidgey', 'nidoran_f', 'nidoran_m', 'drowzee', 'ditto'],
  },
  national_park: {
    id: 'national_park',
    name: 'National Park',
    subtitle: 'Home of the Bug-Catching Contest',
    gridX: 5,
    gridY: 5,
    type: 'landmark',
    wildSpecies: ['caterpie', 'weedle', 'butterfree', 'beedrill', 'pinsir', 'scyther'],
  },
  route_36: {
    id: 'route_36',
    name: 'Route 36',
    subtitle: 'Crossroads Blocked by Strange Tree',
    gridX: 6,
    gridY: 5,
    type: 'route',
    wildSpecies: ['pidgey', 'bellsprout', 'growlithe', 'vulpix', 'sudowoodo'],
  },
  route_37: {
    id: 'route_37',
    name: 'Route 37',
    subtitle: 'Apricorn Grove to Ecruteak City',
    gridX: 7,
    gridY: 4,
    type: 'route',
    wildSpecies: ['pidgey', 'pidgeotto', 'stantler', 'spinarak', 'ledyba'],
  },
  ecruteak_city: {
    id: 'ecruteak_city',
    name: 'Ecruteak City',
    subtitle: 'A Historical City Where the Past Meets the Present',
    gridX: 7,
    gridY: 3,
    type: 'city',
    gymLeader: 'Morty',
    badgeName: 'Fog Badge',
    badgeIcon: '👻',
    flyable: true,
  },
  burned_tower: {
    id: 'burned_tower',
    name: 'Burned Tower',
    subtitle: 'The Slumbering Place of the Roaming Beasts',
    gridX: 6,
    gridY: 3,
    type: 'dungeon',
    wildSpecies: ['rattata', 'koffing', 'zubat'],
  },
  tin_tower: {
    id: 'tin_tower',
    name: 'Tin Tower',
    subtitle: 'Sacred Roost of Ho-Oh',
    gridX: 7,
    gridY: 2,
    type: 'dungeon',
    wildSpecies: ['rattata', 'gastly'],
  },
  route_38: {
    id: 'route_38',
    name: 'Route 38',
    subtitle: 'Breezy Pastoral Route to Olivine',
    gridX: 5,
    gridY: 3,
    type: 'route',
    wildSpecies: ['rattata', 'raticate', 'meowth', 'magnemite', 'tauros', 'miltank'],
  },
  route_39: {
    id: 'route_39',
    name: 'Route 39',
    subtitle: 'Moomoo Farm Pasture',
    gridX: 3,
    gridY: 4,
    type: 'route',
    wildSpecies: ['miltank', 'tauros', 'magnemite', 'meowth'],
  },
  olivine_city: {
    id: 'olivine_city',
    name: 'Olivine City',
    subtitle: 'The Port with Sea Breeze & Glittering Lighthouse',
    gridX: 3,
    gridY: 5,
    type: 'city',
    gymLeader: 'Jasmine',
    badgeName: 'Mineral Badge',
    badgeIcon: '⚙️',
    flyable: true,
  },
  route_40: {
    id: 'route_40',
    name: 'Route 40',
    subtitle: 'Cianwood Sea Passage & Battle Tower Gate',
    gridX: 3,
    gridY: 7,
    type: 'route',
    wildSpecies: ['tentacool', 'tentacruel'],
  },
  route_41: {
    id: 'route_41',
    name: 'Route 41',
    subtitle: 'Whirl Islands Maritime Trench',
    gridX: 2,
    gridY: 8,
    type: 'route',
    wildSpecies: ['tentacool', 'mantine'],
  },
  cianwood_city: {
    id: 'cianwood_city',
    name: 'Cianwood City',
    subtitle: 'A Port Surrounded by Rough Seas',
    gridX: 1,
    gridY: 9,
    type: 'city',
    gymLeader: 'Chuck',
    badgeName: 'Storm Badge',
    badgeIcon: '👊',
    flyable: true,
  },
  route_42: {
    id: 'route_42',
    name: 'Route 42',
    subtitle: 'Mt. Mortar Foothills',
    gridX: 9,
    gridY: 3,
    type: 'route',
    wildSpecies: ['mankey', 'mareep', 'flaaffy', 'golbat'],
  },
  mahogany_town: {
    id: 'mahogany_town',
    name: 'Mahogany Town',
    subtitle: 'Welcome to the Home of the Ninja',
    gridX: 11,
    gridY: 3,
    type: 'town',
    gymLeader: 'Pryce',
    badgeName: 'Glacier Badge',
    badgeIcon: '❄️',
    flyable: true,
  },
  route_43: {
    id: 'route_43',
    name: 'Route 43',
    subtitle: 'Lake of Rage Approach Route',
    gridX: 11,
    gridY: 2,
    type: 'route',
    wildSpecies: ['pidgeotto', 'flaaffy', 'girafarig', 'venonat'],
  },
  lake_of_rage: {
    id: 'lake_of_rage',
    name: 'Lake of Rage',
    subtitle: 'Habitat of the Legendary Red Gyarados',
    gridX: 11,
    gridY: 1,
    type: 'landmark',
    wildSpecies: ['magikarp', 'gyarados'],
  },
  route_44: {
    id: 'route_44',
    name: 'Route 44',
    subtitle: 'Frozen Mountain Entrance',
    gridX: 12,
    gridY: 3,
    type: 'route',
    wildSpecies: ['bellsprout', 'weepinbell', 'tangela', 'poliwag'],
  },
  ice_path: {
    id: 'ice_path',
    name: 'Ice Path',
    subtitle: 'Glacial Cavern Passage to Blackthorn',
    gridX: 13,
    gridY: 3,
    type: 'dungeon',
    wildSpecies: ['swinub', 'delibird', 'jynx', 'golbat'],
  },
  blackthorn_city: {
    id: 'blackthorn_city',
    name: 'Blackthorn City',
    subtitle: 'A Quiet Mountain Retreat of Dragon Tamers',
    gridX: 14,
    gridY: 4,
    type: 'city',
    gymLeader: 'Clair',
    badgeName: 'Rising Badge',
    badgeIcon: '🐉',
    flyable: true,
  },
  dragons_den: {
    id: 'dragons_den',
    name: "Dragon's Den",
    subtitle: 'Sacred Training Grounds of the Dragon Clan',
    gridX: 14,
    gridY: 3,
    type: 'dungeon',
    wildSpecies: ['dratini', 'dragonair', 'magikarp'],
  },
  route_45: {
    id: 'route_45',
    name: 'Route 45',
    subtitle: 'Mountain Path to New Bark Town',
    gridX: 14,
    gridY: 6,
    type: 'route',
    wildSpecies: ['graveler', 'gligar', 'skarmory', 'phanpy', 'teddiursa'],
  },
  route_46: {
    id: 'route_46',
    name: 'Route 46',
    subtitle: 'Rugged Cliff Pass',
    gridX: 13,
    gridY: 8,
    type: 'route',
    wildSpecies: ['rattata', 'spearow', 'geodude'],
  },
  indigo_plateau: {
    id: 'indigo_plateau',
    name: 'Indigo Plateau',
    subtitle: 'Pokémon League Headquarters',
    gridX: 15,
    gridY: 6,
    type: 'landmark',
    flyable: true,
  },
};

export const JOHTO_CONNECTIONS: TownMapConnection[] = [
  { from: 'new_bark_town', to: 'route_29' },
  { from: 'route_29', to: 'cherrygrove_city' },
  { from: 'cherrygrove_city', to: 'route_30' },
  { from: 'route_30', to: 'route_31' },
  { from: 'route_31', to: 'violet_city' },
  { from: 'violet_city', to: 'sprout_tower' },
  { from: 'violet_city', to: 'route_32' },
  { from: 'violet_city', to: 'route_36' },
  { from: 'route_36', to: 'ruins_of_alph' },
  { from: 'route_32', to: 'union_cave' },
  { from: 'union_cave', to: 'route_33' },
  { from: 'route_33', to: 'azalea_town' },
  { from: 'azalea_town', to: 'slowpoke_well' },
  { from: 'azalea_town', to: 'ilex_forest' },
  { from: 'ilex_forest', to: 'route_34' },
  { from: 'route_34', to: 'goldenrod_city' },
  { from: 'goldenrod_city', to: 'route_35' },
  { from: 'route_35', to: 'national_park' },
  { from: 'national_park', to: 'route_36' },
  { from: 'route_36', to: 'route_37' },
  { from: 'route_37', to: 'ecruteak_city' },
  { from: 'ecruteak_city', to: 'burned_tower' },
  { from: 'ecruteak_city', to: 'tin_tower' },
  { from: 'ecruteak_city', to: 'route_38' },
  { from: 'route_38', to: 'route_39' },
  { from: 'route_39', to: 'olivine_city' },
  { from: 'olivine_city', to: 'route_40' },
  { from: 'route_40', to: 'route_41' },
  { from: 'route_41', to: 'cianwood_city' },
  { from: 'ecruteak_city', to: 'route_42' },
  { from: 'route_42', to: 'mahogany_town' },
  { from: 'mahogany_town', to: 'route_43' },
  { from: 'route_43', to: 'lake_of_rage' },
  { from: 'mahogany_town', to: 'route_44' },
  { from: 'route_44', to: 'ice_path' },
  { from: 'ice_path', to: 'blackthorn_city' },
  { from: 'blackthorn_city', to: 'dragons_den' },
  { from: 'blackthorn_city', to: 'route_45' },
  { from: 'route_45', to: 'route_46' },
  { from: 'route_46', to: 'route_29' },
];

/**
 * Resolves any game map ID (overworld or interior) to its parent regional landmark.
 */
export function resolveCurrentLandmark(mapId: string): TownMapLandmark | null {
  if (!mapId) return null;

  const clean = mapId.toLowerCase().trim();

  // Direct landmark match
  if (JOHTO_LANDMARKS[clean]) {
    return JOHTO_LANDMARKS[clean];
  }

  // New Bark Town & residences
  if (
    clean.startsWith('new_bark') ||
    clean.startsWith('elms_lab') ||
    clean.startsWith('players_house') ||
    clean.includes('elms_house') ||
    clean.includes('players_neighbor')
  ) {
    return JOHTO_LANDMARKS.new_bark_town;
  }

  // Cherrygrove City & interiors
  if (clean.startsWith('cherrygrove') || clean.includes('guide_gent')) {
    return JOHTO_LANDMARKS.cherrygrove_city;
  }

  // Route 30 (Mr. Pokémon's House & Berry House)
  if (clean.startsWith('route_30') || clean.includes('mr_pokemon')) {
    return JOHTO_LANDMARKS.route_30;
  }

  // Route 31 (Gate & Dark Cave West)
  if (clean.startsWith('route_31') || clean.includes('dark_cave_violet')) {
    return JOHTO_LANDMARKS.route_31;
  }

  // Sprout Tower floors
  if (clean.startsWith('sprout_tower')) {
    return JOHTO_LANDMARKS.sprout_tower;
  }

  // Violet City & Earl's Pokémon Academy
  if (clean.startsWith('violet') || clean.includes('earls_pokemon_academy')) {
    return JOHTO_LANDMARKS.violet_city;
  }

  // Ruins of Alph
  if (clean.startsWith('ruins_of_alph')) {
    return JOHTO_LANDMARKS.ruins_of_alph;
  }

  // Route 32 & Gate
  if (clean.startsWith('route_32')) {
    return JOHTO_LANDMARKS.route_32;
  }

  // Union Cave
  if (clean.startsWith('union_cave')) {
    return JOHTO_LANDMARKS.union_cave;
  }

  // Route 33
  if (clean.startsWith('route_33')) {
    return JOHTO_LANDMARKS.route_33;
  }

  // Slowpoke Well
  if (clean.startsWith('slowpoke_well')) {
    return JOHTO_LANDMARKS.slowpoke_well;
  }

  // Azalea Town, Kurt's House, Charcoal Kiln
  if (
    clean.startsWith('azalea') ||
    clean.includes('kurts_house') ||
    clean.includes('charcoal_kiln')
  ) {
    return JOHTO_LANDMARKS.azalea_town;
  }

  // Ilex Forest
  if (clean.startsWith('ilex_forest')) {
    return JOHTO_LANDMARKS.ilex_forest;
  }

  // Route 34 & Pokémon Day Care
  if (clean.startsWith('route_34') || clean.includes('day_care')) {
    return JOHTO_LANDMARKS.route_34;
  }

  // Goldenrod City, Radio Tower, Dept Store, Underground, Bill's House
  if (clean.startsWith('goldenrod') || clean.startsWith('radio_tower')) {
    return JOHTO_LANDMARKS.goldenrod_city;
  }

  // Route 35
  if (clean.startsWith('route_35')) {
    return JOHTO_LANDMARKS.route_35;
  }

  // National Park
  if (clean.startsWith('national_park')) {
    return JOHTO_LANDMARKS.national_park;
  }

  // Route 36
  if (clean.startsWith('route_36')) {
    return JOHTO_LANDMARKS.route_36;
  }

  // Route 37
  if (clean.startsWith('route_37')) {
    return JOHTO_LANDMARKS.route_37;
  }

  // Burned Tower
  if (clean.startsWith('burned_tower')) {
    return JOHTO_LANDMARKS.burned_tower;
  }

  // Tin Tower / Bellchime Trail
  if (clean.startsWith('tin_tower') || clean.includes('bellchime') || clean.includes('wise_trio')) {
    return JOHTO_LANDMARKS.tin_tower;
  }

  // Ecruteak City & Kimono Dance Theater
  if (clean.startsWith('ecruteak') || clean.includes('dance_theat')) {
    return JOHTO_LANDMARKS.ecruteak_city;
  }

  // Route 38
  if (clean.startsWith('route_38')) {
    return JOHTO_LANDMARKS.route_38;
  }

  // Route 39 & Moomoo Farm
  if (clean.startsWith('route_39')) {
    return JOHTO_LANDMARKS.route_39;
  }

  // Olivine City & Lighthouse floors
  if (clean.startsWith('olivine') || clean.includes('lighthouse')) {
    return JOHTO_LANDMARKS.olivine_city;
  }

  // Route 40 & Battle Tower facility
  if (clean.startsWith('route_40') || clean.startsWith('battle_tower')) {
    return JOHTO_LANDMARKS.route_40;
  }

  // Route 41 & Whirl Islands chambers
  if (clean.startsWith('route_41') || clean.startsWith('whirl_island')) {
    return JOHTO_LANDMARKS.route_41;
  }

  // Cianwood City & Cliff passages
  if (
    clean.startsWith('cianwood') ||
    clean.includes('poke_seer') ||
    clean.includes('cliff_cave') ||
    clean.includes('cliff_edge')
  ) {
    return JOHTO_LANDMARKS.cianwood_city;
  }

  // Route 42 & Mount Mortar
  if (
    clean.startsWith('route_42') ||
    clean.startsWith('mount_mortar') ||
    clean.startsWith('mt_mortar')
  ) {
    return JOHTO_LANDMARKS.route_42;
  }

  // Mahogany Town & Team Rocket Base
  if (
    clean.startsWith('mahogany') ||
    clean.includes('team_rocket_base') ||
    clean.includes('rocket_hideout')
  ) {
    return JOHTO_LANDMARKS.mahogany_town;
  }

  // Route 43
  if (clean.startsWith('route_43')) {
    return JOHTO_LANDMARKS.route_43;
  }

  // Lake of Rage
  if (clean.startsWith('lake_of_rage')) {
    return JOHTO_LANDMARKS.lake_of_rage;
  }

  // Route 44
  if (clean.startsWith('route_44')) {
    return JOHTO_LANDMARKS.route_44;
  }

  // Ice Path
  if (clean.startsWith('ice_path')) {
    return JOHTO_LANDMARKS.ice_path;
  }

  // Dragon's Den & Shrine
  if (clean.startsWith('dragons_den') || clean.includes('dragon_shrine')) {
    return JOHTO_LANDMARKS.dragons_den;
  }

  // Blackthorn City, Move Deleter & Dark Cave East
  if (
    clean.startsWith('blackthorn') ||
    clean.includes('move_deleter') ||
    clean.includes('dark_cave_blackthorn')
  ) {
    return JOHTO_LANDMARKS.blackthorn_city;
  }

  // Route 45 & Route 46
  if (clean.startsWith('route_45')) return JOHTO_LANDMARKS.route_45;
  if (clean.startsWith('route_46')) return JOHTO_LANDMARKS.route_46;

  // Indigo Plateau, Victory Road, Tohjo Falls, Silver Cave, and League Chambers
  if (
    clean.startsWith('indigo_plateau') ||
    clean.startsWith('victory_road') ||
    clean.includes('wills_room') ||
    clean.includes('kogas_room') ||
    clean.includes('brunos_room') ||
    clean.includes('karens_room') ||
    clean.includes('lances_room') ||
    clean.includes('hall_of_fame') ||
    clean.startsWith('route_26') ||
    clean.startsWith('route_27') ||
    clean.startsWith('route_28') ||
    clean.startsWith('silver_cave') ||
    clean.includes('tohjo_falls')
  ) {
    return JOHTO_LANDMARKS.indigo_plateau;
  }

  // Routes generic prefix match (e.g., 'route_29_gate' -> 'route_29')
  const routeMatch = clean.match(/^route_([0-9]{2})/);
  if (routeMatch) {
    const routeKey = `route_${routeMatch[1]}`;
    if (JOHTO_LANDMARKS[routeKey]) {
      return JOHTO_LANDMARKS[routeKey];
    }
  }

  return null;
}

/**
 * Computes exact BFS hop distance between two Johto landmarks over JOHTO_CONNECTIONS.
 */
export function computeLandmarkDistance(fromId: string, toId: string): number | null {
  if (!fromId || !toId) return null;
  const start = resolveCurrentLandmark(fromId)?.id || fromId;
  const goal = resolveCurrentLandmark(toId)?.id || toId;
  if (start === goal) return 0;
  if (!JOHTO_LANDMARKS[start] || !JOHTO_LANDMARKS[goal]) return null;

  const adj: Record<string, string[]> = {};
  for (const conn of JOHTO_CONNECTIONS) {
    if (!adj[conn.from]) adj[conn.from] = [];
    if (!adj[conn.to]) adj[conn.to] = [];
    adj[conn.from].push(conn.to);
    adj[conn.to].push(conn.from);
  }

  const queue: Array<{ id: string; dist: number }> = [{ id: start, dist: 0 }];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    for (const next of adj[id] || []) {
      if (next === goal) return dist + 1;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, dist: dist + 1 });
      }
    }
  }

  return null;
}

/**
 * Finds all regional Johto landmarks where a given Pokémon species can be encountered in the wild.
 */
export function findHabitatsForSpecies(speciesId: string): TownMapLandmark[] {
  if (!speciesId) return [];
  const norm = speciesId
    .toLowerCase()
    .trim()
    .replace(/[- ]/g, '_');
  const compact = norm.replace(/_/g, '');

  // Roaming Legendary Beasts roam across Johto routes
  if (compact === 'raikou' || compact === 'entei' || compact === 'suicune') {
    const roamerRouteIds = [
      'burned_tower',
      'route_36',
      'route_37',
      'route_38',
      'route_39',
      'route_42',
      'route_31',
      'route_32',
      'route_29',
      'route_46',
    ];
    return roamerRouteIds.map((id) => JOHTO_LANDMARKS[id]).filter(Boolean);
  }

  const matches: TownMapLandmark[] = [];
  for (const lm of Object.values(JOHTO_LANDMARKS)) {
    if (!lm.wildSpecies || lm.wildSpecies.length === 0) continue;
    const found = lm.wildSpecies.some((w) => {
      const wNorm = w.toLowerCase().trim().replace(/[- ]/g, '_');
      const wCompact = wNorm.replace(/_/g, '');
      return wNorm === norm || wCompact === compact;
    });
    if (found) {
      matches.push(lm);
    }
  }
  return matches;
}

