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
  | 'prof_elm'
  | 'sage'
  | 'elder'
  | 'elder_li'
  | 'falkner'
  | 'bird_keeper'
  | 'earl'
  | 'oak'
  | 'sudowoodo'
  | 'lapras'
  | 'whitney'
  | 'bike_shop_owner'
  | 'clerk'
  | 'receptionist'
  | 'gentleman'
  | 'lass'
  | 'beauty'
  | 'rocket_grunt_m'
  | 'rocket_grunt_f'
  | 'officer'
  | 'camper'
  | 'picnicker'
  | 'psychic'
  | 'schoolboy'
  | 'juggler'
  | 'firebreather'
  | 'pokefan_m'
  | 'pokefan_f'
  | 'super_nerd'
  | 'youngster';

export interface TrainerPokemonSpec {
  speciesId: string;
  level: number;
  moves?: string[];
  heldItem?: string;
}

export interface GridEntity {
  id: string;
  x: number;
  y: number;
  gridX?: number;
  gridY?: number;
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
    | 'BERRY_MAN_EVENT'
    | 'ELDER_LI_EVENT'
    | 'FALKNER_EVENT'
    | 'BUGSY_EVENT'
    | 'WHITNEY_EVENT'
    | 'MORTY_EVENT'
    | 'JASMINE_EVENT'
    | 'CHUCK_EVENT'
    | 'PRYCE_EVENT'
    | 'CLAIR_EVENT'
    | 'BROCK_EVENT'
    | 'MISTY_EVENT'
    | 'SURGE_EVENT'
    | 'ERIKA_EVENT'
    | 'JANINE_EVENT'
    | 'SABRINA_EVENT'
    | 'BLAINE_EVENT'
    | 'BLUE_EVENT'
    | 'E4_EVENT'
    | 'AMPHY_EVENT'
    | 'PHARMACY_SECRET_POTION_EVENT'
    | 'ELMS_AIDE_EVENT'
    | 'SUDOWOODO_EVENT'
    | 'POLICE_RIVAL_NAMING'
    | 'PROTON_EVENT'
    | 'DAY_SIBLING_EVENT'
    | 'LAPRAS_EVENT'
    | 'GUIDE_GENT_EVENT'
    | 'KINGS_ROCK_EVENT'
    | 'UNOWN_DEX_EVENT'
    | 'FARFETCHD_HERD_EVENT'
    | 'CHARCOAL_MASTER_EVENT'
    | 'HEADBUTT_TUTOR_EVENT'
    | 'DEPT_ELEVATOR'
    | 'ROCK_SMASH_GUY_EVENT'
    | 'QUICK_CLAW_EVENT'
    | 'BUG_CONTEST_OFFICER_EVENT'
    | 'RIVAL_BURNED_TOWER_BATTLE'
    | 'BEASTS_AWAKENING'
    | 'RED_GYARADOS_EVENT'
    | 'LANCE_LAKE_EVENT'
    | 'MAHOGANY_GYM_BLOCKER'
    | 'LANCE_MART_EVENT'
    | 'LANCE_BASE_HEAL'
    | 'ROCKET_GENERATOR_ELECTRODE'
    | 'AZALEA_RIVAL_EVENT'
    | 'CHARCOAL_KILN_APPRENTICE_EVENT'
    | 'SWEET_SCENT_TEACHER_EVENT';
  trainerId?: string;
  trainerName?: string;
  visionRange?: number;
  challengePages?: string[];
  trainerPokemon?: TrainerPokemonSpec;
  trainerTeam?: TrainerPokemonSpec[];
}

export type CollisionCheck = (x: number, y: number) => boolean;
export type TileTypeLookup = (x: number, y: number) => number;
export type TileEnteredCallback = (entity: GridEntity, coord: TileCoord, tileType: number) => void;
export type LedgeJumpCallback = (entity: GridEntity) => void;
export type CollisionBumpCallback = (entity: GridEntity) => void;

export class GridPhysics {
  public static readonly BASE_TRAVERSAL_TIME: number = 0.24; // 0.24 seconds per tile at 1x speed

