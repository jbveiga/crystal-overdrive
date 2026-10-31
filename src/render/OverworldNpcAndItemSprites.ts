/**
 * @fileoverview OverworldNpcAndItemSprites domain module implementation.
 * @module render/OverworldNpcAndItemSprites
 * @role OverworldNpcAndItemSprites Component
 * @exports CharacterFrames, NPC_SHEET_PATHS, OverworldNpcAndItemSprites
 * @layer render
 * @sections L1-15: Micro-Header & Imports | L16-354: Implementation | L355-708: Handlers & Exports
 */

import { Container, Sprite, Texture, Rectangle, Assets, Graphics } from 'pixi.js';
import type { MapData, Direction, OverworldItemBall, OverworldFruitTree } from '../types/game';
import type { GridEntity, NpcSpriteType } from '../world/GridPhysics';
import { AssetManifestQueue, type ManifestQueueOptions } from '../core/AssetManifestQueue';

export interface CharacterFrames {
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

export const NPC_SHEET_PATHS: Record<NpcSpriteType, string> = {
  boy: './assets/sprites/characters/npc_boy.png',
  girl: './assets/sprites/characters/npc_girl.png',
  fat_man: './assets/sprites/characters/npc_fat_man.png',
  sudowoodo: './assets/sprites/characters/sudowoodo.png',
  fruit_tree: './assets/sprites/characters/fruit_tree.png',
  kris: './assets/sprites/characters/kris_walk.png',
  silver: './assets/sprites/characters/silver.png',
  fisherman: './assets/sprites/characters/fisherman.png',
  fisher: './assets/sprites/characters/fisherman.png',
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
  butterfree: './assets/sprites/characters/butterfree.png',
  blackbelt: './assets/sprites/characters/black_belt.png',
  black_belt: './assets/sprites/characters/black_belt.png',
  boulder: './assets/sprites/characters/boulder.png',
  cooltrainer_f: './assets/sprites/characters/cooltrainer_f.png',
  cooltrainer_m: './assets/sprites/characters/camper.png',
  suicune: './assets/sprites/characters/suicune.png',
  raikou: './assets/sprites/characters/raikou.png',
  entei: './assets/sprites/characters/entei.png',
  morty: './assets/sprites/characters/morty.png',
  eusine: './assets/sprites/characters/eusine.png',
  gramps: './assets/sprites/characters/gramps.png',
  granny: './assets/sprites/characters/granny.png',
  kimono_girl: './assets/sprites/characters/kimono_girl.png',
  clair: './assets/sprites/characters/cooltrainer_f.png',
  pryce: './assets/sprites/characters/elder.png',
  ho_oh: './assets/sprites/characters/lapras.png',
  miltank: './assets/sprites/characters/miltank.png',
  gyarados: './assets/sprites/characters/lapras.png',
  electrode: './assets/sprites/characters/pokefan_m.png',
  voltorb: './assets/sprites/characters/pokefan_m.png',
  lugia: './assets/sprites/characters/lapras.png',
  swimmer_m: './assets/sprites/characters/swimmer_m.png',
  swimmer_f: './assets/sprites/characters/swimmer_f.png',
};

export class OverworldNpcAndItemSprites {
  public static extractCharacterFrames(sheet: Texture): CharacterFrames {
    const fw = 16;
    const fh = 32;

    const getFrame = (idx: number): Texture => {
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

  public static createGrassWadingGraphic(tileSize: number = 64): Graphics {
    const g = new Graphics();
    g.rect(-22, -12, 44, 14).fill({ color: 0x3b8a3e, alpha: 0.92 });
    for (let bx = -20; bx <= 16; bx += 8) {
      g.moveTo(bx, -12).lineTo(bx + 4, -20).lineTo(bx + 8, -12).fill({ color: 0x1e5926 });
      g.moveTo(bx + 2, -10).lineTo(bx + 5, -16).lineTo(bx + 8, -10).fill({ color: 0x48a044 });
    }
    return g;
  }

  public static getFrameForEntity(
    frames: CharacterFrames,
    dir: Direction,
    isMoving: boolean,
    progress: number
  ): Texture {
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

    // Authentic Gen 2 4-step walk cycle (Walk1 -> Stand -> Walk2 -> Stand)
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

  public static ensureNpcSpriteLoaded(
    spriteType: NpcSpriteType,
    npcFrames: Map<string, CharacterFrames>,
    loadingNpcPromises?: Map<NpcSpriteType, Promise<void>>,
    onLoaded?: (frames: CharacterFrames) => void
  ): Promise<void> {
    if (npcFrames.has(spriteType)) return Promise.resolve();
    if (loadingNpcPromises) {
      const existing = loadingNpcPromises.get(spriteType);
      if (existing) return existing;
    }
    const path = NPC_SHEET_PATHS[spriteType] || NPC_SHEET_PATHS.boy;
    const promise = (async () => {
      try {
        const tex = (await Assets.load(path)) as Texture;
        if (tex && tex.source) {
          tex.source.scaleMode = 'nearest';
          const extracted = this.extractCharacterFrames(tex);
          npcFrames.set(spriteType, extracted);
          if (onLoaded) onLoaded(extracted);
        }
      } catch {
        const boyFrames = npcFrames.get('boy');
        if (boyFrames) {
          npcFrames.set(spriteType, boyFrames);
          if (onLoaded) onLoaded(boyFrames);
        }
      } finally {
        if (loadingNpcPromises) loadingNpcPromises.delete(spriteType);
      }
    })();
    if (loadingNpcPromises) loadingNpcPromises.set(spriteType, promise);
    return promise;
  }

  public static spawnMapNpcs(opts: {
    npcs?: GridEntity[];
    lookupMap?: (mapId: string) => MapData | undefined;
    currentRenderedMap: MapData | null;
    lookupMapNpcs?: (mapId: string) => GridEntity[];
    tileSize: number;
    npcFrames: Map<string, CharacterFrames>;
    playerFrames: CharacterFrames;
    npcSprites: Map<string, Sprite>;
    activeNpcSpriteList: Sprite[];
    npcGrassMasks: Map<string, Graphics>;
    activeNpcGrassMaskList: Graphics[];
    entityContainer?: Container;
    foregroundContainer?: Container;
    isEntityOnTallGrass: (entity: GridEntity) => boolean;
  }): void {
    const {
      npcs,
      lookupMap,
      currentRenderedMap,
      lookupMapNpcs,
      tileSize,
      npcFrames,
      playerFrames,
      npcSprites,
      activeNpcSpriteList,
      npcGrassMasks,
      activeNpcGrassMaskList,
      entityContainer,
      foregroundContainer,
      isEntityOnTallGrass,
    } = opts;

    const list: Array<{ npc: GridEntity; offsetX: number; offsetY: number }> = [];

    if (npcs) {
      for (let i = 0; i < npcs.length; i++) {
        const n = npcs[i];
        list.push({ npc: n, offsetX: n.worldOffsetX || 0, offsetY: n.worldOffsetY || 0 });
      }
    } else if (currentRenderedMap && lookupMapNpcs) {
      const activeMap = currentRenderedMap;
      const mainNpcs = lookupMapNpcs(activeMap.id);
      for (let i = 0; i < mainNpcs.length; i++) {
        list.push({ npc: mainNpcs[i], offsetX: 0, offsetY: 0 });
      }

      if (lookupMap && activeMap.connections) {
        if (activeMap.connections.WEST) {
          const conn = activeMap.connections.WEST;
          const westMap = lookupMap(conn.mapId);
          if (westMap) {
            const westNpcs = lookupMapNpcs(westMap.id);
            for (let i = 0; i < westNpcs.length; i++) {
              list.push({ npc: westNpcs[i], offsetX: -westMap.width, offsetY: conn.offset });
            }
          }
        }
        if (activeMap.connections.EAST) {
          const conn = activeMap.connections.EAST;
          const eastMap = lookupMap(conn.mapId);
          if (eastMap) {
            const eastNpcs = lookupMapNpcs(eastMap.id);
            for (let i = 0; i < eastNpcs.length; i++) {
              list.push({ npc: eastNpcs[i], offsetX: activeMap.width, offsetY: conn.offset });
            }
          }
        }
        if (activeMap.connections.NORTH) {
          const conn = activeMap.connections.NORTH;
          const northMap = lookupMap(conn.mapId);
          if (northMap) {
            const northNpcs = lookupMapNpcs(northMap.id);
            for (let i = 0; i < northNpcs.length; i++) {
              list.push({ npc: northNpcs[i], offsetX: conn.offset, offsetY: -northMap.height });
            }
          }
        }
        if (activeMap.connections.SOUTH) {
          const conn = activeMap.connections.SOUTH;
          const southMap = lookupMap(conn.mapId);
          if (southMap) {
            const southNpcs = lookupMapNpcs(southMap.id);
            for (let i = 0; i < southNpcs.length; i++) {
              list.push({ npc: southNpcs[i], offsetX: conn.offset, offsetY: activeMap.height });
            }
          }
        }
      }
    }

    const scale = tileSize / 16;
    const activeZoneNpcs: GridEntity[] = [];

    for (let i = 0; i < list.length; i++) {
      const { npc, offsetX, offsetY } = list[i];
      activeZoneNpcs.push(npc);

      const desiredSpriteType = npc.spriteType || 'boy';
      const frames =
        npcFrames.get(desiredSpriteType) || npcFrames.get('boy') || playerFrames;

      const npcPxX = (npc.renderX + offsetX + 0.5) * tileSize;
      const npcPxY = (npc.renderY + offsetY + 0.85) * tileSize;

      let sprite = npcSprites.get(npc.id);
      if (!sprite) {
        sprite = new Sprite(frames ? frames.downStand : Texture.WHITE);
        sprite.anchor.set(0.5, 0.85);
        sprite.scale.set(scale, scale);
        if (entityContainer) {
          entityContainer.addChild(sprite);
        }
        npcSprites.set(npc.id, sprite);
        activeNpcSpriteList.push(sprite);
      }
      sprite.position.set(npcPxX, npcPxY);

      if (frames) {
        const npcTex = this.getFrameForEntity(frames, npc.direction, npc.isMoving, npc.progress);
        sprite.texture = npcTex;
      }

      if (npc.direction === 'RIGHT') {
        sprite.scale.set(-scale, scale);
      } else {
        sprite.scale.set(scale, scale);
      }

      if (offsetX === 0 && offsetY === 0 && isEntityOnTallGrass(npc)) {
        let mask = npcGrassMasks.get(npc.id);
        if (!mask) {
          mask = this.createGrassWadingGraphic(tileSize);
          if (foregroundContainer) {
            foregroundContainer.addChild(mask);
          }
          npcGrassMasks.set(npc.id, mask);
          activeNpcGrassMaskList.push(mask);
        }
        mask.position.set(npcPxX, npcPxY);
      }
    }

    if (activeZoneNpcs.length > 0) {
      this.evictDistantNpcSprites({
        activeWorldNpcs: activeZoneNpcs,
        npcSprites,
        activeNpcSpriteList,
        npcGrassMasks,
        activeNpcGrassMaskList,
      });
    }
  }

  public static evictDistantNpcSprites(opts: {
    activeWorldNpcs?: GridEntity[];
    npcSprites: Map<string, Sprite>;
    activeNpcSpriteList: Sprite[];
    npcGrassMasks: Map<string, Graphics>;
    activeNpcGrassMaskList: Graphics[];
  }): number {
    const {
      activeWorldNpcs,
      npcSprites,
      activeNpcSpriteList,
      npcGrassMasks,
      activeNpcGrassMaskList,
    } = opts;

    const activeIds = new Set<string>();
    if (activeWorldNpcs) {
      for (let i = 0; i < activeWorldNpcs.length; i++) {
        activeIds.add(activeWorldNpcs[i].id);
      }
    }

    let evictedCount = 0;
    const toRemove: string[] = [];

    for (const [npcId, sprite] of npcSprites) {
      if (!activeIds.has(npcId)) {
        toRemove.push(npcId);
        sprite.visible = false;
        if (sprite.parent) {
          sprite.parent.removeChild(sprite);
        }
        sprite.destroy();
        evictedCount++;
      }
    }

    for (let i = 0; i < toRemove.length; i++) {
      const npcId = toRemove[i];
      npcSprites.delete(npcId);
      const mask = npcGrassMasks.get(npcId);
      if (mask) {
        mask.visible = false;
        if (mask.parent) {
          mask.parent.removeChild(mask);
        }
        mask.destroy();
        npcGrassMasks.delete(npcId);
      }
    }

    if (evictedCount > 0) {
      activeNpcSpriteList.length = 0;
      for (const s of npcSprites.values()) {
        activeNpcSpriteList.push(s);
      }
      activeNpcGrassMaskList.length = 0;
      for (const m of npcGrassMasks.values()) {
        activeNpcGrassMaskList.push(m);
      }
    }

    return evictedCount;
  }

  public static renderOverworldItems(opts: {
    itemBalls: OverworldItemBall[];
    fruitTrees: OverworldFruitTree[];
    pickedTreeIds: Set<string>;
    itemBallContainer?: Container;
    itemBallGraphics: Map<string, Container>;
    tileSize: number;
    fruitTreeTexture?: Texture;
  }): void {
    const {
      itemBalls,
      fruitTrees,
      pickedTreeIds,
      itemBallContainer,
      itemBallGraphics,
      tileSize,
      fruitTreeTexture,
    } = opts;

    if (!itemBallContainer) return;
    itemBallContainer.removeChildren();
    itemBallGraphics.clear();

    for (const ball of itemBalls) {
      const node = new Container();
      const px = (ball.x + 0.5) * tileSize;
      const py = (ball.y + 0.55) * tileSize;
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
      itemBallContainer.addChild(node);
      itemBallGraphics.set(ball.eventFlag, node);
      itemBallGraphics.set(ball.id, node);
    }

    for (const tree of fruitTrees) {
      const node = new Container();
      const px = (tree.x + 0.5) * tileSize;
      const py = (tree.y + 0.5) * tileSize;
      node.position.set(px, py);

      const isPicked = pickedTreeIds.has(tree.treeId);

      if (fruitTreeTexture) {
        const sprite = new Sprite(fruitTreeTexture);
        sprite.anchor.set(0.5, 0.5);
        sprite.width = tileSize;
        sprite.height = tileSize;
        node.addChild(sprite);
      } else {
        // Procedural Gen 2 berry tree fallback
        const g = new Graphics();
        g.ellipse(0, 22, 24, 8).fill({ color: 0x000000, alpha: 0.35 });
        g.rect(-8, 6, 16, 20).fill({ color: 0x5c3317 });
        g.rect(-6, 8, 4, 16).fill({ color: 0x78350f });
        g.rect(2, 8, 4, 16).fill({ color: 0x451a03 });
        g.circle(0, 0, 24).fill({ color: 0x14532d });
        g.circle(-10, -6, 18).fill({ color: 0x166534 });
        g.circle(10, -6, 18).fill({ color: 0x166534 });
        g.circle(0, -12, 19).fill({ color: 0x15803d });
        g.circle(-6, -14, 10).fill({ color: 0x22c55e });
        g.circle(8, -12, 8).fill({ color: 0x22c55e });

        if (isPicked) {
          g.moveTo(-10, -4).lineTo(-16, -10).stroke({ width: 2, color: 0x451a03 });
          g.moveTo(10, -4).lineTo(16, -10).stroke({ width: 2, color: 0x451a03 });
          g.moveTo(0, 2).lineTo(0, -6).stroke({ width: 2, color: 0x451a03 });
        }
        node.addChild(g);
      }

      if (!isPicked) {
        const berryColor = this.resolveBerryColor(tree.berryId);
        const berries = new Graphics();
        berries.circle(-10, -2, 5.5).fill({ color: berryColor });
        berries.circle(-11, -4, 1.8).fill({ color: 0xffffff, alpha: 0.85 });
        berries.circle(10, -2, 5.5).fill({ color: berryColor });
        berries.circle(9, -4, 1.8).fill({ color: 0xffffff, alpha: 0.85 });
        berries.circle(0, 6, 6).fill({ color: berryColor });
        berries.circle(-1, 4, 2).fill({ color: 0xffffff, alpha: 0.85 });
        node.addChild(berries);
      }

      itemBallContainer.addChild(node);
      itemBallGraphics.set(tree.treeId, node);
    }
  }

  public static resolveBerryColor(berryId?: string): number {
    if (!berryId) return 0xf59e0b;
    const norm = berryId.toLowerCase().replace(/[^a-z]/g, '');
    if (norm.includes('psncure')) return 0xf97316; // Orange
    if (norm.includes('przcure')) return 0x3b82f6; // Blue
    if (norm.includes('burnt')) return 0x06b6d4;   // Ice Cyan
    if (norm.includes('bitter')) return 0xeab308;  // Yellow
    if (norm.includes('mint')) return 0x10b981;    // Green
    if (norm.includes('ice')) return 0xef4444;     // Red
    if (norm.includes('mystery')) return 0x8b5cf6; // Purple
    if (norm.includes('miracle')) return 0xfacc15; // Gold
    return 0xf43f5e;                               // Red/Pink
  }

  public static removeItemBall(flagOrId: string, itemBallGraphics: Map<string, Container>): void {
    const node = itemBallGraphics.get(flagOrId);
    if (node) {
      node.visible = false;
      if (node.parent) {
        node.parent.removeChild(node);
      }
      itemBallGraphics.delete(flagOrId);
    }
  }

  public static updateNpcSprites(opts: {
    npcs: GridEntity[];
    cameraTargetX: number;
    cameraTargetY: number;
    stageScale: number;
    screenWidth: number;
    screenHeight: number;
    tileSize: number;
    activeNpcSpriteList: Sprite[];
    activeNpcGrassMaskList: Graphics[];
    npcFrames: Map<string, CharacterFrames>;
    playerFrames: CharacterFrames;
    npcSprites: Map<string, Sprite>;
    npcGrassMasks: Map<string, Graphics>;
    entityContainer?: Container;
    foregroundContainer?: Container;
    ensureNpcSpriteLoaded: (spriteType: NpcSpriteType) => Promise<void>;
    isEntityOnTallGrass: (entity: GridEntity) => boolean;
  }): void {
    const {
      npcs,
      cameraTargetX,
      cameraTargetY,
      stageScale,
      screenWidth,
      screenHeight,
      tileSize,
      activeNpcSpriteList,
      activeNpcGrassMaskList,
      npcFrames,
      playerFrames,
      npcSprites,
      npcGrassMasks,
      entityContainer,
      foregroundContainer,
      ensureNpcSpriteLoaded,
      isEntityOnTallGrass,
    } = opts;

    const scale = 3;
    for (let i = 0; i < activeNpcSpriteList.length; i++) {
      activeNpcSpriteList[i].visible = false;
    }
    for (let i = 0; i < activeNpcGrassMaskList.length; i++) {
      activeNpcGrassMaskList[i].visible = false;
    }

    const cullMargin = tileSize * stageScale;

    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const offsetX = npc.worldOffsetX || 0;
      const offsetY = npc.worldOffsetY || 0;
      const npcPxX = (npc.renderX + offsetX + 0.5) * tileSize;
      const npcPxY = (npc.renderY + offsetY + 0.85) * tileSize;

      const screenX = cameraTargetX + npcPxX * stageScale;
      const screenY = cameraTargetY + npcPxY * stageScale;
      const isInPlayingWindow =
        screenX >= -cullMargin &&
        screenX <= screenWidth + cullMargin &&
        screenY >= -cullMargin &&
        screenY <= screenHeight + cullMargin;

      if (!isInPlayingWindow) continue;

      const desiredSpriteType = npc.spriteType || 'boy';
      if (!npcFrames.has(desiredSpriteType)) {
        void ensureNpcSpriteLoaded(desiredSpriteType);
      }

      const frames = npcFrames.get(desiredSpriteType) || npcFrames.get('boy') || playerFrames;

      let sprite = npcSprites.get(npc.id);
      if (!sprite) {
        sprite = new Sprite(frames.downStand);
        sprite.anchor.set(0.5, 0.85);
        sprite.scale.set(scale, scale);
        if (entityContainer) {
          entityContainer.addChild(sprite);
        }
        npcSprites.set(npc.id, sprite);
        activeNpcSpriteList.push(sprite);
      }
      sprite.visible = true;
      sprite.position.set(npcPxX, npcPxY);

      const npcTex = OverworldNpcAndItemSprites.getFrameForEntity(frames, npc.direction, npc.isMoving, npc.progress);
      sprite.texture = npcTex;

      if (npc.direction === 'RIGHT') {
        sprite.scale.set(-scale, scale);
      } else {
        sprite.scale.set(scale, scale);
      }

      if (offsetX === 0 && offsetY === 0 && isEntityOnTallGrass(npc)) {
        let mask = npcGrassMasks.get(npc.id);
        if (!mask) {
          mask = OverworldNpcAndItemSprites.createGrassWadingGraphic(tileSize);
          if (foregroundContainer) {
            foregroundContainer.addChild(mask);
          }
          npcGrassMasks.set(npc.id, mask);
          activeNpcGrassMaskList.push(mask);
        }
        mask.visible = true;
        mask.position.set(npcPxX, npcPxY);
      }
    }
  }

  public static async ensureMapNpcSpritesLoaded(opts: {
    npcs: GridEntity[];
    npcFrames: Map<NpcSpriteType, CharacterFrames>;
    ensureNpcSpriteLoaded: (spriteType: NpcSpriteType) => Promise<void>;
    queueOptions?: ManifestQueueOptions;
  }): Promise<void> {
    const { npcs, npcFrames, ensureNpcSpriteLoaded, queueOptions } = opts;
    const missingSpriteTypes: NpcSpriteType[] = [];
    for (let i = 0; i < npcs.length; i++) {
      const spriteType = npcs[i].spriteType || 'boy';
      if (!npcFrames.has(spriteType) && !missingSpriteTypes.includes(spriteType)) {
        missingSpriteTypes.push(spriteType);
      }
    }
    if (missingSpriteTypes.length === 0) return;

    const manifest = new AssetManifestQueue();
    for (const spriteType of missingSpriteTypes) {
      manifest.enqueue({
        id: `npc_sprite:${spriteType}`,
        label: `Loading NPC sprite ${spriteType}`,
        category: 'CHARACTER_SPRITE',
        execute: async () => {
          await ensureNpcSpriteLoaded(spriteType);
        },
      });
    }
    await manifest.run(queueOptions);
  }

  public static enqueueBaselineCharacterSprites(
    manifest: AssetManifestQueue,
    onLoaded: (type: 'gold' | 'kris' | 'boy', frames: CharacterFrames) => void
  ): void {
    manifest.enqueue({
      id: 'character_sprite:gold',
      label: 'Loading Gold sprite sheet',
      category: 'CHARACTER_SPRITE',
      execute: async () => {
        const tex = await Assets.load<Texture>('./assets/sprites/characters/gold_walk.png');
        tex.source.scaleMode = 'nearest';
        onLoaded('gold', OverworldNpcAndItemSprites.extractCharacterFrames(tex));
      },
    });

    manifest.enqueue({
      id: 'character_sprite:kris',
      label: 'Loading Kris sprite sheet',
      category: 'CHARACTER_SPRITE',
      execute: async () => {
        const tex = await Assets.load<Texture>('./assets/sprites/characters/kris_walk.png');
        tex.source.scaleMode = 'nearest';
        onLoaded('kris', OverworldNpcAndItemSprites.extractCharacterFrames(tex));
      },
    });

    manifest.enqueue({
      id: 'character_sprite:npc_boy',
      label: 'Loading default boy NPC sprite sheet',
      category: 'CHARACTER_SPRITE',
      execute: async () => {
        const tex = await Assets.load<Texture>(NPC_SHEET_PATHS.boy);
        tex.source.scaleMode = 'nearest';
        onLoaded('boy', OverworldNpcAndItemSprites.extractCharacterFrames(tex));
      },
    });
  }
}
