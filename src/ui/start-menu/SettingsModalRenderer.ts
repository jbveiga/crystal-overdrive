/**
 * @fileoverview SettingsModalRenderer domain module implementation.
 * @module ui/start-menu/SettingsModalRenderer
 * @role SettingsModalRenderer Component
 * @exports getBattleSpeedBg, getBattleSpeedBorder, getTextSpeedBg
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-253: Implementation | L254-507: Handlers & Exports
 */

import type {
  SpeedMultiplier,
  TouchControlStyle,
  ExpShareMode,
  EncounterRateMode,
  GbcPaletteMode,
} from '../../types/game';
import { GBC_PALETTE_SPECS } from '../DisplayThemeManager';
import { STADIUM_CUPS, STADIUM_CHALLENGERS } from '../../battle/StadiumArenaManager';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';
import type { StartMenuStateProvider } from '../StartMenuUI';

const S = {
  row: 'background: #141E33; border: 1.5px solid #22324F; box-shadow: 0 4px 0 0 #070B14; border-radius: 8px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px;',
  card: 'background: #141E33; border: 1.5px solid #22324F; box-shadow: 0 4px 0 0 #070B14; border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;',
  sub: 'font-size: 11px; color: #94A3B8; font-family: "Plus Jakarta Sans", system-ui, sans-serif;',
  title: 'font-size: 13px; font-weight: 800; color: #F8FAFC; font-family: "Space Mono", monospace; letter-spacing: 0.3px;',
  btnBase: "box-shadow: 0 3px 0 0 #070B14; border-radius: 6px; padding: 8px 14px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer; min-width: 130px;",
  groupActionBtn: "box-shadow: 0 3px 0 0 #070B14; border-radius: 6px; padding: 7px 12px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer; min-width: 130px;",
  segBtn: "box-shadow: 0 3px 0 0 #070B14; border-radius: 6px; padding: 6px 8px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer;",
  segBtn6: "flex: 1; box-shadow: 0 3px 0 0 #070B14; border-radius: 6px; padding: 6px 6px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer;",
  cardHeader: 'display:flex;justify-content:space-between;align-items:center;gap:10px;',
  rowGroup: 'display:flex;gap:6px;width:100%;',
  tabBtnBase: "flex: 1; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; box-shadow: 0 3px 0 0 #070B14;",
} as const;

export function getBattleSpeedBg(spd: SpeedMultiplier): string {
  if (spd === 1) return '#2563eb';
  if (spd === 2) return '#d97706';
  return '#dc2626';
}

export function getBattleSpeedBorder(spd: SpeedMultiplier): string {
  if (spd === 1) return '#60a5fa';
  if (spd === 2) return '#f59e0b';
  return '#ef4444';
}

export function getTextSpeedBg(spd: 'SLOW' | 'MID' | 'FAST' | 'INSTANT'): string {
  if (spd === 'SLOW') return '#475569';
  if (spd === 'MID') return '#0284c7';
  if (spd === 'FAST') return '#059669';
  return '#7c3aed';
}

export function getTextSpeedBorder(spd: 'SLOW' | 'MID' | 'FAST' | 'INSTANT'): string {
  if (spd === 'SLOW') return '#94a3b8';
  if (spd === 'MID') return '#38bdf8';
  if (spd === 'FAST') return '#34d399';
  return '#c084fc';
}

export function getTextSpeedLabel(spd: 'SLOW' | 'MID' | 'FAST' | 'INSTANT'): string {
  return spd === 'MID' ? 'NORMAL' : spd;
}

export function getExpShareButtonLabel(mode: ExpShareMode, currentLevelCap: number): string {
  if (mode === 'OFF') return 'EXP: OFF (Single Battler)';
  if (mode === 'ALL') return 'EXP: ALL (Full Team 50%)';
  return `EXP: 🧢 CAPPED (Lv. ${currentLevelCap})`;
}

export function getExpShareButtonBg(mode: ExpShareMode): string {
  if (mode === 'OFF') return '#475569';
  if (mode === 'ALL') return '#059669';
  return '#7c3aed';
}

export function getExpShareButtonBorder(mode: ExpShareMode): string {
  if (mode === 'OFF') return '#94a3b8';
  if (mode === 'ALL') return '#34d399';
  return '#c084fc';
}

