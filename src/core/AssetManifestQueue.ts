export type ManifestCategory =
  | 'MAP_JSON'
  | 'TILE_TEXTURE'
  | 'WATER_ANIM'
  | 'CHARACTER_SPRITE';

export interface ManifestItemDescriptor {
  id: string;
  category: ManifestCategory;
  label: string;
  execute: () => Promise<void>;
}

export interface ManifestProgressSnapshot {
  completed: number;
  total: number;
  percent: number;
  currentLabel: string;
  category: ManifestCategory;
  itemId: string;
}

export type ManifestProgressCallback = (snapshot: ManifestProgressSnapshot) => void;

export interface ManifestQueueOptions {
  startPercent?: number;
  endPercent?: number;
  concurrency?: number;
  onProgress?: ManifestProgressCallback;
}

/**
 * Coordinates deterministic, manifest-driven asset & map loading with
 * bounded concurrency and granular per-item progress reporting.
 */
export class AssetManifestQueue {
  private items: ManifestItemDescriptor[] = [];

  public constructor(initialItems?: ManifestItemDescriptor[]) {
    if (initialItems && initialItems.length > 0) {
      this.items.push(...initialItems);
    }
  }

  public enqueue(item: ManifestItemDescriptor): this {
    this.items.push(item);
    return this;
  }

  public enqueueAll(items: ManifestItemDescriptor[]): this {
    this.items.push(...items);
    return this;
  }

  public size(): number {
    return this.items.length;
  }

  public getItems(): ReadonlyArray<ManifestItemDescriptor> {
    return this.items;
  }

  public clear(): void {
    this.items = [];
  }

  /**
   * Executes all queued manifest tasks with bounded concurrency, invoking
   * `onProgress` after each item settles (whether resolved or gracefully caught).
   */
  public async run(options: ManifestQueueOptions = {}): Promise<ManifestProgressSnapshot[]> {
    const startPercent = options.startPercent ?? 0;
    const endPercent = options.endPercent ?? 100;
    const concurrency = Math.max(1, options.concurrency ?? 6);
    const onProgress = options.onProgress;

    const total = this.items.length;
    const history: ManifestProgressSnapshot[] = [];

    if (total === 0) {
      const emptySnap: ManifestProgressSnapshot = {
        completed: 0,
        total: 0,
        percent: Math.round(endPercent),
        currentLabel: 'Ready',
        category: 'TILE_TEXTURE',
        itemId: 'none',
      };
      onProgress?.(emptySnap);
      return [emptySnap];
    }

    let completed = 0;
    let cursor = 0;

    const worker = async (): Promise<void> => {
      while (cursor < total) {
        const index = cursor++;
        const item = this.items[index];
        try {
          await item.execute();
        } catch (err) {
          console.warn(`[AssetManifestQueue] Non-fatal error loading ${item.id} (${item.label}):`, err);
        } finally {
          completed++;
          const ratio = completed / total;
          const rawPct = startPercent + ratio * (endPercent - startPercent);
          const percent = Math.max(
            Math.min(startPercent, endPercent),
            Math.min(Math.max(startPercent, endPercent), Math.round(rawPct))
          );
          const snapshot: ManifestProgressSnapshot = {
            completed,
            total,
            percent,
            currentLabel: `${item.label} (${completed}/${total})`,
            category: item.category,
            itemId: item.id,
          };
          history.push(snapshot);
          onProgress?.(snapshot);
        }
      }
    };

    const workerCount = Math.min(concurrency, total);
    const workers: Promise<void>[] = [];
    for (let i = 0; i < workerCount; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
    return history;
  }
}
