/**
 * @fileoverview PixiJS v8 overworld renderer handling tile textures, character sprites, and camera tracking.
 * @module render/OverworldRenderer
 * @role Overworld Scene Renderer
 * @exports OverworldRenderer, ANIMATED_WATER_TILES, NPC_SHEET_PATHS, CharacterFrames
 * @layer render
 */

import { Application, Container, Sprite, Texture, Assets, Graphics, loadTextures } from 'pixi.js';
import type { MapData, Direction, OverworldItemBall, OverworldFruitTree } from '../types/game';
import type { GridEntity, NpcSpriteType } from '../world/GridPhysics';
import {
  AssetManifestQueue,
  type ManifestQueueOptions,
} from '../core/AssetManifestQueue';
import { ANIMATED_WATER_TILES } from './tileConstants';
import {
  OverworldNpcAndItemSprites,
  NPC_SHEET_PATHS,
  type CharacterFrames,
} from './OverworldNpcAndItemSprites';
import { OverworldParticleAndVfxPool } from './OverworldParticleAndVfxPool';

const BASELINE_TILES = [
  'grass', 'tall_grass', 'tree_tall_0', 'tree_short_0', 'path', 'water',
  'water_edge', 'flower_0', 'flower_red', 'flower_yellow', 'roof', 'wall',
  'door', 'fence_horizontal', 'jt_1e_1f_2e_2f', 'jt_2e_2f_3e_3f',
];

export { ANIMATED_WATER_TILES, NPC_SHEET_PATHS, type CharacterFrames };

export class OverworldRenderer {
  public app!: Application;
  private stageContainer!: Container; private mapContainer!: Container; private itemBallContainer!: Container; private entityContainer!: Container; private foregroundContainer!: Container;
  private playerShadow!: Graphics; private playerSprite!: Sprite; private playerGrassMask!: Graphics;
  private itemBallGraphics: Map<string, Container> = new Map();
  private npcSprites: Map<string, Sprite> = new Map();
  private activeNpcSpriteList: Sprite[] = [];
  private npcGrassMasks: Map<string, Graphics> = new Map();
  private activeNpcGrassMaskList: Graphics[] = [];
  private particlePoolAndVfx!: OverworldParticleAndVfxPool;
  private currentRenderedMap: MapData | null = null;
  private tileSize: number = 64;

  // Textures
  private tileTextures: Map<string, Texture> = new Map();
  private waterAnimFrames: Map<string, [Texture, Texture, Texture, Texture]> = new Map();
  private animatedWaterSprites: Array<{ sprite: Sprite; frames: [Texture, Texture, Texture, Texture] }> = [];
  private waterAnimState = { timer: 0, step: 0 };
  private goldFrames!: CharacterFrames; private krisFrames!: CharacterFrames; private playerFrames!: CharacterFrames;
  private npcFrames: Map<NpcSpriteType, CharacterFrames> = new Map();
  private loadingNpcPromises: Map<NpcSpriteType, Promise<void>> = new Map();
  private fruitTreeTexture: Texture | null = null;
  private lookupMapNpcs?: (mapId: string) => GridEntity[];
  private lastCullState = { camX: Number.NaN, camY: Number.NaN, screenW: 0, screenH: 0 };

