/**
 * @fileoverview TitleScreenModalsAndStyles domain module implementation.
 * @module ui/title/TitleScreenModalsAndStyles
 * @role TitleScreenModalsAndStyles Component
 * @exports injectTitleScreenStyles, RenderMainMenuParams, renderMainMenu
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-289: Implementation | L290-578: Handlers & Exports
 */

import type { GameOptions, SavePreview, SpeedMultiplier } from '../../types/game';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * Injects keyframes and styles for the Crystal Overdrive Title Screen.
 */
export function injectTitleScreenStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('crystal-title-screen-styles')) return;

  const style = document.createElement('style');
  style.id = 'crystal-title-screen-styles';
  style.textContent = `
    @keyframes crystalFloatUp {
      0% { transform: translateY(105vh) rotate(0deg) scale(0.75); opacity: 0; }
      15% { opacity: 0.75; }
      85% { opacity: 0.65; }
      100% { transform: translateY(-15vh) rotate(220deg) scale(1.15); opacity: 0; }
    }
    @keyframes crystalLogoShimmer {
      0%, 100% {
        filter: drop-shadow(0 0 18px rgba(56, 189, 248, 0.65)) drop-shadow(0 0 36px rgba(168, 85, 247, 0.35));
      }
      50% {
        filter: drop-shadow(0 0 26px rgba(125, 211, 252, 0.95)) drop-shadow(0 0 48px rgba(232, 121, 249, 0.65));
      }
    }
    @keyframes crystalBlinkPrompt {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.28; transform: scale(0.98); }
    }
    .crystal-particle {
      position: absolute; pointer-events: none;
      background: linear-gradient(135deg, rgba(125, 211, 252, 0.85), rgba(192, 132, 252, 0.45));
      border: 1px solid rgba(224, 242, 254, 0.75);
      clip-path: polygon(50% 0%, 92% 50%, 50% 100%, 8% 50%);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.55);
      animation: crystalFloatUp linear infinite;
    }
  `;
  document.head.appendChild(style);
}

export interface RenderMainMenuParams {
  menuElement: HTMLElement | null;
  hasSaveData: boolean;
  preview: SavePreview | null;
  cursorIndex: number;
  onSelectOption: (index: number) => void;
}

/**
 * Renders the Main Menu cards (CONTINUE, NEW GAME, OPTIONS).
 */
