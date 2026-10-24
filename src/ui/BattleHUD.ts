import type { PokemonInstance, SpeedMultiplier, PokeballId, PokemonType, StatId, MoveData } from '../types/game';
import { EffectivenessHelper } from '../battle/EffectivenessHelper';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';

export interface BattleHUDCallbacks {
  onMoveSelected: (moveId: string) => void;
  onBagSelected: (ballId: PokeballId) => void;
  onPokemonSelected?: (pokemon: PokemonInstance) => void;
  onRunSelected: () => void;
  onSpeedToggle: () => SpeedMultiplier;
}

const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: '#94a3b8',
  Fire: '#ef4444',
  Water: '#3b82f6',
  Grass: '#22c55e',
  Electric: '#eab308',
  Ice: '#06b6d4',
  Fighting: '#c2410c',
  Poison: '#a855f7',
  Ground: '#d97706',
  Flying: '#6366f1',
  Psychic: '#ec4899',
  Bug: '#84cc16',
  Rock: '#78716c',
  Ghost: '#6d28d9',
  Dragon: '#4f46e5',
  Steel: '#64748b',
  Dark: '#334155',
};

const STATUS_COLORS: Record<string, string> = {
  PAR: '#eab308',
  SLP: '#64748b',
  FRZ: '#06b6d4',
  BRN: '#ef4444',
  PSN: '#a855f7',
  TOX: '#9333ea',
};

const MOVE_SHORTCUT_LABELS = ['1 / Q', '2 / W', '3 / A', '4 / S'];

export class BattleHUD {
  private container: HTMLElement;
  private rootElement!: HTMLDivElement;
  private messageBox!: HTMLDivElement;
  private actionMenu!: HTMLDivElement;
  private fightMenu!: HTMLDivElement;
  private bagMenu!: HTMLDivElement;
  private partyMenu!: HTMLDivElement;
  private playerHpBar!: HTMLDivElement;
  private enemyHpBar!: HTMLDivElement;
  private playerExpBar!: HTMLDivElement;
  private playerHpText!: HTMLSpanElement;
  private enemyHpText!: HTMLSpanElement;
  private playerPartyDock!: HTMLDivElement;
  private speedButton!: HTMLButtonElement;

  private playerPokemon!: PokemonInstance;
  private enemyPokemon!: PokemonInstance;
  private playerParty: PokemonInstance[] = [];
  private caughtSpeciesIds: Set<string> = new Set();
  private ballsInventory: Partial<Record<PokeballId, number>> = {};
  private callbacks!: BattleHUDCallbacks;
  public static readonly DIALOGUE_CHAR_DELAY_MS = 12;
  public static readonly DIALOGUE_POST_DELAY_MS = 500;

  private speedMultiplier: SpeedMultiplier = 1;
  private isForcedPartySwitch: boolean = false;

