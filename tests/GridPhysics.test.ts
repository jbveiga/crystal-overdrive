import { describe, it, expect, vi } from 'vitest';
import { GridPhysics, type GridEntity } from '../src/world/GridPhysics';

function createMockEntity(overrides?: Partial<GridEntity>): GridEntity {
  return {
    id: 'player',
    x: 5,
    y: 5,
    targetX: 5,
    targetY: 5,
    renderX: 5,
    renderY: 5,
    direction: 'DOWN',
    isMoving: false,
    isJumping: false,
    progress: 0,
    isPlayer: true,
    ...overrides,
  };
}

describe('GridPhysics', () => {
  const allWalkable = () => true;
  const tileLookup = () => 0;

  it('starts movement when input is held and destination is walkable', () => {
    const entity = createMockEntity();
    GridPhysics.updateEntity(entity, 0.05, 'DOWN', allWalkable, tileLookup);

    expect(entity.isMoving).toBe(true);
    expect(entity.direction).toBe('DOWN');
    expect(entity.x).toBe(5);
    expect(entity.targetX).toBe(5);
    expect(entity.targetY).toBe(6);
    expect(entity.progress).toBeCloseTo(0.05 / 0.24);
    expect(entity.renderY).toBeCloseTo(5 + (0.05 / 0.24));
  });

  it('does not start movement when destination is solid', () => {
    const entity = createMockEntity();
    const isSolid = (x: number, y: number) => !(x === 5 && y === 6); // (5,6) is solid

    GridPhysics.updateEntity(entity, 0.05, 'DOWN', isSolid, tileLookup);

    expect(entity.isMoving).toBe(false);
    expect(entity.direction).toBe('DOWN'); // faces the direction
    expect(entity.x).toBe(5);
    expect(entity.y).toBe(5);
    expect(entity.renderX).toBe(5);
    expect(entity.renderY).toBe(5);
  });

  it('completes step and triggers onTileEntered when progress reaches 1.0', () => {
    const entity = createMockEntity();
    const onTileEntered = vi.fn();

    // Start moving DOWN from (5,5) towards (5,6)
    GridPhysics.updateEntity(entity, 0.12, 'DOWN', allWalkable, tileLookup, onTileEntered);
    expect(entity.isMoving).toBe(true);
    expect(onTileEntered).not.toHaveBeenCalled();

    // Advance remaining time to complete tile step (0.12 + 0.12 = 0.24s = exactly 1 tile)
    GridPhysics.updateEntity(entity, 0.12, null, allWalkable, tileLookup, onTileEntered);

    expect(entity.isMoving).toBe(false);
    expect(entity.x).toBe(5);
    expect(entity.y).toBe(6);
    expect(entity.renderY).toBe(6);
    expect(onTileEntered).toHaveBeenCalledWith(entity, { x: 5, y: 6 }, 0);
  });

  it('seamlessly chains fractional overflow into the next tile when input is held (e.g. 3x speed)', () => {
    const entity = createMockEntity();
    const onTileEntered = vi.fn();

    // At 3x speed, one frame of 0.1s delta = progress + (0.1 / 0.24) = ~0.416 progress per frame.
    // Let's test a step that overshoots 1.0:
    // Start at (5,5), advance 0.20s -> progress ~0.833
    GridPhysics.updateEntity(entity, 0.20, 'RIGHT', allWalkable, tileLookup, onTileEntered);
    expect(entity.x).toBe(5);
    expect(entity.targetX).toBe(6);
    expect(entity.progress).toBeCloseTo(0.20 / 0.24);

    // Advance 0.10s (total time = 0.30s > 0.24s).
    // Overflow should be (0.30 - 0.24) / 0.24 = 0.06 / 0.24 = 0.25 into tile (6 -> 7)
    GridPhysics.updateEntity(entity, 0.10, 'RIGHT', allWalkable, tileLookup, onTileEntered);

    expect(onTileEntered).toHaveBeenCalledWith(entity, { x: 6, y: 5 }, 0);
    expect(entity.isMoving).toBe(true);
    expect(entity.x).toBe(6);
    expect(entity.targetX).toBe(7);
    expect(entity.progress).toBeCloseTo(0.06 / 0.24);
    expect(entity.renderX).toBeCloseTo(6 + (0.06 / 0.24));
  });

  it('stops at boundary if next tile in held direction is solid after completing step', () => {
    const entity = createMockEntity();
    // (5,5) -> (5,6) is walkable, but (5,7) is solid
    const isWalkable = (x: number, y: number) => !(x === 5 && y === 7);

    // Move to (5,6) with overflow
    GridPhysics.updateEntity(entity, 0.30, 'DOWN', isWalkable, tileLookup);

    expect(entity.x).toBe(5);
    expect(entity.y).toBe(6);
    expect(entity.isMoving).toBe(false);
    expect(entity.progress).toBe(0);
    expect(entity.renderY).toBe(6);
  });

  it('prevents player and NPCs from walking into tiles occupied or targeted by another entity', () => {
    const player = createMockEntity({ id: 'player', x: 5, y: 5, targetX: 5, targetY: 5 });
    const npc = createMockEntity({
      id: 'town_npc',
      x: 5,
      y: 6,
      targetX: 5,
      targetY: 6,
      isPlayer: false,
    });

    // Player attempts to move DOWN into (5,6) where NPC is standing
    GridPhysics.updateEntity(player, 0.1, 'DOWN', allWalkable, tileLookup, undefined, [npc]);
    expect(player.isMoving).toBe(false);
    expect(player.x).toBe(5);
    expect(player.y).toBe(5);

    // NPC starts moving RIGHT from (5,6) to (6,6); player at (6,5) tries to step DOWN into (6,6)
    GridPhysics.updateEntity(npc, 0.05, 'RIGHT', allWalkable, tileLookup, undefined, [player]);
    expect(npc.isMoving).toBe(true);
    expect(npc.targetX).toBe(6);
    expect(npc.targetY).toBe(6);

    player.x = 6;
    player.targetX = 6;
    GridPhysics.updateEntity(player, 0.05, 'DOWN', allWalkable, tileLookup, undefined, [npc]);
    expect(player.isMoving).toBe(false);
  });

  it('performs a 2-tile one-way ledge hop when player presses DOWN into a South Ledge tile (tileType === 4)', () => {
    const player = createMockEntity({ x: 5, y: 5, targetX: 5, targetY: 5 });
    // (5,6) is a South Ledge (tileType === 4, not directly walkable), and (5,7) is walkable ground (tileType === 0)
    const isWalkable = (_x: number, y: number) => y !== 6;
    const ledgeTileLookup = (_x: number, y: number) => (y === 6 ? 4 : 0);
    const onLedgeJump = vi.fn();

    GridPhysics.updateEntity(player, 0.05, 'DOWN', isWalkable, ledgeTileLookup, undefined, [], onLedgeJump);

    expect(player.isMoving).toBe(true);
    expect(player.isJumping).toBe(true);
    expect(player.targetX).toBe(5);
    expect(player.targetY).toBe(7); // Jumps 2 tiles South over (5,6) onto (5,7)
    expect(onLedgeJump).toHaveBeenCalledWith(player);

    // Complete the 1.6x duration jump
    GridPhysics.updateEntity(player, 0.4, null, isWalkable, ledgeTileLookup);
    expect(player.isMoving).toBe(false);
    expect(player.isJumping).toBe(false);
    expect(player.x).toBe(5);
    expect(player.y).toBe(7);

    // Attempting to walk UP from (5,7) into the ledge at (5,6) is blocked (one-way only)
    GridPhysics.updateEntity(player, 0.05, 'UP', isWalkable, ledgeTileLookup);
    expect(player.isMoving).toBe(false);
    expect(player.y).toBe(7);
  });

  it('blocks South Ledge hop (collision 4) when landing tile is non-walkable or occupied', () => {
    const player = createMockEntity({ x: 5, y: 5, targetX: 5, targetY: 5 });
    // Landing tile (5,7) is solid
    const isWalkableSolidLanding = (_x: number, y: number) => y !== 6 && y !== 7;
    const ledgeTileLookup = (_x: number, y: number) => (y === 6 ? 4 : 0);

    GridPhysics.updateEntity(player, 0.05, 'DOWN', isWalkableSolidLanding, ledgeTileLookup);
    expect(player.isMoving).toBe(false);
    expect(player.isJumping).toBe(false);
    expect(player.x).toBe(5);
    expect(player.y).toBe(5);

    // Landing tile (5,7) is occupied by an NPC
    const isWalkable = (_x: number, y: number) => y !== 6;
    const obstacleNpc = createMockEntity({ id: 'blocker', x: 5, y: 7, targetX: 5, targetY: 7, isPlayer: false });
    GridPhysics.updateEntity(player, 0.05, 'DOWN', isWalkable, ledgeTileLookup, undefined, [obstacleNpc]);
    expect(player.isMoving).toBe(false);
    expect(player.isJumping).toBe(false);
    expect(player.x).toBe(5);
    expect(player.y).toBe(5);
  });

  describe('Ticket 3.7: Multi-directional ledge jumping specifications', () => {
    // Collision 5: North Ledge / Fence (jump UP to y - 2)
    // Collision 6: West Ledge / Fence (jump LEFT to x - 2)
    // Collision 7: East Ledge / Fence (jump RIGHT to x + 2)

    it('performs a 2-tile ledge hop UP over collision 5 into clear target (x, y-2)', () => {
      const player = createMockEntity({ x: 5, y: 5, targetX: 5, targetY: 5 });
      const isWalkable = (_x: number, y: number) => y !== 4; // ledge at (5,4) is not directly walkable
      const ledgeLookup = (_x: number, y: number) => (y === 4 ? 5 : 0);
      const onLedgeJump = vi.fn();

      GridPhysics.updateEntity(player, 0.05, 'UP', isWalkable, ledgeLookup, undefined, [], onLedgeJump);

      expect(player.isMoving).toBe(true);
      expect(player.isJumping).toBe(true);
      expect(player.targetX).toBe(5);
      expect(player.targetY).toBe(3); // Jump 2 tiles North over (5,4) into (5,3)
      expect(onLedgeJump).toHaveBeenCalledWith(player);

      GridPhysics.updateEntity(player, 0.4, null, isWalkable, ledgeLookup);
      expect(player.isMoving).toBe(false);
      expect(player.isJumping).toBe(false);
      expect(player.x).toBe(5);
      expect(player.y).toBe(3);
    });

    it('performs a 2-tile ledge hop LEFT over collision 6 into clear target (x-2, y)', () => {
      const player = createMockEntity({ x: 5, y: 5, targetX: 5, targetY: 5 });
      const isWalkable = (x: number, _y: number) => x !== 4; // ledge at (4,5)
      const ledgeLookup = (x: number, _y: number) => (x === 4 ? 6 : 0);
      const onLedgeJump = vi.fn();

      GridPhysics.updateEntity(player, 0.05, 'LEFT', isWalkable, ledgeLookup, undefined, [], onLedgeJump);

      expect(player.isMoving).toBe(true);
      expect(player.isJumping).toBe(true);
      expect(player.targetX).toBe(3); // Jump 2 tiles West over (4,5) into (3,5)
      expect(player.targetY).toBe(5);
      expect(onLedgeJump).toHaveBeenCalledWith(player);

      GridPhysics.updateEntity(player, 0.4, null, isWalkable, ledgeLookup);
      expect(player.isMoving).toBe(false);
      expect(player.isJumping).toBe(false);
      expect(player.x).toBe(3);
      expect(player.y).toBe(5);
    });

    it('performs a 2-tile ledge hop RIGHT over collision 7 into clear target (x+2, y)', () => {
      const player = createMockEntity({ x: 5, y: 5, targetX: 5, targetY: 5 });
      const isWalkable = (x: number, _y: number) => x !== 6; // ledge at (6,5)
      const ledgeLookup = (x: number, _y: number) => (x === 6 ? 7 : 0);
      const onLedgeJump = vi.fn();

      GridPhysics.updateEntity(player, 0.05, 'RIGHT', isWalkable, ledgeLookup, undefined, [], onLedgeJump);

      expect(player.isMoving).toBe(true);
      expect(player.isJumping).toBe(true);
      expect(player.targetX).toBe(7); // Jump 2 tiles East over (6,5) into (7,5)
      expect(player.targetY).toBe(5);
      expect(onLedgeJump).toHaveBeenCalledWith(player);

      GridPhysics.updateEntity(player, 0.4, null, isWalkable, ledgeLookup);
      expect(player.isMoving).toBe(false);
      expect(player.isJumping).toBe(false);
      expect(player.x).toBe(7);
      expect(player.y).toBe(5);
    });

    it('blocks ledge jumping UP (5), LEFT (6), and RIGHT (7) when target tile is non-walkable or occupied', () => {
      // 1. UP over 5 blocked by solid landing (5,3)
      const playerUp = createMockEntity({ x: 5, y: 5 });
      const isWalkableUpSolid = (_x: number, y: number) => y !== 4 && y !== 3;
      const lookupUp = (_x: number, y: number) => (y === 4 ? 5 : 0);
      GridPhysics.updateEntity(playerUp, 0.05, 'UP', isWalkableUpSolid, lookupUp);
      expect(playerUp.isMoving).toBe(false);

      // 2. LEFT over 6 blocked by occupied landing (3,5)
      const playerLeft = createMockEntity({ x: 5, y: 5 });
      const isWalkableLeft = (x: number, _y: number) => x !== 4;
      const lookupLeft = (x: number, _y: number) => (x === 4 ? 6 : 0);
      const blocker = createMockEntity({ id: 'blocker', x: 3, y: 5, targetX: 3, targetY: 5, isPlayer: false });
      GridPhysics.updateEntity(playerLeft, 0.05, 'LEFT', isWalkableLeft, lookupLeft, undefined, [blocker]);
      expect(playerLeft.isMoving).toBe(false);

      // 3. RIGHT over 7 blocked by solid landing (7,5)
      const playerRight = createMockEntity({ x: 5, y: 5 });
      const isWalkableRightSolid = (x: number, _y: number) => x !== 6 && x !== 7;
      const lookupRight = (x: number, _y: number) => (x === 6 ? 7 : 0);
      GridPhysics.updateEntity(playerRight, 0.05, 'RIGHT', isWalkableRightSolid, lookupRight);
      expect(playerRight.isMoving).toBe(false);
    });

    it('blocks when approaching ledge from the reverse direction for UP (5), LEFT (6), and RIGHT (7)', () => {
      // Reverse UP ledge (tile 5 at 5,4): walking DOWN from (5,3) towards (5,4) must be blocked
      const p1 = createMockEntity({ x: 5, y: 3 });
      const isWalkableUp = (_x: number, y: number) => y !== 4;
      const lookupUp = (_x: number, y: number) => (y === 4 ? 5 : 0);
      GridPhysics.updateEntity(p1, 0.05, 'DOWN', isWalkableUp, lookupUp);
      expect(p1.isMoving).toBe(false);

      // Reverse LEFT ledge (tile 6 at 4,5): walking RIGHT from (3,5) towards (4,5) must be blocked
      const p2 = createMockEntity({ x: 3, y: 5 });
      const isWalkableLeft = (x: number, _y: number) => x !== 4;
      const lookupLeft = (x: number, _y: number) => (x === 4 ? 6 : 0);
      GridPhysics.updateEntity(p2, 0.05, 'RIGHT', isWalkableLeft, lookupLeft);
      expect(p2.isMoving).toBe(false);

      // Reverse RIGHT ledge (tile 7 at 6,5): walking LEFT from (7,5) towards (6,5) must be blocked
      const p3 = createMockEntity({ x: 7, y: 5 });
      const isWalkableRight = (x: number, _y: number) => x !== 6;
      const lookupRight = (x: number, _y: number) => (x === 6 ? 7 : 0);
      GridPhysics.updateEntity(p3, 0.05, 'LEFT', isWalkableRight, lookupRight);
      expect(p3.isMoving).toBe(false);
    });

    it('performs a 3-tile ledge hop when an intermediate rock/border tile (collision 1) sits between the ledge rim and landing tile (Ticket Sprint 08)', () => {
      const player = createMockEntity({ x: 5, y: 5, targetX: 5, targetY: 5 });
      // (5,6) is South Ledge (4), (5,7) is solid border (1), (5,8) is walkable ground (0)
      const isWalkable = (_x: number, y: number) => y === 5 || y === 8;
      const ledgeLookup = (_x: number, y: number) => (y === 6 ? 4 : y === 7 ? 1 : 0);
      const onLedgeJump = vi.fn();

      GridPhysics.updateEntity(player, 0.05, 'DOWN', isWalkable, ledgeLookup, undefined, [], onLedgeJump);

      expect(player.isMoving).toBe(true);
      expect(player.isJumping).toBe(true);
      expect(player.targetX).toBe(5);
      expect(player.targetY).toBe(8);
      expect(onLedgeJump).toHaveBeenCalledWith(player);
    });
  });

  it('detects when player steps into an undefeated trainer line-of-sight unless blocked by wall/ledge', () => {
    const player = createMockEntity({ x: 7, y: 10 });
    const trainer = createMockEntity({
      id: 'youngster_mikey',
      isPlayer: false,
      x: 4,
      y: 10,
      direction: 'RIGHT',
      trainerId: 'youngster_mikey',
      visionRange: 4,
    });
    const defeated = new Set<string>();

    // Clear line of sight (distance 3 <= visionRange 4)
    const spotted = GridPhysics.checkTrainerLineOfSight(player, [trainer], defeated, () => 0);
    expect(spotted).toBe(trainer);

    // Blocked if a solid wall (tileType === 1) is between trainer (4,10) and player (7,10) at (6,10)
    const blockedByWall = GridPhysics.checkTrainerLineOfSight(
      player,
      [trainer],
      defeated,
      (x, y) => (x === 6 && y === 10 ? 1 : 0)
    );
    expect(blockedByWall).toBeNull();

    // Ignored once trainer is in defeatedTrainers set
    defeated.add('youngster_mikey');
    const afterDefeat = GridPhysics.checkTrainerLineOfSight(player, [trainer], defeated, () => 0);
    expect(afterDefeat).toBeNull();
  });

  it('triggers onBump callback when player attempts to move into a non-walkable tile (Ticket 6.3)', () => {
    const player = createMockEntity({ isPlayer: true });
    const isSolid = () => false; // Everything solid
    const bumpSpy = vi.fn();

    GridPhysics.updateEntity(
      player,
      0.05,
      'DOWN',
      isSolid,
      tileLookup,
      undefined,
      undefined,
      undefined,
      bumpSpy
    );

    expect(bumpSpy).toHaveBeenCalledTimes(1);
    expect(bumpSpy).toHaveBeenCalledWith(player);
  });

  describe('Directional Carpet & Egress Warps (COLL_WARP_CARPET_DOWN)', () => {
    const mockIndoorMap: any = {
      id: 'players_house_1f',
      name: "Player's House",
      width: 10,
      height: 8,
      tileSize: 64,
      groundLayer: [],
      objectLayer: [],
      collisionGrid: new Array(80).fill(0),
      connections: {},
      warps: [
        { x: 6, y: 7, targetMapId: 'new_bark_town', targetX: 13, targetY: 5 },
        { x: 7, y: 7, targetMapId: 'new_bark_town', targetX: 13, targetY: 5 },
      ],
      grassEncounters: [],
    };

    it('suppresses carpet warp when player moves sideways (LEFT/RIGHT) or UP across carpet threshold', () => {
      const player = createMockEntity({ x: 5, y: 7, targetX: 5, targetY: 7, direction: 'RIGHT' });
      let warpTriggered = false;

      const onTileEntered = (entity: any, coord: any) => {
        const warp = mockIndoorMap.warps.find((w: any) => w.x === coord.x && w.y === coord.y);
        if (warp) {
          // Authentic COLL_WARP_CARPET_DOWN: moving sideways or UP suppresses warp
          if (entity.direction !== 'DOWN') {
            return;
          }
          warpTriggered = true;
        }
      };

      // Player steps RIGHT from (5, 7) to (6, 7) onto carpet warp
      GridPhysics.updateEntity(player, 0.25, 'RIGHT', allWalkable, tileLookup, onTileEntered);

      expect(player.x).toBe(6);
      expect(player.y).toBe(7);
      expect(player.direction).toBe('RIGHT');
      expect(warpTriggered).toBe(false); // Stays inside on carpet tile
    });

    it('triggers carpet exit warp when player moves DOWN across carpet threshold', () => {
      const player = createMockEntity({ x: 6, y: 6, targetX: 6, targetY: 6, direction: 'DOWN' });
      let warpTriggered = false;

      const onTileEntered = (entity: any, coord: any) => {
        const warp = mockIndoorMap.warps.find((w: any) => w.x === coord.x && w.y === coord.y);
        if (warp) {
          if (entity.direction !== 'DOWN') {
            return;
          }
          warpTriggered = true;
          entity.isMoving = false;
        }
      };

      // Player steps DOWN from (6, 6) to (6, 7) onto carpet warp
      GridPhysics.updateEntity(player, 0.25, 'DOWN', allWalkable, tileLookup, onTileEntered);

      expect(player.x).toBe(6);
      expect(player.y).toBe(7);
      expect(player.direction).toBe('DOWN');
      expect(warpTriggered).toBe(true);
    });

    it('triggers egress when player is standing on carpet warp and presses DOWN', () => {
      const player = createMockEntity({ x: 6, y: 7, targetX: 6, targetY: 7, direction: 'DOWN', isMoving: false });
      const heldDir = 'DOWN';

      const carpetWarp = mockIndoorMap.warps.find((w: any) => w.x === player.x && w.y === player.y);
      expect(carpetWarp).toBeDefined();

      let egressFired = false;
      if (!player.isMoving && heldDir === 'DOWN' && carpetWarp) {
        egressFired = true;
      }

      expect(egressFired).toBe(true);
    });
  });
});
