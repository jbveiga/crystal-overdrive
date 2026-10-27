import type { Mission, MissionFilter } from '../types/game';
import type { MissionManager } from '../world/MissionManager';
import { BattleAudio } from '../audio/BattleAudio';

const FILTER_TABS: MissionFilter[] = ['ALL', 'MAIN', 'SIDE', 'COMPLETED'];

export class MissionLogUI {
  private container: HTMLElement;
  private missionManager: MissionManager;
  private modalElement!: HTMLDivElement;
  private listPane!: HTMLDivElement;
  private detailPane!: HTMLDivElement;
  private tabsBar!: HTMLDivElement;
  private activeFilter: MissionFilter = 'ALL';
  private selectedMissionId: string | null = 'M01';

  constructor(containerId: string, missionManager: MissionManager) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`MissionLogUI container #${containerId} not found`);
    }
    this.container = el;
    this.missionManager = missionManager;
    this.injectResponsiveStyles();
    this.createUI();
  }

  private injectResponsiveStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('crystal-mission-log-styles')) return;
    const style = document.createElement('style');
    style.id = 'crystal-mission-log-styles';
    style.textContent = `
      #mission-log-card * {
        box-sizing: border-box;
      }
      @media (max-width: 720px), (orientation: portrait) {
        #mission-log-card {
          width: 96vw !important;
          max-height: 92dvh !important;
          padding: 12px !important;
        }
        #mission-split-body {
          flex-direction: column !important;
          max-height: 72dvh !important;
        }
        #mission-list-pane {
          width: 100% !important;
          max-height: 28dvh !important;
          border-right: none !important;
          border-bottom: 1.5px solid #22324F !important;
          padding-right: 0 !important;
          padding-bottom: 8px !important;
        }
        #mission-detail-pane {
          width: 100% !important;
          max-height: 44dvh !important;
        }
      }
    `;
    document.head?.appendChild(style);
  }

  private createUI(): void {
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'mission-log-modal';
    this.modalElement.className = 'interactive';
    this.modalElement.style.cssText = `
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(8, 14, 29, 0.88);
      backdrop-filter: blur(12px);
      z-index: 62;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    `;
    this.modalElement.style.pointerEvents = 'auto';

    this.modalElement.innerHTML = `
      <div id="mission-log-card" class="interactive" style="
        width: 840px;
        max-width: 95vw;
        max-height: 88dvh;
        background: #0D1322;
        border: 2px solid #22324F;
        border-radius: 12px;
        padding: 18px 20px;
        color: #f8fafc;
        box-shadow: 0 6px 0 0 #070B14, 0 20px 60px rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-sizing: border-box;
        pointer-events: auto;
        position: relative;
        overflow: hidden;
      ">
        <!-- Top Cyber Gradient Strip -->
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #38BDF8, #818CF8, #FFD028);"></div>

        <!-- Header Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #22324F; padding-bottom: 10px; margin-top: 4px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">📜</span>
            <div>
              <h2 id="mission-log-title" style="margin: 0; font-family: 'Space Mono', monospace; font-size: 17px; font-weight: 700; color: #38bdf8; letter-spacing: 0.8px;">MISSION LOG // PROTOCOL ARCHIVE</h2>
              <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; font-weight: 600;">JOHTO & KANTO DISPATCH TELEMETRY</div>
            </div>
          </div>
          <button id="close-mission-log-btn" class="interactive" style="
            background: #141E33;
            border: 1.5px solid #22324F;
            border-radius: 8px;
            color: #e2e8f0;
            font-family: 'Space Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 14px;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 3px 0 0 #070B14;
          ">✕ CLOSE <span class="keyboard-hint">[ESC]</span></button>
        </div>

        <!-- Filter Tabs Row -->
        <div id="mission-tabs-bar" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>

        <!-- Split Pane Body -->
        <div id="mission-split-body" style="display: flex; gap: 16px; flex: 1; min-height: 340px; max-height: 64dvh; overflow: hidden;">
          <!-- Left Master List -->
          <div id="mission-list-pane" style="
            width: 38%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-right: 10px;
            border-right: 1.5px solid #22324F;
          "></div>

          <!-- Right Mission Dossier -->
          <div id="mission-detail-pane" style="
            width: 62%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 4px 6px;
          "></div>
        </div>
      </div>
    `;

    this.container.appendChild(this.modalElement);

    this.tabsBar = this.modalElement.querySelector('#mission-tabs-bar') as HTMLDivElement;
    this.listPane = this.modalElement.querySelector('#mission-list-pane') as HTMLDivElement;
    this.detailPane = this.modalElement.querySelector('#mission-detail-pane') as HTMLDivElement;

    const closeBtn = this.modalElement.querySelector('#close-mission-log-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      BattleAudio.playMenuSound('CANCEL');
      this.hide();
    });
  }

  public isOpen(): boolean {
    return this.modalElement.style.display === 'flex';
  }

  public open(filter: MissionFilter = this.activeFilter): void {
    this.activeFilter = filter;
    this.modalElement.style.display = 'flex';
    this.ensureValidSelection();
    this.render();
  }

  public hide(): void {
    this.modalElement.style.display = 'none';
  }

  public toggle(): void {
    if (this.isOpen()) {
      this.hide();
    } else {
      this.open();
    }
  }

  public selectFilter(filter: MissionFilter): void {
    this.activeFilter = filter;
    this.ensureValidSelection();
    this.render();
  }

  public selectMission(missionId: string): void {
    this.selectedMissionId = missionId;
    this.render();
  }

  private ensureValidSelection(): void {
    const filtered = this.missionManager.getMissions(this.activeFilter);
    if (filtered.length === 0) {
      this.selectedMissionId = null;
      return;
    }
    if (!this.selectedMissionId || !filtered.some((m) => m.id === this.selectedMissionId)) {
      const firstActive = filtered.find((m) => m.status === 'ACTIVE');
      this.selectedMissionId = (firstActive || filtered[0]).id;
    }
  }

  public handleKeyDown(e: KeyboardEvent): void {
    if (!this.isOpen()) return;

    if (e.code === 'Escape' || e.code === 'KeyM' || e.code === 'KeyX') {
      e.preventDefault();
      BattleAudio.playMenuSound('CANCEL');
      this.hide();
      return;
    }

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      const idx = FILTER_TABS.indexOf(this.activeFilter);
      const nextIdx = (idx - 1 + FILTER_TABS.length) % FILTER_TABS.length;
      BattleAudio.playMenuSound('CURSOR');
      this.selectFilter(FILTER_TABS[nextIdx]);
      return;
    }

    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      const idx = FILTER_TABS.indexOf(this.activeFilter);
      const nextIdx = (idx + 1) % FILTER_TABS.length;
      BattleAudio.playMenuSound('CURSOR');
      this.selectFilter(FILTER_TABS[nextIdx]);
      return;
    }

    const filtered = this.missionManager.getMissions(this.activeFilter);
    if (filtered.length === 0) return;

    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      const currentIdx = Math.max(0, filtered.findIndex((m) => m.id === this.selectedMissionId));
      const nextIdx = (currentIdx + 1) % filtered.length;
      BattleAudio.playMenuSound('CURSOR');
      this.selectMission(filtered[nextIdx].id);
      return;
    }

    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      const currentIdx = Math.max(0, filtered.findIndex((m) => m.id === this.selectedMissionId));
      const nextIdx = (currentIdx - 1 + filtered.length) % filtered.length;
      BattleAudio.playMenuSound('CURSOR');
      this.selectMission(filtered[nextIdx].id);
      return;
    }
  }

  public render(): void {
    this.renderTabs();
    this.renderMissionList();
    this.renderMissionDetail();
  }

  private renderTabs(): void {
    const counts: Record<MissionFilter, number> = {
      ALL: this.missionManager.getMissions('ALL').length,
      MAIN: this.missionManager.getMissions('MAIN').length,
      SIDE: this.missionManager.getMissions('SIDE').length,
      COMPLETED: this.missionManager.getMissions('COMPLETED').length,
    };

    this.tabsBar.innerHTML = '';
    for (const tab of FILTER_TABS) {
      const isSelected = this.activeFilter === tab;
      const btn = document.createElement('button');
      btn.id = `mission-tab-${tab.toLowerCase()}`;
      btn.className = 'interactive';
      btn.style.cssText = `
        flex: 1;
        min-width: 110px;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1.5px solid ${isSelected ? '#38bdf8' : '#22324F'};
        background: ${isSelected ? '#1E3A8A' : '#141E33'};
        color: ${isSelected ? '#f8fafc' : '#94a3b8'};
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 4px 0 0 #070B14;
        transition: all 0.12s ease;
      `;
      btn.innerText = `[ ${tab} (${counts[tab]}) ]`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        BattleAudio.playMenuSound('CURSOR');
        this.selectFilter(tab);
      });
      this.tabsBar.appendChild(btn);
    }
  }

  private getStatusBadgeHtml(mission: Mission): string {
    if (mission.status === 'COMPLETED') {
      return `<span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #4ade80; background: rgba(34, 197, 94, 0.16); border: 1.5px solid #4ade80; padding: 2px 8px; border-radius: 999px;">✓ COMPLETED</span>`;
    }
    if (mission.status === 'ACTIVE') {
      return `<span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.16); border: 1.5px solid #38bdf8; padding: 2px 8px; border-radius: 999px;">● ACTIVE</span>`;
    }
    return `<span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #94a3b8; background: #080E1D; border: 1.5px solid #22324F; padding: 2px 8px; border-radius: 999px;">🔒 LOCKED</span>`;
  }

  private renderMissionList(): void {
    const missions = this.missionManager.getMissions(this.activeFilter);
    this.listPane.innerHTML = '';

    if (missions.length === 0) {
      this.listPane.innerHTML = `
        <div style="padding: 24px 12px; text-align: center; color: #64748b; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 600;">
          No missions in this category yet.
        </div>
      `;
      return;
    }

    for (const m of missions) {
      const isSelected = m.id === this.selectedMissionId;
      const card = document.createElement('button');
      card.id = `mission-card-${m.id}`;
      card.className = 'interactive';
      const catColor = m.category === 'MAIN' ? '#facc15' : '#38bdf8';
      const catLabel = m.category === 'MAIN' ? `ACT ${m.act} • MAIN` : `ACT ${m.act} • SIDE`;

      card.style.cssText = `
        width: 100%;
        text-align: left;
        background: ${isSelected ? '#1E3A8A' : '#141E33'};
        border: 1.5px solid ${isSelected ? '#38bdf8' : '#22324F'};
        box-shadow: 0 4px 0 0 #070B14;
        border-radius: 8px;
        padding: 10px 12px;
        color: #f8fafc;
        cursor: pointer;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        gap: 5px;
        opacity: ${m.status === 'LOCKED' ? '0.68' : '1'};
        transition: all 0.12s ease;
        box-sizing: border-box;
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
          <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: ${catColor}; letter-spacing: 0.4px;">[${catLabel}]</span>
          ${this.getStatusBadgeHtml(m)}
        </div>
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 13.5px; font-weight: 700; color: ${isSelected ? '#ffffff' : '#e2e8f0'};">
          ${m.id}: ${m.title}
        </div>
      `;

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        BattleAudio.playMenuSound('CURSOR');
        this.selectMission(m.id);
      });

      this.listPane.appendChild(card);
    }
  }

  private renderMissionDetail(): void {
    const mission = this.selectedMissionId ? this.missionManager.getMission(this.selectedMissionId) : undefined;
    if (!mission) {
      this.detailPane.innerHTML = `
        <div style="padding: 36px; text-align: center; color: #64748b; font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 600;">
          Select a mission from the left panel to view its dossier and objectives.
        </div>
      `;
      return;
    }

    const catTag = mission.category === 'MAIN' ? `ACT ${mission.act} • MAIN STORY` : `ACT ${mission.act} • SIDE QUEST`;
    const catBg = mission.category === 'MAIN' ? 'rgba(250, 204, 21, 0.16)' : 'rgba(56, 189, 248, 0.16)';
    const catBorder = mission.category === 'MAIN' ? 'rgba(250, 204, 21, 0.4)' : 'rgba(56, 189, 248, 0.4)';
    const catColor = mission.category === 'MAIN' ? '#facc15' : '#38bdf8';

    const stepsHtml = mission.steps
      .map((step, idx) => {
        const isCurrent = mission.status === 'ACTIVE' && idx === mission.currentStepIndex && !step.completed;
        const badge = step.completed ? '[✓]' : isCurrent ? '[▶]' : '[ ]';
        const textColor = step.completed ? '#94a3b8' : isCurrent ? '#38bdf8' : '#64748b';
        const textDeco = step.completed ? 'line-through' : 'none';
        const fontWeight = isCurrent ? '700' : '600';
        return `
          <div style="
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 8px;
            background: ${isCurrent ? '#080E1D' : '#141E33'};
            border: 1.5px solid ${isCurrent ? '#38bdf8' : '#22324F'};
            box-shadow: 0 2px 0 0 #070B14;
            color: ${textColor};
            font-size: 12.5px;
            font-weight: ${fontWeight};
          ">
            <span style="font-family: 'Space Mono', monospace; font-weight: 700; min-width: 26px;">${badge}</span>
            <span style="text-decoration: ${textDeco}; line-height: 1.4;">${idx + 1}. ${step.description}</span>
          </div>
        `;
      })
      .join('');

    const rewardsHtml = mission.rewards
      .map(
        (r) => `
          <span style="
            background: #141E33;
            border: 1.5px solid #FFD028;
            color: #fef08a;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(254, 240, 138, 0.15);
          ">${r.label}</span>
        `
      )
      .join('');

    this.detailPane.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div>
          <span style="
            display: inline-block;
            background: ${catBg};
            border: 1px solid ${catBorder};
            color: ${catColor};
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 999px;
            margin-bottom: 6px;
          ">${catTag}</span>
          <h3 id="mission-dossier-title" style="margin: 0; font-family: 'Space Mono', monospace; font-size: 18px; font-weight: 700; color: #f8fafc;">${mission.id}: ${mission.title}</h3>
        </div>
        ${this.getStatusBadgeHtml(mission)}
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 14px; font-family: 'Space Mono', monospace; font-size: 11.5px; color: #cbd5e1; font-weight: 600; background: #080E1D; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #22324F; box-shadow: 0 2px 0 0 #070B14;">
        <span>📍 <strong style="color: #38bdf8;">LOCATION:</strong> ${mission.location}</span>
        <span>👤 <strong style="color: #38bdf8;">GIVER:</strong> ${mission.giver}</span>
      </div>

      <div id="mission-dossier-summary" style="
        background: #080E1D;
        border-left: 3px solid #38bdf8;
        border-top: 1.5px solid #22324F;
        border-right: 1.5px solid #22324F;
        border-bottom: 1.5px solid #22324F;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.5;
        color: #e2e8f0;
      ">
        ${mission.summary}
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px;">
          Objectives Checklist (${mission.steps.filter((s) => s.completed).length}/${mission.steps.length})
        </div>
        <div id="mission-dossier-steps" style="display: flex; flex-direction: column; gap: 6px;">
          ${stepsHtml}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: auto; padding-top: 6px;">
        <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #facc15; text-transform: uppercase; letter-spacing: 0.6px;">
          🎁 Mission Rewards
        </div>
        <div id="mission-dossier-rewards" style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${rewardsHtml}
        </div>
      </div>
    `;
  }
}
