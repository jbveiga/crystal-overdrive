import { describe, it, expect } from 'vitest';
import {
  INFINITE_TMS,
  normalizeTmId,
  deduplicateAndSortTms,
} from '../../src/ui/bag/BagItemCatalogs';
import { isCaveMap, isDungeonOrCaveMap } from '../../src/world/map/MapClassificationAndWarpRules';
import darkCaveViolet from '../../public/assets/data/maps/dark_cave_violet_entrance.json';
import darkCaveBlackthorn from '../../public/assets/data/maps/dark_cave_blackthorn_entrance.json';
import route31 from '../../public/assets/data/maps/route_31.json';
import route46 from '../../public/assets/data/maps/route_46.json';
import route45 from '../../public/assets/data/maps/route_45.json';
import ruinsOutside from '../../public/assets/data/maps/ruins_of_alph_outside.json';
import kabutoChamber from '../../public/assets/data/maps/ruins_of_alph_kabuto_chamber.json';
import omanyteChamber from '../../public/assets/data/maps/ruins_of_alph_omanyte_chamber.json';
import aerodactylChamber from '../../public/assets/data/maps/ruins_of_alph_aerodactyl_chamber.json';
import hoOhChamber from '../../public/assets/data/maps/ruins_of_alph_ho_oh_chamber.json';
import lighthouse1f from '../../public/assets/data/maps/olivine_lighthouse_1f.json';
import lighthouse2f from '../../public/assets/data/maps/olivine_lighthouse_2f.json';
import lighthouse3f from '../../public/assets/data/maps/olivine_lighthouse_3f.json';
import lighthouse4f from '../../public/assets/data/maps/olivine_lighthouse_4f.json';
import lighthouse5f from '../../public/assets/data/maps/olivine_lighthouse_5f.json';
import lighthouse6f from '../../public/assets/data/maps/olivine_lighthouse_6f.json';

describe('Bag TM/HM Deduplication and Alphanumeric Ordering', () => {
  it('defines all 57 canonical Gen 2 TMs/HMs in INFINITE_TMS', () => {
    // 7 HMs
    for (let i = 1; i <= 7; i++) {
      const hmId = `HM0${i}`;
      expect(INFINITE_TMS[hmId], `Missing ${hmId}`).toBeDefined();
      expect(INFINITE_TMS[hmId].id).toBe(hmId);
    }
    // 50 TMs
    for (let i = 1; i <= 50; i++) {
      const tmId = `TM${i.toString().padStart(2, '0')}`;
      expect(INFINITE_TMS[tmId], `Missing ${tmId}`).toBeDefined();
      expect(INFINITE_TMS[tmId].id).toBe(tmId);
    }
  });

  it('normalizes suffixed and lowercase TM/HM identifiers', () => {
    expect(normalizeTmId('TM02_HEADBUTT')).toBe('TM02');
    expect(normalizeTmId('HM01_CUT')).toBe('HM01');
    expect(normalizeTmId('hm07_waterfall')).toBe('HM07');
    expect(normalizeTmId('TM31')).toBe('TM31');
  });

  it('deduplicates and sorts TMs alphanumerically by TM/HM ID', () => {
    const rawList = [
      'TM31_MUD_SLAP',
      'HM07',
      'TM02',
      'HM01_CUT',
      'TM02_HEADBUTT',
      'HM07_WATERFALL',
      'TM01',
      'TM10',
      'HM03',
      'TM31',
    ];

    const result = deduplicateAndSortTms(rawList);
    expect(result).toEqual([
      'HM01',
      'HM03',
      'HM07',
      'TM01',
      'TM02',
      'TM10',
      'TM31',
    ]);
  });
});