  public async init(
    containerElement: HTMLElement,
    queueOptions?: ManifestQueueOptions
  ): Promise<void> {
    if (loadTextures?.config) {
      loadTextures.config.preferWorkers = false;
      loadTextures.config.preferCreateImageBitmap = false;
    }

    const target = containerElement || (typeof document !== 'undefined' ? (document.getElementById('canvas-container') || document.getElementById('game-container') || document.body) : null);

    this.app = new Application();
    await this.app.init({
      resizeTo: target || undefined,
      backgroundColor: 0x0f172a,
      resolution: (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1,
      autoDensity: true,
      antialias: false,
      preserveDrawingBuffer: true,
    });

    if (this.app?.canvas) {
      this.app.canvas.id = 'game-canvas';
    }
    if (target && this.app?.canvas) {
      target.appendChild(this.app.canvas);
    }

    this.stageContainer = new Container(); this.stageContainer.eventMode = 'none';
    this.mapContainer = new Container(); this.mapContainer.eventMode = 'none';
    this.itemBallContainer = new Container(); this.itemBallContainer.eventMode = 'none';
    this.entityContainer = new Container(); this.entityContainer.eventMode = 'none';
    this.foregroundContainer = new Container(); this.foregroundContainer.eventMode = 'none';

    this.stageContainer.addChild(this.mapContainer, this.itemBallContainer, this.entityContainer, this.foregroundContainer);
    this.app.stage.addChild(this.stageContainer);

    this.particlePoolAndVfx = new OverworldParticleAndVfxPool(this.tileSize);
    this.particlePoolAndVfx.init(this.app, this.foregroundContainer, this.app.stage);

    await this.loadAssets(queueOptions);
    this.createPlayerSprite();
  }

  public ensureNpcSpriteLoaded(spriteType: NpcSpriteType): Promise<void> {
    return OverworldNpcAndItemSprites.ensureNpcSpriteLoaded(
      spriteType,
      this.npcFrames,
      this.loadingNpcPromises,
      (frames) => {
        if (spriteType === 'kris') this.krisFrames = frames;
      }
    );
  }

  public setNpcLookup(lookupMapNpcs: (mapId: string) => GridEntity[]): void {
    this.lookupMapNpcs = lookupMapNpcs;
  }

  public async ensureMapNpcSpritesLoaded(
    npcs: GridEntity[],
    queueOptions?: ManifestQueueOptions
  ): Promise<void> {
    await OverworldNpcAndItemSprites.ensureMapNpcSpritesLoaded({
      npcs,
      npcFrames: this.npcFrames,
      ensureNpcSpriteLoaded: (st) => this.ensureNpcSpriteLoaded(st),
      queueOptions,
    });
  }

  public hasNpcSpriteLoaded(spriteType: NpcSpriteType): boolean {
    return this.npcFrames.has(spriteType);
  }

  public hasSpawnedNpcSprite(npcId: string): boolean {
    return this.npcSprites.has(npcId);
  }

  public getSpawnedNpcSpriteCount(): number {
    return this.npcSprites.size;
  }

  private async loadAssets(queueOptions?: ManifestQueueOptions): Promise<void> {
    const manifest = new AssetManifestQueue();
    for (const name of BASELINE_TILES) {
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

    OverworldNpcAndItemSprites.enqueueBaselineCharacterSprites(manifest, (type, frames) => {
      if (type === 'gold') {
        this.goldFrames = frames;
        this.playerFrames = frames;
      } else if (type === 'kris') {
        this.krisFrames = frames;
      } else if (type === 'boy') {
        this.npcFrames.set('boy', frames);
      }
    });

    manifest.enqueue({
      id: 'object:fruit_tree',
      label: 'Loading Fruit Tree berry texture',
      category: 'TILE_TEXTURE',
      execute: async () => {
        try {
          const tex = await Assets.load<Texture>('./assets/tiles/berry_tree.png');
          tex.source.scaleMode = 'nearest';
          this.fruitTreeTexture = tex;
        } catch {
          this.fruitTreeTexture = null;
        }
      },
    });

    await manifest.run(queueOptions);
  }

  public setPlayerGender(gender: 'BOY' | 'GIRL'): void {
    this.playerFrames = gender === 'GIRL' && this.krisFrames ? this.krisFrames : this.goldFrames;
  }

  private createPlayerSprite(): void {
    const scale = 3;
    this.playerShadow = new Graphics();
    this.playerShadow.ellipse(0, 0, 14, 6).fill({ color: 0x000000, alpha: 0.35 });
    this.playerShadow.visible = false;
    this.entityContainer.addChild(this.playerShadow);

    this.playerSprite = new Sprite(this.playerFrames.downStand);
    this.playerSprite.anchor.set(0.5, 0.85);
    this.playerSprite.scale.set(scale, scale);
    this.entityContainer.addChild(this.playerSprite);

    this.playerGrassMask = OverworldNpcAndItemSprites.createGrassWadingGraphic(this.tileSize);
    this.playerGrassMask.visible = false;
    this.foregroundContainer.addChild(this.playerGrassMask);
  }

  public getTimeOfDayTint(): { period: 'MORNING' | 'DAY' | 'NIGHT'; tint: number } {
    return this.particlePoolAndVfx.getTimeOfDayTint();
  }

  public spawnGrassRustle(tileX: number, tileY: number): void {
    this.particlePoolAndVfx.spawnGrassRustle(tileX, tileY);
  }

  public playCutSlashEffect(tileX: number, tileY: number): void {
    this.particlePoolAndVfx.playCutSlashEffect(tileX, tileY);
  }

  public getParticlePoolStats(): { active: number; available: number; total: number } {
    return this.particlePoolAndVfx.getParticlePoolStats();
  }

  public playFlashEffect(durationMs: number = 380): Promise<void> {
    return this.particlePoolAndVfx.playFlashEffect(durationMs);
  }

  public showExclamationBubble(npc: GridEntity, durationMs: number = 600): Promise<void> {
    return this.particlePoolAndVfx.showExclamationBubble(npc, durationMs);
  }

  public getFadeOverlayAlpha(): number {
    return this.particlePoolAndVfx.getFadeOverlayAlpha();
  }

  public isFadeOverlayVisible(): boolean {
    return this.particlePoolAndVfx.isFadeOverlayVisible();
  }

  public hasTileTexture(name: string): boolean {
    return this.tileTextures.has(name);
  }

  public getTileTexture(name: string): Texture | undefined {
    return this.tileTextures.get(name);
  }

  public hasWaterAnimFrames(name: string): boolean {
    return this.waterAnimFrames.has(name);
  }

  public getWaterAnimFrames(name: string): [Texture, Texture, Texture, Texture] | undefined {
    return this.waterAnimFrames.get(name);
  }

  public playDoorwayFade(onMidpoint: () => void | Promise<void>, durationMs: number = 160): Promise<void> {
    return this.particlePoolAndVfx.playDoorwayFade(onMidpoint, durationMs);
  }

  private getConnectedMaps(currentMap: MapData, lookupMap?: (mapId: string) => MapData | undefined): MapData[] {
    if (!lookupMap || !currentMap.connections) return [];
    const maps: MapData[] = [];
    const conns = currentMap.connections;
    for (const dir of ['WEST', 'EAST', 'NORTH', 'SOUTH'] as const) {
      const c = conns[dir];
      if (c) { const m = lookupMap(c.mapId); if (m) maps.push(m); }
    }
    return maps;
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
          ? waterFrames[this.waterAnimState.step]
          : this.tileTextures.get(tileName);

        const tex = resolvedTex || (isOutdoor ? grassTex : Texture.WHITE);
        const featureSprite = new Sprite(tex);
        featureSprite.position.set(px, py);
        featureSprite.width = this.tileSize;
        featureSprite.height = this.tileSize;
        this.mapContainer.addChild(featureSprite);

        if (waterFrames) {
          this.animatedWaterSprites.push({ sprite: featureSprite, frames: waterFrames });
        }

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

  public async ensureMapTilesLoaded(
    map: MapData,
    lookupMap?: (mapId: string) => MapData | undefined,
    queueOptions?: ManifestQueueOptions
  ): Promise<void> {
    const tileNamesToLoad = new Set<string>();
    const missingSpriteTypes: NpcSpriteType[] = [];
    const mapsToScan = [map, ...this.getConnectedMaps(map, lookupMap)];

    for (let mIdx = 0; mIdx < mapsToScan.length; mIdx++) {
      const m = mapsToScan[mIdx];
      if (m.tileMap) {
        for (let i = 0; i < m.tileMap.length; i++) {
          const name = m.tileMap[i];
          if (name && !this.tileTextures.has(name)) tileNamesToLoad.add(name);
        }
      }
      if (m.overlayMap) {
        for (let i = 0; i < m.overlayMap.length; i++) {
          const name = m.overlayMap[i];
          if (name && !this.tileTextures.has(name)) tileNamesToLoad.add(name);
        }
      }
      if (this.lookupMapNpcs) {
        const npcs = this.lookupMapNpcs(m.id);
        for (let j = 0; j < npcs.length; j++) {
          const st = npcs[j].spriteType || 'boy';
          if (!this.npcFrames.has(st) && !missingSpriteTypes.includes(st)) {
            missingSpriteTypes.push(st);
          }
        }
      }
    }

    if (tileNamesToLoad.size === 0 && missingSpriteTypes.length === 0) return;

    const manifest = new AssetManifestQueue();
    for (const name of tileNamesToLoad) {
      manifest.enqueue({
        id: `map_tile:${name}`,
        label: `Loading tile ${name}.png`,
        category: 'TILE_TEXTURE',
        execute: async () => {
          try {
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
          } catch (err) {
            console.warn(`Could not load tile texture ./assets/tiles/${name}.png:`, err);
          }
        },
      });
    }

    for (const spriteType of missingSpriteTypes) {
      manifest.enqueue({
        id: `npc_sprite:${spriteType}`,
        label: `Loading NPC sprite ${spriteType}`,
        category: 'CHARACTER_SPRITE',
        execute: async () => {
          await this.ensureNpcSpriteLoaded(spriteType);
        },
      });
    }

    await manifest.run(queueOptions);
  }

  public evictDistantTileTextures(
    currentMap: MapData,
    lookupMap?: (mapId: string) => MapData | undefined
  ): number {
    this.evictDistantNpcSprites();
    const activeTileNames = new Set<string>(BASELINE_TILES);

    const mapsToScan = [currentMap, ...this.getConnectedMaps(currentMap, lookupMap)];
    for (let mIdx = 0; mIdx < mapsToScan.length; mIdx++) {
      const m = mapsToScan[mIdx];
      if (m.tileMap) {
        for (let i = 0; i < m.tileMap.length; i++) {
          if (m.tileMap[i]) activeTileNames.add(m.tileMap[i]);
        }
      }
      if (m.overlayMap) {
        for (let i = 0; i < m.overlayMap.length; i++) {
          if (m.overlayMap[i]) activeTileNames.add(m.overlayMap[i]!);
        }
      }
    }

    let evictedCount = 0;
    const toEvict: string[] = [];
    for (const tileName of this.tileTextures.keys()) {
      if (!activeTileNames.has(tileName)) toEvict.push(tileName);
    }

    for (let i = 0; i < toEvict.length; i++) {
      const name = toEvict[i];
      const tex = this.tileTextures.get(name);
      if (tex) {
        tex.destroy(true);
        this.tileTextures.delete(name);
        Assets.unload(`./assets/tiles/${name}.png`).catch(() => {});
        evictedCount++;
      }
      if (this.waterAnimFrames.has(name)) {
        const frames = this.waterAnimFrames.get(name)!;
        frames[1].destroy(true);
        frames[2].destroy(true);
        this.waterAnimFrames.delete(name);
        Assets.unload(`./assets/tiles/${name}__w1.png`).catch(() => {});
        Assets.unload(`./assets/tiles/${name}__w2.png`).catch(() => {});
      }
    }

    return evictedCount;
  }

  public spawnMapNpcs(npcs?: GridEntity[], lookupMap?: (mapId: string) => MapData | undefined): void {
    OverworldNpcAndItemSprites.spawnMapNpcs({
      npcs,
      lookupMap,
      currentRenderedMap: this.currentRenderedMap,
      lookupMapNpcs: this.lookupMapNpcs,
      tileSize: this.tileSize,
      npcFrames: this.npcFrames,
      playerFrames: this.playerFrames,
      npcSprites: this.npcSprites,
      activeNpcSpriteList: this.activeNpcSpriteList,
      npcGrassMasks: this.npcGrassMasks,
      activeNpcGrassMaskList: this.activeNpcGrassMaskList,
      entityContainer: this.entityContainer,
      foregroundContainer: this.foregroundContainer,
      isEntityOnTallGrass: (entity) => this.isEntityOnTallGrass(entity),
    });
  }

  public evictDistantNpcSprites(activeWorldNpcs?: GridEntity[]): number {
    return OverworldNpcAndItemSprites.evictDistantNpcSprites({
      activeWorldNpcs,
      npcSprites: this.npcSprites,
      activeNpcSpriteList: this.activeNpcSpriteList,
      npcGrassMasks: this.npcGrassMasks,
      activeNpcGrassMaskList: this.activeNpcGrassMaskList,
    });
  }

  public renderMap(map: MapData, lookupMap?: (mapId: string) => MapData | undefined): void {
    const oldChildren = this.mapContainer.removeChildren();
    for (let i = 0; i < oldChildren.length; i++) {
      oldChildren[i].destroy({ children: true, texture: false });
    }
    this.animatedWaterSprites.length = 0;
    this.currentRenderedMap = map;
    this.tileSize = map.tileSize;
    this.lastCullState.camX = Number.NaN;
    this.lastCullState.camY = Number.NaN;

    this.spawnMapNpcs(undefined, lookupMap);

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
    const isOutdoor = Object.keys(map.connections || {}).length > 0;
    const rtc = this.getTimeOfDayTint();
    this.mapContainer.tint = isOutdoor ? rtc.tint : 0xffffff;
    const isNight = isOutdoor && rtc.period === 'NIGHT';

    if (map.tileMap && map.tileMap.length === map.width * map.height) {
      if (isOutdoor) {
        const treeTallTex = this.tileTextures.get('tree_tall_0') || Texture.WHITE;
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
            if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) continue;
            if (westConn && tx >= -westConn.width && tx < 0 && ty >= westOff && ty < westOff + westConn.height) continue;
            if (eastConn && tx >= map.width && tx < map.width + eastConn.width && ty >= eastOff && ty < eastOff + eastConn.height) continue;
            if (northConn && tx >= northOff && tx < northOff + northConn.width && ty >= -northConn.height && ty < 0) continue;
            if (southConn && tx >= southOff && tx < southOff + southConn.width && ty >= map.height && ty < map.height + southConn.height) continue;

            const isEvenY = ((ty % 2) + 2) % 2 === 0;
            const borderSprite = new Sprite(isEvenY ? treeTopTex : treeBotTex);
            borderSprite.position.set(tx * this.tileSize, ty * this.tileSize);
            borderSprite.width = this.tileSize;
            borderSprite.height = this.tileSize;
            this.mapContainer.addChild(borderSprite);
          }
        }

        if (westConn && map.connections.WEST) this.renderMapChunk(westConn, -westConn.width, westOff, isNight);
        if (eastConn && map.connections.EAST) this.renderMapChunk(eastConn, map.width, eastOff, isNight);
        if (northConn && map.connections.NORTH) this.renderMapChunk(northConn, northOff, -northConn.height, isNight);
        if (southConn && map.connections.SOUTH) this.renderMapChunk(southConn, southOff, map.height, isNight);
      }

      this.renderMapChunk(map, 0, 0, isNight);
      return;
    }

    const tallGrassTex = this.tileTextures.get('tall_grass') || grassTex;
    const pathTex = this.tileTextures.get('path') || grassTex;
    const waterTex = this.tileTextures.get('water') || Texture.WHITE;
    const treeTallTex = this.tileTextures.get('tree_tall_0') || Texture.WHITE;
    const treeShortTex = this.tileTextures.get('tree_short_0') || treeTallTex;
    const roofTex = this.tileTextures.get('roof') || treeTallTex;
    const wallTex = this.tileTextures.get('wall') || treeTallTex;
    const doorTex = this.tileTextures.get('door') || pathTex;
    const flowerTex = this.tileTextures.get('flower_0') || grassTex;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const collision = map.collisionGrid[index];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        const baseSprite = new Sprite(grassTex);
        baseSprite.position.set(px, py);
        baseSprite.width = this.tileSize;
        baseSprite.height = this.tileSize;
        this.mapContainer.addChild(baseSprite);

        let featureTex: Texture | null = null;
        if (collision === 1) {
          featureTex = treeTallTex;
          if (map.id === 'new_bark_town' || map.id === 'cherrygrove_city') {
            if (y >= 2 && y <= 3 && ((x >= 2 && x <= 3) || (x >= 11 && x <= 13))) featureTex = roofTex;
            else if (y === 4 && ((x >= 2 && x <= 3) || (x >= 11 && x <= 13))) featureTex = wallTex;
            else if ((x === 5 || x === 6) && (y === 5 || y === 6)) featureTex = treeShortTex;
          }
        } else if (collision === 2) featureTex = tallGrassTex;
        else if (collision === 3) featureTex = waterTex;
        else if (map.warps.some((w) => w.x === x && w.y === y)) featureTex = doorTex;
        else if ((map.id === 'route_29' && (y === 4 || y === 5)) || (map.id === 'new_bark_town' && (y === 6 || y === 7 || x === 8))) featureTex = pathTex;
        else if ((x + y * 7) % 11 === 0) featureTex = flowerTex;

        if (featureTex) {
          const s = new Sprite(featureTex);
          s.position.set(px, py);
          s.width = this.tileSize;
          s.height = this.tileSize;
          this.mapContainer.addChild(s);
        }
      }
    }
  }

  private isEntityOnTallGrass(entity: GridEntity): boolean {
    if (!this.currentRenderedMap) return false;
    const tx = Math.floor(entity.renderX);
    const ty = Math.floor(entity.renderY);
    if (tx < 0 || tx >= this.currentRenderedMap.width || ty < 0 || ty >= this.currentRenderedMap.height) {
      return false;
    }
    const idx = ty * this.currentRenderedMap.width + tx;
    return this.currentRenderedMap.collisionGrid[idx] === 2;
  }

  public update(player: GridEntity, npcs: GridEntity[] = [], dtWorld: number = 0): void {
    const scale = 3;

    this.particlePoolAndVfx.updateAnimatedWater(this.animatedWaterSprites, dtWorld, this.waterAnimState);
    if (dtWorld > 0) {
      this.particlePoolAndVfx.updateParticles(dtWorld);
    }

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
    const playerTex = OverworldNpcAndItemSprites.getFrameForEntity(
      this.playerFrames,
      player.direction,
      player.isMoving,
      player.progress
    );
    this.playerSprite.texture = playerTex;

    if (player.direction === 'RIGHT') {
      this.playerSprite.scale.set(-scale, scale);
    } else {
      this.playerSprite.scale.set(scale, scale);
    }

    if (this.isEntityOnTallGrass(player)) {
      this.playerGrassMask.visible = true;
      this.playerGrassMask.position.set(playerPxX, playerPxY);
    } else {
      this.playerGrassMask.visible = false;
    }

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const stageScale = screenWidth < 640 ? Math.min(1.0, Math.max(0.72, screenWidth / 520)) : 1.0;
    this.stageContainer.scale.set(stageScale);

    const cameraTargetX = screenWidth / 2 - (player.renderX + 0.5) * this.tileSize * stageScale;
    const cameraTargetY = screenHeight / 2 - (player.renderY + 0.5) * this.tileSize * stageScale;
    this.stageContainer.position.set(cameraTargetX, cameraTargetY);

    this.particlePoolAndVfx.cullFrustumTilesAndItems({
      mapContainer: this.mapContainer,
      itemBallContainer: this.itemBallContainer,
      cameraTargetX,
      cameraTargetY,
      stageScale,
      screenWidth,
      screenHeight,
      tileSize: this.tileSize,
      lastCullState: this.lastCullState,
    });

    OverworldNpcAndItemSprites.updateNpcSprites({
      npcs,
      cameraTargetX,
      cameraTargetY,
      stageScale,
      screenWidth,
      screenHeight,
      tileSize: this.tileSize,
      activeNpcSpriteList: this.activeNpcSpriteList,
      activeNpcGrassMaskList: this.activeNpcGrassMaskList,
      npcFrames: this.npcFrames,
      playerFrames: this.playerFrames,
      npcSprites: this.npcSprites,
      npcGrassMasks: this.npcGrassMasks,
      entityContainer: this.entityContainer,
      foregroundContainer: this.foregroundContainer,
      ensureNpcSpriteLoaded: (st) => this.ensureNpcSpriteLoaded(st),
      isEntityOnTallGrass: (entity) => this.isEntityOnTallGrass(entity),
    });
  }

  public updateAmbientLighting(timeOfDay: 'MORNING' | 'DAY' | 'NIGHT', isOutdoor: boolean): void {
    this.particlePoolAndVfx.updateAmbientLighting(timeOfDay, isOutdoor);
  }

  public renderOverworldItems(
    itemBalls: OverworldItemBall[],
    fruitTrees: OverworldFruitTree[],
    pickedTreeIds: Set<string>
  ): void {
    OverworldNpcAndItemSprites.renderOverworldItems({
      itemBalls,
      fruitTrees,
      pickedTreeIds,
      itemBallContainer: this.itemBallContainer,
      itemBallGraphics: this.itemBallGraphics,
      tileSize: this.tileSize,
      fruitTreeTexture: this.fruitTreeTexture || undefined,
    });
  }

  public removeItemBall(flagOrId: string): void {
    OverworldNpcAndItemSprites.removeItemBall(flagOrId, this.itemBallGraphics);
  }
}