export function getEncounterRateLabel(mode: EncounterRateMode): string {
  if (mode === 'RELAXED') return '🌿 RELAXED (4.0% Cap)';
  if (mode === 'CLASSIC') return '⚡ CLASSIC (10.0% Cap)';
  return '⚖️ NORMAL (6.25% Cap)';
}

export function getEncounterRateBg(mode: EncounterRateMode): string {
  if (mode === 'RELAXED') return '#059669';
  if (mode === 'CLASSIC') return '#d97706';
  return '#0284c7';
}

export function getEncounterRateBorder(mode: EncounterRateMode): string {
  if (mode === 'RELAXED') return '#34d399';
  if (mode === 'CLASSIC') return '#fbbf24';
  return '#38bdf8';
}

export function getGbcPaletteBg(mode: GbcPaletteMode): string {
  if (mode === 'POCKET') return '#3f6212';
  if (mode === 'DMG') return '#365314';
  if (mode === 'NIGHT') return '#581c87';
  return '#1e3a8a';
}

export function buildSettingsModalHtml(
  stateProvider: StartMenuStateProvider,
  speedMultiplier: SpeedMultiplier,
  activeSettingsTab: 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS'
): string {
  const isMuted = stateProvider.isMuted ? stateProvider.isMuted() : false;
    const currentSpeed = stateProvider.getSpeedMultiplier
      ? stateProvider.getSpeedMultiplier()
      : speedMultiplier;
    const isGamepad = stateProvider.isGamepadActive ? stateProvider.isGamepadActive() : false;
    const controlStyle: TouchControlStyle = stateProvider.getTouchControlStyle
      ? stateProvider.getTouchControlStyle()
      : 'DPAD';
    const isJoystick = controlStyle === 'JOYSTICK';
    const expShareMode: ExpShareMode = stateProvider.getExpShareMode
      ? stateProvider.getExpShareMode()
      : 'CAPPED';
    const encounterRateMode: EncounterRateMode = stateProvider.getEncounterRateMode
      ? stateProvider.getEncounterRateMode()
      : 'NORMAL';
    const isAutoHm: boolean = stateProvider.getAutoHm
      ? stateProvider.getAutoHm()
      : true;
    const isCrtScanlines: boolean = stateProvider.getCrtScanlines
      ? stateProvider.getCrtScanlines()
      : false;
    const isLowHpBeep: boolean = stateProvider.getLowHpBeep
      ? stateProvider.getLowHpBeep()
      : BattleAudio.lowHpBeepEnabled;
    const isChiptuneMode: boolean = stateProvider.getChiptuneMode
      ? stateProvider.getChiptuneMode()
      : false;
    const bgmVolume: number = stateProvider.getBgmVolume ? stateProvider.getBgmVolume() : 0.7;
    const soundVolume: number = stateProvider.getSoundVolume ? stateProvider.getSoundVolume() : 0.7;
    const battleAnimations: boolean = stateProvider.getBattleAnimations ? stateProvider.getBattleAnimations() : true;
    const battleStyle: 'SHIFT' | 'SET' = stateProvider.getBattleStyle ? stateProvider.getBattleStyle() : 'SHIFT';
    const gbcPalette: GbcPaletteMode = stateProvider.getGbcPalette
      ? stateProvider.getGbcPalette()
      : 'VIBRANT';
    const currentBadges = stateProvider.getBadges ? stateProvider.getBadges().length : 0;
    const currentLevelCap = PokemonFactory.getLevelCapForBadges(currentBadges);

    const battleSpeed: SpeedMultiplier = stateProvider.getBattleSpeedMultiplier
      ? stateProvider.getBattleSpeedMultiplier()
      : 1;
    const textSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' = stateProvider.getTextSpeed
      ? stateProvider.getTextSpeed()
      : 'MID';

    const rowStyle = S.row;
    const subLabelStyle = S.sub;
    const titleLabelStyle = S.title;
    const catRow = (cat: 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS') =>
      `${rowStyle} display: ${activeSettingsTab === cat ? 'flex' : 'none'};`;

    return `
      <div style="position: sticky; top: 0; background: #0D1322; z-index: 3; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22324F; padding-bottom: 10px; flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="neo-kanto-pulse-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></span>
          <h2 style="margin: 0; font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 900; color: #38bdf8; letter-spacing: 0.5px;">⚙️ SETTINGS // SYS.CONFIG</h2>
        </div>
        <button id="close-settings-x-btn" aria-label="Close Settings" class="neo-kanto-tactile-btn" style="background: #141E33; border: 1.5px solid #22324F; box-shadow: 0 2px 0 0 #070B14; border-radius: 6px; color: #f8fafc; font-size: 14px; font-weight: 900; cursor: pointer; padding: 4px 10px;">✕</button>
      </div>

      <!-- Segmented Category Tabs -->
      <div id="settings-category-tabs" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; flex-shrink: 0;">
        <button id="settings-tab-audio" data-settings-tab="AUDIO" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 60px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'AUDIO' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'AUDIO' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'AUDIO' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ AUDIO ]</button>
        <button id="settings-tab-gameplay" data-settings-tab="GAMEPLAY" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 70px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'GAMEPLAY' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'GAMEPLAY' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'GAMEPLAY' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ GAMEPLAY ]</button>
        <button id="settings-tab-graphics" data-settings-tab="GRAPHICS" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 70px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'GRAPHICS' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'GRAPHICS' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'GRAPHICS' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ GRAPHICS ]</button>
        <button id="settings-tab-controls" data-settings-tab="CONTROLS" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 70px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'CONTROLS' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'CONTROLS' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'CONTROLS' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ CONTROLS ]</button>
      </div>

      <div id="settings-scroll-body" style="display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; padding-right: 2px;">
        <!-- Sound Toggle -->
        <div data-settings-category="AUDIO" style="${catRow('AUDIO')}">
          <div>
            <div style="${titleLabelStyle}">AUDIO & SOUND</div>
            <div style="${subLabelStyle}">Background music & battle SFX</div>
          </div>
          <button id="settings-sound-btn" class="neo-kanto-tactile-btn" style="
            background: ${isMuted ? '#7f1d1d' : '#0284c7'};
            color: #ffffff;
            border: 1.5px solid ${isMuted ? '#ef4444' : '#38bdf8'};
            ${S.btnBase}
          ">${isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON'}</button>
        </div>

        <!-- BGM Volume Slider -->
        <div data-settings-category="AUDIO" style="${catRow('AUDIO')}">
          <div>
            <div style="${titleLabelStyle}">BGM VOLUME</div>
            <div style="${subLabelStyle}">Music playback level (<span id="settings-bgm-val">${Math.round(bgmVolume * 100)}%</span>)</div>
          </div>
          <input id="settings-bgm-slider" type="range" min="0" max="100" value="${Math.round(bgmVolume * 100)}" style="accent-color: #38bdf8; cursor: pointer; width: 130px;" />
        </div>

        <!-- SFX Volume Slider -->
        <div data-settings-category="AUDIO" style="${catRow('AUDIO')}">
          <div>
            <div style="${titleLabelStyle}">SFX VOLUME</div>
            <div style="${subLabelStyle}">Sound effects & cries (<span id="settings-sfx-val">${Math.round(soundVolume * 100)}%</span>)</div>
          </div>
          <input id="settings-sfx-slider" type="range" min="0" max="100" value="${Math.round(soundVolume * 100)}" style="accent-color: #38bdf8; cursor: pointer; width: 130px;" />
        </div>

        <!-- 8-Bit Chiptune APU Mode Toggle -->
        <div data-settings-category="AUDIO" style="${catRow('AUDIO')}">
          <div>
            <div style="${titleLabelStyle}">BGM SYNTHESIS MODE</div>
            <div style="${subLabelStyle}">4-channel Game Boy APU vs Studio BGM</div>
          </div>
          <button id="settings-chiptune-btn" class="neo-kanto-tactile-btn" style="
            background: ${isChiptuneMode ? '#7c3aed' : '#0284c7'};
            color: #ffffff;
            border: 1.5px solid ${isChiptuneMode ? '#c084fc' : '#38bdf8'};
            ${S.btnBase}
          ">${isChiptuneMode ? '🎵 8-BIT APU: ON' : '🎼 STUDIO BGM'}</button>
        </div>

        <!-- Low-HP Warning Alarm Beep Toggle -->
        <div data-settings-category="AUDIO" style="${catRow('AUDIO')}">
          <div>
            <div style="${titleLabelStyle}">LOW-HP WARNING BEEP</div>
            <div style="${subLabelStyle}">Two-tone battle alarm when HP ≤ 20%</div>
          </div>
          <button id="settings-lowhp-beep-btn" class="neo-kanto-tactile-btn" style="
            background: ${isLowHpBeep ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isLowHpBeep ? '#34d399' : '#64748b'};
            ${S.btnBase}
          ">${isLowHpBeep ? '🚨 LOW-HP BEEP: ON' : '🔕 LOW-HP BEEP: OFF'}</button>
        </div>

        <!-- Speed Multiplier Cycle -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">GAME SPEED</div>
            <div style="${subLabelStyle}">Overworld traversal & dialogue</div>
          </div>
          <button id="settings-speed-btn" class="neo-kanto-tactile-btn" style="
            background: #2563eb;
            color: #ffffff;
            border: 1.5px solid #60a5fa;
            ${S.btnBase}
          ">⚡ SPEED: ${currentSpeed}x</button>
        </div>

        <!-- Battle Speed Cycle -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">BATTLE SPEED</div>
            <div style="${subLabelStyle}">Combat animations, HP/EXP bars & battle text pacing</div>
          </div>
          <button id="settings-battle-speed-btn" class="neo-kanto-tactile-btn" style="
            background: ${getBattleSpeedBg(battleSpeed)};
            color: #ffffff;
            border: 1.5px solid ${getBattleSpeedBorder(battleSpeed)};
            ${S.btnBase}
          ">⚔️ BATTLE: ${battleSpeed}x</button>
        </div>

        <!-- Text Speed Cycle -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">TEXT SPEED</div>
            <div style="${subLabelStyle}">Overworld & battle dialogue typewriter cadence</div>
          </div>
          <button id="settings-text-speed-btn" class="neo-kanto-tactile-btn" style="
            background: ${getTextSpeedBg(textSpeed)};
            color: #ffffff;
            border: 1.5px solid ${getTextSpeedBorder(textSpeed)};
            ${S.btnBase}
          ">💬 TEXT: ${getTextSpeedLabel(textSpeed)}</button>
        </div>

        <!-- Battle Animations Toggle -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">BATTLE ANIMATIONS</div>
            <div style="${subLabelStyle}">Move VFX & combat battle scene effects</div>
          </div>
          <button id="settings-battle-anim-btn" class="neo-kanto-tactile-btn" style="
            background: ${battleAnimations ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${battleAnimations ? '#34d399' : '#64748b'};
            ${S.btnBase}
          ">${battleAnimations ? '✨ ANIMATIONS: ON' : '⚡ ANIMATIONS: OFF'}</button>
        </div>

        <!-- Battle Style Toggle -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">BATTLE STYLE</div>
            <div style="${subLabelStyle}">Prompt switch on enemy faint (SHIFT vs SET)</div>
          </div>
          <button id="settings-battle-style-btn" class="neo-kanto-tactile-btn" style="
            background: ${battleStyle === 'SHIFT' ? '#2563eb' : '#d97706'};
            color: #ffffff;
            border: 1.5px solid ${battleStyle === 'SHIFT' ? '#60a5fa' : '#f59e0b'};
            ${S.btnBase}
          ">${battleStyle === 'SHIFT' ? '🔄 STYLE: SHIFT' : '🔒 STYLE: SET'}</button>
        </div>

        <!-- Touch Controls Toggle -->
        <div data-settings-category="CONTROLS" style="${catRow('CONTROLS')}">
          <div>
            <div style="${titleLabelStyle}">TOUCH CONTROLS</div>
            <div style="${subLabelStyle}">On-screen virtual D-Pad & A/B</div>
          </div>
          <button id="settings-gamepad-btn" class="neo-kanto-tactile-btn" style="
            background: ${isGamepad ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isGamepad ? '#34d399' : '#64748b'};
            ${S.btnBase}
          ">${isGamepad ? '🎮 TOUCH: ON' : '🎮 TOUCH: OFF'}</button>
        </div>

        <!-- Touch Control Style Toggle (D-Pad vs Analog Joystick) -->
        <div data-settings-category="CONTROLS" style="${catRow('CONTROLS')}">
          <div>
            <div style="${titleLabelStyle}">CONTROL STYLE</div>
            <div style="${subLabelStyle}">D-Pad buttons or analog joystick</div>
          </div>
          <button id="settings-control-style-btn" class="neo-kanto-tactile-btn" style="
            background: ${isJoystick ? '#7c3aed' : '#0284c7'};
            color: #ffffff;
            border: 1.5px solid ${isJoystick ? '#c084fc' : '#38bdf8'};
            ${S.btnBase}
          ">${isJoystick ? '🕹️ JOYSTICK (Analog)' : '🕹️ D-PAD (Buttons)'}</button>
        </div>

        <!-- CRT Scanlines Toggle -->
        <div data-settings-category="GRAPHICS" style="${catRow('GRAPHICS')}">
          <div>
            <div style="${titleLabelStyle}">CRT SCANLINE OVERLAY</div>
            <div style="${subLabelStyle}">Retro CRT horizontal scanlines & bezel vignette</div>
          </div>
          <button id="settings-crt-btn" class="neo-kanto-tactile-btn" style="
            background: ${isCrtScanlines ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isCrtScanlines ? '#34d399' : '#64748b'};
            ${S.btnBase}
          ">${isCrtScanlines ? '📺 CRT: ON' : '📺 CRT: OFF'}</button>
        </div>

        <!-- GBC Color Palette Cycle -->
        <div data-settings-category="GRAPHICS" style="${catRow('GRAPHICS')}">
          <div>
            <div style="${titleLabelStyle}">GBC COLOR PALETTE</div>
            <div id="settings-palette-desc" style="${subLabelStyle}">${GBC_PALETTE_SPECS[gbcPalette]?.description || 'Authentic Game Boy Color palette'}</div>
          </div>
          <button id="settings-palette-btn" class="neo-kanto-tactile-btn" style="
            background: ${getGbcPaletteBg(gbcPalette)};
            color: #ffffff;
            border: 1.5px solid ${GBC_PALETTE_SPECS[gbcPalette]?.accentColor || '#38bdf8'};
            ${S.btnBase}
          ">${GBC_PALETTE_SPECS[gbcPalette]?.label || '🎨 VIBRANT GBC'}</button>
        </div>

        <!-- Unbound-Style Exp. Share Mode Cycle (OFF | ALL | CAPPED) -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">EXP. SHARE MODE</div>
            <div style="${subLabelStyle}">Party EXP distribution & level caps</div>
          </div>
          <button id="settings-exp-share-btn" class="neo-kanto-tactile-btn" style="
            background: ${getExpShareButtonBg(expShareMode)};
            color: #ffffff;
            border: 1.5px solid ${getExpShareButtonBorder(expShareMode)};
            ${S.btnBase}
          ">${getExpShareButtonLabel(expShareMode, currentLevelCap)}</button>
        </div>

        <!-- Wild Encounter Rate Cap Cycle (RELAXED 4.0% | NORMAL 6.25% | CLASSIC 10.0%) -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">WILD ENCOUNTER RATE</div>
            <div style="${subLabelStyle}">4-step grace buffer + step probability cap</div>
          </div>
          <button id="settings-encounter-rate-btn" class="neo-kanto-tactile-btn" style="
            background: ${getEncounterRateBg(encounterRateMode)};
            color: #ffffff;
            border: 1.5px solid ${getEncounterRateBorder(encounterRateMode)};
            ${S.btnBase}
          ">${getEncounterRateLabel(encounterRateMode)}</button>
        </div>

        <!-- Auto-HM Mode Single Toggle -->
        <div data-settings-category="GAMEPLAY" style="${catRow('GAMEPLAY')}">
          <div>
            <div style="${titleLabelStyle}">AUTO-HM MODE</div>
            <div style="${subLabelStyle}">Use Surf, Cut & Strength automatically</div>
          </div>
          <button id="settings-autohm-btn" class="neo-kanto-tactile-btn" style="
            background: ${isAutoHm ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isAutoHm ? '#34d399' : '#64748b'};
            ${S.btnBase}
          ">${isAutoHm ? '🌊 AUTO-HM: ON' : '💬 AUTO-HM: OFF'}</button>
        </div>
      </div>

      <button id="close-settings-btn" class="neo-kanto-tactile-btn" style="
        position: sticky;
        bottom: 0;
        flex-shrink: 0;
        background: #1E293B;
        color: #ffffff;
        border: 1.5px solid #475569;
        box-shadow: 0 4px 0 0 #070B14;
        border-radius: 8px;
        padding: 10px;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        margin-top: 4px;
        z-index: 3;
      ">← BACK TO MENU</button>
    `;

}
