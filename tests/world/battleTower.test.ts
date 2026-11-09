import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import {
  BATTLE_TOWER_POOL, BATTLE_TOWER_STREAK, BATTLE_TOWER_VITAMINS, awardBattleTowerPrize, battleTowerLevel,
  buildBattleTowerOpponent, createBattleTowerInteractions,
} from '../../src/world/interactions/BattleTowerInteractions';

const load = (m: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../public/assets/data/maps/${m}.json`), 'utf8'));

describe('Battle Tower', () => {
  it('lobby and gate are reciprocally linked on walkable tiles; receptionist is walkable', () => {
    const gate = load('route_40_battle_tower_gate'), lobby = load('battle_tower_lobby');
    const ok = (m: any, x: number, y: number) => [0, 2].includes(m.collisionGrid[y * m.width + x]);
    for (const w of gate.warps.filter((w: any) => w.targetMapId === 'battle_tower_lobby')) {
      expect(ok(lobby, w.targetX, w.targetY)).toBe(true);
    }
    for (const w of lobby.warps) {
      expect(w.targetMapId).toBe('route_40_battle_tower_gate');
      expect(ok(gate, w.targetX, w.targetY)).toBe(true);
    }
    const r: any = (createNpcsByMap() as any).battle_tower_lobby.find((n: any) => n.id === 'battle_tower_receptionist');
    expect(ok(lobby, r.x, r.y)).toBe(true);
  });

  it('every opponent template builds valid Pokémon at any level', () => {
    for (const t of BATTLE_TOWER_POOL) {
      expect(t.team.length).toBe(3);
      expect(buildBattleTowerOpponent(t, 50).every((p) => p.level === 50)).toBe(true);
    }
    expect(BATTLE_TOWER_POOL.length).toBeGreaterThanOrEqual(BATTLE_TOWER_STREAK);
  });

  it('prize is a random bundle of 5 vitamins', () => {
    for (let i = 0; i < BATTLE_TOWER_VITAMINS.length; i++) {
      const items: Record<string, number> = { [BATTLE_TOWER_VITAMINS[i]]: 1 };
      const p = awardBattleTowerPrize(items, () => i / BATTLE_TOWER_VITAMINS.length);
      expect(p.itemId).toBe(BATTLE_TOWER_VITAMINS[i]);
      expect(items[p.itemId]).toBe(6);
    }
  });

  it('level scales with the top three party members and is clamped', () => {
    expect(battleTowerLevel([{ level: 5 }] as any)).toBe(10);
    expect(battleTowerLevel([{ level: 40 }, { level: 50 }, { level: 60 }, { level: 5 }] as any)).toBe(50);
    expect(battleTowerLevel([{ level: 100 }, { level: 100 }, { level: 100 }] as any)).toBe(100);
  });

  it('full gauntlet: 7 consecutive wins pay out; a loss pays nothing', async () => {
    const reg = createBattleTowerInteractions()[0];
    const mk = (win: boolean) => {
      const items: Record<string, number> = {}; let battles = 0;
      const ctx: any = {
        playerParty: [1, 2, 3].map(() => ({ level: 30, currentHp: 10 })), storyFlags: new Set(), inventory: { items },
        openDialogue: (_l: string[], _s: string, cb?: () => void) => cb?.(), showToast: () => {}, saveCurrentGame: () => {},
        triggerBattle: (_p: any, o: any) => { battles++; if (win || battles < 3) o.onVictory(); },
      };
      reg.handler({ speaker: 'x' } as any, {} as any, ctx);
      return { items, battles, ctx };
    };
    const won = mk(true);
    expect(won.battles).toBe(7);
    expect(Object.values(won.items).reduce((a, b) => a + b, 0)).toBe(5);
    const lost = mk(false);
    expect(lost.battles).toBe(3);
    expect(Object.keys(lost.items).length).toBe(0);
  });

  it('refuses entry with fewer than 3 healthy Pokémon', () => {
    const reg = createBattleTowerInteractions()[0];
    let battles = 0;
    reg.handler({ speaker: 'x' } as any, {} as any, {
      playerParty: [{ level: 30, currentHp: 10 }, { level: 30, currentHp: 0 }, { level: 30, currentHp: 5 }],
      openDialogue: () => {}, triggerBattle: () => { battles++; },
    } as any);
    expect(battles).toBe(0);
  });
});