export function renderMainMenu({
  menuElement,
  hasSaveData,
  preview,
  cursorIndex,
  onSelectOption,
}: RenderMainMenuParams): void {
  if (!menuElement) return;
  menuElement.innerHTML = '';

  // 1. CONTINUE Card / Button
  const continueFocused = cursorIndex === 0;
  const continueBtn = document.createElement('div');
  continueBtn.id = 'title-opt-continue';
  continueBtn.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 18px;
    border-radius: 12px;
    background: ${
      !hasSaveData
        ? 'rgba(15, 23, 42, 0.42)'
        : continueFocused
        ? 'linear-gradient(135deg, rgba(14, 116, 144, 0.55), rgba(30, 58, 138, 0.72))'
        : 'rgba(15, 23, 42, 0.82)'
    };
    border: 2px solid ${
      !hasSaveData
        ? 'rgba(148, 163, 184, 0.18)'
        : continueFocused
        ? '#38bdf8'
        : 'rgba(148, 163, 184, 0.3)'
    };
    box-shadow: ${continueFocused && hasSaveData ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none'};
    opacity: ${hasSaveData ? '1' : '0.48'};
    cursor: ${hasSaveData ? 'pointer' : 'not-allowed'};
    transition: all 0.15s ease;
  `;

  if (hasSaveData && preview) {
    const genderBadge =
      preview.gender === 'GIRL'
        ? `<span style="color: #f43f5e; font-weight: 900;">♀</span>`
        : `<span style="color: #38bdf8; font-weight: 900;">♂</span>`;
    const leadSpecies = preview.partyLeadSpeciesId
      ? `${preview.partyLeadSpeciesId.toUpperCase()} (Lv.${preview.partyLeadLevel ?? 5})`
      : 'Party Ready';

    continueBtn.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 16px; font-weight: 900; color: #f8fafc; letter-spacing: 1px;">
          ${continueFocused ? '▶ ' : ''}CONTINUE JOURNEY
        </div>
        <span style="
          background: rgba(56, 189, 248, 0.2);
          border: 1px solid rgba(56, 189, 248, 0.5);
          color: #7dd3fc;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        ">📍 ${preview.currentLocationName}</span>
      </div>
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
        gap: 8px;
        padding-top: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 12px;
        color: #cbd5e1;
        font-weight: 700;
      ">
        <div>👤 ${preview.playerName} ${genderBadge}</div>
        <div>🏅 BADGES: <span style="color: #facc15;">${preview.badgeCount} / 8</span></div>
        <div>📕 POKéDEX: <span style="color: #4ade80;">${preview.pokedexCount}</span></div>
        <div>⏱️ TIME: <span style="color: #f8fafc;">${preview.playTimeFormatted}</span></div>
        <div>⚔️ LEAD: <span style="color: #38bdf8;">${leadSpecies}</span></div>
      </div>
    `;
  } else {
    continueBtn.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 15px; font-weight: 800; color: #94a3b8;">CONTINUE</span>
        <span style="font-size: 12px; color: #64748b; font-weight: 700;">NO SAVE DATA FOUND</span>
      </div>
    `;
  }

  continueBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!hasSaveData) {
      BattleAudio.playMenuSound('CANCEL');
      return;
    }
    onSelectOption(0);
  });
  menuElement.appendChild(continueBtn);

  // 2. NEW GAME Button
  const newGameFocused = cursorIndex === 1;
  const newGameBtn = document.createElement('div');
  newGameBtn.id = 'title-opt-new-game';
  newGameBtn.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-radius: 12px;
    background: ${
      newGameFocused
        ? 'linear-gradient(135deg, rgba(14, 116, 144, 0.55), rgba(30, 58, 138, 0.72))'
        : 'rgba(15, 23, 42, 0.82)'
    };
    border: 2px solid ${newGameFocused ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)'};
    box-shadow: ${newGameFocused ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none'};
    cursor: pointer;
    transition: all 0.15s ease;
  `;
  newGameBtn.innerHTML = `
    <span style="font-size: 16px; font-weight: 900; color: #f8fafc; letter-spacing: 1px;">
      ${newGameFocused ? '▶ ' : ''}NEW GAME
    </span>
    <span style="font-size: 12px; font-weight: 700; color: #94a3b8;">Start Fresh in New Bark Town</span>
  `;
  newGameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectOption(1);
  });
  menuElement.appendChild(newGameBtn);

  // 3. OPTIONS Button
  const optionsFocused = cursorIndex === 2;
  const optionsBtn = document.createElement('div');
  optionsBtn.id = 'title-opt-options';
  optionsBtn.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-radius: 12px;
    background: ${
      optionsFocused
        ? 'linear-gradient(135deg, rgba(14, 116, 144, 0.55), rgba(30, 58, 138, 0.72))'
        : 'rgba(15, 23, 42, 0.82)'
    };
    border: 2px solid ${optionsFocused ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)'};
    box-shadow: ${optionsFocused ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none'};
    cursor: pointer;
    transition: all 0.15s ease;
  `;
  optionsBtn.innerHTML = `
    <span style="font-size: 16px; font-weight: 900; color: #f8fafc; letter-spacing: 1px;">
      ${optionsFocused ? '▶ ' : ''}OPTIONS
    </span>
    <span style="font-size: 12px; font-weight: 700; color: #94a3b8;">Audio, Text Speed & Overdrive Settings</span>
  `;
  optionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectOption(2);
  });
  menuElement.appendChild(optionsBtn);

  // 4. SAVE DATA Button
  const saveDataFocused = cursorIndex === 3;
  const saveDataBtn = document.createElement('div');
  saveDataBtn.id = 'title-opt-save-data';
  saveDataBtn.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 12px; background: ${saveDataFocused ? 'linear-gradient(135deg, rgba(14, 116, 144, 0.55), rgba(30, 58, 138, 0.72))' : 'rgba(15, 23, 42, 0.82)'}; border: 2px solid ${saveDataFocused ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)'}; box-shadow: ${saveDataFocused ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none'}; cursor: pointer; transition: all 0.15s ease;`;
  saveDataBtn.innerHTML = `
    <span style="font-size: 16px; font-weight: 900; color: #f8fafc; letter-spacing: 1px;">
      ${saveDataFocused ? '▶ ' : ''}SAVE DATA
    </span>
    <span style="font-size: 12px; font-weight: 700; color: #94a3b8;">Import / Export Cross-Device Save</span>
  `;
  saveDataBtn.addEventListener('click', (e) => { e.stopPropagation(); onSelectOption(3); });
  menuElement.appendChild(saveDataBtn);
}

