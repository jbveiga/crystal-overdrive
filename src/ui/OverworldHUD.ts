import type { Direction, SpeedMultiplier, RoamerState } from '../types/game';
import { eventBus } from '../core/EventBus';

export interface OverworldHUDOptions {
  onSpeedCycle?: () => SpeedMultiplier;
  onMenuToggle?: () => void;
  onPartyOpen?: () => void;
  onBagOpen?: () => void;
  onMartOpen?: () => void;
  onSaveGame?: () => void;
  onInteract?: () => void;
  onToggleBurnedTower?: () => void;
  isModalOpen?: () => boolean;
}

export class OverworldHUD {
  private container: HTMLElement;
  private speedButton!: HTMLButtonElement;
  private routeBanner!: HTMLDivElement;
  private roamerAlertBanner!: HTMLDivElement;
  private toastBanner!: HTMLDivElement;
  private toastTimeout?: ReturnType<typeof setTimeout>;
  private dialogueBox!: HTMLDivElement;
  private dialogueSpeaker!: HTMLDivElement;
  private dialogueText!: HTMLDivElement;
  private dialoguePrompt!: HTMLDivElement;
  private dialoguePages: string[] = [];
  private dialoguePageIndex: number = 0;
  private dialogueCharIndex: number = 0;
  private dialogueTypeTimer?: ReturnType<typeof setInterval>;
  private dialogueOnComplete?: () => void;
  private dialogueActive: boolean = false;
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

