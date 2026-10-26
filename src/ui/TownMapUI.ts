import { BattleAudio } from '../audio/BattleAudio';
import type { RoamerState } from '../types/game';
import {
  JOHTO_LANDMARKS,
  JOHTO_CONNECTIONS,
  resolveCurrentLandmark,
  computeLandmarkDistance,
  type TownMapLandmark,
} from '../world/townMapData';

export interface TownMapResponsiveMetrics {
  viewportWidth: number;
  isMobile: boolean; // width < 768
  cardWidthPct: number; // 100vw on mobile
  cardHeightPct: number; // 100dvh on mobile
  splitDirection: 'column' | 'row';
  canvasFlexBasis: string;
  inspectorFlexBasis: string;
}

export interface TownMapUIOptions {
  containerId?: string;
  onClose?: () => void;
  onFly?: (landmark: TownMapLandmark) => void;
}

export class TownMapUI {
  private container: HTMLElement;
  private rootElement: HTMLDivElement | null = null;
  private active: boolean = false;
  private currentMapId: string = 'new_bark_town';
  private playerLandmark: TownMapLandmark | null = null;
  private selectedLandmark: TownMapLandmark | null = null;
  private visitedLandmarkIds: Set<string> = new Set();
  private activeRoamers: RoamerState[] = [];
  private options: TownMapUIOptions;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: TownMapUIOptions = {}) {
    this.options = options;
    const containerId = options.containerId || 'modal-container';
    this.container = document.getElementById(containerId) || document.body;
    this.injectStyles();
  }

  public isOpen(): boolean {
    return this.active;
  }

  public getCurrentMapId(): string {
    return this.currentMapId;
  }

  public getSelectedLandmark(): TownMapLandmark | null {
    return this.selectedLandmark;
  }

  public getCurrentPlayerLandmark(): TownMapLandmark | null {
    return this.playerLandmark;
  }

  public open(
    currentMapId: string = 'new_bark_town',
    visitedLandmarks: Iterable<string> = [],
    activeRoamers: RoamerState[] = [],
    focusLandmarkId?: string
  ): void {
    this.currentMapId = currentMapId;
    this.visitedLandmarkIds = new Set(visitedLandmarks);
    this.activeRoamers = activeRoamers;

    // Resolve current player landmark
    this.playerLandmark = resolveCurrentLandmark(currentMapId) || JOHTO_LANDMARKS.new_bark_town;
    this.visitedLandmarkIds.add(this.playerLandmark.id);
    this.selectedLandmark =
      (focusLandmarkId && JOHTO_LANDMARKS[focusLandmarkId]) || this.playerLandmark;
    this.active = true;

    BattleAudio.playMenuSound('CONFIRM');
    this.render();
  }

  public close(): void {
    if (!this.active) return;
    this.active = false;

    if (this.boundKeyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
    }

    BattleAudio.playMenuSound('CANCEL');
    this.options.onClose?.();
  }

  public selectLandmark(landmarkId: string): void {
    const lm = JOHTO_LANDMARKS[landmarkId];
    if (lm) {
      this.selectedLandmark = lm;
      BattleAudio.playMenuSound('CURSOR');
      this.render();
    }
  }

  public handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.active) return false;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return true;
    }

    if (!this.selectedLandmark) return false;

    const curX = this.selectedLandmark.gridX;
    const curY = this.selectedLandmark.gridY;
    let bestMatch: TownMapLandmark | null = null;
    let minDistance = Infinity;

    const all = Object.values(JOHTO_LANDMARKS);

    if (e.key === 'ArrowRight') {
      for (const lm of all) {
        if (lm.gridX > curX) {
          const dx = lm.gridX - curX;
          const dy = Math.abs(lm.gridY - curY);
          const score = dx * 2 + dy;
          if (score < minDistance) {
            minDistance = score;
            bestMatch = lm;
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      for (const lm of all) {
        if (lm.gridX < curX) {
          const dx = curX - lm.gridX;
          const dy = Math.abs(lm.gridY - curY);
          const score = dx * 2 + dy;
          if (score < minDistance) {
            minDistance = score;
            bestMatch = lm;
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      for (const lm of all) {
        if (lm.gridY < curY) {
          const dy = curY - lm.gridY;
          const dx = Math.abs(lm.gridX - curX);
          const score = dy * 2 + dx;
          if (score < minDistance) {
            minDistance = score;
            bestMatch = lm;
          }
        }
      }
    } else if (e.key === 'ArrowDown') {
      for (const lm of all) {
        if (lm.gridY > curY) {
          const dy = lm.gridY - curY;
          const dx = Math.abs(lm.gridX - curX);
          const score = dy * 2 + dx;
          if (score < minDistance) {
            minDistance = score;
            bestMatch = lm;
          }
        }
      }
    }

    if (bestMatch) {
      e.preventDefault();
      this.selectLandmark(bestMatch.id);
      return true;
    }

    return false;
  }

  public static getResponsiveMetrics(viewportWidth: number): TownMapResponsiveMetrics {
    const isMobile = viewportWidth < 768;
    return {
      viewportWidth,
      isMobile,
      cardWidthPct: isMobile ? 100 : 96,
      cardHeightPct: isMobile ? 100 : 92,
      splitDirection: isMobile ? 'column' : 'row',
      canvasFlexBasis: isMobile ? '54vh' : 'auto',
      inspectorFlexBasis: isMobile ? '42vh' : 'auto',
    };
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('neo-kanto-town-map-styles')) return;

    const style = document.createElement('style');
    style.id = 'neo-kanto-town-map-styles';
    style.textContent = `
      #town-map-modal,
      #town-map-card {
        pointer-events: auto !important;
      }

      @keyframes radarPing {
        0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
      }

      @keyframes roamerPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 0 2px #FFD028); }
        50% { transform: translate(-50%, -50%) scale(1.25); filter: drop-shadow(0 0 8px #FFD028); }
      }

      .town-map-player-blip {
        width: 14px;
        height: 14px;
        background: #FFD028;
        border: 2px solid #0D1322;
        border-radius: 50%;
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 30;
        pointer-events: none;
      }

      .town-map-player-blip::after {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2px solid #FFD028;
        animation: radarPing 1.6s cubic-bezier(0, 0.2, 0.8, 1) infinite;
      }

      .town-map-node {
        position: absolute;
        transform: translate(-50%, -50%);
        cursor: pointer;
        transition: transform 0.1s ease, filter 0.1s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        user-select: none;
      }
      .town-map-node:hover {
        transform: translate(-50%, -50%) scale(1.3);
        z-index: 25;
      }
      .town-map-node.selected {
        outline: 2px solid #FFD028;
        outline-offset: 3px;
        z-index: 26;
        box-shadow: 0 0 12px rgba(255, 208, 40, 0.8);
      }

      /* Responsive Mobile Viewport Adaptations (< 768px Full-Width Architecture) */
      @media (max-width: 768px) {
        #town-map-modal {
          padding: 0 !important;
        }
        #town-map-card {
          width: 100vw !important;
          max-width: 100vw !important;
          height: 100dvh !important;
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
        #town-map-split {
          flex-direction: column !important;
          min-height: 0 !important;
        }
        #town-map-canvas-container {
          width: 100% !important;
          flex: 1 1 54vh !important;
          min-height: 50vh !important;
          border-right: none !important;
          border-bottom: 2px solid #22324F !important;
        }
        #town-map-inspector {
          width: 100% !important;
          flex: 0 0 auto !important;
          max-height: 42vh !important;
          padding: 12px 16px !important;
          box-sizing: border-box !important;
          border-top: none !important;
        }
        .town-map-node {
          min-width: 24px;
          min-height: 24px;
        }
        .town-map-node::before {
          content: '';
          position: absolute;
          inset: -8px;
          cursor: pointer;
        }
        .town-map-header-title {
          font-size: 11px !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .town-map-gps-pill {
          display: none !important;
        }
      }
    `;
    (document.head || document.body)?.appendChild(style);
  }

  private render(): void {
    if (this.boundKeyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    if (this.rootElement) {
      this.rootElement.remove();
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth > 0 && window.innerWidth < 768;

    const modal = document.createElement('div');
    modal.id = 'town-map-modal';
    modal.className = 'interactive';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(13, 19, 34, 0.94);
      backdrop-filter: blur(14px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
      padding: ${isMobile ? '0' : '12px'};
      pointer-events: auto !important;
    `;

    const card = document.createElement('div');
    card.id = 'town-map-card';
    card.className = `interactive ${isMobile ? 'mobile-viewport' : ''}`;
    card.style.cssText = `
      background: #0D1322;
      border: ${isMobile ? 'none' : '2px solid #22324F'};
      border-radius: ${isMobile ? '0' : '8px'};
      box-shadow: ${isMobile ? 'none' : '0 16px 48px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 208, 40, 0.15)'};
      width: ${isMobile ? '100vw' : 'min(980px, 96vw)'};
      max-width: ${isMobile ? '100vw' : 'none'};
      height: ${isMobile ? '100dvh' : 'min(650px, 92vh)'};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      pointer-events: auto !important;
    `;

    const playerLocName = this.playerLandmark?.name || 'Johto Region';
    const sel = this.selectedLandmark || this.playerLandmark || JOHTO_LANDMARKS.new_bark_town;
    const isVisited = this.visitedLandmarkIds.has(sel.id);

    // Roamers on selected landmark
    const roamersAtSel = this.activeRoamers.filter((r) => {
      if (!r.isAwakened || r.isCaught || r.isDefeated) return false;
      const rLm = resolveCurrentLandmark(r.currentMapId);
      return rLm?.id === sel.id;
    });

    // Tactical Blueprint SVG Grid Coordinates (16 x 14 grid matrix)
    // 0..15 mapped to 4% .. 96% width; 0..13 mapped to 6% .. 94% height
    const getPercentCoord = (gridX: number, gridY: number) => {
      const leftPct = 4 + (gridX / 15) * 92;
      const topPct = 6 + (gridY / 13) * 88;
      return { leftPct, topPct };
    };

    card.innerHTML = `
      <!-- Console Header -->
      <div id="town-map-header" style="
        height: 48px;
        background: #141E33;
        border-bottom: 2px solid #22324F;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0; overflow: hidden;">
          <span style="font-size: 16px; flex-shrink: 0;">🗺️</span>
          <span class="town-map-header-title" style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 800; letter-spacing: 1px; color: #FFD028; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            JOHTO REGIONAL RADAR // POKÉGEAR MAP
          </span>
          <div class="town-map-gps-pill" style="display: flex; align-items: center; gap: 6px; margin-left: 8px; flex-shrink: 0;">
            <span style="
              width: 8px;
              height: 8px;
              background: #48C774;
              border-radius: 50%;
              display: inline-block;
              box-shadow: 0 0 6px #48C774;
            "></span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #8A9BA8;">
              GPS: <strong style="color: #F6F8F3;">${playerLocName}</strong>
            </span>
          </div>
        </div>

        <button id="town-map-close-btn" style="
          background: #1A2640;
          color: #F6F8F3;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          padding: 6px 14px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
        ">
          ✕ CLOSE [ESC]
        </button>
      </div>

      <!-- Main Layout Split: Map Canvas vs Inspector -->
      <div id="town-map-split" class="${isMobile ? 'mobile-split' : ''}" style="
        display: flex;
        flex-direction: ${isMobile ? 'column' : 'row'};
        flex: 1;
        min-height: 0;
        overflow: hidden;
      ">
        <!-- Authentic Game Boy Color Johto Regional Map Canvas -->
        <div id="town-map-canvas-container" style="
          ${isMobile ? 'flex: 1 1 54vh; width: 100%; min-height: 50vh; border-bottom: 2px solid #22324F;' : 'flex: 1.8; border-right: 2px solid #22324F;'}
          position: relative;
          background: #2878c8;
          overflow: hidden;
        ">
          <!-- Authentic GBC Johto Terrain & Orthogonal Route Highways Layer -->
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2;">
            <defs>
              <!-- Authentic GBC Scanline Wave Pattern -->
              <pattern id="gbc-sea-waves" width="10" height="4" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="10" height="2" fill="#2868b8" />
                <rect x="0" y="2" width="10" height="2" fill="#3878c8" />
                <line x1="2" y1="1" x2="8" y2="1" stroke="#4888d8" stroke-width="0.6" opacity="0.5" />
              </pattern>
            </defs>

            <!-- Ocean waves background -->
            <rect x="0" y="0" width="100" height="100" fill="url(#gbc-sea-waves)" />

            <!-- Authentic GBC Landmass (Western Cianwood Peninsula & Whirl Islands) -->
            <polygon points="0,52 14,54 18,78 0,84" fill="#68a850" stroke="#183810" stroke-width="1.2" />
            <circle cx="16" cy="62" r="2.4" fill="#e8d088" stroke="#183810" stroke-width="0.8" />
            <circle cx="21" cy="65" r="2.0" fill="#e8d088" stroke="#183810" stroke-width="0.8" />

            <!-- Main Johto Landmass -->
            <polygon points="18,10 98,10 98,82 84,82 70,76 60,86 34,88 28,66 24,52 18,44" fill="#68a850" stroke="#183810" stroke-width="1.4" />

            <!-- Mountain Ranges (Mt. Mortar, Dark Cave, Ice Path, Mt. Silver) -->
            <polygon points="46,12 96,12 97,48 76,50 64,36 46,34" fill="#987040" stroke="#483018" stroke-width="1.0" opacity="0.9" />

            <!-- Forest Canopies (Ilex Forest & National Park) -->
            <rect x="30" y="70" width="12" height="10" rx="3" fill="#286820" stroke="#183810" stroke-width="0.8" />
            <rect x="31" y="38" width="10" height="9" rx="3" fill="#286820" stroke="#183810" stroke-width="0.8" />

            <!-- Lake of Rage -->
            <ellipse cx="71" cy="14" rx="7" ry="4.5" fill="#2868b8" stroke="#183810" stroke-width="0.8" />

            <!-- Authentic GBC "JOHTO" Corner Plaque -->
            <g id="johto-banner" transform="translate(4, 4)">
              <rect x="0" y="0" width="22" height="9" rx="1" fill="#f8f8f0" stroke="#181818" stroke-width="1.0" />
              <rect x="1" y="1" width="20" height="7" fill="none" stroke="#d04820" stroke-width="0.6" />
              <text x="11" y="6.5" font-family="'Space Mono', monospace" font-size="5" font-weight="900" fill="#181818" text-anchor="middle" letter-spacing="1">JOHTO</text>
            </g>

            <!-- Authentic Orthogonal 90-Degree GBC Route Highways -->
            ${JOHTO_CONNECTIONS.map((conn) => {
              const fromLm = JOHTO_LANDMARKS[conn.from];
              const toLm = JOHTO_LANDMARKS[conn.to];
              if (!fromLm || !toLm) return '';
              const p1 = getPercentCoord(fromLm.gridX, fromLm.gridY);
              const p2 = getPercentCoord(toLm.gridX, toLm.gridY);

              let pathD = '';
              if (p1.leftPct === p2.leftPct || p1.topPct === p2.topPct) {
                pathD = `M ${p1.leftPct} ${p1.topPct} L ${p2.leftPct} ${p2.topPct}`;
              } else {
                // Orthogonal 90° elbow connection matching GBC route alignment
                // Prioritize horizontal-then-vertical unless vertical movement matches route corridor
                if (Math.abs(fromLm.gridX - toLm.gridX) > Math.abs(fromLm.gridY - toLm.gridY)) {
                  pathD = `M ${p1.leftPct} ${p1.topPct} L ${p2.leftPct} ${p1.topPct} L ${p2.leftPct} ${p2.topPct}`;
                } else {
                  pathD = `M ${p1.leftPct} ${p1.topPct} L ${p1.leftPct} ${p2.topPct} L ${p2.leftPct} ${p2.topPct}`;
                }
              }

              return `
                <path
                  d="${pathD}"
                  stroke="#181818"
                  stroke-width="3.6"
                  stroke-linecap="square"
                  stroke-linejoin="miter"
                  fill="none"
                />
                <path
                  d="${pathD}"
                  stroke="#f8e090"
                  stroke-width="2.2"
                  stroke-linecap="square"
                  stroke-linejoin="miter"
                  fill="none"
                />
              `;
            }).join('')}
          </svg>

          <!-- Nodes Layer -->
          ${Object.values(JOHTO_LANDMARKS)
            .map((lm) => {
              const { leftPct, topPct } = getPercentCoord(lm.gridX, lm.gridY);
              const isSelected = sel.id === lm.id;
              const isPlayerHere = this.playerLandmark?.id === lm.id;
              const isVisitedLm = this.visitedLandmarkIds.has(lm.id);

              const isCityOrTown = lm.type === 'city' || lm.type === 'town';
              const isLandmarkOrDungeon = lm.type === 'landmark' || lm.type === 'dungeon';
              const baseSize = isCityOrTown ? 18 : isLandmarkOrDungeon ? 14 : 10;
              const size = isMobile ? Math.max(24, baseSize) : baseSize;

              // Roamers at this node
              const roamersHere = this.activeRoamers.filter((r) => {
                if (!r.isAwakened || r.isCaught || r.isDefeated) return false;
                const rLm = resolveCurrentLandmark(r.currentMapId);
                return rLm?.id === lm.id;
              });

              let nodeStyle = '';
              let badgeHtml = '';

              if (isCityOrTown) {
                // Authentic GBC Orange Square City Node with Inner Dark Square ▣
                nodeStyle = `
                  left: ${leftPct}%;
                  top: ${topPct}%;
                  width: ${size}px;
                  height: ${size}px;
                  min-width: ${isMobile ? '24px' : 'auto'};
                  min-height: ${isMobile ? '24px' : 'auto'};
                  background: #f85800;
                  border: 2px solid #000000;
                  border-radius: 0px;
                  box-shadow: inset 0 0 0 2px #f85800, inset 0 0 0 3px #000000, 0 2px 6px rgba(0,0,0,0.75);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                `;
                if (lm.gymLeader) {
                  badgeHtml = `<span style="font-size: 8px; line-height: 1; pointer-events: none;">${lm.badgeIcon || '⚡'}</span>`;
                }
              } else if (isLandmarkOrDungeon) {
                // Authentic GBC Red Diamond Landmark Marker ◆
                nodeStyle = `
                  left: ${leftPct}%;
                  top: ${topPct}%;
                  width: ${size}px;
                  height: ${size}px;
                  min-width: ${isMobile ? '24px' : 'auto'};
                  min-height: ${isMobile ? '24px' : 'auto'};
                  background: #f81800;
                  border: 2px solid #000000;
                  transform: translate(-50%, -50%) rotate(45deg);
                  border-radius: 0px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.75);
                `;
              } else {
                // Route Waypoint
                nodeStyle = `
                  left: ${leftPct}%;
                  top: ${topPct}%;
                  width: ${size}px;
                  height: ${size}px;
                  min-width: ${isMobile ? '24px' : 'auto'};
                  min-height: ${isMobile ? '24px' : 'auto'};
                  background: #f8e090;
                  border: 1.5px solid #181818;
                  border-radius: 0px;
                  box-shadow: 0 1px 4px rgba(0,0,0,0.6);
                `;
              }

              return `
                <div
                  class="town-map-node ${isSelected ? 'selected' : ''}"
                  data-landmark-id="${lm.id}"
                  style="${nodeStyle}"
                  title="${lm.name}"
                >
                  ${badgeHtml}
                </div>

                ${
                  isCityOrTown
                    ? `<div style="
                        position: absolute;
                        left: ${leftPct}%;
                        top: calc(${topPct}% + ${Math.round(size / 2) + 3}px);
                        transform: translateX(-50%);
                        font-size: 9px;
                        font-weight: 900;
                        font-family: 'Space Mono', monospace;
                        color: #ffffff;
                        background: rgba(15, 23, 42, 0.88);
                        padding: 1px 4px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 2px;
                        white-space: nowrap;
                        pointer-events: none;
                        z-index: 22;
                        text-shadow: 0 1px 2px #000;
                      ">${lm.name.replace(/ City| Town/g, '')}</div>`
                    : ''
                }

                ${
                  isPlayerHere
                    ? `<div class="town-map-player-blip" style="left: ${leftPct}%; top: ${topPct}%;"></div>`
                    : ''
                }

                ${roamersHere
                  .map((r) => {
                    const icon = r.speciesId === 'raikou' ? '⚡' : r.speciesId === 'entei' ? '🔥' : '💧';
                    return `
                    <div style="
                      position: absolute;
                      left: ${leftPct}%;
                      top: ${topPct - 3}%;
                      font-size: 14px;
                      z-index: 35;
                      pointer-events: none;
                      animation: roamerPulse 1.4s infinite;
                    ">${icon}</div>
                  `;
                  })
                  .join('')}
              `;
            })
            .join('')}
        </div>

        <!-- Telemetry Inspector Card (Right / Bottom Sheet) -->
        <div id="town-map-inspector" style="
          ${isMobile ? 'flex: 0 0 auto; width: 100%; max-height: 42vh; padding: 12px 16px; box-sizing: border-box;' : 'flex: 1.1; padding: 20px;'}
          background: #0D1322;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          color: #F6F8F3;
        ">
          <!-- Landmark Name & Category -->
          <div>
            <div style="
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              font-weight: 700;
              color: #FFD028;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 4px;
            ">
              // ${sel.type} TELEMETRY
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #F6F8F3;">
              ${sel.name}
            </div>
            <div style="font-size: 13px; color: #8A9BA8; margin-top: 4px; line-height: 1.4;">
              "${sel.subtitle}"
            </div>
          </div>

          <!-- Status Pill -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span style="
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 4px;
              background: ${isVisited ? 'rgba(72, 199, 116, 0.15)' : 'rgba(100, 116, 139, 0.2)'};
              color: ${isVisited ? '#48C774' : '#94A3B8'};
              border: 1px solid ${isVisited ? '#48C774' : '#64748B'};
            ">
              ${isVisited ? '✓ VISITED LANDMARK' : '○ UNEXPLORED'}
            </span>

            ${
              sel.flyable && isVisited
                ? `
              <span style="
                font-family: 'Space Mono', monospace;
                font-size: 10px;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 4px;
                background: rgba(42, 117, 211, 0.2);
                color: #38BDF8;
                border: 1px solid #38BDF8;
              ">
                ✈️ FLY DESTINATION
              </span>
            `
                : ''
            }
          </div>

          <!-- Gym Leader / Special Feature -->
          ${
            sel.gymLeader
              ? `
            <div style="
              background: #141E33;
              border-left: 3px solid #FFD028;
              padding: 10px 14px;
              border-radius: 4px;
            ">
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

          <!-- Live Roaming Beasts Detection -->
          ${
            roamersAtSel.length > 0
              ? `
            <div style="
              background: rgba(255, 208, 40, 0.12);
              border: 1.5px solid #FFD028;
              padding: 12px;
              border-radius: 6px;
            ">
              <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028; display: flex; align-items: center; gap: 6px;">
                ⚡ ROAMING BEAST DETECTED IN ZONE
              </div>
              ${roamersAtSel
                .map((r) => {
                  const name = r.speciesId.toUpperCase();
                  const icon = r.speciesId === 'raikou' ? '⚡' : r.speciesId === 'entei' ? '🔥' : '💧';
                  return `
                    <div style="font-size: 12px; color: #F6F8F3; margin-top: 4px;">
                      ${icon} <strong>${name}</strong> is currently prowling here!
                    </div>
                  `;
                })
                .join('')}
            </div>
          `
              : ''
          }

          <!-- Wild Species Preview -->
          ${
            sel.wildSpecies && sel.wildSpecies.length > 0
              ? `
            <div>
              <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #8A9BA8; margin-bottom: 6px;">
                WILD HABITAT RADAR
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${sel.wildSpecies
                  .map(
                    (sp) => `
                    <span style="
                      background: #141E33;
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 4px;
                      padding: 2px 8px;
                      font-family: 'Space Mono', monospace;
                      font-size: 10px;
                      color: #E2E8F0;
                      text-transform: capitalize;
                    ">${sp}</span>
                  `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }

          <!-- Legendary Beast Roamer Radar -->
          ${
            this.activeRoamers.length > 0
              ? `
            <div id="town-map-roamer-radar" style="
              background: #141E33;
              border: 1px solid #22324F;
              border-radius: 6px;
              padding: 10px 12px;
              display: flex;
              flex-direction: column;
              gap: 8px;
            ">
              <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028; display: flex; justify-content: space-between; align-items: center;">
                <span>📡 LEGENDARY BEAST RADAR</span>
                <span style="font-size: 9px; color: #38BDF8;">LIVE TRACKING</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${this.activeRoamers
                  .map((r) => {
                    const rLm = resolveCurrentLandmark(r.currentMapId) || JOHTO_LANDMARKS.burned_tower;
                    const hops = computeLandmarkDistance(
                      this.playerLandmark?.id || 'new_bark_town',
                      rLm.id
                    );
                    const icon =
                      r.speciesId === 'raikou' ? '⚡' : r.speciesId === 'entei' ? '🔥' : '💧';
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
                        <span style="
                          font-family: 'Space Mono', monospace;
                          font-size: 9px;
                          font-weight: 800;
                          color: ${proxColor};
                          background: rgba(15, 23, 42, 0.8);
                          border: 1px solid ${proxColor};
                          padding: 2px 6px;
                          border-radius: 4px;
                        ">${proxLabel}</span>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>
          `
              : ''
          }

          <!-- Navigation Instructions -->
          <div style="
            margin-top: auto;
            border-top: 1px solid #22324F;
            padding-top: 12px;
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            color: #64748B;
            line-height: 1.6;
          ">
            <div>• Use <strong>Arrow Keys</strong> or <strong>Click</strong> to inspect landmarks</div>
            <div>• Press <strong>Escape</strong> to return to overworld</div>
          </div>
        </div>
      </div>
    `;

    modal.appendChild(card);
    this.container.appendChild(modal);
    this.rootElement = modal;

    // Attach Event Handlers
    card.querySelector('#town-map-close-btn')?.addEventListener('click', () => this.close());

    const nodes = card.querySelectorAll('.town-map-node');
    nodes.forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-landmark-id');
        if (id) {
          this.selectLandmark(id);
        }
      });
    });

    const radarItems = card.querySelectorAll('.roamer-radar-item');
    radarItems.forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-landmark-id');
        if (id) {
          this.selectLandmark(id);
        }
      });
    });

    this.boundKeyHandler = (e: KeyboardEvent) => {
      this.handleKeyDown(e);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeyHandler);
    }
  }
}
