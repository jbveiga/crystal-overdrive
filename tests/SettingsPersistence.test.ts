/**
 * @fileoverview SettingsPersistence invariant verification tests.
 * @module tests/SettingsPersistence.test
 * @role Settings & Options Persistence Test Suite
 * @layer tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../src/core/SaveManager';
import { GameClock } from '../src/core/GameClock';
import { RoamingManager } from '../src/world/RoamingManager';
import { MissionManager } from '../src/world/MissionManager';
import { BoxManager } from '../src/world/BoxManager';
import { OverworldItemManager } from '../src/world/OverworldItemManager';
import { StartMenuUI } from '../src/ui/StartMenuUI';
import type { GameOptions } from '../src/types/optionsAndSave';
import { MockElement, MockDocument } from './helpers/MockDomEnv';

describe('TICKET-USER-SETTINGS-PERSISTENCE-01: User Settings Persistence Invariants', () => {
  let doc: MockDocument;
  let mockContainer: MockElement;
  let storageMap: Map<string, string>;

  beforeEach(() => {
    storageMap = new Map<string, string>();
    (global as any).localStorage = {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => { storageMap.set(k, v); },
      removeItem: (k: string) => { storageMap.delete(k); },
      clear: () => { storageMap.clear(); },
      key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
      get length() { return storageMap.size; },
    };

    doc = new MockDocument();
    (global as any).document = doc;
    mockContainer = new MockElement('div');
    mockContainer.id = 'modal-container';
    doc.body.appendChild(mockContainer);
    doc.register(mockContainer);
  });

  it('Pillar 1: Full 17-field round-trip persistence (snapshot -> save -> load -> hydrate)', async () => {
    const saveManager = new SaveManager();
    const gameClock = new GameClock();
    gameClock.playerSpeed = 4;
    gameClock.battleSpeed = 3;

    const mutatedOptions: GameOptions = {
      soundVolume: 0.35,
      bgmVolume: 0.45,
      muted: true,
      textSpeed: 'INSTANT',
      battleStyle: 'SET',
      battleAnimations: false,
      playerSpeedDefault: 4,
      battleSpeedMultiplier: 3,
      touchControlStyle: 'JOYSTICK',
      gamepadActive: true,
      expShare: 'ALL',
      encounterRateMode: 'RELAXED',
      autoHm: false,
      crtScanlines: true,
      gbcPalette: 'DMG',
      lowHpBeepEnabled: false,
      chiptuneMode: true,
    };

    const snapshot = SaveManager.createSaveSnapshot({
      playTimeSeconds: 1234,
      playerName: 'GOLD',
      playerGender: 'BOY',
      rivalName: 'SILVER',
      player: { x: 10, y: 15, direction: 'UP' },
      mapId: 'cherrygrove_city',
      gameClock,
      inventory: {
        balls: { 'poke-ball': 5 },
        items: {},
        berries: {},
        tms: [],
        keyItems: [],
        money: 5000,
        badges: ['zephyr'],
      },
      playerParty: [],
      boxManager: new BoxManager(),
      roamingManager: new RoamingManager(),
      defeatedTrainers: new Set(['youngster_joey']),
      storyFlags: new Set(['met_guide_gent']),
      seenSpecies: new Set(['totodile']),
      overworldItemManager: new OverworldItemManager(),
      gameOptions: mutatedOptions,
      missionManager: new MissionManager(),
    });

    expect(snapshot.options.soundVolume).toBe(0.35);
    expect(snapshot.options.bgmVolume).toBe(0.45);
    expect(snapshot.options.muted).toBe(true);
    expect(snapshot.options.textSpeed).toBe('INSTANT');
    expect(snapshot.options.battleStyle).toBe('SET');
    expect(snapshot.options.battleAnimations).toBe(false);
    expect(snapshot.options.playerSpeedDefault).toBe(4);
    expect(snapshot.options.battleSpeedMultiplier).toBe(3);
    expect(snapshot.options.touchControlStyle).toBe('JOYSTICK');
    expect(snapshot.options.gamepadActive).toBe(true);
    expect(snapshot.options.expShare).toBe('ALL');
    expect(snapshot.options.encounterRateMode).toBe('RELAXED');
    expect(snapshot.options.autoHm).toBe(false);
    expect(snapshot.options.crtScanlines).toBe(true);
    expect(snapshot.options.gbcPalette).toBe('DMG');
    expect(snapshot.options.lowHpBeepEnabled).toBe(false);
    expect(snapshot.options.chiptuneMode).toBe(true);

    await saveManager.saveGame(snapshot);
    const loaded = await saveManager.loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.options).toEqual(snapshot.options);

    const freshClock = new GameClock();
    const freshOptions: GameOptions = SaveManager.getDefaultOptions();
    const playTimeBox = { val: 0 };
    const playerNameBox = { val: '' };
    const playerGenderBox = { val: 'BOY' as const };
    const rivalNameBox = { val: '' };

    SaveManager.hydrateGameState(loaded!, {
      playTimeSeconds: playTimeBox,
      playerName: playerNameBox,
      playerGender: playerGenderBox,
      rivalName: rivalNameBox,
      playerParty: [],
      playerBox: [],
      gameOptions: freshOptions,
      inventory: { balls: {}, items: {}, berries: {}, tms: [], keyItems: [], money: 0, badges: [] },
      defeatedTrainers: new Set(),
      storyFlags: new Set(),
      seenSpecies: new Set(),
      overworldItemManager: new OverworldItemManager(),
      missionManager: new MissionManager(),
      gameClock: freshClock,
      roamingManager: new RoamingManager(),
    });

    expect(freshOptions).toEqual(snapshot.options);
    expect(freshClock.playerSpeed).toBe(4);
    expect(freshClock.battleSpeed).toBe(3);
  });

  it('Pillar 2: Interactive Settings Modal DOM Mutation & Auto-Save Invocation', () => {
    const saveCurrentGame = vi.fn().mockResolvedValue(undefined);
    const gameOptions: GameOptions = SaveManager.getDefaultOptions();
    let currentBgmVolume = 0.7;
    let currentSfxVolume = 0.7;

    const ui = new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'GOLD',
        getPlayerBadges: () => [],
        getPlayerMoney: () => 1000,
        getPokedexSeenCount: () => 10,
        getPokedexCaughtCount: () => 5,
        getPlayerGender: () => 'BOY',
        isMuted: () => Boolean(gameOptions.muted),
        getBgmVolume: () => currentBgmVolume,
        getSoundVolume: () => currentSfxVolume,
        getBattleAnimations: () => gameOptions.battleAnimations ?? true,
        getBattleStyle: () => gameOptions.battleStyle ?? 'SHIFT',
        getSpeedMultiplier: () => gameOptions.playerSpeedDefault,
        getBattleSpeedMultiplier: () => gameOptions.battleSpeedMultiplier ?? 1,
        getTextSpeed: () => gameOptions.textSpeed ?? 'MID',
        isGamepadActive: () => Boolean(gameOptions.gamepadActive),
        getTouchControlStyle: () => gameOptions.touchControlStyle ?? 'DPAD',
        getExpShareMode: () => gameOptions.expShare ?? 'CAPPED',
        getEncounterRateMode: () => gameOptions.encounterRateMode ?? 'NORMAL',
        getAutoHm: () => gameOptions.autoHm ?? true,
        getCrtScanlines: () => Boolean(gameOptions.crtScanlines),
        getGbcPalette: () => gameOptions.gbcPalette ?? 'VIBRANT',
        getLowHpBeep: () => gameOptions.lowHpBeepEnabled ?? true,
        getChiptuneMode: () => Boolean(gameOptions.chiptuneMode),
      },
      {
        onToggleMute: () => {
          gameOptions.muted = !gameOptions.muted;
          void saveCurrentGame();
          return gameOptions.muted;
        },
        onSetBgmVolume: (vol) => {
          currentBgmVolume = vol;
          gameOptions.bgmVolume = vol;
          void saveCurrentGame();
        },
        onSetSoundVolume: (vol) => {
          currentSfxVolume = vol;
          gameOptions.soundVolume = vol;
          void saveCurrentGame();
        },
        onToggleBattleAnimations: (enabled) => {
          gameOptions.battleAnimations = enabled;
          void saveCurrentGame();
          return enabled;
        },
        onSetBattleStyle: (style) => {
          gameOptions.battleStyle = style;
          void saveCurrentGame();
          return style;
        },
        onCycleSpeed: () => {
          gameOptions.playerSpeedDefault = gameOptions.playerSpeedDefault === 3 ? 4 : 3;
          void saveCurrentGame();
          return gameOptions.playerSpeedDefault;
        },
        onSetBattleSpeed: (spd) => {
          gameOptions.battleSpeedMultiplier = spd;
          void saveCurrentGame();
          return spd;
        },
        onSetTextSpeed: (spd) => {
          gameOptions.textSpeed = spd;
          void saveCurrentGame();
          return spd;
        },
        onToggleGamepad: () => {
          gameOptions.gamepadActive = !gameOptions.gamepadActive;
          void saveCurrentGame();
          return gameOptions.gamepadActive;
        },
        onToggleTouchControlStyle: () => {
          const next = gameOptions.touchControlStyle === 'JOYSTICK' ? 'DPAD' : 'JOYSTICK';
          gameOptions.touchControlStyle = next;
          void saveCurrentGame();
          return next;
        },
        onSetExpShareMode: (mode) => {
          gameOptions.expShare = mode;
          void saveCurrentGame();
          return mode;
        },
        onSetEncounterRateMode: (mode) => {
          gameOptions.encounterRateMode = mode;
          void saveCurrentGame();
          return mode;
        },
        onToggleAutoHm: (enabled) => {
          gameOptions.autoHm = enabled;
          void saveCurrentGame();
          return enabled;
        },
        onToggleCrtScanlines: () => {
          gameOptions.crtScanlines = !gameOptions.crtScanlines;
          void saveCurrentGame();
          return gameOptions.crtScanlines;
        },
        onSetGbcPalette: (palette) => {
          gameOptions.gbcPalette = palette;
          void saveCurrentGame();
          return palette;
        },
        onToggleLowHpBeep: (enabled) => {
          gameOptions.lowHpBeepEnabled = enabled;
          void saveCurrentGame();
          return enabled;
        },
        onToggleChiptuneMode: (enabled) => {
          gameOptions.chiptuneMode = enabled;
          void saveCurrentGame();
          return enabled;
        },
      }
    );

    ui.openSettings();
    const modal = doc.getElementById('settings-modal') as MockElement;
    expect(modal).not.toBeNull();

    // 1. Audio Mute button
    const soundBtn = modal.querySelector('#settings-sound-btn') as MockElement;
    soundBtn.click();
    expect(gameOptions.muted).toBe(true);

    // 2. BGM Slider
    const bgmSlider = modal.querySelector('#settings-bgm-slider') as MockElement;
    bgmSlider.dispatchInput('25');
    expect(gameOptions.bgmVolume).toBe(0.25);
    expect(modal.querySelector('#settings-bgm-val')?.textContent).toBe('25%');

    // 3. SFX Slider
    const sfxSlider = modal.querySelector('#settings-sfx-slider') as MockElement;
    sfxSlider.dispatchInput('40');
    expect(gameOptions.soundVolume).toBe(0.4);
    expect(modal.querySelector('#settings-sfx-val')?.textContent).toBe('40%');

    // 4. Chiptune Toggle
    const chiptuneBtn = modal.querySelector('#settings-chiptune-btn') as MockElement;
    chiptuneBtn.click();
    expect(gameOptions.chiptuneMode).toBe(true);

    // 5. Low-HP Beep Toggle
    const lowHpBeepBtn = modal.querySelector('#settings-lowhp-beep-btn') as MockElement;
    lowHpBeepBtn.click();
    expect(gameOptions.lowHpBeepEnabled).toBe(false);

    // 6. Game Speed Cycle
    const speedBtn = modal.querySelector('#settings-speed-btn') as MockElement;
    speedBtn.click();
    expect(gameOptions.playerSpeedDefault).toBe(4);

    // 7. Battle Speed 3x button
    const battleSpeed3x = modal.querySelector('#settings-battle-speed-3x-btn') as MockElement;
    battleSpeed3x.click();
    expect(gameOptions.battleSpeedMultiplier).toBe(3);

    // 8. Text Speed Instant button
    const textInstantBtn = modal.querySelector('#settings-text-instant-btn') as MockElement;
    textInstantBtn.click();
    expect(gameOptions.textSpeed).toBe('INSTANT');

    // 9. Battle Animations button
    const battleAnimBtn = modal.querySelector('#settings-battle-anim-btn') as MockElement;
    battleAnimBtn.click();
    expect(gameOptions.battleAnimations).toBe(false);

    // 10. Battle Style button
    const battleStyleBtn = modal.querySelector('#settings-battle-style-btn') as MockElement;
    battleStyleBtn.click();
    expect(gameOptions.battleStyle).toBe('SET');

    // 11. Touch Controls (Gamepad) toggle
    const gamepadBtn = modal.querySelector('#settings-gamepad-btn') as MockElement;
    gamepadBtn.click();
    expect(gameOptions.gamepadActive).toBe(true);

    // 12. Control Style toggle
    const controlStyleBtn = modal.querySelector('#settings-control-style-btn') as MockElement;
    controlStyleBtn.click();
    expect(gameOptions.touchControlStyle).toBe('JOYSTICK');

    // 13. CRT Scanlines toggle
    const crtBtn = modal.querySelector('#settings-crt-btn') as MockElement;
    crtBtn.click();
    expect(gameOptions.crtScanlines).toBe(true);

    // 14. GBC Palette button (DMG)
    const paletteDmgBtn = modal.querySelector('#settings-palette-dmg-btn') as MockElement;
    paletteDmgBtn.click();
    expect(gameOptions.gbcPalette).toBe('DMG');

    // 15. Exp. Share All button
    const expAllBtn = modal.querySelector('#settings-exp-all-btn') as MockElement;
    expAllBtn.click();
    expect(gameOptions.expShare).toBe('ALL');

    // 16. Encounter Rate Relaxed button
    const encRelaxedBtn = modal.querySelector('#settings-enc-relaxed-btn') as MockElement;
    encRelaxedBtn.click();
    expect(gameOptions.encounterRateMode).toBe('RELAXED');

    // 17. Auto-HM Mode toggle
    const autoHmBtn = modal.querySelector('#settings-autohm-btn') as MockElement;
    autoHmBtn.click();
    expect(gameOptions.autoHm).toBe(false);

    expect(saveCurrentGame).toHaveBeenCalledTimes(17);
  });

  it('Pillar 3: Legacy Save Backward Compatibility & Safe Normalization', () => {
    // Legacy save with options: undefined
    const normalizedFromUndefined = SaveManager.normalizeOptions(undefined, {
      speedMultiplier: 2,
      battleSpeedMultiplier: 2,
    });
    expect(normalizedFromUndefined.playerSpeedDefault).toBe(2);
    expect(normalizedFromUndefined.battleSpeedMultiplier).toBe(2);
    expect(normalizedFromUndefined.soundVolume).toBe(0.7);
    expect(normalizedFromUndefined.bgmVolume).toBe(0.7);
    expect(normalizedFromUndefined.battleStyle).toBe('SHIFT');
    expect(normalizedFromUndefined.battleAnimations).toBe(true);
    expect(normalizedFromUndefined.muted).toBe(false);

    // Legacy save with partial options and out-of-range volume numbers
    const normalizedFromPartial = SaveManager.normalizeOptions(
      {
        textSpeed: 'FAST',
        soundVolume: 5.5, // should clamp to 1.0
        bgmVolume: -0.8, // should clamp to 0.0
      } as any,
      undefined
    );
    expect(normalizedFromPartial.textSpeed).toBe('FAST');
    expect(normalizedFromPartial.soundVolume).toBe(1);
    expect(normalizedFromPartial.bgmVolume).toBe(0);
    expect(normalizedFromPartial.playerSpeedDefault).toBe(3);
    expect(normalizedFromPartial.battleSpeedMultiplier).toBe(1);
    expect(normalizedFromPartial.battleStyle).toBe('SHIFT');
    expect(normalizedFromPartial.battleAnimations).toBe(true);
    expect(normalizedFromPartial.encounterRateMode).toBe('NORMAL');
  });
});
