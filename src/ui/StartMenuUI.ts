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

import {
  injectNeoKantoStartMenuStyles,
  createStartMenuModalElements,
  buildStartMenuDrawerShellHtml,
} from './start-menu/StartMenuDomSetup';
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
  getBgmVolume?: () => number;
  getSoundVolume?: () => number;
  getSpeedMultiplier?: () => SpeedMultiplier;
  getBattleSpeedMultiplier?: () => SpeedMultiplier;
  getTextSpeed?: () => 'SLOW' | 'MID' | 'FAST' | 'INSTANT';
  getBattleStyle?: () => 'SHIFT' | 'SET';
  getBattleAnimations?: () => boolean;
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
  onExportSave?: () => Promise<string>;
  onImportSave?: (rawJsonOrCode: string) => Promise<boolean>;
  onToggleMute?: () => boolean;
  onSetBgmVolume?: (volume: number) => void;
  onSetSoundVolume?: (volume: number) => void;
  onCycleSpeed?: () => SpeedMultiplier;
  onCycleBattleSpeed?: () => SpeedMultiplier;
  onSetBattleSpeed?: (speed: SpeedMultiplier) => SpeedMultiplier | void;
  onCycleTextSpeed?: () => 'SLOW' | 'MID' | 'FAST' | 'INSTANT';
  onSetTextSpeed?: (speed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => ('SLOW' | 'MID' | 'FAST' | 'INSTANT') | void;
  onToggleBattleAnimations?: (enabled: boolean) => boolean | void;
  onSetBattleStyle?: (style: 'SHIFT' | 'SET') => ('SHIFT' | 'SET') | void;
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
  private activeSettingsTab: 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS' = 'AUDIO';

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

  /**
   * Disambiguates KeyM in the overworld (Issue #47):
   * - Pressing M when the Start Menu is closed opens the Start Menu first (highlighting MISSIONS).
   * - Pressing M again while the Start Menu is open opens the Missions Log.
   * - Pressing Shift+M toggles the Start Menu directly.
   */
  public handleOverworldShortcutKey(code: string, shiftKey: boolean = false): boolean {
    if (code === 'KeyM') {
      if (shiftKey) {
        this.toggle();
        return true;
      }
      if (!this.isOpen()) {
        this.open();
        const missionsIdx = this.menuItems.findIndex((item) => item.id === 'start-opt-missions');
        if (missionsIdx >= 0) {
          this.cursorIndex = missionsIdx;
          this.renderMenuItems();
        }
        return true;
      }
      return this.triggerShortcut('KeyM', true);
    }
    return this.triggerShortcut(code, false);
  }

  private ensureNeoKantoStyles(): void {
    injectNeoKantoStartMenuStyles();
  }

  private createUI(): void {
    const els = createStartMenuModalElements(this.container);
    this.menuPanel = els.menuPanel;
    this.pokedexModal = els.pokedexModal;
    this.trainerCardModal = els.trainerCardModal;
    this.contestLeaderboardModal = els.contestLeaderboardModal;
    this.saveConfirmModal = els.saveConfirmModal;
    this.settingsModal = els.settingsModal;

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
    this.menuPanel.innerHTML = buildStartMenuDrawerShellHtml({
      trainerName,
      money,
      mapName,
      badgesCount: badges.length,
    });
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
    this.activeSettingsTab = 'AUDIO';
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
