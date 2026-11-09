import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';
import { createGoldenrodTakeoverInteractions } from '../../src/world/interactions/GoldenrodTakeoverInteractions';

const load = (m: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../public/assets/data/maps/${m}.json`), 'utf8'));
const npcs: any = createNpcsByMap();
const find = (map: string, id: string) => npcs[map].find((n: any) => n.id === id);

function run(npcId: string, flags: Set<string>) {
  const reg = createGoldenrodTakeoverInteractions().find((r: any) => r.npcIds?.includes(npcId))!;
  const lines: string[] = [];
  let battle: any = null;
  const ctx: any = {
    storyFlags: flags, playerName: 'ASH', defeatedTrainers: new Set<string>(),
    inventory: { items: {}, keyItems: [] },
    openDialogue: (l: string[], _s: string, cb?: () => void) => { lines.push(...l); cb?.(); },
    showToast: () => {}, saveCurrentGame: () => {},
    triggerBattle: (_p: any, o: any) => { battle = o; },
    getRivalName: () => 'SILVER',
  };
  const map: any = { id: 'x' };
  reg.handler(find('radio_tower_1f', npcId) || find('radio_tower_2f', npcId) || find('goldenrod_underground', npcId), map, ctx);
  return { lines, battle, ctx };
}

describe('Disguise infiltration (story 7.1)', () => {
  it('NPCs stand on walkable tiles; guard blocks the only approach to the 1F stairs', () => {
    for (const [m, id] of [['goldenrod_underground', 'rocket_disguise_operative'], ['radio_tower_1f', 'radio_tower_1f_guard'], ['radio_tower_2f', 'rival_radio_2f']]) {
      const n = find(m, id); const map = load(m);
      expect(n, id).toBeDefined();
      expect([0, 2]).toContain(map.collisionGrid[n.y * map.width + n.x]);
      expect(map.warps.some((w: any) => w.x === n.x && w.y === n.y)).toBe(false);
    }
    const g = find('radio_tower_1f', 'radio_tower_1f_guard');
    expect([g.x, g.y]).toEqual([15, 1]);
  });

  it('lifecycle: operative/guard appear after Pryce; guard and rival vanish on progress or liberation', () => {
    expect(isNpcActiveForStoryFlags('radio_tower_1f_guard', new Set())).toBe(false);
    const takeover = new Set(['pryce_defeated']);
    expect(isNpcActiveForStoryFlags('radio_tower_1f_guard', takeover)).toBe(true);
    expect(isNpcActiveForStoryFlags('rocket_disguise_operative', takeover)).toBe(true);
    expect(isNpcActiveForStoryFlags('rival_radio_2f', takeover)).toBe(false);
    const bluffed = new Set([...takeover, 'rocket_guard_bluffed']);
    expect(isNpcActiveForStoryFlags('radio_tower_1f_guard', bluffed)).toBe(false);
    expect(isNpcActiveForStoryFlags('rival_radio_2f', bluffed)).toBe(true);
    expect(isNpcActiveForStoryFlags('rival_radio_2f', new Set([...bluffed, 'rival_radio_defeated']))).toBe(false);
    // legacy saves that already got past Petrel are never blocked
    expect(isNpcActiveForStoryFlags('radio_tower_1f_guard', new Set([...takeover, 'fake_director_defeated']))).toBe(false);
    expect(isNpcActiveForStoryFlags('rival_radio_2f', new Set([...bluffed, 'fake_director_defeated']))).toBe(false);
    for (const id of ['radio_tower_1f_guard', 'rocket_disguise_operative', 'rival_radio_2f'])
      expect(isNpcActiveForStoryFlags(id, new Set([...bluffed, 'radio_tower_liberated']))).toBe(false);
  });

  it('guard refuses without the uniform, lets the disguised player through', () => {
    const flags = new Set(['pryce_defeated']);
    run('radio_tower_1f_guard', flags);
    expect(flags.has('rocket_guard_bluffed')).toBe(false);
    run('rocket_disguise_operative', flags);
    expect(flags.has('rocket_disguise_worn')).toBe(true);
    run('radio_tower_1f_guard', flags);
    expect(flags.has('rocket_guard_bluffed')).toBe(true);
  });

  it('Rival rips off the disguise and fights; victory is recorded', () => {
    const flags = new Set(['pryce_defeated', 'rocket_disguise_worn', 'rocket_guard_bluffed']);
    const { battle, ctx } = run('rival_radio_2f', flags);
    expect(flags.has('rocket_disguise_worn')).toBe(false);
    expect(flags.has('rocket_disguise_exposed')).toBe(true);
    expect(battle.isTrainer).toBe(true);
    battle.onVictory();
    expect(flags.has('rival_radio_defeated')).toBe(true);
    expect(ctx.defeatedTrainers.has('rival_radio_2f')).toBe(true);
  });
});
