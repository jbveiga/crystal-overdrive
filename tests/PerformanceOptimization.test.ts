import { describe, it, expect, vi } from 'vitest';
import { Container } from 'pixi.js';
import { GraphicParticlePool } from '../src/render/GraphicParticlePool';
import { TrackedStoryFlagSet, ActiveNpcCache } from '../src/world/ActiveNpcCache';
import type { GridEntity } from '../src/world/GridPhysics';

describe('Full-Stack Performance & Efficiency Optimizations', () => {
  describe('1. GraphicParticlePool (Zero-Allocation Overworld Particle Recycling)', () => {
    it('pre-allocates initial capacity and recycles Graphics instances without new allocations', () => {
      const pool = new GraphicParticlePool(8);
      expect(pool.getTotalAllocated()).toBe(8);
      expect(pool.getAvailableCount()).toBe(8);
      expect(pool.getActiveCount()).toBe(0);

      const parent = new Container();
      const acquired = [];
      for (let i = 0; i < 4; i++) {
        const g = pool.acquire();
        g.position.set(100 + i, 200 + i);
        g.alpha = 0.5;
        parent.addChild(g);
        acquired.push(g);
      }

      expect(pool.getActiveCount()).toBe(4);
      expect(pool.getAvailableCount()).toBe(4);
      expect(pool.getTotalAllocated()).toBe(8);
      expect(parent.children.length).toBe(4);

      // Release all 4 back to pool
      for (const g of acquired) {
        pool.release(g);
      }

      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(8);
      expect(pool.getTotalAllocated()).toBe(8);
      expect(parent.children.length).toBe(0);

      // Re-acquiring reuses the exact same Graphics objects with reset transform & alpha
      const reused = pool.acquire();
      expect(acquired).toContain(reused);
      expect(reused.alpha).toBe(1);
      expect(reused.x).toBe(0);
      expect(reused.y).toBe(0);
      expect(reused.visible).toBe(true);
      expect(pool.getTotalAllocated()).toBe(8);
    });

    it('expands dynamically if simultaneous burst exceeds initial capacity', () => {
      const pool = new GraphicParticlePool(2);
      const g1 = pool.acquire();
      const g2 = pool.acquire();
      const g3 = pool.acquire();

      expect(pool.getActiveCount()).toBe(3);
      expect(pool.getTotalAllocated()).toBe(3);

      pool.release(g1);
      pool.release(g2);
      pool.release(g3);
      expect(pool.getAvailableCount()).toBe(3);
    });
  });

  describe('2. TrackedStoryFlagSet & ActiveNpcCache (60 FPS Ticker Memoization)', () => {
    const createMockNpc = (id: string): GridEntity => ({
      id,
      x: 5,
      y: 5,
      targetX: 5,
      targetY: 5,
      renderX: 5,
      renderY: 5,
      direction: 'DOWN',
      isMoving: false,
      progress: 0,
    });

    it('increments TrackedStoryFlagSet version only when set contents actually mutate', () => {
      const flags = new TrackedStoryFlagSet();
      expect(flags.version).toBe(0);

      flags.add('HAS_POKEDEX');
      expect(flags.version).toBe(1);

      // Adding duplicate flag does not bump version
      flags.add('HAS_POKEDEX');
      expect(flags.version).toBe(1);

      flags.add('EVENT_BEAT_FALKNER');
      expect(flags.version).toBe(2);

      // Deleting non-existent flag does not bump version
      flags.delete('NON_EXISTENT');
      expect(flags.version).toBe(2);

      flags.delete('HAS_POKEDEX');
      expect(flags.version).toBe(3);

      flags.clear();
      expect(flags.version).toBe(4);
    });

    it('returns memoized active NPC array in O(1) across 60 FPS frames and invalidates on flag change', () => {
      const flags = new TrackedStoryFlagSet();
      const cache = new ActiveNpcCache();
      const rawNpcs: GridEntity[] = [
        createMockNpc('elm'),
        createMockNpc('rival_blocker'),
        createMockNpc('aide'),
      ];

      const filterFn = vi.fn((npcId: string, f: Set<string>) => {
        if (npcId === 'rival_blocker' && f.has('STARTER_CHOSEN')) {
          return false;
        }
        return true;
      });

      // Frame 1: Cache miss -> evaluates filterFn for each NPC
      const frame1Result = cache.getActiveNpcs('new_bark_town', rawNpcs, flags, filterFn);
      expect(frame1Result.map((n) => n.id)).toEqual(['elm', 'rival_blocker', 'aide']);
      expect(filterFn).toHaveBeenCalledTimes(3);
      expect(cache.getStats()).toEqual({ hits: 0, misses: 1, cachedMaps: 1 });

      // Frames 2..60: Cache hit -> zero filterFn calls and identical array reference
      for (let frame = 2; frame <= 60; frame++) {
        const res = cache.getActiveNpcs('new_bark_town', rawNpcs, flags, filterFn);
        expect(res).toBe(frame1Result);
      }
      expect(filterFn).toHaveBeenCalledTimes(3);
      expect(cache.getStats().hits).toBe(59);
      expect(cache.getStats().misses).toBe(1);

      // Story flag mutation -> automatically invalidates and recomputes on next frame
      flags.add('STARTER_CHOSEN');
      const frame61Result = cache.getActiveNpcs('new_bark_town', rawNpcs, flags, filterFn);
      expect(frame61Result).not.toBe(frame1Result);
      expect(frame61Result.map((n) => n.id)).toEqual(['elm', 'aide']);
      expect(filterFn).toHaveBeenCalledTimes(6);
      expect(cache.getStats().misses).toBe(2);
    });
  });
});
