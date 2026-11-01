/**
 * @fileoverview HTML templates and responsive CSS for OverworldHUD.
 * @module ui/OverworldHUDTemplate
 * @role Overworld HUD Template
 * @exports getOverworldHudResponsiveStyles, getOverworldHudTemplateHtml
 * @layer ui
 * @sections L1-10: Micro-Header | L11-30: Responsive Styles | L31-250: HTML Template
 */

export function getOverworldHudResponsiveStyles(): string {
  return `
    @keyframes toastSlideDown {
      from { opacity: 0; transform: translate(-50%, -12px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @media (max-width: 640px) {
      #top-menu-capsule { padding: 4px 6px !important; gap: 4px !important; }
      #desktop-controls-bar { display: none !important; }
      #route-banner { font-size: 11px !important; padding: 4px 10px !important; }
    }
    @media (max-width: 768px), (pointer: coarse) {
      #desktop-controls-bar { display: none !important; }
    }
  `;
}

export function getOverworldHudTemplateHtml(): string {
  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: 12px; pointer-events: none;">
      <div id="route-banner" style="
        background: rgba(18, 22, 28, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        letter-spacing: 0.5px;
        pointer-events: auto;
      ">New Bark Town</div>

      <div id="top-menu-capsule" style="
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: auto;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 999px;
        padding: 5px 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.55);
      ">
        <button id="radar-toggle-btn" title="Toggle Itemfinder Radar (D)" style="
          background: #334155;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        ">📡</button>
        <button id="gamepad-toggle-btn" title="Toggle Touch Gamepad" style="
          background: #334155;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        ">🎮</button>
        <button id="start-menu-btn" style="
          background: #0f172a;
          color: #facc15;
          border: 2px solid #facc15;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        ">☰ MENU (M / Esc)</button>
      </div>
    </div>

    <div id="pokegear-modal" style="
      display: none;
      align-self: center;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 24px;
      color: white;
      width: 400px;
      max-width: 92vw;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
      pointer-events: auto;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #2dd4bf;">📻 POKÉGEAR ROAMER RADAR</h3>
        <button id="close-pokegear-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
      </div>
      <div id="roamer-status-list" style="display: flex; flex-direction: column; gap: 12px;"></div>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none;">
      <div id="roamer-alert-banner" style="display: none; position: fixed; top: calc(48px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); max-width: min(420px, calc(100vw - 32px)); z-index: 44; pointer-events: none; background: linear-gradient(135deg, rgba(220, 38, 38, 0.92), rgba(185, 28, 28, 0.92)); border: 1px solid #fca5a5; border-radius: 8px; padding: 6px 14px; color: white; font-weight: 700; font-size: 13px; text-align: center; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5); box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5);">⚡ A powerful aura is present on this route!</div>
    </div>

    <div id="overworld-toast-banner" style="
      display: none;
      position: fixed;
      top: calc(54px + env(safe-area-inset-top, 0px));
      left: 50%;
      transform: translateX(-50%);
      max-width: min(440px, calc(100vw - 32px));
      z-index: 45;
      pointer-events: none;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(10px);
      border: 1.5px solid #38bdf8;
      border-radius: 9999px;
      padding: 8px 18px;
      color: #f8fafc;
      font-weight: 700;
      font-size: 13px;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      animation: toastSlideDown 0.22s ease-out;
      transition: opacity 0.18s ease, transform 0.18s ease;
    "></div>

    <div id="mobile-gamepad-overlay" style="
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 30;
    ">
      <div id="virtual-dpad-base" style="
        position: absolute;
        bottom: calc(28px + env(safe-area-inset-bottom, 0px));
        left: calc(16px + env(safe-area-inset-left, 0px));
        width: 172px;
        height: 172px;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(6px);
        border: 2px solid rgba(148, 163, 184, 0.35);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
        pointer-events: auto;
        touch-action: none;
      ">
        <div id="dpad-seg-up" style="position: absolute; top: 6px; left: 57px; width: 58px; height: 52px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">▲</div>
        <div id="dpad-seg-down" style="position: absolute; bottom: 6px; left: 57px; width: 58px; height: 52px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">▼</div>
        <div id="dpad-seg-left" style="position: absolute; top: 57px; left: 6px; width: 52px; height: 58px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">◀</div>
        <div id="dpad-seg-right" style="position: absolute; top: 57px; right: 6px; width: 52px; height: 58px; border-radius: 12px; background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; color: #e2e8f0; font-size: 20px; font-weight: 900; transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;">▶</div>
        <div id="dpad-center-pivot" style="position: absolute; top: 68px; left: 68px; width: 36px; height: 36px; border-radius: 50%; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.12);"></div>
        <div id="virtual-joystick-knob" style="display: none; position: absolute; top: 52px; left: 52px; width: 68px; height: 68px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 55%, #0f172a 100%); border: 2px solid #bae6fd; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.65), 0 0 12px rgba(56, 189, 248, 0.45); pointer-events: none; transform: translate(0px, 0px);"></div>
      </div>
      <button id="virtual-btn-b" style="position: absolute; bottom: calc(76px + env(safe-area-inset-bottom, 0px)); right: calc(68px + env(safe-area-inset-right, 0px)); width: 50px; height: 50px; border-radius: 50%; background: #dc2626; color: #ffffff; border: 2px solid #fca5a5; font-size: 18px; font-weight: 900; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.55); pointer-events: auto; touch-action: none; cursor: pointer;">B</button>
      <button id="virtual-btn-a" style="position: absolute; bottom: calc(28px + env(safe-area-inset-bottom, 0px)); right: calc(16px + env(safe-area-inset-right, 0px)); width: 56px; height: 56px; border-radius: 50%; background: #16a34a; color: #ffffff; border: 2px solid #86efac; font-size: 20px; font-weight: 900; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.6); pointer-events: auto; touch-action: none; cursor: pointer;">A</button>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; z-index: 40; margin-bottom: calc(8px + env(safe-area-inset-bottom, 0px));">
      <div id="dialogue-box" style="
        display: none;
        width: min(680px, 94vw);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(10, 15, 29, 0.99) 100%);
        border: 3px solid #f8fafc;
        outline: 3px solid #1e293b;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), inset 0 0 0 2px #38bdf8;
        border-radius: 10px;
        padding: 16px 22px;
        color: #f8fafc;
        pointer-events: auto;
        cursor: pointer;
        user-select: none;
        position: relative;
        margin-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
      ">
        <div id="dialogue-speaker" style="display: none; background: #0284c7; border: 2px solid #f8fafc; color: #ffffff; font-size: 12px; font-weight: 800; letter-spacing: 0.6px; padding: 3px 10px; border-radius: 6px; width: fit-content; margin-bottom: 8px; text-transform: uppercase;"></div>
        <div id="dialogue-text" style="font-size: 17px; font-weight: 600; line-height: 1.5; min-height: 52px; color: #f8fafc; letter-spacing: 0.2px; white-space: pre-wrap;"></div>
        <div id="dialogue-prompt" style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: #38bdf8; margin-top: 6px;"></div>
        <div id="dialogue-choice-box" style="
          display: none;
          position: absolute;
          right: 12px;
          bottom: calc(100% + 8px);
          min-width: 132px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%);
          border: 3px solid #f8fafc;
          outline: 3px solid #1e293b;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8), inset 0 0 0 2px #38bdf8;
          border-radius: 8px;
          padding: 8px 10px;
          flex-direction: column;
          gap: 4px;
          z-index: 48;
          pointer-events: auto;
        ">
          <button type="button" id="dialogue-choice-yes" data-choice="YES" style="
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            background: transparent;
            border: none;
            border-radius: 5px;
            padding: 6px 10px;
            color: #f8fafc;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.5px;
            cursor: pointer;
            text-align: left;
          "><span id="dialogue-choice-cursor-0" style="color: #38bdf8; width: 14px; display: inline-block;">▶</span><span id="dialogue-choice-label-0">YES</span></button>
          <button type="button" id="dialogue-choice-no" data-choice="NO" style="
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            background: transparent;
            border: none;
            border-radius: 5px;
            padding: 6px 10px;
            color: #f8fafc;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.5px;
            cursor: pointer;
            text-align: left;
          "><span id="dialogue-choice-cursor-1" style="color: #38bdf8; width: 14px; display: inline-block;"></span><span id="dialogue-choice-label-1">NO</span></button>
        </div>
      </div>

      <div id="desktop-controls-bar" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="background: rgba(18, 22, 28, 0.8); backdrop-filter: blur(4px); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: #94a3b8;">
          Move: <strong>WASD / Arrows</strong> | Talk / Read Signs: <strong>Space / Enter / Z</strong> | Speed: <strong>Shift</strong>
        </div>
      </div>
    </div>
  `;
}
