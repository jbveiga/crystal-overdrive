/**
 * @fileoverview HTML5/CSS vector overworld HUD managing D-Pad controls, dialogue modals, toasts, and Pokégear.
 * @module ui/OverworldHUD
 * @role Overworld HUD Interface Controller
 * @exports OverworldHUD, OverworldHUDOptions
 * @layer ui
 * @sections L1-7: Micro-Header & Types | L8-346: Core Implementation | L347-692: Public Interface & Exports
 */

import type { Direction, SpeedMultiplier, RoamerState, TouchControlStyle } from '../types/game';
import { eventBus } from '../core/EventBus';
import { BattleAudio } from '../audio/BattleAudio';
import { OverworldTouchAndKeyController } from './hud/OverworldTouchAndKeyController';
import { OverworldCutsceneAndPokegearModals } from './hud/OverworldCutsceneAndPokegearModals';
import { getOverworldHudTemplateHtml, getOverworldHudResponsiveStyles } from './OverworldHUDTemplate';
import { updateRouteNameBanner } from './OverworldSignpostBanner';

export interface OverworldHUDOptions {
  onSpeedCycle?: () => SpeedMultiplier;
  onMuteToggle?: () => boolean;
  onMenuToggle?: () => void;
  onPartyOpen?: () => void;
  onBagOpen?: () => void;
  onMartOpen?: () => void;
  onSaveGame?: () => void;
  onInteract?: () => void;
  onRadarToggle?: () => boolean;
  isModalOpen?: () => boolean;
}

export class OverworldHUD {
  public static readonly DIALOGUE_CHAR_DELAY_MS = 12;

  private textSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' = 'MID';

  public setTextSpeed(speed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT'): void {
    this.textSpeed = speed;
  }

  public getTextSpeed(): 'SLOW' | 'MID' | 'FAST' | 'INSTANT' {
    return this.textSpeed;
  }

  public getEffectiveCharDelayMs(): number {
    switch (this.textSpeed) {
      case 'SLOW': return 24;
      case 'FAST': return 5;
      case 'INSTANT': return 0;
      case 'MID':
      default: return OverworldHUD.DIALOGUE_CHAR_DELAY_MS;
    }
  }

  private container: HTMLElement;
  private speedButton: HTMLButtonElement | null = null;
  private muteButton: HTMLButtonElement | null = null;
  private radarToggleButton: HTMLButtonElement | null = null;
  private gamepadToggleButton!: HTMLButtonElement;
  private startMenuButton!: HTMLButtonElement;
  private desktopControlsBar!: HTMLDivElement;
  private currentSpeed: SpeedMultiplier = 1;
  private routeBanner!: HTMLDivElement;
  private roamerAlertBanner!: HTMLDivElement;
  private toastBanner!: HTMLDivElement;
  private dialogueBox!: HTMLDivElement;
  private dialogueSpeaker!: HTMLDivElement;
  private dialogueText!: HTMLDivElement;
  private dialoguePrompt!: HTMLDivElement;
  private dialogueChoiceBox!: HTMLDivElement;
  private dialoguePages: string[] = [];
  private dialoguePageIndex: number = 0;
  private dialogueCharIndex: number = 0;
  private dialogueTypeTimer?: ReturnType<typeof setInterval>;
  private roamerAlertTimer?: ReturnType<typeof setTimeout>;
  private dialogueOnComplete?: () => void;
  private dialogueOnPageChange?: (pageIndex: number) => void;
  private dialogueActive: boolean = false;
  private choicePending: boolean = false;
  private choiceActive: boolean = false;
  private choiceIndex: 0 | 1 = 0;
  private choiceLabels: [string, string] = ['YES', 'NO'];
  private choiceOnSelect?: (choice: 'YES' | 'NO') => void;
  private rootElement!: HTMLDivElement;
  private options: OverworldHUDOptions;
  private touchAndKeyController!: OverworldTouchAndKeyController;
  private cutsceneModals!: OverworldCutsceneAndPokegearModals;

  constructor(containerId: string = 'overworld-hud-container', options: OverworldHUDOptions = {}) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.options = options;

