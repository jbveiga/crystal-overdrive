import { describe, it, expect, vi } from 'vitest';
import { createNpcsByMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';
import { getKantoAndLeagueInteractions } from '../../src/world/interactions/KantoAndLeagueInteractions';

const RED = 'silver_cave_room_3_red_0';

describe('Red: silent finale at Mt. Silver summit', () => {
  const red: any = createNpcsByMap().silver_cave_room_3.find((n: any) => n.id === RED)!;

  it('is a silent "..." challenger with a distinct (rival) sprite and canonical team', () => {
    expect(red.spriteType).toBe('silver');
    expect(red.action).toBe('RED_EVENT');
    expect(JSON.stringify(red)).not.toMatch(/RED: /);
    const species = (red.trainerTeam ?? []).map((p: any) => p.speciesId);
    expect(species).toEqual(['pikachu', 'espeon', 'snorlax', 'venusaur', 'charizard', 'blastoise']);
  });

  it('exactly one handler owns RED_EVENT (the dedicated one, not the generic Elite Four one)', () => {
    const owners = getKantoAndLeagueInteractions().filter((r) => r.actions?.includes('RED_EVENT'));
    expect(owners).toHaveLength(1);
    expect(owners[0].npcIds).toContain(RED);
  });

  it('vanishes after defeat, sets red_defeated and shows the congratulation message', () => {
    expect(isNpcActiveForStoryFlags(RED, new Set())).toBe(true);
    const reg = getKantoAndLeagueInteractions().find((r) => r.actions?.includes('RED_EVENT'))!;
    const flags = new Set<string>();
    let victory: (() => void) | undefined;
    const dialogues: string[][] = [];
    const ctx: any = {
      storyFlags: flags, defeatedTrainers: new Set<string>(), playerName: 'GOLD',
      buildTrainerTeamInstances: () => [{ speciesId: 'pikachu' }],
      triggerBattle: vi.fn((_p: any, o: any) => { victory = o.onVictory; }),
      openDialogue: vi.fn((pages: string[], _s: string, cb?: () => void) => { dialogues.push(pages); cb?.(); }),
      showToast: vi.fn(), saveCurrentGame: vi.fn(), renderMap: vi.fn(),
      missionManager: { checkStoryFlags: vi.fn() },
    };
    reg.handler(red, { id: 'silver_cave_room_3' } as any, ctx);
    expect(dialogues[0]).toEqual(['...']);
    expect(ctx.triggerBattle).toHaveBeenCalledTimes(1);
    victory!();
    expect(flags.has('red_defeated')).toBe(true);
    expect(ctx.defeatedTrainers.has('red')).toBe(true);
    expect(dialogues[1].join(' ')).toMatch(/master of JOHTO and KANTO/);
    expect(isNpcActiveForStoryFlags(RED, flags)).toBe(false);
    // Mashing A afterwards never restarts the fight
    reg.handler(red, {} as any, ctx);
    expect(ctx.triggerBattle).toHaveBeenCalledTimes(1);
  });
});
