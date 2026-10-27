/**
 * @fileoverview KurtCraftingModalUI domain module implementation.
 * @module ui/KurtCraftingModalUI
 * @role KurtCraftingModalUI Component
 * @exports KurtCraftingModalUIOptions, KurtCraftingModalUI
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-227: Implementation | L228-455: Handlers & Exports
 */

/**
 * KurtCraftingModalUI.ts
 * Interactive HTML5/CSS vector modal for Kurt's Apricorn Poké Ball Crafting Workshop.
 * Adheres to Google Stitch screens:
 * - Desktop: 7def97d0c1f1464ca3daaaf54cadca93
 * - Mobile:  b73d76253cec444cb92426a774e8ec9c
 */
import { APRICORN_BALL_MAPPINGS, type ApricornBallMapping } from '../world/KurtCraftingManager';

export interface KurtCraftingModalUIOptions {
  getApricornCount: (apricornId: string) => number;
  onSubmitOrder: (apricornId: string, quantity: number) => void;
  onClose: () => void;
}

export class KurtCraftingModalUI {
  private containerId: string;
  private options: KurtCraftingModalUIOptions;
  private rootElement: HTMLElement | null = null;
  private selectedIndex: number = 0;
  private currentQuantity: number = 1;
  private keyListener: ((e: KeyboardEvent) => void) | null = null;

  private apricornKeys = [
    'red_apricorn',
    'blu_apricorn',
    'ylw_apricorn',
    'grn_apricorn',
    'wht_apricorn',
    'blk_apricorn',
    'pnk_apricorn',
  ];

  constructor(containerId: string, options: KurtCraftingModalUIOptions) {
    this.containerId = containerId;
    this.options = options;
    this.mount();
  }

