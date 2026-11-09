import { describe, it, expect } from 'vitest';
import { pickPokegearCall, BOX_FULL_FLAG } from '../../src/world/PokegearCalls';

const call = (flags: string[], activeBoxCount = 0) => pickPokegearCall({ storyFlags: new Set(flags), activeBoxCount });

describe('Pokégear story calls', () => {
  it('Elm calls after Falkner until the aide has delivered the egg', () => {
    expect(call([])).toBeNull();
    expect(call(['falkner_defeated'])?.flag).toBe('ELM_CALLED_EGG_AIDE');
    expect(call(['falkner_defeated', 'ELM_CALLED_EGG_AIDE'])).toBeNull();
    expect(call(['falkner_defeated', 'togepi_egg_received'])).toBeNull();
  });
  it('Elm warns about the Radio Tower after Pryce, but not once it is resolved (legacy-safe)', () => {
    const base = ['falkner_defeated', 'togepi_egg_received', 'pryce_defeated'];
    expect(call(base)?.flag).toBe('ELM_CALLED_RADIO_TOWER');
    expect(call([...base, 'ELM_CALLED_RADIO_TOWER'])).toBeNull();
    expect(call([...base, 'fake_director_defeated'])).toBeNull();
    expect(call([...base, 'radio_tower_liberated'])).toBeNull();
  });
  it('Bill calls only when registered and the active box is full, once per fill', () => {
    expect(call(['PHONE_BILL'], 19)).toBeNull();
    expect(call([], 20)).toBeNull();
    expect(call(['PHONE_BILL'], 20)?.flag).toBe(BOX_FULL_FLAG);
    expect(call(['PHONE_BILL', BOX_FULL_FLAG], 20)).toBeNull();
  });
});
