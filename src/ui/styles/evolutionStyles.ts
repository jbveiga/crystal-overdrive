/**
 * @fileoverview Responsive CSS stylesheets, animations, and keyframes for the Neo-Kanto Evolution scene.
 * @module ui/styles/evolutionStyles
 * @layer ui
 * @sections L1-5: Micro-Header & Types | L6-237: Core Implementation | L238-474: Public Interface & Exports
 */

/**
 * Injects Neo-Kanto responsive CSS stylesheet for the Evolution sequence into document.body.
 */
export function injectNeoKantoEvolutionStyles(): void {
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
      pointer-events: auto !important;
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
      pointer-events: auto !important;
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
      border-radius: 50%;
    }

    .nk-evo-cancel-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #7F1D1D;
      border: 2px solid #DC2626;
      box-shadow: 3px 3px 0px #050811;
      color: #F87171;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 6px 12px;
      cursor: pointer;
      transition: background 0.1s ease, transform 0.05s ease;
      pointer-events: auto !important;
    }

    .nk-evo-cancel-pill:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px #050811;
    }

    .nk-evo-cancel-pill.is-locked {
      background: #1E293B;
      border-color: #334155;
      color: #64748B;
      cursor: not-allowed;
      box-shadow: 2px 2px 0px #050811;
    }

    .nk-evo-key-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background: #0F172A;
      border: 1px solid currentColor;
      font-size: 10px;
      font-weight: 800;
    }

    .nk-evo-arena {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .nk-evo-light-beam {
      position: absolute;
      top: 0;
      bottom: 60px;
      width: 240px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 60%, transparent 100%);
      pointer-events: none;
      filter: blur(8px);
    }

    .nk-evo-sprite-pedestal {
      position: relative;
      width: 280px;
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nk-evo-sprite {
      position: absolute;
      width: 192px;
      height: 192px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      object-fit: contain;
      filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.65));
      transition: filter 0.2s ease;
      z-index: 2;
    }

    .nk-evo-sprite-base { opacity: 1; transform: scale(1); }
    .nk-evo-sprite-target { opacity: 0; transform: scale(0.9); }

    .nk-evo-sprite-base.phase-prompt { opacity: 1; filter: drop-shadow(0 0 14px #00F5D4); }
    .nk-evo-sprite-target.phase-prompt { opacity: 0; }

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
    .nk-evo-sprite-base.phase-transform { opacity: 0; transform: scale(1.35); }
    .nk-evo-sprite-target.phase-transform {
      opacity: 1;
      filter: brightness(0) invert(1) drop-shadow(0 0 28px #FFFFFF);
      transform: scale(1.18);
    }

    /* Phase 4: Triumph — Full color reveal of evolved species */
    .nk-evo-sprite-base.phase-triumph { opacity: 0; }
    .nk-evo-sprite-target.phase-triumph {
      opacity: 1;
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.75));
      transform: scale(1.08);
    }

    /* Cancelled — Base sprite restored in full color */
    .nk-evo-sprite-base.phase-cancelled { opacity: 1; filter: none; transform: scale(1); }
    .nk-evo-sprite-target.phase-cancelled { opacity: 0; }

    .nk-evo-stage[data-phase="PULSE"] .nk-evo-sprite-base {
      animation: nkEvoBasePulse var(--evo-period, 0.5s) infinite ease-in-out;
    }
    .nk-evo-stage[data-phase="TRANSFORM"] .nk-evo-sprite-base {
      animation: nkEvoBaseOscillate var(--evo-period, 0.1s) infinite ease-in-out;
    }
    .nk-evo-stage[data-phase="TRANSFORM"] .nk-evo-sprite-target {
      animation: nkEvoTargetOscillate var(--evo-period, 0.1s) infinite ease-in-out;
    }
    .nk-evo-stage[data-phase="TRIUMPH"] .nk-evo-sprite-base { display: none; }
    .nk-evo-stage[data-phase="TRIUMPH"] .nk-evo-sprite-target {
      opacity: 1; transform: scale(1); animation: nkEvoTriumphFloat 3s infinite ease-in-out;
    }
    .nk-evo-stage[data-phase="CANCELLED"] .nk-evo-sprite-base {
      opacity: 1; transform: scale(1); filter: grayscale(0.6) brightness(0.8);
    }
    .nk-evo-stage[data-phase="CANCELLED"] .nk-evo-sprite-target { display: none; }

    .nk-evo-whiteout-flash {
      position: absolute;
      inset: -40px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%);
      opacity: 0;
      pointer-events: none;
      z-index: 3;
      transition: opacity 0.15s ease-out;
    }

    .nk-evo-whiteout-flash.is-active {
      opacity: 0.85;
      animation: nkEvoFlashStrobe 0.25s infinite alternate;
    }

    .nk-evo-aura-ring {
      position: absolute;
      bottom: 24px;
      width: 220px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid var(--evo-accent, #00F5D4);
      box-shadow: 0 0 24px var(--evo-accent, #00F5D4), inset 0 0 16px var(--evo-accent, #00F5D4);
      background: radial-gradient(ellipse at center, rgba(0, 245, 212, 0.25) 0%, transparent 70%);
      animation: nkEvoRingSpin 6s linear infinite;
    }

    .nk-evo-dais-plate {
      position: absolute;
      bottom: 20px;
      width: 200px;
      height: 40px;
      border-radius: 50%;
      background: #0B0F19;
      border: 3px solid #1E293B;
      box-shadow: 0 6px 0px #050811;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nk-evo-dais-inner {
      width: 140px;
      height: 24px;
      border-radius: 50%;
      background: #131C31;
      border: 1px dashed #334155;
    }

    .nk-evo-celebration-card {
      position: absolute;
      right: 24px;
      top: 50%;
      transform: translateY(-50%);
      width: 280px;
      background: rgba(19, 28, 49, 0.92);
      border: 2px solid #334155;
      box-shadow: 4px 4px 0px #050811;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 5;
      animation: nkEvoCardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      pointer-events: auto !important;
    }

    .nk-evo-celebration-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      gap: 8px;
    }

    .nk-evo-species-headline {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nk-evo-evolved-tag {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #00F5D4;
      letter-spacing: 0.1em;
    }

    .nk-evo-new-species-name {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #F8FAFC;
    }

    .nk-evo-type-group {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }

    .nk-evo-type-pill {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      font-weight: 800;
      color: #FFFFFF;
      padding: 3px 8px;
      box-shadow: 1px 1px 0px #050811;
      letter-spacing: 0.05em;
    }

    .nk-evo-stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      background: #0D1322;
      border: 1px solid #1E293B;
      padding: 8px;
    }

    .nk-evo-stat-chip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 6px;
      background: #131C31;
      border-left: 2px solid #00F5D4;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
    }

    .nk-evo-stat-label {
      color: #94A3B8;
      font-weight: 700;
    }

    .nk-evo-stat-delta {
      color: #00F5D4;
      font-weight: 800;
    }

    .nk-evo-console {
      z-index: 4;
      width: 100%;
    }

    .nk-evo-console-plate {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: #131C31;
      border: 2px solid #334155;
      box-shadow: 4px 4px 0px #050811;
      padding: 14px 20px;
      min-height: 52px;
      box-sizing: border-box;
      pointer-events: auto !important;
    }

    .nk-evo-dialogue-content {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
    }

    .nk-evo-prompt-caret {
      color: #00F5D4;
      font-size: 14px;
      line-height: 1.4;
      animation: nkEvoCaretBlink 0.9s infinite steps(2, start);
    }

    .nk-evo-dialogue-text {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.4;
      color: #F8FAFC;
      letter-spacing: 0.01em;
    }

    .nk-evo-console-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .nk-evo-confirm-btn {
      background: #00F5D4;
      border: 2px solid #5EEAD4;
      box-shadow: 3px 3px 0px #050811;
      color: #0D1322;
      font-family: 'Space Mono', monospace;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 8px 16px;
      cursor: pointer;
      transition: transform 0.05s ease;
      pointer-events: auto !important;
    }

    .nk-evo-confirm-btn:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px #050811;
    }

    .nk-evo-confirm-btn.is-cancel {
      background: #475569;
      border-color: #64748B;
      color: #F8FAFC;
    }

    @keyframes nkEvoCaretBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes nkEvoCardSlideIn { 0% { opacity: 0; transform: translateY(-40%) translateX(20px); } 100% { opacity: 1; transform: translateY(-50%) translateX(0); } }
    @keyframes nkEvoTriumphFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    @keyframes nkEvoFlashStrobe { 0% { opacity: 0.55; } 100% { opacity: 0.98; } }
    @keyframes nkEvoBasePulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.08); filter: brightness(1.7) drop-shadow(0 0 16px #FFFFFF); } }
    @keyframes nkEvoBaseOscillate { 0%, 100% { opacity: 1; transform: scale(1); filter: brightness(2) drop-shadow(0 0 20px #FFFFFF); } 50% { opacity: 0; transform: scale(0.78); } }
    @keyframes nkEvoTargetOscillate { 0%, 100% { opacity: 0; transform: scale(0.82); } 50% { opacity: 1; transform: scale(1.12); } }
    @keyframes nkEvoRingSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

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
