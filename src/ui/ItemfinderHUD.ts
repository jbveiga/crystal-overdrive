import type { RadarPing } from '../types/game';

/**
 * Pokémon Unbound-Style Live Itemfinder Compass HUD Capsule.
 * Renders a top-right floating radar pill with a rotating directional needle,
 * tile distance readout, and golden lock-on pulse when facing a buried item.
 */
export class ItemfinderHUD {
  private container: HTMLElement;
  private capsuleElement!: HTMLDivElement;
  private dialElement!: HTMLDivElement;
  private needleElement!: HTMLDivElement;
  private statusLabelElement!: HTMLDivElement;
  private subLabelElement!: HTMLDivElement;
  private active: boolean = false;
  private suspended: boolean = false;
  private lastPing: RadarPing | null = null;

  constructor(containerId: string = 'overworld-hud-container') {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`ItemfinderHUD container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.createUI();
  }

  private createUI(): void {
    this.capsuleElement = document.createElement('div');
    this.capsuleElement.id = 'itemfinder-hud-capsule';
    this.capsuleElement.style.cssText = `
      display: none;
      position: fixed;
      top: calc(56px + env(safe-area-inset-top, 0px));
      right: max(14px, env(safe-area-inset-right, 14px));
      min-width: 156px;
      height: 46px;
      background: #0D1322;
      backdrop-filter: blur(10px);
      border: 2px solid #38bdf8;
      border-radius: 10px;
      padding: 4px 14px 4px 8px;
      box-shadow: 0 4px 0 0 #070B14, 0 8px 20px rgba(0, 0, 0, 0.75);
      align-items: center;
      gap: 10px;
      z-index: 40;
      pointer-events: none;
      font-family: 'Space Mono', monospace;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
      box-sizing: border-box;
    `;

    this.capsuleElement.innerHTML = `
      <div id="itemfinder-compass-dial" style="
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #080E1D;
        border: 1.5px solid #38bdf8;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        flex-shrink: 0;
        box-shadow: inset 0 0 6px rgba(56, 189, 248, 0.25);
      ">
        <div id="itemfinder-compass-needle" style="
          font-size: 15px;
          font-weight: 900;
          color: #38bdf8;
          line-height: 1;
          transform: rotate(0deg);
          transition: transform 0.16s ease, color 0.16s ease;
        ">➤</div>
      </div>
      <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.15;">
        <div id="itemfinder-radar-header" style="
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #94a3b8;
          font-family: 'Space Mono', monospace;
        ">📡 DOWSING RADAR</div>
        <div id="itemfinder-distance-label" style="
          font-size: 12px;
          font-weight: 700;
          color: #f8fafc;
          white-space: nowrap;
          font-family: 'Space Mono', monospace;
        ">NO RESPONSE</div>
      </div>
    `;

    this.container.appendChild(this.capsuleElement);
    this.dialElement = this.capsuleElement.querySelector('#itemfinder-compass-dial') as HTMLDivElement;
    this.needleElement = this.capsuleElement.querySelector('#itemfinder-compass-needle') as HTMLDivElement;
    this.subLabelElement = this.capsuleElement.querySelector('#itemfinder-radar-header') as HTMLDivElement;
    this.statusLabelElement = this.capsuleElement.querySelector('#itemfinder-distance-label') as HTMLDivElement;
  }

  public isActive(): boolean {
    return this.active;
  }

  public isSuspended(): boolean {
    return this.suspended;
  }

  public suspend(): void {
    this.suspended = true;
    this.capsuleElement.style.display = 'none';
  }

  public resume(): void {
    this.suspended = false;
    if (this.active) {
      this.capsuleElement.style.display = 'flex';
    }
  }

  public show(): void {
    this.active = true;
    if (!this.suspended) {
      this.capsuleElement.style.display = 'flex';
    }
  }

  public hide(): void {
    this.active = false;
    this.capsuleElement.style.display = 'none';
  }

  public toggle(): boolean {
    if (this.active) {
      this.hide();
    } else {
      this.show();
    }
    return this.active;
  }

  public getLastPing(): RadarPing | null {
    return this.lastPing;
  }

  public update(ping: RadarPing): void {
    this.lastPing = ping;
    if (!this.active || this.suspended) return;

    if (!ping.hasItemInRange || ping.distance === null) {
      this.capsuleElement.style.borderColor = '#475569';
      this.capsuleElement.style.boxShadow = '0 4px 0 0 #070B14, 0 8px 20px rgba(0, 0, 0, 0.75)';
      this.dialElement.style.borderColor = '#475569';
      this.needleElement.style.color = '#475569';
      this.needleElement.style.transform = 'rotate(0deg)';
      this.subLabelElement.innerText = '📡 DOWSING RADAR';
      this.subLabelElement.style.color = '#94a3b8';
      this.statusLabelElement.innerText = 'NO RESPONSE';
      this.statusLabelElement.style.color = '#94a3b8';
      return;
    }

    const tileSteps = Math.max(1, Math.round(ping.distance));
    this.needleElement.style.transform = `rotate(${Math.round(ping.bearingAngleDeg)}deg)`;

    if (ping.isFacingDirectly || ping.proximityBand === 'FACING' || ping.distance <= 1) {
      // Gold lock-on state when right on or facing the buried item
      this.capsuleElement.style.borderColor = '#FFD028';
      this.capsuleElement.style.boxShadow = '0 4px 0 0 #070B14, 0 0 16px rgba(255, 208, 40, 0.55)';
      this.dialElement.style.borderColor = '#FFD028';
      this.needleElement.style.color = '#FFD028';
      this.subLabelElement.innerText = ping.isFacingDirectly ? '✨ LOCKED ON [A]' : '✨ TARGET NEARBY';
      this.subLabelElement.style.color = '#FFD028';
      this.statusLabelElement.innerText = 'RIGHT HERE!';
      this.statusLabelElement.style.color = '#FFD028';
    } else {
      // Active vector lock (2..8 tiles)
      this.capsuleElement.style.borderColor = '#38bdf8';
      this.capsuleElement.style.boxShadow = '0 4px 0 0 #070B14, 0 0 12px rgba(56, 189, 248, 0.35)';
      this.dialElement.style.borderColor = '#38bdf8';
      this.needleElement.style.color = '#38bdf8';
      this.subLabelElement.innerText = `📡 BEARING ${ping.bearing}`;
      this.subLabelElement.style.color = '#38bdf8';
      this.statusLabelElement.innerText = `📍 ${tileSteps} TILE${tileSteps === 1 ? '' : 'S'}`;
      this.statusLabelElement.style.color = '#f8fafc';
    }
  }
}
