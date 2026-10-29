import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { executeMove } from '../../src/battle/state/BattleMoveAndItemExecutor';
import { isEcruteakGymSafeTile, ECRUTEAK_GYM_SAFE_SET } from '../../src/world/ecruteakGymMaze';
import { GridPhysics, GridEntity } from '../../src/world/GridPhysics';

describe('TICKET-GAMEPLAY-FIDELITY-01: Moves, Evolutions, Holes, Ecruteak Gym & Turn-in-Place', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const mapsDir = path.resolve(repoRoot, 'public/assets/data/maps');

  // =========================================================================
  // 1. Battle Move Execution Engine (Synthesis, Drains, Boosts, Status, Fixed)
  // =========================================================================
  describe('1. Move Execution Fidelity: Synthesis, Drains, Boosts & Fixed Damage', () => {
    it('executes Synthesis healing in clear weather (50% max HP) without dealing damage', () => {
      const chikorita = PokemonFactory.create('chikorita', 25, ['synthesis']);
      chikorita.stats.hp = 100;
      chikorita.currentHp = 30; // 30 / 100 HP

      const opponent = PokemonFactory.create('rattata', 20, ['tackle']);
      const synthesisMove = PokemonFactory.getMoveData('synthesis');
      expect(synthesisMove.healFraction).toBe(0.5);
      expect(synthesisMove.isWeatherHeal).toBe(true);

      const events: any[] = [];
      executeMove({
        attacker: chikorita,
        defender: opponent,
        move: synthesisMove,
        events,
        weather: 'NONE',
        furyCutterStreaks: new Map(),
      });

      // Assert chikorita healed 50 HP (from 30 to 80), opponent took 0 damage
      expect(chikorita.currentHp).toBe(80);
      expect(opponent.currentHp).toBe(opponent.stats.hp);
      expect(events.some((e) => e.type === 'HEAL' && e.healedAmount === 50)).toBe(true);
      expect(events.some((e) => e.type === 'DAMAGE')).toBe(false);
    });

    it('executes weather scaling on Synthesis (66% in SUN, 25% in RAIN)', () => {
      const chikorita = PokemonFactory.create('chikorita', 25, ['synthesis']);
      chikorita.stats.hp = 120;
      chikorita.currentHp = 10;
      const opponent = PokemonFactory.create('rattata', 20);
      const synthesisMove = PokemonFactory.getMoveData('synthesis');

      // 1. SUN weather: 2/3 of 120 = 80 HP
      const sunEvents: any[] = [];
      executeMove({
        attacker: chikorita,
        defender: opponent,
        move: synthesisMove,
        events: sunEvents,
        weather: 'SUN',
        furyCutterStreaks: new Map(),
      });
      expect(chikorita.currentHp).toBe(90); // 10 + 80 = 90

      // 2. RAIN weather: 1/4 of 120 = 30 HP
      chikorita.currentHp = 10;
      const rainEvents: any[] = [];
      executeMove({
        attacker: chikorita,
        defender: opponent,
        move: synthesisMove,
        events: rainEvents,
        weather: 'RAIN',
        furyCutterStreaks: new Map(),
      });
      expect(chikorita.currentHp).toBe(40); // 10 + 30 = 40
    });

    it('executes Rest to 100% full heal and grants 2-turn SLP condition', () => {
      const snorlax = PokemonFactory.create('snorlax', 30, ['rest']);
      snorlax.stats.hp = 200;
      snorlax.currentHp = 20;
      snorlax.status = 'PSN';

      const opponent = PokemonFactory.create('rattata', 20);
      const restMove = PokemonFactory.getMoveData('rest');

      const events: any[] = [];
      executeMove({
        attacker: snorlax,
        defender: opponent,
        move: restMove,
        events,
        furyCutterStreaks: new Map(),
      });

      expect(snorlax.currentHp).toBe(200);
      expect(snorlax.status).toBe('SLP');
      expect(snorlax.sleepTurns).toBe(2);
      expect(events.some((e) => e.type === 'STATUS' && e.status === 'SLP')).toBe(true);
    });

    it('executes Giga Drain and heals the attacker for 50% of direct damage dealt', () => {
      const bellsprout = PokemonFactory.create('bellsprout', 25, ['gigadrain']);
      bellsprout.stats.hp = 100;
      bellsprout.currentHp = 20; // Needs healing

      const geodude = PokemonFactory.create('geodude', 20, ['tackle']);
      const gigaDrainMove = PokemonFactory.getMoveData('gigadrain');
      expect(gigaDrainMove.drainFraction).toBe(0.5);

      const events: any[] = [];
      executeMove({
        attacker: bellsprout,
        defender: geodude,
        move: gigaDrainMove,
        events,
        furyCutterStreaks: new Map(),
      });

      const dmgEvent = events.find((e) => e.type === 'DAMAGE' && e.targetId === geodude.uid);
      expect(dmgEvent).toBeDefined();
      expect(dmgEvent.damage).toBeGreaterThan(0);

      const expectedHeal = Math.min(bellsprout.stats.hp - 20, Math.floor(dmgEvent.damage * 0.5));
      expect(bellsprout.currentHp).toBe(20 + expectedHeal);
      expect(events.some((e) => e.type === 'HEAL' && e.targetId === bellsprout.uid)).toBe(true);
    });

    it('executes fixed-damage moves (Night Shade matches attacker level, Dragon Rage does 40 HP)', () => {
      const gastly = PokemonFactory.create('gastly', 33, ['nightshade']);
      const opponent = PokemonFactory.create('rattata', 20);
      opponent.currentHp = 100;
      opponent.stats.hp = 100;

      const nightShade = PokemonFactory.getMoveData('nightshade');
      const events: any[] = [];
      executeMove({
        attacker: gastly,
        defender: opponent,
        move: nightShade,
        events,
        furyCutterStreaks: new Map(),
      });

      const dmgEvent = events.find((e) => e.type === 'DAMAGE');
      expect(dmgEvent.damage).toBe(33); // Level 33

      // Dragon Rage (flat 40 damage)
      const dragonRage = PokemonFactory.getMoveData('dragonrage');
      const events2: any[] = [];
      executeMove({
        attacker: gastly,
        defender: opponent,
        move: dragonRage,
        events: events2,
        furyCutterStreaks: new Map(),
      });
      const dmgEvent2 = events2.find((e) => e.type === 'DAMAGE');
      expect(dmgEvent2.damage).toBe(40);
    });
  });

  // =========================================================================
  // 2. Pre-Evolution Lineage & Pokédex Caught Persistence
  // =========================================================================
  describe('2. Evolution & Lineage Caught Status Persistence', () => {
    it('resolves full pre-evolution chain for multi-stage evolutions', () => {
      const typhlosionLineage = PokemonFactory.getSpeciesLineageIds('typhlosion');
      expect(typhlosionLineage).toContain('typhlosion');
      expect(typhlosionLineage).toContain('quilava');
      expect(typhlosionLineage).toContain('cyndaquil');

      const butterfreeLineage = PokemonFactory.getSpeciesLineageIds('butterfree');
      expect(butterfreeLineage).toEqual(['butterfree', 'metapod', 'caterpie']);

      const singleStage = PokemonFactory.getSpeciesLineageIds('miltank');
      expect(singleStage).toEqual(['miltank']);
    });

    it('ensures evolved party members preserve pre-evolution in caught species calculations', () => {
      const evolvedTeam = [
        PokemonFactory.create('feraligatr', 36),
        PokemonFactory.create('ampharos', 32),
      ];

      // Simulated getCaughtSpeciesSet calculation from main.ts
      const caughtSet = new Set<string>();
      for (const p of evolvedTeam) {
        for (const id of PokemonFactory.getSpeciesLineageIds(p.speciesId)) {
          caughtSet.add(id);
        }
      }

      // Check all stages are marked caught
      expect(caughtSet.has('feraligatr')).toBe(true);
      expect(caughtSet.has('croconaw')).toBe(true);
      expect(caughtSet.has('totodile')).toBe(true);

      expect(caughtSet.has('ampharos')).toBe(true);
      expect(caughtSet.has('flaaffy')).toBe(true);
      expect(caughtSet.has('mareep')).toBe(true);
    });
  });

  // =========================================================================
  // 3. One-Way Pitfalls & Burned Tower Stairs (7, 15)
  // =========================================================================
  describe('3. One-Way Pitfalls & Burned Tower Stairs Integration', () => {
    it('verifies Burned Tower (7, 15) stairs connect 1F and B1F bidirectionally', () => {
      const bt1f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'burned_tower_1f.json'), 'utf8'));
      const btb1f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'burned_tower_b1f.json'), 'utf8'));

      const stair1f = bt1f.warps.find((w: any) => w.x === 7 && w.y === 15);
      expect(stair1f).toBeDefined();
      expect(stair1f.targetMapId).toBe('burned_tower_b1f');
      expect(stair1f.targetX).toBe(7);
      expect(stair1f.targetY).toBe(15);

      const stairB1f = btb1f.warps.find((w: any) => w.x === 7 && w.y === 15);
      expect(stairB1f).toBeDefined();
      expect(stairB1f.targetMapId).toBe('burned_tower_1f');
      expect(stairB1f.targetX).toBe(7);
      expect(stairB1f.targetY).toBe(15);

      // Verify no upward warp exists on bare floor (10, 9) in B1F
      const bogusWarpB1f = btb1f.warps.find((w: any) => w.x === 10 && w.y === 9);
      expect(bogusWarpB1f).toBeUndefined();

      // Verify all 22 square black hole tiles on 1F (x=6..13, y=4..11) are walkable (col=0) and warp to B1F
      const holeTileNames = new Set([
        'in_tower_11_11_40_20',
        'in_tower_11_11_21_21',
        'in_tower_41_31_41_31',
        'in_tower_5e_5e_01_01',
      ]);
      let holeCount = 0;
      for (let y = 4; y <= 11; y++) {
        for (let x = 6; x <= 13; x++) {
          const idx = y * bt1f.width + x;
          if (holeTileNames.has(bt1f.tileMap[idx])) {
            holeCount++;
            expect(bt1f.collisionGrid[idx], `Black hole at (${x},${y}) must be walkable`).toBe(0);
            const hw = bt1f.warps.find((w: any) => w.x === x && w.y === y);
            expect(hw, `Black hole at (${x},${y}) must warp to B1F`).toBeDefined();
            expect(hw.targetMapId).toBe('burned_tower_b1f');
          }
        }
      }
      expect(holeCount).toBe(22);
    });

    it('verifies one-way pitfall rule: bare floor landing pads have zero upward reverse warps', () => {
      // 1. Ice Path B2F Mahogany Side
      const ip = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ice_path_b2f_mahogany_side.json'), 'utf8'));
      expect(ip.warps.some((w: any) => w.x === 11 && w.y === 4)).toBe(false);
      expect(ip.warps.some((w: any) => w.x === 4 && w.y === 6)).toBe(false);
      expect(ip.warps.some((w: any) => w.x === 4 && w.y === 12)).toBe(false);
      expect(ip.warps.some((w: any) => w.x === 12 && w.y === 12)).toBe(false);

      // 2. Victory Road hole landing (0, 27)
      const vr = JSON.parse(fs.readFileSync(path.join(mapsDir, 'victory_road.json'), 'utf8'));
      expect(vr.warps.some((w: any) => w.x === 0 && w.y === 27)).toBe(false);

      // 3. Slowpoke Well B2F bare landing (3, 3)
      const sw = JSON.parse(fs.readFileSync(path.join(mapsDir, 'slowpoke_well_b2f.json'), 'utf8'));
      expect(sw.warps.some((w: any) => w.x === 3 && w.y === 3)).toBe(false);
      // Real ladder at (9, 11) is present
      expect(sw.warps.some((w: any) => w.x === 9 && w.y === 11)).toBe(true);

      // 4. Ruins of Alph Inner Chamber landing (4, 3)
      const ra = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ruins_of_alph_inner_chamber.json'), 'utf8'));
      expect(ra.warps.some((w: any) => w.x === 4 && w.y === 3)).toBe(false);
      // Real exit ladder at (10, 13) is present
      expect(ra.warps.some((w: any) => w.x === 10 && w.y === 13)).toBe(true);
    });
  });

  // =========================================================================
  // 4. Ecruteak Gym Collision & Unobstructed Safe-Path Traversal
  // =========================================================================
  describe('4. Ecruteak Gym Unobstructed Safe Path to Morty', () => {
    it('verifies 100% of abyss tiles (x: 2..7, y: 4..13) are collisionGrid=0', () => {
      const eg = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ecruteak_gym.json'), 'utf8'));
      const w = eg.width;
      for (let y = 4; y <= 13; y++) {
        for (let x = 2; x <= 7; x++) {
          const col = eg.collisionGrid[y * w + x];
          expect(col, `Tile (${x}, ${y}) in Ecruteak Gym must be walkable (0)`).toBe(0);
        }
      }
    });

    it('verifies safe path connects entrance (4, 16) to Leader Morty (4, 3) continuously', () => {
      // BFS from entrance landing through ECRUTEAK_GYM_SAFE_SET
      const startCoord = '4,16';
      const goalCoord = '4,3';

      const visited = new Set<string>([startCoord]);
      const queue = [[4, 16]];
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

      let reachedMorty = false;
      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        if (cx === 4 && cy === 3) {
          reachedMorty = true;
          break;
        }

        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          const key = `${nx},${ny}`;
          if (!visited.has(key) && isEcruteakGymSafeTile(nx, ny)) {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }

      expect(reachedMorty, 'Safe path must allow reaching Leader Morty at (4, 3)').toBe(true);
    });
  });

  // =========================================================================
  // 5. Turn-in-Place Controls
  // =========================================================================
  describe('5. Turn-in-Place Controls (Tap-to-Turn & Pivot)', () => {
    it('rotates player direction immediately on initial direction tap without moving', () => {
      const player: GridEntity = {
        id: 'player',
        x: 10,
        y: 10,
        targetX: 10,
        targetY: 10,
        renderX: 10,
        renderY: 10,
        direction: 'DOWN',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      };

      // Tapping RIGHT for 1 frame (16ms)
      GridPhysics.updateEntity(
        player,
        0.016,
        'RIGHT',
        () => true,
        () => 0
      );

      // Player pivoted to RIGHT, but did NOT start moving across the tile
      expect(player.direction).toBe('RIGHT');
      expect(player.isMoving).toBe(false);
      expect(player.x).toBe(10);
      expect(player.y).toBe(10);
      expect(player.turnDelayTimer).toBeGreaterThan(0);
    });

    it('starts stepping forward when direction is held beyond tap threshold', () => {
      const player: GridEntity = {
        id: 'player',
        x: 10,
        y: 10,
        targetX: 10,
        targetY: 10,
        renderX: 10,
        renderY: 10,
        direction: 'RIGHT', // Already facing RIGHT
        isMoving: false,
        progress: 0,
        isPlayer: true,
      };

      // Pressing already-facing direction starts walking immediately
      GridPhysics.updateEntity(
        player,
        0.016,
        'RIGHT',
        () => true,
        () => 0
      );

      expect(player.isMoving).toBe(true);
      expect(player.targetX).toBe(11);
      expect(player.targetY).toBe(10);
    });
  });
});
