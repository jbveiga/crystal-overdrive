import type { PlayerGender } from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';

export type IntroStage =
  | 'WELCOME'
  | 'POKEMON_REVEAL'
  | 'GENDER_SELECT'
  | 'NAME_INPUT'
  | 'CLOCK_SETUP'
  | 'SHRINK_WARP';

export interface IntroCompletionPayload {
  name: string;
  gender: PlayerGender;
}

export interface IntroSequenceCallbacks {
  onComplete: (payload: IntroCompletionPayload) => Promise<void> | void;
}

export const BOY_NAME_PRESETS: readonly string[] = ['GOLD', 'CHRIS', 'MAT', 'ALLAN', 'JON'];
export const GIRL_NAME_PRESETS: readonly string[] = ['KRIS', 'AMANDA', 'JUANA', 'JODI'];

const WELCOME_PAGES: readonly string[] = [
  '…… …… ……\nHello! Sorry to keep you waiting!',
  'Welcome to the world of POKéMON!\nMy name is OAK.',
  'People affectionately refer to me as the POKéMON PROFESSOR.',
];

const POKEMON_REVEAL_PAGES: readonly string[] = [
  'This world is inhabited far and wide by creatures called POKéMON!',
  'People and POKéMON live together by supporting each other. Some play with POKéMON, some battle with them.',
  "But we don't know everything about POKéMON yet. That is why I study POKéMON every day!",
];

/**
 * Professor Oak Introduction & Character Creation Sequence (Ticket 4.3).
 * Executes the 6-stage state machine:
 * `WELCOME -> POKEMON_REVEAL -> GENDER_SELECT -> NAME_INPUT -> CLOCK_SETUP -> SHRINK_WARP`
 * Supports full browser DOM rendering with animated sprites/virtual keyboard and headless unit testing.
 */
export class IntroSequenceUI {
  public static readonly MAX_NAME_LENGTH = 15;

  private container: HTMLElement | null = null;
  private rootElement: HTMLDivElement | null = null;
  private stageViewport: HTMLDivElement | null = null;
  private dialogueTextElement: HTMLDivElement | null = null;
  private dialogueSpeakerElement: HTMLDivElement | null = null;

  private stage: IntroStage = 'WELCOME';
  private pageIndex: number = 0;
  private selectedGender: PlayerGender = 'BOY';
  private playerName: string = 'GOLD';
  private active: boolean = false;
  private completed: boolean = false;
  private callbacks: IntroSequenceCallbacks;

