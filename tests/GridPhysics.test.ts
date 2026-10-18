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
});