describe('Dark Cave Accessibility and Warps', () => {
  it('connects Route 31 and Route 46 to Dark Cave Violet Entrance', () => {
    // Route 31 entrance at (34, 5)
    const r31Warp = route31.warps.find((w: any) => w.x === 34 && w.y === 5);
    expect(r31Warp).toBeDefined();
    expect(r31Warp.targetMapId).toBe('dark_cave_violet_entrance');
    expect(route31.collisionGrid[5 * route31.width + 34]).toBe(0);

    // Route 46 entrance at (14, 5)
    const r46Warp = route46.warps.find((w: any) => w.x === 14 && w.y === 5);
    expect(r46Warp).toBeDefined();
    expect(r46Warp.targetMapId).toBe('dark_cave_violet_entrance');
    expect(route46.collisionGrid[5 * route46.width + 14]).toBe(0);

    // Dark Cave Violet Entrance has exit warps to both
    expect(darkCaveViolet.warps.some((w: any) => w.targetMapId === 'route_31')).toBe(true);
    expect(darkCaveViolet.warps.some((w: any) => w.targetMapId === 'route_46')).toBe(true);
  });

  it('connects Route 45 to Dark Cave Blackthorn Entrance', () => {
    // Route 45 entrance at (2, 5)
    const r45Warp = route45.warps.find((w: any) => w.x === 2 && w.y === 5);
    expect(r45Warp).toBeDefined();
    expect(r45Warp.targetMapId).toBe('dark_cave_blackthorn_entrance');
    expect(route45.collisionGrid[5 * route45.width + 2]).toBe(0);

    // Dark Cave Blackthorn Entrance has exit warp to route_45
    expect(darkCaveBlackthorn.warps.some((w: any) => w.targetMapId === 'route_45')).toBe(true);
  });
});

describe('Ruins of Alph Chambers and Encounters', () => {
  it('connects all four outer chamber entrances to distinct chamber maps', () => {
    const warpKabuto = ruinsOutside.warps.find((w: any) => w.x === 14 && w.y === 7);
    const warpOmanyte = ruinsOutside.warps.find((w: any) => w.x === 2 && w.y === 17);
    const warpAerodactyl = ruinsOutside.warps.find((w: any) => w.x === 2 && w.y === 29);
    const warpHoOh = ruinsOutside.warps.find((w: any) => w.x === 16 && w.y === 33);

    expect(warpKabuto?.targetMapId).toBe('ruins_of_alph_kabuto_chamber');
    expect(warpOmanyte?.targetMapId).toBe('ruins_of_alph_omanyte_chamber');
    expect(warpAerodactyl?.targetMapId).toBe('ruins_of_alph_aerodactyl_chamber');
    expect(warpHoOh?.targetMapId).toBe('ruins_of_alph_ho_oh_chamber');
  });

  it('provides walkable tiles directly in front of all 4 chamber puzzle altars and inscriptions', () => {
    const chambers = [kabutoChamber, omanyteChamber, aerodactylChamber, hoOhChamber];
    for (const ch of chambers) {
      // (3, 3) in front of puzzle at (3, 2)
      expect(ch.collisionGrid[3 * ch.width + 3], `${ch.id} (3,3) must be walkable`).toBe(0);
      // (4, 3) in front of inscription at (4, 2)
      expect(ch.collisionGrid[3 * ch.width + 4], `${ch.id} (4,3) must be walkable`).toBe(0);
    }
  });

  it('restricts wild Unown encounters exclusively to ruins_of_alph_inner_chamber', () => {
    // Outside grassEncounters must be empty
    expect(ruinsOutside.grassEncounters).toHaveLength(0);

    // Classification checks
    expect(isDungeonOrCaveMap('ruins_of_alph_outside')).toBe(false);
    expect(isDungeonOrCaveMap('ruins_of_alph_research_center')).toBe(false);
    expect(isDungeonOrCaveMap('ruins_of_alph_kabuto_chamber')).toBe(false);
    expect(isDungeonOrCaveMap('ruins_of_alph_inner_chamber')).toBe(true);
  });
});

describe('Olivine Lighthouse One-Way Drop Holes', () => {
  it('does not contain upward warps on hole landing tiles in 1F through 5F', () => {
    // 1F should only warp out to city and up stairs to 2F (3, 11)
    expect(lighthouse1f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_2f' && w.y === 13)).toBe(false);

    // 2F should only warp down stairs to 1F, up stairs to 3F, and down holes to 1F
    expect(lighthouse2f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_3f' && w.y === 11)).toBe(false);
    expect(lighthouse2f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_1f' && w.y === 13)).toBe(true); // hole down

    // 3F
    expect(lighthouse3f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_4f' && (w.y === 9 || w.y === 3))).toBe(false);
    expect(lighthouse3f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_2f' && w.y === 11)).toBe(true); // hole down

    // 4F
    expect(lighthouse4f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_5f' && w.y === 7)).toBe(false);
    expect(lighthouse4f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_3f' && w.y === 9)).toBe(true); // hole down

    // 5F
    expect(lighthouse5f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_6f' && w.y === 5)).toBe(false);
    expect(lighthouse5f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_4f' && w.y === 7)).toBe(true); // hole down

    // 6F: holes drop to 5F
    expect(lighthouse6f.warps.some((w: any) => w.targetMapId === 'olivine_lighthouse_5f' && w.y === 5)).toBe(true);
  });
});
