import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getRequiredWarpDirection, isOutdoorMap } from '../../src/world/map/MapClassificationAndWarpRules';

const dir = path.resolve(__dirname, '../../public/assets/data/maps');
const maps = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const byId = (id: string) => maps.find((m) => m.id === id)!;

describe('Interior stairs trigger from any direction (Sprout Tower 2F/3F regression)', () => {
  it('Sprout Tower stairs on every floor need no particular facing', () => {
    for (const id of ['sprout_tower_1f', 'sprout_tower_2f', 'sprout_tower_3f']) {
      const m = byId(id);
      for (const w of m.warps.filter((x: any) => x.targetMapId.startsWith('sprout_tower'))) {
        expect(getRequiredWarpDirection(w, m), `${id} (${w.x},${w.y})`).toBeNull();
      }
    }
  });

  it('no interior→interior warp with open floor below it demands a DOWN press (all maps)', () => {
    const bad: string[] = [];
    for (const m of maps) {
      if (isOutdoorMap(m.id)) continue;
      for (const w of m.warps ?? []) {
        if (isOutdoorMap(w.targetMapId)) continue;
        const below = w.y + 1 < m.height ? m.collisionGrid[(w.y + 1) * m.width + w.x] : undefined;
        if ((below === 0 || below === 2) && getRequiredWarpDirection(w, m) === 'DOWN') bad.push(`${m.id} (${w.x},${w.y})`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('real exits to the overworld at the bottom edge still require DOWN', () => {
    const m = byId('sprout_tower_1f');
    const exit = m.warps.find((w: any) => w.targetMapId === 'violet_city');
    expect(getRequiredWarpDirection(exit, m)).toBe('DOWN');
  });
});
