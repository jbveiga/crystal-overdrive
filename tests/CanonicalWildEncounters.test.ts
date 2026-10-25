import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { MapManager } from '../src/world/MapManager';
import type { MapData } from '../src/types/game';

function loadMap(mapId: string): MapData {
  const filePath = path.resolve(__dirname, `../public/assets/data/maps/${mapId}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MapData;
}

describe('Canonical Pokémon Crystal Wild Encounters & Original Nidoran Naming', () => {
  it('1. instantiates Nidoran-M and Nidoran-F with authentic original game names NIDORAN♂ and NIDORAN♀', () => {
    const nidoM = PokemonFactory.create('nidoran-m', 12);
    const nidoF = PokemonFactory.create('nidoran-f', 12);

    expect(nidoM.nickname).toBe('NIDORAN♂');
    expect(nidoF.nickname).toBe('NIDORAN♀');

    expect(PokemonFactory.formatSpeciesName('nidoran-m')).toBe('NIDORAN♂');
    expect(PokemonFactory.formatSpeciesName('nidoranm')).toBe('NIDORAN♂');
    expect(PokemonFactory.formatSpeciesName('nidoran-f')).toBe('NIDORAN♀');
    expect(PokemonFactory.formatSpeciesName('nidoranf')).toBe('NIDORAN♀');
  });

  it('2. configures Route 29 with early-game canonical levels (Lv. 2–3) and time-of-day slots', () => {
    const r29 = loadMap('route_29');
    expect(r29.grassEncounters.length).toBe(21); // 7 morning + 7 day + 7 night

    const levels = r29.grassEncounters.map((s) => s.minLevel);
    expect(Math.min(...levels)).toBe(2);
    expect(Math.max(...levels)).toBe(3);

    const morningSpecies = r29.grassEncounters
      .filter((s) => s.timeOfDay === 'MORNING')
      .map((s) => s.speciesId);
    expect(morningSpecies).toContain('pidgey');
    expect(morningSpecies).toContain('sentret');
    expect(morningSpecies).toContain('hoppip');

    const nightSpecies = r29.grassEncounters
      .filter((s) => s.timeOfDay === 'NIGHT')
      .map((s) => s.speciesId);
    expect(nightSpecies).toContain('hoothoot');
    expect(nightSpecies).toContain('rattata');
  });

  it('3. progresses wild encounter levels authentically from Route 29 through Route 45 and Mt. Silver', () => {
    const r30 = loadMap('route_30');
    const r34 = loadMap('route_34');
    const r38 = loadMap('route_38');
    const r44 = loadMap('route_44');
    const r45 = loadMap('route_45');
    const silverOutside = loadMap('silver_cave_outside');
    const silverRoom3 = loadMap('silver_cave_room_3');

    const maxLevel = (m: MapData) => Math.max(...m.grassEncounters.map((s) => s.maxLevel));

    expect(maxLevel(r30)).toBeLessThanOrEqual(5);
    expect(maxLevel(r34)).toBeGreaterThanOrEqual(10);
    expect(maxLevel(r38)).toBeGreaterThanOrEqual(16);
    expect(maxLevel(r44)).toBeGreaterThanOrEqual(24);
    expect(maxLevel(r45)).toBeGreaterThanOrEqual(27);
    expect(maxLevel(silverOutside)).toBeGreaterThanOrEqual(41);
    expect(maxLevel(silverRoom3)).toBeGreaterThanOrEqual(48);
  });

  it('4. populates canonical water surfing encounters for coastal and lake maps', () => {
    const r40 = loadMap('route_40');
    const lake = loadMap('lake_of_rage');
    const dragonsDen = loadMap('dragons_den_b1f');

    expect(r40.waterEncounters?.length).toBe(3);
    expect(r40.waterEncounters?.map((s) => s.speciesId)).toContain('tentacool');
    expect(r40.waterEncounters?.map((s) => s.speciesId)).toContain('tentacruel');

    expect(lake.waterEncounters?.length).toBe(3);
    expect(lake.waterEncounters?.map((s) => s.speciesId)).toContain('magikarp');
    expect(lake.waterEncounters?.map((s) => s.speciesId)).toContain('gyarados');

    expect(dragonsDen.waterEncounters?.length).toBe(3);
    expect(dragonsDen.waterEncounters?.map((s) => s.speciesId)).toContain('magikarp');
    expect(dragonsDen.waterEncounters?.map((s) => s.speciesId)).toContain('dratini');
  });

  it('5. MapManager.rollWildEncounter rolls waterEncounters when stepping on water (tileType 3)', () => {
    const r40 = loadMap('route_40');
    const mm = new MapManager();
    mm.registerMap(r40);
    mm.setCurrentMap('route_40');

    const enc = mm.rollWildEncounter(3, undefined, () => 0.01, 'DAY');
    expect(enc).not.toBeNull();
    expect(['tentacool', 'tentacruel']).toContain(enc?.speciesId);
  });
});
