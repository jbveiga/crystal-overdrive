/**
 * @fileoverview TownMapStylesAndInspectorRenderer domain module implementation.
 * @module ui/town-map/TownMapStylesAndInspectorRenderer
 * @role TownMapStylesAndInspectorRenderer Component
 * @exports getTownMapPercentCoord, injectTownMapStyles, renderSvgTopology
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-246: Implementation | L247-492: Handlers & Exports
 */

import type { RoamerState } from '../../types/game';
import {
  JOHTO_LANDMARKS,
  JOHTO_CONNECTIONS,
  resolveCurrentLandmark,
  computeLandmarkDistance,
  type TownMapLandmark,
} from '../../world/townMapData';
import type { TownMapFilter } from '../TownMapUI';

/**
 * Tactical Blueprint SVG Grid Coordinates (16 x 14 grid matrix)
 * 0..15 mapped to 4% .. 96% width; 0..13 mapped to 8% .. 92% height (accounting for top radar toolbar)
 */
export function getTownMapPercentCoord(gridX: number, gridY: number): { leftPct: number; topPct: number } {
  const leftPct = 4 + (gridX / 15) * 92;
  const topPct = 9 + (gridY / 13) * 85;
  return { leftPct, topPct };
}

/**
 * Injects Google Stitch Neo-Kanto styles for the Town Map HUD.
 */
export function injectTownMapStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('neo-kanto-town-map-styles')) return;

  const style = document.createElement('style');
  style.id = 'neo-kanto-town-map-styles';
  style.textContent = `
    #town-map-modal, #town-map-card { pointer-events: auto !important; }

    /* Pure concentric radar ping animation (Zero compound translation offset) */
    @keyframes neoRadarPing {
      0% { transform: scale(0.75); opacity: 0.95; }
      70% { opacity: 0.35; }
      100% { transform: scale(2.6); opacity: 0; }
    }
    @keyframes neoRadarPulse {
      0%, 100% { transform: scale(1); opacity: 0.65; }
      50% { transform: scale(1.35); opacity: 0.2; }
    }
    @keyframes roamerPulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 0 2px #FFD028); }
      50% { transform: translate(-50%, -50%) scale(1.25); filter: drop-shadow(0 0 8px #FFD028); }
    }
    @keyframes radarSweep {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Centered Player Radar Beacon Structure */
    .town-map-player-beacon {
      position: absolute; transform: translate(-50%, -50%);
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      pointer-events: none; z-index: 35;
    }
    .beacon-ping-ring {
      position: absolute; width: 32px; height: 32px; border-radius: 50%;
      border: 2px solid #FFD028; background: rgba(255, 208, 40, 0.15);
      animation: neoRadarPing 1.6s cubic-bezier(0, 0.2, 0.8, 1) infinite;
      transform-origin: center center; pointer-events: none;
    }
    .beacon-pulse-halo {
      position: absolute; width: 20px; height: 20px; border-radius: 50%;
      background: rgba(255, 208, 40, 0.38);
      animation: neoRadarPulse 1.4s ease-in-out infinite;
      transform-origin: center center; pointer-events: none;
    }
    .town-map-player-blip {
      width: 12px; height: 12px; background: #FFD028; border: 2px solid #080E1D;
      border-radius: 50%; box-shadow: 0 0 10px #FFD028; position: relative; z-index: 3; pointer-events: none;
    }

    /* Floating Tactical YOU Sector Badge */
    .beacon-you-badge {
      position: absolute; bottom: calc(100% + 5px); left: 50%; transform: translateX(-50%);
      background: #FFD028; color: #080E1D; font-family: 'Space Mono', monospace; font-size: 8px;
      font-weight: 900; letter-spacing: 0.5px; padding: 1px 5px; border-radius: 3px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 208, 40, 0.6);
      white-space: nowrap; display: flex; align-items: center; gap: 3px; z-index: 38; pointer-events: none;
    }
    .beacon-you-badge::after {
      content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
      border-width: 3px 3px 0 3px; border-style: solid; border-color: #FFD028 transparent transparent transparent;
    }
    .beacon-you-dot {
      width: 4px; height: 4px; border-radius: 50%; background: #F43F5E; display: inline-block;
    }

    .town-map-node {
      position: absolute; transform: translate(-50%, -50%); cursor: pointer;
      transition: transform 0.12s ease, filter 0.15s ease, opacity 0.15s ease;
      display: flex; align-items: center; justify-content: center; z-index: 10; user-select: none;
    }
    .town-map-node:hover { transform: translate(-50%, -50%) scale(1.28); z-index: 28; }
    .town-map-node.selected {
      outline: 2px solid #FFD028; outline-offset: 3px; z-index: 29; box-shadow: 0 0 14px rgba(255, 208, 40, 0.9);
    }
    .town-map-node.dimmed { opacity: 0.22 !important; filter: grayscale(0.8) !important; }

    /* Responsive Mobile Viewport Adaptations (< 768px Full-Width Architecture) */
    @media (max-width: 768px) {
      #town-map-modal { padding: 0 !important; }
      #town-map-card {
        width: 100vw !important; max-width: 100vw !important; height: 100dvh !important;
        border-radius: 0 !important; border: none !important; box-shadow: none !important;
      }
      #town-map-split { flex-direction: column !important; min-height: 0 !important; }
      #town-map-canvas-container {
        width: 100% !important; flex: 1 1 54vh !important; min-height: 50vh !important;
        border-right: none !important; border-bottom: 2px solid #22324F !important;
      }
      #town-map-inspector {
        width: 100% !important; flex: 0 0 auto !important; max-height: 42vh !important;
        padding: 12px 16px !important; box-sizing: border-box !important; border-top: none !important;
      }
      #town-map-radar-toolbar { padding: 0 8px !important; }
      .town-map-filter-btn { font-size: 8px !important; padding: 2px 5px !important; }
      .town-map-node { min-width: 24px; min-height: 24px; }
      .town-map-node::before { content: ''; position: absolute; inset: -8px; cursor: pointer; }
      .town-map-header-title { font-size: 11px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .town-map-gps-pill { display: none !important; }
    }
  `;
  (document.head || document.body)?.appendChild(style);
}

