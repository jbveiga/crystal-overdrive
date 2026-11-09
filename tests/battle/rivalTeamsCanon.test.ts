import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getRivalTeamSpecs, resolvePlayerStarter, type RivalStage, type PlayerStarter } from '../../src/battle/RivalTeams';

/** RIVAL1 party indexes (1-based) in parties.asm: [chikorita-player, cyndaquil-player, totodile-player] */
const CANON: Record<RivalStage, number[]> = { burned_tower: [8, 9, 7], goldenrod_underground: [11, 12, 10], victory_road: [14, 15, 13] };
const STARTERS: PlayerStarter[] = ['chikorita', 'cyndaquil', 'totodile'];

function parse(): [string, number, string[]][][] {
  const out: [string, number, string[]][][] = [];
  let inRival1 = false;
  for (const l of fs.readFileSync(path.resolve(__dirname, '../../scripts/pokecrystal_raw/data__trainers__parties.asm'), 'utf8').split('\n')) {
    const h = l.match(/^\s*; ([A-Z0-9]+) \((\d+)\)/);
    if (h) { inRival1 = h[1] === 'RIVAL1'; if (inRival1) out.push([]); continue; }
    const m = l.match(/^\s*db\s+(\d+),\s*([A-Z_]+),\s*(.+)$/);
    if (inRival1 && m) out[out.length - 1].push([m[2].toLowerCase().replace(/_/g, ''), Number(m[1]), m[3].split(';')[0].split(',').map((x) => x.trim().toLowerCase().replace(/_/g, '')).filter(Boolean)]);
  }
  return out;
}

describe('Rival teams match canonical Crystal parties', () => {
  const parties = parse();
  for (const stage of Object.keys(CANON) as RivalStage[]) {
    STARTERS.forEach((starter, i) => {
      it(`${stage} vs ${starter}: species and levels`, () => {
        const canon = parties[CANON[stage][i] - 1];
        const got = getRivalTeamSpecs(stage, starter);
        expect(got.map((s) => [s.speciesId, s.level])).toEqual(canon.map(([sp, lv]) => [sp, lv]));
      });
    });
  }
  it('resolves the player starter from flags or party line', () => {
    expect(resolvePlayerStarter(new Set(['starter_totodile']), [])).toBe('totodile');
    expect(resolvePlayerStarter(new Set(), [{ speciesId: 'quilava' }])).toBe('cyndaquil');
    expect(resolvePlayerStarter(new Set(), [])).toBe('chikorita');
  });
});
