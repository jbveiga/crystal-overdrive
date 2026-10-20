import type { Direction, TileCoord } from '../types/game';

export type NpcSpriteType =
  | 'boy'
  | 'girl'
  | 'fat_man'
  | 'kris'
  | 'silver'
  | 'fisherman'
  | 'bug_catcher'
  | 'teacher'
  | 'mom'
  | 'prof_elm';

export interface GridEntity {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  renderX: number;
  renderY: number;
  direction: Direction;
  isMoving: boolean;
  isJumping?: boolean;
  progress: number;
  isPlayer: boolean;
  worldOffsetX?: number;
  worldOffsetY?: number;
  spriteType?: NpcSpriteType;
  speaker?: string;
  pages?: string[];
  wanders?: boolean;
  talkAcrossCounter?: boolean;
  action?:
    | 'HEAL_AND_SAVE'
    | 'OPEN_MART'
    | 'TRAINER_BATTLE'
    | 'TRAINER_JOEY'
    | 'MR_POKEMON_EVENT'
    | 'BERRY_MAN_EVENT';
  trainerId?: string;
  trainerName?: string;
  visionRange?: number;
  challengePages?: string[];
  trainerPokemon?: {
    speciesId: string;
    level: number;
    moves?: string[];
  };
}

export type CollisionCheck = (x: number, y: number) => boolean;
export type TileTypeLookup = (x: number, y: number) => number;
export type TileEnteredCallback = (entity: GridEntity, coord: TileCoord, tileType: number) => void;
export type LedgeJumpCallback = (entity: GridEntity) => void;

export class GridPhysics {
  public static readonly BASE_TRAVERSAL_TIME: number = 0.24; // 0.24 seconds per tile at 1x speed

  /**
   * Helper to get integer delta for a direction
   */
  public static getDirectionDelta(dir: Direction): { dx: number; dy: number } {
    switch (dir) {
      case 'UP':
        return { dx: 0, dy: -1 };
      case 'DOWN':
        return { dx: 0, dy: 1 };
      case 'LEFT':
        return { dx: -1, dy: 0 };
      case 'RIGHT':
        return { dx: 1, dy: 0 };
    }
  }

  /**
   * Zero-allocation check if a tile is currently occupied or reserved by another entity
   */
  public static isTileOccupiedByEntities(
    x: number,
    y: number,
    self: GridEntity,
    obstacles?: readonly GridEntity[]
  ): boolean {
    if (!obstacles) return false;
    for (let i = 0; i < obstacles.length; i++) {
      const other = obstacles[i];
      if (other === self || other.id === self.id) continue;
      if (other.x === x && other.y === y) return true;
      if (other.isMoving && other.targetX === x && other.targetY === y) return true;
    }
    return false;
  }

