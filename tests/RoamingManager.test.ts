import { describe, it, expect } from 'vitest';
import { RoamingManager } from '../src/world/RoamingManager';

describe('RoamingManager', () => {
  it('initializes Raikou and Entei (Lv. 40) dormant in Burned Tower by default until awakened in the story (Suicune does not roam randomly in Crystal)', () => {
    const rm = new RoamingManager();
    const roamers = rm.getAllRoamers();

    expect(roamers.length).toBe(2);
    expect(roamers.map((r) => r.speciesId).sort()).toEqual(['entei', 'raikou']);
    expect(roamers.every((r) => r.pokemon.level === 40)).toBe(true);
    expect(rm.getRoamer('suicune')).toBeUndefined();
    expect(roamers.every((r) => !r.isAwakened && r.currentMapId === 'burned_tower')).toBe(true);
    expect(rm.getActiveRoamers().length).toBe(0);
    expect(rm.getActiveRoamerOnRoute('route_29')).toBeUndefined();

    // Trigger Burned Tower story awakening
    rm.awakenBeasts();
    expect(rm.areBeastsAwakened()).toBe(true);
    expect(roamers.every((r) => r.isAwakened && RoamingManager.isJohtoGrassRoute(r.currentMapId))).toBe(true);
  });

  it('computes shortest BFS path across Johto routes correctly', () => {
    const rm = new RoamingManager();

    // From new_bark_town to cherrygrove_city: new_bark_town -> route_29 -> cherrygrove_city
    const path = rm.findShortestPath('new_bark_town', 'cherrygrove_city');
    expect(path).toEqual(['new_bark_town', 'route_29', 'cherrygrove_city']);
  });

  it('moves awakened beasts towards player using player gravity (25% roll)', () => {
    const rm = new RoamingManager();
    rm.awakenBeasts();
    const raikou = rm.getRoamer('raikou')!;
    raikou.currentMapId = 'cherrygrove_city';

    // Player moves to new_bark_town
    // Force roll = 0.75 (within 0.65 <= roll < 0.90 gravity band)
    rm.onPlayerRouteChange('new_bark_town', () => 0.75);

    // Shortest path from cherrygrove_city to new_bark_town is [cherrygrove_city, route_29, new_bark_town]
    // 1 step along the path is route_29
    expect(raikou.currentMapId).toBe('route_29');
  });

  it('detects active roamer on a specific route only after awakening', () => {
    const rm = new RoamingManager();
    rm.awakenBeasts();
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

