/**
 * @fileoverview RadioTowerQuizUI domain module implementation.
 * @module ui/RadioTowerQuizUI
 * @role RadioTowerQuizUI Component
 * @exports QuizQuestion, RADIO_TOWER_QUIZ_QUESTIONS, RadioTowerQuizCallbacks
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-258: Implementation | L259-516: Handlers & Exports
 */

/**
 * Goldenrod Radio Tower Quiz Overlay (Google Stitch Neo-Kanto Protocol)
 * Desktop Screen: 1a4d03fc112b4e90ae7562f68744370f
 * Mobile Screen: 928ff00c501e4cb49eec4d25088a3be0 (100dvh safe-area)
 * Ticket: TICKET-WORLD-GOLDENROD-CITY-01
 */

export interface QuizQuestion {
  id: number;
  prompt: string;
  correctAnswer: boolean; // true = YES, false = NO
  explanation: string;
}

export const RADIO_TOWER_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: 'Is there a Pokémon that appears only in the morning?',
    correctAnswer: true,
    explanation: 'Correct! Pokémon like Ledyba and Spinarak only appear during specific times of day in Johto!',
  },
  {
    id: 2,
    prompt: "Is this statement correct? You can't buy a BERRY at a MART.",
    correctAnswer: true,
    explanation: 'Correct! Berries grow naturally on fruit trees throughout Johto and cannot be purchased in Marts!',
  },
  {
    id: 3,
    prompt: 'Does HM01 contain the move FLASH?',
    correctAnswer: false,
    explanation: 'Correct! HM01 contains CUT. FLASH is contained in HM05!',
  },
  {
    id: 4,
    prompt: 'Is FALKNER the VIOLET GYM LEADER who uses bird Pokémon?',
    correctAnswer: true,
    explanation: 'Correct! Leader Falkner commands Flying-type bird Pokémon at the Violet City Gym!',
  },
  {
    id: 5,
    prompt: "Do GOLDENROD GAME CORNER's slots have CHARMANDER on their reels?",
    correctAnswer: false,
    explanation: 'Correct! Goldenrod slots feature Pikachu, Poké Balls, Staryu, and 7s, but no Charmander!',
  },
];

export interface RadioTowerQuizCallbacks {
  onComplete: () => void;
  onClose: () => void;
}

