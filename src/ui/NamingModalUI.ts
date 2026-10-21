import { BattleAudio } from '../audio/BattleAudio';

export interface NamingModalCallbacks {
  onConfirm: (name: string) => void;
  onCancel?: () => void;
}

export const RIVAL_NAME_PRESETS: readonly string[] = ['SILVER', 'KAZU', 'KAMON', 'RED'];

/**
 * Rival Naming Modal (Ticket SPRINT-13-RIVAL-AND-AZALEA).
 * Centered crimson card with circular portrait, 1-15 character input,
 * quick preset chips, and physical/virtual keyboard support.
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
    this.updatePresetHighlights();
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
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: 'Courier New', Courier, monospace;
      padding: 16px;
    `;

    const card = document.createElement('div');
    card.id = 'rival-naming-card';
    card.className = 'interactive';
    card.style.cssText = `
      pointer-events: auto !important;
      width: 380px;
      max-width: 95vw;
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      min-height: 340px;
      background: #0f172a;
      border: 3px solid #ef4444;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4), inset 0 0 16px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 18px 20px 20px;
      box-sizing: border-box;
      color: #f8fafc;
    `;

    card.innerHTML = `
      <div style="font-size: 13px; font-weight: 900; letter-spacing: 1.5px; color: #f87171; margin-bottom: 12px; text-transform: uppercase;">
        POLICE INVESTIGATION
      </div>
      
      <div id="rival-portrait-frame" style="
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 2px solid #ef4444;
        background: #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-bottom: 12px;
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
      ">
        <img id="rival-portrait-img" src="/assets/sprites/characters/silver.png" alt="Rival" style="
          width: 52px;
          height: 52px;
          object-fit: contain;
          image-rendering: pixelated;
        " onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <div style="display: none; font-size: 32px;">🦹</div>
      </div>

      <div style="font-size: 11px; color: #cbd5e1; text-align: center; margin-bottom: 12px; line-height: 1.3;">
        "What was the name of the red-haired boy who stole the POKéMON?"
      </div>

      <div style="width: 100%; display: flex; gap: 8px; align-items: stretch; margin-bottom: 14px;">
        <input id="rival-name-input" type="text" maxlength="15" value="${this.currentName}" placeholder="NAME..."
          inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" style="
          pointer-events: auto !important;
          flex: 1;
          min-width: 0;
          height: 48px;
          min-height: 44px;
          background: #020617;
          border: 2px solid #ef4444;
          border-radius: 8px;
          padding: 0 12px;
          font-family: inherit;
          font-size: 16px;
          font-weight: 800;
          color: #fef08a;
          letter-spacing: 2px;
          text-transform: uppercase;
          box-sizing: border-box;
          outline: none;
          text-align: center;
          -webkit-user-select: text;
          user-select: text;
          touch-action: manipulation;
        " />
        <button id="rival-clear-btn" type="button" class="interactive" style="
          pointer-events: auto !important;
          height: 48px;
          min-height: 44px;
          min-width: 72px;
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid #475569;
          border-radius: 8px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          touch-action: manipulation;
        ">✕ CLEAR</button>
      </div>

      <div style="font-size: 10px; color: #94a3b8; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">
        PRESET SUGGESTIONS
      </div>
      <div id="rival-preset-container" style="
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: center;
        width: 100%;
        margin-bottom: 18px;
      ">
        ${RIVAL_NAME_PRESETS.map(
          (preset) => `
            <button class="rival-preset-btn interactive" data-name="${preset}" style="
              pointer-events: auto !important;
              background: ${preset === this.currentName ? '#ef4444' : '#1e293b'};
              color: ${preset === this.currentName ? '#ffffff' : '#e2e8f0'};
              border: 1px solid ${preset === this.currentName ? '#fca5a5' : '#475569'};
              border-radius: 6px;
              padding: 6px 12px;
              font-family: inherit;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              letter-spacing: 1px;
              transition: all 0.15s ease;
            ">[ ${preset} ]</button>
          `
        ).join('')}
      </div>

      <div style="display: flex; gap: 10px; width: 100%; margin-top: auto;">
        <button id="rival-confirm-btn" class="interactive" style="
          pointer-events: auto !important;
          flex: 1;
          height: 40px;
          background: #ef4444;
          color: #ffffff;
          border: 2px solid #fca5a5;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: background 0.15s ease;
        ">CONFIRM</button>
      </div>
    `;

    backdrop.appendChild(card);
    this.container.appendChild(backdrop);
    this.modalElement = backdrop;

    this.inputElement = card.querySelector('#rival-name-input') as HTMLInputElement;
    if (this.inputElement) {
      this.inputElement.focus();
      this.inputElement.addEventListener('input', () => {
        this.currentName = this.inputElement?.value.toUpperCase().slice(0, NamingModalUI.MAX_NAME_LENGTH) || '';
        if (this.inputElement) this.inputElement.value = this.currentName;
        this.updatePresetHighlights();
      });
    }

    const presetButtons = card.querySelectorAll('.rival-preset-btn');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const name = target.getAttribute('data-name');
        if (name) {
          BattleAudio.playMenuSound('CONFIRM');
          this.setName(name);
        }
      });
    });

    const clearBtn = card.querySelector('#rival-clear-btn') as HTMLButtonElement;
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.setName('');
        this.inputElement?.focus();
      });
    }

    const confirmBtn = card.querySelector('#rival-confirm-btn') as HTMLButtonElement;
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.confirm();
      });
    }

    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirm();
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  private updatePresetHighlights(): void {
    if (!this.modalElement) return;
    const btns = this.modalElement.querySelectorAll('.rival-preset-btn');
    btns.forEach((btn) => {
      const name = (btn as HTMLElement).getAttribute('data-name');
      const isSelected = name === this.currentName;
      (btn as HTMLElement).style.background = isSelected ? '#ef4444' : '#1e293b';
      (btn as HTMLElement).style.color = isSelected ? '#ffffff' : '#e2e8f0';
      (btn as HTMLElement).style.borderColor = isSelected ? '#fca5a5' : '#475569';
    });
  }
}
