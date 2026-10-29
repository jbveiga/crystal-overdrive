/**
 * @fileoverview IntroStageRenderersAndStyles domain module implementation.
 * @module ui/intro/IntroStageRenderersAndStyles
 * @role IntroStageRenderersAndStyles Component
 * @exports injectIntroStyles, renderSpotlightDais, RenderGenderSelectStageParams
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-279: Implementation | L280-559: Handlers & Exports
 */

import { BattleAudio } from '../../audio/BattleAudio';

/**
 * Injects keyframes and styles for the Crystal Overdrive Intro Sequence.
 */
export function injectIntroStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('crystal-intro-sequence-styles')) return;

  const style = document.createElement('style');
  style.id = 'crystal-intro-sequence-styles';
  style.textContent = `
    @keyframes introPokemonBounce {
      0%, 100% { transform: translateY(0px) scale(1); }
      45% { transform: translateY(-14px) scale(1.06); }
    }
    @keyframes introShrinkRay {
      0% { transform: scale(1); filter: brightness(1); opacity: 1; }
      45% { transform: scale(0.55); filter: brightness(2.5) hue-rotate(45deg); opacity: 0.95; }
      100% { transform: scale(0.08); filter: brightness(4); opacity: 0.15; }
    }
    .intro-pixel-sprite {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Renders the Professor Elm spotlight dais and optional Marill mascot showcase.
 */
export function renderSpotlightDais(withPokemon: boolean): string {
  return `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 28px;
    ">
      <div style="
        position: absolute;
        bottom: 14px;
        width: 220px;
        height: 54px;
        border-radius: 50%;
        background: radial-gradient(ellipse at center, rgba(56, 189, 248, 0.48) 0%, rgba(30, 58, 138, 0.12) 75%, transparent 100%);
        border: 2px solid rgba(125, 211, 252, 0.35);
        box-shadow: 0 0 28px rgba(56, 189, 248, 0.45);
      "></div>

      <div style="display: flex; align-items: flex-end; gap: 24px; z-index: 2;">
        <div class="intro-pixel-sprite" style="
          width: 64px;
          height: 128px;
          background-image: url('./assets/sprites/characters/prof_elm.png');
          background-size: 576px 128px;
          background-position: 0px 0px;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.65));
        "></div>

        ${
          withPokemon
            ? `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            animation: introPokemonBounce 0.9s infinite ease-in-out;
          ">
            <div style="
              font-size: 11px;
              font-weight: 900;
              color: #38bdf8;
              background: rgba(15, 23, 42, 0.9);
              border: 1px solid #38bdf8;
              border-radius: 999px;
              padding: 2px 8px;
              margin-bottom: 4px;
            ">✨ MARILL!</div>
            <img src="./assets/sprites/pokemon/marill_front.png"
                 alt="Marill"
                 onerror="this.onerror=null;"
                 style="width: 56px; height: 56px; image-rendering: pixelated; object-fit: contain; background: transparent; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));" />
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}

export interface RenderGenderSelectStageParams {
  stageViewport: HTMLElement;
  selectedGender: 'BOY' | 'GIRL';
  onSelectGender: (gender: 'BOY' | 'GIRL') => void;
  onConfirm: () => void;
}

/**
 * Renders the Gender Selection stage (Boy vs Girl).
 */
export function renderGenderSelectStage({
  stageViewport,
  selectedGender,
  onSelectGender,
  onConfirm,
}: RenderGenderSelectStageParams): void {
  const boySelected = selectedGender === 'BOY';
  const girlSelected = selectedGender === 'GIRL';

  stageViewport.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 18px; width: 100%;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; width: min(460px, 92vw);">
        <!-- BOY Card -->
        <div id="intro-gender-boy" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          border-radius: 14px;
          background: ${boySelected ? 'linear-gradient(180deg, rgba(2, 132, 199, 0.38), rgba(15, 23, 42, 0.92))' : 'rgba(15, 23, 42, 0.75)'};
          border: 3px solid ${boySelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'};
          box-shadow: ${boySelected ? '0 0 24px rgba(56, 189, 248, 0.45)' : 'none'};
          cursor: pointer;
          transition: all 0.15s ease;
        ">
          <div data-walk-sprite="boy" class="intro-pixel-sprite" style="
            width: 48px;
            height: 96px;
            background-image: url('./assets/sprites/characters/gold_walk.png');
            background-size: 432px 96px;
            background-position: -144px 0px;
          "></div>
          <div style="font-size: 16px; font-weight: 900; color: #38bdf8;">
            ${boySelected ? '▶ ' : ''}BOY ♂
          </div>
        </div>

        <!-- GIRL Card -->
        <div id="intro-gender-girl" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          border-radius: 14px;
          background: ${girlSelected ? 'linear-gradient(180deg, rgba(225, 29, 72, 0.38), rgba(15, 23, 42, 0.92))' : 'rgba(15, 23, 42, 0.75)'};
          border: 3px solid ${girlSelected ? '#fb7185' : 'rgba(148, 163, 184, 0.25)'};
          box-shadow: ${girlSelected ? '0 0 24px rgba(251, 113, 133, 0.45)' : 'none'};
          cursor: pointer;
          transition: all 0.15s ease;
        ">
          <div data-walk-sprite="girl" class="intro-pixel-sprite" style="
            width: 48px;
            height: 96px;
            background-image: url('./assets/sprites/characters/kris_walk.png');
            background-size: 432px 96px;
            background-position: -144px 0px;
          "></div>
          <div style="font-size: 16px; font-weight: 900; color: #fb7185;">
            ${girlSelected ? '▶ ' : ''}GIRL ♀
          </div>
        </div>
      </div>

      <button id="intro-gender-confirm-btn" style="
        padding: 11px 28px;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 900;
        background: #16a34a;
        color: #ffffff;
        border: 2px solid #86efac;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(22, 163, 74, 0.5);
      ">✓ CONFIRM ${selectedGender}</button>
    </div>
  `;

  const boyCard = stageViewport.querySelector('#intro-gender-boy');
  const girlCard = stageViewport.querySelector('#intro-gender-girl');
  const confirmBtn = stageViewport.querySelector('#intro-gender-confirm-btn');

  boyCard?.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectGender('BOY');
  });
  girlCard?.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelectGender('GIRL');
  });
  confirmBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onConfirm();
  });
}