export interface RenderOverwriteModalParams {
  overwriteModalElement: HTMLElement | null;
  overwriteConfirmOpen: boolean;
  overwriteCursorIndex: number;
  savePreview: SavePreview | null;
  onSelectOption: (index: number) => void;
}

/**
 * Renders the New Game Overwrite Confirmation Modal and binds its click listeners.
 */
export function renderOverwriteModal({
  overwriteModalElement,
  overwriteConfirmOpen,
  overwriteCursorIndex,
  savePreview,
  onSelectOption,
}: RenderOverwriteModalParams): void {
  if (!overwriteModalElement) return;
  overwriteModalElement.style.display = overwriteConfirmOpen ? 'flex' : 'none';
  if (!overwriteConfirmOpen) return;

  const yesFocused = overwriteCursorIndex === 0;
  const noFocused = overwriteCursorIndex === 1;

  overwriteModalElement.innerHTML = `
    <div style="
      background: #0f172a;
      border: 2px solid #f43f5e;
      border-radius: 14px;
      padding: 24px;
      width: min(440px, 92vw);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    ">
      <div style="font-size: 18px; font-weight: 900; color: #fb7185;">
        ⚠️ OVERWRITE EXISTING SAVE?
      </div>
      <div style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">
        An active adventure for <strong>${savePreview?.playerName ?? 'GOLD'}</strong> (${savePreview?.playTimeFormatted ?? '00:00'}) already exists. Saving in the new adventure will replace the previous save.
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 6px;">
        <button id="overwrite-confirm-yes" style="
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          background: ${yesFocused ? '#dc2626' : '#1e293b'};
          color: #ffffff;
          border: 1px solid ${yesFocused ? '#fca5a5' : '#475569'};
        ">${yesFocused ? '▶ ' : ''}START NEW GAME</button>
        <button id="overwrite-confirm-no" style="
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          background: ${noFocused ? '#0284c7' : '#1e293b'};
          color: #ffffff;
          border: 1px solid ${noFocused ? '#7dd3fc' : '#475569'};
        ">${noFocused ? '▶ ' : ''}CANCEL</button>
      </div>
    </div>
  `;

  const yesBtn = overwriteModalElement.querySelector('#overwrite-confirm-yes');
  const noBtn = overwriteModalElement.querySelector('#overwrite-confirm-no');

  yesBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectOption(0);
  });
  noBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectOption(1);
  });
}

export interface RenderOptionsModalParams {
  optionsModalElement: HTMLElement | null;
  optionsModalOpen: boolean;
  options: GameOptions;
  onClose: () => void;
  onUpdateOptions: (patch: Partial<GameOptions>) => void;
  /** Optional hook to append extra sections (e.g. Offline Play) once the modal markup is in place. */
  onRendered?: (modal: HTMLElement) => void;
}

/**
 * Renders the System Options Modal and binds slider, button, and toggle listeners.
 */
