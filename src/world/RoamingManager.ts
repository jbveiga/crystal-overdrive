import type { RoamerState } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';

export interface RouteAdjacency {
  [routeId: string]: string[];
}

export const JOHTO_ROUTE_GRAPH: RouteAdjacency = {
  new_bark_town: ['route_29'],
  route_29: ['new_bark_town', 'cherrygrove_city', 'route_46'],
  cherrygrove_city: ['route_29', 'route_30'],
  route_30: ['cherrygrove_city', 'route_31'],
  route_31: ['route_30', 'violet_city', 'route_46'],
  route_46: ['route_29', 'route_31'],
  violet_city: ['route_31', 'route_32', 'route_36'],
  route_32: ['violet_city', 'union_cave'],
  route_36: ['violet_city', 'route_35', 'route_37', 'national_park'],
  route_37: ['route_36', 'ecruteak_city'],
  ecruteak_city: ['route_37', 'route_38', 'route_42'],
  route_38: ['ecruteak_city', 'route_39'],
  route_39: ['route_38', 'olivine_city'],
  route_42: ['ecruteak_city', 'mahogany_town'],
};

export class RoamingManager {
  private roamers: Map<string, RoamerState> = new Map();
  private graph: RouteAdjacency;

  constructor(graph: RouteAdjacency = JOHTO_ROUTE_GRAPH) {
    this.graph = graph;
    this.initRoamers();
  }

  private initRoamers(): void {
    const beasts: Array<'raikou' | 'entei' | 'suicune'> = ['raikou', 'entei', 'suicune'];
    const startingRoutes = ['route_29', 'route_30', 'route_31'];

    beasts.forEach((speciesId, idx) => {
      const pokemon = PokemonFactory.create(speciesId, 40);
      this.roamers.set(speciesId, {
        speciesId,
        currentMapId: startingRoutes[idx % startingRoutes.length],
        pokemon,
        isAwakened: true, // Awakened for Vertical Slice
        isCaught: false,
        isDefeated: false,
      });
    });
  }

  public getRoamer(speciesId: 'raikou' | 'entei' | 'suicune'): RoamerState | undefined {
    return this.roamers.get(speciesId);
  }

  public getAllRoamers(): RoamerState[] {
    return Array.from(this.roamers.values());
  }

  public getActiveRoamers(): RoamerState[] {
    return this.getAllRoamers().filter((r) => r.isAwakened && !r.isCaught && !r.isDefeated);
  }

  public getActiveRoamerOnRoute(routeId: string): RoamerState | undefined {
    return this.getActiveRoamers().find((r) => r.currentMapId === routeId);
  }

  public markCaught(speciesId: string): void {
    const roamer = this.roamers.get(speciesId);
    if (roamer) {
      roamer.isCaught = true;
    }
  }

  public markDefeated(speciesId: string): void {
    const roamer = this.roamers.get(speciesId);
    if (roamer) {
      roamer.isDefeated = true;
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
   * - 65% Standard Roam (random adjacent node)
   * - 25% Player Gravity (1 BFS step toward player)
   * - 10% Direct Converge (onto player's route or direct neighbor)
   */
  public onPlayerRouteChange(
    playerCurrentRoute: string,
    rng: () => number = Math.random
  ): void {
    const activeRoamers = this.getActiveRoamers();

    for (const roamer of activeRoamers) {
      const currentRoute = roamer.currentMapId;
      const neighbors = this.graph[currentRoute] || [];
      if (neighbors.length === 0) continue;

      const roll = rng();

      if (roll < 0.65) {
        // 1. Standard Roam (65%)
        const nextRoute = neighbors[Math.floor(rng() * neighbors.length)];
        roamer.currentMapId = nextRoute;
      } else if (roll < 0.9) {
        // 2. Player Gravity (25% - 1 BFS step toward player)
        const path = this.findShortestPath(currentRoute, playerCurrentRoute);
        if (path && path.length > 1) {
          roamer.currentMapId = path[1];
        } else {
          roamer.currentMapId = neighbors[Math.floor(rng() * neighbors.length)];
        }
      } else {
        // 3. Direct Converge (10% - jumps directly onto player route or adjacent)
        if (this.graph[playerCurrentRoute]) {
          const playerNeighbors = this.graph[playerCurrentRoute];
          const pool = [playerCurrentRoute, ...playerNeighbors];
          roamer.currentMapId = pool[Math.floor(rng() * pool.length)];
        } else {
          roamer.currentMapId = playerCurrentRoute;
        }
      }
    }
  }
}