export interface RenderNameInputStageParams {
  stageViewport: HTMLElement;
  selectedGender: 'BOY' | 'GIRL';
  playerName: string;
  presets: string[];
  maxNameLength: number;
  onSelectPreset: (preset: string) => void;
  onAppendChar: (char: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
}

/**
 * Renders the Name Input stage (Slot readout, Presets, on-screen QWERTY).
 */
export function renderNameInputStage({
  stageViewport,
  selectedGender,
  playerName,
  presets,
  maxNameLength,
  onSelectPreset,
  onAppendChar,
  onBackspace,
  onConfirm,
}: RenderNameInputStageParams): void {
  const spriteUrl =
    selectedGender === 'GIRL'
      ? './assets/sprites/characters/kris_walk.png'
      : './assets/sprites/characters/gold_walk.png';

  const slots = Array.from({ length: maxNameLength }, (_, idx) => {
    const ch = playerName[idx] || '_';
    return `<span style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: clamp(16px, 4.2vw, 24px);
      height: 32px;
      border-bottom: 3px solid ${idx < playerName.length ? '#38bdf8' : '#475569'};
      font-size: clamp(14px, 3.8vw, 18px);
      font-weight: 900;
      color: ${idx < playerName.length ? '#f8fafc' : '#64748b'};
    ">${ch}</span>`;
  }).join('');

  const qwertyRow1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const qwertyRow2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const qwertyRow3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  stageViewport.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      width: min(560px, 94vw);
      background: rgba(15, 23, 42, 0.88);
      border: 2px solid rgba(56, 189, 248, 0.4);
      border-radius: 14px;
      padding: 16px;
    ">
      <!-- Sprite + 15-Character Slot Readout -->
      <div style="display: flex; align-items: center; gap: 14px; width: 100%; justify-content: center; flex-wrap: wrap;">
        <div data-walk-sprite="name" class="intro-pixel-sprite" style="
          width: 48px;
          height: 96px;
          background-image: url('${spriteUrl}');
          background-size: 432px 96px;
          background-position: -144px 0px;
        "></div>
        <div style="display: flex; flex-direction: column; gap: 6px; align-items: center; max-width: 100%;">
          <span style="font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 1px;">YOUR NAME (1–15 CHARS)</span>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; max-width: 100%;">${slots}</div>
        </div>
      </div>

      <!-- Johto Canonical Presets -->
      <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
        ${presets
          .map(
            (preset) => `
          <button data-preset-name="${preset}" style="
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            background: ${playerName === preset ? '#0284c7' : '#1e293b'};
            color: #ffffff;
            border: 1px solid ${playerName === preset ? '#7dd3fc' : '#475569'};
          ">★ ${preset}</button>
        `
          )
          .join('')}
      </div>

      <!-- Virtual On-Screen QWERTY Keyboard -->
      <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
        <!-- Row 1: Q - P (10 keys) -->
        <div style="display: flex; gap: 5px; width: 100%; justify-content: center;">
          ${qwertyRow1
            .map(
              (letter) => `
            <button data-key-char="${letter}" style="
              flex: 1;
              min-width: 0;
              padding: 9px 0;
              border-radius: 6px;
              font-size: clamp(12px, 3.2vw, 15px);
              font-weight: 800;
              background: #1e293b;
              color: #f8fafc;
              border: 1px solid #334155;
              cursor: pointer;
              touch-action: manipulation;
            ">${letter}</button>
          `
            )
            .join('')}
        </div>

        <!-- Row 2: A - L (9 keys, centered) -->
        <div style="display: flex; gap: 5px; width: 100%; justify-content: center; padding: 0 4%;">
          ${qwertyRow2
            .map(
              (letter) => `
            <button data-key-char="${letter}" style="
              flex: 1;
              min-width: 0;
              padding: 9px 0;
              border-radius: 6px;
              font-size: clamp(12px, 3.2vw, 15px);
              font-weight: 800;
              background: #1e293b;
              color: #f8fafc;
              border: 1px solid #334155;
              cursor: pointer;
              touch-action: manipulation;
            ">${letter}</button>
          `
            )
            .join('')}
        </div>

        <!-- Row 3: DEL + Z - M + OK -->
        <div style="display: flex; gap: 5px; width: 100%; justify-content: center;">
          <button id="intro-key-back" style="
            flex: 1.5;
            min-width: 0;
            padding: 9px 0;
            border-radius: 6px;
            font-size: clamp(11px, 2.6vw, 13px);
            font-weight: 800;
            background: #dc2626;
            color: #ffffff;
            border: 1px solid #fca5a5;
            cursor: pointer;
            touch-action: manipulation;
          ">⌫ DEL</button>
          ${qwertyRow3
            .map(
              (letter) => `
            <button data-key-char="${letter}" style="
              flex: 1;
              min-width: 0;
              padding: 9px 0;
              border-radius: 6px;
              font-size: clamp(12px, 3.2vw, 15px);
              font-weight: 800;
              background: #1e293b;
              color: #f8fafc;
              border: 1px solid #334155;
              cursor: pointer;
              touch-action: manipulation;
            ">${letter}</button>
          `
            )
            .join('')}
          <button id="intro-key-ok" style="
            flex: 1.5;
            min-width: 0;
            padding: 9px 0;
            border-radius: 6px;
            font-size: clamp(11px, 2.6vw, 13px);
            font-weight: 900;
            background: #16a34a;
            color: #ffffff;
            border: 1px solid #86efac;
            cursor: pointer;
            touch-action: manipulation;
          ">✓ OK</button>
        </div>
      </div>
    </div>
  `;

  const presetBtns = stageViewport.querySelectorAll('[data-preset-name]');
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const preset = (btn as HTMLElement).getAttribute('data-preset-name') || 'GOLD';
      onSelectPreset(preset);
    });
  });

  const charBtns = stageViewport.querySelectorAll('[data-key-char]');
  charBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ch = (btn as HTMLElement).getAttribute('data-key-char') || '';
      BattleAudio.playMenuSound('CURSOR');
      onAppendChar(ch);
    });
  });

  const backBtn = stageViewport.querySelector('#intro-key-back');
  backBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onBackspace();
  });

  const okBtn = stageViewport.querySelector('#intro-key-ok');
  okBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onConfirm();
  });
}

export interface RenderClockSetupStageParams {
  stageViewport: HTMLElement;
  clock: {
    period: 'MORNING' | 'DAY' | 'NIGHT';
    icon: string;
    timeFormatted: string;
  };
  onConfirm: () => void;
}

/**
 * Renders the PokéGear Real-Time Clock (RTC) Setup Stage.
 */
export function renderClockSetupStage({
  stageViewport,
  clock,
  onConfirm,
}: RenderClockSetupStageParams): void {
  stageViewport.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      background: rgba(15, 23, 42, 0.88);
      border: 2px solid rgba(56, 189, 248, 0.45);
      border-radius: 16px;
      padding: 24px 32px;
      text-align: center;
    ">
      <div style="font-size: 13px; font-weight: 800; color: #7dd3fc; letter-spacing: 1.5px;">
        📻 POKéGEAR REAL-TIME CLOCK (RTC)
      </div>
      <div style="font-size: 40px; font-weight: 900; color: #f8fafc; letter-spacing: 3px;">
        ${clock.icon} ${clock.timeFormatted}
      </div>
      <div style="
        font-size: 13px;
        font-weight: 800;
        color: #facc15;
        background: rgba(250, 204, 21, 0.14);
        border: 1px solid rgba(250, 204, 21, 0.45);
        padding: 4px 14px;
        border-radius: 999px;
      ">JOHTO TIME PERIOD: ${clock.period}</div>
      <button id="intro-clock-confirm-btn" style="
        margin-top: 6px;
        padding: 10px 28px;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 900;
        background: #16a34a;
        color: #ffffff;
        border: 2px solid #86efac;
        cursor: pointer;
      ">✓ CONFIRM TIME</button>
    </div>
  `;

  const confirmBtn = stageViewport.querySelector('#intro-clock-confirm-btn');
  confirmBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onConfirm();
  });
}

