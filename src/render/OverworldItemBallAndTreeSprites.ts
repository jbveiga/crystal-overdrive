/**
 * @fileoverview OverworldItemBallAndTreeSprites domain module implementation.
 * @module render/OverworldItemBallAndTreeSprites
 * @role Overworld item ball, berry tree graphics, and distant NPC sprite eviction
 * @exports OverworldItemBallAndTreeSprites
 * @layer render
 * @sections L1-80: Distant NPC Sprite Eviction | L81-215: Item Ball & Fruit Tree Rendering
 */

import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { OverworldFruitTree, OverworldItemBall } from '../types/game';
import type { GridEntity } from '../world/GridPhysics';

export class OverworldItemBallAndTreeSprites {
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
      g.ellipse(0, 12, 13, 5).fill({ color: 0x000000, alpha: 0.35 });
      g.circle(0, 0, 13).fill({ color: 0x111827 });
      g.arc(0, 0, 10, 0, Math.PI).fill({ color: 0xf8fafc });
      g.arc(0, 0, 10, Math.PI, Math.PI * 2).fill({ color: 0xef4444 });
      g.rect(-11, -2, 22, 4).fill({ color: 0x111827 });
      g.circle(0, 0, 4.5).fill({ color: 0x111827 });
      g.circle(0, 0, 2.5).fill({ color: 0xf8fafc });
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
    if (norm.includes('psncure')) return 0xf97316;
    if (norm.includes('przcure')) return 0x3b82f6;
    if (norm.includes('burnt')) return 0x06b6d4;
    if (norm.includes('bitter')) return 0xeab308;
    if (norm.includes('mint')) return 0x10b981;
    if (norm.includes('ice')) return 0xef4444;
    if (norm.includes('mystery')) return 0x8b5cf6;
    if (norm.includes('miracle')) return 0xfacc15;
    return 0xf43f5e;
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
}