    this.createUI();
    this.initControllers();
  }

  private initControllers(): void {
    this.cutsceneModals = new OverworldCutsceneAndPokegearModals({
      rootElement: this.rootElement,
      toastBanner: this.toastBanner,
      onClearActiveDirection: () => this.touchAndKeyController.clearActiveDirection(),
    });

    this.touchAndKeyController = new OverworldTouchAndKeyController({
      rootElement: this.rootElement,
      isDialogueOpen: () => this.isDialogueOpen(),
      isChoiceOpen: () => this.isChoiceOpen(),
      moveChoiceCursor: (delta) => this.moveChoiceCursor(delta),
      confirmChoice: () => this.confirmChoice(),
      cancelChoice: () => this.cancelChoice(),
      isModalOpen: this.options.isModalOpen,
      isPokegearOpen: () => this.isPokegearOpen(),
      onInteract: () => {
        if (this.choiceActive) {
          this.confirmChoice();
        } else if (this.dialogueActive) {
          this.advanceDialogue();
        } else if (this.options.onInteract) {
          this.options.onInteract();
        }
      },
      onMenuToggle: this.options.onMenuToggle,
      onSpeedCycle: this.options.onSpeedCycle,
      onRadarToggle: this.options.onRadarToggle,
      updateSpeedDisplay: (speed) => this.updateSpeedDisplay(speed),
      updateRadarDisplay: (active) => this.updateRadarDisplay(active),
      advanceDialogue: () => this.advanceDialogue(),
      isVisible: () => this.isVisible(),
      onGamepadVisibilityChanged: () => this.updateInputModeLabels(),
    });

    this.touchAndKeyController.initDOM();
    this.updateInputModeLabels();
  }

  public show(): void {
    if (this.rootElement) this.rootElement.style.display = 'flex';
  }

  public hide(): void {
    if (this.rootElement) this.rootElement.style.display = 'none';
  }

  public isVisible(): boolean {
    return this.rootElement ? this.rootElement.style.display !== 'none' : false;
  }

  private injectResponsiveStyles(): void {
    if (document.getElementById('overworld-hud-styles')) return;
    const style = document.createElement('style');
    style.id = 'overworld-hud-styles';
    style.innerHTML = getOverworldHudResponsiveStyles();
    document.head.appendChild(style);
  }

  private isTouchOrMobile(): boolean {
    if (this.touchAndKeyController?.isGamepadActive()) return true;
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 768 ||
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    );
  }

  private getDialogueContinuePromptHtml(pageLabel: string = ''): string {
    const label = this.isTouchOrMobile() ? 'TAP / [A]' : 'SPACE / CLICK';
    return `<span>${pageLabel}${label}</span> <span style="font-size: 14px;">▼</span>`;
  }

  private updateInputModeLabels(): void {
    const mobileMode = this.isTouchOrMobile();
    if (this.speedButton) {
      this.speedButton.innerText = mobileMode
        ? `⚡ SPEED: ${this.currentSpeed}x`
        : `⚡ SPEED: ${this.currentSpeed}x (Shift)`;
    }
    if (this.startMenuButton) {
      this.startMenuButton.innerText = mobileMode ? '☰ MENU' : '☰ MENU (M / Esc)';
    }
    if (this.dialoguePrompt) {
      const pageLabel =
        this.dialogueActive && this.dialoguePages.length > 1
          ? `(${this.dialoguePageIndex + 1}/${this.dialoguePages.length}) `
          : '';
      this.dialoguePrompt.innerHTML = this.getDialogueContinuePromptHtml(pageLabel);
    }
    if (this.desktopControlsBar) {
      if (mobileMode) {
        this.desktopControlsBar.style.setProperty('display', 'none', 'important');
      } else {
        this.desktopControlsBar.style.display = 'flex';
      }
    }
  }

  private createUI(): void {
    this.injectResponsiveStyles();
    this.rootElement = document.createElement('div');
    this.rootElement.id = 'hud-root';
    this.rootElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: env(safe-area-inset-top, 12px) env(safe-area-inset-right, 12px) env(safe-area-inset-bottom, 12px) env(safe-area-inset-left, 12px);
      box-sizing: border-box;
      z-index: 20;
    `;

    this.rootElement.innerHTML = getOverworldHudTemplateHtml();

    this.container.appendChild(this.rootElement);

    this.speedButton = this.rootElement.querySelector('#speed-toggle-btn') as HTMLButtonElement | null;
    this.muteButton = this.rootElement.querySelector('#mute-toggle-btn') as HTMLButtonElement | null;
    this.radarToggleButton = this.rootElement.querySelector('#radar-toggle-btn') as HTMLButtonElement | null;
    this.gamepadToggleButton = this.rootElement.querySelector('#gamepad-toggle-btn') as HTMLButtonElement;
    this.startMenuButton = this.rootElement.querySelector('#start-menu-btn') as HTMLButtonElement;
    this.desktopControlsBar = this.rootElement.querySelector('#desktop-controls-bar') as HTMLDivElement;
    this.routeBanner = this.rootElement.querySelector('#route-banner') as HTMLDivElement;
    this.roamerAlertBanner = this.rootElement.querySelector('#roamer-alert-banner') as HTMLDivElement;
    this.toastBanner = this.rootElement.querySelector('#overworld-toast-banner') as HTMLDivElement;
    this.dialogueBox = this.rootElement.querySelector('#dialogue-box') as HTMLDivElement;
    this.dialogueSpeaker = this.rootElement.querySelector('#dialogue-speaker') as HTMLDivElement;
    this.dialogueText = this.rootElement.querySelector('#dialogue-text') as HTMLDivElement;
    this.dialoguePrompt = this.rootElement.querySelector('#dialogue-prompt') as HTMLDivElement;
    this.dialogueChoiceBox = this.rootElement.querySelector('#dialogue-choice-box') as HTMLDivElement;

    const choiceYesBtn = this.rootElement.querySelector('#dialogue-choice-yes') as HTMLButtonElement | null;
    const choiceNoBtn = this.rootElement.querySelector('#dialogue-choice-no') as HTMLButtonElement | null;
    choiceYesBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.choiceActive) return;
      this.choiceIndex = 0;
      this.renderChoiceBoxCursor();
      this.confirmChoice();
    });
    choiceNoBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.choiceActive) return;
      this.choiceIndex = 1;
      this.renderChoiceBoxCursor();
      this.confirmChoice();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateInputModeLabels();
      });
    }

    const startMenuBtn = this.startMenuButton;
    const pokegearModal = this.rootElement.querySelector('#pokegear-modal') as HTMLDivElement;
    const closePokegearBtn = this.rootElement.querySelector('#close-pokegear-btn') as HTMLButtonElement;
    const roamerStatusList = this.rootElement.querySelector('#roamer-status-list') as HTMLDivElement;

    this.radarToggleButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.options.onRadarToggle) this.updateRadarDisplay(this.options.onRadarToggle());
    });

    this.gamepadToggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleGamepad();
    });

    startMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onMenuToggle?.();
    });

    this.dialogueBox.addEventListener('click', () => this.advanceDialogue());

    closePokegearBtn.addEventListener('click', () => {
      pokegearModal.style.display = 'none';
    });

    this.speedButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.options.onSpeedCycle) this.updateSpeedDisplay(this.options.onSpeedCycle());
    });

    this.muteButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.options.onMuteToggle) this.updateMuteDisplay(this.options.onMuteToggle());
    });

    eventBus.on('roamer:auraAlert', ({ speciesId, mapId }) => {
      this.showRoamerAlert(speciesId, mapId);
    });

    eventBus.on('roamer:updated', ({ roamers }) => {
      this.updatePokegear(roamers, roamerStatusList);
    });
  }

  public isDialogueOpen(): boolean {
    return this.dialogueActive || this.cutsceneModals.isAnyModalOpen();
  }

  public playFieldRestAnimation(onComplete?: () => void): void {
    this.cutsceneModals.playFieldRestAnimation(onComplete);
  }

  public playHealingAnimation(partyCount: number, onComplete?: () => void): void {
    this.cutsceneModals.playHealingAnimation(partyCount, onComplete);
  }

  public playTradeAnimation(
    params: {
      givenSpeciesId: string;
      givenName: string;
      receivedSpeciesId: string;
      receivedName: string;
      traderName: string;
    },
    onComplete?: () => void
  ): void {
    this.cutsceneModals.playTradeAnimation(params, onComplete);
  }

  public openStarterChoiceModal(
    speciesId: 'cyndaquil' | 'totodile' | 'chikorita',
    speciesLabel: string,
    typeLabel: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.cutsceneModals.openStarterChoiceModal(speciesId, speciesLabel, typeLabel, onConfirm, onCancel);
  }

  public isChoiceOpen(): boolean {
    return this.choiceActive;
  }

  private renderChoiceBoxCursor(): void {
    if (!this.dialogueChoiceBox) return;
    const cursor0 = this.dialogueChoiceBox.querySelector('#dialogue-choice-cursor-0') as HTMLElement | null;
    const cursor1 = this.dialogueChoiceBox.querySelector('#dialogue-choice-cursor-1') as HTMLElement | null;
    const btn0 = this.dialogueChoiceBox.querySelector('#dialogue-choice-yes') as HTMLElement | null;
    const btn1 = this.dialogueChoiceBox.querySelector('#dialogue-choice-no') as HTMLElement | null;
    const label0 = this.dialogueChoiceBox.querySelector('#dialogue-choice-label-0') as HTMLElement | null;
    const label1 = this.dialogueChoiceBox.querySelector('#dialogue-choice-label-1') as HTMLElement | null;

    if (label0) label0.innerText = this.choiceLabels[0];
    if (label1) label1.innerText = this.choiceLabels[1];
    if (cursor0) cursor0.innerText = this.choiceIndex === 0 ? '▶' : '';
    if (cursor1) cursor1.innerText = this.choiceIndex === 1 ? '▶' : '';
    if (btn0) btn0.style.background = this.choiceIndex === 0 ? 'rgba(56, 189, 248, 0.2)' : 'transparent';
    if (btn1) btn1.style.background = this.choiceIndex === 1 ? 'rgba(56, 189, 248, 0.2)' : 'transparent';
  }

  private showPendingChoiceIfReady(): void {
    if (
      this.choicePending &&
      this.dialoguePageIndex === this.dialoguePages.length - 1 &&
      this.dialogueCharIndex >= (this.dialoguePages[this.dialoguePageIndex] || '').length
    ) {
      this.choiceActive = true;
      this.renderChoiceBoxCursor();
      if (this.dialogueChoiceBox) {
        this.dialogueChoiceBox.style.display = 'flex';
      }
      this.dialoguePrompt.innerHTML = '<span>▲/▼ Select • A/Enter Confirm</span>';
      this.dialoguePrompt.style.opacity = '1';
    }
  }

  public moveChoiceCursor(delta: -1 | 1): void {
    if (!this.choiceActive) return;
    const next: 0 | 1 = delta < 0 ? 0 : 1;
    if (next !== this.choiceIndex) {
      this.choiceIndex = next;
      BattleAudio.playMenuSound('CURSOR');
      this.renderChoiceBoxCursor();
    }
  }

  public confirmChoice(): void {
    if (!this.choiceActive) return;
    const selected: 'YES' | 'NO' = this.choiceIndex === 0 ? 'YES' : 'NO';
    BattleAudio.playMenuSound(selected === 'YES' ? 'CONFIRM' : 'CANCEL');
    this.finalizeChoice(selected);
  }

  public cancelChoice(): void {
    if (!this.choiceActive) return;
    this.choiceIndex = 1;
    this.renderChoiceBoxCursor();
    BattleAudio.playMenuSound('CANCEL');
    this.finalizeChoice('NO');
  }

  private finalizeChoice(selected: 'YES' | 'NO'): void {
    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
    this.dialogueTypeTimer = undefined;
    this.choicePending = false;
    this.choiceActive = false;
    if (this.dialogueChoiceBox) {
      this.dialogueChoiceBox.style.display = 'none';
    }
    this.dialogueActive = false;
    this.dialogueBox.style.display = 'none';
    this.touchAndKeyController.computeActiveDirection();

    const cb = this.choiceOnSelect;
    this.choiceOnSelect = undefined;
    if (cb) cb(selected);
  }

  public openChoiceDialogue(
    pages: string[],
    speaker: string | undefined,
    onSelect: (choice: 'YES' | 'NO') => void,
    options?: { yesLabel?: string; noLabel?: string; defaultChoice?: 'YES' | 'NO' }
  ): void {
    if (!pages || pages.length === 0) return;
    this.choicePending = true;
    this.choiceActive = false;
    this.choiceIndex = options?.defaultChoice === 'NO' ? 1 : 0;
    this.choiceLabels = [options?.yesLabel || 'YES', options?.noLabel || 'NO'];
    this.choiceOnSelect = onSelect;
    if (this.dialogueChoiceBox) {
      this.dialogueChoiceBox.style.display = 'none';
    }

    this.openDialogue(pages, speaker, undefined, undefined, true);
  }

  public openDialogue(
    pages: string[],
    speaker?: string,
    onComplete?: () => void,
    onPageChange?: (pageIndex: number) => void,
    keepChoicePending: boolean = false
  ): void {
    if (!pages || pages.length === 0) return;
    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);

    if (!keepChoicePending) {
      this.choicePending = false;
      this.choiceActive = false;
      this.choiceOnSelect = undefined;
      if (this.dialogueChoiceBox) {
        this.dialogueChoiceBox.style.display = 'none';
      }
    }

    this.dialoguePages = pages;
    this.dialoguePageIndex = 0;
    this.dialogueOnComplete = onComplete;
    this.dialogueOnPageChange = onPageChange;
    this.dialogueActive = true;
    this.touchAndKeyController.clearActiveDirection();
    this.dialogueSpeaker.innerText = speaker || '';
    this.dialogueSpeaker.style.display = speaker ? 'block' : 'none';
    this.dialogueBox.style.display = 'block';
    this.startPageTypewriter();
    this.dialogueOnPageChange?.(0);
  }

  private startPageTypewriter(): void {
    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
    const fullText = this.dialoguePages[this.dialoguePageIndex] || '';
    this.dialogueCharIndex = 0;
    this.dialogueText.innerText = '';
    const pageLabel =
      this.dialoguePages.length > 1 ? `(${this.dialoguePageIndex + 1}/${this.dialoguePages.length}) ` : '';
    this.dialoguePrompt.style.opacity = '0.4';

    const charDelay = this.getEffectiveCharDelayMs();
    if (charDelay <= 0) {
      this.dialogueCharIndex = fullText.length;
      this.dialogueText.innerText = fullText;
      this.dialoguePrompt.innerHTML = this.getDialogueContinuePromptHtml(pageLabel);
      this.dialoguePrompt.style.opacity = '1';
      this.showPendingChoiceIfReady();
      return;
    }

    this.dialogueTypeTimer = setInterval(() => {
      this.dialogueCharIndex++;
      this.dialogueText.innerText = fullText.slice(0, this.dialogueCharIndex);
      if (this.dialogueCharIndex >= fullText.length) {
        if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
        this.dialogueTypeTimer = undefined;
        this.dialoguePrompt.innerHTML = this.getDialogueContinuePromptHtml(pageLabel);
        this.dialoguePrompt.style.opacity = '1';
        this.showPendingChoiceIfReady();
      }
    }, charDelay);
  }

  public advanceDialogue(): void {
    if (!this.dialogueActive) return;

    const currentFullText = this.dialoguePages[this.dialoguePageIndex] || '';
    if (this.dialogueCharIndex < currentFullText.length) {
      if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
      this.dialogueTypeTimer = undefined;
      this.dialogueCharIndex = currentFullText.length;
      this.dialogueText.innerText = currentFullText;
      const pageLabel =
        this.dialoguePages.length > 1 ? `(${this.dialoguePageIndex + 1}/${this.dialoguePages.length}) ` : '';
      this.dialoguePrompt.innerHTML = this.getDialogueContinuePromptHtml(pageLabel);
      this.dialoguePrompt.style.opacity = '1';
      this.showPendingChoiceIfReady();
      return;
    }

    if (this.choiceActive) {
      this.confirmChoice();
      return;
    }

    if (this.dialoguePageIndex + 1 < this.dialoguePages.length) {
      this.dialoguePageIndex++;
      this.startPageTypewriter();
      if (this.dialogueOnPageChange) {
        this.dialogueOnPageChange(this.dialoguePageIndex);
      }
      return;
    }

    if (this.choicePending) {
      this.showPendingChoiceIfReady();
      return;
    }

    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);
    this.dialogueTypeTimer = undefined;
    this.dialogueActive = false;
    this.dialogueBox.style.display = 'none';
    this.touchAndKeyController.computeActiveDirection();

    if (this.dialogueOnComplete) {
      const cb = this.dialogueOnComplete;
      this.dialogueOnComplete = undefined;
      cb();
    }
  }

  public showToast(message: string, durationMs: number = 3200): void {
    this.cutsceneModals.showToast(message, durationMs);
  }

  public showMissionToast(
    title: string,
    subtitle: string,
    type: 'unlocked' | 'progress' | 'completed' = 'progress',
    durationMs: number = 3800
  ): void {
    this.cutsceneModals.showMissionToast(title, subtitle, type, durationMs);
  }

  public updatePokegear(roamers: RoamerState[], listElement?: HTMLDivElement): void {
    this.cutsceneModals.updatePokegear(roamers, listElement);
  }

  public toggleGamepad(): boolean {
    return this.touchAndKeyController.toggleGamepad();
  }

  public isGamepadActive(): boolean {
    return this.touchAndKeyController.isGamepadActive();
  }

  public setGamepadVisible(visible: boolean): void {
    this.touchAndKeyController.setGamepadVisible(visible);
  }

  public setTouchControlStyle(style: TouchControlStyle): void {
    this.touchAndKeyController.setTouchControlStyle(style);
  }

  public getTouchControlStyle(): TouchControlStyle {
    return this.touchAndKeyController.getTouchControlStyle();
  }

  public toggleTouchControlStyle(): TouchControlStyle {
    return this.touchAndKeyController.toggleTouchControlStyle();
  }

  public updateSpeedDisplay(speed: SpeedMultiplier): void {
    this.currentSpeed = speed;
    if (this.speedButton) {
      this.updateInputModeLabels();
      const colors: Record<number, { bg: string; shadow: string }> = {
        1: { bg: '#2563eb', shadow: '0 2px 8px rgba(37, 99, 235, 0.4)' },
        2: { bg: '#d97706', shadow: '0 2px 8px rgba(217, 119, 6, 0.4)' },
        3: { bg: '#dc2626', shadow: '0 2px 8px rgba(220, 38, 38, 0.4)' },
      };
      const c = colors[speed] || {
        bg: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
        shadow: '0 0 16px rgba(236, 72, 153, 0.65)',
      };
      this.speedButton.style.background = c.bg;
      this.speedButton.style.boxShadow = c.shadow;
    }
  }

  public updateMuteDisplay(muted: boolean): void {
    if (this.muteButton) {
      this.muteButton.innerText = muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
      this.muteButton.style.background = muted ? '#7f1d1d' : '#334155';
    }
  }

  public updateRadarDisplay(active: boolean): void {
    if (this.radarToggleButton) {
      this.radarToggleButton.style.background = active ? '#0284c7' : '#334155';
      this.radarToggleButton.style.borderColor = active ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)';
      this.radarToggleButton.style.boxShadow = active ? '0 0 10px rgba(56, 189, 248, 0.5)' : 'none';
    }
  }

  public updateRouteName(name: string): void {
    updateRouteNameBanner(this.routeBanner, name);
  }

  public showRoamerAlert(speciesId: string, _mapId: string): void {
    if (!this.roamerAlertBanner) return;
    if (this.roamerAlertTimer) clearTimeout(this.roamerAlertTimer);
    this.roamerAlertBanner.innerText = `⚡ ${speciesId.toUpperCase()} is roaming nearby! A powerful aura is present!`;
    this.roamerAlertBanner.style.display = 'block';
    this.roamerAlertTimer = setTimeout(() => {
      if (this.roamerAlertBanner) this.roamerAlertBanner.style.display = 'none';
      this.roamerAlertTimer = undefined;
    }, 2500);
  }

  public hideRoamerAlert(): void {
    if (this.roamerAlertTimer) { clearTimeout(this.roamerAlertTimer); this.roamerAlertTimer = undefined; }
    if (this.roamerAlertBanner) this.roamerAlertBanner.style.display = 'none';
  }

  public openPokegear(): void {
    this.cutsceneModals.openPokegear();
  }

  public isPokegearOpen(): boolean {
    return this.cutsceneModals.isPokegearOpen();
  }

  public getHeldDirection(): Direction | null {
    return this.touchAndKeyController.getHeldDirection();
  }

  public consumePendingTouchTurnDirection(): Direction | null {
    return this.touchAndKeyController.consumePendingTouchTurnDirection();
  }

  public setPlayerDirection(dir: Direction): void {
    this.touchAndKeyController.setPlayerDirection(dir);
  }
}
