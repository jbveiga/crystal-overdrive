/**
 * @fileoverview Neo-Kanto Start Menu UI overlay managing Pokédex, Trainer Card, Bag/Party shortcuts, and options.
 * @module ui/StartMenuUI
 * @role Start Menu UI Controller
 * @exports StartMenuUI
 * @layer ui
 * @sections L1-7: Micro-Header & Types | L8-364: Core Implementation | L365-729: Public Interface & Exports
 */

import type {
  SpeedMultiplier,
  TouchControlStyle,
  ExpShareMode,
  EncounterRateMode,
  GbcPaletteMode,
} from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';
import type { BugContestLeaderboardEntry } from '../world/BugContestManager';
import {
  JOHTO_DEX_SPECIES,
  type DexSpeciesData,
  PokedexModalRenderer,
} from './start-menu/PokedexModalRenderer';
import {
  JOHTO_BADGES,
  TrainerCardAndSaveRenderer,
} from './start-menu/TrainerCardAndSaveRenderer';
import { buildSettingsModalHtml } from './start-menu/SettingsModalRenderer';
import { bindSettingsEventListeners } from './start-menu/SettingsControlsBinding';

// Re-export for 100% backward compatibility
export { JOHTO_DEX_SPECIES, type DexSpeciesData };
export { JOHTO_BADGES };

export interface StartMenuStateProvider {
  getTrainerName: () => string;
  getMoney: () => number;
  getBadges: () => string[];
  getPartyCount: () => number;
  getCaughtCount: () => number;
  getCaughtSpeciesIds?: () => Set<string>;
  getSeenSpeciesIds?: () => Set<string>;
  getKeyItems?: () => string[];
  getPlayTimeSeconds: () => number;
  getMapName: () => string;
  isMuted?: () => boolean;
  getSpeedMultiplier?: () => SpeedMultiplier;
  getBattleSpeedMultiplier?: () => SpeedMultiplier;
  getTextSpeed?: () => 'SLOW' | 'MID' | 'FAST' | 'INSTANT';
  isGamepadActive?: () => boolean;
  getTouchControlStyle?: () => TouchControlStyle;
  getExpShareMode?: () => ExpShareMode;
  getEncounterRateMode?: () => EncounterRateMode;
  getAutoHm?: () => boolean;
  getCrtScanlines?: () => boolean;
  getGbcPalette?: () => GbcPaletteMode;
  getLowHpBeep?: () => boolean;
  getChiptuneMode?: () => boolean;
  getLevelCap?: () => number;
  getGymAceLevel?: () => number;
  getBugContestLeaderboard?: () => BugContestLeaderboardEntry[];
  getBugContestPersonalBest?: () => BugContestLeaderboardEntry | null;
}

export interface StartMenuCallbacks {
  onOpenParty: () => void;
  onOpenBag: () => void;
  onOpenPokegear: () => void;
  onOpenTownMap?: () => void;
  onOpenTownMapAtLandmark?: (landmarkId: string) => void;
  onOpenMissions?: () => void;
  onLaunchStadiumBattle?: (challengerId: string, cupId: string) => void;
  onSaveGame: () => Promise<void>;
  onToggleMute?: () => boolean;
  onCycleSpeed?: () => SpeedMultiplier;
  onCycleBattleSpeed?: () => SpeedMultiplier;
  onSetBattleSpeed?: (speed: SpeedMultiplier) => SpeedMultiplier | void;
  onCycleTextSpeed?: () => 'SLOW' | 'MID' | 'FAST' | 'INSTANT';
  onSetTextSpeed?: (speed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => ('SLOW' | 'MID' | 'FAST' | 'INSTANT') | void;
  onToggleGamepad?: () => boolean;
  onToggleTouchControlStyle?: () => TouchControlStyle;
  onCycleExpShareMode?: () => ExpShareMode;
  onSetExpShareMode?: (mode: ExpShareMode) => ExpShareMode | void;
  onSetEncounterRateMode?: (mode: EncounterRateMode) => EncounterRateMode | void;
  onToggleAutoHm?: (enabled: boolean) => boolean | void;
  onToggleCrtScanlines?: (enabled: boolean) => boolean | void;
  onSetGbcPalette?: (palette: GbcPaletteMode) => GbcPaletteMode | void;
  onToggleLowHpBeep?: (enabled: boolean) => boolean | void;
  onToggleChiptuneMode?: (enabled: boolean) => boolean | void;
}

export class StartMenuUI {
  private container: HTMLElement;
  private menuPanel!: HTMLDivElement;
  private pokedexModal!: HTMLDivElement;
  private trainerCardModal!: HTMLDivElement;
  private contestLeaderboardModal!: HTMLDivElement;
  private saveConfirmModal!: HTMLDivElement;
  private settingsModal!: HTMLDivElement;
  private stateProvider: StartMenuStateProvider;
  private callbacks: StartMenuCallbacks;
  private cursorIndex: number = 0;
  private speedMultiplier: SpeedMultiplier = 1;
  private menuItems: Array<{ id: string; label: string; icon: string; shortcut: string; action: () => void }> = [];
  private activeSettingsTab: 'ALL' | 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS' = 'ALL';

