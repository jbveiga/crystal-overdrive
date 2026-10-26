import { BattleAudio } from '../audio/BattleAudio';
import type { RoamerState } from '../types/game';
import {
  JOHTO_LANDMARKS,
  resolveCurrentLandmark,
  type TownMapLandmark,
} from '../world/townMapData';
import {
  injectTownMapStyles,
  renderSvgTopology,
  renderTacticalNodes,
  renderInspectorCard,
} from './town-map/TownMapStylesAndInspectorRenderer';

export interface TownMapResponsiveMetrics {
  viewportWidth: number;
  isMobile: boolean; // width < 768
  cardWidthPct: number; // 100vw on mobile
  cardHeightPct: number; // 100dvh on mobile
  splitDirection: 'column' | 'row';
  canvasFlexBasis: string;
  inspectorFlexBasis: string;
}

export type TownMapFilter = 'ALL' | 'GYMS' | 'DUNGEONS' | 'ROUTES';

export interface TownMapUIOptions {
  containerId?: string;
  onClose?: () => void;
  onFly?: (landmark: TownMapLandmark) => void;
}

/**
 * Neo-Kanto Tactical Radar & Johto Regional PokéGear Map.
 * Conforms to Google Stitch Neo-Kanto Protocol:
 * - Desktop Screen: 3014eb857fec479fb5f0e19d9af61caa (Side Command Menu & Regional Radar Map)
 * - Mobile Screen:  d8b601897b044546af55628a5ed19332 (Mobile PokéGear // Johto Comms Hub)
 */
