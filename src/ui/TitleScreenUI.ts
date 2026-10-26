import type { GameOptions, SavePreview, SpeedMultiplier } from '../types/game';
import { SaveManager } from '../core/SaveManager';
import { BattleAudio } from '../audio/BattleAudio';

export interface TitleScreenCallbacks {
  onUnlockAudio?: () => Promise<void> | void;
  onContinue: () => Promise<void> | void;
  onNewGame: () => Promise<void> | void;
  onOptionsChanged?: (options: GameOptions) => void;
}

export type TitleMenuOptionId = 'CONTINUE' | 'NEW_GAME' | 'OPTIONS';

/**
 * Crystal Overdrive Title Screen UI (Ticket 4.2).
 * Renders the crystalline midnight backdrop, iridescent title typography,
 * upward-drifting crystal particle field, audio unlock gate, Save Preview Card,
 * New Game overwrite confirmation modal, and Options modal.
 * Supports both full browser DOM rendering and headless unit testing.
 */
export class TitleScreenUI {
  private container: HTMLElement | null = null;
  private rootElement: HTMLDivElement | null = null;
  private gateElement: HTMLDivElement | null = null;
  private menuElement: HTMLDivElement | null = null;
  private overwriteModalElement: HTMLDivElement | null = null;
  private optionsModalElement: HTMLDivElement | null = null;

  private savePreview: SavePreview | null;
  private options: GameOptions;
  private callbacks: TitleScreenCallbacks;

  private visible: boolean = true;
  private gateUnlocked: boolean = false;
  private cursorIndex: number = 0; // 0 = CONTINUE, 1 = NEW_GAME, 2 = OPTIONS
  private overwriteConfirmOpen: boolean = false;
  private overwriteCursorIndex: number = 1; // 0 = YES (OVERWRITE), 1 = NO (CANCEL)
  private optionsModalOpen: boolean = false;

