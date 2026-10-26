import { Application, Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';
import type { GridEntity } from '../world/GridPhysics';
import { GraphicParticlePool } from './GraphicParticlePool';

export interface GrassParticle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class OverworldParticleAndVfxPool {
  private app!: Application;
  private foregroundContainer!: Container;
  private ambientOverlay!: Graphics;
  private fadeOverlay!: Graphics;
  private exclamationContainer: Container | null = null;
  private grassParticles: GrassParticle[] = [];
  private particlePool: GraphicParticlePool = new GraphicParticlePool(24);
  private tileSize: number;

  constructor(tileSize: number = 64) {
    this.tileSize = tileSize;
  }

  public init(app: Application, foregroundContainer: Container, stageContainer: Container): void {
    this.app = app;
    this.foregroundContainer = foregroundContainer;

    // Ambient Lighting Tint Overlay
    this.ambientOverlay = new Graphics();
    this.ambientOverlay.visible = false;
    stageContainer.addChild(this.ambientOverlay);

    // Fade Veil Overlay (for transitions & door warps)
    this.fadeOverlay = new Graphics();
    this.fadeOverlay.visible = false;
    stageContainer.addChild(this.fadeOverlay);
  }

  public getTimeOfDayTint(): { period: 'MORNING' | 'DAY' | 'NIGHT'; tint: number } {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 10) {
      return { period: 'MORNING', tint: 0xfff4db };
    }
    if (hour >= 10 && hour < 18) {
      return { period: 'DAY', tint: 0xffffff };
    }
    return { period: 'NIGHT', tint: 0x9aa8f8 };
  }

  public spawnGrassRustle(tileX: number, tileY: number): void {
    if (!this.foregroundContainer) return;
    const centerX = (tileX + 0.5) * this.tileSize;
    const centerY = (tileY + 0.65) * this.tileSize;
    const angles = [-2.4, -1.9, -1.2, -0.7];
    for (let i = 0; i < 4; i++) {
      const leaf = this.particlePool.acquire();
      leaf.rect(-4, -3, 8, 6).fill({ color: i % 2 === 0 ? 0x65c458 : 0x2a7a32 });
      leaf.rect(-2, -1, 4, 2).fill({ color: 0xb4f09c });
      leaf.position.set(centerX + (i - 1.5) * 8, centerY);
      this.foregroundContainer.addChild(leaf);
      this.grassParticles.push({
        graphic: leaf,
        vx: Math.cos(angles[i]) * 52,
        vy: Math.sin(angles[i]) * 64,
        life: 0,
        maxLife: 0.28,
      });
    }
  }

  public playCutSlashEffect(tileX: number, tileY: number): void {
    if (!this.foregroundContainer) return;
    const centerX = (tileX + 0.5) * this.tileSize;
    const centerY = (tileY + 0.5) * this.tileSize;

    // 1. Diagonal silver-white blade arc
    const slash = this.particlePool.acquire();
    slash
      .moveTo(-26, -26)
      .lineTo(26, 26)
      .stroke({ color: 0xffffff, width: 6 });
    slash
      .moveTo(26, -26)
      .lineTo(-26, 26)
      .stroke({ color: 0xe2e8f0, width: 4 });
    slash.position.set(centerX, centerY);
    this.foregroundContainer.addChild(slash);
    this.grassParticles.push({
      graphic: slash,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.24,
    });

    // 2. Scatter 6 cut leaf particles
    const angles = [-2.6, -2.0, -1.5, -1.0, -0.5, 0.2];
    for (let i = 0; i < angles.length; i++) {
      const leaf = this.particlePool.acquire();
      leaf.rect(-5, -4, 10, 8).fill({ color: i % 2 === 0 ? 0x4ade80 : 0x16a34a });
      leaf.position.set(centerX + (i - 2.5) * 6, centerY);
      this.foregroundContainer.addChild(leaf);
      this.grassParticles.push({
        graphic: leaf,
        vx: Math.cos(angles[i]) * 78,
        vy: Math.sin(angles[i]) * 88,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  public getParticlePoolStats(): { active: number; available: number; total: number } {
    return {
      active: this.particlePool.getActiveCount(),
      available: this.particlePool.getAvailableCount(),
      total: this.particlePool.getTotalAllocated(),
    };
  }

  public async playFlashEffect(durationMs: number = 380): Promise<void> {
    if (!this.fadeOverlay || !this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.fadeOverlay.clear().rect(0, 0, w, h).fill({ color: 0xfef08a });
    this.fadeOverlay.alpha = 0.85;
    this.fadeOverlay.visible = true;

    await new Promise<void>((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        this.fadeOverlay.alpha = 0.85 * (1 - t);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          this.fadeOverlay.alpha = 0;
          this.fadeOverlay.visible = false;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  public async showExclamationBubble(npc: GridEntity, durationMs: number = 600): Promise<void> {
    if (this.exclamationContainer) {
      this.exclamationContainer.destroy({ children: true });
      this.exclamationContainer = null;
    }

    const offsetX = npc.worldOffsetX || 0;
    const offsetY = npc.worldOffsetY || 0;
    const npcPxX = (npc.renderX + offsetX + 0.5) * this.tileSize;
    const npcPxY = (npc.renderY + offsetY + 0.85) * this.tileSize;

    const bubble = new Container();
    bubble.position.set(npcPxX, npcPxY - 102);

    const bg = new Graphics();
    bg.roundRect(-18, -22, 36, 36, 6)
      .fill({ color: 0xffffff })
      .stroke({ color: 0x111827, width: 3 });
    // Speech pointer triangle
    bg.moveTo(-5, 14).lineTo(0, 22).lineTo(5, 14).fill({ color: 0x111827 });
    bubble.addChild(bg);

    const bang = new Text({
      text: '!',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 26,
        fontWeight: '900',
        fill: 0xdc2626,
      }),
    });
    bang.anchor.set(0.5);
    bang.position.set(0, -4);
    bubble.addChild(bang);

    this.foregroundContainer.addChild(bubble);
    this.exclamationContainer = bubble;

    await new Promise<void>((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        // Quick pop bounce on entry
        const bounce = t < 0.25 ? Math.sin((t / 0.25) * Math.PI) * 10 : 0;
        bubble.position.set(npcPxX, npcPxY - 102 - bounce);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          if (this.exclamationContainer === bubble) {
            bubble.destroy({ children: true });
            this.exclamationContainer = null;
          }
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  public getFadeOverlayAlpha(): number {
    return this.fadeOverlay ? this.fadeOverlay.alpha : 0;
  }

  public isFadeOverlayVisible(): boolean {
    return this.fadeOverlay ? this.fadeOverlay.visible : false;
  }

  public async playDoorwayFade(onMidpoint: () => void | Promise<void>, durationMs: number = 160): Promise<void> {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.fadeOverlay.clear().rect(0, 0, w, h).fill({ color: 0x000000 });
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = true;

    const animateAlpha = (from: number, to: number, ms: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / ms);
          this.fadeOverlay.alpha = from + (to - from) * t;
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });

    await animateAlpha(0, 1, durationMs);
    this.fadeOverlay.alpha = 1;
    await onMidpoint();
    await animateAlpha(1, 0, durationMs);
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = false;
  }

  public updateAmbientLighting(timeOfDay: 'MORNING' | 'DAY' | 'NIGHT', isOutdoor: boolean): void {
    if (!this.ambientOverlay || !this.app) return;
    if (!isOutdoor || timeOfDay === 'DAY') {
      this.ambientOverlay.visible = false;
      return;
    }
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.ambientOverlay.clear();

    if (timeOfDay === 'MORNING') {
      this.ambientOverlay.rect(0, 0, w, h).fill({ color: 0xffedd5 });
      this.ambientOverlay.alpha = 0.16;
      this.ambientOverlay.visible = true;
    } else if (timeOfDay === 'NIGHT') {
      this.ambientOverlay.rect(0, 0, w, h).fill({ color: 0x1e1b4b });
      this.ambientOverlay.alpha = 0.38;
      this.ambientOverlay.visible = true;
    }
  }

  public updateParticles(dt: number): void {
    // Update active grass flutter & cut slash particles using pre-allocated pool (zero GC churn)
    for (let i = this.grassParticles.length - 1; i >= 0; i--) {
      const p = this.grassParticles[i];
      p.life += dt;
      p.graphic.x += p.vx * dt;
      p.graphic.y += p.vy * dt;
      const progress = p.life / p.maxLife;
      p.graphic.alpha = Math.max(0, 1 - progress);
      p.graphic.rotation += 4 * dt;
      if (progress >= 1) {
        if (p.graphic.parent) {
          p.graphic.parent.removeChild(p.graphic);
        }
        this.particlePool.release(p.graphic);
        this.grassParticles.splice(i, 1);
      }
    }
  }

  public updateAnimatedWater(
    waterSprites: Array<{ sprite: Sprite; frames: [Texture, Texture, Texture, Texture] }>,
    dtWorld: number,
    state: { timer: number; step: number }
  ): void {
    if (dtWorld <= 0 || waterSprites.length === 0) return;
    state.timer += dtWorld;
    if (state.timer >= 0.26) {
      state.timer -= 0.26;
      state.step = (state.step + 1) & 3;
      for (let i = 0; i < waterSprites.length; i++) {
        const entry = waterSprites[i];
        if (entry.sprite.visible) {
          entry.sprite.texture = entry.frames[state.step];
        }
      }
    }
  }

  public cullFrustumTilesAndItems(opts: {
    mapContainer: Container;
    itemBallContainer: Container;
    cameraTargetX: number;
    cameraTargetY: number;
    stageScale: number;
    screenWidth: number;
    screenHeight: number;
    tileSize: number;
    lastCullState: { camX: number; camY: number; screenW: number; screenH: number };
  }): void {
    const {
      mapContainer,
      itemBallContainer,
      cameraTargetX,
      cameraTargetY,
      stageScale,
      screenWidth,
      screenHeight,
      tileSize,
      lastCullState,
    } = opts;

    if (
      Number.isNaN(lastCullState.camX) ||
      Math.abs(cameraTargetX - lastCullState.camX) >= 16 ||
      Math.abs(cameraTargetY - lastCullState.camY) >= 16 ||
      screenWidth !== lastCullState.screenW ||
      screenHeight !== lastCullState.screenH
    ) {
      lastCullState.camX = cameraTargetX;
      lastCullState.camY = cameraTargetY;
      lastCullState.screenW = screenWidth;
      lastCullState.screenH = screenHeight;

      const invScale = 1 / stageScale;
      const padWorld = tileSize * 2;
      const minWorldX = -cameraTargetX * invScale - padWorld;
      const maxWorldX = (screenWidth - cameraTargetX) * invScale + padWorld;
      const minWorldY = -cameraTargetY * invScale - padWorld;
      const maxWorldY = (screenHeight - cameraTargetY) * invScale + padWorld;

      const mapChildren = mapContainer.children;
      for (let i = 0; i < mapChildren.length; i++) {
        const tileChild = mapChildren[i];
        tileChild.visible =
          tileChild.x >= minWorldX &&
          tileChild.x <= maxWorldX &&
          tileChild.y >= minWorldY &&
          tileChild.y <= maxWorldY;
      }

      const itemChildren = itemBallContainer.children;
      for (let i = 0; i < itemChildren.length; i++) {
        const itemChild = itemChildren[i];
        itemChild.visible =
          itemChild.x >= minWorldX &&
          itemChild.x <= maxWorldX &&
          itemChild.y >= minWorldY &&
          itemChild.y <= maxWorldY;
      }
    }
  }
}
