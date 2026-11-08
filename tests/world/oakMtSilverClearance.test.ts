import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap, applyStoryRecoveryFlags } from '../../src/world/npcData';
import {
  getVictoryRoadGateInteractions,
  checkHasAllSixteenBadges,
  isMtSilverGateOpen,
  getMtSilverGateBlockedPages,
} from '../../src/world/interactions/VictoryRoadGateInteractions';

const JOHTO = ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising'];
const KANTO = ['boulder', 'cascade', 'thunder', 'rainbow', 'soul', 'marsh', 'volcano', 'earth'];

function runOak(flags: Set<string>, badges: string[]) {
  const reg = getVictoryRoadGateInteractions().find((r) => r.npcIds?.includes('oaks_lab_oak'))!;
  const ctx: any = {
    storyFlags: flags, inventory: { badges }, openDialogue: vi.fn(), showToast: vi.fn(), saveCurrentGame: vi.fn(),
    missionManager: { checkStoryFlags: vi.fn() },
  };
  reg.handler({ id: 'oaks_lab_oak', speaker: 'OAK' } as any, {} as any, ctx);
  return ctx;
}

describe('Professor Oak verifies 16 badges before Route 28 / Mt. Silver opens', () => {
  it('Oak stands on a walkable tile in his lab', () => {
    const oak: any = createNpcsByMap().oaks_lab.find((n: any) => n.id === 'oaks_lab_oak')!;
    const map = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/maps/oaks_lab.json'), 'utf8'));
    expect([0, 2]).toContain(map.collisionGrid[oak.y * map.width + oak.x]);
  });

  it('16-badge check requires all 8 Johto AND all 8 Kanto badges', () => {
    expect(checkHasAllSixteenBadges([...JOHTO, ...KANTO])).toBe(true);
    expect(checkHasAllSixteenBadges(JOHTO)).toBe(false);
    expect(checkHasAllSixteenBadges([...JOHTO, ...KANTO.slice(1)])).toBe(false);
    expect(checkHasAllSixteenBadges([...JOHTO, ...KANTO.map((b) => `${b}_badge`)])).toBe(true);
  });

  it('refuses without champion title or with fewer than 16 badges; grants clearance with both', () => {
    const f1 = new Set<string>();
    runOak(f1, [...JOHTO, ...KANTO]);
    expect(f1.has('mt_silver_cleared')).toBe(false); // not champion yet

    const f2 = new Set<string>(['champion_defeated']);
    runOak(f2, [...JOHTO, ...KANTO.slice(0, 7)]);
    expect(f2.has('mt_silver_cleared')).toBe(false); // 15 badges

    const f3 = new Set<string>(['champion_defeated']);
    const ctx = runOak(f3, [...JOHTO, ...KANTO]);
    expect(f3.has('mt_silver_cleared')).toBe(true);
    expect(ctx.missionManager.checkStoryFlags).toHaveBeenCalled();
  });

  it('Route 28 gate needs BOTH champion title and Oak clearance, and explains what is missing', () => {
    expect(isMtSilverGateOpen(new Set(['champion_defeated']))).toBe(false);
    expect(isMtSilverGateOpen(new Set(['mt_silver_cleared']))).toBe(false);
    expect(isMtSilverGateOpen(new Set(['champion_defeated', 'mt_silver_cleared']))).toBe(true);
    expect(getMtSilverGateBlockedPages(new Set()).join(' ')).toMatch(/CHAMPION/);
    expect(getMtSilverGateBlockedPages(new Set(['champion_defeated'])).join(' ')).toMatch(/OAK/);
  });

  it('save safety: players who already reached the summit or beat Red keep Route 28 access', () => {
    for (const legacy of [new Set(['reached_silver_cave_summit']), new Set(['red_defeated'])]) {
      applyStoryRecoveryFlags(legacy, new Set(), { balls: {}, badges: [], tms: [] });
      expect(legacy.has('mt_silver_cleared')).toBe(true);
    }
    const fresh = new Set(['champion_defeated']);
    applyStoryRecoveryFlags(fresh, new Set(), { balls: {}, badges: [], tms: [] });
    expect(fresh.has('mt_silver_cleared')).toBe(false);
  });
});
