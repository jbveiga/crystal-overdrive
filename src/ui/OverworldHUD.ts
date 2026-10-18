import type { Direction, SpeedMultiplier } from '../types/game';
import { eventBus } from '../core/EventBus';

export class OverworldHUD {
  private container: HTMLElement;
  private speedButton!: HTMLButtonElement;
  private routeBanner!: HTMLDivElement;
  private roamerAlertBanner!: HTMLDivElement;
  private activeDirection: Direction | null = null;
  private heldKeys: Set<string> = new Set();
  private onSpeedCycle?: () => SpeedMultiplier;

  constructor(containerId: string = 'ui-overlay', onSpeedCycle?: () => SpeedMultiplier) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.onSpeedCycle = onSpeedCycle;

    this.createUI();
    this.setupControls();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div id="hud-root" style="
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
      ">
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

          <div style="display: flex; gap: 10px; align-items: center; pointer-events: auto;">
            <button id="speed-toggle-btn" style="
              background: #2563eb;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 8px 14px;
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
              transition: background 0.15s ease, transform 0.1s ease;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
            ">
              SPEED: 1x (Shift)
            </button>
          </div>
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

    this.speedButton = this.container.querySelector('#speed-toggle-btn') as HTMLButtonElement;
    this.routeBanner = this.container.querySelector('#route-banner') as HTMLDivElement;
    this.roamerAlertBanner = this.container.querySelector('#roamer-alert-banner') as HTMLDivElement;

    this.speedButton.addEventListener('click', () => {
      if (this.onSpeedCycle) {
        const nextSpeed = this.onSpeedCycle();
        this.updateSpeedDisplay(nextSpeed);
      }
    });

    eventBus.on('roamer:auraAlert', ({ speciesId, mapId }) => {
      this.showRoamerAlert(speciesId, mapId);
    });
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
        if (!e.repeat && this.onSpeedCycle) {
          const nextSpeed = this.onSpeedCycle();
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
