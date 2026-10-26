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
    border-radius: 10px;
    background: ${
      !hasSaveData
        ? 'rgba(13, 19, 34, 0.42)'
        : continueFocused
        ? '#141E33'
        : '#0D1322'
    };
    border: 2px solid ${
      !hasSaveData
        ? '#22324F'
        : continueFocused
        ? '#38BDF8'
        : '#22324F'
    };
    box-shadow: 0 4px 0 0 #070B14;
    opacity: ${hasSaveData ? '1' : '0.48'};
    cursor: ${hasSaveData ? 'pointer' : 'not-allowed'};
    transition: all 0.12s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
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
        <div style="font-size: 15px; font-weight: 800; color: #f8fafc; letter-spacing: 0.8px;">
          ${continueFocused ? '▶ ' : ''}CONTINUE JOURNEY
        </div>
        <span style="
          background: rgba(56, 189, 248, 0.15);
          border: 1.5px solid #38bdf8;
          color: #7dd3fc;
          padding: 2px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">📍 ${preview.currentLocationName}</span>
      </div>
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
        gap: 8px;
        padding-top: 8px;
        border-top: 1.5px solid #22324F;
        font-size: 11.5px;
        color: #cbd5e1;
        font-weight: 700;
        font-family: 'Space Mono', monospace;
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
        <span style="font-size: 11px; color: #64748b; font-weight: 700; font-family: 'Space Mono', monospace;">NO SAVE DATA FOUND</span>
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
    border-radius: 10px;
    background: ${newGameFocused ? '#141E33' : '#0D1322'};
    border: 2px solid ${newGameFocused ? '#38BDF8' : '#22324F'};
    box-shadow: 0 4px 0 0 #070B14;
    cursor: pointer;
    transition: all 0.12s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
  `;
  newGameBtn.innerHTML = `
    <span style="font-size: 15px; font-weight: 800; color: #f8fafc; letter-spacing: 0.8px;">
      ${newGameFocused ? '▶ ' : ''}NEW GAME
    </span>
    <span style="font-size: 11px; font-weight: 700; color: #94a3b8; font-family: 'Space Mono', monospace;">Start Fresh in New Bark Town</span>
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
    border-radius: 10px;
    background: ${optionsFocused ? '#141E33' : '#0D1322'};
    border: 2px solid ${optionsFocused ? '#38BDF8' : '#22324F'};
    box-shadow: 0 4px 0 0 #070B14;
    cursor: pointer;
    transition: all 0.12s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
  `;
  optionsBtn.innerHTML = `
    <span style="font-size: 15px; font-weight: 800; color: #f8fafc; letter-spacing: 0.8px;">
      ${optionsFocused ? '▶ ' : ''}OPTIONS
    </span>
    <span style="font-size: 11px; font-weight: 700; color: #94a3b8; font-family: 'Space Mono', monospace;">Audio, Text Speed & Overdrive</span>
  `;
  optionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectOption(2);
  });
  menuElement.appendChild(optionsBtn);
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
      background: #0D1322;
      border: 2px solid #EF4444;
      border-radius: 12px;
      padding: 24px;
      width: min(440px, 92vw);
      box-shadow: 0 8px 0 0 #070B14;
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
    ">
      <div style="font-size: 17px; font-weight: 800; color: #fb7185; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;">
        ⚠️ OVERWRITE EXISTING SAVE?
      </div>
      <div style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
        An active adventure for <strong>${savePreview?.playerName ?? 'GOLD'}</strong> (${savePreview?.playTimeFormatted ?? '00:00'}) already exists. Saving in the new adventure will replace the previous save.
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 6px;">
        <button id="overwrite-confirm-yes" style="
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          background: ${yesFocused ? '#DC2626' : '#141E33'};
          color: #ffffff;
          border: 1.5px solid ${yesFocused ? '#FCA5A5' : '#22324F'};
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">${yesFocused ? '▶ ' : ''}START NEW GAME</button>
        <button id="overwrite-confirm-no" style="
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          background: ${noFocused ? '#0284C7' : '#141E33'};
          color: #ffffff;
          border: 1.5px solid ${noFocused ? '#7DD3FC' : '#22324F'};
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
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
}: RenderOptionsModalParams): void {
  if (!optionsModalElement) return;
  optionsModalElement.style.display = optionsModalOpen ? 'flex' : 'none';
  if (!optionsModalOpen) return;

  const textSpeeds: Array<GameOptions['textSpeed']> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
  const battleSpeeds: SpeedMultiplier[] = [1, 2, 3];
  const speeds: SpeedMultiplier[] = [1, 2, 3, 4];

  optionsModalElement.innerHTML = `
    <div style="
      background: #0D1322;
      border: 2px solid #38BDF8;
      border-radius: 12px;
      padding: 24px;
      width: min(480px, 94vw);
      box-shadow: 0 8px 0 0 #070B14;
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #38bdf8; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;">⚙️ SYSTEM OPTIONS</h3>
        <button id="options-close-btn" style="
          background: #141E33;
          color: #cbd5e1;
          border: 1.5px solid #22324F;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">✕ CLOSE</button>
      </div>

      <!-- BGM Volume -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
          <span>🎵 BGM VOLUME</span>
          <span style="color: #38bdf8; font-family: 'Space Mono', monospace;">${Math.round(options.bgmVolume * 100)}%</span>
        </div>
        <input id="opt-bgm-slider" type="range" min="0" max="100" value="${Math.round(options.bgmVolume * 100)}" style="width: 100%; cursor: pointer;" />
      </div>

      <!-- SFX Volume -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
          <span>🔊 SFX VOLUME</span>
          <span style="color: #38bdf8; font-family: 'Space Mono', monospace;">${Math.round(options.soundVolume * 100)}%</span>
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
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              background: ${options.textSpeed === ts ? '#0284c7' : '#141E33'};
              color: #ffffff;
              border: 1.5px solid ${options.textSpeed === ts ? '#38bdf8' : '#22324F'};
              box-shadow: 0 2px 0 0 #070B14;
              font-family: 'Space Mono', monospace;
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
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          background: ${options.battleAnimations ? '#059669' : '#141E33'};
          color: #ffffff;
          border: 1.5px solid ${options.battleAnimations ? '#10b981' : '#22324F'};
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">${options.battleAnimations ? 'ON' : 'OFF'}</button>
      </div>

      <!-- 8-Bit Chiptune APU Synthesis Mode -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700;">🎵 8-BIT APU CHIPTUNE BGM</span>
        <button id="opt-chiptune-btn" style="
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          background: ${options.chiptuneMode ? '#7c3aed' : '#141E33'};
          color: #ffffff;
          border: 1.5px solid ${options.chiptuneMode ? '#a855f7' : '#22324F'};
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">${options.chiptuneMode ? 'ON' : 'OFF'}</button>
      </div>

      <!-- Low-HP Warning Alarm Beep -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700;">🚨 LOW-HP WARNING BEEP</span>
        <button id="opt-lowhp-beep-btn" style="
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          background: ${(options.lowHpBeepEnabled ?? true) ? '#059669' : '#141E33'};
          color: #ffffff;
          border: 1.5px solid ${(options.lowHpBeepEnabled ?? true) ? '#10b981' : '#22324F'};
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
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
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              background: ${(options.battleSpeedMultiplier ?? 1) === spd ? '#2563eb' : '#141E33'};
              color: #ffffff;
              border: 1.5px solid ${(options.battleSpeedMultiplier ?? 1) === spd ? '#60a5fa' : '#22324F'};
              box-shadow: 0 2px 0 0 #070B14;
              font-family: 'Space Mono', monospace;
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
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              background: ${options.playerSpeedDefault === spd ? '#7c3aed' : '#141E33'};
              color: #ffffff;
              border: 1.5px solid ${options.playerSpeedDefault === spd ? '#a855f7' : '#22324F'};
              box-shadow: 0 2px 0 0 #070B14;
              font-family: 'Space Mono', monospace;
            ">${spd}x</button>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

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