/**
 * Renders the multi-layer SVG Vector Radar Stage.
 */
export function renderSvgTopology(visitedLandmarkIds: Set<string>): string {
  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2;">
      <defs>
        <pattern id="tacticalGrid" width="6.25" height="7.14" patternUnits="userSpaceOnUse">
          <path d="M 6.25 0 L 0 0 0 7.14" fill="none" stroke="#162238" stroke-width="0.35" />
          <circle cx="0" cy="0" r="0.4" fill="#FFD028" opacity="0.3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="#080E1C" />
      <rect x="0" y="0" width="100" height="100" fill="url(#tacticalGrid)" opacity="0.85" />
      <circle cx="48" cy="52" r="28" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="0.3" stroke-dasharray="1.5, 1.5" />
      <circle cx="48" cy="52" r="44" fill="none" stroke="rgba(56, 189, 248, 0.05)" stroke-width="0.3" stroke-dasharray="2, 2" />
      <polygon points="0,52 14,54 18,78 0,84" fill="#0F1B2E" stroke="#233B5E" stroke-width="0.7" />
      <circle cx="16" cy="62" r="2.2" fill="#14243D" stroke="#38BDF8" stroke-width="0.5" stroke-dasharray="1,1" />
      <circle cx="21" cy="65" r="1.8" fill="#14243D" stroke="#38BDF8" stroke-width="0.5" stroke-dasharray="1,1" />
      <polygon points="18,10 98,10 98,82 84,82 70,76 60,86 34,88 28,66 24,52 18,44" fill="#0F1B2E" stroke="#2A466F" stroke-width="0.9" />
      <polygon points="46,12 96,12 97,48 76,50 64,36 46,34" fill="#162238" stroke="#334155" stroke-width="0.5" stroke-dasharray="1,1" />
      <rect x="30" y="70" width="12" height="10" rx="2" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(72, 199, 116, 0.35)" stroke-width="0.5" />
      <rect x="31" y="38" width="10" height="9" rx="2" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(72, 199, 116, 0.35)" stroke-width="0.5" />
      <ellipse cx="71" cy="14" rx="7" ry="4.5" fill="#0A192F" stroke="#F43F5E" stroke-width="0.6" stroke-dasharray="1.5,1" />
      <line x1="0" y1="53.5" x2="34.6" y2="53.5" stroke="#A9C7FF" stroke-width="1.8" stroke-linecap="round" opacity="0.75" />
      <line x1="0" y1="53.5" x2="34.6" y2="53.5" stroke="#FFD028" stroke-width="1.0" stroke-dasharray="3, 2" />
      <g id="johto-banner" transform="translate(4, 44)">
        <rect x="0" y="0" width="18" height="6.5" rx="2" fill="#060B16" stroke="#22324F" stroke-width="0.6" />
        <text x="9" y="4.6" font-family="'Space Mono', monospace" font-size="3.2" font-weight="900" fill="#38BDF8" text-anchor="middle" letter-spacing="0.5">JOHTO</text>
      </g>
      ${JOHTO_CONNECTIONS.map((conn) => {
        const fromLm = JOHTO_LANDMARKS[conn.from];
        const toLm = JOHTO_LANDMARKS[conn.to];
        if (!fromLm || !toLm) return '';
        const p1 = getTownMapPercentCoord(fromLm.gridX, fromLm.gridY);
        const p2 = getTownMapPercentCoord(toLm.gridX, toLm.gridY);

        let pathD = '';
        if (p1.leftPct === p2.leftPct || p1.topPct === p2.topPct) {
          pathD = `M ${p1.leftPct} ${p1.topPct} L ${p2.leftPct} ${p2.topPct}`;
        } else {
          if (Math.abs(fromLm.gridX - toLm.gridX) > Math.abs(fromLm.gridY - toLm.gridY)) {
            pathD = `M ${p1.leftPct} ${p1.topPct} L ${p2.leftPct} ${p1.topPct} L ${p2.leftPct} ${p2.topPct}`;
          } else {
            pathD = `M ${p1.leftPct} ${p1.topPct} L ${p1.leftPct} ${p2.topPct} L ${p2.leftPct} ${p2.topPct}`;
          }
        }

        const isVisitedRoute =
          visitedLandmarkIds.has(conn.from) || visitedLandmarkIds.has(conn.to);

        if (isVisitedRoute) {
          return `
            <path d="${pathD}" stroke="#060B16" stroke-width="3.2" stroke-linecap="square" stroke-linejoin="miter" fill="none" />
            <path d="${pathD}" stroke="#FFD028" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" fill="none" opacity="0.9" />
          `;
        } else {
          return `
            <path d="${pathD}" stroke="#060B16" stroke-width="2.6" stroke-linecap="square" stroke-linejoin="miter" fill="none" />
            <path d="${pathD}" stroke="#4E4633" stroke-width="1.4" stroke-dasharray="1.8, 1.4" stroke-linecap="square" stroke-linejoin="miter" fill="none" />
          `;
        }
      }).join('')}
    </svg>
  `;
}

export interface RenderTacticalNodesParams {
  sel: TownMapLandmark;
  playerLandmark: TownMapLandmark | null;
  visitedLandmarkIds: Set<string>;
  activeFilter: TownMapFilter;
  activeRoamers: RoamerState[];
  isMobile: boolean;
}

/**
 * Renders the interactive tactical landmark nodes and badges layer.
 */
export function renderTacticalNodes({
  sel,
  playerLandmark,
  visitedLandmarkIds,
  activeFilter,
  activeRoamers,
  isMobile,
}: RenderTacticalNodesParams): string {
  return Object.values(JOHTO_LANDMARKS)
    .map((lm) => {
      const { leftPct, topPct } = getTownMapPercentCoord(lm.gridX, lm.gridY);
      const isSelected = sel.id === lm.id;
      const isPlayerHere = playerLandmark?.id === lm.id;
      const isVisitedLm = visitedLandmarkIds.has(lm.id);

      const matchesFilter =
        activeFilter === 'ALL' ||
        (activeFilter === 'GYMS' && Boolean(lm.gymLeader)) ||
        (activeFilter === 'DUNGEONS' &&
          (lm.type === 'dungeon' || lm.type === 'landmark')) ||
        (activeFilter === 'ROUTES' && lm.type === 'route');

      const isDimmed = !matchesFilter && !isPlayerHere && !isSelected;

      const isCityOrTown = lm.type === 'city' || lm.type === 'town';
      const isLandmarkOrDungeon = lm.type === 'landmark' || lm.type === 'dungeon';
      const baseSize = isCityOrTown ? 18 : isLandmarkOrDungeon ? 14 : 10;
      const size = isMobile ? Math.max(24, baseSize) : baseSize;

      const roamersHere = activeRoamers.filter((r) => {
        if (!r.isAwakened || r.isCaught || r.isDefeated) return false;
        const rLm = resolveCurrentLandmark(r.currentMapId);
        return rLm?.id === lm.id;
      });

      let nodeStyle = '';
      let badgeHtml = '';

      if (isCityOrTown) {
        const borderColor = lm.gymLeader
          ? '#FFD028'
          : isVisitedLm
          ? '#38BDF8'
          : '#22324F';
        nodeStyle = `left: ${leftPct}%; top: ${topPct}%; width: ${size}px; height: ${size}px; min-width: ${isMobile ? '24px' : 'auto'}; min-height: ${isMobile ? '24px' : 'auto'}; background: #141E33; border: 2px solid ${borderColor}; border-radius: 4px; box-shadow: 0 0 8px ${lm.gymLeader ? 'rgba(255, 208, 40, 0.4)' : 'rgba(56, 189, 248, 0.3)'}; display: flex; align-items: center; justify-content: center;`;
        if (lm.gymLeader) {
          badgeHtml = `<span style="font-size: 9px; line-height: 1; pointer-events: none;">${lm.badgeIcon || '⚡'}</span>`;
        }
      } else if (isLandmarkOrDungeon) {
        const isLake = lm.id === 'lake_of_rage';
        const borderColor = isLake ? '#F43F5E' : '#A855F7';
        nodeStyle = `left: ${leftPct}%; top: ${topPct}%; width: ${size}px; height: ${size}px; min-width: ${isMobile ? '24px' : 'auto'}; min-height: ${isMobile ? '24px' : 'auto'}; background: ${isLake ? 'rgba(244, 63, 94, 0.25)' : 'rgba(168, 85, 247, 0.25)'}; border: 2px solid ${borderColor}; transform: translate(-50%, -50%) rotate(45deg); border-radius: 2px; box-shadow: 0 0 8px ${isLake ? 'rgba(244, 63, 94, 0.4)' : 'rgba(168, 85, 247, 0.4)'};`;
      } else {
        nodeStyle = `left: ${leftPct}%; top: ${topPct}%; width: ${size}px; height: ${size}px; min-width: ${isMobile ? '24px' : 'auto'}; min-height: ${isMobile ? '24px' : 'auto'}; background: #1E293B; border: 1.5px solid ${isVisitedLm ? '#FFD028' : '#475569'}; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.6);`;
      }

      let labelPosStyle = `left: ${leftPct}%; top: calc(${topPct}% + ${Math.round(size / 2) + 3}px); transform: translateX(-50%);`;
      if (lm.id === 'goldenrod_city' || lm.id === 'olivine_city') {
        labelPosStyle = `left: calc(${leftPct}% - ${Math.round(size / 2) + 4}px); top: ${topPct}%; transform: translate(-100%, -50%);`;
      } else if (lm.id === 'violet_city' || lm.id === 'blackthorn_city') {
        labelPosStyle = `left: calc(${leftPct}% + ${Math.round(size / 2) + 4}px); top: ${topPct}%; transform: translateY(-50%);`;
      }

      return `
        <div class="town-map-node ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}" data-landmark-id="${lm.id}" style="${nodeStyle}" title="${lm.name}">
          ${badgeHtml}
        </div>
        ${
          isCityOrTown || isSelected || (matchesFilter && lm.type !== 'route')
            ? `<div style="position: absolute; ${labelPosStyle} font-size: 9px; font-weight: 800; font-family: 'Space Mono', monospace; color: #F6F8F3; background: rgba(13, 19, 34, 0.92); padding: 1px 5px; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 3px; white-space: nowrap; pointer-events: none; z-index: 22; text-shadow: 0 1px 2px #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); opacity: ${isDimmed ? '0.22' : '1'}; transition: opacity 0.15s ease;">${lm.name.replace(/ City| Town/g, '')}</div>`
            : ''
        }
        ${
          isPlayerHere
            ? `
              <div class="town-map-player-beacon" style="left: ${leftPct}%; top: ${topPct}%;">
                <div class="beacon-you-badge"><span class="beacon-you-dot"></span>YOU</div>
                <div class="beacon-ping-ring"></div>
                <div class="beacon-pulse-halo"></div>
                <div class="town-map-player-blip"></div>
              </div>
            `
            : ''
        }
        ${roamersHere
          .map((r) => {
            const icon =
              r.speciesId === 'raikou' ? '⚡' : r.speciesId === 'entei' ? '🔥' : '💧';
            return `<div style="position: absolute; left: ${leftPct}%; top: ${topPct - 3}%; font-size: 14px; z-index: 35; pointer-events: none; animation: roamerPulse 1.4s infinite;">${icon}</div>`;
          })
          .join('')}
      `;
    })
    .join('');
}

