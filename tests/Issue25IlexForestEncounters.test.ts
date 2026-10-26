import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MapManager } from '../src/world/MapManager';
import type { MapData } from '../src/types/game';

describe('GitHub Issue #25: Ilex Forest (3, 33) Wild Pokémon Encounters', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const loadMap = (id: string): MapData =>
    JSON.parse(fs.readFileSync(path.join(mapsDir, `${id}.json`), 'utf8')) as MapData;

  it('recognizes ilex_forest and dungeon/tower interiors as eligible for floor (tileType 0) wild encounters', () => {
    expect(MapManager.isDungeonOrCaveMap('ilex_forest')).toBe(true);
    expect(MapManager.canTriggerWildEncounter('ilex_forest', 0)).toBe(true);
    expect(MapManager.canTriggerWildEncounter('ilex_forest', 3)).toBe(true);

    // Other towers and caves also trigger on floor (0)
    expect(MapManager.canTriggerWildEncounter('sprout_tower_3f', 0)).toBe(true);
    expect(MapManager.canTriggerWildEncounter('burned_tower_b1f', 0)).toBe(true);
    expect(MapManager.canTriggerWildEncounter('tin_tower_3f', 0)).toBe(true);
    expect(MapManager.canTriggerWildEncounter('mount_mortar_1f_inside', 0)).toBe(true);
    expect(MapManager.canTriggerWildEncounter('union_cave_1f', 0)).toBe(true);

    // Standard outdoor towns and routes do NOT trigger encounters on normal floor (0), only on tall grass (2) or water (3)
    expect(MapManager.canTriggerWildEncounter('new_bark_town', 0)).toBe(false);
    expect(MapManager.canTriggerWildEncounter('route_29', 0)).toBe(false);
    expect(MapManager.canTriggerWildEncounter('route_29', 2)).toBe(true);
    expect(MapManager.canTriggerWildEncounter('route_29', 3)).toBe(true);
  });

  it('rolls authentic Morning, Day, and Night wild encounters at ilex_forest (3, 33)', () => {
    const ilexForest = loadMap('ilex_forest');
    const mapManager = new MapManager();
    mapManager.registerMap(ilexForest);
    mapManager.setCurrentMap('ilex_forest');

    // Coordinate (3, 33) in ilex_forest is walkable forest floor (tileType 0)
    const tileType = mapManager.getTileType(3, 33);
    expect(tileType).toBe(0);
    expect(MapManager.canTriggerWildEncounter('ilex_forest', tileType)).toBe(true);

    // Roll Morning encounter (rng = 0.01 triggers encounter)
    const morningEncounter = mapManager.rollWildEncounter(tileType, undefined, () => 0.01, 'MORNING');
    expect(morningEncounter).not.toBeNull();
    expect(['caterpie', 'weedle', 'metapod', 'kakuna', 'pidgey', 'paras']).toContain(
      morningEncounter?.speciesId
    );

    // Roll Night encounter
    const nightEncounter = mapManager.rollWildEncounter(tileType, undefined, () => 0.01, 'NIGHT');
    expect(nightEncounter).not.toBeNull();
    expect(['oddish', 'venonat', 'psyduck', 'hoothoot', 'paras']).toContain(
      nightEncounter?.speciesId
    );

    // Roll Water encounter on Ilex Forest pond (tileType 3)
    const pondEncounter = mapManager.rollWildEncounter(3, undefined, () => 0.01, 'DAY');
    expect(pondEncounter).not.toBeNull();
    expect(['psyduck', 'golduck']).toContain(pondEncounter?.speciesId);
  });
});
