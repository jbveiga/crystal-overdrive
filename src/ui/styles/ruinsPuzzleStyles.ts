/**
 * @fileoverview Responsive CSS stylesheet and injection helper for the Ruins of Alph tile slide puzzle modal.
 * @module ui/styles/ruinsPuzzleStyles
 * @layer ui
 */

export const RUINS_PUZZLE_CSS: string = `
  .ruins-puzzle-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 16px;
    pointer-events: auto !important;
    font-family: 'Space Mono', 'Plus Jakarta Sans', monospace, sans-serif;
  }

  .ruins-puzzle-card {
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 14px;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.7);
    max-width: 380px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 18px 16px;
    color: #f8fafc;
    box-sizing: border-box;
  }

  .ruins-puzzle-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
  }

  .ruins-puzzle-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #cbd5e1;
    text-transform: uppercase;
  }

  .ruins-puzzle-glyph {
    font-size: 16px;
  }

  .ruins-puzzle-telemetry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-top: 4px;
    border-top: 1px solid #1e293b;
  }

  .ruins-move-count {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }

  .ruins-status-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ruins-status-badge.unsolved {
    background: #451a03;
    color: #f59e0b;
    border: 1px solid #78350f;
  }

  .ruins-status-badge.solved {
    background: #064e3b;
    color: #10b981;
    border: 1px solid #047857;
  }

  .ruins-puzzle-inscription {
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
    text-align: center;
    margin: 4px 0 12px 0;
    font-style: italic;
  }

  .ruins-puzzle-board {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
    width: 280px;
    height: 280px;
    background: #020617;
    padding: 6px;
    border-radius: 8px;
    border: 2px solid #1e293b;
    margin-bottom: 14px;
    box-sizing: border-box;
  }

  .ruins-tile {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
    min-width: 0;
    min-height: 0;
  }

  .ruins-tile-blank {
    background: #090d16;
    border: 1px dashed #334155;
  }

  .ruins-tile-piece {
    border: 1px solid #475569;
    background-color: #1e293b;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    padding: 0;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    transition: transform 0.08s ease, filter 0.08s ease;
  }

  .ruins-tile-piece:hover {
    filter: brightness(1.12);
    transform: scale(0.98);
    border-color: #94a3b8;
  }

  .ruins-tile-piece:active {
    transform: scale(0.94);
  }

  .ruins-tile-tag {
    position: absolute;
    bottom: 2px;
    right: 3px;
    font-size: 8px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.45);
    background: rgba(0, 0, 0, 0.45);
    padding: 1px 3px;
    border-radius: 2px;
    line-height: 1;
  }

  .ruins-puzzle-controls {
    display: flex;
    gap: 8px;
    width: 100%;
    justify-content: center;
    margin-bottom: 8px;
  }

  .ruins-btn {
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.1s ease, transform 0.05s ease;
    min-height: 36px;
  }

  .ruins-btn:active {
    transform: scale(0.96);
  }

  .ruins-btn-secondary {
    background: #1e293b;
    color: #cbd5e1;
    border-color: #334155;
  }

  .ruins-btn-secondary:hover {
    background: #334155;
  }

  .ruins-btn-accent {
    background: #0284c7;
    color: #ffffff;
    border-color: #0369a1;
  }

  .ruins-btn-accent:hover {
    background: #0369a1;
  }

  .ruins-btn-cancel {
    background: #334155;
    color: #94a3b8;
    border-color: #475569;
  }

  .ruins-btn-cancel:hover {
    background: #475569;
    color: #f1f5f9;
  }

  .ruins-puzzle-footer-hints {
    font-size: 10px;
    color: #64748b;
    text-align: center;
    line-height: 1.3;
  }

  @media (max-width: 440px) {
    .ruins-puzzle-card {
      padding: 14px 12px;
    }
    .ruins-puzzle-board {
      width: 250px;
      height: 250px;
      gap: 4px;
    }
    .ruins-btn {
      font-size: 10px;
      padding: 6px 10px;
    }
  }
`;

export function injectRuinsPuzzleStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ruins-puzzle-styles')) return;

  const style = document.createElement('style');
  style.id = 'ruins-puzzle-styles';
  style.textContent = RUINS_PUZZLE_CSS;
  document.head.appendChild(style);
}