  constructor(containerId: string = 'battle-hud-container') {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.injectKeyframeStyles();
    this.createUI();
    this.updateSpeedDisplay(this.speedMultiplier);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateSpeedDisplay(this.speedMultiplier);
      });
    }
    this.setupKeyboardShortcuts();
  }

  private injectKeyframeStyles(): void {
    if (document.getElementById('crystal-battle-hud-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'crystal-battle-hud-styles';
    styleEl.textContent = `
      @keyframes crystalUltraPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(236, 72, 153, 0.75); }
        50% { transform: scale(1.06); box-shadow: 0 0 14px rgba(236, 72, 153, 1); }
      }
      @keyframes crystalLowHpPulse {
        0%, 100% { opacity: 1; filter: brightness(1); }
        50% { opacity: 0.72; filter: brightness(1.35); }
      }
      .crystal-ultra-pill {
        animation: crystalUltraPulse 1.1s infinite ease-in-out;
      }
      .crystal-low-hp {
        animation: crystalLowHpPulse 0.85s infinite ease-in-out;
      }
      @media (hover: none) and (pointer: coarse), (max-width: 768px) {
        .keyboard-hint {
          display: none !important;
        }
      }
      body.touch-controls-active .keyboard-hint {
        display: none !important;
      }
      @media (max-width: 500px) {
        .move-pwr-acc {
          display: none !important;
        }
        #battle-fight-menu button {
          padding: 7px 10px !important;
          min-height: 48px !important;
        }
      }
      /* Move grid containment for the widest phones (Pixel 9 Pro XL 448px, iPhone 16 Pro Max 440px, zoom 480px) */
      #battle-fight-menu {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        gap: 8px !important;
      }
      .battle-move-btn {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .battle-move-btn > div {
        min-width: 0 !important;
        max-width: 100% !important;
      }
      .battle-move-btn .move-btn-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #battle-message-box.full-width-dialogue {
        width: 100% !important;
        flex: 1 1 100% !important;
        box-sizing: border-box !important;
      }
      @media (max-width: 768px) {
        #battle-bottom-panel {
          flex-direction: column !important;
          box-sizing: border-box !important;
          max-width: 100% !important;
          overflow: hidden !important;
          gap: 8px !important;
        }
        #battle-action-menu {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          gap: 8px !important;
        }
        #battle-action-menu button {
          min-height: 52px !important;
          font-size: 15px !important;
        }
      }
      @media (orientation: portrait) {
        #enemy-card, #player-card {
          width: calc(100vw - 120px) !important;
          max-width: 270px !important;
          min-width: unset !important;
          padding: 8px 14px !important;
          font-size: 14px !important;
        }
        #battle-speed-btn {
          padding: 6px 12px !important;
          font-size: 12px !important;
        }
        #battle-bottom-panel {
          max-height: 48dvh !important;
          min-height: unset !important;
          padding: 10px 12px max(10px, env(safe-area-inset-bottom, 12px)) 12px !important;
          box-sizing: border-box !important;
        }
        #battle-fight-menu {
          max-height: 48dvh !important;
          overflow-y: auto !important;
          box-sizing: border-box !important;
          padding-bottom: env(safe-area-inset-bottom, 8px) !important;
        }
        #battle-action-menu {
          width: 100% !important;
        }
      }
      @media (orientation: landscape) and (max-height: 520px) {
        #enemy-card, #player-card {
          padding: 6px 12px !important;
          min-width: 220px !important;
          font-size: 13px !important;
        }
        #battle-bottom-panel {
          min-height: 80px !important;
          max-height: 42dvh !important;
          padding: 6px 12px !important;
          box-sizing: border-box !important;
        }
        #battle-fight-menu {
          max-height: 36dvh !important;
          overflow-y: auto !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  private getCategorySvg(category: 'Physical' | 'Special' | 'Status'): string {
    if (category === 'Physical') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#dc2626" stroke-width="1.5" title="Physical Move">
        <polygon points="12,2 14.8,8.5 22,9.2 16.5,14 18.2,21 12,17.3 5.8,21 7.5,14 2,9.2 9.2,8.5"/>
      </svg>`;
    }
    if (category === 'Special') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" title="Special Move">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="1.5" fill="#38bdf8"/>
      </svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" title="Status Move">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`;
  }

  private getGenderOrLegendBadge(speciesId: string): string {
    if (['raikou', 'entei', 'suicune'].includes(speciesId)) {
      return `<span style="color: #facc15; font-size: 13px;" title="Legendary Beast">★</span>`;
    }
    const isFemale = ['chikorita', 'sentret', 'pidgey'].includes(speciesId);
    return isFemale
      ? `<span style="color: #f43f5e; font-size: 13px; font-weight: 800;">♀</span>`
      : `<span style="color: #38bdf8; font-size: 13px; font-weight: 800;">♂</span>`;
  }

  private createUI(): void {
    const root = document.createElement('div');
    root.id = 'battle-hud-root';
    root.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
      padding: max(12px, env(safe-area-inset-top, 12px)) max(12px, env(safe-area-inset-right, 12px)) max(12px, env(safe-area-inset-bottom, 12px)) max(12px, env(safe-area-inset-left, 12px));
      box-sizing: border-box;
    `;

    root.innerHTML = `
      <!-- Top Area: Asymmetric Enemy HUD Card (Top-Left) & Speed Toggle Pill (Top-Right) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div id="enemy-card" style="
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(226, 232, 240, 0.25);
          border-bottom: 4px solid #334155;
          border-radius: 10px 10px 18px 10px;
          padding: 12px 20px;
          min-width: 300px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 16px; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span id="enemy-caught-icon" style="display: none; font-size: 12px;" title="Already Caught">🔴</span>
              <span id="enemy-name">Wild Pidgey</span>
              <span id="enemy-gender"></span>
              <span id="enemy-status-badges" style="display: flex; gap: 4px; flex-wrap: wrap;"></span>
            </div>
            <span id="enemy-level" style="background: rgba(250, 204, 21, 0.16); border: 1px solid rgba(250, 204, 21, 0.45); color: #facc15; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">Lv. 3</span>
          </div>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 700;">
              <span style="color: #facc15; letter-spacing: 0.5px;">HP</span>
              <span id="enemy-hp-text">16 / 16 HP</span>
            </div>
            <div style="width: 100%; height: 9px; background: #1e293b; border: 1px solid #475569; border-radius: 5px; overflow: hidden;">
              <div id="enemy-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>

        <div style="pointer-events: auto;">
          <button id="battle-speed-btn" style="
            background: #2563eb;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 999px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
          ">
            <span>⚡ SPEED: 1x</span> <span class="keyboard-hint">(Shift)</span>
          </button>
        </div>
      </div>

      <!-- Mid-Right Area: Asymmetric Player HUD Card with Numeric HP, Cyan EXP Bar & 6-Dot Party Dock -->
      <div style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 10px;">
        <div id="player-card" style="
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(226, 232, 240, 0.25);
          border-bottom: 4px solid #334155;
          border-radius: 18px 10px 10px 10px;
          padding: 12px 20px 10px 20px;
          min-width: 320px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 16px; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span id="player-name">Cyndaquil</span>
              <span id="player-gender"></span>
              <span id="player-status-badges" style="display: flex; gap: 4px; flex-wrap: wrap;"></span>
            </div>
            <span id="player-level" style="background: rgba(250, 204, 21, 0.16); border: 1px solid rgba(250, 204, 21, 0.45); color: #facc15; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">Lv. 5</span>
          </div>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 700;">
              <span style="color: #facc15; letter-spacing: 0.5px;">HP</span>
              <span id="player-hp-text" style="color: #f8fafc; font-weight: 800;">20 / 20 HP</span>
            </div>
            <div style="width: 100%; height: 9px; background: #1e293b; border: 1px solid #475569; border-radius: 5px; overflow: hidden;">
              <div id="player-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
          <!-- Cyan EXP Bar + 6-Dot Miniature Party Dock -->
          <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">EXP</span>
              <div style="flex: 1; height: 5px; background: #0f172a; border: 1px solid #334155; border-radius: 3px; overflow: hidden;">
                <div id="player-exp-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8); transition: width 0.35s ease;"></div>
              </div>
            </div>
            <div id="player-party-dock" title="Party Status" style="display: flex; align-items: center; gap: 4px;"></div>
          </div>
        </div>
      </div>

      <!-- Bottom Control & Classic Double-Framed Dialogue Panel -->
      <div id="battle-bottom-panel" style="
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        border: 2px solid rgba(255, 255, 255, 0.24);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.65);
        pointer-events: auto;
        min-height: 132px;
        display: flex;
        gap: 20px;
        box-sizing: border-box;
      ">
        <!-- Dialogue Text -->
        <div id="battle-message-box" style="
          flex: 1;
          font-size: 18px;
          font-weight: 600;
          color: #f8fafc;
          line-height: 1.5;
          display: flex;
          align-items: center;
        ">
          What will Cyndaquil do?
        </div>

        <!-- Main 2x2 Command Menu (FIGHT / BAG / POKEMON / RUN) -->
        <div id="battle-action-menu" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 280px;
        ">
          <button id="btn-fight" style="
            background: #dc2626;
            color: white;
            border: 2px solid #f87171;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 800;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
          ">FIGHT</button>
          <button id="btn-bag" style="
            background: #d97706;
            color: white;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 800;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
          ">BAG</button>
          <button id="btn-pokemon" style="
            background: #16a34a;
            color: white;
            border: 2px solid #4ade80;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 800;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);
          ">POKÉMON</button>
          <button id="btn-run" style="
            background: #2563eb;
            color: white;
            border: 2px solid #60a5fa;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 800;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
          ">RUN</button>
        </div>

        <!-- Fight Submenu (Unbound 2x2 Move Matrix) -->
        <div id="battle-fight-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
          width: 100%;
          max-height: 48dvh;
          overflow-y: auto;
          box-sizing: border-box;
          padding-bottom: env(safe-area-inset-bottom, 12px);
          -webkit-overflow-scrolling: touch;
        "></div>

        <!-- Bag Submenu (Pokéballs) -->
        <div id="battle-bag-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
          width: 100%;
          max-height: 150px;
          overflow-y: auto;
        "></div>

        <!-- Party Submenu (Switch Pokémon) -->
        <div id="battle-party-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
          width: 100%;
          max-height: 150px;
          overflow-y: auto;
        "></div>
      </div>
    `;

    this.container.appendChild(root);
    this.rootElement = root;

    this.messageBox = root.querySelector('#battle-message-box') as HTMLDivElement;
    this.actionMenu = root.querySelector('#battle-action-menu') as HTMLDivElement;
    this.fightMenu = root.querySelector('#battle-fight-menu') as HTMLDivElement;
    this.bagMenu = root.querySelector('#battle-bag-menu') as HTMLDivElement;
    this.partyMenu = root.querySelector('#battle-party-menu') as HTMLDivElement;
    this.playerHpBar = root.querySelector('#player-hp-bar') as HTMLDivElement;
    this.enemyHpBar = root.querySelector('#enemy-hp-bar') as HTMLDivElement;
    this.playerExpBar = root.querySelector('#player-exp-bar') as HTMLDivElement;
    this.playerHpText = root.querySelector('#player-hp-text') as HTMLSpanElement;
    this.enemyHpText = root.querySelector('#enemy-hp-text') as HTMLSpanElement;
    this.playerPartyDock = root.querySelector('#player-party-dock') as HTMLDivElement;
    this.speedButton = root.querySelector('#battle-speed-btn') as HTMLButtonElement;

    this.speedButton.addEventListener('click', () => {
      this.triggerSpeedToggle();
    });

    root.querySelector('#btn-fight')!.addEventListener('click', () => {
      this.showFightMenu();
    });

    root.querySelector('#btn-run')!.addEventListener('click', () => {
      if (this.callbacks?.onRunSelected) {
        this.callbacks.onRunSelected();
      }
    });

    root.querySelector('#btn-bag')!.addEventListener('click', () => {
      this.showBagMenu();
    });

    root.querySelector('#btn-pokemon')!.addEventListener('click', () => {
      this.showPartyMenu();
    });
  }

  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.rootElement?.style.display !== 'flex' || e.repeat) return;

      const isFightMenuOpen = this.fightMenu?.style.display === 'grid';
      const isBagMenuOpen = this.bagMenu?.style.display === 'grid';
      const isPartyMenuOpen = this.partyMenu?.style.display === 'grid';

      if (isFightMenuOpen) {
        let moveIdx = -1;
        if (e.code === 'Digit1' || e.code === 'KeyQ') moveIdx = 0;
        else if (e.code === 'Digit2' || e.code === 'KeyW') moveIdx = 1;
        else if (e.code === 'Digit3' || e.code === 'KeyA') moveIdx = 2;
        else if (e.code === 'Digit4' || e.code === 'KeyS') moveIdx = 3;
        else if (e.code === 'Escape' || e.code === 'KeyX') {
          e.preventDefault();
          this.showActionMenu();
          return;
        }

        if (moveIdx >= 0 && this.playerPokemon?.moves[moveIdx]) {
          e.preventDefault();
          this.selectMoveSlot(moveIdx);
        }
        return;
      }

      if ((isBagMenuOpen || (isPartyMenuOpen && !this.isForcedPartySwitch)) && (e.code === 'Escape' || e.code === 'KeyX')) {
        e.preventDefault();
        this.showActionMenu();
      }
    });
  }

  private selectMoveSlot(index: number): void {
    const moveSlot = this.playerPokemon?.moves[index];
    if (!moveSlot) return;
    const moveData = PokemonFactory.getMoveData(moveSlot.moveId);
    if (moveSlot.currentPp > 0) {
      moveSlot.currentPp--;
    }
    this.fightMenu.style.display = 'none';
    this.messageBox.style.display = 'flex';
    if (this.callbacks?.onMoveSelected) {
      this.callbacks.onMoveSelected(moveData.id);
    }
  }

  public triggerSpeedToggle(): void {
    if (this.callbacks?.onSpeedToggle) {
      const nextSpeed = this.callbacks.onSpeedToggle();
      this.updateSpeedDisplay(nextSpeed);
    }
  }

  public initBattle(
    playerPokemon: PokemonInstance,
    enemyPokemon: PokemonInstance,
    callbacks: BattleHUDCallbacks,
    ballsInventory: Partial<Record<PokeballId, number>> = {},
    playerParty: PokemonInstance[] = [],
    caughtSpeciesIds: Set<string> = new Set()
  ): void {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.callbacks = callbacks;
    this.ballsInventory = ballsInventory;
    this.playerParty = playerParty.length > 0 ? playerParty : [playerPokemon];
    this.caughtSpeciesIds = caughtSpeciesIds;
    this.rootElement.style.display = 'flex';

    // Populate Player Card
    this.setActivePlayerPokemon(playerPokemon);

    // Populate Enemy Card
    (this.rootElement.querySelector('#enemy-name') as HTMLElement).innerText = enemyPokemon.nickname;
    (this.rootElement.querySelector('#enemy-gender') as HTMLElement).innerHTML = this.getGenderOrLegendBadge(
      enemyPokemon.speciesId
    );
    (this.rootElement.querySelector('#enemy-level') as HTMLElement).innerText = `Lv. ${enemyPokemon.level}`;
    const caughtIcon = this.rootElement.querySelector('#enemy-caught-icon') as HTMLElement;
    if (caughtIcon) {
      caughtIcon.style.display = this.caughtSpeciesIds.has(enemyPokemon.speciesId) ? 'inline' : 'none';
    }
    this.updateHp(false, enemyPokemon.currentHp, enemyPokemon.stats.hp);
    this.updatePartyDock();

    this.showActionMenu();
    this.messageBox.innerText = `What will ${playerPokemon.nickname} do?`;
  }

  public setActivePlayerPokemon(playerPokemon: PokemonInstance): void {
    this.playerPokemon = playerPokemon;
    (this.rootElement.querySelector('#player-name') as HTMLElement).innerText = playerPokemon.nickname;
    (this.rootElement.querySelector('#player-gender') as HTMLElement).innerHTML = this.getGenderOrLegendBadge(
      playerPokemon.speciesId
    );
    (this.rootElement.querySelector('#player-level') as HTMLElement).innerText = `Lv. ${playerPokemon.level}`;
    this.updateHp(true, playerPokemon.currentHp, playerPokemon.stats.hp);
    this.updateExp(playerPokemon);
    this.updateStatusBadges();
    this.updatePartyDock();
  }

  /**
   * Smoothly slides in the player or opponent health card upon send-out (Ticket 5.5).
   */
  public slideInHealthCard(isPlayer: boolean): void {
    const cardSelector = isPlayer ? '#player-card' : '#enemy-card';
    const card = this.rootElement.querySelector(cardSelector) as HTMLElement | null;
    if (!card) return;

    const startOffset = isPlayer ? '100%' : '-100%';
    const durSec = (0.28 / this.speedMultiplier).toFixed(2);
    card.style.transition = 'none';
    card.style.transform = `translateX(${startOffset})`;
    card.style.opacity = '0';

    requestAnimationFrame(() => {
      card.style.transition = `transform ${durSec}s cubic-bezier(0.22, 1, 0.36, 1), opacity ${durSec}s ease-out`;
      card.style.transform = 'translateX(0)';
      card.style.opacity = '1';
    });
  }

  public updatePartyDock(): void {
    if (!this.playerPartyDock) return;
    let html = '';
    for (let i = 0; i < 6; i++) {
      const member = this.playerParty[i];
      if (!member) {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #0f172a; border: 1.5px solid #334155; display: inline-block;" title="Empty Slot"></span>`;
      } else if (member.currentHp <= 0) {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #7f1d1d; border: 1.5px solid #ef4444; opacity: 0.55; display: inline-block;" title="${member.nickname} (Fainted)"></span>`;
      } else if (member.status && member.status !== 'NONE') {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #f59e0b; border: 1.5px solid #fef08a; display: inline-block;" title="${member.nickname} (${member.status})"></span>`;
      } else {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #22c55e; border: 1.5px solid #bbf7d0; box-shadow: 0 0 4px rgba(34, 197, 94, 0.7); display: inline-block;" title="${member.nickname} (Healthy)"></span>`;
      }
    }
    this.playerPartyDock.innerHTML = html;
  }

  public updateExp(pokemon: PokemonInstance = this.playerPokemon): void {
    if (!this.playerExpBar || !pokemon) return;
    const baseExp = pokemon.level * pokemon.level * pokemon.level;
    const nextExp = pokemon.nextLevelExp ?? (pokemon.level + 1) * (pokemon.level + 1) * (pokemon.level + 1);
    const currentExp = pokemon.exp ?? baseExp;
    const span = Math.max(1, nextExp - baseExp);
    const pct = Math.max(0, Math.min(100, ((currentExp - baseExp) / span) * 100));

    const drainSec = (0.35 / this.speedMultiplier).toFixed(2);
    this.playerExpBar.style.transition = `width ${drainSec}s ease`;
    this.playerExpBar.style.width = `${pct}%`;
    (this.rootElement.querySelector('#player-level') as HTMLElement).innerText = `Lv. ${pokemon.level}`;
  }

  public updateStatusBadges(): void {
    const renderBadges = (pkmn: PokemonInstance, containerId: string) => {
      const el = this.rootElement.querySelector(containerId) as HTMLElement;
      if (!el || !pkmn) return;
      let html = '';
      if (pkmn.status && pkmn.status !== 'NONE') {
        const bg = STATUS_COLORS[pkmn.status] || '#64748b';
        html += `<span style="background: ${bg}; color: white; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">${pkmn.status}</span>`;
      }
      if (pkmn.isTrapped) {
        html += `<span style="background: #7c3aed; color: white; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">🔒 TRAPPED</span>`;
      }
      if (pkmn.statStages) {
        const shortLabels: Record<StatId, string> = {
          atk: 'ATK',
          def: 'DEF',
          spa: 'SPA',
          spd: 'SPD',
          spe: 'SPE',
          acc: 'ACC',
          eva: 'EVA',
        };
        for (const [k, v] of Object.entries(pkmn.statStages) as Array<[StatId, number]>) {
          if (v !== 0) {
            const color = v > 0 ? '#0284c7' : '#e11d48';
            const sign = v > 0 ? `+${v}` : `${v}`;
            html += `<span style="background: ${color}; color: white; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px;">${shortLabels[k]}${sign}</span>`;
          }
        }
      }
      el.innerHTML = html;
    };

    renderBadges(this.playerPokemon, '#player-status-badges');
    renderBadges(this.enemyPokemon, '#enemy-status-badges');
    this.updatePartyDock();
  }

  public getSpeedMultiplier(): SpeedMultiplier {
    return this.speedMultiplier;
  }

  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.updateSpeedDisplay(speed);
  }

  public updateSpeedDisplay(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    if (this.speedButton) {
      const isMobileOrTouch =
        typeof window !== 'undefined' &&
        (window.innerWidth <= 768 ||
          'ontouchstart' in window ||
          (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
          (typeof document !== 'undefined' && document.body?.classList?.contains('touch-controls-active')));
      this.speedButton.innerHTML = isMobileOrTouch
        ? `<span>⚡ SPEED: ${speed}x</span>`
        : `<span>⚡ SPEED: ${speed}x</span> <span class="keyboard-hint">(Shift)</span>`;
      if (speed === 1) {
        this.speedButton.style.background = '#2563eb';
        this.speedButton.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.4)';
      } else if (speed === 2) {
        this.speedButton.style.background = '#d97706';
        this.speedButton.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.4)';
      } else if (speed === 3) {
        this.speedButton.style.background = '#dc2626';
        this.speedButton.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.4)';
      } else {
        this.speedButton.style.background = 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)';
        this.speedButton.style.boxShadow = '0 0 16px rgba(236, 72, 153, 0.65)';
      }
    }
  }

  public updateHp(isPlayer: boolean, currentHp: number, maxHp: number): void {
    const bar = isPlayer ? this.playerHpBar : this.enemyHpBar;
    const text = isPlayer ? this.playerHpText : this.enemyHpText;
    const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

    // Scale HP bar drain transition duration by battleSpeedMultiplier
    const drainSec = (0.3 / this.speedMultiplier).toFixed(2);
    bar.style.transition = `width ${drainSec}s ease`;
    bar.style.width = `${pct}%`;
    text.innerText = `${currentHp} / ${maxHp} HP`;

    if (pct > 50) {
      bar.style.background = '#22c55e';
      bar.classList.remove('crystal-low-hp');
    } else if (pct > 20) {
      bar.style.background = '#eab308';
      bar.classList.remove('crystal-low-hp');
    } else {
      bar.style.background = '#ef4444';
      if (currentHp > 0) {
        bar.classList.add('crystal-low-hp');
      } else {
        bar.classList.remove('crystal-low-hp');
      }
    }

    this.updateStatusBadges();
  }

  public showFightMenu(): void {
    this.messageBox.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.fightMenu.style.display = 'grid';
    this.fightMenu.innerHTML = '';

    this.playerPokemon.moves.forEach((moveSlot, idx) => {
      const moveData = PokemonFactory.getMoveData(moveSlot.moveId);
      const badge = EffectivenessHelper.evaluate(moveData, this.enemyPokemon);
      const pill = EffectivenessHelper.getPillStyle(badge.multiplier, moveData.category === 'Status');

      const btn = document.createElement('button');
      btn.className = 'battle-move-btn';
      btn.style.cssText = `
        background: #1e293b;
        color: white;
        border: 1.5px solid rgba(255, 255, 255, 0.16);
        border-radius: 8px;
        padding: 9px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        transition: transform 0.1s ease, background 0.15s ease, border-color 0.15s ease;
      `;

      const typeColor = TYPE_COLORS[moveData.type] || '#64748b';
      const categorySvg = this.getCategorySvg(moveData.category);
      const shortcutHint = MOVE_SHORTCUT_LABELS[idx] || `${idx + 1}`;
      const pwrStr = moveData.power > 0 ? `${moveData.power}` : '—';
      const accStr = moveData.accuracy > 0 ? `${moveData.accuracy}` : '—';

      btn.title = `${moveData.name} (${moveData.type.toUpperCase()}) | Category: ${moveData.category} | PWR: ${pwrStr} | ACC: ${accStr}% | PP: ${moveSlot.currentPp}/${moveSlot.maxPp}`;
      btn.setAttribute('aria-label', btn.title);

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="keyboard-hint" style="font-size: 10px; font-weight: 800; color: #94a3b8; background: #0f172a; border: 1px solid #334155; padding: 1px 5px; border-radius: 4px;">[${shortcutHint}]</span>
            <span class="move-btn-name" style="font-weight: 800; font-size: 15px;">${moveData.name}</span>
          </div>
          <span style="display: flex; align-items: center;">${categorySvg}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 6px; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 10px; font-weight: 800; background: ${typeColor}; color: white; padding: 2px 6px; border-radius: 4px;">${moveData.type.toUpperCase()}</span>
            <span style="font-size: 11px; font-weight: 700; color: #cbd5e1;">PP ${moveSlot.currentPp}/${moveSlot.maxPp}</span>
            <span class="move-pwr-acc" style="font-size: 10px; font-weight: 700; color: #94a3b8;">PWR ${pwrStr}</span>
            <span class="move-pwr-acc" style="font-size: 10px; font-weight: 700; color: #94a3b8;">ACC ${accStr}</span>
          </div>
          <span class="${pill.pulse ? 'crystal-ultra-pill' : ''}" style="
            background: ${pill.background};
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 4px;
            text-decoration: ${pill.strikethrough ? 'line-through' : 'none'};
            white-space: nowrap;
          ">${pill.label}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        this.selectMoveSlot(idx);
      });

      this.fightMenu.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
      background: #334155;
      color: #cbd5e1;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      padding: 6px;
      cursor: pointer;
      grid-column: span 2;
    `;
    backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
    backBtn.addEventListener('click', () => this.showActionMenu());
    this.fightMenu.appendChild(backBtn);
  }

  public showActionMenu(): void {
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.actionMenu.style.display = 'grid';
    this.messageBox.innerText = `What will ${this.playerPokemon.nickname} do?`;
    if (this.isMobileViewport()) {
      // Handheld: the 2x2 action quadrant takes over the full bottom tray
      this.messageBox.style.display = 'none';
      this.messageBox.className = '';
      this.actionMenu.style.width = '100%';
    } else {
      this.messageBox.style.display = 'flex';
      this.messageBox.className = '';
      this.actionMenu.style.width = '';
    }
    this.updateStatusBadges();
  }

  public showPartyMenu(options?: { forcedSwitch?: boolean; onSelected?: (pokemon: PokemonInstance) => void }): void {
    this.isForcedPartySwitch = Boolean(options?.forcedSwitch);
    this.messageBox.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'grid';
    this.partyMenu.innerHTML = '';

    for (const pkmn of this.playerParty) {
      const isActive = pkmn.uid === this.playerPokemon.uid;
      const isFainted = pkmn.currentHp <= 0;
      const isEgg = Boolean(pkmn.isEgg);
      const pct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';

      const btn = document.createElement('button');
      btn.style.cssText = `
        background: ${isActive ? '#0f172a' : '#1e293b'};
        color: ${isFainted || isEgg ? '#64748b' : 'white'};
        border: 1px solid ${isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.14)'};
        border-radius: 8px;
        padding: 8px 12px;
        cursor: ${isActive || isFainted || isEgg ? 'default' : 'pointer'};
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
      `;

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="font-weight: 700; font-size: 14px;">${isEgg ? '🥚 EGG' : pkmn.nickname} ${isActive ? '(OUT)' : ''}</span>
          <span style="font-size: 11px; color: #facc15; font-weight: 700;">${isEgg ? 'EGG' : `Lv.${pkmn.level}`}</span>
        </div>
        <div style="width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; margin-top: 6px;">
          <div style="width: ${isEgg ? 100 : pct}%; height: 100%; background: ${isEgg ? '#facc15' : hpColor};"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px;">
          <span>${isEgg ? `Steps: ${pkmn.eggSteps ?? 0}` : `HP ${pkmn.currentHp}/${pkmn.stats.hp}`}</span>
          <span>${pkmn.status !== 'NONE' ? pkmn.status : ''}</span>
        </div>
      `;

      btn.addEventListener('click', async () => {
        if (isEgg) {
          await this.showMessage("An EGG can't battle!");
          this.partyMenu.style.display = 'grid';
          this.messageBox.style.display = 'none';
          return;
        }
        if (isActive) {
          await this.showMessage(`${pkmn.nickname} is already in battle!`);
          this.partyMenu.style.display = 'grid';
          this.messageBox.style.display = 'none';
          return;
        }
        if (isFainted) {
          await this.showMessage(`${pkmn.nickname} has no energy left to battle!`);
          this.partyMenu.style.display = 'grid';
          this.messageBox.style.display = 'none';
          return;
        }
        this.isForcedPartySwitch = false;
        this.partyMenu.style.display = 'none';
        this.messageBox.style.display = 'flex';
        if (options?.onSelected) {
          options.onSelected(pkmn);
        } else if (this.callbacks?.onPokemonSelected) {
          this.callbacks.onPokemonSelected(pkmn);
        }
      });

      this.partyMenu.appendChild(btn);
    }

    if (!this.isForcedPartySwitch) {
      const backBtn = document.createElement('button');
      backBtn.style.cssText = `
        background: #334155;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        padding: 8px;
        cursor: pointer;
        grid-column: span 2;
      `;
      backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
      backBtn.addEventListener('click', () => this.showActionMenu());
      this.partyMenu.appendChild(backBtn);
    }
  }

  public showBagMenu(): void {
    this.messageBox.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.fightMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.bagMenu.style.display = 'grid';
    this.bagMenu.innerHTML = '';

    const allBallMeta: Array<{ id: PokeballId; name: string; desc: string; color: string }> = [
      { id: 'quick-ball', name: 'Quick Ball', desc: '5.0x catch rate on Turn 1', color: '#0284c7' },
      { id: 'fast-ball', name: 'Fast Ball', desc: '4.0x if Base Speed ≥ 100', color: '#ea580c' },
      { id: 'net-ball', name: 'Net Ball', desc: '3.5x if Water or Bug', color: '#059669' },
      { id: 'dusk-ball', name: 'Dusk Ball', desc: '3.0x at Night or Caves', color: '#7c3aed' },
      { id: 'timer-ball', name: 'Timer Ball', desc: 'Scales up to 4.0x with turns', color: '#dc2626' },
      { id: 'repeat-ball', name: 'Repeat Ball', desc: '3.5x if species registered', color: '#f59e0b' },
      { id: 'nest-ball', name: 'Nest Ball', desc: 'Up to 4.0x on lower levels', color: '#10b981' },
      { id: 'dream-ball', name: 'Dream Ball', desc: '4.0x if target is Asleep (SLP)', color: '#ec4899' },
      { id: 'ultra-ball', name: 'Ultra Ball', desc: '2.0x high catch rate', color: '#ca8a04' },
      { id: 'great-ball', name: 'Great Ball', desc: '1.5x moderate catch rate', color: '#2563eb' },
      { id: 'poke-ball', name: 'Poké Ball', desc: '1.0x standard catch rate', color: '#ef4444' },
      { id: 'master-ball', name: 'Master Ball', desc: '100% Guaranteed capture', color: '#9333ea' },
    ];

    for (const ball of allBallMeta) {
      const count = this.ballsInventory[ball.id] ?? 0;
      if (count <= 0) continue;

      const palette = EffectivenessHelper.getPokeballPalette(ball.id);
      const btn = document.createElement('button');
      btn.style.cssText = `
        background: #1e293b;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        transition: transform 0.1s ease;
      `;

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 14px; color: ${ball.color};">
            <img src="${palette.spritePath}" alt="${ball.name}" onerror="this.style.display='none'" style="width: 18px; height: 18px; image-rendering: pixelated;" />
            <span>${ball.name}</span>
          </span>
          <span style="font-size: 12px; font-weight: 700; color: #38bdf8;">x${count}</span>
        </div>
        <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
          ${ball.desc}
        </div>
      `;

      btn.addEventListener('click', () => {
        this.bagMenu.style.display = 'none';
        this.messageBox.style.display = 'flex';
        if (this.callbacks?.onBagSelected) {
          this.callbacks.onBagSelected(ball.id);
        }
      });

      this.bagMenu.appendChild(btn);
    }

    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
      background: #334155;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      padding: 8px;
      cursor: pointer;
      grid-column: span 2;
    `;
    backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
    backBtn.addEventListener('click', () => this.showActionMenu());
    this.bagMenu.appendChild(backBtn);
  }

  /**
   * Renders battle dialogue at a fixed, snappy ~12ms/char with a ~500ms post-delay.
   * Intentionally decoupled from the battle speed multiplier so text stays readable at any battle speed.
   * The dialogue takes the full bottom tray; the action menu is hidden while a message is shown.
   */
  public async showMessage(text: string): Promise<void> {
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.messageBox.style.display = 'flex';
    this.messageBox.className = 'full-width-dialogue';
    this.messageBox.style.width = '100%';
    this.updateStatusBadges();

    this.messageBox.innerText = '';
    for (let i = 1; i <= text.length; i++) {
      this.messageBox.innerText = text.slice(0, i);
      await new Promise((r) => setTimeout(r, BattleHUD.DIALOGUE_CHAR_DELAY_MS));
    }

    return new Promise((resolve) => setTimeout(resolve, BattleHUD.DIALOGUE_POST_DELAY_MS));
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  /**
   * Prompts the player to replace one of 4 known moves with a newly learned move (Ticket 6.4).
   * Returns slot index 0..3 to replace, or null if declined.
   */
  public promptMoveForget(pokemon: PokemonInstance, newMove: MoveData): Promise<number | null> {
    return new Promise((resolve) => {
      const prevMessageDisplay = this.messageBox ? this.messageBox.style.display : 'flex';
      if (this.messageBox) {
        this.messageBox.style.display = 'none';
      }

      const backdrop = document.createElement('div');
      backdrop.id = 'move-learn-backdrop';
      backdrop.className = 'interactive';
      backdrop.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.65);
        pointer-events: auto;
        z-index: 95;
      `;

      backdrop.style.pointerEvents = 'auto';

      const modal = document.createElement('div');
      modal.id = 'move-learn-modal';
      modal.className = 'interactive';
      modal.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 480px;
        max-width: 92vw;
        max-height: 85dvh;
        overflow-y: auto;
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(14px);
        border: 2px solid #38bdf8;
        border-radius: 12px;
        padding: 18px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 100;
        pointer-events: auto;
        color: #f8fafc;
      `;
      modal.style.pointerEvents = 'auto';

      const newTypeColor = TYPE_COLORS[newMove.type] || '#64748b';
      const newPwr = newMove.power > 0 ? newMove.power : '—';
      const newAcc = newMove.accuracy > 0 ? `${newMove.accuracy}%` : '—';

      modal.innerHTML = `
        <div style="font-weight: 800; font-size: 16px; color: #38bdf8;">
          ✨ LEARN A NEW MOVE?
        </div>
        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">
          <strong>${pokemon.nickname}</strong> wants to learn <strong>${newMove.name}</strong>, but already knows 4 moves! Select an existing move to replace, or cancel to keep current moves.
        </div>
        <div style="background: rgba(30, 41, 59, 0.9); border: 1.5px solid ${newTypeColor}; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 10px; font-weight: 800; background: ${newTypeColor}; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${newMove.type.toUpperCase()}</span>
            <strong style="font-size: 14px; color: #f8fafc;">${newMove.name}</strong>
            <span style="font-size: 11px; color: #94a3b8; margin-left: 6px;">[${newMove.category.toUpperCase()}]</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #cbd5e1;">
            PWR: ${newPwr} | ACC: ${newAcc} | PP: ${newMove.pp}
          </div>
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Existing Moves:</div>
        <div id="forget-slots-container" style="display: flex; flex-direction: column; gap: 8px;"></div>
        <button id="cancel-learn-btn" style="
          margin-top: 6px;
          background: #334155;
          color: #f8fafc;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          pointer-events: auto;
        ">✕ Keep Existing Moves (Don't Learn)</button>
      `;

      let resolved = false;
      let cursorIndex = 0; // 0..3 = move slots, 4 = cancel
      const slotButtons: HTMLButtonElement[] = [];

      const cleanupAndResolve = (choice: number | null) => {
        if (resolved) return;
        resolved = true;
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', onKeyDown);
        }
        if ((backdrop as any).remove) {
          backdrop.remove();
        } else if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
        if ((modal as any).remove) {
          modal.remove();
        } else if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        if (this.messageBox) {
          this.messageBox.style.display = prevMessageDisplay || 'flex';
        }
        resolve(choice);
      };

      const slotsContainer = modal.querySelector('#forget-slots-container') as HTMLDivElement;
      pokemon.moves.forEach((slot, idx) => {
        const slotData = PokemonFactory.getMoveData(slot.moveId);
        const slotTypeColor = TYPE_COLORS[slotData.type] || '#64748b';
        const slotPwr = slotData.power > 0 ? slotData.power : '—';
        const slotAcc = slotData.accuracy > 0 ? `${slotData.accuracy}%` : '—';

        const slotBtn = document.createElement('button');
        slotBtn.id = `forget-slot-btn-${idx}`;
        slotBtn.style.cssText = `
          background: #1e293b;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 8px;
          padding: 9px 12px;
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          transition: background 0.15s ease, border-color 0.15s ease;
        `;
        slotBtn.innerHTML = `
          <div>
            <span class="keyboard-hint" style="font-size: 10px; font-weight: 800; color: #94a3b8; margin-right: 4px;">[${idx + 1}]</span>
            <span style="font-size: 10px; font-weight: 800; background: ${slotTypeColor}; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${slotData.type.toUpperCase()}</span>
            <strong style="font-size: 13px;">Forget ${slotData.name}</strong>
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-weight: 600;">
            PWR: ${slotPwr} | ACC: ${slotAcc} | PP: ${slot.currentPp}/${slot.maxPp}
          </div>
        `;
        slotBtn.addEventListener('mouseenter', () => {
          cursorIndex = idx;
          slotBtn.style.borderColor = '#ef4444';
          slotBtn.style.background = 'rgba(239, 68, 68, 0.15)';
        });
        slotBtn.addEventListener('mouseleave', () => {
          slotBtn.style.borderColor = 'rgba(255, 255, 255, 0.16)';
          slotBtn.style.background = '#1e293b';
        });
        slotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(idx);
        });
        slotsContainer.appendChild(slotBtn);
        slotButtons.push(slotBtn);
      });

      const cancelBtn = modal.querySelector('#cancel-learn-btn') as HTMLButtonElement;
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        BattleAudio.playMenuSound('CANCEL');
        cleanupAndResolve(null);
      });

      const onKeyDown = (e: KeyboardEvent) => {
        if (resolved) return;
        if (e.code === 'Digit1' && pokemon.moves[0]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(0);
        } else if (e.code === 'Digit2' && pokemon.moves[1]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(1);
        } else if (e.code === 'Digit3' && pokemon.moves[2]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(2);
        } else if (e.code === 'Digit4' && pokemon.moves[3]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(3);
        } else if (e.code === 'Escape' || e.code === 'KeyX') {
          e.preventDefault();
          BattleAudio.playMenuSound('CANCEL');
          cleanupAndResolve(null);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          cursorIndex = (cursorIndex + 1) % (slotButtons.length + 1);
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          cursorIndex = (cursorIndex - 1 + slotButtons.length + 1) % (slotButtons.length + 1);
        } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
          e.preventDefault();
          if (cursorIndex < slotButtons.length) {
            BattleAudio.playMenuSound('CONFIRM');
            cleanupAndResolve(cursorIndex);
          } else {
            BattleAudio.playMenuSound('CANCEL');
            cleanupAndResolve(null);
          }
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeyDown);
      }

      this.container.appendChild(backdrop);
      this.container.appendChild(modal);
    });
  }

  public hide(): void {
    this.rootElement.style.display = 'none';
  }
}
