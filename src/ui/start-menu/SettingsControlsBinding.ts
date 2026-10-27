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
} from './SettingsModalRenderer';

export function bindSettingsEventListeners(params: {
  settingsModal: HTMLDivElement;
  menuPanel: HTMLDivElement;
  stateProvider: StartMenuStateProvider;
  callbacks: StartMenuCallbacks;
  getSpeedMultiplier: () => SpeedMultiplier;
  setSpeedMultiplier: (speed: SpeedMultiplier) => void;
  getActiveSettingsTab: () => 'ALL' | 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS';
  setActiveSettingsTab: (tab: 'ALL' | 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS') => void;
  reRenderSettingsContent: () => void;
}): void {
  const {
    settingsModal,
    menuPanel,
    stateProvider,
    callbacks,
    getSpeedMultiplier,
    setSpeedMultiplier,
    getActiveSettingsTab,
    setActiveSettingsTab,
    reRenderSettingsContent,
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
    const filterCategory = (tab: 'ALL' | 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS') => {
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
        if (tab === 'ALL' || cat === tab) {
          r.style.display = 'flex';
        } else {
          r.style.display = 'none';
        }
      }
    };

    const tabAll = settingsModal.querySelector('#settings-tab-all');
    tabAll?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('ALL'); });
    const tabAudio = settingsModal.querySelector('#settings-tab-audio');
    tabAudio?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('AUDIO'); });
    const tabGameplay = settingsModal.querySelector('#settings-tab-gameplay');
    tabGameplay?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('GAMEPLAY'); });
    const tabGraphics = settingsModal.querySelector('#settings-tab-graphics');
    tabGraphics?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('GRAPHICS'); });
    const tabControls = settingsModal.querySelector('#settings-tab-controls');
    tabControls?.addEventListener('click', () => { BattleAudio.playMenuSound('CURSOR'); filterCategory('CONTROLS'); });

    const soundBtn = settingsModal.querySelector('#settings-sound-btn') as HTMLButtonElement;
    const chiptuneBtn = settingsModal.querySelector('#settings-chiptune-btn') as HTMLButtonElement;
    const lowHpBeepBtn = settingsModal.querySelector('#settings-lowhp-beep-btn') as HTMLButtonElement;
    const speedBtn = settingsModal.querySelector('#settings-speed-btn') as HTMLButtonElement;
    const gamepadBtn = settingsModal.querySelector('#settings-gamepad-btn') as HTMLButtonElement;
    const controlStyleBtn = settingsModal.querySelector('#settings-control-style-btn') as HTMLButtonElement;
    const crtBtn = settingsModal.querySelector('#settings-crt-btn') as HTMLButtonElement;
    const expShareBtn = settingsModal.querySelector('#settings-exp-share-btn') as HTMLButtonElement;
    const expOffBtn = settingsModal.querySelector('#settings-exp-off-btn') as HTMLButtonElement;
    const expAllBtn = settingsModal.querySelector('#settings-exp-all-btn') as HTMLButtonElement;
    const expCappedBtn = settingsModal.querySelector('#settings-exp-capped-btn') as HTMLButtonElement;
    const encRateBtn = settingsModal.querySelector('#settings-encounter-rate-btn') as HTMLButtonElement;
    const encRelaxedBtn = settingsModal.querySelector('#settings-enc-relaxed-btn') as HTMLButtonElement;
    const encNormalBtn = settingsModal.querySelector('#settings-enc-normal-btn') as HTMLButtonElement;
    const encClassicBtn = settingsModal.querySelector('#settings-enc-classic-btn') as HTMLButtonElement;
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

    let activeExpMode: ExpShareMode = expShareMode;
    const syncExpShareButtons = (mode: ExpShareMode) => {
      activeExpMode = mode;
      expShareBtn.innerText = getExpShareButtonLabel(mode, currentLevelCap);
      expShareBtn.style.background = getExpShareButtonBg(mode);
      expShareBtn.style.borderColor = getExpShareButtonBorder(mode);

      expOffBtn.style.background = mode === 'OFF' ? '#475569' : '#0f172a';
      expOffBtn.style.color = mode === 'OFF' ? '#ffffff' : '#94a3b8';
      expOffBtn.style.borderColor = mode === 'OFF' ? '#cbd5e1' : 'rgba(255,255,255,0.12)';

      expAllBtn.style.background = mode === 'ALL' ? '#059669' : '#0f172a';
      expAllBtn.style.color = mode === 'ALL' ? '#ffffff' : '#94a3b8';
      expAllBtn.style.borderColor = mode === 'ALL' ? '#34d399' : 'rgba(255,255,255,0.12)';

      expCappedBtn.style.background = mode === 'CAPPED' ? '#7c3aed' : '#0f172a';
      expCappedBtn.style.color = mode === 'CAPPED' ? '#ffffff' : '#94a3b8';
      expCappedBtn.style.borderColor = mode === 'CAPPED' ? '#c084fc' : 'rgba(255,255,255,0.12)';
    };

    const applyExpMode = (nextMode: ExpShareMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetExpShareMode) {
        callbacks.onSetExpShareMode(nextMode);
      }
      syncExpShareButtons(nextMode);
    };

    expShareBtn.addEventListener('click', () => {
      if (callbacks.onCycleExpShareMode) {
        const cycled = callbacks.onCycleExpShareMode();
        BattleAudio.playMenuSound('CONFIRM');
        syncExpShareButtons(cycled);
      } else {
        const order: ExpShareMode[] = ['OFF', 'ALL', 'CAPPED'];
        const nextMode = order[(order.indexOf(activeExpMode) + 1) % order.length];
        applyExpMode(nextMode);
      }
    });

    expOffBtn.addEventListener('click', () => applyExpMode('OFF'));
    expAllBtn.addEventListener('click', () => applyExpMode('ALL'));
    expCappedBtn.addEventListener('click', () => applyExpMode('CAPPED'));

    let activeEncMode: EncounterRateMode = encounterRateMode;
    const syncEncounterButtons = (mode: EncounterRateMode) => {
      activeEncMode = mode;
      encRateBtn.innerText = getEncounterRateLabel(mode);
      encRelaxedBtn.style.background = mode === 'RELAXED' ? '#059669' : '#0f172a';
      encRelaxedBtn.style.color = mode === 'RELAXED' ? '#ffffff' : '#94a3b8';
      encRelaxedBtn.style.borderColor = mode === 'RELAXED' ? '#34d399' : 'rgba(255,255,255,0.12)';

      encNormalBtn.style.background = mode === 'NORMAL' ? '#0284c7' : '#0f172a';
      encNormalBtn.style.color = mode === 'NORMAL' ? '#ffffff' : '#94a3b8';
      encNormalBtn.style.borderColor = mode === 'NORMAL' ? '#38bdf8' : 'rgba(255,255,255,0.12)';

      encClassicBtn.style.background = mode === 'CLASSIC' ? '#d97706' : '#0f172a';
      encClassicBtn.style.color = mode === 'CLASSIC' ? '#ffffff' : '#94a3b8';
      encClassicBtn.style.borderColor = mode === 'CLASSIC' ? '#fbbf24' : 'rgba(255,255,255,0.12)';
    };

    const applyEncMode = (nextMode: EncounterRateMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetEncounterRateMode) {
        callbacks.onSetEncounterRateMode(nextMode);
      }
      syncEncounterButtons(nextMode);
    };

    encRateBtn.addEventListener('click', () => {
      const order: EncounterRateMode[] = ['RELAXED', 'NORMAL', 'CLASSIC'];
      const nextMode = order[(order.indexOf(activeEncMode) + 1) % order.length];
      applyEncMode(nextMode);
    });
    encRelaxedBtn.addEventListener('click', () => applyEncMode('RELAXED'));
    encNormalBtn.addEventListener('click', () => applyEncMode('NORMAL'));
    encClassicBtn.addEventListener('click', () => applyEncMode('CLASSIC'));

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

    speedBtn.addEventListener('click', () => {
      if (callbacks.onCycleSpeed) {
        const nextSpeed = callbacks.onCycleSpeed();
        BattleAudio.playMenuSound('CONFIRM');
        speedBtn.innerText = `⚡ SPEED: ${nextSpeed}x`;
      }
    });

    const battleSpeedBtn = settingsModal.querySelector('#settings-battle-speed-btn') as HTMLButtonElement | null;
    const battleSpeed1xBtn = settingsModal.querySelector('#settings-battle-speed-1x-btn') as HTMLButtonElement | null;
    const battleSpeed2xBtn = settingsModal.querySelector('#settings-battle-speed-2x-btn') as HTMLButtonElement | null;
    const battleSpeed3xBtn = settingsModal.querySelector('#settings-battle-speed-3x-btn') as HTMLButtonElement | null;

    let activeBattleSpeed: SpeedMultiplier = battleSpeed;
    const syncBattleSpeedButtons = (spd: SpeedMultiplier) => {
      activeBattleSpeed = spd;
      if (battleSpeedBtn) {
        battleSpeedBtn.innerText = `⚔️ BATTLE: ${spd}x`;
        battleSpeedBtn.style.background = getBattleSpeedBg(spd);
        battleSpeedBtn.style.borderColor = getBattleSpeedBorder(spd);
      }
      const choices: Array<{ el: HTMLButtonElement | null; val: SpeedMultiplier }> = [
        { el: battleSpeed1xBtn, val: 1 },
        { el: battleSpeed2xBtn, val: 2 },
        { el: battleSpeed3xBtn, val: 3 },
      ];
      for (const { el, val } of choices) {
        if (!el) continue;
        const isSel = spd === val;
        el.style.background = isSel ? getBattleSpeedBg(val) : '#080E1D';
        el.style.color = isSel ? '#ffffff' : '#94a3b8';
        el.style.borderColor = isSel ? getBattleSpeedBorder(val) : '#22324F';
      }
    };

    const applyBattleSpeed = (spd: SpeedMultiplier) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetBattleSpeed) {
        callbacks.onSetBattleSpeed(spd);
      }
      syncBattleSpeedButtons(spd);
    };

    battleSpeedBtn?.addEventListener('click', () => {
      if (callbacks.onCycleBattleSpeed) {
        const nextSpeed = callbacks.onCycleBattleSpeed();
        BattleAudio.playMenuSound('CONFIRM');
        syncBattleSpeedButtons(nextSpeed);
      } else {
        const nextSpeed: SpeedMultiplier = activeBattleSpeed === 1 ? 2 : activeBattleSpeed === 2 ? 3 : 1;
        applyBattleSpeed(nextSpeed);
      }
    });

    battleSpeed1xBtn?.addEventListener('click', () => applyBattleSpeed(1));
    battleSpeed2xBtn?.addEventListener('click', () => applyBattleSpeed(2));
    battleSpeed3xBtn?.addEventListener('click', () => applyBattleSpeed(3));

    const textSpeedBtn = settingsModal.querySelector('#settings-text-speed-btn') as HTMLButtonElement | null;
    const textSlowBtn = settingsModal.querySelector('#settings-text-slow-btn') as HTMLButtonElement | null;
    const textMidBtn = settingsModal.querySelector('#settings-text-mid-btn') as HTMLButtonElement | null;
    const textFastBtn = settingsModal.querySelector('#settings-text-fast-btn') as HTMLButtonElement | null;
    const textInstantBtn = settingsModal.querySelector('#settings-text-instant-btn') as HTMLButtonElement | null;

    let activeTextSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' = textSpeed;
    const syncTextSpeedButtons = (ts: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => {
      activeTextSpeed = ts;
      if (textSpeedBtn) {
        textSpeedBtn.innerText = `💬 TEXT: ${getTextSpeedLabel(ts)}`;
        textSpeedBtn.style.background = getTextSpeedBg(ts);
        textSpeedBtn.style.borderColor = getTextSpeedBorder(ts);
      }
      const choices: Array<{ el: HTMLButtonElement | null; val: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' }> = [
        { el: textSlowBtn, val: 'SLOW' },
        { el: textMidBtn, val: 'MID' },
        { el: textFastBtn, val: 'FAST' },
        { el: textInstantBtn, val: 'INSTANT' },
      ];
      for (const { el, val } of choices) {
        if (!el) continue;
        const isSel = ts === val;
        el.style.background = isSel ? getTextSpeedBg(val) : '#080E1D';
        el.style.color = isSel ? '#ffffff' : '#94a3b8';
        el.style.borderColor = isSel ? getTextSpeedBorder(val) : '#22324F';
      }
    };

    const applyTextSpeed = (ts: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => {
      BattleAudio.playMenuSound('CONFIRM');
      if (callbacks.onSetTextSpeed) {
        callbacks.onSetTextSpeed(ts);
      }
      syncTextSpeedButtons(ts);
    };

    textSpeedBtn?.addEventListener('click', () => {
      if (callbacks.onCycleTextSpeed) {
        const nextTs = callbacks.onCycleTextSpeed();
        BattleAudio.playMenuSound('CONFIRM');
        syncTextSpeedButtons(nextTs);
      } else {
        const speeds: Array<'SLOW' | 'MID' | 'FAST' | 'INSTANT'> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
        const nextTs = speeds[(speeds.indexOf(activeTextSpeed) + 1) % speeds.length];
        applyTextSpeed(nextTs);
      }
    });

    textSlowBtn?.addEventListener('click', () => applyTextSpeed('SLOW'));
    textMidBtn?.addEventListener('click', () => applyTextSpeed('MID'));
    textFastBtn?.addEventListener('click', () => applyTextSpeed('FAST'));
    textInstantBtn?.addEventListener('click', () => applyTextSpeed('INSTANT'));

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
