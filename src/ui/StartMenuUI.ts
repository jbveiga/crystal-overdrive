import type { SpeedMultiplier } from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';

export interface StartMenuStateProvider {
  getTrainerName: () => string;
  getMoney: () => number;
  getBadges: () => string[];
  getPartyCount: () => number;
  getCaughtCount: () => number;
  getPlayTimeSeconds: () => number;
  getMapName: () => string;
}

export interface StartMenuCallbacks {
  onOpenParty: () => void;
  onOpenBag: () => void;
  onOpenPokegear: () => void;
  onSaveGame: () => Promise<void>;
}

const JOHTO_BADGES = [
  { name: 'Zephyr', leader: 'Falkner', icon: '🪽' },
  { name: 'Hive', leader: 'Bugsy', icon: '🐞' },
  { name: 'Plain', leader: 'Whitney', icon: '🩷' },
  { name: 'Fog', leader: 'Morty', icon: '👻' },
  { name: 'Storm', leader: 'Chuck', icon: '👊' },
  { name: 'Mineral', leader: 'Jasmine', icon: '⚙️' },
  { name: 'Glacier', leader: 'Pryce', icon: '❄️' },
  { name: 'Rising', leader: 'Clair', icon: '🐉' },
];

export class StartMenuUI {
  private container: HTMLElement;
  private menuPanel!: HTMLDivElement;
  private trainerCardModal!: HTMLDivElement;
  private saveConfirmModal!: HTMLDivElement;
  private stateProvider: StartMenuStateProvider;
  private callbacks: StartMenuCallbacks;
  private cursorIndex: number = 0;
  private speedMultiplier: SpeedMultiplier = 1;
  private menuItems: Array<{ id: string; label: string; icon: string; action: () => void }> = [];

  constructor(
    containerId: string = 'modal-container',
    stateProvider: StartMenuStateProvider,
    callbacks: StartMenuCallbacks
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`UI Container #${containerId} not found`);
    this.container = el;
    this.stateProvider = stateProvider;
    this.callbacks = callbacks;

