import { describe, it, expect, vi } from 'vitest';
import {
  AssetManifestQueue,
  type ManifestProgressSnapshot,
} from '../src/core/AssetManifestQueue';

describe('AssetManifestQueue (Granular Boot Manifest Loader)', () => {
  it('tracks per-item granular completion and interpolates percent within [startPercent, endPercent]', async () => {
    const queue = new AssetManifestQueue();
    const snapshots: ManifestProgressSnapshot[] = [];

    queue.enqueueAll([
      {
        id: 'map:new_bark_town',
        label: 'Loading map new_bark_town.json',
        category: 'MAP_JSON',
        execute: async () => {},
      },
      {
        id: 'sprite:gold_walk',
        label: 'Loading sprite gold_walk.png',
        category: 'CHARACTER_SPRITE',
        execute: async () => {},
      },
      {
        id: 'tile:grass',
        label: 'Loading tile grass.png',
        category: 'TILE_TEXTURE',
        execute: async () => {},
      },
      {
        id: 'tile:water',
        label: 'Loading tile water.png',
        category: 'WATER_ANIM',
        execute: async () => {},
      },
    ]);

    expect(queue.size()).toBe(4);

    const history = await queue.run({
      startPercent: 20,
      endPercent: 80,
      concurrency: 1,
      onProgress: (snap) => snapshots.push(snap),
    });

    expect(snapshots.length).toBe(4);
    expect(history.length).toBe(4);

    expect(snapshots[0].completed).toBe(1);
    expect(snapshots[0].total).toBe(4);
    expect(snapshots[0].percent).toBe(35);
    expect(snapshots[0].category).toBe('MAP_JSON');
    expect(snapshots[0].currentLabel).toBe('Loading map new_bark_town.json (1/4)');

    expect(snapshots[1].completed).toBe(2);
    expect(snapshots[1].percent).toBe(50);
    expect(snapshots[1].category).toBe('CHARACTER_SPRITE');

    expect(snapshots[2].completed).toBe(3);
    expect(snapshots[2].percent).toBe(65);
    expect(snapshots[2].category).toBe('TILE_TEXTURE');

    expect(snapshots[3].completed).toBe(4);
    expect(snapshots[3].percent).toBe(80);
    expect(snapshots[3].category).toBe('WATER_ANIM');
  });

  it('respects bounded concurrency when executing manifest loaders', async () => {
    const queue = new AssetManifestQueue();
    let activeCount = 0;
    let maxObservedConcurrency = 0;

    for (let i = 0; i < 10; i++) {
      queue.enqueue({
        id: `tile:${i}`,
        label: `Loading tile_${i}.png`,
        category: 'TILE_TEXTURE',
        execute: async () => {
          activeCount++;
          maxObservedConcurrency = Math.max(maxObservedConcurrency, activeCount);
          await new Promise((r) => setTimeout(r, 10));
          activeCount--;
        },
      });
    }

    const history = await queue.run({ concurrency: 3 });
    const finalSnap = history[history.length - 1];
    expect(finalSnap.completed).toBe(10);
    expect(finalSnap.total).toBe(10);
    expect(maxObservedConcurrency).toBeLessThanOrEqual(3);
    expect(maxObservedConcurrency).toBeGreaterThanOrEqual(2);
  });

  it('continues advancing the progress bar even if an individual asset fails to load', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const queue = new AssetManifestQueue();
    const percents: number[] = [];

    queue.enqueueAll([
      {
        id: 'ok-1',
        label: 'Asset 1',
        category: 'CHARACTER_SPRITE',
        execute: async () => {},
      },
      {
        id: 'broken-2',
        label: 'Asset 2 (missing)',
        category: 'TILE_TEXTURE',
        execute: async () => {
          throw new Error('404 Not Found');
        },
      },
      {
        id: 'ok-3',
        label: 'Asset 3',
        category: 'MAP_JSON',
        execute: async () => {},
      },
    ]);

    const history = await queue.run({
      startPercent: 10,
      endPercent: 100,
      concurrency: 1,
      onProgress: (snap) => percents.push(snap.percent),
    });

    const finalSnap = history[history.length - 1];
    expect(finalSnap.completed).toBe(3);
    expect(finalSnap.percent).toBe(100);
    expect(percents).toEqual([40, 70, 100]);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('handles an empty manifest gracefully and reports endPercent immediately', async () => {
    const queue = new AssetManifestQueue();
    const snapshots: ManifestProgressSnapshot[] = [];

    const history = await queue.run({
      startPercent: 50,
      endPercent: 90,
      onProgress: (snap) => snapshots.push(snap),
    });

    expect(history.length).toBe(1);
    expect(history[0].completed).toBe(0);
    expect(history[0].total).toBe(0);
    expect(history[0].percent).toBe(90);
    expect(snapshots.length).toBe(1);
    expect(snapshots[0].percent).toBe(90);
  });
});
