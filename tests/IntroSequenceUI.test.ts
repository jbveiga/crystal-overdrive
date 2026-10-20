import { describe, it, expect, vi } from 'vitest';
import {
  IntroSequenceUI,
  BOY_NAME_PRESETS,
  GIRL_NAME_PRESETS,
} from '../src/ui/IntroSequenceUI';

describe('IntroSequenceUI (Ticket 4.3)', () => {
  it('progresses through all 6 stages in canonical order and emits onComplete payload', async () => {
    const onComplete = vi.fn();
    const intro = new IntroSequenceUI('modal-container', { onComplete });

    intro.start();
    expect(intro.isActive()).toBe(true);
    expect(intro.getStage()).toBe('WELCOME');
    expect(intro.getPageIndex()).toBe(0);

    // Advance through 3 WELCOME dialogue pages -> POKEMON_REVEAL
    await intro.advance();
    expect(intro.getStage()).toBe('WELCOME');
    expect(intro.getPageIndex()).toBe(1);

    await intro.advance();
    expect(intro.getStage()).toBe('WELCOME');
    expect(intro.getPageIndex()).toBe(2);

    await intro.advance();
    expect(intro.getStage()).toBe('POKEMON_REVEAL');
    expect(intro.getPageIndex()).toBe(0);

    // Advance through 3 POKEMON_REVEAL dialogue pages -> GENDER_SELECT
    await intro.advance();
    await intro.advance();
    await intro.advance();
    expect(intro.getStage()).toBe('GENDER_SELECT');

    // Select GIRL and advance -> NAME_INPUT
    intro.selectGender('GIRL');
    expect(intro.getSelectedGender()).toBe('GIRL');
    await intro.advance();
    expect(intro.getStage()).toBe('NAME_INPUT');
    expect(intro.getPlayerName()).toBe('KRIS');

    // Select preset AMANDA and advance -> CLOCK_SETUP
    intro.selectPresetName('AMANDA');
    expect(intro.getPlayerName()).toBe('AMANDA');
    await intro.advance();
    expect(intro.getStage()).toBe('CLOCK_SETUP');

    // Confirm clock -> SHRINK_WARP
    await intro.advance();
    expect(intro.getStage()).toBe('SHRINK_WARP');

    // Final advance -> completes sequence and emits { name: 'AMANDA', gender: 'GIRL' }
    await intro.advance();
    expect(intro.isCompleted()).toBe(true);
    expect(intro.isActive()).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      name: 'AMANDA',
      gender: 'GIRL',
    });
  });

  it('provides canonical Johto name presets for BOY and GIRL', () => {
    const intro = new IntroSequenceUI('modal-container');
    intro.start();

    expect(intro.getPresetsForGender('BOY')).toEqual(['GOLD', 'CHRIS', 'MAT', 'ALLAN', 'JON']);
    expect(BOY_NAME_PRESETS).toContain('GOLD');
    expect(BOY_NAME_PRESETS).toContain('CHRIS');

    expect(intro.getPresetsForGender('GIRL')).toEqual(['KRIS', 'AMANDA', 'JUANA', 'JODI']);
    expect(GIRL_NAME_PRESETS).toContain('KRIS');
    expect(GIRL_NAME_PRESETS).toContain('AMANDA');
  });

  it('enforces 1-7 character limit, uppercase normalization, backspace, and empty fallback', () => {
    const intro = new IntroSequenceUI('modal-container');
    intro.start();

    intro.setPlayerName('');
    expect(intro.getPlayerName()).toBe('');
    // Empty name falls back to GOLD for BOY and KRIS for GIRL
    expect(intro.getValidatedName()).toBe('GOLD');

    intro.selectGender('GIRL');
    intro.setPlayerName('   ');
    expect(intro.getValidatedName()).toBe('KRIS');

    // Typing characters up to 7 chars max
    intro.setPlayerName('');
    for (const ch of 'crystaloverdrive') {
      intro.appendNameChar(ch);
    }
    expect(intro.getPlayerName()).toBe('CRYSTAL');
    expect(intro.getPlayerName().length).toBe(7);

    // Backspace removes last character
    intro.backspaceName();
    expect(intro.getPlayerName()).toBe('CRYSTA');
  });

  it('computes accurate Morning, Day, and Night RTC periods in getClockStatus()', () => {
    const intro = new IntroSequenceUI('modal-container');

    const morning = intro.getClockStatus(new Date(2026, 9, 20, 7, 5));
    expect(morning.period).toBe('MORNING');
    expect(morning.timeFormatted).toBe('07:05');

    const day = intro.getClockStatus(new Date(2026, 9, 20, 14, 30));
    expect(day.period).toBe('DAY');
    expect(day.timeFormatted).toBe('14:30');

    const night = intro.getClockStatus(new Date(2026, 9, 20, 22, 15));
    expect(night.period).toBe('NIGHT');
    expect(night.timeFormatted).toBe('22:15');
  });
});