  /**
   * Zero-allocation check if a player has stepped into an undefeated trainer's line-of-sight
   */
  public static checkTrainerLineOfSight(
    player: GridEntity,
    npcs: readonly GridEntity[],
    defeatedTrainers: ReadonlySet<string>,
    getTileType: TileTypeLookup
  ): GridEntity | null {
    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      if (!npc.trainerId || defeatedTrainers.has(npc.trainerId) || !npc.visionRange || npc.visionRange <= 0) {
        continue;
      }

      const delta = this.getDirectionDelta(npc.direction);
      for (let dist = 1; dist <= npc.visionRange; dist++) {
        const tx = npc.x + delta.dx * dist;
        const ty = npc.y + delta.dy * dist;

        // Vision is blocked by solid walls/trees (1), water (3), or ledges (4)
        const tileType = getTileType(tx, ty);
        if (tileType === 1 || tileType === 3 || tileType === 4) {
          break;
        }

        if (player.x === tx && player.y === ty) {
          return npc;
        }
      }
    }
    return null;
  }

  /**
   * Updates an entity's position, stepping through fractional progress and chaining overflow
   * without allocating intermediate objects. Supports 2-tile one-way ledge hops (tileType === 4).
   */
  public static updateEntity(
    entity: GridEntity,
    dt: number,
    heldDirection: Direction | null,
    isWalkable: CollisionCheck,
    getTileType: TileTypeLookup,
    onTileEntered?: TileEnteredCallback,
    obstacles?: readonly GridEntity[],
    onLedgeJump?: LedgeJumpCallback
  ): void {
    if (dt <= 0) return;

    // 1. If currently idle, check if we should start moving or hop a one-way ledge
    if (!entity.isMoving) {
      if (heldDirection) {
        entity.direction = heldDirection;
        const delta = this.getDirectionDelta(heldDirection);
        const nextX = entity.x + delta.dx;
        const nextY = entity.y + delta.dy;

        if (isWalkable(nextX, nextY) && !this.isTileOccupiedByEntities(nextX, nextY, entity, obstacles)) {
          entity.isMoving = true;
          entity.isJumping = false;
          entity.targetX = nextX;
          entity.targetY = nextY;
          entity.progress = 0.0;
        } else if (
          entity.isPlayer &&
          heldDirection === 'DOWN' &&
          getTileType(nextX, nextY) === 4 &&
          isWalkable(nextX, nextY + 1) &&
          !this.isTileOccupiedByEntities(nextX, nextY + 1, entity, obstacles)
        ) {
          // One-way South Ledge Hop (jumps 2 tiles over the cliff edge)
          entity.isMoving = true;
          entity.isJumping = true;
          entity.targetX = nextX;
          entity.targetY = nextY + 1;
          entity.progress = 0.0;
          if (onLedgeJump) onLedgeJump(entity);
        }
      }
    }

    // 2. If moving, advance progress (ledge jump takes 1.6x normal single-tile step duration)
    if (entity.isMoving) {
      const duration = entity.isJumping ? this.BASE_TRAVERSAL_TIME * 1.6 : this.BASE_TRAVERSAL_TIME;
      entity.progress += dt / duration;

      // Handle tile arrivals and fractional overflow chaining
      while (entity.progress >= 1.0) {
        // Snap logically to target
        entity.x = entity.targetX;
        entity.y = entity.targetY;
        entity.isJumping = false;
        const overflow = entity.progress - 1.0;

        // Tile entered callback (checks for warps, wild encounters, grass rustle, trainer vision)
        if (onTileEntered) {
          const tileType = getTileType(entity.x, entity.y);
          onTileEntered(entity, { x: entity.x, y: entity.y }, tileType);
        }

        // Check if movement was halted by the callback (e.g., warp transition or battle)
        if (!entity.isMoving) {
          entity.progress = 0.0;
          break;
        }

        // If direction is still held, attempt seamless continuation
        if (heldDirection) {
          entity.direction = heldDirection;
          const delta = this.getDirectionDelta(heldDirection);
          const nextX = entity.x + delta.dx;
          const nextY = entity.y + delta.dy;

          if (isWalkable(nextX, nextY) && !this.isTileOccupiedByEntities(nextX, nextY, entity, obstacles)) {
            entity.targetX = nextX;
            entity.targetY = nextY;
            entity.isJumping = false;
            entity.progress = overflow;
          } else if (
            entity.isPlayer &&
            heldDirection === 'DOWN' &&
            getTileType(nextX, nextY) === 4 &&
            isWalkable(nextX, nextY + 1) &&
            !this.isTileOccupiedByEntities(nextX, nextY + 1, entity, obstacles)
          ) {
            entity.targetX = nextX;
            entity.targetY = nextY + 1;
            entity.isJumping = true;
            entity.progress = overflow;
            if (onLedgeJump) onLedgeJump(entity);
          } else {
            // Blocked by collision
            entity.isMoving = false;
            entity.isJumping = false;
            entity.progress = 0.0;
            break;
          }
        } else {
          // No input held, stop smoothly on the tile
          entity.isMoving = false;
          entity.isJumping = false;
          entity.progress = 0.0;
          break;
        }
      }
    }

    // 3. Compute continuous render coordinates for smooth visual interpolation
    if (entity.isMoving) {
      entity.renderX = entity.x + (entity.targetX - entity.x) * entity.progress;
      entity.renderY = entity.y + (entity.targetY - entity.y) * entity.progress;
    } else {
      entity.renderX = entity.x;
      entity.renderY = entity.y;
    }
  }
}