export interface RenderInspectorCardParams {
  sel: TownMapLandmark;
  isVisited: boolean;
  roamersAtSel: RoamerState[];
  activeRoamers: RoamerState[];
  playerLandmark: TownMapLandmark | null;
  isMobile: boolean;
}

/**
 * Renders the Telemetry Inspector Card (Right / Bottom Sheet).
 */
export function renderInspectorCard({
  sel,
  isVisited,
  roamersAtSel,
  activeRoamers,
  playerLandmark,
  isMobile,
}: RenderInspectorCardParams): string {
  return `
    <div id="town-map-inspector" style="
      ${isMobile ? 'flex: 0 0 auto; width: 100%; max-height: 42vh; padding: 12px 16px; box-sizing: border-box;' : 'flex: 1.1; padding: 20px;'}
      background: #0D1322; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; color: #F6F8F3;
    ">
      <div>
        <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #FFD028; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>// ${sel.type} TELEMETRY</span>
          <span style="color: #8A9BA8; font-size: 10px;">GRID: E-${String(sel.gridX).padStart(2, '0')}/N-${String(sel.gridY).padStart(2, '0')}</span>
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #F6F8F3;">${sel.name}</div>
        <div style="font-size: 13px; color: #8A9BA8; margin-top: 4px; line-height: 1.4;">"${sel.subtitle}"</div>
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 4px; background: ${isVisited ? 'rgba(72, 199, 116, 0.15)' : 'rgba(100, 116, 139, 0.2)'}; color: ${isVisited ? '#48C774' : '#94A3B8'}; border: 1px solid ${isVisited ? '#48C774' : '#64748B'};">
          ${isVisited ? '✓ VISITED LANDMARK' : '○ UNEXPLORED'}
        </span>
        ${
          sel.flyable && isVisited
            ? `
          <button id="town-map-fly-btn" type="button" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 4px; background: #FFD028; color: #080E1D; border: 1px solid #FFD028; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 10px rgba(255, 208, 40, 0.4); transition: transform 0.1s ease;">
            <span>✈️</span>
            <span>FAST TRAVEL [HM-02]</span>
          </button>
        `
            : ''
        }
      </div>

      ${
        sel.gymLeader
          ? `
        <div style="background: #141E33; border-left: 3px solid #FFD028; padding: 10px 14px; border-radius: 4px;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028;">
            GYM LEADER // ${sel.gymLeader.toUpperCase()}
          </div>
          <div style="font-size: 12px; color: #CBD5E1; margin-top: 2px;">
            Official Badge: <strong>${sel.badgeName}</strong> ${sel.badgeIcon || ''}
          </div>
        </div>
      `
          : ''
      }

      ${
        roamersAtSel.length > 0
          ? `
        <div style="background: rgba(255, 208, 40, 0.12); border: 1.5px solid #FFD028; padding: 12px; border-radius: 6px;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028; display: flex; align-items: center; gap: 6px;">
            ⚡ ROAMING BEAST DETECTED IN ZONE
          </div>
          ${roamersAtSel
            .map((r) => {
              const name = r.speciesId.toUpperCase();
              const icon = r.speciesId === 'raikou' ? '⚡' : r.speciesId === 'entei' ? '🔥' : '💧';
              return `<div style="font-size: 12px; color: #F6F8F3; margin-top: 4px;">${icon} <strong>${name}</strong> is currently prowling here!</div>`;
            })
            .join('')}
        </div>
      `
          : ''
      }

      ${
        sel.wildSpecies && sel.wildSpecies.length > 0
          ? `
        <div>
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #8A9BA8; margin-bottom: 6px;">WILD HABITAT RADAR</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${sel.wildSpecies
              .map(
                (sp) => `<span style="background: #141E33; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 2px 8px; font-family: 'Space Mono', monospace; font-size: 10px; color: #E2E8F0; text-transform: capitalize;">${sp}</span>`
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      ${
        activeRoamers.some((r) => r.isAwakened)
          ? `
        <div id="town-map-roamer-radar" style="background: #141E33; border: 1px solid #22324F; border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028; display: flex; justify-content: space-between; align-items: center;">
            <span>📡 LEGENDARY BEAST RADAR</span>
            <span style="font-size: 9px; color: #38BDF8;">LIVE TRACKING</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${activeRoamers
              .map((r) => {
                const rLm = resolveCurrentLandmark(r.currentMapId) || JOHTO_LANDMARKS.burned_tower;
                const hops = computeLandmarkDistance(playerLandmark?.id || 'new_bark_town', rLm.id);
                const icon = r.speciesId === 'raikou' ? '⚡' : r.speciesId === 'entei' ? '🔥' : '💧';
                const name = r.speciesId.toUpperCase();
                let proxLabel = '📡 TRACKING';
                let proxColor = '#38BDF8';
                if (r.isCaught) {
                  proxLabel = '🔴 CAUGHT';
                  proxColor = '#4ADE80';
                } else if (r.isDefeated) {
                  proxLabel = '⚔️ DEFEATED';
                  proxColor = '#94A3B8';
                } else if (!r.isAwakened) {
                  proxLabel = '💤 DORMANT';
                  proxColor = '#94A3B8';
                } else if (hops === 0) {
                  proxLabel = '🔥 SAME ZONE!';
                  proxColor = '#FFD028';
                } else if (hops === 1) {
                  proxLabel = '⚡ ADJACENT (1 HOP)';
                  proxColor = '#F59E0B';
                } else if (hops !== null) {
                  proxLabel = `📡 ${hops} HOPS AWAY`;
                  proxColor = '#38BDF8';
                }
                const isSelectedRoamerLm = sel.id === rLm.id;
                return `
                  <div
                    id="roamer-radar-${r.speciesId}"
                    class="roamer-radar-item"
                    data-landmark-id="${rLm.id}"
                    style="
                      background: ${isSelectedRoamerLm ? '#1E293B' : '#080E1D'};
                      border: 1px solid ${isSelectedRoamerLm ? '#FFD028' : '#22324F'};
                      border-radius: 5px;
                      padding: 6px 10px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      cursor: pointer;
                    "
                  >
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 13px;">${icon}</span>
                      <div>
                        <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #F6F8F3;">${name}</div>
                        <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8;">${rLm.name}</div>
                      </div>
                    </div>
                    <span style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; color: ${proxColor}; background: rgba(15, 23, 42, 0.8); border: 1px solid ${proxColor}; padding: 2px 6px; border-radius: 4px;">${proxLabel}</span>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <div style="margin-top: auto; border-top: 1px solid #22324F; padding-top: 12px; font-family: 'Space Mono', monospace; font-size: 10px; color: #64748B; line-height: 1.6;">
        <div>• Use <strong>Arrow Keys</strong> or <strong>Click</strong> to inspect landmarks</div>
        <div>• Press <strong>1-4</strong> to switch category filters</div>
        <div>• Press <strong>Escape</strong> to return to overworld</div>
      </div>
    </div>
  `;
}
