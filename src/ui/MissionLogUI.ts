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
      @media (max-width: 720px), (orientation: portrait) {
        #mission-log-card {
          width: 96vw !important;
          max-height: 90dvh !important;
          padding: 12px !important;
        }
        #mission-split-body {
          flex-direction: column !important;
        }
        #mission-list-pane {
          width: 100% !important;
          max-height: 28dvh !important;
          border-right: none !important;
          border-bottom: 1px solid rgba(56, 189, 248, 0.25) !important;
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
      background: rgba(9, 13, 22, 0.82);
      backdrop-filter: blur(12px);
      z-index: 62;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      font-family: 'Inter', system-ui, sans-serif;
    `;
    this.modalElement.style.pointerEvents = 'auto';

    this.modalElement.innerHTML = `
      <div id="mission-log-card" class="interactive" style="
        width: 820px;
        max-width: 95vw;
        max-height: 86dvh;
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 13, 22, 0.99) 100%);
        border: 2px solid rgba(56, 189, 248, 0.45);
        border-radius: 14px;
        padding: 18px 20px;
        color: #f8fafc;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(56, 189, 248, 0.15);
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-sizing: border-box;
        pointer-events: auto;
      ">
        <!-- Header Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.25); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">📜</span>
            <div>
              <h2 id="mission-log-title" style="margin: 0; font-size: 18px; font-weight: 900; color: #38bdf8; letter-spacing: 0.6px;">MISSION LOG</h2>
              <div style="font-size: 11px; color: #94a3b8; font-weight: 600;">JOHTO & KANTO QUEST ARCHIVE</div>
            </div>
          </div>
          <button id="close-mission-log-btn" class="interactive" style="
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 12px;
            font-weight: 800;
            padding: 6px 12px;
            cursor: pointer;
            pointer-events: auto;
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
            border-right: 1px solid rgba(56, 189, 248, 0.22);
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
        border: 1.5px solid ${isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'};
        background: ${isSelected ? 'rgba(2, 132, 199, 0.35)' : '#1e293b'};
        color: ${isSelected ? '#f8fafc' : '#94a3b8'};
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        pointer-events: auto;
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
      return `<span style="font-size: 10px; font-weight: 800; color: #4ade80; background: rgba(34, 197, 94, 0.16); border: 1px solid rgba(74, 222, 128, 0.4); padding: 2px 6px; border-radius: 999px;">✓ COMPLETED</span>`;
    }
    if (mission.status === 'ACTIVE') {
      return `<span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.45); padding: 2px 6px; border-radius: 999px;">● ACTIVE</span>`;
    }
    return `<span style="font-size: 10px; font-weight: 800; color: #94a3b8; background: rgba(51, 65, 85, 0.55); border: 1px solid rgba(148, 163, 184, 0.25); padding: 2px 6px; border-radius: 999px;">🔒 LOCKED</span>`;
  }

  private renderMissionList(): void {
    const missions = this.missionManager.getMissions(this.activeFilter);
    this.listPane.innerHTML = '';

    if (missions.length === 0) {
      this.listPane.innerHTML = `
        <div style="padding: 24px 12px; text-align: center; color: #64748b; font-size: 13px; font-weight: 600;">
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
        background: ${isSelected ? 'rgba(30, 58, 138, 0.55)' : 'rgba(30, 41, 59, 0.78)'};
        border: 1.5px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'};
        border-radius: 10px;
        padding: 10px 12px;
        color: #f8fafc;
        cursor: pointer;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        gap: 5px;
        opacity: ${m.status === 'LOCKED' ? '0.68' : '1'};
        transition: all 0.12s ease;
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
          <span style="font-size: 10px; font-weight: 800; color: ${catColor}; letter-spacing: 0.4px;">[${catLabel}]</span>
          ${this.getStatusBadgeHtml(m)}
        </div>
        <div style="font-size: 14px; font-weight: 800; color: ${isSelected ? '#ffffff' : '#e2e8f0'};">
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
        <div style="padding: 36px; text-align: center; color: #64748b; font-size: 14px; font-weight: 600;">
          Select a mission from the left panel to view its dossier and objectives.
        </div>
      `;
      return;
    }

    const catTag = mission.category === 'MAIN' ? `ACT ${mission.act} • MAIN STORY` : `ACT ${mission.act} • SIDE QUEST`;
    const catBg = mission.category === 'MAIN' ? 'rgba(250, 204, 21, 0.18)' : 'rgba(56, 189, 248, 0.18)';
    const catColor = mission.category === 'MAIN' ? '#facc15' : '#38bdf8';

    const stepsHtml = mission.steps
      .map((step, idx) => {
        const isCurrent = mission.status === 'ACTIVE' && idx === mission.currentStepIndex && !step.completed;
        const badge = step.completed ? '[✓]' : isCurrent ? '[▶]' : '[ ]';
        const textColor = step.completed ? '#94a3b8' : isCurrent ? '#38bdf8' : '#64748b';
        const textDeco = step.completed ? 'line-through' : 'none';
        const fontWeight = isCurrent ? '800' : '600';
        return `
          <div style="
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 7px 10px;
            border-radius: 8px;
            background: ${isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.55)'};
            border: 1px solid ${isCurrent ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.06)'};
            color: ${textColor};
            font-size: 13px;
            font-weight: ${fontWeight};
          ">
            <span style="font-family: monospace; font-weight: 900; min-width: 26px;">${badge}</span>
            <span style="text-decoration: ${textDeco}; line-height: 1.4;">${idx + 1}. ${step.description}</span>
          </div>
        `;
      })
      .join('');

    const rewardsHtml = mission.rewards
      .map(
        (r) => `
          <span style="
            background: rgba(30, 41, 59, 0.92);
            border: 1px solid rgba(250, 204, 21, 0.4);
            color: #fef08a;
            font-size: 12px;
            font-weight: 800;
            padding: 5px 10px;
            border-radius: 999px;
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
            color: ${catColor};
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
            margin-bottom: 6px;
          ">${catTag}</span>
          <h3 id="mission-dossier-title" style="margin: 0; font-size: 19px; font-weight: 900; color: #f8fafc;">
            ${mission.id}: ${mission.title}
          </h3>
        </div>
        ${this.getStatusBadgeHtml(mission)}
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #cbd5e1; font-weight: 700; background: rgba(30, 41, 59, 0.65); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
        <span>📍 <strong>Location:</strong> ${mission.location}</span>
        <span>👤 <strong>Giver:</strong> ${mission.giver}</span>
      </div>

      <div id="mission-dossier-summary" style="
        background: rgba(15, 23, 42, 0.75);
        border-left: 3px solid #38bdf8;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.5;
        color: #e2e8f0;
      ">
        ${mission.summary}
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px;">
          Objectives Checklist (${mission.steps.filter((s) => s.completed).length}/${mission.steps.length})
        </div>
        <div id="mission-dossier-steps" style="display: flex; flex-direction: column; gap: 6px;">
          ${stepsHtml}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: auto; padding-top: 6px;">
        <div style="font-size: 11px; font-weight: 800; color: #facc15; text-transform: uppercase; letter-spacing: 0.6px;">
          🎁 Mission Rewards
        </div>
        <div id="mission-dossier-rewards" style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${rewardsHtml}
        </div>
      </div>
    `;
  }
}
