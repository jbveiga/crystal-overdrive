/**
 * @fileoverview Global Neo-Kanto UI styles and layout rules.
 * @module ui/styles/globalNeoKantoStyles
 * @layer ui
 */

export const GLOBAL_NEO_KANTO_CSS = `
  .neo-kanto-tactile-btn {
    transition: transform 0.08s ease, filter 0.08s ease, box-shadow 0.08s ease !important;
  }
  .neo-kanto-tactile-btn:hover {
    filter: brightness(1.15) !important;
  }
  .neo-kanto-tactile-btn:active {
    transform: translateY(2px) !important;
    box-shadow: 0 1px 0 0 #070B14 !important;
  }
  .neo-kanto-pulse-dot {
    animation: neoKantoPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes neoKantoPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.45; transform: scale(0.85); }
  }
  .neo-kanto-scrollbar::-webkit-scrollbar,
  .party-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .neo-kanto-scrollbar::-webkit-scrollbar-track,
  .party-scrollbar::-webkit-scrollbar-track {
    background: #080E1D;
    border-radius: 4px;
  }
  .neo-kanto-scrollbar::-webkit-scrollbar-thumb,
  .party-scrollbar::-webkit-scrollbar-thumb {
    background: #22324F;
    border-radius: 4px;
  }
  .neo-kanto-scrollbar::-webkit-scrollbar-thumb:hover,
  .party-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #2A75D3;
  }
  .party-tactile-btn {
    transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.12s ease;
  }
  .party-tactile-btn:hover {
    filter: brightness(1.12);
  }
  .party-tactile-btn:active {
    transform: translateY(2px) !important;
    box-shadow: 0 1px 0 0 #070B14 !important;
  }
  .nk-save-slot-card {
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
  }
  .trainer-badges-rack {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    #party-management-modal, #settings-modal-panel, #pokedex-modal, #trainer-card-modal {
      width: 95vw !important;
      max-height: 92dvh !important;
      padding: 12px !important;
    }
    #party-slot-grid {
      grid-template-columns: 1fr !important;
    }
    #start-menu-panel {
      top: calc(52px + env(safe-area-inset-top, 0px)) !important;
      right: max(10px, env(safe-area-inset-right, 10px)) !important;
      width: min(220px, calc(100vw - 20px)) !important;
    }
    #save-confirm-modal {
      width: 94vw !important;
      padding: 14px !important;
    }
    #settings-modal {
      width: 95vw !important;
      max-height: 92dvh !important;
      padding: 12px !important;
    }
    #settings-category-tabs {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    #pokedex-modal-workstation {
      flex-direction: column !important;
      overflow-y: auto !important;
    }
    #dex-roster-column {
      max-width: 100% !important;
      flex: none !important;
      max-height: 200px !important;
    }
    #dex-telemetry-column {
      max-width: 100% !important;
      flex: none !important;
    }
    #trainer-card-bento {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
    #bug-contest-leaderboard-modal {
      width: 95vw !important;
      max-height: 92dvh !important;
      padding: 12px !important;
    }
    [data-contest-rank] {
      grid-template-columns: 50px 1fr 1fr !important;
      gap: 6px !important;
    }
  }
`;

export function ensureGlobalNeoKantoStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('global-neo-kanto-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'global-neo-kanto-styles';
  styleEl.textContent = GLOBAL_NEO_KANTO_CSS;
  document.head?.appendChild(styleEl);
}
