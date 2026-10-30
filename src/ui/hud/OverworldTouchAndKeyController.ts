/**
 * @fileoverview OverworldTouchAndKeyController domain module implementation.
 * @module ui/hud/OverworldTouchAndKeyController
 * @role OverworldTouchAndKeyController Component
 * @exports TouchAndKeyControllerOptions, OverworldTouchAndKeyController
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-175: Implementation | L176-351: Handlers & Exports
 */

import type { Direction, TouchControlStyle, SpeedMultiplier } from '../../types/game';

export interface TouchAndKeyControllerOptions {
  rootElement: HTMLElement;
  isDialogueOpen: () => boolean;
  isModalOpen?: () => boolean;
  isPokegearOpen?: () => boolean;
  onInteract?: () => void;
  onMenuToggle?: () => void;
  onSpeedCycle?: () => SpeedMultiplier;
  onRadarToggle?: () => boolean;
  updateSpeedDisplay?: (speed: SpeedMultiplier) => void;
  updateRadarDisplay?: (active: boolean) => void;
  advanceDialogue?: () => void;
  isVisible: () => boolean;
  onGamepadVisibilityChanged?: () => void;
}

export class OverworldTouchAndKeyController {
  private opts: TouchAndKeyControllerOptions;
  private gamepadContainer!: HTMLDivElement;
  private dpadSegments: Partial<Record<Direction, HTMLDivElement>> = {};
  private dpadCenterPivot: HTMLDivElement | null = null;
  private joystickKnob: HTMLDivElement | null = null;
  private touchControlStyle: TouchControlStyle = 'DPAD';
  private isGamepadVisible: boolean = false;
  private activeDirection: Direction | null = null;
  private touchDirection: Direction | null = null;
  private heldKeys: Set<string> = new Set();

