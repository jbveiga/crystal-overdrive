import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';

/** Story bosses that intentionally gate a region and despawn once beaten. */
const STORY_GATES = new Set(['slowpoke_well_b1f:executive_proton']);
const MIN_SEALED_TILES = 3;

describe('No trainer may permanently seal off part of a map (Burned Tower regression, all maps)', () => {
  it('standing a trainer on its tile never disconnects 3+ walkable tiles from the map entrance', () => {
    const dir = path.resolve(__dirname, '../../public/assets/data/maps');
    const all: Record<string, any[]> = createNpcsByMap() as any;
    const offenders: string[] = [];

    for (const [id, list] of Object.entries(all)) {
      const file = path.join(dir, `${id}.json`);
      if (!fs.existsSync(file)) continue;
      const trainers = list.filter((n) => n.action === 'TRAINER_BATTLE' || n.trainerTeam);
      if (!trainers.length) continue;
      const m = JSON.parse(fs.readFileSync(file, 'utf8'));
      const { width: w, height: h, collisionGrid: c } = m;
      const walk = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && (c[y * w + x] === 0 || c[y * w + x] === 2);
      const start = (m.warps ?? []).map((q: any) => [q.x, q.y] as [number, number]).find(([x, y]: [number, number]) => walk(x, y));
      if (!start) continue;

      const flood = (blocked: Set<string>) => {
        const seen = new Set<string>([start.join(',')]);
        const stack: [number, number][] = [start];
        while (stack.length) {
          const [x, y] = stack.pop()!;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
            if (seen.has(k) || blocked.has(k) || !walk(nx, ny)) continue;
            seen.add(k);
            stack.push([nx, ny]);
          }
        }
        return seen;
      };
      const base = flood(new Set());
      for (const t of trainers) {
        if (STORY_GATES.has(`${id}:${t.id}`)) continue;
        const self = new Set([`${t.x},${t.y}`]);
        const got = flood(self);
        const lost = [...base].filter((k) => !got.has(k) && !self.has(k)).length;
        if (lost >= MIN_SEALED_TILES) offenders.push(`${id}: ${t.id} at (${t.x},${t.y}) seals ${lost} tiles`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
