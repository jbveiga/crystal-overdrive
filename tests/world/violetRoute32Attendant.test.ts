import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';
import { getVioletAndAzaleaServiceInteractions } from '../../src/world/interactions/VioletAndAzaleaServiceInteractions';

const W = 'violet_r32_attendant_w';
const E = 'violet_r32_attendant_e';
const SIDE = 'violet_r32_attendant_side';
const flags = (...f: string[]) => new Set<string>(f);

function runHandler(npcId: string, storyFlags: Set<string>) {
  const reg = getVioletAndAzaleaServiceInteractions().find((r) => r.npcIds?.includes(npcId))!;
  const ctx: any = {
    storyFlags,
    inventory: { balls: {}, items: {}, badges: [] as string[], tms: [] },
    playerName: 'GOLD',
    openDialogue: vi.fn((_p: string[], _s: string, cb?: () => void) => cb?.()),
    showToast: vi.fn(),
    saveCurrentGame: vi.fn(),
  };
  const handled = reg.handler({ id: npcId, speaker: 'ATTENDANT' } as any, {} as any, ctx);
  return { handled, ctx };
}

describe('Violet City Route 32 attendant checkpoint & Miracle Seed', () => {
  it('blocks both corridor tiles with two attendants for a fresh player', () => {
    const f = flags();
    expect(isNpcActiveForStoryFlags(W, f)).toBe(true);
    expect(isNpcActiveForStoryFlags(E, f)).toBe(true);
    expect(isNpcActiveForStoryFlags(SIDE, f)).toBe(false);
  });

  it('attendants are placed on the 2-tile south corridor; the side attendant is off the road; all on walkable tiles', () => {
    const npcs = createNpcsByMap().violet_city;
    const map = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/maps/violet_city.json'), 'utf8'));
    const at = (id: string) => npcs.find((n: any) => n.id === id)!;
    const corridor = [14, 15];
    expect(corridor).toContain(at(W).x);
    expect(corridor).toContain(at(E).x);
    expect(at(W).x).not.toBe(at(E).x);
    expect(at(W).y).toBe(at(E).y);
    expect(corridor).not.toContain(at(SIDE).x);
    for (const id of [W, E, SIDE]) {
      const n = at(id);
      expect([0, 2]).toContain(map.collisionGrid[n.y * map.width + n.x]);
    }
  });

  it('refuses and explains when badge or egg is missing, without giving the seed', () => {
    for (const f of [flags(), flags('falkner_defeated'), flags('togepi_egg_received')]) {
      const { handled, ctx } = runHandler(W, f);
      expect(handled).toBe(true);
      expect(ctx.inventory.items.miracle_seed).toBeUndefined();
      expect(f.has('route32_attendant_cleared')).toBe(false);
    }
  });

  it('with Zephyr Badge + Mystery Egg gives exactly one Miracle Seed and opens the road', () => {
    const f = flags('falkner_defeated', 'togepi_egg_received');
    const { handled, ctx } = runHandler(W, f);
    expect(handled).toBe(true);
    expect(ctx.inventory.items.miracle_seed).toBe(1);
    expect(f.has('route32_attendant_cleared')).toBe(true);
    expect(isNpcActiveForStoryFlags(W, f)).toBe(false);
    expect(isNpcActiveForStoryFlags(E, f)).toBe(false);
    expect(isNpcActiveForStoryFlags(SIDE, f)).toBe(false);
    // Spamming A afterwards never duplicates the item
    const again = runHandler(E, f);
    expect(again.ctx.inventory.items.miracle_seed).toBeUndefined();
  });

  it('save safety: players already past the checkpoint are never blocked, and can still claim the seed', () => {
    for (const legacy of [flags('route_32_entered'), flags('bugsy_defeated'), flags('slowpoke_well_cleared')]) {
      expect(isNpcActiveForStoryFlags(W, legacy)).toBe(false);
      expect(isNpcActiveForStoryFlags(E, legacy)).toBe(false);
      expect(isNpcActiveForStoryFlags(SIDE, legacy)).toBe(true);
    }
    const f = flags('bugsy_defeated', 'falkner_defeated', 'togepi_egg_received');
    const { ctx } = runHandler(SIDE, f);
    expect(ctx.inventory.items.miracle_seed).toBe(1);
    expect(isNpcActiveForStoryFlags(SIDE, f)).toBe(false);
  });
});
