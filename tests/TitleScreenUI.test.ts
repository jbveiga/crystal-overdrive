import { describe, it, expect, vi } from 'vitest';
import { TitleScreenUI } from '../src/ui/TitleScreenUI';
import { SaveManager } from '../src/core/SaveManager';
import type { SavePreview } from '../src/types/game';

const MOCK_PREVIEW: SavePreview = {
  playerName: 'KRIS',
  gender: 'GIRL',
  badgeCount: 3,
  pokedexCount: 14,
  playTimeFormatted: '02:45',
  currentLocationName: 'Violet City',
  partyLeadSpeciesId: 'cyndaquil',
  partyLeadLevel: 16,
  timestamp: 1700000000000,
};

describe('TitleScreenUI (Ticket 4.2)', () => {
  it('focuses CONTINUE (index 0) by default when a SavePreview exists, and NEW_GAME (index 1) when null', () => {
    const withSave = new TitleScreenUI('modal-container', MOCK_PREVIEW);
    expect(withSave.hasSave()).toBe(true);
    expect(withSave.getCursorIndex()).toBe(0);
    expect(withSave.getFocusedOption()).toBe('CONTINUE');

    const withoutSave = new TitleScreenUI('modal-container', null);
    expect(withoutSave.hasSave()).toBe(false);
    expect(withoutSave.getCursorIndex()).toBe(1);
    expect(withoutSave.getFocusedOption()).toBe('NEW_GAME');
  });

  it('binds SavePreview data and formats summary string accurately', () => {
    const ui = new TitleScreenUI('modal-container', MOCK_PREVIEW);
    const summary = ui.formatSavePreviewSummary();

    expect(summary).toContain('KRIS ♀');
    expect(summary).toContain('Violet City');
    expect(summary).toContain('Badges: 3 / 8');
    expect(summary).toContain('Pokédex: 14');
    expect(summary).toContain('Time: 02:45');
    expect(summary).toContain('Lead: CYNDAQUIL Lv.16');
  });

  it('unlocks the audio gate on first key/click interaction before executing menu actions', async () => {
    const onUnlockAudio = vi.fn();
    const onContinue = vi.fn();
    const ui = new TitleScreenUI('modal-container', MOCK_PREVIEW, undefined, {
      onUnlockAudio,
      onContinue,
      onNewGame: vi.fn(),
    });

    expect(ui.isGateUnlocked()).toBe(false);

    // First Enter key press unlocks the gate without immediately triggering CONTINUE
    ui.handleKeyDown({ code: 'Enter' });
    expect(ui.isGateUnlocked()).toBe(true);
    expect(onUnlockAudio).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();

    // Second Enter key press confirms CONTINUE
    await ui.confirmSelection();
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(ui.isVisible()).toBe(false);
  });

  it('skips disabled CONTINUE during keyboard navigation when no save exists', async () => {
    const ui = new TitleScreenUI('modal-container', null);
    await ui.unlockGate();

    expect(ui.getFocusedOption()).toBe('NEW_GAME');

    ui.handleKeyDown({ code: 'ArrowDown' });
    expect(ui.getFocusedOption()).toBe('OPTIONS');

    // Wrapping around skips CONTINUE (index 0) and lands back on NEW_GAME (index 1)
    ui.handleKeyDown({ code: 'ArrowDown' });
    expect(ui.getFocusedOption()).toBe('NEW_GAME');

    ui.handleKeyDown({ code: 'ArrowUp' });
    expect(ui.getFocusedOption()).toBe('OPTIONS');
  });

  it('gates NEW_GAME behind an Overwrite Confirmation modal when a save exists', async () => {
    const onNewGame = vi.fn();
    const ui = new TitleScreenUI('modal-container', MOCK_PREVIEW, undefined, {
      onContinue: vi.fn(),
      onNewGame,
    });
    await ui.unlockGate();

    // Move from CONTINUE (0) -> NEW_GAME (1)
    ui.moveCursor(1);
    expect(ui.getFocusedOption()).toBe('NEW_GAME');

    // Confirming NEW_GAME opens Overwrite Confirmation modal (defaults to safe CANCEL = 1)
    await ui.confirmSelection();
    expect(ui.isOverwriteConfirmOpen()).toBe(true);
    expect(ui.getOverwriteCursorIndex()).toBe(1);
    expect(onNewGame).not.toHaveBeenCalled();

    // Confirming while on CANCEL closes the modal without invoking onNewGame
    await ui.confirmSelection();
    expect(ui.isOverwriteConfirmOpen()).toBe(false);
    expect(onNewGame).not.toHaveBeenCalled();

    // Re-open Overwrite modal, move cursor to YES (0), and confirm
    await ui.confirmSelection();
    expect(ui.isOverwriteConfirmOpen()).toBe(true);
    ui.moveCursor(-1);
    expect(ui.getOverwriteCursorIndex()).toBe(0);

    await ui.confirmSelection();
    expect(onNewGame).toHaveBeenCalledTimes(1);
    expect(ui.isVisible()).toBe(false);
  });

  it('updates GameOptions and invokes onOptionsChanged callback', async () => {
    const onOptionsChanged = vi.fn();
    const ui = new TitleScreenUI(
      'modal-container',
      null,
      SaveManager.getDefaultOptions(),
      {
        onContinue: vi.fn(),
        onNewGame: vi.fn(),
        onOptionsChanged,
      }
    );
    await ui.unlockGate();

    // Move to OPTIONS and open modal
    ui.moveCursor(1);
    expect(ui.getFocusedOption()).toBe('OPTIONS');
    await ui.confirmSelection();
    expect(ui.isOptionsModalOpen()).toBe(true);

    const updated = ui.updateOptions({
      bgmVolume: 0.45,
      soundVolume: 0.85,
      textSpeed: 'FAST',
      battleAnimations: false,
      playerSpeedDefault: 4,
    });

    expect(updated.bgmVolume).toBe(0.45);
    expect(updated.soundVolume).toBe(0.85);
    expect(updated.textSpeed).toBe('FAST');
    expect(updated.battleAnimations).toBe(false);
    expect(updated.playerSpeedDefault).toBe(4);
    expect(onOptionsChanged).toHaveBeenCalledWith(updated);

    // Escape closes Options modal
    ui.handleKeyDown({ code: 'Escape' });
    expect(ui.isOptionsModalOpen()).toBe(false);
  });
});
