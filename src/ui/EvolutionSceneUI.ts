import { Dex } from '@pkmn/dex';
import type { PokemonInstance, PokemonType, BaseStats } from '../types/game';
import { EvolutionManager } from '../world/EvolutionManager';
import { BattleAudio } from '../audio/BattleAudio';

export type EvolutionPhase = 'IDLE' | 'PROMPT' | 'PULSE' | 'TRANSFORM' | 'TRIUMPH' | 'CANCELLED';

export interface StatDeltas {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface EvolutionSceneResult {
  evolved: boolean;
  targetSpecies?: string;
  newSpeciesId?: string;
  statDeltas?: StatDeltas;
  newTypes?: PokemonType[];
}

export interface EvolutionSceneOptions {
  /**
   * Whether timers should automatically advance through phases.
   * Defaults to true; set to false in deterministic unit tests.
   */
  autoAdvance?: boolean;
  /**
   * Duration of the silhouette oscillation phase in ms (default: 8000ms).
   */
  pulseDurationMs?: number;
  /**
   * Whether EvolutionManager.executeEvolution should mutate the pokemon instance upon completion.
   * Defaults to false (caller or post-evolution handler can also invoke it, or set true).
   */
  mutatePokemon?: boolean;
  /**
   * Optional callback invoked when the scene resolves.
   */
  onComplete?: (result: EvolutionSceneResult) => void;
}

const TYPE_COLORS: Record<string, string> = {
  normal: '#8A9BA8',
  fire: '#EE4238',
  water: '#2A75D3',
  grass: '#48C774',
  electric: '#FFD028',
  ice: '#06b6d4',
  fighting: '#c2410c',
  poison: '#9B51E0',
  ground: '#d97706',
  flying: '#6366f1',
  psychic: '#ec4899',
  bug: '#84cc16',
  rock: '#78716c',
  ghost: '#9B51E0',
  dragon: '#5E5CE6',
  steel: '#8A9BA8',
  dark: '#334155',
};

/**
 * Fullscreen Evolution Sequence UI (Ticket 14.2).
 * Conforms to the Google Stitch "Neo-Kanto Protocol" design system:
 * - Desktop Screen: 385e191b496b4dcfa6c178569c740163
 * - Mobile Screen: 6ebea26445114f1384089cc0ad2f4eb4
 *
 * Implements:
 * 1. Fullscreen dark obsidian stage (#0D1322), illuminated circular dais with vertical light beam & rising ember particles.
 * 2. 3-Phase Silhouette Oscillation Engine (1 Hz -> 8 Hz ramp over 8s window).
 * 3. B-Button Cancellation Guardrail (KeyB, Escape, or tactile "[B] Cancel Evolution" button active during [0.5s, 9.5s] / PROMPT & PULSE phases; locked during TRANSFORM & TRIUMPH climax).
 * 4. Post-Evolution Celebration Modal with base stat deltas (+HP, +ATK, +DEF, +SPA, +SPD, +SPE) and new typing capsules.
 */
export class EvolutionSceneUI {
  public static readonly CANCEL_WINDOW_MIN_SEC = 0.5;
  public static readonly CANCEL_WINDOW_MAX_SEC = 9.5;
  public static readonly MIN_OSCILLATION_HZ = 1.0;
  public static readonly MAX_OSCILLATION_HZ = 8.0;

  private container: HTMLElement;
  private rootElement: HTMLDivElement | null = null;
  private phase: EvolutionPhase = 'IDLE';
  private active: boolean = false;

  private pokemon: PokemonInstance | null = null;
  private preEvoName: string = '';
  private preEvoSpeciesId: string = '';
  private targetSpeciesId: string = '';
  private targetSpeciesName: string = '';
  private targetTypes: PokemonType[] = ['Normal'];
  private statDeltas: StatDeltas = {
    hp: 0,
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  };

  private elapsedSec: number = 0;
  private options: EvolutionSceneOptions = {};
  private resolvePromise: ((result: EvolutionSceneResult) => void) | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private phaseTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(containerId: string = 'modal-container') {
    const el =
      typeof document !== 'undefined'
        ? document.getElementById(containerId) || document.body
        : (null as unknown as HTMLElement);
    this.container = el;
    this.injectNeoKantoEvolutionStyles();
  }

  public isOpen(): boolean {
    return this.active;
  }

  public getPhase(): EvolutionPhase {
    return this.phase;
  }