  public isVisible(): boolean {
    return this.rootElement?.style.display !== 'none';
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

          <div style="display: flex; gap: 8px; align-items: center; pointer-events: auto; flex-wrap: wrap;">
            <button id="start-menu-btn" style="
              background: #0f172a;
              color: #facc15;
              border: 2px solid #facc15;
              border-radius: 6px;
              padding: 7px 12px;
              font-size: 13px;
              font-weight: 800;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            ">
              ☰ MENU (M / Esc)
            </button>
            <button id="party-btn" style="
              background: #16a34a;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);
            ">
              🟢 PARTY
            </button>
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
            <button id="mart-btn" style="
              background: #7c3aed;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
            ">
              🏪 MART
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
          background: rgba(15, 23, 42, 0.96);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 24px;
          color: white;
          width: 400px;
          max-width: 92vw;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
          pointer-events: auto;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #2dd4bf;">📻 POKÉGEAR ROAMER RADAR</h3>
            <button id="close-pokegear-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
          </div>
          <div id="roamer-status-list" style="display: flex; flex-direction: column; gap: 12px;"></div>
        </div>

        <!-- Center Notifications Container -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
          <!-- Roamer Alert Banner -->
          <div id="roamer-alert-banner" style="
            display: none;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.92), rgba(185, 28, 28, 0.92));
            border: 1px solid #fca5a5;
            border-radius: 8px;
            padding: 10px 20px;
            color: white;
            font-weight: 700;
            font-size: 15px;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5);
          ">
            ⚡ A powerful aura is present on this route!
          </div>

          <!-- Interactive Building / Event Toast Banner -->
          <div id="overworld-toast-banner" style="
            display: none;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid #38bdf8;
            border-radius: 8px;
            padding: 10px 20px;
            color: #f8fafc;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          "></div>
        </div>

        <!-- Bottom Area: Classic Dialogue Box + Help Bar -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%;">
          <!-- Classic Pokémon Dialogue Box -->
          <div id="dialogue-box" style="
            display: none;
            width: min(680px, 94vw);
            background: linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(10, 15, 29, 0.99) 100%);
            border: 3px solid #f8fafc;
            outline: 3px solid #1e293b;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), inset 0 0 0 2px #38bdf8;
            border-radius: 10px;
            padding: 16px 22px;
            color: #f8fafc;
            pointer-events: auto;
            cursor: pointer;
            user-select: none;
            position: relative;
          ">
            <div id="dialogue-speaker" style="
              display: none;
              background: #0284c7;
              border: 2px solid #f8fafc;
              color: #ffffff;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.6px;
              padding: 3px 10px;
              border-radius: 6px;
              width: fit-content;
              margin-bottom: 8px;
              text-transform: uppercase;
            "></div>
            <div id="dialogue-text" style="
              font-size: 17px;
              font-weight: 600;
              line-height: 1.5;
              min-height: 52px;
              color: #f8fafc;
              letter-spacing: 0.2px;
              white-space: pre-wrap;
            "></div>
            <div id="dialogue-prompt" style="
              display: flex;
              justify-content: flex-end;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              font-weight: 800;
              color: #38bdf8;
              margin-top: 6px;
            ">
              <span>SPACE / CLICK</span>
              <span style="font-size: 14px;">▼</span>
            </div>
          </div>

          <!-- Bottom Controls / Help info -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          ">
            <div style="
              background: rgba(18, 22, 28, 0.8);
              backdrop-filter: blur(4px);
              border-radius: 6px;
              padding: 6px 12px;
              font-size: 12px;
              color: #94a3b8;
            ">
              Move: <strong>WASD / Arrows</strong> | Talk / Read Signs: <strong>Space / Enter / Z</strong> | Speed: <strong>Shift</strong>
            </div>

            <button id="interact-btn" style="
              pointer-events: auto;
              background: #0284c7;
              color: #ffffff;
              border: 1px solid rgba(255, 255, 255, 0.25);
              border-radius: 6px;
              padding: 7px 14px;
              font-size: 13px;
              font-weight: 800;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(2, 132, 199, 0.45);
            ">
              💬 TALK / READ (Space)
            </button>
          </div>
        </div>
    `;

    this.container.appendChild(this.rootElement);

    this.speedButton = this.rootElement.querySelector('#speed-toggle-btn') as HTMLButtonElement;
    this.routeBanner = this.rootElement.querySelector('#route-banner') as HTMLDivElement;
    this.roamerAlertBanner = this.rootElement.querySelector('#roamer-alert-banner') as HTMLDivElement;
    this.toastBanner = this.rootElement.querySelector('#overworld-toast-banner') as HTMLDivElement;
    this.dialogueBox = this.rootElement.querySelector('#dialogue-box') as HTMLDivElement;
    this.dialogueSpeaker = this.rootElement.querySelector('#dialogue-speaker') as HTMLDivElement;
    this.dialogueText = this.rootElement.querySelector('#dialogue-text') as HTMLDivElement;
    this.dialoguePrompt = this.rootElement.querySelector('#dialogue-prompt') as HTMLDivElement;

    const startMenuBtn = this.rootElement.querySelector('#start-menu-btn') as HTMLButtonElement;
    const partyBtn = this.rootElement.querySelector('#party-btn') as HTMLButtonElement;
    const bagBtn = this.rootElement.querySelector('#bag-btn') as HTMLButtonElement;
    const martBtn = this.rootElement.querySelector('#mart-btn') as HTMLButtonElement;
    const saveBtn = this.rootElement.querySelector('#save-btn') as HTMLButtonElement;
    const pokegearBtn = this.rootElement.querySelector('#pokegear-btn') as HTMLButtonElement;
    const interactBtn = this.rootElement.querySelector('#interact-btn') as HTMLButtonElement;
    const pokegearModal = this.rootElement.querySelector('#pokegear-modal') as HTMLDivElement;
    const closePokegearBtn = this.rootElement.querySelector('#close-pokegear-btn') as HTMLButtonElement;
    const roamerStatusList = this.rootElement.querySelector('#roamer-status-list') as HTMLDivElement;

    startMenuBtn.addEventListener('click', () => {
      if (this.options.onMenuToggle) this.options.onMenuToggle();
    });

    partyBtn.addEventListener('click', () => {
      if (this.options.onPartyOpen) this.options.onPartyOpen();
    });

    this.dialogueBox.addEventListener('click', () => {
      this.advanceDialogue();
    });

    interactBtn.addEventListener('click', () => {
      if (this.dialogueActive) {
        this.advanceDialogue();
      } else if (this.options.onInteract) {
        this.options.onInteract();
      }
    });

    bagBtn.addEventListener('click', () => {
      if (this.options.onBagOpen) this.options.onBagOpen();
    });

    martBtn.addEventListener('click', () => {
      if (this.options.onMartOpen) this.options.onMartOpen();
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

  public isDialogueOpen(): boolean {
    return this.dialogueActive;
  }

  public openDialogue(pages: string[], speaker?: string, onComplete?: () => void): void {
    if (!pages || pages.length === 0) return;
    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);

    this.dialoguePages = pages;
    this.dialoguePageIndex = 0;
    this.dialogueOnComplete = onComplete;
    this.dialogueActive = true;
    this.activeDirection = null;

    if (speaker) {
      this.dialogueSpeaker.innerText = speaker;
      this.dialogueSpeaker.style.display = 'block';
    } else {
      this.dialogueSpeaker.style.display = 'none';
    }

    this.dialogueBox.style.display = 'block';
    this.startPageTypewriter();
  }

  private startPageTypewriter(): void {
    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
    const fullText = this.dialoguePages[this.dialoguePageIndex] || '';
    this.dialogueCharIndex = 0;
    this.dialogueText.innerText = '';
    const pageLabel =
      this.dialoguePages.length > 1 ? `(${this.dialoguePageIndex + 1}/${this.dialoguePages.length}) ` : '';
    this.dialoguePrompt.style.opacity = '0.4';

    this.dialogueTypeTimer = setInterval(() => {
      this.dialogueCharIndex++;
      this.dialogueText.innerText = fullText.slice(0, this.dialogueCharIndex);
      if (this.dialogueCharIndex >= fullText.length) {
        if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
        this.dialogueTypeTimer = undefined;
        this.dialoguePrompt.innerHTML = `<span>${pageLabel}SPACE / CLICK</span><span style="font-size: 14px;">▼</span>`;
        this.dialoguePrompt.style.opacity = '1';
      }
    }, 18);
  }

  public advanceDialogue(): void {
    if (!this.dialogueActive) return;

    const currentFullText = this.dialoguePages[this.dialoguePageIndex] || '';
    // If typewriter is still revealing characters, complete the current page immediately
    if (this.dialogueCharIndex < currentFullText.length) {
      if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
      this.dialogueTypeTimer = undefined;
      this.dialogueCharIndex = currentFullText.length;
      this.dialogueText.innerText = currentFullText;
      const pageLabel =
        this.dialoguePages.length > 1 ? `(${this.dialoguePageIndex + 1}/${this.dialoguePages.length}) ` : '';
      this.dialoguePrompt.innerHTML = `<span>${pageLabel}SPACE / CLICK</span><span style="font-size: 14px;">▼</span>`;
      this.dialoguePrompt.style.opacity = '1';
      return;
    }

    // Move to next page if available
    if (this.dialoguePageIndex + 1 < this.dialoguePages.length) {
      this.dialoguePageIndex++;
      this.startPageTypewriter();
      return;
    }

    // Otherwise close dialogue box
    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
    this.dialogueTypeTimer = undefined;
    this.dialogueActive = false;
    this.dialogueBox.style.display = 'none';
    this.computeActiveDirection();

    if (this.dialogueOnComplete) {
      const cb = this.dialogueOnComplete;
      this.dialogueOnComplete = undefined;
      cb();
    }
  }

  public showToast(message: string, durationMs: number = 3200): void {
    if (!this.toastBanner) return;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastBanner.innerText = message;
    this.toastBanner.style.display = 'block';
    this.toastTimeout = setTimeout(() => {
      this.toastBanner.style.display = 'none';
    }, durationMs);
  }

  public updatePokegear(roamers: RoamerState[], listElement?: HTMLDivElement): void {
    const list = listElement || (this.container.querySelector('#roamer-status-list') as HTMLDivElement);
    if (!list) return;

    list.innerHTML = '';
    const anyAwakened = roamers.some((r) => r.isAwakened);

    const storyBanner = document.createElement('div');
    storyBanner.style.cssText = `
      background: ${anyAwakened ? 'rgba(37, 99, 235, 0.18)' : 'rgba(71, 85, 105, 0.35)'};
      border: 1px solid ${anyAwakened ? 'rgba(56, 189, 248, 0.35)' : 'rgba(148, 163, 184, 0.25)'};
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.45;
      color: #cbd5e1;
    `;
    storyBanner.innerHTML = anyAwakened
      ? `⚡ <strong>Burned Tower Event Active:</strong> Raikou, Entei & Suicune have awakened and are roaming Johto routes!`
      : `📜 <strong>Story Status (Pre-Ecruteak):</strong> The Legendary Beasts are slumbering inside Ecruteak City's <strong>Burned Tower</strong> and will not appear in the wild until awakened.`;
    list.appendChild(storyBanner);

    for (const r of roamers) {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #1e293b;
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        opacity: ${r.isAwakened ? '1' : '0.72'};
      `;

      const formattedName = r.speciesId.toUpperCase();
      const formattedRoute = r.isAwakened
        ? r.currentMapId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        : 'Burned Tower (Ecruteak City)';

      let statusBadge = `<span style="background: #2563eb; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ROAMING</span>`;
      if (!r.isAwakened) {
        statusBadge = `<span style="background: #475569; color: #cbd5e1; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">SLUMBERING</span>`;
      } else if (r.isCaught) {
        statusBadge = `<span style="background: #16a34a; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CAUGHT</span>`;
      } else if (r.isDefeated) {
        statusBadge = `<span style="background: #dc2626; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">DEFEATED</span>`;
      }

      const hpPct = Math.max(0, Math.min(100, (r.pokemon.currentHp / r.pokemon.stats.hp) * 100));
      const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';
      const condBadge =
        r.pokemon.status && r.pokemon.status !== 'NONE'
          ? `<span style="background: #eab308; color: #0f172a; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">${r.pokemon.status}</span>`
          : '';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 14px; color: #f8fafc;">
              <span>⚡ ${formattedName} (Lv. ${r.pokemon.level})</span>
              ${condBadge}
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">📍 ${formattedRoute}</div>
          </div>
          <div>${statusBadge}</div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-bottom: 3px; font-weight: 600;">
            <span>PERSISTENT HP</span>
            <span>${r.pokemon.currentHp} / ${r.pokemon.stats.hp}</span>
          </div>
          <div style="width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden;">
            <div style="width: ${hpPct}%; height: 100%; background: ${hpColor};"></div>
          </div>
        </div>
      `;

      list.appendChild(card);
    }

    if (this.options.onToggleBurnedTower) {
      const toggleBtn = document.createElement('button');
      toggleBtn.style.cssText = `
        margin-top: 4px;
        background: ${anyAwakened ? '#334155' : '#b45309'};
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      `;
      toggleBtn.innerText = anyAwakened
        ? '💤 Return Beasts to Burned Tower (Pre-Story State)'
        : '🔥 Awaken Beasts (Burned Tower Story Event)';
      toggleBtn.addEventListener('click', () => {
        if (this.options.onToggleBurnedTower) this.options.onToggleBurnedTower();
      });
      list.appendChild(toggleBtn);
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

  public openPokegear(): void {
    const pokegearModal = this.rootElement.querySelector('#pokegear-modal') as HTMLDivElement;
    if (pokegearModal) {
      pokegearModal.style.display = 'block';
    }
  }

  public isPokegearOpen(): boolean {
    const pokegearModal = this.rootElement?.querySelector('#pokegear-modal') as HTMLDivElement | null;
    return pokegearModal?.style.display === 'block';
  }

  public getHeldDirection(): Direction | null {
    if (this.dialogueActive || this.options.isModalOpen?.() || this.isPokegearOpen()) return null;
    return this.activeDirection;
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        if (!e.repeat && this.isVisible() && this.options.onSpeedCycle) {
          const nextSpeed = this.options.onSpeedCycle();
          this.updateSpeedDisplay(nextSpeed);
        }
        return;
      }

      if ((e.code === 'Escape' || e.code === 'KeyM') && !e.repeat && this.isVisible() && !this.dialogueActive) {
        if (this.isPokegearOpen()) {
          const pokegearModal = this.rootElement.querySelector('#pokegear-modal') as HTMLDivElement;
          pokegearModal.style.display = 'none';
          return;
        }
        if (this.options.onMenuToggle) {
          e.preventDefault();
          this.options.onMenuToggle();
          return;
        }
      }

      if (this.options.isModalOpen?.()) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'KeyE') {
        if (!e.repeat && this.isVisible()) {
          e.preventDefault();
          if (this.dialogueActive) {
            this.advanceDialogue();
          } else if (this.options.onInteract) {
            this.options.onInteract();
          }
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

    window.addEventListener('blur', () => {
      this.heldKeys.clear();
      this.activeDirection = null;
    });
  }

  private computeActiveDirection(): void {
    if (this.dialogueActive) {
      this.activeDirection = null;
      return;
    }
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
