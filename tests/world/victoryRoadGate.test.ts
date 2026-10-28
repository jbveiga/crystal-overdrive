import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData, WarpEvent } from '../../src/types/game';
import { createNpcsByMap } from '../../src/world/npcData';
import {
  checkHasAllJohtoBadges,
  handleVictoryRoadGateOfficer,
  handleMtSilverGateGuard,
  handleKantoGateGuard,
  handleVictoryRoadGateStep,
  getVictoryRoadGateInteractions,
} from '../../src/world/interactions/VictoryRoadGateInteractions';
import { OverworldWarpAndMapTransitionController } from '../../src/world/OverworldWarpAndMapTransitionController';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-VICTORY-ROAD-GATE-01: Victory Road Reception Gate & 8-Badge Security Gauntlet', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const gateMapPath = path.join(mapsDir, 'victory_road_gate.json');
  const gateMap: MapData = JSON.parse(fs.readFileSync(gateMapPath, 'utf8'));

  // =========================================================================
  // 1. Map & Reciprocal Warp Architecture
  // =========================================================================
  describe('1. Map Schema & 8 Reciprocal Warps', () => {
    it('verifies victory_road_gate.json dimensions (20x18) and layer data', () => {
      expect(gateMap.id).toBe('victory_road_gate');
      expect(gateMap.width).toBe(20);
      expect(gateMap.height).toBe(18);
      expect(gateMap.collisionGrid.length).toBe(20 * 18);
      expect(gateMap.groundLayer.length).toBe(20 * 18);
    });

    it('contains all 8 canonical warps connecting Route 26, Victory Road, Route 28, and Route 22', () => {
      expect(gateMap.warps.length).toBe(8);

      // South exit to Route 26 (9..10, 17)
      const southWarps = gateMap.warps.filter((w) => w.targetMapId === 'route_26');
      expect(southWarps.length).toBe(2);
      expect(southWarps).toContainEqual(expect.objectContaining({ x: 9, y: 17, targetX: 7, targetY: 6 }));
      expect(southWarps).toContainEqual(expect.objectContaining({ x: 10, y: 17, targetX: 7, targetY: 6 }));

      // North exit to Victory Road (9..10, 0)
      const northWarps = gateMap.warps.filter((w) => w.targetMapId === 'victory_road');
      expect(northWarps.length).toBe(2);
      expect(northWarps).toContainEqual(expect.objectContaining({ x: 9, y: 0, targetX: 9, targetY: 67 }));
      expect(northWarps).toContainEqual(expect.objectContaining({ x: 10, y: 0, targetX: 9, targetY: 67 }));

      // West exit to Route 28 / Mt. Silver (1..2, 7)
      const westWarps = gateMap.warps.filter((w) => w.targetMapId === 'route_28');
      expect(westWarps.length).toBe(2);
      expect(westWarps).toContainEqual(expect.objectContaining({ x: 1, y: 7, targetX: 33, targetY: 6 }));
      expect(westWarps).toContainEqual(expect.objectContaining({ x: 2, y: 7, targetX: 33, targetY: 6 }));

      // East exit to Route 22 / Viridian City (17..18, 7)
      const eastWarps = gateMap.warps.filter((w) => w.targetMapId === 'route_22');
      expect(eastWarps.length).toBe(2);
      expect(eastWarps).toContainEqual(expect.objectContaining({ x: 17, y: 7, targetX: 13, targetY: 5 }));
      expect(eastWarps).toContainEqual(expect.objectContaining({ x: 18, y: 7, targetX: 13, targetY: 5 }));
    });

    it('asserts reciprocal entry warps on Route 26 return to Victory Road Gate', () => {
      const route26: MapData = JSON.parse(
        fs.readFileSync(path.join(mapsDir, 'route_26.json'), 'utf8')
      );
      const toGate = route26.warps.filter((w) => w.targetMapId === 'victory_road_gate');
      expect(toGate.length).toBeGreaterThan(0);
      expect(toGate.some((w) => w.targetX === 9 || w.targetX === 10)).toBe(true);
      expect(toGate.some((w) => w.targetY === 17)).toBe(true);
    });
  });

  // =========================================================================
  // 2. NPC Placement & Collision Walkability
  // =========================================================================
  describe('2. Gatehouse NPC Placement & Tile Walkability', () => {
    const allNpcs = createNpcsByMap();
    const gateNpcs = allNpcs.victory_road_gate;

    it('populates exactly 3 NPCs in victory_road_gate', () => {
      expect(gateNpcs).toBeDefined();
      expect(gateNpcs.length).toBe(3);
    });

    it('asserts 100% of gatehouse NPCs stand on strictly walkable tile 0', () => {
      for (const npc of gateNpcs) {
        const tile = gateMap.collisionGrid[npc.y * gateMap.width + npc.x];
        expect(tile).toBe(0);
      }
    });

    it('verifies Officer placement at (8, 11) behind solid counter at (9, 11)', () => {
      const officer = gateNpcs.find((n) => n.id === 'victory_road_gate_officer');
      expect(officer).toBeDefined();
      expect(officer?.x).toBe(8);
      expect(officer?.y).toBe(11);
      expect(officer?.direction).toBe('RIGHT');
      expect(officer?.action).toBe('VICTORY_ROAD_GATE_OFFICER');

      // Counter tile at (9, 11) is solid 1
      expect(gateMap.collisionGrid[11 * gateMap.width + 9]).toBe(1);
      // North passage at (10, 11) is walkable 0
      expect(gateMap.collisionGrid[11 * gateMap.width + 10]).toBe(0);
    });

    it('verifies Mt. Silver guard at (7, 5) and Kanto guard at (12, 5)', () => {
      const mtSilverGuard = gateNpcs.find((n) => n.id === 'victory_road_gate_mt_silver_guard');
      expect(mtSilverGuard).toBeDefined();
      expect(mtSilverGuard?.x).toBe(7);
      expect(mtSilverGuard?.y).toBe(5);
      expect(mtSilverGuard?.direction).toBe('RIGHT');

      const kantoGuard = gateNpcs.find((n) => n.id === 'victory_road_gate_kanto_guard');
      expect(kantoGuard).toBeDefined();
      expect(kantoGuard?.x).toBe(12);
      expect(kantoGuard?.y).toBe(5);
      expect(kantoGuard?.direction).toBe('LEFT');
    });
  });

  // =========================================================================
  // 3. 8-Badge Johto Security Gauntlet
  // =========================================================================
  describe('3. 8-Badge Johto Security Gauntlet & Officer Dialogue', () => {
    let mockContext: NpcInteractionContext;
    let storyFlags: Set<string>;
    let openDialogueSpy: any;
    let showToastSpy: any;

    const all8Badges = [
      'zephyr',
      'hive',
      'plain',
      'fog',
      'storm',
      'mineral',
      'glacier',
      'rising',
    ];

    beforeEach(() => {
      storyFlags = new Set<string>();
      openDialogueSpy = vi.fn((pages: string[], speaker?: string, onClose?: () => void) => {
        onClose?.();
      });
      showToastSpy = vi.fn();

      mockContext = {
        player: { x: 9, y: 12, direction: 'UP' } as any,
        playerName: 'GOLD',
        playerParty: [],
        storyFlags,
        inventory: { badges: [] } as any,
        openDialogue: openDialogueSpy,
        showToast: showToastSpy,
        saveCurrentGame: vi.fn(),
      } as unknown as NpcInteractionContext;
    });

    it('checkHasAllJohtoBadges returns false when missing any of the 8 badges', () => {
      expect(checkHasAllJohtoBadges([], storyFlags)).toBe(false);
      expect(checkHasAllJohtoBadges(['zephyr', 'hive'], storyFlags)).toBe(false);
      expect(
        checkHasAllJohtoBadges(['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier'], storyFlags)
      ).toBe(false);
    });

    it('checkHasAllJohtoBadges returns true when all 8 badges are present', () => {
      expect(checkHasAllJohtoBadges(all8Badges, storyFlags)).toBe(true);
      // Handles badge suffix variation (e.g. rising_badge)
      expect(
        checkHasAllJohtoBadges(all8Badges.map((b) => `${b}_badge`), storyFlags)
      ).toBe(true);
    });

    it('checkHasAllJohtoBadges returns true if has_rising_badge story flag is set', () => {
      storyFlags.add('has_rising_badge');
      expect(checkHasAllJohtoBadges([], storyFlags)).toBe(true);
    });

    it('Officer turns away player when speaking without 8 badges', () => {
      mockContext.inventory.badges = ['zephyr', 'hive', 'plain'];
      const handled = handleVictoryRoadGateOfficer(
        { id: 'victory_road_gate_officer', speaker: '👮 OFFICER' } as any,
        gateMap,
        mockContext
      );
      expect(handled).toBe(true);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("I can't let you go through")]),
        '👮 OFFICER'
      );
      expect(storyFlags.has('victory_road_gate_cleared')).toBe(false);
    });

    it('Officer praises player and unlocks Victory Road when speaking with all 8 badges', () => {
      mockContext.inventory.badges = [...all8Badges];
      const handled = handleVictoryRoadGateOfficer(
        { id: 'victory_road_gate_officer', speaker: '👮 OFFICER' } as any,
        gateMap,
        mockContext
      );
      expect(handled).toBe(true);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('The eight BADGES of JOHTO!')]),
        '👮 OFFICER',
        expect.any(Function)
      );
      expect(storyFlags.has('victory_road_gate_cleared')).toBe(true);
      expect(showToastSpy).toHaveBeenCalledWith(expect.stringContaining('8 Johto Badges Verified'));
    });
  });

  // =========================================================================
  // 4. Delegated Step Coordinate Interceptor
  // =========================================================================
  describe('4. Delegated Step Coordinate Interceptor', () => {
    let player: any;
    let storyFlags: Set<string>;
    let inventory: any;
    let openDialogueSpy: any;
    let showToastSpy: any;

    const all8Badges = [
      'zephyr',
      'hive',
      'plain',
      'fog',
      'storm',
      'mineral',
      'glacier',
      'rising',
    ];

    beforeEach(() => {
      player = { x: 10, y: 11, direction: 'UP' };
      storyFlags = new Set<string>();
      inventory = { badges: [] };
      openDialogueSpy = vi.fn((pages: string[], speaker?: string, onClose?: () => void) => {
        onClose?.();
      });
      showToastSpy = vi.fn();
    });

    it('bounces unauthorized player at (10, 11) down to (10, 12) with Officer refusal', () => {
      inventory.badges = ['zephyr'];
      const blocked = handleVictoryRoadGateStep(
        { x: 10, y: 11 },
        gateMap,
        { player, inventory, storyFlags, openDialogue: openDialogueSpy, showToast: showToastSpy }
      );
      expect(blocked).toBe(true);
      expect(player.x).toBe(10);
      expect(player.y).toBe(12);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("I can't let you go through")]),
        '👮 OFFICER'
      );
    });

    it('permits authorized player at (10, 11) with all 8 badges, sets victory_road_gate_cleared', () => {
      inventory.badges = [...all8Badges];
      const blocked = handleVictoryRoadGateStep(
        { x: 10, y: 11 },
        gateMap,
        { player, inventory, storyFlags, openDialogue: openDialogueSpy, showToast: showToastSpy }
      );
      expect(blocked).toBe(true);
      expect(storyFlags.has('victory_road_gate_cleared')).toBe(true);
      expect(showToastSpy).toHaveBeenCalledWith(expect.stringContaining('Victory Road unlocked!'));
    });

    it('allows unimpeded traversal at (10, 11) on subsequent steps once already cleared', () => {
      inventory.badges = [...all8Badges];
      storyFlags.add('victory_road_gate_cleared');
      const blocked = handleVictoryRoadGateStep(
        { x: 10, y: 11 },
        gateMap,
        { player, inventory, storyFlags, openDialogue: openDialogueSpy, showToast: showToastSpy }
      );
      expect(blocked).toBe(false);
      expect(openDialogueSpy).not.toHaveBeenCalled();
    });

    it('bounces unauthorized player at Mt. Silver passage (2, 7) back to (3, 7)', () => {
      player.x = 2;
      player.y = 7;
      const blocked = handleVictoryRoadGateStep(
        { x: 2, y: 7 },
        gateMap,
        { player, inventory, storyFlags, openDialogue: openDialogueSpy, showToast: showToastSpy }
      );
      expect(blocked).toBe(true);
      expect(player.x).toBe(3);
      expect(player.y).toBe(7);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('Only a verified CHAMPION')]),
        '🥋 BLACK BELT'
      );
    });

    it('allows champion player through Mt. Silver passage (2, 7)', () => {
      player.x = 2;
      player.y = 7;
      storyFlags.add('champion_defeated');
      const blocked = handleVictoryRoadGateStep(
        { x: 2, y: 7 },
        gateMap,
        { player, inventory, storyFlags, openDialogue: openDialogueSpy, showToast: showToastSpy }
      );
      expect(blocked).toBe(false);
      expect(openDialogueSpy).not.toHaveBeenCalled();
    });

    it('bounces unauthorized player at Kanto passage (17, 7) back to (16, 7)', () => {
      player.x = 17;
      player.y = 7;
      const blocked = handleVictoryRoadGateStep(
        { x: 17, y: 7 },
        gateMap,
        { player, inventory, storyFlags, openDialogue: openDialogueSpy, showToast: showToastSpy }
      );
      expect(blocked).toBe(true);
      expect(player.x).toBe(16);
      expect(player.y).toBe(7);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('closed to incoming challengers')]),
        '🥋 BLACK BELT'
      );
    });

    it('allows champion player through Kanto passage (17, 7)', () => {
      player.x = 17;
      player.y = 7;
      storyFlags.add('champion_defeated');
      const blocked = handleVictoryRoadGateStep(
        { x: 17, y: 7 },
        gateMap,
        { player, inventory, storyFlags, openDialogue: openDialogueSpy, showToast: showToastSpy }
      );
      expect(blocked).toBe(false);
      expect(openDialogueSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 5. Guard Dialogue & Router Registration
  // =========================================================================
  describe('5. Mt. Silver / Kanto Guard Dialogues & Router', () => {
    let mockContext: NpcInteractionContext;
    let storyFlags: Set<string>;
    let openDialogueSpy: any;

    beforeEach(() => {
      storyFlags = new Set<string>();
      openDialogueSpy = vi.fn();
      mockContext = {
        player: { x: 7, y: 6 } as any,
        playerName: 'GOLD',
        playerParty: [],
        storyFlags,
        inventory: { badges: [] } as any,
        openDialogue: openDialogueSpy,
      } as unknown as NpcInteractionContext;
    });

    it('Mt. Silver guard gives warning to non-champions', () => {
      handleMtSilverGateGuard(
        { id: 'victory_road_gate_mt_silver_guard', speaker: '🥋 BLACK BELT' } as any,
        gateMap,
        mockContext
      );
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('Only a verified CHAMPION')]),
        '🥋 BLACK BELT'
      );
    });

    it('Mt. Silver guard welcomes champions', () => {
      storyFlags.add('champion_defeated');
      handleMtSilverGateGuard(
        { id: 'victory_road_gate_mt_silver_guard', speaker: '🥋 BLACK BELT' } as any,
        gateMap,
        mockContext
      );
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('Welcome, CHAMPION!')]),
        '🥋 BLACK BELT'
      );
    });

    it('Kanto guard informs non-champions that route to Viridian is closed', () => {
      handleKantoGateGuard(
        { id: 'victory_road_gate_kanto_guard', speaker: '🥋 BLACK BELT' } as any,
        gateMap,
        mockContext
      );
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('closed to incoming challengers')]),
        '🥋 BLACK BELT'
      );
    });

    it('Kanto guard wishes safe travels to champions', () => {
      storyFlags.add('champion_defeated');
      handleKantoGateGuard(
        { id: 'victory_road_gate_kanto_guard', speaker: '🥋 BLACK BELT' } as any,
        gateMap,
        mockContext
      );
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('The road to VIRIDIAN CITY is open!')]),
        '🥋 BLACK BELT'
      );
    });

    it('registers all 3 Victory Road Gate interactions in getVictoryRoadGateInteractions', () => {
      const interactions = getVictoryRoadGateInteractions();
      expect(interactions.length).toBe(3);
      expect(interactions.some((i) => i.actions?.includes('VICTORY_ROAD_GATE_OFFICER'))).toBe(true);
      expect(interactions.some((i) => i.actions?.includes('MT_SILVER_GATE_GUARD'))).toBe(true);
      expect(interactions.some((i) => i.actions?.includes('KANTO_GATE_GUARD'))).toBe(true);
    });
  });

  // =========================================================================
  // 6. Defensive Warp Interceptions
  // =========================================================================
  describe('6. Defensive Warp Interception in OverworldWarpAndMapTransitionController', () => {
    it('defensively aborts warp to victory_road without 8 badges', async () => {
      const openDialogueSpy = vi.fn();
      const setCutsceneLockedSpy = vi.fn();

      const mockCtx: any = {
        mapManager: {
          getCurrentMap: () => gateMap,
          getMap: (id: string) => (id === 'victory_road' ? { id: 'victory_road' } : null),
        },
        storyFlags: new Set<string>(),
        player: { x: 10, y: 0, isMoving: true, progress: 0.5 },
        setCutsceneLocked: setCutsceneLockedSpy,
        overworldHUD: { openDialogue: openDialogueSpy },
        inventory: { badges: ['zephyr', 'hive'] },
      };

      await OverworldWarpAndMapTransitionController.executeWarpTransition(
        mockCtx,
        { x: 10, y: 0, targetMapId: 'victory_road', targetX: 9, targetY: 67 }
      );

      expect(mockCtx.player.isMoving).toBe(false);
      expect(setCutsceneLockedSpy).toHaveBeenCalledWith(false);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("I can't let you go through")]),
        '👮 OFFICER'
      );
    });

    it('defensively aborts warp to route_28 without champion_defeated', async () => {
      const openDialogueSpy = vi.fn();
      const setCutsceneLockedSpy = vi.fn();

      const mockCtx: any = {
        mapManager: {
          getCurrentMap: () => gateMap,
          getMap: (id: string) => (id === 'route_28' ? { id: 'route_28' } : null),
        },
        storyFlags: new Set<string>(),
        player: { x: 1, y: 7, isMoving: true, progress: 0.5 },
        setCutsceneLocked: setCutsceneLockedSpy,
        overworldHUD: { openDialogue: openDialogueSpy },
        inventory: { badges: [] },
      };

      await OverworldWarpAndMapTransitionController.executeWarpTransition(
        mockCtx,
        { x: 1, y: 7, targetMapId: 'route_28', targetX: 33, targetY: 6 }
      );

      expect(mockCtx.player.isMoving).toBe(false);
      expect(setCutsceneLockedSpy).toHaveBeenCalledWith(false);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('Only a verified CHAMPION')]),
        '🥋 BLACK BELT'
      );
    });

    it('defensively aborts warp to route_22 without champion_defeated', async () => {
      const openDialogueSpy = vi.fn();
      const setCutsceneLockedSpy = vi.fn();

      const mockCtx: any = {
        mapManager: {
          getCurrentMap: () => gateMap,
          getMap: (id: string) => (id === 'route_22' ? { id: 'route_22' } : null),
        },
        storyFlags: new Set<string>(),
        player: { x: 17, y: 7, isMoving: true, progress: 0.5 },
        setCutsceneLocked: setCutsceneLockedSpy,
        overworldHUD: { openDialogue: openDialogueSpy },
        inventory: { badges: [] },
      };

      await OverworldWarpAndMapTransitionController.executeWarpTransition(
        mockCtx,
        { x: 17, y: 7, targetMapId: 'route_22', targetX: 13, targetY: 5 }
      );

      expect(mockCtx.player.isMoving).toBe(false);
      expect(setCutsceneLockedSpy).toHaveBeenCalledWith(false);
      expect(openDialogueSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('closed to incoming challengers')]),
        '🥋 BLACK BELT'
      );
    });
  });
});