export interface RenderShrinkWarpStageParams {
  stageViewport: HTMLElement;
  selectedGender: 'BOY' | 'GIRL';
  onEnter: () => void;
}

/**
 * Renders the Shrink Warp / Enter New Bark Town Stage.
 */
export function renderShrinkWarpStage({
  stageViewport,
  selectedGender,
  onEnter,
}: RenderShrinkWarpStageParams): void {
  const spriteUrl =
    selectedGender === 'GIRL'
      ? './assets/sprites/characters/kris_walk.png'
      : './assets/sprites/characters/gold_walk.png';

  stageViewport.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    ">
      <div class="intro-pixel-sprite" style="
        width: 64px;
        height: 128px;
        background-image: url('${spriteUrl}');
        background-size: 576px 128px;
        background-position: 0px 0px;
        animation: introShrinkRay 1.3s forwards ease-in-out;
      "></div>
      <button id="intro-enter-johto-btn" style="
        padding: 12px 32px;
        border-radius: 999px;
        font-size: 15px;
        font-weight: 900;
        background: linear-gradient(135deg, #0284c7, #7c3aed);
        color: #ffffff;
        border: 2px solid #bae6fd;
        cursor: pointer;
        box-shadow: 0 0 24px rgba(56, 189, 248, 0.65);
      ">⚡ ENTER NEW BARK TOWN ⚡</button>
    </div>
  `;

  const enterBtn = stageViewport.querySelector('#intro-enter-johto-btn');
  enterBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onEnter();
  });
}