  private walkFrameStep: number = 0;
  private walkAnimTimer: ReturnType<typeof setInterval> | null = null;
  private boundKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    containerId: string = 'modal-container',
    callbacks: IntroSequenceCallbacks = { onComplete: () => {} }
  ) {
    this.callbacks = callbacks;

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

  public start(): void {
    this.stage = 'WELCOME';
    this.pageIndex = 0;
    this.selectedGender = 'BOY';
    this.playerName = 'GOLD';
    this.active = true;
    this.completed = false;
    this.syncDOM();
  }

  public isActive(): boolean {
    return this.active;
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public getStage(): IntroStage {
    return this.stage;
  }

  public getPageIndex(): number {
    return this.pageIndex;
  }

  public getSelectedGender(): PlayerGender {
    return this.selectedGender;
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  /**
   * Returns the canonical Johto quick-pick name presets for a given gender.
   */
  public getPresetsForGender(gender: PlayerGender = this.selectedGender): readonly string[] {
    return gender === 'GIRL' ? GIRL_NAME_PRESETS : BOY_NAME_PRESETS;
  }

  /**
   * Selects BOY or GIRL and updates the default name preset if untouched.
   */
  public selectGender(gender: PlayerGender): void {
    const previousDefault = this.selectedGender === 'GIRL' ? 'KRIS' : 'GOLD';
    this.selectedGender = gender;
    if (!this.playerName || this.playerName === previousDefault) {
      this.playerName = gender === 'GIRL' ? 'KRIS' : 'GOLD';
    }
    BattleAudio.playMenuSound('CURSOR');
    this.syncDOM();
  }

  /**
   * Selects one of the Johto quick-pick preset names (`GOLD`, `CHRIS`, `KRIS`, etc.).
   */
  public selectPresetName(preset: string): string {
    this.setPlayerName(preset);
    BattleAudio.playMenuSound('CONFIRM');
    return this.playerName;
  }

  /**
   * Validates and sets the player's name (1-7 uppercase characters).
   */
  public setPlayerName(rawName: string): string {
    const cleaned = rawName
      .toUpperCase()
      .replace(/[^A-Z0-9!?.\- ]/g, '')
      .slice(0, IntroSequenceUI.MAX_NAME_LENGTH);
    this.playerName = cleaned;
    this.syncDOM();
    return this.playerName;
  }

  /**
   * Appends a single character to the player's name (up to 7 characters).
   */
  public appendNameChar(char: string): string {
    if (this.playerName.length >= IntroSequenceUI.MAX_NAME_LENGTH) {
      return this.playerName;
    }
    return this.setPlayerName(this.playerName + char);
  }

  /**
   * Removes the last character from the player's name.
   */
  public backspaceName(): string {
    if (this.playerName.length === 0) return this.playerName;
    this.playerName = this.playerName.slice(0, -1);
    BattleAudio.playMenuSound('CANCEL');
    this.syncDOM();
    return this.playerName;
  }

  /**
   * Returns the validated non-empty player name (falls back to `GOLD` or `KRIS` if blank).
   */
  public getValidatedName(): string {
    const trimmed = this.playerName.trim();
    if (trimmed.length === 0) {
      return this.selectedGender === 'GIRL' ? 'KRIS' : 'GOLD';
    }
    return trimmed.slice(0, IntroSequenceUI.MAX_NAME_LENGTH);
  }

  /**
   * Resolves the real-time clock (RTC) period and formatted time string.
   */
  public getClockStatus(now: Date = new Date()): {
    period: 'MORNING' | 'DAY' | 'NIGHT';
    icon: string;
    timeFormatted: string;
  } {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (hours >= 4 && hours < 10) {
      return { period: 'MORNING', icon: '🌅', timeFormatted };
    }
    if (hours >= 10 && hours < 18) {
      return { period: 'DAY', icon: '☀️', timeFormatted };
    }
    return { period: 'NIGHT', icon: '🌙', timeFormatted };
  }

  /**
   * Advances the current dialogue page or transitions to the next stage in the state machine:
   * `WELCOME -> POKEMON_REVEAL -> GENDER_SELECT -> NAME_INPUT -> CLOCK_SETUP -> SHRINK_WARP -> COMPLETE`
   */
  public async advance(): Promise<void> {
    if (!this.active || this.completed) return;

    if (this.stage === 'WELCOME') {
      if (this.pageIndex + 1 < WELCOME_PAGES.length) {
        this.pageIndex++;
        BattleAudio.playMenuSound('CURSOR');
        this.syncDOM();
      } else {
        this.stage = 'POKEMON_REVEAL';
        this.pageIndex = 0;
        BattleAudio.playBallEvent('THROW');
        BattleAudio.playCry('marill', false);
        this.syncDOM();
      }
      return;
    }

    if (this.stage === 'POKEMON_REVEAL') {
      if (this.pageIndex + 1 < POKEMON_REVEAL_PAGES.length) {
        this.pageIndex++;
        BattleAudio.playMenuSound('CURSOR');
        this.syncDOM();
      } else {
        this.stage = 'GENDER_SELECT';
        this.pageIndex = 0;
        BattleAudio.playMenuSound('CONFIRM');
        this.syncDOM();
      }
      return;
    }

    if (this.stage === 'GENDER_SELECT') {
      this.playerName = this.selectedGender === 'GIRL' ? 'KRIS' : 'GOLD';
      this.stage = 'NAME_INPUT';
      this.pageIndex = 0;
      BattleAudio.playMenuSound('CONFIRM');
      this.syncDOM();
      return;
    }

    if (this.stage === 'NAME_INPUT') {
      this.playerName = this.getValidatedName();
      this.stage = 'CLOCK_SETUP';
      this.pageIndex = 0;
      BattleAudio.playMenuSound('CONFIRM');
      this.syncDOM();
      return;
    }

    if (this.stage === 'CLOCK_SETUP') {
      this.stage = 'SHRINK_WARP';
      this.pageIndex = 0;
      BattleAudio.playMenuSound('CONFIRM');
      this.syncDOM();
      return;
    }

    if (this.stage === 'SHRINK_WARP') {
      await this.completeSequence();
    }
  }

  /**
   * Completes the intro sequence and invokes `onComplete({ name, gender })`.
   */
  public async completeSequence(): Promise<IntroCompletionPayload> {
    const finalPayload: IntroCompletionPayload = {
      name: this.getValidatedName(),
      gender: this.selectedGender,
    };
    this.completed = true;
    this.active = false;
    BattleAudio.playOverworldSound('DOOR');
    this.syncDOM();
    await this.callbacks.onComplete(finalPayload);
    return finalPayload;
  }

  public handleKeyDown(e: { code?: string; key?: string; preventDefault?: () => void }): void {
    if (!this.active || this.completed) return;

    const code = e.code || '';
    const key = e.key || '';

    if (this.stage === 'GENDER_SELECT') {
      if (code === 'ArrowLeft' || code === 'KeyA' || key === 'ArrowLeft' || key === 'a' || key === 'A') {
        e.preventDefault?.();
        this.selectGender('BOY');
        return;
      }
      if (code === 'ArrowRight' || code === 'KeyD' || key === 'ArrowRight' || key === 'd' || key === 'D') {
        e.preventDefault?.();
        this.selectGender('GIRL');
        return;
      }
    }

    if (this.stage === 'NAME_INPUT') {
      if (code === 'Backspace' || key === 'Backspace') {
        e.preventDefault?.();
        this.backspaceName();
        return;
      }
      if (code === 'Enter' || key === 'Enter') {
        e.preventDefault?.();
        void this.advance();
        return;
      }
      if (key && key.length === 1 && /^[a-zA-Z0-9!?.\- ]$/.test(key)) {
        e.preventDefault?.();
        this.appendNameChar(key);
        BattleAudio.playMenuSound('CURSOR');
        return;
      }
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
      void this.advance();
    }
  }

  public hide(): void {
    this.active = false;
    this.syncDOM();
  }

  public destroy(): void {
    if (this.walkAnimTimer) {
      clearInterval(this.walkAnimTimer);
      this.walkAnimTimer = null;
    }
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
    if (document.getElementById('crystal-intro-sequence-styles')) return;

    const style = document.createElement('style');
    style.id = 'crystal-intro-sequence-styles';
    style.textContent = `
      @keyframes introPokemonBounce {
        0%, 100% { transform: translateY(0px) scale(1); }
        45% { transform: translateY(-14px) scale(1.06); }
      }
      @keyframes introShrinkRay {
        0% { transform: scale(1); filter: brightness(1); opacity: 1; }
        45% { transform: scale(0.55); filter: brightness(2.5) hue-rotate(45deg); opacity: 0.95; }
        100% { transform: scale(0.08); filter: brightness(4); opacity: 0.15; }
      }
      .intro-pixel-sprite {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
      }
    `;
    document.head.appendChild(style);
  }

  private createDOM(): void {
    if (!this.container || typeof document === 'undefined') return;

    this.rootElement = document.createElement('div');
    this.rootElement.id = 'intro-sequence-root';
    this.rootElement.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 38%, #1e293b 0%, #090d16 70%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: max(20px, env(safe-area-inset-top, 20px)) max(20px, env(safe-area-inset-right, 20px)) max(24px, env(safe-area-inset-bottom, 24px)) max(20px, env(safe-area-inset-left, 20px));
      box-sizing: border-box;
      pointer-events: auto;
      z-index: 110;
      user-select: none;
    `;

    // Top Progress Pill
    const topHeader = document.createElement('div');
    topHeader.style.cssText = `
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #7dd3fc;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.35);
      padding: 6px 16px;
      border-radius: 999px;
    `;
    topHeader.textContent = '🎓 PROFESSOR OAK — NEW ADVENTURE REGISTRATION';
    this.rootElement.appendChild(topHeader);

    // Center Spotlight Stage Viewport
    this.stageViewport = document.createElement('div');
    this.stageViewport.id = 'intro-stage-viewport';
    this.stageViewport.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: min(640px, 94vw);
      min-height: 290px;
      margin: auto 0;
    `;
    this.rootElement.appendChild(this.stageViewport);

    // Classic Gen 2 Dialogue Box at Bottom
    const dialogueWrapper = document.createElement('div');
    dialogueWrapper.style.cssText = `
      width: min(680px, 94vw);
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(10, 15, 29, 0.99) 100%);
      border: 3px solid #f8fafc;
      outline: 3px solid #1e293b;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), inset 0 0 0 2px #38bdf8;
      border-radius: 10px;
      padding: 16px 22px;
      color: #f8fafc;
      cursor: pointer;
      margin-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    `;

    this.dialogueSpeakerElement = document.createElement('div');
    this.dialogueSpeakerElement.style.cssText = `
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
    `;
    this.dialogueSpeakerElement.textContent = '🎓 PROF. OAK';

    this.dialogueTextElement = document.createElement('div');
    this.dialogueTextElement.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
      min-height: 48px;
      color: #f8fafc;
      white-space: pre-wrap;
    `;

    const promptRow = document.createElement('div');
    promptRow.style.cssText = `
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 800;
      color: #38bdf8;
      margin-top: 6px;
    `;
    promptRow.innerHTML = `<span>SPACE / ENTER / TAP</span><span>▼</span>`;

    dialogueWrapper.appendChild(this.dialogueSpeakerElement);
    dialogueWrapper.appendChild(this.dialogueTextElement);
    dialogueWrapper.appendChild(promptRow);

    dialogueWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.advance();
    });

    this.rootElement.appendChild(dialogueWrapper);
    this.container.appendChild(this.rootElement);

    // Stepping animation timer for character sprite preview
    this.walkAnimTimer = setInterval(() => {
      this.walkFrameStep = (this.walkFrameStep + 1) % 2;
      const walkPreviews = this.rootElement?.querySelectorAll('[data-walk-sprite]');
      walkPreviews?.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Frame 3 (x = -48px) and Frame 4 (x = -64px) are downWalk1 and downWalk2 on the 144x32 sheet
        const offsetPx = this.walkFrameStep === 0 ? -48 * 3 : -64 * 3;
        htmlEl.style.backgroundPosition = `${offsetPx}px 0px`;
      });
    }, 280);
  }

  private attachKeyboardListeners(): void {
    if (typeof window === 'undefined') return;
    this.boundKeyDownHandler = (e: KeyboardEvent) => {
      if (!this.active) return;
      this.handleKeyDown(e);
    };
    window.addEventListener('keydown', this.boundKeyDownHandler);
  }

  private syncDOM(): void {
    if (!this.rootElement || !this.stageViewport || !this.dialogueTextElement) return;

    this.rootElement.style.display = this.active ? 'flex' : 'none';
    if (!this.active) return;

    this.stageViewport.innerHTML = '';

    if (this.stage === 'WELCOME') {
      this.dialogueTextElement.textContent = WELCOME_PAGES[this.pageIndex] || WELCOME_PAGES[0];
      this.stageViewport.innerHTML = this.renderSpotlightDais(false);
      return;
    }

    if (this.stage === 'POKEMON_REVEAL') {
      this.dialogueTextElement.textContent =
        POKEMON_REVEAL_PAGES[this.pageIndex] || POKEMON_REVEAL_PAGES[0];
      this.stageViewport.innerHTML = this.renderSpotlightDais(true);
      return;
    }

    if (this.stage === 'GENDER_SELECT') {
      this.dialogueTextElement.textContent =
        'Now, tell me a little about yourself.\nAre you a BOY? Or are you a GIRL?';
      this.renderGenderSelectStage();
      return;
    }

    if (this.stage === 'NAME_INPUT') {
      this.dialogueTextElement.textContent = `Let's begin with your name. What is it?\n(Choose a Johto preset or type 1–15 characters, then press CONFIRM)`;
      this.renderNameInputStage();
      return;
    }

    if (this.stage === 'CLOCK_SETUP') {
      const clock = this.getClockStatus();
      this.dialogueTextElement.textContent = `The real-time Pokégear clock is synchronized to ${clock.timeFormatted} (${clock.period}).\nPress CONFIRM to lock in your adventure time!`;
      this.renderClockSetupStage(clock);
      return;
    }

    if (this.stage === 'SHRINK_WARP') {
      this.dialogueTextElement.textContent = `${this.getValidatedName()}, are you ready? Your very own POKéMON story is about to unfold!\nA world of dreams and adventures with POKéMON awaits! Let's go!`;
      this.renderShrinkWarpStage();
    }
  }

  private renderSpotlightDais(withPokemon: boolean): string {
    return `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 28px;
      ">
        <!-- Spotlight Ellipse -->
        <div style="
          position: absolute;
          bottom: 14px;
          width: 220px;
          height: 54px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(56, 189, 248, 0.48) 0%, rgba(30, 58, 138, 0.12) 75%, transparent 100%);
          border: 2px solid rgba(125, 211, 252, 0.35);
          box-shadow: 0 0 28px rgba(56, 189, 248, 0.45);
        "></div>

        <div style="display: flex; align-items: flex-end; gap: 24px; z-index: 2;">
          <!-- Professor Sprite (64x128 upscaled from 16x32 frame 0) -->
          <div class="intro-pixel-sprite" style="
            width: 64px;
            height: 128px;
            background-image: url('./assets/sprites/characters/prof_elm.png');
            background-size: 576px 128px;
            background-position: 0px 0px;
            filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.65));
          "></div>

          ${
            withPokemon
              ? `
            <!-- Companion Showcase Pokémon (Marill) -->
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              animation: introPokemonBounce 0.9s infinite ease-in-out;
            ">
              <div style="
                font-size: 11px;
                font-weight: 900;
                color: #38bdf8;
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid #38bdf8;
                border-radius: 999px;
                padding: 2px 8px;
                margin-bottom: 4px;
              ">✨ MARILL!</div>
              <img src="./assets/sprites/pokemon/marill_front.png"
                   alt="Marill"
                   style="width: 56px; height: 56px; image-rendering: pixelated; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));" />
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  private renderGenderSelectStage(): void {
    if (!this.stageViewport) return;

    const boySelected = this.selectedGender === 'BOY';
    const girlSelected = this.selectedGender === 'GIRL';

    this.stageViewport.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 18px; width: 100%;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; width: min(460px, 92vw);">
          <!-- BOY Card -->
          <div id="intro-gender-boy" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 20px 16px;
            border-radius: 14px;
            background: ${boySelected ? 'linear-gradient(180deg, rgba(2, 132, 199, 0.38), rgba(15, 23, 42, 0.92))' : 'rgba(15, 23, 42, 0.75)'};
            border: 3px solid ${boySelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'};
            box-shadow: ${boySelected ? '0 0 24px rgba(56, 189, 248, 0.45)' : 'none'};
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            <div data-walk-sprite="boy" class="intro-pixel-sprite" style="
              width: 48px;
              height: 96px;
              background-image: url('./assets/sprites/characters/gold_walk.png');
              background-size: 432px 96px;
              background-position: -144px 0px;
            "></div>
            <div style="font-size: 16px; font-weight: 900; color: #38bdf8;">
              ${boySelected ? '▶ ' : ''}BOY ♂
            </div>
          </div>

          <!-- GIRL Card -->
          <div id="intro-gender-girl" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 20px 16px;
            border-radius: 14px;
            background: ${girlSelected ? 'linear-gradient(180deg, rgba(225, 29, 72, 0.38), rgba(15, 23, 42, 0.92))' : 'rgba(15, 23, 42, 0.75)'};
            border: 3px solid ${girlSelected ? '#fb7185' : 'rgba(148, 163, 184, 0.25)'};
            box-shadow: ${girlSelected ? '0 0 24px rgba(251, 113, 133, 0.45)' : 'none'};
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            <div data-walk-sprite="girl" class="intro-pixel-sprite" style="
              width: 48px;
              height: 96px;
              background-image: url('./assets/sprites/characters/kris_walk.png');
              background-size: 432px 96px;
              background-position: -144px 0px;
            "></div>
            <div style="font-size: 16px; font-weight: 900; color: #fb7185;">
              ${girlSelected ? '▶ ' : ''}GIRL ♀
            </div>
          </div>
        </div>

        <button id="intro-gender-confirm-btn" style="
          padding: 11px 28px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 900;
          background: #16a34a;
          color: #ffffff;
          border: 2px solid #86efac;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(22, 163, 74, 0.5);
        ">✓ CONFIRM ${this.selectedGender}</button>
      </div>
    `;

    const boyCard = this.stageViewport.querySelector('#intro-gender-boy');
    const girlCard = this.stageViewport.querySelector('#intro-gender-girl');
    const confirmBtn = this.stageViewport.querySelector('#intro-gender-confirm-btn');

    boyCard?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectGender('BOY');
    });
    girlCard?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectGender('GIRL');
    });
    confirmBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.advance();
    });
  }

  private renderNameInputStage(): void {
    if (!this.stageViewport) return;

    const presets = this.getPresetsForGender();
    const spriteUrl =
      this.selectedGender === 'GIRL'
        ? './assets/sprites/characters/kris_walk.png'
        : './assets/sprites/characters/gold_walk.png';
    const slots = Array.from({ length: IntroSequenceUI.MAX_NAME_LENGTH }, (_, idx) => {
      const ch = this.playerName[idx] || '_';
      return `<span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: clamp(16px, 4.2vw, 24px);
        height: 32px;
        border-bottom: 3px solid ${idx < this.playerName.length ? '#38bdf8' : '#475569'};
        font-size: clamp(14px, 3.8vw, 18px);
        font-weight: 900;
        color: ${idx < this.playerName.length ? '#f8fafc' : '#64748b'};
      ">${ch}</span>`;
    }).join('');

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    this.stageViewport.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        width: min(560px, 94vw);
        background: rgba(15, 23, 42, 0.88);
        border: 2px solid rgba(56, 189, 248, 0.4);
        border-radius: 14px;
        padding: 16px;
      ">
        <!-- Sprite + 15-Character Slot Readout -->
        <div style="display: flex; align-items: center; gap: 14px; width: 100%; justify-content: center; flex-wrap: wrap;">
          <div data-walk-sprite="name" class="intro-pixel-sprite" style="
            width: 48px;
            height: 96px;
            background-image: url('${spriteUrl}');
            background-size: 432px 96px;
            background-position: -144px 0px;
          "></div>
          <div style="display: flex; flex-direction: column; gap: 6px; align-items: center; max-width: 100%;">
            <span style="font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 1px;">YOUR NAME (1–15 CHARS)</span>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; max-width: 100%;">${slots}</div>
          </div>
        </div>

        <!-- Johto Canonical Presets -->
        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
          ${presets
            .map(
              (preset) => `
            <button data-preset-name="${preset}" style="
              padding: 6px 12px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 800;
              cursor: pointer;
              background: ${this.playerName === preset ? '#0284c7' : '#1e293b'};
              color: #ffffff;
              border: 1px solid ${this.playerName === preset ? '#7dd3fc' : '#475569'};
            ">★ ${preset}</button>
          `
            )
            .join('')}
        </div>

        <!-- Virtual On-Screen Keyboard Grid -->
        <div style="display: grid; grid-template-columns: repeat(9, 1fr); gap: 5px; width: 100%;">
          ${alphabet
            .map(
              (letter) => `
            <button data-key-char="${letter}" style="
              padding: 7px 0;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 800;
              background: #1e293b;
              color: #f8fafc;
              border: 1px solid #334155;
              cursor: pointer;
            ">${letter}</button>
          `
            )
            .join('')}
          <button id="intro-key-back" style="
            grid-column: span 2;
            padding: 7px 0;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 800;
            background: #dc2626;
            color: #ffffff;
            border: 1px solid #fca5a5;
            cursor: pointer;
          ">⌫ DEL</button>
          <button id="intro-key-ok" style="
            grid-column: span 3;
            padding: 7px 0;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 900;
            background: #16a34a;
            color: #ffffff;
            border: 1px solid #86efac;
            cursor: pointer;
          ">✓ OK</button>
        </div>
      </div>
    `;

    const presetBtns = this.stageViewport.querySelectorAll('[data-preset-name]');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const preset = (btn as HTMLElement).getAttribute('data-preset-name') || 'GOLD';
        this.selectPresetName(preset);
      });
    });

    const charBtns = this.stageViewport.querySelectorAll('[data-key-char]');
    charBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ch = (btn as HTMLElement).getAttribute('data-key-char') || '';
        BattleAudio.playMenuSound('CURSOR');
        this.appendNameChar(ch);
      });
    });

    const backBtn = this.stageViewport.querySelector('#intro-key-back');
    backBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.backspaceName();
    });

    const okBtn = this.stageViewport.querySelector('#intro-key-ok');
    okBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.advance();
    });
  }

  private renderClockSetupStage(clock: {
    period: 'MORNING' | 'DAY' | 'NIGHT';
    icon: string;
    timeFormatted: string;
  }): void {
    if (!this.stageViewport) return;

    this.stageViewport.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        background: rgba(15, 23, 42, 0.88);
        border: 2px solid rgba(56, 189, 248, 0.45);
        border-radius: 16px;
        padding: 24px 32px;
        text-align: center;
      ">
        <div style="font-size: 13px; font-weight: 800; color: #7dd3fc; letter-spacing: 1.5px;">
          📻 POKéGEAR REAL-TIME CLOCK (RTC)
        </div>
        <div style="font-size: 40px; font-weight: 900; color: #f8fafc; letter-spacing: 3px;">
          ${clock.icon} ${clock.timeFormatted}
        </div>
        <div style="
          font-size: 13px;
          font-weight: 800;
          color: #facc15;
          background: rgba(250, 204, 21, 0.14);
          border: 1px solid rgba(250, 204, 21, 0.45);
          padding: 4px 14px;
          border-radius: 999px;
        ">JOHTO TIME PERIOD: ${clock.period}</div>
        <button id="intro-clock-confirm-btn" style="
          margin-top: 6px;
          padding: 10px 28px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 900;
          background: #16a34a;
          color: #ffffff;
          border: 2px solid #86efac;
          cursor: pointer;
        ">✓ CONFIRM TIME</button>
      </div>
    `;

    const confirmBtn = this.stageViewport.querySelector('#intro-clock-confirm-btn');
    confirmBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.advance();
    });
  }

  private renderShrinkWarpStage(): void {
    if (!this.stageViewport) return;

    const spriteUrl =
      this.selectedGender === 'GIRL'
        ? './assets/sprites/characters/kris_walk.png'
        : './assets/sprites/characters/gold_walk.png';

    this.stageViewport.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
      ">
        <div class="intro-pixel-sprite" style="
          width: 64px;
          height: 128px;
          background-image: url('${spriteUrl}');
          background-size: 576px 128px;
          background-position: 0px 0px;
          animation: introShrinkRay 1.3s forwards ease-in-out;
        "></div>
        <button id="intro-enter-johto-btn" style="
          padding: 12px 32px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
          background: linear-gradient(135deg, #0284c7, #7c3aed);
          color: #ffffff;
          border: 2px solid #bae6fd;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.65);
        ">⚡ ENTER NEW BARK TOWN ⚡</button>
      </div>
    `;

    const enterBtn = this.stageViewport.querySelector('#intro-enter-johto-btn');
    enterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.advance();
    });
  }
}