    this.menuItems = [
      {
        id: 'start-opt-pokemon',
        label: 'POKéMON',
        icon: '🟢',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenParty();
        },
      },
      {
        id: 'start-opt-bag',
        label: 'BAG',
        icon: '🎒',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenBag();
        },
      },
      {
        id: 'start-opt-pokegear',
        label: 'POKéGEAR',
        icon: '📻',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenPokegear();
        },
      },
      {
        id: 'start-opt-trainer',
        label: 'BERNARDO',
        icon: '🪪',
        action: () => {
          this.openTrainerCard();
        },
      },
      {
        id: 'start-opt-save',
        label: 'SAVE',
        icon: '💾',
        action: () => {
          this.openSaveConfirm();
        },
      },
      {
        id: 'start-opt-cancel',
        label: 'CANCEL',
        icon: '✕',
        action: () => {
          BattleAudio.playMenuSound('CANCEL');
          this.closeAll();
        },
      },
    ];

    this.createUI();
  }

  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    const dur = (0.16 / this.speedMultiplier).toFixed(2);
    if (this.menuPanel) this.menuPanel.style.transition = `opacity ${dur}s ease, transform ${dur}s ease`;
  }

  public isOpen(): boolean {
    return (
      this.menuPanel?.style.display === 'flex' ||
      this.trainerCardModal?.style.display === 'flex' ||
      this.saveConfirmModal?.style.display === 'flex'
    );
  }

  public toggle(): void {
    if (this.isOpen()) {
      BattleAudio.playMenuSound('CANCEL');
      this.closeAll();
    } else {
      this.open();
    }
  }

  public open(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.trainerCardModal.style.display = 'none';
    this.saveConfirmModal.style.display = 'none';
    this.menuPanel.style.display = 'flex';
    this.renderMenuItems();
  }

  private hideMenuOnly(): void {
    this.menuPanel.style.display = 'none';
  }

  public closeAll(): void {
    this.menuPanel.style.display = 'none';
    this.trainerCardModal.style.display = 'none';
    this.saveConfirmModal.style.display = 'none';
  }

  public handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.isOpen()) return false;

    if (this.trainerCardModal.style.display === 'flex') {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.trainerCardModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

    if (this.saveConfirmModal.style.display === 'flex') {
      if (e.code === 'Escape') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.saveConfirmModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      BattleAudio.playMenuSound('CURSOR');
      this.cursorIndex = (this.cursorIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.renderMenuItems();
      return true;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      BattleAudio.playMenuSound('CURSOR');
      this.cursorIndex = (this.cursorIndex + 1) % this.menuItems.length;
      this.renderMenuItems();
      return true;
    }
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
      e.preventDefault();
      const chosen = this.menuItems[this.cursorIndex];
      if (chosen) chosen.action();
      return true;
    }
    if (e.code === 'Escape' || e.code === 'KeyM') {
      e.preventDefault();
      BattleAudio.playMenuSound('CANCEL');
      this.closeAll();
      return true;
    }

    return true;
  }

  private createUI(): void {
    // 1. Classic Right-Hand Vertical Start Menu Panel
    const panel = document.createElement('div');
    panel.id = 'start-menu-panel';
    panel.style.cssText = `
      position: absolute;
      top: 64px;
      right: 18px;
      width: 220px;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%);
      border: 3px solid #f8fafc;
      outline: 3px solid #1e293b;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8), inset 0 0 0 2px #38bdf8;
      border-radius: 10px;
      padding: 12px;
      display: none;
      flex-direction: column;
      gap: 6px;
      z-index: 60;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
    `;
    this.container.appendChild(panel);
    this.menuPanel = panel;

    // 2. Trainer Card Modal
    const trainerModal = document.createElement('div');
    trainerModal.id = 'trainer-card-modal';
    trainerModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 480px;
      max-width: 94vw;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      border: 3px solid #facc15;
      border-radius: 14px;
      padding: 22px;
      box-shadow: 0 14px 44px rgba(0, 0, 0, 0.88);
      display: none;
      flex-direction: column;
      gap: 16px;
      z-index: 65;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
    `;
    this.container.appendChild(trainerModal);
    this.trainerCardModal = trainerModal;

    // 3. Save Confirmation Modal
    const saveModal = document.createElement('div');
    saveModal.id = 'save-confirm-modal';
    saveModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-width: 92vw;
      background: rgba(15, 23, 42, 0.98);
      border: 3px solid #f8fafc;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85), inset 0 0 0 2px #38bdf8;
      border-radius: 12px;
      padding: 20px;
      display: none;
      flex-direction: column;
      gap: 14px;
      z-index: 65;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
    `;
    this.container.appendChild(saveModal);
    this.saveConfirmModal = saveModal;
  }

  private renderMenuItems(): void {
    this.menuPanel.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText = `
      font-size: 11px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.8px;
      padding: 2px 6px 6px 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.14);
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
    `;
    header.innerHTML = `<span>START MENU</span><span style="color: #94a3b8;">ESC</span>`;
    this.menuPanel.appendChild(header);

    this.menuItems.forEach((item, idx) => {
      const isSelected = idx === this.cursorIndex;
      const btn = document.createElement('button');
      btn.id = item.id;
      btn.style.cssText = `
        background: ${isSelected ? '#1e3a8a' : 'transparent'};
        color: ${isSelected ? '#ffffff' : '#e2e8f0'};
        border: 1px solid ${isSelected ? '#38bdf8' : 'transparent'};
        border-radius: 6px;
        padding: 9px 10px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        text-align: left;
      `;
      btn.innerHTML = `
        <span style="color: ${isSelected ? '#facc15' : 'transparent'}; font-size: 12px;">▶</span>
        <span>${item.icon}</span>
        <span>${item.label}</span>
      `;

      btn.addEventListener('mouseenter', () => {
        if (this.cursorIndex !== idx) {
          this.cursorIndex = idx;
          this.renderMenuItems();
        }
      });

      btn.addEventListener('click', () => {
        this.cursorIndex = idx;
        item.action();
      });

      this.menuPanel.appendChild(btn);
    });
  }

  private formatPlayTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  public openTrainerCard(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.menuPanel.style.display = 'none';
    this.trainerCardModal.style.display = 'flex';

    const name = this.stateProvider.getTrainerName();
    const money = this.stateProvider.getMoney();
    const badges = this.stateProvider.getBadges();
    const partyCount = this.stateProvider.getPartyCount();
    const caughtCount = this.stateProvider.getCaughtCount();
    const playTime = this.formatPlayTime(this.stateProvider.getPlayTimeSeconds());

    const badgesHtml = JOHTO_BADGES.map((b, i) => {
      const earned = i < badges.length;
      return `
        <div style="
          background: ${earned ? 'rgba(250, 204, 21, 0.18)' : 'rgba(15, 23, 42, 0.65)'};
          border: 1.5px solid ${earned ? '#facc15' : 'rgba(255, 255, 255, 0.12)'};
          border-radius: 8px;
          padding: 6px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          opacity: ${earned ? '1' : '0.45'};
        ">
          <span style="font-size: 16px;">${earned ? b.icon : '🔒'}</span>
          <span style="font-size: 9px; font-weight: 800; color: ${earned ? '#fef08a' : '#94a3b8'};">${b.name.toUpperCase()}</span>
        </div>
      `;
    }).join('');

    this.trainerCardModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(250, 204, 21, 0.4); padding-bottom: 10px;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #facc15; letter-spacing: 1px;">JOHTO LEAGUE TRAINER CARD</div>
          <h2 style="margin: 2px 0 0 0; font-size: 20px; font-weight: 900; color: #ffffff;">🪪 ${name}</h2>
        </div>
        <span style="background: rgba(15, 23, 42, 0.8); border: 1px solid #38bdf8; color: #38bdf8; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">IDNo. 25199</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="background: rgba(15, 23, 42, 0.72); border-radius: 8px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.12);">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">MONEY</div>
          <div style="font-size: 16px; font-weight: 800; color: #fbbf24; margin-top: 2px;">$${money.toLocaleString()}</div>
        </div>
        <div style="background: rgba(15, 23, 42, 0.72); border-radius: 8px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.12);">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">PLAY TIME</div>
          <div style="font-size: 16px; font-weight: 800; color: #38bdf8; margin-top: 2px;">⏱️ ${playTime}</div>
        </div>
        <div style="background: rgba(15, 23, 42, 0.72); border-radius: 8px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.12);">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">POKéDEX OWNED</div>
          <div style="font-size: 16px; font-weight: 800; color: #4ade80; margin-top: 2px;">📕 ${caughtCount} Species</div>
        </div>
        <div style="background: rgba(15, 23, 42, 0.72); border-radius: 8px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.12);">
          <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">ACTIVE PARTY</div>
          <div style="font-size: 16px; font-weight: 800; color: #f8fafc; margin-top: 2px;">🟢 ${partyCount} / 6</div>
        </div>
      </div>

      <div>
        <div style="font-size: 11px; font-weight: 800; color: #facc15; margin-bottom: 6px; letter-spacing: 0.5px;">
          🏅 JOHTO GYM BADGES (${badges.length} / 8)
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          ${badgesHtml}
        </div>
      </div>

      <button id="close-trainer-card-btn" style="
        background: #334155;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 10px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      ">← BACK TO MENU</button>
    `;

    this.trainerCardModal.querySelector('#close-trainer-card-btn')!.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.trainerCardModal.style.display = 'none';
      this.menuPanel.style.display = 'flex';
    });
  }

  public openSaveConfirm(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.menuPanel.style.display = 'none';
    this.saveConfirmModal.style.display = 'flex';

    const name = this.stateProvider.getTrainerName();
    const mapName = this.stateProvider.getMapName();
    const badgesCount = this.stateProvider.getBadges().length;
    const playTime = this.formatPlayTime(this.stateProvider.getPlayTimeSeconds());

    this.saveConfirmModal.innerHTML = `
      <div style="font-size: 13px; font-weight: 800; color: #38bdf8; letter-spacing: 0.6px;">💾 SAVE PROGRESS</div>
      <div style="background: #1e293b; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 5px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">PLAYER:</span><strong>${name}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">LOCATION:</span><strong>${mapName}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">BADGES:</span><strong>${badgesCount}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">TIME:</span><strong>${playTime}</strong></div>
      </div>
      <div id="save-confirm-status" style="font-size: 15px; font-weight: 700; color: #f8fafc;">
        Would you like to save the game?
      </div>
      <div id="save-confirm-buttons" style="display: flex; gap: 10px;">
        <button id="confirm-save-yes-btn" style="
          flex: 1;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">YES, SAVE</button>
        <button id="confirm-save-no-btn" style="
          flex: 1;
          background: #475569;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">NO</button>
      </div>
    `;

    const yesBtn = this.saveConfirmModal.querySelector('#confirm-save-yes-btn') as HTMLButtonElement;
    const noBtn = this.saveConfirmModal.querySelector('#confirm-save-no-btn') as HTMLButtonElement;
    const statusText = this.saveConfirmModal.querySelector('#save-confirm-status') as HTMLDivElement;
    const btnsRow = this.saveConfirmModal.querySelector('#save-confirm-buttons') as HTMLDivElement;

    yesBtn.addEventListener('click', async () => {
      btnsRow.style.display = 'none';
      statusText.style.color = '#38bdf8';
      statusText.innerText = "SAVING... DON'T TURN OFF THE POWER.";
      await this.callbacks.onSaveGame();
      BattleAudio.playMenuSound('SAVE');
      statusText.style.color = '#4ade80';
      statusText.innerText = `💾 ${name} saved the game!`;
      const closeDelay = 850 / this.speedMultiplier;
      setTimeout(() => {
        this.closeAll();
      }, closeDelay);
    });

    noBtn.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.saveConfirmModal.style.display = 'none';
      this.menuPanel.style.display = 'flex';
    });
  }
}
