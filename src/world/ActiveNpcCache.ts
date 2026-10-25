import type { GridEntity } from './GridPhysics';

/**
 * A `Set<string>` implementation that increments a monotonic `version` counter
 * whenever flags are added, deleted, or cleared. Enables O(1) cache invalidation
 * in high-frequency 60 FPS game loops.
 */
export class TrackedStoryFlagSet extends Set<string> {
  private _version: number = 0;

  public get version(): number {
    return this._version;
  }

  public override add(value: string): this {
    const hadBefore = this.has(value);
    super.add(value);
    if (!hadBefore) {
      this._version++;
    }
    return this;
  }

  public override delete(value: string): boolean {
    const removed = super.delete(value);
    if (removed) {
      this._version++;
    }
    return removed;
  }

  public override clear(): void {
    if (this.size > 0) {
      super.clear();
      this._version++;
    }
  }

  public bumpVersion(): void {
    this._version++;
  }
}

interface CachedMapNpcs {
  flagVersion: number;
  flagSize: number;
  rawLength: number;
  active: GridEntity[];
}

/**
 * Memoizes story-flag filtered NPC lists per map so the 60 FPS overworld ticker
 * and connected neighbor renderer never allocate temporary `.filter()` arrays
 * unless story flags or map NPC lists actually mutate.
 */
export class ActiveNpcCache {
  private cache: Map<string, CachedMapNpcs> = new Map();
  private emptyList: GridEntity[] = [];
  private hits: number = 0;
  private misses: number = 0;

  public getActiveNpcs(
    mapId: string,
    rawList: GridEntity[] | undefined,
    storyFlags: Set<string>,
    isActiveFn: (npcId: string, flags: Set<string>) => boolean
  ): GridEntity[] {
    if (!rawList || rawList.length === 0) {
      return this.emptyList;
    }

    const flagVersion =
      storyFlags instanceof TrackedStoryFlagSet ? storyFlags.version : -1;
    const flagSize = storyFlags.size;
    const existing = this.cache.get(mapId);

    if (
      existing &&
      flagVersion >= 0 &&
      existing.flagVersion === flagVersion &&
      existing.flagSize === flagSize &&
      existing.rawLength === rawList.length
    ) {
      this.hits++;
      return existing.active;
    }

    this.misses++;
    const active: GridEntity[] = [];
    for (let i = 0; i < rawList.length; i++) {
      const npc = rawList[i];
      if (isActiveFn(npc.id, storyFlags)) {
        active.push(npc);
      }
    }

    if (flagVersion >= 0) {
      this.cache.set(mapId, {
        flagVersion,
        flagSize,
        rawLength: rawList.length,
        active,
      });
    }

    return active;
  }

  public invalidate(mapId?: string): void {
    if (mapId) {
      this.cache.delete(mapId);
    } else {
      this.cache.clear();
    }
  }

  public getStats(): { hits: number; misses: number; cachedMaps: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      cachedMaps: this.cache.size,
    };
  }
}
