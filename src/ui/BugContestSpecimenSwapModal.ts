/**
 * @fileoverview BugContestSpecimenSwapModal domain module implementation.
 * @module ui/BugContestSpecimenSwapModal
 * @role BugContestSpecimenSwapModal Component
 * @exports BugContestSpecimenSwapModalOptions, BugContestSpecimenSwapModal
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-176: Implementation | L177-352: Handlers & Exports
 */

/**
 * BugContestSpecimenSwapModal.ts
 * Interactive HTML5/CSS vector modal for the Bug-Catching Contest Specimen Swap.
 * Adheres to Google Stitch screens:
 * - Desktop: 5d1c6713df6f47c49b22cb1b4d1d8a28
 * - Mobile:  08e0f772bb264d5abb00151e81e7712a
 */
import type { PokemonInstance } from '../types/game';
import { calculateJudgeScore, getJudgeGrade } from '../world/BugContestManager';

export interface BugContestSpecimenSwapModalOptions {
  currentSpecimen: PokemonInstance;
  newCatch: PokemonInstance;
  ballsRemaining: number;
  timeRemainingSec: number;
  onDecision: (choice: 'keep' | 'replace') => void;
}

export class BugContestSpecimenSwapModal {
  private containerId: string;
  private options: BugContestSpecimenSwapModalOptions;
  private rootElement: HTMLElement | null = null;
  private activeFocusIndex: number = 0; // 0 = Keep, 1 = Replace
  private keyListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string, options: BugContestSpecimenSwapModalOptions) {
    this.containerId = containerId;
    this.options = options;
    this.mount();
  }

  public mount(): void {
    const parent = document.getElementById(this.containerId);
    if (!parent) return;

    this.rootElement = document.createElement('div');
    this.rootElement.id = 'bug-contest-swap-modal-overlay';
    this.rootElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(7, 11, 20, 0.88);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: auto !important;
      font-family: 'Space Mono', 'Courier New', monospace;
      color: #F6F8F3;
    `;

    const currentScore = calculateJudgeScore(this.options.currentSpecimen);
    const currentGrade = getJudgeGrade(currentScore);
    const newScore = calculateJudgeScore(this.options.newCatch);
    const newGrade = getJudgeGrade(newScore);

    const formatMinutes = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const renderCard = (
      label: string,
      tagColor: string,
      pkmn: PokemonInstance,
      score: number,
      grade: string,
      cardId: string
    ) => {
      const maxHp = pkmn.stats?.hp || pkmn.baseStats?.hp || 30;
      const curHp = Math.min(maxHp, Math.max(1, pkmn.currentHp ?? maxHp));
      const hpPct = Math.round((curHp / maxHp) * 100);
      const hpBarColor = hpPct > 50 ? '#48C774' : hpPct > 20 ? '#FFD028' : '#EE4238';

      return `
        <div id="${cardId}" class="specimen-card" style="
          background: #141E33;
          border: 2px solid #2A3A5E;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 4px 0 0 #070B14;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2A3A5E; padding-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: ${tagColor}; text-transform: uppercase;">
              ${label}
            </span>
            <span style="font-size: 11px; background: #1B2742; padding: 2px 8px; border-radius: 4px; border: 1px solid #2A3A5E; color: #48C774; font-weight: 700;">
              ${grade} // ${score} PTS
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="
              width: 72px;
              height: 72px;
              background: #0D1322;
              border: 1px solid #2A3A5E;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            ">
              <img
                src="./assets/sprites/pokemon/${pkmn.speciesId.toLowerCase()}_front.png"
                alt="${pkmn.nickname || pkmn.speciesId}"
                style="width: 64px; height: 64px; image-rendering: pixelated;"
                onerror="this.onerror=null;this.src='./assets/sprites/pokemon/10_front.png';"
              />
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.04em;">
                ${(pkmn.nickname || pkmn.speciesId).toUpperCase()}
              </div>
              <div style="font-size: 12px; color: #8A9DBF;">
                LEVEL ${pkmn.level} • TYPE: ${(pkmn.types || []).join('/').toUpperCase()}
              </div>
              <div style="font-size: 11px; color: #8A9DBF; margin-top: 4px;">
                HP: ${curHp}/${maxHp} (${hpPct}%)
              </div>
              <div style="width: 100%; height: 6px; background: #0D1322; border-radius: 3px; overflow: hidden; border: 1px solid #2A3A5E;">
                <div style="width: ${hpPct}%; height: 100%; background: ${hpBarColor};"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    };

    this.rootElement.innerHTML = `
      <style>
        #bug-contest-swap-modal-overlay .btn-choice {
          flex: 1;
          min-height: 48px;
          border-radius: 4px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.08s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-transform: uppercase;
          pointer-events: auto !important;
        }
        #bug-contest-swap-modal-overlay .btn-choice:active {
          transform: translateY(3px) !important;
          box-shadow: 0 1px 0 0 #070B14 !important;
        }
        #btn-keep-current {
          background: #FFD028;
          color: #0D1322;
          border: 2px solid #FFD028;
          box-shadow: 0 4px 0 0 #070B14;
        }
        #btn-replace-catch {
          background: #1B2742;
          color: #F6F8F3;
          border: 2px solid #EE4238;
          box-shadow: 0 4px 0 0 #070B14;
        }
        @media (max-width: 767px) {
          #bug-contest-swap-modal-container {
            width: 100% !important;
            height: 100% !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            padding: 16px !important;
          }
          #bug-contest-specimen-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto !important;
          }
          #bug-contest-swap-actions {
            flex-direction: column !important;
          }
          #bug-contest-swap-modal-overlay .btn-choice {
            min-height: 52px !important;
            width: 100% !important;
          }
        }
      </style>

      <div id="bug-contest-swap-modal-container" style="
        background: #0D1322;
        border: 2px solid #2A3A5E;
        border-top: 4px solid #48C774;
        box-shadow: 0 8px 0 0 #070B14;
        border-radius: 8px;
        width: min(780px, 94vw);
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        padding: 24px;
        gap: 18px;
        pointer-events: auto !important;
      ">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1B2742; padding-bottom: 12px;">
          <div>
            <div style="font-size: 11px; color: #48C774; font-weight: 700; letter-spacing: 0.08em;">
              NATIONAL PARK // BUG-CATCHING CONTEST
            </div>
            <div style="font-size: 16px; font-weight: 700; margin-top: 2px;">
              HOLDING LIMIT REACHED: SWAP SPECIMEN?
            </div>
          </div>
          <div style="display: flex; gap: 14px; font-size: 12px;">
            <span style="color: #FFD028; font-weight: 700;">
              BALLS: ${this.options.ballsRemaining}
            </span>
            <span style="color: #8A9DBF;">
              ⏱️ ${formatMinutes(this.options.timeRemainingSec)}
            </span>
          </div>
        </div>

        <div style="font-size: 12px; color: #8A9DBF; line-height: 1.5;">
          You can only keep <strong>ONE</strong> caught Pokémon at a time in the tournament. Choose whether to retain your current specimen or replace it with the new catch.
        </div>

        <!-- Specimen Comparative Cards Grid -->
        <div id="bug-contest-specimen-grid" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        ">
          ${renderCard(
            'Current Specimen (Retained)',
            '#FFD028',
            this.options.currentSpecimen,
            currentScore,
            currentGrade,
            'card-current-specimen'
          )}
          ${renderCard(
            'New Catch (Candidate)',
            '#EE4238',
            this.options.newCatch,
            newScore,
            newGrade,
            'card-new-catch'
          )}
        </div>

        <!-- Actions -->
        <div id="bug-contest-swap-actions" style="
          display: flex;
          gap: 14px;
          margin-top: 6px;
        ">
          <button id="btn-keep-current" class="btn-choice" type="button">
            🛡️ KEEP CURRENT POKÉMON
          </button>
          <button id="btn-replace-catch" class="btn-choice" type="button">
            🔄 REPLACE WITH NEW CATCH
          </button>
        </div>
      </div>
    `;

    parent.appendChild(this.rootElement);
    this.attachEventListeners();
    this.updateFocusStyles();
  }

  private attachEventListeners(): void {
    const btnKeep = this.rootElement?.querySelector('#btn-keep-current') as HTMLButtonElement | null;
    const btnReplace = this.rootElement?.querySelector('#btn-replace-catch') as HTMLButtonElement | null;

    if (btnKeep) {
      btnKeep.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.submitChoice('keep');
      };
    }

    if (btnReplace) {
      btnReplace.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.submitChoice('replace');
      };
    }

    this.keyListener = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        this.activeFocusIndex = 0;
        this.updateFocusStyles();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        this.activeFocusIndex = 1;
        this.updateFocusStyles();
      } else if (e.key === 'Enter') {
        this.submitChoice(this.activeFocusIndex === 0 ? 'keep' : 'replace');
      } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        // Defensive default: keep current specimen
        this.submitChoice('keep');
      }
    };

    window.addEventListener('keydown', this.keyListener);
  }

  private updateFocusStyles(): void {
    const btnKeep = this.rootElement?.querySelector('#btn-keep-current') as HTMLButtonElement | null;
    const btnReplace = this.rootElement?.querySelector('#btn-replace-catch') as HTMLButtonElement | null;

    if (btnKeep) {
      btnKeep.style.outline = this.activeFocusIndex === 0 ? '3px solid #F6F8F3' : 'none';
    }
    if (btnReplace) {
      btnReplace.style.outline = this.activeFocusIndex === 1 ? '3px solid #F6F8F3' : 'none';
    }
  }

  private submitChoice(choice: 'keep' | 'replace'): void {
    this.destroy();
    this.options.onDecision(choice);
  }

  public destroy(): void {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
      this.rootElement = null;
    }
  }
}