  constructor(opts: TouchAndKeyControllerOptions) {
    this.opts = opts;
    this.isGamepadVisible =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0));
  }

  public initDOM(): void {
    const root = this.opts.rootElement;
    this.gamepadContainer = root.querySelector('#mobile-gamepad-overlay') as HTMLDivElement;
    this.dpadSegments = {
      UP: root.querySelector('#dpad-seg-up') as HTMLDivElement,
      DOWN: root.querySelector('#dpad-seg-down') as HTMLDivElement,
      LEFT: root.querySelector('#dpad-seg-left') as HTMLDivElement,
      RIGHT: root.querySelector('#dpad-seg-right') as HTMLDivElement,
    };
    this.dpadCenterPivot = root.querySelector('#dpad-center-pivot') as HTMLDivElement | null;
    this.joystickKnob = root.querySelector('#virtual-joystick-knob') as HTMLDivElement | null;

    this.updateGamepadVisibility();
    this.applyTouchControlStyleUI();
    this.setupTouchGamepad();
    this.setupControls();
  }

  public updateGamepadVisibility(): void {
    if (this.gamepadContainer) {
      this.gamepadContainer.style.display = this.isGamepadVisible ? 'block' : 'none';
    }
    this.opts.onGamepadVisibilityChanged?.();
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

  public applyTouchControlStyleUI(): void {
    const isJoystick = this.touchControlStyle === 'JOYSTICK';
    (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).forEach((d) => {
      const seg = this.dpadSegments[d];
      if (seg) seg.style.display = isJoystick ? 'none' : 'flex';
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

  public getHeldDirection(): Direction | null {
    if (this.opts.isDialogueOpen() || this.opts.isModalOpen?.() || this.opts.isPokegearOpen?.()) return null;
    return this.activeDirection;
  }

  public clearActiveDirection(): void {
    this.activeDirection = null;
  }

  public computeActiveDirection(): void {
    if (this.opts.isDialogueOpen()) {
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

  private setupTouchGamepad(): void {
    const root = this.opts.rootElement;
    const dpadBase = root.querySelector('#virtual-dpad-base') as HTMLDivElement | null;
    const btnA = root.querySelector('#virtual-btn-a') as HTMLButtonElement | null;
    const btnB = root.querySelector('#virtual-btn-b') as HTMLButtonElement | null;
    if (!dpadBase || !btnA || !btnB) return;

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
      if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'RIGHT' : 'LEFT';
      return dy > 0 ? 'DOWN' : 'UP';
    };

    const updateTouchDir = (dir: Direction | null) => {
      this.touchDirection = dir;
      if (dir === null) resetJoystickKnob();
      highlightDpadSegment(dir);
      this.computeActiveDirection();
    };

    dpadBase.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const t = e.touches[0];
        updateTouchDir(resolveDirectionFromPoint(t.clientX, t.clientY));
      }
    }, { passive: false });

    dpadBase.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const t = e.touches[0];
        updateTouchDir(resolveDirectionFromPoint(t.clientX, t.clientY));
      }
    }, { passive: false });

    const endTouch = (e: TouchEvent) => {
      e.preventDefault();
      updateTouchDir(null);
    };
    dpadBase.addEventListener('touchend', endTouch, { passive: false });
    dpadBase.addEventListener('touchcancel', endTouch, { passive: false });

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

    const triggerButtonA = (e: Event) => {
      e.preventDefault();
      if (this.opts.isDialogueOpen()) {
        if (this.opts.advanceDialogue) this.opts.advanceDialogue();
      } else if (this.opts.onInteract) {
        this.opts.onInteract();
      }
    };
    btnA.addEventListener('touchstart', triggerButtonA, { passive: false });
    btnA.addEventListener('click', (e) => {
      if ('ontouchstart' in window) return;
      triggerButtonA(e);
    });

    const triggerButtonB = (e: Event) => {
      e.preventDefault();
      if (this.opts.isDialogueOpen()) {
        if (this.opts.advanceDialogue) this.opts.advanceDialogue();
        return;
      }
      if (this.opts.isPokegearOpen?.()) {
        const pokegearModal = root.querySelector('#pokegear-modal') as HTMLDivElement | null;
        if (pokegearModal) pokegearModal.style.display = 'none';
        return;
      }
      if (this.opts.isModalOpen?.() && this.opts.onMenuToggle) {
        this.opts.onMenuToggle();
      }
    };
    btnB.addEventListener('touchstart', triggerButtonB, { passive: false });
    btnB.addEventListener('click', (e) => {
      if ('ontouchstart' in window) return;
      triggerButtonB(e);
    });
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        if (!e.repeat && this.opts.isVisible() && this.opts.onSpeedCycle) {
          const nextSpeed = this.opts.onSpeedCycle();
          if (this.opts.updateSpeedDisplay) this.opts.updateSpeedDisplay(nextSpeed);
        }
        return;
      }

      if (e.code === 'Escape' && !e.repeat && this.opts.isVisible() && !this.opts.isDialogueOpen()) {
        if (this.opts.isPokegearOpen?.()) {
          const pokegearModal = this.opts.rootElement.querySelector('#pokegear-modal') as HTMLDivElement | null;
          if (pokegearModal) pokegearModal.style.display = 'none';
          return;
        }
        if (this.opts.onMenuToggle) {
          e.preventDefault();
          this.opts.onMenuToggle();
          return;
        }
      }

      if (this.opts.isModalOpen?.()) return;

      if (e.code === 'KeyR') {
        if (!e.repeat && this.opts.isVisible() && !this.opts.isDialogueOpen() && this.opts.onRadarToggle) {
          e.preventDefault();
          const active = this.opts.onRadarToggle();
          if (this.opts.updateRadarDisplay) this.opts.updateRadarDisplay(active);
          return;
        }
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'KeyE') {
        if (!e.repeat && this.opts.isVisible()) {
          if (this.opts.isDialogueOpen()) {
            e.preventDefault();
            if (this.opts.advanceDialogue) this.opts.advanceDialogue();
          } else if (this.opts.onInteract) {
            e.preventDefault();
            this.opts.onInteract();
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
}