export function renderOptionsModal({
  optionsModalElement,
  optionsModalOpen,
  options,
  onClose,
  onUpdateOptions,
  onRendered,
}: RenderOptionsModalParams): void {
  if (!optionsModalElement) return;
  optionsModalElement.style.display = optionsModalOpen ? 'flex' : 'none';
  if (!optionsModalOpen) return;

  const textSpeeds: Array<GameOptions['textSpeed']> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
  const battleSpeeds: SpeedMultiplier[] = [1, 2, 3];
  const speeds: SpeedMultiplier[] = [1, 2, 3, 4];

  optionsModalElement.innerHTML = `
    <div style="
      background: #0f172a;
      border: 2px solid #38bdf8;
      border-radius: 14px;
      padding: 24px;
      width: min(480px, 94vw);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 900; color: #38bdf8;">⚙️ SYSTEM OPTIONS</h3>
        <button id="options-close-btn" style="
          background: #1e293b;
          color: #cbd5e1;
          border: 1px solid #475569;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        ">✕ CLOSE</button>
      </div>

      <!-- BGM Volume -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
          <span>🎵 BGM VOLUME</span>
          <span style="color: #38bdf8;">${Math.round(options.bgmVolume * 100)}%</span>
        </div>
        <input id="opt-bgm-slider" type="range" min="0" max="100" value="${Math.round(options.bgmVolume * 100)}" style="width: 100%; cursor: pointer;" />
      </div>

      <!-- SFX Volume -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
          <span>🔊 SFX VOLUME</span>
          <span style="color: #38bdf8;">${Math.round(options.soundVolume * 100)}%</span>
        </div>
        <input id="opt-sfx-slider" type="range" min="0" max="100" value="${Math.round(options.soundVolume * 100)}" style="width: 100%; cursor: pointer;" />
      </div>

      <!-- Text Speed -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span style="font-size: 13px; font-weight: 700;">💬 TEXT SPEED</span>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
          ${textSpeeds
            .map(
              (ts) => `
            <button data-text-speed="${ts}" style="
              padding: 8px 6px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 800;
              cursor: pointer;
              background: ${options.textSpeed === ts ? '#0284c7' : '#1e293b'};
              color: #ffffff;
              border: 1px solid ${options.textSpeed === ts ? '#7dd3fc' : '#475569'};
            ">${ts}</button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Battle Animations -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700;">✨ BATTLE ANIMATIONS</span>
        <button id="opt-battle-anim-btn" style="
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          background: ${options.battleAnimations ? '#059669' : '#1e293b'};
          color: #ffffff;
          border: 1px solid ${options.battleAnimations ? '#34d399' : '#475569'};
        ">${options.battleAnimations ? 'ON' : 'OFF'}</button>
      </div>

      <!-- 8-Bit Chiptune APU Synthesis Mode -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700;">🎵 8-BIT APU CHIPTUNE BGM</span>
        <button id="opt-chiptune-btn" style="
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          background: ${options.chiptuneMode ? '#7c3aed' : '#1e293b'};
          color: #ffffff;
          border: 1px solid ${options.chiptuneMode ? '#c084fc' : '#475569'};
        ">${options.chiptuneMode ? 'ON' : 'OFF'}</button>
      </div>

      <!-- Low-HP Warning Alarm Beep -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700;">🚨 LOW-HP WARNING BEEP</span>
        <button id="opt-lowhp-beep-btn" style="
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          background: ${(options.lowHpBeepEnabled ?? true) ? '#059669' : '#1e293b'};
          color: #ffffff;
          border: 1px solid ${(options.lowHpBeepEnabled ?? true) ? '#34d399' : '#475569'};
        ">${(options.lowHpBeepEnabled ?? true) ? 'ON' : 'OFF'}</button>
      </div>

      <!-- Battle Speed Multiplier -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span style="font-size: 13px; font-weight: 700;">⚔️ BATTLE SPEED</span>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
          ${battleSpeeds
            .map(
              (spd) => `
            <button data-battle-speed="${spd}" style="
              padding: 8px 6px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 800;
              cursor: pointer;
              background: ${(options.battleSpeedMultiplier ?? 1) === spd ? '#2563eb' : '#1e293b'};
              color: #ffffff;
              border: 1px solid ${(options.battleSpeedMultiplier ?? 1) === spd ? '#60a5fa' : '#475569'};
            ">${spd === 1 ? '1x NORMAL' : spd === 2 ? '2x FAST' : '3x TURBO'}</button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Default Overdrive Movement Speed -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span style="font-size: 13px; font-weight: 700;">⚡ DEFAULT OVERDRIVE SPEED</span>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
          ${speeds
            .map(
              (spd) => `
            <button data-default-speed="${spd}" style="
              padding: 8px 6px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 800;
              cursor: pointer;
              background: ${options.playerSpeedDefault === spd ? '#7c3aed' : '#1e293b'};
              color: #ffffff;
              border: 1px solid ${options.playerSpeedDefault === spd ? '#a855f7' : '#475569'};
            ">${spd}x</button>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

  onRendered?.(optionsModalElement);

  const closeBtn = optionsModalElement.querySelector('#options-close-btn');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onClose();
  });

  const bgmSlider = optionsModalElement.querySelector('#opt-bgm-slider') as HTMLInputElement | null;
  bgmSlider?.addEventListener('input', (e) => {
    e.stopPropagation();
    const val = Number((e.target as HTMLInputElement).value) / 100;
    onUpdateOptions({ bgmVolume: val });
  });

  const sfxSlider = optionsModalElement.querySelector('#opt-sfx-slider') as HTMLInputElement | null;
  sfxSlider?.addEventListener('input', (e) => {
    e.stopPropagation();
    const val = Number((e.target as HTMLInputElement).value) / 100;
    onUpdateOptions({ soundVolume: val });
  });

  const textSpeedBtns = optionsModalElement.querySelectorAll
    ? optionsModalElement.querySelectorAll('[data-text-speed]')
    : [];
  textSpeedBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ts = (btn as HTMLElement).getAttribute('data-text-speed') as GameOptions['textSpeed'];
      BattleAudio.playMenuSound('CURSOR');
      onUpdateOptions({ textSpeed: ts });
    });
  });

  const animBtn = optionsModalElement.querySelector('#opt-battle-anim-btn');
  animBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    BattleAudio.playMenuSound('CURSOR');
    onUpdateOptions({ battleAnimations: !options.battleAnimations });
  });

  const chiptuneBtn = optionsModalElement.querySelector('#opt-chiptune-btn');
  chiptuneBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    BattleAudio.playMenuSound('CURSOR');
    onUpdateOptions({ chiptuneMode: !(options.chiptuneMode ?? false) });
  });

  const lowHpBeepBtn = optionsModalElement.querySelector('#opt-lowhp-beep-btn');
  lowHpBeepBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = !(options.lowHpBeepEnabled ?? true);
    BattleAudio.setLowHpBeepEnabled(next);
    BattleAudio.playMenuSound('CURSOR');
    onUpdateOptions({ lowHpBeepEnabled: next });
  });

  const battleSpeedBtns = optionsModalElement.querySelectorAll
    ? optionsModalElement.querySelectorAll('[data-battle-speed]')
    : [];
  battleSpeedBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spd = Number((btn as HTMLElement).getAttribute('data-battle-speed')) as SpeedMultiplier;
      BattleAudio.playMenuSound('CURSOR');
      onUpdateOptions({ battleSpeedMultiplier: spd });
    });
  });

  const speedBtns = optionsModalElement.querySelectorAll
    ? optionsModalElement.querySelectorAll('[data-default-speed]')
    : [];
  speedBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spd = Number((btn as HTMLElement).getAttribute('data-default-speed')) as SpeedMultiplier;
      BattleAudio.playMenuSound('CURSOR');
      onUpdateOptions({ playerSpeedDefault: spd });
    });
  });
}