export class TownMapUI {
  private container: HTMLElement;
  private rootElement: HTMLDivElement | null = null;
  private active: boolean = false;
  private currentMapId: string = 'new_bark_town';
  private playerLandmark: TownMapLandmark | null = null;
  private selectedLandmark: TownMapLandmark | null = null;
  private visitedLandmarkIds: Set<string> = new Set();
  private activeRoamers: RoamerState[] = [];
  private activeFilter: TownMapFilter = 'ALL';
  private options: TownMapUIOptions;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: TownMapUIOptions = {}) {
    this.options = options;
    const containerId = options.containerId || 'modal-container';
    this.container = document.getElementById(containerId) || document.body;
    injectTownMapStyles();
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

  public getActiveFilter(): TownMapFilter {
    return this.activeFilter;
  }

  public setActiveFilter(filter: TownMapFilter): void {
    if (this.activeFilter === filter) return;
    this.activeFilter = filter;
    BattleAudio.playMenuSound('CURSOR');
    this.render();
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

    // Resolve current player landmark with comprehensive interior map resolution
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

    // Hotkey Category Switching: 1=ALL, 2=GYMS, 3=DUNGEONS, 4=ROUTES
    if (e.key === '1') {
      this.setActiveFilter('ALL');
      return true;
    }
    if (e.key === '2') {
      this.setActiveFilter('GYMS');
      return true;
    }
    if (e.key === '3') {
      this.setActiveFilter('DUNGEONS');
      return true;
    }
    if (e.key === '4') {
      this.setActiveFilter('ROUTES');
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

  private render(): void {
    if (this.boundKeyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    if (this.rootElement) {
      this.rootElement.remove();
    }

    const isMobile =
      typeof window !== 'undefined' && window.innerWidth > 0 && window.innerWidth < 768;

    const modal = document.createElement('div');
    modal.id = 'town-map-modal';
    modal.className = 'interactive';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(8, 14, 29, 0.95);
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
      box-shadow: ${isMobile ? 'none' : '0 20px 54px rgba(0, 0, 0, 0.92), 0 0 0 1px rgba(56, 189, 248, 0.15)'};
      width: ${isMobile ? '100vw' : 'min(1040px, 96vw)'};
      max-width: ${isMobile ? '100vw' : 'none'};
      height: ${isMobile ? '100dvh' : 'min(660px, 92vh)'};
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
        <!-- Neo-Kanto Tactical Blueprint Radar Map Canvas -->
        <div id="town-map-canvas-container" style="
          ${isMobile ? 'flex: 1 1 54vh; width: 100%; min-height: 50vh; border-bottom: 2px solid #22324F;' : 'flex: 1.85; border-right: 2px solid #22324F;'}
          position: relative;
          background: #080E1C;
          overflow: hidden;
        ">
          <!-- Tactical HUD Deck Header & Filter Control -->
          <div id="town-map-radar-toolbar" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 38px;
            background: rgba(13, 19, 34, 0.9);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid #22324F;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px;
            z-index: 28;
          ">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
              <span style="color: #38BDF8; font-size: 12px; flex-shrink: 0;">📡</span>
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #F6F8F3; letter-spacing: 0.5px; white-space: nowrap;">
                RADAR MATRIX // SECTOR-02
              </span>
              <span style="
                background: #060B16;
                border: 1px solid #22324F;
                color: #FFD028;
                font-family: 'Space Mono', monospace;
                font-size: 9px;
                font-weight: 700;
                padding: 1px 6px;
                border-radius: 3px;
                white-space: nowrap;
              ">
                GRID: E-${String(sel.gridX).padStart(2, '0')}/N-${String(sel.gridY).padStart(2, '0')}
              </span>
            </div>

            <!-- Segmented Category Filters -->
            <div style="display: flex; gap: 4px; background: #060B16; padding: 2px; border-radius: 6px; border: 1px solid #22324F; flex-shrink: 0;">
              ${(['ALL', 'GYMS', 'DUNGEONS', 'ROUTES'] as const)
                .map(
                  (f) => `
                <button
                  type="button"
                  class="town-map-filter-btn"
                  data-filter="${f}"
                  style="
                    background: ${this.activeFilter === f ? '#FFD028' : 'transparent'};
                    color: ${this.activeFilter === f ? '#080E1D' : '#8A9BA8'};
                    font-family: 'Space Mono', monospace;
                    font-size: 9px;
                    font-weight: ${this.activeFilter === f ? '900' : '700'};
                    padding: 3px 8px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                  "
                >
                  ${f === 'ALL' ? 'ALL NODES' : f === 'GYMS' ? 'GYMS (8)' : f}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Multi-Layer SVG Vector Radar Stage -->
          ${renderSvgTopology(this.visitedLandmarkIds)}

          <!-- Interactive Tactical Nodes Layer -->
          ${renderTacticalNodes({
            sel,
            playerLandmark: this.playerLandmark,
            visitedLandmarkIds: this.visitedLandmarkIds,
            activeFilter: this.activeFilter,
            activeRoamers: this.activeRoamers,
            isMobile,
          })}

          <!-- Compass Telemetry Reticle -->
          <div style="
            position: absolute;
            bottom: 8px;
            left: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(13, 19, 34, 0.88);
            border: 1px solid #22324F;
            backdrop-filter: blur(6px);
            padding: 3px 8px;
            border-radius: 4px;
            z-index: 25;
            pointer-events: none;
          ">
            <span style="font-size: 11px;">🧭</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; color: #8A9BA8;">
              MAGNETIC N 014° // <strong style="color: #F6F8F3;">SILPH-RADAR 5000</strong>
            </span>
          </div>

          <!-- Live Scan Status -->
          <div style="
            position: absolute;
            bottom: 8px;
            right: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(13, 19, 34, 0.88);
            border: 1px solid #22324F;
            backdrop-filter: blur(6px);
            padding: 3px 8px;
            border-radius: 4px;
            z-index: 25;
            pointer-events: none;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #48C774; box-shadow: 0 0 6px #48C774;"></span>
            <span style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; color: #48C774; letter-spacing: 0.5px;">
              SCAN CYCLE ACTIVE
            </span>
          </div>
        </div>

        <!-- Telemetry Inspector Card (Right / Bottom Sheet) -->
        ${renderInspectorCard({
          sel,
          isVisited,
          roamersAtSel,
          activeRoamers: this.activeRoamers,
          playerLandmark: this.playerLandmark,
          isMobile,
        })}
      </div>
    `;

    modal.appendChild(card);
    this.container.appendChild(modal);
    this.rootElement = modal;

    // Attach Event Handlers
    card.querySelector('#town-map-close-btn')?.addEventListener('click', () => this.close());

    // Category Filter Buttons
    const filterBtns = card.querySelectorAll('.town-map-filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter') as TownMapFilter;
        if (filter) {
          this.setActiveFilter(filter);
        }
      });
    });

    // Fly / Fast Travel Button
    card.querySelector('#town-map-fly-btn')?.addEventListener('click', () => {
      if (sel.flyable && isVisited) {
        this.options.onFly?.(sel);
      }
    });

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