  public getElapsedTime(): number {
    return this.elapsedSec;
  }

  public getStatDeltas(): StatDeltas {
    return { ...this.statDeltas };
  }

  public getTargetTypes(): PokemonType[] {
    return [...this.targetTypes];
  }

  public getPreEvoSpriteUrl(): string {
    return `/assets/sprites/pokemon/${EvolutionManager.normalizeId(this.preEvoSpeciesId)}_front.png`;
  }

  public getTargetSpriteUrl(): string {
    return `/assets/sprites/pokemon/${EvolutionManager.normalizeId(this.targetSpeciesId)}_front.png`;
  }

  /**
   * Computes the silhouette oscillation frequency in Hz at a given elapsed time (seconds).
   * Linearly ramps from 1.0 Hz up to 8.0 Hz over the 8-second oscillation window.
   */
  public getOscillationFrequency(elapsedSec: number = this.elapsedSec): number {
    const progress = Math.max(0, Math.min(1, (elapsedSec - 1.0) / 8.0));
    const hz =
      EvolutionSceneUI.MIN_OSCILLATION_HZ +
      progress * (EvolutionSceneUI.MAX_OSCILLATION_HZ - EvolutionSceneUI.MIN_OSCILLATION_HZ);
    return Number(hz.toFixed(2));
  }

  /**
   * Determines whether B-button cancellation is currently permitted.
   * Active during PROMPT and PULSE phases within the [0.5s, 9.5s] window,
   * and locked out during TRANSFORM climax and TRIUMPH celebration.
   */
  public canCancel(): boolean {
    if (!this.active) return false;
    if (this.phase === 'TRANSFORM' || this.phase === 'TRIUMPH' || this.phase === 'CANCELLED') {
      return false;
    }
    return (
      this.elapsedSec >= EvolutionSceneUI.CANCEL_WINDOW_MIN_SEC &&
      this.elapsedSec <= EvolutionSceneUI.CANCEL_WINDOW_MAX_SEC
    );
  }

  /**
   * Returns current console dialogue text based on the active phase.
   */
  public getDialogueText(): string {
    switch (this.phase) {
      case 'PROMPT':
      case 'PULSE':
        return `What? ${this.preEvoName} is evolving!`;
      case 'TRANSFORM':
        return `${this.preEvoName} is transforming into ${this.targetSpeciesName}!`;
      case 'TRIUMPH':
        return `Congratulations! Your ${this.preEvoName} evolved into ${this.targetSpeciesName}!`;
      case 'CANCELLED':
        return `Huh? ${this.preEvoName} stopped evolving!`;
      default:
        return '';
    }
  }