  // Sub-modal delegated renderers
  private pokedexRenderer!: PokedexModalRenderer;
  private trainerCardAndSaveRenderer!: TrainerCardAndSaveRenderer;

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
    this.ensureNeoKantoStyles();

    this.menuItems = [
      {
        id: 'start-opt-pokedex',
        label: 'POKéDEX',
        icon: '📕',
        shortcut: 'P',
        action: () => {
          this.openPokedex();
        },
      },
      {
        id: 'start-opt-pokemon',
        label: 'POKéMON',
        icon: '🟢',
        shortcut: 'K',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenParty();
        },
      },
      {
        id: 'start-opt-bag',
        label: 'BAG',
        icon: '🎒',
        shortcut: 'B',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenBag();
        },
      },
      {
        id: 'start-opt-pokegear',
        label: 'POKéGEAR',
        icon: '📻',
        shortcut: 'G',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenPokegear();
        },
      },
      {
        id: 'start-opt-missions',
        label: 'MISSIONS',
        icon: '📜',
        shortcut: 'M',
        action: () => {
          BattleAudio.playMenuSound('CONFIRM');
          this.hideMenuOnly();
          this.callbacks.onOpenMissions?.();
        },
      },
      {
        id: 'start-opt-trainer',
        label: this.stateProvider.getTrainerName() || 'TRAINER',
        icon: '🪪',
        shortcut: 'T',
        action: () => {
          this.openTrainerCard();
        },
      },
      {
        id: 'start-opt-save',
        label: 'SAVE',
        icon: '💾',
        shortcut: 'S',
        action: () => {
          this.openSaveConfirm();
        },
      },
      {
        id: 'start-opt-settings',
        label: 'SETTINGS',
        icon: '⚙️',
        shortcut: 'O',
        action: () => {
          this.openSettings();
        },
      },
      {
        id: 'start-opt-cancel',
        label: 'CANCEL',
        icon: '✕',
        shortcut: '9',
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
      this.pokedexModal?.style.display === 'flex' ||
      this.trainerCardModal?.style.display === 'flex' ||
      this.contestLeaderboardModal?.style.display === 'flex' ||
      this.saveConfirmModal?.style.display === 'flex' ||
      this.settingsModal?.style.display === 'flex'
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
    this.closeModalsOnly();
    this.cursorIndex = 0;
    this.renderMenuDrawer();
    this.menuPanel.style.display = 'flex';
  }

  public closeAll(): void {
    this.closeModalsOnly();
    if (this.menuPanel) {
      this.menuPanel.style.display = 'none';
    }
  }

  public hideMenuOnly(): void {
    if (this.menuPanel) {
      this.menuPanel.style.display = 'none';
    }
  }

  private closeModalsOnly(): void {
    if (this.pokedexModal) this.pokedexModal.style.display = 'none';
    if (this.trainerCardModal) this.trainerCardModal.style.display = 'none';
    if (this.contestLeaderboardModal) this.contestLeaderboardModal.style.display = 'none';
    if (this.saveConfirmModal) this.saveConfirmModal.style.display = 'none';
    if (this.settingsModal) this.settingsModal.style.display = 'none';
  }

  public handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.isOpen()) return false;

    if (this.pokedexModal.style.display === 'flex') {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (isInput && e.code !== 'Escape') {
        return false;
      }
      if (e.code === 'Escape' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.pokedexModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

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

    if (this.contestLeaderboardModal.style.display === 'flex') {
      if (e.code === 'Escape' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.contestLeaderboardModal.style.display = 'none';
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

    if (this.settingsModal.style.display === 'flex') {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.settingsModal.style.display = 'none';
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
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      BattleAudio.playMenuSound('CURSOR');
      this.cursorIndex = (this.cursorIndex + 1) % this.menuItems.length;
      this.renderMenuItems();
      return true;
    }
    if (this.triggerShortcut(e.code, true)) {
      e.preventDefault();
      return true;
    }
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
      e.preventDefault();
      const chosen = this.menuItems[this.cursorIndex];
      if (chosen) chosen.action();
      return true;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      BattleAudio.playMenuSound('CANCEL');
      this.closeAll();
      return true;
    }

    return true;
  }

  public triggerShortcut(code: string, allowSaveAndDigits: boolean = false): boolean {
    const shortcutByCode: Record<string, string> = {
      KeyP: 'start-opt-pokedex',
      KeyK: 'start-opt-pokemon',
      KeyB: 'start-opt-bag',
      KeyG: 'start-opt-pokegear',
      KeyM: 'start-opt-missions',
      KeyT: 'start-opt-trainer',
      KeyO: 'start-opt-settings',
    };
    if (allowSaveAndDigits) {
      shortcutByCode.KeyS = 'start-opt-save';
      if (code.startsWith('Digit')) {
        const digit = parseInt(code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= this.menuItems.length) {
          this.cursorIndex = digit - 1;
          this.menuItems[this.cursorIndex].action();
          return true;
        }
      }
    }
    const targetId = shortcutByCode[code];
    if (targetId) {
      const targetIdx = this.menuItems.findIndex((item) => item.id === targetId);
      if (targetIdx >= 0) {
        this.cursorIndex = targetIdx;
        this.menuItems[targetIdx].action();
        return true;
      }
    }
    return false;
  }

  private ensureNeoKantoStyles(): void {
    if (document.getElementById('neo-kanto-startmenu-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'neo-kanto-startmenu-styles';
    styleEl.textContent = `
      .neo-kanto-tactile-btn {
        transition: transform 0.08s ease, filter 0.08s ease, box-shadow 0.08s ease !important;
      }
      .neo-kanto-tactile-btn:hover {
        filter: brightness(1.15) !important;
      }
      .neo-kanto-tactile-btn:active {
        transform: translateY(2px) !important;
        box-shadow: 0 1px 0 0 #070B14 !important;
      }
      .neo-kanto-pulse-dot {
        animation: neoKantoPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes neoKantoPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(0.85); }
      }
      .neo-kanto-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-track {
        background: #080E1D;
        border-radius: 3px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-thumb {
        background: #22324F;
        border-radius: 3px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #38BDF8;
      }
      @media (max-width: 768px) {
        #start-menu-panel {
          top: calc(52px + env(safe-area-inset-top, 0px)) !important;
          right: max(10px, env(safe-area-inset-right, 10px)) !important;
          width: min(220px, calc(100vw - 20px)) !important;
        }
        #save-confirm-modal {
          width: 94vw !important;
          padding: 14px !important;
        }
        #settings-modal {
          width: 95vw !important;
          max-height: 92dvh !important;
          padding: 12px !important;
        }
        #settings-category-tabs {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        #pokedex-modal {
          width: 95vw !important;
          height: 92dvh !important;
          max-height: 92dvh !important;
          padding: 12px !important;
        }
        #pokedex-modal-workstation {
          flex-direction: column !important;
          overflow-y: auto !important;
        }
        #dex-roster-column {
          max-width: 100% !important;
          flex: none !important;
          max-height: 200px !important;
        }
        #dex-telemetry-column {
          max-width: 100% !important;
          flex: none !important;
        }
        #trainer-card-modal {
          width: 95vw !important;
          max-height: 92dvh !important;
          padding: 14px !important;
        }
        #trainer-card-bento {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
        #bug-contest-leaderboard-modal {
          width: 95vw !important;
          max-height: 92dvh !important;
          padding: 12px !important;
        }
        [data-contest-rank] {
          grid-template-columns: 50px 1fr 1fr !important;
          gap: 6px !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  private createUI(): void {
    // 1. Right-Hand Drawer Panel
    this.menuPanel = document.createElement('div');
    this.menuPanel.id = 'start-menu-panel';
    this.menuPanel.className = 'neo-kanto-scrollbar';
    this.menuPanel.style.cssText =
      'position: absolute; top: 64px; right: 18px; width: 236px; background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%); border: 3px solid #f8fafc; outline: 3px solid #1e293b; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8), inset 0 0 0 2px #38bdf8; border-radius: 10px; padding: 12px; display: none; flex-direction: column; gap: 6px; z-index: 60; pointer-events: auto; color: #f8fafc; box-sizing: border-box;';
    this.container.appendChild(this.menuPanel);

    // 2. Sub-Modal: Pokedex
    this.pokedexModal = document.createElement('div');
    this.pokedexModal.id = 'pokedex-modal';
    this.pokedexModal.className = 'neo-kanto-scrollbar';
    this.pokedexModal.style.cssText =
      'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(1080px, 96vw); height: min(720px, 90vh); max-height: 90vh; background: #0D1322; border: 2px solid #22324F; border-radius: 12px; padding: 16px 20px; box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9); display: none; flex-direction: column; gap: 12px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box; font-family: "Plus Jakarta Sans", system-ui, sans-serif;';
    this.container.appendChild(this.pokedexModal);

    // 3. Sub-Modal: Trainer Card
    this.trainerCardModal = document.createElement('div');
    this.trainerCardModal.id = 'trainer-card-modal';
    this.trainerCardModal.className = 'neo-kanto-scrollbar';
    this.trainerCardModal.style.cssText =
      'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(840px, 94vw); max-height: 90vh; overflow-y: auto; background: #0D1322; border: 2px solid #22324F; border-radius: 12px; padding: 20px; box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9); display: none; flex-direction: column; gap: 16px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box; font-family: "Plus Jakarta Sans", system-ui, sans-serif;';
    this.container.appendChild(this.trainerCardModal);

    // 3b. Sub-Modal: Bug Contest Leaderboard
    this.contestLeaderboardModal = document.createElement('div');
    this.contestLeaderboardModal.id = 'bug-contest-leaderboard-modal';
    this.contestLeaderboardModal.className = 'neo-kanto-scrollbar';
    this.contestLeaderboardModal.style.cssText =
      'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(920px, 95vw); max-height: 90vh; overflow-y: auto; background: #0D1322; border: 2px solid #22324F; border-radius: 12px; padding: 18px 20px; box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9); display: none; flex-direction: column; gap: 14px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box; font-family: "Plus Jakarta Sans", system-ui, sans-serif;';
    this.container.appendChild(this.contestLeaderboardModal);

    // 4. Sub-Modal: Save Confirmation
    this.saveConfirmModal = document.createElement('div');
    this.saveConfirmModal.id = 'save-confirm-modal';
    this.saveConfirmModal.className = 'neo-kanto-scrollbar';
    this.saveConfirmModal.style.cssText =
      'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(440px, 94vw); background: rgba(15, 23, 42, 0.98); border: 3px solid #f8fafc; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85), inset 0 0 0 2px #38bdf8; border-radius: 12px; padding: 20px; display: none; flex-direction: column; gap: 14px; z-index: 65; pointer-events: auto; color: #f8fafc; box-sizing: border-box;';
    this.container.appendChild(this.saveConfirmModal);

    // 5. Sub-Modal: Settings
    this.settingsModal = document.createElement('div');
    this.settingsModal.id = 'settings-modal';
    this.settingsModal.className = 'neo-kanto-scrollbar';
    this.settingsModal.style.cssText =
      'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(560px, 95vw); max-height: 88vh; max-height: 88dvh; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(16px); border: 3px solid #38bdf8; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.88), inset 0 0 0 2px rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 18px 20px; display: none; flex-direction: column; gap: 12px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box;';
    this.container.appendChild(this.settingsModal);

    // Instantiate Delegated Sub-Modal Renderers
    this.pokedexRenderer = new PokedexModalRenderer(
      this.pokedexModal,
      this.menuPanel,
      this.stateProvider,
      this.callbacks,
      () => this.hideMenuOnly(),
      () => this.closeAll()
    );

    this.trainerCardAndSaveRenderer = new TrainerCardAndSaveRenderer(
      this.trainerCardModal,
      this.contestLeaderboardModal,
      this.saveConfirmModal,
      this.menuPanel,
      this.stateProvider,
      this.callbacks,
      (secs) => this.formatPlayTime(secs),
      () => this.closeAll(),
      () => this.speedMultiplier
    );
  }

  private renderMenuDrawer(): void {
    const trainerName = this.stateProvider.getTrainerName();
    const money = this.stateProvider.getMoney();
    const mapName = this.stateProvider.getMapName();
    const badges = this.stateProvider.getBadges();

    this.menuPanel.innerHTML = `
      <!-- Telemetry Header -->
      <div style="
        border-bottom: 2px solid #22324F;
        padding-bottom: 10px;
        margin-bottom: 4px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">${trainerName.toUpperCase()}</span>
          <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #f59e0b;">$${money.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">📍 ${mapName}</span>
          <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #34d399;">BADGES: ${badges.length}/8</span>
        </div>
      </div>

      <!-- Option Items Container -->
      <div id="start-menu-items" style="display: flex; flex-direction: column; gap: 6px;"></div>

      <!-- Bottom Hint Bar -->
      <div style="
        border-top: 1px solid #22324F;
        padding-top: 8px;
        margin-top: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        color: #64748b;
        font-weight: 700;
      ">
        <span>[W/S] NAVIGATE</span>
        <span>[ENTER] CONFIRM</span>
      </div>
    `;

    this.renderMenuItems();
  }

  private renderMenuItems(): void {
    const container = document.getElementById('start-menu-items');
    if (!container) return;
    container.innerHTML = '';

    this.menuItems.forEach((item, idx) => {
      if (item.id === 'start-opt-trainer') {
        item.label = this.stateProvider.getTrainerName() || 'TRAINER';
      }
      const isSelected = idx === this.cursorIndex;
      const btn = document.createElement('button');
      btn.id = item.id;
      btn.className = 'neo-kanto-tactile-btn';
      btn.style.cssText = `
        background: ${isSelected ? '#1E3A8A' : '#141E33'};
        color: ${isSelected ? '#ffffff' : '#e2e8f0'};
        border: 1.5px solid ${isSelected ? '#38BDF8' : '#22324F'};
        box-shadow: 0 4px 0 0 #070B14;
        border-radius: 8px;
        padding: 9px 10px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        text-align: left;
        box-sizing: border-box;
      `;
      btn.innerHTML = `
        <span style="display: flex; align-items: center; gap: 8px;">
          <span style="color: ${isSelected ? '#FFD028' : 'transparent'}; font-size: 11px; width: 10px;">▶</span>
          <span style="font-size: 14px;">${item.icon}</span>
          <span style="letter-spacing: 0.3px;">${item.label}</span>
        </span>
        <span class="keyboard-hint" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #94a3b8; background: #080E1D; border: 1px solid #22324F; padding: 1px 5px; border-radius: 4px;">[${item.shortcut}]</span>
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

      container.appendChild(btn);
    });
  }

  private formatPlayTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Delegated Sub-Modal Actions
  public openPokedex(): void {
    this.pokedexRenderer.openPokedex();
  }

  public openTrainerCard(): void {
    this.trainerCardAndSaveRenderer.openTrainerCard();
  }

  public openBugContestLeaderboard(): void {
    this.trainerCardAndSaveRenderer.openBugContestLeaderboard();
  }

  public openSaveConfirm(): void {
    this.trainerCardAndSaveRenderer.openSaveConfirm();
  }

  public openSettings(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.activeSettingsTab = 'ALL';
    this.menuPanel.style.display = 'none';
    this.settingsModal.style.display = 'flex';
    this.renderSettingsContent();
  }

  private renderSettingsContent(): void {
    this.settingsModal.innerHTML = buildSettingsModalHtml(
      this.stateProvider,
      this.speedMultiplier,
      this.activeSettingsTab
    );
    bindSettingsEventListeners({
      settingsModal: this.settingsModal,
      menuPanel: this.menuPanel,
      stateProvider: this.stateProvider,
      callbacks: this.callbacks,
      getSpeedMultiplier: () => this.speedMultiplier,
      setSpeedMultiplier: (speed) => this.setSpeedMultiplier(speed),
      getActiveSettingsTab: () => this.activeSettingsTab,
      setActiveSettingsTab: (tab) => {
        this.activeSettingsTab = tab;
      },
      reRenderSettingsContent: () => this.renderSettingsContent(),
    });
  }
}
