import { describe, it, expect } from 'vitest';
import { createNpcsByMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';
import { getKantoAndLeagueInteractions } from '../../src/world/interactions/KantoAndLeagueInteractions';

describe('Blue: Cinnabar first, then Viridian Gym (story 11.3)', () => {
  const npcs: any = createNpcsByMap();
  it('Viridian Gym is empty until Blue is met on Cinnabar; legacy defeated saves keep him', () => {
    expect(isNpcActiveForStoryFlags('viridian_gym_blue_0', new Set())).toBe(false);
    expect(isNpcActiveForStoryFlags('cinnabar_island_blue', new Set())).toBe(true);
    const met = new Set(['blue_met_cinnabar']);
    expect(isNpcActiveForStoryFlags('viridian_gym_blue_0', met)).toBe(true);
    expect(isNpcActiveForStoryFlags('cinnabar_island_blue', met)).toBe(false);
    expect(isNpcActiveForStoryFlags('viridian_gym_blue_0', new Set(['blue_defeated']))).toBe(true);
    expect(isNpcActiveForStoryFlags('cinnabar_island_blue', new Set(['blue_defeated']))).toBe(false);
  });
  it('Cinnabar Blue does not battle; meeting him sets the flag, and Viridian Blue still fights for the Earth Badge', () => {
    const cin = npcs.cinnabar_island.find((n: any) => n.id === 'cinnabar_island_blue');
    expect(cin.action).toBe('BLUE_CINNABAR_MEET');
    expect(cin.trainerTeam ?? cin.trainerPokemon).toBeUndefined();
    const reg: any = getKantoAndLeagueInteractions().find((r: any) => r.npcIds?.includes('cinnabar_island_blue'));
    const flags = new Set<string>();
    reg.handler(cin, {}, { storyFlags: flags, openDialogue: (_p: any, _s: any, cb: any) => cb?.(), showToast: () => {}, saveCurrentGame: () => {} });
    expect(flags.has('blue_met_cinnabar')).toBe(true);
    const vir = npcs.viridian_gym.find((n: any) => n.id === 'viridian_gym_blue_0');
    expect(vir.action).toBe('BLUE_EVENT');
    expect(vir.trainerTeam.length).toBe(6);
  });
});