  /**
   * Launches the fullscreen evolution sequence and returns a Promise resolving with the EvolutionSceneResult.
   */
  public play(
    pokemon: PokemonInstance,
    targetSpeciesId: string,
    options: EvolutionSceneOptions = {}
  ): Promise<EvolutionSceneResult> {
    this.clearTimers();
    this.pokemon = pokemon;
    this.options = {
      autoAdvance: true,
      pulseDurationMs: 5500,
      mutatePokemon: false,
      ...options,
    };

    const oldSpecies = Dex.species.get(pokemon.speciesId);
    const targetSpecies = Dex.species.get(targetSpeciesId);

    this.preEvoSpeciesId = oldSpecies.exists ? oldSpecies.id : EvolutionManager.normalizeId(pokemon.speciesId);
    this.preEvoName = pokemon.nickname || (oldSpecies.exists ? oldSpecies.name.toUpperCase() : pokemon.speciesId.toUpperCase());

    this.targetSpeciesId = targetSpecies.exists
      ? targetSpecies.id
      : EvolutionManager.normalizeId(targetSpeciesId);
    this.targetSpeciesName = targetSpecies.exists
      ? targetSpecies.name.toUpperCase()
      : targetSpeciesId.toUpperCase();
    this.targetTypes = (
      targetSpecies.exists && targetSpecies.types.length > 0
        ? targetSpecies.types
        : pokemon.types
    ) as PokemonType[];

    // Compute base stat deltas between current stats and evolved stats at the Pokémon's level
    if (targetSpecies.exists) {
      const targetBaseStats: BaseStats = {
        hp: targetSpecies.baseStats.hp,
        attack: targetSpecies.baseStats.atk,
        defense: targetSpecies.baseStats.def,
        spAttack: targetSpecies.baseStats.spa,
        spDefense: targetSpecies.baseStats.spd,
        speed: targetSpecies.baseStats.spe,
      };
      const nextStats = EvolutionManager.calculateStats(
        targetBaseStats,
        pokemon.level,
        pokemon.ivs,
        pokemon.evs
      );
      this.statDeltas = {
        hp: Math.max(0, nextStats.hp - pokemon.stats.hp),
        attack: Math.max(0, nextStats.attack - pokemon.stats.attack),
        defense: Math.max(0, nextStats.defense - pokemon.stats.defense),
        spAttack: Math.max(0, nextStats.spAttack - pokemon.stats.spAttack),
        spDefense: Math.max(0, nextStats.spDefense - pokemon.stats.spDefense),
        speed: Math.max(0, nextStats.speed - pokemon.stats.speed),
      };
    } else {
      this.statDeltas = { hp: 2, attack: 2, defense: 2, spAttack: 2, spDefense: 2, speed: 2 };
    }

    this.active = true;
    this.phase = 'PROMPT';
    this.elapsedSec = 0.6; // Enters active prompt window (>= 0.5s)

    BattleAudio.playCry(this.preEvoSpeciesId, false);
    this.bindKeyboard();
    this.render();

    return new Promise<EvolutionSceneResult>((resolve) => {
      this.resolvePromise = resolve;

      if (this.options.autoAdvance) {
        const promptTimer = setTimeout(() => {
          if (!this.active || this.phase !== 'PROMPT') return;
          this.enterPulsePhase();
        }, 1200);

        const pulseDuration = this.options.pulseDurationMs ?? 5500;
        const transformTimer = setTimeout(() => {
          if (!this.active || (this.phase !== 'PULSE' && this.phase !== 'PROMPT')) return;
          this.enterTransformPhase();
        }, 1200 + pulseDuration);

        const triumphTimer = setTimeout(() => {
          if (!this.active || this.phase !== 'TRANSFORM') return;
          this.enterTriumphPhase();
        }, 1200 + pulseDuration + 900);

        this.phaseTimers.push(promptTimer, transformTimer, triumphTimer);
      }
    });
  }

  /**
   * Updates the simulated elapsed time in seconds (useful for deterministic timeline scrubbing in tests).
   */
  public setElapsedTime(seconds: number): void {
    this.elapsedSec = Math.max(0, seconds);
    this.render();
  }

  /**
   * Transitions to Phase 2: Rapid alternating silhouette oscillation.
   */
  public enterPulsePhase(): void {
    if (!this.active || this.phase === 'CANCELLED') return;
    this.phase = 'PULSE';
    if (this.elapsedSec < 1.5) {
      this.elapsedSec = 2.0;
    }
    this.render();
  }

  /**
   * Transitions to Phase 3: Radiant white flash climax (locks out B-button cancellation).
   */
  public enterTransformPhase(): void {
    if (!this.active || this.phase === 'CANCELLED') return;
    this.phase = 'TRANSFORM';
    this.elapsedSec = 9.6; // Past 9.5s cancel window
    this.render();
  }

  /**
   * Transitions to Phase 4: Triumph celebration modal with stat deltas & new typing capsules.
   */
  public enterTriumphPhase(): void {
    if (!this.active || this.phase === 'CANCELLED') return;
    this.phase = 'TRIUMPH';
    this.elapsedSec = 10.0;

    if (this.options.mutatePokemon && this.pokemon) {
      EvolutionManager.executeEvolution(this.pokemon, this.targetSpeciesId);
    }

    BattleAudio.playBallEvent('LEVEL_UP');
    BattleAudio.playCry(this.targetSpeciesId, false);
    this.render();
  }

  /**
   * Advances the state machine one step forward (for user click/A-button or deterministic test stepping).
   */
  public advance(): void {
    if (!this.active) return;

    if (this.phase === 'PROMPT') {
      this.enterPulsePhase();
    } else if (this.phase === 'PULSE') {
      this.enterTransformPhase();
    } else if (this.phase === 'TRANSFORM') {
      this.enterTriumphPhase();
    } else if (this.phase === 'TRIUMPH') {
      this.completeEvolution();
    } else if (this.phase === 'CANCELLED') {
      this.finishCancelled();
    }
  }