export class RadioTowerQuizUI {
  private containerId: string;
  private active: boolean = false;
  private currentQuestionIdx: number = 0;
  private focusedChoice: boolean = true; // true = YES, false = NO
  private isFailed: boolean = false;
  private isCompleted: boolean = false;
  private callbacks: RadioTowerQuizCallbacks | null = null;
  private modalElement: HTMLElement | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string = 'modal-container') {
    this.containerId = containerId;
    this.injectStyles();
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('radio-quiz-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'radio-quiz-styles';
    styleEl.textContent = `
      .quiz-btn-active:hover {
        filter: brightness(1.1);
      }
      .quiz-btn-active:active {
        transform: translateY(2px);
      }
    `;
    document.head.appendChild(styleEl);
  }

  public isOpen(): boolean {
    return this.active;
  }

  public open(callbacks: RadioTowerQuizCallbacks): void {
    this.callbacks = callbacks;
    this.active = true;
    this.currentQuestionIdx = 0;
    this.focusedChoice = true;
    this.isFailed = false;
    this.isCompleted = false;

    this.render();
    this.setupKeyboardShortcuts();
  }

  public close(): void {
    this.active = false;
    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (this.callbacks?.onClose) {
      this.callbacks.onClose();
    }
  }

  private setupKeyboardShortcuts(): void {
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (!this.active) return;
      const key = e.key.toLowerCase();
      if (key === 'escape' || key === 'b') {
        e.stopPropagation();
        e.preventDefault();
        this.close();
      } else if (key === 'arrowleft' || key === 'arrowright' || key === 'a' || key === 'd' || key === 'tab') {
        e.stopPropagation();
        e.preventDefault();
        this.focusedChoice = !this.focusedChoice;
        this.render();
      } else if (key === 'enter' || key === ' ') {
        e.stopPropagation();
        e.preventDefault();
        if (this.isFailed) {
          this.retryQuiz();
        } else if (this.isCompleted) {
          this.finishQuiz();
        } else {
          this.submitAnswer(this.focusedChoice);
        }
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  public submitAnswer(answer: boolean): void {
    const q = RADIO_TOWER_QUIZ_QUESTIONS[this.currentQuestionIdx];
    if (!q) return;

    if (answer === q.correctAnswer) {
      if (this.currentQuestionIdx + 1 >= RADIO_TOWER_QUIZ_QUESTIONS.length) {
        this.isCompleted = true;
        this.render();
      } else {
        this.currentQuestionIdx++;
        this.focusedChoice = true;
        this.render();
      }
    } else {
      this.isFailed = true;
      this.render();
    }
  }

  public retryQuiz(): void {
    this.currentQuestionIdx = 0;
    this.isFailed = false;
    this.isCompleted = false;
    this.focusedChoice = true;
    this.render();
  }

  public finishQuiz(): void {
    const cb = this.callbacks?.onComplete;
    this.close();
    if (cb) cb();
  }

  public render(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (!this.active) return;

    const overlay = document.createElement('div');
    overlay.id = 'radio-tower-quiz-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(7, 11, 20, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      font-family: 'Space Mono', monospace;
      padding: env(safe-area-inset-top, 12px) env(safe-area-inset-right, 12px) env(safe-area-inset-bottom, 12px) env(safe-area-inset-left, 12px);
      box-sizing: border-box;
    `;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const card = document.createElement('div');
    card.id = 'radio-tower-quiz-container';
    card.style.cssText = isMobile
      ? `
        width: 100vw;
        height: 100dvh;
        max-height: 100dvh;
        background: #0D1322;
        padding: 16px 16px calc(env(safe-area-inset-bottom, 16px) + 16px);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        gap: 16px;
        color: #F6F8F3;
      `
      : `
        width: min(640px, 92vw);
        background: #0D1322;
        border: 2px solid #2A3A5E;
        box-shadow: 0 12px 0 0 #070B14;
        border-radius: 4px;
        padding: 24px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 18px;
        color: #F6F8F3;
      `;

    // 1. Frequency Telemetry Banner
    const freqHeader = document.createElement('div');
    freqHeader.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #2A3A5E;
      padding-bottom: 12px;
    `;
    freqHeader.innerHTML = `
      <div>
        <div style="font-weight: 700; font-size: 14px; letter-spacing: 0.08em; color: #FFD028;">
          📻 GOLDENROD RADIO TOWER // QUIZ TERMINAL
        </div>
        <div style="font-size: 11px; color: #8A9DBF; margin-top: 2px;">
          100.5 MHz [MUSIC] • 102.3 MHz [OAK TALK] • 105.7 MHz [PASSWORD]
        </div>
      </div>
      <button id="radio-quiz-close-btn" class="quiz-btn-active" style="
        background: transparent;
        border: 1px solid #2A3A5E;
        color: #8A9DBF;
        padding: 6px 10px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        cursor: pointer;
        border-radius: 3px;
        min-height: 32px;
      ">
        [ESC] CLOSE
      </button>
    `;
    const closeBtn = freqHeader.querySelector('#radio-quiz-close-btn');
    closeBtn?.addEventListener('click', () => this.close());
    card.appendChild(freqHeader);

    // 2. 5-Question Stepper Progress Pips
    const progressPips = document.createElement('div');
    progressPips.id = 'radio-quiz-progress-pips';
    progressPips.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    `;

    RADIO_TOWER_QUIZ_QUESTIONS.forEach((q, idx) => {
      const isPassed = idx < this.currentQuestionIdx || this.isCompleted;
      const isCurrent = idx === this.currentQuestionIdx && !this.isCompleted && !this.isFailed;
      const isErr = idx === this.currentQuestionIdx && this.isFailed;

      let bg = '#141E33';
      let border = '1px solid #2A3A5E';
      let color = '#8A9DBF';

      if (isPassed) {
        bg = '#48C774';
        border = '1px solid #48C774';
        color = '#070B14';
      } else if (isCurrent) {
        bg = '#FFD028';
        border = '1px solid #FFD028';
        color = '#070B14';
      } else if (isErr) {
        bg = '#EE4238';
        border = '1px solid #EE4238';
        color = '#F6F8F3';
      }

      const pip = document.createElement('div');
      pip.style.cssText = `
        flex: 1;
        padding: 6px 0;
        text-align: center;
        background: ${bg};
        border: ${border};
        color: ${color};
        font-size: 11px;
        font-weight: 700;
        border-radius: 3px;
      `;
      pip.textContent = `Q0${q.id}`;
      progressPips.appendChild(pip);
    });
    card.appendChild(progressPips);

    // 3. Body View: Active Question / Error / Victory
    if (this.isFailed) {
      // Failure View
      const failCard = document.createElement('div');
      failCard.id = 'radio-quiz-fail-card';
      failCard.style.cssText = `
        background: #141E33;
        border: 2px solid #EE4238;
        border-radius: 4px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      `;
      failCard.innerHTML = `
        <div style="font-size: 28px;">❌</div>
        <div style="font-weight: 700; font-size: 16px; color: #EE4238;">
          BZZT! INCORRECT ANSWER!
        </div>
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #F6F8F3; line-height: 1.5;">
          Oh dear! That wasn't the right answer. Review your Johto Pokémon knowledge and give it another shot!
        </div>
        <button id="radio-quiz-retry-btn" class="quiz-btn-active" style="
          background: #FFD028;
          color: #070B14;
          border: 1px solid #070B14;
          box-shadow: 0 4px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          padding: 12px;
          cursor: pointer;
          min-height: 48px;
          border-radius: 3px;
          margin-top: 8px;
        ">
          RETRY QUIZ FROM QUESTION 1
        </button>
      `;
      const retryBtn = failCard.querySelector('#radio-quiz-retry-btn');
      retryBtn?.addEventListener('click', () => this.retryQuiz());
      card.appendChild(failCard);
    } else if (this.isCompleted) {
      // Victory View
      const victoryCard = document.createElement('div');
      victoryCard.id = 'radio-quiz-victory-card';
      victoryCard.style.cssText = `
        background: #141E33;
        border: 2px solid #48C774;
        border-radius: 4px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      `;
      victoryCard.innerHTML = `
        <div style="font-size: 32px;">📻</div>
        <div style="font-weight: 700; font-size: 16px; color: #48C774;">
          PERFECT SCORE! 5 / 5 CORRECT!
        </div>
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #F6F8F3; line-height: 1.5;">
          Congratulations! You answered every question accurately! You have been certified as an official Johto Radio listener!
        </div>
        <div style="background: #0D1322; border: 1px solid #2A3A5E; padding: 12px; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 12px;">
          <img src="./assets/sprites/items/radio_card.png" onerror="this.onerror=null; this.src='./assets/sprites/items/bicycle.png';" style="width: 32px; height: 32px; image-rendering: pixelated;" alt="Radio Card" />
          <div style="text-align: left;">
            <div style="font-weight: 700; font-size: 13px; color: #FFD028;">RADIO CARD</div>
            <div style="font-size: 11px; color: #8A9DBF;">Installed into Pokégear</div>
          </div>
        </div>
        <button id="radio-quiz-claim-btn" class="quiz-btn-active" style="
          background: #FFD028;
          color: #070B14;
          border: 1px solid #070B14;
          box-shadow: 0 4px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          padding: 12px;
          cursor: pointer;
          min-height: 48px;
          border-radius: 3px;
          margin-top: 8px;
        ">
          CLAIM RADIO CARD [ENTER]
        </button>
      `;
      const claimBtn = victoryCard.querySelector('#radio-quiz-claim-btn');
      claimBtn?.addEventListener('click', () => this.finishQuiz());
      card.appendChild(victoryCard);
    } else {
      // Active Question View
      const curQ = RADIO_TOWER_QUIZ_QUESTIONS[this.currentQuestionIdx];

      const questionBox = document.createElement('div');
      questionBox.id = 'radio-quiz-question-box';
      questionBox.style.cssText = `
        background: #141E33;
        border: 1px solid #2A3A5E;
        border-radius: 4px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      `;
      questionBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 11px; font-weight: 700; color: #2A75D3;">QUESTION ${curQ.id} OF 5</span>
          <span style="font-size: 11px; color: #8A9DBF;">OFFICIAL BROADCAST TEST</span>
        </div>
        <div style="font-size: 14px; font-weight: 700; line-height: 1.6; color: #F6F8F3; min-height: 48px;">
          "${curQ.prompt}"
        </div>
      `;
      card.appendChild(questionBox);

      // Answer Selection Buttons
      const btnContainer = document.createElement('div');
      btnContainer.id = 'radio-quiz-answers-container';
      btnContainer.style.cssText = isMobile
        ? `
          display: flex;
          flex-direction: column;
          gap: 10px;
        `
        : `
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        `;

      // YES Button
      const yesBtn = document.createElement('button');
      yesBtn.id = 'radio-quiz-btn-yes';
      yesBtn.className = 'quiz-btn-active';
      const isYesFocused = this.focusedChoice === true;
      yesBtn.style.cssText = `
        background: ${isYesFocused ? '#FFD028' : '#141E33'};
        color: ${isYesFocused ? '#070B14' : '#F6F8F3'};
        border: 2px solid ${isYesFocused ? '#FFD028' : '#2A3A5E'};
        box-shadow: 0 4px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        font-size: 14px;
        padding: 14px;
        cursor: pointer;
        min-height: 52px;
        border-radius: 3px;
        text-align: center;
      `;
      yesBtn.innerHTML = `[ YES ] ${isYesFocused ? '◄' : ''}`;
      yesBtn.addEventListener('click', () => this.submitAnswer(true));
      btnContainer.appendChild(yesBtn);

      // NO Button
      const noBtn = document.createElement('button');
      noBtn.id = 'radio-quiz-btn-no';
      noBtn.className = 'quiz-btn-active';
      const isNoFocused = this.focusedChoice === false;
      noBtn.style.cssText = `
        background: ${isNoFocused ? '#EE4238' : '#141E33'};
        color: ${isNoFocused ? '#070B14' : '#EE4238'};
        border: 2px solid #EE4238;
        box-shadow: 0 4px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        font-size: 14px;
        padding: 14px;
        cursor: pointer;
        min-height: 52px;
        border-radius: 3px;
        text-align: center;
      `;
      noBtn.innerHTML = `[ NO ] ${isNoFocused ? '◄' : ''}`;
      noBtn.addEventListener('click', () => this.submitAnswer(false));
      btnContainer.appendChild(noBtn);

      card.appendChild(btnContainer);
    }

    overlay.appendChild(card);
    const host = document.getElementById(this.containerId) || document.body;
    host.appendChild(overlay);
    this.modalElement = overlay;
  }
}
