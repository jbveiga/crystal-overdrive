/**
 * @fileoverview Manages Pokémon Crystal roaming beasts (Raikou & Entei at Lv. 40) across Johto grass routes.
 * @module world/RoamingManager
 * @role Roaming Legendary Beasts State Machine
 * @exports RouteAdjacency, JOHTO_GRASS_ROUTES, JOHTO_ROUTE_GRAPH, RoamingManager
 * @layer world
 * @sections L1-10: Micro-Header & Imports | L11-45: Route Graph | L46-185: RoamingManager Class
 */

import type { RoamerState } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';

export interface RouteAdjacency {
  [routeId: string]: string[];
}

export const JOHTO_GRASS_ROUTES: ReadonlySet<string> = new Set([
  'route_29', 'route_30', 'route_31', 'route_32', 'route_33', 'route_34', 'route_35', 'route_36',
  'route_37', 'route_38', 'route_39', 'route_42', 'route_43', 'route_44', 'route_45', 'route_46',
]);

export const JOHTO_ROUTE_GRAPH: RouteAdjacency = {
  new_bark_town: ['route_29'],
  route_29: ['new_bark_town', 'cherrygrove_city', 'route_46'],
  cherrygrove_city: ['route_29', 'route_30'],
  route_30: ['cherrygrove_city', 'route_31'],
  route_31: ['route_30', 'violet_city', 'route_32', 'route_36', 'route_46'],
  route_46: ['route_29', 'route_31', 'route_45'],
  violet_city: ['route_31', 'route_32', 'route_36'],
  route_32: ['violet_city', 'route_31', 'route_33'],
  route_33: ['route_32', 'azalea_town', 'route_34'],
  azalea_town: ['route_33', 'route_34'],
  route_34: ['azalea_town', 'route_33', 'goldenrod_city', 'route_35'],
  goldenrod_city: ['route_34', 'route_35'],
  route_35: ['goldenrod_city', 'route_34', 'route_36'],
  route_36: ['violet_city', 'route_31', 'route_35', 'route_37'],
  route_37: ['route_36', 'ecruteak_city', 'route_38', 'route_42'],
  ecruteak_city: ['route_37', 'route_38', 'route_42'],
  route_38: ['ecruteak_city', 'route_37', 'route_39'],
  route_39: ['route_38', 'olivine_city'],
  olivine_city: ['route_39'],
  route_42: ['ecruteak_city', 'route_37', 'mahogany_town', 'route_43', 'route_44'],
  mahogany_town: ['route_42', 'route_43', 'route_44'],
  route_43: ['mahogany_town', 'route_42', 'route_44'],
  route_44: ['mahogany_town', 'route_42', 'route_43', 'blackthorn_city', 'route_45'],
  blackthorn_city: ['route_44', 'route_45'],
  route_45: ['blackthorn_city', 'route_44', 'route_46'],
};

export class RoamingManager {
  private roamers: Map<string, RoamerState> = new Map();
  private graph: RouteAdjacency;

  constructor(graph: RouteAdjacency = JOHTO_ROUTE_GRAPH, initiallyAwakened: boolean = false) {
    this.graph = graph;
    this.initRoamers(initiallyAwakened);
  }

  public static isJohtoGrassRoute(mapId: string): boolean {
    return JOHTO_GRASS_ROUTES.has(mapId);
  }

  private isAllowedRoamNode(mapId: string): boolean {
    if (this.graph === JOHTO_ROUTE_GRAPH) {
      return JOHTO_GRASS_ROUTES.has(mapId);
    }
    return Boolean(this.graph[mapId]);
  }

  private getGrassNeighbors(routeId: string): string[] {
    const direct = (this.graph[routeId] || []).filter((n) => this.isAllowedRoamNode(n));
    if (direct.length > 0) return direct;
    // Traverse 2-hop neighbors through connecting towns if needed
    const twoHop = new Set<string>();
    for (const mid of this.graph[routeId] || []) {
      for (const next of this.graph[mid] || []) {
        if (next !== routeId && this.isAllowedRoamNode(next)) {
          twoHop.add(next);
        }
      }
    }
    return Array.from(twoHop);
  }

