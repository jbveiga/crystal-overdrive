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
import { OverworldTouchAndKeyController } from './hud/OverworldTouchAndKeyController';
import { OverworldCutsceneAndPokegearModals } from './hud/OverworldCutsceneAndPokegearModals';

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
  private dialoguePages: string[] = [];
  private dialoguePageIndex: number = 0;
  private dialogueCharIndex: number = 0;
  private dialogueTypeTimer?: ReturnType<typeof setInterval>;
  private dialogueOnComplete?: () => void;
  private dialogueOnPageChange?: (pageIndex: number) => void;
  private dialogueActive: boolean = false;
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
      isModalOpen: this.options.isModalOpen,
      isPokegearOpen: () => this.isPokegearOpen(),
      onInteract: () => {
        if (this.dialogueActive) {
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
    style.innerHTML = `
      @keyframes toastSlideDown {
        from { opacity: 0; transform: translate(-50%, -12px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @media (max-width: 640px) {
        #top-menu-capsule { padding: 4px 6px !important; gap: 4px !important; }
        #desktop-controls-bar { display: none !important; }
        #route-banner { font-size: 11px !important; padding: 4px 10px !important; }
      }
      @media (max-width: 768px), (pointer: coarse) {
        #desktop-controls-bar { display: none !important; }
      }
    `;
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

    this.rootElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: 12px; pointer-events: none;">
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
          pointer-events: auto;
        ">New Bark Town</div>

        <div id="top-menu-capsule" style="
          display: flex;
          align-items: center;
          gap: 6px;
          pointer-events: auto;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          padding: 5px 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.55);
        ">
          <button id="radar-toggle-btn" title="Toggle Itemfinder Radar (D)" style="
            background: #334155;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          ">📡</button>
          <button id="gamepad-toggle-btn" title="Toggle Touch Gamepad" style="
            background: #334155;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          ">🎮</button>
          <button id="start-menu-btn" style="
            background: #0f172a;
            color: #facc15;
            border: 2px solid #facc15;
            border-radius: 999px;
            padding: 5px 12px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
          ">☰ MENU (M / Esc)</button>
        </div>
      </div>

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

      <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
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
        ">⚡ A powerful aura is present on this route!</div>
      </div>

      <div id="overworld-toast-banner" style="
        display: none;
        position: fixed;
        top: calc(54px + env(safe-area-inset-top, 0px));
        left: 50%;
        transform: translateX(-50%);
        max-width: min(440px, calc(100vw - 32px));
        z-index: 45;
        pointer-events: none;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(10px);
        border: 1.5px solid #38bdf8;
        border-radius: 9999px;
        padding: 8px 18px;
        color: #f8fafc;
        font-weight: 700;
        font-size: 13px;
        text-align: center;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        animation: toastSlideDown 0.22s ease-out;
        transition: opacity 0.18s ease, transform 0.18s ease;
      "></div>

      <div id="mobile-gamepad-overlay" style="
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 30;
      ">
        <div id="virtual-dpad-base" style="
          position: absolute;
          bottom: calc(28px + env(safe-area-inset-bottom, 0px));
          left: calc(16px + env(safe-area-inset-left, 0px));
          width: 172px;
          height: 172px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(6px);
          border: 2px solid rgba(148, 163, 184, 0.35);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
          pointer-events: auto;
          touch-action: none;
        ">
          <div id="dpad-seg-up" style="position: absolute; top: 6px; left: 57px; width: 58px; height: 52px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">▲</div>
          <div id="dpad-seg-down" style="position: absolute; bottom: 6px; left: 57px; width: 58px; height: 52px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">▼</div>
          <div id="dpad-seg-left" style="position: absolute; top: 57px; left: 6px; width: 52px; height: 58px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">◀</div>
          <div id="dpad-seg-right" style="position: absolute; top: 57px; right: 6px; width: 52px; height: 58px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">▶</div>
          <div id="dpad-center-pivot" style="position: absolute; top: 68px; left: 68px; width: 36px; height: 36px; border-radius: 50%; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.12);"></div>
          <div id="virtual-joystick-knob" style="display: none; position: absolute; top: 52px; left: 52px; width: 68px; height: 68px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 55%, #0f172a 100%); border: 2px solid #bae6fd; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.65), 0 0 12px rgba(56, 189, 248, 0.45); pointer-events: none; transform: translate(0px, 0px);"></div>
        </div>
        <button id="virtual-btn-b" style="position: absolute; bottom: calc(76px + env(safe-area-inset-bottom, 0px)); right: calc(68px + env(safe-area-inset-right, 0px)); width: 50px; height: 50px; border-radius: 50%; background: #dc2626; color: #ffffff; border: 2px solid #fca5a5; font-size: 18px; font-weight: 900; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.55); pointer-events: auto; touch-action: none; cursor: pointer;">B</button>
        <button id="virtual-btn-a" style="position: absolute; bottom: calc(28px + env(safe-area-inset-bottom, 0px)); right: calc(16px + env(safe-area-inset-right, 0px)); width: 56px; height: 56px; border-radius: 50%; background: #16a34a; color: #ffffff; border: 2px solid #86efac; font-size: 20px; font-weight: 900; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.6); pointer-events: auto; touch-action: none; cursor: pointer;">A</button>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; z-index: 40; margin-bottom: calc(8px + env(safe-area-inset-bottom, 0px));">
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
          margin-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
        ">
          <div id="dialogue-speaker" style="display: none; background: #0284c7; border: 2px solid #f8fafc; color: #ffffff; font-size: 12px; font-weight: 800; letter-spacing: 0.6px; padding: 3px 10px; border-radius: 6px; width: fit-content; margin-bottom: 8px; text-transform: uppercase;"></div>
          <div id="dialogue-text" style="font-size: 17px; font-weight: 600; line-height: 1.5; min-height: 52px; color: #f8fafc; letter-spacing: 0.2px; white-space: pre-wrap;"></div>
          <div id="dialogue-prompt" style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: #38bdf8; margin-top: 6px;"></div>
        </div>

        <div id="desktop-controls-bar" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="background: rgba(18, 22, 28, 0.8); backdrop-filter: blur(4px); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #94a3b8;">
            Move: <strong>WASD / Arrows</strong> | Talk / Read Signs: <strong>Space / Enter / Z</strong> | Speed: <strong>Shift</strong>
          </div>
          <button id="interact-btn" style="pointer-events: auto; background: #0284c7; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 6px; padding: 7px 14px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.45);">💬 TALK / READ (Space)</button>
        </div>
      </div>
    `;

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

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateInputModeLabels();
      });
    }

    const startMenuBtn = this.startMenuButton;
    const interactBtn = this.rootElement.querySelector('#interact-btn') as HTMLButtonElement;
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

    interactBtn.addEventListener('click', () => {
      if (this.dialogueActive) this.advanceDialogue();
      else this.options.onInteract?.();
    });

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

  public openStarterChoiceModal(
    speciesId: 'cyndaquil' | 'totodile' | 'chikorita',
    speciesLabel: string,
    typeLabel: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.cutsceneModals.openStarterChoiceModal(speciesId, speciesLabel, typeLabel, onConfirm, onCancel);
  }

  public openDialogue(
    pages: string[],
    speaker?: string,
    onComplete?: () => void,
    onPageChange?: (pageIndex: number) => void
  ): void {
    if (!pages || pages.length === 0) return;
    if (this.dialogueTypeTimer) clearInterval(this.dialogueTypeTimer);

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
    this.cutsceneModals.openPokegear();
  }

  public isPokegearOpen(): boolean {
    return this.cutsceneModals.isPokegearOpen();
  }

  public getHeldDirection(): Direction | null {
    return this.touchAndKeyController.getHeldDirection();
  }
}