  public static readonly DIRECTION_DELTAS: Record<Direction, { readonly dx: number; readonly dy: number }> = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 },
  };

  /**
   * Helper to get integer delta for a direction (zero-allocation static lookup)
   */
  public static getDirectionDelta(dir: Direction): { dx: number; dy: number } {
    return this.DIRECTION_DELTAS[dir];
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

        // Vision is blocked by solid walls/trees (1), water (3), or ledges/fences (4..9)
        const tileType = getTileType(tx, ty);
        if (tileType === 1 || tileType === 3 || (tileType >= 4 && tileType <= 9)) {
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
   * Checks whether a given ledge/fence tileType (4..9) allows hopping in heldDirection
   * 4 = HOP_DOWN, 5 = HOP_UP, 6 = HOP_LEFT, 7 = HOP_RIGHT, 8 = HOP_DOWN_LEFT, 9 = HOP_DOWN_RIGHT
   */
  public static canJumpLedge(heldDirection: Direction, ledgeTileType: number): boolean {
    switch (heldDirection) {
      case 'DOWN':
        return ledgeTileType === 4 || ledgeTileType === 8 || ledgeTileType === 9;
      case 'UP':
        return ledgeTileType === 5;
      case 'LEFT':
        return ledgeTileType === 6 || ledgeTileType === 8;
      case 'RIGHT':
        return ledgeTileType === 7 || ledgeTileType === 9;
    }
  }

  /**
   * Resolves one-way ledge hop distance (2 tiles over standard 1-tile ledge rim, or 3 tiles over a 2-tile ledge+cliff pair).
   * Returns 0 if no valid ledge hop can be performed. Zero allocations.
   */
  public static resolveLedgeHopDistance(
    entity: GridEntity,
    heldDirection: Direction,
    deltaDx: number,
    deltaDy: number,
    isWalkable: CollisionCheck,
    getTileType: TileTypeLookup,
    obstacles?: readonly GridEntity[]
  ): 0 | 2 | 3 {
    const nextX = entity.x + deltaDx;
    const nextY = entity.y + deltaDy;
    if (!this.canJumpLedge(heldDirection, getTileType(nextX, nextY))) {
      return 0;
    }

    const target2X = entity.x + deltaDx * 2;
    const target2Y = entity.y + deltaDy * 2;
    if (isWalkable(target2X, target2Y) && !this.isTileOccupiedByEntities(target2X, target2Y, entity, obstacles)) {
      return 2;
    }

    const target3X = entity.x + deltaDx * 3;
    const target3Y = entity.y + deltaDy * 3;
    if (
      getTileType(target2X, target2Y) === 1 &&
      isWalkable(target3X, target3Y) &&
      !this.isTileOccupiedByEntities(target3X, target3Y, entity, obstacles)
    ) {
      return 3;
    }

    return 0;
  }

  /**
   * Updates an entity's position, stepping through fractional progress and chaining overflow
   * without allocating intermediate objects. Supports 2-tile and 3-tile one-way ledge hops in all directions (tileType 4..9).
   */
  public static updateEntity(
    entity: GridEntity,
    dt: number,
    heldDirection: Direction | null,
    isWalkable: CollisionCheck,
    getTileType: TileTypeLookup,
    onTileEntered?: TileEnteredCallback,
    obstacles?: readonly GridEntity[],
    onLedgeJump?: LedgeJumpCallback,
    onBump?: CollisionBumpCallback
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
        } else if (entity.isPlayer) {
          const hopDist = this.resolveLedgeHopDistance(
            entity,
            heldDirection,
            delta.dx,
            delta.dy,
            isWalkable,
            getTileType,
            obstacles
          );
          if (hopDist > 0) {
            // One-way Ledge Hop (jumps 2 or 3 tiles over the cliff edge / fence)
            entity.isMoving = true;
            entity.isJumping = true;
            entity.targetX = entity.x + delta.dx * hopDist;
            entity.targetY = entity.y + delta.dy * hopDist;
            entity.progress = 0.0;
            if (onLedgeJump) onLedgeJump(entity);
          } else if (onBump) {
            onBump(entity);
          }
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
          } else if (entity.isPlayer) {
            const hopDist = this.resolveLedgeHopDistance(
              entity,
              heldDirection,
              delta.dx,
              delta.dy,
              isWalkable,
              getTileType,
              obstacles
            );
            if (hopDist > 0) {
              entity.targetX = entity.x + delta.dx * hopDist;
              entity.targetY = entity.y + delta.dy * hopDist;
              entity.isJumping = true;
              entity.progress = overflow;
              if (onLedgeJump) onLedgeJump(entity);
            } else {
              // Blocked by collision
              entity.isMoving = false;
              entity.isJumping = false;
              entity.progress = 0.0;
              if (onBump) {
                onBump(entity);
              }
              break;
            }
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
