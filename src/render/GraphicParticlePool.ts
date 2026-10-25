import { Graphics } from 'pixi.js';

/**
 * Zero-allocation object pool for short-lived PixiJS `Graphics` particles
 * (such as tall grass rustle leaves and HM01 Cut slash arcs).
 *
 * Pre-allocates a reusable pool of `Graphics` instances so high-frequency field
 * traversal never triggers per-step Garbage Collection spikes.
 */
export class GraphicParticlePool {
  private available: Graphics[] = [];
  private activeCount: number = 0;
  private totalAllocated: number = 0;

  public constructor(initialCapacity: number = 24) {
    for (let i = 0; i < initialCapacity; i++) {
      const g = new Graphics();
      g.visible = false;
      g.eventMode = 'none';
      this.available.push(g);
      this.totalAllocated++;
    }
  }

  /**
   * Acquires a clean, visible `Graphics` instance from the pool (or allocates one if exhausted).
   */
  public acquire(): Graphics {
    let g = this.available.pop();
    if (!g || g.destroyed) {
      g = new Graphics();
      g.eventMode = 'none';
      this.totalAllocated++;
    } else {
      g.clear();
    }
    g.alpha = 1;
    g.rotation = 0;
    g.scale.set(1, 1);
    g.position.set(0, 0);
    g.tint = 0xffffff;
    g.visible = true;
    this.activeCount++;
    return g;
  }

  /**
   * Detaches a `Graphics` instance from its parent container, clears its geometry,
   * and returns it to the available pool for reuse.
   */
  public release(g: Graphics): void {
    if (!g || g.destroyed) return;
    if (g.parent) {
      g.parent.removeChild(g);
    }
    g.clear();
    g.visible = false;
    g.alpha = 1;
    if (this.activeCount > 0) {
      this.activeCount--;
    }
    this.available.push(g);
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getAvailableCount(): number {
    return this.available.length;
  }

  public getTotalAllocated(): number {
    return this.totalAllocated;
  }
}
