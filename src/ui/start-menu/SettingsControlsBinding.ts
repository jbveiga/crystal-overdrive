/**
 * @fileoverview SettingsControlsBinding domain module implementation.
 * @module ui/start-menu/SettingsControlsBinding
 * @role SettingsControlsBinding Component
 * @exports bindSettingsEventListeners
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-211: Implementation | L212-422: Handlers & Exports
 */

import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { GBC_PALETTE_SPECS } from '../DisplayThemeManager';
import type {
  SpeedMultiplier,
  TouchControlStyle,
  ExpShareMode,
  EncounterRateMode,
  GbcPaletteMode,
} from '../../types/game';
import { STADIUM_CUPS } from '../../battle/StadiumArenaManager';
import type { StartMenuStateProvider, StartMenuCallbacks } from '../StartMenuUI';
import {
  getBattleSpeedBg,
  getBattleSpeedBorder,
  getTextSpeedBg,
  getTextSpeedBorder,
  getTextSpeedLabel,
  getExpShareButtonLabel,
  getExpShareButtonBg,
  getExpShareButtonBorder,
  getEncounterRateLabel,
  getEncounterRateBg,
  getEncounterRateBorder,
  getGbcPaletteBg,
} from './SettingsModalRenderer';

export function bindSettingsEventListeners(params: {
  settingsModal: HTMLDivElement;
  menuPanel: HTMLDivElement;
  stateProvider: StartMenuStateProvider;
  callbacks: StartMenuCallbacks;
  getSpeedMultiplier: () => SpeedMultiplier;
  setSpeedMultiplier: (speed: SpeedMultiplier) => void;
  getActiveSettingsTab: () => 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS';
  setActiveSettingsTab: (tab: 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS') => void;
  reRenderSettingsContent: () => void;
}): void {
  const {
    settingsModal,
    menuPanel,
    stateProvider,
    callbacks,
    setActiveSettingsTab,
  } = params;

  const currentBadges = stateProvider.getBadges ? stateProvider.getBadges().length : 0;
  const currentLevelCap = PokemonFactory.getLevelCapForBadges(currentBadges);

  const isChiptuneMode: boolean = stateProvider.getChiptuneMode
    ? stateProvider.getChiptuneMode()
    : false;
  const isLowHpBeep: boolean = stateProvider.getLowHpBeep
    ? stateProvider.getLowHpBeep()
    : BattleAudio.lowHpBeepEnabled;
  const isCrtScanlines: boolean = stateProvider.getCrtScanlines
    ? stateProvider.getCrtScanlines()
    : false;
  const expShareMode: ExpShareMode = stateProvider.getExpShareMode
    ? stateProvider.getExpShareMode()
    : 'CAPPED';
  const encounterRateMode: EncounterRateMode = stateProvider.getEncounterRateMode
    ? stateProvider.getEncounterRateMode()
    : 'NORMAL';
  const isAutoHm: boolean = stateProvider.getAutoHm
    ? stateProvider.getAutoHm()
    : true;
  const battleSpeed: SpeedMultiplier = stateProvider.getBattleSpeedMultiplier
    ? stateProvider.getBattleSpeedMultiplier()
    : 1;
  const textSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' = stateProvider.getTextSpeed
    ? stateProvider.getTextSpeed()
    : 'MID';

    // Hook up category tab filtering
    const filterCategory = (tab: 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS') => {
      setActiveSettingsTab(tab);
      const tabBtns = settingsModal.querySelectorAll('[data-settings-tab]');
      for (let i = 0; i < tabBtns.length; i++) {
        const b = tabBtns[i] as HTMLElement;
        const bTab = b.getAttribute('data-settings-tab');
        const isSel = bTab === tab;
        b.style.background = isSel ? '#1E3A8A' : '#141E33';
        b.style.color = isSel ? '#FFFFFF' : '#94A3B8';
        b.style.borderColor = isSel ? '#38BDF8' : '#22324F';
      }

      const rows = settingsModal.querySelectorAll('[data-settings-category]');
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] as HTMLElement;
        const cat = r.getAttribute('data-settings-category');
        if (cat === tab) {
          r.style.display = 'flex';
        } else {
          r.style.display = 'none';
        }
      }
    };

    const tabAudio = settingsModal.querySelector('#settings-tab-audio');
    tabAudio?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('AUDIO'); });
    const tabGameplay = settingsModal.querySelector('#settings-tab-gameplay');
    tabGameplay?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('GAMEPLAY'); });
    const tabGraphics = settingsModal.querySelector('#settings-tab-graphics');
    tabGraphics?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('GRAPHICS'); });
    const tabControls = settingsModal.querySelector('#settings-tab-controls');
    tabControls?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('CONTROLS'); });

    const soundBtn = settingsModal.querySelector('#settings-sound-btn') as HTMLButtonElement;
    const bgmSlider = settingsModal.querySelector('#settings-bgm-slider') as HTMLInputElement | null;
    const bgmVal = settingsModal.querySelector('#settings-bgm-val') as HTMLElement | null;
    const sfxSlider = settingsModal.querySelector('#settings-sfx-slider') as HTMLInputElement | null;
    const sfxVal = settingsModal.querySelector('#settings-sfx-val') as HTMLElement | null;
    const chiptuneBtn = settingsModal.querySelector('#settings-chiptune-btn') as HTMLButtonElement;
    const lowHpBeepBtn = settingsModal.querySelector('#settings-lowhp-beep-btn') as HTMLButtonElement;
    const speedBtn = settingsModal.querySelector('#settings-speed-btn') as HTMLButtonElement;
    const battleAnimBtn = settingsModal.querySelector('#settings-battle-anim-btn') as HTMLButtonElement | null;
    const battleStyleBtn = settingsModal.querySelector('#settings-battle-style-btn') as HTMLButtonElement | null;
    const gamepadBtn = settingsModal.querySelector('#settings-gamepad-btn') as HTMLButtonElement;
    const controlStyleBtn = settingsModal.querySelector('#settings-control-style-btn') as HTMLButtonElement;
    const crtBtn = settingsModal.querySelector('#settings-crt-btn') as HTMLButtonElement;
    const paletteBtn = settingsModal.querySelector('#settings-palette-btn') as HTMLButtonElement | null;
    const paletteDesc = settingsModal.querySelector('#settings-palette-desc') as HTMLElement | null;
    const expShareBtn = settingsModal.querySelector('#settings-exp-share-btn') as HTMLButtonElement | null;
    const encRateBtn = settingsModal.querySelector('#settings-encounter-rate-btn') as HTMLButtonElement | null;
    const autoHmBtn = settingsModal.querySelector('#settings-autohm-btn') as HTMLButtonElement;
    const closeBtn = settingsModal.querySelector('#close-settings-btn') as HTMLButtonElement;
    const closeXBtn = settingsModal.querySelector('#close-settings-x-btn') as HTMLButtonElement;

    let activeChiptune = isChiptuneMode;
    if (chiptuneBtn) {
      chiptuneBtn.addEventListener('click', () => {
        activeChiptune = !activeChiptune;
        BattleAudio.playMenuSound('CONFIRM');
        chiptuneBtn.innerText = activeChiptune ? '🎵 8-BIT APU: ON' : '🎼 STUDIO BGM';
        chiptuneBtn.style.background = activeChiptune ? '#7c3aed' : '#0284c7';
        chiptuneBtn.style.borderColor = activeChiptune ? '#c084fc' : '#38bdf8';
        callbacks.onToggleChiptuneMode?.(activeChiptune);
      });
    }

    let activeLowHpBeep = isLowHpBeep;
    if (lowHpBeepBtn) {
      lowHpBeepBtn.addEventListener('click', () => {
        activeLowHpBeep = !activeLowHpBeep;
        BattleAudio.setLowHpBeepEnabled(activeLowHpBeep);
        BattleAudio.playMenuSound('CONFIRM');
        lowHpBeepBtn.innerText = activeLowHpBeep ? '🚨 LOW-HP BEEP: ON' : '🔕 LOW-HP BEEP: OFF';
        lowHpBeepBtn.style.background = activeLowHpBeep ? '#059669' : '#334155';
        lowHpBeepBtn.style.borderColor = activeLowHpBeep ? '#34d399' : '#64748b';
        callbacks.onToggleLowHpBeep?.(activeLowHpBeep);
      });
    }

    let activeCrt = isCrtScanlines;
    if (crtBtn) {
      crtBtn.addEventListener('click', () => {
        activeCrt = !activeCrt;
        BattleAudio.playMenuSound('CONFIRM');
        crtBtn.innerText = activeCrt ? '📺 CRT: ON' : '📺 CRT: OFF';
        crtBtn.style.background = activeCrt ? '#059669' : '#334155';
        crtBtn.style.borderColor = activeCrt ? '#34d399' : '#64748b';
        callbacks.onToggleCrtScanlines?.(activeCrt);
      });
    }

    let activePalette: GbcPaletteMode = stateProvider.getGbcPalette ? stateProvider.getGbcPalette() : 'VIBRANT';
    const syncPaletteButton = (pal: GbcPaletteMode) => {
      activePalette = pal;
      const spec = GBC_PALETTE_SPECS[pal];
      if (paletteBtn && spec) {
        paletteBtn.innerText = spec.label;
        paletteBtn.style.background = getGbcPaletteBg(pal);
        paletteBtn.style.borderColor = spec.accentColor;
      }
      if (paletteDesc && spec) paletteDesc.innerText = spec.description;
    };

    const applyPalette = (pal: GbcPaletteMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      callbacks.onSetGbcPalette?.(pal);
      syncPaletteButton(pal);
    };

    paletteBtn?.addEventListener('click', () => {
      const modes: GbcPaletteMode[] = ['VIBRANT', 'POCKET', 'DMG', 'NIGHT'];
      const nextPal = modes[(modes.indexOf(activePalette) + 1) % modes.length];
      applyPalette(nextPal);
    });

    let activeExpMode: ExpShareMode = expShareMode;
    const syncExpShareButton = (mode: ExpShareMode) => {
      activeExpMode = mode;
      if (expShareBtn) {
        expShareBtn.innerText = getExpShareButtonLabel(mode, currentLevelCap);
        expShareBtn.style.background = getExpShareButtonBg(mode);
        expShareBtn.style.borderColor = getExpShareButtonBorder(mode);
      }
    };

    const applyExpMode = (nextMode: ExpShareMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetExpShareMode) {
        callbacks.onSetExpShareMode(nextMode);
      }
      syncExpShareButton(nextMode);
    };

    expShareBtn?.addEventListener('click', () => {
      if (callbacks.onCycleExpShareMode) {
        const cycled = callbacks.onCycleExpShareMode();
        BattleAudio.playMenuSound('CONFIRM');
        syncExpShareButton(cycled);
      } else {
        const order: ExpShareMode[] = ['OFF', 'ALL', 'CAPPED'];
        const nextMode = order[(order.indexOf(activeExpMode) + 1) % order.length];
        applyExpMode(nextMode);
      }
    });

    let activeEncMode: EncounterRateMode = encounterRateMode;
    const syncEncounterButton = (mode: EncounterRateMode) => {
      activeEncMode = mode;
      if (encRateBtn) {
        encRateBtn.innerText = getEncounterRateLabel(mode);
        encRateBtn.style.background = getEncounterRateBg(mode);
        encRateBtn.style.borderColor = getEncounterRateBorder(mode);
      }
    };

    const applyEncMode = (nextMode: EncounterRateMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetEncounterRateMode) {
        callbacks.onSetEncounterRateMode(nextMode);
      }
      syncEncounterButton(nextMode);
    };

    encRateBtn?.addEventListener('click', () => {
      const order: EncounterRateMode[] = ['RELAXED', 'NORMAL', 'CLASSIC'];
      const nextMode = order[(order.indexOf(activeEncMode) + 1) % order.length];
      applyEncMode(nextMode);
    });

    let activeAutoHm = isAutoHm;
    const applyAutoHm = (enabled: boolean) => {
      activeAutoHm = enabled;
      BattleAudio.playMenuSound('CONFIRM');
      if (autoHmBtn) {
        autoHmBtn.innerText = enabled ? '🌊 AUTO-HM: ON' : '💬 AUTO-HM: OFF';
        autoHmBtn.style.background = enabled ? '#059669' : '#334155';
        autoHmBtn.style.borderColor = enabled ? '#34d399' : '#64748b';
      }
      if (callbacks.onToggleAutoHm) {
        callbacks.onToggleAutoHm(enabled);
      }
    };

    autoHmBtn?.addEventListener('click', () => applyAutoHm(!activeAutoHm));

    soundBtn.addEventListener('click', () => {
      if (callbacks.onToggleMute) {
        const muted = callbacks.onToggleMute();
        if (!muted) BattleAudio.playMenuSound('CONFIRM');
        else BattleAudio.playMenuSound('CANCEL');
        soundBtn.innerText = muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
        soundBtn.style.background = muted ? '#7f1d1d' : '#0284c7';
        soundBtn.style.borderColor = muted ? '#ef4444' : '#38bdf8';
      }
    });

    bgmSlider?.addEventListener('input', () => {
      const vol = Number(bgmSlider.value) / 100;
      const label = `${Math.round(vol * 100)}%`;
      if (bgmVal) {
        bgmVal.innerText = label;
        bgmVal.textContent = label;
      }
      callbacks.onSetBgmVolume?.(vol);
    });

    sfxSlider?.addEventListener('input', () => {
      const vol = Number(sfxSlider.value) / 100;
      const label = `${Math.round(vol * 100)}%`;
      if (sfxVal) {
        sfxVal.innerText = label;
        sfxVal.textContent = label;
      }
      callbacks.onSetSoundVolume?.(vol);
    });

    speedBtn.addEventListener('click', () => {
      if (callbacks.onCycleSpeed) {
        const nextSpeed = callbacks.onCycleSpeed();
        BattleAudio.playMenuSound('CONFIRM');
        speedBtn.innerText = `⚡ SPEED: ${nextSpeed}x`;
      }
    });

    let activeBattleAnim = stateProvider.getBattleAnimations ? stateProvider.getBattleAnimations() : true;
    battleAnimBtn?.addEventListener('click', () => {
      activeBattleAnim = !activeBattleAnim;
      BattleAudio.playMenuSound('CONFIRM');
      if (battleAnimBtn) {
        battleAnimBtn.innerText = activeBattleAnim ? '✨ ANIMATIONS: ON' : '⚡ ANIMATIONS: OFF';
        battleAnimBtn.style.background = activeBattleAnim ? '#059669' : '#334155';
        battleAnimBtn.style.borderColor = activeBattleAnim ? '#34d399' : '#64748b';
      }
      callbacks.onToggleBattleAnimations?.(activeBattleAnim);
    });

    let activeBattleStyle: 'SHIFT' | 'SET' = stateProvider.getBattleStyle ? stateProvider.getBattleStyle() : 'SHIFT';
    battleStyleBtn?.addEventListener('click', () => {
      activeBattleStyle = activeBattleStyle === 'SHIFT' ? 'SET' : 'SHIFT';
      BattleAudio.playMenuSound('CONFIRM');
      if (battleStyleBtn) {
        battleStyleBtn.innerText = activeBattleStyle === 'SHIFT' ? '🔄 STYLE: SHIFT' : '🔒 STYLE: SET';
        battleStyleBtn.style.background = activeBattleStyle === 'SHIFT' ? '#2563eb' : '#d97706';
        battleStyleBtn.style.borderColor = activeBattleStyle === 'SHIFT' ? '#60a5fa' : '#f59e0b';
      }
      callbacks.onSetBattleStyle?.(activeBattleStyle);
    });

    const battleSpeedBtn = settingsModal.querySelector('#settings-battle-speed-btn') as HTMLButtonElement | null;

    let activeBattleSpeed: SpeedMultiplier = battleSpeed;
    const syncBattleSpeedButton = (spd: SpeedMultiplier) => {
      activeBattleSpeed = spd;
      if (battleSpeedBtn) {
        battleSpeedBtn.innerText = `⚔️ BATTLE: ${spd}x`;
        battleSpeedBtn.style.background = getBattleSpeedBg(spd);
        battleSpeedBtn.style.borderColor = getBattleSpeedBorder(spd);
      }
    };

    const applyBattleSpeed = (spd: SpeedMultiplier) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetBattleSpeed) {
        callbacks.onSetBattleSpeed(spd);
      }
      syncBattleSpeedButton(spd);
    };

    battleSpeedBtn?.addEventListener('click', () => {
      if (callbacks.onCycleBattleSpeed) {
        const nextSpeed = callbacks.onCycleBattleSpeed();
        BattleAudio.playMenuSound('CONFIRM');
        syncBattleSpeedButton(nextSpeed);
      } else {
        const nextSpeed: SpeedMultiplier = activeBattleSpeed === 1 ? 2 : activeBattleSpeed === 2 ? 3 : 1;
        applyBattleSpeed(nextSpeed);
      }
    });

    const textSpeedBtn = settingsModal.querySelector('#settings-text-speed-btn') as HTMLButtonElement | null;

    let activeTextSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' = textSpeed;
    const syncTextSpeedButton = (ts: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => {
      activeTextSpeed = ts;
      if (textSpeedBtn) {
        textSpeedBtn.innerText = `💬 TEXT: ${getTextSpeedLabel(ts)}`;
        textSpeedBtn.style.background = getTextSpeedBg(ts);
        textSpeedBtn.style.borderColor = getTextSpeedBorder(ts);
      }
    };

    const applyTextSpeed = (ts: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetTextSpeed) {
        callbacks.onSetTextSpeed(ts);
      }
      syncTextSpeedButton(ts);
    };

    textSpeedBtn?.addEventListener('click', () => {
      if (callbacks.onCycleTextSpeed) {
        const nextTs = callbacks.onCycleTextSpeed();
        BattleAudio.playMenuSound('CONFIRM');
        syncTextSpeedButton(nextTs);
      } else {
        const speeds: Array<'SLOW' | 'MID' | 'FAST' | 'INSTANT'> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
        const nextTs = speeds[(speeds.indexOf(activeTextSpeed) + 1) % speeds.length];
        applyTextSpeed(nextTs);
      }
    });

    gamepadBtn.addEventListener('click', () => {
      if (callbacks.onToggleGamepad) {
        const active = callbacks.onToggleGamepad();
        BattleAudio.playMenuSound('CONFIRM');
        gamepadBtn.innerText = active ? '🎮 TOUCH: ON' : '🎮 TOUCH: OFF';
        gamepadBtn.style.background = active ? '#059669' : '#334155';
        gamepadBtn.style.borderColor = active ? '#34d399' : '#64748b';
      }
    });

    controlStyleBtn.addEventListener('click', () => {
      if (callbacks.onToggleTouchControlStyle) {
        const nextStyle = callbacks.onToggleTouchControlStyle();
        BattleAudio.playMenuSound('CONFIRM');
        const nextIsJoy = nextStyle === 'JOYSTICK';
        controlStyleBtn.innerText = nextIsJoy ? '🕹️ JOYSTICK (Analog)' : '🕹️ D-PAD (Buttons)';
        controlStyleBtn.style.background = nextIsJoy ? '#7c3aed' : '#0284c7';
        controlStyleBtn.style.borderColor = nextIsJoy ? '#c084fc' : '#38bdf8';
      }
    });

    const closeHandler = () => {
      BattleAudio.playMenuSound('CANCEL');
      settingsModal.style.display = 'none';
      menuPanel.style.display = 'flex';
    };

    closeBtn.addEventListener('click', closeHandler);
    closeXBtn.addEventListener('click', closeHandler);
  }
