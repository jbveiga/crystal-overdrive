import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';

const map = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/maps/burned_tower_1f.json'), 'utf8'));

/** Tiles reachable from the entrance on foot (holes to B1F are not walkable). */
function reachable(blocked: Set<string>): Set<string> {
  const { width: w, height: h, collisionGrid: c } = map;
  const holes = new Set(map.warps.filter((x: any) => x.targetMapId === 'burned_tower_b1f').map((x: any) => `${x.x},${x.y}`));
  const start = '9,14';
  const seen = new Set([start]);
  const q = [[9, 14]];
  while (q.length) {
    const [x, y] = q.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(k) || blocked.has(k) || holes.has(k)) continue;
      if (![0, 2].includes(c[ny * w + nx])) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

describe('Burned Tower 1F: no NPC may cut the floor in two', () => {
  // Rival Silver is a one-off story fight that despawns once beaten, so he is excluded
  const npcs: any[] = (createNpcsByMap() as any).burned_tower_1f.filter((n: any) => n.id !== 'silver_burned');
  const base = reachable(new Set());

  it('every permanent NPC (all of them at once, even defeated trainers) leaves every other floor tile reachable', () => {
    const blocked = new Set(npcs.map((n) => `${n.x},${n.y}`));
    const got = reachable(blocked);
    const lost = [...base].filter((k) => !got.has(k) && !blocked.has(k));
    expect(lost).toEqual([]);
  });

  it('the floor tiles beside each hole stay open so the descent can never be sealed by Eusine or Morty', () => {
    const blocked = new Set(npcs.map((n) => `${n.x},${n.y}`));
    expect(blocked.has('10,12')).toBe(false);
    expect(blocked.has('11,12')).toBe(false);
  });
});
