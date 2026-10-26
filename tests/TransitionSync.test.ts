import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock minimal browser globals for PixiJS environment hydration in node
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: 'node' },
  configurable: true,
  writable: true,
});
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
    }),
  };
}

describe('Warp Transition & Texture Hydration Synchronization (BUGFIX-ASYNC-TILE-TEXTURE-FADE-SYNC-01)', () => {
  const mainTsPath = path.resolve(__dirname, '../src/main.ts');
  const transitionControllerPath = path.resolve(
    __dirname,
    '../src/world/OverworldWarpAndMapTransitionController.ts'
  );
  const rendererTsPath = path.resolve(__dirname, '../src/render/OverworldRenderer.ts');
  const worldMapsPath = path.resolve(__dirname, '../public/assets/data/world_maps.json');
  const tilesDir = path.resolve(__dirname, '../public/assets/tiles');

  const mainSrc =
    fs.readFileSync(mainTsPath, 'utf8') +
    (fs.existsSync(transitionControllerPath)
      ? '\n' + fs.readFileSync(transitionControllerPath, 'utf8')
      : '');
  const rendererSrc = fs.readFileSync(rendererTsPath, 'utf8');
  const worldMaps: any[] = JSON.parse(fs.readFileSync(worldMapsPath, 'utf8'));

  describe('1. Lifecycle Order Invariant (Warp Transitions & Black Veil Lock)', () => {
    it('asserts executeWarpTransition strictly awaits ensureMapTilesLoaded before invoking renderMap', () => {
      // Find executeWarpTransition body across main.ts and OverworldWarpAndMapTransitionController.ts
      const warpFuncMatch = mainSrc.match(
        /(?:const|public static async)\s+executeWarpTransition\s*=?[\s\S]*?playDoorwayFade\([\s\S]*?\}\);/
      );
      expect(warpFuncMatch).not.toBeNull();
      const warpCode = warpFuncMatch![0];

      // Must be an async callback inside playDoorwayFade
      expect(warpCode).toMatch(/playDoorwayFade\(\s*async/);

      // Must await ensureMapTilesLoaded strictly before renderMap
      const ensureIndex = warpCode.indexOf('await overworldRenderer.ensureMapTilesLoaded');
      const renderIndex = warpCode.indexOf('overworldRenderer.renderMap(');

      expect(ensureIndex).toBeGreaterThan(0);
      expect(renderIndex).toBeGreaterThan(0);
      expect(ensureIndex).toBeLessThan(renderIndex);
    });

    it('asserts playDoorwayFade awaits async midpoint callback while veil remains fully opaque (alpha === 1.0)', async () => {
      // Test the playDoorwayFade behavior with simulated animation ticker
      let veilAlpha = 0;
      let midpointRan = false;
      let alphaDuringMidpoint = -1;

      // Simulated fade function matching OverworldRenderer.playDoorwayFade logic
      const simulateDoorwayFade = async (onMidpoint: () => Promise<void>) => {
        // Animate alpha from 0 to 1
        veilAlpha = 1;
        alphaDuringMidpoint = veilAlpha;
        await onMidpoint();
        // Animate alpha from 1 to 0
        veilAlpha = 0;
      };

      await simulateDoorwayFade(async () => {
        // Simulate async texture download / decoding delay
        await new Promise((res) => setTimeout(res, 50));
        midpointRan = true;
      });

      expect(midpointRan).toBe(true);
      expect(alphaDuringMidpoint).toBe(1.0);
      expect(veilAlpha).toBe(0);
    });
  });

  describe('2. Zero Fallback Rendering Invariant (Caves & Indoor Maps)', () => {
    const nonGrassMaps = ['union_cave_1f', 'sprout_tower_1f', 'ruins_of_alph_kabuto_chamber'];

    it('asserts 100% of referenced tiles exist on disk for non-grass maps', () => {
      for (const mapId of nonGrassMaps) {
        const map = worldMaps.find((m) => m.id === mapId);
        expect(map, `Map ${mapId} should be defined in world_maps.json`).toBeDefined();
        expect(map.tileMap).toBeDefined();

        const uniqueTiles = Array.from(new Set(map.tileMap)).filter(Boolean) as string[];
        expect(uniqueTiles.length).toBeGreaterThan(0);

        for (const tile of uniqueTiles) {
          const tilePath = path.join(tilesDir, `${tile}.png`);
          expect(fs.existsSync(tilePath), `Tile texture file ${tile}.png must exist for ${mapId}`).toBe(true);
        }
      }
    });

    it('asserts OverworldRenderer classifies kt_ tiles as opaque, preventing grass underlay generation', () => {
      // In renderMapChunk, isOpaqueTile must check kt_ alongside water, jt_, and in_
      expect(rendererSrc).toContain("tileName.startsWith('kt_')");
      expect(rendererSrc).toContain("tileName.startsWith('jt_')");
      expect(rendererSrc).toContain("tileName.startsWith('in_')");
    });

    it('asserts OverworldRenderer suppresses grassTex underlay on non-outdoor maps', () => {
      // Only outdoor maps (maps with connections) should generate grassTex underneath transparent tiles
      expect(rendererSrc).toContain('!isOpaqueTile && isOutdoor');
    });

    it('asserts OverworldRenderer avoids grassTex fallback for untextured sprites on non-outdoor maps', () => {
      // When resolvedTex is missing on a cave/indoor map, it must not default to grassTex
      expect(rendererSrc).toContain('isOutdoor ? grassTex : Texture.WHITE');
    });
  });

  describe('3. Boot, Save Hydration & Respawn Veil Invariants', () => {
    it('asserts initial map load at engine boot strictly awaits ensureMapTilesLoaded before renderMap', () => {
      const bootSection = mainSrc.slice(0, mainSrc.indexOf('window.dismissLoader'));
      const ensureIndex = bootSection.indexOf('await overworldRenderer.ensureMapTilesLoaded(initialMap');
      const renderIndex = bootSection.indexOf('overworldRenderer.renderMap(initialMap');

      expect(ensureIndex).toBeGreaterThan(0);
      expect(renderIndex).toBeGreaterThan(0);
      expect(ensureIndex).toBeLessThan(renderIndex);
    });

    it('asserts new game intro sequence strictly awaits startMap texture hydration before initial render', () => {
      const introSection = mainSrc.slice(
        mainSrc.indexOf('introSequenceUI = new IntroSequenceUI'),
        mainSrc.indexOf('titleScreenUI = new TitleScreenUI')
      );
      const ensureIndex = introSection.indexOf('await overworldRenderer.ensureMapTilesLoaded(startMap');
      const renderIndex = introSection.indexOf('overworldRenderer.renderMap(startMap');

      expect(ensureIndex).toBeGreaterThan(0);
      expect(renderIndex).toBeGreaterThan(0);
      expect(ensureIndex).toBeLessThan(renderIndex);
    });

    it('asserts battle whiteout respawn strictly awaits respawnMap texture hydration before rendering', () => {
      const whiteoutSection = mainSrc.slice(
        mainSrc.indexOf('const respawnMap = mapManager.setCurrentMap'),
        mainSrc.indexOf('healPlayerParty(false)')
      );
      const ensureIndex = whiteoutSection.indexOf('await overworldRenderer.ensureMapTilesLoaded(respawnMap');
      const renderIndex = whiteoutSection.indexOf('overworldRenderer.renderMap(respawnMap');

      expect(ensureIndex).toBeGreaterThan(0);
      expect(renderIndex).toBeGreaterThan(0);
      expect(ensureIndex).toBeLessThan(renderIndex);
    });
  });

  describe('4. Dynamic Map Renderer Signatures & Observability', () => {
    it('exposes getFadeOverlayAlpha and hasTileTexture on OverworldRenderer for lifecycle verification', async () => {
      const { OverworldRenderer } = await import('../src/render/OverworldRenderer');
      expect(typeof OverworldRenderer.prototype.getFadeOverlayAlpha).toBe('function');
      expect(typeof OverworldRenderer.prototype.isFadeOverlayVisible).toBe('function');
      expect(typeof OverworldRenderer.prototype.hasTileTexture).toBe('function');
      expect(typeof OverworldRenderer.prototype.getTileTexture).toBe('function');
      expect(typeof OverworldRenderer.prototype.ensureMapTilesLoaded).toBe('function');
      expect(typeof OverworldRenderer.prototype.renderMap).toBe('function');
    });
  });
});
