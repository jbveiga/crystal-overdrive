import { Application, Container, Sprite, Texture, Rectangle, Assets, Graphics, Text, TextStyle, loadTextures } from 'pixi.js';
import type { MapData, Direction, OverworldItemBall, OverworldFruitTree } from '../types/game';
import type { GridEntity, NpcSpriteType } from '../world/GridPhysics';
import {
  AssetManifestQueue,
  type ManifestQueueOptions,
} from '../core/AssetManifestQueue';
import { GraphicParticlePool } from './GraphicParticlePool';

interface CharacterFrames {
  downStand: Texture;
  downWalk1: Texture;
  downWalk2: Texture;
  upStand: Texture;
  upWalk1: Texture;
  upWalk2: Texture;
  sideStand: Texture;
  sideWalk1: Texture;
  sideWalk2: Texture;
}

interface GrassParticle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

import { ANIMATED_WATER_TILES } from './tileConstants';
export { ANIMATED_WATER_TILES };

const NPC_SHEET_PATHS: Record<NpcSpriteType, string> = {
  boy: './assets/sprites/characters/npc_boy.png',
  girl: './assets/sprites/characters/npc_girl.png',
  fat_man: './assets/sprites/characters/npc_fat_man.png',
  sudowoodo: './assets/sprites/characters/sudowoodo.png',
  kris: './assets/sprites/characters/kris_walk.png',
  silver: './assets/sprites/characters/silver.png',
  fisherman: './assets/sprites/characters/fisherman.png',
  bug_catcher: './assets/sprites/characters/bug_catcher.png',
  teacher: './assets/sprites/characters/teacher.png',
  mom: './assets/sprites/characters/mom.png',
  prof_elm: './assets/sprites/characters/prof_elm.png',
  sage: './assets/sprites/characters/sage.png',
  elder: './assets/sprites/characters/elder.png',
  elder_li: './assets/sprites/characters/elder_li.png',
  falkner: './assets/sprites/characters/falkner.png',
  bird_keeper: './assets/sprites/characters/bird_keeper.png',
  earl: './assets/sprites/characters/earl.png',
  oak: './assets/sprites/characters/oak.png',
  lapras: './assets/sprites/characters/lapras.png',
  whitney: './assets/sprites/characters/whitney.png',
  bike_shop_owner: './assets/sprites/characters/bike_shop_owner.png',
  clerk: './assets/sprites/characters/clerk.png',
  receptionist: './assets/sprites/characters/receptionist.png',
  gentleman: './assets/sprites/characters/gentleman.png',
  lass: './assets/sprites/characters/lass.png',
  beauty: './assets/sprites/characters/beauty.png',
  rocket_grunt_m: './assets/sprites/characters/rocket_grunt_m.png',
  rocket_grunt_f: './assets/sprites/characters/rocket_grunt_f.png',
  officer: './assets/sprites/characters/officer.png',
  camper: './assets/sprites/characters/camper.png',
  picnicker: './assets/sprites/characters/picnicker.png',
  psychic: './assets/sprites/characters/psychic.png',
  schoolboy: './assets/sprites/characters/schoolboy.png',
  juggler: './assets/sprites/characters/juggler.png',
  firebreather: './assets/sprites/characters/firebreather.png',
  pokefan_m: './assets/sprites/characters/pokefan_m.png',
  pokefan_f: './assets/sprites/characters/pokefan_f.png',
  super_nerd: './assets/sprites/characters/super_nerd.png',
  youngster: './assets/sprites/characters/youngster.png',
  slowpoke: './assets/sprites/characters/slowpoke.png',
  farfetchd: './assets/sprites/characters/farfetchd.png',
};

export class OverworldRenderer {
  public app!: Application;
  private stageContainer!: Container;
  private mapContainer!: Container;
  private itemBallContainer!: Container;
  private entityContainer!: Container;
  private foregroundContainer!: Container;
  private playerShadow!: Graphics;
  private playerSprite!: Sprite;
  private playerGrassMask!: Graphics;
  private itemBallGraphics: Map<string, Container> = new Map();
  private npcSprites: Map<string, Sprite> = new Map();
  private activeNpcSpriteList: Sprite[] = [];
  private npcGrassMasks: Map<string, Graphics> = new Map();
  private activeNpcGrassMaskList: Graphics[] = [];
  private grassParticles: GrassParticle[] = [];
  private particlePool: GraphicParticlePool = new GraphicParticlePool(24);
  private exclamationContainer: Container | null = null;
  private ambientOverlay!: Graphics;
  private fadeOverlay!: Graphics;
  private currentRenderedMap: MapData | null = null;
  private tileSize: number = 64;

  // Textures
  private tileTextures: Map<string, Texture> = new Map();
  private waterAnimFrames: Map<string, [Texture, Texture, Texture, Texture]> = new Map();
  private animatedWaterSprites: Array<{ sprite: Sprite; frames: [Texture, Texture, Texture, Texture] }> = [];
  private waterAnimTimer: number = 0;
  private waterAnimStep: number = 0;
  private goldFrames!: CharacterFrames;
  private krisFrames!: CharacterFrames;
  private playerFrames!: CharacterFrames;
  private npcFrames: Map<NpcSpriteType, CharacterFrames> = new Map();
  private loadingNpcPromises: Map<NpcSpriteType, Promise<void>> = new Map();
  private fruitTreeTexture: Texture | null = null;
  private lastCullCamX: number = Number.NaN;
  private lastCullCamY: number = Number.NaN;
  private lastCullScreenW: number = 0;
  private lastCullScreenH: number = 0;
  private lastAmbientStateKey: string = '';