  /**
   * In Pokémon Crystal, only Raikou and Entei roam randomly across Johto's grass routes at Level 40.
   * Suicune does not roam randomly in Crystal; it follows a scripted storyline (Burned Tower -> Cianwood -> Route 42 -> Tin Tower).
   */
  private initRoamers(initiallyAwakened: boolean): void {
    const beasts: Array<'raikou' | 'entei'> = ['raikou', 'entei'];
    const startingRoutes = ['route_37', 'route_38'];

    beasts.forEach((speciesId, idx) => {
      const pokemon = PokemonFactory.create(speciesId, 40);
      this.roamers.set(speciesId, {
        speciesId,
        currentMapId: initiallyAwakened ? startingRoutes[idx % startingRoutes.length] : 'burned_tower',
        pokemon,
        isAwakened: initiallyAwakened,
        isCaught: false,
        isDefeated: false,
      });
    });
  }

  /**
   * Awakens Raikou and Entei during the Burned Tower B1F story event (after defeating Rival Silver on 1F)
   * and scatters them onto Johto's grass routes at Level 40.
   */
  public awakenBeasts(): void {
    const scatterRoutes = ['route_37', 'route_38'];
    let idx = 0;
    for (const roamer of this.roamers.values()) {
      roamer.isAwakened = true;
      if (roamer.pokemon && roamer.pokemon.currentHp <= 0 && !roamer.isCaught) {
        roamer.isDefeated = true;
      }
      if (roamer.isCaught || roamer.isDefeated) {
        roamer.currentMapId = '';
        idx++;
        continue;
      }
      if (roamer.currentMapId === 'burned_tower' || !this.isAllowedRoamNode(roamer.currentMapId)) {
        roamer.currentMapId = scatterRoutes[idx % scatterRoutes.length];
      }
      idx++;
    }
  }

  /**
   * Restores saved roamer states and reconciles party/PC/Pokedex/storyFlags so caught or fainted
   * roaming legendaries never roam again across save reloads.
   */
  public hydrateRoamers(
    savedRoamers?: RoamerState[],
    opts?: {
      caughtSpecies?: Iterable<string>;
      ownedSpecies?: Iterable<string>;
      storyFlags?: Iterable<string>;
    }
  ): void {
    if (Array.isArray(savedRoamers)) {
      for (const saved of savedRoamers) {
        if (!saved || !saved.speciesId) continue;
        const key = saved.speciesId.toLowerCase();
        const existing = this.roamers.get(key);
        if (!existing) continue;
        if (saved.pokemon && typeof saved.pokemon === 'object') {
          existing.pokemon = saved.pokemon;
        }
        existing.isAwakened = Boolean(saved.isAwakened);
        existing.isCaught = Boolean(saved.isCaught);
        existing.isDefeated =
          Boolean(saved.isDefeated) ||
          (!existing.isCaught && typeof existing.pokemon?.currentHp === 'number' && existing.pokemon.currentHp <= 0);
        if (existing.isCaught || existing.isDefeated) {
          existing.currentMapId = '';
        } else if (saved.currentMapId) {
          existing.currentMapId = saved.currentMapId;
        }
      }
    }

    const caughtSet = new Set(Array.from(opts?.caughtSpecies || [], (s) => s.toLowerCase()));
    const ownedSet = new Set(Array.from(opts?.ownedSpecies || [], (s) => s.toLowerCase()));
    const flagSet = new Set(Array.from(opts?.storyFlags || []));

    for (const [speciesId, roamer] of this.roamers.entries()) {
      const upper = speciesId.toUpperCase();
      if (
        caughtSet.has(speciesId) ||
        ownedSet.has(speciesId) ||
        flagSet.has(`caught_${speciesId}`) ||
        flagSet.has(`${speciesId}_caught`) ||
        flagSet.has(`EVENT_CAUGHT_${upper}`)
      ) {
        this.markCaught(speciesId);
      } else if (
        flagSet.has(`${speciesId}_defeated`) ||
        flagSet.has(`defeated_${speciesId}`) ||
        flagSet.has(`${speciesId}_fainted`) ||
        flagSet.has(`${speciesId}_caught_or_defeated`) ||
        flagSet.has(`EVENT_FOUGHT_${upper}`) ||
        flagSet.has(`EVENT_DEFEATED_${upper}`)
      ) {
        this.markDefeated(speciesId);
      }
    }
  }

