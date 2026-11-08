import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';

const ARIANA = 'executive_ariana_radio_3f';
const ARCHER = 'archer_radio_3f';
const load = (m: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../public/assets/data/maps/${m}.json`), 'utf8'));

describe('Radio Tower executive layout: Ariana & Archer ambush behind the 3F Card Key shutter', () => {
  const npcs = createNpcsByMap();

  it('both executives live on 3F (not 5F) on walkable tiles clear of warps and the shutter tile', () => {
    expect(npcs.radio_tower_5f.some((n: any) => /ariana|archer/.test(n.id))).toBe(false);
    const map = load('radio_tower_3f');
    const occupied = new Set([...map.warps.map((w: any) => `${w.x},${w.y}`), '0,7']);
    for (const id of [ARIANA, ARCHER]) {
      const n: any = npcs.radio_tower_3f.find((x: any) => x.id === id)!;
      expect(n).toBeDefined();
      expect([0, 2]).toContain(map.collisionGrid[n.y * map.width + n.x]);
      expect(occupied.has(`${n.x},${n.y}`)).toBe(false);
    }
  });

  it('they only appear once the Card Key shutter has been opened, and vanish when defeated/liberated', () => {
    const none = new Set<string>();
    expect(isNpcActiveForStoryFlags(ARIANA, none)).toBe(false);
    expect(isNpcActiveForStoryFlags(ARCHER, none)).toBe(false);
    // Having the key alone is not enough: the shutter must be opened
    const key = new Set(['card_key_obtained']);
    expect(isNpcActiveForStoryFlags(ARIANA, key)).toBe(false);
    expect(isNpcActiveForStoryFlags(ARCHER, key)).toBe(false);
    const open = new Set(['card_key_obtained', 'EVENT_USED_CARD_KEY']);
    expect(isNpcActiveForStoryFlags(ARIANA, open)).toBe(true);
    expect(isNpcActiveForStoryFlags(ARCHER, open)).toBe(true);
    expect(isNpcActiveForStoryFlags(ARIANA, new Set([...open, 'ariana_defeated']))).toBe(false);
    expect(isNpcActiveForStoryFlags(ARIANA, new Set([...open, 'radio_tower_liberated']))).toBe(false);
    expect(isNpcActiveForStoryFlags(ARCHER, new Set([...open, 'radio_tower_liberated']))).toBe(false);
  });

  it('keeps canonical teams: Ariana (Arbok, Vileplume, Murkrow) and Archer (Houndour, Koffing, Houndoom)', () => {
    const species = (id: string) => (npcs.radio_tower_3f.find((x: any) => x.id === id) as any).trainerTeam.map((p: any) => p.speciesId);
    expect(species(ARIANA)).toEqual(['arbok', 'vileplume', 'murkrow']);
    expect(species(ARCHER)).toEqual(['houndour', 'koffing', 'houndoom']);
  });
});