  public async init(
    containerElement: HTMLElement,
    queueOptions?: ManifestQueueOptions
  ): Promise<void> {
    // Prevent PixiJS v8 from spawning a blob: Web Worker where relative ./assets/... URLs fail to resolve
    if (loadTextures?.config) {
      loadTextures.config.preferWorkers = false;
      loadTextures.config.preferCreateImageBitmap = false;
    }

    this.app = new Application();
    await this.app.init({
      resizeTo: containerElement,
      backgroundColor: 0x0f172a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false, // Crisp pixel art
      preserveDrawingBuffer: true,
    });

    containerElement.appendChild(this.app.canvas);

    this.stageContainer = new Container();
    this.stageContainer.eventMode = 'none';
    this.mapContainer = new Container();
    this.mapContainer.eventMode = 'none';
    this.itemBallContainer = new Container();
    this.itemBallContainer.eventMode = 'none';
    this.entityContainer = new Container();
    this.entityContainer.eventMode = 'none';
    this.foregroundContainer = new Container();
    this.foregroundContainer.eventMode = 'none';
    this.ambientOverlay = new Graphics();
    this.ambientOverlay.visible = false;
    this.ambientOverlay.eventMode = 'none';
    this.fadeOverlay = new Graphics();
    this.fadeOverlay.visible = false;
    this.fadeOverlay.eventMode = 'none';

    this.stageContainer.addChild(this.mapContainer);
    this.stageContainer.addChild(this.itemBallContainer);
    this.stageContainer.addChild(this.entityContainer);
    this.stageContainer.addChild(this.foregroundContainer);
    this.app.stage.addChild(this.stageContainer);
    this.app.stage.addChild(this.ambientOverlay);
    this.app.stage.addChild(this.fadeOverlay);

    await this.loadAssets(queueOptions);
    this.createPlayerSprite();
  }

  /**
   * Lazily loads an NPC sprite sheet on demand if not yet cached.
   */
  public ensureNpcSpriteLoaded(spriteType: NpcSpriteType): Promise<void> {
    if (this.npcFrames.has(spriteType)) {
      return Promise.resolve();
    }
    const existing = this.loadingNpcPromises.get(spriteType);
    if (existing) {
      return existing;
    }
    const sheetPath = NPC_SHEET_PATHS[spriteType] || NPC_SHEET_PATHS.boy;
    const promise = (async () => {
      try {
        const tex = await Assets.load<Texture>(sheetPath);
        if (tex) {
          tex.source.scaleMode = 'nearest';
          const extracted = this.extractCharacterFrames(tex);
          this.npcFrames.set(spriteType, extracted);
          if (spriteType === 'kris') {
            this.krisFrames = extracted;
          }
        }
      } catch (err) {
        console.warn(`Could not load NPC sprite ${spriteType}:`, err);
      } finally {
        this.loadingNpcPromises.delete(spriteType);
      }
    })();
    this.loadingNpcPromises.set(spriteType, promise);
    return promise;
  }

  private async loadAssets(queueOptions?: ManifestQueueOptions): Promise<void> {
    // 1. Load only essential baseline fallback tiles at startup; all map-specific tiles load on-demand via ensureMapTilesLoaded
    const baselineTileNames = [
      'grass',
      'tall_grass',
      'tree_tall_0',
      'tree_short_0',
      'path',
      'water',
      'water_edge',
      'flower_0',
      'flower_red',
      'flower_yellow',
      'roof',
      'wall',
      'door',
      'fence_horizontal',
      'jt_1e_1f_2e_2f',
      'jt_2e_2f_3e_3f',
    ];

    const manifest = new AssetManifestQueue();

    for (const name of baselineTileNames) {
      manifest.enqueue({
        id: `baseline_tile:${name}`,
        label: `Loading tile ${name}.png`,
        category: 'TILE_TEXTURE',
        execute: async () => {
          const tex = await Assets.load<Texture>(`./assets/tiles/${name}.png`);
          if (tex) {
            tex.source.scaleMode = 'nearest';
            this.tileTextures.set(name, tex);
          }
          if (ANIMATED_WATER_TILES.includes(name) && tex) {
            const f1 = await Assets.load<Texture>(`./assets/tiles/${name}__w1.png`);
            const f2 = await Assets.load<Texture>(`./assets/tiles/${name}__w2.png`);
            f1.source.scaleMode = 'nearest';
            f2.source.scaleMode = 'nearest';
            this.waterAnimFrames.set(name, [tex, f1, f2, f1]);
          }
        },
      });
    }

    // 2. Enqueue player character sheets and default boy NPC fallback sheet at boot; other NPCs load on-demand
    manifest.enqueue({
      id: 'sprite:gold_walk',
      label: 'Loading sprite gold_walk.png',
      category: 'CHARACTER_SPRITE',
      execute: async () => {
        const goldWalkTex = await Assets.load<Texture>('./assets/sprites/characters/gold_walk.png');
        goldWalkTex.source.scaleMode = 'nearest';
        this.goldFrames = this.extractCharacterFrames(goldWalkTex);
        this.playerFrames = this.goldFrames;
      },
    });

    manifest.enqueue({
      id: 'sprite:kris_walk',
      label: 'Loading sprite kris_walk.png',
      category: 'CHARACTER_SPRITE',
      execute: async () => {
        await this.ensureNpcSpriteLoaded('kris');
      },
    });

    manifest.enqueue({
      id: 'sprite:npc_boy',
      label: 'Loading sprite npc_boy.png',
      category: 'CHARACTER_SPRITE',
      execute: async () => {
        await this.ensureNpcSpriteLoaded('boy');
      },
    });

    manifest.enqueue({
      id: 'sprite:fruit_tree_64',
      label: 'Loading sprite fruit_tree_64.png',
      category: 'CHARACTER_SPRITE',
      execute: async () => {
        const treeTex = await Assets.load<Texture>('./assets/sprites/fruit_tree_64.png');
        treeTex.source.scaleMode = 'nearest';
        this.fruitTreeTexture = treeTex;
      },
    });

    await manifest.run(queueOptions);
  }

  /**
   * Switches the active player sprite sheet between Boy (`gold_walk.png`) and Girl (`kris_walk.png`).
   */
  public setPlayerGender(gender: 'BOY' | 'GIRL'): void {
    this.playerFrames = gender === 'GIRL' && this.krisFrames ? this.krisFrames : this.goldFrames;
    if (this.playerSprite && this.playerFrames) {
      this.playerSprite.texture = this.playerFrames.downStand;
    }
  }

