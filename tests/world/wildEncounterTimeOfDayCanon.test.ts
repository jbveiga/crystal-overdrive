import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const root = path.resolve(__dirname, '../..');
const VALID = new Set(['MORNING', 'DAY', 'NIGHT', 'ANY']);
/** Deliberate, documented departures from the original tables (extra species added by earlier tickets). */
const KNOWN_EXTRAS: Record<string, string[]> = {
  burned_tower_b1f: ['magmar'],
  union_cave_b2f: ['wooper'],
  route_38: ['farfetchd'],
  route_39: ['farfetchd'],
};

function canon(): Record<string, Record<string, Set<string>>> {
  const out: Record<string, Record<string, Set<string>>> = {};
  for (const f of ['data__wild__johto_grass.asm', 'data__wild__kanto_grass.asm']) {
    let cur = '', tod = '';
    for (const l of fs.readFileSync(path.join(root, 'scripts/pokecrystal_raw', f), 'utf8').split('\n')) {
      const m = l.match(/^\s*def_grass_wildmons (\w+)/);
      if (m) { cur = m[1].toLowerCase(); out[cur] = { morn: new Set(), day: new Set(), nite: new Set() }; continue; }
      const t = l.match(/^\s*; (morn|day|nite)\s*$/);
      if (t) { tod = t[1]; continue; }
      const s = l.match(/^\s*db (\d+), (\w+)\s*$/);
      if (s && cur && tod) out[cur][tod].add(s[2].toLowerCase().replace(/_/g, ''));
    }
  }
  return out;
}

describe('Wild encounter tables: time-of-day values and canonical species', () => {
  const dir = path.join(root, 'public/assets/data/maps');
  const maps = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

  it('every grass encounter uses a time-of-day value the engine understands (no silent "ALL")', () => {
    const bad: string[] = [];
    for (const m of maps) for (const e of m.grassEncounters ?? []) if (e.timeOfDay && !VALID.has(e.timeOfDay)) bad.push(`${m.id}:${e.timeOfDay}`);
    expect([...new Set(bad)]).toEqual([]);
  });

  it('per-time-of-day species match the original tables (except documented extras)', () => {
    const c = canon();
    const diffs: string[] = [];
    for (const m of maps) {
      const want = c[m.id];
      if (!want || !(m.grassEncounters ?? []).length) continue;
      for (const [t, k] of [['morn', 'MORNING'], ['day', 'DAY'], ['nite', 'NIGHT']] as const) {
        const got = new Set<string>(
          m.grassEncounters.filter((e: any) => [k, 'ANY', undefined].includes(e.timeOfDay)).map((e: any) => e.speciesId.replace(/[-_]/g, ''))
        );
        const extras = [...got].filter((s) => !want[t].has(s) && !(KNOWN_EXTRAS[m.id] ?? []).includes(s));
        const missing = [...want[t]].filter((s) => !got.has(s));
        if (extras.length || missing.length) diffs.push(`${m.id} ${t}: +${extras} -${missing}`);
      }
    }
    expect(diffs).toEqual([]);
  });
});
