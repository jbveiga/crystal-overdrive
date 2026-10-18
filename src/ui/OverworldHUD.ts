import type { Direction, SpeedMultiplier, RoamerState } from '../types/game';
import { eventBus } from '../core/EventBus';

export interface OverworldHUDOptions {
  onSpeedCycle?: () => SpeedMultiplier;
  onBagOpen?: () => void;
  onSaveGame?: () => void;
}

export class OverworldHUD {
  private container: HTMLElement;
  private speedButton!: HTMLButtonElement;
  private routeBanner!: HTMLDivElement;
  private roamerAlertBanner!: HTMLDivElement;
  private rootElement!: HTMLDivElement;
  private activeDirection: Direction | null = null;
  private heldKeys: Set<string> = new Set();
  private options: OverworldHUDOptions;

  constructor(containerId: string = 'overworld-hud-container', options: OverworldHUDOptions = {}) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.options = options;

    this.createUI();
    this.setupControls();
  }

  public show(): void {
    if (this.rootElement) this.rootElement.style.display = 'flex';
  }

  public hide(): void {
    if (this.rootElement) this.rootElement.style.display = 'none';
  }

  private createUI(): void {
    this.rootElement = document.createElement('div');
    this.rootElement.id = 'hud-root';
    this.rootElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
      padding: 16px;
      box-sizing: border-box;
    `;

    this.rootElement.innerHTML = `
        <!-- Top bar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div id="route-banner" style="
            background: rgba(18, 22, 28, 0.85);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            letter-spacing: 0.5px;
          ">
            New Bark Town
          </div>

          <div style="display: flex; gap: 8px; align-items: center; pointer-events: auto;">
            <button id="bag-btn" style="
              background: #d97706;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
            ">
              🎒 BAG
            </button>
            <button id="save-btn" style="
              background: #059669;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
            ">
              💾 SAVE
            </button>
            <button id="pokegear-btn" style="
              background: #0d9488;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(13, 148, 136, 0.4);
            ">
              📻 POKÉGEAR
            </button>
            <button id="speed-toggle-btn" style="
              background: #2563eb;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              transition: background 0.15s ease, transform 0.1s ease;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
            ">
              SPEED: 1x (Shift)
            </button>
          </div>
        </div>

        <!-- Pokégear Modal -->
        <div id="pokegear-modal" style="
          display: none;
          align-self: center;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 24px;
          color: white;
          width: 360px;
          max-width: 90vw;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
          pointer-events: auto;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #2dd4bf;">📻 POKÉGEAR ROAMER RADAR</h3>
            <button id="close-pokegear-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
          </div>
          <div id="roamer-status-list" style="display: flex; flex-direction: column; gap: 12px;"></div>
        </div>

        <!-- Roamer Alert Banner -->
        <div id="roamer-alert-banner" style="
          display: none;
          align-self: center;
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.9));
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 10px 20px;
          color: white;
          font-weight: 700;
          font-size: 15px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5);
          animation: pulse 1.5s infinite;
        ">
          ⚡ A powerful aura is present on this route!
        </div>

        <!-- Bottom Controls / Help info -->
        <div style="
          background: rgba(18, 22, 28, 0.75);
          backdrop-filter: blur(4px);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          color: #94a3b8;
          align-self: flex-start;
        ">
          Movement: <strong>WASD / Arrow Keys</strong> | Toggle Speed: <strong>Shift / Click</strong>
        </div>
      </div>
    `;

    this.container.appendChild(this.rootElement);

    this.speedButton = this.rootElement.querySelector('#speed-toggle-btn') as HTMLButtonElement;
    this.routeBanner = this.rootElement.querySelector('#route-banner') as HTMLDivElement;
    this.roamerAlertBanner = this.rootElement.querySelector('#roamer-alert-banner') as HTMLDivElement;
    const bagBtn = this.rootElement.querySelector('#bag-btn') as HTMLButtonElement;
    const saveBtn = this.rootElement.querySelector('#save-btn') as HTMLButtonElement;
    const pokegearBtn = this.rootElement.querySelector('#pokegear-btn') as HTMLButtonElement;
    const pokegearModal = this.rootElement.querySelector('#pokegear-modal') as HTMLDivElement;
    const closePokegearBtn = this.rootElement.querySelector('#close-pokegear-btn') as HTMLButtonElement;
    const roamerStatusList = this.rootElement.querySelector('#roamer-status-list') as HTMLDivElement;

    bagBtn.addEventListener('click', () => {
      if (this.options.onBagOpen) this.options.onBagOpen();
    });

    saveBtn.addEventListener('click', () => {
      if (this.options.onSaveGame) {
        this.options.onSaveGame();
        saveBtn.innerText = '✅ SAVED!';
        setTimeout(() => {
          saveBtn.innerText = '💾 SAVE';
        }, 1500);
      }
    });

    pokegearBtn.addEventListener('click', () => {
      pokegearModal.style.display = pokegearModal.style.display === 'none' ? 'block' : 'none';
    });

    closePokegearBtn.addEventListener('click', () => {
      pokegearModal.style.display = 'none';
    });

    this.speedButton.addEventListener('click', () => {
      if (this.options.onSpeedCycle) {
        const nextSpeed = this.options.onSpeedCycle();
        this.updateSpeedDisplay(nextSpeed);
      }
    });

    eventBus.on('roamer:auraAlert', ({ speciesId, mapId }) => {
      this.showRoamerAlert(speciesId, mapId);
    });

    eventBus.on('roamer:updated', ({ roamers }) => {
      this.updatePokegear(roamers, roamerStatusList);
    });
  }

  public updatePokegear(roamers: RoamerState[], listElement?: HTMLDivElement): void {
    const list = listElement || (this.container.querySelector('#roamer-status-list') as HTMLDivElement);
    if (!list) return;

    list.innerHTML = '';
    for (const r of roamers) {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #1e293b;
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
      `;

      const formattedName = r.speciesId.toUpperCase();
      const formattedRoute = r.currentMapId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      let statusBadge = `<span style="background: #2563eb; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ROAMING</span>`;
      if (r.isCaught) {
        statusBadge = `<span style="background: #16a34a; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CAUGHT</span>`;
      } else if (r.isDefeated) {
        statusBadge = `<span style="background: #dc2626; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">DEFEATED</span>`;
      }

      card.innerHTML = `
        <div>
          <div style="font-weight: 700; font-size: 14px; color: #f8fafc;">⚡ ${formattedName} (Lv. 40)</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">📍 ${formattedRoute}</div>
        </div>
        <div>${statusBadge}</div>
      `;

      list.appendChild(card);
    }
  }

  public updateSpeedDisplay(speed: SpeedMultiplier): void {
    if (this.speedButton) {
      this.speedButton.innerText = `SPEED: ${speed}x (Shift)`;
      if (speed === 1) {
        this.speedButton.style.background = '#2563eb';
      } else if (speed === 2) {
        this.speedButton.style.background = '#d97706';
      } else {
        this.speedButton.style.background = '#dc2626';
      }
    }
  }

  public updateRouteName(name: string): void {
    if (this.routeBanner) {
      this.routeBanner.innerText = name;
    }
  }

  public showRoamerAlert(speciesId: string, _mapId: string): void {
    if (this.roamerAlertBanner) {
      const beastName = speciesId.toUpperCase();
      this.roamerAlertBanner.innerText = `⚡ ${beastName} is roaming nearby! A powerful aura is present!`;
      this.roamerAlertBanner.style.display = 'block';
    }
  }

  public hideRoamerAlert(): void {
    if (this.roamerAlertBanner) {
      this.roamerAlertBanner.style.display = 'none';
    }
  }

  public getHeldDirection(): Direction | null {
    return this.activeDirection;
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        if (!e.repeat && this.options.onSpeedCycle) {
          const nextSpeed = this.options.onSpeedCycle();
          this.updateSpeedDisplay(nextSpeed);
        }
        return;
      }

      this.heldKeys.add(e.code);
      this.computeActiveDirection();
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.heldKeys.delete(e.code);
      this.computeActiveDirection();
    });

    // Reset when tab loses focus
    window.addEventListener('blur', () => {
      this.heldKeys.clear();
      this.activeDirection = null;
    });
  }

  private computeActiveDirection(): void {
    // Priority order for snappy responsive movement: newest or current
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) {
      this.activeDirection = 'UP';
    } else if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) {
      this.activeDirection = 'DOWN';
    } else if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) {
      this.activeDirection = 'LEFT';
    } else if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) {
      this.activeDirection = 'RIGHT';
    } else {
      this.activeDirection = null;
    }
  }
}