  private readonly menuOptions: TitleMenuOptionId[] = ['CONTINUE', 'NEW_GAME', 'OPTIONS'];
  private boundKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    containerId: string = 'modal-container',
    savePreview: SavePreview | null = null,
    initialOptions?: GameOptions,
    callbacks: TitleScreenCallbacks = {
      onContinue: () => {},
      onNewGame: () => {},
    }
  ) {
    this.savePreview = savePreview;
    this.options = initialOptions
      ? { ...initialOptions }
      : SaveManager.getDefaultOptions();
    this.callbacks = callbacks;

    // Default cursor focus: CONTINUE (0) when save exists, NEW_GAME (1) when no save exists
    this.cursorIndex = this.hasSave() ? 0 : 1;

    if (typeof document !== 'undefined') {
      const el = document.getElementById(containerId);
      if (el) {
        this.container = el;
        this.injectStyles();
        this.createDOM();
        this.attachKeyboardListeners();
      }
    }
  }

  public hasSave(): boolean {
    return this.savePreview !== null;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isGateUnlocked(): boolean {
    return this.gateUnlocked;
  }

  public getCursorIndex(): number {
    return this.cursorIndex;
  }

  public getFocusedOption(): TitleMenuOptionId {
    return this.menuOptions[this.cursorIndex];
  }

  public isOverwriteConfirmOpen(): boolean {
    return this.overwriteConfirmOpen;
  }

  public getOverwriteCursorIndex(): number {
    return this.overwriteCursorIndex;
  }

  public isOptionsModalOpen(): boolean {
    return this.optionsModalOpen;
  }

  public getOptions(): GameOptions {
    return { ...this.options };
  }

  public getSavePreview(): SavePreview | null {
    return this.savePreview;
  }

  public setSavePreview(preview: SavePreview | null): void {
    this.savePreview = preview;
    this.cursorIndex = this.hasSave() ? 0 : 1;
    this.syncDOM();
  }

  /**
   * Formats a human-readable summary string for the Save Preview Card.
   */
  public formatSavePreviewSummary(): string {
    if (!this.savePreview) {
      return 'No Saved Data';
    }
    const genderSymbol = this.savePreview.gender === 'GIRL' ? '♀' : '♂';
    const leadInfo = this.savePreview.partyLeadSpeciesId
      ? ` • Lead: ${this.savePreview.partyLeadSpeciesId.toUpperCase()} Lv.${this.savePreview.partyLeadLevel ?? 5}`
      : '';
    return `${this.savePreview.playerName} ${genderSymbol} | ${this.savePreview.currentLocationName} | Badges: ${this.savePreview.badgeCount} / 8 | Pokédex: ${this.savePreview.pokedexCount} | Time: ${this.savePreview.playTimeFormatted}${leadInfo}`;
  }

  /**
   * Unlocks the "PRESS ANY KEY OR CLICK TO START" gate, triggers AudioManager unlock,
   * plays confirm SFX, and reveals the Main Menu.
   */
  public async unlockGate(): Promise<void> {
    if (this.gateUnlocked) return;
    this.gateUnlocked = true;
    BattleAudio.playMenuSound('CONFIRM');
    if (this.callbacks.onUnlockAudio) {
      await this.callbacks.onUnlockAudio();
    }
    this.syncDOM();
  }

  /**
   * Moves the main menu cursor (or overwrite confirmation cursor), automatically
   * skipping disabled CONTINUE when no save exists.
   */
  public moveCursor(delta: -1 | 1): void {
    if (!this.gateUnlocked) {
      void this.unlockGate();
      return;
    }

    if (this.optionsModalOpen) {
      return;
    }

    if (this.overwriteConfirmOpen) {
      this.overwriteCursorIndex = this.overwriteCursorIndex === 0 ? 1 : 0;
      BattleAudio.playMenuSound('CURSOR');
      this.syncDOM();
      return;
    }

    const validIndices = this.hasSave() ? [0, 1, 2] : [1, 2];
    const currentPos = validIndices.indexOf(this.cursorIndex);
    const nextPos = (currentPos + delta + validIndices.length) % validIndices.length;
    this.cursorIndex = validIndices[nextPos];
    BattleAudio.playMenuSound('CURSOR');
    this.syncDOM();
  }

  /**
   * Confirms the currently focused option or modal prompt.
   */
  public async confirmSelection(): Promise<void> {
    if (!this.gateUnlocked) {
      await this.unlockGate();
      return;
    }

    if (this.optionsModalOpen) {
      this.closeOptionsModal();
      return;
    }

    if (this.overwriteConfirmOpen) {
      if (this.overwriteCursorIndex === 0) {
        // Confirm Overwrite -> Proceed with New Game
        this.overwriteConfirmOpen = false;
        BattleAudio.playMenuSound('CONFIRM');
        this.hide();
        await this.callbacks.onNewGame();
      } else {
        // Cancel Overwrite
        this.cancelModal();
      }
      return;
    }

    const selected = this.getFocusedOption();
    if (selected === 'CONTINUE') {
      if (!this.hasSave()) {
        BattleAudio.playMenuSound('CANCEL');
        return;
      }
      BattleAudio.playMenuSound('CONFIRM');
      this.hide();
      await this.callbacks.onContinue();
    } else if (selected === 'NEW_GAME') {
      if (this.hasSave()) {
        // Gate New Game behind Overwrite Confirmation Modal when a save exists
        this.overwriteConfirmOpen = true;
        this.overwriteCursorIndex = 1; // Default to safe 'NO (CANCEL)'
        BattleAudio.playMenuSound('CONFIRM');
        this.syncDOM();
      } else {
        BattleAudio.playMenuSound('CONFIRM');
        this.hide();
        await this.callbacks.onNewGame();
      }
    } else if (selected === 'OPTIONS') {
      this.optionsModalOpen = true;
      BattleAudio.playMenuSound('CONFIRM');
      this.syncDOM();
    }
  }

  /**
   * Cancels / closes any active sub-modal (`Overwrite Confirmation` or `Options`).
   */
  public cancelModal(): void {
    if (this.overwriteConfirmOpen) {
      this.overwriteConfirmOpen = false;
      BattleAudio.playMenuSound('CANCEL');
      this.syncDOM();
    } else if (this.optionsModalOpen) {
      this.closeOptionsModal();
    }
  }

  public openOptionsModal(): void {
    this.optionsModalOpen = true;
    BattleAudio.playMenuSound('CONFIRM');
    this.syncDOM();
  }

  public closeOptionsModal(): void {
    if (!this.optionsModalOpen) return;
    this.optionsModalOpen = false;
    BattleAudio.playMenuSound('CANCEL');
    this.syncDOM();
  }

  /**
   * Updates one or more GameOptions fields and notifies `onOptionsChanged`.
   */
  public updateOptions(patch: Partial<GameOptions>): GameOptions {
    if (patch.bgmVolume !== undefined) {
      this.options.bgmVolume = Math.max(0, Math.min(1, Number(patch.bgmVolume)));
    }
    if (patch.soundVolume !== undefined) {
      this.options.soundVolume = Math.max(0, Math.min(1, Number(patch.soundVolume)));
    }
    if (patch.textSpeed !== undefined) {
      this.options.textSpeed = patch.textSpeed;
    }
    if (patch.battleAnimations !== undefined) {
      this.options.battleAnimations = Boolean(patch.battleAnimations);
    }
    if (patch.playerSpeedDefault !== undefined) {
      this.options.playerSpeedDefault = patch.playerSpeedDefault;
    }
    if (patch.battleSpeedMultiplier !== undefined) {
      this.options.battleSpeedMultiplier = patch.battleSpeedMultiplier;
    }
    if (patch.chiptuneMode !== undefined) {
      this.options.chiptuneMode = patch.chiptuneMode;
    }
    if (patch.lowHpBeepEnabled !== undefined) {
      this.options.lowHpBeepEnabled = patch.lowHpBeepEnabled;
    }

    if (this.callbacks.onOptionsChanged) {
      this.callbacks.onOptionsChanged({ ...this.options });
    }
    this.syncDOM();
    return { ...this.options };
  }

  /**
   * Handles keyboard events (`ArrowUp`, `ArrowDown`, `KeyW`, `KeyS`, `ArrowLeft`, `ArrowRight`,
   * `Enter`, `Space`, `KeyZ`, `Escape`, `KeyX`).
   */
  public handleKeyDown(e: { code?: string; key?: string; preventDefault?: () => void }): void {
    if (!this.visible) return;

    const code = e.code || '';
    const key = e.key || '';

    if (!this.gateUnlocked) {
      e.preventDefault?.();
      void this.unlockGate();
      return;
    }

    if (
      code === 'ArrowUp' ||
      code === 'KeyW' ||
      key === 'ArrowUp' ||
      key === 'w' ||
      key === 'W' ||
      (this.overwriteConfirmOpen && (code === 'ArrowLeft' || key === 'ArrowLeft' || code === 'KeyA'))
    ) {
      e.preventDefault?.();
      this.moveCursor(-1);
      return;
    }

    if (
      code === 'ArrowDown' ||
      code === 'KeyS' ||
      key === 'ArrowDown' ||
      key === 's' ||
      key === 'S' ||
      (this.overwriteConfirmOpen && (code === 'ArrowRight' || key === 'ArrowRight' || code === 'KeyD'))
    ) {
      e.preventDefault?.();
      this.moveCursor(1);
      return;
    }

    if (
      code === 'Enter' ||
      code === 'Space' ||
      code === 'KeyZ' ||
      key === 'Enter' ||
      key === ' ' ||
      key === 'z' ||
      key === 'Z'
    ) {
      e.preventDefault?.();
      void this.confirmSelection();
      return;
    }

    if (
      code === 'Escape' ||
      code === 'KeyX' ||
      key === 'Escape' ||
      key === 'x' ||
      key === 'X'
    ) {
      e.preventDefault?.();
      this.cancelModal();
    }
  }

  public show(): void {
    this.visible = true;
    this.syncDOM();
  }

  public hide(): void {
    this.visible = false;
    this.overwriteConfirmOpen = false;
    this.optionsModalOpen = false;
    this.syncDOM();
  }

  public destroy(): void {
    if (typeof window !== 'undefined' && this.boundKeyDownHandler) {
      window.removeEventListener('keydown', this.boundKeyDownHandler);
      this.boundKeyDownHandler = null;
    }
    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
    }
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('crystal-title-screen-styles')) return;

    const style = document.createElement('style');
    style.id = 'crystal-title-screen-styles';
    style.textContent = `
      @keyframes crystalFloatUp {
        0% {
          transform: translateY(105vh) rotate(0deg) scale(0.75);
          opacity: 0;
        }
        15% {
          opacity: 0.75;
        }
        85% {
          opacity: 0.65;
        }
        100% {
          transform: translateY(-15vh) rotate(220deg) scale(1.15);
          opacity: 0;
        }
      }
      @keyframes crystalLogoShimmer {
        0%, 100% {
          filter: drop-shadow(0 0 18px rgba(56, 189, 248, 0.65)) drop-shadow(0 0 36px rgba(168, 85, 247, 0.35));
        }
        50% {
          filter: drop-shadow(0 0 26px rgba(125, 211, 252, 0.95)) drop-shadow(0 0 48px rgba(232, 121, 249, 0.65));
        }
      }
      @keyframes crystalBlinkPrompt {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.28; transform: scale(0.98); }
      }
      .crystal-particle {
        position: absolute;
        pointer-events: none;
        background: linear-gradient(135deg, rgba(125, 211, 252, 0.85), rgba(192, 132, 252, 0.45));
        border: 1px solid rgba(224, 242, 254, 0.75);
        clip-path: polygon(50% 0%, 92% 50%, 50% 100%, 8% 50%);
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.55);
        animation: crystalFloatUp linear infinite;
      }
    `;
    document.head.appendChild(style);
  }

  private createDOM(): void {
    if (!this.container || typeof document === 'undefined') return;

    this.rootElement = document.createElement('div');
    this.rootElement.id = 'title-screen-root';
    this.rootElement.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: max(20px, env(safe-area-inset-top, 20px)) max(20px, env(safe-area-inset-right, 20px)) max(24px, env(safe-area-inset-bottom, 24px)) max(20px, env(safe-area-inset-left, 20px));
      box-sizing: border-box;
      pointer-events: auto;
      overflow: hidden;
      z-index: 100;
      user-select: none;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Upward drifting crystal particles layer
    const particleLayer = document.createElement('div');
    particleLayer.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    `;

    const particleSpecs = [
      { left: '8%', size: 16, dur: 9.5, delay: -1.2 },
      { left: '18%', size: 11, dur: 12.0, delay: -4.5 },
      { left: '29%', size: 20, dur: 10.8, delay: -7.1 },
      { left: '42%', size: 13, dur: 8.6, delay: -2.8 },
      { left: '55%', size: 22, dur: 11.4, delay: -6.0 },
      { left: '67%', size: 14, dur: 9.2, delay: -3.4 },
      { left: '78%', size: 18, dur: 12.6, delay: -8.3 },
      { left: '89%', size: 12, dur: 10.1, delay: -5.0 },
      { left: '94%', size: 15, dur: 11.0, delay: -0.7 },
    ];
    for (const p of particleSpecs) {
      const shard = document.createElement('div');
      shard.className = 'crystal-particle';
      shard.style.width = `${p.size}px`;
      shard.style.height = `${Math.round(p.size * 1.45)}px`;
      shard.style.left = p.left;
      shard.style.animationDuration = `${p.dur}s`;
      shard.style.animationDelay = `${p.delay}s`;
      particleLayer.appendChild(shard);
    }
    this.rootElement.appendChild(particleLayer);

    // Top Version Badge
    const topBar = document.createElement('div');
    topBar.style.cssText = `
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 1px;
      font-family: 'Space Mono', monospace;
    `;
    topBar.innerHTML = `
      <span>💎 JOHTO GEN II REIMAGINED</span>
      <span>60FPS PIXI v8 ENGINE</span>
    `;
    this.rootElement.appendChild(topBar);

    // Center Content Wrapper (Logo + Gate or Main Menu)
    const centerWrapper = document.createElement('div');
    centerWrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 22px;
      width: min(560px, 94vw);
      z-index: 2;
      margin: auto 0;
    `;

    // Iridescent Logo Typography
    const headerBlock = document.createElement('div');
    headerBlock.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      animation: crystalLogoShimmer 3.4s infinite ease-in-out;
    `;
    headerBlock.innerHTML = `
      <h1 style="
        margin: 0;
        font-size: clamp(32px, 6.5vw, 54px);
        font-weight: 900;
        letter-spacing: 2px;
        line-height: 1.05;
        background: linear-gradient(180deg, #ffffff 0%, #bae6fd 38%, #38bdf8 70%, #c084fc 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-transform: uppercase;
      ">CRYSTAL OVERDRIVE</h1>
      <div style="
        font-size: clamp(11px, 2.2vw, 13px);
        font-weight: 800;
        letter-spacing: 2.5px;
        color: #cbd5e1;
        text-transform: uppercase;
      ">A HIGH-PERFORMANCE 2D REIMAGINATION</div>
    `;
    centerWrapper.appendChild(headerBlock);

    // Audio Unlock Gate ("PRESS ANY KEY OR CLICK TO START")
    this.gateElement = document.createElement('div');
    this.gateElement.id = 'title-unlock-gate';
    this.gateElement.style.cssText = `
      margin-top: 24px;
      max-width: 92vw;
      width: fit-content;
      box-sizing: border-box;
      padding: 12px clamp(14px, 4vw, 28px);
      border-radius: 8px;
      background: #0D1322;
      border: 2px solid #38BDF8;
      box-shadow: 0 4px 0 0 #070B14;
      color: #f8fafc;
      font-size: clamp(11px, 3.2vw, 14px);
      font-weight: 800;
      letter-spacing: clamp(0.6px, 0.35vw, 1.5px);
      line-height: 1.35;
      white-space: normal;
      cursor: pointer;
      text-align: center;
      font-family: 'Space Mono', monospace;
      animation: crystalBlinkPrompt 1.4s infinite ease-in-out;
    `;
    this.gateElement.textContent = '⚡ PRESS ANY KEY OR CLICK TO START ⚡';
    this.gateElement.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.unlockGate();
    });
    centerWrapper.appendChild(this.gateElement);

    // Main Menu Container (revealed after gate unlock)
    this.menuElement = document.createElement('div');
    this.menuElement.id = 'title-main-menu';
    this.menuElement.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    `;
    centerWrapper.appendChild(this.menuElement);

    this.rootElement.appendChild(centerWrapper);

    // Overwrite Confirmation Modal
    this.overwriteModalElement = document.createElement('div');
    this.overwriteModalElement.id = 'title-overwrite-modal';
    this.overwriteModalElement.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      z-index: 20;
      padding: 20px;
    `;
    this.rootElement.appendChild(this.overwriteModalElement);

    // Options Modal
    this.optionsModalElement = document.createElement('div');
    this.optionsModalElement.id = 'title-options-modal';
    this.optionsModalElement.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      z-index: 20;
      padding: 20px;
    `;
    this.rootElement.appendChild(this.optionsModalElement);

    // Footer Controls Legend
    const footerBar = document.createElement('div');
    footerBar.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-align: center;
      z-index: 2;
    `;
    footerBar.textContent = 'Navigate: W/S or Up/Down • Confirm: Enter / Space / Z / Tap • Back: Esc / X';
    this.rootElement.appendChild(footerBar);

    // Clicking anywhere on the root while locked unlocks the gate
    this.rootElement.addEventListener('click', () => {
      if (!this.gateUnlocked) {
        void this.unlockGate();
      }
    });

    this.container.appendChild(this.rootElement);
    this.syncDOM();
  }

  private attachKeyboardListeners(): void {
    if (typeof window === 'undefined') return;
    this.boundKeyDownHandler = (e: KeyboardEvent) => {
      if (!this.visible) return;
      this.handleKeyDown(e);
    };
    window.addEventListener('keydown', this.boundKeyDownHandler);
  }

  private syncDOM(): void {
    if (!this.rootElement || !this.gateElement || !this.menuElement) return;

    this.rootElement.style.display = this.visible ? 'flex' : 'none';
    if (!this.visible) return;

    this.gateElement.style.display = this.gateUnlocked ? 'none' : 'block';
    this.menuElement.style.display = this.gateUnlocked ? 'flex' : 'none';

    this.renderMainMenu();
    this.renderOverwriteModal();
    this.renderOptionsModal();
  }

  private renderMainMenu(): void {
    if (!this.menuElement) return;
    this.menuElement.innerHTML = '';

    const hasSaveData = this.hasSave();
    const preview = this.savePreview;

    // 1. CONTINUE Card / Button
    const continueFocused = this.cursorIndex === 0;
    const continueBtn = document.createElement('div');
    continueBtn.id = 'title-opt-continue';
    continueBtn.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px 18px;
      border-radius: 10px;
      background: ${
        !hasSaveData
          ? 'rgba(13, 19, 34, 0.42)'
          : continueFocused
          ? '#141E33'
          : '#0D1322'
      };
      border: 2px solid ${
        !hasSaveData
          ? '#22324F'
          : continueFocused
          ? '#38BDF8'
          : '#22324F'
      };
      box-shadow: 0 4px 0 0 #070B14;
      opacity: ${hasSaveData ? '1' : '0.48'};
      cursor: ${hasSaveData ? 'pointer' : 'not-allowed'};
      transition: all 0.12s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;

    if (hasSaveData && preview) {
      const genderBadge =
        preview.gender === 'GIRL'
          ? `<span style="color: #f43f5e; font-weight: 900;">♀</span>`
          : `<span style="color: #38bdf8; font-weight: 900;">♂</span>`;
      const leadSpecies = preview.partyLeadSpeciesId
        ? `${preview.partyLeadSpeciesId.toUpperCase()} (Lv.${preview.partyLeadLevel ?? 5})`
        : 'Party Ready';

      continueBtn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 15px; font-weight: 800; color: #f8fafc; letter-spacing: 0.8px;">
            ${continueFocused ? '▶ ' : ''}CONTINUE JOURNEY
          </div>
          <span style="
            background: rgba(56, 189, 248, 0.15);
            border: 1.5px solid #38bdf8;
            color: #7dd3fc;
            padding: 2px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 2px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
          ">📍 ${preview.currentLocationName}</span>
        </div>
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
          gap: 8px;
          padding-top: 8px;
          border-top: 1.5px solid #22324F;
          font-size: 11.5px;
          color: #cbd5e1;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
        ">
          <div>👤 ${preview.playerName} ${genderBadge}</div>
          <div>🏅 BADGES: <span style="color: #facc15;">${preview.badgeCount} / 8</span></div>
          <div>📕 POKéDEX: <span style="color: #4ade80;">${preview.pokedexCount}</span></div>
          <div>⏱️ TIME: <span style="color: #f8fafc;">${preview.playTimeFormatted}</span></div>
          <div>⚔️ LEAD: <span style="color: #38bdf8;">${leadSpecies}</span></div>
        </div>
      `;
    } else {
      continueBtn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 15px; font-weight: 800; color: #94a3b8;">CONTINUE</span>
          <span style="font-size: 11px; color: #64748b; font-weight: 700; font-family: 'Space Mono', monospace;">NO SAVE DATA FOUND</span>
        </div>
      `;
    }

    continueBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!hasSaveData) {
        BattleAudio.playMenuSound('CANCEL');
        return;
      }
      this.cursorIndex = 0;
      void this.confirmSelection();
    });
    this.menuElement.appendChild(continueBtn);

    // 2. NEW GAME Button
    const newGameFocused = this.cursorIndex === 1;
    const newGameBtn = document.createElement('div');
    newGameBtn.id = 'title-opt-new-game';
    newGameBtn.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-radius: 10px;
      background: ${newGameFocused ? '#141E33' : '#0D1322'};
      border: 2px solid ${newGameFocused ? '#38BDF8' : '#22324F'};
      box-shadow: 0 4px 0 0 #070B14;
      cursor: pointer;
      transition: all 0.12s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;
    newGameBtn.innerHTML = `
      <span style="font-size: 15px; font-weight: 800; color: #f8fafc; letter-spacing: 0.8px;">
        ${newGameFocused ? '▶ ' : ''}NEW GAME
      </span>
      <span style="font-size: 11px; font-weight: 700; color: #94a3b8; font-family: 'Space Mono', monospace;">Start Fresh in New Bark Town</span>
    `;
    newGameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cursorIndex = 1;
      void this.confirmSelection();
    });
    this.menuElement.appendChild(newGameBtn);

    // 3. OPTIONS Button
    const optionsFocused = this.cursorIndex === 2;
    const optionsBtn = document.createElement('div');
    optionsBtn.id = 'title-opt-options';
    optionsBtn.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-radius: 10px;
      background: ${optionsFocused ? '#141E33' : '#0D1322'};
      border: 2px solid ${optionsFocused ? '#38BDF8' : '#22324F'};
      box-shadow: 0 4px 0 0 #070B14;
      cursor: pointer;
      transition: all 0.12s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;
    optionsBtn.innerHTML = `
      <span style="font-size: 15px; font-weight: 800; color: #f8fafc; letter-spacing: 0.8px;">
        ${optionsFocused ? '▶ ' : ''}OPTIONS
      </span>
      <span style="font-size: 11px; font-weight: 700; color: #94a3b8; font-family: 'Space Mono', monospace;">Audio, Text Speed & Overdrive</span>
    `;
    optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cursorIndex = 2;
      void this.confirmSelection();
    });
    this.menuElement.appendChild(optionsBtn);
  }

  private renderOverwriteModal(): void {
    if (!this.overwriteModalElement) return;
    this.overwriteModalElement.style.display = this.overwriteConfirmOpen ? 'flex' : 'none';
    if (!this.overwriteConfirmOpen) return;

    const yesFocused = this.overwriteCursorIndex === 0;
    const noFocused = this.overwriteCursorIndex === 1;

    this.overwriteModalElement.innerHTML = `
      <div style="
        background: #0D1322;
        border: 2px solid #EF4444;
        border-radius: 12px;
        padding: 24px;
        width: min(440px, 92vw);
        box-shadow: 0 8px 0 0 #070B14;
        display: flex;
        flex-direction: column;
        gap: 16px;
        color: #f8fafc;
        font-family: 'Plus Jakarta Sans', sans-serif;
      ">
        <div style="font-size: 17px; font-weight: 800; color: #fb7185; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;">
          ⚠️ OVERWRITE EXISTING SAVE?
        </div>
        <div style="font-size: 13.5px; line-height: 1.5; color: #cbd5e1;">
          An active adventure for <strong>${this.savePreview?.playerName ?? 'GOLD'}</strong> (${this.savePreview?.playTimeFormatted ?? '00:00'}) already exists. Saving in the new adventure will replace the previous save.
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 6px;">
          <button id="overwrite-confirm-yes" style="
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            background: ${yesFocused ? '#DC2626' : '#141E33'};
            color: #ffffff;
            border: 1.5px solid ${yesFocused ? '#FCA5A5' : '#22324F'};
            box-shadow: 0 3px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
          ">${yesFocused ? '▶ ' : ''}START NEW GAME</button>
          <button id="overwrite-confirm-no" style="
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            background: ${noFocused ? '#0284C7' : '#141E33'};
            color: #ffffff;
            border: 1.5px solid ${noFocused ? '#7DD3FC' : '#22324F'};
            box-shadow: 0 3px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
          ">${noFocused ? '▶ ' : ''}CANCEL</button>
        </div>
      </div>
    `;

    const yesBtn = this.overwriteModalElement.querySelector('#overwrite-confirm-yes');
    const noBtn = this.overwriteModalElement.querySelector('#overwrite-confirm-no');

    yesBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.overwriteCursorIndex = 0;
      void this.confirmSelection();
    });
    noBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.overwriteCursorIndex = 1;
      void this.confirmSelection();
    });
  }

  private renderOptionsModal(): void {
    if (!this.optionsModalElement) return;
    this.optionsModalElement.style.display = this.optionsModalOpen ? 'flex' : 'none';
    if (!this.optionsModalOpen) return;

    const textSpeeds: Array<GameOptions['textSpeed']> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
    const battleSpeeds: SpeedMultiplier[] = [1, 2, 3];
    const speeds: SpeedMultiplier[] = [1, 2, 3, 4];

    this.optionsModalElement.innerHTML = `
      <div style="
        background: #0D1322;
        border: 2px solid #38BDF8;
        border-radius: 12px;
        padding: 24px;
        width: min(480px, 94vw);
        box-shadow: 0 8px 0 0 #070B14;
        display: flex;
        flex-direction: column;
        gap: 16px;
        color: #f8fafc;
        font-family: 'Plus Jakarta Sans', sans-serif;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #38bdf8; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;">⚙️ SYSTEM OPTIONS</h3>
          <button id="options-close-btn" style="
            background: #141E33;
            color: #cbd5e1;
            border: 1.5px solid #22324F;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
          ">✕ CLOSE</button>
        </div>

        <!-- BGM Volume -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
            <span>🎵 BGM VOLUME</span>
            <span style="color: #38bdf8; font-family: 'Space Mono', monospace;">${Math.round(this.options.bgmVolume * 100)}%</span>
          </div>
          <input id="opt-bgm-slider" type="range" min="0" max="100" value="${Math.round(this.options.bgmVolume * 100)}" style="width: 100%; cursor: pointer;" />
        </div>

        <!-- SFX Volume -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
            <span>🔊 SFX VOLUME</span>
            <span style="color: #38bdf8; font-family: 'Space Mono', monospace;">${Math.round(this.options.soundVolume * 100)}%</span>
          </div>
          <input id="opt-sfx-slider" type="range" min="0" max="100" value="${Math.round(this.options.soundVolume * 100)}" style="width: 100%; cursor: pointer;" />
        </div>

        <!-- Text Speed -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 13px; font-weight: 700;">💬 TEXT SPEED</span>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
            ${textSpeeds
              .map(
                (ts) => `
              <button data-text-speed="${ts}" style="
                padding: 8px 6px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                background: ${this.options.textSpeed === ts ? '#0284c7' : '#141E33'};
                color: #ffffff;
                border: 1.5px solid ${this.options.textSpeed === ts ? '#38bdf8' : '#22324F'};
                box-shadow: 0 2px 0 0 #070B14;
                font-family: 'Space Mono', monospace;
              ">${ts}</button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Battle Animations -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 700;">✨ BATTLE ANIMATIONS</span>
          <button id="opt-battle-anim-btn" style="
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: ${this.options.battleAnimations ? '#059669' : '#141E33'};
            color: #ffffff;
            border: 1.5px solid ${this.options.battleAnimations ? '#10b981' : '#22324F'};
            box-shadow: 0 2px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
          ">${this.options.battleAnimations ? 'ON' : 'OFF'}</button>
        </div>

        <!-- 8-Bit Chiptune APU Synthesis Mode -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 700;">🎵 8-BIT APU CHIPTUNE BGM</span>
          <button id="opt-chiptune-btn" style="
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: ${this.options.chiptuneMode ? '#7c3aed' : '#141E33'};
            color: #ffffff;
            border: 1.5px solid ${this.options.chiptuneMode ? '#a855f7' : '#22324F'};
            box-shadow: 0 2px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
          ">${this.options.chiptuneMode ? 'ON' : 'OFF'}</button>
        </div>

        <!-- Low-HP Warning Alarm Beep -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 700;">🚨 LOW-HP WARNING BEEP</span>
          <button id="opt-lowhp-beep-btn" style="
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: ${(this.options.lowHpBeepEnabled ?? true) ? '#059669' : '#141E33'};
            color: #ffffff;
            border: 1.5px solid ${(this.options.lowHpBeepEnabled ?? true) ? '#10b981' : '#22324F'};
            box-shadow: 0 2px 0 0 #070B14;
            font-family: 'Space Mono', monospace;
          ">${(this.options.lowHpBeepEnabled ?? true) ? 'ON' : 'OFF'}</button>
        </div>

        <!-- Battle Speed Multiplier -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 13px; font-weight: 700;">⚔️ BATTLE SPEED</span>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            ${battleSpeeds
              .map(
                (spd) => `
              <button data-battle-speed="${spd}" style="
                padding: 8px 6px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                background: ${(this.options.battleSpeedMultiplier ?? 1) === spd ? '#2563eb' : '#141E33'};
                color: #ffffff;
                border: 1.5px solid ${(this.options.battleSpeedMultiplier ?? 1) === spd ? '#60a5fa' : '#22324F'};
                box-shadow: 0 2px 0 0 #070B14;
                font-family: 'Space Mono', monospace;
              ">${spd === 1 ? '1x NORMAL' : spd === 2 ? '2x FAST' : '3x TURBO'}</button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Default Overdrive Movement Speed -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 13px; font-weight: 700;">⚡ DEFAULT OVERDRIVE SPEED</span>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
            ${speeds
              .map(
                (spd) => `
              <button data-default-speed="${spd}" style="
                padding: 8px 6px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                background: ${this.options.playerSpeedDefault === spd ? '#7c3aed' : '#141E33'};
                color: #ffffff;
                border: 1.5px solid ${this.options.playerSpeedDefault === spd ? '#a855f7' : '#22324F'};
                box-shadow: 0 2px 0 0 #070B14;
                font-family: 'Space Mono', monospace;
              ">${spd}x</button>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.optionsModalElement.querySelector('#options-close-btn');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeOptionsModal();
    });

    const bgmSlider = this.optionsModalElement.querySelector('#opt-bgm-slider') as HTMLInputElement | null;
    bgmSlider?.addEventListener('input', (e) => {
      e.stopPropagation();
      const val = Number((e.target as HTMLInputElement).value) / 100;
      this.updateOptions({ bgmVolume: val });
    });

    const sfxSlider = this.optionsModalElement.querySelector('#opt-sfx-slider') as HTMLInputElement | null;
    sfxSlider?.addEventListener('input', (e) => {
      e.stopPropagation();
      const val = Number((e.target as HTMLInputElement).value) / 100;
      this.updateOptions({ soundVolume: val });
    });

    const textSpeedBtns = this.optionsModalElement.querySelectorAll
      ? this.optionsModalElement.querySelectorAll('[data-text-speed]')
      : [];
    textSpeedBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ts = (btn as HTMLElement).getAttribute('data-text-speed') as GameOptions['textSpeed'];
        BattleAudio.playMenuSound('CURSOR');
        this.updateOptions({ textSpeed: ts });
      });
    });

    const animBtn = this.optionsModalElement.querySelector('#opt-battle-anim-btn');
    animBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      BattleAudio.playMenuSound('CURSOR');
      this.updateOptions({ battleAnimations: !this.options.battleAnimations });
    });

    const chiptuneBtn = this.optionsModalElement.querySelector('#opt-chiptune-btn');
    chiptuneBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      BattleAudio.playMenuSound('CURSOR');
      this.updateOptions({ chiptuneMode: !(this.options.chiptuneMode ?? false) });
    });

    const lowHpBeepBtn = this.optionsModalElement.querySelector('#opt-lowhp-beep-btn');
    lowHpBeepBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const next = !(this.options.lowHpBeepEnabled ?? true);
      BattleAudio.setLowHpBeepEnabled(next);
      BattleAudio.playMenuSound('CURSOR');
      this.updateOptions({ lowHpBeepEnabled: next });
    });

    const battleSpeedBtns = this.optionsModalElement.querySelectorAll
      ? this.optionsModalElement.querySelectorAll('[data-battle-speed]')
      : [];
    battleSpeedBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const spd = Number((btn as HTMLElement).getAttribute('data-battle-speed')) as SpeedMultiplier;
        BattleAudio.playMenuSound('CURSOR');
        this.updateOptions({ battleSpeedMultiplier: spd });
      });
    });

    const speedBtns = this.optionsModalElement.querySelectorAll
      ? this.optionsModalElement.querySelectorAll('[data-default-speed]')
      : [];
    speedBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const spd = Number((btn as HTMLElement).getAttribute('data-default-speed')) as SpeedMultiplier;
        BattleAudio.playMenuSound('CURSOR');
        this.updateOptions({ playerSpeedDefault: spd });
      });
    });
  }
}
