import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock minimal browser globals for PixiJS environment hydration in node
if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
(globalThis as any).window = globalThis;
if (!(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => null,
    }),
  };
}

import type { MapData } from '../../src/types/game';
import { createAzaleaToIlexNpcs } from '../../src/world/npcs/azaleaToIlexNpcs';

describe('TICKET-BUGFIX-GITHUB-ISSUE-35-01: Route 34 Gate Butterfree Overworld Sprite Defect', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const spritePath = path.join(rootDir, 'public/assets/sprites/characters/butterfree.png');
  const mapPath = path.join(rootDir, 'public/assets/data/maps/route_34_ilex_forest_gate.json');

  it('asserts butterfree character sprite sheet exists on disk with 144x32 dimensions', () => {
    expect(fs.existsSync(spritePath)).toBe(true);
    const buffer = fs.readFileSync(spritePath);
    expect(buffer.length).toBeGreaterThan(0);

    // PNG Header verification: 89 50 4E 47 0D 0A 1A 0A
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);

    // Read IHDR dimensions (offset 16: width, offset 20: height)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    expect(width).toBe(144);
    expect(height).toBe(32);
  });

  it('asserts NPC_SHEET_PATHS maps butterfree to authentic sprite sheet asset', async () => {
    const { NPC_SHEET_PATHS } = await import('../../src/render/OverworldNpcAndItemSprites');
    expect(NPC_SHEET_PATHS.butterfree).toBe('./assets/sprites/characters/butterfree.png');
  });

  it('asserts gate_butterfree NPC uses spriteType "butterfree" instead of human "lass"', () => {
    const npcs = createAzaleaToIlexNpcs();
    const gateNpcs = npcs.route_34_ilex_forest_gate;
    expect(gateNpcs).toBeDefined();

    const butterfree = gateNpcs.find((n) => n.id === 'gate_butterfree');
    expect(butterfree).toBeDefined();
    expect(butterfree?.spriteType).toBe('butterfree');
    expect(butterfree?.speaker).toBe('🦋 BUTTERFREE');
    expect(butterfree?.direction).toBe('LEFT');
    expect(butterfree?.x).toBe(4);
    expect(butterfree?.y).toBe(3);
    expect(butterfree?.pages?.[0]).toContain('Freeh!');
  });

  it('asserts gate_butterfree stands on a walkable tile in route_34_ilex_forest_gate', () => {
    const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const tileIndex = 3 * mapData.width + 4;
    expect(mapData.collisionGrid[tileIndex]).toBe(0);
  });
});
