import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../src/types/game';
import { createNpcsByMap, DAY_SIBLINGS } from '../src/world/npcData';
import { OverworldItemManager } from '../src/world/OverworldItemManager';
import { AudioManager } from '../src/audio/AudioManager';

const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
const itemsFile = path.resolve(__dirname, '../public/assets/data/overworld_items.json');

function loadMap(id: string): MapData {
  const filePath = path.join(mapsDir, `${id}.json`);
  expect(fs.existsSync(filePath), `Map file ${id}.json must exist`).toBe(true);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const isWalkable = (m: MapData, x: number, y: number): boolean => {
  if (x < 0 || x >= m.width || y < 0 || y >= m.height) return false;
  const col = m.collisionGrid[y * m.width + x];
  return col === 0 || col === 2;
};

describe('10-Point Map Delivery Package — Azalea Gym & Ilex Forest', () => {
  describe('TICKET-WORLD-AZALEA-GYM-BUGSY-01: 10-Point Map Delivery Package (Azalea Gym & Leader Bugsy)', () => {
    it('Dimension 1: asserts reciprocal navigation with safe doorstep apron target (10, 16) in Azalea Town', () => {
      const azalea = loadMap('azalea_town');
      const gym = loadMap('azalea_gym');

      // Azalea Town -> Gym
      const townToGym = azalea.warps.find((w) => w.targetMapId === 'azalea_gym');
      expect(townToGym).toBeDefined();
      expect(townToGym?.x).toBe(10);
      expect(townToGym?.y).toBe(15);

      // Gym -> Azalea Town (apron at targetY: 16)
      expect(gym.warps.length).toBeGreaterThanOrEqual(2);
      for (const w of gym.warps) {
        expect(w.targetMapId).toBe('azalea_town');
        expect(w.targetX).toBe(10);
        expect(w.targetY).toBe(16);
        expect([0, 2]).toContain(azalea.collisionGrid[16 * azalea.width + 10]);
      }
    });

    it('Dimension 2 & 3: asserts complete NPC population across all 6 trainers, Gym Guide, and 100% walkability', () => {
      const npcs = createNpcsByMap();
      const gym = loadMap('azalea_gym');
      const gymNpcs = npcs.azalea_gym;
      expect(gymNpcs.length).toBeGreaterThanOrEqual(7);

      // Leader Bugsy
      const bugsy = gymNpcs.find((n) => n.id === 'bugsy');
      expect(bugsy).toBeDefined();
      expect(bugsy?.x).toBe(5);
      expect(bugsy?.y).toBe(7);
      expect(bugsy?.action).toBe('BUGSY_EVENT');
      expect(bugsy?.challengePages?.[0]).toContain('BUGSY');

      // Junior trainers
      const benny = gymNpcs.find((n) => n.id === 'bug_catcher_benny');
      const al = gymNpcs.find((n) => n.id === 'bug_catcher_al');
      const josh = gymNpcs.find((n) => n.id === 'bug_catcher_josh');
      const amy = gymNpcs.find((n) => n.id === 'twins_amy');
      const may = gymNpcs.find((n) => n.id === 'twins_may');
      const guide = gymNpcs.find((n) => n.id === 'azalea_gym_guide');

      expect(benny).toBeDefined();
      expect(al).toBeDefined();
      expect(josh).toBeDefined();
      expect(amy).toBeDefined();
      expect(may).toBeDefined();
      expect(guide).toBeDefined();

      // 100% walkability check for all gym entities
      for (const n of gymNpcs) {
        const col = gym.collisionGrid[n.y * gym.width + n.x];
        expect([0, 2], `Azalea Gym NPC ${n.id} at (${n.x}, ${n.y}) must stand on walkable tile`).toContain(col);
      }
    });

    it('Dimension 4: asserts Gym Statues at (3, 13) and (6, 13) with dynamic winning trainers and guide advice', () => {
      const gym = loadMap('azalea_gym');
      expect(gym.bgEvents.length).toBeGreaterThanOrEqual(2);

      const leftStatue = gym.bgEvents.find((b) => b.x === 3 && b.y === 13);
      const rightStatue = gym.bgEvents.find((b) => b.x === 6 && b.y === 13);
      expect(leftStatue).toBeDefined();
      expect(rightStatue).toBeDefined();
      expect(leftStatue?.pages.some((p) => p.includes('BUGSY'))).toBe(true);
      expect(rightStatue?.pages.some((p) => p.includes('BUGSY'))).toBe(true);

      // Statues are on solid tiles (1)
      expect(gym.collisionGrid[13 * gym.width + 3]).toBe(1);
      expect(gym.collisionGrid[13 * gym.width + 6]).toBe(1);
    });

    it('Dimension 10: asserts Azalea Gym resolves cleanly to bgm_gym in AudioManager', () => {
      const audioManager = new AudioManager();
      expect(audioManager.getTrackForMap('azalea_gym')).toBe('bgm_gym');
    });
  });

  describe('TICKET-WORLD-ILEX-FOREST-01: 10-Point Map Delivery Package (Ilex Forest & Farfetch\'d Herding Quest)', () => {
    it('Dimension 1: asserts reciprocal navigation between Azalea Town, Ilex Forest, and Route 34 Gate with safe landing thresholds', () => {
      const forest = loadMap('ilex_forest');
      const azalea = loadMap('azalea_town');
      const gate = loadMap('route_34_ilex_forest_gate');

      // East Exits to Azalea Town
      const toAzalea1 = forest.warps.find((w) => w.targetMapId === 'azalea_town' && w.x === 3 && w.y === 42);
      const toAzalea2 = forest.warps.find((w) => w.targetMapId === 'azalea_town' && w.x === 3 && w.y === 43);
      expect(toAzalea1).toBeDefined();
      expect(toAzalea2).toBeDefined();
      expect(toAzalea1?.targetX).toBe(2);
      expect(toAzalea1?.targetY).toBe(10);
      expect(toAzalea2?.targetX).toBe(2);
      expect(toAzalea2?.targetY).toBe(11);

      // Reciprocal warps from Azalea Town to Ilex Forest
      const fromAzalea1 = azalea.warps.find((w) => w.targetMapId === 'ilex_forest' && w.x === 2 && w.y === 10);
      const fromAzalea2 = azalea.warps.find((w) => w.targetMapId === 'ilex_forest' && w.x === 2 && w.y === 11);
      expect(fromAzalea1).toBeDefined();
      expect(fromAzalea2).toBeDefined();
      expect(fromAzalea1?.targetX).toBe(3);
      expect(fromAzalea1?.targetY).toBe(42);
      expect(fromAzalea2?.targetX).toBe(3);
      expect(fromAzalea2?.targetY).toBe(43);

      // North Exit to Route 34 Gate
      const toGate = forest.warps.find((w) => w.targetMapId === 'route_34_ilex_forest_gate');
      expect(toGate).toBeDefined();
      expect(toGate?.x).toBe(1);
      expect(toGate?.y).toBe(5);
      expect(toGate?.targetX).toBe(4);
      expect(toGate?.targetY).toBe(7);

      // Reciprocal warps from Gate to Ilex Forest
      const fromGate = gate.warps.filter((w) => w.targetMapId === 'ilex_forest');
      expect(fromGate.length).toBeGreaterThanOrEqual(1);
      for (const w of fromGate) {
        expect(w.targetX).toBe(1);
        expect(w.targetY).toBe(5);
      }

      // Assert 100% of landing tiles are safe and walkable
      expect([0, 2]).toContain(azalea.collisionGrid[10 * azalea.width + 2]);
      expect([0, 2]).toContain(azalea.collisionGrid[11 * azalea.width + 2]);
      expect([0, 2]).toContain(gate.collisionGrid[7 * gate.width + 4]);
      expect([0, 2]).toContain(forest.collisionGrid[42 * forest.width + 3]);
      expect([0, 2]).toContain(forest.collisionGrid[43 * forest.width + 3]);
      expect([0, 2]).toContain(forest.collisionGrid[5 * forest.width + 1]);
    });

    it('Dimension 2: asserts 100% of Ilex Forest NPCs stand on walkable tiles with complete combat and interaction data', () => {
      const forest = loadMap('ilex_forest');
      const npcs = createNpcsByMap();
      const forestNpcs = (npcs as any).ilex_forest || [];
      expect(forestNpcs.length).toBeGreaterThanOrEqual(5);

      const apprentice = forestNpcs.find((n: any) => n.id === 'forest_apprentice');
      const farfetchd = forestNpcs.find((n: any) => n.id === 'forest_farfetchd');
      const master = forestNpcs.find((n: any) => n.id === 'cut_master');
      const headbutt = forestNpcs.find((n: any) => n.id === 'headbutt_tutor');
      const wayne = forestNpcs.find((n: any) => n.id === 'bug_catcher_wayne');

      expect(apprentice).toBeDefined();
      expect(farfetchd).toBeDefined();
      expect(master).toBeDefined();
      expect(headbutt).toBeDefined();
      expect(wayne).toBeDefined();

      // Wayne trainer combat attributes
      expect(wayne.action).toBe('TRAINER_BATTLE');
      expect(wayne.trainerId).toBe('bug_catcher_wayne');
      expect(wayne.trainerTeam?.length).toBe(2);
      expect(wayne.trainerTeam?.[0].speciesId).toBe('paras');
      expect(wayne.trainerTeam?.[1].speciesId).toBe('spinarak');

      // 100% walkability check across all forest entities
      for (const n of forestNpcs) {
        const col = forest.collisionGrid[n.y * forest.width + n.x];
        expect([0, 2], `NPC ${n.id} at (${n.x}, ${n.y}) on ilex_forest must stand on walkable tile`).toContain(col);
      }
    });

    it('Dimension 3 & 4: asserts Signpost, Shrine, and Cut Tree clearance opening Route 34 access', () => {
      const forest = loadMap('ilex_forest');

      // Signpost at (3, 17) and Shrine at (8, 22)
      expect(forest.bgEvents.length).toBeGreaterThanOrEqual(2);
      const signpost = forest.bgEvents.find((b) => b.x === 3 && b.y === 17);
      const shrine = forest.bgEvents.find((b) => b.x === 8 && b.y === 22);
      expect(signpost).toBeDefined();
      expect(shrine).toBeDefined();
      expect(shrine?.pages.some((p) => p.includes('CELEBI') || p.includes('SHRINE'))).toBe(true);

      // Prior to Cut, path at (8, 25) is blocked (solid 1)
      expect(forest.collisionGrid[25 * forest.width + 8]).toBe(1);

      // Simulate cutting the tree: collision clears to 0 and connects south to north
      const simulatedColl = [...forest.collisionGrid];
      simulatedColl[25 * forest.width + 8] = 0;

      // Flood-fill BFS to assert reachability from entrance (3, 42) to north exit (1, 5)
      const visited = new Set<number>();
      const queue: [number, number][] = [[3, 42]];
      visited.add(42 * forest.width + 3);

      while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < forest.width && ny >= 0 && ny < forest.height) {
            const idx = ny * forest.width + nx;
            const c = simulatedColl[idx];
            if ((c === 0 || c === 2) && !visited.has(idx)) {
              visited.add(idx);
              queue.push([nx, ny]);
            }
          }
        }
      }

      expect(visited.has(5 * forest.width + 1)).toBe(true);
    });

    it('Dimension 5: asserts all canonical Item Balls and Hidden Items are indexed on walkable tiles', () => {
      const forest = loadMap('ilex_forest');
      const itemManager = new OverworldItemManager();
      const itemBalls = itemManager.getActiveItemBalls('ilex_forest');
      const hiddenItems = itemManager.getHiddenItemsForMap('ilex_forest');

      expect(itemBalls.length).toBeGreaterThanOrEqual(4);
      expect(hiddenItems.length).toBeGreaterThanOrEqual(3);

      // Required canonical items
      expect(itemBalls.some((b) => b.itemId === 'revive')).toBe(true);
      expect(itemBalls.some((b) => b.itemId === 'x_attack')).toBe(true);
      expect(itemBalls.some((b) => b.itemId === 'antidote')).toBe(true);
      expect(itemBalls.some((b) => b.itemId === 'ether')).toBe(true);

      // 100% walkability check for items
      for (const b of itemBalls) {
        const col = forest.collisionGrid[b.y * forest.width + b.x];
        expect([0, 2], `ItemBall ${b.id} at (${b.x}, ${b.y}) must be walkable`).toContain(col);
      }
      for (const h of hiddenItems) {
        const col = forest.collisionGrid[h.y * forest.width + h.x];
        expect([0, 2], `HiddenItem ${h.id} at (${h.x}, ${h.y}) must be walkable`).toContain(col);
      }
    });

    it('Dimension 6: asserts time-of-day wild encounter distributions for Ilex Forest', () => {
      const forest = loadMap('ilex_forest');
      expect(forest.grassEncounters).toBeDefined();
      const encounters = forest.grassEncounters!;
      expect(encounters.length).toBeGreaterThanOrEqual(10);

      const morning = encounters.filter((e) => e.timeOfDay === 'MORNING');
      const day = encounters.filter((e) => e.timeOfDay === 'DAY');
      const night = encounters.filter((e) => e.timeOfDay === 'NIGHT');

      expect(morning.length).toBeGreaterThanOrEqual(5);
      expect(day.length).toBeGreaterThanOrEqual(5);
      expect(night.length).toBeGreaterThanOrEqual(5);

      // Canonical species presence
      expect(encounters.some((e) => e.speciesId === 'caterpie')).toBe(true);
      expect(encounters.some((e) => e.speciesId === 'weedle')).toBe(true);
      expect(encounters.some((e) => e.speciesId === 'paras')).toBe(true);
      expect(night.some((e) => e.speciesId === 'oddish')).toBe(true);
      expect(night.some((e) => e.speciesId === 'psyduck')).toBe(true);
    });

    it('Dimension 10: asserts canonical BGM track resolution for Ilex Forest and Gate', () => {
      const audioManager = new AudioManager();
      expect(audioManager.getTrackForMap('ilex_forest')).toBe('bgm_sprout_tower');
      expect(audioManager.getTrackForMap('route_34_ilex_forest_gate')).toBe('bgm_sprout_tower');
    });
  });
});
