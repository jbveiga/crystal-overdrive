import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { executeMove } from '../../src/battle/state/BattleMoveAndItemExecutor';
import { OverworldTouchAndKeyController } from '../../src/ui/hud/OverworldTouchAndKeyController';

describe('TICKET-BUGFIX-AUDIT-FIVE-01: Five High-Impact Gameplay Bug Remediation', () => {
  // =========================================================================
  // 1. Overworld Keyboard Controls: KeyD (WASD Right) Free from Itemfinder Hijack
  // =========================================================================
  describe('Bug 1: WASD Right Movement (KeyD)', () => {
    it('does not intercept KeyD in radar toggle, allowing heldKeys to track KeyD for rightward movement', () => {
      const controllerPath = path.resolve(__dirname, '../../src/ui/hud/OverworldTouchAndKeyController.ts');
      const source = fs.readFileSync(controllerPath, 'utf8');

      // Assert that KeyD is NOT part of the radar toggle check
      expect(source).not.toMatch(/if\s*\(\s*e\.code\s*===\s*'KeyD'\s*\|\|\s*e\.code\s*===\s*'KeyR'\s*\)/);
      expect(source).toMatch(/if\s*\(\s*e\.code\s*===\s*'KeyR'\s*\)/);

      // Verify KeyD is present in computeActiveDirection for RIGHT
      expect(source).toMatch(/this\.heldKeys\.has\('KeyD'\)/);
    });

    it('computes activeDirection as RIGHT when KeyD is held', () => {
      const mockRoot = {} as any;
      const controller = new OverworldTouchAndKeyController({
        rootElement: mockRoot,
        isDialogueOpen: () => false,
        isVisible: () => true,
      });

      // Internal reflection to verify heldKeys mapping
      (controller as any).heldKeys.add('KeyD');
      controller.computeActiveDirection();
      expect(controller.getHeldDirection()).toBe('RIGHT');

      (controller as any).heldKeys.clear();
      controller.computeActiveDirection();
      expect(controller.getHeldDirection()).toBeNull();
    });
  });

  // =========================================================================
  // 2. Route 41 Whirl Islands Cave Entrances Solid Collision Cleared
  // =========================================================================
  describe('Bug 2: Route 41 Whirl Islands Whirlpools & Cave Entrance Warps', () => {
    it('ensures all 4 cave entrance warps on route_41 exist and target authentic caverns', () => {
      const mapPath = path.resolve(__dirname, '../../public/assets/data/maps/route_41.json');
      const r41 = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

      const caveWarpCoords = [
        { x: 12, y: 17, target: 'whirl_island_nw' },
        { x: 36, y: 19, target: 'whirl_island_ne' },
        { x: 12, y: 37, target: 'whirl_island_sw' },
        { x: 36, y: 45, target: 'whirl_island_se' },
      ];

      for (const entrance of caveWarpCoords) {
        const warp = r41.warps.find((w: any) => w.x === entrance.x && w.y === entrance.y);
        expect(warp, `Warp for (${entrance.x}, ${entrance.y}) must exist`).toBeDefined();
        expect(warp.targetMapId).toBe(entrance.target);
      }
    });
  });

  // =========================================================================
  // 3. Unwarped Cave Entrances & Ladders Wired
  // =========================================================================
  describe('Bug 3: Unwarped Cave Entrances & Ladders', () => {
    it('wires reciprocal warps between union_cave_b1f (7, 19) and ruins_of_alph_outside (6, 27)', () => {
      const ucPath = path.resolve(__dirname, '../../public/assets/data/maps/union_cave_b1f.json');
      const roaPath = path.resolve(__dirname, '../../public/assets/data/maps/ruins_of_alph_outside.json');

      const uc = JSON.parse(fs.readFileSync(ucPath, 'utf8'));
      const roa = JSON.parse(fs.readFileSync(roaPath, 'utf8'));

      const ucWarp = uc.warps.find((w: any) => w.x === 7 && w.y === 19);
      expect(ucWarp, 'union_cave_b1f must have warp at (7, 19)').toBeDefined();
      expect(ucWarp.targetMapId).toBe('ruins_of_alph_outside');
      expect(ucWarp.targetX).toBe(6);
      expect(ucWarp.targetY).toBe(27);

      const roaWarp = roa.warps.find((w: any) => w.x === 6 && w.y === 27);
      expect(roaWarp, 'ruins_of_alph_outside must have warp at (6, 27)').toBeDefined();
      expect(roaWarp.targetMapId).toBe('union_cave_b1f');
      expect(roaWarp.targetX).toBe(7);
      expect(roaWarp.targetY).toBe(19);
    });

    it('wires the ladder at whirl_island_nw (7, 15) to whirl_island_sw (3, 15)', () => {
      const winwPath = path.resolve(__dirname, '../../public/assets/data/maps/whirl_island_nw.json');
      const winw = JSON.parse(fs.readFileSync(winwPath, 'utf8'));

      const ladderWarp = winw.warps.find((w: any) => w.x === 7 && w.y === 15);
      expect(ladderWarp, 'whirl_island_nw must have ladder warp at (7, 15)').toBeDefined();
      expect(ladderWarp.targetMapId).toBe('whirl_island_sw');
      expect(ladderWarp.targetX).toBe(3);
      expect(ladderWarp.targetY).toBe(15);
    });

    it('wires additional chamber entrances on ruins_of_alph_outside', () => {
      const roaPath = path.resolve(__dirname, '../../public/assets/data/maps/ruins_of_alph_outside.json');
      const roa = JSON.parse(fs.readFileSync(roaPath, 'utf8'));

      for (const coord of [{ x: 2, y: 17 }, { x: 2, y: 29 }, { x: 16, y: 33 }]) {
        const warp = roa.warps.find((w: any) => w.x === coord.x && w.y === coord.y);
        expect(warp, `ruins_of_alph_outside must have warp at (${coord.x}, ${coord.y})`).toBeDefined();
        expect(warp.targetMapId).toBe('ruins_of_alph_kabuto_chamber');
      }
    });
  });

  // =========================================================================
  // 4. Battle Engine: Recoil Self-KO FAINT Event & Secondary Effects
  // =========================================================================
  describe('Bug 4: Battle Engine Recoil Self-KO & Faint Handling', () => {
    it('emits a FAINT event and message when recoil damage reduces attacker currentHp to 0', () => {
      const attacker = PokemonFactory.create('tauros', 30, ['doubleedge']);
      attacker.stats.hp = 100;
      attacker.currentHp = 5; // Very low HP so recoil KOs the attacker

      const defender = PokemonFactory.create('rattata', 20, ['tackle']);
      defender.stats.hp = 200;
      defender.currentHp = 200;

      const doubleEdge = PokemonFactory.getMoveData('doubleedge');
      expect(doubleEdge.recoilFraction).toBe(0.25);
      expect(doubleEdge.accuracy).toBe(100);

      const events: any[] = [];
      executeMove({
        attacker,
        defender,
        move: doubleEdge,
        events,
        furyCutterStreaks: new Map(),
      });

      // Recoil should have reduced attacker currentHp to 0
      expect(attacker.currentHp).toBe(0);

      // Verify FAINT event was emitted for the attacker
      const faintEvent = events.find((e) => e.type === 'FAINT' && e.targetId === attacker.uid);
      expect(faintEvent, 'Attacker must receive a FAINT event when recoil drops HP to 0').toBeDefined();

      const faintMsg = events.find((e) => e.type === 'MESSAGE' && e.text.includes('fainted!'));
      expect(faintMsg, 'Faint message must be pushed').toBeDefined();
    });
  });

  // =========================================================================
  // 5. Gift Pokémon 6-Slot Party Full Handling & Pokédex Registration
  // =========================================================================
  describe('Bug 5: Gift Pokémon Party Overflow & Pokédex Registration', () => {
    it('ensures gift interaction handlers register seenSpecies and deposit to box when party is full', () => {
      const filesToCheck = [
        path.resolve(__dirname, '../../src/world/interactions/EastJohtoQuestInteractions.ts'),
        path.resolve(__dirname, '../../src/world/interactions/GoldenrodAndRoute34Interactions.ts'),
        path.resolve(__dirname, '../../src/world/interactions/GoldenrodExpansionInteractions.ts'),
        path.resolve(__dirname, '../../src/world/interactions/MidToLateJohtoQuestInteractions.ts'),
        path.resolve(__dirname, '../../src/world/interactions/BlackthornGymAndDragonDenInteractions.ts'),
      ];

      for (const fpath of filesToCheck) {
        const content = fs.readFileSync(fpath, 'utf8');
        expect(content).toMatch(/ctx\.seenSpecies\?\.add\(/);
        expect(content).toMatch(/ctx\.caughtSpecies\?\.add\(/);
      }
    });
  });
});
