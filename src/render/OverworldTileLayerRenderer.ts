/**
 * @fileoverview OverworldTileLayerRenderer domain module implementation.
 * @module render/OverworldTileLayerRenderer
 * @role Overworld map tile chunk rendering, border trees, and distant texture eviction
 * @exports BASELINE_TILES, OverworldTileLayerRenderer
 * @layer render
 * @sections L1-95: Map Chunk & Connected Map Helpers | L96-260: Tile Eviction & Full Map Rendering
 */

import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { MapData } from '../types/game';

export const BASELINE_TILES = [
  'grass', 'tall_grass', 'tree_tall_0', 'tree_short_0', 'path', 'water',
  'water_edge', 'flower_0', 'flower_red', 'flower_yellow', 'roof', 'wall',
  'door', 'fence_horizontal', 'jt_1e_1f_2e_2f', 'jt_2e_2f_3e_3f',
];

export class OverworldTileLayerRenderer {
  public static getConnectedMaps(
    currentMap: MapData,
    lookupMap?: (mapId: string) => MapData | undefined
  ): MapData[] {
    if (!lookupMap || !currentMap.connections) return [];
    const maps: MapData[] = [];
    const conns = currentMap.connections;
    for (const dir of ['WEST', 'EAST', 'NORTH', 'SOUTH'] as const) {
      const c = conns[dir];
      if (c) {
        const m = lookupMap(c.mapId);
        if (m) maps.push(m);
      }
    }
    return maps;
  }