export interface RenderSaveDataModalParams {
  saveModalElement: HTMLElement | null;
  saveModalOpen: boolean;
  savePreview: SavePreview | null;
  onExportSave: () => Promise<string>;
  onImportSave: (raw: string) => Promise<boolean>;
  onClose: () => void;
}

/**
 * Renders the Title Screen Cross-Device Save Data Management modal.
 */
export function renderSaveDataModal({
  saveModalElement,
  saveModalOpen,
  savePreview,
  onExportSave,
  onImportSave,
  onClose,
}: RenderSaveDataModalParams): void {
  if (!saveModalElement) return;
  saveModalElement.style.display = saveModalOpen ? 'flex' : 'none';
  if (!saveModalOpen) return;

  const hasSave = savePreview !== null;
  const currentSaveSummary = hasSave
    ? `👤 ${savePreview.playerName} | 📍 ${savePreview.currentLocationName} | 🏅 ${savePreview.badgeCount}/8 | ⏱️ ${savePreview.playTimeFormatted}`
    : 'No saved adventure on this device.';

  saveModalElement.innerHTML = `
    <div style="background: #0f172a; border: 2px solid #38bdf8; border-radius: 14px; padding: 20px; width: min(520px, 94vw); max-height: 85vh; overflow-y: auto; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85); display: flex; flex-direction: column; gap: 12px; color: #f8fafc; font-family: 'Space Mono', monospace;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #22324f; padding-bottom: 8px;">
        <div>
          <div style="font-size: 15px; font-weight: 900; color: #38bdf8; letter-spacing: 0.5px;">💾 SAVE DATA MANAGEMENT</div>
          <div style="font-size: 10px; color: #94a3b8;">Cross-Device Save Export & Import</div>
        </div>
        <button id="title-close-save-modal-btn" class="neo-kanto-tactile-btn" style="background: #1e293b; color: #e2e8f0; border: 1px solid #475569; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer;">← BACK</button>
      </div>

      <div style="background: #080e1d; border: 1.5px solid #22324f; border-radius: 8px; padding: 8px 10px; font-size: 11px;">
        <div style="color: #94a3b8; font-size: 9px; margin-bottom: 2px; font-weight: 700;">CURRENT LOCAL SAVE STATUS</div>
        <div style="color: ${hasSave ? '#4ade80' : '#facc15'}; font-weight: 700;">${currentSaveSummary}</div>
      </div>

      <div id="title-save-status-msg" style="display: none; padding: 8px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; line-height: 1.4;"></div>

      <!-- Export Section -->
      <div style="background: #141e33; border: 1px solid #22324f; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="font-size: 12px; font-weight: 800; color: #38bdf8;">📤 EXPORT SAVE FILE</div>
        <div style="font-size: 10px; color: #94a3b8;">Export your current adventure as a downloaded JSON file and copy save text.</div>
        <button id="title-export-save-btn" class="neo-kanto-tactile-btn" style="background: #1e3a8a; color: #f8fafc; border: 1.5px solid #38bdf8; border-radius: 6px; padding: 8px; font-size: 11px; font-weight: 800; cursor: pointer;">📤 EXPORT & DOWNLOAD SAVE JSON</button>
        <textarea id="title-save-export-textarea" rows="3" readonly placeholder="Exported save JSON will appear here..." style="width: 100%; background: #080e1d; color: #cbd5e1; border: 1px solid #334155; border-radius: 4px; padding: 6px; font-size: 10px; box-sizing: border-box; display: none;"></textarea>
      </div>

      <!-- Import Section -->
      <div style="background: #141e33; border: 1px solid #22324f; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div style="font-size: 12px; font-weight: 800; color: #a78bfa;">📥 IMPORT SAVE FILE</div>
        <div style="font-size: 10px; color: #94a3b8;">Choose a previously exported .json file or paste raw save JSON / CRYSTAL_SAVE_V1 code.</div>
        <input id="title-import-file-input" type="file" accept=".json,application/json,text/plain" style="font-size: 11px; color: #94a3b8;" />
        <textarea id="title-save-import-textarea" rows="3" placeholder="Paste exported save JSON or code here..." style="width: 100%; background: #080e1d; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; padding: 6px; font-size: 10px; box-sizing: border-box;"></textarea>
        <button id="title-confirm-import-btn" class="neo-kanto-tactile-btn" style="background: #059669; color: white; border: 1.5px solid #34d399; border-radius: 6px; padding: 8px; font-size: 11px; font-weight: 800; cursor: pointer;">📥 LOAD & RESTORE SAVE</button>
      </div>
    </div>
  `;

  const statusMsg = saveModalElement.querySelector('#title-save-status-msg') as HTMLDivElement | null;
  const setStatus = (msg: string, isSuccess: boolean) => {
    if (!statusMsg) return;
    statusMsg.style.display = 'block';
    statusMsg.style.background = isSuccess ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)';
    statusMsg.style.border = isSuccess ? '1px solid #34d399' : '1px solid #f87171';
    statusMsg.style.color = isSuccess ? '#4ade80' : '#f87171';
    statusMsg.textContent = msg;
  };

  const closeBtn = saveModalElement.querySelector('#title-close-save-modal-btn');
  closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); onClose(); });

  const exportBtn = saveModalElement.querySelector('#title-export-save-btn');
  const exportTextarea = saveModalElement.querySelector('#title-save-export-textarea') as HTMLTextAreaElement | null;

  exportBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const json = await onExportSave();
    if (!json) {
      BattleAudio.playMenuSound('CANCEL');
      setStatus('⚠️ No active save data available to export.', false);
      return;
    }
    if (exportTextarea) {
      exportTextarea.style.display = 'block';
      exportTextarea.value = json;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
      }
      if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const pName = (savePreview?.playerName || 'trainer').toLowerCase();
        a.download = `crystal-overdrive-${pName}-save.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // headless fallback
    }
    BattleAudio.playMenuSound('SAVE');
    setStatus('✅ Save exported! Downloaded file and copied JSON to clipboard.', true);
  });

  const fileInput = saveModalElement.querySelector('#title-import-file-input') as HTMLInputElement | null;
  const importTextarea = saveModalElement.querySelector('#title-save-import-textarea') as HTMLTextAreaElement | null;
  const confirmImportBtn = saveModalElement.querySelector('#title-confirm-import-btn');

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file || typeof FileReader === 'undefined') return;
    const reader = new FileReader();
    reader.onload = () => {
      if (importTextarea && typeof reader.result === 'string') importTextarea.value = reader.result;
    };
    reader.readAsText(file);
  });

  confirmImportBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const raw = importTextarea?.value?.trim() || '';
    if (!raw) {
      BattleAudio.playMenuSound('CANCEL');
      setStatus('⚠️ Please select a file or paste save data first.', false);
      return;
    }
    const success = await onImportSave(raw);
    if (success) {
      BattleAudio.playMenuSound('SAVE');
      setStatus('✅ Save data imported successfully! You can now Continue your journey.', true);
    } else {
      BattleAudio.playMenuSound('CANCEL');
      setStatus('⚠️ Invalid save data format. Please verify your JSON or code.', false);
    }
  });
}

