import type { Direction, SpeedMultiplier, RoamerState, TouchControlStyle } from '../types/game';
import { eventBus } from '../core/EventBus';
import { BattleAudio } from '../audio/BattleAudio';

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
  private dialogueOnPageChange?: (pageIndex: number) => void;
  private dialogueActive: boolean = false;
  private rootElement!: HTMLDivElement;
  private gamepadContainer!: HTMLDivElement;
  private dpadSegments: Partial<Record<Direction, HTMLDivElement>> = {};
  private dpadCenterPivot: HTMLDivElement | null = null;
  private joystickKnob: HTMLDivElement | null = null;
  private touchControlStyle: TouchControlStyle = 'DPAD';
  private isGamepadVisible: boolean = false;
  private activeDirection: Direction | null = null;
  private touchDirection: Direction | null = null;
  private heldKeys: Set<string> = new Set();
  private options: OverworldHUDOptions;

  constructor(containerId: string = 'overworld-hud-container', options: OverworldHUDOptions = {}) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.options = options;
    this.isGamepadVisible =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0));

    this.createUI();
    this.setupControls();
    this.setupTouchGamepad();
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

  private injectResponsiveStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('crystal-overworld-hud-responsive-styles')) return;
    const style = document.createElement('style');
    style.id = 'crystal-overworld-hud-responsive-styles';
    style.textContent = `
      @media (max-width: 768px), (pointer: coarse) {
        #desktop-controls-bar {
          display: none !important;
        }
      }
      @keyframes toastSlideDown {
        0% {
          opacity: 0;
          transform: translate(-50%, -12px);
        }
        100% {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  private isTouchOrMobile(): boolean {
    if (this.isGamepadVisible) return true;
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

  private updateGamepadVisibility(): void {
    if (this.gamepadContainer) {
      this.gamepadContainer.style.display = this.isGamepadVisible ? 'block' : 'none';
    }
    if (this.gamepadToggleButton) {
      this.gamepadToggleButton.style.background = this.isGamepadVisible ? '#0284c7' : '#334155';
      this.gamepadToggleButton.style.borderColor = this.isGamepadVisible ? '#38bdf8' : 'rgba(255,255,255,0.18)';
    }
    if (typeof document !== 'undefined' && document.body?.classList) {
      document.body.classList.toggle('touch-controls-active', this.isGamepadVisible);
    }
    this.updateInputModeLabels();
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
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
      padding: max(12px, env(safe-area-inset-top, 12px)) max(12px, env(safe-area-inset-right, 12px)) max(12px, env(safe-area-inset-bottom, 12px)) max(12px, env(safe-area-inset-left, 12px));
      box-sizing: border-box;
    `;

    this.rootElement.innerHTML = `
<!-- Top bar: Route Banner + Collapsible Top Menu Capsule -->
<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: 12px;">
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
<!-- Top Menu Dock Capsule -->
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
<!-- Always-Visible Capsule Controls -->
<button id="radar-toggle-btn" title="Toggle Itemfinder Radar (D)" style="
background: #334155;
color: #ffffff;
border: 1px solid rgba(255, 255, 255, 0.18);
border-radius: 999px;
padding: 6px 10px;
font-size: 12px;
font-weight: 700;
cursor: pointer;
">
📡
</button>
<button id="gamepad-toggle-btn" title="Toggle Touch Gamepad" style="
background: #334155;
color: #ffffff;
border: 1px solid rgba(255, 255, 255, 0.18);
border-radius: 999px;
padding: 6px 10px;
font-size: 12px;
font-weight: 700;
cursor: pointer;
">
🎮
</button>
<button id="start-menu-btn" style="
background: #0f172a;
color: #facc15;
border: 2px solid #facc15;
border-radius: 999px;
padding: 5px 12px;
font-size: 12px;
font-weight: 800;
cursor: pointer;
">
☰ MENU (M / Esc)
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
</div>
<!-- Top-Aligned Floating Pill Toast Banner (TICKET-UI-HEALING-POLISH-01) -->
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
<!-- Responsive Mobile Touch Gamepad Overlay (Virtual D-Pad + A/B Action Buttons) -->
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
<!-- Virtual D-Pad (Bottom-Left, 172x172px) -->
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
<div id="dpad-seg-up" style="
position: absolute;
top: 6px;
left: 57px;
width: 58px;
height: 52px;
border-radius: 12px;
background: rgba(30, 41, 59, 0.9);
border: 1px solid rgba(255, 255, 255, 0.2);
display: flex;
align-items: center;
justify-content: center;
color: #e2e8f0;
font-size: 20px;
font-weight: 900;
transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;
">▲</div>
<div id="dpad-seg-down" style="
position: absolute;
bottom: 6px;
left: 57px;
width: 58px;
height: 52px;
border-radius: 12px;
background: rgba(30, 41, 59, 0.9);
border: 1px solid rgba(255, 255, 255, 0.2);
display: flex;
align-items: center;
justify-content: center;
color: #e2e8f0;
font-size: 20px;
font-weight: 900;
transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;
">▼</div>
<div id="dpad-seg-left" style="
position: absolute;
top: 57px;
left: 6px;
width: 52px;
height: 58px;
border-radius: 12px;
background: rgba(30, 41, 59, 0.9);
border: 1px solid rgba(255, 255, 255, 0.2);
display: flex;
align-items: center;
justify-content: center;
color: #e2e8f0;
font-size: 20px;
font-weight: 900;
transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;
">◀</div>
<div id="dpad-seg-right" style="
position: absolute;
top: 57px;
right: 6px;
width: 52px;
height: 58px;
border-radius: 12px;
background: rgba(30, 41, 59, 0.9);
border: 1px solid rgba(255, 255, 255, 0.2);
display: flex;
align-items: center;
justify-content: center;
color: #e2e8f0;
font-size: 20px;
font-weight: 900;
transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;
">▶</div>
<div id="dpad-center-pivot" style="
position: absolute;
top: 68px;
left: 68px;
width: 36px;
height: 36px;
border-radius: 50%;
background: rgba(15, 23, 42, 0.95);
border: 1px solid rgba(255, 255, 255, 0.12);
"></div>
<div id="virtual-joystick-knob" style="
display: none;
position: absolute;
top: 52px;
left: 52px;
width: 68px;
height: 68px;
border-radius: 50%;
background: radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 55%, #0f172a 100%);
border: 2px solid #bae6fd;
box-shadow: 0 4px 14px rgba(0, 0, 0, 0.65), 0 0 12px rgba(56, 189, 248, 0.45);
pointer-events: none;
transform: translate(0px, 0px);
"></div>
</div>
<!-- Virtual Action Buttons (Bottom-Right: A & B) -->
<button id="virtual-btn-b" style="
position: absolute;
bottom: calc(76px + env(safe-area-inset-bottom, 0px));
right: calc(68px + env(safe-area-inset-right, 0px));
width: 50px;
height: 50px;
border-radius: 50%;
background: #dc2626;
color: #ffffff;
border: 2px solid #fca5a5;
font-size: 18px;
font-weight: 900;
box-shadow: 0 4px 14px rgba(220, 38, 38, 0.55);
pointer-events: auto;
touch-action: none;
cursor: pointer;
">B</button>
<button id="virtual-btn-a" style="
position: absolute;
bottom: calc(28px + env(safe-area-inset-bottom, 0px));
right: calc(16px + env(safe-area-inset-right, 0px));
width: 56px;
height: 56px;
border-radius: 50%;
background: #16a34a;
color: #ffffff;
border: 2px solid #86efac;
font-size: 20px;
font-weight: 900;
box-shadow: 0 4px 16px rgba(22, 163, 74, 0.6);
pointer-events: auto;
touch-action: none;
cursor: pointer;
">A</button>
</div>
<!-- Bottom Area: Classic Dialogue Box + Help Bar -->
<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; z-index: 40; margin-bottom: calc(8px + env(safe-area-inset-bottom, 0px));">
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
margin-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
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
<!-- Bottom Controls / Help info (Desktop Only; hidden when Touch Gamepad is active) -->
<div id="desktop-controls-bar" style="
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
    this.gamepadContainer = this.rootElement.querySelector('#mobile-gamepad-overlay') as HTMLDivElement;

    this.dpadSegments = {
      UP: this.rootElement.querySelector('#dpad-seg-up') as HTMLDivElement,
      DOWN: this.rootElement.querySelector('#dpad-seg-down') as HTMLDivElement,
      LEFT: this.rootElement.querySelector('#dpad-seg-left') as HTMLDivElement,
      RIGHT: this.rootElement.querySelector('#dpad-seg-right') as HTMLDivElement,
    };
    this.dpadCenterPivot = this.rootElement.querySelector('#dpad-center-pivot') as HTMLDivElement | null;
    this.joystickKnob = this.rootElement.querySelector('#virtual-joystick-knob') as HTMLDivElement | null;
    this.updateGamepadVisibility();
    this.applyTouchControlStyleUI();

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
      if (this.options.onRadarToggle) {
        const active = this.options.onRadarToggle();
        this.updateRadarDisplay(active);
      }
    });

    this.gamepadToggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isGamepadVisible = !this.isGamepadVisible;
      this.updateGamepadVisibility();
    });

    startMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.options.onMenuToggle) this.options.onMenuToggle();
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

    closePokegearBtn.addEventListener('click', () => {
      pokegearModal.style.display = 'none';
    });

    this.speedButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.options.onSpeedCycle) {
        const nextSpeed = this.options.onSpeedCycle();
        this.updateSpeedDisplay(nextSpeed);
      }
    });

    this.muteButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.options.onMuteToggle) {
        const muted = this.options.onMuteToggle();
        this.updateMuteDisplay(muted);
      }
    });

    eventBus.on('roamer:auraAlert', ({ speciesId, mapId }) => {
      this.showRoamerAlert(speciesId, mapId);
    });

    eventBus.on('roamer:updated', ({ roamers }) => {
      this.updatePokegear(roamers, roamerStatusList);
    });
  }

  private setupTouchGamepad(): void {
    const dpadBase = this.rootElement.querySelector('#virtual-dpad-base') as HTMLDivElement;
    const btnA = this.rootElement.querySelector('#virtual-btn-a') as HTMLButtonElement;
    const btnB = this.rootElement.querySelector('#virtual-btn-b') as HTMLButtonElement;

    const highlightDpadSegment = (dir: Direction | null) => {
      (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).forEach((d) => {
        const seg = this.dpadSegments[d];
        if (!seg) return;
        if (d === dir) {
          seg.style.transform = 'scale(0.92)';
          seg.style.background = '#0284c7';
          seg.style.boxShadow = '0 0 12px #38bdf8';
          seg.style.color = '#ffffff';
        } else {
          seg.style.transform = 'scale(1)';
          seg.style.background = 'rgba(30, 41, 59, 0.9)';
          seg.style.boxShadow = 'none';
          seg.style.color = '#e2e8f0';
        }
      });
    };

    const resetJoystickKnob = () => {
      if (this.joystickKnob) {
        this.joystickKnob.style.transform = 'translate(0px, 0px)';
        this.joystickKnob.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.65), 0 0 12px rgba(56, 189, 248, 0.45)';
      }
    };

    const resolveDirectionFromPoint = (clientX: number, clientY: number): Direction | null => {
      const rect = dpadBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (this.touchControlStyle === 'JOYSTICK' && this.joystickKnob) {
        const maxRadius = 44;
        const clampedDist = Math.min(maxRadius, dist);
        const angle = Math.atan2(dy, dx);
        const clampedDx = Math.round(Math.cos(angle) * clampedDist);
        const clampedDy = Math.round(Math.sin(angle) * clampedDist);
        this.joystickKnob.style.transform = `translate(${clampedDx}px, ${clampedDy}px)`;
        this.joystickKnob.style.boxShadow =
          dist >= 12
            ? '0 4px 16px rgba(0, 0, 0, 0.75), 0 0 18px #38bdf8'
            : '0 4px 14px rgba(0, 0, 0, 0.65), 0 0 12px rgba(56, 189, 248, 0.45)';
      }

      const deadzone = this.touchControlStyle === 'JOYSTICK' ? 12 : 16;
      if (dist < deadzone) return null;

      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'RIGHT' : 'LEFT';
      }
      return dy > 0 ? 'DOWN' : 'UP';
    };

    const updateTouchDir = (dir: Direction | null) => {
      this.touchDirection = dir;
      if (dir === null) {
        resetJoystickKnob();
      }
      highlightDpadSegment(dir);
      this.computeActiveDirection();
    };

    dpadBase.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          const t = e.touches[0];
          updateTouchDir(resolveDirectionFromPoint(t.clientX, t.clientY));
        }
      },
      { passive: false }
    );

    dpadBase.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          const t = e.touches[0];
          updateTouchDir(resolveDirectionFromPoint(t.clientX, t.clientY));
        }
      },
      { passive: false }
    );

    const endTouch = (e: TouchEvent) => {
      e.preventDefault();
      updateTouchDir(null);
    };
    dpadBase.addEventListener('touchend', endTouch, { passive: false });
    dpadBase.addEventListener('touchcancel', endTouch, { passive: false });

    // Pointer fallback for desktop gamepad testing
    let isPointerDownOnDpad = false;
    dpadBase.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isPointerDownOnDpad = true;
      updateTouchDir(resolveDirectionFromPoint(e.clientX, e.clientY));
    });
    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!isPointerDownOnDpad || e.pointerType === 'touch') return;
      updateTouchDir(resolveDirectionFromPoint(e.clientX, e.clientY));
    });
    window.addEventListener('pointerup', (e: PointerEvent) => {
      if (!isPointerDownOnDpad || e.pointerType === 'touch') return;
      isPointerDownOnDpad = false;
      updateTouchDir(null);
    });

    // Virtual A Button (Confirm / Interact)
    const triggerButtonA = (e: Event) => {
      e.preventDefault();
      if (this.dialogueActive) {
        this.advanceDialogue();
      } else if (this.options.onInteract) {
        this.options.onInteract();
      }
    };
    btnA.addEventListener('touchstart', triggerButtonA, { passive: false });
    btnA.addEventListener('click', (e) => {
      if ('ontouchstart' in window) return;
      triggerButtonA(e);
    });

    // Virtual B Button (Cancel / Fast-Forward)
    const triggerButtonB = (e: Event) => {
      e.preventDefault();
      if (this.dialogueActive) {
        this.advanceDialogue();
        return;
      }
      if (this.isPokegearOpen()) {
        const pokegearModal = this.rootElement.querySelector('#pokegear-modal') as HTMLDivElement;
        pokegearModal.style.display = 'none';
        return;
      }
      if (this.options.isModalOpen?.() && this.options.onMenuToggle) {
        this.options.onMenuToggle();
      }
    };
    btnB.addEventListener('touchstart', triggerButtonB, { passive: false });
    btnB.addEventListener('click', (e) => {
      if ('ontouchstart' in window) return;
      triggerButtonB(e);
    });
  }

  public isDialogueOpen(): boolean {
    const starterModal = this.rootElement.querySelector('#starter-choice-modal') as HTMLElement | null;
    const starterOpen = starterModal ? starterModal.style.display === 'flex' : false;
    const healOverlay = this.rootElement.querySelector('#pokecenter-heal-overlay') as HTMLElement | null;
    const healOpen = healOverlay ? healOverlay.style.display === 'flex' : false;
    const fieldRestOverlay = this.rootElement.querySelector('#field-rest-overlay') as HTMLElement | null;
    const fieldRestOpen = fieldRestOverlay ? fieldRestOverlay.style.display === 'block' : false;
    return this.dialogueActive || starterOpen || healOpen || fieldRestOpen;
  }

  /**
   * Plays a canonical Game Boy Color field rest whitish flash/fade (Mom, Prof. Elm, Mr. Pokémon)
   * with recovery jingle while keeping the 6-slot counter tray exclusive to Pokémon Centers.
   */
  public playFieldRestAnimation(onComplete?: () => void): void {
    this.activeDirection = null;
    let overlay = this.rootElement.querySelector('#field-rest-overlay') as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'field-rest-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        z-index: 60;
        opacity: 0;
        pointer-events: auto;
        display: none;
        transition: opacity 0.22s ease-in-out;
      `;
      this.rootElement.appendChild(overlay);
    } else {
      overlay.style.background = '#ffffff';
    }

    overlay.style.display = 'block';
    overlay.style.opacity = '1';
    BattleAudio.playOverworldSound('HEAL_JINGLE');

    // Step 1-3: Fade to whitish screen (220ms) + Hold whiteout (650ms) = 870ms
    setTimeout(() => {
      if (overlay) {
        overlay.style.opacity = '0';
      }
    }, 870);

    // Step 4-5: Fade from white (250ms) -> clean up and invoke callback at 1120ms
    setTimeout(() => {
      if (overlay) {
        overlay.style.display = 'none';
      }
      if (onComplete) onComplete();
    }, 1120);
  }

  /**
   * Plays an authentic Pokémon Center 6-slot Poké Ball healing tray animation with glowing pulse and chime.
   */
  public playHealingAnimation(partyCount: number, onComplete?: () => void): void {
    this.activeDirection = null;
    const clampedCount = Math.max(1, Math.min(6, partyCount || 1));

    let overlay = this.rootElement.querySelector('#pokecenter-heal-overlay') as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pokecenter-heal-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(250, 204, 21, 0.16) 0%, rgba(15, 23, 42, 0.55) 100%);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 65;
        pointer-events: auto;
        transition: opacity 0.22s ease;
      `;
      this.rootElement.appendChild(overlay);
    }

    const slotsHtml = Array.from({ length: 6 })
      .map((_, i) => {
        const occupied = i < clampedCount;
        return `
          <div id="heal-tray-slot-${i}" data-occupied="${occupied}" style="
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(15, 23, 42, 0.9);
            border: 2px solid ${occupied ? '#64748b' : 'rgba(71, 85, 105, 0.35)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            opacity: ${occupied ? '0.45' : '0.2'};
            transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
          ">${occupied ? '🔴' : '⚪'}</div>
        `;
      })
      .join('');

    overlay.innerHTML = `
      <div style="
        width: min(380px, 90vw);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%);
        border: 3px solid #facc15;
        outline: 3px solid #1e293b;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.85), 0 0 28px rgba(250, 204, 21, 0.35);
        border-radius: 14px;
        padding: 20px 22px;
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      ">
        <div style="font-size: 11px; font-weight: 800; color: #facc15; letter-spacing: 1.2px;">💖 POKéMON CENTER HEALING MACHINE</div>
        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          padding: 12px 18px;
          background: rgba(30, 41, 59, 0.85);
          border: 1.5px solid rgba(250, 204, 21, 0.35);
          border-radius: 12px;
        ">
          ${slotsHtml}
        </div>
        <div id="heal-tray-status" style="font-size: 14px; font-weight: 800; color: #fef08a; text-align: center;">
          Restoring POKéMON to full health…
        </div>
      </div>
    `;

    overlay.style.opacity = '1';
    overlay.style.display = 'flex';
    BattleAudio.playOverworldSound('HEAL_JINGLE');

    // Fixed canonical timing synced to the 8-note HEAL_JINGLE audio regardless of turbo speed
    const stepMs = 180;
    for (let i = 0; i < clampedCount; i++) {
      setTimeout(() => {
        const slotEl = overlay?.querySelector(`#heal-tray-slot-${i}`) as HTMLElement | null;
        if (slotEl) {
          slotEl.style.opacity = '1';
          slotEl.style.borderColor = '#facc15';
          slotEl.style.boxShadow = '0 0 14px #facc15';
          slotEl.style.transform = 'scale(1.14)';
        }
      }, i * stepMs);
    }

    const pulseDelay = clampedCount * stepMs + 250;
    setTimeout(() => {
      for (let i = 0; i < clampedCount; i++) {
        const slotEl = overlay?.querySelector(`#heal-tray-slot-${i}`) as HTMLElement | null;
        if (slotEl) {
          slotEl.style.borderColor = '#4ade80';
          slotEl.style.boxShadow = '0 0 18px #4ade80';
          slotEl.style.transform = 'scale(1.0)';
        }
      }
      const statusEl = overlay?.querySelector('#heal-tray-status') as HTMLElement | null;
      if (statusEl) {
        statusEl.style.color = '#4ade80';
        statusEl.innerText = '✨ Your POKéMON were fully healed!';
      }
    }, pulseDelay);

    const totalDuration = pulseDelay + 1400;
    setTimeout(() => {
      if (overlay) {
        overlay.style.display = 'none';
      }
      if (onComplete) onComplete();
    }, totalDuration);
  }

  /**
   * Opens an interactive starter Pokémon confirmation modal with pixel sprite preview and [YES] / [NO] choice (Ticket 6.1).
   */
  public openStarterChoiceModal(
    speciesId: 'cyndaquil' | 'totodile' | 'chikorita',
    speciesLabel: string,
    typeLabel: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.activeDirection = null;
    let modal = this.rootElement.querySelector('#starter-choice-modal') as HTMLDivElement | null;
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'starter-choice-modal';
      modal.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(420px, 92vw);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%);
        border: 3px solid #f8fafc;
        outline: 3px solid #1e293b;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.85), inset 0 0 0 2px #38bdf8;
        border-radius: 12px;
        padding: 18px 20px;
        color: #f8fafc;
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        z-index: 60;
        pointer-events: auto;
      `;
      this.rootElement.appendChild(modal);
    }

    const accentColor =
      speciesId === 'cyndaquil' ? '#ef4444' : speciesId === 'totodile' ? '#38bdf8' : '#22c55e';

    modal.innerHTML = `
      <div style="font-size: 11px; font-weight: 800; color: ${accentColor}; letter-spacing: 1px;">🔴 PROF. ELM'S STARTER POKé BALL</div>
      <div style="
        width: 88px;
        height: 88px;
        background: rgba(30, 41, 59, 0.85);
        border: 2px solid ${accentColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 18px ${accentColor}55;
      ">
        <img src="./assets/sprites/pokemon/${speciesId}_front.png" alt="${speciesLabel}" style="width: 68px; height: 68px; image-rendering: pixelated; object-fit: contain;" />
      </div>
      <div style="font-size: 15px; font-weight: 700; text-align: center; line-height: 1.45;">
        It's <strong>${speciesLabel}</strong>, a <strong>${typeLabel}</strong> POKéMON!<br/>
        Do you want this POKéMON?
      </div>
      <div style="display: flex; gap: 12px; width: 100%; margin-top: 4px;">
        <button id="starter-confirm-yes" style="
          flex: 1;
          background: #16a34a;
          color: #ffffff;
          border: 2px solid #86efac;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">YES</button>
        <button id="starter-confirm-no" style="
          flex: 1;
          background: #475569;
          color: #ffffff;
          border: 2px solid #94a3b8;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">NO</button>
      </div>
    `;

    modal.style.display = 'flex';

    const close = () => {
      if (modal) modal.style.display = 'none';
      window.removeEventListener('keydown', keyHandler);
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (!modal || modal.style.display !== 'flex') return;
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
        e.preventDefault();
        close();
        onConfirm();
      } else if (e.code === 'Escape' || e.code === 'KeyX') {
        e.preventDefault();
        close();
        if (onCancel) onCancel();
      }
    };
    setTimeout(() => {
      if (modal && modal.style.display === 'flex') {
        window.addEventListener('keydown', keyHandler);
      }
    }, 0);

    modal.querySelector('#starter-confirm-yes')!.addEventListener('click', () => {
      close();
      onConfirm();
    });
    modal.querySelector('#starter-confirm-no')!.addEventListener('click', () => {
      close();
      if (onCancel) onCancel();
    });
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
    this.activeDirection = null;

    if (speaker) {
      this.dialogueSpeaker.innerText = speaker;
      this.dialogueSpeaker.style.display = 'block';
    } else {
      this.dialogueSpeaker.style.display = 'none';
    }

    this.dialogueBox.style.display = 'block';
    this.startPageTypewriter();
    if (this.dialogueOnPageChange) {
      this.dialogueOnPageChange(0);
    }
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
        this.dialoguePrompt.innerHTML = this.getDialogueContinuePromptHtml(pageLabel);
        this.dialoguePrompt.style.opacity = '1';
      }
    }, OverworldHUD.DIALOGUE_CHAR_DELAY_MS);
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
    this.toastBanner.style.borderColor = '#38bdf8';
    this.toastBanner.innerText = message;
    this.toastBanner.style.display = 'block';
    this.toastTimeout = setTimeout(() => {
      this.toastBanner.style.display = 'none';
    }, durationMs);
  }

  public showMissionToast(
    title: string,
    subtitle: string,
    type: 'unlocked' | 'progress' | 'completed' = 'progress',
    durationMs: number = 3800
  ): void {
    if (!this.toastBanner) return;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    const borderColor = type === 'completed' ? '#4ade80' : type === 'unlocked' ? '#facc15' : '#38bdf8';
    const headerIcon = type === 'completed' ? '🏆 MISSION COMPLETED' : type === 'unlocked' ? '✨ NEW MISSION' : '📜 MISSION PROGRESS';

    this.toastBanner.style.borderColor = borderColor;
    this.toastBanner.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 3px; text-align: center;">
        <span style="font-size: 11px; font-weight: 900; color: ${borderColor}; letter-spacing: 0.8px;">${headerIcon}: ${title}</span>
        <span style="font-size: 13px; font-weight: 700; color: #f8fafc;">${subtitle}</span>
      </div>
    `;
    this.toastBanner.style.display = 'block';
    this.toastTimeout = setTimeout(() => {
      this.toastBanner.style.display = 'none';
    }, durationMs);
  }

  /**
   * Updates the Pokégear Roamer Radar modal.
   * Redacts all Legendary Beast data when roamers have not yet been awakened in the story (Ticket 4.15).
   */
  public updatePokegear(roamers: RoamerState[], listElement?: HTMLDivElement): void {
    const list = listElement || (this.container.querySelector('#roamer-status-list') as HTMLDivElement);
    if (!list) return;

    list.innerHTML = '';
    const anyAwakened = roamers.some((r) => r.isAwakened);

    if (!anyAwakened) {
      list.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 14px; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.5;">
          📡 <strong>ROAMER RADAR:</strong> Inactive.<br/>No anomalous electromagnetic signatures detected across Johto.
        </div>
      `;
      return;
    }

    for (const r of roamers) {
      if (!r.isAwakened) continue;

      const card = document.createElement('div');
      card.style.cssText = `
        background: #1e293b;
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      `;

      const formattedName = r.speciesId.toUpperCase();
      const formattedRoute = r.currentMapId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      let statusBadge = `<span style="background: #2563eb; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ROAMING</span>`;
      if (r.isCaught) {
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
  }

  public toggleGamepad(): boolean {
    this.isGamepadVisible = !this.isGamepadVisible;
    this.updateGamepadVisibility();
    return this.isGamepadVisible;
  }

  public isGamepadActive(): boolean {
    return this.isGamepadVisible;
  }

  public setGamepadVisible(visible: boolean): void {
    this.isGamepadVisible = visible;
    this.updateGamepadVisibility();
  }

  private applyTouchControlStyleUI(): void {
    const isJoystick = this.touchControlStyle === 'JOYSTICK';
    (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).forEach((d) => {
      const seg = this.dpadSegments[d];
      if (seg) {
        seg.style.display = isJoystick ? 'none' : 'flex';
      }
    });
    if (this.dpadCenterPivot) {
      this.dpadCenterPivot.style.display = isJoystick ? 'none' : 'block';
    }
    if (this.joystickKnob) {
      this.joystickKnob.style.display = isJoystick ? 'block' : 'none';
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
    }
  }

  public setTouchControlStyle(style: TouchControlStyle): void {
    this.touchControlStyle = style === 'JOYSTICK' ? 'JOYSTICK' : 'DPAD';
    this.applyTouchControlStyleUI();
  }

  public getTouchControlStyle(): TouchControlStyle {
    return this.touchControlStyle;
  }

  public toggleTouchControlStyle(): TouchControlStyle {
    const next: TouchControlStyle = this.touchControlStyle === 'DPAD' ? 'JOYSTICK' : 'DPAD';
    this.setTouchControlStyle(next);
    return next;
  }

  public updateSpeedDisplay(speed: SpeedMultiplier): void {
    this.currentSpeed = speed;
    if (this.speedButton) {
      this.updateInputModeLabels();
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
    if (this.isDialogueOpen() || this.options.isModalOpen?.() || this.isPokegearOpen()) return null;
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

      if (e.code === 'Escape' && !e.repeat && this.isVisible() && !this.isDialogueOpen()) {
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

      if (e.code === 'KeyD' || e.code === 'KeyR') {
        if (!e.repeat && this.isVisible() && !this.isDialogueOpen() && this.options.onRadarToggle) {
          e.preventDefault();
          const active = this.options.onRadarToggle();
          this.updateRadarDisplay(active);
          return;
        }
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'KeyE') {
        if (!e.repeat && this.isVisible()) {
          if (this.dialogueActive) {
            e.preventDefault();
            this.advanceDialogue();
          } else if (!this.isDialogueOpen() && this.options.onInteract) {
            e.preventDefault();
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
      this.touchDirection = null;
      this.activeDirection = null;
    });
  }

  private computeActiveDirection(): void {
    if (this.dialogueActive) {
      this.activeDirection = null;
      return;
    }
    if (this.touchDirection) {
      this.activeDirection = this.touchDirection;
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
