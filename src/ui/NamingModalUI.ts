import { BattleAudio } from '../audio/BattleAudio';

export interface NamingModalCallbacks {
  onConfirm: (name: string) => void;
  onCancel?: () => void;
}

export const RIVAL_NAME_PRESETS: readonly string[] = ['SILVER', 'KAZU', 'KAMON', 'RED'];

/**
 * Rival Naming Modal (Ticket SPRINT-13-RIVAL-AND-AZALEA / QWERTY Keyboard Parity).
 * Immersive crimson/slate card matching the character creation naming screen:
 * - Animated walking Silver sprite (48x96 upscale from canonical 16x32 overworld sheet)
 * - 15-character slot readout with dynamic highlights and underlines
 * - Canonical Johto preset chips (SILVER, KAZU, KAMON, RED)
 * - Complete 3-row QWERTY virtual keyboard with tactile DEL and CONFIRM buttons
 * - Physical keyboard typing, Backspace deletion, and Enter confirmation support
 */
export class NamingModalUI {
  public static readonly MAX_NAME_LENGTH = 15;

  private container: HTMLElement;
  private modalElement: HTMLDivElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private currentName: string = 'SILVER';
  private callbacks: NamingModalCallbacks | null = null;
  private active: boolean = false;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string = 'overworld-hud-container') {
    const el = document.getElementById(containerId) || document.body;
    this.container = el;
  }

  public isOpen(): boolean {
    return this.active;
  }

  public open(callbacks: NamingModalCallbacks, defaultName: string = 'SILVER'): void {
    this.callbacks = callbacks;
    this.currentName = defaultName.trim().toUpperCase() || 'SILVER';
    this.active = true;
    this.render();
  }

  public close(): void {
    this.active = false;
    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
      this.inputElement = null;
    }
  }

  public setName(name: string): void {
    const clean = name.trim().toUpperCase().slice(0, NamingModalUI.MAX_NAME_LENGTH);
    this.currentName = clean;
    if (this.inputElement) {
      this.inputElement.value = clean;
    }
    this.updateSlots();
    this.updatePresetHighlights();
  }

  public appendChar(ch: string): void {
    const upper = ch.toUpperCase();
    if (!/^[A-Z0-9!?.\- ]$/.test(upper)) return;
    if (this.currentName.length >= NamingModalUI.MAX_NAME_LENGTH) return;
    this.setName(this.currentName + upper);
    BattleAudio.playMenuSound('CURSOR');
  }

  public backspace(): void {
    if (this.currentName.length > 0) {
      this.setName(this.currentName.slice(0, -1));
      BattleAudio.playMenuSound('CANCEL');
    }
  }

  public confirm(): string {
    let finalName = this.inputElement ? this.inputElement.value.trim().toUpperCase() : this.currentName;
    if (!finalName) {
      finalName = 'SILVER';
    }
    finalName = finalName.slice(0, NamingModalUI.MAX_NAME_LENGTH);
    this.currentName = finalName;

    BattleAudio.playMenuSound('CONFIRM');
    const cb = this.callbacks?.onConfirm;
    this.close();
    if (cb) {
      cb(finalName);
    }
    return finalName;
  }

  private render(): void {
    if (this.modalElement) {
      this.modalElement.remove();
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'rival-naming-modal';
    backdrop.className = 'interactive';
    backdrop.style.cssText = `
      pointer-events: auto !important;
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100dvh;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      box-sizing: border-box;
    `;

    const card = document.createElement('div');
    card.id = 'rival-naming-card';
    card.className = 'interactive';
    card.style.cssText = `
      pointer-events: auto !important;
      width: min(560px, 94vw);
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      background: #0D1322;
      border: 2px solid #EF4444;
      border-radius: 12px;
      box-shadow: 0 8px 0 0 #070B14;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 18px 20px 20px;
      box-sizing: border-box;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;

    const slots = Array.from({ length: NamingModalUI.MAX_NAME_LENGTH }, (_, idx) => {
      const ch = this.currentName[idx] || '_';
      const isFilled = idx < this.currentName.length;
      return `<span class="rival-slot-char" data-slot-idx="${idx}" style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: clamp(16px, 4.4vw, 24px);
        height: 32px;
        background: #141E33;
        border: 1.5px solid #22324F;
        border-bottom: 3px solid ${isFilled ? '#ef4444' : '#22324F'};
        border-radius: 6px;
        box-shadow: inset 0 2px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
        font-size: clamp(13px, 3.6vw, 16px);
        font-weight: 700;
        color: ${isFilled ? '#fef08a' : '#64748b'};
      ">${ch}</span>`;
    }).join('');

    const qwertyRow1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    const qwertyRow2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
    const qwertyRow3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

    card.innerHTML = `
      <!-- Header Badge & Narrative Prompt -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center;">
        <div style="
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
          color: #f87171;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 999px;
          padding: 3px 12px;
          text-transform: uppercase;
          font-family: 'Space Mono', monospace;
        ">
          🚨 POLICE INVESTIGATION
        </div>
        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4; max-width: 440px;">
          "What was the name of the red-haired boy who stole the POKéMON?"
        </div>
      </div>

      <!-- Character Sprite + 15-Slot Readout -->
      <div style="display: flex; align-items: center; gap: 14px; width: 100%; justify-content: center; flex-wrap: wrap;">
        <div data-walk-sprite="rival" class="intro-pixel-sprite" style="
          width: 48px;
          height: 96px;
          background-image: url('./assets/sprites/characters/silver.png');
          background-size: 432px 96px;
          background-position: 0px 0px;
          image-rendering: pixelated;
          filter: drop-shadow(0 6px 14px rgba(239, 68, 68, 0.45));
        "></div>
        <div style="display: flex; flex-direction: column; gap: 6px; align-items: center; max-width: 100%;">
          <span style="font-size: 11px; font-weight: 800; color: #f87171; letter-spacing: 1px; font-family: 'Space Mono', monospace;">RIVAL'S NAME (1–15 CHARS)</span>
          <div id="rival-slots-container" style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; max-width: 100%;">${slots}</div>
        </div>
      </div>

      <!-- Canonical Johto Presets -->
      <div id="rival-preset-container" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; width: 100%;">
        ${RIVAL_NAME_PRESETS.map(
          (preset) => `
          <button class="rival-preset-btn interactive" data-name="${preset}" style="
            pointer-events: auto !important;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: ${preset === this.currentName ? '#ef4444' : '#141E33'};
            color: #ffffff;
            border: 1.5px solid ${preset === this.currentName ? '#fca5a5' : '#22324F'};
            box-shadow: 0 3px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
            transition: all 0.12s ease;
          ">★ ${preset}</button>
        `
        ).join('')}
      </div>

      <!-- Virtual On-Screen QWERTY Keyboard -->
      <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
        <!-- Row 1: Q - P (10 keys) -->
        <div style="display: flex; gap: 5px; width: 100%; justify-content: center;">
          ${qwertyRow1
            .map(
              (letter) => `
            <button data-key-char="${letter}" class="interactive" style="
              pointer-events: auto !important;
              flex: 1;
              min-width: 0;
              padding: 9px 0;
              border-radius: 6px;
              font-size: clamp(12px, 3.2vw, 15px);
              font-weight: 800;
              background: #141E33;
              color: #f8fafc;
              border: 1.5px solid #22324F;
              box-shadow: 0 3px 0 0 #070B14;
              font-family: 'Space Mono', monospace;
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
            <button data-key-char="${letter}" class="interactive" style="
              pointer-events: auto !important;
              flex: 1;
              min-width: 0;
              padding: 9px 0;
              border-radius: 6px;
              font-size: clamp(12px, 3.2vw, 15px);
              font-weight: 800;
              background: #141E33;
              color: #f8fafc;
              border: 1.5px solid #22324F;
              box-shadow: 0 3px 0 0 #070B14;
              font-family: 'Space Mono', monospace;
              cursor: pointer;
              touch-action: manipulation;
            ">${letter}</button>
          `
            )
            .join('')}
        </div>

        <!-- Row 3: DEL + Z - M + CONFIRM -->
        <div style="display: flex; gap: 5px; width: 100%; justify-content: center;">
          <button id="rival-clear-btn" class="interactive" style="
            pointer-events: auto !important;
            flex: 1.5;
            min-width: 0;
            padding: 9px 0;
            border-radius: 6px;
            font-size: clamp(11px, 2.6vw, 13px);
            font-weight: 800;
            background: #dc2626;
            color: #ffffff;
            border: 1.5px solid #fca5a5;
            box-shadow: 0 4px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
            cursor: pointer;
            touch-action: manipulation;
          ">⌫ DEL</button>
          ${qwertyRow3
            .map(
              (letter) => `
            <button data-key-char="${letter}" class="interactive" style="
              pointer-events: auto !important;
              flex: 1;
              min-width: 0;
              padding: 9px 0;
              border-radius: 6px;
              font-size: clamp(12px, 3.2vw, 15px);
              font-weight: 800;
              background: #141E33;
              color: #f8fafc;
              border: 1.5px solid #22324F;
              box-shadow: 0 3px 0 0 #070B14;
              font-family: 'Space Mono', monospace;
              cursor: pointer;
              touch-action: manipulation;
            ">${letter}</button>
          `
            )
            .join('')}
          <button id="rival-confirm-btn" class="interactive" style="
            pointer-events: auto !important;
            flex: 1.5;
            min-width: 0;
            padding: 9px 0;
            border-radius: 6px;
            font-size: clamp(11px, 2.6vw, 13px);
            font-weight: 900;
            background: #ef4444;
            color: #ffffff;
            border: 1.5px solid #fca5a5;
            box-shadow: 0 4px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
            cursor: pointer;
            touch-action: manipulation;
          ">✓ OK</button>
        </div>
      </div>

      <!-- Mobile & Test Compatible Synchronized Input -->
      <input id="rival-name-input" type="text" maxlength="15" value="${this.currentName}" placeholder="NAME..."
        inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" style="
        pointer-events: auto !important;
        position: absolute;
        opacity: 0.001;
        width: 1px;
        height: 1px;
        font-size: 16px;
        outline: none;
        border: none;
        padding: 0;
        margin: 0;
        pointer-events: none;
      " />
    `;

    backdrop.appendChild(card);
    this.container.appendChild(backdrop);
    this.modalElement = backdrop;

    this.inputElement = card.querySelector('#rival-name-input') as HTMLInputElement;
    if (this.inputElement) {
      this.inputElement.addEventListener('input', () => {
        const next = this.inputElement?.value.toUpperCase().slice(0, NamingModalUI.MAX_NAME_LENGTH) || '';
        this.setName(next);
      });
    }

    // Preset chips
    const presetButtons = card.querySelectorAll('.rival-preset-btn');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const name = target.getAttribute('data-name');
        if (name) {
          BattleAudio.playMenuSound('CONFIRM');
          this.setName(name);
        }
      });
    });

    // Virtual keyboard characters
    const charBtns = card.querySelectorAll('[data-key-char]');
    charBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ch = (btn as HTMLElement).getAttribute('data-key-char') || '';
        this.appendChar(ch);
      });
    });

    // Delete button
    const clearBtn = card.querySelector('#rival-clear-btn') as HTMLButtonElement;
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.backspace();
      });
    }

    // Confirm button
    const confirmBtn = card.querySelector('#rival-confirm-btn') as HTMLButtonElement;
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.confirm();
      });
    }

    // Physical keyboard listener
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirm();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.backspace();
        return;
      }
      if (e.key && e.key.length === 1 && /^[a-zA-Z0-9!?.\- ]$/.test(e.key)) {
        if (document.activeElement !== this.inputElement) {
          e.preventDefault();
          this.appendChar(e.key);
        }
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  private updateSlots(): void {
    if (!this.modalElement) return;
    const slotEls = this.modalElement.querySelectorAll('.rival-slot-char');
    slotEls.forEach((el, idx) => {
      const ch = this.currentName[idx] || '_';
      const isFilled = idx < this.currentName.length;
      (el as HTMLElement).textContent = ch;
      (el as HTMLElement).style.borderBottomColor = isFilled ? '#ef4444' : '#22324F';
      (el as HTMLElement).style.color = isFilled ? '#fef08a' : '#64748b';
    });
  }

  private updatePresetHighlights(): void {
    if (!this.modalElement) return;
    const btns = this.modalElement.querySelectorAll('.rival-preset-btn');
    btns.forEach((btn) => {
      const name = (btn as HTMLElement).getAttribute('data-name');
      const isSelected = name === this.currentName;
      (btn as HTMLElement).style.background = isSelected ? '#ef4444' : '#141E33';
      (btn as HTMLElement).style.color = isSelected ? '#ffffff' : '#e2e8f0';
      (btn as HTMLElement).style.borderColor = isSelected ? '#fca5a5' : '#22324F';
    });
  }
}
