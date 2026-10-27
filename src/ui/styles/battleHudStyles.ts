/**
 * @fileoverview Keyframe animations and HTML vector template for the Neo-Kanto Battle HUD.
 * @module ui/styles/battleHudStyles
 * @layer ui
 */
export function injectKeyframeStyles(): void {
  if (typeof document === 'undefined' || document.getElementById('crystal-battle-hud-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'crystal-battle-hud-styles';
  styleEl.textContent = `
    #battle-hud-root {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #enemy-level, #enemy-hp-text, #enemy-partner-level, #enemy-partner-hp-text,
    #player-level, #player-hp-text, #player-partner-level, #player-partner-hp-text,
    #battle-stadium-badge, #battle-speed-btn, .keyboard-hint, .move-pwr-acc,
    .status-condition-badge, .stat-stage-badge {
      font-family: 'Space Mono', monospace !important;
    }
    @keyframes crystalUltraPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(236, 72, 153, 0.75); }
      50% { transform: scale(1.06); box-shadow: 0 0 14px rgba(236, 72, 153, 1); }
    }
    @keyframes crystalLowHpPulse {
      0%, 100% { opacity: 1; filter: brightness(1); }
      50% { opacity: 0.72; filter: brightness(1.35); }
    }
    .crystal-ultra-pill {
      background: rgba(13, 19, 34, 0.95);
      border: 2px solid #22324F;
      box-shadow: 0 4px 0 0 #070B14;
      animation: crystalUltraPulse 1.1s infinite ease-in-out;
    }
    .crystal-low-hp {
      animation: crystalLowHpPulse 0.85s infinite ease-in-out;
    }
    #battle-action-menu button {
      box-shadow: 0 4px 0 0 #070B14;
      transition: transform 0.08s ease, box-shadow 0.08s ease;
    }
    #battle-action-menu button:active {
      transform: translateY(2px);
      box-shadow: 0 2px 0 0 #070B14 !important;
    }
    .battle-move-btn:active {
      transform: translateY(2px);
      box-shadow: 0 1px 0 0 #070B14 !important;
    }
    @media (hover: none) and (pointer: coarse), (max-width: 768px) {
      .keyboard-hint {
        display: none !important;
      }
    }
    body.touch-controls-active .keyboard-hint {
      display: none !important;
    }
    @media (max-width: 500px) {
      .move-pwr-acc {
        display: none !important;
      }
      #battle-fight-menu button {
        padding: 7px 10px !important;
        min-height: 48px !important;
      }
    }
    /* Move grid containment for the widest phones (Pixel 9 Pro XL 448px, iPhone 16 Pro Max 440px, zoom 480px) */
    #battle-fight-menu {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      gap: 8px !important;
    }
    .battle-move-btn {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    .battle-move-btn > div {
      min-width: 0 !important;
      max-width: 100% !important;
    }
    .battle-move-btn .move-btn-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #battle-message-box.full-width-dialogue {
      width: 100% !important;
      flex: 1 1 100% !important;
      box-sizing: border-box !important;
    }
    @media (max-width: 768px) {
      #battle-bottom-panel {
        flex-direction: column !important;
        box-sizing: border-box !important;
        max-width: 100% !important;
        overflow: hidden !important;
        gap: 8px !important;
      }
      #battle-action-menu {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        gap: 8px !important;
      }
      #battle-action-menu button {
        min-height: 52px !important;
        font-size: 15px !important;
      }
    }
    @media (orientation: portrait) {
      #enemy-card, #player-card {
        width: calc(100vw - 120px) !important;
        max-width: 270px !important;
        min-width: unset !important;
        padding: 8px 14px !important;
        font-size: 14px !important;
      }
      #battle-speed-btn {
        padding: 6px 12px !important;
        font-size: 12px !important;
      }
      #battle-bottom-panel {
        max-height: 48dvh !important;
        min-height: unset !important;
        padding: 10px 12px max(10px, env(safe-area-inset-bottom, 12px)) 12px !important;
        box-sizing: border-box !important;
      }
      #battle-fight-menu {
        max-height: 48dvh !important;
        overflow-y: auto !important;
        box-sizing: border-box !important;
        padding-bottom: env(safe-area-inset-bottom, 8px) !important;
      }
      #battle-action-menu {
        width: 100% !important;
      }
    }
    @media (orientation: landscape) and (max-height: 520px) {
      #enemy-card, #player-card {
        padding: 6px 12px !important;
        min-width: 220px !important;
        font-size: 13px !important;
      }
      #battle-bottom-panel {
        min-height: 80px !important;
        max-height: 42dvh !important;
        padding: 6px 12px !important;
        box-sizing: border-box !important;
      }
      #battle-fight-menu {
        max-height: 36dvh !important;
        overflow-y: auto !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

export function createBattleHUDTemplateHtml(): string {
  return `
    <!-- Top Area: Asymmetric Enemy HUD Card (Top-Left) & Speed Toggle Pill (Top-Right) -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
      <div id="enemy-card" style="
        background: rgba(13, 19, 34, 0.95);
        backdrop-filter: blur(8px);
        border: 2px solid #22324F;
        border-radius: 10px;
        padding: 12px 20px;
        min-width: min(280px, calc(100vw - 120px));
        box-shadow: 0 4px 0 0 #070B14;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 16px; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span id="enemy-caught-icon" style="display: none; font-size: 12px;" title="Already Caught">🔴</span>
            <span id="enemy-name">Wild Pidgey</span>
            <span id="enemy-gender"></span>
            <span id="enemy-status-badges" style="display: flex; gap: 4px; flex-wrap: wrap;"></span>
          </div>
          <span id="enemy-level" style="background: rgba(250, 204, 21, 0.16); border: 1.5px solid #FFD028; color: #FFD028; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 0 0 #070B14;">Lv. 3</span>
        </div>
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 700;">
            <span style="color: #facc15; letter-spacing: 0.5px;">HP</span>
            <span id="enemy-hp-text" style="font-family: 'Space Mono', monospace;">16 / 16 HP</span>
          </div>
          <div style="width: 100%; height: 9px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
            <div id="enemy-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
          </div>
        </div>
        <!-- 2v2 Secondary Enemy Partner Plate -->
        <div id="enemy-partner-card" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(148, 163, 184, 0.35);">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 13px; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 10px; color: #38bdf8; font-weight: 800;">FOE 2</span>
              <span id="enemy-partner-name">Partner</span>
              <span id="enemy-partner-status-badges" style="display: flex; gap: 4px;"></span>
            </div>
            <span id="enemy-partner-level" style="color: #facc15; font-size: 11px; font-weight: 800; font-family: 'Space Mono', monospace;">Lv. 30</span>
          </div>
          <div style="margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; color: #94a3b8; font-weight: 700;">
              <span style="color: #facc15;">HP</span>
              <span id="enemy-partner-hp-text" style="font-family: 'Space Mono', monospace;">50 / 50 HP</span>
            </div>
            <div style="width: 100%; height: 7px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
              <div id="enemy-partner-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="battle-top-right-controls" style="pointer-events: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; position: relative;">
        <div id="battle-stadium-badge" style="
          display: none;
          background: #0D1322;
          border: 1.5px solid #FFD028;
          color: #FFD028;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.4px;
          box-shadow: 0 3px 0 0 #070B14;
        "></div>
        <button id="battle-speed-btn" style="
          background: #141E33;
          color: #38BDF8;
          border: 2px solid #38BDF8;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
          cursor: pointer;
          box-shadow: 0 3px 0 0 #070B14;
          pointer-events: auto;
        ">
          <span>⚡ SPEED: 1x</span> <span class="keyboard-hint">(Shift)</span>
        </button>
      </div>
    </div>

    <!-- Mid-Right Area: Asymmetric Player HUD Card with Numeric HP, Cyan EXP Bar & 6-Dot Party Dock -->
    <div style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 10px;">
      <div id="player-card" style="
        background: rgba(13, 19, 34, 0.95);
        backdrop-filter: blur(8px);
        border: 2px solid #22324F;
        border-radius: 10px;
        padding: 12px 20px 10px 20px;
        min-width: min(290px, calc(100vw - 60px));
        box-shadow: 0 4px 0 0 #070B14;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 16px; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span id="player-name">Cyndaquil</span>
            <span id="player-gender"></span>
            <span id="player-status-badges" style="display: flex; gap: 4px; flex-wrap: wrap;"></span>
          </div>
          <span id="player-level" style="background: rgba(250, 204, 21, 0.16); border: 1.5px solid #FFD028; color: #FFD028; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 0 0 #070B14;">Lv. 5</span>
        </div>
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 700;">
            <span style="color: #facc15; letter-spacing: 0.5px;">HP</span>
            <span id="player-hp-text" style="color: #f8fafc; font-weight: 800; font-family: 'Space Mono', monospace;">20 / 20 HP</span>
          </div>
          <div style="width: 100%; height: 9px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
            <div id="player-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
          </div>
        </div>
        <!-- 2v2 Secondary Player Partner Plate -->
        <div id="player-partner-card" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(148, 163, 184, 0.35);">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 13px; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 10px; color: #4ade80; font-weight: 800;">ALLY 2</span>
              <span id="player-partner-name">Partner</span>
              <span id="player-partner-status-badges" style="display: flex; gap: 4px;"></span>
            </div>
            <span id="player-partner-level" style="color: #facc15; font-size: 11px; font-weight: 800; font-family: 'Space Mono', monospace;">Lv. 30</span>
          </div>
          <div style="margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; color: #94a3b8; font-weight: 700;">
              <span style="color: #facc15;">HP</span>
              <span id="player-partner-hp-text" style="color: #f8fafc; font-weight: 800; font-family: 'Space Mono', monospace;">50 / 50 HP</span>
            </div>
            <div style="width: 100%; height: 7px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
              <div id="player-partner-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
        <!-- Cyan EXP Bar + 6-Dot Miniature Party Dock -->
        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; font-family: 'Space Mono', monospace;">EXP</span>
            <div style="flex: 1; height: 5px; background: #070B14; border: 1px solid #22324F; border-radius: 3px; overflow: hidden;">
              <div id="player-exp-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8); transition: width 0.35s ease;"></div>
            </div>
          </div>
          <div id="player-party-dock" title="Party Status" style="display: flex; align-items: center; gap: 4px;"></div>
        </div>
      </div>
    </div>

    <!-- Bottom Control & Classic Double-Framed Dialogue Panel -->
    <div id="battle-bottom-panel" style="
      background: rgba(13, 19, 34, 0.96);
      backdrop-filter: blur(12px);
      border: 2px solid #22324F;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 6px 0 0 #070B14;
      pointer-events: auto;
      min-height: 132px;
      display: flex;
      gap: 20px;
      box-sizing: border-box;
    ">
      <!-- Dialogue Text -->
      <div id="battle-message-box" style="
        flex: 1;
        background: #141E33;
        border: 1.5px solid #22324F;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 16px;
        font-weight: 600;
        color: #f8fafc;
        line-height: 1.5;
        display: flex;
        align-items: center;
        font-family: 'Plus Jakarta Sans', sans-serif;
      ">
        What will Cyndaquil do?
      </div>

      <!-- Main 2x2 Command Menu (FIGHT / BAG / POKEMON / RUN) -->
      <div id="battle-action-menu" style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        width: 280px;
      ">
        <button id="btn-fight" style="
          background: #dc2626;
          color: white;
          border: 2px solid #ef4444;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 10px 12px;
          cursor: pointer;
          box-shadow: 0 4px 0 0 #070B14;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        "><span>FIGHT</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[F]</span></button>
        <button id="btn-bag" style="
          background: #d97706;
          color: white;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 10px 12px;
          cursor: pointer;
          box-shadow: 0 4px 0 0 #070B14;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        "><span>BAG</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[B]</span></button>
        <button id="btn-pokemon" style="
          background: #059669;
          color: white;
          border: 2px solid #10b981;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 10px 12px;
          cursor: pointer;
          box-shadow: 0 4px 0 0 #070B14;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        "><span>POKÉMON</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[P]</span></button>
        <button id="btn-run" style="
          background: #2563eb;
          color: white;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 10px 12px;
          cursor: pointer;
          box-shadow: 0 4px 0 0 #070B14;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        "><span>RUN</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[R]</span></button>
      </div>

      <!-- Fight Submenu (Unbound 2x2 Move Matrix + Tooltip) -->
      <div id="battle-fight-menu" style="
        display: none;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        flex: 1;
        width: 100%;
        max-height: 48dvh;
        overflow-y: auto;
        box-sizing: border-box;
        padding-bottom: env(safe-area-inset-bottom, 12px);
        -webkit-overflow-scrolling: touch;
      "></div>

      <!-- Bag Submenu (Medicine, Heals & Pokéballs) -->
      <div id="battle-bag-menu" style="
        display: none;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        flex: 1;
        width: 100%;
        max-height: 220px;
        overflow-y: auto;
      "></div>

      <!-- Party Submenu (Switch Pokémon) -->
      <div id="battle-party-menu" style="
        display: none;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        flex: 1;
        width: 100%;
        max-height: 180px;
        overflow-y: auto;
      "></div>
    </div>
  `;
}
