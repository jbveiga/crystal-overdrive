import { describe, it, expect } from 'vitest';
import { RoamingManager } from '../src/world/RoamingManager';

describe('RoamingManager', () => {
  it('initializes the three Legendary Beasts (Raikou, Entei, Suicune)', () => {
    const rm = new RoamingManager();
    const roamers = rm.getAllRoamers();

    expect(roamers.length).toBe(3);
    expect(roamers.map((r) => r.speciesId).sort()).toEqual(['entei', 'raikou', 'suicune']);
    expect(roamers.every((r) => r.isAwakened && !r.isCaught)).toBe(true);
  });

  it('computes shortest BFS path across Johto routes correctly', () => {
    const rm = new RoamingManager();

    // From new_bark_town to cherrygrove_city: new_bark_town -> route_29 -> cherrygrove_city
    const path = rm.findShortestPath('new_bark_town', 'cherrygrove_city');
    expect(path).toEqual(['new_bark_town', 'route_29', 'cherrygrove_city']);
  });

  it('moves beasts towards player using player gravity (25% roll)', () => {
    const rm = new RoamingManager();
    const raikou = rm.getRoamer('raikou')!;
    raikou.currentMapId = 'cherrygrove_city';

    // Player moves to new_bark_town
    // Force roll = 0.75 (within 0.65 <= roll < 0.90 gravity band)
    rm.onPlayerRouteChange('new_bark_town', () => 0.75);

    // Shortest path from cherrygrove_city to new_bark_town is [cherrygrove_city, route_29, new_bark_town]
    // 1 step along the path is route_29
    expect(raikou.currentMapId).toBe('route_29');
  });

  it('detects active roamer on a specific route', () => {
    const rm = new RoamingManager();
    const raikou = rm.getRoamer('raikou')!;
    raikou.currentMapId = 'route_29';

    const detected = rm.getActiveRoamerOnRoute('route_29');
    expect(detected).toBeDefined();
    expect(detected?.speciesId).toBe('raikou');

    // Mark as caught
    rm.markCaught('raikou');
    expect(rm.getActiveRoamerOnRoute('route_29')).toBeUndefined();
  });
});