  private extractCharacterFrames(sheet: Texture): CharacterFrames {
    const fw = 16;
    const fh = 32;

    const getFrame = (idx: number) => {
      return new Texture({
        source: sheet.source,
        frame: new Rectangle(idx * fw, 0, fw, fh),
      });
    };

    return {
      downStand: getFrame(0),
      upStand: getFrame(1),
      sideStand: getFrame(2),
      downWalk1: getFrame(3),
      downWalk2: getFrame(4),
      upWalk1: getFrame(5),
      upWalk2: getFrame(6),
      sideWalk1: getFrame(7),
      sideWalk2: getFrame(8),
    };
  }

  private createGrassWadingGraphic(): Graphics {
    const g = new Graphics();
    // Draw authentic Gen 2 grass blades overlapping the lower 14px of the character sprite
    g.rect(-22, -12, 44, 14).fill({ color: 0x3b8a3e, alpha: 0.92 });
    // Dark green pixel blade tips
    for (let bx = -20; bx <= 16; bx += 8) {
      g.moveTo(bx, -12)
        .lineTo(bx + 4, -20)
        .lineTo(bx + 8, -12)
        .fill({ color: 0x1e5926 });
      g.moveTo(bx + 2, -10)
        .lineTo(bx + 5, -16)
        .lineTo(bx + 8, -10)
        .fill({ color: 0x65c458 });
    }
    g.visible = false;
    return g;
  }

  private createPlayerSprite(): void {
    this.playerShadow = new Graphics();
    this.playerShadow.ellipse(0, 0, 18, 7).fill({ color: 0x000000, alpha: 0.38 });
    this.playerShadow.visible = false;
    this.entityContainer.addChild(this.playerShadow);

    this.playerSprite = new Sprite(this.playerFrames.downStand);
    this.playerSprite.anchor.set(0.5, 0.85);
    this.playerSprite.scale.set(3, 3);
    this.entityContainer.addChild(this.playerSprite);

    this.playerGrassMask = this.createGrassWadingGraphic();
    this.foregroundContainer.addChild(this.playerGrassMask);
  }

  /**
   * Returns authentic Gen 2 Real-Time Clock (RTC) outdoor tint:
   * - Morning (04:00 - 09:59): warm golden-amber (0xfff4db)
   * - Day     (10:00 - 17:59): crisp daylight (0xffffff)
   * - Night   (18:00 - 03:59): cool nocturnal indigo (0x9aa8f8)
   */
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

  /**
   * Spawns 4 fluttering grass leaf particles when an entity steps onto a tall_grass tile
   * using the pre-allocated GraphicParticlePool (zero GC churn).
   */
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

  /**
   * Plays a crisp diagonal blade slash and foliage burst when HM01 Cut chops a tree in the field
   * using the pre-allocated GraphicParticlePool.
   */
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

  /**
   * Plays a radiant golden-white illumination pulse across the screen when HM05 Flash is used in the field
   */
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

  /**
   * Displays a classic Gen 2 `[!]` exclamation balloon above an NPC trainer's head
   */
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
        fontFamily: ' monospace',
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

  /**
   * Returns the current alpha opacity of the transition fade overlay.
   */
  public getFadeOverlayAlpha(): number {
    return this.fadeOverlay ? this.fadeOverlay.alpha : 0;
  }

  /**
   * Returns whether the transition fade overlay is actively visible.
   */
  public isFadeOverlayVisible(): boolean {
    return this.fadeOverlay ? this.fadeOverlay.visible : false;
  }

  /**
   * Returns whether a tile texture key is buffered in memory.
   */
  public hasTileTexture(name: string): boolean {
    return this.tileTextures.has(name);
  }

  /**
   * Returns a cached tile texture by name, if loaded.
   */
  public getTileTexture(name: string): Texture | undefined {
    return this.tileTextures.get(name);
  }

  /**
   * Returns whether a tile has 4-step animated water frames registered.
   */
  public hasWaterAnimFrames(name: string): boolean {
    return this.waterAnimFrames.has(name);
  }

  /**
   * Returns 4-step animated water frames for a tile, if registered.
   */
  public getWaterAnimFrames(name: string): [Texture, Texture, Texture, Texture] | undefined {
    return this.waterAnimFrames.get(name);
  }

  /**
   * Plays a crisp authentic 160ms doorway fade-to-black / 160ms fade-in transition (320ms total)
   */
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

