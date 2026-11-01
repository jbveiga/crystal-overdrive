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

  if (clean.startsWith('new_bark') || clean.startsWith('elms_lab') || clean.startsWith('players_house') || clean.includes('elms_house') || clean.includes('players_neighbor')) return JOHTO_LANDMARKS.new_bark_town;
  if (clean.startsWith('cherrygrove') || clean.includes('guide_gent')) return JOHTO_LANDMARKS.cherrygrove_city;
  if (clean.startsWith('route_30') || clean.includes('mr_pokemon')) return JOHTO_LANDMARKS.route_30;
  if (clean.startsWith('dark_cave') || clean.includes('dark_cave')) return JOHTO_LANDMARKS.dark_cave;
  if (clean.startsWith('route_31')) return JOHTO_LANDMARKS.route_31;
  if (clean.startsWith('sprout_tower')) return JOHTO_LANDMARKS.sprout_tower;
  if (clean.startsWith('violet') || clean.includes('earls_pokemon_academy')) return JOHTO_LANDMARKS.violet_city;
  if (clean.startsWith('ruins_of_alph')) return JOHTO_LANDMARKS.ruins_of_alph;
  if (clean.startsWith('route_32')) return JOHTO_LANDMARKS.route_32;
  if (clean.startsWith('union_cave')) return JOHTO_LANDMARKS.union_cave;
  if (clean.startsWith('route_33')) return JOHTO_LANDMARKS.route_33;
  if (clean.startsWith('slowpoke_well')) return JOHTO_LANDMARKS.slowpoke_well;
  if (clean.startsWith('azalea') || clean.includes('kurts_house') || clean.includes('charcoal_kiln')) return JOHTO_LANDMARKS.azalea_town;
  if (clean.startsWith('ilex_forest')) return JOHTO_LANDMARKS.ilex_forest;
  if (clean.startsWith('route_34') || clean.includes('day_care')) return JOHTO_LANDMARKS.route_34;
  if (clean.startsWith('goldenrod') || clean.startsWith('radio_tower')) return JOHTO_LANDMARKS.goldenrod_city;
  if (clean.startsWith('route_35')) return JOHTO_LANDMARKS.route_35;
  if (clean.startsWith('national_park')) return JOHTO_LANDMARKS.national_park;
  if (clean.startsWith('route_36')) return JOHTO_LANDMARKS.route_36;
  if (clean.startsWith('route_37')) return JOHTO_LANDMARKS.route_37;
  if (clean.startsWith('burned_tower')) return JOHTO_LANDMARKS.burned_tower;
  if (clean.startsWith('tin_tower') || clean.includes('bellchime') || clean.includes('wise_trio')) return JOHTO_LANDMARKS.tin_tower;
  if (clean.startsWith('ecruteak') || clean.includes('dance_theat')) return JOHTO_LANDMARKS.ecruteak_city;
  if (clean.startsWith('route_38')) return JOHTO_LANDMARKS.route_38;
  if (clean.startsWith('route_39')) return JOHTO_LANDMARKS.route_39;
  if (clean.startsWith('olivine') || clean.includes('lighthouse')) return JOHTO_LANDMARKS.olivine_city;
  if (clean.startsWith('route_40') || clean.startsWith('battle_tower')) return JOHTO_LANDMARKS.route_40;
  if (clean.startsWith('whirl_island')) return JOHTO_LANDMARKS.whirl_islands;
  if (clean.startsWith('route_41')) return JOHTO_LANDMARKS.route_41;
  if (clean.startsWith('cianwood') || clean.includes('poke_seer') || clean.includes('cliff_cave') || clean.includes('cliff_edge')) return JOHTO_LANDMARKS.cianwood_city;
  if (clean.startsWith('mount_mortar') || clean.startsWith('mt_mortar')) return JOHTO_LANDMARKS.mount_mortar;
  if (clean.startsWith('route_42')) return JOHTO_LANDMARKS.route_42;
  if (clean.startsWith('mahogany') || clean.includes('team_rocket_base') || clean.includes('rocket_hideout')) return JOHTO_LANDMARKS.mahogany_town;
  if (clean.startsWith('route_43')) return JOHTO_LANDMARKS.route_43;
  if (clean.startsWith('lake_of_rage')) return JOHTO_LANDMARKS.lake_of_rage;
  if (clean.startsWith('route_44')) return JOHTO_LANDMARKS.route_44;
  if (clean.startsWith('ice_path')) return JOHTO_LANDMARKS.ice_path;
  if (clean.startsWith('dragons_den') || clean.includes('dragon_shrine')) return JOHTO_LANDMARKS.dragons_den;
  if (clean.startsWith('blackthorn') || clean.includes('move_deleter')) return JOHTO_LANDMARKS.blackthorn_city;
  if (clean.startsWith('route_45')) return JOHTO_LANDMARKS.route_45;
  if (clean.startsWith('route_46')) return JOHTO_LANDMARKS.route_46;
  if (clean.includes('tohjo_falls')) return JOHTO_LANDMARKS.tohjo_falls;
  if (clean.startsWith('route_27')) return JOHTO_LANDMARKS.route_27;
  if (clean.startsWith('route_26')) return JOHTO_LANDMARKS.route_26;
  if (clean.startsWith('victory_road')) return JOHTO_LANDMARKS.victory_road;
  if (
    clean.startsWith('indigo_plateau') ||
    clean === 'route_23' ||
    clean.includes('wills_room') ||
    clean.includes('kogas_room') ||
    clean.includes('brunos_room') ||
    clean.includes('karens_room') ||
    clean.includes('lances_room') ||
    clean.includes('hall_of_fame') ||
    clean.startsWith('route_28') ||
    clean.startsWith('silver_cave')
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

export interface FlyDestination {
  mapId: string;
  x: number;
  y: number;
  pokecenterMapId: string;
  pokecenterX: number;
  pokecenterY: number;
}

export const FLY_LANDING_COORDS: Record<string, FlyDestination> = {
  new_bark_town: {
    mapId: 'new_bark_town',
    x: 6,
    y: 4,
    pokecenterMapId: 'new_bark_town',
    pokecenterX: 13,
    pokecenterY: 6,
  },
  cherrygrove_city: {
    mapId: 'cherrygrove_city',
    x: 29,
    y: 4,
    pokecenterMapId: 'cherrygrove_poke_center',
    pokecenterX: 3,
    pokecenterY: 5,
  },
  violet_city: {
    mapId: 'violet_city',
    x: 31,
    y: 26,
    pokecenterMapId: 'violet_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  azalea_town: {
    mapId: 'azalea_town',
    x: 15,
    y: 10,
    pokecenterMapId: 'azalea_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  goldenrod_city: {
    mapId: 'goldenrod_city',
    x: 15,
    y: 28,
    pokecenterMapId: 'goldenrod_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  ecruteak_city: {
    mapId: 'ecruteak_city',
    x: 23,
    y: 28,
    pokecenterMapId: 'ecruteak_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  olivine_city: {
    mapId: 'olivine_city',
    x: 13,
    y: 22,
    pokecenterMapId: 'olivine_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  cianwood_city: {
    mapId: 'cianwood_city',
    x: 23,
    y: 44,
    pokecenterMapId: 'cianwood_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  mahogany_town: {
    mapId: 'mahogany_town',
    x: 15,
    y: 14,
    pokecenterMapId: 'mahogany_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  blackthorn_city: {
    mapId: 'blackthorn_city',
    x: 21,
    y: 30,
    pokecenterMapId: 'blackthorn_poke_center',
    pokecenterX: 3,
    pokecenterY: 6,
  },
  indigo_plateau: {
    mapId: 'indigo_plateau_poke_center',
    x: 5,
    y: 12,
    pokecenterMapId: 'indigo_plateau_poke_center',
    pokecenterX: 5,
    pokecenterY: 12,
  },
};

export function resolveFlyDestination(landmarkId: string): FlyDestination | null {
  if (!landmarkId) return null;
  const resolvedLm = resolveCurrentLandmark(landmarkId);
  const key = resolvedLm?.id || landmarkId.toLowerCase().trim();
  return FLY_LANDING_COORDS[key] || null;
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

