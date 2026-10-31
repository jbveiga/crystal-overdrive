/**
 * @fileoverview StartMenuDomSetup — Scoped Neo-Kanto stylesheet injection, modal container creation, and drawer header HTML builder.
 * @module ui/start-menu/StartMenuDomSetup
 * @role Start Menu DOM & Stylesheet Builder
 * @exports injectNeoKantoStartMenuStyles, createStartMenuModalElements, buildStartMenuDrawerShellHtml
 * @layer ui
 * @sections L1-16: Micro-Header | L17-120: Stylesheet Injection | L121-225: Modal Elements & Drawer Shell
 */

export function injectNeoKantoStartMenuStyles(): void {
    if (document.getElementById('neo-kanto-startmenu-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'neo-kanto-startmenu-styles';
    styleEl.textContent = `
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
      .neo-kanto-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-track {
        background: #080E1D;
        border-radius: 3px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-thumb {
        background: #22324F;
        border-radius: 3px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #38BDF8;
      }
      @media (max-width: 768px) {
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
        #pokedex-modal {
          width: 95vw !important;
          height: 92dvh !important;
          max-height: 92dvh !important;
          padding: 12px !important;
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
        #trainer-card-modal {
          width: 95vw !important;
          max-height: 92dvh !important;
          padding: 14px !important;
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
    (document.head || document.body)?.appendChild(styleEl);
}

export function createStartMenuModalElements(container: HTMLElement): {
  menuPanel: HTMLDivElement;
  pokedexModal: HTMLDivElement;
  trainerCardModal: HTMLDivElement;
  contestLeaderboardModal: HTMLDivElement;
  saveConfirmModal: HTMLDivElement;
  settingsModal: HTMLDivElement;
} {
  const menuPanel = document.createElement('div');
  menuPanel.id = 'start-menu-panel';
  menuPanel.className = 'neo-kanto-scrollbar';
  menuPanel.style.cssText =
    'position: absolute; top: 64px; right: 18px; width: 236px; background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%); border: 3px solid #f8fafc; outline: 3px solid #1e293b; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8), inset 0 0 0 2px #38bdf8; border-radius: 10px; padding: 12px; display: none; flex-direction: column; gap: 6px; z-index: 60; pointer-events: auto; color: #f8fafc; box-sizing: border-box;';
  container.appendChild(menuPanel);

  const pokedexModal = document.createElement('div');
  pokedexModal.id = 'pokedex-modal';
  pokedexModal.className = 'neo-kanto-scrollbar';
  pokedexModal.style.cssText =
    'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(1080px, 96vw); height: min(720px, 90vh); max-height: 90vh; background: #0D1322; border: 2px solid #22324F; border-radius: 12px; padding: 16px 20px; box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9); display: none; flex-direction: column; gap: 12px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box; font-family: "Plus Jakarta Sans", system-ui, sans-serif;';
  container.appendChild(pokedexModal);

  const trainerCardModal = document.createElement('div');
  trainerCardModal.id = 'trainer-card-modal';
  trainerCardModal.className = 'neo-kanto-scrollbar';
  trainerCardModal.style.cssText =
    'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(840px, 94vw); max-height: 90vh; overflow-y: auto; background: #0D1322; border: 2px solid #22324F; border-radius: 12px; padding: 20px; box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9); display: none; flex-direction: column; gap: 16px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box; font-family: "Plus Jakarta Sans", system-ui, sans-serif;';
  container.appendChild(trainerCardModal);

  const contestLeaderboardModal = document.createElement('div');
  contestLeaderboardModal.id = 'bug-contest-leaderboard-modal';
  contestLeaderboardModal.className = 'neo-kanto-scrollbar';
  contestLeaderboardModal.style.cssText =
    'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(920px, 95vw); max-height: 90vh; overflow-y: auto; background: #0D1322; border: 2px solid #22324F; border-radius: 12px; padding: 18px 20px; box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9); display: none; flex-direction: column; gap: 14px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box; font-family: "Plus Jakarta Sans", system-ui, sans-serif;';
  container.appendChild(contestLeaderboardModal);

  const saveConfirmModal = document.createElement('div');
  saveConfirmModal.id = 'save-confirm-modal';
  saveConfirmModal.className = 'neo-kanto-scrollbar';
  saveConfirmModal.style.cssText =
    'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(440px, 94vw); background: rgba(15, 23, 42, 0.98); border: 3px solid #f8fafc; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85), inset 0 0 0 2px #38bdf8; border-radius: 12px; padding: 20px; display: none; flex-direction: column; gap: 14px; z-index: 65; pointer-events: auto; color: #f8fafc; box-sizing: border-box;';
  container.appendChild(saveConfirmModal);

  const settingsModal = document.createElement('div');
  settingsModal.id = 'settings-modal';
  settingsModal.className = 'neo-kanto-scrollbar';
  settingsModal.style.cssText =
    'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(560px, 95vw); max-height: 88vh; max-height: 88dvh; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(16px); border: 3px solid #38bdf8; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.88), inset 0 0 0 2px rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 18px 20px; display: none; flex-direction: column; gap: 12px; z-index: 65; pointer-events: auto; color: #dde2f7; box-sizing: border-box;';
  container.appendChild(settingsModal);

  return {
    menuPanel,
    pokedexModal,
    trainerCardModal,
    contestLeaderboardModal,
    saveConfirmModal,
    settingsModal,
  };
}

export function buildStartMenuDrawerShellHtml(params: {
  trainerName: string;
  money: number;
  mapName: string;
  badgesCount: number;
}): string {
  const { trainerName, money, mapName, badgesCount } = params;
    return `
      <!-- Telemetry Header -->
      <div style="
        border-bottom: 2px solid #22324F;
        padding-bottom: 10px;
        margin-bottom: 4px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">${trainerName.toUpperCase()}</span>
          <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #f59e0b;">$${money.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">📍 ${mapName}</span>
          <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #34d399;">BADGES: ${badgesCount}/8</span>
        </div>
      </div>

      <!-- Option Items Container -->
      <div id="start-menu-items" style="display: flex; flex-direction: column; gap: 6px;"></div>

      <!-- Bottom Hint Bar -->
      <div style="
        border-top: 1px solid #22324F;
        padding-top: 8px;
        margin-top: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        color: #64748b;
        font-weight: 700;
      ">
        <span>[W/S] NAVIGATE</span>
        <span>[ENTER] CONFIRM</span>
      </div>
    `;

}
