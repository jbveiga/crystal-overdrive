import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const root = path.resolve(__dirname, '..');

/** Parses data/trainers/parties.asm into { "class|name": [[species, level][]...] } */
function parseParties(): Record<string, [string, number][][]> {
  const lines = fs.readFileSync(path.join(root, 'scripts/pokecrystal_raw/data__trainers__parties.asm'), 'utf8').split('\n');
  const out: Record<string, [string, number][][]> = {};
  let cur: string | null = null;
  for (const l of lines) {
    const name = l.match(/^\s*db "([^@]+)@"/);
    if (name) { cur = name[1].toLowerCase().replace(/\s/g, ''); (out[cur] ||= []).push([]); continue; }
    const mon = l.match(/^\s*db (\d+), ([A-Z_0-9]+)\s*(,.*)?(;.*)?$/);
    if (mon && cur) out[cur][out[cur].length - 1].push([mon[2].toLowerCase().replace(/_/g, ''), Number(mon[1])]);
  }
  return out;
}

describe('Generated trainers match canonical Crystal parties (Kanto post-game levels are intentional)', () => {
  it('every generated TRAINER_BATTLE team equals a canonical party for that trainer name', () => {
    const parties = parseParties();
    const generated = JSON.parse(fs.readFileSync(path.join(root, 'scripts/generated-npcs.json'), 'utf8'));
    let checked = 0;
    const mismatches: string[] = [];
    for (const [map, npcs] of Object.entries<any[]>(generated)) {
      for (const n of npcs) {
        if (n.action !== 'TRAINER_BATTLE' || !n.team) continue;
        checked++;
        const key = n.trainerName.toLowerCase().replace(/\s/g, '');
        const got = JSON.stringify(n.team.map((p: any) => [p.speciesId.replace(/-/g, ''), p.level]));
        const ok = Object.entries(parties).some(([name, variants]) => key.endsWith(name) && variants.some((v) => JSON.stringify(v) === got));
        if (!ok) mismatches.push(`${map}: ${n.trainerName} ${got}`);
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(mismatches).toEqual([]);
  });
});