  /**
   * Keeps Raikou and Entei dormant in Ecruteak's Burned Tower prior to the story event.
   */
  public sleepBeasts(): void {
    for (const roamer of this.roamers.values()) {
      roamer.isAwakened = false;
      if (!roamer.isCaught && !roamer.isDefeated) {
        roamer.currentMapId = 'burned_tower';
      }
    }
  }

  public areBeastsAwakened(): boolean {
    return this.getAllRoamers().some((r) => r.isAwakened);
  }

  public getRoamer(speciesId: 'raikou' | 'entei' | 'suicune'): RoamerState | undefined {
    return this.roamers.get(speciesId);
  }

  public getAllRoamers(): RoamerState[] {
    return Array.from(this.roamers.values());
  }

  public getActiveRoamers(): RoamerState[] {
    return this.getAllRoamers().filter(
      (r) => r.isAwakened && !r.isCaught && !r.isDefeated && (r.pokemon?.currentHp ?? 1) > 0
    );
  }

  public getActiveRoamerOnRoute(routeId: string): RoamerState | undefined {
    if (!this.isAllowedRoamNode(routeId)) return undefined;
    return this.getActiveRoamers().find((r) => r.currentMapId === routeId);
  }

  public markCaught(speciesId: string): void {
    const roamer = this.roamers.get(speciesId.toLowerCase());
    if (roamer) {
      roamer.isCaught = true;
      roamer.currentMapId = '';
    }
  }

  public markDefeated(speciesId: string): void {
    const roamer = this.roamers.get(speciesId.toLowerCase());
    if (roamer) {
      roamer.isDefeated = true;
      if (roamer.pokemon) {
        roamer.pokemon.currentHp = 0;
      }
      roamer.currentMapId = '';
    }
  }

  /**
   * Finds the shortest path in the route graph using Breadth-First Search (BFS)
   */
  public findShortestPath(startRoute: string, targetRoute: string): string[] | null {
    if (startRoute === targetRoute) return [startRoute];
    if (!this.graph[startRoute] || !this.graph[targetRoute]) return null;

    const queue: Array<{ route: string; path: string[] }> = [{ route: startRoute, path: [startRoute] }];
    const visited = new Set<string>([startRoute]);

    while (queue.length > 0) {
      const { route, path } = queue.shift()!;
      const neighbors = this.graph[route] || [];

      for (const neighbor of neighbors) {
        if (neighbor === targetRoute) {
          return [...path, neighbor];
        }
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ route: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }

  /**
   * Executes Markov route transition roll on player map border cross:
   * - 65% Standard Roam (random adjacent grass route)
   * - 25% Player Gravity (1 BFS step toward player along grass routes)
   * - 10% Direct Converge (onto player's grass route or adjacent grass route)
   */
  public onPlayerRouteChange(
    playerCurrentRoute: string,
    rng: () => number = Math.random
  ): void {
    const activeRoamers = this.getActiveRoamers();

    for (const roamer of activeRoamers) {
      const currentRoute = roamer.currentMapId;
      const grassNeighbors = this.getGrassNeighbors(currentRoute);
      if (grassNeighbors.length === 0) continue;

      const roll = rng();

      if (roll < 0.65) {
        // 1. Standard Roam (65%)
        roamer.currentMapId = grassNeighbors[Math.floor(rng() * grassNeighbors.length)];
      } else if (roll < 0.9) {
        // 2. Player Gravity (25% - 1 BFS step toward player)
        const path = this.findShortestPath(currentRoute, playerCurrentRoute);
        const nextGrassStep = path?.slice(1).find((node) => this.isAllowedRoamNode(node));
        if (nextGrassStep) {
          roamer.currentMapId = nextGrassStep;
        } else {
          roamer.currentMapId = grassNeighbors[Math.floor(rng() * grassNeighbors.length)];
        }
      } else {
        // 3. Direct Converge (10% - jumps onto player grass route or adjacent grass route; never into indoor/town maps)
        const playerGrassNeighbors = this.getGrassNeighbors(playerCurrentRoute);
        const pool = [
          ...(this.isAllowedRoamNode(playerCurrentRoute) ? [playerCurrentRoute] : []),
          ...playerGrassNeighbors,
        ];
        if (pool.length > 0) {
          roamer.currentMapId = pool[Math.floor(rng() * pool.length)];
        } else {
          roamer.currentMapId = grassNeighbors[Math.floor(rng() * grassNeighbors.length)];
        }
      }
    }
  }
}