  public mount(): void {
    const parent = document.getElementById(this.containerId);
    if (!parent) return;

    this.rootElement = document.createElement('div');
    this.rootElement.id = 'kurt-crafting-modal-overlay';
    this.rootElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(7, 11, 20, 0.88);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto !important;
      font-family: 'Space Mono', 'Courier New', monospace;
      color: #F6F8F3;
    `;

    parent.appendChild(this.rootElement);
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    if (!this.rootElement) return;

    const selectedKey = this.apricornKeys[this.selectedIndex];
    const mapping: ApricornBallMapping = APRICORN_BALL_MAPPINGS[selectedKey];
    const inBagCount = this.options.getApricornCount(selectedKey);

    // Clamp current quantity
    if (inBagCount <= 0) {
      this.currentQuantity = 0;
    } else {
      this.currentQuantity = Math.max(1, Math.min(this.currentQuantity, inBagCount));
    }

    const renderApricornSlot = (key: string, idx: number) => {
      const item = APRICORN_BALL_MAPPINGS[key];
      const count = this.options.getApricornCount(key);
      const isSelected = idx === this.selectedIndex;
      const countColor = count > 0 ? '#FFD028' : '#8A9DBF';
      const borderStyle = isSelected ? '3px solid #FFD028' : '1px solid #2A3A5E';
      const bg = isSelected ? '#1B2742' : '#141E33';
      const opacity = count > 0 ? '1.0' : '0.55';

      return `
        <div id="slot-apricorn-${key}" class="apricorn-slot" data-index="${idx}" style="
          background: ${bg};
          border: ${borderStyle};
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          opacity: ${opacity};
          box-shadow: 0 4px 0 0 #070B14;
          transition: transform 0.08s ease;
          pointer-events: auto !important;
        ">
          <div style="
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${item.color};
            border: 2px solid #F6F8F3;
            box-shadow: 0 0 4px ${item.color};
          "></div>
          <div style="flex: 1; display: flex; flex-direction: column;">
            <span style="font-size: 12px; font-weight: 700; color: #F6F8F3;">${item.apricornName}</span>
            <span style="font-size: 10px; color: #8A9DBF;">→ ${item.ballName}</span>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: ${countColor}; background: #0D1322; padding: 2px 6px; border-radius: 4px; border: 1px solid #2A3A5E;">
            x${count}
          </span>
        </div>
      `;
    };

    this.rootElement.innerHTML = `
      <style>
        #kurt-crafting-modal-overlay .stepper-btn {
          width: 44px;
          height: 44px;
          background: #141E33;
          border: 1px solid #2A3A5E;
          border-radius: 4px;
          color: #FFD028;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 0 0 #070B14;
          pointer-events: auto !important;
        }
        #kurt-crafting-modal-overlay .stepper-btn:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 0 #070B14;
        }
        #btn-submit-craft {
          flex: 1;
          min-height: 48px;
          background: #FFD028;
          color: #070B14;
          border: 2px solid #FFD028;
          border-radius: 4px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 0 0 #070B14;
          pointer-events: auto !important;
          transition: transform 0.08s ease;
        }
        #btn-submit-craft:disabled {
          background: #2A3A5E !important;
          color: #8A9DBF !important;
          border-color: #2A3A5E !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
        }
        #btn-submit-craft:not(:disabled):active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 0 #070B14;
        }
        #btn-close-craft {
          width: 44px;
          height: 44px;
          background: #141E33;
          border: 1px solid #2A3A5E;
          color: #8A9DBF;
          border-radius: 4px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 3px 0 0 #070B14;
          pointer-events: auto !important;
        }
        @media (max-width: 767px) {
          #kurt-crafting-container {
            width: 100vw !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            padding: 16px !important;
          }
          #kurt-crafting-body {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          #kurt-apricorn-list {
            grid-template-columns: 1fr !important;
          }
        }
      </style>

      <div id="kurt-crafting-container" style="
        background: #0D1322;
        border: 2px solid #2A3A5E;
        border-top: 4px solid #E07A5F;
        border-radius: 8px;
        box-shadow: 0 8px 0 0 #070B14;
        width: min(840px, 94vw);
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        padding: 24px;
        gap: 18px;
        pointer-events: auto !important;
      ">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1B2742; padding-bottom: 12px;">
          <div>
            <div style="font-size: 11px; color: #E07A5F; font-weight: 700; letter-spacing: 0.08em;">
              AZALEA TOWN // KURT'S WORKSHOP
            </div>
            <div style="font-size: 16px; font-weight: 700; margin-top: 2px;">
              CUSTOM APRICORN POKé BALL FORGE
            </div>
          </div>
          <button id="btn-close-craft" type="button" title="Close Workshop">✕</button>
        </div>

        <!-- Body: Left Selection, Right Preview -->
        <div id="kurt-crafting-body" style="display: flex; gap: 18px; flex: 1;">
          <!-- Left: 7 Apricorns List -->
          <div id="kurt-apricorn-list" style="
            flex: 1.1;
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            max-height: 380px;
            overflow-y: auto;
            padding-right: 4px;
          ">
            ${this.apricornKeys.map((key, i) => renderApricornSlot(key, i)).join('')}
          </div>

          <!-- Right: Telemetry & Stepper -->
          <div style="
            flex: 1.2;
            background: #141E33;
            border: 2px solid #2A3A5E;
            border-radius: 6px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            box-shadow: 0 4px 0 0 #070B14;
          ">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="
                width: 64px;
                height: 64px;
                background: #0D1322;
                border: 1px solid #2A3A5E;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <img
                  src="./assets/sprites/items/${mapping.ballId}.png"
                  alt="${mapping.ballName}"
                  style="width: 44px; height: 44px; image-rendering: pixelated;"
                  onerror="this.onerror=null;this.src='./assets/sprites/items/poke-ball.png';"
                />
              </div>
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 700; color: #F6F8F3;">
                  ${mapping.ballName}
                </div>
                <div style="font-size: 11px; color: ${mapping.color}; font-weight: 700; margin-top: 2px;">
                  FORGED FROM ${mapping.apricornName}
                </div>
              </div>
            </div>

            <!-- Description -->
            <div style="
              background: #0D1322;
              border: 1px solid #2A3A5E;
              border-radius: 4px;
              padding: 12px;
              font-size: 12px;
              color: #8A9DBF;
              line-height: 1.5;
            ">
              ${mapping.description}
            </div>

            <!-- Stepper -->
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #2A3A5E; padding-top: 12px;">
              <span style="font-size: 12px; font-weight: 700;">FORGE QUANTITY:</span>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button id="btn-stepper-sub" class="stepper-btn" type="button" ${this.currentQuantity <= 1 ? 'disabled' : ''}>-</button>
                <span id="label-stepper-val" style="font-size: 16px; font-weight: 700; min-width: 36px; text-align: center; color: #FFD028;">
                  ${this.currentQuantity}
                </span>
                <button id="btn-stepper-add" class="stepper-btn" type="button" ${this.currentQuantity >= inBagCount ? 'disabled' : ''}>+</button>
              </div>
            </div>

            <!-- Action -->
            <button id="btn-submit-craft" type="button" ${this.currentQuantity <= 0 ? 'disabled' : ''}>
              🔨 FORGE ${this.currentQuantity}x ${mapping.ballName}
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachDomHandlers();
  }

  private attachDomHandlers(): void {
    if (!this.rootElement) return;

    // Apricorn slot clicks
    const slots = this.rootElement.querySelectorAll('.apricorn-slot');
    slots.forEach((slot) => {
      (slot as HTMLElement).onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(slot.getAttribute('data-index') || '0', 10);
        this.selectedIndex = idx;
        this.currentQuantity = 1;
        this.render();
      };
    });

    // Close button
    const btnClose = this.rootElement.querySelector('#btn-close-craft') as HTMLElement | null;
    if (btnClose) {
      btnClose.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.destroy();
        this.options.onClose();
      };
    }

    // Stepper buttons
    const btnSub = this.rootElement.querySelector('#btn-stepper-sub') as HTMLElement | null;
    const btnAdd = this.rootElement.querySelector('#btn-stepper-add') as HTMLElement | null;
    if (btnSub) {
      btnSub.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentQuantity > 1) {
          this.currentQuantity--;
          this.render();
        }
      };
    }
    if (btnAdd) {
      btnAdd.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const selectedKey = this.apricornKeys[this.selectedIndex];
        const inBag = this.options.getApricornCount(selectedKey);
        if (this.currentQuantity < inBag) {
          this.currentQuantity++;
          this.render();
        }
      };
    }

    // Submit order button
    const btnSubmit = this.rootElement.querySelector('#btn-submit-craft') as HTMLButtonElement | null;
    if (btnSubmit) {
      btnSubmit.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentQuantity > 0) {
          const selectedKey = this.apricornKeys[this.selectedIndex];
          const qty = this.currentQuantity;
          this.destroy();
          this.options.onSubmitOrder(selectedKey, qty);
        }
      };
    }
  }

  private attachEventListeners(): void {
    this.keyListener = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        if (this.selectedIndex > 0) {
          this.selectedIndex--;
          this.currentQuantity = 1;
          this.render();
        }
      } else if (e.key === 'ArrowDown') {
        if (this.selectedIndex < this.apricornKeys.length - 1) {
          this.selectedIndex++;
          this.currentQuantity = 1;
          this.render();
        }
      } else if (e.key === '-' || e.key === 'ArrowLeft') {
        if (this.currentQuantity > 1) {
          this.currentQuantity--;
          this.render();
        }
      } else if (e.key === '+' || e.key === '=' || e.key === 'ArrowRight') {
        const selectedKey = this.apricornKeys[this.selectedIndex];
        const inBag = this.options.getApricornCount(selectedKey);
        if (this.currentQuantity < inBag) {
          this.currentQuantity++;
          this.render();
        }
      } else if (e.key === 'Enter') {
        if (this.currentQuantity > 0) {
          const selectedKey = this.apricornKeys[this.selectedIndex];
          const qty = this.currentQuantity;
          this.destroy();
          this.options.onSubmitOrder(selectedKey, qty);
        }
      } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        this.destroy();
        this.options.onClose();
      }
    };

    window.addEventListener('keydown', this.keyListener);
  }

  public destroy(): void {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
      this.rootElement = null;
    }
  }
}