  public static renderMapChunk(opts: {
    map: MapData;
    offsetTileX: number;
    offsetTileY: number;
    isNight: boolean;
    tileSize: number;
    tileTextures: Map<string, Texture>;
    waterAnimFrames: Map<string, [Texture, Texture, Texture, Texture]>;
    waterAnimStep: number;
    mapContainer: Container;
    animatedWaterSprites: Array<{ sprite: Sprite; frames: [Texture, Texture, Texture, Texture] }>;
  }): void {
    const {
      map,
      offsetTileX,
      offsetTileY,
      isNight,
      tileSize,
      tileTextures,
      waterAnimFrames,
      waterAnimStep,
      mapContainer,
      animatedWaterSprites,
    } = opts;

    const isOutdoor = Object.keys(map.connections || {}).length > 0;
    const grassTex = tileTextures.get('grass') || Texture.WHITE;
    if (!map.tileMap || map.tileMap.length !== map.width * map.height) return;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const tileName = map.tileMap[index];
        const px = (x + offsetTileX) * tileSize;
        const py = (y + offsetTileY) * tileSize;

        const isOpaqueTile =
          tileName === 'water' ||
          tileName.startsWith('jt_') ||
          tileName.startsWith('in_') ||
          tileName.startsWith('kt_');

        if (!isOpaqueTile && isOutdoor) {
          const baseSprite = new Sprite(grassTex);
          baseSprite.position.set(px, py);
          baseSprite.width = tileSize;
          baseSprite.height = tileSize;
          mapContainer.addChild(baseSprite);
        }

        const waterFrames = waterAnimFrames.get(tileName);
        const resolvedTex = waterFrames
          ? waterFrames[waterAnimStep]
          : tileTextures.get(tileName);

        const tex = resolvedTex || (isOutdoor ? grassTex : Texture.WHITE);
        const featureSprite = new Sprite(tex);
        featureSprite.position.set(px, py);
        featureSprite.width = tileSize;
        featureSprite.height = tileSize;
        mapContainer.addChild(featureSprite);

        if (waterFrames) {
          animatedWaterSprites.push({ sprite: featureSprite, frames: waterFrames });
        }

        if (
          isNight &&
          (tileName.includes('10_11') || tileName.includes('11_12') || tileName.includes('18_19'))
        ) {
          const glow = new Graphics();
          glow.rect(px + 8, py + 12, tileSize - 16, tileSize - 24).fill({
            color: 0xfde047,
            alpha: 0.22,
          });
          mapContainer.addChild(glow);
        }

        if (map.overlayMap && map.overlayMap[index]) {
          const overlayTex = tileTextures.get(map.overlayMap[index]!);
          if (overlayTex) {
            const overlaySprite = new Sprite(overlayTex);
            overlaySprite.position.set(px, py);
            overlaySprite.width = tileSize;
            overlaySprite.height = tileSize;
            mapContainer.addChild(overlaySprite);
          }
        }
      }
    }
  }

  public static evictDistantTileTextures(opts: {
    currentMap: MapData;
    lookupMap?: (mapId: string) => MapData | undefined;
    tileTextures: Map<string, Texture>;
    waterAnimFrames: Map<string, [Texture, Texture, Texture, Texture]>;
  }): number {
    const { currentMap, lookupMap, tileTextures, waterAnimFrames } = opts;
    const activeTileNames = new Set<string>(BASELINE_TILES);

    const mapsToScan: MapData[] = [currentMap, ...this.getConnectedMaps(currentMap, lookupMap)];
    if (lookupMap && currentMap.warps) {
      for (let i = 0; i < currentMap.warps.length; i++) {
        const wm = lookupMap(currentMap.warps[i].targetMapId);
        if (wm) mapsToScan.push(wm);
      }
    }
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
    for (const tileName of tileTextures.keys()) {
      if (!activeTileNames.has(tileName)) toEvict.push(tileName);
    }

    for (let i = 0; i < toEvict.length; i++) {
      const name = toEvict[i];
      const tex = tileTextures.get(name);
      if (tex) {
        tex.destroy(true);
        tileTextures.delete(name);
        Assets.unload(`./assets/tiles/${name}.png`).catch(() => {});
        evictedCount++;
      }
      if (waterAnimFrames.has(name)) {
        const frames = waterAnimFrames.get(name)!;
        frames[1].destroy(true);
        frames[2].destroy(true);
        waterAnimFrames.delete(name);
        Assets.unload(`./assets/tiles/${name}__w1.png`).catch(() => {});
        Assets.unload(`./assets/tiles/${name}__w2.png`).catch(() => {});
      }
    }

    return evictedCount;
  }

  public static renderFallbackProceduralMap(opts: {
    map: MapData;
    tileSize: number;
    tileTextures: Map<string, Texture>;
    mapContainer: Container;
  }): void {
    const { map, tileSize, tileTextures, mapContainer } = opts;
    const grassTex = tileTextures.get('grass') || Texture.WHITE;
    const tallGrassTex = tileTextures.get('tall_grass') || grassTex;
    const pathTex = tileTextures.get('path') || grassTex;
    const waterTex = tileTextures.get('water') || Texture.WHITE;
    const treeTallTex = tileTextures.get('tree_tall_0') || Texture.WHITE;
    const treeShortTex = tileTextures.get('tree_short_0') || treeTallTex;
    const roofTex = tileTextures.get('roof') || treeTallTex;
    const wallTex = tileTextures.get('wall') || treeTallTex;
    const doorTex = tileTextures.get('door') || pathTex;
    const flowerTex = tileTextures.get('flower_0') || grassTex;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const index = y * map.width + x;
        const collision = map.collisionGrid[index];
        const px = x * tileSize;
        const py = y * tileSize;

        const baseSprite = new Sprite(grassTex);
        baseSprite.position.set(px, py);
        baseSprite.width = tileSize;
        baseSprite.height = tileSize;
        mapContainer.addChild(baseSprite);

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
        else if (
          (map.id === 'route_29' && (y === 4 || y === 5)) ||
          (map.id === 'new_bark_town' && (y === 6 || y === 7 || x === 8))
        ) {
          featureTex = pathTex;
        } else if ((x + y * 7) % 11 === 0) featureTex = flowerTex;

        if (featureTex) {
          const s = new Sprite(featureTex);
          s.position.set(px, py);
          s.width = tileSize;
          s.height = tileSize;
          mapContainer.addChild(s);
        }
      }
    }
  }
}