  /**
   * Attempts to interrupt and cancel the evolution sequence via B-Button / Escape / Tactile Cancel Pill.
   * Returns true if cancellation succeeded, or false if locked out.
   */
  public cancel(): boolean {
    if (!this.canCancel()) {
      return false;
    }

    this.clearTimers();
    this.phase = 'CANCELLED';
    BattleAudio.playMenuSound('CANCEL');
    this.render();

    if (!this.options.autoAdvance) {
      this.finishCancelled();
    } else {
      const closeTimer = setTimeout(() => {
        this.finishCancelled();
      }, 900);
      this.phaseTimers.push(closeTimer);
    }

    return true;
  }

  /**
   * Completes the evolution celebration and resolves the scene promise with `{ evolved: true, targetSpecies }`.
   */
  public completeEvolution(): void {
    if (!this.active) return;
    const result: EvolutionSceneResult = {
      evolved: true,
      targetSpecies: this.targetSpeciesId,
      newSpeciesId: this.targetSpeciesId,
      statDeltas: { ...this.statDeltas },
      newTypes: [...this.targetTypes],
    };
    this.cleanupAndResolve(result);
  }

  private finishCancelled(): void {
    if (!this.active) return;
    const result: EvolutionSceneResult = {
      evolved: false,
    };
    this.cleanupAndResolve(result);
  }

  private cleanupAndResolve(result: EvolutionSceneResult): void {
    this.clearTimers();
    this.active = false;
    this.phase = 'IDLE';

    if (this.boundKeyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
    }

    if (this.options.onComplete) {
      this.options.onComplete(result);
    }

    if (this.resolvePromise) {
      const resolve = this.resolvePromise;
      this.resolvePromise = null;
      resolve(result);
    }
  }

  private clearTimers(): void {
    for (const timer of this.phaseTimers) {
      clearTimeout(timer);
    }
    this.phaseTimers = [];
  }

  private bindKeyboard(): void {
    if (typeof window === 'undefined') return;
    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
    }

    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (!this.active) return;

      const key = e.key;
      const code = e.code;

      if (key === 'b' || key === 'B' || code === 'KeyB' || key === 'Escape') {
        if (this.canCancel()) {
          e.preventDefault();
          e.stopPropagation();
          this.cancel();
        } else if (this.phase === 'CANCELLED') {
          e.preventDefault();
          this.finishCancelled();
        }
        return;
      }

      if (key === 'Enter' || key === ' ' || key === 'z' || key === 'Z' || code === 'KeyZ') {
        if (this.phase === 'TRIUMPH') {
          e.preventDefault();
          this.completeEvolution();
        } else if (this.phase === 'CANCELLED') {
          e.preventDefault();
          this.finishCancelled();
        }
      }
    };