  private renderMapChunk(map: MapData, offsetTileX: number, offsetTileY: number, isNight: boolean = false): void {
    const isOutdoor = Object.keys(map.connections || {}).length > 0;
    const grassTex = this.tileTextures.get('grass') || Texture.WHITE;
    if (!map.tileMap || map.tileMap.length !== map.width * map.height) return;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const tileName = map.tileMap[index];
        const px = (x + offsetTileX) * this.tileSize;
        const py = (y + offsetTileY) * this.tileSize;

        const isOpaqueTile =
          tileName === 'water' ||
          tileName.startsWith('jt_') ||
          tileName.startsWith('in_') ||
          tileName.startsWith('kt_');

        if (!isOpaqueTile && isOutdoor) {
          const baseSprite = new Sprite(grassTex);
          baseSprite.position.set(px, py);
          baseSprite.width = this.tileSize;
          baseSprite.height = this.tileSize;
          this.mapContainer.addChild(baseSprite);
        }

        const waterFrames = this.waterAnimFrames.get(tileName);
        const resolvedTex = waterFrames
          ? waterFrames[this.waterAnimStep]
          : this.tileTextures.get(tileName);

        // Zero fallback rendering: only use grassTex on outdoor maps where grass is expected;
        // for cave and indoor maps, never flash grassTex!
        const tex = resolvedTex || (isOutdoor ? grassTex : Texture.WHITE);
        const featureSprite = new Sprite(tex);
        featureSprite.position.set(px, py);
        featureSprite.width = this.tileSize;
        featureSprite.height = this.tileSize;
        this.mapContainer.addChild(featureSprite);

        if (waterFrames) {
          this.animatedWaterSprites.push({ sprite: featureSprite, frames: waterFrames });
        }

        // At night, give outdoor building window tiles a warm lantern glow
        if (
          isNight &&
          (tileName.includes('10_11') || tileName.includes('11_12') || tileName.includes('18_19'))
        ) {
          const glow = new Graphics();
          glow.rect(px + 8, py + 12, this.tileSize - 16, this.tileSize - 24).fill({
            color: 0xfde047,
            alpha: 0.22,
          });
          this.mapContainer.addChild(glow);
        }

        if (map.overlayMap && map.overlayMap[index]) {
          const overlayTex = this.tileTextures.get(map.overlayMap[index]!);
          if (overlayTex) {
            const overlaySprite = new Sprite(overlayTex);
            overlaySprite.position.set(px, py);
            overlaySprite.width = this.tileSize;
            overlaySprite.height = this.tileSize;
            this.mapContainer.addChild(overlaySprite);
          }
        }
      }
    }
  }

  /**
   * Ensures all tiles referenced by a map (base tileMap, overlayMap, and adjacent neighbor chunks) are loaded into tileTextures.
   * Loads textures on-demand from ./assets/tiles/${name}.png so maps (such as Route 32 cave rocks,
   * Union Cave, and shoreline water) never fallback to grassTex.
   */
  public async ensureMapTilesLoaded(
    map: MapData,
    lookupMap?: (mapId: string) => MapData | undefined,
    queueOptions?: ManifestQueueOptions
  ): Promise<void> {
    if (!map.tileMap) return;
    const missingTileNames: string[] = [];

    const collectMissing = (m: MapData) => {
      if (m.tileMap) {
        for (const name of m.tileMap) {
          if (name && !this.tileTextures.has(name) && !missingTileNames.includes(name)) {
            missingTileNames.push(name);
          }
        }
      }
      if (m.overlayMap) {
        for (const name of m.overlayMap) {
          if (name && !this.tileTextures.has(name) && !missingTileNames.includes(name)) {
            missingTileNames.push(name);
          }
        }
      }
    };

    collectMissing(map);

    if (lookupMap && map.connections) {
      for (const dir of ['WEST', 'EAST', 'NORTH', 'SOUTH'] as const) {
        const conn = map.connections[dir];
        if (conn) {
          const neighbor = lookupMap(conn.mapId);
          if (neighbor) collectMissing(neighbor);
        }
      }
    }

    if (missingTileNames.length === 0) {
      if (queueOptions?.onProgress) {
        const endPct = Math.max(0, Math.min(100, queueOptions.endPercent ?? 100));
        queueOptions.onProgress({
          completed: 0,
          total: 0,
          percent: Math.round(endPct),
          currentLabel: `Map tiles ready (${map.name || map.id})`,
          category: 'TILE_TEXTURE',
          itemId: `map_tile:${map.id}:ready`,
        });
      }
      return;
    }

    const manifest = new AssetManifestQueue();
    for (const name of missingTileNames) {
      manifest.enqueue({
        id: `map_tile:${map.id}:${name}`,
        label: `Loading map tile ${name}.png`,
        category: ANIMATED_WATER_TILES.includes(name) ? 'WATER_ANIM' : 'TILE_TEXTURE',
        execute: async () => {
          const tex = await Assets.load<Texture>(`./assets/tiles/${name}.png`);
          if (tex) {
            tex.source.scaleMode = 'nearest';
            this.tileTextures.set(name, tex);
          }
          if (ANIMATED_WATER_TILES.includes(name) && !this.waterAnimFrames.has(name) && tex) {
            const f1 = await Assets.load<Texture>(`./assets/tiles/${name}__w1.png`);
            const f2 = await Assets.load<Texture>(`./assets/tiles/${name}__w2.png`);
            f1.source.scaleMode = 'nearest';
            f2.source.scaleMode = 'nearest';
            this.waterAnimFrames.set(name, [tex, f1, f2, f1]);
          }
        },
      });
    }

    await manifest.run(queueOptions);
  }

  /**
   * Builds the textured overworld tilemap, including seamlessly connected neighbor maps (W/E/N/S) and outdoor border blocks
   */
  public renderMap(map: MapData, lookupMap?: (mapId: string) => MapData | undefined): void {
    // Cleanly destroy detached tile Sprite wrappers while keeping shared GPU textures cached
    const oldChildren = this.mapContainer.removeChildren();
    for (let i = 0; i < oldChildren.length; i++) {
      oldChildren[i].destroy({ children: true, texture: false });
    }
    this.animatedWaterSprites.length = 0;
    this.currentRenderedMap = map;
    this.tileSize = map.tileSize;
    this.lastCullCamX = Number.NaN;
    this.lastCullCamY = Number.NaN;

    if (map.tileMap) {
      const hasMissing = map.tileMap.some((name) => name && !this.tileTextures.has(name));
      if (hasMissing) {
        console.warn(
          `[OverworldRenderer] renderMap invoked with unbuffered textures for map "${map.id}". Caller should await ensureMapTilesLoaded(map) before calling renderMap.`
        );
        this.ensureMapTilesLoaded(map, lookupMap).then(() => {
          if (this.currentRenderedMap === map) {
            this.renderMap(map, lookupMap);
          }
        });
      }
    }

    const grassTex = this.tileTextures.get('grass') || Texture.WHITE;
    const tallGrassTex = this.tileTextures.get('tall_grass') || grassTex;
    const pathTex = this.tileTextures.get('path') || grassTex;
    const waterTex = this.tileTextures.get('water') || Texture.WHITE;
    const treeTallTex = this.tileTextures.get('tree_tall_0') || Texture.WHITE;
    const treeShortTex = this.tileTextures.get('tree_short_0') || treeTallTex;
    const roofTex = this.tileTextures.get('roof') || treeTallTex;
    const wallTex = this.tileTextures.get('wall') || treeTallTex;
    const doorTex = this.tileTextures.get('door') || pathTex;
    const flowerTex = this.tileTextures.get('flower_0') || grassTex;

    const isOutdoor = Object.keys(map.connections || {}).length > 0;
    const rtc = this.getTimeOfDayTint();
    this.mapContainer.tint = isOutdoor ? rtc.tint : 0xffffff;
    const isNight = isOutdoor && rtc.period === 'NIGHT';

    // 1. High-fidelity authentic TileMap rendering if defined
    if (map.tileMap && map.tileMap.length === map.width * map.height) {
      if (isOutdoor) {
        // Render surrounding Johto pine tree border blocks (border_block 0x05) so the camera never shows empty black void
        const treeTopTex = this.tileTextures.get('jt_1e_1f_2e_2f') || treeTallTex;
        const treeBotTex = this.tileTextures.get('jt_2e_2f_3e_3f') || treeTallTex;
        const padX = 16;
        const padY = 12;

        const westConn = map.connections.WEST && lookupMap ? lookupMap(map.connections.WEST.mapId) : undefined;
        const eastConn = map.connections.EAST && lookupMap ? lookupMap(map.connections.EAST.mapId) : undefined;
        const northConn = map.connections.NORTH && lookupMap ? lookupMap(map.connections.NORTH.mapId) : undefined;
        const southConn = map.connections.SOUTH && lookupMap ? lookupMap(map.connections.SOUTH.mapId) : undefined;

        const westOff = map.connections.WEST?.offset ?? 0;
        const eastOff = map.connections.EAST?.offset ?? 0;
        const northOff = map.connections.NORTH?.offset ?? 0;
        const southOff = map.connections.SOUTH?.offset ?? 0;

        for (let ty = -padY; ty < map.height + padY; ty++) {
          for (let tx = -padX; tx < map.width + padX; tx++) {
            // Skip tiles inside current map
            if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) continue;
            // Skip tiles inside connected West map
            if (
              westConn &&
              tx >= -westConn.width &&
              tx < 0 &&
              ty >= westOff &&
              ty < westOff + westConn.height
            ) {
              continue;
            }
            // Skip tiles inside connected East map
            if (
              eastConn &&
              tx >= map.width &&
              tx < map.width + eastConn.width &&
              ty >= eastOff &&
              ty < eastOff + eastConn.height
            ) {
              continue;
            }
            // Skip tiles inside connected North map
            if (
              northConn &&
              tx >= northOff &&
              tx < northOff + northConn.width &&
              ty >= -northConn.height &&
              ty < 0
            ) {
              continue;
            }
            // Skip tiles inside connected South map
            if (
              southConn &&
              tx >= southOff &&
              tx < southOff + southConn.width &&
              ty >= map.height &&
              ty < map.height + southConn.height
            ) {
              continue;
            }

            const isEvenY = ((ty % 2) + 2) % 2 === 0;
            const borderSprite = new Sprite(isEvenY ? treeTopTex : treeBotTex);
            borderSprite.position.set(tx * this.tileSize, ty * this.tileSize);
            borderSprite.width = this.tileSize;
            borderSprite.height = this.tileSize;
            this.mapContainer.addChild(borderSprite);
          }
        }

        // Render connected neighbor maps seamlessly adjacent to the active map
        if (westConn && map.connections.WEST) {
          this.renderMapChunk(westConn, -westConn.width, westOff, isNight);
        }
        if (eastConn && map.connections.EAST) {
          this.renderMapChunk(eastConn, map.width, eastOff, isNight);
        }
        if (northConn && map.connections.NORTH) {
          this.renderMapChunk(northConn, northOff, -northConn.height, isNight);
        }
        if (southConn && map.connections.SOUTH) {
          this.renderMapChunk(southConn, southOff, map.height, isNight);
        }
      }

      // Render active map at (0, 0)
      this.renderMapChunk(map, 0, 0, isNight);
      return;
    }

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const collision = map.collisionGrid[index];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        // Base ground sprite (always render grass underneath)
        const baseSprite = new Sprite(grassTex);
        baseSprite.position.set(px, py);
        baseSprite.width = this.tileSize;
        baseSprite.height = this.tileSize;
        this.mapContainer.addChild(baseSprite);

        // Feature sprite
        if (collision === 1) {
          // Solid: Buildings, Roofs, Walls, or Trees
          let tex = treeTallTex;
          if (map.id === 'new_bark_town' || map.id === 'cherrygrove_city') {
            // Building areas in towns
            if (y >= 2 && y <= 3 && ((x >= 2 && x <= 3) || (x >= 11 && x <= 13))) {
              tex = roofTex;
            } else if (y === 4 && ((x >= 2 && x <= 3) || (x >= 11 && x <= 13))) {
              tex = wallTex;
            } else if ((x === 5 || x === 6) && (y === 5 || y === 6)) {
              tex = treeShortTex;
            }
          }
          const featureSprite = new Sprite(tex);
          featureSprite.position.set(px, py);
          featureSprite.width = this.tileSize;
          featureSprite.height = this.tileSize;
          this.mapContainer.addChild(featureSprite);
        } else if (collision === 2) {
          // Tall Grass
          const grassOverlay = new Sprite(tallGrassTex);
          grassOverlay.position.set(px, py);
          grassOverlay.width = this.tileSize;
          grassOverlay.height = this.tileSize;
          this.mapContainer.addChild(grassOverlay);
        } else if (collision === 3) {
          // Water
          const waterSprite = new Sprite(waterTex);
          waterSprite.position.set(px, py);
          waterSprite.width = this.tileSize;
          waterSprite.height = this.tileSize;
          this.mapContainer.addChild(waterSprite);
        } else {
          // Walkable ground (0): Path, Flowers, or Doors
          if (map.warps.some((w) => w.x === x && w.y === y)) {
            const doorSprite = new Sprite(doorTex);
            doorSprite.position.set(px, py);
            doorSprite.width = this.tileSize;
            doorSprite.height = this.tileSize;
            this.mapContainer.addChild(doorSprite);
          } else if (
            // Path detection
            (map.id === 'route_29' && (y === 4 || y === 5)) ||
            (map.id === 'new_bark_town' && (y === 6 || y === 7 || x === 8))
          ) {
            const pathSprite = new Sprite(pathTex);
            pathSprite.position.set(px, py);
            pathSprite.width = this.tileSize;
            pathSprite.height = this.tileSize;
            this.mapContainer.addChild(pathSprite);
          } else if ((x + y * 7) % 11 === 0) {
            // Scattered flowers
            const flowerSprite = new Sprite(flowerTex);
            flowerSprite.position.set(px, py);
            flowerSprite.width = this.tileSize;
            flowerSprite.height = this.tileSize;
            this.mapContainer.addChild(flowerSprite);
          }
        }
      }
    }
  }

  /**
   * Helper to pick current walking animation frame
   */
  private getFrameForEntity(frames: CharacterFrames, dir: Direction, isMoving: boolean, progress: number): Texture {
    if (!isMoving) {
      switch (dir) {
        case 'UP':
          return frames.upStand;
        case 'DOWN':
          return frames.downStand;
        case 'LEFT':
        case 'RIGHT':
          return frames.sideStand;
      }
    }

    // Walking animation cycle (Step 1 -> Stand -> Step 2 -> Stand)
    const step = Math.floor((progress * 4) % 4);
    switch (dir) {
      case 'UP':
        if (step === 0) return frames.upWalk1;
        if (step === 2) return frames.upWalk2;
        return frames.upStand;
      case 'DOWN':
        if (step === 0) return frames.downWalk1;
        if (step === 2) return frames.downWalk2;
        return frames.downStand;
      case 'LEFT':
      case 'RIGHT':
        if (step === 0) return frames.sideWalk1;
        if (step === 2) return frames.sideWalk2;
        return frames.sideStand;
    }
  }

  private isEntityOnTallGrass(entity: GridEntity): boolean {
    const map = this.currentRenderedMap;
    if (!map || entity.isJumping) return false;
    const tx = Math.round(entity.renderX);
    const ty = Math.round(entity.renderY);
    if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return false;
    return map.collisionGrid[ty * map.width + tx] === 2;
  }

  /**
   * Updates player & NPC sprite animations, grass wading overlays, ledge jump arcs, ambient 1.0x water animations, and camera
   */
  public update(player: GridEntity, npcs: GridEntity[] = [], dtWorld: number = 0): void {
    const scale = 3;

    // 0. Update Ambient Water Tile Animations at 1.0x World Time (~0.26s per Gen 2 tick) for visible tiles only
    if (dtWorld > 0 && this.animatedWaterSprites.length > 0) {
      this.waterAnimTimer += dtWorld;
      if (this.waterAnimTimer >= 0.26) {
        this.waterAnimTimer -= 0.26;
        this.waterAnimStep = (this.waterAnimStep + 1) & 3;
        for (let i = 0; i < this.animatedWaterSprites.length; i++) {
          const entry = this.animatedWaterSprites[i];
          if (entry.sprite.visible) {
            entry.sprite.texture = entry.frames[this.waterAnimStep];
          }
        }
      }
    }

    // 0b. Update active Grass Rustle & Cut Leaf Particles (recycling expired graphics back to pool)
    if (dtWorld > 0 && this.grassParticles.length > 0) {
      for (let i = this.grassParticles.length - 1; i >= 0; i--) {
        const p = this.grassParticles[i];
        p.life += dtWorld;
        if (p.life >= p.maxLife) {
          this.particlePool.release(p.graphic);
          this.grassParticles.splice(i, 1);
          continue;
        }
        p.graphic.x += p.vx * dtWorld;
        p.graphic.y += p.vy * dtWorld;
        p.vy += 150 * dtWorld; // gravity
        p.graphic.alpha = 1 - p.life / p.maxLife;
      }
    }

    // 1. Update Player (including parabolic Ledge Hop arc & ground shadow)
    const playerPxX = (player.renderX + 0.5) * this.tileSize;
    const playerPxY = (player.renderY + 0.85) * this.tileSize;
    const jumpArcOffset = player.isJumping ? Math.sin(player.progress * Math.PI) * 30 : 0;

    if (player.isJumping) {
      this.playerShadow.visible = true;
      this.playerShadow.position.set(playerPxX, playerPxY - 4);
    } else {
      this.playerShadow.visible = false;
    }

    this.playerSprite.position.set(playerPxX, playerPxY - jumpArcOffset);

    const playerTex = this.getFrameForEntity(this.playerFrames, player.direction, player.isMoving, player.progress);
    this.playerSprite.texture = playerTex;

    // Raw side frames naturally face LEFT; mirror horizontally for RIGHT
    if (player.direction === 'RIGHT') {
      this.playerSprite.scale.set(-scale, scale);
    } else {
      this.playerSprite.scale.set(scale, scale);
    }

    // Tall Grass Wading Overlay on Player's feet
    if (this.isEntityOnTallGrass(player)) {
      this.playerGrassMask.visible = true;
      this.playerGrassMask.position.set(playerPxX, playerPxY);
    } else {
      this.playerGrassMask.visible = false;
    }

    // 2. Smooth Camera Centering (with responsive mobile zoom)
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    const stageScale = screenWidth < 640 ? Math.min(1.0, Math.max(0.72, screenWidth / 520)) : 1.0;
    this.stageContainer.scale.set(stageScale);

    const cameraTargetX = screenWidth / 2 - (player.renderX + 0.5) * this.tileSize * stageScale;
    const cameraTargetY = screenHeight / 2 - (player.renderY + 0.5) * this.tileSize * stageScale;

    this.stageContainer.position.set(cameraTargetX, cameraTargetY);

    // 2b. Viewport Tile & Item Frustum Culling (skips GPU draw calls for offscreen tiles)
    if (
      Number.isNaN(this.lastCullCamX) ||
      Math.abs(cameraTargetX - this.lastCullCamX) >= 16 ||
      Math.abs(cameraTargetY - this.lastCullCamY) >= 16 ||
      screenWidth !== this.lastCullScreenW ||
      screenHeight !== this.lastCullScreenH
    ) {
      this.lastCullCamX = cameraTargetX;
      this.lastCullCamY = cameraTargetY;
      this.lastCullScreenW = screenWidth;
      this.lastCullScreenH = screenHeight;

      const invScale = 1 / stageScale;
      const padWorld = this.tileSize * 2;
      const minWorldX = -cameraTargetX * invScale - padWorld;
      const maxWorldX = (screenWidth - cameraTargetX) * invScale + padWorld;
      const minWorldY = -cameraTargetY * invScale - padWorld;
      const maxWorldY = (screenHeight - cameraTargetY) * invScale + padWorld;

      const mapChildren = this.mapContainer.children;
      for (let i = 0; i < mapChildren.length; i++) {
        const tileChild = mapChildren[i];
        tileChild.visible =
          tileChild.x >= minWorldX &&
          tileChild.x <= maxWorldX &&
          tileChild.y >= minWorldY &&
          tileChild.y <= maxWorldY;
      }

      const itemChildren = this.itemBallContainer.children;
      for (let i = 0; i < itemChildren.length; i++) {
        const itemChild = itemChildren[i];
        itemChild.visible =
          itemChild.x >= minWorldX &&
          itemChild.x <= maxWorldX &&
          itemChild.y >= minWorldY &&
          itemChild.y <= maxWorldY;
      }
    }

    // 3. Update NPCs across active & connected maps with playing-window viewport culling (Zero-allocation pass)
    for (let i = 0; i < this.activeNpcSpriteList.length; i++) {
      this.activeNpcSpriteList[i].visible = false;
    }
    for (let i = 0; i < this.activeNpcGrassMaskList.length; i++) {
      this.activeNpcGrassMaskList[i].visible = false;
    }

    const cullMargin = this.tileSize * stageScale;

    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const offsetX = npc.worldOffsetX || 0;
      const offsetY = npc.worldOffsetY || 0;
      const npcPxX = (npc.renderX + offsetX + 0.5) * this.tileSize;
      const npcPxY = (npc.renderY + offsetY + 0.85) * this.tileSize;

      const screenX = cameraTargetX + npcPxX * stageScale;
      const screenY = cameraTargetY + npcPxY * stageScale;
      const isInPlayingWindow =
        screenX >= -cullMargin &&
        screenX <= screenWidth + cullMargin &&
        screenY >= -cullMargin &&
        screenY <= screenHeight + cullMargin;

      if (!isInPlayingWindow) continue;

      const desiredSpriteType = npc.spriteType || 'boy';
      if (!this.npcFrames.has(desiredSpriteType)) {
        void this.ensureNpcSpriteLoaded(desiredSpriteType);
      }

      const frames =
        this.npcFrames.get(desiredSpriteType) || this.npcFrames.get('boy') || this.playerFrames;

      let sprite = this.npcSprites.get(npc.id);
      if (!sprite) {
        sprite = new Sprite(frames.downStand);
        sprite.anchor.set(0.5, 0.85);
        sprite.scale.set(scale, scale);
        this.entityContainer.addChild(sprite);
        this.npcSprites.set(npc.id, sprite);
        this.activeNpcSpriteList.push(sprite);
      }
      sprite.visible = true;
      sprite.position.set(npcPxX, npcPxY);

      const npcTex = this.getFrameForEntity(frames, npc.direction, npc.isMoving, npc.progress);
      sprite.texture = npcTex;

      if (npc.direction === 'RIGHT') {
        sprite.scale.set(-scale, scale);
      } else {
        sprite.scale.set(scale, scale);
      }

      if (offsetX === 0 && offsetY === 0 && this.isEntityOnTallGrass(npc)) {
        let mask = this.npcGrassMasks.get(npc.id);
        if (!mask) {
          mask = this.createGrassWadingGraphic();
          this.foregroundContainer.addChild(mask);
          this.npcGrassMasks.set(npc.id, mask);
          this.activeNpcGrassMaskList.push(mask);
        }
        mask.visible = true;
        mask.position.set(npcPxX, npcPxY);
      }
    }
  }

  /**
   * Updates ambient day/night color tint overlay (Ticket 6.2).
   * Automatically disables on indoor maps.
   */
  public updateAmbientLighting(timeOfDay: 'MORNING' | 'DAY' | 'NIGHT', isOutdoor: boolean): void {
    if (!this.ambientOverlay) return;

    if (!isOutdoor) {
      this.ambientOverlay.visible = false;
      this.lastAmbientStateKey = 'INDOOR';
      return;
    }

    const screenW = this.app.screen?.width || 800;
    const screenH = this.app.screen?.height || 600;
    const stateKey = `${timeOfDay}_${screenW}_${screenH}`;
    if (this.lastAmbientStateKey === stateKey) {
      return;
    }
    this.lastAmbientStateKey = stateKey;

    let color = 0x000000;
    let alpha = 0.0;

    if (timeOfDay === 'MORNING') {
      // Warm golden morning amber
      color = 0xfbbf24;
      alpha = 0.12;
    } else if (timeOfDay === 'NIGHT') {
      // Atmospheric nocturnal navy tint
      color = 0x0f172a;
      alpha = 0.38;
    }

    if (alpha <= 0) {
      this.ambientOverlay.visible = false;
    } else {
      this.ambientOverlay.clear();
      this.ambientOverlay.rect(0, 0, screenW, screenH);
      this.ambientOverlay.fill({ color, alpha });
      this.ambientOverlay.visible = true;
    }
  }

  /**
   * Renders active uncollected Overworld Item Balls and Fruit Tree berry indicators on the current map (Sprint 12)
   */
  public renderOverworldItems(
    itemBalls: OverworldItemBall[],
    fruitTrees: OverworldFruitTree[] = [],
    pickedTreeIds: Set<string> = new Set()
  ): void {
    if (!this.itemBallContainer) return;
    this.itemBallContainer.removeChildren();
    this.itemBallGraphics.clear();

    for (const ball of itemBalls) {
      const node = new Container();
      const px = (ball.x + 0.5) * this.tileSize;
      const py = (ball.y + 0.55) * this.tileSize;
      node.position.set(px, py);

      const g = new Graphics();
      // Drop shadow
      g.ellipse(0, 12, 13, 5).fill({ color: 0x000000, alpha: 0.35 });
      // Outer black border
      g.circle(0, 0, 13).fill({ color: 0x111827 });
      // Bottom white half
      g.arc(0, 0, 10, 0, Math.PI).fill({ color: 0xf8fafc });
      // Top red half
      g.arc(0, 0, 10, Math.PI, Math.PI * 2).fill({ color: 0xef4444 });
      // Center band & button
      g.rect(-11, -2, 22, 4).fill({ color: 0x111827 });
      g.circle(0, 0, 4.5).fill({ color: 0x111827 });
      g.circle(0, 0, 2.5).fill({ color: 0xf8fafc });
      // Specular highlight
      g.circle(-4, -5, 2.2).fill({ color: 0xfca5a5, alpha: 0.9 });

      node.addChild(g);
      this.itemBallContainer.addChild(node);
      this.itemBallGraphics.set(ball.eventFlag, node);
      this.itemBallGraphics.set(ball.id, node);
    }

    for (const tree of fruitTrees) {
      const node = new Container();
      const px = (tree.x + 0.5) * this.tileSize;
      const py = (tree.y + 0.5) * this.tileSize;
      node.position.set(px, py);

      const isPicked = pickedTreeIds.has(tree.treeId);

      if (this.fruitTreeTexture) {
        const sprite = new Sprite(this.fruitTreeTexture);
        sprite.anchor.set(0.5, 0.5);
        sprite.width = this.tileSize;
        sprite.height = this.tileSize;
        node.addChild(sprite);
      } else {
        // High-fidelity procedural Gen 2 berry tree fallback
        const g = new Graphics();
        // Drop shadow
        g.ellipse(0, 22, 24, 8).fill({ color: 0x000000, alpha: 0.35 });
        // Textured wooden trunk base
        g.rect(-8, 6, 16, 20).fill({ color: 0x5c3317 });
        g.rect(-6, 8, 4, 16).fill({ color: 0x78350f });
        g.rect(2, 8, 4, 16).fill({ color: 0x451a03 });
        // Multi-tiered leafy green canopy
        g.circle(0, 0, 24).fill({ color: 0x14532d });
        g.circle(-10, -6, 18).fill({ color: 0x166534 });
        g.circle(10, -6, 18).fill({ color: 0x166534 });
        g.circle(0, -12, 19).fill({ color: 0x15803d });
        // Leaf highlights
        g.circle(-6, -14, 10).fill({ color: 0x22c55e });
        g.circle(8, -12, 8).fill({ color: 0x22c55e });

        // Bare foliage branches if already harvested
        if (isPicked) {
          g.moveTo(-10, -4).lineTo(-16, -10).stroke({ width: 2, color: 0x451a03 });
          g.moveTo(10, -4).lineTo(16, -10).stroke({ width: 2, color: 0x451a03 });
          g.moveTo(0, 2).lineTo(0, -6).stroke({ width: 2, color: 0x451a03 });
        }
        node.addChild(g);
      }

      // Hanging colored berries matching fruit type when not picked
      if (!isPicked) {
        const berryColor = this.resolveBerryColor(tree.berryId);
        const berries = new Graphics();
        // Left berry cluster
        berries.circle(-10, -2, 5.5).fill({ color: berryColor });
        berries.circle(-11, -4, 1.8).fill({ color: 0xffffff, alpha: 0.85 });
        // Right berry cluster
        berries.circle(10, -2, 5.5).fill({ color: berryColor });
        berries.circle(9, -4, 1.8).fill({ color: 0xffffff, alpha: 0.85 });
        // Center-front berry
        berries.circle(0, 6, 6).fill({ color: berryColor });
        berries.circle(-1, 4, 2).fill({ color: 0xffffff, alpha: 0.85 });
        node.addChild(berries);
      }

      this.itemBallContainer.addChild(node);
      this.itemBallGraphics.set(tree.treeId, node);
    }
  }

  private resolveBerryColor(berryId?: string): number {
    if (!berryId) return 0xf59e0b;
    const norm = berryId.toLowerCase().replace(/[^a-z]/g, '');
    if (norm.includes('psncure')) return 0xf97316; // Orange (Psncureberry)
    if (norm.includes('przcure')) return 0x3b82f6; // Blue (Przcureberry)
    if (norm.includes('burnt')) return 0x06b6d4;   // Ice Cyan (Burnt Berry)
    if (norm.includes('bitter')) return 0xeab308;  // Yellow (Bitter Berry)
    if (norm.includes('mint')) return 0x10b981;    // Green (Mint Berry)
    if (norm.includes('ice')) return 0xef4444;     // Red (Ice Berry)
    if (norm.includes('mystery')) return 0x8b5cf6; // Purple (Mystery Berry)
    if (norm.includes('miracle')) return 0xfacc15; // Gold (Miracle Berry)
    return 0xf43f5e;                               // Red/Pink (Berry)
  }

  public removeItemBall(flagOrId: string): void {
    const node = this.itemBallGraphics.get(flagOrId);
    if (node) {
      node.visible = false;
      if (node.parent) {
        node.parent.removeChild(node);
      }
      this.itemBallGraphics.delete(flagOrId);
    }
  }
}
