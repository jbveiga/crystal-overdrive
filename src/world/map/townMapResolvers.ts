/**
 * @fileoverview townMapResolvers domain module implementation.
 * @module world/map/townMapResolvers
 * @role townMapResolvers Component
 * @exports resolveCurrentLandmark, computeLandmarkDistance, findHabitatsForSpecies
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-172: Implementation | L173-345: Handlers & Exports
 */

/**
 * Town Map Resolvers & Distance/Habitat Algorithms.
 * Pure TypeScript logic extracted from townMapData.ts.
 */
import { TownMapLandmark, JOHTO_LANDMARKS, JOHTO_CONNECTIONS } from '../townMapData';

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

