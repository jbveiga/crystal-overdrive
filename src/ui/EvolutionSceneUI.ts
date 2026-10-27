/**
 * @fileoverview EvolutionSceneUI domain module implementation.
 * @module ui/EvolutionSceneUI
 * @role EvolutionSceneUI Component
 * @exports EvolutionPhase, StatDeltas, EvolutionSceneResult
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-255: Implementation | L256-510: Handlers & Exports
 */

import { Dex } from '@pkmn/dex';
import type { PokemonInstance, PokemonType, BaseStats } from '../types/game';
import { EvolutionManager } from '../world/EvolutionManager';
import { BattleAudio } from '../audio/BattleAudio';
import {
  TYPE_COLORS,
  renderEvolutionModalDom,
  injectNeoKantoEvolutionStyles,
} from './evolution/EvolutionDomAndStyles';

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
      mutatePokemon: true,
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
    if (
      this.options.mutatePokemon !== false &&
      this.pokemon &&
      this.pokemon.speciesId.toLowerCase() !== this.targetSpeciesId.toLowerCase()
    ) {
      EvolutionManager.executeEvolution(this.pokemon, this.targetSpeciesId);
    }
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

    renderEvolutionModalDom({
      rootElement: this.rootElement,
      phase: this.phase,
      targetTypes: this.targetTypes,
      statDeltas: this.statDeltas,
      preEvoSpeciesId: this.preEvoSpeciesId,
      preEvoName: this.preEvoName,
      targetSpeciesId: this.targetSpeciesId,
      targetSpeciesName: this.targetSpeciesName,
      preSpriteUrl: this.getPreEvoSpriteUrl(),
      targetSpriteUrl: this.getTargetSpriteUrl(),
      dialogueText: this.getDialogueText(),
      oscHz: this.getOscillationFrequency(),
      cancelAllowed: this.canCancel(),
      onCancel: () => this.cancel(),
      onComplete: () => this.completeEvolution(),
      onDismissCancel: () => this.finishCancelled(),
    });
  }

  private injectNeoKantoEvolutionStyles(): void {
    injectNeoKantoEvolutionStyles();
  }
}