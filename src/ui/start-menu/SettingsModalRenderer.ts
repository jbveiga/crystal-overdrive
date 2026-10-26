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

export function buildSettingsModalHtml(
  stateProvider: StartMenuStateProvider,
  speedMultiplier: SpeedMultiplier,
  activeSettingsTab: 'ALL' | 'AUDIO' | 'GAMEPLAY' | 'GRAPHICS' | 'CONTROLS'
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

    const rowStyle = 'background: #141E33; border: 1.5px solid #22324F; box-shadow: 0 4px 0 0 #070B14; border-radius: 8px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px;';
    const groupCardStyle = 'background: #141E33; border: 1.5px solid #22324F; box-shadow: 0 4px 0 0 #070B14; border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;';
    const subLabelStyle = 'font-size: 11px; color: #94A3B8; font-family: "Plus Jakarta Sans", system-ui, sans-serif;';
    const titleLabelStyle = 'font-size: 13px; font-weight: 800; color: #F8FAFC; font-family: "Space Mono", monospace; letter-spacing: 0.3px;';

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
        <button id="settings-tab-all" data-settings-tab="ALL" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 60px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'ALL' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'ALL' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'ALL' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ ALL ]</button>
        <button id="settings-tab-audio" data-settings-tab="AUDIO" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 60px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'AUDIO' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'AUDIO' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'AUDIO' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ AUDIO ]</button>
        <button id="settings-tab-gameplay" data-settings-tab="GAMEPLAY" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 70px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'GAMEPLAY' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'GAMEPLAY' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'GAMEPLAY' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ GAMEPLAY ]</button>
        <button id="settings-tab-graphics" data-settings-tab="GRAPHICS" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 70px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'GRAPHICS' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'GRAPHICS' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'GRAPHICS' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ GRAPHICS ]</button>
        <button id="settings-tab-controls" data-settings-tab="CONTROLS" class="neo-kanto-tactile-btn" style="flex: 1; min-width: 70px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 7px 8px; border-radius: 6px; cursor: pointer; background: ${activeSettingsTab === 'CONTROLS' ? '#1E3A8A' : '#141E33'}; color: ${activeSettingsTab === 'CONTROLS' ? '#FFFFFF' : '#94A3B8'}; border: 1.5px solid ${activeSettingsTab === 'CONTROLS' ? '#38BDF8' : '#22324F'}; box-shadow: 0 3px 0 0 #070B14;">[ CONTROLS ]</button>
      </div>

      <div id="settings-scroll-body" style="display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y; padding-right: 2px;">
        <!-- Sound Toggle -->
        <div data-settings-category="AUDIO" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">AUDIO & SOUND</div>
            <div style="${subLabelStyle}">Background music & battle SFX</div>
          </div>
          <button id="settings-sound-btn" class="neo-kanto-tactile-btn" style="
            background: ${isMuted ? '#7f1d1d' : '#0284c7'};
            color: #ffffff;
            border: 1.5px solid ${isMuted ? '#ef4444' : '#38bdf8'};
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON'}</button>
        </div>

        <!-- 8-Bit Chiptune APU Mode Toggle -->
        <div data-settings-category="AUDIO" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">BGM SYNTHESIS MODE</div>
            <div style="${subLabelStyle}">4-channel Game Boy APU vs Studio BGM</div>
          </div>
          <button id="settings-chiptune-btn" class="neo-kanto-tactile-btn" style="
            background: ${isChiptuneMode ? '#7c3aed' : '#0284c7'};
            color: #ffffff;
            border: 1.5px solid ${isChiptuneMode ? '#c084fc' : '#38bdf8'};
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isChiptuneMode ? '🎵 8-BIT APU: ON' : '🎼 STUDIO BGM'}</button>
        </div>

        <!-- Low-HP Warning Alarm Beep Toggle -->
        <div data-settings-category="AUDIO" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">LOW-HP WARNING BEEP</div>
            <div style="${subLabelStyle}">Two-tone battle alarm when HP ≤ 20%</div>
          </div>
          <button id="settings-lowhp-beep-btn" class="neo-kanto-tactile-btn" style="
            background: ${isLowHpBeep ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isLowHpBeep ? '#34d399' : '#64748b'};
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isLowHpBeep ? '🚨 LOW-HP BEEP: ON' : '🔕 LOW-HP BEEP: OFF'}</button>
        </div>

        <!-- Speed Multiplier Cycle -->
        <div data-settings-category="GAMEPLAY" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">GAME SPEED</div>
            <div style="${subLabelStyle}">Overworld traversal & dialogue</div>
          </div>
          <button id="settings-speed-btn" class="neo-kanto-tactile-btn" style="
            background: #2563eb;
            color: #ffffff;
            border: 1.5px solid #60a5fa;
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">⚡ SPEED: ${currentSpeed}x</button>
        </div>

        <!-- Battle Speed Group Card -->
        <div data-settings-category="GAMEPLAY" style="${groupCardStyle}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">BATTLE SPEED</div>
              <div style="${subLabelStyle}">Combat animations, HP/EXP bars & battle text pacing</div>
            </div>
            <button id="settings-battle-speed-btn" class="neo-kanto-tactile-btn" style="
              background: ${getBattleSpeedBg(battleSpeed)};
              color: #ffffff;
              border: 1.5px solid ${getBattleSpeedBorder(battleSpeed)};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 7px 12px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">⚔️ BATTLE: ${battleSpeed}x</button>
          </div>
          <div id="settings-battle-speed-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-battle-speed-1x-btn" data-battle-speed-choice="1" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${battleSpeed === 1 ? '#2563eb' : '#080E1D'};
              color: ${battleSpeed === 1 ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${battleSpeed === 1 ? '#60a5fa' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ 1x NORMAL ]</button>
            <button id="settings-battle-speed-2x-btn" data-battle-speed-choice="2" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${battleSpeed === 2 ? '#d97706' : '#080E1D'};
              color: ${battleSpeed === 2 ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${battleSpeed === 2 ? '#f59e0b' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ 2x FAST ]</button>
            <button id="settings-battle-speed-3x-btn" data-battle-speed-choice="3" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${battleSpeed === 3 ? '#dc2626' : '#080E1D'};
              color: ${battleSpeed === 3 ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${battleSpeed === 3 ? '#ef4444' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ 3x TURBO ]</button>
          </div>
        </div>

        <!-- Text Speed Group Card -->
        <div data-settings-category="GAMEPLAY" style="${groupCardStyle}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">TEXT SPEED</div>
              <div style="${subLabelStyle}">Overworld & battle dialogue typewriter cadence</div>
            </div>
            <button id="settings-text-speed-btn" class="neo-kanto-tactile-btn" style="
              background: ${getTextSpeedBg(textSpeed)};
              color: #ffffff;
              border: 1.5px solid ${getTextSpeedBorder(textSpeed)};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 7px 12px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">💬 TEXT: ${getTextSpeedLabel(textSpeed)}</button>
          </div>
          <div id="settings-text-speed-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-text-slow-btn" data-text-speed-choice="SLOW" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${textSpeed === 'SLOW' ? '#475569' : '#080E1D'};
              color: ${textSpeed === 'SLOW' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${textSpeed === 'SLOW' ? '#94a3b8' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 6px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ SLOW ]</button>
            <button id="settings-text-mid-btn" data-text-speed-choice="MID" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${textSpeed === 'MID' ? '#0284c7' : '#080E1D'};
              color: ${textSpeed === 'MID' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${textSpeed === 'MID' ? '#38bdf8' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 6px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ NORMAL ]</button>
            <button id="settings-text-fast-btn" data-text-speed-choice="FAST" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${textSpeed === 'FAST' ? '#059669' : '#080E1D'};
              color: ${textSpeed === 'FAST' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${textSpeed === 'FAST' ? '#34d399' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 6px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ FAST ]</button>
            <button id="settings-text-instant-btn" data-text-speed-choice="INSTANT" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${textSpeed === 'INSTANT' ? '#7c3aed' : '#080E1D'};
              color: ${textSpeed === 'INSTANT' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${textSpeed === 'INSTANT' ? '#c084fc' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 6px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ INSTANT ]</button>
          </div>
        </div>

        <!-- Touch Controls Toggle -->
        <div data-settings-category="CONTROLS" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">TOUCH CONTROLS</div>
            <div style="${subLabelStyle}">On-screen virtual D-Pad & A/B</div>
          </div>
          <button id="settings-gamepad-btn" class="neo-kanto-tactile-btn" style="
            background: ${isGamepad ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isGamepad ? '#34d399' : '#64748b'};
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isGamepad ? '🎮 TOUCH: ON' : '🎮 TOUCH: OFF'}</button>
        </div>

        <!-- Touch Control Style Toggle (D-Pad vs Analog Joystick) -->
        <div data-settings-category="CONTROLS" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">CONTROL STYLE</div>
            <div style="${subLabelStyle}">D-Pad buttons or analog joystick</div>
          </div>
          <button id="settings-control-style-btn" class="neo-kanto-tactile-btn" style="
            background: ${isJoystick ? '#7c3aed' : '#0284c7'};
            color: #ffffff;
            border: 1.5px solid ${isJoystick ? '#c084fc' : '#38bdf8'};
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isJoystick ? '🕹️ JOYSTICK (Analog)' : '🕹️ D-PAD (Buttons)'}</button>
        </div>

        <!-- CRT Scanlines Toggle -->
        <div data-settings-category="GRAPHICS" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">CRT SCANLINE OVERLAY</div>
            <div style="${subLabelStyle}">Retro CRT horizontal scanlines & bezel vignette</div>
          </div>
          <button id="settings-crt-btn" class="neo-kanto-tactile-btn" style="
            background: ${isCrtScanlines ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isCrtScanlines ? '#34d399' : '#64748b'};
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isCrtScanlines ? '📺 CRT: ON' : '📺 CRT: OFF'}</button>
        </div>

        <!-- Unbound-Style Exp. Share Mode Toggle (OFF | ALL | CAPPED) -->
        <div data-settings-category="GAMEPLAY" style="${groupCardStyle}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">EXP. SHARE MODE</div>
              <div style="${subLabelStyle}">Party EXP distribution & level caps</div>
            </div>
            <button id="settings-exp-share-btn" class="neo-kanto-tactile-btn" style="
              background: ${getExpShareButtonBg(expShareMode)};
              color: #ffffff;
              border: 1.5px solid ${getExpShareButtonBorder(expShareMode)};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 7px 12px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">${getExpShareButtonLabel(expShareMode, currentLevelCap)}</button>
          </div>
          <div id="settings-exp-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-exp-off-btn" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${expShareMode === 'OFF' ? '#475569' : '#080E1D'};
              color: ${expShareMode === 'OFF' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${expShareMode === 'OFF' ? '#cbd5e1' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ OFF ]</button>
            <button id="settings-exp-all-btn" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${expShareMode === 'ALL' ? '#059669' : '#080E1D'};
              color: ${expShareMode === 'ALL' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${expShareMode === 'ALL' ? '#34d399' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ ALL ]</button>
            <button id="settings-exp-capped-btn" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${expShareMode === 'CAPPED' ? '#7c3aed' : '#080E1D'};
              color: ${expShareMode === 'CAPPED' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${expShareMode === 'CAPPED' ? '#c084fc' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ 🧢 CAPPED ]</button>
          </div>
        </div>

        <!-- Wild Encounter Rate Cap Toggle (RELAXED 4.0% | NORMAL 6.25% | CLASSIC 10.0%) -->
        <div data-settings-category="GAMEPLAY" style="${groupCardStyle}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">WILD ENCOUNTER RATE</div>
              <div style="${subLabelStyle}">4-step grace buffer + step probability cap</div>
            </div>
            <button id="settings-encounter-rate-btn" class="neo-kanto-tactile-btn" style="
              background: #0284c7;
              color: #ffffff;
              border: 1.5px solid #38bdf8;
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 7px 12px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">${getEncounterRateLabel(encounterRateMode)}</button>
          </div>
          <div id="settings-encounter-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-enc-relaxed-btn" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${encounterRateMode === 'RELAXED' ? '#059669' : '#080E1D'};
              color: ${encounterRateMode === 'RELAXED' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${encounterRateMode === 'RELAXED' ? '#34d399' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ RELAXED 4% ]</button>
            <button id="settings-enc-normal-btn" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${encounterRateMode === 'NORMAL' ? '#0284c7' : '#080E1D'};
              color: ${encounterRateMode === 'NORMAL' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${encounterRateMode === 'NORMAL' ? '#38bdf8' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ NORMAL 6.25% ]</button>
            <button id="settings-enc-classic-btn" class="neo-kanto-tactile-btn" style="
              flex: 1;
              background: ${encounterRateMode === 'CLASSIC' ? '#d97706' : '#080E1D'};
              color: ${encounterRateMode === 'CLASSIC' ? '#ffffff' : '#94a3b8'};
              border: 1.5px solid ${encounterRateMode === 'CLASSIC' ? '#fbbf24' : '#22324F'};
              box-shadow: 0 3px 0 0 #070B14;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ CLASSIC 10% ]</button>
          </div>
        </div>

        <!-- Auto-HM Mode Single Toggle -->
        <div data-settings-category="GAMEPLAY" style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">AUTO-HM MODE</div>
            <div style="${subLabelStyle}">Use Surf, Cut & Strength automatically</div>
          </div>
          <button id="settings-autohm-btn" class="neo-kanto-tactile-btn" style="
            background: ${isAutoHm ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1.5px solid ${isAutoHm ? '#34d399' : '#64748b'};
            box-shadow: 0 3px 0 0 #070B14;
            border-radius: 6px;
            padding: 8px 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
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