    window.addEventListener('keydown', this.boundKeyHandler);
  }

  private render(): void {
    if (!this.container || typeof document === 'undefined') return;

    if (!this.rootElement) {
      this.rootElement = document.createElement('div');
      this.rootElement.id = 'evolution-scene-modal';
      this.rootElement.className = 'nk-evo-overlay';
      this.container.appendChild(this.rootElement);
    }

    const primaryType = (this.targetTypes[0] || 'Normal').toLowerCase();
    const accentColor = TYPE_COLORS[primaryType] || '#00F5D4';
    const preSpriteUrl = this.getPreEvoSpriteUrl();
    const targetSpriteUrl = this.getTargetSpriteUrl();
    const dialogueText = this.getDialogueText();
    const oscHz = this.getOscillationFrequency();
    const oscPeriodSec = (1 / Math.max(1, oscHz)).toFixed(3);
    const cancelAllowed = this.canCancel();

    const typeBadgesHtml = this.targetTypes
      .map((t) => {
        const bg = TYPE_COLORS[t.toLowerCase()] || '#8A9BA8';
        return `<span class="nk-evo-type-pill" style="background:${bg}">${t.toUpperCase()}</span>`;
      })
      .join('');

    const statItems = [
      { label: 'HP', val: this.statDeltas.hp },
      { label: 'ATK', val: this.statDeltas.attack },
      { label: 'DEF', val: this.statDeltas.defense },
      { label: 'SPA', val: this.statDeltas.spAttack },
      { label: 'SPD', val: this.statDeltas.spDefense },
      { label: 'SPE', val: this.statDeltas.speed },
    ]
      .map(
        (s) => `
        <div class="nk-evo-stat-chip">
          <span class="nk-evo-stat-label">${s.label}</span>
          <span class="nk-evo-stat-delta">+${s.val}</span>
        </div>
      `
      )
      .join('');

    this.rootElement.innerHTML = `
      <div class="nk-evo-stage" data-phase="${this.phase}" style="--evo-accent: ${accentColor}; --evo-period: ${oscPeriodSec}s;">
        <!-- Top Status Header -->
        <header class="nk-evo-header">
          <div class="nk-evo-protocol-tag">
            <span class="nk-evo-led"></span>
            <span>GENETIC METAMORPHOSIS // PHASE: ${this.phase}</span>
          </div>
          ${
            cancelAllowed
              ? `<button id="evo-cancel-btn" class="nk-evo-cancel-pill" type="button" aria-label="Cancel Evolution">
                  <span class="nk-evo-key-badge">B</span>
                  <span>CANCEL EVOLUTION</span>
                </button>`
              : `<div class="nk-evo-cancel-pill is-locked" aria-disabled="true">
                  <span class="nk-evo-key-badge">B</span>
                  <span>${this.phase === 'CANCELLED' ? 'ABORTED' : 'LOCKED'}</span>
                </div>`
          }
        </header>

        <!-- Central Illuminated Dais & Vertical Light Beam -->
        <main class="nk-evo-arena">
          <div class="nk-evo-light-beam"></div>
          <div class="nk-evo-ember-field">
            <span class="nk-evo-ember e1"></span>
            <span class="nk-evo-ember e2"></span>
            <span class="nk-evo-ember e3"></span>
            <span class="nk-evo-ember e4"></span>
            <span class="nk-evo-ember e5"></span>
            <span class="nk-evo-ember e6"></span>
          </div>

          <div class="nk-evo-sprite-pedestal">
            <div class="nk-evo-aura-ring"></div>
            <div class="nk-evo-whiteout-flash ${this.phase === 'TRANSFORM' ? 'is-active' : ''}"></div>

            <!-- Base Pre-Evolution Sprite -->
            <img
              id="evo-base-sprite"
              class="nk-evo-sprite nk-evo-sprite-base phase-${this.phase.toLowerCase()}"
              src="${preSpriteUrl}"
              alt="${this.preEvoName}"
            />

            <!-- Target Evolved Sprite -->
            <img
              id="evo-target-sprite"
              class="nk-evo-sprite nk-evo-sprite-target phase-${this.phase.toLowerCase()}"
              src="${targetSpriteUrl}"
              alt="${this.targetSpeciesName}"
            />

            <div class="nk-evo-dais-plate">
              <div class="nk-evo-dais-inner"></div>
            </div>
          </div>

          <!-- Post-Evolution Celebration Inspector Card (Shown on TRIUMPH) -->
          ${
            this.phase === 'TRIUMPH'
              ? `<section id="evo-celebration-card" class="nk-evo-celebration-card">
                  <div class="nk-evo-celebration-top">
                    <div class="nk-evo-species-headline">
                      <span class="nk-evo-evolved-tag">EVOLUTION COMPLETE</span>
                      <h2 class="nk-evo-new-species-name">${this.targetSpeciesName}</h2>
                    </div>
                    <div class="nk-evo-type-group">${typeBadgesHtml}</div>
                  </div>
                  <div class="nk-evo-stat-grid">
                    ${statItems}
                  </div>
                </section>`
              : ''
          }
        </main>

        <!-- Bottom Typewriter Dialogue Console Plate -->
        <footer class="nk-evo-console">
          <div class="nk-evo-console-plate">
            <div class="nk-evo-dialogue-content">
              <span class="nk-evo-prompt-caret">▶</span>
              <p id="evo-dialogue-text" class="nk-evo-dialogue-text">${dialogueText}</p>
            </div>
            <div class="nk-evo-console-actions">
              ${
                this.phase === 'TRIUMPH'
                  ? `<button id="evo-confirm-btn" class="nk-evo-confirm-btn" type="button">
                      <span>CONTINUE [A / ENTER]</span>
                    </button>`
                  : ''
              }
              ${
                this.phase === 'CANCELLED'
                  ? `<button id="evo-dismiss-cancel-btn" class="nk-evo-confirm-btn is-cancel" type="button">
                      <span>CLOSE [A / B]</span>
                    </button>`
                  : ''
              }
            </div>
          </div>
        </footer>
      </div>
    `;

    const cancelBtn = this.rootElement.querySelector('#evo-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cancel();
      });
    }

    const confirmBtn = this.rootElement.querySelector('#evo-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.completeEvolution();
      });
    }

    const dismissCancelBtn = this.rootElement.querySelector('#evo-dismiss-cancel-btn');
    if (dismissCancelBtn) {
      dismissCancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.finishCancelled();
      });
    }
  }

  private injectNeoKantoEvolutionStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('nk-evolution-scene-styles')) return;

    const style = document.createElement('style');
    style.id = 'nk-evolution-scene-styles';
    style.innerHTML = `
      .nk-evo-overlay {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100dvh;
        z-index: 95;
        background: #0D1322;
        color: #F8FAFC;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: env(safe-area-inset-top, 12px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 12px) env(safe-area-inset-left, 16px);
        box-sizing: border-box;
        user-select: none;
        overflow: hidden;
      }

      .nk-evo-stage {
        position: relative;
        width: 100%;
        max-width: 960px;
        height: 100%;
        max-height: 720px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border: 2px solid #1E293B;
        background: radial-gradient(circle at 50% 42%, rgba(30, 41, 59, 0.55) 0%, #0D1322 75%);
        box-shadow: 6px 6px 0px #050811;
        padding: 20px;
        box-sizing: border-box;
        overflow: hidden;
      }

      .nk-evo-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        z-index: 4;
      }

      .nk-evo-protocol-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #131C31;
        border: 2px solid #334155;
        box-shadow: 3px 3px 0px #050811;
        padding: 6px 12px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #94A3B8;
      }

      .nk-evo-led {
        width: 8px;
        height: 8px;
        background: var(--evo-accent, #00F5D4);
        box-shadow: 0 0 8px var(--evo-accent, #00F5D4);
      }

      .nk-evo-cancel-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #1E293B;
        color: #F8FAFC;
        border: 2px solid #EE4238;
        box-shadow: 3px 3px 0px #050811;
        padding: 8px 14px;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.1s ease;
      }

      .nk-evo-cancel-pill:active {
        transform: translate(2px, 2px);
      }

      .nk-evo-cancel-pill.is-locked {
        opacity: 0.45;
        border-color: #475569;
        cursor: not-allowed;
      }

      .nk-evo-key-badge {
        background: #EE4238;
        color: #0D1322;
        padding: 2px 6px;
        font-weight: 900;
      }

      .nk-evo-arena {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        z-index: 2;
      }

      .nk-evo-light-beam {
        position: absolute;
        top: -10%;
        bottom: 18%;
        width: 180px;
        background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0, 245, 212, 0.14) 50%, rgba(255,255,255,0.22) 100%);
        filter: blur(8px);
        pointer-events: none;
      }

      .nk-evo-sprite-pedestal {
        position: relative;
        width: 220px;
        height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nk-evo-aura-ring {
        position: absolute;
        width: 168px;
        height: 168px;
        border-radius: 50%;
        border: 2px dashed rgba(0, 245, 212, 0.45);
        box-shadow: 0 0 32px var(--evo-accent, #00F5D4);
        animation: nkEvoRingSpin 6s linear infinite;
      }

      .nk-evo-whiteout-flash {
        position: absolute;
        inset: -80px;
        border-radius: 50%;
        background: radial-gradient(circle, #FFFFFF 0%, rgba(255,255,255,0) 70%);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
        z-index: 5;
      }

      .nk-evo-whiteout-flash.is-active {
        opacity: 1;
      }

      .nk-evo-sprite {
        position: absolute;
        width: 136px;
        height: 136px;
        image-rendering: pixelated;
        object-fit: contain;
        z-index: 3;
        transition: filter 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
      }

      /* Phase 1: Prompt — Base sprite visible with cyan/white glow */
      .nk-evo-sprite-base.phase-prompt {
        opacity: 1;
        filter: drop-shadow(0 0 14px #00F5D4);
      }
      .nk-evo-sprite-target.phase-prompt {
        opacity: 0;
      }

      /* Phase 2: Pulse — Alternating white silhouettes */
      .nk-evo-sprite-base.phase-pulse {
        filter: brightness(0) invert(1) drop-shadow(0 0 18px #FFFFFF);
        animation: nkEvoBaseOscillate var(--evo-period, 0.4s) infinite ease-in-out;
      }
      .nk-evo-sprite-target.phase-pulse {
        filter: brightness(0) invert(1) drop-shadow(0 0 18px #00F5D4);
        animation: nkEvoTargetOscillate var(--evo-period, 0.4s) infinite ease-in-out;
      }

      /* Phase 3: Transform Climax */
      .nk-evo-sprite-base.phase-transform {
        opacity: 0;
        transform: scale(1.35);
      }
      .nk-evo-sprite-target.phase-transform {
        opacity: 1;
        filter: brightness(0) invert(1) drop-shadow(0 0 28px #FFFFFF);
        transform: scale(1.18);
      }

      /* Phase 4: Triumph — Full color reveal of evolved species */
      .nk-evo-sprite-base.phase-triumph {
        opacity: 0;
      }
      .nk-evo-sprite-target.phase-triumph {
        opacity: 1;
        filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.75));
        transform: scale(1.08);
      }

      /* Cancelled — Base sprite restored in full color */
      .nk-evo-sprite-base.phase-cancelled {
        opacity: 1;
        filter: none;
        transform: scale(1);
      }
      .nk-evo-sprite-target.phase-cancelled {
        opacity: 0;
      }

      .nk-evo-dais-plate {
        position: absolute;
        bottom: 12px;
        width: 184px;
        height: 44px;
        border-radius: 50%;
        background: #131C31;
        border: 3px solid var(--evo-accent, #00F5D4);
        box-shadow: 0 0 24px var(--evo-accent, #00F5D4), 0 8px 0 #050811;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }

      .nk-evo-dais-inner {
        width: 132px;
        height: 22px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.16);
      }

      .nk-evo-celebration-card {
        width: 100%;
        max-width: 540px;
        background: #131C31;
        border: 2px solid #334155;
        box-shadow: 4px 4px 0px #050811;
        padding: 14px 18px;
        box-sizing: border-box;
        z-index: 4;
      }

      .nk-evo-celebration-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        gap: 8px;
      }

      .nk-evo-evolved-tag {
        display: block;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        color: #FFD028;
        letter-spacing: 0.08em;
      }

      .nk-evo-new-species-name {
        margin: 2px 0 0;
        font-family: 'Space Mono', monospace;
        font-size: 20px;
        font-weight: 700;
        color: #F8FAFC;
      }

      .nk-evo-type-group {
        display: flex;
        gap: 6px;
      }

      .nk-evo-type-pill {
        padding: 4px 10px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: #FFFFFF;
        border: 2px solid #050811;
        box-shadow: 2px 2px 0px #050811;
      }

      .nk-evo-stat-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
      }

      .nk-evo-stat-chip {
        background: #0D1322;
        border: 1px solid #334155;
        padding: 6px 4px;
        text-align: center;
        font-family: 'Space Mono', monospace;
      }

      .nk-evo-stat-label {
        display: block;
        font-size: 10px;
        color: #94A3B8;
      }

      .nk-evo-stat-delta {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: #48C774;
        margin-top: 2px;
      }

      .nk-evo-console {
        width: 100%;
        z-index: 4;
      }

      .nk-evo-console-plate {
        background: #131C31;
        border: 2px solid #475569;
        box-shadow: 4px 4px 0px #050811;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .nk-evo-dialogue-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nk-evo-prompt-caret {
        color: #FFD028;
        font-family: 'Space Mono', monospace;
        font-size: 16px;
      }

      .nk-evo-dialogue-text {
        margin: 0;
        font-family: 'Space Mono', monospace;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.4;
        color: #F8FAFC;
      }

      .nk-evo-confirm-btn {
        background: #FFD028;
        color: #0D1322;
        border: 2px solid #050811;
        box-shadow: 3px 3px 0px #050811;
        padding: 10px 16px;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
      }

      .nk-evo-confirm-btn.is-cancel {
        background: #334155;
        color: #F8FAFC;
      }

      @keyframes nkEvoBaseOscillate {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0; transform: scale(0.82); }
      }

      @keyframes nkEvoTargetOscillate {
        0%, 100% { opacity: 0; transform: scale(0.82); }
        50% { opacity: 1; transform: scale(1.12); }
      }

      @keyframes nkEvoRingSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @media (max-width: 767px) {
        .nk-evo-stage {
          padding: 12px;
          max-height: none;
        }
        .nk-evo-stat-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .nk-evo-console-plate {
          flex-direction: column;
          align-items: stretch;
          padding: 12px 14px;
        }
        .nk-evo-dialogue-text {
          font-size: 13px;
        }
        .nk-evo-confirm-btn {
          width: 100%;
          text-align: center;
        }
      }
    `;
    document.body.appendChild(style);
  }
}
