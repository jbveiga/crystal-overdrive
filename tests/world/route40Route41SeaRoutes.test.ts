import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createOlivineToIndigoNpcs } from '../../src/world/npcs/olivineToIndigoNpcs';
import { GridPhysics } from '../../src/world/GridPhysics';
import type { GridEntity } from '../../src/types';

describe('TICKET-WORLD-ROUTE40-ROUTE41-COMPLETE-01: Route 40 & Route 41 Sea Routes & Battle Tower Gate', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const spritesDir = path.resolve(__dirname, '../../public/assets/sprites/characters');
  const itemsPath = path.resolve(__dirname, '../../public/assets/data/overworld_items.json');

  const r40: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_40.json'), 'utf8'));
  const r41: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_41.json'), 'utf8'));
  const gate: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_40_battle_tower_gate.json'), 'utf8'));

  describe('1. Map Dimensions, Layout & Asset Integrity', () => {
    it('loads route_40, route_41, and route_40_battle_tower_gate with authentic dimensions', () => {
      expect(r40.id).toBe('route_40');
      expect(r40.width).toBe(20);
      expect(r40.height).toBe(36);
      expect(r40.collisionGrid.length).toBe(20 * 36);

      expect(r41.id).toBe('route_41');
      expect(r41.width).toBe(50);
      expect(r41.height).toBe(54);
      expect(r41.collisionGrid.length).toBe(50 * 54);

      expect(gate.id).toBe('route_40_battle_tower_gate');
      expect(gate.width).toBe(10);
      expect(gate.height).toBe(8);
      expect(gate.collisionGrid.length).toBe(10 * 8);
    });

    it('verifies seamless border connections between Route 40, Route 41, Olivine City and Cianwood City', () => {
      expect(r40.connections?.EAST?.mapId).toBe('olivine_city');
      expect(r40.connections?.SOUTH?.mapId).toBe('route_41');

      expect(r41.connections?.NORTH?.mapId).toBe('route_40');
      expect(r41.connections?.WEST?.mapId).toBe('cianwood_city');
    });

    it('asserts reciprocal and walkable warps between Route 40 and Battle Tower Gate', () => {
      const warpToGate = r40.warps?.find(w => w.targetMapId === 'route_40_battle_tower_gate');
      expect(warpToGate).toBeDefined();
      expect(warpToGate?.x).toBe(9);
      expect(warpToGate?.y).toBe(5);
      expect(warpToGate?.targetX).toBe(4);
      expect(warpToGate?.targetY).toBe(6);

      // Target tile in gate must be walkable (0 or 2)
      const gateLandingCol = gate.collisionGrid[6 * gate.width + 4];
      expect(gateLandingCol === 0 || gateLandingCol === 2).toBe(true);

      // Gate warps back to Route 40
      expect(gate.warps?.length).toBe(2);
      for (const w of gate.warps ?? []) {
        expect(w.targetMapId).toBe('route_40');
        expect(w.targetX).toBe(9);
        expect(w.targetY).toBe(6);

        const r40LandingCol = r40.collisionGrid[6 * r40.width + 9];
        expect(r40LandingCol === 0 || r40LandingCol === 2).toBe(true);
      }
    });

    it('verifies 4 Whirl Island cave entrance warps on Route 41', () => {
      expect(r41.warps?.length).toBe(4);
      const targets = r41.warps?.map(w => w.targetMapId);
      expect(targets).toContain('whirl_island_nw');
      expect(targets).toContain('whirl_island_ne');
      expect(targets).toContain('whirl_island_sw');
      expect(targets).toContain('whirl_island_se');

      // Verify all target maps exist
      for (const w of r41.warps ?? []) {
        const destPath = path.join(mapsDir, `${w.targetMapId}.json`);
        expect(fs.existsSync(destPath)).toBe(true);
        const destMap: MapData = JSON.parse(fs.readFileSync(destPath, 'utf8'));
        const landingCol = destMap.collisionGrid[w.targetY * destMap.width + w.targetX];
        expect(landingCol === 0 || landingCol === 2).toBe(true);
      }
    });

    it('verifies Route 40 canonical signpost at (14, 10)', () => {
      const sign = r40.bgEvents?.find(b => b.x === 14 && b.y === 10);
      expect(sign).toBeDefined();
      expect(sign?.speaker).toBe('📍 ROUTE 40 SIGN');
      expect(sign?.pages).toContain('ROUTE 40');
      // Sign tile has collision 1 (solid)
      expect(r40.collisionGrid[10 * r40.width + 14]).toBe(1);
    });
  });

  describe('2. Canonical NPC Population & 14 Swimmers', () => {
    const allNpcGroups = createOlivineToIndigoNpcs();
    const r40Npcs = allNpcGroups.route_40 ?? [];
    const r41Npcs = allNpcGroups.route_41 ?? [];
    const gateNpcs = allNpcGroups.route_40_battle_tower_gate ?? [];

    it('verifies Route 40 beach residents on walkable land tiles (collision 0)', () => {
      const monica = r40Npcs.find(n => n.id === 'monica_of_monday');
      expect(monica).toBeDefined();
      expect(monica?.x).toBe(8);
      expect(monica?.y).toBe(10);
      expect(monica?.action).toBe('DAY_SIBLING_EVENT');
      expect(r40.collisionGrid[10 * r40.width + 8]).toBe(0);

      const lass1 = r40Npcs.find(n => n.id === 'route_40_lass1');
      expect(lass1).toBeDefined();
      expect(lass1?.x).toBe(11);
      expect(lass1?.y).toBe(13);
      expect(r40.collisionGrid[13 * r40.width + 11]).toBe(0);

      const pokefan = r40Npcs.find(n => n.id === 'route_40_pokefan_m');
      expect(pokefan).toBeDefined();
      expect(pokefan?.x).toBe(7);
      expect(pokefan?.y).toBe(6);
      expect(r40.collisionGrid[6 * r40.width + 7]).toBe(0);

      const lass2 = r40Npcs.find(n => n.id === 'route_40_lass2');
      expect(lass2).toBeDefined();
      expect(lass2?.x).toBe(13);
      expect(lass2?.y).toBe(4);
      expect(r40.collisionGrid[4 * r40.width + 13]).toBe(0);

      const youngster = r40Npcs.find(n => n.id === 'route_40_standing_youngster');
      expect(youngster).toBeDefined();
      expect(youngster?.x).toBe(16);
      expect(youngster?.y).toBe(9);
      expect(r40.collisionGrid[9 * r40.width + 16]).toBe(0);
    });

    it('verifies 4 canonical Route 40 Swimmers on water tiles (collision 3)', () => {
      const swimmers = [
        { id: 'swimmerm_simon', x: 14, y: 15, dir: 'RIGHT', vision: 4, teamSize: 2 },
        { id: 'swimmerm_randall', x: 18, y: 30, dir: 'LEFT', vision: 5, teamSize: 3 },
        { id: 'swimmerf_elaine', x: 3, y: 19, dir: 'RIGHT', vision: 4, teamSize: 1 },
        { id: 'swimmerf_paula', x: 10, y: 25, dir: 'DOWN', vision: 3, teamSize: 2 },
      ];

      for (const s of swimmers) {
        const npc = r40Npcs.find(n => n.id === s.id);
        expect(npc, `Swimmer ${s.id} must exist`).toBeDefined();
        expect(npc?.x).toBe(s.x);
        expect(npc?.y).toBe(s.y);
        expect(npc?.direction).toBe(s.dir);
        expect(npc?.visionRange).toBe(s.vision);
        expect(npc?.trainerTeam?.length).toBe(s.teamSize);

        // Tile must be water (collision 3)
        const col = r40.collisionGrid[s.y * r40.width + s.x];
        expect(col, `Swimmer ${s.id} must stand on water tile 3`).toBe(3);
      }
    });

    it('verifies 10 canonical Route 41 Swimmers on water tiles (collision 3) with authentic teams', () => {
      const r41Swimmers = [
        { id: 'swimmerm_charlie', x: 32, y: 6, dir: 'DOWN', mons: ['shellder', 'tentacool', 'tentacruel'] },
        { id: 'swimmerm_george', x: 46, y: 8, dir: 'DOWN', mons: ['tentacool', 'tentacool', 'tentacool', 'staryu', 'tentacool', 'remoraid'] },
        { id: 'swimmerm_berke', x: 20, y: 26, dir: 'DOWN', mons: ['qwilfish'] },
        { id: 'swimmerm_kirk', x: 32, y: 30, dir: 'DOWN', mons: ['gyarados', 'gyarados'] },
        { id: 'swimmerm_mathew', x: 19, y: 46, dir: 'DOWN', mons: ['krabby'] },
        { id: 'swimmerf_kaylee', x: 17, y: 4, dir: 'DOWN', mons: ['goldeen', 'goldeen', 'seaking'] },
        { id: 'swimmerf_susie', x: 23, y: 19, dir: 'UP', mons: ['psyduck', 'goldeen'] },
        { id: 'swimmerf_denise', x: 27, y: 34, dir: 'LEFT', mons: ['seel'] },
        { id: 'swimmerf_kara', x: 44, y: 28, dir: 'RIGHT', mons: ['staryu', 'starmie'] },
        { id: 'swimmerf_wendy', x: 9, y: 50, dir: 'DOWN', mons: ['horsea', 'horsea'] },
      ];

      for (const s of r41Swimmers) {
        const npc = r41Npcs.find(n => n.id === s.id);
        expect(npc, `Swimmer ${s.id} must exist`).toBeDefined();
        expect(npc?.x).toBe(s.x);
        expect(npc?.y).toBe(s.y);
        expect(npc?.direction).toBe(s.dir);

        const col = r41.collisionGrid[s.y * r41.width + s.x];
        expect(col, `Swimmer ${s.id} must stand on water tile 3`).toBe(3);

        const species = npc?.trainerTeam?.map(m => m.speciesId);
        expect(species).toEqual(s.mons);
      }
    });

    it('verifies custom movesets for Susie and Wendy', () => {
      const susie = r41Npcs.find(n => n.id === 'swimmerf_susie');
      expect(susie?.trainerTeam?.[0].moves).toEqual(['scratch', 'tailwhip', 'disable', 'confusion']);
      expect(susie?.trainerTeam?.[1].moves).toEqual(['peck', 'tailwhip', 'supersonic', 'hornattack']);

      const wendy = r41Npcs.find(n => n.id === 'swimmerf_wendy');
      expect(wendy?.trainerTeam?.[0].moves).toEqual(['bubble', 'smokescreen', 'leer', 'watergun']);
      expect(wendy?.trainerTeam?.[1].moves).toEqual(['dragonrage', 'smokescreen', 'leer', 'watergun']);
    });

    it('verifies Route 40 Battle Tower Gate officer', () => {
      const officer = gateNpcs.find(n => n.id === 'route_40_gate_officer');
      expect(officer).toBeDefined();
      expect(officer?.x).toBe(5);
      expect(officer?.y).toBe(2);
      expect(officer?.direction).toBe('DOWN');
      expect(officer?.spriteType).toBe('officer');
      expect(gate.collisionGrid[2 * gate.width + 5]).toBe(0);
    });

    it('asserts 100% of referenced sprites exist on disk', () => {
      const uniqueSprites = new Set([
        ...r40Npcs.map(n => n.spriteType),
        ...r41Npcs.map(n => n.spriteType),
        ...gateNpcs.map(n => n.spriteType),
      ]);

      for (const sprite of uniqueSprites) {
        expect(sprite).toBeDefined();
        const spriteFile = `npc_${sprite}.png`;
        const directFile = `${sprite}.png`;
        const exists =
          fs.existsSync(path.join(spritesDir, spriteFile)) ||
          fs.existsSync(path.join(spritesDir, directFile));
        expect(exists, `Sprite '${sprite}' must exist in ${spritesDir}`).toBe(true);
      }
    });
  });

  describe('3. Water Line-of-Sight GridPhysics Invariant', () => {
    function createMockEntity(override: Partial<GridEntity>): GridEntity {
      return {
        id: 'test',
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        direction: 'DOWN',
        speed: 4,
        isMoving: false,
        sprite: 'boy',
        action: 'NONE',
        dialogue: [],
        stepProgress: 0,
        ...override,
      };
    }

    it('allows a Swimmer on water (collision 3) to spot player across open water tiles (collision 3)', () => {
      const swimmer = createMockEntity({
        id: 'swimmerm_test',
        x: 10,
        y: 10,
        direction: 'RIGHT',
        trainerId: 'swimmerm_test',
        visionRange: 4,
      });

      const player = createMockEntity({
        id: 'player',
        x: 13,
        y: 10,
        isPlayer: true,
      });

      const defeated = new Set<string>();
      // All tiles between (10,10) and (13,10) are water (tileType 3)
      const tileLookup = () => 3;

      const spotted = GridPhysics.checkTrainerLineOfSight(player, [swimmer], defeated, tileLookup);
      expect(spotted).toBe(swimmer);
    });

    it('blocks a land trainer (collision 0) from spotting player across water tiles (collision 3)', () => {
      const landTrainer = createMockEntity({
        id: 'youngster_test',
        x: 10,
        y: 10,
        direction: 'RIGHT',
        trainerId: 'youngster_test',
        visionRange: 4,
      });

      const player = createMockEntity({
        id: 'player',
        x: 13,
        y: 10,
        isPlayer: true,
      });

      const defeated = new Set<string>();
      // Trainer at (10,10) is on land (0), intervening tiles are water (3)
      const tileLookup = (x: number, _y: number) => (x === 10 ? 0 : 3);

      const spotted = GridPhysics.checkTrainerLineOfSight(player, [landTrainer], defeated, tileLookup);
      expect(spotted).toBeNull();
    });

    it('blocks water line-of-sight if a solid obstacle (collision 1) intervenes', () => {
      const swimmer = createMockEntity({
        id: 'swimmerm_test',
        x: 10,
        y: 10,
        direction: 'RIGHT',
        trainerId: 'swimmerm_test',
        visionRange: 4,
      });

      const player = createMockEntity({
        id: 'player',
        x: 13,
        y: 10,
        isPlayer: true,
      });

      const defeated = new Set<string>();
      // Solid rock at (12, 10)
      const tileLookup = (x: number, _y: number) => (x === 12 ? 1 : 3);

      const spotted = GridPhysics.checkTrainerLineOfSight(player, [swimmer], defeated, tileLookup);
      expect(spotted).toBeNull();
    });

    it('does not spot player if trainer has already been defeated', () => {
      const swimmer = createMockEntity({
        id: 'swimmerm_test',
        x: 10,
        y: 10,
        direction: 'RIGHT',
        trainerId: 'swimmerm_test',
        visionRange: 4,
      });

      const player = createMockEntity({
        id: 'player',
        x: 13,
        y: 10,
        isPlayer: true,
      });

      const defeated = new Set<string>(['swimmerm_test']);
      const tileLookup = () => 3;

      const spotted = GridPhysics.checkTrainerLineOfSight(player, [swimmer], defeated, tileLookup);
      expect(spotted).toBeNull();
    });
  });

  describe('4. Hidden Items & Water Encounters', () => {
    it('verifies overworld hidden items for Route 40 and Route 41 exist in overworld_items.json', () => {
      const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
      const hiddenList: Array<{ id: string; mapId: string }> = itemsData.hiddenItems || [];

      const r40Item = hiddenList.find(i => i.id === 'route_40_hidden_7_8_hyper_potion');
      expect(r40Item).toBeDefined();
      expect(r40Item?.mapId).toBe('route_40');

      const r41Item = hiddenList.find(i => i.id === 'route_41_hidden_9_35_max_ether');
      expect(r41Item).toBeDefined();
      expect(r41Item?.mapId).toBe('route_41');
    });

    it('verifies water encounters in route_40 and route_41', () => {
      expect(r40.waterEncounters?.length).toBeGreaterThan(0);
      expect(r41.waterEncounters?.length).toBeGreaterThan(0);

      const r40Species = r40.waterEncounters?.map(e => e.speciesId);
      expect(r40Species).toContain('tentacool');
      expect(r40Species).toContain('tentacruel');

      const r41Species = r41.waterEncounters?.map(e => e.speciesId);
      expect(r41Species).toContain('tentacool');
      expect(r41Species).toContain('tentacruel');
      expect(r41Species).toContain('mantine');
    });
  });
});
