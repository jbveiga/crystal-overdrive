import { BattleAudio } from '../audio/BattleAudio';
import { injectRuinsPuzzleStyles } from './styles/ruinsPuzzleStyles';

export interface RuinsPuzzleState {
  puzzleId: 'kabuto' | 'omanyte' | 'aerodactyl' | 'ho_oh';
  gridSize: 4; // 4x4 matrix = 16 slots
  tiles: number[]; // 16 elements (0..14 image pieces, 15 is blank)
  isSolved: boolean;
  moveCount: number;
}

export interface RuinsPuzzleModalCallbacks {
  onSolve: (puzzleId: string) => void;
  onClose: () => void;
}

/**
 * Ruins of Alph 16-Tile Sliding Puzzle Mini-Game (Ticket TICKET-MINIGAME-RUINS-SLIDING-PUZZLE-01).
 * Adheres to Google Stitch Neo-Kanto Protocol: dark slate aesthetics,
 * tactile stone sliding mechanics, dual-viewport responsiveness, and keyboard/touch support.
 */
export class RuinsPuzzleModalUI {
  private container: HTMLElement;
  private modalElement: HTMLDivElement | null = null;
  private active: boolean = false;
  private state: RuinsPuzzleState;
  private initialTiles: number[] = [];
  private callbacks: RuinsPuzzleModalCallbacks | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string = 'overworld-hud-container') {
    const el = document.getElementById(containerId) || document.body;
    this.container = el;
    this.state = {
      puzzleId: 'kabuto',
      gridSize: 4,
      tiles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      isSolved: false,
      moveCount: 0,
    };
  }

  public isOpen(): boolean {
    return this.active;
  }

  public getState(): RuinsPuzzleState {
    return { ...this.state, tiles: [...this.state.tiles] };
  }

  public open(callbacks: RuinsPuzzleModalCallbacks, puzzleId: 'kabuto' = 'kabuto'): void {
    this.callbacks = callbacks;
    this.active = true;
    this.state.puzzleId = puzzleId;
    this.state.isSolved = false;
    this.state.moveCount = 0;

    // Generate solvable scrambled state by taking valid random steps from solved
    this.scrambleBoard();
    this.initialTiles = [...this.state.tiles];

    this.render();
    this.bindEvents();
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
  }

  /**
   * Generates a guaranteed 100% mathematically solvable permutation of the 15-puzzle
   * by walking 24 random adjacent moves backwards from the solved state.
   */
  public scrambleBoard(steps: number = 24): void {
    this.state.tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    let blankIdx = 15;

    for (let step = 0; step < steps; step++) {
      const neighbors = this.getAdjacentIndices(blankIdx);
      const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      // Swap blank with chosen neighbor
      [this.state.tiles[blankIdx], this.state.tiles[chosen]] = [
        this.state.tiles[chosen],
        this.state.tiles[blankIdx],
      ];
      blankIdx = chosen;
    }

    // Ensure it's not solved initially
    if (this.checkIsSolved()) {
      const neighbors = this.getAdjacentIndices(blankIdx);
      const chosen = neighbors[0];
      [this.state.tiles[blankIdx], this.state.tiles[chosen]] = [
        this.state.tiles[chosen],
        this.state.tiles[blankIdx],
      ];
    }
  }

  /**
   * Returns valid adjacent grid indices (UP, DOWN, LEFT, RIGHT) for a given index
   */
  public getAdjacentIndices(index: number): number[] {
    const neighbors: number[] = [];
    const r = Math.floor(index / 4);
    const c = index % 4;

    if (r > 0) neighbors.push((r - 1) * 4 + c); // UP
    if (r < 3) neighbors.push((r + 1) * 4 + c); // DOWN
    if (c > 0) neighbors.push(r * 4 + (c - 1)); // LEFT
    if (c < 3) neighbors.push(r * 4 + (c + 1)); // RIGHT

    return neighbors;
  }

  /**
   * Slides the tile at the specified index into the blank space if adjacent
   */
  public slideTile(index: number): boolean {
    if (this.state.isSolved) return false;
    const blankIdx = this.state.tiles.indexOf(15);
    if (blankIdx === -1 || index === blankIdx) return false;

    const r = Math.floor(index / 4);
    const c = index % 4;
    const br = Math.floor(blankIdx / 4);
    const bc = blankIdx % 4;

    const isAdjacent = Math.abs(r - br) + Math.abs(c - bc) === 1;
    if (!isAdjacent) return false;

    // Swap piece with blank space
    [this.state.tiles[index], this.state.tiles[blankIdx]] = [
      this.state.tiles[blankIdx],
      this.state.tiles[index],
    ];
    this.state.moveCount++;

    BattleAudio.playOverworldSound('BUMP');

    if (this.checkIsSolved()) {
      this.handleVictory();
    } else {
      this.updateBoardDOM();
    }

    return true;
  }

  /**
   * Slides tiles using directional intent (e.g. keyboard arrows / WASD)
   */
  public slideDirection(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): boolean {
    if (this.state.isSolved) return false;
    const blankIdx = this.state.tiles.indexOf(15);
    if (blankIdx === -1) return false;

    const br = Math.floor(blankIdx / 4);
    const bc = blankIdx % 4;

    let targetIdx = -1;
    if (direction === 'UP' && br < 3) {
      // Tile below moves UP into blank
      targetIdx = (br + 1) * 4 + bc;
    } else if (direction === 'DOWN' && br > 0) {
      // Tile above moves DOWN into blank
      targetIdx = (br - 1) * 4 + bc;
    } else if (direction === 'LEFT' && bc < 3) {
      // Tile right moves LEFT into blank
      targetIdx = br * 4 + (bc + 1);
    } else if (direction === 'RIGHT' && bc > 0) {
      // Tile left moves RIGHT into blank
      targetIdx = br * 4 + (bc - 1);
    }

    if (targetIdx !== -1) {
      return this.slideTile(targetIdx);
    }
    return false;
  }

  /**
   * Instant solve mechanism (for testing, debug, and optional auto-solve assistance)
   */
  public solve(): void {
    this.state.tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    this.handleVictory();
  }

  /**
   * Resets puzzle to initial scrambled permutation
   */
  public reset(): void {
    if (this.state.isSolved) return;
    this.state.tiles = [...this.initialTiles];
    this.state.moveCount = 0;
    BattleAudio.playMenuSound('CANCEL');
    this.updateBoardDOM();
  }

  public checkIsSolved(): boolean {
    return this.state.tiles.every((val, idx) => val === idx);
  }

  private handleVictory(): void {
    this.state.isSolved = true;
    BattleAudio.playOverworldSound('FANFARE');
    this.updateBoardDOM();

    setTimeout(() => {
      const cb = this.callbacks?.onSolve;
      this.close();
      if (cb) cb(this.state.puzzleId);
    }, 450);
  }

  private bindEvents(): void {
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (!this.active) return;

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.close();
        this.callbacks?.onClose();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.slideDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.slideDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.slideDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.slideDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', this.boundKeyHandler);
  }

  private updateBoardDOM(): void {
    if (!this.modalElement) return;

    const moveCountEl = this.modalElement.querySelector('#ruins-puzzle-move-count');
    if (moveCountEl) {
      moveCountEl.textContent = `MOVES: ${this.state.moveCount}`;
    }

    const statusBadgeEl = this.modalElement.querySelector('#ruins-puzzle-status-badge');
    if (statusBadgeEl) {
      if (this.state.isSolved) {
        statusBadgeEl.textContent = 'SOLVED';
        statusBadgeEl.className = 'ruins-status-badge solved';
      } else {
        statusBadgeEl.textContent = 'UNSOLVED';
        statusBadgeEl.className = 'ruins-status-badge unsolved';
      }
    }

    const board = this.modalElement.querySelector('#ruins-puzzle-board');
    if (board) {
      board.innerHTML = this.renderBoardTiles();
      this.attachTileListeners(board);
    }
  }

  private renderBoardTiles(): string {
    return this.state.tiles
      .map((pieceVal, slotIdx) => {
        if (pieceVal === 15) {
          return `
            <div 
              class="ruins-tile ruins-tile-blank" 
              data-slot="${slotIdx}"
              aria-label="Empty slot"
            ></div>
          `;
        }

        const origRow = Math.floor(pieceVal / 4);
        const origCol = pieceVal % 4;
        const posX = (origCol / 3) * 100;
        const posY = (origRow / 3) * 100;

        return `
          <button 
            type="button"
            class="ruins-tile ruins-tile-piece" 
            data-slot="${slotIdx}"
            data-piece="${pieceVal}"
            aria-label="Tile piece ${pieceVal + 1}"
            style="
              background-image: url('./assets/sprites/pokemon/kabuto_front.png');
              background-size: 400% 400%;
              background-position: ${posX}% ${posY}%;
            "
          >
            <span class="ruins-tile-tag">${pieceVal + 1}</span>
          </button>
        `;
      })
      .join('');
  }

  private attachTileListeners(boardEl: Element): void {
    const tileButtons = boardEl.querySelectorAll<HTMLButtonElement>('.ruins-tile-piece');
    tileButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const slot = parseInt(btn.getAttribute('data-slot') || '-1', 10);
        if (slot >= 0) {
          this.slideTile(slot);
        }
      });
    });
  }

  private render(): void {
    if (this.modalElement) {
      this.modalElement.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'ruins-puzzle-modal';
    modal.className = 'ruins-puzzle-modal-overlay';
    modal.innerHTML = `
      <div class="ruins-puzzle-card" role="dialog" aria-modal="true" aria-label="Ruins of Alph Sliding Puzzle">
        <div class="ruins-puzzle-header">
          <div class="ruins-puzzle-title">
            <span class="ruins-puzzle-glyph">🏛️</span>
            <span>RUINS OF ALPH — KABUTO PANEL</span>
          </div>
          <div class="ruins-puzzle-telemetry">
            <span id="ruins-puzzle-move-count" class="ruins-move-count">MOVES: ${this.state.moveCount}</span>
            <span id="ruins-puzzle-status-badge" class="ruins-status-badge ${
              this.state.isSolved ? 'solved' : 'unsolved'
            }">
              ${this.state.isSolved ? 'SOLVED' : 'UNSOLVED'}
            </span>
          </div>
        </div>

        <p class="ruins-puzzle-inscription">
          "A POKéMON that hid on the sea floor. Eyes on its back scanned the area."
        </p>

        <div id="ruins-puzzle-board" class="ruins-puzzle-board">
          ${this.renderBoardTiles()}
        </div>

        <div class="ruins-puzzle-controls">
          <button type="button" id="ruins-puzzle-reset-btn" class="ruins-btn ruins-btn-secondary">
            ⟲ RESET
          </button>
          <button type="button" id="ruins-puzzle-solve-btn" class="ruins-btn ruins-btn-accent">
            💡 SOLVE
          </button>
          <button type="button" id="ruins-puzzle-cancel-btn" class="ruins-btn ruins-btn-cancel">
            ✕ CLOSE
          </button>
        </div>

        <div class="ruins-puzzle-footer-hints">
          <span>Tap adjacent tiles or use Arrow keys / WASD to slide stone panels</span>
        </div>
      </div>
    `;

    // Inject CSS
    this.injectStyles();

    this.container.appendChild(modal);
    this.modalElement = modal;

    const board = modal.querySelector('#ruins-puzzle-board');
    if (board) {
      this.attachTileListeners(board);
    }

    const resetBtn = modal.querySelector('#ruins-puzzle-reset-btn');
    resetBtn?.addEventListener('click', () => this.reset());

    const solveBtn = modal.querySelector('#ruins-puzzle-solve-btn');
    solveBtn?.addEventListener('click', () => this.solve());

    const cancelBtn = modal.querySelector('#ruins-puzzle-cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.close();
      this.callbacks?.onClose();
    });
  }

  private injectStyles(): void {
    injectRuinsPuzzleStyles();
  }
}
